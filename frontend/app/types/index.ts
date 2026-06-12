/* eslint-disable @typescript-eslint/no-explicit-any */
// app/types/index.ts

export interface Usuario {
    id: number;
    nombre_completo: string;
    email: string;
    rol: 'cliente' | 'vendedor' | 'gerente' | 'auditor' | 'admin';
    sucursal_id: number | null;
    activo: boolean;
    created_at?: string;
}

export interface Sucursal {
    id: number;
    nombre: string;
    ciudad: string;
    direccion: string | null;
    telefono: string | null;
    activa: boolean;
    cantidad_vendedores?: number;
}

export interface Producto {
    id: number;
    nombre: string;
    descripcion: string | null;
    precio: string;
    stock: number;
    categoria_id: number | null;
    categoria_nombre?: string;
    vendedor_id: number;
    vendedor_nombre?: string;
    sucursal_id: number;
    sucursal_nombre?: string;
    sucursal_ciudad?: string;
    activo: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface Categoria {
    id: number;
    nombre: string;
    descripcion: string | null;
}

export interface Venta {
    id: number;
    cliente_id: number;
    cliente_nombre?: string;
    fecha: string;
    total: string;
    estado: 'pendiente' | 'pagado' | 'enviado' | 'entregado' | 'cancelado';
    detalles?: VentaDetalle[];
}

export interface VentaDetalle {
    id: number;
    venta_id: number;
    producto_id: number;
    producto_nombre?: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
}

export interface SolicitudVendedor {
    id: number;
    nombre_completo: string;
    email: string;
    tipo_sucursal: 'nueva' | 'existente';
    estado: 'pendiente' | 'aprobada' | 'rechazada';
    sucursal_sugerida_id: number | null;
    sucursal_nombre?: string;
    sucursal_ciudad?: string;
    fecha_solicitud: string;
    fecha_resolucion?: string;
    admin_id?: number;
    admin_nombre?: string;
    comentarios?: string;
    dias_pendiente?: number;
}

export interface AuditLog {
    id: number;
    tabla_afectada: string;
    operacion: string;
    usuario_real_id: number;
    usuario_nombre?: string;
    ip_address?: string;
    datos_antes?: any;
    datos_despues?: any;
    fecha: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data: T;
}

export interface LoginResponse {
    user: Usuario;
    token: string;
    token_type: string;
    session_context?: {
        user_id: number;
        user_role: string;
        sucursal_id: number | null;
    };
}