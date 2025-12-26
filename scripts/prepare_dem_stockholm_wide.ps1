<#
.SYNOPSIS
    Prepare EU-DEM terrain data for Stockholm Wide preset.

.DESCRIPTION
    This script automates the acquisition and preparation of DEM (Digital Elevation Model)
    data for the stockholm_wide preset. It attempts:

    1. Automated download via Copernicus Data Space API (if credentials available)
    2. Semi-automated workflow with browser helper (fallback)

    The output file will be placed at: /data/dem/manual/stockholm_wide_eudem.tif

.PARAMETER Username
    Copernicus Data Space username (or set COPERNICUS_USERNAME env var)

.PARAMETER Password
    Copernicus Data Space password (or set COPERNICUS_PASSWORD env var)

.PARAMETER ManualOnly
    Skip automated download, show manual instructions only

.PARAMETER InputFile
    Process an already-downloaded EU-DEM file instead of downloading

.EXAMPLE
    # Try automated download (requires credentials)
    .\prepare_dem_stockholm_wide.ps1

.EXAMPLE
    # With explicit credentials
    .\prepare_dem_stockholm_wide.ps1 -Username "user@example.com" -Password "secret"

.EXAMPLE
    # Process manually downloaded file
    .\prepare_dem_stockholm_wide.ps1 -InputFile "C:\Downloads\eu_dem_v11.tif"

.EXAMPLE
    # Show manual download instructions only
    .\prepare_dem_stockholm_wide.ps1 -ManualOnly

.NOTES
    Prerequisites:
    - Docker Desktop running
    - GDAL tools available (via Docker)

    Output:
    - /data/dem/manual/stockholm_wide_eudem.tif (EPSG:3857)

    Attribution:
    - Copernicus DEM: (c) DLR/Airbus, provided by EU/ESA under Copernicus
    - EU-DEM: (c) EEA, Copernicus Land Monitoring Service
#>

param(
    [string]$Username,
    [string]$Password,
    [switch]$ManualOnly,
    [string]$InputFile
)

$ErrorActionPreference = "Stop"
$PRESET = "stockholm_wide"

# Colors
function Write-Step { param($msg) Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Write-OK { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Gray }

# Header
Write-Host @"

================================================================================
        PREPARE DEM DATA FOR STOCKHOLM WIDE
================================================================================

Preset:      $PRESET
Target bbox: 17.75, 59.28, 18.25, 59.40 (WGS84)
Output:      /data/dem/manual/${PRESET}_eudem.tif

This script will obtain and prepare terrain data for hillshade and contour
generation. The DEM will be reprojected to EPSG:3857 (Web Mercator).

"@ -ForegroundColor White

# Change to project root
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

# Check Docker
Write-Step "Checking prerequisites"
try {
    $null = docker info 2>$null
    Write-OK "Docker is running"
} catch {
    Write-Err "Docker is not running. Please start Docker Desktop."
    exit 1
}

# Check if DEM already exists
Write-Step "Checking existing DEM data"
$checkResult = docker-compose run --rm prep ls -la /data/dem/manual/${PRESET}_eudem.tif 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-OK "DEM file already exists: /data/dem/manual/${PRESET}_eudem.tif"
    Write-Host ""
    Write-Host "To regenerate, delete the existing file first:" -ForegroundColor Yellow
    Write-Host "  docker-compose run --rm prep rm /data/dem/manual/${PRESET}_eudem.tif" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or proceed to terrain generation:" -ForegroundColor Green
    Write-Host "  .\scripts\build_stockholm_wide.ps1 -SkipOsm" -ForegroundColor Green
    exit 0
}

Write-Info "No existing DEM found, proceeding with acquisition..."

# Build prep service
Write-Step "Building prep service"
docker-compose build prep
if ($LASTEXITCODE -ne 0) { Write-Err "Failed to build prep service"; exit 1 }
Write-OK "Prep service ready"

# MODE 1: Process existing input file
if ($InputFile) {
    Write-Step "Processing provided input file"

    if (-not (Test-Path $InputFile)) {
        Write-Err "Input file not found: $InputFile"
        exit 1
    }

    Write-Info "Input file: $InputFile"

    # Copy file to temp location in container and process
    $tempContainer = docker run -d --rm -v topo_data:/data -v "${InputFile}:/input/dem.tif:ro" osgeo/gdal:ubuntu-small-3.8.0 sleep 3600
    if ($LASTEXITCODE -ne 0) { Write-Err "Failed to start processing container"; exit 1 }

    try {
        # Get bbox coordinates for stockholm_wide
        # min_lon=17.75, min_lat=59.28, max_lon=18.25, max_lat=59.40
        # Converted to EPSG:3857 with buffer:
        # Approximate: 1976000, 8150000, 2031000, 8220000

        Write-Info "Reprojecting and clipping to EPSG:3857..."

        # Transform bbox corners
        $bboxResult = docker exec $tempContainer sh -c "echo '17.75 59.28' | gdaltransform -s_srs EPSG:4326 -t_srs EPSG:3857 -output_xy && echo '18.25 59.40' | gdaltransform -s_srs EPSG:4326 -t_srs EPSG:3857 -output_xy"

        # Use pre-calculated values with buffer
        $minX = 1975000
        $minY = 8148000
        $maxX = 2032000
        $maxY = 8222000

        docker exec $tempContainer mkdir -p /data/dem/manual

        $warpCmd = "gdalwarp -t_srs EPSG:3857 -te $minX $minY $maxX $maxY -tr 25 25 -r bilinear -co COMPRESS=LZW -co TILED=YES /input/dem.tif /data/dem/manual/${PRESET}_eudem.tif"
        Write-Info "Running: $warpCmd"

        docker exec $tempContainer sh -c $warpCmd
        if ($LASTEXITCODE -ne 0) { Write-Err "gdalwarp failed"; exit 1 }

        Write-OK "DEM processed successfully!"
    }
    finally {
        docker stop $tempContainer | Out-Null
    }

    # Verify
    Write-Step "Verifying output"
    docker-compose run --rm prep gdalinfo /data/dem/manual/${PRESET}_eudem.tif | Select-String -Pattern "Size|EPSG|Driver"
    Write-OK "DEM ready at /data/dem/manual/${PRESET}_eudem.tif"

    Write-Host @"

================================================================================
                        SUCCESS!
================================================================================

DEM data prepared for stockholm_wide.

Next step - generate terrain tiles:

    .\scripts\build_stockholm_wide.ps1 -SkipOsm

"@ -ForegroundColor Green
    exit 0
}

# MODE 2: Automated download via Copernicus API
if (-not $ManualOnly) {
    Write-Step "Attempting automated download"

    # Set credentials from parameters or environment
    if ($Username) { $env:COPERNICUS_USERNAME = $Username }
    if ($Password) { $env:COPERNICUS_PASSWORD = $Password }

    # Check if credentials available
    if (-not $env:COPERNICUS_USERNAME -or -not $env:COPERNICUS_PASSWORD) {
        Write-Warn "Copernicus credentials not found"
        Write-Info "Set COPERNICUS_USERNAME and COPERNICUS_PASSWORD, or use -Username/-Password"
        Write-Info "Falling back to manual download instructions..."
        $ManualOnly = $true
    } else {
        Write-Info "Using credentials for: $env:COPERNICUS_USERNAME"

        # Run download script in Docker
        $scriptContent = Get-Content -Path "$scriptPath\download_copernicus_dem.py" -Raw

        # Copy script into container and run
        docker-compose run --rm `
            -e COPERNICUS_USERNAME="$env:COPERNICUS_USERNAME" `
            -e COPERNICUS_PASSWORD="$env:COPERNICUS_PASSWORD" `
            prep python3 /app/scripts/download_copernicus_dem.py --preset $PRESET

        if ($LASTEXITCODE -eq 0) {
            Write-OK "Automated download successful!"

            Write-Host @"

================================================================================
                        SUCCESS!
================================================================================

DEM data downloaded and prepared for stockholm_wide.

Next step - generate terrain tiles:

    .\scripts\build_stockholm_wide.ps1 -SkipOsm

"@ -ForegroundColor Green
            exit 0
        } else {
            Write-Warn "Automated download failed, showing manual instructions..."
            $ManualOnly = $true
        }
    }
}

# MODE 3: Manual download instructions
if ($ManualOnly) {
    Write-Step "Manual Download Instructions"

    Write-Host @"

================================================================================
                MANUAL EU-DEM DOWNLOAD REQUIRED
================================================================================

The automated download could not complete. Please follow these steps:

STEP 1: Download EU-DEM
-----------------------

Option A - Copernicus Land Portal (Recommended for EU-DEM v1.1):
   1. Visit: https://land.copernicus.eu/imagery-in-situ/eu-dem/eu-dem-v1.1
   2. Create free account if needed
   3. Navigate to download section
   4. Download tile covering Stockholm (E40N40 or similar)
   5. The file will be ~500MB-1GB

Option B - Copernicus Data Space (Copernicus DEM GLO-30):
   1. Visit: https://dataspace.copernicus.eu/
   2. Login with your account
   3. Search for "COP-DEM GLO-30" in the catalog
   4. Filter by area: Stockholm region (59.3N, 18.0E)
   5. Download relevant tiles

STEP 2: Process the downloaded file
------------------------------------

After downloading, run this script again with -InputFile:

    .\scripts\prepare_dem_stockholm_wide.ps1 -InputFile "C:\Downloads\your_dem_file.tif"

Or use Docker directly:

    # Start temp container
    docker run -it --rm -v topo_data:/data -v C:\Downloads:/input osgeo/gdal:ubuntu-small-3.8.0 bash

    # Inside container, run gdalwarp
    mkdir -p /data/dem/manual
    gdalwarp -t_srs EPSG:3857 \
             -te 1975000 8148000 2032000 8222000 \
             -tr 25 25 \
             -r bilinear \
             -co COMPRESS=LZW \
             -co TILED=YES \
             /input/your_dem_file.tif \
             /data/dem/manual/stockholm_wide_eudem.tif

STEP 3: Verify and continue
---------------------------

After processing, verify the file:

    docker-compose run --rm prep gdalinfo /data/dem/manual/stockholm_wide_eudem.tif

Then generate terrain tiles:

    .\scripts\build_stockholm_wide.ps1 -SkipOsm

================================================================================
Target bbox (WGS84):    17.75, 59.28, 18.25, 59.40
Target bbox (EPSG:3857): 1975000, 8148000, 2032000, 8222000 (approx)
Target file:            /data/dem/manual/stockholm_wide_eudem.tif
================================================================================

"@ -ForegroundColor Yellow

    # Offer to open Copernicus portal
    Write-Host ""
    $openBrowser = Read-Host "Open Copernicus Land Portal in browser? (y/n)"
    if ($openBrowser -eq 'y') {
        Start-Process "https://land.copernicus.eu/imagery-in-situ/eu-dem/eu-dem-v1.1"
        Write-Info "Browser opened. Download the EU-DEM tile and run this script again with -InputFile"
    }

    exit 1
}
