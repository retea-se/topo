/**
 * Filename builder utility for export standardization.
 *
 * Generates deterministic filenames based on preset usage and modification status.
 */

const path = require('path');
const fs = require('fs');

/**
 * Load export preset by ID.
 * @param {string} presetId - Preset ID (e.g., 'A2_Paper_v1')
 * @returns {object|null} Preset object or null if not found
 */
function loadPreset(presetId) {
  if (!presetId) return null;

  // Try multiple possible paths
  const possiblePaths = [
    path.join(__dirname, '../../../config/export_presets', `${presetId}.json`), // From demo-a/exporter/src to repo root
    path.join('/app/config/export_presets', `${presetId}.json`), // Docker container path
    path.join(process.cwd(), 'config/export_presets', `${presetId}.json`), // From repo root
    path.join(process.cwd(), '../../config/export_presets', `${presetId}.json`) // From demo-a/exporter
  ];

  for (const presetPath of possiblePaths) {
    if (fs.existsSync(presetPath)) {
      try {
        const content = fs.readFileSync(presetPath, 'utf8');
        return JSON.parse(content);
      } catch (e) {
        console.warn(`[FilenameBuilder] Failed to parse preset ${presetId} from ${presetPath}:`, e.message);
      }
    }
  }

  return null;
}

/**
 * Check if a field value differs from preset default.
 * @param {object} preset - Preset object
 * @param {string} fieldPath - Dot-separated path (e.g., 'render.dpi')
 * @param {any} requestValue - Value from request
 * @returns {boolean} True if value differs
 */
function fieldDiffers(preset, fieldPath, requestValue) {
  if (!preset) return false;

  const parts = fieldPath.split('.');
  let presetValue = preset;
  for (const part of parts) {
    if (presetValue && typeof presetValue === 'object') {
      presetValue = presetValue[part];
    } else {
      return true; // Field doesn't exist in preset, consider it different
    }
  }

  // Compare values (handle numbers and strings)
  if (typeof requestValue === 'number' && typeof presetValue === 'number') {
    return Math.abs(requestValue - presetValue) > 0.001; // Allow small floating point differences
  }

  return requestValue !== presetValue;
}

/**
 * Check if preset was modified (any non-locked field differs from preset).
 * @param {object} preset - Preset object
 * @param {object} requestParams - Request parameters
 * @returns {boolean} True if preset was modified
 */
function isPresetModified(preset, requestParams) {
  if (!preset || !preset.constraints) return false;

  const constraints = preset.constraints;

  // Check DPI if not locked
  if (!constraints.dpi_locked && requestParams.dpi !== undefined) {
    if (fieldDiffers(preset, 'render.dpi', parseInt(requestParams.dpi))) {
      return true;
    }
  }

  // Check format if not locked
  if (!constraints.format_locked && requestParams.format !== undefined) {
    if (fieldDiffers(preset, 'render.format', requestParams.format)) {
      return true;
    }
  }

  // Check theme if not locked
  if (!constraints.theme_locked && requestParams.theme !== undefined) {
    if (fieldDiffers(preset, 'theme', requestParams.theme)) {
      return true;
    }
  }

  // Check paper size if not locked (width_mm, height_mm)
  if (requestParams.width_mm !== undefined || requestParams.height_mm !== undefined) {
    const presetWidth = preset.paper?.width_mm;
    const presetHeight = preset.paper?.height_mm;
    const requestWidth = parseFloat(requestParams.width_mm);
    const requestHeight = parseFloat(requestParams.height_mm);

    if (presetWidth !== undefined && Math.abs(requestWidth - presetWidth) > 0.1) {
      return true;
    }
    if (presetHeight !== undefined && Math.abs(requestHeight - presetHeight) > 0.1) {
      return true;
    }
  }

  // Check layers if not locked
  if (!constraints.layers_locked && requestParams.layers !== undefined) {
    // Parse layers if it's a string
    let requestLayers = requestParams.layers;
    if (typeof requestLayers === 'string') {
      try {
        requestLayers = JSON.parse(requestLayers);
      } catch (e) {
        // Ignore parse errors
      }
    }

    if (requestLayers && typeof requestLayers === 'object' && preset.layers) {
      for (const [key, value] of Object.entries(requestLayers)) {
        if (preset.layers[key] !== value) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Sanitize string for use in filename (ASCII-safe, filesystem-safe).
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeFilename(str) {
  if (!str) return '';

  // Replace non-ASCII and problematic characters
  return str
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
}

/**
 * Build export filename according to standardization rules.
 *
 * @param {object} options - Filename options
 * @param {string} options.bbox_preset - Bbox preset name (e.g., 'stockholm_core')
 * @param {string} [options.preset_id] - Export preset ID (e.g., 'A2_Paper_v1')
 * @param {number|string} options.dpi - DPI value
 * @param {string} options.format - File format ('png', 'pdf', etc.)
 * @param {object} [options.requestParams] - Additional request parameters for modification check
 * @returns {string} Generated filename
 */
function buildExportFilename({ bbox_preset, preset_id, dpi, format, requestParams = {} }) {
  // Sanitize bbox_preset
  const safeBbox = sanitizeFilename(bbox_preset || 'custom');

  // Sanitize format (remove leading dot if present)
  const safeFormat = sanitizeFilename(format || 'png').replace(/^\./, '');

  // Format DPI
  const dpiStr = `${parseInt(dpi) || 150}dpi`;

  // If no preset_id, use custom format
  if (!preset_id) {
    return `${safeBbox}__custom__${dpiStr}.${safeFormat}`;
  }

  // Load preset to check if modified
  const preset = loadPreset(preset_id);

  if (!preset) {
    // Preset not found, but preset_id was provided - treat as custom
    console.warn(`[FilenameBuilder] Preset ${preset_id} not found, using custom format`);
    return `${safeBbox}__custom__${dpiStr}.${safeFormat}`;
  }

  // Check if preset was modified
  const modified = isPresetModified(preset, requestParams);

  // Sanitize preset ID
  const safePresetId = sanitizeFilename(preset_id);

  if (modified) {
    return `${safeBbox}__${safePresetId}_modified__${dpiStr}.${safeFormat}`;
  } else {
    return `${safeBbox}__${safePresetId}__${dpiStr}.${safeFormat}`;
  }
}

module.exports = {
  buildExportFilename,
  loadPreset,
  isPresetModified,
  sanitizeFilename
};

