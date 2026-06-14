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
        $user = $request->user();
        
        if ($user) {
            DatabaseContextService::injectContext($user);
        } else {
            DatabaseContextService::clearContext();
        }

        return $next($request);
    }

    /**
     * Handle tasks after the response has been sent
     */
    public function terminate(Request $request, $response): void
    {
        DatabaseContextService::clearContext();
    }
}
