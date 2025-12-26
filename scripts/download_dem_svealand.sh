#!/bin/sh
# Download Copernicus DEM GLO-30 tiles for Svealand
# Bbox: 14.5, 58.5, 19.0, 61.0 (WGS84)

set -e

# Create download directory
mkdir -p /data/dem/downloads
cd /data/dem/downloads

echo "=== Downloading Copernicus DEM GLO-30 tiles for Svealand ==="
echo "Target region: N58-N60, E014-E018"
echo ""

BASE_URL="https://copernicus-dem-30m.s3.amazonaws.com"

# Download tiles
download_tile() {
    LAT=$1
    LON=$2
    TILE="Copernicus_DSM_COG_10_${LAT}_00_${LON}_00_DEM"
    URL="${BASE_URL}/${TILE}/${TILE}.tif"

    if [ -f "${TILE}.tif" ]; then
        echo "[SKIP] ${TILE}.tif exists"
    else
        echo "[GET]  ${TILE}.tif ..."
        if wget -q -O "${TILE}.tif" "$URL"; then
            echo "[OK]   ${TILE}.tif downloaded"
        else
            echo "[WARN] ${TILE}.tif not available (ocean?)"
            rm -f "${TILE}.tif"
        fi
    fi
}

# Svealand coverage: N58-N60 x E014-E018
download_tile N58 E014
download_tile N58 E015
download_tile N58 E016
download_tile N58 E017
download_tile N58 E018

download_tile N59 E014
download_tile N59 E015
download_tile N59 E016
download_tile N59 E017
download_tile N59 E018

download_tile N60 E014
download_tile N60 E015
download_tile N60 E016
download_tile N60 E017
download_tile N60 E018

echo ""
echo "=== Download Summary ==="
ls -lh /data/dem/downloads/*.tif 2>/dev/null || echo "No tiles found"
echo ""
echo "Total tiles:"
ls /data/dem/downloads/*.tif 2>/dev/null | wc -l || echo "0"
