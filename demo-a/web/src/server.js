const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const TILESERVER_URL = process.env.TILESERVER_URL || 'http://localhost:8080';
const HILLSHADE_TILES_URL = process.env.HILLSHADE_TILES_URL || 'http://localhost:8081';

// Serve static files (public is at /app/public, server.js is in /app/src)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve themes directory (mounted via volume at /app/themes)
app.use('/themes', express.static('/app/themes'));

// Serve theme-to-style converter
app.get('/themeToStyle.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'themeToStyle.js'));
});

// API endpoint to get configuration
app.get('/api/config', (req, res) => {
  res.json({
    tileserverUrl: TILESERVER_URL,
    hillshadeTilesUrl: HILLSHADE_TILES_URL
  });
});

// Explicit fallback to index.html for SPA-style routing
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Demo A web server listening on port ${PORT}`);
});

