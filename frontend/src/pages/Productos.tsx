import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Package, Download } from 'lucide-react'
import { productosAPI, categoriasAPI } from '../services/api'
import { Producto, Categoria } from '../services/api'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

// Clases de utilidad (Se mantienen las optimizaciones de responsividad)
const cardClass = "bg-white shadow-lg rounded-xl p-4 md:p-6";
const inputFieldClass = "w-full border border-gray-300 p-2 rounded-lg focus:ring-orange-500 focus:border-orange-500 transition duration-150 ease-in-out text-sm";

const formatPrice = (value: number | string | undefined) => {
    if (value === null || value === undefined || value === '') return '$0';
    return '$' + Number(value).toLocaleString("es-AR");
};

/**
 * Función que extrae el peso (KILOS o LITROS) del nombre del producto usando RegEx.
 */
const extraerKilos = (nombre: string): number | null => {
    if (!nombre) return null;
    const nombreUpper = nombre.toUpperCase();

    // Regex: Captura el número (entero o decimal) seguido de la unidad (KG, LT, KILOS, etc.)
    const regex = /(\d+(\.\d+)?)\s*(KG|KGS|KILOS|LITROS|LT|L|G|GR|GRS)/;
    const match = nombreUpper.match(regex);

    if (match && match[1]) {
        let pesoNum = parseFloat(match[1]);

        if (isNaN(pesoNum)) return null;

        let unidad = match[3];

        // Manejo de Gramos: Si es G, GR o GRS, convertir a Kilos.
        if (unidad && (unidad === 'G' || unidad === 'GR' || unidad === 'GRS')) {
            if (pesoNum > 1) { // Evita dividir 1G a 0.001kg si es un error de formato simple.
                pesoNum = pesoNum / 1000;
            }
        }

        return parseFloat(pesoNum.toFixed(2));
    }

    return null;
};

// Función de ayuda para formatear Kilos sin '.00'
const formatKilos = (kilos: number | undefined | string) => {
    if (kilos == null || kilos === '' || Number(kilos) <= 0) return '-';

    const kiloValue = Number(kilos);

    // Verifica si es un número entero
    if (Number.isInteger(kiloValue)) {
        return kiloValue.toString();
    }

    // Si no es entero, usa toFixed(2)
    return kiloValue.toFixed(2);
};

// 💡 Función de ayuda para limpiar y parsear el input de tipo texto
const parseNumericInput = (value: string): string => {
    // Permite números y un punto decimal
    return value.replace(/[^0-9.]/g, '');
};

const Productos = () => {
    const [productos, setProductos] = useState<Producto[]>([])
    const [categorias, setCategorias] = useState<Categoria[]>([])
    const [loading, setLoading] = useState(true)
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

    const exportarProductosExcel = async () => {
        try {
            const response = await productosAPI.getAll()
            const data = response.data

            if (!data.length) {
                toast.error('No hay productos para exportar')
                return
            }

            const exportData = data.map((p: any) => ({
                ID: p.id,
                Nombre: p.nombre,
                Código: p.codigo || '',
                Categoría: getCategoriaNombre(p.categoria_id),
                Precio: formatPrice(p.precio),
                Precio_x_Kg: formatPrice(p.precio_kg),
                Precio_Costo: formatPrice(p.precio_costo),
                Ganancia_Porcentaje: p.porcentaje_ganancia || 0,
                Stock: p.stock,
                Kilos: p.kilos || 0, // Incluimos KILOS en el export
            }))

            const worksheet = XLSX.utils.json_to_sheet(exportData)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos')

            XLSX.writeFile(workbook, 'productos_stock.xlsx')
            toast.success('Productos exportados con éxito')
        } catch (error) {
            toast.error('Error al exportar productos')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const kilosExtraidos = extraerKilos(formData.nombre);

        try {
            const productoData = {
                ...formData,
                kilos: kilosExtraidos, // Enviamos el valor dinámico
                precio: parseFloat(formData.precio || '0') || 0,
                precio_kg: parseFloat(formData.precio_kg || '0') || 0,
                precio_costo: parseFloat(formData.precio_costo || '0') || 0,
                porcentaje_ganancia: parseFloat(formData.porcentaje_ganancia || '0') || 0,
                stock: parseInt(formData.stock || '0') || 0,
                categoria_id: formData.categoria_id ? parseInt(formData.categoria_id) : undefined
            }

            if (editingProducto) {
                await productosAPI.update(editingProducto.id!, productoData)
                toast.success('Producto actualizado exitosamente')
            } else {
                await productosAPI.create(productoData)
                toast.success('Producto creado exitosamente')
            }

            setShowModal(false)
            setEditingProducto(null)
            resetForm()
            fetchData()
        } catch (error) {
            toast.error('Error al guardar producto')
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
        if (window.confirm('¿Está seguro de que desea eliminar este producto?')) {
            try {
                await productosAPI.delete(id)
                toast.success('Producto eliminado exitosamente')
                fetchData()
            } catch (error) {
                toast.error('Error al eliminar producto')
            }
        }
    }

    const handleAbrirBolsa = async (id: number) => {
        if (window.confirm('¿Está seguro de que desea abrir una bolsa de este producto? Se restará 1 unidad del stock.')) {
            try {
                await productosAPI.abrirBolsa(id)
                toast.success('Bolsa abierta exitosamente')
                fetchData()
            } catch (error) {
                toast.error('Error al abrir bolsa')
            }
        }
    }

    const resetForm = () => {
        setFormData({
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
    }

    const openModal = () => {
        setEditingProducto(null)
        resetForm()
        setShowModal(true)
    }

    const getCategoriaNombre = (categoriaId?: number) => {
        if (!categoriaId) return '-'
        const categoria = categorias.find(c => c.id === categoriaId)
        return categoria?.nombre || '-'
    }

    const calcularPrecioVenta = (precioCosto: number, porcentajeGanancia: number) => {
        return precioCosto * (1 + porcentajeGanancia / 100)
    }

    const calcularPrecioAutomatico = () => {
        const precioCosto = parseFloat(formData.precio_costo) || 0
        const porcentajeGanancia = parseFloat(formData.porcentaje_ganancia) || 30

        if (precioCosto > 0) {
            const precioCalculado = calcularPrecioVenta(precioCosto, porcentajeGanancia)
            setFormData(prev => ({
                ...prev,
                precio: precioCalculado.toFixed(2)
            }))
        }
    }

    const calcularPorcentajeGanancia = (precioCosto: number, precioVenta: number) => {
        if (precioCosto <= 0) return 0
        return ((precioVenta - precioCosto) / precioCosto) * 100
    }

    const handlePrecioCostoChange = (value: string) => {
        const cleanValue = parseNumericInput(value); // 💡 Usamos la función de limpieza
        setFormData(prev => ({ ...prev, precio_costo: cleanValue }))
        if (cleanValue && formData.porcentaje_ganancia) {
            setTimeout(calcularPrecioAutomatico, 100)
        }
    }

    const handlePorcentajeChange = (value: string) => {
        const cleanValue = parseNumericInput(value); // 💡 Usamos la función de limpieza
        setFormData(prev => ({ ...prev, porcentaje_ganancia: cleanValue }))
        if (cleanValue && formData.precio_costo) {
            setTimeout(calcularPrecioAutomatico, 100)
        }
    }

    const handlePrecioVentaChange = (value: string) => {
        const cleanValue = parseNumericInput(value); // 💡 Usamos la función de limpieza
        setFormData(prev => {
            const precioCosto = parseFloat(prev.precio_costo) || 0
            const precioVenta = parseFloat(cleanValue) || 0

            let nuevoPorcentaje = prev.porcentaje_ganancia
            if (precioCosto > 0 && precioVenta > 0) {
                nuevoPorcentaje = calcularPorcentajeGanancia(precioCosto, precioVenta).toFixed(2)
            }

            return {
                ...prev,
                precio: cleanValue,
                porcentaje_ganancia: nuevoPorcentaje
            }
        })
    }

    // 💡 NUEVO HANDLER PARA PRECIO X KG
    const handlePrecioKgChange = (value: string) => {
        const cleanValue = parseNumericInput(value);
        setFormData(prev => ({ ...prev, precio_kg: cleanValue }));
    }

    // 💡 NUEVO HANDLER PARA STOCK
    const handleStockChange = (value: string) => {
        // Para stock (entero), limpiamos solo dígitos
        const cleanValue = value.replace(/[^0-9]/g, '');
        setFormData(prev => ({ ...prev, stock: cleanValue }));
    }


    // 🛠️ Lógica de filtrado
    const productosFiltrados = productos
        .filter(p => p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || p.codigo?.toLowerCase().includes(busqueda.toLowerCase()))
        .filter(p => {
            if (!stockFiltro) return true
            if (stockFiltro === '>4') return (p.stock || 0) > 4
            return (p.stock || 0) === parseInt(stockFiltro)
        })
        .filter(p =>
            categoriaFiltro ? p.categoria_id?.toString() === categoriaFiltro : true
        )
        .filter(p => {
            if (!gananciaFiltro) return true;

            const ganancia = Number(p.porcentaje_ganancia) || 0;
            const [minStr, maxStr] = gananciaFiltro.split('-');
            const min = parseInt(minStr);
            const max = parseInt(maxStr);

            return ganancia >= min && ganancia < max;
        });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        )
    }

    // Función de ayuda para formatear Kilos sin '.00'
    const formatKilos = (kilos: number | undefined | string) => {
        if (kilos == null || kilos === '' || Number(kilos) <= 0) return '-';

        const kiloValue = Number(kilos); // Convertimos el valor a Number

        // Verifica si es un número entero
        if (Number.isInteger(kiloValue)) {
            return kiloValue.toString();
        }

        // Si no es entero, usa toFixed(2)
        return kiloValue.toFixed(2);
    };

    return (
        // Contenedor con límite de ancho para estética en pantallas grandes
        <div className="p-4 md:p-8 space-y-6 max-w-screen-xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Productos - AliMar</h1>
                    <p className="text-gray-600">Gestiona tu inventario de productos para mascotas</p>
                </div>
                {/* RESPONSIVE: Botones apilados en móvil, en línea en escritorio */}
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <button
                        onClick={exportarProductosExcel}
                        className="w-full sm:w-auto btn-secondary flex items-center justify-center"
                    >
                        <Download className="h-5 w-5 mr-2" />
                        Exportar Excel
                    </button>
                    <button
                        onClick={openModal}
                        className="w-full sm:w-auto btn-primary flex items-center justify-center"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Nuevo Producto
                    </button>
                </div>
            </div>

            {/* FILTROS: Grid de 4 columnas en lg */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                    type="text"
                    placeholder="Buscar por nombre o código..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className={inputFieldClass}
                />
                <select
                    value={stockFiltro}
                    onChange={(e) => setStockFiltro(e.target.value)}
                    className={inputFieldClass}
                >
                    <option value="">Todos los Stocks</option>
                    <option value="0">Stock: 0</option>
                    <option value="1">Stock: 1</option>
                    <option value="2">Stock: 2</option>
                    <option value="3">Stock: 3</option>
                    <option value=">4">Stock: &gt;4</option>
                </select>

                <select
                    value={categoriaFiltro}
                    onChange={(e) => setCategoriaFiltro(e.target.value)}
                    className={inputFieldClass}
                >
                    <option value="">Todas las categorías</option>
                    {categorias.map((categoria) => (
                        <option key={categoria.id} value={categoria.id?.toString()}>
                            {categoria.nombre}
                        </option>
                    ))}
                </select>
                <select
                    value={gananciaFiltro}
                    onChange={(e) => setGananciaFiltro(e.target.value)}
                    className={inputFieldClass}
                >
                    <option value="">Todas las Ganancias</option>
                    <option value="0-10">0% - 10%</option>
                    <option value="10-20">10% - 20%</option>
                    <option value="20-30">20% - 30%</option>
                    <option value="30-40">30% - 40%</option>
                    <option value="40-999">Más del 40%</option>
                </select>
            </div>

            {/* TABLA / CARD VIEW */}
            <div className={cardClass}>
                {/* Vista de Tabla (Desktop/Tablet) */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Producto
                            </th>
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Categoría
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Precio Venta
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Precio x Kg
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Kilos/Lt
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Costo
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ganancia %
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Stock
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {productosFiltrados.map((producto) => (
                            <tr key={producto.id} className="hover:bg-gray-50">
                                {/* ✅ Aumentado el min-w para estética */}
                                <td className="px-2 py-4 min-w-[280px]">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-8 w-8">
                                            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                                                <Package className="h-5 w-5 text-orange-600" />
                                            </div>
                                        </div>
                                        <div className="ml-3">
                                            <div className="text-sm font-medium text-gray-900">
                                                {producto.nombre}
                                            </div>
                                            {producto.descripcion && (
                                                <div className="text-xs text-gray-500">
                                                    {producto.descripcion}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {getCategoriaNombre(producto.categoria_id)}
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                                    {formatPrice(producto.precio)}
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center" >
                                    {formatPrice(producto.precio_kg)}
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                                    {formatKilos(producto.kilos)}
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                    {formatPrice(producto.precio_costo)}
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (producto.porcentaje_ganancia || 0) >= 50
                            ? 'bg-green-100 text-green-800'
                            : (producto.porcentaje_ganancia || 0) >= 30
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                    }`}>
                      {producto.porcentaje_ganancia || 0}%
                    </span>
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (producto.stock || 0) <= 4
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                    }`}>
                      {producto.stock} uds
                    </span>
                                </td>
                                <td className="px-2 py-4 text-sm font-medium">
                                    <div className="flex space-x-1 justify-center">
                                        <button
                                            onClick={() => handleEdit(producto)}
                                            className="text-indigo-600 hover:text-indigo-900 p-1"
                                            title="Editar"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(producto.id!)}
                                            className="text-red-600 hover:text-red-900 p-1"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                        {(producto.stock || 0) > 0 && (
                                            <button
                                                onClick={() => handleAbrirBolsa(producto.id!)}
                                                className="text-orange-600 hover:text-orange-900 p-1"
                                                title="Abrir bolsa (restar 1 unidad)"
                                            >
                                                📦
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* VISTA DE TARJETA (MÓVIL) - CORREGIDA Y OPTIMIZADA */}
                <div className="md:hidden space-y-4">
                    {productosFiltrados.map((producto) => (
                        <div key={producto.id} className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md">
                            <div className="flex justify-between items-start mb-3">
                                <div className="min-w-0 flex-1 pr-2">
                                    <h3 className="text-lg font-bold text-gray-900 truncate">
                                        {producto.nombre}
                                    </h3>
                                    {producto.descripcion && <p className="text-xs text-gray-500 truncate mt-1">{producto.descripcion}</p>}
                                </div>
                                <div className="flex space-x-2 flex-shrink-0 ml-auto">
                                    <button onClick={() => handleEdit(producto)} className="text-indigo-600 hover:text-indigo-900 p-1">
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleDelete(producto.id!)} className="text-red-600 hover:text-red-900 p-1">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                    {(producto.stock || 0) > 0 && (
                                        <button onClick={() => handleAbrirBolsa(producto.id!)} className="text-orange-600 hover:text-orange-900 p-1">
                                            📦
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-2 gap-x-4 border-t pt-3">
                                <div>
                                    <span className="text-xs text-gray-500 block">Precio Venta</span>
                                    <span className="font-bold text-base text-gray-900">{formatPrice(producto.precio)}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500 block">Costo / Ganancia</span>
                                    <span className="font-bold text-base text-gray-900">{formatPrice(producto.precio_costo)} /
                    <span className={`ml-1 text-xs font-medium ${
                        (producto.porcentaje_ganancia || 0) >= 50 ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {producto.porcentaje_ganancia || 0}%
                    </span>
                  </span>
                                </div>
                                <div className="col-span-1">
                                    <span className="text-xs text-gray-500 block">Stock</span>
                                    <span className={`font-bold text-base ${
                                        (producto.stock || 0) <= 4 ? 'text-red-600' : 'text-green-600'
                                    }`}>
                    {producto.stock} uds
                  </span>
                                </div>
                                <div className="col-span-1">
                                    <span className="text-xs text-gray-500 block">Categoría</span>
                                    <span className="text-sm font-medium text-gray-700">{getCategoriaNombre(producto.categoria_id)}</span>
                                </div>
                                {producto.kilos != null && producto.kilos > 0 ? (
                                    <div className="col-span-2">
                                        <span className="text-xs text-gray-500 block">Kilos/Litros</span>
                                        <span className="text-sm font-bold text-orange-600">{formatKilos(producto.kilos)}</span>
                                    </div>
                                ) : null}
                                {producto.precio_kg ? (
                                    <div className="col-span-2">
                                        <span className="text-xs text-gray-500 block">Precio x Kg</span>
                                        <span className="text-sm font-medium text-gray-700">{formatPrice(producto.precio_kg)}</span>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-lg shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                {editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Nombre *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                        className={inputFieldClass}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Descripción
                                    </label>
                                    <textarea
                                        value={formData.descripcion}
                                        onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                                        className={inputFieldClass}
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Precio por Kilo
                                    </label>
                                    {/* 💡 REFACTORIZADO */}
                                    <input
                                        type="text" // Cambiado a text
                                        value={formData.precio_kg}
                                        onChange={(e) => handlePrecioKgChange(e.target.value)} // Usamos el handler que limpia
                                        className={inputFieldClass}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Precio de Costo
                                        </label>
                                        {/* 💡 REFACTORIZADO */}
                                        <input
                                            type="text" // Cambiado a text
                                            value={formData.precio_costo}
                                            onChange={(e) => handlePrecioCostoChange(e.target.value)} // Usamos el handler que limpia
                                            className={inputFieldClass}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Porcentaje de Ganancia
                                        </label>
                                        <div className="flex">
                                            {/* 💡 REFACTORIZADO */}
                                            <input
                                                type="text" // Cambiado a text
                                                value={formData.porcentaje_ganancia}
                                                onChange={(e) => handlePorcentajeChange(e.target.value)} // Usamos el handler que limpia
                                                className={`${inputFieldClass} rounded-r-none`}
                                                placeholder="30"
                                            />
                                            <button
                                                type="button"
                                                onClick={calcularPrecioAutomatico}
                                                className="px-3 py-2 bg-orange-500 text-white rounded-r-lg hover:bg-orange-600 transition-colors"
                                            >
                                                Calcular
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Precio de Venta *
                                        </label>
                                        {/* 💡 REFACTORIZADO */}
                                        <input
                                            type="text" // Cambiado a text
                                            required
                                            value={formData.precio}
                                            onChange={(e) => handlePrecioVentaChange(e.target.value)} // Usamos el handler que limpia
                                            className={inputFieldClass}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Stock
                                        </label>
                                        {/* 💡 REFACTORIZADO */}
                                        <input
                                            type="text" // Cambiado a text
                                            value={formData.stock}
                                            onChange={(e) => handleStockChange(e.target.value)} // Usamos el handler que limpia solo dígitos
                                            className={inputFieldClass}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Categoría
                                        </label>
                                        <select
                                            value={formData.categoria_id}
                                            onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}
                                            className={inputFieldClass}
                                        >
                                            <option value="">Seleccione</option>
                                            {categorias.map((c) => (
                                                <option key={c.id} value={c.id?.toString()}>
                                                    {c.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Código
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.codigo}
                                            onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                                            className={inputFieldClass}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="btn-secondary">
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        {editingProducto ? 'Actualizar' : 'Crear'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Productos