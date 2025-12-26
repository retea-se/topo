# Terrain Data Missing Report - Svealand

## Problem
Terrain data (DEM, hillshade, contours) saknas för svealand preset.

## Verifiering
- ✅ OSM tiles: EXISTS (653 MB, created 2025-12-26 18:28)
- ❌ DEM: NOT FOUND
  - Checked: `/data/dem/svealand_eudem.tif`
  - Checked: `/data/dem/manual/svealand_eudem.tif`
- ❌ Hillshade raster: NOT FOUND
- ❌ Hillshade tiles: NOT FOUND
- ❌ Contour GeoJSON: NOT FOUND
- ❌ Contour mbtiles: NOT FOUND

## Root Cause
DEM file is required to generate terrain data. The DEM file for svealand has not been downloaded/placed.

## Solution Options

### Option 1: Automated Download (if Copernicus credentials available)
```bash
export COPERNICUS_USERNAME="your-email@example.com"
export COPERNICUS_PASSWORD="your-password"
./scripts/prepare_dem_svealand.sh
```

### Option 2: Manual Download + Processing
1. Download Copernicus DEM GLO-30 tiles covering Svealand region (bbox: 14.5, 58.5, 19.0, 61.0)
2. Process with:
```bash
./scripts/prepare_dem_svealand.sh --input /path/to/downloaded/dem.tif
```

### Option 3: Generate Terrain After DEM is Available
Once DEM is in place:
```bash
./scripts/build_svealand.sh --skip-osm
```

## Impact
- Demo A: OSM layers work, but no hillshade/contours
- Demo B: OSM layers work, but no hillshade/contours
- Tile health check: 0/90 tiles OK (all terrain sources fail)

## Next Steps
1. Download DEM for svealand (via Copernicus Data Space or manual)
2. Place DEM at `/data/dem/manual/svealand_eudem.tif`
3. Run `./scripts/build_svealand.sh --skip-osm` to generate terrain
4. Re-run tile health check
5. Continue with frontend QA

