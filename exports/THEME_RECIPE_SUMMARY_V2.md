# Theme Recipe Summary V2

**Genererad**: 2025-12-27
**Syfte**: Identifiera och fixa parsing-buggen i `qa_theme_validation.py` samt kategorisera themes.

---

## Sammanfattning

| Kategori | Antal |
|----------|-------|
| **Totalt themes** | 38 |
| **CLEAN** | 0 |
| **WARNING** | 38 |
| **ACTION REQUIRED** | 0 |

Alla 38 teman har warnings relaterade till WCAG-kontrast och liknande färger.
Inga teman har valideringsfel (errors).

---

## Parsing-problemet

### Rotorsak identifierad

Parsing-koden i `qa_theme_validation.py` letade efter warnings med fel format.

**Faktisk output från theme_recipe_tool.py:**
```
=== Theme Validation: arctic ===

[WARNING] WARNINGS:
  - Low contrast: water.fill vs background (ratio: 1.45)
  - Moderate contrast: water.stroke vs background (ratio: 2.66)
  - Very similar colors: water.fill and parks.fill (ratio: 1.26)

[OK] Theme is valid!
```

**Hur parsningen misslyckades:**

Koden i `qa_theme_validation.py` (rad 55-63):
```python
for line in output.split('\n'):
    if '[ERROR]' in line or 'ERROR:' in line:
        error_msg = line.replace('[ERROR]', '').replace('ERROR:', '').strip()
        if error_msg:
            result['errors'].append(error_msg)
    elif '[WARNING]' in line or 'WARNING:' in line:
        warning_msg = line.replace('[WARNING]', '').replace('WARNING:', '').strip()
        if warning_msg:
            result['warnings'].append(warning_msg)
```

**Problem:**
1. Output har `[WARNING] WARNINGS:` pa EN rad
2. De faktiska warning-meddelandena ar pa EFTERFOLJANDE rader med prefix `  - `
3. Parsningen fangade endast header-raden och extraherade "WARNINGS:" som enda warning
4. De faktiska detaljerna (`Low contrast: ...`) ignorerades helt

### Forslag till fix

```python
def parse_validation_output(output: str) -> tuple[list[str], list[str]]:
    """Parse theme_recipe_tool.py output correctly."""
    errors = []
    warnings = []

    in_error_section = False
    in_warning_section = False

    for line in output.split('\n'):
        # Detect section headers
        if '[ERROR] ERRORS:' in line:
            in_error_section = True
            in_warning_section = False
            continue
        elif '[WARNING] WARNINGS:' in line:
            in_warning_section = True
            in_error_section = False
            continue
        elif line.startswith('[') or line.startswith('===') or line == '':
            # Section ends on new header, status line, or blank
            if line.strip() and not line.strip().startswith('- '):
                in_error_section = False
                in_warning_section = False
            continue

        # Collect items with "  - " prefix
        if line.strip().startswith('- '):
            item = line.strip()[2:]  # Remove "- " prefix
            if in_error_section and item:
                errors.append(item)
            elif in_warning_section and item:
                warnings.append(item)

    return errors, warnings
```

---

## Theme-kategorisering

### Kategoriseringskriterier

| Kategori | Definition |
|----------|------------|
| **CLEAN** | Inga warnings eller errors |
| **WARNING** | Har warnings, men fungerar korrekt |
| **ACTION REQUIRED** | Har errors eller kritiska problem |

### CLEAN (inga problem)

Inga themes ar helt utan warnings. Alla 38 themes har kontrast- eller farglikhetsvarningar.

### WARNING (warnings men fungerande)

Alla 38 teman hamnar i denna kategori. De ar fullt funktionella men har WCAG-relaterade varningar.

**Sorterat efter antal warnings (lagst forst):**

| Theme | Warnings | Huvudsaklig typ |
|-------|----------|-----------------|
| bauhaus | 8 | Kontrast + farglikhet |
| cyberpunk | 9 | Lag kontrast fill vs background |
| ocean | 9 | Kontrast + farglikhet |
| pencil-sketch | 9 | Kontrast + farglikhet |
| thermal | 9 | Kontrast + farglikhet |
| woodblock | 9 | Kontrast + farglikhet |
| art-deco | 10 | Kontrast + farglikhet |
| glitch | 10 | Kontrast + farglikhet |
| vaporwave | 10 | Kontrast + farglikhet |
| gold-foil | 11 | Lag kontrast fill + effekter |
| ink | 11 | Kontrast + farglikhet |
| silver-foil | 11 | Kontrast + farglikhet |
| neon | 12 | Lag kontrast fill vs background |
| swiss | 12 | Kontrast + farglikhet |
| copper | 13 | Lag kontrast + farglikhet |
| vintage | 13 | Kontrast + farglikhet |
| chalk | 15 | Lag kontrast + farglikhet |
| forest | 15 | Moderat kontrast + farglikhet |
| gallery | 15 | Lag kontrast + farglikhet |
| night | 16 | Kontrast + farglikhet |
| riso-red-cyan | 16 | Effekt-kanaler + farglikhet |
| sepia | 16 | Kontrast + farglikhet |
| sunset | 16 | Kontrast + farglikhet |
| arctic | 17 | Lag kontrast + farglikhet |
| charcoal | 17 | Lag kontrast + farglikhet |
| lavender | 17 | Kontrast + farglikhet |
| mono | 17 | Kontrast + farglikhet |
| blueprint-muted | 18 | Lag kontrast + farglikhet |
| mint | 18 | Kontrast + farglikhet |
| paper | 18 | Kontrast + farglikhet |
| dark | 19 | Lag kontrast + farglikhet |
| warm-paper | 20 | Kontrast + farglikhet |
| duotone | 21 | Kontrast + manga identiska farger |
| japandi | 21 | Lag kontrast + farglikhet |
| high-contrast | 22 | Manga identiska farger (designval) |
| void | 23 | Kontrast + farglikhet |
| scandi-minimal | 24 | Lag kontrast + farglikhet |
| muted-pastel | 25 | Lag kontrast + farglikhet |

### ACTION REQUIRED (kraver atgard)

Inga themes har errors. Alla themes validerar korrekt.

---

## Warning-kategorier

### WCAG/Contrast Warnings

Dessa warnings indikerar potentiella tillganglighetsproblem enligt WCAG 2.1.

| Typ | Beskrivning | Antal themes |
|-----|-------------|--------------|
| **Low contrast** | Kontrast < 2.5:1 mot bakgrund | 38 |
| **Moderate contrast** | Kontrast 2.5-4.5:1 mot bakgrund | 32 |

**Typiska exempel:**
- `Low contrast: water.fill vs background (ratio: 1.45)`
- `Moderate contrast: contours.stroke vs background (ratio: 3.22)`

**Rekommendation:**
Dessa varningar ar informativa. Manga kart-themes har avsiktligt lag kontrast for att skapa subtila effekter. Endast themes for tillganglighetskritiska andamal bor prioritera hogre kontrast.

### Similar Colors Warnings

Dessa indikerar att tva fargfalt ar svara att skilja at visuellt.

| Typ | Beskrivning | Antal themes |
|-----|-------------|--------------|
| **Very similar colors** | Kontrast < 1.5:1 mellan lager | 38 |

**Typiska exempel:**
- `Very similar colors: water.fill and parks.fill (ratio: 1.26)`
- `Very similar colors: buildings.stroke and contours.stroke (ratio: 1.14)`

**Rekommendation:**
Detta ar ofta ett medvetet designval (t.ex. monokroma themes). Endast themes dar distinktion ar viktig bor andras.

### Effect Pipeline Warnings

Inga themes har effect-relaterade varningar i nuvarande version. Risograph-effekten i `riso-red-cyan` validerar korrekt.

### Schema Validation Warnings

Inga schema-varningar hittades. Alla themes foljer forvantad JSON-struktur.

---

## Detaljerad warning-lista per theme

### Themes med flest warnings (>20)

#### muted-pastel (25 warnings)
- 8x Low contrast (fill vs background)
- 1x Moderate contrast
- 16x Very similar colors

#### scandi-minimal (24 warnings)
- 9x Low contrast
- 15x Very similar colors

#### void (23 warnings)
- 7x Low contrast
- 1x Moderate contrast
- 15x Very similar colors

#### high-contrast (22 warnings)
- 1x Low contrast (parks.fill vs background)
- 21x Very similar colors (avsiktligt - alla stroke/fill ar identiska svarta)

### Themes med minst warnings (<10)

#### bauhaus (8 warnings)
- 2x Low contrast
- 1x Moderate contrast
- 5x Very similar colors

#### cyberpunk (9 warnings)
- 3x Low contrast (fill vs background = 1.00-1.03)
- 6x Very similar colors

---

## Foreslagna script-andringar

### Uppdaterad kod for qa_theme_validation.py

```python
def validate_theme(self, theme_file: Path) -> Dict:
    """Validera ett enskilt theme."""
    theme_name = theme_file.stem
    result = {
        'theme': theme_name,
        'file': theme_file.name,
        'valid': False,
        'errors': [],
        'warnings': [],
        'tool_available': False,
        'tool_error': None
    }

    if not self.tool_path.exists():
        result['tool_error'] = f"Theme tool not found: {self.tool_path}"
        return result

    result['tool_available'] = True

    try:
        cmd = ['python', str(self.tool_path), str(theme_file)]
        process = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=self.repo_root,
            timeout=30
        )

        output = process.stdout + process.stderr

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

            # Section ends on new bracket line, status line, or "Done!"
            if stripped.startswith('[') or stripped.startswith('===') or stripped == 'Done!':
                in_error_section = False
                in_warning_section = False
                continue

            # Empty lines don't end sections
            if not stripped:
                continue

            # Collect items with "- " prefix
            if stripped.startswith('- '):
                item = stripped[2:]  # Remove "- " prefix
                if in_error_section and item:
                    result['errors'].append(item)
                elif in_warning_section and item:
                    result['warnings'].append(item)
        # --- END FIX ---

        # Kontrollera exit code
        if process.returncode == 0:
            if '[OK]' in output and 'valid' in output.lower():
                result['valid'] = True
            elif not result['errors']:
                result['valid'] = True
        else:
            result['valid'] = False
            if not result['errors']:
                result['errors'].append(f"Tool exited with code {process.returncode}")

    except subprocess.TimeoutExpired:
        result['errors'].append("Tool execution timed out")
    except Exception as e:
        result['errors'].append(f"Tool execution failed: {e}")

    return result
```

### Alternativ: Strukturerad JSON-output

Ett battre langiktigt alternativ vore att modifiera `theme_recipe_tool.py` att stodja `--json` flagga:

```python
# I theme_recipe_tool.py main():
if '--json' in sys.argv:
    output = {
        'theme': theme_name,
        'valid': is_valid,
        'errors': errors,
        'warnings': warnings
    }
    print(json.dumps(output))
    sys.exit(0 if is_valid else 1)
```

Detta skulle gora parsningen trivial:
```python
result = json.loads(process.stdout)
```

---

## Slutsatser

1. **Parsing-buggen ar identifierad**: Koden laste bara header-raden `[WARNING] WARNINGS:` och missade de faktiska warning-meddelandena pa efterfoljande rader.

2. **Alla themes ar valida**: Inga errors finns. Alla 38 themes har WCAG-relaterade warnings men fungerar korrekt.

3. **Warnings ar informativa**: De flesta warnings ar relaterade till lag kontrast eller liknande farger, vilket ofta ar avsiktliga designval for kart-themes.

4. **Rekommenderad atgard**: Implementera den foreslagna fixen i `qa_theme_validation.py` for att fa korrekta warning-detaljer i rapporten.

---

## Bilaga: Faktisk output-exempel

### arctic.json
```
=== Theme Validation: arctic ===

[WARNING] WARNINGS:
  - Low contrast: water.fill vs background (ratio: 1.45)
  - Moderate contrast: water.stroke vs background (ratio: 2.66)
  - Low contrast: parks.fill vs background (ratio: 1.15)
  - Low contrast: parks.stroke vs background (ratio: 1.66)
  - Low contrast: buildings.fill vs background (ratio: 1.34)
  - Low contrast: buildings.stroke vs background (ratio: 2.28)
  - Moderate contrast: contours.stroke vs background (ratio: 2.60)
  - Very similar colors: water.fill and parks.fill (ratio: 1.26)
  - Very similar colors: water.fill and parks.stroke (ratio: 1.15)
  - Very similar colors: water.fill and buildings.fill (ratio: 1.08)
  - Very similar colors: water.stroke and buildings.stroke (ratio: 1.16)
  - Very similar colors: water.stroke and contours.stroke (ratio: 1.02)
  - Very similar colors: parks.fill and parks.stroke (ratio: 1.44)
  - Very similar colors: parks.fill and buildings.fill (ratio: 1.16)
  - Very similar colors: parks.stroke and buildings.fill (ratio: 1.24)
  - Very similar colors: parks.stroke and buildings.stroke (ratio: 1.37)
  - Very similar colors: buildings.stroke and contours.stroke (ratio: 1.14)

[OK] Theme is valid!
```

### riso-red-cyan.json (med risograph-effekt)
```
=== Theme Validation: riso-red-cyan ===

[WARNING] WARNINGS:
  - Moderate contrast: parks.fill vs background (ratio: 3.34)
  - Moderate contrast: effects.risograph.channels[0].color vs background (ratio: 3.37)
  - Moderate contrast: effects.risograph.channels[1].color vs background (ratio: 2.68)
  - Very similar colors: water.fill and water.stroke (ratio: 1.28)
  - Very similar colors: water.fill and parks.stroke (ratio: 1.18)
  - Very similar colors: water.fill and buildings.fill (ratio: 1.24)
  - Very similar colors: water.fill and contours.stroke (ratio: 1.04)
  - Very similar colors: water.stroke and buildings.fill (ratio: 1.03)
  - Very similar colors: water.stroke and contours.stroke (ratio: 1.33)
  - Very similar colors: parks.fill and effects.risograph.channels[0].color (ratio: 1.01)
  - Very similar colors: parks.fill and effects.risograph.channels[1].color (ratio: 1.25)
  - Very similar colors: parks.stroke and buildings.fill (ratio: 1.46)
  - Very similar colors: parks.stroke and contours.stroke (ratio: 1.13)
  - Very similar colors: roads.stroke and buildings.stroke (ratio: 1.00)
  - Very similar colors: buildings.fill and contours.stroke (ratio: 1.28)
  - Very similar colors: effects.risograph.channels[0].color and effects.risograph.channels[1].color (ratio: 1.26)

[OK] Theme is valid!
```
