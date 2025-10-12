import { useEffect, useState } from 'react'
import { ShoppingCart, Eye, Package, FileDown } from 'lucide-react'
import { ventasAPI } from '../services/api'
import { Venta } from '../services/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

const formatPrice = (value: number | string | undefined) => {
  if (value === null || value === undefined || value === '') return '$0';
  return '$' + Number(value).toLocaleString("es-AR");
};

const Ventas = () => {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVenta, setSelectedVenta] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)

  // Tabs
  const [tab, setTab] = useState<'ventas' | 'productosVendidos'>('ventas')

  // Filtros
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [estado, setEstado] = useState('todos')
  const [categoria, setCategoria] = useState('todas')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    fetchVentas()
  }, [])

  const fetchVentas = async () => {
    try {
      const response = await ventasAPI.getAll()
      setVentas(response.data)
    } catch (error) {
      toast.error('Error al cargar ventas')
    } finally {
      setLoading(false)
    }
  }

  const handleViewVenta = async (id: number) => {
    try {
      const response = await ventasAPI.getById(id)
      setSelectedVenta(response.data)
      setShowModal(true)
    } catch (error) {
      toast.error('Error al cargar detalles de la venta')
    }
  }

  const hoy = () => {
    const hoyStr = new Date().toISOString().split('T')[0]
    setFechaDesde(hoyStr)
    setFechaHasta(hoyStr)
  }

  const limpiarFiltros = () => {
    setFechaDesde('')
    setFechaHasta('')
    setEstado('todos')
    setCategoria('todas')
    setBusqueda('')
  }

  // --- FILTRADO DE VENTAS ---
  const ventasFiltradas = ventas.filter((venta) => {
    const fechaVenta = new Date(venta.fecha ?? '').toISOString().split('T')[0];
    const cumpleFechaDesde = fechaDesde ? fechaVenta >= fechaDesde : true
    const cumpleFechaHasta = fechaHasta ? fechaVenta <= fechaHasta : true
    const cumpleEstado =
        estado === 'todos'
            ? true
            : estado === 'completada'
            ? venta.estado?.toLowerCase() === 'completada'
            : venta.estado?.toLowerCase() === 'adeuda'

    return cumpleFechaDesde && cumpleFechaHasta && cumpleEstado
  })

  // --- AGRUPAR PRODUCTOS VENDIDOS ---
  const productosVendidosMap = new Map<string, { nombre: string, categoria: string, cantidad: number }>();

  ventasFiltradas.forEach((venta) => {
    venta.detalles?.forEach((detalle: any) => {
      const nombre = detalle.producto_nombre || 'Desconocido';
      const categoriaNombre = detalle.categoria_nombre || 'Sin categoría';
      const key = `${nombre}-${categoriaNombre}`;

      if (!productosVendidosMap.has(key)) {
        productosVendidosMap.set(key, { nombre, categoria: categoriaNombre, cantidad: detalle.cantidad });
      } else {
        const prod = productosVendidosMap.get(key)!;
        prod.cantidad += detalle.cantidad;
      }
    });
  });

  let productosVendidos = Array.from(productosVendidosMap.values());

  // Obtener categorías únicas
  const categoriasUnicas = ['todas', ...new Set(productosVendidos.map(p => p.categoria))];

  // Aplicar filtros adicionales
  productosVendidos = productosVendidos.filter(p => {
    const coincideCategoria = categoria === 'todas' ? true : p.categoria === categoria;
    const coincideNombre = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCategoria && coincideNombre;
  });

  // Exportar a Excel
  const exportarExcel = () => {
    if (productosVendidos.length === 0) {
      toast.error('No hay productos para exportar');
      return;
    }
    const hoja = XLSX.utils.json_to_sheet(productosVendidos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Productos Vendidos");
    XLSX.writeFile(libro, "productos_vendidos.xlsx");
  };

  const getEstadoBadge = (estado: string) => {
    if (estado === 'adeuda') {
      return (
          <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
          Deuda Pendiente
        </span>
      )
    }
    return (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
        Completada
      </span>
    )
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
            <p className="text-gray-600">Historial y análisis de ventas</p>
          </div>
          <div className="flex gap-2">
            <button
                className={`px-4 py-2 rounded ${tab === 'ventas' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
                onClick={() => setTab('ventas')}
            >
              Ventas
            </button>
            <button
                className={`px-4 py-2 rounded ${tab === 'productosVendidos' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
                onClick={() => setTab('productosVendidos')}
            >
              Productos vendidos
            </button>
          </div>
        </div>

        {/* ======== TAB: VENTAS ======== */}
        {tab === 'ventas' && (
            <>
              {/* FILTROS */}
              <div className="card p-4 flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium">Desde</label>
                  <input
                      type="date"
                      value={fechaDesde}
                      onChange={(e) => setFechaDesde(e.target.value)}
                      className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Hasta</label>
                  <input
                      type="date"
                      value={fechaHasta}
                      onChange={(e) => setFechaHasta(e.target.value)}
                      className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Estado</label>
                  <select
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                      className="input-field"
                  >
                    <option value="todos">Todos</option>
                    <option value="completada">Completada</option>
                    <option value="adeuda">Adeuda</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={hoy} className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-500">Hoy</button>
                  <button onClick={limpiarFiltros} className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400">Limpiar</button>
                </div>
              </div>

              {/* TABLA DE VENTAS */}
              <div className="card">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venta</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {ventasFiltradas.map((venta) => (
                        <tr key={venta.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                  <ShoppingCart className="h-6 w-6 text-purple-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">Venta #{venta.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{venta.cliente_nombre || 'Cliente no especificado'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {venta.fecha ? format(new Date(venta.fecha), 'dd/MM/yyyy HH:mm', { locale: es }) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatPrice(venta.total.toLocaleString())}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{getEstadoBadge(venta.estado || 'completada')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button onClick={() => handleViewVenta(venta.id!)} className="text-primary-600 hover:text-primary-900">
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
        )}

        {/* ======== TAB: PRODUCTOS VENDIDOS ======== */}
        {tab === 'productosVendidos' && (
            <>
              {/* FILTROS PRODUCTOS */}
              <div className="card p-4 flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium">Desde</label>
                  <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Hasta</label>
                  <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Categoría</label>
                  <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="input-field">
                    {categoriasUnicas.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Buscar producto</label>
                  <input type="text" placeholder="Nombre..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="input-field" />
                </div>
                <div className="flex gap-2">
                  <button onClick={exportarExcel} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1">
                    <FileDown className="w-4 h-4" /> Exportar
                  </button>
                  <button onClick={limpiarFiltros} className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400">Limpiar</button>
                </div>
              </div>

              {/* TABLA PRODUCTOS */}
              <div className="card">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad vendida</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {productosVendidos.map((p, i) => (
                        <tr key={i}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.nombre}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.categoria}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{p.cantidad}</td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
        )}

        {/* MODAL (SIN CAMBIOS) */}
        {showModal && selectedVenta && (
            /* Tu modal de detalles queda igual */
            <div> ... </div>
        )}
      </div>
  )
}

export default Ventas
