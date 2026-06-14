<?php
// app/Http/Controllers/AuthController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\Usuario;
use App\Services\DatabaseContextService;
use App\Helpers\ApiResponse;
use App\Http\Requests\CambioPasswordRequest;
use App\Http\Requests\RegistroClienteRequest;
use App\Http\Requests\RegistroVendedorRequest;
use App\Http\Requests\LoginRequest;
use App\Models\Sucursal;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{

    /**
     * Registro de cliente (registro público)
     */
    public function registroCliente(RegistroClienteRequest $request)
    {
        try {
            $usuario = Usuario::create([
                'nombre_completo' => $request->nombre_completo,
                'email' => $request->email,
                'password' => $request->password,
                'rol' => 'cliente',
                'sucursal_id' => null,
                'activo' => true
            ]);

            $token = $usuario->createToken('auth_token', ['cliente'])->plainTextToken;

            return ApiResponse::success([
                'user' => $usuario->makeHidden(['password']),
                'token' => $token,
                'token_type' => 'Bearer'
            ], 'Cliente registrado exitosamente', 201);
        } catch (\Exception $e) {
            return ApiResponse::error('Error al registrar cliente: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Solicitud de registro de vendedor (requiere aprobación)
     * El vendedor debe elegir: crear nueva sucursal O unirse a una existente
     */
public function solicitarRegistroVendedor(RegistroVendedorRequest $request)
{
    try {
        $sucursalExistenteId = null;
        $sucursal = null;
        $mensajeSucursal = '';
        
        if ($request->tipo_sucursal === 'existente') {
            $sucursalExistenteId = $request->sucursal_existente_id;
            $sucursal = Sucursal::find($sucursalExistenteId);
            
            if (!$sucursal) {
                return ApiResponse::error('La sucursal seleccionada no existe', 422);
            }
            
            if (!$sucursal->activa) {
                return ApiResponse::error('La sucursal seleccionada no está activa', 422);
            }
            
            $mensajeSucursal = "Se te asignará a la sucursal '{$sucursal->nombre}' en {$sucursal->ciudad}";
        } else {
            $sucursal = Sucursal::create([
                'nombre' => $request->sucursal_nombre,
                'ciudad' => $request->sucursal_ciudad,
                'direccion' => $request->sucursal_direccion,
                'telefono' => $request->sucursal_telefono,
                'activa' => false,
                'created_at' => now()
            ]);
            
            $sucursalExistenteId = $sucursal->id;
            $mensajeSucursal = "Se creará la nueva sucursal '{$sucursal->nombre}' en {$sucursal->ciudad} (pendiente de activación por administrador)";
        }
        
        $solicitudExistente = DB::table('solicitudes_vendedores')
            ->where('email', $request->email)
            ->where('estado', 'pendiente')
            ->exists();
        
        if ($solicitudExistente) {
            return ApiResponse::error('Ya tienes una solicitud pendiente. Espera a que sea revisada.', 422);
        }
        
        $solicitudId = DB::table('solicitudes_vendedores')->insertGetId([
            'nombre_completo' => $request->nombre_completo,
            'email' => $request->email,
            'password' => $request->password,
            'tipo_sucursal' => $request->tipo_sucursal,
            'sucursal_sugerida_id' => $sucursalExistenteId,
            'estado' => 'pendiente',
            'fecha_solicitud' => now()
        ]);
        
        $mensaje = "Tu solicitud ha sido enviada. {$mensajeSucursal}. Un administrador revisará tu solicitud.";
        
        return ApiResponse::success([
            'solicitud_id' => $solicitudId,
            'estado' => 'pendiente',
            'tipo_sucursal' => $request->tipo_sucursal,
            'sucursal' => [
                'id' => $sucursal->id,
                'nombre' => $sucursal->nombre,
                'ciudad' => $sucursal->ciudad,
                'activa' => $sucursal->activa
            ],
            'mensaje' => $mensaje
        ], 'Solicitud de registro de vendedor enviada exitosamente', 201);
        
    } catch (\Exception $e) {
        return ApiResponse::error('Error al enviar solicitud: ' . $e->getMessage(), 500);
    }
}

    /**
     * Login de usuarios
     */
    public function login(LoginRequest $request)
    {
        try {
            $usuario = Usuario::whereEmail($request->email)
                ->where('activo', true)
                ->first();
                
            if (!$usuario) {
                return ApiResponse::error('Usuario o contraseña incorrectos', 401);
            }

            if (!Hash::check($request->password, $usuario->password)) {
                return ApiResponse::error('Usuario o contraseña incorrectos', 401);
            }

            DatabaseContextService::injectContext($usuario);

            $usuario->tokens()->delete();

            $abilities = [$usuario->rol];
            $token = $usuario->createToken('auth_token', $abilities)->plainTextToken;

            return ApiResponse::success([
                'user' => [
                    'id' => $usuario->id,
                    'nombre_completo' => $usuario->nombre_completo,
                    'email' => $usuario->email,
                    'rol' => $usuario->rol,
                    'sucursal_id' => $usuario->sucursal_id
                ],
                'token' => $token,
                'token_type' => 'Bearer',
                'session_context' => DatabaseContextService::getCurrentContext()
            ], 'Login exitoso');
        } catch (\Exception $e) {
            return ApiResponse::error('Error al iniciar sesión. Intenta nuevamente.', 500);
        }
    }

    /**
     * Logout - limpiar contexto de sesión
     */
    public function logout(Request $request)
    {
        try {
            DatabaseContextService::clearContext();

            $request->user()->currentAccessToken()->delete();

            return ApiResponse::success(null, 'Sesión cerrada exitosamente');
        } catch (\Exception $e) {
            return ApiResponse::error('Error al cerrar sesión: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Obtener usuario autenticado
     */
    public function me(Request $request)
    {
        try {
            $user = $request->user();
            $context = DatabaseContextService::getCurrentContext();

            return ApiResponse::success([
                'user' => $user->makeHidden(['password']),
                'session_context' => $context,
                'abilities' => $user->currentAccessToken()->abilities ?? []
            ]);
        } catch (\Exception $e) {
            return ApiResponse::error('Error al obtener usuario: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Verificar si el email ya está registrado
     */
    public function verificarEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email'
        ]);

        $existe = Usuario::whereEmail($request->email)->exists();

        return ApiResponse::success([
            'email' => $request->email,
            'existe' => $existe
        ]);
    }


    /**
     * Cambiar contraseña del usuario autenticado
     */
    public function cambiarPassword(CambioPasswordRequest $request)
    {
        try {
            $user = $request->user();
            
            if (!Hash::check($request->current_password, $user->password)) {
                return ApiResponse::error('La contraseña actual es incorrecta', 422);
            }
            
            $user->password = $request->new_password;
            $user->save();
            
            return ApiResponse::success(null, 'Contraseña actualizada exitosamente');
            
        } catch (\Exception $e) {
            return ApiResponse::error('Error al cambiar contraseña: ' . $e->getMessage(), 500);
        }
    }
}
