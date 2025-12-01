import React, { useEffect, useState } from "react"
import { futurosPedidosAPI, productosAPI, FuturoPedido, Producto } from "../services/api"
import { toast } from "react-toastify"
import * as XLSX from 'xlsx';

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
            // Ya confiamos en que el backend trae el orden correcto (DESC)
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

    // --- Lógica de Exportación a Excel ---
    const handleExportarExcel = () => {
        if (futurosPedidos.length === 0) {
            toast.warning("No hay datos para exportar");
            return;
        }

        const datosParaExcel = futurosPedidos.map(fp => ({
            ID: fp.id,
            Producto: fp.producto_nombre || productos.find((p) => p.id === fp.producto_id)?.nombre || "-",
            Cantidad: fp.cantidad,
        }));

        const worksheet = XLSX.utils.json_to_sheet(datosParaExcel);

        // Ajuste visual de columnas del Excel
        const wscols = [
            { wch: 5 },  // ID width
            { wch: 40 }, // Producto width
            { wch: 15 }, // Cantidad width
        ];
        worksheet['!cols'] = wscols;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Futuros Pedidos");

        XLSX.writeFile(workbook, "Futuros_Pedidos.xlsx");
    };

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
        <div className="p-4">

            {/* Título simple (Si el modal ya tiene título, puedes quitar esto) */}
            <h2 className="text-xl font-bold mb-4">Futuros Pedidos</h2>

            {/* --- FORMULARIO --- */}
            <div className="border rounded p-4 mb-4 bg-gray-50 shadow-sm">
                <h3 className="text-sm font-semibold mb-3 uppercase text-gray-500">
                    {editandoId ? "Editar Ítem" : "Agregar Nuevo Ítem"}
                </h3>

                <div className="flex gap-4 mb-3">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                            type="radio"
                            checked={usarProductoExistente}
                            onChange={() => setUsarProductoExistente(true)}
                        />
                        Producto existente
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                            type="radio"
                            checked={!usarProductoExistente}
                            onChange={() => setUsarProductoExistente(false)}
                        />
                        Producto custom
                    </label>
                </div>

                <div className="flex gap-2 items-end">
                    <div className="flex-grow">
                        {usarProductoExistente ? (
                            <select
                                className="border rounded px-3 py-2 w-full text-sm bg-white"
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
                                className="border rounded px-3 py-2 w-full text-sm"
                                value={productoCustom}
                                onChange={(e) => setProductoCustom(e.target.value)}
                            />
                        )}
                    </div>

                    <div className="w-24">
                        <input
                            type="text"
                            placeholder="Cant."
                            className="border rounded px-3 py-2 w-full text-sm"
                            value={cantidad}
                            onChange={(e) => setCantidad(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium h-[38px]"
                    >
                        {editandoId ? "Actualizar" : "Agregar"}
                    </button>

                    {editandoId && (
                        <button
                            onClick={resetForm}
                            className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-2 rounded text-sm h-[38px]"
                        >
                            X
                        </button>
                    )}
                </div>
            </div>

            {/* --- BARRA DE HERRAMIENTAS (Botón visible aquí) --- */}
            <div className="flex justify-end mb-2">
                <button
                    onClick={handleExportarExcel}
                    className="flex items-center gap-2 text-green-700 bg-white border border-green-200 hover:bg-green-50 px-3 py-1.5 rounded text-sm transition-colors shadow-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Descargar Excel
                </button>
            </div>

            {/* --- TABLA --- */}
            {loading ? (
                <p className="text-center py-4 text-gray-500">Cargando...</p>
            ) : (
                <div className="border rounded overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 text-gray-600 font-medium">
                        <tr>
                            <th className="px-4 py-2 border-b">#</th>
                            <th className="px-4 py-2 border-b">PRODUCTO</th>
                            <th className="px-4 py-2 text-center border-b">CANT</th>
                            <th className="px-4 py-2 text-center border-b">ACCIÓN</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                        {futurosPedidos.map((fp, index) => (
                            <tr key={fp.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 font-bold text-gray-700">{index + 1}</td>
                                <td className="px-4 py-2">
                                    {fp.producto_nombre || productos.find((p) => p.id === fp.producto_id)?.nombre || "-"}
                                </td>
                                <td className="px-4 py-2 text-center">{fp.cantidad}</td>
                                <td className="px-4 py-2 flex justify-center gap-2">
                                    <button
                                        className="text-blue-500 hover:text-blue-700 p-1 transition-colors"
                                        onClick={() => handleEdit(fp)}
                                        title="Editar"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                    <button
                                        className="text-red-500 hover:text-red-700 p-1 transition-colors"
                                        onClick={() => handleDelete(fp.id!)}
                                        title="Eliminar"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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