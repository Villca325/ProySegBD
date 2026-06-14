// app/components/Navbar.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/app/hooks/useAuth";
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
  BarChart3,
  ChevronDown,
} from "lucide-react";

export function Navbar() {
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleMouseEnter = (dropdownName: string) => {
    setOpenDropdown(dropdownName);
  };

  const handleMouseLeave = () => {
    setOpenDropdown(null);
  };

  const getNavItems = () => {
    const items = [];

    if (!isAuthenticated) {
      items.push(
        { href: "/productos", label: "Productos", icon: Package },
      );
    } else {
      items.push({ href: "/productos", label: "Productos", icon: Package });

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

      if (hasRole(["admin", "gerente"])) {
        items.push({
          href: "/admin/solicitudes",
          label: "Solicitudes",
          icon: Settings,
        });
      }

      if (hasRole(["admin"])) {
        items.push({
          href: "/admin/sucursales",
          label: "Sucursales",
          icon: Store,
        });
      }

      if (hasRole(["admin"])) {
        items.push({
          href: "/admin/vendedores",
          label: "Vendedores",
          icon: Users,
        });
      }

      if (hasRole(["cliente"])) {
        items.push({
          href: "/ventas",
          label: "Mis Compras",
          icon: ShoppingCart,
        });
      }

      if (hasRole(["vendedor", "gerente", "admin"])) {
        items.push({
          href: "/ventas",
          label: "Ventas",
          icon: ShoppingCart,
        });
      }

      if (hasRole(["auditor", "admin"])) {
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
              <span className="text-xl font-bold text-gray-900">
                Ecommerce Seguro
              </span>
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

            {/* Dropdown de Auditoría */}
            {hasRole(["auditor", "admin"]) && (
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter("audit")}
                onMouseLeave={handleMouseLeave}
              >
                <button className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-gray-100">
                  <Shield className="h-4 w-4" />
                  <span>Auditoría</span>
                  <ChevronDown className="h-3 w-3 ml-1" />
                </button>
                {openDropdown === "audit" && (
                  <div className="absolute left-0 mt-0 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                    <Link
                      href="/audit/dashboard"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      href="/audit/reportes"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Reportes</span>
                    </Link>
                    <Link
                      href="/audit/logs"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Logs de Auditoría</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Usuario - Dropdown */}
            {isAuthenticated && (
              <div
                className="relative ml-2"
                onMouseEnter={() => handleMouseEnter("user")}
                onMouseLeave={handleMouseLeave}
              >
                <button className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-xs text-white font-medium">
                      {user?.nombre_completo?.charAt(0) || "U"}
                    </span>
                  </div>
                  <span>{user?.nombre_completo?.split(" ")[0]}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
                {openDropdown === "user" && (
                  <div className="absolute right-0 mt-0 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.nombre_completo}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <p className="text-xs text-gray-500 mt-1 capitalize">
                        Rol: {user?.rol}
                      </p>
                    </div>
                    <Link
                      href="/perfil"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <User className="h-4 w-4" />
                      <span>Mi Cuenta</span>
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Botones de autenticación cuando no está logueado */}
            {!isAuthenticated && (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>

          {/* Menú Móvil - Botón */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={() => {
                const mobileMenu = document.getElementById("mobile-menu");
                if (mobileMenu) {
                  mobileMenu.classList.toggle("hidden");
                }
              }}
            >
              <span className="sr-only">Abrir menú</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Menú Móvil - Contenido */}
        <div id="mobile-menu" className="hidden md:hidden pb-4">
          {getNavItems().map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-md text-base font-medium"
              onClick={() => {
                const mobileMenu = document.getElementById("mobile-menu");
                if (mobileMenu) mobileMenu.classList.add("hidden");
              }}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}

          {/* Auditoría en móvil */}
          {hasRole(["auditor", "admin"]) && (
            <>
              <div className="px-3 py-2 text-sm font-medium text-gray-500">
                Auditoría
              </div>
              <Link
                href="/audit/dashboard"
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-8 py-2 rounded-md text-sm"
                onClick={() => {
                  const mobileMenu = document.getElementById("mobile-menu");
                  if (mobileMenu) mobileMenu.classList.add("hidden");
                }}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/audit/reportes"
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-8 py-2 rounded-md text-sm"
                onClick={() => {
                  const mobileMenu = document.getElementById("mobile-menu");
                  if (mobileMenu) mobileMenu.classList.add("hidden");
                }}
              >
                <FileText className="h-4 w-4" />
                <span>Reportes</span>
              </Link>
              <Link
                href="/audit/logs"
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-8 py-2 rounded-md text-sm"
                onClick={() => {
                  const mobileMenu = document.getElementById("mobile-menu");
                  if (mobileMenu) mobileMenu.classList.add("hidden");
                }}
              >
                <FileText className="h-4 w-4" />
                <span>Logs</span>
              </Link>
            </>
          )}

          {isAuthenticated && (
            <>
              <div className="border-t border-gray-200 my-2"></div>
              <div className="px-3 py-2">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-sm text-white font-medium">
                      {user?.nombre_completo?.charAt(0) || "U"}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {user?.nombre_completo}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      Rol: {user?.rol}
                    </p>
                  </div>
                </div>
                <Link
                  href="/perfil"
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => {
                    const mobileMenu = document.getElementById("mobile-menu");
                    if (mobileMenu) mobileMenu.classList.add("hidden");
                  }}
                >
                  <User className="h-5 w-5" />
                  <span>Mi Cuenta</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    const mobileMenu = document.getElementById("mobile-menu");
                    if (mobileMenu) mobileMenu.classList.add("hidden");
                  }}
                  className="w-full flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-md text-base font-medium"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </>
          )}

          {!isAuthenticated && (
            <div className="border-t border-gray-200 my-2 pt-2">
              <Link
                href="/login"
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-md text-base font-medium"
                onClick={() => {
                  const mobileMenu = document.getElementById("mobile-menu");
                  if (mobileMenu) mobileMenu.classList.add("hidden");
                }}
              >
                <User className="h-5 w-5" />
                <span>Iniciar Sesión</span>
              </Link>
              <Link
                href="/register/cliente"
                className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-base font-medium mt-2"
                onClick={() => {
                  const mobileMenu = document.getElementById("mobile-menu");
                  if (mobileMenu) mobileMenu.classList.add("hidden");
                }}
              >
                <User className="h-5 w-5" />
                <span>Registrarse</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
