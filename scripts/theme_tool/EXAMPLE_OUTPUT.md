# Theme Recipe Tool - Exempel Output

Detta dokument visar exempel på output från theme recipe tool för olika themes.

## Exempel 1: Paper Theme

### Kommando
```bash
python scripts/theme_tool/theme_recipe_tool.py themes/paper.json
```

### Output: paper_README.md
```markdown
### Paper

- **Background**: `#faf8f5`
- **Intended Scale**: A2
- **Label Density**: low
- **Mood**: calm

**Layers:**
- `water`: fill: #cce0ed, stroke: #94b8cc
- `parks`: fill: #dcebd2, stroke: #b0cca0
- `roads`: stroke: #707070
- `buildings`: fill: #c8c8c8, stroke: #808080
- `contours`: stroke: #908a85

**Theme file**: `themes/paper.json`
```

### Output: paper_presets.md
```markdown
**Rekommenderade Export Presets:**

- **A2 Papperskarta** (`A2_Paper_v1`)
  - Paper: A2 landscape
  - Klassisk topografisk karta for vaggupphanging
  - File: `A2_Paper_v1.json`
- **A4 Snabbutskrift** (`A4_Quick_v1`)
  - Paper: A4 portrait
  - Kompakt karta for skrivbordsutskrift
  - File: `A4_Quick_v1.json`
```

---

## Exempel 2: Risograph Theme (med Effects)

### Kommando
```bash
python scripts/theme_tool/theme_recipe_tool.py themes/riso-red-cyan.json
```

### Output: riso-red-cyan_README.md
```markdown
### Riso Red-Cyan

- **Background**: `#f5f0e6`
- **Intended Scale**: A2
- **Label Density**: none
- **Mood**: artistic_print

**Layers:**
- `water`: fill: #3a5a7c, stroke: #2a4a6c
- `parks`: fill: #6b8b6b, stroke: #4a6a4a
- `roads`: stroke: #2a2a2a
- `buildings`: fill: #4a4a4a, stroke: #2a2a2a
- `contours`: stroke: #5a5a5a

**Effects:**
- Risograph: 2 channel(s)
  - Channel 1: #e84855
  - Channel 2: #2d9cdb

**Theme file**: `themes/riso-red-cyan.json`
```

### Validering: Warnings
- Moderate contrast: effects.risograph.channels[0].color vs background (ratio: 3.37)
- Very similar colors: parks.fill and effects.risograph.channels[0].color (ratio: 1.01)
- Very similar colors: effects.risograph.channels[0].color and effects.risograph.channels[1].color (ratio: 1.26)

---

## Exempel 3: Japandi Theme

### Kommando
```bash
python scripts/theme_tool/theme_recipe_tool.py themes/japandi.json
```

### Validering: Warnings (exempel)
- Low contrast: water.fill vs background (ratio: 1.16)
- Low contrast: parks.fill vs background (ratio: 1.14)
- Very similar colors: water.fill and parks.fill (ratio: 1.02)

### Användning

Validerings-warnings är informativa och indikerar potentiella problem med:
- **Low contrast**: Färger som kan vara svåra att skilja från bakgrunden
- **Moderate contrast**: Acceptabel kontrast men kan förbättras
- **Very similar colors**: Färger som är mycket lika och kan vara svåra att skilja

Dessa warnings är inte nödvändigtvis problem - mjuka, subtila teman med låg kontrast kan vara avsiktliga designval.

