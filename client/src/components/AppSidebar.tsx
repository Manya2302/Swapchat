import { Search, Plus, Shield, BookOpen, LogOut, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ContactItem from "./ContactItem";
import UserProfilePreview from "./UserProfilePreview";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface Contact {
  id: string;
  name: string;
  lastMessage?: string;
  timestamp?: string;
  unreadCount?: number;
  isOnline?: boolean;
  profileImage?: string;
  description?: string;
}

interface SearchResult {
  id: string;
  username: string;
  fullName: string;
  description: string;
  profileImage: string;
  publicKey: string;
  createdAt: string;
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
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);

  const { data: searchResults = [] } = useQuery<SearchResult[]>({
    queryKey: ['/api/users/search', { query: searchQuery }],
    enabled: isSearchMode && searchQuery.length >= 2,
  });

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartChat = (publicKey: string, username: string) => {
    const contact = contacts.find(c => c.id === publicKey);
    if (contact) {
      onSelectContact(contact.id);
    }
  };

  return (
    <>
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
              onClick={() => setIsSearchMode(!isSearchMode)}
              data-testid="button-add-contact"
            >
              {isSearchMode ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={isSearchMode ? "Search users (@username)..." : "Search contacts..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-users"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isSearchMode ? (
            <div className="space-y-2">
              {searchQuery.length < 2 ? (
                <div className="text-center py-8 px-4">
                  <p className="text-sm text-muted-foreground">
                    Type at least 2 characters to search users
                  </p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <p className="text-sm text-muted-foreground">No users found</p>
                </div>
              ) : (
                searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-sidebar-hover cursor-pointer transition-colors"
                    data-testid={`user-card-${user.username}`}
                  >
                    <Avatar className="h-12 w-12 border-2 border-swapgreen">
                      <AvatarImage src={user.profileImage} alt={user.username} />
                      <AvatarFallback className="bg-midnight-light text-white">
                        <User className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">@{user.username}</p>
                      <p className="text-sm text-gray-400 truncate">{user.fullName}</p>
                      {user.description && (
                        <p className="text-xs text-gray-500 truncate mt-1">{user.description}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            filteredContacts.length === 0 ? (
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
            )
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

      <UserProfilePreview
        user={selectedUser}
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        onStartChat={handleStartChat}
      />
    </>
  );
}
