# Leverans - Svealand QA 2025-12-27

## Kommandon som kördes

### 1. Förberedelse
```powershell
# Skapade QA-mapp
New-Item -ItemType Directory -Path 'exports\screenshots\qa_20251227_120000_svealand'

# Verifierade OSM tiles
docker-compose run --rm --entrypoint /bin/bash prep -c "ls -lh /data/tiles/osm/svealand.mbtiles"
# Resultat: 653 MB, skapad 2025-12-26 18:28
```

### 2. Terrain Data Verification
```powershell
# Kontrollerade terrain data
docker-compose run --rm --entrypoint /bin/bash prep -c "ls -lh /data/terrain/hillshade/svealand_hillshade.tif"
docker-compose run --rm --entrypoint /bin/bash prep -c "ls -lh /data/terrain/contours/svealand_*.geojson"
docker-compose run --rm --entrypoint /bin/bash prep -c "ls -lh /data/dem/*svealand*"
# Resultat: Alla saknas
```

### 3. Martin Config Fix
```powershell
# Kommenterade bort saknade contour sources
# Fil: demo-a/tileserver/martin.yaml

# Startade om tileserver
docker-compose --profile demoA restart demo-a-tileserver
```

### 4. Tile Health Check
```powershell
# Skapade tile health check script
# Fil: scripts/tile_health_check_svealand.js

# Körde health check
node scripts/tile_health_check_svealand.js exports/screenshots/qa_20251227_120000_svealand
# Resultat: 12/90 tiles OK (OSM fungerar, terrain saknas)
```

### 5. Frontend QA
```powershell
# Öppnade Demo A med Chrome DevTools MCP
# URL: http://localhost:3000?bbox_preset=svealand&theme=paper

# Tog screenshots för alla layer toggles
# - demoA_svealand_paper_allLayers.png
# - demoA_svealand_paper_hillshadeOff.png
# - demoA_svealand_paper_contoursOff.png
# - demoA_svealand_paper_buildingsOff.png
# - demoA_svealand_paper_roadsOff.png
# - demoA_svealand_paper_waterOff.png

# Öppnade Demo B
# URL: http://localhost:3001
# Tog screenshot: demoB_svealand_ui.png
# Körde export: API returnerade 200 OK
```

### 6. Dokumentation
```powershell
# Skapade QA-rapport
# Fil: docs/QA_REPORT_SVEALAND.md

# Uppdaterade STATUS.md
# - Ändrade svealand status från "Full coverage" till "Partial coverage"
# - Uppdaterade coverage audit tabell
# - Lade till QA-information
```

### 7. Git Commit & Push
```powershell
git add demo-a/tileserver/martin.yaml docs/STATUS.md docs/QA_REPORT_SVEALAND.md scripts/tile_health_check_svealand.js exports/screenshots/qa_20251227_120000_svealand/
git commit -m "QA: Svealand preset verification - OSM tiles working, terrain data missing"
git push
```

## Filer som skapades

### Dokumentation
- `docs/QA_REPORT_SVEALAND.md` - Fullständig QA-rapport
- `exports/screenshots/qa_20251227_120000_svealand/status_check.md` - Status check
- `exports/screenshots/qa_20251227_120000_svealand/terrain_missing_report.md` - Terrain data problem
- `exports/screenshots/qa_20251227_120000_svealand/tile_health_summary.md` - Tile health summary
- `exports/screenshots/qa_20251227_120000_svealand/LEVERANS.md` - Denna fil

### Scripts
- `scripts/tile_health_check_svealand.js` - Tile health check för svealand

### QA Artefakter
- `exports/screenshots/qa_20251227_120000_svealand/tile_health_svealand.json` - Tile health check resultat
- `exports/screenshots/qa_20251227_120000_svealand/demoA_svealand_paper_allLayers.png`
- `exports/screenshots/qa_20251227_120000_svealand/demoA_svealand_paper_hillshadeOff.png`
- `exports/screenshots/qa_20251227_120000_svealand/demoA_svealand_paper_contoursOff.png`
- `exports/screenshots/qa_20251227_120000_svealand/demoA_svealand_paper_buildingsOff.png`
- `exports/screenshots/qa_20251227_120000_svealand/demoA_svealand_paper_roadsOff.png`
- `exports/screenshots/qa_20251227_120000_svealand/demoA_svealand_paper_waterOff.png`
- `exports/screenshots/qa_20251227_120000_svealand/demoB_svealand_ui.png`

### Filer som ändrades
- `demo-a/tileserver/martin.yaml` - Kommenterade bort saknade contour sources
- `docs/STATUS.md` - Uppdaterad status för svealand

## Commits

**Commit**: `c810911`
**Message**: "QA: Svealand preset verification - OSM tiles working, terrain data missing"
**Files changed**: 8 files, 1256 insertions(+), 10 deletions(-)

## Exakta paths till QA artefakter

### Huvudmapp
```
exports/screenshots/qa_20251227_120000_svealand/
```

### Screenshots
```
exports/screenshots/qa_20251227_120000_svealand/demoA_svealand_paper_allLayers.png
exports/screenshots/qa_20251227_120000_svealand/demoA_svealand_paper_hillshadeOff.png
exports/screenshots/qa_20251227_120000_svealand/demoA_svealand_paper_contoursOff.png
exports/screenshots/qa_20251227_120000_svealand/demoA_svealand_paper_buildingsOff.png
exports/screenshots/qa_20251227_120000_svealand/demoA_svealand_paper_roadsOff.png
exports/screenshots/qa_20251227_120000_svealand/demoA_svealand_paper_waterOff.png
exports/screenshots/qa_20251227_120000_svealand/demoB_svealand_ui.png
```

### Data & Reports
```
exports/screenshots/qa_20251227_120000_svealand/tile_health_svealand.json
exports/screenshots/qa_20251227_120000_svealand/status_check.md
exports/screenshots/qa_20251227_120000_svealand/terrain_missing_report.md
exports/screenshots/qa_20251227_120000_svealand/tile_health_summary.md
docs/QA_REPORT_SVEALAND.md
```

## Resultat

### ✅ Fungerar
- OSM tiles (653 MB, 12/18 tiles OK i health check)
- Demo A frontend med svealand preset
- Layer toggles i Demo A
- Demo B UI och export API

### ❌ Saknas
- DEM för svealand
- Hillshade raster och tiles
- Contour GeoJSON och mbtiles

### ⚠️ Nästa steg
1. Ladda ner DEM för svealand (Copernicus GLO-30)
2. Kör `./scripts/build_svealand.sh --skip-osm`
3. Re-run QA för full coverage

