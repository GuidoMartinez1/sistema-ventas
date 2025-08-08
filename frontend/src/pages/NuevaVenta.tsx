import { useEffect, useState } from 'react'
import { Plus, Minus, Trash2, ShoppingCart } from 'lucide-react'
import { productosAPI, clientesAPI, ventasAPI, categoriasAPI } from '../services/api'
import { Producto, Cliente, DetalleVenta, Categoria } from '../services/api'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const NuevaVenta = () => {
  const navigate = useNavigate()
  const [productos, setProductos] = useState<Producto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [selectedCategoria, setSelectedCategoria] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [selectedCliente, setSelectedCliente] = useState<number | null>(null)
  const [cartItems, setCartItems] = useState<DetalleVenta[]>([])
  const [loading, setLoading] = useState(true)
  const [esDeuda, setEsDeuda] = useState(false)
  const [importeDirecto, setImporteDirecto] = useState<number>(0)
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'mercadopago' | 'tarjeta'>('efectivo')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [productosResponse, clientesResponse, categoriasResponse] = await Promise.all([
        productosAPI.getAll(),
        clientesAPI.getAll(),
        categoriasAPI.getAll()
      ])
      setProductos(Array.isArray(productosResponse.data) ? productosResponse.data : [])
      setClientes(Array.isArray(clientesResponse.data) ? clientesResponse.data : [])
      setCategorias(Array.isArray(categoriasResponse.data) ? categoriasResponse.data : [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
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
        if (existingItem.cantidad >= (producto.stock || 0)) {
          toast.error('No hay suficiente stock disponible')
          return
        }
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
        if ((producto.stock || 0) <= 0) {
          toast.error('Producto sin stock disponible')
          return
        }
        const newItem: DetalleVenta = {
          producto_id: producto.id,
          cantidad: 1,
          precio_unitario: Number(producto.precio ?? 0),
          subtotal: Number(producto.precio ?? 0),
          producto_nombre: producto.nombre || 'Sin nombre'
        }
        setCartItems(prev => [...prev, newItem])
      }
    } catch {
      toast.error('Error al agregar producto al carrito')
    }
  }

  const addCustomItem = () => {
    const customItem: DetalleVenta = {
      producto_id: -1,
      cantidad: 1,
      precio_unitario: 0,
      subtotal: 0,
      producto_nombre: 'Sin producto'
    }
    setCartItems(prev => [...prev, customItem])
  }

  const updateQuantity = (productoId: number, newQuantity: number) => {
    const producto = productos.find(p => p.id === productoId)
    if (productoId === -1) {
      if (newQuantity <= 0) {
        removeFromCart(productoId)
        return
      }
      setCartItems(prev =>
        prev.map(item =>
          item.producto_id === productoId
            ? { ...item, cantidad: newQuantity, subtotal: newQuantity * Number(item.precio_unitario ?? 0) }
            : item
        )
      )
      return
    }
    if (!producto) return
    if (newQuantity > (producto.stock || 0)) {
      toast.error('No hay suficiente stock disponible')
      return
    }
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
    const cartTotal = cartItems.reduce((total, item) => total + Number(item.subtotal ?? 0), 0)
    return cartTotal + Number(importeDirecto ?? 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (esDeuda && !selectedCliente) {
      toast.error('Debe seleccionar un cliente para registrar una deuda')
      return
    }
    if (cartItems.length === 0) {
      if (!importeDirecto || importeDirecto <= 0) {
        toast.error('Debe agregar productos al carrito o especificar un importe')
        return
      }
    }
    try {
      await ventasAPI.create({
        cliente_id: selectedCliente || undefined,
        productos: cartItems,
        total: cartItems.length > 0 ? getTotal() : importeDirecto,
        estado: esDeuda ? 'adeuda' : 'completada',
        metodo_pago: metodoPago
      })
      toast.success(esDeuda ? 'Venta registrada como deuda' : 'Venta completada exitosamente')
      navigate('/ventas')
    } catch {
      toast.error('Error al procesar la venta')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Nueva Venta</h1>
        <p className="text-gray-600">Crea una nueva venta</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Productos Disponibles</h2>
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
              <input
                type="text"
                placeholder="Buscar producto por nombre o código..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="input-field w-full md:w-1/2"
              />
              <select
                value={selectedCategoria}
                onChange={e => setSelectedCategoria(e.target.value)}
                className="input-field w-full md:w-1/3"
              >
                <option value="">Todas las categorías</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productos
                .filter(producto =>
                  (!selectedCategoria || (producto.categoria_id && producto.categoria_id === Number(selectedCategoria))) &&
                  ((producto.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ?? false) ||
                   (producto.codigo?.toLowerCase().includes(busqueda.toLowerCase()) ?? false))
                )
                .map(producto => (
                  <div key={producto.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{producto.nombre || 'Sin nombre'}</h3>
                      <span className="text-sm font-medium text-gray-900">
                        ${Number(producto.precio ?? 0).toFixed(2)}
                      </span>
                    </div>
                    {producto.descripcion && <p className="text-sm text-gray-500 mb-2">{producto.descripcion}</p>}
                    <div className="flex justify-between items-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        (producto.stock || 0) > 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        Stock: {producto.stock || 0}
                      </span>
                      <button
                        onClick={() => addToCart(producto)}
                        disabled={(producto.stock || 0) <= 0}
                        className="btn-primary text-sm py-1 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900">Sin producto</h3>
                  <span className="text-sm font-medium text-gray-500">Importe directo</span>
                </div>
                <p className="text-sm text-gray-500 mb-2">Agregar un item con importe personalizado</p>
                <div className="flex justify-end">
                  <button onClick={addCustomItem} className="btn-primary text-sm py-1 px-3">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" /> Carrito
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Cliente (opcional)</label>
              <select
                value={selectedCliente || ''}
                onChange={e => setSelectedCliente(e.target.value ? parseInt(e.target.value) : null)}
                className="input-field"
              >
                <option value="">Sin cliente</option>
                {clientes.map(cliente => (
                  <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={esDeuda}
                  onChange={e => setEsDeuda(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Marcar como deuda</span>
              </label>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
              <select
                value={metodoPago}
                onChange={e => setMetodoPago(e.target.value as 'efectivo' | 'mercadopago' | 'tarjeta')}
                className="input-field"
              >
                <option value="efectivo">Efectivo</option>
                <option value="mercadopago">Mercado Pago</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Importe directo (opcional)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={importeDirecto}
                onChange={e => setImporteDirecto(parseFloat(e.target.value) || 0)}
                className="input-field"
              />
            </div>
            {cartItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay productos en el carrito</p>
            ) : (
              <div className="space-y-3">
                {cartItems.map(item => {
                  const producto = productos.find(p => p.id === item.producto_id)
                  const isCustomItem = item.producto_id === -1
                  return (
                    <div key={item.producto_id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {isCustomItem ? 'Sin producto' : (producto?.nombre || item.producto_nombre || 'Sin nombre')}
                          </h4>
                          {isCustomItem ? (
                            <div className="flex items-center space-x-2 mt-1">
                              <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={item.precio_unitario}
                                onChange={e => updatePrecioUnitario(item.producto_id, parseFloat(e.target.value) || 0)}
                                className="w-20 text-sm border rounded px-2 py-1"
                              />
                              <span className="text-sm text-gray-500">c/u</span>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">
                              ${Number(item.precio_unitario ?? 0).toFixed(2)} c/u
                            </p>
                          )}
                        </div>
                        <button onClick={() => removeFromCart(item.producto_id)} className="text-red-600 hover:text-red-800">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button onClick={() => updateQuantity(item.producto_id, item.cantidad - 1)} className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center">{item.cantidad}</span>
                          <button onClick={() => updateQuantity(item.producto_id, item.cantidad + 1)} className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="font-medium">
                          ${Number(item.subtotal ?? 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {(cartItems.length > 0 || importeDirecto > 0) && (
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span>${getTotal().toFixed(2)}</span>
                </div>
                <button
                  onClick={handleSubmit}
                  className={`w-full mt-4 px-4 py-2 rounded-lg font-medium transition-colors ${
                    esDeuda ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'btn-primary'
                  }`}
                >
                  {esDeuda ? 'Registrar Deuda' : 'Completar Venta'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NuevaVenta