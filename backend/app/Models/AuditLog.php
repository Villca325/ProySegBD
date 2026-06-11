<?php
// app/Models/AuditLog.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AuditLog extends Model
{
    use HasFactory;

    protected $table = 'audit_logs';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'tabla_afectada',
        'operacion',
        'usuario_real_id',
        'usuario_tecnico',
        'ip_address',
        'datos_antes',
        'datos_despues'
    ];

    protected $casts = [
        'datos_antes' => 'array',
        'datos_despues' => 'array',
        'fecha' => 'datetime'
    ];

    // Relaciones
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_real_id');
    }

    // Scopes
    public function scopePorTabla($query, $tabla)
    {
        return $query->where('tabla_afectada', $tabla);
    }

    public function scopePorOperacion($query, $operacion)
    {
        return $query->where('operacion', $operacion);
    }

    public function scopePorUsuario($query, $usuarioId)
    {
        return $query->where('usuario_real_id', $usuarioId);
    }

    public function scopePorFecha($query, $fechaInicio, $fechaFin)
    {
        return $query->whereBetween('fecha', [$fechaInicio, $fechaFin]);
    }

    public function scopeUltimosDias($query, $dias = 7)
    {
        return $query->where('fecha', '>=', now()->subDays($dias));
    }

    // Métodos de ayuda
    public function esInsercion(): bool
    {
        return $this->operacion === 'INSERT';
    }

    public function esActualizacion(): bool
    {
        return $this->operacion === 'UPDATE';
    }

    public function esEliminacion(): bool
    {
        return $this->operacion === 'DELETE';
    }
}
