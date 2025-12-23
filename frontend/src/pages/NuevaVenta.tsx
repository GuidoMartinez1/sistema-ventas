// src/pages/NuevaVenta.tsx
import { useEffect, useMemo, useState, useRef } from 'react'
import {
    Plus, Minus, Trash2, DollarSign, Camera, Printer,
    // Iconos para las categorías
    Package, Bone, Cat, Dog, Syringe, Cookie, Wheat, Bath, ShoppingBag,
    X
} from 'lucide-react'
import { productosAPI, clientesAPI, ventasAPI, categoriasAPI } from '../services/api'
import { Producto, Cliente, DetalleVenta, Categoria } from '../services/api'
import toast from 'react-hot-toast'
import { useNavigate, useLocation } from 'react-router-dom'
import html2canvas from 'html2canvas'

// --- CLASES DE UTILIDAD ORIGINALES (Ajustado a Naranja) ---
const cardClass = "bg-white shadow-lg rounded-xl p-4 md:p-6";
// Cambiamos 'purple' por 'orange' para respetar tu marca
const inputFieldClass = "w-full border border-gray-300 p-2 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition duration-150 ease-in-out text-sm";

const formatPrice = (value: number | string | undefined) => {
    if (value === null || value === undefined || value === '') return '$0';
    return '$' + Number(value).toLocaleString("es-AR");
};

// Helper simple para asignar iconos a tus categorías dinámicamente
const getCategoryIcon = (nombre: string) => {
    const n = nombre.toLowerCase();
    const style = "h-6 w-6 text-gray-500"; // Estilo neutro para no invadir el diseño

    if (n.includes('gato') && n.includes('alimento')) return <Cat className={style} />;
    if (n.includes('perro') && n.includes('alimento')) return <Dog className={style} />;
    if (n.includes('accesorios')) return <ShoppingBag className={style} />;
    if (n.includes('pipetas') || n.includes('farmacia')) return <Syringe className={style} />;
    if (n.includes('golosinas') || n.includes('premios')) return <Cookie className={style} />;
    if (n.includes('cereales')) return <Wheat className={style} />;
    if (n.includes('sanitarios') || n.includes('piedras')) return <Bath className={style} />;

    return <Package className={style} />;
};

const NuevaVenta = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const montoRef = useRef<HTMLInputElement>(null)
    const ticketRef = useRef<HTMLDivElement>(null)

    // --- STATES ---
    const [productos, setProductos] = useState<Producto[]>([])
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [categorias, setCategorias] = useState<Categoria[]>([]) // Nuevo estado
    const [selectedCliente, setSelectedCliente] = useState<number | ''>('')
    const [cartItems, setCartItems] = useState<DetalleVenta[]>([])
    const [loading, setLoading] = useState(true)
    const [busqueda, setBusqueda] = useState('')

    // Estado para la categoría seleccionada (null = ver todas)
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number | null>(null);

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
                // Cargamos también las categorías
                const [prodRes, cliRes, catRes] = await Promise.all([
                    productosAPI.getAll(),
                    clientesAPI.getAll(),
                    categoriasAPI.getAll()
                ])
                setProductos(Array.isArray(prodRes.data) ? prodRes.data : [])
                setClientes(Array.isArray(cliRes.data) ? cliRes.data : [])
                setCategorias(Array.isArray(catRes.data) ? catRes.data : [])
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

    // --- LÓGICA DE FILTRADO ---
    // 1. Si hay búsqueda por texto, priorizamos eso y mostramos todo lo que coincida.
    // 2. Si no hay búsqueda, filtramos por la categoría seleccionada (cajita).
    const productosVisibles = useMemo(() => {
        let filtrados = productos;

        if (busqueda) {
            const lowerBusqueda = busqueda.toLowerCase();
            return filtrados.filter(p =>
                (p.nombre || '').toLowerCase().includes(lowerBusqueda) ||
                (p.codigo || '').toLowerCase().includes(lowerBusqueda)
            );
        }

        if (categoriaSeleccionada !== null) {
            filtrados = filtrados.filter(p => p.categoria_id === categoriaSeleccionada);
        }

        return filtrados;
    }, [productos, busqueda, categoriaSeleccionada]);

    // --- LÓGICA DEL CARRITO (ORIGINAL) ---
    const addProducto = (producto: Producto) => {
        if (!producto?.id) { toast.error('Producto inválido'); return; }
        setCartItems(prev => {
            const item = prev.find(i => i.producto_id === producto.id)
            if (item) {
                if (item.cantidad + 1 > (producto.stock || 0)) {
                    toast.error(`Stock insuficiente. Disponible: ${producto.stock || 0}`)
                    return prev
                }
                const cantidad = item.cantidad + 1
                const precio = Number(producto.precio ?? 0)
                return prev.map(i => i.producto_id === producto.id ? { ...i, cantidad, precio_unitario: precio, subtotal: cantidad * precio, producto_nombre: producto.nombre } : i)
            }
            if ((producto.stock || 0) < 1) { toast.error(`No hay stock disponible`); return prev; }
            const precio = Number(producto.precio ?? 0)
            return [{ producto_id: producto.id, cantidad: 1, precio_unitario: precio, subtotal: precio, producto_nombre: producto.nombre } as DetalleVenta, ...prev]
        })
    }

    const addPrecioKgItem = (producto: Producto) => {
        const precioKg = Number(producto.precio_kg);
        if (!precioKg || precioKg <= 0) { toast.error('Este producto no tiene precio por Kg configurado'); return; }
        const item: DetalleVenta = {
            cantidad: 1, precio_unitario: precioKg, subtotal: precioKg,
            descripcion: `${producto.nombre} (x Kg)`, es_custom: true
        };
        setCartItems(prev => [item, ...prev]);
        toast.success(`Agregado 1 Kg de ${producto.nombre}`);
    };

    const addImporteDirecto = () => {
        const monto = Number(importeDirecto)
        if (!monto || monto <= 0) { toast.error('Ingrese un importe válido'); return; }
        setCartItems(prev => [{ cantidad: 1, precio_unitario: monto, subtotal: monto, descripcion: descripcionDirecta.trim() || 'Importe directo', es_custom: true } as DetalleVenta, ...prev])
        setImporteDirecto(''); setDescripcionDirecta('');
    }

    const updateCantidad = (idx: number, cant: number) => {
        const item = cartItems[idx]; const producto = productos.find(p => p.id === item.producto_id)
        if (cant <= 0) { removeItem(idx); return; }
        if (item.producto_id && producto && cant > (producto.stock || 0)) { toast.error(`Stock insuficiente. Disponible: ${producto.stock || 0}`); return; }
        setCartItems(prev => prev.map((it, i) => i === idx ? { ...it, cantidad: cant, subtotal: cant * Number(it.precio_unitario || 0) } : it))
    }

    const updatePrecio = (idx: number, precio: number) => {
        if (precio < 0) precio = 0
        setCartItems(prev => prev.map((it, i) => i === idx ? { ...it, precio_unitario: precio, subtotal: it.cantidad * Number(precio || 0) } : it))
    }

    const removeItem = (idx: number) => setCartItems(prev => prev.filter((_, i) => i !== idx))
    const total = useMemo(() => cartItems.reduce((acc, it) => acc + Number(it.subtotal || 0), 0), [cartItems])

    // --- FUNCIONES EXTRA (Whatsapp / Print) ---
    const copiarTicket = async () => {
        if (!ticketRef.current) return;
        const promesa = new Promise((resolve, reject) => {
            html2canvas(ticketRef.current!, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
                .then(canvas => canvas.toBlob(blob => { if (!blob) { reject('Error'); return; } navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(() => resolve('Copiado')); }))
                .catch(err => reject(err));
        });
        toast.promise(promesa, { loading: 'Generando...', success: '¡Imagen copiada!', error: 'Error' });
    };

    const handlePrint = () => window.print();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (cartItems.length === 0) { toast.error('Agregá al menos un ítem'); return; }
        if (esDeuda && !selectedCliente) { toast.error('Para registrar una deuda, seleccioná un cliente'); return; }
        try {
            const payload = {
                cliente_id: selectedCliente ? Number(selectedCliente) : undefined,
                productos: cartItems.map(d => ({ producto_id: d.producto_id, cantidad: Number(d.cantidad), precio_unitario: Number(d.precio_unitario), subtotal: Number(d.subtotal), producto_nombre: d.producto_nombre, descripcion: d.descripcion, es_custom: d.es_custom === true })),
                total: Number(total), estado: esDeuda ? 'adeuda' : 'completada', metodo_pago: metodoPago
            }
            await ventasAPI.create(payload)
            toast.success(esDeuda ? 'Venta registrada' : 'Venta registrada')
            navigate(esDeuda ? '/deudas' : '/ventas')
        } catch { toast.error('Error al registrar') }
    }

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="no-print">
                <h1 className="text-3xl font-bold text-gray-900">Nueva Venta</h1>
                <p className="text-gray-600">Vendé productos o cobrá importes directos</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* COLUMNA IZQ: PRODUCTOS Y CATEGORÍAS */}
                <div className="lg:col-span-2 space-y-6 no-print">

                    {/* Cliente (Diseño Original) */}
                    <div className={cardClass}>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-4 w-full md:w-2/3 relative">
                                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Cliente</label>
                                <div className="w-full relative">
                                    <input type="text" value={nombreClienteInput} onChange={(e) => { setNombreClienteInput(e.target.value); const coincidencia = clientes.find(c => c.nombre.toLowerCase().includes(e.target.value.toLowerCase())); if (coincidencia) setSelectedCliente(coincidencia.id); else setSelectedCliente(''); }} placeholder="Buscar cliente..." className={inputFieldClass} onFocus={() => setMostrarSugerencias(true)} onBlur={() => setTimeout(() => setMostrarSugerencias(false), 100)}/>
                                    {mostrarSugerencias && nombreClienteInput && (<ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">{clientes.filter(c => c.nombre.toLowerCase().includes(nombreClienteInput.toLowerCase())).map(c => (<li key={c.id} onMouseDown={() => { setSelectedCliente(c.id); setNombreClienteInput(c.nombre); }} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">{c.nombre}</li>))}</ul>)}
                                </div>
                            </div>
                            <div className="flex items-center">
                                <input id="toggle-deuda" type="checkbox" checked={esDeuda} onChange={() => setEsDeuda(!esDeuda)} className="h-4 w-4 text-orange-600 focus:ring-orange-500"/>
                                <label htmlFor="toggle-deuda" className="ml-2 text-sm text-gray-700 whitespace-nowrap">Pendiente / Deuda</label>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN PRODUCTOS */}
                    <div className={cardClass}>

                        {/* Buscador y Filtros */}
                        <div className="mb-6 space-y-4">
                            <input type="text" placeholder="🔍 Buscar producto por nombre o código..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className={`${inputFieldClass} py-3 text-base`}/>

                            {/* CAJITAS DE CATEGORÍAS (GRID 2 o 3 COLUMNAS) */}
                            {/* Se ocultan si hay búsqueda activa para no molestar */}
                            {!busqueda && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {/* Opción 'Ver Todo' */}
                                    <button
                                        onClick={() => setCategoriaSeleccionada(null)}
                                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                                            categoriaSeleccionada === null
                                            ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-500 shadow-sm'
                                            : 'bg-white border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <Package className={`h-6 w-6 ${categoriaSeleccionada === null ? 'text-orange-600' : 'text-gray-400'}`} />
                                        <span className={`text-xs font-bold uppercase ${categoriaSeleccionada === null ? 'text-orange-700' : 'text-gray-600'}`}>Ver Todo</span>
                                    </button>

                                    {/* Mapeo de Categorías Reales */}
                                    {categorias.map(cat => {
                                        const isActive = categoriaSeleccionada === cat.id;
                                        // Contamos productos solo para info visual
                                        const count = productos.filter(p => p.categoria_id === cat.id).length;
                                        if (count === 0) return null; // Ocultar vacías

                                        return (
                                            <button
                                                key={cat.id}
                                                onClick={() => setCategoriaSeleccionada(isActive ? null : cat.id)}
                                                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all duration-200 relative ${
                                                    isActive
                                                    ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-500 shadow-sm'
                                                    : 'bg-white border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                {/* Icono Helper */}
                                                {getCategoryIcon(cat.nombre)}

                                                <span className={`text-xs font-bold text-center leading-tight ${isActive ? 'text-orange-900' : 'text-gray-700'}`}>
                                                    {cat.nombre}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-medium">({count})</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* LISTADO DE PRODUCTOS (GRID ORIGINAL) */}
                        {/* Se muestra "Full Width" debajo de las categorías */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {productosVisibles.map((p) => (
                                <div key={p.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white relative flex flex-col justify-between h-full">
                                    {/* Diseño de tarjeta original intacto */}
                                    <div>
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-medium text-gray-900 leading-tight pr-2">{p.nombre}</h3>
                                            <span className="text-lg font-bold text-gray-900 whitespace-nowrap">{formatPrice(Number(p.precio || 0).toFixed(2))}</span>
                                        </div>
                                    </div>

                                    <div className="mt-2">
                                        {/* Botón precio KG */}
                                        {p.precio_kg && Number(p.precio_kg) > 0 && (
                                            <div className="flex justify-end mb-2">
                                                <button onClick={(e) => { e.stopPropagation(); addPrecioKgItem(p); }} className="group flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-100 hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all cursor-pointer shadow-sm">
                                                    <span className="group-hover:block hidden text-[10px] mr-1">✚</span>x Kg: {formatPrice(p.precio_kg)}
                                                </button>
                                            </div>
                                        )}

                                        <div className="flex justify-between text-xs text-gray-400 mb-3">
                                            <div>{p.precio_costo && <span>Costo: {formatPrice(Number(p.precio_costo))}</span>}</div>
                                            <div>{p.porcentaje_ganancia && <span>Gan: {p.porcentaje_ganancia}%</span>}</div>
                                        </div>

                                        <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-100">
                                            <span className={`text-sm font-medium ${(p.stock || 0) <= 2 ? 'text-red-600' : 'text-gray-600'}`}>Stock: {p.stock}</span>
                                            <button onClick={() => addProducto(p)} className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg py-1.5 px-4 shadow-sm transition-colors">
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {productosVisibles.length === 0 && (
                            <div className="text-center py-10 text-gray-400">
                                <p>No se encontraron productos en esta categoría.</p>
                                <button onClick={() => {setBusqueda(''); setCategoriaSeleccionada(null)}} className="text-orange-500 font-medium mt-2 hover:underline">Ver todos</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUMNA DERECHA: CARRITO (Diseño Original, toque naranja) */}
                <div className="lg:col-span-1 no-print">
                    <div className={`${cardClass} space-y-4 lg:sticky lg:top-6 border-t-4 border-orange-500`}>
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-orange-600"/> Carrito
                        </h2>

                        <div className="border rounded p-3 bg-gray-50">
                            <div className="flex items-center mb-2"><span className="font-medium text-sm text-gray-700">Importe directo</span></div>
                            <div className="flex flex-col gap-2">
                                <input type="text" value={descripcionDirecta} onChange={e => setDescripcionDirecta(e.target.value)} className={inputFieldClass} placeholder="Descripción (opcional)"/>
                                <div className="flex gap-2">
                                    <input ref={montoRef} type="number" step="0.01" value={importeDirecto} onChange={e => setImporteDirecto(e.target.value)} className={`${inputFieldClass} flex-1 font-mono`} placeholder="$0.00" onKeyDown={(e) => { if (e.key === 'Enter') addImporteDirecto(); }}/>
                                    <button onClick={addImporteDirecto} className="bg-green-600 text-white px-4 rounded-lg hover:bg-green-700 font-bold text-xs uppercase">ADD</button>
                                </div>
                            </div>
                        </div>

                        {cartItems.length === 0 ? (
                            <p className="text-gray-400 text-center py-6 text-sm">Tu carrito está vacío</p>
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                                {cartItems.map((it, idx) => (
                                    <div key={idx} className="border rounded p-3 bg-white shadow-sm relative group">
                                        <button onClick={() => removeItem(idx)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                                        <div className="font-medium text-gray-800 text-sm pr-6 mb-2">{it.es_custom ? (it.descripcion||'Ítem') : (it.producto_nombre||'Producto')}</div>

                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                                <button onClick={() => updateCantidad(idx, it.cantidad - 1)} className="p-1 hover:text-orange-600"><Minus className="h-3 w-3" /></button>
                                                <span className="w-8 text-center text-sm font-bold">{it.cantidad}</span>
                                                <button onClick={() => updateCantidad(idx, it.cantidad + 1)} className="p-1 hover:text-orange-600"><Plus className="h-3 w-3" /></button>
                                            </div>
                                            <div className="text-right">
                                                <input type="text" value={it.precio_unitario || ''} onChange={(e) => updatePrecio(idx, Number(e.target.value.replace(/[^0-9.]/g, '') || 0))} className="w-16 text-right text-xs border-b border-gray-300 focus:border-orange-500 outline-none mb-1 block ml-auto"/>
                                                <span className="font-bold text-sm text-gray-900">{formatPrice(Number(it.subtotal).toFixed(2))}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {cartItems.length > 0 && (
                            <div className="border-t pt-4 space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pago</label>
                                    <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value as any)} className={inputFieldClass}>
                                        <option value="efectivo">Efectivo</option>
                                        <option value="tarjeta">Tarjeta</option>
                                        <option value="mercadopago">MercadoPago</option>
                                    </select>
                                </div>
                                <div className="flex justify-between items-center text-xl font-bold text-gray-900"><span>Total</span><span>{formatPrice(Number(total).toFixed(2))}</span></div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={copiarTicket} className="flex items-center justify-center gap-2 border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 font-medium py-2 rounded-lg text-xs"><Camera className="h-4 w-4" /> Foto</button>
                                    <button onClick={handlePrint} className="flex items-center justify-center gap-2 border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 font-medium py-2 rounded-lg text-xs"><Printer className="h-4 w-4" /> Print</button>
                                </div>
                                <button onClick={handleSubmit} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl shadow-md transition-colors">Confirmar Venta</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* TICKETS (OCULTOS) - SIN CAMBIOS DE LÓGICA */}
            <div ref={ticketRef} style={{position: 'fixed', top: '-9999px', left: '-9999px', width: '450px', backgroundColor: 'white', padding: '24px', color: 'black'}}>
                <div className="text-center border-b border-gray-300 pb-4 mb-4"><h1 className="text-2xl font-bold uppercase tracking-wider">Detalle de Pedido</h1><p className="text-sm text-gray-500 mt-1">{new Date().toLocaleDateString('es-AR')} - {new Date().toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit', hour12: false})}hs</p></div>
                <div className="space-y-3 min-h-[100px]">{cartItems.map((item, idx) => (<div key={idx} className="flex justify-between items-start text-base border-b border-gray-100 pb-2"><div className="flex-1 pr-4"><span className="font-bold mr-2">{item.cantidad}x</span><span className="capitalize">{item.es_custom ? item.descripcion : item.producto_nombre}</span></div><div className="font-semibold text-gray-800">{formatPrice(item.subtotal)}</div></div>))}</div>
                <div className="mt-6 pt-4 border-t-2 border-gray-800"><div className="flex justify-between items-center mb-2 text-sm text-gray-600"><span>Método:</span><span className="uppercase">{metodoPago}</span></div>{metodoPago === 'mercadopago' && (<div className="mb-4 text-center bg-gray-100 p-2 rounded border border-gray-200"><span className="text-xs text-gray-500 uppercase block">Alias:</span><span className="text-xl font-bold text-gray-900 block">alimar25</span></div>)}<div className="flex justify-between items-center text-3xl font-bold mt-2"><span>TOTAL:</span><span>{formatPrice(total)}</span></div></div><div className="mt-8 text-center text-xs text-gray-400"><p>GRACIAS POR TU COMPRA - ALIMAR</p></div>
            </div>

            <div id="ticket-imprimible" className="printable-content">
                <div style={{ width: '58mm', padding: '5px 0 40px 0', backgroundColor: 'white', color: 'black', fontFamily: "'Courier New', Courier, monospace", fontSize: '14px', fontWeight: 'bold', lineHeight: '1.2', textAlign: 'left' }}>
                    <div style={{ textAlign: 'center', marginBottom: '10px', borderBottom: '2px dashed black', paddingBottom: '5px' }}><h2 style={{ fontSize: '24px', margin: '0 0 5px 0', fontWeight: '900' }}>ALIMAR</h2><p style={{ fontSize: '12px', margin: 0 }}>{new Date().toLocaleDateString('es-AR')} {new Date().toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit', hour12: false})}</p></div>
                    <div>{cartItems.map((item, idx) => (<div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', borderBottom: '1px solid black', paddingBottom: '2px' }}><div style={{ width: '65%' }}><span style={{ fontSize: '14px', fontWeight: 'bold' }}>{item.cantidad}x </span><span style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>{(item.es_custom ? item.descripcion : item.producto_nombre).substring(0, 22)}</span></div><div style={{ fontWeight: '900', fontSize: '14px' }}>{formatPrice(item.subtotal)}</div></div>))}</div>
                    <div style={{ marginTop: '10px', borderTop: '2px dashed black', paddingTop: '5px' }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold' }}><span>PAGO:</span><span style={{ textTransform: 'uppercase' }}>{metodoPago}</span></div>{metodoPago === 'mercadopago' && (<div style={{ margin: '8px 0', textAlign: 'center', border: '2px solid black', padding: '4px' }}><p style={{ fontSize: '10px', margin: 0, fontWeight: 'bold' }}>ALIAS:</p><p style={{ fontSize: '16px', margin: 0, fontWeight: '900' }}>alimar25</p></div>)}<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '20px', fontWeight: '900' }}><span>TOTAL:</span><span>{formatPrice(total)}</span></div></div>
                    <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}><p>*** GRACIAS ***</p><p style={{ marginTop: '15px' }}>.</p></div>
                </div>
            </div>

            <style>{`
                #ticket-imprimible { display: none; }
                @media print {
                    body * { visibility: hidden; } .no-print, .no-print * { display: none !important; }
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