<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Usuario;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();
        Usuario::create([
            'nombre_completo' => 'Admin prueba',
            'email' => 'admin1@test.com',
            'password' => '123456',
            'rol' => 'admin',
            'activo' => true
        ]);
        Usuario::create([
            'nombre_completo' => 'Cliente prueba',
            'email' => 'client1@test.com',
            'password' => '123456',
            'rol' => 'cliente',
            'activo' => true
        ]);
        Usuario::create([
            'nombre_completo' => 'Vendedor prueba',
            'email' => 'vended1@test.com',
            'password' => '123456',
            'rol' => 'vendedor',
            'activo' => true
        ]);
        Usuario::create([
            'nombre_completo' => 'Gerente prueba',
            'email' => 'gerent1@test.com',
            'password' => '123456',
            'rol' => 'gerente',
            'activo' => true
        ]);
        Usuario::create([
            'nombre_completo' => 'cliente prueba 2',
            'email' => 'client2@test.com',
            'password' => '123456',
            'rol' => 'cliente',
            'activo' => true
        ]);
        Usuario::create([
            'nombre_completo' => 'auditor prueba',
            'email' => 'audit1@test.com',
            'password' => '123456',
            'rol' => 'auditor',
            'activo' => true
        ]);
    }
}
