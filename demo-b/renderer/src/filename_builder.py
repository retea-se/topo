"""Filename builder utility for export standardization.

Generates deterministic filenames based on preset usage and modification status.
"""

import json
import os
import sys
from pathlib import Path
from typing import Optional, Dict, Any


def load_preset(preset_id: Optional[str]) -> Optional[Dict[str, Any]]:
    """Load export preset by ID.

    Args:
        preset_id: Preset ID (e.g., 'A2_Paper_v1')

    Returns:
        Preset object or None if not found
    """
    if not preset_id:
        return None

    # Try multiple possible paths
    possible_paths = [
        Path(__file__).parent.parent.parent.parent / 'config' / 'export_presets' / f'{preset_id}.json',
        Path('/app/config/export_presets') / f'{preset_id}.json',
        Path(Path.cwd()) / 'config' / 'export_presets' / f'{preset_id}.json'
    ]

    for preset_path in possible_paths:
        if preset_path.exists():
            try:
                with open(preset_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"[FilenameBuilder] Failed to parse preset {preset_id} from {preset_path}: {e}", file=sys.stderr)

    return None


def field_differs(preset: Dict[str, Any], field_path: str, request_value: Any) -> bool:
    """Check if a field value differs from preset default.

    Args:
        preset: Preset object
        field_path: Dot-separated path (e.g., 'render.dpi')
        request_value: Value from request

    Returns:
        True if value differs
    """
    if not preset:
        return False

    parts = field_path.split('.')
    preset_value = preset
    for part in parts:
        if preset_value and isinstance(preset_value, dict):
            preset_value = preset_value.get(part)
        else:
            return True  # Field doesn't exist in preset, consider it different

    # Compare values (handle numbers and strings)
    if isinstance(request_value, (int, float)) and isinstance(preset_value, (int, float)):
        return abs(request_value - preset_value) > 0.001  # Allow small floating point differences

    return request_value != preset_value


def is_preset_modified(preset: Dict[str, Any], request_params: Dict[str, Any]) -> bool:
    """Check if preset was modified (any non-locked field differs from preset).

    Args:
        preset: Preset object
        request_params: Request parameters

    Returns:
        True if preset was modified
    """
    if not preset or 'constraints' not in preset:
        return False

    constraints = preset['constraints']

    # Check DPI if not locked
    if not constraints.get('dpi_locked', False) and 'dpi' in request_params:
        dpi_value = int(request_params['dpi']) if isinstance(request_params['dpi'], (int, str)) else None
        if dpi_value is not None and field_differs(preset, 'render.dpi', dpi_value):
            return True

    # Check format if not locked
    if not constraints.get('format_locked', False) and 'format' in request_params:
        if field_differs(preset, 'render.format', request_params['format']):
            return True

    # Check theme if not locked
    if not constraints.get('theme_locked', False) and 'theme' in request_params:
        if field_differs(preset, 'theme', request_params['theme']):
            return True

    # Check paper size if not locked (width_mm, height_mm)
    if 'width_mm' in request_params or 'height_mm' in request_params:
        preset_paper = preset.get('paper', {})
        preset_width = preset_paper.get('width_mm')
        preset_height = preset_paper.get('height_mm')

        request_width = float(request_params.get('width_mm', 0)) if 'width_mm' in request_params else None
        request_height = float(request_params.get('height_mm', 0)) if 'height_mm' in request_params else None

        if preset_width is not None and request_width is not None:
            if abs(request_width - preset_width) > 0.1:
                return True
        if preset_height is not None and request_height is not None:
            if abs(request_height - preset_height) > 0.1:
                return True

    # Check layers if not locked
    if not constraints.get('layers_locked', False) and 'layers' in request_params:
        request_layers = request_params['layers']
        preset_layers = preset.get('layers', {})

        if isinstance(request_layers, dict) and isinstance(preset_layers, dict):
            for key, value in request_layers.items():
                if preset_layers.get(key) != value:
                    return True

    return False


def sanitize_filename(s: str) -> str:
    """Sanitize string for use in filename (ASCII-safe, filesystem-safe).

    Args:
        s: String to sanitize

    Returns:
        Sanitized string
    """
    if not s:
        return ''

    import re
    # Replace non-ASCII and problematic characters
    sanitized = re.sub(r'[^a-zA-Z0-9_-]', '_', s)
    sanitized = re.sub(r'_{2,}', '_', sanitized)  # Replace multiple underscores with single
    sanitized = sanitized.strip('_')  # Remove leading/trailing underscores
    return sanitized


def build_export_filename(
    bbox_preset: str,
    dpi: int,
    format_type: str,
    preset_id: Optional[str] = None,
    request_params: Optional[Dict[str, Any]] = None
) -> str:
    """Build export filename according to standardization rules.

    Args:
        bbox_preset: Bbox preset name (e.g., 'stockholm_core')
        dpi: DPI value
        format_type: File format ('png', 'pdf', etc.)
        preset_id: Optional export preset ID (e.g., 'A2_Paper_v1')
        request_params: Additional request parameters for modification check

    Returns:
        Generated filename
    """
    # Sanitize bbox_preset
    safe_bbox = sanitize_filename(bbox_preset or 'custom')

    # Sanitize format (remove leading dot if present)
    safe_format = sanitize_filename(format_type or 'png').lstrip('.')

    # Format DPI
    dpi_str = f"{int(dpi) if dpi else 150}dpi"

    # If no preset_id, use custom format
    if not preset_id:
        return f"{safe_bbox}__custom__{dpi_str}.{safe_format}"

    # Load preset to check if modified
    preset = load_preset(preset_id)

    if not preset:
        # Preset not found, but preset_id was provided - treat as custom
        print(f"[FilenameBuilder] Preset {preset_id} not found, using custom format", file=sys.stderr)
        return f"{safe_bbox}__custom__{dpi_str}.{safe_format}"

    # Check if preset was modified
    modified = is_preset_modified(preset, request_params or {})

    # Sanitize preset ID
    safe_preset_id = sanitize_filename(preset_id)

    if modified:
        return f"{safe_bbox}__{safe_preset_id}_modified__{dpi_str}.{safe_format}"
    else:
        return f"{safe_bbox}__{safe_preset_id}__{dpi_str}.{safe_format}"

