// frontend/src/pages/NuevaCompra.tsx
import { useEffect, useState } from 'react'
import { Plus, Minus, Trash2, ShoppingCart } from 'lucide-react'
import { productosAPI, proveedoresAPI, comprasAPI, categoriasAPI } from '../services/api'
import { Producto, Proveedor, DetalleCompra, Categoria } from '../services/api'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const NuevaCompra = () => {
  const navigate = useNavigate()
  const [productos, setProductos] = useState<Producto[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [selectedProveedor, setSelectedProveedor] = useState<number | null>(null)
  const [cartItems, setCartItems] = useState<DetalleCompra[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState('')
  const [showProductModal, setShowProductModal] = useState(false)
  const [newProduct, setNewProduct] = useState({
    nombre: '',
    descripcion: '',
    precio: 0,
    precio_costo: 0,
    stock: 0,
    categoria_id: '',
    codigo: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [productosResponse, proveedoresResponse, categoriasResponse] = await Promise.all([
        productosAPI.getAll(),
        proveedoresAPI.getAll(),
        categoriasAPI.getAll()
      ])
      setProductos(Array.isArray(productosResponse.data) ? productosResponse.data : [])
      setProveedores(Array.isArray(proveedoresResponse.data) ? proveedoresResponse.data : [])
      setCategorias(Array.isArray(categoriasResponse.data) ? categoriasResponse.data : [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const productData = {
        ...newProduct,
        categoria_id: newProduct.categoria_id ? parseInt(newProduct.categoria_id) : undefined
      }
      await productosAPI.create(productData)
      toast.success('Producto creado exitosamente')
      setShowProductModal(false)
      setNewProduct({
        nombre: '',
        descripcion: '',
        precio: 0,
        precio_costo: 0,
        stock: 0,
        categoria_id: '',
        codigo: ''
      })
      fetchData()
    } catch {
      toast.error('Error al crear producto')
    }
  }

  const addToCart = (producto: Producto) => {
    try {
      if (!producto || !producto.id) {
        toast.error('Producto inválido')
        return
      }
      const existingItem = cartItems.find(item => item.producto_id === producto.id)
      if (existingItem) {
        const newQuantity = existingItem.cantidad + 1
        const newSubtotal = newQuantity * Number(existingItem.precio_unitario ?? 0)
        setCartItems(prev =>
          prev.map(item =>
            item.producto_id === producto.id
              ? { ...item, cantidad: newQuantity, subtotal: newSubtotal, producto_nombre: producto.nombre || 'Sin nombre' }
              : item
          )
        )
      } else {
        const newItem: DetalleCompra = {
          producto_id: producto.id,
          cantidad: 1,
          precio_unitario: Number(producto.precio_costo ?? 0),
          subtotal: Number(producto.precio_costo ?? 0),
          producto_nombre: producto.nombre || 'Sin nombre'
        }
        setCartItems(prev => [...prev, newItem])
      }
    } catch {
      toast.error('Error al agregar producto al carrito')
    }
  }

  const updateQuantity = (productoId: number, newQuantity: number) => {
    const producto = productos.find(p => p.id === productoId)
    if (!producto) return
    if (newQuantity <= 0) {
      removeFromCart(productoId)
      return
    }
    setCartItems(prev =>
      prev.map(item =>
        item.producto_id === productoId
          ? { ...item, cantidad: newQuantity, subtotal: newQuantity * Number(item.precio_unitario ?? 0), producto_nombre: producto.nombre }
          : item
      )
    )
  }

  const updatePrecioUnitario = (productoId: number, newPrecio: number) => {
    setCartItems(prev =>
      prev.map(item =>
        item.producto_id === productoId
          ? { ...item, precio_unitario: newPrecio, subtotal: item.cantidad * Number(newPrecio ?? 0) }
          : item
      )
    )
  }

  const removeFromCart = (productoId: number) => {
    setCartItems(prev => prev.filter(item => item.producto_id !== productoId))
  }

  const getTotal = () => {
    return cartItems.reduce((total, item) => total + Number(item.subtotal ?? 0), 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProveedor) {
      toast.error('Debe seleccionar un proveedor')
      return
    }
    if (cartItems.length === 0) {
      toast.error('Debe agregar productos al carrito')
      return
    }
    try {
      await comprasAPI.create({
        proveedor_id: selectedProveedor,
        productos: cartItems,
        total: getTotal()
      })

      // 🔄 Recargar productos sin recargar toda la página
      const updatedProductos = await productosAPI.getAll()
      setProductos(updatedProductos.data)

      toast.success('Compra registrada exitosamente')
      navigate('/compras')
    } catch {
      toast.error('Error al procesar la compra')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  }

  return (
    // ... resto del componente sin cambios
  )
}

export default NuevaCompra
