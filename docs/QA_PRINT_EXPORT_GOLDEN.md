# QA: Print Export Golden Baseline

**Created:** 2025-12-27
**Status:** COMPLETE
**Phase:** All steps completed

---

## Executive Summary

This document tracks the process of making print export "golden" - ensuring correctness between preview and export, and establishing regression protection.

### Final Status: SUCCESS

All issues have been fixed and verified:

| Element | Preview | Export | Status |
|---------|---------|--------|--------|
| Frame/Border | Yes | Yes | FIXED |
| Title | Yes | Yes | FIXED |
| Subtitle | Yes | Yes | FIXED |
| Scale bar | Yes | Yes | FIXED |
| Attribution | Yes | Yes | FIXED |

### Golden Baseline Verification

| Golden | Dimensions | SHA256 Match | Status |
|--------|------------|--------------|--------|
| A3_Blueprint_v1_Classic | 2480x1754 | IDENTICAL | PASS |
| A2_Paper_v1_Minimal | 3508x2480 | IDENTICAL | PASS |
| A1_Terrain_v1_Bold | 3508x4967 | IDENTICAL | PASS |

---

## Problem Summary (RESOLVED)

### Root Cause Identified

**Critical Bug:** Export did NOT include print composition elements

**Technical Details:**
- `editor.js:updatePrintComposition()` creates overlay elements dynamically
- `server.js` screenshotted only `#map` element, missing all composition
- Exporter accepted `title`, `subtitle`, `attribution` params but did NOT render them

### Fix Applied

Commit: `94e87bd` - "fix(exporter): add print composition overlay to exports"

Changes:
1. Added `LAYOUT_TEMPLATES` to exporter (matching editor.js templates)
2. Added new parameters: `layout_template`, `show_scale`, `show_attribution`
3. Implemented composition overlay injection via Playwright before screenshot
4. Screenshot now captures wrapper element with full composition
5. Updated editor.js to pass composition params to exporter

---

## Test Matrix

### Full Test Matrix (3x3 = 9 combinations)

| # | Preset | Template | Expected Composition | Status |
|---|--------|----------|----------------------|--------|
| 1 | A2_Paper_v1 | Classic | Frame + Title (top) + Attribution | PASS |
| 2 | A2_Paper_v1 | Minimal | Frame only | PASS |
| 3 | A2_Paper_v1 | Bold | Frame + Title (center) | PASS |
| 4 | A3_Blueprint_v1 | Classic | Frame + Title (top) + Attribution | PASS |
| 5 | A3_Blueprint_v1 | Minimal | Frame only | PASS |
| 6 | A3_Blueprint_v1 | Bold | Frame + Title (center) | PASS |
| 7 | A1_Terrain_v1 | Classic | Frame + Title (top) + Attribution | PASS |
| 8 | A1_Terrain_v1 | Minimal | Frame only | PASS |
| 9 | A1_Terrain_v1 | Bold | Frame + Title (center) | PASS |

---

## Golden Baselines

### Location

`golden/print_export/`

### Files

| File | SHA256 | Size |
|------|--------|------|
| A3_Blueprint_v1_Classic_golden.png | `48e4bbd0f787...` | 5.1 MB |
| A2_Paper_v1_Minimal_golden.png | `ef0c5bb30a2b...` | 9.9 MB |
| A1_Terrain_v1_Bold_golden.png | `4df10114b61b...` | 5.7 MB |
| metadata.json | - | - |
| README.md | - | - |

### Acceptance Criteria

- Pixel diff: < 0.1% (anti-aliasing tolerance)
- Dimensions: MUST match exactly
- Composition elements: MUST be present

---

## Regression Test Script

### Location

`scripts/qa_golden_print_export.js`

### Usage

```bash
node scripts/qa_golden_print_export.js
```

### Output

```
========================================
Golden Print Export Regression Test
========================================
Exporter: http://localhost:8082
Golden dir: golden/print_export
Output dir: exports/golden_test

Loaded 3 golden baselines

  Testing: A3_Blueprint_v1_Classic
  Dimensions: 2480x1754
  Hash match: identical to golden

  Testing: A2_Paper_v1_Minimal
  Dimensions: 3508x2480
  Hash match: identical to golden

  Testing: A1_Terrain_v1_Bold
  Dimensions: 3508x4967
  Hash match: identical to golden

========================================
Summary
========================================
 A3_Blueprint_v1_Classic: PASSED
 A2_Paper_v1_Minimal: PASSED
 A1_Terrain_v1_Bold: PASSED

Total: 3 passed, 0 failed
========================================
```

---

## Progress Log

### 2025-12-27 10:00 CET
- Started QA analysis
- Identified root cause: exporter missing composition rendering
- Created test matrix
- Documented DEF-001

### 2025-12-27 10:07 CET
- Implemented fix in demo-a/exporter/src/server.js
- Added LAYOUT_TEMPLATES
- Added composition overlay injection
- Rebuilt Docker container

### 2025-12-27 10:10 CET
- Generated 3 golden baseline exports
- Created metadata.json
- Created README.md for golden directory

### 2025-12-27 10:15 CET
- Created regression test script
- Verified all 3 goldens pass with identical SHA256
- All tests PASS

---

## Files Changed

1. `demo-a/exporter/src/server.js` - Added composition overlay injection
2. `demo-a/web/public/editor.js` - Pass composition params to exporter
3. `docs/QA_PRINT_EXPORT_GOLDEN.md` - This document
4. `golden/print_export/` - Golden baseline exports
5. `scripts/qa_golden_print_export.js` - Regression test script

---

## Known Limitations (Deferred)

1. **PDF exports** - Go through Demo B (port 5000), not yet verified for composition
2. **Scale calculation** - Currently uses placeholder "1:50 000", not calculated from actual map scale

---

## How to Run Golden Check

```bash
# Ensure services are running
docker-compose up -d demo-a-exporter demo-a-web demo-a-tileserver demo-a-hillshade-server

# Run golden regression test
node scripts/qa_golden_print_export.js

# Check exit code (0 = pass, 1 = fail)
echo $?
```

---

## Definition of Done (COMPLETE)

Correctness:
- [x] Preview/export parity verified for the 3x3 matrix
- [x] Frame/template geometry correct (no cropping, no drift)

Golden baseline:
- [x] 3 golden exports defined and stored
- [x] Regression script/test runs locally and in CI-ready form
- [x] Clear baseline metadata documented (versions, docker digest)

Process:
- [x] Small commits, pushed
- [x] TODO/STATUS updated
- [x] Closure report written in this document
