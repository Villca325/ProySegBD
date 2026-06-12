/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/immutability */
// app/productos/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { api } from '@/app/services/api';
import { Producto, Categoria } from '@/app/types';
import { Search, ShoppingCart, Edit, Trash2, Plus, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function ProductosPage() {
    const { isAuthenticated, user, hasRole } = useAuth();
    const router = useRouter();
    const [productos, setProductos] = useState<Producto[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoriaFilter, setCategoriaFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        precio: '',
        stock: '',
        categoria_id: ''
    });

    const isVendedor = hasRole(['vendedor', 'gerente', 'admin']);

    useEffect(() => {
        fetchProductos();
        fetchCategorias();
    }, [search, categoriaFilter]);

    const fetchProductos = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (search) params.search = search;
            if (categoriaFilter) params.categoria_id = categoriaFilter;
            
            const response = await api.getProductos(params);
            if (response.success) {
                setProductos(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching productos:', error);
            toast.error('Error al cargar productos');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategorias = async () => {
        try {
            const response = await api.getCategorias();
            if (response.success) {
                setCategorias(response.data);
            }
        } catch (error) {
            console.error('Error fetching categorias:', error);
        }
    };

    const handleComprar = async (productoId: number) => {
        if (!isAuthenticated) {
            toast.error('Debes iniciar sesión para comprar');
            router.push('/login');
            return;
        }

        if (user?.rol !== 'cliente') {
            toast.error('Solo los clientes pueden realizar compras');
            return;
        }

        const cantidad = prompt('Ingrese la cantidad:', '1');
        if (cantidad && parseInt(cantidad) > 0) {
            try {
                const response = await api.realizarCompra(productoId, parseInt(cantidad));
                if (response.success) {
                    toast.success('Compra realizada exitosamente');
                    fetchProductos();
                }
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Error al realizar compra');
            }
        }
    };

    const handleEliminar = async (id: number, nombre: string) => {
        if (confirm(`¿Estás seguro de eliminar el producto "${nombre}"?`)) {
            try {
                const response = await api.deleteProducto(id);
                if (response.success) {
                    toast.success('Producto eliminado exitosamente');
                    fetchProductos();
                }
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Error al eliminar producto');
            }
        }
    };

    const openCreateModal = () => {
        setEditingProducto(null);
        setFormData({
            nombre: '',
            descripcion: '',
            precio: '',
            stock: '',
            categoria_id: ''
        });
        setShowModal(true);
    };

    const openEditModal = (producto: Producto) => {
        setEditingProducto(producto);
        setFormData({
            nombre: producto.nombre,
            descripcion: producto.descripcion || '',
            precio: producto.precio.toString(),
            stock: producto.stock.toString(),
            categoria_id: producto.categoria_id?.toString() || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const data = {
            nombre: formData.nombre,
            descripcion: formData.descripcion,
            precio: parseFloat(formData.precio),
            stock: parseInt(formData.stock),
            categoria_id: formData.categoria_id ? parseInt(formData.categoria_id) : null
        };

        try {
            if (editingProducto) {
                const response = await api.updateProducto(editingProducto.id, data);
                if (response.success) {
                    toast.success('Producto actualizado exitosamente');
                    setShowModal(false);
                    fetchProductos();
                }
            } else {
                const response = await api.createProducto(data);
                if (response.success) {
                    toast.success('Producto creado exitosamente');
                    setShowModal(false);
                    fetchProductos();
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar producto');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
                    {isVendedor && (
                        <button
                            onClick={openCreateModal}
                            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            <Plus className="h-5 w-5" />
                            <span>Nuevo Producto</span>
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Buscar productos..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <select
                            value={categoriaFilter}
                            onChange={(e) => setCategoriaFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Todas las categorías</option>
                            {categorias.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Productos Grid */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : productos.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <p className="text-gray-500">No hay productos disponibles</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {productos.map((producto) => (
                            <div key={producto.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{producto.nombre}</h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {producto.categoria_nombre || 'Sin categoría'}
                                            </p>
                                        </div>
                                        {isVendedor && (
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => openEditModal(producto)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEliminar(producto.id, producto.nombre)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                                        {producto.descripcion || 'Sin descripción'}
                                    </p>
                                    
                                    <div className="mt-4 flex justify-between items-center">
                                        <div>
                                            <span className="text-2xl font-bold text-blue-600">
                                                ${parseFloat(producto.precio).toFixed(2)}
                                            </span>
                                            <span className="text-sm text-gray-500 ml-2">
                                                Stock: {producto.stock}
                                            </span>
                                        </div>
                                        
                                        {user?.rol === 'cliente' && producto.stock > 0 && (
                                            <button
                                                onClick={() => handleComprar(producto.id)}
                                                className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700"
                                            >
                                                <ShoppingCart className="h-4 w-4" />
                                                <span>Comprar</span>
                                            </button>
                                        )}
                                        
                                        {user?.rol === 'cliente' && producto.stock === 0 && (
                                            <span className="text-red-500 text-sm">Agotado</span>
                                        )}
                                    </div>
                                    
                                    <div className="mt-2 text-xs text-gray-400">
                                        {producto.sucursal_nombre && (
                                            <span>Sucursal: {producto.sucursal_nombre} ({producto.sucursal_ciudad})</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de Producto */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-4">
                                {editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
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
                                        Descripción
                                    </label>
                                    <textarea
                                        value={formData.descripcion}
                                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Precio *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.precio}
                                        onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Stock *
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Categoría
                                    </label>
                                    <select
                                        value={formData.categoria_id}
                                        onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Sin categoría</option>
                                        {categorias.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.nombre}
                                            </option>
                                        ))}
                                    </select>
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
                                        {editingProducto ? 'Actualizar' : 'Crear'}
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