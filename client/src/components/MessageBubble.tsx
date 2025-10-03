import { Lock, Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  content: string;
  timestamp: string;
  isSender: boolean;
  blockNumber?: number;
  isEncrypted?: boolean;
  isDelivered?: boolean;
  isRead?: boolean;
}

export default function MessageBubble({
  content,
  timestamp,
  isSender,
  blockNumber,
  isEncrypted = true,
  isDelivered = true,
  isRead = false,
}: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex w-full mb-3",
        isSender ? "justify-end" : "justify-start"
      )}
      data-testid={`message-${isSender ? 'sent' : 'received'}`}
    >
      <div
        className={cn(
          "max-w-md rounded-2xl p-4 backdrop-blur-xl relative",
          isSender
            ? "bg-primary/10 border border-primary/20"
            : "bg-card border border-card-border"
        )}
      >
        <div className="flex items-start gap-2 mb-1">
          {isEncrypted && (
            <Lock className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" data-testid="icon-encrypted" />
          )}
          <p className="text-sm leading-relaxed break-words">{content}</p>
        </div>
        <div className="flex items-center justify-between gap-3 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{timestamp}</span>
            {blockNumber !== undefined && (
              <button
                onClick={() => console.log(`View block #${blockNumber}`)}
                className="text-xs font-mono text-accent hover:text-accent-foreground transition-colors"
                data-testid={`link-block-${blockNumber}`}
              >
                #{blockNumber}
              </button>
            )}
          </div>
          {isSender && (
            <div className="flex-shrink-0">
              {isRead ? (
                <CheckCheck className="h-3.5 w-3.5 text-accent" data-testid="icon-read" />
              ) : isDelivered ? (
                <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" data-testid="icon-delivered" />
              ) : (
                <Check className="h-3.5 w-3.5 text-muted-foreground" data-testid="icon-sent" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
