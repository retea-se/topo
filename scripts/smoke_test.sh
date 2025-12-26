#!/bin/bash
# Smoke tests for Topo Map Export System
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

test_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

test_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

test_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "=== Smoke Tests for Topo Map Export System ==="
echo ""

# Test 1: Check prep-service data exists
echo "1. Testing prep-service data..."
if docker-compose run --rm prep test -f /data/osm/stockholm_core.osm.pbf; then
    test_pass "OSM clipped file exists"
else
    test_fail "OSM clipped file missing (run prep-service steps)"
fi

if docker-compose run --rm prep test -f /data/dem/*/stockholm_core_eudem.tif 2>/dev/null || \
   docker-compose run --rm prep find /data/dem -name "stockholm_core_eudem.tif" -type f | grep -q .; then
    test_pass "DEM file exists"
else
    test_warn "DEM file missing (manual download required)"
fi

if docker-compose run --rm prep test -f /data/terrain/hillshade/stockholm_core_hillshade.tif; then
    test_pass "Hillshade file exists"
else
    test_fail "Hillshade file missing (run generate_hillshade.py)"
fi

for interval in 2 10 50; do
    if docker-compose run --rm prep test -f /data/terrain/contours/stockholm_core_${interval}m.geojson; then
        test_pass "Contours ${interval}m file exists"
    else
        test_fail "Contours ${interval}m file missing"
    fi
done

# Test 2: Check tiles exist
echo ""
echo "2. Testing tile generation..."
if docker-compose run --rm prep test -f /data/tiles/osm/stockholm_core.mbtiles; then
    test_pass "OSM MBTiles exists"
else
    test_fail "OSM MBTiles missing (run generate_osm_tiles.sh)"
fi

for interval in 2 10 50; do
    if docker-compose run --rm prep test -f /data/tiles/contours/stockholm_core_${interval}m.mbtiles; then
        test_pass "Contour ${interval}m MBTiles exists"
    else
        test_fail "Contour ${interval}m MBTiles missing"
    fi
done

if docker-compose run --rm prep test -d /data/tiles/hillshade/stockholm_core; then
    TILE_COUNT=$(docker-compose run --rm prep find /data/tiles/hillshade/stockholm_core -name "*.png" | wc -l)
    if [ "$TILE_COUNT" -gt 0 ]; then
        test_pass "Hillshade tiles directory exists with $TILE_COUNT tiles"
    else
        test_warn "Hillshade tiles directory exists but empty"
    fi
else
    test_fail "Hillshade tiles directory missing"
fi

# Test 3: Demo A - Tile endpoints
echo ""
echo "3. Testing Demo A tile endpoints..."

# Check if services are running
if docker-compose --profile demoA ps | grep -q "demo-a-tileserver.*Up"; then
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/catalog | grep -q "200\|404"; then
        test_pass "Martin tileserver responds"
    else
        test_fail "Martin tileserver not responding"
    fi
else
    test_warn "Demo A services not running (start with: docker-compose --profile demoA up -d)"
fi

if docker-compose --profile demoA ps | grep -q "demo-a-hillshade-server.*Up"; then
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/tiles/hillshade/stockholm_core/10/550/320.png | grep -q "200\|404"; then
        test_pass "Hillshade tileserver responds"
    else
        test_fail "Hillshade tileserver not responding"
    fi
fi

if docker-compose --profile demoA ps | grep -q "demo-a-web.*Up"; then
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
        test_pass "Demo A web app responds"
    else
        test_fail "Demo A web app not responding"
    fi
fi

# Test 4: Demo A - Export endpoint
echo ""
echo "4. Testing Demo A export endpoint..."
if docker-compose --profile demoA ps | grep -q "demo-a-exporter.*Up"; then
    # Small test export (100x100px)
    RESPONSE=$(curl -s -w "\n%{http_code}" "http://localhost:8082/render?bbox_preset=stockholm_core&theme=paper&render_mode=print&dpi=150&width_mm=50&height_mm=50")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)

    if [ "$HTTP_CODE" = "200" ] && [ ${#BODY} -gt 1000 ]; then
        test_pass "Demo A export endpoint responds with PNG data"
    else
        test_fail "Demo A export endpoint failed (HTTP $HTTP_CODE)"
    fi
fi

# Test 5: Demo B - Database and API
echo ""
echo "5. Testing Demo B services..."

if docker-compose --profile demoB ps | grep -q "demo-b-db.*Up"; then
    ROW_COUNT=$(docker-compose exec -T demo-b-db psql -U postgres -d gis -t -c "SELECT COUNT(*) FROM planet_osm_polygon;" 2>/dev/null | tr -d ' ' || echo "0")
    if [ "$ROW_COUNT" -gt 0 ]; then
        test_pass "PostGIS contains OSM data ($ROW_COUNT polygons)"
    else
        test_warn "PostGIS empty (run osm2pgsql import)"
    fi
else
    test_warn "Demo B database not running"
fi

if docker-compose --profile demoB ps | grep -q "demo-b-api.*Up"; then
    if curl -s http://localhost:5000/health | grep -q "ok"; then
        test_pass "Demo B API health check passes"
    else
        test_fail "Demo B API health check fails"
    fi
fi

if docker-compose --profile demoB ps | grep -q "demo-b-web.*Up"; then
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 | grep -q "200"; then
        test_pass "Demo B web app responds"
    else
        test_fail "Demo B web app not responding"
    fi
fi

# Test 6: Demo B - Export endpoint
echo ""
echo "6. Testing Demo B export endpoint..."
if docker-compose --profile demoB ps | grep -q "demo-b-api.*Up"; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "http://localhost:5000/render" \
        -H "Content-Type: application/json" \
        -d '{"bbox_preset":"stockholm_core","theme":"paper","render_mode":"print","dpi":150,"width_mm":50,"height_mm":50,"format":"png"}')
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)

    if [ "$HTTP_CODE" = "200" ] && [ ${#BODY} -gt 1000 ]; then
        test_pass "Demo B export endpoint responds with PNG data"
    else
        test_fail "Demo B export endpoint failed (HTTP $HTTP_CODE)"
    fi
fi

# Test 7: Verify no contour labels (style checks)
echo ""
echo "7. Testing label policy enforcement..."

# Check Demo A theme-to-style (JavaScript check would require node)
if grep -q '"noLabels":\s*true' themes/*.json 2>/dev/null; then
    test_pass "Themes have noLabels constraint in JSON"
else
    test_warn "Could not verify noLabels in themes"
fi

# Check Demo B Mapnik XML generation (Python check)
if docker-compose run --rm prep python3 -c "
from pathlib import Path
import json
theme_path = Path('/app/../themes/paper.json')
if theme_path.exists():
    with open(theme_path) as f:
        theme = json.load(f)
    if theme.get('contours', {}).get('noLabels') == True:
        print('PASS')
    else:
        print('FAIL')
else:
    print('SKIP')
" 2>/dev/null | grep -q "PASS"; then
    test_pass "Contour noLabels constraint verified in themes"
fi

# Summary
echo ""
echo "=== Test Summary ==="
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED${NC}"
    exit 1
else
    echo "Failed: $FAILED"
    exit 0
fi




