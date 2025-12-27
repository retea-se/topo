/**
 * Interactive Print Editor for Topo Map Export
 * Nordic/Scandinavian design with clean, minimal UI
 */

// State
let map;
let draw;
let currentTheme = null;
let currentPreset = 'stockholm_core';
let currentBbox = null;
let isDrawingMode = false;
let currentFormat = 'png';
let currentOrientation = 'portrait';
let styleChangeInProgress = false;
let pendingStyleChange = false;
let isPreviewMode = false;

// Export Preset State (Phase 9.2)
let exportPresets = [];
let selectedExportPreset = null;
let selectedExportPresetData = null;
let presetModified = false;
let presetOriginalValues = null;

// Debug logging
const DEBUG = false;
function debug(...args) {
    if (DEBUG) console.log('[Editor]', ...args);
}

// Paper sizes in mm
const PAPER_SIZES = {
    A4: { width: 210, height: 297 },
    A3: { width: 297, height: 420 },
    A2: { width: 420, height: 594 },
    A1: { width: 594, height: 841 },
    A0: { width: 841, height: 1189 }
};

// Preset bboxes (WGS84)
const PRESET_BBOXES = {
    stockholm_core: { west: 17.90, south: 59.32, east: 18.08, north: 59.35, center: [18.04, 59.335], zoom: 13 },
    stockholm_wide: { west: 17.75, south: 59.28, east: 18.25, north: 59.40, center: [18.0, 59.34], zoom: 11 },
    svealand: { west: 14.5, south: 58.5, east: 19.0, north: 61.0, center: [16.75, 59.75], zoom: 8 }
};

// Layout templates
const LAYOUT_TEMPLATES = {
    classic: {
        name: 'Classic',
        titlePosition: 'top-center',
        titleFont: 'Georgia, serif',
        titleSize: 22,
        subtitleSize: 13,
        titleBackground: 'rgba(255,255,255,0.92)',
        titleColor: '#2d3436',
        frameStyle: 'solid',
        frameColor: '#636e72',
        frameWidth: 1
    },
    modern: {
        name: 'Modern',
        titlePosition: 'bottom-left',
        titleFont: "'Inter', -apple-system, sans-serif",
        titleSize: 24,
        subtitleSize: 12,
        titleBackground: 'linear-gradient(to top, rgba(45,52,54,0.85) 0%, transparent 100%)',
        titleColor: '#fff',
        frameStyle: 'none',
        frameColor: 'transparent',
        frameWidth: 0
    },
    minimal: {
        name: 'Minimal',
        titlePosition: 'none',
        titleFont: 'system-ui, sans-serif',
        titleSize: 0,
        subtitleSize: 0,
        titleBackground: 'transparent',
        frameStyle: 'solid',
        frameColor: '#b2bec3',
        frameWidth: 1
    },
    elegant: {
        name: 'Elegant',
        titlePosition: 'top-center',
        titleFont: "'Playfair Display', 'Times New Roman', serif",
        titleSize: 24,
        subtitleSize: 13,
        titleBackground: 'rgba(253,251,248,0.95)',
        titleColor: '#4a4a4a',
        frameStyle: 'double',
        frameColor: '#8b7355',
        frameWidth: 3
    },
    bold: {
        name: 'Bold',
        titlePosition: 'center-overlay',
        titleFont: "'Inter', 'Helvetica Neue', sans-serif",
        titleSize: 42,
        subtitleSize: 16,
        titleBackground: 'transparent',
        titleColor: 'rgba(255,255,255,0.95)',
        titleShadow: '0 2px 12px rgba(0,0,0,0.6)',
        frameStyle: 'solid',
        frameColor: '#4a6fa5',
        frameWidth: 2
    },
    // New layouts - Phase 1: Simple
    minimalist: {
        name: 'Minimalist',
        titlePosition: 'none',
        titleFont: "'Helvetica Neue', -apple-system, sans-serif",
        titleSize: 0,
        subtitleSize: 0,
        titleBackground: 'transparent',
        titleColor: 'rgba(0,0,0,0.2)',
        frameStyle: 'solid',
        frameColor: 'rgba(200, 200, 200, 0.3)',
        frameWidth: 0.5,
        scalePosition: 'none',
        attributionPosition: 'none'
    },
    scientific: {
        name: 'Scientific',
        titlePosition: 'top-left',
        titleFont: "'Arial', 'Helvetica', sans-serif",
        titleSize: 20,
        subtitleSize: 12,
        titleBackground: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#2d3436',
        frameStyle: 'solid',
        frameColor: '#636e72',
        frameWidth: 1,
        scalePosition: 'bottom-right',
        attributionPosition: 'bottom-right',
        scaleFont: 'sans-serif'
    },
    blueprint: {
        name: 'Blueprint',
        titlePosition: 'top-left',
        titleFont: "'Courier Prime', 'Courier New', 'Monaco', monospace",
        titleSize: 16,
        subtitleSize: 12,
        titleTransform: 'uppercase',
        titleBackground: 'rgba(245, 245, 245, 0.95)',
        titleBackgroundPattern: 'grid',
        titleColor: '#1a5fb4',
        frameStyle: 'solid',
        framePattern: 'grid',
        frameColor: '#4a90e2',
        frameWidth: 2,
        scalePosition: 'bottom-right',
        attributionPosition: 'bottom-right',
        scaleFont: 'monospace'
    },
    // New layouts - Phase 2: Medium complexity
    'gallery-print': {
        name: 'Gallery Print',
        titlePosition: 'bottom-right',
        titleFont: "'Inter', -apple-system, sans-serif",
        titleSize: 18,
        subtitleSize: 12,
        titleBackground: 'transparent',
        titleColor: 'rgba(45, 52, 54, 0.9)',
        titleShadow: '0 1px 3px rgba(255,255,255,0.8)',
        frameStyle: 'none',
        frameColor: 'transparent',
        frameWidth: 0,
        scalePosition: 'bottom-left',
        attributionPosition: 'bottom-left'
    },
    'vintage-map': {
        name: 'Vintage Map',
        titlePosition: 'top-center',
        titleFont: "'Times New Roman', 'Georgia', serif",
        titleSize: 28,
        subtitleSize: 14,
        titleStyle: 'italic',
        titleBackground: 'rgba(212, 196, 168, 0.92)',
        titleColor: '#5c4033',
        titleUnderline: true,
        frameStyle: 'double',
        frameColor: '#8b7355',
        frameWidth: 4,
        scalePosition: 'bottom-center',
        attributionPosition: 'bottom-center',
        scaleFont: 'serif'
    },
    artistic: {
        name: 'Artistic',
        titlePosition: 'diagonal',
        titleFont: "'Inter', sans-serif",
        titleSize: 26,
        subtitleSize: 14,
        titleStyle: 'italic',
        titleFontWeight: 'bold',
        titleBackground: 'rgba(253, 252, 250, 0.75)',
        titleColor: '#4a6fa5',
        frameStyle: 'none',
        frameColor: 'transparent',
        frameWidth: 0,
        scalePosition: 'top-right',
        attributionPosition: 'top-right'
    },
    // New layouts - Phase 3: Advanced
    'night-mode': {
        name: 'Night Mode',
        titlePosition: 'top-right',
        titleFont: "'Inter', sans-serif",
        titleSize: 22,
        subtitleSize: 13,
        titleFontWeight: 'bold',
        titleBackground: 'rgba(18, 18, 18, 0.85)',
        titleColor: '#00ffff',
        titleShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
        frameStyle: 'solid',
        frameColor: '#4a6580',
        frameWidth: 2,
        frameGlow: '0 0 10px rgba(0, 255, 255, 0.5), 0 0 20px rgba(0, 255, 255, 0.3)',
        scalePosition: 'bottom-left',
        attributionPosition: 'bottom-left'
    },
    heritage: {
        name: 'Heritage',
        titlePosition: 'top-center',
        titleFont: "'Garamond', 'Baskerville', serif",
        titleSize: 24,
        subtitleSize: 13,
        titleBackground: 'rgba(253, 251, 248, 0.95)',
        titleColor: '#5c4033',
        frameStyle: 'double',
        frameColor: '#8b7355',
        frameWidth: 4,
        scalePosition: 'bottom-center',
        attributionPosition: 'bottom-center',
        scaleFont: 'serif'
    },
    prestige: {
        name: 'Prestige',
        titlePosition: 'top-center',
        titleFont: "'Playfair Display', serif",
        titleSize: 32,
        subtitleSize: 14,
        titleFontWeight: 'bold',
        titleBanner: true,
        titleBackground: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
        titleColor: '#1a1a1a',
        frameStyle: 'double',
        frameColor: '#d4af37',
        frameWidth: 5,
        scalePosition: 'bottom-center',
        attributionPosition: 'bottom-center'
    },
    cyberpunk: {
        name: 'Cyberpunk',
        titlePosition: 'top-center',
        titleFont: "'Orbitron', 'Rajdhani', sans-serif",
        titleSize: 30,
        subtitleSize: 14,
        titleFontWeight: 'bold',
        titleTransform: 'uppercase',
        titleBackground: 'rgba(13, 2, 33, 0.9)',
        titleColor: '#ff00ff',
        titleShadow: '0 0 10px rgba(255, 0, 255, 0.8), 0 0 20px rgba(255, 0, 255, 0.6)',
        frameStyle: 'solid',
        frameColor: '#00ffff',
        frameWidth: 3,
        frameGlow: '0 0 5px rgba(255, 0, 255, 0.8), 0 0 10px rgba(255, 0, 255, 0.6), 0 0 15px rgba(0, 255, 255, 0.4)',
        scalePosition: 'bottom-right',
        attributionPosition: 'bottom-right',
        scaleFont: 'monospace'
    }
};

let currentLayoutTemplate = 'classic';

/**
 * Helper functions for layout rendering
 */

/**
 * Generate CSS for frame style with optional patterns and glow
 */
function getFrameStyleCSS(template) {
    let css = '';
    
    // Handle double frame style specially (uses outline for inner border)
    if (template.frameStyle === 'double') {
        const outerWidth = template.frameWidth || 4;
        css = `border: ${outerWidth}px solid ${template.frameColor};`;
        // CSS variable for double frame inner color (set via style attribute)
        css += ` --frame-inner-color: ${template.frameColor};`;
    } else if (template.frameStyle === 'none') {
        css = `border: none;`;
    } else {
        css = `border: ${template.frameWidth}px ${template.frameStyle} ${template.frameColor};`;
    }
    
    return css;
}

/**
 * Get grid pattern background CSS (for Blueprint layout)
 */
function getGridPatternBackground() {
    return `background-image:
        linear-gradient(rgba(74, 144, 226, 0.15) 1px, transparent 1px),
        linear-gradient(90deg, rgba(74, 144, 226, 0.15) 1px, transparent 1px);
    background-size: 20px 20px;`;
}

/**
 * Get title container CSS based on position
 */
function getTitleContainerCSS(template) {
    const baseCSS = {
        position: 'absolute',
        padding: '14px 20px'
    };
    
    switch(template.titlePosition) {
        case 'top-left':
            return { ...baseCSS, top: 0, left: 0, textAlign: 'left' };
        case 'top-right':
            return { ...baseCSS, top: 0, right: 0, textAlign: 'right' };
        case 'bottom-right':
            return { ...baseCSS, bottom: 0, right: 0, textAlign: 'right', padding: '20px' };
        case 'bottom-center':
            return { ...baseCSS, bottom: 0, left: 0, right: 0, textAlign: 'center' };
        case 'diagonal':
            return { ...baseCSS, bottom: '20%', left: '5%', transform: 'rotate(-3deg)', transformOrigin: 'left bottom' };
        default:
            return baseCSS;
    }
}

// DOM Elements
const elements = {
    presetSelect: document.getElementById('preset-select'),
    bboxWest: document.getElementById('bbox-west'),
    bboxSouth: document.getElementById('bbox-south'),
    bboxEast: document.getElementById('bbox-east'),
    bboxNorth: document.getElementById('bbox-north'),
    drawBboxBtn: document.getElementById('draw-bbox-btn'),
    resetBboxBtn: document.getElementById('reset-bbox-btn'),
    titleInput: document.getElementById('title-input'),
    subtitleInput: document.getElementById('subtitle-input'),
    themeSelect: document.getElementById('theme-select'),
    paperSizeSelect: document.getElementById('paper-size-select'),
    customSizeRow: document.getElementById('custom-size-row'),
    widthInput: document.getElementById('width-input'),
    heightInput: document.getElementById('height-input'),
    dpiSelect: document.getElementById('dpi-select'),
    exportBtn: document.getElementById('export-btn'),
    previewBtn: document.getElementById('preview-btn'),
    closePreviewBtn: document.getElementById('close-preview-btn'),
    outputSize: document.getElementById('output-size'),
    scaleDisplay: document.getElementById('scale-display'),
    fileSize: document.getElementById('file-size'),
    statusDot: document.getElementById('status-dot'),
    statusText: document.getElementById('status-text'),
    zoomLevel: document.getElementById('zoom-level'),
    exportModal: document.getElementById('export-modal'),
    progressFill: document.getElementById('progress-fill'),
    modalStatus: document.getElementById('modal-status'),
    showScale: document.getElementById('show-scale'),
    showAttribution: document.getElementById('show-attribution'),
    // Export Preset UI (Phase 9.2)
    exportPresetSelect: document.getElementById('export-preset-select'),
    exportPresetDescription: document.getElementById('export-preset-description'),
    exportPresetStatus: document.getElementById('export-preset-status'),
    validationErrors: document.getElementById('validation-errors'),
    // Field groups for locking
    presetGroup: document.getElementById('bbox-preset-group'),
    themeGroup: document.getElementById('theme-group'),
    layersGroup: document.getElementById('layers-group'),
    dpiGroup: document.getElementById('dpi-group'),
    paperSizeGroup: document.getElementById('paper-size-group'),
    orientationGroup: document.getElementById('orientation-group'),
    formatGroup: document.getElementById('format-group')
};

// Layer checkboxes
const layerCheckboxes = {
    hillshade: document.getElementById('layer-hillshade'),
    water: document.getElementById('layer-water'),
    parks: document.getElementById('layer-parks'),
    roads: document.getElementById('layer-roads'),
    buildings: document.getElementById('layer-buildings'),
    contours: document.getElementById('layer-contours')
};

/**
 * Load theme from server
 */
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

/**
 * Update map style with current theme
 */
async function updateMapStyle() {
    console.log('[updateMapStyle] Called, map:', !!map, 'currentTheme:', !!currentTheme);

    if (!map || !currentTheme) {
        console.log('[updateMapStyle] Early return: map=', !!map, 'currentTheme=', !!currentTheme);
        return;
    }

    if (styleChangeInProgress) {
        console.log('[updateMapStyle] Style change already in progress, queuing');
        debug('Style change already in progress, queuing');
        pendingStyleChange = true;
        return;
    }
    pendingStyleChange = false;

    console.log('[updateMapStyle] Starting style change');
    styleChangeInProgress = true;

    const savedViewState = {
        center: map.getCenter(),
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch()
    };
    debug('Saving view state:', savedViewState);

    try {
        const [config, coverage] = await Promise.all([
            fetch('/api/config').then(r => r.json()),
            fetch(`/api/coverage/${currentPreset}`).then(r => r.json()).catch(() => null)
        ]);

        window.currentCoverage = coverage || { osm: true, contours: false, hillshade: false };

        if (typeof window.themeToMapLibreStyle === 'function') {
            const style = window.themeToMapLibreStyle(
                currentTheme,
                config.tileserverUrl,
                config.hillshadeTilesUrl,
                currentPreset,
                'screen',
                window.currentCoverage
            );

            // Force MapLibre to update by adding a unique metadata field
            // This ensures MapLibre sees it as a different style object
            if (!style.metadata) {
                style.metadata = {};
            }
            style.metadata['theme-update-timestamp'] = Date.now();

            // Remove any existing style.load listeners to avoid conflicts
            map.off('style.load');

            // If style.load doesn't fire within 2 seconds, manually trigger the update
            // This can happen if MapLibre determines the style hasn't changed
            let styleLoadTimeout;
            const performStyleUpdate = () => {
                console.log('[updateMapStyle] Performing style update');
                map.jumpTo({
                    center: savedViewState.center,
                    zoom: savedViewState.zoom,
                    bearing: savedViewState.bearing,
                    pitch: savedViewState.pitch
                });
                updateLayerVisibility();
                updateLayerCheckboxStates();
                styleChangeInProgress = false;

                // Update print composition if in preview mode
                // Use a small delay to ensure map has fully rendered
                if (isPreviewMode) {
                    setTimeout(() => {
                        updatePrintComposition();
                    }, 50);
                }

                // Check if there's a pending style change and apply it
                if (pendingStyleChange) {
                    console.log('[updateMapStyle] Applying pending style change');
                    setTimeout(() => updateMapStyle(), 50);
                }
            };

            // Use 'on' instead of 'once' to ensure it fires, but remove it after first call
            const styleLoadHandler = () => {
                console.log('[updateMapStyle] style.load event fired');
                clearTimeout(styleLoadTimeout);
                debug('Style loaded, restoring view state');
                performStyleUpdate();

                // Remove listener after handling
                map.off('style.load', styleLoadHandler);
            };

            map.on('style.load', styleLoadHandler);

            console.log('[updateMapStyle] Calling map.setStyle()');
            console.log('[updateMapStyle] Style object keys:', Object.keys(style));
            console.log('[updateMapStyle] Current map style loaded:', map.isStyleLoaded());

            // Force style update - MapLibre might not trigger style.load if style is too similar
            // So we need to ensure the style actually changes
            map.setStyle(style);

            // Fallback: if style.load doesn't fire within 2 seconds, manually trigger the update
            // This is needed because MapLibre might not trigger style.load if it determines
            // the style hasn't changed significantly, but we still need to update the map
            styleLoadTimeout = setTimeout(() => {
                console.warn('[updateMapStyle] style.load event did not fire within 2s, manually updating');
                if (map.isStyleLoaded()) {
                    // Force map to update by triggering a repaint
                    map.triggerRepaint();
                    performStyleUpdate();
                    map.off('style.load', styleLoadHandler);
                } else {
                    console.warn('[updateMapStyle] Map style not loaded yet, waiting...');
                    // Wait a bit more and try again
                    setTimeout(() => {
                        if (map.isStyleLoaded()) {
                            map.triggerRepaint();
                            performStyleUpdate();
                            map.off('style.load', styleLoadHandler);
                        }
                    }, 1000);
                }
            }, 2000);
        } else {
            styleChangeInProgress = false;
        }
    } catch (error) {
        console.error('Error updating map style:', error);
        styleChangeInProgress = false;
    }
}

/**
 * Update layer visibility based on checkboxes
 */
function updateLayerVisibility() {
    if (!map || !map.isStyleLoaded()) return;

    const visibility = (layer) => layerCheckboxes[layer]?.checked ? 'visible' : 'none';

    if (map.getLayer('hillshade')) {
        map.setLayoutProperty('hillshade', 'visibility', visibility('hillshade'));
    }

    ['water', 'water-outline'].forEach(id => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visibility('water'));
    });

    ['parks', 'parks-outline', 'landcover'].forEach(id => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visibility('parks'));
    });

    ['roads-minor', 'roads-major'].forEach(id => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visibility('roads'));
    });

    ['buildings', 'buildings-outline'].forEach(id => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visibility('buildings'));
    });

    ['contours-2m', 'contours-10m', 'contours-50m'].forEach(id => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visibility('contours'));
    });
}

/**
 * Update layer checkbox states based on coverage
 */
function updateLayerCheckboxStates() {
    const coverage = window.currentCoverage || {};

    const hillshadeItem = layerCheckboxes.hillshade?.closest('.checkbox-item');
    if (hillshadeItem) {
        if (!coverage.hillshade) {
            hillshadeItem.classList.add('disabled');
            layerCheckboxes.hillshade.disabled = true;
        } else {
            hillshadeItem.classList.remove('disabled');
            layerCheckboxes.hillshade.disabled = false;
        }
    }

    const contoursItem = layerCheckboxes.contours?.closest('.checkbox-item');
    if (contoursItem) {
        if (!coverage.contours) {
            contoursItem.classList.add('disabled');
            layerCheckboxes.contours.disabled = true;
        } else {
            contoursItem.classList.remove('disabled');
            layerCheckboxes.contours.disabled = false;
        }
    }
}

/**
 * Update bbox display
 */
function updateBboxDisplay(bbox) {
    if (!bbox) {
        elements.bboxWest.textContent = '-';
        elements.bboxSouth.textContent = '-';
        elements.bboxEast.textContent = '-';
        elements.bboxNorth.textContent = '-';
        return;
    }

    elements.bboxWest.textContent = bbox.west.toFixed(4);
    elements.bboxSouth.textContent = bbox.south.toFixed(4);
    elements.bboxEast.textContent = bbox.east.toFixed(4);
    elements.bboxNorth.textContent = bbox.north.toFixed(4);
}

/**
 * Calculate output dimensions
 */
function calculateOutputSize() {
    const paperSize = elements.paperSizeSelect.value;
    const dpi = parseInt(elements.dpiSelect.value);

    let widthMm, heightMm;

    if (paperSize === 'custom') {
        widthMm = parseInt(elements.widthInput.value) || 420;
        heightMm = parseInt(elements.heightInput.value) || 594;
    } else {
        const size = PAPER_SIZES[paperSize];
        widthMm = size.width;
        heightMm = size.height;
    }

    if (currentOrientation === 'landscape') {
        [widthMm, heightMm] = [heightMm, widthMm];
    }

    const widthPx = Math.round(widthMm * dpi / 25.4);
    const heightPx = Math.round(heightMm * dpi / 25.4);

    return { widthMm, heightMm, widthPx, heightPx, dpi };
}

/**
 * Calculate map scale
 */
function calculateScale() {
    if (!currentBbox) return 'N/A';

    const output = calculateOutputSize();
    const bboxWidth = currentBbox.east - currentBbox.west;

    const lat = (currentBbox.north + currentBbox.south) / 2;
    const metersPerDegree = 111320 * Math.cos(lat * Math.PI / 180);
    const bboxWidthMeters = bboxWidth * metersPerDegree;

    const paperWidthMeters = output.widthMm / 1000;
    const scale = Math.round(bboxWidthMeters / paperWidthMeters);

    if (scale >= 1000000) {
        return `1:${(scale / 1000000).toFixed(1)}M`;
    } else if (scale >= 1000) {
        return `1:${Math.round(scale / 1000)}K`;
    } else {
        return `1:${scale}`;
    }
}

/**
 * Estimate file size
 */
function estimateFileSize() {
    const output = calculateOutputSize();
    const pixels = output.widthPx * output.heightPx;

    let sizeBytes;
    switch (currentFormat) {
        case 'png':
            sizeBytes = pixels * 1.5;
            break;
        case 'pdf':
            sizeBytes = pixels * 0.5;
            break;
        case 'svg':
            sizeBytes = pixels * 0.1;
            break;
        default:
            sizeBytes = pixels * 1.5;
    }

    if (sizeBytes >= 1024 * 1024) {
        return `~${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
    } else {
        return `~${Math.round(sizeBytes / 1024)} KB`;
    }
}

/**
 * Update preview info display
 */
function updatePreviewInfo() {
    const output = calculateOutputSize();
    elements.outputSize.textContent = `${output.widthPx} x ${output.heightPx} px`;
    elements.scaleDisplay.textContent = calculateScale();
    elements.fileSize.textContent = estimateFileSize();

    // Update composition if visible
    if (isPreviewMode) {
        updatePrintComposition();
    }
}

/**
 * Set up MapLibre Draw for bbox drawing
 */
function setupDraw() {
    draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {},
        defaultMode: 'simple_select',
        styles: [
            {
                id: 'gl-draw-polygon-fill',
                type: 'fill',
                filter: ['all', ['==', '$type', 'Polygon']],
                paint: {
                    'fill-color': '#4a6fa5',
                    'fill-opacity': 0.1
                }
            },
            {
                id: 'gl-draw-polygon-stroke',
                type: 'line',
                filter: ['all', ['==', '$type', 'Polygon']],
                paint: {
                    'line-color': '#4a6fa5',
                    'line-width': 2,
                    'line-dasharray': [3, 3]
                }
            },
            {
                id: 'gl-draw-point',
                type: 'circle',
                filter: ['all', ['==', '$type', 'Point']],
                paint: {
                    'circle-radius': 5,
                    'circle-color': '#4a6fa5'
                }
            }
        ]
    });

    map.addControl(draw);

    map.on('draw.create', handleDrawCreate);
    map.on('draw.update', handleDrawUpdate);
    map.on('draw.delete', handleDrawDelete);
}

function handleDrawCreate(e) {
    const feature = e.features[0];
    if (feature && feature.geometry.type === 'Polygon') {
        const coords = feature.geometry.coordinates[0];
        updateBboxFromCoords(coords);
    }
    exitDrawMode();
}

function handleDrawUpdate(e) {
    const feature = e.features[0];
    if (feature && feature.geometry.type === 'Polygon') {
        const coords = feature.geometry.coordinates[0];
        updateBboxFromCoords(coords);
    }
}

function handleDrawDelete() {
    currentBbox = PRESET_BBOXES[currentPreset];
    updateBboxDisplay(currentBbox);
    updatePreviewInfo();
}

function updateBboxFromCoords(coords) {
    if (coords.length < 4) return;

    let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;

    coords.forEach(([lng, lat]) => {
        west = Math.min(west, lng);
        east = Math.max(east, lng);
        south = Math.min(south, lat);
        north = Math.max(north, lat);
    });

    currentBbox = { west, south, east, north };
    updateBboxDisplay(currentBbox);
    updatePreviewInfo();

    elements.presetSelect.value = 'custom';
    setStatus('Custom bbox selected', 'success');
}

function enterDrawMode() {
    isDrawingMode = true;
    elements.drawBboxBtn.classList.add('active');
    elements.drawBboxBtn.textContent = 'Drawing...';

    draw.deleteAll();
    draw.changeMode('draw_polygon');

    setStatus('Click to draw bbox corners, double-click to finish', 'warning');
}

function exitDrawMode() {
    isDrawingMode = false;
    elements.drawBboxBtn.classList.remove('active');
    elements.drawBboxBtn.textContent = 'Draw Bbox';
    setStatus('Ready', 'success');
}

function resetBbox() {
    if (currentPreset !== 'custom') {
        currentBbox = PRESET_BBOXES[currentPreset];
        updateBboxDisplay(currentBbox);
        updatePreviewInfo();

        if (draw) {
            draw.deleteAll();
        }

        fitMapToBbox();
    }
}

function fitMapToBbox() {
    if (!map || !currentBbox) return;

    map.fitBounds([
        [currentBbox.west, currentBbox.south],
        [currentBbox.east, currentBbox.north]
    ], { padding: 50 });
}

function setStatus(message, type = 'success') {
    elements.statusText.textContent = message;
    elements.statusDot.className = 'status-dot';

    if (type === 'warning') {
        elements.statusDot.classList.add('warning');
    } else if (type === 'error') {
        elements.statusDot.classList.add('error');
    }
}

function getLayerSettings() {
    return {
        hillshade: layerCheckboxes.hillshade?.checked ?? true,
        water: layerCheckboxes.water?.checked ?? true,
        parks: layerCheckboxes.parks?.checked ?? true,
        roads: layerCheckboxes.roads?.checked ?? true,
        buildings: layerCheckboxes.buildings?.checked ?? true,
        contours: layerCheckboxes.contours?.checked ?? true
    };
}

/**
 * Enter preview mode (fullscreen map)
 */
function enterPreviewMode() {
    isPreviewMode = true;
    document.body.classList.add('preview-mode');

    // Resize map after layout change
    setTimeout(() => {
        map.resize();
        // Don't fit to bbox - preserve user's current viewport position
        updatePrintComposition();
    }, 100);

    setStatus('Preview mode - Press ESC to exit', 'success');
}

/**
 * Exit preview mode
 */
function exitPreviewMode() {
    isPreviewMode = false;
    document.body.classList.remove('preview-mode');
    hidePrintComposition();

    // Resize map after layout change
    setTimeout(() => {
        map.resize();
    }, 100);

    setStatus('Ready', 'success');
}

/**
 * Create or update the print composition overlay
 */
function updatePrintComposition() {
    const mapContainer = document.getElementById('map-container');
    const template = LAYOUT_TEMPLATES[currentLayoutTemplate] || LAYOUT_TEMPLATES.classic;

    // Remove existing elements
    ['print-composition', 'print-mask-top', 'print-mask-bottom', 'print-mask-left', 'print-mask-right'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });

    // Calculate dimensions
    const output = calculateOutputSize();
    const aspectRatio = output.widthMm / output.heightMm;

    const containerRect = mapContainer.getBoundingClientRect();
    const maxWidth = containerRect.width * 0.85;
    const maxHeight = containerRect.height * 0.85;

    let overlayWidth, overlayHeight;
    if (maxWidth / maxHeight > aspectRatio) {
        overlayHeight = maxHeight;
        overlayWidth = overlayHeight * aspectRatio;
    } else {
        overlayWidth = maxWidth;
        overlayHeight = overlayWidth / aspectRatio;
    }

    const left = (containerRect.width - overlayWidth) / 2;
    const top = (containerRect.height - overlayHeight) / 2;

    // Create masks
    const maskColor = 'rgba(245, 245, 245, 0.7)';
    const maskStyle = `position: absolute; background: ${maskColor}; pointer-events: none; z-index: 10; backdrop-filter: blur(2px);`;

    const topMask = document.createElement('div');
    topMask.id = 'print-mask-top';
    topMask.style.cssText = `${maskStyle} top: 0; left: 0; right: 0; height: ${top}px;`;
    mapContainer.appendChild(topMask);

    const bottomMask = document.createElement('div');
    bottomMask.id = 'print-mask-bottom';
    bottomMask.style.cssText = `${maskStyle} bottom: 0; left: 0; right: 0; height: ${containerRect.height - top - overlayHeight}px;`;
    mapContainer.appendChild(bottomMask);

    const leftMask = document.createElement('div');
    leftMask.id = 'print-mask-left';
    leftMask.style.cssText = `${maskStyle} top: ${top}px; left: 0; width: ${left}px; height: ${overlayHeight}px;`;
    mapContainer.appendChild(leftMask);

    const rightMask = document.createElement('div');
    rightMask.id = 'print-mask-right';
    rightMask.style.cssText = `${maskStyle} top: ${top}px; right: 0; width: ${containerRect.width - left - overlayWidth}px; height: ${overlayHeight}px;`;
    mapContainer.appendChild(rightMask);

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'print-composition';
    
    // Build frame CSS with helper function
    let frameCSS = getFrameStyleCSS(template);
    
    // Add double frame class if needed
    if (template.frameStyle === 'double') {
        overlay.classList.add('frame-double');
        // Set CSS variable for inner border color
        overlay.style.setProperty('--frame-inner-color', template.frameColor);
    }
    
    // Add grid pattern class if specified
    if (template.framePattern === 'grid') {
        overlay.classList.add('frame-grid-pattern');
    }
    
    // Add glow effect classes if specified
    if (template.frameGlow) {
        // Check if it's a neon/cyan glow
        if (template.frameGlow.includes('255, 0, 255') || template.frameGlow.includes('ff00ff')) {
            overlay.classList.add('frame-glow-neon');
        } else if (template.frameGlow.includes('0, 255, 255') || template.frameGlow.includes('00ffff')) {
            overlay.classList.add('frame-glow-cyan');
        } else {
            // Custom glow - add as inline style
            frameCSS += ` box-shadow: ${template.frameGlow};`;
        }
    }
    
    // Build overlay CSS
    let overlayCSS = `
        position: absolute;
        top: ${top}px;
        left: ${left}px;
        width: ${overlayWidth}px;
        height: ${overlayHeight}px;
        pointer-events: none;
        z-index: 15;
        box-sizing: border-box;
        ${frameCSS}
    `;
    
    // Add standard shadow (unless frame has custom glow)
    if (!template.frameGlow) {
        overlayCSS += `box-shadow: 0 4px 24px rgba(0,0,0,0.15);`;
    }
    
    overlay.style.cssText = overlayCSS;

    const title = elements.titleInput.value;
    const subtitle = elements.subtitleInput.value;
    const showScale = elements.showScale?.checked ?? true;
    const showAttribution = elements.showAttribution?.checked ?? true;

    // Add title based on template
    if (template.titlePosition !== 'none' && (title || subtitle)) {
        const titleContainer = document.createElement('div');

        // Handle all title positions
        if (template.titlePosition === 'top-center') {
            titleContainer.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                padding: 14px 20px;
                background: ${template.titleBackground};
                text-align: center;
            `;
        } else if (template.titlePosition === 'top-left') {
            titleContainer.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                padding: 14px 20px;
                background: ${template.titleBackground};
                text-align: left;
                ${template.titleBackgroundPattern === 'grid' ? getGridPatternBackground() : ''}
            `;
        } else if (template.titlePosition === 'top-right') {
            titleContainer.style.cssText = `
                position: absolute;
                top: 0;
                right: 0;
                padding: 14px 20px;
                background: ${template.titleBackground};
                text-align: right;
            `;
        } else if (template.titlePosition === 'bottom-left') {
            titleContainer.style.cssText = `
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                padding: 24px 20px 16px;
                background: ${template.titleBackground};
            `;
        } else if (template.titlePosition === 'bottom-right') {
            titleContainer.style.cssText = `
                position: absolute;
                bottom: 0;
                right: 0;
                padding: 20px;
                background: ${template.titleBackground};
                text-align: right;
            `;
        } else if (template.titlePosition === 'bottom-center') {
            titleContainer.style.cssText = `
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                padding: 14px 20px;
                background: ${template.titleBackground};
                text-align: center;
            `;
        } else if (template.titlePosition === 'center-overlay') {
            titleContainer.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                padding: 24px;
            `;
        } else if (template.titlePosition === 'diagonal') {
            titleContainer.style.cssText = `
                position: absolute;
                bottom: 20%;
                left: 5%;
                padding: 16px 24px;
                background: ${template.titleBackground};
                transform: rotate(-3deg);
                transform-origin: left bottom;
                border-radius: 4px;
            `;
        }
        
        // Add banner class for Prestige layout
        if (template.titleBanner) {
            titleContainer.classList.add('title-banner');
        }

        if (title) {
            const titleEl = document.createElement('div');
            let titleStyle = `
                font-family: ${template.titleFont};
                font-size: ${template.titleSize}px;
                font-weight: ${template.titleFontWeight || '600'};
                color: ${template.titleColor || '#2d3436'};
                ${template.titleShadow ? `text-shadow: ${template.titleShadow};` : ''}
                letter-spacing: 0.5px;
            `;
            
            // Add text transform if specified
            if (template.titleTransform) {
                titleStyle += `text-transform: ${template.titleTransform};`;
            }
            
            // Add italic style if specified
            if (template.titleStyle === 'italic') {
                titleStyle += `font-style: italic;`;
            }
            
            titleEl.style.cssText = titleStyle;
            titleEl.textContent = title;
            
            // Add underline wrapper if needed
            if (template.titleUnderline) {
                titleEl.classList.add('title-underline');
            }
            
            titleContainer.appendChild(titleEl);
        }

        if (subtitle) {
            const subtitleEl = document.createElement('div');
            // Determine subtitle color - use titleColor if it's a light color (for dark backgrounds), otherwise use a muted version
            let subtitleColor = '#636e72'; // Default muted gray
            if (template.titleColor) {
                // If title color is bright (like white, cyan, magenta), use a muted version for subtitle
                if (template.titleColor.includes('255') || template.titleColor.includes('#fff') || template.titleColor.includes('#00ffff') || template.titleColor.includes('#ff00ff')) {
                    subtitleColor = template.titleColor.replace('1)', '0.75)').replace('ff)', 'c0)');
                } else {
                    // For dark colors, use a slightly lighter/muted version
                    subtitleColor = template.titleColor.includes('rgba') 
                        ? template.titleColor.replace(/,\s*[0-9.]+\)/, ', 0.7)')
                        : '#636e72';
                }
            }
            
            subtitleEl.style.cssText = `
                font-family: ${template.titleFont};
                font-size: ${template.subtitleSize}px;
                color: ${subtitleColor};
                ${template.titleShadow ? `text-shadow: ${template.titleShadow};` : ''}
                margin-top: 4px;
                font-weight: 400;
            `;
            subtitleEl.textContent = subtitle;
            titleContainer.appendChild(subtitleEl);
        }

        overlay.appendChild(titleContainer);
    }

    // Footer with scale and attribution
    // Handle different positions based on template
    const scalePos = template.scalePosition || 'bottom-left';
    const attrPos = template.attributionPosition || (scalePos === 'bottom-left' ? 'bottom-right' : 'bottom-left');
    
    // Only show if not 'none'
    if (showScale && scalePos !== 'none') {
        const scaleEl = document.createElement('div');
        const scaleFont = template.scaleFont === 'monospace' 
            ? "'Courier Prime', 'Courier New', monospace"
            : template.scaleFont === 'serif'
            ? "'Times New Roman', serif"
            : "'Inter', system-ui, sans-serif";
            
        let scaleCSS = `
            position: absolute;
            background: rgba(255,255,255,0.88);
            padding: 5px 10px;
            border-radius: 3px;
            color: #2d3436;
            font-family: ${scaleFont};
            font-size: 11px;
            font-weight: 500;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            pointer-events: none;
        `;
        
        // Position scale element
        if (scalePos === 'bottom-left' || scalePos === 'bottom-center') {
            const bottomOffset = (template.titlePosition === 'bottom-left' || template.titlePosition === 'bottom-right' || template.titlePosition === 'bottom-center') ? 60 : 10;
            scaleCSS += `bottom: ${bottomOffset}px;`;
            if (scalePos === 'bottom-left') {
                scaleCSS += `left: 12px;`;
            } else {
                scaleCSS += `left: 50%; transform: translateX(-50%);`;
            }
        } else if (scalePos === 'bottom-right') {
            const bottomOffset = (template.titlePosition === 'bottom-right' || template.titlePosition === 'bottom-center') ? 60 : 10;
            scaleCSS += `bottom: ${bottomOffset}px; right: 12px;`;
        } else if (scalePos === 'top-left') {
            scaleCSS += `top: 12px; left: 12px;`;
        } else if (scalePos === 'top-right') {
            scaleCSS += `top: 12px; right: 12px;`;
        }
        
        scaleEl.style.cssText = scaleCSS;
        scaleEl.textContent = calculateScale();
        overlay.appendChild(scaleEl);
    }
    
    // Attribution
    if (showAttribution && attrPos !== 'none') {
        const attrEl = document.createElement('div');
        const attrFont = template.scaleFont === 'monospace' 
            ? "'Courier Prime', 'Courier New', monospace"
            : template.scaleFont === 'serif'
            ? "'Times New Roman', serif"
            : "'Inter', system-ui, sans-serif";
            
        let attrCSS = `
            position: absolute;
            padding: 4px 8px;
            color: rgba(99, 110, 114, 0.6);
            font-family: ${attrFont};
            font-size: 9px;
            pointer-events: none;
            letter-spacing: 0.2px;
        `;
        
        // Position attribution element (don't overlap with title)
        if (attrPos === 'bottom-left' && template.titlePosition !== 'bottom-left') {
            const bottomOffset = template.titlePosition === 'bottom-right' || template.titlePosition === 'bottom-center' ? 60 : 10;
            attrCSS += `bottom: ${bottomOffset}px; left: 12px; text-align: left;`;
        } else if (attrPos === 'bottom-right' && template.titlePosition !== 'bottom-right') {
            const bottomOffset = template.titlePosition === 'bottom-left' || template.titlePosition === 'bottom-center' ? 60 : 10;
            attrCSS += `bottom: ${bottomOffset}px; right: 12px; text-align: right; max-width: 45%;`;
        } else if (attrPos === 'bottom-center') {
            const bottomOffset = template.titlePosition === 'bottom-center' ? 60 : 10;
            attrCSS += `bottom: ${bottomOffset}px; left: 50%; transform: translateX(-50%); text-align: center;`;
        } else if (attrPos === 'top-right') {
            attrCSS += `top: 12px; right: 12px; text-align: right; max-width: 45%;`;
        } else if (attrPos === 'top-left') {
            attrCSS += `top: 12px; left: 12px; text-align: left;`;
        }
        
        attrEl.style.cssText = attrCSS;
        attrEl.textContent = 'OSM contributors';
        overlay.appendChild(attrEl);
    }

    // Paper info badge (only in preview mode)
    if (isPreviewMode) {
        const paperLabel = document.createElement('div');
        const paperSize = elements.paperSizeSelect.value;
        paperLabel.style.cssText = `
            position: absolute;
            top: -32px;
            left: 0;
            background: #4a6fa5;
            color: #fff;
            padding: 6px 12px;
            font-size: 11px;
            font-family: 'Inter', system-ui, sans-serif;
            border-radius: 4px;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            font-weight: 500;
        `;
        paperLabel.textContent = `${paperSize} ${currentOrientation} · ${output.widthPx}×${output.heightPx}px`;
        overlay.appendChild(paperLabel);
    }

    mapContainer.appendChild(overlay);
}

/**
 * Hide print composition
 */
function hidePrintComposition() {
    ['print-composition', 'print-mask-top', 'print-mask-bottom', 'print-mask-left', 'print-mask-right'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });
}

/**
 * Set layout template
 */
function setLayoutTemplate(templateId) {
    if (LAYOUT_TEMPLATES[templateId]) {
        currentLayoutTemplate = templateId;
        debug('Layout template changed to:', templateId);

        if (isPreviewMode) {
            updatePrintComposition();
        }
    }
}

/**
 * Export map
 */
async function exportMap() {
    if (!currentBbox) {
        setStatus('Please select a bbox first', 'error');
        return;
    }

    debug('Starting export:', { format: currentFormat, preset: currentPreset, bbox: currentBbox });

    // Exit preview mode if active
    if (isPreviewMode) {
        exitPreviewMode();
    }

    elements.exportModal.classList.add('active');
    elements.progressFill.style.width = '0%';
    elements.modalStatus.textContent = 'Preparing export...';

    const output = calculateOutputSize();
    const theme = elements.themeSelect.value;
    const layers = getLayerSettings();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `export_${currentPreset}_${theme}_${output.widthMm}x${output.heightMm}mm_${output.dpi}dpi_${timestamp}.${currentFormat}`;

    try {
        if (currentFormat === 'png') {
            setProgress(20, 'Connecting to exporter...');

            const params = new URLSearchParams({
                bbox_preset: currentPreset === 'custom' ? 'stockholm_core' : currentPreset,
                custom_bbox: currentPreset === 'custom' ? `${currentBbox.west},${currentBbox.south},${currentBbox.east},${currentBbox.north}` : '',
                theme: theme,
                render_mode: 'print',
                dpi: output.dpi,
                width_mm: output.widthMm,
                height_mm: output.heightMm,
                title: elements.titleInput.value || '',
                subtitle: elements.subtitleInput.value || '',
                layers: JSON.stringify(layers),
                // Phase 9.2: include export preset if selected
                export_preset: selectedExportPreset || '',
                // Layout template and composition settings
                layout_template: currentLayoutTemplate || 'classic',
                show_scale: elements.showScale?.checked ? 'true' : 'false',
                show_attribution: elements.showAttribution?.checked ? 'true' : 'false'
            });

            const exportUrl = `http://localhost:8082/render?${params}`;
            debug('PNG export URL:', exportUrl);

            setProgress(40, 'Rendering map...');

            const response = await fetch(exportUrl, {
                method: 'GET',
                mode: 'cors'
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Export failed: ${response.status} - ${errorText}`);
            }

            setProgress(80, 'Processing...');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setProgress(100, 'Complete');
            setStatus(`Exported: ${filename}`, 'success');

            setTimeout(() => {
                elements.exportModal.classList.remove('active');
            }, 1500);

        } else if (currentFormat === 'pdf' || currentFormat === 'svg') {
            setProgress(20, `Preparing ${currentFormat.toUpperCase()}...`);

            const requestBody = {
                bbox_preset: currentPreset === 'custom' ? null : currentPreset,
                custom_bbox: currentPreset === 'custom' ? [currentBbox.west, currentBbox.south, currentBbox.east, currentBbox.north] : null,
                theme: theme,
                render_mode: 'print',
                dpi: output.dpi,
                width_mm: output.widthMm,
                height_mm: output.heightMm,
                format: currentFormat,
                title: elements.titleInput.value || '',
                subtitle: elements.subtitleInput.value || '',
                layers: layers,
                // Phase 9.2: include export preset if selected
                export_preset: selectedExportPreset || null
            };

            setProgress(40, 'Rendering...');

            const response = await fetch('http://localhost:5000/api/render', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                let errorMsg = `HTTP ${response.status}`;
                try {
                    const error = await response.json();
                    errorMsg = error.error || errorMsg;
                } catch (e) {
                    errorMsg = await response.text() || errorMsg;
                }
                throw new Error(errorMsg);
            }

            setProgress(80, 'Downloading...');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setProgress(100, 'Complete');
            setStatus(`Exported: ${filename}`, 'success');

            setTimeout(() => {
                elements.exportModal.classList.remove('active');
            }, 1500);
        }

    } catch (error) {
        console.error('Export error:', error);

        elements.modalStatus.textContent = `Error: ${error.message}`;
        elements.progressFill.style.background = '#d63031';

        setTimeout(() => {
            elements.exportModal.classList.remove('active');
            elements.progressFill.style.background = '';
            setStatus(`Export failed`, 'error');
        }, 3000);
    }
}

function setProgress(percent, message) {
    elements.progressFill.style.width = `${percent}%`;
    elements.modalStatus.textContent = message;
}

// ============================================================================
// Export Preset Functions (Phase 9.2)
// ============================================================================

/**
 * Load export presets from API
 */
async function loadExportPresets() {
    try {
        const response = await fetch('/api/export-presets');
        if (!response.ok) throw new Error('Failed to load export presets');
        const data = await response.json();
        exportPresets = data.presets || [];

        // Populate dropdown
        const select = elements.exportPresetSelect;
        select.innerHTML = '<option value="">None (Custom)</option>';

        exportPresets.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.id;
            option.textContent = preset.display_name;
            if (preset.deprecated) {
                option.textContent += ' (deprecated)';
                option.style.color = '#999';
            }
            select.appendChild(option);
        });

        debug('Loaded export presets:', exportPresets.length);
    } catch (error) {
        console.error('Error loading export presets:', error);
    }
}

/**
 * Load full preset data by ID
 */
async function loadExportPresetData(presetId) {
    try {
        const response = await fetch(`/api/export-presets/${presetId}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.preset;
    } catch (error) {
        console.error('Error loading preset data:', error);
        return null;
    }
}

/**
 * Apply export preset to UI fields
 */
async function applyExportPreset(presetId) {
    if (!presetId) {
        // Clear preset - unlock all fields
        selectedExportPreset = null;
        selectedExportPresetData = null;
        presetModified = false;
        presetOriginalValues = null;

        unlockAllFields();
        updatePresetStatus(null);
        clearValidationErrors();
        return;
    }

    const presetData = await loadExportPresetData(presetId);
    if (!presetData) {
        setStatus('Failed to load preset', 'error');
        return;
    }

    selectedExportPreset = presetId;
    selectedExportPresetData = presetData;
    presetModified = false;

    // Store original values for modification detection
    presetOriginalValues = {
        theme: presetData.theme,
        bbox_preset: presetData.bbox_preset,
        dpi: presetData.render.dpi,
        format: presetData.render.format,
        paper_format: presetData.paper.format,
        orientation: presetData.paper.orientation,
        layers: { ...presetData.layers }
    };

    // Apply values to UI
    await applyPresetValues(presetData);

    // Apply locks based on constraints
    applyPresetLocks(presetData.constraints);

    // Update status
    updatePresetStatus(presetData);

    // Validate preset
    await validatePreset();

    debug('Applied export preset:', presetId);
}

/**
 * Apply preset values to UI fields
 */
async function applyPresetValues(presetData) {
    // Theme
    if (presetData.theme && elements.themeSelect) {
        elements.themeSelect.value = presetData.theme;
        currentTheme = await loadTheme(presetData.theme);
        await updateMapStyle();
    }

    // Bbox preset
    if (presetData.bbox_preset && elements.presetSelect) {
        elements.presetSelect.value = presetData.bbox_preset;
        currentPreset = presetData.bbox_preset;
        currentBbox = PRESET_BBOXES[currentPreset];
        updateBboxDisplay(currentBbox);
        fitMapToBbox();
    }

    // Paper size
    if (presetData.paper && elements.paperSizeSelect) {
        elements.paperSizeSelect.value = presetData.paper.format;

        // Custom size handling
        if (presetData.paper.format === 'custom') {
            elements.customSizeRow.style.display = 'flex';
            elements.widthInput.value = presetData.paper.width_mm;
            elements.heightInput.value = presetData.paper.height_mm;
        } else {
            elements.customSizeRow.style.display = 'none';
        }
    }

    // Orientation
    if (presetData.paper && presetData.paper.orientation) {
        currentOrientation = presetData.paper.orientation;
        if (currentOrientation === 'landscape') {
            document.getElementById('orientation-landscape').classList.add('active');
            document.getElementById('orientation-portrait').classList.remove('active');
        } else {
            document.getElementById('orientation-portrait').classList.add('active');
            document.getElementById('orientation-landscape').classList.remove('active');
        }
    }

    // DPI
    if (presetData.render && presetData.render.dpi && elements.dpiSelect) {
        elements.dpiSelect.value = presetData.render.dpi.toString();
    }

    // Format
    if (presetData.render && presetData.render.format) {
        currentFormat = presetData.render.format;
        document.getElementById('format-png').classList.remove('active');
        document.getElementById('format-pdf').classList.remove('active');
        document.getElementById('format-svg').classList.remove('active');
        document.getElementById(`format-${currentFormat}`).classList.add('active');
    }

    // Layers
    if (presetData.layers) {
        Object.keys(layerCheckboxes).forEach(layer => {
            if (layerCheckboxes[layer] && presetData.layers[layer] !== undefined) {
                layerCheckboxes[layer].checked = presetData.layers[layer];
            }
        });
        updateLayerVisibility();
    }

    // Composition (title, subtitle, etc.)
    if (presetData.composition) {
        if (presetData.composition.title !== null && elements.titleInput) {
            elements.titleInput.value = presetData.composition.title || '';
        }
        if (presetData.composition.subtitle !== null && elements.subtitleInput) {
            elements.subtitleInput.value = presetData.composition.subtitle || '';
        }
        if (presetData.composition.show_scale_bar !== undefined && elements.showScale) {
            elements.showScale.checked = presetData.composition.show_scale_bar;
        }
        if (presetData.composition.show_attribution !== undefined && elements.showAttribution) {
            elements.showAttribution.checked = presetData.composition.show_attribution;
        }
    }

    updatePreviewInfo();
}

/**
 * Apply field locks based on preset constraints
 */
function applyPresetLocks(constraints) {
    // Unlock all first
    unlockAllFields();

    if (!constraints) return;

    // Lock bbox/area if specified
    if (constraints.bbox_locked) {
        lockField('preset-select', elements.presetGroup, 'preset-label');
    }

    // Lock theme if specified
    if (constraints.theme_locked) {
        lockField('theme-select', elements.themeGroup, 'theme-label');
    }

    // Lock layers if specified
    if (constraints.layers_locked) {
        lockLayersField();
    }

    // Lock DPI if specified
    if (constraints.dpi_locked) {
        lockField('dpi-select', elements.dpiGroup, 'dpi-label');
    }

    // Lock format if specified
    if (constraints.format_locked) {
        lockFormatField();
    }

    // Lock paper size (always locked when preset selected)
    lockField('paper-size-select', elements.paperSizeGroup, 'paper-size-label');

    // Lock orientation (always locked when preset selected)
    lockOrientationField();
}

/**
 * Lock a standard field (select/input)
 */
function lockField(selectId, groupEl, labelId) {
    const select = document.getElementById(selectId);
    if (select) {
        select.disabled = true;
    }
    if (groupEl) {
        groupEl.classList.add('locked');
    }
    const lockIndicator = document.querySelector(`#${labelId} .lock-indicator`);
    if (lockIndicator) {
        lockIndicator.classList.add('visible');
        lockIndicator.textContent = '🔒';
    }
}

/**
 * Lock layer checkboxes
 */
function lockLayersField() {
    if (elements.layersGroup) {
        elements.layersGroup.classList.add('locked');
    }
    const lockIndicator = document.querySelector('#layers-label .lock-indicator');
    if (lockIndicator) {
        lockIndicator.classList.add('visible');
        lockIndicator.textContent = '🔒';
    }

    Object.values(layerCheckboxes).forEach(checkbox => {
        if (checkbox) {
            checkbox.disabled = true;
            const item = checkbox.closest('.checkbox-item');
            if (item) item.classList.add('locked');
        }
    });
}

/**
 * Lock format toggle buttons
 */
function lockFormatField() {
    if (elements.formatGroup) {
        elements.formatGroup.classList.add('locked');
    }
    const lockIndicator = document.querySelector('#format-label .lock-indicator');
    if (lockIndicator) {
        lockIndicator.classList.add('visible');
        lockIndicator.textContent = '🔒';
    }
}

/**
 * Lock orientation toggle buttons
 */
function lockOrientationField() {
    if (elements.orientationGroup) {
        elements.orientationGroup.classList.add('locked');
    }
    const lockIndicator = document.querySelector('#orientation-label .lock-indicator');
    if (lockIndicator) {
        lockIndicator.classList.add('visible');
        lockIndicator.textContent = '🔒';
    }
}

/**
 * Unlock all fields
 */
function unlockAllFields() {
    // Unlock selects
    ['preset-select', 'theme-select', 'dpi-select', 'paper-size-select'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = false;
    });

    // Remove locked class from groups
    [elements.presetGroup, elements.themeGroup, elements.layersGroup,
     elements.dpiGroup, elements.paperSizeGroup, elements.orientationGroup,
     elements.formatGroup].forEach(group => {
        if (group) group.classList.remove('locked');
    });

    // Hide lock indicators
    document.querySelectorAll('.lock-indicator').forEach(el => {
        el.classList.remove('visible');
        el.textContent = '';
    });

    // Unlock layer checkboxes (but preserve coverage-based disabling)
    Object.values(layerCheckboxes).forEach(checkbox => {
        if (checkbox) {
            const item = checkbox.closest('.checkbox-item');
            if (item) item.classList.remove('locked');
        }
    });

    // Re-apply coverage-based layer states
    updateLayerCheckboxStates();
}

/**
 * Check if preset has been modified
 */
function checkPresetModified() {
    if (!selectedExportPreset || !presetOriginalValues) {
        return false;
    }

    const constraints = selectedExportPresetData?.constraints || {};

    // Only check unlocked fields
    if (!constraints.theme_locked && elements.themeSelect.value !== presetOriginalValues.theme) {
        return true;
    }
    if (!constraints.bbox_locked && currentPreset !== presetOriginalValues.bbox_preset) {
        return true;
    }
    if (!constraints.dpi_locked && parseInt(elements.dpiSelect.value) !== presetOriginalValues.dpi) {
        return true;
    }
    if (!constraints.format_locked && currentFormat !== presetOriginalValues.format) {
        return true;
    }
    if (!constraints.layers_locked) {
        for (const layer of Object.keys(layerCheckboxes)) {
            if (layerCheckboxes[layer]?.checked !== presetOriginalValues.layers[layer]) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Update preset status display
 */
function updatePresetStatus(presetData) {
    const descEl = elements.exportPresetDescription;
    const statusEl = elements.exportPresetStatus;

    if (!presetData) {
        descEl.classList.remove('visible');
        descEl.textContent = '';
        statusEl.classList.remove('visible', 'active', 'modified');
        statusEl.textContent = '';
        return;
    }

    // Show description
    if (presetData.description) {
        descEl.textContent = presetData.description;
        descEl.classList.add('visible');
    } else {
        descEl.classList.remove('visible');
    }

    // Show status
    statusEl.classList.add('visible');

    if (presetModified) {
        statusEl.classList.remove('active');
        statusEl.classList.add('modified');
        statusEl.textContent = `Preset: ${presetData.display_name} (modified)`;
    } else {
        statusEl.classList.remove('modified');
        statusEl.classList.add('active');
        statusEl.textContent = `Preset: ${presetData.display_name}`;
    }
}

/**
 * Validate preset via API
 */
async function validatePreset() {
    if (!selectedExportPreset) {
        clearValidationErrors();
        return { valid: true };
    }

    // Build overrides from current UI state
    const overrides = {};
    const constraints = selectedExportPresetData?.constraints || {};

    if (!constraints.dpi_locked) {
        overrides.dpi = parseInt(elements.dpiSelect.value);
    }
    if (!constraints.format_locked) {
        overrides.format = currentFormat;
    }
    if (!constraints.layers_locked) {
        overrides.layers = getLayerSettings();
    }
    if (!constraints.theme_locked) {
        overrides.theme = elements.themeSelect.value;
    }
    if (!constraints.bbox_locked) {
        overrides.bbox_preset = currentPreset;
    }

    try {
        const response = await fetch('/api/validate-preset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                preset_id: selectedExportPreset,
                overrides
            })
        });

        const result = await response.json();

        // Display validation results
        displayValidationResults(result);

        return result;
    } catch (error) {
        console.error('Validation error:', error);
        return { valid: false, errors: [{ field: 'server', message: 'Validation request failed' }] };
    }
}

/**
 * Display validation results in UI
 */
function displayValidationResults(result) {
    const container = elements.validationErrors;
    if (!container) return;

    container.innerHTML = '';

    // Show errors
    if (result.errors && result.errors.length > 0) {
        result.errors.forEach(err => {
            const div = document.createElement('div');
            div.className = 'validation-error';
            div.textContent = err.message;
            container.appendChild(div);
        });
    }

    // Show warnings
    if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach(warn => {
            const div = document.createElement('div');
            div.className = 'validation-warning';
            div.textContent = warn.message;
            container.appendChild(div);
        });
    }
}

/**
 * Clear validation errors
 */
function clearValidationErrors() {
    if (elements.validationErrors) {
        elements.validationErrors.innerHTML = '';
    }
}

/**
 * Handle field change for modification detection
 */
function handleFieldChange() {
    if (!selectedExportPreset) return;

    const wasModified = presetModified;
    presetModified = checkPresetModified();

    if (presetModified !== wasModified) {
        updatePresetStatus(selectedExportPresetData);
    }

    // Revalidate on changes
    validatePreset();
}

/**
 * Initialize the editor
 */
async function init() {
    try {
        const [config, themes] = await Promise.all([
            fetch('/api/config').then(r => r.json()),
            fetch('/api/themes').then(r => r.json())
        ]);

        elements.themeSelect.innerHTML = '';
        themes.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.name;
            elements.themeSelect.appendChild(opt);
        });

        currentTheme = await loadTheme('paper');

        // Load export presets (Phase 9.2)
        await loadExportPresets();

        currentBbox = PRESET_BBOXES[currentPreset];
        updateBboxDisplay(currentBbox);

        map = new maplibregl.Map({
            container: 'map',
            style: {
                version: 8,
                sources: {},
                layers: [
                    {
                        id: 'background',
                        type: 'background',
                        paint: { 'background-color': currentTheme?.background || '#fafafa' }
                    }
                ]
            },
            center: PRESET_BBOXES[currentPreset].center,
            zoom: PRESET_BBOXES[currentPreset].zoom
        });

        map.on('load', async () => {
            console.log('Map loaded');
            window.map = map;

            setupDraw();
            await updateMapStyle();
            updatePreviewInfo();
            setStatus('Ready', 'success');
        });

        map.on('zoom', () => {
            elements.zoomLevel.textContent = map.getZoom().toFixed(1);
        });

        setupEventListeners();

    } catch (error) {
        console.error('Initialization error:', error);
        setStatus('Error initializing editor', 'error');
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Export Preset select (Phase 9.2)
    if (elements.exportPresetSelect) {
        elements.exportPresetSelect.addEventListener('change', async (e) => {
            await applyExportPreset(e.target.value);
        });
    }

    // Preset select (bbox area)
    elements.presetSelect.addEventListener('change', async (e) => {
        currentPreset = e.target.value;
        if (currentPreset !== 'custom') {
            currentBbox = PRESET_BBOXES[currentPreset];
            updateBboxDisplay(currentBbox);
            fitMapToBbox();

            if (draw) draw.deleteAll();

            await updateMapStyle();
        } else {
            setStatus('Draw a custom bbox on the map', 'warning');
        }
        updatePreviewInfo();
        handleFieldChange(); // Phase 9.2: modification detection
    });

    // Theme select
    elements.themeSelect.addEventListener('change', async (e) => {
        const themeName = e.target.value;
        console.log('[Theme Change] Theme selected:', themeName);

        currentTheme = await loadTheme(themeName);

        if (!currentTheme) {
            console.error(`Failed to load theme: ${themeName}`);
            setStatus(`Error loading theme: ${themeName}`, 'error');
            return;
        }

        console.log('[Theme Change] Theme loaded, currentTheme:', currentTheme);
        console.log('[Theme Change] Calling updateMapStyle(), styleChangeInProgress:', styleChangeInProgress);

        await updateMapStyle();

        console.log('[Theme Change] updateMapStyle() completed');

        // Update preview composition if in preview mode (even if map style update is pending)
        if (isPreviewMode) {
            console.log('[Theme Change] In preview mode, updating composition');
            // Small delay to ensure map style has started updating
            setTimeout(() => {
                updatePrintComposition();
            }, 100);
        }

        handleFieldChange(); // Phase 9.2: modification detection
    });

    // Layout template select
    const layoutSelect = document.getElementById('layout-select');
    if (layoutSelect) {
        layoutSelect.addEventListener('change', (e) => {
            setLayoutTemplate(e.target.value);
        });
    }

    // Show scale checkbox
    if (elements.showScale) {
        elements.showScale.addEventListener('change', () => {
            if (isPreviewMode) {
                updatePrintComposition();
            }
        });
    }

    // Show attribution checkbox
    if (elements.showAttribution) {
        elements.showAttribution.addEventListener('change', () => {
            if (isPreviewMode) {
                updatePrintComposition();
            }
        });
    }

    // Paper size select
    elements.paperSizeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
            elements.customSizeRow.style.display = 'flex';
        } else {
            elements.customSizeRow.style.display = 'none';
        }
        updatePreviewInfo();
    });

    // Custom size inputs
    elements.widthInput.addEventListener('input', updatePreviewInfo);
    elements.heightInput.addEventListener('input', updatePreviewInfo);

    // DPI select
    elements.dpiSelect.addEventListener('change', () => {
        updatePreviewInfo();
        handleFieldChange(); // Phase 9.2: modification detection
    });

    // Orientation buttons
    document.getElementById('orientation-portrait').addEventListener('click', () => {
        if (elements.orientationGroup?.classList.contains('locked')) return; // Phase 9.2: respect lock
        currentOrientation = 'portrait';
        document.getElementById('orientation-portrait').classList.add('active');
        document.getElementById('orientation-landscape').classList.remove('active');
        updatePreviewInfo();
    });

    document.getElementById('orientation-landscape').addEventListener('click', () => {
        if (elements.orientationGroup?.classList.contains('locked')) return; // Phase 9.2: respect lock
        currentOrientation = 'landscape';
        document.getElementById('orientation-landscape').classList.add('active');
        document.getElementById('orientation-portrait').classList.remove('active');
        updatePreviewInfo();
    });

    // Format buttons
    document.getElementById('format-png').addEventListener('click', () => {
        if (elements.formatGroup?.classList.contains('locked')) return; // Phase 9.2: respect lock
        currentFormat = 'png';
        document.getElementById('format-png').classList.add('active');
        document.getElementById('format-pdf').classList.remove('active');
        document.getElementById('format-svg').classList.remove('active');
        updatePreviewInfo();
        handleFieldChange(); // Phase 9.2: modification detection
    });

    document.getElementById('format-pdf').addEventListener('click', () => {
        if (elements.formatGroup?.classList.contains('locked')) return; // Phase 9.2: respect lock
        currentFormat = 'pdf';
        document.getElementById('format-pdf').classList.add('active');
        document.getElementById('format-png').classList.remove('active');
        document.getElementById('format-svg').classList.remove('active');
        updatePreviewInfo();
        handleFieldChange(); // Phase 9.2: modification detection
    });

    document.getElementById('format-svg').addEventListener('click', () => {
        if (elements.formatGroup?.classList.contains('locked')) return; // Phase 9.2: respect lock
        currentFormat = 'svg';
        document.getElementById('format-svg').classList.add('active');
        document.getElementById('format-png').classList.remove('active');
        document.getElementById('format-pdf').classList.remove('active');
        updatePreviewInfo();
        handleFieldChange(); // Phase 9.2: modification detection
    });

    // Layer checkboxes
    Object.keys(layerCheckboxes).forEach(layer => {
        layerCheckboxes[layer]?.addEventListener('change', () => {
            updateLayerVisibility();
            handleFieldChange(); // Phase 9.2: modification detection
        });
    });

    // Draw bbox button
    elements.drawBboxBtn.addEventListener('click', () => {
        if (isDrawingMode) {
            exitDrawMode();
        } else {
            enterDrawMode();
        }
    });

    // Reset bbox button
    elements.resetBboxBtn.addEventListener('click', resetBbox);

    // Toolbar buttons
    document.getElementById('zoom-in-btn').addEventListener('click', () => map.zoomIn());
    document.getElementById('zoom-out-btn').addEventListener('click', () => map.zoomOut());
    document.getElementById('fit-bbox-btn').addEventListener('click', fitMapToBbox);

    // Export button
    elements.exportBtn.addEventListener('click', exportMap);

    // Preview button
    elements.previewBtn.addEventListener('click', enterPreviewMode);

    // Close preview button
    if (elements.closePreviewBtn) {
        elements.closePreviewBtn.addEventListener('click', exitPreviewMode);
    }

    // ESC key to close preview
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isPreviewMode) {
            exitPreviewMode();
        }
    });

    // Title/subtitle input updates
    elements.titleInput.addEventListener('input', () => {
        if (isPreviewMode) {
            updatePrintComposition();
        }
    });

    elements.subtitleInput.addEventListener('input', () => {
        if (isPreviewMode) {
            updatePrintComposition();
        }
    });
}

// Initialize
init();
