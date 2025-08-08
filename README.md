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

#### Opción 1: PostgreSQL (Recomendado para producción)
```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd sistema-ventas

# Ejecutar script de instalación con PostgreSQL
chmod +x install-postgres.sh
./install-postgres.sh
```

#### Opción 2: SQLite (Desarrollo local)
```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd sistema-ventas

# Ejecutar script de instalación
chmod +x install.sh
./install.sh
```

#### Opción 3: Instalación manual
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

#### Opción 1: PostgreSQL (Recomendado)
```bash
chmod +x start-postgres.sh
./start-postgres.sh
```

#### Opción 2: SQLite (Desarrollo)
```bash
chmod +x start.sh
./start.sh
```

#### Opción 3: Manual
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
├── install.sh              # Script de instalación SQLite (macOS/Linux)
├── install-postgres.sh     # Script de instalación PostgreSQL (macOS/Linux)
├── start.sh                # Script de inicio SQLite (macOS/Linux)
├── start-postgres.sh       # Script de inicio PostgreSQL (macOS/Linux)
└── README.md              # Este archivo
```

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos escalable
- **SQLite** - Base de datos local (versión anterior)
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

#### `ventas`
- `id` (SERIAL PRIMARY KEY)
- `cliente_id` (INTEGER REFERENCES clientes(id))
- `total` (DECIMAL(10,2))
- `fecha` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `estado` (VARCHAR(50) DEFAULT 'completada')
- `metodo_pago` (VARCHAR(50) DEFAULT 'efectivo')

#### `detalles_venta`
- `id` (SERIAL PRIMARY KEY)
- `venta_id` (INTEGER REFERENCES ventas(id) ON DELETE CASCADE)
- `producto_id` (INTEGER REFERENCES productos(id))
- `cantidad` (INTEGER)
- `precio_unitario` (DECIMAL(10,2))
- `subtotal` (DECIMAL(10,2))

#### `bolsas_abiertas`
- `id` (SERIAL PRIMARY KEY)
- `producto_id` (INTEGER REFERENCES productos(id) ON DELETE CASCADE)
- `fecha_apertura` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `estado` (VARCHAR(50) DEFAULT 'abierta')

### SQLite (Desarrollo local)

También disponible para desarrollo local con la misma estructura de tablas.

## 🔧 Comandos Útiles

### PostgreSQL (Recomendado)
```bash
# Ejecutar el sistema completo con PostgreSQL
./start-postgres.sh

# Solo backend con PostgreSQL
cd backend && npm run start:postgres

# Solo frontend
cd frontend && npm run dev

# Inicializar base de datos PostgreSQL
cd backend && npm run init:postgres

# Conectar a PostgreSQL
psql sistema_ventas
```

### SQLite (Desarrollo)
```bash
# Ejecutar el sistema completo con SQLite
./start.sh

# Solo backend con SQLite
cd backend && npm start

# Solo frontend
cd frontend && npm run dev

# Poblar base de datos SQLite
cd backend && npm run seed

# Limpiar base de datos SQLite
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
- ✅ **PostgreSQL** para escalabilidad y producción
- ✅ **Pool de conexiones** optimizado
- ✅ **Índices de base de datos** para mejor performance
- ✅ **Transacciones ACID** completas

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
- SQLite por la base de datos ligera
- Express.js por el framework web

---

**¡Disfruta usando tu Sistema de AliMar! 🐾**
