# Svealand QA Status Check - 2025-12-27 12:00

## 1. OSM Tiles ✅
- **File**: `/data/tiles/osm/svealand.mbtiles`
- **Size**: 653 MB (653,447,168 bytes)
- **Last Modified**: 2025-12-26 18:28
- **Status**: EXISTS

## 2. Terrain Data ❌
- **DEM**: NOT FOUND
- **Hillshade raster**: NOT FOUND
- **Hillshade tiles**: NOT FOUND
- **Contour GeoJSON**: NOT FOUND
- **Contour mbtiles**: NOT FOUND

## 3. Tile Health Check Results
- **Total tiles tested**: 90 (18 per source × 5 sources)
- **Success**: 0
- **Failed**: 90
- **All sources returning 404**

### Sources tested:
- `osm_svealand`: 0/18 OK
- `contours_svealand_2m`: 0/18 OK
- `contours_svealand_10m`: 0/18 OK
- `contours_svealand_50m`: 0/18 OK
- `hillshade`: 0/18 OK

## Next Steps
1. Generate terrain data (DEM → hillshade → contours)
2. Re-run tile health check
3. Verify Martin catalog shows svealand sources

