# Svealand DEM Requirements

## Preset Information

- **Preset name:** `svealand`
- **Bbox (WGS84):** 14.5, 58.5, 19.0, 61.0
- **Description:** Svealand region: includes Västerås, Uppsala, Örebro, Eskilstuna, Nyköping and surrounding areas

## DEM Source: Copernicus GLO-30

**Product:** COP-DEM_GLO-30-DGED__2022_1
**Resolution:** 30m
**Coverage:** Global
**CRS (native):** EPSG:4326 (WGS84)
**CRS (target):** EPSG:3857 (Web Mercator)

## Required Tiles

Svealand bbox (14.5°E, 58.5°N, 19.0°E, 61.0°N) covers multiple GLO-30 tiles.

**Expected tiles:** Multiple tiles covering Sweden central region. The automated download will:
1. Query Copernicus Data Space Ecosystem (CDSE) catalog
2. Find all tiles intersecting the bbox
3. Download and merge tiles
4. Reproject to EPSG:3857
5. Clip to exact bbox

## Output File

**Location:** `/data/dem/manual/svealand_eudem.tif`
**Format:** GeoTIFF
**CRS:** EPSG:3857
**Resolution:** 30m (target)

## Download Command

```bash
# With credentials set
export COPERNICUS_USERNAME="your-email@example.com"
export COPERNICUS_PASSWORD="your-password"

# Download
docker-compose run --rm \
  -e COPERNICUS_USERNAME=$COPERNICUS_USERNAME \
  -e COPERNICUS_PASSWORD=$COPERNICUS_PASSWORD \
  prep \
  python3 /app/src/download_dem.py --preset svealand --provider glo30
```

Or use the PowerShell script:
```powershell
$env:COPERNICUS_USERNAME = "your-email@example.com"
$env:COPERNICUS_PASSWORD = "your-password"
.\scripts\download_dem_svealand.ps1
```

## Verification

After download, verify the file:

```bash
docker-compose run --rm prep gdalinfo /data/dem/manual/svealand_eudem.tif
```

Expected output should show:
- Driver: GTiff/GeoTIFF
- CRS: EPSG:3857 or "PROJCS["WGS 84 / Pseudo-Mercator"
- Size: Large (depends on bbox, expect several GB for uncompressed)

## File Size Estimate

For Svealand bbox (approximately 4.5° x 2.5°):
- **Uncompressed:** ~5-10 GB (depends on compression)
- **Compressed (LZW):** ~1-3 GB

## Next Steps

After DEM is downloaded:
1. Generate hillshade: `python3 /app/src/generate_hillshade.py --preset svealand`
2. Extract contours: `python3 /app/src/extract_contours.py --preset svealand`
3. Generate tiles (see build scripts)



