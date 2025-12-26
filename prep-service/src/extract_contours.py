#!/usr/bin/env python3
"""Extract contours from DEM (NOT hillshade)."""
import argparse
import os
import subprocess
import sys
from pathlib import Path

DATA_DIR = os.getenv('DATA_DIR', '/data')
DEM_DIR = Path(DATA_DIR) / 'dem'
CONTOURS_DIR = Path(DATA_DIR) / 'terrain' / 'contours'
CONTOURS_DIR.mkdir(parents=True, exist_ok=True)

CONTOUR_INTERVALS = [2, 10, 50]

def main():
    parser = argparse.ArgumentParser(description='Extract contours from DEM')
    parser.add_argument('--preset', required=True, help='Bbox preset name')
    args = parser.parse_args()

    # Try to find DEM file (could be in manual/ or root of dem/)
    dem_file = DEM_DIR / f"{args.preset}_eudem.tif"
    if not dem_file.exists():
        dem_file = DEM_DIR / 'manual' / f"{args.preset}_eudem.tif"

    if not dem_file.exists():
        print(f"ERROR: DEM file not found. Checked:", file=sys.stderr)
        print(f"  {DEM_DIR / f'{args.preset}_eudem.tif'}", file=sys.stderr)
        print(f"  {DEM_DIR / 'manual' / f'{args.preset}_eudem.tif'}", file=sys.stderr)
        print(f"Run: python3 /app/src/download_dem.py --preset {args.preset} --provider local", file=sys.stderr)
        sys.exit(1)

    print(f"Extracting contours from DEM: {dem_file}")

    for interval in CONTOUR_INTERVALS:
        output_file = CONTOURS_DIR / f"{args.preset}_{interval}m.geojson"
        print(f"  Generating {interval}m contours...")

        subprocess.run([
            'gdal_contour',
            '-i', str(interval),
            '-a', 'elevation',
            '-f', 'GeoJSON',
            str(dem_file),
            str(output_file)
        ], check=True)

        print(f"  Contours saved: {output_file}")

    print("Contour extraction complete")

if __name__ == '__main__':
    main()

