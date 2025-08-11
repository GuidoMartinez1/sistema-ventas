import { useEffect, useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign,
  ShoppingCart,
  ShoppingBag,
  CreditCard,
  Calendar
} from 'lucide-react'
import { ventasAPI, comprasAPI, statsAPI } from '../services/api'
import { Venta, Compra, Stats } from '../services/api'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

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

      if (fechaDesde) {
        const desde = new Date(fechaDesde)
        // incluir desde desde la medianoche del día
        if (fechaItem < desde) return false
      }

      if (fechaHasta) {
        const hasta = new Date(fechaHasta)
        // incluir todo el día hasta 23:59:59.999
        hasta.setHours(23, 59, 59, 999)
        if (fechaItem > hasta) return false
      }

      return true
    })
  }

  // Filtrado para ventas (aplica rango y método de pago)
  const filtrarVentas = () => {
    let ventasFiltradas = filtrarPorFecha(ventas)

    if (filtroMetodoPago) {
      ventasFiltradas = ventasFiltradas.filter(venta =>
        venta.metodo_pago === filtroMetodoPago
      )
    }

    return ventasFiltradas
  }

  // Filtrado para compras (solo rango de fechas)
  const filtrarCompras = () => {
    return filtrarPorFecha(compras)
  }

  const calcularTotalVentas = (ventasArr: Venta[]) =>
    ventasArr.reduce((total, venta) => total + Number(venta.total || 0), 0)

  const calcularTotalCompras = (comprasArr: Compra[]) =>
    comprasArr.reduce((total, compra) => total + Number(compra.total || 0), 0)

  // Exportar a Excel con encabezados en español
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
    const hoy = new Date().toISOString().split('T')[0]
    setFechaDesde(hoy)
    setFechaHasta(hoy)
  }

  const limpiarFechas = () => {
    setFechaDesde('')
    setFechaHasta('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-600">Análisis y estadísticas del negocio</p>
      </div>

      {/* Selector de reportes */}
      <div className="flex space-x-2">
        <button
          onClick={() => setReporteActivo('ventas')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            reporteActivo === 'resumen' 
              ? 'bg-orange-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <BarChart3 className="h-4 w-4 inline mr-2" />
          Resumen
        </button>
      </div>

      {/* --- FILTRO POR RANGO (visible cuando no estás en Resumen) --- */}
      {reporteActivo !== 'resumen' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Filtro por Rango de Fechas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="input-field"
              />
            </div>

            {/* Mostrar selector de método solo cuando se ve Ventas (igual que antes) */}
            <div>
              {reporteActivo === 'ventas' && (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
                  <select
                    value={filtroMetodoPago}
                    onChange={(e) => setFiltroMetodoPago(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Todos los métodos</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="mercadopago">Mercado Pago</option>
                    <option value="tarjeta">Tarjeta</option>
                  </select>
                </>
              )}
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={setHoy}
                className="px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 w-full"
              >
                Hoy
              </button>
              <button
                onClick={limpiarFechas}
                className="px-3 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 w-full"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reporte de Ventas */}
      {reporteActivo === 'ventas' && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Reporte de Ventas
            </h3>
            <button
              onClick={() => exportToExcel(ventasFiltradas, 'reporte_ventas.xlsx', 'ventas')}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Exportar Excel
            </button>
          </div>

          {/* Resumen de ventas */}
          <div className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <ShoppingCart className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-blue-600">Total Ventas</p>
                    <p className="text-2xl font-bold text-blue-900">{ventasFiltradas.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-green-600">Monto Total</p>
                    <p className="text-2xl font-bold text-green-900">${calcularTotalVentas(ventasFiltradas).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <CreditCard className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm text-purple-600">Promedio por Venta</p>
                    <p className="text-2xl font-bold text-purple-900">
                      ${ventasFiltradas.length > 0 ? (calcularTotalVentas(ventasFiltradas) / ventasFiltradas.length).toFixed(2) : '0.00'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de ventas */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ventasFiltradas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{venta.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{venta.cliente_nombre || 'Sin cliente'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">${venta.total.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        venta.metodo_pago === 'efectivo' ? 'bg-green-100 text-green-800' :
                        venta.metodo_pago === 'mercadopago' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {venta.metodo_pago || 'efectivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        venta.estado === 'adeuda' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {venta.estado || 'completada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(venta.fecha || '').toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reporte de Compras */}
      {reporteActivo === 'compras' && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <ShoppingBag className="h-5 w-5 mr-2" />
              Reporte de Compras
            </h3>
            <button
              onClick={() => exportToExcel(comprasFiltradas, 'reporte_compras.xlsx', 'compras')}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Exportar Excel
            </button>
          </div>

          {/* Resumen de compras */}
          <div className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <ShoppingBag className="h-8 w-8 text-orange-600 mr-3" />
                  <div>
                    <p className="text-sm text-orange-600">Total Compras</p>
                    <p className="text-2xl font-bold text-orange-900">{comprasFiltradas.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-red-600 mr-3" />
                  <div>
                    <p className="text-sm text-red-600">Monto Total</p>
                    <p className="text-2xl font-bold text-red-900">${calcularTotalCompras(comprasFiltradas).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de compras */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {comprasFiltradas.map((compra) => (
                  <tr key={compra.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{compra.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{compra.proveedor_nombre || 'Sin proveedor'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">${compra.total.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        {compra.estado || 'completada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(compra.fecha || '').toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resumen General */}
      {reporteActivo === 'resumen' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Resumen Financiero
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-green-700 font-medium">Ingresos Totales</span>
                <span className="text-green-900 font-bold">${stats.total_ventas_monto.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-red-700 font-medium">Gastos Totales</span>
                <span className="text-red-900 font-bold">${stats.total_compras_monto.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-700 font-medium">Deudas Pendientes</span>
                <span className="text-blue-900 font-bold">${stats.total_deudas_monto.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-purple-700 font-medium">Balance Neto</span>
                <span className={`font-bold ${(stats.total_ventas_monto - stats.total_compras_monto) >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                  ${(stats.total_ventas_monto - stats.total_compras_monto).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Estadísticas Generales
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">Total Productos</span>
                <span className="text-gray-900 font-bold">{stats.total_productos}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">Total Clientes</span>
                <span className="text-gray-900 font-bold">{stats.total_clientes}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">Total Ventas</span>
                <span className="text-gray-900 font-bold">{stats.total_ventas}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
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

