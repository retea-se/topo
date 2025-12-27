# Label Profiles

Kontrollerade label- och POI-profiler for topo-kartor.

## Profiler

### Off
- **Beskrivning**: Inga labels eller gatunamn visas
- **Anvandning**: Ren kartbild utan text, bra for overlay eller tryck med manuell text

### Minimal Streets
- **Beskrivning**: Visar endast hogre vagklasser med diskret typografi
- **Layers**: `transportation_name` (primary, secondary, tertiary, trunk, motorway)
- **Stil**:
  - Textstorlek: 70% av original
  - Textfarg: #888888 (diskret gra)
  - Halo: 0.5px vit
  - Overlap: false (reducerad tathet)

### Landmarks
- **Beskrivning**: Visar POI/omradesnamn men inte gatunamn
- **Layers**: `place`, `poi`, `water_name`, `park`
- **Anvandning**: Orientering med platsnamn utan gatudetaljer

## API

### LABEL_PROFILES

Exporterad konstant med profildefinitioner:

```javascript
const { LABEL_PROFILES } = window.LabelProfiles;
// { off: {...}, minimal: {...}, landmarks: {...} }
```

### applyLabelProfile(map, profileKey)

Applicerar en profil pa kartan.

```javascript
const result = window.LabelProfiles.applyLabelProfile(map, 'minimal');
// result: { success: boolean, profile: string, changes: [], warnings: [], inventory: {} }
```

### inventorySymbolLayers(map)

Inventerar alla symbol-layers i kartan.

```javascript
const inventory = window.LabelProfiles.inventorySymbolLayers(map);
// inventory: { all: [], byCategory: { street: [], place: [], ... }, summary: {} }
```

### classifySymbolLayer(layer)

Klassificerar en symbol-layer baserat pa source-layer och layer-id.

```javascript
const category = window.LabelProfiles.classifySymbolLayer(layer);
// category: 'street' | 'place' | 'poi' | 'water' | 'park' | 'other'
```

### setupStyleReloadHandler(map, getProfileFn)

Satter upp hantering for automatisk aterapplicering efter style reload.

```javascript
window.LabelProfiles.setupStyleReloadHandler(map, () => currentProfile);
```

### diagnosticLandmarks(map)

Diagnosverktyg for att kontrollera om landmark-data finns i synligt omrade.

```javascript
const diag = window.LabelProfiles.diagnosticLandmarks(map);
// diag: { place: { found: boolean, count: number, sample: {} }, ... }
```

## Klassificeringsprioriteter

1. **source-layer** (hogst prioritet):
   - `transportation_name` -> street
   - `place` -> place
   - `poi` -> poi
   - `water_name` -> water
   - `park` -> park

2. **layer-id patterns** (fallback):
   - transport/road/street -> street
   - place/city/town/village/neighborhood -> place
   - poi/point -> poi
   - water/lake/river/sea -> water
   - park/forest/wood -> park

## Testning

Oppna http://localhost:3000/label-profiles/test-label-profiles.html

Testsidan innehaller:
- Profilvaljare (dropdown)
- Symbol layers inventory med kategorisering
- Lista over applicerade andringar
- Landmarks diagnostik
- "Dump All" knapp for console-output

## Integration

```html
<script src="/label-profiles/labelProfiles.js"></script>
<script>
  // Efter map.on('load', ...)
  const result = window.LabelProfiles.applyLabelProfile(map, 'minimal');

  // Hantera style reload
  window.LabelProfiles.setupStyleReloadHandler(map, () => 'minimal');
</script>
```

## Forutsattningar

- Docker Compose maste kora (for tileserver och web-server)
- Demo A web-server maste vara tillganglig pa port 3000
- Starta systemet: `docker compose --profile demoA up -d`

## Felskning

### Labels syns inte
1. Kontrollera att fonter laddas (se browser console for 404)
2. Kontrollera att tiles innehaller data (anvand "Kolla Data" i testsidan)
3. Verifiera att profilen applicerades korrekt (se "Applicerade Andringar")

### Landmarks-profil visar inget
1. Zooma in/ut for att ladda tiles med landmark-data
2. Anvand "Kolla Data" for att se vilka source-layers som har data
3. Kontrollera att features har 'name'-attribut

## Filstruktur

```
demo-a/web/public/label-profiles/
  labelProfiles.js          # Huvudmodul med alla funktioner
  test-label-profiles.html  # Interaktiv testsida
  README.md                 # Denna dokumentation
```

## Label-layers i Style

Foljande label-layers skapas i themeToStyle.js:
- `transportation-name`: Gatunamn (fran `transportation_name` source-layer)
- `place-name`: Platsnamn (fran `place` source-layer)
- `poi-name`: POI-namn (fran `poi` source-layer)
- `water-name`: Vattennamn (fran `water_name` source-layer)
- `park-name`: Parknamn (fran `park` source-layer)

## Kanda begransningar

- Label-layers kraver att OSM-vektortiles innehaller ratt source-layers
- Om source-layers saknas i tiles kommer inga labels att visas
- Profilen appliceras efter att style ar laddad; vid style-reload ateranvands setupStyleReloadHandler

## Nasta steg

- Integrera label-profil-selector i Print Editor sidebar
- Lagg till profil i export-presets
- Utoka med fler profiler om behov finns
