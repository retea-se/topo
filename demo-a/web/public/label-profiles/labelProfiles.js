/**
 * Label Profiles - Kontrollerade label- och POI-profiler
 *
 * Tre profiler:
 * - "off": Inga labels/gatunamn
 * - "minimal": Kuraterat urval av gatunamn (hogre vagklasser, diskret typografi)
 * - "landmarks": POI/omradesnamn (park/torg/vatten) men inte alla gator
 *
 * Tre typografi-presets:
 * - "subtle": Diskret, nara osynlig
 * - "crisp": Tydlig, hog kontrast
 * - "classic": Traditionell kartestetik
 *
 * IMPORTANT: This module is designed to be idempotent. Calling applyLabelProfile
 * multiple times with the same or different parameters will always produce
 * consistent results by restoring baseline values before applying changes.
 */

/**
 * @typedef {'off' | 'minimal' | 'landmarks'} LabelProfile
 * @typedef {'subtle' | 'crisp' | 'classic'} TypographyPreset
 * @typedef {'street' | 'place' | 'poi' | 'water' | 'park' | 'other'} LayerCategory
 */

/**
 * Typography presets - kuraterade typografistilar
 * Dessa ersatter "magiska siffror" och gor typografin konfigurerbar
 */
const TYPOGRAPHY_PRESETS = {
  subtle: {
    name: 'Subtle',
    description: 'Diskret, nara osynlig - for wall-art',
    street: {
      textSizeFactor: 0.70,
      textColor: '#999999',
      haloWidth: 0.5,
      haloColor: '#ffffff',
      haloBlur: 1
    },
    landmark: {
      textSizeFactor: 0.90,
      textColor: '#777777',
      haloWidth: 0.8,
      haloColor: '#ffffff',
      haloBlur: 1
    }
  },
  crisp: {
    name: 'Crisp',
    description: 'Tydlig, hog kontrast - for lasbarhet',
    street: {
      textSizeFactor: 0.85,
      textColor: '#555555',
      haloWidth: 1.2,
      haloColor: '#ffffff',
      haloBlur: 0.5
    },
    landmark: {
      textSizeFactor: 1.0,
      textColor: '#333333',
      haloWidth: 1.5,
      haloColor: '#ffffff',
      haloBlur: 0.5
    }
  },
  classic: {
    name: 'Classic',
    description: 'Traditionell kartestetik - balanserad',
    street: {
      textSizeFactor: 0.80,
      textColor: '#707070',
      haloWidth: 0.8,
      haloColor: '#ffffff',
      haloBlur: 0.8
    },
    landmark: {
      textSizeFactor: 0.95,
      textColor: '#505050',
      haloWidth: 1.0,
      haloColor: '#ffffff',
      haloBlur: 0.8
    }
  }
};

/**
 * Default typography preset
 */
const DEFAULT_TYPOGRAPHY_PRESET = 'subtle';

/**
 * Default label profile
 */
const DEFAULT_LABEL_PROFILE = 'off';

/**
 * Profile definitions - exportable constant
 */
const LABEL_PROFILES = {
  off: {
    name: 'Off',
    description: 'Inga labels eller gatunamn visas',
    visibility: {
      street: false,
      place: false,
      poi: false,
      water: false,
      park: false,
      other: false
    }
  },
  minimal: {
    name: 'Minimal Streets',
    description: 'Visar endast hogre vagklasser med diskret typografi',
    visibility: {
      street: true,
      place: false,
      poi: false,
      water: false,
      park: false,
      other: false
    },
    // Typography applied from TYPOGRAPHY_PRESETS.street
    applyTypography: 'street'
  },
  landmarks: {
    name: 'Landmarks',
    description: 'Visar POI/omradesnamn (platsnamn, vatten, parker) men inte gatunamn',
    visibility: {
      street: false,
      place: true,
      poi: true,
      water: true,
      park: true,
      other: false
    },
    // Typography applied from TYPOGRAPHY_PRESETS.landmark
    applyTypography: 'landmark'
  }
};

/**
 * Classify a symbol layer based on source-layer and layer ID
 * Priority: source-layer > layer ID patterns
 *
 * @param {Object} layer - MapLibre layer object
 * @returns {LayerCategory} - The layer category
 */
function classifySymbolLayer(layer) {
  const sourceLayer = layer['source-layer'] || '';
  const layerId = layer.id || '';
  const sourceLayerLower = sourceLayer.toLowerCase();
  const layerIdLower = layerId.toLowerCase();

  // Priority 1: source-layer based classification
  if (sourceLayerLower === 'transportation_name') {
    return 'street';
  }
  if (sourceLayerLower === 'place') {
    return 'place';
  }
  if (sourceLayerLower === 'poi') {
    return 'poi';
  }
  if (sourceLayerLower === 'water_name') {
    return 'water';
  }
  if (sourceLayerLower === 'park') {
    return 'park';
  }

  // Priority 2: layer ID patterns (fallback)
  if (layerIdLower.includes('transport') || layerIdLower.includes('road') || layerIdLower.includes('street')) {
    return 'street';
  }
  if (layerIdLower.includes('place') || layerIdLower.includes('city') || layerIdLower.includes('town') || layerIdLower.includes('village') || layerIdLower.includes('neighborhood')) {
    return 'place';
  }
  if (layerIdLower.includes('poi') || layerIdLower.includes('point')) {
    return 'poi';
  }
  if (layerIdLower.includes('water') || layerIdLower.includes('lake') || layerIdLower.includes('river') || layerIdLower.includes('sea')) {
    return 'water';
  }
  if (layerIdLower.includes('park') || layerIdLower.includes('forest') || layerIdLower.includes('wood')) {
    return 'park';
  }

  return 'other';
}

/**
 * Check if a layer has a text-field (is a label layer)
 * @param {Object} layer - MapLibre layer object
 * @returns {boolean}
 */
function hasTextField(layer) {
  if (layer.type !== 'symbol') return false;
  const textField = layer.layout && layer.layout['text-field'];
  return textField !== undefined && textField !== null && textField !== '';
}

/**
 * Inventory all symbol layers in a MapLibre map
 * @param {maplibregl.Map} map - MapLibre map instance
 * @returns {Object} Detailed inventory of all symbol layers
 */
function inventorySymbolLayers(map) {
  const result = {
    all: [],
    byCategory: {
      street: [],
      place: [],
      poi: [],
      water: [],
      park: [],
      other: []
    },
    summary: {
      total: 0,
      withTextField: 0,
      byCategory: {}
    }
  };

  if (!map || typeof map.getStyle !== 'function') {
    return result;
  }

  const style = map.getStyle();
  if (!style || !style.layers) {
    return result;
  }

  style.layers.forEach(layer => {
    if (layer.type !== 'symbol') return;

    const hasText = hasTextField(layer);
    const category = classifySymbolLayer(layer);
    const visibility = layer.layout && layer.layout.visibility;

    const layerInfo = {
      id: layer.id,
      source: layer.source,
      sourceLayer: layer['source-layer'],
      hasTextField: hasText,
      textField: layer.layout && layer.layout['text-field'],
      category: category,
      visibility: visibility || 'visible',
      filter: layer.filter
    };

    result.all.push(layerInfo);

    if (hasText) {
      result.byCategory[category].push(layerInfo);
      result.summary.withTextField++;
    }
  });

  result.summary.total = result.all.length;
  Object.keys(result.byCategory).forEach(cat => {
    result.summary.byCategory[cat] = result.byCategory[cat].length;
  });

  return result;
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Internal state - current profile and typography preset
 */
let _currentState = {
  profile: DEFAULT_LABEL_PROFILE,
  typographyPreset: DEFAULT_TYPOGRAPHY_PRESET
};

/**
 * Baseline values for each layer (captured from style on first apply)
 * Key: layerId, Value: { textSize, textColor, haloWidth, haloColor, haloBlur, visibility }
 */
let _baselineValues = {};

/**
 * Flag to track if baseline has been captured for current style
 */
let _baselineCaptured = false;

/**
 * Store for tracking last applied changes (for UI display)
 */
let _lastAppliedChanges = [];

/**
 * Flag to prevent re-entrant style reload handling
 */
let _isApplying = false;

/**
 * Get the current label profile state
 * @returns {{ profile: LabelProfile, typographyPreset: TypographyPreset }}
 */
function getLabelProfileState() {
  return {
    profile: _currentState.profile,
    typographyPreset: _currentState.typographyPreset
  };
}

/**
 * Set the label profile state (for persistence/restore)
 * Does NOT apply the profile - call applyLabelProfile after
 * @param {{ profile?: LabelProfile, typographyPreset?: TypographyPreset }} state
 */
function setLabelProfileState(state) {
  if (state.profile && LABEL_PROFILES[state.profile]) {
    _currentState.profile = state.profile;
  }
  if (state.typographyPreset && TYPOGRAPHY_PRESETS[state.typographyPreset]) {
    _currentState.typographyPreset = state.typographyPreset;
  }
}

/**
 * Get the last applied changes
 * @returns {Array} Array of change descriptions
 */
function getLastAppliedChanges() {
  return _lastAppliedChanges;
}

/**
 * Get the current typography preset name (legacy compatibility)
 * @returns {string} Current preset name
 */
function getCurrentTypographyPreset() {
  return _currentState.typographyPreset;
}

/**
 * Reset baseline values (call when style changes)
 */
function resetBaseline() {
  _baselineValues = {};
  _baselineCaptured = false;
}

// ============================================================================
// BASELINE CAPTURE AND RESTORE
// ============================================================================

/**
 * Capture baseline values for a layer from the map
 * @param {maplibregl.Map} map
 * @param {string} layerId
 */
function captureLayerBaseline(map, layerId) {
  if (_baselineValues[layerId]) return; // Already captured

  try {
    _baselineValues[layerId] = {
      textSize: map.getLayoutProperty(layerId, 'text-size'),
      textColor: map.getPaintProperty(layerId, 'text-color'),
      haloWidth: map.getPaintProperty(layerId, 'text-halo-width'),
      haloColor: map.getPaintProperty(layerId, 'text-halo-color'),
      haloBlur: map.getPaintProperty(layerId, 'text-halo-blur'),
      visibility: map.getLayoutProperty(layerId, 'visibility') || 'visible',
      textAllowOverlap: map.getLayoutProperty(layerId, 'text-allow-overlap'),
      textOptional: map.getLayoutProperty(layerId, 'text-optional')
    };
  } catch (e) {
    // Layer might not exist or have these properties
  }
}

/**
 * Restore a layer to its baseline values
 * @param {maplibregl.Map} map
 * @param {string} layerId
 */
function restoreLayerToBaseline(map, layerId) {
  const baseline = _baselineValues[layerId];
  if (!baseline) return;

  try {
    if (baseline.textSize !== undefined) {
      map.setLayoutProperty(layerId, 'text-size', baseline.textSize);
    }
    if (baseline.textColor !== undefined) {
      map.setPaintProperty(layerId, 'text-color', baseline.textColor);
    }
    if (baseline.haloWidth !== undefined) {
      map.setPaintProperty(layerId, 'text-halo-width', baseline.haloWidth);
    }
    if (baseline.haloColor !== undefined) {
      map.setPaintProperty(layerId, 'text-halo-color', baseline.haloColor);
    }
    if (baseline.haloBlur !== undefined) {
      map.setPaintProperty(layerId, 'text-halo-blur', baseline.haloBlur);
    }
    if (baseline.visibility !== undefined) {
      map.setLayoutProperty(layerId, 'visibility', baseline.visibility);
    }
    if (baseline.textAllowOverlap !== undefined) {
      map.setLayoutProperty(layerId, 'text-allow-overlap', baseline.textAllowOverlap);
    }
    if (baseline.textOptional !== undefined) {
      map.setLayoutProperty(layerId, 'text-optional', baseline.textOptional);
    }
  } catch (e) {
    // Ignore restore errors
  }
}

// ============================================================================
// PROFILE APPLICATION
// ============================================================================

/**
 * Apply typography styling to a layer
 * @param {maplibregl.Map} map - MapLibre map instance
 * @param {string} layerId - Layer ID
 * @param {Object} typoStyle - Typography style object
 * @param {Object} change - Change object to update
 */
function applyTypographyToLayer(map, layerId, typoStyle, change) {
  try {
    // Get baseline text size to apply factor correctly
    const baseline = _baselineValues[layerId] || {};
    const baseTextSize = baseline.textSize;

    // Apply text size based on baseline
    if (typeof baseTextSize === 'number') {
      const newSize = Math.max(8, baseTextSize * typoStyle.textSizeFactor);
      map.setLayoutProperty(layerId, 'text-size', newSize);
      change.details.push('text-size: ' + baseTextSize + ' -> ' + newSize.toFixed(1));
    } else if (baseTextSize === undefined) {
      // No baseline - use a sensible default
      const defaultSize = 10 * typoStyle.textSizeFactor;
      map.setLayoutProperty(layerId, 'text-size', Math.max(8, defaultSize));
      change.details.push('text-size: default -> ' + Math.max(8, defaultSize).toFixed(1));
    }
    // If baseTextSize is an expression/array, leave it unchanged

    // Set text color
    map.setPaintProperty(layerId, 'text-color', typoStyle.textColor);
    change.details.push('text-color: ' + typoStyle.textColor);

    // Set halo
    map.setPaintProperty(layerId, 'text-halo-width', typoStyle.haloWidth);
    map.setPaintProperty(layerId, 'text-halo-color', typoStyle.haloColor);
    map.setPaintProperty(layerId, 'text-halo-blur', typoStyle.haloBlur);
    change.details.push('halo: ' + typoStyle.haloWidth + 'px ' + typoStyle.haloColor);

    // Reduce label density
    map.setLayoutProperty(layerId, 'text-allow-overlap', false);
    map.setLayoutProperty(layerId, 'text-optional', true);
    change.details.push('overlap: false, optional: true');

    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Apply a label profile to the map
 *
 * This function is IDEMPOTENT - calling it multiple times with the same
 * or different parameters will always produce consistent results.
 *
 * @param {maplibregl.Map} map - MapLibre map instance
 * @param {LabelProfile} profileKey - Profile to apply ('off', 'minimal', 'landmarks')
 * @param {Object} options - Optional configuration
 * @param {TypographyPreset} options.typographyPreset - Typography preset to use ('subtle', 'crisp', 'classic')
 * @returns {Object} Result with applied changes and any issues
 */
function applyLabelProfile(map, profileKey, options) {
  options = options || {};
  const typographyPreset = options.typographyPreset || _currentState.typographyPreset || DEFAULT_TYPOGRAPHY_PRESET;

  // Prevent re-entrant calls
  if (_isApplying) {
    return {
      success: false,
      profile: profileKey,
      typographyPreset: typographyPreset,
      changes: [],
      warnings: ['Apply already in progress'],
      inventory: null
    };
  }

  _isApplying = true;
  _lastAppliedChanges = [];

  const result = {
    success: false,
    profile: profileKey,
    typographyPreset: typographyPreset,
    changes: [],
    warnings: [],
    inventory: null
  };

  try {
    if (!map || typeof map.getStyle !== 'function') {
      result.warnings.push('Map not available');
      return result;
    }

    // Check if style is loaded
    let styleLoaded = false;
    try {
      styleLoaded = map.isStyleLoaded();
    } catch (e) {
      result.warnings.push('Could not check if style is loaded: ' + e.message);
      return result;
    }

    if (!styleLoaded) {
      result.warnings.push('Style not loaded yet');
      return result;
    }

    const profile = LABEL_PROFILES[profileKey];
    if (!profile) {
      result.warnings.push('Unknown profile: ' + profileKey);
      return result;
    }

    // Get typography preset
    const typoPreset = TYPOGRAPHY_PRESETS[typographyPreset];
    if (!typoPreset) {
      result.warnings.push('Unknown typography preset: ' + typographyPreset + ', using default');
    }
    const effectiveTypoPreset = typoPreset || TYPOGRAPHY_PRESETS[DEFAULT_TYPOGRAPHY_PRESET];

    // Get inventory
    const inventory = inventorySymbolLayers(map);
    result.inventory = inventory;

    if (inventory.summary.withTextField === 0) {
      result.warnings.push('No symbol layers with text-field found in style');
      return result;
    }

    // Capture baseline values for all label layers (only on first apply after style load)
    if (!_baselineCaptured) {
      inventory.all.filter(l => l.hasTextField).forEach(layerInfo => {
        captureLayerBaseline(map, layerInfo.id);
      });
      _baselineCaptured = true;
    }

    // STEP 1: Restore all layers to baseline before applying new profile
    // This ensures idempotency
    inventory.all.filter(l => l.hasTextField).forEach(layerInfo => {
      restoreLayerToBaseline(map, layerInfo.id);
    });

    // STEP 2: Apply the new profile
    Object.keys(profile.visibility).forEach(category => {
      const shouldBeVisible = profile.visibility[category];
      const layersInCategory = inventory.byCategory[category] || [];

      layersInCategory.forEach(layerInfo => {
        if (!map.getLayer(layerInfo.id)) {
          result.warnings.push('Layer not found: ' + layerInfo.id);
          return;
        }

        const change = {
          layerId: layerInfo.id,
          category: category,
          action: shouldBeVisible ? 'show' : 'hide',
          details: []
        };

        // Set visibility
        const targetVisibility = shouldBeVisible ? 'visible' : 'none';
        map.setLayoutProperty(layerInfo.id, 'visibility', targetVisibility);
        change.details.push('visibility: ' + targetVisibility);

        // Apply typography styling for visible layers (except 'off' profile)
        if (shouldBeVisible && profileKey !== 'off' && profile.applyTypography) {
          // Determine style based on category
          let categoryTypoStyle;
          if (category === 'street') {
            categoryTypoStyle = effectiveTypoPreset.street;
          } else {
            categoryTypoStyle = effectiveTypoPreset.landmark;
          }

          const success = applyTypographyToLayer(map, layerInfo.id, categoryTypoStyle, change);
          if (!success) {
            result.warnings.push('Typography error for ' + layerInfo.id);
          }
        }

        result.changes.push(change);
      });
    });

    // Update internal state
    _currentState.profile = profileKey;
    _currentState.typographyPreset = typographyPreset;

    _lastAppliedChanges = result.changes;
    result.success = true;
    return result;

  } finally {
    _isApplying = false;
  }
}

// ============================================================================
// DIAGNOSTICS
// ============================================================================

/**
 * Query rendered features for landmarks diagnostics
 * @param {maplibregl.Map} map - MapLibre map instance
 * @returns {Object} Diagnostics info about landmarks data
 */
function diagnosticLandmarks(map) {
  const result = {
    place: { found: false, count: 0, sample: null },
    poi: { found: false, count: 0, sample: null },
    water: { found: false, count: 0, sample: null },
    park: { found: false, count: 0, sample: null }
  };

  if (!map || typeof map.queryRenderedFeatures !== 'function') {
    return result;
  }

  // Query for each source-layer
  const sourceLayers = {
    place: 'place',
    poi: 'poi',
    water: 'water_name',
    park: 'park'
  };

  Object.keys(sourceLayers).forEach(key => {
    try {
      const features = map.queryRenderedFeatures({
        layers: undefined // Query all layers
      }).filter(f => f.sourceLayer === sourceLayers[key]);

      if (features.length > 0) {
        result[key].found = true;
        result[key].count = features.length;
        // Get a sample with name if available
        const withName = features.find(f => f.properties && f.properties.name);
        result[key].sample = withName ? {
          name: withName.properties.name,
          class: withName.properties.class,
          rank: withName.properties.rank
        } : features[0].properties;
      }
    } catch (e) {
      // Ignore query errors
    }
  });

  return result;
}

// ============================================================================
// STYLE RELOAD HANDLING
// ============================================================================

/**
 * Setup style reload handler to reapply profile after style changes
 *
 * This function sets up event handlers that will automatically reapply
 * the current label profile when the map style is reloaded.
 *
 * @param {maplibregl.Map} map - MapLibre map instance
 * @param {Function} getProfileFn - Function that returns current profile key
 * @param {Function} getTypographyPresetFn - Optional function that returns current typography preset
 */
function setupStyleReloadHandler(map, getProfileFn, getTypographyPresetFn) {
  if (!map) return;

  let styleLoadHandlerAttached = false;

  const reapplyProfile = () => {
    // Reset baseline when style changes
    resetBaseline();

    // Wait for style to be fully loaded with retry logic
    let attempts = 0;
    const maxAttempts = 20;

    const checkAndApply = () => {
      attempts++;
      if (attempts > maxAttempts) {
        return; // Give up after max attempts
      }

      try {
        if (map.isStyleLoaded()) {
          const profile = typeof getProfileFn === 'function' ? getProfileFn() : _currentState.profile;
          const typoPreset = typeof getTypographyPresetFn === 'function' ? getTypographyPresetFn() : _currentState.typographyPreset;

          // Small delay to ensure all layers are ready
          setTimeout(() => {
            applyLabelProfile(map, profile, { typographyPreset: typoPreset });
          }, 100);
        } else {
          setTimeout(checkAndApply, 50);
        }
      } catch (e) {
        // Map might be in transition, retry
        setTimeout(checkAndApply, 50);
      }
    };

    checkAndApply();
  };

  // Handle style.load event (fires when style is set/changed)
  if (!styleLoadHandlerAttached) {
    map.on('style.load', reapplyProfile);
    styleLoadHandlerAttached = true;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // Constants
    LABEL_PROFILES,
    TYPOGRAPHY_PRESETS,
    DEFAULT_TYPOGRAPHY_PRESET,
    DEFAULT_LABEL_PROFILE,

    // Classification
    classifySymbolLayer,
    hasTextField,
    inventorySymbolLayers,

    // State management
    getLabelProfileState,
    setLabelProfileState,
    getLastAppliedChanges,
    getCurrentTypographyPreset,
    resetBaseline,

    // Core functionality
    applyLabelProfile,
    setupStyleReloadHandler,

    // Diagnostics
    diagnosticLandmarks
  };
}

// Make available globally in browser
if (typeof window !== 'undefined') {
  window.LabelProfiles = {
    // Constants
    LABEL_PROFILES,
    TYPOGRAPHY_PRESETS,
    DEFAULT_TYPOGRAPHY_PRESET,
    DEFAULT_LABEL_PROFILE,

    // Classification
    classifySymbolLayer,
    hasTextField,
    inventorySymbolLayers,

    // State management
    getLabelProfileState,
    setLabelProfileState,
    getLastAppliedChanges,
    getCurrentTypographyPreset,
    resetBaseline,

    // Core functionality
    applyLabelProfile,
    setupStyleReloadHandler,

    // Diagnostics
    diagnosticLandmarks
  };
}
