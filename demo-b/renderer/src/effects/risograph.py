"""
Risograph Effect Implementation for Demo B.

Simulates the distinctive look of risograph printing:
- Color channel separation with registration offset
- Multiply blend mode for overlapping colors
- Grain/noise texture overlay

This implementation is deterministic: same input + seed = same output.
"""

from typing import Dict, Any, List, Optional, Tuple
from PIL import Image
import numpy as np

from .utils import seed_from_string, generate_noise_texture, hex_to_rgb


# Default configuration
DEFAULT_CONFIG = {
    'channels': [
        {'color': '#e84855', 'offset': {'x': 2, 'y': 1}},  # Red/pink
        {'color': '#2d9cdb', 'offset': {'x': -1, 'y': 2}}  # Cyan/teal
    ],
    'grain': {
        'opacity': 0.06,
        'seed': None
    },
    'blendMode': 'multiply'
}


def validate_config(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate and normalize risograph configuration.

    Args:
        config: Raw configuration from theme

    Returns:
        Normalized configuration with defaults applied
    """
    result = {
        'enabled': config.get('enabled', False),
        'channels': [],
        'grain': {
            'opacity': DEFAULT_CONFIG['grain']['opacity'],
            'seed': None
        },
        'blendMode': config.get('blendMode', DEFAULT_CONFIG['blendMode'])
    }

    # Validate channels
    channels = config.get('channels', DEFAULT_CONFIG['channels'])
    for ch in channels:
        if isinstance(ch, dict) and 'color' in ch:
            offset = ch.get('offset', {'x': 0, 'y': 0})
            result['channels'].append({
                'color': ch['color'],
                'offset': {
                    'x': int(offset.get('x', 0)),
                    'y': int(offset.get('y', 0))
                }
            })

    # Use defaults if no valid channels
    if not result['channels']:
        result['channels'] = DEFAULT_CONFIG['channels']

    # Validate grain
    grain = config.get('grain', {})
    if isinstance(grain, dict):
        result['grain']['opacity'] = float(grain.get('opacity', DEFAULT_CONFIG['grain']['opacity']))
        result['grain']['seed'] = grain.get('seed')

    return result


def apply_risograph(
    image: Image.Image,
    config: Dict[str, Any],
    seed: Optional[str] = None
) -> Image.Image:
    """
    Apply risograph effect to an image.

    Algorithm:
    1. Convert image to grayscale (luminance)
    2. For each color channel:
       - Tint the luminance with channel color
       - Apply integer pixel offset
    3. Composite all channels using multiply blend
    4. Add deterministic grain texture

    Args:
        image: PIL Image in RGBA mode
        config: Risograph configuration from theme
        seed: Deterministic seed for noise (typically preset_id)

    Returns:
        Modified PIL Image in RGBA mode
    """
    # Validate configuration
    config = validate_config(config)

    if not config['enabled']:
        return image

    # Ensure RGBA
    if image.mode != 'RGBA':
        image = image.convert('RGBA')

    width, height = image.size

    # Convert to numpy for efficient processing
    img_array = np.array(image, dtype=np.float32)

    # Extract RGB and Alpha
    rgb = img_array[:, :, :3]
    alpha = img_array[:, :, 3:4]

    # Create luminance (grayscale) using standard weights
    # ITU-R BT.601 luma coefficients
    luminance = (
        0.299 * rgb[:, :, 0] +
        0.587 * rgb[:, :, 1] +
        0.114 * rgb[:, :, 2]
    )

    # Normalize luminance to 0-1
    luminance = luminance / 255.0

    # Process each color channel
    channel_layers = []
    for ch_config in config['channels']:
        layer = _create_channel_layer(luminance, ch_config, width, height)
        channel_layers.append(layer)

    # Composite channels using multiply blend
    result = _composite_multiply(channel_layers, width, height)

    # Add grain texture
    grain_opacity = config['grain']['opacity']
    if grain_opacity > 0:
        grain_seed = config['grain'].get('seed') or seed
        numeric_seed = seed_from_string(grain_seed) if grain_seed else 42
        result = _apply_grain(result, grain_opacity, numeric_seed)

    # Restore alpha channel
    result = np.dstack([result, alpha[:, :, 0]])

    # Clip values and convert back to uint8
    result = np.clip(result, 0, 255).astype(np.uint8)

    return Image.fromarray(result, mode='RGBA')


def _create_channel_layer(
    luminance: np.ndarray,
    channel_config: Dict[str, Any],
    width: int,
    height: int
) -> np.ndarray:
    """
    Create a single color channel layer.

    Args:
        luminance: Grayscale luminance array (0-1)
        channel_config: Channel configuration with color and offset
        width, height: Image dimensions

    Returns:
        RGB numpy array (height, width, 3) as float32
    """
    # Parse channel color
    color = hex_to_rgb(channel_config['color'])
    offset_x = channel_config['offset']['x']
    offset_y = channel_config['offset']['y']

    # Invert luminance for printing effect (dark areas = more ink)
    ink_density = 1.0 - luminance

    # Create RGB layer tinted with channel color
    # Multiply ink density by color, keeping white (paper) in light areas
    layer = np.zeros((height, width, 3), dtype=np.float32)
    for i, c in enumerate(color):
        # Paper white (255) minus ink contribution
        layer[:, :, i] = 255.0 - (ink_density * (255.0 - c))

    # Apply integer offset
    if offset_x != 0 or offset_y != 0:
        layer = _apply_offset(layer, offset_x, offset_y)

    return layer


def _apply_offset(
    layer: np.ndarray,
    offset_x: int,
    offset_y: int
) -> np.ndarray:
    """
    Apply integer pixel offset to a layer.

    Uses numpy roll for efficient shifting, filling edges with white (paper color).

    Args:
        layer: RGB array to offset
        offset_x, offset_y: Integer pixel offsets

    Returns:
        Offset layer with white fill at edges
    """
    height, width = layer.shape[:2]
    result = np.full_like(layer, 255.0)  # White fill

    # Calculate source and destination slices
    src_y_start = max(0, -offset_y)
    src_y_end = min(height, height - offset_y)
    src_x_start = max(0, -offset_x)
    src_x_end = min(width, width - offset_x)

    dst_y_start = max(0, offset_y)
    dst_y_end = min(height, height + offset_y)
    dst_x_start = max(0, offset_x)
    dst_x_end = min(width, width + offset_x)

    # Copy with offset
    if (src_y_end > src_y_start and src_x_end > src_x_start and
        dst_y_end > dst_y_start and dst_x_end > dst_x_start):
        result[dst_y_start:dst_y_end, dst_x_start:dst_x_end] = \
            layer[src_y_start:src_y_end, src_x_start:src_x_end]

    return result


def _composite_multiply(
    layers: List[np.ndarray],
    width: int,
    height: int
) -> np.ndarray:
    """
    Composite multiple layers using multiply blend mode.

    Multiply blend: result = (layer1 * layer2) / 255
    Simulates ink overprinting on paper.

    Args:
        layers: List of RGB arrays to composite
        width, height: Image dimensions

    Returns:
        Composited RGB array
    """
    if not layers:
        return np.full((height, width, 3), 255.0, dtype=np.float32)

    # Start with first layer
    result = layers[0].copy()

    # Multiply blend each subsequent layer
    for layer in layers[1:]:
        # Multiply blend: (a * b) / 255
        result = (result * layer) / 255.0

    return result


def _apply_grain(
    image: np.ndarray,
    opacity: float,
    seed: int
) -> np.ndarray:
    """
    Apply deterministic grain/noise texture.

    Args:
        image: RGB array to modify
        opacity: Grain opacity (0.0 - 1.0)
        seed: Random seed for determinism

    Returns:
        Modified RGB array with grain overlay
    """
    height, width = image.shape[:2]

    # Generate noise texture
    noise = generate_noise_texture(width, height, seed, scale=1.0)

    # Convert noise to RGB adjustment (-1 to 1 range, centered at 0)
    noise_adjustment = (noise - 0.5) * 2.0 * opacity * 50.0  # Max +/- 50 adjustment

    # Apply to all channels
    for i in range(3):
        image[:, :, i] = image[:, :, i] + noise_adjustment

    return image


# Convenience function for testing
def create_test_image(width: int = 200, height: int = 200) -> Image.Image:
    """Create a simple test image with gradient."""
    img = Image.new('RGBA', (width, height), (255, 255, 255, 255))
    pixels = img.load()

    for y in range(height):
        for x in range(width):
            # Create a gradient with some shapes
            gray = int(255 * (1 - y / height))
            if (x - width//2)**2 + (y - height//2)**2 < (min(width, height)//4)**2:
                gray = max(0, gray - 100)
            pixels[x, y] = (gray, gray, gray, 255)

    return img


if __name__ == '__main__':
    # Quick test
    test_img = create_test_image(400, 300)
    test_config = {
        'enabled': True,
        'channels': [
            {'color': '#ff6b9d', 'offset': {'x': 3, 'y': 2}},
            {'color': '#00a8a8', 'offset': {'x': -2, 'y': 3}}
        ],
        'grain': {'opacity': 0.08}
    }

    result = apply_risograph(test_img, test_config, seed='test_preset')
    result.save('/tmp/risograph_test.png')
    print("Test image saved to /tmp/risograph_test.png")
