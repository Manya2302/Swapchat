import { useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import ChatWindow from "@/components/ChatWindow";
import LedgerViewer from "@/components/LedgerViewer";

interface Contact {
  id: string;
  name: string;
  lastMessage?: string;
  timestamp?: string;
  unreadCount?: number;
  isOnline?: boolean;
}

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isSender: boolean;
  blockNumber?: number;
  isDelivered?: boolean;
  isRead?: boolean;
}

export default function Home() {
  const [activeView, setActiveView] = useState<"chat" | "ledger">("chat");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeContactId, setActiveContactId] = useState<string | undefined>();

  const [contacts] = useState<Contact[]>([
    {
      id: "1",
      name: "Alice Chen",
      lastMessage: "The blockchain is synced!",
      timestamp: "2m",
      unreadCount: 3,
      isOnline: true,
    },
    {
      id: "2",
      name: "Bob Smith",
      lastMessage: "Thanks for the encrypted message",
      timestamp: "1h",
      isOnline: false,
    },
    {
      id: "3",
      name: "Carol Johnson",
      lastMessage: "See you tomorrow!",
      timestamp: "3h",
      isOnline: true,
    },
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hey! How does blockchain messaging work?",
      timestamp: "10:30 AM",
      isSender: false,
      blockNumber: 42,
    },
    {
      id: "2",
      content:
        "Each message becomes a block in the chain, cryptographically linked to the previous one. It's tamper-proof!",
      timestamp: "10:31 AM",
      isSender: true,
      blockNumber: 43,
      isDelivered: true,
      isRead: true,
    },
  ]);

  const [blockchain] = useState([
    {
      index: 0,
      hash: "0000000000000000000000000000000000000000000000000000000000000000",
      prevHash: "0",
      timestamp: "2025-01-01 00:00:00",
      from: "system",
      to: "all",
      payload: "Genesis Block",
    },
    {
      index: 1,
      hash: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
      prevHash: "0000000000000000000000000000000000000000000000000000000000000000",
      timestamp: "2025-01-01 10:30:15",
      from: "alice",
      to: "user",
      payload: "Hey! How does blockchain messaging work?",
    },
    {
      index: 2,
      hash: "f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2d3c4b5a6f1e2",
      prevHash: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
      timestamp: "2025-01-01 10:31:42",
      from: "user",
      to: "alice",
      payload:
        "Each message becomes a block in the chain, cryptographically linked to the previous one.",
    },
  ]);

  const activeContact = contacts.find((c) => c.id === activeContactId);

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: String(messages.length + 1),
      content,
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isSender: true,
      blockNumber: blockchain.length,
      isDelivered: true,
      isRead: false,
    };
    setMessages([...messages, newMessage]);
    console.log("Message sent:", content);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div
        className={`${
          isSidebarOpen ? "w-80" : "w-0"
        } flex-shrink-0 transition-all duration-300 overflow-hidden md:w-80`}
      >
        <AppSidebar
          contacts={contacts}
          activeContactId={activeContactId}
          onSelectContact={(id) => {
            setActiveContactId(id);
            setActiveView("chat");
            setIsSidebarOpen(false);
          }}
          onViewLedger={() => {
            setActiveView("ledger");
            setIsSidebarOpen(false);
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        {activeView === "chat" ? (
          <ChatWindow
            contactName={activeContact?.name}
            messages={activeContactId === activeContact?.id ? messages : []}
            blockCount={blockchain.length - 1}
            onSendMessage={handleSendMessage}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        ) : (
          <LedgerViewer blocks={blockchain} isValid={true} />
        )}
      </div>
    </div>
  );
}
