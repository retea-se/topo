/**
 * Golden Print Export Audit Runner
 *
 * Runs a comprehensive 18-case matrix to audit print export behavior:
 * - 3 presets (A2_Paper_v1, A3_Blueprint_v1, A1_Terrain_v1)
 * - 3 templates (Classic, Minimal, Bold)
 * - 2 variants (A: scale+attr ON, B: scale+attr OFF)
 *
 * Usage:
 *   npx playwright test scripts/qa_print_export_golden_audit.spec.js --workers=1
 *
 * Prerequisites:
 *   - Docker stack running (demo-a web, tileserver, exporter)
 *   - Ports: 3000 (web), 8080 (tiles), 8082 (exporter)
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Configuration
const EDITOR_URL = process.env.EDITOR_URL || 'http://localhost:3000/editor';
const EXPORTER_URL = process.env.EXPORTER_URL || 'http://localhost:8082';
const OUTPUT_DIR = path.join(__dirname, '..', 'exports', 'golden_audit');

// Test matrix
const PRESETS = [
  {
    id: 'A2_Paper_v1',
    bbox_preset: 'stockholm_core',
    theme: 'paper',
    width_mm: 594,
    height_mm: 420,
    dpi: 150,
    title: 'Stockholm Paper',
    subtitle: 'A2 Landscape'
  },
  {
    id: 'A3_Blueprint_v1',
    bbox_preset: 'stockholm_core',
    theme: 'blueprint-muted',
    width_mm: 420,
    height_mm: 297,
    dpi: 150,
    title: 'Stockholm Blueprint',
    subtitle: 'Technical Map'
  },
  {
    id: 'A1_Terrain_v1',
    bbox_preset: 'stockholm_wide',
    theme: 'gallery',
    width_mm: 594,
    height_mm: 841,
    dpi: 150,
    title: 'Stockholm Terrain',
    subtitle: 'Wide Coverage'
  }
];

const TEMPLATES = ['classic', 'minimal', 'bold'];

const VARIANTS = [
  { id: 'A', show_scale: true, show_attribution: true },
  { id: 'B', show_scale: false, show_attribution: false }
];

// Ensure output directory exists
function ensureOutputDir(subPath) {
  const fullPath = path.join(OUTPUT_DIR, subPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  return fullPath;
}

// Fetch export from exporter service
function fetchExport(params) {
  return new Promise((resolve, reject) => {
    const urlParams = new URLSearchParams({
      bbox_preset: params.bbox_preset,
      theme: params.theme,
      dpi: params.dpi || 150,
      width_mm: params.width_mm,
      height_mm: params.height_mm,
      title: params.title || '',
      subtitle: params.subtitle || '',
      layout_template: params.layout_template || 'classic',
      show_scale: params.show_scale ? 'true' : 'false',
      show_attribution: params.show_attribution ? 'true' : 'false'
    });

    const url = `${EXPORTER_URL}/render?${urlParams}`;
    console.log(`    Exporting: ${params.layout_template} template...`);

    const req = http.get(url, { timeout: 180000 }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }

      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Main test suite
test.describe('Golden Print Export Audit', () => {
  test.describe.configure({ mode: 'serial', timeout: 300000 });

  // Generate test for each matrix combination
  for (const preset of PRESETS) {
    for (const template of TEMPLATES) {
      for (const variant of VARIANTS) {
        const testId = `${preset.id}_${template}_${variant.id}`;

        test(`Audit: ${testId}`, async ({ page }) => {
          const casePath = `${preset.id}/${template}/variant_${variant.id}`;
          const outputPath = ensureOutputDir(casePath);

          const metadata = {
            test_id: testId,
            preset: preset.id,
            bbox_preset: preset.bbox_preset,
            theme: preset.theme,
            template: template,
            variant: variant.id,
            width_mm: preset.width_mm,
            height_mm: preset.height_mm,
            dpi: preset.dpi,
            title: preset.title,
            subtitle: preset.subtitle,
            show_scale: variant.show_scale,
            show_attribution: variant.show_attribution,
            timestamp: new Date().toISOString(),
            results: {}
          };

          const consoleLogs = [];
          const errors = [];

          // Capture console logs
          page.on('console', msg => {
            consoleLogs.push({
              type: msg.type(),
              text: msg.text(),
              time: new Date().toISOString()
            });
          });

          page.on('pageerror', error => {
            errors.push({
              message: error.message,
              stack: error.stack,
              time: new Date().toISOString()
            });
          });

          try {
            // Step 1: Load editor
            console.log(`\n  [${testId}] Step 1: Loading editor...`);
            await page.goto(EDITOR_URL, { timeout: 60000 });
            await page.waitForLoadState('networkidle');

            // Wait for map to load
            await page.waitForFunction(() => window.map && window.map.isStyleLoaded(), { timeout: 60000 });
            metadata.results.editor_loaded = true;

            // Step 2: Select preset
            console.log(`  [${testId}] Step 2: Selecting preset ${preset.bbox_preset}...`);
            await page.selectOption('#preset-select', preset.bbox_preset);
            await page.waitForTimeout(500);
            metadata.results.preset_selected = true;

            // Step 3: Select theme
            console.log(`  [${testId}] Step 3: Selecting theme ${preset.theme}...`);
            await page.selectOption('#theme-select', preset.theme);
            await page.waitForTimeout(1000);
            await page.waitForFunction(() => window.map && window.map.isStyleLoaded(), { timeout: 30000 });
            metadata.results.theme_selected = true;

            // Step 4: Set paper size
            console.log(`  [${testId}] Step 4: Setting paper size...`);
            // Determine paper size from dimensions
            let paperSize = 'A3';
            if (preset.width_mm === 594 && preset.height_mm === 420) paperSize = 'A2';
            else if (preset.width_mm === 420 && preset.height_mm === 297) paperSize = 'A3';
            else if (preset.width_mm === 594 && preset.height_mm === 841) paperSize = 'A1';

            await page.selectOption('#paper-size-select', paperSize);

            // Set orientation based on dimensions
            const isLandscape = preset.width_mm > preset.height_mm;
            if (isLandscape) {
              await page.click('#orientation-landscape');
            } else {
              await page.click('#orientation-portrait');
            }
            await page.waitForTimeout(300);
            metadata.results.paper_configured = true;

            // Step 5: Set layout template
            console.log(`  [${testId}] Step 5: Setting layout template ${template}...`);
            const layoutSelect = page.locator('#layout-select');
            if (await layoutSelect.isVisible()) {
              await layoutSelect.selectOption(template);
            }
            await page.waitForTimeout(300);
            metadata.results.template_selected = true;

            // Step 6: Set title/subtitle
            console.log(`  [${testId}] Step 6: Setting title/subtitle...`);
            await page.fill('#title-input', preset.title);
            await page.fill('#subtitle-input', preset.subtitle);
            metadata.results.title_set = true;

            // Step 7: Set scale/attribution toggles
            console.log(`  [${testId}] Step 7: Setting composition toggles...`);
            const scaleCheckbox = page.locator('#show-scale');
            const attrCheckbox = page.locator('#show-attribution');

            if (await scaleCheckbox.isVisible()) {
              const isChecked = await scaleCheckbox.isChecked();
              if (isChecked !== variant.show_scale) {
                await scaleCheckbox.click();
              }
            }

            if (await attrCheckbox.isVisible()) {
              const isChecked = await attrCheckbox.isChecked();
              if (isChecked !== variant.show_attribution) {
                await attrCheckbox.click();
              }
            }
            await page.waitForTimeout(300);
            metadata.results.toggles_set = true;

            // Step 8: Activate preview mode
            console.log(`  [${testId}] Step 8: Activating preview...`);
            const previewBtn = page.locator('#preview-btn');
            if (await previewBtn.isVisible()) {
              await previewBtn.click();
              await page.waitForTimeout(1000);
            }
            metadata.results.preview_activated = true;

            // Step 9: Capture preview screenshot
            console.log(`  [${testId}] Step 9: Capturing preview screenshot...`);
            await page.waitForTimeout(500);

            // Screenshot the map container with composition overlay
            const mapContainer = page.locator('#map-container');
            const previewPath = path.join(outputPath, 'preview.png');
            await mapContainer.screenshot({ path: previewPath });
            metadata.results.preview_captured = true;
            metadata.preview_file = 'preview.png';

            // Step 10: Trigger PNG export via exporter service
            console.log(`  [${testId}] Step 10: Triggering PNG export...`);
            try {
              const exportBuffer = await fetchExport({
                bbox_preset: preset.bbox_preset,
                theme: preset.theme,
                dpi: preset.dpi,
                width_mm: preset.width_mm,
                height_mm: preset.height_mm,
                title: preset.title,
                subtitle: preset.subtitle,
                layout_template: template,
                show_scale: variant.show_scale,
                show_attribution: variant.show_attribution
              });

              const exportPath = path.join(outputPath, 'export.png');
              fs.writeFileSync(exportPath, exportBuffer);
              metadata.results.export_captured = true;
              metadata.export_file = 'export.png';
              metadata.export_size_bytes = exportBuffer.length;

              console.log(`  [${testId}] Export saved: ${exportBuffer.length} bytes`);
            } catch (exportError) {
              console.log(`  [${testId}] Export failed: ${exportError.message}`);
              metadata.results.export_error = exportError.message;
            }

            // Save console logs
            const logsPath = path.join(outputPath, 'console.json');
            fs.writeFileSync(logsPath, JSON.stringify(consoleLogs, null, 2));

            // Save errors if any
            if (errors.length > 0) {
              const errorsPath = path.join(outputPath, 'errors.json');
              fs.writeFileSync(errorsPath, JSON.stringify(errors, null, 2));
              metadata.results.errors = errors.length;
            }

            // Save metadata
            const metaPath = path.join(outputPath, 'meta.json');
            fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));

            console.log(`  [${testId}] Audit complete.`);

          } catch (error) {
            metadata.results.fatal_error = error.message;
            const metaPath = path.join(outputPath, 'meta.json');
            fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
            throw error;
          }
        });
      }
    }
  }
});

// Summary test that runs after all audits
test.describe('Audit Summary', () => {
  test('Generate summary report', async () => {
    console.log('\n========================================');
    console.log('Golden Print Export Audit Summary');
    console.log('========================================');

    const summaryPath = path.join(OUTPUT_DIR, 'audit_summary.json');
    const summary = {
      timestamp: new Date().toISOString(),
      total_cases: PRESETS.length * TEMPLATES.length * VARIANTS.length,
      cases: []
    };

    // Read all metadata files
    for (const preset of PRESETS) {
      for (const template of TEMPLATES) {
        for (const variant of VARIANTS) {
          const casePath = `${preset.id}/${template}/variant_${variant.id}`;
          const metaPath = path.join(OUTPUT_DIR, casePath, 'meta.json');

          if (fs.existsSync(metaPath)) {
            try {
              const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
              summary.cases.push({
                id: meta.test_id,
                preset: preset.id,
                template: template,
                variant: variant.id,
                preview_captured: meta.results.preview_captured || false,
                export_captured: meta.results.export_captured || false,
                export_size_bytes: meta.export_size_bytes || 0,
                errors: meta.results.errors || 0,
                fatal_error: meta.results.fatal_error || null
              });
            } catch (e) {
              console.log(`  Warning: Could not read ${metaPath}`);
            }
          }
        }
      }
    }

    // Calculate statistics
    summary.passed = summary.cases.filter(c => c.preview_captured && c.export_captured && !c.fatal_error).length;
    summary.failed = summary.cases.filter(c => c.fatal_error).length;
    summary.partial = summary.total_cases - summary.passed - summary.failed;

    // Save summary
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    console.log(`\nTotal: ${summary.total_cases} cases`);
    console.log(`Passed: ${summary.passed}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Partial: ${summary.partial}`);
    console.log(`\nSummary saved to: ${summaryPath}`);
    console.log('========================================\n');

    expect(summary.passed + summary.partial + summary.failed).toBe(summary.total_cases);
  });
});
