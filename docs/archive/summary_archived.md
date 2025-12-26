# Implementation Summary

## Deliverables Completed

### 1. Spec Patch (`SPEC_PATCH.md`)

- Fixed contours generation (from DEM, not hillshade)
- Fixed OSM tile generation (Planetiler, not Tippecanoe)
- Clarified hillshade raster tile serving (XYZ PNG via nginx)
- Clarified determinism requirements (Demo A vs Demo B)
- Added explicit label policy rules

### 2. Repository Scaffolding

**Core Infrastructure:**

- `docker-compose.yml` - Complete service definitions with profiles
- `README.md` - Quick start guide
- `.gitignore` - Standard ignores

**Prep Service:**

- `prep-service/Dockerfile` - GDAL + osmium + Planetiler + Tippecanoe
- `prep-service/src/*.py` - Python scripts for data preparation
- `prep-service/scripts/*.sh` - Shell scripts for tile generation
- `prep-service/config/bbox_presets.json` - Stockholm presets

**Demo A (WebGL/Vector Tiles):**

- `demo-a/tileserver/` - Martin config + nginx config for hillshade
- `demo-a/web/` - Minimal MapLibre web app (stub)
- `demo-a/exporter/` - Playwright export service

**Demo B (Server-side Print):**

- `demo-b/db/` - PostGIS init script
- `demo-b/importers/osm-importer/` - osm2pgsql import script
- `demo-b/renderer/` - Mapnik renderer (stub with interface)
- `demo-b/api/` - Flask API (stub)
- `demo-b/web/` - Simple HTML form UI

**Themes:**

- `themes/paper.json` - Example theme definition

### 3. Documentation

- `MILESTONES.md` - First runnable milestone commands
- `IMPLEMENTATION_PLAN_V2_CORRECTED.md` - Updated plan with fixes
- `SUMMARY.md` - This file

## Implementation Status (Updated 2025-12-25)

### ✅ Fully Working

- **Prep Service:** DEM download, hillshade, contours (2m/10m/50m MBTiles)
- **Martin Tileserver:** Serving contour tiles at :8080/catalog
- **Nginx Hillshade Server:** Serving XYZ PNG tiles at :8081
- **Demo A Web:** MapLibre frontend at :3000
- **Demo A Exporter:** Playwright export service at :8082
- **Demo B Database:** PostGIS with OSM data imported (32K points, 18K polygons, 21K lines)
- **Demo B Renderer:** Mapnik Flask server at :5001
- **Demo B API:** Flask proxy to renderer at :5000
- **Demo B Web:** HTML form UI with render proxy at :3001

### ✅ Recent Fixes (2025-12-25)

- Fixed Martin tileserver config format (v0.14.0 YAML structure)
- Fixed OSM import (DEBIAN_FRONTEND, dos2unix, hstore extension)
- Fixed Playwright version mismatch (v1.49.1)
- Fixed Mapnik module import (PYTHONPATH for python3-mapnik)
- Fixed Demo A static file serving (explicit root route)
- Fixed Demo B API proxy (browser can't reach internal Docker hostnames)
- Fixed Demo B RENDERER_SERVICE URL (added http:// prefix)

### 🔨 Remaining Work

**Demo A:**

- ✅ Theme-to-MapLibre style conversion integrated
- ✅ Layer toggles implemented
- OSM vector tiles not yet generated (Planetiler step pending)
- Export timeout issues (needs longer timeouts)
- Full end-to-end export testing pending

**Demo B:**

- ✅ Mapnik XML background-style fixed (removed placeholder)
- Export timeout issues (rendering takes long time)
- Full rendering validation with all layers pending

### 🎯 Next Steps

1. **Test exports end-to-end:** Verify PNG/PDF output from both demos
2. **Generate OSM vector tiles:** Run Planetiler for Demo A
3. **Polish:** Error handling, UI improvements, documentation

## Key Technical Decisions

1. **CRS:** EPSG:3857 everywhere (v2 baseline)
2. **Contours:** Generated from DEM (not hillshade) ✅ FIXED
3. **OSM Tiles:** Planetiler (not Tippecanoe) ✅ FIXED
4. **Hillshade Tiles:** XYZ PNG via nginx ✅ CLARIFIED
5. **Determinism:** Demo A (visual stability), Demo B (byte-identical) ✅ CLARIFIED
6. **Labels:** Contours never labeled, print mode labels off by default ✅ ADDED

## Architecture Summary

```
Prep Service → /data (OSM, DEM, terrain, tiles)
    ↓
Demo A: Martin (vector) + nginx (hillshade) → MapLibre → Playwright
Demo B: PostGIS → Mapnik → Flask API
```

Both demos share:

- Prep service outputs
- Theme JSON definitions
- Bbox presets

## Notes

- All scaffolding files are minimal/stubs - full implementation needed
- Docker images use pinned versions where specified
- Volume mounts configured for `/data` and `/exports`
- Services communicate via Docker network names
- Ports exposed: 3000 (demo-a-web), 3001 (demo-b-web), 5000 (demo-b-api), 8080 (martin), 8081 (nginx), 8082 (demo-a-exporter)

---

# Visual Refinement Summary (2025-12-26)

## Overview

Visual design refinements to improve map quality for wall art / print exports. Focus on contrast, line weights, contour density, and hillshade strength.

## Problems Identified

### Initial Visual Issues
| Issue | Original Value | Problem |
|-------|---------------|---------|
| Hillshade opacity | 0.10-0.15 | Nearly invisible terrain shading |
| Contour stroke | #b0b0b0 on #faf8f5 | Only 5-8% contrast ratio |
| Contour widths | 0.4px minor / 0.8px major | Too thin at print scale |
| Visual hierarchy | Everything similarly muted | No focal points or depth |

### Infrastructure Issues Found During Testing
- Exporter captured UI controls in screenshots
- Tile server URLs hardcoded to `localhost`, failing in Docker-internal context
- Theme URL parameters ignored by web app

---

## Changes Made

### 1. New Theme: Gallery (`themes/gallery.json`)

Print-optimized theme for wall art:
- Hillshade opacity: 0.28
- Contour stroke: #8a8580 with 1.2px major / 0.6px minor
- Contour opacity: 0.7 major / 0.4 minor (visual hierarchy)
- Roads: 2.0px major / 1.0px minor
- Stronger water/parks fills

### 2. Updated Themes

**Paper (`themes/paper.json`):**
| Property | Before | After | Change |
|----------|--------|-------|--------|
| Hillshade opacity | 0.15 | 0.22 | +47% |
| Contour stroke | #b0b0b0 | #908a85 | Warmer |
| Contour widths | 0.4/0.8 | 0.5/1.0 | +25% |
| Roads stroke | #8a8a8a | #707070 | Darker |

**Ink (`themes/ink.json`):**
- Hillshade: 0.12 → 0.18
- Contours: #999999 → #707070

**Charcoal (`themes/charcoal.json`):**
- Hillshade: 0.18 → 0.25, blend: soft-light
- Roads: #7a7a7a → #909090
- Added contour opacity support

### 3. Demo A Style Converter (`demo-a/web/src/themeToStyle.js`)

- Contours render minor→major (50m on top for emphasis)
- 3-tier opacity hierarchy (2m/10m/50m)
- Print mode: 1.2× line width boost
- Intermediate 10m width: 1.3× minor

### 4. Demo B Mapnik Converter (`demo-b/renderer/src/theme_to_mapnik.py`)

- Rounded line joins/caps on all features
- Theme-defined stroke widths
- Contour opacity support

### 5. Exporter Fix (`demo-a/exporter/src/server.js`)

```javascript
// Hide UI controls for clean export
await page.addStyleTag({
  content: `.controls { display: none !important; }`
});

// Screenshot only map element
const mapElement = await page.$('#map');
const screenshot = await mapElement.screenshot({ type: 'png' });
```

### 6. Tile URL Fix (`demo-a/web/src/server.js`)

Dynamic URLs based on request origin:
- Docker-internal: `http://demo-a-tileserver:3000`
- Browser: `http://localhost:8080`

### 7. URL Parameter Support (`demo-a/web/public/map.js`)

Reads `theme`, `bbox_preset`, `render_mode` from URL query params.

---

## Test Commands

```bash
# Gallery theme A2 @ 150 DPI
curl "http://localhost:8082/render?bbox_preset=stockholm_core&theme=gallery&render_mode=print&dpi=150&width_mm=420&height_mm=594" -o gallery_a2.png

# Charcoal (dark) theme
curl "http://localhost:8082/render?bbox_preset=stockholm_core&theme=charcoal&render_mode=print&dpi=150&width_mm=420&height_mm=594" -o charcoal_a2.png

# Rebuild after changes
docker-compose --profile demoA build demo-a-web demo-a-exporter
docker-compose --profile demoA up -d --force-recreate demo-a-web demo-a-exporter
```

---

## Theme Comparison

| Theme | Background | Mood | Best For |
|-------|------------|------|----------|
| Paper | #faf8f5 (cream) | Calm | General wall art |
| Gallery | #fdfcfa (off-white) | Strong hierarchy | High-quality prints |
| Ink | #ffffff (white) | Minimal | Modern interiors |
| Charcoal | #2a2a2a (dark gray) | Elegant | Dark-themed spaces |
| Dark | #1a1a1a (black) | Dramatic | Statement pieces |

---

## Files Modified

```
themes/gallery.json              # NEW
themes/paper.json                # Updated values
themes/ink.json                  # Updated values
themes/charcoal.json             # Updated values
demo-a/web/src/themeToStyle.js   # Contour hierarchy
demo-a/web/src/server.js         # Dynamic tile URLs
demo-a/web/public/map.js         # URL param support
demo-a/exporter/src/server.js    # Hide UI, map-only screenshot
demo-b/renderer/src/theme_to_mapnik.py  # Stroke styles
```
