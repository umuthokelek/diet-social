import api from './api';

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userDisplayName: string;
  postId: string;
}

export interface CreateCommentRequest {
  content: string;
  postId: string;
}

export interface UpdateCommentRequest {
  content: string;
  postId: string;
}

class CommentService {
  async getCommentsForPost(postId: string): Promise<Comment[]> {
    const response = await api.get<Comment[]>(`/Comment/post/${postId}`);
    return response.data;
  }

  async createComment(request: CreateCommentRequest): Promise<Comment> {
    const response = await api.post<Comment>('/Comment', request);
    return response.data;
  }

  async updateComment(commentId: string, request: UpdateCommentRequest): Promise<void> {
    await api.put(`/Comment/${commentId}`, request);
  }

  async deleteComment(commentId: string): Promise<void> {
    await api.delete(`/Comment/${commentId}`);
  }
}

export const commentService = new CommentService(); 