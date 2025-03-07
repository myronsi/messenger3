
import React, { useRef, useState } from "react";
import { useUserSearch } from "@/hooks/useUserSearch";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

interface UserSearchProps {
  onUserSelect: (userId: number, username: string) => void;
  placeholder?: string;
}

export function UserSearch({ onUserSelect, placeholder = "Search users..." }: UserSearchProps) {
  const searchRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const {
    query,
    results,
    isLoading,
    selectedIndex,
    handleQueryChange,
    handleKeyDown,
    setSelectedIndex,
    setResults
  } = useUserSearch();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleQueryChange(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const user = handleKeyDown(e);
    if (user) {
      onUserSelect(user.id, user.username);
      handleQueryChange("");
    }
  };

  const handleSelectUser = (userId: number, username: string) => {
    onUserSelect(userId, username);
    handleQueryChange("");
    setResults([]);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setResults([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setResults]);

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setIsFocused(true)}
          className="w-full"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {isFocused && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg">
          <ul className="py-1 text-sm">
            {results.map((user, index) => (
              <li
                key={user.id}
                className={`flex items-center px-3 py-2 cursor-pointer hover:bg-muted ${
                  index === selectedIndex ? "bg-muted" : ""
                }`}
                onClick={() => handleSelectUser(user.id, user.username)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <Avatar className="h-8 w-8 mr-2">
                  <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                </Avatar>
                <div>
                  <div className="font-medium">{user.username}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isFocused && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-background p-2 shadow-lg">
          <p className="text-sm text-muted-foreground">No users found</p>
        </div>
      )}
    </div>
  );
}
