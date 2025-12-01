import React, { useEffect, useState } from "react"
import { futurosPedidosAPI, productosAPI, FuturoPedido, Producto } from "../services/api"
import { toast } from "react-toastify"
import * as XLSX from 'xlsx'; // <--- ASEGURATE DE TENER ESTO INSTALADO: npm install xlsx

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
            // Asumimos que el backend ya trae el orden correcto (DESC)
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

    // --- LÓGICA EXCEL ---
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
        // Anchos de columna
        worksheet['!cols'] = [{ wch: 5 }, { wch: 40 }, { wch: 15 }];

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

            {/* Título de la sección */}
            <h2 className="text-xl font-bold mb-4">Futuros Pedidos</h2>

            {/* --- FORMULARIO --- */}
            <div className="border rounded p-4 bg-gray-50 shadow-sm mb-4">
                <h3 className="text-sm font-semibold mb-3 text-gray-600 uppercase">
                    {editandoId ? "Editar Pedido" : "Nuevo Pedido"}
                </h3>

                <div className="flex gap-4 mb-3 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            checked={usarProductoExistente}
                            onChange={() => setUsarProductoExistente(true)}
                        />
                        Producto existente
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
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
                        className="border rounded px-3 py-2 w-full mb-3 text-sm bg-white"
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
                        className="border rounded px-3 py-2 w-full mb-3 text-sm"
                        value={productoCustom}
                        onChange={(e) => setProductoCustom(e.target.value)}
                    />
                )}

                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Cantidad"
                        className="border rounded px-3 py-2 w-1/3 text-sm"
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                    />

                    <button
                        onClick={handleSave}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium flex-grow"
                    >
                        {editandoId ? "Actualizar" : "Agregar"}
                    </button>
                    {editandoId && (
                        <button
                            onClick={resetForm}
                            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded text-sm"
                        >
                            Cancelar
                        </button>
                    )}
                </div>
            </div>

            {/* --- BARRA DE HERRAMIENTAS (Aquí está el botón visible) --- */}
            {/* Usamos 'sticky' para probar si ayuda, y z-index alto */}
            <div className="flex justify-end items-center mb-2 px-1">
                <button
                    onClick={handleExportarExcel}
                    className="flex items-center gap-2 text-sm text-green-700 font-medium hover:text-green-900 transition-colors bg-green-50 px-3 py-1 rounded border border-green-200"
                >
                    {/* Icono de descarga */}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Descargar Excel
                </button>
            </div>

            {/* --- TABLA --- */}
            {loading ? (
                <p className="text-center text-gray-500 py-4">Cargando...</p>
            ) : (
                <div className="overflow-x-auto border rounded">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-xs">
                        <tr>
                            <th className="px-4 py-2 border-b">#</th>
                            <th className="px-4 py-2 border-b">Producto</th>
                            <th className="px-4 py-2 border-b text-center">Cant</th>
                            <th className="px-4 py-2 border-b text-center">Acciones</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                        {futurosPedidos.map((fp) => (
                            <tr key={fp.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 font-bold text-gray-700">{fp.id}</td>
                                <td className="px-4 py-2">
                                    {fp.producto_nombre || productos.find((p) => p.id === fp.producto_id)?.nombre || "-"}
                                </td>
                                <td className="px-4 py-2 text-center">{fp.cantidad}</td>
                                <td className="px-4 py-2 flex justify-center gap-2">
                                    <button
                                        className="text-blue-500 hover:text-blue-700 font-medium"
                                        onClick={() => handleEdit(fp)}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        className="text-red-500 hover:text-red-700 font-medium ml-2"
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