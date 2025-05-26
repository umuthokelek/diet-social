import api from './api';

export interface User {
  id: string;
  displayName: string;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: User;
  likes?: { id: string }[];
}

export interface CreateCommentRequest {
  content: string;
  postId: string;
}

export interface UpdateCommentRequest {
  content: string;
  postId: string;
}

export const commentService = {
  async getComments(postId: string): Promise<Comment[]> {
    const { data } = await api.get<Comment[]>(`/api/Comment/${postId}`);
    return data;
  },

  async createComment(postId: string, content: string): Promise<Comment> {
    const { data } = await api.post<Comment>(`/api/Comment/${postId}`, { content });
    return data;
  },

  async updateComment(commentId: string, content: string): Promise<Comment> {
    const { data } = await api.put<Comment>(`/api/Comment/${commentId}`, { content });
    return data;
  },

  async deleteComment(commentId: string): Promise<void> {
    await api.delete(`/api/Comment/${commentId}`);
  }
}; 