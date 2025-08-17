import { useEffect, useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  ShoppingCart,
  ShoppingBag
} from 'lucide-react'
import { ventasAPI, comprasAPI, statsAPI } from '../services/api'
import { Venta, Compra, Stats } from '../services/api'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

// 📊 Gráficos de recharts
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'

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

  const filtrarPorFecha = <T extends { fecha?: string }>(items: T[]) => {
    return items.filter(item => {
      if (!item.fecha) return false
      const fechaItem = new Date(item.fecha)
      if (fechaDesde && fechaItem < new Date(fechaDesde)) return false
      if (fechaHasta) {
        const hasta = new Date(fechaHasta)
        hasta.setHours(23, 59, 59, 999)
        if (fechaItem > hasta) return false
      }
      return true
    })
  }

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

        {/* --- Reporte de Ventas --- */}
        {reporteActivo === 'ventas' && (
            <div className="card p-4 space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Reporte de Ventas
              </h3>

              {/* Filtros */}
              <div className="flex flex-wrap gap-2 items-end">
                <div>
                  <label className="block text-sm">Desde</label>
                  <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="border p-1 rounded"/>
                </div>
                <div>
                  <label className="block text-sm">Hasta</label>
                  <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="border p-1 rounded"/>
                </div>
                <div>
                  <label className="block text-sm">Método de pago</label>
                  <select value={filtroMetodoPago} onChange={e => setFiltroMetodoPago(e.target.value)} className="border p-1 rounded">
                    <option value="">Todos</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>
                <button onClick={setHoy} className="px-3 py-1 bg-gray-200 rounded">Hoy</button>
                <button onClick={limpiarFechas} className="px-3 py-1 bg-gray-200 rounded">Limpiar</button>
                <button onClick={() => exportToExcel(ventasFiltradas, 'ventas.xlsx', 'ventas')} className="px-3 py-1 bg-green-500 text-white rounded">Exportar Excel</button>
              </div>

              {ventasFiltradas.length === 0 ? (
                  <p className="text-gray-500">No hay ventas registradas.</p>
              ) : (
                  <ul className="divide-y">
                    {ventasFiltradas.map(v => (
                        <li key={v.id} className="py-2 flex justify-between">
                          <span>{new Date(v.fecha || '').toLocaleDateString()} - {v.cliente_nombre || 'Sin cliente'}</span>
                          <span className="font-bold">${v.total}</span>
                        </li>
                    ))}
                  </ul>
              )}
            </div>
        )}

        {/* --- Reporte de Compras --- */}
        {reporteActivo === 'compras' && (
            <div className="card p-4 space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <ShoppingBag className="h-5 w-5 mr-2" />
                Reporte de Compras
              </h3>

              {/* Filtros */}
              <div className="flex flex-wrap gap-2 items-end">
                <div>
                  <label className="block text-sm">Desde</label>
                  <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="border p-1 rounded"/>
                </div>
                <div>
                  <label className="block text-sm">Hasta</label>
                  <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="border p-1 rounded"/>
                </div>
                <button onClick={setHoy} className="px-3 py-1 bg-gray-200 rounded">Hoy</button>
                <button onClick={limpiarFechas} className="px-3 py-1 bg-gray-200 rounded">Limpiar</button>
                <button onClick={() => exportToExcel(comprasFiltradas, 'compras.xlsx', 'compras')} className="px-3 py-1 bg-green-500 text-white rounded">Exportar Excel</button>
              </div>

              {comprasFiltradas.length === 0 ? (
                  <p className="text-gray-500">No hay compras registradas.</p>
              ) : (
                  <ul className="divide-y">
                    {comprasFiltradas.map(c => (
                        <li key={c.id} className="py-2 flex justify-between">
                          <span>{new Date(c.fecha || '').toLocaleDateString()} - {c.proveedor_nombre || 'Sin proveedor'}</span>
                          <span className="font-bold">${c.total}</span>
                        </li>
                    ))}
                  </ul>
              )}
            </div>
        )}

        {/* --- Resumen con gráfico --- */}
        {reporteActivo === 'resumen' && stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Resumen Financiero
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { name: 'Ventas', monto: stats.total_ventas_monto },
                    { name: 'Compras', monto: stats.total_compras_monto },
                    { name: 'Deudas', monto: stats.total_deudas_monto }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="monto" fill="#ff7f50" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
        )}
      </div>
  )
}

export default Reportes
