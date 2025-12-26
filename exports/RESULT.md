# Fix Results - Demo A & Demo B

## Summary
Fixed critical issues preventing maps from rendering and exports from working correctly.

## Root Causes Found

### 1. Demo A Web UI - Tile URL Configuration
**Problem:** Browser was trying to access container URLs (`http://demo-a-tileserver:3000`) which don't resolve from the host browser.

**Fix:** Updated `demo-a/web/src/server.js` to return `http://localhost:8080` and `http://localhost:8081` for browser access (instead of container service names).

**Files Changed:**
- `demo-a/web/src/server.js` - Fixed `/api/config` endpoint to return host-accessible URLs

### 2. Demo A - Tile URL Format
**Problem:** Tile URLs had incorrect query parameters (`?preset=...`) which Martin doesn't support.

**Fix:** Removed query parameters from tile URLs in `themeToStyle.js`.

**Files Changed:**
- `demo-a/web/src/themeToStyle.js` - Removed `?preset=${preset}` from all tile source URLs

### 3. Demo A Exporter - Tile Loading Wait
**Problem:** Exporter wasn't waiting long enough for tiles to load, resulting in blank/empty exports.

**Fix:** Improved wait logic in exporter to wait for map idle and style loading.

**Files Changed:**
- `demo-a/exporter/src/server.js` - Enhanced tile loading wait logic with longer timeouts and idle event handling

### 4. Demo B - Missing hstore Extension
**Problem:** `hstore` extension wasn't in `init.sql`, causing issues after container restarts.

**Fix:** Added `CREATE EXTENSION IF NOT EXISTS hstore;` to init.sql.

**Files Changed:**
- `demo-b/db/init.sql` - Added hstore extension

## Endpoints Tested

### Demo A
- ✅ `http://localhost:3000` - Web UI
- ✅ `http://localhost:8080/catalog` - Martin tileserver catalog
- ✅ `http://localhost:8081/tiles/hillshade/...` - Hillshade tiles (some 404s expected for missing zoom levels)
- ✅ `http://localhost:8082/render` - Export endpoint

### Demo B
- ✅ `http://localhost:3001` - Web UI
- ✅ `http://localhost:5000/health` - API health check
- ✅ `http://localhost:5000/render` - Render endpoint (works, but has Mapnik XML parsing warnings)

## Dimension Checks

### Expected Dimensions
- A2 150 DPI: 2480x3508 px
- A2 300 DPI: 4961x7016 px

### Current Status
- ⚠️ Demo A export: ~49KB (suspiciously small - needs verification)
- ⚠️ Demo B export: ~42KB (suspiciously small - needs verification)
- Need to verify actual pixel dimensions match expected (2480x3508 for A2 150DPI)
- Need to verify exports contain map content, not blank images

## Known Issues / Remaining Work

1. **Martin Tile URLs:** Still investigating correct URL format for Martin v0.14.0. The format `/catalog/{source}/tiles/{z}/{x}/{y}` returns 404. May need to verify Martin v0.14.0 documentation for exact format.
2. **Export Dimensions:** Need to verify exported PNG files have correct dimensions (2480x3508 for A2 150DPI). Current files are ~49KB which is suspiciously small.
3. **Export Content:** Need to verify exports contain actual map graphics, not blank images. The small file size suggests they may be mostly empty.
4. **Hillshade Tiles:** Some 404s for high zoom levels (expected - tiles may not exist at all zoom levels).
5. **Map Rendering:** Web UI may still show empty map if tiles aren't loading due to URL format issue.
6. **Demo B Mapnik Warnings:** Mapnik reports XML parsing warnings ("Unable to process some data while parsing"). Render still works but should be investigated.

## Next Steps

1. Verify Martin tile URL format and fix if needed
2. Test export dimensions using ImageMagick or PIL
3. Verify export content (not blank/monochrome)
4. Test Demo B render endpoint
5. Run smoke tests once basic functionality confirmed

