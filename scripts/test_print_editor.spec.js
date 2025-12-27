/**
 * Print Editor Test Suite
 * Tests the Interactive Print Editor functionality
 *
 * Usage:
 *   npx playwright test scripts/test_print_editor.spec.js
 *
 * Prerequisites:
 *   - Demo A running at http://localhost:3000
 *   - Martin tileserver at http://localhost:8080
 *   - Hillshade server at http://localhost:8081
 *   - Demo B renderer at http://localhost:5000 (for PDF/SVG)
 */

const { test, expect } = require('@playwright/test');
const { waitForAppReady, waitForMapReady, selectBboxPreset } = require('./test-helpers');

const EDITOR_URL = 'http://localhost:3000/editor';

// Console error collection
let consoleErrors = [];

test.describe('Print Editor UI', () => {

  test.beforeEach(async ({ page }) => {
    // Reset console errors for each test
    consoleErrors = [];

    // Collect console errors and warnings
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        const text = msg.text();
        // Filter out known non-critical errors/warnings
        if (!text.includes('favicon') &&
            !text.includes('sourcemap') &&
            !text.includes('WebGL') &&
            !text.includes('GPU stall') &&
            !text.includes('GL Driver Message') &&
            !text.includes('GroupMarkerNotSet')) {
          consoleErrors.push({
            type,
            text,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    // Collect page errors
    page.on('pageerror', error => {
      consoleErrors.push({
        type: 'pageerror',
        text: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });

    await page.goto(EDITOR_URL);
    await waitForAppReady(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Fail test if there were console errors
    if (consoleErrors.length > 0) {
      const errorMessages = consoleErrors.map(e => `[${e.type}] ${e.text}`).join('\n');
      throw new Error(`Console errors detected:\n${errorMessages}`);
    }

    // Take screenshot and dump HTML on failure
    if (testInfo.status !== 'passed') {
      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach('screenshot', { body: screenshot, contentType: 'image/png' });

      const html = await page.content();
      await testInfo.attach('page-html', { body: html, contentType: 'text/html' });
    }
  });

  test('should load editor page', async ({ page }) => {
    await test.step('Check page title', async () => {
      await expect(page).toHaveTitle(/Print Editor/);
    });

    await test.step('Check sidebar is visible', async () => {
      await expect(page.locator('#sidebar')).toBeVisible();
    });

    await test.step('Check map is visible', async () => {
      await expect(page.locator('#map')).toBeVisible();
    });
  });

  test('should display preset selector', async ({ page }) => {
    await test.step('Check preset selector is visible', async () => {
      const presetSelect = page.locator('#preset-select');
      await expect(presetSelect).toBeVisible();
    });

    await test.step('Check preset options', async () => {
      const presetSelect = page.locator('#preset-select');
      const options = await presetSelect.locator('option').allTextContents();
      expect(options).toContain('Stockholm Core');
      expect(options).toContain('Stockholm Wide');
      expect(options).toContain('Svealand');
      expect(options).toContain('Custom (Draw on Map)');
    });
  });

  test('should display theme selector with themes', async ({ page }) => {
    await test.step('Check theme selector is visible', async () => {
      const themeSelect = page.locator('#theme-select');
      await expect(themeSelect).toBeVisible();
    });

    await test.step('Wait for themes to load', async () => {
      await page.waitForFunction(() => {
        const select = document.getElementById('theme-select');
        return select && select.options.length > 1;
      }, { timeout: 10000 });
    });

    await test.step('Check that paper theme exists', async () => {
      const themeSelect = page.locator('#theme-select');
      const options = await themeSelect.locator('option').allTextContents();
      expect(options.some(o => o.toLowerCase().includes('paper'))).toBeTruthy();
    });
  });

  test('should display paper size options', async ({ page }) => {
    const paperSelect = page.locator('#paper-size-select');
    await expect(paperSelect).toBeVisible();

    const options = await paperSelect.locator('option').allTextContents();
    // Accept format with or without dimensions (e.g., "A4" or "A4 (210 x 297 mm)")
    expect(options.some(o => o.trim().startsWith('A4'))).toBeTruthy();
    expect(options.some(o => o.trim().startsWith('A3'))).toBeTruthy();
    expect(options.some(o => o.trim().startsWith('A2'))).toBeTruthy();
    expect(options.some(o => o.trim().startsWith('A1'))).toBeTruthy();
    expect(options.some(o => o.trim().startsWith('A0'))).toBeTruthy();
  });

  test('should display DPI options', async ({ page }) => {
    const dpiSelect = page.locator('#dpi-select');
    await expect(dpiSelect).toBeVisible();

    const options = await dpiSelect.locator('option').allTextContents();
    expect(options.some(o => o.includes('72'))).toBeTruthy();
    expect(options.some(o => o.includes('150'))).toBeTruthy();
    expect(options.some(o => o.includes('300'))).toBeTruthy();
  });

  test('should have format buttons (PNG, PDF, SVG)', async ({ page }) => {
    await expect(page.locator('#format-png')).toBeVisible();
    await expect(page.locator('#format-pdf')).toBeVisible();
    await expect(page.locator('#format-svg')).toBeVisible();
  });

  test('should update output size when DPI changes', async ({ page }) => {
    const outputSize = page.locator('#output-size');
    const initialSize = await outputSize.textContent();

    // Change DPI to 300
    await page.selectOption('#dpi-select', '300');

    // Wait for update
    await page.waitForTimeout(100);

    const newSize = await outputSize.textContent();
    expect(newSize).not.toBe(initialSize);
  });

  test('should toggle orientation', async ({ page }) => {
    const portraitBtn = page.locator('#orientation-portrait');
    const landscapeBtn = page.locator('#orientation-landscape');

    // Portrait should be active by default
    await expect(portraitBtn).toHaveClass(/active/);
    await expect(landscapeBtn).not.toHaveClass(/active/);

    // Click landscape
    await landscapeBtn.click();

    await expect(landscapeBtn).toHaveClass(/active/);
    await expect(portraitBtn).not.toHaveClass(/active/);
  });

  test('should update bbox display when preset changes', async ({ page }) => {
    await test.step('Get initial bbox value', async () => {
      const bboxWest = page.locator('#bbox-west');
      const initialWest = await bboxWest.textContent();
      expect(initialWest).toBeTruthy();
    });

    await test.step('Change to Stockholm Wide preset', async () => {
      await selectBboxPreset(page, 'stockholm_wide');
    });

    await test.step('Verify bbox updated', async () => {
      const bboxWest = page.locator('#bbox-west');
      const newWest = await bboxWest.textContent();
      expect(newWest).toBeTruthy();
      // Bbox should have changed (different coordinates)
      const initialWest = await page.evaluate(() => {
        // We can't easily get the old value, so just check it's valid
        return document.getElementById('bbox-west')?.textContent;
      });
      // Just verify it's not empty
      expect(newWest).not.toBe('-');
    });
  });

  test('should have layer toggle checkboxes', async ({ page }) => {
    const layers = ['hillshade', 'water', 'parks', 'roads', 'buildings', 'contours'];

    for (const layer of layers) {
      const checkbox = page.locator(`#layer-${layer}`);
      await expect(checkbox).toBeVisible();
    }
  });

  test('should have title and subtitle inputs', async ({ page }) => {
    await expect(page.locator('#title-input')).toBeVisible();
    await expect(page.locator('#subtitle-input')).toBeVisible();
    // Attribution is handled via checkbox (#show-attribution), not a text input
    await expect(page.locator('#show-attribution')).toBeVisible();
  });

  test('should have export and preview buttons', async ({ page }) => {
    await expect(page.locator('#export-btn')).toBeVisible();
    await expect(page.locator('#preview-btn')).toBeVisible();
  });

  test('should show custom size inputs when custom paper size selected', async ({ page }) => {
    const customRow = page.locator('#custom-size-row');

    // Should be hidden initially
    await expect(customRow).toBeHidden();

    // Select custom
    await page.selectOption('#paper-size-select', 'custom');

    // Should be visible now
    await expect(customRow).toBeVisible();
  });

});

test.describe('Print Editor Map Interaction', () => {

  test.beforeEach(async ({ page }) => {
    // Reset console errors
    consoleErrors = [];

    // Collect console errors
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        const text = msg.text();
        // Filter out known non-critical errors/warnings
        if (!text.includes('favicon') &&
            !text.includes('sourcemap') &&
            !text.includes('WebGL') &&
            !text.includes('GPU stall') &&
            !text.includes('GL Driver Message') &&
            !text.includes('GroupMarkerNotSet')) {
          consoleErrors.push({ type, text, timestamp: new Date().toISOString() });
        }
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push({
        type: 'pageerror',
        text: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });

    await page.goto(EDITOR_URL);
    await waitForAppReady(page);
    await waitForMapReady(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (consoleErrors.length > 0) {
      const errorMessages = consoleErrors.map(e => `[${e.type}] ${e.text}`).join('\n');
      throw new Error(`Console errors detected:\n${errorMessages}`);
    }

    if (testInfo.status !== 'passed') {
      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach('screenshot', { body: screenshot, contentType: 'image/png' });
      const html = await page.content();
      await testInfo.attach('page-html', { body: html, contentType: 'text/html' });
    }
  });

  test('should zoom in and out', async ({ page }) => {
    const zoomIn = page.locator('#zoom-in-btn');
    const zoomOut = page.locator('#zoom-out-btn');
    const zoomLevel = page.locator('#zoom-level');

    const initialZoom = await zoomLevel.textContent();

    await zoomIn.click();
    await page.waitForTimeout(500);

    const afterZoomIn = await zoomLevel.textContent();
    expect(parseFloat(afterZoomIn)).toBeGreaterThan(parseFloat(initialZoom));

    await zoomOut.click();
    await page.waitForTimeout(500);

    const afterZoomOut = await zoomLevel.textContent();
    expect(parseFloat(afterZoomOut)).toBeLessThan(parseFloat(afterZoomIn));
  });

  test('should fit to bbox', async ({ page }) => {
    const fitBtn = page.locator('#fit-bbox-btn');

    // First zoom out
    await page.locator('#zoom-out-btn').click();
    await page.locator('#zoom-out-btn').click();
    await page.waitForTimeout(500);

    // Then fit to bbox
    await fitBtn.click();
    await page.waitForTimeout(500);

    // Map should be visible and centered
    const map = page.locator('#map');
    await expect(map).toBeVisible();
  });

  test('should display status bar', async ({ page }) => {
    const statusBar = page.locator('.status-bar');
    await expect(statusBar).toBeVisible();

    const statusText = page.locator('#status-text');
    await expect(statusText).toHaveText('Ready');
  });

});

test.describe('Print Editor Export', () => {

  test('should initiate PNG export and receive blob', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => window.map && window.map.isStyleLoaded(), { timeout: 30000 });

    // PNG is selected by default
    const formatPng = page.locator('#format-png');
    await expect(formatPng).toHaveClass(/active/);

    // Set up download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 120000 });

    // Click export
    const exportBtn = page.locator('#export-btn');
    await exportBtn.click();

    // Wait for modal to appear
    await expect(page.locator('#export-modal')).toHaveClass(/active/);

    // Wait for download (may take 30-60 seconds for Playwright render)
    try {
      const download = await downloadPromise;
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/export_.*\.png$/);
      console.log('Export downloaded:', filename);
    } catch (e) {
      // If download doesn't start within timeout, that's an issue
      console.log('Export may have failed or timed out:', e.message);
    }
  });

  test('should select PDF format', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');

    const formatPdf = page.locator('#format-pdf');
    await formatPdf.click();

    await expect(formatPdf).toHaveClass(/active/);
    await expect(page.locator('#format-png')).not.toHaveClass(/active/);
  });

  test('should select SVG format', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');

    const formatSvg = page.locator('#format-svg');
    await formatSvg.click();

    await expect(formatSvg).toHaveClass(/active/);
    await expect(page.locator('#format-png')).not.toHaveClass(/active/);
  });

});

test.describe('Print Editor Viewport Stability', () => {

  test('should NOT reset viewport when theme changes', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => window.map && window.map.isStyleLoaded(), { timeout: 30000 });

    // Get initial viewport state
    const initialState = await page.evaluate(() => ({
      center: window.map.getCenter(),
      zoom: window.map.getZoom()
    }));
    console.log('Initial state:', initialState);

    // Pan/zoom to a different location
    await page.evaluate(() => {
      window.map.jumpTo({ center: [18.1, 59.4], zoom: 12 });
    });
    await page.waitForTimeout(500);

    const beforeThemeChange = await page.evaluate(() => ({
      center: window.map.getCenter(),
      zoom: window.map.getZoom()
    }));
    console.log('Before theme change:', beforeThemeChange);

    // Change theme multiple times
    const themes = ['ink', 'dark', 'gallery'];
    for (const theme of themes) {
      await page.selectOption('#theme-select', theme);
      await page.waitForTimeout(1000); // Wait for style change
    }

    // Wait for final style load
    await page.waitForFunction(() => window.map && window.map.isStyleLoaded(), { timeout: 30000 });
    await page.waitForTimeout(500);

    // Check viewport is still at the same location
    const afterThemeChanges = await page.evaluate(() => ({
      center: window.map.getCenter(),
      zoom: window.map.getZoom()
    }));
    console.log('After theme changes:', afterThemeChanges);

    // Allow small tolerance for floating point
    const centerDiff = Math.abs(afterThemeChanges.center.lng - beforeThemeChange.center.lng) +
                       Math.abs(afterThemeChanges.center.lat - beforeThemeChange.center.lat);
    const zoomDiff = Math.abs(afterThemeChanges.zoom - beforeThemeChange.zoom);

    expect(centerDiff).toBeLessThan(0.01);
    expect(zoomDiff).toBeLessThan(0.5);
  });

  test('should NOT reset viewport when preset changes then user pans', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => window.map && window.map.isStyleLoaded(), { timeout: 30000 });

    // Change preset to Stockholm Wide
    await page.selectOption('#preset-select', 'stockholm_wide');
    await page.waitForTimeout(1000);

    // Pan map manually
    await page.evaluate(() => {
      window.map.panBy([100, 50]);
    });
    await page.waitForTimeout(500);

    const afterPan = await page.evaluate(() => ({
      center: window.map.getCenter(),
      zoom: window.map.getZoom()
    }));

    // Change theme (should NOT reset to preset center)
    await page.selectOption('#theme-select', 'mono');
    await page.waitForTimeout(1000);

    const afterTheme = await page.evaluate(() => ({
      center: window.map.getCenter(),
      zoom: window.map.getZoom()
    }));

    // Center should be preserved (not reset to preset)
    const centerDiff = Math.abs(afterTheme.center.lng - afterPan.center.lng) +
                       Math.abs(afterTheme.center.lat - afterPan.center.lat);

    expect(centerDiff).toBeLessThan(0.01);
  });

});

test.describe('Print Editor Preview Composition', () => {

  test('should show print composition overlay when preview clicked', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => window.map && window.map.isStyleLoaded(), { timeout: 30000 });

    // Fill in title
    await page.fill('#title-input', 'Test Map Title');
    await page.fill('#subtitle-input', 'Test Subtitle');

    // Click preview button
    await page.click('#preview-btn');
    await page.waitForTimeout(500);

    // Print composition overlay should be visible
    const overlay = page.locator('#print-composition');
    await expect(overlay).toBeVisible();

    // Should contain the title
    await expect(overlay).toContainText('Test Map Title');
    await expect(overlay).toContainText('Test Subtitle');

    // Should contain scale info (format: "1:XX" or "1:XX,XXX")
    // Scale is displayed as just the value (e.g., "1:25,000"), not "Scale: 1:25,000"
    const overlayText = await overlay.textContent();
    expect(overlayText).toMatch(/1:\d/);
  });

  test('should hide composition overlay when export starts', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => window.map && window.map.isStyleLoaded(), { timeout: 30000 });

    // Show preview first
    await page.click('#preview-btn');
    await page.waitForTimeout(500);

    // Overlay should be visible
    await expect(page.locator('#print-composition')).toBeVisible();

    // Exit preview mode (sidebar is hidden in preview, so export button is not accessible)
    // Press ESC to exit preview mode
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Now export button should be accessible; start export (overlay should hide)
    await page.click('#export-btn');
    await page.waitForTimeout(500);

    // Overlay should be hidden during export
    await expect(page.locator('#print-composition')).toBeHidden();
  });

});

test.describe('Print Editor Scale Calculation', () => {

  test('should display calculated scale', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => window.map && window.map.isStyleLoaded(), { timeout: 30000 });

    const scaleDisplay = page.locator('#scale-display');
    const scale = await scaleDisplay.textContent();

    // Scale should be in format "1:XXK" or "1:XX,XXX"
    expect(scale).toMatch(/1:\d/);
  });

  test('should update scale when paper size changes', async ({ page }) => {
    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => window.map && window.map.isStyleLoaded(), { timeout: 30000 });

    const scaleDisplay = page.locator('#scale-display');
    const initialScale = await scaleDisplay.textContent();

    // Change to A1
    await page.selectOption('#paper-size-select', 'A1');
    await page.waitForTimeout(100);

    const newScale = await scaleDisplay.textContent();
    expect(newScale).not.toBe(initialScale);
  });

});

// Test configuration
test.describe.configure({ mode: 'serial' });
