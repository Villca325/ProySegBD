// app/auth/register/vendedor/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/app/services/api';
import { Sucursal } from '@/app/types';
import { Store, Building, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const registerSchema = z.object({
    nombre_completo: z.string().min(3, 'El nombre completo debe tener al menos 3 caracteres'),
    email: z.string().email('Correo electrónico inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    password_confirmation: z.string(),
    tipo_sucursal: z.enum(['nueva', 'existente']),
    sucursal_nombre: z.string().optional(),
    sucursal_ciudad: z.string().optional(),
    sucursal_direccion: z.string().optional(),
    sucursal_telefono: z.string().optional(),
    sucursal_existente_id: z.string().optional(),
}).refine((data) => data.password === data.password_confirmation, {
    message: "Las contraseñas no coinciden",
    path: ["password_confirmation"],
}).refine((data) => {
    if (data.tipo_sucursal === 'nueva') {
        return data.sucursal_nombre && data.sucursal_ciudad;
    }
    return true;
}, {
    message: "Debes proporcionar nombre y ciudad para la nueva sucursal",
    path: ["sucursal_nombre"],
}).refine((data) => {
    if (data.tipo_sucursal === 'existente') {
        return data.sucursal_existente_id && data.sucursal_existente_id !== '';
    }
    return true;
}, {
    message: "Debes seleccionar una sucursal existente",
    path: ["sucursal_existente_id"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterVendedorPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [loadingSucursales, setLoadingSucursales] = useState(true);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        setValue,
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            tipo_sucursal: 'nueva'
        }
    });

    const tipoSucursal = watch('tipo_sucursal');

    useEffect(() => {
        fetchSucursales();
    }, []);

    const fetchSucursales = async () => {
        setLoadingSucursales(true);
        try {
            const response = await api.getPublicSucursales();
            if (response.success) {
                setSucursales(response.data);
            }
        } catch (error) {
            console.error('Error fetching sucursales:', error);
            toast.error('Error al cargar sucursales');
        } finally {
            setLoadingSucursales(false);
        }
    };

    const onSubmit = async (data: RegisterForm) => {
        setIsLoading(true);
        try {
            const payload: any = {
                nombre_completo: data.nombre_completo,
                email: data.email,
                password: data.password,
                password_confirmation: data.password_confirmation,
                tipo_sucursal: data.tipo_sucursal,
            };

            if (data.tipo_sucursal === 'nueva') {
                payload.sucursal_nombre = data.sucursal_nombre;
                payload.sucursal_ciudad = data.sucursal_ciudad;
                payload.sucursal_direccion = data.sucursal_direccion;
                payload.sucursal_telefono = data.sucursal_telefono;
            } else {
                payload.sucursal_existente_id = parseInt(data.sucursal_existente_id!);
            }

            const response = await api.solicitarRegistroVendedor(payload);
            if (response.success) {
                toast.success(response.data.mensaje || 'Solicitud enviada exitosamente');
                router.push('/login');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al enviar solicitud');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl w-full bg-white p-8 rounded-xl shadow-lg">
                <div className="mb-6">
                    <Link href="/login" className="flex items-center text-blue-600 hover:text-blue-800 mb-4">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Volver
                    </Link>
                    <div className="flex justify-center">
                        <Store className="h-12 w-12 text-blue-600" />
                    </div>
                    <h2 className="mt-4 text-center text-3xl font-extrabold text-gray-900">
                        Registro de Vendedor
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        ¿Ya tienes una cuenta?{' '}
                        <Link href="/login" className="text-blue-600 hover:text-blue-500">
                            Inicia sesión aquí
                        </Link>
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    {/* Datos personales */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">Datos Personales</h3>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre Completo *
                            </label>
                            <input
                                {...register('nombre_completo')}
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Juan Pérez"
                            />
                            {errors.nombre_completo && (
                                <p className="mt-1 text-sm text-red-600">{errors.nombre_completo.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Correo Electrónico *
                            </label>
                            <input
                                {...register('email')}
                                type="email"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="correo@ejemplo.com"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contraseña *
                            </label>
                            <div className="relative">
                                <input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirmar Contraseña *
                            </label>
                            <div className="relative">
                                <input
                                    {...register('password_confirmation')}
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400" />
                                    )}
                                </button>
                            </div>
                            {errors.password_confirmation && (
                                <p className="mt-1 text-sm text-red-600">{errors.password_confirmation.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Tipo de Sucursal */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">Información de Sucursal</h3>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                ¿Qué deseas hacer? *
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setValue('tipo_sucursal', 'nueva')}
                                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                                        tipoSucursal === 'nueva'
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <Building className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                                    <p className="font-medium">Crear nueva sucursal</p>
                                    <p className="text-xs text-gray-500 mt-1">Abre tu propia sucursal</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setValue('tipo_sucursal', 'existente')}
                                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                                        tipoSucursal === 'existente'
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <Store className="h-6 w-6 mx-auto mb-2 text-green-600" />
                                    <p className="font-medium">Unirse a sucursal existente</p>
                                    <p className="text-xs text-gray-500 mt-1">Trabaja en una sucursal ya establecida</p>
                                </button>
                            </div>
                            {errors.tipo_sucursal && (
                                <p className="mt-1 text-sm text-red-600">{errors.tipo_sucursal.message}</p>
                            )}
                        </div>

                        {tipoSucursal === 'nueva' && (
                            <div className="space-y-4 border-t border-gray-200 pt-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre de la Sucursal *
                                    </label>
                                    <input
                                        {...register('sucursal_nombre')}
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Mi Sucursal"
                                    />
                                    {errors.sucursal_nombre && (
                                        <p className="mt-1 text-sm text-red-600">{errors.sucursal_nombre.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ciudad *
                                    </label>
                                    <input
                                        {...register('sucursal_ciudad')}
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ciudad"
                                    />
                                    {errors.sucursal_ciudad && (
                                        <p className="mt-1 text-sm text-red-600">{errors.sucursal_ciudad.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Dirección
                                    </label>
                                    <input
                                        {...register('sucursal_direccion')}
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Dirección completa"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Teléfono
                                    </label>
                                    <input
                                        {...register('sucursal_telefono')}
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Número de teléfono"
                                    />
                                </div>
                            </div>
                        )}

                        {tipoSucursal === 'existente' && (
                            <div className="space-y-4 border-t border-gray-200 pt-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Selecciona una Sucursal *
                                    </label>
                                    {loadingSucursales ? (
                                        <div className="flex justify-center py-4">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                        </div>
                                    ) : sucursales.length === 0 ? (
                                        <p className="text-gray-500 text-center py-4">
                                            No hay sucursales activas disponibles
                                        </p>
                                    ) : (
                                        <select
                                            {...register('sucursal_existente_id')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Selecciona una sucursal</option>
                                            {sucursales.map((suc) => (
                                                <option key={suc.id} value={suc.id}>
                                                    {suc.nombre} - {suc.ciudad}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    {errors.sucursal_existente_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.sucursal_existente_id.message}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Enviando solicitud...' : 'Enviar Solicitud'}
                    </button>

                    <p className="text-xs text-gray-500 text-center">
                        Al enviar esta solicitud, aceptas que un administrador revise tu información.
                        Recibirás un correo cuando tu solicitud sea aprobada o rechazada.
                    </p>
                </form>
            </div>
        </div>
    );
}