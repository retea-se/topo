# Editor Gallery + Live Preview Implementation Plan

> **Senast uppdaterad**: 2025-12-27

---

## Quick Reference: Nästa steg

| Prioritet | Fas | Uppgift | Beroenden |
|-----------|-----|---------|-----------|
| **1** | 2A | Implementera `section-nav.js` | — |
| **2** | 2A | Refaktorera `editor.html` till grid-layout | section-nav.js |
| **3** | 2B | Integrera `createGallery()` för layouts | Fas 2A |
| **4** | 2C | Skapa `generate-thumbnails.js` | Playwright |
| **5** | 2C | Generera thumbnails för teman + layouts | generate-thumbnails.js |

**Feature flag**: `?editor=2` för ny layout (backward compatible)

---

## 0. Editor 2.0 – Section-based Gallery Architecture

> **Uppdaterad 2025-12-27**: Planen utökas för att nå "Mapiful-lik funktionalitet med egen, modernare UI/UX och nordisk design".

### 0.1 Målbild

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         EDITOR 2.0 VISION                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐  ┌──────────────────────────────────────────────────┐  │
│  │ SECTION NAV │  │                                                  │  │
│  │             │  │                                                  │  │
│  │ [Map]       │  │                  LIVE PREVIEW                    │  │
│  │ [Labels]    │  │                  (ALLTID PRIMÄR)                 │  │
│  │ [Style] ◄── │  │                                                  │  │
│  │ [Frames]    │  │              ┌─────────────────┐                 │  │
│  │ [Size]      │  │              │                 │                 │  │
│  │ [Export]    │  │              │   MAP + FRAME   │                 │  │
│  │             │  │              │     OVERLAY     │                 │  │
│  ├─────────────┤  │              │                 │                 │  │
│  │             │  │              └─────────────────┘                 │  │
│  │  GALLERY    │  │                                                  │  │
│  │  (per sekt) │  │                                                  │  │
│  │             │  │                                                  │  │
│  │ ┌───┐ ┌───┐ │  └──────────────────────────────────────────────────┘  │
│  │ │ ◉ │ │   │ │                                                        │
│  │ └───┘ └───┘ │  Status: Ready | Scale 1:25000                         │
│  │ ┌───┐ ┌───┐ │                                                        │
│  │ │   │ │   │ │                                                        │
│  │ └───┘ └───┘ │                                                        │
│  └─────────────┘                                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 0.2 Kärnprinciper

| # | Princip | Implikation |
|---|---------|-------------|
| 1 | **Preview är ALLTID primär yta** | Aldrig täckt >50% på desktop, alltid synlig på mobil |
| 2 | **Sektionsbaserad navigation** | Map, Labels, Style, Frames, Size, Export |
| 3 | **Ett galleri per relevant sektion** | Style=ThemeGallery, Frames=LayoutGallery, etc. |
| 4 | **Visuella previews** | Thumbnails på galleri-kort (ej bara färg-swatch) |
| 5 | **Dropdowns är fallback** | Galleri är primär UI, dropdown för accessibility |
| 6 | **Tap-only på mobil v1** | Inga obligatoriska swipe-gester |

### 0.3 Fas-översikt (UPPDATERAD 2025-12-27)

| Fas | Namn | Status | Beskrivning | Befintlig kod |
|-----|------|--------|-------------|---------------|
| **1** | ThemeGallery MVP | ✅ DONE | Galleri för teman bakom `?gallery=1` | `store.js`, `components/theme-gallery.js` |
| **1b** | createGallery() | ✅ DONE | Återanvändbar galleri-fabrik | `gallery-standalone/gallery.js` |
| **2A** | Section Navigation + Editor Layout | 🔜 NEXT | Sektions-baserad IA, preview-first layout | — (ny kod) |
| **2B** | Frame/Layout Gallery | ⏳ PENDING | Galleri för LAYOUT_TEMPLATES | Använder `createGallery()` |
| **2C** | Thumbnails | ⏳ PENDING | Förrenderade bilder för teman + layouts | — (ny kod + script) |
| **2D** | Övriga gallerier | ⏳ FUTURE | Icons, Size presets (om relevant) | — |

> **OBS**: `createGallery()` i `gallery-standalone/gallery.js` är redan implementerad och redo för återanvändning i Fas 2B.

### 0.4 Vad som INTE längre räcker

- ❌ Ett ensamt ThemeGallery "insprängt" i formulär
- ❌ Plan som fokuserar på komponent före editor-IA
- ❌ Dropdown som primär UI
- ❌ Preview som sekundär/kollapsbar

### 0.5 Differentiering från Mapiful

| Mapiful | Topo Editor 2.0 |
|---------|-----------------|
| Horisontell wizard-flow | Vertikala sektioner med fri navigering |
| Cirkulära färg-pickers | Card-baserade gallerier med thumbnails |
| Preview i mitten, kontroller runt | Preview primär (höger), kontroller kompakt (vänster) |
| Smooth men långsam | Snabb, direkt feedback |
| Rounded, playful design | Skandinavisk, minimal, professionell |

---

## 0.6 Fas 2A: Section Navigation + Editor Layout (HÖGST PRIORITET)

> **Mål**: Etablera den nya editor-layouten med sektionsbaserad navigation INNAN fler gallerier läggs till.

### 0.6.1 SectionNav Komponent

```
Desktop (≥1024px)                    Mobile (<768px)
┌─────────────────────┐              ┌─────────────────────┐
│ ┌─────────────────┐ │              │ LIVE PREVIEW (60vh) │
│ │ 📍 Map          │ │              ├─────────────────────┤
│ │ 🏷️ Labels       │ │              │ ═══ drag handle ═══ │
│ │ 🎨 Style    ◄── │ │              │ [📍][🏷️][🎨][🖼️][📐][⬇️] │
│ │ 🖼️ Frames       │ │              │    ▲ active tab     │
│ │ 📐 Size         │ │              │ ┌─────────────────┐ │
│ │ ⬇️ Export       │ │              │ │ SECTION CONTENT │ │
│ └─────────────────┘ │              │ │   (scrollable)  │ │
│ ─────────────────── │              │ └─────────────────┘ │
│ [Section Content]   │              └─────────────────────┘
└─────────────────────┘
```

**HTML-struktur:**
```html
<nav class="section-nav" role="tablist" aria-label="Editor sections">
  <button role="tab" aria-selected="false" data-section="map">
    <span class="section-nav__icon">📍</span>
    <span class="section-nav__label">Map</span>
  </button>
  <button role="tab" aria-selected="true" data-section="style">
    <span class="section-nav__icon">🎨</span>
    <span class="section-nav__label">Style</span>
  </button>
  <!-- ... -->
</nav>
```

**State:**
```javascript
EditorStore.ui.activeSection = 'style'; // 'map' | 'labels' | 'style' | 'frames' | 'size' | 'export'
```

### 0.6.2 Sektionsinnehåll

| Sektion | Innehåll | Galleri? |
|---------|----------|----------|
| **Map** | Bbox-val, preset-knappar, koordinater | Nej (karta är preview) |
| **Labels** | Titel, subtitle, show/hide toggles | Nej |
| **Style** | ThemeGallery, layer toggles | ✅ ThemeGallery |
| **Frames** | LayoutGallery | ✅ LayoutGallery |
| **Size** | Paper size, DPI, orientation | Möjligt: SizeGallery |
| **Export** | Format, export-knapp, progress | Nej |

### 0.6.3 Preview-first Layout

**Desktop CSS Grid:**
```css
.editor-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  grid-template-rows: 1fr auto;
  height: 100vh;
}

.editor-sidebar {
  grid-row: 1 / -1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-preview {
  position: relative;
  min-height: 400px;
}

.editor-status {
  grid-column: 2;
  padding: 8px 16px;
  border-top: 1px solid var(--border-color);
}
```

**Viktigt:**
- Preview tar ALDRIG mindre än 50% av viewport på desktop
- Sidebar har fast bredd (320px), inte procent
- Preview behåller aspect ratio för valt pappersformat

### 0.6.4 Kodstrategi: SectionNav

**Fil:** `components/section-nav.js`

```javascript
/**
 * SectionNav - Sektionsbaserad navigation
 * Använder EditorStore för activeSection state
 */
function createSectionNav(options) {
  const { container, sections, onSectionChange } = options;

  // Sections config
  const SECTIONS = sections || [
    { id: 'map', label: 'Map', icon: '📍' },
    { id: 'labels', label: 'Labels', icon: '🏷️' },
    { id: 'style', label: 'Style', icon: '🎨' },
    { id: 'frames', label: 'Frames', icon: '🖼️' },
    { id: 'size', label: 'Size', icon: '📐' },
    { id: 'export', label: 'Export', icon: '⬇️' }
  ];

  let activeSection = 'style';
  let navEl = null;

  function buildDOM() {
    navEl = document.createElement('nav');
    navEl.className = 'section-nav';
    navEl.setAttribute('role', 'tablist');
    navEl.setAttribute('aria-label', 'Editor sections');

    SECTIONS.forEach(section => {
      const btn = document.createElement('button');
      btn.className = 'section-nav__item';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('data-section', section.id);
      btn.setAttribute('aria-selected', section.id === activeSection ? 'true' : 'false');

      const icon = document.createElement('span');
      icon.className = 'section-nav__icon';
      icon.textContent = section.icon;

      const label = document.createElement('span');
      label.className = 'section-nav__label';
      label.textContent = section.label;

      btn.appendChild(icon);
      btn.appendChild(label);
      btn.addEventListener('click', () => setActive(section.id));

      navEl.appendChild(btn);
    });

    container.appendChild(navEl);
  }

  function setActive(sectionId) {
    if (sectionId === activeSection) return;
    activeSection = sectionId;

    // Update ARIA
    navEl.querySelectorAll('[role="tab"]').forEach(tab => {
      tab.setAttribute('aria-selected', tab.dataset.section === sectionId ? 'true' : 'false');
    });

    // Callback
    if (onSectionChange) onSectionChange(sectionId);
  }

  buildDOM();
  return { setActive, getActive: () => activeSection };
}
```

**Integration med EditorStore:**
```javascript
// I editor.js
const sectionNav = createSectionNav({
  container: document.querySelector('.editor-sidebar'),
  onSectionChange: (sectionId) => {
    EditorStore.setActiveSection(sectionId);
    showSection(sectionId);
  }
});

// Visa/dölj sektioner
function showSection(sectionId) {
  document.querySelectorAll('.section-content').forEach(el => {
    el.hidden = el.dataset.section !== sectionId;
  });
}
```

### 0.6.5 Leverabler Fas 2A

- [ ] `components/section-nav.js` - SectionNav komponent
- [ ] `styles/section-nav.css` - Styling desktop + mobile
- [ ] Refaktorera `editor.html` till ny grid-layout
- [ ] Migrera befintliga kontroller till respektive sektion
- [ ] Mobile bottom sheet med section tabs
- [ ] Feature flag: `?editor=2` för ny layout

---

## 0.7 Fas 2B: Frame/Layout Gallery

> **Mål**: Återanvänd befintlig `createGallery()` för LAYOUT_TEMPLATES i Frames-sektionen.
>
> **Befintlig kod**: `gallery-standalone/gallery.js` innehåller redan `createGallery()` med:
> - `selectById(id, { emit: false })` för programmatisk sync
> - `setLoading(id, bool)` för loading states
> - Keyboard navigation (piltangenter, Enter, type-ahead)
> - ARIA-attribut för accessibility

### 0.7.1 Data-transformation

```javascript
// Transformera LAYOUT_TEMPLATES till gallery-format
const layoutItems = Object.entries(LAYOUT_TEMPLATES).map(([id, layout]) => ({
  id: id,
  name: layout.name,
  category: getCategoryFromLayout(layout), // 'Minimal' | 'Classic' | 'Bold' | 'Special'
  accentColor: layout.frameColor || '#636e72',
  secondaryColor: layout.titleBackground?.includes('gradient')
    ? null
    : layout.titleBackground,
  thumbnail: `/thumbnails/layouts/${id}.png` // Fas 2C
}));

function getCategoryFromLayout(layout) {
  if (layout.frameStyle === 'none') return 'Minimal';
  if (layout.frameStyle === 'double') return 'Classic';
  if (layout.titleShadow || layout.frameGlow) return 'Bold';
  return 'Standard';
}
```

### 0.7.2 Integration i editor.js

**OBS:** Kräver att `gallery-standalone/gallery.js` laddas i `editor.html`.

```javascript
// Lägg till i editor.js

let layoutGallery = null;
let layoutGalleryInitialized = false;

/**
 * Initialisera LayoutGallery med createGallery() från gallery-standalone
 */
function initLayoutGalleryUI() {
  if (!useGalleryUI || layoutGalleryInitialized) return;
  if (typeof createGallery !== 'function') {
    console.warn('[LayoutGallery] createGallery not loaded');
    return;
  }

  const container = document.getElementById('layout-gallery-container');
  if (!container) return;

  // Transformera LAYOUT_TEMPLATES till gallery-format
  const layoutItems = Object.entries(LAYOUT_TEMPLATES).map(([id, layout]) => ({
    id: id,
    name: layout.name,
    category: getCategoryFromLayout(layout),
    accentColor: layout.frameColor || '#636e72',
    secondaryColor: layout.titleBackground?.includes?.('gradient') ? null : layout.titleBackground
  }));

  layoutGallery = createGallery({
    container: container,
    items: layoutItems,
    selectedId: currentLayoutTemplate || 'classic',
    onChange: handleLayoutGalleryChange
  });

  layoutGalleryInitialized = true;
  console.log('[LayoutGallery] Initialized with', layoutItems.length, 'layouts');
}

async function handleLayoutGalleryChange(item) {
  // Sync dropdown (utan att trigga onChange igen)
  const layoutSelect = document.getElementById('layout-select');
  if (layoutSelect) layoutSelect.value = item.id;

  // Apply layout
  setLayoutTemplate(item.id);

  // Update preview
  if (isPreviewMode) {
    updatePrintComposition();
  }
}

// Sync från dropdown till gallery (vid manuell dropdown-ändring)
function syncDropdownToGallery(layoutId) {
  if (layoutGallery) {
    layoutGallery.select(layoutId, { emit: false }); // Ingen dubbel-triggning
  }
}
```

### 0.7.3 Leverabler Fas 2B

- [ ] `initLayoutGalleryUI()` funktion
- [ ] `handleLayoutGalleryChange()` med dropdown-sync
- [ ] Lägg till `#layout-gallery-container` i Frames-sektionen
- [ ] Hide dropdown, show gallery (som ThemeGallery)
- [ ] Testa att layout-byte uppdaterar preview direkt

---

## 0.8 Fas 2C: Thumbnails

> **Mål**: Visuella previews på galleri-kort istället för enbart färg-swatches.

### 0.8.1 Gallery.js-ändringar

**Ny item-property:**
```javascript
{
  id: 'paper',
  name: 'Paper',
  thumbnail: '/thumbnails/themes/paper.png',  // NY - optional
  accentColor: '#faf8f5'  // Fallback om thumbnail saknas
}
```

**Uppdaterad createCard():**
```javascript
function createCard(item, index) {
  // ... existing code ...

  // Preview area
  const preview = document.createElement('div');
  preview.className = 'topo-gallery__card-preview';

  if (item.thumbnail) {
    const img = document.createElement('img');
    img.className = 'topo-gallery__card-thumbnail';
    img.src = item.thumbnail;
    img.alt = '';  // Decorative
    img.loading = 'lazy';
    img.onerror = () => {
      // Fallback till swatch vid fel
      img.style.display = 'none';
      swatch.style.display = 'block';
    };
    preview.appendChild(img);
  }

  // Swatch som fallback (eller om ingen thumbnail)
  const swatch = document.createElement('div');
  swatch.className = 'topo-gallery__card-swatch';
  swatch.style.backgroundColor = item.accentColor || '#f0f0f0';
  if (item.thumbnail) swatch.style.display = 'none';
  preview.appendChild(swatch);

  // ... rest of card ...
}
```

**CSS:**
```css
.topo-gallery__card-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--topo-gallery-radius) var(--topo-gallery-radius) 0 0;
}
```

### 0.8.2 Thumbnail-generering (script)

**Filstruktur:**
```
scripts/generate-thumbnails.js
public/thumbnails/
├── themes/
│   ├── paper.png (160×100px)
│   ├── ink.png
│   └── ... (38 filer)
└── layouts/
    ├── classic.png
    ├── modern.png
    └── ... (15 filer)
```

**Verktygsval:**
- **Rekommenderat**: Playwright (redan konfigurerat i projektet via MCP)
- **Alternativ**: Puppeteer (kräver separat installation)

**Genererings-process (Playwright-version):**
```javascript
// scripts/generate-thumbnails.js
const { chromium } = require('playwright');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const THUMBNAIL_SIZE = { width: 160, height: 100 };
const VIEWPORT_SIZE = { width: 800, height: 500 };
const BBOX = { west: 18.04, south: 59.32, east: 18.08, north: 59.35 }; // Stockholm centrum

async function generateThemeThumbnails(themes, outputDir) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT_SIZE
  });
  const page = await context.newPage();

  // Skapa output-katalog
  fs.mkdirSync(outputDir, { recursive: true });

  for (const theme of themes) {
    console.log(`[Thumbnail] Generating: ${theme.id}`);

    // 1. Navigera till mini-preview med tema
    await page.goto(`http://localhost:3000/thumbnail-generator.html?theme=${theme.id}`);

    // 2. Vänta på karta (MapLibre)
    await page.waitForSelector('.maplibregl-canvas');
    await page.waitForTimeout(2500); // tiles load

    // 3. Screenshot av kart-container
    const mapContainer = page.locator('#map');
    const screenshot = await mapContainer.screenshot({ type: 'png' });

    // 4. Resize + optimize med Sharp
    await sharp(screenshot)
      .resize(THUMBNAIL_SIZE.width, THUMBNAIL_SIZE.height, { fit: 'cover' })
      .png({ quality: 80, compressionLevel: 9 })
      .toFile(path.join(outputDir, `${theme.id}.png`));

    console.log(`[Thumbnail] ✓ ${theme.id}.png`);
  }

  await browser.close();
  console.log(`[Thumbnail] Done! Generated ${themes.length} thumbnails`);
}

// Usage: node generate-thumbnails.js
// Kräver: npm install playwright sharp
```

**Minimal thumbnail-generator.html:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Thumbnail Generator</title>
  <script src="https://unpkg.com/maplibre-gl@3.6.0/dist/maplibre-gl.js"></script>
  <style>
    body { margin: 0; }
    #map { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const params = new URLSearchParams(location.search);
    const themeId = params.get('theme') || 'paper';
    // Initiera MapLibre med tema från query param
    // ... (samma logik som map.js)
  </script>
</body>
</html>
```

### 0.8.3 Uppdatering av gallery-standalone/gallery.js

**Ändring i `createCard()` för thumbnail-stöd:**

```javascript
function createCard(item, index) {
  // ... existing code ...

  // Preview area
  const preview = document.createElement('div');
  preview.className = 'topo-gallery__card-preview';

  // NYTT: Thumbnail (om tillgänglig)
  if (item.thumbnail) {
    const img = document.createElement('img');
    img.className = 'topo-gallery__card-thumbnail';
    img.src = item.thumbnail;
    img.alt = '';  // Decorative
    img.loading = 'lazy';  // Native lazy loading
    img.onerror = () => {
      // Fallback till swatch vid laddningsfel
      img.style.display = 'none';
      swatch.style.display = 'block';
    };
    preview.appendChild(img);
  }

  // Swatch (fallback eller om ingen thumbnail)
  const swatch = document.createElement('div');
  swatch.className = 'topo-gallery__card-swatch';
  swatch.style.backgroundColor = item.accentColor || '#f0f0f0';
  if (item.thumbnail) swatch.style.display = 'none';
  preview.appendChild(swatch);

  // ... rest of existing code ...
}
```

### 0.8.4 Leverabler Fas 2C

- [ ] Uppdatera `gallery-standalone/gallery.js` med `item.thumbnail` stöd
- [ ] CSS för `.topo-gallery__card-thumbnail`
- [ ] `scripts/generate-thumbnails.js` (Playwright-baserad)
- [ ] `public/thumbnail-generator.html` (minimal kart-vy)
- [ ] Generera thumbnails för alla 38 teman → `public/thumbnails/themes/`
- [ ] Generera thumbnails för alla 15 layouts → `public/thumbnails/layouts/`
- [ ] Lazy loading via `loading="lazy"` attribut
- [ ] Fallback till färg-swatch vid 404/load error

---

## 0.9 Fas 2D: Övriga gallerier (FUTURE)

> **Mål**: Utöka galleri-mönstret till andra sektioner där det ger värde.

### Potentiella gallerier:

| Sektion | Galleri | Prioritet | Kommentar |
|---------|---------|-----------|-----------|
| Size | PaperSizeGallery | Låg | A4/A3/A2 som visuella kort |
| Map | BboxPresetGallery | Låg | Stockholm/Göteborg/etc med mini-kartor |
| Icons | IconGallery | Framtid | Om ikoner läggs till |

**Beslut:** Implementeras endast om UX-tester visar behov.

---

## 0.10 Hur Editor 2.0 når Mapiful-funktionalitet (utan att kopiera deras UI)

### 0.10.1 Funktionsparitet

| Mapiful Feature | Topo Editor 2.0 Motsvarighet | Status |
|-----------------|------------------------------|--------|
| Visuell tema-väljare | ThemeGallery med thumbnails | ✅ Fas 1 + 2C |
| Ramval med previews | LayoutGallery med CSS-previews | ⏳ Fas 2B |
| Live kartpreview | MapLibre canvas (redan) | ✅ Befintlig |
| Storlek/format-val | Size-sektion med presets | ⏳ Fas 2D (opt) |
| Export till PNG/PDF | Befintlig export-pipeline | ✅ Befintlig |
| Mobil-stöd | Bottom sheet med tap-nav | ⏳ Fas 2A |

### 0.10.2 UX-strategi: Vad vi gör BÄTTRE

| Mapiful | Topo Editor 2.0 | Fördel |
|---------|-----------------|--------|
| Wizard-steg (linjärt) | Fria sektioner (random access) | Snabbare iteration |
| Modals blockerar preview | Preview alltid synlig | Bättre feedback loop |
| Cirkulära färgväljare | Card-gallerier med thumbnails | Tydligare visuellt |
| Swipe-beroende mobil-UX | Tap-only (v1) | Mer förutsägbart |
| Playful/rounded design | Nordisk minimal design | Professionellt intryck |

### 0.10.3 Arkitektonisk skillnad

```
MAPIFUL                           TOPO EDITOR 2.0
────────                          ────────────────
┌─────────────────────┐           ┌─────────────────────┐
│ Step 1 → 2 → 3 → 4  │           │ [Sections: random]  │
│   (linjär wizard)   │           │   Map | Labels |    │
│                     │           │   Style | Frames    │
│ ┌─────────────────┐ │           │                     │
│ │  Modal Content  │ │           │ ┌─────────────────┐ │
│ │  (blockerar)    │ │           │ │ LIVE PREVIEW    │ │
│ └─────────────────┘ │           │ │ (alltid synlig) │ │
│                     │           │ └─────────────────┘ │
└─────────────────────┘           └─────────────────────┘
```

### 0.10.4 Varför detta räcker

1. **Samma kärnfunktioner**: Tema, ram, storlek, export
2. **Bättre feedback**: Preview är aldrig dold
3. **Snabbare workflow**: Ingen wizard-tvång
4. **Nordisk differentiering**: Egen visuell identitet
5. **Teknisk enkelhet**: Vanilla JS, ingen bundler

### 0.10.5 Kritisk insikt

> **Editor 2.0 handlar INTE om att kopiera Mapiful.**
>
> Det handlar om att erbjuda **samma funktionella djup** (temaval, ramval, storlek, export)
> med **bättre UX-arkitektur** (preview-first, fri navigation) och
> **egen visuell identitet** (nordisk, minimal, professionell).

---

## 1. Executive Summary

- **Mål**: Bygga en modern editor med galleri för kart-teman och ramar, med live-preview som reagerar omedelbart på användarens val
- **UTÖKAT MÅL (Editor 2.0)**: Flera gallerier, sektionsbaserad navigation, preview-first – Mapiful-funktionalitet med egen nordisk design
- **Nuvarande stack**: Vanilla JavaScript, Express.js, MapLibre GL JS — ingen bundler eller ramverk
- **Strategi**: Bygg på befintlig kodbas med inkrementell förbättring; undvik total omskrivning
- **Mobil-first**: Bottom sheet-navigation med swipe-gester och tab-baserad navigering
- **Differentiering**: Vertikala sektionsflöden, card-baserade gallerier med hover-effekter, sticky preview med aspect-ratio-bevarande
- **Fas 1**: Minimal viable refactor — galleri-komponenter, responsiv layout, state-centralisering
- **Fas 2**: Polish — thumbnails, memoization, skeletons, touch-gester, analytics
- **Risk**: Prestandapåverkan vid tema-byte — lösning via debounce och optimistic UI
- **Tidsuppskattning**: Avhänger av tillgängliga resurser (se task breakdown för scope)

---

## 1.1 Plan Delta (Reality Check 2025-12-27)

Följande avvikelser identifierades vid jämförelse med faktisk kod:

| Planens påstående | Faktisk status | Korrigering |
|-------------------|----------------|-------------|
| `themeToStyle.js` i `public/` | Finns i `demo-a/web/src/themeToStyle.js`, serveras via Express route | Uppdaterad sökväg i sektion 2.2 |
| "~15 teman" | 38 tema-filer i `/themes/` | Ingen virtuell scrollning behövs, men galleri dimensionerat för fler |
| Responsiv breakpoint saknas | Redan finns `@media (max-width: 900px)` i editor.html | Bygg vidare på befintlig |
| Debounce behövs | `styleChangeInProgress` + `pendingStyleChange` finns redan (editor.js:678) | Förbättra befintlig mekanism |
| Effect pipeline | `/effects/*.js` finns och laddas i editor.html | Galleri kan visa effekt-status |

---

## 1.2 Phase 1 Decisions

**Datum**: 2025-12-27  
**Status**: AKTIV IMPLEMENTATION

### Scope — Vad som ingår i Phase 1

1. **Minimal reaktiv store** (`store.js`)
   - Ersätter kritiska globala variabler: `currentTheme`, `currentPreset`, `currentLayoutTemplate`
   - Enkel subscribe/notify pattern
   - Ingen extern dependency

2. **ThemeGallery komponent**
   - Grid/cards för val av kart-teman
   - Wiring: klick → store → MapLibre preview
   - Loading state under tema-byte
   - Selected state med visuell checkmark

3. **Grundläggande responsiv layout**
   - Desktop: sidebar + sticky preview
   - Mobil: bottom sheet ELLER tabs
   - **VIKTIGT**: Endast TAP-baserad interaktion

4. **Feature flag**
   - Query param `?gallery=1` aktiverar nytt galleri
   - Utan flag: befintligt dropdown-UI används
   - Möjliggör säker rollback

### Mobil-approach (BESLUT)

**Phase 1 använder ENDAST tap-baserade states:**
- Collapsed / Half / Expanded states styrs via tap på drag handle eller knappar
- Tab-navigation för sektioner (Theme, Frame, Size, Export)
- Tydlig selected-state utan hover-beroende
- Preview alltid nåbar

**Swipe-gester är uttryckligen Phase 2 (future work)** på grund av:
- iOS Safari scroll-bounce konflikter
- `touch-action: none` kan blockera galleri-scroll
- Risk för "fiddly" UX som kräver omfattande tuning
- TAP-based är förutsägbart och fungerar konsekvent

### Scope — Vad som INTE ingår i Phase 1

- FrameGallery (P1, PR3)
- Swipe-gester (P2)
- Avancerade animationer (P2)
- Thumbnails/memoization (P2)
- Analytics (P2)

---

## 2. Current Codebase Assessment (med bevis)

### 2.1 Tech Stack

| Komponent | Teknologi | Bevis |
|-----------|-----------|-------|
| **Backend** | Express.js | `demo-a/web/package.json:11` — `"express": "^4.18.2"` |
| **Frontend** | Vanilla JavaScript | `editor.js`, `map.js` — inga import/export, inga JSX |
| **Kartor** | MapLibre GL JS 3.6.0 | `editor.html:13` — CDN-länk |
| **Build system** | Inget | `package.json:7` — endast `node src/server.js` |
| **CSS** | CSS Custom Properties | `editor.html:21-41` — `:root` med design tokens |
| **State** | Globala variabler | `editor.js:7-17` — `let currentTheme`, `let currentPreset`, etc. |
| **i18n** | Manuell översättning | `editor.js:22-147` — `translations` objekt |

### 2.2 Entry Points

| Fil | Funktion | Beskrivning |
|-----|----------|-------------|
| `demo-a/web/public/editor.html` | Print Editor UI | Huvudsaklig editor med sidebar + map |
| `demo-a/web/public/editor.js` | Editor-logik | State, event handlers, export-funktioner |
| `demo-a/web/public/index.html` | Demo-vy | Enkel kart-demo med kontroller |
| `demo-a/web/public/map.js` | Kart-rendering | MapLibre-initialisering och tema-applikation |
| `demo-a/web/src/themeToStyle.js` | Stil-konvertering | Theme JSON → MapLibre style spec |

### 2.3 Dataformat

#### Teman (`/themes/*.json`)
```json
{
  "name": "Paper",
  "background": "#faf8f5",
  "meta": { "intended_scale": "A2", "mood": "calm" },
  "hillshade": { "opacity": 0.22, "blend": "multiply" },
  "water": { "fill": "#cce0ed", "stroke": "#94b8cc" },
  "parks": { "fill": "#dcebd2", "stroke": "#b0cca0" },
  "roads": { "stroke": "#707070", "strokeWidth": { "major": 1.8, "minor": 0.9 } },
  "buildings": { "fill": "#c8c8c8", "stroke": "#808080" },
  "contours": { "stroke": "#908a85", "intervals": [2, 10, 50] }
}
```

#### Layout-ramar (`editor.js:300-526`)
```javascript
const LAYOUT_TEMPLATES = {
  classic: { name: 'Classic', titlePosition: 'top-center', frameStyle: 'solid', ... },
  modern: { name: 'Modern', titlePosition: 'bottom-left', frameStyle: 'none', ... },
  blueprint: { name: 'Blueprint', titleFont: 'monospace', framePattern: 'grid', ... },
  cyberpunk: { name: 'Cyberpunk', titleColor: '#ff00ff', frameGlow: '...', ... },
  // ... 15 totalt
}
```

#### Export Presets (`/config/export_presets/*.json`)
```json
{
  "id": "A2_Paper_v1",
  "theme": "paper",
  "paper": { "format": "A2", "orientation": "landscape" },
  "render": { "dpi": 150, "format": "png" },
  "layers": { "hillshade": true, "water": true, ... },
  "constraints": { "theme_locked": true, "dpi_locked": false }
}
```

### 2.4 Nuvarande State-hantering

```javascript
// Globala variabler i editor.js
let map;
let currentTheme = null;
let currentPreset = 'stockholm_core';
let currentBbox = null;
let currentFormat = 'png';
let currentOrientation = 'portrait';
let currentLayoutTemplate = 'classic';

// Export preset state
let exportPresets = [];
let selectedExportPreset = null;
let selectedExportPresetData = null;
```

**Problem med nuvarande approach**:
- Ingen central state-store → svårt att spåra ändringar
- Ingen reaktivitet → manuella DOM-uppdateringar överallt
- Tight coupling mellan UI och logik

### 2.5 Tema/Ram-koppling till Preview

**Nuvarande flöde** (`editor.js:663-698`):
```
1. User selects theme → themeSelect.addEventListener('change', ...)
2. loadTheme(name) → fetch('/themes/${name}.json')
3. updateMapStyle() → themeToMapLibreStyle(theme, ...) → map.setStyle(style)
4. map.once('style.load', ...) → apply layer visibility
```

**Koppling för galleri**:
Samma flöde, men triggas från galleri-card-klick istället för select-change.

---

## 3. UX + Responsivt Beteende

### 3.1 Desktop Layout (≥1024px)

```
┌──────────────────────────────────────────────────────────────────┐
│ ┌──────────────┐ ┌─────────────────────────────────────────────┐ │
│ │              │ │                                             │ │
│ │   SIDEBAR    │ │                                             │ │
│ │   (400px)    │ │               LIVE PREVIEW                  │ │
│ │              │ │               (flex: 1)                     │ │
│ │ ┌──────────┐ │ │                                             │ │
│ │ │ Section  │ │ │         [MapLibre Canvas]                   │ │
│ │ │   Nav    │ │ │                                             │ │
│ │ └──────────┘ │ │                                             │ │
│ │              │ │                                             │ │
│ │ ┌──────────┐ │ │                                             │ │
│ │ │ Gallery  │ │ │                                             │ │
│ │ │  Grid    │ │ └─────────────────────────────────────────────┘ │
│ │ │  (2 col) │ │                                                 │
│ │ └──────────┘ │ ┌─────────────────────────────────────────────┐ │
│ │              │ │ Status Bar: Scale 1:25000 | Ready           │ │
│ │ ┌──────────┐ │ └─────────────────────────────────────────────┘ │
│ │ │ Actions  │ │                                                 │
│ │ │ (sticky) │ │                                                 │
│ │ └──────────┘ │                                                 │
│ └──────────────┘                                                 │
└──────────────────────────────────────────────────────────────────┘
```

**Desktop-specifikationer**:
- Sidebar: `width: 400px; max-width: 50vw; overflow-y: auto`
- Preview: `flex: 1; position: sticky; top: 0`
- Section Navigation: Horisontella pill-tabs överst i sidebar
- Gallery Grid: 2 kolumner med 12px gap
- Actions Panel: `position: sticky; bottom: 0`

### 3.2 Tablet Layout (768px–1023px)

```
┌────────────────────────────────────────┐
│ ┌────────────────────────────────────┐ │
│ │          SECTION TABS              │ │
│ │   [Theme] [Frame] [Export]         │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │                                    │ │
│ │          GALLERY GRID              │ │
│ │          (3 columns)               │ │
│ │                                    │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │     COLLAPSED PREVIEW (20vh)       │ │
│ │     [Tap to expand]                │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │      STICKY ACTION BAR             │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

**Tablet-specifikationer**:
- Layout: Vertikal stack
- Gallery: 3 kolumner
- Preview: Kollapsad (20vh) med "expand"-indikator
- Section tabs: Sticky under header

### 3.3 Mobile Layout (<768px)

**Approach: Bottom Sheet med Tab-navigering**

```
┌────────────────────────────────────────┐
│ ┌────────────────────────────────────┐ │
│ │                                    │ │
│ │          LIVE PREVIEW              │ │
│ │          (full width)              │ │
│ │                                    │ │
│ │                                    │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ ═══ Drag handle ═══                │ │◄─ Bottom Sheet
│ │ ┌────────────────────────────────┐ │
│ │ │  🎨     🖼️     📐     ⬇️     │ │◄─ Section Icons
│ │ │ Theme  Frame  Size  Export   │ │
│ │ └────────────────────────────────┘ │
│ │ ┌────────────────────────────────┐ │
│ │ │                                │ │
│ │ │      ACTIVE SECTION            │ │
│ │ │      CONTENT                   │ │
│ │ │      (scrollable)              │ │
│ │ │                                │ │
│ │ └────────────────────────────────┘ │
│ │ ┌────────────────────────────────┐ │
│ │ │    [Preview] [Export]          │ │◄─ Action buttons
│ │ └────────────────────────────────┘ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

**Bottom Sheet States**:
1. **Collapsed** (15vh): Endast tab-ikoner + aktuellt val synligt
2. **Half-expanded** (50vh): Galleri synligt, preview reducerad
3. **Expanded** (85vh): Full galleri-vy, minimal preview

**Swipe-gester**:
- Swipe up → expand
- Swipe down → collapse
- Horizontal swipe på tabs → byt sektion

### 3.4 Breakpoints

```css
:root {
  --bp-mobile: 768px;
  --bp-tablet: 1024px;
  --bp-desktop: 1280px;
}

@media (max-width: 767px) { /* Mobile */ }
@media (min-width: 768px) and (max-width: 1023px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
```

### 3.5 Accessibility

| Element | ARIA-roll | Keyboard |
|---------|-----------|----------|
| Section Nav | `tablist` / `tab` | Arrow keys, Enter |
| Gallery Grid | `listbox` | Arrow keys navigerar cards |
| Gallery Card | `option` | Enter för val, Space för preview |
| Bottom Sheet | `dialog` | Escape stänger, Tab cyklar |
| Selected Card | `aria-selected="true"` | Visuell checkmark |

**Fokusordning**:
1. Section tabs
2. Filter/Search (om synlig)
3. Gallery cards (grid navigation)
4. Action buttons

---

## 4. Proposed Architecture

### 4.1 Komponentstruktur

```
EditorApp
├── EditorLayout
│   ├── SectionNav           # Tab-navigering mellan sektioner
│   ├── ContentArea
│   │   ├── ThemeSection
│   │   │   ├── FilterBar    # Chips: Popular, New, All
│   │   │   └── ThemeGallery
│   │   │       └── GalleryCard[]
│   │   ├── FrameSection
│   │   │   └── FrameGallery
│   │   │       └── GalleryCard[]
│   │   ├── SizeSection      # Paper size, DPI, orientation
│   │   └── ExportSection    # Format, filename, export button
│   └── ActionsPanel         # Sticky bottom: Preview/Export
├── PreviewPanel
│   ├── MapContainer
│   ├── FrameOverlay         # CSS-baserad ram-rendering
│   └── PreviewToolbar       # Zoom, fit, fullscreen
└── MobileBottomSheet        # Endast på mobil
    ├── DragHandle
    ├── SectionTabs
    └── SectionContent
```

### 4.2 State-modell

#### Centraliserad State Store (ny fil: `store.js`)

```javascript
// store.js - Enkel reaktiv state store

const EditorStore = {
  // === Catalog Data (readonly, loaded once) ===
  themes: [],           // Array<ThemeCatalogItem>
  frames: [],           // Array<FrameTemplate>
  exportPresets: [],    // Array<ExportPreset>

  // === Selection State (user choices) ===
  selection: {
    themeId: 'paper',
    frameId: 'classic',
    paperSize: 'A2',
    orientation: 'portrait',
    dpi: 150,
    format: 'png',
    layers: {
      hillshade: true,
      water: true,
      parks: true,
      roads: true,
      buildings: true,
      contours: true
    },
    title: '',
    subtitle: '',
    bboxPreset: 'stockholm_core',
    customBbox: null
  },

  // === UI State (transient) ===
  ui: {
    activeSection: 'theme',     // 'theme' | 'frame' | 'size' | 'export'
    bottomSheetState: 'half',   // 'collapsed' | 'half' | 'expanded'
    isPreviewMode: false,
    isExporting: false,
    exportProgress: 0
  },

  // === Derived State (computed) ===
  get currentTheme() {
    return this.themes.find(t => t.id === this.selection.themeId);
  },

  get currentFrame() {
    return this.frames.find(f => f.id === this.selection.frameId);
  },

  // === Listeners ===
  _listeners: new Set(),

  subscribe(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  },

  _notify() {
    this._listeners.forEach(fn => fn(this));
  },

  // === Actions ===
  setTheme(themeId) {
    this.selection.themeId = themeId;
    this._notify();
  },

  setFrame(frameId) {
    this.selection.frameId = frameId;
    this._notify();
  },

  setActiveSection(section) {
    this.ui.activeSection = section;
    this._notify();
  },

  // ... fler actions
};
```

#### TypeScript-liknande Typer (för dokumentation)

```typescript
// types.d.ts (pseudo-typer för dokumentation)

interface ThemeCatalogItem {
  id: string;           // 'paper', 'ink', etc.
  name: string;         // Display name
  background: string;   // Hex color för thumbnail-bakgrund
  meta: {
    intended_scale: string;
    mood: string;
    tags?: string[];    // 'popular', 'new', etc.
  };
  thumbnail?: string;   // Optional prerendered thumbnail URL
}

interface FrameTemplate {
  id: string;           // 'classic', 'modern', etc.
  name: string;
  titlePosition: 'top-center' | 'bottom-left' | 'none' | ...;
  frameStyle: 'solid' | 'double' | 'none';
  frameColor: string;
  frameWidth: number;
  // ... resten av layout properties
}

interface SelectionState {
  themeId: string;
  frameId: string;
  paperSize: 'A4' | 'A3' | 'A2' | 'A1' | 'A0' | 'custom';
  orientation: 'portrait' | 'landscape';
  dpi: 72 | 150 | 300 | 600;
  format: 'png' | 'pdf' | 'svg';
  layers: Record<string, boolean>;
  title: string;
  subtitle: string;
  bboxPreset: string;
  customBbox: [number, number, number, number] | null;
}
```

### 4.3 URL State (delningsbar)

**Format**: Query parameters för bokmärkning

```
/editor?theme=ink&frame=blueprint&size=A3&dpi=300&orientation=landscape
```

**Synkronisering**:
```javascript
// url-sync.js
function syncStateToURL(state) {
  const params = new URLSearchParams({
    theme: state.selection.themeId,
    frame: state.selection.frameId,
    size: state.selection.paperSize,
    dpi: state.selection.dpi,
    orientation: state.selection.orientation,
    format: state.selection.format
  });
  history.replaceState(null, '', `?${params}`);
}

function loadStateFromURL() {
  const params = new URLSearchParams(location.search);
  return {
    themeId: params.get('theme') || 'paper',
    frameId: params.get('frame') || 'classic',
    // ...
  };
}
```

---

## 5. Implementation Plan

### Phase 1: Minimal Viable Refactor (MVP)

**Mål**: Fungerande galleri + preview + mobilflöde

#### 5.1.1 State Centralization
- [ ] Skapa `store.js` med reaktiv state
- [ ] Migrera globala variabler till store
- [ ] Implementera subscribe/notify pattern
- [ ] Uppdatera `editor.js` att använda store

#### 5.1.2 Gallery Components
- [ ] Skapa `GalleryCard` komponent (HTML + CSS)
- [ ] Implementera `ThemeGallery` med grid-layout
- [ ] Implementera `FrameGallery` (frames i LAYOUT_TEMPLATES)
- [ ] Selection state med visuell checkmark
- [ ] Keyboard navigation (arrow keys)

#### 5.1.3 Responsive Layout
- [ ] Refaktorera `editor.html` med CSS Grid
- [ ] Implementera mobile bottom sheet (CSS + minimal JS)
- [ ] Section tabs för mobil-navigering
- [ ] Preview collapse/expand på tablet

#### 5.1.4 Live Preview Integration
- [ ] Koppla galleri-val till `updateMapStyle()`
- [ ] Debounce snabba tema-byten (200ms)
- [ ] Frame overlay rendering (CSS-baserad)
- [ ] Optimistic UI: markera val direkt, ladda i bakgrund

### Phase 2: Polish + Performance

**Mål**: Production-ready med optimal UX

#### 5.2.1 Thumbnails & Caching
- [ ] Generera tema-thumbnails (statiska eller on-demand)
- [ ] Lazy loading av thumbnails med IntersectionObserver
- [ ] Cache tema-JSON i memory efter första laddning
- [ ] Service Worker för offline-thumbnails (optional)

#### 5.2.2 Performance Optimization
- [ ] Memoize `themeToMapLibreStyle()` resultat
- [ ] Skeleton loading states under tema-laddning
- [ ] Virtual scrolling för stora gallerier (>50 items)
- [ ] GPU-accelererad frame overlay

#### 5.2.3 Touch & Mobile Polish
- [ ] Swipe-gester för bottom sheet
- [ ] Pull-to-refresh för tema-lista
- [ ] Haptic feedback på val (vibration API)
- [ ] Improved touch targets (48px minimum)

#### 5.2.4 Error Handling & Edge Cases
- [ ] Error states för misslyckad tema-laddning
- [ ] Offline fallback (visa cached teman)
- [ ] Loading indicators för alla async operationer
- [ ] Recovery UI för nätverksfel

#### 5.2.5 Analytics (Optional)
- [ ] Track tema-val frekvens
- [ ] Track frame-val frekvens
- [ ] Track export-completion rate
- [ ] Funnel: view → select → export

---

## 6. Detailed Task Breakdown

### Epic 1: State Management Foundation

#### Task 1.1: Create Reactive Store
**Komplexitet**: M (Medium)

**Acceptanskriterier**:
- **Given** att `store.js` existerar
- **When** jag anropar `EditorStore.setTheme('ink')`
- **Then** ska alla subscribers notifieras med ny state

**Implementation**:
```javascript
// demo-a/web/public/store.js
const EditorStore = { /* som beskrivet ovan */ };
```

---

#### Task 1.2: Migrate Global Variables
**Komplexitet**: M

**Acceptanskriterier**:
- **Given** att `editor.js` använder globala variabler
- **When** jag refaktorerar till store
- **Then** ska all existerande funktionalitet fungera identiskt

**Risker**: Regression i existerande funktioner

---

### Epic 2: Gallery Components

#### Task 2.1: GalleryCard Component
**Komplexitet**: L (Low)

**Acceptanskriterier**:
- **Given** att jag renderar en `GalleryCard`
- **When** användaren hovrar
- **Then** ska kortet visa elevation-effekt och highlight

**CSS Exempel**:
```css
.gallery-card {
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.gallery-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.gallery-card.selected {
  border: 2px solid var(--accent);
}
.gallery-card.selected::after {
  content: '✓';
  position: absolute;
  top: 8px;
  right: 8px;
  /* checkmark styling */
}
```

---

#### Task 2.2: ThemeGallery Grid
**Komplexitet**: M

**Acceptanskriterier**:
- **Given** att tema-data är laddat
- **When** galleriet renderas
- **Then** ska teman visas i 2-kolumns grid (desktop), 3 (tablet), 2 (mobil)
- **And** ska cards visa: färg-preview, namn, eventuell tag (Popular/New)

---

#### Task 2.3: FrameGallery Grid
**Komplexitet**: M

**Acceptanskriterier**:
- **Given** att `LAYOUT_TEMPLATES` finns
- **When** ram-galleriet renderas
- **Then** ska varje ram visas med mini-preview av frame-style
- **And** ska val uppdatera preview omedelbart

---

#### Task 2.4: Filter Chips
**Komplexitet**: L

**Acceptanskriterier**:
- **Given** att galleriet visar alla teman
- **When** jag klickar på "Popular" chip
- **Then** ska endast teman med `meta.tags.includes('popular')` visas

---

### Epic 3: Responsive Layout

#### Task 3.1: CSS Grid Refactor
**Komplexitet**: M

**Acceptanskriterier**:
- **Given** nuvarande flexbox-layout
- **When** jag refaktorerar till CSS Grid
- **Then** ska desktop visa sidebar + preview side-by-side
- **And** ska tablet visa stacked layout
- **And** ska mobil visa bottom sheet pattern

---

#### Task 3.2: Mobile Bottom Sheet
**Komplexitet**: H (High)

**Acceptanskriterier**:
- **Given** att jag är på mobil (viewport < 768px)
- **When** jag swiper upp på drag handle
- **Then** ska sheet expandera till 85vh
- **When** jag swiper ned
- **Then** ska sheet kollapsa till 15vh

**Implementation approach**:
```javascript
// Touch gesture handling
let startY = 0;
let currentY = 0;

dragHandle.addEventListener('touchstart', (e) => {
  startY = e.touches[0].clientY;
});

dragHandle.addEventListener('touchmove', (e) => {
  currentY = e.touches[0].clientY;
  const delta = startY - currentY;
  // Update sheet height based on delta
});

dragHandle.addEventListener('touchend', () => {
  // Snap to nearest state: collapsed, half, expanded
});
```

---

#### Task 3.3: Section Tab Navigation
**Komplexitet**: L

**Acceptanskriterier**:
- **Given** att jag är på mobil
- **When** jag klickar på "Frame" tab
- **Then** ska `activeSection` ändras till 'frame'
- **And** ska frame-galleriet visas

---

### Epic 4: Live Preview Integration

#### Task 4.1: Gallery → Preview Connection
**Komplexitet**: M

**Acceptanskriterier**:
- **Given** att jag klickar på ett tema i galleriet
- **When** tema laddas
- **Then** ska preview uppdateras inom 300ms
- **And** ska loading-state visas under laddning

---

#### Task 4.2: Frame Overlay Rendering
**Komplexitet**: M

**Acceptanskriterier**:
- **Given** att jag väljer "Blueprint" frame
- **When** preview uppdateras
- **Then** ska frame-border med grid-pattern renderas över kartan
- **And** ska titel/subtitle positioneras enligt template

**CSS-baserad lösning**:
```css
.frame-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border: var(--frame-width) var(--frame-style) var(--frame-color);
}
.frame-overlay.grid-pattern {
  background-image: /* grid pattern */;
}
```

---

#### Task 4.3: Debounced Theme Switching
**Komplexitet**: L

**Acceptanskriterier**:
- **Given** att användaren klickar snabbt på flera teman
- **When** debounce-timer körs
- **Then** ska endast det sista valet trigga `updateMapStyle()`

---

### Epic 5: Performance & Polish

#### Task 5.1: Theme Thumbnails
**Komplexitet**: M

**Acceptanskriterier**:
- **Given** att tema-galleriet renderas
- **When** jag scrollar genom galleriet
- **Then** ska thumbnails lazy-loadas med IntersectionObserver
- **And** ska placeholder visas tills thumbnail laddats

---

#### Task 5.2: Skeleton Loading States
**Komplexitet**: L

**Acceptanskriterier**:
- **Given** att tema-data laddas
- **When** galleriet är tomt
- **Then** ska skeleton cards med pulsing animation visas

---

#### Task 5.3: Keyboard Navigation
**Komplexitet**: M

**Acceptanskriterier**:
- **Given** att fokus är på ett gallery card
- **When** jag trycker höger-pil
- **Then** ska fokus flytta till nästa card
- **When** jag trycker Enter
- **Then** ska kortet väljas

---

### Task Summary

| Task | Epic | Komplexitet | Prioritet |
|------|------|-------------|-----------|
| 1.1 Create Reactive Store | State | M | P0 |
| 1.2 Migrate Global Variables | State | M | P0 |
| 2.1 GalleryCard Component | Gallery | L | P0 |
| 2.2 ThemeGallery Grid | Gallery | M | P0 |
| 2.3 FrameGallery Grid | Gallery | M | P1 |
| 2.4 Filter Chips | Gallery | L | P2 |
| 3.1 CSS Grid Refactor | Layout | M | P0 |
| 3.2 Mobile Bottom Sheet | Layout | H | P1 |
| 3.3 Section Tab Navigation | Layout | L | P1 |
| 4.1 Gallery → Preview Connection | Preview | M | P0 |
| 4.2 Frame Overlay Rendering | Preview | M | P1 |
| 4.3 Debounced Theme Switching | Preview | L | P0 |
| 5.1 Theme Thumbnails | Polish | M | P2 |
| 5.2 Skeleton Loading States | Polish | L | P2 |
| 5.3 Keyboard Navigation | Polish | M | P2 |

---

## 7. Risks & Mitigations

### 7.1 Performance Risk
**Risk**: Tema-byte triggar full stil-ombyggnad, kan frysa UI på mobil

**Mitigation**:
- Debounce tema-byten med 200ms delay
- Visa loading-indikator under byte
- Memoize `themeToMapLibreStyle()` resultat
- Överväg Web Worker för stil-beräkning

### 7.2 Rendering Regression Risk
**Risk**: Ändringar i layout kan bryta existerande export-funktionalitet

**Mitigation**:
- Bevara `updateMapStyle()` signatur exakt
- A/B-testa exporter före och efter ändring
- Behåll befintlig export-kod orörd

### 7.3 Mobile UX Risk
**Risk**: Bottom sheet kan kännas "fiddly" eller oresponsiv

**Mitigation**:
- Implementera snappy snapping (CSS snap-points)
- Använd `will-change: transform` för smooth animations
- Testa på riktiga enheter, inte bara DevTools

### 7.4 State Explosion Risk
**Risk**: Centraliserad store kan bli komplex att underhålla

**Mitigation**:
- Håll store flat (undvik deep nesting)
- Separera concerns: selection vs UI state
- Dokumentera alla state-transitions

### 7.5 Browser Compatibility Risk
**Risk**: Bottom sheet gestures fungerar olika i Safari vs Chrome

**Mitigation**:
- Använd `touch-action: none` för att förhindra scroll-bounce
- Testa iOS Safari specifikt
- Fallback till click-to-expand om gestures misslyckas

---

## 8. Open Questions

### 8.1 Thumbnails: Förrenderade eller on-demand?
**Fråga**: Ska tema-thumbnails förrenderas som statiska bilder eller genereras client-side?

**Default-antagande**: Använd tema-färger som färg-swatches i v1, generera riktiga thumbnails i v2.

**Verifiering**: Testa rendering-tid för mini-kartor på mobil.

---

### 8.2 Frame preview: Statisk bild eller live CSS?
**Fråga**: Ska fram-galleriet visa statiska bilder av frames eller live CSS-rendering?

**Default-antagande**: CSS-baserade mini-previews (snabbare, mer flexibelt).

---

### 8.3 Hur många teman/ramar förväntas?
**Fråga**: Om >50 items, behövs virtuell scrollning?

**Default-antagande**: <30 teman, <20 ramar → ingen virtuell scrollning behövs i v1.

---

### 8.4 Offline-support prioritet?
**Fråga**: Ska editorn fungera offline?

**Default-antagande**: Nej i v1, men cache tema-data i localStorage för snabb reload.

---

### 8.5 Analytics-verktyg?
**Fråga**: Vilket analytics-verktyg ska användas?

**Default-antagande**: Enkel `fetch()` till egen endpoint, eller skip i v1.

---

## Appendix A: Design Differentiering från Konkurrenter

### Vad som INTE ska kopieras
- Mapifuls horisontella preview-slider
- Mapifuls cirkulära färg-pickers
- Mapifuls floating action buttons

### Egna designbeslut
1. **Vertikala sektionsflöden** istället för horisontella steg
2. **Card-baserade gallerier** med hover-elevation
3. **Sticky preview** som alltid är synlig (desktop)
4. **Bottom sheet** med snap-points (mobil)
5. **Pill-tabs** för sektion-navigering
6. **Checkmark overlay** för selected state (ej border-only)

### Visuella differentiators
- Skandinavisk/Nordic design: mer whitespace, subtila skuggor
- Muted accent colors (blå-grå istället för knallblå)
- Typography: Inter-baserat, inte rounded/playful
- Minimal ikoner, mer text-labels

---

## Appendix B: Filstruktur efter Implementation

```
demo-a/web/public/
├── index.html           # Demo view (oförändrad)
├── editor.html          # Uppdaterad med ny struktur
├── map.js               # Oförändrad
├── editor.js            # Refaktorerad att använda store
├── store.js             # NY: Reaktiv state store
├── components/          # NY: Återanvändbara komponenter
│   ├── gallery-card.js
│   ├── section-nav.js
│   └── bottom-sheet.js
├── styles/              # NY: Separerade stilfiler
│   ├── editor.css
│   ├── gallery.css
│   ├── bottom-sheet.css
│   └── responsive.css
└── utils/               # NY: Hjälpfunktioner
    ├── url-sync.js
    └── debounce.js
```

---

*Genererad: 2025-12-27*
*Version: 1.0*
