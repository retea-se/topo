#!/usr/bin/env python3
"""Generate hillshade from DEM."""
import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

DATA_DIR = os.getenv('DATA_DIR', '/data')
CONFIG_DIR = Path('/app/config')
DEM_DIR = Path(DATA_DIR) / 'dem'
TERRAIN_DIR = Path(DATA_DIR) / 'terrain' / 'hillshade'
TERRAIN_DIR.mkdir(parents=True, exist_ok=True)

def load_presets():
    with open(CONFIG_DIR / 'bbox_presets.json') as f:
        return json.load(f)

def get_buffered_bbox_3857(preset_name, buffer_degrees=0.1):
    """Get buffered bbox in EPSG:3857 for hillshade generation.
    Uses same buffer as OSM clipping to ensure tiles match coverage."""
    presets = load_presets()
    for preset in presets['presets']:
        if preset['name'] == preset_name:
            bbox = preset['bbox_wgs84']
            min_lon, min_lat, max_lon, max_lat = bbox
            # Add buffer (same as OSM clipping)
            buffered_bbox = [
                max(-180, min_lon - buffer_degrees),
                max(-90, min_lat - buffer_degrees),
                min(180, max_lon + buffer_degrees),
                min(90, max_lat + buffer_degrees)
            ]
            # Convert WGS84 to EPSG:3857
            import math
            earth_radius = 6378137.0
            min_x = math.radians(buffered_bbox[0]) * earth_radius
            max_x = math.radians(buffered_bbox[2]) * earth_radius
            min_y = math.log(math.tan(math.pi / 4 + math.radians(buffered_bbox[1]) / 2)) * earth_radius
            max_y = math.log(math.tan(math.pi / 4 + math.radians(buffered_bbox[3]) / 2)) * earth_radius
            return (min_x, min_y, max_x, max_y)
    raise ValueError(f"Preset '{preset_name}' not found")

def main():
    parser = argparse.ArgumentParser(description='Generate hillshade from DEM')
    parser.add_argument('--preset', required=True, help='Bbox preset name')
    args = parser.parse_args()

    # Try to find DEM file (could be in manual/ or root of dem/)
    dem_file = DEM_DIR / f"{args.preset}_eudem.tif"
    if not dem_file.exists():
        dem_file = DEM_DIR / 'manual' / f"{args.preset}_eudem.tif"

    output_file = TERRAIN_DIR / f"{args.preset}_hillshade.tif"
    temp_hillshade = TERRAIN_DIR / f"{args.preset}_hillshade_temp.tif"

    # Remove existing output file if it exists
    if output_file.exists():
        output_file.unlink()
        print(f"Removed existing hillshade file: {output_file}")

    if not dem_file.exists():
        print(f"ERROR: DEM file not found. Checked:", file=sys.stderr)
        print(f"  {DEM_DIR / f'{args.preset}_eudem.tif'}", file=sys.stderr)
        print(f"  {DEM_DIR / 'manual' / f'{args.preset}_eudem.tif'}", file=sys.stderr)
        print(f"Run: python3 /app/src/download_dem.py --preset {args.preset} --provider local", file=sys.stderr)
        sys.exit(1)

    print(f"Generating hillshade from {dem_file}")

    # First generate hillshade from DEM
    subprocess.run([
        'gdaldem', 'hillshade',
        '-az', '315',
        '-alt', '45',
        '-z', '1.0',
        '-compute_edges',
        str(dem_file),
        str(temp_hillshade)
    ], check=True)

    # Clip/extend to buffered bbox (same as OSM uses) to ensure tile coverage matches
    try:
        bbox_3857 = get_buffered_bbox_3857(args.preset)
        min_x, min_y, max_x, max_y = bbox_3857
        print(f"Clipping hillshade to buffered bbox (EPSG:3857): {min_x}, {min_y}, {max_x}, {max_y}")

        subprocess.run([
            'gdalwarp',
            '-t_srs', 'EPSG:3857',
            '-te', str(min_x), str(min_y), str(max_x), str(max_y),
            '-r', 'bilinear',
            '-co', 'COMPRESS=LZW',
            '-co', 'TILED=YES',
            str(temp_hillshade),
            str(output_file)
        ], check=True)

        # Remove temp file
        temp_hillshade.unlink(missing_ok=True)
    except Exception as e:
        print(f"Warning: Could not clip to buffered bbox, using original: {e}", file=sys.stderr)
        # Fallback: just use the temp file
        temp_hillshade.replace(output_file)

    print(f"Hillshade generated: {output_file}")

if __name__ == '__main__':
    main()

