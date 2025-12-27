# Demo B Golden Baselines

This directory contains golden baselines for Demo B (Mapnik) deterministic export verification.

## Reproducibility Contract

Demo B exports are guaranteed to be **SHA256 byte-identical** when:
- Same Docker image SHA is used
- Same font packages are installed
- Same data files are present
- Single-threaded rendering is used

## Golden Files

| ID | File | Dimensions | Purpose |
|----|------|------------|---------|
| A4_Quick_v1 | A4_Quick_v1_golden.png | 1240x1754 px | Fast CI smoke test |

## Running the Regression Test

```bash
node scripts/qa_golden_demo_b.js
```

## Regenerating Baselines

**Only regenerate when:**
- Dependency upgrade with documented visual comparison
- Bug fix correcting previously incorrect output
- New baseline after major version release

**Process:**
1. Open PR with `[BASELINE]` in title
2. Attach before/after visual comparison
3. Run: `node scripts/qa_golden_demo_b.js --regenerate`
4. Update SHA256 in `metadata.json`
5. Commit with explicit approval

## Acceptance Threshold

Demo B requires **exact byte-identity**. Any pixel difference is a failure.
This differs from Demo A which allows 0.1% tolerance for anti-aliasing.
