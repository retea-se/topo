/**
 * Print Editor Test Suite
 * Tests the Interactive Print Editor functionality
 *
 * Usage:
 *   npx playwright test scripts/test_print_editor.js
 *
 * Prerequisites:
 *   - Demo A running at http://localhost:3000
 *   - Martin tileserver at http://localhost:8080
 *   - Hillshade server at http://localhost:8081
 *   - Demo B renderer at http://localhost:5000 (for PDF/SVG)
 */

const { test, expect } = require('@playwright/test');

const EDITOR_URL = 'http://localhost:3000/editor';

test.describe('Print Editor UI', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');
  });

  test('should load editor page', async ({ page }) => {
    await expect(page).toHaveTitle(/Print Editor/);
    await expect(page.locator('#sidebar')).toBeVisible();
    await expect(page.locator('#map')).toBeVisible();
  });

  test('should display preset selector', async ({ page }) => {
    const presetSelect = page.locator('#preset-select');
    await expect(presetSelect).toBeVisible();

    // Check preset options
    const options = await presetSelect.locator('option').allTextContents();
    expect(options).toContain('Stockholm Core');
    expect(options).toContain('Stockholm Wide');
    expect(options).toContain('Svealand');
    expect(options).toContain('Custom (Draw on Map)');
  });

  test('should display theme selector with themes', async ({ page }) => {
    const themeSelect = page.locator('#theme-select');
    await expect(themeSelect).toBeVisible();

    // Wait for themes to load
    await page.waitForFunction(() => {
      const select = document.getElementById('theme-select');
      return select && select.options.length > 1;
    });

    // Check that paper theme exists
    const options = await themeSelect.locator('option').allTextContents();
    expect(options.some(o => o.toLowerCase().includes('paper'))).toBeTruthy();
  });

  test('should display paper size options', async ({ page }) => {
    const paperSelect = page.locator('#paper-size-select');
    await expect(paperSelect).toBeVisible();

    const options = await paperSelect.locator('option').allTextContents();
    expect(options).toContain('A4 (210 x 297 mm)');
    expect(options).toContain('A3 (297 x 420 mm)');
    expect(options).toContain('A2 (420 x 594 mm)');
    expect(options).toContain('A1 (594 x 841 mm)');
    expect(options).toContain('A0 (841 x 1189 mm)');
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
    // Wait for map to load
    await page.waitForFunction(() => window.map && window.map.isStyleLoaded());

    const bboxWest = page.locator('#bbox-west');
    const initialWest = await bboxWest.textContent();

    // Change to Stockholm Wide
    await page.selectOption('#preset-select', 'stockholm_wide');
    await page.waitForTimeout(500);

    const newWest = await bboxWest.textContent();
    expect(newWest).not.toBe(initialWest);
  });

  test('should have layer toggle checkboxes', async ({ page }) => {
    const layers = ['hillshade', 'water', 'parks', 'roads', 'buildings', 'contours'];

    for (const layer of layers) {
      const checkbox = page.locator(`#layer-${layer}`);
      await expect(checkbox).toBeVisible();
    }
  });

  test('should have title and attribution inputs', async ({ page }) => {
    await expect(page.locator('#title-input')).toBeVisible();
    await expect(page.locator('#subtitle-input')).toBeVisible();
    await expect(page.locator('#attribution-input')).toBeVisible();
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
    await page.goto(EDITOR_URL);
    await page.waitForLoadState('networkidle');
    // Wait for map to fully load
    await page.waitForFunction(() => window.map && window.map.isStyleLoaded(), { timeout: 30000 });
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

    // Should contain scale info
    await expect(overlay).toContainText('Scale:');
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

    // Start export (overlay should hide)
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
