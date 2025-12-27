# Document Audit Recommendations

## Sammanfattning

| Kategori | Count | Procent |
|----------|-------|---------|
| **Totalt ERROR** | 319 | 100% |
| Arkivfiler (`docs/archive/`) | ~105 | ~33% |
| Theme tool outputs | ~70 | ~22% |
| Placeholder-syntax (`<theme>_*.md`) | 6 | 2% |
| Shell-kommandon i text | ~15 | 5% |
| Glob-patterns (`*.json`, `*.png`) | ~10 | 3% |
| node_modules | 6 | 2% |
| **Verkliga ERROR** | ~107 | ~33% |

### Rekommendation

Scriptet `qa_doc_audit.py` bor uppgraderas med:

1. **Exclude-regler** for arkiv och node_modules
2. **Placeholder-detektion** for `<...>` och glob-syntax
3. **Severity-modell** som nedgraderar arkivproblem till INFO
4. **Shell-kommando-filter** for att ignorera backtick-innehall i kodblock

Detta skulle reducera ERROR-raknaren fran 319 till cirka 100-110 verkliga, atgardbara problem.

---

## Foreslagna exclude-regler

### Archive paths (nedgradera till INFO)

```python
ARCHIVE_PATHS = [
    'docs/archive/',
    'docs\\archive\\',
]
```

Motivation: Arkiverade filer har intentionellt trasiga lankar. Dessa ar historiska dokument dar lankmalet kan ha raderats eller flyttats. Att fixa dessa lankar ar inte produktivt.

### node_modules (exkludera helt)

```python
EXCLUDE_PATHS = [
    'node_modules/',
    'node_modules\\',
]
```

Motivation: Tredjepartsfiler ska inte valideras. Dessa ar utanfor projektets kontroll.

### Generated outputs (nedgradera till WARNING)

```python
GENERATED_PATHS = [
    'scripts/theme_tool/outputs/',
    'scripts\\theme_tool\\outputs\\',
    'test-results/',
    'test-results\\',
]
```

Motivation: Auto-genererade rapporter kan referera till filer som inte finns. Dessa ar inte manuellt underhallna.

---

## Placeholder patterns (ignorera)

```python
PLACEHOLDER_PATTERNS = [
    r'<[^>]+>',           # <theme>, <preset>, etc.
    r'\*\.[a-z]+',        # *.json, *.png, *.md
    r'\{[^}]+\}',         # {z}/{x}/{y}.png, {preset}
    r'\.ps1/\.sh',        # build_full_coverage.ps1/.sh (dual-platform syntax)
]
```

### Exempel pa falska positiver som skulle fanga:

| Monster | Exempel | Anledning |
|---------|---------|-----------|
| `<theme>_README.md` | Placeholder i dokumentation | Glob-liknande syntax |
| `*.json` | `config/export_presets/*.json` | Glob-pattern |
| `{z}/{x}/{y}.png` | Tile URL-mall | Template-syntax |
| `build_full_coverage.ps1/.sh` | Dual-platform filnamn | Dokumentationssyntax |

---

## Shell-kommandon i kodblock (ignorera)

Scriptet identifierar nu felaktigt backtick-innehall som lankar. Exempel:

```
node scripts/qa_preset_export.js     -> Tolkas som link till "node scripts/..."
curl "http://localhost:8082/..."     -> Tolkas som link
```

### Forslag: Detektera kodblock-kontext

```python
SHELL_COMMAND_PREFIXES = [
    'node ',
    'npm ',
    'python ',
    'python3 ',
    'curl ',
    'docker ',
    'git ',
]
```

Alternativt: Skippa allt innehall inuti trippel-backticks (``` ... ```) vid lankskning.

---

## Foreslagna script-andringar

### 1. Lagg till konstanter for exclude/downgrade

```python
# Near top of DocAuditor class or as module-level constants

EXCLUDE_PATHS = [
    'node_modules/',
]

ARCHIVE_PATHS = [
    'docs/archive/',
]

GENERATED_PATHS = [
    'scripts/theme_tool/outputs/',
    'test-results/',
]

PLACEHOLDER_PATTERNS = [
    re.compile(r'<[^>]+>'),          # <theme>, <preset>
    re.compile(r'\*\.[a-z]+'),       # *.json, *.png
    re.compile(r'\{[^}]+\}'),        # {z}/{x}/{y}
]

SHELL_PREFIXES = ['node ', 'npm ', 'python ', 'curl ', 'docker ', 'git ']
```

### 2. Modifiera scan_files() for att exkludera

```python
def scan_files(self):
    for md_file in self.repo_root.rglob("*.md"):
        rel_path = md_file.relative_to(self.repo_root)
        rel_str = str(rel_path).replace('\\', '/')

        # Skip excluded paths entirely
        if any(rel_str.startswith(exc) for exc in EXCLUDE_PATHS):
            continue

        self.all_md_files[str(rel_path)] = md_file
```

### 3. Modifiera audit_file() for severity-modell

```python
def audit_file(self, file_path: str):
    # ... existing code ...

    # Determine base severity based on path
    normalized_path = file_path.replace('\\', '/')

    if any(normalized_path.startswith(p.replace('\\', '/')) for p in ARCHIVE_PATHS):
        base_severity = 'INFO'  # Downgrade archive issues
    elif any(normalized_path.startswith(p.replace('\\', '/')) for p in GENERATED_PATHS):
        base_severity = 'WARNING'  # Downgrade generated file issues
    else:
        base_severity = 'ERROR'  # Active docs get ERROR
```

### 4. Lagg till placeholder-filter i find_links()

```python
def find_links(self, content: str, file_path: str) -> List[Tuple[str, int]]:
    links = []

    for match in re.finditer(pattern, content):
        link_url = match.group(2)

        # Skip placeholders and globs
        if any(p.search(link_url) for p in PLACEHOLDER_PATTERNS):
            continue

        # Skip shell commands
        if any(link_url.startswith(prefix) for prefix in SHELL_PREFIXES):
            continue

        links.append((link_url, line_num))
```

---

## Signal vs Brus-matris

| Kalla | Count | Kategori | Atgard |
|-------|-------|----------|--------|
| `docs/archive/**` | ~105 | Brus | Nedgradera till INFO |
| `scripts/theme_tool/outputs/**` | ~70 | Brus | Nedgradera till WARNING |
| `node_modules/**` | 6 | Brus | Exkludera helt |
| `<theme>_*.md` placeholders | 6 | Brus | Ignorera (placeholder-pattern) |
| `*.json` glob-patterns | ~10 | Brus | Ignorera (glob-pattern) |
| `node scripts/...` shell-kommandon | ~15 | Brus | Ignorera (shell-prefix) |
| `curl ...` i backticks | ~5 | Brus | Ignorera (shell-prefix) |
| **Aktiva dokument med trasiga lankar** | ~100-110 | Signal | Behall som ERROR |

---

## Verkliga problem att atgarda (Signal)

Efter filtrering kvarstar cirka 100-110 verkliga ERROR som bor fixas:

### Hog prioritet (aktiv dokumentation)

| Fil | Problem | Forslag |
|-----|---------|---------|
| `CLAUDE.md` | Link till `/docs/CURRENT_STATUS.md` saknas | Skapa filen eller uppdatera lanken |
| `docs/ROADMAP.md` | `../archive/TODO_EXPORT_EDITOR_completed.md` saknas | Verifiera arkivstruktur |
| `docs/SWEDEN_FULL_COVERAGE_PLAN.md` | Links till `docs/docs/...` (dubbel prefix) | Fixa lankformat |
| `docs/QA_GOLDEN_EXPORTS.md` | Refererar `*_golden.png` som inte finns | Skapa golden-filer eller uppdatera doc |

### Medel prioritet (feature-dokumentation)

| Fil | Problem |
|-----|---------|
| `docs/FONTS_INVENTORY.md` | `DETERMINISM.md` link trasig |
| `docs/BUILD_GUIDE.md` | `build_utils.sh` finns inte |
| `DETERMINISM.md` | `normalize_pdf.py` finns inte |

### Lag prioritet (testrapporter)

| Fil | Problem |
|-----|---------|
| `exports/LAYOUT_DESIGNS_REPORT.md` | Temporara filreferenser |
| `docs/LAYOUT_EXPORT_TESTING_REPORT.md` | Temporara screenshots |

---

## Rekommenderad implementationsordning

1. **Fas 1**: Lagg till `EXCLUDE_PATHS` for node_modules (enkel vinst)
2. **Fas 2**: Lagg till `ARCHIVE_PATHS` med severity-nedgradering
3. **Fas 3**: Implementera `PLACEHOLDER_PATTERNS`
4. **Fas 4**: Lagg till shell-kommando-filter
5. **Fas 5**: Kor om audit och fixa kvarstaende ~100 verkliga ERROR

---

## Forvantat resultat efter andringar

| Metric | Fore | Efter |
|--------|------|-------|
| ERROR | 319 | ~100-110 |
| WARNING | 57 | ~120 (inkl. nedgraderade) |
| INFO | 21 | ~130 (inkl. arkiv) |
| **Actionable items** | Okart | ~100-110 tydliga |

Rapporten blir mer anvandbar nar brus filtreras bort och fokus ligger pa verkliga, atgardbara problem i aktiv dokumentation.
