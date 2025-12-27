#!/usr/bin/env python3
"""
DEL C: Theme Recipe Tool: batch-validering
Förbereder temabasen inför kuraterade kollektioner genom systematisk validering.

V3: Fixad parsing för att fånga faktiska varningsrader och kategorisering.
"""

import subprocess
import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Tuple
from collections import defaultdict
from datetime import datetime

# Warning categories for classification
WARNING_CATEGORIES = {
    'WCAG_CONTRAST': [
        r'Low contrast:',
        r'Moderate contrast:',
        r'contrast.*ratio:',
    ],
    'COLOR_SIMILARITY': [
        r'Very similar colors:',
        r'similar.*colors',
    ],
    'EFFECT_PIPELINE': [
        r'effect.*not.*supported',
        r'pipeline.*warning',
        r'render.*issue',
    ],
    'SCHEMA': [
        r'Missing.*field',
        r'Invalid.*format',
        r'schema.*error',
    ],
}


def categorize_warning(warning: str) -> str:
    """Categorize a warning message."""
    for category, patterns in WARNING_CATEGORIES.items():
        for pattern in patterns:
            if re.search(pattern, warning, re.IGNORECASE):
                return category
    return 'OTHER'


class ThemeBatchValidator:
    def __init__(self, repo_root: Path):
        self.repo_root = repo_root
        self.themes_dir = repo_root / 'themes'
        self.tool_path = repo_root / 'scripts' / 'theme_tool' / 'theme_recipe_tool.py'
        self.results = {}

    def validate_theme(self, theme_file: Path) -> Dict:
        """Validera ett enskilt theme."""
        theme_name = theme_file.stem
        result = {
            'theme': theme_name,
            'file': theme_file.name,
            'valid': False,
            'errors': [],
            'warnings': [],
            'warnings_by_category': defaultdict(list),
            'tool_available': False,
            'tool_error': None
        }

        # Kontrollera att tool finns
        if not self.tool_path.exists():
            result['tool_error'] = f"Theme tool not found: {self.tool_path}"
            return result

        result['tool_available'] = True

        # Kör theme_recipe_tool
        try:
            cmd = ['python', str(self.tool_path), str(theme_file)]
            process = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                cwd=self.repo_root,
                timeout=30
            )

            # Parse output with improved multiline handling
            output = process.stdout + process.stderr
            lines = output.split('\n')

            in_error_section = False
            in_warning_section = False

            for line in lines:
                stripped = line.strip()

                # Detect section headers
                if '[ERROR] ERRORS:' in line:
                    in_error_section = True
                    in_warning_section = False
                    continue
                elif '[WARNING] WARNINGS:' in line:
                    in_warning_section = True
                    in_error_section = False
                    continue

                # Section ends on new bracket line or status line
                if stripped.startswith('[') or stripped.startswith('==='):
                    in_error_section = False
                    in_warning_section = False
                    continue

                # Empty lines don't end sections
                if not stripped:
                    continue

                # Collect items with "- " prefix (actual warning/error lines)
                if stripped.startswith('- '):
                    item = stripped[2:]
                    if in_error_section and item:
                        result['errors'].append(item)
                    elif in_warning_section and item:
                        result['warnings'].append(item)
                        # Categorize the warning
                        category = categorize_warning(item)
                        result['warnings_by_category'][category].append(item)

            # Kontrollera exit code
            if process.returncode == 0:
                # Om det finns "[OK] Theme is valid!" i output
                if '[OK]' in output and 'valid' in output.lower():
                    result['valid'] = True
                elif not result['errors']:
                    result['valid'] = True
            else:
                result['valid'] = False
                if not result['errors']:
                    result['errors'].append(f"Tool exited with code {process.returncode}")

        except subprocess.TimeoutExpired:
            result['errors'].append("Tool execution timed out")
        except Exception as e:
            result['errors'].append(f"Tool execution failed: {e}")

        # Fallback: manuell JSON-validering om tool misslyckas
        if not result['tool_available'] or result['tool_error']:
            try:
                with open(theme_file, 'r', encoding='utf-8') as f:
                    theme_data = json.load(f)

                # Grundläggande schema-kontroll
                if 'name' not in theme_data:
                    result['errors'].append("Missing required field: 'name'")
                if 'background' not in theme_data:
                    result['errors'].append("Missing required field: 'background'")
                else:
                    # Kontrollera background format
                    bg = theme_data['background']
                    if not isinstance(bg, str) or not bg.startswith('#'):
                        result['errors'].append(f"Invalid background format: {bg}")

                if not result['errors']:
                    result['valid'] = True
                    result['warnings'].append("Validated via JSON schema only (tool unavailable)")

            except json.JSONDecodeError as e:
                result['errors'].append(f"Invalid JSON: {e}")
            except Exception as e:
                result['errors'].append(f"Failed to read theme file: {e}")

        return result

    def validate_all(self):
        """Validera alla themes."""
        if not self.themes_dir.exists():
            self.results['error'] = f"Themes directory not found: {self.themes_dir}"
            return

        theme_files = sorted(self.themes_dir.glob('*.json'))

        if not theme_files:
            self.results['error'] = "No theme files found"
            return

        for theme_file in theme_files:
            result = self.validate_theme(theme_file)
            self.results[theme_file.stem] = result

    def generate_report(self) -> str:
        """Generera markdown-rapport."""
        lines = []
        lines.append("# Theme Recipe Tool: Batch-validering V3")
        lines.append("")
        lines.append(f"**Genererad**: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        lines.append("")
        lines.append("**Syfte**: Förbereda temabasen inför kuraterade kollektioner genom systematisk validering.")
        lines.append("")

        if 'error' in self.results:
            lines.append(f"**ERROR**: {self.results['error']}")
            return '\n'.join(lines)

        # Sammanfattning
        total = len(self.results)
        valid_count = sum(1 for r in self.results.values() if r.get('valid', False))
        error_count = sum(1 for r in self.results.values() if r.get('errors'))
        warning_count = sum(1 for r in self.results.values() if r.get('warnings'))
        total_warnings = sum(len(r.get('warnings', [])) for r in self.results.values())

        lines.append("## Sammanfattning")
        lines.append("")
        lines.append(f"- **Totalt antal themes**: {total}")
        lines.append(f"- **Valida themes**: {valid_count}")
        lines.append(f"- **Themes med errors**: {error_count}")
        lines.append(f"- **Themes med warnings**: {warning_count}")
        lines.append(f"- **Totalt antal varningar**: {total_warnings}")
        lines.append("")

        # Aggregate warning categories across all themes
        global_categories = defaultdict(int)
        for result in self.results.values():
            for category, warnings in result.get('warnings_by_category', {}).items():
                global_categories[category] += len(warnings)

        lines.append("## Varningskategorier (aggregerat)")
        lines.append("")
        lines.append("| Kategori | Antal varningar | Bedömning |")
        lines.append("|----------|-----------------|-----------|")
        for category, count in sorted(global_categories.items(), key=lambda x: x[1], reverse=True):
            # Determine if this is acceptable or needs action
            if category == 'WCAG_CONTRAST':
                assessment = "Acceptabla (designval)"
            elif category == 'COLOR_SIMILARITY':
                assessment = "Acceptabla (designval)"
            elif category == 'EFFECT_PIPELINE':
                assessment = "Behöver åtgärd"
            elif category == 'SCHEMA':
                assessment = "Behöver åtgärd"
            else:
                assessment = "Granskas manuellt"
            lines.append(f"| {category} | {count} | {assessment} |")
        lines.append("")

        # Kategorisera themes
        clean_themes = []
        acceptable_warning_themes = []  # Only WCAG/color warnings
        action_required_themes = []  # Has errors or non-WCAG warnings

        for theme_name, result in self.results.items():
            if result.get('valid') and not result.get('errors') and not result.get('warnings'):
                clean_themes.append(theme_name)
            elif result.get('valid') and result.get('warnings') and not result.get('errors'):
                # Check if all warnings are acceptable (WCAG/color)
                categories = set(result.get('warnings_by_category', {}).keys())
                acceptable = {'WCAG_CONTRAST', 'COLOR_SIMILARITY'}
                if categories <= acceptable:
                    acceptable_warning_themes.append(theme_name)
                else:
                    action_required_themes.append(theme_name)
            else:
                action_required_themes.append(theme_name)

        lines.append("## Kategorisering")
        lines.append("")
        lines.append(f"- **Clean** ({len(clean_themes)}): Inga errors eller warnings")
        lines.append(f"- **Acceptable Warnings** ({len(acceptable_warning_themes)}): Endast WCAG/färg-varningar (designval)")
        lines.append(f"- **Action Required** ({len(action_required_themes)}): Errors eller icke-acceptabla varningar")
        lines.append("")

        # Action required themes section (highlight issues)
        if action_required_themes:
            lines.append("## Action Required Themes")
            lines.append("")
            for theme_name in sorted(action_required_themes):
                result = self.results[theme_name]
                lines.append(f"### {theme_name}")
                lines.append("")
                if result.get('errors'):
                    lines.append("**Errors:**")
                    for error in result['errors'][:3]:
                        lines.append(f"- {error}")
                    if len(result['errors']) > 3:
                        lines.append(f"- ... och {len(result['errors']) - 3} fler")
                for category, warnings in result.get('warnings_by_category', {}).items():
                    if category not in {'WCAG_CONTRAST', 'COLOR_SIMILARITY'}:
                        lines.append(f"**{category} ({len(warnings)}):**")
                        for w in warnings[:3]:
                            lines.append(f"- {w}")
                        if len(warnings) > 3:
                            lines.append(f"- ... och {len(warnings) - 3} fler")
                lines.append("")
        else:
            lines.append("## Action Required Themes")
            lines.append("")
            lines.append("**Inga themes kräver åtgärd.**")
            lines.append("")

        # Acceptable warnings section (summarized)
        lines.append("## Acceptable Warnings (Designval)")
        lines.append("")
        lines.append("Följande themes har endast WCAG-kontrast och färgsimilaritets-varningar.")
        lines.append("Dessa klassas som designval och kräver ingen åtgärd.")
        lines.append("")
        lines.append("| Theme | WCAG_CONTRAST | COLOR_SIMILARITY |")
        lines.append("|-------|---------------|------------------|")
        for theme_name in sorted(acceptable_warning_themes):
            result = self.results[theme_name]
            wcag = len(result.get('warnings_by_category', {}).get('WCAG_CONTRAST', []))
            color = len(result.get('warnings_by_category', {}).get('COLOR_SIMILARITY', []))
            lines.append(f"| {theme_name} | {wcag} | {color} |")
        lines.append("")

        # Detaljerad lista per theme (optional, can be verbose)
        lines.append("## Detaljerad lista (exempelvarningar)")
        lines.append("")
        lines.append("Visar 1-3 exempelvarningar per theme och kategori.")
        lines.append("")

        for theme_name, result in sorted(self.results.items()):
            if not result.get('warnings'):
                continue

            lines.append(f"### {theme_name}")
            lines.append("")
            for category, warnings in result.get('warnings_by_category', {}).items():
                lines.append(f"**{category}** ({len(warnings)} st):")
                for w in warnings[:3]:
                    lines.append(f"- {w}")
                if len(warnings) > 3:
                    lines.append(f"- ...")
            lines.append("")

        return '\n'.join(lines)

def main():
    repo_root = Path(__file__).parent.parent
    validator = ThemeBatchValidator(repo_root)
    validator.validate_all()

    report = validator.generate_report()

    # V3 output file
    output_file = repo_root / 'exports' / 'THEME_RECIPE_SUMMARY_V3.md'
    output_file.parent.mkdir(parents=True, exist_ok=True)

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(report)

    # Count stats
    total_warnings = sum(len(r.get('warnings', [])) for r in validator.results.values())
    themes_with_warnings = sum(1 for r in validator.results.values() if r.get('warnings'))

    print(f"[OK] Theme validation V3 klar. Rapport skapad: {output_file}")
    print(f"   Themes validerade: {len(validator.results)}")
    print(f"   Themes med varningar: {themes_with_warnings}")
    print(f"   Totalt antal varningar: {total_warnings}")

    # CI exit-code logic
    action_required = sum(1 for r in validator.results.values()
        if r.get('errors') or
        any(cat in r.get('warnings_by_category', {}) for cat in ['SCHEMA', 'EFFECT_PIPELINE']))

    if action_required > 0:
        sys.exit(1)  # HARD FAIL - Schema/pipeline error
    else:
        sys.exit(0)  # OK

if __name__ == '__main__':
    main()

