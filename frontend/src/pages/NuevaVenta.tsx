// src/pages/NuevaVenta.tsx
import { useEffect, useMemo, useState, useRef } from 'react'
import { Plus, Minus, Trash2, DollarSign, Camera, Printer } from 'lucide-react'
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

    // --- REFS ---
    const ticketRef = useRef<HTMLDivElement>(null) // Para la foto de WhatsApp

    // --- STATES ---
    const [productos, setProductos] = useState<Producto[]>([])
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [selectedCliente, setSelectedCliente] = useState<number | ''>('')
    const [cartItems, setCartItems] = useState<DetalleVenta[]>([])
    const [loading, setLoading] = useState(true)
    const [busqueda, setBusqueda] = useState('')

    // Estados para importe directo
    const [importeDirecto, setImporteDirecto] = useState<string>('')
    const [descripcionDirecta, setDescripcionDirecta] = useState('')

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

    useEffect(() => {
        if (location.state?.focusMonto && montoRef.current) {
            montoRef.current.focus()
        }
    }, [location.state])

    // --- LÓGICA DEL CARRITO ---
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
            return [nuevo, ...prev]
        })
    }

    // --- NUEVA FUNCIONALIDAD: AGREGAR PRECIO X KG ---
    const addPrecioKgItem = (producto: Producto) => {
        const precioKg = Number(producto.precio_kg);

        if (!precioKg || precioKg <= 0) {
            toast.error('Este producto no tiene precio por Kg configurado');
            return;
        }

        const item: DetalleVenta = {
            cantidad: 1, // Empieza con 1 Kg
            precio_unitario: precioKg,
            subtotal: precioKg,
            // Usamos el nombre del producto + una aclaración para que se entienda en el ticket
            descripcion: `${producto.nombre} (x Kg)`,
            es_custom: true, // Importante: marca como "custom" para que actúe como importe directo
        };

        setCartItems(prev => [item, ...prev]);
        toast.success(`Agregado 1 Kg de ${producto.nombre}`);
    };

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
            descripcion: descripcionDirecta.trim() || 'Importe directo',
            es_custom: true
        }
        setCartItems(prev => [item, ...prev])
        setImporteDirecto('')
        setDescripcionDirecta('')
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
        setCartItems(prev => [item, ...prev])
        setNuevoItem({ descripcion: '', cantidad: 1, precio: 0 })
    }

    const updateCantidad = (idx: number, cant: number) => {
        const item = cartItems[idx]
        const producto = productos.find(p => p.id === item.producto_id)

        if (cant <= 0) {
            removeItem(idx)
            return
        }

        // Si es un producto de stock (tiene ID), validamos. Si es custom (precio x kg), no validamos stock.
        if (item.producto_id && producto && cant > (producto.stock || 0)) {
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

    // --- FUNCIÓN 1: FOTO PARA WHATSAPP ---
    const copiarTicket = async () => {
        if (!ticketRef.current) return;
        const promesa = new Promise((resolve, reject) => {
            html2canvas(ticketRef.current!, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
                .then(canvas => {
                    canvas.toBlob(blob => {
                        if (!blob) { reject('Error'); return; }
                        try {
                            // eslint-disable-next-line no-undef
                            const item = new ClipboardItem({ 'image/png': blob });
                            navigator.clipboard.write([item]).then(() => resolve('Copiado'));
                        } catch (err) { console.error(err); reject('Navegador no soporta'); }
                    });
                }).catch(err => reject(err));
        });
        toast.promise(promesa, { loading: 'Generando...', success: '¡Imagen copiada!', error: 'Error' });
    };

    // --- FUNCIÓN 2: IMPRIMIR (MÉTODO NATIVO) ---
    const handlePrint = () => {
        window.print();
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
            toast.success(esDeuda ? 'Venta registrada' : 'Venta registrada')
            navigate(esDeuda ? '/deudas' : '/ventas')
        } catch {
            toast.error('Error al registrar')
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
            {/* ENCABEZADOS Y FORMULARIOS (Se ocultarán al imprimir por CSS) */}
            <div className="no-print">
                <h1 className="text-3xl font-bold text-gray-900">Nueva Venta</h1>
                <p className="text-gray-600">Vendé productos o cobrá importes directos</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* COLUMNA IZQ (Se ocultará al imprimir) */}
                <div className="lg:col-span-2 space-y-6 no-print">
                    {/* Cliente */}
                    <div className={cardClass}>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-4 w-full md:w-2/3 relative">
                                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Cliente</label>
                                <div className="w-full relative">
                                    <input
                                        type="text"
                                        value={nombreClienteInput}
                                        onChange={(e) => {
                                            const texto = e.target.value
                                            setNombreClienteInput(texto)
                                            const coincidencia = clientes.find(c => c.nombre.toLowerCase().includes(texto.toLowerCase()))
                                            if (coincidencia) setSelectedCliente(coincidencia.id); else setSelectedCliente('');
                                        }}
                                        placeholder="Buscar cliente..."
                                        className={inputFieldClass}
                                        onFocus={() => setMostrarSugerencias(true)}
                                        onBlur={() => setTimeout(() => setMostrarSugerencias(false), 100)}
                                    />
                                    {mostrarSugerencias && nombreClienteInput && (
                                        <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
                                            {clientes.filter(c => c.nombre.toLowerCase().includes(nombreClienteInput.toLowerCase())).map(c => (
                                                <li key={c.id} onMouseDown={() => { setSelectedCliente(c.id); setNombreClienteInput(c.nombre); }} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">
                                                    {c.nombre}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center">
                                <input id="toggle-deuda" type="checkbox" checked={esDeuda} onChange={() => setEsDeuda(!esDeuda)} className="h-4 w-4"/>
                                <label htmlFor="toggle-deuda" className="ml-2 text-sm text-gray-700 whitespace-nowrap">Pendiente / Deuda</label>
                            </div>
                        </div>
                    </div>

                    {/* Productos */}
                    <div className={cardClass}>
                        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
                            <input type="text" placeholder="Buscar producto..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className={`${inputFieldClass} w-full md:w-1/2`}/>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {productos
                                .filter(p => (p.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) || (p.codigo || '').toLowerCase().includes(busqueda.toLowerCase()))
                                .map((p) => (
                                    <div key={p.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white relative">

                                        {/* Nombre y Precio Principal */}
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-medium text-gray-900 leading-tight pr-2">{p.nombre}</h3>
                                            <span className="text-lg font-bold text-gray-900 whitespace-nowrap">
                                                {formatPrice(Number(p.precio || 0).toFixed(2))}
                                            </span>
                                        </div>

                                        {/* --- NUEVO: PRECIO X KG CLICKABLE --- */}
                                        {p.precio_kg && Number(p.precio_kg) > 0 && (
                                            <div className="flex justify-end mb-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Evita que clicks accidentales disparen otros eventos
                                                        addPrecioKgItem(p);
                                                    }}
                                                    className="group flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-100 hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all cursor-pointer shadow-sm"
                                                    title="Click para agregar 1 Kg al carrito"
                                                >
                                                    {/* Ícono opcional para indicar acción */}
                                                    <span className="group-hover:block hidden text-[10px] mr-1">✚</span>
                                                    x Kg: {formatPrice(p.precio_kg)}
                                                </button>
                                            </div>
                                        )}

                                        {/* Datos internos (Costo / Ganancia) */}
                                        <div className="flex justify-between text-xs text-gray-400 mb-3">
                                            <div>
                                                {p.precio_costo && <span>Costo: {formatPrice(Number(p.precio_costo))}</span>}
                                            </div>
                                            <div>
                                                {p.porcentaje_ganancia && <span>Gan: {p.porcentaje_ganancia}%</span>}
                                            </div>
                                        </div>

                                        {/* Stock y Botón Agregar */}
                                        <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-100">
                                            <span className={`text-sm font-medium ${
                                                (p.stock || 0) <= 2 ? 'text-red-600' : 'text-gray-600'
                                            }`}>
                                                Stock: {p.stock}
                                            </span>
                                            <button
                                                onClick={() => addProducto(p)}
                                                className="btn-primary text-sm py-1.5 px-4 shadow-sm hover:shadow"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* COLUMNA DERECHA: CARRITO (Se ocultará al imprimir) */}
                <div className="lg:col-span-1 no-print">
                    <div className={`${cardClass} space-y-4 lg:sticky lg:top-6`}>
                        <h2 className="text-lg font-semibold text-gray-900">Carrito</h2>

                        <div className="border rounded p-3">
                            <div className="flex items-center mb-2"><DollarSign className="h-4 w-4 mr-2" /><span className="font-medium">Importe directo</span></div>

                            {/* NUEVO DISEÑO CON DESCRIPCIÓN */}
                            <div className="flex flex-col gap-2">
                                <input
                                    type="text"
                                    value={descripcionDirecta}
                                    onChange={e => setDescripcionDirecta(e.target.value)}
                                    className={inputFieldClass}
                                    placeholder="Descripción (opcional)"
                                />
                                <div className="flex gap-2">
                                    <input
                                        ref={montoRef}
                                        type="number"
                                        step="0.01"
                                        value={importeDirecto}
                                        onChange={e => setImporteDirecto(e.target.value)}
                                        className={`${inputFieldClass} flex-1`}
                                        placeholder="Monto"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') addImporteDirecto();
                                        }}
                                    />
                                    <button onClick={addImporteDirecto} className="btn-primary flex-shrink-0">Agregar</button>
                                </div>
                            </div>
                        </div>

                        {cartItems.length === 0 ? (
                            <p className="text-gray-500 text-center py-6">Vacío</p>
                        ) : (
                            <div className="space-y-3">
                                {cartItems.map((it, idx) => (
                                    <div key={idx} className="border rounded p-3 bg-gray-50">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-medium text-gray-900 text-sm">{it.es_custom ? (it.descripcion||'Ítem') : (it.producto_nombre||'Producto')}</div>
                                            <button onClick={() => removeItem(idx)} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded border">
                                            <div className="text-center">
                                                <span className="text-xs text-gray-600 block">Cant</span>
                                                <div className="flex items-center justify-center space-x-1 mt-1">
                                                    <button onClick={() => updateCantidad(idx, it.cantidad - 1)} className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center"><Minus className="h-3 w-3" /></button>
                                                    <span className="w-6 text-center text-sm font-medium">{it.cantidad}</span>
                                                    <button onClick={() => updateCantidad(idx, it.cantidad + 1)} className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center"><Plus className="h-3 w-3" /></button>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <span className="text-xs text-gray-600 block">Precio/u</span>
                                                <input type="text" value={it.precio_unitario || ''} onChange={(e) => updatePrecio(idx, Number(e.target.value.replace(/[^0-9.]/g, '') || 0))} className="w-full text-center border rounded px-1 py-0.5 text-xs mt-1"/>
                                            </div>
                                            <div className="text-center">
                                                <span className="text-xs text-gray-600 block">Subtotal</span>
                                                <span className="font-bold text-sm text-green-600">{formatPrice(Number(it.subtotal).toFixed(2))}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {cartItems.length > 0 && (
                            <div className="border-t pt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Método de pago</label>
                                <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value as any)} className={inputFieldClass}>
                                    <option value="efectivo">Efectivo</option>
                                    <option value="tarjeta">Tarjeta</option>
                                    <option value="mercadopago">MercadoPago</option>
                                </select>
                            </div>
                        )}

                        {cartItems.length > 0 && (
                            <div className="border-t pt-4 space-y-3">
                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span>Total:</span>
                                    <span>{formatPrice(Number(total).toFixed(2))}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={copiarTicket} className="flex items-center justify-center gap-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-medium py-2 px-2 rounded-lg transition duration-150 text-xs sm:text-sm">
                                        <Camera className="h-4 w-4" />
                                        Copiar
                                    </button>
                                    <button onClick={handlePrint} className="flex items-center justify-center gap-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-medium py-2 px-2 rounded-lg transition duration-150 text-xs sm:text-sm">
                                        <Printer className="h-4 w-4" />
                                        Imprimir
                                    </button>
                                </div>

                                <button onClick={handleSubmit} className="w-full btn-primary">Registrar Venta</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* TICKET WHATSAPP (Oculto) - ESTE NO SE TOCA, SIGUE SIENDO LINDO */}
            <div ref={ticketRef} style={{position: 'fixed', top: '-9999px', left: '-9999px', width: '450px', backgroundColor: 'white', padding: '24px', color: 'black'}}>
                <div className="text-center border-b border-gray-300 pb-4 mb-4">
                    <h1 className="text-2xl font-bold uppercase tracking-wider">Detalle de Pedido</h1>
                    <p className="text-sm text-gray-500 mt-1">{new Date().toLocaleDateString('es-AR')} - {new Date().toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit', hour12: false})}hs</p>
                </div>
                <div className="space-y-3 min-h-[100px]">
                    {cartItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start text-base border-b border-gray-100 pb-2">
                            <div className="flex-1 pr-4">
                                <span className="font-bold mr-2">{item.cantidad}x</span>
                                <span className="capitalize">{item.es_custom ? item.descripcion : item.producto_nombre}</span>
                            </div>
                            <div className="font-semibold text-gray-800">{formatPrice(item.subtotal)}</div>
                        </div>
                    ))}
                </div>
                <div className="mt-6 pt-4 border-t-2 border-gray-800">
                    <div className="flex justify-between items-center mb-2 text-sm text-gray-600"><span>Método:</span><span className="uppercase">{metodoPago}</span></div>
                    {metodoPago === 'mercadopago' && (<div className="mb-4 text-center bg-gray-100 p-2 rounded border border-gray-200"><span className="text-xs text-gray-500 uppercase block">Alias:</span><span className="text-xl font-bold text-gray-900 block">alimar25</span></div>)}
                    <div className="flex justify-between items-center text-3xl font-bold mt-2"><span>TOTAL:</span><span>{formatPrice(total)}</span></div>
                </div>
                <div className="mt-8 text-center text-xs text-gray-400"><p>GRACIAS POR TU COMPRA - ALIMAR</p></div>
            </div>

{/* ================================================================================= */}
            {/* TICKET FINAL - FORMATO TABLA (INDESTRUCTIBLE EN IMPRESIÓN)                        */}
            {/* ================================================================================= */}
            <div id="ticket-imprimible" className="printable-content">
                <div style={{
                    width: '100%', // Usamos 100% del contenedor padre (definido en CSS)
                    backgroundColor: 'white',
                    color: 'black',
                    fontFamily: "'Courier New', Courier, monospace", // Fuente monoespaciada obligatoria
                    fontSize: '11px', // 11px es el estándar ideal para 58mm
                    fontWeight: 'bold', // Negrita para que se lea mejor en térmica
                    lineHeight: '1.2',
                    textAlign: 'left',
                    textTransform: 'uppercase'
                }}>

                    {/* Encabezado */}
                    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                        <div style={{ fontSize: '14px', marginBottom: '5px' }}>X</div>
                        <div style={{ fontSize: '10px', marginBottom: '5px' }}>NO VALIDO COMO FACTURA</div>
                        <h2 style={{ fontSize: '18px', margin: '5px 0' }}>ALIMAR</h2>
                    </div>

                    {/* Datos Fecha */}
                    <div style={{ marginBottom: '10px', fontSize: '10px' }}>
                        <span>Fecha: {new Date().toLocaleDateString('es-AR', {day: '2-digit', month: '2-digit', year: '2-digit'})}</span>
                        <span style={{ marginLeft: '10px' }}>Hora: {new Date().toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit', hour12: false})}</span>
                    </div>

                    {/* TABLA DE PRODUCTOS - ESTO SOLUCIONA LA ALINEACIÓN */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px dashed black' }}>
                                <th style={{ textAlign: 'left', width: '35%', paddingBottom: '2px' }}>PRECIO</th>
                                <th style={{ textAlign: 'center', width: '25%', paddingBottom: '2px' }}>CANT</th>
                                <th style={{ textAlign: 'right', width: '40%', paddingBottom: '2px' }}>IMPORTE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Espaciador */}
                            <tr><td colSpan={3} style={{ height: '5px' }}></td></tr>

                            {cartItems.map((item, idx) => (
                                <>
                                    {/* Fila 1: Descripción (Ocupa todo el ancho) */}
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'left', paddingTop: '4px' }}>
                                            {item.es_custom ? item.descripcion : item.producto_nombre}
                                        </td>
                                    </tr>
                                    {/* Fila 2: Los números alineados perfectamente */}
                                    <tr>
                                        <td style={{ textAlign: 'left', verticalAlign: 'top' }}>
                                            {Number(item.precio_unitario).toFixed(0)} $/Un
                                        </td>
                                        <td style={{ textAlign: 'center', verticalAlign: 'top' }}>
                                            {item.cantidad} Un
                                        </td>
                                        <td style={{ textAlign: 'right', verticalAlign: 'top' }}>
                                            {Number(item.subtotal).toFixed(2).replace('.', ',')}
                                        </td>
                                    </tr>
                                </>
                            ))}
                        </tbody>
                    </table>

                    {/* Totales */}
                    <div style={{ marginTop: '15px', borderTop: '1px dashed black', paddingTop: '5px' }}>
                        <div style={{ marginBottom: '5px', fontSize: '10px' }}>
                            Art:002
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginTop: '5px' }}>
                            <span>TOTAL:</span>
                            <span>$ {Number(total).toFixed(2).replace('.', ',')}</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '10px' }}>
                        <p>Gracias por su compra...</p>
                    </div>
                </div>
            </div>

            {/* CSS AJUSTADO PARA EVITAR DESBORDES */}
            <style>{`
                #ticket-imprimible { display: none; }

                @media print {
                    /* Reset total del navegador */
                    body * { visibility: hidden; height: 0; }
                    .no-print, .no-print * { display: none !important; }

                    /* Configuración de página: MÁRGENES A CERO */
                    @page {
                        size: auto;
                        margin: 0mm; /* Crucial: elimina margen del navegador */
                    }

                    /* El contenedor del ticket */
                    #ticket-imprimible {
                        visibility: visible;
                        display: block !important;
                        position: absolute;
                        left: 0;
                        top: 0;
                        /* IMPORTANTE: Un poco menos de 58mm para que no se corte por el margen físico de la impresora */
                        width: 48mm;
                        margin-left: 1mm; /* Pequeño margen izq */
                        height: auto;
                        overflow: visible;
                    }

                    /* Asegurar que el contenido interno sea visible */
                    #ticket-imprimible * {
                        visibility: visible;
                        height: auto;
                    }
                }
            `}</style>
        </div>
    )
}

export default NuevaVenta