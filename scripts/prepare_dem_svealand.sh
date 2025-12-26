#!/bin/bash
#
# Prepare EU-DEM terrain data for Svealand preset.
#
# This script automates the acquisition and preparation of DEM data for the
# svealand preset. It attempts:
#   1. Automated download via Copernicus Data Space API (if credentials available)
#   2. Semi-automated workflow with manual download instructions (fallback)
#
# Usage:
#   ./prepare_dem_svealand.sh
#   ./prepare_dem_svealand.sh --input /path/to/downloaded/dem.tif
#   ./prepare_dem_svealand.sh --manual-only
#
# Environment variables:
#   COPERNICUS_USERNAME - Copernicus Data Space username
#   COPERNICUS_PASSWORD - Copernicus Data Space password
#
# Output:
#   /data/dem/manual/svealand_eudem.tif (EPSG:3857)

set -e

PRESET="svealand"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

step() { echo -e "\n${CYAN}=== $1 ===${NC}"; }
ok() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err() { echo -e "${RED}[ERROR]${NC} $1"; }
info() { echo -e "[INFO] $1"; }

# Parse arguments
INPUT_FILE=""
MANUAL_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --input|-i)
            INPUT_FILE="$2"
            shift 2
            ;;
        --manual-only|-m)
            MANUAL_ONLY=true
            shift
            ;;
        --username|-u)
            export COPERNICUS_USERNAME="$2"
            shift 2
            ;;
        --password|-p)
            export COPERNICUS_PASSWORD="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --input, -i FILE      Process existing DEM file"
            echo "  --manual-only, -m     Show manual download instructions only"
            echo "  --username, -u USER   Copernicus username"
            echo "  --password, -p PASS   Copernicus password"
            echo "  --help, -h            Show this help"
            exit 0
            ;;
        *)
            err "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Header
echo ""
echo "================================================================================"
echo "        PREPARE DEM DATA FOR SVEALAND"
echo "================================================================================"
echo ""
echo "Preset:      $PRESET"
echo "Target bbox: 14.5, 58.5, 19.0, 61.0 (WGS84)"
echo "Output:      /data/dem/manual/${PRESET}_eudem.tif"
echo ""
echo "NOTE: Svealand is a large region. The DEM file may be several GB in size."
echo ""

cd "$PROJECT_ROOT"

# Check Docker
step "Checking prerequisites"
if ! docker info > /dev/null 2>&1; then
    err "Docker is not running. Please start Docker."
    exit 1
fi
ok "Docker is running"

# Check if DEM already exists
step "Checking existing DEM data"
if docker-compose run --rm prep ls -la /data/dem/manual/${PRESET}_eudem.tif > /dev/null 2>&1; then
    ok "DEM file already exists: /data/dem/manual/${PRESET}_eudem.tif"
    echo ""
    echo -e "${YELLOW}To regenerate, delete the existing file first:${NC}"
    echo "  docker-compose run --rm prep rm /data/dem/manual/${PRESET}_eudem.tif"
    echo ""
    echo -e "${GREEN}Or proceed to terrain generation:${NC}"
    echo "  ./scripts/build_svealand.sh --skip-osm"
    exit 0
fi

info "No existing DEM found, proceeding with acquisition..."

# Build prep service
step "Building prep service"
docker-compose build prep
ok "Prep service ready"

# MODE 1: Process existing input file
if [[ -n "$INPUT_FILE" ]]; then
    step "Processing provided input file"

    if [[ ! -f "$INPUT_FILE" ]]; then
        err "Input file not found: $INPUT_FILE"
        exit 1
    fi

    info "Input file: $INPUT_FILE"
    INPUT_DIR="$(dirname "$(realpath "$INPUT_FILE")")"
    INPUT_NAME="$(basename "$INPUT_FILE")"

    info "Reprojecting and clipping to EPSG:3857..."
    warn "This may take a while for large Svealand region..."

    docker run --rm \
        -v topo_data:/data \
        -v "${INPUT_DIR}:/input:ro" \
        osgeo/gdal:ubuntu-small-3.8.0 \
        sh -c "mkdir -p /data/dem/manual && gdalwarp -t_srs EPSG:3857 -te_srs EPSG:4326 -te 14.5 58.5 19.0 61.0 -tr 25 25 -r bilinear -co COMPRESS=LZW -co TILED=YES /input/$INPUT_NAME /data/dem/manual/${PRESET}_eudem.tif"

    if [[ $? -ne 0 ]]; then
        err "gdalwarp failed"
        exit 1
    fi

    ok "DEM processed successfully!"

    # Verify
    step "Verifying output"
    docker-compose run --rm prep gdalinfo /data/dem/manual/${PRESET}_eudem.tif | grep -E "Size|EPSG|Driver"
    ok "DEM ready at /data/dem/manual/${PRESET}_eudem.tif"

    echo ""
    echo "================================================================================"
    echo -e "                        ${GREEN}SUCCESS!${NC}"
    echo "================================================================================"
    echo ""
    echo "DEM data prepared for svealand."
    echo ""
    echo "Next step - generate terrain tiles:"
    echo "    ./scripts/build_svealand.sh --skip-osm"
    echo ""
    exit 0
fi

# MODE 2: Automated download via Copernicus API
if [[ "$MANUAL_ONLY" != "true" ]]; then
    step "Attempting automated download"

    if [[ -z "$COPERNICUS_USERNAME" || -z "$COPERNICUS_PASSWORD" ]]; then
        warn "Copernicus credentials not found"
        info "Set COPERNICUS_USERNAME and COPERNICUS_PASSWORD, or use --username/--password"
        info "Falling back to manual download instructions..."
        MANUAL_ONLY=true
    else
        info "Using credentials for: $COPERNICUS_USERNAME"

        # Run download script in Docker
        docker-compose run --rm \
            -e COPERNICUS_USERNAME="$COPERNICUS_USERNAME" \
            -e COPERNICUS_PASSWORD="$COPERNICUS_PASSWORD" \
            prep python3 /app/scripts/download_copernicus_dem.py --preset $PRESET

        if [[ $? -eq 0 ]]; then
            ok "Automated download successful!"
            echo ""
            echo "================================================================================"
            echo -e "                        ${GREEN}SUCCESS!${NC}"
            echo "================================================================================"
            echo ""
            echo "DEM data downloaded and prepared for svealand."
            echo ""
            echo "Next step - generate terrain tiles:"
            echo "    ./scripts/build_svealand.sh --skip-osm"
            echo ""
            exit 0
        else
            warn "Automated download failed, showing manual instructions..."
            MANUAL_ONLY=true
        fi
    fi
fi

# MODE 3: Manual download instructions
if [[ "$MANUAL_ONLY" == "true" ]]; then
    step "Manual Download Instructions"

    cat << 'INSTRUCTIONS'

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

After downloading, run this script again with --input:

    ./scripts/prepare_dem_svealand.sh --input /path/to/your_dem_file.tif

Or use Docker directly:

    docker run --rm -v topo_data:/data -v /your/download/dir:/input:ro \
        osgeo/gdal:ubuntu-small-3.8.0 sh -c \
        "mkdir -p /data/dem/manual && gdalwarp -t_srs EPSG:3857 \
         -te_srs EPSG:4326 -te 14.5 58.5 19.0 61.0 \
         -tr 25 25 -r bilinear -co COMPRESS=LZW -co TILED=YES \
         /input/your_dem_file.tif /data/dem/manual/svealand_eudem.tif"

STEP 3: Verify and continue
---------------------------

After processing, verify the file:

    docker-compose run --rm prep gdalinfo /data/dem/manual/svealand_eudem.tif

Then generate terrain tiles:

    ./scripts/build_svealand.sh --skip-osm

================================================================================
Target bbox (WGS84):    14.5, 58.5, 19.0, 61.0
Target file:            /data/dem/manual/svealand_eudem.tif
================================================================================

INSTRUCTIONS

    exit 1
fi

