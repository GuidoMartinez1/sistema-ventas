// src/pages/NuevaVenta.tsx
import { useEffect, useMemo, useState } from 'react'
import { Plus, Minus, Trash2, DollarSign, FilePlus2 } from 'lucide-react'
import { productosAPI, clientesAPI, ventasAPI } from '../services/api'
import { Producto, Cliente, DetalleVenta } from '../services/api'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const NuevaVenta = () => {
  const navigate = useNavigate()
  const [productos, setProductos] = useState<Producto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [selectedCliente, setSelectedCliente] = useState<number | ''>('')
  const [cartItems, setCartItems] = useState<DetalleVenta[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [importeDirecto, setImporteDirecto] = useState<number>(0)
  const [nuevoItem, setNuevoItem] = useState({ descripcion: '', cantidad: 1, precio: 0 })
  const [esDeuda, setEsDeuda] = useState(false)
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'tarjeta' | 'mercadopago'>('efectivo')

  useEffect(() => {
    const load = async () => {
      try {
        const [prodRes, cliRes] = await Promise.all([productosAPI.getAll(), clientesAPI.getAll()])
        setProductos(Array.isArray(prodRes.data) ? prodRes.data : [])
        setClientes(Array.isArray(cliRes.data) ? cliRes.data : [])
      } catch {
        toast.error('Error al cargar datos')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const addProducto = (producto: Producto) => {
    if (!producto?.id) {
      toast.error('Producto inválido')
      return
    }
  
    setCartItems(prev => {
      const item = prev.find(i => i.producto_id === producto.id)
      if (item) {
        if (item.cantidad + 1 > (producto.stock || 0)) {
          toast.error(`Stock insuficiente. Disponible: ${producto.stock || 0}`)
          return prev
        }
        const cantidad = item.cantidad + 1
        const precio = Number(producto.precio ?? 0)
        return prev.map(i =>
          i.producto_id === producto.id
            ? { ...i, cantidad, precio_unitario: precio, subtotal: cantidad * precio, producto_nombre: producto.nombre }
            : i
        )
      }
      if ((producto.stock || 0) < 1) {
        toast.error(`No hay stock disponible`)
        return prev
      }
      const precio = Number(producto.precio ?? 0)
      const nuevo: DetalleVenta = {
        producto_id: producto.id,
        cantidad: 1,
        precio_unitario: precio,
        subtotal: precio,
        producto_nombre: producto.nombre
      }
      return [...prev, nuevo]
    })
  }

  const addImporteDirecto = () => {
    const monto = Number(importeDirecto || 0)
    if (monto <= 0) {
      toast.error('Ingrese un importe válido')
      return
    }
    const item: DetalleVenta = {
      cantidad: 1,
      precio_unitario: monto,
      subtotal: monto,
      descripcion: 'Importe directo',
      es_custom: true
    }
    setCartItems(prev => [...prev, item])
    setImporteDirecto(0)
  }

  const addNuevoItem = () => {
    const desc = (nuevoItem.descripcion || '').trim()
    const cant = Number(nuevoItem.cantidad || 0)
    const precio = Number(nuevoItem.precio || 0)
    if (!desc) {
      toast.error('Ingrese una descripción')
      return
    }
    if (cant <= 0 || precio < 0) {
      toast.error('Cantidad o precio inválidos')
      return
    }
    const item: DetalleVenta = {
      cantidad: cant,
      precio_unitario: precio,
      subtotal: cant * precio,
      descripcion: desc,
      es_custom: true
    }
    setCartItems(prev => [...prev, item])
    setNuevoItem({ descripcion: '', cantidad: 1, precio: 0 })
  }

  const updateCantidad = (idx: number, cant: number) => {
    const item = cartItems[idx]
    const producto = productos.find(p => p.id === item.producto_id)
  
    if (cant <= 0) {
      removeItem(idx)
      return
    }
  
    if (producto && cant > (producto.stock || 0)) {
      toast.error(`Stock insuficiente. Disponible: ${producto.stock || 0}`)
      return
    }
  
    setCartItems(prev =>
      prev.map((it, i) =>
        i === idx ? { ...it, cantidad: cant, subtotal: cant * Number(it.precio_unitario || 0) } : it
      )
    )
  }
  

  const updatePrecio = (idx: number, precio: number) => {
    if (precio < 0) precio = 0
    setCartItems(prev =>
      prev.map((it, i) =>
        i === idx ? { ...it, precio_unitario: precio, subtotal: it.cantidad * Number(precio || 0) } : it
      )
    )
  }

  const removeItem = (idx: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== idx))
  }

  const total = useMemo(
    () => cartItems.reduce((acc, it) => acc + Number(it.subtotal || 0), 0),
    [cartItems]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cartItems.length === 0) {
      toast.error('Agregá al menos un ítem')
      return
    }

    if (esDeuda && !selectedCliente) {
      toast.error('Para registrar una deuda, seleccioná un cliente')
      return
    }

    try {
      const payload = {
        cliente_id: selectedCliente ? Number(selectedCliente) : undefined,
        productos: cartItems.map(d => ({
          producto_id: d.producto_id,
          cantidad: Number(d.cantidad),
          precio_unitario: Number(d.precio_unitario),
          subtotal: Number(d.subtotal),
          producto_nombre: d.producto_nombre,
          descripcion: d.descripcion,
          es_custom: d.es_custom === true
        })),
        total: Number(total),
        estado: esDeuda ? 'adeuda' : 'completada',
        metodo_pago: metodoPago
      }
      await ventasAPI.create(payload)
      toast.success(esDeuda ? 'Venta registrada como deuda' : 'Venta registrada')
      navigate(esDeuda ? '/deudas' : '/ventas')
    } catch {
      toast.error('Error al registrar la venta')
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
        <p className="text-gray-600">Vendé productos o cobrá importes directos</p>
      </div>

      {/* Selección de cliente */}
      <div className="card">
        <label className="block text-sm font-medium text-gray-700 mb-2">Cliente (opcional)</label>
        <select
          value={selectedCliente}
          onChange={(e) => setSelectedCliente(e.target.value ? Number(e.target.value) : '')}
          className="input-field w-full md:w-1/2"
        >
          <option value="">Sin cliente</option>
          {clientes.map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {/* Toggle de deuda */}
      <div className="card flex items-center gap-3">
        <input
          id="toggle-deuda"
          type="checkbox"
          checked={esDeuda}
          onChange={() => setEsDeuda(!esDeuda)}
          className="h-4 w-4"
        />
        <label htmlFor="toggle-deuda" className="text-sm text-gray-700">
          Marcar venta como <strong>pendiente / deuda</strong>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: productos */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
              <input
                type="text"
                placeholder="Buscar producto por nombre o código..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="input-field w-full md:w-1/2"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productos
                .filter(p =>
                  (p.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
                  (p.codigo || '').toLowerCase().includes(busqueda.toLowerCase())
                )
                .map((p) => (
                  <div key={p.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{p.nombre}</h3>
                      <span className="text-sm font-medium text-gray-900">${Number(p.precio || 0).toFixed(2)}</span>
                    </div>
                    {p.descripcion && <p className="text-sm text-gray-500 mb-2">{p.descripcion}</p>}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Stock: {p.stock}</span>
                      <button onClick={() => addProducto(p)} className="btn-primary text-sm py-1 px-3">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Columna derecha: carrito / custom */}
        <div className="lg:col-span-1">
          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Carrito</h2>

            {/* Importe directo */}
            <div className="border rounded p-3">
              <div className="flex items-center mb-2">
                <DollarSign className="h-4 w-4 mr-2" />
                <span className="font-medium">Importe directo</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={importeDirecto}
                  onChange={e => setImporteDirecto(Number(e.target.value || 0))}
                  className="input-field flex-1"
                  placeholder="Monto"
                />
                <button onClick={addImporteDirecto} className="btn-primary">
                  Agregar
                </button>
              </div>
            </div>


            {/* Items */}
            {cartItems.length === 0 ? (
              <p className="text-gray-500 text-center py-6">No hay ítems en el carrito</p>
            ) : (
              <div className="space-y-3">
                {cartItems.map((it, idx) => (
                  <div key={idx} className="border rounded p-3 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-gray-900">
                        {it.es_custom ? (it.descripcion || 'Ítem') : (it.producto_nombre || 'Producto')}
                      </div>
                      <button onClick={() => removeItem(idx)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded border">
                      <div className="text-center">
                        <span className="text-xs text-gray-600 block">Cantidad</span>
                        <div className="flex items-center justify-center space-x-2 mt-1">
                          <button
                            onClick={() => updateCantidad(idx, it.cantidad - 1)}
                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center font-medium">{it.cantidad}</span>
                          <button
                            onClick={() => updateCantidad(idx, it.cantidad + 1)}
                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="text-xs text-gray-600 block">Precio unitario</span>
                        <input
                          type="number"
                          step="0.01"
                          value={it.precio_unitario}
                          onChange={(e) => updatePrecio(idx, Number(e.target.value || 0))}
                          className="w-full text-center border rounded px-2 py-1 text-sm mt-1"
                        />
                      </div>
                      <div className="text-center">
                        <span className="text-xs text-gray-600 block">Subtotal</span>
                        <span className="font-bold text-lg text-green-600">
                          ${Number(it.subtotal).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Método de pago */}
            {cartItems.length > 0 && (
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Método de pago
                </label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value as 'efectivo' | 'tarjeta' | 'mercadopago')}
                  className="input-field w-full"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="mercadopago">MercadoPago</option>
                </select>
              </div>
            )}

            {/* Total & Submit */}
            {cartItems.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span>${Number(total).toFixed(2)}</span>
                </div>
                <button onClick={handleSubmit} className="w-full btn-primary mt-4">
                  Registrar Venta
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
