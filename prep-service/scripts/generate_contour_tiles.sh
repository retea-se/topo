#!/bin/bash
# Generate contour vector tiles using Tippecanoe
set -e

PRESET="${1:-stockholm_core}"
DATA_DIR="${DATA_DIR:-/data}"
CONTOURS_DIR="${DATA_DIR}/terrain/contours"
OUTPUT_DIR="${DATA_DIR}/tiles/contours"

mkdir -p "${OUTPUT_DIR}"

for INTERVAL in 2 10 50; do
    INPUT="${CONTOURS_DIR}/${PRESET}_${INTERVAL}m.geojson"
    OUTPUT="${OUTPUT_DIR}/${PRESET}_${INTERVAL}m.mbtiles"

    if [ ! -f "${INPUT}" ]; then
        echo "WARNING: Contour file not found: ${INPUT}" >&2
        continue
    fi

    echo "Generating tiles for ${INTERVAL}m contours..."

    tippecanoe \
      --layer=contours \
      --minimum-zoom=10 \
      --maximum-zoom=16 \
      --simplification=10 \
      --output="${OUTPUT}" \
      "${INPUT}"

    echo "  Contour tiles generated: ${OUTPUT}"
done

echo "Contour tile generation complete"



