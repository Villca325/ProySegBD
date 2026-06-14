<?php
// app/Services/DatabaseContextService.php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use App\Models\Usuario;
use Illuminate\Support\Facades\Log;

class DatabaseContextService
{
    /**
     * Inyectar contexto de usuario en la sesión de BD
     * Esta es la clave para resolver la "amnesia de identidad"
     */
    public static function injectContext(Usuario $user): void
    {
        DB::statement('SET @app_user_id = ?', [$user->id]);
        DB::statement('SET @app_user_role = ?', [$user->rol]);
        DB::statement('SET @app_user_sucursal_id = ?', [$user->sucursal_id]);
        }

    /**
     * Limpiar contexto de sesión (importante al cerrar sesión)
     */
    public static function clearContext(): void
    {
        DB::statement('SET @app_user_id = NULL');
        DB::statement('SET @app_user_role = NULL');
        DB::statement('SET @app_user_sucursal_id = NULL');
    }

    /**
     * Obtener contexto actual (para debugging)
     */
    public static function getCurrentContext(): array
    {
        $userId = DB::select('SELECT @app_user_id as user_id')[0]->user_id ?? null;
        $userRole = DB::select('SELECT @app_user_role as user_role')[0]->user_role ?? null;
        $sucursalId = DB::select('SELECT @app_user_sucursal_id as sucursal_id')[0]->sucursal_id ?? null;

        return [
            'user_id' => $userId,
            'user_role' => $userRole,
            'sucursal_id' => $sucursalId,
        ];
    }

    /**
     * Verificar si hay un contexto activo
     */
    public static function hasActiveContext(): bool
    {
        $context = self::getCurrentContext();
        return !is_null($context['user_id']);
    }
}
