<?php
// app/Models/Usuario.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Usuario extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'usuarios';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'nombre_completo',
        'email',
        'password',
        'rol',
        'sucursal_id',
        'activo'
    ];

    protected $hidden = [
        'password'
    ];

    protected $casts = [
        'activo' => 'boolean',
        'sucursal_id' => 'integer',
        'created_at' => 'datetime'
    ];

    // Mutador para hashear password automáticamente
    protected function password(): Attribute
    {
        return Attribute::make(
            set: fn ($value) => bcrypt($value)
        );
    }

    // Relaciones
    public function sucursal()
    {
        return $this->belongsTo(Sucursal::class, 'sucursal_id');
    }

    public function productos()
    {
        return $this->hasMany(Producto::class, 'vendedor_id');
    }

    public function ventasComoCliente()
    {
        return $this->hasMany(Venta::class, 'cliente_id');
    }

    public function logsAuditoria()
    {
        return $this->hasMany(AuditLog::class, 'usuario_real_id');
    }

    // Scopes útiles
    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }

    public function scopeInactivo($query)
    {
        return $query->where('activo', false);
    }

    public function scopeRol($query, $rol)
    {
        return $query->where('rol', $rol);
    }

    public function scopeVendedores($query)
    {
        return $query->where('rol', 'vendedor');
    }

    public function scopeClientes($query)
    {
        return $query->where('rol', 'cliente');
    }

    // Métodos de ayuda
    public function isCliente(): bool
    {
        return $this->rol === 'cliente';
    }

    public function isVendedor(): bool
    {
        return $this->rol === 'vendedor';
    }

    public function isGerente(): bool
    {
        return $this->rol === 'gerente';
    }

    public function isAuditor(): bool
    {
        return $this->rol === 'auditor';
    }

    public function isAdmin(): bool
    {
        return $this->rol === 'admin';
    }
}
