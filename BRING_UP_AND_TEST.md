# Topo Map Export System - Bring-up & Smoke Test Guide

Detta dokument ger steg-för-steg instruktioner för att sätta upp och testa både Demo A och Demo B lokalt.

## Översikt över Portar

**Demo A:**
- Web UI: http://localhost:3000
- Tileserver (Martin): http://localhost:8080
- Hillshade server: http://localhost:8081
- Exporter API: http://localhost:8082

**Demo B:**
- Web UI: http://localhost:3001
- API: http://localhost:5000

---

## STEG 1: Preflight Checks

Kör dessa kommandon för att verifiera miljön:

```bash
# Verifiera Docker
docker --version
docker compose version

# Kontrollera diskutrymme (Mac/Linux)
df -h

# Windows (PowerShell)
Get-PSDrive C | Select-Object Used,Free

# Kontrollera att portar inte är upptagna (Mac/Linux)
lsof -i :3000 -i :3001 -i :5000 -i :8080 -i :8081 -i :8082 || echo "Portar verkar lediga"

# Windows (PowerShell)
netstat -an | findstr "3000 3001 5000 8080 8081 8082"

# Skapa volumes (om de inte redan finns)
docker compose create data exports 2>/dev/null || echo "Volumes redan skapade"
```

---

## STEG 2: Data Preparation (Prep Service)

### 2.1 Build Prep Service

```bash
docker compose build prep
```

### 2.2 Download OSM Data

```bash
# Ladda ner Geofabrik Sweden extract (~500MB)
docker compose run --rm prep python3 /app/src/download_osm.py
```

**Verifiering:**
```bash
docker compose run --rm prep ls -lh /data/osm/sweden-latest.osm.pbf
docker compose run --rm prep md5sum -c /data/osm/sweden-latest.osm.pbf.md5 || docker compose run --rm prep sh -c "md5sum /data/osm/sweden-latest.osm.pbf && cat /data/osm/sweden-latest.osm.pbf.md5"
```

### 2.3 Clip OSM to Stockholm Core

```bash
docker compose run --rm prep python3 /app/src/clip_osm.py --preset stockholm_core
```

**Verifiering:**
```bash
docker compose run --rm prep ls -lh /data/osm/stockholm_core.osm.pbf
# Förväntat: ~50-100MB fil
```

### 2.4 DEM: Kontrollera om fil finns

**VIKTIGT:** DEM-filen måste placeras manuellt innan du fortsätter.

```bash
# Kontrollera om DEM-filen redan finns
docker compose run --rm prep test -f /data/dem/manual/stockholm_core_eudem.tif && echo "✓ DEM-fil finns" || echo "✗ DEM-fil saknas"
```

**Om filen INTE finns:**
1. **STOPPA HÄR** och följ instruktionerna nedan
2. Se `DEM_MANUAL_DOWNLOAD.md` för detaljerade instruktioner

**Exakt filplats som behövs:**
- Filnamn: `stockholm_core_eudem.tif`
- Sökväg i containern: `/data/dem/manual/stockholm_core_eudem.tif`
- Måste vara i EPSG:3857 (Web Mercator)
- Storlek: ~50-200MB för clipped area

**Så här kopierar du in filen (välj ett alternativ):**

**Alternativ A: Via Docker volume (Linux/Mac):**
```bash
# Hitta volume path
docker volume inspect topo_data | grep Mountpoint

# Kopiera filen (använd rätt path från ovanstående)
sudo cp stockholm_core_eudem.tif /var/lib/docker/volumes/topo_data/_data/dem/manual/
```

**Alternativ B: Via docker cp (fungerar på alla system):**
```bash
# Skapa katalogstrukturen
docker compose run --rm prep mkdir -p /data/dem/manual

# Kopiera filen (kör från katalogen där din DEM-fil ligger)
docker cp stockholm_core_eudem.tif $(docker compose ps -q prep 2>/dev/null || docker compose run -d --rm prep sleep 3600 | head -1):/data/dem/manual/

# Om ovanstående inte fungerar, prova detta:
CONTAINER_ID=$(docker compose run -d --rm prep sleep 3600)
docker cp stockholm_core_eudem.tif $CONTAINER_ID:/data/dem/manual/
docker compose run --rm prep ls -lh /data/dem/manual/stockholm_core_eudem.tif
docker stop $CONTAINER_ID
```

**Alternativ C: Bind mount (för utveckling):**
1. Skapa lokal katalog: `mkdir -p ./local_data/dem`
2. Kopiera din DEM-fil dit: `cp stockholm_core_eudem.tif ./local_data/dem/`
3. Redigera `docker-compose.yml` och lägg till under `prep` service volumes:
   ```yaml
   volumes:
     - data:/data
     - ./local_data/dem:/data/dem/manual:ro
   ```

**Efter att filen är på plats, verifiera:**
```bash
docker compose run --rm prep ls -lh /data/dem/manual/stockholm_core_eudem.tif
docker compose run --rm prep gdalinfo /data/dem/manual/stockholm_core_eudem.tif | grep -i "PROJCS\|EPSG\|3857\|Pseudo-Mercator" || echo "Varning: Verifiera att CRS är EPSG:3857"
```

**När filen är på plats, fortsätt:**
```bash
docker compose run --rm prep python3 /app/src/download_dem.py --preset stockholm_core --provider local
```

**Verifiering:**
```bash
docker compose run --rm prep ls -lh /data/dem/*/stockholm_core_eudem.tif
```

### 2.5 Generate Hillshade

```bash
docker compose run --rm prep python3 /app/src/generate_hillshade.py --preset stockholm_core
```

**Verifiering:**
```bash
docker compose run --rm prep ls -lh /data/terrain/hillshade/stockholm_core_hillshade.tif
docker compose run --rm prep gdalinfo /data/terrain/hillshade/stockholm_core_hillshade.tif | grep -i "Data axis\|Band"
# Förväntat: Single band, grayscale
```

### 2.6 Extract Contours

```bash
docker compose run --rm prep python3 /app/src/extract_contours.py --preset stockholm_core
```

**Verifiering:**
```bash
docker compose run --rm prep ls -lh /data/terrain/contours/stockholm_core_*.geojson
# Förväntat: 3 filer: stockholm_core_2m.geojson, stockholm_core_10m.geojson, stockholm_core_50m.geojson
```

### 2.7 Generate Tiles

```bash
# Hillshade XYZ tiles (PNG)
docker compose run --rm prep /app/scripts/generate_hillshade_tiles.sh stockholm_core

# OSM vector tiles (MBTiles via Planetiler)
docker compose run --rm prep /app/scripts/generate_osm_tiles.sh stockholm_core

# Contour vector tiles (MBTiles via Tippecanoe)
docker compose run --rm prep /app/scripts/generate_contour_tiles.sh stockholm_core
```

**Verifiering:**
```bash
docker compose run --rm prep ls -lh /data/tiles/osm/stockholm_core.mbtiles
docker compose run --rm prep ls -lh /data/tiles/contours/stockholm_core_*.mbtiles
docker compose run --rm prep ls -ld /data/tiles/hillshade/stockholm_core/
docker compose run --rm prep find /data/tiles/hillshade/stockholm_core -name "*.png" | wc -l
# Förväntat: > 0 hillshade tiles
```

---

## STEG 3: Starta Demo A

### 3.1 Build Demo A Services

```bash
docker compose --profile demoA build
```

### 3.2 Start Demo A Stack

```bash
docker compose --profile demoA up -d
```

### 3.3 Vänta på att Services blir Ready

```bash
# Vänta 10 sekunder
sleep 10

# Kontrollera att alla services kör
docker compose --profile demoA ps

# Kolla logs för eventuella fel
docker compose --profile demoA logs --tail=50
```

### 3.4 Verifiera Demo A Endpoints

```bash
# Tileserver
curl -I http://localhost:8080/catalog
# Förväntat: HTTP 200 eller 404 (404 är OK om catalog inte finns)

# Hillshade server
curl -I http://localhost:8081/tiles/hillshade/stockholm_core/10/550/320.png
# Förväntat: HTTP 200 eller 404 (beroende på zoom level)

# Web app
curl -I http://localhost:3000
# Förväntat: HTTP 200
```

---

## STEG 4: Starta Demo B

### 4.1 Build Demo B Services

```bash
docker compose --profile demoB build
```

### 4.2 Start Demo B Database Först

```bash
docker compose --profile demoB up -d demo-b-db

# Vänta på att databasen startar
sleep 10

# Verifiera att databasen är redo
docker compose --profile demoB exec demo-b-db pg_isready -U postgres
```

### 4.3 Import OSM Data till PostGIS

```bash
docker compose --profile demoB run --rm demo-b-importer stockholm_core
```

**Detta kan ta flera minuter.** Vänta tills kommandot är klart.

**Verifiering:**
```bash
docker compose --profile demoB exec demo-b-db psql -U postgres -d gis -c "SELECT COUNT(*) FROM planet_osm_polygon;"
# Förväntat: > 0 rows (ofta tusentals)
```

### 4.4 Start Alla Demo B Services

```bash
docker compose --profile demoB up -d
```

### 4.5 Vänta på Ready och Verifiera

```bash
sleep 10
docker compose --profile demoB ps
docker compose --profile demoB logs --tail=50

# Test API health
curl http://localhost:5000/health || echo "API inte redo än"

# Test web app
curl -I http://localhost:3001
# Förväntat: HTTP 200
```

---

## STEG 5: Smoke Tests

### 5.1 Kör Smoke Test Script

```bash
chmod +x scripts/smoke_test.sh
./scripts/smoke_test.sh
```

### 5.2 Om Smoke Test Fails: Kör Diagnostik

```bash
chmod +x scripts/diagnose_common_failures.sh
./scripts/diagnose_common_failures.sh
```

**Vanliga problem och fixar:**

**Problem 1: DEM-fil saknas**
- **Rotorsak:** Filen `/data/dem/manual/stockholm_core_eudem.tif` finns inte
- **Fix:** Följ instruktionerna i STEG 2.4 ovan för att kopiera in filen

**Problem 2: Tileserver returnerar 404**
- **Rotorsak:** MBTiles-filer saknas eller Martin config är fel
- **Fix:**
  ```bash
  # Verifiera att MBTiles finns
  docker compose run --rm prep ls -lh /data/tiles/osm/stockholm_core.mbtiles

  # Om filen saknas, kör tile generation igen (STEG 2.7)
  # Kolla logs
  docker compose --profile demoA logs demo-a-tileserver
  ```

**Problem 3: PostGIS är tomt**
- **Rotorsak:** OSM import kördes inte eller misslyckades
- **Fix:**
  ```bash
  # Kör import igen
  docker compose --profile demoB run --rm demo-b-importer stockholm_core

  # Kolla logs
  docker compose --profile demoB logs demo-b-importer
  ```

---

## STEG 6: First Export - Demo A

```bash
# Export A2 at 150 DPI (snabbare för test)
curl "http://localhost:8082/render?bbox_preset=stockholm_core&theme=paper&render_mode=print&dpi=150&width_mm=420&height_mm=594" \
  --output export_demo_a.png

# Verifiera att filen skapades
ls -lh export_demo_a.png
file export_demo_a.png

# Verifiera dimensioner (kräver ImageMagick eller Docker)
chmod +x scripts/verify_export_dimensions.sh
./scripts/verify_export_dimensions.sh export_demo_a.png 420 594 150 || echo "ImageMagick behövs för verifiering"
```

**Förväntade dimensioner:** 2480 x 3508 pixels (420mm x 594mm @ 150 DPI)

---

## STEG 7: First Export - Demo B

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

# Verifiera
ls -lh export_demo_b.png
file export_demo_b.png

# Verifiera dimensioner
./scripts/verify_export_dimensions.sh export_demo_b.png 420 594 150 || echo "ImageMagick behövs"
```

---

## STEG 8: Determinism Test (Optional)

### 8.1 Demo B (Mapnik - bör vara byte-identisk)

```bash
chmod +x scripts/test_determinism.sh
./scripts/test_determinism.sh demo-b stockholm_core paper 150 420 594
```

**Förväntat:** Alla 3 exports har identisk SHA256 hash

### 8.2 Demo A (Playwright - visuell stabilitet accepteras)

```bash
./scripts/test_determinism.sh demo-a stockholm_core paper 150 420 594
```

**Förväntat:** Exports kan skilja sig något (visuell stabilitet är målet, inte byte-identitet)

**Om exports inte matchar (Demo B):**
- **Sannolika orsaker:**
  1. Fonts: Olika font-rendering
  2. Metadata: PNG metadata innehåller timestamps
  3. Tiles timing: Tiles kan ha genererats vid olika tidpunkter
  4. Random operations: Någon random operation i Mapnik render

**Fixar:**
- Normalisera PNG för jämförelse: `./scripts/normalize_png.sh export1.png export1_normalized.png`
- Kontrollera Mapnik config för determinism (se DETERMINISM.md)

---

## STEG 9: URL:er för Grafisk Test

### Demo A
- **Web UI:** http://localhost:3000
- **Tileserver:** http://localhost:8080/catalog (för Martin catalog)
- **Hillshade tiles:** http://localhost:8081/tiles/hillshade/stockholm_core/{z}/{x}/{y}.png
- **Export API:** http://localhost:8082/render?bbox_preset=stockholm_core&theme=paper&render_mode=print&dpi=150&width_mm=420&height_mm=594

### Demo B
- **Web UI:** http://localhost:3001
- **API:** http://localhost:5000/render (POST)
- **Health check:** http://localhost:5000/health

---

## STEG 10: Grafisk Test Checklista

Öppna båda web UIs i din browser och testa:

### Demo A (http://localhost:3000)
- [ ] Karta laddas och visar Stockholm-området
- [ ] Theme-switcher: byt mellan themes (paper, charcoal, dark, etc.)
- [ ] Bbox preset: växla mellan stockholm_core och stockholm_wide (om tillgängligt)
- [ ] Layers: toggla hillshade, contours, buildings
- [ ] Export: köra export i print-läge (A2, 150 DPI)
- [ ] Kontrollera att inga kontur-labels syns på kartan eller i exporten

### Demo B (http://localhost:3001)
- [ ] Karta laddas och visar Stockholm-området
- [ ] Formulär: fyll i theme, bbox preset, render mode, DPI, dimensioner
- [ ] Export: köra export via formulär
- [ ] Kontrollera att inga kontur-labels syns
- [ ] Testa olika themes (paper, charcoal, etc.)

### Verifiering i Exporten
- [ ] Background color matchar theme
- [ ] Hillshade är synlig (subtile shading)
- [ ] Water bodies syns
- [ ] Parks/landuse syns
- [ ] Roads syns (både stora och små)
- [ ] Buildings syns
- [ ] Contours syns **utan labels**
- [ ] Inga uppenbara rendering artifacts
- [ ] Bilden är centrerad på Stockholm-området
- [ ] Pixel-dimensioner är korrekta (2480x3508 för A2 @ 150 DPI)

---

## Snabb Referens: Alla Kommandon i Ordning

```bash
# 1. Preflight
docker --version && docker compose version

# 2. Build prep
docker compose build prep

# 3. OSM
docker compose run --rm prep python3 /app/src/download_osm.py
docker compose run --rm prep python3 /app/src/clip_osm.py --preset stockholm_core

# 4. DEM (STOPPA HÄR om fil saknas - se instruktioner ovan)
docker compose run --rm prep python3 /app/src/download_dem.py --preset stockholm_core --provider local

# 5. Terrain
docker compose run --rm prep python3 /app/src/generate_hillshade.py --preset stockholm_core
docker compose run --rm prep python3 /app/src/extract_contours.py --preset stockholm_core

# 6. Tiles
docker compose run --rm prep /app/scripts/generate_hillshade_tiles.sh stockholm_core
docker compose run --rm prep /app/scripts/generate_osm_tiles.sh stockholm_core
docker compose run --rm prep /app/scripts/generate_contour_tiles.sh stockholm_core

# 7. Demo A
docker compose --profile demoA build
docker compose --profile demoA up -d

# 8. Demo B
docker compose --profile demoB build
docker compose --profile demoB up -d demo-b-db
sleep 10
docker compose --profile demoB run --rm demo-b-importer stockholm_core
docker compose --profile demoB up -d

# 9. Smoke tests
chmod +x scripts/*.sh
./scripts/smoke_test.sh

# 10. Exports
curl "http://localhost:8082/render?bbox_preset=stockholm_core&theme=paper&render_mode=print&dpi=150&width_mm=420&height_mm=594" -o export_demo_a.png
curl -X POST "http://localhost:5000/render" -H "Content-Type: application/json" -d '{"bbox_preset":"stockholm_core","theme":"paper","render_mode":"print","dpi":150,"width_mm":420,"height_mm":594,"format":"png"}' -o export_demo_b.png

# 11. Determinism (optional)
./scripts/test_determinism.sh demo-b stockholm_core paper 150 420 594
./scripts/test_determinism.sh demo-a stockholm_core paper 150 420 594
```

---

## Troubleshooting

Om något misslyckas, kör diagnostik:

```bash
./scripts/diagnose_common_failures.sh
```

**Vanliga problem:**

1. **DEM saknas:** Se STEG 2.4 ovan
2. **Portar upptagna:** Stoppa andra services eller ändra portar i docker-compose.yml
3. **Diskutrymme slut:** Frigör utrymme eller öka Docker disk quota
4. **Services startar inte:** Kolla logs: `docker compose --profile demoA logs` eller `docker compose --profile demoB logs`
5. **Tileserver 404:** Verifiera MBTiles finns och Martin config
6. **PostGIS tom:** Kör OSM import igen

**Logs att kolla:**
- Demo A: `docker compose --profile demoA logs -f`
- Demo B: `docker compose --profile demoB logs -f`
- Prep service: `docker compose logs prep`
- Specifik service: `docker compose --profile demoA logs demo-a-tileserver`

---

## Nästa Steg

Efter att allt fungerar:
1. Testa olika themes
2. Testa olika bbox presets (stockholm_wide)
3. Testa högre DPI (300 DPI för print quality)
4. Verifiera determinism (särskilt för Demo B)
5. Gör visuell inspektion av exports
6. Jämför output mellan Demo A och Demo B



