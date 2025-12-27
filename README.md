# Topo Map Export System v2

Docker-based system for generating high-quality topographic map exports of Stockholm as wall art. Two parallel implementations:

- **Demo A**: WebGL/Vector Tiles (MapLibre + Playwright) - Fast design iteration
- **Demo B**: Server-side Print Renderer (PostGIS + Mapnik) - Production-quality exports

## Quick Start

### Prerequisites
- Docker & Docker Compose
- 10GB+ disk space for data

### First Run - Generate Stockholm Core Data

```bash
# Download and prepare data
docker-compose run --rm prep python3 /app/src/download_osm.py
docker-compose run --rm prep python3 /app/src/clip_osm.py --preset stockholm_core
docker-compose run --rm prep python3 /app/src/download_dem.py --preset stockholm_core --provider local
docker-compose run --rm prep python3 /app/src/generate_hillshade.py --preset stockholm_core
docker-compose run --rm prep python3 /app/src/extract_contours.py --preset stockholm_core
docker-compose run --rm prep /app/scripts/generate_hillshade_tiles.sh stockholm_core
docker-compose run --rm prep /app/scripts/generate_osm_tiles.sh stockholm_core
docker-compose run --rm prep /app/scripts/generate_contour_tiles.sh stockholm_core
```

### Demo A - Export A2 150 DPI

```bash
# Start Demo A stack
docker-compose --profile demoA up -d

# Export via API
curl "http://localhost:8082/render?bbox_preset=stockholm_core&theme=paper&render_mode=print&dpi=150&width_mm=420&height_mm=594" \
  --output export_demo_a.png

# Or use web UI at http://localhost:3000
```

### Demo B - Export A2 150 DPI

```bash
# Start Demo B stack
docker-compose --profile demoB up -d

# Import OSM data
docker-compose --profile demoB run --rm demo-b-importer /app/import.sh stockholm_core

# Export via API
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

# Or use web UI at http://localhost:3001
```

## Architecture

- **Prep Service**: Downloads OSM, DEM, generates hillshade and contours
- **Demo A**: Vector tiles (Planetiler/Tippecanoe) → Martin tileserver → MapLibre webapp → Playwright export
- **Demo B**: PostGIS (osm2pgsql) → Mapnik renderer → Flask API → PNG/PDF export

## Data Storage

- `/data`: Persistent volume for OSM, DEM, terrain, tiles
- `/exports`: Persistent volume for exported images

## Bbox Presets

- `stockholm_core`: [17.90, 59.32, 18.08, 59.35] - Central Stockholm
- `stockholm_wide`: [17.75, 59.28, 18.25, 59.40] - Greater Stockholm area

## Constraints

- Contours: NEVER render elevation labels (visual rhythm only)
- Print mode: Labels OFF by default (opt-in required)
- Determinism: Demo A (visual stability), Demo B (byte-identical)
- CRS: EPSG:3857 everywhere (Web Mercator)

## Manual DEM Download

EU-DEM download automation requires Copernicus API access. For local development, use manual download:

1. See `DEM_MANUAL_DOWNLOAD.md` for detailed instructions
2. Download EU-DEM tile covering Stockholm
3. Reproject to EPSG:3857 using gdalwarp
4. Place file at: `/data/dem/manual/stockholm_core_eudem.tif`
5. Run: `docker-compose run --rm prep python3 /app/src/download_dem.py --preset stockholm_core --provider local`

## Testing

Run smoke tests:
```bash
chmod +x scripts/*.sh
./scripts/smoke_test.sh
```

Test determinism:
```bash
./scripts/test_determinism.sh demo-b stockholm_core paper 150 420 594
```

Diagnose issues:
```bash
./scripts/diagnose_common_failures.sh
```

Audit export presets:
```bash
python scripts/preset_audit.py
# See docs/PRESET_AUDIT_REPORT.md for results
```

See `RUNBOOK.md` for detailed step-by-step instructions.

