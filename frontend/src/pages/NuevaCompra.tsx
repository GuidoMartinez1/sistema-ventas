import { useEffect, useState } from 'react'
import { Plus, Minus, Trash2, ShoppingCart } from 'lucide-react'
import { productosAPI, proveedoresAPI, comprasAPI, categoriasAPI } from '../services/api'
import { Producto, Proveedor, DetalleCompra, Categoria } from '../services/api'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

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
    } catch (error) {
      console.error('Error fetching data:', error)
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
    try {
      if (!producto || !producto.id) {
        toast.error('Producto inválido')
        return
      }
      const existingItem = cartItems.find(item => item.producto_id === producto.id)
      if (existingItem) {
        const newQuantity = existingItem.cantidad + 1
        const newSubtotal = newQuantity * Number(existingItem.precio_unitario ?? 0)
        setCartItems(prev =>
          prev.map(item =>
            item.producto_id === producto.id
              ? { ...item, cantidad: newQuantity, subtotal: newSubtotal, producto_nombre: producto.nombre || 'Sin nombre' }
              : item
          )
        )
      } else {
        const newItem: DetalleCompra = {
          producto_id: producto.id,
          cantidad: 1,
          precio_unitario: Number(producto.precio_costo ?? 0),
          subtotal: Number(producto.precio_costo ?? 0),
          producto_nombre: producto.nombre || 'Sin nombre'
        }
        setCartItems(prev => [...prev, newItem])
      }
    } catch {
      toast.error('Error al agregar producto al carrito')
    }
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
          ? { ...item, cantidad: newQuantity, subtotal: newQuantity * Number(item.precio_unitario ?? 0), producto_nombre: producto.nombre }
          : item
      )
    )
  }

  const updatePrecioUnitario = (productoId: number, newPrecio: number) => {
    setCartItems(prev =>
      prev.map(item =>
        item.producto_id === productoId
          ? { ...item, precio_unitario: newPrecio, subtotal: item.cantidad * Number(newPrecio ?? 0) }
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
      toast.success('Compra registrada exitosamente')
      navigate('/compras')
    } catch {
      toast.error('Error al procesar la compra')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Nueva Compra</h1>
        <p className="text-gray-600">Registra una nueva compra de mercadería</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Productos Disponibles</h2>
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
              <input
                type="text"
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="input-field w-full md:w-1/2"
              />
              <select
                value={selectedCategoria}
                onChange={e => setSelectedCategoria(e.target.value)}
                className="input-field w-full md:w-1/3"
              >
                <option value="">Todas</option>
                {Array.from(new Set(productos.map(p => p.categoria_nombre || '').filter(Boolean))).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button onClick={() => setShowProductModal(true)} className="btn-primary flex items-center justify-center px-4 py-2">
                <Plus className="h-4 w-4 mr-2" /> Agregar Producto
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productos
                .filter(producto =>
                  (!selectedCategoria || (producto.categoria_nombre || '') === selectedCategoria) &&
                  ((producto.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ?? false) ||
                   (producto.codigo?.toLowerCase().includes(busqueda.toLowerCase()) ?? false))
                )
                .map(producto => (
                  <div key={producto.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{producto.nombre || 'Sin nombre'}</h3>
                      <span className="text-sm font-medium text-gray-900">
                        Stock: {producto.stock || 0}
                      </span>
                    </div>
                    {producto.descripcion && <p className="text-sm text-gray-500 mb-2">{producto.descripcion}</p>}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Costo actual: ${Number(producto.precio_costo ?? 0).toFixed(2)}
                      </span>
                      <button onClick={() => addToCart(producto)} className="btn-primary text-sm py-1 px-3">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" /> Carrito de Compra
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Proveedor *</label>
              <select
                value={selectedProveedor || ''}
                onChange={e => setSelectedProveedor(e.target.value ? parseInt(e.target.value) : null)}
                className="input-field"
              >
                <option value="">Seleccionar</option>
                {proveedores.map(proveedor => (
                  <option key={proveedor.id} value={proveedor.id}>{proveedor.nombre}</option>
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
                          <h4 className="font-medium text-gray-900 text-lg">{producto?.nombre || item.producto_nombre || 'Sin nombre'}</h4>
                        </div>
                        <button onClick={() => removeFromCart(item.producto_id)} className="text-red-600 hover:text-red-800 ml-2">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-4 bg-white p-3 rounded border">
                        <div className="text-center">
                          <span className="text-sm text-gray-600 block">Cantidad</span>
                          <div className="flex items-center justify-center space-x-2 mt-1">
                            <button onClick={() => updateQuantity(item.producto_id, item.cantidad - 1)} className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300">
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center font-medium">{item.cantidad}</span>
                            <button onClick={() => updateQuantity(item.producto_id, item.cantidad + 1)} className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300">
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <div className="text-center">
                          <span className="text-sm text-gray-600 block">Precio unitario</span>
                          <input
                            type="number"
                            step="0.01"
                            value={item.precio_unitario}
                            onChange={e => updatePrecioUnitario(item.producto_id, parseFloat(e.target.value) || 0)}
                            className="w-full text-center border rounded px-2 py-1 text-sm mt-1"
                          />
                        </div>
                        <div className="text-center">
                          <span className="text-sm text-gray-600 block">Subtotal</span>
                          <span className="font-bold text-lg text-green-600">
                            ${Number(item.subtotal ?? 0).toFixed(2)}
                          </span>
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
                  <span>${getTotal().toFixed(2)}</span>
                </div>
                <button onClick={handleSubmit} className="w-full btn-primary mt-4">Registrar Compra</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NuevaCompra
