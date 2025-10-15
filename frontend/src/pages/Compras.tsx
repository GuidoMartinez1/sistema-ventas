import { useEffect, useState } from 'react'
import { Plus, Package, Calendar, Building, Eye, X, ClipboardList, Trash2 } from 'lucide-react'
import { comprasAPI } from '../services/api'
import { Compra, CompraCompleta } from '../services/api'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const Compras = () => {
  const navigate = useNavigate()
  const [compras, setCompras] = useState<Compra[]>([])
  const [loading, setLoading] = useState(true)
  const [compraSeleccionada, setCompraSeleccionada] = useState<CompraCompleta | null>(null)
  const [mostrarDetalles, setMostrarDetalles] = useState(false)
  const [cargandoDetalles, setCargandoDetalles] = useState(false)

  // ================= FUTUROS PEDIDOS =================
  const [mostrarFuturos, setMostrarFuturos] = useState(false)
  const [futurosPedidos, setFuturosPedidos] = useState<{ id: number; producto: string; cantidad: string }[]>([])
  const [nuevoProducto, setNuevoProducto] = useState('')
  const [nuevaCantidad, setNuevaCantidad] = useState('')
  const [futurosCargados, setFuturosCargados] = useState(false)

  useEffect(() => {
    try {
      const guardados = localStorage.getItem('futurosPedidos')
      if (guardados) {
        const parsed = JSON.parse(guardados)
        if (Array.isArray(parsed)) {
          setFuturosPedidos(parsed)
        }
      }
    } catch {}
    setFuturosCargados(true)
  }, [])

  useEffect(() => {
    if (!futurosCargados) return
    try {
      localStorage.setItem('futurosPedidos', JSON.stringify(futurosPedidos))
    } catch {}
  }, [futurosPedidos, futurosCargados])

  const agregarFuturo = () => {
    if (!nuevoProducto.trim()) {
      toast.error('Ingresa un nombre de producto')
      return
    }
    setFuturosPedidos(prev => [
      ...prev,
      { id: Date.now(), producto: nuevoProducto.trim(), cantidad: nuevaCantidad.trim() }
    ])
    setNuevoProducto('')
    setNuevaCantidad('')
  }



  const eliminarFuturo = (id: number) => {
    setFuturosPedidos(prev => prev.filter(p => p.id !== id))
  }
  // ====================================================

  useEffect(() => {
    fetchCompras()
  }, [])

  const fetchCompras = async () => {
    try {
      const response = await comprasAPI.getAll()
      setCompras(response.data)
    } catch (error) {
      toast.error('Error al cargar compras')
    } finally {
      setLoading(false)
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
  const formatPrice = (value: number | string | undefined) => {
    if (value === null || value === undefined || value === '') return '$0';
    return '$' + Number(value).toLocaleString("es-AR");
  };

  const verDetalles = async (compraId: number) => {
    setCargandoDetalles(true)
    try {
      const response = await comprasAPI.getById(compraId)
      setCompraSeleccionada(response.data)
      setMostrarDetalles(true)
    } catch (error) {
      toast.error('Error al cargar detalles de la compra')
    } finally {
      setCargandoDetalles(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compras</h1>
          <p className="text-gray-600">Historial de compras de mercadería</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMostrarFuturos(true)}
            className="btn-secondary flex items-center">
            <ClipboardList className="h-5 w-5 mr-2" />
            Futuros Pedidos
          </button>
          <button
            onClick={() => navigate('/nueva-compra')}
            className="btn-primary flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Nueva Compra
          </button>
        </div>
      </div>

      {/* TABLA COMPRAS */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compra</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {compras.map((compra) => (
                <tr key={compra.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Package className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          Compra #{compra.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{compra.proveedor_nombre || 'Sin proveedor'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{formatDate(compra.fecha!)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${formatPrice(compra.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {compra.estado || 'Completada'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      onClick={() => verDetalles(compra.id!)}
                      disabled={cargandoDetalles}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                      <Eye className="h-4 w-4 mr-1" />
                      {cargandoDetalles ? 'Cargando...' : 'Ver Detalles'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FUTUROS PEDIDOS */}
      {mostrarFuturos && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex justify-center items-start pt-20">
          <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-2/3 lg:w-1/2 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center">
                <ClipboardList className="h-5 w-5 mr-2" /> Futuros Pedidos
              </h2>
              <button onClick={() => setMostrarFuturos(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Producto"
                value={nuevoProducto}
                onChange={(e) => setNuevoProducto(e.target.value)}
                className="border rounded px-3 py-2 flex-1"/>
              <input
                type="text"
                placeholder="Cantidad"
                value={nuevaCantidad}
                onChange={(e) => setNuevaCantidad(e.target.value)}
                className="border rounded px-3 py-2 w-28"/>
              <button
                onClick={agregarFuturo}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
                Agregar
              </button>
            </div>

            {futurosPedidos.length === 0 ? (
              <p className="text-gray-500">No hay productos en la lista.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {futurosPedidos.map((item) => (
                  <li key={item.id} className="flex justify-between items-center py-2">
                    <div>
                      <span className="font-medium">{item.producto}</span>
                      {item.cantidad && <span className="text-gray-500 ml-2">({item.cantidad})</span>}
                    </div>
                    <button
                      onClick={() => eliminarFuturo(item.id)}
                      className="text-red-500 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* MODAL DETALLES */}
      {mostrarDetalles && compraSeleccionada && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Detalles de Compra #{compraSeleccionada.id}
                </h3>
                <button
                  onClick={() => setMostrarDetalles(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Proveedor</p>
                  <p className="text-blue-900 font-bold">{compraSeleccionada.proveedor_nombre || 'Sin proveedor'}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Total</p>
                  <p className="text-green-900 font-bold">${formatPrice(compraSeleccionada.total)}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Fecha</p>
                  <p className="text-purple-900 font-bold">{formatDate(compraSeleccionada.fecha!)}</p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Productos Comprados</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unitario</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {compraSeleccionada.detalles.map((detalle) => (
                        <tr key={detalle.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{detalle.producto_nombre}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{detalle.cantidad}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">${formatPrice(detalle.precio_unitario)}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600">${formatPrice(detalle.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total de la Compra:</span>
                  <span className="text-green-600">${formatPrice(compraSeleccionada.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Compras
