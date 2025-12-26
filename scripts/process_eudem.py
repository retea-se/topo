#!/usr/bin/env python3
"""
Process manually downloaded EU-DEM files for use in the topo project.

This script takes a raw EU-DEM GeoTIFF (typically in EPSG:3035) and:
1. Clips to the target bbox
2. Reprojects to EPSG:3857
3. Saves to the correct location for the pipeline

Usage:
    python process_eudem.py --input eu_dem_v11_E40N40.TIF --preset stockholm_wide
    python process_eudem.py --input dem.tif --bbox 17.75,59.28,18.25,59.40 --output custom_dem.tif

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
CONFIG_DIR = Path('/app/config') if Path('/app/config').exists() else Path(__file__).parent.parent / 'prep-service' / 'config'


def load_presets() -> dict:
    """Load bbox presets from config."""
    config_file = CONFIG_DIR / 'bbox_presets.json'
    if not config_file.exists():
        config_file = Path(__file__).parent.parent / 'prep-service' / 'config' / 'bbox_presets.json'

    with open(config_file) as f:
        return json.load(f)


def get_bbox_wgs84(preset_name: str) -> Tuple[float, float, float, float]:
    """Get WGS84 bbox for preset."""
    presets = load_presets()
    for preset in presets['presets']:
        if preset['name'] == preset_name:
            bbox = preset['bbox_wgs84']
            return tuple(bbox)
    raise ValueError(f"Preset '{preset_name}' not found")


def get_input_info(input_file: Path) -> dict:
    """Get information about input DEM file using gdalinfo."""
    result = subprocess.run(
        ['gdalinfo', '-json', str(input_file)],
        capture_output=True, text=True, check=True
    )
    return json.loads(result.stdout)


def convert_bbox_to_3857(bbox_wgs84: Tuple[float, float, float, float]) -> Tuple[float, float, float, float]:
    """Convert WGS84 bbox to EPSG:3857."""
    min_lon, min_lat, max_lon, max_lat = bbox_wgs84

    result = subprocess.run([
        'gdaltransform', '-s_srs', 'EPSG:4326', '-t_srs', 'EPSG:3857', '-output_xy'
    ], input=f"{min_lon} {min_lat}\n{max_lon} {max_lat}\n",
       capture_output=True, text=True, check=True)

    coords = result.stdout.strip().split('\n')
    min_x, min_y = map(float, coords[0].split())
    max_x, max_y = map(float, coords[1].split())

    return (min_x, min_y, max_x, max_y)


def process_dem(
    input_file: Path,
    output_file: Path,
    bbox_wgs84: Tuple[float, float, float, float],
    resolution: int = 25
) -> None:
    """
    Process DEM: reproject to EPSG:3857 and clip to bbox.

    Args:
        input_file: Input DEM file (any CRS supported by GDAL)
        output_file: Output file path
        bbox_wgs84: Target bbox in WGS84 (min_lon, min_lat, max_lon, max_lat)
        resolution: Output resolution in meters (default 25m for EU-DEM)
    """
    print(f"Input file: {input_file}")
    print(f"Output file: {output_file}")
    print(f"Target bbox (WGS84): {bbox_wgs84}")

    # Get input file info
    print("\nAnalyzing input file...")
    try:
        info = get_input_info(input_file)
        input_crs = info.get('coordinateSystem', {}).get('wkt', 'Unknown')
        size = info.get('size', [0, 0])
        print(f"  Size: {size[0]} x {size[1]} pixels")
        if 'EPSG:3035' in str(input_crs) or 'ETRS89-extended / LAEA Europe' in str(input_crs):
            print("  CRS: EPSG:3035 (EU-DEM native)")
        elif 'EPSG:4326' in str(input_crs) or 'WGS 84' in str(input_crs):
            print("  CRS: EPSG:4326 (WGS84)")
        else:
            print(f"  CRS: {input_crs[:100]}...")
    except Exception as e:
        print(f"  Warning: Could not read file info: {e}")

    # Convert bbox to EPSG:3857
    print("\nConverting bbox to EPSG:3857...")
    bbox_3857 = convert_bbox_to_3857(bbox_wgs84)
    min_x, min_y, max_x, max_y = bbox_3857

    # Add buffer for edge effects during resampling
    buffer = 500  # 500m buffer
    min_x -= buffer
    min_y -= buffer
    max_x += buffer
    max_y += buffer

    print(f"  Target extent: {min_x:.1f}, {min_y:.1f}, {max_x:.1f}, {max_y:.1f}")

    # Create output directory
    output_file.parent.mkdir(parents=True, exist_ok=True)

    # Run gdalwarp
    print(f"\nReprojecting and clipping (resolution: {resolution}m)...")
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

    print(f"  Command: {' '.join(cmd)}")
    subprocess.run(cmd, check=True)

    # Verify output
    print("\nVerifying output...")
    output_info = get_input_info(output_file)
    output_size = output_info.get('size', [0, 0])
    print(f"  Output size: {output_size[0]} x {output_size[1]} pixels")

    # Calculate file size
    file_size_mb = output_file.stat().st_size / (1024 * 1024)
    print(f"  File size: {file_size_mb:.1f} MB")

    print("\n" + "="*60)
    print("SUCCESS: DEM processed!")
    print("="*60)
    print(f"\nOutput saved to: {output_file}")


def main():
    parser = argparse.ArgumentParser(
        description='Process EU-DEM files for topo project',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Process for stockholm_wide preset
  python process_eudem.py --input eu_dem_v11_E40N40.TIF --preset stockholm_wide

  # Process with custom bbox
  python process_eudem.py --input dem.tif --bbox 17.75,59.28,18.25,59.40 --output my_dem.tif

  # Specify resolution (default 25m)
  python process_eudem.py --input dem.tif --preset stockholm_wide --resolution 30
"""
    )

    parser.add_argument('--input', '-i', required=True, help='Input DEM file (GeoTIFF)')
    parser.add_argument('--preset', '-p', help='Bbox preset name (e.g., stockholm_wide)')
    parser.add_argument('--bbox', '-b', help='Custom bbox as min_lon,min_lat,max_lon,max_lat')
    parser.add_argument('--output', '-o', help='Output file path')
    parser.add_argument('--resolution', '-r', type=int, default=25, help='Output resolution in meters (default: 25)')

    args = parser.parse_args()

    input_file = Path(args.input)
    if not input_file.exists():
        print(f"Error: Input file not found: {input_file}")
        sys.exit(1)

    # Determine bbox
    if args.preset:
        bbox = get_bbox_wgs84(args.preset)
        preset_name = args.preset
    elif args.bbox:
        bbox = tuple(map(float, args.bbox.split(',')))
        preset_name = 'custom'
    else:
        print("Error: Either --preset or --bbox is required")
        sys.exit(1)

    # Determine output file
    if args.output:
        output_file = Path(args.output)
    else:
        output_file = Path(DATA_DIR) / 'dem' / 'manual' / f'{preset_name}_eudem.tif'

    # Process
    process_dem(
        input_file=input_file,
        output_file=output_file,
        bbox_wgs84=bbox,
        resolution=args.resolution
    )

    print("\nNext step: Run build script to generate terrain tiles:")
    print(f"  .\\scripts\\build_stockholm_wide.ps1 -SkipOsm")


if __name__ == '__main__':
    main()
