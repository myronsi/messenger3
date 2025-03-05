
import { useState } from "react";
import { useChat } from "@/contexts/ChatContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export function ChatSidebar() {
  const { chats, currentChat, setCurrentChat, onlineUsers, createChat, isLoading } = useChat();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // Обработчик создания нового чата
  async function handleCreateChat(e: React.FormEvent) {
    e.preventDefault();
    
    if (!newChatName.trim()) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Введите название чата",
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Пока что создаем групповой чат без других участников
      await createChat(newChatName, []);
      setNewChatName("");
      setIsDialogOpen(false);
      toast({
        title: "Чат создан",
        description: `Чат "${newChatName}" успешно создан`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось создать чат",
      });
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="h-full w-80 flex-shrink-0 border-r bg-gray-50">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-semibold">Чаты</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Новый чат</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать новый чат</DialogTitle>
              <DialogDescription>
                Введите название для нового чата
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateChat}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="chatName" className="text-sm font-medium">
                    Название чата
                  </label>
                  <Input
                    id="chatName"
                    value={newChatName}
                    onChange={(e) => setNewChatName(e.target.value)}
                    placeholder="Введите название чата"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? <Spinner className="mr-2 h-4 w-4" /> : null}
                  Создать
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="h-[calc(100%-8rem)] overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner className="h-6 w-6" />
          </div>
        ) : chats.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-4 text-center">
            <p className="mb-4 text-gray-500">У вас пока нет активных чатов</p>
            <Button size="sm" onClick={() => setIsDialogOpen(true)}>
              Создать первый чат
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {chats.map((chat) => (
              <button
                key={chat.id}
                className={`w-full rounded-lg p-3 text-left transition-colors ${
                  currentChat?.id === chat.id
                    ? "bg-blue-100"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => setCurrentChat(chat)}
              >
                <div className="flex justify-between">
                  <span className="font-medium">{chat.name}</span>
                </div>
                {chat.last_message && (
                  <p className="mt-1 text-sm text-gray-600 line-clamp-1">
                    {chat.last_message.sender.username}: {chat.last_message.content}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t p-4">
        <h3 className="mb-2 text-sm font-medium text-gray-500">Пользователи онлайн</h3>
        <div className="max-h-32 overflow-y-auto">
          {onlineUsers.length === 0 ? (
            <p className="text-sm text-gray-500">Нет пользователей онлайн</p>
          ) : (
            <ul className="space-y-1">
              {onlineUsers.map((user) => (
                <li key={user.user_id} className="flex items-center">
                  <span className="mr-2 h-2 w-2 rounded-full bg-green-500"></span>
                  <span className="text-sm">{user.username}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
