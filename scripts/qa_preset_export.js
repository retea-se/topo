#!/usr/bin/env node
/**
 * QA Script for Export Presets (Phase 9)
 * Tests preset API endpoints and validation logic
 */

const http = require('http');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

const EXPECTED_PRESETS = [
  'A2_Paper_v1',
  'A3_Blueprint_v1',
  'A1_Terrain_v1',
  'A4_Quick_v1'
];

// HTTP GET with promise
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', (err) => reject(err));
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// HTTP POST with promise
function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', (err) => reject(err));
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.write(JSON.stringify(body));
    req.end();
  });
}

// Test functions
async function testListPresets() {
  console.log('\n1. Testing GET /api/export-presets');
  console.log('   ---------------------------------');

  const result = await httpGet(`${BASE_URL}/api/export-presets`);

  if (result.status !== 200) {
    console.log('   FAIL: Expected status 200, got', result.status);
    return false;
  }

  if (!result.data.presets || !Array.isArray(result.data.presets)) {
    console.log('   FAIL: Response missing presets array');
    return false;
  }

  const presetIds = result.data.presets.map(p => p.id);
  console.log(`   Found ${result.data.presets.length} presets: ${presetIds.join(', ')}`);

  // Check all expected presets exist
  for (const expected of EXPECTED_PRESETS) {
    if (!presetIds.includes(expected)) {
      console.log(`   FAIL: Missing expected preset ${expected}`);
      return false;
    }
  }

  console.log('   PASS: All expected presets found');
  return true;
}

async function testGetPreset(presetId) {
  console.log(`\n2. Testing GET /api/export-presets/${presetId}`);
  console.log('   ---------------------------------');

  const result = await httpGet(`${BASE_URL}/api/export-presets/${presetId}`);

  if (result.status !== 200) {
    console.log('   FAIL: Expected status 200, got', result.status);
    return false;
  }

  const preset = result.data.preset;
  if (!preset) {
    console.log('   FAIL: Response missing preset object');
    return false;
  }

  // Check required fields
  const requiredFields = ['id', 'version', 'display_name', 'bbox_preset', 'theme', 'paper', 'render', 'layers', 'constraints'];
  for (const field of requiredFields) {
    if (preset[field] === undefined) {
      console.log(`   FAIL: Missing required field: ${field}`);
      return false;
    }
  }

  console.log(`   Preset: ${preset.display_name}`);
  console.log(`   Theme: ${preset.theme}, Format: ${preset.paper.format}, DPI: ${preset.render.dpi}`);
  console.log('   PASS: Preset structure valid');
  return true;
}

async function testGetPresetNotFound() {
  console.log('\n3. Testing GET /api/export-presets/NonExistent_v1 (404)');
  console.log('   ---------------------------------');

  const result = await httpGet(`${BASE_URL}/api/export-presets/NonExistent_v1`);

  if (result.status !== 404) {
    console.log('   FAIL: Expected status 404, got', result.status);
    return false;
  }

  console.log('   PASS: Returns 404 for non-existent preset');
  return true;
}

async function testValidatePresetValid() {
  console.log('\n4. Testing POST /api/validate-preset (valid request)');
  console.log('   ---------------------------------');

  const result = await httpPost(`${BASE_URL}/api/validate-preset`, {
    preset_id: 'A2_Paper_v1'
  });

  if (result.status !== 200) {
    console.log('   FAIL: Expected status 200, got', result.status);
    return false;
  }

  if (!result.data.valid) {
    console.log('   FAIL: Expected valid=true, got', result.data.valid);
    console.log('   Errors:', result.data.errors);
    return false;
  }

  if (!result.data.effective_config) {
    console.log('   FAIL: Missing effective_config in response');
    return false;
  }

  const computed = result.data.effective_config._computed;
  console.log(`   Dimensions: ${computed.width_px}x${computed.height_px}px (${computed.megapixels} MP)`);
  console.log('   PASS: Valid preset validated successfully');
  return true;
}

async function testValidatePresetWithValidOverrides() {
  console.log('\n5. Testing POST /api/validate-preset (valid overrides)');
  console.log('   ---------------------------------');

  const result = await httpPost(`${BASE_URL}/api/validate-preset`, {
    preset_id: 'A2_Paper_v1',
    overrides: {
      dpi: 200  // Within allowed range 72-300
    }
  });

  if (result.status !== 200) {
    console.log('   FAIL: Expected status 200, got', result.status);
    return false;
  }

  if (!result.data.valid) {
    console.log('   FAIL: Expected valid=true');
    console.log('   Errors:', result.data.errors);
    return false;
  }

  if (result.data.effective_config.render.dpi !== 200) {
    console.log('   FAIL: DPI override not applied');
    return false;
  }

  console.log(`   Overridden DPI: ${result.data.effective_config.render.dpi}`);
  console.log('   PASS: Valid overrides accepted');
  return true;
}

async function testValidatePresetDPIOutOfRange() {
  console.log('\n6. Testing POST /api/validate-preset (DPI out of range)');
  console.log('   ---------------------------------');

  const result = await httpPost(`${BASE_URL}/api/validate-preset`, {
    preset_id: 'A2_Paper_v1',
    overrides: {
      dpi: 500  // Max is 300 for A2_Paper_v1
    }
  });

  if (result.data.valid !== false) {
    console.log('   FAIL: Expected valid=false for out-of-range DPI');
    return false;
  }

  const dpiError = result.data.errors.find(e => e.field === 'dpi');
  if (!dpiError) {
    console.log('   FAIL: Expected DPI error');
    return false;
  }

  console.log(`   Error: ${dpiError.message}`);
  console.log('   PASS: DPI out of range rejected correctly');
  return true;
}

async function testValidatePresetLockedField() {
  console.log('\n7. Testing POST /api/validate-preset (locked DPI on Blueprint)');
  console.log('   ---------------------------------');

  // A3_Blueprint_v1 has dpi_locked: true
  const result = await httpPost(`${BASE_URL}/api/validate-preset`, {
    preset_id: 'A3_Blueprint_v1',
    overrides: {
      dpi: 200
    }
  });

  if (result.data.valid !== false) {
    console.log('   FAIL: Expected valid=false for locked DPI override');
    return false;
  }

  const dpiError = result.data.errors.find(e => e.field === 'dpi');
  if (!dpiError) {
    console.log('   FAIL: Expected DPI locked error');
    return false;
  }

  console.log(`   Error: ${dpiError.message}`);
  console.log('   PASS: Locked field override rejected correctly');
  return true;
}

async function testValidatePresetInvalidFormat() {
  console.log('\n8. Testing POST /api/validate-preset (invalid format)');
  console.log('   ---------------------------------');

  // A3_Blueprint_v1 only allows PDF
  const result = await httpPost(`${BASE_URL}/api/validate-preset`, {
    preset_id: 'A3_Blueprint_v1',
    overrides: {
      format: 'svg'
    }
  });

  if (result.data.valid !== false) {
    console.log('   FAIL: Expected valid=false for locked format override');
    return false;
  }

  console.log(`   Error: ${result.data.errors[0].message}`);
  console.log('   PASS: Invalid format rejected correctly');
  return true;
}

async function testValidatePresetMissing() {
  console.log('\n9. Testing POST /api/validate-preset (missing preset_id)');
  console.log('   ---------------------------------');

  const result = await httpPost(`${BASE_URL}/api/validate-preset`, {});

  if (result.status !== 400) {
    console.log('   FAIL: Expected status 400, got', result.status);
    return false;
  }

  console.log('   PASS: Missing preset_id returns 400');
  return true;
}

// Main test runner
async function runTests() {
  console.log('========================================');
  console.log('Export Presets QA Test (Phase 9)');
  console.log('========================================');
  console.log(`Testing: ${BASE_URL}`);

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  const tests = [
    testListPresets,
    () => testGetPreset('A2_Paper_v1'),
    testGetPresetNotFound,
    testValidatePresetValid,
    testValidatePresetWithValidOverrides,
    testValidatePresetDPIOutOfRange,
    testValidatePresetLockedField,
    testValidatePresetInvalidFormat,
    testValidatePresetMissing
  ];

  for (const test of tests) {
    try {
      const passed = await test();
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (err) {
      console.log(`   ERROR: ${err.message}`);
      results.failed++;
    }
  }

  console.log('\n========================================');
  console.log(`Results: ${results.passed} passed, ${results.failed} failed`);
  console.log('========================================');

  process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
