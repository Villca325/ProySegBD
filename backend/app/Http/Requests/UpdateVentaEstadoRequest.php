<?php
// app/Http/Requests/UpdateVentaEstadoRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Venta;

class UpdateVentaEstadoRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        return $user && in_array($user->rol, ['vendedor', 'gerente', 'admin']);
    }

    public function rules(): array
    {
        return [
            'estado' => 'required|in:' . implode(',', Venta::ESTADOS)
        ];
    }

    public function messages(): array
    {
        return [
            'estado.required' => 'El estado es obligatorio',
            'estado.in' => 'El estado no es válido'
        ];
    }
}
