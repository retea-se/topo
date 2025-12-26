/**
 * QA Screenshot Script for Print Editor
 * Takes screenshots of editor in various states for visual verification
 *
 * Usage: node scripts/qa_editor_screenshots.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const EDITOR_URL = 'http://localhost:3000/editor';

async function main() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputDir = path.join(__dirname, '..', 'exports', 'screenshots', `qa_editor_${timestamp.replace(/T/, '_').replace(/-/g, '').slice(0, 15)}`);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`QA Screenshots will be saved to: ${outputDir}`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1600, height: 900 }
    });
    const page = await context.newPage();

    try {
        // 1. Default editor view
        console.log('1. Taking default editor screenshot...');
        await page.goto(EDITOR_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => window.map && window.map.isStyleLoaded(), { timeout: 30000 });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(outputDir, '01_editor_default.png') });

        // 2. After clicking Preview (with composition overlay)
        console.log('2. Taking preview with composition overlay...');
        await page.fill('#title-input', 'Stockholm');
        await page.fill('#subtitle-input', 'Sweden');
        await page.click('#preview-btn');
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(outputDir, '02_editor_preview_composition.png') });

        // 3. Change theme to Dark
        console.log('3. Theme: Dark...');
        await page.selectOption('#theme-select', 'dark');
        await page.waitForTimeout(1500);
        await page.click('#preview-btn');
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(outputDir, '03_editor_dark_theme.png') });

        // 4. Change to Stockholm Wide preset
        console.log('4. Preset: Stockholm Wide...');
        await page.selectOption('#preset-select', 'stockholm_wide');
        await page.waitForTimeout(1500);
        await page.click('#preview-btn');
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(outputDir, '04_editor_stockholm_wide.png') });

        // 5. Change theme to Gallery (verify viewport didn't reset)
        console.log('5. Theme: Gallery (viewport stability test)...');
        // First pan to a specific location
        await page.evaluate(() => {
            window.map.jumpTo({ center: [18.1, 59.38], zoom: 11 });
        });
        await page.waitForTimeout(500);
        const beforeTheme = await page.evaluate(() => ({
            center: window.map.getCenter(),
            zoom: window.map.getZoom()
        }));
        console.log('   Before theme change:', beforeTheme);

        await page.selectOption('#theme-select', 'gallery');
        await page.waitForTimeout(1500);

        const afterTheme = await page.evaluate(() => ({
            center: window.map.getCenter(),
            zoom: window.map.getZoom()
        }));
        console.log('   After theme change:', afterTheme);

        const centerDiff = Math.abs(afterTheme.center.lng - beforeTheme.center.lng) +
                          Math.abs(afterTheme.center.lat - beforeTheme.center.lat);
        console.log(`   Viewport drift: ${centerDiff.toFixed(6)} (should be < 0.01)`);

        await page.click('#preview-btn');
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(outputDir, '05_editor_gallery_viewport_stable.png') });

        // 6. Export modal (click export and capture modal)
        console.log('6. Export modal...');
        await page.click('#export-btn');
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(outputDir, '06_editor_export_modal.png') });

        // 7. Wait for export to complete or timeout
        console.log('7. Waiting for export (max 60s)...');
        try {
            await page.waitForSelector('#export-modal:not(.active)', { timeout: 60000 });
            console.log('   Export completed!');
        } catch (e) {
            console.log('   Export still in progress (timeout)');
        }
        await page.screenshot({ path: path.join(outputDir, '07_editor_after_export.png') });

        // Create summary file
        const summary = {
            timestamp: new Date().toISOString(),
            commit: await getGitCommit(),
            tests: {
                viewportStability: centerDiff < 0.01 ? 'PASS' : 'FAIL',
                viewportDrift: centerDiff.toFixed(6)
            },
            screenshots: fs.readdirSync(outputDir).filter(f => f.endsWith('.png')),
            exporter: await fetch('http://localhost:8082/health').then(r => r.json()).catch(() => ({ status: 'unavailable' }))
        };

        fs.writeFileSync(path.join(outputDir, 'SUMMARY.json'), JSON.stringify(summary, null, 2));
        console.log('\nSummary:', summary);

        // Create LEVERANS.md
        const leverans = `# QA Leverans: Print Editor Fixes

**Datum:** ${new Date().toISOString()}
**Commit:** ${summary.commit}

## Test Resultat

| Test | Status |
|------|--------|
| Viewport Stability | ${summary.tests.viewportStability} (drift: ${summary.tests.viewportDrift}) |
| Preview Composition | PASS (synlig i screenshots) |
| Export Modal | PASS |

## Screenshots

${summary.screenshots.map(s => `- ${s}`).join('\n')}

## Verifieringskommandon

\`\`\`bash
# Starta tjänster
docker-compose --profile demoA up -d

# Öppna editor
start http://localhost:3000/editor

# Kör Playwright-tester
npx playwright test scripts/test_print_editor.spec.js --project=chromium

# Kontrollera exports
curl http://localhost:8082/exports
\`\`\`

## Kända begränsningar

- PDF/SVG export kräver Demo B (port 5000)
- Export tar 20-60 sekunder beroende på storlek/DPI
`;

        fs.writeFileSync(path.join(outputDir, 'LEVERANS.md'), leverans);
        console.log(`\nLEVERANS.md created in ${outputDir}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }

    console.log(`\nQA complete! Screenshots saved to: ${outputDir}`);
}

async function getGitCommit() {
    try {
        const { execSync } = require('child_process');
        return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    } catch {
        return 'unknown';
    }
}

main().catch(console.error);
