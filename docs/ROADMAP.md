# Roadmap

**Senast uppdaterad**: 2025-12-26

## Statusförklaring

- ⬜ Planerad
- 🟡 Pågår
- ✅ Klar

---

## Phase 7 - UI Layer Controls

**Mål**: Implementera layer visibility-kontroller i användargränssnittet.

### Demo A

| Uppgift | Status |
|---------|--------|
| Layer toggle: Roads | ⬜ Planerad |
| Layer toggle: Water | ⬜ Planerad |
| Layer toggle: Buildings | ✅ Klar |
| Layer toggle: Contours | ✅ Klar |
| Layer toggle: Hillshade | ✅ Klar |
| Layer toggle: Parks | ⬜ Planerad |

### Demo B

| Uppgift | Status |
|---------|--------|
| Layer toggles (motsvarande Demo A) | ⬜ Planerad |

### Krav

- UI toggles mappar direkt till MapLibre-lager
- Ingen datagenerering krävs
- Ingen tile-ändring krävs
- Exportern behöver inte ändras (synlighet styrs av style)

---

## Phase 8 - Print Composition System

**Mål**: Implementera ett print-composition-lager ovanpå kartan.

| Komponent | Status |
|-----------|--------|
| Ram (valbar, tema-styrd) | ⬜ Planerad |
| Titel | ⬜ Planerad |
| Undertitel / plats | ⬜ Planerad |
| Skala (endast vid pitch = 0) | ⬜ Planerad |
| Attribution (OSM, Copernicus) | ⬜ Planerad |

### Designprinciper

- Export-first approach
- Samma composition i Demo A och Demo B
- Tema-kompatibel
- Print-safe zones för marginaler

---

## Phase 9 - Preset Export System

**Mål**: Fördefinierade exportpresets för vanliga användningsfall.

| Preset | Status |
|--------|--------|
| A2_gallery_v1 | ⬜ Planerad |
| A3_blueprint_v1 | ⬜ Planerad |
| A2_paper_v1 | ⬜ Planerad |

### Varje preset definierar

- Theme
- Format
- DPI
- Dimensioner
- Layer-visibility
- (Demo A) pitch/bearing

### Krav

- Presets valbara i UI
- Versionsbara (t.ex. `_v1`, `_v2`)
- Reproducerbara över tid

---

## Framtida förbättringar (ej schemalagda)

### Perspektiv / Pitch

- Endast Demo A (MapLibre stödjer pitch)
- Skala döljs eller märks "Not to scale" vid pitch ≠ 0
- Användning: konstnärliga exports, previews

### Visual QA / Regression

- Referensexporter per theme + preset
- Manuell jämförelse vid ändringar
- Dokumentation av förväntade resultat

### Out of Scope (för nu)

- 3D-byggnader i Demo B (endast 2D top-down)
- Avancerad typografi
- Interaktiv annotation
- User-editable themes

---

## Implementation Order (rekommenderad)

1. **Phase 7** - UI Layer Controls (grundläggande interaktivitet)
2. **Phase 8** - Print Composition System (professionella exports)
3. **Phase 9** - Preset Export System (användarvänlighet)

---

## Changelog

### 2025-12-26

- ✅ Systemet baseline klar (Demo A + Demo B fungerar)
- ✅ Alla kritiska buggar lösta
- ✅ Dynamiska teman implementerade
- ✅ Basic layer toggles i Demo A (buildings, contours, hillshade)
- ✅ Dokumentation skapad (docs/)
