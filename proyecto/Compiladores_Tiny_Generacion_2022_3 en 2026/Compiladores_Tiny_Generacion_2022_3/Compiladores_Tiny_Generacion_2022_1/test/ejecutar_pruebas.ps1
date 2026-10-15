$archivos = Get-ChildItem "test/pruebas_modulo2/*.tny"
foreach ($f in $archivos) {
    Write-Host "=========================================="
    Write-Host ("PRUEBA: " + $f.Name)
    $tmFile = "test/pruebas_modulo2/" + $f.BaseName + ".tm"
    java -cp "bin;src/especificacion/java-cup-11b-runtime.jar" ve.edu.unet.parser $f.FullName | Select-String '^\s*\d+:|^\*' | Out-File -Encoding ascii $tmFile
    java -cp "bin" ve.edu.unet.TMSimulador $tmFile
}
