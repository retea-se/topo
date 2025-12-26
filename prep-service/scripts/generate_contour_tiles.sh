#!/bin/bash
# Generate contour vector tiles using Tippecanoe
# Input GeoJSON may be in EPSG:3857 - tippecanoe requires EPSG:4326
set -e

PRESET="${1:-stockholm_core}"
DATA_DIR="${DATA_DIR:-/data}"
CONTOURS_DIR="${DATA_DIR}/terrain/contours"
OUTPUT_DIR="${DATA_DIR}/tiles/contours"
TEMP_DIR="${DATA_DIR}/terrain/contours/temp"

mkdir -p "${OUTPUT_DIR}"
mkdir -p "${TEMP_DIR}"

for INTERVAL in 2 10 50; do
    INPUT="${CONTOURS_DIR}/${PRESET}_${INTERVAL}m.geojson"
    OUTPUT="${OUTPUT_DIR}/${PRESET}_${INTERVAL}m.mbtiles"
    TEMP_4326="${TEMP_DIR}/${PRESET}_${INTERVAL}m_4326.geojson"

    if [ ! -f "${INPUT}" ]; then
        echo "WARNING: Contour file not found: ${INPUT}" >&2
        continue
    fi

    echo "Generating tiles for ${INTERVAL}m contours..."

    # Reproject from EPSG:3857 to EPSG:4326 for tippecanoe
    echo "  Reprojecting to EPSG:4326..."
    ogr2ogr -f GeoJSON -t_srs EPSG:4326 -s_srs EPSG:3857 "${TEMP_4326}" "${INPUT}"

    echo "  Running tippecanoe..."
    tippecanoe \
      --layer=contours \
      --minimum-zoom=10 \
      --maximum-zoom=16 \
      --simplification=10 \
      --force \
      --output="${OUTPUT}" \
      "${TEMP_4326}"

    # Cleanup temp file
    rm -f "${TEMP_4326}"

    echo "  Contour tiles generated: ${OUTPUT}"
done

# Cleanup temp directory
rmdir "${TEMP_DIR}" 2>/dev/null || true

echo "Contour tile generation complete"

