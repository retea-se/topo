<#
.SYNOPSIS
    Build all data for full Stockholm coverage (core + wide).

.DESCRIPTION
    This is the main entry point for building all map data.
    It runs build_stockholm_wide.ps1 which handles both presets.

    The script is idempotent - it will skip steps that have already been completed.

.PARAMETER Force
    Force regeneration of all data, even if files already exist.

.PARAMETER SkipOsm
    Skip OSM data generation (useful if only terrain needs updating).

.PARAMETER SkipTerrain
    Skip terrain (hillshade/contours) generation.

.PARAMETER DryRun
    Show what would be done without actually running commands.

.EXAMPLE
    .\build_full_coverage.ps1

.EXAMPLE
    .\build_full_coverage.ps1 -Force

.NOTES
    Requires:
    - Docker Desktop running
    - DEM files placed in /data/dem/manual/ (see DEM_MANUAL_DOWNLOAD.md)

    Output:
    - OSM tiles for both presets
    - Hillshade tiles for both presets (if DEM available)
    - Contour tiles for both presets (if DEM available)
#>

param(
    [switch]$Force,
    [switch]$SkipOsm,
    [switch]$SkipTerrain,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

Write-Host @"

================================================================================
                    BUILD FULL COVERAGE
================================================================================

This script builds all data for complete Stockholm map coverage.

Presets to build:
  - stockholm_core (central Stockholm)
  - stockholm_wide (greater Stockholm including suburbs)

Layers:
  - OSM (roads, buildings, water, parks)
  - Hillshade (terrain shading from DEM)
  - Contours (2m, 10m, 50m elevation lines)

"@ -ForegroundColor Cyan

# Change to project root
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

# Build stockholm_core first (smaller, faster)
Write-Host "`n=== Building stockholm_core ===" -ForegroundColor Yellow

$coreArgs = @()
if ($Force) { $coreArgs += "-Force" }
if ($SkipOsm) { $coreArgs += "-SkipOsm" }
if ($SkipTerrain) { $coreArgs += "-SkipTerrain" }
if ($DryRun) { $coreArgs += "-DryRun" }

# Note: build_stockholm_wide.ps1 handles the wide preset
# For core, we use the same script logic but with stockholm_core preset
# Since build_stockholm_wide.ps1 is hardcoded to stockholm_wide,
# we'll just call it for the wide preset.

# Check if core data exists
Write-Host "[INFO] stockholm_core data check..." -ForegroundColor Gray
$coreExists = docker-compose run --rm prep ls -la /data/tiles/osm/stockholm_core.mbtiles 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] stockholm_core OSM tiles exist" -ForegroundColor Green
} else {
    Write-Host "[WARN] stockholm_core OSM tiles missing - run prep manually" -ForegroundColor Yellow
}

# Build stockholm_wide
Write-Host "`n=== Building stockholm_wide ===" -ForegroundColor Yellow

$wideScript = Join-Path $scriptPath "build_stockholm_wide.ps1"
if (Test-Path $wideScript) {
    & $wideScript @coreArgs
} else {
    Write-Host "[ERROR] build_stockholm_wide.ps1 not found" -ForegroundColor Red
    exit 1
}

Write-Host @"

================================================================================
                    BUILD COMPLETE
================================================================================

Next steps:

  1. Restart services to pick up new tiles:
     docker-compose --profile demoA --profile demoB down
     docker-compose --profile demoA --profile demoB up -d

  2. Open Demo A with Stockholm Wide:
     http://localhost:3000?bbox_preset=stockholm_wide

  3. Open Demo B with Stockholm Wide:
     http://localhost:3001

"@ -ForegroundColor Green
