# Theme Collections UI Implementation V1

**Version**: 1.0
**Datum**: 2025-12-27
**Status**: READY FOR IMPLEMENTATION
**Phase**: 15

---

## Executive Summary

Denna specifikation definierar exakt hur Theme Collections ska implementeras i UI.
En frontend-utvecklare kan börja koda direkt efter att ha läst detta dokument.

**Auktoritativa källor (enda sanning):**
- `config/collections.json`
- `docs/THEME_COLLECTIONS_INTEGRATION_V1.md`

**Befintlig arkitektur att bygga på:**
- `demo-a/web/public/store.js` - EditorStore (reaktiv state)
- `demo-a/web/public/components/theme-gallery.js` - ThemeGallery (theme-kort)

---

## 1. Komponentspecifikation

### 1.1 Komponenthierarki

```
ThemeSelector (container)
├── CollectionTabs
├── CollectionHeader
└── ThemeGrid
    └── ThemeCard (read-only, befintlig)
```

### 1.2 ThemeSelector

**Fil**: `demo-a/web/public/components/theme-selector.js`

**Ansvar:**
- Wrapper-komponent som koordinerar alla sub-komponenter
- Hämtar och håller collections-data
- Initierar sub-komponenter
- Propagerar state-ändringar till EditorStore

**Props/Config:**
```javascript
{
  container: HTMLElement,      // DOM-container
  presetId: string | null,     // Aktiv preset (för default collection)
  onThemeSelect: (themeId) => void  // Callback vid theme-val
}
```

**Publikt API:**
```javascript
const ThemeSelector = {
  /**
   * Initierar komponenten
   * @param {HTMLElement} container
   * @param {Object} options - { presetId, onThemeSelect }
   */
  async init(container, options) {},

  /**
   * Uppdaterar vid preset-byte
   * @param {string} presetId
   */
  setPreset(presetId) {},

  /**
   * Cleanup
   */
  destroy() {}
};
```

**Beroenden:**
- CollectionTabs
- CollectionHeader
- ThemeGrid (wrapper runt befintlig ThemeGallery)
- EditorStore

---

### 1.3 CollectionTabs

**Fil**: `demo-a/web/public/components/collection-tabs.js`

**Ansvar:**
- Renderar horisontella tabbar för alla kollektioner
- Visar aktiv tab visuellt
- Hanterar klick för tab-byte
- "All Themes" alltid sist

**Props/State:**
```javascript
{
  collections: Collection[],   // Från collections.json
  activeId: string,            // Aktiv collection ID
  onSelect: (collectionId) => void
}
```

**Publikt API:**
```javascript
const CollectionTabs = {
  /**
   * Initierar tabs
   * @param {HTMLElement} container
   * @param {Object} options - { onSelect }
   */
  init(container, options) {},

  /**
   * Renderar tabs
   * @param {Collection[]} collections
   * @param {string} activeId
   */
  render(collections, activeId) {},

  /**
   * Uppdaterar aktiv tab utan full re-render
   * @param {string} activeId
   */
  setActive(activeId) {},

  destroy() {}
};
```

**DOM-struktur:**
```html
<div class="collection-tabs" role="tablist" aria-label="Theme collections">
  <button class="collection-tab" role="tab"
          aria-selected="true" data-collection-id="premium-poster">
    Premium Poster
  </button>
  <button class="collection-tab" role="tab"
          aria-selected="false" data-collection-id="minimal-essentials">
    Minimal Essentials
  </button>
  <!-- ... -->
  <button class="collection-tab collection-tab--all" role="tab"
          aria-selected="false" data-collection-id="all-themes">
    All Themes
  </button>
</div>
```

**Beroenden:** Inga

---

### 1.4 CollectionHeader

**Fil**: `demo-a/web/public/components/collection-header.js`

**Ansvar:**
- Visar namn och beskrivning för aktiv kollektion
- Visar hero-theme som större preview (klickbar)
- Ingen animation

**Props/State:**
```javascript
{
  collection: Collection,      // Aktiv kollektion
  heroTheme: Theme | null,     // Hero theme-data (om tillgänglig)
  onHeroClick: (themeId) => void
}
```

**Publikt API:**
```javascript
const CollectionHeader = {
  /**
   * Initierar header
   * @param {HTMLElement} container
   * @param {Object} options - { onHeroClick }
   */
  init(container, options) {},

  /**
   * Renderar header för kollektion
   * @param {Collection} collection
   * @param {Theme|null} heroTheme
   */
  render(collection, heroTheme) {},

  destroy() {}
};
```

**DOM-struktur:**
```html
<div class="collection-header">
  <div class="collection-header__hero" data-theme-id="glitch">
    <div class="collection-header__hero-swatch" style="background-color: #...">
    </div>
    <span class="collection-header__hero-label">Hero Theme</span>
  </div>
  <div class="collection-header__info">
    <h2 class="collection-header__name">Premium Poster</h2>
    <p class="collection-header__description">
      Themes optimerade för storformatstryck med stark visuell impact
    </p>
  </div>
</div>
```

**Beroenden:** Inga

---

### 1.5 ThemeGrid

**Fil**: `demo-a/web/public/components/theme-grid.js`

**Ansvar:**
- Wrapper runt befintlig ThemeGallery
- Filtrerar themes baserat på aktiv kollektion
- Sorterar: hero först, sedan alfabetiskt

**Props/State:**
```javascript
{
  themes: Theme[],             // Filtrerade themes för aktuell kollektion
  selectedId: string | null,
  loadingId: string | null,
  onSelect: (themeId) => void
}
```

**Publikt API:**
```javascript
const ThemeGrid = {
  /**
   * Initierar grid
   * @param {HTMLElement} container
   * @param {Object} options - { onSelect }
   */
  init(container, options) {},

  /**
   * Renderar themes för en kollektion
   * @param {Theme[]} themes - Redan filtrerade
   * @param {string|null} selectedId
   * @param {string} heroId - För sortering
   */
  render(themes, selectedId, heroId) {},

  /**
   * Uppdaterar selection state
   */
  updateSelection(selectedId, loadingId) {},

  destroy() {}
};
```

**Beroenden:**
- ThemeGallery (befintlig, används internt)

---

### 1.6 ThemeCard (befintlig)

**Fil**: `demo-a/web/public/components/theme-gallery.js`

ThemeCard är redan implementerad i ThemeGallery._createCard().

**Ingen ändring krävs.** Befintlig implementation stödjer:
- Read-only visning
- Selection state
- Loading state
- Keyboard navigation
- ARIA-attribut

---

## 2. State & Data-binding

### 2.1 EditorStore-tillägg

**Fil**: `demo-a/web/public/store.js`

Lägg till följande till EditorStore:

```javascript
// === Nya state-fält ===

// Collections data (laddas vid init)
collections: null,           // CollectionsData objekt

// Collection selection
selection: {
  themeId: 'paper',
  frameId: 'classic',
  collectionId: null,        // NY: Aktiv collection (null = 'all-themes')
},

// === Nya actions ===

/**
 * Ladda collections från config
 */
async loadCollections() {
  const response = await fetch('/config/collections.json');
  this.collections = await response.json();
  this._notify();
},

/**
 * Sätt aktiv kollektion
 * @param {string} collectionId
 */
setCollection(collectionId) {
  if (this.selection.collectionId === collectionId) return;
  this.selection.collectionId = collectionId;
  this._notify();
},

/**
 * Hämta default collection för preset
 * @param {string} presetId
 * @returns {string}
 */
getDefaultCollection(presetId) {
  if (!this.collections?.presetDefaults) return 'all-themes';
  return this.collections.presetDefaults[presetId] || 'all-themes';
},

// === Ny computed ===

/**
 * Hämta aktiv kollektion
 * @returns {Collection|SpecialCollection}
 */
getActiveCollection() {
  const id = this.selection.collectionId || 'all-themes';
  if (id === 'all-themes') {
    return this.collections?.specialCollections?.['all-themes'] || {
      id: 'all-themes',
      name: 'All Themes',
      themes: this.themes.map(t => t.id),
      dynamic: true
    };
  }
  return this.collections?.collections?.find(c => c.id === id);
},

/**
 * Hämta themes för aktiv kollektion
 * @returns {Theme[]}
 */
getCollectionThemes() {
  const collection = this.getActiveCollection();
  if (!collection) return this.themes;

  if (collection.dynamic) {
    return this.themes;
  }

  return this.themes.filter(t => collection.themes.includes(t.id));
}
```

### 2.2 Dataladdning

**Sekvens vid init:**

```javascript
// I ThemeSelector.init()
async function initialize() {
  // 1. Ladda data parallellt
  const [collectionsResponse, themesResponse] = await Promise.all([
    fetch('/config/collections.json'),
    loadThemeCatalog()  // Befintlig funktion
  ]);

  const collectionsData = await collectionsResponse.json();

  // 2. Uppdatera store
  EditorStore.collections = collectionsData;
  EditorStore.setThemes(themes);

  // 3. Sätt initial collection baserat på preset
  const defaultCollection = EditorStore.getDefaultCollection(currentPresetId);
  EditorStore.setCollection(defaultCollection);

  // 4. Rendera UI
  renderAll();
}
```

### 2.3 Filtrering & Sortering

```javascript
/**
 * Filtrera themes för en kollektion
 */
function filterThemes(allThemes, collection) {
  if (collection.dynamic) {
    return allThemes;
  }
  return allThemes.filter(theme =>
    collection.themes.includes(theme.id)
  );
}

/**
 * Sortera: hero först, sedan alfabetiskt
 */
function sortThemes(themes, heroId) {
  return [...themes].sort((a, b) => {
    if (a.id === heroId) return -1;
    if (b.id === heroId) return 1;
    return a.name.localeCompare(b.name, 'sv');
  });
}
```

---

## 3. Interaktionsflöde

### 3.1 Initial Load

```
1. Sida laddas
   │
   ├─> ThemeSelector.init(container, { presetId })
   │
   ├─> [Parallellt]
   │   ├─> fetch('/config/collections.json')
   │   └─> loadThemeCatalog()
   │
   ├─> EditorStore.setThemes(themes)
   ├─> EditorStore.collections = collectionsData
   │
   ├─> Bestäm initial collection:
   │   └─> presetDefaults[presetId] || 'all-themes'
   │
   ├─> EditorStore.setCollection(initialCollection)
   │
   └─> Render:
       ├─> CollectionTabs.render(collections, activeId)
       ├─> CollectionHeader.render(collection, heroTheme)
       └─> ThemeGrid.render(filteredThemes, selectedId, heroId)
```

### 3.2 Byte av Kollektion

```
1. Användare klickar på CollectionTab
   │
   ├─> CollectionTabs._handleClick(event)
   │   └─> options.onSelect(collectionId)
   │
   ├─> ThemeSelector._onCollectionChange(collectionId)
   │   └─> EditorStore.setCollection(collectionId)
   │
   ├─> Store notifierar listeners
   │
   └─> ThemeSelector._onStoreChange(state)
       ├─> CollectionTabs.setActive(newId)
       ├─> CollectionHeader.render(newCollection, heroTheme)
       └─> ThemeGrid.render(newFilteredThemes, selectedId, heroId)
```

### 3.3 Val av Theme

```
1. Användare klickar på ThemeCard
   │
   ├─> ThemeGrid → ThemeGallery._handleCardClick(event)
   │   └─> options.onSelect(themeId)
   │
   ├─> ThemeSelector._onThemeSelect(themeId)
   │   ├─> EditorStore.setTheme(themeId)
   │   └─> options.onThemeSelect(themeId)  // Callback till editor
   │
   └─> Store notifierar listeners
       └─> ThemeGrid.updateSelection(selectedId, loadingId)
```

### 3.4 Fallback till "All Themes"

Fallback triggas när:
- `presetDefaults` saknar mappning för aktuellt preset
- `collections.json` inte kan laddas
- Okänd `collectionId` efterfrågas

```javascript
function getCollectionWithFallback(collectionId, collectionsData) {
  // 1. Om 'all-themes', returnera special collection
  if (collectionId === 'all-themes') {
    return collectionsData.specialCollections['all-themes'];
  }

  // 2. Försök hitta i collections
  const found = collectionsData.collections.find(c => c.id === collectionId);
  if (found) return found;

  // 3. Fallback
  console.warn(`[ThemeSelector] Collection "${collectionId}" not found, using all-themes`);
  return collectionsData.specialCollections['all-themes'];
}
```

---

## 4. Edge Cases & Felhantering

| Scenario | Hantering |
|----------|-----------|
| `collections.json` saknas | Visa "All Themes" med alla themes |
| Theme i collection finns inte | Exkludera från ThemeGrid, logga warning |
| Hero theme finns inte | Fallback till första theme i collection |
| Tom collection | Visa "No themes in this collection" |
| presetDefaults saknar preset | Default till 'all-themes' |
| Nätverksfel vid laddning | Retry 1x, sedan visa error-state |

**Error-state DOM:**
```html
<div class="theme-selector--error">
  <p>Could not load themes. <button>Retry</button></p>
</div>
```

---

## 5. Non-Goals (Phase 15)

Följande ska **INTE** implementeras i Phase 15:

| Feature | Anledning |
|---------|-----------|
| Sök/filter inom themes | Scope creep |
| Favoriter/sparade themes | Kräver persistence |
| Drag & drop reordering | Ej prioriterat |
| Custom collections | V2 feature |
| Analytics/tracking | Separat fas |
| A/B-testning | Ej relevant |
| Animationer/transitions | Minimal first |
| Keyboard shortcuts för tabs | V2 |
| Collection preview images | Data saknas |
| Tier badges (premium/standard) | Ej visuellt beslut |
| URL sync (collection i URL) | V2 om behov |
| LocalStorage persistence | V2 |

---

## 6. Filstruktur

```
demo-a/web/public/
├── components/
│   ├── theme-selector.js      # NY
│   ├── collection-tabs.js     # NY
│   ├── collection-header.js   # NY
│   ├── theme-grid.js          # NY
│   └── theme-gallery.js       # BEFINTLIG (oförändrad)
├── styles/
│   └── theme-selector.css     # NY (minimal)
├── store.js                   # UTÖKAS med collections
└── editor.js                  # Anropspunkt
```

---

## 7. CSS-klasser (minimal)

```css
/* Collection Tabs */
.collection-tabs { }
.collection-tab { }
.collection-tab--active { }
.collection-tab--all { }

/* Collection Header */
.collection-header { }
.collection-header__hero { }
.collection-header__hero-swatch { }
.collection-header__name { }
.collection-header__description { }

/* Theme Grid */
.theme-grid { }

/* States */
.theme-selector--loading { }
.theme-selector--error { }
```

Ingen styling specificeras - endast struktur. Styling görs separat.

---

## 8. Implementation Order

```
1. EditorStore-tillägg (30 min)
   - collections state
   - setCollection action
   - getCollectionThemes computed

2. CollectionTabs (1 timme)
   - render tabs
   - click handling
   - active state

3. CollectionHeader (45 min)
   - render name/description
   - hero swatch

4. ThemeGrid (30 min)
   - wrapper runt ThemeGallery
   - filtering logic

5. ThemeSelector (1 timme)
   - koordinera komponenter
   - data loading
   - store subscription

6. Integration i editor.js (30 min)
   - byt ut befintlig gallery
   - wiring
```

---

## 9. Testing Checklist

Manuell testning efter implementation:

- [ ] Tabs renderas korrekt
- [ ] Aktiv tab markeras
- [ ] Tab-byte filtrerar themes
- [ ] Hero visas för collection
- [ ] Hero-klick väljer theme
- [ ] Theme-klick fungerar
- [ ] Preset-byte sätter rätt collection
- [ ] "All Themes" visar alla
- [ ] Fallback vid okänd collection
- [ ] Keyboard navigation i tabs
- [ ] ARIA-attribut korrekt

---

## 10. Definition of Done

Phase 15 är komplett när:

- [ ] Alla komponenter implementerade enligt spec
- [ ] EditorStore utökat med collections
- [ ] Integration i editor.js fungerar
- [ ] Manuell testning godkänd
- [ ] Ingen brytning av befintlig funktionalitet
- [ ] Ingen ändring av datafiler (collections.json, themes/*, presets/*)

---

*Genererad av Frontend Implementation Lead*
*Baserad på: config/collections.json, THEME_COLLECTIONS_INTEGRATION_V1.md*
