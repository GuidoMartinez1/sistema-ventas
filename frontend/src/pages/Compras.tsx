import { useEffect, useState } from 'react'
import { Plus, Package, Calendar, Building, Eye, X, ClipboardList, Trash2, DollarSign as DollarIcon } from 'lucide-react'
// 💡 IMPORTANTE: Añadir Producto y productosAPI
import { comprasAPI, futurosPedidosAPI, FuturoPedido, Producto, productosAPI } from '../services/api'
import { Compra, CompraCompleta } from '../services/api'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

// Clases de utilidad
const cardClass = "bg-white shadow-lg rounded-xl p-4 md:p-6";
const inputFieldClass = "w-full border border-gray-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-sm";


const Compras = () => {
    const navigate = useNavigate()
    const [compras, setCompras] = useState<Compra[]>([])
    const [loading, setLoading] = useState(true)
    const [compraSeleccionada, setCompraSeleccionada] = useState<CompraCompleta | null>(null)
    const [mostrarDetalles, setMostrarDetalles] = useState(false)
    const [cargandoDetalles, setCargandoDetalles] = useState(false)

    // ================= FUTUROS PEDIDOS - PERSISTENTE =================
    const [mostrarFuturos, setMostrarFuturos] = useState(false)
    const [futurosPedidos, setFuturosPedidos] = useState<FuturoPedido[]>([])
    const [cargandoFuturos, setCargandoFuturos] = useState(false)

    // 💡 ESTADOS PARA EL FORMULARIO DE NUEVO PEDIDO
    const [productos, setProductos] = useState<Producto[]>([]) // Lista de productos
    const [productoSeleccionadoId, setProductoSeleccionadoId] = useState<number | null>(null) // ID del producto seleccionado
    const [usarProductoExistente, setUsarProductoExistente] = useState(false) // Toggle: true para usar select, false para input custom
    const [nuevoProducto, setNuevoProducto] = useState('') // Input string custom
    const [nuevaCantidad, setNuevaCantidad] = useState('')

    // 💡 NUEVO useEffect para cargar productos (solo una vez)
    useEffect(() => {
        productosAPI.getAll().then(res => setProductos(res.data)).catch(() => {
            toast.error("Error al cargar la lista de productos existentes.")
        })
    }, [])

    const fetchFuturosPedidos = async () => {
        setCargandoFuturos(true)
        try {
            const response = await futurosPedidosAPI.getAll()
            setFuturosPedidos(response.data)
        } catch (error) {
            toast.error('Error al cargar futuros pedidos de la base de datos.')
            console.error(error)
        } finally {
            setCargandoFuturos(false)
        }
    }

    // 💡 FUNCIÓN AGREGAR FUTURO ACTUALIZADA
    const agregarFuturo = async () => {

        let payload: { producto?: string; cantidad?: string; producto_id?: number } = {
            // La cantidad es opcional, si está vacía, enviamos undefined o null
            cantidad: nuevaCantidad.trim() || undefined
        }

        if (usarProductoExistente) {
            // Lógica para producto existente (Select)
            if (!productoSeleccionadoId) {
                toast.error('Debe seleccionar un producto existente.')
                return
            }
            payload.producto_id = productoSeleccionadoId
            // Limpiamos el producto custom si usamos ID
            payload.producto = undefined
        } else {
            // Lógica para producto custom (Input)
            if (!nuevoProducto.trim()) {
                toast.error('Ingresa un nombre de producto custom.')
                return
            }
            payload.producto = nuevoProducto.trim()
            // Limpiamos el ID si usamos producto custom
            payload.producto_id = undefined
        }

        try {
            await futurosPedidosAPI.create(payload)
            toast.success('Pedido agregado a la lista.')

            await fetchFuturosPedidos()

            // Resetear el formulario
            setNuevoProducto('')
            setNuevaCantidad('')
            setProductoSeleccionadoId(null)
            setUsarProductoExistente(false)
        } catch (error) {
            toast.error('Error al guardar el pedido en la DB.')
            console.error(error)
        }
    }


    const eliminarFuturo = async (id: number) => {
        try {
            await futurosPedidosAPI.delete(id)
            toast.success('Pedido eliminado.')
            setFuturosPedidos(prev => prev.filter(p => p.id !== id))
        } catch (error) {
            toast.error('Error al eliminar el pedido de la DB.')
            console.error(error)
        }
    }

    // 💡 useEffect para cargar los futuros pedidos al abrir el modal
    useEffect(() => {
        if (mostrarFuturos) {
            fetchFuturosPedidos()
        }
    }, [mostrarFuturos])

    // ====================================================

    useEffect(() => {
        fetchCompras()
    }, [])

    const fetchCompras = async () => {
        try {
            const response = await comprasAPI.getAll()
            setCompras(response.data)
        } catch (error) {
            toast.error('Error al cargar compras')
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }
    const formatPrice = (value: number | string | undefined) => {
        if (value === null || value === undefined || value === '') return '$0';
        return '$' + Number(value).toLocaleString("es-AR");
    };

    const verDetalles = async (compraId: number) => {
        setCargandoDetalles(true)
        try {
            const response = await comprasAPI.getById(compraId)
            setCompraSeleccionada(response.data)
            setMostrarDetalles(true)
        } catch (error) {
            toast.error('Error al cargar detalles de la compra')
        } finally {
            setCargandoDetalles(false)
        }
    }

    // NUEVA FUNCIÓN: Eliminar compra
    const handleEliminarCompra = async (compraId: number) => {
        if (!confirm("¿Estás seguro de que quieres eliminar esta compra? Esta acción revertirá el stock y el costo del producto si se modificó.")) {
            return;
        }

        try {
            await comprasAPI.delete(compraId);
            toast.success("Compra eliminada y stock/costo revertido correctamente. ¡Revisa tu inventario!");
            setMostrarDetalles(false); // Cierra el modal
            setCompraSeleccionada(null); // Limpia la selección
            fetchCompras(); // Recarga la lista de compras
        } catch (error) {
            console.error("Error al eliminar la compra:", error);
            toast.error("Error al eliminar la compra. Verifica la consola.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Compras</h1>
                    <p className="text-gray-600">Historial de compras de mercadería</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => setMostrarFuturos(true)}
                        className="w-full sm:w-auto btn-secondary flex items-center justify-center">
                        <ClipboardList className="h-5 w-5 mr-2" />
                        Futuros Pedidos
                    </button>
                    <button
                        onClick={() => navigate('/nueva-compra')}
                        className="w-full sm:w-auto btn-primary flex items-center justify-center bg-orange-600 hover:bg-orange-700">
                        <Plus className="h-5 w-5 mr-2" />
                        Nueva Compra
                    </button>
                </div>
            </div>

            {/* LISTADO DE COMPRAS (Sin cambios) */}
            <div className={cardClass}>
                {/* VISTA DE TABLA (ESCRITORIO) */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compra</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {compras.map((compra) => (
                            <tr key={compra.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                                <Package className="h-6 w-6 text-green-600" />
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                Compra #{compra.id}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <Building className="h-4 w-4 text-gray-400 mr-2" />
                                        <span className="text-sm text-gray-900">{compra.proveedor_nombre || 'Sin proveedor'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                        <span className="text-sm text-gray-900">{new Date(compra.fecha!).toLocaleDateString()}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {/* CÓDIGO CORREGIDO: Eliminamos el DollarIcon */}
                                    <span className='text-red-600 font-bold'>{formatPrice(compra.total)}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {compra.estado || 'Completada'}
                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <button
                                        onClick={() => verDetalles(compra.id!)}
                                        disabled={cargandoDetalles}
                                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                                        <Eye className="h-4 w-4 mr-1" />
                                        {cargandoDetalles ? 'Cargando...' : 'Ver Detalles'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* VISTA DE TARJETA (MÓVIL) */}
                <div className="md:hidden space-y-3">
                    {compras.map((compra) => (
                        <div key={compra.id} className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center">
                                    <Package className="h-6 w-6 text-green-600 mr-3" />
                                    <h3 className="text-lg font-bold text-gray-900">Compra #{compra.id}</h3>
                                </div>
                                <button
                                    onClick={() => verDetalles(compra.id!)}
                                    disabled={cargandoDetalles}
                                    className="flex items-center px-3 py-1 text-xs text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 disabled:opacity-50">
                                    <Eye className="h-4 w-4 mr-1" />
                                    Ver
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-y-2 text-sm border-t pt-2">
                                <div>
                                    <span className="text-xs text-gray-500 block">Fecha</span>
                                    <div className="flex items-center">
                                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                                        <span className="text-gray-700 font-medium">{new Date(compra.fecha!).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500 block">Proveedor</span>
                                    <div className="flex items-center">
                                        <Building className="h-4 w-4 mr-1 text-gray-400" />
                                        <span className="text-gray-700 font-medium truncate">{compra.proveedor_nombre || 'Sin proveedor'}</span>
                                    </div>
                                </div>
                                <div className="col-span-1">
                                    <span className="text-xs text-gray-500 block">Estado</span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {compra.estado || 'Completada'}
                        </span>
                                </div>
                                <div className="col-span-1">
                                    <span className="text-xs text-gray-500 block">Total</span>
                                    <span className="text-xl font-bold text-red-600">{formatPrice(compra.total)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MODAL FUTUROS PEDIDOS (REFECTORIZADO A PERSISTENTE CON SELECT/INPUT) */}
            {mostrarFuturos && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex justify-center items-start pt-4 md:pt-20">
                    <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-2xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold flex items-center">
                                <ClipboardList className="h-5 w-5 mr-2" /> Futuros Pedidos
                            </h2>
                            <button onClick={() => setMostrarFuturos(false)} className="text-gray-500 hover:text-gray-700 p-1">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* 💡 Toggle de selección */}
                        <div className="flex gap-4 mb-3">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={usarProductoExistente}
                                    onChange={() => setUsarProductoExistente(prev => !prev)}
                                />
                                Usar **Producto Existente**
                            </label>
                        </div>

                        {/* RESPONSIVE: Input/Botón en fila compacta */}
                        <div className="flex flex-col sm:flex-row gap-2 mb-4">

                            {/* 💡 CAMPO DE SELECCIÓN CONDICIONAL */}
                            {usarProductoExistente ? (
                                <select
                                    className={`${inputFieldClass} flex-1`}
                                    value={productoSeleccionadoId || ""}
                                    onChange={(e) => setProductoSeleccionadoId(Number(e.target.value))}
                                >
                                    <option value="">-- Seleccionar producto --</option>
                                    {productos.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.nombre}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    placeholder="Nombre del producto custom"
                                    value={nuevoProducto}
                                    onChange={(e) => setNuevoProducto(e.target.value)}
                                    className={`${inputFieldClass} flex-1`}/>
                            )}

                            <input
                                type="text"
                                placeholder="Cantidad"
                                value={nuevaCantidad}
                                onChange={(e) => setNuevaCantidad(e.target.value)}
                                className={`${inputFieldClass} w-full sm:w-28`}/>
                            <button
                                onClick={agregarFuturo}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg w-full sm:w-auto flex-shrink-0">
                                Agregar
                            </button>
                        </div>

                        {/* 💡 Muestra el estado de carga o la tabla */}
                        {cargandoFuturos ? (
                            <p className="text-blue-500">Cargando pedidos...</p>
                        ) : futurosPedidos.length === 0 ? (
                            <p className="text-gray-500">No hay productos en la lista.</p>
                        ) : (
                            <div className="overflow-x-auto border rounded-lg max-h-[75vh]">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cant</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {futurosPedidos.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{item.id}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {/* Muestra el producto_nombre si existe (viene del JOIN), sino el producto custom */}
                                                {item.producto_nombre || item.producto}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.cantidad}</td>
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                <button
                                                    onClick={() => eliminarFuturo(item.id!)}
                                                    className="text-red-500 hover:text-red-700 p-1">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL DETALLES (Sin cambios) */}
            {mostrarDetalles && compraSeleccionada && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-4 md:top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
                        <div className="mt-3">

                            {/* TÍTULO Y BOTÓN CERRAR */}
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Detalles de Compra #{compraSeleccionada.id}
                                </h3>
                                <button
                                    onClick={() => setMostrarDetalles(false)}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* BOTÓN ELIMINAR (AÑADIDO) */}
                            <div className="flex gap-2 mb-4 border-b pb-4">
                                <button
                                    onClick={() => handleEliminarCompra(compraSeleccionada.id!)}
                                    className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-150 ease-in-out text-sm font-medium"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar Compra
                                </button>
                            </div>

                            {/* RESPONSIVE: Grid de 1 columna en móvil, 3 en md */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <p className="text-sm text-blue-600 font-medium">Proveedor</p>
                                    <p className="text-blue-900 font-bold">{compraSeleccionada.proveedor_nombre || 'Sin proveedor'}</p>
                                </div>
                                <div className="bg-red-50 p-3 rounded-lg">
                                    <p className="text-sm text-red-600 font-medium">Total</p>
                                    <p className="text-red-900 font-bold">{formatPrice(compraSeleccionada.total)}</p>
                                </div>
                                <div className="bg-purple-50 p-3 rounded-lg">
                                    <p className="text-sm text-purple-600 font-medium">Fecha</p>
                                    <p className="text-purple-900 font-bold">{new Date(compraSeleccionada.fecha!).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <h4 className="text-md font-semibold text-gray-900 mb-3">Productos Comprados</h4>

                                {/* Tabla de detalles con scroll horizontal forzado */}
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cant</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio U.</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                                        </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                        {compraSeleccionada.detalles.map((detalle, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{detalle.producto_nombre}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{detalle.cantidad}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatPrice(detalle.precio_unitario)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-red-600">{formatPrice(detalle.subtotal)}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span>Total de la Compra:</span>
                                    <span className="text-red-600">{formatPrice(compraSeleccionada.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Compras