# Label Profiles Implementation - Sammanfattning

## Vad ändrades

### Nya filer
- `demo-a/web/public/label-profiles/labelProfiles.js`: Modul för label-profiler med tre profiler (off, minimal, landmarks)
- `demo-a/web/public/label-profiles/test-label-profiles.html`: Fristående demo-HTML för visuell testning
- `demo-a/web/public/label-profiles/README.md`: Dokumentation och instruktioner för demo

### Ändrade filer
- `demo-a/web/src/themeToStyle.js`: Lagt till 5 label-layers (transportation-name, place-name, poi-name, water-name, park-name)

## Tre label-profiler

1. **Off** (default): Inga labels eller gatunamn visas
2. **Minimal Streets**: Visar endast högre vägklasser (primary, secondary, tertiary, trunk, motorway) med diskret typografi:
   - Liten text-size (70% av original)
   - Låg kontrast (text-color justerad för diskret visning)
   - Subtil halo (0.5px width, vit färg)
   - text-allow-overlap: false, text-optional: true (för att undvika kollisioner)
3. **Landmarks**: Visar POI/områdesnamn (park, vatten, platser) men döljer gatunamn

## Label-layers i style

Följande symbol-layers skapas i MapLibre style:
- `transportation-name`: Gatunamn från `transportation_name` source-layer (filtrerat för högre vägklasser)
- `place-name`: Platsnamn från `place` source-layer (neighborhood, suburb, city, town, village)
- `poi-name`: POI-namn från `poi` source-layer
- `water-name`: Vattennamn från `water_name` source-layer
- `park-name`: Parknamn från `park` source-layer (med `name`-fält)

Alla label-layers har default `visibility: 'none'` och kontrolleras via label-profiler.

## Hur jag testar

### Steg 1: Starta systemet
```bash
docker compose up -d
```

### Steg 2: Öppna demo-HTML
Öppna i webbläsare:
```
http://localhost:3000/label-profiles/test-label-profiles.html
```

### Steg 3: Testa profiler
1. Använd dropdown-menyn "Label Profile" för att växla mellan profiler
2. Observera skillnaden i labels på kartan:
   - **Off**: Inga labels syns
   - **Minimal Streets**: Endast gatunamn på högre vägklasser (diskret typografi)
   - **Landmarks**: Parknamn, vattennamn, platsnamn syns, men inte gatunamn

### Alternativ: Testa i Demo A
1. Öppna `http://localhost:3000`
2. I browser console, kör:
```javascript
// Applicera profil
window.LabelProfiles.applyLabelProfile(window.map, 'minimal');

// Eller testa andra profiler
window.LabelProfiles.applyLabelProfile(window.map, 'off');
window.LabelProfiles.applyLabelProfile(window.map, 'landmarks');
```

## Kända begränsningar

1. **Source-layers krävs**: Label-layers kräver att OSM-vektortiles innehåller rätt source-layers:
   - `transportation_name` (för gatunamn)
   - `place` (för platsnamn)
   - `poi` (för POI-namn)
   - `water_name` (för vattennamn)
   - `park` (för parknamn med `name`-fält)

2. **Style-reload**: När style reloadas (t.ex. vid tema-byte) måste profilen appliceras igen. Demo-HTML hanterar detta automatiskt via `style.load`-event.

3. **Text-size expressions**: Minimal-profilen hanterar för närvarande endast numeriska text-size-värden. Om text-size är en expression (t.ex. zoom-baserad) behövs ytterligare hantering.

4. **Filter-begränsningar**: Transportation-name layer filtreras redan i themeToStyle.js för högre vägklasser. Om OSM-data saknar `class`-fält kan labels saknas.

## Export-first kompatibilitet

Label-profiler är designade för export-first:
- ✅ Inga slumpvariabler
- ✅ Inga tidsberoende variationer
- ✅ Profilen är en ren style-konfiguration (MapLibre layout/paint properties)
- ✅ Deterministisk: samma profil ger alltid samma resultat

## Nästa steg (inte implementerat i denna PR)

- [ ] Integrera label-profil-selector i Print Editor sidebar
- [ ] Lägg till profil i export-presets (som en del av preset-konfiguration)
- [ ] Utöka med fler profiler om behov finns (t.ex. "All Labels", "Water Only")
- [ ] Förbättra text-size-hantering för expressions i minimal-profilen

## Teknisk arkitektur

### Modul-struktur
```
labelProfiles.js
├── identifyLabelLayers(map) → identifierar label-layers i style
├── applyLabelProfile(map, profile) → applicerar profil på kartan
└── adjustColorForContrast(color, factor) → hjälpfunktion för diskret färg
```

### Integration med themeToStyle.js
- Label-layers läggs till i style efter contours men innan return
- Alla layers har `visibility: 'none'` som default
- Profiler kontrollerar visibility och styling via `applyLabelProfile()`

### Demo-HTML
- Fristående HTML som kan öppnas direkt i browsern
- Laddar MapLibre, themeToStyle.js och labelProfiles.js
- Använder samma API-endpoints som Demo A (`/api/config`, `/api/coverage`, `/themes/`)
- Automatisk profil-applikation vid style-reload

## Commit

```
feat: Implement label profiles (Phase 14) - kontrollerade label- och POI-profiler

- Skapa labelProfiles.js modul med tre profiler
- Uppdatera themeToStyle.js för att lägga till label-layers
- Skapa demo-HTML för visuell testning
- Lägg till README med instruktioner
```

Branch: `feature/label-profiles`

