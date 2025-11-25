import { useEffect, useState } from 'react'
import { PlusCircle, Trash2, Calendar, FileText, TrendingUp, DollarSign as DollarIcon, Tag, Pencil, Filter, X } from 'lucide-react'
import { Gasto, gastosAPI, cotizacionesAPI } from '../services/api'
import toast from 'react-hot-toast'

// --- Definición de Categorías ---
const CATEGORIAS = [
    { value: 'CAMIONETA', label: 'Camioneta (Ahorro)' },
    { value: 'COMBUSTIBLE', label: 'Combustible' },
    { value: 'GASTOS_VARIOS', label: 'Gastos Varios (Papelera, etc.)' },
    { value: 'SERVICIOS_IMPUESTOS', label: 'Servicios/Impuestos' },
    { value: 'OTROS', label: 'Otros' },
];

// --- Clases genéricas ---
const inputFieldClass = "w-full border border-gray-300 p-2.5 rounded-lg focus:ring-red-500 focus:border-red-500 transition duration-150 ease-in-out text-sm";
const cardClass = "bg-white shadow-lg rounded-xl p-4 sm:p-6 border border-gray-100";

// --- Helpers ---
const safeNumber = (value: number | string | undefined): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
}

const formatPrice = (value: number | string | undefined) => {
    if (value === null || value === undefined || value === '') return '$0';
    return '$' + Number(value).toLocaleString("es-AR", { maximumFractionDigits: 0 });
};

const formatCurrency = (amount: number | string | undefined, currency: 'ARS' | 'USD') => {
    const numAmount = safeNumber(amount);
    if (currency === 'USD') {
        return `u$d ${numAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
    }
    return formatPrice(numAmount);
};

const getCategoriaLabel = (value: string | undefined): string => {
    if (!value) return 'N/A';
    const cat = CATEGORIAS.find(c => c.value === value);
    return cat ? cat.label : value;
};

// --- Componente: CotizacionForm ---
const CotizacionForm = ({ onCotizacionSaved }: { onCotizacionSaved: () => void }) => {
    const [fecha, setFecha] = useState(new Date().toLocaleDateString('en-CA'))
    const [valor, setValor] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await cotizacionesAPI.create({ fecha, valor: safeNumber(valor) })
            toast.success(`Cotización guardada.`)
            setValor('')
            onCotizacionSaved()
        } catch (error) {
            toast.error('Error al guardar cotización.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-sm w-full">
            <h4 className="text-xs font-bold text-orange-800 flex items-center mb-3 uppercase tracking-wide">
                <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                Actualizar Dólar
            </h4>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="w-full sm:w-auto flex-1">
                    <label className="block text-[10px] font-bold text-orange-700 mb-1 uppercase">Fecha</label>
                    <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full text-xs border-orange-300 rounded p-1.5 focus:ring-orange-500" required />
                </div>
                <div className="w-full sm:w-auto flex-1">
                    <label className="block text-[10px] font-bold text-orange-700 mb-1 uppercase">Valor ($)</label>
                    <input
                        type="number"
                        value={valor}
                        onChange={e => setValor(e.target.value)}
                        className="w-full text-xs border-orange-300 rounded p-1.5 focus:ring-orange-500"
                        step="0.01"
                        placeholder="0.00"
                        required />
                </div>
                <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-1.5 bg-orange-500 text-white text-xs font-bold rounded hover:bg-orange-600 transition shadow-sm"
                    disabled={loading || !valor}>
                    {loading ? '...' : 'Guardar'}
                </button>
            </form>
        </div>
    )
}

// --- Componente: GastoForm ---
interface GastoFormProps {
    initialGasto?: Gasto;
    onSave: () => void;
    onCancel?: () => void;
}

const GastoForm: React.FC<GastoFormProps> = ({ initialGasto, onSave, onCancel }) => {
    const isEditing = !!initialGasto;
    const [concepto, setConcepto] = useState(initialGasto?.concepto || '')
    const [monto, setMonto] = useState(initialGasto?.monto.toString() || '')
    const defaultDate = initialGasto?.fecha ? new Date(initialGasto.fecha).toISOString().split('T')[0] : new Date().toLocaleDateString('en-CA');
    const [fecha, setFecha] = useState(defaultDate)
    const [moneda, setMoneda] = useState<'ARS' | 'USD'>(initialGasto?.moneda || 'ARS')
    const [categoria, setCategoria] = useState(initialGasto?.categoria || CATEGORIAS[0].value)
    const [cotizacionActual, setCotizacionActual] = useState(1)
    const [cotizacionLoading, setCotizacionLoading] = useState(false)

    useEffect(() => {
        const fetchCotizacion = async () => {
            if (moneda === 'USD' && fecha) {
                setCotizacionLoading(true)
                try {
                    const response = await cotizacionesAPI.getByDate(fecha)
                    const valor = safeNumber(response.data.valor)
                    setCotizacionActual(valor < 1 ? 0 : valor)
                    if (valor < 1) toast.error(`Sin cotización USD para el ${new Date(fecha).toLocaleDateString()}.`)
                } catch {
                    setCotizacionActual(0)
                } finally {
                    setCotizacionLoading(false)
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

        if (moneda === 'USD' && (cotizacionActual < 1 || cotizacionLoading)) {
            toast.error('Falta cotización USD válida para esta fecha.')
            return
        }
        if (!categoria) {
            toast.error('Seleccione una categoría.')
            return
        }

        const payload = { concepto, monto: montoNum, fecha, moneda, categoria }

        try {
            if (isEditing && initialGasto?.id) {
                await gastosAPI.update(initialGasto.id, payload)
                toast.success('Gasto actualizado!')
            } else {
                await gastosAPI.create(payload)
                toast.success('Gasto registrado!')
                setConcepto('')
                setMonto('')
                setMoneda('ARS')
                setCategoria(CATEGORIAS[0].value)
                setFecha(new Date().toLocaleDateString('en-CA'))
            }
            onSave()
        } catch (error) {
            toast.error(`Error al ${isEditing ? 'actualizar' : 'registrar'} el gasto.`)
        }
    }

    const montoFinalARS = safeNumber(monto) * cotizacionActual

    return (
        <form onSubmit={handleSubmit} className={cardClass}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center text-gray-800">
                    {isEditing ? (
                        <><Pencil className="mr-2 h-5 w-5 text-blue-600" /> Editar Gasto #{initialGasto?.id}</>
                    ) : (
                        <><PlusCircle className="mr-2 h-5 w-5 text-red-600" /> Registrar Gasto</>
                    )}
                </h3>
                {isEditing && (
                    <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
                    <select value={categoria} onChange={e => setCategoria(e.target.value)} className={inputFieldClass} required>
                        {CATEGORIAS.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                    </select>
                </div>

                <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Concepto</label>
                    <input type="text" value={concepto} onChange={e => setConcepto(e.target.value)} className={inputFieldClass} placeholder="Ej: Compra tornillos" required />
                </div>

                <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Moneda</label>
                    <div className="flex rounded-lg overflow-hidden border border-gray-300">
                        {['ARS', 'USD'].map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setMoneda(m as 'ARS' | 'USD')}
                                className={`flex-1 py-2 text-xs font-bold transition-colors ${moneda === m ? (m === 'ARS' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white') : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Monto ({moneda === 'ARS' ? '$' : 'u$d'})</label>
                    <input type="number" value={monto} onChange={e => setMonto(e.target.value)} className={inputFieldClass} step="0.01" required />
                </div>

                <div className="col-span-1 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Fecha del Gasto</label>
                        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inputFieldClass} required disabled={isEditing} />
                    </div>

                    {/* Preview Cotización */}
                    {moneda === 'USD' && (
                        <div className={`p-2 rounded text-xs border flex items-center justify-between ${cotizacionActual >= 1 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                            {cotizacionLoading ? <span>Consultando cotización...</span> : (
                                cotizacionActual >= 1 ?
                                    <span>1 USD = ${safeNumber(cotizacionActual).toFixed(2)} → <b>Total: {formatPrice(montoFinalARS)}</b></span> :
                                    <span>⚠️ Sin cotización registrada</span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className='flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100'>
                {isEditing && (
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 font-medium rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition">
                        Cancelar
                    </button>
                )}
                <button
                    type="submit"
                    className={`px-6 py-2 text-sm font-bold rounded-lg text-white shadow-md transition-transform active:scale-95 ${isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}
                    disabled={moneda === 'USD' && cotizacionActual < 1}>
                    {isEditing ? 'Actualizar Gasto' : 'Guardar Gasto'}
                </button>
            </div>
        </form>
    )
}


// --- Componente Principal: Gastos ---
const Gastos = () => {
    const [gastos, setGastos] = useState<Gasto[]>([])
    const [loading, setLoading] = useState(true)
    const [cotizacionKey, setCotizacionKey] = useState(0);
    const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const fetchData = async () => {
        setLoading(true)
        try {
            const response = await gastosAPI.getAll()
            setGastos(response.data)
        } catch (error) {
            toast.error('Error al cargar gastos')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [cotizacionKey])

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Eliminar este gasto?')) return
        try {
            await gastosAPI.delete(id)
            toast.success('Eliminado.')
            fetchData()
        } catch {
            toast.error('Error al eliminar.')
        }
    }

    const filteredGastos = gastos.filter(gasto => {
        const categoryMatch = selectedCategory === 'ALL' || gasto.categoria === selectedCategory;
        const gastoDate = new Date(gasto.fecha);
        let dateMatch = true;
        if (dateFrom) dateMatch = dateMatch && gastoDate >= new Date(dateFrom);
        if (dateTo) {
            const to = new Date(dateTo);
            to.setDate(to.getDate() + 1);
            dateMatch = dateMatch && gastoDate < to;
        }
        return categoryMatch && dateMatch;
    });

    const totalGastosARS = filteredGastos.reduce((sum, g) => sum + safeNumber(g.monto_ars), 0);

    return (
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

            {/* Header & Cotización */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <DollarIcon className="h-8 w-8 text-red-600 bg-red-100 p-1.5 rounded-lg" />
                        Gastos
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">Registro de egresos y costos operativos</p>
                </div>
                <div className="w-full lg:w-96">
                    <CotizacionForm onCotizacionSaved={() => setCotizacionKey(prev => prev + 1)} />
                </div>
            </div>

            {/* Formulario Principal (Solo se muestra si NO se está editando en modal, para evitar duplicados visuales) */}
            {!editingGasto && <GastoForm onSave={fetchData} />}

            {/* Modal de Edición */}
            {editingGasto && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className='w-full max-w-2xl'>
                        <GastoForm
                            initialGasto={editingGasto}
                            onSave={() => { setEditingGasto(null); fetchData(); }}
                            onCancel={() => setEditingGasto(null)}
                        />
                    </div>
                </div>
            )}

            {/* Sección de Listado y Filtros */}
            <div className={cardClass}>

                {/* Header de la lista y Filtros */}
                <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-2 text-gray-900 font-semibold border-b pb-2">
                        <Filter className="h-5 w-5 text-gray-500" />
                        <span>Filtros y Resumen</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                        {/* Categoría (4 columnas) */}
                        <div className="lg:col-span-4">
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Categoría</label>
                            <select
                                value={selectedCategory}
                                onChange={e => setSelectedCategory(e.target.value)}
                                className={inputFieldClass}
                            >
                                <option value="ALL">Todas las Categorías</option>
                                {CATEGORIAS.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                            </select>
                        </div>

                        {/* Fechas (5 columnas) */}
                        <div className="lg:col-span-5 grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Desde</label>
                                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={inputFieldClass} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Hasta</label>
                                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={inputFieldClass} />
                            </div>
                        </div>

                        {/* Total (3 columnas) */}
                        <div className="lg:col-span-3">
                            <div className="bg-red-50 border border-red-100 p-2.5 rounded-lg flex flex-col justify-center items-center h-full">
                                <span className="text-xs text-red-600 font-bold uppercase tracking-wider">Total Filtrado</span>
                                <span className="text-xl font-bold text-red-900">{formatPrice(totalGastosARS)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div></div>
                ) : (
                    <>
                        {/* === VISTA DE TABLA (Desktop) === */}
                        <div className="hidden lg:block overflow-hidden rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Detalle</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Categoría</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Monto Orig.</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total (ARS)</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {filteredGastos.map(g => (
                                    <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{g.concepto}</div>
                                            <div className="text-xs text-gray-500 flex items-center mt-1">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                {new Date(g.fecha).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {g.categoria ? getCategoriaLabel(g.categoria) : 'Varios'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm">
                                            <span className={`font-medium ${g.moneda === 'USD' ? 'text-green-600' : 'text-gray-500'}`}>
                                                {formatCurrency(g.monto, g.moneda)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                                                {formatPrice(g.monto_ars)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => setEditingGasto(g)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition">
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDelete(g.id!)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {/* === VISTA DE CARDS (Mobile / Tablet) === */}
                        <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredGastos.map(g => (
                                <div key={g.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-gray-900 line-clamp-2">{g.concepto}</h3>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${g.moneda === 'USD' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {g.moneda}
                                            </span>
                                        </div>

                                        <div className="flex items-center text-xs text-gray-500 mb-3">
                                            <Calendar className="h-3.5 w-3.5 mr-1" />
                                            {new Date(g.fecha).toLocaleDateString()}
                                            <span className="mx-2">•</span>
                                            <Tag className="h-3.5 w-3.5 mr-1" />
                                            {g.categoria ? getCategoriaLabel(g.categoria) : 'Varios'}
                                        </div>

                                        <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg mb-3">
                                            <span className="text-xs text-gray-500">Monto Orig.</span>
                                            <span className="text-sm font-medium text-gray-800">{formatCurrency(g.monto, g.moneda)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                        <div>
                                            <span className="block text-[10px] uppercase text-gray-500 font-bold">Total Final</span>
                                            <span className="text-lg font-bold text-red-600">{formatPrice(g.monto_ars)}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => setEditingGasto(g)} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(g.id!)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredGastos.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                No se encontraron gastos con estos filtros.
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default Gastos