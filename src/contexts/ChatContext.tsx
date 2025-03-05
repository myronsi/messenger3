
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";

interface Message {
  id: number;
  content: string;
  sender_id: number;
  chat_id: number;
  created_at: string;
  sender: {
    id: number;
    username: string;
  };
}

interface Chat {
  id: number;
  name: string;
  created_at: string;
  participants: {
    id: number;
    username: string;
  }[];
  last_message?: Message;
}

interface OnlineUser {
  user_id: number;
  username: string;
}

interface ChatContextType {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  onlineUsers: OnlineUser[];
  isLoading: boolean;
  sendMessage: (content: string) => void;
  setCurrentChat: (chat: Chat) => void;
  createChat: (name: string, participantIds: number[]) => Promise<void>;
  fetchChats: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Инициализация WebSocket соединения
  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem("token");
      
      if (!token) return;
      
      const ws = new WebSocket(`ws://localhost:8000/ws?token=${token}`);
      
      ws.onopen = () => {
        console.log("WebSocket connected");
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === "message") {
          handleNewMessage(data.message);
        } else if (data.type === "online_users") {
          setOnlineUsers(data.users);
        }
      };
      
      ws.onclose = () => {
        console.log("WebSocket disconnected");
      };
      
      setSocket(ws);
      
      return () => {
        ws.close();
      };
    }
  }, [isAuthenticated, user]);

  // Обработка новых сообщений
  function handleNewMessage(message: Message) {
    // Добавляем сообщение в список, если оно относится к текущему чату
    if (currentChat && message.chat_id === currentChat.id) {
      setMessages(prev => [...prev, message]);
    }
    
    // Обновляем последнее сообщение в списке чатов
    setChats(prev => 
      prev.map(chat => 
        chat.id === message.chat_id 
          ? { ...chat, last_message: message } 
          : chat
      )
    );
  }

  // Получение списка чатов
  async function fetchChats() {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    const token = localStorage.getItem("token");
    
    try {
      const response = await fetch("http://localhost:8000/api/chats", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch chats");
      }
      
      const data = await response.json();
      setChats(data);
      
      // Если есть чаты и нет выбранного чата, выбираем первый
      if (data.length > 0 && !currentChat) {
        setCurrentChat(data[0]);
        fetchMessages(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // Получение сообщений для выбранного чата
  async function fetchMessages(chatId: number) {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    const token = localStorage.getItem("token");
    
    try {
      const response = await fetch(`http://localhost:8000/api/messages?chat_id=${chatId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // Обработка выбора чата
  function handleSetCurrentChat(chat: Chat) {
    setCurrentChat(chat);
    fetchMessages(chat.id);
  }

  // Отправка сообщения
  function sendMessage(content: string) {
    if (!socket || !currentChat || !user) return;
    
    const message = {
      type: "send_message",
      data: {
        chat_id: currentChat.id,
        content
      }
    };
    
    socket.send(JSON.stringify(message));
  }

  // Создание нового чата
  async function createChat(name: string, participantIds: number[]) {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    const token = localStorage.getItem("token");
    
    try {
      const response = await fetch("http://localhost:8000/api/chats", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          participant_ids: participantIds
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to create chat");
      }
      
      // Обновляем список чатов
      await fetchChats();
    } catch (error) {
      console.error("Error creating chat:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  // Загружаем список чатов при авторизации
  useEffect(() => {
    if (isAuthenticated) {
      fetchChats();
    }
  }, [isAuthenticated]);

  const value = {
    chats,
    currentChat,
    messages,
    onlineUsers,
    isLoading,
    sendMessage,
    setCurrentChat: handleSetCurrentChat,
    createChat,
    fetchChats
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
