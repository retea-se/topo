#!/bin/bash
# Import OSM data into PostGIS using osm2pgsql
set -e

PRESET="${1:-stockholm_core}"
DATA_DIR="${DATA_DIR:-/data}"
OSM_PBF="${DATA_DIR}/osm/${PRESET}.osm.pbf"
POSTGRES_HOST="${POSTGRES_HOST:-demo-b-db}"
POSTGRES_DB="${POSTGRES_DB:-gis}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"

if [ ! -f "${OSM_PBF}" ]; then
    echo "ERROR: OSM PBF file not found: ${OSM_PBF}" >&2
    exit 1
fi

echo "Importing OSM data from ${OSM_PBF}"

# Wait for PostgreSQL to be ready
until PGPASSWORD=${POSTGRES_PASSWORD} psql -h "${POSTGRES_HOST}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c '\q' 2>/dev/null; do
    echo "Waiting for PostgreSQL..."
    sleep 1
done

osm2pgsql \
  --create \
  --slim \
  --hstore \
  --database "${POSTGRES_DB}" \
  --username "${POSTGRES_USER}" \
  --host "${POSTGRES_HOST}" \
  "${OSM_PBF}"

echo "OSM import complete"

