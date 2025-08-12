import { useEffect, useState } from "react";
import { Pencil, Trash2, User, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { clientesAPI } from "../services/api";

interface Cliente {
  id: number;
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState<Partial<Cliente>>({ nombre: "" });

  const fetchClientes = async () => {
    try {
      const res = await clientesAPI.getAll();
      setClientes(res.data);
    } catch {
      toast.error("Error al cargar clientes");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCliente) {
        await clientesAPI.update(editingCliente.id, formData);
        toast.success("Cliente actualizado exitosamente");
      } else {
        await clientesAPI.create(formData);
        toast.success("Cliente creado exitosamente");
      }
      setShowModal(false);
      resetForm();
      fetchClientes();
    } catch {
      toast.error(
        editingCliente
          ? "Error al actualizar cliente"
          : "Error al crear cliente"
      );
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData(cliente);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas eliminar este cliente?")) return;
    try {
      await clientesAPI.delete(id);
      toast.success("Cliente eliminado");
      fetchClientes();
    } catch {
      toast.error("Error al eliminar cliente");
    }
  };

  const resetForm = () => {
    setFormData({ nombre: "", email: "", telefono: "", direccion: "" });
    setEditingCliente(null);
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">
            Gestiona tu base de datos de clientes
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Cliente
        </button>
      </div>

      {/* Tabla */}
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
                <td className="py-3 px-6 text-left whitespace-nowrap flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-500 rounded-full">
                    <User size={18} />
                  </div>
                  <span className="font-medium">{cliente.nombre}</span>
                </td>
                <td className="py-3 px-6 text-left">{cliente.email || "-"}</td>
                <td className="py-3 px-6 text-left">
                  {cliente.telefono || "-"}
                </td>
                <td className="py-3 px-6 text-left">
                  {cliente.direccion || "-"}
                </td>
                <td className="py-3 px-6 text-right flex justify-end gap-3">
                  <button
                    onClick={() => handleEdit(cliente)}
                    className="text-purple-500 hover:text-purple-700"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingCliente ? "Editar Cliente" : "Nuevo Cliente"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={formData.telefono || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, telefono: e.target.value })
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={formData.direccion || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, direccion: e.target.value })
                    }
                    className="input-field"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingCliente ? "Actualizar" : "Crear"} Cliente
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
