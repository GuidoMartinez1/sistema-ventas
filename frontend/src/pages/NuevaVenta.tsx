import { useEffect, useState } from 'react'
import { Plus, Minus, Trash2, ShoppingCart } from 'lucide-react'
import { productosAPI, clientesAPI, ventasAPI } from '../services/api'
import { Producto, Cliente, DetalleVenta } from '../services/api'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const NuevaVenta = () => {
  const navigate = useNavigate()
  const [productos, setProductos] = useState<Producto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [selectedCliente, setSelectedCliente] = useState<number | null>(null)
  const [cartItems, setCartItems] = useState<DetalleVenta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [productosResponse, clientesResponse] = await Promise.all([
        productosAPI.getAll(),
        clientesAPI.getAll()
      ])
      setProductos(productosResponse.data)
      setClientes(clientesResponse.data)
    } catch (error) {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (producto: Producto) => {
    const existingItem = cartItems.find(item => item.producto_id === producto.id)
    
    if (existingItem) {
      if (existingItem.cantidad >= producto.stock) {
        toast.error('No hay suficiente stock disponible')
        return
      }
      
      setCartItems(cartItems.map(item => 
        item.producto_id === producto.id 
          ? { 
              ...item, 
              cantidad: item.cantidad + 1, 
              subtotal: (item.cantidad + 1) * item.precio_unitario,
              producto_nombre: producto.nombre
            }
          : item
      ))
    } else {
      if (producto.stock <= 0) {
        toast.error('Producto sin stock disponible')
        return
      }
      
      const newItem: DetalleVenta = {
        producto_id: producto.id!,
        cantidad: 1,
        precio_unitario: producto.precio,
        subtotal: producto.precio,
        producto_nombre: producto.nombre
      }
      setCartItems([...cartItems, newItem])
    }
  }

  const updateQuantity = (productoId: number, newQuantity: number) => {
    const producto = productos.find(p => p.id === productoId)
    if (!producto) return

    if (newQuantity > producto.stock) {
      toast.error('No hay suficiente stock disponible')
      return
    }

    if (newQuantity <= 0) {
      removeFromCart(productoId)
      return
    }

    setCartItems(cartItems.map(item => 
      item.producto_id === productoId 
        ? { 
            ...item, 
            cantidad: newQuantity, 
            subtotal: newQuantity * item.precio_unitario,
            producto_nombre: producto.nombre
          }
        : item
    ))
  }

  const removeFromCart = (productoId: number) => {
    setCartItems(cartItems.filter(item => item.producto_id !== productoId))
  }

  const getTotal = () => {
    return cartItems.reduce((total, item) => total + item.subtotal, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (cartItems.length === 0) {
      toast.error('Debes agregar al menos un producto')
      return
    }

    try {
      const ventaData = {
        cliente_id: selectedCliente,
        productos: cartItems,
        total: getTotal()
      }
      
      console.log('🛒 Datos de la venta a enviar:', ventaData)
      console.log('📦 Productos en el carrito:', cartItems)
      
      await ventasAPI.create(ventaData)
      
      toast.success('Venta creada exitosamente')
      navigate('/ventas')
    } catch (error) {
      console.error('❌ Error al crear venta:', error)
      toast.error('Error al crear la venta')
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Nueva Venta</h1>
        <p className="text-gray-600">Crea una nueva venta</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productos */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Productos Disponibles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productos.map((producto) => (
                <div key={producto.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{producto.nombre}</h3>
                    <span className="text-sm font-medium text-gray-900">${producto.precio}</span>
                  </div>
                  {producto.descripcion && (
                    <p className="text-sm text-gray-500 mb-2">{producto.descripcion}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      producto.stock > 10 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      Stock: {producto.stock}
                    </span>
                    <button
                      onClick={() => addToCart(producto)}
                      disabled={producto.stock <= 0}
                      className="btn-primary text-sm py-1 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Carrito */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Carrito
            </h2>

            {/* Cliente */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente (opcional)
              </label>
              <select
                value={selectedCliente || ''}
                onChange={(e) => setSelectedCliente(e.target.value ? parseInt(e.target.value) : null)}
                className="input-field"
              >
                <option value="">Sin cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Items del carrito */}
            {cartItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay productos en el carrito</p>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item) => {
                  const producto = productos.find(p => p.id === item.producto_id)
                  return (
                    <div key={item.producto_id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{producto?.nombre}</h4>
                          <p className="text-sm text-gray-500">${item.precio_unitario} c/u</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.producto_id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.producto_id, item.cantidad - 1)}
                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center">{item.cantidad}</span>
                          <button
                            onClick={() => updateQuantity(item.producto_id, item.cantidad + 1)}
                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="font-medium">${item.subtotal}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Total */}
            {cartItems.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span>${getTotal().toLocaleString()}</span>
                </div>
                <button
                  onClick={handleSubmit}
                  className="w-full btn-primary mt-4"
                >
                  Completar Venta
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