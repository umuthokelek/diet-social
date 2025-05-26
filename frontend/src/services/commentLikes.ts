import api from './api';

export interface LikeCount {
  count: number;
}

export interface HasLiked {
  hasLiked: boolean;
}

export interface LikeUser {
  id: string;
  displayName: string;
}

export const commentLikesService = {
  async getLikeCount(commentId: string): Promise<number> {
    try {
      const response = await api.get<LikeCount>(`/CommentLike/count/${commentId}`);
      return response.data.count;
    } catch (error) {
      console.error('Error getting comment like count:', error);
      return 0;
    }
  },

  async hasLiked(commentId: string): Promise<boolean> {
    try {
      const response = await api.get<HasLiked>(`/CommentLike/hasliked/${commentId}`);
      return response.data.hasLiked;
    } catch (error) {
      console.error('Error checking comment like status:', error);
      return false;
    }
  },

  async addLike(commentId: string): Promise<void> {
    try {
      await api.post(`/CommentLike/${commentId}`);
    } catch (error) {
      console.error('Error adding comment like:', error);
      throw new Error('Failed to like comment');
    }
  },

  async removeLike(commentId: string): Promise<void> {
    try {
      await api.delete(`/CommentLike/${commentId}`);
    } catch (error) {
      console.error('Error removing comment like:', error);
      throw new Error('Failed to unlike comment');
    }
  },

  async getUsersWhoLiked(commentId: string): Promise<LikeUser[]> {
    try {
      const response = await api.get<LikeUser[]>(`/CommentLike/users/${commentId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting users who liked comment:', error);
      return [];
    }
  }
}; 