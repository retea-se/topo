# Stockholm-Specific Optimizations

## Contour Interval Strategy

### Terrain Characteristics

Stockholm area:
- Elevation range: ~0-60m above sea level
- Mostly flat with gentle slopes
- Water-dominated (archipelago, lakes, sea)

### Recommended Intervals

**Primary:** 2m, 10m, 50m
- **2m:** Fine detail for central city (stockholm_core)
- **10m:** Good balance, readable at most scales
- **50m:** Major features only

**Fallback:** 5m, 25m, 100m (if 2m/10m/50m too dense)
- Use if 2m intervals create too much clutter

### Visibility Rules

Implement in theme-to-style conversion and Mapnik XML:

```javascript
// Demo A: MapLibre style
function shouldShowContourInterval(interval, preset, outputSize) {
  if (interval === 2) {
    // Hide 2m for wide bbox or large outputs
    if (preset === 'stockholm_wide') return false;
    if (outputSize.width > 4000) return false; // A1 at 300 DPI
  }
  return true;
}
```

```python
# Demo B: Mapnik XML generation
def should_show_contour_interval(interval: int, preset: str, output_width_px: int) -> bool:
    """Determine if contour interval should be visible."""
    if interval == 2:
        # Hide 2m for wide bbox or large outputs
        if preset == 'stockholm_wide':
            return False
        if output_width_px > 4000:  # A1 at 300 DPI
            return False
    return True
```

### Contour Styling for Flat Terrain

- Use subtle colors: 10-20% darker than background
- Thin strokes: 0.3-0.6px at 300 DPI for minor, 0.6-0.8px for major
- No labels (hard constraint)
- Consider using dashed lines for minor intervals to reduce visual weight

## Water/Archipelago Styling

### Recommendations

1. **Water fill:** Slightly darker or lighter than background
   - Paper theme: `#d4e4f0` (current) - good
   - Ensure good contrast with land

2. **Shorelines:** Thin but visible
   - 0.4-0.6px at 300 DPI
   - Slightly darker than water fill

3. **Islands:**
   - Buildings help define islands
   - Consider slightly lighter building fill on islands
   - Ensure contours don't clutter small islands

4. **Archipelago:**
   - Many small islands - use subtle styling
   - Avoid heavy outlines that create visual noise

## Building Generalization

### For stockholm_wide (Large Area)

- Simplify building geometries
- Aggregate very small buildings (< 50m²)
- Use lighter fill color to reduce visual weight
- Thinner outlines

### For stockholm_core (Central City)

- Show individual buildings
- More detailed geometry
- Slightly darker fill for definition

### Implementation

In theme-to-style conversion, adjust building layer based on preset:

```javascript
const buildingOpacity = preset === 'stockholm_wide' ? 0.7 : 1.0;
const buildingSimplify = preset === 'stockholm_wide' ? 2.0 : 0.5;
```

## Bbox-Specific Optimizations

### stockholm_core
- Show all detail
- All contour intervals visible
- Individual buildings
- Higher label density (if enabled)

### stockholm_wide
- Hide 2m contours
- Generalize buildings
- Reduce minor road detail
- Lower label density (if enabled)

## Print Mode Adjustments for Stockholm

1. **Contours:** Show only 10m and 50m intervals
2. **Buildings:** Slightly lighter fill
3. **Roads:** Slightly thinner strokes
4. **Water:** Maintain good contrast for archipelago visibility

## Recommended Theme Settings for Stockholm

All themes should:
- Use subtle hillshade (opacity 0.12-0.18)
- Ensure water is clearly distinguishable
- Use muted colors (no neon)
- Provide good contrast for flat terrain visualization

See `PRINT_QUALITY_CHECKLIST.md` for additional gallery-friendly themes.



