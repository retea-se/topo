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
  },
  // New layouts - Phase 1: Simple
  minimalist: {
    name: 'Minimalist',
    titlePosition: 'none',
    titleFont: "'Helvetica Neue', -apple-system, sans-serif",
    titleSize: 0,
    subtitleSize: 0,
    titleBackground: 'transparent',
    titleColor: 'rgba(0,0,0,0.2)',
    frameStyle: 'solid',
    frameColor: 'rgba(200, 200, 200, 0.3)',
    frameWidth: 0.5,
    scalePosition: 'none',
    attributionPosition: 'none'
  },
  scientific: {
    name: 'Scientific',
    titlePosition: 'top-left',
    titleFont: "'Arial', 'Helvetica', sans-serif",
    titleSize: 20,
    subtitleSize: 12,
    titleBackground: 'rgba(255, 255, 255, 0.95)',
    titleColor: '#2d3436',
    frameStyle: 'solid',
    frameColor: '#636e72',
    frameWidth: 1,
    scalePosition: 'bottom-right',
    attributionPosition: 'bottom-right',
    scaleFont: 'sans-serif'
  },
  blueprint: {
    name: 'Blueprint',
    titlePosition: 'top-left',
    titleFont: "'Courier Prime', 'Courier New', 'Monaco', monospace",
    titleSize: 16,
    subtitleSize: 12,
    titleTransform: 'uppercase',
    titleBackground: 'rgba(245, 245, 245, 0.95)',
    titleBackgroundPattern: 'grid',
    titleColor: '#1a5fb4',
    frameStyle: 'solid',
    framePattern: 'grid',
    frameColor: '#4a90e2',
    frameWidth: 2,
    scalePosition: 'bottom-right',
    attributionPosition: 'bottom-right',
    scaleFont: 'monospace'
  },
  // New layouts - Phase 2: Medium complexity
  'gallery-print': {
    name: 'Gallery Print',
    titlePosition: 'bottom-right',
    titleFont: "'Inter', -apple-system, sans-serif",
    titleSize: 18,
    subtitleSize: 12,
    titleBackground: 'transparent',
    titleColor: 'rgba(45, 52, 54, 0.9)',
    titleShadow: '0 1px 3px rgba(255,255,255,0.8)',
    frameStyle: 'none',
    frameColor: 'transparent',
    frameWidth: 0,
    scalePosition: 'bottom-left',
    attributionPosition: 'bottom-left'
  },
  'vintage-map': {
    name: 'Vintage Map',
    titlePosition: 'top-center',
    titleFont: "'Times New Roman', 'Georgia', serif",
    titleSize: 28,
    subtitleSize: 14,
    titleStyle: 'italic',
    titleBackground: 'rgba(212, 196, 168, 0.92)',
    titleColor: '#5c4033',
    titleUnderline: true,
    frameStyle: 'double',
    frameColor: '#8b7355',
    frameWidth: 4,
    scalePosition: 'bottom-center',
    attributionPosition: 'bottom-center',
    scaleFont: 'serif'
  },
  artistic: {
    name: 'Artistic',
    titlePosition: 'diagonal',
    titleFont: "'Inter', sans-serif",
    titleSize: 26,
    subtitleSize: 14,
    titleStyle: 'italic',
    titleFontWeight: 'bold',
    titleBackground: 'rgba(253, 252, 250, 0.75)',
    titleColor: '#4a6fa5',
    frameStyle: 'none',
    frameColor: 'transparent',
    frameWidth: 0,
    scalePosition: 'top-right',
    attributionPosition: 'top-right'
  },
  // New layouts - Phase 3: Advanced
  'night-mode': {
    name: 'Night Mode',
    titlePosition: 'top-right',
    titleFont: "'Inter', sans-serif",
    titleSize: 22,
    subtitleSize: 13,
    titleFontWeight: 'bold',
    titleBackground: 'rgba(18, 18, 18, 0.85)',
    titleColor: '#00ffff',
    titleShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
    frameStyle: 'solid',
    frameColor: '#4a6580',
    frameWidth: 2,
    frameGlow: '0 0 10px rgba(0, 255, 255, 0.5), 0 0 20px rgba(0, 255, 255, 0.3)',
    scalePosition: 'bottom-left',
    attributionPosition: 'bottom-left'
  },
  heritage: {
    name: 'Heritage',
    titlePosition: 'top-center',
    titleFont: "'Garamond', 'Baskerville', serif",
    titleSize: 24,
    subtitleSize: 13,
    titleBackground: 'rgba(253, 251, 248, 0.95)',
    titleColor: '#5c4033',
    frameStyle: 'double',
    frameColor: '#8b7355',
    frameWidth: 4,
    scalePosition: 'bottom-center',
    attributionPosition: 'bottom-center',
    scaleFont: 'serif'
  },
  prestige: {
    name: 'Prestige',
    titlePosition: 'top-center',
    titleFont: "'Playfair Display', serif",
    titleSize: 32,
    subtitleSize: 14,
    titleFontWeight: 'bold',
    titleBanner: true,
    titleBackground: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
    titleColor: '#1a1a1a',
    frameStyle: 'double',
    frameColor: '#d4af37',
    frameWidth: 5,
    scalePosition: 'bottom-center',
    attributionPosition: 'bottom-center'
  },
  cyberpunk: {
    name: 'Cyberpunk',
    titlePosition: 'top-center',
    titleFont: "'Orbitron', 'Rajdhani', sans-serif",
    titleSize: 30,
    subtitleSize: 14,
    titleFontWeight: 'bold',
    titleTransform: 'uppercase',
    titleBackground: 'rgba(13, 2, 33, 0.9)',
    titleColor: '#ff00ff',
    titleShadow: '0 0 10px rgba(255, 0, 255, 0.8), 0 0 20px rgba(255, 0, 255, 0.6)',
    frameStyle: 'solid',
    frameColor: '#00ffff',
    frameWidth: 3,
    frameGlow: '0 0 5px rgba(255, 0, 255, 0.8), 0 0 10px rgba(255, 0, 255, 0.6), 0 0 15px rgba(0, 255, 255, 0.4)',
    scalePosition: 'bottom-right',
    attributionPosition: 'bottom-right',
    scaleFont: 'monospace'
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

        // Remove existing wrapper if present
        const existingWrapper = document.getElementById('export-wrapper');
        if (existingWrapper) existingWrapper.remove();

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
        
        // Build frame CSS
        let frameCSS = '';
        if (template.frameStyle === 'none' || !template.frameWidth || template.frameWidth === 0) {
          frameCSS = 'border: none;';
        } else if (template.frameStyle === 'double') {
          const outerWidth = template.frameWidth || 4;
          const innerWidth = Math.max(1, Math.floor(outerWidth / 2));
          frameCSS = `border: ${outerWidth}px solid ${template.frameColor || '#8b7355'}; box-sizing: border-box;`;
          overlay.style.outline = `${innerWidth}px solid ${template.frameColor || '#8b7355'}`;
          overlay.style.outlineOffset = `-${outerWidth + innerWidth}px`;
        } else {
          frameCSS = `border: ${template.frameWidth || 1}px ${template.frameStyle || 'solid'} ${template.frameColor || '#636e72'};`;
        }

        // Grid pattern for Blueprint
        if (template.framePattern === 'grid') {
          overlay.style.backgroundImage = 'linear-gradient(rgba(74, 144, 226, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(74, 144, 226, 0.15) 1px, transparent 1px)';
          overlay.style.backgroundSize = '20px 20px';
        }

        // Glow effects
        if (template.frameGlow) {
          overlay.style.boxShadow = template.frameGlow;
        }

        overlay.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: ${width_px}px;
          height: ${height_px}px;
          pointer-events: none;
          z-index: 100;
          box-sizing: border-box;
          ${frameCSS}
        `;

        // Helper for grid pattern
        function getGridPattern() {
          return 'background-image: linear-gradient(rgba(74, 144, 226, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(74, 144, 226, 0.15) 1px, transparent 1px); background-size: 20px 20px;';
        }

        // Add title based on template position
        if (template.titlePosition !== 'none' && (title || subtitle)) {
          const titleContainer = document.createElement('div');
          let containerCSS = '';

          if (template.titlePosition === 'top-center') {
            containerCSS = `position: absolute; top: 0; left: 0; right: 0; padding: 14px 20px; background: ${template.titleBackground || 'transparent'}; text-align: center;`;
          } else if (template.titlePosition === 'top-left') {
            containerCSS = `position: absolute; top: 0; left: 0; padding: 14px 20px; background: ${template.titleBackground || 'transparent'}; text-align: left;${template.titleBackgroundPattern === 'grid' ? getGridPattern() : ''}`;
          } else if (template.titlePosition === 'top-right') {
            containerCSS = `position: absolute; top: 0; right: 0; padding: 14px 20px; background: ${template.titleBackground || 'transparent'}; text-align: right;`;
          } else if (template.titlePosition === 'bottom-left') {
            containerCSS = `position: absolute; bottom: 0; left: 0; right: 0; padding: 24px 20px 16px; background: ${template.titleBackground || 'transparent'};`;
          } else if (template.titlePosition === 'bottom-right') {
            containerCSS = `position: absolute; bottom: 0; right: 0; padding: 20px; background: ${template.titleBackground || 'transparent'}; text-align: right;`;
          } else if (template.titlePosition === 'bottom-center') {
            containerCSS = `position: absolute; bottom: 0; left: 0; right: 0; padding: 14px 20px; background: ${template.titleBackground || 'transparent'}; text-align: center;`;
          } else if (template.titlePosition === 'center-overlay') {
            containerCSS = `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; padding: 24px;`;
          } else if (template.titlePosition === 'diagonal') {
            containerCSS = `position: absolute; bottom: 20%; left: 5%; padding: 16px 24px; background: ${template.titleBackground || 'transparent'}; transform: rotate(-3deg); transform-origin: left bottom; border-radius: 4px;`;
          }

          // Banner for Prestige
          if (template.titleBanner) {
            containerCSS += 'background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); padding: 12px 24px; border-radius: 4px; box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);';
          }

          titleContainer.style.cssText = containerCSS;

          if (title) {
            const titleEl = document.createElement('div');
            let titleStyle = `font-family: ${template.titleFont || "'Inter', sans-serif"}; font-size: ${template.titleSize || 22}px; font-weight: ${template.titleFontWeight || '600'}; color: ${template.titleColor || '#2d3436'};${template.titleShadow ? ` text-shadow: ${template.titleShadow};` : ''} letter-spacing: 0.5px;`;
            if (template.titleTransform) titleStyle += ` text-transform: ${template.titleTransform};`;
            if (template.titleStyle === 'italic') titleStyle += ' font-style: italic;';
            titleEl.style.cssText = titleStyle;
            titleEl.textContent = title;
            if (template.titleUnderline) {
              titleEl.style.borderBottom = '3px double #8b7355';
              titleEl.style.paddingBottom = '8px';
              titleEl.style.marginBottom = '8px';
            }
            titleContainer.appendChild(titleEl);
          }

          if (subtitle) {
            const subtitleEl = document.createElement('div');
            let subtitleColor = '#636e72';
            if (template.titleColor) {
              if (template.titleColor.indexOf('255') >= 0 || template.titleColor.indexOf('#fff') >= 0 || template.titleColor.indexOf('#00ffff') >= 0 || template.titleColor.indexOf('#ff00ff') >= 0) {
                subtitleColor = template.titleColor.replace('1)', '0.75)').replace('ff)', 'c0)');
              } else {
                subtitleColor = template.titleColor.indexOf('rgba') >= 0 ? template.titleColor.replace(/,\s*[0-9.]+\)/, ', 0.7)') : '#636e72';
              }
            }
            subtitleEl.style.cssText = `font-family: ${template.titleFont || "'Inter', sans-serif"}; font-size: ${template.subtitleSize || 13}px; color: ${subtitleColor};${template.titleShadow ? ` text-shadow: ${template.titleShadow};` : ''} margin-top: 4px; font-weight: 400;`;
            subtitleEl.textContent = subtitle;
            titleContainer.appendChild(subtitleEl);
          }

          overlay.appendChild(titleContainer);
        }

        // Scale and attribution - use template positions
        const scalePos = template.scalePosition || (shouldShowScale ? 'bottom-left' : 'none');
        const attrPos = template.attributionPosition || (shouldShowAttribution ? (scalePos === 'bottom-left' ? 'bottom-right' : 'bottom-left') : 'none');

        if (shouldShowScale && scalePos !== 'none') {
          const scaleEl = document.createElement('div');
          const scaleFont = template.scaleFont === 'monospace' ? "'Courier Prime', 'Courier New', monospace" : template.scaleFont === 'serif' ? "'Times New Roman', serif" : "'Inter', system-ui, sans-serif";
          let scaleCSS = `position: absolute; background: rgba(255,255,255,0.88); padding: 5px 10px; border-radius: 3px; color: #2d3436; font-family: ${scaleFont}; font-size: 11px; font-weight: 500; box-shadow: 0 1px 3px rgba(0,0,0,0.1); pointer-events: none;`;
          if (scalePos === 'bottom-left' || scalePos === 'bottom-center') {
            const bottomOffset = (template.titlePosition === 'bottom-left' || template.titlePosition === 'bottom-right' || template.titlePosition === 'bottom-center') ? 60 : 10;
            scaleCSS += `bottom: ${bottomOffset}px;`;
            if (scalePos === 'bottom-left') {
              scaleCSS += 'left: 12px;';
            } else {
              scaleCSS += 'left: 50%; transform: translateX(-50%);';
            }
          } else if (scalePos === 'bottom-right') {
            const bottomOffset = (template.titlePosition === 'bottom-right' || template.titlePosition === 'bottom-center') ? 60 : 10;
            scaleCSS += `bottom: ${bottomOffset}px; right: 12px;`;
          } else if (scalePos === 'top-left') {
            scaleCSS += 'top: 12px; left: 12px;';
          } else if (scalePos === 'top-right') {
            scaleCSS += 'top: 12px; right: 12px;';
          }
          scaleEl.style.cssText = scaleCSS;
          scaleEl.textContent = scaleString || '1:50K';
          overlay.appendChild(scaleEl);
        }

        if (shouldShowAttribution && attrPos !== 'none') {
          const attrEl = document.createElement('div');
          const attrFont = template.scaleFont === 'monospace' ? "'Courier Prime', 'Courier New', monospace" : template.scaleFont === 'serif' ? "'Times New Roman', serif" : "'Inter', system-ui, sans-serif";
          let attrCSS = `position: absolute; padding: 4px 8px; color: rgba(99, 110, 114, 0.6); font-family: ${attrFont}; font-size: 9px; pointer-events: none; letter-spacing: 0.2px;`;
          if (attrPos === 'bottom-left' && template.titlePosition !== 'bottom-left') {
            const bottomOffset = template.titlePosition === 'bottom-right' || template.titlePosition === 'bottom-center' ? 60 : 10;
            attrCSS += `bottom: ${bottomOffset}px; left: 12px; text-align: left;`;
          } else if (attrPos === 'bottom-right' && template.titlePosition !== 'bottom-right') {
            const bottomOffset = template.titlePosition === 'bottom-left' || template.titlePosition === 'bottom-center' ? 60 : 10;
            attrCSS += `bottom: ${bottomOffset}px; right: 12px; text-align: right; max-width: 45%;`;
          } else if (attrPos === 'bottom-center') {
            const bottomOffset = template.titlePosition === 'bottom-center' ? 60 : 10;
            attrCSS += `bottom: ${bottomOffset}px; left: 50%; transform: translateX(-50%); text-align: center;`;
          } else if (attrPos === 'top-right') {
            attrCSS += 'top: 12px; right: 12px; text-align: right; max-width: 45%;';
          } else if (attrPos === 'top-left') {
            attrCSS += 'top: 12px; left: 12px; text-align: left;';
          }
          attrEl.style.cssText = attrCSS;
          attrEl.textContent = attribution || 'OSM contributors';
          overlay.appendChild(attrEl);
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

