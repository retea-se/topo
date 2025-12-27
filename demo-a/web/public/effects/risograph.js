/**
 * Risograph Effect Implementation for Demo A (MapLibre/Canvas).
 *
 * Simulates the distinctive look of risograph printing:
 * - Color channel separation with registration offset
 * - Multiply blend mode for overlapping colors
 * - Grain/noise texture overlay
 *
 * This implementation is deterministic: same input + seed = same output.
 */

// Default configuration
const RISO_DEFAULT_CONFIG = {
  channels: [
    { color: '#e84855', offset: { x: 2, y: 1 } },  // Red/pink
    { color: '#2d9cdb', offset: { x: -1, y: 2 } }  // Cyan/teal
  ],
  grain: {
    opacity: 0.06,
    seed: null
  },
  blendMode: 'multiply'
};

/**
 * Validate and normalize risograph configuration.
 * @param {Object} config - Raw configuration from theme
 * @returns {Object} Normalized configuration with defaults
 */
function validateRisographConfig(config) {
  const result = {
    enabled: config.enabled || false,
    channels: [],
    grain: {
      opacity: RISO_DEFAULT_CONFIG.grain.opacity,
      seed: null
    },
    blendMode: config.blendMode || RISO_DEFAULT_CONFIG.blendMode
  };

  // Validate channels
  const channels = config.channels || RISO_DEFAULT_CONFIG.channels;
  for (const ch of channels) {
    if (ch && typeof ch === 'object' && ch.color) {
      const offset = ch.offset || { x: 0, y: 0 };
      result.channels.push({
        color: ch.color,
        offset: {
          x: Math.round(offset.x || 0),
          y: Math.round(offset.y || 0)
        }
      });
    }
  }

  // Use defaults if no valid channels
  if (result.channels.length === 0) {
    result.channels = RISO_DEFAULT_CONFIG.channels;
  }

  // Validate grain
  const grain = config.grain || {};
  if (typeof grain === 'object') {
    result.grain.opacity = parseFloat(grain.opacity) || RISO_DEFAULT_CONFIG.grain.opacity;
    result.grain.seed = grain.seed || null;
  }

  return result;
}

/**
 * Apply risograph effect to ImageData.
 *
 * Algorithm:
 * 1. Convert image to grayscale (luminance)
 * 2. For each color channel:
 *    - Tint the luminance with channel color
 *    - Apply integer pixel offset
 * 3. Composite all channels using multiply blend
 * 4. Add deterministic grain texture
 *
 * @param {ImageData} imageData - Canvas ImageData to modify
 * @param {Object} config - Risograph configuration from theme
 * @param {string} [seed] - Deterministic seed (typically preset_id)
 * @returns {ImageData} Modified ImageData
 */
function applyRisograph(imageData, config, seed) {
  // Validate configuration
  config = validateRisographConfig(config);

  if (!config.enabled) {
    return imageData;
  }

  const { width, height, data } = imageData;
  const { hexToRgb, seedFromString, generateNoiseTexture, clamp } = window.EffectUtils;

  // Create luminance array
  const luminance = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    // ITU-R BT.601 luma coefficients
    luminance[i] = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0;
  }

  // Process each color channel
  const channelLayers = [];
  for (const chConfig of config.channels) {
    const layer = createChannelLayer(luminance, chConfig, width, height, hexToRgb);
    channelLayers.push(layer);
  }

  // Composite channels using multiply blend
  const result = compositeMultiply(channelLayers, width, height);

  // Add grain texture
  const grainOpacity = config.grain.opacity;
  if (grainOpacity > 0) {
    const grainSeed = config.grain.seed || seed;
    const numericSeed = grainSeed ? seedFromString(grainSeed) : 42;
    applyGrain(result, grainOpacity, numericSeed, width, height, generateNoiseTexture);
  }

  // Copy result back to imageData, preserving alpha
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = clamp(Math.round(result[i * 3]), 0, 255);
    data[i * 4 + 1] = clamp(Math.round(result[i * 3 + 1]), 0, 255);
    data[i * 4 + 2] = clamp(Math.round(result[i * 3 + 2]), 0, 255);
    // Alpha preserved from original
  }

  return imageData;
}

/**
 * Create a single color channel layer.
 * @param {Float32Array} luminance - Grayscale luminance (0-1)
 * @param {Object} channelConfig - Channel config with color and offset
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {function} hexToRgb - Color conversion function
 * @returns {Float32Array} RGB layer data (width * height * 3)
 */
function createChannelLayer(luminance, channelConfig, width, height, hexToRgb) {
  const color = hexToRgb(channelConfig.color);
  const offsetX = channelConfig.offset.x;
  const offsetY = channelConfig.offset.y;

  // Create layer with white background
  const layer = new Float32Array(width * height * 3);
  layer.fill(255);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Apply offset (read from shifted position)
      const srcX = x - offsetX;
      const srcY = y - offsetY;

      // Skip if source is outside bounds (leave white)
      if (srcX < 0 || srcX >= width || srcY < 0 || srcY >= height) {
        continue;
      }

      const srcIdx = srcY * width + srcX;
      const dstIdx = (y * width + x) * 3;

      // Invert luminance for printing effect (dark = more ink)
      const inkDensity = 1.0 - luminance[srcIdx];

      // Paper white minus ink contribution
      layer[dstIdx] = 255.0 - (inkDensity * (255.0 - color.r));
      layer[dstIdx + 1] = 255.0 - (inkDensity * (255.0 - color.g));
      layer[dstIdx + 2] = 255.0 - (inkDensity * (255.0 - color.b));
    }
  }

  return layer;
}

/**
 * Composite layers using multiply blend mode.
 * @param {Float32Array[]} layers - Array of RGB layers
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Float32Array} Composited RGB data
 */
function compositeMultiply(layers, width, height) {
  if (layers.length === 0) {
    const result = new Float32Array(width * height * 3);
    result.fill(255);
    return result;
  }

  // Start with first layer
  const result = new Float32Array(layers[0]);

  // Multiply blend each subsequent layer
  for (let layerIdx = 1; layerIdx < layers.length; layerIdx++) {
    const layer = layers[layerIdx];
    for (let i = 0; i < result.length; i++) {
      // Multiply blend: (a * b) / 255
      result[i] = (result[i] * layer[i]) / 255.0;
    }
  }

  return result;
}

/**
 * Apply deterministic grain texture.
 * @param {Float32Array} image - RGB data to modify in-place
 * @param {number} opacity - Grain opacity (0-1)
 * @param {number} seed - Random seed
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {function} generateNoiseTexture - Noise generation function
 */
function applyGrain(image, opacity, seed, width, height, generateNoiseTexture) {
  const noise = generateNoiseTexture(width, height, seed);

  for (let i = 0; i < width * height; i++) {
    // Noise adjustment: centered at 0, +/- 50 max
    const adjustment = (noise[i] - 0.5) * 2.0 * opacity * 50.0;

    image[i * 3] += adjustment;
    image[i * 3 + 1] += adjustment;
    image[i * 3 + 2] += adjustment;
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.applyRisograph = applyRisograph;
  window.validateRisographConfig = validateRisographConfig;
}
