// app/admin/sucursales/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { api } from '@/app/services/api';
import { Sucursal } from '@/app/types';
import { Store, Plus, Edit, Trash2, Power, MapPin, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SucursalesPage() {
    const { hasRole } = useAuth();
    const [sucursales, setSucursales] = useState<Sucursal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null);
    const [formData, setFormData] = useState({
        nombre: '',
        ciudad: '',
        direccion: '',
        telefono: '',
        activa: true
    });

    useEffect(() => {
        fetchSucursales();
    }, []);

    const fetchSucursales = async () => {
        setLoading(true);
        try {
            const response = await api.getAdminSucursales();
            if (response.success) {
                setSucursales(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching sucursales:', error);
            toast.error('Error al cargar sucursales');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            if (editingSucursal) {
                const response = await api.actualizarSucursal(editingSucursal.id, formData);
                if (response.success) {
                    toast.success('Sucursal actualizada exitosamente');
                    setShowModal(false);
                    fetchSucursales();
                }
            } else {
                const response = await api.crearSucursal(formData);
                if (response.success) {
                    toast.success('Sucursal creada exitosamente');
                    setShowModal(false);
                    fetchSucursales();
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar sucursal');
        }
    };

    const handleToggleActiva = async (id: number, activa: boolean) => {
        try {
            const response = await api.toggleSucursal(id);
            if (response.success) {
                toast.success(`Sucursal ${response.data.activa ? 'activada' : 'desactivada'} exitosamente`);
                fetchSucursales();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al cambiar estado');
        }
    };

    const openCreateModal = () => {
        setEditingSucursal(null);
        setFormData({
            nombre: '',
            ciudad: '',
            direccion: '',
            telefono: '',
            activa: true
        });
        setShowModal(true);
    };

    const openEditModal = (sucursal: Sucursal) => {
        setEditingSucursal(sucursal);
        setFormData({
            nombre: sucursal.nombre,
            ciudad: sucursal.ciudad,
            direccion: sucursal.direccion || '',
            telefono: sucursal.telefono || '',
            activa: sucursal.activa
        });
        setShowModal(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Sucursales</h1>
                        <p className="text-gray-600 mt-1">Gestiona las sucursales del sistema</p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Nueva Sucursal</span>
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : sucursales.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No hay sucursales registradas</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sucursales.map((sucursal) => (
                            <div key={sucursal.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                <div className={`h-2 ${sucursal.activa ? 'bg-green-500' : 'bg-red-500'}`} />
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center space-x-2">
                                            <Store className="h-6 w-6 text-blue-600" />
                                            <h3 className="text-lg font-semibold text-gray-900">{sucursal.nombre}</h3>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => openEditModal(sucursal)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleToggleActiva(sucursal.id, sucursal.activa)}
                                                className={`${sucursal.activa ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                                            >
                                                <Power className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center space-x-2 text-gray-600">
                                            <MapPin className="h-4 w-4" />
                                            <span>{sucursal.ciudad}</span>
                                        </div>
                                        {sucursal.direccion && (
                                            <p className="text-gray-500 ml-6">{sucursal.direccion}</p>
                                        )}
                                        {sucursal.telefono && (
                                            <div className="flex items-center space-x-2 text-gray-600">
                                                <Phone className="h-4 w-4" />
                                                <span>{sucursal.telefono}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">
                                                Vendedores: {sucursal.cantidad_vendedores || 0}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                sucursal.activa 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {sucursal.activa ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de Sucursal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-4">
                                {editingSucursal ? 'Editar Sucursal' : 'Nueva Sucursal'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ciudad *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.ciudad}
                                        onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Dirección
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.direccion}
                                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Teléfono
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.telefono}
                                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="activa"
                                        checked={formData.activa}
                                        onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="activa" className="text-sm font-medium text-gray-700">
                                        Activa
                                    </label>
                                </div>
                                
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        {editingSucursal ? 'Actualizar' : 'Crear'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}