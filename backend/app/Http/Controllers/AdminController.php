<?php
// app/Http/Controllers/AdminController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Usuario;
use App\Models\Sucursal;
use App\Helpers\ApiResponse;
use Illuminate\Support\Facades\Log;

class AdminController extends Controller
{
    /**
     * Listar solicitudes pendientes de vendedores
     */
    public function solicitudesPendientes()
    {
        try {
            $solicitudes = DB::table('solicitudes_vendedores as sv')
                ->leftJoin('sucursales as s', 'sv.sucursal_sugerida_id', '=', 's.id')
                ->where('sv.estado', 'pendiente')
                ->select(
                    'sv.id',
                    'sv.nombre_completo',
                    'sv.email',
                    'sv.tipo_sucursal',
                    'sv.sucursal_sugerida_id',
                    's.nombre as sucursal_nombre',
                    's.ciudad as sucursal_ciudad',
                    's.activa as sucursal_activa',
                    'sv.fecha_solicitud'
                )
                ->orderBy('sv.fecha_solicitud', 'asc')
                ->get();

            return ApiResponse::success($solicitudes, 'Solicitudes pendientes obtenidas exitosamente');
        } catch (\Exception $e) {
            return ApiResponse::error('Error al obtener solicitudes: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Listar todas las solicitudes (con filtros)
     */
    public function listarSolicitudes(Request $request)
    {
        try {
            $query = DB::table('solicitudes_vendedores as sv')
                ->leftJoin('sucursales as s', 'sv.sucursal_sugerida_id', '=', 's.id')
                ->leftJoin('usuarios as u', 'sv.admin_id', '=', 'u.id')
                ->select(
                    'sv.id',
                    'sv.nombre_completo',
                    'sv.email',
                    'sv.tipo_sucursal',
                    'sv.estado',
                    'sv.sucursal_sugerida_id',
                    's.nombre as sucursal_nombre',
                    's.ciudad as sucursal_ciudad',
                    'sv.fecha_solicitud',
                    'sv.fecha_resolucion',
                    'u.nombre_completo as admin_nombre',
                    'sv.comentarios'
                );

            // Filtros
            if ($request->has('estado') && in_array($request->estado, ['pendiente', 'aprobada', 'rechazada'])) {
                $query->where('sv.estado', $request->estado);
            }

            if ($request->has('tipo_sucursal') && in_array($request->tipo_sucursal, ['nueva', 'existente'])) {
                $query->where('sv.tipo_sucursal', $request->tipo_sucursal);
            }

            $solicitudes = $query->orderBy('sv.fecha_solicitud', 'desc')->paginate(20);

            return ApiResponse::success($solicitudes, 'Solicitudes obtenidas exitosamente');
        } catch (\Exception $e) {
            return ApiResponse::error('Error al listar solicitudes: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Obtener detalle de una solicitud específica
     */
    public function detalleSolicitud($solicitudId)
    {
        try {
            $solicitud = DB::table('solicitudes_vendedores as sv')
                ->leftJoin('sucursales as s', 'sv.sucursal_sugerida_id', '=', 's.id')
                ->leftJoin('usuarios as u', 'sv.admin_id', '=', 'u.id')
                ->where('sv.id', $solicitudId)
                ->select(
                    'sv.*',
                    's.nombre as sucursal_nombre',
                    's.ciudad as sucursal_ciudad',
                    's.direccion as sucursal_direccion',
                    's.telefono as sucursal_telefono',
                    's.activa as sucursal_activa',
                    'u.nombre_completo as admin_nombre'
                )
                ->first();

            if (!$solicitud) {
                return ApiResponse::notFound('Solicitud no encontrada');
            }

            return ApiResponse::success($solicitud, 'Detalle de solicitud obtenido exitosamente');
        } catch (\Exception $e) {
            return ApiResponse::error('Error al obtener detalle: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Aprobar solicitud de vendedor
     * - Si la sucursal está inactiva, la activa
     * - Crea el usuario vendedor
     */
    public function aprobarVendedor(Request $request, $solicitudId)
    {
        try {
            // Validar comentario opcional
            $request->validate([
                'comentarios' => 'nullable|string|max:500'
            ]);

            // Obtener solicitud
            $solicitud = DB::table('solicitudes_vendedores')
                ->where('id', $solicitudId)
                ->where('estado', 'pendiente')
                ->first();

            if (!$solicitud) {
                return ApiResponse::notFound('Solicitud no encontrada o ya procesada');
            }

            $user = $request->user();
            $sucursalId = $solicitud->sucursal_sugerida_id;

            $sucursal = Sucursal::find($sucursalId);
            if (!$sucursal) {
                return ApiResponse::error('La sucursal asociada a la solicitud no existe', 422);
            }

            // Si es gerente, verificar que la sucursal le pertenece
            if ($user->rol === 'gerente') {
                if ($solicitud->tipo_sucursal === 'existente' && $sucursalId != $user->sucursal_id) {
                    return ApiResponse::forbidden('No puedes aprobar esta solicitud porque la sucursal no te pertenece');
                }
                if ($solicitud->tipo_sucursal === 'nueva') {
                    return ApiResponse::forbidden('Los gerentes no pueden aprobar solicitudes de nuevas sucursales. Solo el administrador puede hacerlo.');
                }
            }

            // Activar la sucursal si está inactiva (solo si es nueva o si admin la activa)
            if (!$sucursal->activa) {
                $sucursal->activa = true;
                $sucursal->save();
            }

            // Verificar si el email ya está registrado
            $existeUsuario = Usuario::where('email', $solicitud->email)->exists();
            if ($existeUsuario) {
                return ApiResponse::error('El email ya está registrado como usuario', 422);
            }

            // Crear el usuario vendedor
            $vendedor = Usuario::create([
                'nombre_completo' => $solicitud->nombre_completo,
                'email' => $solicitud->email,
                'password' => $solicitud->password, // Ya está hasheado
                'rol' => 'vendedor',
                'sucursal_id' => $sucursalId,
                'activo' => true,
                'created_at' => now()
            ]);

            // Actualizar estado de la solicitud
            DB::table('solicitudes_vendedores')
                ->where('id', $solicitudId)
                ->update([
                    'estado' => 'aprobada',
                    'fecha_resolucion' => now(),
                    'admin_id' => $user->id,
                    'comentarios' => $request->comentarios
                ]);

            // Obtener información actualizada de la sucursal
            $sucursalInfo = Sucursal::find($sucursalId);

            return ApiResponse::success([
                'vendedor' => $vendedor->makeHidden(['password']),
                'sucursal' => $sucursalInfo,
                'tipo_sucursal' => $solicitud->tipo_sucursal,
                'solicitud_id' => $solicitudId,
                'aprobado_por' => $user->nombre_completo,
                'rol_aprobador' => $user->rol
            ], 'Vendedor aprobado exitosamente. La sucursal ha sido activada.');
        } catch (\Exception $e) {
            return ApiResponse::error('Error al aprobar vendedor: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Rechazar solicitud de vendedor
     */
    public function rechazarVendedor(Request $request, $solicitudId)
    {
        try {
            $request->validate([
                'motivo' => 'required|string|max:500'
            ]);

            $user = $request->user();

            // Obtener la solicitud antes de rechazarla
            $solicitud = DB::table('solicitudes_vendedores')
                ->where('id', $solicitudId)
                ->where('estado', 'pendiente')
                ->first();


            if (!$solicitud) {
                return ApiResponse::notFound('Solicitud no encontrada o ya procesada');
            }

            // Si es gerente, verificar permisos
            if ($user->rol === 'gerente') {
                if ($solicitud->tipo_sucursal === 'existente') {
                    $sucursal = Sucursal::find($solicitud->sucursal_sugerida_id);
                    if (!$sucursal || $sucursal->id != $user->sucursal_id) {
                        return ApiResponse::forbidden('No puedes rechazar esta solicitud');
                    }
                } else {
                    return ApiResponse::forbidden('Los gerentes no pueden rechazar solicitudes de nuevas sucursales');
                }
            }

            // Si era nueva sucursal y está inactiva, eliminarla
            if ($solicitud->tipo_sucursal === 'nueva' && $solicitud->sucursal_sugerida_id) {

                $sucursal = Sucursal::find($solicitud->sucursal_sugerida_id);
                if ($sucursal && !$sucursal->activa) {
                    $usuarios_sucursal = $sucursal->usuarios();
                    Log::info($sucursal->get());
                    DB::table('solicitudes_vendedores')
                        ->where('id', $solicitudId)
                        ->update([
                            'sucursal_sugerida_id' => null,
                        ]);
                    $sucursal->delete();
                }
            }

            // Actualizar estado de la solicitud
            DB::table('solicitudes_vendedores')
                ->where('id', $solicitudId)
                ->update([
                    'estado' => 'rechazada',
                    'fecha_resolucion' => now(),
                    'admin_id' => $user->id,
                    'comentarios' => $request->motivo
                ]);

            return ApiResponse::success([
                'solicitud_id' => $solicitudId,
                'motivo' => $request->motivo,
                'rechazado_por' => $user->nombre_completo
            ], 'Solicitud rechazada exitosamente');
        } catch (\Exception $e) {
            $solicitud = DB::table('solicitudes_vendedores')
                ->where('id', $solicitudId)
                ->where('estado', 'pendiente')
                ->first();
            Log::info($solicitud->sucursal_sugerida_id);
            return ApiResponse::error('Error al rechazar solicitud: ' . $e->getMessage(), 500);
        }
    }


    /**
     * Listar todas las sucursales (con filtros)
     */
    public function listarSucursales(Request $request)
    {
        try {
            $query = Sucursal::query();

            // Filtros
            if ($request->has('activa')) {
                $query->where('activa', $request->boolean('activa'));
            }

            if ($request->has('ciudad')) {
                $query->where('ciudad', 'LIKE', '%' . $request->ciudad . '%');
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('nombre', 'LIKE', "%{$search}%")
                        ->orWhere('ciudad', 'LIKE', "%{$search}%")
                        ->orWhere('direccion', 'LIKE', "%{$search}%");
                });
            }

            $sucursales = $query->orderBy('nombre')->paginate(20);

            // Agregar conteo de vendedores por sucursal
            foreach ($sucursales as $sucursal) {
                $sucursal->cantidad_vendedores = Usuario::where('sucursal_id', $sucursal->id)
                    ->where('rol', 'vendedor')
                    ->where('activo', true)
                    ->count();
            }

            return ApiResponse::success($sucursales, 'Sucursales obtenidas exitosamente');
        } catch (\Exception $e) {
            return ApiResponse::error('Error al listar sucursales: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Crear sucursal manualmente (admin)
     */
    public function crearSucursal(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:100',
            'ciudad' => 'required|string|max:100',
            'direccion' => 'nullable|string|max:200',
            'telefono' => 'nullable|string|max:20',
            'activa' => 'boolean'
        ]);

        try {
            $sucursal = Sucursal::create([
                'nombre' => $request->nombre,
                'ciudad' => $request->ciudad,
                'direccion' => $request->direccion,
                'telefono' => $request->telefono,
                'activa' => $request->activa ?? true
            ]);

            return ApiResponse::success($sucursal, 'Sucursal creada exitosamente', 201);
        } catch (\Exception $e) {
            return ApiResponse::error('Error al crear sucursal: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Actualizar sucursal
     */
    public function actualizarSucursal(Request $request, $id)
    {
        $request->validate([
            'nombre' => 'sometimes|string|max:100',
            'ciudad' => 'sometimes|string|max:100',
            'direccion' => 'nullable|string|max:200',
            'telefono' => 'nullable|string|max:20',
            'activa' => 'boolean'
        ]);

        try {
            $sucursal = Sucursal::find($id);

            if (!$sucursal) {
                return ApiResponse::notFound('Sucursal no encontrada');
            }

            $sucursal->update($request->only(['nombre', 'ciudad', 'direccion', 'telefono', 'activa']));

            return ApiResponse::success($sucursal, 'Sucursal actualizada exitosamente');
        } catch (\Exception $e) {
            return ApiResponse::error('Error al actualizar sucursal: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Activar/Desactivar sucursal
     */
    public function toggleSucursal($id)
    {
        try {
            $sucursal = Sucursal::find($id);

            if (!$sucursal) {
                return ApiResponse::notFound('Sucursal no encontrada');
            }

            $sucursal->activa = !$sucursal->activa;
            $sucursal->save();

            $estado = $sucursal->activa ? 'activada' : 'desactivada';

            return ApiResponse::success([
                'id' => $sucursal->id,
                'activa' => $sucursal->activa
            ], "Sucursal {$estado} exitosamente");
        } catch (\Exception $e) {
            return ApiResponse::error('Error al cambiar estado de sucursal: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Listar todos los vendedores
     */
    public function listarVendedores(Request $request)
    {
        try {
            $query = Usuario::where('rol', 'vendedor')
                ->with('sucursal');

            // Filtros
            if ($request->has('activo')) {
                $query->where('activo', $request->boolean('activo'));
            }

            if ($request->has('sucursal_id')) {
                $query->where('sucursal_id', $request->sucursal_id);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('nombre_completo', 'LIKE', "%{$search}%")
                        ->orWhere('email', 'LIKE', "%{$search}%");
                });
            }

            $vendedores = $query->orderBy('nombre_completo')
                ->paginate(20)
                ->makeHidden(['password']);

            return ApiResponse::success($vendedores, 'Vendedores obtenidos exitosamente');
        } catch (\Exception $e) {
            return ApiResponse::error('Error al listar vendedores: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Activar/Desactivar vendedor
     */
    public function toggleVendedor($id)
    {
        try {
            $vendedor = Usuario::where('id', $id)
                ->where('rol', 'vendedor')
                ->first();

            if (!$vendedor) {
                return ApiResponse::notFound('Vendedor no encontrado');
            }

            $vendedor->activo = !$vendedor->activo;
            $vendedor->save();

            $estado = $vendedor->activo ? 'activado' : 'desactivado';

            return ApiResponse::success([
                'id' => $vendedor->id,
                'nombre' => $vendedor->nombre_completo,
                'activo' => $vendedor->activo
            ], "Vendedor {$estado} exitosamente");
        } catch (\Exception $e) {
            return ApiResponse::error('Error al cambiar estado del vendedor: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Estadísticas generales del sistema (solo admin)
     */
    public function estadisticas()
    {
        try {
            $stats = [
                'usuarios' => [
                    'total' => Usuario::count(),
                    'clientes' => Usuario::where('rol', 'cliente')->count(),
                    'vendedores' => Usuario::where('rol', 'vendedor')->count(),
                    'vendedores_activos' => Usuario::where('rol', 'vendedor')->where('activo', true)->count(),
                    'gerentes' => Usuario::where('rol', 'gerente')->count(),
                    'auditores' => Usuario::where('rol', 'auditor')->count(),
                    'admins' => Usuario::where('rol', 'admin')->count(),
                ],
                'sucursales' => [
                    'total' => Sucursal::count(),
                    'activas' => Sucursal::where('activa', true)->count(),
                    'inactivas' => Sucursal::where('activa', false)->count(),
                ],
                'solicitudes' => [
                    'pendientes' => DB::table('solicitudes_vendedores')->where('estado', 'pendiente')->count(),
                    'aprobadas' => DB::table('solicitudes_vendedores')->where('estado', 'aprobada')->count(),
                    'rechazadas' => DB::table('solicitudes_vendedores')->where('estado', 'rechazada')->count(),
                ],
                'productos' => [
                    'total' => DB::table('productos')->count(),
                    'activos' => DB::table('productos')->where('activo', true)->count(),
                    'sin_stock' => DB::table('productos')->where('stock', 0)->count(),
                ],
                'ventas' => [
                    'total' => DB::table('ventas')->count(),
                    'total_facturado' => DB::table('ventas')->sum('total'),
                    'promedio_venta' => DB::table('ventas')->avg('total'),
                ]
            ];

            return ApiResponse::success($stats, 'Estadísticas obtenidas exitosamente');
        } catch (\Exception $e) {
            return ApiResponse::error('Error al obtener estadísticas: ' . $e->getMessage(), 500);
        }
    }
}
