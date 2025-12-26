# Systemstatus

**Senast uppdaterad**: 2025-12-26

## Sammanfattning

Båda demos (Demo A och Demo B) är fullt fungerande med komplett exportfunktionalitet.

**Stockholm Wide status**: OSM-lager har full täckning. Terrain-lager (hillshade, contours) saknar DEM-data för wide-området och måste genereras manuellt (se instruktioner nedan).

---

## Coverage Audit (2025-12-26)

Verifierad datatäckning per preset:

| Datatyp | stockholm_core | stockholm_wide |
|---------|----------------|----------------|
| OSM PBF | ✅ 3.5 MB | ✅ 17 MB |
| OSM tiles (mbtiles) | ✅ 4 MB | ✅ 21 MB |
| DEM (GeoTIFF) | ✅ 2.1 MB | ❌ **SAKNAS** |
| Hillshade raster | ✅ 682 KB | ❌ Kräver DEM |
| Hillshade tiles (XYZ) | ✅ z10-16 | ❌ Kräver DEM |
| Contours GeoJSON | ✅ 2m/10m/50m | ❌ Kräver DEM |
| Contours tiles (mbtiles) | ✅ 540 MB | ❌ Kräver DEM |

### Åtgärd för Stockholm Wide terrain

**Automatiserad (rekommenderat):**
```powershell
# Kräver Copernicus Data Space-konto
$env:COPERNICUS_USERNAME = "din-email@example.com"
$env:COPERNICUS_PASSWORD = "ditt-lösenord"
.\scripts\prepare_dem_stockholm_wide.ps1
.\scripts\build_stockholm_wide.ps1 -SkipOsm
```

**Semi-automatiserad (manuell nedladdning):**
1. Ladda ner EU-DEM från https://land.copernicus.eu/imagery-in-situ/eu-dem/eu-dem-v1.1
2. Kör: `.\scripts\prepare_dem_stockholm_wide.ps1 -InputFile "sökväg\till\nedladdad.tif"`
3. Kör: `.\scripts\build_stockholm_wide.ps1 -SkipOsm`

Se `DEM_MANUAL_DOWNLOAD.md` för detaljerade instruktioner.

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

| Komponent | stockholm_core | stockholm_wide |
|-----------|----------------|----------------|
| OSM PBF | ✅ Genererad | ✅ Genererad |
| OSM tiles | ✅ Genererade | ✅ Genererade |
| DEM-data | ✅ Manuellt placerad | ❌ **Saknas** |
| Hillshade raster | ✅ Genererad | ⏳ Kräver DEM |
| Hillshade tiles | ✅ Genererade | ⏳ Kräver DEM |
| Contour GeoJSON | ✅ Genererade | ⏳ Kräver DEM |
| Contour tiles | ✅ Genererade | ⏳ Kräver DEM |
| PostGIS-import | ✅ Fungerar | ✅ Fungerar |

**Not**: stockholm_wide terrain-lager genereras automatiskt när DEM-filen placeras och `build_stockholm_wide.ps1` körs.

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

- DEM-data kan laddas ner automatiskt med Copernicus Data Space-konto (se `DEM_MANUAL_DOWNLOAD.md`)
- Alternativt: manuell nedladdning med semi-automatiserad processering
- stockholm_wide-preset genererar större tiles

## Visuell verifiering (2025-12-26)

Screenshots tagna för verifiering:

| Screenshot | Storlek | Status |
|------------|---------|--------|
| demoA_core_paper.png | 693 KB | ✅ Alla lager synliga |
| demoA_wide_paper.png | 701 KB | ✅ OSM synligt, terrain saknas |
| demoB_core_paper.png | 173 KB | ✅ Alla lager synliga |
| demoB_wide_paper.png | 45 KB | ⚠️ Endast OSM (DEM saknas) |

**Not**: stockholm_wide visar endast OSM-lager (vägar, byggnader, vatten) eftersom DEM saknas.
Efter DEM-installation och `build_stockholm_wide.ps1 -SkipOsm` kommer hillshade och contours att visas.

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

## Nästa steg

Se [ROADMAP.md](ROADMAP.md) för planerade funktioner.
