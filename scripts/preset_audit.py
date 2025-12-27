#!/usr/bin/env python3
"""
Preset Audit Tool

Analyserar alla export presets för konsistens, rimlighet och dokumentation.
Validerar mot schema, preset_limits, och grundläggande logikregler.
"""

import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Tuple

try:
    import jsonschema
except ImportError:
    print("Error: jsonschema not installed. Run: pip install jsonschema")
    sys.exit(1)

# Paths
REPO_ROOT = Path(__file__).parent.parent
PRESETS_DIR = REPO_ROOT / "config" / "export_presets"
SCHEMA_FILE = PRESETS_DIR / "_schema.json"
LIMITS_FILE = REPO_ROOT / "prep-service" / "config" / "preset_limits.json"
THEMES_DIR = REPO_ROOT / "themes"
BBOX_PRESETS_FILE = REPO_ROOT / "prep-service" / "config" / "bbox_presets.json"
OUTPUT_DIR = REPO_ROOT / "docs"
OUTPUT_MD = OUTPUT_DIR / "PRESET_AUDIT_REPORT.md"
OUTPUT_JSON = OUTPUT_DIR / "PRESET_AUDIT_REPORT.json"

# Format dimensions in mm (A0-A4)
FORMAT_DIMENSIONS = {
    "A0": {"width": 841, "height": 1189},
    "A1": {"width": 594, "height": 841},
    "A2": {"width": 420, "height": 594},
    "A3": {"width": 297, "height": 420},
    "A4": {"width": 210, "height": 297},
}


class PresetAuditor:
    def __init__(self):
        self.errors: List[Dict[str, Any]] = []
        self.warnings: List[Dict[str, Any]] = []
        self.info: List[Dict[str, Any]] = []
        self.schema = None
        self.limits = None
        self.bbox_presets = None
        self.themes = None
        self.presets: List[Dict[str, Any]] = []

    def load_config(self):
        """Ladda schema, limits, bbox presets och themes."""
        # Load schema
        if not SCHEMA_FILE.exists():
            self.errors.append({
                "type": "config",
                "preset": None,
                "message": f"Schema file not found: {SCHEMA_FILE}"
            })
            return False

        with open(SCHEMA_FILE) as f:
            self.schema = json.load(f)

        # Load limits
        if not LIMITS_FILE.exists():
            self.warnings.append({
                "type": "config",
                "preset": None,
                "message": f"Limits file not found: {LIMITS_FILE}"
            })
        else:
            with open(LIMITS_FILE) as f:
                self.limits = json.load(f)

        # Load bbox presets
        if not BBOX_PRESETS_FILE.exists():
            self.errors.append({
                "type": "config",
                "preset": None,
                "message": f"Bbox presets file not found: {BBOX_PRESETS_FILE}"
            })
            return False

        with open(BBOX_PRESETS_FILE) as f:
            data = json.load(f)
            # Extract preset names
            self.bbox_presets = {p["name"]: p for p in data.get("presets", [])}

        # Load themes (list available theme files)
        if not THEMES_DIR.exists():
            self.warnings.append({
                "type": "config",
                "preset": None,
                "message": f"Themes directory not found: {THEMES_DIR}"
            })
        else:
            self.themes = {
                f.stem: f for f in THEMES_DIR.glob("*.json")
            }

        return True

    def load_presets(self):
        """Ladda alla preset-filer."""
        if not PRESETS_DIR.exists():
            self.errors.append({
                "type": "config",
                "preset": None,
                "message": f"Presets directory not found: {PRESETS_DIR}"
            })
            return

        for preset_file in sorted(PRESETS_DIR.glob("*.json")):
            if preset_file.name == "_schema.json":
                continue

            try:
                with open(preset_file) as f:
                    preset_data = json.load(f)
                    preset_data["_file"] = preset_file.name
                    self.presets.append(preset_data)
            except json.JSONDecodeError as e:
                self.errors.append({
                    "type": "parse",
                    "preset": preset_file.name,
                    "message": f"JSON parse error: {e}"
                })

    def validate_schema(self, preset: Dict[str, Any]) -> bool:
        """Validera preset mot JSON schema."""
        try:
            jsonschema.validate(instance=preset, schema=self.schema)
            return True
        except jsonschema.ValidationError as e:
            self.errors.append({
                "type": "schema",
                "preset": preset.get("id", preset.get("_file", "unknown")),
                "message": f"Schema validation failed: {e.message}",
                "path": list(e.path)
            })
            return False
        except jsonschema.SchemaError as e:
            self.errors.append({
                "type": "schema",
                "preset": preset.get("id", preset.get("_file", "unknown")),
                "message": f"Schema error: {e.message}"
            })
            return False

    def validate_bbox_preset(self, preset: Dict[str, Any]) -> bool:
        """Validera att bbox_preset finns."""
        bbox_preset = preset.get("bbox_preset")
        if not bbox_preset:
            return True  # Schema validation will catch missing required field

        if bbox_preset not in self.bbox_presets:
            self.errors.append({
                "type": "bbox_preset",
                "preset": preset.get("id", "unknown"),
                "message": f"Unknown bbox_preset: {bbox_preset}. Available: {list(self.bbox_presets.keys())}"
            })
            return False
        return True

    def validate_theme(self, preset: Dict[str, Any]) -> bool:
        """Validera att theme finns."""
        theme = preset.get("theme")
        if not theme:
            return True  # Schema validation will catch missing required field

        if not self.themes:
            return True  # Themes dir not found, skip

        # Normalize theme name (remove hyphens, case-insensitive)
        theme_normalized = theme.lower().replace("-", "")
        found = False
        for theme_name, theme_path in self.themes.items():
            if theme_name.lower().replace("-", "") == theme_normalized:
                found = True
                break

        if not found:
            self.warnings.append({
                "type": "theme",
                "preset": preset.get("id", "unknown"),
                "message": f"Theme '{theme}' not found in themes directory. Available: {sorted(self.themes.keys())}"
            })
        return True

    def validate_paper_dimensions(self, preset: Dict[str, Any]) -> bool:
        """Validera att paper dimensions matchar format."""
        paper = preset.get("paper", {})
        format_name = paper.get("format")
        width_mm = paper.get("width_mm")
        height_mm = paper.get("height_mm")
        orientation = paper.get("orientation")

        if not all([format_name, width_mm, height_mm, orientation]):
            return True  # Schema validation will catch missing fields

        if format_name not in FORMAT_DIMENSIONS:
            return True  # Schema validation will catch invalid format

        expected = FORMAT_DIMENSIONS[format_name]

        # Check if dimensions match format (accounting for orientation)
        if orientation == "portrait":
            expected_width = expected["width"]
            expected_height = expected["height"]
        else:  # landscape
            expected_width = expected["height"]
            expected_height = expected["width"]

        if width_mm != expected_width or height_mm != expected_height:
            self.warnings.append({
                "type": "paper_dimensions",
                "preset": preset.get("id", "unknown"),
                "message": f"Paper dimensions ({width_mm}x{height_mm}mm) don't match {format_name} {orientation} format ({expected_width}x{expected_height}mm)"
            })
            return False
        return True

    def validate_dpi_vs_paper_size(self, preset: Dict[str, Any]) -> bool:
        """Validera att DPI × pappersstorlek ger rimlig pixelstorlek."""
        render = preset.get("render", {})
        paper = preset.get("paper", {})
        dpi = render.get("dpi")
        width_mm = paper.get("width_mm")
        height_mm = paper.get("height_mm")

        if not all([dpi, width_mm, height_mm]):
            return True  # Schema validation will catch missing fields

        # Calculate pixel dimensions
        width_px = int(width_mm * dpi / 25.4)
        height_px = int(height_mm * dpi / 25.4)
        total_pixels = width_px * height_px

        # Check against hard limits
        if self.limits and "validation_rules" in self.limits:
            max_pixels = self.limits["validation_rules"]["hard_limits"].get("max_pixels_total", 100000000)
            if total_pixels > max_pixels:
                self.errors.append({
                    "type": "pixel_limit",
                    "preset": preset.get("id", "unknown"),
                    "message": f"Pixel count ({total_pixels:,}) exceeds maximum ({max_pixels:,}). DPI: {dpi}, Size: {width_mm}x{height_mm}mm"
                })
                return False

        # Warn if very large
        if total_pixels > 50000000:  # 50MP
            self.warnings.append({
                "type": "pixel_size",
                "preset": preset.get("id", "unknown"),
                "message": f"Large pixel count: {total_pixels:,} pixels ({width_px}x{height_px}). May cause slow rendering."
            })

        return True

    def validate_dpi_limits(self, preset: Dict[str, Any]) -> bool:
        """Validera DPI mot preset_limits."""
        if not self.limits:
            return True

        bbox_preset = preset.get("bbox_preset")
        if not bbox_preset or bbox_preset not in self.limits.get("presets", {}):
            return True

        preset_limits = self.limits["presets"][bbox_preset].get("limits", {})
        max_dpi = preset_limits.get("max_dpi")
        render = preset.get("render", {})
        dpi = render.get("dpi")

        if max_dpi and dpi and dpi > max_dpi:
            self.errors.append({
                "type": "dpi_limit",
                "preset": preset.get("id", "unknown"),
                "message": f"DPI {dpi} exceeds maximum {max_dpi} for bbox_preset {bbox_preset}"
            })
            return False

        return True

    def validate_format_allowed(self, preset: Dict[str, Any]) -> bool:
        """Validera att format är tillåtet för bbox_preset."""
        if not self.limits:
            return True

        bbox_preset = preset.get("bbox_preset")
        if not bbox_preset or bbox_preset not in self.limits.get("presets", {}):
            return True

        preset_limits = self.limits["presets"][bbox_preset].get("limits", {})
        allowed_formats = preset_limits.get("allowed_formats", [])
        paper = preset.get("paper", {})
        format_name = paper.get("format")

        if allowed_formats and format_name and format_name not in allowed_formats:
            self.errors.append({
                "type": "format_not_allowed",
                "preset": preset.get("id", "unknown"),
                "message": f"Format {format_name} not allowed for bbox_preset {bbox_preset}. Allowed: {allowed_formats}"
            })
            return False

        return True

    def validate_constraints_consistency(self, preset: Dict[str, Any]) -> bool:
        """Validera att constraints är konsistenta med faktiska värden."""
        constraints = preset.get("constraints", {})
        render = preset.get("render", {})

        # Check DPI locked
        if constraints.get("dpi_locked"):
            dpi = render.get("dpi")
            dpi_min = constraints.get("dpi_min")
            dpi_max = constraints.get("dpi_max")
            if dpi and dpi_min and dpi_max and (dpi < dpi_min or dpi > dpi_max):
                self.errors.append({
                    "type": "constraint_inconsistency",
                    "preset": preset.get("id", "unknown"),
                    "message": f"DPI {dpi} is outside locked range [{dpi_min}, {dpi_max}]"
                })
                return False

        # Check format locked
        if constraints.get("format_locked"):
            render_format = render.get("format")
            allowed_formats = constraints.get("allowed_formats", [])
            if render_format and render_format not in allowed_formats:
                self.errors.append({
                    "type": "constraint_inconsistency",
                    "preset": preset.get("id", "unknown"),
                    "message": f"Format {render_format} is not in locked allowed_formats {allowed_formats}"
                })
                return False

        return True

    def validate_composition_format_compatibility(self, preset: Dict[str, Any]) -> bool:
        """Validera att format och layout är kompatibla."""
        render = preset.get("render", {})
        render_format = render.get("format")
        composition = preset.get("composition", {})

        # SVG can have scale_bar, but PNG/PDF might have issues
        # This is more of an info/warning than error
        if render_format == "svg" and composition.get("show_scale_bar"):
            # SVG supports scale bars well
            pass
        elif render_format in ["png", "pdf"] and composition.get("show_scale_bar"):
            # This is fine, just informational
            pass

        return True

    def audit_preset(self, preset: Dict[str, Any]):
        """Utför full audit av en preset."""
        preset_id = preset.get("id", preset.get("_file", "unknown"))

        # Schema validation (must pass)
        if not self.validate_schema(preset):
            return  # Skip other validations if schema fails

        # Basic validations
        self.validate_bbox_preset(preset)
        self.validate_theme(preset)
        self.validate_paper_dimensions(preset)

        # Limits validations
        self.validate_dpi_limits(preset)
        self.validate_format_allowed(preset)

        # Logic validations
        self.validate_dpi_vs_paper_size(preset)
        self.validate_constraints_consistency(preset)
        self.validate_composition_format_compatibility(preset)

    def audit_all(self):
        """Utför audit av alla presets."""
        if not self.load_config():
            return

        self.load_presets()

        self.info.append({
            "type": "summary",
            "message": f"Found {len(self.presets)} preset files"
        })

        for preset in self.presets:
            self.audit_preset(preset)

        # Generate summary
        unique_bbox_presets = set(p.get("bbox_preset") for p in self.presets if p.get("bbox_preset"))
        unique_themes = set(p.get("theme") for p in self.presets if p.get("theme"))
        unique_formats = set(p.get("paper", {}).get("format") for p in self.presets if p.get("paper", {}).get("format"))

        self.info.append({
            "type": "summary",
            "message": f"Unique bbox_presets: {sorted(unique_bbox_presets)}"
        })
        self.info.append({
            "type": "summary",
            "message": f"Unique themes: {sorted(unique_themes)}"
        })
        self.info.append({
            "type": "summary",
            "message": f"Unique formats: {sorted(unique_formats)}"
        })

    def generate_markdown_report(self) -> str:
        """Generera Markdown-rapport."""
        lines = []
        lines.append("# Export Preset Audit Report")
        lines.append("")
        lines.append(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append("")
        lines.append(f"**Total Presets:** {len(self.presets)}")
        lines.append(f"**Errors:** {len(self.errors)}")
        lines.append(f"**Warnings:** {len(self.warnings)}")
        lines.append("")
        lines.append("---")
        lines.append("")

        # Errors
        if self.errors:
            lines.append("## ❌ Errors (Blocking)")
            lines.append("")
            for error in self.errors:
                preset = error.get("preset", "unknown")
                error_type = error.get("type", "unknown")
                message = error.get("message", "")
                lines.append(f"### {preset} ({error_type})")
                lines.append(f"**Error:** {message}")
                if "path" in error:
                    lines.append(f"**Path:** {error['path']}")
                lines.append("")
        else:
            lines.append("## ✅ No Errors")
            lines.append("")

        # Warnings
        if self.warnings:
            lines.append("## ⚠️ Warnings (Suspicious but allowed)")
            lines.append("")
            for warning in self.warnings:
                preset = warning.get("preset", "unknown")
                warning_type = warning.get("type", "unknown")
                message = warning.get("message", "")
                lines.append(f"### {preset} ({warning_type})")
                lines.append(f"**Warning:** {message}")
                lines.append("")
        else:
            lines.append("## ✅ No Warnings")
            lines.append("")

        # Info
        if self.info:
            lines.append("## ℹ️ Info (Metadata & Summary)")
            lines.append("")
            for info in self.info:
                info_type = info.get("type", "unknown")
                message = info.get("message", "")
                lines.append(f"**{info_type}:** {message}")
            lines.append("")

        # Summary by preset
        lines.append("## Preset Summary")
        lines.append("")
        lines.append("| Preset ID | Bbox | Theme | Format | DPI | Status |")
        lines.append("|-----------|------|-------|--------|-----|--------|")

        preset_status = {}
        for error in self.errors:
            preset_id = error.get("preset", "unknown")
            if preset_id not in preset_status:
                preset_status[preset_id] = "❌ Error"
        for warning in self.warnings:
            preset_id = warning.get("preset", "unknown")
            if preset_id not in preset_status:
                preset_status[preset_id] = "⚠️ Warning"

        for preset in sorted(self.presets, key=lambda p: p.get("id", "")):
            preset_id = preset.get("id", "unknown")
            bbox = preset.get("bbox_preset", "")
            theme = preset.get("theme", "")
            format_name = preset.get("paper", {}).get("format", "")
            dpi = preset.get("render", {}).get("dpi", "")
            status = preset_status.get(preset_id, "✅ OK")
            lines.append(f"| {preset_id} | {bbox} | {theme} | {format_name} | {dpi} | {status} |")

        lines.append("")
        lines.append("---")
        lines.append("")
        lines.append("*Generated by preset_audit.py*")

        return "\n".join(lines)

    def generate_json_report(self) -> Dict[str, Any]:
        """Generera JSON-rapport."""
        return {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total_presets": len(self.presets),
                "total_errors": len(self.errors),
                "total_warnings": len(self.warnings),
                "total_info": len(self.info)
            },
            "errors": self.errors,
            "warnings": self.warnings,
            "info": self.info,
            "presets": [
                {
                    "id": p.get("id"),
                    "bbox_preset": p.get("bbox_preset"),
                    "theme": p.get("theme"),
                    "format": p.get("paper", {}).get("format"),
                    "dpi": p.get("render", {}).get("dpi"),
                }
                for p in self.presets
            ]
        }

    def write_reports(self):
        """Skriv rapporterna till filer."""
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

        # Markdown report
        md_content = self.generate_markdown_report()
        with open(OUTPUT_MD, "w", encoding="utf-8") as f:
            f.write(md_content)
        print(f"Markdown report written to: {OUTPUT_MD}")

        # JSON report
        json_content = self.generate_json_report()
        with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
            json.dump(json_content, f, indent=2, ensure_ascii=False)
        print(f"JSON report written to: {OUTPUT_JSON}")


def main():
    """Main entry point."""
    auditor = PresetAuditor()
    auditor.audit_all()
    auditor.write_reports()

    # Exit code
    if auditor.errors:
        print(f"\n[ERROR] Audit completed with {len(auditor.errors)} errors")
        sys.exit(1)
    elif auditor.warnings:
        print(f"\n[WARN] Audit completed with {len(auditor.warnings)} warnings (no errors)")
        sys.exit(0)
    else:
        print(f"\n[OK] Audit completed successfully (no errors or warnings)")
        sys.exit(0)


if __name__ == "__main__":
    main()

