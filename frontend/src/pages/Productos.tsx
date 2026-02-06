import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Package, Download, ClipboardList, History } from 'lucide-react'
import { productosAPI, categoriasAPI, futurosPedidosAPI } from '../services/api'
import { Producto, Categoria } from '../services/api'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

// Clases de utilidad
const cardClass = "bg-white shadow-lg rounded-xl p-4 md:p-6";
const inputFieldClass = "w-full border border-gray-300 p-2 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition duration-150 ease-in-out text-sm";

// --- FUNCIÓN DE COLORES DE GANANCIA ---
const getBadgeColor = (ganancia: number) => {
    if (ganancia > 30) return 'bg-green-600 text-white'; // Verde fuerte
    if (ganancia >= 25) return 'bg-green-100 text-green-800'; // Verde claro
    if (ganancia >= 15) return 'bg-yellow-100 text-yellow-800'; // Amarillo
    return 'bg-red-100 text-red-800'; // Rojo
};

const formatPrice = (value: number | string | undefined) => {
    if (value === null || value === undefined || value === '') return '$0';
    return '$' + Number(value).toLocaleString("es-AR", { maximumFractionDigits: 0 });
};

const extraerKilos = (nombre: string): number | null => {
    if (!nombre) return null;
    const regex = /(\d+(?:[.,]\d+)?)\s*(KG|KGS|KILOS|LITROS|LT|L|G|GR|GRS)/i;
    const match = nombre.match(regex);
    if (match && match[1]) {
        const valorTexto = match[1].replace(',', '.');
        let pesoNum = parseFloat(valorTexto);
        if (isNaN(pesoNum) || pesoNum === 0) return null;
        let unidad = match[2].toUpperCase();
        if (['G', 'GR', 'GRS'].includes(unidad)) {
            pesoNum = pesoNum / 1000;
        }
        return parseFloat(pesoNum.toFixed(2));
    }
    return null;
};

const formatKilos = (kilos: number | undefined | string) => {
    if (kilos == null || kilos === '' || Number(kilos) <= 0) return '-';
    const kiloValue = Number(kilos);
    return Number.isInteger(kiloValue) ? kiloValue.toString() : kiloValue.toFixed(2);
};

const parseNumericInput = (value: string): string => {
    return value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
};

const Productos = () => {
    const [productos, setProductos] = useState<Producto[]>([])
    const [categorias, setCategorias] = useState<Categoria[]>([])
    const [loading, setLoading] = useState(true)

    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historialData, setHistorialData] = useState<any[]>([]);
    const [selectedProductName, setSelectedProductName] = useState('');

    const [showModal, setShowModal] = useState(false)
    const [editingProducto, setEditingProducto] = useState<Producto | null>(null)
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        precio: '',
        precio_kg: '',
        precio_costo: '',
        porcentaje_ganancia: '',
        stock: '',
        categoria_id: '',
        codigo: ''
    })

    const [showFutureModal, setShowFutureModal] = useState(false)
    const [futureProduct, setFutureProduct] = useState<Producto | null>(null)
    const [futureQuantity, setFutureQuantity] = useState('')

    const [busqueda, setBusqueda] = useState('')
    const [stockFiltro, setStockFiltro] = useState('')
    const [categoriaFiltro, setCategoriaFiltro] = useState('')
    const [gananciaFiltro, setGananciaFiltro] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [productosResponse, categoriasResponse] = await Promise.all([
                productosAPI.getAll(),
                categoriasAPI.getAll()
            ])
            setProductos(productosResponse.data)
            setCategorias(categoriasResponse.data)
        } catch (error) {
            toast.error('Error al cargar datos')
        } finally {
            setLoading(false)
        }
    }

    const verHistorial = async (producto: Producto) => {
        try {
            const response = await productosAPI.getHistorial(producto.id!);
            setHistorialData(response.data);
            setSelectedProductName(producto.nombre);
            setShowHistoryModal(true);
        } catch {
            toast.error("No se pudo cargar el historial");
        }
    };

    const handleAddToFuture = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!futureProduct) return;
        const toastId = toast.loading('Procesando...');
        try {
            const { data: pedidosActuales } = await futurosPedidosAPI.getAll();
            const yaExiste = pedidosActuales.some((p: any) => p.producto_id === futureProduct.id);
            if (yaExiste) {
                toast.dismiss(toastId);
                toast.error(`"${futureProduct.nombre}" ya está en la lista.`);
                setShowFutureModal(false);
                return;
            }
            await futurosPedidosAPI.create({ producto_id: futureProduct.id, cantidad: futureQuantity });
            toast.dismiss(toastId);
            toast.success(`Agregado a la lista`);
            setShowFutureModal(false);
        } catch (error) {
            toast.dismiss(toastId);
            toast.error("Error al agregar");
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const categoriaSeleccionada = categorias.find(c => c.id?.toString() === formData.categoria_id);
        const nombreCategoria = categoriaSeleccionada?.nombre?.toLowerCase().trim() || '';
        let kilosExtraidos = (nombreCategoria !== 'pipetas y comprimidos') ? extraerKilos(formData.nombre) : null;

        try {
            const productoData = {
                ...formData,
                kilos: kilosExtraidos,
                precio: parseFloat(formData.precio || '0') || 0,
                precio_kg: parseFloat(formData.precio_kg || '0') || 0,
                precio_costo: parseFloat(formData.precio_costo || '0') || 0,
                porcentaje_ganancia: parseFloat(formData.porcentaje_ganancia || '0') || 0,
                stock: parseInt(formData.stock || '0') || 0,
                categoria_id: formData.categoria_id ? parseInt(formData.categoria_id) : undefined
            }
            if (editingProducto) {
                await productosAPI.update(editingProducto.id!, productoData)
                toast.success('Producto actualizado')
            } else {
                await productosAPI.create(productoData)
                toast.success('Producto creado')
            }
            setShowModal(false)
            fetchData()
        } catch (error) {
            toast.error('Error al guardar')
        }
    }

    const handleEdit = (producto: Producto) => {
        setEditingProducto(producto)
        setFormData({
            nombre: producto.nombre,
            descripcion: producto.descripcion || '',
            precio: producto.precio?.toString() || '',
            precio_kg: producto.precio_kg?.toString() || '',
            precio_costo: producto.precio_costo?.toString() || '',
            porcentaje_ganancia: producto.porcentaje_ganancia?.toString() || '',
            stock: producto.stock?.toString() || '',
            categoria_id: producto.categoria_id?.toString() || '',
            codigo: producto.codigo || ''
        })
        setShowModal(true)
    }

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Eliminar producto?')) {
            try {
                await productosAPI.delete(id)
                fetchData()
            } catch (error) {
                toast.error('Error al eliminar')
            }
        }
    }

    const handleAbrirBolsa = async (id: number) => {
        if (window.confirm('¿Abrir bolsa? Se restará 1 unidad.')) {
            try {
                await productosAPI.abrirBolsa(id)
                fetchData()
            } catch (error) {
                toast.error('Error')
            }
        }
    }

    const resetForm = () => {
        setFormData({
            nombre: '', descripcion: '', precio: '', precio_kg: '', precio_costo: '',
            porcentaje_ganancia: '', stock: '', categoria_id: '', codigo: ''
        })
    }

    const openModal = () => {
        setEditingProducto(null)
        resetForm()
        setShowModal(true)
    }

    const getCategoriaNombre = (categoriaId?: number) => {
        return categorias.find(c => c.id === categoriaId)?.nombre || '-'
    }

    const calcularPrecioAutomatico = () => {
        const precioCosto = parseFloat(formData.precio_costo) || 0
        const porcentajeGanancia = parseFloat(formData.porcentaje_ganancia) || 30
        if (precioCosto > 0) {
            const precioCalculado = precioCosto * (1 + porcentajeGanancia / 100)
            setFormData(prev => ({ ...prev, precio: precioCalculado.toFixed(2) }))
        }
    }

    const handlePrecioCostoChange = (value: string) => {
        const cleanValue = parseNumericInput(value);
        setFormData(prev => ({ ...prev, precio_costo: cleanValue }))
        if (cleanValue && formData.porcentaje_ganancia) setTimeout(calcularPrecioAutomatico, 100)
    }

    const handlePorcentajeChange = (value: string) => {
        const cleanValue = parseNumericInput(value);
        setFormData(prev => ({ ...prev, porcentaje_ganancia: cleanValue }))
        if (cleanValue && formData.precio_costo) setTimeout(calcularPrecioAutomatico, 100)
    }

    const handlePrecioVentaChange = (value: string) => {
        const cleanValue = parseNumericInput(value);
        setFormData(prev => {
            const precioCosto = parseFloat(prev.precio_costo) || 0
            const precioVenta = parseFloat(cleanValue) || 0
            let nuevoPorcentaje = prev.porcentaje_ganancia
            if (precioCosto > 0 && precioVenta > 0) {
                nuevoPorcentaje = (((precioVenta - precioCosto) / precioCosto) * 100).toFixed(2)
            }
            return { ...prev, precio: cleanValue, porcentaje_ganancia: nuevoPorcentaje }
        })
    }

    const sugerenciaKg = (() => {
        const precioVenta = parseFloat(formData.precio) || 0;
        const pesoDetectado = extraerKilos(formData.nombre);
        if (precioVenta > 0 && pesoDetectado && pesoDetectado > 0) return (precioVenta * 1.20) / pesoDetectado;
        return null;
    })();

    const productosFiltrados = productos
        .filter(p => p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || p.codigo?.toLowerCase().includes(busqueda.toLowerCase()))
        .filter(p => {
            if (!stockFiltro) return true
            if (stockFiltro === '>4') return (p.stock || 0) > 4
            return (p.stock || 0) === parseInt(stockFiltro)
        })
        .filter(p => categoriaFiltro ? p.categoria_id?.toString() === categoriaFiltro : true)
        .filter(p => {
            if (!gananciaFiltro) return true;
            const ganancia = Number(p.porcentaje_ganancia) || 0;
            const [min, max] = gananciaFiltro.split('-').map(Number);
            return ganancia >= min && ganancia < max;
        });

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-screen-xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Productos - AliMar</h1>
                    <p className="text-gray-600">Gestión de inventario</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={openModal} className="btn-primary flex-1 md:flex-none justify-center flex items-center"><Plus className="h-5 w-5 mr-2" /> Nuevo</button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className={inputFieldClass} />
                <select value={stockFiltro} onChange={(e) => setStockFiltro(e.target.value)} className={inputFieldClass}>
                    <option value="">Todos los Stocks</option>
                    <option value="0">Stock: 0</option>
                    <option value="1">Stock: 1</option>
                    <option value=">4">Stock: &gt;4</option>
                </select>
                <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)} className={inputFieldClass}>
                    <option value="">Todas las categorías</option>
                    {categorias.map(c => <option key={c.id} value={c.id?.toString()}>{c.nombre}</option>)}
                </select>
                <select value={gananciaFiltro} onChange={(e) => setGananciaFiltro(e.target.value)} className={inputFieldClass}>
                    <option value="">Todas las Ganancias</option>
                    <option value="0-15">Menos de 15%</option>
                    <option value="30-999">Más de 30%</option>
                </select>
            </div>

            <div className={cardClass}>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="px-4 py-3 text-left">Producto</th>
                                <th className="px-4 py-3 text-center">Venta</th>
                                <th className="px-4 py-3 text-center">Costo</th>
                                <th className="px-4 py-3 text-center">Ganancia</th>
                                <th className="px-4 py-3 text-center">Stock</th>
                                <th className="px-4 py-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {productosFiltrados.map((producto) => (
                            <tr key={producto.id} className="hover:bg-gray-50 text-sm">
                                <td className="px-4 py-4 font-medium">{producto.nombre}</td>
                                <td className="px-4 py-4 text-center font-bold">{formatPrice(producto.precio)}</td>
                                <td className="px-4 py-4 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        {formatPrice(producto.precio_costo)}
                                        <History onClick={() => verHistorial(producto)} className="h-3 w-3 text-orange-500 cursor-pointer" />
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getBadgeColor(Number(producto.porcentaje_ganancia || 0))}`}>
                                        {Number(producto.porcentaje_ganancia || 0).toFixed(1)}%
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${(producto.stock || 0) <= 4 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                        {producto.stock} uds
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-center space-x-2">
                                    <button onClick={() => handleEdit(producto)} className="text-indigo-600"><Edit className="h-4 w-4" /></button>
                                    <button onClick={() => handleAbrirBolsa(producto.id!)} className="text-orange-600">📦</button>
                                    <button onClick={() => {setFutureProduct(producto); setShowFutureModal(true)}} className="text-blue-600"><ClipboardList className="h-4 w-4" /></button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL PRODUCTO */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">{editingProducto ? 'Editar' : 'Nuevo'} Producto</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="text" placeholder="Nombre" required value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} className={inputFieldClass} />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="Costo" value={formData.precio_costo} onChange={(e) => handlePrecioCostoChange(e.target.value)} className={inputFieldClass} />
                                <input type="text" placeholder="Ganancia %" value={formData.porcentaje_ganancia} onChange={(e) => handlePorcentajeChange(e.target.value)} className={inputFieldClass} />
                            </div>
                            <input type="text" placeholder="Venta" value={formData.precio} onChange={(e) => handlePrecioVentaChange(e.target.value)} className={inputFieldClass} />
                            <input type="text" placeholder="Stock" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value.replace(/\D/g,'')})} className={inputFieldClass} />
                            <select value={formData.categoria_id} onChange={(e) => setFormData({...formData, categoria_id: e.target.value})} className={inputFieldClass}>
                                <option value="">Categoría</option>
                                {categorias.map(c => <option key={c.id} value={c.id?.toString()}>{c.nombre}</option>)}
                            </select>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cerrar</button>
                                <button type="submit" className="btn-primary">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL FUTUROS */}
            {showFutureModal && futureProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-xs">
                        <h3 className="font-bold mb-2">A Pedidos Futuros</h3>
                        <p className="text-xs text-gray-500 mb-4">{futureProduct.nombre}</p>
                        <form onSubmit={handleAddToFuture}>
                            <input type="number" placeholder="Cantidad" value={futureQuantity} onChange={(e) => setFutureQuantity(e.target.value)} className={inputFieldClass} required />
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setShowFutureModal(false)} className="btn-secondary">Cerrar</button>
                                <button type="submit" className="btn-primary">Agregar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL HISTORIAL */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="font-bold mb-4">Historial: {selectedProductName}</h3>
                        <div className="max-h-60 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50"><tr><th className="p-2 text-left">Fecha</th><th className="p-2 text-right">Costo</th></tr></thead>
                                <tbody>
                                    {historialData.map((h, i) => (
                                        <tr key={i} className="border-b"><td className="p-2">{new Date(h.fecha).toLocaleDateString()}</td><td className="p-2 text-right font-bold text-orange-600">{formatPrice(h.costo)}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button onClick={() => setShowHistoryModal(false)} className="mt-4 w-full btn-secondary">Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Productos