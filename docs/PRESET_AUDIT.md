# Preset Audit Tool

## Syfte

Verktyget `scripts/preset_audit.py` analyserar alla export presets för att säkerställa att de är:
- **Konsekventa**: Följer schema och logikregler
- **Rimliga**: DPI × pappersstorlek ger rimlig pixelstorlek
- **Dokumenterade**: Alla referenser (themes, bbox_presets) finns och är korrekta

Verktyget är designat för att:
- Ge snabb överblick över preset-kvalitet
- Förbereda för framtida CI-gate
- Göra presets till ett kontrollerat kontrakt, inte bara config-filer

## Installation

Ingen installation krävs utöver Python 3 standardbibliotek och `jsonschema`:

```bash
pip install jsonschema
```

Verktyget använder endast standardbiblioteket plus `jsonschema` för JSON schema-validering.

## Användning

Kör verktyget från projektets rot:

```bash
python scripts/preset_audit.py
```

Verktyget kommer:
1. Ladda alla preset-filer från `config/export_presets/*.json`
2. Validera varje preset mot:
   - JSON schema (`config/export_presets/_schema.json`)
   - Preset limits (`prep-service/config/preset_limits.json`)
   - Grundläggande logikregler
3. Generera rapporter i `docs/`:
   - `PRESET_AUDIT_REPORT.md` - Mänskligt läsbar Markdown-rapport
   - `PRESET_AUDIT_REPORT.json` - Maskinläsbar JSON-rapport

## Exit-koder

- `0` - Inga fel (kan ha varningar)
- `1` - Ett eller flera fel hittades

## Valideringar

### Schema-validering

Validerar att varje preset följer JSON schema-definitionen i `_schema.json`.

**Fel-typer:**
- Saknade obligatoriska fält
- Felaktiga datatyper
- Ogiltiga enum-värden

### Preset Limits-validering

Validerar mot `preset_limits.json`:
- **DPI-gränser**: Kontrollerar att DPI inte överstiger max_dpi för bbox_preset
- **Format-tillåtelse**: Kontrollerar att pappersformat är tillåtet för bbox_preset

### Logikregler

#### DPI × Pappersstorlek
- Beräknar total pixelantal: `(width_mm × dpi / 25.4) × (height_mm × dpi / 25.4)`
- Fel om överstiger `max_pixels_total` från preset_limits
- Varning om överstiger 50MP (möjligen långsam rendering)

#### Pappersdimensioner
- Kontrollerar att `width_mm` och `height_mm` matchar det angivna formatet (A0-A4)
- Tar hänsyn till orientation (portrait/landscape)

#### Constraints-konsistens
- Om `dpi_locked` är true: kontrollerar att faktisk DPI ligger inom `[dpi_min, dpi_max]`
- Om `format_locked` är true: kontrollerar att faktiskt format finns i `allowed_formats`

#### Externa referenser
- **bbox_preset**: Kontrollerar att värdet finns i `bbox_presets.json`
- **theme**: Kontrollerar att theme-filen finns i `themes/` (varning om saknas)

## Output-tolkning

### Markdown-rapport (`PRESET_AUDIT_REPORT.md`)

Struktur:
1. **Summary**: Totalt antal presets, fel, varningar
2. **Errors**: Blockerande fel (lista med preset-id och beskrivning)
3. **Warnings**: Misstänkta men tillåtna problem (lista med preset-id och beskrivning)
4. **Info**: Metadata och sammanfattning (antal unika themes, formats, etc.)
5. **Preset Summary**: Tabell över alla presets med status

### JSON-rapport (`PRESET_AUDIT_REPORT.json`)

Struktur:
```json
{
  "timestamp": "2025-12-27T16:57:07",
  "summary": {
    "total_presets": 38,
    "total_errors": 0,
    "total_warnings": 0,
    "total_info": 5
  },
  "errors": [...],
  "warnings": [...],
  "info": [...],
  "presets": [...]
}
```

Användbart för:
- CI/CD integration
- Automatisk analys
- Trendanalys över tid

## Designval och begränsningar

### Designval

1. **Python-baserat**: Vald eftersom projektet redan använder Python för prep-service och scripts
2. **jsonschema**: Standardbibliotek för JSON schema-validering i Python
3. **Dubbel output**: Både Markdown (mänsklig läsning) och JSON (maskinläsning)
4. **Non-blocking warnings**: Varningar blockerar inte, endast fel gör det

### Begränsningar

1. **Ingen runtime-validering**: Verktyget validerar inte att exports faktiskt fungerar, endast config-konsistens
2. **Theme-validering är begränsad**: Kontrollerar endast fil-existens, inte theme-innehåll
3. **Ingen backward-compatibility check**: Kontrollerar inte om v1 → v2 uppgraderingar är kompatibla
4. **Geografisk validering saknas**: Kontrollerar inte att bbox är rimlig eller att data finns

### Framtida förbättringar

Möjliga utökningar:
- Theme-innehållsvalidering (JSON schema för themes)
- Backward-compatibility checks
- Integration med CI/CD
- Trendanalys (jämför rapporter över tid)
- Automatiska fix-suggestions

## Exempel på användning

### Lokal utveckling

```bash
# Efter att ha ändrat presets
python scripts/preset_audit.py

# Kolla rapporten
cat docs/PRESET_AUDIT_REPORT.md
```

### CI/CD (framtida)

```yaml
# .github/workflows/preset-audit.yml
- name: Audit presets
  run: python scripts/preset_audit.py
```

### Automatiserad analys

```bash
# Parse JSON-rapporten
python -c "import json; d=json.load(open('docs/PRESET_AUDIT_REPORT.json')); print(f\"Errors: {d['summary']['total_errors']}\")"
```

## Tester

Kör test-sviten:

```bash
python scripts/test_preset_audit.py
```

Tester verifierar:
1. ✅ Giltigt preset passerar validering
2. ✅ Ogiltigt preset failar validering
3. ✅ Verktyget kan köras mot verkliga presets

## Felsökning

### "Schema file not found"
Kontrollera att `config/export_presets/_schema.json` finns.

### "Bbox presets file not found"
Kontrollera att `prep-service/config/bbox_presets.json` finns.

### "jsonschema not installed"
Installera: `pip install jsonschema`

### Unicode-fel i Windows-konsolen
Verktyget använder ASCII-safe output för kompatibilitet. Rapporterna innehåller emojis i Markdown, men console-output är ren text.

## Relaterade dokument

- `docs/PRESET_AUDIT_REPORT.md` - Senaste audit-rapport
- `docs/PRESET_LIMITS.md` - Dokumentation av preset limits
- `config/export_presets/_schema.json` - JSON schema för presets

