import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus, X, Eye, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Story {
  id: string;
  userId: string;
  username: string;
  profileImage: string;
  content: string;
  mediaType: string;
  backgroundColor: string;
  createdAt: string;
  expiresAt: string;
  viewCount: number;
  viewers: Array<{
    username: string;
    viewedAt: string;
  }>;
  isOwnStory: boolean;
}

interface GroupedStories {
  [userId: string]: Story[];
}

export default function Stories() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [storyContent, setStoryContent] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#1a1a1a');
  const [currentStoryGroup, setCurrentStoryGroup] = useState<Story[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showViewers, setShowViewers] = useState(false);

  const { data: stories = {}, refetch } = useQuery<GroupedStories>({
    queryKey: ['/api/stories'],
  });

  const createStoryMutation = useMutation({
    mutationFn: async (data: { content: string; backgroundColor: string }) => {
      return await apiRequest('/api/stories', {
        method: 'POST',
        body: JSON.stringify({
          content: data.content,
          mediaType: 'text',
          backgroundColor: data.backgroundColor,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
      setIsCreateOpen(false);
      setStoryContent('');
      toast({
        title: "Story Posted",
        description: "Your story has been posted and will expire in 24 hours.",
      });
    },
  });

  const markViewedMutation = useMutation({
    mutationFn: async (storyId: string) => {
      return await apiRequest(`/api/stories/${storyId}/view`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
    },
  });

  const handleCreateStory = () => {
    if (!storyContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter some content for your story.",
        variant: "destructive",
      });
      return;
    }

    createStoryMutation.mutate({
      content: storyContent,
      backgroundColor,
    });
  };

  const handleViewStory = (userStories: Story[]) => {
    setCurrentStoryGroup(userStories);
    setCurrentStoryIndex(0);
    setIsViewOpen(true);
    
    if (!userStories[0].isOwnStory) {
      markViewedMutation.mutate(userStories[0].id);
    }
  };

  const handleNextStory = () => {
    if (currentStoryIndex < currentStoryGroup.length - 1) {
      const nextIndex = currentStoryIndex + 1;
      setCurrentStoryIndex(nextIndex);
      
      if (!currentStoryGroup[nextIndex].isOwnStory) {
        markViewedMutation.mutate(currentStoryGroup[nextIndex].id);
      }
    } else {
      setIsViewOpen(false);
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const currentStory = currentStoryGroup[currentStoryIndex];
  const userStories = Object.entries(stories);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const colors = [
    '#1a1a1a', '#1e3a8a', '#7c2d12', '#831843', '#064e3b',
    '#713f12', '#4c1d95', '#14532d', '#991b1b', '#1e40af'
  ];

  return (
    <>
      <div className="flex space-x-4 p-4 overflow-x-auto bg-midnight-dark border-b border-gray-800">
        <div
          onClick={() => setIsCreateOpen(true)}
          className="flex flex-col items-center space-y-1 cursor-pointer group"
          data-testid="button-create-story"
        >
          <div className="relative">
            <Avatar className="h-16 w-16 border-2 border-dashed border-swapgreen">
              <AvatarFallback className="bg-midnight-light text-swapgreen">
                <Plus className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
          </div>
          <span className="text-xs text-gray-400 group-hover:text-swapgreen">Your Story</span>
        </div>

        {userStories.map(([userId, userStories]) => {
          const latestStory = userStories[0];
          const hasMultiple = userStories.length > 1;
          
          return (
            <div
              key={userId}
              onClick={() => handleViewStory(userStories)}
              className="flex flex-col items-center space-y-1 cursor-pointer group"
              data-testid={`story-${latestStory.username}`}
            >
              <div className="relative">
                <Avatar className={`h-16 w-16 ${latestStory.isOwnStory ? 'border-2 border-swapgreen' : 'ring-2 ring-chain-blue'}`}>
                  <AvatarImage src={latestStory.profileImage} alt={latestStory.username} />
                  <AvatarFallback className="bg-midnight-light text-white">
                    <User className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                {hasMultiple && (
                  <div className="absolute -bottom-1 -right-1 bg-chain-blue text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {userStories.length}
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-400 group-hover:text-white max-w-[64px] truncate">
                {latestStory.isOwnStory ? 'You' : latestStory.username}
              </span>
            </div>
          );
        })}
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-midnight-dark border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl">Create Story</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Background Color</label>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setBackgroundColor(color)}
                    className={`h-10 w-10 rounded-full border-2 ${
                      backgroundColor === color ? 'border-swapgreen scale-110' : 'border-gray-700'
                    } transition-transform`}
                    style={{ backgroundColor: color }}
                    data-testid={`color-${color}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Content</label>
              <Textarea
                value={storyContent}
                onChange={(e) => setStoryContent(e.target.value)}
                placeholder="What's on your mind?"
                className="bg-midnight-light border-gray-700 text-white min-h-[150px]"
                maxLength={300}
                data-testid="textarea-story-content"
              />
              <p className="text-xs text-gray-500 mt-1">{storyContent.length}/300</p>
            </div>

            <div 
              className="rounded-lg p-6 flex items-center justify-center text-center min-h-[200px]"
              style={{ backgroundColor }}
            >
              <p className="text-white text-lg break-words max-w-full px-4">
                {storyContent || "Your story preview..."}
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="border-gray-700 text-white hover:bg-midnight-light"
                data-testid="button-cancel-story"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateStory}
                disabled={createStoryMutation.isPending || !storyContent.trim()}
                className="bg-swapgreen hover:bg-swapgreen/90 text-black"
                data-testid="button-post-story"
              >
                {createStoryMutation.isPending ? 'Posting...' : 'Post Story'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="bg-transparent border-0 max-w-md p-0 overflow-hidden">
          {currentStory && (
            <div className="relative h-[600px]">
              <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-10 w-10 border-2 border-white">
                      <AvatarImage src={currentStory.profileImage} alt={currentStory.username} />
                      <AvatarFallback className="bg-midnight-light text-white">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white font-medium text-sm">{currentStory.username}</p>
                      <p className="text-gray-300 text-xs">
                        {format(new Date(currentStory.createdAt), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {currentStory.isOwnStory && (
                      <button
                        onClick={() => setShowViewers(!showViewers)}
                        className="bg-black/30 hover:bg-black/50 rounded-full p-2 text-white"
                        data-testid="button-show-viewers"
                      >
                        <Eye className="h-5 w-5" />
                        <span className="ml-1 text-sm">{currentStory.viewCount}</span>
                      </button>
                    )}
                    <button
                      onClick={() => setIsViewOpen(false)}
                      className="bg-black/30 hover:bg-black/50 rounded-full p-2 text-white"
                      data-testid="button-close-story"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex space-x-1 mt-2">
                  {currentStoryGroup.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-0.5 flex-1 rounded-full ${
                        idx === currentStoryIndex ? 'bg-white' : idx < currentStoryIndex ? 'bg-gray-400' : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div
                onClick={handleNextStory}
                className="absolute inset-0 flex items-center justify-center p-8 cursor-pointer"
                style={{ backgroundColor: currentStory.backgroundColor }}
              >
                <p className="text-white text-xl text-center break-words max-w-full">
                  {currentStory.content}
                </p>
              </div>

              {currentStoryIndex > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevStory();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 rounded-full p-2 text-white z-20"
                  data-testid="button-prev-story"
                >
                  ‹
                </button>
              )}

              {showViewers && currentStory.isOwnStory && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-4 max-h-48 overflow-y-auto">
                  <h3 className="text-white font-medium mb-2">Viewers ({currentStory.viewCount})</h3>
                  {currentStory.viewers.map((viewer, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                      <span className="text-white text-sm">{viewer.username}</span>
                      <span className="text-gray-400 text-xs">
                        {format(new Date(viewer.viewedAt), 'h:mm a')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
