const express = require('express');
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { buildExportFilename } = require('./filenameBuilder');

const app = express();
const PORT = process.env.PORT || 8082;
const WEB_URL = process.env.WEB_URL || 'http://demo-a-web:3000';
const EXPORTS_DIR = process.env.EXPORTS_DIR || '/exports/demo-a';
const BBOX_CONFIG_PATH = process.env.BBOX_CONFIG_PATH || '/config/bbox_presets.json';

// Load bbox presets from config file (single source of truth)
function loadBboxPresets() {
  try {
    if (fs.existsSync(BBOX_CONFIG_PATH)) {
      const config = JSON.parse(fs.readFileSync(BBOX_CONFIG_PATH, 'utf8'));
      const presets = {};
      for (const [key, value] of Object.entries(config.presets)) {
        presets[key] = value.bbox;
      }
      console.log(`Loaded ${Object.keys(presets).length} bbox presets from ${BBOX_CONFIG_PATH}`);
      return presets;
    }
  } catch (err) {
    console.warn(`Warning: Could not load bbox config from ${BBOX_CONFIG_PATH}: ${err.message}`);
  }
  // Fallback to hardcoded values
  console.log('Using fallback bbox presets');
  return {
    stockholm_core: { west: 17.90, south: 59.32, east: 18.08, north: 59.35 },
    stockholm_wide: { west: 17.75, south: 59.28, east: 18.25, north: 59.40 },
    svealand: { west: 14.5, south: 58.5, east: 19.0, north: 61.0 }
  };
}

const PRESET_BBOXES = loadBboxPresets();

/**
 * Calculate map scale string based on bbox and paper dimensions
 * Matches the calculateScale() function in editor.js
 */
function calculateScale(bboxPreset, widthMm) {
  const bbox = PRESET_BBOXES[bboxPreset];
  if (!bbox) return 'N/A';

  const bboxWidth = bbox.east - bbox.west;
  const lat = (bbox.north + bbox.south) / 2;
  const metersPerDegree = 111320 * Math.cos(lat * Math.PI / 180);
  const bboxWidthMeters = bboxWidth * metersPerDegree;

  const paperWidthMeters = widthMm / 1000;
  const scale = Math.round(bboxWidthMeters / paperWidthMeters);

  if (scale >= 1000000) {
    return `1:${(scale / 1000000).toFixed(1)}M`;
  } else if (scale >= 1000) {
    return `1:${Math.round(scale / 1000)}K`;
  } else {
    return `1:${scale}`;
  }
}

// Layout templates (must match editor.js LAYOUT_TEMPLATES)
const LAYOUT_TEMPLATES = {
  classic: {
    name: 'Classic',
    titlePosition: 'top-center',
    titleFont: 'Georgia, serif',
    titleSize: 22,
    subtitleSize: 13,
    titleBackground: 'rgba(255,255,255,0.92)',
    titleColor: '#2d3436',
    frameStyle: 'solid',
    frameColor: '#636e72',
    frameWidth: 1
  },
  modern: {
    name: 'Modern',
    titlePosition: 'bottom-left',
    titleFont: "'Inter', -apple-system, sans-serif",
    titleSize: 24,
    subtitleSize: 12,
    titleBackground: 'linear-gradient(to top, rgba(45,52,54,0.85) 0%, transparent 100%)',
    titleColor: '#fff',
    frameStyle: 'none',
    frameColor: 'transparent',
    frameWidth: 0
  },
  minimal: {
    name: 'Minimal',
    titlePosition: 'none',
    titleFont: 'system-ui, sans-serif',
    titleSize: 0,
    subtitleSize: 0,
    titleBackground: 'transparent',
    frameStyle: 'solid',
    frameColor: '#b2bec3',
    frameWidth: 1
  },
  elegant: {
    name: 'Elegant',
    titlePosition: 'top-center',
    titleFont: "'Playfair Display', 'Times New Roman', serif",
    titleSize: 24,
    subtitleSize: 13,
    titleBackground: 'rgba(253,251,248,0.95)',
    titleColor: '#4a4a4a',
    frameStyle: 'double',
    frameColor: '#8b7355',
    frameWidth: 3
  },
  bold: {
    name: 'Bold',
    titlePosition: 'center-overlay',
    titleFont: "'Inter', 'Helvetica Neue', sans-serif",
    titleSize: 42,
    subtitleSize: 16,
    titleBackground: 'transparent',
    titleColor: 'rgba(255,255,255,0.95)',
    titleShadow: '0 2px 12px rgba(0,0,0,0.6)',
    frameStyle: 'solid',
    frameColor: '#4a6fa5',
    frameWidth: 2
  }
};

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
    attribution = 'OSM contributors',
    layers = '{}',
    preset_id,
    layout_template = 'classic',
    show_scale = 'false',
    show_attribution = 'true'
  } = req.query;

  // Parse boolean params
  const shouldShowScale = show_scale === 'true';
  const shouldShowAttribution = show_attribution === 'true';
  const template = LAYOUT_TEMPLATES[layout_template] || LAYOUT_TEMPLATES.classic;

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
  console.log(`  Template: ${layout_template}, Scale: ${shouldShowScale}, Attribution: ${shouldShowAttribution}`);
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

    // Inject print composition overlay for export
    const hasComposition = title || subtitle || template.frameWidth > 0 || shouldShowScale || shouldShowAttribution;

    // Calculate scale before page.evaluate (can't call Node functions from browser context)
    const scaleString = calculateScale(bbox_preset || 'stockholm_core', parseFloat(width_mm));

    if (hasComposition) {
      console.log('[Exporter] Injecting print composition overlay...');

      await page.evaluate(({ template, title, subtitle, shouldShowScale, shouldShowAttribution, attribution, width_px, height_px, scaleString }) => {
        const mapEl = document.getElementById('map');
        if (!mapEl) return;

        // Create wrapper to contain map + composition
        const wrapper = document.createElement('div');
        wrapper.id = 'export-wrapper';
        wrapper.style.cssText = `
          position: relative;
          width: ${width_px}px;
          height: ${height_px}px;
          overflow: hidden;
        `;

        // Move map into wrapper
        mapEl.parentNode.insertBefore(wrapper, mapEl);
        wrapper.appendChild(mapEl);

        // Create composition overlay
        const overlay = document.createElement('div');
        overlay.id = 'print-composition';
        overlay.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: ${width_px}px;
          height: ${height_px}px;
          pointer-events: none;
          z-index: 100;
          box-sizing: border-box;
          border: ${template.frameWidth}px ${template.frameStyle} ${template.frameColor};
        `;

        // Add title based on template position
        if (template.titlePosition !== 'none' && (title || subtitle)) {
          const titleContainer = document.createElement('div');

          if (template.titlePosition === 'top-center') {
            titleContainer.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              padding: 14px 20px;
              background: ${template.titleBackground};
              text-align: center;
            `;
          } else if (template.titlePosition === 'bottom-left') {
            titleContainer.style.cssText = `
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              padding: 24px 20px 16px;
              background: ${template.titleBackground};
            `;
          } else if (template.titlePosition === 'center-overlay') {
            titleContainer.style.cssText = `
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              text-align: center;
              padding: 24px;
            `;
          }

          if (title) {
            const titleEl = document.createElement('div');
            titleEl.style.cssText = `
              font-family: ${template.titleFont};
              font-size: ${template.titleSize}px;
              font-weight: 600;
              color: ${template.titleColor || '#2d3436'};
              ${template.titleShadow ? `text-shadow: ${template.titleShadow};` : ''}
              letter-spacing: 0.5px;
            `;
            titleEl.textContent = title;
            titleContainer.appendChild(titleEl);
          }

          if (subtitle) {
            const subtitleEl = document.createElement('div');
            subtitleEl.style.cssText = `
              font-family: ${template.titleFont};
              font-size: ${template.subtitleSize}px;
              color: ${template.titleColor ? 'rgba(255,255,255,0.75)' : '#636e72'};
              ${template.titleShadow ? `text-shadow: ${template.titleShadow};` : ''}
              margin-top: 4px;
              font-weight: 400;
            `;
            subtitleEl.textContent = subtitle;
            titleContainer.appendChild(subtitleEl);
          }

          overlay.appendChild(titleContainer);
        }

        // Footer with scale and attribution
        if (shouldShowScale || shouldShowAttribution) {
          const footerBottom = template.titlePosition === 'bottom-left' ? 60 : 10;

          const footerArea = document.createElement('div');
          footerArea.style.cssText = `
            position: absolute;
            bottom: ${footerBottom}px;
            left: 12px;
            right: 12px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            pointer-events: none;
          `;

          // Scale placeholder (left side)
          if (shouldShowScale) {
            const scaleEl = document.createElement('div');
            scaleEl.style.cssText = `
              background: rgba(255,255,255,0.88);
              padding: 5px 10px;
              border-radius: 3px;
              color: #2d3436;
              font-family: 'Inter', system-ui, sans-serif;
              font-size: 11px;
              font-weight: 500;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            `;
            scaleEl.textContent = scaleString;
            footerArea.appendChild(scaleEl);
          } else {
            footerArea.appendChild(document.createElement('div'));
          }

          // Attribution (right side)
          if (shouldShowAttribution && template.titlePosition !== 'bottom-left') {
            const attrEl = document.createElement('div');
            attrEl.style.cssText = `
              padding: 4px 8px;
              color: rgba(99, 110, 114, 0.6);
              font-family: 'Inter', system-ui, sans-serif;
              font-size: 9px;
              max-width: 45%;
              text-align: right;
              letter-spacing: 0.2px;
            `;
            attrEl.textContent = attribution || 'OSM contributors';
            footerArea.appendChild(attrEl);
          }

          overlay.appendChild(footerArea);
        }

        wrapper.appendChild(overlay);
      }, {
        template,
        title,
        subtitle,
        shouldShowScale,
        shouldShowAttribution,
        attribution: attribution || 'OSM contributors',
        width_px,
        height_px,
        scaleString
      });

      // Wait for composition to render
      await page.waitForTimeout(500);
    }

    // Screenshot the export wrapper (includes composition) or map if no wrapper
    const exportWrapper = await page.$('#export-wrapper');
    const mapElement = await page.$('#map');
    const targetElement = exportWrapper || mapElement;

    const screenshot = targetElement
      ? await targetElement.screenshot({ type: 'png', omitBackground: false })
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

