import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Package, Download } from 'lucide-react'
import { productosAPI, categoriasAPI } from '../services/api'
import { Producto, Categoria } from '../services/api'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

const PRECIOS_KG_KEY = 'preciosKg' // key en localStorage

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

  useEffect(() => {
    fetchData()
  }, [])

  const [busqueda, setBusqueda] = useState('');
  const [stockFiltro, setStockFiltro] = useState(''); // '', 'bajo', 'alto'
  const [categoriaFiltro, setCategoriaFiltro] = useState('');

  /* ---------- Helpers localStorage para precios x kg ---------- */
  const loadPreciosKgFromStorage = (): Record<string, number> => {
    try {
      const raw = localStorage.getItem(PRECIOS_KG_KEY)
      if (!raw) return {}
      return JSON.parse(raw)
    } catch (e) {
      console.warn('Error parseando preciosKg en localStorage', e)
      return {}
    }
  }

  const getPrecioKgFromStorage = (productId?: number) => {
    if (!productId && productId !== 0) return undefined
    const obj = loadPreciosKgFromStorage()
    const key = String(productId)
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return Number(obj[key])
    }
    return undefined
  }

  const setPrecioKgInStorage = (productId: number, precioKg: number | string | undefined) => {
    try {
      const obj = loadPreciosKgFromStorage()
      const key = String(productId)
      const val = precioKg === undefined || precioKg === null || precioKg === '' ? 0 : Number(precioKg)
      obj[key] = isNaN(val) ? 0 : val
      localStorage.setItem(PRECIOS_KG_KEY, JSON.stringify(obj))
    } catch (e) {
      console.warn('Error guardando precioKg en localStorage', e)
    }
  }
  /* ------------------------------------------------------------ */

  const fetchData = async () => {
    try {
      const [productosResponse, categoriasResponse] = await Promise.all([
        productosAPI.getAll(),
        categoriasAPI.getAll()
      ])

      // integrar valores desde localStorage (si existen)
      const stored = loadPreciosKgFromStorage()
      const productosConPrecioKg = productosResponse.data.map((p: any) => {
        const precioKgStored = stored[String(p.id)]
        return {
          ...p,
          // mantengo la propiedad precio_kg si existe en backend, pero priorizo el valor guardado en localStorage
          precio_kg: precioKgStored !== undefined ? precioKgStored : (p.precio_kg ?? '')
        }
      })

      setProductos(productosConPrecioKg)
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

      const stored = loadPreciosKgFromStorage()

      const exportData = data.map((p: any) => ({
        ID: p.id,
        Nombre: p.nombre,
        Código: p.codigo || '',
        Categoría: getCategoriaNombre(p.categoria_id),
        Precio: p.precio,
        Precio_x_Kg: stored[String(p.id)] !== undefined ? stored[String(p.id)] : (p.precio_kg ?? ''),
        Precio_Costo: p.precio_costo || 0,
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
        // precio_kg lo guardamos en localStorage, pero igualmente lo enviamos al backend si el backend acepta esa propiedad
        precio_kg: formData.precio_kg ? parseFloat(formData.precio_kg) : undefined,
        precio_costo: parseFloat(formData.precio_costo || '0') || 0,
        porcentaje_ganancia: parseFloat(formData.porcentaje_ganancia || '0') || 0,
        stock: parseInt(formData.stock || '0') || 0,
        categoria_id: formData.categoria_id ? parseInt(formData.categoria_id) : undefined
      }

      if (editingProducto) {
        // Update
        const res = await productosAPI.update(editingProducto.id!, productoData)
        // Persistir precio_kg en localStorage usando el id conocido
        const precioKgNumber = formData.precio_kg ? parseFloat(formData.precio_kg) : 0
        setPrecioKgInStorage(editingProducto.id!, precioKgNumber)
        toast.success('Producto actualizado exitosamente')
      } else {
        // Create: intentamos obtener el id que devuelve la API para poder guardarlo en localStorage
        const res = await productosAPI.create(productoData)
        const created = res?.data
        if (created && created.id) {
          const createdId = created.id
          const precioKgNumber = formData.precio_kg ? parseFloat(formData.precio_kg) : 0
          setPrecioKgInStorage(createdId, precioKgNumber)
        } else {
          // Si la API no devuelve id, guardamos un mensaje en consola y seguimos (fetchData traerá el nuevo producto y no podremos mapearlo inmediatamente)
          console.warn('No se obtuvo id del producto creado; precio_kg no pudo persistirse por id.')
        }
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
    // cargar precio_kg desde localStorage si existe
    const precioKgStored = getPrecioKgFromStorage(producto.id)
    setEditingProducto(producto)
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: producto.precio?.toString() || '',
      precio_kg: precioKgStored !== undefined ? String(precioKgStored) : (producto as any).precio_kg?.toString() || '',
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
        // opcional: borrar precio_kg asociado del localStorage al eliminar producto
        try {
          const obj = loadPreciosKgFromStorage()
          const key = String(id)
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            delete obj[key]
            localStorage.setItem(PRECIOS_KG_KEY, JSON.stringify(obj))
          }
        } catch (e) {
          console.warn('Error al borrar precio_kg de localStorage', e)
        }

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
        // NOTA: no tocamos precio_kg automáticamente — se mantiene manual y persistente en localStorage
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
        <div className="flex gap-2">
          <button
            onClick={exportarProductosExcel}
            className="btn-secondary flex items-center"
          >
            <Download className="h-5 w-5 mr-2" />
            Exportar Excel
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

      {/* Filtros */}
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
          <option value="">Todos los stocks</option>
          <option value="bajo">Stock bajo (≤ 2)</option>
          <option value="alto">Stock alto (≥ 3)</option>
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
                .filter(p =>
                  p.nombre?.toLowerCase().includes(busqueda.toLowerCase())
                )
                .filter(p =>
                  stockFiltro === 'bajo' ? p.stock <= 3 :
                  stockFiltro === 'alto' ? p.stock > 3 :
                  true
                )
                .filter(p =>
                  categoriaFiltro ? p.categoria_id?.toString() === categoriaFiltro : true
                )
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
                      ${producto.precio}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${ (getPrecioKgFromStorage(producto.id) !== undefined ? getPrecioKgFromStorage(producto.id) : (producto as any).precio_kg) || 0 }
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
