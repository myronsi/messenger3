
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface UserSearchResult {
  id: number;
  username: string;
  email: string;
}

export function useUserSearch() {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      // Clean up any ongoing requests when unmounting
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Reset selected index when results change
    setSelectedIndex(-1);
  }, [results]);

  const searchUsers = async (searchQuery: string) => {
    // Don't search if query is too short
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    // Validate query length
    if (searchQuery.length > 50) {
      toast({
        variant: "destructive",
        title: "Ошибка поиска",
        description: "Поисковый запрос слишком длинный (макс. 50 символов)",
      });
      return;
    }

    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create a new abort controller for this request
    abortControllerRef.current = new AbortController();
    setIsLoading(true);

    try {
      // Sanitize the query by encoding it
      const sanitizedQuery = encodeURIComponent(searchQuery);
      
      // Get the token from localStorage
      const token = localStorage.getItem("token") || "";
      
      const response = await fetch(`/api/users/search/?query=${sanitizedQuery}&limit=10`, {
        headers: {
          "Authorization": `Bearer ${token}`
        },
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error("Ошибка при поиске пользователей");
      }

      const data = await response.json();
      setResults(data);
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Search error:", error);
        toast({
          variant: "destructive",
          title: "Ошибка поиска",
          description: "Не удалось выполнить поиск пользователей",
        });
      }
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    
    // Debounce search request to avoid too many API calls
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      searchUsers(value);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return null;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          return results[selectedIndex];
        }
        break;
      case "Escape":
        e.preventDefault();
        setResults([]);
        break;
      default:
        break;
    }
    return null;
  };

  return {
    query,
    results,
    isLoading,
    selectedIndex,
    handleQueryChange,
    handleKeyDown,
    setSelectedIndex,
    setResults
  };
}
