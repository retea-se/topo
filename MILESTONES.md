# First Runnable Milestones

## Milestone 1: Generate Stockholm Core Data

Run these commands to prepare all data for `stockholm_core`:

```bash
# Build prep-service image
docker-compose build prep

# Download and prepare data
docker-compose run --rm prep python3 /app/src/download_osm.py
docker-compose run --rm prep python3 /app/src/clip_osm.py --preset stockholm_core
docker-compose run --rm prep python3 /app/src/download_dem.py --preset stockholm_core --provider eudem
docker-compose run --rm prep python3 /app/src/generate_hillshade.py --preset stockholm_core
docker-compose run --rm prep python3 /app/src/extract_contours.py --preset stockholm_core
docker-compose run --rm prep /app/scripts/generate_hillshade_tiles.sh stockholm_core
docker-compose run --rm prep /app/scripts/generate_osm_tiles.sh stockholm_core
docker-compose run --rm prep /app/scripts/generate_contour_tiles.sh stockholm_core
```

**Expected outputs:**
- `/data/osm/stockholm_core.osm.pbf`
- `/data/dem/stockholm_core_eudem.tif`
- `/data/terrain/hillshade/stockholm_core_hillshade.tif`
- `/data/terrain/contours/stockholm_core_{2,10,50}m.geojson`
- `/data/tiles/hillshade/stockholm_core/` (XYZ tiles)
- `/data/tiles/osm/stockholm_core.mbtiles`
- `/data/tiles/contours/stockholm_core_{2,10,50}m.mbtiles`

---

## Milestone 2: Demo A - Export A2 150 DPI

```bash
# Start Demo A stack
docker-compose --profile demoA up -d

# Wait for services to be ready
sleep 10

# Export via API (exporter runs on port 8082, but web redirects)
curl "http://localhost:8082/render?bbox_preset=stockholm_core&theme=paper&render_mode=print&dpi=150&width_mm=420&height_mm=594" \
  --output export_demo_a.png

# Or use web UI
# Navigate to http://localhost:3000
# Select: stockholm_core, paper theme, print mode
# Click Export button
```

**Expected output:**
- `/exports/demo-a/export_stockholm_core_paper_print_420mmx594mm_150dpi_*.png`
- PNG file with dimensions: 2480×3508 pixels (A2 at 150 DPI)

---

## Milestone 3: Demo B - Export A2 150 DPI

```bash
# Start Demo B stack
docker-compose --profile demoB up -d

# Wait for database to be ready
sleep 5

# Import OSM data into PostGIS
docker-compose --profile demoB run --rm demo-b-importer stockholm_core

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

# Or use web UI
# Navigate to http://localhost:3001
# Fill in form with parameters
# Click Export button
```

**Expected output:**
- PNG file with dimensions: 2480×3508 pixels (A2 at 150 DPI)
- Byte-identical output for same inputs (deterministic)

---

## Verification Checklist

After each milestone, verify:

- [ ] Data files exist in `/data` volume (check with `docker volume inspect topo_data`)
- [ ] No errors in container logs (`docker-compose logs`)
- [ ] Export files are created with correct dimensions
- [ ] Demo A: Visual appearance is stable (run export 2-3 times, compare visually)
- [ ] Demo B: Exports are byte-identical (run export 2-3 times, compare SHA256 hashes)
- [ ] Contours appear on map (visual inspection)
- [ ] No elevation labels on contours (visual inspection)
- [ ] Hillshade is visible (visual inspection)
- [ ] Buildings are visible (visual inspection)

---

## Troubleshooting

**Data not found errors:**
- Ensure prep-service commands completed successfully
- Check volume mounts: `docker volume ls` and `docker volume inspect topo_data`
- Verify files exist: `docker-compose run --rm prep ls -la /data/osm/`

**Tile server errors:**
- Check Martin logs: `docker-compose logs demo-a-tileserver`
- Verify MBTiles files exist: `docker-compose run --rm prep ls -la /data/tiles/osm/`
- Check nginx hillshade server: `docker-compose logs demo-a-hillshade-server`

**Export errors:**
- Check exporter logs: `docker-compose logs demo-a-exporter`
- Verify web app is accessible: `curl http://localhost:3000`
- Check Playwright/Mapnik logs for rendering errors

**PostGIS import errors:**
- Wait for database to be ready: `docker-compose logs demo-b-db`
- Check import logs: `docker-compose logs demo-b-importer`
- Verify connection: `docker-compose exec demo-b-db psql -U postgres -d gis -c "SELECT COUNT(*) FROM planet_osm_polygon;"`







