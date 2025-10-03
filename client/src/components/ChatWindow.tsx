import { useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import BlockchainStatus from "./BlockchainStatus";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import EmptyState from "./EmptyState";
import emptyChat from '@assets/generated_images/Empty_chat_state_illustration_c6fb06b5.png';

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isSender: boolean;
  blockNumber?: number;
  isDelivered?: boolean;
  isRead?: boolean;
}

interface ChatWindowProps {
  contactName?: string;
  messages: Message[];
  blockCount: number;
  onSendMessage: (message: string) => void;
  onToggleSidebar?: () => void;
}

export default function ChatWindow({
  contactName,
  messages,
  blockCount,
  onSendMessage,
  onToggleSidebar,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initials = contactName
    ? contactName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  if (!contactName) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 h-16 border-b border-border flex items-center px-4 bg-card/30 backdrop-blur-xl">
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleSidebar}
            className="mr-2 md:hidden"
            data-testid="button-toggle-sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <BlockchainStatus blockCount={blockCount} isValid={true} />
        </div>
        <EmptyState
          image={emptyChat}
          title="No conversation selected"
          description="Choose a contact from the sidebar to start messaging with blockchain security"
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" data-testid="chat-window">
      <div className="flex-shrink-0 h-16 border-b border-border flex items-center justify-between px-4 bg-card/30 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleSidebar}
            className="mr-2 md:hidden"
            data-testid="button-toggle-sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/20 text-primary font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-sm" data-testid="text-contact-name">{contactName}</h2>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>
        <BlockchainStatus blockCount={blockCount} isValid={true} />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <EmptyState
            image={emptyChat}
            title="Start the conversation"
            description="Send your first encrypted message on the blockchain"
          />
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} {...message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <ChatInput onSendMessage={onSendMessage} />
    </div>
  );
}
