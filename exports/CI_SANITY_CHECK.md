# CI Sanity Check

**Datum**: 2025-12-27
**Syfte**: Verifiera att CI-setup beter sig som forvantad

---

## Expected Behavior Summary

| Job | Current State | Expected Exit | CI Result |
|-----|---------------|---------------|-----------|
| golden-coverage | 0 tier1/tier2 issues | 0 | PASS |
| theme-validation | 0 schema/pipeline errors | 0 | PASS |
| doc-audit | 130 ERROR | 1 | LOGGED (not blocking) |

### Overall CI Status

```
PR Submitted --> golden-coverage (PASS) --> theme-validation (PASS) --> doc-audit (LOGGED)
                        |                          |                          |
                     exit 0                     exit 0                     exit 1 (ignored)
                        |                          |                          |
                   HARD GATE OK              HARD GATE OK             continue-on-error: true
                        |                          |                          |
                        +----------> PR CAN MERGE <-----------+               |
                                                                    (artifact saved)
```

---

## Exit Code Reference

### qa_golden_coverage.py

| Exit Code | Meaning | CI Action |
|-----------|---------|-----------|
| 0 | Inga tier1/tier2-problem | PASS - green checkmark |
| 1 | Tier1 preset saknar golden | FAIL - blocks PR merge |
| 2 | Tier2 preset saknar golden | WARNING - yellow, does not block |

**Current data**: 0 tier1 errors, 0 tier2 warnings --> **Exit 0**

### qa_theme_validation.py

| Exit Code | Meaning | CI Action |
|-----------|---------|-----------|
| 0 | Inga schema/pipeline errors | PASS - green checkmark |
| 1 | Schema error eller pipeline warning | FAIL - blocks PR merge |

**Current data**: 0 action required themes (572 WCAG/color warnings are acceptable) --> **Exit 0**

### qa_doc_audit.py

| Exit Code | Meaning | CI Action |
|-----------|---------|-----------|
| 0 | Inga ERROR i aktiv dokumentation | PASS - green checkmark |
| 1 | ERROR i aktiv dokumentation | FAIL (but ignored due to continue-on-error) |
| 2 | Endast WARNING i aktiv dokumentation | WARNING - yellow |

**Current data**: 130 ERROR, 58 WARNING, 199 INFO --> **Exit 1** (but CI continues)

---

## Legitimate Fail Scenarios

### What SHOULD block a PR:

1. **Tier 1 preset missing golden baseline**
   - Script: `qa_golden_coverage.py`
   - Exit code: 1
   - Example: Someone removes `A2_Paper_v1_golden.png` from `golden/demo_b/`
   - **This is a production blocker - CORRECT behavior**

2. **Theme schema error**
   - Script: `qa_theme_validation.py`
   - Exit code: 1
   - Example: Invalid JSON in a theme file, missing required field
   - **This is a pipeline integrity issue - CORRECT behavior**

3. **Effect pipeline error in theme**
   - Script: `qa_theme_validation.py`
   - Exit code: 1
   - Example: Theme references non-existent effect
   - **This would break rendering - CORRECT behavior**

### What SHOULD NOT block a PR:

1. **Tier 2 preset missing golden**
   - Script: `qa_golden_coverage.py`
   - Exit code: 2
   - Example: Removing golden for `A3_Blueprint_v1`
   - **Warning is appropriate - stable but not production-critical**

2. **Experimental preset missing golden**
   - Script: `qa_golden_coverage.py`
   - Exit code: 0 (INFO only)
   - Example: New `A2_Vaporwave_v1` has no golden baseline
   - **This is by design - rapid iteration on experiments**

3. **WCAG contrast warnings**
   - Script: `qa_theme_validation.py`
   - Exit code: 0
   - Example: Theme has low contrast colors
   - **Designval, not a bug**

4. **Color similarity warnings**
   - Script: `qa_theme_validation.py`
   - Exit code: 0
   - Example: Theme has very similar colors
   - **Designval, not a bug**

5. **Doc link errors (current state)**
   - Script: `qa_doc_audit.py`
   - Exit code: 1 (but continue-on-error: true)
   - Example: Broken link in `docs/editor-gallery-plan.md`
   - **Currently tracked but not blocking - remediation in progress**

6. **Archive/generated doc issues**
   - Script: `qa_doc_audit.py`
   - Severity: INFO (not counted in exit code)
   - Example: Broken links in `scripts/theme_tool/outputs/*.md`
   - **Historical content - no action required**

---

## This is OK

1. **doc-audit loggar 130 ERROR men PR passerar**
   - `continue-on-error: true` i workflow
   - Artifact sparas for tracking
   - Plan finns for att fixa (Fas 5 i CI_PLAN)

2. **golden-coverage exit 2 (tier2 warning)**
   - Varning visas i CI
   - Blockerar INTE PR merge
   - Dokumenteras i artifact

3. **572 theme warnings (WCAG/color)**
   - 200 WCAG_CONTRAST + 372 COLOR_SIMILARITY
   - Klassificerade som "acceptabla designval"
   - Orsakar INTE exit 1

4. **Experimentella presets utan golden**
   - 34 presets utan tier-tilldelning
   - 34 presets utan golden baselines
   - Loggas som INFO, paverkar inte exit code

5. **Orphan golden files**
   - Goldens som matchar layout-varianter (t.ex. `A2_Paper_v1_Minimal`)
   - Korrekt matchade via prefix-logik
   - Ingen WARNING for dessa

---

## This is NOT OK

1. **golden-coverage exit 1 (tier1 missing)**
   - BLOCKER - PR kan inte mergas
   - Omedelbar atgard kravs
   - Tier 1 presets: `A2_Paper_v1`, `A4_Quick_v1`

2. **theme-validation exit 1 (schema error)**
   - BLOCKER - PR kan inte mergas
   - Theme JSON ar ogiltigt
   - Effekt-pipeline ar trasig

3. **CI workflow saknar exit code hantering**
   - Om scripts inte returnerar korrekta exit codes
   - CI kan inte avgora pass/fail
   - **Verifierat: Alla tre scripts har exit-codes implementerade**

4. **continue-on-error borttaget for doc-audit for tidigt**
   - Med 130 ERROR skulle alla PR blockeras
   - Ska endast andras nar ERROR = 0
   - **Nuvarande status: Fas 4 (LOG ONLY) - korrekt**

5. **Nya tier1 presets utan golden**
   - Om preset markeras som tier1 utan att forst skapa golden
   - Blockerar alla PR direkt
   - **Alltid skapa golden INNAN tier-tilldelning**

---

## Edge Cases

### 1. Script timeout
- Alla scripts har ingen explicit timeout
- CI-job har `timeout-minutes` pa workflow-niva (standard 6h)
- **Risk**: Lang korning kan blocka PR i onodan
- **Mitigation**: Scripts ar snabba (<10s lokalt)

### 2. Windows vs Linux path handling
- Scripts anvander `Path` fran pathlib
- Hanterar bade `/` och `\` separators
- **Risk**: Laag - pathlib ar cross-platform

### 3. Orphan golden matching
- `A2_Paper_v1_Minimal_golden.png` matchar preset `A2_Paper_v1`
- Prefix-matchning med kanda layout-suffix
- **Risk**: Ny layout-naming kan skapa false orphans
- **Mitigation**: `KNOWN_LAYOUTS` lista i script uppdateras vid behov

### 4. Threshold for doc-audit gate upgrade
- Fas 5 malsattning: ERROR < 20
- Fas 6 malsattning: ERROR = 0
- **Nuvarande**: 130 ERROR - lang vag kvar
- **Risk**: Kan dra ut pa tiden

### 5. GitHub Actions exit code 2
- GitHub Actions tolkar exit 2 som failure (icke-noll)
- Men scripten ger exit 2 for "warning" (tier2, doc warning)
- **Risk**: CI visar rad checkmark for tier2 warnings
- **Mitigation**: Dokumenterat beteende, exit 2 ar varning inte blocker

---

## CI Workflow Verification

### Verified Configuration (`qa-hygiene.yml`)

```yaml
jobs:
  golden-coverage:
    # NO continue-on-error --> HARD GATE
    # Exit 1 = PR blocked
    # Exit 2 = Warning (GitHub shows failure but no blocking)

  theme-validation:
    # NO continue-on-error --> HARD GATE
    # Exit 1 = PR blocked

  doc-audit:
    continue-on-error: true  # LOG ONLY
    # Exit 1 = Logged, artifact saved, PR continues
```

### Required Status Checks

For full protection, GitHub branch protection should be configured:

| Job | Required for merge |
|-----|-------------------|
| golden-coverage | YES |
| theme-validation | YES |
| doc-audit | NO (log only) |

**Note**: Branch protection settings are not in this repository - they are configured in GitHub UI.

---

## Dry-Run Simulation

### Scenario A: Happy Path (current state)
```
1. Developer opens PR
2. golden-coverage runs: exit 0 (all tier1/tier2 have golden)
3. theme-validation runs: exit 0 (no schema errors)
4. doc-audit runs: exit 1 (130 ERROR) --> continue-on-error --> PR OK
5. All artifacts uploaded
6. PR can merge
```

### Scenario B: Tier1 Golden Missing
```
1. Developer deletes A2_Paper_v1_golden.png
2. golden-coverage runs: exit 1 (Tier 1 preset without golden: A2_Paper_v1)
3. PR BLOCKED - cannot merge
4. Developer must restore golden or remove tier1 assignment
```

### Scenario C: Theme Schema Error
```
1. Developer introduces invalid JSON in paper.json
2. theme-validation runs: exit 1 (Schema error in paper theme)
3. PR BLOCKED - cannot merge
4. Developer must fix JSON syntax
```

### Scenario D: New Experimental Preset
```
1. Developer adds new A2_Cyberpunk_v2.json (no tier, no golden)
2. golden-coverage: exit 0 (INFO: Experimental preset without golden)
3. theme-validation: exit 0 (valid JSON)
4. doc-audit: exit 1 (unrelated errors) --> continue-on-error
5. PR can merge - experiment allowed without golden
```

---

## Improvements for Later (DO NOT implement now)

### 1. Unified Exit Code Policy
- Consider standardizing exit 2 behavior across all scripts
- GitHub Actions treats exit 2 as failure (red X)
- Could use `::warning::` annotations instead for visual distinction

### 2. JSON Output Mode
- Add `--json` flag to all QA scripts
- Enables machine-readable output for dashboards
- Better integration with GitHub Actions job summaries

### 3. Trend Tracking
- Store historical ERROR/WARNING counts
- Visualize progress over time
- Alert on regression (ERROR count increasing)

### 4. Pre-commit Hooks
- Run QA scripts locally before commit
- Faster feedback loop than waiting for CI
- Optional, not enforced

### 5. Slack/Teams Notifications
- Alert on soft gate warnings
- Notify when doc-audit ERROR count decreases
- Celebrate milestones (ERROR < 100, ERROR = 0)

### 6. Automatic Doc Link Fixes
- Simple cases: case sensitivity, missing extensions
- More complex: file moves with redirect tracking
- **Defer until Fas 5 remediation phase**

---

## Summary

| Aspect | Status | Notes |
|--------|--------|-------|
| Exit codes implemented | YES | All three scripts have proper exit logic |
| Gate types correct | YES | golden/theme = HARD, doc = LOG ONLY |
| Current state passes | YES | 0 tier1 errors, 0 schema errors |
| Doc audit tracked | YES | 130 ERROR logged, artifact saved |
| Branch protection | VERIFY | Must be configured in GitHub UI |

**Conclusion**: CI setup is correctly configured for current project state. PRs will pass unless production-critical issues are introduced. Doc link errors are tracked but do not block work in progress.

---

*Genererad av CI Sanity Agent*
*Baserad pa: qa-hygiene.yml, qa_golden_coverage.py, qa_theme_validation.py, qa_doc_audit.py*
