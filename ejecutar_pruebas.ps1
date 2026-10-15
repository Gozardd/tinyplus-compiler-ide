# ==============================================================================
# PROYECTO FINAL: COMPILADOR "TINY++" E IDE CON DEPURADOR VISUAL (TM)
# Universidad Nacional Experimental del Tachira (UNET)
# Compiladores e Interpretes - 2026
# Bateria Unificada de Compilacion y Verificacion de los 4 Modulos
# ==============================================================================

$root = $PSScriptRoot
$javaDir = Join-Path $root "proyecto\Compiladores_Tiny_Generacion_2022_3 en 2026\Compiladores_Tiny_Generacion_2022_3\Compiladores_Tiny_Generacion_2022_1"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "       UNIVERSIDAD NACIONAL EXPERIMENTAL DEL TACHIRA (UNET)           " -ForegroundColor Cyan
Write-Host "         COMPILADOR TINY++ Y DEPURADOR VISUAL DE LA TM                " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# ------------------------------------------------------------------------------
# FASE 1: Verificacion de Entorno Java
# ------------------------------------------------------------------------------
Write-Host "[1/4] Comprobando entorno Java JDK..." -ForegroundColor Yellow
$javaVer = java -version 2>&1 | Select-Object -First 1
Write-Host "  -> $javaVer" -ForegroundColor Green

# ------------------------------------------------------------------------------
# FASE 2: Compilacion de Clases Java (Modulo 1 + Modulo 2)
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[2/4] Compilando analizador Tiny++ (JFlex + CUP + AST + Backend TM)..." -ForegroundColor Yellow

$srcDir = Join-Path $javaDir "src"
$binDir = Join-Path $javaDir "bin"
if (-not (Test-Path $binDir)) { New-Item -ItemType Directory -Path $binDir | Out-Null }

$cupRuntime = Join-Path $srcDir "especificacion\java-cup-11b-runtime.jar"
$cupFull = Join-Path $srcDir "especificacion\java-cup-11b.jar"
$cpBuild = $cupRuntime + ";" + $cupFull + ";" + $srcDir

$javaFiles = Get-ChildItem -Path (Join-Path $srcDir "ve") -Filter *.java -Recurse | ForEach-Object { $_.FullName }
javac -encoding ISO-8859-1 -cp $cpBuild -d $binDir $javaFiles

if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK: Compilacion Java exitosa. Todas las clases generadas en 'bin'." -ForegroundColor Green
} else {
    Write-Host "  ERROR: Error en la compilacion Java." -ForegroundColor Red
    exit 1
}

# ------------------------------------------------------------------------------
# FASE 3: Bateria Oficial de Pruebas Tiny++ (CUP -> TM Assembly)
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[3/4] Ejecutando bateria oficial de pruebas Tiny++ (CUP -> TM Assembly)..." -ForegroundColor Yellow

$pruebasDir = Join-Path $javaDir "test\pruebas_modulo2"
$archivosTny = Get-ChildItem -Path $pruebasDir -Filter *.tny | Sort-Object Name
$cpRun = $binDir + ";" + $cupRuntime

$totalPruebas = 0
$exitosas = 0

foreach ($f in $archivosTny) {
    $totalPruebas++
    $nombre = $f.BaseName
    $tmFile = Join-Path $pruebasDir ($nombre + ".tm")

    Write-Host "  -> Evaluando: $($f.Name)" -ForegroundColor Cyan
    
    # 1. Compilar Tiny++ a codigo objeto TM
    $compOut = java -cp $cpRun ve.edu.unet.parser $f.FullName 2>&1
    $instruccionesTM = $compOut | Select-String "^\s*\d+:|^\*"
    $instruccionesTM | Out-File -Encoding ascii $tmFile

    # 2. Ejecutar con el simulador en Java
    $simOut = java -cp $binDir ve.edu.unet.TMSimulador $tmFile 2>&1
    $salidas = $simOut | Select-String "^SALIDA:"
    
    foreach ($s in $salidas) {
        Write-Host "     $s" -ForegroundColor Gray
    }

    $isOk = $false
    foreach ($line in $simOut) {
        if ($line -like "*Ejecucion terminada con exito: true*") {
            $isOk = $true
            break
        }
    }

    if ($isOk) {
        Write-Host "     APROBADA" -ForegroundColor Green
        $exitosas++
    } else {
        Write-Host "     FALLO" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "  Resumen Compilador: $exitosas de $totalPruebas pruebas aprobadas al 100%." -ForegroundColor Green

# ------------------------------------------------------------------------------
# FASE 4: Pruebas Unitarias del Motor del Simulador TM en JS (Modulo 3)
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "[4/4] Ejecutando pruebas unitarias del Simulador TM JS (Modulo 3 - Santiago)..." -ForegroundColor Yellow
$nodeTest = Join-Path $root "test\test-tm-simulator.js"

if (Get-Command node -ErrorAction SilentlyContinue) {
    node $nodeTest
} else {
    Write-Host "  (Node.js no esta en el PATH; omitiendo pruebas del emulador JS)" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  PROYECTO LISTO PARA LA EVALUACION Y DEFENSA ORAL UNET              " -ForegroundColor Cyan
Write-Host "  Para abrir el IDE grafico, ejecuta: Start-Process 'ide/index.html'  " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
