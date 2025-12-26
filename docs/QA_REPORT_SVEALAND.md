# QA Report: Svealand Terrain Coverage

**Date:** 2025-12-26  
**Preset:** `svealand`  
**Bbox:** 14.5, 58.5, 19.0, 61.0 (WGS84)

## Status: IN PROGRESS

### ✅ Completed

1. **GLO30Provider Implementation**
   - Added `GLO30Provider` class to `prep-service/src/dem_provider.py`
   - Integrated Copernicus Data Space Ecosystem (CDSE) API
   - Support for downloading, merging, and reprojecting GLO-30 tiles
   - Updated `download_dem.py` to support `--provider glo30`

2. **Documentation**
   - Created `docs/SVEALAND_DEM_REQUIREMENTS.md` with DEM specifications
   - Created `scripts/download_dem_svealand.ps1` for automated download
   - Updated `demo-a/tileserver/martin.yaml` to include svealand contour sources

### ⏳ Pending (Requires DEM Download)

**Prerequisite:** DEM file must be downloaded first using Copernicus credentials.

#### Step 1: DEM Download
- **Command:** `docker-compose run --rm prep python3 /app/src/download_dem.py --preset svealand --provider glo30`
- **Requires:** `COPERNICUS_USERNAME` and `COPERNICUS_PASSWORD` environment variables
- **Output:** `/data/dem/manual/svealand_eudem.tif` (EPSG:3857, ~1-3 GB compressed)
- **Status:** ⏳ Waiting for credentials

#### Step 2: Hillshade Generation
- **Command:** `docker-compose run --rm prep python3 /app/src/generate_hillshade.py --preset svealand`
- **Output:** `/data/terrain/hillshade/svealand_hillshade.tif`
- **Status:** ⏳ Waiting for DEM

#### Step 3: Hillshade Tiles
- **Command:** `docker-compose run --rm prep sh -c "gdal2tiles.py --zoom=9-14 --profile=mercator --webviewer=none --resampling=near /data/terrain/hillshade/svealand_hillshade.tif /data/tiles/hillshade/svealand"`
- **Output:** `/data/tiles/hillshade/svealand/{z}/{x}/{y}.png`
- **Zoom levels:** 9-14 (limited for large area)
- **Status:** ⏳ Waiting for hillshade

#### Step 4: Contour Extraction
- **Command:** `docker-compose run --rm prep python3 /app/src/extract_contours.py --preset svealand`
- **Output:** 
  - `/data/terrain/contours/svealand_2m.geojson`
  - `/data/terrain/contours/svealand_10m.geojson`
  - `/data/terrain/contours/svealand_50m.geojson`
- **Status:** ⏳ Waiting for DEM

#### Step 5: Contour Tiles
- **Command:** See `prep-service/scripts/generate_contour_tiles.sh` (modified for svealand zoom levels)
- **Output:**
  - `/data/tiles/contours/svealand_2m.mbtiles`
  - `/data/tiles/contours/svealand_10m.mbtiles`
  - `/data/tiles/contours/svealand_50m.mbtiles`
- **Zoom levels:** 8-13 (limited for large area)
- **Status:** ⏳ Waiting for contours

### 🔍 QA Verification (To Be Completed)

#### Tile Health Check
- [ ] Verify at least 12 tiles per layer (hillshade, contours 2m/10m/50m)
- [ ] Check no 404 errors for tile requests
- [ ] Verify tile coverage matches bbox

#### Visual Verification
- [ ] Screenshot: All layers ON (hillshade + contours + OSM)
- [ ] Screenshot: Hillshade OFF (contours + OSM only)
- [ ] Screenshot: Contours OFF (hillshade + OSM only)
- [ ] Verify terrain renders correctly in Demo A

#### File Verification
- [ ] DEM file exists and has correct CRS (EPSG:3857)
- [ ] Hillshade file exists and is valid GeoTIFF
- [ ] Contour GeoJSON files exist (2m, 10m, 50m)
- [ ] Contour MBTiles files exist (2m, 10m, 50m)
- [ ] Hillshade tiles directory exists with tiles

## Expected File Sizes

Based on Svealand bbox (approximately 4.5° x 2.5°):

| File | Estimated Size | Notes |
|------|----------------|-------|
| `svealand_eudem.tif` | 1-3 GB | Compressed (LZW) |
| `svealand_hillshade.tif` | 500 MB - 1 GB | Compressed (LZW) |
| `svealand_2m.geojson` | 500 MB - 2 GB | Large due to 2m interval |
| `svealand_10m.geojson` | 100-500 MB | Moderate size |
| `svealand_50m.geojson` | 10-50 MB | Smallest |
| `svealand_2m.mbtiles` | 200-800 MB | Vector tiles |
| `svealand_10m.mbtiles` | 50-200 MB | Vector tiles |
| `svealand_50m.mbtiles` | 5-20 MB | Vector tiles |
| Hillshade tiles (z9-14) | 500 MB - 2 GB | Total directory size |

## Build Time Estimates

| Step | Estimated Time | Notes |
|------|----------------|-------|
| DEM Download | 10-30 min | Depends on network speed |
| Hillshade Generation | 5-15 min | Depends on DEM size |
| Hillshade Tiles | 30-60 min | Limited zoom (z9-14) |
| Contour Extraction | 10-30 min | 2m interval is slowest |
| Contour Tiles | 20-40 min | Limited zoom (z8-13) |
| **Total** | **1.5-3 hours** | Excluding DEM download |

## Next Steps

1. **Set Copernicus credentials:**
   ```powershell
   $env:COPERNICUS_USERNAME = "your-email@example.com"
   $env:COPERNICUS_PASSWORD = "your-password"
   ```

2. **Download DEM:**
   ```powershell
   .\scripts\download_dem_svealand.ps1
   ```

3. **Generate terrain (use build script):**
   ```powershell
   .\scripts\build_svealand.ps1 -SkipOsm
   ```

4. **Run QA verification:**
   - Tile health check
   - Visual verification in Demo A
   - Update this report with results

## Notes

- Svealand is a large region, so zoom levels are limited to reduce data size
- Hillshade: z9-14 (instead of z10-16)
- Contours: z8-13 (instead of z10-16)
- Martin tileserver configuration updated to include svealand contour sources
- Frontend (themeToStyle.js) already supports svealand preset
