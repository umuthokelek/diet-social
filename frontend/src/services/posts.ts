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
}

export interface CreatePostRequest {
  content: string;
  image?: File;
}

export interface UpdatePostRequest {
  content: string;
}

export const postService = {
  async getPosts(): Promise<Post[]> {
    const response = await api.get<Post[]>('/Post');
    return response.data;
  },

  async createPost(data: FormData): Promise<Post> {
    const response = await api.post<Post>('/Post', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async updatePost(id: string, data: FormData): Promise<Post> {
    const response = await api.put<Post>(`/Post/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deletePost(id: string): Promise<void> {
    await api.delete(`/Post/${id}`);
  }
}; 