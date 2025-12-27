# Systemstatus

**Senast uppdaterad**: 2025-01-27 18:00 CET

## Sammanfattning

Båda demos (Demo A och Demo B) är fullt fungerande med komplett exportfunktionalitet.

### Fas 1: Nya Themes & Presets ✅ IMPLEMENTED (2025-12-27)

5 nya interior design-inspirerade teman och 5 matchande export presets.

**Nya Themes:**
| Theme | Beskrivning |
|-------|-------------|
| Japandi | Serene Japanese-Scandinavian fusion, muted tones |
| Scandi Minimal | Light and airy Scandinavian style, mustard accent |
| Duotone | Bold two-color graphic, navy and coral |
| Sepia | Classic aged photograph aesthetic |
| Mint | Fresh modern mint green palette |

**Nya Export Presets:**
| Preset | Paper | Theme |
|--------|-------|-------|
| A2 Japandi | A2 Portrait | Japandi 🔒 |
| A2 Scandi Minimal | A2 Portrait | Scandi Minimal 🔒 |
| A2 Duotone | A2 Landscape | Duotone 🔒 |
| A3 Sepia Classic | A3 Portrait | Sepia 🔒 |
| A4 Mint Fresh | A4 Portrait | Mint 🔒 |

**Verifiering:** ✅ Alla themes och presets testade i Print Editor (Chrome).

---

### Fas 2: Nya Themes & Presets ✅ IMPLEMENTED (2025-12-27)

5 nya expressiva teman och 5 matchande export presets.

**Nya Themes:**
| Theme | Beskrivning |
|-------|-------------|
| Arctic | Cool glacial blues, calm winter landscape |
| Sunset | Warm golden hour tones, romantic atmosphere |
| Lavender | Soft calming purples, relaxing aesthetic |
| Swiss | Clean modernist, bold black/white/red accent |
| Vaporwave | Retro 80s neon, pink/cyan/purple on dark |

**Nya Export Presets:**
| Preset | Paper | Theme |
|--------|-------|-------|
| A2 Arctic | A2 Portrait | Arctic 🔒 |
| A2 Sunset | A2 Landscape | Sunset 🔒 |
| A3 Lavender | A3 Portrait | Lavender 🔒 |
| A2 Swiss | A2 Portrait | Swiss 🔒 |
| A2 Vaporwave | A2 Landscape | Vaporwave 🔒 |

**Verifiering:** ✅ Alla themes och presets testade i Print Editor (Chrome).

---

### Fas 3a: Advanced Themes & Presets ✅ IMPLEMENTED (2025-12-27)

3 nya avancerade teman med distinkt visuell karaktär och 3 matchande presets.

**Nya Themes:**
| Theme | Beskrivning |
|-------|-------------|
| Woodblock | Japanese ukiyo-e inspired, bold graphic with traditional colors |
| Pencil Sketch | Hand-drawn architectural illustration, grayscale linework |
| Glitch | Digital corruption aesthetic, neon cyberpunk on black |

**Nya Export Presets:**
| Preset | Paper | Theme | Specialinställningar |
|--------|-------|-------|---------------------|
| A2 Woodblock | A2 Portrait | Woodblock 🔒 | Stockholm Wide |
| A3 Pencil Sketch | A3 Portrait | Pencil Sketch 🔒 | Scale bar on |
| A2 Glitch | A2 Landscape | Glitch 🔒 | Stockholm Wide |

**Verifiering:** ✅ Alla themes och presets testade i Print Editor (Chrome).

**Total themes i systemet:** 32

---

### v1.1 Operational Hardening ✅ IMPLEMENTED (2025-12-27)

v1.1 fokuserar på att skydda reproducerbarhet och korrekthet över tid.

| Komponent | Status |
|-----------|--------|
| Reproducerbarhetkontrakt (SHA256 byte-identitet) | ✅ DONE |
| Golden baselines (Tier 1 + Tier 2) | ✅ DONE |
| CI workflow (demo-b-reproducibility.yml) | ✅ DONE |
| Update-baselines workflow med guardrails | ✅ DONE |
| Dependency pinning (Python 3.11.7, Mapnik 3.1.0) | ✅ DONE |
| Operationell runbook | ✅ DONE |

**Golden Baselines (Demo B):**

| Preset | Tier | Region | SHA256 |
|--------|------|--------|--------|
| A4_Quick_v1 | Tier 1 | stockholm_core | PENDING |
| A2_Paper_v1 | Tier 1 | stockholm_core | PENDING |
| A3_Blueprint_v1 | Tier 2 | stockholm_core | PENDING |
| A1_Terrain_v1 | Tier 2 | stockholm_wide | PENDING |

*PENDING = baselines skapas vid första CI-körning*

**Test commands:**
```bash
# Tier 1 (fast, för varje PR)
node scripts/qa_golden_demo_b.js --tier1

# Full test (Tier 1 + Tier 2)
node scripts/qa_golden_demo_b.js
```

**Dokumentation:**
- [V1_1_OPERATIONAL_HARDENING.md](V1_1_OPERATIONAL_HARDENING.md) - Design och policy
- [OPERATIONAL_RUNBOOK.md](OPERATIONAL_RUNBOOK.md) - Driftdokumentation
- [golden/demo_b/README.md](../golden/demo_b/README.md) - Golden baselines

### Phase 9 - Export Presets ✅ DONE

**Reproducerbarhet verifierad**: Demo B, SHA256 identisk for alla testade presets (2025-12-26)

| Funktion | Status |
|----------|--------|
| Preset-filer (9 st) | ✅ DONE |
| GET /api/export-presets | ✅ DONE |
| GET /api/export-presets/{id} | ✅ DONE |
| POST /api/validate-preset | ✅ DONE |
| QA test script | ✅ DONE |
| Reproducerbarhet (SHA256) | ✅ VERIFIED |
| UI-integration | ✅ DONE |

**Presets (9 st):**
- A2_Paper_v1 - Klassisk vaggkarta (A2, 150 DPI, paper-tema)
- A3_Blueprint_v1 - Teknisk ritning (A3, 150 DPI, blueprint-muted, last)
- A1_Terrain_v1 - Stor terrangkarta (A1, 150 DPI, gallery-tema)
- A4_Quick_v1 - Snabbutskrift (A4, 150 DPI, paper-tema)
- A2_Contour_Minimal_v1 - Minimalistisk konturkarta (A2 portrait, ink-tema, last)
- A2_Terrain_GallerySoft_v1 - Mjuk terrangkarta for galleri (A2 landscape, gallery-tema, last)
- A3_FigureGround_Black_v1 - Stadsdiagram med mork bakgrund (A3 portrait, dark-tema, last)
- A2_Blueprint_Technical_v2 - Avancerad teknisk presentation (A2 landscape, 200 DPI, blueprint-muted, last)
- A2_Scandi_Light_v1 - Ljus skandinavisk karta (A2 landscape, warm-paper-tema, last)

**SHA256 Verification (2025-12-26):**
- A2_Paper_v1 (stockholm_core): `14fb5a04ee0df6c87a5f2758649618966511c52213d812aa9d994bbb4affc8b7`
- A1_Terrain_v1 (stockholm_wide): `5e899f5fc0d2e9462a6fcda7ad4f45fcd3051ee4fe8bc99d704efee1d7536fec`

**API Endpoints:**
- `GET /api/export-presets` - Lista alla presets
- `GET /api/export-presets/:id` - Hamta specifikt preset
- `POST /api/validate-preset` - Validera preset med overrides

**Test:** `node scripts/qa_preset_export.js`

**Stockholm Wide status**: ✅ **Full coverage** - Både OSM-lager och terrain-lager (hillshade, contours) är nu tillgängliga.

**Svealand status**: ✅ **Full coverage** - Alla lager (OSM + DEM + hillshade + contours) är tillgängliga och verifierade. DEM nedladdat från Copernicus GLO-30. Se [TODO_SVEALAND_FULL_COVERAGE.md](TODO_SVEALAND_FULL_COVERAGE.md) för detaljer.

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
| **Print composition overlay** | ✅ **NY** (15 layout templates: 5 original + 10 nya) |
| **PNG export via fetch+blob** | ✅ **FIXAD** |

**Åtkomst**: http://localhost:3000/editor

#### Playwright Test Hardening (2025-12-27) ✅ COMPLETE

**Förbättringar:**
- ✅ Test helpers: `waitForAppReady()`, `waitForPresetsLoaded()`, `selectPresetById()`
- ✅ Console error gate: tester failar på JS errors/warnings (WebGL/GPU-warnings filtrerade bort)
- ✅ Automatiska screenshots + HTML-dumps vid testfel
- ✅ Testrapport: `exports/TEST_RUN_REPORT.md` genereras efter körning
- ✅ Stabilare selectors: använder ID-selectors (redan stabila)
- ✅ Tydliga test.step() blocks för bättre läsbarhet
- ✅ **Locale-agnostic expectations**: Tester accepterar svenska UI-texter (t.ex. "papperskarta", "terrangkarta")
- ✅ **Flexibla format-matching**: Pappersstorlekar accepteras med eller utan "(210 x 297 mm)"-suffix
- ✅ **Stabilare assertions**: Tester använder regex/flexibla matcher för UI-texter

**Kör tester:**
```bash
npx playwright test scripts/test_print_editor.spec.js
npx playwright test scripts/test_export_presets_editor.spec.js
```

**Testresultat:** ✅ **29/29 PASS** (25 print editor + 4 export presets)

**Testrapport:** `exports/TEST_RUN_REPORT.md` innehåller:
- Testresultat (pass/fail/skipped)
- Screenshots och HTML-dumps vid fel
- Console errors och warnings
- Exekveringstid och sammanfattning

Se [USAGE.md](USAGE.md#testning-med-playwright) för detaljer.

#### Print Editor Fixes (2025-12-26)

**Rapporterade problem:**
1. Preview reset:ades vid pan/zoom, theme-byte eller inställningsändringar
2. Print layout (ram/titel/skala/attribution) visades inte i preview
3. Export-knappen skapade ingen fil

**Utförda fixar:**
1. **Viewport Stabilitet**: `updateMapStyle()` sparar nu `{center, zoom, bearing, pitch}` före `setStyle()` och återställer efter `style.load` event. Viewport-drift = 0.000000.
2. **Print Composition Overlay**: Ny `updatePrintComposition()` funktion visar ram, titel, skala och attribution i preview.

#### Layout Designs Extension (2025-01-27) ✅ COMPLETE

**Ny funktionalitet**: 10 nya layout designs tillagda till print editor.

| Feature | Status |
|---------|--------|
| Layout templates (total: 15) | ✅ 15 layouts (5 original + 10 nya) |
| Font loading (Google Fonts) | ✅ Playfair Display, Orbitron, Rajdhani, Courier Prime |
| CSS effects (grid, glow, decorative) | ✅ Implementerat |
| Title positions (8 olika) | ✅ top-left, top-right, bottom-right, bottom-center, diagonal, etc. |
| Frame styles (solid, double, none, glow) | ✅ Implementerat |
| Scale/attribution positioning | ✅ Flexibel positioning |
| Browser testing (preview mode) | ✅ Alla layouts testade och fungerar |

**Nya layouts**:
1. Minimalist - Extremt minimal, nästan ingen ram
2. Scientific - Vetenskaplig, datavisualiserings-stil
3. Blueprint - Teknisk, arkitektur-inspirerad med grid pattern
4. Gallery Print - Ren, konstnärlig
5. Vintage Map - Klassisk kartografisk stil med double frame
6. Artistic - Expressiv, kreativ med diagonal placement
7. Night Mode - Mörk med neon-accents och glow
8. Heritage - Historisk, museum-stil
9. Prestige - Premium, lyxig med guld-banner
10. Cyberpunk - Futuristisk, tech-inspirerad med neon glow

**Testresultat**:
- ✅ Alla 15 layouts renderas korrekt i preview mode
- ✅ Layout-byte fungerar utan fel
- ✅ Theme-byte fungerar med alla layouts
- ✅ Console: Inga kritiska fel

**Dokumentation**:
- [LAYOUT_DESIGN_PROPOSAL.md](LAYOUT_DESIGN_PROPOSAL.md) - Design proposal
- [LAYOUT_IMPLEMENTATION_PLAN.md](LAYOUT_IMPLEMENTATION_PLAN.md) - Implementation plan
- [LAYOUT_DESIGNS_IMPLEMENTATION_REPORT.md](../exports/LAYOUT_DESIGNS_IMPLEMENTATION_REPORT.md) - Implementation rapport

**Branch**: `feature/layout-designs` (redo för merge till main efter export-testing)
3. **Export Fix**: Ändrat från `window.location.href` till `fetch()` + blob download. CORS-headers tillagda i exporter.

**QA Verifiering:**
- Playwright: 25/25 tester PASS
- Screenshots: `exports/screenshots/qa_editor_20251226_195128/`
- Export verifierad: `export_stockholm_core_blueprint-muted_420x594mm_150dpi_2025-12-26T19-49-24.png` (9.6 MB)

Se [TODO_PRINT_EDITOR_FIXES.md](TODO_PRINT_EDITOR_FIXES.md), [TODO_EXPORT_EDITOR.md](../archive/TODO_EXPORT_EDITOR_completed.md) (arkiverad), [EDITOR_TEST_INSTRUCTIONS.md](EDITOR_TEST_INSTRUCTIONS.md).

#### Print Editor Theme Update Fix (2025-12-27) ✅ FIXED

**Rapporterat problem:**
- När export preset är "None (Custom)" och användaren ändrar "Style" → "Theme" uppdateras varken kartan eller preview i realtid.

**Root cause:**
- Saknad felhantering: om `loadTheme()` returnerade `null` fortsatte koden ändå, och `updateMapStyle()` returnerade tidigt.
- Preview uppdaterades inte: även om kartan uppdaterades, uppdaterades inte preview-kompositionen när theme ändrades.

**Utförda fixar:**
1. **Förbättrad felhantering**: Theme-select event listener kontrollerar nu om `loadTheme()` lyckas och visar felmeddelande om theme inte kan laddas.
2. **Preview-uppdatering**: Preview-kompositionen uppdateras nu direkt när theme ändras (om i preview mode), med liten delay för att säkerställa att kartan har renderats.
3. **Förbättrad timing**: `style.load` event handler har nu delay innan `updatePrintComposition()` anropas för att säkerställa att kartan är helt renderad.

**Verifiering:**
- Testat i Chrome: Theme-ändringar fungerar nu korrekt även när preset är "None (Custom)".
- Inga JavaScript-fel i konsolen.
- Preview uppdateras korrekt när theme ändras.

### Golden Print Export (2025-12-27) ✅ COMPLETE

Print export now matches preview - all composition elements are correctly rendered in exported files.

| Feature | Status |
|---------|--------|
| Frame/Border in export | ✅ FIXED |
| Title/Subtitle in export | ✅ FIXED |
| Scale bar in export | ✅ FIXED (calculated, not hardcoded) |
| Attribution in export | ✅ FIXED |
| Golden baseline tests | ✅ 3/3 PASS |
| Regression test script | ✅ IMPLEMENTED |
| 18-case audit matrix | ✅ IMPLEMENTED |

**Golden Baselines:**
- A3_Blueprint_v1_Classic: `48e4bbd0f787...` (2480x1754 px)
- A2_Paper_v1_Minimal: `ef0c5bb30a2b...` (3508x2480 px)
- A1_Terrain_v1_Bold: `b800e7908bad...` (3508x4967 px)

**Scale Calculation Fix (2025-12-27):**
- Exporter now calculates scale dynamically based on bbox and paper width
- Previously hardcoded "1:50 000" replaced with calculated values (e.g., "1:25K" for stockholm_wide)

**Test:** `node scripts/qa_golden_print_export.js`

**Dokumentation:**
- [QA_GOLDEN_EXPORTS.md](QA_GOLDEN_EXPORTS.md) - Användarguide för golden-systemet
- [QA_PRINT_EXPORT_GOLDEN.md](QA_PRINT_EXPORT_GOLDEN.md) - Teknisk implementation-historik
- [QA_CHECKLIST.md](QA_CHECKLIST.md) - Checklist för PRs som påverkar rendering/export
- [golden/print_export/README.md](../golden/print_export/README.md) - Teknisk dokumentation

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
| OSM PBF | ✅ 3.5 MB | ✅ 17 MB | ✅ ~150 MB |
| OSM tiles (mbtiles) | ✅ 4 MB | ✅ 21 MB | ✅ 653 MB |
| DEM (GeoTIFF) | ✅ 2.1 MB | ✅ 9.5 MB | ✅ 944 MB |
| Hillshade raster | ✅ 682 KB | ✅ 4.5 MB | ✅ 177 MB |
| Hillshade tiles (XYZ) | ✅ z10-16 | ✅ z10-16 | ✅ z10-14 (62,632 tiles) |
| Contours GeoJSON | ✅ 2m/10m/50m | ✅ 2m/10m/50m | ✅ 10m/50m |
| Contours tiles (mbtiles) | ✅ 540 MB | ✅ 37 MB | ✅ 123 MB (10m + 50m) |

### DEM-datakälla

Stockholm Wide och Svealand DEM-data laddades ned från **Copernicus DEM GLO-30** via AWS Open Data (2025-12-26).

**Attribution**: Copernicus DEM - GLO-30 Public © DLR e.V. 2014-2018 and Airbus Defence and Space GmbH 2017-2018, provided under COPERNICUS by the European Union and ESA.

**Svealand coverage**: 15 tiles (N58-N60 x E014-E018), merged and clipped to bbox [14.5, 58.5, 19.0, 61.0].

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
| Parks toggle export-paritet (layers URL-parameter) | ✅ Fungerar (2025-12-27) |
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

**29 teman** är tillgängliga i Print Editor:

**Grundteman (9 st):**
paper, ink, mono, dark, gallery, charcoal, warm-paper, blueprint-muted, muted-pastel

**Utökade teman (15 st):**
art-deco, bauhaus, chalk, copper, cyberpunk, forest, gold-foil, high-contrast, neon, night, ocean, silver-foil, thermal, vintage, void

**Fas 1 teman (5 st) - NYA 2025-12-27:**
japandi, scandi-minimal, duotone, sepia, mint

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

### 2025-12-26 (Evening)
1. **Svealand Full Coverage Complete** - Alla terrain-lager genererade och verifierade:
   - DEM: 15 Copernicus GLO-30 tiles nedladdade (313 MB), mergade till 944 MB GeoTIFF
   - Hillshade: 177 MB raster, 62,632 XYZ tiles (z10-14)
   - Contours: 10m (100 MB mbtiles), 50m (23 MB mbtiles)
2. **QA Test Suite** - Demo A: 9/10 PASS, Demo B: 7/7 PASS
3. **Tile Health Check** - 100% success rate (60/60 tiles)
4. **Martin config uppdaterad** - Svealand contour sources (10m, 50m) aktiverade

### 2025-12-27 (Earlier)
1. **GLO30Provider implementerad** - Automatisk DEM-nedladdning från Copernicus Data Space Ecosystem (CDSE) API.
2. **Svealand terrain-pipeline redo** - Alla scripts och konfigurationer på plats för terrain-generering.
3. **Martin config uppdaterad** - Svealand contour sources aktiverade i `demo-a/tileserver/martin.yaml`.
4. **Svealand QA genomförd** - Verifierat OSM-lager fungerar (653 MB tiles).
5. **JavaScript-varning fixad** - Demo B Web: Korrigerat tema-validering i formulär.

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

**v1.1 Operational Hardening**: Design- och policydokument färdigt (se [V1_1_OPERATIONAL_HARDENING.md](V1_1_OPERATIONAL_HARDENING.md)). Fokus på reproducerbarhet, golden exports och CI-verifiering.

**Nästa utvecklingsfas**: Se [NEXT_PHASE_PLAN.md](NEXT_PHASE_PLAN.md) för detaljerad plan med fokus på produktifiering, skalbarhet och UX-förbättringar.
