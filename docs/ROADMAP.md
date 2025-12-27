# Roadmap

**Senast uppdaterad**: 2025-12-27 (v1.1 Operational Hardening Implemented)

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
| Ram (valbar, tema-styrd) | ✅ DONE (5 layout templates) |
| Titel | ✅ DONE |
| Undertitel / plats | ✅ DONE |
| Skala (endast vid pitch = 0) | ✅ DONE (optional) |
| Attribution (OSM, Copernicus) | ✅ DONE (optional, subtle) |
| Marginal/safe-zone system | ✅ DONE |
| Metadata-overlay (paper size, dimensions) | ✅ DONE |

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

#### Neon / Synthwave
Mörk bakgrund, lysande linjer med glöd-effekt.

**Implementation:**
Bakgrund: `#0d0221`. Linjer: `#ff00ff`, `#00ffff`, `#ffff00`. Glöd: duplicera linje-lager, blur (Gaussian), lägg under original. CSS: `filter: drop-shadow(0 0 10px #ff00ff)`.

#### Vintage USGS
Klassiska topografiska kartor. Sepia-toner, åldrad papperstruktur.

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

#### Gold Foil
Simulerad guldfolie på mörk bakgrund.

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

#### Night Mode
Mörk bakgrund, dämpad kontrast.

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

1. **Phase 7** - UI Layer Controls (grundläggande interaktivitet)
2. **Phase 8** - Print Composition System (professionella exports)
3. **Phase 9** - Preset Export System (användarvänlighet)

---

## Changelog

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
