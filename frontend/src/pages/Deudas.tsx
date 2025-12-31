import { useEffect, useState } from 'react'
import { DollarSign, User, Package, Calendar as CalendarIcon, Phone, CheckCircle } from 'lucide-react'
import { deudasAPI } from '../services/api'
import { Deuda } from '../services/api'
import toast from 'react-hot-toast'

// Clases de utilidad
const cardClass = "bg-white shadow-lg rounded-xl p-4 md:p-6";
const inputFieldClass = "w-full border border-gray-300 p-2 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition duration-150 ease-in-out text-sm";


const formatPrice = (value: number | string | undefined) => {
  if (value === null || value === undefined || value === '') return '$0';
  // Aseguramos que el valor sea un número antes de formatear
  const numberValue = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (isNaN(numberValue)) return '$0'; // Manejo si todavía es NaN
  return '$' + numberValue.toLocaleString("es-AR");
};

// --- INTERFAZ PARA EL GRUPO DE DEUDAS POR CLIENTE ---
interface DeudorGroup {
  cliente_nombre: string,
  telefono: string | undefined,
  direccion: string | undefined,
  deudas: Deuda[],
  total_grupo: number
}


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

  // 1. Filtrado de deudas
  const filteredDeudas = deudas.filter((d) =>
      d.cliente_nombre?.toLowerCase().includes(search.toLowerCase()) ||
      d.telefono?.toLowerCase().includes(search.toLowerCase())
  )

  // 2. AGRUPACIÓN DE DEUDAS POR CLIENTE
  const groupedDeudas = filteredDeudas.reduce((acc, deuda) => {
    const key = deuda.cliente_id?.toString() || deuda.cliente_nombre || 'Cliente Desconocido';

    const deudaTotal = Number(deuda.total) || 0;

    if (!acc[key]) {
      acc[key] = {
        cliente_nombre: deuda.cliente_nombre || 'Cliente sin nombre',
        telefono: deuda.telefono,
        direccion: deuda.direccion,
        deudas: [],
        total_grupo: 0,
      };
    }

    acc[key].deudas.push(deuda);
    acc[key].total_grupo += deudaTotal;
    return acc;
  }, {} as Record<string, DeudorGroup>);

  // 3. Convertir el objeto de grupos en un array y ORDENAR POR FECHA
  const deudorGroups: DeudorGroup[] = Object.values(groupedDeudas);

  // Función para encontrar la fecha de deuda más reciente en un grupo
  const getMostRecentDate = (group: DeudorGroup) => {
    if (group.deudas.length === 0) return 0;
    // Encontrar la fecha más grande (más reciente) en el grupo
    const maxDate = Math.max(...group.deudas.map(d => new Date(d.fecha!).getTime()));
    return maxDate;
  };

  // --- CAMBIO CLAVE AQUÍ: Ordenar por la fecha de la deuda más reciente (descendente) ---
  deudorGroups.sort((a, b) => getMostRecentDate(b) - getMostRecentDate(a));
  // -------------------------------------------------------------------------------------


  // Opcional: ordenar las deudas individuales dentro de cada grupo por fecha también
  deudorGroups.forEach(group => {
    group.deudas.sort((a, b) => {
      const dateA = a.fecha ? new Date(a.fecha).getTime() : 0;
      const dateB = b.fecha ? new Date(b.fecha).getTime() : 0;
      return dateB - dateA; // Más reciente primero
    });
  });


  const openModalPago = (deudaId: number) => {
    setDeudaSeleccionada(deudaId)
    setMetodoPagoSeleccionado('efectivo')
    setTipoPago('total')
    setMontoParcial("")
  }


  const handleConfirmarPago = async () => {
      if (!deudaSeleccionada) return

      // 1. Buscamos la deuda completa para saber cuánto debe
      const deudaActual = deudas.find(d => d.id === deudaSeleccionada)
      if (!deudaActual) return

      // 2. Determinamos el monto final a enviar al backend
      let montoFinal = 0

      if (tipoPago === 'total') {
        // Si es total, usamos el total de la deuda
        montoFinal = Number(deudaActual.total)
      } else {
        // Si es parcial, validamos el input
        montoFinal = parseFloat(montoParcial)
        if (isNaN(montoFinal) || montoFinal <= 0) {
          toast.error('Ingrese un monto parcial válido.')
          return
        }
        if (montoFinal > Number(deudaActual.total)) {
          toast.error('El monto parcial no puede ser mayor al total adeudado.')
          return
        }
      }

      try {
        setConfirmLoading(true)

        // 3. Enviamos los datos limpios a la API
        // Nota: Eliminamos 'tipoPago' de los argumentos porque al backend
        // solo le importa el monto (sea total o parcial) y el método.
        await deudasAPI.marcarComoPagada(
            deudaSeleccionada,
            montoFinal,
            metodoPagoSeleccionado
        )

        toast.success(tipoPago === 'total'
            ? 'Deuda pagada en su totalidad'
            : 'Pago parcial registrado')

        setDeudaSeleccionada(null)
        // Limpiamos estados
        setMontoParcial("")
        setTipoPago('total')
        fetchDeudas()
      } catch (error) {
        console.error(error)
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
      month: 'numeric',
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
            // ITERACIÓN POR GRUPOS DE DEUDORES
            <div className="space-y-8">
              {deudorGroups.map((group, index) => (
                  <div key={index} className="space-y-3 border p-3 rounded-lg bg-gray-50 shadow-md">

                    {/* --- ENCABEZADO DEL GRUPO (DEUDOR) - DISEÑO MÁS COMPACTO --- */}
                    <div className="p-3 bg-orange-100 rounded-lg border border-orange-300 shadow-sm">
                      <h2 className="text-xl font-bold text-orange-900 flex items-center mb-1">
                        <User className="h-5 w-5 mr-2 text-orange-600" />
                        {group.cliente_nombre}
                      </h2>
                      <div className="flex flex-wrap gap-x-4 text-sm text-orange-700">
                        {group.telefono && (
                            <span className="flex items-center">
                            <Phone className="h-3 w-3 mr-1" /> {group.telefono}
                          </span>
                        )}
                      </div>
                      {/* El total adeudado ahora usa formato de precio correcto */}
                      <div className="text-2xl font-extrabold text-red-600 mt-2 border-t border-orange-300 pt-1">
                        Total Adeudado: <span className="text-2xl">{formatPrice(group.total_grupo)}</span>
                      </div>
                    </div>

                    {/* --- LISTA DE DEUDAS INDIVIDUALES DEL GRUPO --- */}
                    <h3 className="text-sm font-semibold text-gray-600 mt-4 mb-1 ml-1">
                      Ventas pendientes ({group.deudas.length}):
                    </h3>
                    <div className="space-y-3">
                      {/* Las deudas individuales dentro de este grupo ya están ordenadas por fecha */}
                      {group.deudas.map((deuda) => (
                          <div key={deuda.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="p-4 sm:p-5">
                              <div className="flex flex-col sm:flex-row justify-between items-start">
                                <div className="flex-1 min-w-0 pr-4 mb-3 sm:mb-0">
                                  <div className="flex items-center mb-1 gap-3">
                                    <h4 className="text-md font-semibold text-gray-800 truncate">
                                      Venta N° {deuda.id}
                                    </h4>
                                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full flex-shrink-0">
                                                  Venta
                                              </span>
                                  </div>
                                  <div className="text-sm text-gray-600 flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                                    <span>Generada: {formatDate(deuda.fecha)}</span>
                                  </div>
                                </div>

                                <div className="flex flex-col items-start sm:items-end ml-0 sm:ml-4 flex-shrink-0">
                                  <div className="text-2xl font-bold text-red-600 mb-2">
                                    {formatPrice(deuda.total)}
                                  </div>
                                  <button
                                      onClick={() => openModalPago(deuda.id!)}
                                      className="w-full sm:w-auto flex items-center justify-center px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Pagar esta deuda
                                  </button>
                                </div>
                              </div>

                              <button
                                  onClick={() => toggleExpanded(deuda.id!)}
                                  className="mt-3 flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                <Package className="h-4 w-4 mr-1" />
                                {expandedDeuda === deuda.id ? 'Ocultar' : 'Ver'} productos ({deuda.detalles.length})
                              </button>
                            </div>

                            {/* Sección de detalles del producto */}
                            {expandedDeuda === deuda.id && (
                                <div className="border-t border-gray-200 bg-gray-50 px-4 sm:px-6 py-3">
                                  <h4 className="font-medium text-gray-900 mb-2 text-sm">Productos de esta venta:</h4>
                                  <div className="space-y-2">
                                    {deuda.detalles.map((detalle, detIndex) => (
                                        <div key={detIndex} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-2 rounded-lg border">

                                          <div className='min-w-0 w-full sm:w-auto flex-1 pr-4'>
                                                      <span className="font-medium text-gray-900 truncate block text-sm">
                                                        {detalle.producto_nombre || detalle.descripcion}
                                                      </span>
                                            <span className="text-xs text-gray-500 block">
                                                        {formatPrice(detalle.precio_unitario)} c/u
                                                      </span>
                                          </div>

                                          <div className="flex-shrink-0 text-left sm:text-right flex justify-between sm:justify-end w-full sm:w-auto mt-1 sm:mt-0 pt-1 border-t sm:border-none sm:pt-0 text-sm">
                                            <div className="text-gray-600">
                                              Cant: **{detalle.cantidad}**
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
                  </div>
              ))}
            </div>
        )}

        {/* Modal de método de pago (sin cambios) */}
        {deudaSeleccionada && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
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