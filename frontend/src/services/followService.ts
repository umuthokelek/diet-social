import api from './api';

export interface FollowStatus {
    isFollowing: boolean;
    followerCount: number;
    followingCount: number;
}

export interface User {
    id: string;
    displayName: string;
    createdAt: string;
}

export const followService = {
    async followUser(userId: string): Promise<void> {
        await api.post(`/Follow/${userId}`);
    },

    async unfollowUser(userId: string): Promise<void> {
        await api.delete(`/Follow/${userId}`);
    },

    async getFollowers(userId: string): Promise<User[]> {
        const response = await api.get<User[]>(`/Follow/Followers/${userId}`);
        return response.data;
    },

    async getFollowing(userId: string): Promise<User[]> {
        const response = await api.get<User[]>(`/Follow/Following/${userId}`);
        return response.data;
    },

    async getFollowStatus(userId: string): Promise<FollowStatus> {
        const response = await api.get<FollowStatus>(`/Follow/Status/${userId}`);
        return response.data;
    }
}; 