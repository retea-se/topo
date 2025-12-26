# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Docker-based system for generating high-quality topographic map exports of Stockholm as wall art. Two parallel implementations:
- **Demo A**: WebGL/Vector Tiles (MapLibre + Playwright) - Fast design iteration
- **Demo B**: Server-side Print Renderer (PostGIS + Mapnik) - Production-quality, byte-identical exports

## Common Commands

### Data Preparation (run once or when data changes)
```bash
docker-compose build prep
docker-compose run --rm prep python3 /app/src/download_osm.py
docker-compose run --rm prep python3 /app/src/clip_osm.py --preset stockholm_core
docker-compose run --rm prep python3 /app/src/download_dem.py --preset stockholm_core --provider local
docker-compose run --rm prep python3 /app/src/generate_hillshade.py --preset stockholm_core
docker-compose run --rm prep python3 /app/src/extract_contours.py --preset stockholm_core
docker-compose run --rm prep /app/scripts/generate_hillshade_tiles.sh stockholm_core
docker-compose run --rm prep /app/scripts/generate_osm_tiles.sh stockholm_core
docker-compose run --rm prep /app/scripts/generate_contour_tiles.sh stockholm_core
```

### Demo A (WebGL/Playwright)
```bash
docker-compose --profile demoA build
docker-compose --profile demoA up -d
# Web UI: http://localhost:3000
# Export API: curl "http://localhost:8082/render?bbox_preset=stockholm_core&theme=paper&render_mode=print&dpi=150&width_mm=420&height_mm=594" --output export.png
```

### Demo B (Mapnik/PostGIS)
```bash
docker-compose --profile demoB build
docker-compose --profile demoB up -d
docker-compose --profile demoB run --rm demo-b-importer stockholm_core
# Web UI: http://localhost:3001
# Export API: curl -X POST "http://localhost:5000/render" -H "Content-Type: application/json" -d '{"bbox_preset":"stockholm_core","theme":"paper","render_mode":"print","dpi":150,"width_mm":420,"height_mm":594,"format":"png"}' --output export.png
```

### Testing
```bash
./scripts/smoke_test.sh
./scripts/test_determinism.sh demo-b stockholm_core paper 150 420 594
./scripts/diagnose_common_failures.sh
```

## Architecture

```
├── prep-service/       # Shared data preparation
│   ├── src/            # Python scripts: download_osm, clip_osm, download_dem, generate_hillshade, extract_contours
│   └── scripts/        # Tile generation: generate_osm_tiles.sh, generate_hillshade_tiles.sh, generate_contour_tiles.sh
├── demo-a/             # WebGL pipeline
│   ├── tileserver/     # Martin config + nginx for hillshade tiles
│   ├── web/            # MapLibre webapp (Express, port 3000)
│   └── exporter/       # Playwright screenshot service (port 8082)
├── demo-b/             # Server-side pipeline
│   ├── db/             # PostGIS setup
│   ├── importers/      # osm2pgsql importer
│   ├── renderer/       # Mapnik Python renderer
│   ├── api/            # Flask API (port 5000)
│   └── web/            # Static web UI (port 3001)
├── themes/             # Shared JSON theme files (paper, ink, mono, dark, charcoal, etc.)
└── scripts/            # Testing and utility scripts
```

### Data Flow
- **Demo A**: OSM/DEM → prep-service → MBTiles/XYZ → Martin tileserver → MapLibre → Playwright screenshot
- **Demo B**: OSM → prep-service → PostGIS (osm2pgsql) → Mapnik → PNG/PDF

### Docker Profiles
- `demoA`: demo-a-tileserver, demo-a-hillshade-server, demo-a-web, demo-a-exporter
- `demoB`: demo-b-db, demo-b-importer, demo-b-renderer, demo-b-api, demo-b-web

### Volumes
- `data:/data` - OSM, DEM, terrain, tiles (shared, persistent)
- `exports:/exports` - Output images

## Critical Constraints

1. **Contours**: NEVER render elevation labels - visual rhythm only
2. **Print mode**: Labels OFF by default (opt-in required)
3. **CRS**: EPSG:3857 everywhere (Web Mercator)
4. **Determinism**:
   - Demo A: Visual stability (minor GPU-related pixel differences acceptable)
   - Demo B: Byte-identical output required (same inputs → identical SHA256)

## Bbox Presets

- `stockholm_core`: [17.90, 59.32, 18.08, 59.35] - Central Stockholm
- `stockholm_wide`: [17.75, 59.28, 18.25, 59.40] - Greater Stockholm area

## Export Dimensions Reference

| Format | DPI | Width (mm) | Height (mm) | Width (px) | Height (px) |
|--------|-----|------------|-------------|------------|-------------|
| A2     | 150 | 420        | 594         | 2,480      | 3,508       |
| A2     | 300 | 420        | 594         | 4,961      | 7,016       |
| A1     | 150 | 594        | 841         | 3,508      | 4,961       |

Formula: `pixels = mm * dpi / 25.4`

## DEM Data

EU-DEM download requires Copernicus API access. For local development:
1. Manually download EU-DEM tile covering Stockholm
2. Reproject to EPSG:3857
3. Place at: `/data/dem/manual/stockholm_core_eudem.tif`
4. Run: `docker-compose run --rm prep python3 /app/src/download_dem.py --preset stockholm_core --provider local`

See `DEM_MANUAL_DOWNLOAD.md` for detailed instructions.
