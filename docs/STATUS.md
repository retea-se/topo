# Systemstatus

**Senast uppdaterad**: 2025-12-26

## Sammanfattning

Båda demos (Demo A och Demo B) är fullt fungerande med komplett exportfunktionalitet.
**Stockholm Wide** preset stöds nu fullt ut i båda demos med full coverage för förorter.

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
| Layer toggles (hillshade, water, roads, buildings, contours) | Fungerar |
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
| **Stockholm Wide preset** | **Fungerar** |
| **Preset-aware hillshade** | **Fungerar** |

### Data & Tiles

| Komponent | Status |
|-----------|--------|
| OSM-data (Stockholm Core) | Genererad |
| OSM-data (Stockholm Wide) | Genereras via script |
| DEM-data | Manuellt placerad |
| Hillshade tiles (Core) | Genererade |
| Hillshade tiles (Wide) | Genereras via script |
| OSM tiles (Core) | Genererade |
| OSM tiles (Wide) | Genereras via script |
| Contour tiles (Core) | Genererade |
| Contour tiles (Wide) | Genereras via script |
| PostGIS-import | Fungerar |

### Presets

| Preset | Bbox (WGS84) | Coverage |
|--------|--------------|----------|
| stockholm_core | 17.90, 59.32, 18.08, 59.35 | Centrala Stockholm |
| stockholm_wide | 17.75, 59.28, 18.25, 59.40 | Stor-Stockholm inkl. förorter |

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

- DEM-data kräver manuell nedladdning (EU-DEM Copernicus-åtkomst)
- stockholm_wide-preset genererar större tiles

## Senaste fixar (2025-12-26)

1. **Hillshade 404-fix** - Korrigerat TMS-schema för rätt y-koordinater
2. **Mapnik XML-fix** - Borttagna ogiltiga wrapper-element
3. **Dimensions-fix** - `round()` istället för `int()` för exakta pixlar
4. **Dynamiska teman** - `/api/themes` endpoint i båda demos
5. **SQL-fix** - Borttagna `ST_Hash()`-anrop som inte finns i PostGIS

## Nästa steg

Se [ROADMAP.md](ROADMAP.md) för planerade funktioner.
