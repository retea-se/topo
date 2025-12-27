#!/usr/bin/env python3
"""
Preview vs Export Comparison Tool

Compares preview.png against export.png for each audit case
and generates diff images and summary report.

Usage:
    python scripts/compare_preview_export.py

Outputs:
    - diff.png for each case (where differences exist)
    - diff.json with pixel difference metrics
    - docs/QA_PRINT_EXPORT_GOLDEN.md with summary table
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime

# Try to import PIL, provide helpful message if missing
try:
    from PIL import Image
    import numpy as np
except ImportError:
    print("Error: PIL and numpy are required.")
    print("Install with: pip install Pillow numpy")
    sys.exit(1)

# Configuration
AUDIT_DIR = Path(__file__).parent.parent / "exports" / "golden_audit"
DOCS_DIR = Path(__file__).parent.parent / "docs"

# Thresholds
THRESHOLD_FAIL = 0.5    # >0.5% = FAIL
THRESHOLD_WARN = 0.1    # 0.1-0.5% = WARN
# <0.1% = PASS


def calculate_pixel_diff(img1_path: Path, img2_path: Path) -> dict:
    """Calculate pixel difference between two images."""
    result = {
        "compared": False,
        "error": None,
        "diff_percent": None,
        "diff_pixels": None,
        "total_pixels": None,
        "dimensions_match": None,
        "img1_size": None,
        "img2_size": None
    }

    try:
        img1 = Image.open(img1_path).convert("RGBA")
        img2 = Image.open(img2_path).convert("RGBA")

        result["img1_size"] = img1.size
        result["img2_size"] = img2.size

        # Check dimensions
        if img1.size != img2.size:
            result["dimensions_match"] = False
            result["error"] = f"Size mismatch: {img1.size} vs {img2.size}"
            # For now, we can't meaningfully compare different sized images
            # The preview is scaled for the viewport, export is actual size
            # We'll note this but not compute pixel diff
            result["compared"] = True
            result["diff_percent"] = 100.0  # Treat as completely different
            return result

        result["dimensions_match"] = True

        # Convert to numpy arrays
        arr1 = np.array(img1, dtype=np.int16)
        arr2 = np.array(img2, dtype=np.int16)

        # Calculate difference
        diff = np.abs(arr1 - arr2)

        # Count pixels with any difference
        pixel_diff = np.any(diff > 0, axis=2)
        diff_count = np.sum(pixel_diff)
        total_pixels = img1.width * img1.height

        result["compared"] = True
        result["diff_pixels"] = int(diff_count)
        result["total_pixels"] = int(total_pixels)
        result["diff_percent"] = (diff_count / total_pixels) * 100

        return result

    except Exception as e:
        result["error"] = str(e)
        return result


def create_diff_image(img1_path: Path, img2_path: Path, diff_path: Path) -> bool:
    """Create a visual diff image highlighting differences."""
    try:
        img1 = Image.open(img1_path).convert("RGBA")
        img2 = Image.open(img2_path).convert("RGBA")

        # If sizes don't match, we can't create a meaningful diff
        if img1.size != img2.size:
            return False

        arr1 = np.array(img1, dtype=np.int16)
        arr2 = np.array(img2, dtype=np.int16)

        # Calculate difference
        diff = np.abs(arr1 - arr2)

        # Create diff visualization
        # Highlight differences in red/magenta
        diff_mask = np.any(diff > 0, axis=2)

        # Create output image - grayscale version of img1 with red highlights
        out_arr = np.array(img1.convert("L").convert("RGBA"))
        out_arr[diff_mask] = [255, 0, 128, 255]  # Magenta for differences

        diff_img = Image.fromarray(out_arr.astype(np.uint8))
        diff_img.save(diff_path)

        return True

    except Exception as e:
        print(f"  Warning: Could not create diff image: {e}")
        return False


def get_status_emoji(diff_percent: float, dimensions_match: bool) -> str:
    """Return status emoji based on diff percentage."""
    if not dimensions_match:
        return "N/A"  # Different sizes - expected for preview vs export
    if diff_percent is None:
        return "?"
    if diff_percent > THRESHOLD_FAIL:
        return "FAIL"
    if diff_percent > THRESHOLD_WARN:
        return "WARN"
    return "PASS"


def main():
    print("=" * 60)
    print("Preview vs Export Comparison Tool")
    print("=" * 60)
    print(f"Audit directory: {AUDIT_DIR}")
    print()

    if not AUDIT_DIR.exists():
        print(f"Error: Audit directory not found: {AUDIT_DIR}")
        print("Run the audit first: npx playwright test scripts/qa_print_export_golden_audit.spec.js")
        sys.exit(1)

    results = []
    total_cases = 0
    compared_cases = 0
    same_size_cases = 0

    # Process each case
    for preset_dir in sorted(AUDIT_DIR.iterdir()):
        if not preset_dir.is_dir() or preset_dir.name == "audit_summary.json":
            continue

        for template_dir in sorted(preset_dir.iterdir()):
            if not template_dir.is_dir():
                continue

            for variant_dir in sorted(template_dir.iterdir()):
                if not variant_dir.is_dir():
                    continue

                total_cases += 1
                case_id = f"{preset_dir.name}/{template_dir.name}/{variant_dir.name}"
                print(f"Processing: {case_id}")

                preview_path = variant_dir / "preview.png"
                export_path = variant_dir / "export.png"
                diff_path = variant_dir / "diff.png"
                diff_json_path = variant_dir / "diff.json"

                case_result = {
                    "case_id": case_id,
                    "preset": preset_dir.name,
                    "template": template_dir.name,
                    "variant": variant_dir.name.replace("variant_", ""),
                    "preview_exists": preview_path.exists(),
                    "export_exists": export_path.exists(),
                    "comparison": None,
                    "status": "?"
                }

                if not preview_path.exists():
                    print(f"  Missing preview.png")
                    case_result["status"] = "MISSING"
                    results.append(case_result)
                    continue

                if not export_path.exists():
                    print(f"  Missing export.png")
                    case_result["status"] = "MISSING"
                    results.append(case_result)
                    continue

                # Compare
                comparison = calculate_pixel_diff(preview_path, export_path)
                case_result["comparison"] = comparison
                compared_cases += 1

                if comparison["dimensions_match"]:
                    same_size_cases += 1
                    # Create diff image if there are differences
                    if comparison["diff_percent"] and comparison["diff_percent"] > 0:
                        create_diff_image(preview_path, export_path, diff_path)

                case_result["status"] = get_status_emoji(
                    comparison.get("diff_percent"),
                    comparison.get("dimensions_match", False)
                )

                # Save individual diff.json
                with open(diff_json_path, "w") as f:
                    json.dump(comparison, f, indent=2)

                if comparison["dimensions_match"]:
                    print(f"  Diff: {comparison['diff_percent']:.4f}% -> {case_result['status']}")
                else:
                    print(f"  Size mismatch: preview {comparison['img1_size']} vs export {comparison['img2_size']}")

                results.append(case_result)

    print()
    print("=" * 60)
    print("Summary")
    print("=" * 60)
    print(f"Total cases: {total_cases}")
    print(f"Compared: {compared_cases}")
    print(f"Same size (comparable): {same_size_cases}")
    print()

    # Generate markdown report
    generate_markdown_report(results)

    # Save aggregated results
    agg_path = AUDIT_DIR / "comparison_results.json"
    with open(agg_path, "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total_cases": total_cases,
            "compared": compared_cases,
            "same_size": same_size_cases,
            "thresholds": {
                "fail": THRESHOLD_FAIL,
                "warn": THRESHOLD_WARN
            },
            "results": results
        }, f, indent=2)

    print(f"Results saved to: {agg_path}")


def generate_markdown_report(results: list):
    """Generate markdown report with summary table."""
    report_path = DOCS_DIR / "QA_PRINT_EXPORT_GOLDEN.md"

    # Count by status
    status_counts = {}
    for r in results:
        status = r.get("status", "?")
        status_counts[status] = status_counts.get(status, 0) + 1

    md = f"""# QA Print Export Golden Audit Report

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Summary

| Status | Count |
|--------|-------|
"""
    for status, count in sorted(status_counts.items()):
        md += f"| {status} | {count} |\n"

    md += f"""

**Note**: Preview and export images have different sizes by design:
- Preview is scaled to fit the viewport (typically much smaller)
- Export is the actual print resolution

A "N/A" status means sizes don't match (expected behavior).
Only same-size comparisons can produce PASS/WARN/FAIL results.

## Thresholds

- **PASS**: < {THRESHOLD_WARN}% pixel difference
- **WARN**: {THRESHOLD_WARN}% - {THRESHOLD_FAIL}% pixel difference
- **FAIL**: > {THRESHOLD_FAIL}% pixel difference

## Detailed Results

| Preset | Template | Variant | Status | Diff % | Preview Size | Export Size |
|--------|----------|---------|--------|--------|--------------|-------------|
"""

    for r in sorted(results, key=lambda x: x["case_id"]):
        comp = r.get("comparison", {})
        diff_pct = comp.get("diff_percent")
        diff_str = f"{diff_pct:.4f}%" if diff_pct is not None else "N/A"
        prev_size = comp.get("img1_size", ("?", "?"))
        exp_size = comp.get("img2_size", ("?", "?"))

        prev_str = f"{prev_size[0]}x{prev_size[1]}" if prev_size else "?"
        exp_str = f"{exp_size[0]}x{exp_size[1]}" if exp_size else "?"

        md += f"| {r['preset']} | {r['template']} | {r['variant']} | {r['status']} | {diff_str} | {prev_str} | {exp_str} |\n"

    md += f"""

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
"""

    with open(report_path, "w") as f:
        f.write(md)

    print(f"Report saved to: {report_path}")


if __name__ == "__main__":
    main()
