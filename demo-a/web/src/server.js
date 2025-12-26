const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const TILESERVER_URL = process.env.TILESERVER_URL || 'http://localhost:8080';
const HILLSHADE_TILES_URL = process.env.HILLSHADE_TILES_URL || 'http://localhost:8081';

// Docker-internal URLs for container-to-container communication
const TILESERVER_URL_INTERNAL = process.env.TILESERVER_URL_INTERNAL || 'http://demo-a-tileserver:3000';
const HILLSHADE_URL_INTERNAL = process.env.HILLSHADE_URL_INTERNAL || 'http://demo-a-hillshade-server:80';

// Serve static files (public is at /app/public, server.js is in /app/src)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve themes directory (mounted via volume at /app/themes)
app.use('/themes', express.static('/app/themes'));

// Serve theme-to-style converter
app.get('/themeToStyle.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'themeToStyle.js'));
});

// API endpoint to get configuration
// Detects if request is from Docker-internal (exporter) or external (browser)
app.get('/api/config', (req, res) => {
  // Check if request comes from within Docker network
  // Docker-internal requests typically come from container hostnames like 'demo-a-web'
  const host = req.get('host') || '';
  const referer = req.get('referer') || '';
  const isInternal = host.includes('demo-a-web') || referer.includes('demo-a-web');

  if (isInternal) {
    // Container-to-container: use Docker service names
    res.json({
      tileserverUrl: TILESERVER_URL_INTERNAL,
      hillshadeTilesUrl: HILLSHADE_URL_INTERNAL
    });
  } else {
    // Browser access: use localhost with mapped ports
    res.json({
      tileserverUrl: 'http://localhost:8080',
      hillshadeTilesUrl: 'http://localhost:8081'
    });
  }
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

// Explicit fallback to index.html for SPA-style routing
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Demo A web server listening on port ${PORT}`);
});

