# Operational Runbook - v1.1 Hardening

**Version**: 1.1.0
**Last Updated**: 2025-12-27

This runbook provides step-by-step procedures for common operations related to the v1.1 Operational Hardening system.

---

## Table of Contents

1. [Running v1.1 Checks Locally](#running-v11-checks-locally)
2. [Updating Golden Baselines](#updating-golden-baselines)
3. [Troubleshooting](#troubleshooting)
4. [CI Pipeline Overview](#ci-pipeline-overview)
5. [Dependency Management](#dependency-management)

---

## Running v1.1 Checks Locally

### Prerequisites

```bash
# Ensure Docker is running
docker info

# Start the Demo B stack
docker compose up -d demo-b-db demo-b-renderer demo-b-api

# Wait for services (or check manually)
curl http://localhost:5000/health
curl http://localhost:5001/health
```

### Run Tier 1 Check (Fast, ~2 min)

For every PR that touches rendering code:

```bash
node scripts/qa_golden_demo_b.js --tier1
```

Expected output:
```
[TIER1] Testing: A4_Quick_v1
  Hash match: IDENTICAL to golden baseline
[TIER1] Testing: A2_Paper_v1
  Hash match: IDENTICAL to golden baseline

Total: 2 passed, 0 failed, 0 pending
```

### Run Full Check (Tier 1 + Tier 2, ~10 min)

For nightly or pre-release verification:

```bash
node scripts/qa_golden_demo_b.js
```

### Run Demo A Golden Check (Visual Comparison)

Demo A uses GPU rendering and allows 0.1% tolerance:

```bash
node scripts/qa_golden_print_export.js
```

---

## Updating Golden Baselines

### When to Update

**Allowed reasons:**
- Dependency upgrade with documented visual comparison
- Bug fix correcting previously incorrect output
- New baseline after major version release

**NOT allowed:**
- "It's slightly different but looks fine"
- "The old baseline was probably wrong"
- "Nobody will notice"

### Step-by-Step Process

#### 1. Document the Reason

Before regenerating, write a clear explanation:
- What changed (dependency, bug fix, etc.)
- Why it's necessary
- Visual comparison if applicable

#### 2. Regenerate Baselines

```bash
# All baselines
node scripts/qa_golden_demo_b.js --regenerate

# Specific preset only
node scripts/qa_golden_demo_b.js --regenerate-only A4_Quick_v1
```

#### 3. Update Metadata

Edit `golden/demo_b/metadata.json` with new SHA256 hashes:

```json
{
  "id": "A4_Quick_v1",
  "sha256": "<new-hash-from-output>"
}
```

#### 4. Update BASELINE.md

Add entry to `golden/demo_b/BASELINE.md` regeneration history table.

#### 5. Commit with [BASELINE] Tag

```bash
git add golden/demo_b/
git commit -m "[BASELINE] <reason>

Presets updated: <list>
Visual comparison: <attached/verified>"
```

### Using the GitHub Workflow

Alternatively, use the `Update Golden Baselines` workflow:

1. Go to Actions > Update Golden Baselines
2. Enter documented reason
3. Select presets to regenerate
4. Type "I understand" to confirm
5. Download artifacts and update metadata.json

---

## Troubleshooting

### Common Failure Causes

#### Fonts Missing or Wrong Version

**Symptoms:**
- Text rendering differs
- SHA256 mismatch

**Fix:**
```bash
# Check installed fonts in container
docker exec demo-b-renderer fc-list | grep -i dejavu

# Verify font package
docker exec demo-b-renderer dpkg -l | grep fonts-dejavu
```

#### Locale/Encoding Issues

**Symptoms:**
- String formatting differences
- Floating point precision issues

**Fix:**
Ensure `LC_ALL=C.UTF-8` is set in Dockerfile (already configured).

#### Docker Image Drift

**Symptoms:**
- Works locally but fails in CI
- Different hash on different machines

**Fix:**
```bash
# Rebuild without cache
docker compose build --no-cache demo-b-renderer

# Verify image
docker images | grep demo-b-renderer
```

#### Stale Database State

**Symptoms:**
- Missing OSM data
- Different map content

**Fix:**
```bash
# Reset database
docker compose down -v
docker compose up -d demo-b-db
# Re-import data
```

#### Hillshade/Contour Data Missing

**Symptoms:**
- Terrain layers not rendering
- Coverage check fails

**Fix:**
```bash
# Check terrain files
ls -la data/terrain/hillshade/

# Regenerate if needed
./scripts/build_full_coverage.sh
```

### Debug Commands

```bash
# View container logs
docker compose logs demo-b-renderer

# Enter container
docker exec -it demo-b-renderer bash

# Check Python environment
docker exec demo-b-renderer python -c "import mapnik; print(mapnik.mapnik_version_string())"

# Check font path
docker exec demo-b-renderer fc-match "DejaVu Sans"
```

---

## CI Pipeline Overview

### Pipeline Stages

| Stage | Trigger | Duration | Purpose |
|-------|---------|----------|---------|
| Smoke Test | Every push | ~2 min | Basic functionality |
| Demo B Reproducibility (Tier 1) | PR to main | ~5 min | SHA256 verification |
| Demo B Reproducibility (Full) | Nightly | ~15 min | Complete tier coverage |
| Demo A Golden | Nightly | ~10 min | Visual regression |

### Workflow Files

| Workflow | File | Purpose |
|----------|------|---------|
| Smoke Test | `.github/workflows/smoke-test.yml` | Fast health check |
| Demo B Reproducibility | `.github/workflows/demo-b-reproducibility.yml` | SHA256 verification |
| Golden Regression | `.github/workflows/golden-regression.yml` | Demo A visual check |
| Update Baselines | `.github/workflows/update-baselines.yml` | Manual regeneration |

### CI Artifacts

On failure, these artifacts are uploaded:
- `exports/golden_test_demo_b/` - Test exports
- `TEST_REPORT.md` - Detailed results
- Docker logs

---

## Dependency Management

### Critical Dependencies

| Dependency | Location | Impact |
|------------|----------|--------|
| Python 3.11.7 | Dockerfile base | Core runtime |
| Mapnik 3.1.0 | apt (bookworm) | Rendering engine |
| DejaVu fonts | apt | Text rendering |
| GDAL 3.6.2 | apt (bookworm) | Raster processing |
| Flask 3.0.0 | requirements.txt | API framework |
| pycairo 1.26.0 | requirements.txt | PDF/SVG output |

### Upgrade Procedure

1. Create a feature branch
2. Update version in Dockerfile/requirements.txt
3. Rebuild container: `docker compose build --no-cache demo-b-renderer`
4. Run full golden test: `node scripts/qa_golden_demo_b.js`
5. If tests fail, decide:
   - Revert upgrade, OR
   - Regenerate baselines with documentation
6. Open PR with `[RENDER CHANGE]` tag if visual output changed

### Version Pinning Philosophy

- **Pin exactly** for rendering-critical packages (mapnik, fonts, cairo)
- **Pin major.minor** for framework packages (flask)
- **Never use** `latest` tags in Dockerfiles
- **Document** every upgrade with before/after comparison

---

## Quick Reference

### Test Commands

```bash
# Fast check
node scripts/qa_golden_demo_b.js --tier1

# Full check
node scripts/qa_golden_demo_b.js

# Demo A check
node scripts/qa_golden_print_export.js
```

### Regenerate Commands

```bash
# All baselines
node scripts/qa_golden_demo_b.js --regenerate

# Specific preset
node scripts/qa_golden_demo_b.js --regenerate-only A4_Quick_v1
```

### Debug Commands

```bash
# Check service health
curl http://localhost:5000/health
curl http://localhost:5001/health
curl http://localhost:8082/health

# View logs
docker compose logs demo-b-renderer

# Rebuild container
docker compose build --no-cache demo-b-renderer
```

---

## References

- [V1_1_OPERATIONAL_HARDENING.md](V1_1_OPERATIONAL_HARDENING.md) - Full design document
- [golden/demo_b/README.md](../golden/demo_b/README.md) - Golden baseline details
- [golden/demo_b/BASELINE.md](../golden/demo_b/BASELINE.md) - Baseline history

---

*Last updated: 2025-12-27 | v1.1 Operational Hardening*
