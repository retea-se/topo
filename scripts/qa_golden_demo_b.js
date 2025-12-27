#!/usr/bin/env node
/**
 * Demo B Golden Baseline Regression Test
 *
 * Verifies that Demo B (Mapnik) exports are byte-identical to stored golden baselines.
 * This is the authoritative reproducibility test per the v1.1 operational hardening contract.
 *
 * Usage:
 *   node scripts/qa_golden_demo_b.js              # Run regression test
 *   node scripts/qa_golden_demo_b.js --regenerate # Regenerate baselines (use with caution)
 *
 * Prerequisites:
 *   - Docker stack running (demo-b api, renderer, db)
 *   - Ports: 5000 (api), 5001 (renderer)
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');

// Configuration
const API_URL = process.env.DEMO_B_API_URL || 'http://localhost:5000';
const GOLDEN_DIR = path.join(__dirname, '..', 'golden', 'demo_b');
const OUTPUT_DIR = path.join(__dirname, '..', 'exports', 'golden_test_demo_b');

// Parse arguments
const args = process.argv.slice(2);
const REGENERATE = args.includes('--regenerate');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Load metadata
const metadataPath = path.join(GOLDEN_DIR, 'metadata.json');
if (!fs.existsSync(metadataPath)) {
  console.error(`Error: Metadata file not found: ${metadataPath}`);
  process.exit(1);
}
const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

// Calculate SHA256 of buffer
function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Fetch export from Demo B API
function fetchExport(params) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      bbox_preset: params.bbox_preset,
      theme: params.theme,
      dpi: params.dpi || 150,
      width_mm: params.width_mm,
      height_mm: params.height_mm,
      format: params.format || 'png',
      title: params.title || '',
      subtitle: params.subtitle || '',
      layers: params.layers || {
        hillshade: true,
        water: true,
        parks: true,
        roads: true,
        buildings: true,
        contours: true
      }
    });

    const url = new URL(`${API_URL}/render`);
    const options = {
      hostname: url.hostname,
      port: url.port || 5000,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 300000  // 5 minutes for large renders
    };

    const req = http.request(options, (res) => {
      if (res.statusCode !== 200) {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        });
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

    req.write(postData);
    req.end();
  });
}

// Main test runner
async function runTests() {
  console.log('========================================');
  console.log('Demo B Golden Baseline Regression Test');
  console.log('========================================');
  console.log(`API: ${API_URL}`);
  console.log(`Golden dir: ${GOLDEN_DIR}`);
  console.log(`Output dir: ${OUTPUT_DIR}`);
  console.log(`Mode: ${REGENERATE ? 'REGENERATE' : 'VERIFY'}`);
  console.log();

  if (REGENERATE) {
    console.log('WARNING: Regenerating baselines. This should only be done with approval.');
    console.log();
  }

  console.log(`Loaded ${metadata.goldens.length} golden baselines`);
  console.log();

  const results = [];

  for (const golden of metadata.goldens) {
    console.log(`  Testing: ${golden.id}`);
    console.log(`  Purpose: ${golden.purpose}`);

    try {
      // Fetch export
      const exportBuffer = await fetchExport({
        bbox_preset: golden.params.bbox_preset,
        theme: golden.params.theme,
        dpi: golden.dimensions.dpi,
        width_mm: golden.dimensions.width_mm,
        height_mm: golden.dimensions.height_mm,
        format: golden.params.format,
        title: golden.params.title,
        subtitle: golden.params.subtitle,
        layers: golden.params.layers
      });

      // Save test export
      const testPath = path.join(OUTPUT_DIR, `${golden.id}_test.png`);
      fs.writeFileSync(testPath, exportBuffer);
      console.log(`  Saved test export: ${testPath}`);

      // Calculate hash
      const hash = sha256(exportBuffer);
      console.log(`  SHA256: ${hash}`);

      // Check dimensions (PNG header)
      const width = exportBuffer.readUInt32BE(16);
      const height = exportBuffer.readUInt32BE(20);
      const expectedWidth = golden.dimensions.width_px;
      const expectedHeight = golden.dimensions.height_px;

      if (width !== expectedWidth || height !== expectedHeight) {
        console.log(`  Dimensions: ${width}x${height} (expected ${expectedWidth}x${expectedHeight}) FAIL`);
        results.push({ id: golden.id, status: 'FAIL', reason: 'Dimension mismatch' });
        continue;
      }
      console.log(`  Dimensions: ${width}x${height} OK`);

      if (REGENERATE) {
        // Save as new golden
        const goldenPath = path.join(GOLDEN_DIR, golden.file);
        fs.writeFileSync(goldenPath, exportBuffer);
        console.log(`  Regenerated: ${goldenPath}`);
        console.log(`  New SHA256: ${hash}`);
        console.log(`  UPDATE metadata.json with this hash!`);
        results.push({ id: golden.id, status: 'REGENERATED', hash });
      } else {
        // Compare hash
        if (golden.sha256 === 'PENDING') {
          console.log(`  Hash: PENDING (baseline not yet established)`);
          results.push({ id: golden.id, status: 'PENDING', hash });
        } else if (hash === golden.sha256) {
          console.log(`  Hash match: identical to golden`);
          results.push({ id: golden.id, status: 'PASS' });
        } else {
          console.log(`  Hash MISMATCH!`);
          console.log(`  Expected: ${golden.sha256}`);
          console.log(`  Got:      ${hash}`);
          results.push({ id: golden.id, status: 'FAIL', reason: 'Hash mismatch' });
        }
      }

    } catch (error) {
      console.log(`  Error: ${error.message}`);
      results.push({ id: golden.id, status: 'ERROR', reason: error.message });
    }

    console.log();
  }

  // Summary
  console.log('========================================');
  console.log('Summary');
  console.log('========================================');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL' || r.status === 'ERROR').length;
  const pending = results.filter(r => r.status === 'PENDING').length;
  const regenerated = results.filter(r => r.status === 'REGENERATED').length;

  for (const r of results) {
    const icon = r.status === 'PASS' ? '✓' : r.status === 'PENDING' ? '○' : r.status === 'REGENERATED' ? '↻' : '✗';
    console.log(`${icon} ${r.id}: ${r.status}${r.reason ? ` (${r.reason})` : ''}`);
  }

  console.log();
  if (REGENERATE) {
    console.log(`Total: ${regenerated} regenerated`);
  } else {
    console.log(`Total: ${passed} passed, ${failed} failed, ${pending} pending`);
  }
  console.log('========================================');

  // Exit code
  if (failed > 0) {
    process.exit(1);
  }
}

// Run
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
