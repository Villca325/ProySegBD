<?php
// app/Http/Middleware/InjectUserContext.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\DatabaseContextService;
use Illuminate\Support\Facades\Log;

class InjectUserContext
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        // Obtener usuario autenticado desde Sanctum
        $user = $request->user();
        // Log::info($request);
        if ($user) {
            // Inyectar variables de sesión en MySQL
            DatabaseContextService::injectContext($user);
        } else {
            // Limpiar contexto si no hay usuario
            DatabaseContextService::clearContext();
        }

        return $next($request);
    }

    /**
     * Handle tasks after the response has been sent
     */
    public function terminate(Request $request, $response): void
    {
        // Limpiar contexto al finalizar la request
        // Esto es importante para evitar fugas de información
        DatabaseContextService::clearContext();
    }
}
