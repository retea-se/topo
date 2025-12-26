# Spec Patch - Topo Map Export System v2

## Critical Technical Fixes

### A) Contours Generation Pipeline

**ISSUE:** Contours were incorrectly specified to be generated from hillshade raster.

**FIX:** Contours MUST be generated from DEM (elevation raster), not hillshade.

**Corrected Pipeline:**
```
DEM (EPSG:3857)
  ├─→ hillshade (gdaldem hillshade -az 315 -alt 45)
  └─→ contours (gdal_contour -i 2/10/50) [FROM DEM, NOT HILLSHADE]
```

**Updated Command Recipe (Step 5):**
```bash
# prep-service/scripts/generate_contours.sh
PRESET="stockholm_core"
DEM_FILE="/data/dem/${PRESET}_eudem.tif"  # Use DEM, not hillshade

for INTERVAL in 2 10 50; do
  gdal_contour \
    -i ${INTERVAL} \
    -a elevation \
    -f GeoJSON \
    "${DEM_FILE}" \
    "/data/terrain/contours/${PRESET}_${INTERVAL}m.geojson"
done
```

**Caching Key Update:**
- OLD: `SHA256(hillshade_path + interval + gdal_contour_version)`
- NEW: `SHA256(dem_path + interval + gdal_contour_version)`

**Dependency Fix:**
- `prep-service-contours` should depend on `prep-service-dem-eudem`, NOT `prep-service-hillshade`

---

### B) Tippecanoe Input Format

**ISSUE:** Tippecanoe does NOT accept .osm.pbf files directly. The spec incorrectly showed Tippecanoe processing OSM PBF.

**FIX:** Use Planetiler for OSM .osm.pbf → MBTiles conversion.

**DECISION:** Option 1 - Use Planetiler for OSM, keep Tippecanoe for contours only.

**Updated Tile Generation Strategy:**
- **OSM tiles:** Planetiler (Java-based, accepts .osm.pbf directly)
- **Contour tiles:** Tippecanoe (from GeoJSON)

**Updated Command Recipe (Step 6):**
```bash
# prep-service/scripts/generate_osm_tiles.sh
PRESET="stockholm_core"
OSM_PBF="/data/osm/${PRESET}.osm.pbf"
OUTPUT="/data/tiles/osm/${PRESET}.mbtiles"

java -Xmx4g -jar /app/planetiler.jar \
  --osm-path="${OSM_PBF}" \
  --output="${OUTPUT}" \
  --minzoom=10 \
  --maxzoom=16 \
  --bounds=17.90,59.32,18.08,59.35 \
  --nodemap-type=array \
  --threads=4
```

**Updated TODO:**
- `demo-a-tile-gen-osm`: Change from "Tippecanoe tile generation" to "Planetiler tile generation for OSM"

**Tile Generator Choice Section:**
- Default: **Planetiler for OSM**, Tippecanoe for contours
- Tippecanoe can be used as alternative via env var (requires conversion step: PBF → GeoJSON layers first)

---

### C) Hillshade Raster Tiles Serving

**ISSUE:** Spec was ambiguous about how hillshade raster tiles are served in Demo A.

**DECISION:** Pre-generate XYZ PNG tiles into a folder structure, serve via lightweight nginx static server.

**Implementation:**

1. **Generate XYZ tiles from hillshade GeoTIFF:**
```bash
# prep-service/scripts/generate_hillshade_tiles.sh
PRESET="stockholm_core"
HILLSHADE="/data/terrain/hillshade/${PRESET}_hillshade.tif"
OUTPUT_DIR="/data/tiles/hillshade/${PRESET}"

gdal2tiles.py \
  --zoom=10-16 \
  --profile=mercator \
  --webviewer=none \
  --resampling=near \
  "${HILLSHADE}" \
  "${OUTPUT_DIR}"
```

2. **Serve via nginx (or lightweight HTTP server):**
- Mount `/data/tiles/hillshade` to nginx container
- Serve at `/tiles/hillshade/{preset}/{z}/{x}/{y}.png`
- nginx config: simple static file serving

**Alternative (rejected):** MBTiles for hillshade via Martin - more complex, adds dependency on raster MBTiles support in Martin.

**Updated TODO:**
- Add `prep-service-hillshade-tiles`: Generate XYZ PNG tiles from hillshade GeoTIFF
- Update `demo-a-tileserver` to include nginx service for hillshade tiles

---

### D) Determinism Clarifications

**ISSUE:** Spec didn't clearly distinguish Demo A vs Demo B determinism requirements.

**CLARIFICATION:**

**Demo A (Playwright export):**
- **Goal:** Visually stable output (not byte-identical)
- **Reason:** GPU rendering, font rendering, browser differences make byte-identical screenshots impractical
- **Practical determinism:**
  - Fixed viewport (calculate from mm/DPI)
  - Fixed deviceScaleFactor: 1.0
  - Disable animations (CSS)
  - Wait for map.loaded() + document.fonts.ready
  - Wait for networkidle
  - Fixed timestamp mock (optional, may not help)
- **Acceptable variance:** Minor pixel differences acceptable as long as visual appearance is stable

**Demo B (Mapnik renderer):**
- **Goal:** Byte-identical output for same inputs
- **Requirements:**
  - Fixed font paths
  - Stable SQL ordering (ORDER BY ST_Hash(geometry))
  - Fixed simplification tolerance
  - Fixed map scale calculation
  - No random state
  - Deterministic tile/cache behavior
- **Validation:** Same input should produce SHA256-identical PNG bytes

**Updated Caching Keys:**
- Demo A exports: Do NOT include in deterministic caching (visual stability is goal)
- Demo B exports: Can cache by input params hash if byte-identical is verified

---

### E) Label Policy - Explicit Rules

**ISSUE:** Label rules were implied but not explicit.

**EXPLICIT RULES:**

1. **Contours:**
   - **NEVER** render elevation labels (hard constraint, global)
   - Contours are purely visual rhythm
   - No numeric text on contour lines, ever

2. **Print Mode (both demos):**
   - Labels OFF by default
   - Labels can be enabled via explicit opt-in toggle/parameter
   - When labels are enabled: keep density low and deterministic
   - Label rendering should be stable (same features labeled in same way)

3. **Screen Mode:**
   - Labels allowed (for preview/interaction)
   - Label density can be higher for readability

4. **Theme Control:**
   - Theme JSON does NOT control label visibility directly
   - Render mode controls label visibility
   - Theme controls label styling (color, font size) IF labels are enabled

**Implementation:**
- MapLibre style: Add `"layout": { "text-field": null }` to contour layers (always)
- Mapnik XML: Do not include `<TextSymbolizer>` in contour styles
- Export params: Add `labels_enabled: boolean` (default: false for print, true for screen)

---

## Updated Command Recipes Summary

### Prep Service (Corrected)

```bash
# 1. Download OSM
docker-compose run --rm prep python3 /app/src/download_osm.py

# 2. Clip OSM
docker-compose run --rm prep python3 /app/src/clip_osm.py --preset stockholm_core

# 3. Download DEM
docker-compose run --rm prep python3 /app/src/download_dem.py --preset stockholm_core --provider eudem

# 4. Generate hillshade (from DEM)
docker-compose run --rm prep python3 /app/src/generate_hillshade.py --preset stockholm_core

# 5. Generate contours (from DEM, NOT hillshade)
docker-compose run --rm prep python3 /app/src/extract_contours.py --preset stockholm_core

# 6. Generate hillshade XYZ tiles
docker-compose run --rm prep /app/scripts/generate_hillshade_tiles.sh stockholm_core

# 7. Generate OSM vector tiles (Planetiler, not Tippecanoe)
docker-compose run --rm prep /app/scripts/generate_osm_tiles.sh stockholm_core

# 8. Generate contour vector tiles (Tippecanoe from GeoJSON)
docker-compose run --rm prep /app/scripts/generate_contour_tiles.sh stockholm_core
```

---

## Files Updated

1. **Prep-service command recipes** - Fix contour generation to use DEM
2. **Tile generation strategy** - Planetiler for OSM, Tippecanoe for contours
3. **Hillshade tile serving** - XYZ PNG tiles via nginx
4. **Determinism requirements** - Clarify Demo A vs Demo B goals
5. **Label policy** - Explicit rules document
6. **Dependencies** - Fix prep-service-contours dependency
7. **Caching keys** - Update contour cache key to use DEM path

---

## TODO Updates

- Change `demo-a-tile-gen-osm` to use Planetiler instead of Tippecanoe
- Add `prep-service-hillshade-tiles` for XYZ tile generation
- Update `demo-a-tileserver` to include nginx for hillshade tiles
- Fix `prep-service-contours` dependency (remove hillshade dependency, keep DEM)
- Add `demo-a-exporter-labels` todo: implement label toggle in print mode
- Add `demo-b-renderer-labels` todo: implement label policy in Mapnik



