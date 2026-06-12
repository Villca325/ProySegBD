// app/components/Navbar.tsx
"use client";

import Link from "next/link";
import { useAuth } from "@/app/hooks/useAuth";
import {
  ShoppingBag,
  User,
  LogOut,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
} from "lucide-react";

export function Navbar() {
  const { user, isAuthenticated, logout, hasRole } = useAuth();

  const getNavItems = () => {
    const items = [];

    if (!isAuthenticated) {
      items.push(
        { href: "/productos", label: "Productos", icon: Package },
        { href: "/login", label: "Iniciar Sesión", icon: User },
        { href: "/register", label: "Registrarse", icon: User },
      );
    } else {
      items.push({ href: "/productos", label: "Productos", icon: Package });

      if (hasRole("cliente")) {
        items.push({
          href: "/ventas",
          label: "Mis Compras",
          icon: ShoppingCart,
        });
      }

      if (hasRole(["vendedor", "gerente","admin"])) {
        if (hasRole(["admin"])) {            
            items.push({
              href: "/admin/dashboard",
              label: "Dashboard",
              icon: LayoutDashboard,
            });
        }
        else{items.push({
          href: "/dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
        });}
      }

      if (hasRole(["admin", "gerente"])) {
        items.push({
          href: "/admin/solicitudes",
          label: "Solicitudes",
          icon: Settings,
        });
      }

      if (hasRole("admin")) {
        items.push({
          href: "/admin/sucursales",
          label: "Sucursales",
          icon: Settings,
        });
      }
    }

    return items;
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <ShoppingBag className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">
                Ecommerce Seguro
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {getNavItems().map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}

            {isAuthenticated && (
              <>
                <span className="text-gray-400">|</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {user?.nombre_completo} ({user?.rol})
                  </span>
                  <button
                    onClick={logout}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Salir</span>
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
