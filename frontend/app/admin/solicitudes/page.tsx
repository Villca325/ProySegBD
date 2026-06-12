// app/admin/solicitudes/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { api } from '@/app/services/api';
import { SolicitudVendedor } from '@/app/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle, XCircle, Clock, Eye, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SolicitudesPage() {
    const { hasRole } = useAuth();
    const searchParams = useSearchParams();
    const [solicitudes, setSolicitudes] = useState<SolicitudVendedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudVendedor | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [motivoRechazo, setMotivoRechazo] = useState('');
    const [comentariosAprobacion, setComentariosAprobacion] = useState('');

    const estadoFiltro = searchParams.get('estado') || '';

    useEffect(() => {
        fetchSolicitudes();
    }, [estadoFiltro]);

    const fetchSolicitudes = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (estadoFiltro) params.estado = estadoFiltro;
            
            const response = await api.getAdminSolicitudes(params);
            if (response.success) {
                setSolicitudes(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching solicitudes:', error);
            toast.error('Error al cargar solicitudes');
        } finally {
            setLoading(false);
        }
    };

    const handleAprobar = async (id: number) => {
        try {
            const response = await api.aprobarSolicitud(id, comentariosAprobacion);
            if (response.success) {
                toast.success('Solicitud aprobada exitosamente');
                setShowModal(false);
                setComentariosAprobacion('');
                fetchSolicitudes();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al aprobar solicitud');
        }
    };

    const handleRechazar = async (id: number) => {
        if (!motivoRechazo.trim()) {
            toast.error('Debes proporcionar un motivo de rechazo');
            return;
        }
        
        try {
            const response = await api.rechazarSolicitud(id, motivoRechazo);
            if (response.success) {
                toast.success('Solicitud rechazada');
                setShowModal(false);
                setMotivoRechazo('');
                fetchSolicitudes();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al rechazar solicitud');
        }
    };

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'pendiente':
                return 'bg-yellow-100 text-yellow-800';
            case 'aprobada':
                return 'bg-green-100 text-green-800';
            case 'rechazada':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getEstadoIcon = (estado: string) => {
        switch (estado) {
            case 'pendiente':
                return <Clock className="h-4 w-4" />;
            case 'aprobada':
                return <CheckCircle className="h-4 w-4" />;
            case 'rechazada':
                return <XCircle className="h-4 w-4" />;
            default:
                return null;
        }
    };

    const getTipoSucursalTexto = (tipo: string) => {
        return tipo === 'nueva' ? 'Creará nueva sucursal' : 'Se unirá a sucursal existente';
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Solicitudes de Vendedores</h1>
                    <p className="text-gray-600 mt-1">
                        Revisa y gestiona las solicitudes de nuevos vendedores
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex space-x-2 mb-6 border-b border-gray-200">
                    {['', 'pendiente', 'aprobada', 'rechazada'].map((estado) => (
                        <a
                            key={estado || 'todos'}
                            href={`/admin/solicitudes${estado ? `?estado=${estado}` : ''}`}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                                estadoFiltro === estado
                                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {estado === '' ? 'Todas' : estado === 'pendiente' ? 'Pendientes' : estado === 'aprobada' ? 'Aprobadas' : 'Rechazadas'}
                        </a>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : solicitudes.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No hay solicitudes {estadoFiltro && `con estado "${estadoFiltro}"`}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {solicitudes.map((solicitud) => (
                            <div key={solicitud.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{solicitud.nombre_completo}</h3>
                                            <p className="text-sm text-gray-500">{solicitud.email}</p>
                                        </div>
                                        <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(solicitud.estado)}`}>
                                            {getEstadoIcon(solicitud.estado)}
                                            <span>{solicitud.estado === 'pendiente' ? 'Pendiente' : solicitud.estado === 'aprobada' ? 'Aprobada' : 'Rechazada'}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Tipo de Sucursal</p>
                                            <p className="font-medium">{getTipoSucursalTexto(solicitud.tipo_sucursal)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Fecha de Solicitud</p>
                                            <p className="font-medium">
                                                {format(new Date(solicitud.fecha_solicitud), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                                            </p>
                                        </div>
                                        {solicitud.sucursal_nombre && (
                                            <div>
                                                <p className="text-sm text-gray-500">Sucursal</p>
                                                <p className="font-medium">{solicitud.sucursal_nombre}</p>
                                                <p className="text-sm text-gray-500">{solicitud.sucursal_ciudad}</p>
                                            </div>
                                        )}
                                        {solicitud.dias_pendiente !== undefined && solicitud.dias_pendiente > 0 && (
                                            <div>
                                                <p className="text-sm text-gray-500">Días Pendiente</p>
                                                <p className="font-medium text-yellow-600">{solicitud.dias_pendiente} días</p>
                                            </div>
                                        )}
                                    </div>

                                    {solicitud.estado === 'pendiente' && hasRole(['admin', 'gerente']) && (
                                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                            <button
                                                onClick={() => {
                                                    setSelectedSolicitud(solicitud);
                                                    setMotivoRechazo('');
                                                    setComentariosAprobacion('');
                                                    setShowModal(true);
                                                }}
                                                className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                            >
                                                <Eye className="h-4 w-4" />
                                                <span>Revisar</span>
                                            </button>
                                        </div>
                                    )}

                                    {solicitud.comentarios && (
                                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-500">Comentarios</p>
                                            <p className="text-sm text-gray-700">{solicitud.comentarios}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de Revisión */}
            {showModal && selectedSolicitud && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-4">Revisar Solicitud</h2>
                            
                            <div className="space-y-4 mb-6">
                                <div>
                                    <p className="text-sm text-gray-500">Nombre</p>
                                    <p className="font-medium">{selectedSolicitud.nombre_completo}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="font-medium">{selectedSolicitud.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Tipo</p>
                                    <p className="font-medium">{getTipoSucursalTexto(selectedSolicitud.tipo_sucursal)}</p>
                                </div>
                                {selectedSolicitud.sucursal_nombre && (
                                    <div>
                                        <p className="text-sm text-gray-500">Sucursal</p>
                                        <p className="font-medium">{selectedSolicitud.sucursal_nombre}</p>
                                        <p className="text-sm text-gray-500">{selectedSolicitud.sucursal_ciudad}</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Comentarios de Aprobación (opcional)
                                    </label>
                                    <textarea
                                        value={comentariosAprobacion}
                                        onChange={(e) => setComentariosAprobacion(e.target.value)}
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Comentarios para el vendedor..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Motivo de Rechazo (requerido para rechazar)
                                    </label>
                                    <textarea
                                        value={motivoRechazo}
                                        onChange={(e) => setMotivoRechazo(e.target.value)}
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="Explica el motivo del rechazo..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleRechazar(selectedSolicitud.id)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Rechazar
                                </button>
                                <button
                                    onClick={() => handleAprobar(selectedSolicitud.id)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    Aprobar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}