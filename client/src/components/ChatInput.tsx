import { useState } from "react";
import { Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function ChatInput({
  onSendMessage,
  disabled = false,
  className,
}: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex items-center gap-2 p-4 border-t border-border bg-card/50 backdrop-blur-xl",
        className
      )}
      data-testid="form-chat-input"
    >
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => console.log("Attach file")}
        data-testid="button-attach"
      >
        <Paperclip className="h-5 w-5" />
      </Button>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        disabled={disabled}
        className="flex-1 bg-background border border-input rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
        data-testid="input-message"
      />
      <Button
        type="submit"
        size="icon"
        disabled={!message.trim() || disabled}
        className="rounded-full hover-elevate active-elevate-2"
        data-testid="button-send"
      >
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
}
