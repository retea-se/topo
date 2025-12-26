# Phase 9: Preset Export System — Design Specification

**Status:** DRAFT
**Version:** 1.0
**Date:** 2025-12-26

---

## 1. Preset-modell

### 1.1 Schema Definition

```json
{
  "$schema": "export_preset_v1",
  "id": "string",
  "version": "integer",
  "display_name": "string",
  "description": "string",

  "bbox_preset": "string",
  "theme": "string",

  "paper": {
    "format": "A0|A1|A2|A3|A4",
    "orientation": "portrait|landscape",
    "width_mm": "integer",
    "height_mm": "integer"
  },

  "render": {
    "dpi": "integer",
    "format": "png|pdf|svg",
    "render_mode": "print|screen"
  },

  "layers": {
    "hillshade": "boolean",
    "water": "boolean",
    "parks": "boolean",
    "roads": "boolean",
    "buildings": "boolean",
    "contours": "boolean"
  },

  "composition": {
    "title": "string|null",
    "subtitle": "string|null",
    "show_attribution": "boolean",
    "show_scale_bar": "boolean"
  },

  "constraints": {
    "dpi_locked": "boolean",
    "dpi_min": "integer",
    "dpi_max": "integer",
    "format_locked": "boolean",
    "allowed_formats": ["png", "pdf", "svg"],
    "layers_locked": "boolean",
    "bbox_locked": "boolean",
    "theme_locked": "boolean"
  },

  "meta": {
    "created": "ISO-date",
    "author": "string",
    "use_case": "string",
    "tags": ["string"]
  }
}
```

### 1.2 Fältbeskrivning

| Fält | Typ | Krav | Beskrivning |
|------|-----|------|-------------|
| `id` | string | required | Unikt ID, format: `{Format}_{Theme}_v{N}` |
| `version` | integer | required | Heltal, inkrementeras vid breaking changes |
| `display_name` | string | required | Visningsnamn i UI |
| `description` | string | optional | Kort beskrivning av användningsområde |
| `bbox_preset` | string | required | Referens till geografiskt preset |
| `theme` | string | required | Tema-namn (måste finnas i `/themes/`) |
| `paper.format` | enum | required | ISO-format: A0, A1, A2, A3, A4 |
| `paper.orientation` | enum | required | `portrait` eller `landscape` |
| `render.dpi` | integer | required | Default DPI (72-600) |
| `render.format` | enum | required | `png`, `pdf`, eller `svg` |
| `constraints.*_locked` | boolean | required | Styr vad användaren kan justera |

### 1.3 Versionsstrategi

**Format:** `{Beskrivning}_v{N}` där N är heltal.

```
A2_Paper_v1      → Original version
A2_Paper_v2      → Breaking change (ny default, annat beteende)
A2_Paper_v1.1    → FÖRBJUDET (endast heltal)
```

**Regel:** Samma preset-ID + version → identiskt resultat (byte-för-byte i Demo B).

**Deprecation-markering:**
```json
{
  "id": "A2_Paper_v1",
  "deprecated": true,
  "superseded_by": "A2_Paper_v2",
  "deprecation_date": "2025-06-01"
}
```

---

## 2. Preset-exempel (4 stycken)

### 2.1 A2_Paper_v1 — Standard väggkarta

```json
{
  "$schema": "export_preset_v1",
  "id": "A2_Paper_v1",
  "version": 1,
  "display_name": "A2 Papperskarta",
  "description": "Klassisk topografisk karta för väggupphängning",

  "bbox_preset": "stockholm_core",
  "theme": "paper",

  "paper": {
    "format": "A2",
    "orientation": "landscape",
    "width_mm": 594,
    "height_mm": 420
  },

  "render": {
    "dpi": 150,
    "format": "png",
    "render_mode": "print"
  },

  "layers": {
    "hillshade": true,
    "water": true,
    "parks": true,
    "roads": true,
    "buildings": true,
    "contours": true
  },

  "composition": {
    "title": null,
    "subtitle": null,
    "show_attribution": true,
    "show_scale_bar": false
  },

  "constraints": {
    "dpi_locked": false,
    "dpi_min": 72,
    "dpi_max": 300,
    "format_locked": false,
    "allowed_formats": ["png", "pdf"],
    "layers_locked": false,
    "bbox_locked": true,
    "theme_locked": true
  },

  "meta": {
    "created": "2025-01-15",
    "author": "system",
    "use_case": "wall_print",
    "tags": ["print", "paper", "a2", "standard"]
  }
}
```

### 2.2 A3_Blueprint_v1 — Teknisk ritning

```json
{
  "$schema": "export_preset_v1",
  "id": "A3_Blueprint_v1",
  "version": 1,
  "display_name": "A3 Blueprint",
  "description": "Teknisk stil för presentation och planering",

  "bbox_preset": "stockholm_core",
  "theme": "blueprint",

  "paper": {
    "format": "A3",
    "orientation": "landscape",
    "width_mm": 420,
    "height_mm": 297
  },

  "render": {
    "dpi": 150,
    "format": "pdf",
    "render_mode": "print"
  },

  "layers": {
    "hillshade": false,
    "water": true,
    "parks": false,
    "roads": true,
    "buildings": true,
    "contours": true
  },

  "composition": {
    "title": null,
    "subtitle": null,
    "show_attribution": true,
    "show_scale_bar": false
  },

  "constraints": {
    "dpi_locked": true,
    "dpi_min": 150,
    "dpi_max": 150,
    "format_locked": true,
    "allowed_formats": ["pdf"],
    "layers_locked": true,
    "bbox_locked": true,
    "theme_locked": true
  },

  "meta": {
    "created": "2025-01-15",
    "author": "system",
    "use_case": "technical_presentation",
    "tags": ["print", "blueprint", "a3", "technical"]
  }
}
```

### 2.3 A1_Terrain_v1 — Stor terrängkarta

```json
{
  "$schema": "export_preset_v1",
  "id": "A1_Terrain_v1",
  "version": 1,
  "display_name": "A1 Terrängkarta",
  "description": "Stor karta med fokus på terräng och höjddata",

  "bbox_preset": "stockholm_wide",
  "theme": "terrain",

  "paper": {
    "format": "A1",
    "orientation": "portrait",
    "width_mm": 594,
    "height_mm": 841
  },

  "render": {
    "dpi": 150,
    "format": "png",
    "render_mode": "print"
  },

  "layers": {
    "hillshade": true,
    "water": true,
    "parks": true,
    "roads": false,
    "buildings": false,
    "contours": true
  },

  "composition": {
    "title": null,
    "subtitle": null,
    "show_attribution": true,
    "show_scale_bar": false
  },

  "constraints": {
    "dpi_locked": false,
    "dpi_min": 72,
    "dpi_max": 200,
    "format_locked": false,
    "allowed_formats": ["png", "pdf"],
    "layers_locked": false,
    "bbox_locked": true,
    "theme_locked": false
  },

  "meta": {
    "created": "2025-01-15",
    "author": "system",
    "use_case": "terrain_analysis",
    "tags": ["print", "terrain", "a1", "hillshade"]
  }
}
```

### 2.4 A4_Quick_v1 — Snabb skrivbordsutskrift

```json
{
  "$schema": "export_preset_v1",
  "id": "A4_Quick_v1",
  "version": 1,
  "display_name": "A4 Snabbutskrift",
  "description": "Kompakt karta för skrivbordsutskrift",

  "bbox_preset": "stockholm_core",
  "theme": "paper",

  "paper": {
    "format": "A4",
    "orientation": "portrait",
    "width_mm": 210,
    "height_mm": 297
  },

  "render": {
    "dpi": 150,
    "format": "png",
    "render_mode": "print"
  },

  "layers": {
    "hillshade": true,
    "water": true,
    "parks": true,
    "roads": true,
    "buildings": true,
    "contours": false
  },

  "composition": {
    "title": null,
    "subtitle": null,
    "show_attribution": true,
    "show_scale_bar": false
  },

  "constraints": {
    "dpi_locked": false,
    "dpi_min": 72,
    "dpi_max": 300,
    "format_locked": false,
    "allowed_formats": ["png", "pdf"],
    "layers_locked": false,
    "bbox_locked": true,
    "theme_locked": false
  },

  "meta": {
    "created": "2025-01-15",
    "author": "system",
    "use_case": "quick_print",
    "tags": ["print", "paper", "a4", "quick"]
  }
}
```

---

## 3. UI-integration

### 3.1 Demo A — Preset Quick Select

**Placering:** Ny sektion ovanför befintliga kontroller i editor.

**Komponenter:**
```
┌─────────────────────────────────────┐
│ EXPORT PRESETS                      │
├─────────────────────────────────────┤
│ [▼ Välj preset...]                  │
│                                     │
│ ○ A2 Papperskarta                   │
│ ○ A3 Blueprint                      │
│ ○ A1 Terrängkarta                   │
│ ○ A4 Snabbutskrift                  │
│                                     │
│ ─────────────────────────           │
│ ○ Manuella inställningar            │
├─────────────────────────────────────┤
│ [Tillämpa preset]                   │
└─────────────────────────────────────┘
```

**Beteende vid preset-val:**
1. Alla fält populeras enligt preset
2. Låsta fält (`*_locked: true`) visas disabled/grayed
3. Justerbara fält förblir editerbara
4. Statusindikator: "Preset: A2_Paper_v1"

**Beteende vid manuell ändring:**
- Om användaren ändrar ett olåst fält → status ändras till "A2_Paper_v1 (modifierad)"
- Filnamn inkluderar `_modified` suffix

### 3.2 Editor — Start from Preset

**Integration:**
- Preset-val görs INNAN export-panelen öppnas
- Alternativ: "Starta med preset" / "Starta tomt"

**Flöde:**
```
Editor startar
    ↓
[Välj preset] eller [Manuellt]
    ↓
Preset → Fält populeras, låsningar appliceras
Manuellt → Alla fält öppna
    ↓
Export-konfiguration
    ↓
Render
```

### 3.3 Låsning vs Justering

| Constraint | Låst (true) | Olåst (false) |
|------------|-------------|---------------|
| `dpi_locked` | DPI-slider disabled | DPI justerbar inom min/max |
| `format_locked` | Format-dropdown disabled | Format valbart från allowed_formats |
| `layers_locked` | Checkboxar disabled | Lager kan togglas |
| `bbox_locked` | Område ej ändringsbart | Kan välja annat bbox_preset |
| `theme_locked` | Tema-dropdown disabled | Tema valbart |

### 3.4 Visuell indikation

```css
/* Låst fält */
.preset-locked {
  opacity: 0.6;
  pointer-events: none;
  background: #f0f0f0;
}

/* Låst-ikon */
.preset-locked::after {
  content: "🔒";
  margin-left: 4px;
}
```

---

## 4. Backend & Validering

### 4.1 Nya endpoints

**GET /api/export-presets**
```json
{
  "presets": [
    {
      "id": "A2_Paper_v1",
      "display_name": "A2 Papperskarta",
      "description": "...",
      "version": 1,
      "deprecated": false
    }
  ]
}
```

**GET /api/export-presets/{id}**
```json
{
  "preset": { /* full preset-objekt */ }
}
```

**POST /api/validate-preset**
```json
// Request
{
  "preset_id": "A2_Paper_v1",
  "overrides": {
    "dpi": 200
  }
}

// Response
{
  "valid": true,
  "warnings": [],
  "effective_config": { /* merged preset + overrides */ }
}
```

### 4.2 Validerings-logik

**Steg 1: Ladda preset**
```python
def load_export_preset(preset_id: str) -> dict:
    path = f"config/export_presets/{preset_id}.json"
    if not exists(path):
        raise PresetNotFoundError(preset_id)
    return json.load(open(path))
```

**Steg 2: Validera overrides mot constraints**
```python
def validate_overrides(preset: dict, overrides: dict) -> ValidationResult:
    errors = []
    warnings = []

    constraints = preset["constraints"]

    # DPI
    if "dpi" in overrides:
        if constraints["dpi_locked"]:
            errors.append("DPI kan inte ändras för detta preset")
        elif not (constraints["dpi_min"] <= overrides["dpi"] <= constraints["dpi_max"]):
            errors.append(f"DPI måste vara {constraints['dpi_min']}-{constraints['dpi_max']}")

    # Format
    if "format" in overrides:
        if constraints["format_locked"]:
            errors.append("Format kan inte ändras för detta preset")
        elif overrides["format"] not in constraints["allowed_formats"]:
            errors.append(f"Format måste vara ett av: {constraints['allowed_formats']}")

    # Layers
    if "layers" in overrides and constraints["layers_locked"]:
        errors.append("Lager kan inte ändras för detta preset")

    return ValidationResult(
        valid=len(errors) == 0,
        errors=errors,
        warnings=warnings
    )
```

**Steg 3: Merge med befintlig bbox-validering**
```python
def validate_preset_render(preset_id: str, overrides: dict) -> ValidationResult:
    preset = load_export_preset(preset_id)

    # Validera overrides
    override_result = validate_overrides(preset, overrides)
    if not override_result.valid:
        return override_result

    # Merge config
    effective = merge_preset_with_overrides(preset, overrides)

    # Validera mot befintlig bbox-logik
    bbox_result = validate_render_request(
        bbox_preset=effective["bbox_preset"],
        dpi=effective["render"]["dpi"],
        width_mm=effective["paper"]["width_mm"],
        height_mm=effective["paper"]["height_mm"]
    )

    return bbox_result
```

### 4.3 Felmeddelanden (copy)

| Situation | Meddelande |
|-----------|------------|
| Låst fält ändrat | "DPI är låst för preset 'A3 Blueprint' och kan inte ändras." |
| DPI utanför range | "DPI 400 överskrider max 300 för detta preset. Välj ett värde mellan 72 och 300." |
| Format ej tillåtet | "SVG-format stöds inte för detta preset. Tillgängliga format: PNG, PDF." |
| Preset deprecated | "Preset 'A2_Paper_v1' är utfasat. Använd 'A2_Paper_v2' istället." |
| Pixelgräns överskriden | "Den resulterande bilden (150 megapixel) överskrider maxgränsen (100 megapixel). Minska DPI eller pappersformat." |

### 4.4 Integration med befintlig validate_render_request()

```python
# Befintlig funktion utökas
def validate_render_request(
    bbox_preset: str = None,
    dpi: int = 150,
    width_mm: int = 420,
    height_mm: int = 594,
    export_preset: str = None,      # NY parameter
    overrides: dict = None          # NY parameter
) -> ValidationResult:

    # Om export_preset anges, ladda och merge
    if export_preset:
        preset = load_export_preset(export_preset)
        override_result = validate_overrides(preset, overrides or {})
        if not override_result.valid:
            return override_result

        effective = merge_preset_with_overrides(preset, overrides or {})
        bbox_preset = effective["bbox_preset"]
        dpi = effective["render"]["dpi"]
        width_mm = effective["paper"]["width_mm"]
        height_mm = effective["paper"]["height_mm"]

    # Fortsätt med befintlig logik...
```

---

## 5. Export & Filnamn

### 5.1 Filnamnskonvention

**Format:**
```
{bbox_preset}__{export_preset}__{dpi}dpi.{format}
```

**Exempel:**
```
stockholm_core__A2_Paper_v1__150dpi.png
stockholm_core__A2_Paper_v1_modified__200dpi.png
stockholm_wide__A1_Terrain_v1__150dpi.pdf
```

**Regler:**
- Dubbla understreck (`__`) separerar komponenter
- `_modified` suffix om overrides använts
- Ingen timestamp i standardnamn (reproducerbarhet)
- Timestamp kan läggas till av användare vid behov

### 5.2 Metadata i export

**PNG:** EXIF/tEXt chunks
```
preset_id: A2_Paper_v1
preset_version: 1
rendered_at: 2025-01-15T14:32:00Z
renderer: demo-b-mapnik
bbox: [17.9, 59.3, 18.1, 59.35]
dpi: 150
theme: paper
```

**PDF:** XMP metadata
```xml
<rdf:Description>
  <topo:preset_id>A2_Paper_v1</topo:preset_id>
  <topo:preset_version>1</topo:preset_version>
  <topo:rendered_at>2025-01-15T14:32:00Z</topo:rendered_at>
</rdf:Description>
```

### 5.3 Reproducerbarhet

**Garanti:** Samma export_preset + samma geodata → identiska bytes (Demo B).

**Krav:**
1. Alla renderingsparametrar sparas i preset
2. Inga slumpmässiga element i rendering
3. Demo B (Mapnik) är deterministisk pipeline
4. Geodata-version noteras (ej del av preset)

**Verifiering:**
```bash
# Kör samma export två gånger
./export.sh A2_Paper_v1 > export1.png
./export.sh A2_Paper_v1 > export2.png

# Jämför checksums
sha256sum export1.png export2.png
# Ska ge identiska hashar
```

---

## 6. Filstruktur

### 6.1 Presets-katalog

```
config/
└── export_presets/
    ├── _schema.json           # JSON Schema för validering
    ├── A2_Paper_v1.json
    ├── A3_Blueprint_v1.json
    ├── A1_Terrain_v1.json
    └── A4_Quick_v1.json
```

### 6.2 Schema-fil

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "export_preset_v1",
  "type": "object",
  "required": ["id", "version", "bbox_preset", "theme", "paper", "render", "layers", "constraints"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^[A-Z][A-Za-z0-9]+_[A-Za-z]+_v[0-9]+$"
    },
    "version": {
      "type": "integer",
      "minimum": 1
    }
    // ... resten av schema
  }
}
```

---

## 7. Definition of Done

### 7.1 Implementationskriterier

- [ ] **Minst 4 presets implementerade och validerade**
  - A2_Paper_v1
  - A3_Blueprint_v1
  - A1_Terrain_v1
  - A4_Quick_v1

- [ ] **Backend-endpoints fungerar**
  - GET /api/export-presets
  - GET /api/export-presets/{id}
  - POST /api/validate-preset

- [ ] **Validering integrerad**
  - Preset-validering fungerar
  - Override-validering fungerar
  - Felmeddelanden är tydliga

- [ ] **UI-integration klar**
  - Preset-dropdown i Demo A editor
  - Låsning av fält fungerar visuellt
  - Statusindikator visar aktivt preset

- [ ] **Filnamn följer konvention**
  - Format: `{bbox}__{preset}__{dpi}dpi.{format}`
  - Modified-suffix vid overrides

### 7.2 Kvalitetskriterier

- [ ] **Reproducerbarhet verifierad**
  - Samma preset → identisk output i Demo B (checksumma)
  - Test: kör export 3 gånger, jämför SHA256

- [ ] **Presets är dokumenterade**
  - Varje preset har description
  - README i export_presets/
  - Schema-validering passerar

- [ ] **QA kan verifiera automatiskt**
  - Script: `scripts/qa_preset_export.js`
  - Testar alla 4 presets
  - Verifierar output finns och är valid

### 7.3 Dokumentationskriterier

- [ ] PHASE9_SPEC.md uppdaterad med faktisk implementation
- [ ] API-dokumentation för nya endpoints
- [ ] Presets listade i docs/STATUS.md

---

## 8. Avgränsningar

### 8.1 Vad som INTE ingår i Phase 9

| Exkluderat | Anledning |
|------------|-----------|
| Nya teman | Teman är separat arbete, presets använder befintliga |
| Ny layout-motor | Ingen ram/marginal-rendering, endast kart-canvas |
| Editor-funktionalitet | Editor (Phase 10) är DONE, ingen utökning |
| Användardefinierade presets | Endast systemdefinierade, ingen UI för att skapa |
| Pitch/bearing i presets | Demo A-specifikt, ej för print |
| Custom bbox i presets | Presets låses till befintliga bbox_presets |
| Batch-export | En export åt gången |
| Export-historik/logg | Ingen persistent historik |
| Preset-favoritering | Ingen användarpreferens-lagring |

### 8.2 Framtida faser (ej nu)

- Phase 11: Användardefinierade presets
- Phase 12: Batch-export
- Phase 13: Preset-mallar med variabler

---

## 9. Implementation Roadmap

### 9.1 Steg 1: Backend (2 delar)

**1a. Preset-laddning**
- Skapa `config/export_presets/` katalog
- Implementera preset-loader
- Lägg till 4 preset-filer

**1b. Validering**
- Utöka validate_render_request()
- Lägg till /api/export-presets endpoints
- Lägg till /api/validate-preset endpoint

### 9.2 Steg 2: Frontend

**2a. Preset-selector**
- Lägg till dropdown i editor.html
- Implementera preset-fetch i editor.js
- Applicera preset-värden på fält

**2b. Låsning**
- Läs constraints från preset
- Disable/enable fält baserat på låsning
- Visa låst-ikoner

### 9.3 Steg 3: Export-logik

**3a. Filnamn**
- Uppdatera filnamnsgeneration
- Lägg till preset-id i namn
- Hantera modified-suffix

**3b. Metadata**
- Lägg till preset-info i PNG metadata
- Lägg till preset-info i PDF XMP

### 9.4 Steg 4: QA & Dokumentation

**4a. Automatiserad test**
- Skapa qa_preset_export.js
- Testa alla presets
- Verifiera reproducerbarhet

**4b. Dokumentation**
- Uppdatera STATUS.md
- Skapa preset README
- Uppdatera API-docs

---

## 10. Tekniska detaljer

### 10.1 Preset-loader (Python)

```python
# demo-b/renderer/src/preset_loader.py

import json
import os
from pathlib import Path

PRESET_DIR = Path("/app/config/export_presets")

def list_presets() -> list[dict]:
    """Lista alla tillgängliga presets (summary)."""
    presets = []
    for f in PRESET_DIR.glob("*.json"):
        if f.name.startswith("_"):
            continue
        with open(f) as fp:
            p = json.load(fp)
            presets.append({
                "id": p["id"],
                "display_name": p["display_name"],
                "description": p.get("description", ""),
                "version": p["version"],
                "deprecated": p.get("deprecated", False)
            })
    return presets

def get_preset(preset_id: str) -> dict:
    """Hämta ett specifikt preset."""
    path = PRESET_DIR / f"{preset_id}.json"
    if not path.exists():
        raise ValueError(f"Preset not found: {preset_id}")
    with open(path) as fp:
        return json.load(fp)

def merge_with_overrides(preset: dict, overrides: dict) -> dict:
    """Merge preset med användarens overrides."""
    result = json.loads(json.dumps(preset))  # Deep copy

    if "dpi" in overrides:
        result["render"]["dpi"] = overrides["dpi"]
    if "format" in overrides:
        result["render"]["format"] = overrides["format"]
    if "layers" in overrides:
        result["layers"].update(overrides["layers"])

    return result
```

### 10.2 Frontend preset-fetch (JavaScript)

```javascript
// demo-a/web/public/editor.js

async function loadExportPresets() {
    const response = await fetch('/api/export-presets');
    const data = await response.json();
    return data.presets;
}

async function applyPreset(presetId) {
    const response = await fetch(`/api/export-presets/${presetId}`);
    const { preset } = await response.json();

    // Applicera värden
    document.getElementById('theme-select').value = preset.theme;
    document.getElementById('paper-size').value = preset.paper.format;
    document.getElementById('dpi-slider').value = preset.render.dpi;
    document.getElementById('format-select').value = preset.render.format;

    // Applicera lager
    for (const [layer, enabled] of Object.entries(preset.layers)) {
        const checkbox = document.getElementById(`layer-${layer}`);
        if (checkbox) checkbox.checked = enabled;
    }

    // Applicera låsningar
    applyConstraints(preset.constraints);

    // Uppdatera status
    currentPreset = preset;
    updatePresetStatus(preset.id);
}

function applyConstraints(constraints) {
    // DPI
    const dpiSlider = document.getElementById('dpi-slider');
    dpiSlider.disabled = constraints.dpi_locked;
    dpiSlider.min = constraints.dpi_min;
    dpiSlider.max = constraints.dpi_max;

    // Format
    const formatSelect = document.getElementById('format-select');
    formatSelect.disabled = constraints.format_locked;
    // Filtrera options till allowed_formats

    // Tema
    const themeSelect = document.getElementById('theme-select');
    themeSelect.disabled = constraints.theme_locked;

    // Lager
    const layerCheckboxes = document.querySelectorAll('.layer-checkbox');
    layerCheckboxes.forEach(cb => {
        cb.disabled = constraints.layers_locked;
    });
}
```

### 10.3 QA-script

```javascript
// scripts/qa_preset_export.js

const PRESETS = [
    'A2_Paper_v1',
    'A3_Blueprint_v1',
    'A1_Terrain_v1',
    'A4_Quick_v1'
];

async function testPreset(presetId) {
    console.log(`Testing preset: ${presetId}`);

    // 1. Validate preset
    const validateRes = await fetch('/api/validate-preset', {
        method: 'POST',
        body: JSON.stringify({ preset_id: presetId })
    });
    const validation = await validateRes.json();

    if (!validation.valid) {
        throw new Error(`Preset validation failed: ${validation.errors}`);
    }

    // 2. Export
    const exportRes = await fetch('/api/render', {
        method: 'POST',
        body: JSON.stringify({ export_preset: presetId })
    });

    if (!exportRes.ok) {
        throw new Error(`Export failed: ${exportRes.status}`);
    }

    // 3. Verify file exists and has content
    const blob = await exportRes.blob();
    if (blob.size < 1000) {
        throw new Error(`Export too small: ${blob.size} bytes`);
    }

    console.log(`✓ ${presetId}: ${blob.size} bytes`);
    return true;
}

async function runAllTests() {
    let passed = 0;
    let failed = 0;

    for (const preset of PRESETS) {
        try {
            await testPreset(preset);
            passed++;
        } catch (e) {
            console.error(`✗ ${preset}: ${e.message}`);
            failed++;
        }
    }

    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    return failed === 0;
}
```

---

## Appendix A: Komplett preset-schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "export_preset_v1",
  "title": "Export Preset",
  "type": "object",
  "required": [
    "id", "version", "display_name", "bbox_preset",
    "theme", "paper", "render", "layers", "constraints"
  ],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^[A-Z][A-Za-z0-9_]+_v[0-9]+$",
      "description": "Unikt preset-ID"
    },
    "version": {
      "type": "integer",
      "minimum": 1,
      "description": "Preset-version (heltal)"
    },
    "display_name": {
      "type": "string",
      "minLength": 1,
      "description": "Visningsnamn i UI"
    },
    "description": {
      "type": "string",
      "description": "Beskrivning av preset"
    },
    "deprecated": {
      "type": "boolean",
      "default": false
    },
    "superseded_by": {
      "type": "string",
      "description": "ID för ersättande preset"
    },
    "bbox_preset": {
      "type": "string",
      "enum": ["stockholm_core", "stockholm_wide", "svealand"],
      "description": "Geografiskt område"
    },
    "theme": {
      "type": "string",
      "description": "Tema-namn"
    },
    "paper": {
      "type": "object",
      "required": ["format", "orientation", "width_mm", "height_mm"],
      "properties": {
        "format": {
          "type": "string",
          "enum": ["A0", "A1", "A2", "A3", "A4"]
        },
        "orientation": {
          "type": "string",
          "enum": ["portrait", "landscape"]
        },
        "width_mm": {
          "type": "integer",
          "minimum": 100,
          "maximum": 1200
        },
        "height_mm": {
          "type": "integer",
          "minimum": 100,
          "maximum": 1200
        }
      }
    },
    "render": {
      "type": "object",
      "required": ["dpi", "format", "render_mode"],
      "properties": {
        "dpi": {
          "type": "integer",
          "minimum": 72,
          "maximum": 600
        },
        "format": {
          "type": "string",
          "enum": ["png", "pdf", "svg"]
        },
        "render_mode": {
          "type": "string",
          "enum": ["print", "screen"]
        }
      }
    },
    "layers": {
      "type": "object",
      "properties": {
        "hillshade": { "type": "boolean" },
        "water": { "type": "boolean" },
        "parks": { "type": "boolean" },
        "roads": { "type": "boolean" },
        "buildings": { "type": "boolean" },
        "contours": { "type": "boolean" }
      }
    },
    "composition": {
      "type": "object",
      "properties": {
        "title": { "type": ["string", "null"] },
        "subtitle": { "type": ["string", "null"] },
        "show_attribution": { "type": "boolean" },
        "show_scale_bar": { "type": "boolean" }
      }
    },
    "constraints": {
      "type": "object",
      "required": [
        "dpi_locked", "dpi_min", "dpi_max",
        "format_locked", "allowed_formats",
        "layers_locked", "bbox_locked", "theme_locked"
      ],
      "properties": {
        "dpi_locked": { "type": "boolean" },
        "dpi_min": { "type": "integer" },
        "dpi_max": { "type": "integer" },
        "format_locked": { "type": "boolean" },
        "allowed_formats": {
          "type": "array",
          "items": { "type": "string", "enum": ["png", "pdf", "svg"] }
        },
        "layers_locked": { "type": "boolean" },
        "bbox_locked": { "type": "boolean" },
        "theme_locked": { "type": "boolean" }
      }
    },
    "meta": {
      "type": "object",
      "properties": {
        "created": { "type": "string", "format": "date" },
        "author": { "type": "string" },
        "use_case": { "type": "string" },
        "tags": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    }
  }
}
```

---

*End of specification*
