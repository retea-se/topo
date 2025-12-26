# ⚠️ STOP: DEM File Missing - Manual Action Required

## Status

The system is ready except for the DEM (Digital Elevation Model) file which must be placed manually.

## Exact File Requirements

**File name:** `stockholm_core_eudem.tif`
**Exact path in Docker volume:** `/data/dem/manual/stockholm_core_eudem.tif`
**Coordinate system (CRS):** MUST be EPSG:3857 (Web Mercator)
**Expected size:** ~50-200MB for the clipped Stockholm area

## How to Place the File

### Step 1: Obtain DEM File

Download EU-DEM tile covering Stockholm from:

- https://land.copernicus.eu/imagery-in-situ/eu-dem

The file will likely be in EPSG:3035 and needs to be reprojected to EPSG:3857.

### Step 2: Reproject to EPSG:3857 (if needed)

If you have GDAL installed locally:

```bash
gdalwarp -t_srs EPSG:3857 -r bilinear -co COMPRESS=LZW input_eudem.tif stockholm_core_eudem.tif
```

Or use Docker:

```bash
docker run --rm -v "$(pwd)":/data osgeo/gdal:latest \
  gdalwarp -t_srs EPSG:3857 -r bilinear \
  -te 1992637.8 8185645.6 2013379.6 8204138.4 \
  -co COMPRESS=LZW \
  /data/input_eudem.tif /data/stockholm_core_eudem.tif
```

### Step 3: Copy File into Docker Volume

**On Windows (PowerShell):**

```powershell
# Start a temporary container to copy file
$container = docker run -d --rm -v topo_data:/data prep-service sleep 3600

# Copy file (replace path_to_file with your actual file path)
docker cp "path_to_file\stockholm_core_eudem.tif" "${container}:/data/dem/manual/"

# Stop container
docker stop $container

# Verify file is there
docker compose run --rm --entrypoint="" prep sh -c "ls -lh /data/dem/manual/stockholm_core_eudem.tif"
```

**Alternative (if you have the file locally):**

1. Create local directory: `mkdir -p ./local_data/dem`
2. Copy your file there: `cp stockholm_core_eudem.tif ./local_data/dem/`
3. Edit `docker-compose.yml` under `prep` service, add to volumes:
   ```yaml
   volumes:
     - data:/data
     - ./local_data/dem:/data/dem/manual:ro
   ```

### Step 4: Resume Processing

After placing the file, run:

```bash
docker compose run --rm prep /app/src/download_dem.py --preset stockholm_core --provider local
```

Then continue with:

```bash
# Generate hillshade
docker compose run --rm prep /app/src/generate_hillshade.py --preset stockholm_core

# Extract contours
docker compose run --rm prep /app/src/extract_contours.py --preset stockholm_core

# Generate tiles
docker compose run --rm prep /app/scripts/generate_hillshade_tiles.sh stockholm_core
docker compose run --rm prep /app/scripts/generate_osm_tiles.sh stockholm_core
docker compose run --rm prep /app/scripts/generate_contour_tiles.sh stockholm_core
```

## See Also

- `DEM_MANUAL_DOWNLOAD.md` - Detailed manual download instructions
- `BRING_UP_AND_TEST.md` - Complete setup guide


