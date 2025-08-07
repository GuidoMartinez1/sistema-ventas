import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// Tipos de datos
export interface Producto {
  id?: number
  nombre: string
  descripcion?: string
  precio: number
  precio_costo?: number
  porcentaje_ganancia?: number
  stock: number
  categoria_id?: number
  categoria_nombre?: string
  codigo?: string
  created_at?: string
  updated_at?: string
}

export interface Cliente {
  id?: number
  nombre: string
  email?: string
  telefono?: string
  direccion?: string
  created_at?: string
}

export interface Venta {
  id?: number
  cliente_id?: number
  total: number
  fecha?: string
  estado?: string
  cliente_nombre?: string
}

export interface DetalleVenta {
  id?: number
  venta_id?: number
  producto_id: number
  cantidad: number
  precio_unitario: number
  subtotal: number
  producto_nombre?: string
}

export interface VentaCompleta extends Venta {
  detalles: DetalleVenta[]
}

export interface Stats {
  total_productos: number
  total_clientes: number
  total_ventas: number
  total_ventas_monto: number
}

export interface Categoria {
  id?: number
  nombre: string
  descripcion?: string
  created_at?: string
}

// API calls
export const productosAPI = {
  getAll: () => api.get<Producto[]>('/productos'),
  create: (producto: Producto) => api.post('/productos', producto),
  update: (id: number, producto: Producto) => api.put(`/productos/${id}`, producto),
  delete: (id: number) => api.delete(`/productos/${id}`),
  getBajoStock: () => api.get<Producto[]>('/productos/bajo-stock'),
}

export const categoriasAPI = {
  getAll: () => api.get<Categoria[]>('/categorias'),
  create: (categoria: Categoria) => api.post('/categorias', categoria),
  update: (id: number, categoria: Categoria) => api.put(`/categorias/${id}`, categoria),
  delete: (id: number) => api.delete(`/categorias/${id}`),
}

export const clientesAPI = {
  getAll: () => api.get<Cliente[]>('/clientes'),
  create: (cliente: Cliente) => api.post('/clientes', cliente),
}

export const ventasAPI = {
  getAll: () => api.get<Venta[]>('/ventas'),
  create: (venta: { cliente_id?: number; productos: DetalleVenta[]; total: number }) => 
    api.post('/ventas', venta),
  getById: (id: number) => api.get<VentaCompleta>(`/ventas/${id}`),
}

export const statsAPI = {
  getStats: () => api.get<Stats>('/stats'),
}

export default api 