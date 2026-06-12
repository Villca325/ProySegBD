// app/components/Navbar.tsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';
import { 
    ShoppingBag, 
    User, 
    LogOut, 
    LayoutDashboard, 
    Package, 
    ShoppingCart, 
    Settings,
    Shield,
    Store,
    Users,
    FileText,
    BarChart3
} from 'lucide-react';

export function Navbar() {
    const { user, isAuthenticated, logout, hasRole } = useAuth();

    const getNavItems = () => {
        const items = [];

        if (!isAuthenticated) {
            items.push(
                { href: '/productos', label: 'Productos', icon: Package },
                { href: '/auth/login', label: 'Iniciar Sesión', icon: User },
                { href: '/auth/register/cliente', label: 'Registrarse', icon: User },
                { href: '/auth/register/vendedor', label: 'Ser Vendedor', icon: Store }
            );
        } else {
            // Productos - visible para todos los roles autenticados
            items.push({ href: '/productos', label: 'Productos', icon: Package });

            // Dashboard según rol
            if (hasRole(["vendedor", "gerente", "admin"])) {
                if (hasRole(["admin"])) {
                    items.push({
                        href: "/admin/dashboard",
                        label: "Dashboard Admin",
                        icon: LayoutDashboard,
                    });
                } else if (hasRole(["gerente"])) {
                    items.push({
                        href: "/dashboard",
                        label: "Dashboard Gerente",
                        icon: LayoutDashboard,
                    });
                } else if (hasRole(["vendedor"])) {
                    items.push({
                        href: "/dashboard",
                        label: "Dashboard Vendedor",
                        icon: LayoutDashboard,
                    });
                }
            }

            // Solicitudes - solo admin y gerente
            if (hasRole(["admin", "gerente"])) {
                items.push({
                    href: "/admin/solicitudes",
                    label: "Solicitudes",
                    icon: Settings,
                });
            }

            // Sucursales - solo admin
            if (hasRole(["admin"])) {
                items.push({
                    href: "/admin/sucursales",
                    label: "Sucursales",
                    icon: Store,
                });
            }

            // Vendedores - solo admin
            if (hasRole(["admin"])) {
                items.push({
                    href: "/admin/vendedores",
                    label: "Vendedores",
                    icon: Users,
                });
            }

            // Ventas/Mis Compras según rol
            if (hasRole(["cliente"])) {
                items.push({ 
                    href: '/ventas', 
                    label: 'Mis Compras', 
                    icon: ShoppingCart 
                });
            }
            
            if (hasRole(["vendedor", "gerente", "admin"])) {
                items.push({ 
                    href: '/ventas', 
                    label: 'Ventas', 
                    icon: ShoppingCart 
                });
            }

            // Auditoría - solo auditor y admin
            if (hasRole(["auditor", "admin"])) {
                items.push({
                    href: "/audit/dashboard",
                    label: "Auditoría",
                    icon: Shield,
                });
            }

            // Reportes de Auditoría - solo auditor y admin
            if (hasRole(["auditor", "admin"])) {
                items.push({
                    href: "/audit/reportes",
                    label: "Reportes Audit",
                    icon: BarChart3,
                });
            }

            // Logs de Auditoría - solo auditor y admin
            if (hasRole(["auditor", "admin"])) {
                items.push({
                    href: "/audit/logs",
                    label: "Logs Audit",
                    icon: FileText,
                });
            }
        }

        return items;
    };

    return (
        <nav className="bg-white shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo y marca */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center space-x-2">
                            <ShoppingBag className="h-8 w-8 text-blue-600" />
                            <span className="text-xl font-bold text-gray-900">Ecommerce Seguro</span>
                        </Link>
                    </div>

                    {/* Navegación Desktop */}
                    <div className="hidden md:flex items-center space-x-1">
                        {getNavItems().map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-gray-100"
                            >
                                <item.icon className="h-4 w-4" />
                                <span>{item.label}</span>
                            </Link>
                        ))}

                        {isAuthenticated && (
                            <>
                                <span className="text-gray-300 mx-1">|</span>
                                <div className="flex items-center space-x-3 ml-2">
                                    <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
                                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                                            <span className="text-xs text-white font-medium">
                                                {user?.nombre_completo?.charAt(0) || 'U'}
                                            </span>
                                        </div>
                                        <div className="text-sm">
                                            <p className="font-medium text-gray-900">{user?.nombre_completo?.split(' ')[0]}</p>
                                            <p className="text-xs text-gray-500">{user?.rol}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="flex items-center space-x-1 text-red-600 hover:text-red-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-50 transition-colors duration-200"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span>Salir</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Menú Móvil - Botón */}
                    <div className="md:hidden flex items-center">
                        <button
                            type="button"
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                            onClick={() => {
                                const mobileMenu = document.getElementById('mobile-menu');
                                if (mobileMenu) {
                                    mobileMenu.classList.toggle('hidden');
                                }
                            }}
                        >
                            <span className="sr-only">Abrir menú</span>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Menú Móvil - Contenido */}
                <div id="mobile-menu" className="hidden md:hidden">
                    <div className="pt-2 pb-3 space-y-1">
                        {getNavItems().map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-md text-base font-medium"
                            >
                                <item.icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </Link>
                        ))}
                        
                        {isAuthenticated && (
                            <>
                                <div className="border-t border-gray-200 my-2"></div>
                                <div className="px-3 py-2">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                                            <span className="text-sm text-white font-medium">
                                                {user?.nombre_completo?.charAt(0) || 'U'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{user?.nombre_completo}</p>
                                            <p className="text-xs text-gray-500">{user?.email}</p>
                                            <p className="text-xs text-gray-500 capitalize">Rol: {user?.rol}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="flex items-center space-x-2 text-red-600 hover:text-red-700 px-3 py-2 rounded-md text-base font-medium w-full hover:bg-red-50"
                                    >
                                        <LogOut className="h-5 w-5" />
                                        <span>Cerrar Sesión</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}