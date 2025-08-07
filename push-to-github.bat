@echo off
echo 🚀 Configurando repositorio Git para Sistema de Ventas...
echo.

REM Verificar si Git está instalado
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git no está instalado. Por favor instala Git desde: https://git-scm.com/download/win
    echo.
    echo Después de instalar Git, ejecuta este script nuevamente.
    pause
    exit /b 1
)

echo ✅ Git encontrado
echo.

REM Inicializar repositorio Git
echo 📁 Inicializando repositorio Git...
git init

REM Configurar usuario (cambia estos datos por los tuyos)
echo 👤 Configurando usuario Git...
echo Por favor ingresa tu nombre de usuario de GitHub:
set /p GITHUB_USERNAME=
echo Por favor ingresa tu email de GitHub:
set /p GITHUB_EMAIL=

git config user.name "%GITHUB_USERNAME%"
git config user.email "%GITHUB_EMAIL%"

REM Agregar todos los archivos
echo 📦 Agregando archivos al repositorio...
git add .

REM Hacer el primer commit
echo 💾 Haciendo primer commit...
git commit -m "🚀 Initial commit: Sistema de Ventas completo

✨ Características implementadas:
- Backend con Express.js y SQLite3
- Frontend con React + TypeScript + Vite
- Sistema de productos con cálculo automático de ganancia
- Gestión de clientes y categorías
- Sistema de ventas con transacciones
- Dashboard con estadísticas
- Logging completo de todas las operaciones
- UI moderna con Tailwind CSS

🔧 Tecnologías utilizadas:
- Backend: Node.js, Express, SQLite3
- Frontend: React, TypeScript, Vite, Tailwind CSS
- Base de datos: SQLite3
- Logging: Console logs detallados"

echo.
echo 🎉 Repositorio local configurado exitosamente!
echo.
echo 📋 Próximos pasos:
echo 1. Ve a https://github.com y crea un nuevo repositorio
echo 2. Copia la URL del repositorio (ejemplo: https://github.com/tu-usuario/sistema-ventas.git)
echo 3. Ejecuta el siguiente comando reemplazando la URL:
echo    git remote add origin https://github.com/tu-usuario/sistema-ventas.git
echo 4. Ejecuta: git push -u origin main
echo.
echo 💡 También puedes ejecutar: git-push.bat después de configurar el remote
pause 