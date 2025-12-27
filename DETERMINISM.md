# Determinism Validation

## Definition: Byte-Identical Output

For this system:

- **Demo A (Playwright):** Visual stability goal - minor pixel differences acceptable due to GPU rendering
- **Demo B (Mapnik):** Byte-identical goal - same inputs must produce identical PNG/PDF bytes

### PNG Metadata

PNG files may contain:
- Creation timestamp (tIME chunk)
- Software name (tEXt chunk)
- Other metadata

**For byte-identical validation:** We strip metadata or normalize it.

### PDF Metadata

PDF files contain:
- Creation date
- Modification date
- Producer/creator strings

**For byte-identical validation:** We normalize dates or strip metadata.

## Deterministic Post-Processing

### PNG Normalization Script

Create `scripts/normalize_png.sh`:

```bash
#!/bin/bash
# Strip metadata from PNG to enable byte-identical comparison
set -e

INPUT="$1"
OUTPUT="${2:-${INPUT%.png}_normalized.png}"

if [ ! -f "$INPUT" ]; then
    echo "Usage: $0 <input.png> [output.png]"
    exit 1
fi

# Use pngcrush or imagemagick to strip metadata
if command -v pngcrush >/dev/null 2>&1; then
    pngcrush -rem alla -rem text "$INPUT" "$OUTPUT"
elif command -v convert >/dev/null 2>&1; then
    convert "$INPUT" -strip "$OUTPUT"
else
    echo "Error: Need pngcrush or imagemagick"
    exit 1
fi

echo "Normalized: $OUTPUT"
```

### PDF Normalization

For PDFs, we'll need to use a PDF library. Add to `demo-b/renderer/src/normalize_pdf.py`:

```python
"""Normalize PDF metadata for determinism."""
import sys
from PyPDF2 import PdfReader, PdfWriter

def normalize_pdf(input_path: str, output_path: str) -> None:
    """Strip metadata from PDF."""
    reader = PdfReader(input_path)
    writer = PdfWriter()

    for page in reader.pages:
        writer.add_page(page)

    # Remove all metadata
    writer.add_metadata({})

    with open(output_path, 'wb') as f:
        writer.write(f)
```

## Playwright Determinism

### Current Implementation (demo-a/exporter/src/server.js)

Already implemented:
- Fixed viewport (calculated from mm/DPI)
- Fixed deviceScaleFactor: 1.0
- Wait for map.loaded()
- Wait for document.fonts.ready
- Disable animations via CSS
- networkidle wait

### Additional Fixes Needed

Add to `demo-a/exporter/src/server.js`:

```javascript
// Set fixed timezone
await page.emulateTimezone('UTC');

// Mock Date.now() to fixed timestamp
await page.addInitScript(() => {
    const fixedTime = new Date('2024-01-01T12:00:00Z').getTime();
    Date.now = () => fixedTime;
});

// Set fixed locale
await context.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9'
});
```

## Mapnik Determinism

### Current Implementation

- Fixed font paths: `/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf`
- Stable SQL ordering: `ORDER BY ST_Hash(geometry)`
- Fixed simplification tolerance

### Additional Checks

Verify in `demo-b/renderer/src/mapnik_renderer.py`:

1. **No random seeds:** Ensure no random operations
2. **Fixed simplification:** Use explicit tolerance based on scale
3. **Stable layer order:** Layers processed in consistent order
4. **No timestamps in output:** Mapnik should not embed timestamps

## Repeatability Test

Run `scripts/test_determinism.sh` (see separate file):

```bash
# Test Demo B (should be byte-identical)
./scripts/test_determinism.sh demo-b stockholm_core paper 150 420 594

# Test Demo A (visual stability acceptable)
./scripts/test_determinism.sh demo-a stockholm_core paper 150 420 594
```

Expected results:
- **Demo B:** All 3 exports have identical SHA256 hashes
- **Demo A:** Exports may differ slightly (check visually that they're similar)

## Stabilization Checklist

If exports are not identical:

### Demo A (Playwright)
- [ ] Fixed viewport size
- [ ] deviceScaleFactor = 1.0
- [ ] Disabled animations
- [ ] Fixed timezone (UTC)
- [ ] Mocked Date.now()
- [ ] Wait for map idle
- [ ] Wait for fonts ready
- [ ] Fixed locale/language
- [ ] Screenshot with omitBackground: false

### Demo B (Mapnik)
- [ ] Fixed font paths (no font name lookups)
- [ ] Stable SQL ordering (ORDER BY hash)
- [ ] Fixed simplification tolerance
- [ ] No random operations
- [ ] Consistent layer processing order
- [ ] Strip PDF metadata if needed
- [ ] PNG metadata stripped (if comparing)

## Acceptable Variance

### Demo A Tolerance

For Playwright exports, acceptable if:
- Visual appearance is identical
- Minor pixel differences (< 1% of pixels differ)
- Same overall layout and colors

If differences are significant, investigate:
- Tile loading order
- Font rendering differences
- Browser version differences

### Demo B Tolerance

For Mapnik exports, should be:
- Byte-identical (SHA256 hash match)
- Zero pixel differences

If not identical, investigate:
- PostGIS query ordering
- Mapnik version differences
- Font rendering
- Floating point precision issues







