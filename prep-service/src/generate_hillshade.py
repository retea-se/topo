#!/usr/bin/env python3
"""Generate hillshade from DEM."""
import argparse
import os
import subprocess
import sys
from pathlib import Path

DATA_DIR = os.getenv('DATA_DIR', '/data')
DEM_DIR = Path(DATA_DIR) / 'dem'
TERRAIN_DIR = Path(DATA_DIR) / 'terrain' / 'hillshade'
TERRAIN_DIR.mkdir(parents=True, exist_ok=True)

def main():
    parser = argparse.ArgumentParser(description='Generate hillshade from DEM')
    parser.add_argument('--preset', required=True, help='Bbox preset name')
    args = parser.parse_args()

    # Try to find DEM file (could be in manual/ or root of dem/)
    dem_file = DEM_DIR / f"{args.preset}_eudem.tif"
    if not dem_file.exists():
        dem_file = DEM_DIR / 'manual' / f"{args.preset}_eudem.tif"

    output_file = TERRAIN_DIR / f"{args.preset}_hillshade.tif"

    if not dem_file.exists():
        print(f"ERROR: DEM file not found. Checked:", file=sys.stderr)
        print(f"  {DEM_DIR / f'{args.preset}_eudem.tif'}", file=sys.stderr)
        print(f"  {DEM_DIR / 'manual' / f'{args.preset}_eudem.tif'}", file=sys.stderr)
        print(f"Run: python3 /app/src/download_dem.py --preset {args.preset} --provider local", file=sys.stderr)
        sys.exit(1)

    print(f"Generating hillshade from {dem_file}")

    subprocess.run([
        'gdaldem', 'hillshade',
        '-az', '315',
        '-alt', '45',
        '-z', '1.0',
        '-compute_edges',
        str(dem_file),
        str(output_file)
    ], check=True)

    print(f"Hillshade generated: {output_file}")

if __name__ == '__main__':
    main()

