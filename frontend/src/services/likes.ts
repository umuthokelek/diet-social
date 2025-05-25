import api from './api';

export interface LikeCount {
  count: number;
}

export interface HasLiked {
  hasLiked: boolean;
}

export const likesService = {
  async getLikeCount(postId: string): Promise<number> {
    const response = await api.get<LikeCount>(`/Like/count/${postId}`);
    return response.data.count;
  },

  async hasLiked(postId: string): Promise<boolean> {
    const response = await api.get<HasLiked>(`/Like/hasliked/${postId}`);
    return response.data.hasLiked;
  },

  async addLike(postId: string): Promise<void> {
    await api.post(`/Like/${postId}`);
  },

  async removeLike(postId: string): Promise<void> {
    await api.delete(`/Like/${postId}`);
  },
}; 