/**
 * Effect Pipeline for Demo A (MapLibre/Canvas).
 *
 * This module provides post-render visual effects that are applied
 * after MapLibre generates the base map image.
 *
 * Usage:
 *   // After map render
 *   applyEffectPipeline(canvas, theme.effects, presetId);
 */

/**
 * Apply all enabled effects to a canvas.
 *
 * @param {HTMLCanvasElement} canvas - The map canvas element
 * @param {Object} effectsConfig - The 'effects' section from theme JSON
 * @param {string} [seed] - Deterministic seed (typically preset_id)
 * @returns {boolean} True if any effects were applied
 */
function applyEffectPipeline(canvas, effectsConfig, seed) {
  if (!effectsConfig) {
    return false;
  }

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Get current canvas content
  const imageData = ctx.getImageData(0, 0, width, height);

  let modified = false;

  // Apply risograph effect if enabled
  const risoConfig = effectsConfig.risograph;
  if (risoConfig && risoConfig.enabled) {
    if (typeof window.applyRisograph === 'function') {
      window.applyRisograph(imageData, risoConfig, seed);
      modified = true;
    } else {
      console.warn('Risograph effect not loaded');
    }
  }

  // Future effects would be added here:
  // const halftoneConfig = effectsConfig.halftone;
  // if (halftoneConfig && halftoneConfig.enabled) {
  //   window.applyHalftone(imageData, halftoneConfig, seed);
  //   modified = true;
  // }

  // Put modified image back
  if (modified) {
    ctx.putImageData(imageData, 0, 0);
  }

  return modified;
}

/**
 * Create a debounced version of the effect pipeline.
 * Prevents excessive processing during rapid map interactions.
 *
 * @param {number} wait - Debounce delay in milliseconds
 * @returns {function} Debounced applyEffectPipeline function
 */
function createDebouncedEffectPipeline(wait = 100) {
  let timeout = null;
  let pendingArgs = null;

  return function(canvas, effectsConfig, seed) {
    pendingArgs = [canvas, effectsConfig, seed];

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      if (pendingArgs) {
        applyEffectPipeline(...pendingArgs);
        pendingArgs = null;
      }
      timeout = null;
    }, wait);
  };
}

/**
 * Check if a theme has any enabled effects.
 *
 * @param {Object} theme - Theme object
 * @returns {boolean} True if any effects are enabled
 */
function hasEnabledEffects(theme) {
  if (!theme || !theme.effects) {
    return false;
  }

  const effects = theme.effects;

  if (effects.risograph && effects.risograph.enabled) {
    return true;
  }

  // Future effects would be checked here
  // if (effects.halftone && effects.halftone.enabled) {
  //   return true;
  // }

  return false;
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.EffectPipeline = {
    apply: applyEffectPipeline,
    createDebounced: createDebouncedEffectPipeline,
    hasEnabledEffects: hasEnabledEffects
  };
}
