# Topo Map Export System v2 - Corrected Implementation Plan

This document incorporates the spec patches from `SPEC_PATCH.md`.

## Key Corrections Applied

1. **Contours generated from DEM** (not hillshade)
2. **Planetiler for OSM tiles** (not Tippecanoe)
3. **XYZ PNG tiles for hillshade** (served via nginx)
4. **Determinism clarifications** (Demo A: visual stability, Demo B: byte-identical)
5. **Explicit label policy** (contours: no labels ever, print: labels off by default)

## Updated Pipeline

### Prep Service Pipeline (Corrected)

```
1. Download OSM (Geofabrik Sweden)
   └─→ /data/osm/sweden-latest.osm.pbf

2. Clip OSM to bbox preset
   └─→ /data/osm/{preset}.osm.pbf

3. Download DEM (EU-DEM)
   └─→ /data/dem/{preset}_eudem.tif (EPSG:3857)

4. Generate hillshade (from DEM)
   └─→ /data/terrain/hillshade/{preset}_hillshade.tif

5. Generate contours (from DEM, NOT hillshade)
   └─→ /data/terrain/contours/{preset}_{2,10,50}m.geojson

6. Generate hillshade XYZ tiles
   └─→ /data/tiles/hillshade/{preset}/{z}/{x}/{y}.png

7. Generate OSM vector tiles (Planetiler)
   └─→ /data/tiles/osm/{preset}.mbtiles

8. Generate contour vector tiles (Tippecanoe)
   └─→ /data/tiles/contours/{preset}_{2,10,50}m.mbtiles
```

## Demo A Architecture (Updated)

```
OSM PBF → Planetiler → MBTiles → Martin tileserver
DEM → hillshade GeoTIFF → gdal2tiles.py → XYZ PNG → nginx
DEM → contours GeoJSON → Tippecanoe → MBTiles → Martin tileserver

Martin (port 8080): Vector tiles
Nginx (port 8081): Hillshade raster tiles
Web (port 3000): MapLibre GL JS
Exporter (port 8082): Playwright headless
```

## Demo B Architecture

```
OSM PBF → osm2pgsql → PostGIS
DEM → hillshade GeoTIFF → Mapnik (raster layer)
DEM → contours GeoJSON → PostGIS or direct file → Mapnik

PostGIS: OSM data + contours (optional)
Mapnik: Theme → XML → PNG/PDF
API (port 5000): Flask → Renderer service
Web (port 3001): Simple HTML form
```

## Critical Implementation Notes

### Contours (FIXED)

**Correct command:**
```bash
gdal_contour -i 2 -a elevation -f GeoJSON "${DEM_FILE}" "${OUTPUT}"
```

**NOT:**
```bash
gdal_contour "${HILLSHADE}" ...  # WRONG - don't use hillshade
```

### OSM Tile Generation (FIXED)

**Correct: Use Planetiler**
```bash
java -Xmx4g -jar planetiler.jar \
  --osm-path="${OSM_PBF}" \
  --output="${OUTPUT}" \
  --minzoom=10 --maxzoom=16
```

**NOT:**
```bash
tippecanoe "${OSM_PBF}" ...  # WRONG - Tippecanoe doesn't accept PBF
```

### Hillshade Tiles (CLARIFIED)

**Generate XYZ tiles:**
```bash
gdal2tiles.py --zoom=10-16 --profile=mercator "${HILLSHADE}" "${OUTPUT_DIR}"
```

**Serve via nginx:** Simple static file serving at `/tiles/hillshade/{preset}/{z}/{x}/{y}.png`

### Determinism Requirements

**Demo A (Playwright):**
- Goal: **Visual stability** (not byte-identical)
- Acceptable: Minor pixel differences due to GPU/font rendering
- Requirements: Fixed viewport, deviceScaleFactor=1.0, wait for map idle + fonts, disable animations

**Demo B (Mapnik):**
- Goal: **Byte-identical** output
- Requirements: Fixed fonts, stable SQL ordering, fixed simplification, deterministic rendering
- Validation: SHA256 hash comparison

### Label Policy

1. **Contours:** NEVER render elevation labels (hard constraint, global)
2. **Print mode:** Labels OFF by default; opt-in required
3. **Screen mode:** Labels allowed (for preview)
4. **Theme control:** Theme controls label styling (if enabled), not visibility

## Updated TODO Priorities

### Phase 1: Prep Service (Critical Fixes)

1. ✅ Fix `extract_contours.py` to use DEM file (not hillshade)
2. ✅ Update `generate_osm_tiles.sh` to use Planetiler (not Tippecanoe)
3. ✅ Add `generate_hillshade_tiles.sh` for XYZ tile generation
4. ✅ Fix dependencies: `prep-service-contours` depends on DEM (not hillshade)

### Phase 2: Demo A (Tile Serving)

1. ✅ Setup nginx for hillshade tiles (port 8081)
2. ✅ Update Martin config for vector tiles only
3. ✅ Update web app to use both Martin and nginx URLs

### Phase 3: Implementation Gaps

**Still TODO (not in scaffolding):**

- Complete EU-DEM download implementation in `dem_provider.py`
- Implement theme-to-MapLibre style conversion in `demo-a/web/src/themeToStyle.ts`
- Complete Mapnik rendering in `demo-b/renderer/src/mapnik_renderer.py`
- Implement theme-to-Mapnik XML conversion
- Add label policy enforcement in both demos

## File Structure

```
topo/
├── docker-compose.yml
├── README.md
├── SPEC_PATCH.md
├── IMPLEMENTATION_PLAN_V2_CORRECTED.md
├── MILESTONES.md
├── prep-service/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── config/
│   │   └── bbox_presets.json
│   ├── src/
│   │   ├── download_osm.py
│   │   ├── clip_osm.py
│   │   ├── dem_provider.py (TODO: implement EU-DEM download)
│   │   ├── download_dem.py
│   │   ├── generate_hillshade.py
│   │   └── extract_contours.py (FIXED: uses DEM)
│   └── scripts/
│       ├── generate_hillshade_tiles.sh (NEW)
│       ├── generate_osm_tiles.sh (FIXED: uses Planetiler)
│       └── generate_contour_tiles.sh
├── demo-a/
│   ├── tileserver/
│   │   ├── martin.yaml
│   │   └── nginx-hillshade.conf (NEW)
│   ├── web/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── src/
│   │   │   └── server.js
│   │   └── public/
│   │       ├── index.html
│   │       └── map.js (TODO: theme-to-style conversion)
│   └── exporter/
│       ├── Dockerfile
│       ├── package.json
│       └── src/
│           └── server.js
├── demo-b/
│   ├── db/
│   │   └── init.sql
│   ├── importers/
│   │   └── osm-importer/
│   │       ├── Dockerfile
│   │       └── import.sh
│   ├── renderer/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── src/
│   │       ├── renderer_interface.py
│   │       ├── mapnik_renderer.py (TODO: complete implementation)
│   │       └── server.py
│   ├── api/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── app.py
│   └── web/
│       ├── Dockerfile
│       ├── package.json
│       └── src/
│           └── server.js
└── themes/
    └── paper.json
```

## Next Steps

1. Implement EU-DEM download in `dem_provider.py`
2. Complete MapLibre style generation from theme JSON
3. Complete Mapnik rendering with theme-to-XML conversion
4. Add label policy enforcement
5. Test end-to-end pipelines for both demos
6. Validate determinism requirements





