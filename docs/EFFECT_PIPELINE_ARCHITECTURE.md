# Effect Pipeline Architecture

**Version**: 1.0
**Status**: IMPLEMENTED
**Date**: 2025-12-27

---

## Overview

The Effect Pipeline is a post-rendering stage that applies visual effects to map output. Effects are applied **after** the base map is rendered, operating on pixel data rather than vector data.

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌────────┐
│ Theme JSON  │ -> │ Style Gen    │ -> │ Renderer        │ -> │ Effect │ -> Output
│             │    │              │    │ (MapLibre/      │    │Pipeline│
│ + effects   │    │              │    │  Mapnik)        │    │        │
└─────────────┘    └──────────────┘    └─────────────────┘    └────────┘
```

---

## Design Principles

1. **Opt-in**: Effects are disabled by default
2. **Modular**: Each effect is a standalone module
3. **Deterministic**: Same input always produces same output
4. **Extensible**: New effects can be added without modifying core pipeline
5. **Backwards Compatible**: Themes without effects work unchanged

---

## Theme Schema Extension

Effects are configured in an optional `effects` section of the theme JSON:

```json
{
  "name": "ThemeName",
  "background": "#f5f0e6",
  // ... standard theme properties ...

  "effects": {
    "risograph": {
      "enabled": true,
      "channels": [
        { "color": "#ff6b9d", "offset": { "x": 2, "y": 1 } },
        { "color": "#00a8a8", "offset": { "x": -1, "y": 2 } }
      ],
      "grain": {
        "opacity": 0.08,
        "seed": "preset_id"
      },
      "blendMode": "multiply"
    }
  }
}
```

### Schema Validation Rules

- `effects` is optional (null or missing = no effects)
- Each effect has an `enabled` boolean (default: false)
- Unknown effect types are ignored (forwards compatibility)
- Invalid configurations fall back to defaults

---

## Effect Interface

### Python (Demo B)

```python
# demo-b/renderer/src/effects/base.py

from abc import ABC, abstractmethod
from PIL import Image
from typing import Dict, Any, Optional

class BaseEffect(ABC):
    """Base class for all post-render effects."""

    @abstractmethod
    def apply(self, image: Image.Image, config: Dict[str, Any],
              seed: Optional[str] = None) -> Image.Image:
        """
        Apply the effect to an image.

        Args:
            image: PIL Image in RGBA mode
            config: Effect configuration from theme
            seed: Deterministic seed for randomized elements

        Returns:
            Modified PIL Image in RGBA mode
        """
        pass

    @staticmethod
    def validate_config(config: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and normalize configuration, returning defaults for missing values."""
        pass
```

### JavaScript (Demo A)

```javascript
// demo-a/web/public/effects/base.js

/**
 * Base interface for post-render effects.
 * @typedef {Object} EffectConfig
 * @property {boolean} enabled - Whether effect is active
 */

/**
 * Apply effect to canvas ImageData.
 * @param {ImageData} imageData - Canvas pixel data
 * @param {Object} config - Effect configuration
 * @param {string} [seed] - Deterministic seed
 * @returns {ImageData} Modified pixel data
 */
function applyEffect(imageData, config, seed) {
  // To be implemented by each effect
}
```

---

## Effect Pipeline Flow

### Demo A (MapLibre / Canvas)

```javascript
// Triggered after map render completes
map.on('render', debounce(() => {
  if (!theme.effects) return;

  const canvas = map.getCanvas();
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Apply each enabled effect in order
  let result = imageData;
  if (theme.effects.risograph?.enabled) {
    result = applyRisograph(result, theme.effects.risograph, presetId);
  }
  // Future: if (theme.effects.halftone?.enabled) { ... }

  ctx.putImageData(result, 0, 0);
}, 100));
```

### Demo B (Mapnik / Python)

```python
# After mapnik.render() completes
def render_with_effects(map_obj, theme, preset_id):
    # Standard Mapnik render
    image = mapnik.Image(map_obj.width, map_obj.height)
    mapnik.render(map_obj, image)

    # Convert to PIL
    pil_image = Image.frombytes('RGBA', (image.width(), image.height()),
                                 image.tostring())

    # Apply effects pipeline
    if theme.get('effects'):
        pil_image = apply_effect_pipeline(pil_image, theme['effects'], preset_id)

    # Convert back to bytes
    return pil_image.tobytes()
```

---

## Risograph Effect Specification

### Algorithm

1. **Convert to Grayscale**: Create luminance map from input
   - Uses ITU-R BT.601 coefficients: `L = 0.299*R + 0.587*G + 0.114*B`
   - Luminance normalized to 0.0-1.0 range

2. **Create Color Channels**: For each channel in config:
   - Invert luminance for ink density: `inkDensity = 1.0 - luminance`
   - Tint with channel color: `pixel = 255 - (inkDensity * (255 - color))`
   - Apply integer offset by reading from shifted source position
   - Out-of-bounds pixels remain white (paper color)

3. **Composite Channels**: Blend all channels using multiply mode
   - `result = (layerA * layerB) / 255`
   - Process sequentially for consistent results

4. **Add Grain**: Apply deterministic noise overlay
   - Generate noise texture using seeded Mulberry32 PRNG
   - Apply as additive adjustment: `pixel += (noise - 0.5) * 2 * opacity * 50`

### Determinism Requirements

- Offsets must be integers (no subpixel rendering)
- Noise pattern generated from seeded PRNG (Mulberry32 algorithm)
- Seed derived from: `hash(preset_id)` using SHA-256 (Python) or DJB2 hash (JS)
- All floating-point operations use consistent rounding
- Same algorithm implemented in both Python and JavaScript

### Performance Considerations

- Demo A: Debounce effect application during pan/zoom
- Demo B: Process in chunks for large images (>10MP)
- Both: Cache grain texture for reuse

---

## File Structure

```
demo-a/web/public/effects/
├── index.js              # Effect pipeline dispatcher
├── risograph.js          # Risograph implementation
├── utils.js              # Shared utilities (seeded random, etc.)
└── test-determinism.html # Browser-based determinism tests

demo-b/renderer/src/effects/
├── __init__.py                    # Package init + pipeline function
├── risograph.py                   # Risograph implementation
├── utils.py                       # Shared utilities
└── test_risograph_determinism.py  # Python determinism tests

themes/
└── riso-red-cyan.json    # Example risograph-enabled theme

config/export_presets/
└── A2_Riso_RedCyan_v1.json  # Example export preset using risograph
```

---

## Testing Strategy

### Unit Tests
- Each effect module has isolated tests
- Verify determinism: same input + seed = same output
- Test edge cases: empty image, single pixel, max dimensions

### Integration Tests
- Full render pipeline with effects enabled
- Compare checksums of repeated renders
- Visual regression tests

### Performance Tests
- Measure effect overhead at various resolutions
- Ensure debounce works correctly in Demo A

---

## Future Extensions

The architecture supports adding new effects:

1. Create new effect module (e.g., `halftone.py` / `halftone.js`)
2. Implement the effect interface
3. Add configuration schema to theme spec
4. Register in pipeline dispatcher

No changes to core rendering code required.

---

## Appendix: Configuration Defaults

```json
{
  "risograph": {
    "enabled": false,
    "channels": [
      { "color": "#e84855", "offset": { "x": 2, "y": 1 } },
      { "color": "#2d9cdb", "offset": { "x": -1, "y": 2 } }
    ],
    "grain": {
      "opacity": 0.06,
      "seed": null
    },
    "blendMode": "multiply"
  }
}
```
