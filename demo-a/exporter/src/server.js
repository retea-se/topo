const express = require('express');
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { buildExportFilename } = require('./filenameBuilder');

const app = express();
const PORT = process.env.PORT || 8082;
const WEB_URL = process.env.WEB_URL || 'http://demo-a-web:3000';
const EXPORTS_DIR = process.env.EXPORTS_DIR || '/exports/demo-a';

// Ensure exports directory exists
if (!fs.existsSync(EXPORTS_DIR)) {
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

// CORS middleware for browser fetch requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'demo-a-exporter' });
});

app.get('/render', async (req, res) => {
  const {
    bbox_preset,
    custom_bbox,
    theme,
    render_mode,
    dpi = 150,
    width_mm = 420,
    height_mm = 594,
    title = '',
    subtitle = '',
    attribution = '',
    layers = '{}',
    preset_id
  } = req.query;

  const width_px = Math.round(width_mm * dpi / 25.4);
  const height_px = Math.round(height_mm * dpi / 25.4);

  // Parse layer settings
  let layerSettings = {};
  try {
    layerSettings = JSON.parse(layers);
  } catch (e) {
    console.warn('Could not parse layers:', layers);
  }

  console.log(`[Exporter] Starting export:`);
  console.log(`  Preset: ${bbox_preset}, Custom bbox: ${custom_bbox || 'none'}`);
  console.log(`  Theme: ${theme}, Mode: ${render_mode}`);
  console.log(`  Size: ${width_mm}x${height_mm}mm @ ${dpi}dpi = ${width_px}x${height_px}px`);
  console.log(`  Title: "${title}", Subtitle: "${subtitle}"`);
  console.log(`  Layers:`, layerSettings);

  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: width_px, height: height_px, deviceScaleFactor: 1.0 },
      locale: 'en-US',
      timezoneId: 'UTC'
    });

    const page = await context.newPage();

    // Set fixed timezone and mock Date.now() for determinism
    await page.addInitScript(() => {
      const fixedTime = new Date('2024-01-01T12:00:00Z').getTime();
      Date.now = () => fixedTime;
    });

    // Build URL with all parameters
    const urlParams = new URLSearchParams({
      bbox_preset: bbox_preset || 'stockholm_core',
      theme: theme || 'paper',
      render_mode: render_mode || 'print'
    });

    // Add custom bbox if specified
    if (custom_bbox) {
      urlParams.set('custom_bbox', custom_bbox);
    }

    // Add layer visibility settings
    if (Object.keys(layerSettings).length > 0) {
      urlParams.set('layers', layers);
    }

    const url = `${WEB_URL}/?${urlParams.toString()}`;
    console.log(`[Exporter] Loading: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle', timeout: 180000 });

    // Wait for map to load
    await page.waitForFunction(() => window.map && window.map.loaded(), { timeout: 60000 });

    // Wait for map style to be loaded
    await page.waitForFunction(() => {
      return window.map && window.map.loaded() && window.map.isStyleLoaded();
    }, { timeout: 60000 });

    // Wait for at least one tile source to have loaded data
    await page.waitForFunction(() => {
      if (!window.map || !window.map.loaded()) return false;
      const sources = window.map.getStyle().sources;
      // Check if at least one source has been requested
      return Object.keys(sources).length > 0;
    }, { timeout: 60000 });

    // Wait for map idle event (all tiles loaded)
    await page.evaluate(() => {
      return new Promise((resolve) => {
        if (!window.map || !window.map.loaded()) {
          resolve();
          return;
        }
        if (window.map.isStyleLoaded()) {
          // Wait for idle event
          window.map.once('idle', resolve);
          // Also set a timeout in case idle never fires
          setTimeout(resolve, 10000);
        } else {
          resolve();
        }
      });
    });

    // Disable animations and hide UI controls for clean export
    await page.addStyleTag({
      content: `
        * { animation: none !important; transition: none !important; }
        .controls { display: none !important; }
      `
    });

    // Wait for fonts
    await page.evaluate(() => document.fonts.ready);

    // Additional wait to ensure all rendering is complete
    await page.waitForTimeout(2000);

    // Screenshot only the map element for clean export
    const mapElement = await page.$('#map');
    const screenshot = mapElement
      ? await mapElement.screenshot({ type: 'png', omitBackground: false })
      : await page.screenshot({ type: 'png', fullPage: false, omitBackground: false });

    await browser.close();
    console.log(`[Exporter] Browser closed, screenshot size: ${screenshot.length} bytes`);

    // Generate standardized filename
    const effectiveBboxPreset = custom_bbox ? 'custom' : (bbox_preset || 'stockholm_core');
    const format = 'png'; // Demo A always exports PNG

    const filename = buildExportFilename({
      bbox_preset: effectiveBboxPreset,
      preset_id: preset_id,
      dpi: parseInt(dpi),
      format: format,
      requestParams: {
        dpi: dpi,
        format: format,
        theme: theme,
        width_mm: width_mm,
        height_mm: height_mm,
        layers: layers
      }
    });

    const filepath = path.join(EXPORTS_DIR, filename);

    // Save to disk
    fs.writeFileSync(filepath, screenshot);
    console.log(`[Exporter] Saved to disk: ${filepath} (${(screenshot.length / 1024 / 1024).toFixed(2)} MB)`);

    // Send response
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', screenshot.length);
    res.send(screenshot);

    console.log(`[Exporter] Export complete: ${filename}`);
  } catch (error) {
    console.error('[Exporter] Export error:', error);
    res.status(500).json({ error: error.message, details: error.stack });
  }
});

// List exports endpoint
app.get('/exports', (req, res) => {
  try {
    const files = fs.readdirSync(EXPORTS_DIR)
      .filter(f => f.endsWith('.png'))
      .map(f => {
        const stat = fs.statSync(path.join(EXPORTS_DIR, f));
        return { name: f, size: stat.size, created: stat.mtime };
      })
      .sort((a, b) => b.created - a.created);
    res.json({ exports: files, count: files.length });
  } catch (error) {
    res.json({ exports: [], count: 0 });
  }
});

app.listen(PORT, () => {
  console.log(`[Exporter] Demo A exporter listening on port ${PORT}`);
  console.log(`[Exporter] Web URL: ${WEB_URL}`);
  console.log(`[Exporter] Exports directory: ${EXPORTS_DIR}`);
});

