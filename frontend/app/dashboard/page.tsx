// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { api } from '@/app/services/api';
import { Producto, Venta } from '@/app/types';
import { Package, ShoppingCart, TrendingUp, AlertCircle, Plus } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function VendedorDashboardPage() {
    const { user } = useAuth();
    const [productos, setProductos] = useState<Producto[]>([]);
    const [ventas, setVentas] = useState<Venta[]>([]);
    const [estadisticas, setEstadisticas] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [productosRes, ventasRes, statsRes] = await Promise.all([
                api.getProductos(),
                api.getVentas(),
                api.getEstadisticasVentas()
            ]);

            if (productosRes.success) setProductos(productosRes.data.data);
            if (ventasRes.success) setVentas(ventasRes.data.data);
            if (statsRes.success) setEstadisticas(statsRes.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Error al cargar datos del dashboard');
        } finally {
            setLoading(false);
        }
    };

    const statsCards = [
        {
            title: 'Mis Productos',
            value: productos.length,
            icon: Package,
            color: 'bg-blue-500',
            href: '/productos'
        },
        {
            title: 'Mis Ventas',
            value: ventas.length,
            icon: ShoppingCart,
            color: 'bg-green-500',
            href: '/ventas'
        },
        {
            title: 'Total Facturado',
            value: `$${parseFloat(estadisticas?.total_facturado)?.toFixed(2) || '0'}`,
            icon: TrendingUp,
            color: 'bg-purple-500',
            href: '/ventas'
        },
        {
            title: 'Productos Sin Stock',
            value: productos.filter(p => p.stock === 0).length,
            icon: AlertCircle,
            color: 'bg-orange-500',
            href: '/productos'
        },
    ];

    const productosBajoStock = productos.filter(p => p.stock > 0 && p.stock < 10);

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
                    <h1 className="text-3xl font-bold text-gray-900">
                        Dashboard de Vendedor
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Bienvenido, {user?.nombre_completo}
                    </p>
                    {user?.sucursal && (
                        <p className="text-sm text-gray-500 mt-1">
                            Sucursal: {user.sucursal.nombre} - {user.sucursal.ciudad}
                        </p>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {statsCards.map((stat) => (
                        <Link
                            key={stat.title}
                            href={stat.href}
                            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">{stat.title}</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                                </div>
                                <div className={`${stat.color} p-3 rounded-full`}>
                                    <stat.icon className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link
                            href="/productos"
                            className="flex items-center justify-center space-x-2 bg-blue-50 text-blue-700 p-4 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                            <Plus className="h-5 w-5" />
                            <span>Agregar Nuevo Producto</span>
                        </Link>
                        <Link
                            href="/ventas"
                            className="flex items-center justify-center space-x-2 bg-green-50 text-green-700 p-4 rounded-lg hover:bg-green-100 transition-colors"
                        >
                            <ShoppingCart className="h-5 w-5" />
                            <span>Ver Mis Ventas</span>
                        </Link>
                    </div>
                </div>

                {/* Productos con Bajo Stock */}
                {productosBajoStock.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                            <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
                            Productos con Bajo Stock
                        </h2>
                        <div className="space-y-3">
                            {productosBajoStock.map((producto) => (
                                <div key={producto.id} className="flex justify-between items-center border-b border-gray-200 pb-3">
                                    <div>
                                        <p className="font-medium text-gray-900">{producto.nombre}</p>
                                        <p className="text-sm text-gray-500">Stock actual: {producto.stock} unidades</p>
                                    </div>
                                    <Link
                                        href={`/productos?edit=${producto.id}`}
                                        className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                        Actualizar stock
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Últimas Ventas */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Últimas Ventas</h2>
                    {ventas.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No hay ventas registradas</p>
                    ) : (
                        <div className="space-y-3">
                            {ventas.slice(0, 5).map((venta) => (
                                <div key={venta.venta_id} className="flex justify-between items-center border-b border-gray-200 pb-3">
                                    <div>
                                        <p className="font-medium text-gray-900">Venta #{venta.venta_id}</p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(venta.fecha).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-blue-600">${parseFloat(venta.total).toFixed(2)}</p>
                                        <p className="text-xs text-gray-500">{venta.estado}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {ventas.length > 0 && (
                        <div className="mt-4 text-center">
                            <Link href="/ventas" className="text-blue-600 hover:text-blue-800 text-sm">
                                Ver todas las ventas →
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}