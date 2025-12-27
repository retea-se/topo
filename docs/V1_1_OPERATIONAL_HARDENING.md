# v1.1 Operational Hardening — Design & Policy Document

---

**Document Type**: Design and policy specification
**System Version**: v1.0.0 baseline
**Target**: v1.1 operational hardening
**Date**: 2025-12-27
**Author**: Claude (from strategic analysis session)

---

## Overview

This document defines the operational hardening strategy for v1.1, focused on protecting correctness over time rather than adding features. The goal is:

> "If someone updates dependencies, rebuilds Docker images, or touches rendering code, we will immediately know if determinism or correctness is broken."

---

## Part 1 — Reproducibility Contract

### What "Reproducible" Means

Reproducibility in this system has a precise, testable definition:

**Demo B PNG Output**:
Given identical inputs (preset, bbox, theme, layers, DPI, dimensions), the SHA256 hash of the output file MUST be identical across:
- Multiple invocations on the same machine
- Invocations on different machines with the same Docker image
- Invocations separated by time (days, weeks)

**Demo B PDF Output**:
PDF contains metadata (creation timestamp, producer string). Therefore:
- The **visual content** must be identical (rasterized comparison)
- The **file hash** may differ due to metadata
- A normalized comparison (stripping metadata) should produce identical hashes

**Demo B SVG Output**:
SVG is XML text. Reproducibility means:
- Element order must be stable
- Numeric precision must be consistent (no floating-point drift)
- Whitespace normalization should produce identical output

**Demo A Output**:
Demo A is NOT expected to be byte-identical. It is expected to be:
- Visually stable (pixel diff < 0.5% between runs)
- Dimensionally correct (exact pixel counts)
- Structurally consistent (same layers rendered)

### Scope of Reproducibility Guarantee

| Preset | Region | PNG | PDF | SVG |
|--------|--------|-----|-----|-----|
| A2_Paper_v1 | stockholm_core | Byte-identical | Visual-identical | Normalized-identical |
| A3_Blueprint_v1 | stockholm_core | Byte-identical | Visual-identical | Normalized-identical |
| A1_Terrain_v1 | stockholm_wide | Byte-identical | Visual-identical | Normalized-identical |
| A4_Quick_v1 | stockholm_core | Byte-identical | Visual-identical | Normalized-identical |
| (any) | svealand | Best-effort | Best-effort | Best-effort |

**Why Svealand is best-effort**: The dataset is large (944 MB DEM, 653 MB tiles). Full reproducibility testing for Svealand would require storing ~100+ MB golden files and multi-hour render times. The contract is: Svealand should be visually correct, but byte-identity is not guaranteed.

### Environmental Conditions

Reproducibility is guaranteed ONLY when:

1. **Docker image is identical**: Same image SHA, not just same tag
2. **Font packages are identical**: DejaVu Sans at specific version
3. **Data files are identical**: Same OSM tiles, same DEM, same hillshade
4. **No concurrent renders**: Single-threaded rendering assumed

If any of these conditions change, reproducibility must be re-verified.

### Reproducibility Contract (Formal Statement)

```
REPRODUCIBILITY CONTRACT v1.0

1. SCOPE: Demo B PNG exports for presets A2_Paper_v1, A3_Blueprint_v1,
   A1_Terrain_v1, A4_Quick_v1 with default parameters.

2. GUARANTEE: Given Docker image SHA X and data snapshot Y, running
   the same export N times will produce N files with identical SHA256
   hashes.

3. VERIFICATION: This contract is verified by comparing export hashes
   against stored golden hashes.

4. BREACH: If verification fails, the system is considered broken.
   No exports should be released until reproducibility is restored.

5. RE-BASELINING: A new baseline may be established ONLY with:
   - Documented reason (e.g., "upgraded Mapnik 3.1 → 3.2")
   - Major or minor version bump
   - Explicit approval in commit message

6. EXCLUSIONS: Demo A exports, Svealand region, custom bbox exports,
   modified presets.
```

---

## Part 2 — Golden Export Strategy

### Which Presets Need Golden Files

**Tier 1 (Required)**:
- `A2_Paper_v1` at stockholm_core (most common use case)
- `A3_Blueprint_v1` at stockholm_core (locked preset, must be invariant)

**Tier 2 (Recommended)**:
- `A1_Terrain_v1` at stockholm_wide (larger region, different render path)
- `A4_Quick_v1` at stockholm_core (small, fast, good for CI)

**Tier 3 (Not Recommended)**:
- Svealand exports (too large, too slow)
- Modified preset exports (infinite variations)
- Demo A exports (not deterministic)

### Golden File Contents

For each golden export, store:

| Artifact | Purpose | Storage |
|----------|---------|---------|
| `preset_id.sha256` | Hash of the PNG | Git repo |
| `preset_id.dimensions.json` | Width, height, file size | Git repo |
| `preset_id.png.lz4` | Compressed golden PNG | Git LFS or external |
| `preset_id.pdf.sha256` | Hash of PDF (metadata-stripped) | Git repo |

**Total storage estimate**:
- A2_Paper_v1 PNG: ~1.6 MB → ~400 KB compressed
- A3_Blueprint_v1 PNG: ~800 KB → ~200 KB compressed
- A1_Terrain_v1 PNG: ~2 MB → ~500 KB compressed
- A4_Quick_v1 PNG: ~400 KB → ~100 KB compressed

**Total**: ~1.2 MB compressed, acceptable for Git LFS.

### Where Golden Files Should Live

**Recommended**: Separate `golden/` directory in repo, with actual PNGs in Git LFS.

```
golden/
├── README.md           # Explains what these are
├── BASELINE.md         # Current baseline version and date
├── A2_Paper_v1/
│   ├── stockholm_core.sha256
│   ├── stockholm_core.dimensions.json
│   └── stockholm_core.png.lz4
├── A3_Blueprint_v1/
│   └── ...
└── ...
```

**Why not external storage**: Golden files are small enough for LFS. External storage adds deployment complexity and potential availability issues.

### Regeneration Policy

Golden files should be regenerated:

1. **Never automatically** — manual process only
2. **Only when**: Major dependency upgrade, intentional render change, new baseline
3. **Process**: Developer runs export, compares visually, updates hashes, commits with explanation
4. **Approval**: Commit message must include `[BASELINE]` tag and reason

### Avoiding Golden-File Sprawl

**Rules**:
- Maximum 4 golden presets (Tier 1 + Tier 2)
- No golden files for modified presets
- No golden files for themes beyond default
- No golden files for custom bboxes
- Review any PR that adds golden files

**If someone asks for more golden files**: Ask "What regression would this catch that the existing 4 don't?"

---

## Part 3 — CI / Verification Design (Conceptual)

### Pipeline Stages

**Stage 1: Static Analysis (every push)**
- Lint Python and JavaScript
- Validate JSON schemas (presets, config)
- Check for hardcoded paths or secrets
- Duration: < 1 minute

**Stage 2: Unit Tests (every push)**
- Test validation functions
- Test filename generation
- Test constraint checking
- Duration: < 2 minutes

**Stage 3: Smoke Test (every push to main)**
- Start Docker Compose stack
- Verify all services respond (health checks)
- Render A4_Quick_v1 (smallest, fastest)
- Verify dimensions are correct
- Duration: < 5 minutes

**Stage 4: Reproducibility Check (nightly or pre-release)**
- Render all Tier 1 golden presets
- Compare SHA256 against stored hashes
- Generate pixel-diff report if hash mismatch
- Duration: < 15 minutes

**Stage 5: Full QA (pre-release only)**
- Render all Tier 1 + Tier 2 presets
- Run Playwright E2E tests
- Verify Demo A visual stability
- Duration: < 30 minutes

### Failure Semantics

| Check | Failure Type | Action |
|-------|--------------|--------|
| Lint fails | Hard stop | Block merge |
| Unit test fails | Hard stop | Block merge |
| Smoke test fails | Hard stop | Block merge |
| Reproducibility hash mismatch | Hard stop | Block release, investigate |
| Reproducibility pixel diff < 1% | Warning | Review, may proceed |
| Reproducibility pixel diff > 1% | Hard stop | Block release |
| Demo A visual diff > 5% | Warning | Review |

### Handling Intentional Changes

When a change intentionally affects rendering output:

1. **PR description** must include `[RENDER CHANGE]` tag
2. **Before/after comparison** must be attached (screenshots or pixel diff)
3. **Golden hashes** must be updated in the same PR
4. **BASELINE.md** must be updated with date and reason
5. **Version bump**: Minor version if visual change, major if breaking

Example commit message:
```
[RENDER CHANGE] Upgrade Mapnik 3.1.0 → 3.2.0

Visual changes:
- Slightly sharper text rendering
- Minor anti-aliasing differences at edges

Before/after comparison: see attached images
Golden hashes updated: A2_Paper_v1, A3_Blueprint_v1, A1_Terrain_v1, A4_Quick_v1
```

---

## Part 4 — Dependency & Environment Risk Management

### OS Updates

**What could break**:
- Kernel changes affecting graphics drivers (Demo A)
- System library updates (libc, libpng, libcairo)
- Package manager changes to default fonts

**Detection**:
- Reproducibility check fails
- Visual diff in Demo A exports

**Mitigation**:
- Pin Docker base image to specific SHA, not `:latest`
- Document which base image version is verified
- Test on fresh base image before upgrading

### Font Packages

**What could break**:
- DejaVu Sans update changes glyph rendering
- Font substitution if package missing
- Different font path in new image

**Detection**:
- Text appears different in exports
- Reproducibility hash mismatch
- Font-related warnings in logs

**Mitigation**:
- Pin font package version in Dockerfile: `dejavu-fonts-ttf=2.37-r1`
- Verify font path in startup checks
- Add font rendering to smoke test (export with text, verify hash)

### Mapnik / Cairo / GDAL Updates

**What could break**:
- Mapnik: Line rendering, text placement, anti-aliasing
- Cairo: PDF/SVG generation, color handling
- GDAL: Raster processing, projection transformations

**Detection**:
- Reproducibility check fails
- Visual artifacts in output
- Changed file sizes

**Mitigation**:
- Pin exact versions in requirements.txt / Dockerfile
- Never upgrade multiple rendering libraries simultaneously
- Each upgrade is a separate PR with before/after comparison

**Version pinning example**:
```dockerfile
RUN pip install \
    mapnik==3.1.0 \
    cairocffi==1.6.1 \
    GDAL==3.8.0
```

### Node / Python Version Drift

**What could break**:
- Python: Float formatting, JSON serialization order, library compatibility
- Node: Playwright behavior, async timing, V8 rendering differences

**Detection**:
- Tests fail with version mismatch
- Subtle timing differences in Demo A exports

**Mitigation**:
- Pin Python version in Dockerfile: `FROM python:3.11.7-slim`
- Pin Node version: `FROM node:20.10.0-slim`
- Use `.python-version` and `.nvmrc` files for local development
- Fail CI if version doesn't match expected

### Docker Base Image Updates

**What could break**:
- Everything above, compounded
- Package availability changes
- Default configurations change

**Detection**:
- Reproducibility check fails after image rebuild
- Services fail to start

**Mitigation**:
- Never use `:latest` tags
- Pin to specific image digest: `python:3.11.7-slim@sha256:abc123...`
- Document verified image digests in `BASELINE.md`
- Quarterly review of base image updates (scheduled, not reactive)

### Risk Summary Table

| Dependency | Risk Level | Detection Method | Pinning Strategy |
|------------|------------|------------------|------------------|
| OS / base image | High | Reproducibility check | SHA digest |
| Fonts | High | Text rendering test | Package version |
| Mapnik | Critical | Hash comparison | Exact version |
| Cairo | High | PDF/SVG comparison | Exact version |
| GDAL | Medium | Raster comparison | Exact version |
| Python | Medium | Unit tests | Major.minor.patch |
| Node | Medium | E2E tests | Major.minor.patch |
| Playwright | Low | E2E tests | Exact version |

---

## Part 5 — Developer Workflow & Guardrails

### What Requires a Major Version Bump

- Breaking change to export API (different parameters)
- Removal of a preset
- Change to preset schema that invalidates existing presets
- Dropping support for a region (e.g., removing svealand)
- Fundamental architecture change (e.g., replacing Mapnik)

### What Requires a Minor Version Bump

- New preset added
- New theme added
- Visual rendering change (even if subtle)
- New export format supported
- New region added
- Dependency upgrade that affects output

### What Requires a Patch Version

- Bug fixes that don't affect rendering
- Documentation updates
- Performance improvements with identical output
- Logging changes
- Error message improvements

### When Is SHA256 Re-baselining Allowed

**Allowed**:
- Dependency upgrade with documented visual comparison
- Bug fix that corrects previously incorrect output
- New baseline after major version release

**Not allowed**:
- "It's slightly different but looks fine"
- "The old baseline was probably wrong"
- "Nobody will notice"

**Process**:
1. Open PR with `[BASELINE]` in title
2. Attach before/after visual comparison
3. Update golden hashes
4. Update BASELINE.md with date, reason, and author
5. Require explicit approval from maintainer

### How Rendering Changes Should Be Reviewed

Every PR that touches:
- `theme_to_mapnik_xml.py`
- `mapnik_renderer.py`
- Any theme JSON file
- Layer ordering logic
- Mapnik XML templates

Must include:
1. Visual diff (before/after screenshots)
2. Hash comparison for at least one preset
3. Explanation of why the change is needed
4. Assessment of whether golden files need updating

### Required Tests Before Merging

| Change Type | Required Tests |
|-------------|----------------|
| Any code change | Lint + Unit tests |
| API change | Smoke test |
| Render logic change | Reproducibility check (A4_Quick_v1 minimum) |
| Theme change | Visual comparison + hash check |
| Preset change | Schema validation + render test |
| Dockerfile change | Full rebuild + reproducibility check |
| Dependency upgrade | Full QA suite |

### Institutional Memory Checklist

Before merging any rendering-related PR, reviewer should ask:

1. Is this change necessary for v1.x, or should it wait for v2?
2. Does this change affect Demo B determinism?
3. Are golden hashes updated if needed?
4. Is the change documented in CHANGELOG?
5. Is the version bump appropriate?
6. Can this change be reverted cleanly?

---

## Part 6 — Scope Control & Anti-Patterns

### What NOT to Automate

**Auto-updating dependencies**:
- Dependabot or similar should NOT auto-merge
- Each dependency update is a potential reproducibility break
- Manual review required for all updates

**Auto-regenerating golden files**:
- Golden files are a contract, not a cache
- Automatic regeneration defeats the purpose
- Manual process with human judgment required

**Auto-scaling render workers**:
- The system is designed for single-user, single-render operation
- Parallelism introduces non-determinism risks
- If you need horizontal scaling, you need a different architecture

### What NOT to Optimize Yet

**Render caching**:
- "Cache the tiles so re-exports are faster"
- Problem: Cache invalidation is hard. When does a cached tile expire? When the theme changes? When the data updates? When Mapnik is upgraded?
- Current design: Fresh render every time. Slow but correct.
- Optimize only if users complain about speed AND you have a robust invalidation strategy.

**Tile pre-rendering**:
- "Pre-render all zoom levels for all themes"
- Problem: 9 themes x 3 regions x 6 zoom levels x thousands of tiles = millions of files. Storage explosion. Maintenance nightmare.
- Current design: Render on demand.
- Pre-render only for specific, frozen presets with infinite shelf life.

**Lazy Docker image building**:
- "Only rebuild the layer that changed"
- Problem: Docker layer caching can mask dependency changes. A library might be cached from 3 months ago.
- Policy: Full rebuild for any release. No layer caching in CI.

### What Smells Should Trigger Design Review

| Smell | Why It's Concerning |
|-------|---------------------|
| "Make Demo A match Demo B exactly" | Architecturally impossible. Pursuing this will waste months. |
| "Add user-defined presets" | Requires user accounts, storage, validation. Different product. |
| "Support arbitrary bboxes" | Untested data coverage. Breaks the curated-region guarantee. |
| "Make exports faster with parallelism" | Non-determinism risk. Complexity for unclear benefit. |
| "Cache frequently-used exports" | Invalidation complexity. Who defines "frequently used"? |
| "Auto-download DEM for any region" | Copernicus API rate limits. Disk space explosion. Data quality unknown. |
| "Add a REST API for external use" | Who is the user? What's the contract? Security implications? |

### The Golden Question

Before any v1.x feature request is approved, ask:

> "Does this protect reproducibility, or does it risk it?"

If the answer is "risks it" or "unclear," the feature belongs in v2+ or never.

---

## Conclusion

### If only these guardrails were added and nothing else in v1.1, would the system be safer long-term? Why?

**Yes, significantly safer.**

The v1.0 system works correctly *today*, but has no automated verification that it will work correctly *tomorrow*. The risks are:

1. **Silent regression**: Someone upgrades a library, exports look slightly different, no one notices until a customer complains.

2. **Baseline drift**: Over time, small changes accumulate. "It's always been like this" becomes the excuse for broken reproducibility.

3. **Institutional knowledge loss**: The current developers know what the output should look like. Future developers won't.

4. **Accidental breakage**: A well-intentioned refactor touches render logic and breaks determinism. Without automated checks, this ships to production.

These guardrails address all four risks:

- **Reproducibility contract** defines what "correct" means, in writing
- **Golden exports** capture what correct output looks like, in files
- **CI verification** catches drift before it ships
- **Developer workflows** ensure changes are deliberate and documented

The cost is modest: ~1.2 MB of golden files, a few hours of CI setup, and a BASELINE.md file. The benefit is confidence that the core value proposition—deterministic, reliable print output—remains intact indefinitely.

A system without guardrails is only as good as the current maintainer's memory. A system with guardrails is as good as its contracts.

---

*End of design document. No implementation steps included.*
