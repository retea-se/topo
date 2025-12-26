<#
.SYNOPSIS
    Captures diagnostic screenshots from Demo A and Demo B.

.DESCRIPTION
    Uses Playwright to capture screenshots from the web UIs with various
    presets and layer combinations for verification.

.PARAMETER Demo
    Which demo to capture: "A", "B", or "All" (default: All)

.PARAMETER Preset
    Bbox preset: "core", "wide", or "both" (default: both)

.PARAMETER Theme
    Theme to use (default: paper)

.EXAMPLE
    .\capture_screenshots.ps1

.EXAMPLE
    .\capture_screenshots.ps1 -Demo A -Preset wide -Theme gallery
#>

param(
    [ValidateSet("A", "B", "All")]
    [string]$Demo = "All",

    [ValidateSet("core", "wide", "both")]
    [string]$Preset = "both",

    [string]$Theme = "paper"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $projectRoot

$screenshotsDir = "$projectRoot\exports\screenshots"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Ensure screenshots directory exists
if (-not (Test-Path $screenshotsDir)) {
    New-Item -ItemType Directory -Path $screenshotsDir | Out-Null
}

Write-Host @"

================================================================================
              SCREENSHOT CAPTURE - Demo Verification
================================================================================

Output: $screenshotsDir
Timestamp: $timestamp

"@ -ForegroundColor Cyan

# Check if Node.js is available
try {
    $null = node --version
} catch {
    Write-Host "[ERROR] Node.js not found. Please install Node.js." -ForegroundColor Red
    exit 1
}

# Check if Playwright is installed
$playwrightCheck = npm list playwright 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[INFO] Installing Playwright..." -ForegroundColor Yellow
    npm install playwright
    npx playwright install chromium
}

# Create temporary script for Playwright
$playwrightScript = @"
const { chromium } = require('playwright');

async function captureScreenshots() {
    const browser = await chromium.launch({ headless: true });
    const presets = $( if ($Preset -eq "both") { "['stockholm_core', 'stockholm_wide']" } elseif ($Preset -eq "wide") { "['stockholm_wide']" } else { "['stockholm_core']" } );
    const demos = $( if ($Demo -eq "A") { "['A']" } elseif ($Demo -eq "B") { "['B']" } else { "['A', 'B']" } );
    const theme = '$Theme';
    const timestamp = '$timestamp';
    const screenshotsDir = '$($screenshotsDir -replace '\\', '/')';

    for (const demo of demos) {
        for (const preset of presets) {
            const presetShort = preset.replace('stockholm_', '');
            const page = await browser.newPage();
            page.setViewportSize({ width: 1920, height: 1080 });

            try {
                if (demo === 'A') {
                    // Demo A screenshots
                    const url = 'http://localhost:3000?bbox_preset=' + preset + '&theme=' + theme;
                    console.log('Capturing Demo A: ' + preset + ' / ' + theme);

                    await page.goto(url);
                    await page.waitForTimeout(5000); // Wait for tiles to load

                    // Full layers
                    const filename = screenshotsDir + '/demoA_' + presetShort + '_full_' + theme + '_' + timestamp + '.png';
                    await page.screenshot({ path: filename, fullPage: false });
                    console.log('  Saved: ' + filename);

                    // Toggle combinations
                    const toggles = [
                        { name: 'roadsOnly', hillshade: false, water: false, roads: true, buildings: false, contours: false },
                        { name: 'noHillshade', hillshade: false, water: true, roads: true, buildings: true, contours: true },
                        { name: 'noContours', hillshade: true, water: true, roads: true, buildings: true, contours: false },
                    ];

                    for (const toggle of toggles) {
                        // Set toggles
                        if (toggle.hillshade !== undefined) {
                            await page.evaluate((val) => { document.getElementById('toggle-hillshade').checked = val; }, toggle.hillshade);
                        }
                        if (toggle.water !== undefined) {
                            await page.evaluate((val) => { document.getElementById('toggle-water').checked = val; }, toggle.water);
                        }
                        if (toggle.roads !== undefined) {
                            await page.evaluate((val) => { document.getElementById('toggle-roads').checked = val; }, toggle.roads);
                        }
                        if (toggle.buildings !== undefined) {
                            await page.evaluate((val) => { document.getElementById('toggle-buildings').checked = val; }, toggle.buildings);
                        }
                        if (toggle.contours !== undefined) {
                            await page.evaluate((val) => { document.getElementById('toggle-contours').checked = val; }, toggle.contours);
                        }

                        // Trigger update
                        await page.evaluate(() => { if (window.updateLayerVisibility) window.updateLayerVisibility(); });
                        await page.waitForTimeout(2000);

                        const toggleFilename = screenshotsDir + '/demoA_' + presetShort + '_' + toggle.name + '_' + theme + '_' + timestamp + '.png';
                        await page.screenshot({ path: toggleFilename, fullPage: false });
                        console.log('  Saved: ' + toggleFilename);
                    }
                } else if (demo === 'B') {
                    // Demo B screenshots
                    const url = 'http://localhost:3001';
                    console.log('Capturing Demo B: ' + preset + ' / ' + theme);

                    await page.goto(url);
                    await page.waitForTimeout(2000);

                    // Set preset and theme if dropdowns exist
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
"@

# Write and run the Playwright script
$tempScript = "$env:TEMP\capture_screenshots.js"
$playwrightScript | Out-File -Encoding utf8 -FilePath $tempScript

Write-Host "[INFO] Running Playwright screenshot capture..." -ForegroundColor Gray

try {
    node $tempScript
    Write-Host "`n[OK] Screenshots saved to: $screenshotsDir" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Screenshot capture failed: $_" -ForegroundColor Red
    exit 1
} finally {
    Remove-Item $tempScript -ErrorAction SilentlyContinue
}

# Create README for screenshots
$readme = @"
# Screenshots

This directory contains diagnostic screenshots from Demo A and Demo B.

## Naming Convention

- ``demoA_{preset}_{mode}_{theme}_{timestamp}.png``
- ``demoB_{preset}_{mode}_{theme}_{timestamp}.png``

## Modes

- ``full`` - All layers enabled
- ``roadsOnly`` - Only roads visible
- ``noHillshade`` - Hillshade disabled
- ``noContours`` - Contours disabled
- ``ui`` - Demo B UI screenshot

## Presets

- ``core`` - Stockholm Core (central city)
- ``wide`` - Stockholm Wide (suburbs + city)

## Latest Screenshots

Generated: $timestamp
"@

$readme | Out-File -Encoding utf8 -FilePath "$screenshotsDir\README.md"
Write-Host "[OK] README.md updated" -ForegroundColor Green
