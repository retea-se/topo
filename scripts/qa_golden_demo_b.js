#!/usr/bin/env node
/**
 * Demo B Golden Baseline Regression Test
 *
 * v1.1 Operational Hardening - Reproducibility Verification
 *
 * Verifies that Demo B (Mapnik) exports are byte-identical to stored golden baselines.
 * This is the AUTHORITATIVE reproducibility test per the v1.1 operational hardening contract.
 *
 * Usage:
 *   node scripts/qa_golden_demo_b.js                    # Run full regression (Tier 1 + Tier 2)
 *   node scripts/qa_golden_demo_b.js --tier1            # Run only Tier 1 (fast, for every PR)
 *   node scripts/qa_golden_demo_b.js --regenerate       # Regenerate baselines (use with caution!)
 *   node scripts/qa_golden_demo_b.js --regenerate-only A4_Quick_v1  # Regenerate specific preset
 *
 * Exit codes:
 *   0 - All tests passed
 *   1 - One or more tests failed
 *   2 - Configuration error
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
const REPORT_PATH = path.join(OUTPUT_DIR, 'TEST_REPORT.md');

// Parse arguments
const args = process.argv.slice(2);
const REGENERATE = args.includes('--regenerate');
const TIER1_ONLY = args.includes('--tier1');
const REGENERATE_ONLY = args.find(a => args[args.indexOf('--regenerate-only') + 1] === a && !a.startsWith('--'));

// Ensure directories exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Load metadata
const metadataPath = path.join(GOLDEN_DIR, 'metadata.json');
if (!fs.existsSync(metadataPath)) {
  console.error(`ERROR: Metadata file not found: ${metadataPath}`);
  console.error('Run with --regenerate to create initial baselines.');
  process.exit(2);
}
const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

// Calculate SHA256 of buffer
function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Extract PNG dimensions from header
function getPngDimensions(buffer) {
  if (buffer.length < 24) return null;
  const signature = buffer.slice(0, 8);
  if (signature.toString('hex') !== '89504e470d0a1a0a') return null;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
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

    console.log(`    Requesting: POST ${API_URL}/render`);
    console.log(`    Params: ${params.bbox_preset}, ${params.theme}, ${params.width_mm}x${params.height_mm}mm @ ${params.dpi}dpi`);

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
      reject(new Error('Request timeout (5 min exceeded)'));
    });

    req.write(postData);
    req.end();
  });
}

// Test a single golden baseline
async function testGolden(golden) {
  const result = {
    id: golden.id,
    tier: golden.tier,
    status: 'UNKNOWN',
    hash: null,
    expectedHash: golden.sha256,
    dimensions: null,
    expectedDimensions: `${golden.dimensions.width_px}x${golden.dimensions.height_px}`,
    error: null,
    duration: 0
  };

  const startTime = Date.now();

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

    result.duration = Date.now() - startTime;

    // Save test export
    const testPath = path.join(OUTPUT_DIR, `${golden.id}_test.png`);
    fs.writeFileSync(testPath, exportBuffer);
    console.log(`    Saved: ${testPath} (${(exportBuffer.length / 1024).toFixed(1)} KB)`);

    // Calculate hash
    result.hash = sha256(exportBuffer);
    console.log(`    SHA256: ${result.hash}`);

    // Check dimensions
    const dims = getPngDimensions(exportBuffer);
    if (!dims) {
      result.status = 'FAIL';
      result.error = 'Invalid PNG format';
      return result;
    }

    result.dimensions = `${dims.width}x${dims.height}`;
    if (dims.width !== golden.dimensions.width_px || dims.height !== golden.dimensions.height_px) {
      result.status = 'FAIL';
      result.error = `Dimension mismatch: got ${result.dimensions}, expected ${result.expectedDimensions}`;
      return result;
    }
    console.log(`    Dimensions: ${result.dimensions} OK`);

    // Check if regenerating
    if (REGENERATE || REGENERATE_ONLY === golden.id) {
      const goldenPath = path.join(GOLDEN_DIR, golden.file);
      fs.writeFileSync(goldenPath, exportBuffer);
      console.log(`    REGENERATED: ${goldenPath}`);
      console.log(`    New SHA256: ${result.hash}`);
      result.status = 'REGENERATED';
      return result;
    }

    // Compare hash
    if (golden.sha256 === 'PENDING') {
      console.log(`    Hash: PENDING (baseline not yet established)`);
      console.log(`    To establish baseline, run: node scripts/qa_golden_demo_b.js --regenerate-only ${golden.id}`);
      result.status = 'PENDING';
    } else if (result.hash === golden.sha256) {
      console.log(`    Hash match: IDENTICAL to golden baseline`);
      result.status = 'PASS';
    } else {
      console.log(`    Hash MISMATCH!`);
      console.log(`    Expected: ${golden.sha256}`);
      console.log(`    Got:      ${result.hash}`);
      result.status = 'FAIL';
      result.error = 'SHA256 hash mismatch - reproducibility broken';

      // Save diff info
      const diffPath = path.join(OUTPUT_DIR, `${golden.id}_diff.json`);
      fs.writeFileSync(diffPath, JSON.stringify({
        golden_id: golden.id,
        expected_sha256: golden.sha256,
        actual_sha256: result.hash,
        expected_dimensions: result.expectedDimensions,
        actual_dimensions: result.dimensions,
        timestamp: new Date().toISOString()
      }, null, 2));
    }

  } catch (error) {
    result.duration = Date.now() - startTime;
    result.status = 'ERROR';
    result.error = error.message;
    console.log(`    ERROR: ${error.message}`);
  }

  return result;
}

// Generate Markdown report
function generateReport(results, startTime) {
  const endTime = new Date();
  const duration = (endTime - startTime) / 1000;

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL' || r.status === 'ERROR').length;
  const pending = results.filter(r => r.status === 'PENDING').length;
  const regenerated = results.filter(r => r.status === 'REGENERATED').length;

  let report = `# Demo B Golden Regression Test Report

**Generated**: ${endTime.toISOString()}
**Duration**: ${duration.toFixed(1)}s
**API**: ${API_URL}
**Mode**: ${REGENERATE ? 'REGENERATE' : TIER1_ONLY ? 'TIER 1 ONLY' : 'FULL (Tier 1 + Tier 2)'}

## Summary

| Status | Count |
|--------|-------|
| PASS | ${passed} |
| FAIL | ${failed} |
| PENDING | ${pending} |
| REGENERATED | ${regenerated} |

**Overall**: ${failed > 0 ? 'FAILED' : pending > 0 ? 'INCOMPLETE' : 'PASSED'}

## Results

| Preset | Tier | Status | Dimensions | SHA256 (first 16 chars) | Duration |
|--------|------|--------|------------|-------------------------|----------|
`;

  for (const r of results) {
    const statusIcon = r.status === 'PASS' ? '`PASS`' :
                       r.status === 'PENDING' ? '`PENDING`' :
                       r.status === 'REGENERATED' ? '`REGEN`' : '`FAIL`';
    const hash = r.hash ? r.hash.substring(0, 16) + '...' : 'N/A';
    report += `| ${r.id} | ${r.tier} | ${statusIcon} | ${r.dimensions || 'N/A'} | \`${hash}\` | ${(r.duration / 1000).toFixed(1)}s |\n`;
  }

  // Add failure details
  const failures = results.filter(r => r.status === 'FAIL' || r.status === 'ERROR');
  if (failures.length > 0) {
    report += `\n## Failures\n\n`;
    for (const f of failures) {
      report += `### ${f.id}\n\n`;
      report += `- **Error**: ${f.error}\n`;
      report += `- **Expected Hash**: \`${f.expectedHash}\`\n`;
      report += `- **Actual Hash**: \`${f.hash || 'N/A'}\`\n\n`;
    }
  }

  // Add reproducibility contract reference
  report += `\n## Reproducibility Contract

Per v1.1 Operational Hardening:
- Demo B PNG exports must be **byte-identical** (SHA256 match)
- Conditions: Same Docker image, fonts, data files, single-threaded rendering
- Any mismatch indicates **broken determinism** - do not release

See: docs/V1_1_OPERATIONAL_HARDENING.md
`;

  return report;
}

// Main test runner
async function runTests() {
  const startTime = new Date();

  console.log('========================================');
  console.log('Demo B Golden Baseline Regression Test');
  console.log('v1.1 Operational Hardening');
  console.log('========================================');
  console.log(`API: ${API_URL}`);
  console.log(`Golden dir: ${GOLDEN_DIR}`);
  console.log(`Output dir: ${OUTPUT_DIR}`);
  console.log(`Mode: ${REGENERATE ? 'REGENERATE ALL' : TIER1_ONLY ? 'TIER 1 ONLY' : 'FULL (Tier 1 + Tier 2)'}`);
  console.log();

  if (REGENERATE) {
    console.log('WARNING: Regenerating ALL baselines.');
    console.log('This should only be done with documented approval.');
    console.log('See: docs/V1_1_OPERATIONAL_HARDENING.md section on re-baselining.');
    console.log();
  }

  // Filter goldens by tier if needed
  let goldens = metadata.goldens;
  if (TIER1_ONLY) {
    const tier1Ids = metadata.tiers.tier1.presets;
    goldens = goldens.filter(g => tier1Ids.includes(g.id));
    console.log(`Running Tier 1 only: ${tier1Ids.join(', ')}`);
  }

  if (REGENERATE_ONLY) {
    goldens = goldens.filter(g => g.id === REGENERATE_ONLY);
    if (goldens.length === 0) {
      console.error(`ERROR: Unknown preset '${REGENERATE_ONLY}'`);
      process.exit(2);
    }
    console.log(`Regenerating only: ${REGENERATE_ONLY}`);
  }

  console.log(`Testing ${goldens.length} golden baselines\n`);

  const results = [];

  for (const golden of goldens) {
    console.log(`\n[${golden.tier.toUpperCase()}] Testing: ${golden.id}`);
    console.log(`  Purpose: ${golden.purpose}`);
    const result = await testGolden(golden);
    results.push(result);
  }

  // Generate and save report
  const report = generateReport(results, startTime);
  fs.writeFileSync(REPORT_PATH, report);
  console.log(`\nReport saved: ${REPORT_PATH}`);

  // Summary
  console.log('\n========================================');
  console.log('Summary');
  console.log('========================================');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL' || r.status === 'ERROR').length;
  const pending = results.filter(r => r.status === 'PENDING').length;
  const regenerated = results.filter(r => r.status === 'REGENERATED').length;

  for (const r of results) {
    const icon = r.status === 'PASS' ? '\u2713' :
                 r.status === 'PENDING' ? '\u25CB' :
                 r.status === 'REGENERATED' ? '\u21BB' : '\u2717';
    console.log(`${icon} [${r.tier}] ${r.id}: ${r.status}${r.error ? ` (${r.error})` : ''}`);
  }

  console.log();
  if (REGENERATE) {
    console.log(`Total: ${regenerated} regenerated`);
    console.log('\nIMPORTANT: Update metadata.json with new SHA256 hashes!');
  } else {
    console.log(`Total: ${passed} passed, ${failed} failed, ${pending} pending`);
  }
  console.log('========================================');

  // Output for CI
  if (process.env.GITHUB_ACTIONS) {
    if (failed > 0) {
      console.log('\n::error::Demo B reproducibility check FAILED');
      for (const r of results.filter(r => r.status === 'FAIL' || r.status === 'ERROR')) {
        console.log(`::error file=golden/demo_b/${r.id}::${r.error}`);
      }
    } else if (pending > 0) {
      console.log('\n::warning::Demo B has PENDING baselines - run with --regenerate to establish');
    }
  }

  // Exit code
  if (failed > 0) {
    process.exit(1);
  }
}

// Run
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(2);
});
