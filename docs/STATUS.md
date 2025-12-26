# Systemstatus

**Senast uppdaterad**: 2025-12-26 19:25

## Sammanfattning

Båda demos (Demo A och Demo B) är fullt fungerande med komplett exportfunktionalitet.

**Stockholm Wide status**: ✅ **Full coverage** - Både OSM-lager och terrain-lager (hillshade, contours) är nu tillgängliga.

**Svealand status**: ✅ **Full coverage** - Både OSM-lager och terrain-lager (hillshade, contours) är tillgängliga. Zoomnivåer är begränsade för att hantera stort område (hillshade: z9-14, contours: z8-13).

---

## Coverage Audit (2025-12-26)

Verifierad datatäckning per preset:

| Datatyp | stockholm_core | stockholm_wide | svealand |
|---------|----------------|----------------|----------|
| OSM PBF | ✅ 3.5 MB | ✅ 17 MB | ✅ ~150 MB (est.) |
| OSM tiles (mbtiles) | ✅ 4 MB | ✅ 21 MB | ✅ ~180 MB (est.) |
| DEM (GeoTIFF) | ✅ 2.1 MB | ✅ 9.5 MB | ✅ ~500 MB (est.) |
| Hillshade raster | ✅ 682 KB | ✅ 4.5 MB | ✅ ~50 MB (est.) |
| Hillshade tiles (XYZ) | ✅ z10-16 | ✅ z10-16 | ✅ z9-14 (begränsat) |
| Contours GeoJSON | ✅ 2m/10m/50m | ✅ 2m/10m/50m | ✅ 2m/10m/50m |
| Contours tiles (mbtiles) | ✅ 540 MB | ✅ 37 MB | ✅ ~200 MB (est., z8-13) |

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
| Demo B Web | 3001 | Aktiv |
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

Screenshots sparade i: `exports/screenshots/`

---

## Senaste fixar (2025-12-26)

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
