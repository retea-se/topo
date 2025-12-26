# Manual EU-DEM Download Instructions

## Overview

EU-DEM (European Digital Elevation Model) v1.1 provides elevation data at ~25m resolution. For local development, you can manually download and prepare the DEM file.

## Step 1: Download EU-DEM Tile

1. Visit: https://land.copernicus.eu/imagery-in-situ/eu-dem
2. Navigate to the download section
3. Download the tile covering Stockholm, Sweden
   - Tile naming convention: `eu_dem_v11_E40N20.TIF` (example)
   - Stockholm is approximately at: 59.3°N, 18.0°E
   - You may need tile: `E20N60` or similar (check coverage map)

**Note:** Registration may be required. The file is typically 200-500MB.

## Step 2: Reproject to EPSG:3857

EU-DEM tiles are in EPSG:3035 (Lambert Azimuthal Equal Area). You need to reproject to EPSG:3857 (Web Mercator) for use in this system.

### Using GDAL (recommended)

```bash
# Basic reprojection
gdalwarp -t_srs EPSG:3857 \
         -r bilinear \
         -co COMPRESS=LZW \
         -co TILED=YES \
         input_eudem.tif \
         stockholm_core_eudem.tif

# With bbox clipping (recommended for smaller file size)
# Get bbox for stockholm_core: 17.90, 59.32, 18.08, 59.35 (WGS84)
# Convert to EPSG:3857 for -te flag
gdalwarp -t_srs EPSG:3857 \
         -te 1992637.8 8185645.6 2013379.6 8204138.4 \
         -r bilinear \
         -co COMPRESS=LZW \
         -co TILED=YES \
         input_eudem.tif \
         stockholm_core_eudem.tif
```

**Bbox conversion (EPSG:3857 approximate for Stockholm):**
- Min X: ~1990000 (17.90°E → ~1992637m)
- Min Y: ~8185000 (59.32°N → ~8185645m)
- Max X: ~2014000 (18.08°E → ~2013379m)
- Max Y: ~8204000 (59.35°N → ~8204138m)

### Using Docker (if GDAL not installed locally)

```bash
# Place input file in current directory
docker run --rm -v "$(pwd)":/data osgeo/gdal:3.8.0-ubuntu24.04 \
  gdalwarp -t_srs EPSG:3857 \
           -r bilinear \
           -co COMPRESS=LZW \
           -co TILED=YES \
           /data/input_eudem.tif \
           /data/stockholm_core_eudem.tif
```

## Step 3: Place File in Data Volume

### Option A: Copy to Docker Volume

```bash
# Find volume path
docker volume inspect topo_data

# On Linux/Mac, copy file:
sudo cp stockholm_core_eudem.tif /var/lib/docker/volumes/topo_data/_data/dem/manual/

# On Windows (Docker Desktop), use bind mount or copy via container:
docker-compose run --rm prep mkdir -p /data/dem/manual
docker cp stockholm_core_eudem.tif $(docker-compose ps -q prep):/data/dem/manual/
```

### Option B: Use Bind Mount (Development)

Modify `docker-compose.yml` to add a bind mount for dem/manual:

```yaml
prep:
  volumes:
    - data:/data
    - ./local_data/dem:/data/dem/manual:ro  # Add this line
```

Then place file in `./local_data/dem/stockholm_core_eudem.tif`

## Step 4: Verify File

```bash
# Check file exists
docker-compose run --rm prep ls -lh /data/dem/manual/stockholm_core_eudem.tif

# Verify CRS
docker-compose run --rm prep gdalinfo /data/dem/manual/stockholm_core_eudem.tif | grep "PROJCS\|EPSG"
# Expected output should mention "3857" or "WGS 84 / Pseudo-Mercator"

# Check file size (should be reasonable, ~50-200MB for clipped area)
docker-compose run --rm prep du -h /data/dem/manual/stockholm_core_eudem.tif
```

## Step 5: Generate Checksum (Optional)

```bash
docker-compose run --rm prep sha256sum /data/dem/manual/stockholm_core_eudem.tif > /data/dem/manual/stockholm_core_eudem.tif.sha256
```

## Step 6: Use in Pipeline

Once the file is in place, the prep-service will automatically use it:

```bash
# This will now find the local file
docker-compose run --rm prep python3 /app/src/download_dem.py --preset stockholm_core --provider local

# Continue with hillshade generation
docker-compose run --rm prep python3 /app/src/generate_hillshade.py --preset stockholm_core
```

## Troubleshooting

**Problem: File not found**
- Verify path: `/data/dem/manual/stockholm_core_eudem.tif`
- Check file permissions (should be readable)
- Ensure Docker volume is mounted correctly

**Problem: Wrong CRS**
- Verify with `gdalinfo` command above
- If not EPSG:3857, reproject using gdalwarp

**Problem: File too large**
- Clip to exact bbox using `-te` flag in gdalwarp
- Use compression: `-co COMPRESS=LZW`

**Problem: Out of memory during reprojection**
- Process in chunks using gdalwarp with `-wo NUM_THREADS=ALL_CPUS`
- Or use lower resolution: `-tr 50 50` (50m instead of 25m)

## Alternative: Use Pre-processed DEM

If you have access to a pre-processed DEM in EPSG:3857 covering Stockholm, you can use it directly:

1. Ensure it's in EPSG:3857 (Web Mercator)
2. Place at: `/data/dem/manual/stockholm_core_eudem.tif`
3. The system will use it automatically

## File Naming Convention

The system expects: `{preset}_eudem.tif`

- `stockholm_core` → `stockholm_core_eudem.tif`
- `stockholm_wide` → `stockholm_wide_eudem.tif`

For different presets, adjust the filename accordingly.




