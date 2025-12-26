<#
.SYNOPSIS
    Builds all data and tiles for Stockholm Wide coverage.

.DESCRIPTION
    This script generates all required data for the stockholm_wide preset:
    - OSM clip and tiles
    - Hillshade generation and tiles
    - Contour extraction and tiles

    The script can be run incrementally - it will skip steps that have already been completed.

.PARAMETER Force
    Force regeneration of all data, even if files already exist.

.PARAMETER SkipOsm
    Skip OSM data generation (useful if only terrain needs updating).

.PARAMETER SkipTerrain
    Skip terrain (hillshade/contours) generation.

.PARAMETER DryRun
    Show what would be done without actually running commands.

.EXAMPLE
    .\build_stockholm_wide.ps1

.EXAMPLE
    .\build_stockholm_wide.ps1 -Force

.EXAMPLE
    .\build_stockholm_wide.ps1 -SkipOsm
#>

param(
    [switch]$Force,
    [switch]$SkipOsm,
    [switch]$SkipTerrain,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$PRESET = "stockholm_wide"

# Colors for output
function Write-Step { param($msg) Write-Host "`n=== $msg ===" -ForegroundColor Cyan }
function Write-OK { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Skip { param($msg) Write-Host "[SKIP] $msg" -ForegroundColor Yellow }
function Write-Error { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Gray }

# Check if running from project root
$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $projectRoot

Write-Host @"

================================================================================
          BUILD STOCKHOLM WIDE - Full Coverage Data Generation
================================================================================

Preset: $PRESET
Bbox:   17.75, 59.28, 18.25, 59.40 (Greater Stockholm)

This will generate:
  - OSM data clipped to wide bbox
  - OSM vector tiles (roads, buildings, water, parks)
  - Hillshade raster from DEM
  - Hillshade tiles (XYZ PNG)
  - Contour lines (2m, 10m, 50m)
  - Contour vector tiles

"@ -ForegroundColor White

if ($DryRun) {
    Write-Host "[DRY RUN MODE - No actual commands will be executed]" -ForegroundColor Magenta
}

# Check Docker is running
Write-Step "Checking prerequisites"
try {
    $null = docker info 2>$null
    Write-OK "Docker is running"
} catch {
    Write-Error "Docker is not running. Please start Docker Desktop."
    exit 1
}

# Build prep service if needed
Write-Step "Building prep service"
if ($DryRun) {
    Write-Info "Would run: docker-compose build prep"
} else {
    docker-compose build prep
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to build prep service"; exit 1 }
    Write-OK "Prep service built"
}

# ============================================================================
# STEP 1: OSM Data
# ============================================================================
if (-not $SkipOsm) {
    Write-Step "Step 1: OSM Data Generation"

    # 1a. Check if Sweden OSM exists, if not download
    Write-Info "Checking for Sweden OSM data..."
    $checkCmd = "docker-compose run --rm prep ls -la /data/osm/sweden-latest.osm.pbf 2>/dev/null"
    if ($DryRun) {
        Write-Info "Would check: $checkCmd"
    } else {
        $result = docker-compose run --rm prep ls -la /data/osm/sweden-latest.osm.pbf 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Info "Downloading Sweden OSM data (this may take a while)..."
            docker-compose run --rm prep python3 /app/src/download_osm.py
            if ($LASTEXITCODE -ne 0) { Write-Error "Failed to download OSM"; exit 1 }
        } else {
            Write-OK "Sweden OSM data exists"
        }
    }

    # 1b. Clip to stockholm_wide
    Write-Info "Clipping OSM to $PRESET bbox..."
    $clipCheck = "docker-compose run --rm prep ls -la /data/osm/${PRESET}.osm.pbf 2>/dev/null"
    if ($DryRun) {
        Write-Info "Would run: docker-compose run --rm prep python3 /app/src/clip_osm.py --preset $PRESET"
    } else {
        if (-not $Force) {
            $result = docker-compose run --rm prep ls -la "/data/osm/${PRESET}.osm.pbf" 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Skip "OSM clip already exists. Use -Force to regenerate."
            } else {
                docker-compose run --rm prep python3 /app/src/clip_osm.py --preset $PRESET
                if ($LASTEXITCODE -ne 0) { Write-Error "Failed to clip OSM"; exit 1 }
                Write-OK "OSM clipped to $PRESET"
            }
        } else {
            docker-compose run --rm prep python3 /app/src/clip_osm.py --preset $PRESET
            if ($LASTEXITCODE -ne 0) { Write-Error "Failed to clip OSM"; exit 1 }
            Write-OK "OSM clipped to $PRESET"
        }
    }

    # 1c. Generate OSM tiles
    Write-Info "Generating OSM vector tiles..."
    if ($DryRun) {
        Write-Info "Would run: docker-compose run --rm prep /app/scripts/generate_osm_tiles.sh $PRESET"
    } else {
        if (-not $Force) {
            $result = docker-compose run --rm prep ls -la "/data/tiles/osm/${PRESET}.mbtiles" 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Skip "OSM tiles already exist. Use -Force to regenerate."
            } else {
                docker-compose run --rm prep /app/scripts/generate_osm_tiles.sh $PRESET
                if ($LASTEXITCODE -ne 0) { Write-Error "Failed to generate OSM tiles"; exit 1 }
                Write-OK "OSM tiles generated"
            }
        } else {
            docker-compose run --rm prep /app/scripts/generate_osm_tiles.sh $PRESET
            if ($LASTEXITCODE -ne 0) { Write-Error "Failed to generate OSM tiles"; exit 1 }
            Write-OK "OSM tiles generated"
        }
    }
} else {
    Write-Skip "OSM generation (--SkipOsm specified)"
}

# ============================================================================
# STEP 2: Terrain Data (Hillshade + Contours)
# ============================================================================
if (-not $SkipTerrain) {
    Write-Step "Step 2: Terrain Data Generation"

    # 2a. Check for DEM data
    Write-Info "Checking for DEM data..."
    if ($DryRun) {
        Write-Info "Would check for DEM files"
    } else {
        $result = docker-compose run --rm prep ls -la /data/dem/ 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Error "DEM data not found. Please place DEM files manually."
            Write-Info "See DEM_MANUAL_DOWNLOAD.md for instructions."
            Write-Info "Expected location: /data/dem/*.tif"
            exit 1
        }
        Write-OK "DEM data found"
    }

    # 2b. Generate hillshade
    Write-Info "Generating hillshade..."
    if ($DryRun) {
        Write-Info "Would run: docker-compose run --rm prep python3 /app/src/generate_hillshade.py --preset $PRESET"
    } else {
        if (-not $Force) {
            $result = docker-compose run --rm prep ls -la "/data/terrain/hillshade/${PRESET}_hillshade.tif" 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Skip "Hillshade already exists. Use -Force to regenerate."
            } else {
                docker-compose run --rm prep python3 /app/src/generate_hillshade.py --preset $PRESET
                if ($LASTEXITCODE -ne 0) { Write-Error "Failed to generate hillshade"; exit 1 }
                Write-OK "Hillshade generated"
            }
        } else {
            docker-compose run --rm prep python3 /app/src/generate_hillshade.py --preset $PRESET
            if ($LASTEXITCODE -ne 0) { Write-Error "Failed to generate hillshade"; exit 1 }
            Write-OK "Hillshade generated"
        }
    }

    # 2c. Generate hillshade tiles
    Write-Info "Generating hillshade tiles..."
    if ($DryRun) {
        Write-Info "Would run: docker-compose run --rm prep /app/scripts/generate_hillshade_tiles.sh $PRESET"
    } else {
        if (-not $Force) {
            $result = docker-compose run --rm prep ls -la "/data/tiles/hillshade/${PRESET}/" 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Skip "Hillshade tiles already exist. Use -Force to regenerate."
            } else {
                docker-compose run --rm prep /app/scripts/generate_hillshade_tiles.sh $PRESET
                if ($LASTEXITCODE -ne 0) { Write-Error "Failed to generate hillshade tiles"; exit 1 }
                Write-OK "Hillshade tiles generated"
            }
        } else {
            docker-compose run --rm prep /app/scripts/generate_hillshade_tiles.sh $PRESET
            if ($LASTEXITCODE -ne 0) { Write-Error "Failed to generate hillshade tiles"; exit 1 }
            Write-OK "Hillshade tiles generated"
        }
    }

    # 2d. Extract contours
    Write-Info "Extracting contour lines..."
    if ($DryRun) {
        Write-Info "Would run: docker-compose run --rm prep python3 /app/src/extract_contours.py --preset $PRESET"
    } else {
        if (-not $Force) {
            $result = docker-compose run --rm prep ls -la "/data/terrain/contours/${PRESET}_10m.geojson" 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Skip "Contours already exist. Use -Force to regenerate."
            } else {
                docker-compose run --rm prep python3 /app/src/extract_contours.py --preset $PRESET
                if ($LASTEXITCODE -ne 0) { Write-Error "Failed to extract contours"; exit 1 }
                Write-OK "Contours extracted (2m, 10m, 50m)"
            }
        } else {
            docker-compose run --rm prep python3 /app/src/extract_contours.py --preset $PRESET
            if ($LASTEXITCODE -ne 0) { Write-Error "Failed to extract contours"; exit 1 }
            Write-OK "Contours extracted (2m, 10m, 50m)"
        }
    }

    # 2e. Generate contour tiles
    Write-Info "Generating contour vector tiles..."
    if ($DryRun) {
        Write-Info "Would run: docker-compose run --rm prep /app/scripts/generate_contour_tiles.sh $PRESET"
    } else {
        if (-not $Force) {
            $result = docker-compose run --rm prep ls -la "/data/tiles/contours/${PRESET}_10m.mbtiles" 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Skip "Contour tiles already exist. Use -Force to regenerate."
            } else {
                docker-compose run --rm prep /app/scripts/generate_contour_tiles.sh $PRESET
                if ($LASTEXITCODE -ne 0) { Write-Error "Failed to generate contour tiles"; exit 1 }
                Write-OK "Contour tiles generated"
            }
        } else {
            docker-compose run --rm prep /app/scripts/generate_contour_tiles.sh $PRESET
            if ($LASTEXITCODE -ne 0) { Write-Error "Failed to generate contour tiles"; exit 1 }
            Write-OK "Contour tiles generated"
        }
    }
} else {
    Write-Skip "Terrain generation (--SkipTerrain specified)"
}

# ============================================================================
# STEP 3: Verification
# ============================================================================
Write-Step "Step 3: Verification"

if ($DryRun) {
    Write-Info "Would verify generated files"
} else {
    Write-Info "Checking generated files..."

    $files = @(
        "/data/osm/${PRESET}.osm.pbf",
        "/data/tiles/osm/${PRESET}.mbtiles",
        "/data/terrain/hillshade/${PRESET}_hillshade.tif",
        "/data/tiles/hillshade/${PRESET}/",
        "/data/terrain/contours/${PRESET}_2m.geojson",
        "/data/terrain/contours/${PRESET}_10m.geojson",
        "/data/terrain/contours/${PRESET}_50m.geojson",
        "/data/tiles/contours/${PRESET}_2m.mbtiles",
        "/data/tiles/contours/${PRESET}_10m.mbtiles",
        "/data/tiles/contours/${PRESET}_50m.mbtiles"
    )

    $allFound = $true
    foreach ($file in $files) {
        $result = docker-compose run --rm prep ls -la "$file" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-OK $file
        } else {
            Write-Error "Missing: $file"
            $allFound = $false
        }
    }

    if ($allFound) {
        Write-Host "`n" -NoNewline
        Write-Host "================================================================================`n" -ForegroundColor Green
        Write-Host "  BUILD COMPLETE - Stockholm Wide data ready!`n" -ForegroundColor Green
        Write-Host "================================================================================`n" -ForegroundColor Green
        Write-Host "Next steps:`n"
        Write-Host "  1. Restart Demo A services to pick up new tiles:`n"
        Write-Host "     docker-compose --profile demoA down`n"
        Write-Host "     docker-compose --profile demoA up -d`n"
        Write-Host ""
        Write-Host "  2. Open Demo A and select 'Stockholm Wide' preset:`n"
        Write-Host "     http://localhost:3000?bbox_preset=stockholm_wide`n"
        Write-Host ""
    } else {
        Write-Host "`n" -NoNewline
        Write-Host "================================================================================`n" -ForegroundColor Red
        Write-Host "  BUILD INCOMPLETE - Some files are missing`n" -ForegroundColor Red
        Write-Host "================================================================================`n" -ForegroundColor Red
    }
}
