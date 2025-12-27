"""Demo B API server."""
from flask import Flask, request, jsonify
import requests
import os

app = Flask(__name__)
_renderer = os.getenv('RENDERER_SERVICE', 'demo-b-renderer:5001')
RENDERER_SERVICE = _renderer if _renderer.startswith('http') else f'http://{_renderer}'

# Allowed origins for CORS (development)
ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:3001',
]

def get_cors_headers(origin=None):
    """Get CORS headers for response."""
    headers = {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    }
    
    # Check if origin is allowed
    if origin and origin in ALLOWED_ORIGINS:
        headers['Access-Control-Allow-Origin'] = origin
    elif origin is None:
        # Default to first allowed origin if no origin specified
        headers['Access-Control-Allow-Origin'] = ALLOWED_ORIGINS[0]
    
    return headers

@app.before_request
def handle_preflight():
    """Handle CORS preflight requests."""
    if request.method == 'OPTIONS':
        origin = request.headers.get('Origin')
        headers = get_cors_headers(origin)
        return '', 204, headers

@app.after_request
def add_cors_headers(response):
    """Add CORS headers to all responses."""
    origin = request.headers.get('Origin')
    headers = get_cors_headers(origin)
    for key, value in headers.items():
        response.headers[key] = value
    return response

def _render_handler():
    """Render endpoint handler - proxies to renderer service."""
    data = request.json

    try:
        response = requests.post(
            f"{RENDERER_SERVICE}/render",
            json=data,
            timeout=300
        )

        # Handle validation errors (400) with JSON response
        if response.status_code == 400:
            return response.json(), 400

        response.raise_for_status()

        return response.content, response.status_code, {
            'Content-Type': response.headers.get('Content-Type', 'image/png')
        }
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500

@app.route('/render', methods=['POST', 'OPTIONS'])
def render():
    """Render endpoint - proxies to renderer service."""
    return _render_handler()

@app.route('/api/render', methods=['POST', 'OPTIONS'])
def api_render():
    """API render endpoint - same as /render but with /api prefix."""
    return _render_handler()

@app.route('/validate', methods=['POST'])
def validate():
    """Validate render parameters - proxies to renderer service."""
    data = request.json

    try:
        response = requests.post(
            f"{RENDERER_SERVICE}/validate",
            json=data,
            timeout=10
        )
        return response.json(), response.status_code
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500

@app.route('/preset-limits', methods=['GET'])
def get_preset_limits():
    """Get preset limits configuration - proxies to renderer service."""
    try:
        response = requests.get(
            f"{RENDERER_SERVICE}/preset-limits",
            timeout=10
        )
        return response.json(), response.status_code
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)







