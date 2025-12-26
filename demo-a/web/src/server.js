const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');

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

// Helper function to check if URL returns 200
function checkUrl(url, timeout = 3000) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? require('https') : http;
    const req = client.get(url, { timeout }, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 204);
      res.on('data', () => {}); // Consume response
      res.on('end', () => {});
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

// API endpoint to check coverage for a preset
// Returns which layers are available (OSM, contours, hillshade)
app.get('/api/coverage/:preset', async (req, res) => {
  const preset = req.params.preset;
  const tileserverUrl = TILESERVER_URL_INTERNAL;
  const hillshadeUrl = HILLSHADE_URL_INTERNAL;
  
  const coverage = {
    preset,
    osm: false,
    contours: false,
    hillshade: false
  };

  try {
    // Check OSM source
    const osmSource = preset === 'svealand' ? 'osm_svealand' : preset === 'stockholm_wide' ? 'osm' : 'osm_core';
    coverage.osm = await checkUrl(`${tileserverUrl}/${osmSource}`);

    // Check contour sources (only if preset-specific)
    let contourSource = 'contours_10m';
    if (preset === 'svealand') {
      contourSource = 'contours_svealand_10m';
    } else if (preset === 'stockholm_wide') {
      contourSource = 'contours_wide_10m';
    }
    coverage.contours = await checkUrl(`${tileserverUrl}/${contourSource}`);

    // Check hillshade (test one tile at reasonable zoom)
    // For svealand, use a tile that should exist if hillshade is available
    const testTileUrl = `${hillshadeUrl}/tiles/hillshade/${preset}/10/567/297.png`;
    coverage.hillshade = await checkUrl(testTileUrl);

    res.json(coverage);
  } catch (err) {
    console.error('Error checking coverage:', err);
    // Return safe defaults (OSM assumed available, terrain assumed missing)
    res.json({
      preset,
      osm: true,
      contours: false,
      hillshade: false
    });
  }
});

// Explicit fallback to index.html for SPA-style routing
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Demo A web server listening on port ${PORT}`);
});

