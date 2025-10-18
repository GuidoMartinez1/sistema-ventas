import { useEffect, useState } from 'react'
import { PlusCircle, DollarSign, Trash2, Calendar, FileText } from 'lucide-react'
// IMPORTANTE: Asegúrate de importar cotizacionesAPI
import { Gasto, gastosAPI, cotizacionesAPI } from '../services/api'
import toast from 'react-hot-toast'

// --- GastoForm Component (MODIFICADO) ---
const GastoForm = ({ onSave }: { onSave: () => void }) => {
    const [concepto, setConcepto] = useState('')
    const [monto, setMonto] = useState('')
    const [fecha, setFecha] = useState(new Date().toLocaleDateString('en-CA')) // yyyy-mm-dd
    const [moneda, setMoneda] = useState<'ARS' | 'USD'>('ARS') // Nuevo estado
    const [cotizacionActual, setCotizacionActual] = useState(1) // Cotización cargada
    const [cotizacionLoading, setCotizacionLoading] = useState(false)

    // Efecto para buscar la cotización
    useEffect(() => {
        const fetchCotizacion = async () => {
            if (moneda === 'USD' && fecha) {
                setCotizacionLoading(true)
                try {
                    // Llama al endpoint que busca la cotización por fecha
                    const response = await cotizacionesAPI.getByDate(fecha)
                    const valor = response.data.valor || 0

                    if (valor <= 1 && fecha !== new Date().toLocaleDateString('en-CA')) {
                        // Si el valor es 1 o 0 (no encontrado) y no es el día de hoy, lanza un error visible
                        toast.error(`No hay cotización USD registrada para la fecha ${new Date(fecha).toLocaleDateString()}.`)
                        setCotizacionActual(0)
                    } else {
                        setCotizacionActual(valor)
                    }
                } catch (error) {
                    toast.error('Error al consultar la cotización.')
                    setCotizacionActual(0)
                } finally {
                    setCotizacionLoading(false)
                }
            } else {
                setCotizacionActual(1) // Cotización ARS = 1
            }
        }
        fetchCotizacion()
    }, [fecha, moneda])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const montoNum = parseFloat(monto)

        // Validación crítica de cotización para USD
        if (moneda === 'USD' && (cotizacionActual <= 1 || cotizacionLoading)) {
            toast.error('Debe haber una cotización USD válida registrada para esta fecha.')
            return
        }

        try {
            await gastosAPI.create({
                concepto,
                monto: montoNum,
                fecha: fecha,
                moneda, // Se envía la moneda
                // NO SE ENVÍA cotizacion, el backend la busca y calcula monto_ars
            })
            toast.success('Gasto registrado con éxito!')
            setConcepto('')
            setMonto('')
            setMoneda('ARS')
            setCotizacionActual(1)
            onSave() // Recarga la lista
        } catch (error) {
            // Manejo de errores específicos del backend (ej: No se encontró cotización)
            const msg = (error as any).response?.data?.error || 'Error al registrar el gasto.'
            toast.error(msg)
        }
    }

    // Cálculo del monto ARS para previsualización
    const montoFinalARS = parseFloat(monto) * cotizacionActual
    const esMontoValido = parseFloat(monto) > 0

    return (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4 bg-gray-50">
            <h3 className="text-xl font-bold flex items-center"><PlusCircle className="mr-2 h-5 w-5" /> Registrar Nuevo Gasto</h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Concepto</label>
                    <input type="text" value={concepto} onChange={e => setConcepto(e.target.value)} className="input-field" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Moneda</label>
                    <select
                        value={moneda}
                        onChange={e => setMoneda(e.target.value as 'ARS' | 'USD')}
                        className="input-field">
                        <option value="ARS">ARS ($)</option>
                        <option value="USD">USD (u$d)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Monto</label>
                    <input
                        type="number"
                        value={monto}
                        onChange={e => setMonto(e.target.value)}
                        className="input-field"
                        step="0.01"
                        required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha</label>
                    <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="input-field" required />
                </div>
            </div>

            {/* Panel de Cotización y Previsualización */}
            {moneda === 'USD' && (
                <div className="md:w-1/3 p-3 border border-red-300 rounded-lg bg-red-50">
                    <label className="block text-sm font-medium text-red-700">Cotización USD (Valor ARS)</label>
                    {cotizacionLoading ? (
                        <p className="text-sm text-gray-500">Consultando cotización...</p>
                    ) : cotizacionActual > 1 ? (
                        <>
                            <p className="text-lg font-bold text-red-900">{cotizacionActual.toFixed(2)}</p>
                            {esMontoValido && (
                                <p className="text-sm text-gray-600 mt-1">
                                    Gasto final estimado en ARS: **${ montoFinalARS.toLocaleString('es-AR', { minimumFractionDigits: 2 }) }**
                                </p>
                            )}
                        </>
                    ) : (
                        <p className="text-sm font-semibold text-red-600">
                            🚨 No hay cotización USD disponible para la fecha seleccionada. El gasto NO podrá guardarse.
                        </p>
                    )}
                </div>
            )}

            <button type="submit" className="btn-primary flex items-center bg-red-600 hover:bg-red-700" disabled={moneda === 'USD' && cotizacionActual <= 1}>
                <DollarSign className="h-4 w-4 mr-2" />
                Guardar Gasto
            </button>
        </form>
    )
}

// --- Gastos Component (MODIFICADO) ---
const Gastos = () => {
    const [gastos, setGastos] = useState<Gasto[]>([])
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        setLoading(true)
        try {
            const response = await gastosAPI.getAll()
            setGastos(response.data)
        } catch (error) {
            toast.error('Error al cargar la lista de gastos')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Está seguro de eliminar este gasto? Esto no revertirá el cálculo de reportes.')) return
        try {
            await gastosAPI.delete(id)
            toast.success('Gasto eliminado.')
            fetchData()
        } catch (error) {
            toast.error('Error al eliminar el gasto.')
        }
    }

    // El total ahora suma 'monto_ars', que es el valor normalizado.
    const totalGastosARS = gastos.reduce((sum, g) => sum + Number(g.monto_ars || 0), 0);

    // Helper para formatear montos en su moneda original
    const formatCurrency = (amount: number, currency: 'ARS' | 'USD') => {
        if (currency === 'USD') {
            return `u$d ${Number(amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
        }
        return `$${Number(amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <DollarSign className="h-7 w-7 mr-2 text-red-600" />
                    Gestión de Gastos
                </h1>
                <p className="text-gray-600">Registro y control de egresos operativos del negocio.</p>
            </div>

            <GastoForm onSave={fetchData} />

            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <FileText className="h-5 w-5 mr-2" /> Listado de Gastos
                    </h3>
                    <div className="bg-red-100 p-2 rounded-lg">
                        <span className="text-sm font-medium text-red-700">Total Normalizado (ARS): </span>
                        <span className="text-lg font-bold text-red-900">${totalGastosARS.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
                {loading ? (
                    <div className="text-center py-4">Cargando...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto Original</th> {/* NUEVO */}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto ARS</th> {/* NUEVO */}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {gastos.map(g => (
                                <tr key={g.id} className="hover:bg-red-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{g.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{g.concepto}</td>

                                    {/* Monto Original */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <span className={g.moneda === 'USD' ? 'text-blue-600' : 'text-gray-800'}>
                                            {formatCurrency(Number(g.monto), g.moneda)}
                                        </span>
                                    </td>

                                    {/* Monto ARS (Normalizado) */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                                        ${Number(g.monto_ars).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(g.fecha).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => handleDelete(g.id!)} className="text-red-600 hover:text-red-900 ml-4">
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Gastos