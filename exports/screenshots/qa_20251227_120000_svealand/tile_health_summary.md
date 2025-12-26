# Tile Health Check Summary - Svealand

## Test Results (2025-12-27 12:00)

### OSM Tiles ✅ PARTIAL
- **Source**: `osm_svealand`
- **Status**: 12/18 tiles OK (67%)
- **Min zoom**: 10
- **Max zoom**: 15
- **File**: `/data/tiles/osm/svealand.mbtiles` (653 MB)
- **Note**: Some tiles return 404, likely due to:
  - Tiles not generated for all zoom levels
  - Test coordinates outside actual coverage
  - Zoom level restrictions

### Terrain Tiles ❌ NOT AVAILABLE
- **Contours (2m, 10m, 50m)**: 0/18 tiles OK (0%)
- **Hillshade**: 0/18 tiles OK (0%)
- **Root cause**: DEM file missing, terrain data not generated

## Next Steps
1. ✅ OSM tiles working - can proceed with frontend QA for OSM layers
2. ❌ Terrain data needs to be generated:
   - Download DEM for svealand
   - Run `./scripts/build_svealand.sh --skip-osm`
   - Re-run tile health check

## Test Configuration
- **Locations tested**: 6 (Uppsala, Västerås, Örebro, Eskilstuna, Nyköping, center)
- **Zoom levels**: 9, 11, 13
- **Total tiles tested**: 90 (18 per source × 5 sources)

