
import { useState } from "react";
import { useChat } from "@/contexts/ChatContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function MessageInput() {
  const [message, setMessage] = useState("");
  const { sendMessage, currentChat } = useChat();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!message.trim() || !currentChat) return;
    
    sendMessage(message);
    setMessage("");
  }

  if (!currentChat) return null;

  return (
    <form className="mt-4 flex gap-2" onSubmit={handleSubmit}>
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Введите сообщение..."
        className="flex-1"
      />
      <Button type="submit" disabled={!message.trim()}>
        Отправить
      </Button>
    </form>
  );
}
