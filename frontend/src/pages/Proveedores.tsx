import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Building } from 'lucide-react'
import { proveedoresAPI } from '../services/api'
import { Proveedor } from '../services/api'
import toast from 'react-hot-toast'

// Clases de utilidad
const cardClass = "bg-white shadow-lg rounded-xl p-4 md:p-6";
const inputFieldClass = "w-full border border-gray-300 p-2 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out text-sm";


const Proveedores = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null)
  const [formData, setFormData] = useState({ nombre: '' })

  useEffect(() => {
    fetchProveedores()
  }, [])

  const fetchProveedores = async () => {
    try {
      const response = await proveedoresAPI.getAll()
      setProveedores(response.data)
    } catch (error) {
      toast.error('Error al cargar proveedores')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingProveedor) {
        await proveedoresAPI.update(editingProveedor.id!, formData)
        toast.success('Proveedor actualizado exitosamente')
      } else {
        await proveedoresAPI.create(formData)
        toast.success('Proveedor creado exitosamente')
      }
      setShowModal(false)
      resetForm()
      fetchProveedores()
    } catch (error) {
      toast.error(editingProveedor ? 'Error al actualizar proveedor' : 'Error al crear proveedor')
    }
  }

  const handleEdit = (proveedor: Proveedor) => {
    setEditingProveedor(proveedor)
    setFormData({ nombre: proveedor.nombre })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este proveedor?')) {
      try {
        await proveedoresAPI.delete(id)
        toast.success('Proveedor eliminado exitosamente')
        fetchProveedores()
      } catch (error) {
        toast.error('Error al eliminar proveedor')
      }
    }
  }

  const resetForm = () => {
    setFormData({ nombre: '' })
    setEditingProveedor(null)
  }

  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    )
  }

  return (
      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Proveedores</h1>
            <p className="text-gray-600">Gestiona tu base de datos de proveedores</p>
          </div>
          <button
              onClick={() => { resetForm(); setShowModal(true) }}
              className="w-full md:w-auto btn-primary flex items-center justify-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Proveedor
          </button>
        </div>

        {/* Proveedores Table / Card View */}
        <div className={cardClass}>

          {/* VISTA DE TABLA (ESCRITORIO) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {proveedores.map((proveedor) => (
                  <tr key={proveedor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Building className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {proveedor.nombre}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                            onClick={() => handleEdit(proveedor)}
                            className="text-indigo-600 hover:text-indigo-900 p-1"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => handleDelete(proveedor.id!)}
                            className="text-red-600 hover:text-red-900 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
              ))}
              </tbody>
            </table>
          </div>

          {/* VISTA DE TARJETA (MÓVIL) */}
          <div className="md:hidden space-y-3">
            {proveedores.map((proveedor) => (
                <div key={proveedor.id} className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Building className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-bold text-gray-900">{proveedor.nombre}</h3>
                        <p className="text-xs text-gray-500">ID: {proveedor.id}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => handleEdit(proveedor)} className="text-indigo-600 hover:text-indigo-900 p-1">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(proveedor.id!)} className="text-red-600 hover:text-red-900 p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
            ))}
          </div>
        </div>

        {/* Modal - Se mantiene el tamaño responsive del Modal de Clientes */}
        {showModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-lg shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
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
                          onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                          className={inputFieldClass}
                      />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                          type="button"
                          onClick={() => {
                            setShowModal(false)
                            resetForm()
                          }}
                          className="btn-secondary"
                      >
                        Cancelar
                      </button>
                      <button type="submit" className="btn-primary">
                        {editingProveedor ? 'Actualizar' : 'Crear'} Proveedor
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

export default Proveedores