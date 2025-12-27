# QA Hygiene CI Plan

**Version**: 1.0
**Datum**: 2025-12-27

## Overgripande arkitektur

CI-pipeline struktureras i tre lager baserat pa gating-behov:

```
PR-driven pipeline:
  +------------------+     +------------------+     +------------------+
  |  HARD GATE       | --> |  SOFT GATE       | --> |  LOG ONLY        |
  |  (Blockerar PR)  |     |  (Varning)       |     |  (Artifact only) |
  +------------------+     +------------------+     +------------------+
  - Golden tier1 errors    - Golden tier2 warns   - Experimental presets
  - Theme schema errors    - Doc link warnings    - Archive doc links
                                                   - WCAG/color warnings
```

**Princip**: Endast produktionskritiska fel blockerar merge. Design-val och experimentella features loggas men blockerar inte.

## Job-struktur

### Job 1: golden-coverage-check
- **Script**: `scripts/qa_golden_coverage.py`
- **Trigger**: PR till main, push till main
- **Gate type**: HARD (tier1) / SOFT (tier2) / LOG (experimental)
- **Exit codes**:
  - `0`: Inga tier1/tier2-problem
  - `1`: Tier1-preset saknar golden (HARD FAIL)
  - `2`: Tier2-preset saknar golden (WARNING)
- **Threshold**:
  - ERROR count > 0 for tier1 = EXIT 1
  - WARNING count > 0 for tier2 = EXIT 2 (non-blocking)
  - INFO ignoreras helt

**Implementation kraver**: Script maste uppdateras med exit-codes.

```python
# Forslag till exit-logik i qa_golden_coverage.py
if error_count > 0:
    sys.exit(1)  # Tier1 problem - blockerar
elif warning_count > 0:
    sys.exit(2)  # Tier2 problem - varning
else:
    sys.exit(0)  # OK
```

---

### Job 2: theme-validation
- **Script**: `scripts/qa_theme_validation.py`
- **Trigger**: PR till main, push till main
- **Gate type**: HARD (schema errors) / LOG (WCAG/color warnings)
- **Exit codes**:
  - `0`: Inga schema-errors
  - `1`: Theme har schema-errors eller EFFECT_PIPELINE-varningar
  - `0`: WCAG_CONTRAST och COLOR_SIMILARITY ignoreras (exit 0)
- **Threshold**:
  - Errors > 0 = EXIT 1
  - EFFECT_PIPELINE warnings > 0 = EXIT 1
  - WCAG_CONTRAST, COLOR_SIMILARITY = Ignoreras (designval)

**Implementation kraver**: Script maste uppdateras med exit-codes.

```python
# Forslag till exit-logik i qa_theme_validation.py
action_required = sum(1 for t in results if needs_action(t))
if action_required > 0:
    sys.exit(1)
else:
    sys.exit(0)
```

---

### Job 3: doc-link-audit
- **Script**: `scripts/qa_doc_audit.py`
- **Trigger**: Scheduled (nattlig), PR till main (optional)
- **Gate type**: SOFT (active docs) / LOG (archive/generated)
- **Exit codes**:
  - `0`: Inga ERROR i aktiv dokumentation
  - `1`: ERROR i aktiv dokumentation (ej archive/generated)
  - `2`: Endast WARNING i aktiv dokumentation
- **Threshold**:
  - ERROR i aktiv dokumentation > 0 = EXIT 1 (soft gate)
  - ERROR i archive/generated = Ignoreras (INFO)
  - WARNING = EXIT 2 (log only)

**Nuvarande tillstand**: 130 ERROR - DETTA BLOCKERAR!

**Stegvis plan**:
1. Fas 1: Kors som LOG ONLY tills ERROR = 0
2. Fas 2: Aktiveras som SOFT GATE nar ERROR < 20
3. Fas 3: Aktiveras som HARD GATE nar ERROR = 0

**Implementation kraver**: Script maste uppdateras med exit-codes.

```python
# Forslag till exit-logik i qa_doc_audit.py
# Raekna endast errors som INTE ar i archive/generated
active_errors = [i for i in issues if i['type'] == 'ERROR']
if len(active_errors) > 0:
    sys.exit(1)
elif warning_count > 0:
    sys.exit(2)
else:
    sys.exit(0)
```

---

## Gating-regler

### Hard Gates (blockerar merge)

| Villkor | Script | Exit Code | Beskrivning |
|---------|--------|-----------|-------------|
| Tier1 golden missing | qa_golden_coverage.py | 1 | Produktions-preset MASTE ha golden |
| Theme schema error | qa_theme_validation.py | 1 | Ogiltigt theme-JSON |
| Effect pipeline error | qa_theme_validation.py | 1 | Trasig effekt-pipeline |

### Soft Gates (varning, blockerar inte)

| Villkor | Script | Exit Code | Beskrivning |
|---------|--------|-----------|-------------|
| Tier2 golden missing | qa_golden_coverage.py | 2 | Stabil preset BOR ha golden |
| Doc link ERROR (fas 2+) | qa_doc_audit.py | 1 | Trasig lank i aktiv dokumentation |
| Doc link WARNING | qa_doc_audit.py | 2 | Ej upplosbar lank |

### Log Only (ingen gate)

| Villkor | Script | Beskrivning |
|---------|--------|-------------|
| Experimental preset utan golden | qa_golden_coverage.py | Experimentella presets MAY ha golden |
| Preset utan tier | qa_golden_coverage.py | Nya presets itereras fritt |
| Archive/generated doc links | qa_doc_audit.py | Historiskt innehall |
| WCAG contrast warnings | qa_theme_validation.py | Designval, ej bugg |
| Color similarity warnings | qa_theme_validation.py | Designval, ej bugg |

---

## Artifact-policy

### Sparade artifacts per koerning

| Artifact | Retention | Trigger |
|----------|-----------|---------|
| `GOLDEN_COVERAGE_REPORT_V3.md` | 30 dagar | Varje koerning |
| `THEME_RECIPE_SUMMARY_V3.md` | 30 dagar | Varje koerning |
| `DOC_LINK_AUDIT_V3.md` | 30 dagar | Varje koerning |
| `audit_summary.json` | 90 dagar | Vid tier1 failures |

### Long-term storage

- Golden baseline-filer (`exports/golden_audit/`) sparas tills manuell rensning
- Rapporter fran misslyckade builds sparas 90 dagar for debugging

---

## Inforande-ordning

### Fas 1: Baseline (Vecka 1)
**Vad**: Laegg till exit-codes i alla tre scripts

**Varfor**: Utan exit-codes kan CI inte avgora pass/fail

**Aatgarder**:
1. Uppdatera `qa_golden_coverage.py` med exit-codes
2. Uppdatera `qa_theme_validation.py` med exit-codes
3. Uppdatera `qa_doc_audit.py` med exit-codes
4. Testa lokalt att exit-codes fungerar

**Risknivaaa**: Laag - aendrar inte beteende, bara laegger till return codes

---

### Fas 2: Golden Gate (Vecka 2)
**Vad**: Aktivera golden-coverage som HARD GATE

**Varfor**: Golden-systemet har ERROR=0, WARNING=0 - redo for gating

**Aatgarder**:
1. Laegg till CI-job for `qa_golden_coverage.py`
2. Konfigurera som required check for PR merge
3. Skaett threshold: exit 1 blockerar, exit 2 varnar

**Risknivaaa**: Laag - nuvarande tillstand klarar redan

---

### Fas 3: Theme Gate (Vecka 2-3)
**Vad**: Aktivera theme-validation som HARD GATE (schema only)

**Varfor**: Inga schema-errors existerar, endast acceptabla warnings

**Aatgarder**:
1. Laegg till CI-job for `qa_theme_validation.py`
2. Konfigurera som required check
3. Saekerstall att WCAG/color warnings INTE blockerar

**Risknivaaa**: Laag - 572 warnings ar alla acceptabla

---

### Fas 4: Doc Audit Logging (Vecka 3)
**Vad**: Aktivera doc-audit som LOG ONLY

**Varfor**: 130 ERROR existerar - kan inte vara gate annu

**Aatgarder**:
1. Laegg till CI-job for `qa_doc_audit.py`
2. Konfigurera som NON-required (log only)
3. Spara artifact for tracking

**Risknivaaa**: Ingen - blockerar inget

---

### Fas 5: Doc Audit Remediation (Vecka 4-6)
**Vad**: Fixa trasiga lankar tills ERROR < 20

**Varfor**: Foerbered foer soft gate

**Aatgarder**:
1. Prioritera lankar i core docs (docs/CURRENT_STATUS.md etc)
2. Flytta eller arkivera obsoleta filer
3. Uppdatera lankar eller ta bort doda referenser

**Maatare**: ERROR count per vecka

---

### Fas 6: Doc Audit Soft Gate (Vecka 6+)
**Vad**: Uppgradera doc-audit till SOFT GATE

**Varfor**: Foerhindra nya trasiga lankar

**Villkor**: Aktiveras naer ERROR = 0

**Aatgarder**:
1. Aendra CI-job till soft gate
2. PR visar varning men blockerar inte
3. Maandagen efter: utvaerdera om HARD GATE ar laempligt

---

## Exit Codes Reference

| Script | Exit 0 | Exit 1 | Exit 2 |
|--------|--------|--------|--------|
| qa_golden_coverage.py | Inga tier1/tier2 problem | Tier1 preset saknar golden (HARD FAIL) | Tier2 preset saknar golden (WARNING) |
| qa_theme_validation.py | Inga schema/pipeline errors | Schema error eller pipeline warning | (reserverad) |
| qa_doc_audit.py | Inga ERROR i aktiv dokumentation | ERROR i aktiv dokumentation | Endast WARNING i aktiv dokumentation |

### Exit Code Policy

```
EXIT 0 = Pass (groent)
EXIT 1 = Fail (roett) - blockerar om HARD GATE
EXIT 2 = Warning (gult) - loggas men blockerar inte
```

---

## GitHub Actions Implementation (referens)

```yaml
# .github/workflows/qa-hygiene.yml
name: QA Hygiene

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  golden-coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Run Golden Coverage Audit
        run: python scripts/qa_golden_coverage.py
      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: golden-coverage-report
          path: exports/GOLDEN_COVERAGE_REPORT_V3.md
          retention-days: 30

  theme-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Run Theme Validation
        run: python scripts/qa_theme_validation.py
      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: theme-validation-report
          path: exports/THEME_RECIPE_SUMMARY_V3.md
          retention-days: 30

  doc-audit:
    runs-on: ubuntu-latest
    # Not required for merge (log only during Fas 4)
    continue-on-error: true
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Run Doc Link Audit
        run: python scripts/qa_doc_audit.py
      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: doc-audit-report
          path: exports/DOC_LINK_AUDIT_V3.md
          retention-days: 30
```

---

## Framtida utvidgningar

1. **Pre-commit hooks**: Kors lokalt innan commit for snabb feedback
2. **Slack/Teams-notifieringar**: Vid soft gate warnings
3. **Trend-tracking**: Visa ERROR/WARNING over tid i dashboard
4. **Auto-fix**: Automatisk fixning av enkla lankar (t.ex. case-sensitivity)

---

*Genererad av CI Readiness Agent*
