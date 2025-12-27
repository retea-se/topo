#!/bin/bash
# Generate XYZ PNG tiles from hillshade GeoTIFF
set -e

PRESET="${1:-stockholm_core}"
DATA_DIR="${DATA_DIR:-/data}"
HILLSHADE="${DATA_DIR}/terrain/hillshade/${PRESET}_hillshade.tif"
OUTPUT_DIR="${DATA_DIR}/tiles/hillshade/${PRESET}"

if [ ! -f "${HILLSHADE}" ]; then
    echo "ERROR: Hillshade file not found: ${HILLSHADE}" >&2
    exit 1
fi

echo "Generating XYZ tiles from ${HILLSHADE}"

mkdir -p "${OUTPUT_DIR}"

gdal2tiles.py \
  --zoom=10-16 \
  --profile=mercator \
  --webviewer=none \
  --resampling=near \
  "${HILLSHADE}" \
  "${OUTPUT_DIR}"

echo "Hillshade tiles generated: ${OUTPUT_DIR}"







