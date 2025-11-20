import { useEffect, useState } from 'react'
import { Plus, Package, Calendar, Building, Eye, X, ClipboardList, Trash2, DollarSign as DollarIcon, Edit } from 'lucide-react'
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

    // 💡 ESTADOS DEL FORMULARIO UNIFICADO (CREACIÓN)
    const [productos, setProductos] = useState<Producto[]>([])
    const [productoSeleccionadoId, setProductoSeleccionadoId] = useState<number | null>(null)
    const [nuevaCantidad, setNuevaCantidad] = useState('')
    const [busquedaProductoExistente, setBusquedaProductoExistente] = useState('')
    const [mostrarSugerenciasProducto, setMostrarSugerenciasProducto] = useState(false)

    // 💡 ESTADOS PARA EDICIÓN
    const [editandoId, setEditandoId] = useState<number | null>(null);
    const [cantidadEditando, setCantidadEditando] = useState<string>('');


    // 💡 Lógica de filtrado para el Autocomplete
    const productosSugeridos = productos.filter(p =>
        (p.nombre?.toLowerCase().includes(busquedaProductoExistente.toLowerCase()))
    ).slice(0, 10);


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

    // 💡 FUNCIÓN PARA SELECCIONAR UN PRODUCTO DEL AUTOSUGERENCIA
    const seleccionarProductoAutocomplete = (producto: Producto) => {
        setProductoSeleccionadoId(producto.id || null);
        setBusquedaProductoExistente(producto.nombre); // Muestra el nombre completo en el input
        setMostrarSugerenciasProducto(false);
    }

    // 💡 FUNCIÓN AGREGAR FUTURO (LÓGICA UNIFICADA)
    const agregarFuturo = async () => {
        const cantidadTrim = nuevaCantidad.trim() || undefined;

        let payload: { producto?: string; cantidad?: string; producto_id?: number } = {
            cantidad: cantidadTrim
        };

        if (productoSeleccionadoId) {
            payload.producto_id = productoSeleccionadoId;
        } else if (busquedaProductoExistente.trim()) {
            payload.producto = busquedaProductoExistente.trim();
        } else {
            toast.error('Debe buscar y seleccionar un producto o ingresar un nombre custom.');
            return;
        }

        try {
            await futurosPedidosAPI.create(payload)
            toast.success('Pedido agregado a la lista.')

            await fetchFuturosPedidos()

            // Resetear el formulario de creación
            setNuevaCantidad('')
            setProductoSeleccionadoId(null)
            setBusquedaProductoExistente('')
        } catch (error) {
            toast.error('Error al guardar el pedido en la DB.')
            console.error(error)
        }
    }

    // 💡 NUEVA FUNCIÓN: Iniciar edición
    const iniciarEdicion = (pedido: FuturoPedido) => {
        setEditandoId(pedido.id || null);
        setCantidadEditando(pedido.cantidad || '');
    };

    // 💡 NUEVA FUNCIÓN: Actualizar pedido
    const actualizarPedido = async () => {
        if (!editandoId) return;

        const cantidadTrim = cantidadEditando.trim() || undefined;

        try {
            await futurosPedidosAPI.update(editandoId, { cantidad: cantidadTrim });
            toast.success('Pedido actualizado.');

            setEditandoId(null);
            setCantidadEditando('');
            await fetchFuturosPedidos();
        } catch (error) {
            toast.error('Error al actualizar el pedido.');
            console.error(error);
        }
    };

    // 💡 FUNCIÓN CANCELAR EDICIÓN
    const cancelarEdicion = () => {
        setEditandoId(null);
        setCantidadEditando('');
    };


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
    };

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

            {/* MODAL FUTUROS PEDIDOS */}
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex justify-center items-start pt-4 md:pt-20" style={{ display: mostrarFuturos ? 'flex' : 'none' }}>
                {/* 💡 FIX SCROLL GLOBAL: max-h-full y overflow-y-auto en el modal wrapper para que el navegador maneje el scroll si el modal es muy largo */}
                <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto flex flex-col">
                    <div className="flex justify-between items-center mb-4 flex-shrink-0">
                        <h2 className="text-xl font-bold flex items-center">
                            <ClipboardList className="h-5 w-5 mr-2" /> Futuros Pedidos
                        </h2>
                        <button onClick={() => setMostrarFuturos(false)} className="text-gray-500 hover:text-gray-700 p-1">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Formulario de creación (flex-shrink-0) */}
                    <div className="flex flex-col sm:flex-row gap-2 mb-4 flex-shrink-0">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Buscar producto existente o escribir nuevo custom..."
                                value={busquedaProductoExistente}
                                onChange={(e) => {
                                    setBusquedaProductoExistente(e.target.value);
                                    const selectedName = productos.find(p => p.id === productoSeleccionadoId)?.nombre;
                                    if (productoSeleccionadoId && selectedName !== e.target.value) {
                                        setProductoSeleccionadoId(null);
                                    }
                                }}
                                className={inputFieldClass}
                                onFocus={() => setMostrarSugerenciasProducto(true)}
                                onBlur={() => setTimeout(() => setMostrarSugerenciasProducto(false), 200)}
                            />
                            {productoSeleccionadoId && !mostrarSugerenciasProducto && (
                                <span className="absolute right-3 top-2.5 text-xs text-green-600">
                                    ✅ Existente
                                </span>
                            )}

                            {mostrarSugerenciasProducto && productosSugeridos.length > 0 && (
                                <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto mt-1">
                                    {productosSugeridos.map(p => (
                                        <li
                                            key={p.id}
                                            onMouseDown={() => seleccionarProductoAutocomplete(p)}
                                            className={`px-3 py-2 cursor-pointer text-sm ${productoSeleccionadoId === p.id ? 'bg-blue-100 font-bold' : 'hover:bg-gray-100'}`}
                                        >
                                            {p.nombre}
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {mostrarSugerenciasProducto && productosSugeridos.length === 0 && busquedaProductoExistente.length > 0 && (
                                <div className="absolute z-10 w-full bg-white border rounded shadow mt-1 px-3 py-2 text-sm text-gray-500">
                                    Escribí el nombre y se guardará como custom.
                                </div>
                            )}
                        </div>

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

                    {/* 💡 Muestra el estado de carga o la tabla/tarjetas */}
                    {cargandoFuturos ? (
                        <p className="text-blue-500">Cargando pedidos...</p>
                    ) : futurosPedidos.length === 0 ? (
                        <p className="text-gray-500">No hay productos en la lista.</p>
                    ) : (
                        // 💡 CONTENEDOR DE LISTAS: Ocupa el espacio restante y tiene scroll interno
                        <div className="flex-grow overflow-y-auto mt-2">
                            {/* 💡 VISTA DE TABLA (ESCRITORIO/TABLET) */}
                            <div className="hidden md:block overflow-x-auto border rounded-lg h-full">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0 z-10"> {/* Sticky header para web */}
                                    <tr>
                                        {/* AJUSTE DE ANCHOS EN CABECERA WEB */}
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-[5%]">#</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-[65%]">Producto</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-[15%]">Cant</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-[15%]">Acción</th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {futurosPedidos.map((item, index) => (
                                        <tr key={item.id}>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                                <span className="font-bold text-gray-900">{index + 1}</span>
                                            </td>
                                            <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                                {item.producto_nombre || item.producto}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                {editandoId === item.id ? (
                                                    <input
                                                        type="text"
                                                        value={cantidadEditando}
                                                        onChange={(e) => setCantidadEditando(e.target.value)}
                                                        className="w-16 text-center border rounded px-1 py-0.5 text-xs"
                                                    />
                                                ) : (
                                                    item.cantidad || '-'
                                                )}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                <div className="flex gap-2">
                                                    {editandoId === item.id ? (
                                                        <>
                                                            <button
                                                                onClick={actualizarPedido}
                                                                className="text-green-600 hover:text-green-800 p-1"
                                                                title="Guardar"
                                                            >
                                                                ✅
                                                            </button>
                                                            <button
                                                                onClick={cancelarEdicion}
                                                                className="text-gray-600 hover:text-gray-800 p-1"
                                                                title="Cancelar"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => iniciarEdicion(item)}
                                                            className="text-blue-500 hover:text-blue-700 p-1"
                                                            title="Editar cantidad"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => eliminarFuturo(item.id!)}
                                                        className="text-red-500 hover:text-red-700 p-1"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* 💡 VISTA DE TARJETA (MÓVIL) */}
                            <div className="md:hidden space-y-3 h-full overflow-y-auto">
                                {futurosPedidos.map((item, index) => (
                                    <div key={item.id} className="border border-gray-200 rounded-lg p-3 shadow-sm bg-gray-50">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="min-w-0 flex-1 pr-2">
                                                <h4 className="text-sm font-bold text-gray-900">
                                                    {index + 1}. {item.producto_nombre || item.producto}
                                                </h4>
                                            </div>

                                            {/* Botones de acción (Eliminar) */}
                                            <div className="flex space-x-2 flex-shrink-0">
                                                <button
                                                    onClick={() => eliminarFuturo(item.id!)}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Campo de Cantidad y Edición */}
                                        <div className="flex justify-between items-center border-t pt-2 mt-2">
                                            <span className="text-xs text-gray-600 font-medium">Cantidad:</span>

                                            {editandoId === item.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={cantidadEditando}
                                                        onChange={(e) => setCantidadEditando(e.target.value)}
                                                        className="w-16 text-center border rounded px-1 py-0.5 text-xs"
                                                    />
                                                    <button onClick={actualizarPedido} className="text-green-600" title="Guardar">
                                                        ✅
                                                    </button>
                                                    <button onClick={cancelarEdicion} className="text-gray-600" title="Cancelar">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-sm text-gray-800">{item.cantidad || '-'}</span>
                                                    <button
                                                        onClick={() => iniciarEdicion(item)}
                                                        className="text-blue-500 hover:text-blue-700"
                                                        title="Editar cantidad"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>


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