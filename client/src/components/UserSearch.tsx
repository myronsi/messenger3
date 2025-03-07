
import { useState, useEffect, useRef } from "react";
import { useUserSearch } from "../hooks/useUserSearch";
import { Avatar } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";
import { Input } from "./ui/input";
import { User } from "lucide-react";

// Export the UserSearchResult type to fix the build error
export interface UserSearchResult {
  id: number;
  username: string;
  email: string;
}

interface UserSearchProps {
  onSelectUser: (user: UserSearchResult) => void;
  placeholder?: string;
}

export const UserSearch = ({ onSelectUser, placeholder = "Найти пользователей..." }: UserSearchProps) => {
  const { query, setQuery, results, isLoading } = useUserSearch();
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsDropdownVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Show dropdown when typing
  useEffect(() => {
    if (query.length >= 2) {
      setIsDropdownVisible(true);
    } else {
      setIsDropdownVisible(false);
    }
  }, [query]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownVisible || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectUser(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsDropdownVisible(false);
    }
  };

  const handleSelectUser = (user: UserSearchResult) => {
    onSelectUser(user);
    setQuery("");
    setIsDropdownVisible(false);
    inputRef.current?.blur();
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => query.length >= 2 && setIsDropdownVisible(true)}
        className="w-full"
      />

      {isDropdownVisible && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg max-h-60 overflow-auto border border-gray-200 dark:border-gray-700">
          {isLoading ? (
            <div className="p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2 p-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            results.map((user, index) => (
              <div
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className={`flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  index === selectedIndex ? "bg-gray-100 dark:bg-gray-700" : ""
                }`}
              >
                <Avatar className="h-8 w-8">
                  <User className="h-5 w-5" />
                </Avatar>
                <div>
                  <div className="font-medium">{user.username}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </div>
            ))
          ) : query.length >= 2 ? (
            <div className="p-3 text-center text-gray-500">Ничего не найдено</div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default UserSearch;
