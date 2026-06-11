<?php
// app/Models/VentaDetalle.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class VentaDetalle extends Model
{
    use HasFactory;

    protected $table = 'ventas_detalle';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'venta_id',
        'producto_id',
        'cantidad',
        'precio_unitario',
        'subtotal'
    ];

    protected $casts = [
        'cantidad' => 'integer',
        'precio_unitario' => 'decimal:2',
        'subtotal' => 'decimal:2'
    ];

    // Relaciones
    public function venta()
    {
        return $this->belongsTo(Venta::class, 'venta_id');
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    // Scopes
    public function scopePorVenta($query, $ventaId)
    {
        return $query->where('venta_id', $ventaId);
    }

    public function scopePorProducto($query, $productoId)
    {
        return $query->where('producto_id', $productoId);
    }

    // Métodos de ayuda
    public function calcularSubtotal(): float
    {
        return $this->cantidad * $this->precio_unitario;
    }

    public function actualizarSubtotal(): void
    {
        $this->subtotal = $this->calcularSubtotal();
        $this->save();
    }
}
