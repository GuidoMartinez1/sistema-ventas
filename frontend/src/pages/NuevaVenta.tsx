import { useEffect, useState } from 'react'
import { ShoppingCart, DollarSign, AlertTriangle, Trash2 } from 'lucide-react'
import { Producto, Cliente, Venta, clientesAPI, productosAPI, ventasAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function Ventas() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [carrito, setCarrito] = useState<{ producto: Producto; cantidad: number }[]>([])
  const [selectedCliente, setSelectedCliente] = useState<number | ''>('')
  const [esDeuda, setEsDeuda] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productosRes, clientesRes] = await Promise.all([
          productosAPI.getAll(),
          clientesAPI.getAll(),
        ])
        setProductos(productosRes)
        setClientes(clientesRes)
      } catch (error) {
        toast.error('Error al cargar datos')
      }
    }
    fetchData()
  }, [])

  const agregarAlCarrito = (producto: Producto) => {
    setCarrito(prev => {
      const existe = prev.find(item => item.producto.id === producto.id)
      if (existe) {
        return prev.map(item =>
            item.producto.id === producto.id
                ? { ...item, cantidad: item.cantidad + 1 }
                : item
        )
      }
      return [...prev, { producto, cantidad: 1 }]
    })
  }

  const eliminarDelCarrito = (id: number) => {
    setCarrito(prev => prev.filter(item => item.producto.id !== id))
  }

  const cambiarCantidad = (id: number, cantidad: number) => {
    if (cantidad <= 0) return
    setCarrito(prev =>
        prev.map(item =>
            item.producto.id === id ? { ...item, cantidad } : item
        )
    )
  }

  const total = carrito.reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0)

  const registrarVenta = async () => {
    if (carrito.length === 0) {
      toast.error('El carrito está vacío')
      return
    }
    try {
      const nuevaVenta: Partial<Venta> = {
        cliente_id: selectedCliente || null,
        productos: carrito.map(item => ({
          producto_id: item.producto.id,
          cantidad: item.cantidad,
        })),
        total,
        estado: esDeuda ? 'pendiente' : 'completada',
      }

      await ventasAPI.create(nuevaVenta)
      toast.success('Venta registrada')
      setCarrito([])
      setSelectedCliente('')
      setEsDeuda(false)
    } catch (error) {
      toast.error('Error al registrar venta')
    }
  }

  return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-indigo-600" />
          Ventas
        </h1>

        {/* Cliente + deuda en una sola card */}
        <div className="card flex flex-col md:flex-row md:items-center justify-between w-full">
          <div className="flex items-center gap-4 w-full md:w-1/2">
            <label className="block text-sm font-medium text-gray-700">Cliente (opcional)</label>
            <select
                value={selectedCliente}
                onChange={(e) => setSelectedCliente(e.target.value ? Number(e.target.value) : '')}
                className="input-field flex-1 max-w-sm"
            >
              <option value="">Sin cliente</option>
              {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center mt-4 md:mt-0">
            <input
                id="toggle-deuda"
                type="checkbox"
                checked={esDeuda}
                onChange={() => setEsDeuda(!esDeuda)}
                className="h-4 w-4"
            />
            <label htmlFor="toggle-deuda" className="ml-2 text-sm text-gray-700">
              Marcar venta como <strong>pendiente / deuda</strong>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Columna izquierda: productos */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Productos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {productos.map((producto) => (
                    <div key={producto.id} className="card hover:shadow-md transition">
                      <h3 className="font-medium">{producto.nombre}</h3>
                      <p className="text-sm text-gray-500">${producto.precio}</p>
                      {producto.stock <= 5 && (
                          <p className="text-xs text-red-600 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Stock bajo: {producto.stock}
                          </p>
                      )}
                      <button
                          onClick={() => agregarAlCarrito(producto)}
                          className="btn-primary mt-2 w-full"
                      >
                        Agregar
                      </button>
                    </div>
                ))}
              </div>
            </div>
          </div>

          {/* Columna derecha: carrito */}
          <div className="lg:col-span-1">
            <div className="card space-y-4 sticky top-0">
              <h2 className="text-lg font-semibold text-gray-900">Carrito</h2>
              {carrito.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay productos en el carrito</p>
              ) : (
                  <div className="space-y-2">
                    {carrito.map(item => (
                        <div key={item.producto.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{item.producto.nombre}</p>
                            <p className="text-xs text-gray-500">
                              ${item.producto.precio} x {item.cantidad}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={item.cantidad}
                                min="1"
                                onChange={(e) => cambiarCantidad(item.producto.id, Number(e.target.value))}
                                className="w-16 border rounded p-1 text-sm"
                            />
                            <button
                                onClick={() => eliminarDelCarrito(item.producto.id)}
                                className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                    ))}
                  </div>
              )}

              <div className="flex items-center justify-between border-t pt-2">
                <span className="font-semibold">Total:</span>
                <span className="text-lg font-bold">${total}</span>
              </div>

              <button
                  onClick={registrarVenta}
                  className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <DollarSign className="h-5 w-5" />
                Registrar Venta
              </button>
            </div>
          </div>
        </div>
      </div>
  )
}
