---
name: ""
overview: ""
todos: []
---

---name: Topo Map Export Systemoverview: "Bygger ett Docker-baserat system med två parallella implementationer (Demo A: WebGL/Vector Tiles, Demo B: Server-side rendering) för att skapa högkvalitativa topo-inspirerade kartbilder av Stockholm som väggkonst, med theme-system, topografidata (hillshade + konturer), OSM-byggnader, och export med exakt kontroll över DPI och fysisk storlek."todos:

- id: docker-setup

content: Skapa docker-compose.yml med profiler (demoA, demoB) och volymer för data-persistensstatus: pending

- id: prep-service

content: Implementera prep-service för att ladda ner Geofabrik .osm.pbf, klippa lokalt, ladda DEM via abstraktionslager (EU-DEM default), generera hillshade och extrahera konturlinjerstatus: pendingdependencies:

    - docker-setup
- id: theme-system

content: Skapa JSON-baserat theme-system med 5 themes (Paper, Ink, Mono, MutedPastel, Dark) inklusive metadata-block och kontur-styling constraint (inga höjdetiketter)status: pending

- id: demo-a-tiles

content: Bygg tile-generator och tileserver för Demo A (MBTiles från klippt .osm.pbf, konturer som vector tiles, raster tiles för hillshade)status: pendingdependencies:

    - prep-service
- id: demo-a-web

content: Implementera MapLibre-baserad webapp med theme switcher, bbox presets (stockholm_core, stockholm_wide) + custom override, render_mode selector, och layer togglesstatus: pendingdependencies:

    - demo-a-tiles
    - theme-system
- id: demo-a-export

content: Bygg Playwright-baserad export service för headless rendering till PNG med render_mode support (print: labels avstängda som default, endast via opt-in; tunnare strokes, strikt DPI; screen: labels tillåtna, preview-optimering)status: pendingdependencies:

    - demo-a-web
- id: demo-b-db

content: Sätt upp PostGIS och implementera OSM-import via osm2pgsql från klippt .osm.pbfstatus: pendingdependencies:

    - prep-service
- id: demo-b-terrain

content: Bygg terrain-processor via DEM-abstraktionslager för DEM → GeoTIFF, hillshade med fasta ljusparametrar (Azimuth 315°, Altitude 45°) och konturlinjer med GDALstatus: pendingdependencies:

    - prep-service
- id: demo-b-renderer

content: Implementera Mapnik-renderer med theme-to-XML konvertering och stöd för DPI/fysisk storlekstatus: pendingdependencies:

    - demo-b-db
    - demo-b-terrain
    - theme-system
- id: demo-b-api

content: Bygg Flask/FastAPI med /render endpoint för deterministisk export till PNG/PDFstatus: pendingdependencies:

    - demo-b-renderer
- id: demo-b-web

content: Skapa enkel web UI för theme-val och export-parametrar som anropar APIstatus: pendingdependencies:

    - demo-b-api
- id: testing

content: Testa båda demos med A2/A1 export och validera kvalitet och determinismstatus: pendingdependencies:

    - demo-a-export
    - demo-b-web

---

# Topo Map Export System - Implementation Plan

## Systemöversikt

Systemet består av två parallella implementationer som delar gemensam infrastruktur för datahantering och theme-system, men använder olika renderingstekniker för export.

## Arkitektur

### Delad infrastruktur

**Data Preparation Service** (`prep-service/`)

- Laddar ner regional .osm.pbf (Geofabrik Sweden extract) som single source of truth
- Klipper .osm.pbf lokalt till konfigurerad Stockholm bounding box
- Datahämtning är reproducerbar, offline-capable efter initial download, och deterministisk
- Laddar ner DEM-data via abstraktionslager (EU-DEM som default fallback, ~25m upplösning)
- Genererar hillshade från DEM med GDAL med fasta, deterministiska ljusparametrar:
- Azimuth: 315° (nordväst)
- Altitude: 45°
- Ljusparametrar är fixa, konsekventa över alla themes, identiska mellan Demo A och Demo B
- Hillshade-generering prioriterar: generalisering, kontrast, visuellt djup (inte analytisk noggrannhet)
- Extraherar konturlinjer (5m, 25m, 100m intervall)
- Named bbox presets: `stockholm_core`, `stockholm_wide` (med möjlighet till custom override)

**Theme System** (`themes/`)

- JSON-baserade theme-definitioner
- Struktur: `{ name, background, meta: { intended_scale, label_density, mood }, layers: { water, parks, roads, buildings, contours, hillshade } }`
- Themes: Paper, Ink, Mono, MutedPastel, Dark
- Metadata-block är informativt och framtidsriktat (påverkar inte rendering direkt)
- Delas mellan Demo A och Demo B

**Docker Compose** (`docker-compose.yml`)

- Profiler: `demoA`, `demoB`
- Volymer för data-persistens
- Nätverk för service-kommunikation

### Demo A: WebGL / Vector Tiles

**Ansvar och syfte:**

- Design-iteration och visuell experimentering
- Snabb visuell feedback och tema-testning
- WebGL-baserad rendering för interaktiv preview
- Fokus på kreativ frihet och visuell utforskning

**Komponenter:**

1. **Tile Generator** (`demo-a/tile-generator/`)

- Bygger MBTiles från klippt .osm.pbf med Planetiler eller Tippecanoe
- Genererar vector tiles för byggnader, vägar, vatten, parker
- Genererar vector tiles för konturlinjer (generaliserade per zoom level)
- Hillshade som raster tiles (PNG, 256x256)

2. **Tile Server** (`demo-a/tileserver/`)

- Serve:ar MBTiles via TileServer GL eller Martin
- Serve:ar hillshade raster tiles
- Serve:ar konturlinjer **endast som vector tiles** (generaliserade per zoom level)
- **Hård constraint:** Konturer i Demo A får ALDRIG serveras som GeoJSON. Endast vector tiles är tillåtna.

3. **Web Application** (`demo-a/web/`)

- MapLibre GL JS-baserad karta
- Theme switcher
- Bbox selector med named presets (stockholm_core, stockholm_wide) + custom override
- Layer toggles (byggnader, konturer, hillshade)
- Render mode selector: "screen" | "print"
- Export-knapp som triggar Playwright

4. **Export Service** (`demo-a/exporter/`)

- Playwright-baserad headless Chromium
- Render route: `/render?bbox=...&theme=...&render_mode=...&dpi=...&width_mm=...&height_mm=...`
- Render mode "print": **labels avstängda som default**, endast aktiverade via explicit opt-in; tunnare strokes, strikt DPI-math, inga interaktiva artefakter
- Render mode "screen": labels tillåtna, optimerat för preview och interaktion
- Sätter canvas-storlek: `mm × (DPI / 25.4)`
- Väntar på tile loading + font loading
- Screenshot → PNG
- Sparar i `/exports/`

**Teknisk stack:**

- Node.js/TypeScript för webapp och exporter
- MapLibre GL JS för rendering
- Playwright för headless export
- TileServer GL eller Martin för tile serving

### Demo B: Server-side Rendering

**Ansvar och syfte:**

- Print-kvalitet output för A2/A1-format
- Strikt determinism och reproducerbarhet
- Server-side rendering för maximal kontroll över output
- Fokus på exakt layout, DPI-kontroll och print-optimering

**Komponenter:**

1. **Database** (`demo-b/db/`)

- PostGIS container
- OSM-data importeras via osm2pgsql
- Spatial indexes för prestanda

2. **Data Importers** (`demo-b/importers/`)

- `osm-importer/`: osm2pgsql pipeline för klippt .osm.pbf → PostGIS
- `terrain-processor/`: GDAL pipeline via DEM-abstraktionslager → GeoTIFF, hillshade, contours
- Hillshade-generering använder fasta ljusparametrar: Azimuth 315°, Altitude 45° (identiskt med Demo A)
- DEM-abstraktionslager möjliggör byte av källa (EU-DEM default, högre upplösning som optional upgrade)

3. **Renderer** (`demo-b/renderer/`)

- Mapnik som primär renderer (valt för print-kvalitet)
- **Fast render CRS:** EPSG:3857 (default, explicit konfigurerad)
- CRS måste vara explicit konfigurerad och konsekvent över alla renders
- Alternativ CRS tillåten endast via explicit konfiguration, inte implicit
- Renderer-lager är utbytbart (Mapnik ↔ PyQGIS) - arkitektonisk constraint, inte implementation-krav
- Theme-to-renderer translation är abstraherad
- Layout-logik (margins, DPI, size) är renderer-agnostisk
- XML-stilfiler som genereras från theme JSON
- Lagerordning: bakgrund → hillshade → vatten → parker → vägar → byggnader → konturer
- Stöd för DPI, fysisk storlek, marginaler, render_mode

4. **API** (`demo-b/api/`)

- Flask/FastAPI backend
- `/render` endpoint: `POST /render { bbox_preset | bbox, theme, render_mode, dpi, width_mm, height_mm, margins }`
- Render mode "print": **labels avstängda som default**, endast aktiverade via explicit opt-in; tunnare strokes, strikt DPI-math
- Render mode "screen": labels tillåtna, optimerat för preview och interaktion
- Returnerar PNG eller PDF
- Deterministic rendering (samma input → samma output)

5. **Web UI** (`demo-b/web/`)

- Enkel React/Vue UI för theme-val och export-parametrar
- Preview-funktion (lågupplöst)
- Export-triggar API-anrop

**Teknisk stack:**

- Python (Flask/FastAPI) för API
- PostGIS för geodata
- Mapnik + Python bindings för rendering
- GDAL för terrain processing

## Filstruktur

```javascript
topo/
├── docker-compose.yml
├── README.md
├── themes/
│   ├── paper.json
│   ├── ink.json
│   ├── mono.json
│   ├── muted-pastel.json
│   └── dark.json
├── prep-service/
│   ├── Dockerfile
│   ├── download_osm.py
│   ├── download_dem.py
│   ├── generate_hillshade.py
│   └── extract_contours.py
├── demo-a/
│   ├── docker-compose.demo-a.yml
│   ├── tile-generator/
│   │   ├── Dockerfile
│   │   ├── generate_tiles.sh (OSM + contours as vector tiles)
│   │   └── config.json
│   ├── tileserver/
│   │   ├── Dockerfile
│   │   └── config.json
│   ├── web/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── Map.tsx
│   │   │   ├── ThemeSelector.tsx
│   │   │   └── ExportDialog.tsx
│   │   └── public/
│   └── exporter/
│       ├── Dockerfile
│       ├── package.json
│       └── src/export.ts
├── demo-b/
│   ├── docker-compose.demo-b.yml
│   ├── db/
│   │   └── init.sql
│   ├── importers/
│   │   ├── osm-importer/
│   │   │   ├── Dockerfile
│   │   │   └── import.sh
│   │   └── terrain-processor/
│   │       ├── Dockerfile
│   │       └── process_terrain.sh
│   ├── renderer/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── render.py (renderer-agnostic interface)
│   │   ├── theme_to_mapnik.py (Mapnik implementation)
│   │   └── renderer_interface.py (abstraction for Mapnik ↔ PyQGIS)
│   ├── api/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── app.py
│   │   └── render_service.py
│   └── web/
│       ├── Dockerfile
│       ├── package.json
│       └── src/
└── exports/
    └── .gitkeep
```



## Implementation-steg

### Fas 1: Grundinfrastruktur

1. Skapa Docker Compose med profiler
2. Implementera prep-service för datahämtning (Geofabrik .osm.pbf + local clipping)
3. Implementera DEM-abstraktionslager (EU-DEM som default)
4. Skapa theme-system (JSON-struktur + 5 themes med metadata-block)
5. Definiera bbox presets (stockholm_core, stockholm_wide)
6. Testa datahämtning för Stockholm-område (reproducerbar, deterministisk)

### Fas 2: Demo A Implementation

1. Tile generator (klippt .osm.pbf → MBTiles, konturer som vector tiles)
2. Tile server setup (MBTiles + hillshade raster + kontur vector tiles - ALDRIG GeoJSON för konturer)
3. Webapp med MapLibre + theme switcher + bbox presets + render_mode selector
4. Export service med Playwright (render_mode support: print vs screen)
5. Integrationstest: full export pipeline med determinism-validering

### Fas 3: Demo B Implementation

1. PostGIS setup + OSM import (från klippt .osm.pbf)
2. Terrain processor (via DEM-abstraktionslager → hillshade + contours)
3. Renderer-interface (abstraktion för Mapnik ↔ PyQGIS)
4. Mapnik renderer med theme support + render_mode + explicit CRS (EPSG:3857 default)
5. API endpoint för rendering (bbox presets + render_mode support + CRS-konfiguration)
6. Web UI för export (presets + render_mode selector)
7. Integrationstest: full export pipeline med determinism-validering

### Fas 4: Polish & Dokumentation

1. Optimering av rendering-prestanda
2. Validering av export-kvalitet (A2/A1)
3. README med instruktioner
4. Exempel-exports

## Design-beslut

**Theme-struktur:**

```json
{
  "name": "Paper",
  "background": "#faf8f5",
  "meta": {
    "intended_scale": "A2",
    "label_density": "low",
    "mood": "calm"
  },
  "hillshade": { "opacity": 0.15, "blend": "multiply" },
  "water": { "fill": "#d4e4f0", "stroke": "#a8c5d8", "strokeWidth": 0.5 },
  "parks": { "fill": "#e8f0e0", "stroke": "#c8d8b8", "strokeWidth": 0.3 },
  "roads": { "stroke": "#8a8a8a", "strokeWidth": { "major": 1.5, "minor": 0.8 } },
  "buildings": { "fill": "#d0d0d0", "stroke": "#909090", "strokeWidth": 0.5 },
  "contours": {
    "stroke": "#b0b0b0",
    "strokeWidth": { "major": 0.8, "minor": 0.4 },
    "intervals": [5, 25, 100],
    "noLabels": true
  }
}
```

**Kontur-styling constraint:**

- Konturlinjer får ALDRIG inkludera numeriska höjdetiketter
- Konturer är rent visuell rytm, inte analytisk data
- Major/minor/index skillnad endast via stroke weight
- Gäller globalt för både Demo A och Demo B

**Export-parametrar:**

- `bbox_preset`: "stockholm_core" | "stockholm_wide" (default för UI och exports)
- `bbox`: [minLon, minLat, maxLon, maxLat] (optional override)
- `theme`: theme name
- `render_mode`: "screen" | "print" (obligatorisk parameter)
- "print": labels avstängda som default, endast via explicit opt-in
- "screen": labels tillåtna, optimerat för preview
- `dpi`: 150 | 300
- `width_mm`, `height_mm`: fysisk storlek
- `margins_mm`: { top, right, bottom, left }
- `contour_interval`: 5 | 25 | 100 | null
- `title`: optional string

**Hillshade-ljusparametrar (deterministisk):**

- Azimuth: 315° (nordväst)
- Altitude: 45°
- Fixa och konsekventa över alla themes
- Identiska mellan Demo A och Demo B
- Prioriterar: generalisering, kontrast, visuellt djup (inte analytisk noggrannhet)

**Prestanda-optimeringar:**

- Caching av processade tiles/terrain
- Generalisering av byggnader vid låg zoom
- Lazy loading av konturlinjer
- Batch-processing för terrain

## Kvalitetskriterier

**Prioriteringar (gäller både Demo A och Demo B):**

- Estetisk kvalitet (prioritet #1)
- Print-reproducerbarhet
- Determinism (samma input → identisk output)
- Över: GIS-kompletthet, navigationsanvändningsfall, realtidsinteraktivitet

**Tekniska krav:**

- Export ska vara deterministisk (samma input → identisk output)
- Themes ska vara visuellt distinkta men alla dämpade
- Hillshade ska ge djup utan att dominera (fokus på generalisering, kontrast, ljusriktning)
- Byggnader ska generaliseras vid större utsnitt
- Konturlinjer: endast visuell rytm, inga numeriska höjdetiketter
- Systemet ska kunna exportera A2 (420×594mm) och A1 (594×841mm) format