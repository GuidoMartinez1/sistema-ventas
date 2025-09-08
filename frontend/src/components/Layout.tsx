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
  AlertTriangle,
  Menu
} from 'lucide-react'
import { useState } from 'react'

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
        {/* Sidebar - responsive */}
        <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform 
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        transition-transform duration-200 ease-in-out
        md:translate-x-0 md:static md:inset-0
      `}>
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
                        onClick={() => setSidebarOpen(false)} // Cierra menú en mobile
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

        {/* Overlay para mobile */}
        {sidebarOpen && (
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                onClick={() => setSidebarOpen(false)}
            />
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Navbar superior con botón menú */}
          <header className="flex items-center justify-between bg-white shadow px-4 h-16 md:hidden">
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold">Sistema de AliMar</h1>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
          </main>
        </div>
      </div>
  )
}

export default Layout
