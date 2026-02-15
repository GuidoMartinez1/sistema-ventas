import { useEffect, useState, useRef } from 'react'
import { DollarSign, User, Package, Calendar as CalendarIcon, Phone, CheckCircle, Camera } from 'lucide-react'
import { deudasAPI } from '../services/api'
import { Deuda } from '../services/api'
import toast from 'react-hot-toast'
import html2canvas from 'html2canvas'

// --- CLASES DE UTILIDAD ---
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
  const [search, setSearch] = useState("")

  const [deudaSeleccionada, setDeudaSeleccionada] = useState<number | null>(null)
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<string>('efectivo')
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [tipoPago, setTipoPago] = useState<'total' | 'parcial'>('total')
  const [montoParcial, setMontoParcial] = useState("")

  const ticketRef = useRef<HTMLDivElement>(null)
  const [grupoParaTicket, setGrupoParaTicket] = useState<DeudorGroup | null>(null)

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

  const copiarEstadoCuenta = async (group: DeudorGroup) => {
    setGrupoParaTicket(group);
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
        loading: 'Generando estado de cuenta...',
        success: '¡Deuda total copiada!',
        error: 'Error al generar imagen'
      });
    }, 150);
  };

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

  const deudorGroups = Object.values(groupedDeudas).sort((a, b) => {
    const dateA = Math.max(...a.deudas.map(d => new Date(d.fecha!).getTime()));
    const dateB = Math.max(...b.deudas.map(d => new Date(d.fecha!).getTime()));
    return dateB - dateA;
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
      if (isNaN(monto) || monto <= 0 || (deudaActual && monto > deudaActual.total)) {
        toast.error('Monto inválido o superior a la deuda')
        return
      }
    }

    try {
      setConfirmLoading(true)
      await deudasAPI.marcarComoPagada(deudaSeleccionada, metodoPagoSeleccionado, tipoPago, montoParcial)
      toast.success(tipoPago === 'total' ? 'Deuda cancelada' : 'Pago parcial registrado')
      setDeudaSeleccionada(null)
      fetchDeudas()
    } catch {
      toast.error('Error al procesar el pago')
    } finally {
      setConfirmLoading(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sin fecha'
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div>

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <DollarSign className="h-8 w-8 mr-3 text-orange-600" />
          Deudas Pendientes
        </h1>
        <input
          type="text"
          placeholder="Buscar por cliente o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputFieldClass} w-full md:w-1/2`}
        />
      </div>

      <div className="space-y-8">
        {deudorGroups.map((group, index) => (
          <div key={index} className="space-y-3 border p-3 rounded-lg bg-gray-50 shadow-md">
            <div className="p-3 bg-orange-100 rounded-lg border border-orange-300 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-orange-900 flex items-center mb-1">
                  <User className="h-5 w-5 mr-2 text-orange-600" />
                  {group.cliente_nombre}
                </h2>
                <div className="text-2xl font-extrabold text-red-600">
                  Debe Total: {formatPrice(group.total_grupo)}
                </div>
              </div>
              <button
                onClick={() => copiarEstadoCuenta(group)}
                className="flex items-center gap-2 bg-white text-orange-700 border border-orange-300 px-3 py-2 rounded-lg font-bold text-sm hover:bg-orange-50 transition-colors"
              >
                <Camera className="h-4 w-4" />
                Copiar Deuda Total
              </button>
            </div>

            <div className="space-y-3">
              {group.deudas.map((deuda) => (
                <div key={deuda.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800">Venta N° {deuda.id}</h4>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" /> {formatDate(deuda.fecha)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xl font-bold text-red-600">{formatPrice(deuda.total)}</span>
                      <button onClick={() => openModalPago(deuda.id!)} className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                        <CheckCircle className="h-4 w-4 mr-1" /> Pagar
                      </button>
                    </div>
                  </div>
                  <button onClick={() => setExpandedDeuda(expandedDeuda === deuda.id ? null : deuda.id)} className="mt-2 text-blue-600 text-sm font-medium flex items-center gap-1">
                    <Package className="h-4 w-4" /> {expandedDeuda === deuda.id ? 'Ocultar' : 'Ver'} productos ({deuda.detalles.length})
                  </button>
                  {expandedDeuda === deuda.id && (
                    <div className="mt-3 bg-gray-50 p-2 rounded border space-y-2">
                      {deuda.detalles.map((det, detIdx) => {
                        // SEGURIDAD 1: UI EXPANDIBLE
                        const nombrePantalla = det.producto_nombre || det.descripcion || "Producto (x Kg)";
                        return (
                          <div key={detIdx} className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              <span className="font-bold">{det.cantidad}x</span> {nombrePantalla}
                            </span>
                            <span className="font-medium">{formatPrice(det.subtotal)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE PAGO */}
      {deudaSeleccionada && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Registrar Pago</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Método</label>
                <select value={metodoPagoSeleccionado} onChange={(e) => setMetodoPagoSeleccionado(e.target.value)} className="w-full border p-2 rounded">
                  <option value="efectivo">Efectivo</option>
                  <option value="mercadopago">MercadoPago</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de pago</label>
                <select value={tipoPago} onChange={(e) => setTipoPago(e.target.value as 'total' | 'parcial')} className="w-full border p-2 rounded">
                  <option value="total">Total</option>
                  <option value="parcial">Parcial</option>
                </select>
              </div>
              {tipoPago === 'parcial' && (
                <input type="number" value={montoParcial} onChange={(e) => setMontoParcial(e.target.value)} className="w-full border p-2 rounded" placeholder="Monto a entregar" />
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setDeudaSeleccionada(null)} className="px-3 py-2 bg-gray-300 rounded">Cancelar</button>
              <button onClick={handleConfirmarPago} disabled={confirmLoading} className="px-3 py-2 bg-green-600 text-white rounded">
                {confirmLoading ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TICKET CONSOLIDADO (IMAGEN) */}
      <div
        ref={ticketRef}
        style={{
          position: 'fixed', top: '-9999px', left: '-9999px', width: '450px',
          backgroundColor: 'white', padding: '30px', color: 'black', fontFamily: 'sans-serif'
        }}
      >
        <div className="text-center border-b border-gray-300 pb-4 mb-6">
          <h1 className="text-xl font-bold uppercase tracking-widest text-gray-400">Estado de Cuenta</h1>
          <h2 className="text-3xl font-black">ALIMAR</h2>
          <div className="mt-3 text-lg text-gray-700 border-y border-gray-100 py-1">
             {grupoParaTicket?.cliente_nombre}
          </div>
        </div>

        <div className="space-y-6">
          {grupoParaTicket?.deudas.map((deuda, dIdx) => (
            <div key={dIdx} className="border-b border-gray-50 pb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-400">
                  COMPRA: {new Date(deuda.fecha!).toLocaleDateString('es-AR')}
                </span>
              </div>
              <div className="space-y-1">
                {deuda.detalles.map((det, detIdx) => {
                  // SEGURIDAD 2: TICKET IMAGEN (Aquí estaba el error)
                  const nombreTicket = det.producto_nombre || det.descripcion || "Producto (x Kg)";
                  return (
                    <div key={detIdx} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        <span className="font-bold">{det.cantidad}x</span> {nombreTicket}
                      </span>
                      <span className="font-medium">{formatPrice(det.subtotal)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="text-right mt-1 font-bold text-sm text-gray-500 italic">
                Subtotal: {formatPrice(deuda.total)}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-4 border-t-2 border-gray-900">
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold">TOTAL PENDIENTE:</span>
            <span className="text-4xl font-black text-red-600">
              {formatPrice(grupoParaTicket?.total_grupo || 0)}
            </span>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Alias para transferencia:</p>
            <p className="text-2xl font-black text-blue-800">alimar25</p>
            <p className="text-xs font-semibold text-gray-600 mt-1">Titular: Carlos Alberto Martinez</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">
            Gracias por elegir Alimar Petshop
          </p>
        </div>
      </div>
    </div>
  )
}

export default Deudas