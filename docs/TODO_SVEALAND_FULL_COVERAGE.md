# TODO: Svealand Full Coverage

**Created**: 2025-12-27
**Goal**: Take svealand from partial coverage to full coverage with green QA

---

## Definition of Done

- [ ] Demo B: qa_full_test.js 7/7 PASS
- [ ] Svealand: FULL COVERAGE (OSM + DEM + hillshade + contours)
- [ ] Artifacts: QA screenshots, tile_health.json, QA report in timestamped folder
- [ ] Documentation: STATUS.md, USAGE.md, QA_REPORT_SVEALAND.md updated

---

## Step A: Runtime Sanity (Demo B 7/7)

- [ ] Restart demoB containers (`docker compose restart demo-b-web demo-b-api demo-b-renderer`)
- [ ] Verify `/preset-limits` endpoint returns valid JSON
- [ ] Verify `/validate` endpoint accepts POST requests
- [ ] Run `node scripts/qa_full_test.js --preset stockholm_wide --demo B`
- [ ] Confirm 7/7 PASS (no timeouts on #preset-info or #validation-box)

## Step B: Svealand Terrain Build

### B1: DEM Data
- [ ] Download Copernicus GLO-30 tiles covering svealand bbox (14.5, 58.5, 19.0, 61.0)
- [ ] Merge tiles into single GeoTIFF
- [ ] Verify coverage: `gdalinfo prep-service/data/dem/svealand_dem.tif`
- [ ] Expected size: ~50-100 MB

### B2: Hillshade
- [ ] Generate hillshade raster: `scripts/generate_hillshade.sh svealand`
- [ ] Generate XYZ tiles (z10-14): `scripts/generate_hillshade_tiles.sh svealand`
- [ ] Verify tiles exist: `ls prep-service/output/hillshade_tiles_svealand/`

### B3: Contours
- [ ] Generate 2m contours: `gdal_contour -a elev -i 2 ...`
- [ ] Generate 10m contours: `gdal_contour -a elev -i 10 ...`
- [ ] Generate 50m contours: `gdal_contour -a elev -i 50 ...`
- [ ] Convert to mbtiles: `tippecanoe ...`
- [ ] Update martin.yaml with svealand contour sources

## Step C: Verification

- [ ] Start Demo A with svealand preset
- [ ] Verify no 404s in browser console
- [ ] Verify hillshade layer visible
- [ ] Verify contour lines visible
- [ ] Start Demo B with svealand preset
- [ ] Verify preset dropdown shows svealand
- [ ] Verify validation works for svealand limits

## Step D: QA & Documentation

- [ ] Run `node scripts/qa_full_test.js --preset svealand --demo both`
- [ ] Run tile health check: `node scripts/tile_health_check_svealand.js`
- [ ] Capture screenshots to `exports/screenshots/qa_YYYYMMDD_svealand/`
- [ ] Update docs/STATUS.md with svealand full coverage
- [ ] Update docs/USAGE.md with svealand instructions
- [ ] Create/update docs/QA_REPORT_SVEALAND.md

---

## Current Status

| Data Type | Status | Notes |
|-----------|--------|-------|
| OSM PBF | ✅ | ~150 MB estimated |
| OSM tiles | ✅ | 653 MB verified |
| DEM | ❌ MISSING | Need Copernicus GLO-30 |
| Hillshade raster | ❌ MISSING | Depends on DEM |
| Hillshade tiles | ❌ MISSING | Depends on hillshade raster |
| Contours GeoJSON | ❌ MISSING | Depends on DEM |
| Contours tiles | ❌ MISSING | Depends on contours GeoJSON |

---

## Resources

- Copernicus DEM: https://dataspace.copernicus.eu/
- Svealand bbox: 14.5, 58.5, 19.0, 61.0 (WGS84)
- Scripts: `scripts/build_svealand.ps1`, `scripts/prepare_dem_svealand.ps1`
