@echo off
chcp 65001 > nul
echo ======================================================================
echo        UNIVERSIDAD NACIONAL EXPERIMENTAL DEL TÁCHIRA (UNET)
echo          COMPILADOR TINY++ Y DEPURADOR VISUAL DE LA TM
echo ======================================================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0ejecutar_pruebas.ps1"
pause
