// src/services/api.ts
import axios from "axios"

// Detectar si estamos en desarrollo o producción
const apiBaseURL =
    import.meta.env.MODE === "development"
        ? "http://localhost:5000"
        : "https://sistema-ventas-02m7.onrender.com"

// Instancia de axios
const api = axios.create({
    baseURL: `${apiBaseURL}/api`,
    headers: {
        "Content-Type": "application/json",
    },
})

// ----------------------
// TIPOS Y INTERFACES
// ----------------------
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
    kilos?: number
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
    metodo_pago?: "efectivo" | "mercadopago" | "tarjeta"
}

export interface DetalleVenta {
    id?: number
    venta_id?: number
    // ⚠️ Ahora OPCIONAL para permitir “nuevo ítem”
    producto_id?: number
    cantidad: number
    precio_unitario: number
    subtotal: number
    // campos de conveniencia / custom
    producto_nombre?: string
    descripcion?: string
    es_custom?: boolean
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

export interface StockDeposito {
    producto_id: number;
    producto_nombre: string;
    codigo: string;
    categoria_nombre: string;
    stock_total: number;       // Stock total del sistema
    stock_en_deposito: number; // Stock actual en el depósito
    stock_en_tienda: number;   // Stock en la tienda (calculado)
    kilos?: number;
    ultima_fecha_ingreso: string;
}

export interface LoteDeposito {
    id: number;
    cantidad_actual: number;
    fecha_ingreso: string;
}


export interface Traslado {
    fecha_dia: string;
    producto_id: number; // Añadimos producto_id para la clave
    producto_nombre: string;
    total_unidades_movidas: number;
    peso_total_movido: number; // Ya calculado por el backend
    kilos_por_unidad?: number;
}

export interface BolsaAbierta {
    id?: number
    producto_id: number
    fecha_apertura?: string
    estado?: string
    producto_nombre?: string
    stock_actual?: number
    is_duplicate?: boolean;        // <-- NUEVO: true si hay más de una bolsa abierta para el producto
    total_open_bags?: number;      // <-- NUEVO: número total de bolsas abiertas para el producto
}

// 💡 INTERFAZ ACTUALIZADA para reflejar la DB y el JOIN del backend
export interface FuturoPedido {
    id?: number
    producto: string | null // Nombre custom (debe ser null si se usa producto_id)
    cantidad: string | null
    creado_en: string
    producto_id: number | null // ID del producto asociado
    producto_nombre: string | null // Nombre del producto obtenido del JOIN (para mostrar)
}


export interface Gasto {
    id?: number
    concepto: string
    monto: number // Monto original
    moneda: 'ARS' | 'USD'
    monto_ars: number // Monto normalizado
    fecha: string
    categoria: string
    created_at?: string
}

export interface Cotizacion {
    id?: number
    fecha: string
    valor: number
}

// ----------------------
// ENDPOINTS
// ----------------------
export const productosAPI = {
    getAll: () => api.get<Producto[]>("/productos"),
    create: (producto: Producto) => api.post("/productos", producto),
    update: (id: number, producto: Producto) => api.put(`/productos/${id}`, producto),
    delete: (id: number) => api.delete(`/productos/${id}`),
    getBajoStock: () => api.get<Producto[]>("/productos/bajo-stock"),
    abrirBolsa: (id: number) => api.post(`/productos/${id}/abrir-bolsa`),
}

export const categoriasAPI = {
    getAll: () => api.get<Categoria[]>("/categorias"),
    create: (categoria: Categoria) => api.post("/categorias", categoria),
    update: (id: number, categoria: Categoria) => api.put(`/categorias/${id}`, categoria),
    delete: (id: number) => api.delete(`/categorias/${id}`),
}

export const proveedoresAPI = {
    getAll: () => api.get<Proveedor[]>("/proveedores"),
    create: (proveedor: Proveedor) => api.post("/proveedores", proveedor),
    update: (id: number, proveedor: Proveedor) => api.put(`/proveedores/${id}`, proveedor),
    delete: (id: number) => api.delete(`/proveedores/${id}`),
}

export const comprasAPI = {
    getAll: () => api.get<Compra[]>("/compras"),
    create: (compra: { proveedor_id: number; productos: DetalleCompra[]; total: number }) =>
        api.post("/compras", compra),
    getById: (id: number) => api.get<CompraCompleta>(`/compras/${id}`),
    delete: (id: number) => api.delete(`/compras/${id}`),
}

export const bolsasAbiertasAPI = {
    getAll: () => api.get<BolsaAbierta[]>("/bolsas-abiertas"),
    delete: (id: number) => api.delete(`/bolsas-abiertas/${id}`),
}

export const clientesAPI = {
    getAll: () => api.get<Cliente[]>("/clientes"),
    create: (cliente: { nombre: string; telefono?: string; direccion?: string }) =>
        api.post("/clientes", cliente),
    update: (id: number, cliente: { nombre: string; telefono?: string; direccion?: string }) =>
        api.put(`/clientes/${id}`, cliente),
    delete: (id: number) => api.delete(`/clientes/${id}`),
}

export const ventasAPI = {
    getAll: () => api.get<Venta[]>("/ventas"),
    create: (venta: {
        cliente_id?: number
        productos?: DetalleVenta[] // incluye ítems custom
        total: number
        estado?: string
        metodo_pago?: "efectivo" | "mercadopago" | "tarjeta"
    }) => api.post("/ventas", venta),
    getById: (id: number) => api.get<VentaCompleta>(`/ventas/${id}`),
    update: (id: number, data: any) => api.put(`/ventas/${id}`, data),
    delete: (id: number) => api.delete(`/ventas/${id}`)
}

export const deudasAPI = {
    getAll: () => api.get<Deuda[]>("/deudas"),
    marcarComoPagada: (
        id: number,
        metodo_pago: "efectivo" | "mercadopago" | "tarjeta" = "efectivo",
        tipoPago: "total" | "parcial" = "total",
        montoParcial?: number
    ) =>
        api.put(`/deudas/${id}/pagar`, { metodo_pago, tipoPago, montoParcial }),
}

export const statsAPI = {
    getStats: () => api.get<Stats>("/stats"),
}

// 💡 FUTUROS PEDIDOS ACTUALIZADO para manejar producto_id y producto
export const futurosPedidosAPI = {
    getAll: () => api.get<FuturoPedido[]>("/futuros-pedidos"),
    // El payload puede tener 'producto' (string custom) o 'producto_id' (number existente)
    create: (pedido: { producto?: string; cantidad?: string; producto_id?: number }) =>
        api.post<FuturoPedido>("/futuros-pedidos", pedido),
    // El update también debe manejar ambos campos opcionales
    update: (id: number, pedido: { producto?: string; cantidad?: string; producto_id?: number }) =>
        api.put<FuturoPedido>(`/futuros-pedidos/${id}`, pedido),
    delete: (id: number) => api.delete(`/futuros-pedidos/${id}`),
}

export const gastosAPI = {
    getAll: () => api.get<Gasto[]>('/gastos'),
    create: (gasto: Omit<Gasto, 'id' | 'created_at' | 'monto_ars'>) => api.post('/gastos', gasto), // Ahora recibe categoria
    update: (id: number, gasto: Omit<Gasto, 'id' | 'created_at' | 'monto_ars'>) => api.put(`/gastos/${id}`, gasto), // 🆕 Método Update (PUT)
    delete: (id: number) => api.delete(`/gastos/${id}`),
}

export const cotizacionesAPI = {
    getAll: () => api.get<Cotizacion[]>('/cotizaciones'),
    getByDate: (fecha: string) => api.get<{ valor: number }>(`/cotizaciones/fecha/${fecha}`), // Nuevo endpoint para el formulario
    create: (cotizacion: Omit<Cotizacion, 'id'>) => api.post('/cotizaciones', cotizacion),
}

export const stockDepositoAPI = {
    getAll: () => api.get<StockDeposito[]>("/stock-deposito"),
    getLotes: (productoId: number) => api.get<LoteDeposito[]>(`/stock-deposito/lotes/${productoId}`),
    transferir: (producto_id: number, cantidad_a_mover: number) =>
        api.post("/stock-deposito/transferir", { producto_id, cantidad_a_mover }),
    // 💡 NUEVO ENDPOINT PARA EL REPORTE
    getReporteTraslados: () => api.get<Traslado[]>("/stock-deposito/reporte"),
}

export default api