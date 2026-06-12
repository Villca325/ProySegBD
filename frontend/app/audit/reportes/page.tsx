// app/audit/reportes/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { api } from '@/app/services/api';
import { FileText, Calendar, Download, RefreshCw, TrendingUp, AlertCircle, Table, PieChart, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AuditReportesPage() {
    const { hasRole } = useAuth();
    const [loading, setLoading] = useState(false);
    const [reporte, setReporte] = useState<any>(null);
    const [fechas, setFechas] = useState({
        fecha_inicio: format(new Date().setDate(new Date().getDate() - 30), 'yyyy-MM-dd'),
        fecha_fin: format(new Date(), 'yyyy-MM-dd')
    });
    const [viewType, setViewType] = useState<'resumen' | 'detalle'>('resumen');

    const COLORS: { [key: string]: string } = {
        INSERT: '#10b981',
        UPDATE: '#3b82f6',
        DELETE: '#ef4444',
        productos: '#3b82f6',
        ventas: '#10b981',
        usuarios: '#f59e0b',
        sucursales: '#8b5cf6',
        default: '#6b7280'
    };

    const generarReporte = async () => {
        setLoading(true);
        try {
            const response = await api.getAuditLogs({
                fecha_desde: fechas.fecha_inicio,
                fecha_hasta: fechas.fecha_fin,
                per_page: 1000
            });
            
            if (response.success) {
                const logs = response.data.data;
                
                // Procesar datos para estadísticas
                const operacionesPorDia = logs.reduce((acc: any, log: any) => {
                    const fecha = format(new Date(log.fecha), 'yyyy-MM-dd');
                    if (!acc[fecha]) {
                        acc[fecha] = { fecha, INSERT: 0, UPDATE: 0, DELETE: 0, total: 0 };
                    }
                    acc[fecha][log.operacion]++;
                    acc[fecha].total++;
                    return acc;
                }, {});
                
                const operacionesPorTabla = logs.reduce((acc: any, log: any) => {
                    if (!acc[log.tabla_afectada]) {
                        acc[log.tabla_afectada] = { name: log.tabla_afectada, value: 0 };
                    }
                    acc[log.tabla_afectada].value++;
                    return acc;
                }, {});
                
                const operacionesPorTipo = logs.reduce((acc: any, log: any) => {
                    if (!acc[log.operacion]) {
                        acc[log.operacion] = { name: log.operacion, value: 0, color: COLORS[log.operacion] };
                    }
                    acc[log.operacion].value++;
                    return acc;
                }, {});
                
                const usuariosTop = logs.reduce((acc: any, log: any) => {
                    const nombre = log.usuario_nombre || `Usuario ${log.usuario_real_id}`;
                    if (!acc[nombre]) {
                        acc[nombre] = { name: nombre, value: 0 };
                    }
                    acc[nombre].value++;
                    return acc;
                }, {});
                
                const totalEventos = logs.length;
                
                setReporte({
                    logs,
                    estadisticas: {
                        total_eventos: totalEventos,
                        por_tabla: Object.values(operacionesPorTabla),
                        por_operacion: Object.values(operacionesPorTipo),
                        por_dia: Object.values(operacionesPorDia).sort((a: any, b: any) => a.fecha.localeCompare(b.fecha)),
                        top_usuarios: Object.values(usuariosTop).sort((a: any, b: any) => b.value - a.value).slice(0, 5)
                    },
                    periodo: fechas
                });
                
                toast.success('Reporte generado exitosamente');
            }
        } catch (error) {
            console.error('Error generando reporte:', error);
            toast.error('Error al generar reporte');
        } finally {
            setLoading(false);
        }
    };

    const exportarReporte = () => {
        if (!reporte) return;
        
        const csvContent = [
            ['ID', 'Fecha', 'Tabla', 'Operación', 'Usuario', 'IP', 'Datos Antes', 'Datos Después'],
            ...reporte.logs.map((log: any) => [
                log.id,
                log.fecha,
                log.tabla_afectada,
                log.operacion,
                log.usuario_nombre || log.usuario_real_id,
                log.ip_address || '',
                JSON.stringify(log.datos_antes || {}),
                JSON.stringify(log.datos_despues || {})
            ])
        ].map(row => row.join(',')).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_auditoria_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Reporte exportado a CSV');
    };

    const getMaxValue = (data: any[], key: string) => {
        return Math.max(...data.map(item => item[key] || 0), 0);
    };

    const calcularPorcentaje = (value: number, total: number) => {
        if (total === 0) return 0;
        return (value / total) * 100;
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center space-x-2">
                                <FileText className="h-8 w-8 text-blue-600" />
                                <h1 className="text-3xl font-bold text-gray-900">Reportes de Auditoría</h1>
                            </div>
                            <p className="text-gray-600 mt-1">
                                Genera reportes personalizados de actividades del sistema
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filtros de Fecha */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Calendar className="h-5 w-5 text-gray-600 mr-2" />
                        Seleccionar Periodo
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha Inicio
                            </label>
                            <input
                                type="date"
                                value={fechas.fecha_inicio}
                                onChange={(e) => setFechas({ ...fechas, fecha_inicio: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha Fin
                            </label>
                            <input
                                type="date"
                                value={fechas.fecha_fin}
                                onChange={(e) => setFechas({ ...fechas, fecha_fin: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <button
                        onClick={generarReporte}
                        disabled={loading}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? (
                            <RefreshCw className="h-5 w-5 animate-spin" />
                        ) : (
                            <TrendingUp className="h-5 w-5" />
                        )}
                        <span>{loading ? 'Generando...' : 'Generar Reporte'}</span>
                    </button>
                </div>

                {/* Resultados del Reporte */}
                {reporte && (
                    <div className="space-y-8">
                        {/* Toggle Vista */}
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setViewType('resumen')}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                                    viewType === 'resumen'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                <BarChart3 className="h-4 w-4" />
                                <span>Resumen</span>
                            </button>
                            <button
                                onClick={() => setViewType('detalle')}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                                    viewType === 'detalle'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                <Table className="h-4 w-4" />
                                <span>Detalle</span>
                            </button>
                        </div>

                        {/* Vista Resumen */}
                        {viewType === 'resumen' && (
                            <>
                                {/* Resumen Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-500">Total Eventos</p>
                                                <p className="text-3xl font-bold text-gray-900">{reporte.estadisticas.total_eventos}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {format(new Date(reporte.periodo.fecha_inicio), 'dd/MM/yyyy')} - {format(new Date(reporte.periodo.fecha_fin), 'dd/MM/yyyy')}
                                                </p>
                                            </div>
                                            <div className="bg-blue-100 p-3 rounded-full">
                                                <FileText className="h-6 w-6 text-blue-600" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-500">Promedio por Día</p>
                                                <p className="text-3xl font-bold text-gray-900">
                                                    {(reporte.estadisticas.total_eventos / 30).toFixed(1)}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">Eventos/día</p>
                                            </div>
                                            <div className="bg-green-100 p-3 rounded-full">
                                                <TrendingUp className="h-6 w-6 text-green-600" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-500">Usuario Más Activo</p>
                                                <p className="text-lg font-bold text-gray-900 truncate">
                                                    {reporte.estadisticas.top_usuarios[0]?.name || 'N/A'}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {reporte.estadisticas.top_usuarios[0]?.value || 0} eventos
                                                </p>
                                            </div>
                                            <div className="bg-purple-100 p-3 rounded-full">
                                                <AlertCircle className="h-6 w-6 text-purple-600" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabla de Actividad por Día */}
                                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                            <BarChart3 className="h-5 w-5 text-gray-600 mr-2" />
                                            Actividad por Día
                                        </h2>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">INSERT</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UPDATE</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DELETE</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {reporte.estadisticas.por_dia.map((dia: any, idx: number) => {
                                                    const maxTotal = getMaxValue(reporte.estadisticas.por_dia, 'total');
                                                    const widthPercentage = (dia.total / maxTotal) * 100;
                                                    
                                                    return (
                                                        <tr key={idx} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {format(new Date(dia.fecha), 'dd/MM/yyyy')}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="text-sm text-green-600 font-medium">{dia.INSERT}</span>
                                                                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                                                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${calcularPorcentaje(dia.INSERT, dia.total)}%` }} />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="text-sm text-blue-600 font-medium">{dia.UPDATE}</span>
                                                                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                                                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${calcularPorcentaje(dia.UPDATE, dia.total)}%` }} />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="text-sm text-red-600 font-medium">{dia.DELETE}</span>
                                                                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                                                        <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${calcularPorcentaje(dia.DELETE, dia.total)}%` }} />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="text-sm font-bold text-gray-700">{dia.total}</span>
                                                                    <div className="w-24 bg-gray-200 rounded-full h-1.5">
                                                                        <div className="bg-gray-700 h-1.5 rounded-full" style={{ width: `${widthPercentage}%` }} />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Estadísticas por Tabla y Operación */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Eventos por Tabla */}
                                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                                <PieChart className="h-5 w-5 text-gray-600 mr-2" />
                                                Eventos por Tabla
                                            </h2>
                                        </div>
                                        <div className="p-6">
                                            <div className="space-y-3">
                                                {reporte.estadisticas.por_tabla.map((tabla: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-center">
                                                        <span className="text-sm font-medium text-gray-700 capitalize">{tabla.name}</span>
                                                        <div className="flex items-center space-x-2 flex-1 ml-4">
                                                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                                <div 
                                                                    className="h-2 rounded-full" 
                                                                    style={{ 
                                                                        width: `${calcularPorcentaje(tabla.value, reporte.estadisticas.total_eventos)}%`,
                                                                        backgroundColor: COLORS[tabla.name] || COLORS.default
                                                                    }}
                                                                />
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-600 min-w-[60px] text-right">
                                                                {tabla.value} ({calcularPorcentaje(tabla.value, reporte.estadisticas.total_eventos).toFixed(1)}%)
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Eventos por Operación */}
                                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                                <PieChart className="h-5 w-5 text-gray-600 mr-2" />
                                                Eventos por Operación
                                            </h2>
                                        </div>
                                        <div className="p-6">
                                            <div className="space-y-3">
                                                {reporte.estadisticas.por_operacion.map((op: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-center">
                                                        <span className="text-sm font-medium text-gray-700">{op.name}</span>
                                                        <div className="flex items-center space-x-2 flex-1 ml-4">
                                                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                                <div 
                                                                    className="h-2 rounded-full" 
                                                                    style={{ 
                                                                        width: `${calcularPorcentaje(op.value, reporte.estadisticas.total_eventos)}%`,
                                                                        backgroundColor: op.color
                                                                    }}
                                                                />
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-600 min-w-[60px] text-right">
                                                                {op.value} ({calcularPorcentaje(op.value, reporte.estadisticas.total_eventos).toFixed(1)}%)
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Top Usuarios */}
                                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                        <h2 className="text-lg font-semibold text-gray-900">Top 5 Usuarios Más Activos</h2>
                                    </div>
                                    <div className="p-6">
                                        <div className="space-y-3">
                                            {reporte.estadisticas.top_usuarios.map((usuario: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-700">{usuario.name}</span>
                                                    <div className="flex items-center space-x-2 flex-1 ml-4">
                                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                            <div 
                                                                className="bg-purple-600 h-2 rounded-full" 
                                                                style={{ width: `${calcularPorcentaje(usuario.value, reporte.estadisticas.total_eventos)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-600 min-w-[60px] text-right">
                                                            {usuario.value} ({calcularPorcentaje(usuario.value, reporte.estadisticas.total_eventos).toFixed(1)}%)
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Vista Detalle */}
                        {viewType === 'detalle' && (
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                    <h2 className="text-lg font-semibold text-gray-900">Listado de Eventos</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tabla</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operación</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {reporte.logs.slice(0, 100).map((log: any) => (
                                                <tr key={log.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.id}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {format(new Date(log.fecha), 'dd/MM/yyyy HH:mm:ss')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm font-medium text-gray-900">{log.tabla_afectada}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                                            log.operacion === 'INSERT' ? 'bg-green-100 text-green-800' :
                                                            log.operacion === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                            {log.operacion}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {log.usuario_nombre || `ID: ${log.usuario_real_id}`}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {log.ip_address || '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {reporte.logs.length > 100 && (
                                        <div className="px-6 py-4 bg-gray-50 text-center text-sm text-gray-500">
                                            Mostrando los primeros 100 registros de {reporte.logs.length} totales
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Botón Exportar */}
                        <div className="flex justify-end">
                            <button
                                onClick={exportarReporte}
                                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                            >
                                <Download className="h-5 w-5" />
                                <span>Exportar Reporte (CSV)</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}