'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import api from '@/services/api';

interface JwtPayload {
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": string;
}

interface Post {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface EditPostForm {
  content: string;
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
        const response = await api.get<Post>(`/Post/${postId}`);
        const postData = response.data;
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
        if (err?.response?.status === 404) {
          setError('Post not found');
        } else if (err?.response?.status === 401) {
          setError('Please sign in to edit posts');
          router.push('/login');
        } else {
          setError('Failed to load post. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [postId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      setError('Content cannot be empty');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.put(`/Post/${postId}`, formData);
      router.push('/feed');
    } catch (err: any) {
      console.error('Error updating post:', err);
      if (err?.response?.status === 403) {
        setError('You do not have permission to edit this post');
      } else if (err?.response?.status === 401) {
        setError('Please sign in to edit posts');
        router.push('/login');
      } else {
        setError('Failed to update post. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          Post not found
        </div>
      </div>
    );
  }

  // Only render the form if the user owns the post
  if (post && currentUserId && post.userId !== currentUserId) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          You do not have permission to edit this post.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Post</h1>
        <p className="text-sm text-gray-500 mt-1">
          Last updated: {new Date(post.updatedAt).toLocaleString()}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={5}
            placeholder="What's on your mind?"
            maxLength={500}
          />
          <p className="text-sm text-gray-500 mt-1">
            {formData.content.length}/500 characters
          </p>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting || !formData.content.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/feed')}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
} 