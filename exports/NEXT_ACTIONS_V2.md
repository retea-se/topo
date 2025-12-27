# NEXT_ACTIONS_V2.md

**Genererad**: 2025-12-27
**Status**: Efter QA Hygiene Implementation

---

## Sammanfattning av genomförda åtgärder

### Åtgärd 1-4 (FIX NOW) - KLARA

| # | Åtgärd | Resultat |
|---|--------|----------|
| 1 | Fixa parsing i qa_theme_validation.py | **KLAR** - 572 varningar fångade, kategoriserade i WCAG_CONTRAST och COLOR_SIMILARITY |
| 2 | Implementera preset+layout matchning | **KLAR** - 0 orphans (ner från 3) |
| 3 | EXCLUDE_PATHS för node_modules | **KLAR** - Exkluderar node_modules/, .git/, test-results/ |
| 4 | Nedgradera docs/archive/ till INFO | **KLAR** - 199 INFO (arkiv/genererat) |

### Before/After jämförelse

| Rapport | Före | Efter |
|---------|------|-------|
| DOC_LINK_AUDIT | 319 ERROR | 130 ERROR, 58 WARNING, 199 INFO |
| GOLDEN_COVERAGE | 37 WARNING, 3 orphans | 0 ERROR, 0 WARNING, 0 orphans |
| THEME_RECIPE_SUMMARY | 38x "WARNINGS:" (tomt) | 572 varningar med kategorisering |

---

## Blockers - UPPDATERAD STATUS

### Phase 12: Determinism
**Status: INGA BLOCKERS** ✓

### Phase 13: Theme Collections
**Status: INGA BLOCKERS** ✓
- qa_theme_validation.py parsing fixad
- Alla 38 themes validerade med detaljerade varningar
- 0 themes kräver åtgärd (alla varningar är WCAG/färg designval)

---

## Kvarstående åtgärder (max 10)

### FIX LATER (Nästa sprint)

| # | Åtgärd | Fil | Prioritet | Notering |
|---|--------|-----|-----------|----------|
| 1 | Fixa ~130 trasiga länkar i aktiv dokumentation | docs/*.md | MEDIUM | Verkliga broken links som bör åtgärdas |
| 2 | Tilldela tier till experimentella presets | config/export_presets/*.json | LOW | 34 presets saknar tier - acceptabelt för experimentella |
| 3 | Lägg till `--json` output i theme_recipe_tool | scripts/theme_tool/theme_recipe_tool.py | LOW | Stabilare parsing, framtidssäkrad |

### MONITORING (Inga åtgärder krävs)

| # | Område | Status | Notering |
|---|--------|--------|----------|
| 4 | WCAG-varningar i themes | Accepterat | 572 varningar = designval, inte buggar |
| 5 | Presets utan tier | Accepterat | Experimentella presets behöver inte golden |
| 6 | Archive-länkar | Accepterat | Historiskt material, behöver inte fixas |
| 7 | Generated content-länkar | Accepterat | scripts/theme_tool/outputs/ = temporärt |

---

## Policy-dokumentation

### Golden Coverage Policy
- **Tier 1 (Production)**: MUST have golden baselines
- **Tier 2 (Stable)**: SHOULD have golden baselines
- **No Tier (Experimental)**: MAY have golden baselines (INFO only)

### Doc Audit Policy
- **ERROR**: Broken links in active documentation
- **WARNING**: Unresolvable links in active documentation
- **INFO**: Issues in archive/generated content

### Theme Validation Policy
- **WCAG_CONTRAST**: Acceptabla (designval)
- **COLOR_SIMILARITY**: Acceptabla (designval)
- **EFFECT_PIPELINE**: Behöver åtgärd (inga hittades)
- **SCHEMA**: Behöver åtgärd (inga hittades)

---

## Genererade V3-rapporter

| Fil | Beskrivning |
|-----|-------------|
| exports/DOC_LINK_AUDIT_V3.md | Dokumentlänk-audit med severity-modell |
| exports/GOLDEN_COVERAGE_REPORT_V3.md | Golden coverage med tier-policy |
| exports/THEME_RECIPE_SUMMARY_V3.md | Theme-validering med kategorisering |

---

## Definition of Done - UPPFYLLD

- [x] qa_theme_validation.py parsing fixad - V3-rapporten innehåller faktiska varningsrader
- [x] Golden-rapporten har 0 false-positive orphans
- [x] Doc-audit ERROR reducerad till "aktiva docs" - archive-brus är INFO
- [x] Endast scripts/* och exports/* ändrade

---

*Genererad av QA Hygiene Implementation Agent*
