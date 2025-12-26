#!/usr/bin/env python3
"""Check export file dimensions and content."""
import sys
from PIL import Image

if len(sys.argv) < 2:
    print("Usage: python check_export.py <image_file>")
    sys.exit(1)

img_path = sys.argv[1]
try:
    img = Image.open(img_path)
    print(f"Dimensions: {img.size[0]}x{img.size[1]} px")
    print(f"Mode: {img.mode}")

    # Check if image is mostly one color (empty/blank)
    pixels = list(img.getdata())
    if len(pixels) > 0:
        unique_colors = len(set(pixels[:10000]))  # Sample first 10k pixels
        print(f"Unique colors (sample): {unique_colors}")
        if unique_colors < 10:
            print("WARNING: Image appears to be mostly blank/monochrome")
        else:
            print("OK: Image has multiple colors")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)



