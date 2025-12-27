# Theme Collections Integration V1

**Version**: 1.0
**Datum**: 2025-12-27
**Status**: IMPLEMENTATION READY

---

## Executive Summary

Theme Collections är nu integrerade som förstaklass-entitet i systemet:
- **Datafil**: `config/collections.json`
- **UI-modell**: Definierad och redo för implementation
- **Preset-koppling**: Read-only metadata relation

---

## 1. Dataintegration

### Filplacering

```
config/
├── collections.json      # Collection definitions (NY)
├── bbox_presets.json     # Befintlig
└── export_presets/       # Befintlig
    └── *.json

themes/
└── *.json                # Theme-filer (oförändrade)
```

### Dataformat

**Fil**: `config/collections.json`

```json
{
  "version": "1.0",
  "collections": [
    {
      "id": "premium-poster",
      "name": "Premium Poster",
      "description": "...",
      "tier": "premium",
      "themes": ["pencil-sketch", "glitch", ...],
      "hero": "glitch"
    }
  ],
  "specialCollections": {
    "all-themes": { "id": "all-themes", "dynamic": true }
  },
  "presetDefaults": {
    "A2_Paper_v1": "premium-poster"
  }
}
```

### Laddning

```javascript
// Pseudokod för dataladdning
async function loadCollections() {
  const data = await fetch('/config/collections.json');
  return data.collections;
}

async function loadThemes() {
  // Ladda alla theme-filer från themes/
  const themeFiles = await glob('themes/*.json');
  return Promise.all(themeFiles.map(loadTheme));
}

function getCollectionThemes(collectionId, collections, themes) {
  const collection = collections.find(c => c.id === collectionId);
  return collection.themes.map(id => themes.find(t => t.name === id));
}
```

### "All Themes" Fallback

```javascript
function getAllThemes(themes) {
  return {
    id: 'all-themes',
    name: 'All Themes',
    description: 'Alla tillgängliga themes',
    themes: themes.map(t => t.name),
    hero: themes[0].name,  // Eller sorterat på popularitet
    dynamic: true
  };
}
```

---

## 2. UI-modell

### Komponentstruktur (text-skiss)

```
┌─────────────────────────────────────────────────────────────┐
│ ThemeSelector                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ CollectionTabs                                          │ │
│ │ [Premium Poster] [Premium Gallery] [Minimal] [All]      │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ CollectionHeader                                        │ │
│ │ ┌───────────────┐                                       │ │
│ │ │  Hero Theme   │  "Premium Poster"                     │ │
│ │ │  (glitch)     │  Themes optimerade för storformat...  │ │
│ │ └───────────────┘                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ThemeGrid                                               │ │
│ │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐        │ │
│ │ │     │ │     │ │     │ │     │ │     │ │     │        │ │
│ │ │ T1  │ │ T2  │ │ T3  │ │ T4  │ │ T5  │ │ T6  │        │ │
│ │ │     │ │     │ │     │ │     │ │     │ │     │        │ │
│ │ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘        │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### State-modell

```typescript
interface ThemeSelectorState {
  // Data (laddas vid init)
  collections: Collection[];
  themes: Theme[];

  // UI state
  activeCollectionId: string;      // Default: preset's default eller 'all-themes'
  selectedThemeId: string | null;  // Valt theme

  // Derived
  activeCollection: Collection;    // Beräknas från activeCollectionId
  visibleThemes: Theme[];          // Themes i aktiv kollektion
  heroTheme: Theme;                // Hero för aktiv kollektion
}
```

### Laddningssekvens

```
1. Component Mount
   │
   ├─> loadCollections()     // config/collections.json
   ├─> loadThemes()          // themes/*.json (parallellt)
   │
   ▼
2. Initialize State
   │
   ├─> Bestäm initial kollektion:
   │   - Om preset har default → använd den
   │   - Annars → 'all-themes'
   │
   ├─> Filtrera themes för aktiv kollektion
   │
   ▼
3. Render
   │
   ├─> CollectionTabs (alla kollektioner)
   ├─> CollectionHeader (aktiv kollektion + hero)
   └─> ThemeGrid (synliga themes)
```

### Interaktioner

| Händelse | Åtgärd |
|----------|--------|
| Klick på CollectionTab | `setActiveCollectionId(id)` |
| Klick på Theme | `setSelectedThemeId(id)` |
| Klick på Hero | `setSelectedThemeId(heroId)` |

### Filtrering/Sortering

```typescript
// Filtrering: visa endast themes i aktiv kollektion
function getVisibleThemes(state: ThemeSelectorState): Theme[] {
  const collection = state.collections.find(c => c.id === state.activeCollectionId);

  if (collection.dynamic) {
    // "All Themes" - visa alla
    return state.themes;
  }

  return state.themes.filter(t => collection.themes.includes(t.name));
}

// Sortering: hero först, sedan alfabetiskt
function sortThemes(themes: Theme[], heroId: string): Theme[] {
  return [...themes].sort((a, b) => {
    if (a.name === heroId) return -1;
    if (b.name === heroId) return 1;
    return a.name.localeCompare(b.name);
  });
}
```

---

## 3. Preset-koppling (read-only)

### Nuvarande relation

Presets kopplas till kollektioner via `presetDefaults` i `config/collections.json`:

```json
{
  "presetDefaults": {
    "A2_Paper_v1": "premium-poster",
    "A4_Quick_v1": "minimal-essentials",
    "A3_Blueprint_v1": "minimal-essentials",
    "A1_Terrain_v1": "warm-classics"
  }
}
```

### Användning i UI

```typescript
function getDefaultCollection(presetId: string, collections: CollectionsData): string {
  return collections.presetDefaults[presetId] || 'all-themes';
}

// Vid komponent-init
const initialCollection = getDefaultCollection(currentPreset.id, collectionsData);
```

### Framtida hook (ej implementerad nu)

```typescript
// FRAMTIDA: Preset kan ha collection metadata direkt
// config/export_presets/A2_Paper_v1.json
{
  "id": "A2_Paper_v1",
  "tier": "tier1",
  // FRAMTIDA FÄLT:
  "suggestedCollections": ["premium-poster", "premium-gallery"],
  "defaultCollection": "premium-poster"
}
```

**Beslut**: Preset-filer ändras INTE i V1. Koppling hanteras centralt i `collections.json`.

---

## 4. Implementation Checklist

### Frontend (UI-team)

- [ ] Läs `config/collections.json` vid init
- [ ] Implementera `ThemeSelector` komponent
- [ ] Implementera `CollectionTabs` med tab-switching
- [ ] Implementera `CollectionHeader` med hero
- [ ] Implementera `ThemeGrid` med filtrering
- [ ] Hantera `presetDefaults` för initial kollektion

### Backend (om applicable)

- [ ] Exponera `/api/collections` endpoint (optional)
- [ ] Validera att alla themes i kollektioner existerar (optional)

### Data

- [x] `config/collections.json` skapad
- [x] Schema dokumenterad
- [x] Preset-koppling definierad

---

## 5. API Reference

### Collections Data Shape

```typescript
interface CollectionsData {
  version: string;
  collections: Collection[];
  specialCollections: {
    'all-themes': SpecialCollection;
  };
  presetDefaults: Record<string, string>;
}

interface Collection {
  id: string;
  name: string;
  description: string;
  tier: 'premium' | 'standard';
  themes: string[];
  hero: string;
}

interface SpecialCollection {
  id: string;
  name: string;
  description: string;
  dynamic: true;
}
```

### Helper Functions

```typescript
// Hämta kollektion med fallback
function getCollection(id: string, data: CollectionsData): Collection | SpecialCollection {
  if (id === 'all-themes') {
    return data.specialCollections['all-themes'];
  }
  return data.collections.find(c => c.id === id) || data.specialCollections['all-themes'];
}

// Kontrollera om theme är i kollektion
function isThemeInCollection(themeId: string, collectionId: string, data: CollectionsData): boolean {
  if (collectionId === 'all-themes') return true;
  const collection = data.collections.find(c => c.id === collectionId);
  return collection?.themes.includes(themeId) || false;
}

// Hämta kollektioner för ett theme
function getCollectionsForTheme(themeId: string, data: CollectionsData): string[] {
  return data.collections
    .filter(c => c.themes.includes(themeId))
    .map(c => c.id);
}
```

---

## 6. Edge Cases

| Case | Hantering |
|------|-----------|
| Theme saknas i themes/ | Logga varning, exkludera från UI |
| Kollektion utan themes | Visa "No themes available" |
| Hero finns inte i themes-array | Fallback till första theme |
| presetDefaults pekar på okänd kollektion | Fallback till 'all-themes' |
| collections.json saknas | Visa endast 'all-themes' |

---

## 7. Migration Path

### V1 (Nu)
- Kollektioner i `collections.json`
- Preset-koppling via `presetDefaults`
- Themes oförändrade

### V2 (Framtida)
- Themes kan ha `collections` metadata
- Presets kan ha `suggestedCollections`
- Dynamisk kollektionsgenerering baserad på tags

---

## Definition of Done - UPPFYLLD

- [x] Kollektioner kan laddas som data (`config/collections.json`)
- [x] UI-team kan implementera utan fler beslut
- [x] Preset-koppling är tydligt förberedd
- [x] Phase 14 kan fortsätta direkt

---

*Genererad av Product Implementation Agent*
*Baserad på: THEME_COLLECTIONS_V1.md, THEME_COLLECTION_SCHEMA.md*
