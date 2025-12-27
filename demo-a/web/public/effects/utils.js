/**
 * Utility functions for effects processing.
 * All random operations use deterministic seeding for reproducibility.
 */

/**
 * Generate a deterministic integer seed from a string.
 * Uses a simple hash function for consistency with Python implementation.
 * @param {string} str - Input string (e.g., preset_id)
 * @returns {number} Integer seed
 */
function seedFromString(str) {
  if (!str) return 42; // Default seed

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Seeded random number generator (Mulberry32).
 * Deterministic: same seed always produces same sequence.
 * @param {number} seed - Integer seed
 * @returns {function} Function that returns random numbers 0-1
 */
function createSeededRandom(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Generate deterministic noise texture.
 * @param {number} width - Texture width
 * @param {number} height - Texture height
 * @param {number} seed - Random seed
 * @returns {Float32Array} Noise values 0-1
 */
function generateNoiseTexture(width, height, seed) {
  const random = createSeededRandom(seed);
  const noise = new Float32Array(width * height);

  for (let i = 0; i < noise.length; i++) {
    noise[i] = random();
  }

  return noise;
}

/**
 * Convert hex color string to RGB object.
 * @param {string} hex - Color in format '#RRGGBB' or 'RRGGBB'
 * @returns {{r: number, g: number, b: number}} RGB values 0-255
 */
function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length !== 6) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16)
  };
}

/**
 * Clamp a value to a range.
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
function clamp(value, min = 0, max = 255) {
  return Math.max(min, Math.min(max, value));
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.EffectUtils = {
    seedFromString,
    createSeededRandom,
    generateNoiseTexture,
    hexToRgb,
    clamp
  };
}
