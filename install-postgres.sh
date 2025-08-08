#!/bin/bash

echo "🚀 Instalando Sistema de Ventas con PostgreSQL..."
echo "================================================"

# Verificar si PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL no está instalado."
    echo "📦 Instalando PostgreSQL con Homebrew..."
    brew install postgresql@14
    
    # Iniciar PostgreSQL
    echo "🔧 Iniciando PostgreSQL..."
    brew services start postgresql@14
    
    # Esperar a que PostgreSQL esté listo
    echo "⏳ Esperando a que PostgreSQL esté listo..."
    sleep 5
fi

echo "✅ PostgreSQL encontrado: $(psql --version)"

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor, instala Node.js primero:"
    echo "   brew install node"
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Crear base de datos si no existe
echo "🗄️  Configurando base de datos PostgreSQL..."
psql postgres -c "CREATE DATABASE sistema_ventas;" 2>/dev/null || echo "✅ Base de datos ya existe"

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
cd backend
npm install
if [ $? -ne 0 ]; then 
    echo "❌ Error instalando dependencias del backend"
    exit 1
fi

# Crear archivo .env si no existe
if [ ! -f ".env" ]; then
    echo "📝 Creando archivo .env..."
    cat > .env << EOF
# Configuración de PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sistema_ventas
DB_USER=postgres
DB_PASSWORD=
DB_PASSWORD=postgres

# Configuración del servidor
PORT=3001
NODE_ENV=development
EOF
    echo "✅ Archivo .env creado"
else
    echo "✅ Archivo .env ya existe"
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

# Inicializar base de datos PostgreSQL
echo "🗄️  Inicializando base de datos PostgreSQL..."
cd backend
node initPostgreSQL.js
if [ $? -ne 0 ]; then 
    echo "❌ Error inicializando la base de datos PostgreSQL"
    exit 1
fi
cd ..

echo ""
echo "🎉 ¡Instalación con PostgreSQL completada exitosamente!"
echo "======================================================"
echo ""
echo "📋 Para iniciar el sistema con PostgreSQL:"
echo "   ./start-postgres.sh"
echo ""
echo "📋 O manualmente:"
echo "   Terminal 1: cd backend && npm run start:postgres"
echo "   Terminal 2: cd frontend && npm run dev"
echo ""
echo "🌐 El sistema estará disponible en:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo ""
echo "📊 Base de datos: PostgreSQL (sistema_ventas)" 