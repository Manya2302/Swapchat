import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import AppSidebar from "@/components/AppSidebar";
import ChatWindow from "@/components/ChatWindow";
import LedgerViewer from "@/components/LedgerViewer";
import naclUtil from "tweetnacl-util";
import nacl from "tweetnacl";

interface HomeProps {
  onLogout: () => void;
}

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

interface Block {
  index: number;
  hash: string;
  prevHash: string;
  timestamp: string;
  from: string;
  to: string;
  payload: string;
}

export default function Home({ onLogout }: HomeProps) {
  const [activeView, setActiveView] = useState<"chat" | "ledger">("chat");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeContactId, setActiveContactId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const socketRef = useRef<Socket | null>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  const { data: contacts = [], refetch: refetchContacts } = useQuery<Contact[]>({
    queryKey: ['/api/users/contacts'],
    enabled: !!token,
  });

  const { data: blockchain = [], refetch: refetchBlockchain } = useQuery<Block[]>({
    queryKey: ['/api/blockchain/ledger'],
    enabled: !!token,
  });

  useEffect(() => {
    if (!token) return;

    const socket = io({
      auth: { token },
      forceNew: true,
    });

    socketRef.current = socket;

    socket.on('connected', (data) => {
      console.log('Connected to chat:', data);
    });

    socket.on('receive-message', async (data) => {
      const { from, block } = data;
      
      try {
        const decryptedContent = await decryptMessage(block.payload, user.privateKey);
        const newMessage: Message = {
          id: String(block.index),
          content: decryptedContent,
          timestamp: new Date(block.timestamp).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isSender: false,
          blockNumber: block.index,
          isDelivered: true,
        };

        setMessages((prev) => [...prev, newMessage]);
        refetchBlockchain();
      } catch (error) {
        console.error('Failed to decrypt message:', error);
      }
    });

    socket.on('message-sent', (data) => {
      console.log('Message sent confirmation:', data);
      refetchBlockchain();
    });

    return () => {
      console.log('Disconnecting socket for user:', user.username);
      socket.disconnect();
      socket.removeAllListeners();
      socketRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!activeContactId || !blockchain.length) {
        setMessages([]);
        return;
      }

      const activeContact = contacts.find((c) => c.id === activeContactId);
      if (!activeContact) return;

      const userMessages = blockchain.filter(
        (block) =>
          (block.from === user.username && block.to === activeContact.name) ||
          (block.from === activeContact.name && block.to === user.username)
      );

      const decryptedMessages: Message[] = [];
      
      for (const block of userMessages) {
        try {
          const decryptedContent = await decryptMessage(block.payload, user.privateKey);
          decryptedMessages.push({
            id: String(block.index),
            content: decryptedContent,
            timestamp: new Date(block.timestamp).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isSender: block.from === user.username,
            blockNumber: block.index,
            isDelivered: true,
            isRead: true,
          });
        } catch (error) {
          console.error('Failed to decrypt message:', error);
        }
      }

      setMessages(decryptedMessages);
    };

    loadMessages();
  }, [activeContactId, blockchain.length]);

  const decryptMessage = async (encryptedPayload: string, privateKeyBase64: string): Promise<string> => {
    try {
      const privateKey = naclUtil.decodeBase64(privateKeyBase64);
      const message = JSON.parse(atob(encryptedPayload));
      
      const nonce = naclUtil.decodeBase64(message.nonce);
      const ciphertext = naclUtil.decodeBase64(message.ciphertext);
      const senderPublicKey = naclUtil.decodeBase64(message.senderPublicKey);

      const decrypted = nacl.box.open(ciphertext, nonce, senderPublicKey, privateKey);
      
      if (!decrypted) {
        throw new Error('Decryption failed');
      }

      return naclUtil.encodeUTF8(decrypted);
    } catch (error) {
      return "[Encrypted Message]";
    }
  };

  const encryptMessage = async (content: string, recipientPublicKeyBase64: string): Promise<string> => {
    const recipientPublicKey = naclUtil.decodeBase64(recipientPublicKeyBase64);
    const senderPrivateKey = naclUtil.decodeBase64(user.privateKey);
    const senderPublicKey = naclUtil.decodeBase64(user.publicKey);

    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const messageUint8 = naclUtil.decodeUTF8(content);
    
    const encrypted = nacl.box(messageUint8, nonce, recipientPublicKey, senderPrivateKey);

    const payload = {
      nonce: naclUtil.encodeBase64(nonce),
      ciphertext: naclUtil.encodeBase64(encrypted),
      senderPublicKey: naclUtil.encodeBase64(senderPublicKey),
    };

    return btoa(JSON.stringify(payload));
  };

  const handleSendMessage = async (content: string) => {
    if (!activeContactId || !socketRef.current) return;

    const activeContact = contacts.find((c) => c.id === activeContactId);
    if (!activeContact) return;

    try {
      const encryptedPayload = await encryptMessage(content, activeContact.name);
      
      socketRef.current.emit('send-message', {
        to: activeContact.name,
        encryptedPayload,
      });

      const newMessage: Message = {
        id: String(Date.now()),
        content,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isSender: true,
        isDelivered: false,
      };
      
      setMessages((prev) => [...prev, newMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const activeContact = contacts.find((c) => c.id === activeContactId);

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
          onLogout={onLogout}
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
