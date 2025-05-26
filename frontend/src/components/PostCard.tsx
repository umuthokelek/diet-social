import React from 'react';
import Link from 'next/link';
import { Post } from '@/services/postService';
import { Card, CardContent, CardHeader } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { getImageUrl } from '@/utils/imageUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

export default function PostCard({ post, onLike, onComment, onShare }: PostCardProps) {
  const displayName = post.user?.displayName ?? "Anonymous";
  const userInitial = displayName.charAt(0).toUpperCase();
  const imageUrl = getImageUrl(post.imageUrl);
  
  // Log the constructed image URL for verification
  console.log('PostCard image URL:', imageUrl);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <div>
            <Link
              href={`/profile/${post.userId}`}
              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            >
              {displayName}
            </Link>
            <p className="text-sm text-gray-500">
              {new Date(post.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {imageUrl && (
          <div className="relative w-full aspect-video mb-4">
            <img
              src={imageUrl}
              alt="Post image"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        )}
        <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>

        <Separator />

        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => onLike?.(post.id)}
                  >
                    <Heart className="h-4 w-4" />
                    <span>{post.likeCount}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Like post</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => onComment?.(post.id)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>{post.commentCount}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Comment on post</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => onShare?.(post.id)}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Share post</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
} 