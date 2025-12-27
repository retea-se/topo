#!/usr/bin/env python3
"""
DEL A: Dokument-hygien & länk-audit (read-only)
Skannar alla .md-filer och identifierar problem utan att ändra något.

V3: Förbättrad med path-excludes, severity-modell och whitelist för false positives.
"""

import re
import json
import sys
from pathlib import Path
from typing import List, Dict, Set, Tuple
from collections import defaultdict
from datetime import datetime

# Paths to completely exclude from scanning
EXCLUDE_PATHS = [
    'node_modules/',
    '.git/',
    'test-results/',
]

# Paths where broken links are downgraded to INFO (historical/archive content)
ARCHIVE_PATHS = [
    'docs/archive/',
    '**/archive/',
]

# Paths with generated content (downgrade to INFO)
GENERATED_PATHS = [
    'scripts/theme_tool/outputs/',
]

# Patterns that look like file links but are actually documentation examples
# These should NOT be classified as broken links
WHITELIST_PATTERNS = [
    # URL patterns
    r'^https?://',
    r'^mailto:',
    # Command examples
    r'^curl\s',
    r'^localhost:',
    r'^127\.0\.0\.1:',
    # Glob patterns
    r'\*',  # Contains wildcard
    r'\?\.json',  # Pattern like ?.json
    r'themes/\*',
    # Placeholders
    r'<[^>]+>',  # <placeholder>
    r'\{[^}]+\}',  # {placeholder}
    # Variable references
    r'\$\{',
    r'\$\(',
]


def is_whitelisted(link: str) -> bool:
    """Check if a link matches any whitelist pattern."""
    for pattern in WHITELIST_PATTERNS:
        if re.search(pattern, link):
            return True
    return False


def is_excluded_path(path: str) -> bool:
    """Check if a path should be completely excluded."""
    normalized = path.replace('\\', '/')
    for exclude in EXCLUDE_PATHS:
        if exclude in normalized:
            return True
    return False


def is_archive_path(path: str) -> bool:
    """Check if a path is in an archive directory."""
    normalized = path.replace('\\', '/')
    for archive in ARCHIVE_PATHS:
        if archive.startswith('**/'):
            # Match anywhere in path
            pattern = archive[3:]
            if pattern in normalized:
                return True
        elif archive in normalized:
            return True
    return False


def is_generated_path(path: str) -> bool:
    """Check if a path is in a generated content directory."""
    normalized = path.replace('\\', '/')
    for gen in GENERATED_PATHS:
        if gen in normalized:
            return True
    return False


class DocAuditor:
    def __init__(self, repo_root: Path):
        self.repo_root = repo_root
        self.issues = []
        self.all_md_files = {}
        self.all_files = set()

    def scan_files(self):
        """Hitta alla filer i repo."""
        # Hitta alla .md-filer
        for md_file in self.repo_root.rglob("*.md"):
            rel_path = md_file.relative_to(self.repo_root)
            rel_str = str(rel_path)

            # Skip excluded paths
            if is_excluded_path(rel_str):
                continue

            self.all_md_files[rel_str] = md_file
            self.all_files.add(rel_str)

        # Hitta alla andra filer (för länk-validering)
        for file in self.repo_root.rglob("*"):
            if file.is_file() and not file.name.startswith('.'):
                rel_path = file.relative_to(self.repo_root)
                rel_str = str(rel_path)

                # Skip excluded paths
                if is_excluded_path(rel_str):
                    continue

                self.all_files.add(rel_str)

    def find_links(self, content: str, file_path: str) -> List[Tuple[str, int]]:
        """Hitta alla länkar i markdown."""
        links = []

        # Markdown länkar: [text](url)
        pattern = r'\[([^\]]+)\]\(([^)]+)\)'
        for match in re.finditer(pattern, content):
            link_text = match.group(1)
            link_url = match.group(2)
            line_num = content[:match.start()].count('\n') + 1
            links.append((link_url, line_num))

        # Referenser till filer: `path/to/file.md`
        pattern = r'`([^`]+\.(md|json|png|jpg|jpeg|html|js|py|sh|yaml|yml))`'
        for match in re.finditer(pattern, content):
            file_ref = match.group(1)
            line_num = content[:match.start()].count('\n') + 1
            links.append((file_ref, line_num))

        return links

    def resolve_link(self, link: str, from_file: str) -> Path:
        """Resolve en relativ länk till absolut path."""
        from_path = Path(from_file)

        # Ta bort fragment (#section)
        link = link.split('#')[0]

        # Ta bort query params
        link = link.split('?')[0]

        # Normalisera path separators
        link = link.replace('\\', '/')

        # Försök först som path från repo root (t.ex. "docs/STATUS.md")
        if '/' in link and not link.startswith('./') and not link.startswith('../') and not link.startswith('/'):
            repo_path = self.repo_root / link
            if repo_path.exists():
                return Path(link)
            # Om det inte finns, försök relativt från from_file
            from_dir = from_path.parent
            resolved = (from_dir / link).resolve()
            try:
                rel_path = resolved.relative_to(self.repo_root.resolve())
                return rel_path
            except ValueError:
                pass

        # Relativ path (t.ex. "./file.md" eller "../file.md")
        if link.startswith('./') or link.startswith('../'):
            from_dir = from_path.parent
            resolved = (from_dir / link).resolve()
            try:
                return resolved.relative_to(self.repo_root.resolve())
            except ValueError:
                return None

        # Enkel filnamn (t.ex. "file.md") - relativt från from_file
        if not '/' in link and not link.startswith('/'):
            from_dir = from_path.parent
            resolved = (from_dir / link).resolve()
            try:
                return resolved.relative_to(self.repo_root.resolve())
            except ValueError:
                # Försök också från repo root
                repo_path = self.repo_root / link
                if repo_path.exists():
                    return Path(link)
                return None

        # Absolut path (från repo root)
        if link.startswith('/'):
            return Path(link.lstrip('/'))

        return None

    def check_duplicate_headers(self, content: str, file_path: str):
        """Hitta dubblerade rubriker."""
        headers = defaultdict(list)
        lines = content.split('\n')

        for i, line in enumerate(lines, 1):
            # Markdown headers: #, ##, ###, etc.
            match = re.match(r'^(#{1,6})\s+(.+)$', line.strip())
            if match:
                level = len(match.group(1))
                text = match.group(2).strip()
                headers[text].append((i, level))

        for header_text, occurrences in headers.items():
            if len(occurrences) > 1:
                self.issues.append({
                    'type': 'WARNING',
                    'file': file_path,
                    'message': f"Duplicate header '{header_text}' found {len(occurrences)} times",
                    'locations': occurrences
                })

    def check_repeated_sections(self, content: str, file_path: str):
        """Heuristisk kontroll av upprepade avsnitt."""
        lines = content.split('\n')

        # Sök efter identiska rader-sekvenser (minst 5 rader)
        for i in range(len(lines) - 5):
            seq = '\n'.join(lines[i:i+5])
            count = content.count(seq)
            if count > 1:
                # Kontrollera att det inte är en lista eller kodblock
                if not seq.strip().startswith(('```', '-', '*', '1.', '2.')):
                    self.issues.append({
                        'type': 'INFO',
                        'file': file_path,
                        'message': f"Possible repeated section starting at line {i+1}",
                        'preview': seq[:100] + '...' if len(seq) > 100 else seq
                    })
                    break  # Bara första matchningen per fil

    def audit_file(self, file_path: str):
        """Auditera en enskild fil."""
        try:
            with open(self.repo_root / file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
        except Exception as e:
            self.issues.append({
                'type': 'ERROR',
                'file': file_path,
                'message': f"Failed to read file: {e}"
            })
            return

        # Determine severity based on file path
        is_archive = is_archive_path(file_path)
        is_generated = is_generated_path(file_path)

        # Kontrollera länkar
        links = self.find_links(content, file_path)
        for link_url, line_num in links:
            # Skip externa länkar och anchors
            if link_url.startswith(('http://', 'https://', 'mailto:', '#')):
                continue

            # Skip länkar som bara är anchors till samma fil
            if link_url.startswith('#') and '#' not in link_url:
                continue

            # Skip whitelisted patterns (placeholders, globs, commands)
            if is_whitelisted(link_url):
                continue

            resolved = self.resolve_link(link_url, file_path)

            if resolved is None:
                # Determine severity based on context
                if is_archive or is_generated:
                    severity = 'INFO'
                else:
                    severity = 'WARNING'

                self.issues.append({
                    'type': severity,
                    'file': file_path,
                    'line': line_num,
                    'message': f"Unresolvable link: {link_url}",
                    'link': link_url
                })
            else:
                # Kontrollera om filen existerar
                target_path = self.repo_root / resolved
                if not target_path.exists():
                    # Determine severity based on context
                    if is_archive:
                        severity = 'INFO'  # Archive content - historical
                    elif is_generated:
                        severity = 'INFO'  # Generated content - may be stale
                    else:
                        severity = 'ERROR'  # Active docs - real problem

                    self.issues.append({
                        'type': severity,
                        'file': file_path,
                        'line': line_num,
                        'message': f"Broken link to non-existent file: {link_url}",
                        'resolved_path': str(resolved),
                        'link': link_url
                    })

        # Kontrollera dubblerade rubriker
        self.check_duplicate_headers(content, file_path)

        # Kontrollera upprepade avsnitt
        self.check_repeated_sections(content, file_path)

    def audit_all(self):
        """Kör fullständig audit."""
        self.scan_files()

        # Exkludera själva rapportfilerna från audit (för att undvika rekursiva problem)
        exclude_files = {
            'exports/DOC_LINK_AUDIT.md', 'exports/GOLDEN_COVERAGE_REPORT.md', 'exports/THEME_RECIPE_SUMMARY.md',
            'exports\\DOC_LINK_AUDIT.md', 'exports\\GOLDEN_COVERAGE_REPORT.md', 'exports\\THEME_RECIPE_SUMMARY.md'
        }

        for file_path in sorted(self.all_md_files.keys()):
            # Normalisera path för jämförelse
            normalized = file_path.replace('\\', '/')
            if normalized not in exclude_files:
                self.audit_file(file_path)

    def generate_report(self) -> str:
        """Generera markdown-rapport."""
        lines = []
        lines.append("# Dokument-hygien & Länk-audit V3")
        lines.append("")
        lines.append(f"**Genererad**: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        lines.append("")
        lines.append("## Policy")
        lines.append("")
        lines.append("- **ERROR**: Broken links in active documentation")
        lines.append("- **WARNING**: Unresolvable links in active documentation")
        lines.append("- **INFO**: Issues in archive/generated content (informative only)")
        lines.append("")
        lines.append("### Excluded from scan:")
        lines.append(f"- {', '.join(EXCLUDE_PATHS)}")
        lines.append("")
        lines.append("### Downgraded to INFO:")
        lines.append(f"- Archive: {', '.join(ARCHIVE_PATHS)}")
        lines.append(f"- Generated: {', '.join(GENERATED_PATHS)}")
        lines.append("")

        # Sammanfattning
        error_count = sum(1 for i in self.issues if i['type'] == 'ERROR')
        warning_count = sum(1 for i in self.issues if i['type'] == 'WARNING')
        info_count = sum(1 for i in self.issues if i['type'] == 'INFO')

        lines.append("## Sammanfattning")
        lines.append("")
        lines.append(f"- **Totalt antal .md-filer**: {len(self.all_md_files)}")
        lines.append(f"- **ERROR**: {error_count}")
        lines.append(f"- **WARNING**: {warning_count}")
        lines.append(f"- **INFO**: {info_count}")
        lines.append("")

        # Gruppera per fil
        issues_by_file = defaultdict(list)
        for issue in self.issues:
            issues_by_file[issue['file']].append(issue)

        # Sortera filer efter antal problem
        files_sorted = sorted(issues_by_file.items(),
                            key=lambda x: (sum(1 for i in x[1] if i['type'] == 'ERROR'),
                                         sum(1 for i in x[1] if i['type'] == 'WARNING')),
                            reverse=True)

        lines.append("## Detaljerad lista")
        lines.append("")

        for file_path, file_issues in files_sorted:
            lines.append(f"### {file_path}")
            lines.append("")

            # Sortera issues efter typ och radnummer
            file_issues_sorted = sorted(file_issues,
                                      key=lambda x: (x['type'] == 'ERROR' and 0 or x['type'] == 'WARNING' and 1 or 2,
                                                   x.get('line', 9999)))

            for issue in file_issues_sorted:
                type_marker = {
                    'ERROR': '[ERROR]',
                    'WARNING': '[WARNING]',
                    'INFO': '[INFO]'
                }.get(issue['type'], issue['type'])

                line_info = f" (rad {issue['line']})" if 'line' in issue else ""
                lines.append(f"- **{type_marker}**{line_info}: {issue['message']}")

                if 'resolved_path' in issue:
                    lines.append(f"  - Resolved path: `{issue['resolved_path']}`")
                if 'link' in issue:
                    lines.append(f"  - Link: `{issue['link']}`")
                if 'locations' in issue:
                    lines.append(f"  - Locations: {issue['locations']}")
                if 'preview' in issue:
                    lines.append(f"  - Preview: `{issue['preview']}`")

            lines.append("")

        # Lista filer utan problem
        clean_files = set(self.all_md_files.keys()) - set(issues_by_file.keys())
        if clean_files:
            lines.append("## Filer utan problem")
            lines.append("")
            for file_path in sorted(clean_files):
                lines.append(f"- `{file_path}`")
            lines.append("")

        return '\n'.join(lines)

def main():
    repo_root = Path(__file__).parent.parent
    auditor = DocAuditor(repo_root)
    auditor.audit_all()

    report = auditor.generate_report()

    # V3 output file
    output_file = repo_root / 'exports' / 'DOC_LINK_AUDIT_V3.md'
    output_file.parent.mkdir(parents=True, exist_ok=True)

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(report)

    # Count by type
    error_count = sum(1 for i in auditor.issues if i['type'] == 'ERROR')
    warning_count = sum(1 for i in auditor.issues if i['type'] == 'WARNING')
    info_count = sum(1 for i in auditor.issues if i['type'] == 'INFO')

    print(f"[OK] Dokument-audit V3 klar. Rapport skapad: {output_file}")
    print(f"   ERROR: {error_count}, WARNING: {warning_count}, INFO: {info_count}")
    print(f"   (Excluded: {', '.join(EXCLUDE_PATHS)})")

    # CI exit-code logic
    if error_count > 0:
        sys.exit(1)  # ERROR in active documentation
    elif warning_count > 0:
        sys.exit(2)  # WARNING only
    else:
        sys.exit(0)  # OK

if __name__ == '__main__':
    main()

