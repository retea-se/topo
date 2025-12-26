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
let styleChangeInProgress = false;

// Debug logging (set to true for troubleshooting)
const DEBUG = true;
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
 * IMPORTANT: Preserves current viewport (center, zoom, bearing, pitch)
 */
async function updateMapStyle() {
    if (!map || !currentTheme) return;

    // Guard against concurrent style changes
    if (styleChangeInProgress) {
        debug('Style change already in progress, skipping');
        return;
    }
    styleChangeInProgress = true;

    // Save current view state BEFORE style change
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

            // Set up the style.load handler BEFORE calling setStyle
            map.once('style.load', () => {
                debug('Style loaded, restoring view state:', savedViewState);

                // Restore view state after style loads
                map.jumpTo({
                    center: savedViewState.center,
                    zoom: savedViewState.zoom,
                    bearing: savedViewState.bearing,
                    pitch: savedViewState.pitch
                });

                updateLayerVisibility();
                updateLayerCheckboxStates();
                styleChangeInProgress = false;
                debug('Style change complete, view state restored');
            });

            map.setStyle(style);
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

    debug('Starting export:', { format: currentFormat, preset: currentPreset, bbox: currentBbox });

    // Hide print composition overlay during export (exporter creates its own)
    hidePrintComposition();

    // Show modal
    elements.exportModal.classList.add('active');
    elements.progressFill.style.width = '0%';
    elements.modalStatus.textContent = 'Preparing export...';

    const output = calculateOutputSize();
    const theme = elements.themeSelect.value;
    const layers = getLayerSettings();

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `export_${currentPreset}_${theme}_${output.widthMm}x${output.heightMm}mm_${output.dpi}dpi_${timestamp}.${currentFormat}`;

    try {
        if (currentFormat === 'png') {
            // Use existing Playwright exporter for PNG via fetch (not navigation)
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
                attribution: elements.attributionInput.value || '',
                layers: JSON.stringify(layers)
            });

            const exportUrl = `http://localhost:8082/render?${params}`;
            debug('PNG export URL:', exportUrl);

            setProgress(40, 'Rendering map (this may take 30-60 seconds)...');

            // Use fetch instead of navigation for proper blob handling
            const response = await fetch(exportUrl, {
                method: 'GET',
                mode: 'cors'
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Export failed: ${response.status} - ${errorText}`);
            }

            setProgress(80, 'Processing image...');

            // Get the blob and trigger download
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            debug('PNG export complete, blob size:', blob.size);

            // Trigger download
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setProgress(100, `Download started: ${filename}`);
            setStatus(`Export saved: ${filename} (${(blob.size / 1024 / 1024).toFixed(1)} MB)`, 'success');

            setTimeout(() => {
                elements.exportModal.classList.remove('active');
            }, 2000);

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
                title: elements.titleInput.value || '',
                subtitle: elements.subtitleInput.value || '',
                attribution: elements.attributionInput.value || '',
                layers: layers
            };

            debug('PDF/SVG export request:', requestBody);

            setProgress(40, 'Sending to Demo B renderer...');

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

            setProgress(80, 'Downloading file...');

            // Download the file
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            debug(`${currentFormat.toUpperCase()} export complete, blob size:`, blob.size);

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setProgress(100, `Download started: ${filename}`);
            setStatus(`Export saved: ${filename} (${(blob.size / 1024).toFixed(0)} KB)`, 'success');

            setTimeout(() => {
                elements.exportModal.classList.remove('active');
            }, 2000);
        }

    } catch (error) {
        console.error('Export error:', error);
        debug('Export failed:', error.message);

        elements.modalStatus.textContent = `Error: ${error.message}`;
        elements.progressFill.style.background = '#f87171';

        setTimeout(() => {
            elements.exportModal.classList.remove('active');
            elements.progressFill.style.background = '';
            setStatus(`Export failed: ${error.message}`, 'error');
        }, 4000);
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
 * Create or update the print composition overlay
 * Shows frame, title, scale, and attribution as they will appear in export
 */
function updatePrintComposition() {
    const mapContainer = document.getElementById('map-container');

    // Remove existing composition overlay
    let overlay = document.getElementById('print-composition');
    if (overlay) {
        overlay.remove();
    }

    // Create new overlay
    overlay = document.createElement('div');
    overlay.id = 'print-composition';
    overlay.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 15;
        display: flex;
        flex-direction: column;
        background: rgba(255, 255, 255, 0.95);
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;

    // Calculate dimensions based on viewport and paper aspect ratio
    const output = calculateOutputSize();
    const aspectRatio = output.widthMm / output.heightMm;

    // Get available space
    const containerRect = mapContainer.getBoundingClientRect();
    const maxWidth = containerRect.width * 0.85;
    const maxHeight = containerRect.height * 0.85;

    // Calculate overlay dimensions maintaining aspect ratio
    let overlayWidth, overlayHeight;
    if (maxWidth / maxHeight > aspectRatio) {
        // Constrained by height
        overlayHeight = maxHeight;
        overlayWidth = overlayHeight * aspectRatio;
    } else {
        // Constrained by width
        overlayWidth = maxWidth;
        overlayHeight = overlayWidth / aspectRatio;
    }

    overlay.style.width = `${overlayWidth}px`;
    overlay.style.height = `${overlayHeight}px`;

    // Calculate margins (simulate 10mm margins scaled to overlay)
    const marginPx = Math.round((10 / output.widthMm) * overlayWidth);

    // Create inner content area (with margins)
    const contentArea = document.createElement('div');
    contentArea.style.cssText = `
        flex: 1;
        margin: ${marginPx}px;
        display: flex;
        flex-direction: column;
        border: 2px solid #333;
        position: relative;
        overflow: hidden;
    `;

    // Title area (top)
    const title = elements.titleInput.value;
    const subtitle = elements.subtitleInput.value;
    if (title || subtitle) {
        const titleArea = document.createElement('div');
        titleArea.style.cssText = `
            padding: 8px 12px;
            background: rgba(255,255,255,0.9);
            text-align: center;
            border-bottom: 1px solid #ccc;
        `;
        if (title) {
            const titleEl = document.createElement('div');
            titleEl.style.cssText = 'font-size: 16px; font-weight: bold; color: #333;';
            titleEl.textContent = title;
            titleArea.appendChild(titleEl);
        }
        if (subtitle) {
            const subtitleEl = document.createElement('div');
            subtitleEl.style.cssText = 'font-size: 12px; color: #666; margin-top: 2px;';
            subtitleEl.textContent = subtitle;
            titleArea.appendChild(subtitleEl);
        }
        contentArea.appendChild(titleArea);
    }

    // Map placeholder (center)
    const mapPlaceholder = document.createElement('div');
    mapPlaceholder.style.cssText = `
        flex: 1;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: #999;
    `;
    mapPlaceholder.textContent = '(Map renders here)';
    contentArea.appendChild(mapPlaceholder);

    // Footer area (bottom)
    const footerArea = document.createElement('div');
    footerArea.style.cssText = `
        padding: 6px 12px;
        background: rgba(255,255,255,0.9);
        border-top: 1px solid #ccc;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        font-size: 10px;
        color: #666;
    `;

    // Scale (left)
    const scaleEl = document.createElement('div');
    scaleEl.textContent = `Scale: ${calculateScale()}`;
    footerArea.appendChild(scaleEl);

    // Attribution (right)
    const attribution = elements.attributionInput.value;
    if (attribution) {
        const attrEl = document.createElement('div');
        attrEl.style.cssText = 'text-align: right; max-width: 60%;';
        attrEl.textContent = attribution.split('\n')[0]; // First line only
        footerArea.appendChild(attrEl);
    }

    contentArea.appendChild(footerArea);
    overlay.appendChild(contentArea);

    // Add label showing paper size
    const paperLabel = document.createElement('div');
    const paperSize = elements.paperSizeSelect.value;
    paperLabel.style.cssText = `
        position: absolute;
        top: -25px;
        left: 0;
        background: #e94560;
        color: #fff;
        padding: 4px 8px;
        font-size: 11px;
        border-radius: 4px;
        white-space: nowrap;
    `;
    paperLabel.textContent = `${paperSize} ${currentOrientation} - ${output.widthPx}x${output.heightPx}px @ ${output.dpi}dpi`;
    overlay.appendChild(paperLabel);

    mapContainer.appendChild(overlay);
    debug('Print composition overlay updated');
}

/**
 * Hide print composition overlay
 */
function hidePrintComposition() {
    const overlay = document.getElementById('print-composition');
    if (overlay) {
        overlay.remove();
    }
}

/**
 * Generate preview
 */
async function generatePreview() {
    setStatus('Generating preview...', 'warning');

    // Fit map to bbox
    fitMapToBbox();

    // Show print composition overlay
    updatePrintComposition();

    setStatus('Preview ready - composition overlay shown', 'success');
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
