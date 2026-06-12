// app/auth/register/page.tsx
'use client';

import Link from 'next/link';
import { User, Store, ArrowLeft } from 'lucide-react';

export default function RegisterTypePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Volver al inicio
                    </Link>
                    <h1 className="text-4xl font-bold text-gray-900">Crear una cuenta</h1>
                    <p className="text-gray-600 mt-2">Elige cómo quieres usar nuestra plataforma</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Opción Cliente */}
                    <Link href="/register/cliente" className="group">
                        <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all hover:scale-105">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                                <User className="h-10 w-10 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Cliente</h2>
                            <p className="text-gray-600 mb-4">
                                Compra productos de manera segura y rápida
                            </p>
                            <ul className="text-left text-sm text-gray-500 space-y-2 mb-6">
                                <li className="flex items-center">
                                    <span className="text-green-500 mr-2">✓</span>
                                    Explora nuestro catálogo de productos
                                </li>
                                <li className="flex items-center">
                                    <span className="text-green-500 mr-2">✓</span>
                                    Realiza compras seguras
                                </li>
                                <li className="flex items-center">
                                    <span className="text-green-500 mr-2">✓</span>
                                    Historial de tus compras
                                </li>
                                <li className="flex items-center">
                                    <span className="text-green-500 mr-2">✓</span>
                                    Seguimiento de pedidos
                                </li>
                            </ul>
                            <button className="w-full bg-blue-600 text-white py-2 rounded-lg group-hover:bg-blue-700 transition-colors">
                                Registrarme como Cliente
                            </button>
                        </div>
                    </Link>

                    {/* Opción Vendedor */}
                    <Link href="/register/vendedor" className="group">
                        <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-all hover:scale-105">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                                <Store className="h-10 w-10 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Vendedor</h2>
                            <p className="text-gray-600 mb-4">
                                Vende tus productos y haz crecer tu negocio
                            </p>
                            <ul className="text-left text-sm text-gray-500 space-y-2 mb-6">
                                <li className="flex items-center">
                                    <span className="text-green-500 mr-2">✓</span>
                                    Publica tus productos
                                </li>
                                <li className="flex items-center">
                                    <span className="text-green-500 mr-2">✓</span>
                                    Gestiona tu inventario
                                </li>
                                <li className="flex items-center">
                                    <span className="text-green-500 mr-2">✓</span>
                                    Recibe notificaciones de ventas
                                </li>
                                <li className="flex items-center">
                                    <span className="text-green-500 mr-2">✓</span>
                                    Estadísticas de tus ventas
                                </li>
                            </ul>
                            <button className="w-full bg-green-600 text-white py-2 rounded-lg group-hover:bg-green-700 transition-colors">
                                Registrarme como Vendedor
                            </button>
                        </div>
                    </Link>
                </div>

                <div className="text-center mt-8">
                    <p className="text-gray-600">
                        ¿Ya tienes una cuenta?{' '}
                        <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                            Inicia sesión aquí
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}