// app/components/auth/AuthProvider.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/app/stores/authStore';
import { api } from '@/app/services/api';
import Cookies from 'js-cookie';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const { setUser, setToken, setLoading, logout } = useAuthStore();

    useEffect(() => {
        const initAuth = async () => {
            setLoading(true);
            try {
                let token = Cookies.get('auth_token');
                
                if (!token) {
                    const stored = localStorage.getItem('auth-storage');
                    if (stored) {
                        try {
                            const parsed = JSON.parse(stored);
                            if (parsed?.state?.token) {
                                token = parsed.state.token;
                            }
                        } catch (e) {
                            console.error('Error parsing localStorage:', e);
                            localStorage.removeItem('auth-storage');
                        }
                    }
                }
                
                if (token) {
                    setToken(token);
                    const response = await api.getMe();
                    if (response.success) {
                        setUser(response.data.user);
                    } else {
                        logout();
                        Cookies.remove('auth_token');
                        localStorage.removeItem('auth-storage');
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                localStorage.removeItem('auth-storage');
                Cookies.remove('auth_token');
            } finally {
                setLoading(false);
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}