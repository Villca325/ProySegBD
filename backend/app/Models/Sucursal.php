<?php
// app/Models/Sucursal.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Sucursal extends Model
{
    use HasFactory;

    protected $table = 'sucursales';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'ciudad',
        'direccion',
        'telefono',
        'activa'
    ];

    protected $casts = [
        'activa' => 'boolean',
        'created_at' => 'datetime'
    ];

    // Relaciones
    public function usuarios()
    {
        return $this->hasMany(Usuario::class, 'sucursal_id');
    }

    public function productos()
    {
        return $this->hasMany(Producto::class, 'sucursal_id');
    }

    public function vendedores()
    {
        return $this->hasMany(Usuario::class, 'sucursal_id')
                    ->where('rol', 'vendedor');
    }

    public function gerentes()
    {
        return $this->hasMany(Usuario::class, 'sucursal_id')
                    ->where('rol', 'gerente');
    }

    // Scopes
    public function scopeActiva($query)
    {
        return $query->where('activa', true);
    }

    public function scopeInactiva($query)
    {
        return $query->where('activa', false);
    }

    public function scopePorCiudad($query, $ciudad)
    {
        return $query->where('ciudad', 'LIKE', "%{$ciudad}%");
    }
}
