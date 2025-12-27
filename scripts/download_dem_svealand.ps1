#!/usr/bin/env pwsh
# Download DEM GLO-30 for Svealand preset

$ErrorActionPreference = "Stop"
$PRESET = "svealand"

Write-Host "Downloading GLO-30 DEM for $PRESET..." -ForegroundColor Cyan

# Check credentials
if (-not $env:COPERNICUS_USERNAME -or -not $env:COPERNICUS_PASSWORD) {
    Write-Host "ERROR: COPERNICUS_USERNAME and COPERNICUS_PASSWORD environment variables must be set" -ForegroundColor Red
    exit 1
}

# Run download
docker-compose run --rm `
    -e COPERNICUS_USERNAME=$env:COPERNICUS_USERNAME `
    -e COPERNICUS_PASSWORD=$env:COPERNICUS_PASSWORD `
    prep `
    python3 /app/src/download_dem.py --preset $PRESET --provider glo30

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSUCCESS: DEM downloaded for $PRESET" -ForegroundColor Green
} else {
    Write-Host "`nERROR: DEM download failed" -ForegroundColor Red
    exit 1
}



