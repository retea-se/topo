#!/usr/bin/env python3
"""Clip OSM data to bbox preset."""
import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

DATA_DIR = os.getenv('DATA_DIR', '/data')
CONFIG_DIR = Path('/app/config')
OSM_DIR = Path(DATA_DIR) / 'osm'

def load_presets():
    with open(CONFIG_DIR / 'bbox_presets.json') as f:
        return json.load(f)

def get_bbox(preset_name, buffer_degrees=0.1):
    """
    Get bbox for preset, with optional buffer to ensure complete ways are included.
    Buffer helps ensure that long roads/highways that pass near the boundary are fully included.
    """
    presets = load_presets()
    for preset in presets['presets']:
        if preset['name'] == preset_name:
            bbox = preset['bbox_wgs84']
            # Add buffer to bbox to ensure complete ways are included
            # Buffer of 0.1 degrees ≈ 11km at Stockholm's latitude, which should cover most long highways
            min_lon, min_lat, max_lon, max_lat = bbox
            buffered_bbox = [
                max(-180, min_lon - buffer_degrees),  # Clamp to -180
                max(-90, min_lat - buffer_degrees),   # Clamp to -90
                min(180, max_lon + buffer_degrees),   # Clamp to 180
                min(90, max_lat + buffer_degrees)     # Clamp to 90
            ]
            return f"{buffered_bbox[0]},{buffered_bbox[1]},{buffered_bbox[2]},{buffered_bbox[3]}"
    raise ValueError(f"Preset '{preset_name}' not found")

def main():
    parser = argparse.ArgumentParser(description='Clip OSM data to bbox preset')
    parser.add_argument('--preset', required=True, help='Bbox preset name')
    args = parser.parse_args()

    input_file = OSM_DIR / "sweden-latest.osm.pbf"
    output_file = OSM_DIR / f"{args.preset}.osm.pbf"

    if not input_file.exists():
        print(f"ERROR: Input file not found: {input_file}", file=sys.stderr)
        sys.exit(1)

    # Remove existing output file if it exists (osmium extract requires --overwrite flag or clean file)
    if output_file.exists():
        output_file.unlink()
        print(f"Removed existing file: {output_file}")

    bbox = get_bbox(args.preset)
    print(f"Clipping OSM to preset '{args.preset}' with bbox {bbox}")

    subprocess.run([
        'osmium', 'extract',
        '--bbox', bbox,
        '--strategy', 'complete_ways',
        '--output', str(output_file),
        str(input_file)
    ], check=True)

    print(f"Clipped OSM saved: {output_file}")

if __name__ == '__main__':
    main()




