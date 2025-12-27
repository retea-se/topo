# Golden Print Export Baselines

This directory contains golden baseline exports for regression testing of the print composition feature.

## Purpose

These exports serve as reference images to verify that:
1. Print composition elements (frame, title, subtitle, scale, attribution) are correctly rendered
2. Export output matches preview composition
3. Layout templates produce consistent results

## Files

| File | Preset | Template | Purpose |
|------|--------|----------|---------|
| `A3_Blueprint_v1_Classic_golden.png` | A3 Blueprint | Classic | Text + frame validation |
| `A2_Paper_v1_Minimal_golden.png` | A2 Paper | Minimal | Frame + whitespace validation |
| `A1_Terrain_v1_Bold_golden.png` | A1 Terrain | Bold | Terrain + heavy composition |

## Metadata

See `metadata.json` for:
- SHA256 hashes
- Exact dimensions
- Export parameters
- Acceptance thresholds

## Running Regression Tests

```bash
node scripts/qa_golden_print_export.js
```

## Regenerating Baselines

If intentional changes are made to composition rendering:

1. Regenerate exports with the same parameters (see metadata.json)
2. Update SHA256 hashes in metadata.json
3. Commit with a clear message explaining the visual change

## Acceptance Criteria

- Pixel diff: < 0.1% (anti-aliasing tolerance)
- Dimensions: MUST match exactly
- Composition elements: MUST be present

## Generated

Date: 2025-12-27
Generator: demo-a-exporter
Docker image: topo-demo-a-exporter:latest
