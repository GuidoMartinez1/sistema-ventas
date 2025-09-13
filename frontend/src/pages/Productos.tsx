import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Package, Download } from 'lucide-react'
import { productosAPI, categoriasAPI } from '../services/api'
import { Producto, Categoria } from '../services/api'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import { ClipboardList, X } from 'lucide-react'

const formatPrice = (value: number | string | undefined) => {
  if (value === null || value === undefined || value === '') return '$0';
  return '$' + Number(value).toLocaleString("es-AR");
};

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
    precio_kg: '',
    precio_costo: '',
    porcentaje_ganancia: '',
    stock: '',
    categoria_id: '',
    codigo: ''
  })
  const [busqueda, setBusqueda] = useState('')
  const [stockFiltro, setStockFiltro] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  // ================= FUTUROS PEDIDOS =================
  const [mostrarFuturos, setMostrarFuturos] = useState(false)
  const [futurosPedidos, setFuturosPedidos] = useState<{ id: number; producto: string; cantidad: string }[]>([])
  const [nuevoProducto, setNuevoProducto] = useState('')
  const [nuevaCantidad, setNuevaCantidad] = useState('')
  const [cargandoFuturos, setCargandoFuturos] = useState(false)

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

  const exportarProductosExcel = async () => {
    try {
      const response = await productosAPI.getAll()
      const data = response.data

      if (!data.length) {
        toast.error('No hay productos para exportar')
        return
      }

      const exportData = data.map((p: any) => ({
        ID: p.id,
        Nombre: p.nombre,
        Código: p.codigo || '',
        Categoría: getCategoriaNombre(p.categoria_id),
        Precio: formatPrice(p.precio),
        Precio_x_Kg: formatPrice(p.precio_kg),
        Precio_Costo: formatPrice(p.precio_costo),
        Ganancia_Porcentaje: p.porcentaje_ganancia || 0,
        Stock: p.stock
      }))

      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos')

      XLSX.writeFile(workbook, 'productos_stock.xlsx')
      toast.success('Productos exportados con éxito')
    } catch (error) {
      toast.error('Error al exportar productos')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const productoData = {
        ...formData,
        precio: parseFloat(formData.precio || '0') || 0,
        precio_kg: parseFloat(formData.precio_kg || '0') || 0,
        precio_costo: parseFloat(formData.precio_costo || '0') || 0,
        porcentaje_ganancia: parseFloat(formData.porcentaje_ganancia || '0') || 0,
        stock: parseInt(formData.stock || '0') || 0,
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
      precio: producto.precio?.toString() || '',
      precio_kg: producto.precio_kg?.toString() || '',
      precio_costo: producto.precio_costo?.toString() || '',
      porcentaje_ganancia: producto.porcentaje_ganancia?.toString() || '',
      stock: producto.stock?.toString() || '',
      categoria_id: producto.categoria_id?.toString() || '',
      codigo: producto.codigo || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este producto?')) {
      try {
        await productosAPI.delete(id)
        toast.success('Producto eliminado exitosamente')
        fetchData()
      } catch (error) {
        toast.error('Error al eliminar producto')
      }
    }
  }

  const handleAbrirBolsa = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea abrir una bolsa de este producto? Se restará 1 unidad del stock.')) {
      try {
        await productosAPI.abrirBolsa(id)
        toast.success('Bolsa abierta exitosamente')
        fetchData()
      } catch (error) {
        toast.error('Error al abrir bolsa')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      precio: '',
      precio_kg: '',
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

  const calcularPorcentajeGanancia = (precioCosto: number, precioVenta: number) => {
    if (precioCosto <= 0) return 0
    return ((precioVenta - precioCosto) / precioCosto) * 100
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

  const handlePrecioVentaChange = (value: string) => {
    setFormData(prev => {
      const precioCosto = parseFloat(prev.precio_costo) || 0
      const precioVenta = parseFloat(value) || 0

      let nuevoPorcentaje = prev.porcentaje_ganancia
      if (precioCosto > 0 && precioVenta > 0) {
        nuevoPorcentaje = calcularPorcentajeGanancia(precioCosto, precioVenta).toFixed(2)
      }

      return {
        ...prev,
        precio: value,
        porcentaje_ganancia: nuevoPorcentaje
      }
    })
  }



  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
    )
  }

  const fetchFuturosPedidos = async () => {
    setCargandoFuturos(true)
    try {
      const res = await futurosPedidosAPI.getAll()
      setFuturosPedidos(res.data)
    } catch {
      toast.error('Error al cargar futuros pedidos')
    } finally {
      setCargandoFuturos(false)
    }
  }

  const agregarFuturo = async () => {
    if (!nuevoProducto.trim()) {
      toast.error('Ingresa un nombre de producto')
      return
    }
    try {
      const res = await futurosPedidosAPI.create({ producto: nuevoProducto.trim(), cantidad: nuevaCantidad.trim() })
      setFuturosPedidos(prev => [res.data, ...prev])
      setNuevoProducto('')
      setNuevaCantidad('')
      toast.success('Futuro pedido agregado')
    } catch {
      toast.error('Error al agregar futuro pedido')
    }
  }

  const eliminarFuturo = async (id: number) => {
    try {
      await futurosPedidosAPI.delete(id)
      setFuturosPedidos(prev => prev.filter(p => p.id !== id))
      toast.success('Futuro pedido eliminado')
    } catch {
      toast.error('Error al eliminar futuro pedido')
    }
  }
// ====================================================

  return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Productos - AliMar</h1>
            <p className="text-gray-600">Gestiona tu inventario de productos para mascotas</p>
          </div>
          <div className="flex gap-2">
            <button
                onClick={exportarProductosExcel}
                className="btn-secondary flex items-center"
            >
              <Download className="h-5 w-5 mr-2" />
              Exportar Excel
            </button>
            <button
                onClick={() => {
                  setMostrarFuturos(true)
                  fetchFuturosPedidos()
                }}
                className="btn-secondary flex items-center"
            >
              <ClipboardList className="h-5 w-5 mr-2" />
              Futuros Pedidos
            </button>
            <button
                onClick={openModal}
                className="btn-primary flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Producto
            </button>
          </div>
        </div>

        {/* filtros */}
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
          <input
              type="text"
              placeholder="Buscar por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="input-field w-full md:w-1/3"
          />
          <select
              value={stockFiltro}
              onChange={(e) => setStockFiltro(e.target.value)}
              className="input-field w-full md:w-1/4"
          >
            <option value="">Todos los Stocks</option>
            <option value="0">0</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value=">4">&gt;4</option>
          </select>

          <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="input-field w-full md:w-1/4"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id?.toString()}>
                  {categoria.nombre}
                </option>
            ))}
          </select>
        </div>

        {/* tabla */}
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
                  Precio x Kg
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
              {productos
                  .filter(p => p.nombre?.toLowerCase().includes(busqueda.toLowerCase()))
                  .filter(p => {
                    if (!stockFiltro) return true
                    if (stockFiltro === '>4') return p.stock > 4
                    return p.stock === parseInt(stockFiltro)
                  })
                  .filter(p =>
                      categoriaFiltro ? p.categoria_id?.toString() === categoriaFiltro : true
                  )
                  .sort((a, b) => a.nombre.localeCompare(b.nombre))  // 👈 ORDEN ALFABÉTICO
                  .map((producto) => (
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
                          {formatPrice(producto.precio)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatPrice(producto.precio_kg)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPrice(producto.precio_costo)}
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
                                className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(producto.id!)}
                                className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            {producto.stock > 0 && (
                                <button
                                    onClick={() => handleAbrirBolsa(producto.id!)}
                                    className="text-orange-600 hover:text-orange-900"
                                    title="Abrir bolsa (restar 1 unidad)"
                                >
                                  📦
                                </button>
                            )}
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Precio por Kilo
                      </label>
                      <input
                          type="number"
                          step="0.01"
                          value={formData.precio_kg}
                          onChange={(e) => setFormData({...formData, precio_kg: e.target.value})}
                          className="input-field"
                          placeholder="0.00"
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
                            onChange={(e) => handlePrecioVentaChange(e.target.value)}
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
                          Categoría
                        </label>
                        <select
                            value={formData.categoria_id}
                            onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}
                            className="input-field"
                        >
                          <option value="">Seleccione</option>
                          {categorias.map((c) => (
                              <option key={c.id} value={c.id?.toString()}>
                                {c.nombre}
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
                    <div className="flex justify-end space-x-2">
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
                      className="border rounded px-3 py-2 flex-1"
                  />
                  <input
                      type="text"
                      placeholder="Cantidad"
                      value={nuevaCantidad}
                      onChange={(e) => setNuevaCantidad(e.target.value)}
                      className="border rounded px-3 py-2 w-28"
                  />
                  <button
                      onClick={agregarFuturo}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                  >
                    Agregar
                  </button>
                </div>

                {cargandoFuturos ? (
                    <p className="text-gray-500">Cargando...</p>
                ) : futurosPedidos.length === 0 ? (
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
                                className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </li>
                      ))}
                    </ul>
                )}
              </div>
            </div>
        )}
      </div>
  )
}

export default Productos
