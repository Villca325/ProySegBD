// app/services/api.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

class ApiService {
    private api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: process.env.NEXT_PUBLIC_API_URL,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        // Interceptor para agregar token
        this.api.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                const token = Cookies.get('auth_token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Interceptor para manejar errores
        this.api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    // Token expirado o inválido
                    Cookies.remove('auth_token');
                    Cookies.remove('user');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }

    // Auth
    async registroCliente(data: {
        nombre_completo: string;
        email: string;
        password: string;
        password_confirmation: string;
    }) {
        const response = await this.api.post('/auth/registro/cliente', data);
        return response.data;
    }

    async solicitarRegistroVendedor(data: {
        nombre_completo: string;
        email: string;
        password: string;
        password_confirmation: string;
        tipo_sucursal: 'nueva' | 'existente';
        sucursal_nombre?: string;
        sucursal_ciudad?: string;
        sucursal_direccion?: string;
        sucursal_telefono?: string;
        sucursal_existente_id?: number;
    }) {
        const response = await this.api.post('/auth/registro/vendedor/solicitar', data);
        return response.data;
    }

    async login(email: string, password: string) {
                const response = await this.api.post('/auth/login', { email, password });
        if (response.data.success) {
            const { token, user } = response.data.data;
            Cookies.set('auth_token', token, { expires: 7 });
            Cookies.set('user', JSON.stringify(user), { expires: 7 });
        }
        return response.data;
    }

    async logout() {
        const response = await this.api.post('/auth/logout');
        if (response.data.success) {
            Cookies.remove('auth_token');
            Cookies.remove('user');
        }
        return response.data;
    }

    async getMe() {
        const response = await this.api.get('/auth/me');
        return response.data;
    }

    // Productos
    async getProductos(params?: {
        page?: number;
        categoria_id?: number;
        search?: string;
        sucursal_id?: number;
    }) {
        const response = await this.api.get('/productos', { params });
        return response.data;
    }

    async getProducto(id: number) {
        const response = await this.api.get(`/productos/${id}`);
        return response.data;
    }

    async createProducto(data: {
        nombre: string;
        descripcion?: string;
        precio: number;
        stock: number;
        categoria_id?: number | null;
    }) {
        const response = await this.api.post('/productos', data);
        return response.data;
    }

    async updateProducto(id: number, data: {
        nombre: string;
        descripcion?: string;
        precio: number;
        stock: number;
        categoria_id?: number | null;
        activo?: boolean;
    }) {
        const response = await this.api.put(`/productos/${id}`, data);
        return response.data;
    }

    async deleteProducto(id: number) {
        const response = await this.api.delete(`/productos/${id}`);
        return response.data;
    }

    async getCategorias() {
        const response = await this.api.get('/productos/categorias');
        return response.data;
    }

    // Ventas
    async getVentas(params?: { estado?: string; page?: number }) {
        const response = await this.api.get('/ventas', { params });
        return response.data;
    }

    async getVenta(id: number) {
        const response = await this.api.get(`/ventas/${id}`);
        return response.data;
    }

    async realizarCompra(producto_id: number, cantidad: number) {
        const response = await this.api.post('/ventas/comprar', { producto_id, cantidad });
        return response.data;
    }

    async actualizarEstadoVenta(id: number, estado: string) {
        const response = await this.api.put(`/ventas/${id}/estado`, { estado });
        return response.data;
    }

    async getEstadisticasVentas() {
        const response = await this.api.get('/ventas/estadisticas');
        return response.data;
    }

    // Solicitudes (admin/gerente)
    async getSolicitudes(params?: { estado?: string; page?: number }) {
        const response = await this.api.get('/admin/solicitudes', { params });
        return response.data;
    }

    async getSolicitudesPendientes() {
        const response = await this.api.get('/admin/solicitudes/pendientes');
        return response.data;
    }

    async getMiSolicitud() {
        const response = await this.api.get('/admin/solicitudes/mi-solicitud');
        return response.data;
    }

    async aprobarSolicitud(id: number, comentarios?: string) {
        const response = await this.api.post(`/admin/solicitudes/${id}/aprobar`, { comentarios });
        return response.data;
    }

    async rechazarSolicitud(id: number, motivo: string) {
        const response = await this.api.post(`/admin/solicitudes/${id}/rechazar`, { motivo });
        return response.data;
    }

    // Admin
    async getAdminSolicitudes(params?: { estado?: string }) {
        const response = await this.api.get('/admin/solicitudes', { params });
        return response.data;
    }

    async getAdminSolicitudesPendientes() {
        const response = await this.api.get('/admin/solicitudes/pendientes');
        return response.data;
    }

    async getAdminSucursales(params?: { activa?: boolean }) {
        const response = await this.api.get('/admin/sucursales', { params });
        return response.data;
    }

    async crearSucursal(data: {
        nombre: string;
        ciudad: string;
        direccion?: string;
        telefono?: string;
        activa?: boolean;
    }) {
        const response = await this.api.post('/admin/sucursales', data);
        return response.data;
    }

    async actualizarSucursal(id: number, data: any) {
        const response = await this.api.put(`/admin/sucursales/${id}`, data);
        return response.data;
    }

    async toggleSucursal(id: number) {
        const response = await this.api.patch(`/admin/sucursales/${id}/toggle`);
        return response.data;
    }

    async getAdminVendedores(params?: { activo?: boolean; sucursal_id?: number }) {
        const response = await this.api.get('/admin/vendedores', { params });
        return response.data;
    }

    async toggleVendedor(id: number) {
        const response = await this.api.patch(`/admin/vendedores/${id}/toggle`);
        return response.data;
    }

    async getEstadisticasGenerales() {
        const response = await this.api.get('/admin/estadisticas');
        return response.data;
    }

    // Auditoría
    async getAuditLogs(params?: {
        tabla?: string;
        operacion?: string;
        usuario_id?: number;
        page?: number;
    }) {
        const response = await this.api.get('/audit/logs', { params });
        return response.data;
    }

    async getAuditResumen() {
        const response = await this.api.get('/audit/logs/resumen');
        return response.data;
    }

    // Públicas
    async getPublicSucursales() {
        const response = await this.api.get('/public/sucursales');
        return response.data;
    }

    async getAuditLogsByTable(tabla: string, params?: { page?: number }) {
        const response = await this.api.get(`/audit/logs/table/${tabla}`, { params });
        return response.data;
    }

    async getAuditLogsByUser(usuarioId: number, params?: { page?: number }) {
        const response = await this.api.get(`/audit/logs/user/${usuarioId}`, { params });
        return response.data;
    }

    async exportAuditLogs(params?: {
        fecha_desde?: string;
        fecha_hasta?: string;
        tabla?: string;
        operacion?: string;
    }) {
        const response = await this.api.get('/audit/exportar', { 
            params,
            responseType: 'blob' 
        });
        return response.data;
    }

     
}

export const api = new ApiService();