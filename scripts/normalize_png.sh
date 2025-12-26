#!/bin/bash
# Strip metadata from PNG for byte-identical comparison
set -e

INPUT="$1"
OUTPUT="${2:-${INPUT%.png}_normalized.png}"

if [ ! -f "$INPUT" ]; then
    echo "Usage: $0 <input.png> [output.png]"
    exit 1
fi

# Use pngcrush (preferred) or imagemagick to strip metadata
if command -v pngcrush >/dev/null 2>&1; then
    pngcrush -rem alla -rem text "$INPUT" "$OUTPUT"
elif command -v convert >/dev/null 2>&1; then
    convert "$INPUT" -strip "$OUTPUT"
elif docker run --rm -v "$(pwd)":/work -w /work mwendler/imagemagick convert -strip "$INPUT" "$OUTPUT" 2>/dev/null; then
    echo "Used Docker imagemagick"
else
    echo "Error: Need pngcrush or imagemagick (or Docker)"
    exit 1
fi

echo "Normalized: $OUTPUT"



