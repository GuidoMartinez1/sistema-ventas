# 🛒 Sistema de Ventas

Un sistema completo de gestión de ventas desarrollado con **React + TypeScript** en el frontend y **Node.js + Express + SQLite** en el backend.

## ✨ Características

### 🎯 **Funcionalidades Principales**
- **Gestión de Productos**: Crear, editar, eliminar productos con cálculo automático de ganancia
- **Gestión de Clientes**: Administrar base de datos de clientes
- **Gestión de Categorías**: Organizar productos por categorías
- **Sistema de Ventas**: Crear ventas con múltiples productos y transacciones seguras
- **Dashboard**: Estadísticas en tiempo real del negocio
- **Stock Management**: Control automático de inventario

### 🔧 **Características Técnicas**
- **Cálculo Automático de Ganancia**: El sistema calcula automáticamente el porcentaje de ganancia basado en precio de venta y costo
- **Transacciones Seguras**: Todas las ventas se procesan en transacciones para garantizar integridad de datos
- **Logging Completo**: Sistema de logs detallado para monitorear todas las operaciones
- **Validaciones Robustas**: Validación tanto en frontend como backend
- **UI Moderna**: Interfaz moderna y responsive con Tailwind CSS

## 🚀 Tecnologías Utilizadas

### **Frontend**
- **React 18** con TypeScript
- **Vite** para build y desarrollo
- **Tailwind CSS** para estilos
- **React Router** para navegación
- **Axios** para llamadas API
- **React Hot Toast** para notificaciones
- **Lucide React** para iconos

### **Backend**
- **Node.js** con Express.js
- **SQLite3** como base de datos
- **CORS** para comunicación cross-origin
- **Middleware personalizado** para logging

## 📦 Instalación

### **Prerrequisitos**
- Node.js (versión 16 o superior)
- npm o yarn

### **Pasos de Instalación**

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/sistema-ventas.git
   cd sistema-ventas
   ```

2. **Instalar dependencias del backend**
   ```bash
   cd backend
   npm install
   ```

3. **Instalar dependencias del frontend**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Inicializar la base de datos**
   ```bash
   cd ../backend
   node seed.js
   ```

## 🏃‍♂️ Ejecución

### **Opción 1: Scripts Automáticos (Recomendado)**
```bash
# Instalar todo e iniciar
./install.bat

# O solo iniciar si ya está instalado
./start.bat
```

### **Opción 2: Manual**
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 🌐 Acceso

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

## 📊 Estructura del Proyecto

```
sistema-ventas/
├── backend/
│   ├── server.js          # Servidor principal
│   ├── seed.js            # Inicialización de BD
│   ├── database.sqlite    # Base de datos SQLite
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── pages/         # Páginas de la aplicación
│   │   ├── services/      # Servicios API
│   │   └── main.tsx       # Punto de entrada
│   ├── index.html
│   └── package.json
├── install.bat            # Script de instalación
├── start.bat              # Script de inicio
└── README.md
```

## 🔌 API Endpoints

### **Productos**
- `GET /api/productos` - Obtener todos los productos
- `POST /api/productos` - Crear nuevo producto
- `PUT /api/productos/:id` - Actualizar producto
- `DELETE /api/productos/:id` - Eliminar producto

### **Categorías**
- `GET /api/categorias` - Obtener todas las categorías
- `POST /api/categorias` - Crear nueva categoría
- `PUT /api/categorias/:id` - Actualizar categoría
- `DELETE /api/categorias/:id` - Eliminar categoría

### **Clientes**
- `GET /api/clientes` - Obtener todos los clientes
- `POST /api/clientes` - Crear nuevo cliente

### **Ventas**
- `GET /api/ventas` - Obtener todas las ventas
- `POST /api/ventas` - Crear nueva venta
- `GET /api/ventas/:id` - Obtener detalles de una venta
- `DELETE /api/ventas/limpiar-huérfanas` - Limpiar ventas sin detalles

### **Estadísticas**
- `GET /api/stats` - Obtener estadísticas del sistema
- `GET /api/productos/bajo-stock` - Productos con bajo stock
- `POST /api/calcular-ganancia` - Calcular porcentaje de ganancia

## 🎯 Características Destacadas

### **Cálculo Automático de Ganancia**
El sistema puede calcular automáticamente el porcentaje de ganancia:
- Si proporcionas precio de venta y costo → calcula automáticamente
- Si solo proporcionas precio de venta → usa 30% por defecto
- Endpoint especial para cálculos en tiempo real

### **Sistema de Logging**
- Logs detallados de todas las operaciones
- Monitoreo de requests/responses
- Tracking de transacciones de ventas
- Logs de errores con contexto completo

### **Transacciones Seguras**
- Todas las ventas se procesan en transacciones
- Rollback automático en caso de errores
- Validación de stock antes de procesar
- Actualización automática de inventario

## 🛠️ Desarrollo

### **Estructura de Base de Datos**
```sql
-- Tablas principales
categorias (id, nombre, descripcion, created_at)
productos (id, nombre, descripcion, precio, precio_costo, porcentaje_ganancia, stock, categoria_id, codigo, created_at, updated_at)
clientes (id, nombre, email, telefono, direccion, created_at)
ventas (id, cliente_id, total, fecha, estado)
detalles_venta (id, venta_id, producto_id, cantidad, precio_unitario, subtotal)
```

### **Variables de Entorno**
El proyecto no requiere variables de entorno por defecto, pero puedes configurar:
- `PORT` - Puerto del servidor backend (default: 3001)

## 📝 Logs y Monitoreo

El sistema incluye un sistema de logging completo que registra:
- Todas las peticiones HTTP con timestamps
- Headers y body de las requests
- Status codes y respuestas
- Errores detallados con stack traces
- Operaciones de base de datos
- Transacciones de ventas

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**Guido Martinez** - guimartinez@frba.utn.edu.ar

🙏 Agradecimientos

- React y la comunidad de desarrolladores
- Tailwind CSS por el framework de estilos
- SQLite por la base de datos ligera
- Express.js por el framework web

---

⭐ **¡Si te gusta este proyecto, dale una estrella en GitHub!** 
