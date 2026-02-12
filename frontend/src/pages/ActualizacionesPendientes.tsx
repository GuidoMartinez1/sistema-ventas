import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Check, X, ArrowRight, DollarSign, Calendar, Building, Percent } from 'lucide-react'
import { actualizacionesAPI, ActualizacionPrecio } from '../services/api'
import toast from 'react-hot-toast'

// Utilidades
const formatPrice = (value: number | string | undefined) => {
    if (value === null || value === undefined || value === '') return '$0';
    return '$' + Number(value).toLocaleString("es-AR", { maximumFractionDigits: 0 });
};

const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

const ActualizacionesPendientes = () => {
    const [pendientes, setPendientes] = useState<ActualizacionPrecio[]>([])
    const [loading, setLoading] = useState(true)

    // Estado para el Modal de Resolución
    const [selectedItem, setSelectedItem] = useState<ActualizacionPrecio | null>(null)
    const [nuevoPrecioVenta, setNuevoPrecioVenta] = useState<string>('')
    const [margenProyectado, setMargenProyectado] = useState<number>(0)

    // NUEVO: Estado para el input de porcentaje manual
    const [porcentajeManual, setPorcentajeManual] = useState<string>('30')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const response = await actualizacionesAPI.getAll()
            setPendientes(response.data)
        } catch (error) {
            console.error(error)
            toast.error('Error al cargar datos')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenResolver = (item: ActualizacionPrecio) => {
        setSelectedItem(item)

        // Calcular precio sugerido manteniendo el margen anterior (Sugerencia A)
        const margenAnterior = ((item.precio_venta_actual - item.costo_anterior) / item.costo_anterior);
        const sugerido = item.costo_nuevo * (1 + margenAnterior);

        setNuevoPrecioVenta(Math.ceil(sugerido).toString())
        calcularMargen(Math.ceil(sugerido), item.costo_nuevo)

        // Seteamos el porcentaje manual con el margen que tenía antes para que sea coherente
        setPorcentajeManual((margenAnterior * 100).toFixed(0))
    }

    const calcularMargen = (precioVenta: number, costo: number) => {
        if (!costo || costo === 0) return 0;
        const margen = ((precioVenta - costo) / costo) * 100;
        setMargenProyectado(margen);
    }

    // NUEVO: Función para calcular según el porcentaje ingresado
    const aplicarPorcentajeManual = () => {
        if (!selectedItem) return;
        const costo = selectedItem.costo_nuevo;
        const pct = parseFloat(porcentajeManual) || 0;
        const nuevoPrecio = costo * (1 + pct / 100);

        const precioRedondeado = Math.ceil(nuevoPrecio).toString();
        setNuevoPrecioVenta(precioRedondeado);
        calcularMargen(parseFloat(precioRedondeado), costo);
        toast.success(`Precio calculado al ${pct}%`);
    }

    const handlePriceChange = (val: string) => {
        setNuevoPrecioVenta(val)
        if (selectedItem) {
            calcularMargen(parseFloat(val) || 0, selectedItem.costo_nuevo)
        }
    }

    const handleConfirmar = async () => {
        if (!selectedItem) return;
        try {
            await actualizacionesAPI.resolve(selectedItem.id!, parseFloat(nuevoPrecioVenta))
            toast.success(`Precio de ${selectedItem.producto_nombre} actualizado!`)
            setPendientes(prev => prev.filter(p => p.id !== selectedItem.id))
            setSelectedItem(null)
        } catch (error) {
            toast.error("Error al actualizar precio")
        }
    }

    const handleDescartar = async (id: number) => {
        if(!confirm("¿Descartar esta alerta? El precio de venta no cambiará.")) return;
        try {
            await actualizacionesAPI.delete(id)
            setPendientes(prev => prev.filter(p => p.id !== id))
            toast.success("Alerta descartada")
        } catch (error) {
            toast.error("Error")
        }
    }

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
            {/* ... Encabezado y lista de productos (sin cambios) ... */}
            <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-full">
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Actualizaciones de Precios</h1>
                    <p className="text-gray-600">Revisión de cambios en costos detectados en compras.</p>
                </div>
            </div>

            {pendientes.length === 0 && !loading && (
                <div className="bg-green-50 p-8 rounded-xl text-center border border-green-200">
                    <Check className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-green-800">¡Todo al día!</h3>
                    <p className="text-green-600">No tienes cambios de costos pendientes de revisar.</p>
                </div>
            )}

            <div className="grid gap-4">
                {pendientes.filter(item => item.costo_nuevo !== item.costo_anterior).map((item) => {
                    const diferencia = item.costo_nuevo - item.costo_anterior;
                    const esAumento = diferencia > 0;
                    const esRebaja = diferencia < 0;
                    const porcentajeCambio = Math.abs((diferencia / item.costo_anterior) * 100).toFixed(1);
                    const borderClase = esAumento ? 'border-orange-500' : 'border-green-500';
                    const badgeClase = esAumento ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
                    const IconoCambio = esAumento ? TrendingUp : TrendingDown;

                    return (
                        <div key={item.id} className={`bg-white border-l-4 ${borderClase} shadow-md rounded-r-xl p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fadeIn`}>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <h3 className="text-lg font-bold text-gray-900">{item.producto_nombre}</h3>
                                    <span className={`${badgeClase} text-xs font-bold px-2 py-0.5 rounded flex items-center whitespace-nowrap`}>
                                        <IconoCambio className="h-3 w-3 mr-1"/>
                                        {esAumento ? '+' : '-'}{porcentajeCambio}% Costo
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <span>{formatDate(item.fecha_detectado)}</span>
                                    </div>
                                    {item.proveedor_nombre && (
                                        <div className="flex items-center gap-1">
                                            <Building className="h-4 w-4 text-gray-400" />
                                            <span className="font-medium text-gray-700">{item.proveedor_nombre}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Costo Ant.</p>
                                    <p className="text-gray-600 font-medium line-through">{formatPrice(item.costo_anterior)}</p>
                                </div>
                                <ArrowRight className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className={`text-xs ${esAumento ? 'text-orange-600' : 'text-green-600'} uppercase font-bold`}>Nuevo Costo</p>
                                    <p className="text-gray-900 font-bold text-lg">{formatPrice(item.costo_nuevo)}</p>
                                </div>
                            </div>

                            <div className="text-right px-4">
                                <p className="text-xs text-gray-500 uppercase font-bold">Venta Actual</p>
                                <p className="text-gray-900 font-bold text-xl">{formatPrice(item.precio_venta_actual)}</p>
                                <p className={`text-xs font-medium whitespace-nowrap ${esAumento ? 'text-red-500' : 'text-green-600'}`}>
                                    Margen hoy: {(((item.precio_venta_actual - item.costo_nuevo)/item.costo_nuevo)*100).toFixed(1)}%
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 w-full md:w-auto">
                                <button
                                    onClick={() => handleOpenResolver(item)}
                                    className={`btn-primary ${esAumento ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'} flex items-center justify-center gap-2 whitespace-nowrap`}
                                >
                                    <DollarSign className="h-4 w-4"/> {esAumento ? 'Actualizar Precio' : 'Revisar Precio'}
                                </button>
                                <button onClick={() => handleDescartar(item.id!)} className="text-gray-400 hover:text-gray-600 text-sm underline">
                                    Ignorar alerta
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* MODAL CON NUEVA FUNCIONALIDAD */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4 border-b pb-3">
                            <h3 className="text-xl font-bold text-gray-900">Actualizar Precio de Venta</h3>
                            <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-6 w-6"/>
                            </button>
                        </div>

                        <div className="space-y-5">
                            {/* Sugerencia Automática (La que ya tenías) */}
                            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                                <p className="text-xs text-blue-700 font-bold uppercase mb-1">Sugerencia para mantener margen</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-700 font-medium">Precio recomendado:</span>
                                    <button
                                        onClick={() => {
                                            const margenAnterior = ((selectedItem.precio_venta_actual - selectedItem.costo_anterior) / selectedItem.costo_anterior);
                                            const sugerido = Math.ceil(selectedItem.costo_nuevo * (1 + margenAnterior));
                                            setNuevoPrecioVenta(sugerido.toString());
                                            calcularMargen(sugerido, selectedItem.costo_nuevo);
                                        }}
                                        className="text-lg font-bold text-blue-800 hover:underline"
                                    >
                                        {formatPrice(Math.ceil(selectedItem.costo_nuevo * (1 + ((selectedItem.precio_venta_actual - selectedItem.costo_anterior)/selectedItem.costo_anterior))))}
                                    </button>
                                </div>
                            </div>

                            {/* NUEVO: Calculadora por Porcentaje (Estilo Productos.tsx) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Calcular por % de Ganancia</label>
                                <div className="flex">
                                    <div className="relative flex-1">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Percent className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="number"
                                            value={porcentajeManual}
                                            onChange={(e) => setPorcentajeManual(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-l-lg focus:ring-orange-500 focus:border-orange-500 text-sm"
                                            placeholder="Ej: 35"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={aplicarPorcentajeManual}
                                        className="px-4 py-2 bg-orange-500 text-white rounded-r-lg hover:bg-orange-600 transition-colors text-sm font-bold"
                                    >
                                        Calcular
                                    </button>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Input de Precio Final */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-center italic">Precio Final a Aplicar</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 left-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 font-bold">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={nuevoPrecioVenta}
                                        onChange={(e) => handlePriceChange(e.target.value)}
                                        className="w-full pl-8 pr-3 py-3 border-2 border-orange-200 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-2xl font-black text-center text-gray-900"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-dashed border-gray-300">
                                <span className="text-sm text-gray-600 font-medium">Margen Proyectado:</span>
                                <span className={`text-xl font-bold ${margenProyectado < 20 ? 'text-red-600' : 'text-green-600'}`}>
                                    {margenProyectado.toFixed(1)}%
                                </span>
                            </div>

                            <button
                                onClick={handleConfirmar}
                                className="w-full btn-primary bg-green-600 hover:bg-green-700 py-4 text-xl mt-2 shadow-lg flex items-center justify-center gap-2"
                            >
                                <Check className="h-6 w-6" /> Confirmar Cambio
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ActualizacionesPendientes