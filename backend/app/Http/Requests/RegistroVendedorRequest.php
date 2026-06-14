<?php
// app/Http/Requests/RegistroVendedorRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            
            'tipo_sucursal' => 'required|in:nueva,existente',
            
            'sucursal_nombre' => 'required_if:tipo_sucursal,nueva|string|max:100',
            'sucursal_ciudad' => 'required_if:tipo_sucursal,nueva|string|max:100',
            'sucursal_direccion' => 'nullable|string|max:200',
            'sucursal_telefono' => 'nullable|string|max:20',
            
            'sucursal_sugerida_id' => 'required_if:tipo_sucursal,existente|exists:sucursales,id',
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
            
            'tipo_sucursal.required' => 'Debes especificar si quieres crear una nueva sucursal o unirte a una existente',
            'tipo_sucursal.in' => 'El tipo de sucursal debe ser "nueva" o "existente"',
            
            'sucursal_nombre.required_if' => 'Debes proporcionar un nombre para la nueva sucursal',
            'sucursal_ciudad.required_if' => 'Debes proporcionar una ciudad para la nueva sucursal',
            
            'sucursal_existente_id.required_if' => 'Debes seleccionar una sucursal existente para unirte',
            'sucursal_existente_id.exists' => 'La sucursal seleccionada no existe'
        ];
    }
}