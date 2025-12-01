import React, { useEffect, useState } from "react"
import { futurosPedidosAPI, productosAPI, FuturoPedido, Producto } from "../services/api"
import { toast } from "react-toastify"
import * as XLSX from 'xlsx'; // <--- 1. Importar librería

const FuturosPedidos: React.FC = () => {
    const [futurosPedidos, setFuturosPedidos] = useState<FuturoPedido[]>([])
    const [productos, setProductos] = useState<Producto[]>([])
    const [loading, setLoading] = useState(false)

    // Estados para nuevo pedido
    const [usarProductoExistente, setUsarProductoExistente] = useState(true)
    const [productoSeleccionado, setProductoSeleccionado] = useState<number | null>(null)
    const [productoCustom, setProductoCustom] = useState("")
    const [cantidad, setCantidad] = useState("")

    // Para editar
    const [editandoId, setEditandoId] = useState<number | null>(null)

    useEffect(() => {
        fetchFuturos()
        productosAPI.getAll().then(res => setProductos(res.data))
    }, [])

    const fetchFuturos = async () => {
        setLoading(true)
        try {
            const res = await futurosPedidosAPI.getAll()
            setFuturosPedidos(res.data)
        } catch {
            toast.error("Error al cargar futuros pedidos")
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setUsarProductoExistente(true)
        setProductoSeleccionado(null)
        setProductoCustom("")
        setCantidad("")
        setEditandoId(null)
    }

    // --- 2. Lógica de Exportación a Excel ---
    const handleExportarExcel = () => {
        if (futurosPedidos.length === 0) {
            toast.warning("No hay datos para exportar");
            return;
        }

        // Preparamos los datos para que sean legibles en el Excel
        // Usamos la misma lógica que tu tabla para resolver el nombre
        const datosParaExcel = futurosPedidos.map(fp => ({
            ID: fp.id,
            Producto: fp.producto_nombre || productos.find((p) => p.id === fp.producto_id)?.nombre || "-",
            Cantidad: fp.cantidad,
            // Puedes agregar más columnas si quieres, ej: Fecha de creación
            // Fecha: fp.creado_en
        }));

        // Crear hoja de trabajo
        const worksheet = XLSX.utils.json_to_sheet(datosParaExcel);

        // Ajustar ancho de columnas (Opcional, para que se vea pro)
        const wscols = [
            { wch: 5 },  // ID width
            { wch: 40 }, // Producto width
            { wch: 15 }, // Cantidad width
        ];
        worksheet['!cols'] = wscols;

        // Crear libro y agregar hoja
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Futuros Pedidos");

        // Descargar archivo
        XLSX.writeFile(workbook, "Futuros_Pedidos.xlsx");
    };
    // ----------------------------------------

    const handleSave = async () => {
        if (!cantidad.trim()) {
            toast.error("Debe ingresar una cantidad")
            return
        }

        try {
            let payload: any = { cantidad }

            if (usarProductoExistente && productoSeleccionado) {
                payload.producto_id = productoSeleccionado
            } else if (!usarProductoExistente && productoCustom.trim()) {
                payload.producto = productoCustom
            } else {
                toast.error("Debe seleccionar o ingresar un producto")
                return
            }

            if (editandoId) {
                await futurosPedidosAPI.update(editandoId, payload)
                toast.success("Pedido actualizado")
            } else {
                await futurosPedidosAPI.create(payload)
                toast.success("Pedido agregado")
            }

            fetchFuturos()
            resetForm()
        } catch {
            toast.error("Error al guardar el pedido")
        }
    }

    const handleEdit = (pedido: FuturoPedido) => {
        setEditandoId(pedido.id || null)
        setCantidad(pedido.cantidad || "")

        if (pedido.producto_id) {
            setUsarProductoExistente(true)
            setProductoSeleccionado(pedido.producto_id)
            setProductoCustom("")
        } else {
            setUsarProductoExistente(false)
            setProductoSeleccionado(null)
            setProductoCustom(pedido.producto_nombre || "")
        }
    }

    const handleDelete = async (id: number) => {
        if (!window.confirm("¿Eliminar este pedido?")) return
        try {
            await futurosPedidosAPI.delete(id)
            toast.success("Pedido eliminado")
            fetchFuturos()
        } catch {
            toast.error("Error al eliminar pedido")
        }
    }

    return (
        <div className="p-6">
            {/* Cabecera con Flex para separar Título y Botón */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Futuros Pedidos</h2>

                {/* 3. Botón Exportar */}
                <button
                    onClick={handleExportarExcel}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                    {/* Icono simple de descarga (opcional) */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Exportar Excel
                </button>
            </div>

            {/* Formulario */}
            <div className="border rounded p-4 mb-6 bg-white shadow-sm">
                <h3 className="text-lg font-semibold mb-3">
                    {editandoId ? "Editar Pedido" : "Nuevo Pedido"}
                </h3>
                {/* ... Resto del formulario igual ... */}
                <div className="flex gap-4 mb-3">
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            checked={usarProductoExistente}
                            onChange={() => setUsarProductoExistente(true)}
                        />
                        Producto existente
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            checked={!usarProductoExistente}
                            onChange={() => setUsarProductoExistente(false)}
                        />
                        Producto custom
                    </label>
                </div>

                {usarProductoExistente ? (
                    <select
                        className="border rounded px-3 py-2 w-full mb-3"
                        value={productoSeleccionado || ""}
                        onChange={(e) => setProductoSeleccionado(Number(e.target.value))}
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
                        placeholder="Nombre del producto"
                        className="border rounded px-3 py-2 w-full mb-3"
                        value={productoCustom}
                        onChange={(e) => setProductoCustom(e.target.value)}
                    />
                )}

                <input
                    type="text"
                    placeholder="Cantidad"
                    className="border rounded px-3 py-2 w-full mb-3"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                />

                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                    >
                        {editandoId ? "Actualizar" : "Agregar"}
                    </button>
                    {editandoId && (
                        <button
                            onClick={resetForm}
                            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                        >
                            Cancelar
                        </button>
                    )}
                </div>
            </div>

            {/* Tabla de pedidos */}
            {loading ? (
                <p>Cargando...</p>
            ) : (
                <div className="overflow-x-auto"> {/* Wrapper para scroll en moviles */}
                    <table className="w-full border bg-white shadow-sm">
                        <thead className="bg-gray-100">
                        <tr>
                            <th className="border px-2 py-1 text-left">ID</th>
                            <th className="border px-2 py-1 text-left">Producto</th>
                            <th className="border px-2 py-1 text-left">Cantidad</th>
                            <th className="border px-2 py-1 text-center">Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {futurosPedidos.map((fp) => (
                            <tr key={fp.id} className="hover:bg-gray-50">
                                <td className="border px-2 py-1">{fp.id}</td>
                                <td className="border px-2 py-1">
                                    {fp.producto_nombre || productos.find((p) => p.id === fp.producto_id)?.nombre || "-"}
                                </td>
                                <td className="border px-2 py-1">{fp.cantidad}</td>
                                <td className="border px-2 py-1 flex gap-2 justify-center">
                                    <button
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                                        onClick={() => handleEdit(fp)}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                                        onClick={() => handleDelete(fp.id!)}
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export default FuturosPedidos