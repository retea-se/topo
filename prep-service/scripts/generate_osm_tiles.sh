#!/bin/bash
# Generate OSM vector tiles using Planetiler
set -e

PRESET="${1:-stockholm_core}"
DATA_DIR="${DATA_DIR:-/data}"
OSM_PBF="${DATA_DIR}/osm/${PRESET}.osm.pbf"
OUTPUT="${DATA_DIR}/tiles/osm/${PRESET}.mbtiles"
CONFIG_DIR="/app/config"

if [ ! -f "${OSM_PBF}" ]; then
    echo "ERROR: OSM PBF file not found: ${OSM_PBF}" >&2
    exit 1
fi

echo "Generating OSM vector tiles from ${OSM_PBF}"

mkdir -p "$(dirname "${OUTPUT}")"

# Note: We don't use --bounds here because:
# 1. OSM data is already clipped with --strategy=complete_ways (includes complete ways even if they cross bbox)
# 2. We want Planetiler to generate tiles for all features in the OSM file, including parts that extend beyond the original bbox
# 3. This ensures roads, buildings, and water features render completely across the entire map

java -Xmx2g -jar /app/bin/planetiler.jar \
  --osm-path="${OSM_PBF}" \
  --output="${OUTPUT}" \
  --minzoom=10 \
  --maxzoom=15 \
  --download \
  --nodemap-type=sparsearray \
  --nodemap-storage=mmap \
  --threads=2 \
  --force

echo "OSM tiles generated: ${OUTPUT}"

