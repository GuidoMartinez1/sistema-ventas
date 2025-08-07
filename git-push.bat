@echo off
echo 🚀 Subiendo código a GitHub...
echo.

REM Verificar si estamos en un repositorio Git
git status >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ No estás en un repositorio Git. Ejecuta primero: push-to-github.bat
    pause
    exit /b 1
)

REM Verificar si hay cambios para commitear
git status --porcelain | findstr . >nul
if %errorlevel% equ 0 (
    echo 📦 Hay cambios pendientes. Agregando archivos...
    git add .
    
    echo 💾 Haciendo commit de los cambios...
    git commit -m "🔄 Actualización: Mejoras en el sistema de ventas

✨ Cambios realizados:
- Corregido mapeo de campos entre frontend y backend
- Mejorado sistema de logging y validaciones
- Optimizado manejo de transacciones de ventas
- Arreglados errores de compilación en frontend
- Implementado cálculo automático de ganancia
- Agregado endpoint para limpiar ventas huérfanas"
)

REM Verificar si existe el remote origin
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ No hay un remote origin configurado.
    echo.
    echo Por favor ejecuta:
    echo git remote add origin https://github.com/tu-usuario/sistema-ventas.git
    echo.
    echo Reemplaza la URL con la de tu repositorio de GitHub.
    pause
    exit /b 1
)

echo 🌐 Subiendo a GitHub...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo 🎉 ¡Código subido exitosamente a GitHub!
    echo.
    echo 📋 URL del repositorio:
    git remote get-url origin
) else (
    echo.
    echo ❌ Error al subir el código. Verifica:
    echo - Que tengas permisos en el repositorio
    echo - Que tu token de acceso sea válido
    echo - Que la URL del remote sea correcta
)

echo.
pause 