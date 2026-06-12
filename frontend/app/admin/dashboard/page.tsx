// app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { api } from '@/app/services/api';
import { Users, Store, Package, ShoppingCart, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

interface Estadisticas {
    usuarios: {
        total: number;
        clientes: number;
        vendedores: number;
        vendedores_activos: number;
        gerentes: number;
        auditores: number;
        admins: number;
    };
    sucursales: {
        total: number;
        activas: number;
        inactivas: number;
    };
    solicitudes: {
        pendientes: number;
        aprobadas: number;
        rechazadas: number;
    };
    productos: {
        total: number;
        activos: number;
        sin_stock: number;
    };
    ventas: {
        total: number;
        total_facturado: string;
        promedio_venta: string;
    };
}

export default function AdminDashboardPage() {
    const { user } = useAuth();
    const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEstadisticas();
    }, []);

    const fetchEstadisticas = async () => {
        setLoading(true);
        try {
            const response = await api.getEstadisticasGenerales();
            if (response.success) {
                setEstadisticas(response.data);
            }
        } catch (error) {
            console.error('Error fetching estadisticas:', error);
        } finally {
            setLoading(false);
        }
    };

    const statsCards = [
        {
            title: 'Usuarios',
            value: estadisticas?.usuarios.total || 0,
            icon: Users,
            color: 'bg-blue-500',
            detail: `${estadisticas?.usuarios.clientes || 0} clientes, ${estadisticas?.usuarios.vendedores || 0} vendedores`
        },
        {
            title: 'Sucursales',
            value: estadisticas?.sucursales.total || 0,
            icon: Store,
            color: 'bg-green-500',
            detail: `${estadisticas?.sucursales.activas || 0} activas`
        },
        {
            title: 'Productos',
            value: estadisticas?.productos.total || 0,
            icon: Package,
            color: 'bg-purple-500',
            detail: `${estadisticas?.productos.activos || 0} activos`
        },
        {
            title: 'Ventas',
            value: estadisticas?.ventas.total || 0,
            icon: ShoppingCart,
            color: 'bg-orange-500',
            detail: `$${parseFloat(estadisticas?.ventas.total_facturado).toFixed(2) || 0} facturado`
        },
    ];

    const solicitudCards = [
        {
            title: 'Pendientes',
            value: estadisticas?.solicitudes.pendientes || 0,
            icon: Clock,
            color: 'bg-yellow-500',
            href: '/admin/solicitudes?estado=pendiente'
        },
        {
            title: 'Aprobadas',
            value: estadisticas?.solicitudes.aprobadas || 0,
            icon: CheckCircle,
            color: 'bg-green-500',
            href: '/admin/solicitudes?estado=aprobada'
        },
        {
            title: 'Rechazadas',
            value: estadisticas?.solicitudes.rechazadas || 0,
            icon: XCircle,
            color: 'bg-red-500',
            href: '/admin/solicitudes?estado=rechazada'
        },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard de Administración</h1>
                    <p className="text-gray-600 mt-1">
                        Bienvenido, {user?.nombre_completo}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {statsCards.map((stat) => (
                        <div key={stat.title} className="bg-white rounded-lg shadow-md p-6">
                            {/* <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">{stat.title}</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                                    <p className="text-xs text-gray-400 mt-2">{stat.detail}</p>
                                </div>
                                <div className={`${stat.color} p-3 rounded-full`}>
                                    <stat.icon className="h-6 w-6 text-white" />
                                </div>
                            </div> */}
                        </div>
                    ))}
                </div>

                {/* Solicitudes Section */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Solicitudes de Vendedores</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {solicitudCards.map((card) => (
                            <a
                                key={card.title}
                                href={card.href}
                                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">{card.title}</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                                    </div>
                                    <div className={`${card.color} p-3 rounded-full`}>
                                        <card.icon className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <a
                            href="/admin/solicitudes"
                            className="flex items-center justify-center space-x-2 bg-blue-50 text-blue-700 p-4 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                            <Clock className="h-5 w-5" />
                            <span>Revisar Solicitudes</span>
                        </a>
                        <a
                            href="/admin/sucursales"
                            className="flex items-center justify-center space-x-2 bg-green-50 text-green-700 p-4 rounded-lg hover:bg-green-100 transition-colors"
                        >
                            <Store className="h-5 w-5" />
                            <span>Gestionar Sucursales</span>
                        </a>
                        <a
                            href="/admin/vendedores"
                            className="flex items-center justify-center space-x-2 bg-purple-50 text-purple-700 p-4 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                            <Users className="h-5 w-5" />
                            <span>Gestionar Vendedores</span>
                        </a>
                    </div>
                </div>

                {/* Ventas Section */}
                {estadisticas?.ventas.total_facturado && (
                    <div className="mt-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100">Total Facturado</p>
                                <p className="text-4xl font-bold mt-1">
                                    ${parseFloat(estadisticas.ventas.total_facturado).toFixed(2)}
                                </p>
                                <p className="text-blue-100 mt-2">
                                    Promedio por venta: ${parseFloat(estadisticas.ventas.promedio_venta)?.toFixed(2) || 0}
                                </p>
                            </div>
                            <TrendingUp className="h-16 w-16 text-blue-200" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}