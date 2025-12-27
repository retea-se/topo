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

### 15. Silver Foil (Premium)

**File**: `themes/silver-foil.json`

| Property | Value |
|----------|-------|
| Background | #0a0a0a (near black) |
| Mood | Elegant, premium |
| Best for | High-end prints, modern interiors |
| Layers | All (DEM + OSM) |

**Key characteristics**:
- Pure black background
- Silver contours and roads (#c0c0c0, #b0b0b0)
- Bright silver building strokes (#e8e8e8)
- Chrome/platinum metallic aesthetic

**Recommended preset**: `A2_Silver_Foil_v1`

---

### 16. Copper (Warm Metallic)

**File**: `themes/copper.json`

| Property | Value |
|----------|-------|
| Background | #1a1210 (warm dark brown) |
| Mood | Warm, industrial |
| Best for | Rustic decor, steampunk aesthetic |
| Layers | All (DEM + OSM) |

**Key characteristics**:
- Warm dark background
- Copper/bronze roads (#b87333)
- Bronze building strokes (#cd7f32)
- Industrial warmth

**Recommended preset**: `A3_Copper_v1`

---

### 17. Cyberpunk (Dystopian)

**File**: `themes/cyberpunk.json`

| Property | Value |
|----------|-------|
| Background | #0a0a0a (black) |
| Mood | Dystopian, futuristic |
| Best for | Sci-fi themed prints, gaming rooms |
| Layers | All (DEM + OSM) |

**Key characteristics**:
- Pure black background
- Neon green contours and water (#00ff00)
- Hot pink roads (#ff0055)
- Cyan building strokes (#00ffff)
- Glitch/matrix aesthetic

**Recommended preset**: `A2_Cyberpunk_v1`

---

### 18. Chalk (Educational)

**File**: `themes/chalk.json`

| Property | Value |
|----------|-------|
| Background | #2d4a3e (dark green) |
| Mood | Educational, nostalgic |
| Best for | Schools, offices, retro decor |
| Layers | All (DEM + OSM) |

**Key characteristics**:
- Classic blackboard green
- White chalk-like roads (#ffffff)
- Off-white contours (#e0e0e0)
- Educational aesthetic

**Recommended preset**: `A3_Chalk_v1`

---

### 19. Thermal (Scientific)

**File**: `themes/thermal.json`

| Property | Value |
|----------|-------|
| Background | #000000 (black) |
| Mood | Scientific, dramatic |
| Best for | Tech offices, science themes |
| Layers | All (DEM + OSM) |

**Key characteristics**:
- Pure black background
- Yellow roads (#ffff00)
- Orange contours (#ff6600)
- Purple water (#4b0082)
- Cyan buildings (#00ffff)
- Infrared heat-camera palette

**Recommended preset**: `A2_Thermal_v1`

---

### 20. Bauhaus (Modernist)

**File**: `themes/bauhaus.json`

| Property | Value |
|----------|-------|
| Background | #ffffff (white) |
| Mood | Bold, geometric |
| Best for | Modern interiors, design studios |
| Layers | All (DEM + OSM) |

**Key characteristics**:
- Pure white background
- Primary color scheme
- Blue water (#0000ff)
- Yellow parks (#ffff00)
- Red buildings (#ff0000)
- Bold black roads and contours

**Recommended preset**: `A3_Bauhaus_v1`

---

### 21. Art Deco (1920s Elegance)

**File**: `themes/art-deco.json`

| Property | Value |
|----------|-------|
| Background | #f5f5dc (cream) |
| Mood | Elegant, classic |
| Best for | Luxury interiors, gatsby-themed |
| Layers | All (DEM + OSM) |

**Key characteristics**:
- Cream/beige background
- Gold buildings (#d4af37)
- Black roads and strokes (#1a1a1a)
- Bronze contours (#8b7355)
- 1920s geometric elegance

**Recommended preset**: `A2_Art_Deco_v1`

---

### 22. Forest (Autumn Nature)

**File**: `themes/forest.json`

| Property | Value |
|----------|-------|
| Background | #f0fff0 (honeydew) |
| Mood | Natural, organic |
| Best for | Nature lovers, cabins, outdoor themes |
| Layers | All (DEM + OSM) |

**Key characteristics**:
- Light natural background
- Deep green parks (#228b22)
- Steel blue water (#4682b4)
- Brown roads (#8b4513)
- Golden buildings (#daa520)
- Autumn forest palette

**Recommended preset**: `A3_Forest_v1`

---

### 23. Ocean (Marine)

**File**: `themes/ocean.json`

| Property | Value |
|----------|-------|
| Background | #f0f8ff (alice blue) |
| Mood | Coastal, serene |
| Best for | Coastal homes, nautical themes |
| Layers | All (DEM + OSM) |

**Key characteristics**:
- Light blue background
- Deep blue water (#006994)
- Teal contours (#20b2aa)
- Cadet blue buildings (#5f9ea0)
- Powder blue parks (#b0e0e6)
- Nautical/marine aesthetic

**Recommended preset**: `A2_Ocean_v1`

---

### 24. High Contrast (Accessible)

**File**: `themes/high-contrast.json`

| Property | Value |
|----------|-------|
| Background | #ffffff (white) |
| Mood | Clear, accessible |
| Best for | Visually impaired, high readability |
| Layers | All (DEM + OSM) |

**Key characteristics**:
- Pure white background
- Pure black elements
- Extra thick lines (4px major roads)
- Maximum contrast
- WCAG accessibility compliant

**Recommended preset**: `A4_High_Contrast_v1`

---

## Style Categories

### By Data Source

| Category | Styles | Primary Data |
|----------|--------|--------------|
| DEM-heavy | Gallery, Paper, Ink, Vintage, Forest, Ocean | Hillshade, Contours |
| OSM-heavy | Dark, Mono, Night, Bauhaus, High Contrast | Roads, Buildings |
| Hybrid | Charcoal, Warm-Paper, Neon, Gold Foil, Silver Foil, Copper, Cyberpunk, Chalk, Thermal, Art Deco | Balanced |

### By Use Case

| Use Case | Recommended Style |
|----------|-------------------|
| Wall print (framed) | Gallery, Paper, Vintage, Art Deco, Ocean |
| Technical/Academic | Mono, Ink, Chalk, High Contrast |
| Modern interior | Dark, Charcoal, Night, Bauhaus, Silver Foil |
| Gift/Personal | Warm-Paper, Muted-Pastel, Gold Foil, Forest |
| Poster/Art print | Void, Dark, Neon, Cyberpunk, Thermal |
| Premium/Luxury | Gold Foil, Silver Foil, Copper, Art Deco |
| Retro/Synthwave | Neon, Cyberpunk |
| Nature/Outdoors | Forest, Ocean |
| Accessibility | High Contrast |

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
| Silver Foil | Good | Excellent | Good |
| Copper | Good | Excellent | Good |
| Cyberpunk | Good | Excellent | Good |
| Chalk | Excellent | Excellent | Good |
| Thermal | Good | Excellent | Good |
| Bauhaus | Excellent | Excellent | Good |
| Art Deco | Excellent | Excellent | Good |
| Forest | Excellent | Excellent | Excellent |
| Ocean | Excellent | Excellent | Excellent |
| High Contrast | Excellent | Excellent | Excellent |

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
| Silver Foil | Elegant silver on black | ✅ DONE |
| Copper | Warm bronze metallic | ✅ DONE |
| Cyberpunk | Dystopian neon aesthetic | ✅ DONE |
| Chalk | Blackboard educational style | ✅ DONE |
| Thermal | Infrared heat-camera | ✅ DONE |
| Bauhaus | Modernist primary colors | ✅ DONE |
| Art Deco | 1920s gold elegance | ✅ DONE |
| Forest | Autumn nature palette | ✅ DONE |
| Ocean | Marine blues and teals | ✅ DONE |
| High Contrast | Accessibility-focused B&W | ✅ DONE |

### Planned Additions

| Style | Description | Priority |
|-------|-------------|----------|
| Minimalist-Swiss | Swiss cartography style | Low |
| Risograph | Grainy off-register aesthetic | Low |
| Vaporwave | 90s pastel gradients | Low |
| Glitch | RGB-split distorted | Low |

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
