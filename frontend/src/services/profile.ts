import api from './api';

export interface Profile {
    userId: string;
    displayName: string;
    postCount: number;
    posts: Post[];
}

export interface Post {
    id: string;
    content: string;
    createdAt: string;
    userId: string;
    userDisplayName: string;
    likeCount: number;
    commentCount: number;
}

export const profileService = {
    async getUserProfile(userId: string): Promise<Profile> {
        const response = await api.get<Profile>(`Profile/${userId}`);
        return response.data;
    }
}; 