import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import LikeButton from './LikeButton';
import CommentSection from './CommentSection';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export interface Post {
    id: string;
    content: string;
    createdAt: string;
    userId: string;
    userDisplayName: string;
    likeCount: number;
    commentCount: number;
}

interface PostCardProps {
    post: Post;
}

export function PostCard({ post }: PostCardProps) {
    const [showComments, setShowComments] = useState(false);
    const router = useRouter();
    const { user } = useAuth();
    const isOwnPost = user?.id === post.userId;

    // Debug logging for post data
    useEffect(() => {
        console.log('PostCard rendered with data:', {
            postId: post.id,
            userId: post.userId,
            displayName: post.userDisplayName,
            hasValidData: Boolean(post.userId && post.userDisplayName)
        });
    }, [post]);

    // Early return if post data is invalid
    if (!post.userId || !post.userDisplayName) {
        console.error('PostCard: Invalid post data', { post });
        return null;
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
                {/* Author section - isolated to prevent event interference */}
                <div className="flex items-center space-x-2">
                    <Link
                        href={`/profile/${post.userId}`}
                        className="font-semibold text-gray-900 hover:text-blue-600 hover:underline transition-colors cursor-pointer inline-block"
                        onClick={(e) => {
                            // Stop event propagation to prevent parent interference
                            e.stopPropagation();
                            e.preventDefault();
                            console.log('Profile link clicked:', {
                                userId: post.userId,
                                displayName: post.userDisplayName,
                                postId: post.id
                            });
                            // Navigate programmatically after logging
                            router.push(`/profile/${post.userId}`);
                        }}
                        style={{ 
                            position: 'relative',
                            zIndex: 10,
                            // Debug styles - remove in production
                            outline: '1px solid rgba(59, 130, 246, 0.2)',
                            padding: '2px 4px',
                            borderRadius: '4px'
                        }}
                    >
                        {post.userDisplayName}
                    </Link>
                </div>
                <span className="text-gray-500 text-sm">
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </span>
            </div>

            <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>

            <div className="flex items-center space-x-4 border-t pt-4">
                <LikeButton postId={post.id} initialLikeCount={post.likeCount} />
                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center space-x-1 text-gray-500 hover:text-gray-600"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <span>{post.commentCount}</span>
                </button>
            </div>

            {showComments && <CommentSection postId={post.id} />}
        </div>
    );
} 