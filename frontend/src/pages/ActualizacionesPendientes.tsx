import { useEffect, useState } from 'react'
import { TrendingUp, Check, X, ArrowRight, DollarSign, Calendar, Building } from 'lucide-react' // <--- Agregue iconos
import { actualizacionesAPI, ActualizacionPrecio } from '../services/api'
import toast from 'react-hot-toast'

// Utilidades
const formatPrice = (value: number | string | undefined) => {
    if (value === null || value === undefined || value === '') return '$0';

    // { maximumFractionDigits: 0 } hace que no muestre comas ni centavos
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

        // Calcular precio sugerido manteniendo el margen anterior
        const margenAnterior = ((item.precio_venta_actual - item.costo_anterior) / item.costo_anterior);
        const sugerido = item.costo_nuevo * (1 + margenAnterior);

        setNuevoPrecioVenta(Math.ceil(sugerido).toString())
        calcularMargen(Math.ceil(sugerido), item.costo_nuevo)
    }

    const calcularMargen = (precioVenta: number, costo: number) => {
        if (!costo || costo === 0) return 0;
        const margen = ((precioVenta - costo) / costo) * 100;
        setMargenProyectado(margen);
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
            <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-full">
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Actualizaciones de Precios</h1>
                    <p className="text-gray-600">Productos que aumentaron de costo y requieren revisión.</p>
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
                {pendientes.map((item) => {
                    const diferencia = item.costo_nuevo - item.costo_anterior;
                    const porcentajeAumento = ((diferencia / item.costo_anterior) * 100).toFixed(1);

                    return (
                        <div key={item.id} className="bg-white border-l-4 border-orange-500 shadow-md rounded-r-xl p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fadeIn">

                            {/* INFO DEL PRODUCTO */}
                            <div className="flex-1 min-w-0"> {/* min-w-0 ayuda con el truncate si fuera necesario */}
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <h3 className="text-lg font-bold text-gray-900">{item.producto_nombre}</h3>
                                    <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded flex items-center whitespace-nowrap">
                                        <TrendingUp className="h-3 w-3 mr-1"/>
                                        +{porcentajeAumento}% Costo
                                    </span>
                                </div>

                                {/* NUEVA SECCIÓN: FECHA Y PROVEEDOR */}
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

                            {/* COMPARATIVA DE COSTOS */}
                            <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Costo Anterior</p>
                                    <p className="text-gray-600 font-medium line-through">{formatPrice(item.costo_anterior)}</p>
                                </div>
                                <ArrowRight className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-orange-600 uppercase font-bold">Nuevo Costo</p>
                                    <p className="text-gray-900 font-bold text-lg">{formatPrice(item.costo_nuevo)}</p>
                                </div>
                            </div>

                            {/* PRECIO VENTA ACTUAL */}
                            <div className="text-right px-4">
                                <p className="text-xs text-gray-500 uppercase font-bold">Venta Actual</p>
                                <p className="text-gray-900 font-bold text-xl">{formatPrice(item.precio_venta_actual)}</p>
                                <p className="text-xs text-red-500 font-medium whitespace-nowrap">
                                    Margen hoy: {(((item.precio_venta_actual - item.costo_nuevo)/item.costo_nuevo)*100).toFixed(1)}%
                                </p>
                            </div>

                            {/* ACCIONES */}
                            <div className="flex flex-col gap-2 w-full md:w-auto">
                                <button
                                    onClick={() => handleOpenResolver(item)}
                                    className="btn-primary bg-orange-600 hover:bg-orange-700 flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    <DollarSign className="h-4 w-4"/> Actualizar Precio
                                </button>
                                <button
                                    onClick={() => handleDescartar(item.id!)}
                                    className="text-gray-400 hover:text-gray-600 text-sm underline"
                                >
                                    Ignorar cambio
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* MODAL (Sin cambios funcionales, solo se mantiene) */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4 border-b pb-3">
                            <h3 className="text-xl font-bold text-gray-900">Actualizar Precio de Venta</h3>
                            <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-6 w-6"/>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-sm text-blue-800 mb-1">El costo aumentó a <strong>{formatPrice(selectedItem.costo_nuevo)}</strong></p>
                                <p className="text-xs text-blue-600">
                                    Sugerido para mantener margen anterior:
                                    <strong> {formatPrice(selectedItem.costo_nuevo * (1 + ((selectedItem.precio_venta_actual - selectedItem.costo_anterior)/selectedItem.costo_anterior)))}</strong>
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo Precio de Venta</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={nuevoPrecioVenta}
                                        onChange={(e) => handlePriceChange(e.target.value)}
                                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-lg font-bold"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-gray-100 p-3 rounded-lg">
                                <span className="text-sm text-gray-600 font-medium">Nuevo Margen Estimado:</span>
                                <span className={`text-lg font-bold ${margenProyectado < 20 ? 'text-red-600' : 'text-green-600'}`}>
                                    {margenProyectado.toFixed(2)}%
                                </span>
                            </div>

                            <button
                                onClick={handleConfirmar}
                                className="w-full btn-primary bg-green-600 hover:bg-green-700 py-3 text-lg mt-2"
                            >
                                Confirmar Cambio
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ActualizacionesPendientes