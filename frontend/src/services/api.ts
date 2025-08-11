import axios from 'axios'

// Usar variable de entorno de Vite, o fallback a localhost para desarrollo
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

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
  categoria_id: number
  categoria_nombre?: string
  codigo?: string
  created_at?: string
  updated_at?: string
}



export interface Cliente {
  id?: number
  nombre: string
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
  metodo_pago?: string
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

export interface Deuda extends Venta {
  detalles: DetalleVenta[]
  cliente_nombre?: string
  telefono?: string
  direccion?: string
}

export interface Stats {
  total_productos: number
  total_clientes: number
  total_ventas: number
  total_ventas_monto: number
  total_compras: number
  total_compras_monto: number
  total_deudas: number
  total_deudas_monto: number
  total_ventas_con_deudas: number
  total_ventas_con_deudas_monto: number
}

export interface Categoria {
  id?: number
  nombre: string
  descripcion?: string
  created_at?: string
}

export interface Proveedor {
  id?: number
  nombre: string
}

export interface Compra {
  id?: number
  proveedor_id?: number
  total: number
  fecha?: string
  estado?: string
  proveedor_nombre?: string
}

export interface DetalleCompra {
  id?: number
  compra_id?: number
  producto_id: number
  cantidad: number
  precio_unitario: number | string
  subtotal: number | string
  producto_nombre?: string
}

export interface CompraCompleta extends Compra {
  detalles: DetalleCompra[]
}

export interface BolsaAbierta {
  id?: number
  producto_id: number
  fecha_apertura?: string
  estado?: string
  producto_nombre?: string
  stock_actual?: number
}

// API calls
export const productosAPI = {
  getAll: () => api.get<Producto[]>('/productos'),
  create: (producto: Producto) => api.post('/productos', producto),
  update: (id: number, producto: Producto) => api.put(`/productos/${id}`, producto),
  delete: (id: number) => api.delete(`/productos/${id}`),
  getBajoStock: () => api.get<Producto[]>('/productos/bajo-stock'),
  abrirBolsa: (id: number) => api.post(`/productos/${id}/abrir-bolsa`),
}

export const categoriasAPI = {
  getAll: () => api.get<Categoria[]>('/categorias'),
  create: (categoria: Categoria) => api.post('/categorias', categoria),
  update: (id: number, categoria: Categoria) => api.put(`/categorias/${id}`, categoria),
  delete: (id: number) => api.delete(`/categorias/${id}`),
}

export const proveedoresAPI = {
  getAll: () => api.get<Proveedor[]>('/proveedores'),
  create: (proveedor: Proveedor) => api.post('/proveedores', proveedor),
  update: (id: number, proveedor: Proveedor) => api.put(`/proveedores/${id}`, proveedor),
  delete: (id: number) => api.delete(`/proveedores/${id}`),
}

export const comprasAPI = {
  getAll: () => api.get<Compra[]>('/compras'),
  create: (compra: { proveedor_id: number; productos: DetalleCompra[]; total: number }) => 
    api.post('/compras', compra),
  getById: (id: number) => api.get<CompraCompleta>(`/compras/${id}`),
}

export const bolsasAbiertasAPI = {
  getAll: () => api.get<BolsaAbierta[]>('/bolsas-abiertas'),
  delete: (id: number) => api.delete(`/bolsas-abiertas/${id}`),
}

export const clientesAPI = {
  getAll: () => api.get<Cliente[]>('/clientes'),
  create: (cliente: Cliente) => api.post('/clientes', cliente),
}

export const ventasAPI = {
  getAll: () => api.get<Venta[]>('/ventas'),
  create: (venta: { 
    cliente_id?: number
    productos: DetalleVenta[]
    total: number
    estado?: string
    metodo_pago?: 'efectivo' | 'mercadopago' | 'tarjeta'
  }) => api.post('/ventas', venta),
  getById: (id: number) => api.get<VentaCompleta>(`/ventas/${id}`),
}

export const deudasAPI = {
  getAll: () => api.get<Deuda[]>('/deudas'),
  marcarComoPagada: (id: number) => api.put(`/deudas/${id}/pagar`),
}

export const statsAPI = {
  getStats: () => api.get<Stats>('/stats'),
}

export default api