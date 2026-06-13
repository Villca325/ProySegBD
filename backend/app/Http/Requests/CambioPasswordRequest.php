<?php
// app/Http/Requests/CambioPasswordRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CambioPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }
    
    public function rules(): array
    {
        return [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
            'new_password_confirmation' => 'required|string|min:6'
        ];
    }
    
    public function messages(): array
    {
        return [
            'current_password.required' => 'La contraseña actual es obligatoria',
            'new_password.required' => 'La nueva contraseña es obligatoria',
            'new_password.min' => 'La nueva contraseña debe tener al menos 6 caracteres',
            'new_password.confirmed' => 'Las contraseñas nuevas no coinciden',
            'new_password_confirmation.required' => 'Debes confirmar la nueva contraseña'
        ];
    }
}