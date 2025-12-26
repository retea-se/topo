# Användningsguide

## Snabbstart

### Starta systemet

```bash
cd "C:\Users\marcu\OneDrive\Dokument\topo"

# Starta båda demos
docker compose --profile demoA --profile demoB up -d
```

### Öppna webbgränssnitt

- **Demo A (MapLibre)**: http://localhost:3000
- **Demo B (Mapnik)**: http://localhost:3001

## Första gången - Dataförberedelse

Om du kör systemet för första gången behöver du generera data:

```bash
# Bygg prep-service
docker-compose build prep

# Ladda ner OSM-data för Sverige
docker-compose run --rm prep python3 /app/src/download_osm.py

# Klipp ut Stockholm-området
docker-compose run --rm prep python3 /app/src/clip_osm.py --preset stockholm_core

# Ladda in DEM (höjddata)
docker-compose run --rm prep python3 /app/src/download_dem.py --preset stockholm_core --provider local

# Generera hillshade
docker-compose run --rm prep python3 /app/src/generate_hillshade.py --preset stockholm_core

# Extrahera höjdkurvor
docker-compose run --rm prep python3 /app/src/extract_contours.py --preset stockholm_core

# Generera tiles
docker-compose run --rm prep /app/scripts/generate_hillshade_tiles.sh stockholm_core
docker-compose run --rm prep /app/scripts/generate_osm_tiles.sh stockholm_core
docker-compose run --rm prep /app/scripts/generate_contour_tiles.sh stockholm_core
```

**OBS**: DEM-data kräver manuell nedladdning. Se `DEM_MANUAL_DOWNLOAD.md` i projektets rot.

## Bygga full karttäckning

För att generera all data (OSM + terrain för båda presets):

### Entry-script (rekommenderat)

```powershell
# Windows (PowerShell)
.\scripts\build_full_coverage.ps1

# Med force-regenerering
.\scripts\build_full_coverage.ps1 -Force

# Dry-run
.\scripts\build_full_coverage.ps1 -DryRun
```

```bash
# Linux/Mac (Bash)
./scripts/build_full_coverage.sh

# Med force-regenerering
./scripts/build_full_coverage.sh --force
```

**OBS**: Terrain-lager (hillshade, contours) kräver DEM-data.
Se `DEM_MANUAL_DOWNLOAD.md` för instruktioner.

---

## Bygga Stockholm Wide (full förorts-coverage)

För att generera data för stockholm_wide preseten (inkluderar förorter):

### Windows (PowerShell)

```powershell
# Kör från projektroten
.\scripts\build_stockholm_wide.ps1

# Med force-regenerering av alla filer
.\scripts\build_stockholm_wide.ps1 -Force

# Hoppa över OSM (om bara terrain behöver uppdateras)
.\scripts\build_stockholm_wide.ps1 -SkipOsm

# Dry-run (visa vad som skulle göras)
.\scripts\build_stockholm_wide.ps1 -DryRun
```

### Linux/Mac (Bash)

```bash
# Kör från projektroten
./scripts/build_stockholm_wide.sh

# Med force-regenerering av alla filer
./scripts/build_stockholm_wide.sh --force

# Hoppa över OSM (om bara terrain behöver uppdateras)
./scripts/build_stockholm_wide.sh --skip-osm

# Dry-run (visa vad som skulle göras)
./scripts/build_stockholm_wide.sh --dry-run
```

### Vad scriptet gör

1. Kontrollerar att Docker är igång
2. Bygger prep-service
3. Laddar ner/klipper OSM-data för stockholm_wide
4. Genererar OSM vector tiles
5. Kontrollerar DEM-data
6. Genererar hillshade
7. Genererar hillshade tiles
8. Extraherar höjdkurvor (2m, 10m, 50m)
9. Genererar contour vector tiles
10. Verifierar att alla filer skapades

### Efter build

```bash
# Starta om Demo A för att läsa in nya tiles
docker-compose --profile demoA down
docker-compose --profile demoA up -d

# Öppna Demo A med Stockholm Wide preset
# http://localhost:3000?bbox_preset=stockholm_wide
```

## Använda Demo A (MapLibre)

### Webbgränssnitt

1. Öppna http://localhost:3000
2. Välj tema i dropdown-menyn
3. Välj område (bbox preset)
4. Välj render-läge (screen/print)
5. Använd layer toggles för att visa/dölja lager:
   - Hillshade (terrängskyggning)
   - Water (vatten)
   - Roads (vägar)
   - Buildings (byggnader)
   - Contours (höjdkurvor)
6. Panorera och zooma för att justera vyn
7. Klicka "Export" för att ladda ner

### Export via URL

```bash
curl "http://localhost:8082/render?bbox_preset=stockholm_core&theme=paper&render_mode=print&dpi=150&width_mm=420&height_mm=594" --output export.png
```

### URL-parametrar

| Parameter | Värden | Standard | Beskrivning |
|-----------|--------|----------|-------------|
| bbox_preset | stockholm_core, stockholm_wide | stockholm_core | Geografiskt område |
| theme | paper, ink, mono, dark, gallery, charcoal, warm-paper, blueprint-muted, muted-pastel | paper | Färgtema |
| render_mode | screen, print | screen | Renderingsläge |
| dpi | 72-600 | 150 | Upplösning |
| width_mm | valfritt | 420 | Bredd i mm |
| height_mm | valfritt | 594 | Höjd i mm |

## Använda Demo B (Mapnik)

### Webbgränssnitt

1. Öppna http://localhost:3001
2. Välj tema i dropdown-menyn
3. Välj område
4. Klicka "Render" för att generera och ladda ner

### Export via API

```bash
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
  }' --output export.png
```

### API-parametrar

| Parameter | Typ | Standard | Beskrivning |
|-----------|-----|----------|-------------|
| bbox_preset | string | stockholm_core | Geografiskt område |
| theme | string | paper | Färgtema |
| render_mode | string | print | Renderingsläge |
| dpi | number | 150 | Upplösning |
| width_mm | number | 420 | Bredd i mm |
| height_mm | number | 594 | Höjd i mm |
| format | string | png | Exportformat (png, pdf) |

## Vanliga exportpresets

### A2 Print (150 DPI)

```bash
# Demo A
curl "http://localhost:8082/render?bbox_preset=stockholm_core&theme=paper&render_mode=print&dpi=150&width_mm=420&height_mm=594" --output a2_150dpi.png

# Demo B
curl -X POST "http://localhost:5000/render" \
  -H "Content-Type: application/json" \
  -d '{"bbox_preset":"stockholm_core","theme":"paper","render_mode":"print","dpi":150,"width_mm":420,"height_mm":594,"format":"png"}' \
  --output a2_150dpi.png
```

Resultat: 2480 × 3508 px

### A2 Print (300 DPI)

```bash
# Demo A
curl "http://localhost:8082/render?bbox_preset=stockholm_core&theme=gallery&render_mode=print&dpi=300&width_mm=420&height_mm=594" --output a2_300dpi.png

# Demo B
curl -X POST "http://localhost:5000/render" \
  -H "Content-Type: application/json" \
  -d '{"bbox_preset":"stockholm_core","theme":"gallery","render_mode":"print","dpi":300,"width_mm":420,"height_mm":594,"format":"png"}' \
  --output a2_300dpi.png
```

Resultat: 4961 × 7016 px

### A1 Print (150 DPI)

```bash
# Demo A
curl "http://localhost:8082/render?bbox_preset=stockholm_wide&theme=ink&render_mode=print&dpi=150&width_mm=594&height_mm=841" --output a1_150dpi.png

# Demo B
curl -X POST "http://localhost:5000/render" \
  -H "Content-Type: application/json" \
  -d '{"bbox_preset":"stockholm_wide","theme":"ink","render_mode":"print","dpi":150,"width_mm":594,"height_mm":841,"format":"png"}' \
  --output a1_150dpi.png
```

Resultat: 3508 × 4961 px

## Välja rätt demo

### Använd Demo A när du:

- Vill utforska och experimentera snabbt
- Behöver interaktiv preview
- Vill testa olika perspektiv (pitch)
- Itererar på design

### Använd Demo B när du:

- Behöver final print-kvalitet
- Kräver exakt reproducerbarhet
- Exporterar för professionell tryck
- Behöver kartografisk korrekthet

## Felsökning

### Tjänster startar inte

```bash
# Kontrollera status
docker compose ps

# Visa loggar
docker compose logs demo-a-web
docker compose logs demo-b-api
```

### Inga tiles visas

```bash
# Kontrollera att tiles finns
docker compose run --rm prep ls -la /data/tiles/

# Regenerera tiles om nödvändigt
docker-compose run --rm prep /app/scripts/generate_osm_tiles.sh stockholm_core
```

### Export misslyckas

```bash
# Kontrollera exporter-tjänsten
curl http://localhost:8082/health

# För Demo B
curl http://localhost:5000/health
```

## Avancerat

### Visa alla tillgängliga teman

```bash
# Demo A
curl http://localhost:3000/api/themes

# Demo B
curl http://localhost:3001/api/themes
```

### Kontrollera tjänsternas status

```bash
# Alla portar
curl http://localhost:3000      # Demo A Web
curl http://localhost:8082/health  # Demo A Exporter
curl http://localhost:3001      # Demo B Web
curl http://localhost:5000/health  # Demo B API
```

### Stoppa systemet

```bash
docker compose --profile demoA --profile demoB down
```

### Rensa all data

```bash
docker compose --profile demoA --profile demoB down -v
```

**Varning**: Detta raderar alla tiles och exporterade bilder!

## Diagnostik-screenshots

För att ta automatiserade screenshots för verifiering:

### Windows (PowerShell)

```powershell
# Alla demos och presets
.\scripts\capture_screenshots.ps1

# Endast Demo A, Stockholm Wide, Gallery-tema
.\scripts\capture_screenshots.ps1 -Demo A -Preset wide -Theme gallery

# Endast Demo B, båda presets
.\scripts\capture_screenshots.ps1 -Demo B -Preset both
```

### Linux/Mac (Bash)

```bash
# Alla demos och presets
./scripts/capture_screenshots.sh

# Endast Demo A, Stockholm Wide, Gallery-tema
./scripts/capture_screenshots.sh --demo A --preset wide --theme gallery

# Endast Demo B, båda presets
./scripts/capture_screenshots.sh --demo B --preset both
```

Screenshots sparas i `exports/screenshots/` med namngivning:
- `demoA_{preset}_{mode}_{theme}_{timestamp}.png`
- `demoB_{preset}_{mode}_{theme}_{timestamp}.png`

Se `exports/screenshots/README.md` för detaljer.

## Filplatser

### Data (Docker volume)

| Typ | Sökväg (i container) |
|-----|---------------------|
| OSM PBF | `/data/osm/{preset}.osm.pbf` |
| OSM tiles | `/data/tiles/osm/{preset}.mbtiles` |
| Hillshade GeoTIFF | `/data/terrain/hillshade/{preset}_hillshade.tif` |
| Hillshade tiles | `/data/tiles/hillshade/{preset}/` |
| Contour GeoJSON | `/data/terrain/contours/{preset}_{interval}m.geojson` |
| Contour tiles | `/data/tiles/contours/{preset}_{interval}m.mbtiles` |

### Exports

| Typ | Sökväg |
|-----|--------|
| Exports | `exports/` |
| Screenshots | `exports/screenshots/` |
