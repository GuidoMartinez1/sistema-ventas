# 🐾 Sistema de AliMar

Un sistema completo de gestión de ventas para tu negocio de mascotas con interfaz moderna y funcionalidades avanzadas.

## ✨ Características

### 📦 Gestión de Productos
- **Crear productos** con nombre, descripción, precio, stock y código
- **Precio de costo y cálculo de ganancia** automático
- **Categorizar productos** para mejor organización
- **Editar y eliminar** productos existentes
- **Control de stock** con alertas de bajo inventario
- **Búsqueda y filtrado** de productos
- **Sistema de bolsas abiertas** para productos abiertos
- **Historial de costos** para seguimiento de cambios

### 📂 Gestión de Categorías
- **Crear categorías** para organizar productos
- **Editar y eliminar** categorías
- **Vista en grid** con diseño moderno
- **Descripción opcional** para cada categoría

### 👥 Gestión de Clientes
- **Registro de clientes** con información completa
- **Historial de compras** por cliente
- **Datos de contacto** (email, teléfono, dirección)

### 🏭 Gestión de Proveedores
- **Registro de proveedores** con información completa
- **Base de datos** de proveedores para compras
- **Datos de contacto** (email, teléfono, dirección)
- **Edición y eliminación** de proveedores

### 💰 Gestión de Ventas
- **Crear ventas** con múltiples productos
- **Ventas sin productos** (solo importe directo)
- **Método de pago** (efectivo, Mercado Pago, tarjeta)
- **Cálculo automático** de totales y subtotales
- **Actualización automática** del stock
- **Historial completo** de ventas
- **Detalles de venta** con productos y cantidades

### 💳 Sistema de Deudas
- **Seguimiento de deudas** por cliente
- **Pagos totales y parciales** con historial
- **Actualización automática** del estado
- **Visualización de pagos** asociados

### 🛒 Gestión de Compras
- **Registro de compras** a proveedores
- **Múltiples productos** por compra
- **Actualización automática** de stock y precios de costo
- **Control de ganancias** automático
- **Historial completo** de compras
- **Sistema de lotes** para gestión de stock en depósito
- **FIFO (First In First Out)** para traslados

### 📦 Stock en Depósito
- **Control separado** entre stock en depósito y tienda
- **Gestión de lotes** con fechas de ingreso
- **Traslados de mercadería** de depósito a tienda
- **Traslados individuales y masivos**
- **Visualización de stock total** por producto
- **Sistema FIFO** para garantizar rotación

### 🎒 Gestión de Bolsas Abiertas
- **Registro de productos abiertos** con fecha
- **Control de stock** de bolsas abiertas
- **Marcado como utilizadas** al cerrar bolsa

### 💸 Gestión de Gastos
- **Registro de gastos** operativos del negocio
- **Soporte multi-moneda** (ARS y USD)
- **Conversión automática** a pesos argentinos
- **Cotización diaria** para gastos en USD
- **Totalizadores** por moneda y total
- **Historial completo** de egresos

### 💱 Cotizaciones
- **Gestión de cotizaciones** diarias USD/ARS
- **Registro histórico** de valores
- **Actualización automática** en gastos USD

### 📋 Futuros Pedidos
- **Lista de productos** a pedir
- **Productos existentes o personalizados**
- **Cantidades** y descripción
- **Gestión de wishlist** de reposición

### 📊 Dashboard
- **Estadísticas en tiempo real**
- **Filtros por fecha** para análisis
- **Productos con bajo stock**
- **Ventas y compras recientes**
- **Bolsas abiertas**
- **Deudas pendientes**
- **Métricas financieras** completas
- **Visualización de ganancias** y pérdidas

### 📈 Reportes
- **Reportes de ventas** con filtros por fecha y método de pago
- **Reportes de compras** con detalles completos
- **Resumen general** del negocio
- **Análisis de ganancias**
- **Exportación de datos**

## 🚀 Instalación

### Requisitos
- Node.js (versión 14 o superior)
- npm o yarn

### Pasos de instalación

#### Opción 1: Instalación automática (Recomendado)
```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd sistema-ventas

# Ejecutar script de instalación con PostgreSQL
chmod +x install-postgres.sh
./install-postgres.sh
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

3. **Configurar la base de datos PostgreSQL**
```bash
# Crear archivo .env en la carpeta backend
cd backend
cp .env.example .env

# Editar .env con tus credenciales de PostgreSQL:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=sistema_ventas
# DB_USER=postgres
# DB_PASSWORD=tu_password
```

4. **Inicializar base de datos**
```bash
# Desde la carpeta backend
cd backend
node initPostgreSQL.js
```

### Ejecutar el sistema

#### Opción 1: Script automático (Recomendado)
```bash
chmod +x start-postgres.sh
./start-postgres.sh
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

### 🏭 Gestión de Proveedores

1. **Navegar a Proveedores**
   - Ve a la sección "Proveedores" en el menú lateral

2. **Crear nuevo proveedor**
   - Haz clic en "Nuevo Proveedor"
   - Completa el formulario con los datos del proveedor

3. **Editar o eliminar**
   - Usa los íconos de editar/eliminar en cada proveedor

### 🛒 Registrar Compras

1. **Navegar a Nueva Compra**
   - Ve a la sección "Nueva Compra" en el menú lateral

2. **Seleccionar proveedor**
   - Elige el proveedor de la compra

3. **Agregar productos**
   - Busca productos existentes o crea nuevos
   - Ingresa cantidad y precio unitario
   - El stock se actualiza automáticamente al depósito

4. **Completar compra**
   - Revisa el total
   - Guarda la compra
   - Los precios de costo y ganancias se calculan automáticamente

### 📦 Stock en Depósito

1. **Navegar a Stock en Depósito**
   - Ve a la sección "Stock Depósito" en el menú lateral

2. **Ver stock disponible**
   - Visualiza productos con stock en depósito
   - Información de stock total, en depósito y en tienda

3. **Trasladar mercadería**
   - Traslado individual por producto
   - Traslado masivo de múltiples productos
   - Sistema FIFO garantiza rotación correcta

### 💳 Gestión de Deudas

1. **Navegar a Deudas**
   - Ve a la sección "Deudas" en el menú lateral

2. **Ver deudas pendientes**
   - Lista de todas las deudas activas
   - Información del cliente y productos

3. **Registrar pagos**
   - Pago total de la deuda
   - Pago parcial con seguimiento
   - Historial completo de pagos

### 💸 Registrar Gastos

1. **Navegar a Gastos**
   - Ve a la sección "Gastos" en el menú lateral

2. **Registrar nuevo gasto**
   - Ingresa concepto, monto y fecha
   - Selecciona moneda (ARS o USD)

3. **Configurar cotización**
   - Si el gasto es en USD, configura la cotización del día
   - El sistema convierte automáticamente a ARS

### 📋 Gestión de Futuros Pedidos

1. **Navegar a Futuros Pedidos**
   - Ve a la sección "Futuros Pedidos" en el menú lateral

2. **Agregar producto a la lista**
   - Selecciona producto existente o ingresa uno nuevo
   - Especifica cantidad si es necesario

3. **Gestionar lista**
   - Edita o elimina pedidos de la lista

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
├── backend/                         # Servidor Node.js + Express
│   ├── serverPostgreSQL.js         # Servidor principal
│   ├── db.js                       # Configuración del pool PostgreSQL
│   ├── initPostgreSQL.js           # Script de inicialización BD
│   ├── config/
│   │   └── database.js             # Configuración de la base de datos
│   ├── routes/                     # Rutas de la API
│   │   ├── bolsasAbiertas.js
│   │   ├── categorias.js
│   │   ├── clientes.js
│   │   ├── compras.js
│   │   ├── cotizaciones.js
│   │   ├── deudas.js
│   │   ├── futurosPedidos.js
│   │   ├── gastos.js
│   │   ├── productos.js
│   │   ├── proveedores.js
│   │   ├── stats.js
│   │   ├── stockDeposito.js
│   │   └── ventas.js
│   ├── package.json                # Dependencias del backend
│   └── .env.example                # Variables de entorno de ejemplo
├── frontend/                       # Aplicación React + TypeScript
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.tsx         # Componente de layout
│   │   ├── pages/                 # Páginas principales
│   │   │   ├── BolsasAbiertas.tsx
│   │   │   ├── Categorias.tsx
│   │   │   ├── Clientes.tsx
│   │   │   ├── Compras.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Deudas.tsx
│   │   │   ├── FuturosPedidos.tsx
│   │   │   ├── Gastos.tsx
│   │   │   ├── NuevaCompra.tsx
│   │   │   ├── NuevaVenta.tsx
│   │   │   ├── Productos.tsx
│   │   │   ├── Proveedores.tsx
│   │   │   ├── Reportes.tsx
│   │   │   ├── StockDeposito.tsx
│   │   │   └── Ventas.tsx
│   │   ├── services/
│   │   │   └── api.ts             # Servicios de API
│   │   ├── types/
│   │   │   └── recharts.d.ts      # Tipos para Recharts
│   │   ├── App.tsx                # Componente principal
│   │   ├── index.css              # Estilos globales
│   │   └── main.tsx               # Punto de entrada
│   ├── package.json               # Dependencias del frontend
│   ├── tailwind.config.js         # Configuración de Tailwind
│   ├── vite.config.ts             # Configuración de Vite
│   └── tsconfig.json              # Configuración de TypeScript
├── install-postgres.sh            # Script de instalación PostgreSQL
├── start-postgres.sh              # Script de inicio PostgreSQL
└── README.md                      # Este archivo
```

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos escalable y robusta
- **pg (node-postgres)** - Cliente PostgreSQL
- **dotenv** - Gestión de variables de entorno
- **CORS** - Middleware para CORS
- **xlsx** - Exportación de datos a Excel

### Frontend
- **React** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool optimizado
- **Tailwind CSS** - Framework de CSS
- **React Router** - Enrutamiento
- **Axios** - Cliente HTTP
- **React Hot Toast** - Notificaciones
- **Lucide React** - Iconos
- **Recharts** - Gráficos y visualizaciones
- **date-fns** - Manipulación de fechas
- **xlsx** - Exportación de datos

## 📊 Base de Datos

### PostgreSQL (Recomendado para producción)

El sistema soporta **PostgreSQL** para mayor escalabilidad, concurrencia y robustez en producción.

#### Características de PostgreSQL:
- **ACID Compliance** - Transacciones completas
- **Concurrencia** - Múltiples usuarios simultáneos
- **Escalabilidad** - Maneja grandes volúmenes de datos
- **Índices optimizados** - Consultas rápidas
- **Pool de conexiones** - Gestión eficiente de recursos

#### Tablas Principales

#### `categorias`
- `id` (SERIAL PRIMARY KEY)
- `nombre` (VARCHAR(255), UNIQUE)
- `descripcion` (TEXT)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

#### `productos`
- `id` (SERIAL PRIMARY KEY)
- `nombre` (VARCHAR(255))
- `descripcion` (TEXT)
- `precio` (DECIMAL(10,2))
- `precio_costo` (DECIMAL(10,2)) - Precio de compra
- `porcentaje_ganancia` (DECIMAL(5,2)) - Margen de ganancia
- `stock` (INTEGER)
- `categoria_id` (INTEGER REFERENCES categorias(id))
- `codigo` (VARCHAR(100), UNIQUE)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

#### `clientes`
- `id` (SERIAL PRIMARY KEY)
- `nombre` (VARCHAR(255))
- `email` (VARCHAR(255))
- `telefono` (VARCHAR(50))
- `direccion` (TEXT)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

#### `proveedores`
- `id` (SERIAL PRIMARY KEY)
- `nombre` (VARCHAR(255))
- `email` (VARCHAR(255))
- `telefono` (VARCHAR(50))
- `direccion` (TEXT)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

#### `ventas`
- `id` (SERIAL PRIMARY KEY)
- `cliente_id` (INTEGER REFERENCES clientes(id))
- `total` (DECIMAL(10,2))
- `fecha` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `estado` (VARCHAR(50) DEFAULT 'completada')
- `metodo_pago` (VARCHAR(50) DEFAULT 'efectivo')
- `venta_origen_id` (INTEGER REFERENCES ventas(id)) - Para pagos parciales

#### `detalles_venta`
- `id` (SERIAL PRIMARY KEY)
- `venta_id` (INTEGER REFERENCES ventas(id) ON DELETE CASCADE)
- `producto_id` (INTEGER REFERENCES productos(id))
- `cantidad` (INTEGER)
- `precio_unitario` (DECIMAL(10,2))
- `subtotal` (DECIMAL(10,2))

#### `compras`
- `id` (SERIAL PRIMARY KEY)
- `proveedor_id` (INTEGER REFERENCES proveedores(id))
- `total` (DECIMAL(10,2))
- `fecha` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `estado` (VARCHAR(50) DEFAULT 'completada')

#### `detalles_compra`
- `id` (SERIAL PRIMARY KEY)
- `compra_id` (INTEGER REFERENCES compras(id) ON DELETE CASCADE)
- `producto_id` (INTEGER REFERENCES productos(id))
- `cantidad` (INTEGER)
- `precio_unitario` (DECIMAL(10,2))
- `subtotal` (DECIMAL(10,2))

#### `bolsas_abiertas`
- `id` (SERIAL PRIMARY KEY)
- `producto_id` (INTEGER REFERENCES productos(id) ON DELETE CASCADE)
- `fecha_apertura` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `estado` (VARCHAR(50) DEFAULT 'abierta')

#### `stock_deposito_detalle`
- `id` (SERIAL PRIMARY KEY)
- `producto_id` (INTEGER REFERENCES productos(id))
- `compra_id` (INTEGER REFERENCES compras(id))
- `cantidad_actual` (INTEGER) - Cantidad actual del lote
- `fecha_ingreso` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

#### `historial_costos`
- `id` (SERIAL PRIMARY KEY)
- `producto_id` (INTEGER REFERENCES productos(id))
- `compra_id` (INTEGER REFERENCES compras(id))
- `precio_costo_anterior` (DECIMAL(10,2))
- `precio_costo_nuevo` (DECIMAL(10,2))
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

#### `gastos`
- `id` (SERIAL PRIMARY KEY)
- `concepto` (VARCHAR(255))
- `monto` (DECIMAL(10,2))
- `monto_ars` (DECIMAL(10,2)) - Monto normalizado en pesos
- `moneda` (VARCHAR(10) DEFAULT 'ARS')
- `fecha` (DATE)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

#### `cotizaciones`
- `id` (SERIAL PRIMARY KEY)
- `fecha` (DATE UNIQUE)
- `valor` (DECIMAL(10,2)) - Valor del dólar en pesos

#### `futuros_pedidos`
- `id` (SERIAL PRIMARY KEY)
- `producto` (TEXT)
- `producto_id` (INTEGER REFERENCES productos(id))
- `cantidad` (VARCHAR(50))
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

## 🔧 Comandos Útiles

### Comandos principales
```bash
# Ejecutar el sistema completo
./start-postgres.sh

# Solo backend
cd backend && npm start

# Solo frontend
cd frontend && npm run dev

# Inicializar base de datos
cd backend && node initPostgreSQL.js

# Conectar a PostgreSQL (consola)
psql -h localhost -U postgres -d sistema_ventas

# Modo desarrollo con nodemon
cd backend && npm run dev
```

## 🎯 Funcionalidades Implementadas

### 🛠️ Características Principales
- ✅ **Sistema completo de ventas** con múltiples métodos de pago
- ✅ **Gestión de compras** con control de costos automático
- ✅ **Sistema de deudas** con pagos totales y parciales
- ✅ **Proveedores** para gestión de compras
- ✅ **Stock en depósito** separado de tienda con sistema FIFO
- ✅ **Gestión de gastos** multi-moneda (ARS/USD)
- ✅ **Cotizaciones diarias** para conversión automática
- ✅ **Futuros pedidos** para lista de reposición
- ✅ **Bolsas abiertas** para productos abiertos
- ✅ **Dashboard** con estadísticas en tiempo real y filtros
- ✅ **Reportes avanzados** con exportación de datos

### 🗄️ Base de Datos
- ✅ **PostgreSQL** para escalabilidad y producción
- ✅ **Pool de conexiones** optimizado
- ✅ **Índices de base de datos** para mejor performance
- ✅ **Transacciones ACID** completas
- ✅ **Historial de costos** para auditoría

### 🎨 Interfaz y UX
- ✅ **Diseño responsive** para móviles y tablets
- ✅ **Interfaz moderna** con Tailwind CSS
- ✅ **Notificaciones** en tiempo real
- ✅ **Optimizado** para rendimiento

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🚀 Deploy en Producción

### Servicios Recomendados (Gratuitos)

#### 1. **Supabase** (Recomendado)
```bash
# 1. Crear cuenta en supabase.com
# 2. Crear nuevo proyecto
# 3. Obtener credenciales de conexión
# 4. Configurar variables de entorno:

DB_HOST=db.xxxxxxxxxxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=tu_password_supabase
```

#### 2. **Railway**
```bash
# 1. Conectar repositorio de GitHub
# 2. Configurar variables de entorno
# 3. Deploy automático
```

#### 3. **Render**
```bash
# 1. Conectar repositorio de GitHub
# 2. Configurar servicio web y base de datos
# 3. Deploy automático
```

#### 4. **Neon**
```bash
# 1. Crear cuenta en neon.tech
# 2. Crear base de datos PostgreSQL
# 3. Obtener string de conexión
# 4. Configurar variables de entorno
```

### Variables de Entorno para Producción
```bash
# Base de datos
DB_HOST=tu_host_postgresql
DB_PORT=5432
DB_NAME=tu_nombre_db
DB_USER=tu_usuario
DB_PASSWORD=tu_password

# Servidor
PORT=3001
NODE_ENV=production
```

## 📞 Soporte

**Guido Martinez** - guimartinez@frba.utn.edu.ar

Si tienes alguna pregunta o problema:
- Abre un issue en GitHub
- Contacta al equipo de desarrollo
- Revisa la documentación de la API

🙏 Agradecimientos

- React y la comunidad de desarrolladores
- Tailwind CSS por el framework de estilos
- PostgreSQL por la base de datos robusta
- Express.js por el framework web
- La comunidad de código abierto

---

**¡Disfruta usando tu Sistema de AliMar! 🐾**
