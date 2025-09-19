import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import RoleProtectedRoute from './components/RoleProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
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
import Usuarios from './pages/Usuarios'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<Login />} />
            
            {/* Rutas protegidas */}
            {/* Solo ADMIN */}
            <Route path="/" element={
              <RoleProtectedRoute allowedRoles={['ADMIN']}>
                <Layout>
                  <Dashboard />
                </Layout>
              </RoleProtectedRoute>
            } />
            
            {/* Redirección para empleados */}
            <Route path="/empleado" element={
              <RoleProtectedRoute allowedRoles={['EMPLEADO']}>
                <Layout>
                  <Productos />
                </Layout>
              </RoleProtectedRoute>
            } />
            <Route path="/categorias" element={
              <RoleProtectedRoute allowedRoles={['ADMIN']}>
                <Layout>
                  <Categorias />
                </Layout>
              </RoleProtectedRoute>
            } />
            <Route path="/clientes" element={
              <RoleProtectedRoute allowedRoles={['ADMIN']}>
                <Layout>
                  <Clientes />
                </Layout>
              </RoleProtectedRoute>
            } />
            <Route path="/proveedores" element={
              <RoleProtectedRoute allowedRoles={['ADMIN']}>
                <Layout>
                  <Proveedores />
                </Layout>
              </RoleProtectedRoute>
            } />
            <Route path="/compras" element={
              <RoleProtectedRoute allowedRoles={['ADMIN']}>
                <Layout>
                  <Compras />
                </Layout>
              </RoleProtectedRoute>
            } />
            <Route path="/nueva-compra" element={
              <RoleProtectedRoute allowedRoles={['ADMIN']}>
                <Layout>
                  <NuevaCompra />
                </Layout>
              </RoleProtectedRoute>
            } />
            <Route path="/reportes" element={
              <RoleProtectedRoute allowedRoles={['ADMIN']}>
                <Layout>
                  <Reportes />
                </Layout>
              </RoleProtectedRoute>
            } />
            <Route path="/usuarios" element={
              <RoleProtectedRoute allowedRoles={['ADMIN']}>
                <Layout>
                  <Usuarios />
                </Layout>
              </RoleProtectedRoute>
            } />
            
            {/* ADMIN y EMPLEADO */}
            <Route path="/productos" element={
              <RoleProtectedRoute allowedRoles={['ADMIN', 'EMPLEADO']}>
                <Layout>
                  <Productos />
                </Layout>
              </RoleProtectedRoute>
            } />
            <Route path="/ventas" element={
              <RoleProtectedRoute allowedRoles={['ADMIN', 'EMPLEADO']}>
                <Layout>
                  <Ventas />
                </Layout>
              </RoleProtectedRoute>
            } />
            <Route path="/nueva-venta" element={
              <RoleProtectedRoute allowedRoles={['ADMIN', 'EMPLEADO']}>
                <Layout>
                  <NuevaVenta />
                </Layout>
              </RoleProtectedRoute>
            } />
            <Route path="/deudas" element={
              <RoleProtectedRoute allowedRoles={['ADMIN', 'EMPLEADO']}>
                <Layout>
                  <Deudas />
                </Layout>
              </RoleProtectedRoute>
            } />
            <Route path="/bolsas-abiertas" element={
              <RoleProtectedRoute allowedRoles={['ADMIN', 'EMPLEADO']}>
                <Layout>
                  <BolsasAbiertas />
                </Layout>
              </RoleProtectedRoute>
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