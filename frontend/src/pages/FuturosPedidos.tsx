import React, { useEffect, useState } from "react"
import { futurosPedidosAPI, productosAPI, FuturoPedido, Producto } from "../services/api"
import { toast } from "react-toastify"
// Asegurate de tener instalado: npm install xlsx
import * as XLSX from 'xlsx';
import { Download } from "lucide-react"; // Opcional: Si usas lucide-react, sino usa el SVG de abajo

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

    // --- FUNCIONALIDAD EXCEL ---
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
            toast.error("Error al guardar")
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
        if (!window.confirm("¿Eliminar?")) return
        try {
            await futurosPedidosAPI.delete(id)
            toast.success("Eliminado")
            fetchFuturos()
        } catch {
            toast.error("Error al eliminar")
        }
    }

    return (
        <div className="p-5 h-full flex flex-col">

            {/* --- CABECERA (AQUI ESTÁ EL BOTÓN EXCEL) --- */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <span className="text-2xl">📋</span> Futuros Pedidos
                    </h2>

                    {/* BOTÓN EXCEL: Visible al lado del título */}
                    <button
                        onClick={handleExportarExcel}
                        title="Descargar Excel"
                        className="bg-green-100 text-green-700 hover:bg-green-200 border border-green-300 p-2 rounded-full transition-colors"
                    >
                        {/* Icono Excel */}
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* --- FORMULARIO DE CARGA --- */}
            {/* IMPORTANTE: `relative` y `z-50`.
               Esto le dice al navegador: "Este bloque flota POR ENCIMA de lo que viene después (la tabla)"
               Asi el dropdown no se tapará.
            */}
            <div className="relative z-50 mb-4 bg-white">
                <div className="flex gap-2">
                    <div className="flex-grow">
                        {/* Select / Input Wrapper */}
                        <div className="relative">
                            {/* Radio buttons para mantener lógica, aunque visualmente parezca uno en tu diseño */}
                            <div className="flex gap-2 mb-1 text-xs text-gray-400 absolute -top-5 right-0">
                                <label className="cursor-pointer"><input type="radio" checked={usarProductoExistente} onChange={()=>setUsarProductoExistente(true)}/> Existente</label>
                                <label className="cursor-pointer"><input type="radio" checked={!usarProductoExistente} onChange={()=>setUsarProductoExistente(false)}/> Custom</label>
                            </div>

                            {usarProductoExistente ? (
                                <select
                                    className="w-full border border-gray-300 rounded px-3 py-2 h-[42px] focus:ring-2 focus:ring-green-500 outline-none bg-white"
                                    value={productoSeleccionado || ""}
                                    onChange={(e) => setProductoSeleccionado(Number(e.target.value))}
                                >
                                    <option value="">Buscar producto existente...</option>
                                    {productos.map((p) => (
                                        <option key={p.id} value={p.id}>{p.nombre}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    placeholder="Escribir nuevo custom..."
                                    className="w-full border border-gray-300 rounded px-3 py-2 h-[42px] focus:ring-2 focus:ring-green-500 outline-none"
                                    value={productoCustom}
                                    onChange={(e) => setProductoCustom(e.target.value)}
                                />
                            )}
                        </div>
                    </div>

                    <div className="w-24">
                        <input
                            type="text"
                            placeholder="Cantidad"
                            className="w-full border border-gray-300 rounded px-3 py-2 h-[42px] text-center"
                            value={cantidad}
                            onChange={(e) => setCantidad(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 rounded h-[42px] transition-colors"
                    >
                        {editandoId ? "Guardar" : "Agregar"}
                    </button>

                    {editandoId && (
                        <button onClick={resetForm} className="bg-gray-400 text-white px-3 rounded h-[42px]">✕</button>
                    )}
                </div>
            </div>

            {/* --- TABLA --- */}
            {/* IMPORTANTE: `z-0` o `z-10`.
               Esto le dice al navegador: "Quédate atrás del formulario".
            */}
            <div className="flex-grow overflow-auto border border-gray-200 rounded relative z-0">
                {loading ? (
                    <div className="p-4 text-center text-gray-500">Cargando...</div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium uppercase text-xs sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-4 py-3 border-b">#</th>
                            <th className="px-4 py-3 border-b w-full">Producto</th>
                            <th className="px-4 py-3 border-b text-center">Cant</th>
                            <th className="px-4 py-3 border-b text-center">Acción</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                        {futurosPedidos.map((fp, index) => (
                            <tr key={fp.id} className="hover:bg-gray-50 group">
                                <td className="px-4 py-3 font-bold text-gray-900">{index + 1}</td>
                                <td className="px-4 py-3 font-medium text-gray-700">
                                    {fp.producto_nombre || productos.find((p) => p.id === fp.producto_id)?.nombre || "-"}
                                </td>
                                <td className="px-4 py-3 text-center text-gray-600">{fp.cantidad}</td>
                                <td className="px-4 py-3 flex justify-center gap-2">
                                    <button className="text-blue-500 hover:bg-blue-50 p-1 rounded" onClick={() => handleEdit(fp)}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </button>
                                    <button className="text-red-500 hover:bg-red-50 p-1 rounded" onClick={() => handleDelete(fp.id!)}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

export default FuturosPedidos