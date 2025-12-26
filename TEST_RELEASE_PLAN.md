# Test & Release Hardening Plan

## Summary

This document provides concrete steps, commands, and code patches to make the Topo Map Export System provably working and producing print-quality exports.

## 1. Runbook (Local Development)

See `RUNBOOK.md` for detailed step-by-step instructions from zero to first export.

**Quick reference:**

### Demo A - First Export
```bash
# 1. Prepare data (see RUNBOOK.md Stage 1)
docker-compose build prep
docker-compose run --rm prep python3 /app/src/download_osm.py
docker-compose run --rm prep python3 /app/src/clip_osm.py --preset stockholm_core
# ... (continue with DEM, hillshade, contours, tiles - see RUNBOOK.md)

# 2. Start Demo A
docker-compose --profile demoA up -d

# 3. Export
curl "http://localhost:8082/render?bbox_preset=stockholm_core&theme=paper&render_mode=print&dpi=150&width_mm=420&height_mm=594" \
  --output export_demo_a.png
```

### Demo B - First Export
```bash
# 1. Prepare data (same as Demo A)

# 2. Start Demo B
docker-compose --profile demoB up -d

# 3. Import OSM
docker-compose --profile demoB run --rm demo-b-importer stockholm_core

# 4. Export
curl -X POST "http://localhost:5000/render" \
  -H "Content-Type: application/json" \
  -d '{"bbox_preset":"stockholm_core","theme":"paper","render_mode":"print","dpi":150,"width_mm":420,"height_mm":594,"format":"png"}' \
  --output export_demo_b.png
```

## 2. Smoke Tests & Diagnostics

### Automated Smoke Tests

**Location:** `scripts/smoke_test.sh`

**Run:**
```bash
chmod +x scripts/smoke_test.sh
./scripts/smoke_test.sh
```

**What it checks:**
- Prep-service data files exist (OSM, DEM, hillshade, contours)
- Tile files exist (MBTiles, XYZ tiles)
- Demo A services respond (tileserver, hillshade server, web app, exporter)
- Demo B services respond (database, API, web app)
- PostGIS contains OSM data
- Label policy enforced (noLabels in themes)

### Export Dimension Verification

**Location:** `scripts/verify_export_dimensions.sh`

**Run:**
```bash
chmod +x scripts/verify_export_dimensions.sh
./scripts/verify_export_dimensions.sh export.png 420 594 150
```

**What it checks:**
- PNG dimensions match expected (mm * DPI / 25.4)

### Common Failures Diagnostic

**Location:** `scripts/diagnose_common_failures.sh`

**Run:**
```bash
chmod +x scripts/diagnose_common_failures.sh
./scripts/diagnose_common_failures.sh
```

**Common failures detected:**
1. **Fonts missing:** DejaVu fonts not installed in renderer
   - Fix: Ensure `fonts-dejavu` package in renderer Dockerfile

2. **Blank tiles:** Tile server not responding or tiles missing
   - Fix: Check MBTiles files exist, verify Martin/nginx config

3. **Wrong bbox CRS:** Data in wrong coordinate system
   - Fix: Verify DEM/hillshade are EPSG:3857 (Web Mercator)

4. **Clipped OSM too small:** OSM clip missing data
   - Fix: Verify bbox preset coordinates, re-clip OSM

5. **Mapnik datasource errors:** PostGIS connection or table issues
   - Fix: Check PostGIS connection, verify osm2pgsql import completed

6. **Memory/disk space:** Insufficient resources
   - Fix: Check disk space, increase Docker memory limit

See `RUNBOOK.md` troubleshooting section for more details.

## 3. Determinism Validation

### Definition

- **Demo A (Playwright):** Visual stability - minor pixel differences acceptable
- **Demo B (Mapnik):** Byte-identical - same inputs → identical PNG/PDF bytes

### PNG Metadata

PNG files may contain timestamps and other metadata. For byte-identical comparison:
- Strip metadata using `scripts/normalize_png.sh`
- Or compare after normalization

### Test Determinism

**Location:** `scripts/test_determinism.sh`

**Run:**
```bash
# Test Demo B (should be byte-identical)
chmod +x scripts/test_determinism.sh
./scripts/test_determinism.sh demo-b stockholm_core paper 150 420 594

# Test Demo A (visual stability acceptable)
./scripts/test_determinism.sh demo-a stockholm_core paper 150 420 594
```

**Expected:**
- Demo B: All 3 exports have identical SHA256 hashes
- Demo A: Exports may differ slightly (check visually)

### Playwright Determinism (Demo A)

**Implemented in:** `demo-a/exporter/src/server.js`

**Fixes applied:**
- Fixed viewport (calculated from mm/DPI)
- Fixed deviceScaleFactor: 1.0
- Fixed timezone: UTC
- Fixed locale: en-US
- Mocked Date.now() to fixed timestamp
- Wait for map.loaded()
- Wait for document.fonts.ready
- Disable animations via CSS
- networkidle wait

### Mapnik Determinism (Demo B)

**Implemented in:** `demo-b/renderer/src/mapnik_renderer.py` and `theme_to_mapnik.py`

**Fixes applied:**
- Fixed font paths: `/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf`
- Stable SQL ordering: `ORDER BY ST_Hash(geometry)`
- Fixed simplification tolerance (calculated from scale)
- Consistent layer processing order
- No random operations

See `DETERMINISM.md` for detailed documentation.

## 4. Print Quality Checklist

### Pixel Dimensions

| Format | DPI | Width (px) | Height (px) |
|--------|-----|------------|-------------|
| A2     | 150 | 2,480      | 3,508       |
| A2     | 300 | 4,961      | 7,016       |
| A1     | 150 | 3,508      | 4,961       |
| A1     | 300 | 7,016      | 9,921       |

Formula: `pixels = mm * dpi / 25.4`

### Stroke Widths at 300 DPI

- Major roads: 1.0-1.5px (0.085-0.127mm)
- Minor roads: 0.5-0.8px (0.042-0.068mm)
- Water outlines: 0.4-0.6px (0.034-0.051mm)
- Building outlines: 0.3-0.5px (0.025-0.042mm)
- Contours (major): 0.5-0.7px (0.042-0.059mm)
- Contours (minor): 0.3-0.4px (0.025-0.034mm)

**Print mode scaling:** Multiply base stroke width by 0.7-0.8

### Print Mode Defaults

- Labels: OFF by default
- POIs: Hidden
- Buildings: Generalized for wide bbox
- Contours: Minor intervals hidden for wide bbox

### Gallery-Friendly Themes

Additional themes created:
- `warm-paper.json` - Warm beige background
- `charcoal.json` - Dark elegant theme
- `blueprint-muted.json` - Technical but subdued

See `PRINT_QUALITY_CHECKLIST.md` for complete guidelines.

## 5. Stockholm-Specific Improvements

### Contour Interval Strategy

**Recommended:** 2m, 10m, 50m intervals

**Visibility rules:**
- `stockholm_core`: Show all intervals (2m, 10m, 50m)
- `stockholm_wide`: Hide 2m interval to avoid clutter
- Large outputs (A1): Consider hiding 2m interval
- Small outputs (A4): Show only 10m and 50m

**Implementation needed:** Add visibility logic to theme-to-style conversion (see `STOCKHOLM_OPTIMIZATION.md`)

### Water/Archipelago Styling

- Subtle water fill (slightly darker/lighter than background)
- Thin shorelines (0.4-0.6px at 300 DPI)
- Ensure islands visible (buildings help define)
- Lighter water for better contrast

### Building Generalization

- `stockholm_wide`: Simplify geometries, aggregate small buildings
- `stockholm_core`: Show individual buildings with detail

See `STOCKHOLM_OPTIMIZATION.md` for detailed recommendations.

## 6. EU-DEM Download: Practical Path

### Manual Download Workflow

**Location:** `DEM_MANUAL_DOWNLOAD.md`

**Steps:**
1. Download EU-DEM tile from Copernicus (registration may be required)
2. Reproject to EPSG:3857 using gdalwarp
3. Place file at: `/data/dem/manual/stockholm_core_eudem.tif`
4. Run: `docker-compose run --rm prep python3 /app/src/download_dem.py --preset stockholm_core --provider local`

### LocalFileProvider Implementation

**Location:** `prep-service/src/dem_provider.py`

**Features:**
- Reads from `/data/dem/manual/{preset}_eudem.tif`
- Clear error messages if file missing
- Checksum support for validation

**Usage:**
```bash
# Default provider is now 'local'
docker-compose run --rm prep python3 /app/src/download_dem.py --preset stockholm_core
```

## Repository Changes Summary

See `REPO_CHANGES_CHECKLIST.md` for complete list of changes.

### Key Changes

1. **DEM Provider:** Added `LocalFileProvider` for manual file workflow
2. **Prep Scripts:** Updated to check `/data/dem/manual/` directory
3. **Playwright Determinism:** Added timezone, locale, Date.now() mock
4. **New Scripts:** Smoke tests, determinism tests, diagnostics
5. **New Documentation:** Runbook, manual DEM instructions, print quality guide
6. **New Themes:** warm-paper, charcoal, blueprint-muted

### Files Requiring Manual Review

- `demo-a/web/src/themeToStyle.js` - Verify OSM layer schema
- `demo-b/renderer/src/theme_to_mapnik.py` - Verify PostGIS schema
- `demo-a/tileserver/martin.yaml` - May need environment-based config

## Next Steps

1. Run smoke tests: `./scripts/smoke_test.sh`
2. Test manual DEM workflow (download, reproject, place file)
3. Generate test exports for both demos
4. Verify determinism: `./scripts/test_determinism.sh`
5. Visual inspection of exports
6. Adjust theme-to-style mappings based on actual tile schemas
7. Refine Mapnik XML queries based on actual PostGIS schema

## Release Criteria

Before considering the system "release-ready":

- [ ] All smoke tests pass
- [ ] Manual DEM workflow tested end-to-end
- [ ] Demo A export produces valid PNG with correct dimensions
- [ ] Demo B export produces valid PNG with correct dimensions
- [ ] Determinism validated (Demo B byte-identical, Demo A visually stable)
- [ ] No contour labels appear in exports
- [ ] Visual quality acceptable for print (A2/A1 at 300 DPI)
- [ ] Both bbox presets work (stockholm_core, stockholm_wide)
- [ ] All themes render correctly
- [ ] Common failure diagnostic script runs successfully




