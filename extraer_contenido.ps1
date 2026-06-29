# Archivo: extraer_contenido.ps1
$lista = Get-Content -Path "lista_archivo-060825.txt" | Where-Object { $_ -match '\S' } | ForEach-Object { $_.Trim() }
$salida = "CodigosFuente-060825-spanish-learning.txt"
$directorioBase = "src"

# Limpiar archivo de salida
if (Test-Path $salida) { Remove-Item $salida }

foreach ($nombreArchivo in $lista) {
    $archivos = Get-ChildItem -Path $directorioBase -Recurse -File | 
                Where-Object { $_.Name -eq $nombreArchivo }
    
    if ($archivos) {
        foreach ($archivo in $archivos) {
            # Agregar encabezado
            $header = @"
            

--- Inicio de $($archivo.Name) ---

"@

            $footer = @"

--- Fin de $($archivo.Name) ---

"@
            Add-Content -Path $salida -Value $header

            # Agregar contenido del archivo (con formato)
            Get-Content $archivo.FullName | ForEach-Object {
                Add-Content -Path $salida -Value $_
            }

            Add-Content -Path $salida -Value $footer
            
            Write-Host "[OK] Procesado: $($archivo.FullName)"
        }
    }
    else {
        Write-Host "[NO ENCONTRADO] $nombreArchivo" -ForegroundColor Red
    }
}
