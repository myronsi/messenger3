
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserSearch, UserSearchResult } from "@/components/UserSearch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export function NewChat() {
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCreateChat = async () => {
    if (!selectedUser) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Выберите пользователя для создания чата",
      });
      return;
    }

    try {
      const response = await fetch("/api/chats/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          user_ids: [selectedUser.id]
        })
      });

      if (!response.ok) {
        throw new Error("Не удалось создать чат");
      }

      const chatData = await response.json();
      toast({
        title: "Чат создан",
        description: `Чат с ${selectedUser.username} успешно создан`,
      });
      
      // Navigate to the new chat
      navigate(`/chat/${chatData.id}`);
      
    } catch (error) {
      console.error("Error creating chat:", error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось создать чат с выбранным пользователем",
      });
    }
  };

  const handleUserSelect = (user: UserSearchResult) => {
    setSelectedUser(user);
  };

  return (
    <div className="container mx-auto max-w-md p-6">
      <h1 className="mb-6 text-2xl font-bold">Новый чат</h1>
      
      <div className="space-y-4">
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium">
            Найдите пользователя для начала чата
          </label>
          <UserSearch onUserSelect={handleUserSelect} />
        </div>

        {selectedUser && (
          <div className="rounded-md bg-gray-50 p-4">
            <h3 className="text-lg font-medium">Выбранный пользователь:</h3>
            <div className="mt-2 flex items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                {selectedUser.username.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <div className="font-medium">{selectedUser.username}</div>
                <div className="text-sm text-gray-500">{selectedUser.email}</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Отмена
          </Button>
          <Button 
            onClick={handleCreateChat} 
            disabled={!selectedUser}
          >
            Создать чат
          </Button>
        </div>
      </div>
    </div>
  );
}
