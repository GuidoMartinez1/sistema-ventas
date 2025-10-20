import { useEffect, useState } from 'react'
import { Plus, Minus, Trash2, ShoppingCart, Tag } from 'lucide-react'
import { productosAPI, proveedoresAPI, comprasAPI, categoriasAPI } from '../services/api'
import { Producto, Proveedor, DetalleCompra, Categoria } from '../services/api'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

// Clases de utilidad
const cardClass = "bg-white shadow-lg rounded-xl p-4 md:p-6";
const inputFieldClass = "w-full border border-gray-300 p-2 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition duration-150 ease-in-out text-sm";


const formatPrice = (value: number | string | undefined) => {
  if (value === null || value === undefined || value === '') return '$0';
  return '$' + Number(value).toLocaleString("es-AR");
};

const NuevaCompra = () => {
  const navigate = useNavigate()
  const [productos, setProductos] = useState<Producto[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [selectedProveedor, setSelectedProveedor] = useState<number | null>(null)
  const [cartItems, setCartItems] = useState<DetalleCompra[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState('')
  const [showProductModal, setShowProductModal] = useState(false)
  const [newProduct, setNewProduct] = useState({
    nombre: '',
    descripcion: '',
    precio: 0,
    precio_costo: 0,
    stock: 0,
    categoria_id: '',
    codigo: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [productosResponse, proveedoresResponse, categoriasResponse] = await Promise.all([
        productosAPI.getAll(),
        proveedoresAPI.getAll(),
        categoriasAPI.getAll()
      ])
      setProductos(Array.isArray(productosResponse.data) ? productosResponse.data : [])
      setProveedores(Array.isArray(proveedoresResponse.data) ? proveedoresResponse.data : [])
      setCategorias(Array.isArray(categoriasResponse.data) ? categoriasResponse.data : [])
    } catch {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const productData = {
        ...newProduct,
        categoria_id: newProduct.categoria_id ? parseInt(newProduct.categoria_id) : undefined
      }
      await productosAPI.create(productData)
      toast.success('Producto creado exitosamente')
      setShowProductModal(false)
      setNewProduct({
        nombre: '',
        descripcion: '',
        precio: 0,
        precio_costo: 0,
        stock: 0,
        categoria_id: '',
        codigo: ''
      })
      fetchData()
    } catch {
      toast.error('Error al crear producto')
    }
  }

  const addToCart = (producto: Producto) => {
    if (!producto.id) {
      toast.error('Producto inválido')
      return
    }
    setCartItems(prev => {
      const existingItem = prev.find(item => item.producto_id === producto.id)
      if (existingItem) {
        return prev.map(item =>
            item.producto_id === producto.id
                ? {
                  ...item,
                  cantidad: item.cantidad + 1,
                  subtotal: (item.cantidad + 1) * Number(item.precio_unitario ?? 0),
                  producto_nombre: producto.nombre
                }
                : item
        )
      } else {
        const newItem: DetalleCompra = {
          producto_id: producto.id!,
          cantidad: 1,
          precio_unitario: Number(producto.precio_costo ?? 0),
          subtotal: Number(producto.precio_costo ?? 0),
          producto_nombre: producto.nombre
        }
        return [newItem, ...prev]
      }
    })
  }

  const updateQuantity = (productoId: number, newQuantity: number) => {
    const producto = productos.find(p => p.id === productoId)
    if (!producto) return
    if (newQuantity <= 0) {
      removeFromCart(productoId)
      return
    }
    setCartItems(prev =>
        prev.map(item =>
            item.producto_id === productoId
                ? {
                  ...item,
                  cantidad: newQuantity,
                  subtotal: newQuantity * Number(item.precio_unitario ?? 0),
                  producto_nombre: producto.nombre
                }
                : item
        )
    )
  }

  const updatePrecioUnitario = (productoId: number, newPrecio: number) => {
    setCartItems(prev =>
        prev.map(item =>
            item.producto_id === productoId
                ? {
                  ...item,
                  precio_unitario: newPrecio,
                  subtotal: item.cantidad * Number(newPrecio ?? 0)
                }
                : item
        )
    )
  }

  const removeFromCart = (productoId: number) => {
    setCartItems(prev => prev.filter(item => item.producto_id !== productoId))
  }

  const getTotal = () => {
    return cartItems.reduce((total, item) => total + Number(item.subtotal ?? 0), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProveedor) {
      toast.error('Debe seleccionar un proveedor')
      return
    }
    if (cartItems.length === 0) {
      toast.error('Debe agregar productos al carrito')
      return
    }
    try {
      await comprasAPI.create({
        proveedor_id: selectedProveedor,
        productos: cartItems,
        total: getTotal()
      })
      const updatedProductos = await productosAPI.getAll()
      setProductos(updatedProductos.data)
      toast.success('Compra registrada exitosamente')
      navigate('/compras')
    } catch {
      toast.error('Error al procesar la compra')
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
      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nueva Compra</h1>
          <p className="text-gray-600">Registra una nueva compra de mercadería</p>
        </div>

        {/* Grid principal - El carrito se moverá abajo en móvil por defecto */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna de Productos (lg:col-span-2) */}
          <div className="lg:col-span-2">
            <div className={cardClass}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Productos Disponibles</h2>

              {/* RESPONSIVE: Filtros y botón se apilan en móvil */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                <input
                    type="text"
                    placeholder="Buscar producto por nombre o código..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    className={`${inputFieldClass} w-full sm:w-1/2`}
                />
                <select
                    value={selectedCategoria}
                    onChange={e => setSelectedCategoria(e.target.value)}
                    className={`${inputFieldClass} w-full sm:w-1/3`}
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map(cat => (
                      <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                  ))}
                </select>
                <button
                    onClick={() => setShowProductModal(true)}
                    className="btn-primary flex items-center justify-center px-4 py-2 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Producto
                </button>
              </div>

              {/* RESPONSIVE: Grid de productos 1 columna en móvil, 2 en md */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {productos
                    .filter(producto =>
                        (!selectedCategoria || producto.categoria_nombre === selectedCategoria) &&
                        (
                            producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                            (producto.codigo ? producto.codigo.toLowerCase().includes(busqueda.toLowerCase()) : false)
                        )
                    )
                    .map(producto => (
                        <div key={producto.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-gray-900">{producto.nombre}</h3>
                            <span className="text-sm font-medium text-gray-900">Stock: {producto.stock}</span>
                          </div>
                          {producto.descripcion && <p className="text-sm text-gray-500 mb-2">{producto.descripcion}</p>}
                          <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Costo actual: {formatPrice(producto.precio_costo)}
                      </span>
                            <button
                                onClick={() => addToCart(producto)}
                                className="btn-primary text-sm py-1 px-3 flex items-center"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                    ))}
              </div>
            </div>
          </div>

          {/* Columna de Carrito (lg:col-span-1) */}
          <div className="lg:col-span-1">
            <div className={cardClass}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Carrito de Compra
              </h2>

              {/* Proveedor */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proveedor *
                </label>
                <select
                    value={selectedProveedor || ''}
                    onChange={e => setSelectedProveedor(e.target.value ? parseInt(e.target.value) : null)}
                    className={inputFieldClass}
                    required
                >
                  <option value="">Seleccionar proveedor</option>
                  {proveedores.map(proveedor => (
                      <option key={proveedor.id} value={proveedor.id}>
                        {proveedor.nombre}
                      </option>
                  ))}
                </select>
              </div>

              {cartItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No hay productos en el carrito</p>
              ) : (
                  <div className="space-y-3">
                    {cartItems.map(item => {
                      const producto = productos.find(p => p.id === item.producto_id)
                      return (
                          <div key={item.producto_id} className="border rounded-lg p-3 bg-gray-50">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 text-base">{producto?.nombre}</h4>
                                <div className="flex flex-wrap items-center gap-x-4 mt-1">
                            <span className="text-xs text-gray-600">
                              Stock: {producto?.stock || 0}
                            </span>
                                  {producto?.categoria_nombre && (
                                      <span className="text-xs text-gray-600 flex items-center">
                                <Tag className='h-3 w-3 mr-1'/> {producto.categoria_nombre}
                              </span>
                                  )}
                                </div>
                              </div>
                              <button
                                  onClick={() => removeFromCart(item.producto_id)}
                                  className="text-red-600 hover:text-red-800 ml-2 p-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            {/* RESPONSIVE: Grid de 3 columnas para móvil (más compacto) */}
                            <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded border">
                              <div className="text-center">
                                <span className="text-xs text-gray-600 block">Cant</span>
                                <div className="flex items-center justify-center space-x-1 mt-1">
                                  <button
                                      onClick={() => updateQuantity(item.producto_id, item.cantidad - 1)}
                                      className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="w-6 text-center text-sm font-medium">{item.cantidad}</span>
                                  <button
                                      onClick={() => updateQuantity(item.producto_id, item.cantidad + 1)}
                                      className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                              <div className="text-center">
                                <span className="text-xs text-gray-600 block">Precio/u</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={item.precio_unitario}
                                    onChange={e => updatePrecioUnitario(item.producto_id, parseFloat(e.target.value) || 0)}
                                    className="w-full text-center border rounded px-1 py-0.5 text-xs mt-1"
                                />
                              </div>
                              <div className="text-center">
                                <span className="text-xs text-gray-600 block">Subtotal</span>
                                <span className="font-bold text-base text-green-600">{formatPrice(Number(item.subtotal).toFixed(2))}</span>
                              </div>
                            </div>
                          </div>
                      )
                    })}
                  </div>
              )}

              {cartItems.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span>{formatPrice(getTotal().toFixed(2))}</span>
                    </div>
                    <button
                        onClick={handleSubmit}
                        className="w-full btn-primary mt-4"
                    >
                      Registrar Compra
                    </button>
                  </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal para crear nuevo producto - Se mantiene el tamaño responsive del Modal de Clientes */}
        {showProductModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-lg shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Nuevo Producto
                  </h3>
                  <form onSubmit={handleCreateProduct} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nombre *
                      </label>
                      <input
                          type="text"
                          required
                          value={newProduct.nombre}
                          onChange={e => setNewProduct({ ...newProduct, nombre: e.target.value })}
                          className={inputFieldClass}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Descripción
                      </label>
                      <textarea
                          value={newProduct.descripcion}
                          onChange={e => setNewProduct({ ...newProduct, descripcion: e.target.value })}
                          className={inputFieldClass}
                          rows={2}
                      />
                    </div>
                    {/* RESPONSIVE: Grid de 2 columnas para Precio */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Precio de venta *
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={newProduct.precio}
                            onChange={e => setNewProduct({ ...newProduct, precio: parseFloat(e.target.value) || 0 })}
                            className={inputFieldClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Precio de costo
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={newProduct.precio_costo}
                            onChange={e => setNewProduct({ ...newProduct, precio_costo: parseFloat(e.target.value) || 0 })}
                            className={inputFieldClass}
                        />
                      </div>
                    </div>
                    {/* RESPONSIVE: Grid de 2 columnas para Stock y Código */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Stock inicial
                        </label>
                        <input
                            type="number"
                            value={newProduct.stock}
                            onChange={e => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                            className={inputFieldClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Código
                        </label>
                        <input
                            type="text"
                            value={newProduct.codigo}
                            onChange={e => setNewProduct({ ...newProduct, codigo: e.target.value })}
                            className={inputFieldClass}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Categoría
                      </label>
                      <select
                          value={newProduct.categoria_id}
                          onChange={e => setNewProduct({ ...newProduct, categoria_id: e.target.value })}
                          className={inputFieldClass}
                      >
                        <option value="">Sin categoría</option>
                        {categorias.map(categoria => (
                            <option key={categoria.id} value={categoria.id}>
                              {categoria.nombre}
                            </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                          type="button"
                          onClick={() => setShowProductModal(false)}
                          className="btn-secondary"
                      >
                        Cancelar
                      </button>
                      <button type="submit" className="btn-primary">
                        Crear Producto
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

export default NuevaCompra