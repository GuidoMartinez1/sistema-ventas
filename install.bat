@echo off
echo Instalando Sistema de Ventas...
echo.

echo Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no esta instalado.
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js encontrado.
echo.

echo Instalando dependencias del backend...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Error al instalar dependencias del backend
    pause
    exit /b 1
)

echo.
echo Instalando dependencias del frontend...
cd ../frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Error al instalar dependencias del frontend
    pause
    exit /b 1
)

echo.
echo Instalacion completada exitosamente!
echo.
echo Para ejecutar el sistema:
echo 1. Abre una terminal en la carpeta backend y ejecuta: npm run dev
echo 2. Abre otra terminal en la carpeta frontend y ejecuta: npm run dev
echo 3. Abre http://localhost:3000 en tu navegador
echo.
pause 