# Print Quality Checklist

## Pixel Dimensions Reference

| Format | DPI | Width (mm) | Height (mm) | Width (px) | Height (px) |
|--------|-----|------------|-------------|------------|-------------|
| A2     | 150 | 420        | 594         | 2,480      | 3,508       |
| A2     | 300 | 420        | 594         | 4,961      | 7,016       |
| A1     | 150 | 594        | 841         | 3,508      | 4,961       |
| A1     | 300 | 594        | 841         | 7,016      | 9,921       |

Formula: `pixels = mm * dpi / 25.4`

## Stroke Width Guidelines

At 300 DPI print quality:

| Element | Print Mode | Screen Mode |
|---------|------------|-------------|
| Major roads | 1.0-1.5px (0.085-0.127mm) | 1.5-2.0px |
| Minor roads | 0.5-0.8px (0.042-0.068mm) | 0.8-1.0px |
| Water outlines | 0.4-0.6px (0.034-0.051mm) | 0.6-0.8px |
| Building outlines | 0.3-0.5px (0.025-0.042mm) | 0.5-0.7px |
| Contours (major) | 0.5-0.7px (0.042-0.059mm) | 0.7-1.0px |
| Contours (minor) | 0.3-0.4px (0.025-0.034mm) | 0.4-0.6px |

**Print mode scaling:** Multiply base stroke width by 0.7-0.8 for thinner, print-optimized lines.

## Print Mode Defaults

### Label Policy
- **Labels:** OFF by default
- **POIs (Points of Interest):** Hidden
- **Street names:** Hidden
- **Building labels:** Hidden
- **Contour labels:** NEVER (hard constraint)

### Generalization
- **Buildings:** Simplified/aggregated for wide bboxes (stockholm_wide)
- **Roads:** Minor roads may be filtered out at low zoom levels
- **Contours:** Minor intervals (2m) hidden for wide bboxes or large output sizes

### Visual Hierarchy
1. Background (paper/ink color)
2. Hillshade (subtle, opacity 0.12-0.18)
3. Water bodies
4. Parks/landuse
5. Roads (minor first, major on top)
6. Buildings
7. Contours (50m → 10m → 2m, if visible)

## Recommended Themes for Gallery/Wall Art

### Existing Themes
- **Paper:** Warm beige background, muted colors - ✅ Gallery ready
- **Ink:** High contrast black/white - ✅ Gallery ready
- **Mono:** Neutral grayscale - ✅ Gallery ready

### Additional Gallery-Friendly Themes

#### Warm Paper
```json
{
  "name": "WarmPaper",
  "background": "#f5f0e8",
  "meta": {
    "intended_scale": "A2",
    "label_density": "none",
    "mood": "warm_minimal"
  },
  "hillshade": {
    "opacity": 0.12,
    "gamma": 1.0,
    "contrast": 0.95,
    "blend": "multiply"
  },
  "water": {
    "fill": "#e0ddd5",
    "stroke": "#b8b5ad",
    "strokeWidth": 0.4
  },
  "parks": {
    "fill": "#ede8e0",
    "stroke": "#d0c8b8",
    "strokeWidth": 0.3
  },
  "roads": {
    "stroke": "#8b7d6b",
    "strokeWidth": {
      "major": 1.2,
      "minor": 0.6
    }
  },
  "buildings": {
    "fill": "#d8d0c5",
    "stroke": "#9a9080",
    "strokeWidth": 0.4
  },
  "contours": {
    "stroke": "#a89a88",
    "strokeWidth": {
      "major": 0.6,
      "minor": 0.3
    },
    "intervals": [2, 10, 50],
    "noLabels": true
  }
}
```

#### Charcoal
```json
{
  "name": "Charcoal",
  "background": "#2a2a2a",
  "meta": {
    "intended_scale": "A2",
    "label_density": "none",
    "mood": "dark_elegant"
  },
  "hillshade": {
    "opacity": 0.18,
    "gamma": 0.85,
    "contrast": 1.15,
    "blend": "multiply"
  },
  "water": {
    "fill": "#353535",
    "stroke": "#4a4a4a",
    "strokeWidth": 0.5
  },
  "parks": {
    "fill": "#2f2f2f",
    "stroke": "#3a3a3a",
    "strokeWidth": 0.3
  },
  "roads": {
    "stroke": "#7a7a7a",
    "strokeWidth": {
      "major": 1.3,
      "minor": 0.7
    }
  },
  "buildings": {
    "fill": "#383838",
    "stroke": "#5a5a5a",
    "strokeWidth": 0.5
  },
  "contours": {
    "stroke": "#5a5a5a",
    "strokeWidth": {
      "major": 0.7,
      "minor": 0.35
    },
    "intervals": [2, 10, 50],
    "noLabels": true
  }
}
```

#### Blueprint Muted
```json
{
  "name": "BlueprintMuted",
  "background": "#f8f8f5",
  "meta": {
    "intended_scale": "A2",
    "label_density": "none",
    "mood": "technical_subdued"
  },
  "hillshade": {
    "opacity": 0.1,
    "gamma": 1.0,
    "contrast": 1.0,
    "blend": "multiply"
  },
  "water": {
    "fill": "#e8ebef",
    "stroke": "#b8c5d0",
    "strokeWidth": 0.5
  },
  "parks": {
    "fill": "#f0f0ed",
    "stroke": "#d0d0cd",
    "strokeWidth": 0.3
  },
  "roads": {
    "stroke": "#4a6a8a",
    "strokeWidth": {
      "major": 1.4,
      "minor": 0.7
    }
  },
  "buildings": {
    "fill": "#e0e0dd",
    "stroke": "#7a8a9a",
    "strokeWidth": 0.5
  },
  "contours": {
    "stroke": "#6a7a8a",
    "strokeWidth": {
      "major": 0.8,
      "minor": 0.4
    },
    "intervals": [2, 10, 50],
    "noLabels": true
  }
}
```

## Stockholm-Specific Considerations

### Contour Interval Strategy

Stockholm terrain is relatively flat (elevation range ~0-60m above sea level). Recommended approach:

1. **Default intervals:** 2m, 10m, 50m
   - 2m: Fine detail for core area (stockholm_core)
   - 10m: Good balance for most uses
   - 50m: Major features only

2. **Visibility rules:**
   - **stockholm_core:** Show all intervals (2m, 10m, 50m)
   - **stockholm_wide:** Hide 2m interval to avoid clutter
   - **Large outputs (A1):** Consider hiding 2m interval
   - **Small outputs (A4):** Show only 10m and 50m

3. **Contour styling:**
   - Use subtle colors (gray tones, 10-20% darker than background)
   - Thinner strokes in print mode
   - No labels ever

### Water/Archipelago Styling

Stockholm has extensive water and archipelago:
- Use subtle water fill (slightly darker/lighter than background)
- Thin shoreline strokes (0.4-0.6px at 300 DPI)
- Ensure islands are visible (building outlines help)
- Consider slightly lighter water for better contrast with land

### Building Generalization

For wide bbox (stockholm_wide):
- Simplify building geometries
- Aggregate small buildings
- Use lighter building fill to reduce visual weight

## Quality Verification Steps

Before printing:

1. [ ] Verify pixel dimensions match expected (see table above)
2. [ ] Check DPI metadata (if available in image)
3. [ ] Visual inspection at 100% zoom:
   - [ ] Text is crisp (if labels enabled)
   - [ ] Lines are sharp, not blurred
   - [ ] No aliasing artifacts
   - [ ] Colors match theme
4. [ ] Check stroke widths:
   - [ ] Major roads clearly visible but not dominant
   - [ ] Minor roads visible but subtle
   - [ ] Contours provide rhythm without clutter
5. [ ] Verify no contour labels (critical!)
6. [ ] Test print at target size (or scaled down):
   - [ ] All elements readable
   - [ ] Good contrast
   - [ ] Appropriate level of detail for viewing distance

## Print Preparation

### Pre-Print Processing

1. **Color profile:** Convert to sRGB if needed
2. **Sharpening:** Light unsharp mask if needed (radius: 0.5-1px, amount: 50-100%)
3. **Metadata:** Remove any timestamps or unwanted metadata
4. **File format:**
   - PNG: Lossless, good for prints
   - PDF: Vector format preferred by some printers (Demo B supports this)

### Recommended Print Settings

- **Paper:** Matte or semi-matte (reduces glare)
- **Color mode:** Color (even for mono themes, subtle grayscale benefits from color printing)
- **Resolution:** Match export DPI (150 for proofs, 300 for final)







