/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/immutability */
// app/audit/logs/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { api } from '@/app/services/api';
import { AuditLog } from '@/app/types';
import { 
    FileText, 
    Search, 
    Filter, 
    Download, 
    RefreshCw,
    Eye,
    Calendar,
    Clock,
    User,
    Database,
    Activity,
    X,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    Package,
    ShoppingBag,
    Users,
    Store
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function AuditLogsPage() {
    const { user, hasRole } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showFilters, setShowFilters] = useState(true);
    
    // Filtros
    const [filters, setFilters] = useState({
        tabla: '',
        operacion: '',
        fecha_desde: '',
        fecha_hasta: '',
        usuario_id: '',
        page: 1
    });
    
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0
    });

    // Opciones para filtros
    const tablasOptions = [
        { value: 'productos', label: 'Productos', icon: Package },
        { value: 'ventas', label: 'Ventas', icon: ShoppingBag },
        { value: 'usuarios', label: 'Usuarios', icon: Users },
        { value: 'sucursales', label: 'Sucursales', icon: Store },
        { value: 'solicitudes_vendedores', label: 'Solicitudes', icon: FileText }
    ];
    
    const operacionesOptions = [
        { value: 'INSERT', label: 'INSERT', color: 'green' },
        { value: 'UPDATE', label: 'UPDATE', color: 'blue' },
        { value: 'DELETE', label: 'DELETE', color: 'red' }
    ];

    useEffect(() => {
        if (!hasRole(['auditor', 'admin'])) {
            toast.error('No tienes permisos para acceder a esta página');
            return;
        }
        fetchLogs();
    }, [filters]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params: any = {
                page: filters.page,
                per_page: 20
            };
            if (filters.tabla) params.tabla = filters.tabla;
            if (filters.operacion) params.operacion = filters.operacion;
            if (filters.fecha_desde) params.fecha_desde = filters.fecha_desde;
            if (filters.fecha_hasta) params.fecha_hasta = filters.fecha_hasta;
            if (filters.usuario_id) params.usuario_id = parseInt(filters.usuario_id);
            
            const response = await api.getAuditLogs(params);
            if (response.success) {
                setLogs(response.data.data);
                setPagination({
                    current_page: response.data.current_page,
                    last_page: response.data.last_page,
                    per_page: response.data.per_page,
                    total: response.data.total
                });
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            toast.error('Error al cargar logs de auditoría');
        } finally {
            setLoading(false);
        }
    };

    const handleExportar = async () => {
        setExporting(true);
        try {
            const params: any = {};
            if (filters.tabla) params.tabla = filters.tabla;
            if (filters.operacion) params.operacion = filters.operacion;
            if (filters.fecha_desde) params.fecha_desde = filters.fecha_desde;
            if (filters.fecha_hasta) params.fecha_hasta = filters.fecha_hasta;
            
            const blob = await api.exportAuditLogs(params);
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit_logs_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            toast.success('Logs exportados exitosamente');
        } catch (error) {
            console.error('Error exporting logs:', error);
            toast.error('Error al exportar logs');
        } finally {
            setExporting(false);
        }
    };

    const limpiarFiltros = () => {
        setFilters({
            tabla: '',
            operacion: '',
            fecha_desde: '',
            fecha_hasta: '',
            usuario_id: '',
            page: 1
        });
        toast.info('Filtros limpiados');
    };

    const cambiarPagina = (nuevaPagina: number) => {
        if (nuevaPagina >= 1 && nuevaPagina <= pagination.last_page) {
            setFilters({ ...filters, page: nuevaPagina });
        }
    };

    const getOperacionColor = (operacion: string) => {
        switch (operacion) {
            case 'INSERT':
                return 'bg-green-100 text-green-800';
            case 'UPDATE':
                return 'bg-blue-100 text-blue-800';
            case 'DELETE':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getOperacionIcon = (operacion: string) => {
        switch (operacion) {
            case 'INSERT':
                return <Package className="h-4 w-4" />;
            case 'UPDATE':
                return <Activity className="h-4 w-4" />;
            case 'DELETE':
                return <AlertTriangle className="h-4 w-4" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    const getTablaIcon = (tabla: string) => {
        switch (tabla) {
            case 'productos':
                return <Package className="h-4 w-4" />;
            case 'ventas':
                return <ShoppingBag className="h-4 w-4" />;
            case 'usuarios':
                return <Users className="h-4 w-4" />;
            case 'sucursales':
                return <Store className="h-4 w-4" />;
            default:
                return <Database className="h-4 w-4" />;
        }
    };

    const handleVerDetalle = (log: AuditLog) => {
        setSelectedLog(log);
        setShowModal(true);
    };

    // Contador de filtros activos
    const filtrosActivos = () => {
        let count = 0;
        if (filters.tabla) count++;
        if (filters.operacion) count++;
        if (filters.fecha_desde) count++;
        if (filters.fecha_hasta) count++;
        if (filters.usuario_id) count++;
        return count;
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex justify-between items-start flex-wrap gap-4">
                        <div>
                            <div className="flex items-center space-x-2">
                                <FileText className="h-8 w-8 text-blue-600" />
                                <h1 className="text-3xl font-bold text-gray-900">Logs de Auditoría</h1>
                            </div>
                            <p className="text-gray-600 mt-1">
                                Visualiza y filtra todos los eventos registrados en el sistema
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                                <span className="text-sm text-gray-500">
                                    <Clock className="h-4 w-4 inline mr-1" />
                                    Total registros: {pagination.total}
                                </span>
                                <span className="text-sm text-gray-500">
                                    <User className="h-4 w-4 inline mr-1" />
                                    Auditor: {user?.nombre_completo}
                                </span>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                                    showFilters 
                                        ? 'bg-blue-50 border-blue-300 text-blue-700' 
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <Filter className="h-5 w-5" />
                                <span>Filtros</span>
                                {filtrosActivos() > 0 && (
                                    <span className="ml-1 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                                        {filtrosActivos()}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={handleExportar}
                                disabled={exporting}
                                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {exporting ? (
                                    <RefreshCw className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Download className="h-5 w-5" />
                                )}
                                <span>Exportar</span>
                            </button>
                            <button
                                onClick={fetchLogs}
                                disabled={loading}
                                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
                            >
                                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                                <span>Actualizar</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filtros */}
                {showFilters && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6 transition-all">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                <Filter className="h-5 w-5 text-gray-600 mr-2" />
                                Filtros de Búsqueda
                            </h2>
                            <button
                                onClick={limpiarFiltros}
                                className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-800"
                            >
                                <X className="h-4 w-4" />
                                <span>Limpiar todos</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tabla
                                </label>
                                <select
                                    value={filters.tabla}
                                    onChange={(e) => setFilters({ ...filters, tabla: e.target.value, page: 1 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Todas las tablas</option>
                                    {tablasOptions.map(tabla => (
                                        <option key={tabla.value} value={tabla.value}>
                                            {tabla.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Operación
                                </label>
                                <select
                                    value={filters.operacion}
                                    onChange={(e) => setFilters({ ...filters, operacion: e.target.value, page: 1 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Todas las operaciones</option>
                                    {operacionesOptions.map(op => (
                                        <option key={op.value} value={op.value}>{op.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fecha desde
                                </label>
                                <input
                                    type="date"
                                    value={filters.fecha_desde}
                                    onChange={(e) => setFilters({ ...filters, fecha_desde: e.target.value, page: 1 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fecha hasta
                                </label>
                                <input
                                    type="date"
                                    value={filters.fecha_hasta}
                                    onChange={(e) => setFilters({ ...filters, fecha_hasta: e.target.value, page: 1 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Usuario ID
                                </label>
                                <input
                                    type="number"
                                    placeholder="ID del usuario"
                                    value={filters.usuario_id}
                                    onChange={(e) => setFilters({ ...filters, usuario_id: e.target.value, page: 1 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={fetchLogs}
                                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                            >
                                <Search className="h-4 w-4" />
                                <span>Aplicar filtros</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Tabla de Logs */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                <Database className="h-5 w-5 text-gray-600 mr-2" />
                                Registros de Eventos
                            </h2>
                            <p className="text-sm text-gray-500">
                                Mostrando {logs.length} de {pagination.total} registros
                            </p>
                        </div>
                    </div>
                    
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No hay registros de auditoría</p>
                            <p className="text-gray-400 text-sm mt-1">
                                {filtrosActivos() > 0 ? 'Intenta con otros filtros' : 'No se han registrado eventos aún'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Fecha/Hora
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Tabla
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Operación
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Usuario
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                IP
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                                                        <span className="text-sm text-gray-900">
                                                            {format(new Date(log.fecha), "dd/MM/yyyy HH:mm:ss")}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {getTablaIcon(log.tabla_afectada)}
                                                        <span className="ml-2 text-sm font-medium text-gray-900 capitalize">
                                                            {log.tabla_afectada.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getOperacionColor(log.operacion)}`}>
                                                        {getOperacionIcon(log.operacion)}
                                                        <span>{log.operacion}</span>
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <User className="h-4 w-4 text-gray-400 mr-2" />
                                                        <span className="text-sm text-gray-700">
                                                            {log.usuario_nombre || `ID: ${log.usuario_real_id}`}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                        {log.ip_address || '-'}
                                                    </code>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <button
                                                        onClick={() => handleVerDetalle(log)}
                                                        className="text-blue-600 hover:text-blue-800 transition-colors"
                                                    >
                                                        <Eye className="h-5 w-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Paginación */}
                            {pagination.last_page > 1 && (
                                <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                                    <p className="text-sm text-gray-500">
                                        Mostrando {((pagination.current_page - 1) * pagination.per_page) + 1} a{' '}
                                        {Math.min(pagination.current_page * pagination.per_page, pagination.total)} de{' '}
                                        {pagination.total} registros
                                    </p>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => cambiarPagina(pagination.current_page - 1)}
                                            disabled={pagination.current_page === 1}
                                            className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            <span>Anterior</span>
                                        </button>
                                        <div className="flex space-x-1">
                                            {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                                                let pageNum;
                                                if (pagination.last_page <= 5) {
                                                    pageNum = i + 1;
                                                } else if (pagination.current_page <= 3) {
                                                    pageNum = i + 1;
                                                } else if (pagination.current_page >= pagination.last_page - 2) {
                                                    pageNum = pagination.last_page - 4 + i;
                                                } else {
                                                    pageNum = pagination.current_page - 2 + i;
                                                }
                                                
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => cambiarPagina(pageNum)}
                                                        className={`px-3 py-1 rounded-md text-sm transition-colors ${
                                                            pagination.current_page === pageNum
                                                                ? 'bg-blue-600 text-white'
                                                                : 'text-gray-700 hover:bg-gray-100'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <button
                                            onClick={() => cambiarPagina(pagination.current_page + 1)}
                                            disabled={pagination.current_page === pagination.last_page}
                                            className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                        >
                                            <span>Siguiente</span>
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Modal de Detalle del Log */}
            {showModal && selectedLog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                                <FileText className="h-6 w-6 text-blue-600" />
                                <h2 className="text-xl font-bold text-gray-900">Detalle del Evento</h2>
                                <span className={`ml-2 inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getOperacionColor(selectedLog.operacion)}`}>
                                    {getOperacionIcon(selectedLog.operacion)}
                                    <span>{selectedLog.operacion}</span>
                                </span>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-4">
                            {/* Información básica */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500">ID del Evento</p>
                                    <p className="font-medium text-gray-900">#{selectedLog.id}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500">Fecha y Hora</p>
                                    <p className="font-medium text-gray-900">
                                        {format(new Date(selectedLog.fecha), "dd 'de' MMMM 'de' yyyy, HH:mm:ss", { locale: es })}
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500">Tabla Afectada</p>
                                    <div className="flex items-center mt-1">
                                        {getTablaIcon(selectedLog.tabla_afectada)}
                                        <span className="ml-2 font-medium text-gray-900 capitalize">
                                            {selectedLog.tabla_afectada.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500">Usuario</p>
                                    <div className="flex items-center mt-1">
                                        <User className="h-4 w-4 text-gray-400 mr-2" />
                                        <span className="font-medium text-gray-900">
                                            {selectedLog.usuario_nombre || `ID: ${selectedLog.usuario_real_id}`}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500">IP Address</p>
                                    <code className="text-sm bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                                        {selectedLog.ip_address || 'No registrada'}
                                    </code>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500">Usuario Técnico</p>
                                    <p className="font-medium text-gray-900">{selectedLog.usuario_tecnico || '-'}</p>
                                </div>
                            </div>

                            {/* Datos Anteriores */}
                            {selectedLog.datos_antes && Object.keys(selectedLog.datos_antes).length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                        <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                                        Datos Anteriores (Before)
                                    </h3>
                                    <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto border border-gray-200">
                                        {JSON.stringify(selectedLog.datos_antes, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {/* Datos Posteriores */}
                            {selectedLog.datos_despues && Object.keys(selectedLog.datos_despues).length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                        <Activity className="h-4 w-4 text-blue-500 mr-2" />
                                        Datos Posteriores (After)
                                    </h3>
                                    <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto border border-gray-200">
                                        {JSON.stringify(selectedLog.datos_despues, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {/* Comparación de cambios */}
                            {selectedLog.datos_antes && selectedLog.datos_despues && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                        <Activity className="h-4 w-4 text-purple-500 mr-2" />
                                        Campos Modificados
                                    </h3>
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        {Object.keys(selectedLog.datos_despues).map(key => {
                                            const valorAntes = selectedLog.datos_antes?.[key];
                                            const valorDespues = selectedLog.datos_despues?.[key];
                                            if (JSON.stringify(valorAntes) !== JSON.stringify(valorDespues)) {
                                                return (
                                                    <div key={key} className="mb-2 last:mb-0">
                                                        <p className="text-sm font-medium text-gray-700">{key}:</p>
                                                        <div className="flex items-center space-x-2 text-sm ml-4">
                                                            <span className="text-red-600 line-through">
                                                                {JSON.stringify(valorAntes)}
                                                            </span>
                                                            <span className="text-gray-400">→</span>
                                                            <span className="text-green-600">
                                                                {JSON.stringify(valorDespues)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}