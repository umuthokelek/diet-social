import api from './api';

export interface Post {
  id: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userDisplayName: string;
  likeCount: number;
  commentCount: number;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  userDisplayName: string;
}

export interface CreatePostRequest {
  content: string;
  image?: File;
}

export interface UpdatePostRequest {
  content: string;
  image?: File;
  removeImage?: boolean;
}

export const postService = {
  async getPosts(): Promise<Post[]> {
    const response = await api.get<Post[]>('/Post');
    return response.data;
  },

  async getFollowingPosts(): Promise<Post[]> {
    const response = await api.get<Post[]>('/Post/following');
    return response.data;
  },

  async getPost(id: string): Promise<Post> {
    const response = await api.get<Post>(`/Post/${id}`);
    return response.data;
  },

  async createPost(data: CreatePostRequest): Promise<Post> {
    // Create FormData object
    const formData = new FormData();
    formData.append('content', data.content);
    
    if (data.image) {
      formData.append('image', data.image);
    }

    // Log the request payload for debugging
    console.log('Creating post with data:', {
      content: data.content,
      hasImage: !!data.image
    });

    try {
      const response = await api.post<Post>('/Post', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creating post:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to create post');
    }
  },

  async updatePost(id: string, data: UpdatePostRequest): Promise<Post> {
    const formData = new FormData();
    formData.append('content', data.content);
    
    if (data.image) {
      formData.append('image', data.image);
    }
    
    if (data.removeImage) {
      formData.append('removeImage', 'true');
    }

    try {
      const response = await api.put<Post>(`/Post/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating post:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to update post');
    }
  },

  async deletePost(id: string): Promise<void> {
    try {
      await api.delete(`/Post/${id}`);
    } catch (error: any) {
      console.error('Error deleting post:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to delete post');
    }
  }
}; 