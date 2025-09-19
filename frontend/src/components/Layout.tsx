import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
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
  Menu,
  X,
  LogOut,
  User
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()

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
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                onClick={() => setSidebarOpen(false)}
            />
        )}

        {/* Sidebar */}
        <aside
            className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          <div
              className="flex items-center justify-between h-16 px-4"
              style={{ backgroundColor: '#F78F1E' }}
          >
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-white" />
              <h1 className="ml-2 text-xl font-bold text-white">Sistema de AliMar</h1>
            </div>
            {/* Close button for mobile */}
            <button
                className="md:hidden text-white focus:outline-none"
                onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="mt-4 flex-1 overflow-auto px-4 space-y-2">
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
                      onClick={() => setSidebarOpen(false)} // cerrar sidebar en móvil al click
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
              )
            })}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center mb-3">
              <User className="h-5 w-5 text-gray-500 mr-2" />
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user?.nombre}</p>
                <p className="text-gray-500">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors duration-200"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Topbar for mobile */}
          <header className="flex items-center justify-between h-16 bg-white shadow-md md:hidden px-4">
            <button
                className="text-gray-700 focus:outline-none"
                onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-bold text-gray-800">Sistema de AliMar</h1>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-[1920px] w-full mx-auto overflow-x-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
  )
}

export default Layout
