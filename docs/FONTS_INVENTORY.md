# Fonts & Rendering Dependencies Inventory

**Datum:** 2024-12-27  
**Syfte:** Dokumentation av fonts och rendering-kritiska dependencies för v1.1 hardening (determinism)

---

## Executive Summary

### Top 3 Risker
1. **Demo A print composition: System-font dependency** - Använder `system-ui`, `-apple-system`, och fallback fonts som varierar mellan OS och Playwright-browser versions
2. **Demo A: Web font fallback (`Inter`, `Playfair Display`)** - Fonts laddas via browser/system utan garanterad tillgänglighet
3. **Mapnik font path hardcoding** - Font path `/usr/share/fonts/truetype/dejavu` är hårdkodad men inte verifierad vid build-time

### Top 3 Rekommendationer
1. **Vendora fonts i Demo A exporter** - Kopiera TTF-filer till container och ladda via `@font-face` för garanterad tillgänglighet
2. **Pin Mapnik/Cairo/Pango versions** - Dokumentera exakta versionsnummer i Dockerfile och verifiera vid build
3. **Verifiera font-tillgänglighet vid build** - Lägg till build-time checks att alla refererade fonts finns

### Exakt var fonts behöver säkras för byte-identisk output
- **Demo B (Mapnik):** Fonts redan system-installerade via `fonts-dejavu`, men inga labels renderas (ingen TextSymbolizer) → låg risk
- **Demo A print composition:** Titel, undertext, scale, attribution → **HÖG RISK** (system-font fallback)
- **Demo A map labels:** MapLibre renderar labels (om aktiverade) → låg risk (vektor tiles, inga fonts i vårt repo)

---

## 1. Font Inventory - Component-by-Component

| Component | File/Path | Font Family | Source | Risk | Notes |
|-----------|-----------|-------------|--------|------|-------|
| **Demo A - Print Composition (Title)** | `demo-a/exporter/src/server.js:357-363` | `Georgia, serif` | System font (CSS) | Medium | Fallback: serif → varierar mellan OS |
| **Demo A - Print Composition (Title)** | `demo-a/exporter/src/server.js:81` | `'Inter', -apple-system, sans-serif` | Web/system font | High | `Inter` måste laddas via browser, `-apple-system` är macOS-specific |
| **Demo A - Print Composition (Title)** | `demo-a/exporter/src/server.js:93` | `system-ui, sans-serif` | System font | High | OS-specific fallback, varierar mellan Windows/Linux/macOS |
| **Demo A - Print Composition (Title)** | `demo-a/exporter/src/server.js:104` | `'Playfair Display', 'Times New Roman', serif` | Web/system font | High | `Playfair Display` måste laddas, `Times New Roman` är Windows-specific |
| **Demo A - Print Composition (Title)** | `demo-a/exporter/src/server.js:116` | `'Inter', 'Helvetica Neue', sans-serif` | Web/system font | High | `Inter` måste laddas, `Helvetica Neue` är macOS-specific |
| **Demo A - Print Composition (Scale)** | `demo-a/exporter/src/server.js:409` | `'Inter', system-ui, sans-serif` | Web/system font | High | Scale text i footer, system fallback |
| **Demo A - Print Composition (Attribution)** | `demo-a/exporter/src/server.js:426` | `'Inter', system-ui, sans-serif` | Web/system font | High | Attribution text, system fallback |
| **Demo A - Map Labels** | N/A (MapLibre) | N/A | Vector tiles | Low | MapLibre renderar labels från vector tiles, inga fonts hanteras i vårt repo |
| **Demo B - Mapnik Renderer** | `demo-b/renderer/src/mapnik_renderer.py:14` | DejaVu Sans (registrerad) | System package | Low | Fonts installeras via `fonts-dejavu`, men **ingen TextSymbolizer används** (inga labels) |
| **Demo B - Mapnik XML** | `demo-b/renderer/src/theme_to_mapnik.py` | N/A | N/A | None | Ingen TextSymbolizer i XML (contour labels avstängda) |

---

## 2. Rendering Dependencies Inventory

### 2.1 Demo A (Playwright / MapLibre)

#### Browser & Font Loading
- **Playwright version:** `mcr.microsoft.com/playwright:v1.49.1-noble` (pinned i Dockerfile)
- **Browser:** Chromium (installerad via `npx playwright install chromium`)
- **Font loading:** `document.fonts.ready` (väntas på i `server.js:273`)
- **Locale:** `en-US` (hårdkodad i `server.js:196`)
- **Timezone:** `UTC` (hårdkodad i `server.js:197`)

#### System Dependencies
- **Base image:** `mcr.microsoft.com/playwright:v1.49.1-noble` (Ubuntu-based)
- **System fonts:** Beroende på base image (vanligtvis DejaVu, Liberation)
- **Risk:** Browser kan välja olika system fonts beroende på Playwright version och OS

#### Web Fonts (Print Composition)
- **Inter:** Används i templates (`modern`, `bold`) men **INTE vendorerade** → browser måste ladda från webben eller använda system fallback
- **Playfair Display:** Används i `elegant` template men **INTE vendorerade** → browser måste ladda från webben eller använda system fallback

#### Files Involved
- `demo-a/exporter/src/server.js` - Print composition overlay (titel, scale, attribution)
- `demo-a/exporter/Dockerfile` - Playwright container setup
- `demo-a/web/public/index.html` - Basic HTML (ingen font-hantering)

### 2.2 Demo B (Mapnik / PostGIS)

#### Mapnik & Font System
- **Mapnik version:** `python3-mapnik`, `libmapnik3.1` (Debian packages)
- **Font registration:** `mapnik.register_fonts('/usr/share/fonts/truetype/dejavu')` (hårdkodad path i `mapnik_renderer.py:14`)
- **Font packages:** `fonts-dejavu`, `fonts-liberation` (installerade i Dockerfile)
- **Text rendering:** Ingen TextSymbolizer i Mapnik XML → **inga labels renderas** (contour labels avstängda)

#### Cairo / Pango / FreeType
- **Cairo:** `pycairo>=1.24.0` (Python package, används för PDF/SVG export)
- **Pango:** Transitivt beroende via Mapnik (system package)
- **FreeType:** Transitivt beroende via Mapnik/Pango (system package)
- **Risk:** Ingen explicit version pinning för Pango/FreeType (system packages)

#### Base Image & System Dependencies
- **Base image:** `python:3.11-bookworm` (Debian 12)
- **GDAL:** `gdal-bin`, `libgdal-dev` (system packages, version från Debian repos)
- **PostgreSQL client:** `postgresql-client`, `libpq-dev` (för PostGIS queries)

#### Files Involved
- `demo-b/renderer/src/mapnik_renderer.py` - Mapnik renderer (font registration)
- `demo-b/renderer/src/theme_to_mapnik.py` - Mapnik XML generation (ingen TextSymbolizer)
- `demo-b/renderer/Dockerfile` - System packages och font installation

### 2.3 Prep Service (DEM/Terrain Processing)

#### Dependencies
- **Base image:** `ghcr.io/osgeo/gdal:ubuntu-small-3.8.0` (GDAL 3.8.0)
- **Tippecanoe:** Compiled from source (git clone + make)
- **Planetiler:** Java JAR (wget från GitHub releases)
- **Fonts:** Ingen font-hantering (raster processing endast)

#### Risk Level
- **Low:** Prep service genererar inte text-rendering, endast raster/vector processing

---

## 3. Risk Analysis

### 3.1 System-Font Dependent Behavior

#### Demo A Print Composition
- **Problem:** `system-ui`, `-apple-system`, `Times New Roman`, `Helvetica Neue` är OS-specific
- **Impact:** Titel, scale, attribution kan se olika ut beroende på OS/browser
- **Likelihood:** High (olika OS/browser i CI vs local)
- **Determinism impact:** Visual differences (inte byte-identical eftersom Playwright gör screenshots)

#### Demo B Mapnik
- **Status:** Fonts installeras via system packages (`fonts-dejavu`) → låg risk
- **Problem:** Font path är hårdkodad men inte verifierad vid build-time
- **Impact:** Low (inga labels renderas ändå)

### 3.2 Fallback Fonts

#### Demo A
- **Web fonts (`Inter`, `Playfair Display`):** Om fonts inte laddas, browser fallback till system fonts → varierar
- **System fonts:** `-apple-system` (macOS), `system-ui` (varierar), `Times New Roman` (Windows)
- **Impact:** High för print composition text

#### Demo B
- **Status:** DejaVu fonts installeras via package → inga fallbacks behövs (inga labels)

### 3.3 OS-Specific Behavior

#### Playwright (Demo A)
- **Chromium rendering:** Kan variera mellan OS (antialiasing, subpixel rendering)
- **System fonts:** Olika fonts tillgängliga per OS
- **Risk:** Medium (visual differences, inte byte-identical)

#### Mapnik (Demo B)
- **Cairo/Pango rendering:** Kanske OS-specific rendering differences
- **Risk:** Low (system packages i Debian container → mer konsistent)

### 3.4 Version Pinning Gaps

#### Explicitly Pinned
- ✅ Playwright: `v1.49.1-noble`
- ✅ GDAL (prep): `3.8.0`
- ✅ PostGIS: `16-3.4`
- ✅ Python: `3.11`

#### NOT Pinned (System Packages)
- ❌ Mapnik version (Debian package version)
- ❌ Cairo version (transitivt via Mapnik)
- ❌ Pango version (transitivt via Mapnik)
- ❌ FreeType version (transitivt via Pango)
- ❌ DejaVu font version (Debian package)

---

## 4. Recommended Actions for Determinism

### 4.1 High Priority (v1.1 Hardening)

#### 4.1.1 Vendor Fonts for Demo A Print Composition
**Action:** Kopiera TTF-filer till container och ladda via `@font-face`
- Lägg fonts i `demo-a/exporter/fonts/`
- Uppdatera `server.js` för att injecta `<style>` med `@font-face` declarations
- Använd vendorerade fonts istället för system/web fonts
- **Files to modify:** `demo-a/exporter/src/server.js`, `demo-a/exporter/Dockerfile`

#### 4.1.2 Verify Font Path in Demo B
**Action:** Lägg till build-time check att font path finns
- Verifiera `/usr/share/fonts/truetype/dejavu` vid container build
- Eventuellt: lista registrerade fonts i Mapnik för debugging
- **Files to modify:** `demo-b/renderer/Dockerfile`

#### 4.1.3 Pin Mapnik/Cairo/Pango Versions
**Action:** Dokumentera och verifiera versionsnummer
- Lägg till version checks i Dockerfile (`mapnik --version`, etc.)
- Dokumentera exakta versionsnummer i `FONTS_INVENTORY.md` (uppdatera efter build)
- Överväg att pinna via apt pins om versions viktiga
- **Files to modify:** `demo-b/renderer/Dockerfile`

### 4.2 Medium Priority (Future)

#### 4.2.1 Document System Font Fallbacks
**Action:** Skapa fallback font lista per OS
- Dokumentera vilka system fonts som används som fallback på Windows/Linux/macOS
- Notera i dokumentation om determinism

#### 4.2.2 Font Loading Verification
**Action:** Verifiera att fonts är laddade innan screenshot
- I Demo A: verifiera `document.fonts.check()` efter `document.fonts.ready`
- Logga vilka fonts som faktiskt används (via `document.fonts` API)

### 4.3 Low Priority (Nice to Have)

#### 4.3.1 Font Version Inventory
**Action:** Extrahera font versions vid build-time
- Lägg till script som extraherar font metadata (version, checksum)
- Spara i build artifacts för audit trail

#### 4.3.2 Render Font List
**Action:** Exponera font lista via API/debug endpoint
- Demo B: lista registrerade Mapnik fonts
- Demo A: lista laddade browser fonts

---

## 5. Local vs CI Parity Checklist

### Demo A (Playwright)
- [ ] **Base image:** Samma Playwright version i local och CI?
- [ ] **Chromium version:** Verifiera att samma Chromium version installeras
- [ ] **System fonts:** Samma system fonts tillgängliga i CI container?
- [ ] **Web fonts:** Om web fonts används, är de tillgängliga i CI (offline?)?
- [ ] **Locale/timezone:** Samma `en-US` / `UTC` i local och CI?
- [ ] **Font loading:** Verifiera att `document.fonts.ready` väntar tillräckligt länge

### Demo B (Mapnik)
- [ ] **Base image:** Samma `python:3.11-bookworm` i local och CI?
- [ ] **Mapnik version:** Verifiera att samma Mapnik version installeras (Debian package version)
- [ ] **Font packages:** Samma `fonts-dejavu`, `fonts-liberation` versions?
- [ ] **Font path:** Verifiera att `/usr/share/fonts/truetype/dejavu` finns och är samma i local/CI
- [ ] **Cairo/Pango versions:** Verifiera transitiva dependencies (via `ldd` eller package lists)

### Prep Service
- [ ] **GDAL version:** Pinned `3.8.0` → låg risk
- [ ] **Tippecanoe:** Compiled from source → kan variera (överväg att pinna git commit)
- [ ] **Planetiler:** JAR från GitHub releases → överväg att pinna specifik release

---

## 6. Current State Summary

### Fonts Vendored in Repo
- **None** - Alla fonts kommer från system packages eller browser/system fallbacks

### Fonts System-Installed
- **Demo B:** `fonts-dejavu`, `fonts-liberation` (via Debian packages)
- **Demo A:** System fonts från Playwright base image (Ubuntu)

### Fonts Web-Loaded
- **Demo A:** `Inter`, `Playfair Display` (via browser, men **inte explicit laddade** → fallback)

### Fonts Used for Rendering
- **Demo B:** DejaVu Sans (registrerad, men **används ej** - inga labels)
- **Demo A Print Composition:** System/web fonts för titel, scale, attribution → **HIGH RISK**

### Determinism Status
- **Demo A:** Visual stability goal → font differences kan orsaka visual variance (acceptabelt per spec)
- **Demo B:** Byte-identical goal → **ingen font rendering** (contour labels avstängda) → låg risk

---

## 7. References

- Mapnik font registration: `demo-b/renderer/src/mapnik_renderer.py:14`
- Playwright font loading: `demo-a/exporter/src/server.js:273`
- Print composition fonts: `demo-a/exporter/src/server.js:69-116, 357-432`
- Mapnik Dockerfile: `demo-b/renderer/Dockerfile`
- Playwright Dockerfile: `demo-a/exporter/Dockerfile`
- Determinism docs: `DETERMINISM.md`

---

## 8. Change Log

| Date | Change | Author |
|------|--------|--------|
| 2024-12-27 | Initial inventory created | System |

---

