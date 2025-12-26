# Current Status - 26 December 2025 (Updated)

## Session Summary

**Status:** ✅ Båda webbapparna (Demo A och Demo B) är fullt fungerande med alla fixes implementerade.

---

## CRITICAL FIXES IMPLEMENTED (This Session)

### 1. Demo A Hillshade 404 Fix
**Problem:** Hillshade tiles returnerade 404 pga path mismatch och TMS/XYZ format.
**Solution:**
- Kopierade tiles från `stockholm_core_new/` till `stockholm_core/`
- Lade till `scheme: 'tms'` i themeToStyle.js för korrekt y-koordinat-hantering

### 2. Demo B Mapnik XML Fix
**Problem:** `<Styles>` och `<Layers>` wrapper-element var ogiltiga i Mapnik.
**Solution:** Tog bort wrapper-elementen, `<Style>` och `<Layer>` nu direkt under `<Map>`

### 3. Demo B 1px Dimension Fix
**Problem:** `int()` trunkerade istället för att avrunda, gav 3507 px istället för 3508.
**Solution:** Bytte till `round()` i server.py

### 4. Dynamic Themes i båda UI
**Problem:** Hardkodad lista med endast 5 themes.
**Solution:**
- Lade till `/api/themes` endpoint i båda web-servers
- Uppdaterade HTML/JS för att dynamiskt ladda themes
- Alla 9 themes nu tillgängliga: paper, ink, mono, dark, gallery, charcoal, warm-paper, blueprint-muted, muted-pastel

### 5. Demo B SQL Fix
**Problem:** `ST_Hash()` funktion finns inte i PostGIS.
**Solution:** Tog bort alla `ORDER BY ST_Hash(way)` klausuler

---

## VERIFIED EXPORTS (A2 150 DPI)

| Export | Dimensioner | Storlek | Status |
|--------|-------------|---------|--------|
| demo_a_paper.png | 2480x3508 | 4.1 MB | ✅ OK |
| demo_a_gallery.png | 2480x3508 | 4.2 MB | ✅ OK |
| demo_b_paper.png | 2480x3508 | 1.6 MB | ✅ OK |
| demo_b_gallery.png | 2480x3508 | 1.9 MB | ✅ OK |

**Note:** Demo A exports är större pga anti-aliasing och WebGL rendering. Demo B är server-side Mapnik.

---

## SERVICE PORTS (RUNNING)

| Service | Port | URL | Status |
|---------|------|-----|--------|
| Demo A Web | 3000 | http://localhost:3000 | ✅ Running |
| Demo A Tileserver | 8080 | http://localhost:8080/catalog | ✅ Running |
| Demo A Hillshade | 8081 | http://localhost:8081/tiles/hillshade/stockholm_core/{z}/{x}/{y}.png | ✅ Running |
| Demo A Exporter | 8082 | http://localhost:8082/render | ✅ Running |
| Demo B Web | 3001 | http://localhost:3001 | ✅ Running |
| Demo B API | 5000 | http://localhost:5000/health | ✅ Running |
| Demo B Renderer | 5001 | (internal) | ✅ Running |
| Demo B DB | 5432 | (internal) | ✅ Running |

---

## API ENDPOINTS

### Themes List
```bash
# Demo A
curl http://localhost:3000/api/themes

# Demo B
curl http://localhost:3001/api/themes
```

### Export Commands
```bash
# Demo A Export (A2 150 DPI)
curl "http://localhost:8082/render?bbox_preset=stockholm_core&theme=paper&render_mode=print&dpi=150&width_mm=420&height_mm=594" --output export.png

# Demo B Export (A2 150 DPI)
curl -X POST "http://localhost:5000/render" \
  -H "Content-Type: application/json" \
  -d '{"bbox_preset":"stockholm_core","theme":"paper","render_mode":"print","dpi":150,"width_mm":420,"height_mm":594,"format":"png"}' \
  --output export.png
```

---

## FILES MODIFIED THIS SESSION

1. **demo-a/web/src/themeToStyle.js** - Added `scheme: 'tms'` for hillshade source
2. **demo-a/web/src/server.js** - Added `/api/themes` endpoint
3. **demo-a/web/public/index.html** - Dynamic theme dropdown
4. **demo-a/web/public/map.js** - Fetch and populate themes dynamically
5. **demo-b/web/src/server.js** - Added `/api/themes` endpoint
6. **demo-b/web/public/index.html** - Dynamic theme dropdown
7. **demo-b/renderer/src/theme_to_mapnik.py** - Fixed XML structure, removed ST_Hash
8. **demo-b/renderer/src/server.py** - Changed int() to round() for dimensions
9. **docker-compose.yml** - Added themes volume mount to demo-b-web

---

## QUICK START

```bash
cd "C:\Users\marcu\OneDrive\Dokument\topo"

# Start all services
docker compose --profile demoA --profile demoB up -d

# Open in browser
# Demo A: http://localhost:3000
# Demo B: http://localhost:3001
```

---

_Last updated: 2025-12-26 15:05_
