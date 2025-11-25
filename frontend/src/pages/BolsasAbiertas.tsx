import { useEffect, useState } from 'react'
import { Package, Calendar, Trash2, AlertTriangle, Box, ListChecks } from 'lucide-react'
import { bolsasAbiertasAPI } from '../services/api'
import { BolsaAbierta } from '../services/api'
import toast from 'react-hot-toast'

// Clases de utilidad
const cardClass = "bg-white shadow-lg rounded-xl p-4 sm:p-6 border border-gray-100";
const inputFieldClass = "w-full border border-gray-300 p-2.5 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition duration-150 ease-in-out text-sm";

const BolsasAbiertas = () => {
    const [bolsas, setBolsas] = useState<BolsaAbierta[]>([])
    const [loading, setLoading] = useState(true)
    const [busqueda, setBusqueda] = useState("")

    useEffect(() => {
        fetchBolsas()
    }, [])

    const fetchBolsas = async () => {
        try {
            const response = await bolsasAbiertasAPI.getAll()
            // Procesar bolsas (lógica original intacta)
            const processedBags = response.data.map((bag, index, array) => {
                if (bag.is_duplicate && index > 0 && array[index - 1].producto_id !== bag.producto_id) {
                    return { ...bag, is_oldest_duplicate: true };
                }
                if (bag.is_duplicate && index === 0) {
                    return { ...bag, is_oldest_duplicate: true };
                }
                return bag;
            });
            setBolsas(response.data)
        } catch (error) {
            toast.error('Error al cargar bolsas abiertas')
        } finally {
            setLoading(false)
        }
    }

    const cerrarBolsa = async (id: number) => {
        try {
            await bolsasAbiertasAPI.delete(id)
            toast.success('Bolsa cerrada exitosamente')
            fetchBolsas()
        } catch (error) {
            toast.error('Error al cerrar la bolsa')
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    const calcularTiempoAbierta = (fechaApertura: string) => {
        const ahora = new Date()
        const apertura = new Date(fechaApertura)
        const diffMs = ahora.getTime() - apertura.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

        if (diffDays > 0) return `${diffDays} día${diffDays > 1 ? 's' : ''}`
        if (diffHours > 0) return `${diffHours} hora${diffHours > 1 ? 's' : ''}`
        return '< 1h'
    }

    const getTiempoBadgeClass = (tiempo: string) => {
        if (tiempo.includes('día') && parseInt(tiempo) > 1) return 'bg-red-100 text-red-800 border border-red-200'
        if (tiempo.includes('día') || tiempo.includes('hora')) return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
        return 'bg-green-100 text-green-800 border border-green-200'
    }

    const getRowClass = (bolsa: BolsaAbierta) => {
        let baseClass = "hover:bg-gray-50 transition-colors duration-150";
        if (bolsa.is_duplicate) {
            baseClass = "bg-yellow-50 hover:bg-yellow-100 border-l-4 border-yellow-500";
        }
        return baseClass;
    };

    const bolsasFiltradas = bolsas.filter((b) =>
        b.producto_nombre?.toLowerCase().includes(busqueda.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 w-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    return (
        // CLAVE: w-full y overflow-hidden para evitar scroll horizontal en el padre
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Bolsas Abiertas</h1>
                    <p className="text-gray-500 mt-1">Control de inventario en uso</p>
                </div>
                <div className="w-full sm:w-72">
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={inputFieldClass}
                    />
                </div>
            </div>

            {/* Alerta de Duplicados */}
            {bolsas.some(b => b.is_duplicate) && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 shadow-sm" role="alert">
                    <div className="p-2 bg-orange-100 rounded-full shrink-0">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-orange-800 text-sm">¡Alerta de Inventario!</h4>
                        <p className="text-sm text-orange-700 mt-0.5">
                            Hay bolsas duplicadas. Prioriza cerrar las resaltadas en amarillo (las más antiguas).
                        </p>
                    </div>
                </div>
            )}

            {/* Estado Vacío */}
            {bolsasFiltradas.length === 0 && (
                <div className={`${cardClass} flex flex-col items-center justify-center py-12 text-center`}>
                    <div className="bg-gray-50 p-4 rounded-full mb-4">
                        <Package className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No hay bolsas abiertas</h3>
                    <p className="text-gray-500 mt-1 max-w-sm">
                        No se encontraron resultados para tu búsqueda o el inventario está ordenado.
                    </p>
                </div>
            )}

            {/* Contenido Principal */}
            {bolsasFiltradas.length > 0 && (
                <div className={cardClass}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <ListChecks className="h-5 w-5 text-primary-600" />
                            Listado ({bolsasFiltradas.length})
                        </h2>
                    </div>

                    {/* VISTA DE TABLA (ESCRITORIO GRANDE - LG para arriba) */}
                    {/* CAMBIO: hidden lg:block en lugar de md:block. En tablets se verá como cards. */}
                    <div className="hidden lg:block overflow-hidden rounded-lg border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/3">
                                        Producto
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Apertura
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Tiempo
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        Stock
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Acción
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {bolsasFiltradas.map((bolsa) => (
                                    <tr key={bolsa.id} className={getRowClass(bolsa)}>
                                        {/* CAMBIO: Eliminado whitespace-nowrap para que el nombre baje de línea si es largo */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center border border-orange-100">
                                                        <Package className="h-5 w-5 text-orange-600" />
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-semibold text-gray-900 line-clamp-2">
                                                        {bolsa.producto_nombre}
                                                        {bolsa.is_duplicate && (
                                                            <AlertTriangle className="h-4 w-4 text-red-500 inline ml-2 mb-1" title="Duplicado"/>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                        ID: {bolsa.producto_id}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {formatDate(bolsa.fecha_apertura!)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                getTiempoBadgeClass(calcularTiempoAbierta(bolsa.fecha_apertura!))
                            }`}>
                              {calcularTiempoAbierta(bolsa.fecha_apertura!)}
                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                 (bolsa.stock_actual || 0) <= 5
                                     ? 'bg-red-50 text-red-700 border border-red-200'
                                     : 'bg-green-50 text-green-700 border border-green-200'
                             }`}>
                              {bolsa.stock_actual || 0} u.
                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => cerrarBolsa(bolsa.id!)}
                                                className="inline-flex items-center justify-center px-3 py-1.5 border border-red-200 text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                            >
                                                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                                Cerrar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* VISTA DE TARJETA (MÓVIL Y TABLET - HASTA LG) */}
                    {/* CAMBIO: md:hidden cambiado a lg:hidden. Ahora en laptops pequeñas se ven tarjetas grid. */}
                    <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
                        {bolsasFiltradas.map((bolsa) => (
                            <div key={bolsa.id} className={`${getRowClass(bolsa)} border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col justify-between h-full`}>
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1">
                                                <Box className="h-5 w-5 text-orange-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight">
                                                    {bolsa.producto_nombre}
                                                </h3>
                                                {bolsa.is_duplicate && (
                                                    <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                      <AlertTriangle className="h-3 w-3 mr-1" /> Duplicado
                                  </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm mt-4 mb-4">
                                        <div className="bg-white/50 p-2 rounded border border-gray-100">
                                            <span className="text-xs text-gray-500 block mb-1">Apertura</span>
                                            <div className="font-medium text-gray-800 text-xs">
                                                {formatDate(bolsa.fecha_apertura!)}
                                            </div>
                                        </div>
                                        <div className="bg-white/50 p-2 rounded border border-gray-100">
                                            <span className="text-xs text-gray-500 block mb-1">Tiempo</span>
                                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                                getTiempoBadgeClass(calcularTiempoAbierta(bolsa.fecha_apertura!))
                                            }`}>
                                {calcularTiempoAbierta(bolsa.fecha_apertura!)}
                              </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-gray-200/60 mt-auto">
                         <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
                             (bolsa.stock_actual || 0) <= 5 ? 'text-red-700 bg-red-50' : 'text-green-700 bg-green-50'
                         }`}>
                           Stock: {bolsa.stock_actual || 0}
                         </span>
                                    <button
                                        onClick={() => cerrarBolsa(bolsa.id!)}
                                        className="inline-flex items-center px-3 py-1.5 border border-red-200 text-xs font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 shadow-sm transition-colors"
                                    >
                                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            )}
        </div>
    )
}

export default BolsasAbiertas