
import { useState, useEffect, useCallback } from "react";
import { useToast } from "./use-toast";

interface User {
  id: number;
  username: string;
  email: string;
}

export const useUserSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const searchUsers = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery || searchQuery.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Не авторизован");
        }

        // Validate query length before sending to backend
        if (searchQuery.length > 50) {
          searchQuery = searchQuery.substring(0, 50);
        }

        const response = await fetch(
          `/api/users/search/?query=${encodeURIComponent(searchQuery)}&limit=10`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Ошибка поиска пользователей");
        }

        const data = await response.json();
        setResults(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Неизвестная ошибка";
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Ошибка поиска",
          description: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        searchUsers(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchUsers]);

  return { query, setQuery, results, isLoading, error };
};

export default useUserSearch;
