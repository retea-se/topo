# Topo Map Export System - STATUS

**Datum:** 2025-12-26
**Status:** FUNGERANDE - Båda demo-apparna exporterar korrekt

---

## Snabbstart

```powershell
cd "C:\Users\marcu\OneDrive\Dokument\topo"

# Starta Demo A (WebGL/MapLibre)
docker compose --profile demoA up -d

# Starta Demo B (Mapnik/PostGIS)
docker compose --profile demoB up -d
```

---

## Webb-UI:er

| Demo | URL | Beskrivning |
|------|-----|-------------|
| Demo A | http://localhost:3000 | MapLibre karta med temabyte |
| Demo B | http://localhost:3001 | Formulär för Mapnik-export |

---

## Export-kommandon

### Demo A (Playwright screenshot)
```powershell
# A2 @ 150 DPI (2480x3508 px)
curl "http://localhost:8082/render?bbox_preset=stockholm_core&theme=paper&render_mode=print&dpi=150&width_mm=420&height_mm=594" -o export_a2_150.png

# A2 @ 300 DPI (4961x7016 px)
curl "http://localhost:8082/render?bbox_preset=stockholm_core&theme=paper&render_mode=print&dpi=300&width_mm=420&height_mm=594" -o export_a2_300.png

# A1 @ 150 DPI (3508x4961 px)
curl "http://localhost:8082/render?bbox_preset=stockholm_core&theme=paper&render_mode=print&dpi=150&width_mm=594&height_mm=841" -o export_a1_150.png
```

### Demo B (Mapnik render)
```powershell
# A2 @ 150 DPI
$body = '{"bbox_preset":"stockholm_core","theme":"paper","render_mode":"print","dpi":150,"width_mm":420,"height_mm":594,"format":"png"}'
curl -X POST "http://localhost:5000/render" -H "Content-Type: application/json" -d $body -o export_b_a2_150.png
```

---

## Verifierade Export-dimensioner

| Format | DPI | Förväntad | Demo A | Demo B |
|--------|-----|-----------|--------|--------|
| A2 | 150 | 2480x3508 | 2480x3508 | 2480x3507 |
| A4 | 72 | 595x842 | 595x842 | - |

---

## Vad som fixades (denna session)

### 1. Tile-URLs i Demo A (`demo-a/web/src/themeToStyle.js`)
**Problem:** Fel URL-format för Martin tileserver
```javascript
// FEL: url: `${tileserverUrl}/catalog/osm/tiles/{z}/{x}/{y}`
// RÄTT: url: `${tileserverUrl}/osm`  // TileJSON URL
```

### 2. Layer-filter i Demo A
**Problem:** Fel property-namn för OpenMapTiles schema
- `highway` -> `class` (transportation layer)
- `buildings` -> `building` (singular)
- `landuse` -> `park` source-layer

### 3. Contour tiles regenererade
**Problem:** Tippecanoe fick EPSG:3857 men förväntar EPSG:4326
**Fix:** Omprojektion med ogr2ogr innan tippecanoe

### 4. Demo B Mapnik hillshade style (`demo-b/renderer/src/theme_to_mapnik.py`)
**Problem:** Hillshade layer refererade till style som inte fanns
**Fix:** Lade till RasterSymbolizer style för hillshade

---

## Bakgrundsprocesser (körs)

| Process | Status | Beskrivning |
|---------|--------|-------------|
| hillshade-gen | Körs | Regenererar hillshade XYZ tiles |
| 2m contours | Körs | Genererar 2m kontur-tiles |

---

## Tjänsteportar

| Tjänst | Port | Status |
|--------|------|--------|
| Demo A Web | 3000 | OK |
| Martin Tileserver | 8080 | OK |
| Hillshade Server | 8081 | OK |
| Demo A Exporter | 8082 | OK |
| Demo B Web | 3001 | OK |
| Demo B API | 5000 | OK |
| Demo B Renderer | 5001 | OK |
| PostGIS | 5432 | OK |

---

## Data-status

| Komponent | Status | Storlek |
|-----------|--------|---------|
| OSM MBTiles | OK | 4 MB |
| Contours 10m | OK | 545k tiles |
| Contours 50m | OK | Genererad |
| Contours 2m | Genereras | ~20 min kvar |
| Hillshade tiles | Genereras | ~10 min kvar |
| PostGIS OSM | OK | 217k nodes |

---

## Kända begränsningar

1. **Hillshade tiles** genereras fortfarande - exports utan hillshade tills klart
2. **2m contours** genereras - endast 10m/50m visas tills klart
3. **Demo B Mapnik varningar** - XML-parsing varningar syns i loggar men påverkar inte output

---

## Export-filplacering

Exporterade filer sparas till:
- Docker: `/exports/` volume
- Lokalt: `exports/` katalog i repo

---

*Genererad: 2025-12-26*
