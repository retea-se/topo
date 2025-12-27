"""
Utility functions for effects processing.

All random operations use deterministic seeding for reproducibility.
"""

import hashlib
from typing import Tuple
import numpy as np


def seed_from_string(s: str) -> int:
    """
    Generate a deterministic integer seed from a string.

    Args:
        s: Input string (e.g., preset_id)

    Returns:
        Integer seed for numpy random generator
    """
    if not s:
        return 42  # Default seed for reproducibility
    # Use SHA256 and take first 8 bytes as integer
    hash_bytes = hashlib.sha256(s.encode('utf-8')).digest()[:8]
    return int.from_bytes(hash_bytes, byteorder='big') % (2**31)


def generate_noise_texture(
    width: int,
    height: int,
    seed: int,
    scale: float = 1.0
) -> np.ndarray:
    """
    Generate deterministic noise texture.

    Args:
        width: Texture width in pixels
        height: Texture height in pixels
        seed: Random seed for determinism
        scale: Noise intensity multiplier (0.0 - 1.0)

    Returns:
        numpy array of shape (height, width) with values 0.0-1.0
    """
    rng = np.random.default_rng(seed)
    noise = rng.random((height, width), dtype=np.float32)
    return noise * scale


def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    """
    Convert hex color string to RGB tuple.

    Args:
        hex_color: Color in format '#RRGGBB' or 'RRGGBB'

    Returns:
        Tuple of (R, G, B) values 0-255
    """
    hex_color = hex_color.lstrip('#')
    if len(hex_color) != 6:
        raise ValueError(f"Invalid hex color: {hex_color}")
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def rgb_to_hex(r: int, g: int, b: int) -> str:
    """
    Convert RGB values to hex string.

    Args:
        r, g, b: Color components 0-255

    Returns:
        Hex color string '#RRGGBB'
    """
    return f"#{r:02x}{g:02x}{b:02x}"


def clamp(value: float, min_val: float = 0.0, max_val: float = 255.0) -> float:
    """Clamp a value to a range."""
    return max(min_val, min(max_val, value))
