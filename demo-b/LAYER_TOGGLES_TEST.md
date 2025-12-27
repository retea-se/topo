# Demo B Layer Toggles - Manual Verification

## Overview
Demo B supports layer visibility toggles for 6 layers:
1. Hillshade
2. Water
3. Parks
4. Roads
5. Buildings
6. Contours

## How to Test

### Prerequisites
- Docker Compose running (`docker compose up`)
- Demo B accessible at `http://localhost:3001` (or configured port)

### Test Steps

1. **Open Demo B UI**
   - Navigate to `http://localhost:3001`
   - Verify that all 6 layer checkboxes are visible and checked by default

2. **Test Individual Layer Toggle**
   - Uncheck "Hillshade"
   - Click "Export"
   - Verify exported image has no hillshade (terrain shading)
   - Repeat for each layer individually

3. **Test Multiple Layer Toggle**
   - Uncheck "Water" and "Parks"
   - Click "Export"
   - Verify exported image has no water bodies or parks
   - Check that other layers (roads, buildings, contours) are still visible

4. **Test All Layers Off**
   - Uncheck all layers
   - Click "Export"
   - Verify exported image shows only background color (no map features)

5. **Test State Persistence**
   - Toggle layers on/off
   - Change other form fields (theme, preset, DPI)
   - Verify layer toggle states remain unchanged
   - Export and verify layer states are applied correctly

6. **Test Coverage Handling**
   - For presets without terrain data (e.g., if hillshade/contours missing):
   - Verify toggles still work (layers simply won't render if data unavailable)
   - No errors should occur

## Expected Behavior

- **UI**: Layer checkboxes should be vertically stacked, matching Demo A layout
- **Export**: Layer visibility should match checkbox states exactly
- **API**: Layer states should be sent as JSON object: `{"hillshade": true, "water": false, ...}`
- **Renderer**: Only checked layers should appear in exported image

## Known Limitations

- Layer toggles only affect export rendering (no live preview in Demo B)
- Coverage-dependent layers (hillshade, contours) may be unavailable for some presets
- Toggle states are not persisted across page reloads

## Technical Details

- **UI IDs**: `layer-hillshade`, `layer-water`, `layer-parks`, `layer-roads`, `layer-buildings`, `layer-contours`
- **API Parameter**: `layers` (JSON object with boolean values)
- **Renderer Integration**: `theme_to_mapnik.py` checks `layers.get('layerName', True)` before adding layers to Mapnik XML

