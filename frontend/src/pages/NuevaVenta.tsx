// src/pages/NuevaVenta.tsx
import { useEffect, useMemo, useState, useRef } from 'react'
import { Plus, Minus, Trash2, DollarSign, Camera } from 'lucide-react'
import { productosAPI, clientesAPI, ventasAPI } from '../services/api'
import { Producto, Cliente, DetalleVenta } from '../services/api'
import toast from 'react-hot-toast'
import { useNavigate, useLocation } from 'react-router-dom'
import html2canvas from 'html2canvas'

// Clases de utilidad
const cardClass = "bg-white shadow-lg rounded-xl p-4 md:p-6";
const inputFieldClass = "w-full border border-gray-300 p-2 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition duration-150 ease-in-out text-sm";


const formatPrice = (value: number | string | undefined) => {
    if (value === null || value === undefined || value === '') return '$0';
    return '$' + Number(value).toLocaleString("es-AR");
};

const NuevaVenta = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const montoRef = useRef<HTMLInputElement>(null)
    const ticketRef = useRef<HTMLDivElement>(null) // Referencia para la captura
    const [productos, setProductos] = useState<Producto[]>([])
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [selectedCliente, setSelectedCliente] = useState<number | ''>('')
    const [cartItems, setCartItems] = useState<DetalleVenta[]>([])
    const [loading, setLoading] = useState(true)
    const [busqueda, setBusqueda] = useState('')
    const [importeDirecto, setImporteDirecto] = useState<string>('')
    const [nuevoItem, setNuevoItem] = useState({ descripcion: '', cantidad: 1, precio: 0 })
    const [esDeuda, setEsDeuda] = useState(false)
    const [metodoPago, setMetodoPago] = useState<'efectivo' | 'tarjeta' | 'mercadopago'>('efectivo')
    const [nombreClienteInput, setNombreClienteInput] = useState('')
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false)

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

    // Si vengo desde el botón flotante, enfoco el campo "Importe directo"
    useEffect(() => {
        if (location.state?.focusMonto && montoRef.current) {
            montoRef.current.focus()
        }
    }, [location.state])

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
            return [nuevo, ...prev] // arriba
        })
    }

    const addImporteDirecto = () => {
        const monto = Number(importeDirecto)
        if (!monto || monto <= 0) {
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
        setCartItems(prev => [item, ...prev]) // arriba
        setImporteDirecto('')
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        setCartItems(prev => [item, ...prev]) // arriba
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

    // Función para copiar el ticket al portapapeles
    const copiarTicket = async () => {
        if (!ticketRef.current) return;

        const promesa = new Promise((resolve, reject) => {
            html2canvas(ticketRef.current!, {
                scale: 2, // Mejora calidad para WhatsApp
                backgroundColor: '#ffffff',
                useCORS: true
            }).then(canvas => {
                canvas.toBlob(blob => {
                    if (!blob) {
                        reject('Error al generar imagen');
                        return;
                    }
                    try {
                        // eslint-disable-next-line no-undef
                        const item = new ClipboardItem({ 'image/png': blob });
                        navigator.clipboard.write([item]).then(() => {
                            resolve('¡Ticket copiado!');
                        });
                    } catch (err) {
                        console.error(err)
                        reject('Navegador no soporta copiado directo');
                    }
                });
            }).catch(err => reject(err));
        });

        toast.promise(promesa, {
            loading: 'Generando captura...',
            success: '¡Imagen copiada! Pegala en WhatsApp (Ctrl+V)',
            error: (err) => `Error: ${err}`
        });
    };

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
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Nueva Venta</h1>
                <p className="text-gray-600">Vendé productos o cobrá importes directos</p>
            </div>

            {/* Grid principal con 2 columnas (lg:grid-cols-3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Columna izquierda: Cliente + Productos (lg:col-span-2) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Cliente + deuda */}
                    <div className={`${cardClass} w-full`}>
                        {/* RESPONSIVE: Apilar en móvil, en línea en md */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-4 w-full md:w-2/3 relative">
                                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Cliente (opcional)</label>
                                <div className="w-full relative">
                                    <input
                                        type="text"
                                        value={nombreClienteInput}
                                        onChange={(e) => {
                                            const texto = e.target.value
                                            setNombreClienteInput(texto)

                                            const coincidencia = clientes.find(c =>
                                                c.nombre.toLowerCase().includes(texto.toLowerCase())
                                            )

                                            if (coincidencia) {
                                                setSelectedCliente(coincidencia.id)
                                            } else {
                                                setSelectedCliente('')
                                            }
                                        }}
                                        placeholder="Escribí para buscar cliente..."
                                        className={inputFieldClass}
                                        onFocus={() => setMostrarSugerencias(true)}
                                        onBlur={() => setTimeout(() => setMostrarSugerencias(false), 100)}
                                    />

                                    {/* Lista de sugerencias */}
                                    {mostrarSugerencias && nombreClienteInput && (
                                        <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
                                            {clientes
                                                .filter(c =>
                                                    c.nombre.toLowerCase().includes(nombreClienteInput.toLowerCase())
                                                )
                                                .map(c => (
                                                    <li
                                                        key={c.id}
                                                        onMouseDown={() => {
                                                            setSelectedCliente(c.id)
                                                            setNombreClienteInput(c.nombre)
                                                            setMostrarSugerencias(false)
                                                        }}
                                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                                    >
                                                        {c.nombre}
                                                    </li>
                                                ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {/* Toggle de Deuda */}
                            <div className="flex items-center">
                                <input
                                    id="toggle-deuda"
                                    type="checkbox"
                                    checked={esDeuda}
                                    onChange={() => setEsDeuda(!esDeuda)}
                                    className="h-4 w-4"/>
                                <label htmlFor="toggle-deuda" className="ml-2 text-sm text-gray-700 whitespace-nowrap">
                                    Marcar venta como <strong>pendiente / deuda</strong>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Productos */}
                    <div className={cardClass}>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
                            <input
                                type="text"
                                placeholder="Buscar producto por nombre o código..."
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                                className={`${inputFieldClass} w-full md:w-1/2`}/>
                        </div>
                        {/* RESPONSIVE: Grid de productos 1 columna en móvil, 2 en md */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {productos
                                .filter(p =>
                                    (p.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
                                    (p.codigo || '').toLowerCase().includes(busqueda.toLowerCase())
                                )
                                .map((p) => (
                                    <div key={p.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-medium text-gray-900">{p.nombre}</h3>
                                            <span className="text-sm font-medium text-gray-900">{formatPrice(Number(p.precio || 0).toFixed(2))}</span>
                                        </div>

                                        {/* 🆕 NUEVA SECCIÓN DE DATOS DE COSTO Y GANANCIA */}
                                        <div className="flex justify-between text-xs text-gray-500 mb-2">
                                            {p.precio_costo && (
                                                <p>
                                                    Costo: <span className="font-medium text-gray-700">{formatPrice(Number(p.precio_costo).toFixed(2))}</span>
                                                </p>
                                            )}
                                            {p.porcentaje_ganancia && (
                                                <p>
                                                    Ganancia: <span className={`font-medium ${
                                                    (p.porcentaje_ganancia || 0) >= 30 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                        {p.porcentaje_ganancia}%
                                    </span>
                                                </p>
                                            )}
                                        </div>
                                        {/* ----------------------------------------------------- */}

                                        {/* Se omite p.precio_kg y p.descripcion para mantener el foco en la venta */}
                                        {p.precio_kg ? (
                                            <p className="text-xs text-gray-500 mb-1">
                                                Precio x Kg: <span className="font-medium text-gray-800">{formatPrice(Number(p.precio_kg).toFixed(2))}</span>
                                            </p>
                                        ) : null}
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

                {/* Columna derecha: carrito */}
                <div className="lg:col-span-1">
                    {/* NOTA: Aquí hemos quitado el ref={ticketRef} porque este no es el div que queremos fotografiar */}
                    <div className={`${cardClass} space-y-4 lg:sticky lg:top-6`}>
                        <h2 className="text-lg font-semibold text-gray-900">Carrito</h2>

                        {/* Importe directo */}
                        <div className="border rounded p-3">
                            <div className="flex items-center mb-2">
                                <DollarSign className="h-4 w-4 mr-2" />
                                <span className="font-medium">Importe directo</span>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    ref={montoRef}
                                    type="number"
                                    step="0.01"
                                    value={importeDirecto}
                                    onChange={e => setImporteDirecto(e.target.value)}
                                    className={`${inputFieldClass} flex-1`}
                                    placeholder="Monto"/>
                                <button onClick={addImporteDirecto} className="btn-primary flex-shrink-0">
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
                                            <div className="font-medium text-gray-900 text-sm"> {/* Fuente más pequeña */}
                                                {it.es_custom ? (it.descripcion || 'Ítem') : (it.producto_nombre || 'Producto')}
                                            </div>
                                            <button onClick={() => removeItem(idx)} className="text-red-600 hover:text-red-800">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        {/* RESPONSIVE: Grid de 3 columnas para móvil */}
                                        <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded border">
                                            <div className="text-center">
                                                <span className="text-xs text-gray-600 block">Cant</span>
                                                <div className="flex items-center justify-center space-x-1 mt-1">
                                                    <button
                                                        onClick={() => updateCantidad(idx, it.cantidad - 1)}
                                                        className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </button>
                                                    <span className="w-6 text-center text-sm font-medium">{it.cantidad}</span>
                                                    <button
                                                        onClick={() => updateCantidad(idx, it.cantidad + 1)}
                                                        className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <span className="text-xs text-gray-600 block">Precio/u</span>
                                                {/* 💡 REFACTORIZACIÓN AQUÍ: Cambiamos type="number" a type="text" y ajustamos el manejo de valores */}
                                                <input
                                                    type="text" // Cambiado a text para eliminar las flechas
                                                    // inputMode="numeric" // Opcional: para forzar teclado numérico en móvil
                                                    // pattern="[0-9]*" // Opcional: para permitir solo números
                                                    value={it.precio_unitario || ''} // Aseguramos que sea string, si es null/undefined, es string vacío
                                                    onChange={(e) => {
                                                        // Aseguramos que el valor sea numérico para la lógica de updatePrecio
                                                        const rawValue = e.target.value.replace(/[^0-9.]/g, '') // Limpia caracteres no numéricos
                                                        updatePrecio(idx, Number(rawValue || 0))
                                                    }}
                                                    className="w-full text-center border rounded px-1 py-0.5 text-xs mt-1"
                                                    // 💡 AÑADIMOS CLASE PARA OCULTAR FLECHAS EN CASO DE QUE SEA number o para consistencia
                                                    style={{ MozAppearance: 'textfield' }} // Para Firefox, aunque con type="text" no es necesario.
                                                />
                                            </div>
                                            <div className="text-center">
                                                <span className="text-xs text-gray-600 block">Subtotal</span>
                                                <span className="font-bold text-sm text-green-600">
                          {formatPrice(Number(it.subtotal).toFixed(2))}
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
                                    className={inputFieldClass}
                                >
                                    <option value="efectivo">Efectivo</option>
                                    <option value="tarjeta">Tarjeta</option>
                                    <option value="mercadopago">MercadoPago</option>
                                </select>
                            </div>
                        )}

                        {/* Total & Submit */}
                        {cartItems.length > 0 && (
                            <div className="border-t pt-4 space-y-3">
                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span>Total:</span>
                                    <span>{formatPrice(Number(total).toFixed(2))}</span>
                                </div>

                                {/* BOTÓN NUEVO: COPIAR DETALLE */}
                                <button
                                    onClick={copiarTicket}
                                    className="w-full flex items-center justify-center gap-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg transition duration-150"
                                >
                                    <Camera className="h-4 w-4" />
                                    Copiar detalle para WhatsApp
                                </button>

                                <button onClick={handleSubmit} className="w-full btn-primary">
                                    Registrar Venta
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ================================================================================= */}
            {/* TICKET INVISIBLE: Este bloque está oculto de la vista pero accesible para la cámara */}
            {/* ================================================================================= */}
            <div
                ref={ticketRef}
                style={{
                    position: 'fixed',
                    top: '-9999px',
                    left: '-9999px',
                    width: '450px', // Ancho óptimo para lectura en celular
                    backgroundColor: 'white',
                    padding: '24px',
                    color: 'black'
                }}
            >
                {/* Encabezado del Ticket */}
                <div className="text-center border-b border-gray-300 pb-4 mb-4">
                    <h1 className="text-2xl font-bold uppercase tracking-wider">Detalle de Pedido</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {new Date().toLocaleDateString('es-AR')} - {new Date().toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'})}hs
                    </p>
                </div>

                {/* Lista de Items Limpia */}
                <div className="space-y-3 min-h-[100px]">
                    {cartItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start text-base border-b border-gray-100 pb-2">
                            <div className="flex-1 pr-4">
                                {/* Cantidad x Producto */}
                                <span className="font-bold mr-2">{item.cantidad}x</span>
                                <span className="capitalize">
                                    {item.es_custom ? item.descripcion : item.producto_nombre}
                                </span>
                            </div>
                            {/* Subtotal del item */}
                            <div className="font-semibold text-gray-800">
                                {formatPrice(item.subtotal)}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Totales y Pago */}
                <div className="mt-6 pt-4 border-t-2 border-gray-800">
                    <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
                        <span>Método de pago:</span>
                        <span className="font-medium uppercase">{metodoPago}</span>
                    </div>

                    {/* ✅ AGREGAR ESTO: Si es MercadoPago, mostramos el Alias */}
                    {metodoPago === 'mercadopago' && (
                        <div className="mb-4 text-center bg-gray-100 p-2 rounded border border-gray-200">
                            <span className="text-xs text-gray-500 uppercase tracking-wide block">Alias para transferir:</span>
                            <span className="text-xl font-bold text-gray-900 block">alimar25</span>
                        </div>
                    )}
                    {/* ----------------------------------------------------- */}

                    <div className="flex justify-between items-center text-3xl font-bold mt-2">
                        <span>TOTAL:</span>
                        <span>{formatPrice(total)}</span>
                    </div>
                </div>

                {/* Footer opcional */}
                <div className="mt-8 text-center text-xs text-gray-400">
                    <p>Gracias por tu compra</p>
                </div>
            </div>
            {/* ================================================================================= */}

        </div>
    )
}

export default NuevaVenta