@echo off
echo 📊 Visualizando datos del Sistema de Ventas...
echo.

REM Verificar si existe la base de datos
if not exist "backend\database.sqlite" (
    echo ❌ No se encontró la base de datos en backend\database.sqlite
    echo.
    echo 💡 Asegúrate de:
    echo 1. Haber ejecutado el backend al menos una vez
    echo 2. Haber creado algún producto/cliente/venta
    echo.
    pause
    exit /b 1
)

echo ✅ Base de datos encontrada
echo.

REM Verificar si sqlite3 está disponible
sqlite3 --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ SQLite3 no está instalado o no está en el PATH
    echo.
    echo 📋 Datos disponibles en el frontend:
    echo - Productos: http://localhost:5173/productos
    echo - Clientes: http://localhost:5173/clientes
    echo - Categorías: http://localhost:5173/categorias
    echo - Ventas: http://localhost:5173/ventas
    echo - Dashboard: http://localhost:5173
    echo.
    echo 📋 O puedes usar la API directamente:
    echo - Productos: http://localhost:3001/api/productos
    echo - Clientes: http://localhost:3001/api/clientes
    echo - Ventas: http://localhost:3001/api/ventas
    echo - Stats: http://localhost:3001/api/stats
    echo.
    pause
    exit /b 1
)

echo 🔍 Mostrando datos de la base de datos...
echo.

echo ========================================
echo 📦 PRODUCTOS
echo ========================================
sqlite3 backend\database.sqlite "SELECT id, nombre, precio, stock, categoria_id FROM productos ORDER BY nombre;"

echo.
echo ========================================
echo 👥 CLIENTES
echo ========================================
sqlite3 backend\database.sqlite "SELECT id, nombre, email, telefono FROM clientes ORDER BY nombre;"

echo.
echo ========================================
echo 📂 CATEGORÍAS
echo ========================================
sqlite3 backend\database.sqlite "SELECT id, nombre, descripcion FROM categorias ORDER BY nombre;"

echo.
echo ========================================
echo 💰 VENTAS
echo ========================================
sqlite3 backend\database.sqlite "SELECT v.id, v.total, v.fecha, c.nombre as cliente FROM ventas v LEFT JOIN clientes c ON v.cliente_id = c.id ORDER BY v.fecha DESC LIMIT 10;"

echo.
echo ========================================
echo 📊 ESTADÍSTICAS
echo ========================================
sqlite3 backend\database.sqlite "SELECT 
    (SELECT COUNT(*) FROM productos) as total_productos,
    (SELECT COUNT(*) FROM clientes) as total_clientes,
    (SELECT COUNT(*) FROM ventas) as total_ventas,
    (SELECT SUM(total) FROM ventas) as total_ventas_monto;"

echo.
echo ========================================
echo 📋 DETALLES DE VENTAS (Últimas 5)
echo ========================================
sqlite3 backend\database.sqlite "SELECT 
    dv.venta_id,
    p.nombre as producto,
    dv.cantidad,
    dv.precio_unitario,
    dv.subtotal
FROM detalles_venta dv 
JOIN productos p ON dv.producto_id = p.id 
ORDER BY dv.venta_id DESC 
LIMIT 10;"

echo.
echo 💡 Para ver más detalles, usa el frontend en: http://localhost:5173
echo 💡 O consulta la API en: http://localhost:3001/api/
echo.
pause 