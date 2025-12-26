#!/bin/bash
# Test determinism: run same export multiple times and compare
set -e

DEMO="${1:-demo-b}"
PRESET="${2:-stockholm_core}"
THEME="${3:-paper}"
DPI="${4:-150}"
WIDTH_MM="${5:-420}"
HEIGHT_MM="${6:-594}"

echo "=== Determinism Test: $DEMO ==="
echo "Parameters: preset=$PRESET, theme=$THEME, dpi=$DPI, size=${WIDTH_MM}x${HEIGHT_MM}mm"
echo ""

TEMP_DIR=$(mktemp -d)
EXPORTS=()

# Run export 3 times
for i in {1..3}; do
    OUTPUT="$TEMP_DIR/export_$i.png"

    if [ "$DEMO" = "demo-a" ]; then
        curl -s "http://localhost:8082/render?bbox_preset=$PRESET&theme=$THEME&render_mode=print&dpi=$DPI&width_mm=$WIDTH_MM&height_mm=$HEIGHT_MM" \
            -o "$OUTPUT"
    elif [ "$DEMO" = "demo-b" ]; then
        curl -s -X POST "http://localhost:5000/render" \
            -H "Content-Type: application/json" \
            -d "{\"bbox_preset\":\"$PRESET\",\"theme\":\"$THEME\",\"render_mode\":\"print\",\"dpi\":$DPI,\"width_mm\":$WIDTH_MM,\"height_mm\":$HEIGHT_MM,\"format\":\"png\"}" \
            -o "$OUTPUT"
    else
        echo "Error: Unknown demo: $DEMO (use demo-a or demo-b)"
        exit 1
    fi

    if [ ! -f "$OUTPUT" ] || [ ! -s "$OUTPUT" ]; then
        echo "Error: Export $i failed"
        exit 1
    fi

    EXPORTS+=("$OUTPUT")
    echo "Export $i: $(stat -f%z "$OUTPUT" 2>/dev/null || stat -c%s "$OUTPUT") bytes"
done

echo ""

# Compare SHA256 hashes
HASHES=()
for export in "${EXPORTS[@]}"; do
    HASH=$(sha256sum "$export" 2>/dev/null | cut -d' ' -f1 || shasum -a 256 "$export" 2>/dev/null | cut -d' ' -f1)
    HASHES+=("$HASH")
done

# Check if all hashes are identical
UNIQUE_HASHES=$(printf '%s\n' "${HASHES[@]}" | sort -u | wc -l)

if [ "$UNIQUE_HASHES" -eq 1 ]; then
    echo "✓ PASS: All exports are byte-identical"
    echo "SHA256: ${HASHES[0]}"
    rm -rf "$TEMP_DIR"
    exit 0
else
    echo "✗ FAIL: Exports differ"
    echo "Hash 1: ${HASHES[0]}"
    echo "Hash 2: ${HASHES[1]}"
    echo "Hash 3: ${HASHES[2]}"

    # Compare file sizes
    SIZES=($(stat -f%z "${EXPORTS[@]}" 2>/dev/null || stat -c%s "${EXPORTS[@]}" 2>/dev/null))
    echo ""
    echo "File sizes: ${SIZES[0]}, ${SIZES[1]}, ${SIZES[2]}"

    # If imagemagick available, compare visually
    if command -v compare >/dev/null 2>&1; then
        echo ""
        echo "Generating diff images..."
        compare "${EXPORTS[0]}" "${EXPORTS[1]}" "$TEMP_DIR/diff_1_2.png" 2>/dev/null || true
        compare "${EXPORTS[1]}" "${EXPORTS[2]}" "$TEMP_DIR/diff_2_3.png" 2>/dev/null || true
        echo "Diff images saved in $TEMP_DIR"
    fi

    echo ""
    echo "Note: For Demo A (Playwright), minor differences are acceptable (visual stability goal)."
    echo "      For Demo B (Mapnik), exports should be byte-identical."

    # Don't delete temp dir so user can inspect
    echo "Exports saved in: $TEMP_DIR"
    exit 1
fi





