// app/admin/vendedores/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { api } from '@/app/services/api';
import { Usuario, Sucursal } from '@/app/types';
import { Users, Power, Search, Store, Mail, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VendedoresPage() {
    const { hasRole } = useAuth();
    const [vendedores, setVendedores] = useState<Usuario[]>([]);
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sucursalFilter, setSucursalFilter] = useState('');
    const [activoFilter, setActivoFilter] = useState('');

    useEffect(() => {
        fetchVendedores();
        fetchSucursales();
    }, [search, sucursalFilter, activoFilter]);

    const fetchVendedores = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (search) params.search = search;
            if (sucursalFilter) params.sucursal_id = sucursalFilter;
            if (activoFilter !== '') params.activo = activoFilter === 'true';
            
            const response = await api.getAdminVendedores(params);
            if (response.success) {
                setVendedores(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching vendedores:', error);
            toast.error('Error al cargar vendedores');
        } finally {
            setLoading(false);
        }
    };

    const fetchSucursales = async () => {
        try {
            const response = await api.getAdminSucursales();
            if (response.success) {
                setSucursales(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching sucursales:', error);
        }
    };

    const handleToggleActivo = async (id: number, activo: boolean) => {
        try {
            const response = await api.toggleVendedor(id);
            if (response.success) {
                toast.success(`Vendedor ${response.data.activo ? 'activado' : 'desactivado'} exitosamente`);
                fetchVendedores();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al cambiar estado');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Vendedores</h1>
                    <p className="text-gray-600 mt-1">Gestiona los vendedores del sistema</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <select
                            value={sucursalFilter}
                            onChange={(e) => setSucursalFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Todas las sucursales</option>
                            {sucursales.map((suc) => (
                                <option key={suc.id} value={suc.id}>{suc.nombre}</option>
                            ))}
                        </select>
                        <select
                            value={activoFilter}
                            onChange={(e) => setActivoFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Todos</option>
                            <option value="true">Activos</option>
                            <option value="false">Inactivos</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : vendedores.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No hay vendedores registrados</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Vendedor
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Sucursal
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Estado
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Registro
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {vendedores.map((vendedor) => (
                                        <tr key={vendedor.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <UserCheck className="h-5 w-5 text-gray-400 mr-3" />
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {vendedor.nombre_completo}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Mail className="h-4 w-4 mr-2" />
                                                    {vendedor.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Store className="h-4 w-4 mr-2" />
                                                    {vendedor.sucursal?.nombre || 'Sin sucursal'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    vendedor.activo 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {vendedor.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {vendedor.created_at ? new Date(vendedor.created_at).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleToggleActivo(vendedor.id, vendedor.activo)}
                                                    className={`inline-flex items-center space-x-1 px-3 py-1 rounded-md ${
                                                        vendedor.activo 
                                                            ? 'text-red-600 hover:bg-red-50' 
                                                            : 'text-green-600 hover:bg-green-50'
                                                    }`}
                                                >
                                                    <Power className="h-4 w-4" />
                                                    <span>{vendedor.activo ? 'Desactivar' : 'Activar'}</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}