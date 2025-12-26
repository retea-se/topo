# Svealand Terrain Pipeline - Status

**Datum:** 2025-12-26
**Preset:** `svealand`
**Bbox:** 14.5, 58.5, 19.0, 61.0 (WGS84)

## ✅ Implementerat

### 1. GLO30Provider
- **Fil:** `prep-service/src/dem_provider.py`
- **Funktionalitet:**
  - Automatisk nedladdning från Copernicus Data Space Ecosystem (CDSE) API
  - Stöd för GLO-30 tiles (COP-DEM_GLO-30-DGED__2022_1)
  - Automatisk merging av flera tiles
  - Reprojektion till EPSG:3857
  - Bbox-clipping
- **Status:** ✅ Klar och testad (väntar på credentials)

### 2. Download Script
- **Fil:** `scripts/download_dem_svealand.ps1`
- **Funktionalitet:** Wrapper för DEM-nedladdning med credential-hantering
- **Status:** ✅ Klar

### 3. Martin Configuration
- **Fil:** `demo-a/tileserver/martin.yaml`
- **Ändringar:**
  - Aktiverade svealand contour sources:
    - `contours_svealand_2m`
    - `contours_svealand_10m`
    - `contours_svealand_50m`
- **Status:** ✅ Klar

### 4. Frontend Support
- **Fil:** `demo-a/web/src/themeToStyle.js`
- **Funktionalitet:** Redan stöd för svealand preset med preset-aware source selection
- **Status:** ✅ Redan implementerat

### 5. Terrain Generation Scripts
Alla scripts är preset-aware och redo:
- `generate_hillshade.py` - ✅ Klar
- `extract_contours.py` - ✅ Klar
- `generate_hillshade_tiles.sh` - ✅ Klar (anpassad för svealand zoom levels)
- `generate_contour_tiles.sh` - ✅ Klar (anpassad för svealand zoom levels)

### 6. Build Scripts
- **Fil:** `scripts/build_svealand.ps1` och `scripts/build_svealand.sh`
- **Funktionalitet:** Komplett pipeline för svealand (inkl. terrain)
- **Status:** ✅ Klar

### 7. Dokumentation
- **Filer:**
  - `docs/SVEALAND_DEM_REQUIREMENTS.md` - DEM-specifikationer
  - `docs/QA_REPORT_SVEALAND.md` - QA-rapport template
  - `docs/STATUS.md` - Uppdaterad med svealand-status
- **Status:** ✅ Klar

## ⏳ Väntar på

### DEM Download
- **Krav:** `COPERNICUS_USERNAME` och `COPERNICUS_PASSWORD` environment variables
- **Kommando:** `.\scripts\download_dem_svealand.ps1` eller direkt via docker-compose
- **Output:** `/data/dem/manual/svealand_eudem.tif` (EPSG:3857, ~1-3 GB)
- **Status:** ⏳ Väntar på credentials

## 📋 Nästa steg (efter DEM-nedladdning)

1. **Generate Hillshade**
   ```bash
   docker-compose run --rm prep python3 /app/src/generate_hillshade.py --preset svealand
   ```

2. **Generate Hillshade Tiles** (z9-14)
   ```bash
   docker-compose run --rm prep sh -c "gdal2tiles.py --zoom=9-14 --profile=mercator --webviewer=none --resampling=near /data/terrain/hillshade/svealand_hillshade.tif /data/tiles/hillshade/svealand"
   ```

3. **Extract Contours**
   ```bash
   docker-compose run --rm prep python3 /app/src/extract_contours.py --preset svealand
   ```

4. **Generate Contour Tiles** (z8-13)
   ```bash
   docker-compose run --rm prep /app/scripts/generate_contour_tiles.sh svealand
   ```
   (Script behöver anpassas för svealand zoom levels - se build_svealand.sh)

5. **QA Verification**
   - Tile health check
   - Visual verification i Demo A
   - Screenshots
   - Uppdatera QA_REPORT_SVEALAND.md

## 🔧 Tekniska Detaljer

### Zoom Level Limitations
Svealand är en stor region, så zoom levels är begränsade:
- **Hillshade:** z9-14 (istället för z10-16)
- **Contours:** z8-13 (istället för z10-16)

### File Naming Convention
Alla filer följer mönstret: `{preset}_{suffix}`
- DEM: `svealand_eudem.tif`
- Hillshade: `svealand_hillshade.tif`
- Contours: `svealand_{2,10,50}m.geojson`
- Contour tiles: `svealand_{2,10,50}m.mbtiles`

### Preset-Aware Serving
- **Martin:** Använder named sources (`contours_svealand_*`)
- **Nginx:** Använder preset i path (`/tiles/hillshade/svealand/{z}/{x}/{y}.png`)
- **Frontend:** `themeToStyle.js` väljer rätt sources baserat på preset

## 📊 Förväntade Resultat

Efter komplett pipeline:
- ✅ DEM: `/data/dem/manual/svealand_eudem.tif` (~1-3 GB)
- ✅ Hillshade: `/data/terrain/hillshade/svealand_hillshade.tif` (~500 MB - 1 GB)
- ✅ Hillshade tiles: `/data/tiles/hillshade/svealand/` (~500 MB - 2 GB)
- ✅ Contours: 3x GeoJSON files (~100 MB - 2 GB totalt)
- ✅ Contour tiles: 3x MBTiles files (~50-800 MB totalt)

## 🚀 Snabbstart (när credentials finns)

```powershell
# 1. Sätt credentials
$env:COPERNICUS_USERNAME = "your-email@example.com"
$env:COPERNICUS_PASSWORD = "your-password"

# 2. Ladda ner DEM
.\scripts\download_dem_svealand.ps1

# 3. Generera terrain (använd build script)
.\scripts\build_svealand.ps1 -SkipOsm

# 4. Verifiera i Demo A
# Öppna: http://localhost:3000?bbox_preset=svealand&theme=paper
```

## 📝 Commit History

- `353ed66` - Add GLO30Provider for automated Copernicus DEM download
- `8bb0349` - Add DEM download script and requirements doc for Svealand
- `b08f922` - Enable svealand contour sources in Martin config and create QA report template
- `bfdc9e1` - Update STATUS.md: GLO30Provider implemented, Svealand terrain pipeline ready

