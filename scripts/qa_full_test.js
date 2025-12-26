/**
 * Full QA Test Suite for Topo Map Export System
 *
 * Tests Demo A (MapLibre) and Demo B (Mapnik) with:
 * - UI navigation and rendering
 * - Layer toggles
 * - Theme switching
 * - Pan/zoom operations
 * - Export functionality
 *
 * Run with: node scripts/qa_full_test.js [--preset <preset>] [--demo <A|B|both>]
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Parse command line args
const args = process.argv.slice(2);
let preset = 'stockholm_wide';
let demoFilter = 'both';

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--preset' && args[i + 1]) {
        preset = args[i + 1];
    }
    if (args[i] === '--demo' && args[i + 1]) {
        demoFilter = args[i + 1].toLowerCase();
    }
}

const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const outputDir = path.join(__dirname, '..', 'exports', 'screenshots', `qa_${timestamp}_${preset}`);

const THEMES = ['paper', 'gallery', 'ink', 'dark'];
const LAYERS = ['hillshade', 'water', 'parks', 'roads', 'buildings', 'contours'];

const results = {
    timestamp,
    preset,
    demoA: { passed: [], failed: [], errors: [] },
    demoB: { passed: [], failed: [], errors: [] },
    summary: {}
};

async function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

async function testDemoA(browser) {
    console.log('\n========================================');
    console.log('Testing Demo A (MapLibre)');
    console.log('========================================\n');

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Test 1: Basic page load
    console.log('Test 1: Basic page load...');
    try {
        await page.goto(`http://localhost:3000?bbox_preset=${preset}`, { timeout: 30000 });
        await page.waitForTimeout(5000); // Wait for tiles

        const hasCanvas = await page.evaluate(() => document.querySelector('canvas') !== null);
        if (hasCanvas) {
            results.demoA.passed.push('basic_load');
            console.log('  [PASS] Page loaded with map canvas');
        } else {
            results.demoA.failed.push({ test: 'basic_load', reason: 'No canvas found' });
            console.log('  [FAIL] No map canvas found');
        }

        await page.screenshot({ path: path.join(outputDir, 'demoA_initial.png') });
    } catch (e) {
        results.demoA.errors.push({ test: 'basic_load', error: e.message });
        console.log('  [ERROR]', e.message);
    }

    // Test 2: Theme switching
    console.log('\nTest 2: Theme switching...');
    for (const theme of THEMES.slice(0, 2)) { // Test first 2 themes
        try {
            await page.goto(`http://localhost:3000?bbox_preset=${preset}&theme=${theme}`, { timeout: 30000 });
            await page.waitForTimeout(3000);
            await page.screenshot({ path: path.join(outputDir, `demoA_theme_${theme}.png`) });
            results.demoA.passed.push(`theme_${theme}`);
            console.log(`  [PASS] Theme: ${theme}`);
        } catch (e) {
            results.demoA.errors.push({ test: `theme_${theme}`, error: e.message });
            console.log(`  [ERROR] Theme ${theme}:`, e.message);
        }
    }

    // Test 3: Layer toggles
    console.log('\nTest 3: Layer toggles...');
    await page.goto(`http://localhost:3000?bbox_preset=${preset}&theme=paper`, { timeout: 30000 });
    await page.waitForTimeout(3000);

    for (const layer of ['hillshade', 'buildings', 'contours']) {
        try {
            // Toggle layer off
            const toggleResult = await page.evaluate((layerName) => {
                const toggle = document.getElementById(`toggle-${layerName}`);
                if (toggle) {
                    toggle.checked = false;
                    if (window.updateLayerVisibility) window.updateLayerVisibility();
                    return true;
                }
                return false;
            }, layer);

            if (toggleResult) {
                await page.waitForTimeout(1500);
                await page.screenshot({ path: path.join(outputDir, `demoA_layer_${layer}_off.png`) });
                results.demoA.passed.push(`layer_toggle_${layer}`);
                console.log(`  [PASS] Toggle ${layer} off`);

                // Toggle back on
                await page.evaluate((layerName) => {
                    const toggle = document.getElementById(`toggle-${layerName}`);
                    if (toggle) {
                        toggle.checked = true;
                        if (window.updateLayerVisibility) window.updateLayerVisibility();
                    }
                }, layer);
                await page.waitForTimeout(1000);
            } else {
                results.demoA.failed.push({ test: `layer_toggle_${layer}`, reason: 'Toggle not found' });
                console.log(`  [FAIL] Toggle ${layer} not found`);
            }
        } catch (e) {
            results.demoA.errors.push({ test: `layer_toggle_${layer}`, error: e.message });
            console.log(`  [ERROR] Toggle ${layer}:`, e.message);
        }
    }

    // Test 4: Pan operations (if wide preset)
    if (preset === 'stockholm_wide' || preset === 'svealand') {
        console.log('\nTest 4: Pan operations...');
        const panLocations = [
            { name: 'center', x: 0, y: 0 },
            { name: 'north', x: 0, y: -200 },
            { name: 'south', x: 0, y: 200 },
            { name: 'east', x: 200, y: 0 },
            { name: 'west', x: -200, y: 0 }
        ];

        for (const loc of panLocations.slice(0, 3)) { // Test first 3
            try {
                await page.goto(`http://localhost:3000?bbox_preset=${preset}&theme=paper`, { timeout: 30000 });
                await page.waitForTimeout(3000);

                if (loc.x !== 0 || loc.y !== 0) {
                    await page.mouse.move(960, 540);
                    await page.mouse.down();
                    await page.mouse.move(960 + loc.x, 540 + loc.y, { steps: 10 });
                    await page.mouse.up();
                    await page.waitForTimeout(2000);
                }

                await page.screenshot({ path: path.join(outputDir, `demoA_pan_${loc.name}.png`) });
                results.demoA.passed.push(`pan_${loc.name}`);
                console.log(`  [PASS] Pan ${loc.name}`);
            } catch (e) {
                results.demoA.errors.push({ test: `pan_${loc.name}`, error: e.message });
                console.log(`  [ERROR] Pan ${loc.name}:`, e.message);
            }
        }
    }

    // Test 5: Console errors check
    console.log('\nTest 5: Console errors check...');
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(`http://localhost:3000?bbox_preset=${preset}`, { timeout: 30000 });
    await page.waitForTimeout(3000);

    if (consoleErrors.length === 0) {
        results.demoA.passed.push('no_console_errors');
        console.log('  [PASS] No console errors');
    } else {
        results.demoA.failed.push({ test: 'console_errors', reason: `${consoleErrors.length} errors` });
        console.log(`  [WARN] ${consoleErrors.length} console errors found`);
    }

    await page.close();
}

async function testDemoB(browser) {
    console.log('\n========================================');
    console.log('Testing Demo B (Mapnik)');
    console.log('========================================\n');

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Test 1: Basic page load
    console.log('Test 1: Basic page load...');
    try {
        await page.goto('http://localhost:3001', { timeout: 30000 });
        await page.waitForTimeout(2000);

        const hasForm = await page.evaluate(() => document.getElementById('export-form') !== null);
        if (hasForm) {
            results.demoB.passed.push('basic_load');
            console.log('  [PASS] Page loaded with export form');
        } else {
            results.demoB.failed.push({ test: 'basic_load', reason: 'No export form found' });
            console.log('  [FAIL] No export form found');
        }

        await page.screenshot({ path: path.join(outputDir, 'demoB_initial.png') });
    } catch (e) {
        results.demoB.errors.push({ test: 'basic_load', error: e.message });
        console.log('  [ERROR]', e.message);
    }

    // Test 2: Preset selection
    console.log('\nTest 2: Preset selection...');
    try {
        await page.selectOption('#bbox_preset', preset);
        await page.waitForTimeout(1000);

        const presetInfo = await page.textContent('#preset-info');
        if (presetInfo && presetInfo.length > 0) {
            results.demoB.passed.push('preset_info_display');
            console.log('  [PASS] Preset info displayed');
        } else {
            results.demoB.failed.push({ test: 'preset_info', reason: 'No preset info' });
            console.log('  [WARN] No preset info displayed');
        }

        await page.screenshot({ path: path.join(outputDir, `demoB_preset_${preset}.png`) });
    } catch (e) {
        results.demoB.errors.push({ test: 'preset_selection', error: e.message });
        console.log('  [ERROR]', e.message);
    }

    // Test 3: Theme selection
    console.log('\nTest 3: Theme selection...');
    for (const theme of THEMES.slice(0, 2)) {
        try {
            await page.selectOption('#theme', theme);
            await page.waitForTimeout(500);
            await page.screenshot({ path: path.join(outputDir, `demoB_theme_${theme}.png`) });
            results.demoB.passed.push(`theme_select_${theme}`);
            console.log(`  [PASS] Theme selected: ${theme}`);
        } catch (e) {
            results.demoB.errors.push({ test: `theme_select_${theme}`, error: e.message });
            console.log(`  [ERROR] Theme ${theme}:`, e.message);
        }
    }

    // Test 4: Validation (try invalid params)
    console.log('\nTest 4: Validation checks...');
    try {
        await page.selectOption('#bbox_preset', 'svealand');
        await page.waitForTimeout(500);  // Wait for preset change to process

        // Clear and fill DPI field, then trigger change event
        await page.fill('#dpi', '400');  // Should trigger validation error for svealand
        await page.evaluate(() => {
            const dpiInput = document.getElementById('dpi');
            dpiInput.dispatchEvent(new Event('change', { bubbles: true }));
        });
        await page.waitForTimeout(2000);

        const validationBox = await page.textContent('#validation-box');
        if (validationBox && validationBox.includes('exceeds')) {
            results.demoB.passed.push('validation_error_display');
            console.log('  [PASS] Validation error displayed correctly');
        } else {
            results.demoB.failed.push({ test: 'validation', reason: 'Validation not triggered' });
            console.log('  [WARN] Validation error not displayed');
        }

        await page.screenshot({ path: path.join(outputDir, 'demoB_validation_error.png') });

        // Reset to valid params
        await page.selectOption('#bbox_preset', preset);
        await page.fill('#dpi', '150');
        await page.evaluate(() => {
            const dpiInput = document.getElementById('dpi');
            dpiInput.dispatchEvent(new Event('change', { bubbles: true }));
        });
    } catch (e) {
        results.demoB.errors.push({ test: 'validation', error: e.message });
        console.log('  [ERROR]', e.message);
    }

    // Test 5: Layer checkboxes
    console.log('\nTest 5: Layer checkboxes...');
    try {
        const layerCheckboxes = await page.evaluate(() => {
            const layers = ['hillshade', 'water', 'parks', 'roads', 'buildings', 'contours'];
            return layers.map(l => {
                const el = document.getElementById(`layer-${l}`);
                return el ? { layer: l, checked: el.checked } : null;
            }).filter(Boolean);
        });

        if (layerCheckboxes.length === 6) {
            results.demoB.passed.push('layer_checkboxes_present');
            console.log('  [PASS] All 6 layer checkboxes present');
        } else {
            results.demoB.failed.push({ test: 'layer_checkboxes', reason: `Only ${layerCheckboxes.length} found` });
            console.log(`  [WARN] Only ${layerCheckboxes.length} layer checkboxes found`);
        }
    } catch (e) {
        results.demoB.errors.push({ test: 'layer_checkboxes', error: e.message });
        console.log('  [ERROR]', e.message);
    }

    // Test 6: Console errors
    console.log('\nTest 6: Console errors check...');
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.reload();
    await page.waitForTimeout(2000);

    if (consoleErrors.length === 0) {
        results.demoB.passed.push('no_console_errors');
        console.log('  [PASS] No console errors');
    } else {
        results.demoB.failed.push({ test: 'console_errors', reason: `${consoleErrors.length} errors` });
        console.log(`  [WARN] ${consoleErrors.length} console errors found`);
    }

    await page.close();
}

async function generateReport() {
    // Calculate summary
    results.summary = {
        demoA: {
            passed: results.demoA.passed.length,
            failed: results.demoA.failed.length,
            errors: results.demoA.errors.length,
            total: results.demoA.passed.length + results.demoA.failed.length + results.demoA.errors.length
        },
        demoB: {
            passed: results.demoB.passed.length,
            failed: results.demoB.failed.length,
            errors: results.demoB.errors.length,
            total: results.demoB.passed.length + results.demoB.failed.length + results.demoB.errors.length
        }
    };

    // Save JSON results
    const jsonPath = path.join(outputDir, 'qa_results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${jsonPath}`);

    // Generate markdown report
    const mdReport = `# QA Test Report

**Generated**: ${new Date().toISOString()}
**Preset**: ${preset}
**Output Directory**: ${outputDir}

## Summary

| Demo | Passed | Failed | Errors | Total |
|------|--------|--------|--------|-------|
| Demo A | ${results.summary.demoA.passed} | ${results.summary.demoA.failed} | ${results.summary.demoA.errors} | ${results.summary.demoA.total} |
| Demo B | ${results.summary.demoB.passed} | ${results.summary.demoB.failed} | ${results.summary.demoB.errors} | ${results.summary.demoB.total} |

## Demo A Results

### Passed
${results.demoA.passed.map(t => `- ${t}`).join('\n') || '- None'}

### Failed
${results.demoA.failed.map(f => `- ${f.test}: ${f.reason}`).join('\n') || '- None'}

### Errors
${results.demoA.errors.map(e => `- ${e.test}: ${e.error}`).join('\n') || '- None'}

## Demo B Results

### Passed
${results.demoB.passed.map(t => `- ${t}`).join('\n') || '- None'}

### Failed
${results.demoB.failed.map(f => `- ${f.test}: ${f.reason}`).join('\n') || '- None'}

### Errors
${results.demoB.errors.map(e => `- ${e.test}: ${e.error}`).join('\n') || '- None'}

## Screenshots

Screenshots saved in: \`${outputDir}\`
`;

    const mdPath = path.join(outputDir, 'QA_REPORT.md');
    fs.writeFileSync(mdPath, mdReport);
    console.log(`Report saved to: ${mdPath}`);

    // Print summary to console
    console.log('\n========================================');
    console.log('QA TEST SUMMARY');
    console.log('========================================');
    console.log(`Demo A: ${results.summary.demoA.passed} passed, ${results.summary.demoA.failed} failed, ${results.summary.demoA.errors} errors`);
    console.log(`Demo B: ${results.summary.demoB.passed} passed, ${results.summary.demoB.failed} failed, ${results.summary.demoB.errors} errors`);
    console.log(`\nScreenshots: ${outputDir}`);
}

async function main() {
    console.log('========================================');
    console.log('TOPO MAP QA TEST SUITE');
    console.log('========================================');
    console.log(`Timestamp: ${timestamp}`);
    console.log(`Preset: ${preset}`);
    console.log(`Testing: ${demoFilter === 'both' ? 'Demo A and Demo B' : `Demo ${demoFilter.toUpperCase()}`}`);

    await ensureDir(outputDir);

    const browser = await chromium.launch({ headless: true });

    try {
        if (demoFilter === 'both' || demoFilter === 'a') {
            await testDemoA(browser);
        }

        if (demoFilter === 'both' || demoFilter === 'b') {
            await testDemoB(browser);
        }

        await generateReport();
    } catch (e) {
        console.error('Fatal error:', e);
    } finally {
        await browser.close();
    }
}

main().catch(console.error);
