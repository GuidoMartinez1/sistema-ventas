#!/bin/bash

echo "🚀 Instalando Sistema de Ventas en macOS..."
echo "=========================================="

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor, instala Node.js primero:"
    echo "   brew install node"
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Error instalando dependencias del backend"
    exit 1
fi
cd ..

# Instalar dependencias del frontend
echo "📦 Instalando dependencias del frontend..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Error instalando dependencias del frontend"
    exit 1
fi
cd ..

# Inicializar base de datos
echo "🗄️  Inicializando base de datos..."
cd backend
node seed.js
if [ $? -ne 0 ]; then
    echo "❌ Error inicializando la base de datos"
    exit 1
fi
cd ..

echo ""
echo "🎉 ¡Instalación completada exitosamente!"
echo "=========================================="
echo "Para iniciar el proyecto, ejecuta:"
echo "   ./start.sh"
echo ""
echo "O manualmente:"
echo "   Terminal 1: cd backend && npm start"
echo "   Terminal 2: cd frontend && npm run dev" 