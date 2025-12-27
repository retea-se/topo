# NEXT_ACTIONS.md

**Genererad**: 2025-12-27
**Syfte**: Prioriterade åtgärder baserat på QA-analys från tre parallella agenter.

---

## Sammanfattning av nuläge

| Område | Nuläge | Problem |
|--------|--------|---------|
| **Dokument-audit** | 319 ERROR | ~67% är brus (arkiv, placeholders, kommandon) |
| **Golden coverage** | 37 WARNING, 3 orphans | False positives pga preset+layout namnkonvention |
| **Theme validation** | 38/38 visar "[WARNING]" utan detaljer | Parsing-bugg i qa_theme_validation.py |

---

## Blockers för kommande faser

### Phase 12: Determinism
**Status: INGA BLOCKERS**
- Alla tier1 presets (`A4_Quick_v1`, `A2_Paper_v1`) har golden baselines
- Demo B (Mapnik) producerar byte-identisk output

### Phase 13: Theme Collections
**Status: 1 BLOCKER**
- [ ] **BLOCKER**: `qa_theme_validation.py` parsing-bugg gör att warnings saknar detaljer
- Utan fix kan vi inte automatisera tema-kvalitetskontroll

---

## Prioriterade åtgärder

### FIX NOW (1-2 timmar, kritisk path)

| # | Åtgärd | Fil | Effekt |
|---|--------|-----|--------|
| 1 | **Fixa parsing i qa_theme_validation.py** | `scripts/qa_theme_validation.py` | Unblocks Phase 13. Alla 38 themes får korrekta warning-detaljer. |
| 2 | **Implementera preset+layout matchning** | `scripts/qa_golden_coverage.py` | Eliminerar 3 false-positive "orphan" varningar. |
| 3 | **Lägg till EXCLUDE_PATHS för node_modules** | `scripts/qa_doc_audit.py` | Omedelbar minskning av 6 ERROR. |
| 4 | **Nedgradera docs/archive/ till INFO** | `scripts/qa_doc_audit.py` | Minskar ERROR med ~105 (33%). |

### FIX LATER (nästa sprint)

| # | Åtgärd | Fil | Effekt |
|---|--------|-----|--------|
| 5 | Lägg till placeholder-patterns (`<theme>`, `*.json`) | `scripts/qa_doc_audit.py` | Reducerar ytterligare ~20 false positives |
| 6 | Implementera tier-baserad severity i golden-audit | `scripts/qa_golden_coverage.py` | tier1=ERROR, tier2=WARNING, None=INFO |
| 7 | Lägg till `--json` output i theme_recipe_tool | `scripts/theme_tool/theme_recipe_tool.py` | Stabilare parsing, framtidssäkrad |
| 8 | Fixa shell-kommando-detektion i doc audit | `scripts/qa_doc_audit.py` | Eliminerar ~15 false positives |
| 9 | Tilldela tier till experimentella presets | `config/export_presets/*.json` | 34 presets saknar tier |
| 10 | Fixa trasiga länkar i aktiv dokumentation | `docs/*.md` | ~100 verkliga broken links |

### ACCEPT AS POLICY

| # | Beslut | Motivering |
|---|--------|------------|
| 11 | **Arkivfiler har trasiga länkar** | `docs/archive/` är historiskt material. Länkar behöver inte fixas. |
| 12 | **WCAG-varningar i themes är informativa** | Alla 38 themes har kontrast-varningar. Detta är designval, inte buggar. |
| 13 | **Presets utan tier = experimentella** | 34 presets har `tier: None`. Dessa kräver inte golden baselines. |
| 14 | **Genererade filer har instabila referenser** | `scripts/theme_tool/outputs/` innehåller temporära rapporter. |

---

## Detaljerade instruktioner

### 1. Fixa parsing i qa_theme_validation.py

**Problem**: Scriptet parsar bara header-raden `[WARNING] WARNINGS:` och missar de faktiska varningarna på efterföljande rader.

**Lösning** (ersätt rad 55-76):

```python
# --- FIX: Korrekt parsing av multiline output ---
in_error_section = False
in_warning_section = False

for line in output.split('\n'):
    stripped = line.strip()

    # Detect section headers
    if '[ERROR] ERRORS:' in line:
        in_error_section = True
        in_warning_section = False
        continue
    elif '[WARNING] WARNINGS:' in line:
        in_warning_section = True
        in_error_section = False
        continue

    # Section ends on new bracket line or status line
    if stripped.startswith('[') or stripped.startswith('==='):
        in_error_section = False
        in_warning_section = False
        continue

    # Empty lines don't end sections
    if not stripped:
        continue

    # Collect items with "- " prefix
    if stripped.startswith('- '):
        item = stripped[2:]
        if in_error_section and item:
            result['errors'].append(item)
        elif in_warning_section and item:
            result['warnings'].append(item)
# --- END FIX ---
```

### 2. Implementera preset+layout matchning

**Problem**: Golden ID `A2_Paper_v1_Minimal` matchar inte preset `A2_Paper_v1`.

**Lösning** (lägg till i GoldenCoverageAuditor-klassen):

```python
KNOWN_LAYOUTS = {
    'Classic', 'Minimal', 'Bold', 'Minimalist', 'Scientific',
    'Blueprint', 'Gallery_Print', 'Vintage_Map', 'Artistic',
    'Night_Mode', 'Heritage', 'Prestige', 'Cyberpunk'
}

def find_matching_preset(self, golden_id: str) -> Optional[str]:
    # Exakt match
    if golden_id in self.presets:
        return golden_id

    # Prefix-match: preset_id + "_" + layout
    for preset_id in self.presets.keys():
        if golden_id.startswith(preset_id + "_"):
            suffix = golden_id[len(preset_id) + 1:]
            if suffix in self.KNOWN_LAYOUTS:
                return preset_id

    return None
```

### 3-4. Uppdatera qa_doc_audit.py

Lägg till konstanter i början av filen:

```python
EXCLUDE_PATHS = ['node_modules/']
ARCHIVE_PATHS = ['docs/archive/']
GENERATED_PATHS = ['scripts/theme_tool/outputs/', 'test-results/']
```

Modifiera `scan_files()` för att skippa EXCLUDE_PATHS.
Modifiera `audit_file()` för path-baserad severity.

---

## Verifiering

Efter implementering av åtgärder 1-4, kör:

```bash
python scripts/qa_doc_audit.py
python scripts/qa_golden_coverage.py
python scripts/qa_theme_validation.py
```

**Förväntat resultat**:

| Rapport | Före | Efter |
|---------|------|-------|
| DOC_LINK_AUDIT.md | 319 ERROR | ~100 ERROR |
| GOLDEN_COVERAGE_REPORT.md | 37 WARNING, 3 orphans | ~3 WARNING, 0 orphans |
| THEME_RECIPE_SUMMARY.md | 38x "WARNINGS:" (tomt) | 38x detaljerade warnings |

---

## Leveranser från denna analys

| Fil | Innehåll |
|-----|----------|
| `exports/DOC_AUDIT_RECOMMENDATIONS.md` | Detaljerad analys av doc audit brus vs signal |
| `exports/GOLDEN_POLICY_CLARIFICATION.md` | Tier-policy och orphan-fix |
| `exports/THEME_RECIPE_SUMMARY_V2.md` | Korrekt theme-kategorisering med faktiska warnings |
| `exports/NEXT_ACTIONS.md` | Denna fil - prioriterad åtgärdslista |

---

*Genererad av QA & Systems Hygiene Agent*
