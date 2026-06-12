<?php
// routes/api.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductoController;
use App\Http\Controllers\VentaController;
use App\Http\Controllers\AuditoriaController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\SolicitudVendedorController;
use Illuminate\Support\Facades\DB;

// Health check
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now(),
        'app' => 'Ecommerce Seguro',
        'version' => '1.0.0'
    ]);
});

// =====================================================
// RUTAS PÚBLICAS (no requieren autenticación)
// =====================================================

Route::prefix('auth')->group(function () {
    Route::post('/registro/cliente', [AuthController::class, 'registroCliente']);
    Route::post('/registro/vendedor/solicitar', [AuthController::class, 'solicitarRegistroVendedor']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/verificar-email', [AuthController::class, 'verificarEmail']);
});

// Sucursales públicas (para que los vendedores puedan ver las existentes)
Route::prefix('public')->group(function () {
    Route::get('/sucursales', function () {
        $sucursales = DB::table('sucursales')
            ->where('activa', true)
            ->select('id', 'nombre', 'ciudad', 'direccion')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $sucursales
        ]);
    });
    
});

// =====================================================
// RUTAS PROTEGIDAS (requieren autenticación)
// =====================================================

Route::middleware(['auth:sanctum', 'inyectarContext'])->group(function () {

    // =====================================================
    // AUTENTICACIÓN
    // =====================================================
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });

    // =====================================================
    // PRODUCTOS
    // =====================================================
    Route::prefix('productos')->group(function () {
        Route::get('/', [ProductoController::class, 'index']);
        Route::get('/categorias', [ProductoController::class, 'categorias']);
        Route::get('/vendedor/{vendedorId}', [ProductoController::class, 'porVendedor']);
        Route::get('/sucursal/{sucursalId}', [ProductoController::class, 'porSucursal']);
        Route::get('/{id}', [ProductoController::class, 'show']);
        Route::post('/', [ProductoController::class, 'store']);
        Route::put('/{id}', [ProductoController::class, 'update']);
        Route::delete('/{id}', [ProductoController::class, 'destroy']);
    });

    // =====================================================
    // VENTAS
    // =====================================================
    Route::prefix('ventas')->group(function () {
        Route::get('/', [VentaController::class, 'index']);
        Route::get('/estadisticas', [VentaController::class, 'estadisticas']);
        Route::get('/{id}', [VentaController::class, 'show']);
        Route::post('/comprar', [VentaController::class, 'store']);
        Route::put('/{id}/estado', [VentaController::class, 'updateEstado']);
    });

    // =====================================================
    // SOLICITUDES DE VENDEDORES (admin y gerente)
    // =====================================================


    // =====================================================
    // ADMINISTRACIÓN (solo admin)
    // =====================================================
    Route::prefix('admin')->middleware(['role:admin'])->group(function () {

        // Solicitudes (vista completa para admin)
        Route::get('/solicitudes', [AdminController::class, 'listarSolicitudes']);
        Route::get('/solicitudes/pendientes', [AdminController::class, 'solicitudesPendientes']);
        Route::get('/solicitudes/{solicitudId}', [AdminController::class, 'detalleSolicitud']);
        Route::post('/solicitudes/{solicitudId}/aprobar', [AdminController::class, 'aprobarVendedor']);
        Route::post('/solicitudes/{solicitudId}/rechazar', [AdminController::class, 'rechazarVendedor']);

        // Sucursales
        Route::get('/sucursales', [AdminController::class, 'listarSucursales']);
        Route::post('/sucursales', [AdminController::class, 'crearSucursal']);
        Route::put('/sucursales/{id}', [AdminController::class, 'actualizarSucursal']);
        Route::patch('/sucursales/{id}/toggle', [AdminController::class, 'toggleSucursal']);

        // Vendedores
        Route::get('/vendedores', [AdminController::class, 'listarVendedores']);
        Route::patch('/vendedores/{id}/toggle', [AdminController::class, 'toggleVendedor']);

        // Estadísticas generales
        Route::get('/estadisticas', [AdminController::class, 'estadisticas']);
    });

    // =====================================================
    // AUDITORÍA (solo auditores y admin)
    // =====================================================
    Route::prefix('audit')->middleware(['role:auditor,admin'])->group(function () {
        Route::get('/logs', [AuditoriaController::class, 'index']);
        Route::get('/logs/resumen', [AuditoriaController::class, 'resumen']);
        Route::get('/logs/table/{tabla}', [AuditoriaController::class, 'byTable']);
        Route::get('/logs/user/{usuarioId}', [AuditoriaController::class, 'byUser']);
        Route::get('/exportar', [AuditoriaController::class, 'exportar']);
    });
});
