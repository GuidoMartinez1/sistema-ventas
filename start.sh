#!/bin/bash

echo "🚀 Iniciando Sistema de Ventas..."
echo "================================"

# Verificar si las dependencias están instaladas
if [ ! -d "backend/node_modules" ]; then
    echo "❌ Dependencias del backend no encontradas. Ejecuta primero:"
    echo "   ./install.sh"
    exit 1
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "❌ Dependencias del frontend no encontradas. Ejecuta primero:"
    echo "   ./install.sh"
    exit 1
fi

# Verificar si la base de datos existe
if [ ! -f "backend/database.sqlite" ]; then
    echo "🗄️  Inicializando base de datos..."
    cd backend
    node seed.js
    cd ..
fi

echo "✅ Todo listo para iniciar!"
echo ""
echo "🌐 El sistema estará disponible en:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo ""
echo "📝 Para detener el sistema, presiona Ctrl+C en cada terminal"
echo ""

# Iniciar backend en una nueva terminal
echo "🔧 Iniciando backend..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Esperar un momento para que el backend se inicie
sleep 2

# Iniciar frontend en una nueva terminal
echo "🎨 Iniciando frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 ¡Sistema iniciado exitosamente!"
echo "=================================="
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:3001"
echo ""
echo "Para detener el sistema, ejecuta:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Esperar a que el usuario presione Ctrl+C
trap "echo ''; echo '🛑 Deteniendo sistema...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

# Mantener el script corriendo
wait 