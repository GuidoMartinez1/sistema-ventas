import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Package, 
  Users, 
  ShoppingCart, 
  Plus,
  TrendingUp,
  Tag,
  DollarSign,
  Building,
  Truck,
  BarChart3,
  AlertTriangle
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Productos', href: '/productos', icon: Package },
    { name: 'Categorías', href: '/categorias', icon: Tag },
    { name: 'Clientes', href: '/clientes', icon: Users },
    { name: 'Proveedores', href: '/proveedores', icon: Building },
    { name: 'Ventas', href: '/ventas', icon: ShoppingCart },
    { name: 'Nueva Venta', href: '/nueva-venta', icon: Plus },
    { name: 'Compras', href: '/compras', icon: Truck },
    { name: 'Nueva Compra', href: '/nueva-compra', icon: Plus },
    { name: 'Deudas', href: '/deudas', icon: DollarSign },
    { name: 'Reportes', href: '/reportes', icon: BarChart3 },
    { name: 'Bolsas Abiertas', href: '/bolsas-abiertas', icon: AlertTriangle },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="flex items-center justify-center h-16" style={{ backgroundColor: '#F78F1E' }}>
          <TrendingUp className="h-8 w-8 text-white" />
          <h1 className="ml-2 text-xl font-bold text-white">Sistema de AliMar</h1>
        </div>
        
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout 