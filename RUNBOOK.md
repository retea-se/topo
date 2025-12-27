# Runbook: From Zero to First Export

## Prerequisites

- Docker & Docker Compose installed
- 15GB+ free disk space
- Internet connection for initial downloads

## Stage 0: Verify Setup

```bash
# Verify Docker Compose
docker-compose --version

# Check disk space (Linux/Mac)
df -h

# On Windows, check via File Explorer or PowerShell:
Get-PSDrive C | Select-Object Used,Free
```

## Stage 1: Prepare Data (Prep Service)

### 1.1 Build Prep Service

```bash
docker-compose build prep
```

### 1.2 Download OSM Data

```bash
# Download Geofabrik Sweden extract (~500MB)
docker-compose run --rm prep python3 /app/src/download_osm.py
```

**Verification:**
```bash
# Check file exists (from host)
docker-compose run --rm prep ls -lh /data/osm/sweden-latest.osm.pbf

# Verify checksum
docker-compose run --rm prep md5sum -c /data/osm/sweden-latest.osm.pbf.md5
```

**Expected:** File ~500MB, checksum verification passes

### 1.3 Clip OSM to Stockholm Core

```bash
docker-compose run --rm prep python3 /app/src/clip_osm.py --preset stockholm_core
```

**Verification:**
```bash
docker-compose run --rm prep ls -lh /data/osm/stockholm_core.osm.pbf
# Expected: ~50-100MB file
```

### 1.4 Download/Place DEM

**Option A: Manual Download (Recommended for local dev)**

1. Download EU-DEM tile covering Stockholm (e.g., from https://land.copernicus.eu/imagery-in-situ/eu-dem)
2. File is typically in EPSG:3035 (Lambert Azimuthal Equal Area)
3. Convert to EPSG:3857:

```bash
# Create manual DEM directory
docker-compose run --rm prep mkdir -p /data/dem/manual

# Copy your downloaded DEM file to the mounted volume
# On host, copy file to: <docker volume path>/dem/manual/stockholm_core_eudem.tif
# Then reproject to EPSG:3857:
docker-compose run --rm prep gdalwarp -t_srs EPSG:3857 -r bilinear \
  /data/dem/manual/stockholm_core_eudem_raw.tif \
  /data/dem/manual/stockholm_core_eudem.tif

# Generate checksum
docker-compose run --rm prep sha256sum /data/dem/manual/stockholm_core_eudem.tif > /data/dem/manual/stockholm_core_eudem.tif.sha256
```

**Option B: Automated Download (If EU-DEM API is configured)**

```bash
docker-compose run --rm prep python3 /app/src/download_dem.py --preset stockholm_core --provider eudem
```

**Verification:**
```bash
docker-compose run --rm prep ls -lh /data/dem/*/stockholm_core_eudem.tif
docker-compose run --rm prep gdalinfo /data/dem/*/stockholm_core_eudem.tif | grep "PROJCS\|EPSG"
# Expected: EPSG:3857 or "PROJCS["WGS 84 / Pseudo-Mercator""
```

### 1.5 Generate Hillshade

```bash
docker-compose run --rm prep python3 /app/src/generate_hillshade.py --preset stockholm_core
```

**Verification:**
```bash
docker-compose run --rm prep ls -lh /data/terrain/hillshade/stockholm_core_hillshade.tif
docker-compose run --rm prep gdalinfo /data/terrain/hillshade/stockholm_core_hillshade.tif | grep "Data axis"
# Expected: Single band, grayscale
```

### 1.6 Generate Contours

```bash
docker-compose run --rm prep python3 /app/src/extract_contours.py --preset stockholm_core
```

**Verification:**
```bash
docker-compose run --rm prep ls -lh /data/terrain/contours/stockholm_core_*.geojson
# Expected: 3 files: stockholm_core_2m.geojson, stockholm_core_10m.geojson, stockholm_core_50m.geojson
```

### 1.7 Generate Tiles

```bash
# Hillshade XYZ tiles
docker-compose run --rm prep /app/scripts/generate_hillshade_tiles.sh stockholm_core

# OSM vector tiles (Planetiler)
docker-compose run --rm prep /app/scripts/generate_osm_tiles.sh stockholm_core

# Contour vector tiles (Tippecanoe)
docker-compose run --rm prep /app/scripts/generate_contour_tiles.sh stockholm_core
```

**Verification:**
```bash
# Check tile files exist
docker-compose run --rm prep ls -lh /data/tiles/osm/stockholm_core.mbtiles
docker-compose run --rm prep ls -lh /data/tiles/contours/stockholm_core_*.mbtiles
docker-compose run --rm prep ls -ld /data/tiles/hillshade/stockholm_core/

# Verify MBTiles structure (requires sqlite3)
docker-compose run --rm prep sqlite3 /data/tiles/osm/stockholm_core.mbtiles "SELECT COUNT(*) FROM tiles;"
# Expected: > 0 rows
```

## Stage 2: Demo A - WebGL Export

### 2.1 Start Demo A Stack

```bash
# Build services
docker-compose --profile demoA build

# Start services
docker-compose --profile demoA up -d

# Check logs
docker-compose --profile demoA logs -f
```

**Verification:**
```bash
# Check services are running
docker-compose --profile demoA ps

# Test tileserver
curl -I http://localhost:8080/catalog

# Test hillshade server
curl -I http://localhost:8081/tiles/hillshade/stockholm_core/10/550/320.png

# Test web app
curl -I http://localhost:3000
# Expected: HTTP 200
```

### 2.2 Export via API

```bash
# Export A2 at 150 DPI
curl "http://localhost:8082/render?bbox_preset=stockholm_core&theme=paper&render_mode=print&dpi=150&width_mm=420&height_mm=594" \
  --output export_demo_a.png

# Verify output
file export_demo_a.png
# Expected: PNG image data, 2480 x 3508
```

**Verification:**
```bash
# Check file exists and dimensions
docker-compose exec demo-a-exporter ls -lh /exports/demo-a/

# Verify PNG dimensions (requires imagemagick or similar)
docker run --rm -v "$(pwd)":/work -w /work mwendler/imagemagick identify export_demo_a.png
# Expected: 2480x3508 PNG
```

### 2.3 Export via Web UI

1. Open http://localhost:3000
2. Select theme: Paper
3. Select bbox preset: Stockholm Core
4. Select render mode: Print
5. Click Export
6. Image downloads

## Stage 3: Demo B - Server-side Export

### 3.1 Start Demo B Stack

```bash
# Build services
docker-compose --profile demoB build

# Start database
docker-compose --profile demoB up -d demo-b-db

# Wait for database (10 seconds)
sleep 10

# Start all services
docker-compose --profile demoB up -d

# Check logs
docker-compose --profile demoB logs -f
```

### 3.2 Import OSM Data

```bash
# Import Stockholm Core OSM into PostGIS
docker-compose --profile demoB run --rm demo-b-importer stockholm_core
```

**Verification:**
```bash
# Check import success
docker-compose exec demo-b-db psql -U postgres -d gis -c "SELECT COUNT(*) FROM planet_osm_polygon;"
# Expected: > 0 rows (typically thousands)

# Check spatial index exists
docker-compose exec demo-b-db psql -U postgres -d gis -c "\d planet_osm_polygon" | grep "way.*geometry"
# Expected: way | geometry(Geometry,3857)
```

### 3.3 Export via API

```bash
# Export A2 at 150 DPI
curl -X POST "http://localhost:5000/render" \
  -H "Content-Type: application/json" \
  -d '{
    "bbox_preset": "stockholm_core",
    "theme": "paper",
    "render_mode": "print",
    "dpi": 150,
    "width_mm": 420,
    "height_mm": 594,
    "format": "png"
  }' \
  --output export_demo_b.png

# Verify output
file export_demo_b.png
# Expected: PNG image data, 2480 x 3508
```

### 3.4 Export via Web UI

1. Open http://localhost:3001
2. Fill form:
   - Theme: Paper
   - Bbox Preset: Stockholm Core
   - Render Mode: Print
   - DPI: 150
   - Width: 420 mm
   - Height: 594 mm
   - Format: PNG
3. Click Export
4. Image downloads

## Stage 4: Verify Exports

### 4.1 Check Export Dimensions

```bash
# Expected pixel dimensions:
# A2 at 150 DPI: 2480 x 3508
# A2 at 300 DPI: 4961 x 7016
# A1 at 150 DPI: 3508 x 4961
# A1 at 300 DPI: 7016 x 9921

# Verify (requires imagemagick)
docker run --rm -v "$(pwd)":/work -w /work mwendler/imagemagick identify export_demo_a.png export_demo_b.png
```

### 4.2 Visual Inspection Checklist

- [ ] Background color matches theme
- [ ] Hillshade visible (subtle shading)
- [ ] Water bodies visible
- [ ] Parks/landuse visible
- [ ] Roads visible (major and minor)
- [ ] Buildings visible
- [ ] Contours visible (no labels!)
- [ ] No obvious rendering artifacts
- [ ] Image is centered on Stockholm area

## Expected File Structure in /data Volume

```
/data/
├── osm/
│   ├── sweden-latest.osm.pbf          (~500MB)
│   ├── sweden-latest.osm.pbf.md5
│   └── stockholm_core.osm.pbf         (~50-100MB)
├── dem/
│   └── manual/  (or from automated download)
│       ├── stockholm_core_eudem.tif   (~50-200MB)
│       └── stockholm_core_eudem.tif.sha256
├── terrain/
│   ├── hillshade/
│   │   └── stockholm_core_hillshade.tif  (~50-150MB)
│   └── contours/
│       ├── stockholm_core_2m.geojson
│       ├── stockholm_core_10m.geojson
│       └── stockholm_core_50m.geojson
└── tiles/
    ├── osm/
    │   └── stockholm_core.mbtiles        (~10-50MB)
    ├── contours/
    │   ├── stockholm_core_2m.mbtiles
    │   ├── stockholm_core_10m.mbtiles
    │   └── stockholm_core_50m.mbtiles
    └── hillshade/
        └── stockholm_core/
            └── {z}/{x}/{y}.png           (thousands of tiles)
```

## Expected File Structure in /exports Volume

```
/exports/
├── demo-a/
│   └── export_stockholm_core_paper_print_420mmx594mm_150dpi_YYYY-MM-DD.png
└── demo-b/
    └── (exports via API, not stored in volume by default)
```

## Troubleshooting Quick Reference

**Problem: OSM download fails**
- Check internet connection
- Verify Geofabrik URL is accessible
- Check disk space

**Problem: DEM file not found**
- Ensure manual DEM is placed in correct location
- Verify file is reprojected to EPSG:3857
- Check file permissions

**Problem: Tileserver returns 404**
- Verify MBTiles files exist
- Check Martin configuration
- Review tileserver logs: `docker-compose logs demo-a-tileserver`

**Problem: Blank/white export**
- Check tile URLs in browser console
- Verify map loaded event fires
- Check Playwright logs: `docker-compose logs demo-a-exporter`

**Problem: Mapnik render fails**
- Check PostGIS connection
- Verify hillshade GeoTIFF path
- Review renderer logs: `docker-compose logs demo-b-renderer`

**Problem: Wrong bbox/area**
- Verify bbox preset coordinates
- Check map center/zoom settings
- Verify OSM clip contains expected area







