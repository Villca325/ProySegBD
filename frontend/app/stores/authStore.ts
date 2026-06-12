// app/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Usuario } from '@/app/types';

interface AuthState {
    user: Usuario | null;
    token: string | null;
    isLoading: boolean;
    setUser: (user: Usuario | null) => void;
    setToken: (token: string | null) => void;
    setLoading: (isLoading: boolean) => void;
    logout: () => void;
    isAuthenticated: () => boolean;
    hasRole: (roles: string | string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isLoading: false,
            setUser: (user) => set({ user }),
            setToken: (token) => set({ token }),
            setLoading: (isLoading) => set({ isLoading }),
            logout: () => {
                set({ user: null, token: null });
            },
            isAuthenticated: () => {
                const { token } = get();
                return !!token;
            },
            hasRole: (roles) => {
                const { user } = get();
                if (!user) return false;
                const roleList = Array.isArray(roles) ? roles : [roles];
                return roleList.includes(user.rol);
            },
        }),
        {
            name: 'auth-storage',
            getStorage: () => ({
                getItem: (name) => {
                    const value = localStorage.getItem(name);
                    if (!value) return null;
                    try {
                        return JSON.parse(value);
                    } catch {
                        return null;
                    }
                },
                setItem: (name, value) => {
                    localStorage.setItem(name, JSON.stringify(value));
                },
                removeItem: (name) => {
                    localStorage.removeItem(name);
                },
            }),
        }
    )
);