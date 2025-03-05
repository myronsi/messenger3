
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        navigate("/chat");
      }
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogin = () => {
    navigate("/login");
  };

  const handleRegister = () => {
    navigate("/register");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            Чат в реальном времени
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Обменивайтесь сообщениями с друзьями и коллегами
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex flex-col space-y-4">
            <Button 
              onClick={handleLogin} 
              className="w-full" 
              size="lg"
            >
              Войти
            </Button>
            <Button 
              onClick={handleRegister} 
              variant="outline" 
              className="w-full" 
              size="lg"
            >
              Зарегистрироваться
            </Button>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Это приложение демонстрирует возможности WebSocket для обмена сообщениями в реальном времени.
            Используются: TypeScript, React, FastAPI, SQLAlchemy и WebSockets.
          </p>
        </div>
      </div>

      {/* Информационный диалог для первого визита */}
      <Dialog defaultOpen={!localStorage.getItem("visited")}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добро пожаловать в чат-приложение!</DialogTitle>
            <DialogDescription>
              Это простой, но мощный чат, построенный с использованием современных технологий:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Реальный обмен сообщениями через WebSockets</li>
                <li>Безопасная аутентификация с JWT-токенами</li>
                <li>Адаптивный интерфейс с Tailwind CSS</li>
                <li>Бэкенд на FastAPI с SQLite и SQLAlchemy</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => {
              localStorage.setItem("visited", "true");
              document.querySelector("[data-radix-dialog-close]")?.dispatchEvent(
                new MouseEvent("click", { bubbles: true })
              );
            }}>
              Начать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
