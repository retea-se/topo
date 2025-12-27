# Roadmap

**Senast uppdaterad**: 2025-12-27 (Roadmap-initiativ: Fyra nya epics planerade - Phase 12-15)

## Statusförklaring

- ⬜ TODO
- 🟡 DOING
- ✅ DONE

---

## Phase 5.5 - Infra & Quality Hardening (NEW)

**Mål**: Säkerställa robust tile-pipeline och exportskydd.

| Uppgift | Status |
|---------|--------|
| Preset limits konfiguration (preset_limits.json) | ✅ DONE |
| Server-side export validering | ✅ DONE |
| API endpoints: /validate, /preset-limits | ✅ DONE |
| UI varningar och felmeddelanden | ✅ DONE |
| Build utilities (preflight, logging, timing) | ✅ DONE |
| QA test suite (Playwright) | ✅ DONE |
| Design catalog dokumentation | ✅ DONE |

**Dokumentation**:
- [PRESET_LIMITS.md](PRESET_LIMITS.md) - Exportbegränsningar per preset
- [BUILD_GUIDE.md](BUILD_GUIDE.md) - Byggtider och diskåtgång
- [DESIGN_CATALOG.md](DESIGN_CATALOG.md) - Designstilar och render-pipelines

---

## Phase 6 - Full Coverage Pipeline

**Mål**: Säkerställa full karttäckning för alla lager över hela Stockholm Wide.

| Uppgift | Status |
|---------|--------|
| OSM tiles för stockholm_core | ✅ DONE |
| OSM tiles för stockholm_wide | ✅ DONE |
| DEM för stockholm_core | ✅ DONE |
| DEM för stockholm_wide | ✅ DONE (Copernicus GLO-30) |
| Hillshade tiles för stockholm_core | ✅ DONE |
| Hillshade tiles för stockholm_wide | ✅ DONE (TMS z10-16) |
| Contour tiles för stockholm_core | ✅ DONE |
| Contour tiles för stockholm_wide | ✅ DONE (2m/10m/50m) |
| Entry-script `build_full_coverage.ps1/.sh` | ✅ DONE |
| Coverage audit dokumenterad | ✅ DONE |
| **QA-verifiering (60/60 tiles)** | ✅ DONE (qa_20251226_182055) |

---

## Phase 7 - UI Layer Controls

**Mål**: Implementera layer visibility-kontroller i användargränssnittet.

### Demo A ✅ COMPLETE

| Uppgift | Status |
|---------|--------|
| Layer toggle: Hillshade | ✅ DONE |
| Layer toggle: Water | ✅ DONE |
| Layer toggle: Roads | ✅ DONE |
| Layer toggle: Buildings | ✅ DONE |
| Layer toggle: Contours | ✅ DONE |
| Layer toggle: Parks | ✅ DONE (2025-12-27: export-paritet verifierad) |

### Demo B

| Uppgift | Status |
|---------|--------|
| Layer toggles (motsvarande Demo A) | ⬜ TODO |

### Krav

- UI toggles mappar direkt till MapLibre-lager
- Ingen datagenerering krävs
- Ingen tile-ändring krävs
- Exportern behöver inte ändras (synlighet styrs av style)

---

## Phase 8 - Print Composition System ✅ COMPLETE

**Mål**: Implementera ett print-composition-lager ovanpå kartan.

**Not**: Implementerat som del av Phase 10 (Print Editor).

| Komponent | Status |
|-----------|--------|
| Ram (valbar, tema-styrd) | ✅ DONE (15 layout templates: 5 original + 10 nya) |
| Titel | ✅ DONE |
| Undertitel / plats | ✅ DONE |
| Skala (endast vid pitch = 0) | ✅ DONE (optional) |
| Attribution (OSM, Copernicus) | ✅ DONE (optional, subtle) |
| Marginal/safe-zone system | ✅ DONE |
| Metadata-overlay (paper size, dimensions) | ✅ DONE |

### Layout Designs Extension ✅ COMPLETE (2025-01-27)

**Mål**: Utöka antalet layout templates från 5 till 15.

| Uppgift | Status |
|---------|--------|
| Design proposal (10 nya layouts) | ✅ DONE |
| Font loading (Google Fonts) | ✅ DONE |
| CSS-utökningar (grid, glow, decorative) | ✅ DONE |
| JavaScript helper-funktioner | ✅ DONE |
| Implementera alla 10 nya layouts | ✅ DONE |
| Browser testing (preview mode) | ✅ DONE |
| Exporter server updates | ✅ DONE |
| Export testing | ✅ DONE (5/5 layouts tested, all PASS) |
| Dokumentation | ✅ DONE |

**Nya layouts**: Minimalist, Scientific, Blueprint, Gallery Print, Vintage Map, Artistic, Night Mode, Heritage, Prestige, Cyberpunk

**Testresultat**:
- ✅ Preview mode: Alla 15 layouts fungerar
- ✅ Export: 5 layouts testade (Blueprint, Cyberpunk, Prestige, Vintage Map, Scientific) - alla PASS
- ✅ Exporter server: Fullständig rendering-logik implementerad

**Dokumentation**:
- [LAYOUT_DESIGN_PROPOSAL.md](LAYOUT_DESIGN_PROPOSAL.md) - Design proposal
- [LAYOUT_IMPLEMENTATION_PLAN.md](LAYOUT_IMPLEMENTATION_PLAN.md) - Implementation plan
- [LAYOUT_DESIGNS_IMPLEMENTATION_REPORT.md](../exports/LAYOUT_DESIGNS_IMPLEMENTATION_REPORT.md) - Implementation rapport
- [LAYOUT_EXPORT_TESTING_REPORT.md](LAYOUT_EXPORT_TESTING_REPORT.md) - Export testing rapport
- [LAYOUT_DESIGNS_STATUS.md](LAYOUT_DESIGNS_STATUS.md) - Status sammanfattning

### Designprinciper

- Export-first approach ✅
- Tema-kompatibel ✅
- Print-safe zones för marginaler ✅

---

## Phase 9 - Preset Export System ✅ DONE

**Mål**: Fördefinierade exportpresets för vanliga användningsfall.

**Reproducerbarhet verifierad**: 2025-12-26 (Demo B, SHA256 identisk för alla testade presets)

### 9.1 Backend & Config ✅ DONE

| Uppgift | Status |
|---------|--------|
| Preset-filer (config/export_presets/) | ✅ DONE |
| JSON Schema (_schema.json) | ✅ DONE |
| GET /api/export-presets | ✅ DONE |
| GET /api/export-presets/{id} | ✅ DONE |
| POST /api/validate-preset | ✅ DONE |
| Constraint-validering | ✅ DONE |
| QA test script | ✅ DONE |

### 9.2 Implementerade Presets

| Preset | Format | Theme | Status |
|--------|--------|-------|--------|
| A2_Paper_v1 | A2 Landscape | paper | ✅ DONE |
| A3_Blueprint_v1 | A3 Landscape | blueprint-muted | ✅ DONE |
| A1_Terrain_v1 | A1 Portrait | gallery | ✅ DONE |
| A4_Quick_v1 | A4 Portrait | paper | ✅ DONE |
| A2_Contour_Minimal_v1 | A2 Portrait | ink | ✅ DONE |
| A2_Terrain_GallerySoft_v1 | A2 Landscape | gallery | ✅ DONE |
| A3_FigureGround_Black_v1 | A3 Portrait | dark | ✅ DONE |
| A2_Blueprint_Technical_v2 | A2 Landscape | blueprint-muted | ✅ DONE |
| A2_Scandi_Light_v1 | A2 Landscape | warm-paper | ✅ DONE |
| A3_Contour_Night_v1 | A3 Portrait | void | ✅ DONE |
| A2_Neon_Synthwave_v1 | A2 Landscape | neon | ✅ DONE |
| A3_Vintage_USGS_v1 | A3 Portrait | vintage | ✅ DONE |
| A2_Gold_Foil_v1 | A2 Portrait | gold-foil | ✅ DONE |
| A4_Night_v1 | A4 Portrait | night | ✅ DONE |
| A2_Silver_Foil_v1 | A2 Portrait | silver-foil | ✅ DONE |
| A3_Copper_v1 | A3 Landscape | copper | ✅ DONE |
| A2_Cyberpunk_v1 | A2 Landscape | cyberpunk | ✅ DONE |
| A3_Chalk_v1 | A3 Portrait | chalk | ✅ DONE |
| A2_Thermal_v1 | A2 Landscape | thermal | ✅ DONE |
| A3_Bauhaus_v1 | A3 Portrait | bauhaus | ✅ DONE |
| A2_Art_Deco_v1 | A2 Portrait | art-deco | ✅ DONE |
| A3_Forest_v1 | A3 Landscape | forest | ✅ DONE |
| A2_Ocean_v1 | A2 Landscape | ocean | ✅ DONE |
| A4_High_Contrast_v1 | A4 Portrait | high-contrast | ✅ DONE |

### 9.3 UI Integration ✅ DONE

| Uppgift | Status |
|---------|--------|
| Preset-dropdown i editor | ✅ DONE |
| Låsning av fält i UI | ✅ DONE |
| Statusindikator (preset-namn) | ✅ DONE |
| Modified-suffix vid overrides | ✅ DONE |

### Preset-struktur

Varje preset definierar:
- Theme
- Format (A2, A3, A1, A4)
- DPI (72-600)
- Dimensioner (mm)
- Layer-visibility
- Constraints (låsningar)

### Krav

- ✅ Presets JSON-definierade i config/
- ✅ Versionsbara (t.ex. `_v1`, `_v2`)
- ✅ Reproducerbara över tid
- ✅ Presets valbara i UI dropdown
- ✅ Export-filnamn inkluderar preset-namn

---

## Phase 10 - Interactive Print Editor & Advanced Export ✅ COMPLETE

**Mål**: Skapa ett interaktivt editörgränssnitt liknande Mapiful Editor.

**Dokumentation**: [TODO_EXPORT_EDITOR.md](../archive/TODO_EXPORT_EDITOR_completed.md) (arkiverad - implementerat)

**Åtkomst**: http://localhost:3000/editor

### 10.1 Bbox Drawing Tool

| Uppgift | Status |
|---------|--------|
| MapLibre Draw integration | ✅ DONE |
| Rectangle draw mode för bbox | ✅ DONE |
| Manual coordinate input | ✅ DONE |
| Sync bbox med map view | ✅ DONE |
| Reset to Preset knapp | ✅ DONE |

### 10.2 Editor Panel UI

| Uppgift | Status |
|---------|--------|
| Sidebar/panel layout (Nordic design) | ✅ DONE |
| Title input field | ✅ DONE |
| Subtitle input field | ✅ DONE |
| Scale selector (auto-calculated) | ✅ DONE |
| Optional scale checkbox | ✅ DONE |
| Attribution (optional checkbox) | ✅ DONE |
| Paper size dropdown (A0-A4) | ✅ DONE |
| Orientation toggle (Portrait/Landscape) | ✅ DONE |
| DPI selector (72-600) | ✅ DONE |
| Format selector (PNG/PDF/SVG) | ✅ DONE |
| Layer toggles (6 layers) | ✅ DONE |
| Layout templates (5 templates) | ✅ DONE |

### 10.3 Backend Export API

| Uppgift | Status |
|---------|--------|
| Custom bbox support (not just presets) | ✅ DONE |
| PNG export endpoint (Demo A) | ✅ DONE |
| PDF export endpoint (Demo B) | ✅ DONE |
| SVG export endpoint (Demo B) | ✅ DONE |
| Title overlay rendering | ✅ DONE |
| Scale bar rendering | ✅ DONE |
| Attribution text rendering | ✅ DONE |
| CORS headers | ✅ DONE |

### 10.4 Preview System

| Uppgift | Status |
|---------|--------|
| Fullscreen preview mode | ✅ DONE |
| Paper bounds overlay on map | ✅ DONE |
| Title/attribution preview | ✅ DONE |
| Scale bar preview | ✅ DONE |
| Composition layout visualization | ✅ DONE |
| Close button + ESC key | ✅ DONE |

### 10.5 Testing & QA

| Uppgift | Status |
|---------|--------|
| Manual test cases | ✅ DONE |
| Playwright E2E tests (25/25 PASS) | ✅ DONE |
| Export dimension verification | ✅ DONE |
| Chrome DevTools verification | ✅ DONE |
| QA screenshots | ✅ DONE |

### 10.6 UI/UX Improvements (2025-12-26)

| Uppgift | Status |
|---------|--------|
| Nordic/Scandinavian design | ✅ DONE |
| Light color scheme | ✅ DONE |
| 50/50 sidebar/map layout | ✅ DONE |
| Subtle attribution styling | ✅ DONE |
| 5 layout templates (Classic, Modern, Minimal, Elegant, Bold) | ✅ DONE |

### 10.7 Gallery UI Component (2025-12-27)

| Uppgift | Status |
|---------|--------|
| Gallery UI Contract v1.0 | ✅ DONE |
| Standalone reference implementation | ✅ DONE |
| ARIA accessibility (role=listbox, role=option, aria-selected) | ✅ DONE |
| Keyboard navigation (Arrow, Home/End, Enter/Space) | ✅ DONE |
| CSS-only responsive columns (2-3 columns) | ✅ DONE |
| Loading state (setLoading API) | ✅ DONE |
| Editor integration template | ✅ DONE |
| Browser verification | ✅ DONE (partial - Playwright timeout issues) |

**Dokumentation**:
- [GALLERY_UI_CONTRACT.md](GALLERY_UI_CONTRACT.md) - API & styling contract
- [GALLERY_TEST_REPORT.md](GALLERY_TEST_REPORT.md) - Test results

**Filer**:
- `demo-a/web/public/gallery-standalone/gallery.js` - Component logic
- `demo-a/web/public/gallery-standalone/gallery.css` - Component styles
- `demo-a/web/public/gallery-standalone/gallery.html` - Reference demo
- `demo-a/web/public/gallery-standalone/editor-integration.js` - Integration template

### Framgångskriterier

- [x] Användare kan rita custom bbox på kartan
- [x] Användare kan exportera PDF med titel/skala/attribution
- [x] Användare kan exportera SVG med vektorbanor
- [x] Preview visar korrekt resultat före export
- [x] Alla pappersstorlekar (A0-A4) fungerar
- [x] Tester passerar i automatiserad QA
- [x] Nordic/Scandinavian UI design
- [x] Optional scale/attribution checkboxes
- [x] ESC key closes preview

---

## Design & Style Catalog (Vision & Exploratory)

Denna sektion beskriver **framtida kartstilar, renderingstekniker och visuella uttryck** som systemet är kapabelt att producera eller utökas mot.

Detta är **inte en sekventiell TODO-lista**, utan en **design- och renderingskatalog** som:

- guidar produktutveckling
- dokumenterar möjligheter i arkitekturen
- fungerar som gemensamt språk mellan teknik, design och användare

### Grundprincip
All rendering kan delas upp i följande pipeline:

**Data → Style → Render → Compose → Post-process**

- **Data**: DEM (Copernicus), OSM (PostGIS / MBTiles)
- **Style**: Theme JSON / Mapnik / MapLibre styles
- **Render**: MapLibre (Demo A), Mapnik (Demo B), GDAL
- **Compose**: Lagerordning, blending, opacity
- **Post-process**: Layout, ram, text, filter, export

---

### 1. DEM-baserade stilar (Terrain-first)

Kartor där **höjddata är primärt visuellt element**.

#### Pure Contour
Enbart höjdkurvor mot vit/svart bakgrund. Minimalistiskt à la Topographia Design. Ekvidistans som parameter.

**Implementation:**

```bash
gdal_contour -i 25 -a elev dem.tif contours.shp
```

Rendera med Mapnik/Cairo, `stroke-width` + `stroke-color`.

#### Gradient Contour
Höjdkurvor där linjetjockleken eller opaciteten varierar med höjd. Tunnare linjer högre upp.

**Implementation:**
Attributera varje kontur med elevation-värde. Style: `stroke-width: interpolate(elevation, min, max, 2px, 0.5px)`.

#### Filled Contour / Hypsometric Tint
Områden mellan höjdkurvor fylls med färg. Klassisk kartografisk stil.

**Implementation:**

- `gdal_contour` → polygonize med GDAL/OGR
- Eller: direkt färgmappning på raster med color-relief:

```bash
gdaldem color-relief dem.tif palette.txt output.tif
```

#### Hillshade Classic
Shaded relief med simulerad belysning (nordväst standard).

**Implementation:**

```bash
gdaldem hillshade dem.tif hillshade.tif -az 315 -alt 45
```

Alternativ: numpy + richdem för mer kontroll.

#### Hillshade + Contour Combo
Hillshade som bakgrund med subtila konturer ovanpå.

**Implementation:**
Generera båda separat, composita med PIL/Cairo. Hillshade som bakgrund (opacity 0.3-0.5), konturer ovanpå.

#### Terrain RGB
Höjd mappas till RGB-värden. Psykedeliskt.

**Implementation:**
Normalize DEM till 0-1. R = sin(elevation * π), G = sin(elevation * π + 2π/3), etc. Eller: HSV med hue baserad på elevation.

#### Contour Fade
Konturer som bleknar mot kanterna. Vignette-effekt.

**Implementation:**
Beräkna avstånd från centrum för varje pixel. Multiplicera opacity med `(1 - distance/max_distance)`. Eller: radiell gradient som mask.

#### Paper Cut / Layered
Simulera papperslager med skuggor.

**Implementation:**
Generera polygon per höjdband. Varje band får drop-shadow: offset 2px, blur 4px. Rendera från lägsta till högsta.

#### Embossed / Relief
Simulerad prägling med ljus/skugga.

**Implementation:**
Duplicera linjer. Offset +1px i båda riktningar: en vit, en svart. Originalet i mitten. Alternativ: Sobel edge detection på hillshade.

**Teknik**

- GDAL (`gdal_contour`, `gdaldem`)
- richdem / numpy
- Mapnik raster + vector
- Cairo / PIL compositing

**Status**: ⬜ Exploratory (arkitektur redo)

---

### 2. OSM-baserade stilar (Vector-first)

Kartor där **vägar, byggnader, vatten och markanvändning** är i fokus.

#### Street Minimal
Endast vägnät, inga etiketter. Linjetjocklek baserad på väghierarki.

**Implementation:**

- Overpass API eller osm2pgsql → PostGIS
- Filtrera: `highway IN (motorway, trunk, primary, secondary, tertiary, residential)`
- Mapnik/Mapbox GL style med `line-width` per highway-typ

#### Street + Water
Gatukartan kompletterad med vattendrag och sjöar i kontrastfärg.

**Implementation:**
Lägg till: `natural=water`, `waterway=river|stream`. Rendera vatten först (fill), sedan gator (stroke).

#### Street + Parks
Gator plus grönområden/parker från OSM.

**Implementation:**
`leisure=park`, `landuse=grass|forest`. Fyll polygoner i grön ton, gator ovanpå.

#### Figure–Ground (Nolli-stil)
Byggnader som fyllda former, allt annat vitt. Nolli-stil.

**Implementation:**
`building=*` från OSM. Endast fill, ingen stroke. Solid svart på vit bakgrund.

#### Waterway Focus
Vattendrag i fokus med DEM-baserad dränering.

**Implementation:**
pysheds eller richdem för flow accumulation. Kombinera med `waterway=*` från OSM. Linjetjocklek baserad på Strahler order.

#### Personal Route Overlay (GPX)
Användare laddar upp GPX, renderas ovanpå kartan.

**Implementation:**
gpxpy för parsing. Extrahera koordinater, transformera till kartprojektion. Rita linje med distinkt färg/stil ovanpå baskartan.

**Teknik**

- OSM → PostGIS / Planetiler
- MapLibre styles (Demo A)
- Mapnik vector layers (Demo B)

**Status**: 🟡 Delvis stödd (data finns, fler styles behövs)

---

### 3. Kombinerade stilar (DEM + OSM)

Systemets **kärndifferentiering** – terräng + stad tillsammans.

#### Topo Street Blend
Höjdkurvor i bakgrunden, gatukarta i förgrunden.

**Implementation:**

Rendera konturer med låg opacity (0.2-0.4). Gator ovanpå i full opacity. Compositing: `PIL.Image.alpha_composite()` eller Cairo.

#### Terrain Street
Hillshade som bakgrund, stiliserat vägnät ovanpå.

**Implementation:**

Hillshade → multiply blend mode med vit bakgrund. Gator i kontrasterande färg ovanpå.

#### Bathymetric Combo
Kombinera DEM för land med djupdata för vatten.

**Implementation:**
EMODnet eller GEBCO för bathymetri. Merge rasters: land DEM + negativa värden för hav. Sömlös färgskala över noll.

**Teknik**

- DEM som bakgrund
- OSM ovanpå
- Alpha blending / layer ordering

**Status**: 🟡 Iterativt – pågående fokusområde

---

### 4. Stiliserade & konstnärliga teman

Teman som primärt är **estetiska uttryck**, ej nya datakällor.

#### Blueprint / Blueprint Muted
Vit på mörkblå bakgrund. Teknisk ritningskänsla.

**Implementation:**
Bakgrund: `#1e3a5f` eller liknande. Alla linjer: `#ffffff` eller `#a0c4e8`. Lägg till grid-overlay för extra effekt.

#### Neon / Synthwave ✅ IMPLEMENTED

Mörk bakgrund, lysande linjer med glöd-effekt.

**Theme file**: `themes/neon.json`
**Preset**: `A2_Neon_Synthwave_v1`

**Implementation:**
Bakgrund: `#0d0221`. Linjer: `#ff00ff`, `#00ffff`, `#ffff00`. Glöd: duplicera linje-lager, blur (Gaussian), lägg under original. CSS: `filter: drop-shadow(0 0 10px #ff00ff)`.

#### Vintage USGS ✅ IMPLEMENTED

Klassiska topografiska kartor. Sepia-toner, åldrad papperstruktur.

**Theme file**: `themes/vintage.json`
**Preset**: `A3_Vintage_USGS_v1`

**Implementation:**
Färgpalett: `#d4c4a8` (bakgrund), `#5c4033` (linjer). Paper texture overlay med multiply blend. Serif-font för labels (Liberation Serif, etc).

#### Mono Elevation
En färg i olika nyanser baserat på höjd.

**Implementation:**
`gdaldem color-relief` med monokrom palett. Eller: normalize elevation 0-255, mappa till single hue HSL.

#### Inverted
Inverterade färger.

**Implementation:**
PIL: `ImageOps.invert(image)`. Eller byt stroke/fill-färger i stylesheet.

#### Gold Foil ✅ IMPLEMENTED

Simulerad guldfolie på mörk bakgrund.

**Theme file**: `themes/gold-foil.json`
**Preset**: `A2_Gold_Foil_v1`

**Implementation:**
Linjer: linear-gradient `#d4af37` → `#ffd700` → `#b8860b`. Bakgrund: `#1a1a2e` eller `#0a0a0a`. Subtle noise texture overlay för metallkänsla.

#### Silver Foil / Copper / Rose Gold
Silver/krom eller varm metallisk ton.

**Implementation:**
Linjer: `#c0c0c0` → `#e8e8e8` (silver) eller `#b87333` (copper) eller `#e0bfb8` (rose gold). Samma teknik som gold foil.

#### Duotone
Två kontrastfärger, inga gråskalor.

**Implementation:**
Konvertera till gråskala, threshold vid 50%. Mappa svart → färg1, vitt → färg2. PIL: `ImageOps.colorize(grayscale, color1, color2)`.

#### Gradient Wash
Mjuk gradient som bakgrund, kartlinjer i vitt/svart ovanpå.

**Implementation:**
Generera gradient med numpy/PIL. `linspace` mellan två färger, reshape till bild. Composita karta ovanpå.

#### Risograph
Kornig, off-register estetik.

**Implementation:**
Separera lager per färg. Offset varje lager 1-3px slumpmässigt. Lägg till grain: numpy noise overlay. Begränsad palett: 2-3 spot colors.

#### Woodblock / Linocut
Träsnitt-känsla. Tjocka, ojämna linjer.

**Implementation:**
Linjer med `stroke-dasharray` för ojämnhet. Eller: displacement map på linjer. Textur-overlay som simulerar trä/fiber.

#### Watercolor Bleed
Akvarellaktiga fyllningar som blöder utanför.

**Implementation:**
Buffra polygoner slumpmässigt (shapely.buffer med noise). Gaussian blur på fyllda områden. Låg opacity, overlay blend mode.

#### Pencil Sketch
Handritade linjer med lätt textur.

**Implementation:**
Jittered stroke: lägg till perlin noise på koordinater. Varierande stroke-width längs linjen. Lätt skugga: duplicera, offset, blur, låg opacity.

#### Chalk on Blackboard
Krita på svart/mörkgrön tavla.

**Implementation:**
Bakgrund: `#2d4a3e` (green board) eller `#1a1a1a`. Linjer: `#ffffff` med noise/texture. `stroke-opacity` varierar slumpmässigt 0.7-1.0.

#### Newspaper / Halftone
Rasterpunkter istället för solida fyllningar.

**Implementation:**
PIL: konvertera till gråskala. Mappa intensitet till punktstorlek i grid. Alternativ: pillow-halftone bibliotek.

#### Bauhaus
Primärfärger, geometriskt, modernistiskt.

**Implementation:**
Palett: `#ff0000`, `#0000ff`, `#ffff00`, `#000000`, `#ffffff`. Tjocka linjer, geometriska former. Sans-serif font (Futura-liknande).

#### Art Deco
Guld/svart/cream, 1920-talselegans.

**Implementation:**
Palett: `#d4af37`, `#1a1a1a`, `#f5f5dc`. Geometriska dekorativa element i hörn. Stiliserade linjer med ornament.

#### Japandi
Dämpad palett, mycket whitespace.

**Implementation:**
Palett: `#d4c8be`, `#8b8b8b`, `#2d2d2d`, `#ffffff`. Tunna linjer (0.5-1px). Stor marginal runt kartan.

#### Scandi Minimal
Ljust, luftigt, en accentfärg.

**Implementation:**
Bakgrund: `#ffffff`. Linjer: `#e0e0e0` (light grey). Accent: `#d4a574` (mustard) eller `#a8b5a0` (sage).

#### Swiss / International
Strikt grid, sans-serif, funktionellt.

**Implementation:**
Grid-overlay: 10x10 ljusgrå linjer. Font: Helvetica/Inter/Arial. Begränsad palett, hög kontrast.

#### Cyberpunk
Mörk bakgrund, hög kontrast, glitch-element.

**Implementation:**
Bakgrund: `#0a0a0a`. Linjer: `#00ff00`, `#ff0055`, `#00ffff`. Scanlines: horisontella linjer var 4px, opacity 0.1. RGB-split: offset R/G/B kanaler 1-2px.

#### Vaporwave
Pastellgradienter, 90-tals nostalgi.

**Implementation:**
Gradient: `#ff71ce` → `#01cdfe` → `#05ffa1`. Grid-perspektiv i bakgrunden. Font: bold, italic, outline.

#### Topographic Camo
Höjdkurvor i kamouflagefärger.

**Implementation:**
Palett: `#4b5320`, `#8b7355`, `#6b4423`, `#2d2d2d`. Fylld contour med camo-gradient. Alternativ: randomisera färg per konturband.

#### Negative Space
Endast vatten visas, eller endast land.

**Implementation:**
Filtrera bort allt utom vatten (eller tvärtom). Vit bakgrund, svart fyllning (eller tvärtom). Konceptuellt enkelt, visuellt starkt.

#### Thermal / Infrared
Värmekamera-palett.

**Implementation:**
Color ramp: `#000000` → `#4b0082` → `#0000ff` → `#00ffff` → `#ffff00` → `#ffffff`. `gdaldem color-relief` med thermal palette.

#### Ocean Depth
Inverterad logik – högre terräng är mörkare.

**Implementation:**
Invertera DEM: `max_elev - elevation`. Blå palett: ljusblå (högt/grunt) → mörkblå (lågt/djupt).

#### Glitch
Avsiktliga förskjutningar, RGB-split.

**Implementation:**
Slumpmässiga horisontella slices, offset X. Separera R/G/B, offset olika riktningar. Korrupta segment: random noise blocks.

#### Dot Matrix
Linjer ersatta med punkter (stippling).

**Implementation:**
Sample punkter längs linjer med jämna intervall. Punktstorlek kan variera med elevation. Alternativ: Poisson disk sampling.

#### ASCII Art
Terräng representerad med tecken.

**Implementation:**
Quantize elevation till teckenuppsättning: `" .:-=+*#%@"`. Rendera till monospace text, spara som bild. Nördigt easter egg.

#### Night Mode ✅ IMPLEMENTED

Mörk bakgrund, dämpad kontrast.

**Theme file**: `themes/night.json`
**Preset**: `A4_Night_v1`

**Implementation:**
Bakgrund: `#121212`. Linjer: `#888888` eller dämpad accent. Undvik rent vitt.

#### High Contrast Accessibility
Maximal kontrast för synnedsättning.

**Implementation:**
Endast svart (`#000000`) och vitt (`#ffffff`). Eller: WCAG-godkända kontrastpar. Tjockare linjer (2-3px minimum).

#### Seasonal
Paletter baserade på årstider.

**Implementation:**
- Vår: `#90ee90`, `#ffd700`, `#f0fff0`
- Sommar: `#00bfff`, `#228b22`, `#ffff00`
- Höst: `#ff8c00`, `#8b4513`, `#daa520`
- Vinter: `#f0f8ff`, `#b0c4de`, `#708090`

#### National Colors
Palett baserad på lands flaggfärger.

**Implementation:**
Lookup-tabell: `country_code → [color1, color2, color3]`. Sverige: `#006aa7`, `#fecc00`. Dynamisk baserat på kartans centrum eller user input.

**Not**
Dessa implementeras som **Theme Recipes** (JSON + render-regler), inte som separat kod.

**Status**: ⬜ Designkatalog (icke-blockerande)

---

### 5. Export Presets (Produktfunktion)

Fördefinierade paket som kombinerar:

- Theme
- Lager (on/off)
- Format
- DPI & storlek
- Layout

**Exempel**

- "A2 Gallery"
- "A3 Blueprint"
- "A4 Technical"
- "Poster Minimal"

**Status**: 🟡 Delvis implementerat, utökas

---

### 6. Print Layout & Presentation

Utökad layout-motor för tryck och presentation.

**Innehåll**

- Ram / marginaler
- Titel, underrubrik
- Skala & nordpil
- Attribution / metadata
- Paper texture overlays

**Teknik**

- PIL / Cairo
- SVG → raster
- Parametriserad layout

**Status**: 🟡 Pågående

---

### 7. Avancerat / Lång sikt

Experimentella eller tunga funktioner.

#### Isometric 3D
Isometrisk vy från DEM, extruderad terräng.

**Implementation:**

pyvista eller matplotlib 3D surface plot. Kameravinkel: azimuth 45°, elevation 30°. Rendera till bild, eller exportera STL för 3D-print.

#### Ridge Line / Horizon
Silhuetter av bergsryggar staplade.

**Implementation:**

Sampla DEM i horisontella snitt (N→S eller W→E). Varje snitt blir en linje. Stapla med offset i Y-led. Dölj linjer bakom högre "framför".

#### Bathymetric Combo (avancerat)
Kombinera DEM för land med djupdata för vatten.

**Implementation:**
EMODnet eller GEBCO för bathymetri. Merge rasters: land DEM + negativa värden för hav. Sömlös färgskala över noll.

#### STL-export för 3D-print
Exportera terräng som 3D-modell.

**Implementation:**

DEM → mesh (numpy-stl eller trimesh). Exportera STL-format. Användare kan 3D-printa kartan.

**Status**: ⬜ Research / Future

---

### 8. Anpassningsparametrar

Parametrar som kan justeras per stil eller export.

| Parameter | Implementation |
|-----------|----------------|
| Färgpalett | JSON/YAML config, runtime swap |
| Ekvidistans | `gdal_contour -i` parameter |
| Linjetjocklek | Mapnik/stylesheet `stroke-width` |
| Orientation | PIL rotate / crop aspect ratio |
| Text/rubrik | PIL `ImageDraw.text()` eller SVG |
| Belysningsvinkel | `gdaldem hillshade -az` parameter |
| Opacitet per lager | Alpha compositing vid merge |

---

### Viktiga begrepp

- **Theme**: Färger, linjetjocklek, opacity
- **Style**: Hur lager renderas (Mapnik / MapLibre)
- **Preset**: Theme + layout + format + lager

---

## Fas 3b - Effect Pipeline ✅ COMPLETE

**Mål**: Implementera post-render Effect Pipeline för visuella effekter (risograph, grain, etc.).

**Dokumentation**: [EFFECT_PIPELINE_ARCHITECTURE.md](EFFECT_PIPELINE_ARCHITECTURE.md)

### Översikt

Effect Pipeline applicerar visuella effekter **efter** baskartan renderats, på pixeldata snarare än vektordata.

```
Theme JSON → Style Gen → Renderer → Effect Pipeline → Output
```

### Implementation

| Uppgift | Status |
|---------|--------|
| Effect Pipeline architecture design | ✅ DONE |
| Demo A integration (MapLibre/Canvas) | ✅ DONE |
| Demo B integration (Mapnik/PIL) | ✅ DONE |
| Risograph effect (JavaScript) | ✅ DONE |
| Risograph effect (Python) | ✅ DONE |
| Determinism testing (Browser) | ✅ DONE (5/5 PASS) |
| Determinism testing (Python) | ✅ DONE (6/6 PASS) |
| Risograph theme (riso-red-cyan.json) | ✅ DONE |
| Export preset (A2_Riso_RedCyan_v1) | ✅ DONE |
| Architecture documentation | ✅ DONE |

### Risograph Effect Features

- **Color Channel Separation**: ITU-R BT.601 luminance conversion
- **Registration Offset**: Integer pixel offsets per channel (simulates misregistration)
- **Multiply Blend**: Authentic ink-on-paper effect
- **Seeded Grain**: Mulberry32 PRNG for deterministic texture
- **Debounced Application**: Smooth interactive performance

### File Structure

```
demo-a/web/public/effects/
├── index.js              # Effect pipeline dispatcher
├── risograph.js          # Risograph implementation (JS)
├── utils.js              # Shared utilities
└── test-determinism.html # Browser determinism tests

demo-b/renderer/src/effects/
├── __init__.py           # Package init + pipeline function
├── risograph.py          # Risograph implementation (Python)
├── utils.py              # Shared utilities
└── test_risograph_determinism.py  # Python determinism tests
```

### Testning

```bash
# Python tests
cd demo-b/renderer/src/effects
python -m pytest test_risograph_determinism.py -v

# Browser tests
# Open demo-a/web/public/effects/test-determinism.html
```

---

## Phase 11 - Sweden Full Coverage ⬜ PLANERAD

**Mål**: Utöka täckningen till hela Sverige med regionindelning.

**Detaljerad plan**: [SWEDEN_FULL_COVERAGE_PLAN.md](SWEDEN_FULL_COVERAGE_PLAN.md)

### Översikt

| Region | Bbox (WGS84) | Yta (grader²) | Status |
|--------|--------------|---------------|--------|
| stockholm_core | 17.90-18.08, 59.32-59.35 | 0.005 | ✅ DONE |
| stockholm_wide | 17.75-18.25, 59.28-59.40 | 0.06 | ✅ DONE |
| svealand | 14.5-19.0, 58.5-61.0 | 11.25 | ✅ DONE |
| götaland | 10.5-19.5, 55.3-59.0 | ~33 | ⬜ TODO |
| norrland_syd | 14.0-20.0, 61.0-65.0 | ~24 | ⬜ TODO |
| norrland_nord | 14.0-24.2, 65.0-69.1 | ~42 | ⬜ TODO |

### Fas 11.1 - Förberedelser

| Uppgift | Status |
|---------|--------|
| Skapa nya preset-definitioner i bbox_presets.json | ⬜ TODO |
| Uppdatera preset_limits.json med nya begränsningar | ⬜ TODO |
| Skapa build-scripts för nya regioner | ⬜ TODO |
| Verifiera Copernicus-konto och credentials | ⬜ TODO |

### Fas 11.2 - Götaland

| Uppgift | Status |
|---------|--------|
| Klipp OSM för götaland | ⬜ TODO |
| Generera OSM tiles | ⬜ TODO |
| Ladda ner DEM (Copernicus GLO-30) | ⬜ TODO |
| Generera hillshade (z8-13) | ⬜ TODO |
| Extrahera konturer (50m, 100m) | ⬜ TODO |
| Generera contour tiles | ⬜ TODO |
| QA-verifiering | ⬜ TODO |

### Fas 11.3 - Norrland Syd

| Uppgift | Status |
|---------|--------|
| Samma steg som Götaland | ⬜ TODO |

### Fas 11.4 - Norrland Nord

| Uppgift | Status |
|---------|--------|
| Samma steg som Götaland | ⬜ TODO |

### Fas 11.5 - Integration

| Uppgift | Status |
|---------|--------|
| Uppdatera Martin-config | ⬜ TODO |
| Uppdatera Nginx-routing | ⬜ TODO |
| Uppdatera themeToStyle.js | ⬜ TODO |
| Full QA över alla regioner | ⬜ TODO |
| Dokumentation | ⬜ TODO |

### Resurskrav

| Resurs | Uppskattning |
|--------|--------------|
| Diskutrymme | ~150-200 GB |
| Byggtid (totalt) | ~48-72 timmar |
| RAM (Docker) | 16 GB rekommenderat |

### Beslutspunkter

Innan implementation måste följande beslutas:

1. **Regionindelning vs Monolitisk**: Rekommendation är regionindelning
2. **Zoom-nivåer**: z8-12 för hillshade, z8-11 för contours
3. **DEM-källa**: GLO-30 (Copernicus)
4. **Contour-intervall**: 50m och 100m för storskalig täckning
5. **Prioriteringsordning**: Götaland först (mest befolkat)

---

## Phase 12 - Produktionsdeterminism som officiell produktgaranti 🟡 KORTSIKTIG

**Mål**: Formalisera byte-identiska exports som ett explicit produktlöfte för reprints, serietryck och B2B-användning.

**Syfte**: Stärka trovärdighet och differentiering utan att öka UI-komplexitet.

**Avgränsning**: Ingen ny renderingsteknik, endast formalisering och automatisering av befintliga flöden.

### Översikt

Systemet garanterar redan deterministiska exports (SHA256 byte-identitet verifierad för Demo B). Denna phase formaliserar detta som en explicit produktgaranti och automatisering.

### Fas 12.1 - CI-integration för determinism

| Uppgift | Status |
|---------|--------|
| Determinism-tester i CI (render-jämförelser) | ⬜ TODO |
| Render smoke tests för print-pipen | ⬜ TODO |
| Automatiserad SHA256-verifiering per preset | ⬜ TODO |
| Regression detection vid rendering-ändringar | ⬜ TODO |

### Fas 12.2 - Dokumentation och garantier

| Uppgift | Status |
|---------|--------|
| Produktgaranti-dokumentation (reprints, serietryck) | ⬜ TODO |
| B2B-determinism SLA-dokumentation | ⬜ TODO |
| Marknadsföringsmaterial för determinism-fördelar | ⬜ TODO |

### Krav

- ✅ Determinism redan verifierad (v1.1 Operational Hardening)
- ⬜ CI-integration för kontinuerlig verifiering
- ⬜ Explicit produktgaranti-dokumentation
- ⬜ Automatiserad regression detection

**Prioritet**: Hög (låg risk, direkt värde för B2B)

---

## Phase 13 - Kuraterade temakollektioner 🟡 KORTSIKTIG

**Mål**: Utöka befintliga "gallery ready"-teman med nya kuraterade varianter (säsongs-, material- eller limited-edition-inspirerade).

**Syfte**: Öka kommersiell attraktionskraft och återköpsfrekvens.

**Avgränsning**: Inga användardefinierade färgpaletter. Teman paketeras som färdiga stilar i UI (ej fri färgkonfiguration).

### Översikt

Systemet har redan 24 teman implementerade. Denna phase fokuserar på att utöka med kuraterade kollektioner som är designade för specifika användningsfall eller säsonger.

### Fas 13.1 - Kollektionsdesign

| Uppgift | Status |
|---------|--------|
| Säsongsteman (vår, sommar, höst, vinter) | ⬜ TODO |
| Material-inspirerade teman (trä, metall, papper) | ⬜ TODO |
| Limited-edition varianter | ⬜ TODO |
| Kuraterad "gallery ready"-kollektion | ⬜ TODO |

### Fas 13.2 - UI-integration

| Uppgift | Status |
|---------|--------|
| Temakollektioner som separata kategorier i UI | ⬜ TODO |
| Kollektionsvisning i Print Editor | ⬜ TODO |
| Preset-paketering per kollektion | ⬜ TODO |

### Krav

- ✅ Befintliga 24 teman som bas
- ⬜ Nya kuraterade teman (4-8 st)
- ⬜ UI-kategorisering av kollektioner
- ⬜ Preset-paketering per kollektion

**Prioritet**: Medel (byggt på befintlig infrastruktur)

---

## Phase 14 - Kontrollerade label- och POI-profiler 🟡 STRATEGISK

**Mål**: Införa ett litet antal hårt kuraterade presets för labels och POI (Points of Interest) som möjliggör personalisering utan att urholka estetik eller visuell stabilitet.

**Syfte**: Möjliggöra personalisering utan att urholka estetik eller visuell stabilitet.

**Avgränsning**: Inga fria toggles per lager, inga contour-labels. "Labels off" förblir default.

### Översikt

Systemet har redan layer toggles implementerade (Phase 7). Denna phase lägger till kontrollerade label- och POI-profiler som är deterministiska och följer tydliga estetiska constraints.

### Fas 14.1 - Profildefinitioner

| Uppgift | Status |
|---------|--------|
| Minimal gatuetikett-profil | ⬜ TODO |
| Utvalda landmärken-profil | ⬜ TODO |
| Estetiska constraints per profil | ⬜ TODO |
| Determinism-verifiering per profil | ⬜ TODO |

### Fas 14.2 - UI-integration

| Uppgift | Status |
|---------|--------|
| Label-profil selector i Print Editor | ⬜ TODO |
| Preview av label-profil | ⬜ TODO |
| Preset-integration (label-profil i preset) | ⬜ TODO |

### Krav

- ✅ Layer toggles redan implementerade (Phase 7)
- ⬜ Kuraterade label-profiler (2-3 st)
- ⬜ Estetiska constraints dokumenterade
- ⬜ Determinism-verifiering per profil
- ⬜ UI-integration för profilval

**Prioritet**: Medel (strategisk, ny funktionalitet)

---

## Phase 15 - Stegvis geografisk expansion 🟡 STRATEGISK

**Mål**: Utöka från nuvarande Stockholm-bboxar till fler fördefinierade städer/bbox-presets.

**Syfte**: Öka marknadsräckvidd med bibehållen produktionskontroll.

**Avgränsning**: Ingen fri ritning av bounding box i första steget. Använd befintliga Stockholm-presets som kvalitetsmall.

### Översikt

Phase 11 fokuserar på regional täckning (Svealand, Götaland, Norrland). Denna phase fokuserar på stadsnivå med fördefinierade bbox-presets för specifika städer.

### Fas 15.1 - Stadspreset-definitioner

| Uppgift | Status |
|---------|--------|
| Identifiera prioriterade städer (Göteborg, Malmö, Uppsala, etc.) | ⬜ TODO |
| Bbox-presets per stad (core + wide varianter) | ⬜ TODO |
| Kvalitetsmall baserad på Stockholm-presets | ⬜ TODO |
| Preset_limits.json uppdateringar per stad | ⬜ TODO |

### Fas 15.2 - Data-generering per stad

| Uppgift | Status |
|---------|--------|
| OSM-tiles per stad | ⬜ TODO |
| DEM-täckning per stad | ⬜ TODO |
| Hillshade-tiles per stad | ⬜ TODO |
| Contour-tiles per stad | ⬜ TODO |
| QA-verifiering per stad | ⬜ TODO |

### Fas 15.3 - UI-integration

| Uppgift | Status |
|---------|--------|
| Stadspreset-selector i Print Editor | ⬜ TODO |
| Bbox-preset dropdown med städer | ⬜ TODO |
| Preset-visualisering per stad | ⬜ TODO |

### Krav

- ✅ Stockholm-presets som kvalitetsmall
- ✅ Befintlig build-pipeline (Phase 6)
- ⬜ Stadspreset-definitioner (5-10 städer)
- ⬜ Data-generering per stad
- ⬜ UI-integration för stadspreset-val

**Prioritet**: Medel (strategisk, högre komplexitet, bygger på Phase 11)

---

## Framtida förbättringar (ej schemalagda)

### v1.1 — Operational Hardening ✅ IMPLEMENTED

**Mål**: Skydda reproducerbarhet och korrekthet över tid.

Design- och policydokument: [V1_1_OPERATIONAL_HARDENING.md](V1_1_OPERATIONAL_HARDENING.md)

| Komponent | Status |
|-----------|--------|
| Reproducerbarhetkontrakt (SHA256 byte-identitet för Demo B) | ✅ DONE |
| Golden export-strategi (Tier 1 + Tier 2 presets) | ✅ DONE |
| CI/verifieringsworkflows (demo-b-reproducibility, update-baselines) | ✅ DONE |
| Beroendehantering (pinnade versioner i Dockerfile/requirements) | ✅ DONE |
| Utvecklararbetsflöden och guardrails | ✅ DONE |
| Operationell runbook | ✅ DONE |

**Dokumentation**:
- [V1_1_OPERATIONAL_HARDENING.md](V1_1_OPERATIONAL_HARDENING.md) - Design och policy
- [OPERATIONAL_RUNBOOK.md](OPERATIONAL_RUNBOOK.md) - Driftdokumentation
- [golden/demo_b/README.md](../golden/demo_b/README.md) - Golden baselines

**Status**: ✅ Implementerad 2025-12-27.

---

### Perspektiv / Pitch

- Endast Demo A (MapLibre stödjer pitch)
- Skala döljs eller märks "Not to scale" vid pitch ≠ 0
- Användning: konstnärliga exports, previews

### Visual QA / Regression

- Referensexporter per theme + preset
- Manuell jämförelse vid ändringar
- Dokumentation av förväntade resultat

### Out of Scope (för nu)

- 3D-byggnader i Demo B (endast 2D top-down)
- Avancerad typografi
- Interaktiv annotation
- User-editable themes

---

## Implementation Order (rekommenderad)

### Kortsiktiga (låg risk)

1. **Phase 7** - UI Layer Controls (grundläggande interaktivitet) ✅ DONE
2. **Phase 8** - Print Composition System (professionella exports) ✅ DONE
3. **Phase 9** - Preset Export System (användarvänlighet) ✅ DONE
4. **Phase 12** - Produktionsdeterminism som officiell produktgaranti (låg risk, direkt B2B-värde)
5. **Phase 13** - Kuraterade temakollektioner (byggt på befintlig infrastruktur)

### Strategiska (medel-hög komplexitet)

6. **Phase 14** - Kontrollerade label- och POI-profiler (ny funktionalitet)
7. **Phase 11** - Sweden Full Coverage (regional expansion)
8. **Phase 15** - Stegvis geografisk expansion (stadspresets)

---

## Changelog

### 2025-12-27 (Gallery UI Component)

- ✅ **Phase 10.7 - Gallery UI Component** KOMPLETT:
  - Gallery UI Contract v1.0 dokumenterad
  - Standalone reference implementation (gallery.js, gallery.css, gallery.html)
  - Full ARIA accessibility (role=listbox, role=option, aria-selected, keyboard nav)
  - CSS-only responsive columns (media queries at 768/1024/1280px)
  - setLoading() API för loading state
  - Editor integration template (editor-integration.js)
  - Scandinavian design med CSS custom properties
  - Browser verification (partial - Playwright MCP timeout issues)
  - Nya dokumentfiler:
    - `docs/GALLERY_UI_CONTRACT.md` - Full API & styling contract
    - `docs/GALLERY_TEST_REPORT.md` - Test results and manual checklist

### 2025-12-27 (Roadmap-initiativ - Fyra nya epics)

- ⬜ **Phase 12 - Produktionsdeterminism som officiell produktgaranti** planerad:
  - Formalisering av byte-identiska exports som produktlöfte
  - CI-integration för determinism-tester och render smoke tests
  - Produktgaranti-dokumentation för reprints, serietryck och B2B
  - Prioritet: Hög (låg risk, direkt värde för B2B)
- ⬜ **Phase 13 - Kuraterade temakollektioner** planerad:
  - Utökning av befintliga teman med säsongs-, material- och limited-edition-varianter
  - UI-kategorisering av temakollektioner
  - Preset-paketering per kollektion
  - Prioritet: Medel (byggt på befintlig infrastruktur)
- ⬜ **Phase 14 - Kontrollerade label- och POI-profiler** planerad:
  - Hårt kuraterade presets för labels (minimal gatuetikett, utvalda landmärken)
  - Estetiska constraints och determinism-verifiering
  - UI-integration för profilval
  - Prioritet: Medel (strategisk, ny funktionalitet)
- ⬜ **Phase 15 - Stegvis geografisk expansion** planerad:
  - Utökning till fler fördefinierade städer/bbox-presets (Göteborg, Malmö, Uppsala, etc.)
  - Användning av Stockholm-presets som kvalitetsmall
  - Stadspreset-selector i Print Editor
  - Prioritet: Medel (strategisk, högre komplexitet)

### 2025-12-27 (Fas 3b - Effect Pipeline / Risograph)

- ✅ **Fas 3b - Effect Pipeline** KOMPLETT:
  - Post-render Effect Pipeline architecture implementerad
  - Risograph-effekt i Demo A (JavaScript/Canvas) och Demo B (Python/PIL)
  - Determinism verifierad (same input + seed = identical output)
  - Mulberry32 PRNG för seeded grain-textur
  - Debounced effect application för smooth interaktivitet
  - Nya filer:
    - `demo-a/web/public/effects/` (utils.js, risograph.js, index.js, test-determinism.html)
    - `demo-b/renderer/src/effects/` (__init__.py, risograph.py, utils.py, test_risograph_determinism.py)
    - `themes/riso-red-cyan.json` - Risograph-enabled theme
    - `config/export_presets/A2_Riso_RedCyan_v1.json` - Export preset
    - `docs/EFFECT_PIPELINE_ARCHITECTURE.md` - Architecture documentation
  - Tester: Python 6/6 PASS, Browser 5/5 PASS

### 2025-12-27 (Phase 11 - Sweden Full Coverage Plan)

- ⬜ **Phase 11 - Sweden Full Coverage** planerad:
  - Detaljerad plan skapad: [SWEDEN_FULL_COVERAGE_PLAN.md](SWEDEN_FULL_COVERAGE_PLAN.md)
  - Regionindelning: götaland, norrland_syd, norrland_nord
  - Uppskattad diskåtgång: 150-200 GB
  - Uppskattad byggtid: 48-72 timmar
  - Beslutspunkter definierade
  - Risker och mitigationer dokumenterade

### 2025-12-27 (New Themes & Presets - Batch 2)

- ✅ **10 new themes added** (24 total):
  - Silver Foil - elegant silver metallic on black
  - Copper - warm copper/bronze metallic tones
  - Cyberpunk - neon green/pink dystopian aesthetic
  - Chalk - chalk on blackboard educational style
  - Thermal - infrared heat-camera palette
  - Bauhaus - bold primary colors, modernist design
  - Art Deco - 1920s gold/cream/black elegance
  - Forest - autumn earth tones, nature palette
  - Ocean - marine blues and teals
  - High Contrast - accessibility-focused black/white
- ✅ **10 new export presets added** (24 total):
  - A2_Silver_Foil_v1, A3_Copper_v1, A2_Cyberpunk_v1
  - A3_Chalk_v1, A2_Thermal_v1, A3_Bauhaus_v1
  - A2_Art_Deco_v1, A3_Forest_v1, A2_Ocean_v1
  - A4_High_Contrast_v1
- ✅ All themes tested in Print Editor
- ✅ All presets verified via API (24/24 loading)

### 2025-12-27 (New Themes & Presets - Batch 1)

- ✅ **4 new themes added**:
  - Neon (Synthwave) - vibrant neon lines on dark background
  - Vintage (USGS Classic) - sepia-toned classic topographic style
  - Gold Foil (Premium) - gold lines on black background
  - Night (Dark Mode) - muted contrast dark theme
- ✅ **5 new export presets added**:
  - A3_Contour_Night_v1 - Stark contour-only poster
  - A2_Neon_Synthwave_v1 - Synthwave poster aesthetic
  - A3_Vintage_USGS_v1 - Classic topographic print
  - A2_Gold_Foil_v1 - Premium luxury poster
  - A4_Night_v1 - Compact dark mode print
- ✅ Design catalog updated with new themes
- ✅ All themes tested in Print Editor

### 2025-12-27 (v1.1 Operational Hardening)

- ✅ **v1.1 — Operational Hardening** KOMPLETT:
  - Reproducerbarhetkontrakt implementerat (SHA256 byte-identitet)
  - Golden export-strategi med Tier 1 + Tier 2 presets
  - CI workflows: demo-b-reproducibility.yml, update-baselines.yml
  - Dependency pinning (Python 3.11.7, Mapnik 3.1.0, pycairo 1.26.0)
  - Operationell runbook (OPERATIONAL_RUNBOOK.md)
  - qa_golden_demo_b.js med --tier1 och --regenerate flaggor
  - metadata.json med SHA256 checksums och tier-definitioner

### 2025-12-26 (Nordic Print Editor Complete)

- ✅ **Phase 10 - Interactive Print Editor & Advanced Export** KOMPLETT:
  - Nordic/Scandinavian UI redesign med ljusa färger
  - 50/50 sidebar/map layout
  - Optional scale checkbox (valfri skala)
  - Optional attribution checkbox (valfri attribution)
  - Subtle attribution styling (9px, muted color)
  - Fullscreen preview mode
  - Close Preview button + ESC key support
  - 5 layout templates: Classic, Modern, Minimal, Elegant, Bold
  - Playwright tests: 25/25 PASS
  - Chrome DevTools verification complete

### 2025-12-26 (Interactive Print Editor)

- ✅ **Phase 10 - Interactive Print Editor & Advanced Export** implementerad:
  - TODO_EXPORT_EDITOR.md skapad med detaljerad implementeringsplan
  - ROADMAP uppdaterad med Phase 10
  - Bbox drawing tool implementation startad
  - Editor panel UI design påbörjad

### 2025-12-27 (kväll)

- ✅ **Phase 5.5 - Infra & Quality Hardening** komplett:
  - Preset limits med DPI/format-begränsningar per preset
  - Server-side validering i renderer med /validate och /preset-limits endpoints
  - UI varningar i Demo B (real-time validering)
  - Build utilities med preflight-checks, progress logging och timing
  - QA test suite med Playwright (10/10 PASS Demo A, 5/7 PASS Demo B)
  - Design catalog med 6 MVP-stilar och render-pipeline dokumentation
- ✅ Nya dokumentationsfiler: PRESET_LIMITS.md, BUILD_GUIDE.md, DESIGN_CATALOG.md

### 2025-12-27 (tidig morgon)

- ✅ **Design & Style Catalog** kompletterad med detaljerade implementeringsförslag
- ✅ Varje stil inkluderar nu konkreta kommandon, färgkoder och tekniker
- ✅ 30+ stiliserade teman dokumenterade med implementation-detaljer
- ✅ Anpassningsparametrar-tabell tillagd
- ✅ Avancerade funktioner (3D, STL-export) dokumenterade

### 2025-12-26 (kväll)

- ✅ **Coverage Audit** dokumenterad i STATUS.md
- ✅ Entry-script `build_full_coverage.ps1/.sh` skapad
- ✅ ROADMAP uppdaterad med TODO/DOING/DONE-format
- ✅ Phase 6 (Full Coverage Pipeline) dokumenterad
- ✅ Stockholm Wide terrain komplett (DEM, hillshade, contours)

### 2025-12-26 (eftermiddag)

- ✅ **Stockholm Wide preset** fullt implementerad (OSM-lager)
- ✅ Martin config uppdaterad för preset-aware contours
- ✅ themeToStyle.js uppdaterad för preset-aware tile sources
- ✅ Demo B renderer uppdaterad för preset-aware hillshade
- ✅ Build-script för Stockholm Wide (`scripts/build_stockholm_wide.ps1`, `.sh`)
- ✅ Screenshot-automatisering (`scripts/capture_screenshots.ps1`, `.sh`)
- ✅ Dokumentation uppdaterad (STATUS, USAGE, ROADMAP)

### 2025-12-26 (förmiddag)

- ✅ Systemet baseline klar (Demo A + Demo B fungerar)
- ✅ Alla kritiska buggar lösta
- ✅ Dynamiska teman implementerade
- ✅ Layer toggles i Demo A (hillshade, water, roads, buildings, contours)
- ✅ Dokumentation skapad (docs/)
