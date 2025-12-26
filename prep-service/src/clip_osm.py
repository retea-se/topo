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

def get_bbox(preset_name):
    presets = load_presets()
    for preset in presets['presets']:
        if preset['name'] == preset_name:
            bbox = preset['bbox_wgs84']
            return f"{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]}"
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

    bbox = get_bbox(args.preset)
    print(f"Clipping OSM to preset '{args.preset}' with bbox {bbox}")

    subprocess.run([
        'osmium', 'extract',
        '--bbox', bbox,
        '--output', str(output_file),
        str(input_file)
    ], check=True)

    print(f"Clipped OSM saved: {output_file}")

if __name__ == '__main__':
    main()




