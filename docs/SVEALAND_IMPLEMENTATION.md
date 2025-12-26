# Svealand Preset Implementation

**Datum**: 2025-12-26
**Status**: Implementerad (OSM data genereras, terrain pending)

## Sammanfattning

Svealand preset har lagts till med full coverage support för både Demo A och Demo B. Presetet täcker Svealand-regionen (Västerås, Uppsala, Örebro, etc.) med bbox: `[14.5, 58.5, 19.0, 61.0]`.

## Implementerade ändringar

### 1. Preset Definition
- ✅ Lagt till `svealand` i `prep-service/config/bbox_presets.json`
- ✅ Bbox: `[14.5, 58.5, 19.0, 61.0]` (WGS84)

### 2. Demo A Support
- ✅ Uppdaterat `demo-a/web/public/index.html` - lagt till svealand i dropdown
- ✅ Uppdaterat `demo-a/web/public/map.js` - lagt till center/zoom för svealand
- ✅ Uppdaterat `demo-a/web/src/themeToStyle.js` - stöd för svealand OSM och contours sources
- ✅ Uppdaterat `demo-a/tileserver/martin.yaml` - lagt till svealand sources

### 3. Demo B Support
- ✅ Uppdaterat `demo-b/web/public/index.html` - lagt till svealand i dropdown
- ✅ Uppdaterat `demo-b/renderer/src/server.py` - läser presets från config (inte hårdkodade)
- ✅ Uppdaterat `docker-compose.yml` - mountat config volume till demo-b-renderer

### 4. Build Scripts
- ✅ Skapat `scripts/build_svealand.ps1` (PowerShell)
- ✅ Skapat `scripts/build_svealand.sh` (Bash)
- ✅ Skapat `scripts/prepare_dem_svealand.ps1` (PowerShell)
- ✅ Skapat `scripts/prepare_dem_svealand.sh` (Bash)

### 5. Dokumentation
- ✅ Uppdaterat `docs/STATUS.md` - lagt till svealand i coverage audit
- ✅ Uppdaterat `docs/USAGE.md` - lagt till instruktioner för svealand build
- ✅ Uppdaterat `docs/OVERVIEW.md` - lagt till svealand i preset lista

## Zoomnivåer (begränsade för svealand)

På grund av stort område är zoomnivåer begränsade:
- **Hillshade**: z9-14 (istället för z10-16)
- **Contours**: z8-13 (istället för z10-16)

## Data Status

### OSM Data
- ✅ OSM PBF klippt: `/data/osm/svealand.osm.pbf` (205 MB)
- 🔄 OSM tiles genereras (pågår)

### Terrain Data
- ⏳ DEM data: Kräver manuell nedladdning eller Copernicus credentials
- ⏳ Hillshade: Väntar på DEM
- ⏳ Contours: Väntar på DEM

## Nästa steg för full coverage

1. **Vänta på OSM tiles** (pågår nu)
2. **Skaffa DEM data**:
   ```powershell
   # Med Copernicus credentials
   .\scripts\prepare_dem_svealand.ps1 -Username "user@example.com" -Password "pass"

   # Eller manuell nedladdning
   .\scripts\prepare_dem_svealand.ps1 -InputFile "C:\Downloads\dem.tif"
   ```
3. **Generera terrain**:
   ```powershell
   .\scripts\build_svealand.ps1 -SkipOsm
   ```
4. **Starta om Demo A**:
   ```bash
   docker-compose --profile demoA down
   docker-compose --profile demoA up -d
   ```
5. **Kör QA** med Chrome DevTools MCP

## Operator Summary

### Bygga om svealand

```powershell
# Full build (OSM + terrain)
.\scripts\build_svealand.ps1

# Endast OSM
.\scripts\build_svealand.ps1 -SkipTerrain

# Endast terrain (efter DEM installerat)
.\scripts\build_svealand.ps1 -SkipOsm
```

### Outputs

- OSM: `/data/osm/svealand.osm.pbf`, `/data/tiles/osm/svealand.mbtiles`
- DEM: `/data/dem/manual/svealand_eudem.tif`
- Hillshade: `/data/terrain/hillshade/svealand_hillshade.tif`, `/data/tiles/hillshade/svealand/`
- Contours: `/data/terrain/contours/svealand_{2m,10m,50m}.geojson`, `/data/tiles/contours/svealand_{2m,10m,50m}.mbtiles`

### URLs

- Demo A: `http://localhost:3000?bbox_preset=svealand&theme=paper`
- Demo B: `http://localhost:3001` (välj svealand i dropdown)

### QA Artefakter

När QA körs kommer artefakter sparas i:
- `exports/screenshots/qa_<YYYYMMDD_HHMMSS>_svealand/`
- `docs/QA_REPORT_SVEALAND.md`

## Kända begränsningar

1. Zoomnivåer är begränsade för svealand (se ovan)
2. DEM data kräver manuell nedladdning eller Copernicus credentials
3. Stor datamängd: Svealand är mycket större än Stockholm-presets

