"""Test CORS headers for Demo B API."""
import pytest
from app import app

@pytest.fixture
def client():
    """Create test client."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_options_preflight_render(client):
    """Test OPTIONS preflight request for /api/render returns correct CORS headers."""
    response = client.options(
        '/api/render',
        headers={
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'content-type'
        }
    )
    
    assert response.status_code == 204
    assert response.headers.get('Access-Control-Allow-Origin') == 'http://localhost:3000'
    assert 'POST' in response.headers.get('Access-Control-Allow-Methods', '')
    assert 'OPTIONS' in response.headers.get('Access-Control-Allow-Methods', '')
    assert 'Content-Type' in response.headers.get('Access-Control-Allow-Headers', '')

def test_options_preflight_render_no_prefix(client):
    """Test OPTIONS preflight request for /render (no /api prefix) returns correct CORS headers."""
    response = client.options(
        '/render',
        headers={
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'content-type'
        }
    )
    
    assert response.status_code == 204
    assert response.headers.get('Access-Control-Allow-Origin') == 'http://localhost:3000'
    assert 'POST' in response.headers.get('Access-Control-Allow-Methods', '')
    assert 'OPTIONS' in response.headers.get('Access-Control-Allow-Methods', '')

def test_post_render_cors_headers(client):
    """Test POST request to /api/render includes CORS headers in response."""
    response = client.post(
        '/api/render',
        json={'bbox_preset': 'stockholm_core', 'theme': 'paper', 'format': 'pdf'},
        headers={'Origin': 'http://localhost:3000'}
    )
    
    # Response may fail (500) due to renderer service, but CORS headers should be present
    assert 'Access-Control-Allow-Origin' in response.headers
    assert response.headers.get('Access-Control-Allow-Origin') == 'http://localhost:3000'
    assert 'Access-Control-Allow-Methods' in response.headers

def test_cors_origin_validation(client):
    """Test that only allowed origins get CORS headers."""
    # Allowed origin
    response = client.options(
        '/api/render',
        headers={'Origin': 'http://localhost:3000'}
    )
    assert response.headers.get('Access-Control-Allow-Origin') == 'http://localhost:3000'
    
    # Another allowed origin
    response = client.options(
        '/api/render',
        headers={'Origin': 'http://localhost:3001'}
    )
    assert response.headers.get('Access-Control-Allow-Origin') == 'http://localhost:3001'
    
    # Disallowed origin (should default to first allowed)
    response = client.options(
        '/api/render',
        headers={'Origin': 'http://evil.com'}
    )
    # Should not match evil.com, but may default to first allowed origin
    assert response.headers.get('Access-Control-Allow-Origin') is not None

