/**
 * Playwright Test Helpers
 * Shared utilities for stable, deterministic tests
 */

const { expect } = require('@playwright/test');

/**
 * Wait for the application to be fully ready
 * - Page loaded
 * - Map initialized and style loaded
 * - Sidebar visible
 */
async function waitForAppReady(page, options = {}) {
  const timeout = options.timeout || 30000;

  // Wait for network to be idle
  await page.waitForLoadState('networkidle', { timeout });

  // Wait for map to be initialized and style loaded
  await page.waitForFunction(
    () => window.map && window.map.isStyleLoaded(),
    { timeout }
  );

  // Wait for sidebar to be visible
  await expect(page.locator('#sidebar')).toBeVisible({ timeout: 5000 });

  // Small delay to ensure all UI updates are complete
  await page.waitForTimeout(300);
}

/**
 * Wait for export presets to be loaded from API
 * Checks that the preset dropdown has more than just "None (Custom)"
 */
async function waitForPresetsLoaded(page, options = {}) {
  const timeout = options.timeout || 10000;

  await page.waitForFunction(
    () => {
      const select = document.getElementById('export-preset-select');
      return select && select.options.length > 1;
    },
    { timeout }
  );

  // Small delay for UI to stabilize
  await page.waitForTimeout(200);
}

/**
 * Select a preset by its value (ID)
 * More stable than selecting by text which may vary by locale
 */
async function selectPresetById(page, presetId) {
  const presetSelect = page.locator('#export-preset-select');
  await presetSelect.selectOption({ value: presetId });

  // Wait for preset to apply (UI updates)
  await page.waitForTimeout(1000);
}

/**
 * Select bbox preset by value
 */
async function selectBboxPreset(page, presetValue) {
  const presetSelect = page.locator('#preset-select');
  await presetSelect.selectOption(presetValue);

  // Wait for map to update
  await page.waitForTimeout(1000);

  // Ensure map style is still loaded after preset change
  await page.waitForFunction(
    () => window.map && window.map.isStyleLoaded(),
    { timeout: 10000 }
  );
}

/**
 * Wait for map to be ready (initialized and style loaded)
 */
async function waitForMapReady(page, options = {}) {
  const timeout = options.timeout || 30000;

  await page.waitForFunction(
    () => window.map && window.map.isStyleLoaded(),
    { timeout }
  );

  // Small delay for map to stabilize
  await page.waitForTimeout(300);
}

/**
 * Get map viewport state (center and zoom)
 */
async function getMapViewport(page) {
  return await page.evaluate(() => {
    if (!window.map) return null;
    return {
      center: window.map.getCenter(),
      zoom: window.map.getZoom()
    };
  });
}

/**
 * Normalize locale strings for matching
 * Handles variations like "Preset:" vs "Preset (modifierad)"
 */
function normalizeLocaleString(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if text contains a keyword (locale-agnostic)
 */
function textContains(text, keyword) {
  const normalized = normalizeLocaleString(text);
  const normalizedKeyword = normalizeLocaleString(keyword);
  return normalized.includes(normalizedKeyword);
}

module.exports = {
  waitForAppReady,
  waitForPresetsLoaded,
  selectPresetById,
  selectBboxPreset,
  waitForMapReady,
  getMapViewport,
  normalizeLocaleString,
  textContains
};

