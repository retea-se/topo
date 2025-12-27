const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

// JSON body parser for POST endpoints
app.use(express.json());
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

// API endpoint to get bbox presets (single source of truth)
const BBOX_PRESETS_PATH = '/app/config/bbox_presets.json';

app.get('/api/bbox-presets', (req, res) => {
  try {
    if (fs.existsSync(BBOX_PRESETS_PATH)) {
      const config = JSON.parse(fs.readFileSync(BBOX_PRESETS_PATH, 'utf8'));
      res.json(config.presets);
    } else {
      // Fallback if config file doesn't exist
      res.json({
        stockholm_core: {
          name: 'Stockholm Core',
          bbox: { west: 17.90, south: 59.32, east: 18.08, north: 59.35 },
          center: [18.04, 59.335],
          zoom: 13
        },
        stockholm_wide: {
          name: 'Stockholm Wide',
          bbox: { west: 17.75, south: 59.28, east: 18.25, north: 59.40 },
          center: [18.0, 59.34],
          zoom: 11
        },
        svealand: {
          name: 'Svealand',
          bbox: { west: 14.5, south: 58.5, east: 19.0, north: 61.0 },
          center: [16.75, 59.75],
          zoom: 8
        }
      });
    }
  } catch (err) {
    console.error('Error reading bbox presets:', err);
    res.status(500).json({ error: 'Failed to load bbox presets' });
  }
});

// ============================================================================
// Export Presets API (Phase 9)
// ============================================================================

const EXPORT_PRESETS_DIR = '/app/config/export_presets';

// Helper: Load all export presets
function loadExportPresets() {
  const presets = [];
  try {
    const files = fs.readdirSync(EXPORT_PRESETS_DIR);
    for (const f of files) {
      if (f.startsWith('_') || !f.endsWith('.json')) continue;
      const filepath = path.join(EXPORT_PRESETS_DIR, f);
      const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      presets.push(data);
    }
  } catch (err) {
    console.error('Error loading export presets:', err);
  }
  return presets;
}

// Helper: Load a specific export preset by ID
function loadExportPreset(presetId) {
  const filepath = path.join(EXPORT_PRESETS_DIR, `${presetId}.json`);
  if (!fs.existsSync(filepath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

// Helper: Validate overrides against preset constraints
function validateOverrides(preset, overrides) {
  const errors = [];
  const warnings = [];
  const constraints = preset.constraints;

  // DPI validation
  if (overrides.dpi !== undefined) {
    if (constraints.dpi_locked) {
      errors.push({
        field: 'dpi',
        message: `DPI ar last for preset '${preset.display_name}' och kan inte andras.`
      });
    } else if (overrides.dpi < constraints.dpi_min || overrides.dpi > constraints.dpi_max) {
      errors.push({
        field: 'dpi',
        message: `DPI ${overrides.dpi} ar utanfor tillatet intervall. Valj ett varde mellan ${constraints.dpi_min} och ${constraints.dpi_max}.`
      });
    }
  }

  // Format validation
  if (overrides.format !== undefined) {
    if (constraints.format_locked) {
      errors.push({
        field: 'format',
        message: `Format ar last for preset '${preset.display_name}' och kan inte andras.`
      });
    } else if (!constraints.allowed_formats.includes(overrides.format)) {
      errors.push({
        field: 'format',
        message: `Format '${overrides.format}' stods inte. Tillgangliga format: ${constraints.allowed_formats.join(', ')}.`
      });
    }
  }

  // Layers validation
  if (overrides.layers !== undefined && constraints.layers_locked) {
    errors.push({
      field: 'layers',
      message: `Lager ar lasta for preset '${preset.display_name}' och kan inte andras.`
    });
  }

  // Theme validation
  if (overrides.theme !== undefined && constraints.theme_locked) {
    errors.push({
      field: 'theme',
      message: `Tema ar last for preset '${preset.display_name}' och kan inte andras.`
    });
  }

  // BBox validation
  if (overrides.bbox_preset !== undefined && constraints.bbox_locked) {
    errors.push({
      field: 'bbox_preset',
      message: `Geografiskt omrade ar last for preset '${preset.display_name}' och kan inte andras.`
    });
  }

  // Deprecation warning
  if (preset.deprecated) {
    warnings.push({
      type: 'deprecated',
      message: `Preset '${preset.id}' ar utfasat. Anvand '${preset.superseded_by || 'nyare version'}' istallet.`
    });
  }

  return { errors, warnings };
}

// Helper: Merge preset with overrides
function mergePresetWithOverrides(preset, overrides) {
  const result = JSON.parse(JSON.stringify(preset)); // Deep copy

  if (overrides.dpi !== undefined) {
    result.render.dpi = overrides.dpi;
  }
  if (overrides.format !== undefined) {
    result.render.format = overrides.format;
  }
  if (overrides.layers !== undefined) {
    Object.assign(result.layers, overrides.layers);
  }
  if (overrides.theme !== undefined) {
    result.theme = overrides.theme;
  }
  if (overrides.bbox_preset !== undefined) {
    result.bbox_preset = overrides.bbox_preset;
  }

  return result;
}

// GET /api/export-presets - List all available export presets
app.get('/api/export-presets', (req, res) => {
  try {
    const presets = loadExportPresets();
    const summary = presets.map(p => ({
      id: p.id,
      display_name: p.display_name,
      description: p.description || '',
      version: p.version,
      deprecated: p.deprecated || false,
      superseded_by: p.superseded_by || null,
      bbox_preset: p.bbox_preset,
      theme: p.theme,
      paper_format: p.paper.format
    }));
    res.json({ presets: summary });
  } catch (err) {
    console.error('Error listing export presets:', err);
    res.status(500).json({ error: 'Failed to load export presets' });
  }
});

// GET /api/export-presets/:id - Get a specific export preset
app.get('/api/export-presets/:id', (req, res) => {
  try {
    const preset = loadExportPreset(req.params.id);
    if (!preset) {
      return res.status(404).json({
        error: 'Preset not found',
        message: `Export preset '${req.params.id}' hittades inte.`
      });
    }
    res.json({ preset });
  } catch (err) {
    console.error('Error loading export preset:', err);
    res.status(500).json({ error: 'Failed to load export preset' });
  }
});

// POST /api/validate-preset - Validate preset with optional overrides
app.post('/api/validate-preset', (req, res) => {
  try {
    const { preset_id, overrides = {} } = req.body;

    if (!preset_id) {
      return res.status(400).json({
        valid: false,
        errors: [{ field: 'preset_id', message: 'preset_id ar obligatoriskt.' }]
      });
    }

    const preset = loadExportPreset(preset_id);
    if (!preset) {
      return res.status(404).json({
        valid: false,
        errors: [{ field: 'preset_id', message: `Export preset '${preset_id}' hittades inte.` }]
      });
    }

    // Validate overrides against constraints
    const { errors, warnings } = validateOverrides(preset, overrides);

    if (errors.length > 0) {
      return res.json({
        valid: false,
        errors,
        warnings
      });
    }

    // Merge and create effective config
    const effective_config = mergePresetWithOverrides(preset, overrides);

    // Calculate pixel dimensions for validation
    const width_px = Math.round(effective_config.paper.width_mm * effective_config.render.dpi / 25.4);
    const height_px = Math.round(effective_config.paper.height_mm * effective_config.render.dpi / 25.4);
    const megapixels = (width_px * height_px) / 1000000;
    const MAX_MEGAPIXELS = 100;

    if (megapixels > MAX_MEGAPIXELS) {
      errors.push({
        field: 'render',
        message: `Den resulterande bilden (${megapixels.toFixed(1)} megapixel) overskrider maxgransen (${MAX_MEGAPIXELS} megapixel). Minska DPI eller pappersformat.`
      });
      return res.json({
        valid: false,
        errors,
        warnings
      });
    }

    // Add dimension info to response
    effective_config._computed = {
      width_px,
      height_px,
      megapixels: megapixels.toFixed(2),
      modified: Object.keys(overrides).length > 0
    };

    res.json({
      valid: true,
      errors: [],
      warnings,
      effective_config
    });
  } catch (err) {
    console.error('Error validating preset:', err);
    res.status(500).json({
      valid: false,
      errors: [{ field: 'server', message: 'Internt serverfel vid validering.' }]
    });
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

// Interactive Print Editor
app.get('/editor', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'editor.html'));
});

// API endpoint to get bbox presets
app.get('/api/presets', (req, res) => {
  const presetsFile = '/app/config/bbox_presets.json';
  try {
    const data = fs.readFileSync(presetsFile, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    // Fallback presets
    res.json({
      presets: [
        { name: 'stockholm_core', bbox_wgs84: [17.90, 59.32, 18.08, 59.35], description: 'Central Stockholm' },
        { name: 'stockholm_wide', bbox_wgs84: [17.75, 59.28, 18.25, 59.40], description: 'Greater Stockholm' },
        { name: 'svealand', bbox_wgs84: [14.5, 58.5, 19.0, 61.0], description: 'Svealand region' }
      ]
    });
  }
});

app.listen(PORT, () => {
  console.log(`Demo A web server listening on port ${PORT}`);
});

