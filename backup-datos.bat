@echo off
echo 💾 Creando backup de los datos del Sistema de Ventas...
echo.

REM Verificar si existe la base de datos
if not exist "backend\database.sqlite" (
    echo ❌ No se encontró la base de datos en backend\database.sqlite
    echo.
    echo 💡 Asegúrate de que el sistema haya sido ejecutado al menos una vez.
    pause
    exit /b 1
)

REM Crear carpeta de backups si no existe
if not exist "backups" (
    echo 📁 Creando carpeta de backups...
    mkdir backups
)

REM Generar nombre del archivo con fecha y hora
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "datestamp=%YYYY%-%MM%-%DD%_%HH%-%Min%-%Sec%"

set "backup_file=backups\sistema-ventas_%datestamp%.sqlite"

echo 📦 Copiando base de datos...
copy "backend\database.sqlite" "%backup_file%"

if %errorlevel% equ 0 (
    echo ✅ Backup creado exitosamente: %backup_file%
    echo.
    echo 📊 Información del backup:
    echo - Archivo: %backup_file%
    echo - Tamaño: 
    for %%A in ("%backup_file%") do echo   %%~zA bytes
    echo - Fecha: %YYYY%-%MM%-%DD% %HH%:%Min%:%Sec%
    echo.
    echo 💡 Para restaurar este backup:
    echo 1. Detén el backend si está ejecutándose
    echo 2. Copia este archivo a: backend\database.sqlite
    echo 3. Reinicia el backend
    echo.
) else (
    echo ❌ Error al crear el backup
)

echo 📋 Lista de backups disponibles:
if exist "backups\*.sqlite" (
    dir /b /o-d "backups\*.sqlite"
) else (
    echo No hay backups anteriores
)

echo.
pause 