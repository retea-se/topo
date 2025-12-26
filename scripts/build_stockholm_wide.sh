#!/bin/bash
# Build all data and tiles for Stockholm Wide coverage
# Usage: ./scripts/build_stockholm_wide.sh [--force] [--skip-osm] [--skip-terrain] [--dry-run]

set -e

PRESET="stockholm_wide"
FORCE=false
SKIP_OSM=false
SKIP_TERRAIN=false
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --force) FORCE=true; shift ;;
        --skip-osm) SKIP_OSM=true; shift ;;
        --skip-terrain) SKIP_TERRAIN=true; shift ;;
        --dry-run) DRY_RUN=true; shift ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

step() { echo -e "\n${CYAN}=== $1 ===${NC}"; }
ok() { echo -e "${GREEN}[OK]${NC} $1"; }
skip() { echo -e "${YELLOW}[SKIP]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
info() { echo -e "${GRAY}[INFO]${NC} $1"; }

# Change to project root
cd "$(dirname "$0")/.."

echo -e "
================================================================================
          BUILD STOCKHOLM WIDE - Full Coverage Data Generation
================================================================================

Preset: ${PRESET}
Bbox:   17.75, 59.28, 18.25, 59.40 (Greater Stockholm)

This will generate:
  - OSM data clipped to wide bbox
  - OSM vector tiles (roads, buildings, water, parks)
  - Hillshade raster from DEM
  - Hillshade tiles (XYZ PNG)
  - Contour lines (2m, 10m, 50m)
  - Contour vector tiles
"

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}[DRY RUN MODE - No actual commands will be executed]${NC}"
fi

# Check Docker
step "Checking prerequisites"
if ! docker info >/dev/null 2>&1; then
    error "Docker is not running. Please start Docker."
    exit 1
fi
ok "Docker is running"

# Build prep service
step "Building prep service"
if [ "$DRY_RUN" = true ]; then
    info "Would run: docker-compose build prep"
else
    docker-compose build prep
    ok "Prep service built"
fi

# ============================================================================
# STEP 1: OSM Data
# ============================================================================
if [ "$SKIP_OSM" = false ]; then
    step "Step 1: OSM Data Generation"

    # 1a. Check/download Sweden OSM
    info "Checking for Sweden OSM data..."
    if [ "$DRY_RUN" = true ]; then
        info "Would check for Sweden OSM"
    else
        if ! docker-compose run --rm prep ls -la /data/osm/sweden-latest.osm.pbf >/dev/null 2>&1; then
            info "Downloading Sweden OSM data (this may take a while)..."
            docker-compose run --rm prep python3 /app/src/download_osm.py
        else
            ok "Sweden OSM data exists"
        fi
    fi

    # 1b. Clip to stockholm_wide
    info "Clipping OSM to ${PRESET} bbox..."
    if [ "$DRY_RUN" = true ]; then
        info "Would run: docker-compose run --rm prep python3 /app/src/clip_osm.py --preset ${PRESET}"
    else
        if [ "$FORCE" = false ] && docker-compose run --rm prep ls -la "/data/osm/${PRESET}.osm.pbf" >/dev/null 2>&1; then
            skip "OSM clip already exists. Use --force to regenerate."
        else
            docker-compose run --rm prep python3 /app/src/clip_osm.py --preset ${PRESET}
            ok "OSM clipped to ${PRESET}"
        fi
    fi

    # 1c. Generate OSM tiles
    info "Generating OSM vector tiles..."
    if [ "$DRY_RUN" = true ]; then
        info "Would run: docker-compose run --rm prep /app/scripts/generate_osm_tiles.sh ${PRESET}"
    else
        if [ "$FORCE" = false ] && docker-compose run --rm prep ls -la "/data/tiles/osm/${PRESET}.mbtiles" >/dev/null 2>&1; then
            skip "OSM tiles already exist. Use --force to regenerate."
        else
            docker-compose run --rm prep /app/scripts/generate_osm_tiles.sh ${PRESET}
            ok "OSM tiles generated"
        fi
    fi
else
    skip "OSM generation (--skip-osm specified)"
fi

# ============================================================================
# STEP 2: Terrain Data (Hillshade + Contours)
# ============================================================================
if [ "$SKIP_TERRAIN" = false ]; then
    step "Step 2: Terrain Data Generation"

    # 2a. Check for DEM data
    info "Checking for DEM data..."
    if [ "$DRY_RUN" = true ]; then
        info "Would check for DEM files"
    else
        if ! docker-compose run --rm prep ls -la /data/dem/ >/dev/null 2>&1; then
            error "DEM data not found. Please place DEM files manually."
            info "See DEM_MANUAL_DOWNLOAD.md for instructions."
            exit 1
        fi
        ok "DEM data found"
    fi

    # 2b. Generate hillshade
    info "Generating hillshade..."
    if [ "$DRY_RUN" = true ]; then
        info "Would run: docker-compose run --rm prep python3 /app/src/generate_hillshade.py --preset ${PRESET}"
    else
        if [ "$FORCE" = false ] && docker-compose run --rm prep ls -la "/data/terrain/hillshade/${PRESET}_hillshade.tif" >/dev/null 2>&1; then
            skip "Hillshade already exists. Use --force to regenerate."
        else
            docker-compose run --rm prep python3 /app/src/generate_hillshade.py --preset ${PRESET}
            ok "Hillshade generated"
        fi
    fi

    # 2c. Generate hillshade tiles
    info "Generating hillshade tiles..."
    if [ "$DRY_RUN" = true ]; then
        info "Would run: docker-compose run --rm prep /app/scripts/generate_hillshade_tiles.sh ${PRESET}"
    else
        if [ "$FORCE" = false ] && docker-compose run --rm prep ls -la "/data/tiles/hillshade/${PRESET}/" >/dev/null 2>&1; then
            skip "Hillshade tiles already exist. Use --force to regenerate."
        else
            docker-compose run --rm prep /app/scripts/generate_hillshade_tiles.sh ${PRESET}
            ok "Hillshade tiles generated"
        fi
    fi

    # 2d. Extract contours
    info "Extracting contour lines..."
    if [ "$DRY_RUN" = true ]; then
        info "Would run: docker-compose run --rm prep python3 /app/src/extract_contours.py --preset ${PRESET}"
    else
        if [ "$FORCE" = false ] && docker-compose run --rm prep ls -la "/data/terrain/contours/${PRESET}_10m.geojson" >/dev/null 2>&1; then
            skip "Contours already exist. Use --force to regenerate."
        else
            docker-compose run --rm prep python3 /app/src/extract_contours.py --preset ${PRESET}
            ok "Contours extracted (2m, 10m, 50m)"
        fi
    fi

    # 2e. Generate contour tiles
    info "Generating contour vector tiles..."
    if [ "$DRY_RUN" = true ]; then
        info "Would run: docker-compose run --rm prep /app/scripts/generate_contour_tiles.sh ${PRESET}"
    else
        if [ "$FORCE" = false ] && docker-compose run --rm prep ls -la "/data/tiles/contours/${PRESET}_10m.mbtiles" >/dev/null 2>&1; then
            skip "Contour tiles already exist. Use --force to regenerate."
        else
            docker-compose run --rm prep /app/scripts/generate_contour_tiles.sh ${PRESET}
            ok "Contour tiles generated"
        fi
    fi
else
    skip "Terrain generation (--skip-terrain specified)"
fi

# ============================================================================
# STEP 3: Verification
# ============================================================================
step "Step 3: Verification"

if [ "$DRY_RUN" = true ]; then
    info "Would verify generated files"
else
    info "Checking generated files..."

    FILES=(
        "/data/osm/${PRESET}.osm.pbf"
        "/data/tiles/osm/${PRESET}.mbtiles"
        "/data/terrain/hillshade/${PRESET}_hillshade.tif"
        "/data/tiles/hillshade/${PRESET}/"
        "/data/terrain/contours/${PRESET}_2m.geojson"
        "/data/terrain/contours/${PRESET}_10m.geojson"
        "/data/terrain/contours/${PRESET}_50m.geojson"
        "/data/tiles/contours/${PRESET}_2m.mbtiles"
        "/data/tiles/contours/${PRESET}_10m.mbtiles"
        "/data/tiles/contours/${PRESET}_50m.mbtiles"
    )

    ALL_FOUND=true
    for file in "${FILES[@]}"; do
        if docker-compose run --rm prep ls -la "$file" >/dev/null 2>&1; then
            ok "$file"
        else
            error "Missing: $file"
            ALL_FOUND=false
        fi
    done

    if [ "$ALL_FOUND" = true ]; then
        echo -e "
${GREEN}================================================================================
  BUILD COMPLETE - Stockholm Wide data ready!
================================================================================${NC}

Next steps:

  1. Restart Demo A services to pick up new tiles:
     docker-compose --profile demoA down
     docker-compose --profile demoA up -d

  2. Open Demo A and select 'Stockholm Wide' preset:
     http://localhost:3000?bbox_preset=stockholm_wide
"
    else
        echo -e "
${RED}================================================================================
  BUILD INCOMPLETE - Some files are missing
================================================================================${NC}
"
        exit 1
    fi
fi
