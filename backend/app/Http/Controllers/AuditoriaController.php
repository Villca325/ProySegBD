<?php
// app/Http/Controllers/AuditoriaController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\AuditLog;
use App\Helpers\ApiResponse;

class AuditoriaController extends Controller
{
    /**
     * Listar logs de auditoría (solo auditores y admin)
     */
    public function index(Request $request)
    {
        try {
            // Usar la vista que filtra automáticamente
            $query = DB::table('vista_audit_logs');

            // Filtros opcionales
            if ($request->has('tabla')) {
                $query->where('tabla_afectada', $request->tabla);
            }

            if ($request->has('operacion')) {
                $query->where('operacion', $request->operacion);
            }

            if ($request->has('usuario_id')) {
                $query->where('usuario_real_id', $request->usuario_id);
            }

            if ($request->has('fecha_desde')) {
                $query->where('fecha', '>=', $request->fecha_desde);
            }

            if ($request->has('fecha_hasta')) {
                $query->where('fecha', '<=', $request->fecha_hasta);
            }

            $logs = $query->orderBy('fecha', 'desc')->paginate(50);

            return ApiResponse::success($logs, 'Logs de auditoría obtenidos exitosamente');

        } catch (\Exception $e) {
            return ApiResponse::error('Error al obtener logs: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Obtener logs por tabla específica
     */
    public function byTable(Request $request, $tabla)
    {
        try {
            $logs = AuditLog::whereTablaAfectada($tabla)
                ->orderBy('fecha', 'desc')
                ->paginate(50);

            return ApiResponse::success($logs, "Logs de la tabla '{$tabla}' obtenidos exitosamente");

        } catch (\Exception $e) {
            return ApiResponse::error('Error al obtener logs: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Obtener logs por usuario específico
     */
    public function byUser(Request $request, $usuarioId)
    {
        try {
            $logs = AuditLog::whereUsuarioRealId($usuarioId)
                ->orderBy('fecha', 'desc')
                ->paginate(50);

            return ApiResponse::success($logs, "Logs del usuario {$usuarioId} obtenidos exitosamente");

        } catch (\Exception $e) {
            return ApiResponse::error('Error al obtener logs: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Obtener resumen de auditoría
     */
    public function resumen(Request $request)
    {
        try {
            $resumen = DB::select('
                SELECT
                    tabla_afectada,
                    operacion,
                    COUNT(*) as cantidad,
                    DATE(fecha) as dia
                FROM audit_logs
                WHERE fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY tabla_afectada, operacion, DATE(fecha)
                ORDER BY dia DESC, cantidad DESC
            ');

            $estadisticas = [
                'total_eventos' => AuditLog::count('*'),
                'eventos_hoy' => AuditLog::whereDate('fecha', today())->count(),
                'eventos_semana' => AuditLog::where('fecha', '>=', now()->subDays(7))->count(),
                'tablas_mas_activas' => DB::select('
                    SELECT tabla_afectada, COUNT(*) as total
                    FROM audit_logs
                    GROUP BY tabla_afectada
                    ORDER BY total DESC
                    LIMIT 5
                '),
                'usuarios_mas_activos' => DB::select('
                    SELECT u.nombre_completo, COUNT(*) as total
                    FROM audit_logs al
                    JOIN usuarios u ON al.usuario_real_id = u.id
                    GROUP BY al.usuario_real_id, u.nombre_completo
                    ORDER BY total DESC
                    LIMIT 5
                ')
            ];

            return ApiResponse::success([
                'resumen_por_dia' => $resumen,
                'estadisticas' => $estadisticas
            ], 'Resumen de auditoría obtenido exitosamente');

        } catch (\Exception $e) {
            return ApiResponse::error('Error al obtener resumen: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Exportar logs (solo admin)
     */
    public function exportar(Request $request)
    {
        try {
            $user = $request->user();

            if ($user->rol !== 'admin') {
                return ApiResponse::forbidden('Solo administradores pueden exportar logs');
            }

            $logs = AuditLog::with('usuario')
                ->orderBy('fecha', 'desc')
                ->limit(10000)
                ->get();

            // Convertir a CSV
            $csv = "ID,Tabla,Operación,Usuario,IP,Fecha,Datos Antes,Datos Después\n";

            foreach ($logs as $log) {
                $csv .= sprintf(
                    "%d,%s,%s,%s,%s,%s,%s,%s\n",
                    $log->id,
                    $log->tabla_afectada,
                    $log->operacion,
                    $log->usuario->nombre_completo ?? 'Sistema',
                    $log->ip_address ?? '-',
                    $log->fecha,
                    json_encode($log->datos_antes),
                    json_encode($log->datos_despues)
                );
            }

            return response($csv, 200)
                ->header('Content-Type', 'text/csv')
                ->header('Content-Disposition', 'attachment; filename="audit_logs_' . date('Y-m-d') . '.csv"');

        } catch (\Exception $e) {
            return ApiResponse::error('Error al exportar logs: ' . $e->getMessage(), 500);
        }
    }
}
