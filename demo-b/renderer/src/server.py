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

def load_bbox_preset(preset_name: str) -> tuple:
    """Load bbox preset and convert to EPSG:3857."""
    # For now, use hardcoded presets - in production, load from config
    presets = {
        'stockholm_core': (17.90, 59.32, 18.08, 59.35),  # WGS84
        'stockholm_wide': (17.75, 59.28, 18.25, 59.40)   # WGS84
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
        result = renderer.render(theme, bbox_3857, output_size, dpi, format_type)

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)

