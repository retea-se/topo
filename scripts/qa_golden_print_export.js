#!/usr/bin/env node
/**
 * Golden Print Export Regression Test
 *
 * Compares current export output against golden baselines.
 * Fails if any export differs beyond the acceptance threshold.
 *
 * Usage:
 *   node scripts/qa_golden_print_export.js
 *
 * Environment:
 *   EXPORTER_URL - Exporter URL (default: http://localhost:8082)
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const EXPORTER_URL = process.env.EXPORTER_URL || 'http://localhost:8082';
const GOLDEN_DIR = path.join(__dirname, '..', 'golden', 'print_export');
const OUTPUT_DIR = path.join(__dirname, '..', 'exports', 'golden_test');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Load golden metadata
 */
function loadMetadata() {
  const metadataPath = path.join(GOLDEN_DIR, 'metadata.json');
  if (!fs.existsSync(metadataPath)) {
    throw new Error(`Golden metadata not found: ${metadataPath}`);
  }
  return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
}

/**
 * Fetch export from exporter service
 */
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
    console.log(`  Fetching: ${url.substring(0, 100)}...`);

    const protocol = url.startsWith('https') ? https : http;

    const req = protocol.get(url, { timeout: 180000 }, (res) => {
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

/**
 * Calculate SHA256 hash of a buffer
 */
function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Extract PNG dimensions from header
 */
function getPngDimensions(buffer) {
  // PNG signature (8 bytes) + IHDR chunk
  if (buffer.length < 24) {
    return null;
  }

  // Check PNG signature
  const signature = buffer.slice(0, 8);
  if (signature.toString('hex') !== '89504e470d0a1a0a') {
    return null;
  }

  // IHDR is always the first chunk after signature
  // Length (4) + Type (4) + Width (4) + Height (4)
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);

  return { width, height };
}

/**
 * Simple pixel difference using raw bytes
 * Returns percentage of different bytes
 */
function calculateByteDiff(buffer1, buffer2) {
  if (buffer1.length !== buffer2.length) {
    return 100; // Completely different if sizes don't match
  }

  let diffCount = 0;
  for (let i = 0; i < buffer1.length; i++) {
    if (buffer1[i] !== buffer2[i]) {
      diffCount++;
    }
  }

  return (diffCount / buffer1.length) * 100;
}

/**
 * Test a single golden export
 */
async function testGolden(golden, metadata) {
  const testId = golden.id;
  console.log(`\n  Testing: ${testId}`);
  console.log(`  Purpose: ${golden.purpose}`);

  const results = {
    id: testId,
    passed: true,
    errors: []
  };

  try {
    // Build export params from golden metadata
    const params = {
      bbox_preset: golden.params.bbox_preset,
      theme: golden.params.theme,
      dpi: golden.dimensions.dpi,
      width_mm: golden.dimensions.width_mm,
      height_mm: golden.dimensions.height_mm,
      title: golden.params.title,
      subtitle: golden.params.subtitle,
      layout_template: golden.params.layout_template,
      show_scale: golden.params.show_scale,
      show_attribution: golden.params.show_attribution
    };

    // Fetch new export
    const newExport = await fetchExport(params);

    // Save for inspection
    const outputPath = path.join(OUTPUT_DIR, `${testId}_test.png`);
    fs.writeFileSync(outputPath, newExport);
    console.log(`  Saved test export: ${outputPath}`);

    // Check dimensions
    const newDims = getPngDimensions(newExport);
    if (!newDims) {
      results.errors.push('Invalid PNG format');
      results.passed = false;
    } else {
      const expectedWidth = golden.dimensions.width_px;
      const expectedHeight = golden.dimensions.height_px;

      if (newDims.width !== expectedWidth || newDims.height !== expectedHeight) {
        results.errors.push(
          `Dimension mismatch: expected ${expectedWidth}x${expectedHeight}, got ${newDims.width}x${newDims.height}`
        );
        results.passed = false;
      } else {
        console.log(`  Dimensions: ${newDims.width}x${newDims.height} ✓`);
      }
    }

    // Load golden baseline
    const goldenPath = path.join(GOLDEN_DIR, golden.file);
    if (!fs.existsSync(goldenPath)) {
      results.errors.push(`Golden file not found: ${goldenPath}`);
      results.passed = false;
    } else {
      const goldenBuffer = fs.readFileSync(goldenPath);

      // Compare SHA256
      const newHash = sha256(newExport);
      console.log(`  SHA256: ${newHash}`);

      if (newHash === golden.sha256) {
        console.log(`  Hash match: identical to golden ✓`);
      } else {
        // Calculate byte difference
        const byteDiff = calculateByteDiff(goldenBuffer, newExport);
        const threshold = metadata.acceptance_threshold.pixel_diff_percent_max;

        console.log(`  Byte diff: ${byteDiff.toFixed(4)}%`);

        if (byteDiff > threshold) {
          results.errors.push(
            `Byte difference ${byteDiff.toFixed(4)}% exceeds threshold ${threshold}%`
          );
          results.passed = false;

          // Save diff info
          const diffPath = path.join(OUTPUT_DIR, `${testId}_diff_info.txt`);
          fs.writeFileSync(diffPath, `
Golden: ${golden.file}
Golden SHA256: ${golden.sha256}
New SHA256: ${newHash}
Byte Diff: ${byteDiff.toFixed(4)}%
Threshold: ${threshold}%
Status: FAILED
`);
        } else {
          console.log(`  Within threshold (${threshold}%) ✓`);
        }
      }
    }

  } catch (error) {
    results.errors.push(`Error: ${error.message}`);
    results.passed = false;
  }

  return results;
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('========================================');
  console.log('Golden Print Export Regression Test');
  console.log('========================================');
  console.log(`Exporter: ${EXPORTER_URL}`);
  console.log(`Golden dir: ${GOLDEN_DIR}`);
  console.log(`Output dir: ${OUTPUT_DIR}`);

  // Load metadata
  let metadata;
  try {
    metadata = loadMetadata();
    console.log(`\nLoaded ${metadata.goldens.length} golden baselines`);
  } catch (error) {
    console.error(`\nFATAL: ${error.message}`);
    process.exit(1);
  }

  // Run tests
  const results = [];
  for (const golden of metadata.goldens) {
    const result = await testGolden(golden, metadata);
    results.push(result);
  }

  // Summary
  console.log('\n========================================');
  console.log('Summary');
  console.log('========================================');

  let passed = 0;
  let failed = 0;

  for (const result of results) {
    if (result.passed) {
      console.log(`✓ ${result.id}: PASSED`);
      passed++;
    } else {
      console.log(`✗ ${result.id}: FAILED`);
      for (const error of result.errors) {
        console.log(`    - ${error}`);
      }
      failed++;
    }
  }

  console.log(`\nTotal: ${passed} passed, ${failed} failed`);
  console.log('========================================');

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
