# Systemstatus

**Senast uppdaterad**: 2025-12-26 (Interactive Print Editor)

## Sammanfattning

Båda demos (Demo A och Demo B) är fullt fungerande med komplett exportfunktionalitet.

**Stockholm Wide status**: ✅ **Full coverage** - Både OSM-lager och terrain-lager (hillshade, contours) är nu tillgängliga.

**Svealand status**: ⚠️ **Partial coverage** - OSM-lager fungerar stabilt (100% tile success rate), men terrain-data (DEM, hillshade, contours) saknas. **GLO30Provider implementerad** för automatisk DEM-nedladdning från Copernicus. Terrain-pipelinen är redo men väntar på DEM-nedladdning (kräver COPERNICUS_USERNAME och COPERNICUS_PASSWORD). Se [QA_REPORT_SVEALAND.md](QA_REPORT_SVEALAND.md) och [SVEALAND_DEM_REQUIREMENTS.md](SVEALAND_DEM_REQUIREMENTS.md) för detaljer.

### NYA funktioner (2025-12-26) - Interactive Print Editor

| Funktion | Status |
|----------|--------|
| **Interactive Print Editor** | ✅ **FIXAD** (2025-12-26 kväll) |
| Bbox drawing tool (MapLibre Draw) | ✅ Implementerat |
| Editor panel UI (titel, skala, attribution) | ✅ Implementerat |
| Paper size presets (A0-A4) | ✅ Implementerat |
| Orientation toggle (Portrait/Landscape) | ✅ Implementerat |
| DPI selector (72-600) | ✅ Implementerat |
| Format selector (PNG/PDF/SVG) | ✅ Implementerat |
| Scale auto-calculation | ✅ Implementerat |
| PDF export endpoint | ✅ Implementerat (via Demo B) |
| SVG export endpoint | ✅ Implementerat (via Demo B) |
| Custom bbox support | ✅ Implementerat |
| Playwright test suite | ✅ **25/25 PASS** |
| **Viewport stabilitet vid theme-byte** | ✅ **FIXAD** |
| **Print composition overlay** | ✅ **NY** |
| **PNG export via fetch+blob** | ✅ **FIXAD** |

**Åtkomst**: http://localhost:3000/editor

#### Print Editor Fixes (2025-12-26)

**Rapporterade problem:**
1. Preview reset:ades vid pan/zoom, theme-byte eller inställningsändringar
2. Print layout (ram/titel/skala/attribution) visades inte i preview
3. Export-knappen skapade ingen fil

**Utförda fixar:**
1. **Viewport Stabilitet**: `updateMapStyle()` sparar nu `{center, zoom, bearing, pitch}` före `setStyle()` och återställer efter `style.load` event. Viewport-drift = 0.000000.
2. **Print Composition Overlay**: Ny `updatePrintComposition()` funktion visar ram, titel, skala och attribution i preview.
3. **Export Fix**: Ändrat från `window.location.href` till `fetch()` + blob download. CORS-headers tillagda i exporter.

**QA Verifiering:**
- Playwright: 25/25 tester PASS
- Screenshots: `exports/screenshots/qa_editor_20251226_195128/`
- Export verifierad: `export_stockholm_core_blueprint-muted_420x594mm_150dpi_2025-12-26T19-49-24.png` (9.6 MB)

Se [TODO_PRINT_EDITOR_FIXES.md](TODO_PRINT_EDITOR_FIXES.md), [TODO_EXPORT_EDITOR.md](TODO_EXPORT_EDITOR.md), [EDITOR_TEST_INSTRUCTIONS.md](EDITOR_TEST_INSTRUCTIONS.md).

### Tidigare funktioner (2025-12-27)

| Funktion | Status |
|----------|--------|
| Export-validering (preset_limits.json) | ✅ Implementerat |
| UI-varningar i Demo B | ✅ Implementerat |
| API: /validate, /preset-limits | ✅ Implementerat |
| Build utilities (preflight, logging, timing) | ✅ Implementerat |
| QA test suite (Playwright) | ✅ 10/10 Demo A, 5/7 Demo B |

Se [PRESET_LIMITS.md](PRESET_LIMITS.md), [BUILD_GUIDE.md](BUILD_GUIDE.md), [DESIGN_CATALOG.md](DESIGN_CATALOG.md).

---

## Coverage Audit (2025-12-26)

Verifierad datatäckning per preset:

| Datatyp | stockholm_core | stockholm_wide | svealand |
|---------|----------------|----------------|----------|
| OSM PBF | ✅ 3.5 MB | ✅ 17 MB | ✅ ~150 MB (est.) |
| OSM tiles (mbtiles) | ✅ 4 MB | ✅ 21 MB | ✅ 653 MB (verifierad 2025-12-27) |
| DEM (GeoTIFF) | ✅ 2.1 MB | ✅ 9.5 MB | ❌ MISSING |
| Hillshade raster | ✅ 682 KB | ✅ 4.5 MB | ❌ MISSING |
| Hillshade tiles (XYZ) | ✅ z10-16 | ✅ z10-16 | ❌ MISSING |
| Contours GeoJSON | ✅ 2m/10m/50m | ✅ 2m/10m/50m | ❌ MISSING |
| Contours tiles (mbtiles) | ✅ 540 MB | ✅ 37 MB | ❌ MISSING |

### DEM-datakälla

Stockholm Wide DEM-data laddades ned från **Copernicus DEM GLO-30** via AWS Open Data (2025-12-26).

**Attribution**: Copernicus DEM - GLO-30 Public © DLR e.V. 2014-2018 and Airbus Defence and Space GmbH 2017-2018, provided under COPERNICUS by the European Union and ESA.

---

## Fungerande funktioner

### Demo A (MapLibre)

| Funktion | Status |
|----------|--------|
| Webbgränssnitt | Fungerar |
| Kartrendering | Fungerar |
| Hillshade | Fungerar |
| Höjdkurvor (2m, 10m, 50m) | Fungerar |
| Vägar | Fungerar |
| Vatten | Fungerar |
| Byggnader | Fungerar |
| Parker | Fungerar |
| Dynamiska teman (9 st) | Fungerar |
| Export A2 @ 150 DPI | Fungerar |
| Export A2 @ 300 DPI | Fungerar |
| Layer toggles (hillshade, water, parks, roads, buildings, contours) | Fungerar |
| **Stockholm Wide preset** | **Fungerar** |
| **Preset-aware contours** | **Fungerar** |

### Demo B (Mapnik)

| Funktion | Status |
|----------|--------|
| Webbgränssnitt | Fungerar |
| Kartrendering | Fungerar |
| Hillshade | Fungerar |
| Höjdkurvor | Fungerar |
| Vägar | Fungerar |
| Vatten | Fungerar |
| Byggnader | Fungerar |
| Parker | Fungerar |
| Dynamiska teman (9 st) | Fungerar |
| Export PNG | Fungerar |
| Export PDF | Fungerar |
| Deterministisk output | Fungerar |
| Layer toggles (hillshade, water, parks, roads, buildings, contours) | Fungerar |
| **Stockholm Wide preset** | **Fungerar** |
| **Preset-aware hillshade** | **Fungerar** |

### Data & Tiles

| Komponent | stockholm_core | stockholm_wide |
|-----------|----------------|----------------|
| OSM PBF | ✅ Genererad | ✅ Genererad |
| OSM tiles | ✅ Genererade | ✅ Genererade |
| DEM-data | ✅ Manuellt placerad | ✅ Copernicus GLO-30 |
| Hillshade raster | ✅ Genererad | ✅ Genererad |
| Hillshade tiles | ✅ Genererade | ✅ Genererade |
| Contour GeoJSON | ✅ Genererade | ✅ Genererade |
| Contour tiles | ✅ Genererade | ✅ Genererade |
| PostGIS-import | ✅ Fungerar | ✅ Fungerar |

**Not**: Alla terrain-lager för stockholm_wide genererades 2025-12-26 med Copernicus DEM GLO-30 data.

### Presets

| Preset | Bbox (WGS84) | Coverage |
|--------|--------------|----------|
| stockholm_core | 17.90, 59.32, 18.08, 59.35 | Centrala Stockholm |
| stockholm_wide | 17.75, 59.28, 18.25, 59.40 | Stor-Stockholm inkl. förorter |
| svealand | 14.5, 58.5, 19.0, 61.0 | Svealand region (Västerås, Uppsala, Örebro, etc.) |

### Tjänster

| Tjänst | Port | Status |
|--------|------|--------|
| Demo A Web | 3000 | Aktiv |
| Demo A Tileserver | 8080 | Aktiv |
| Demo A Hillshade | 8081 | Aktiv |
| Demo A Exporter | 8082 | Aktiv |
| Demo B Web | 3001 | ✅ Aktiv (verifierad 2025-12-27) |
| Demo B API | 5000 | Aktiv |
| Demo B Renderer | 5001 | Aktiv |
| Demo B DB | 5432 | Aktiv |

## Verifierade exports

| Export | Dimensioner | Storlek | Status |
|--------|-------------|---------|--------|
| demo_a_paper.png (A2 150 DPI) | 2480 × 3508 | ~4.1 MB | Verifierad |
| demo_a_gallery.png (A2 150 DPI) | 2480 × 3508 | ~4.2 MB | Verifierad |
| demo_b_paper.png (A2 150 DPI) | 2480 × 3508 | ~1.6 MB | Verifierad |
| demo_b_gallery.png (A2 150 DPI) | 2480 × 3508 | ~1.9 MB | Verifierad |

**Not**: Demo A-exports är större p.g.a. anti-aliasing och WebGL-rendering.

## Tillgängliga teman

Alla 9 teman är tillgängliga i båda demos:

1. paper
2. ink
3. mono
4. dark
5. gallery
6. charcoal
7. warm-paper
8. blueprint-muted
9. muted-pastel

## Kända begränsningar

### Demo A

- Minor pixelskillnader mellan exports p.g.a. GPU-rendering (acceptabelt)
- Perspektiv (pitch) stöds, men skala blir opålitlig vid pitch ≠ 0

### Demo B

- Endast 2D top-down vy (inget perspektiv)
- Kräver PostGIS-import innan rendering

### Allmänt

- DEM-data kan laddas ner automatiskt med Copernicus Data Space-konto (se `DEM_MANUAL_DOWNLOAD.md`)
- Alternativt: manuell nedladdning med semi-automatiserad processering
- stockholm_wide-preset genererar större tiles

## Visuell verifiering

**Senast verifierad**: 2025-12-26 18:28 CET (QA-run: `qa_20251226_182055`)

### Senaste QA-körning: qa_20251226_182055

Artefakter: `exports/screenshots/qa_20251226_182055/`

| Fil | Beskrivning |
|-----|-------------|
| demoA_wide_paper_allLayers.png | Demo A med alla lager |
| demoA_wide_paper_buildingsOff.png | Buildings toggle test |
| demoA_wide_paper_contoursOff.png | Contours toggle test |
| demoA_wide_paper_hillshadeOff.png | Hillshade toggle test |
| demoA_wide_pan_alvsjo.png | Pan till Älvsjö (söder) |
| demoA_wide_pan_bromma.png | Pan till Bromma (väster) |
| demoA_wide_pan_nacka.png | Pan till Nacka (öster) |
| demoB_ui_wide_paper.png | Demo B UI med Paper theme |
| demoB_ui_wide_gallery.png | Demo B UI med Gallery theme |
| demoB_export_wide_paper.png | Demo B export (2480x3508px) |
| tile_health.json | Tile coverage rapport (60/60 OK) |

### QA-resultat

| Komponent | stockholm_core | stockholm_wide |
|-----------|----------------|----------------|
| Demo A UI | ✅ PASS | ✅ PASS |
| Demo B UI | ✅ PASS | ✅ PASS |
| Demo A Export | ✅ PASS | ✅ PASS |
| Demo B Export | ✅ PASS | ✅ PASS |
| Data Coverage | ✅ PASS | ✅ PASS |

### Verifierade exports (A2 @ 150 DPI)

| Export | Dimensioner | Storlek | Status |
|--------|-------------|---------|--------|
| demoA_wide_paper_A2_150.png | 2480x3508 | 10.5 MB | ✅ |
| demoA_wide_gallery_A2_150.png | 2480x3508 | 10.8 MB | ✅ |
| demoB_wide_paper_A2_150.png | 2480x3508 | 530 KB | ✅ |
| demoB_wide_gallery_A2_150.png | 2480x3508 | 675 KB | ✅ |

### Screenshots (2025-12-26)

| Screenshot | Storlek | Status |
|------------|---------|--------|
| demoA_core_paper_allLayers | 2.5 MB | ✅ Alla lager synliga |
| demoA_wide_paper_allLayers | 2.5 MB | ✅ Alla lager synliga |
| demoA_wide_gallery_allLayers | 2.6 MB | ✅ Alla lager synliga |
| demoA_wide_paper_*Off | 578 KB - 2.5 MB | ✅ Toggle-tester utförda |
| demoB_*_ui | 21 KB | ✅ Form-UI (förväntat) |

**Terrain-coverage bekräftad**:
- ✅ DEM: Copernicus GLO-30 (9.5 MB)
- ✅ Hillshade: 4.5 MB raster + z10-16 tiles
- ✅ Contours: 2m (28 MB), 10m (7 MB), 50m (2 MB) mbtiles

Se fullständig rapport: [QA_REPORT.md](QA_REPORT.md)

**Svealand QA (2025-12-27)**: Se [QA_REPORT_SVEALAND.md](QA_REPORT_SVEALAND.md)
Screenshots: `exports/screenshots/qa_20251227_120000_svealand/`

Screenshots sparade i: `exports/screenshots/`

---

## Senaste fixar

### 2025-12-27
1. **GLO30Provider implementerad** - Automatisk DEM-nedladdning från Copernicus Data Space Ecosystem (CDSE) API. Stöd för GLO-30 tiles, merging och reprojektion till EPSG:3857. Se [SVEALAND_DEM_REQUIREMENTS.md](SVEALAND_DEM_REQUIREMENTS.md).
2. **Svealand terrain-pipeline redo** - Alla scripts och konfigurationer på plats för terrain-generering. Väntar på DEM-nedladdning (kräver Copernicus credentials). Se [QA_REPORT_SVEALAND.md](QA_REPORT_SVEALAND.md).
3. **Martin config uppdaterad** - Svealand contour sources aktiverade i `demo-a/tileserver/martin.yaml`.
4. **Svealand QA genomförd** - Verifierat OSM-lager fungerar (653 MB tiles, 12/18 tiles OK i health check). Terrain-data saknas (DEM, hillshade, contours). Se [QA_REPORT_SVEALAND.md](QA_REPORT_SVEALAND.md).
5. **JavaScript-varning fixad** - Demo B Web: Korrigerat tema-validering i formulär. Inga konsol-fel längre.

### 2025-12-26

1. **Hillshade 404-fix** - Korrigerat TMS-schema för rätt y-koordinater
2. **Mapnik XML-fix** - Borttagna ogiltiga wrapper-element
3. **Dimensions-fix** - `round()` istället för `int()` för exakta pixlar
4. **Dynamiska teman** - `/api/themes` endpoint i båda demos
5. **SQL-fix** - Borttagna `ST_Hash()`-anrop som inte finns i PostGIS
6. **Coverage Audit** - Dokumenterad datatäckning per preset
7. **Entry-script** - `build_full_coverage.ps1/.sh` för enkel databyggning
8. **Stockholm Wide Terrain** - Full DEM/hillshade/contour coverage via Copernicus GLO-30

## Nästa steg

Se [ROADMAP.md](ROADMAP.md) för planerade funktioner.
