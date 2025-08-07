import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Package } from 'lucide-react'
import { productosAPI, categoriasAPI } from '../services/api'
import { Producto, Categoria } from '../services/api'
import toast from 'react-hot-toast'

const Productos = () => {
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    precio_costo: '',
    porcentaje_ganancia: '',
    stock: '',
    categoria_id: '',
    codigo: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [productosResponse, categoriasResponse] = await Promise.all([
        productosAPI.getAll(),
        categoriasAPI.getAll()
      ])
      setProductos(productosResponse.data)
      setCategorias(categoriasResponse.data)
    } catch (error) {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const productoData = {
        ...formData,
        precio: parseFloat(formData.precio),
        precio_costo: parseFloat(formData.precio_costo),
        porcentaje_ganancia: parseFloat(formData.porcentaje_ganancia),
        stock: parseInt(formData.stock) || 0,
        categoria_id: formData.categoria_id ? parseInt(formData.categoria_id) : undefined
      }

      if (editingProducto) {
        await productosAPI.update(editingProducto.id!, productoData)
        toast.success('Producto actualizado exitosamente')
      } else {
        await productosAPI.create(productoData)
        toast.success('Producto creado exitosamente')
      }

      setShowModal(false)
      setEditingProducto(null)
      resetForm()
      fetchData()
    } catch (error) {
      toast.error('Error al guardar producto')
    }
  }

  const handleEdit = (producto: Producto) => {
    setEditingProducto(producto)
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: producto.precio.toString(),
      precio_costo: producto.precio_costo?.toString() || '',
      porcentaje_ganancia: producto.porcentaje_ganancia?.toString() || '',
      stock: producto.stock.toString(),
      categoria_id: producto.categoria_id?.toString() || '',
      codigo: producto.codigo || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await productosAPI.delete(id)
        toast.success('Producto eliminado exitosamente')
        fetchData()
      } catch (error) {
        toast.error('Error al eliminar producto')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      precio_costo: '',
      porcentaje_ganancia: '',
      stock: '',
      categoria_id: '',
      codigo: ''
    })
  }

  const openModal = () => {
    setEditingProducto(null)
    resetForm()
    setShowModal(true)
  }

  const getCategoriaNombre = (categoriaId?: number) => {
    if (!categoriaId) return '-'
    const categoria = categorias.find(c => c.id === categoriaId)
    return categoria?.nombre || '-'
  }

  const calcularPrecioVenta = (precioCosto: number, porcentajeGanancia: number) => {
    return precioCosto * (1 + porcentajeGanancia / 100)
  }

  const calcularGanancia = (precioVenta: number, precioCosto: number) => {
    return ((precioVenta - precioCosto) / precioCosto) * 100
  }

  const calcularPrecioAutomatico = () => {
    const precioCosto = parseFloat(formData.precio_costo) || 0
    const porcentajeGanancia = parseFloat(formData.porcentaje_ganancia) || 30
    
    if (precioCosto > 0) {
      const precioCalculado = calcularPrecioVenta(precioCosto, porcentajeGanancia)
      setFormData(prev => ({
        ...prev,
        precio: precioCalculado.toFixed(2)
      }))
    }
  }

  const handlePrecioCostoChange = (value: string) => {
    setFormData(prev => ({ ...prev, precio_costo: value }))
    if (value && formData.porcentaje_ganancia) {
      setTimeout(calcularPrecioAutomatico, 100)
    }
  }

  const handlePorcentajeChange = (value: string) => {
    setFormData(prev => ({ ...prev, porcentaje_ganancia: value }))
    if (value && formData.precio_costo) {
      setTimeout(calcularPrecioAutomatico, 100)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Productos - AliMar</h1>
          <p className="text-gray-600">Gestiona tu inventario de productos para mascotas</p>
        </div>
        <button
          onClick={openModal}
          className="btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Producto
        </button>
      </div>

      {/* Productos Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio Venta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio Costo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ganancia %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productos.map((producto) => (
                <tr key={producto.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <Package className="h-6 w-6 text-orange-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {producto.nombre}
                        </div>
                        {producto.descripcion && (
                          <div className="text-sm text-gray-500">
                            {producto.descripcion}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getCategoriaNombre(producto.categoria_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${producto.precio}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${producto.precio_costo || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      (producto.porcentaje_ganancia || 0) >= 50 
                        ? 'bg-green-100 text-green-800' 
                        : (producto.porcentaje_ganancia || 0) >= 30
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {producto.porcentaje_ganancia || 0}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      producto.stock <= 4 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {producto.stock} unidades
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(producto)}
                        className="text-orange-600 hover:text-orange-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(producto.id!)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                    className="input-field"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Precio de Costo
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.precio_costo}
                      onChange={(e) => handlePrecioCostoChange(e.target.value)}
                      className="input-field"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Porcentaje de Ganancia
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.porcentaje_ganancia}
                        onChange={(e) => handlePorcentajeChange(e.target.value)}
                        className="input-field rounded-r-none"
                        placeholder="30"
                      />
                      <button
                        type="button"
                        onClick={calcularPrecioAutomatico}
                        className="px-3 py-2 bg-orange-500 text-white rounded-r-lg hover:bg-orange-600 transition-colors"
                      >
                        Calcular
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Precio de Venta *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.precio}
                      onChange={(e) => setFormData({...formData, precio: e.target.value})}
                      className="input-field"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Stock
                    </label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({...formData, stock: e.target.value})}
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Categoría *
                    </label>
                    <select
                      value={formData.categoria_id}
                      onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}
                      className="input-field"
                    >
                      <option value="">Seleccionar categoría</option>
                      {categorias.map((categoria) => (
                        <option key={categoria.id} value={categoria.id}>
                          {categoria.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Código
                    </label>
                    <input
                      type="text"
                      value={formData.codigo}
                      onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingProducto ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Productos 