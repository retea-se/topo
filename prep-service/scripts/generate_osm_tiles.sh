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

# Extract bbox from preset config file
BBOX=$(python3 <<EOF
import json
import sys
with open('${CONFIG_DIR}/bbox_presets.json') as f:
    presets = json.load(f)
    for preset in presets['presets']:
        if preset['name'] == '${PRESET}':
            bbox = preset['bbox_wgs84']
            print(f"{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]}")
            sys.exit(0)
print("ERROR: Preset not found", file=sys.stderr)
sys.exit(1)
EOF
)

java -Xmx2g -jar /app/bin/planetiler.jar \
  --osm-path="${OSM_PBF}" \
  --output="${OUTPUT}" \
  --minzoom=10 \
  --maxzoom=15 \
  --bounds="${BBOX}" \
  --download \
  --nodemap-type=sparsearray \
  --nodemap-storage=mmap \
  --threads=2 \
  --force

echo "OSM tiles generated: ${OUTPUT}"

