#!/bin/bash
# Capture diagnostic screenshots from Demo A and Demo B
# Usage: ./scripts/capture_screenshots.sh [--demo A|B|All] [--preset core|wide|both] [--theme name]

set -e

DEMO="All"
PRESET="both"
THEME="paper"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --demo) DEMO="$2"; shift 2 ;;
        --preset) PRESET="$2"; shift 2 ;;
        --theme) THEME="$2"; shift 2 ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

cd "$(dirname "$0")/.."

SCREENSHOTS_DIR="$(pwd)/exports/screenshots"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$SCREENSHOTS_DIR"

echo "
================================================================================
              SCREENSHOT CAPTURE - Demo Verification
================================================================================

Output: $SCREENSHOTS_DIR
Timestamp: $TIMESTAMP
"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js not found. Please install Node.js."
    exit 1
fi

# Check Playwright
if ! npm list playwright &> /dev/null; then
    echo "[INFO] Installing Playwright..."
    npm install playwright
    npx playwright install chromium
fi

# Determine presets array
if [ "$PRESET" = "both" ]; then
    PRESETS_JS="['stockholm_core', 'stockholm_wide']"
elif [ "$PRESET" = "wide" ]; then
    PRESETS_JS="['stockholm_wide']"
else
    PRESETS_JS="['stockholm_core']"
fi

# Determine demos array
if [ "$DEMO" = "A" ]; then
    DEMOS_JS="['A']"
elif [ "$DEMO" = "B" ]; then
    DEMOS_JS="['B']"
else
    DEMOS_JS="['A', 'B']"
fi

# Create Playwright script
cat > /tmp/capture_screenshots.js << EOF
const { chromium } = require('playwright');

async function captureScreenshots() {
    const browser = await chromium.launch({ headless: true });
    const presets = ${PRESETS_JS};
    const demos = ${DEMOS_JS};
    const theme = '${THEME}';
    const timestamp = '${TIMESTAMP}';
    const screenshotsDir = '${SCREENSHOTS_DIR}';

    for (const demo of demos) {
        for (const preset of presets) {
            const presetShort = preset.replace('stockholm_', '');
            const page = await browser.newPage();
            page.setViewportSize({ width: 1920, height: 1080 });

            try {
                if (demo === 'A') {
                    const url = 'http://localhost:3000?bbox_preset=' + preset + '&theme=' + theme;
                    console.log('Capturing Demo A: ' + preset + ' / ' + theme);

                    await page.goto(url);
                    await page.waitForTimeout(5000);

                    const filename = screenshotsDir + '/demoA_' + presetShort + '_full_' + theme + '_' + timestamp + '.png';
                    await page.screenshot({ path: filename, fullPage: false });
                    console.log('  Saved: ' + filename);

                    const toggles = [
                        { name: 'roadsOnly', hillshade: false, water: false, roads: true, buildings: false, contours: false },
                        { name: 'noHillshade', hillshade: false, water: true, roads: true, buildings: true, contours: true },
                        { name: 'noContours', hillshade: true, water: true, roads: true, buildings: true, contours: false },
                    ];

                    for (const toggle of toggles) {
                        await page.evaluate((val) => { document.getElementById('toggle-hillshade').checked = val; }, toggle.hillshade);
                        await page.evaluate((val) => { document.getElementById('toggle-water').checked = val; }, toggle.water);
                        await page.evaluate((val) => { document.getElementById('toggle-roads').checked = val; }, toggle.roads);
                        await page.evaluate((val) => { document.getElementById('toggle-buildings').checked = val; }, toggle.buildings);
                        await page.evaluate((val) => { document.getElementById('toggle-contours').checked = val; }, toggle.contours);
                        await page.evaluate(() => { if (window.updateLayerVisibility) window.updateLayerVisibility(); });
                        await page.waitForTimeout(2000);

                        const toggleFilename = screenshotsDir + '/demoA_' + presetShort + '_' + toggle.name + '_' + theme + '_' + timestamp + '.png';
                        await page.screenshot({ path: toggleFilename, fullPage: false });
                        console.log('  Saved: ' + toggleFilename);
                    }
                } else if (demo === 'B') {
                    const url = 'http://localhost:3001';
                    console.log('Capturing Demo B: ' + preset + ' / ' + theme);

                    await page.goto(url);
                    await page.waitForTimeout(2000);

                    try {
                        await page.selectOption('#bbox-select', preset);
                        await page.selectOption('#theme-select', theme);
                    } catch (e) {
                        console.log('  Note: Could not set preset/theme dropdowns');
                    }

                    await page.waitForTimeout(1000);

                    const filename = screenshotsDir + '/demoB_' + presetShort + '_ui_' + theme + '_' + timestamp + '.png';
                    await page.screenshot({ path: filename, fullPage: false });
                    console.log('  Saved: ' + filename);
                }
            } catch (e) {
                console.error('Error capturing ' + demo + ' / ' + preset + ': ' + e.message);
            } finally {
                await page.close();
            }
        }
    }

    await browser.close();
    console.log('\nScreenshot capture complete!');
}

captureScreenshots().catch(console.error);
EOF

echo "[INFO] Running Playwright screenshot capture..."
node /tmp/capture_screenshots.js

# Create README
cat > "$SCREENSHOTS_DIR/README.md" << EOF
# Screenshots

This directory contains diagnostic screenshots from Demo A and Demo B.

## Naming Convention

- \`demoA_{preset}_{mode}_{theme}_{timestamp}.png\`
- \`demoB_{preset}_{mode}_{theme}_{timestamp}.png\`

## Modes

- \`full\` - All layers enabled
- \`roadsOnly\` - Only roads visible
- \`noHillshade\` - Hillshade disabled
- \`noContours\` - Contours disabled
- \`ui\` - Demo B UI screenshot

## Presets

- \`core\` - Stockholm Core (central city)
- \`wide\` - Stockholm Wide (suburbs + city)

## Latest Screenshots

Generated: ${TIMESTAMP}
EOF

echo "[OK] Screenshots saved to: $SCREENSHOTS_DIR"
