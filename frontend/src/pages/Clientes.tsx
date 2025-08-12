import { useEffect, useState } from "react";
import { Pencil, Trash2, User } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

interface Cliente {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const fetchClientes = async () => {
    try {
      const res = await axios.get("/api/clientes");
      setClientes(res.data);
    } catch (error) {
      toast.error("Error al cargar clientes");
    }
  };

  const eliminarCliente = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar este cliente?")) return;
    try {
      await axios.delete(`/api/clientes/${id}`);
      toast.success("Cliente eliminado");
      fetchClientes();
    } catch (error) {
      toast.error("Error al eliminar cliente");
    }
  };

  const editarCliente = (cliente: Cliente) => {
    // Aquí iría la lógica para abrir un modal con los datos del cliente
    console.log("Editar cliente", cliente);
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Clientes</h1>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Cliente</th>
              <th className="py-3 px-6 text-left">Email</th>
              <th className="py-3 px-6 text-left">Teléfono</th>
              <th className="py-3 px-6 text-left">Dirección</th>
              <th className="py-3 px-6 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm font-light">
            {clientes.map((cliente) => (
              <tr
                key={cliente.id}
                className="border-b border-gray-200 hover:bg-gray-50"
              >
                {/* Avatar + Nombre */}
                <td className="py-3 px-6 text-left whitespace-nowrap flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-500 rounded-full">
                    <User size={18} />
                  </div>
                  <span className="font-medium">{cliente.nombre}</span>
                </td>

                {/* Email */}
                <td className="py-3 px-6 text-left">{cliente.email || "-"}</td>

                {/* Teléfono */}
                <td className="py-3 px-6 text-left">{cliente.telefono || "-"}</td>

                {/* Dirección */}
                <td className="py-3 px-6 text-left">{cliente.direccion || "-"}</td>

                {/* Acciones */}
                <td className="py-3 px-6 text-right flex justify-end gap-3">
                  <button
                    onClick={() => editarCliente(cliente)}
                    className="text-purple-500 hover:text-purple-700"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => eliminarCliente(cliente.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}

            {clientes.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-6 text-gray-400 italic"
                >
                  No hay clientes cargados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
