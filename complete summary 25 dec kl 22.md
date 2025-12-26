# Topo Map Export System - Komplett Sammanfattning

**Datum:** 25 december 2025, kl. 22:00
**Övergripande Status:** ~75% klart - Infrastruktur och datapipeline fungerar, exports behöver finjustering

---

## Projektöversikt

### Vad är detta?
Ett Docker-baserat system för att generera topografiska kartexporter av Stockholm som väggkonst. Systemet har två parallella implementationer:

- **Demo A:** WebGL/Vector Tiles (MapLibre + Playwright) - Snabb designiteration
- **Demo B:** Server-side Print Renderer (PostGIS + Mapnik) - Produktionskvalitet

### Målformat
- A2 vid 150/300 DPI (2480×3508 / 4961×7016 px)
- A1 vid 150/300 DPI (3508×4961 / 7016×9921 px)
- PNG och PDF-export

---

## Arkitektur

```
Prep Service → /data (OSM, DEM, terrain, tiles)
     ↓
Demo A: Martin (vector) + nginx (hillshade) → MapLibre → Playwright
Demo B: PostGIS → Mapnik → Flask API
```

### Portar
| Service | Port | Status |
|---------|------|--------|
| Demo A Web | 3000 | ✅ Fungerar |
| Demo A Tileserver | 8080 | ✅ Fungerar |
| Demo A Hillshade | 8081 | ✅ Fungerar |
| Demo A Exporter | 8082 | ⚠️ Timeout-problem |
| Demo B Web | 3001 | ✅ Fungerar |
| Demo B API | 5000 | ✅ Fungerar |
| Demo B Renderer | 5001 | ⚠️ XML-parsing varningar |
| Demo B Database | 5432 | ✅ Fungerar |

---

## Status per Komponent

### ✅ Helt Klart

#### Infrastruktur
- Docker Compose med profiler (demoA, demoB)
- Volymdefintioner (data, exports)
- Bbox-presets (stockholm_core, stockholm_wide)

#### Prep Service
- OSM-nedladdning (Geofabrik Sweden ~751MB)
- OSM-klippning till stockholm_core (3.3MB)
- DEM-hantering (EPSG:3857 reprojicerad, ~2.1MB)
- Hillshade-generering (gdaldem hillshade -az 315 -alt 45)
- Konturgenerering (2m/10m/50m intervall)
- Hillshade XYZ-tiles (zoom 10-16)
- Kontur MBTiles (3 nivåer, ~32KB var)

#### Teman
- 5 teman: paper, ink, mono, muted-pastel, dark
- Galleri-anpassade teman dokumenterade (WarmPaper, Charcoal, BlueprintMuted)
- Konturer har noLabels: true (hårdkodat)

#### Demo A Services
- Martin tileserver konfigurerad (v0.14.0 YAML)
- Nginx för hillshade-tiles
- MapLibre web-app med temabyte
- Playwright export-service

#### Demo B Services
- PostGIS databas med OSM-data (32K punkter, 18K polygoner, 21K linjer)
- Mapnik renderer (Flask-server)
- Flask API-proxy
- HTML-formulär UI

### ⚠️ Delvis Klart / Problem

#### OSM Vector Tiles (Planetiler)
- **Status:** Ej genererade
- **Orsak:** Planetiler kräver extra dependencies:
  - lake_centerlines.shp.zip
  - water-polygons-split-3857.zip
  - natural_earth_vector.sqlite.zip
- **Lösning:** Kör med `--download` flagga eller generera utan

#### Demo A Export
- **Problem:** Anslutningen stängs under rendering (timeout)
- **Orsak:** Rendering tar för lång tid, timeout-värden för korta
- **Lösning:** Öka timeout (60s→180s för page.goto, 30s→60s för waitForFunction)

#### Demo B Mapnik Renderer
- **Problem:** XML-parsing varningar för Styles och Layers
- **Orsak:** Background-layer använde placeholder datasource
- **Status:** Fix implementerad (background-layer borttagen)

---

## Datapipeline - Genererade Filer

```
/data/
├── osm/
│   ├── sweden-latest.osm.pbf          (~751MB) ✓
│   └── stockholm_core.osm.pbf         (~3.3MB) ✓
├── dem/
│   └── manual/
│       └── stockholm_core_eudem.tif   (~2.1MB) ✓
├── terrain/
│   ├── hillshade/
│   │   └── stockholm_core_hillshade.tif  ✓
│   └── contours/
│       ├── stockholm_core_2m.geojson     ✓
│       ├── stockholm_core_10m.geojson    ✓
│       └── stockholm_core_50m.geojson    ✓
└── tiles/
    ├── osm/
    │   └── stockholm_core.mbtiles        ✗ (SAKNAS)
    ├── contours/
    │   ├── stockholm_core_2m.mbtiles     ✓
    │   ├── stockholm_core_10m.mbtiles    ✓
    │   └── stockholm_core_50m.mbtiles    ✓
    └── hillshade/
        └── stockholm_core/
            └── {z}/{x}/{y}.png           ✓ (tusentals tiles)
```

---

## Tekniska Beslut & Regler

### Konturer
- Genereras från DEM (EJ hillshade) - FIXAT
- Intervall: 2m, 10m, 50m
- **ALDRIG etiketter** (hård regel)

### Label Policy
- **Print mode:** Etiketter AV som standard (opt-in)
- **Screen mode:** Etiketter tillåtna
- **Konturer:** Aldrig etiketter (global regel)

### Determinism
- **Demo A:** Visuell stabilitet (minor pixeldiff OK pga GPU-rendering)
- **Demo B:** Byte-identisk output (samma input = samma SHA256)

### CRS
- EPSG:3857 överallt (Web Mercator)

---

## Stockholm-Specifika Optimeringar

### Terrängkaraktär
- Höjdspann: ~0-60m över havet
- Mestadels platt med mjuka sluttningar
- Vattendominerande (skärgård, sjöar, hav)

### Kontursynlighet
| Preset | 2m | 10m | 50m |
|--------|-----|-----|-----|
| stockholm_core | ✓ | ✓ | ✓ |
| stockholm_wide | ✗ | ✓ | ✓ |
| A1 outputs | ✗ | ✓ | ✓ |

---

## Kända Problem att Åtgärda

### Prioritet 1: Export Timeout
```
Demo A Exporter: Öka timeout-värden
Demo B Renderer: Verifiera XML-fix fungerar
```

### Prioritet 2: OSM Vector Tiles
```bash
# Kör med --download för att hämta dependencies
docker compose run --rm prep bash -c "java -Xmx4g -jar /app/bin/planetiler.jar \
  --osm-path=/data/osm/stockholm_core.osm.pbf \
  --output=/data/tiles/osm/stockholm_core.mbtiles \
  --minzoom=10 --maxzoom=15 \
  --bounds=17.9,59.32,18.08,59.35 \
  --download"
```

### Prioritet 3: Smoke Tests
```bash
chmod +x scripts/*.sh
./scripts/smoke_test.sh
```

---

## Snabbkommandon

### Starta Demo A
```bash
docker compose --profile demoA up -d
# Web UI: http://localhost:3000
```

### Starta Demo B
```bash
docker compose --profile demoB up -d demo-b-db
sleep 10
docker compose --profile demoB run --rm demo-b-importer stockholm_core
docker compose --profile demoB up -d
# Web UI: http://localhost:3001
```

### Testa Export (PowerShell)
```powershell
# Demo A
Invoke-WebRequest -Uri "http://localhost:8082/render?bbox_preset=stockholm_core&theme=paper&render_mode=print&dpi=150&width_mm=420&height_mm=594" -TimeoutSec 300 -OutFile "export_demo_a.png"

# Demo B
$body = @{bbox_preset='stockholm_core';theme='paper';render_mode='print';dpi=150;width_mm=420;height_mm=594;format='png'} | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:5000/render" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 300 -OutFile "export_demo_b.png"
```

---

## Dockerfile-Fixar som Gjorts

1. **prep-service/Dockerfile:**
   - GDAL: `ghcr.io/osgeo/gdal:ubuntu-small-3.8.0`
   - Planetiler: `/releases/latest/download/planetiler.jar`
   - Tippecanoe: default branch
   - Java: 17→21

2. **demo-a/exporter/Dockerfile:**
   - Borttagen Node.js-installation (Playwright har redan)
   - `npm ci --only=production` → `npm install --production`

3. **demo-b/importers/osm-importer/Dockerfile:**
   - GDAL: `ghcr.io/osgeo/gdal:ubuntu-small-3.8.0`

4. **demo-b/web/Dockerfile:**
   - `npm ci --only=production` → `npm install --production`

---

## Återstående Arbete

### Kort sikt (för fungerande exports)
1. [ ] Öka timeout i Demo A exporter
2. [ ] Verifiera Demo B Mapnik XML-fix
3. [ ] Testa export med mindre storlek först
4. [ ] Generera OSM vector tiles med Planetiler

### Medellång sikt
1. [ ] Implementera progress-indikatorer för långa jobb
2. [ ] Förbättra felhantering och logging
3. [ ] Lägg till caching för renders
4. [ ] Health checks på endpoints

### Långsikt
1. [ ] Full end-to-end smoke tests
2. [ ] Determinism-verifiering
3. [ ] Print-kvalitetsvalidering
4. [ ] Fler teman och bbox-presets

---

## Sammanfattning

**Vad fungerar:**
- All infrastruktur är byggd och konfigurerad
- DEM, hillshade och konturer är genererade
- Tiles för hillshade och konturer finns
- Alla services startar och svarar på rätt portar
- PostGIS har importerad OSM-data

**Vad behöver fixas:**
- OSM vector tiles saknas (Planetiler-beroenden)
- Export-timeout i båda demos
- Mapnik XML-varningar (fix implementerad, behöver testas)

**Uppskattad progress:** 75% klart

---

*Genererad 25 december 2025, kl. 22:00*
