import { useEffect, useState } from 'react'
import { 
  Package, 
  Users, 
  ShoppingCart, 
  DollarSign,
  AlertTriangle
} from 'lucide-react'
import { statsAPI, productosAPI } from '../services/api'
import { Stats, Producto } from '../services/api'

const Dashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null)
  const [bajoStock, setBajoStock] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, bajoStockResponse] = await Promise.all([
          statsAPI.getStats(),
          productosAPI.getBajoStock()
        ])
        setStats(statsResponse.data)
        setBajoStock(bajoStockResponse.data)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  const cards = [
    {
      title: 'Total Productos',
      value: stats?.total_productos || 0,
      icon: Package,
      color: 'bg-orange-500',
    },
    {
      title: 'Total Clientes',
      value: stats?.total_clientes || 0,
      icon: Users,
      color: 'bg-orange-600',
    },
    {
      title: 'Total Ventas',
      value: stats?.total_ventas || 0,
      icon: ShoppingCart,
      color: 'bg-orange-700',
    },
    {
      title: 'Ingresos Totales',
      value: `$${(stats?.total_ventas_monto || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-orange-400',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard - AliMar</h1>
        <p className="text-gray-600">Resumen de tu negocio de mascotas</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.title} className="card">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {bajoStock.length > 0 && (
        <div className="card">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              Productos con Bajo Stock
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bajoStock.map((producto) => (
                  <tr key={producto.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {producto.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {producto.stock} unidades
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${producto.precio}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard 