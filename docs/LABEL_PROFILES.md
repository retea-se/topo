# Label Profiles - Handoff Documentation

**Last updated**: 2025-12-27 (Phase 14 implementation complete)

---

## 1. What Exists Now

### Source of Truth

**File**: `demo-a/web/public/label-profiles/labelProfiles.js`

This single module contains all label profile logic, typography presets, and state management.

### Profiles

| Profile | Description | Visible Layers |
|---------|-------------|----------------|
| `off` | No labels visible | None |
| `minimal` | Major road names only, subtle typography | `transportation_name` (primary, secondary, tertiary, trunk, motorway) |
| `landmarks` | Place names, water, parks - no streets | `place`, `poi`, `water_name`, `park` |

### Typography Presets

| Preset | Character | Street Style | Landmark Style |
|--------|-----------|--------------|----------------|
| `subtle` | Nearly invisible, wall-art | 70% size, #999, 0.5px halo | 90% size, #777, 0.8px halo |
| `crisp` | High contrast, readable | 85% size, #555, 1.2px halo | 100% size, #333, 1.5px halo |
| `classic` | Traditional cartography | 80% size, #707070, 0.8px halo | 95% size, #505050, 1.0px halo |

### Exported API

```javascript
// Constants
LABEL_PROFILES           // Profile definitions
TYPOGRAPHY_PRESETS       // Typography preset definitions
DEFAULT_TYPOGRAPHY_PRESET // 'subtle'
DEFAULT_LABEL_PROFILE    // 'off'

// State Management
getLabelProfileState()   // Returns { profile, typographyPreset }
setLabelProfileState(state)  // Sets state (does NOT apply)
getLastAppliedChanges()  // Returns array of changes from last apply
getCurrentTypographyPreset() // Legacy: returns current preset name
resetBaseline()          // Reset captured baseline values

// Core Functionality
applyLabelProfile(map, profileKey, options?)  // Apply profile (IDEMPOTENT)
setupStyleReloadHandler(map, getProfileFn, getTypographyPresetFn?)

// Classification & Diagnostics
classifySymbolLayer(layer)    // Returns category for a layer
hasTextField(layer)           // Check if layer has text-field
inventorySymbolLayers(map)    // Get full inventory
diagnosticLandmarks(map)      // Check landmarks data availability
```

### File Structure

```
demo-a/web/
  public/
    label-profiles/
      labelProfiles.js          # Main module (source of truth)
      test-label-profiles.html  # Visual QA page
      README.md                 # API reference
  src/
    themeToStyle.js             # Generates MapLibre style with label layers
```

---

## 2. How to Test

### Start the System

```bash
cd /path/to/topo
docker compose --profile demoA up -d
```

### Open Test Page

```
http://localhost:3000/label-profiles/test-label-profiles.html
```

### Test Procedure

1. **Page loads**: Should show "Klar! 5 label layers hittades." in green
2. **Default state**: Profile "off", Typography "subtle"
3. **Test Off profile**: All labels should be hidden
4. **Test Minimal + Subtle**: Select "Minimal Streets" - street names appear with subtle gray color
5. **Test Minimal + Crisp**: Change typography to "Crisp" - street names become darker, more visible
6. **Test Landmarks + Classic**: Select "Landmarks", "Classic" - place/park names visible, no streets
7. **Idempotency test**: Switch between profiles multiple times - text sizes should NOT continue shrinking

### What to Look For

- Status panel shows current profile + typography
- "Applicerade Andringar" shows visibility and typography changes
- "Landmarks Diagnostik" shows available data per source-layer
- No console errors (open DevTools to verify)

---

## 3. Integration Checklist (Editor Level 1)

Quick integration in editor sidebar:

- [ ] Add profile selector dropdown in sidebar
  ```html
  <select id="label-profile-select">
    <option value="off">Labels: Off</option>
    <option value="minimal">Labels: Minimal Streets</option>
    <option value="landmarks">Labels: Landmarks</option>
  </select>
  ```

- [ ] Add typography selector (optional)
  ```html
  <select id="label-typography-select">
    <option value="subtle">Typography: Subtle</option>
    <option value="crisp">Typography: Crisp</option>
    <option value="classic">Typography: Classic</option>
  </select>
  ```

- [ ] Wire up event handlers
  ```javascript
  document.getElementById('label-profile-select').addEventListener('change', (e) => {
    const state = window.LabelProfiles.getLabelProfileState();
    window.LabelProfiles.applyLabelProfile(map, e.target.value, {
      typographyPreset: state.typographyPreset
    });
  });
  ```

- [ ] Persist state in editor store / URL
  ```javascript
  // Get state for persistence
  const state = window.LabelProfiles.getLabelProfileState();
  // { profile: 'minimal', typographyPreset: 'subtle' }

  // Restore state
  window.LabelProfiles.setLabelProfileState({
    profile: savedState.profile,
    typographyPreset: savedState.typographyPreset
  });
  ```

- [ ] Apply on map load
  ```javascript
  map.on('load', () => {
    const state = window.LabelProfiles.getLabelProfileState();
    window.LabelProfiles.applyLabelProfile(map, state.profile, {
      typographyPreset: state.typographyPreset
    });
  });
  ```

- [ ] Setup style reload handler
  ```javascript
  window.LabelProfiles.setupStyleReloadHandler(
    map,
    () => window.LabelProfiles.getLabelProfileState().profile,
    () => window.LabelProfiles.getLabelProfileState().typographyPreset
  );
  ```

---

## 4. Integration Checklist (Export/Preset Level 2)

For deterministic export with preset JSON:

### Preset JSON Schema Addition

```json
{
  "id": "stockholm_a4_landscape",
  "theme": "paper",
  "bbox_preset": "stockholm_core",
  "render": { "dpi": 300, "format": "png" },
  "labelProfile": "minimal",
  "labelTypography": "subtle"
}
```

- [ ] Add `labelProfile` and `labelTypography` fields to preset schema
- [ ] Validate against LABEL_PROFILES and TYPOGRAPHY_PRESETS keys

### themeToStyle.js Integration

```javascript
function themeToMapLibreStyle(theme, ..., labelProfile = 'off') {
  // Generate layers with initial visibility based on profile
  // This ensures export starts with correct state
}
```

- [ ] Pass labelProfile to themeToMapLibreStyle
- [ ] Set initial visibility in generated style (not runtime)

### Exporter Integration (Puppeteer/Playwright)

```javascript
await page.evaluate((config) => {
  window.LabelProfiles.applyLabelProfile(map, config.labelProfile, {
    typographyPreset: config.labelTypography
  });
}, exportConfig);
```

- [ ] Inject labelProfile and labelTypography from preset
- [ ] Wait for profile application before screenshot

### Determinism Requirements

- Same profile + typography = same visual output
- No random/time-based elements in label placement
- Export uses same baseline values as preview

---

## 5. Landmarks Diagnostics

### Why Landmarks Sometimes Don't Show

| Issue | Cause | Solution |
|-------|-------|----------|
| No features visible | Tiles don't contain source-layer | Check tile source, zoom level |
| source-layer missing | Tile schema doesn't include layer | Use different tile source |
| Features outside viewport | Labels only render in view | Pan/zoom to area with features |
| Zoom level too low/high | Features have minzoom/maxzoom | Adjust zoom to appropriate level |

### Diagnostic Tools

**In test page**: Click "Kolla Data" button to see:
- Which source-layers have data in current viewport
- Feature count per category
- Sample feature names

**Programmatic diagnostic**:
```javascript
const diag = window.LabelProfiles.diagnosticLandmarks(map);
// Returns: { place: { found: true, count: 12, sample: {...} }, poi: {...}, ... }
```

### Confirming Data Availability

1. Use `inventorySymbolLayers(map)` to see which layers exist in style
2. Use `queryRenderedFeatures()` to check if tiles have data:
   ```javascript
   const features = map.queryRenderedFeatures().filter(f => f.sourceLayer === 'place');
   console.log('Place features:', features.length);
   ```

### Fallback Strategy

If landmarks are missing in certain areas:

1. **place-only mode**: Show only `place` layer (usually most available)
2. **Zoom threshold**: Only show landmarks above certain zoom level
3. **Data verification**: Check tiles before export, warn user if empty

### Source-Layer Requirements

For landmarks profile to work fully, tiles must include:

| Source-layer | Features |
|--------------|----------|
| `place` | Neighborhoods, suburbs, cities |
| `poi` | Points of interest |
| `water_name` | Lake/river/sea names |
| `park` | Park/forest names |

---

## 6. Design Notes

### Why Typography Presets Exist

**Problem**: Labels can clash with the "wall-art" aesthetic. Users want readable maps but also minimal visual noise.

**Solution**: Pre-defined typography combinations that balance readability vs. subtlety. No free font-picker (which would break determinism and create ugly combinations).

### Recommendation

| Timeframe | Approach |
|-----------|----------|
| **Now** | Use typography presets (subtle/crisp/classic) |
| **Soon** | Add UI selector in editor sidebar |
| **Later** | Theme-driven typography from theme JSON |

### Wall-Art Policy

For print/wall-art use cases:

1. **Low clutter**: Default to `off` profile
2. **Subtle contrast**: If labels needed, use `subtle` preset
3. **No overlap**: Labels should not stack/overlap
4. **Deterministic**: Same input = same output (no random label placement)

### Future: Theme-Driven Typography

Add to theme JSON:
```json
{
  "name": "Paper",
  "background": "#faf8f5",
  "labelTypography": {
    "fontStack": ["Noto Sans Regular"],
    "street": {
      "sizeFactor": 0.75,
      "color": "#888888",
      "haloWidth": 0.5
    }
  }
}
```

This gives designers full control while maintaining determinism.

---

## 7. QA Results

**Tested**: 2025-12-27

| Test | Result |
|------|--------|
| Off profile hides all labels | PASS |
| Minimal shows only streets | PASS |
| Landmarks shows place/poi/water/park | PASS |
| Typography presets apply correctly | PASS |
| Idempotency (multiple applies) | PASS |
| Style reload preserves state | PASS |
| No console errors | PASS |
| DOM updates are XSS-safe | PASS (uses textContent, replaceChildren) |

---

## 8. Known Limitations

1. **Expression-based text-size**: If layer uses MapLibre expression for text-size, typography factor is not applied (size left unchanged)

2. **No per-layer override**: Cannot customize individual layer visibility within a profile

3. **Tile dependency**: Landmarks profile requires tiles with correct source-layers

4. **Font availability**: Uses Noto Sans from Protomaps CDN - requires internet access

---

## 9. Tomorrow Plan (Editor Integration)

1. Add `<script src="/label-profiles/labelProfiles.js"></script>` to editor.html

2. Add profile dropdown in sidebar (copy from test-label-profiles.html)

3. Add state management to editor store:
   ```javascript
   editorState.labelProfile = 'off';
   editorState.labelTypography = 'subtle';
   ```

4. Wire dropdown change event to call `applyLabelProfile()`

5. Setup style reload handler after map creation

6. Add URL param persistence: `?labelProfile=minimal&labelTypography=crisp`

7. Test: change profile, reload page, verify state persists

8. Test: change theme, verify profile reapplies after style reload

9. Update export preset schema to include labelProfile/labelTypography

10. Verify export produces same output as preview

---

## Summary

| Component | Status | Location |
|-----------|--------|----------|
| Profile definitions | Complete | labelProfiles.js |
| Typography presets | Complete | labelProfiles.js |
| Idempotent apply | Complete | labelProfiles.js |
| State management API | Complete | labelProfiles.js |
| Style reload handler | Complete | labelProfiles.js |
| Test page | Complete | test-label-profiles.html |
| Editor integration | Planned | See checklist above |
| Export integration | Planned | See checklist above |
