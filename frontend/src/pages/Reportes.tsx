import { useEffect, useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  ShoppingBag,
  CreditCard,
  Calendar,
  Zap, // Añadido para métodos de pago
  CheckCircle, // Añadido para estado
  User, // Añadido para cliente
  Factory // Añadido para proveedor
} from 'lucide-react'
import { ventasAPI, comprasAPI, statsAPI } from '../services/api'
import { Venta, Compra, Stats } from '../services/api'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

// Clases de utilidad
const cardClass = "bg-white shadow-lg rounded-xl p-4 md:p-6";
const inputFieldClass = "w-full border border-gray-300 p-2 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition duration-150 ease-in-out text-sm";


const Reportes = () => {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [compras, setCompras] = useState<Compra[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  // filtros
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [filtroMetodoPago, setFiltroMetodoPago] = useState('')
  const [reporteActivo, setReporteActivo] = useState<'ventas' | 'compras' | 'resumen'>('ventas')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [ventasResponse, comprasResponse, statsResponse] = await Promise.all([
        ventasAPI.getAll(),
        comprasAPI.getAll(),
        statsAPI.getStats()
      ])
      setVentas(ventasResponse.data)
      setCompras(comprasResponse.data)
      setStats(statsResponse.data)
    } catch (error) {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  // Helper: filtra un array por rango de fechas (usa item.fecha)
  const filtrarPorFecha = <T extends { fecha?: string }>(items: T[]) => {
    return items.filter(item => {
      if (!item.fecha) return false

      const fechaItem = new Date(item.fecha)
      const fechaStr = fechaItem.toLocaleDateString('en-CA')// normalizamos a yyyy-mm-dd

      if (fechaDesde && fechaStr < fechaDesde) return false
      if (fechaHasta && fechaStr > fechaHasta) return false

      return true
    })
  }
  const formatPrice = (value: number | string | undefined) => {
    if (value === null || value === undefined || value === '') return '$0';
    return '$' + Number(value).toLocaleString("es-AR");
  };

  const filtrarVentas = () => {
    let ventasFiltradas = filtrarPorFecha(ventas)
    if (filtroMetodoPago) {
      ventasFiltradas = ventasFiltradas.filter(venta =>
          venta.metodo_pago === filtroMetodoPago
      )
    }
    return ventasFiltradas
  }

  const filtrarCompras = () => filtrarPorFecha(compras)

  const calcularTotalVentas = (ventasArr: Venta[]) =>
      ventasArr.reduce((total, venta) => total + Number(venta.total || 0), 0)

  const calcularTotalCompras = (comprasArr: Compra[]) =>
      comprasArr.reduce((total, compra) => total + Number(compra.total || 0), 0)

  // Exportar a Excel
  const exportToExcel = (data: any[], filename: string, type: 'ventas' | 'compras') => {
    if (!data.length) {
      toast.error('No hay datos para exportar')
      return
    }
    const exportData =
        type === 'ventas'
            ? data.map(v => ({
              'ID Venta': v.id,
              Cliente: v.cliente_nombre || 'Sin cliente',
              'Total ($)': v.total,
              'Método de Pago': v.metodo_pago,
              Estado: v.estado,
              Fecha: new Date(v.fecha || '').toLocaleDateString()
            }))
            : data.map(c => ({
              'ID Compra': c.id,
              Proveedor: c.proveedor_nombre || 'Sin proveedor',
              'Total ($)': c.total,
              Estado: c.estado,
              Fecha: new Date(c.fecha || '').toLocaleDateString()
            }))
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte')
    XLSX.writeFile(workbook, filename)
  }

  const ventasFiltradas = filtrarVentas()
  const comprasFiltradas = filtrarCompras()

  const setHoy = () => {
    const hoy = new Date()
    const yyyy = hoy.getFullYear()
    const mm = String(hoy.getMonth() + 1).padStart(2, '0')
    const dd = String(hoy.getDate()).padStart(2, '0')
    const fechaLocal = `${yyyy}-${mm}-${dd}`
    setFechaDesde(fechaLocal)
    setFechaHasta(fechaLocal)
  }

  const limpiarFechas = () => {
    setFechaDesde('')
    setFechaHasta('')
  }

  const getMetodoBadge = (metodo?: string) => {
    if (metodo === 'efectivo') return 'bg-green-100 text-green-800'
    if (metodo === 'mercadopago') return 'bg-blue-100 text-blue-800'
    return 'bg-purple-100 text-purple-800'
  }

  const getEstadoBadge = (estado?: string) => {
    if (estado === 'adeuda') return 'bg-red-100 text-red-800'
    return 'bg-green-100 text-green-800'
  }


  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    )
  }

  return (
      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600">Análisis y estadísticas del negocio</p>
        </div>

        {/* Selector de reportes */}
        {/* RESPONSIVE: Apilar botones si no hay suficiente espacio */}
        <div className="flex flex-wrap gap-2">
          <button
              onClick={() => setReporteActivo('ventas')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto ${
                  reporteActivo === 'ventas'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            <ShoppingCart className="h-4 w-4 inline mr-2" />
            Ventas
          </button>
          <button
              onClick={() => setReporteActivo('compras')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto ${
                  reporteActivo === 'compras'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            <ShoppingBag className="h-4 w-4 inline mr-2" />
            Compras
          </button>
          <button
              onClick={() => setReporteActivo('resumen')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors w-full sm:w-auto ${
                  reporteActivo === 'resumen'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            <BarChart3 className="h-4 w-4 inline mr-2" />
            Resumen
          </button>
        </div>

        {/* --- Filtros globales (solo en ventas/compras) --- */}
        {reporteActivo !== 'resumen' && (
            <div className={cardClass}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Filtro por Rango de Fechas
              </h3>
              {/* RESPONSIVE: 2 columnas en móvil, 4 en md+ */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
                  <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className={inputFieldClass}/>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
                  <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className={inputFieldClass}/>
                </div>
                {reporteActivo === 'ventas' && (
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
                      <select value={filtroMetodoPago} onChange={e => setFiltroMetodoPago(e.target.value)} className={inputFieldClass}>
                        <option value="">Todos</option>
                        <option value="efectivo">Efectivo</option>
                        <option value="mercadopago">MercadoPago</option>
                        <option value="tarjeta">Tarjeta</option>
                      </select>
                    </div>
                )}
                <div className="col-span-2 md:col-span-1 flex items-end gap-2">
                  <button onClick={setHoy} className="px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 w-full">Hoy</button>
                  <button onClick={limpiarFechas} className="px-3 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 w-full">Limpiar</button>
                </div>
              </div>
            </div>
        )}

        {/* --- Reporte de Ventas --- */}
        {reporteActivo === 'ventas' && (
            <div className={cardClass}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" /> Reporte de Ventas
                </h3>
                <button onClick={() => exportToExcel(ventasFiltradas, 'reporte_ventas.xlsx', 'ventas')} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Exportar Excel</button>
              </div>
              {/* Totales */}
              {/* RESPONSIVE: 1 columna en móvil, 3 en md+ */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg flex items-center">
                  <ShoppingCart className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-blue-600">Total Ventas</p>
                    <p className="text-2xl font-bold text-blue-900">{ventasFiltradas.length}</p>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-green-600">Monto Total</p>
                    <p className="text-2xl font-bold text-green-900">{formatPrice(calcularTotalVentas(ventasFiltradas))}</p>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg flex items-center">
                  <CreditCard className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm text-purple-600">Promedio</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {formatPrice(ventasFiltradas.length > 0 ? (calcularTotalVentas(ventasFiltradas) / ventasFiltradas.length).toFixed(2) : '0.00')}
                    </p>
                  </div>
                </div>
              </div>

              {/* VISTA DE TABLA (ESCRITORIO) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {ventasFiltradas.map(v => (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{v.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{v.cliente_nombre || 'Sin cliente'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{formatPrice(v.total)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${getMetodoBadge(v.metodo_pago)}`}>
                        {v.metodo_pago}
                      </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${getEstadoBadge(v.estado)}`}>
                        {v.estado}
                      </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(v.fecha || '').toLocaleDateString()}</td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>

              {/* VISTA DE TARJETA (MÓVIL) */}
              <div className="md:hidden space-y-3">
                {ventasFiltradas.map((v) => (
                    <div key={v.id} className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-bold text-gray-900">Venta #{v.id}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getEstadoBadge(v.estado)}`}>
                                {v.estado}
                              </span>
                      </div>

                      <div className="grid grid-cols-2 gap-y-2 text-sm border-t pt-2">
                        <div>
                          <span className="text-xs text-gray-500 block">Cliente</span>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1 text-gray-400" />
                            <span className="text-gray-700 font-medium truncate">{v.cliente_nombre || 'Sin cliente'}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">Fecha</span>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            <span className="text-gray-700 font-medium">{new Date(v.fecha || '').toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="col-span-1">
                          <span className="text-xs text-gray-500 block">Método de Pago</span>
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${getMetodoBadge(v.metodo_pago)}`}>
                                    {v.metodo_pago}
                                  </span>
                        </div>
                        <div className="col-span-1">
                          <span className="text-xs text-gray-500 block">Total</span>
                          <span className="text-xl font-bold text-green-600">{formatPrice(v.total)}</span>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
            </div>
        )}

        {/* --- Reporte de Compras --- */}
        {reporteActivo === 'compras' && (
            <div className={cardClass}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ShoppingBag className="h-5 w-5 mr-2" /> Reporte de Compras
                </h3>
                <button onClick={() => exportToExcel(comprasFiltradas, 'reporte_compras.xlsx', 'compras')} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Exportar Excel</button>
              </div>
              {/* Totales */}
              {/* RESPONSIVE: 1 columna en móvil, 2 en md+ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-orange-50 p-4 rounded-lg flex items-center">
                  <ShoppingBag className="h-8 w-8 text-orange-600 mr-3" />
                  <div>
                    <p className="text-sm text-orange-600">Total Compras</p>
                    <p className="text-2xl font-bold text-orange-900">{comprasFiltradas.length}</p>
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg flex items-center">
                  <DollarSign className="h-8 w-8 text-red-600 mr-3" />
                  <div>
                    <p className="text-sm text-red-600">Monto Total</p>
                    <p className="text-2xl font-bold text-red-900">{formatPrice(calcularTotalCompras(comprasFiltradas))}</p>
                  </div>
                </div>
              </div>

              {/* VISTA DE TABLA (ESCRITORIO) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {comprasFiltradas.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{c.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{c.proveedor_nombre || 'Sin proveedor'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">{formatPrice(c.total)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">{c.estado}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(c.fecha || '').toLocaleDateString()}</td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>

              {/* VISTA DE TARJETA (MÓVIL) */}
              <div className="md:hidden space-y-3">
                {comprasFiltradas.map((c) => (
                    <div key={c.id} className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-bold text-gray-900">Compra #{c.id}</h3>
                        <span className="px-2 py-1 text-xs rounded-full font-medium bg-green-100 text-green-800">
                                {c.estado}
                              </span>
                      </div>

                      <div className="grid grid-cols-2 gap-y-2 text-sm border-t pt-2">
                        <div>
                          <span className="text-xs text-gray-500 block">Proveedor</span>
                          <div className="flex items-center">
                            <Factory className="h-4 w-4 mr-1 text-gray-400" />
                            <span className="text-gray-700 font-medium truncate">{c.proveedor_nombre || 'Sin proveedor'}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">Fecha</span>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            <span className="text-gray-700 font-medium">{new Date(c.fecha || '').toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <span className="text-xs text-gray-500 block">Total</span>
                          <span className="text-xl font-bold text-red-600">{formatPrice(c.total)}</span>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
            </div>
        )}

        {/* --- Resumen --- */}
        {reporteActivo === 'resumen' && stats && (
            {/* RESPONSIVE: 1 columna en móvil, 2 en md+ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={cardClass}>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" /> Resumen Financiero
          </h3>
          <div className="space-y-4">
          <div className="flex justify-between p-3 bg-green-50 rounded-lg">
          <span className="text-green-700 font-medium">Ingresos Totales</span>
          <span className="text-green-900 font-bold">{formatPrice(stats.total_ventas_monto)}</span>
          </div>
          <div className="flex justify-between p-3 bg-red-50 rounded-lg">
          <span className="text-red-700 font-medium">Gastos Totales</span>
          <span className="text-red-900 font-bold">{formatPrice(stats.total_compras_monto)}</span>
          </div>
          <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
          <span className="text-blue-700 font-medium">Deudas Pendientes</span>
          <span className="text-blue-900 font-bold">{formatPrice(stats.total_deudas_monto)}</span>
          </div>
          <div className="flex justify-between p-3 bg-purple-50 rounded-lg">
          <span className="text-purple-700 font-medium">Balance Neto</span>
          <span className={`font-bold ${(stats.total_ventas_monto - stats.total_compras_monto) >= 0 ? 'text-green-900' : 'text-red-900'}`}>
        {formatPrice(stats.total_ventas_monto - stats.total_compras_monto)}
          </span>
          </div>
          </div>
          </div>
          <div className={cardClass}>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" /> Estadísticas Generales
          </h3>
          <div className="space-y-4">
          <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-700 font-medium">Total Productos</span>
          <span className="text-gray-900 font-bold">{stats.total_productos}</span>
          </div>
          <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-700 font-medium">Total Clientes</span>
          <span className="text-gray-900 font-bold">{stats.total_clientes}</span>
          </div>
          <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-700 font-medium">Total Ventas</span>
          <span className="text-gray-900 font-bold">{stats.total_ventas}</span>
          </div>
          <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-700 font-medium">Total Compras</span>
          <span className="text-gray-900 font-bold">{stats.total_compras}</span>
          </div>
          </div>
          </div>
          </div>
          )}
      </div>
  )
}

export default Reportes