'use client';

import { UserProfile } from '@/components/UserProfile';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { use } from 'react';

interface ProfilePageProps {
    params: Promise<{
        userId: string;
    }>;
}

export default function ProfilePage({ params }: ProfilePageProps) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { userId } = use(params);

    useEffect(() => {
        console.log('Profile page mounted with userId:', userId);

        if (!loading && !user) {
            console.log('User not authenticated, redirecting to login');
            router.push('/login');
            return;
        }

        if (!userId) {
            console.log('No userId provided, redirecting to home');
            router.push('/');
            return;
        }

        // Validate userId format
        try {
            const guid = userId.toLowerCase();
            if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(guid)) {
                console.log('Invalid userId format:', userId);
                router.push('/');
                return;
            }
        } catch (error) {
            console.error('Error validating userId:', error);
            router.push('/');
            return;
        }
    }, [loading, user, router, userId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!userId) {
        return null;
    }

    return <UserProfile userId={userId} />;
} 