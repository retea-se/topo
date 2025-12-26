const express = require('express');
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8082;
const WEB_URL = process.env.WEB_URL || 'http://demo-a-web:3000';
const EXPORTS_DIR = process.env.EXPORTS_DIR || '/exports/demo-a';

// Ensure exports directory exists
if (!fs.existsSync(EXPORTS_DIR)) {
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

app.get('/render', async (req, res) => {
  const { bbox_preset, theme, render_mode, dpi = 150, width_mm = 420, height_mm = 594 } = req.query;

  const width_px = Math.round(width_mm * dpi / 25.4);
  const height_px = Math.round(height_mm * dpi / 25.4);

  console.log(`Exporting: ${bbox_preset}, ${theme}, ${render_mode}, ${width_px}x${height_px}px`);

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

    const url = `${WEB_URL}/?bbox_preset=${bbox_preset}&theme=${theme}&render_mode=${render_mode}`;
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

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `export_${bbox_preset}_${theme}_${render_mode}_${width_mm}mmx${height_mm}mm_${dpi}dpi_${timestamp}.png`;
    const filepath = path.join(EXPORTS_DIR, filename);

    fs.writeFileSync(filepath, screenshot);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(screenshot);

    console.log(`Export saved: ${filepath}`);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Demo A exporter listening on port ${PORT}`);
});

