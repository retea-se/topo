# Theme Recipe Tool

Ett verktyg för att validera och dokumentera themes i topo-mappen.

## Syfte

- Validera theme.json mot schema
- Kontrollera kompatibilitet med effect pipeline (t.ex. risograph)
- Identifiera färgkonflikter och kontrastproblem
- Generera dokumentation (README-snippets)
- Rekommendera matchande export presets

## Användning

```bash
# Validera och dokumentera ett theme
python scripts/theme_tool/theme_recipe_tool.py themes/paper.json

# Ange custom output-mapp
python scripts/theme_tool/theme_recipe_tool.py themes/paper.json --output-dir outputs
```

## Output

Verktyget genererar följande filer i `scripts/theme_tool/outputs/` (eller angiven mapp):

1. **`<theme>_README.md`** - Markdown-snippet med theme-dokumentation
2. **`<theme>_presets.md`** - Lista över matchande export presets
3. **`<theme>_report.md`** - Fullständig rapport med validering + dokumentation

## Validering

### Schema-validering
- Kontrollerar required fields (`name`, `background`)
- Validerar färgformat (#RRGGBB)
- Kontrollerar layer-strukturer
- Validerar meta-data

### Effect Pipeline-validering
- Validerar risograph-effekt konfiguration
- Kontrollerar channel-struktur och färger
- Varnar för okända effekt-typer (forward compatibility)

### Färg-validering
- Kontrast-kontroll mot background (WCAG 2.1)
- Identifierar liknande färger (konflikter)
- Varnar för opacity-problem (t.ex. för låg hillshade opacity)

## Exempel

```bash
# Testa med ett befintligt theme
python scripts/theme_tool/theme_recipe_tool.py themes/riso-red-cyan.json

# Output:
# === Theme Validation: riso-red-cyan ===
# [OK] Theme is valid!
# [OK] Generated README snippet: scripts/theme_tool/outputs/riso-red-cyan_README.md
# [OK] Generated preset recommendations: scripts/theme_tool/outputs/riso-red-cyan_presets.md
# [OK] Generated full report: scripts/theme_tool/outputs/riso-red-cyan_report.md
```

## Integrering

Verktyget är fristående och påverkar inte runtime-kod. Det kan köras:
- Manuellt när nya themes skapas
- I CI/CD för automatisk validering
- Som del av QA-processen

## Begränsningar

- Genererar inte faktiska thumbnail-exports (kräver renderer-server)
- Validerar inte faktisk rendering (endast strukturell validering)
- Preset-rekommendationer baseras endast på theme-namn matchning

## Framtida förbättringar

- Support för thumbnail-export (om renderer är tillgänglig)
- Mer detaljerad färg-analys (HSL/HSV analysis)
- Export preset template-generation
- Batch-processing av alla themes

