# 🐾 Sistema de AliMar

Un sistema completo de gestión de ventas para tu negocio de mascotas con interfaz moderna y funcionalidades avanzadas.

## ✨ Características

### 📦 Gestión de Productos
- **Crear productos** con nombre, descripción, precio, stock y código
- **Categorizar productos** para mejor organización
- **Editar y eliminar** productos existentes
- **Control de stock** con alertas de bajo inventario
- **Búsqueda y filtrado** de productos
- **Sistema de bolsas abiertas** para productos abiertos

### 📂 Gestión de Categorías
- **Crear categorías** para organizar productos
- **Editar y eliminar** categorías
- **Vista en grid** con diseño moderno
- **Descripción opcional** para cada categoría

### 👥 Gestión de Clientes
- **Registro de clientes** con información completa
- **Historial de compras** por cliente
- **Datos de contacto** (email, teléfono, dirección)

### 💰 Gestión de Ventas
- **Crear ventas** con múltiples productos
- **Ventas sin productos** (solo importe directo)
- **Método de pago** (efectivo, Mercado Pago, tarjeta)
- **Cálculo automático** de totales y subtotales
- **Actualización automática** del stock
- **Historial completo** de ventas
- **Detalles de venta** con productos y cantidades
- **Sistema de deudas** con seguimiento

### 📊 Dashboard
- **Estadísticas en tiempo real**
- **Productos con bajo stock**
- **Ventas recientes**
- **Bolsas abiertas**
- **Deudas pendientes**
- **Gráficos y métricas**

### 📈 Reportes
- **Reportes de ventas** con filtros por fecha y método de pago
- **Reportes de compras** con detalles completos
- **Resumen general** del negocio
- **Análisis de ganancias**

## 🚀 Instalación

### Requisitos
- Node.js (versión 14 o superior)
- npm o yarn

### Pasos de instalación

#### Opción 1: Instalación automática (macOS/Linux)
```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd sistema-ventas

# Ejecutar script de instalación
chmod +x install.sh
./install.sh
```

#### Opción 2: Instalación manual
1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd sistema-ventas
```

2. **Instalar dependencias**
```bash
# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install
```

3. **Configurar la base de datos**
```bash
# Desde la carpeta backend
cd backend
node seed.js
```

### Ejecutar el sistema

#### Opción 1: Script automático (macOS/Linux)
```bash
chmod +x start.sh
./start.sh
```

#### Opción 2: Manual
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Acceder al sistema
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 📖 Guía de Uso

### 🛍️ Crear Productos

1. **Navegar a Productos**
   - Ve a la sección "Productos" en el menú lateral

2. **Crear nuevo producto**
   - Haz clic en "Nuevo Producto"
   - Completa el formulario:
     - **Nombre** (obligatorio): Nombre del producto
     - **Descripción** (opcional): Descripción detallada
     - **Precio** (obligatorio): Precio de venta
     - **Stock** (opcional): Cantidad disponible
     - **Categoría** (opcional): Selecciona una categoría
     - **Código** (opcional): Código único del producto

3. **Guardar producto**
   - Haz clic en "Crear"
   - El producto aparecerá en la lista

### 📂 Crear Categorías

1. **Navegar a Categorías**
   - Ve a la sección "Categorías" en el menú lateral

2. **Crear nueva categoría**
   - Haz clic en "Nueva Categoría"
   - Completa el formulario:
     - **Nombre** (obligatorio): Nombre de la categoría
     - **Descripción** (opcional): Descripción de la categoría

3. **Guardar categoría**
   - Haz clic en "Crear"
   - La categoría aparecerá en el grid

### 👥 Crear Clientes

1. **Navegar a Clientes**
   - Ve a la sección "Clientes" en el menú lateral

2. **Crear nuevo cliente**
   - Haz clic en "Nuevo Cliente"
   - Completa el formulario:
     - **Nombre** (obligatorio): Nombre completo
     - **Email** (opcional): Correo electrónico
     - **Teléfono** (opcional): Número de teléfono
     - **Dirección** (opcional): Dirección completa

3. **Guardar cliente**
   - Haz clic en "Crear"
   - El cliente aparecerá en la lista

### 💰 Crear Ventas

1. **Navegar a Nueva Venta**
   - Ve a la sección "Nueva Venta" en el menú lateral

2. **Seleccionar cliente** (opcional)
   - Puedes seleccionar un cliente existente o crear uno nuevo

3. **Agregar productos**
   - Busca productos por nombre o código
   - Selecciona la cantidad
   - El sistema calcula automáticamente el subtotal
   - **Opcional**: Agregar "Sin producto" con importe directo

4. **Seleccionar método de pago**
   - Efectivo
   - Mercado Pago
   - Tarjeta

5. **Completar la venta**
   - Revisa el total
   - Haz clic en "Finalizar Venta"
   - El stock se actualiza automáticamente

### 🎒 Gestión de Bolsas Abiertas

1. **Navegar a Bolsas Abiertas**
   - Ve a la sección "Bolsas Abiertas" en el menú lateral

2. **Ver bolsas abiertas**
   - Se muestran todas las bolsas abiertas con fecha de apertura
   - Información del producto y stock actual

3. **Cerrar bolsa**
   - Haz clic en "Cerrar" para marcar como utilizada
   - La bolsa desaparecerá de la lista

### 📊 Reportes

1. **Navegar a Reportes**
   - Ve a la sección "Reportes" en el menú lateral

2. **Seleccionar tipo de reporte**
   - **Ventas**: Con filtros por fecha y método de pago
   - **Compras**: Con detalles completos de productos
   - **Resumen**: Estadísticas generales del negocio

## 🗂️ Estructura del Proyecto

```
sistema-ventas/
├── backend/                 # Servidor Node.js + Express
│   ├── server.js           # Servidor principal
│   ├── seed.js             # Script para poblar BD
│   ├── database.sqlite     # Base de datos SQLite
│   └── package.json        # Dependencias del backend
├── frontend/               # Aplicación React + TypeScript
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/          # Páginas principales
│   │   ├── services/       # Servicios de API
│   │   └── App.tsx         # Componente principal
│   └── package.json        # Dependencias del frontend
├── install.sh              # Script de instalación (macOS/Linux)
├── start.sh                # Script de inicio (macOS/Linux)
└── README.md              # Este archivo
```

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **SQLite** - Base de datos
- **CORS** - Middleware para CORS

### Frontend
- **React** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool
- **Tailwind CSS** - Framework de CSS
- **React Router** - Enrutamiento
- **Axios** - Cliente HTTP
- **React Hot Toast** - Notificaciones
- **Lucide React** - Iconos

## 📊 Base de Datos

### Tablas Principales

#### `categorias`
- `id` (PRIMARY KEY)
- `nombre` (TEXT, UNIQUE)
- `descripcion` (TEXT)
- `created_at` (DATETIME)

#### `productos`
- `id` (PRIMARY KEY)
- `nombre` (TEXT)
- `descripcion` (TEXT)
- `precio` (REAL)
- `stock` (INTEGER)
- `categoria_id` (FOREIGN KEY)
- `codigo` (TEXT, UNIQUE)
- `created_at` (DATETIME)
- `updated_at` (DATETIME)

#### `clientes`
- `id` (PRIMARY KEY)
- `nombre` (TEXT)
- `email` (TEXT)
- `telefono` (TEXT)
- `direccion` (TEXT)
- `created_at` (DATETIME)

#### `ventas`
- `id` (PRIMARY KEY)
- `cliente_id` (FOREIGN KEY)
- `total` (REAL)
- `fecha` (DATETIME)
- `estado` (TEXT)
- `metodo_pago` (TEXT, DEFAULT 'efectivo')

#### `detalles_venta`
- `id` (PRIMARY KEY)
- `venta_id` (FOREIGN KEY)
- `producto_id` (FOREIGN KEY)
- `cantidad` (INTEGER)
- `precio_unitario` (REAL)
- `subtotal` (REAL)

#### `bolsas_abiertas`
- `id` (PRIMARY KEY)
- `producto_id` (FOREIGN KEY)
- `fecha_apertura` (DATETIME)
- `estado` (TEXT, DEFAULT 'abierta')

## 🔧 Comandos Útiles

```bash
# Ejecutar el sistema completo (macOS/Linux)
./start.sh

# Solo backend
cd backend && npm start

# Solo frontend
cd frontend && npm run dev

# Poblar base de datos
cd backend && node seed.js

# Limpiar base de datos
rm backend/database.sqlite
```

## 🎯 Funcionalidades Implementadas

- ✅ **Sistema de bolsas abiertas** completo
- ✅ **Reportes avanzados** con filtros
- ✅ **Ventas sin productos** (solo importe)
- ✅ **Método de pago** en ventas
- ✅ **Detalles de compras** mejorados
- ✅ **Dashboard actualizado** con métricas precisas
- ✅ **Soporte para macOS** con scripts
- ✅ **Sistema de deudas** con seguimiento
- ✅ **Gestión de stock** mejorada

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

**Guido Martinez** - guimartinez@frba.utn.edu.ar

Si tienes alguna pregunta o problema:
- Abre un issue en GitHub
- Contacta al equipo de desarrollo
- Revisa la documentación de la API

🙏 Agradecimientos

- React y la comunidad de desarrolladores
- Tailwind CSS por el framework de estilos
- SQLite por la base de datos ligera
- Express.js por el framework web

---

**¡Disfruta usando tu Sistema de AliMar! 🐾**
