#!/usr/bin/env python3
"""
DEL B: Golden baseline coverage-check (analys, ej rendering)
Verifierar att golden-systemet är konsekvent och komplett.

V3: Förbättrad med preset+layout matchning och tier-baserad policy.
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Set, Optional
from collections import defaultdict
from datetime import datetime

# Known layout suffixes used in golden naming convention
# Golden ID can be: {preset_id} or {preset_id}_{layout}
KNOWN_LAYOUTS = {
    'Classic', 'Minimal', 'Bold', 'Minimalist', 'Scientific',
    'Blueprint', 'Gallery_Print', 'Vintage_Map', 'Artistic',
    'Night_Mode', 'Heritage', 'Prestige', 'Cyberpunk',
    # Additional variant naming
    'variant_A', 'variant_B', 'variant_C',
}

# Golden coverage policy
GOLDEN_POLICY = """
## Golden Coverage Policy

**Tier 1 (Production)**: MUST have golden baselines. Missing = ERROR.
**Tier 2 (Stable)**: SHOULD have golden baselines. Missing = WARNING.
**No Tier (Experimental)**: MAY have golden baselines. Missing = INFO only.

Presets without tier assignment are considered experimental and do not
require golden baselines. This is by design to allow rapid iteration
on new presets without QA overhead.
"""


class GoldenCoverageAuditor:
    def __init__(self, repo_root: Path):
        self.repo_root = repo_root
        self.presets_dir = repo_root / 'config' / 'export_presets'
        self.golden_dirs = {
            'demo_b': repo_root / 'golden' / 'demo_b',
            'print_export': repo_root / 'golden' / 'print_export'
        }
        # Also check exports/golden_audit for audit baselines
        self.golden_audit_dir = repo_root / 'exports' / 'golden_audit'

        self.presets = {}
        self.goldens = defaultdict(dict)  # {golden_type: {preset_id: golden_info}}
        self.golden_to_preset_map = {}  # {golden_id: preset_id} for layout matching
        self.issues = []

    def find_matching_preset(self, golden_id: str) -> Optional[str]:
        """
        Find matching preset for a golden ID.
        Handles both exact matches and layout-suffixed naming.
        E.g., 'A2_Paper_v1_Minimal' matches preset 'A2_Paper_v1'
        """
        # Exact match
        if golden_id in self.presets:
            return golden_id

        # Prefix-match: preset_id + "_" + layout
        for preset_id in self.presets.keys():
            if golden_id.startswith(preset_id + "_"):
                suffix = golden_id[len(preset_id) + 1:]
                if suffix in KNOWN_LAYOUTS:
                    return preset_id

        return None

    def load_presets(self):
        """Ladda alla presets."""
        if not self.presets_dir.exists():
            self.issues.append({
                'type': 'ERROR',
                'message': f"Presets directory not found: {self.presets_dir}"
            })
            return

        for preset_file in self.presets_dir.glob('*.json'):
            if preset_file.name == '_schema.json':
                continue

            try:
                with open(preset_file, 'r', encoding='utf-8') as f:
                    preset = json.load(f)
                    preset_id = preset.get('id', preset_file.stem)
                    self.presets[preset_id] = {
                        'file': preset_file.name,
                        'data': preset,
                        'tier': None  # Ska sättas från metadata
                    }
            except Exception as e:
                self.issues.append({
                    'type': 'ERROR',
                    'message': f"Failed to load preset {preset_file.name}: {e}"
                })

    def load_golden_metadata(self, golden_type: str, golden_dir: Path):
        """Ladda golden metadata."""
        metadata_file = golden_dir / 'metadata.json'

        if not metadata_file.exists():
            self.issues.append({
                'type': 'WARNING',
                'message': f"No metadata.json found in {golden_type} golden directory"
            })
            return

        try:
            with open(metadata_file, 'r', encoding='utf-8') as f:
                metadata = json.load(f)

            # Extrahera tier-information
            tiers = metadata.get('tiers', {})
            tier_mapping = {}
            for tier_name, tier_data in tiers.items():
                for preset_id in tier_data.get('presets', []):
                    tier_mapping[preset_id] = tier_name

            # Extrahera golden-exports
            goldens = metadata.get('goldens', [])
            for golden in goldens:
                preset_id = golden.get('id', '')
                tier = golden.get('tier') or tier_mapping.get(preset_id)

                self.goldens[golden_type][preset_id] = {
                    'id': preset_id,
                    'file': golden.get('file', ''),
                    'sha256': golden.get('sha256', ''),
                    'tier': tier,
                    'metadata': golden
                }

                # Uppdatera preset tier om den saknas
                if preset_id in self.presets and tier:
                    self.presets[preset_id]['tier'] = tier

                # Verifiera att filen existerar
                golden_file = golden_dir / golden.get('file', '')
                if not golden_file.exists():
                    self.issues.append({
                        'type': 'ERROR',
                        'message': f"Golden file missing: {golden_type}/{golden.get('file')} (preset: {preset_id})"
                    })
                elif not golden.get('sha256'):
                    self.issues.append({
                        'type': 'WARNING',
                        'message': f"Golden file missing SHA256: {golden_type}/{preset_id}"
                    })

        except Exception as e:
            self.issues.append({
                'type': 'ERROR',
                'message': f"Failed to load metadata from {golden_type}: {e}"
            })

    def check_coverage(self):
        """Kontrollera coverage med tier-baserad policy."""
        # Build map of golden IDs to matched presets
        all_matched_presets = set()
        for golden_type, goldens in self.goldens.items():
            for golden_id in goldens.keys():
                matched = self.find_matching_preset(golden_id)
                if matched:
                    all_matched_presets.add(matched)
                    self.golden_to_preset_map[golden_id] = matched

        presets_without_golden = set(self.presets.keys()) - all_matched_presets

        # Apply tier-based policy for missing goldens
        for preset_id in presets_without_golden:
            tier = self.presets[preset_id].get('tier')

            if tier == 'tier1':
                # Tier 1 MUST have golden - this is an error
                self.issues.append({
                    'type': 'ERROR',
                    'message': f"Tier 1 preset without golden: {preset_id}",
                    'preset_file': self.presets[preset_id]['file']
                })
            elif tier == 'tier2':
                # Tier 2 SHOULD have golden - this is a warning
                self.issues.append({
                    'type': 'WARNING',
                    'message': f"Tier 2 preset without golden: {preset_id}",
                    'preset_file': self.presets[preset_id]['file']
                })
            else:
                # No tier = experimental, golden optional - INFO only
                self.issues.append({
                    'type': 'INFO',
                    'message': f"Experimental preset without golden: {preset_id}",
                    'preset_file': self.presets[preset_id]['file']
                })

        # Identifiera golden-artefakter utan motsvarande preset (orphans)
        # Now using the matching logic
        for golden_type, goldens in self.goldens.items():
            for golden_id in goldens.keys():
                matched = self.find_matching_preset(golden_id)
                if matched is None:
                    self.issues.append({
                        'type': 'WARNING',
                        'message': f"Orphan golden (no matching preset): {golden_type}/{golden_id}"
                    })

        # Kontrollera presets utan tier (INFO only, not a problem)
        presets_without_tier = [
            preset_id for preset_id, preset_data in self.presets.items()
            if preset_data['tier'] is None
        ]

        for preset_id in presets_without_tier:
            self.issues.append({
                'type': 'INFO',
                'message': f"Preset without tier assignment: {preset_id}",
                'preset_file': self.presets[preset_id]['file']
            })

    def check_metadata_consistency(self):
        """Kontrollera att metadata är strukturellt konsekvent."""
        for golden_type, goldens in self.goldens.items():
            for preset_id, golden_info in goldens.items():
                metadata = golden_info['metadata']

                # Kontrollera required fields
                required_fields = ['id', 'file']
                for field in required_fields:
                    if field not in metadata or not metadata[field]:
                        self.issues.append({
                            'type': 'ERROR',
                            'message': f"Missing required field '{field}' in {golden_type}/{preset_id}"
                        })

                # Kontrollera SHA256 format
                sha256 = golden_info.get('sha256', '')
                if sha256 and len(sha256) != 64:
                    self.issues.append({
                        'type': 'WARNING',
                        'message': f"Invalid SHA256 format in {golden_type}/{preset_id}: {sha256[:20]}..."
                    })

    def audit_all(self):
        """Kör fullständig audit."""
        self.load_presets()

        for golden_type, golden_dir in self.golden_dirs.items():
            if golden_dir.exists():
                self.load_golden_metadata(golden_type, golden_dir)
            else:
                self.issues.append({
                    'type': 'WARNING',
                    'message': f"Golden directory not found: {golden_type}"
                })

        self.check_coverage()
        self.check_metadata_consistency()

    def generate_report(self) -> str:
        """Generera markdown-rapport."""
        lines = []
        lines.append("# Golden Baseline Coverage Report V3")
        lines.append("")
        lines.append(f"**Genererad**: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        lines.append("")
        lines.append("**Syfte**: Verifiera att golden-systemet är konsekvent och komplett.")
        lines.append("")
        lines.append(GOLDEN_POLICY)
        lines.append("")

        # Sammanfattning
        error_count = sum(1 for i in self.issues if i['type'] == 'ERROR')
        warning_count = sum(1 for i in self.issues if i['type'] == 'WARNING')
        info_count = sum(1 for i in self.issues if i['type'] == 'INFO')

        total_presets = len(self.presets)
        total_goldens = sum(len(g) for g in self.goldens.values())

        lines.append("## Översikt")
        lines.append("")
        lines.append(f"- **Totalt antal presets**: {total_presets}")
        lines.append(f"- **Totalt antal golden exports**: {total_goldens}")
        lines.append(f"- **ERROR**: {error_count}")
        lines.append(f"- **WARNING**: {warning_count}")
        lines.append(f"- **INFO**: {info_count}")
        lines.append("")

        # Bedömning
        if error_count == 0 and warning_count == 0:
            assessment = "OK"
        elif error_count == 0:
            assessment = "PARTIAL"
        else:
            assessment = "INCOMPLETE"

        lines.append(f"**Bedömning**: **{assessment}**")
        lines.append("")

        # Översiktstabell
        lines.append("## Översiktstabell")
        lines.append("")
        lines.append("| Preset ID | Preset File | Golden (demo_b) | Golden (print_export) | Tier |")
        lines.append("|-----------|-------------|-----------------|------------------------|------|")

        for preset_id in sorted(self.presets.keys()):
            preset_data = self.presets[preset_id]
            demo_b_golden = "[OK]" if preset_id in self.goldens.get('demo_b', {}) else "[MISSING]"
            print_golden = "[OK]" if preset_id in self.goldens.get('print_export', {}) else "[MISSING]"
            tier = preset_data.get('tier', 'N/A')

            lines.append(f"| `{preset_id}` | `{preset_data['file']}` | {demo_b_golden} | {print_golden} | {tier} |")

        lines.append("")

        # Avvikelser
        if self.issues:
            lines.append("## Avvikelser")
            lines.append("")

            issues_by_type = defaultdict(list)
            for issue in self.issues:
                issues_by_type[issue['type']].append(issue)

            for issue_type in ['ERROR', 'WARNING', 'INFO']:
                if issue_type in issues_by_type:
                    lines.append(f"### {issue_type}")
                    lines.append("")
                    for issue in issues_by_type[issue_type]:
                        lines.append(f"- **{issue['message']}**")
                        if 'preset_file' in issue:
                            lines.append(f"  - Preset file: `{issue['preset_file']}`")
                    lines.append("")

        # Golden-detaljer
        lines.append("## Golden Export Detaljer")
        lines.append("")

        for golden_type, goldens in self.goldens.items():
            lines.append(f"### {golden_type}")
            lines.append("")
            lines.append("| Preset ID | File | SHA256 | Tier |")
            lines.append("|----------|------|--------|------|")

            for preset_id in sorted(goldens.keys()):
                golden_info = goldens[preset_id]
                sha256_short = golden_info['sha256'][:16] + '...' if golden_info['sha256'] else 'MISSING'
                tier = golden_info.get('tier', 'N/A')

                lines.append(f"| `{preset_id}` | `{golden_info['file']}` | `{sha256_short}` | {tier} |")

            lines.append("")

        return '\n'.join(lines)

def main():
    repo_root = Path(__file__).parent.parent
    auditor = GoldenCoverageAuditor(repo_root)
    auditor.audit_all()

    report = auditor.generate_report()

    # V3 output file
    output_file = repo_root / 'exports' / 'GOLDEN_COVERAGE_REPORT_V3.md'
    output_file.parent.mkdir(parents=True, exist_ok=True)

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(report)

    # Count by type
    error_count = sum(1 for i in auditor.issues if i['type'] == 'ERROR')
    warning_count = sum(1 for i in auditor.issues if i['type'] == 'WARNING')
    info_count = sum(1 for i in auditor.issues if i['type'] == 'INFO')
    orphans = sum(1 for i in auditor.issues if 'Orphan' in i.get('message', ''))

    print(f"[OK] Golden coverage audit V3 klar. Rapport skapad: {output_file}")
    print(f"   Presets: {len(auditor.presets)}, Goldens: {sum(len(g) for g in auditor.goldens.values())}")
    print(f"   ERROR: {error_count}, WARNING: {warning_count}, INFO: {info_count}")
    print(f"   Orphan goldens: {orphans}")

    # CI exit-code logic
    tier1_errors = sum(1 for i in auditor.issues if i['type'] == 'ERROR' and 'Tier 1' in i.get('message', ''))
    tier2_warnings = sum(1 for i in auditor.issues if i['type'] == 'WARNING' and 'Tier 2' in i.get('message', ''))

    if tier1_errors > 0:
        sys.exit(1)  # HARD FAIL - Tier1 preset missing golden
    elif tier2_warnings > 0:
        sys.exit(2)  # WARNING - Tier2 preset missing golden
    else:
        sys.exit(0)  # OK

if __name__ == '__main__':
    main()

