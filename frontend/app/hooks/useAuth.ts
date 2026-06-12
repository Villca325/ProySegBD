// app/hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/app/stores/authStore';
import { api } from '@/app/services/api';
import toast from 'react-hot-toast';

export const useAuth = () => {
    const router = useRouter();
    const { user, token, setUser, setToken, setLoading, logout, isAuthenticated, hasRole } = useAuthStore();
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const initAuth = async () => {
            setLoading(true);
            try {
                const storedToken = localStorage.getItem('auth-storage');
                if (storedToken) {
                    const parsed = JSON.parse(storedToken);
                    if (parsed.state.token) {
                        const response = await api.getMe();
                        if (response.success) {
                            setUser(response.data.user);
                            setToken(parsed.state.token);
                        } else {
                            logout();
                        }
                    }
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
                logout();
            } finally {
                setLoading(false);
                setIsInitialized(true);
            }
        };

        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            const response = await api.login(email, password);
            if (response.success) {
                const { user, token } = response.data;
                setUser(user);
                setToken(token);
                toast.success('Bienvenido ' + user.nombre_completo);
               
                // Redirigir según rol
                if (user.rol === 'admin') {
                    router.push('/admin/dashboard');
                } else if (user.rol === 'vendedor') {
                    router.push('/dashboard');
                } else if (user.rol === 'auditor') {
                    router.push('/audit/dashboard');
                } else if (user.rol === 'cliente') {
                    router.push('/productos');
                } else {
                    router.push('/dashboard');
                }
                return true;
            }
            return false;
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al iniciar sesión');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logoutUser = async () => {
        setLoading(true);
        try {
            await api.logout();
            logout();
            toast.success('Sesión cerrada correctamente');
            router.push('/');
        } catch (error) {
            console.error('Error logging out:', error);
            logout();
            router.push('/');
        } finally {
            setLoading(false);
        }
    };

    return {
        user,
        token,
        isAuthenticated: isAuthenticated(),
        isLoading: !isInitialized,
        hasRole,
        login,
        logout: logoutUser,
    };
};