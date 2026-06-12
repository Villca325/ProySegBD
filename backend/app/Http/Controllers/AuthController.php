<?php
// app/Http/Controllers/AuthController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\Usuario;
use App\Services\DatabaseContextService;
use App\Helpers\ApiResponse;
use App\Http\Requests\RegistroClienteRequest;
use App\Http\Requests\RegistroVendedorRequest;
use App\Http\Requests\LoginRequest;
use App\Models\Sucursal;

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

            // Generar token
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
            // Unirse a sucursal existente (debe estar activa)
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
            // Crear nueva sucursal (se crea INACTIVA)
            $sucursal = Sucursal::create([
                'nombre' => $request->sucursal_nombre,
                'ciudad' => $request->sucursal_ciudad,
                'direccion' => $request->sucursal_direccion,
                'telefono' => $request->sucursal_telefono,
                'activa' => false,  // La sucursal se crea inactiva
                'created_at' => now()
            ]);
            
            $sucursalExistenteId = $sucursal->id;
            $mensajeSucursal = "Se creará la nueva sucursal '{$sucursal->nombre}' en {$sucursal->ciudad} (pendiente de activación por administrador)";
        }
        
        // Verificar si ya existe una solicitud pendiente para este email
        $solicitudExistente = DB::table('solicitudes_vendedores')
            ->where('email', $request->email)
            ->where('estado', 'pendiente')
            ->exists();
        
        if ($solicitudExistente) {
            return ApiResponse::error('Ya tienes una solicitud pendiente. Espera a que sea revisada.', 422);
        }
        
        // Insertar en tabla de solicitudes
        $solicitudId = DB::table('solicitudes_vendedores')->insertGetId([
            'nombre_completo' => $request->nombre_completo,
            'email' => $request->email,
            'password' => bcrypt($request->password),
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
            // Buscar usuario por email
            $usuario = Usuario::whereEmail($request->email)
                ->where('activo', true)
                ->first();

            if (!$usuario || !Hash::check($request->password, $usuario->password)) {
                return ApiResponse::error('Credenciales inválidas o usuario inactivo', 401);
            }

            // Inyectar contexto de sesión (¡CRÍTICO para FGAC/RLS!)
            DatabaseContextService::injectContext($usuario);

            // Eliminar tokens anteriores
            $usuario->tokens()->delete();

            // Crear nuevo token con habilidad según rol
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
            return ApiResponse::error('Error en login: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Logout - limpiar contexto de sesión
     */
    public function logout(Request $request)
    {
        try {
            // Limpiar contexto de sesión en BD (¡CRÍTICO para evitar fugas!)
            DatabaseContextService::clearContext();

            // Revocar token actual
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

            // Obtener contexto actual de BD
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
}
