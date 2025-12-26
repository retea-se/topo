#!/bin/bash
# Diagnose common failures in the system
set -e

echo "=== Common Failures Diagnostic ==="
echo ""

# Check 1: Fonts missing
echo "1. Checking fonts..."
if docker-compose run --rm prep test -f /usr/share/fonts/truetype/dejavu/DejaVuSans.ttf 2>/dev/null || \
   docker-compose exec demo-b-renderer test -f /usr/share/fonts/truetype/dejavu/DejaVuSans.ttf 2>/dev/null; then
    echo "✓ DejaVu fonts found"
else
    echo "✗ DejaVu fonts missing - may cause Mapnik rendering issues"
    echo "  Fix: Ensure fonts-dejavu package is installed in renderer Dockerfile"
fi

# Check 2: Blank tiles / tile server issues
echo ""
echo "2. Checking tile servers..."
if docker-compose --profile demoA ps | grep -q "demo-a-tileserver.*Up"; then
    TILE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/catalog 2>/dev/null || echo "000")
    if [ "$TILE_RESPONSE" != "200" ] && [ "$TILE_RESPONSE" != "404" ]; then
        echo "✗ Martin tileserver not responding (HTTP $TILE_RESPONSE)"
        echo "  Check: docker-compose logs demo-a-tileserver"
        echo "  Fix: Verify MBTiles files exist and Martin config is correct"
    else
        echo "✓ Martin tileserver responding"
    fi
fi

# Check 3: Wrong bbox CRS
echo ""
echo "3. Checking CRS/projection..."
if docker-compose run --rm prep gdalinfo /data/terrain/hillshade/stockholm_core_hillshade.tif 2>/dev/null | grep -q "3857\|Pseudo-Mercator"; then
    echo "✓ Hillshade is in EPSG:3857"
else
    CRS=$(docker-compose run --rm prep gdalinfo /data/terrain/hillshade/stockholm_core_hillshade.tif 2>/dev/null | grep -i "PROJCS\|EPSG" | head -1 || echo "unknown")
    echo "✗ Hillshade CRS mismatch: $CRS"
    echo "  Expected: EPSG:3857 (Web Mercator)"
    echo "  Fix: Regenerate hillshade from DEM that's already in EPSG:3857"
fi

# Check 4: Clipped OSM too small
echo ""
echo "4. Checking OSM clip size..."
if docker-compose run --rm prep test -f /data/osm/stockholm_core.osm.pbf; then
    OSM_SIZE=$(docker-compose run --rm prep stat -f%z /data/osm/stockholm_core.osm.pbf 2>/dev/null || \
               docker-compose run --rm prep stat -c%s /data/osm/stockholm_core.osm.pbf 2>/dev/null)
    OSM_SIZE_MB=$((OSM_SIZE / 1024 / 1024))
    if [ "$OSM_SIZE_MB" -lt 10 ]; then
        echo "⚠ OSM clip seems small ($OSM_SIZE_MB MB) - may be missing data"
        echo "  Expected: 50-100 MB for stockholm_core"
        echo "  Fix: Verify bbox preset coordinates are correct"
    else
        echo "✓ OSM clip size reasonable ($OSM_SIZE_MB MB)"
    fi
fi

# Check 5: Mapnik datasource errors
echo ""
echo "5. Checking PostGIS connection (Demo B)..."
if docker-compose --profile demoB ps | grep -q "demo-b-db.*Up"; then
    if docker-compose exec -T demo-b-db psql -U postgres -d gis -c "SELECT 1;" >/dev/null 2>&1; then
        echo "✓ PostGIS connection works"

        # Check if tables exist
        TABLE_COUNT=$(docker-compose exec -T demo-b-db psql -U postgres -d gis -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'planet_osm%';" 2>/dev/null | tr -d ' ' || echo "0")
        if [ "$TABLE_COUNT" -gt 0 ]; then
            echo "✓ OSM tables exist ($TABLE_COUNT tables)"
        else
            echo "✗ OSM tables missing - run osm2pgsql import"
        fi
    else
        echo "✗ PostGIS connection failed"
        echo "  Check: docker-compose logs demo-b-db"
    fi
fi

# Check 6: Hillshade file exists and readable
echo ""
echo "6. Checking terrain data..."
if docker-compose run --rm prep test -f /data/terrain/hillshade/stockholm_core_hillshade.tif; then
    if docker-compose run --rm prep gdalinfo /data/terrain/hillshade/stockholm_core_hillshade.tif >/dev/null 2>&1; then
        echo "✓ Hillshade file is readable"
    else
        echo "✗ Hillshade file corrupted or unreadable"
        echo "  Fix: Regenerate hillshade from DEM"
    fi
else
    echo "✗ Hillshade file missing"
fi

# Check 7: Tile files integrity
echo ""
echo "7. Checking tile file integrity..."
if docker-compose run --rm prep test -f /data/tiles/osm/stockholm_core.mbtiles; then
    if command -v sqlite3 >/dev/null 2>&1 || docker-compose run --rm prep which sqlite3 >/dev/null 2>&1; then
        TILE_COUNT=$(docker-compose run --rm prep sqlite3 /data/tiles/osm/stockholm_core.mbtiles "SELECT COUNT(*) FROM tiles;" 2>/dev/null || echo "0")
        if [ "$TILE_COUNT" -gt 0 ]; then
            echo "✓ OSM MBTiles contains $TILE_COUNT tiles"
        else
            echo "✗ OSM MBTiles is empty"
            echo "  Fix: Regenerate tiles with generate_osm_tiles.sh"
        fi
    else
        echo "⚠ Cannot verify MBTiles (sqlite3 not available)"
    fi
fi

# Check 8: Memory/disk space
echo ""
echo "8. Checking system resources..."
DISK_AVAIL=$(df -h . 2>/dev/null | tail -1 | awk '{print $4}' || echo "unknown")
echo "Disk space available: $DISK_AVAIL"

# Check Docker memory limit (if set)
if [ -f /sys/fs/cgroup/memory/memory.limit_in_bytes ]; then
    MEM_LIMIT=$(cat /sys/fs/cgroup/memory/memory.limit_in_bytes)
    MEM_LIMIT_GB=$((MEM_LIMIT / 1024 / 1024 / 1024))
    echo "Docker memory limit: ${MEM_LIMIT_GB}GB"
fi

echo ""
echo "=== Diagnostic Complete ==="



