// app/perfil/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { api } from '@/app/services/api';
import { Usuario, Sucursal } from '@/app/types';
import { 
    User, 
    Mail, 
    Building, 
    Shield, 
    Calendar, 
    Edit, 
    Save, 
    X,
    Camera,
    Key,
    LogOut,
    CheckCircle,
    AlertCircle,
    Store,
    MapPin,
    Phone,
    Clock,
    Eye,
    EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PerfilPage() {
    const router = useRouter();
    const { user, logout, hasRole } = useAuth();
    const [perfil, setPerfil] = useState<Usuario | null>(null);
    const [sucursal, setSucursal] = useState<Sucursal | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [editForm, setEditForm] = useState({
        nombre_completo: '',
        email: ''
    });
    
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
    });
    
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchPerfil();
    }, []);

    const fetchPerfil = async () => {
        setLoading(true);
        try {
            const response = await api.getMe();
            if (response.success) {
                setPerfil(response.data.user);
                setEditForm({
                    nombre_completo: response.data.user.nombre_completo,
                    email: response.data.user.email
                });
                
                if (response.data.user.sucursal_id) {
                    try {
                        const sucursalesResponse = await api.getAdminSucursales();
                        if (sucursalesResponse.success) {
                            const sucursalEncontrada = sucursalesResponse.data.data.find(
                                (s: Sucursal) => s.id === response.data.user.sucursal_id
                            );
                            setSucursal(sucursalEncontrada || null);
                        }
                    } catch (error) {
                        console.error('Error fetching sucursal:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching perfil:', error);
            toast.error('Error al cargar información del perfil');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePerfil = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});
        
        const newErrors: Record<string, string> = {};
        if (!editForm.nombre_completo.trim()) {
            newErrors.nombre_completo = 'El nombre completo es requerido';
        }
        if (!editForm.email.trim()) {
            newErrors.email = 'El correo electrónico es requerido';
        } else if (!/\S+@\S+\.\S+/.test(editForm.email)) {
            newErrors.email = 'Correo electrónico inválido';
        }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setSubmitting(false);
            return;
        }
        
        try {
            if (perfil) {
                setPerfil({
                    ...perfil,
                    nombre_completo: editForm.nombre_completo,
                    email: editForm.email
                });
                setIsEditing(false);
                toast.success('Perfil actualizado exitosamente');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al actualizar perfil');
        } finally {
            setSubmitting(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});
        
        try {
            const response = await api.cambiarPassword(passwordForm);
            if (response.success) {
                toast.success('Contraseña actualizada exitosamente');
                setShowChangePassword(false);
                setPasswordForm({
                    current_password: '',
                    new_password: '',
                    new_password_confirmation: ''
                });
                setShowCurrentPassword(false);
                setShowNewPassword(false);
                setShowConfirmPassword(false);
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Error al cambiar contraseña';
            const errorErrors = error.response?.data?.errors;
            
            if (errorErrors) {
                setErrors(errorErrors);
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/');
        } catch (error) {
            console.error('Error logging out:', error);
            toast.error('Error al cerrar sesión');
        }
    };

    const getRolColor = (rol: string) => {
        switch (rol) {
            case 'admin':
                return 'bg-red-100 text-red-800';
            case 'vendedor':
                return 'bg-blue-100 text-blue-800';
            case 'cliente':
                return 'bg-green-100 text-green-800';
            case 'gerente':
                return 'bg-purple-100 text-purple-800';
            case 'auditor':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getRolIcon = (rol: string) => {
        switch (rol) {
            case 'admin':
                return <Shield className="h-4 w-4" />;
            case 'vendedor':
                return <Store className="h-4 w-4" />;
            case 'cliente':
                return <User className="h-4 w-4" />;
            case 'gerente':
                return <Building className="h-4 w-4" />;
            case 'auditor':
                return <Shield className="h-4 w-4" />;
            default:
                return <User className="h-4 w-4" />;
        }
    };

    const getRolNombre = (rol: string) => {
        switch (rol) {
            case 'admin':
                return 'Administrador';
            case 'vendedor':
                return 'Vendedor';
            case 'cliente':
                return 'Cliente';
            case 'gerente':
                return 'Gerente';
            case 'auditor':
                return 'Auditor';
            default:
                return rol;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando perfil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Mi Cuenta</h1>
                    <p className="text-gray-600 mt-1">
                        Gestiona tu información personal y preferencias
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sidebar - Información de perfil */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-20">
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-center">
                                <div className="relative inline-block">
                                    <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mx-auto">
                                        <span className="text-3xl font-bold text-blue-600">
                                            {perfil?.nombre_completo?.charAt(0) || 'U'}
                                        </span>
                                    </div>
                                </div>
                                <h2 className="mt-4 text-xl font-semibold text-white">
                                    {perfil?.nombre_completo}
                                </h2>
                                <p className="text-blue-100 text-sm mt-1">
                                    {perfil?.email}
                                </p>
                                <div className="mt-3">
                                    <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getRolColor(perfil?.rol || '')}`}>
                                        {getRolIcon(perfil?.rol || '')}
                                        <span>{getRolNombre(perfil?.rol || '')}</span>
                                    </span>
                                </div>
                            </div>
                            
                            <div className="p-6 border-t border-gray-200">
                                <div className="space-y-3">
                                    <div className="flex items-center text-gray-600">
                                        <Mail className="h-4 w-4 mr-3 text-gray-400" />
                                        <span className="text-sm">{perfil?.email}</span>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                                        <span className="text-sm">
                                            Miembro desde {perfil?.created_at ? format(new Date(perfil.created_at), 'MMMM yyyy', { locale: es }) : 'Recientemente'}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <Shield className="h-4 w-4 mr-3 text-gray-400" />
                                        <span className="text-sm">
                                            Estado: {perfil?.activo ? (
                                                <span className="text-green-600">Activo</span>
                                            ) : (
                                                <span className="text-red-600">Inactivo</span>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>Cerrar Sesión</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content - Edición de perfil */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Información de Sucursal (para vendedores, gerentes) */}
                        {hasRole(['vendedor', 'gerente']) && sucursal && (
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <Store className="h-5 w-5 text-blue-600 mr-2" />
                                        Mi Sucursal
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Nombre</p>
                                            <p className="font-medium text-gray-900">{sucursal.nombre}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Ciudad</p>
                                            <p className="font-medium text-gray-900">{sucursal.ciudad}</p>
                                        </div>
                                        {sucursal.direccion && (
                                            <div>
                                                <p className="text-sm text-gray-500">Dirección</p>
                                                <p className="font-medium text-gray-900">{sucursal.direccion}</p>
                                            </div>
                                        )}
                                        {sucursal.telefono && (
                                            <div>
                                                <p className="text-sm text-gray-500">Teléfono</p>
                                                <p className="font-medium text-gray-900">{sucursal.telefono}</p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm text-gray-500">Estado</p>
                                            <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                sucursal.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {sucursal.activa ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Editar Perfil */}
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <User className="h-5 w-5 text-blue-600 mr-2" />
                                    Información Personal
                                </h3>
                                {!isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                                    >
                                        <Edit className="h-4 w-4" />
                                        <span className="text-sm">Editar</span>
                                    </button>
                                )}
                            </div>
                            
                            <div className="p-6">
                                {isEditing ? (
                                    <form onSubmit={handleUpdatePerfil} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nombre Completo
                                            </label>
                                            <input
                                                type="text"
                                                value={editForm.nombre_completo}
                                                onChange={(e) => setEditForm({ ...editForm, nombre_completo: e.target.value })}
                                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                    errors.nombre_completo ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            />
                                            {errors.nombre_completo && (
                                                <p className="mt-1 text-sm text-red-600">{errors.nombre_completo}</p>
                                            )}
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Correo Electrónico
                                            </label>
                                            <input
                                                type="email"
                                                value={editForm.email}
                                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                    errors.email ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            />
                                            {errors.email && (
                                                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                            )}
                                        </div>
                                        
                                        <div className="flex justify-end space-x-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setEditForm({
                                                        nombre_completo: perfil?.nombre_completo || '',
                                                        email: perfil?.email || ''
                                                    });
                                                    setErrors({});
                                                }}
                                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={submitting}
                                                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                            >
                                                {submitting ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                ) : (
                                                    <Save className="h-4 w-4" />
                                                )}
                                                <span>Guardar Cambios</span>
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Nombre Completo</p>
                                                <p className="font-medium text-gray-900">{perfil?.nombre_completo}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Correo Electrónico</p>
                                                <p className="font-medium text-gray-900">{perfil?.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Rol</p>
                                                <p className="font-medium text-gray-900 capitalize">{perfil?.rol}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Fecha de Registro</p>
                                                <p className="font-medium text-gray-900">
                                                    {perfil?.created_at ? format(new Date(perfil.created_at), 'dd/MM/yyyy', { locale: es }) : '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cambiar Contraseña */}
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <Key className="h-5 w-5 text-blue-600 mr-2" />
                                    Seguridad
                                </h3>
                                {!showChangePassword && (
                                    <button
                                        onClick={() => setShowChangePassword(true)}
                                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                                    >
                                        <Edit className="h-4 w-4" />
                                        <span className="text-sm">Cambiar Contraseña</span>
                                    </button>
                                )}
                            </div>
                            
                            <div className="p-6">
                                {showChangePassword ? (
                                    <form onSubmit={handleChangePassword} className="space-y-4">
                                        {/* Contraseña Actual */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Contraseña Actual
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showCurrentPassword ? 'text' : 'password'}
                                                    value={passwordForm.current_password}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                                                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                        errors.current_password ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                    placeholder="Ingresa tu contraseña actual"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                                >
                                                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            {errors.current_password && (
                                                <p className="mt-1 text-sm text-red-600">{errors.current_password}</p>
                                            )}
                                        </div>
                                        
                                        {/* Nueva Contraseña */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nueva Contraseña
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showNewPassword ? 'text' : 'password'}
                                                    value={passwordForm.new_password}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                                                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                        errors.new_password ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                    placeholder="Ingresa tu nueva contraseña (mínimo 6 caracteres)"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                                >
                                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            {errors.new_password && (
                                                <p className="mt-1 text-sm text-red-600">{errors.new_password}</p>
                                            )}
                                        </div>
                                        
                                        {/* Confirmar Nueva Contraseña */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Confirmar Nueva Contraseña
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    value={passwordForm.new_password_confirmation}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirmation: e.target.value })}
                                                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                        errors.new_password_confirmation ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                    placeholder="Confirma tu nueva contraseña"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                                >
                                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            {errors.new_password_confirmation && (
                                                <p className="mt-1 text-sm text-red-600">{errors.new_password_confirmation}</p>
                                            )}
                                        </div>
                                        
                                        {/* Requisitos de contraseña */}
                                        <div className="bg-blue-50 p-3 rounded-lg">
                                            <p className="text-xs text-blue-800 font-medium mb-1">Requisitos de la contraseña:</p>
                                            <ul className="text-xs text-blue-700 space-y-1">
                                                <li>• Mínimo 6 caracteres</li>
                                                <li>• Puede incluir letras, números y caracteres especiales</li>
                                            </ul>
                                        </div>
                                        
                                        <div className="flex justify-end space-x-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowChangePassword(false);
                                                    setPasswordForm({
                                                        current_password: '',
                                                        new_password: '',
                                                        new_password_confirmation: ''
                                                    });
                                                    setErrors({});
                                                    setShowCurrentPassword(false);
                                                    setShowNewPassword(false);
                                                    setShowConfirmPassword(false);
                                                }}
                                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={submitting}
                                                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                            >
                                                {submitting ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                ) : (
                                                    <Save className="h-4 w-4" />
                                                )}
                                                <span>Actualizar Contraseña</span>
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500">Contraseña</p>
                                            <p className="text-gray-900">••••••••</p>
                                        </div>
                                        <div className="flex items-center space-x-2 text-sm text-green-600">
                                            <CheckCircle className="h-4 w-4" />
                                            <span>Protegida</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Información de Sesión */}
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <Clock className="h-5 w-5 text-blue-600 mr-2" />
                                    Información de Sesión
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Estado de la Sesión</p>
                                        <p className="text-green-600 font-medium">Activa</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Última actividad</p>
                                        <p className="text-gray-900">{format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}