import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Productos from './pages/Productos'
import Categorias from './pages/Categorias'
import Clientes from './pages/Clientes'
import Ventas from './pages/Ventas'
import NuevaVenta from './pages/NuevaVenta'
import Deudas from './pages/Deudas'
import Proveedores from './pages/Proveedores'
import Compras from './pages/Compras'
import NuevaCompra from './pages/NuevaCompra'
import Reportes from './pages/Reportes'
import BolsasAbiertas from './pages/BolsasAbiertas'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Rutas protegidas */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/productos" element={
              <ProtectedRoute>
                <Layout>
                  <Productos />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/categorias" element={
              <ProtectedRoute>
                <Layout>
                  <Categorias />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/clientes" element={
              <ProtectedRoute>
                <Layout>
                  <Clientes />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/ventas" element={
              <ProtectedRoute>
                <Layout>
                  <Ventas />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/nueva-venta" element={
              <ProtectedRoute>
                <Layout>
                  <NuevaVenta />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/deudas" element={
              <ProtectedRoute>
                <Layout>
                  <Deudas />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/proveedores" element={
              <ProtectedRoute>
                <Layout>
                  <Proveedores />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/compras" element={
              <ProtectedRoute>
                <Layout>
                  <Compras />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/nueva-compra" element={
              <ProtectedRoute>
                <Layout>
                  <NuevaCompra />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/reportes" element={
              <ProtectedRoute>
                <Layout>
                  <Reportes />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/bolsas-abiertas" element={
              <ProtectedRoute>
                <Layout>
                  <BolsasAbiertas />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Redirección por defecto */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App 