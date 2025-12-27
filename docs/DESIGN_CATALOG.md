# Design Catalog - Topo Map Styles

## Overview

This catalog documents the available design styles for the Topo Map Export System, their intended use cases, and the render pipeline configuration for each.

## MVP Styles (Production Ready)

The following 6 styles are selected as the MVP for print production:

### 1. Paper (Recommended Default)

**File**: `themes/paper.json`

| Property | Value |
|----------|-------|
| Background | #faf8f5 (warm off-white) |
| Mood | Calm, professional |
| Best for | General print, framing |
| Layers | All (DEM + OSM) |

**Key characteristics**:
- Warm paper-like background
- Subtle hillshade (22% opacity)
- Muted contour lines
- Balanced color palette

**Render pipeline**:
```
DEM -> Hillshade (multiply blend, gamma 0.95) -> Base
OSM -> Water/Parks/Roads/Buildings -> Overlay
Contours -> Top layer (no labels)
```

---

### 2. Gallery (Print Optimized)

**File**: `themes/gallery.json`

| Property | Value |
|----------|-------|
| Background | #fdfcfa (bright off-white) |
| Mood | Gallery print, wall art |
| Best for | Fine art prints, exhibitions |
| Layers | All (DEM + OSM) |

**Key characteristics**:
- Stronger visual hierarchy
- Higher hillshade contrast (28% opacity)
- Thicker road strokes for visibility
- No labels (clean aesthetic)

**Render pipeline**:
```
DEM -> Hillshade (multiply blend, gamma 0.92, contrast 1.12) -> Base
OSM -> Water/Parks/Roads/Buildings -> Overlay
Contours -> Top layer (opacity varies by major/minor)
```

---

### 3. Ink (Minimal)

**File**: `themes/ink.json`

| Property | Value |
|----------|-------|
| Background | #ffffff (pure white) |
| Mood | Minimal, clean |
| Best for | Technical prints, overlays |
| Layers | All (DEM + OSM) |

**Key characteristics**:
- Pure white background
- Low hillshade (18% opacity)
- High contrast roads
- Minimal color

**Render pipeline**:
```
DEM -> Hillshade (minimal, 18% opacity) -> Base
OSM -> Grayscale water/parks, dark roads -> Overlay
Contours -> Gray lines (no labels)
```

---

### 4. Dark (Dramatic)

**File**: `themes/dark.json`

| Property | Value |
|----------|-------|
| Background | #1a1a1a (near black) |
| Mood | Dramatic, modern |
| Best for | Display screens, modern interiors |
| Layers | All (DEM + OSM) |

**Key characteristics**:
- Dark background
- Inverted color scheme
- Light roads on dark base
- Subtle terrain visibility

**Render pipeline**:
```
DEM -> Hillshade (20% opacity, multiply on dark) -> Base
OSM -> Dark fills, light strokes -> Overlay
Contours -> Medium gray (visible on dark)
```

---

### 5. Mono (Classic B/W)

**File**: `themes/mono.json`

| Property | Value |
|----------|-------|
| Background | #ffffff (white) |
| Mood | Classic, archival |
| Best for | Academic, technical documents |
| Layers | All (DEM + OSM) |

**Key characteristics**:
- True black and white
- No color information
- High legibility
- Print-efficient

**Render pipeline**:
```
DEM -> Hillshade (grayscale) -> Base
OSM -> Black lines, white/gray fills -> Overlay
Contours -> Black lines
```

---

### 6. Charcoal (Artistic)

**File**: `themes/charcoal.json`

| Property | Value |
|----------|-------|
| Background | #2e2e2e (dark gray) |
| Mood | Artistic, sketched |
| Best for | Artistic prints, gifts |
| Layers | All (DEM + OSM) |

**Key characteristics**:
- Charcoal sketch aesthetic
- Soft edges
- Textured appearance
- Medium contrast

**Render pipeline**:
```
DEM -> Hillshade (soft blend) -> Base
OSM -> Charcoal tones -> Overlay
Contours -> Soft gray
```

---

## Secondary Styles (Available)

The following styles are available but not prioritized for MVP:

### 7. Warm-Paper

Warmer variant of Paper with sepia tones.

### 8. Blueprint-Muted

Technical drawing aesthetic with muted blue tones.

### 9. Muted-Pastel

Soft pastel colors, suitable for nursery/children decor.

### 10. Void (Stark/Poster)

**File**: `themes/void.json`

| Property | Value |
|----------|-------|
| Background | #050505 (near black) |
| Mood | Stark, abstract |
| Best for | Posters, art prints, vinyl aesthetics |
| Layers | Contours only (optional subtle hillshade) |

**Key characteristics**:
- Near-black void background
- Cream/warm white contours (#e8e0d4)
- Very subtle hillshade (8% opacity, screen blend)
- Maximum contrast for topographic lines
- No water, parks, roads, or buildings

**Recommended preset**: `A3_Contour_Night_v1`

**Render pipeline**:
```
DEM -> Hillshade (8% opacity, screen blend) -> Subtle depth
Contours -> Cream lines on black (major: 1.2px, minor: 0.5px)
```

---

### 11. Neon (Synthwave)

**File**: `themes/neon.json`

| Property | Value |
|----------|-------|
| Background | #0d0221 (deep purple-black) |
| Mood | Synthwave, vibrant |
| Best for | Posters, modern wall art |
| Layers | All (DEM + OSM) |

**Key characteristics**:
- Dark synthwave background
- Magenta roads (#ff00ff)
- Cyan contours and water (#00ffff)
- Yellow building strokes (#ffff00)
- Glowing neon aesthetic

**Recommended preset**: `A2_Neon_Synthwave_v1`

**Render pipeline**:
```
DEM -> Hillshade (12% opacity, screen blend) -> Subtle depth
OSM -> Neon-colored strokes on dark fills -> Overlay
Contours -> Cyan lines (major: 1.2px, minor: 0.6px)
```

---

### 12. Vintage (USGS Classic)

**File**: `themes/vintage.json`

| Property | Value |
|----------|-------|
| Background | #d4c4a8 (aged paper) |
| Mood | Classic, nostalgic |
| Best for | Traditional prints, gifts |
| Layers | All (DEM + OSM) |

**Key characteristics**:
- Sepia-toned background
- Brown contours and roads (#5c4033, #7a5c40)
- Muted water and parks
- Classic USGS topographic feel

**Recommended preset**: `A3_Vintage_USGS_v1`

**Render pipeline**:
```
DEM -> Hillshade (25% opacity, multiply blend) -> Base
OSM -> Sepia-toned fills and strokes -> Overlay
Contours -> Brown lines (major: 1.0px, minor: 0.4px)
```

---

### 13. Gold Foil (Premium)

**File**: `themes/gold-foil.json`

| Property | Value |
|----------|-------|
| Background | #0a0a0a (near black) |
| Mood | Luxury, premium |
| Best for | High-end prints, gifts |
| Layers | All (DEM + OSM) |

**Key characteristics**:
- Pure black background
- Gold contours and roads (#d4af37)
- Bright gold building strokes (#ffd700)
- Bronze water accents (#b8860b)
- Metallic foil aesthetic

**Recommended preset**: `A2_Gold_Foil_v1`

**Render pipeline**:
```
DEM -> Hillshade (10% opacity, screen blend) -> Subtle depth
OSM -> Gold-toned strokes on black -> Overlay
Contours -> Gold lines (major: 1.2px, minor: 0.5px)
```

---

### 14. Night (Dark Mode)

**File**: `themes/night.json`

| Property | Value |
|----------|-------|
| Background | #121212 (dark gray) |
| Mood | Dark, muted |
| Best for | Eye-friendly prints, modern interiors |
| Layers | All (DEM + OSM) |

**Key characteristics**:
- True dark mode background
- Medium gray roads (#888888)
- Muted contours (#606060)
- Subtle blue-tinted water
- No pure white elements

**Recommended preset**: `A4_Night_v1`

**Render pipeline**:
```
DEM -> Hillshade (18% opacity, screen blend) -> Base
OSM -> Muted gray tones on dark -> Overlay
Contours -> Gray lines (major: 0.9px, minor: 0.4px)
```

---

## Style Categories

### By Data Source

| Category | Styles | Primary Data |
|----------|--------|--------------|
| DEM-heavy | Gallery, Paper, Ink, Vintage | Hillshade, Contours |
| OSM-heavy | Dark, Mono, Night | Roads, Buildings |
| Hybrid | Charcoal, Warm-Paper, Neon, Gold Foil | Balanced |

### By Use Case

| Use Case | Recommended Style |
|----------|-------------------|
| Wall print (framed) | Gallery, Paper, Vintage |
| Technical/Academic | Mono, Ink |
| Modern interior | Dark, Charcoal, Night |
| Gift/Personal | Warm-Paper, Muted-Pastel, Gold Foil |
| Poster/Art print | Void, Dark, Neon |
| Premium/Luxury | Gold Foil |
| Retro/Synthwave | Neon |

### By Preset Compatibility

| Style | stockholm_core | stockholm_wide | svealand |
|-------|----------------|----------------|----------|
| Paper | Excellent | Excellent | Good |
| Gallery | Excellent | Excellent | Good |
| Ink | Excellent | Excellent | Fair |
| Dark | Excellent | Good | Fair |
| Mono | Excellent | Excellent | Excellent |
| Charcoal | Good | Good | Fair |
| Void | Good | Excellent | Excellent |
| Neon | Good | Excellent | Good |
| Vintage | Excellent | Excellent | Good |
| Gold Foil | Good | Excellent | Good |
| Night | Excellent | Excellent | Good |

**Note**: "Fair" for svealand means reduced detail at lower zoom levels.

---

## Theme File Structure

Each theme is a JSON file with the following structure:

```json
{
  "name": "Theme Name",
  "background": "#hexcolor",
  "meta": {
    "intended_scale": "A2",
    "label_density": "none|low|medium",
    "mood": "descriptive string"
  },
  "hillshade": {
    "opacity": 0.0-1.0,
    "gamma": 0.8-1.2,
    "contrast": 0.8-1.2,
    "blend": "multiply|screen|overlay"
  },
  "water": {
    "fill": "#hexcolor",
    "stroke": "#hexcolor",
    "strokeWidth": number
  },
  "parks": { ... },
  "roads": {
    "stroke": "#hexcolor",
    "strokeWidth": { "major": number, "minor": number }
  },
  "buildings": { ... },
  "contours": {
    "stroke": "#hexcolor",
    "strokeWidth": { "major": number, "minor": number },
    "intervals": [2, 10, 50],
    "noLabels": true
  }
}
```

---

## Adding New Styles

To add a new style:

1. Create `themes/your-style.json` with the structure above
2. Restart Demo A and Demo B services
3. The new theme will appear in the theme dropdown
4. Test with all presets before production use

### Design Guidelines

- Keep hillshade opacity between 0.15-0.35
- Use `noLabels: true` for contours (print mode)
- Test at both screen and A2 print resolution
- Verify contrast ratios for accessibility
- Check visibility of all layers at zoom 10-14

---

## Future Styles (Roadmap)

### Recently Implemented (2025-12-27)

| Style | Description | Status |
|-------|-------------|--------|
| Vintage | USGS-style with sepia tones | ✅ DONE |
| Neon | Synthwave with glowing neon lines | ✅ DONE |
| Gold Foil | Premium gold on black | ✅ DONE |
| Night | Dark mode with muted contrast | ✅ DONE |

### Planned Additions

| Style | Description | Priority |
|-------|-------------|----------|
| Minimalist-Swiss | Swiss cartography style | Low |
| Copper Foil | Warm metallic variant | Low |
| Risograph | Grainy off-register aesthetic | Low |

### Data Source Additions

| Data | Style Impact |
|------|--------------|
| Forests/Land cover | Nature-focused styles |
| Waterways | Hydrological emphasis |
| Elevation bands | Altitude color coding |

---

## See Also

- [USAGE.md](USAGE.md) - How to use themes
- [PRESET_LIMITS.md](PRESET_LIMITS.md) - Export limits per preset
- [BUILD_GUIDE.md](BUILD_GUIDE.md) - Building tile data
