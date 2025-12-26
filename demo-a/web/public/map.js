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

  const [config, coverage] = await Promise.all([
    fetch('/api/config').then(r => r.json()),
    fetch(`/api/coverage/${preset}`).then(r => r.json()).catch(() => null)
  ]);

  // Store coverage globally for UI toggles
  window.currentCoverage = coverage || { osm: true, contours: false, hillshade: false };

  // Use themeToMapLibreStyle converter for full theme support
  if (typeof window.themeToMapLibreStyle === 'function') {
    const style = window.themeToMapLibreStyle(
      theme,
      config.tileserverUrl,
      config.hillshadeTilesUrl,
      preset,
      renderMode,
      window.currentCoverage
    );

    // Set style and update layer visibility once style is loaded
    map.once('style.load', () => {
      // Update toggle states based on coverage
      if (window.updateToggleStates) {
        window.updateToggleStates(window.currentCoverage);
      }
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

// Fetch themes and config in parallel
Promise.all([
  fetch('/api/config').then(r => r.json()),
  fetch('/api/themes').then(r => r.json())
])
  .then(async ([config, themes]) => {
    // Read URL parameters for theme, preset, and render mode
    const urlParams = new URLSearchParams(window.location.search);
    const themeName = urlParams.get('theme') || 'paper';
    const bboxPreset = urlParams.get('bbox_preset') || 'stockholm_core';
    const renderMode = urlParams.get('render_mode') || 'screen';

    // Update global state from URL params
    currentPreset = bboxPreset;
    currentRenderMode = renderMode;

    // Populate theme dropdown dynamically
    const themeSelect = document.getElementById('theme-select');
    themeSelect.innerHTML = '';
    themes.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      themeSelect.appendChild(opt);
    });

    // Update UI selectors to match URL params
    const bboxSelect = document.getElementById('bbox-select');
    const renderModeSelect = document.getElementById('render-mode-select');
    if (themeSelect) themeSelect.value = themeName;
    if (bboxSelect) bboxSelect.value = bboxPreset;
    if (renderModeSelect) renderModeSelect.value = renderMode;

    // Load theme from URL param or default
    const initialTheme = await loadTheme(themeName);

    // Determine initial center/zoom based on preset
    const presetBounds = {
      stockholm_core: { center: [18.04, 59.335], zoom: 13 },
      stockholm_wide: { center: [18.0, 59.34], zoom: 11 },
      svealand: { center: [16.75, 59.75], zoom: 8 }
    };
    const bounds = presetBounds[bboxPreset] || presetBounds.stockholm_core;

    map = new maplibregl.Map({
      container: 'map',
      style: {
        version: 8,
        sources: {},
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: { 'background-color': initialTheme?.background || '#faf8f5' }
          }
        ]
      },
      center: bounds.center,
      zoom: bounds.zoom
    });

    map.on('load', async () => {
      console.log('Map loaded');
      window.map = map;  // Expose for exporter

      if (initialTheme) {
        await updateMapStyle(initialTheme, currentPreset, currentRenderMode);
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
        stockholm_wide: { center: [18.0, 59.34], zoom: 11 },
        svealand: { center: [16.75, 59.75], zoom: 8 }
      };
      if (bboxes[currentPreset]) {
        map.setCenter(bboxes[currentPreset].center);
        map.setZoom(bboxes[currentPreset].zoom);
      }
      if (currentTheme) {
        await updateMapStyle(currentTheme, currentPreset, currentRenderMode);
        // Update toggle states after style update
        if (window.updateToggleStates && window.currentCoverage) {
          window.updateToggleStates(window.currentCoverage);
        }
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
      hillshade: document.getElementById('toggle-hillshade'),
      water: document.getElementById('toggle-water'),
      parks: document.getElementById('toggle-parks'),
      roads: document.getElementById('toggle-roads'),
      buildings: document.getElementById('toggle-buildings'),
      contours: document.getElementById('toggle-contours')
    };

    // Update toggle states based on coverage
    function updateToggleStates(coverage) {
      if (!coverage) return;
      
      // Disable/enable toggles based on coverage
      if (layerToggles.hillshade) {
        layerToggles.hillshade.disabled = !coverage.hillshade;
        if (!coverage.hillshade && layerToggles.hillshade.checked) {
          layerToggles.hillshade.checked = false;
        }
      }
      
      if (layerToggles.contours) {
        layerToggles.contours.disabled = !coverage.contours;
        if (!coverage.contours && layerToggles.contours.checked) {
          layerToggles.contours.checked = false;
        }
      }
      
      // OSM layers (water, roads, buildings, parks) are always available if OSM exists
      // No need to disable them
    }

    // Make updateLayerVisibility globally available for updateMapStyle
    window.updateLayerVisibility = function() {
      if (!map || !map.isStyleLoaded()) return;

      const visibility = layer => layerToggles[layer]?.checked ? 'visible' : 'none';

      // Toggle hillshade (only if layer exists)
      if (map.getLayer('hillshade')) {
        map.setLayoutProperty('hillshade', 'visibility', visibility('hillshade'));
      }

      // Toggle water layers
      ['water', 'water-outline'].forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', visibility('water'));
        }
      });

      // Toggle parks layers (including landcover)
      ['parks', 'parks-outline', 'landcover'].forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', visibility('parks'));
        }
      });

      // Toggle road layers
      ['roads-minor', 'roads-major'].forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', visibility('roads'));
        }
      });

      // Toggle buildings layers
      ['buildings', 'buildings-outline'].forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', visibility('buildings'));
        }
      });

      // Toggle contour layers (all intervals) - only if layers exist
      ['contours-2m', 'contours-10m', 'contours-50m'].forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', visibility('contours'));
        }
      });
    };

    // Update toggle states when coverage changes
    window.updateToggleStates = updateToggleStates;

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

