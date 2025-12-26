const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || 'http://localhost:5000';

app.use(express.json());
// Serve static files (public is at /app/public, server.js is in /app/src)
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/config', (req, res) => {
  // Return local proxy URL for browser access
  res.json({ apiUrl: '' });
});

// API endpoint to list available themes
app.get('/api/themes', (req, res) => {
  const themesDir = '/app/themes';
  try {
    const files = fs.readdirSync(themesDir);
    const themes = files
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const id = f.replace('.json', '');
        // Format name: capitalize, replace dashes/underscores with spaces
        const name = id.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        return { id, name, file: f };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    res.json(themes);
  } catch (err) {
    console.error('Error reading themes directory:', err);
    res.status(500).json({ error: 'Failed to load themes' });
  }
});

// Proxy render requests to the API service
app.post('/api/render', async (req, res) => {
  try {
    const response = await fetch(`${API_URL}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      // Try to parse as JSON for validation errors
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorJson = await response.json();
        return res.status(response.status).json(errorJson);
      }
      const errorText = await response.text();
      return res.status(response.status).send(errorText);
    }

    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy validate requests to the API service
app.post('/api/validate', async (req, res) => {
  try {
    const response = await fetch(`${API_URL}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const json = await response.json();
    res.status(response.status).json(json);
  } catch (error) {
    console.error('Validate proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy preset-limits requests to the API service
app.get('/api/preset-limits', async (req, res) => {
  try {
    const response = await fetch(`${API_URL}/preset-limits`);
    const json = await response.json();
    res.status(response.status).json(json);
  } catch (error) {
    console.error('Preset-limits proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Demo B web server listening on port ${PORT}`);
});





