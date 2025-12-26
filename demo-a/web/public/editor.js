/**
 * Interactive Print Editor for Topo Map Export
 * Provides bbox drawing, export settings, and preview functionality
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
    attributionInput: document.getElementById('attribution-input'),
    themeSelect: document.getElementById('theme-select'),
    paperSizeSelect: document.getElementById('paper-size-select'),
    customSizeRow: document.getElementById('custom-size-row'),
    widthInput: document.getElementById('width-input'),
    heightInput: document.getElementById('height-input'),
    dpiSelect: document.getElementById('dpi-select'),
    exportBtn: document.getElementById('export-btn'),
    previewBtn: document.getElementById('preview-btn'),
    outputSize: document.getElementById('output-size'),
    scaleDisplay: document.getElementById('scale-display'),
    fileSize: document.getElementById('file-size'),
    statusDot: document.getElementById('status-dot'),
    statusText: document.getElementById('status-text'),
    zoomLevel: document.getElementById('zoom-level'),
    exportModal: document.getElementById('export-modal'),
    progressFill: document.getElementById('progress-fill'),
    modalStatus: document.getElementById('modal-status')
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
    if (!map || !currentTheme) return;

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

        map.once('style.load', () => {
            updateLayerVisibility();
            updateLayerCheckboxStates();
        });

        map.setStyle(style);
    }
}

/**
 * Update layer visibility based on checkboxes
 */
function updateLayerVisibility() {
    if (!map || !map.isStyleLoaded()) return;

    const visibility = (layer) => layerCheckboxes[layer]?.checked ? 'visible' : 'none';

    // Hillshade
    if (map.getLayer('hillshade')) {
        map.setLayoutProperty('hillshade', 'visibility', visibility('hillshade'));
    }

    // Water
    ['water', 'water-outline'].forEach(id => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visibility('water'));
    });

    // Parks
    ['parks', 'parks-outline', 'landcover'].forEach(id => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visibility('parks'));
    });

    // Roads
    ['roads-minor', 'roads-major'].forEach(id => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visibility('roads'));
    });

    // Buildings
    ['buildings', 'buildings-outline'].forEach(id => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visibility('buildings'));
    });

    // Contours
    ['contours-2m', 'contours-10m', 'contours-50m'].forEach(id => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visibility('contours'));
    });
}

/**
 * Update layer checkbox states based on coverage
 */
function updateLayerCheckboxStates() {
    const coverage = window.currentCoverage || {};

    // Disable hillshade if not available
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

    // Disable contours if not available
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

    // Apply orientation
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

    // Convert bbox width to meters (approximate at latitude)
    const lat = (currentBbox.north + currentBbox.south) / 2;
    const metersPerDegree = 111320 * Math.cos(lat * Math.PI / 180);
    const bboxWidthMeters = bboxWidth * metersPerDegree;

    // Paper width in meters
    const paperWidthMeters = output.widthMm / 1000;

    // Scale = real distance / map distance
    const scale = Math.round(bboxWidthMeters / paperWidthMeters);

    // Format scale nicely
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

    // Rough estimates based on format
    let sizeBytes;
    switch (currentFormat) {
        case 'png':
            sizeBytes = pixels * 1.5; // ~1.5 bytes per pixel for compressed PNG
            break;
        case 'pdf':
            sizeBytes = pixels * 0.5; // PDF is more efficient
            break;
        case 'svg':
            sizeBytes = pixels * 0.1; // SVG is vector, much smaller
            break;
        default:
            sizeBytes = pixels * 1.5;
    }

    // Format size
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
}

/**
 * Set up MapLibre Draw for bbox drawing
 */
function setupDraw() {
    // Use MapboxDraw (compatible with MapLibre)
    draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {},
        defaultMode: 'simple_select',
        styles: [
            // Polygon fill
            {
                id: 'gl-draw-polygon-fill',
                type: 'fill',
                filter: ['all', ['==', '$type', 'Polygon']],
                paint: {
                    'fill-color': '#e94560',
                    'fill-opacity': 0.1
                }
            },
            // Polygon outline
            {
                id: 'gl-draw-polygon-stroke',
                type: 'line',
                filter: ['all', ['==', '$type', 'Polygon']],
                paint: {
                    'line-color': '#e94560',
                    'line-width': 3,
                    'line-dasharray': [3, 3]
                }
            },
            // Vertex points
            {
                id: 'gl-draw-point',
                type: 'circle',
                filter: ['all', ['==', '$type', 'Point']],
                paint: {
                    'circle-radius': 6,
                    'circle-color': '#e94560'
                }
            }
        ]
    });

    map.addControl(draw);

    // Listen for draw events
    map.on('draw.create', handleDrawCreate);
    map.on('draw.update', handleDrawUpdate);
    map.on('draw.delete', handleDrawDelete);
}

/**
 * Handle bbox draw create
 */
function handleDrawCreate(e) {
    const feature = e.features[0];
    if (feature && feature.geometry.type === 'Polygon') {
        const coords = feature.geometry.coordinates[0];
        updateBboxFromCoords(coords);
    }
    exitDrawMode();
}

/**
 * Handle bbox draw update
 */
function handleDrawUpdate(e) {
    const feature = e.features[0];
    if (feature && feature.geometry.type === 'Polygon') {
        const coords = feature.geometry.coordinates[0];
        updateBboxFromCoords(coords);
    }
}

/**
 * Handle bbox draw delete
 */
function handleDrawDelete() {
    currentBbox = PRESET_BBOXES[currentPreset];
    updateBboxDisplay(currentBbox);
    updatePreviewInfo();
}

/**
 * Update bbox from polygon coordinates
 */
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

    // Update preset to custom
    elements.presetSelect.value = 'custom';
    setStatus('Custom bbox selected', 'success');
}

/**
 * Enter draw mode
 */
function enterDrawMode() {
    isDrawingMode = true;
    elements.drawBboxBtn.classList.add('active');
    elements.drawBboxBtn.textContent = 'Drawing...';

    // Clear existing drawings
    draw.deleteAll();

    // Start drawing rectangle
    draw.changeMode('draw_polygon');

    setStatus('Click to draw bbox corners, double-click to finish', 'warning');
}

/**
 * Exit draw mode
 */
function exitDrawMode() {
    isDrawingMode = false;
    elements.drawBboxBtn.classList.remove('active');
    elements.drawBboxBtn.textContent = 'Draw Bbox';
    setStatus('Ready', 'success');
}

/**
 * Reset bbox to current preset
 */
function resetBbox() {
    if (currentPreset !== 'custom') {
        currentBbox = PRESET_BBOXES[currentPreset];
        updateBboxDisplay(currentBbox);
        updatePreviewInfo();

        // Clear draw features
        if (draw) {
            draw.deleteAll();
        }

        // Fit map to bbox
        fitMapToBbox();
    }
}

/**
 * Fit map to current bbox
 */
function fitMapToBbox() {
    if (!map || !currentBbox) return;

    map.fitBounds([
        [currentBbox.west, currentBbox.south],
        [currentBbox.east, currentBbox.north]
    ], { padding: 50 });
}

/**
 * Set status message
 */
function setStatus(message, type = 'success') {
    elements.statusText.textContent = message;
    elements.statusDot.className = 'status-dot';

    if (type === 'warning') {
        elements.statusDot.classList.add('warning');
    } else if (type === 'error') {
        elements.statusDot.classList.add('error');
    }
}

/**
 * Get current layer visibility settings
 */
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
 * Export map
 */
async function exportMap() {
    if (!currentBbox) {
        setStatus('Please select a bbox first', 'error');
        return;
    }

    // Show modal
    elements.exportModal.classList.add('active');
    elements.progressFill.style.width = '0%';
    elements.modalStatus.textContent = 'Preparing export...';

    const output = calculateOutputSize();
    const theme = elements.themeSelect.value;
    const layers = getLayerSettings();

    try {
        // Build export URL based on format
        if (currentFormat === 'png') {
            // Use existing Playwright exporter for PNG
            setProgress(20, 'Rendering map...');

            const params = new URLSearchParams({
                bbox_preset: currentPreset === 'custom' ? 'stockholm_core' : currentPreset,
                custom_bbox: currentPreset === 'custom' ? `${currentBbox.west},${currentBbox.south},${currentBbox.east},${currentBbox.north}` : '',
                theme: theme,
                render_mode: 'print',
                dpi: output.dpi,
                width_mm: output.widthMm,
                height_mm: output.heightMm,
                title: elements.titleInput.value,
                subtitle: elements.subtitleInput.value,
                attribution: elements.attributionInput.value,
                layers: JSON.stringify(layers)
            });

            setProgress(50, 'Generating image...');

            // Navigate to exporter
            window.location.href = `http://localhost:8082/render?${params}`;

            setProgress(100, 'Download starting...');
            setTimeout(() => {
                elements.exportModal.classList.remove('active');
            }, 1500);

        } else if (currentFormat === 'pdf' || currentFormat === 'svg') {
            // Use Demo B renderer for PDF/SVG
            setProgress(20, `Preparing ${currentFormat.toUpperCase()} export...`);

            const requestBody = {
                bbox_preset: currentPreset === 'custom' ? null : currentPreset,
                custom_bbox: currentPreset === 'custom' ? [currentBbox.west, currentBbox.south, currentBbox.east, currentBbox.north] : null,
                theme: theme,
                render_mode: 'print',
                dpi: output.dpi,
                width_mm: output.widthMm,
                height_mm: output.heightMm,
                format: currentFormat,
                title: elements.titleInput.value,
                subtitle: elements.subtitleInput.value,
                attribution: elements.attributionInput.value,
                layers: layers
            };

            setProgress(40, 'Sending to renderer...');

            const response = await fetch('http://localhost:5000/api/render', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Export failed');
            }

            setProgress(80, 'Downloading file...');

            // Download the file
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `map_export_${Date.now()}.${currentFormat}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setProgress(100, 'Download complete!');
            setTimeout(() => {
                elements.exportModal.classList.remove('active');
            }, 1500);
        }

    } catch (error) {
        console.error('Export error:', error);
        elements.modalStatus.textContent = `Error: ${error.message}`;
        elements.statusDot.classList.add('error');

        setTimeout(() => {
            elements.exportModal.classList.remove('active');
            setStatus(error.message, 'error');
        }, 3000);
    }
}

/**
 * Set progress
 */
function setProgress(percent, message) {
    elements.progressFill.style.width = `${percent}%`;
    elements.modalStatus.textContent = message;
}

/**
 * Generate preview
 */
async function generatePreview() {
    setStatus('Generating preview...', 'warning');

    // For now, just fit the map to the bbox
    fitMapToBbox();

    setStatus('Preview ready', 'success');
}

/**
 * Initialize the editor
 */
async function init() {
    try {
        // Load config and themes
        const [config, themes] = await Promise.all([
            fetch('/api/config').then(r => r.json()),
            fetch('/api/themes').then(r => r.json())
        ]);

        // Populate theme dropdown
        elements.themeSelect.innerHTML = '';
        themes.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.name;
            elements.themeSelect.appendChild(opt);
        });

        // Load initial theme
        currentTheme = await loadTheme('paper');

        // Set initial bbox
        currentBbox = PRESET_BBOXES[currentPreset];
        updateBboxDisplay(currentBbox);

        // Initialize map
        map = new maplibregl.Map({
            container: 'map',
            style: {
                version: 8,
                sources: {},
                layers: [
                    {
                        id: 'background',
                        type: 'background',
                        paint: { 'background-color': currentTheme?.background || '#faf8f5' }
                    }
                ]
            },
            center: PRESET_BBOXES[currentPreset].center,
            zoom: PRESET_BBOXES[currentPreset].zoom
        });

        map.on('load', async () => {
            console.log('Map loaded');
            window.map = map;

            // Setup draw control
            setupDraw();

            // Update map style
            await updateMapStyle();

            // Update UI
            updatePreviewInfo();
            setStatus('Ready', 'success');
        });

        // Update zoom display
        map.on('zoom', () => {
            elements.zoomLevel.textContent = map.getZoom().toFixed(1);
        });

        // Set up event listeners
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
    // Preset select
    elements.presetSelect.addEventListener('change', async (e) => {
        currentPreset = e.target.value;
        if (currentPreset !== 'custom') {
            currentBbox = PRESET_BBOXES[currentPreset];
            updateBboxDisplay(currentBbox);
            fitMapToBbox();

            // Clear draw features
            if (draw) draw.deleteAll();

            await updateMapStyle();
        } else {
            setStatus('Draw a custom bbox on the map', 'warning');
        }
        updatePreviewInfo();
    });

    // Theme select
    elements.themeSelect.addEventListener('change', async (e) => {
        currentTheme = await loadTheme(e.target.value);
        await updateMapStyle();
    });

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
    elements.dpiSelect.addEventListener('change', updatePreviewInfo);

    // Orientation buttons
    document.getElementById('orientation-portrait').addEventListener('click', () => {
        currentOrientation = 'portrait';
        document.getElementById('orientation-portrait').classList.add('active');
        document.getElementById('orientation-landscape').classList.remove('active');
        updatePreviewInfo();
    });

    document.getElementById('orientation-landscape').addEventListener('click', () => {
        currentOrientation = 'landscape';
        document.getElementById('orientation-landscape').classList.add('active');
        document.getElementById('orientation-portrait').classList.remove('active');
        updatePreviewInfo();
    });

    // Format buttons
    document.getElementById('format-png').addEventListener('click', () => {
        currentFormat = 'png';
        document.getElementById('format-png').classList.add('active');
        document.getElementById('format-pdf').classList.remove('active');
        document.getElementById('format-svg').classList.remove('active');
        updatePreviewInfo();
    });

    document.getElementById('format-pdf').addEventListener('click', () => {
        currentFormat = 'pdf';
        document.getElementById('format-pdf').classList.add('active');
        document.getElementById('format-png').classList.remove('active');
        document.getElementById('format-svg').classList.remove('active');
        updatePreviewInfo();
    });

    document.getElementById('format-svg').addEventListener('click', () => {
        currentFormat = 'svg';
        document.getElementById('format-svg').classList.add('active');
        document.getElementById('format-png').classList.remove('active');
        document.getElementById('format-pdf').classList.remove('active');
        updatePreviewInfo();
    });

    // Layer checkboxes
    Object.keys(layerCheckboxes).forEach(layer => {
        layerCheckboxes[layer]?.addEventListener('change', updateLayerVisibility);
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
    elements.previewBtn.addEventListener('click', generatePreview);
}

// Initialize
init();
