// MapLibre map implementation with theme support
let map;
let currentTheme = null;
let currentPreset = 'stockholm_core';
let currentRenderMode = 'screen';

async function loadTheme(name) {
  try {
    const response = await fetch(`/themes/${name}.json`);
    if (!response.ok) throw new Error(`Theme ${name} not found`);
    return await response.json();
  } catch (error) {
    console.error('Error loading theme:', error);
    return null;
  }
}

async function updateMapStyle(theme, preset, renderMode) {
  if (!map) return;

  const config = await fetch('/api/config').then(r => r.json());

  // Use themeToMapLibreStyle converter for full theme support
  if (typeof window.themeToMapLibreStyle === 'function') {
    const style = window.themeToMapLibreStyle(
      theme,
      config.tileserverUrl,
      config.hillshadeTilesUrl,
      preset,
      renderMode
    );

    // Set style and update layer visibility once style is loaded
    map.once('style.load', () => {
      if (window.updateLayerVisibility) {
        window.updateLayerVisibility();
      }
    });

    map.setStyle(style);
  } else {
    console.error('themeToMapLibreStyle not loaded');
    // Fallback: simple style with background and hillshade only
    const style = {
      version: 8,
      sources: {
        hillshade: {
          type: 'raster',
          tiles: [`${config.hillshadeTilesUrl}/tiles/hillshade/${preset}/{z}/{x}/{y}.png`],
          tileSize: 256
        }
      },
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: { 'background-color': theme.background }
        },
        {
          id: 'hillshade',
          type: 'raster',
          source: 'hillshade',
          paint: { 'raster-opacity': theme.hillshade?.opacity || 0.15 }
        }
      ]
    };
    map.setStyle(style);
  }

  currentTheme = theme;
}

fetch('/api/config')
  .then(res => res.json())
  .then(async config => {
    // Load default theme
    const defaultTheme = await loadTheme('paper');

    map = new maplibregl.Map({
      container: 'map',
      style: {
        version: 8,
        sources: {},
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: { 'background-color': defaultTheme?.background || '#faf8f5' }
          }
        ]
      },
      center: [18.04, 59.33],  // Stockholm
      zoom: 12
    });

    map.on('load', async () => {
      console.log('Map loaded');
      window.map = map;  // Expose for exporter

      if (defaultTheme) {
        await updateMapStyle(defaultTheme, currentPreset, currentRenderMode);
      }
    });

    // Theme selector
    document.getElementById('theme-select').addEventListener('change', async (e) => {
      const theme = await loadTheme(e.target.value);
      if (theme) {
        await updateMapStyle(theme, currentPreset, currentRenderMode);
      }
    });

    // Bbox selector
    document.getElementById('bbox-select').addEventListener('change', async (e) => {
      currentPreset = e.target.value;
      // Update map bounds based on preset
      const bboxes = {
        stockholm_core: { center: [18.04, 59.335], zoom: 13 },
        stockholm_wide: { center: [18.0, 59.34], zoom: 11 }
      };
      if (bboxes[currentPreset]) {
        map.setCenter(bboxes[currentPreset].center);
        map.setZoom(bboxes[currentPreset].zoom);
      }
      if (currentTheme) {
        await updateMapStyle(currentTheme, currentPreset, currentRenderMode);
      }
    });

    // Render mode selector
    document.getElementById('render-mode-select').addEventListener('change', (e) => {
      currentRenderMode = e.target.value;
      if (currentTheme) {
        updateMapStyle(currentTheme, currentPreset, currentRenderMode);
      }
    });

    // Layer toggles
    const layerToggles = {
      buildings: document.getElementById('toggle-buildings'),
      contours: document.getElementById('toggle-contours'),
      hillshade: document.getElementById('toggle-hillshade')
    };

    // Make updateLayerVisibility globally available for updateMapStyle
    window.updateLayerVisibility = function() {
      if (!map || !map.isStyleLoaded()) return;

      const visibility = layer => layerToggles[layer]?.checked ? 'visible' : 'none';

      // Toggle buildings layers
      ['buildings', 'buildings-outline'].forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', visibility('buildings'));
        }
      });

      // Toggle contour layers (all intervals)
      ['contours-2m', 'contours-10m', 'contours-50m'].forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', visibility('contours'));
        }
      });

      // Toggle hillshade
      if (map.getLayer('hillshade')) {
        map.setLayoutProperty('hillshade', 'visibility', visibility('hillshade'));
      }
    };

    Object.keys(layerToggles).forEach(layer => {
      layerToggles[layer].addEventListener('change', () => {
        window.updateLayerVisibility();
      });
    });

    // Watch for style changes to update layer visibility
    map.on('style.load', () => {
      window.updateLayerVisibility();
    });

    // Export button
    document.getElementById('export-btn').addEventListener('click', () => {
      const params = new URLSearchParams({
        bbox_preset: currentPreset,
        theme: document.getElementById('theme-select').value,
        render_mode: currentRenderMode,
        dpi: 150,
        width_mm: 420,
        height_mm: 594
      });
      window.location.href = `http://localhost:8082/render?${params}`;
    });
  });

