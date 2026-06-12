// app/audit/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { api } from '@/app/services/api';
import { AuditLog } from '@/app/types';
import { 
    FileText, 
    Database, 
    Users, 
    ShoppingBag, 
    AlertTriangle, 
    Clock, 
    Eye, 
    Download,
    Filter,
    Calendar,
    Search,
    Activity,
    Shield,
    Server,
    UserCheck,
    Package,
    CreditCard,
    RefreshCw,
    X,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function AuditorDashboardPage() {
    const { user, hasRole } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [resumen, setResumen] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [showModal, setShowModal] = useState(false);
    
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

    // Estadísticas de resumen
    const [stats, setStats] = useState({
        total_eventos: 0,
        eventos_hoy: 0,
        eventos_semana: 0,
        tablas_mas_activas: [] as any[],
        usuarios_mas_activos: [] as any[]
    });

    // Opciones para filtros
    const tablasOptions = ['productos', 'ventas', 'usuarios', 'sucursales', 'solicitudes_vendedores'];
    const operacionesOptions = ['INSERT', 'UPDATE', 'DELETE'];

    useEffect(() => {
        if (!hasRole(['auditor', 'admin'])) {
            toast.error('No tienes permisos para acceder al dashboard de auditoría');
            return;
        }
        fetchLogs();
        fetchResumen();
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

    const fetchResumen = async () => {
        try {
            const response = await api.getAuditResumen();
            if (response.success) {
                setResumen(response.data);
                setStats({
                    total_eventos: response.data.estadisticas?.total_eventos || 0,
                    eventos_hoy: response.data.estadisticas?.eventos_hoy || 0,
                    eventos_semana: response.data.estadisticas?.eventos_semana || 0,
                    tablas_mas_activas: response.data.estadisticas?.tablas_mas_activas || [],
                    usuarios_mas_activos: response.data.estadisticas?.usuarios_mas_activos || []
                });
            }
        } catch (error) {
            console.error('Error fetching resumen:', error);
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

    const handleExportarResumen = async () => {
        setExporting(true);
        try {
            const blob = await api.exportAuditLogs({
                fecha_desde: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'),
                fecha_hasta: format(new Date(), 'yyyy-MM-dd')
            });
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit_resumen_${format(new Date(), 'yyyy-MM-dd')}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            toast.success('Reporte exportado exitosamente');
        } catch (error) {
            console.error('Error exporting report:', error);
            toast.error('Error al exportar reporte');
        } finally {
            setExporting(false);
        }
    };

    const handleFilterByTable = async (tabla: string) => {
        setLoading(true);
        try {
            const response = await api.getAuditLogsByTable(tabla, { page: 1 });
            if (response.success) {
                setLogs(response.data.data);
                setPagination({
                    current_page: response.data.current_page,
                    last_page: response.data.last_page,
                    per_page: response.data.per_page,
                    total: response.data.total
                });
                setFilters({ ...filters, tabla, page: 1 });
                toast.info(`Filtrando por tabla: ${tabla}`);
            }
        } catch (error) {
            console.error('Error filtering by table:', error);
            toast.error('Error al filtrar por tabla');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterByUser = async (usuarioId: number, nombre: string) => {
        setLoading(true);
        try {
            const response = await api.getAuditLogsByUser(usuarioId, { page: 1 });
            if (response.success) {
                setLogs(response.data.data);
                setPagination({
                    current_page: response.data.current_page,
                    last_page: response.data.last_page,
                    per_page: response.data.per_page,
                    total: response.data.total
                });
                setFilters({ ...filters, usuario_id: usuarioId.toString(), page: 1 });
                toast.info(`Filtrando por usuario: ${nombre}`);
            }
        } catch (error) {
            console.error('Error filtering by user:', error);
            toast.error('Error al filtrar por usuario');
        } finally {
            setLoading(false);
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

    const handleVerDetalle = (log: AuditLog) => {
        setSelectedLog(log);
        setShowModal(true);
    };

    // Cards de estadísticas
    const statCards = [
        {
            title: 'Total Eventos',
            value: stats.total_eventos,
            icon: Database,
            color: 'bg-blue-500'
        },
        {
            title: 'Eventos Hoy',
            value: stats.eventos_hoy,
            icon: Clock,
            color: 'bg-green-500'
        },
        {
            title: 'Eventos Semana',
            value: stats.eventos_semana,
            icon: Calendar,
            color: 'bg-purple-500'
        },
        {
            title: 'Eliminaciones',
            value: logs.filter(l => l.operacion === 'DELETE').length,
            icon: AlertTriangle,
            color: 'bg-red-500'
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex justify-between items-start flex-wrap gap-4">
                        <div>
                            <div className="flex items-center space-x-2">
                                <Shield className="h-8 w-8 text-blue-600" />
                                <h1 className="text-3xl font-bold text-gray-900">Dashboard de Auditoría</h1>
                            </div>
                            <p className="text-gray-600 mt-1">
                                Monitoreo y seguimiento de actividades del sistema
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                Auditor: {user?.nombre_completo}
                            </p>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={handleExportar}
                                disabled={exporting}
                                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {exporting ? (
                                    <RefreshCw className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Download className="h-5 w-5" />
                                )}
                                <span>Exportar Logs</span>
                            </button>
                            <button
                                onClick={handleExportarResumen}
                                disabled={exporting}
                                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {exporting ? (
                                    <RefreshCw className="h-5 w-5 animate-spin" />
                                ) : (
                                    <FileText className="h-5 w-5" />
                                )}
                                <span>Exportar Reporte</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {statCards.map((stat) => (
                        <div key={stat.title} className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">{stat.title}</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                                </div>
                                <div className={`${stat.color} p-3 rounded-full`}>
                                    <stat.icon className="h-6 w-6 text-white" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tablas más activas y Usuarios más activos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Server className="h-5 w-5 text-blue-600 mr-2" />
                            Tablas más activas
                        </h2>
                        <div className="space-y-3">
                            {stats.tablas_mas_activas.map((tabla: any, index: number) => (
                                <div key={index} className="flex justify-between items-center">
                                    <button
                                        onClick={() => handleFilterByTable(tabla.tabla_afectada)}
                                        className="text-gray-700 hover:text-blue-600 hover:underline capitalize"
                                    >
                                        {tabla.tabla_afectada}
                                    </button>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-blue-600 h-2 rounded-full" 
                                                style={{ width: `${(tabla.total / stats.total_eventos) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium text-gray-600">{tabla.total}</span>
                                    </div>
                                </div>
                            ))}
                            {stats.tablas_mas_activas.length === 0 && (
                                <p className="text-gray-500 text-center py-4">No hay datos disponibles</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <UserCheck className="h-5 w-5 text-green-600 mr-2" />
                            Usuarios más activos
                        </h2>
                        <div className="space-y-3">
                            {stats.usuarios_mas_activos.map((usuario: any, index: number) => (
                                <div key={index} className="flex justify-between items-center">
                                    <button
                                        onClick={() => handleFilterByUser(usuario.usuario_real_id, usuario.nombre_completo)}
                                        className="text-gray-700 hover:text-green-600 hover:underline"
                                    >
                                        {usuario.nombre_completo}
                                    </button>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-32 bg-gray-200 rounded-full h-2">
                                            <div 
                                                className="bg-green-600 h-2 rounded-full" 
                                                style={{ width: `${(usuario.total / stats.total_eventos) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium text-gray-600">{usuario.total}</span>
                                    </div>
                                </div>
                            ))}
                            {stats.usuarios_mas_activos.length === 0 && (
                                <p className="text-gray-500 text-center py-4">No hay datos disponibles</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Filter className="h-5 w-5 text-gray-600 mr-2" />
                            Filtros
                        </h2>
                        <button
                            onClick={limpiarFiltros}
                            className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-800"
                        >
                            <X className="h-4 w-4" />
                            <span>Limpiar filtros</span>
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
                                <option value="">Todas</option>
                                {tablasOptions.map(tabla => (
                                    <option key={tabla} value={tabla} className="capitalize">
                                        {tabla.replace('_', ' ')}
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
                                <option value="">Todas</option>
                                {operacionesOptions.map(op => (
                                    <option key={op} value={op}>{op}</option>
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
                            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                        >
                            <Search className="h-4 w-4" />
                            <span>Aplicar filtros</span>
                        </button>
                    </div>
                </div>

                {/* Tabla de Logs */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Activity className="h-5 w-5 text-gray-600 mr-2" />
                            Registros de Auditoría
                            <span className="ml-2 text-sm font-normal text-gray-500">
                                (Total: {pagination.total} registros)
                            </span>
                        </h2>
                    </div>
                    
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No hay registros de auditoría</p>
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
                                            <tr key={log.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {format(new Date(log.fecha), "dd/MM/yyyy HH:mm:ss")}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm font-medium text-gray-900 capitalize">
                                                        {log.tabla_afectada}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getOperacionColor(log.operacion)}`}>
                                                        {getOperacionIcon(log.operacion)}
                                                        <span>{log.operacion}</span>
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {log.usuario_nombre || `ID: ${log.usuario_real_id}`}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {log.ip_address || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => handleVerDetalle(log)}
                                                        className="text-blue-600 hover:text-blue-800"
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
                                        Mostrando {((pagination.current_page - 1) * pagination.per_page) + 1} a {Math.min(pagination.current_page * pagination.per_page, pagination.total)} de {pagination.total} registros
                                    </p>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => cambiarPagina(pagination.current_page - 1)}
                                            disabled={pagination.current_page === 1}
                                            className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            <span>Anterior</span>
                                        </button>
                                        <span className="px-3 py-1 text-sm">
                                            Página {pagination.current_page} de {pagination.last_page}
                                        </span>
                                        <button
                                            onClick={() => cambiarPagina(pagination.current_page + 1)}
                                            disabled={pagination.current_page === pagination.last_page}
                                            className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-900">Detalle del Evento</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500">ID del Evento</p>
                                    <p className="font-medium">#{selectedLog.id}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500">Fecha</p>
                                    <p className="font-medium">
                                        {format(new Date(selectedLog.fecha), "dd 'de' MMMM 'de' yyyy, HH:mm:ss", { locale: es })}
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500">Tabla</p>
                                    <p className="font-medium capitalize">{selectedLog.tabla_afectada}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500">Operación</p>
                                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getOperacionColor(selectedLog.operacion)}`}>
                                        {getOperacionIcon(selectedLog.operacion)}
                                        <span>{selectedLog.operacion}</span>
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500">Usuario</p>
                                    <p className="font-medium">{selectedLog.usuario_nombre || `ID: ${selectedLog.usuario_real_id}`}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-xs text-gray-500">IP Address</p>
                                    <p className="font-medium">{selectedLog.ip_address || 'No registrada'}</p>
                                </div>
                            </div>

                            {selectedLog.datos_antes && Object.keys(selectedLog.datos_antes).length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Datos Anteriores</h3>
                                    <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto">
                                        {JSON.stringify(selectedLog.datos_antes, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedLog.datos_despues && Object.keys(selectedLog.datos_despues).length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Datos Posteriores</h3>
                                    <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto">
                                        {JSON.stringify(selectedLog.datos_despues, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>

                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
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