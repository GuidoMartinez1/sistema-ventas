// src/pages/Gastos.tsx
import { useEffect, useState } from 'react'
import { PlusCircle, Trash2, Calendar, FileText, TrendingUp, DollarSign as DollarIcon, Tag, Pencil} from 'lucide-react'
import { Gasto, gastosAPI, cotizacionesAPI } from '../services/api'
import toast from 'react-hot-toast'

// --- Definición de Categorías ---
const CATEGORIAS = [
    { value: 'CAMIONETA', label: 'Camioneta (Ahorro)' },
    { value: 'COMBUSTIBLE', label: 'Combustible' },
    { value: 'GASTOS_VARIOS', label: 'Gastos Varios (Papelera, etc.)' },
    { value: 'SERVICIOS_IMPUESTOS', label: 'Servicios/Impuestos (Contadora, Monotributo)' },
    { value: 'OTROS', label: 'Otros' },
];

// --- Clases genéricas para responsividad y consistencia ---
const inputFieldClass = "w-full border border-gray-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-sm";
const cardClass = "bg-white shadow-lg rounded-xl p-4 md:p-6";


// Helper para asegurar que el monto es un número, usando 0 si es nulo o string no válido
const safeNumber = (value: number | string | undefined): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
}

const formatPrice = (value: number | string | undefined) => {
    if (value === null || value === undefined || value === '') return '$0';
    return '$' + Number(value).toLocaleString("es-AR", { maximumFractionDigits: 0 });
};

// Helper para formatear (usado en la tabla)
const formatCurrency = (amount: number | string | undefined, currency: 'ARS' | 'USD') => {
    const numAmount = safeNumber(amount);

    if (currency === 'USD') {
        // Mantenemos decimales para USD
        return `u$d ${numAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
    }
    return formatPrice(numAmount);
};

// Helper para obtener el nombre de la categoría
const getCategoriaLabel = (value: string | undefined): string => {
    if (!value) return 'N/A';
    const cat = CATEGORIAS.find(c => c.value === value);
    return cat ? cat.label : value;
};


// --- CotizacionForm Component (Gestión de la cotización diaria) ---
const CotizacionForm = ({ onCotizacionSaved }: { onCotizacionSaved: () => void }) => {
    const [fecha, setFecha] = useState(new Date().toLocaleDateString('en-CA'))
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
        <div className="p-3 bg-orange-50 border border-orange-300 rounded-lg">
            <h4 className="text-sm font-semibold text-orange-800 flex items-center mb-2">
                <TrendingUp className="h-4 w-4 mr-2" />
                Cotización USD Diaria
            </h4>
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-2 md:gap-3 items-end">
                <div className="flex-1 w-full">
                    <label className="block text-xs font-medium text-orange-700 mb-1">Fecha</label>
                    <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={`${inputFieldClass} py-1`} required />
                </div>
                <div className="flex-1 w-full">
                    <label className="block text-xs font-medium text-orange-700 mb-1">Valor ($ ARS)</label>
                    <input
                        type="number"
                        value={valor}
                        onChange={e => setValor(e.target.value)}
                        className={`${inputFieldClass} py-1 border-orange-500`}
                        step="0.01"
                        required />
                </div>
                <button
                    type="submit"
                    className="w-full md:w-auto px-3 py-1.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition h-fit"
                    disabled={loading || !valor}>
                    {loading ? 'Guardando...' : 'Guardar'}
                </button>
            </form>
        </div>
    )
}


// --- Gasto Form Genérico (Usado para crear y editar) ---
interface GastoFormProps {
    initialGasto?: Gasto; // Opcional para editar
    onSave: () => void;
    onCancel?: () => void; // Solo para edición/modal
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

    // Efecto para buscar la cotización
    useEffect(() => {
        const fetchCotizacion = async () => {
            if (moneda === 'USD' && fecha) {
                setCotizacionLoading(true)
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
            toast.error('Debe haber una cotización USD válida registrada para esta fecha.')
            return
        }

        if (!categoria) {
            toast.error('Debe seleccionar una categoría para el gasto.')
            return
        }

        const payload = {
            concepto,
            monto: montoNum,
            fecha: fecha,
            moneda,
            categoria,
        }

        try {
            if (isEditing && initialGasto?.id) {
                await gastosAPI.update(initialGasto.id, payload)
                toast.success('Gasto actualizado con éxito!')
            } else {
                await gastosAPI.create(payload)
                toast.success('Gasto registrado con éxito!')

                // Resetear solo al crear
                setConcepto('')
                setMonto('')
                setMoneda('ARS')
                setCategoria(CATEGORIAS[0].value)
                setFecha(new Date().toLocaleDateString('en-CA'))
            }
            onSave()
        } catch (error) {
            const msg = (error as any).response?.data?.error || `Error al ${isEditing ? 'actualizar' : 'registrar'} el gasto.`
            toast.error(msg)
        }
    }

    const montoFinalARS = safeNumber(monto) * cotizacionActual
    const esMontoValido = safeNumber(monto) > 0

    return (
        <form onSubmit={handleSubmit} className={`${cardClass} space-y-4 bg-white border border-gray-200 w-full`}>
            <h3 className="text-xl font-bold flex items-center text-gray-800">
                {isEditing ? (
                    <><Pencil className="mr-2 h-5 w-5 text-orange-600" /> Editar Gasto #{initialGasto?.id}</>
                ) : (
                    <><PlusCircle className="mr-2 h-5 w-5 text-red-600" /> Registrar Nuevo Gasto</>
                )}
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                {/* CAMPO CATEGORIA */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Categoría</label>
                    <select value={categoria} onChange={e => setCategoria(e.target.value)} className={inputFieldClass} required>
                        {CATEGORIAS.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                    </select>
                </div>

                {/* Concepto */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Concepto</label>
                    <input type="text" value={concepto} onChange={e => setConcepto(e.target.value)} className={inputFieldClass} required />
                </div>

                {/* Moneda */}
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

                {/* Monto */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Monto ({moneda === 'ARS' ? '$' : 'u$d'})</label>
                    <input
                        type="number"
                        value={monto}
                        onChange={e => setMonto(e.target.value)}
                        className={inputFieldClass}
                        step="0.01"
                        required />
                </div>

                {/* Fecha */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha</label>
                    <input
                        type="date"
                        value={fecha}
                        onChange={e => setFecha(e.target.value)}
                        className={inputFieldClass}
                        required
                        disabled={isEditing}
                    />
                </div>
            </div>

            {/* Panel de Cotización y Previsualización */}
            {moneda === 'USD' && (
                <div className="p-3 border rounded-lg" style={{ borderColor: cotizacionActual >= 1 ? '#4CAF50' : '#F44336', backgroundColor: cotizacionActual >= 1 ? '#E8F5E9' : '#FFEBEE' }}>
                    <label className="block text-sm font-medium" style={{ color: cotizacionActual >= 1 ? '#388E3C' : '#D32F2F' }}>
                        Cotización USD aplicada:
                    </label>
                    {cotizacionLoading ? (
                        <p className="text-sm text-gray-500">Consultando...</p>
                    ) : cotizacionActual >= 1 ? (
                        <>
                            <p className="text-lg font-bold" style={{ color: '#388E3C' }}>{safeNumber(cotizacionActual).toFixed(2)} ARS</p>
                            {esMontoValido && (
                                <p className="text-sm text-gray-600 mt-1">
                                    Gasto final estimado en ARS: **{formatPrice(montoFinalARS)}**
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

            {/* Botones de acción */}
            <div className='flex justify-end space-x-2'>
                {isEditing && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-orange-600 font-medium rounded-lg bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center">
                        Cancelar
                    </button>
                )}
                <button
                    type="submit"
                    className={`px-4 py-2 font-medium rounded-lg transition flex items-center justify-center ${isEditing ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                    disabled={moneda === 'USD' && cotizacionActual < 1}>
                    {isEditing ? (
                        <><Pencil className="h-4 w-4 mr-2" /> Actualizar Gasto</>
                    ) : (
                        <><DollarIcon className="h-4 w-4 mr-2" /> Guardar Gasto</>
                    )}
                </button>
            </div>
        </form>
    )
}


// --- Gastos Component (Listado principal) ---
const Gastos = () => {
    const [gastos, setGastos] = useState<Gasto[]>([])
    const [loading, setLoading] = useState(true)
    const [cotizacionKey, setCotizacionKey] = useState(0);
    const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    // 🆕 ESTADOS PARA EL FILTRO DE FECHAS
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');


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

    const handleEdit = (gasto: Gasto) => {
        setEditingGasto(gasto);
    };

    // 🆕 Lógica de filtrado con Fechas
    const filteredGastos = gastos.filter(gasto => {
        // 1. Filtrar por Categoría
        const categoryMatch = selectedCategory === 'ALL' || gasto.categoria === selectedCategory;

        // 2. Filtrar por Rango de Fechas
        const gastoDate = new Date(gasto.fecha);
        let dateMatch = true;

        if (dateFrom) {
            const from = new Date(dateFrom);
            dateMatch = dateMatch && gastoDate >= from;
        }

        if (dateTo) {
            const to = new Date(dateTo);
            // Sumamos un día a 'dateTo' para incluir los gastos de ese mismo día
            to.setDate(to.getDate() + 1);
            dateMatch = dateMatch && gastoDate < to;
        }

        return categoryMatch && dateMatch;
    });

    const totalGastosARS = filteredGastos.reduce((sum, g) => sum + safeNumber(g.monto_ars), 0);

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">

            {/* RESPONSIVE: Apilar en móvil, dos columnas en escritorio */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                {/* Título y descripción (Orden 2 en móvil) */}
                <div className="order-2 md:order-1 flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
                        <DollarIcon className="h-6 w-6 md:h-7 md:w-7 mr-2 text-red-600" />
                        Gestión de Gastos
                    </h1>
                    <p className="text-gray-600 text-sm md:text-base">Registro y control de egresos operativos del negocio.</p>
                </div>
                {/* Formulario de Cotización (Orden 1 en móvil) */}
                <div className="w-full md:w-96 order-1 md:order-2">
                    <CotizacionForm onCotizacionSaved={() => setCotizacionKey(prev => prev + 1)} />
                </div>
            </div>

            {/* Formulario de CREACIÓN/EDICIÓN */}
            {!editingGasto && <GastoForm onSave={fetchData} />}

            {editingGasto && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className='w-full max-w-lg'>
                        <GastoForm
                            initialGasto={editingGasto}
                            onSave={() => { setEditingGasto(null); fetchData(); }}
                            onCancel={() => setEditingGasto(null)}
                        />
                    </div>
                </div>
            )}

            <div className={cardClass}>
                <div className="flex flex-col space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <FileText className="h-5 w-5 mr-2" /> Listado de Gastos
                    </h3>

                    {/* 🆕 Controles de Filtrado (Categoría y Fechas) */}
                    <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">

                        {/* Selector de Categoría */}
                        <select
                            value={selectedCategory}
                            onChange={e => setSelectedCategory(e.target.value)}
                            className="p-2 border border-gray-300 rounded-lg text-sm bg-white hover:border-orange-500 transition duration-150 flex-1 min-w-[200px]"
                        >
                            <option value="ALL">Todas las Categorías</option>
                            {CATEGORIAS.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>

                        {/* Filtros de Fecha */}
                        <div className='flex gap-2 flex-1 items-center'>
                            <label className='text-sm text-gray-600 font-medium whitespace-nowrap'>Desde:</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                                className={`${inputFieldClass} py-2 flex-1`}
                            />
                            <label className='text-sm text-gray-600 font-medium whitespace-nowrap'>Hasta:</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                                className={`${inputFieldClass} py-2 flex-1`}
                            />
                        </div>

                        {/* Tarjeta de Total Normalizado (Total Filtrado) */}
                        <div className="bg-red-100 p-2 rounded-lg flex items-center justify-between min-w-48 lg:min-w-64">
                            <span className="text-sm font-medium text-red-700 whitespace-nowrap">Total Filtrado (ARS): </span>
                            <span className="text-lg font-bold text-red-900">{formatPrice(totalGastosARS)}</span>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-4">Cargando...</div>
                ) : (
                    <div>
                        {/* 1. VISTA DE TABLA para Escritorio/Tablet (>= md) */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-5 text-center text-xs font-medium text-gray-500 uppercase">ID</th>
                                    <th className="px-6 py-5 text-center text-xs font-medium text-gray-500 uppercase">Categoría</th>
                                    <th className="px-6 py-5 text-center text-xs font-medium text-gray-500 uppercase">Concepto</th>
                                    <th className="px-6 py-5 text-center text-xs font-medium text-gray-500 uppercase">Monto Original</th>
                                    <th className="px-6 py-5 text-center text-xs font-medium text-gray-500 uppercase">Monto ARS</th>
                                    <th className="px-6 py-5 text-center text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                    <th className="px-6 py-5 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {filteredGastos.map(g => (
                                    <tr key={g.id} className="hover:bg-red-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{g.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium flex items-center">
                                            <Tag className='h-4 w-4 mr-1 text-red-400' /> {g.categoria ? getCategoriaLabel(g.categoria) : 'Sin Categoría'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{g.concepto}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                            <span className={g.moneda === 'USD' ? 'text-blue-600' : 'text-gray-800'}>
                                                {formatCurrency(g.monto, g.moneda)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600 text-center">
                                            {formatPrice(g.monto_ars)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{new Date(g.fecha).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center space-x-2 justify-center">
                                            <button onClick={() => handleEdit(g)} className="text-blue-600 hover:text-blue-800">
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(g.id!)} className="text-red-600 hover:text-red-900">
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {/* 2. VISTA DE TARJETAS (Cards) para Móvil (< md) */}
                        <div className="md:hidden space-y-3">
                            {filteredGastos.map(g => (
                                <div key={g.id} className="p-4 border border-gray-200 rounded-lg shadow-sm hover:bg-red-50">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-sm font-bold text-gray-900 truncate">
                                            #{g.id} - {g.concepto}
                                        </p>
                                        <div className="flex space-x-2">
                                            <button onClick={() => handleEdit(g)} className="text-blue-600 hover:text-blue-800">
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(g.id!)} className="text-red-600 hover:text-red-900">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mb-1 border-b border-red-100 pb-1">
                                        <span className="text-xs font-medium text-gray-500 flex items-center"><Tag className="h-3 w-3 mr-1" /> Categoría:</span>
                                        <span className="text-sm font-medium text-gray-700">{g.categoria ? getCategoriaLabel(g.categoria) : 'Sin Categoría'}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-medium text-gray-500 flex items-center"><Calendar className="h-3 w-3 mr-1" /> Fecha:</span>
                                        <span className="text-sm text-gray-700">{new Date(g.fecha).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-medium text-gray-500">Monto Original:</span>
                                        <span className={`text-sm font-medium ${g.moneda === 'USD' ? 'text-blue-600' : 'text-gray-800'}`}>
                                            {formatCurrency(g.monto, g.moneda)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-red-200 mt-2">
                                        <span className="text-sm font-bold text-red-700">Monto ARS (Normalizado):</span>
                                        <span className="text-lg font-bold text-red-900">
                                            {formatPrice(g.monto_ars)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Gastos