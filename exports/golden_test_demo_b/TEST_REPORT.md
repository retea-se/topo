# Demo B Golden Regression Test Report

**Generated**: 2025-12-27T10:41:54.785Z
**Duration**: 4.2s
**API**: http://localhost:5000
**Mode**: FULL (Tier 1 + Tier 2)

## Summary

| Status | Count |
|--------|-------|
| PASS | 4 |
| FAIL | 0 |
| PENDING | 0 |
| REGENERATED | 0 |

**Overall**: PASSED

## Results

| Preset | Tier | Status | Dimensions | SHA256 (first 16 chars) | Duration |
|--------|------|--------|------------|-------------------------|----------|
| A4_Quick_v1 | tier1 | `PASS` | 1240x1754 | `0c809ea6aeaf39a4...` | 0.7s |
| A2_Paper_v1 | tier1 | `PASS` | 2480x3508 | `125865871093a3f7...` | 1.6s |
| A3_Blueprint_v1 | tier2 | `PASS` | 2480x1754 | `6bc643da1600f0ba...` | 0.7s |
| A1_Terrain_v1 | tier2 | `PASS` | 3508x4967 | `5e899f5fc0d2e946...` | 1.2s |

## Reproducibility Contract

Per v1.1 Operational Hardening:
- Demo B PNG exports must be **byte-identical** (SHA256 match)
- Conditions: Same Docker image, fonts, data files, single-threaded rendering
- Any mismatch indicates **broken determinism** - do not release

See: docs/V1_1_OPERATIONAL_HARDENING.md
