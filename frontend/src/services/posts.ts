import api from './api';

export interface Post {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userDisplayName: string;
  userId: string;
}

export interface CreatePostRequest {
  content: string;
}

export interface UpdatePostRequest {
  content: string;
}

export const postService = {
  async getPosts(): Promise<Post[]> {
    const response = await api.get<Post[]>('/Post');
    return response.data;
  },

  async createPost(content: string): Promise<Post> {
    const response = await api.post<Post>('/Post', { content });
    return response.data;
  },

  async updatePost(id: string, content: string): Promise<Post> {
    const response = await api.put<Post>(`/Post/${id}`, { content });
    return response.data;
  },

  async deletePost(id: string): Promise<void> {
    await api.delete(`/Post/${id}`);
  }
}; 