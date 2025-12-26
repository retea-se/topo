#!/bin/bash
# Build all data for full Stockholm coverage (core + wide)
#
# Usage: ./scripts/build_full_coverage.sh [--force] [--skip-osm] [--skip-terrain] [--dry-run]
#
# This is the main entry point for building all map data.
# It runs build_stockholm_wide.sh which handles terrain generation.
#
# Requires:
# - Docker running
# - DEM files placed in /data/dem/manual/ (see DEM_MANUAL_DOWNLOAD.md)

set -e

# Parse arguments (pass through to build_stockholm_wide.sh)
ARGS="$@"

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
GRAY='\033[0;90m'
NC='\033[0m'

echo -e "
${CYAN}================================================================================
                    BUILD FULL COVERAGE
================================================================================${NC}

This script builds all data for complete Stockholm map coverage.

Presets to build:
  - stockholm_core (central Stockholm)
  - stockholm_wide (greater Stockholm including suburbs)

Layers:
  - OSM (roads, buildings, water, parks)
  - Hillshade (terrain shading from DEM)
  - Contours (2m, 10m, 50m elevation lines)
"

# Change to project root
cd "$(dirname "$0")/.."

# Check stockholm_core data
echo -e "\n${YELLOW}=== Checking stockholm_core ===${NC}"
echo -e "${GRAY}[INFO]${NC} stockholm_core data check..."

if docker-compose run --rm prep ls -la /data/tiles/osm/stockholm_core.mbtiles >/dev/null 2>&1; then
    echo -e "${GREEN}[OK]${NC} stockholm_core OSM tiles exist"
else
    echo -e "${YELLOW}[WARN]${NC} stockholm_core OSM tiles missing - run prep manually"
fi

# Build stockholm_wide
echo -e "\n${YELLOW}=== Building stockholm_wide ===${NC}"

if [ -f "./scripts/build_stockholm_wide.sh" ]; then
    ./scripts/build_stockholm_wide.sh $ARGS
else
    echo -e "${RED}[ERROR]${NC} build_stockholm_wide.sh not found"
    exit 1
fi

echo -e "
${GREEN}================================================================================
                    BUILD COMPLETE
================================================================================${NC}

Next steps:

  1. Restart services to pick up new tiles:
     docker-compose --profile demoA --profile demoB down
     docker-compose --profile demoA --profile demoB up -d

  2. Open Demo A with Stockholm Wide:
     http://localhost:3000?bbox_preset=stockholm_wide

  3. Open Demo B with Stockholm Wide:
     http://localhost:3001
"
