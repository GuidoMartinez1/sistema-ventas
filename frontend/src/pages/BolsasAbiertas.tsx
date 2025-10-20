import { useEffect, useState } from 'react'
import { Package, Calendar, Trash2, AlertTriangle, Box } from 'lucide-react'
import { bolsasAbiertasAPI } from '../services/api'
import { BolsaAbierta } from '../services/api'
import toast from 'react-hot-toast'

// Clases de utilidad
const cardClass = "bg-white shadow-lg rounded-xl p-4 md:p-6";
const inputFieldClass = "w-full border border-gray-300 p-2 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition duration-150 ease-in-out text-sm";

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
      fetchBolsas() // Recargar la lista
    } catch (error) {
      toast.error('Error al cerrar la bolsa')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calcularTiempoAbierta = (fechaApertura: string) => {
    const ahora = new Date()
    const apertura = new Date(fechaApertura)
    const diffMs = ahora.getTime() - apertura.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (diffDays > 0) {
      return `${diffDays} día${diffDays > 1 ? 's' : ''}`
    } else if (diffHours > 0) {
      return `${diffHours} hora${diffHours > 1 ? 's' : ''}`
    } else {
      return 'Menos de 1 hora'
    }
  }

  // Filtrar por búsqueda
  const bolsasFiltradas = bolsas.filter((b) =>
      b.producto_nombre?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const getTiempoBadgeClass = (tiempo: string) => {
    if (tiempo.includes('día') && parseInt(tiempo) > 1) {
      return 'bg-red-100 text-red-800'
    } else if (tiempo.includes('día') || tiempo.includes('hora')) {
      return 'bg-yellow-100 text-yellow-800'
    }
    return 'bg-green-100 text-green-800'
  }

  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    )
  }

  return (
      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bolsas Abiertas</h1>
          <p className="text-gray-600">Gestiona las bolsas que han sido abiertas</p>
        </div>

        {/* Input de búsqueda */}
        <div className="mb-4">
          <input
              type="text"
              placeholder="Buscar por nombre de producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={`${inputFieldClass} w-full md:w-1/3`}
          />
        </div>

        {/* Alerta si no hay bolsas */}
        {bolsasFiltradas.length === 0 && (
            <div className={cardClass}>
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay bolsas abiertas</h3>
                  <p className="text-gray-500">Todas las bolsas están cerradas o no se han abierto bolsas recientemente.</p>
                </div>
              </div>
            </div>
        )}

        {/* Lista de bolsas abiertas */}
        {bolsasFiltradas.length > 0 && (
            <div className={cardClass}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                  Bolsas Abiertas ({bolsasFiltradas.length})
                </h2>
              </div>

              {/* VISTA DE TABLA (ESCRITORIO) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha de Apertura
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tiempo Abierta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Actual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {bolsasFiltradas.map((bolsa) => (
                      <tr key={bolsa.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                                <Package className="h-6 w-6 text-orange-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {bolsa.producto_nombre}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {bolsa.producto_id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">
                          {formatDate(bolsa.fecha_apertura!)}
                        </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getTiempoBadgeClass(calcularTiempoAbierta(bolsa.fecha_apertura!))
                      }`}>
                        {calcularTiempoAbierta(bolsa.fecha_apertura!)}
                      </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          (bolsa.stock_actual || 0) <= 5
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                      }`}>
                        {bolsa.stock_actual || 0} unidades
                      </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button
                              onClick={() => cerrarBolsa(bolsa.id!)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Cerrar Bolsa
                          </button>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>

              {/* VISTA DE TARJETA (MÓVIL) */}
              <div className="md:hidden space-y-3">
                {bolsasFiltradas.map((bolsa) => (
                    <div key={bolsa.id} className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center">
                          <Box className="h-6 w-6 text-orange-600 mr-3" />
                          <h3 className="text-lg font-bold text-gray-900">{bolsa.producto_nombre}</h3>
                        </div>
                        <button
                            onClick={() => cerrarBolsa(bolsa.id!)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Cerrar
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-y-2 text-sm border-t pt-2">
                        <div>
                          <span className="text-xs text-gray-500 block">Fecha Apertura</span>
                          <span className="text-gray-700 text-sm font-medium">{formatDate(bolsa.fecha_apertura!)}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">Stock Actual</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              (bolsa.stock_actual || 0) <= 5 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                                {bolsa.stock_actual || 0} unidades
                              </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-xs text-gray-500 block">Tiempo Abierta</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              getTiempoBadgeClass(calcularTiempoAbierta(bolsa.fecha_apertura!))
                          }`}>
                                {calcularTiempoAbierta(bolsa.fecha_apertura!)}
                              </span>
                        </div>
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