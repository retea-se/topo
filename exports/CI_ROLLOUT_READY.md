# CI Rollout Ready

**Datum**: 2025-12-27
**Status**: READY FOR MERGE
**Branch**: feature/editor-gallery-mvp

---

## Executive Summary

QA Hygiene CI-pipeline är nu implementerad och redo för produktion.

**Merge denna branch → CI är live.**

---

## Vad som är implementerat

### 1. Exit Codes i QA Scripts

| Script | Exit 0 | Exit 1 | Exit 2 |
|--------|--------|--------|--------|
| `qa_golden_coverage.py` | OK | Tier1 missing (BLOCK) | Tier2 missing (WARN) |
| `qa_theme_validation.py` | OK | Schema/pipeline error (BLOCK) | - |
| `qa_doc_audit.py` | OK | ERROR in docs | WARNING only |

**Implementation:**
- `scripts/qa_golden_coverage.py` - rad 385-394
- `scripts/qa_theme_validation.py` - rad 361-369
- `scripts/qa_doc_audit.py` - rad 451-457

### 2. GitHub Actions Workflow

**Fil:** `.github/workflows/qa-hygiene.yml`

| Job | Gate Type | Script | Blocks PR |
|-----|-----------|--------|-----------|
| `golden-coverage` | HARD GATE | `qa_golden_coverage.py` | Yes (exit 1) |
| `theme-validation` | HARD GATE | `qa_theme_validation.py` | Yes (exit 1) |
| `doc-audit` | LOG ONLY | `qa_doc_audit.py` | No (continue-on-error) |

**Triggers:**
- Pull requests till `main`
- Push till `main`

**Artifacts (30 dagars retention):**
- `golden-coverage-report` → `exports/GOLDEN_COVERAGE_REPORT_V3.md`
- `theme-validation-report` → `exports/THEME_RECIPE_SUMMARY_V3.md`
- `doc-audit-report` → `exports/DOC_LINK_AUDIT_V3.md`

### 3. Dokumentation

| Fil | Syfte |
|-----|-------|
| `exports/CI_SANITY_CHECK.md` | Expected pass/fail scenarios |
| `exports/CI_ROLLOUT_READY.md` | Denna fil - merge checklist |
| `exports/QA_HYGIENE_CI_PLAN.md` | Auktoritativ 6-fasplan |

---

## Aktiva Gates

### HARD GATES (blockerar PR merge)

1. **Golden Coverage för Tier 1**
   - Presets: `A2_Paper_v1`, `A4_Quick_v1`
   - Krav: MUST ha golden baselines
   - Exit 1 → PR blocked

2. **Theme Schema Validation**
   - Gäller: Alla 38 themes
   - Krav: Valid JSON, inga EFFECT_PIPELINE errors
   - Exit 1 → PR blocked

### LOG ONLY (blockerar INTE)

3. **Doc Link Audit**
   - Status: 130 ERROR (aktiv dokumentation)
   - `continue-on-error: true` i workflow
   - Artifact sparas för tracking

---

## Medvetet INTE aktivt än

| Funktion | Fas | Villkor för aktivering |
|----------|-----|------------------------|
| Doc audit som SOFT GATE | Fas 6 | ERROR < 20 |
| Doc audit som HARD GATE | Fas 6+ | ERROR = 0 |
| Slack/Teams notifieringar | - | Ej planerat |
| Trend-tracking dashboard | - | Ej planerat |
| Pre-commit hooks | - | Ej planerat |

---

## Förväntad CI-beteende efter merge

```
PR öppnas
    │
    ├─→ golden-coverage ──→ exit 0 ──→ ✓ PASS
    │
    ├─→ theme-validation ─→ exit 0 ──→ ✓ PASS
    │
    └─→ doc-audit ────────→ exit 1 ──→ ⚠️ LOGGED (ej blocking)
                                        │
                                        └─→ Artifact: DOC_LINK_AUDIT_V3.md

PR kan mergas ✓
```

---

## Checklista före merge

- [x] Exit codes implementerade i alla tre QA scripts
- [x] `import sys` tillagt i alla scripts
- [x] GitHub Actions workflow skapad
- [x] HARD GATE: golden-coverage (ingen continue-on-error)
- [x] HARD GATE: theme-validation (ingen continue-on-error)
- [x] LOG ONLY: doc-audit (continue-on-error: true)
- [x] Artifacts konfigurerade med 30 dagars retention
- [x] CI_SANITY_CHECK.md dokumenterar expected behavior
- [ ] **EFTER MERGE**: Konfigurera branch protection i GitHub UI

---

## Efter merge: Branch Protection Setup

I GitHub → Settings → Branches → Branch protection rules:

1. Lägg till regel för `main`
2. Enable "Require status checks to pass before merging"
3. Välj required checks:
   - `golden-coverage` ✓
   - `theme-validation` ✓
   - `doc-audit` (INTE required - LOG ONLY)

---

## Vad händer om CI failar?

### Scenario: Tier 1 golden saknas

```
1. Developer tar bort A2_Paper_v1 golden
2. golden-coverage exit 1
3. PR BLOCKED
4. Åtgärd: Återskapa golden eller ta bort tier1-status
```

### Scenario: Theme har invalid JSON

```
1. Developer introducerar syntax error i theme
2. theme-validation exit 1
3. PR BLOCKED
4. Åtgärd: Fixa JSON syntax
```

### Scenario: Ny trasig dokumentlänk

```
1. Developer lägger till trasig länk i docs/
2. doc-audit exit 1
3. PR PASSERAR (continue-on-error)
4. Artifact sparas för tracking
5. Länken fixas i separat PR (Fas 5)
```

---

## Ändringar som gjordes

### Modifierade filer

| Fil | Ändring |
|-----|---------|
| `scripts/qa_golden_coverage.py` | +import sys, +exit-code logic (rad 10, 385-394) |
| `scripts/qa_theme_validation.py` | +import sys, +exit-code logic (rad 12, 361-369) |
| `scripts/qa_doc_audit.py` | +import sys, +exit-code logic (rad 11, 451-457) |

### Nya filer

| Fil | Syfte |
|-----|-------|
| `.github/workflows/qa-hygiene.yml` | CI workflow |
| `exports/CI_SANITY_CHECK.md` | Sanity check dokumentation |
| `exports/CI_ROLLOUT_READY.md` | Denna merge-checklist |

---

## Definition of Done - UPPFYLLD

- [x] CI följer exakt 6-fasplanen (Fas 1-4 implementerat)
- [x] Golden + Theme = HARD GATE
- [x] Doc audit = LOG ONLY
- [x] Inga policyändringar
- [x] En människa kan merge:a och veta exakt vad som händer

---

**Slutsats: CI är redo. Merge denna branch för att aktivera QA Hygiene pipeline.**

---

*Genererad av CI Release Execution Agent*
*Baserad på: QA_HYGIENE_CI_PLAN.md, QA_POLICY_LOCK.md, QA_HYGIENE_FINAL_STATE.md*
