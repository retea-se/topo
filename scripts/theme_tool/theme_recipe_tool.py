#!/usr/bin/env python3
"""
Theme Recipe Tool
Validerar och dokumenterar themes med konsekvent output.
"""

import json
import sys
import re
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from colorsys import rgb_to_hsv
from urllib.parse import quote

# Color contrast calculation (WCAG 2.1)
def hex_to_rgb(hex_str: str) -> Tuple[int, int, int]:
    """Convert hex color to RGB tuple."""
    hex_str = hex_str.lstrip('#')
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def relative_luminance(r: int, g: int, b: int) -> float:
    """Calculate relative luminance (WCAG 2.1)."""
    def to_linear(val):
        val = val / 255.0
        if val <= 0.03928:
            return val / 12.92
        return ((val + 0.055) / 1.055) ** 2.4

    return 0.2126 * to_linear(r) + 0.7152 * to_linear(g) + 0.0722 * to_linear(b)

def contrast_ratio(color1: Tuple[int, int, int], color2: Tuple[int, int, int]) -> float:
    """Calculate contrast ratio between two colors."""
    l1 = relative_luminance(*color1)
    l2 = relative_luminance(*color2)
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

class ThemeValidator:
    """Validerar theme JSON mot schema och kompatibilitet."""

    REQUIRED_FIELDS = ['name', 'background']
    REQUIRED_LAYERS = ['hillshade', 'water', 'parks', 'roads', 'buildings', 'contours']

    def __init__(self, theme_path: Path):
        self.theme_path = theme_path
        self.theme = None
        self.errors = []
        self.warnings = []

    def load(self) -> bool:
        """Load theme JSON."""
        try:
            with open(self.theme_path, 'r', encoding='utf-8') as f:
                self.theme = json.load(f)
            return True
        except json.JSONDecodeError as e:
            self.errors.append(f"Invalid JSON: {e}")
            return False
        except Exception as e:
            self.errors.append(f"Failed to load file: {e}")
            return False

    def validate_schema(self) -> bool:
        """Validate basic schema structure."""
        if not self.theme:
            return False

        valid = True

        # Required fields
        for field in self.REQUIRED_FIELDS:
            if field not in self.theme:
                self.errors.append(f"Missing required field: {field}")
                valid = False

        # Background format
        if 'background' in self.theme:
            bg = self.theme['background']
            if not re.match(r'^#[0-9a-fA-F]{6}$', bg):
                self.errors.append(f"Invalid background color format: {bg} (expected #RRGGBB)")
                valid = False

        # Meta structure (optional but if present, should have expected fields)
        if 'meta' in self.theme:
            meta = self.theme['meta']
            if not isinstance(meta, dict):
                self.errors.append("meta must be an object")
                valid = False
            else:
                if 'intended_scale' in meta:
                    valid_scales = ['A0', 'A1', 'A2', 'A3', 'A4']
                    if meta['intended_scale'] not in valid_scales:
                        self.warnings.append(f"Unknown intended_scale: {meta['intended_scale']} (expected {valid_scales})")

        # Layer structures
        for layer in self.REQUIRED_LAYERS:
            if layer in self.theme:
                layer_obj = self.theme[layer]
                if not isinstance(layer_obj, dict):
                    self.errors.append(f"Layer '{layer}' must be an object")
                    valid = False

        return valid

    def validate_effects(self) -> bool:
        """Validate effect pipeline compatibility."""
        if not self.theme or 'effects' not in self.theme:
            return True  # No effects is valid

        effects = self.theme['effects']
        if not isinstance(effects, dict):
            self.errors.append("effects must be an object")
            return False

        valid = True

        # Risograph effect validation
        if 'risograph' in effects:
            riso = effects['risograph']
            if not isinstance(riso, dict):
                self.errors.append("effects.risograph must be an object")
                valid = False
            else:
                # Check enabled flag
                if 'enabled' in riso and not isinstance(riso['enabled'], bool):
                    self.errors.append("effects.risograph.enabled must be boolean")
                    valid = False

                # Check channels
                if 'channels' in riso:
                    if not isinstance(riso['channels'], list):
                        self.errors.append("effects.risograph.channels must be an array")
                        valid = False
                    else:
                        for i, channel in enumerate(riso['channels']):
                            if not isinstance(channel, dict):
                                self.errors.append(f"effects.risograph.channels[{i}] must be an object")
                                valid = False
                            else:
                                if 'color' not in channel:
                                    self.errors.append(f"effects.risograph.channels[{i}].color is required")
                                    valid = False
                                elif not re.match(r'^#[0-9a-fA-F]{6}$', channel['color']):
                                    self.errors.append(f"effects.risograph.channels[{i}].color has invalid format")
                                    valid = False

                                if 'offset' in channel:
                                    offset = channel['offset']
                                    if not isinstance(offset, dict) or 'x' not in offset or 'y' not in offset:
                                        self.errors.append(f"effects.risograph.channels[{i}].offset must have x and y")
                                        valid = False

                # Check grain
                if 'grain' in riso and isinstance(riso['grain'], dict):
                    if 'opacity' in riso['grain']:
                        opacity = riso['grain']['opacity']
                        if not isinstance(opacity, (int, float)) or opacity < 0 or opacity > 1:
                            self.warnings.append("effects.risograph.grain.opacity should be between 0 and 1")

                # Check blendMode
                if 'blendMode' in riso:
                    valid_modes = ['multiply', 'screen', 'overlay', 'normal']
                    if riso['blendMode'] not in valid_modes:
                        self.warnings.append(f"Unknown blendMode: {riso['blendMode']} (expected {valid_modes})")

        # Unknown effects are allowed (forward compatibility)
        known_effects = ['risograph']
        for effect_name in effects:
            if effect_name not in known_effects:
                self.warnings.append(f"Unknown effect type: {effect_name} (may not be supported)")

        return valid

    def validate_colors(self) -> bool:
        """Check for color conflicts and contrast issues."""
        if not self.theme:
            return False

        valid = True
        bg_hex = self.theme.get('background', '#ffffff')

        try:
            bg_rgb = hex_to_rgb(bg_hex)
            bg_lum = relative_luminance(*bg_rgb)

            # Extract all colors from theme
            colors = {}
            color_sources = {}

            # Background
            colors['background'] = bg_rgb
            color_sources['background'] = 'background'

            # Layer colors
            for layer in ['water', 'parks', 'roads', 'buildings', 'contours']:
                if layer in self.theme:
                    layer_obj = self.theme[layer]
                    if 'fill' in layer_obj:
                        try:
                            fill_rgb = hex_to_rgb(layer_obj['fill'])
                            colors[f'{layer}.fill'] = fill_rgb
                            color_sources[f'{layer}.fill'] = f'{layer}.fill'
                        except:
                            pass
                    if 'stroke' in layer_obj:
                        try:
                            stroke_rgb = hex_to_rgb(layer_obj['stroke'])
                            colors[f'{layer}.stroke'] = stroke_rgb
                            color_sources[f'{layer}.stroke'] = f'{layer}.stroke'
                        except:
                            pass

            # Effect colors
            if 'effects' in self.theme and 'risograph' in self.theme['effects']:
                riso = self.theme['effects']['risograph']
                if 'channels' in riso:
                    for i, channel in enumerate(riso.get('channels', [])):
                        if 'color' in channel:
                            try:
                                chan_rgb = hex_to_rgb(channel['color'])
                                colors[f'effect.risograph.channel[{i}]'] = chan_rgb
                                color_sources[f'effect.risograph.channel[{i}]'] = f'effects.risograph.channels[{i}].color'
                            except:
                                pass

            # Check contrast with background
            for color_name, color_rgb in colors.items():
                if color_name == 'background':
                    continue

                contrast = contrast_ratio(bg_rgb, color_rgb)
                source = color_sources.get(color_name, color_name)

                # WCAG AA requires 3:1 for large text, 4.5:1 for normal text
                # Maps typically need good contrast, so warn below 2.5:1
                if contrast < 2.5:
                    self.warnings.append(f"Low contrast: {source} vs background (ratio: {contrast:.2f})")
                elif contrast < 4.5:
                    self.warnings.append(f"Moderate contrast: {source} vs background (ratio: {contrast:.2f})")

            # Check for similar colors (potential conflicts)
            color_list = list(colors.items())
            for i, (name1, rgb1) in enumerate(color_list):
                for name2, rgb2 in color_list[i+1:]:
                    if name1 == 'background' or name2 == 'background':
                        continue
                    contrast = contrast_ratio(rgb1, rgb2)
                    if contrast < 1.5:
                        self.warnings.append(f"Very similar colors: {color_sources.get(name1)} and {color_sources.get(name2)} (ratio: {contrast:.2f})")

            # Check opacity conflicts
            if 'hillshade' in self.theme:
                hillshade = self.theme['hillshade']
                opacity = hillshade.get('opacity', 0.15)
                if opacity < 0.05:
                    self.warnings.append("Very low hillshade opacity (< 0.05) may be barely visible")
                elif opacity > 0.5:
                    self.warnings.append("High hillshade opacity (> 0.5) may dominate the map")

        except Exception as e:
            self.warnings.append(f"Color validation error: {e}")

        return valid

    def validate_all(self) -> Tuple[bool, List[str], List[str]]:
        """Run all validations."""
        if not self.load():
            return (False, self.errors, self.warnings)

        schema_ok = self.validate_schema()
        effects_ok = self.validate_effects()
        colors_ok = self.validate_colors()

        all_valid = schema_ok and effects_ok and colors_ok

        return (all_valid, self.errors, self.warnings)

class ThemeRecipeGenerator:
    """Genererar dokumentation och rekommendationer för ett theme."""

    def __init__(self, theme: Dict[str, Any], theme_name: str):
        self.theme = theme
        self.theme_name = theme_name

    def generate_readme_snippet(self) -> str:
        """Genererar Markdown-snippet för README."""
        lines = []

        name = self.theme.get('name', self.theme_name)
        bg = self.theme.get('background', '#ffffff')
        meta = self.theme.get('meta', {})

        lines.append(f"### {name}")
        lines.append("")
        lines.append(f"- **Background**: `{bg}`")

        if 'intended_scale' in meta:
            lines.append(f"- **Intended Scale**: {meta['intended_scale']}")
        if 'label_density' in meta:
            lines.append(f"- **Label Density**: {meta['label_density']}")
        if 'mood' in meta:
            lines.append(f"- **Mood**: {meta['mood']}")

        lines.append("")
        lines.append("**Layers:**")

        # Layer summary
        layer_info = []
        for layer in ['water', 'parks', 'roads', 'buildings', 'contours']:
            if layer in self.theme:
                layer_obj = self.theme[layer]
                info_parts = []
                if 'fill' in layer_obj:
                    info_parts.append(f"fill: {layer_obj['fill']}")
                if 'stroke' in layer_obj:
                    info_parts.append(f"stroke: {layer_obj['stroke']}")
                if info_parts:
                    layer_info.append(f"- `{layer}`: {', '.join(info_parts)}")

        if layer_info:
            lines.extend(layer_info)
        else:
            lines.append("- (default layer styling)")

        # Effects
        if 'effects' in self.theme:
            lines.append("")
            lines.append("**Effects:**")
            if 'risograph' in self.theme['effects']:
                riso = self.theme['effects']['risograph']
                if riso.get('enabled', False):
                    channels = riso.get('channels', [])
                    lines.append(f"- Risograph: {len(channels)} channel(s)")
                    for i, ch in enumerate(channels):
                        lines.append(f"  - Channel {i+1}: {ch.get('color', 'N/A')}")

        lines.append("")
        lines.append(f"**Theme file**: `themes/{self.theme_name}.json`")

        return "\n".join(lines)

    def recommend_presets(self, presets_dir: Path) -> List[Dict[str, Any]]:
        """Rekommenderar export presets baserat på theme."""
        recommendations = []

        if not presets_dir.exists():
            return recommendations

        meta = self.theme.get('meta', {})
        intended_scale = meta.get('intended_scale', 'A2')

        # Find presets that match this theme
        theme_id = self.theme_name
        for preset_file in presets_dir.glob('*.json'):
            if preset_file.name == '_schema.json':
                continue

            try:
                with open(preset_file, 'r', encoding='utf-8') as f:
                    preset = json.load(f)

                preset_theme = preset.get('theme', '')
                theme_display_name = self.theme.get('name', '').lower().replace(' ', '-').replace('_', '-')
                # Match theme by: theme field, theme name (normalized), or theme filename
                if (preset_theme == theme_id or
                    preset_theme == self.theme_name or
                    preset_theme.lower() == theme_display_name or
                    preset_theme.lower() == self.theme_name.lower()):
                    recommendations.append({
                        'id': preset.get('id', preset_file.stem),
                        'display_name': preset.get('display_name', preset_file.stem),
                        'paper': preset.get('paper', {}),
                        'description': preset.get('description', ''),
                        'file': preset_file.name
                    })
            except:
                continue

        # Sort by paper format (A0, A1, A2, A3, A4)
        def sort_key(rec):
            paper = rec.get('paper', {})
            format_order = {'A0': 0, 'A1': 1, 'A2': 2, 'A3': 3, 'A4': 4}
            return format_order.get(paper.get('format', 'A2'), 5)

        recommendations.sort(key=sort_key)
        return recommendations

    def generate_preset_recommendations_md(self, recommendations: List[Dict[str, Any]]) -> str:
        """Genererar Markdown för preset-rekommendationer."""
        if not recommendations:
            return "**Inga matchande export presets hittades.**"

        lines = []
        lines.append("**Rekommenderade Export Presets:**")
        lines.append("")

        for rec in recommendations:
            paper = rec.get('paper', {})
            format_name = paper.get('format', 'N/A')
            orientation = paper.get('orientation', 'portrait')
            lines.append(f"- **{rec['display_name']}** (`{rec['id']}`)")
            lines.append(f"  - Paper: {format_name} {orientation}")
            if rec.get('description'):
                lines.append(f"  - {rec['description']}")
            lines.append(f"  - File: `{rec['file']}`")

        return "\n".join(lines)

def main():
    """CLI entry point."""
    if len(sys.argv) < 2:
        print("Usage: theme_recipe_tool.py <theme.json> [--output-dir <dir>]", file=sys.stderr)
        sys.exit(1)

    theme_path = Path(sys.argv[1])
    if not theme_path.exists():
        print(f"Error: Theme file not found: {theme_path}", file=sys.stderr)
        sys.exit(1)

    # Parse output dir
    output_dir = Path('scripts/theme_tool/outputs')
    if '--output-dir' in sys.argv:
        idx = sys.argv.index('--output-dir')
        if idx + 1 < len(sys.argv):
            output_dir = Path(sys.argv[idx + 1])

    output_dir.mkdir(parents=True, exist_ok=True)

    # Validate theme
    validator = ThemeValidator(theme_path)
    is_valid, errors, warnings = validator.validate_all()

    theme_name = theme_path.stem
    theme = validator.theme

    # Print validation results
    print(f"=== Theme Validation: {theme_name} ===")
    print()

    if errors:
        print("[ERROR] ERRORS:")
        for error in errors:
            print(f"  - {error}")
        print()

    if warnings:
        print("[WARNING] WARNINGS:")
        for warning in warnings:
            print(f"  - {warning}")
        print()

    if is_valid and not errors:
        print("[OK] Theme is valid!")
    elif errors:
        print("[ERROR] Theme has validation errors!")
        sys.exit(1)
    else:
        print("[WARNING] Theme is valid but has warnings")

    print()

    # Generate documentation
    generator = ThemeRecipeGenerator(theme, theme_name)

    # README snippet
    readme_snippet = generator.generate_readme_snippet()
    readme_path = output_dir / f"{theme_name}_README.md"
    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(readme_snippet)
    print(f"[OK] Generated README snippet: {readme_path}")

    # Preset recommendations
    repo_root = theme_path.parent.parent  # themes/ -> repo root
    presets_dir = repo_root / 'config' / 'export_presets'
    recommendations = generator.recommend_presets(presets_dir)
    preset_md = generator.generate_preset_recommendations_md(recommendations)

    preset_path = output_dir / f"{theme_name}_presets.md"
    with open(preset_path, 'w', encoding='utf-8') as f:
        f.write(preset_md)
    print(f"[OK] Generated preset recommendations: {preset_path}")

    # Full report
    report_path = output_dir / f"{theme_name}_report.md"
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(f"# Theme Report: {theme.get('name', theme_name)}\n\n")
        f.write(f"**Theme file**: `{theme_path.relative_to(repo_root)}`\n\n")
        f.write("## Validation Results\n\n")
        if errors:
            f.write("### Errors\n\n")
            for error in errors:
                f.write(f"- [ERROR] {error}\n")
            f.write("\n")
        if warnings:
            f.write("### Warnings\n\n")
            for warning in warnings:
                f.write(f"- [WARNING] {warning}\n")
            f.write("\n")
        if not errors:
            f.write("[OK] **Theme is valid!**\n\n")
        f.write("## Theme Documentation\n\n")
        f.write(readme_snippet)
        f.write("\n\n")
        f.write("## Export Preset Recommendations\n\n")
        f.write(preset_md)
        f.write("\n")

    print(f"[OK] Generated full report: {report_path}")
    print()
    print("Done!")

if __name__ == '__main__':
    main()
