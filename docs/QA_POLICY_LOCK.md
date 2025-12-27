# QA Policy Lock

**Last**: 2025-12-27
**Galler fran**: Phase 12 onwards

---

## Locked Decisions

### 1. Golden Tier Policy

**Status: LOCKED**

Export presets foljer en tier-baserad golden baseline-policy:

| Tier | Krav | Konsekvens vid avsaknad |
|------|------|-------------------------|
| **Tier 1 (Production)** | MUST have golden baselines | ERROR - blockerar release |
| **Tier 2 (Stable)** | SHOULD have golden baselines | WARNING - bor atgardas |
| **No Tier (Experimental)** | MAY have golden baselines | INFO - endast informativt |

**Nuvarande tilldelning:**
- Tier 1: `A2_Paper_v1`, `A4_Quick_v1`
- Tier 2: `A1_Terrain_v1`, `A3_Blueprint_v1`
- Experimental: 34 presets utan tier-tilldelning

**Motivering:** Experimentella presets tillater snabb iteration utan QA-overhead. Production-presets kraver determinism-garanti.

---

### 2. Doc Audit Severity Model

**Status: LOCKED**

Dokumentlankar klassificeras enligt foljande modell:

| Severity | Definition | Atgard |
|----------|------------|--------|
| **ERROR** | Trasiga lankar i aktiv dokumentation | Ska fixas (MEDIUM prio) |
| **WARNING** | Oupplosliga lankar i aktiv dokumentation | Bor undersokas |
| **INFO** | Problem i arkiv/genererat innehall | Ingen atgard kravs |

**Exkluderade fran scanning:**
- `node_modules/`
- `.git/`
- `test-results/`

**Nedgraderade till INFO:**
- Arkiv: `docs/archive/`, `**/archive/`
- Genererat: `scripts/theme_tool/outputs/`

**Nuvarande status:** 130 ERROR, 58 WARNING, 199 INFO

**Motivering:** Arkiverat och genererat innehall ska inte skapa brus i QA-rapporter. Endast aktivt underhallen dokumentation kraver uppmärksamhet.

---

### 3. Theme Warning Acceptance

**Status: LOCKED**

Theme-validering genererar varningar som klassificeras enligt foljande:

| Varningstyp | Status | Atgard |
|-------------|--------|--------|
| **WCAG_CONTRAST** | Acceptabel | Ingen - designval |
| **COLOR_SIMILARITY** | Acceptabel | Ingen - designval |
| **EFFECT_PIPELINE** | Kräver atgard | Fixen innan release |
| **SCHEMA** | Kräver atgard | Fixen innan release |

**Nuvarande status:**
- 38 themes validerade
- 572 varningar totalt
- 200 WCAG_CONTRAST + 372 COLOR_SIMILARITY
- 0 themes kräver atgard

**Motivering:** WCAG-kontrast och fargsimilaritet ar medvetna designval for kartografiska themes. Lag kontrast mellan vatten och parker ar ofta onskvart for att skapa subtila, estetiska kartor. Dessa varningar ska inte blockera utveckling.

---

## Explicit Non-Goals

Foljande atgarder ar **INTE** mal och ska **INTE** genomforas:

### 1. Tilldela tier till alla presets
- 34 experimentella presets **saknar avsiktligt tier**
- Tilldela tier endast vid promotion till production/stable

### 2. Fixa WCAG-kontrast i themes
- 200 WCAG_CONTRAST-varningar ar **designval**
- Att hoja kontrasten skulle forstora den visuella estetiken

### 3. Fixa COLOR_SIMILARITY i themes
- 372 varningar om liknande farger ar **avsiktligt**
- Kartografiska themes kraver ofta subtila fargskillnader

### 4. Fixa lankar i arkiverat innehall
- 199 INFO-notiser for `docs/archive/` och `scripts/theme_tool/outputs/`
- Historiskt material ska bevaras men inte underhallas

### 5. Skapa golden baselines for alla presets
- Golden baselines krävs endast for Tier 1/2 presets
- Experimentella presets testar nya idéer utan QA-overhead

---

## Revisit Triggers

Denna policy ska **omprövas** om nagot av foljande intraffar:

### Automatiska triggers

| Trigger | Atgard |
|---------|--------|
| Tier 1 preset saknar golden | Omedelbar atgard - BLOCKER |
| Ny theme-varningstyp upptacks | Klassificera som Acceptabel/Kräver atgard |
| 10+ nya presets utan tier | Utvärdera tier-tilldelning |
| Doc ERROR överstiger 200 | Prioritera dokumentationsrensning |

### Manuella triggers

| Trigger | Atgard |
|---------|--------|
| **Ny fas paborjas (Phase 14+)** | Revidera tier-tilldelningar |
| **Extern granskning begars** | Dokumentera policy-undantag |
| **Production-release planeras** | Verifiera Tier 1 coverage |
| **Theme-schema andras** | Kör om validering, utvärdera nya varningar |

### Tidbaserade triggers

| Intervall | Atgard |
|-----------|--------|
| **Var 3:e manad** | Granska INFO-varningar for uppgradering |
| **Vid major release** | Verifiera alla LOCKED policies fortfarande galler |

---

## Summary

| Omrade | Status | Blockers |
|--------|--------|----------|
| Golden Coverage | OK | 0 ERROR, 0 WARNING |
| Doc Audit | OK (med kvarstaende arbete) | 130 ERROR (MEDIUM prio) |
| Theme Validation | OK | 0 themes kräver atgard |

**Fas 12 och 13 har INGA BLOCKERS.**

---

*Genererad av Policy Lock Agent*
*Baserad pa: NEXT_ACTIONS_V2.md, GOLDEN_COVERAGE_REPORT_V3.md, THEME_RECIPE_SUMMARY_V3.md, DOC_LINK_AUDIT_V3.md*
