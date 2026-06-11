<?php
// routes/api.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductoController;
use App\Http\Controllers\VentaController;
use App\Http\Controllers\AuditoriaController;

// Health check
Route::get('/health', function() {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now(),
        'app' => 'Ecommerce Seguro',
        'version' => '1.0.0'
    ]);
});

// Rutas públicas
Route::prefix('auth')->group(function () {
    Route::post('/registro/cliente', [AuthController::class, 'registroCliente']);
    Route::post('/registro/vendedor/solicitar', [AuthController::class, 'solicitarRegistroVendedor']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/verificar-email', [AuthController::class, 'verificarEmail']);
});

// Rutas protegidas (requieren autenticación)
Route::middleware(['auth:sanctum','inyectarContext'])->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });

    // Productos
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

    // Ventas
    Route::prefix('ventas')->group(function () {
        Route::get('/', [VentaController::class, 'index']);
        Route::get('/estadisticas', [VentaController::class, 'estadisticas']);
        Route::get('/{id}', [VentaController::class, 'show']);
        Route::post('/comprar', [VentaController::class, 'store']);
        Route::put('/{id}/estado', [VentaController::class, 'updateEstado']);
    });

    // Auditoría (solo auditores y admin)
    Route::prefix('audit')->middleware(['role:auditor,admin'])->group(function () {
        Route::get('/logs', [AuditoriaController::class, 'index']);
        Route::get('/logs/resumen', [AuditoriaController::class, 'resumen']);
        Route::get('/logs/table/{tabla}', [AuditoriaController::class, 'byTable']);
        Route::get('/logs/user/{usuarioId}', [AuditoriaController::class, 'byUser']);
        Route::get('/exportar', [AuditoriaController::class, 'exportar']);
    });
});
