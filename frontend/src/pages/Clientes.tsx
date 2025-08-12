import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

interface Cliente {
  id: number;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  // Cargar clientes
  const fetchClientes = async () => {
    try {
      const res = await api.get("/clientes");
      setClientes(res.data);
    } catch (err) {
      toast.error("Error al cargar clientes");
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  // Guardar cliente (crear o editar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/clientes/${editingId}`, {
          nombre,
          email,
          telefono,
          direccion,
        });
        toast.success("Cliente actualizado");
      } else {
        await api.post("/clientes", {
          nombre,
          email,
          telefono,
          direccion,
        });
        toast.success("Cliente creado");
      }
      setNombre("");
      setEmail("");
      setTelefono("");
      setDireccion("");
      setEditingId(null);
      fetchClientes();
    } catch {
      toast.error("Error al guardar cliente");
    }
  };

  // Editar cliente
  const handleEdit = (cliente: Cliente) => {
    setEditingId(cliente.id);
    setNombre(cliente.nombre);
    setEmail(cliente.email || "");
    setTelefono(cliente.telefono || "");
    setDireccion(cliente.direccion || "");
  };

  // Eliminar cliente
  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que quieres eliminar este cliente?")) return;
    try {
      await api.delete(`/clientes/${id}`);
      toast.success("Cliente eliminado");
      fetchClientes();
    } catch {
      toast.error("Error al eliminar cliente");
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Clientes</h1>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-2 max-w-md">
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Teléfono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Dirección"
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {editingId ? "Actualizar" : "Agregar"}
        </button>
      </form>

      {/* Tabla */}
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Nombre</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Teléfono</th>
            <th className="border p-2">Dirección</th>
            <th className="border p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((cliente) => (
            <tr key={cliente.id} className="border">
              <td className="border p-2">{cliente.nombre}</td>
              <td className="border p-2">{cliente.email}</td>
              <td className="border p-2">{cliente.telefono}</td>
              <td className="border p-2">{cliente.direccion}</td>
              <td className="border p-2 flex gap-2 justify-center">
                <button
                  onClick={() => handleEdit(cliente)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => handleDelete(cliente.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
