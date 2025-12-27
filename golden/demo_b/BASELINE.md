# Demo B Golden Baselines

**Current Version**: v1.0.0
**Last Updated**: 2025-12-27
**Status**: PENDING (initial baselines not yet established)

## Overview

This directory contains golden baseline exports for Demo B (Mapnik) deterministic rendering verification.

Per the v1.1 Operational Hardening contract:
- Demo B exports MUST be **byte-identical** (SHA256 match) across invocations
- Any mismatch indicates **broken determinism** and blocks release

## Baseline Presets

### Tier 1 (Required for every PR touching render code)

| Preset | Region | Purpose | SHA256 |
|--------|--------|---------|--------|
| A4_Quick_v1 | stockholm_core | Fast CI smoke test | PENDING |
| A2_Paper_v1 | stockholm_core | Primary wall map format | PENDING |

### Tier 2 (Recommended for nightly/pre-release)

| Preset | Region | Purpose | SHA256 |
|--------|--------|---------|--------|
| A3_Blueprint_v1 | stockholm_core | Technical drawing format | PENDING |
| A1_Terrain_v1 | stockholm_wide | Large terrain map | PENDING |

## Regeneration History

| Date | Author | Reason | Version |
|------|--------|--------|---------|
| 2025-12-27 | Initial | v1.1 Operational Hardening setup | v1.0.0 |

## How to Regenerate Baselines

**Only do this with documented approval!**

1. Ensure Docker stack is running: `docker compose up -d`
2. Wait for services to be healthy
3. Run regeneration:
   ```bash
   # Regenerate all baselines
   node scripts/qa_golden_demo_b.js --regenerate

   # Or regenerate a specific preset
   node scripts/qa_golden_demo_b.js --regenerate-only A4_Quick_v1
   ```
4. Copy new SHA256 hashes from output to `metadata.json`
5. Update this BASELINE.md with date, author, and reason
6. Commit with `[BASELINE]` tag in message

## Verification

Run verification locally:
```bash
# Full test (Tier 1 + Tier 2)
node scripts/qa_golden_demo_b.js

# Tier 1 only (faster, for quick checks)
node scripts/qa_golden_demo_b.js --tier1
```

## Files

| File | Description |
|------|-------------|
| `metadata.json` | Golden definitions, SHA256 hashes, params |
| `BASELINE.md` | This file - baseline history and status |
| `*_golden.png` | Actual golden baseline images |

## Reproducibility Conditions

For baseline verification to be valid, these conditions must be identical:

1. **Docker image SHA** - Same exact image, not just same tag
2. **Font packages** - DejaVu Sans at specific version
3. **Data files** - OSM tiles, DEM, hillshade unchanged
4. **Single-threaded** - No parallel rendering

If any condition changes, baselines must be re-verified.

---

See: `docs/V1_1_OPERATIONAL_HARDENING.md` for full contract details.
