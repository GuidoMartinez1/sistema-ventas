import { useEffect, useState } from 'react'
import { DollarSign, User, Package, Calendar as CalendarIcon, Phone, CheckCircle, MapPin } from 'lucide-react'
import { deudasAPI } from '../services/api'
import { Deuda } from '../services/api'
import toast from 'react-hot-toast'

// Clases de utilidad
const cardClass = "bg-white shadow-lg rounded-xl p-4 md:p-6";
const inputFieldClass = "w-full border border-gray-300 p-2 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition duration-150 ease-in-out text-sm";


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
  const [tipoPago, setTipoPago] = useState<'total' | 'parcial'>('total')
  const [montoParcial, setMontoParcial] = useState("")


  const [search, setSearch] = useState("")

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

  const filteredDeudas = deudas.filter((d) =>
      d.cliente_nombre?.toLowerCase().includes(search.toLowerCase()) ||
      d.telefono?.toLowerCase().includes(search.toLowerCase())
  )

  const openModalPago = (deudaId: number) => {
    setDeudaSeleccionada(deudaId)
    setMetodoPagoSeleccionado('efectivo') // default
    setTipoPago('total')
    setMontoParcial("")
  }


  const handleConfirmarPago = async () => {
    if (!deudaSeleccionada) return

    // Validación de monto parcial
    if (tipoPago === 'parcial') {
      const monto = parseFloat(montoParcial)
      const deudaActual = deudas.find(d => d.id === deudaSeleccionada)
      if (isNaN(monto) || monto <= 0) {
        toast.error('Ingrese un monto parcial válido.')
        return
      }
      if (deudaActual && monto > deudaActual.total) {
        toast.error('El monto parcial no puede ser mayor al total adeudado.')
        return
      }
    }


    try {
      setConfirmLoading(true)
      await deudasAPI.marcarComoPagada(
          deudaSeleccionada,
          metodoPagoSeleccionado,
          tipoPago,
          montoParcial
      )

      toast.success(tipoPago === 'total'
          ? 'Deuda pagada en su totalidad'
          : 'Pago parcial registrado')

      setDeudaSeleccionada(null)
      fetchDeudas()
    } catch (error) {
      toast.error('Error al registrar el pago')
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
      month: 'numeric', // Se usa numeric para ser más compacto
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }



  if (loading) {
    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        </div>
    )
  }

  return (
      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <DollarSign className="h-8 w-8 mr-3 text-orange-600" />
            Deudas Pendientes
          </h1>
          <p className="text-gray-600">
            Gestiona las ventas registradas como deudas y marca como pagadas cuando corresponda
          </p>
        </div>
        <div className="mb-4">
          <input
              type="text"
              placeholder="Buscar por cliente o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${inputFieldClass} w-full md:w-1/2`}/>
        </div>
        {deudas.length === 0 ? (
            <div className={`${cardClass} text-center py-12`}>
              <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay deudas pendientes</h3>
              <p className="text-gray-500">Todas las ventas están al día</p>
            </div>
        ) : (
            <div className="space-y-4">
              {filteredDeudas.map((deuda) => (
                  <div key={deuda.id} className="bg-white rounded-lg shadow-md border border-gray-200">
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start">
                        <div className="flex-1 min-w-0 pr-4 mb-4 sm:mb-0">
                          <div className="flex items-center mb-2 gap-3">
                            <User className="h-5 w-5 text-gray-500 flex-shrink-0" />
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {deuda.cliente_nombre || 'Cliente sin nombre'}
                            </h3>
                            <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full flex-shrink-0">
                                Deuda
                            </span>
                          </div>

                          {/* Info de contacto: Apilada en móvil */}
                          <div className="flex flex-col gap-1 text-sm text-gray-600 mb-2">
                            {deuda.telefono && (
                                <span className="flex items-center">
                                  <Phone className="h-4 w-4 mr-1 flex-shrink-0" />
                                  <span className='truncate'>{deuda.telefono}</span>
                                </span>
                            )}
                            {deuda.direccion && (
                                <span className="flex items-start">
                                  <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                                  <span className='truncate'>{deuda.direccion}</span>
                                </span>
                            )}
                          </div>

                          {/* Fecha */}
                          <div className="text-sm text-gray-600 flex items-center gap-2 mt-2">
                            <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                            <span>Venta: {formatDate(deuda.fecha)}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-start sm:items-end ml-0 sm:ml-4 flex-shrink-0">
                          <div className="text-3xl font-bold text-orange-600 mb-2">
                            {formatPrice(deuda.total)}
                          </div>
                          <button
                              onClick={() => openModalPago(deuda.id!)}
                              className="w-full sm:w-auto flex items-center justify-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
                        <div className="border-t border-gray-200 bg-gray-50 px-4 sm:px-6 py-4">
                          <h4 className="font-medium text-gray-900 mb-3">Productos adeudados:</h4>
                          <div className="space-y-3">
                            {deuda.detalles.map((detalle, index) => (
                                <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-3 rounded-lg border">
                                  <div className='min-w-0 pr-4'>
                                    <span className="font-medium text-gray-900 truncate block">{detalle.producto_nombre}</span>
                                    <span className="text-sm text-gray-500 block">
                                      {formatPrice(detalle.precio_unitario)} c/u
                                    </span>
                                  </div>
                                  <div className="text-left sm:text-right flex justify-between w-full sm:w-auto mt-2 sm:mt-0 pt-2 border-t sm:border-none sm:pt-0">
                                    <div className="text-sm text-gray-600">
                                      Cant: {detalle.cantidad}
                                    </div>
                                    <div className="font-bold text-gray-900 ml-4">
                                      Total: {formatPrice(detalle.subtotal)}
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
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
              {/* RESPONSIVE: w-full max-w-sm */}
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
                <h2 className="text-lg font-bold mb-4">Seleccionar método de pago</h2>
                <p className="text-sm text-gray-700 mb-3">Podés cambiar la forma de pago con la que se registró originalmente la venta.</p>
                <select
                    value={metodoPagoSeleccionado}
                    onChange={(e) => setMetodoPagoSeleccionado(e.target.value)}
                    className="w-full border p-2 rounded mb-4">
                  <option value="efectivo">Efectivo</option>
                  <option value="mercadopago">MercadoPago</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de pago</label>
                  <select
                      value={tipoPago}
                      onChange={(e) => setTipoPago(e.target.value as 'total' | 'parcial')}
                      className="w-full border p-2 rounded">
                    <option value="total">Total</option>
                    <option value="parcial">Parcial</option>
                  </select>
                </div>
                {tipoPago === 'parcial' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monto a pagar
                      </label>
                      <input
                          type="number"
                          value={montoParcial}
                          onChange={(e) => setMontoParcial(e.target.value)}
                          className="w-full border p-2 rounded"
                          placeholder="Ingrese monto"
                      />
                    </div>
                )}
                <div className="flex justify-end gap-2">
                  <button onClick={() => setDeudaSeleccionada(null)} className="px-3 py-2 bg-gray-300 rounded">Cancelar</button>
                  <button
                      onClick={handleConfirmarPago}
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded flex items-center"
                      disabled={confirmLoading || (tipoPago === 'parcial' && !montoParcial)}>
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