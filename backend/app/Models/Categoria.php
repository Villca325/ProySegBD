<?php
// app/Models/Categoria.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Categoria extends Model
{
    use HasFactory;

    protected $table = 'categorias';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'descripcion'
    ];

    // Relaciones
    public function productos()
    {
        return $this->hasMany(Producto::class, 'categoria_id');
    }

    // Scopes
    public function scopeConProductos($query)
    {
        return $query->has('productos');
    }

    // Métodos de ayuda
    public function cantidadProductos(): int
    {
        return $this->productos()->count();
    }

    public function productosActivos()
    {
        return $this->productos()->where('activo', true);
    }
}
