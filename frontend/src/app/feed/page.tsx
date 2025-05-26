'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import Head from 'next/head';
import { getAllPosts, getFollowingPosts, createPost, deletePost, Post } from "@/services/postService";
import { jwtDecode } from "jwt-decode";
import CommentSection from '@/components/CommentSection';
import { Heart, HeartOff, MessageCircle, Pencil, Trash2, Send, UserCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import api from '@/services/api';
import CommentLikeButton from '@/components/CommentLikeButton';

interface JwtPayload {
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": string;
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

type FeedView = 'all' | 'following';

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [view, setView] = useState<FeedView>('all');
  const [newPost, setNewPost] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likeLoading, setLikeLoading] = useState<Set<string>>(new Set());
  const [likedUsers, setLikedUsers] = useState<Record<string, LikeUser[]>>({});
  const [showLikesDialog, setShowLikesDialog] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [commentSubmitting, setCommentSubmitting] = useState<Record<string, boolean>>({});
  const [editingComment, setEditingComment] = useState<{ id: string; content: string } | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current userId from JWT
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const decoded = jwtDecode<JwtPayload>(token);
            const userId = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
            setCurrentUserId(userId);
          } catch (err) {
            console.error('Error decoding token:', err);
            setCurrentUserId(null);
          }
        }

        // Load posts based on current view
        await loadPosts();
      } catch (err) {
        console.error('Error loading data:', err);
        setError("Failed to load posts. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [view]); // Reload when view changes

  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const postsData = view === 'all' 
        ? await getAllPosts()
        : await getFollowingPosts();
      
      // Load comments for each post
      const postsWithComments = await Promise.all(
        postsData.map(async (post) => {
          try {
            const commentsResponse = await api.get<Comment[]>(`/Comment/post/${post.id}`);
            return { ...post, comments: commentsResponse.data };
          } catch (err) {
            console.error(`Error fetching comments for post ${post.id}:`, err);
            return { ...post, comments: [] };
          }
        })
      );
      
      setPosts(postsWithComments);
      
      // Load liked status for each post
      const likedStatuses = await Promise.all(
        postsData.map(async (post) => {
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
      console.error('Error loading posts:', err);
      if (err?.response?.status === 401) {
        setError("Please sign in to view posts.");
        router.push('/login');
      } else {
        setError("Failed to load posts. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const post = await createPost({ content: newPost });
      setPosts([post, ...posts]);
      setNewPost("");
    } catch (err: any) {
      console.error('Error creating post:', err);
      if (err?.response?.status === 401) {
        setError("Please sign in to create posts.");
        router.push('/login');
      } else {
        setError("Failed to create post. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      await deletePost(id);
      setPosts(posts.filter(post => post.id !== id));
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

  const isPostOwner = (postUserId: string) => {
    return currentUserId === postUserId;
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
        setPosts(prev => prev.map(post => post.id === postId ? { ...post, likeCount: post.likeCount - 1 } : post));
        // Update liked users
        setLikedUsers(prev => ({
          ...prev,
          [postId]: prev[postId]?.filter(user => user.id !== currentUserId) || []
        }));
      } else {
        await api.post(`/Like/${postId}`);
        setLikedPosts(prev => new Set(prev).add(postId));
        setPosts(prev => prev.map(post => post.id === postId ? { ...post, likeCount: post.likeCount + 1 } : post));
        // Update liked users
        if (currentUserId) {
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

  const handleComment = async (postId: string) => {
    if (!newComment[postId]?.trim()) return;
    setCommentSubmitting(prev => ({ ...prev, [postId]: true }));
    try {
      await api.post(`/Comment`, { content: newComment[postId], postId });
      setNewComment(prev => ({ ...prev, [postId]: '' }));
      // Refresh comments
      const response = await api.get<Comment[]>(`/Comment/post/${postId}`);
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, comments: response.data, commentCount: response.data.length }
          : post
      ));
    } catch (err) {
      console.error('Error posting comment:', err);
      setError('Failed to post comment. Please try again.');
    } finally {
      setCommentSubmitting(prev => ({ ...prev, [postId]: false }));
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

  const handleEditComment = async (commentId: string, newContent: string) => {
    if (!newContent.trim()) return;
    
    setEditSubmitting(true);
    try {
      await api.put(`/Comment/${commentId}`, { content: newContent, postId: posts.find(p => p.comments?.some(c => c.id === commentId))?.id });
      
      // Update the comment in the posts state
      setPosts(prev => prev.map(post => ({
        ...post,
        comments: post.comments?.map(comment => 
          comment.id === commentId 
            ? { ...comment, content: newContent, updatedAt: new Date().toISOString() }
            : comment
        ) || []
      })));
      
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
      
      // Remove the comment from the posts state
      setPosts(prev => prev.map(post => ({
        ...post,
        comments: post.comments?.filter(comment => comment.id !== commentId) || [],
        commentCount: post.comments?.filter(comment => comment.id !== commentId).length || 0
      })));
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Failed to delete comment. Please try again.');
    } finally {
      setDeleteSubmitting(null);
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Feed - DietSocial</title>
      </Head>
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Feed
          </h1>
          <Tabs defaultValue={view} onValueChange={(v) => setView(v as FeedView)} className="w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">All Posts</TabsTrigger>
              <TabsTrigger value="following">Following</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                value={newPost}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewPost(e.target.value)}
                placeholder="What's on your mind?"
                className="min-h-[100px] resize-none"
                rows={3}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={submitting || !newPost.trim()}
                  className="w-24"
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Posting
                    </div>
                  ) : (
                    "Post"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {post.userDisplayName ? post.userDisplayName.charAt(0).toUpperCase() : 'U'}
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
                  {isPostOwner(post.userId) && (
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
                                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
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
                                {comment.userDisplayName ? comment.userDisplayName.charAt(0).toUpperCase() : 'U'}
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
                          {currentUserId === comment.userId && (
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
                                initialLikeCount={(comment as any).likes ? (comment as any).likes.length : 0}
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
      </div>
    </>
  );
} 