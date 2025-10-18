import { useEffect, useState } from 'react'
import { PlusCircle, DollarSign, Trash2, Calendar, FileText } from 'lucide-react'
import { Gasto, gastosAPI } from '../services/api'
import toast from 'react-hot-toast'

// Componente para cargar un nuevo gasto (simulación de un Modal o Formulario)
const GastoForm = ({ onSave }: { onSave: () => void }) => {
    const [concepto, setConcepto] = useState('')
    const [monto, setMonto] = useState('')
    const [fecha, setFecha] = useState(new Date().toLocaleDateString('en-CA')) // yyyy-mm-dd

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await gastosAPI.create({
                concepto,
                monto: parseFloat(monto),
                fecha: fecha,
            })
            toast.success('Gasto registrado con éxito!')
            setConcepto('')
            setMonto('')
            onSave() // Recarga la lista
        } catch (error) {
            toast.error('Error al registrar el gasto.')
        }
    }

    return (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4 bg-gray-50">
            <h3 className="text-xl font-bold flex items-center"><PlusCircle className="mr-2 h-5 w-5" /> Registrar Nuevo Gasto</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Concepto</label>
                    <input type="text" value={concepto} onChange={e => setConcepto(e.target.value)} className="input-field" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Monto ($)</label>
                    <input type="number" value={monto} onChange={e => setMonto(e.target.value)} className="input-field" step="0.01" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha</label>
                    <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="input-field" required />
                </div>
            </div>
            <button type="submit" className="btn-primary flex items-center bg-red-600 hover:bg-red-700">
                <DollarSign className="h-4 w-4 mr-2" />
                Guardar Gasto
            </button>
        </form>
    )
}

const Gastos = () => {
    const [gastos, setGastos] = useState<Gasto[]>([])
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        setLoading(true)
        try {
            const response = await gastosAPI.getAll()
            setGastos(response.data)
        } catch (error) {
            toast.error('Error al cargar la lista de gastos')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Está seguro de eliminar este gasto?')) return
        try {
            await gastosAPI.delete(id)
            toast.success('Gasto eliminado.')
            fetchData()
        } catch (error) {
            toast.error('Error al eliminar el gasto.')
        }
    }

    const totalGastos = gastos.reduce((sum, g) => sum + Number(g.monto || 0), 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <DollarSign className="h-7 w-7 mr-2 text-red-600" />
                    Gestión de Gastos
                </h1>
                <p className="text-gray-600">Registro y control de egresos operativos del negocio.</p>
            </div>

            <GastoForm onSave={fetchData} />

            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <FileText className="h-5 w-5 mr-2" /> Listado de Gastos
                    </h3>
                    <div className="bg-red-100 p-2 rounded-lg">
                        <span className="text-sm font-medium text-red-700">Total en Pantalla: </span>
                        <span className="text-lg font-bold text-red-900">${totalGastos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
                {loading ? (
                    <div className="text-center py-4">Cargando...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {gastos.map(g => (
                                <tr key={g.id} className="hover:bg-red-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{g.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{g.concepto}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">${Number(g.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(g.fecha).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => handleDelete(g.id!)} className="text-red-600 hover:text-red-900 ml-4">
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Gastos