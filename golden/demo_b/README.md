# Demo B Golden Baselines

## Purpose

This directory contains **authoritative** golden baseline exports for Demo B (Mapnik) deterministic rendering.

Unlike Demo A (which uses GPU-dependent MapLibre), Demo B uses Mapnik for CPU-based deterministic rendering. The exports in this directory represent the **byte-identical** output that must be reproduced.

## Quick Reference

```bash
# Run verification (Tier 1 + Tier 2)
node scripts/qa_golden_demo_b.js

# Fast check (Tier 1 only - for every PR)
node scripts/qa_golden_demo_b.js --tier1

# Regenerate baselines (requires approval!)
node scripts/qa_golden_demo_b.js --regenerate
```

## Tier System

**Tier 1** (Required for every PR touching render code):

| ID | File | Dimensions | Purpose |
|----|------|------------|---------|
| A4_Quick_v1 | A4_Quick_v1_golden.png | 1240x1754 px | Fast CI smoke test (~5s) |
| A2_Paper_v1 | A2_Paper_v1_golden.png | 2480x3508 px | Primary wall map format |

**Tier 2** (Recommended for nightly/pre-release):

| ID | File | Dimensions | Purpose |
|----|------|------------|---------|
| A3_Blueprint_v1 | A3_Blueprint_v1_golden.png | 2480x1754 px | Technical drawing format |
| A1_Terrain_v1 | A1_Terrain_v1_golden.png | 3508x4967 px | Large terrain map (stockholm_wide) |

## Reproducibility Contract

Demo B exports are guaranteed to be **SHA256 byte-identical** when:
- Same Docker image SHA is used
- Same font packages are installed (DejaVu Sans)
- Same data files are present (OSM tiles, DEM, hillshade)
- Single-threaded rendering is used

## Regenerating Baselines

**Only regenerate when:**
- Dependency upgrade with documented visual comparison
- Bug fix correcting previously incorrect output
- New baseline after major version release

**NOT allowed reasons:**
- "It's slightly different but looks fine"
- "The old baseline was probably wrong"
- "Nobody will notice"

**Process:**
1. Open PR with `[BASELINE]` in title
2. Attach before/after visual comparison
3. Run: `node scripts/qa_golden_demo_b.js --regenerate`
4. Update SHA256 hashes in `metadata.json`
5. Update `BASELINE.md` with date, reason, author
6. Commit with explicit maintainer approval

## Acceptance Threshold

Demo B requires **exact byte-identity**. ANY pixel difference is a failure.

This differs from Demo A which allows 0.1% tolerance for anti-aliasing due to GPU rendering variations.

## Files

| File | Purpose |
|------|---------|
| `metadata.json` | Golden definitions, SHA256 hashes, render params |
| `BASELINE.md` | Baseline history, regeneration log |
| `README.md` | This documentation |
| `*_golden.png` | Actual golden baseline images |

---

See: `docs/V1_1_OPERATIONAL_HARDENING.md` for full contract.
