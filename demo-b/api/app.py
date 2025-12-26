"""Demo B API server."""
from flask import Flask, request, jsonify
import requests
import os

app = Flask(__name__)
_renderer = os.getenv('RENDERER_SERVICE', 'demo-b-renderer:5001')
RENDERER_SERVICE = _renderer if _renderer.startswith('http') else f'http://{_renderer}'

@app.route('/render', methods=['POST'])
def render():
    """Render endpoint - proxies to renderer service."""
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





