import { useEffect, useState, useRef } from 'react' // Se agregó useRef
import { DollarSign, User, Package, Calendar as CalendarIcon, Phone, CheckCircle, Camera } from 'lucide-react' // Se agregó Camera
import { deudasAPI } from '../services/api'
import { Deuda } from '../services/api'
import toast from 'react-hot-toast'
import html2canvas from 'html2canvas'

// Clases de utilidad
const cardClass = "bg-white shadow-lg rounded-xl p-4 md:p-6";
const inputFieldClass = "w-full border border-gray-300 p-2 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition duration-150 ease-in-out text-sm";


const formatPrice = (value: number | string | undefined) => {
  if (value === null || value === undefined || value === '') return '$0';
  const numberValue = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (isNaN(numberValue)) return '$0';
  return '$' + numberValue.toLocaleString("es-AR");
};

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

  // ESTADOS Y REFS FALTANTES ARREGLADOS
  const ticketRef = useRef<HTMLDivElement>(null)
  const [deudaParaTicket, setDeudaParaTicket] = useState<Deuda | null>(null)

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

  const copiarTicketDeuda = async (deuda: Deuda) => {
    setDeudaParaTicket(deuda);

    setTimeout(async () => {
      if (!ticketRef.current) return;

      const promesa = new Promise((resolve, reject) => {
        html2canvas(ticketRef.current!, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true
        })
        .then(canvas => canvas.toBlob(blob => {
          if (!blob) { reject('Error'); return; }
          navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
            .then(() => resolve('Copiado'));
        }))
        .catch(err => reject(err));
      });

      toast.promise(promesa, {
        loading: 'Generando detalle...',
        success: '¡Detalle copiado al portapapeles!',
        error: 'Error al generar imagen'
      });
    }, 100);
  };

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

  const deudorGroups: DeudorGroup[] = Object.values(groupedDeudas);

  const getMostRecentDate = (group: DeudorGroup) => {
    if (group.deudas.length === 0) return 0;
    return Math.max(...group.deudas.map(d => new Date(d.fecha!).getTime()));
  };

  deudorGroups.sort((a, b) => getMostRecentDate(b) - getMostRecentDate(a));

  deudorGroups.forEach(group => {
    group.deudas.sort((a, b) => {
      const dateA = a.fecha ? new Date(a.fecha).getTime() : 0;
      const dateB = b.fecha ? new Date(b.fecha).getTime() : 0;
      return dateB - dateA;
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
      toast.success(tipoPago === 'total' ? 'Deuda pagada' : 'Pago parcial registrado')
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
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
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
          <p className="text-gray-600">Gestiona deudas y pagos</p>
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
            </div>
        ) : (
            <div className="space-y-8">
              {deudorGroups.map((group, index) => (
                  <div key={index} className="space-y-3 border p-3 rounded-lg bg-gray-50 shadow-md">
                    <div className="p-3 bg-orange-100 rounded-lg border border-orange-300 shadow-sm">
                      <h2 className="text-xl font-bold text-orange-900 flex items-center mb-1">
                        <User className="h-5 w-5 mr-2 text-orange-600" />
                        {group.cliente_nombre}
                      </h2>
                      <div className="text-2xl font-extrabold text-red-600 mt-2 border-t border-orange-300 pt-1">
                        Total Adeudado: <span>{formatPrice(group.total_grupo)}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {group.deudas.map((deuda) => (
                          <div key={deuda.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="p-4 sm:p-5">
                              <div className="flex flex-col sm:flex-row justify-between items-start">
                                <div className="flex-1 min-w-0 pr-4 mb-3 sm:mb-0">
                                  <h4 className="text-md font-semibold text-gray-800">Venta N° {deuda.id}</h4>
                                  <div className="text-sm text-gray-600 flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4" />
                                    <span>{formatDate(deuda.fecha)}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-start sm:items-end gap-2">
                                  <div className="text-2xl font-bold text-red-600">
                                    {formatPrice(deuda.total)}
                                  </div>
                                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                                      <button
                                        onClick={() => copiarTicketDeuda(deuda)}
                                        className="flex items-center justify-center px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100"
                                      >
                                        <Camera className="h-4 w-4 mr-1" />
                                        Copiar Detalle
                                      </button>
                                      <button
                                        onClick={() => openModalPago(deuda.id!)}
                                        className="flex items-center justify-center px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Pagar
                                      </button>
                                  </div>
                                </div>
                              </div>
                              <button
                                  onClick={() => toggleExpanded(deuda.id!)}
                                  className="mt-3 flex items-center text-blue-600 text-sm font-medium"
                              >
                                <Package className="h-4 w-4 mr-1" />
                                {expandedDeuda === deuda.id ? 'Ocultar' : 'Ver'} productos ({deuda.detalles.length})
                              </button>
                            </div>

                            {expandedDeuda === deuda.id && (
                                <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                                  <div className="space-y-2">
                                    {deuda.detalles.map((detalle, detIndex) => (
                                        <div key={detIndex} className="flex justify-between items-center bg-white p-2 rounded border text-sm">
                                          <div>
                                              <span className="font-medium block">{detalle.producto_nombre || detalle.descripcion}</span>
                                              <span className="text-xs text-gray-500">{formatPrice(detalle.precio_unitario)} c/u</span>
                                          </div>
                                          <div className="text-right">
                                            <div>Cant: {detalle.cantidad}</div>
                                            <div className="font-bold">{formatPrice(detalle.subtotal)}</div>
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

        {/* Modal de pago */}
        {deudaSeleccionada && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
                <h2 className="text-lg font-bold mb-4">Método de pago</h2>
                <select value={metodoPagoSeleccionado} onChange={(e) => setMetodoPagoSeleccionado(e.target.value)} className="w-full border p-2 rounded mb-4">
                  <option value="efectivo">Efectivo</option>
                  <option value="mercadopago">MercadoPago</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setDeudaSeleccionada(null)} className="px-3 py-2 bg-gray-300 rounded">Cancelar</button>
                  <button onClick={handleConfirmarPago} className="px-3 py-2 bg-green-600 text-white rounded">
                    {confirmLoading ? 'Procesando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* TICKET DE DEUDA OCULTO PARA CAPTURA */}
        <div
          ref={ticketRef}
          style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '400px', backgroundColor: 'white', padding: '24px', color: 'black', fontFamily: 'sans-serif' }}
        >
          <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
              <h1 className="text-xl font-bold uppercase">Estado de Deuda</h1>
              <h2 className="text-2xl font-black">ALIMAR</h2>
              <p className="text-sm text-gray-500 mt-1">Cliente: {deudaParaTicket?.cliente_nombre}</p>
          </div>
          <div className="space-y-3">
              {deudaParaTicket?.detalles.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start border-b border-gray-100 pb-2">
                      <div className="flex-1 pr-4">
                          <span className="font-bold mr-2 text-sm">{item.cantidad}x</span>
                          <span className="text-sm uppercase">{item.producto_nombre || item.descripcion}</span>
                      </div>
                      <div className="font-bold">{formatPrice(item.subtotal)}</div>
                  </div>
              ))}
          </div>
          <div className="mt-6 pt-4 border-t-4 border-gray-900">
              <div className="flex justify-between items-center text-3xl font-black">
                  <span>TOTAL:</span>
                  <span className="text-red-600">{formatPrice(deudaParaTicket?.total || 0)}</span>
              </div>
          </div>
        </div>
      </div>
  )
}

export default Deudas