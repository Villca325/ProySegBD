<?php
// app/Models/Venta.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Venta extends Model
{
    use HasFactory;

    protected $table = 'ventas';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'cliente_id',
        'total',
        'estado'
    ];

    protected $casts = [
        'total' => 'decimal:2',
        'fecha' => 'datetime'
    ];

    // Constantes para estados
    const ESTADO_PENDIENTE = 'pendiente';
    const ESTADO_PAGADO = 'pagado';
    const ESTADO_ENVIADO = 'enviado';
    const ESTADO_ENTREGADO = 'entregado';
    const ESTADO_CANCELADO = 'cancelado';

    const ESTADOS = [
        self::ESTADO_PENDIENTE,
        self::ESTADO_PAGADO,
        self::ESTADO_ENVIADO,
        self::ESTADO_ENTREGADO,
        self::ESTADO_CANCELADO
    ];

    // Relaciones
    public function cliente()
    {
        return $this->belongsTo(Usuario::class, 'cliente_id');
    }

    public function detalles()
    {
        return $this->hasMany(VentaDetalle::class, 'venta_id');
    }

    // Scopes
    public function scopePendientes($query)
    {
        return $query->where('estado', self::ESTADO_PENDIENTE);
    }

    public function scopePagados($query)
    {
        return $query->where('estado', self::ESTADO_PAGADO);
    }

    public function scopeEnviados($query)
    {
        return $query->where('estado', self::ESTADO_ENVIADO);
    }

    public function scopeEntregados($query)
    {
        return $query->where('estado', self::ESTADO_ENTREGADO);
    }

    public function scopeCancelados($query)
    {
        return $query->where('estado', self::ESTADO_CANCELADO);
    }

    public function scopePorCliente($query, $clienteId)
    {
        return $query->where('cliente_id', $clienteId);
    }

    public function scopePorFecha($query, $fechaInicio, $fechaFin)
    {
        return $query->whereBetween('fecha', [$fechaInicio, $fechaFin]);
    }

    // Métodos de ayuda
    public function puedeSerCancelada(): bool
    {
        return in_array($this->estado, [self::ESTADO_PENDIENTE, self::ESTADO_PAGADO]);
    }

    public function puedeSerEnviada(): bool
    {
        return $this->estado === self::ESTADO_PAGADO;
    }

    public function calcularTotal(): float
    {
        return $this->detalles->sum('subtotal');
    }

    public function actualizarTotal(): void
    {
        $this->total = $this->calcularTotal();
        $this->save();
    }
}
