# Theme Collection Criteria

**Version**: 1.0
**Giltig fr.o.m.**: 2025-12-27
**Galler for**: Phase 13 Theme Collections

## Collection Tags

Taggningssystemet anvander enkla, hierarkiska taggar for att kategorisera themes.
Varje theme kan ha flera taggar. Taggar anvands for att filtrera themes vid skapande av kollektioner.

### Tillgangliga taggar

| Tag | Betydelse | Exempel |
|-----|-----------|---------|
| `style:minimal` | Reducerad, ren estetik | pencil-sketch, scandi-minimal, swiss |
| `style:bold` | Stark kontrast, dramatiskt uttryck | high-contrast, neon, cyberpunk |
| `style:artistic` | Konstnärligt, experimentellt | glitch, vaporwave, woodblock |
| `style:classic` | Tidlos, traditionell kartestetik | sepia, vintage, paper |
| `mood:warm` | Varma färgtoner | copper, gold-foil, sunset, warm-paper |
| `mood:cool` | Kalla färgtoner | arctic, ocean, mint, blueprint-muted |
| `mood:neutral` | Neutral färgpalett | mono, charcoal, ink |
| `mood:vibrant` | Intensiva, mättade färger | neon, cyberpunk, vaporwave |
| `use:poster` | Lampat for storformatstryck | Themes med stark visuell impact |
| `use:gallery` | Lampat for galleriutställning | Themes med konstnärlig kvalitet |
| `use:technical` | Lampat for teknisk/professionell användning | blueprint-muted, swiss, mono |
| `use:gift` | Lampat for presentartiklar | Themes med bred appell |
| `tier:premium` | Förslag for premium-kollektion | Låga varningstal, hög kvalitet |
| `tier:standard` | Standard kollektion | Alla validerade themes |

## Eligibility Rules

### Regel 1: Structural Validity

**Krav**: Theme måste klara strukturell validering.

Ett theme ar "structurally valid" om:
- JSON-schema ar korrekt
- Alla obligatoriska färgfalt existerar
- Inga parsing-fel uppstår

**Status**: Alla 38 themes klarar detta krav.

### Regel 2: Acceptable Warning Policy

**Krav**: Theme får endast ha "acceptable warnings" (designval).

Acceptable warnings:
- `WCAG_CONTRAST`: Låg kontrast mellan element (designval for mjuka/subtila themes)
- `COLOR_SIMILARITY`: Liknande färger mellan element (designval for monokromatiska/harmoniska themes)

**NOT acceptable** (kräver åtgärd):
- Schema-fel
- Saknade obligatoriska färgfalt
- Ogiltiga färgvärden (hex-format, etc.)

**Status**: Alla 38 themes uppfyller detta krav (endast acceptable warnings).

### Regel 3: Collection-Specific Thresholds

Olika kollektioner kan ha olika trösklar för varningstal:

| Kollektion | Max WCAG | Max COLOR_SIM | Max Totalt |
|------------|----------|---------------|------------|
| Premium Poster | 3 | 15 | 15 |
| Premium Gallery | 3 | 15 | 15 |
| Standard | 8 | 25 | 30 |
| Experimental | Ingen gräns | Ingen gräns | Ingen gräns |

## Warning Policy

**EXPLICIT POLICY**: WCAG-kontrast och färgsimilaritets-varningar ar **designval**, inte buggar.

### Varför detta ar designval

1. **WCAG_CONTRAST (200 varningar totalt)**
   - Låg kontrast mellan element ar ett medvetet designval for:
     - Mjuka, drömska themes (muted-pastel, chalk)
     - Subtila, eleganta themes (scandi-minimal, japandi)
     - Mörka themes där element smälter samman (void, night)
   - Kartdesign ar inte samma som webbdesign - läsbarhet av text ar inte huvudmålet
   - Estetisk effekt prioriteras over maximal kontrast

2. **COLOR_SIMILARITY (372 varningar totalt)**
   - Liknande färger ar ett medvetet designval for:
     - Monokromatiska themes (mono, charcoal, ink)
     - Harmoniska themes (lavender, mint, ocean)
     - High-contrast themes som använder få färger (21 similarity-varningar ar helt förväntat)
   - Färgharmoni ar en konstnärlig kvalitet, inte en brist

### Hur detta påverkar eligibility

- **Eligibility påverkas INTE** av WCAG/COLOR_SIMILARITY-varningar
- Alla 38 themes ar "collection eligible"
- Varningstal används endast for **sortering** och **tiering**, inte for disqualificering

## Quick Reference

| Collection Type | Required Tags | Warning Threshold | Min Themes |
|-----------------|---------------|-------------------|------------|
| Premium Poster | `use:poster`, `tier:premium` | Max 15 totalt | 5 |
| Premium Gallery | `use:gallery`, `tier:premium` | Max 15 totalt | 5 |
| Standard All | `tier:standard` | Max 30 totalt | Alla |
| Mood: Warm | `mood:warm` | Ingen gräns | 4+ |
| Mood: Cool | `mood:cool` | Ingen gräns | 4+ |
| Style: Minimal | `style:minimal` | Ingen gräns | 4+ |
| Experimental | `style:artistic` | Ingen gräns | 3+ |

## Exempel

### Poster Collection (Premium)

**Kriterier**: `use:poster` + max 15 varningar totalt

**Kvalificerade themes**:

| Theme | WCAG | COLOR_SIM | Totalt | Motivering |
|-------|------|-----------|--------|------------|
| pencil-sketch | 1 | 8 | 9 | Stark grafisk kvalitet, tydliga linjer |
| woodblock | 2 | 7 | 9 | Konstnärligt uttryck, traditionell estetik |
| glitch | 1 | 9 | 10 | Modernt, eye-catching |
| vaporwave | 2 | 8 | 10 | Retro-futuristiskt, trendig estetik |
| thermal | 5 | 4 | 9 | Unik färgpalett, teknisk känsla |

### Gallery Collection (Premium)

**Kriterier**: `use:gallery` + max 15 varningar totalt

**Kvalificerade themes**:

| Theme | WCAG | COLOR_SIM | Totalt | Motivering |
|-------|------|-----------|--------|------------|
| pencil-sketch | 1 | 8 | 9 | Konstnärlig, handritad känsla |
| woodblock | 2 | 7 | 9 | Traditionell japansk estetik |
| glitch | 1 | 9 | 10 | Digital konst, samtida uttryck |
| art-deco | 5 | 5 | 10 | Elegant, historisk referens |
| bauhaus | 3 | 5 | 8 | Designhistorisk klassiker |

### Mood Collection: Warm

**Kriterier**: `mood:warm`

**Kvalificerade themes**:
- copper (13 totalt)
- gold-foil (11 totalt)
- sunset (16 totalt)
- warm-paper (20 totalt)
- sepia (16 totalt)

### Style Collection: Minimal

**Kriterier**: `style:minimal`

**Kvalificerade themes**:
- pencil-sketch (9 totalt)
- scandi-minimal (24 totalt)
- swiss (12 totalt)
- mono (17 totalt)
- ink (11 totalt)

## Implementation Notes for Phase 13

### Metadata Schema

Themes kan utökas med en `collections`-sektion i JSON:

```json
{
  "name": "pencil-sketch",
  "collections": {
    "tags": ["style:minimal", "style:artistic", "use:poster", "use:gallery", "tier:premium"],
    "warningScore": 9,
    "eligibleFor": ["premium-poster", "premium-gallery", "standard"]
  }
}
```

### Validation Script Integration

Befintliga valideringsverktyg (qa_theme_validation.py) kan utökas med:

1. Automatisk tagg-generering baserad på färganalys
2. Warning-score beräkning
3. Collection eligibility check

### Manual Curation

Trots automatisk taggning bör manuell kurering göras för:

- `use:poster` - kräver bedömning av visuell impact
- `use:gallery` - kräver bedömning av konstnärlig kvalitet
- `tier:premium` - kräver kvalitetsbedömning

---

## Sammanfattning

| Metrisk | Värde |
|---------|-------|
| Totalt antal themes | 38 |
| Collection eligible | 38 (100%) |
| Premium eligible (max 15 varningar) | 10 |
| Action required | 0 |

**Alla 38 themes ar redo for Phase 13 Theme Collections.**

---
*Genererad av Phase 13 Enablement Agent*
*Baserad på THEME_RECIPE_SUMMARY_V3.md (2025-12-27)*
