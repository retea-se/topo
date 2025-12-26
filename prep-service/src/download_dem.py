#!/usr/bin/env python3
"""Download DEM data for bbox preset."""
import argparse
import json
import os
import sys
from pathlib import Path

from dem_provider import EUDEMProvider, LocalFileProvider, GLO30Provider

DATA_DIR = os.getenv('DATA_DIR', '/data')
CONFIG_DIR = Path('/app/config')

def load_presets():
    """Load bbox presets from config."""
    with open(CONFIG_DIR / 'bbox_presets.json') as f:
        return json.load(f)

def get_bbox_wgs84(preset_name: str) -> tuple:
    """Get WGS84 bbox for preset."""
    presets = load_presets()
    for preset in presets['presets']:
        if preset['name'] == preset_name:
            bbox = preset['bbox_wgs84']
            return tuple(bbox)  # (min_lon, min_lat, max_lon, max_lat)
    raise ValueError(f"Preset '{preset_name}' not found")

def main():
    parser = argparse.ArgumentParser(description='Download DEM data')
    parser.add_argument('--preset', required=True, help='Bbox preset name')
    parser.add_argument('--provider', default='local', help='DEM provider: local (manual file), eudem (EU-DEM), or glo30 (GLO-30 automated)')
    args = parser.parse_args()

    # Get bbox from preset (for future use with automated download)
    try:
        bbox_wgs84 = get_bbox_wgs84(args.preset)
    except ValueError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)

    cache_key = f"{args.preset}_eudem"

    # Select provider
    if args.provider == 'local':
        provider = LocalFileProvider()
    elif args.provider == 'eudem':
        provider = EUDEMProvider()
    elif args.provider == 'glo30':
        try:
            provider = GLO30Provider()
        except ValueError as e:
            print(f"ERROR: {e}", file=sys.stderr)
            print("Set COPERNICUS_USERNAME and COPERNICUS_PASSWORD environment variables", file=sys.stderr)
            sys.exit(1)
    else:
        print(f"ERROR: Unknown provider: {args.provider} (use 'local', 'eudem', or 'glo30')", file=sys.stderr)
        sys.exit(1)

    try:
        output_path = provider.download(bbox_wgs84, cache_key)
        print(f"DEM loaded: {output_path}")

        # Save checksum for verification
        checksum_file = Path(output_path).parent / f"{cache_key}.sha256"
        checksum = provider.get_checksum(output_path)
        with open(checksum_file, 'w') as f:
            f.write(checksum)
        print(f"Checksum saved: {checksum_file}")

    except FileNotFoundError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        print("\nManual download instructions:", file=sys.stderr)
        print("1. Download EU-DEM tile covering Stockholm from:", file=sys.stderr)
        print("   https://land.copernicus.eu/imagery-in-situ/eu-dem", file=sys.stderr)
        print("2. Reproject to EPSG:3857:", file=sys.stderr)
        print(f"   gdalwarp -t_srs EPSG:3857 input.tif /data/dem/manual/{cache_key}.tif", file=sys.stderr)
        print(f"3. Place file at: /data/dem/manual/{cache_key}.tif", file=sys.stderr)
        print("See DEM_MANUAL_DOWNLOAD.md for detailed instructions", file=sys.stderr)
        sys.exit(1)
    except NotImplementedError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        print("Use --provider local for manual download workflow", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
