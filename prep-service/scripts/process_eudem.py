#!/usr/bin/env python3
"""
Process manually downloaded EU-DEM files.

Usage:
    python process_eudem.py --input eu_dem_v11.TIF --preset stockholm_wide

Attribution:
    EU-DEM v1.1 - Copernicus Land Monitoring Service
    European Environment Agency (EEA)
"""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Tuple

DATA_DIR = os.getenv('DATA_DIR', '/data')
CONFIG_DIR = Path('/app/config')


def load_presets() -> dict:
    with open(CONFIG_DIR / 'bbox_presets.json') as f:
        return json.load(f)


def get_bbox_wgs84(preset_name: str) -> Tuple[float, float, float, float]:
    presets = load_presets()
    for preset in presets['presets']:
        if preset['name'] == preset_name:
            return tuple(preset['bbox_wgs84'])
    raise ValueError(f"Preset '{preset_name}' not found")


def convert_bbox_to_3857(bbox_wgs84: Tuple[float, float, float, float]) -> Tuple[float, float, float, float]:
    min_lon, min_lat, max_lon, max_lat = bbox_wgs84
    result = subprocess.run([
        'gdaltransform', '-s_srs', 'EPSG:4326', '-t_srs', 'EPSG:3857', '-output_xy'
    ], input=f"{min_lon} {min_lat}\n{max_lon} {max_lat}\n",
       capture_output=True, text=True, check=True)
    coords = result.stdout.strip().split('\n')
    min_x, min_y = map(float, coords[0].split())
    max_x, max_y = map(float, coords[1].split())
    return (min_x, min_y, max_x, max_y)


def process_dem(input_file: Path, output_file: Path, bbox_wgs84: Tuple[float, float, float, float], resolution: int = 25) -> None:
    print(f"Input: {input_file}")
    print(f"Output: {output_file}")
    print(f"Bbox (WGS84): {bbox_wgs84}")

    bbox_3857 = convert_bbox_to_3857(bbox_wgs84)
    min_x, min_y, max_x, max_y = bbox_3857

    # Add buffer
    buffer = 500
    min_x -= buffer
    min_y -= buffer
    max_x += buffer
    max_y += buffer

    print(f"Bbox (EPSG:3857): {min_x:.0f}, {min_y:.0f}, {max_x:.0f}, {max_y:.0f}")

    output_file.parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        'gdalwarp',
        '-t_srs', 'EPSG:3857',
        '-te', str(min_x), str(min_y), str(max_x), str(max_y),
        '-tr', str(resolution), str(resolution),
        '-r', 'bilinear',
        '-co', 'COMPRESS=LZW',
        '-co', 'TILED=YES',
        '-co', 'BIGTIFF=IF_SAFER',
        '-overwrite',
        str(input_file),
        str(output_file)
    ]

    print(f"Running: {' '.join(cmd)}")
    subprocess.run(cmd, check=True)

    file_size_mb = output_file.stat().st_size / (1024 * 1024)
    print(f"\nSUCCESS: {output_file} ({file_size_mb:.1f} MB)")


def main():
    parser = argparse.ArgumentParser(description='Process EU-DEM files')
    parser.add_argument('--input', '-i', required=True, help='Input DEM file')
    parser.add_argument('--preset', '-p', help='Bbox preset name')
    parser.add_argument('--bbox', '-b', help='Custom bbox')
    parser.add_argument('--output', '-o', help='Output file path')
    parser.add_argument('--resolution', '-r', type=int, default=25, help='Resolution (m)')

    args = parser.parse_args()

    input_file = Path(args.input)
    if not input_file.exists():
        print(f"Error: Input file not found: {input_file}")
        sys.exit(1)

    if args.preset:
        bbox = get_bbox_wgs84(args.preset)
        preset_name = args.preset
    elif args.bbox:
        bbox = tuple(map(float, args.bbox.split(',')))
        preset_name = 'custom'
    else:
        print("Error: Either --preset or --bbox is required")
        sys.exit(1)

    if args.output:
        output_file = Path(args.output)
    else:
        output_file = Path(DATA_DIR) / 'dem' / 'manual' / f'{preset_name}_eudem.tif'

    process_dem(input_file, output_file, bbox, args.resolution)


if __name__ == '__main__':
    main()
