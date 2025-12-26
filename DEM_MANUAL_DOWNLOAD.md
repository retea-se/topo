# EU-DEM Terrain Data Acquisition

## Overview

This document describes how to obtain and prepare EU-DEM (European Digital Elevation Model) terrain data for use with the topo project. The DEM is required for:
- Hillshade generation (terrain shading)
- Contour extraction (elevation lines)
- Both Demo A (MapLibre) and Demo B (Mapnik) pipelines

## Quick Start

### Option A: Automated Download (Recommended)

If you have Copernicus Data Space credentials:

```powershell
# Windows (PowerShell)
$env:COPERNICUS_USERNAME = "your-email@example.com"
$env:COPERNICUS_PASSWORD = "your-password"
.\scripts\prepare_dem_stockholm_wide.ps1
```

```bash
# Linux/Mac
export COPERNICUS_USERNAME="your-email@example.com"
export COPERNICUS_PASSWORD="your-password"
./scripts/prepare_dem_stockholm_wide.sh
```

### Option B: Semi-Automated (Manual Download + Scripted Processing)

1. Download EU-DEM tile manually (see below)
2. Process with script:

```powershell
# Windows
.\scripts\prepare_dem_stockholm_wide.ps1 -InputFile "C:\Downloads\eu_dem_v11.tif"
```

```bash
# Linux/Mac
./scripts/prepare_dem_stockholm_wide.sh --input /path/to/downloaded/dem.tif
```

---

## Copernicus Data Space Account

To use automated download, register at: https://dataspace.copernicus.eu/

Free account provides access to:
- Copernicus DEM GLO-30 (30m resolution, global)
- Sentinel imagery
- Various other Earth observation data

**Note:** Store credentials securely. Never commit them to git.

---

## Manual Download Sources

### EU-DEM v1.1 (25m, Europe only)

**Portal:** https://land.copernicus.eu/imagery-in-situ/eu-dem/eu-dem-v1.1

1. Create free account at Copernicus Land Portal
2. Navigate to EU-DEM v1.1 section
3. Use interactive map or tile index to find Stockholm area
4. Download tile: **E40N40** (covers Scandinavia)

**Tile details:**
- Resolution: ~25m
- CRS: EPSG:3035 (ETRS89-LAEA)
- Size: ~500MB-1GB per tile
- Format: GeoTIFF

### Copernicus DEM GLO-30 (30m, global)

**Portal:** https://dataspace.copernicus.eu/

1. Login to Data Space
2. Search catalog for "COP-DEM GLO-30"
3. Filter by area of interest (Stockholm: 59.3°N, 18.0°E)
4. Download intersecting tiles

**Tile details:**
- Resolution: 30m
- CRS: EPSG:4326 (WGS84)
- Coverage: Global
- Format: GeoTIFF

---

## Processing Workflow

### Step 1: Determine Coverage

For `stockholm_wide` preset:
- **Bbox (WGS84):** 17.75, 59.28, 18.25, 59.40
- **Bbox (EPSG:3857):** ~1975000, 8148000, 2032000, 8222000

### Step 2: Reproject and Clip

The pipeline requires DEM in EPSG:3857 (Web Mercator). Use GDAL:

```bash
# Using Docker (recommended)
docker run --rm -v topo_data:/data -v /path/to/downloads:/input \
    osgeo/gdal:ubuntu-small-3.8.0 \
    gdalwarp \
        -t_srs EPSG:3857 \
        -te 1975000 8148000 2032000 8222000 \
        -tr 25 25 \
        -r bilinear \
        -co COMPRESS=LZW \
        -co TILED=YES \
        /input/eu_dem_v11_E40N40.TIF \
        /data/dem/manual/stockholm_wide_eudem.tif
```

```bash
# Using local GDAL installation
gdalwarp \
    -t_srs EPSG:3857 \
    -te 1975000 8148000 2032000 8222000 \
    -tr 25 25 \
    -r bilinear \
    -co COMPRESS=LZW \
    -co TILED=YES \
    eu_dem_v11_E40N40.TIF \
    stockholm_wide_eudem.tif
```

### Step 3: Place in Data Volume

```bash
# Copy to Docker volume
docker cp stockholm_wide_eudem.tif $(docker-compose ps -q prep):/data/dem/manual/

# Or use bind mount in docker-compose.yml
```

### Step 4: Verify

```bash
docker-compose run --rm prep gdalinfo /data/dem/manual/stockholm_wide_eudem.tif
```

Expected output should show:
- Driver: GeoTIFF
- CRS: EPSG:3857 or "WGS 84 / Pseudo-Mercator"
- Size: approximately 2000-3000 x 2000-3000 pixels

---

## File Naming Convention

| Preset | Expected Filename |
|--------|-------------------|
| stockholm_core | `stockholm_core_eudem.tif` |
| stockholm_wide | `stockholm_wide_eudem.tif` |

Files must be placed in: `/data/dem/manual/`

---

## Preset Specifications

| Preset | Bbox (WGS84) | Bbox (EPSG:3857, approx) | Description |
|--------|--------------|--------------------------|-------------|
| stockholm_core | 17.90, 59.32, 18.08, 59.35 | 1992637, 8185645, 2013379, 8204138 | Central Stockholm |
| stockholm_wide | 17.75, 59.28, 18.25, 59.40 | 1975000, 8148000, 2032000, 8222000 | Greater Stockholm |

---

## After DEM Acquisition

Once the DEM file is in place, generate terrain data:

```powershell
# Windows
.\scripts\build_stockholm_wide.ps1 -SkipOsm
```

```bash
# Linux/Mac
./scripts/build_stockholm_wide.sh --skip-osm
```

This will generate:
- Hillshade raster (`/data/terrain/hillshade/stockholm_wide_hillshade.tif`)
- Hillshade XYZ tiles (`/data/tiles/hillshade/stockholm_wide/`)
- Contour GeoJSON (`/data/terrain/contours/stockholm_wide_*.geojson`)
- Contour MBTiles (`/data/tiles/contours/stockholm_wide_*.mbtiles`)

---

## Troubleshooting

### "DEM file not found"

- Verify file exists: `docker-compose run --rm prep ls /data/dem/manual/`
- Check filename matches preset convention
- Ensure Docker volume is mounted correctly

### "Wrong CRS"

- DEM must be in EPSG:3857 (Web Mercator)
- Use `gdalinfo` to verify: look for "EPSG:3857" or "Pseudo-Mercator"
- Reproject if needed using gdalwarp

### "Automated download failed"

- Verify credentials are correct
- Check Copernicus Data Space status: https://status.dataspace.copernicus.eu/
- Try manual download as fallback

### "Out of memory during processing"

- Use chunked processing: add `-wm 256` to gdalwarp for 256MB memory limit
- Or reduce resolution: `-tr 50 50` for 50m instead of 25m

---

## Attribution

When using this data in outputs, include attribution:

**EU-DEM v1.1:**
> European Digital Elevation Model (EU-DEM), version 1.1
> © European Union, Copernicus Land Monitoring Service, European Environment Agency (EEA)

**Copernicus DEM GLO-30:**
> © DLR e.V. 2014-2018 and © Airbus Defence and Space GmbH 2017-2018
> provided under COPERNICUS by the European Union and ESA; all rights reserved

---

## See Also

- `docs/USAGE.md` - General usage guide
- `docs/STATUS.md` - Current system status
- `scripts/prepare_dem_stockholm_wide.ps1` - Automated acquisition script
- `prep-service/scripts/download_copernicus_dem.py` - Download script (Python)

