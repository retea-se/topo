#!/bin/bash
# Verify export dimensions match expected pixel sizes
set -e

if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <png_file> [width_mm] [height_mm] [dpi]"
    echo "Example: $0 export.png 420 594 150"
    exit 1
fi

PNG_FILE="$1"
WIDTH_MM="${2:-420}"
HEIGHT_MM="${3:-594}"
DPI="${4:-150}"

if [ ! -f "$PNG_FILE" ]; then
    echo "Error: File not found: $PNG_FILE"
    exit 1
fi

# Expected dimensions
EXPECTED_WIDTH=$(echo "$WIDTH_MM * $DPI / 25.4" | bc | cut -d. -f1)
EXPECTED_HEIGHT=$(echo "$HEIGHT_MM * $DPI / 25.4" | bc | cut -d. -f1)

# Get actual dimensions (requires imagemagick or similar)
if command -v identify >/dev/null 2>&1; then
    ACTUAL_DIMS=$(identify -format "%wx%h" "$PNG_FILE")
    ACTUAL_WIDTH=$(echo "$ACTUAL_DIMS" | cut -dx -f1)
    ACTUAL_HEIGHT=$(echo "$ACTUAL_DIMS" | cut -dx -f2)
elif docker run --rm -v "$(pwd)":/work -w /work mwendler/imagemagick identify -format "%wx%h" "$PNG_FILE" > /tmp/dims.txt 2>/dev/null; then
    ACTUAL_DIMS=$(cat /tmp/dims.txt)
    ACTUAL_WIDTH=$(echo "$ACTUAL_DIMS" | cut -dx -f1)
    ACTUAL_HEIGHT=$(echo "$ACTUAL_DIMS" | cut -dx -f2)
else
    echo "Error: Need 'identify' command (ImageMagick) or Docker"
    exit 1
fi

echo "File: $PNG_FILE"
echo "Expected: ${EXPECTED_WIDTH}x${EXPECTED_HEIGHT} (${WIDTH_MM}mm x ${HEIGHT_MM}mm at ${DPI} DPI)"
echo "Actual: ${ACTUAL_WIDTH}x${ACTUAL_HEIGHT}"

if [ "$ACTUAL_WIDTH" -eq "$EXPECTED_WIDTH" ] && [ "$ACTUAL_HEIGHT" -eq "$EXPECTED_HEIGHT" ]; then
    echo "✓ Dimensions match"
    exit 0
else
    echo "✗ Dimensions mismatch!"
    exit 1
fi




