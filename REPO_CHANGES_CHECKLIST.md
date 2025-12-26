# Repository Changes Checklist

## New Files Created

### Documentation
- [x] `RUNBOOK.md` - Step-by-step guide from zero to first export
- [x] `DEM_MANUAL_DOWNLOAD.md` - Manual EU-DEM download instructions
- [x] `PRINT_QUALITY_CHECKLIST.md` - Print quality guidelines and pixel dimensions
- [x] `DETERMINISM.md` - Determinism validation approach
- [x] `STOCKHOLM_OPTIMIZATION.md` - Stockholm-specific optimizations
- [x] `REPO_CHANGES_CHECKLIST.md` - This file

### Scripts
- [x] `scripts/smoke_test.sh` - Automated smoke tests
- [x] `scripts/test_determinism.sh` - Determinism validation
- [x] `scripts/verify_export_dimensions.sh` - Export dimension verification
- [x] `scripts/diagnose_common_failures.sh` - Diagnostic tool
- [x] `scripts/normalize_png.sh` - PNG metadata stripping

### Themes
- [x] `themes/warm-paper.json` - Warm paper theme
- [x] `themes/charcoal.json` - Charcoal theme
- [x] `themes/blueprint-muted.json` - Blueprint muted theme

## Modified Files

### Prep Service
- [x] `prep-service/src/dem_provider.py`
  - Added `LocalFileProvider` class for manual DEM files
  - Updated error messages with clear instructions

- [x] `prep-service/src/download_dem.py`
  - Changed default provider to 'local'
  - Updated to use LocalFileProvider
  - Improved error messages with manual download instructions

- [x] `prep-service/src/generate_hillshade.py`
  - Added fallback to check `/data/dem/manual/` directory
  - Improved error messages

- [x] `prep-service/src/extract_contours.py`
  - Added fallback to check `/data/dem/manual/` directory
  - Improved error messages

### Demo A
- [x] `demo-a/exporter/src/server.js`
  - Added fixed timezone (UTC) and locale
  - Added Date.now() mock for determinism
  - Changed from launchPersistentContext to launch + newContext

### Documentation
- [x] `README.md`
  - Added manual DEM download reference
  - Added testing section with script references

## Files That Need Manual Review/Completion

### MapLibre Theme-to-Style (Demo A)
- [ ] `demo-a/web/src/themeToStyle.js`
  - Verify OSM layer schema matches Planetiler output
  - Implement contour interval visibility logic based on preset/size
  - Add print mode stroke width scaling

### Mapnik XML Generation (Demo B)
- [ ] `demo-b/renderer/src/theme_to_mapnik.py`
  - Verify PostGIS table names match osm2pgsql schema
  - Implement contour interval visibility logic
  - Fix background layer datasource (currently placeholder)
  - Add proper bbox handling for !bbox! parameter

### Mapnik Renderer
- [ ] `demo-b/renderer/src/mapnik_renderer.py`
  - Verify font registration works
  - Test PDF output generation
  - Add PNG metadata stripping option

### Martin Configuration
- [ ] `demo-a/tileserver/martin.yaml`
  - Update to proper Martin configuration syntax
  - Handle preset-based source selection (may need environment variables or catalog API)

## Testing Checklist

Before release:

- [ ] Run `scripts/smoke_test.sh` - all tests pass
- [ ] Run `scripts/test_determinism.sh` for Demo B - byte-identical
- [ ] Run `scripts/test_determinism.sh` for Demo A - visual stability verified
- [ ] Verify export dimensions match expected (A2 150/300 DPI, A1 150/300 DPI)
- [ ] Visual inspection of exports:
  - [ ] All layers visible
  - [ ] No contour labels
  - [ ] Colors match theme
  - [ ] Print quality acceptable
- [ ] Test manual DEM download workflow
- [ ] Test both bbox presets (stockholm_core, stockholm_wide)
- [ ] Test all themes
- [ ] Verify determinism: 3 identical exports for Demo B

## Known Limitations / Future Work

1. **EU-DEM Automated Download:** Requires Copernicus API integration (manual workflow provided)
2. **Martin Preset Handling:** Current config is simplified; may need environment-based approach
3. **PostGIS Schema:** Actual osm2pgsql schema may differ; queries need verification
4. **Planetiler Schema:** Actual tile schema may differ; MapLibre style needs verification
5. **Background Layer (Mapnik):** Currently uses placeholder; needs proper geometry generation

## Minimal Fixes Required for First Working Release

1. Fix Playwright exporter determinism (✅ Done)
2. Add LocalFileProvider for DEM (✅ Done)
3. Update DEM scripts to check manual/ directory (✅ Done)
4. Add smoke tests (✅ Done)
5. Add determinism tests (✅ Done)
6. Create runbook (✅ Done)

## Next Steps After This Checklist

1. Run smoke tests to identify any remaining issues
2. Test manual DEM workflow end-to-end
3. Verify tile generation produces valid MBTiles
4. Test both demo exports with actual data
5. Refine theme-to-style mappings based on actual tile schemas
6. Update Mapnik XML queries based on actual PostGIS schema




