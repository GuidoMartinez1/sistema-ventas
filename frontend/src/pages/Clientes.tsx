import { useEffect, useState } from "react";
import { User, Edit, Trash2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

interface Cliente {
  id?: number;
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState<Cliente>({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
  });

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/clientes");
      setClientes(res.data);
    } catch (error) {
      toast.error("Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCliente) {
        await axios.put(`/api/clientes/${editingCliente.id}`, formData);
        toast.success("Cliente actualizado exitosamente");
      } else {
        await axios.post("/api/clientes", formData);
        toast.success("Cliente creado exitosamente");
      }
      setShowModal(false);
      resetForm();
      fetchClientes();
    } catch (error) {
      toast.error(editingCliente ? "Error al actualizar cliente" : "Error al crear cliente");
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nombre: cliente.nombre,
      email: cliente.email || "",
      telefono: cliente.telefono || "",
      direccion: cliente.direccion || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Está seguro de que desea eliminar este cliente?")) {
      try {
        await axios.delete(`/api/clientes/${id}`);
        toast.success("Cliente eliminado exitosamente");
        fetchClientes();
      } catch (error) {
        toast.error("Error al eliminar cliente");
      }
    }
  };

  const resetForm = () => {
    setFormData({ nombre: "", email: "", telefono: "", direccion: "" });
    setEditingCliente(null);
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">Gestiona tu base de datos de clientes</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Cliente
        </button>
      </div>

      {/* Tabla de clientes */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dirección
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-500 rounded-full">
                      <User size={18} />
                    </div>
                    <span className="font-medium">{cliente.nombre}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{cliente.email || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{cliente.telefono || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{cliente.direccion || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2 justify-end">
                      <button
                        onClick={() => handleEdit(cliente)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cliente.id!)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {clientes.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-400 italic">
                    No hay clientes cargados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
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
