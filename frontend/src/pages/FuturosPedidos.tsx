import React, { useEffect, useState } from "react"
import { futurosPedidosAPI, productosAPI, FuturoPedido, Producto } from "../services/api"
import { toast } from "react-toastify"

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

            console.log("Original:", res.data); // Mirá la consola (F12) para ver qué llega
            // 2. Usamos Number() para asegurar que no sean strings "10" vs "2"
            const ordenados = [...res.data].sort((a, b) => {
                return Number(b.id) - Number(a.id);
            })
            console.log("Ordenado:", ordenados); // Debería mostrar el ID más alto primero

            setFuturosPedidos(ordenados)
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
            <h2 className="text-xl font-bold mb-4">Futuros Pedidos</h2>

            {/* Formulario */}
            <div className="border rounded p-4 mb-6">
                <h3 className="text-lg font-semibold mb-3">
                    {editandoId ? "Editar Pedido" : "Nuevo Pedido"}
                </h3>

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
                <table className="w-full border">
                    <thead className="bg-gray-100">
                    <tr>
                        <th className="border px-2 py-1">ID</th>
                        <th className="border px-2 py-1">Producto</th>
                        <th className="border px-2 py-1">Cantidad</th>
                        <th className="border px-2 py-1">Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {futurosPedidos.map((fp) => (
                        <tr key={fp.id}>
                            <td className="border px-2 py-1">{fp.id}</td>
                            <td className="border px-2 py-1">
                                {fp.producto_nombre || productos.find((p) => p.id === fp.producto_id)?.nombre || "-"}
                            </td>
                            <td className="border px-2 py-1">{fp.cantidad}</td>
                            <td className="border px-2 py-1 flex gap-2">
                                <button
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                                    onClick={() => handleEdit(fp)}
                                >
                                    Editar
                                </button>
                                <button
                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                                    onClick={() => handleDelete(fp.id!)}
                                >
                                    Eliminar
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    )
}

export default FuturosPedidos
