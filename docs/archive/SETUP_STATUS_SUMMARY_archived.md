# Topo Map Export System - Setup Status Summary

**Datum:** 2025-12-25
**Status:** Delvis klar - DEM och prep-pipeline genomförd, Demo A/B behöver komplettering

---

## ✅ Genomförda Steg

### STEG 1: DEM-filhantering ✓
- **Källfil:** `C:\Users\marcu\Downloads\2025-12-25-00_00_2025-12-25-23_59_DEM_COPERNICUS_30_DEM_(Raw).tiff`
- **CRS:** Ursprungligen EPSG:4326, reprojicerad till EPSG:3857 (Web Mercator)
- **Output:** `stockholm_core_eudem.tif` (LZW-komprimerad, ~2.1MB efter komprimering)
- **Plats:** `/data/dem/manual/stockholm_core_eudem.tif` i Docker-volymen `topo_data`
- **Verifiering:** ✓ Fil finns och är läsbar, CRS korrekt (EPSG:3857)

### STEG 2: Prep Pipeline ✓ (Delvis)
- **OSM Download:** ✓ `sweden-latest.osm.pbf` nedladdad (~751MB)
- **OSM Clip:** ✓ `stockholm_core.osm.pbf` genererad
- **DEM Download:** ✓ Verifierad från `/data/dem/manual/`
- **Hillshade:** ✓ `stockholm_core_hillshade.tif` genererad
- **Contours:** ✓ 3 nivåer genererade:
  - `stockholm_core_2m.geojson`
  - `stockholm_core_10m.geojson`
  - `stockholm_core_50m.geojson`
- **Contour Tiles:** ✓ MBTiles genererade för alla 3 nivåer (32KB var)
- **Hillshade Tiles:** ✓ XYZ PNG-tiles genererade (zoom 10-16)
- **OSM Tiles:** ✗ Ej genererade (Planetiler kräver extra dependencies: lake_centerlines, water_polygons, natural_earth)

### STEG 3: Demo A Setup ⚠️ (Delvis)
- **Build:** ✓ Alla services byggda
- **Start:** ✓ Services startade
- **Problem:** Tileserver (Martin) har konfigurationsproblem
  - Fel: `The --config and the connection parameters cannot be used together`
  - Status: Tileserver startar men avslutas med fel
  - Fix: Uppdaterad docker-compose.yml command, men fortfarande problem
- **Services som kör:**
  - `demo-a-web`: Port 3000 ✓
  - `demo-a-hillshade-server`: Port 8081 ✓
  - `demo-a-exporter`: Port 8082 ✓
  - `demo-a-tileserver`: Port 8080 ✗ (kraschar)

### STEG 4: Demo B Setup ⚠️ (Pågående)
- **Build:** ✓ Alla services byggda
- **Database:** ✓ PostGIS startad
- **OSM Import:** ⏳ Pågår eller timeout (10 min timeout satt, kan ta längre tid)
- **Services:** Ej startade ännu (väntar på OSM import)

---

## ❌ Kända Problem

### 1. Martin Tileserver Konfiguration
**Problem:** Martin-tileservern startar inte korrekt
**Felmeddelande:** `The --config and the connection parameters cannot be used together`
**Orsak:** Command-syntax i docker-compose.yml är felaktig
**Åtgärd krävs:**
- Kolla Martin v0.14.0 dokumentation för rätt command-syntax
- Antingen ta bort `--config` eller ändra till rätt format
- Alternativt: Använd environment variables istället för config-fil

### 2. OSM Vector Tiles (Planetiler)
**Problem:** OSM MBTiles saknas
**Orsak:** Planetiler kräver extra dependencies som inte nedladdats:
- `lake_centerline.shp.zip`
- `water-polygons-split-3857.zip`
- `natural_earth_vector.sqlite.zip`

**Åtgärd krävs:**
- Kör Planetiler med `--download` flagga för att ladda ner dependencies
- ELLER: Generera tiles utan dessa dependencies (kan ge sämre kvalitet)
- ELLER: Hoppa över OSM tiles för nu och använd bara contours + hillshade

### 3. OSM Import till PostGIS (Demo B)
**Status:** OSM import kan ta mycket tid (10+ minuter)
**Åtgärd krävs:**
- Vänta tills importen är klar
- Kontrollera logs: `docker compose --profile demoB logs demo-b-importer`
- Om timeout: Kör importen igen eller öka timeout-tid

---

## 📋 Nästa Steg Enligt Plan

### Prioritet 1: Fixa Tileserver (Demo A)
1. **Lös Martin-konfigurationsproblemet**
   - Kolla Martin dokumentation för rätt command-syntax
   - Testa olika command-format i docker-compose.yml
   - Verifiera att tileserver startar: `docker compose --profile demoA logs demo-a-tileserver`

2. **Verifiera Demo A Endpoints**
   - Web UI: http://localhost:3000 (ska fungera)
   - Tileserver: http://localhost:8080/catalog (behöver fixas)
   - Hillshade: http://localhost:8081/tiles/hillshade/stockholm_core/10/550/320.png (ska fungera)
   - Exporter API: http://localhost:8082/render (ska fungera)

### Prioritet 2: Slutför Demo B Setup
1. **Vänta på OSM Import**
   - Kontrollera status: `docker compose --profile demoB logs demo-b-importer`
   - När klar: Verifiera data: `docker compose --profile demoB exec demo-b-db psql -U postgres -d gis -c "SELECT COUNT(*) FROM planet_osm_polygon;"`

2. **Starta Demo B Services**
   ```bash
   docker compose --profile demoB up -d
   ```

3. **Verifiera Demo B Endpoints**
   - Web UI: http://localhost:3001
   - API: http://localhost:5000/health

### Prioritet 3: OSM Vector Tiles (Optional)
1. **Ladda ner Planetiler Dependencies**
   ```bash
   docker compose run --rm --entrypoint="" prep bash -c "java -Xmx4g -jar /app/bin/planetiler.jar --osm-path=/data/osm/stockholm_core.osm.pbf --output=/data/tiles/osm/stockholm_core.mbtiles --minzoom=10 --maxzoom=15 --bounds=17.9,59.32,18.08,59.35 --download"
   ```

2. **ELLER: Hoppa över för nu**
   - Demo A kan fungera med bara contours + hillshade (begränsad funktionalitet)
   - Demo B använder PostGIS direkt, behöver inte OSM tiles

### Prioritet 4: Smoke Tests & Verifiering
1. **Kör Smoke Test Script**
   ```bash
   chmod +x scripts/smoke_test.sh
   ./scripts/smoke_test.sh
   ```

2. **Testa Exports**
   - Demo A: `curl "http://localhost:8082/render?bbox_preset=stockholm_core&theme=paper&render_mode=print&dpi=150&width_mm=420&height_mm=594" -o export_demo_a.png`
   - Demo B: `curl -X POST "http://localhost:5000/render" -H "Content-Type: application/json" -d '{"bbox_preset":"stockholm_core","theme":"paper","render_mode":"print","dpi":150,"width_mm":420,"height_mm":594,"format":"png"}' -o export_demo_b.png`

3. **Verifiera Dimensioner**
   ```bash
   ./scripts/verify_export_dimensions.sh export_demo_a.png 420 594 150
   ```

### Prioritet 5: Determinism Test (Optional)
1. **Testa Determinism**
   ```bash
   ./scripts/test_determinism.sh demo-b stockholm_core paper 150 420 594
   ./scripts/test_determinism.sh demo-a stockholm_core paper 150 420 594
   ```

---

## 📁 Genererade Filer

### I Docker Volume `topo_data`:
```
/data/
├── osm/
│   ├── sweden-latest.osm.pbf          (~751MB) ✓
│   └── stockholm_core.osm.pbf         (~50-100MB) ✓
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
    │   └── stockholm_core.mbtiles        ✗ (saknas)
    ├── contours/
    │   ├── stockholm_core_2m.mbtiles     ✓
    │   ├── stockholm_core_10m.mbtiles    ✓
    │   └── stockholm_core_50m.mbtiles    ✓
    └── hillshade/
        └── stockholm_core/
            └── {z}/{x}/{y}.png           ✓ (tusentals tiles)
```

---

## 🔧 Tekniska Detaljer

### Ändringar Gjorda:
1. **prep-service/Dockerfile:** Uppdaterad Java version från 17 till 21 (krävs för Planetiler)
2. **docker-compose.yml:** Försökt fixa Martin command (behöver mer arbete)

### Docker Volumes:
- `topo_data`: Innehåller all prep-data (OSM, DEM, terrain, tiles)
- `topo_exports`: För export-filer (tomm nu)

### Portar:
- **Demo A:**
  - Web UI: 3000
  - Tileserver: 8080 (ej fungerande)
  - Hillshade: 8081
  - Exporter: 8082
- **Demo B:**
  - Web UI: 3001
  - API: 5000
  - Database: 5432 (internal)

---

## 🎯 Snabb Kommandoreferens

### Starta Demo A:
```bash
docker compose --profile demoA up -d
```

### Starta Demo B:
```bash
docker compose --profile demoB up -d demo-b-db
sleep 10
docker compose --profile demoB run --rm demo-b-importer stockholm_core
docker compose --profile demoB up -d
```

### Kontrollera Status:
```bash
# Demo A
docker compose --profile demoA ps
docker compose --profile demoA logs

# Demo B
docker compose --profile demoB ps
docker compose --profile demoB logs
```

### Testa Exports:
```bash
# Demo A
curl "http://localhost:8082/render?bbox_preset=stockholm_core&theme=paper&render_mode=print&dpi=150&width_mm=420&height_mm=594" -o export_demo_a.png

# Demo B
curl -X POST "http://localhost:5000/render" \
  -H "Content-Type: application/json" \
  -d '{"bbox_preset":"stockholm_core","theme":"paper","render_mode":"print","dpi":150,"width_mm":420,"height_mm":594,"format":"png"}' \
  -o export_demo_b.png
```

---

## ⚠️ Viktiga Noteringar

1. **OSM Tiles är valfria** - Systemet kan fungera med bara contours + hillshade för grundläggande funktionalitet
2. **OSM Import kan ta tid** - Vänta tålmodigt, första importen tar längst tid
3. **Martin Tileserver måste fixas** - Demo A behöver detta för full funktionalitet
4. **Timeout-hantering** - Använd PowerShell Jobs med timeout för långa operationer för att undvika att konversationen hänger sig

