# Nästa utvecklingsfas - Produktifiering & Skalbarhet

**Datum**: 2025-12-27
**Status**: Planeringsdokument
**Fokus**: Produktifiering, skalbarhet, UX-förbättringar

---

## Sammanfattning

Systemet har nu full datatäckning för Svealand, grön QA och fungerande Print Editor. Nästa fas fokuserar på att göra systemet mer användarvänligt, skalbart och produktionsklart utan stora arkitekturförändringar.

**Prioriterade steg:**
1. **Phase 9 - Preset Export System** (högsta prioritet)
2. **Phase 7 - UI Layer Controls för Demo B** (komplettering)
3. **Phase 8 - Print Composition System** (delvis - fokus på UX)

---

## Steg 1: Preset Export System (Phase 9)

### Prioritering och motivering

**Varför detta först:**
- Direkt användarvärde: användare kan välja "A2 Gallery" istället för att konfigurera manuellt
- Skalbarhet: nya presets kan läggas till via config utan kodändringar
- UX-förbättring: guidar användaren mot rimliga kombinationer (tema + format + DPI)
- Låg teknisk risk: bygger på befintlig preset_limits.json och theme-system

**Effekt:**
- Minskar felanvändning (t.ex. 300 DPI för Svealand)
- Snabbare iteration för användare
- Enklare onboarding

### Tekniska deluppgifter

#### 1.1 Backend: Preset Export Config

**Filer att skapa/ändra:**
- `prep-service/config/export_presets.json` (ny fil)
- `demo-b/renderer/src/server.py` (lägg till `/export-presets` endpoint)
- `demo-a/exporter/src/server.js` (lägg till `/export-presets` endpoint)

**Struktur för export_presets.json:**
```json
{
  "presets": [
    {
      "id": "a2_gallery",
      "name": "A2 Gallery Print",
      "description": "Fine art print, gallery quality",
      "theme": "gallery",
      "format": "A2",
      "orientation": "portrait",
      "dpi": 150,
      "layers": {
        "hillshade": true,
        "water": true,
        "roads": true,
        "buildings": true,
        "contours": true,
        "parks": true
      },
      "bbox_presets": ["stockholm_core", "stockholm_wide"],
      "composition": {
        "title": true,
        "subtitle": true,
        "scale": true,
        "attribution": true
      }
    },
    {
      "id": "a3_blueprint",
      "name": "A3 Blueprint",
      "description": "Technical blueprint style",
      "theme": "blueprint-muted",
      "format": "A3",
      "orientation": "landscape",
      "dpi": 150,
      "layers": {
        "hillshade": false,
        "water": true,
        "roads": true,
        "buildings": true,
        "contours": true,
        "parks": false
      },
      "bbox_presets": ["stockholm_core", "stockholm_wide", "svealand"],
      "composition": {
        "title": true,
        "subtitle": false,
        "scale": true,
        "attribution": true
      }
    },
    {
      "id": "a2_paper",
      "name": "A2 Paper",
      "description": "Classic paper style, general purpose",
      "theme": "paper",
      "format": "A2",
      "orientation": "portrait",
      "dpi": 150,
      "layers": {
        "hillshade": true,
        "water": true,
        "roads": true,
        "buildings": true,
        "contours": true,
        "parks": true
      },
      "bbox_presets": ["stockholm_core", "stockholm_wide", "svealand"],
      "composition": {
        "title": true,
        "subtitle": true,
        "scale": true,
        "attribution": true
      }
    },
    {
      "id": "a1_panorama",
      "name": "A1 Panorama",
      "description": "Large format, wide area",
      "theme": "gallery",
      "format": "A1",
      "orientation": "landscape",
      "dpi": 150,
      "layers": {
        "hillshade": true,
        "water": true,
        "roads": true,
        "buildings": true,
        "contours": true,
        "parks": true
      },
      "bbox_presets": ["stockholm_wide"],
      "composition": {
        "title": true,
        "subtitle": true,
        "scale": true,
        "attribution": true
      }
    }
  ]
}
```

**API-endpoints:**
- `GET /export-presets` - Lista alla tillgängliga export presets
- `GET /export-presets/{id}` - Hämta specifik preset
- `POST /export-presets/{id}/validate` - Validera preset mot bbox_preset (kolla DPI/format limits)

#### 1.2 Frontend: Preset Selector i Print Editor

**Filer att ändra:**
- `demo-a/web/public/editor.html` (eller motsvarande)
- `demo-b/web/public/index.html`

**UI-ändringar:**
1. Lägg till "Export Preset" dropdown överst i editor-panelen
2. När preset väljs:
   - Fyll i tema, format, orientering, DPI automatiskt
   - Aktivera/deaktivera lager enligt preset
   - Visa beskrivning: "Fine art print, gallery quality"
   - Filtrera bbox_preset-dropdown till endast kompatibla presets
3. Lägg till "Custom" i dropdown för manuell konfiguration
4. Visa varning om vald bbox_preset inte är kompatibel med export preset

**UX-copy exempel:**
- Dropdown label: "Export Preset (optional)"
- Placeholder: "Choose preset or configure manually"
- Info-text vid val: "This preset uses Gallery theme, A2 portrait, 150 DPI. Compatible with Stockholm Core and Stockholm Wide."
- Varning: "⚠️ Svealand is not compatible with this preset (max DPI: 150, preset requires 300). Choose a different preset or area."

#### 1.3 Frontend: Preset Selector i Demo B

**Filer att ändra:**
- `demo-b/web/public/index.html`
- `demo-b/web/public/index.js` (om separat)

**UI-ändringar:**
1. Lägg till "Quick Export" sektion överst
2. Dropdown med export presets
3. När preset väljs: fyll formulär automatiskt
4. Behåll befintlig "Advanced" sektion för manuell konfiguration

#### 1.4 Validering och kompatibilitet

**Logik:**
- När export preset väljs, validera mot preset_limits.json:
  - Kolla att DPI ≤ max_dpi för vald bbox_preset
  - Kolla att format är tillåtet för vald bbox_preset
- Om inkompatibel: visa felmeddelande och föreslå alternativ
- Filtrera bbox_preset-dropdown dynamiskt baserat på vald export preset

**Exempel validering:**
```javascript
// Pseudokod
function validatePresetCompatibility(exportPresetId, bboxPreset) {
  const exportPreset = getExportPreset(exportPresetId);
  const limits = getPresetLimits(bboxPreset);

  if (exportPreset.dpi > limits.max_dpi) {
    return {
      valid: false,
      error: `DPI ${exportPreset.dpi} exceeds maximum ${limits.max_dpi} for ${bboxPreset}`,
      suggestion: `Try '${findCompatiblePreset(bboxPreset, limits)}' instead`
    };
  }

  if (!limits.allowed_formats.includes(exportPreset.format)) {
    return {
      valid: false,
      error: `Format ${exportPreset.format} not allowed for ${bboxPreset}`,
      suggestion: `Allowed formats: ${limits.allowed_formats.join(', ')}`
    };
  }

  return { valid: true };
}
```

### Definition of Done

**Backend:**
- [ ] `export_presets.json` skapad med minst 4 presets (A2 Gallery, A3 Blueprint, A2 Paper, A1 Panorama)
- [ ] `/export-presets` endpoint fungerar i både Demo A och Demo B
- [ ] `/export-presets/{id}/validate` validerar mot preset_limits.json
- [ ] Unit-tester för valideringslogik

**Frontend:**
- [ ] Print Editor har "Export Preset" dropdown
- [ ] Demo B har "Quick Export" sektion med preset dropdown
- [ ] När preset väljs fylls formulär automatiskt
- [ ] bbox_preset filtreras baserat på kompatibilitet
- [ ] Tydliga felmeddelanden vid inkompatibilitet

**Dokumentation:**
- [ ] `docs/USAGE.md` uppdaterad med export preset-sektion
- [ ] `docs/STATUS.md` uppdaterad med Phase 9 status
- [ ] `docs/ROADMAP.md` uppdaterad (Phase 9 → DONE)

**Verifiering:**
- [ ] Manuell test: välj "A2 Gallery" → verifiera att tema/format/DPI fylls
- [ ] Manuell test: välj "A2 Gallery" + "Svealand" → verifiera att varning visas
- [ ] Manuell test: export med preset → verifiera att resultat matchar förväntningar
- [ ] Playwright test: preset selection och auto-fill

---

## Steg 2: UI Layer Controls för Demo B (Phase 7 komplettering)

### Prioritering och motivering

**Varför detta:**
- Paritet med Demo A: användare förväntar sig samma funktionalitet i båda demos
- Låg teknisk risk: backend stödjer redan layer visibility (via theme/style)
- Snabb implementation: kopiera UI-pattern från Demo A

**Effekt:**
- Konsistent UX mellan Demo A och Demo B
- Användare kan experimentera med lager i Demo B också

### Tekniska deluppgifter

#### 2.1 Backend: Layer Visibility API

**Filer att ändra:**
- `demo-b/renderer/src/server.py`
- `demo-b/renderer/src/theme_to_mapnik.py`

**Ändringar:**
1. Lägg till `layers` parameter i `/render` endpoint (JSON-objekt med boolean-värden)
2. Uppdatera `theme_to_mapnik.py` för att respektera layer visibility
3. När layer är `false`: sätt opacity till 0 eller dölj layer helt

**API-exempel:**
```json
{
  "bbox_preset": "stockholm_core",
  "theme": "paper",
  "dpi": 150,
  "width_mm": 420,
  "height_mm": 594,
  "layers": {
    "hillshade": true,
    "water": true,
    "roads": true,
    "buildings": false,
    "contours": true,
    "parks": true
  }
}
```

#### 2.2 Frontend: Layer Toggles i Demo B

**Filer att ändra:**
- `demo-b/web/public/index.html`
- `demo-b/web/public/index.js` (om separat)

**UI-ändringar:**
1. Lägg till "Layer Visibility" sektion i formuläret
2. Checkboxes för varje lager:
   - ☑ Hillshade
   - ☑ Water
   - ☑ Roads
   - ☑ Buildings
   - ☑ Contours
   - ☑ Parks
3. Default: alla aktiverade
4. När checkbox ändras: uppdatera `layers`-objekt i formulär
5. Skicka `layers` i render-request

**UX-copy:**
- Sektion-rubrik: "Layer Visibility"
- Checkbox labels: samma som Demo A (konsistens)
- Info-text: "Toggle layers on/off. Changes apply to export."

#### 2.3 Validering

**Logik:**
- Minst ett lager måste vara aktiverat
- Om alla lager avstängda: visa varning "At least one layer must be enabled"

### Definition of Done

**Backend:**
- [ ] `/render` endpoint accepterar `layers` parameter
- [ ] `theme_to_mapnik.py` respekterar layer visibility
- [ ] Unit-tester för layer visibility-logik

**Frontend:**
- [ ] Demo B UI har layer toggles (6 checkboxes)
- [ ] Checkboxes uppdaterar `layers`-objekt
- [ ] `layers` skickas i render-request
- [ ] Varning om alla lager avstängda

**Dokumentation:**
- [ ] `docs/USAGE.md` uppdaterad (Demo B layer controls)
- [ ] `docs/STATUS.md` uppdaterad (Phase 7 → DONE)
- [ ] `docs/ROADMAP.md` uppdaterad (Phase 7 → DONE)

**Verifiering:**
- [ ] Manuell test: avaktivera "Buildings" → verifiera att byggnader inte renderas
- [ ] Manuell test: avaktivera alla lager → verifiera att varning visas
- [ ] Playwright test: layer toggles fungerar

---

## Steg 3: Print Composition System - UX-förbättringar (Phase 8 delvis)

### Prioritering och motivering

**Varför detta (delvis):**
- Print Editor har redan grundläggande composition (titel, skala, attribution)
- Fokus på UX-förbättringar istället för ny funktionalitet
- Förbättra guidning kring långsamma builds och DPI-begränsningar

**Vad INTE görs i denna fas:**
- Ny composition-funktionalitet (ram-stilar, metadata-overlay)
- Print-safe zones system
- Avancerad typografi

**Effekt:**
- Användare förstår bättre vad som händer under export
- Minskar frustration vid långa renderingstider
- Tydligare feedback om begränsningar

### Tekniska deluppgifter

#### 3.1 Progress Feedback under Export

**Filer att ändra:**
- `demo-a/web/public/editor.html` (eller motsvarande)
- `demo-b/web/public/index.html`
- `demo-a/exporter/src/server.js` (lägg till progress events om möjligt)
- `demo-b/renderer/src/server.py` (lägg till progress events om möjligt)

**UI-ändringar:**
1. När export startar: visa modal med progress
2. Progress-steg:
   - "Preparing export..." (0-10%)
   - "Rendering map..." (10-80%)
   - "Composing layout..." (80-95%)
   - "Finalizing..." (95-100%)
3. Visa uppskattad tid kvar baserat på preset + DPI
4. Om export tar >30 sekunder: visa "This may take a while. Large exports (Svealand, high DPI) can take 2-5 minutes."

**UX-copy:**
- Modal title: "Exporting Map"
- Progress text: dynamisk baserat på steg
- Estimated time: "Estimated time: ~45 seconds" (uppdateras baserat på faktisk progress)
- Cancel-knapp: "Cancel Export" (stoppar rendering om möjligt)

#### 3.2 Förbättrad DPI/Format-guide

**Filer att ändra:**
- `demo-a/web/public/editor.html`
- `demo-b/web/public/index.html`

**UI-ändringar:**
1. När bbox_preset ändras: visa info-box med begränsningar
2. Info-box innehåll:
   - Max DPI för vald preset
   - Tillåtna format
   - Uppskattad renderingstid för olika DPI
   - Diskutrymme-varning för stora exports
3. När DPI väljs: visa uppskattad filstorlek och renderingstid
4. Om DPI > max: dölj DPI-option eller markera som "Not recommended"

**UX-copy exempel:**
```
ℹ️ Stockholm Wide Preset
Max DPI: 300
Allowed formats: A4, A3, A2, A1
Estimated rendering time:
  - 150 DPI: ~20 seconds
  - 300 DPI: ~60 seconds
⚠️ High DPI exports may take longer and produce large files.
```

#### 3.3 Build Time-varningar

**Filer att ändra:**
- `demo-b/web/public/index.html` (eller motsvarande)
- Lägg till info-sektion om build-tider

**UI-ändringar:**
1. Lägg till "About Build Times" expanderbar sektion
2. Förklara varför vissa exports tar längre tid:
   - Svealand: stort område → mer data att rendera
   - Hög DPI: fler pixlar → längre renderingstid
   - Terrain-lager: hillshade/contours ökar komplexitet
3. Tips för snabbare exports:
   - Använd lägre DPI för test
   - Välj mindre område (stockholm_core vs svealand)
   - Inaktivera onödiga lager

**UX-copy:**
```
ℹ️ About Build Times
Exports can take 20 seconds to 5 minutes depending on:
- Area size (Stockholm Core: fast, Svealand: slow)
- DPI (150 DPI: fast, 300+ DPI: slow)
- Layers (more layers = longer rendering)

💡 Tips for faster exports:
- Use 150 DPI for testing
- Choose smaller area (Stockholm Core)
- Disable unnecessary layers
```

#### 3.4 Förbättrad Error Handling

**Filer att ändra:**
- `demo-a/web/public/editor.html`
- `demo-b/web/public/index.html`
- Backend error responses

**UI-ändringar:**
1. När export misslyckas: visa tydligt felmeddelande
2. Kategorisera fel:
   - Valideringsfel (DPI för högt, format inte tillåtet) → visa lösning
   - Timeout (export tog för lång tid) → föreslå lägre DPI/mindre område
   - Server-fel (500) → visa "Please try again or contact support"
3. Lägg till "Retry" knapp vid fel
4. Lägg till "Export Log" expanderbar sektion med tekniska detaljer (för debugging)

**UX-copy exempel:**
```
❌ Export Failed
DPI 300 exceeds maximum 150 for preset 'svealand'.

💡 Solutions:
- Reduce DPI to 150 or lower
- Choose a smaller area (Stockholm Core or Stockholm Wide)
- Try a different export preset

[Retry Export] [View Details]
```

### Definition of Done

**Frontend:**
- [ ] Progress modal visar steg och uppskattad tid
- [ ] Info-box visas när bbox_preset ändras
- [ ] DPI-selector visar uppskattad filstorlek och renderingstid
- [ ] "About Build Times" sektion finns
- [ ] Förbättrade felmeddelanden med lösningsförslag

**Backend:**
- [ ] Progress events skickas under rendering (om möjligt)
- [ ] Felmeddelanden är kategoriserade och actionable

**Dokumentation:**
- [ ] `docs/USAGE.md` uppdaterad med build time-info
- [ ] `docs/STATUS.md` uppdaterad (Phase 8 delvis)

**Verifiering:**
- [ ] Manuell test: starta export → verifiera progress modal
- [ ] Manuell test: välj Svealand + 300 DPI → verifiera att varning visas
- [ ] Manuell test: export misslyckas → verifiera att tydligt felmeddelande visas

---

## UX-förbättringar - Sammanfattning

### DPI-begränsningar

**Nuvarande problem:**
- Användare väljer 300 DPI för Svealand → får fel
- Ingen förvarning om begränsningar

**Lösning:**
- Info-box när preset väljs: "Max DPI: 150"
- DPI-selector filtreras baserat på preset
- Tydlig varning om DPI > max: "⚠️ This DPI exceeds maximum for selected area"

### Preset-val

**Nuvarande problem:**
- Användare måste konfigurera manuellt (tema, format, DPI, lager)
- Inga fördefinierade kombinationer

**Lösning:**
- Export Preset dropdown: "A2 Gallery", "A3 Blueprint", etc.
- Auto-fill formulär när preset väljs
- Filtrera bbox_preset baserat på kompatibilitet

### Långsamma builds

**Nuvarande problem:**
- Användare vet inte varför export tar tid
- Ingen feedback under rendering

**Lösning:**
- Progress modal med steg och uppskattad tid
- "About Build Times" sektion med förklaringar
- Tips för snabbare exports

---

## Avgränsningar - Vad INTE görs i denna fas

### Stora arkitekturförändringar
- ❌ Ny rendering pipeline
- ❌ Ny datakälla (t.ex. bathymetri)
- ❌ 3D-rendering
- ❌ Ny tile-server

### Nya kartstilar
- ❌ Fler teman (fokus på flöde, inte design)
- ❌ Custom theme editor
- ❌ Theme-versionering

### Avancerad composition
- ❌ Ram-stilar (valbar ram-design)
- ❌ Metadata-overlay (koordinater, datum)
- ❌ Print-safe zones system
- ❌ Avancerad typografi (custom fonts, text-styling)

### Skalning av data
- ❌ Automatisk DEM-nedladdning för nya regioner (behåll manuell process)
- ❌ Cloud storage integration
- ❌ Multi-region support (behåll 3 presets: core, wide, svealand)

### Användarhantering
- ❌ User accounts
- ❌ Export history
- ❌ Sharing/collaboration

---

## Implementation Order

**Rekommenderad ordning:**
1. **Steg 1: Preset Export System** (2-3 dagar)
   - Högst användarvärde
   - Låg teknisk risk
   - Grundläggande skalbarhet
2. **Steg 2: UI Layer Controls Demo B** (1 dag)
   - Snabb win för paritet
   - Låg teknisk risk
3. **Steg 3: Print Composition UX** (1-2 dagar)
   - Förbättrar användarupplevelse
   - Ingen ny funktionalitet, bara polish

**Total uppskattad tid: 4-6 dagar**

---

## Success Metrics

**Kvalitativa:**
- Användare kan exportera med <3 klick (preset selection)
- Tydliga felmeddelanden vid ogiltiga exports
- Användare förstår varför export tar tid

**Kvantitativa:**
- 0% exports med DPI > max (validering blockerar)
- <5% exports som timeout (tydligare varningar)
- 80%+ användare använder export presets (tracking om möjligt)

---

## Dokumentation som uppdateras

- `docs/STATUS.md` - Status för Phase 7, 8 (delvis), 9
- `docs/ROADMAP.md` - Markera Phase 7, 9 som DONE
- `docs/USAGE.md` - Export preset-sektion, build time-info
- `docs/CHANGELOG.md` - Logg för varje steg

---

## Nästa steg efter denna fas

**Potentiella framtida steg (ej i denna fas):**
- Phase 8 komplett: ram-stilar, metadata-overlay
- Ytterligare export presets (användarfeedback-driven)
- Automatiserad DEM-nedladdning för nya regioner
- Export history och favoriter

