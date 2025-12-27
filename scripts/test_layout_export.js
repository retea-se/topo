/**
 * Test script to verify layout exports work correctly
 * Tests a few key layouts to ensure overlay renders in exported files
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const EXPORTS_DIR = path.join(__dirname, '..', 'exports');
if (!fs.existsSync(EXPORTS_DIR)) {
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

const tests = [
  {
    name: 'Blueprint Layout',
    params: {
      bbox_preset: 'stockholm_core',
      theme: 'blueprint-muted',
      layout_template: 'blueprint',
      title: 'TEST BLUEPRINT',
      subtitle: 'Stockholm',
      show_scale: 'true',
      show_attribution: 'true',
      dpi: '150',
      width_mm: '420',
      height_mm: '594'
    }
  },
  {
    name: 'Cyberpunk Layout',
    params: {
      bbox_preset: 'stockholm_core',
      theme: 'cyberpunk',
      layout_template: 'cyberpunk',
      title: 'TEST',
      subtitle: 'Stockholm',
      show_scale: 'true',
      show_attribution: 'true',
      dpi: '150',
      width_mm: '420',
      height_mm: '594'
    }
  },
  {
    name: 'Prestige Layout',
    params: {
      bbox_preset: 'stockholm_core',
      theme: 'gold-foil',
      layout_template: 'prestige',
      title: 'Prestige Test',
      subtitle: 'Stockholm',
      show_scale: 'true',
      show_attribution: 'true',
      dpi: '150',
      width_mm: '420',
      height_mm: '594'
    }
  },
  {
    name: 'Vintage Map Layout',
    params: {
      bbox_preset: 'stockholm_core',
      theme: 'vintage',
      layout_template: 'vintage-map',
      title: 'Stockholm',
      subtitle: 'Sweden',
      show_scale: 'true',
      show_attribution: 'true',
      dpi: '150',
      width_mm: '420',
      height_mm: '594'
    }
  },
  {
    name: 'Scientific Layout',
    params: {
      bbox_preset: 'stockholm_core',
      theme: 'paper',
      layout_template: 'scientific',
      title: 'Stockholm',
      subtitle: 'Sweden',
      show_scale: 'true',
      show_attribution: 'true',
      dpi: '150',
      width_mm: '420',
      height_mm: '594'
    }
  }
];

function makeRequest(test) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams(test.params);
    const options = {
      hostname: 'localhost',
      port: 8082,
      path: `/render?${params.toString()}`,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('Testing layout exports...\n');

  const results = [];

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}...`);
      const startTime = Date.now();
      const imageBuffer = await makeRequest(test);
      const duration = Date.now() - startTime;

      const filename = `test_${test.params.layout_template}_${Date.now()}.png`;
      const filepath = path.join(EXPORTS_DIR, filename);
      fs.writeFileSync(filepath, imageBuffer);

      const fileSizeKB = (imageBuffer.length / 1024).toFixed(2);
      const fileSizeMB = (imageBuffer.length / (1024 * 1024)).toFixed(2);

      console.log(`  ✓ Success - ${fileSizeMB} MB (${duration}ms)`);
      console.log(`  Saved: ${filename}\n`);

      results.push({
        name: test.name,
        layout: test.params.layout_template,
        success: true,
        fileSize: imageBuffer.length,
        filename,
        duration
      });
    } catch (error) {
      console.error(`  ✗ Failed: ${error.message}\n`);
      results.push({
        name: test.name,
        layout: test.params.layout_template,
        success: false,
        error: error.message
      });
    }
  }

  // Summary
  console.log('='.repeat(50));
  console.log('Test Summary:');
  console.log('='.repeat(50));
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  console.log(`Total: ${results.length}`);
  console.log(`✓ Passed: ${successCount}`);
  console.log(`✗ Failed: ${failCount}\n`);

  if (successCount > 0) {
    console.log('Successful exports:');
    results.filter(r => r.success).forEach(r => {
      console.log(`  - ${r.name} (${r.layout}): ${(r.fileSize / (1024 * 1024)).toFixed(2)} MB`);
    });
  }

  if (failCount > 0) {
    console.log('\nFailed exports:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name} (${r.layout}): ${r.error}`);
    });
  }

  return results;
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };

