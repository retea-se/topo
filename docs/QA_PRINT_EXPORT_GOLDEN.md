# QA Print Export Golden Audit Report

Generated: 2025-12-27 10:46:42

## Summary

| Status | Count |
|--------|-------|
| N/A | 18 |


**Note**: Preview and export images have different sizes by design:
- Preview is scaled to fit the viewport (typically much smaller)
- Export is the actual print resolution

A "N/A" status means sizes don't match (expected behavior).
Only same-size comparisons can produce PASS/WARN/FAIL results.

## Thresholds

- **PASS**: < 0.1% pixel difference
- **WARN**: 0.1% - 0.5% pixel difference
- **FAIL**: > 0.5% pixel difference

## Detailed Results

| Preset | Template | Variant | Status | Diff % | Preview Size | Export Size |
|--------|----------|---------|--------|--------|--------------|-------------|
| A1_Terrain_v1 | bold | A | N/A | 100.0000% | 1280x720 | 3508x4967 |
| A1_Terrain_v1 | bold | B | N/A | 100.0000% | 1280x720 | 3508x4967 |
| A1_Terrain_v1 | classic | A | N/A | 100.0000% | 1280x720 | 3508x4967 |
| A1_Terrain_v1 | classic | B | N/A | 100.0000% | 1280x720 | 3508x4967 |
| A1_Terrain_v1 | minimal | A | N/A | 100.0000% | 1280x720 | 3508x4967 |
| A1_Terrain_v1 | minimal | B | N/A | 100.0000% | 1280x720 | 3508x4967 |
| A2_Paper_v1 | bold | A | N/A | 100.0000% | 1280x720 | 3508x2480 |
| A2_Paper_v1 | bold | B | N/A | 100.0000% | 1280x720 | 3508x2480 |
| A2_Paper_v1 | classic | A | N/A | 100.0000% | 1280x720 | 3508x2480 |
| A2_Paper_v1 | classic | B | N/A | 100.0000% | 1280x720 | 3508x2480 |
| A2_Paper_v1 | minimal | A | N/A | 100.0000% | 1280x720 | 3508x2480 |
| A2_Paper_v1 | minimal | B | N/A | 100.0000% | 1280x720 | 3508x2480 |
| A3_Blueprint_v1 | bold | A | N/A | 100.0000% | 1280x720 | 2480x1754 |
| A3_Blueprint_v1 | bold | B | N/A | 100.0000% | 1280x720 | 2480x1754 |
| A3_Blueprint_v1 | classic | A | N/A | 100.0000% | 1280x720 | 2480x1754 |
| A3_Blueprint_v1 | classic | B | N/A | 100.0000% | 1280x720 | 2480x1754 |
| A3_Blueprint_v1 | minimal | A | N/A | 100.0000% | 1280x720 | 2480x1754 |
| A3_Blueprint_v1 | minimal | B | N/A | 100.0000% | 1280x720 | 2480x1754 |


## Artifact Locations

All audit artifacts are stored in:
```
exports/golden_audit/<preset>/<template>/variant_<A|B>/
```

Each case folder contains:
- `preview.png` - Screenshot of the editor with composition overlay
- `export.png` - PNG export from the exporter service
- `diff.png` - Visual diff highlighting differences (if comparable)
- `diff.json` - Pixel comparison metrics
- `meta.json` - Test metadata and settings
- `console.json` - Browser console logs

## How to Run

```bash
# Run the audit (creates artifacts)
npx playwright test scripts/qa_print_export_golden_audit.spec.js --workers=1

# Run the comparison (generates this report)
python scripts/compare_preview_export.py
```
