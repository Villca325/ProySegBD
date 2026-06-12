// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';
import { ShoppingBag, UserPlus, LogIn, Store, Shield, TrendingUp, Package, Truck } from 'lucide-react';

export default function Home() {
    const { isAuthenticated, user } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Bienvenido a <span className="text-blue-600">Ecommerce Seguro</span>
                    </h2>
                    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                        La plataforma de comercio electrónico con los más altos estándares de seguridad para tus transacciones
                    </p>
                    
                    {!isAuthenticated && (
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/register"
                                className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg"
                            >
                                <UserPlus className="h-5 w-5" />
                                <span>Comenzar Ahora</span>
                            </Link>
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-lg"
                            >
                                <LogIn className="h-5 w-5" />
                                <span>Ya tengo cuenta</span>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Características */}
                <div className="grid md:grid-cols-3 gap-6 mt-16">
                    <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
                        <div className="text-blue-600 mb-4">
                            <ShoppingBag className="h-12 w-12 mx-auto" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Compra Segura</h3>
                        <p className="text-gray-600">
                            Tus datos están protegidos con los más altos estándares de seguridad. Compras cifradas y transacciones seguras.
                        </p>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
                        <div className="text-green-600 mb-4">
                            <Store className="h-12 w-12 mx-auto" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Vende tus productos</h3>
                        <p className="text-gray-600">
                            Conviértete en vendedor y alcanza más clientes. Gestiona tu tienda de manera sencilla.
                        </p>
                        {!isAuthenticated && (
                            <Link
                                href="/register/vendedor"
                                className="inline-block mt-4 text-green-600 hover:text-green-700 font-medium"
                            >
                                Registrar como Vendedor →
                            </Link>
                        )}
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
                        <div className="text-purple-600 mb-4">
                            <Shield className="h-12 w-12 mx-auto" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Seguridad Garantizada</h3>
                        <p className="text-gray-600">
                            Sistema de auditoría completo y control de acceso granular para máxima protección.
                        </p>
                    </div>
                </div>

                {/* Cómo funciona */}
                <div className="mt-16 bg-white rounded-lg shadow-md p-8">
                    <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">¿Cómo funciona?</h3>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="text-blue-600 font-bold text-xl">1</span>
                            </div>
                            <h4 className="font-semibold mb-2">Regístrate gratis</h4>
                            <p className="text-sm text-gray-500">Crea tu cuenta como cliente o vendedor</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="text-blue-600 font-bold text-xl">2</span>
                            </div>
                            <h4 className="font-semibold mb-2">Explora o publica</h4>
                            <p className="text-sm text-gray-500">Compra productos o publica los tuyos</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="text-blue-600 font-bold text-xl">3</span>
                            </div>
                            <h4 className="font-semibold mb-2">Recibe tus productos</h4>
                            <p className="text-sm text-gray-500">Recibe tus compras o gestiona tus ventas</p>
                        </div>
                    </div>
                </div>

                {/* Call to Action */}
                {!isAuthenticated && (
                    <div className="mt-16 text-center">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-8 text-white">
                            <h3 className="text-2xl font-bold mb-2">¿Listo para comenzar?</h3>
                            <p className="mb-6">Únete a miles de personas que ya confían en nosotros</p>
                            <Link
                                href="/register"
                                className="inline-flex items-center space-x-2 px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 font-semibold"
                            >
                                <UserPlus className="h-5 w-5" />
                                <span>Crear cuenta gratis</span>
                            </Link>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}