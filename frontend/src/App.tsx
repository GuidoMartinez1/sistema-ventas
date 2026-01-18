import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
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
import Gastos from './pages/Gastos'
import StockDeposito from './pages/StockDeposito'
import ActualizacionesPendientes from './pages/ActualizacionesPendientes'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/productos" element={<Productos />} />
            <Route path="/categorias" element={<Categorias />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/ventas" element={<Ventas />} />
            <Route path="/nueva-venta" element={<NuevaVenta />} />
            <Route path="/deudas" element={<Deudas />} />
            <Route path="/proveedores" element={<Proveedores />} />
            <Route path="/compras" element={<Compras />} />
            <Route path="/nueva-compra" element={<NuevaCompra />} />
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/bolsas-abiertas" element={<BolsasAbiertas />} />
            <Route path="/gastos" element={<Gastos />} />
            <Route path="/stock-deposito" element={<StockDeposito />} />
            <Route path="/actualizaciones" element={<ActualizacionesPendientes />} />
          </Routes>
        </Layout>
        <Toaster position="top-right" />
      </div>
    </Router>
  )
}

export default App 