# Golden Baseline Coverage Report V3

**Genererad**: 2025-12-27 17:36

**Syfte**: Verifiera att golden-systemet är konsekvent och komplett.


## Golden Coverage Policy

**Tier 1 (Production)**: MUST have golden baselines. Missing = ERROR.
**Tier 2 (Stable)**: SHOULD have golden baselines. Missing = WARNING.
**No Tier (Experimental)**: MAY have golden baselines. Missing = INFO only.

Presets without tier assignment are considered experimental and do not
require golden baselines. This is by design to allow rapid iteration
on new presets without QA overhead.


## Översikt

- **Totalt antal presets**: 38
- **Totalt antal golden exports**: 7
- **ERROR**: 0
- **WARNING**: 0
- **INFO**: 68

**Bedömning**: **OK**

## Översiktstabell

| Preset ID | Preset File | Golden (demo_b) | Golden (print_export) | Tier |
|-----------|-------------|-----------------|------------------------|------|
| `A1_Terrain_v1` | `A1_Terrain_v1.json` | [OK] | [MISSING] | tier2 |
| `A2_Arctic_v1` | `A2_Arctic_v1.json` | [MISSING] | [MISSING] | None |
| `A2_Art_Deco_v1` | `A2_Art_Deco_v1.json` | [MISSING] | [MISSING] | None |
| `A2_Blueprint_Technical_v2` | `A2_Blueprint_Technical_v2.json` | [MISSING] | [MISSING] | None |
| `A2_Contour_Minimal_v1` | `A2_Contour_Minimal_v1.json` | [MISSING] | [MISSING] | None |
| `A2_Cyberpunk_v1` | `A2_Cyberpunk_v1.json` | [MISSING] | [MISSING] | None |
| `A2_Duotone_v1` | `A2_Duotone_v1.json` | [MISSING] | [MISSING] | None |
| `A2_Glitch_v1` | `A2_Glitch_v1.json` | [MISSING] | [MISSING] | None |
| `A2_Gold_Foil_v1` | `A2_Gold_Foil_v1.json` | [MISSING] | [MISSING] | None |
| `A2_Japandi_v1` | `A2_Japandi_v1.json` | [MISSING] | [MISSING] | None |
| `A2_Neon_Synthwave_v1` | `A2_Neon_Synthwave_v1.json` | [MISSING] | [MISSING] | None |
| `A2_Ocean_v1` | `A2_Ocean_v1.json` | [MISSING] | [MISSING] | None |
| `A2_Paper_v1` | `A2_Paper_v1.json` | [OK] | [MISSING] | tier1 |
| `A2_Riso_RedCyan_v1` | `A2_Riso_RedCyan_v1.json` | [MISSING] | [MISSING] | None |
| `A2_Scandi_Light_v1` | `A2_Scandi_Light_v1.json` | [MISSING] | [MISSING] | None |
| `A2_Scandi_Minimal_v1` | `A2_Scandi_Minimal_v1.json` | [MISSING] | [MISSING] | None |
| `A2_Silver_Foil_v1` | `A2_Silver_Foil_v1.json` | [MISSING] | [MISSING] | None |
| `A2_Sunset_v1` | `A2_Sunset_v1.json` | [MISSING] | [MISSING] | None |
| `A2_Swiss_v1` | `A2_Swiss_v1.json` | [MISSING] | [MISSING] | None |
| `A2_Terrain_GallerySoft_v1` | `A2_Terrain_GallerySoft_v1.json` | [MISSING] | [MISSING] | None |
| `A2_Thermal_v1` | `A2_Thermal_v1.json` | [MISSING] | [MISSING] | None |
| `A2_Vaporwave_v1` | `A2_Vaporwave_v1.json` | [MISSING] | [MISSING] | None |
| `A2_Woodblock_v1` | `A2_Woodblock_v1.json` | [MISSING] | [MISSING] | None |
| `A3_Bauhaus_v1` | `A3_Bauhaus_v1.json` | [MISSING] | [MISSING] | None |
| `A3_Blueprint_v1` | `A3_Blueprint_v1.json` | [OK] | [MISSING] | tier2 |
| `A3_Chalk_v1` | `A3_Chalk_v1.json` | [MISSING] | [MISSING] | None |
| `A3_Contour_Night_v1` | `A3_Contour_Night_v1.json` | [MISSING] | [MISSING] | None |
| `A3_Copper_v1` | `A3_Copper_v1.json` | [MISSING] | [MISSING] | None |
| `A3_FigureGround_Black_v1` | `A3_FigureGround_Black_v1.json` | [MISSING] | [MISSING] | None |
| `A3_Forest_v1` | `A3_Forest_v1.json` | [MISSING] | [MISSING] | None |
| `A3_Lavender_v1` | `A3_Lavender_v1.json` | [MISSING] | [MISSING] | None |
| `A3_Pencil_Sketch_v1` | `A3_Pencil_Sketch_v1.json` | [MISSING] | [MISSING] | None |
| `A3_Sepia_Classic_v1` | `A3_Sepia_Classic_v1.json` | [MISSING] | [MISSING] | None |
| `A3_Vintage_USGS_v1` | `A3_Vintage_USGS_v1.json` | [MISSING] | [MISSING] | None |
| `A4_High_Contrast_v1` | `A4_High_Contrast_v1.json` | [MISSING] | [MISSING] | None |
| `A4_Mint_Fresh_v1` | `A4_Mint_Fresh_v1.json` | [MISSING] | [MISSING] | None |
| `A4_Night_v1` | `A4_Night_v1.json` | [MISSING] | [MISSING] | None |
| `A4_Quick_v1` | `A4_Quick_v1.json` | [OK] | [MISSING] | tier1 |

## Avvikelser

### INFO

- **Experimental preset without golden: A2_Arctic_v1**
  - Preset file: `A2_Arctic_v1.json`
- **Experimental preset without golden: A2_Neon_Synthwave_v1**
  - Preset file: `A2_Neon_Synthwave_v1.json`
- **Experimental preset without golden: A2_Scandi_Minimal_v1**
  - Preset file: `A2_Scandi_Minimal_v1.json`
- **Experimental preset without golden: A2_Swiss_v1**
  - Preset file: `A2_Swiss_v1.json`
- **Experimental preset without golden: A3_Pencil_Sketch_v1**
  - Preset file: `A3_Pencil_Sketch_v1.json`
- **Experimental preset without golden: A2_Ocean_v1**
  - Preset file: `A2_Ocean_v1.json`
- **Experimental preset without golden: A3_FigureGround_Black_v1**
  - Preset file: `A3_FigureGround_Black_v1.json`
- **Experimental preset without golden: A2_Cyberpunk_v1**
  - Preset file: `A2_Cyberpunk_v1.json`
- **Experimental preset without golden: A2_Vaporwave_v1**
  - Preset file: `A2_Vaporwave_v1.json`
- **Experimental preset without golden: A2_Silver_Foil_v1**
  - Preset file: `A2_Silver_Foil_v1.json`
- **Experimental preset without golden: A3_Bauhaus_v1**
  - Preset file: `A3_Bauhaus_v1.json`
- **Experimental preset without golden: A2_Japandi_v1**
  - Preset file: `A2_Japandi_v1.json`
- **Experimental preset without golden: A2_Terrain_GallerySoft_v1**
  - Preset file: `A2_Terrain_GallerySoft_v1.json`
- **Experimental preset without golden: A2_Thermal_v1**
  - Preset file: `A2_Thermal_v1.json`
- **Experimental preset without golden: A2_Woodblock_v1**
  - Preset file: `A2_Woodblock_v1.json`
- **Experimental preset without golden: A3_Lavender_v1**
  - Preset file: `A3_Lavender_v1.json`
- **Experimental preset without golden: A4_High_Contrast_v1**
  - Preset file: `A4_High_Contrast_v1.json`
- **Experimental preset without golden: A3_Vintage_USGS_v1**
  - Preset file: `A3_Vintage_USGS_v1.json`
- **Experimental preset without golden: A4_Night_v1**
  - Preset file: `A4_Night_v1.json`
- **Experimental preset without golden: A3_Sepia_Classic_v1**
  - Preset file: `A3_Sepia_Classic_v1.json`
- **Experimental preset without golden: A2_Gold_Foil_v1**
  - Preset file: `A2_Gold_Foil_v1.json`
- **Experimental preset without golden: A2_Blueprint_Technical_v2**
  - Preset file: `A2_Blueprint_Technical_v2.json`
- **Experimental preset without golden: A2_Duotone_v1**
  - Preset file: `A2_Duotone_v1.json`
- **Experimental preset without golden: A2_Sunset_v1**
  - Preset file: `A2_Sunset_v1.json`
- **Experimental preset without golden: A3_Forest_v1**
  - Preset file: `A3_Forest_v1.json`
- **Experimental preset without golden: A3_Copper_v1**
  - Preset file: `A3_Copper_v1.json`
- **Experimental preset without golden: A3_Chalk_v1**
  - Preset file: `A3_Chalk_v1.json`
- **Experimental preset without golden: A2_Scandi_Light_v1**
  - Preset file: `A2_Scandi_Light_v1.json`
- **Experimental preset without golden: A3_Contour_Night_v1**
  - Preset file: `A3_Contour_Night_v1.json`
- **Experimental preset without golden: A2_Glitch_v1**
  - Preset file: `A2_Glitch_v1.json`
- **Experimental preset without golden: A2_Art_Deco_v1**
  - Preset file: `A2_Art_Deco_v1.json`
- **Experimental preset without golden: A2_Riso_RedCyan_v1**
  - Preset file: `A2_Riso_RedCyan_v1.json`
- **Experimental preset without golden: A4_Mint_Fresh_v1**
  - Preset file: `A4_Mint_Fresh_v1.json`
- **Experimental preset without golden: A2_Contour_Minimal_v1**
  - Preset file: `A2_Contour_Minimal_v1.json`
- **Preset without tier assignment: A2_Arctic_v1**
  - Preset file: `A2_Arctic_v1.json`
- **Preset without tier assignment: A2_Art_Deco_v1**
  - Preset file: `A2_Art_Deco_v1.json`
- **Preset without tier assignment: A2_Blueprint_Technical_v2**
  - Preset file: `A2_Blueprint_Technical_v2.json`
- **Preset without tier assignment: A2_Contour_Minimal_v1**
  - Preset file: `A2_Contour_Minimal_v1.json`
- **Preset without tier assignment: A2_Cyberpunk_v1**
  - Preset file: `A2_Cyberpunk_v1.json`
- **Preset without tier assignment: A2_Duotone_v1**
  - Preset file: `A2_Duotone_v1.json`
- **Preset without tier assignment: A2_Glitch_v1**
  - Preset file: `A2_Glitch_v1.json`
- **Preset without tier assignment: A2_Gold_Foil_v1**
  - Preset file: `A2_Gold_Foil_v1.json`
- **Preset without tier assignment: A2_Japandi_v1**
  - Preset file: `A2_Japandi_v1.json`
- **Preset without tier assignment: A2_Neon_Synthwave_v1**
  - Preset file: `A2_Neon_Synthwave_v1.json`
- **Preset without tier assignment: A2_Ocean_v1**
  - Preset file: `A2_Ocean_v1.json`
- **Preset without tier assignment: A2_Riso_RedCyan_v1**
  - Preset file: `A2_Riso_RedCyan_v1.json`
- **Preset without tier assignment: A2_Scandi_Light_v1**
  - Preset file: `A2_Scandi_Light_v1.json`
- **Preset without tier assignment: A2_Scandi_Minimal_v1**
  - Preset file: `A2_Scandi_Minimal_v1.json`
- **Preset without tier assignment: A2_Silver_Foil_v1**
  - Preset file: `A2_Silver_Foil_v1.json`
- **Preset without tier assignment: A2_Sunset_v1**
  - Preset file: `A2_Sunset_v1.json`
- **Preset without tier assignment: A2_Swiss_v1**
  - Preset file: `A2_Swiss_v1.json`
- **Preset without tier assignment: A2_Terrain_GallerySoft_v1**
  - Preset file: `A2_Terrain_GallerySoft_v1.json`
- **Preset without tier assignment: A2_Thermal_v1**
  - Preset file: `A2_Thermal_v1.json`
- **Preset without tier assignment: A2_Vaporwave_v1**
  - Preset file: `A2_Vaporwave_v1.json`
- **Preset without tier assignment: A2_Woodblock_v1**
  - Preset file: `A2_Woodblock_v1.json`
- **Preset without tier assignment: A3_Bauhaus_v1**
  - Preset file: `A3_Bauhaus_v1.json`
- **Preset without tier assignment: A3_Chalk_v1**
  - Preset file: `A3_Chalk_v1.json`
- **Preset without tier assignment: A3_Contour_Night_v1**
  - Preset file: `A3_Contour_Night_v1.json`
- **Preset without tier assignment: A3_Copper_v1**
  - Preset file: `A3_Copper_v1.json`
- **Preset without tier assignment: A3_FigureGround_Black_v1**
  - Preset file: `A3_FigureGround_Black_v1.json`
- **Preset without tier assignment: A3_Forest_v1**
  - Preset file: `A3_Forest_v1.json`
- **Preset without tier assignment: A3_Lavender_v1**
  - Preset file: `A3_Lavender_v1.json`
- **Preset without tier assignment: A3_Pencil_Sketch_v1**
  - Preset file: `A3_Pencil_Sketch_v1.json`
- **Preset without tier assignment: A3_Sepia_Classic_v1**
  - Preset file: `A3_Sepia_Classic_v1.json`
- **Preset without tier assignment: A3_Vintage_USGS_v1**
  - Preset file: `A3_Vintage_USGS_v1.json`
- **Preset without tier assignment: A4_High_Contrast_v1**
  - Preset file: `A4_High_Contrast_v1.json`
- **Preset without tier assignment: A4_Mint_Fresh_v1**
  - Preset file: `A4_Mint_Fresh_v1.json`
- **Preset without tier assignment: A4_Night_v1**
  - Preset file: `A4_Night_v1.json`

## Golden Export Detaljer

### demo_b

| Preset ID | File | SHA256 | Tier |
|----------|------|--------|------|
| `A1_Terrain_v1` | `A1_Terrain_v1_golden.png` | `5e899f5fc0d2e946...` | tier2 |
| `A2_Paper_v1` | `A2_Paper_v1_golden.png` | `125865871093a3f7...` | tier1 |
| `A3_Blueprint_v1` | `A3_Blueprint_v1_golden.png` | `6bc643da1600f0ba...` | tier2 |
| `A4_Quick_v1` | `A4_Quick_v1_golden.png` | `0c809ea6aeaf39a4...` | tier1 |

### print_export

| Preset ID | File | SHA256 | Tier |
|----------|------|--------|------|
| `A1_Terrain_v1_Bold` | `A1_Terrain_v1_Bold_golden.png` | `b800e7908bad2601...` | None |
| `A2_Paper_v1_Minimal` | `A2_Paper_v1_Minimal_golden.png` | `ef0c5bb30a2bb8ba...` | None |
| `A3_Blueprint_v1_Classic` | `A3_Blueprint_v1_Classic_golden.png` | `48e4bbd0f787b900...` | None |
