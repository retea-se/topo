"""Renderer service server."""
from flask import Flask, request, send_file, jsonify
import io
import json
import os
import sys
from pathlib import Path
from mapnik_renderer import MapnikRenderer
from theme_to_mapnik import load_theme

app = Flask(__name__)
renderer = MapnikRenderer()

THEMES_DIR = Path('/app/themes') if Path('/app/themes').exists() else Path(__file__).parent.parent.parent.parent / 'themes'
LIMITS_CONFIG = None

def load_preset_limits():
    """Load preset limits configuration."""
    global LIMITS_CONFIG
    if LIMITS_CONFIG is not None:
        return LIMITS_CONFIG

    config_path = Path('/app/config/preset_limits.json')
    if not config_path.exists():
        config_path = Path(__file__).parent.parent.parent.parent / 'prep-service' / 'config' / 'preset_limits.json'

    if config_path.exists():
        try:
            with open(config_path) as f:
                LIMITS_CONFIG = json.load(f)
                print(f"Loaded preset limits from {config_path}", file=sys.stderr)
        except Exception as e:
            print(f"Warning: Failed to load preset limits: {e}", file=sys.stderr)
            LIMITS_CONFIG = {}
    else:
        LIMITS_CONFIG = {}

    return LIMITS_CONFIG

def validate_render_request(preset: str, dpi: int, width_mm: float, height_mm: float) -> dict:
    """
    Validate render request against preset limits.

    Returns:
        dict with keys:
        - valid: bool
        - error: str (if not valid)
        - warnings: list of str
        - info: dict with computed values
    """
    limits = load_preset_limits()
    result = {'valid': True, 'error': None, 'warnings': [], 'info': {}}

    if not limits or 'presets' not in limits:
        # No limits configured, allow all
        return result

    preset_config = limits['presets'].get(preset)
    if not preset_config:
        # Unknown preset, allow but warn
        result['warnings'].append(f"No limits configured for preset '{preset}'")
        return result

    preset_limits = preset_config.get('limits', {})

    # Calculate output dimensions
    width_px = round(width_mm * dpi / 25.4)
    height_px = round(height_mm * dpi / 25.4)
    total_pixels = width_px * height_px

    result['info'] = {
        'width_px': width_px,
        'height_px': height_px,
        'total_pixels': total_pixels,
        'complexity': preset_config.get('complexity', 'unknown')
    }

    # Check max DPI
    max_dpi = preset_limits.get('max_dpi', 600)
    if dpi > max_dpi:
        result['valid'] = False
        result['error'] = f"DPI {dpi} exceeds maximum {max_dpi} for preset '{preset}'. Reduce DPI or choose a smaller area."
        return result

    # Check DPI warning threshold
    dpi_warning = preset_limits.get('warning_thresholds', {}).get('dpi_warning', 450)
    if dpi > dpi_warning:
        result['warnings'].append(f"High DPI ({dpi}) may result in slow rendering for '{preset}'")

    # Check total pixels against hard limit
    hard_limits = limits.get('validation_rules', {}).get('hard_limits', {})
    max_pixels = hard_limits.get('max_pixels_total', 100000000)
    if total_pixels > max_pixels:
        result['valid'] = False
        result['error'] = f"Requested image size ({total_pixels:,} pixels) exceeds maximum ({max_pixels:,} pixels). Reduce DPI or format size."
        return result

    # Warn for format not in allowed list
    format_dims = limits.get('format_dimensions_mm', {})
    allowed_formats = preset_limits.get('allowed_formats', [])

    # Try to identify the requested format
    detected_format = None
    for fmt, dims in format_dims.items():
        if (abs(dims['width'] - width_mm) < 1 and abs(dims['height'] - height_mm) < 1) or \
           (abs(dims['height'] - width_mm) < 1 and abs(dims['width'] - height_mm) < 1):
            detected_format = fmt
            break

    if detected_format:
        result['info']['detected_format'] = detected_format
        if allowed_formats and detected_format not in allowed_formats:
            result['valid'] = False
            result['error'] = f"Format {detected_format} is not supported for preset '{preset}'. Allowed formats: {', '.join(allowed_formats)}."
            return result

        # Check format warning list
        format_warnings = preset_limits.get('warning_thresholds', {}).get('format_warning', [])
        if detected_format in format_warnings:
            result['warnings'].append(f"Format {detected_format} may produce very large files for '{preset}'")

    # Estimate render time
    est_times = preset_limits.get('warning_thresholds', {}).get('estimated_render_time_seconds', {})
    if detected_format:
        key = f"{detected_format}_{dpi}"
        if key in est_times:
            result['info']['estimated_render_time'] = est_times[key]
            if est_times[key] > 300:
                result['warnings'].append(f"Estimated render time: {est_times[key]}s (may take several minutes)")

    return result

def load_bbox_preset(preset_name: str) -> tuple:
    """Load bbox preset and convert to EPSG:3857."""
    # Try to load from config file, fallback to hardcoded presets
    config_path = Path('/app/config/bbox_presets.json')
    presets = {}

    if config_path.exists():
        try:
            with open(config_path) as f:
                config = json.load(f)
                for preset in config.get('presets', []):
                    bbox = preset['bbox_wgs84']
                    presets[preset['name']] = tuple(bbox)
        except Exception as e:
            print(f"Warning: Failed to load presets from config: {e}", file=sys.stderr)

    # Fallback to hardcoded presets if config not found or empty
    if not presets:
        presets = {
            'stockholm_core': (17.90, 59.32, 18.08, 59.35),  # WGS84
            'stockholm_wide': (17.75, 59.28, 18.25, 59.40),  # WGS84
            'svealand': (14.5, 58.5, 19.0, 61.0)  # WGS84
        }

    if preset_name not in presets:
        raise ValueError(f"Unknown preset: {preset_name}")

    # Convert WGS84 to EPSG:3857 (simplified - would use pyproj in production)
    # For now, approximate conversion
    min_lon, min_lat, max_lon, max_lat = presets[preset_name]

    # Simple approximation (not precise, but works for Stockholm area)
    import math
    earth_radius = 6378137.0
    min_x = math.radians(min_lon) * earth_radius
    max_x = math.radians(max_lon) * earth_radius
    min_y = math.log(math.tan(math.pi / 4 + math.radians(min_lat) / 2)) * earth_radius
    max_y = math.log(math.tan(math.pi / 4 + math.radians(max_lat) / 2)) * earth_radius

    return (min_x, min_y, max_x, max_y)

@app.route('/render', methods=['POST'])
def render():
    """Render map endpoint."""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        # Parse parameters
        preset = data.get('bbox_preset', 'stockholm_core')
        theme_name = data.get('theme', 'paper')
        render_mode = data.get('render_mode', 'print')
        dpi = int(data.get('dpi', 150))
        width_mm = float(data.get('width_mm', 420))
        height_mm = float(data.get('height_mm', 594))
        format_type = data.get('format', 'png')

        # Validate render request against preset limits
        validation = validate_render_request(preset, dpi, width_mm, height_mm)
        if not validation['valid']:
            return jsonify({
                'error': validation['error'],
                'validation': validation
            }), 400

        # Log warnings if any
        if validation['warnings']:
            for warning in validation['warnings']:
                print(f"Warning: {warning}", file=sys.stderr)

        # Layer visibility (default: all layers visible)
        layers = data.get('layers', {
            'hillshade': True,
            'water': True,
            'parks': True,
            'roads': True,
            'buildings': True,
            'contours': True
        })

        # Calculate output size in pixels (use round for correct dimensions)
        width_px = round(width_mm * dpi / 25.4)
        height_px = round(height_mm * dpi / 25.4)
        output_size = (width_px, height_px)

        # Load theme
        theme_path = THEMES_DIR / f"{theme_name}.json"
        if not theme_path.exists():
            return jsonify({'error': f'Themes directory not found: {THEMES_DIR}'}), 500

        theme = load_theme(str(theme_path))

        # Get bbox
        bbox_3857 = load_bbox_preset(preset)

        # Render
        result = renderer.render(theme, bbox_3857, output_size, dpi, format_type, preset, layers)

        return send_file(
            io.BytesIO(result),
            mimetype='image/png' if format_type == 'png' else 'application/pdf',
            as_attachment=False
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({'status': 'ok'})

@app.route('/validate', methods=['POST'])
def validate():
    """Validate render parameters without actually rendering."""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        preset = data.get('bbox_preset', 'stockholm_core')
        dpi = int(data.get('dpi', 150))
        width_mm = float(data.get('width_mm', 420))
        height_mm = float(data.get('height_mm', 594))

        validation = validate_render_request(preset, dpi, width_mm, height_mm)
        return jsonify(validation)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/preset-limits', methods=['GET'])
def get_preset_limits():
    """Return preset limits configuration for client-side validation."""
    limits = load_preset_limits()
    return jsonify(limits)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)

