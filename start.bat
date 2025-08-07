@echo off
echo Iniciando Sistema de Ventas...
echo.

echo Iniciando backend...
start "Backend" cmd /k "cd backend && npm run dev"

echo Esperando 3 segundos para que el backend inicie...
timeout /t 3 /nobreak >nul

echo Iniciando frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Sistema iniciado!
echo El frontend estara disponible en: http://localhost:3000
echo El backend estara disponible en: http://localhost:3001
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul 