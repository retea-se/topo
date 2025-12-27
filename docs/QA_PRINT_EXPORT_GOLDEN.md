# QA: Print Export Golden Baseline

**Created:** 2025-12-27
**Status:** IN PROGRESS
**Phase:** Step 1 - Bug Reproduction and Isolation

---

## Executive Summary

This document tracks the process of making print export "golden" - ensuring correctness between preview and export, and establishing regression protection.

### Root Cause Identified

**Critical Bug:** Export does NOT include print composition elements

| Element | Preview | Export |
|---------|---------|--------|
| Frame/Border | Yes | **NO** |
| Title | Yes | **NO** |
| Subtitle | Yes | **NO** |
| Scale bar | Yes | **NO** |
| Attribution | Yes | **NO** |

**Technical Details:**
- `editor.js:updatePrintComposition()` creates overlay elements dynamically
- `server.js` screenshots only `#map` element, missing all composition
- Exporter accepts `title`, `subtitle`, `attribution` params but does NOT render them

---

## Test Matrix (Step 1)

### Presets Under Test

| Preset | Bbox | Theme | Paper | DPI | Format |
|--------|------|-------|-------|-----|--------|
| A2_Paper_v1 | stockholm_core | paper | A2 (594x420mm) | 150 | PNG |
| A3_Blueprint_v1 | stockholm_core | blueprint-muted | A3 (420x297mm) | 150 | PDF |
| A1_Terrain_v1 | stockholm_wide | gallery | A1 (594x841mm) | 150 | PNG |

### Layout Templates Under Test

| Template | Title Position | Frame Style | Frame Width |
|----------|----------------|-------------|-------------|
| Classic | top-center | solid | 1px |
| Minimal | none | solid | 1px |
| Bold | center-overlay | solid | 2px |

### Full Test Matrix (3x3 = 9 combinations)

| # | Preset | Template | Expected Composition | Actual Status |
|---|--------|----------|----------------------|---------------|
| 1 | A2_Paper_v1 | Classic | Frame + Title (top) + Attribution | **MISSING** |
| 2 | A2_Paper_v1 | Minimal | Frame only | **MISSING** |
| 3 | A2_Paper_v1 | Bold | Frame + Title (center) | **MISSING** |
| 4 | A3_Blueprint_v1 | Classic | Frame + Title (top) + Attribution | **MISSING** |
| 5 | A3_Blueprint_v1 | Minimal | Frame only | **MISSING** |
| 6 | A3_Blueprint_v1 | Bold | Frame + Title (center) | **MISSING** |
| 7 | A1_Terrain_v1 | Classic | Frame + Title (top) + Attribution | **MISSING** |
| 8 | A1_Terrain_v1 | Minimal | Frame only | **MISSING** |
| 9 | A1_Terrain_v1 | Bold | Frame + Title (center) | **MISSING** |

---

## Defects

### DEF-001: Export Missing All Composition Elements (CRITICAL)

**Severity:** Critical
**Status:** Open

**Description:**
Exported PNG/PDF files contain only the raw map without any composition elements (frame, title, subtitle, scale bar, attribution).

**Steps to Reproduce:**
1. Open http://localhost:3000/editor
2. Select any preset (e.g., A2_Paper_v1)
3. Add title "Test Map"
4. Select Classic template
5. Click "Preview" - observe frame, title, attribution visible
6. Click "Export" - observe download starts
7. Open exported file - NO composition elements present

**Expected:**
Exported file should match preview composition exactly.

**Actual:**
Exported file contains only raw map, no frame/title/attribution.

**Root Cause:**
`demo-a/exporter/src/server.js` line 154-157:
```javascript
const mapElement = await page.$('#map');
const screenshot = mapElement
  ? await mapElement.screenshot({ type: 'png', omitBackground: false })
  : await page.screenshot({ type: 'png', fullPage: false, omitBackground: false });
```

The exporter only captures `#map`, not the composition overlay.

**Fix Required:**
Modify exporter to render composition elements before capture.

---

## Fix Plan

### Option A: Browser-Side Composition (Recommended)

1. Inject composition overlay into page via Playwright before screenshot
2. Create wrapper div with composition elements
3. Screenshot wrapper div (not just `#map`)

**Advantages:**
- Uses same rendering as preview
- Consistent styling
- Supports all templates

### Option B: Server-Side Composition

1. Capture raw map
2. Use Canvas/Sharp to add composition elements
3. Composite final image

**Disadvantages:**
- Duplicates styling logic
- More complex maintenance
- Harder to match preview exactly

---

## Implementation Steps

### Step 2.1: Modify Exporter to Add Composition

1. Add composition parameters to exporter endpoint (layout_template, show_scale, show_attribution)
2. Create function to inject composition overlay
3. Screenshot composition wrapper instead of raw map
4. Test all 9 matrix combinations

### Step 2.2: Verify mm to px Conversion

Current formula: `width_px = Math.round(width_mm * dpi / 25.4)`

Verify:
- A2 (594x420mm) @ 150 DPI = 3508x2480 px
- A3 (420x297mm) @ 150 DPI = 2480x1753 px
- A1 (594x841mm) @ 150 DPI = 3508x4967 px

---

## Golden Baseline Definition (Step 3)

### Golden Exports

| # | Preset | Template | Purpose |
|---|--------|----------|---------|
| 1 | A3_Blueprint_v1 + Classic | Text + Frame strict |
| 2 | A2_Paper_v1 + Minimal | Frame + whitespace |
| 3 | A1_Terrain_v1 + Bold | Terrain + heavy composition |

### Storage

Location: `golden/print_export/`

Files:
- `A3_Blueprint_v1_Classic_golden.png`
- `A2_Paper_v1_Minimal_golden.png`
- `A1_Terrain_v1_Bold_golden.png`
- `metadata.json` (SHA256, dimensions, versions)

### Acceptance Threshold

- Pixel diff: < 0.1% (anti-aliasing tolerance)
- Exact dimensions: MUST match
- Composition elements: MUST be present

---

## Regression Check Script (Step 4)

Location: `scripts/qa_golden_print_export.js`

Features:
- Run 3 golden exports
- Compare to baseline
- Output diff image on failure
- Return exit code for CI

---

## Progress Log

### 2025-12-27 10:00 CET

- Started QA analysis
- Identified root cause: exporter missing composition rendering
- Created test matrix
- Documented DEF-001

---

## Notes

- PDF exports go through Demo B (port 5000), need separate verification
- PNG exports go through Demo A exporter (port 8082)
- Layout templates defined in `editor.js:LAYOUT_TEMPLATES`
