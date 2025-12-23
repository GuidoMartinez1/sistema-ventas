// src/pages/NuevaVenta.tsx
import { useEffect, useMemo, useState, useRef } from 'react'
import {
    Plus, Minus, Trash2, DollarSign, Camera, Printer,
    ChevronDown, ChevronRight, Package, Bone, Cat, Dog,
    Syringe, Cookie, Wheat, Bath, ShoppingBag
} from 'lucide-react'
import { productosAPI, clientesAPI, ventasAPI, categoriasAPI } from '../services/api'
import { Producto, Cliente, DetalleVenta, Categoria } from '../services/api'
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

// --- HELPER PARA ICONOS DE CATEGORÍA ---
const getCategoryIcon = (nombre: string) => {
    const n = nombre.toLowerCase();
    if (n.includes('gato') && n.includes('alimento')) return <Cat className="h-5 w-5 text-orange-500" />;
    if (n.includes('perro') && n.includes('alimento')) return <Dog className="h-5 w-5 text-blue-500" />;
    if (n.includes('accesorios')) return <ShoppingBag className="h-5 w-5 text-pink-500" />;
    if (n.includes('pipetas') || n.includes('farmacia')) return <Syringe className="h-5 w-5 text-green-500" />;
    if (n.includes('golosinas') || n.includes('premios')) return <Cookie className="h-5 w-5 text-purple-500" />;
    if (n.includes('cereales')) return <Wheat className="h-5 w-5 text-yellow-500" />;
    if (n.includes('sanitarios') || n.includes('piedras')) return <Bath className="h-5 w-5 text-teal-500" />;
    if (n.includes('varios')) return <Package className="h-5 w-5 text-gray-500" />;

    // Default
    return <Package className="h-5 w-5 text-indigo-500" />;
};

const NuevaVenta = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const montoRef = useRef<HTMLInputElement>(null)
    const ticketRef = useRef<HTMLDivElement>(null)

    // --- STATES ---
    const [productos, setProductos] = useState<Producto[]>([])
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [categorias, setCategorias] = useState<Categoria[]>([])
    const [selectedCliente, setSelectedCliente] = useState<number | ''>('')
    const [cartItems, setCartItems] = useState<DetalleVenta[]>([])
    const [loading, setLoading] = useState(true)
    const [busqueda, setBusqueda] = useState('')

    // Estado para acordeones
    const [categoriasAbiertas, setCategoriasAbiertas] = useState<Record<string, boolean>>({})

    // Estados varios
    const [importeDirecto, setImporteDirecto] = useState<string>('')
    const [descripcionDirecta, setDescripcionDirecta] = useState('')
    const [esDeuda, setEsDeuda] = useState(false)
    const [metodoPago, setMetodoPago] = useState<'efectivo' | 'tarjeta' | 'mercadopago'>('efectivo')
    const [nombreClienteInput, setNombreClienteInput] = useState('')
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false)

    useEffect(() => {
        const load = async () => {
            try {
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

    // --- AGRUPACIÓN Y ORDENAMIENTO ---
    const productosAgrupadosOrdenados = useMemo(() => {
        const grupos: Record<string, Producto[]> = {};

        // 1. Agrupar
        productos.forEach(p => {
            const catObj = categorias.find(c => c.id === p.categoria_id);
            const catNombre = catObj ? catObj.nombre : 'Sin Categoría';
            if (!grupos[catNombre]) grupos[catNombre] = [];
            grupos[catNombre].push(p);
        });

        // 2. Retornar las claves ordenadas alfabéticamente
        //    (En realidad retornamos un array de [nombre, productos] ya ordenado para facilitar el render)
        return Object.entries(grupos).sort((a, b) => a[0].localeCompare(b[0]));

    }, [productos, categorias]);

    const toggleCategoria = (categoria: string) => {
        setCategoriasAbiertas(prev => ({ ...prev, [categoria]: !prev[categoria] }));
    };

    // --- CARRITO LOGIC ---
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
                return prev.map(i => i.producto_id === producto.id ? { ...i, cantidad, precio_unitario: precio, subtotal: cantidad * precio } : i)
            }
            if ((producto.stock || 0) < 1) { toast.error(`No hay stock`); return prev; }
            const precio = Number(producto.precio ?? 0)
            return [{ producto_id: producto.id, cantidad: 1, precio_unitario: precio, subtotal: precio, producto_nombre: producto.nombre } as DetalleVenta, ...prev]
        })
    }

    const addPrecioKgItem = (producto: Producto) => {
        const precioKg = Number(producto.precio_kg);
        if (!precioKg || precioKg <= 0) { toast.error('Sin precio x Kg'); return; }
        setCartItems(prev => [{ cantidad: 1, precio_unitario: precioKg, subtotal: precioKg, descripcion: `${producto.nombre} (x Kg)`, es_custom: true } as DetalleVenta, ...prev]);
        toast.success(`Agregado 1 Kg de ${producto.nombre}`);
    };

    const addImporteDirecto = () => {
        const monto = Number(importeDirecto)
        if (!monto || monto <= 0) { toast.error('Importe inválido'); return; }
        setCartItems(prev => [{ cantidad: 1, precio_unitario: monto, subtotal: monto, descripcion: descripcionDirecta.trim() || 'Importe directo', es_custom: true } as DetalleVenta, ...prev])
        setImporteDirecto(''); setDescripcionDirecta('');
    }

    const updateCantidad = (idx: number, cant: number) => {
        const item = cartItems[idx]
        const producto = productos.find(p => p.id === item.producto_id)
        if (cant <= 0) { removeItem(idx); return; }
        if (item.producto_id && producto && cant > (producto.stock || 0)) { toast.error(`Stock insuficiente`); return; }
        setCartItems(prev => prev.map((it, i) => i === idx ? { ...it, cantidad: cant, subtotal: cant * Number(it.precio_unitario || 0) } : it))
    }

    const updatePrecio = (idx: number, precio: number) => {
        if (precio < 0) precio = 0
        setCartItems(prev => prev.map((it, i) => i === idx ? { ...it, precio_unitario: precio, subtotal: it.cantidad * Number(precio || 0) } : it))
    }

    const removeItem = (idx: number) => setCartItems(prev => prev.filter((_, i) => i !== idx))

    const total = useMemo(() => cartItems.reduce((acc, it) => acc + Number(it.subtotal || 0), 0), [cartItems])

    // --- FUNCIONES EXTRA ---
    const copiarTicket = async () => { /* ... Lógica existente ... */ if (!ticketRef.current) return; html2canvas(ticketRef.current!, { scale: 2, backgroundColor: '#ffffff', useCORS: true }).then(canvas => canvas.toBlob(blob => navigator.clipboard.write([new ClipboardItem({ 'image/png': blob! })]).then(() => toast.success('Copiado')))); };
    const handlePrint = () => window.print();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (cartItems.length === 0) { toast.error('Carrito vacío'); return; }
        if (esDeuda && !selectedCliente) { toast.error('Seleccioná un cliente para deuda'); return; }
        try {
            await ventasAPI.create({
                cliente_id: selectedCliente ? Number(selectedCliente) : undefined,
                productos: cartItems.map(d => ({ producto_id: d.producto_id, cantidad: Number(d.cantidad), precio_unitario: Number(d.precio_unitario), subtotal: Number(d.subtotal), descripcion: d.descripcion, es_custom: d.es_custom === true })),
                total: Number(total), estado: esDeuda ? 'adeuda' : 'completada', metodo_pago: metodoPago
            })
            toast.success('Venta registrada'); navigate(esDeuda ? '/deudas' : '/ventas');
        } catch { toast.error('Error al registrar'); }
    }

    // --- RENDER CARD ---
    const renderProductoCard = (p: Producto) => (
        <div key={p.id} className="border border-gray-100 rounded-lg p-3 hover:shadow-md transition-shadow bg-white relative flex flex-col justify-between h-full">
            <div>
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-gray-800 text-sm leading-tight pr-1">{p.nombre}</h3>
                    <span className="text-base font-bold text-gray-900 whitespace-nowrap">{formatPrice(Number(p.precio || 0))}</span>
                </div>
            </div>
            <div className="mt-2">
                {p.precio_kg && Number(p.precio_kg) > 0 && (
                    <button onClick={(e) => { e.stopPropagation(); addPrecioKgItem(p); }} className="w-full mb-2 text-xs font-bold text-orange-600 bg-orange-50 py-1 rounded border border-orange-100 hover:bg-orange-600 hover:text-white transition-colors">
                        x Kg: {formatPrice(p.precio_kg)}
                    </button>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                    <span className={`text-xs font-medium ${ (p.stock || 0) <= 2 ? 'text-red-500' : 'text-gray-400' }`}>Stock: {p.stock}</span>
                    <button onClick={() => addProducto(p)} className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-1 shadow-sm transition-transform active:scale-95">
                        <Plus className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
            {/* ENCABEZADO */}
            <div className="no-print">
                <h1 className="text-3xl font-bold text-gray-900">Nueva Venta</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* COLUMNA IZQ */}
                <div className="lg:col-span-2 space-y-6 no-print">
                    <div className={cardClass}>
                        {/* Buscador Cliente */}
                        <div className="flex flex-col md:flex-row gap-4 mb-4 justify-between">
                            <div className="flex-1 relative">
                                <label className="text-xs font-bold text-gray-500 uppercase">Cliente</label>
                                <input type="text" value={nombreClienteInput} onChange={(e) => { setNombreClienteInput(e.target.value); const f = clientes.find(c => c.nombre.toLowerCase().includes(e.target.value.toLowerCase())); setSelectedCliente(f ? f.id : ''); }} placeholder="Buscar cliente..." className={inputFieldClass} onFocus={() => setMostrarSugerencias(true)} onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}/>
                                {mostrarSugerencias && nombreClienteInput && <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto mt-1">{clientes.filter(c => c.nombre.toLowerCase().includes(nombreClienteInput.toLowerCase())).map(c => (<li key={c.id} onMouseDown={() => { setSelectedCliente(c.id); setNombreClienteInput(c.nombre); }} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm">{c.nombre}</li>))}</ul>}
                            </div>
                            <div className="flex items-end pb-2"><label className="flex items-center cursor-pointer"><input type="checkbox" checked={esDeuda} onChange={() => setEsDeuda(!esDeuda)} className="h-5 w-5 text-purple-600 rounded"/><span className="ml-2 text-sm font-medium text-gray-700">Cuenta Corriente</span></label></div>
                        </div>
                        <hr className="my-4 border-gray-100"/>
                        <div className="flex gap-2 mb-4">
                            <input type="text" placeholder="🔍 Buscar producto..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className={`${inputFieldClass} bg-gray-50 text-base py-3`}/>
                        </div>

                        {/* LISTA DE PRODUCTOS */}
                        {busqueda.length > 0 ? (
                            // MODO BÚSQUEDA
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {productos.filter(p => (p.nombre||'').toLowerCase().includes(busqueda.toLowerCase()) || (p.codigo||'').toLowerCase().includes(busqueda.toLowerCase())).map(renderProductoCard)}
                                {productos.filter(p => (p.nombre||'').toLowerCase().includes(busqueda.toLowerCase())).length === 0 && <p className="col-span-full text-center text-gray-400">Sin resultados</p>}
                            </div>
                        ) : (
                            // MODO AGRUPADO (CAJITAS ORDENADAS)
                            <div className="space-y-3">
                                {productosAgrupadosOrdenados.map(([categoria, items]) => (
                                    <div key={categoria} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md">
                                        {/* CABECERA "CAJITA" */}
                                        <button
                                            onClick={() => toggleCategoria(categoria)}
                                            className={`w-full flex justify-between items-center p-4 text-left transition-colors ${
                                                categoriasAbiertas[categoria] ? 'bg-purple-50 border-b border-purple-100' : 'bg-white hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${categoriasAbiertas[categoria] ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
                                                    {getCategoryIcon(categoria)}
                                                </div>
                                                <div>
                                                    <h3 className={`font-bold text-base ${categoriasAbiertas[categoria] ? 'text-purple-800' : 'text-gray-700'}`}>
                                                        {categoria}
                                                    </h3>
                                                    <span className="text-xs text-gray-400 font-medium">{items.length} productos</span>
                                                </div>
                                            </div>
                                            <div className={`transform transition-transform duration-200 ${categoriasAbiertas[categoria] ? 'rotate-180' : ''}`}>
                                                <ChevronDown className="h-5 w-5 text-gray-400" />
                                            </div>
                                        </button>

                                        {/* CONTENIDO DESPLEGABLE */}
                                        {categoriasAbiertas[categoria] && (
                                            <div className="p-4 bg-gray-50/50 border-t border-gray-100 animate-fadeIn">
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                    {items.map(renderProductoCard)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {productosAgrupadosOrdenados.length === 0 && <p className="text-center text-gray-400 py-8">No hay productos cargados</p>}
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUMNA DERECHA: CARRITO (Intacta) */}
                <div className="lg:col-span-1 no-print">
                    <div className={`${cardClass} space-y-4 lg:sticky lg:top-6 border-t-4 border-purple-500`}>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><DollarSign className="h-5 w-5 text-purple-600"/> Carrito</h2>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <div className="flex flex-col gap-2">
                                <input type="text" value={descripcionDirecta} onChange={e => setDescripcionDirecta(e.target.value)} className="w-full border border-gray-300 p-1.5 rounded text-xs focus:outline-none focus:border-purple-500" placeholder="Desc. Varios (opcional)"/>
                                <div className="flex gap-2">
                                    <input ref={montoRef} type="number" step="0.01" value={importeDirecto} onChange={e => setImporteDirecto(e.target.value)} className="w-full border border-gray-300 p-1.5 rounded text-sm font-mono" placeholder="$0.00" onKeyDown={(e) => { if (e.key === 'Enter') addImporteDirecto(); }}/>
                                    <button onClick={addImporteDirecto} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-xs font-bold uppercase tracking-wider">ADD</button>
                                </div>
                            </div>
                        </div>

                        {/* LISTA ITEMS */}
                        <div className="max-h-[400px] overflow-y-auto pr-1 custom-scrollbar space-y-2">
                            {cartItems.length === 0 ? <p className="text-center text-gray-400 text-sm py-4">Carrito vacío</p> : cartItems.map((it, idx) => (
                                <div key={idx} className="border border-gray-200 rounded p-2 bg-white relative">
                                    <button onClick={() => removeItem(idx)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500"><Trash2 className="h-4 w-4"/></button>
                                    <div className="pr-6"><p className="text-sm font-semibold text-gray-800 leading-tight">{it.es_custom ? it.descripcion : it.producto_nombre}</p></div>
                                    <div className="flex justify-between items-center mt-2">
                                        <div className="flex items-center bg-gray-100 rounded-full">
                                            <button onClick={() => updateCantidad(idx, it.cantidad - 1)} className="p-1 hover:text-purple-600"><Minus className="h-3 w-3"/></button>
                                            <span className="w-6 text-center text-xs font-bold">{it.cantidad}</span>
                                            <button onClick={() => updateCantidad(idx, it.cantidad + 1)} className="p-1 hover:text-purple-600"><Plus className="h-3 w-3"/></button>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <input type="number" value={it.precio_unitario} onChange={(e) => updatePrecio(idx, Number(e.target.value))} className="w-16 text-right text-xs border-b border-gray-300 outline-none"/>
                                            <span className="font-bold text-sm text-gray-900 w-16 text-right">{formatPrice(it.subtotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {cartItems.length > 0 && (
                            <div className="border-t pt-4 space-y-3">
                                <div><label className="text-xs font-bold text-gray-500 uppercase">Pago</label><select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value as any)} className="w-full mt-1 border border-gray-300 rounded p-1.5 text-sm bg-white"><option value="efectivo">Efectivo</option><option value="tarjeta">Tarjeta</option><option value="mercadopago">MercadoPago</option></select></div>
                                <div className="flex justify-between items-center text-xl font-bold text-gray-900"><span>Total</span><span>{formatPrice(total)}</span></div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={copiarTicket} className="flex items-center justify-center gap-1 border border-gray-300 bg-white hover:bg-gray-50 py-2 rounded text-xs font-medium text-gray-600"><Camera className="h-4 w-4"/> Foto</button>
                                    <button onClick={handlePrint} className="flex items-center justify-center gap-1 border border-gray-300 bg-white hover:bg-gray-50 py-2 rounded text-xs font-medium text-gray-600"><Printer className="h-4 w-4"/> Print</button>
                                </div>
                                <button onClick={handleSubmit} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg shadow transition-colors">CONFIRMAR VENTA</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* TICKET WHATSAPP (Oculto) - INTACTO */}
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

            {/* TICKET DE IMPRESIÓN (INTACTO) */}
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