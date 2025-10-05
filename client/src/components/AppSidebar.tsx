import { Search, Plus, Shield, BookOpen, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ContactItem from "./ContactItem";
import { useState } from "react";

interface Contact {
  id: string;
  name: string;
  lastMessage?: string;
  timestamp?: string;
  unreadCount?: number;
  isOnline?: boolean;
}

interface AppSidebarProps {
  contacts: Contact[];
  activeContactId?: string;
  onSelectContact: (id: string) => void;
  onViewLedger: () => void;
  onLogout: () => void;
}

export default function AppSidebar({
  contacts,
  activeContactId,
  onSelectContact,
  onViewLedger,
  onLogout,
}: AppSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-sidebar border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Swapchat</h1>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => console.log("New chat")}
            data-testid="button-new-chat"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-contacts"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filteredContacts.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-sm text-muted-foreground">No contacts found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredContacts.map((contact) => (
              <ContactItem
                key={contact.id}
                {...contact}
                isActive={contact.id === activeContactId}
                onClick={() => onSelectContact(contact.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={onLogout}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={onViewLedger}
          data-testid="button-view-ledger"
        >
          <BookOpen className="h-4 w-4" />
          View Blockchain Ledger
        </Button>
      </div>
    </div>
  );
}
