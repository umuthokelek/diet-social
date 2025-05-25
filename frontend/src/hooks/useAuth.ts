import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
    id: string;
    displayName: string;
}

interface AuthState {
    user: User | null;
    loading: boolean;
}

export function useAuth() {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        loading: true
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode<{ sub: string; displayName: string }>(token);
                setAuthState({
                    user: {
                        id: decoded.sub,
                        displayName: decoded.displayName
                    },
                    loading: false
                });
            } catch (error) {
                console.error('Error decoding token:', error);
                localStorage.removeItem('token');
                setAuthState({ user: null, loading: false });
            }
        } else {
            setAuthState({ user: null, loading: false });
        }
    }, []);

    return authState;
} 