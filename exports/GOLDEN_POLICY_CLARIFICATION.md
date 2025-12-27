# Golden Policy Clarification

**Syfte**: Definiera tydlig policy for golden baselines och klarifiera orphan-problemet i qa_golden_coverage.py.

**Datum**: 2025-12-27
**Agent**: B - Golden Baselines & Policy

---

## Policy Definition

### Tier Requirements

| Tier | Golden Requirement | Rationale |
|------|-------------------|-----------|
| tier1 | **REQUIRED** | Production-critical, determinism guarantee. Kraver exact byte-identity (0% pixel diff). |
| tier2 | **RECOMMENDED** | Important for visual consistency. Bor ha golden for nightly/pre-release verification. |
| None | **OPTIONAL** | Experimental/new presets. Ej trackade, men bor tilldelas tier vid mognad. |

### Coverage Targets by Phase

| Phase | Requirement |
|-------|-------------|
| Phase 12 (Determinism) | Alla tier1 presets MASTE ha golden baseline |
| Phase 13 (Theme Collections) | tier2 presets REKOMMENDERAS ha golden |
| Phase 14+ | Nya presets tilldelas tier vid release |

### Current Tier Assignments (from demo_b/metadata.json)

**tier1** (REQUIRED):
- `A4_Quick_v1` - Fast CI smoke test
- `A2_Paper_v1` - Primary wall map format

**tier2** (RECOMMENDED):
- `A3_Blueprint_v1` - Technical drawing format
- `A1_Terrain_v1` - Large terrain map

**None** (34 presets):
- Alla nya/experimentella presets utan tier-tilldelning

---

## Orphan-Problemet

### Analys

Rapporten visar 3 "orphan goldens":
```
- Orphan golden (no matching preset): print_export/A3_Blueprint_v1_Classic
- Orphan golden (no matching preset): print_export/A2_Paper_v1_Minimal
- Orphan golden (no matching preset): print_export/A1_Terrain_v1_Bold
```

**Rotorsak**: Golden IDs i `print_export` anvander formatet `{preset_id}_{layout}`:
- `A3_Blueprint_v1` + layout `Classic` = `A3_Blueprint_v1_Classic`
- `A2_Paper_v1` + layout `Minimal` = `A2_Paper_v1_Minimal`
- `A1_Terrain_v1` + layout `Bold` = `A1_Terrain_v1_Bold`

Scriptet `qa_golden_coverage.py` matchar golden ID direkt mot preset ID:
```python
# Rad 134 - Nuvarande logik
if preset_id not in self.presets:
    # Rapporterar som orphan
```

Problemet: `A3_Blueprint_v1_Classic` matchar inte `A3_Blueprint_v1` exakt.

### Namnkonvention for Golden IDs

| Pipeline | Format | Exempel |
|----------|--------|---------|
| demo_b | `{preset_id}` | `A2_Paper_v1` |
| print_export | `{preset_id}_{layout}` | `A2_Paper_v1_Minimal` |

Layouts som anvands:
- `Classic` - Classic layout template
- `Minimal` - Minimalist layout
- `Bold` - Bold/heavy composition
- (10+ layouts totalt i systemet)

---

## Forslag till Fix i qa_golden_coverage.py

### Pseudokod for matchning

```python
def find_matching_preset(self, golden_id: str) -> Optional[str]:
    """
    Matcha golden ID mot preset ID.
    Hanterar bade exakt match och prefix-match (preset+layout).
    """
    # 1. Exakt match (demo_b format)
    if golden_id in self.presets:
        return golden_id

    # 2. Prefix-match (print_export format: preset_id + "_" + layout)
    for preset_id in self.presets.keys():
        if golden_id.startswith(preset_id + "_"):
            # Verifiera att suffixet ar ett kand layout-namn
            suffix = golden_id[len(preset_id) + 1:]
            if self.is_known_layout(suffix):
                return preset_id

    return None

def is_known_layout(self, layout_name: str) -> bool:
    """Kontrollera om layout-namn ar kand."""
    known_layouts = {
        'Classic', 'Minimal', 'Bold',
        'Minimalist', 'Scientific', 'Blueprint',
        'Gallery_Print', 'Vintage_Map', 'Artistic',
        'Night_Mode', 'Heritage', 'Prestige', 'Cyberpunk'
    }
    return layout_name in known_layouts
```

### Uppdaterad check_coverage()

```python
def check_coverage(self):
    """Kontrollera coverage med korrekt preset+layout matchning."""
    # Identifiera presets som har golden (direkt eller via layout-variant)
    presets_with_golden = set()
    orphan_goldens = []

    for golden_type, goldens in self.goldens.items():
        for golden_id in goldens.keys():
            matched_preset = self.find_matching_preset(golden_id)
            if matched_preset:
                presets_with_golden.add(matched_preset)
            else:
                orphan_goldens.append((golden_type, golden_id))

    # Rapportera orphans (verkliga, ej false positives)
    for golden_type, golden_id in orphan_goldens:
        self.issues.append({
            'type': 'WARNING',
            'message': f"Orphan golden (no matching preset): {golden_type}/{golden_id}"
        })

    # Resten av coverage-logiken...
```

---

## Severity-Modell (Forandringar)

### Nuvarande modell

| Issue | Severity |
|-------|----------|
| Preset saknar golden | WARNING |
| Orphan golden | WARNING |
| Preset saknar tier | INFO |

### Foreslagen modell

| Issue | Severity | Rationale |
|-------|----------|-----------|
| tier1 preset saknar golden | **ERROR** | Bryter determinism-garanti |
| tier2 preset saknar golden | WARNING | Rekommenderas men ej kritisk |
| Preset utan tier saknar golden | INFO | Experimentell, ej trackad |
| Orphan golden (verklig) | WARNING | Potentiellt borttagningskandidat |

### Pseudokod for severity

```python
def check_coverage(self):
    # ... matchningslogik ...

    for preset_id in presets_without_golden:
        tier = self.presets[preset_id].get('tier')

        if tier == 'tier1':
            severity = 'ERROR'  # UPPGRADERAD
        elif tier == 'tier2':
            severity = 'WARNING'
        else:
            severity = 'INFO'  # NEDGRADERAD fran WARNING

        self.issues.append({
            'type': severity,
            'message': f"Preset without golden: {preset_id}",
            'preset_file': self.presets[preset_id]['file']
        })
```

---

## Sammanfattning av Foreslagna Andringar

### 1. Matchningslogik (prioritet: HOG)
- Implementera `find_matching_preset()` for att hantera `{preset_id}_{layout}` format
- Eliminerar 3 false-positive orphans i nuvarande rapport

### 2. Tier-baserad severity (prioritet: HOG)
- tier1 utan golden = ERROR (uppgraderad)
- None utan golden = INFO (nedgraderad fran WARNING)
- Minskar WARNING fran 37 till ~3 (verkliga tier2 utan golden)

### 3. Oversiktstabell forbattring (prioritet: LAG)
- Visa vilka layouts som har golden for varje preset
- Kolumn: `Layouts with Golden`

### Forvantad effekt efter fix

| Metric | Nuvarande | Efter fix |
|--------|-----------|-----------|
| ERROR | 0 | 0 (inga tier1 saknar golden) |
| WARNING | 37 | ~3 (endast tier2 utan golden) |
| INFO | 34 | 34 (oforandrat, presets utan tier) |
| Orphans | 3 | 0 (false positives eliminerade) |

---

## Appendix: Golden System Overview

### Tva Golden-pipelines

1. **demo_b** - Mapnik renderer (byte-identical, deterministic)
   - Format: `{preset_id}`
   - Acceptance: 0% pixel diff (exact match)
   - 4 goldens: A4_Quick_v1, A2_Paper_v1, A3_Blueprint_v1, A1_Terrain_v1

2. **print_export** - Demo A exporter (Playwright/PNG)
   - Format: `{preset_id}_{layout}`
   - Acceptance: 0.1% pixel diff (anti-aliasing tolerance)
   - 3 goldens: A3_Blueprint_v1_Classic, A2_Paper_v1_Minimal, A1_Terrain_v1_Bold

### Regeneration Policy (from demo_b/metadata.json)

**Tillatet**:
- Dependency upgrade med dokumenterad visual comparison
- Bug fix som korrigerar tidigare felaktig output
- Ny baseline efter major version release

**EJ tillatet**:
- "It's slightly different but looks fine"
- "The old baseline was probably wrong"
- "Nobody will notice"

---

*Genererad av Agent B - Golden Baselines & Policy*
