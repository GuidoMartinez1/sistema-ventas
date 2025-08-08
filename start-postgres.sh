#!/bin/bash

echo "🚀 Iniciando Sistema de Ventas con PostgreSQL..."
echo "================================================"

# Verificar dependencias
if [ ! -d "backend/node_modules" ]; then 
    echo "❌ Dependencias del backend no encontradas. Ejecuta primero:"
    echo "   ./install-postgres.sh"
    exit 1
fi

if [ ! -d "frontend/node_modules" ]; then 
    echo "❌ Dependencias del frontend no encontradas. Ejecuta primero:"
    echo "   ./install-postgres.sh"
    exit 1
fi

# Verificar archivo .env
if [ ! -f "backend/.env" ]; then 
    echo "❌ Archivo .env no encontrado. Ejecuta primero:"
    echo "   ./install-postgres.sh"
    exit 1
fi

# Verificar conexión a PostgreSQL
echo "🔍 Verificando conexión a PostgreSQL..."
if ! psql postgres -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ No se puede conectar a PostgreSQL. Asegúrate de que esté ejecutándose:"
    echo "   brew services start postgresql@14"
    exit 1
fi

echo "✅ Conexión a PostgreSQL exitosa"

echo ""
echo "🌐 El sistema estará disponible en:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo "   Base de datos: PostgreSQL (sistema_ventas)"
echo ""
echo "📝 Para detener el sistema, presiona Ctrl+C en cada terminal"
echo ""

# Iniciar backend con PostgreSQL
echo "🔧 Iniciando backend con PostgreSQL..."
cd backend
npm run start:postgres &
BACKEND_PID=$!
cd ..

sleep 3

# Iniciar frontend
echo "🎨 Iniciando frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 ¡Sistema iniciado exitosamente con PostgreSQL!"
echo "================================================"
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:3001"
echo ""
echo "Para detener el sistema, ejecuta:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Manejo de cierre graceful
trap "echo ''; echo '🛑 Deteniendo sistema...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

wait 