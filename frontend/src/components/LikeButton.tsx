'use client';

import { useState, useEffect } from 'react';
import { likesService } from '@/services/likes';
import { authService } from '@/services/auth';

interface LikeButtonProps {
  postId: string;
  initialLikeCount: number;
}

export default function LikeButton({ postId, initialLikeCount }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isAuthenticated = authService.isAuthenticated();

  useEffect(() => {
    const fetchLikeData = async () => {
      try {
        const [count, hasLiked] = await Promise.all([
          likesService.getLikeCount(postId),
          likesService.hasLiked(postId),
        ]);
        setLikeCount(count);
        setIsLiked(hasLiked);
      } catch (err: any) {
        setError('Failed to load like data');
      }
    };

    if (isAuthenticated) {
      fetchLikeData();
    }
  }, [postId, isAuthenticated]);

  const handleLike = async () => {
    if (!isAuthenticated || isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      if (isLiked) {
        await likesService.removeLike(postId);
        setLikeCount(prev => prev - 1);
      } else {
        await likesService.addLike(postId);
        setLikeCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (err: any) {
      setError('Failed to update like');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleLike}
        disabled={isLoading}
        className={`group flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
          isLiked
            ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
            : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}`}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 transition-transform duration-200 ${
              isLiked ? 'scale-110' : 'group-hover:scale-110'
            }`}
            fill={isLiked ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        )}
        <span className="min-w-[1.5rem] text-center">{likeCount}</span>
      </button>
      {error && (
        <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
          {error}
        </span>
      )}
    </div>
  );
} 