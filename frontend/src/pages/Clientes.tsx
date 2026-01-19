// src/pages/Clientes.tsx
import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, User, Phone, MapPin } from 'lucide-react' // Importé Phone y MapPin para las Cards
import { clientesAPI } from '../services/api'
import { Cliente } from '../services/api'
import toast from 'react-hot-toast'

// Clases de utilidad
const cardClass = "bg-white shadow-lg rounded-xl p-4 md:p-6";
const inputFieldClass = "w-full border border-gray-300 p-2 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out text-sm";


const Clientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [formData, setFormData] = useState({ nombre: '', telefono: '', direccion: '' })
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    fetchClientes()
  }, [])

  const fetchClientes = async () => {
    try {
      const response = await clientesAPI.getAll()
      setClientes(Array.isArray(response.data) ? response.data : [])
    } catch {
      toast.error('Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCliente?.id) {
        await clientesAPI.update(editingCliente.id, formData)
        toast.success('Cliente actualizado exitosamente')
      } else {
        await clientesAPI.create(formData)
        toast.success('Cliente creado exitosamente')
      }
      setShowModal(false)
      resetForm()
      fetchClientes()
    } catch {
      toast.error(editingCliente ? 'Error al actualizar cliente' : 'Error al crear cliente')
    }
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setFormData({
      nombre: cliente.nombre || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!id) return
    if (window.confirm('¿Eliminar cliente? Esta acción no se puede deshacer.')) {
      try {
        await clientesAPI.delete(id)
        toast.success('Cliente eliminado')
        fetchClientes()
      } catch {
        toast.error('Error al eliminar cliente')
      }
    }
  }

  const resetForm = () => {
    setFormData({ nombre: '', telefono: '', direccion: '' })
    setEditingCliente(null)
  }

  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    )
  }

  const filtrados = clientes.filter(c =>
      (c.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.telefono || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.direccion || '').toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
            <p className="text-gray-600">Gestiona tu base de clientes</p>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true) }} className="w-full md:w-auto btn-primary flex items-center justify-center">
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Cliente
          </button>
        </div>

        <div className="mb-4">
          <input
              type="text"
              placeholder="Buscar por nombre, teléfono o dirección..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className={`${inputFieldClass} w-full md:w-1/2`}
          />
        </div>

        <div className={cardClass}>
          {/* VISTA DE TABLA (ESCRITORIO) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dirección</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {filtrados.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <User className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{cliente.nombre}</div>
                          <div className="text-xs text-gray-500">ID: {cliente.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{cliente.telefono || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{cliente.direccion || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button onClick={() => handleEdit(cliente)} className="text-indigo-600 hover:text-indigo-900">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => cliente.id && handleDelete(cliente.id)} className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
              ))}
              {filtrados.length === 0 && (
                  <tr>
                    <td className="px-6 py-6 text-center text-gray-500" colSpan={4}>Sin resultados</td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>

          {/* VISTA DE TARJETA (MÓVIL) */}
          <div className="md:hidden space-y-3">
            {filtrados.map((cliente) => (
                <div key={cliente.id} className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-bold text-gray-900">{cliente.nombre}</h3>
                        <p className="text-xs text-gray-500">ID: {cliente.id}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => handleEdit(cliente)} className="text-indigo-600 hover:text-indigo-900 p-1">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => cliente.id && handleDelete(cliente.id)} className="text-red-600 hover:text-red-900 p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 border-t pt-2">
                    {cliente.telefono && (
                        <div className="flex items-center text-sm text-gray-700">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{cliente.telefono}</span>
                        </div>
                    )}
                    {cliente.direccion && (
                        <div className="flex items-start text-sm text-gray-700">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-1" />
                          <span>{cliente.direccion}</span>
                        </div>
                    )}
                  </div>
                </div>
            ))}
            {filtrados.length === 0 && (
                <div className="text-center py-6 text-gray-500">Sin resultados</div>
            )}
          </div>
        </div>

        {showModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              {/* Modal ahora usa w-11/12 max-w-lg para mejor responsividad */}
              <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-lg shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nombre *</label>
                      <input
                          type="text"
                          required
                          value={formData.nombre}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          className={inputFieldClass}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                      <input
                          type="tel"
                          value={formData.telefono}
                          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                          className={inputFieldClass}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Dirección</label>
                      <textarea
                          value={formData.direccion}
                          onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                          className={inputFieldClass}
                          rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button type="button" onClick={() => { setShowModal(false); resetForm() }} className="btn-secondary">
                        Cancelar
                      </button>
                      <button type="submit" className="btn-primary">
                        {editingCliente ? 'Actualizar' : 'Crear'} Cliente
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
        )}
      </div>
  )
}

export default Clientes