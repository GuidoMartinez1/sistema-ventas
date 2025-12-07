// src/pages/Ventas.tsx
import { useEffect, useState } from 'react'
import { ShoppingCart, Eye, Calendar, User } from 'lucide-react'
import { ventasAPI } from '../services/api'
import { Venta } from '../services/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

// Clases de utilidad
const cardClass = "bg-white shadow-lg rounded-xl p-4 md:p-6";
const inputFieldClass = "w-full border border-gray-300 p-2 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition duration-150 ease-in-out text-sm";


const formatPrice = (value: number | string | undefined) => {
  if (value === null || value === undefined || value === '') return '$0';
  return '$' + Number(value).toLocaleString("es-AR");
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

const Ventas = () => {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVenta, setSelectedVenta] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)

  // Filtros
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [estado, setEstado] = useState('todos')

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
    const hoyStr = format(new Date(), 'yyyy-MM-dd')
    setFechaDesde(hoyStr)
    setFechaHasta(hoyStr)
  }

  const limpiarFiltros = () => {
    setFechaDesde('')
    setFechaHasta('')
    setEstado('todos')
  }

  // Filtrado en front
  const ventasFiltradas = ventas.filter((venta) => {
    const fechaVenta = venta.fecha ? format(new Date(venta.fecha), 'yyyy-MM-dd') : '';
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
          <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
          <p className="text-gray-600">Historial de todas las ventas realizadas</p>
        </div>

        {/* FILTROS */}
        {/* RESPONSIVE: Uso de grid para mejor distribución en móvil */}
        <div className={`${cardClass} p-4 grid grid-cols-2 md:grid-cols-5 gap-4 items-end`}>
          <div className="col-span-1">
            <label className="block text-sm font-medium">Desde</label>
            <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className={inputFieldClass}
            />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium">Hasta</label>
            <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className={inputFieldClass}
            />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium">Estado</label>
            <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className={inputFieldClass}
            >
              <option value="todos">Todos</option>
              <option value="completada">Completada</option>
              <option value="adeuda">Adeuda</option>
            </select>
          </div>
          <div className="col-span-2 md:col-span-1 flex gap-2">
            <button
                onClick={hoy}
                className="px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 w-full"
            >
              Hoy
            </button>
            <button
                onClick={limpiarFiltros}
                className="px-3 py-2 bg-gray-300 rounded hover:bg-gray-400 w-full"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Ventas Table / Card View */}
        <div className={cardClass}>
          {/* VISTA DE TABLA (ESCRITORIO) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Venta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {ventasFiltradas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <ShoppingCart className="h-6 w-6 text-purple-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            Venta #{venta.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {venta.cliente_nombre || 'Cliente no especificado'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {venta.fecha
                          ? format(new Date(venta.fecha), 'dd/MM/yyyy HH:mm', { locale: es })
                          : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatPrice(venta.total.toLocaleString())}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getEstadoBadge(venta.estado || 'completada')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                          onClick={() => handleViewVenta(venta.id!)}
                          className="text-purple-600 hover:text-purple-900 p-1"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
              ))}
              {ventasFiltradas.length === 0 && (
                  <tr>
                    <td className="px-6 py-6 text-center text-gray-500" colSpan={6}>Sin resultados</td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>

          {/* VISTA DE TARJETA (MÓVIL) */}
          <div className="md:hidden space-y-3">
            {ventasFiltradas.map((venta) => (
                <div key={venta.id} className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <ShoppingCart className="h-5 w-5 text-purple-600 mr-2" />
                      <h3 className="text-lg font-bold text-gray-900">Venta #{venta.id}</h3>
                    </div>
                    <button
                        onClick={() => handleViewVenta(venta.id!)}
                        className="text-purple-600 hover:text-purple-900 p-1"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 text-sm border-t pt-2">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-700 truncate">{venta.cliente_nombre || 'No especificado'}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-700">
                                  {venta.fecha
                                      ? format(new Date(venta.fecha), 'dd/MM/yyyy', { locale: es })
                                      : '-'}
                              </span>
                    </div>
                    <div className="col-span-1">
                      <span className="font-medium text-gray-500 block">Estado</span>
                      {getEstadoBadge(venta.estado || 'completada')}
                    </div>
                    <div className="col-span-1">
                      <span className="font-medium text-gray-500 block">Total</span>
                      <span className="text-xl font-bold text-gray-900">{formatPrice(venta.total.toLocaleString())}</span>
                    </div>
                  </div>
                </div>
            ))}
            {ventasFiltradas.length === 0 && (
                <div className="text-center py-6 text-gray-500">Sin resultados</div>
            )}
          </div>
        </div>

        {/* Modal de detalles - Se mantiene el ancho original ya que la información es densa */}
        {showModal && selectedVenta && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              {/* RESPONSIVE: w-11/12 max-w-4xl */}
              <div className="relative top-4 md:top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Detalles de Venta #{selectedVenta.id}
                    </h3>
                    <button
                        onClick={() => setShowModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Botón Eliminar */}
                  <div className="flex gap-2 mb-4">
                    <button
                        onClick={async () => {
                          if (confirm("¿Seguro que deseas eliminar esta venta?")) {
                            try {
                              await ventasAPI.delete(selectedVenta.id);
                              toast.success("Venta eliminada correctamente");
                              setShowModal(false);
                              fetchVentas();
                            } catch (error) {
                              toast.error("Error al eliminar la venta");
                            }
                          }
                        }}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Eliminar
                    </button>
                  </div>

                  {/* RESPONSIVE: Grid de 1 columna en móvil, 2 en md */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Información de la Venta</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Cliente:</span> {selectedVenta.cliente_nombre || 'No especificado'}
                        </div>
                        <div>
                          <span className="font-medium">Fecha:</span> {selectedVenta.fecha ? format(new Date(selectedVenta.fecha), 'dd/MM/yyyy HH:mm', { locale: es }) : '-'}
                        </div>
                        <div>
                          <span className="font-medium">Estado:</span> {selectedVenta.estado || 'Completada'}
                        </div>
                        <div>
                          <span className="font-medium">Método de Pago:</span> {selectedVenta.metodo_pago || 'No especificado'}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Resumen</h4>
                      <div className="text-2xl font-bold text-purple-600">
                        {formatPrice(selectedVenta.total.toLocaleString())}
                      </div>
                      <div className="text-sm text-gray-500">
                        Total de la venta
                      </div>
                    </div>
                  </div>

                  {/* Productos de la venta original */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">Productos</h4>
                    {/* Tabla sigue con scroll X, ya que son detalles importantes */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Producto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cantidad
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Precio Unitario
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subtotal
                          </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {selectedVenta.detalles?.map((detalle: any, index: number) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {detalle.producto_nombre || detalle.descripcion}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {detalle.cantidad}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatPrice(detalle.precio_unitario)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatPrice(detalle.subtotal)}
                              </td>
                            </tr>
                        ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pagos parciales */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">Pagos Parciales</h4>
                    {selectedVenta.pagosParciales && selectedVenta.pagosParciales.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ID Pago
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Método
                              </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {selectedVenta.pagosParciales.map((pago: any) => (
                                <tr key={pago.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pago.id}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {format(new Date(pago.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {formatPrice(pago.total)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {getEstadoBadge(pago.estado)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pago.metodo_pago}</td>
                                </tr>
                            ))}
                            </tbody>
                          </table>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No hay pagos parciales registrados</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
        )}
      </div>
  )
}

export default Ventas