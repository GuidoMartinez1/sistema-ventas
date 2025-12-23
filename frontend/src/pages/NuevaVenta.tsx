// src/pages/NuevaVenta.tsx
import { useEffect, useMemo, useState, useRef } from 'react'
import { Plus, Minus, Trash2, DollarSign, Camera, Printer, ChevronDown, ChevronRight, Package } from 'lucide-react' // Agregué iconos nuevos
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
    const ticketRef = useRef<HTMLDivElement>(null)

    // --- STATES ---
    const [productos, setProductos] = useState<Producto[]>([])
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [selectedCliente, setSelectedCliente] = useState<number | ''>('')
    const [cartItems, setCartItems] = useState<DetalleVenta[]>([])
    const [loading, setLoading] = useState(true)
    const [busqueda, setBusqueda] = useState('')

    // Estados para acordeón de categorías
    const [categoriasAbiertas, setCategoriasAbiertas] = useState<Record<string, boolean>>({})

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

    // --- LÓGICA DE AGRUPACIÓN ---
    // Agrupamos los productos por categoría usando useMemo para no recalcular en cada render
    const productosAgrupados = useMemo(() => {
        const grupos: Record<string, Producto[]> = {};
        productos.forEach(p => {
            // Asumimos que p tiene 'categoria'. Si no, usa 'Varios'
            // @ts-ignore: Si TS se queja porque categoria no está en la interfaz Producto, esto lo soluciona temporalmente
            const cat = p.categoria || 'General';
            if (!grupos[cat]) grupos[cat] = [];
            grupos[cat].push(p);
        });
        return grupos;
    }, [productos]);

    const toggleCategoria = (categoria: string) => {
        setCategoriasAbiertas(prev => ({
            ...prev,
            [categoria]: !prev[categoria]
        }));
    };

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

    const addPrecioKgItem = (producto: Producto) => {
        const precioKg = Number(producto.precio_kg);
        if (!precioKg || precioKg <= 0) {
            toast.error('Este producto no tiene precio por Kg configurado');
            return;
        }
        const item: DetalleVenta = {
            cantidad: 1,
            precio_unitario: precioKg,
            subtotal: precioKg,
            descripcion: `${producto.nombre} (x Kg)`,
            es_custom: true,
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
        // ... (Tu lógica original sin cambios si la usas)
    }

    const updateCantidad = (idx: number, cant: number) => {
        const item = cartItems[idx]
        const producto = productos.find(p => p.id === item.producto_id)

        if (cant <= 0) {
            removeItem(idx)
            return
        }
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

    // --- SUBCOMPONENTE RENDER PRODUCTO (Para reutilizar) ---
    const renderProductoCard = (p: Producto) => (
        <div key={p.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white relative flex flex-col justify-between h-full">
            <div>
                {/* Nombre y Precio Principal */}
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-gray-900 leading-tight pr-2 text-sm md:text-base">{p.nombre}</h3>
                    <span className="text-base md:text-lg font-bold text-gray-900 whitespace-nowrap">
                        {formatPrice(Number(p.precio || 0).toFixed(2))}
                    </span>
                </div>

                {/* Datos internos */}
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                    {p.precio_costo && <span>Cost: {formatPrice(Number(p.precio_costo))}</span>}
                </div>
            </div>

            <div>
                {/* Botón precio X KG */}
                {p.precio_kg && Number(p.precio_kg) > 0 && (
                    <div className="flex justify-end mb-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); addPrecioKgItem(p); }}
                            className="w-full group flex items-center justify-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1.5 rounded border border-orange-100 hover:bg-orange-600 hover:text-white transition-all"
                        >
                            x Kg: {formatPrice(p.precio_kg)}
                        </button>
                    </div>
                )}

                {/* Stock y Botón Agregar */}
                <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-100">
                    <span className={`text-xs font-medium ${
                        (p.stock || 0) <= 2 ? 'text-red-600' : 'text-gray-500'
                    }`}>
                        Stock: {p.stock}
                    </span>
                    <button
                        onClick={() => addProducto(p)}
                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-1.5 shadow-sm transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
            {/* ENCABEZADOS Y FORMULARIOS */}
            <div className="no-print">
                <h1 className="text-3xl font-bold text-gray-900">Nueva Venta</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* COLUMNA IZQ: CLIENTE Y PRODUCTOS */}
                <div className="lg:col-span-2 space-y-6 no-print">

                    {/* BUSCADOR Y CLIENTE COMBINADOS O SEPARADOS - Mantenemos separado por claridad */}
                    <div className={cardClass}>
                        <div className="flex flex-col gap-4">
                            {/* Selector de Cliente */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1 relative">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Cliente</label>
                                    <input
                                        type="text"
                                        value={nombreClienteInput}
                                        onChange={(e) => {
                                            const texto = e.target.value
                                            setNombreClienteInput(texto)
                                            const coincidencia = clientes.find(c => c.nombre.toLowerCase().includes(texto.toLowerCase()))
                                            if (coincidencia) setSelectedCliente(coincidencia.id); else setSelectedCliente('');
                                        }}
                                        placeholder="Consumidor Final"
                                        className={inputFieldClass}
                                        onFocus={() => setMostrarSugerencias(true)}
                                        onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
                                    />
                                    {mostrarSugerencias && nombreClienteInput && (
                                        <ul className="absolute z-20 w-full bg-white border rounded shadow-lg max-h-40 overflow-y-auto mt-1">
                                            {clientes.filter(c => c.nombre.toLowerCase().includes(nombreClienteInput.toLowerCase())).map(c => (
                                                <li key={c.id} onMouseDown={() => { setSelectedCliente(c.id); setNombreClienteInput(c.nombre); }} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">
                                                    {c.nombre}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div className="flex items-end pb-2">
                                    <label className="flex items-center cursor-pointer">
                                        <input type="checkbox" checked={esDeuda} onChange={() => setEsDeuda(!esDeuda)} className="h-5 w-5 text-purple-600 rounded focus:ring-purple-500 border-gray-300"/>
                                        <span className="ml-2 text-sm font-medium text-gray-700">Cuenta Corriente</span>
                                    </label>
                                </div>
                            </div>

                            <hr className="border-gray-100"/>

                            {/* Buscador de Productos */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Buscar Producto</label>
                                <input
                                    type="text"
                                    placeholder="Nombre o código..."
                                    value={busqueda}
                                    onChange={e => setBusqueda(e.target.value)}
                                    className={`${inputFieldClass} bg-gray-50`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* LISTADO DE PRODUCTOS (Refactorizado) */}
                    <div className="space-y-4">
                        {busqueda.length > 0 ? (
                            // --- VISTA BÚSQUEDA (Plana, sin categorías) ---
                            <div className="bg-white rounded-xl shadow p-4">
                                <h2 className="text-sm font-bold text-gray-500 mb-3 uppercase">Resultados de búsqueda</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {productos
                                        .filter(p => (p.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) || (p.codigo || '').toLowerCase().includes(busqueda.toLowerCase()))
                                        .map(p => renderProductoCard(p))
                                    }
                                    {productos.filter(p => (p.nombre || '').toLowerCase().includes(busqueda.toLowerCase())).length === 0 && (
                                        <p className="col-span-full text-center text-gray-400 py-4">No se encontraron productos</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // --- VISTA AGRUPADA (Por Categoría) ---
                            Object.entries(productosAgrupados).map(([categoria, items]) => (
                                <div key={categoria} className="bg-white rounded-xl shadow overflow-hidden">
                                    {/* Cabecera de Categoría (Clickable) */}
                                    <button
                                        onClick={() => toggleCategoria(categoria)}
                                        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors border-b border-gray-100"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Package className="h-5 w-5 text-purple-500" />
                                            <h2 className="font-bold text-gray-800 text-lg capitalize">{categoria}</h2>
                                            <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                {items.length}
                                            </span>
                                        </div>
                                        {categoriasAbiertas[categoria] ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronRight className="h-5 w-5 text-gray-400" />}
                                    </button>

                                    {/* Grid de Productos (Visible solo si está abierta) */}
                                    {categoriasAbiertas[categoria] && (
                                        <div className="p-4 bg-gray-50/50">
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                {items.map(p => renderProductoCard(p))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                        {/* Mensaje si no hay productos en absoluto */}
                        {!busqueda && productos.length === 0 && (
                            <div className="text-center py-10 bg-white rounded-xl shadow">
                                <p className="text-gray-500">No hay productos cargados en el sistema.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUMNA DERECHA: CARRITO (Sin cambios lógicos, solo visual) */}
                <div className="lg:col-span-1 no-print">
                    <div className={`${cardClass} space-y-4 lg:sticky lg:top-6 border-t-4 border-purple-500`}>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-purple-600"/>
                            Carrito Actual
                        </h2>

                        {/* Importe Directo */}
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <div className="flex flex-col gap-2">
                                <input
                                    type="text"
                                    value={descripcionDirecta}
                                    onChange={e => setDescripcionDirecta(e.target.value)}
                                    className="w-full border border-gray-300 p-1.5 rounded text-sm focus:outline-none focus:border-purple-500"
                                    placeholder="Desc. Varios (opcional)"
                                />
                                <div className="flex gap-2">
                                    <input
                                        ref={montoRef}
                                        type="number"
                                        step="0.01"
                                        value={importeDirecto}
                                        onChange={e => setImporteDirecto(e.target.value)}
                                        className="w-full border border-gray-300 p-1.5 rounded text-sm font-mono"
                                        placeholder="$0.00"
                                        onKeyDown={(e) => { if (e.key === 'Enter') addImporteDirecto(); }}
                                    />
                                    <button onClick={addImporteDirecto} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-xs font-bold uppercase tracking-wider">
                                        ADD
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Lista Items */}
                        <div className="max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                            {cartItems.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                                    <p className="text-gray-400 text-sm">El carrito está vacío</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {cartItems.map((it, idx) => (
                                        <div key={idx} className="border border-gray-200 rounded-lg p-2 bg-white shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="font-semibold text-gray-800 text-sm leading-tight max-w-[85%]">
                                                    {it.es_custom ? (it.descripcion||'Ítem') : (it.producto_nombre||'Producto')}
                                                </div>
                                                <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 transition-colors">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between gap-2 mt-2">
                                                {/* Controles Cantidad */}
                                                <div className="flex items-center bg-gray-100 rounded-full px-1">
                                                    <button onClick={() => updateCantidad(idx, it.cantidad - 1)} className="p-1 hover:text-purple-600"><Minus className="h-3 w-3" /></button>
                                                    <span className="w-6 text-center text-sm font-bold text-gray-700">{it.cantidad}</span>
                                                    <button onClick={() => updateCantidad(idx, it.cantidad + 1)} className="p-1 hover:text-purple-600"><Plus className="h-3 w-3" /></button>
                                                </div>

                                                {/* Precio Unitario Editable */}
                                                <div className="flex-1 max-w-[80px]">
                                                     <input
                                                        type="number"
                                                        value={it.precio_unitario}
                                                        onChange={(e) => updatePrecio(idx, Number(e.target.value))}
                                                        className="w-full text-right text-xs border-b border-gray-300 focus:border-purple-500 outline-none py-1"
                                                     />
                                                </div>

                                                {/* Subtotal */}
                                                <div className="font-bold text-sm text-gray-900 min-w-[60px] text-right">
                                                    {formatPrice(Number(it.subtotal).toFixed(2))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer Carrito */}
                        {cartItems.length > 0 && (
                            <div className="border-t pt-4 space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Método de pago</label>
                                    <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value as any)} className="w-full mt-1 border border-gray-300 rounded p-2 text-sm bg-white">
                                        <option value="efectivo">Efectivo</option>
                                        <option value="tarjeta">Tarjeta</option>
                                        <option value="mercadopago">MercadoPago</option>
                                    </select>
                                </div>

                                <div className="bg-gray-900 text-white p-4 rounded-lg flex justify-between items-center shadow-lg">
                                    <span className="text-gray-300 font-medium">Total</span>
                                    <span className="text-2xl font-bold">{formatPrice(Number(total).toFixed(2))}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={copiarTicket} className="flex flex-col items-center justify-center gap-1 border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-purple-600 font-medium py-2 rounded-lg transition duration-150 text-xs">
                                        <Camera className="h-5 w-5" />
                                        <span>FOTO</span>
                                    </button>
                                    <button onClick={handlePrint} className="flex flex-col items-center justify-center gap-1 border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-purple-600 font-medium py-2 rounded-lg transition duration-150 text-xs">
                                        <Printer className="h-5 w-5" />
                                        <span>IMPRIMIR</span>
                                    </button>
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all transform active:scale-95"
                                >
                                    CONFIRMAR VENTA
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* TICKET WHATSAPP (Original) */}
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

            {/* TICKET IMPRIMIBLE (Original) */}
            <div id="ticket-imprimible" className="printable-content">
                <div style={{ width: '58mm', padding: '5px 0 40px 0', backgroundColor: 'white', color: 'black', fontFamily: "'Courier New', Courier, monospace", fontSize: '14px', fontWeight: 'bold', lineHeight: '1.2', textAlign: 'left' }}>
                    <div style={{ textAlign: 'center', marginBottom: '10px', borderBottom: '2px dashed black', paddingBottom: '5px' }}>
                        <h2 style={{ fontSize: '24px', margin: '0 0 5px 0', fontWeight: '900' }}>ALIMAR</h2>
                        <p style={{ fontSize: '12px', margin: 0 }}>
                            {new Date().toLocaleDateString('es-AR')} {new Date().toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit', hour12: false})}
                        </p>
                    </div>
                    <div>
                        {cartItems.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', borderBottom: '1px solid black', paddingBottom: '2px' }}>
                                <div style={{ width: '65%' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{item.cantidad}x </span>
                                    <span style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                        {(item.es_custom ? item.descripcion : item.producto_nombre).substring(0, 22)}
                                    </span>
                                </div>
                                <div style={{ fontWeight: '900', fontSize: '14px' }}>{formatPrice(item.subtotal)}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: '10px', borderTop: '2px dashed black', paddingTop: '5px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold' }}><span>PAGO:</span><span style={{ textTransform: 'uppercase' }}>{metodoPago}</span></div>
                        {metodoPago === 'mercadopago' && (<div style={{ margin: '8px 0', textAlign: 'center', border: '2px solid black', padding: '4px' }}><p style={{ fontSize: '10px', margin: 0, fontWeight: 'bold' }}>ALIAS:</p><p style={{ fontSize: '16px', margin: 0, fontWeight: '900' }}>alimar25</p></div>)}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '20px', fontWeight: '900' }}><span>TOTAL:</span><span>{formatPrice(total)}</span></div>
                    </div>
                    <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}><p>*** GRACIAS ***</p><p style={{ marginTop: '15px' }}>.</p></div>
                </div>
            </div>

            <style>{`
                #ticket-imprimible { display: none; }
                @media print {
                    body * { visibility: hidden; }
                    .no-print, .no-print * { display: none !important; }
                    #ticket-imprimible, #ticket-imprimible * { visibility: visible; display: block !important; }
                    #ticket-imprimible { position: absolute; left: 0; top: 0; width: 58mm; margin: 0; padding: 0; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
                    @page { margin: 0; size: auto; }
                }
            `}</style>
        </div>
    )
}

export default NuevaVenta