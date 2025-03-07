
import { useState, useEffect, useCallback, useContext, createContext, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { getCookie } from "../../client/src/contexts/ChatContext"

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  const loadUser = useCallback(async () => {
    const token = getCookie('token') || '';
    
    if (!token) {
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch("/api/users/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token is invalid or expired
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error("Failed to load user:", error);
      localStorage.removeItem("token");
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadUser();
  }, [loadUser]);
  
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.access_token);
        await loadUser();
        toast({
          title: "Успешный вход",
          description: "Добро пожаловать!",
        });
        return true;
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Ошибка входа",
          description: error.detail || "Неверный email или пароль",
        });
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Ошибка соединения",
        description: "Не удалось подключиться к серверу",
      });
      return false;
    }
  };
  
  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, email, password })
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.access_token);
        await loadUser();
        toast({
          title: "Регистрация успешна",
          description: "Ваш аккаунт создан",
        });
        return true;
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Ошибка регистрации",
          description: error.detail || "Не удалось создать аккаунт",
        });
        return false;
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        variant: "destructive",
        title: "Ошибка соединения",
        description: "Не удалось подключиться к серверу",
      });
      return false;
    }
  };
  
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    toast({
      title: "Выход выполнен",
      description: "Вы успешно вышли из аккаунта",
    });
  };
  
  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
