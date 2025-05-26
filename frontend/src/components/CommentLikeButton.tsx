'use client';

import { useState, useEffect } from 'react';
import { Heart, HeartOff } from 'lucide-react';
import { commentLikesService } from '@/services/commentLikes';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface CommentLikeButtonProps {
  commentId: string;
  initialLikeCount: number;
}

export default function CommentLikeButton({ commentId, initialLikeCount }: CommentLikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likedUsers, setLikedUsers] = useState<{ id: string; displayName: string; }[]>([]);

  const fetchLikeData = async () => {
    try {
      console.log(`[CommentLikeButton] Fetching like data for comment ${commentId}`);
      const [count, hasLiked] = await Promise.all([
        commentLikesService.getLikeCount(commentId),
        commentLikesService.hasLiked(commentId)
      ]);
      console.log(`[CommentLikeButton] Like count for comment ${commentId}: ${count}`);
      setLikeCount(count);
      setIsLiked(hasLiked);
    } catch (err) {
      console.error(`[CommentLikeButton] Error fetching like data for comment ${commentId}:`, err);
    }
  };

  useEffect(() => {
    fetchLikeData();
  }, [commentId]);

  const handleLike = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      if (isLiked) {
        await commentLikesService.removeLike(commentId);
      } else {
        await commentLikesService.addLike(commentId);
      }

      // Fetch fresh data after like/unlike
      await fetchLikeData();
      loadLikedUsers();
    } catch (err) {
      setError('Failed to update like status');
      console.error(`[CommentLikeButton] Error updating like for comment ${commentId}:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLikedUsers = async () => {
    try {
      const users = await commentLikesService.getUsersWhoLiked(commentId);
      setLikedUsers(users);
    } catch (err) {
      console.error(`[CommentLikeButton] Error loading liked users for comment ${commentId}:`, err);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={isLoading}
              className={`flex items-center gap-2 hover:bg-red-50 hover:text-red-600 ${
                isLiked ? 'text-red-600' : 'text-gray-600'
              }`}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : isLiked ? (
                <Heart className="h-4 w-4 fill-current" />
              ) : (
                <HeartOff className="h-4 w-4" />
              )}
              <span className="min-w-[1.5rem] text-center">{likeCount}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="p-2">
            {likeCount > 0 ? (
              <div className="max-w-xs space-y-2">
                {likedUsers.map(user => (
                  <div key={user.id} className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>
                        {user.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{user.displayName}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span>No likes yet</span>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {error && (
        <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
          {error}
        </span>
      )}
    </div>
  );
} 