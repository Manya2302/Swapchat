import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, User } from "lucide-react";
import { format } from "date-fns";

interface UserProfilePreviewProps {
  user: {
    id: string;
    username: string;
    fullName: string;
    description: string;
    profileImage: string;
    publicKey: string;
    createdAt: string;
  } | null;
  open: boolean;
  onClose: () => void;
  onStartChat: (publicKey: string, username: string) => void;
}

export default function UserProfilePreview({ user, open, onClose, onStartChat }: UserProfilePreviewProps) {
  if (!user) return null;

  const joinedDate = user.createdAt ? format(new Date(user.createdAt), 'MMMM dd, yyyy') : 'N/A';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-midnight-dark border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24 border-4 border-swapgreen">
              <AvatarImage src={user.profileImage} alt={user.username} />
              <AvatarFallback className="bg-midnight-light text-white text-2xl">
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white" data-testid={`text-username-${user.username}`}>
                @{user.username}
              </h2>
              <p className="text-gray-400 mt-1" data-testid={`text-fullname-${user.username}`}>
                {user.fullName}
              </p>
            </div>
          </div>

          {user.description && (
            <div className="bg-midnight-light rounded-lg p-4">
              <p className="text-sm text-gray-300" data-testid={`text-description-${user.username}`}>
                {user.description}
              </p>
            </div>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Joined</span>
              <span className="text-white" data-testid={`text-joined-${user.username}`}>{joinedDate}</span>
            </div>
          </div>

          <Button
            onClick={() => {
              onStartChat(user.publicKey, user.username);
              onClose();
            }}
            className="w-full bg-swapgreen hover:bg-swapgreen/90 text-black"
            data-testid={`button-start-chat-${user.username}`}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Start Chat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
