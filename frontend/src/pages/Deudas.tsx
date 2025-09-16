import { useEffect, useState } from 'react'
import { DollarSign, User, Package, Calendar as CalendarIcon, Phone, CheckCircle } from 'lucide-react'
import { deudasAPI } from '../services/api'
import { Deuda } from '../services/api'
import toast from 'react-hot-toast'

const formatPrice = (value: number | string | undefined) => {
  if (value === null || value === undefined || value === '') return '$0';
  return '$' + Number(value).toLocaleString("es-AR");
};

const Deudas = () => {
  const [deudas, setDeudas] = useState<Deuda[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDeuda, setExpandedDeuda] = useState<number | null>(null)

  // modal / selección de pago
  const [deudaSeleccionada, setDeudaSeleccionada] = useState<number | null>(null)
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<string>('efectivo')
  const [confirmLoading, setConfirmLoading] = useState(false)

  useEffect(() => {
    fetchDeudas()
  }, [])

  const fetchDeudas = async () => {
    try {
      setLoading(true)
      const response = await deudasAPI.getAll()
      setDeudas(response.data)
    } catch (error) {
      toast.error('Error al cargar las deudas')
    } finally {
      setLoading(false)
    }
  }

  const openModalPago = (deudaId: number) => {
    setDeudaSeleccionada(deudaId)
    setMetodoPagoSeleccionado('efectivo') // default
  }

  const handleConfirmarPago = async () => {
    if (!deudaSeleccionada) return
    try {
      setConfirmLoading(true)
      await deudasAPI.marcarComoPagada(deudaSeleccionada, metodoPagoSeleccionado)
      toast.success('Deuda marcada como pagada')
      setDeudaSeleccionada(null)
      fetchDeudas()
    } catch (error) {
      toast.error('Error al marcar la deuda como pagada')
    } finally {
      setConfirmLoading(false)
    }
  }

  const toggleExpanded = (deudaId: number) => {
    setExpandedDeuda(expandedDeuda === deudaId ? null : deudaId)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sin fecha'
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
    )
  }

  return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <DollarSign className="h-8 w-8 mr-3 text-orange-600" />
            Deudas Pendientes
          </h1>
          <p className="text-gray-600">
            Gestiona las ventas registradas como deudas y marca como pagadas cuando corresponda
          </p>
        </div>

        {deudas.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay deudas pendientes</h3>
              <p className="text-gray-500">Todas las ventas están al día</p>
            </div>
        ) : (
            <div className="space-y-4">
              {deudas.map((deuda) => (
                  <div key={deuda.id} className="bg-white rounded-lg shadow-md border border-gray-200">
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-2 gap-4 flex-wrap">
                            <User className="h-5 w-5 text-gray-500 mr-2" />
                            <h3 className="text-lg font-semibold text-gray-900">
                              {deuda.cliente_nombre || 'Cliente sin nombre'}
                            </h3>
                            <span className="ml-3 px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                        Deuda Pendiente
                      </span>
                          </div>

                          <div className="flex flex-col md:flex-row md:items-center gap-2 text-sm text-gray-600 mb-2">
                            {deuda.telefono && (
                                <span className="flex items-center"><Phone className="h-4 w-4 mr-1" />{deuda.telefono}</span>
                            )}
                            {deuda.direccion && (
                                <span className="flex items-center"><span className="font-semibold mr-1">Dirección:</span>{deuda.direccion}</span>
                            )}
                          </div>

                          {/* Fecha de la venta / deuda */}
                          <div className="text-sm text-gray-600 flex items-center gap-2 mt-2">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{formatDate(deuda.fecha)}</span>
                          </div>
                        </div>

                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-orange-600">
                            {formatPrice(deuda.total)}
                          </div>
                          <button
                              onClick={() => openModalPago(deuda.id!)}
                              className="mt-2 flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Marcar como pagada
                          </button>
                        </div>
                      </div>

                      <button
                          onClick={() => toggleExpanded(deuda.id!)}
                          className="mt-4 flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <Package className="h-4 w-4 mr-1" />
                        {expandedDeuda === deuda.id ? 'Ocultar' : 'Ver'} productos ({deuda.detalles.length})
                      </button>
                    </div>

                    {expandedDeuda === deuda.id && (
                        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                          <h4 className="font-medium text-gray-900 mb-3">Productos adeudados:</h4>
                          <div className="space-y-2">
                            {deuda.detalles.map((detalle, index) => (
                                <div key={index} className="flex justify-between items-center bg-white p-3 rounded-lg border">
                                  <div>
                                    <span className="font-medium text-gray-900">{detalle.producto_nombre}</span>
                                    <span className="text-sm text-gray-500 ml-2">
                            ${detalle.precio_unitario} c/u
                          </span>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm text-gray-600">
                                      Cantidad: {detalle.cantidad}
                                    </div>
                                    <div className="font-medium text-gray-900">
                                      {formatPrice(detalle.subtotal)}
                                    </div>
                                  </div>
                                </div>
                            ))}
                          </div>
                        </div>
                    )}
                  </div>
              ))}
            </div>
        )}

        {/* Modal de método de pago */}
        {deudaSeleccionada && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h2 className="text-lg font-bold mb-4">Seleccionar método de pago</h2>
                <p className="text-sm text-gray-700 mb-3">Podés cambiar la forma de pago con la que se registró originalmente la venta.</p>
                <select
                    value={metodoPagoSeleccionado}
                    onChange={(e) => setMetodoPagoSeleccionado(e.target.value)}
                    className="w-full border p-2 rounded mb-4"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="mercadopago">MercadoPago</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>

                <div className="flex justify-end gap-2">
                  <button onClick={() => setDeudaSeleccionada(null)} className="px-3 py-1 bg-gray-300 rounded">Cancelar</button>
                  <button
                      onClick={handleConfirmarPago}
                      className="px-3 py-1 bg-green-600 text-white rounded flex items-center"
                      disabled={confirmLoading}
                  >
                    {confirmLoading ? 'Procesando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  )
}

export default Deudas
