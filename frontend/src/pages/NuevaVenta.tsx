import { useEffect, useState } from 'react'
import { ventasAPI, productosAPI, clientesAPI } from '../services/api'
import { Producto, Cliente, DetalleVenta } from '../services/api'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { Plus, Minus, Trash2 } from 'lucide-react'

const NuevaVenta = () => {
  const navigate = useNavigate()
  const [productos, setProductos] = useState<Producto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [selectedCliente, setSelectedCliente] = useState<number | null>(null)
  const [cartItems, setCartItems] = useState<DetalleVenta[]>([])
  const [loading, setLoading] = useState(true)
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'mercadopago' | 'tarjeta'>('efectivo')
  const [esDeuda, setEsDeuda] = useState(false)

  useEffect(() => {
    Promise.all([productosAPI.getAll(), clientesAPI.getAll()])
      .then(([prodRes, cliRes]) => {
        setProductos(prodRes.data)
        setClientes(cliRes.data)
      })
      .catch(() => toast.error('Error al cargar datos'))
      .finally(() => setLoading(false))
  }, [])

  const addToCart = (producto: Producto) => {
    const existingItem = cartItems.find(item => item.producto_id === producto.id)
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.producto_id === producto.id
          ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * item.precio_unitario }
          : item
      ))
    } else {
      setCartItems([...cartItems, {
        producto_id: producto.id!,
        cantidad: 1,
        precio_unitario: producto.precio || 0,
        subtotal: producto.precio || 0,
        producto_nombre: producto.nombre
      }])
    }
  }

  const addManualItem = () => {
    setCartItems([...cartItems, {
      producto_id: 0,
      cantidad: 1,
      precio_unitario: 0,
      subtotal: 0,
      producto_nombre: 'Nuevo ítem'
    }])
  }

  const updateQuantity = (productoId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productoId)
      return
    }
    setCartItems(cartItems.map(item =>
      item.producto_id === productoId
        ? { ...item, cantidad: newQuantity, subtotal: newQuantity * item.precio_unitario }
        : item
    ))
  }

  const updatePrecioUnitario = (productoId: number, newPrecio: number) => {
    setCartItems(cartItems.map(item =>
      item.producto_id === productoId
        ? { ...item, precio_unitario: newPrecio, subtotal: item.cantidad * newPrecio }
        : item
    ))
  }

  const updateNombreManual = (index: number, nuevoNombre: string) => {
    setCartItems(cartItems.map((item, i) =>
      i === index ? { ...item, producto_nombre: nuevoNombre } : item
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
      toast.error('Debe agregar productos o ítems')
      return
    }
    try {
      await ventasAPI.create({
        cliente_id: selectedCliente ? Number(selectedCliente) : undefined,
        productos: cartItems,
        total: getTotal(),
        metodo_pago: metodoPago,
        estado: esDeuda ? 'pendiente' : 'completada'
      })
      toast.success('Venta registrada exitosamente')
      navigate('/ventas')
    } catch {
      toast.error('Error al registrar venta')
    }
  }

  if (loading) return <div>Cargando...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nueva Venta</h1>

      <div>
        <label>Cliente</label>
        <select
          value={selectedCliente || ''}
          onChange={e => setSelectedCliente(e.target.value ? parseInt(e.target.value) : null)}
          className="input-field"
        >
          <option value="">Venta sin cliente</option>
          {clientes.map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      <div>
        <label>Método de pago</label>
        <select
          value={metodoPago}
          onChange={e => setMetodoPago(e.target.value as 'efectivo' | 'mercadopago' | 'tarjeta')}
          className="input-field"
        >
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="mercadopago">MercadoPago</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={esDeuda}
          onChange={e => setEsDeuda(e.target.checked)}
        />
        <label>Venta a crédito (pendiente de pago)</label>
      </div>

      <div>
        <h2>Productos</h2>
        <div className="grid grid-cols-2 gap-2">
          {productos.map(p => (
            <button key={p.id} onClick={() => addToCart(p)} className="btn-secondary">
              {p.nombre} - ${p.precio}
            </button>
          ))}
        </div>
        <button onClick={addManualItem} className="btn-primary mt-2">Agregar nuevo ítem</button>
      </div>

      <div>
        <h2>Carrito</h2>
        {cartItems.length === 0 && <p>No hay ítems</p>}
        {cartItems.map((item, index) => (
          <div key={index} className="flex gap-2 items-center">
            <input
              type="text"
              value={item.producto_nombre}
              onChange={e => updateNombreManual(index, e.target.value)}
              className="input-field"
            />
            <input
              type="number"
              value={item.cantidad}
              onChange={e => updateQuantity(item.producto_id ?? 0, parseInt(e.target.value) || 0)}
              className="input-field w-16"
            />
            <input
              type="number"
              value={item.precio_unitario}
              onChange={e => updatePrecioUnitario(item.producto_id ?? 0, parseFloat(e.target.value) || 0)}
              className="input-field w-20"
            />
            <span>${item.subtotal.toFixed(2)}</span>
            <button onClick={() => removeFromCart(item.producto_id ?? 0)} className="text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div>
        <h2>Total: ${getTotal().toFixed(2)}</h2>
        <button onClick={handleSubmit} className="btn-primary w-full mt-4">Registrar Venta</button>
      </div>
    </div>
  )
}

export default NuevaVenta
