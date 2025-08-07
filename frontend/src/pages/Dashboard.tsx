import { useEffect, useState } from 'react'
import { 
  Package, 
  Users, 
  ShoppingCart, 
  DollarSign,
  AlertTriangle,
  ShoppingBag,
  CreditCard
} from 'lucide-react'
import { statsAPI, productosAPI, bolsasAbiertasAPI } from '../services/api'
import { Stats, Producto, BolsaAbierta } from '../services/api'
import { Link } from 'react-router-dom'

const Dashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null)
  const [bajoStock, setBajoStock] = useState<Producto[]>([])
  const [bolsasAbiertas, setBolsasAbiertas] = useState<BolsaAbierta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, bajoStockResponse, bolsasResponse] = await Promise.all([
          statsAPI.getStats(),
          productosAPI.getBajoStock(),
          bolsasAbiertasAPI.getAll()
        ])
        setStats(statsResponse.data)
        setBajoStock(bajoStockResponse.data)
        setBolsasAbiertas(bolsasResponse.data)
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
      title: 'Ventas + Deudas',
      value: stats?.total_ventas_con_deudas || 0,
      icon: ShoppingCart,
      color: 'bg-orange-600',
    },
    {
      title: 'Total Compras',
      value: stats?.total_compras || 0,
      icon: ShoppingBag,
      color: 'bg-blue-500',
    },
    {
      title: 'Ingresos (Sin Deudas)',
      value: `$${(stats?.total_ventas_monto || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'Ingresos Totales',
      value: `$${(stats?.total_ventas_con_deudas_monto || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-green-600',
    },
    {
      title: 'Gastos Totales',
      value: `$${(stats?.total_compras_monto || 0).toLocaleString()}`,
      icon: ShoppingBag,
      color: 'bg-red-500',
    },
    {
      title: 'Deudas Pendientes',
      value: stats?.total_deudas || 0,
      icon: CreditCard,
      color: 'bg-yellow-500',
    },
    {
      title: 'Monto Deudas',
      value: `$${(stats?.total_deudas_monto || 0).toLocaleString()}`,
      icon: CreditCard,
      color: 'bg-yellow-600',
    },
    {
      title: 'Bolsas Abiertas',
      value: bolsasAbiertas.length,
      icon: AlertTriangle,
      color: 'bg-orange-500',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard - AliMar</h1>
        <p className="text-gray-600">Resumen de tu negocio de mascotas</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bajoStock.map((producto) => (
              <div key={producto.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{producto.nombre}</h3>
                  <p className="text-sm text-gray-500">Stock: {producto.stock}</p>
                </div>
                <span className="text-red-600 font-bold">{producto.stock}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bolsas Abiertas */}
      {bolsasAbiertas.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                Bolsas Abiertas ({bolsasAbiertas.length})
              </h2>
            </div>
            <Link
              to="/bolsas-abiertas"
              className="text-orange-600 hover:text-orange-700 text-sm font-medium"
            >
              Ver todas →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bolsasAbiertas.slice(0, 6).map((bolsa) => (
              <div key={bolsa.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{bolsa.producto_nombre}</h3>
                  <p className="text-sm text-gray-500">
                    Abierta: {new Date(bolsa.fecha_apertura!).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-orange-600 font-bold">
                  {new Date(bolsa.fecha_apertura!).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard 