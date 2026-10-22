@echo off
rem ==========================================
rem  NAUTIGO — arranca el sitio y abre el navegador
rem  Doble clic en este archivo para usar el sitio.
rem ==========================================
cd /d "%~dp0"

netstat -an | findstr /r /c:":8800 .*LISTENING" >nul
if errorlevel 1 (
    if not exist "C:\xampp\php\php.exe" (
        echo No se encontro PHP en C:\xampp. Revisa la instalacion de XAMPP.
        pause
        exit /b 1
    )
    start "Servidor NautiGo" "C:\xampp\php\php.exe" -S 127.0.0.1:8800 -t .
    timeout /t 1 /nobreak >nul
)

start "" http://127.0.0.1:8800
echo NautiGo abierto en http://127.0.0.1:8800
echo.
echo Importante:
echo  - No cierres la ventana "Servidor NautiGo" mientras uses el sitio.
echo  - MySQL debe estar encendido en el XAMPP Control Panel.
pause
