<?php
// app/Http/Requests/RegistroVendedorRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegistroVendedorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre_completo' => 'required|string|max:150',
            'email' => 'required|email|unique:solicitudes_vendedores,email|unique:usuarios,email|max:100',
            'password' => 'required|string|min:6|confirmed',
            'sucursal_sugerida_id' => 'nullable|exists:sucursales,id'
        ];
    }

    public function messages(): array
    {
        return [
            'nombre_completo.required' => 'El nombre completo es obligatorio',
            'email.required' => 'El correo electrónico es obligatorio',
            'email.email' => 'Ingresa un correo electrónico válido',
            'email.unique' => 'El correo electrónico ya tiene una solicitud pendiente o ya está registrado',
            'password.required' => 'La contraseña es obligatoria',
            'password.min' => 'La contraseña debe tener al menos 6 caracteres',
            'password.confirmed' => 'Las contraseñas no coinciden',
            'sucursal_sugerida_id.exists' => 'La sucursal seleccionada no existe'
        ];
    }
}
