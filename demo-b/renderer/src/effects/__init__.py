"""
Effect Pipeline for Demo B (Mapnik renderer).

This module provides post-render visual effects that are applied
after Mapnik generates the base map image.

Usage:
    from effects import apply_effect_pipeline

    # After Mapnik render
    pil_image = apply_effect_pipeline(pil_image, theme.get('effects'), preset_id)
"""

from typing import Dict, Any, Optional
from PIL import Image

from .risograph import apply_risograph


def apply_effect_pipeline(
    image: Image.Image,
    effects_config: Optional[Dict[str, Any]],
    seed: Optional[str] = None
) -> Image.Image:
    """
    Apply all enabled effects to an image.

    Args:
        image: PIL Image (will be converted to RGBA if needed)
        effects_config: The 'effects' section from theme JSON
        seed: Deterministic seed (typically preset_id)

    Returns:
        Modified PIL Image in RGBA mode
    """
    if not effects_config:
        return image

    # Ensure RGBA mode for consistent processing
    if image.mode != 'RGBA':
        image = image.convert('RGBA')

    # Apply risograph effect if enabled
    riso_config = effects_config.get('risograph')
    if riso_config and riso_config.get('enabled', False):
        image = apply_risograph(image, riso_config, seed)

    # Future effects would be added here:
    # halftone_config = effects_config.get('halftone')
    # if halftone_config and halftone_config.get('enabled', False):
    #     image = apply_halftone(image, halftone_config, seed)

    return image


__all__ = ['apply_effect_pipeline', 'apply_risograph']
