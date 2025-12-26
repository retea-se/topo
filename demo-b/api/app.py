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
        response.raise_for_status()

        return response.content, response.status_code, {
            'Content-Type': response.headers.get('Content-Type', 'image/png')
        }
    except requests.RequestException as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)



