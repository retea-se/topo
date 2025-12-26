# TODO: Svealand Full Coverage

> **Archived** – Completed 2025-12-26. All coverage requirements met (OSM + DEM + hillshade + contours). See STATUS.md for current status.
>
> **Note:** STATUS.md (line 42) still references this file. Update reference to point to archived location when updating STATUS.md.

**Created**: 2025-12-27
**Goal**: Take svealand from partial coverage to full coverage with green QA
**Status**: ✅ **COMPLETED** - All checklist items done (2025-12-26)

---

## Definition of Done

- [x] Demo B: qa_full_test.js 7/7 PASS ✅ **COMPLETED 2025-12-26**
- [x] Svealand: FULL COVERAGE (OSM + DEM + hillshade + contours) ✅ **COMPLETED 2025-12-26**
- [x] Artifacts: QA screenshots, tile_health.json, QA report in timestamped folder ✅ **COMPLETED 2025-12-26**
- [x] Documentation: STATUS.md, USAGE.md, QA_REPORT_SVEALAND.md updated ✅ **COMPLETED 2025-12-26**

---

## Step A: Runtime Sanity (Demo B 7/7)

- [x] Restart demoB containers (`docker compose restart demo-b-web demo-b-api demo-b-renderer`) ✅
- [x] Verify `/preset-limits` endpoint returns valid JSON ✅
- [x] Verify `/validate` endpoint accepts POST requests ✅
- [x] Run `node scripts/qa_full_test.js --preset stockholm_wide --demo B` ✅
- [x] Confirm 7/7 PASS (no timeouts on #preset-info or #validation-box) ✅

## Step B: Svealand Terrain Build

### B1: DEM Data
- [x] Download Copernicus GLO-30 tiles covering svealand bbox (14.5, 58.5, 19.0, 61.0) ✅ 15 tiles, 313 MB
- [x] Merge tiles into single GeoTIFF ✅ 944 MB, 16698x18424px
- [x] Verify coverage: `gdalinfo prep-service/data/dem/svealand_dem.tif` ✅
- [x] Expected size: ~50-100 MB → Actual: 944 MB (uncompressed)

### B2: Hillshade
- [x] Generate hillshade raster ✅ 177 MB
- [x] Generate XYZ tiles (z10-14) ✅ 62,632 tiles
- [x] Verify tiles exist ✅

### B3: Contours
- [x] Generate 10m contours ✅ 2.4 GB GeoJSON
- [x] Generate 50m contours ✅ 420 MB GeoJSON
- [x] Skipped 2m contours (12 GB - too large for region)
- [x] Convert to mbtiles ✅ 10m: 100 MB, 50m: 23 MB
- [x] Update martin.yaml with svealand contour sources ✅

## Step C: Verification

- [x] Start Demo A with svealand preset ✅
- [x] Verify no 404s in browser console ✅ (all layers loading)
- [x] Verify hillshade layer visible ✅
- [x] Verify contour lines visible ✅
- [x] Start Demo B with svealand preset ✅
- [x] Verify preset dropdown shows svealand ✅
- [x] Verify validation works for svealand limits ✅

## Step D: QA & Documentation

- [x] Run `node scripts/qa_full_test.js --preset svealand --demo both` ✅ Demo A: 9/10, Demo B: 7/7
- [x] Run tile health check: `node scripts/tile_health_check_svealand.js` ✅ 100% success (60/60)
- [x] Capture screenshots to `exports/screenshots/qa_20251226202054_svealand/` ✅
- [x] Update docs/STATUS.md with svealand full coverage ✅
- [x] Update docs/USAGE.md with svealand instructions ✅
- [x] Create/update docs/QA_REPORT_SVEALAND.md ✅

---

## Current Status

**Last Updated:** 2025-12-26 21:22 CET

| Data Type | Status | Notes |
|-----------|--------|-------|
| OSM PBF | ✅ | ~150 MB |
| OSM tiles | ✅ | 653 MB, 100% tile success rate |
| DEM | ✅ | 944 MB, Copernicus GLO-30 |
| Hillshade raster | ✅ | 177 MB |
| Hillshade tiles | ✅ | 62,632 tiles (z10-14) |
| Contours GeoJSON | ✅ | 10m: 2.4 GB, 50m: 420 MB |
| Contours tiles | ✅ | 10m: 100 MB, 50m: 23 MB |

**Status Summary:** ✅ **FULL COVERAGE COMPLETE**. All layers (OSM + DEM + hillshade + contours) are available and verified.

---

## Resources

- Copernicus DEM: https://dataspace.copernicus.eu/
- Svealand bbox: 14.5, 58.5, 19.0, 61.0 (WGS84)
- Scripts: `scripts/build_svealand.ps1`, `scripts/prepare_dem_svealand.ps1`
