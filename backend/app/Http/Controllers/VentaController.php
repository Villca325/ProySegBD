<?php
// app/Http/Controllers/VentaController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Venta;
use App\Helpers\ApiResponse;
use App\Http\Requests\CompraRequest;
use App\Http\Requests\UpdateVentaEstadoRequest;
use Illuminate\Support\Facades\Log;

class VentaController extends Controller
{
    /**
     * Listar ventas según rol (usa vistas con RLS)
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $ventas = [];
            $query = null;

            // Según el rol, usar la vista correspondiente
            switch ($user->rol) {
                case 'cliente':
                    $query = DB::table('vista_mis_compras');
                    break;

                case 'vendedor':
                    $query = DB::table('vista_mis_ventas');
                    break;

                case 'gerente':
                    $query = DB::table('vista_ventas_sucursal');
                    break;

                case 'admin':
                case 'auditor':
                    // Admin y auditor ven todas las ventas con relaciones
                    $ventas = Venta::with(['cliente', 'detalles.producto'])
                        ->orderBy('fecha', 'desc')
                        ->paginate(20);

                    return ApiResponse::success($ventas, 'Ventas obtenidas exitosamente');

                default:
                    return ApiResponse::forbidden('Rol no autorizado para ver ventas');
                    }
                    
            // Aplicar filtros adicionales
            if ($request->has('estado')) {
                $query->where('estado', $request->estado);
            }
                
                
            if ($request->has('fecha_desde')) {
                $query->where('fecha', '>=', $request->fecha_desde);
            }

            if ($request->has('fecha_hasta')) {
                $query->where('fecha', '<=', $request->fecha_hasta);
            }

            $ventas = $query->orderBy('fecha', 'desc')->paginate(20);

            return ApiResponse::success($ventas, 'Ventas obtenidas exitosamente');

        } catch (\Exception $e) {
            return ApiResponse::error('Error al listar ventas: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Obtener detalle de una venta específica
     */
    public function show(Request $request, $id)
    {
        try {
            $user = $request->user();
            $venta = null;

            switch ($user->rol) {
                case 'cliente':
                    $venta = DB::table('vista_mis_compras')
                        ->where('id', $id)
                        ->first();

                    break;
                    
                case 'vendedor':
                    $venta = DB::table('vista_mis_ventas')
                    ->where('venta_id', $id)
                    ->first();
                    break;

                case 'gerente':
                    $venta = DB::table('vista_ventas_sucursal')
                    ->where('venta_id', $id)
                    ->first();
                    break;
                    
                case 'admin':
                case 'auditor':
                    $venta = Venta::with(['cliente', 'detalles.producto'])->find($id);
                    break;
                    
                default:
                    return ApiResponse::forbidden('No tienes permiso para ver esta venta');
            }
                                    
            Log::info($user->rol);
            if (!$venta) {
                return ApiResponse::notFound('Venta no encontrada o no tienes permisos para verla');
            }

            return ApiResponse::success($venta, 'Detalle de venta obtenido exitosamente');

        } catch (\Exception $e) {
            Log::info("HPLA");
            return ApiResponse::error('Error al obtener detalle de venta: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Realizar una compra (solo clientes)
     */
    public function store(CompraRequest $request)
    {
        try {
            $result = DB::select(
                'CALL sp_realizar_compra(?, ?)',
                [$request->producto_id, $request->cantidad]
            );

            $ventaId = $result[0]->venta_id ?? null;
            $total = $result[0]->total ?? 0;

            // Obtener la venta creada
            $venta = DB::table('vista_mis_compras')->where('id', $ventaId)->first();

            return ApiResponse::success([
                'venta' => $venta,
                'venta_id' => $ventaId,
                'total' => $total
            ], 'Compra realizada exitosamente', 201);

        } catch (\Exception $e) {
            return ApiResponse::error('Error al realizar compra: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Actualizar estado de venta
     */
    public function updateEstado(UpdateVentaEstadoRequest $request, $id)
    {
        try {
            Log::info($request->estado);
                DB::statement(
                    'CALL sp_actualizar_estado_venta(?, ?)',
                    [$id, $request->estado]
                );

                
                return ApiResponse::success([
                    'venta_id' => $id,
                    'nuevo_estado' => $request->estado
                ], 'Estado de venta actualizado exitosamente');
                
            } catch (\Exception $e) {
            return ApiResponse::error('Error al actualizar estado: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Obtener estadísticas de ventas (según rol)
     */
    public function estadisticas(Request $request)
    {
        try {
            $user = $request->user();
            $stats = [];

            switch ($user->rol) {
                case 'vendedor':
                    $stats = DB::select('
                        SELECT
                            COUNT(*) as total_ventas,
                            SUM(v.venta_total) as total_facturado,
                            AVG(v.venta_total) as promedio_venta,
                            COUNT(DISTINCT v.cliente_id) as clientes_unicos
                        FROM vista_mis_ventas v
                    ');
                    break;

                case 'gerente':
                    $stats = DB::select('
                        SELECT
                            COUNT(*) as total_ventas,
                            SUM(venta_total) as total_facturado,
                            AVG(venta_total) as promedio_venta,
                            COUNT(DISTINCT cliente_id) as clientes_unicos
                        FROM vista_ventas_sucursal
                    ');
                    break;

                case 'admin':
                    $stats = DB::select('
                        SELECT
                            COUNT(*) as total_ventas,
                            SUM(total) as total_facturado,
                            AVG(total) as promedio_venta,
                            COUNT(DISTINCT cliente_id) as clientes_unicos
                        FROM ventas
                    ');
                    break;

                default:
                    return ApiResponse::forbidden('No tienes permiso para ver estadísticas');
            }

            return ApiResponse::success($stats[0], 'Estadísticas obtenidas exitosamente');

        } catch (\Exception $e) {
            return ApiResponse::error('Error al obtener estadísticas: ' . $e->getMessage(), 500);
        }
    }
}
