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
Se avsnittet "Skaffa DEM-data" nedan eller `DEM_MANUAL_DOWNLOAD.md` för detaljer.

---

## Skaffa DEM-data (terrain)

DEM (Digital Elevation Model) krävs för hillshade och contours. Det finns två sätt att skaffa detta:

### Automatiserad nedladdning (rekommenderat)

Kräver Copernicus Data Space-konto (gratis registrering på https://dataspace.copernicus.eu/):

```powershell
# Windows (PowerShell)
$env:COPERNICUS_USERNAME = "din-email@example.com"
$env:COPERNICUS_PASSWORD = "ditt-lösenord"
.\scripts\prepare_dem_stockholm_wide.ps1
```

```bash
# Linux/Mac
export COPERNICUS_USERNAME="din-email@example.com"
export COPERNICUS_PASSWORD="ditt-lösenord"
./scripts/prepare_dem_stockholm_wide.sh
```

### Semi-automatiserad (manuell nedladdning)

1. Ladda ner EU-DEM från: https://land.copernicus.eu/imagery-in-situ/eu-dem/eu-dem-v1.1
2. Ladda ner tile **E40N40** (täcker Skandinavien)
3. Bearbeta med script:

```powershell
# Windows
.\scripts\prepare_dem_stockholm_wide.ps1 -InputFile "C:\Downloads\eu_dem_v11.tif"
```

```bash
# Linux/Mac
./scripts/prepare_dem_stockholm_wide.sh --input /path/to/downloaded.tif
```

### Efter DEM-installation

Generera terrain-data:

```powershell
.\scripts\build_stockholm_wide.ps1 -SkipOsm
```

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

---

## Bygga Svealand (full regional coverage)

För att generera data för svealand preseten (inkluderar Västerås, Uppsala, Örebro, etc.):

**OBS**: Svealand är ett stort område. Zoomnivåer är begränsade för att hantera datastorlek:
- Hillshade: z9-14 (istället för z10-16)
- Contours: z8-13 (istället för z10-16)

### Windows (PowerShell)

```powershell
# Kör från projektroten
.\scripts\build_svealand.ps1

# Med force-regenerering av alla filer
.\scripts\build_svealand.ps1 -Force

# Hoppa över OSM (om bara terrain behöver uppdateras)
.\scripts\build_svealand.ps1 -SkipOsm

# Dry-run (visa vad som skulle göras)
.\scripts\build_svealand.ps1 -DryRun
```

### Linux/Mac (Bash)

```bash
# Kör från projektroten
./scripts/build_svealand.sh

# Med force-regenerering av alla filer
./scripts/build_svealand.sh --force

# Hoppa över OSM (om bara terrain behöver uppdateras)
./scripts/build_svealand.sh --skip-osm

# Dry-run (visa vad som skulle göras)
./scripts/build_svealand.sh --dry-run
```

### Vad scriptet gör

1. Kontrollerar att Docker är igång
2. Bygger prep-service
3. Laddar ner/klipper OSM-data för svealand
4. Genererar OSM vector tiles
5. Kontrollerar DEM-data
6. Genererar hillshade
7. Genererar hillshade tiles (z9-14)
8. Extraherar höjdkurvor (2m, 10m, 50m)
9. Genererar contour vector tiles (z8-13)
10. Verifierar att alla filer skapades

### Efter build

```bash
# Starta om Demo A för att läsa in nya tiles
docker-compose --profile demoA down
docker-compose --profile demoA up -d

# Öppna Demo A med Svealand preset
# http://localhost:3000?bbox_preset=svealand
```

## Export Presets (Phase 9)

The system provides predefined export presets for common use cases:

| Preset | Format | Theme | DPI | Beskrivning |
|--------|--------|-------|-----|-------------|
| A2_Paper_v1 | A2 Landscape | paper | 150 | Klassisk vaggkarta |
| A3_Blueprint_v1 | A3 Landscape | blueprint-muted | 150 | Teknisk ritning (last) |
| A1_Terrain_v1 | A1 Portrait | gallery | 150 | Stor terrangkarta |
| A4_Quick_v1 | A4 Portrait | paper | 150 | Snabbutskrift |

### Preset-struktur

Varje preset definierar:
- **format** - Pappersformat (A0-A4)
- **DPI** - Upplosning (72-600)
- **theme** - Fargtema
- **layer visibility** - Vilka lager som visas
- **allowed bbox presets** - Tillåtna geografiska omraden
- **constraints** - Lasningar (DPI, format, tema, lager)

### API Endpoints

```bash
# Lista alla presets
curl http://localhost:3000/api/export-presets

# Hamta specifikt preset
curl http://localhost:3000/api/export-presets/A2_Paper_v1

# Validera preset med overrides
curl -X POST http://localhost:3000/api/validate-preset \
  -H "Content-Type: application/json" \
  -d '{"preset_id": "A2_Paper_v1", "overrides": {"dpi": 200}}'
```

### Constraint-system

Presets kan ha lasta falt:

| Constraint | Effekt |
|------------|--------|
| `dpi_locked` | DPI kan inte andras |
| `format_locked` | Format kan inte andras |
| `layers_locked` | Lager kan inte togglas |
| `bbox_locked` | Omrade kan inte andras |
| `theme_locked` | Tema kan inte andras |

**Exempel:** A3_Blueprint_v1 har `dpi_locked: true` och `format_locked: true` for deterministisk output.

---

## Print Editor (Interactive Map Editor)

**Åtkomst:** http://localhost:3000/editor

Print Editor är ett interaktivt verktyg för att skapa kartexporter med full kontroll över layout och innehåll.

### Funktioner

- **Område**: Välj preset (Stockholm Core/Wide, Svealand) eller rita custom bbox
- **Komposition**: Ange titel, undertitel och attribution
- **Tema**: Välj bland 9 färgteman
- **Lager**: Slå av/på hillshade, vatten, parker, vägar, byggnader, höjdkurvor
- **Export**: PNG (via Demo A), PDF/SVG (via Demo B)
- **Pappersformat**: A0-A4 + custom, Portrait/Landscape
- **Upplösning**: 72-600 DPI

### Hur man använder

1. **Öppna editorn**: http://localhost:3000/editor
2. **Välj område**: Använd Preset-dropdown eller klicka "Draw Bbox" för custom
3. **Anpassa komposition**: Fyll i titel och undertitel
4. **Välj stil**: Välj tema och aktivera/avaktivera lager
5. **Ställ in export**: Välj pappersformat, orientering, DPI och format
6. **Förhandsgranska**: Klicka "Preview" för att se print composition overlay
7. **Exportera**: Klicka "Export Map" och vänta (20-60 sekunder för PNG)

### Tips

- **Viewport bevaras**: Panorera och zooma fritt - positionen behålls även vid theme-byte
- **Skala visas**: Automatiskt beräknad skala baserat på bbox och pappersformat
- **Progress**: Export-modal visar status under rendering
- **Debug**: Öppna DevTools Console för att se `[Editor]` loggmeddelanden

### Felsökning

```bash
# Kontrollera exporter-hälsa
curl http://localhost:8082/health

# Lista befintliga exports
curl http://localhost:8082/exports

# Kontrollera Demo B (för PDF/SVG)
curl http://localhost:5000/health
```

---

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
| bbox_preset | stockholm_core, stockholm_wide, svealand | stockholm_core | Geografiskt område |
| custom_bbox | minLon,minLat,maxLon,maxLat | - | Custom bounding box (WGS84, komma-separerad) |
| theme | paper, ink, mono, dark, gallery, charcoal, warm-paper, blueprint-muted, muted-pastel | paper | Färgtema |
| render_mode | screen, print | screen | Renderingsläge |
| dpi | 72-600 | 150 | Upplösning |
| width_mm | valfritt | 420 | Bredd i mm |
| height_mm | valfritt | 594 | Höjd i mm |
| title | sträng | '' | Titel-text (visas i export) |
| subtitle | sträng | '' | Undertitel-text (visas i export) |
| attribution | sträng | '' | Attribution-text (visas i export) |
| layers | JSON-sträng | '{}' | Layer visibility: `'{"hillshade":true,"water":true,"roads":true,"buildings":true,"contours":true,"parks":true}'` |

### Custom Bounding Box

Använd `custom_bbox` för att exportera ett specifikt område utanför fördefinierade presets.

**Format:** `minLon,minLat,maxLon,maxLat` (WGS84 koordinater, komma-separerad)

**Exempel:**
```bash
# Exportera område runt Gamla Stan
curl "http://localhost:8082/render?custom_bbox=18.07,59.32,18.08,59.33&theme=gallery&dpi=300&width_mm=420&height_mm=594" \
  --output gamla_stan.png
```

**Notera:** Custom bbox kräver att tiles finns för det området. För stora områden kan vissa zoomnivåer saknas.

### Layer Visibility Control

Kontrollera vilka lager som ska visas i exporten med `layers`-parametern.

**Format:** JSON-sträng med boolean-värden för varje lager

**Tillgängliga lager:**
- `hillshade` - Terrängskyggning
- `water` - Vatten (sjöar, hav, vattendrag)
- `roads` - Vägar och gator
- `buildings` - Byggnader
- `contours` - Höjdkurvor
- `parks` - Parker och grönområden

**Exempel:**
```bash
# Exportera endast vägar och byggnader (ingen terrain)
curl "http://localhost:8082/render?bbox_preset=stockholm_core&theme=ink&layers=%7B%22roads%22%3Atrue%2C%22buildings%22%3Atrue%7D" \
  --output roads_buildings_only.png
```

**URL-encoded exempel:**
```
layers=%7B%22hillshade%22%3Afalse%2C%22contours%22%3Atrue%2C%22water%22%3Atrue%7D
```

Detta motsvarar JSON:
```json
{
  "hillshade": false,
  "contours": true,
  "water": true
}
```

### Title, Subtitle och Attribution

Lägg till text-element i exporten med `title`, `subtitle` och `attribution`-parametrarna.

**Exempel:**
```bash
curl "http://localhost:8082/render?bbox_preset=stockholm_core&theme=paper&title=Stockholm%20City&subtitle=Central%20Area&attribution=Map%20data%3A%20OpenStreetMap" \
  --output export_with_text.png
```

**Notera:** Text-rendering stöds i Print Editor UI. För API-anrop kan text behöva renderas separat i post-processing.

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
| bbox_preset | string | stockholm_core | Geografiskt område (stockholm_core, stockholm_wide, svealand) |
| theme | string | paper | Färgtema |
| render_mode | string | print | Renderingsläge |
| dpi | number | 150 | Upplösning |
| width_mm | number | 420 | Bredd i mm |
| height_mm | number | 594 | Höjd i mm |
| format | string | png | Exportformat (png, pdf) |

### Preset-begransningar

Varje preset har granser for DPI och format for att forhindra orimliga exports:

| Preset | Max DPI | Tillatna format |
|--------|---------|-----------------|
| stockholm_core | 600 | A4, A3, A2, A1, A0 |
| stockholm_wide | 300 | A4, A3, A2, A1 |
| svealand | 150 | A4, A3, A2 |

Om du forsker att exportera med ogiltig DPI eller format far du ett felmeddelande:

```json
{
  "error": "DPI 300 exceeds maximum 150 for preset 'svealand'. Reduce DPI or choose a smaller area.",
  "validation": {
    "valid": false,
    "error": "..."
  }
}
```

For mer information, se [PRESET_LIMITS.md](PRESET_LIMITS.md).

### Validerings-API

Du kan validera parametrar innan export:

```bash
curl -X POST "http://localhost:5000/validate" \
  -H "Content-Type: application/json" \
  -d '{"bbox_preset":"svealand","dpi":200,"width_mm":420,"height_mm":594}'
```

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
