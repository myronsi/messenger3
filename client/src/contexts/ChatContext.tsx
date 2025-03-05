
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { API_URL, WS_URL } from '../config';

interface Message {
  id: number;
  chatId: number;
  senderId: number;
  content: string;
  createdAt: string;
  read: boolean;
}

interface Chat {
  id: number;
  name: string;
  isGroup: boolean;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  isOnline?: boolean;
}

interface ChatContextType {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  isLoading: boolean;
  onlineUsers: number[];
  selectChat: (chatId: number) => void;
  sendMessage: (content: string) => void;
  createChat: (userIds: number[]) => Promise<void>;
  fetchHistory: (chatId: number, page?: number) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);

  // Set up WebSocket connection
  const setupWebSocket = useCallback(() => {
    if (!isAuthenticated || !user) return;

    const ws = new WebSocket(`${WS_URL}/ws?token=${encodeURIComponent(document.cookie.replace(/(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/, "$1"))}`);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      // Clear reconnect timer if connection is successful
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      
      // Send a heartbeat every 30 seconds
      const heartbeatInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'heartbeat' }));
        }
      }, 30000);
      
      // Store the interval ID to clear it when the connection closes
      socketRef.current = ws;
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'message':
          handleNewMessage(data.message);
          break;
        case 'status':
          handleStatusUpdate(data.userId, data.isOnline);
          break;
        case 'chat_created':
          fetchChats();
          break;
        case 'user_typing':
          // Handle typing indicator (could be implemented later)
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected, attempting to reconnect...');
      // Attempt to reconnect after 3 seconds
      reconnectTimerRef.current = window.setTimeout(() => {
        setupWebSocket();
      }, 3000);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      ws.close();
    };
    
    return () => {
      ws.close();
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchChats();
      const cleanup = setupWebSocket();
      return cleanup;
    }
  }, [isAuthenticated, setupWebSocket]);

  const fetchChats = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/chats`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch chats');
      
      const data = await response.json();
      setChats(data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async (chatId: number, page = 1) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/chats/${chatId}/messages?page=${page}`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const data = await response.json();
      
      if (page === 1) {
        setMessages(data);
      } else {
        // Prepend older messages
        setMessages(prev => [...data, ...prev]);
      }
      
      // Mark messages as read
      if (data.length > 0 && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'mark_read',
          chatId
        }));
        
        // Update unread count in chat list
        setChats(prevChats => 
          prevChats.map(chat => 
            chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
          )
        );
      }
    } catch (error) {
      console.error('Error fetching message history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectChat = (chatId: number) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChat(chat);
      fetchHistory(chatId);
    }
  };

  const sendMessage = (content: string) => {
    if (!currentChat || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }
    
    const message = {
      type: 'message',
      chatId: currentChat.id,
      content
    };
    
    socketRef.current.send(JSON.stringify(message));
  };

  const createChat = async (userIds: number[]) => {
    if (!user) return;
    
    try {
      const isGroup = userIds.length > 1;
      const response = await fetch(`${API_URL}/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: isGroup ? 'Group Chat' : null,
          isGroup,
          participantIds: [...userIds, user.id]
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create chat');
      
      const newChat = await response.json();
      setChats(prev => [...prev, newChat]);
      setCurrentChat(newChat);
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  };

  const handleNewMessage = (message: Message) => {
    // Add message to the current chat if it belongs there
    if (currentChat && message.chatId === currentChat.id) {
      setMessages(prev => [...prev, message]);
    }
    
    // Update the chat list with new last message
    setChats(prevChats => 
      prevChats.map(chat => {
        if (chat.id === message.chatId) {
          const isCurrentChat = currentChat?.id === chat.id;
          return {
            ...chat,
            lastMessage: message,
            unreadCount: isCurrentChat ? 0 : chat.unreadCount + 1
          };
        }
        return chat;
      })
    );
  };

  const handleStatusUpdate = (userId: number, isOnline: boolean) => {
    // Update online users list
    if (isOnline) {
      setOnlineUsers(prev => [...prev, userId]);
    } else {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    }
    
    // Update user status in chats
    setChats(prevChats => 
      prevChats.map(chat => ({
        ...chat,
        participants: chat.participants.map(p => 
          p.id === userId ? { ...p, isOnline } : p
        )
      }))
    );
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        currentChat,
        messages,
        isLoading,
        onlineUsers,
        selectChat,
        sendMessage,
        createChat,
        fetchHistory
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
