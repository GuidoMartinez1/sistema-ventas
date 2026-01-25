import { useEffect, useState, useRef } from 'react'
import { DollarSign, User, Package, Calendar as CalendarIcon, Phone, CheckCircle, Camera } from 'lucide-react'
import { deudasAPI } from '../services/api'
import { Deuda } from '../services/api'
import toast from 'react-hot-toast'
import html2canvas from 'html2canvas'

// --- UTILIDADES ---
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
  // --- ESTADOS ---
  const [deudas, setDeudas] = useState<Deuda[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDeuda, setExpandedDeuda] = useState<number | null>(null)
  const [search, setSearch] = useState("")

  // Estados para Modal de Pago
  const [deudaSeleccionada, setDeudaSeleccionada] = useState<number | null>(null)
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<string>('efectivo')
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [tipoPago, setTipoPago] = useState<'total' | 'parcial'>('total')
  const [montoParcial, setMontoParcial] = useState("")

  // Estados para Ticket Consolidado
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

  // --- LÓGICA DE COPIADO CONSOLIDADO ---
  const copiarEstadoCuenta = async (group: DeudorGroup) => {
    setGrupoParaTicket(group);

    // Delay para asegurar que React renderice el ticket oculto con la nueva data
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
        success: '¡Resumen de deuda total copiado!',
        error: 'Error al generar imagen'
      });
    }, 150);
  };

  // --- FILTRADO Y AGRUPACIÓN ---
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

  const handleConfirmarPago = async () => {
    if (!deudaSeleccionada) return;
    try {
      setConfirmLoading(true)
      await deudasAPI.marcarComoPagada(deudaSeleccionada, metodoPagoSeleccionado, tipoPago, montoParcial)
      toast.success('Pago registrado correctamente')
      setDeudaSeleccionada(null)
      fetchDeudas()
    } catch {
      toast.error('Error al registrar pago')
    } finally {
      setConfirmLoading(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sin fecha'
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div>

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <DollarSign className="h-8 w-8 mr-3 text-orange-600" />
          Deudas Pendientes
        </h1>
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputFieldClass} w-full md:w-1/2`}
        />
      </div>

      <div className="space-y-8">
        {deudorGroups.map((group, index) => (
          <div key={index} className="space-y-3 border p-3 rounded-lg bg-gray-50 shadow-md">
            {/* ENCABEZADO DE GRUPO */}
            <div className="p-4 bg-orange-100 rounded-lg border border-orange-300 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-orange-900 flex items-center">
                  <User className="h-5 w-5 mr-2 text-orange-600" />
                  {group.cliente_nombre}
                </h2>
                <div className="text-2xl font-black text-red-600">
                  Total Adeudado: {formatPrice(group.total_grupo)}
                </div>
              </div>
              <button
                onClick={() => copiarEstadoCuenta(group)}
                className="flex items-center gap-2 bg-white text-orange-700 border border-orange-300 px-4 py-2 rounded-lg font-bold hover:bg-orange-50 transition-colors shadow-sm"
              >
                <Camera className="h-5 w-5" />
                Copiar Deuda Total
              </button>
            </div>

            {/* VENTAS INDIVIDUALES */}
            <div className="space-y-2">
              {group.deudas.map((deuda) => (
                <div key={deuda.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-gray-800">Venta N° {deuda.id}</span>
                      <p className="text-xs text-gray-500">{formatDate(deuda.fecha)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-red-600">{formatPrice(deuda.total)}</span>
                      <button
                        onClick={() => setDeudaSeleccionada(deuda.id!)}
                        className="bg-green-600 text-white p-1.5 rounded-lg hover:bg-green-700"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedDeuda(expandedDeuda === deuda.id ? null : deuda.id)}
                    className="mt-2 text-xs text-blue-600 font-bold"
                  >
                    {expandedDeuda === deuda.id ? 'Ocultar' : 'Ver'} detalles ({deuda.detalles.length})
                  </button>
                  {expandedDeuda === deuda.id && (
                    <div className="mt-2 space-y-1 bg-gray-50 p-2 rounded">
                      {deuda.detalles.map((det, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span>{det.cantidad}x {det.producto_nombre || det.descripcion}</span>
                          <span className="font-bold">{formatPrice(det.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* --- TICKET CONSOLIDADO OCULTO --- */}
      <div
        ref={ticketRef}
        style={{
          position: 'fixed', top: '-9999px', left: '-9999px',
          width: '450px', backgroundColor: 'white', padding: '30px', color: 'black', fontFamily: 'sans-serif'
        }}
      >
        <div className="text-center border-b-4 border-gray-900 pb-4 mb-6">
          <h1 className="text-lg font-bold uppercase tracking-widest text-gray-400">Estado de Cuenta</h1>
          <h2 className="text-3xl font-black">ALIMAR</h2>
          <div className="mt-2 py-1 bg-gray-900 text-white text-sm font-bold uppercase">
            Cliente: {grupoParaTicket?.cliente_nombre}
          </div>
        </div>

        <div className="space-y-6">
          {grupoParaTicket?.deudas.map((deuda, dIdx) => (
            <div key={dIdx} className="border-l-4 border-orange-400 pl-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-black bg-gray-100 px-2 py-0.5 rounded">
                  VENTA: {new Date(deuda.fecha!).toLocaleDateString('es-AR')}
                </span>
                <span className="font-bold text-xs text-gray-500">ID: #{deuda.id}</span>
              </div>
              <div className="space-y-1">
                {deuda.detalles.map((det, detIdx) => (
                  <div key={detIdx} className="flex justify-between text-sm">
                    <span><span className="font-bold">{det.cantidad}x</span> {det.producto_nombre || det.descripcion}</span>
                    <span>{formatPrice(det.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="text-right mt-1 font-bold text-sm border-t border-dashed border-gray-200 pt-1">
                Subtotal Venta: {formatPrice(deuda.total)}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-4 border-t-4 border-gray-900">
          <div className="flex justify-between items-center">
            <span className="text-xl font-black uppercase">Deuda Total:</span>
            <span className="text-4xl font-black text-red-600">
              {formatPrice(grupoParaTicket?.total_grupo || 0)}
            </span>
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200 text-center">
            <p className="text-xs font-black text-blue-600 uppercase">Transferir a ALIAS:</p>
            <p className="text-2xl font-black text-blue-800">alimar25</p>
            <p className="text-xs font-bold text-gray-600 mt-1">A nombre de: Carlos Alberto Martinez</p>
          </div>
        </div>
        <div className="mt-8 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
          *** Gracias por tu compra - Alimar Petshop ***
        </div>
      </div>

      {/* Modal de Pago Simple */}
      {deudaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4">Registrar Pago</h2>
            <select
              className={inputFieldClass + " mb-4"}
              value={metodoPagoSeleccionado}
              onChange={(e) => setMetodoPagoSeleccionado(e.target.value)}
            >
              <option value="efectivo">Efectivo</option>
              <option value="mercadopago">MercadoPago</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeudaSeleccionada(null)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancelar</button>
              <button onClick={handleConfirmarPago} className="px-4 py-2 bg-green-600 text-white rounded-lg">
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