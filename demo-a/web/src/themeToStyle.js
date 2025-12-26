/**
 * Convert theme JSON to MapLibre style specification.
 */

function themeToMapLibreStyle(theme, tileserverUrl, hillshadeTilesUrl, preset, renderMode = 'screen') {
  const isPrintMode = renderMode === 'print';

  // Determine which contour sources to use based on preset
  const contourPrefix = preset === 'stockholm_wide' ? 'contours_wide' : 'contours';

  // Base style
  // Martin serves TileJSON at /{source} and tiles at /{source}/{z}/{x}/{y}
  const style = {
    version: 8,
    sources: {
      osm: {
        type: 'vector',
        url: `${tileserverUrl}/osm`  // TileJSON URL - Martin will provide tile URLs
      },
      contours_2m: {
        type: 'vector',
        url: `${tileserverUrl}/${contourPrefix}_2m`
      },
      contours_10m: {
        type: 'vector',
        url: `${tileserverUrl}/${contourPrefix}_10m`
      },
      contours_50m: {
        type: 'vector',
        url: `${tileserverUrl}/${contourPrefix}_50m`
      },
      hillshade: {
        type: 'raster',
        tiles: [`${hillshadeTilesUrl}/tiles/hillshade/${preset}/{z}/{x}/{y}.png`],
        tileSize: 256,
        scheme: 'tms',
        minzoom: 10,
        maxzoom: 16
      }
    },
    layers: []
  };

  // Background layer
  style.layers.push({
    id: 'background',
    type: 'background',
    paint: {
      'background-color': theme.background
    }
  });

  // Hillshade layer (raster)
  style.layers.push({
    id: 'hillshade',
    type: 'raster',
    source: 'hillshade',
    paint: {
      'raster-opacity': theme.hillshade.opacity || 0.15
      // Note: gamma and contrast adjustments would need custom shaders or pre-processing
    }
  });

  // Water layer (polygons)
  style.layers.push({
    id: 'water',
    type: 'fill',
    source: 'osm',
    'source-layer': 'water',
    paint: {
      'fill-color': theme.water.fill,
      'fill-opacity': 1.0
    }
  });

  style.layers.push({
    id: 'water-outline',
    type: 'line',
    source: 'osm',
    'source-layer': 'water',
    paint: {
      'line-color': theme.water.stroke,
      'line-width': theme.water.strokeWidth || 0.5
    }
  });

  // Parks layer - uses 'park' source-layer with 'class' field
  style.layers.push({
    id: 'parks',
    type: 'fill',
    source: 'osm',
    'source-layer': 'park',
    paint: {
      'fill-color': theme.parks.fill,
      'fill-opacity': 1.0
    }
  });

  style.layers.push({
    id: 'parks-outline',
    type: 'line',
    source: 'osm',
    'source-layer': 'park',
    paint: {
      'line-color': theme.parks.stroke,
      'line-width': theme.parks.strokeWidth || 0.3
    }
  });

  // Landcover (forests, grass, etc) - uses 'class' field
  // Slightly more transparent than parks for visual hierarchy
  style.layers.push({
    id: 'landcover',
    type: 'fill',
    source: 'osm',
    'source-layer': 'landcover',
    filter: ['in', ['get', 'class'], ['literal', ['grass', 'wood', 'forest']]],
    paint: {
      'fill-color': theme.parks.fill,
      'fill-opacity': isPrintMode ? 0.5 : 0.6
    }
  });

  // Roads - minor first, then major (so major appears on top)
  // transportation layer uses 'class' field, not 'highway'
  if (theme.roads) {
    const minorWidth = typeof theme.roads.strokeWidth === 'object'
      ? theme.roads.strokeWidth.minor
      : theme.roads.strokeWidth * 0.6;
    const majorWidth = typeof theme.roads.strokeWidth === 'object'
      ? theme.roads.strokeWidth.major
      : theme.roads.strokeWidth;

    // Minor roads (service, track, path, minor)
    style.layers.push({
      id: 'roads-minor',
      type: 'line',
      source: 'osm',
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['service', 'track', 'path', 'minor']]],
      paint: {
        'line-color': theme.roads.stroke,
        'line-width': isPrintMode ? minorWidth * 0.7 : minorWidth
      }
    });

    // Major roads (primary, secondary, tertiary, trunk, motorway)
    style.layers.push({
      id: 'roads-major',
      type: 'line',
      source: 'osm',
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['primary', 'secondary', 'tertiary', 'trunk', 'motorway']]],
      paint: {
        'line-color': theme.roads.stroke,
        'line-width': isPrintMode ? majorWidth * 0.8 : majorWidth
      }
    });
  }

  // Buildings - source-layer is 'building' (singular)
  if (theme.buildings) {
    style.layers.push({
      id: 'buildings',
      type: 'fill',
      source: 'osm',
      'source-layer': 'building',
      paint: {
        'fill-color': theme.buildings.fill,
        'fill-opacity': 1.0
      }
    });

    style.layers.push({
      id: 'buildings-outline',
      type: 'line',
      source: 'osm',
      'source-layer': 'building',
      paint: {
        'line-color': theme.buildings.stroke,
        'line-width': theme.buildings.strokeWidth || 0.5
      }
    });
  }

  // Contours - render from minor to major (2m first, so 50m appears on top for emphasis)
  // CRITICAL: No labels ever (theme.contours.noLabels is always true)
  if (theme.contours) {
    const contourIntervals = theme.contours.intervals || [2, 10, 50];
    const majorWidth = typeof theme.contours.strokeWidth === 'object'
      ? theme.contours.strokeWidth.major
      : theme.contours.strokeWidth;
    const minorWidth = typeof theme.contours.strokeWidth === 'object'
      ? theme.contours.strokeWidth.minor
      : theme.contours.strokeWidth * 0.5;

    // Support per-interval opacity for visual hierarchy
    const majorOpacity = theme.contours.opacity?.major ?? 0.8;
    const minorOpacity = theme.contours.opacity?.minor ?? 0.5;

    // Render 2m first (bottom), then 10m, then 50m (top) for proper visual hierarchy
    const intervalToLayer = {
      2: 'contours_2m',
      10: 'contours_10m',
      50: 'contours_50m'
    };

    // Sort intervals ascending so major contours render on top
    const sortedIntervals = [...contourIntervals].sort((a, b) => a - b);

    sortedIntervals.forEach(interval => {
      const sourceLayer = intervalToLayer[interval];
      if (!sourceLayer) return;

      const isMajor = interval === 50;
      const isMedium = interval === 10;
      const lineWidth = isMajor ? majorWidth : (isMedium ? minorWidth * 1.3 : minorWidth);
      const lineOpacity = isMajor ? majorOpacity : (isMedium ? (majorOpacity + minorOpacity) / 2 : minorOpacity);

      style.layers.push({
        id: `contours-${interval}m`,
        type: 'line',
        source: sourceLayer,
        'source-layer': 'contours',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
          // NO text-field - contours never have labels
        },
        paint: {
          'line-color': theme.contours.stroke,
          'line-width': isPrintMode ? lineWidth * 1.2 : lineWidth,
          'line-opacity': lineOpacity
        }
      });
    });
  }

  return style;
}

// Export for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { themeToMapLibreStyle };
}

// Make available globally in browser
if (typeof window !== 'undefined') {
  window.themeToMapLibreStyle = themeToMapLibreStyle;
}


