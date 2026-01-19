import { useEffect, useState } from 'react'
import {
    ShoppingCart,
    DollarSign,
    AlertTriangle,
    ShoppingBag,
    CreditCard,
    Calendar,
    X, Zap, Package,
} from 'lucide-react'
import { ventasAPI, comprasAPI, productosAPI, bolsasAbiertasAPI, statsAPI } from '../services/api'
import { Venta, Compra, Producto, BolsaAbierta, Stats } from '../services/api'
import { Link } from 'react-router-dom'

// Clases de utilidad
const cardClass = "bg-white shadow-lg rounded-xl p-4 md:p-6";
const inputFieldClass = "w-full border border-gray-300 p-2 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition duration-150 ease-in-out text-sm";


const formatPrice = (value: number | string | undefined) => {
    if (value === null || value === undefined || value === '') return '$0';
    return '$' + Number(value).toLocaleString("es-AR");
};

/**
 * Calcula el primer día del mes actual en formato YYYY-MM-DD.
 */
const getFirstDayOfMonth = (): string => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}-01`;
};

/**
 * Calcula la fecha de hoy en formato YYYY-MM-DD.
 */
const getTodayDate = (): string => {
    const hoy = new Date()
    const yyyy = hoy.getFullYear()
    const mm = String(hoy.getMonth() + 1).padStart(2, '0')
    const dd = String(hoy.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
}


const Dashboard = () => {
    const [ventas, setVentas] = useState<Venta[]>([])
    const [compras, setCompras] = useState<Compra[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [bajoStock, setBajoStock] = useState<Producto[]>([])
    const [bolsasAbiertas, setBolsasAbiertas] = useState<BolsaAbierta[]>([])
    const [loading, setLoading] = useState(true)

    // Mantiene el inicio por defecto en el mes actual
    const [fechaDesde, setFechaDesde] = useState(getFirstDayOfMonth())
    const [fechaHasta, setFechaHasta] = useState('')
    const [mostrarTodoBajoStock, setMostrarTodoBajoStock] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [ventasResponse, comprasResponse, statsResponse, bajoStockResponse, bolsasResponse] = await Promise.all([
                ventasAPI.getAll(),
                comprasAPI.getAll(),
                statsAPI.getStats(),
                productosAPI.getBajoStock(),
                bolsasAbiertasAPI.getAll()
            ])
            setVentas(ventasResponse.data)
            setCompras(comprasResponse.data)
            setStats(statsResponse.data)
            setBajoStock(bajoStockResponse.data)
            setBolsasAbiertas(bolsasResponse.data)
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    const filtrarPorRango = <T extends { fecha?: string | null }>(items: T[]) => {
        return items.filter(item => {
            const rawDate = (item as any).fecha || (item as any).fecha_apertura;
            if (!rawDate) return false

            const fechaItem = new Date(rawDate)
            const year = fechaItem.getFullYear()
            const month = String(fechaItem.getMonth() + 1).padStart(2, '0')
            const day = String(fechaItem.getDate()).padStart(2, '0')
            const fechaStr = `${year}-${month}-${day}`

            if (fechaDesde && fechaStr < fechaDesde) return false
            if (fechaHasta && fechaStr > fechaHasta) return false

            return true
        })
    }

    const ventasFiltradas = filtrarPorRango(ventas)
    const comprasFiltradas = filtrarPorRango(compras)
    const bolsasFiltradas = filtrarPorRango(bolsasAbiertas)

    const ventasCompletadas = ventasFiltradas.filter(v => v.estado !== 'adeuda')
    const ventasAdeudadas = ventasFiltradas.filter(v => v.estado === 'adeuda')

    const totalVentas = ventasCompletadas.length
    const totalVentasConDeudas = ventasFiltradas.length
    const totalCompras = comprasFiltradas.length

    const totalVentasMonto = ventasCompletadas.reduce((acc, v) => acc + Number(v.total || 0), 0)
    const totalVentasConDeudasMonto = ventasFiltradas.reduce((acc, v) => acc + Number(v.total || 0), 0)

    const totalDeudas = ventasAdeudadas.length
    const totalDeudasMonto = ventasAdeudadas.reduce((acc, v) => acc + Number(v.total || 0), 0)

    const setHoy = () => {
        const fechaLocal = getTodayDate()
        setFechaDesde(fechaLocal)
        setFechaHasta(fechaLocal)
    }

    // CAMBIO: Ahora limpia las fechas completamente (vacío) en lugar de volver al mes actual
    const limpiarFechas = () => {
        setFechaDesde('')
        setFechaHasta('')
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        )
    }

    const cards = [
        { title: 'Total Ventas', value: totalVentas, icon: ShoppingCart, color: 'bg-orange-700', iconColor: 'text-orange-700', borderColor: 'border-orange-700' },
        { title: 'Ventas + Deudas', value: totalVentasConDeudas, icon: ShoppingCart, color: 'bg-orange-600', iconColor: 'text-orange-600', borderColor: 'border-orange-600' },
        { title: 'Total Compras', value: totalCompras, icon: ShoppingBag, color: 'bg-blue-500', iconColor: 'text-blue-500', borderColor: 'border-blue-500' },
        { title: 'Ingresos (Sin Deudas)', value: formatPrice(totalVentasMonto), icon: DollarSign, color: 'bg-green-500', iconColor: 'text-green-500', borderColor: 'border-green-500' },
        { title: 'Ingresos Totales', value: formatPrice(totalVentasConDeudasMonto), icon: DollarSign, color: 'bg-green-600', iconColor: 'text-green-600', borderColor: 'border-green-600' },
        { title: 'Deudas Pendientes', value: totalDeudas, icon: CreditCard, color: 'bg-yellow-500', iconColor: 'text-yellow-500', borderColor: 'border-yellow-500' },
        { title: 'Monto Deudas', value: formatPrice(totalDeudasMonto), icon: CreditCard, color: 'bg-yellow-600', iconColor: 'text-yellow-600', borderColor: 'border-yellow-600' },
        { title: 'Bolsas Abiertas', value: bolsasFiltradas.length, icon: AlertTriangle, color: 'bg-red-500', iconColor: 'text-red-500', borderColor: 'border-red-500' },
    ]

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard - AliMar</h1>
                    <p className="text-gray-600">Resumen de tu negocio de mascotas</p>
                </div>

                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full md:w-auto">
                    <label className='hidden sm:inline-flex items-center gap-1 text-gray-600 text-sm'>
                        <Calendar className="h-5 w-5" />
                    </label>
                    <input
                        type="date"
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                        className={`${inputFieldClass} w-full sm:w-36`}
                    />
                    <span className="hidden sm:inline text-gray-500">-</span>
                    <input
                        type="date"
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                        className={`${inputFieldClass} w-full sm:w-36`}
                    />
                    <div className='col-span-2 flex gap-2'>
                        <button
                            onClick={setHoy}
                            className="px-3 py-2 bg-orange-500 text-white rounded-lg shadow hover:bg-orange-600 transition w-full"
                        >
                            Hoy
                        </button>
                        <button
                            onClick={limpiarFechas}
                            className="px-3 py-2 border border-gray-400 text-gray-700 rounded-lg hover:bg-gray-100 transition flex items-center gap-1 w-full"
                        >
                            {/* CAMBIO: Etiqueta vuelve a ser Limpiar */}
                            <X className='h-4 w-4' /> Limpiar
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {cards.map((card) => (
                    <div key={card.title} className={`bg-white shadow-lg rounded-xl border-t-4 ${card.borderColor} p-4 flex flex-col justify-between h-full hover:shadow-xl transition duration-300`}>
                        <div className="flex flex-col gap-1">
                            <div className={`p-2 rounded-lg mb-2 w-fit ${card.color} text-white flex-shrink-0`}>
                                <card.icon className="h-6 w-6 text-white" />
                            </div>

                            <p className="text-xs sm:text-sm font-medium text-gray-600 leading-tight">
                                {card.title}
                            </p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
                                {card.value}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {bajoStock.length > 0 && (
                <div className={cardClass}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                            <h2 className="text-lg font-semibold text-gray-900">
                                Productos con Bajo Stock ({bajoStock.filter(p => p.stock === 0 || p.stock === 1).length})
                            </h2>
                        </div>
                        {!mostrarTodoBajoStock && (
                            <button
                                onClick={() => setMostrarTodoBajoStock(true)}
                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                                Ver todos →
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(mostrarTodoBajoStock
                                ? bajoStock.filter(p => p.stock === 0 || p.stock === 1)
                                : bajoStock.filter(p => p.stock === 0 || p.stock === 1).slice(0, 6)
                        ).map((producto) => (
                            <div
                                key={producto.id}
                                className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                            >
                                <div className='min-w-0 pr-2'>
                                    <h3 className="font-medium text-gray-900 truncate">{producto.nombre}</h3>
                                    <p className="text-sm text-gray-500">Stock: {producto.stock}</p>
                                </div>
                                <span className="text-red-600 font-bold flex-shrink-0">{producto.stock} uds</span>
                            </div>
                        ))}
                    </div>

                    {mostrarTodoBajoStock && (
                        <div className="mt-2 flex justify-end">
                            <button
                                onClick={() => setMostrarTodoBajoStock(false)}
                                className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                            >
                                Mostrar menos ↑
                            </button>
                        </div>
                    )}
                </div>
            )}

            {bolsasFiltradas.length > 0 && (
                <div className={cardClass}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                            <h2 className="text-lg font-semibold text-gray-900">
                                Bolsas Abiertas ({bolsasFiltradas.length})
                            </h2>
                        </div>
                        <Link to="/bolsas-abiertas" className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                            Ver todas →
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {bolsasFiltradas.slice(0, 6).map((bolsa) => (
                            <div key={bolsa.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                                <div className='min-w-0 pr-2'>
                                    <h3 className="font-medium text-gray-900 truncate">{bolsa.producto_nombre}</h3>
                                    <p className="text-sm text-gray-500">
                                        Abierta: {new Date(bolsa.fecha_apertura!).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className="text-orange-600 font-bold flex-shrink-0">
                  {new Date(bolsa.fecha_apertura!).toLocaleDateString()}
                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Dashboard