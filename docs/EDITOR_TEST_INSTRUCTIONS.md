# Print Editor Test Instructions

## Prerequisites

Before testing, ensure the following services are running:

```bash
docker-compose up -d demo-a-web demo-a-tileserver demo-a-hillshade-server demo-b-renderer
```

## Access the Editor

Open in browser: `http://localhost:3000/editor`

---

## Manual Test Cases

### TC-01: Editor Loads Successfully

**Steps:**
1. Navigate to http://localhost:3000/editor
2. Wait for page to fully load

**Expected:**
- Sidebar panel visible on left
- Map visible on right
- Status bar shows "Ready"
- No JavaScript errors in console

---

### TC-02: Preset Selection

**Steps:**
1. Click the "Preset" dropdown
2. Select "Stockholm Wide"
3. Observe the map and bbox display

**Expected:**
- Map zooms to Stockholm Wide area
- Bbox coordinates update in the display panel
- Scale recalculates

---

### TC-03: Theme Selection

**Steps:**
1. Click the "Theme" dropdown
2. Select a different theme (e.g., "Ink" or "Dark")

**Expected:**
- Map style changes immediately
- Colors update according to theme

---

### TC-04: Paper Size Selection

**Steps:**
1. Click the "Paper Size" dropdown
2. Select "A1 (594 x 841 mm)"

**Expected:**
- Output size updates (should show larger pixel dimensions)
- Scale updates
- Estimated file size updates

---

### TC-05: Custom Paper Size

**Steps:**
1. Select "Custom" from Paper Size dropdown
2. Enter width: 500
3. Enter height: 700

**Expected:**
- Custom size input fields appear
- Output size recalculates based on entered values

---

### TC-06: Orientation Toggle

**Steps:**
1. Click "Landscape" button
2. Observe output size

**Expected:**
- Output size switches (width and height swap)
- Preview updates

---

### TC-07: DPI Selection

**Steps:**
1. Select "300 DPI (High Quality)"

**Expected:**
- Output size doubles (approximately)
- Estimated file size increases

---

### TC-08: Format Selection

**Steps:**
1. Click "PDF" button
2. Click "SVG" button
3. Click "PNG" button

**Expected:**
- Each button highlights when active
- Estimated file size changes per format

---

### TC-09: Layer Toggles

**Steps:**
1. Uncheck "Hillshade"
2. Uncheck "Roads"
3. Re-check both

**Expected:**
- Hillshade layer hides/shows
- Roads layer hides/shows
- Changes visible on map immediately

---

### TC-10: Title and Attribution Input

**Steps:**
1. Enter title: "Stockholm"
2. Enter subtitle: "Sweden"
3. Modify attribution text

**Expected:**
- Text inputs accept values
- No errors

---

### TC-11: Draw Custom Bbox

**Steps:**
1. Select "Custom (Draw on Map)" from Preset dropdown
2. Click "Draw Bbox" button
3. Click on map to start drawing
4. Click to add corners
5. Double-click to finish

**Expected:**
- Status shows "Click to draw bbox corners..."
- Rectangle appears on map
- Bbox coordinates update after drawing
- Preset changes to "custom"

---

### TC-12: Reset Bbox

**Steps:**
1. After drawing custom bbox, click "Reset" button

**Expected:**
- Bbox resets to selected preset
- Custom drawing is cleared

---

### TC-13: Zoom Controls

**Steps:**
1. Click "+" (zoom in)
2. Click "-" (zoom out)
3. Click "[]" (fit to bbox)

**Expected:**
- Zoom level updates in status bar
- Map zooms accordingly
- Fit to bbox centers the bbox in view

---

### TC-14: PNG Export

**Steps:**
1. Set up desired settings (preset, theme, size)
2. Click "Export Map"

**Expected:**
- Export modal appears with progress
- After rendering, PNG file downloads
- File has correct dimensions

---

### TC-15: PDF Export (Demo B Required)

**Steps:**
1. Select "PDF" format
2. Click "Export Map"

**Expected:**
- Request sent to Demo B renderer
- PDF file downloads
- PDF contains vector elements

---

### TC-16: SVG Export (Demo B Required)

**Steps:**
1. Select "SVG" format
2. Click "Export Map"

**Expected:**
- Request sent to Demo B renderer
- SVG file downloads
- SVG contains vector paths

---

### TC-17: Preview Button

**Steps:**
1. Configure export settings
2. Click "Preview"

**Expected:**
- Map fits to the current bbox
- Status shows "Preview ready"

---

## Performance Tests

### PT-01: Large Export (A0 @ 300 DPI)

**Steps:**
1. Select "A0" paper size
2. Select "300 DPI"
3. Select Stockholm Core preset
4. Click Export

**Expected:**
- Export completes (may take 1-2 minutes)
- Output file is approximately 9921 x 14032 pixels
- No timeout errors

---

## Error Handling Tests

### ET-01: Invalid DPI for Preset

**Steps:**
1. Select "Svealand" preset
2. Select "600 DPI"
3. Click Export

**Expected:**
- Error message indicates DPI too high for preset
- Export does not proceed

---

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Checklist

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-01 | | |
| TC-02 | | |
| TC-03 | | |
| TC-04 | | |
| TC-05 | | |
| TC-06 | | |
| TC-07 | | |
| TC-08 | | |
| TC-09 | | |
| TC-10 | | |
| TC-11 | | |
| TC-12 | | |
| TC-13 | | |
| TC-14 | | |
| TC-15 | | |
| TC-16 | | |
| TC-17 | | |
| PT-01 | | |
| ET-01 | | |

---

## Known Issues

_To be filled after testing_

---

## Screenshots

_To be added after verification_
