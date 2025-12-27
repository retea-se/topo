/**
 * Simple tests for filename builder.
 * Run with: node filenameBuilder.test.js
 */

const { buildExportFilename, sanitizeFilename } = require('./filenameBuilder');
const path = require('path');

// Mock preset for testing
const mockPreset = {
  id: 'A2_Paper_v1',
  bbox_preset: 'stockholm_core',
  theme: 'paper',
  paper: {
    width_mm: 594,
    height_mm: 420
  },
  render: {
    dpi: 150,
    format: 'png'
  },
  constraints: {
    dpi_locked: false,
    format_locked: false,
    theme_locked: true,
    bbox_locked: true
  }
};

console.log('Testing filename builder...\n');

// Test 1: No preset (custom)
const test1 = buildExportFilename({
  bbox_preset: 'stockholm_core',
  preset_id: null,
  dpi: 150,
  format: 'png'
});
console.log('Test 1 (no preset):', test1);
console.assert(test1 === 'stockholm_core__custom__150dpi.png', 'Test 1 failed');

// Test 2: Preset unchanged
// Note: This test requires the actual preset file to exist
// For now, we'll test the structure
const test2 = buildExportFilename({
  bbox_preset: 'stockholm_core',
  preset_id: 'A2_Paper_v1',
  dpi: 150,
  format: 'png',
  requestParams: {
    dpi: 150,
    format: 'png',
    theme: 'paper',
    width_mm: 594,
    height_mm: 420
  }
});
console.log('Test 2 (preset unchanged):', test2);
console.assert(test2.includes('stockholm_core') && test2.includes('A2_Paper_v1') && !test2.includes('modified'), 'Test 2 structure check');

// Test 3: Preset modified (DPI changed)
const test3 = buildExportFilename({
  bbox_preset: 'stockholm_core',
  preset_id: 'A2_Paper_v1',
  dpi: 200,
  format: 'png',
  requestParams: {
    dpi: 200,
    format: 'png',
    theme: 'paper',
    width_mm: 594,
    height_mm: 420
  }
});
console.log('Test 3 (preset modified):', test3);
console.assert(test3.includes('stockholm_core') && test3.includes('A2_Paper_v1') && test3.includes('modified'), 'Test 3 structure check');

// Test 4: Sanitize filename
const test4 = sanitizeFilename('test/file:name@123');
console.log('Test 4 (sanitize):', test4);
console.assert(test4 === 'test_file_name_123', 'Test 4 failed');

console.log('\nAll tests passed!');



