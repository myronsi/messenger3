
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { Button } from "@/components/ui/button";
import { ChatSidebar } from "@/components/ChatSidebar";
import { MessageList } from "@/components/MessageList";
import { MessageInput } from "@/components/MessageInput";
import { Spinner } from "@/components/ui/spinner";

export default function Chat() {
  const { user, isAuthenticated, logout } = useAuth();
  const { currentChat, isLoading } = useChat();
  const navigate = useNavigate();

  // Перенаправление неавторизованных пользователей
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col">
      <header className="flex items-center justify-between border-b bg-white px-4 py-2 shadow-sm">
        <h1 className="text-xl font-semibold">Messaging App</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">{user?.username}</span>
          <Button variant="outline" size="sm" onClick={logout}>
            Выйти
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <ChatSidebar />

        {currentChat ? (
          <div className="flex flex-1 flex-col">
            <div className="border-b bg-white p-4 shadow-sm">
              <h2 className="text-lg font-medium">{currentChat.name}</h2>
              <p className="text-sm text-gray-500">
                {currentChat.participants.length} участников
              </p>
            </div>

            <div className="flex flex-1 flex-col overflow-hidden p-4">
              <MessageList />
              <MessageInput />
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <h2 className="mb-2 text-xl font-semibold">Выберите чат</h2>
              <p className="text-gray-600">
                Выберите существующий чат или создайте новый
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
