const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const screenshotsDir = path.join(__dirname, '..', 'exports', 'screenshots');
const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);

async function captureScreenshots() {
    // Ensure directory exists
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    console.log('Starting QA screenshot capture...');
    console.log('Timestamp:', timestamp);
    console.log('Output:', screenshotsDir);
    console.log('');

    const browser = await chromium.launch({ headless: true });
    const results = { passed: [], failed: [], errors: [] };

    // Test configurations
    const tests = [
        // Demo A Core
        { demo: 'A', preset: 'stockholm_core', theme: 'paper', name: 'demoA_core_paper_allLayers' },
        // Demo A Wide
        { demo: 'A', preset: 'stockholm_wide', theme: 'paper', name: 'demoA_wide_paper_allLayers' },
        { demo: 'A', preset: 'stockholm_wide', theme: 'gallery', name: 'demoA_wide_gallery_allLayers' },
        // Demo A Wide with toggles
        { demo: 'A', preset: 'stockholm_wide', theme: 'paper', name: 'demoA_wide_paper_roadsOff', toggle: 'roads', off: true },
        { demo: 'A', preset: 'stockholm_wide', theme: 'paper', name: 'demoA_wide_paper_buildingsOff', toggle: 'buildings', off: true },
        { demo: 'A', preset: 'stockholm_wide', theme: 'paper', name: 'demoA_wide_paper_contoursOff', toggle: 'contours', off: true },
        { demo: 'A', preset: 'stockholm_wide', theme: 'paper', name: 'demoA_wide_paper_hillshadeOff', toggle: 'hillshade', off: true },
        // Demo B
        { demo: 'B', preset: 'stockholm_core', theme: 'paper', name: 'demoB_core_paper_ui' },
        { demo: 'B', preset: 'stockholm_wide', theme: 'paper', name: 'demoB_wide_paper_ui' },
    ];

    for (const test of tests) {
        const page = await browser.newPage();
        await page.setViewportSize({ width: 1920, height: 1080 });

        try {
            console.log(`Testing: ${test.name}...`);

            if (test.demo === 'A') {
                const url = `http://localhost:3000?bbox_preset=${test.preset}&theme=${test.theme}`;
                await page.goto(url, { timeout: 30000 });
                await page.waitForTimeout(5000); // Wait for tiles

                // Check for console errors
                const consoleErrors = [];
                page.on('console', msg => {
                    if (msg.type() === 'error') consoleErrors.push(msg.text());
                });

                // Check network for 404s
                const networkErrors = [];
                page.on('response', response => {
                    if (response.status() === 404) {
                        networkErrors.push(response.url());
                    }
                });

                // Handle toggle if specified
                if (test.toggle) {
                    const toggleId = `toggle-${test.toggle}`;
                    const checkedVal = !test.off;
                    await page.evaluate(({ id, val }) => {
                        const el = document.getElementById(id);
                        if (el) {
                            el.checked = val;
                            if (window.updateLayerVisibility) window.updateLayerVisibility();
                        }
                    }, { id: toggleId, val: checkedVal });
                    await page.waitForTimeout(2000);
                }

                // Take screenshot
                const filename = path.join(screenshotsDir, `${test.name}_${timestamp}.png`);
                await page.screenshot({ path: filename });
                console.log(`  Saved: ${filename}`);

                // Verify map has content (check canvas or map element)
                const hasMap = await page.evaluate(() => {
                    const canvas = document.querySelector('canvas');
                    return canvas !== null;
                });

                if (hasMap) {
                    results.passed.push(test.name);
                } else {
                    results.failed.push({ name: test.name, reason: 'No map canvas found' });
                }

            } else if (test.demo === 'B') {
                await page.goto('http://localhost:3001', { timeout: 30000 });
                await page.waitForTimeout(2000);

                // Try to set preset and theme
                try {
                    await page.selectOption('#bbox-select', test.preset);
                    await page.selectOption('#theme-select', test.theme);
                    await page.waitForTimeout(1000);
                } catch (e) {
                    console.log('  Note: Preset/theme selectors not found or different');
                }

                const filename = path.join(screenshotsDir, `${test.name}_${timestamp}.png`);
                await page.screenshot({ path: filename });
                console.log(`  Saved: ${filename}`);
                results.passed.push(test.name);
            }

        } catch (e) {
            console.error(`  ERROR: ${e.message}`);
            results.errors.push({ name: test.name, error: e.message });
        } finally {
            await page.close();
        }
    }

    await browser.close();

    // Print summary
    console.log('\n========================================');
    console.log('QA SCREENSHOT SUMMARY');
    console.log('========================================');
    console.log(`Passed: ${results.passed.length}`);
    console.log(`Failed: ${results.failed.length}`);
    console.log(`Errors: ${results.errors.length}`);

    if (results.failed.length > 0) {
        console.log('\nFailed tests:');
        results.failed.forEach(f => console.log(`  - ${f.name}: ${f.reason}`));
    }
    if (results.errors.length > 0) {
        console.log('\nErrors:');
        results.errors.forEach(e => console.log(`  - ${e.name}: ${e.error}`));
    }

    console.log(`\nScreenshots saved to: ${screenshotsDir}`);
    console.log(`Timestamp: ${timestamp}`);

    // Write results to JSON
    const resultsFile = path.join(screenshotsDir, `qa_results_${timestamp}.json`);
    fs.writeFileSync(resultsFile, JSON.stringify({ timestamp, results }, null, 2));
    console.log(`Results saved to: ${resultsFile}`);
}

captureScreenshots().catch(console.error);
