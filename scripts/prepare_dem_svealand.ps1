<#
.SYNOPSIS
    Prepare EU-DEM terrain data for Svealand preset.

.DESCRIPTION
    This script automates the acquisition and preparation of DEM (Digital Elevation Model)
    data for the svealand preset. It attempts:

    1. Automated download via Copernicus Data Space API (if credentials available)
    2. Semi-automated workflow with browser helper (fallback)

    The output file will be placed at: /data/dem/manual/svealand_eudem.tif

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
    .\prepare_dem_svealand.ps1

.EXAMPLE
    # With explicit credentials
    .\prepare_dem_svealand.ps1 -Username "user@example.com" -Password "secret"

.EXAMPLE
    # Process manually downloaded file
    .\prepare_dem_svealand.ps1 -InputFile "C:\Downloads\eu_dem_v11.tif"

.EXAMPLE
    # Show manual download instructions only
    .\prepare_dem_svealand.ps1 -ManualOnly

.NOTES
    Prerequisites:
    - Docker Desktop running
    - GDAL tools available (via Docker)

    Output:
    - /data/dem/manual/svealand_eudem.tif (EPSG:3857)

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
$PRESET = "svealand"

# Colors
function Write-Step { param($msg) Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Write-OK { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Gray }

# Header
Write-Host @"

================================================================================
        PREPARE DEM DATA FOR SVEALAND
================================================================================

Preset:      $PRESET
Target bbox: 14.5, 58.5, 19.0, 61.0 (WGS84)
Output:      /data/dem/manual/${PRESET}_eudem.tif

This script will obtain and prepare terrain data for hillshade and contour
generation. The DEM will be reprojected to EPSG:3857 (Web Mercator).

NOTE: Svealand is a large region. The DEM file may be several GB in size.

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
    Write-Host "  .\scripts\build_svealand.ps1 -SkipOsm" -ForegroundColor Green
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

    # Calculate bbox in EPSG:3857 (approximate for svealand)
    # min_lon=14.5, min_lat=58.5, max_lon=19.0, max_lat=61.0
    # Converted to EPSG:3857 with buffer (approximate):
    # Using gdaltransform to get exact values
    Write-Info "Calculating bbox in EPSG:3857..."

    $inputDir = Split-Path -Parent (Resolve-Path $InputFile)
    $inputName = Split-Path -Leaf $InputFile

    Write-Info "Reprojecting and clipping to EPSG:3857..."
    Write-Warn "This may take a while for large Svealand region..."

    # Use gdalwarp with bbox calculation
    docker run --rm `
        -v topo_data:/data `
        -v "${inputDir}:/input:ro" `
        osgeo/gdal:ubuntu-small-3.8.0 `
        sh -c "mkdir -p /data/dem/manual && gdalwarp -t_srs EPSG:3857 -te_srs EPSG:4326 -te 14.5 58.5 19.0 61.0 -tr 25 25 -r bilinear -co COMPRESS=LZW -co TILED=YES /input/$inputName /data/dem/manual/${PRESET}_eudem.tif"

    if ($LASTEXITCODE -ne 0) {
        Write-Err "gdalwarp failed"
        exit 1
    }

    Write-OK "DEM processed successfully!"

    # Verify
    Write-Step "Verifying output"
    docker-compose run --rm prep gdalinfo /data/dem/manual/${PRESET}_eudem.tif | Select-String -Pattern "Size|EPSG|Driver"
    Write-OK "DEM ready at /data/dem/manual/${PRESET}_eudem.tif"

    Write-Host ""
    Write-Host "================================================================================" -ForegroundColor Green
    Write-Host "                        SUCCESS!" -ForegroundColor Green
    Write-Host "================================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "DEM data prepared for svealand."
    Write-Host ""
    Write-Host "Next step - generate terrain tiles:"
    Write-Host "    .\scripts\build_svealand.ps1 -SkipOsm"
    Write-Host ""
    exit 0
}

# MODE 2: Automated download via Copernicus API
if (-not $ManualOnly) {
    Write-Step "Attempting automated download"

    # Use provided credentials or environment variables
    if ($Username) { $env:COPERNICUS_USERNAME = $Username }
    if ($Password) { $env:COPERNICUS_PASSWORD = $Password }

    if (-not $env:COPERNICUS_USERNAME -or -not $env:COPERNICUS_PASSWORD) {
        Write-Warn "Copernicus credentials not found"
        Write-Info "Set COPERNICUS_USERNAME and COPERNICUS_PASSWORD, or use -Username/-Password"
        Write-Info "Falling back to manual download instructions..."
        $ManualOnly = $true
    } else {
        Write-Info "Using credentials for: $env:COPERNICUS_USERNAME"

        # Run download script in Docker
        docker-compose run --rm `
            -e COPERNICUS_USERNAME="$env:COPERNICUS_USERNAME" `
            -e COPERNICUS_PASSWORD="$env:COPERNICUS_PASSWORD" `
            prep python3 /app/scripts/download_copernicus_dem.py --preset $PRESET

        if ($LASTEXITCODE -eq 0) {
            Write-OK "Automated download successful!"
            Write-Host ""
            Write-Host "================================================================================" -ForegroundColor Green
            Write-Host "                        SUCCESS!" -ForegroundColor Green
            Write-Host "================================================================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "DEM data downloaded and prepared for svealand."
            Write-Host ""
            Write-Host "Next step - generate terrain tiles:"
            Write-Host "    .\scripts\build_svealand.ps1 -SkipOsm"
            Write-Host ""
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
   4. Download tiles covering Svealand region (may require multiple tiles)
   5. Files will be ~500MB-1GB each

Option B - Copernicus Data Space (Copernicus DEM GLO-30):
   1. Visit: https://dataspace.copernicus.eu/
   2. Login with your account
   3. Search for "COP-DEM GLO-30" in the catalog
   4. Filter by area: Svealand region (59.5N, 16.5E center)
   5. Download relevant tiles covering bbox: 14.5, 58.5, 19.0, 61.0

STEP 2: Process the downloaded file(s)
---------------------------------------

After downloading, run this script again with -InputFile:

    .\scripts\prepare_dem_svealand.ps1 -InputFile "C:\Downloads\your_dem_file.tif"

Or use Docker directly:

    docker run --rm -v topo_data:/data -v "C:\Downloads:/input:ro" `
        osgeo/gdal:ubuntu-small-3.8.0 sh -c `
        "mkdir -p /data/dem/manual && gdalwarp -t_srs EPSG:3857 `
         -te_srs EPSG:4326 -te 14.5 58.5 19.0 61.0 `
         -tr 25 25 -r bilinear -co COMPRESS=LZW -co TILED=YES `
         /input/your_dem_file.tif /data/dem/manual/svealand_eudem.tif"

STEP 3: Verify and continue
---------------------------

After processing, verify the file:

    docker-compose run --rm prep gdalinfo /data/dem/manual/svealand_eudem.tif

Then generate terrain tiles:

    .\scripts\build_svealand.ps1 -SkipOsm

================================================================================
Target bbox (WGS84):    14.5, 58.5, 19.0, 61.0
Target file:            /data/dem/manual/svealand_eudem.tif
================================================================================

"@ -ForegroundColor Yellow

    exit 1
}

