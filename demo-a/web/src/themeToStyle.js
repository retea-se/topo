/**
 * Convert theme JSON to MapLibre style specification.
 */

function themeToMapLibreStyle(theme, tileserverUrl, hillshadeTilesUrl, preset, renderMode = 'screen') {
  const isPrintMode = renderMode === 'print';

  // Base style
  const style = {
    version: 8,
    sources: {
      osm: {
        type: 'vector',
        url: `${tileserverUrl}/catalog/osm/tiles/{z}/{x}/{y}`
      },
      contours_2m: {
        type: 'vector',
        url: `${tileserverUrl}/catalog/contours_2m/tiles/{z}/{x}/{y}`
      },
      contours_10m: {
        type: 'vector',
        url: `${tileserverUrl}/catalog/contours_10m/tiles/{z}/{x}/{y}`
      },
      contours_50m: {
        type: 'vector',
        url: `${tileserverUrl}/catalog/contours_50m/tiles/{z}/{x}/{y}`
      },
      hillshade: {
        type: 'raster',
        tiles: [`${hillshadeTilesUrl}/tiles/hillshade/${preset}/{z}/{x}/{y}.png`],
        tileSize: 256
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

  // Parks layer (polygons)
  style.layers.push({
    id: 'parks',
    type: 'fill',
    source: 'osm',
    'source-layer': 'landuse',
    filter: ['in', ['get', 'landuse'], ['literal', ['park', 'recreation_ground', 'forest', 'nature_reserve']]],
    paint: {
      'fill-color': theme.parks.fill,
      'fill-opacity': 1.0
    }
  });

  style.layers.push({
    id: 'parks-outline',
    type: 'line',
    source: 'osm',
    'source-layer': 'landuse',
    filter: ['in', ['get', 'landuse'], ['literal', ['park', 'recreation_ground', 'forest', 'nature_reserve']]],
    paint: {
      'line-color': theme.parks.stroke,
      'line-width': theme.parks.strokeWidth || 0.3
    }
  });

  // Roads - minor first, then major (so major appears on top)
  if (theme.roads) {
    const minorWidth = typeof theme.roads.strokeWidth === 'object'
      ? theme.roads.strokeWidth.minor
      : theme.roads.strokeWidth * 0.6;
    const majorWidth = typeof theme.roads.strokeWidth === 'object'
      ? theme.roads.strokeWidth.major
      : theme.roads.strokeWidth;

    // Minor roads
    style.layers.push({
      id: 'roads-minor',
      type: 'line',
      source: 'osm',
      'source-layer': 'transportation',
      filter: ['in', ['get', 'highway'], ['literal', ['residential', 'service', 'unclassified', 'track']]],
      paint: {
        'line-color': theme.roads.stroke,
        'line-width': isPrintMode ? minorWidth * 0.7 : minorWidth
      }
    });

    // Major roads
    style.layers.push({
      id: 'roads-major',
      type: 'line',
      source: 'osm',
      'source-layer': 'transportation',
      filter: ['in', ['get', 'highway'], ['literal', ['primary', 'secondary', 'tertiary', 'trunk', 'motorway']]],
      paint: {
        'line-color': theme.roads.stroke,
        'line-width': isPrintMode ? majorWidth * 0.8 : majorWidth
      }
    });
  }

  // Buildings
  if (theme.buildings) {
    style.layers.push({
      id: 'buildings',
      type: 'fill',
      source: 'osm',
      'source-layer': 'buildings',
      paint: {
        'fill-color': theme.buildings.fill,
        'fill-opacity': 1.0
      }
    });

    style.layers.push({
      id: 'buildings-outline',
      type: 'line',
      source: 'osm',
      'source-layer': 'buildings',
      paint: {
        'line-color': theme.buildings.stroke,
        'line-width': theme.buildings.strokeWidth || 0.5
      }
    });
  }

  // Contours - render from major to minor (50m, 10m, 2m)
  // CRITICAL: No labels ever (theme.contours.noLabels is always true)
  if (theme.contours) {
    const contourIntervals = theme.contours.intervals || [2, 10, 50];
    const majorWidth = typeof theme.contours.strokeWidth === 'object'
      ? theme.contours.strokeWidth.major
      : theme.contours.strokeWidth;
    const minorWidth = typeof theme.contours.strokeWidth === 'object'
      ? theme.contours.strokeWidth.minor
      : theme.contours.strokeWidth * 0.5;

    // Render in reverse order (50m first, so 2m appears on top)
    const intervalToLayer = {
      50: 'contours_50m',
      10: 'contours_10m',
      2: 'contours_2m'
    };

    contourIntervals.reverse().forEach(interval => {
      const sourceLayer = intervalToLayer[interval];
      if (!sourceLayer) return;

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
          'line-width': interval === 50 ? majorWidth : minorWidth
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


