import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { profileService, Profile } from '@/services/profile';
import { PostCard } from '@/components/PostCard';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { followService, FollowStatus } from '@/services/followService';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

interface UserProfileProps {
    userId: string;
    displayName: string;
    createdAt: string;
}

export function UserProfile({ userId, displayName, createdAt }: UserProfileProps) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { user, loading: isAuthLoading } = useAuth();
    const [followStatus, setFollowStatus] = useState<FollowStatus | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Debug logs for auth state
    console.log('Auth state:', {
        isAuthLoading,
        currentUserId: user?.id,
        profileUserId: userId,
        hasUser: !!user
    });

    // Only compute isOwnProfile when auth is loaded and we have both IDs
    const isOwnProfile = !isAuthLoading && user?.id && userId ? user.id === userId : false;

    console.log('Profile visibility:', {
        isAuthLoading,
        isOwnProfile,
        shouldShowFollowButton: !isAuthLoading && !isOwnProfile
    });

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
                setProfile(data);
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
        // Only fetch follow status if auth is loaded and we're not on own profile
        if (!isAuthLoading && !isOwnProfile) {
            const loadFollowStatus = async () => {
                try {
                    const status = await followService.getFollowStatus(userId);
                    setFollowStatus(status);
                } catch (err) {
                    console.error('Error loading follow status:', err);
                    setError('Failed to load follow status');
                }
            };

            loadFollowStatus();
        }
    }, [userId, isAuthLoading, isOwnProfile]);

    const handleFollowToggle = async () => {
        // Double-check we're not on own profile before making API call
        if (isOwnProfile || !followStatus) {
            console.log('Prevented follow action:', { isOwnProfile, hasFollowStatus: !!followStatus });
            return;
        }

        try {
            setIsUpdating(true);
            setError(null);

            if (followStatus.isFollowing) {
                await followService.unfollowUser(userId);
                setFollowStatus(prev => prev ? {
                    ...prev,
                    isFollowing: false,
                    followerCount: prev.followerCount - 1
                } : null);
            } else {
                await followService.followUser(userId);
                setFollowStatus(prev => prev ? {
                    ...prev,
                    isFollowing: true,
                    followerCount: prev.followerCount + 1
                } : null);
            }
        } catch (err) {
            console.error('Error updating follow status:', err);
            setError('Failed to update follow status');
        } finally {
            setIsUpdating(false);
        }
    };

    // Show loading state while auth is being checked
    if (isAuthLoading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 px-4">
                <div className="text-red-500 text-lg text-center">{error || 'Profile not found'}</div>
                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    // Debug log for follow button visibility
    console.log('Follow button visibility:', {
        isAuthLoading,
        isOwnProfile,
        hasFollowStatus: !!followStatus,
        shouldShowButton: !isAuthLoading && !isOwnProfile && !!followStatus
    });

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">
                            {isOwnProfile ? (
                                'Your Profile'
                            ) : (
                                <Link
                                    href={`/profile/${profile.userId}`}
                                    className="hover:text-blue-600 hover:underline transition-colors"
                                >
                                    {profile.displayName}
                                </Link>
                            )}
                        </h1>
                        <div className="space-y-1">
                            <p className="text-gray-600">
                                {profile.postCount} {profile.postCount === 1 ? 'post' : 'posts'}
                            </p>
                            {followStatus && (
                                <p className="text-gray-600">
                                    {followStatus.followerCount} Followers · {followStatus.followingCount} Following
                                </p>
                            )}
                        </div>
                    </div>
                    {!isAuthLoading && !isOwnProfile && followStatus && (
                        <Button
                            onClick={handleFollowToggle}
                            disabled={isUpdating}
                            variant={followStatus.isFollowing ? "outline" : "default"}
                            className="min-w-[100px]"
                        >
                            {isUpdating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : followStatus.isFollowing ? (
                                'Unfollow'
                            ) : (
                                'Follow'
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {profile.posts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    {isOwnProfile ? "You haven't posted anything yet." : "This user hasn't posted anything yet."}
                </div>
            ) : (
                <div className="space-y-6">
                    {profile.posts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={{
                                id: post.id,
                                content: post.content,
                                createdAt: post.createdAt,
                                userId: post.userId,
                                userDisplayName: post.userDisplayName,
                                likeCount: post.likeCount,
                                commentCount: post.commentCount
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
} 