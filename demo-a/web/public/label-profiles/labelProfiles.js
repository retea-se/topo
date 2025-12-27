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

/**
 * Store for tracking applied changes and current settings (for debugging/display)
 */
let lastAppliedChanges = [];
let currentTypographyPreset = DEFAULT_TYPOGRAPHY_PRESET;

/**
 * Get the last applied changes
 * @returns {Array} Array of change descriptions
 */
function getLastAppliedChanges() {
  return lastAppliedChanges;
}

/**
 * Get the current typography preset name
 * @returns {string} Current preset name
 */
function getCurrentTypographyPreset() {
  return currentTypographyPreset;
}

/**
 * Apply typography styling to a layer
 * @param {maplibregl.Map} map - MapLibre map instance
 * @param {string} layerId - Layer ID
 * @param {Object} typoStyle - Typography style object
 * @param {Object} change - Change object to update
 */
function applyTypographyToLayer(map, layerId, typoStyle, change) {
  try {
    // Reduce text size
    const currentSize = map.getLayoutProperty(layerId, 'text-size');
    if (typeof currentSize === 'number') {
      const newSize = Math.max(8, currentSize * typoStyle.textSizeFactor);
      map.setLayoutProperty(layerId, 'text-size', newSize);
      change.details.push('text-size: ' + currentSize + ' -> ' + newSize.toFixed(1));
    } else if (currentSize === undefined) {
      const defaultSize = 10 * typoStyle.textSizeFactor;
      map.setLayoutProperty(layerId, 'text-size', Math.max(8, defaultSize));
      change.details.push('text-size: default -> ' + Math.max(8, defaultSize).toFixed(1));
    }

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
 * @param {maplibregl.Map} map - MapLibre map instance
 * @param {LabelProfile} profileKey - Profile to apply ('off', 'minimal', 'landmarks')
 * @param {Object} options - Optional configuration
 * @param {TypographyPreset} options.typographyPreset - Typography preset to use ('subtle', 'crisp', 'classic')
 * @returns {Object} Result with applied changes and any issues
 */
function applyLabelProfile(map, profileKey, options) {
  options = options || {};
  const typographyPreset = options.typographyPreset || DEFAULT_TYPOGRAPHY_PRESET;

  lastAppliedChanges = [];
  currentTypographyPreset = typographyPreset;

  const result = {
    success: false,
    profile: profileKey,
    typographyPreset: typographyPreset,
    changes: [],
    warnings: [],
    inventory: null
  };

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

  // Determine which typography style to use based on profile
  const typoStyleKey = profile.applyTypography || 'street';
  const typoStyle = effectiveTypoPreset[typoStyleKey] || effectiveTypoPreset.street;

  // Apply profile to each category
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
        let categoryTypoStyle = typoStyle;
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

  lastAppliedChanges = result.changes;
  result.success = true;
  return result;
}

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

/**
 * Setup style reload handler to reapply profile after style changes
 * @param {maplibregl.Map} map - MapLibre map instance
 * @param {Function} getProfileFn - Function that returns current profile key
 * @param {Function} getTypographyPresetFn - Optional function that returns current typography preset
 */
function setupStyleReloadHandler(map, getProfileFn, getTypographyPresetFn) {
  if (!map) return;

  const reapplyProfile = () => {
    // Wait for style to be fully loaded
    const checkAndApply = () => {
      if (map.isStyleLoaded()) {
        const profile = typeof getProfileFn === 'function' ? getProfileFn() : 'off';
        const typoPreset = typeof getTypographyPresetFn === 'function' ? getTypographyPresetFn() : DEFAULT_TYPOGRAPHY_PRESET;
        setTimeout(() => {
          applyLabelProfile(map, profile, { typographyPreset: typoPreset });
        }, 100);
      } else {
        setTimeout(checkAndApply, 50);
      }
    };
    checkAndApply();
  };

  // Handle style.load event
  map.on('style.load', reapplyProfile);

  // Also handle idle event as fallback
  map.once('idle', () => {
    const profile = typeof getProfileFn === 'function' ? getProfileFn() : 'off';
    if (profile !== 'off') {
      const typoPreset = typeof getTypographyPresetFn === 'function' ? getTypographyPresetFn() : DEFAULT_TYPOGRAPHY_PRESET;
      applyLabelProfile(map, profile, { typographyPreset: typoPreset });
    }
  });
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LABEL_PROFILES,
    TYPOGRAPHY_PRESETS,
    DEFAULT_TYPOGRAPHY_PRESET,
    classifySymbolLayer,
    hasTextField,
    inventorySymbolLayers,
    applyLabelProfile,
    getLastAppliedChanges,
    getCurrentTypographyPreset,
    diagnosticLandmarks,
    setupStyleReloadHandler
  };
}

// Make available globally in browser
if (typeof window !== 'undefined') {
  window.LabelProfiles = {
    LABEL_PROFILES,
    TYPOGRAPHY_PRESETS,
    DEFAULT_TYPOGRAPHY_PRESET,
    classifySymbolLayer,
    hasTextField,
    inventorySymbolLayers,
    applyLabelProfile,
    getLastAppliedChanges,
    getCurrentTypographyPreset,
    diagnosticLandmarks,
    setupStyleReloadHandler
  };
}
