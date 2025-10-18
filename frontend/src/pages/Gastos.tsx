import { useEffect, useState } from 'react'
import { PlusCircle, DollarSign, Trash2, Calendar, FileText, TrendingUp, DollarSign as DollarIcon } from 'lucide-react' // Renombramos DollarSign para evitar conflictos
import { Gasto, gastosAPI, cotizacionesAPI } from '../services/api'
import toast from 'react-hot-toast'

// Helper para asegurar que el monto es un número, usando 0 si es nulo o string no válido
const safeNumber = (value: number | string | undefined): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
}

// Helper para formatear (usado en la tabla)
const formatCurrency = (amount: number | string | undefined, currency: 'ARS' | 'USD') => {
    const numAmount = safeNumber(amount);

    if (currency === 'USD') {
        return `u$d ${numAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
    }
    return `$${numAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
};


// --- CotizacionForm Component (Gestión de la cotización diaria) ---
const CotizacionForm = ({ onCotizacionSaved }: { onCotizacionSaved: () => void }) => {
    const [fecha, setFecha] = useState(new Date().toLocaleDateString('en-CA')) // yyyy-mm-dd
    const [valor, setValor] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await cotizacionesAPI.create({
                fecha,
                valor: safeNumber(valor),
            })
            toast.success(`Cotización de ${new Date(fecha).toLocaleDateString()} guardada.`)
            setValor('')
            onCotizacionSaved()
        } catch (error) {
            const msg = (error as any).response?.data?.error || 'Error al guardar la cotización. Revise si ya existe un registro para esa fecha.'
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="card p-4 bg-orange-50 border border-orange-300">
            <h4 className="text-sm font-semibold text-orange-800 flex items-center mb-2">
                <TrendingUp className="h-4 w-4 mr-2" />
                Cotización USD Diaria
            </h4>
            <form onSubmit={handleSubmit} className="flex gap-3 items-end">
                <div className="flex-1">
                    <label className="block text-xs font-medium text-orange-700 mb-1">Fecha</label>
                    <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="input-field py-1" required />
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-medium text-orange-700 mb-1">Valor ($ ARS)</label>
                    <input
                        type="number"
                        value={valor}
                        onChange={e => setValor(e.target.value)}
                        className="input-field py-1 border-orange-500"
                        step="0.01"
                        required />
                </div>
                <button
                    type="submit"
                    className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 transition"
                    disabled={loading || !valor}>
                    {loading ? 'Guardando...' : 'Guardar'}
                </button>
            </form>
        </div>
    )
}


// --- GastoForm Component (Registro de un nuevo gasto - CORRECCIÓN DE BUG) ---
const GastoForm = ({ onSave }: { onSave: () => void }) => {
    const [concepto, setConcepto] = useState('')
    const [monto, setMonto] = useState('')
    const [fecha, setFecha] = useState(new Date().toLocaleDateString('en-CA'))
    const [moneda, setMoneda] = useState<'ARS' | 'USD'>('ARS')
    const [cotizacionActual, setCotizacionActual] = useState(1)
    // 🎯 BUG FIX: Renombrado de 'loading' a 'cotizacionLoading' para evitar conflicto
    const [cotizacionLoading, setCotizacionLoading] = useState(false)

    // Efecto para buscar la cotización
    useEffect(() => {
        const fetchCotizacion = async () => {
            if (moneda === 'USD' && fecha) {
                setCotizacionLoading(true) // 🎯 CORREGIDO
                try {
                    const response = await cotizacionesAPI.getByDate(fecha)
                    const valor = safeNumber(response.data.valor)

                    if (valor < 1) {
                        toast.error(`No hay cotización USD registrada para la fecha ${new Date(fecha).toLocaleDateString()}.`)
                        setCotizacionActual(0)
                    } else {
                        setCotizacionActual(valor)
                    }
                } catch (error) {
                    setCotizacionActual(0)
                } finally {
                    setCotizacionLoading(false) // 🎯 CORREGIDO
                }
            } else {
                setCotizacionActual(1)
            }
        }
        fetchCotizacion()
    }, [fecha, moneda])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const montoNum = safeNumber(monto)

        if (moneda === 'USD' && (cotizacionActual < 1 || cotizacionLoading)) { // Usamos cotizacionLoading
            toast.error('Debe haber una cotización USD válida registrada para esta fecha.')
            return
        }

        try {
            await gastosAPI.create({
                concepto,
                monto: montoNum,
                fecha: fecha,
                moneda,
            })
            toast.success('Gasto registrado con éxito!')
            setConcepto('')
            setMonto('')
            setMoneda('ARS')
            setFecha(new Date().toLocaleDateString('en-CA'))
            onSave()
        } catch (error) {
            const msg = (error as any).response?.data?.error || 'Error al registrar el gasto.'
            toast.error(msg)
        }
    }

    const montoFinalARS = safeNumber(monto) * cotizacionActual
    const esMontoValido = safeNumber(monto) > 0

    return (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4 bg-gray-50">
            <h3 className="text-xl font-bold flex items-center"><PlusCircle className="mr-2 h-5 w-5" /> Registrar Nuevo Gasto</h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Concepto</label>
                    <input type="text" value={concepto} onChange={e => setConcepto(e.target.value)} className="input-field" required />
                </div>

                {/* --- CAMBIO DE CLASES DE COLOR: ARS Azul, USD Verde --- */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
                    <div className="flex border border-gray-300 rounded-lg overflow-hidden w-full">
                        {['ARS', 'USD'].map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setMoneda(m as 'ARS' | 'USD')}
                                className={`flex-1 py-2 text-sm font-medium transition-colors duration-200 
                                    ${moneda === m
                                    ? (m === 'ARS' ? 'bg-blue-600' : 'bg-green-600') + ' text-white shadow-md'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                {m} ({m === 'ARS' ? '$' : 'u$d'})
                            </button>
                        ))}
                    </div>
                </div>
                {/* -------------------------------------------------------- */}

                <div>
                    <label className="block text-sm font-medium text-gray-700">Monto ({moneda === 'ARS' ? '$' : 'u$d'})</label>
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
                <div className="p-3 border rounded-lg" style={{ borderColor: cotizacionActual >= 1 ? '#4CAF50' : '#F44336', backgroundColor: cotizacionActual >= 1 ? '#E8F5E9' : '#FFEBEE' }}>
                    <label className="block text-sm font-medium" style={{ color: cotizacionActual >= 1 ? '#388E3C' : '#D32F2F' }}>
                        Cotización USD aplicada:
                    </label>
                    {cotizacionLoading ? ( // Usamos cotizacionLoading aquí
                        <p className="text-sm text-gray-500">Consultando...</p>
                    ) : cotizacionActual >= 1 ? (
                        <>
                            <p className="text-lg font-bold" style={{ color: '#388E3C' }}>{safeNumber(cotizacionActual).toFixed(2)} ARS</p>
                            {esMontoValido && (
                                <p className="text-sm text-gray-600 mt-1">
                                    Gasto final estimado en ARS: **${ montoFinalARS.toLocaleString('es-AR', { minimumFractionDigits: 2 }) }**
                                </p>
                            )}
                        </>
                    ) : (
                        <p className="text-sm font-semibold text-red-600">
                            🚨 ¡Cotización no disponible! Debe cargarla en el formulario de arriba.
                        </p>
                    )}
                </div>
            )}


            <button
                type="submit"
                className="btn-primary flex items-center bg-red-600 hover:bg-red-700"
                disabled={moneda === 'USD' && cotizacionActual < 1}>
                <DollarIcon className="h-4 w-4 mr-2" />
                Guardar Gasto
            </button>
        </form>
    )
}

// --- Gastos Component (Listado principal) ---
const Gastos = () => {
    const [gastos, setGastos] = useState<Gasto[]>([])
    // Mantenemos este 'loading' para el listado general
    const [loading, setLoading] = useState(true)
    const [cotizacionKey, setCotizacionKey] = useState(0);

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
    }, [cotizacionKey])

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Está seguro de eliminar este gasto?')) return
        try {
            await gastosAPI.delete(id)
            toast.success('Gasto eliminado.')
            fetchData()
        } catch (error) {
            toast.error('Error al eliminar el gasto.')
        }
    }

    const totalGastosARS = gastos.reduce((sum, g) => sum + safeNumber(g.monto_ars), 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <DollarIcon className="h-7 w-7 mr-2 text-red-600" />
                        Gestión de Gastos
                    </h1>
                    <p className="text-gray-600">Registro y control de egresos operativos del negocio.</p>
                </div>
                <div className="w-96">
                    <CotizacionForm onCotizacionSaved={() => setCotizacionKey(prev => prev + 1)} />
                </div>
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
                {loading ? ( // Usamos el 'loading' del componente principal aquí
                    <div className="text-center py-4">Cargando...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto Original</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto ARS</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {gastos.map(g => (
                                <tr key={g.id} className="hover:bg-red-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{g.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{g.concepto}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <span className={g.moneda === 'USD' ? 'text-blue-600' : 'text-gray-800'}>
                                            {formatCurrency(g.monto, g.moneda)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                                        ${safeNumber(g.monto_ars).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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