'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { postService, Post } from '@/services/postService';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';

interface JwtPayload {
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": string;
}

interface EditPostForm {
  content: string;
  image?: File;
  removeImage?: boolean;
}

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params?.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [formData, setFormData] = useState<EditPostForm>({ content: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) {
      setError('Invalid post ID');
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        // Get current userId from JWT
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please sign in to edit posts');
          router.push('/login');
          return;
        }

        let userId = null;
        try {
          const decoded = jwtDecode<JwtPayload>(token);
          userId = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
          setCurrentUserId(userId);
        } catch (err) {
          console.error('Error decoding token:', err);
          setError('Invalid authentication token');
          router.push('/login');
          return;
        }

        // Fetch post details
        const postData = await postService.getPost(postId);
        setPost(postData);
        setFormData({ content: postData.content });

        // Debug logs
        console.log('Loaded post.userId:', postData.userId);
        console.log('Loaded currentUserId:', userId);
        const isOwner = postData.userId === userId;
        console.log('Ownership check:', isOwner);

        // Only redirect if both are loaded and not owner
        if (!isOwner) {
          setError('You do not have permission to edit this post');
          router.push('/feed');
          return;
        }
      } catch (err: any) {
        console.error('Error loading post:', err);
        if (err.response?.status === 404) {
          setError('Post not found');
        } else {
          setError('Failed to load post. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [postId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;

    setSubmitting(true);
    setError(null);

    try {
      const updatedPost = await postService.updatePost(postId, formData);
      setPost(updatedPost);
      router.push('/feed');
    } catch (err: any) {
      console.error('Error updating post:', err);
      setError(err.response?.data?.message || 'Failed to update post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, content: e.target.value }));
  };

  const handleImageChange = (file: File | null) => {
    setFormData(prev => ({
      ...prev,
      image: file || undefined,
      removeImage: !file && !!post?.imageUrl
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Edit Post</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Textarea
            value={formData.content}
            onChange={handleContentChange}
            placeholder="What's on your mind?"
            className="min-h-[200px]"
            required
          />
        </div>
        <div>
          <ImageUpload
            onImageSelect={handleImageChange}
          />
        </div>
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/feed')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 