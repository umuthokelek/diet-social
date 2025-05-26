"use client";
import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { profileService, Profile } from "@/services/profile";
import { useAuth } from "@/hooks/useAuth";
import UserProfile from "@/components/UserProfile";
import { followService, FollowStatus } from "@/services/followService";

interface User {
  id: string;
  displayName?: string;
  bio?: string;
  profileImageUrl?: string;
  postCount?: number;
  followerCount?: number;
  followingCount?: number;
}

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = use(params);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user: authUser, loading: isAuthLoading } = useAuth();
  const [followStatus, setFollowStatus] = useState<FollowStatus | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setError('Invalid user ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await profileService.getUserProfile(userId);
        setProfile({
          id: data.userId,
          displayName: data.displayName,
          postCount: data.postCount,
          followerCount: 0,
          followingCount: 0
        });
      } catch (err: any) {
        console.error('Error loading profile:', err);
        if (err.response?.status === 404) {
          setError('User not found');
        } else {
          setError('Failed to load profile. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  useEffect(() => {
    if (!isAuthLoading && authUser?.id !== userId) {
      const loadFollowStatus = async () => {
        try {
          const status = await followService.getFollowStatus(userId);
          setFollowStatus(status);
          // Update profile with follow counts
          setProfile(prev => prev ? {
            ...prev,
            followerCount: status.followerCount,
            followingCount: status.followingCount
          } : null);
        } catch (err) {
          console.error('Error loading follow status:', err);
          setError('Failed to load follow status');
        }
      };

      loadFollowStatus();
    }
  }, [userId, isAuthLoading, authUser?.id]);

  const handleFollowToggle = async () => {
    if (!followStatus) return;

    try {
      setIsUpdating(true);
      setError(null);

      if (followStatus.isFollowing) {
        await followService.unfollowUser(userId);
        const newStatus = {
          ...followStatus,
          isFollowing: false,
          followerCount: followStatus.followerCount - 1
        };
        setFollowStatus(newStatus);
        setProfile(prev => prev ? {
          ...prev,
          followerCount: newStatus.followerCount
        } : null);
      } else {
        await followService.followUser(userId);
        const newStatus = {
          ...followStatus,
          isFollowing: true,
          followerCount: followStatus.followerCount + 1
        };
        setFollowStatus(newStatus);
        setProfile(prev => prev ? {
          ...prev,
          followerCount: newStatus.followerCount
        } : null);
      }
    } catch (err) {
      console.error('Error updating follow status:', err);
      setError('Failed to update follow status');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isAuthLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 px-4">
        <div className="text-red-500 text-lg text-center">{error}</div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <UserProfile
      userId={userId}
      user={profile ?? undefined}
      isCurrentUser={authUser?.id === userId}
      onFollow={handleFollowToggle}
      onUnfollow={handleFollowToggle}
      isFollowing={followStatus?.isFollowing ?? false}
    />
  );
} 