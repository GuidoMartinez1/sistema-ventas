import { useEffect, useState } from 'react';
import { clientesAPI } from '../services/api';
import { Pencil, Trash2 } from 'lucide-react';

interface Cliente {
  id: number;
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [form, setForm] = useState<Partial<Cliente>>({});
  const [editId, setEditId] = useState<number | null>(null);

  const fetchClientes = async () => {
    const { data } = await clientesAPI.getAll();
    setClientes(data);
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      await clientesAPI.update(editId, form as Cliente);
    } else {
      await clientesAPI.create(form as Cliente);
    }
    setForm({});
    setEditId(null);
    fetchClientes();
  };

  const handleEdit = (cliente: Cliente) => {
    setForm(cliente);
    setEditId(cliente.id);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar cliente?')) {
      await clientesAPI.delete(id);
      fetchClientes();
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Clientes</h1>
      <form onSubmit={handleSubmit} className="mb-4 space-y-2">
        <input
          className="border p-1 w-full"
          placeholder="Nombre"
          value={form.nombre || ''}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          required
        />
        <input
          className="border p-1 w-full"
          placeholder="Email"
          value={form.email || ''}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="border p-1 w-full"
          placeholder="Teléfono"
          value={form.telefono || ''}
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
        />
        <input
          className="border p-1 w-full"
          placeholder="Dirección"
          value={form.direccion || ''}
          onChange={(e) => setForm({ ...form, direccion: e.target.value })}
        />
        <button className="bg-blue-500 text-white px-4 py-1 rounded">
          {editId ? 'Actualizar' : 'Agregar'}
        </button>
      </form>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">Nombre</th>
            <th className="border px-2 py-1">Email</th>
            <th className="border px-2 py-1">Teléfono</th>
            <th className="border px-2 py-1">Dirección</th>
            <th className="border px-2 py-1">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((c) => (
            <tr key={c.id}>
              <td className="border px-2 py-1">{c.nombre}</td>
              <td className="border px-2 py-1">{c.email}</td>
              <td className="border px-2 py-1">{c.telefono}</td>
              <td className="border px-2 py-1">{c.direccion}</td>
              <td className="border px-2 py-1 flex gap-2 justify-center">
                <button onClick={() => handleEdit(c)} className="text-blue-500">
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleDelete(c.id)} className="text-red-500">
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
