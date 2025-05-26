import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { profileService, Profile } from '@/services/profile';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { followService, FollowStatus } from '@/services/followService';
import { Button } from './ui/button';
import { Loader2, Pencil, UserCircle, Heart, HeartOff, MessageCircle, Trash2, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardFooter } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getRecipesByUserId, Recipe, deleteRecipe } from '@/services/recipeService';
import api from '@/services/api';
import CommentLikeButton from './CommentLikeButton';

interface UserProfileProps {
    userId: string;
}

interface LikeUser {
    id: string;
    displayName: string;
}

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    userId: string;
    userDisplayName: string;
}

interface CommentWithLikes extends Comment {
    likes: { id: string }[];
}

export function UserProfile({ userId }: UserProfileProps) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { user, loading: isAuthLoading } = useAuth();
    const [followStatus, setFollowStatus] = useState<FollowStatus | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [activeTab, setActiveTab] = useState('posts');
    const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
    const [likeLoading, setLikeLoading] = useState<Set<string>>(new Set());
    const [likedUsers, setLikedUsers] = useState<Record<string, LikeUser[]>>({});
    const [showLikesDialog, setShowLikesDialog] = useState<string | null>(null);
    const [newComment, setNewComment] = useState<Record<string, string>>({});
    const [commentSubmitting, setCommentSubmitting] = useState<Record<string, boolean>>({});
    const [editingComment, setEditingComment] = useState<{ id: string; content: string } | null>(null);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [deleteSubmitting, setDeleteSubmitting] = useState<string | null>(null);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loadingRecipes, setLoadingRecipes] = useState(false);

    const isOwnProfile = !isAuthLoading && user?.id && userId ? user.id === userId : false;

    useEffect(() => {
        const fetchProfile = async () => {
            if (!userId) {
                setError('Invalid user ID');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const data = await profileService.getUserProfile(userId);
                
                // Load comments for each post
                const postsWithComments = await Promise.all(
                    data.posts.map(async (post) => {
                        try {
                            const commentsResponse = await api.get<Comment[]>(`/Comment/post/${post.id}`);
                            // Get like counts for each comment
                            const commentsWithLikes = await Promise.all(
                                commentsResponse.data.map(async (comment) => {
                                    try {
                                        const likeCountResponse = await api.get<{ count: number }>(`/CommentLike/count/${comment.id}`);
                                        return {
                                            ...comment,
                                            likes: Array(likeCountResponse.data.count).fill({ id: '' })
                                        } as CommentWithLikes;
                                    } catch (err) {
                                        console.error(`Error fetching like count for comment ${comment.id}:`, err);
                                        return {
                                            ...comment,
                                            likes: []
                                        } as CommentWithLikes;
                                    }
                                })
                            );
                            return {
                                ...post,
                                comments: commentsWithLikes
                            };
                        } catch (err) {
                            console.error(`Error fetching comments for post ${post.id}:`, err);
                            return {
                                ...post,
                                comments: []
                            };
                        }
                    })
                );

                setProfile({
                    ...data,
                    posts: postsWithComments
                });

                // Load liked status for each post
                const likedStatuses = await Promise.all(
                    data.posts.map(async (post) => {
                        try {
                            const likeResponse = await api.get<{ hasLiked: boolean }>(`/Like/hasliked/${post.id}`);
                            return { postId: post.id, hasLiked: likeResponse.data.hasLiked };
                        } catch (err) {
                            console.error(`Error fetching like status for post ${post.id}:`, err);
                            return { postId: post.id, hasLiked: false };
                        }
                    })
                );
                const likedSet = new Set(likedStatuses.filter(status => status.hasLiked).map(status => status.postId));
                setLikedPosts(likedSet);
            } catch (err: any) {
                console.error('Error loading profile:', err);
                if (err.response?.status === 404) {
                    setError('User not found');
                } else {
                    setError('Failed to load profile. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [userId]);

    useEffect(() => {
        if (!isAuthLoading && !isOwnProfile) {
            const loadFollowStatus = async () => {
                try {
                    const status = await followService.getFollowStatus(userId);
                    setFollowStatus(status);
                } catch (err) {
                    console.error('Error loading follow status:', err);
                    setError('Failed to load follow status');
                }
            };

            loadFollowStatus();
        }
    }, [userId, isAuthLoading, isOwnProfile]);

    useEffect(() => {
        const loadRecipes = async () => {
            if (!userId) return;
            
            try {
                setLoadingRecipes(true);
                const userRecipes = await getRecipesByUserId(userId);
                setRecipes(userRecipes);
            } catch (err) {
                console.error('Error loading recipes:', err);
                setError('Failed to load recipes');
            } finally {
                setLoadingRecipes(false);
            }
        };

        if (activeTab === 'recipes') {
            loadRecipes();
        }
    }, [userId, activeTab]);

    const handleFollowToggle = async () => {
        if (isOwnProfile || !followStatus) return;

        try {
            setIsUpdating(true);
            setError(null);

            if (followStatus.isFollowing) {
                await followService.unfollowUser(userId);
                setFollowStatus(prev => prev ? {
                    ...prev,
                    isFollowing: false,
                    followerCount: prev.followerCount - 1
                } : null);
            } else {
                await followService.followUser(userId);
                setFollowStatus(prev => prev ? {
                    ...prev,
                    isFollowing: true,
                    followerCount: prev.followerCount + 1
                } : null);
            }
        } catch (err) {
            console.error('Error updating follow status:', err);
            setError('Failed to update follow status');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleLike = async (postId: string) => {
        if (likeLoading.has(postId)) return;
        setLikeLoading(prev => new Set(prev).add(postId));
        try {
            if (likedPosts.has(postId)) {
                await api.delete(`/Like/${postId}`);
                setLikedPosts(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(postId);
                    return newSet;
                });
                setProfile(prev => prev ? {
                    ...prev,
                    posts: prev.posts.map(post => post.id === postId ? { ...post, likeCount: post.likeCount - 1 } : post)
                } : null);
                setLikedUsers(prev => ({
                    ...prev,
                    [postId]: prev[postId]?.filter(user => user.id !== user?.id) || []
                }));
            } else {
                await api.post(`/Like/${postId}`);
                setLikedPosts(prev => new Set(prev).add(postId));
                setProfile(prev => prev ? {
                    ...prev,
                    posts: prev.posts.map(post => post.id === postId ? { ...post, likeCount: post.likeCount + 1 } : post)
                } : null);
                if (user?.id) {
                    const response = await api.get<LikeUser[]>(`/Like/users/${postId}`);
                    setLikedUsers(prev => ({
                        ...prev,
                        [postId]: response.data
                    }));
                }
            }
        } catch (err) {
            console.error('Error toggling like:', err);
            setError('Failed to update like status. Please try again.');
        } finally {
            setLikeLoading(prev => {
                const newSet = new Set(prev);
                newSet.delete(postId);
                return newSet;
            });
        }
    };

    const loadLikedUsers = async (postId: string) => {
        try {
            const response = await api.get<LikeUser[]>(`/Like/users/${postId}`);
            setLikedUsers(prev => ({
                ...prev,
                [postId]: response.data
            }));
        } catch (err) {
            console.error('Error loading liked users:', err);
        }
    };

    const handleComment = async (postId: string) => {
        if (!newComment[postId]?.trim()) return;
        setCommentSubmitting(prev => ({ ...prev, [postId]: true }));
        try {
            await api.post(`/Comment`, { content: newComment[postId], postId });
            setNewComment(prev => ({ ...prev, [postId]: '' }));
            // Refresh comments
            const response = await api.get<Comment[]>(`/Comment/post/${postId}`);
            const commentsWithLikes = await Promise.all(
                response.data.map(async (comment) => {
                    try {
                        const likeCountResponse = await api.get<{ count: number }>(`/CommentLike/count/${comment.id}`);
                        return {
                            ...comment,
                            likes: Array(likeCountResponse.data.count).fill({ id: '' })
                        } as CommentWithLikes;
                    } catch (err) {
                        console.error(`Error fetching like count for comment ${comment.id}:`, err);
                        return {
                            ...comment,
                            likes: []
                        } as CommentWithLikes;
                    }
                })
            );
            setProfile(prev => prev ? {
                ...prev,
                posts: prev.posts.map(post => 
                    post.id === postId 
                        ? { ...post, comments: commentsWithLikes, commentCount: commentsWithLikes.length }
                        : post
                )
            } : null);
        } catch (err) {
            console.error('Error posting comment:', err);
            setError('Failed to post comment. Please try again.');
        } finally {
            setCommentSubmitting(prev => ({ ...prev, [postId]: false }));
        }
    };

    const handleEditComment = async (commentId: string, newContent: string) => {
        if (!newContent.trim()) return;
        
        setEditSubmitting(true);
        try {
            await api.put(`/Comment/${commentId}`, { content: newContent, postId: profile?.posts.find(p => p.comments?.some(c => c.id === commentId))?.id });
            
            // Update the comment in the profile state
            setProfile(prev => prev ? {
                ...prev,
                posts: prev.posts.map(post => ({
                    ...post,
                    comments: post.comments?.map(comment => 
                        comment.id === commentId 
                            ? { ...comment, content: newContent, updatedAt: new Date().toISOString() }
                            : comment
                    ) || []
                }))
            } : null);
            
            setEditingComment(null);
        } catch (err) {
            console.error('Error updating comment:', err);
            setError('Failed to update comment. Please try again.');
        } finally {
            setEditSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) {
            return;
        }

        setDeleteSubmitting(commentId);
        try {
            await api.delete(`/Comment/${commentId}`);
            
            // Remove the comment from the profile state
            setProfile(prev => prev ? {
                ...prev,
                posts: prev.posts.map(post => ({
                    ...post,
                    comments: post.comments?.filter(comment => comment.id !== commentId) || [],
                    commentCount: post.comments?.filter(comment => comment.id !== commentId).length || 0
                }))
            } : null);
        } catch (err) {
            console.error('Error deleting comment:', err);
            setError('Failed to delete comment. Please try again.');
        } finally {
            setDeleteSubmitting(null);
        }
    };

    const handleDelete = async (postId: string) => {
        if (!window.confirm("Are you sure you want to delete this post?")) {
            return;
        }

        try {
            await api.delete(`/Post/${postId}`);
            setProfile(prev => prev ? {
                ...prev,
                posts: prev.posts.filter(post => post.id !== postId),
                postCount: prev.postCount - 1
            } : null);
        } catch (err: any) {
            console.error('Error deleting post:', err);
            if (err?.response?.status === 403) {
                setError("You don't have permission to delete this post.");
            } else if (err?.response?.status === 401) {
                setError("Please sign in to delete posts.");
                router.push('/login');
            } else {
                setError("Failed to delete post. Please try again.");
            }
        }
    };

    const handleDeleteRecipe = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this recipe?")) {
            return;
        }

        try {
            await deleteRecipe(id);
            setRecipes(recipes.filter(recipe => recipe.id !== id));
        } catch (err: any) {
            if (err?.response?.status === 403) {
                setError("You don't have permission to delete this recipe.");
            } else if (err?.response?.status === 401) {
                setError("Please sign in to delete recipes.");
                router.push('/login');
            } else {
                setError("Failed to delete recipe. Please try again.");
            }
        }
    };

    if (isAuthLoading || loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 px-4">
                <div className="text-red-500 text-lg text-center">{error || 'Profile not found'}</div>
                <Button onClick={() => router.back()}>
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <Card className="mb-8">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Avatar className="h-16 w-16">
                                <AvatarFallback className="text-lg">
                                    {profile.displayName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    {isOwnProfile ? 'Your Profile' : profile.displayName}
                                </h1>
                                <div className="flex items-center space-x-4 mt-2">
                                    <Badge className="text-sm bg-gray-100 text-gray-700">
                                        {profile.postCount} {profile.postCount === 1 ? 'post' : 'posts'}
                                    </Badge>
                                    {followStatus && (
                                        <>
                                            <Badge className="text-sm bg-gray-100 text-gray-700">
                                                {followStatus.followerCount} Followers
                                            </Badge>
                                            <Badge className="text-sm bg-gray-100 text-gray-700">
                                                {followStatus.followingCount} Following
                                            </Badge>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            {isOwnProfile && (
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Pencil className="h-4 w-4" />
                                    Edit Profile
                                </Button>
                            )}
                            {!isAuthLoading && !isOwnProfile && followStatus && (
                                <Button
                                    onClick={handleFollowToggle}
                                    disabled={isUpdating}
                                    variant={followStatus.isFollowing ? "outline" : "default"}
                                    className="min-w-[100px]"
                                >
                                    {isUpdating ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : followStatus.isFollowing ? (
                                        'Unfollow'
                                    ) : (
                                        'Follow'
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="posts">Posts</TabsTrigger>
                    <TabsTrigger value="recipes">Recipes</TabsTrigger>
                </TabsList>

                <TabsContent value="posts">
                    {profile.posts.length === 0 ? (
                        <Card>
                            <CardContent className="py-8">
                                <div className="text-center text-gray-500">
                                    {isOwnProfile ? "You haven't posted anything yet." : "This user hasn't posted anything yet."}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {profile.posts.map((post) => (
                                <Card key={post.id}>
                                    <CardHeader className="pb-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center space-x-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback>
                                                        {post.userDisplayName.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <Link
                                                        href={`/profile/${post.userId}`}
                                                        className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                                                    >
                                                        {post.userDisplayName}
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
                                            {isOwnProfile && (
                                                <div className="flex gap-1">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Link href={`/posts/edit/${post.id}`}>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                </Link>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Edit post</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    onClick={() => handleDelete(post.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Delete post</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    
                                    <CardContent>
                                        <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
                                    </CardContent>

                                    <Separator />

                                    <CardFooter className="flex items-center justify-between py-4">
                                        <div className="flex items-center gap-4">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600"
                                                            onClick={() => {
                                                                handleLike(post.id);
                                                                loadLikedUsers(post.id);
                                                            }}
                                                            disabled={likeLoading.has(post.id)}
                                                        >
                                                            {likedPosts.has(post.id) ? (
                                                                <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                                                            ) : (
                                                                <HeartOff className="h-5 w-5" />
                                                            )}
                                                            <span>{post.likeCount}</span>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="bottom" className="p-2">
                                                        {post.likeCount > 0 ? (
                                                            <div className="max-w-xs space-y-2">
                                                                {likedUsers[post.id]?.map(user => (
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
                                            
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <MessageCircle className="h-5 w-5" />
                                                <span>{post.commentCount}</span>
                                            </div>
                                        </div>
                                    </CardFooter>

                                    <Separator />

                                    {/* Comments Section */}
                                    <div className="p-4 space-y-4">
                                        {post.comments && post.comments.length > 0 ? (
                                            <div className="space-y-4">
                                                {post.comments.map((comment) => (
                                                    <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarFallback>
                                                                        {comment.userDisplayName.charAt(0).toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <Link
                                                                        href={`/profile/${comment.userId}`}
                                                                        className="font-medium text-sm text-gray-900 hover:text-blue-600 hover:underline transition-colors"
                                                                    >
                                                                        {comment.userDisplayName}
                                                                    </Link>
                                                                    <p className="text-xs text-gray-500">
                                                                        {new Date(comment.createdAt).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {user?.id === comment.userId && (
                                                                <div className="flex gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-7 px-2"
                                                                        onClick={() => setEditingComment({ id: comment.id, content: comment.content })}
                                                                        disabled={editSubmitting || deleteSubmitting === comment.id}
                                                                    >
                                                                        <Pencil className="h-3 w-3 mr-1" />
                                                                        Edit
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                        onClick={() => handleDeleteComment(comment.id)}
                                                                        disabled={editSubmitting || deleteSubmitting === comment.id}
                                                                    >
                                                                        {deleteSubmitting === comment.id ? (
                                                                            <div className="flex items-center">
                                                                                <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-1" />
                                                                                Deleting
                                                                            </div>
                                                                        ) : (
                                                                            <>
                                                                                <Trash2 className="h-3 w-3 mr-1" />
                                                                                Delete
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {editingComment?.id === comment.id ? (
                                                            <div className="mt-2 space-y-2">
                                                                <Textarea
                                                                    value={editingComment.content}
                                                                    onChange={(e) => setEditingComment(prev => prev ? { ...prev, content: e.target.value } : null)}
                                                                    className="w-full"
                                                                    rows={2}
                                                                />
                                                                <div className="flex justify-end gap-2">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => setEditingComment(null)}
                                                                        disabled={editSubmitting}
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handleEditComment(comment.id, editingComment.content)}
                                                                        disabled={editSubmitting || !editingComment.content.trim()}
                                                                    >
                                                                        {editSubmitting ? (
                                                                            <div className="flex items-center">
                                                                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                                                                                Saving
                                                                            </div>
                                                                        ) : (
                                                                            "Save"
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <p className="text-sm text-gray-700">{comment.content}</p>
                                                                <div className="mt-2 flex items-center justify-between">
                                                                    <CommentLikeButton
                                                                        commentId={comment.id}
                                                                        initialLikeCount={(comment as CommentWithLikes).likes?.length || 0}
                                                                    />
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">No comments yet</p>
                                        )}

                                        <div className="flex gap-2">
                                            <Input
                                                value={newComment[post.id] || ''}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                                                placeholder="Write a comment..."
                                                className="flex-1"
                                            />
                                            <Button
                                                onClick={() => handleComment(post.id)}
                                                disabled={!newComment[post.id]?.trim() || commentSubmitting[post.id]}
                                                className="w-24"
                                            >
                                                {commentSubmitting[post.id] ? (
                                                    <div className="flex items-center">
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                        Posting
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Send className="h-4 w-4 mr-2" />
                                                        Post
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="recipes">
                    {loadingRecipes ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : recipes.length === 0 ? (
                        <Card>
                            <CardContent className="py-8">
                                <div className="text-center text-gray-500">
                                    {isOwnProfile ? "You haven't shared any recipes yet." : "This user hasn't shared any recipes yet."}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {recipes.map((recipe) => (
                                <Card key={recipe.id}>
                                    <CardHeader className="pb-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center space-x-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback>
                                                        {recipe.userDisplayName.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <Link
                                                        href={`/profile/${recipe.userId}`}
                                                        className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                                                    >
                                                        {recipe.userDisplayName}
                                                    </Link>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(recipe.createdAt).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            {isOwnProfile && (
                                                <div className="flex gap-1">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Link href={`/recipes/edit/${recipe.id}`}>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                </Link>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Edit recipe</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    onClick={() => handleDeleteRecipe(recipe.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Delete recipe</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        <div>
                                            <h2 className="text-2xl font-semibold mb-2">{recipe.title}</h2>
                                            <p className="text-gray-700 whitespace-pre-wrap">{recipe.description}</p>
                                        </div>

                                        <Separator />

                                        <div>
                                            <h3 className="font-medium text-gray-900 mb-2">Ingredients</h3>
                                            <p className="text-gray-700 whitespace-pre-wrap">{recipe.ingredients}</p>
                                        </div>

                                        {recipe.calories && (
                                            <>
                                                <Separator />
                                                <div>
                                                    <h3 className="font-medium text-gray-900 mb-2">Nutrition</h3>
                                                    <Badge className="text-sm bg-gray-100 text-gray-700">
                                                        {recipe.calories} calories
                                                    </Badge>
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
} 