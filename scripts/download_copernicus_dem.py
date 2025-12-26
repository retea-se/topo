#!/usr/bin/env python3
"""
Download Copernicus DEM for Stockholm Wide preset.

This script downloads Copernicus DEM 30m (GLO-30) data from the
Copernicus Data Space Ecosystem (CDSE) API.

The Copernicus DEM is based on WorldDEM and provides global coverage
at 30m resolution - comparable to EU-DEM 25m for terrain visualization.

Usage:
    python download_copernicus_dem.py --preset stockholm_wide
    python download_copernicus_dem.py --bbox 17.75,59.28,18.25,59.40

Environment variables (optional - will prompt if not set):
    COPERNICUS_USERNAME: Your CDSE username
    COPERNICUS_PASSWORD: Your CDSE password

Output:
    /data/dem/manual/{preset}_eudem.tif (EPSG:3857, clipped to bbox)

Attribution:
    Copernicus DEM - GLO-30 Public
    (c) DLR e.V. 2014-2018 and Airbus Defence and Space GmbH 2017-2018
    provided under COPERNICUS by the European Union and ESA, all rights reserved.
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Optional, Tuple
import urllib.request
import urllib.error
import urllib.parse

# Configuration
DATA_DIR = os.getenv('DATA_DIR', '/data')
CONFIG_DIR = Path('/app/config') if Path('/app/config').exists() else Path(__file__).parent.parent / 'prep-service' / 'config'

# CDSE API endpoints
CDSE_TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
CDSE_ODATA_URL = "https://catalogue.dataspace.copernicus.eu/odata/v1"
CDSE_DOWNLOAD_URL = "https://zipper.dataspace.copernicus.eu/odata/v1"

# Copernicus DEM product collection
COP_DEM_COLLECTION = "COP-DEM_GLO-30-DGED__2022_1"


def load_presets() -> dict:
    """Load bbox presets from config."""
    config_file = CONFIG_DIR / 'bbox_presets.json'
    if not config_file.exists():
        # Try relative path
        config_file = Path(__file__).parent.parent / 'prep-service' / 'config' / 'bbox_presets.json'

    with open(config_file) as f:
        return json.load(f)


def get_bbox_wgs84(preset_name: str) -> Tuple[float, float, float, float]:
    """Get WGS84 bbox for preset."""
    presets = load_presets()
    for preset in presets['presets']:
        if preset['name'] == preset_name:
            bbox = preset['bbox_wgs84']
            return tuple(bbox)  # (min_lon, min_lat, max_lon, max_lat)
    raise ValueError(f"Preset '{preset_name}' not found")


def get_cdse_token(username: str, password: str) -> str:
    """Get OAuth2 access token from CDSE."""
    print("Authenticating with Copernicus Data Space...")

    data = urllib.parse.urlencode({
        'username': username,
        'password': password,
        'grant_type': 'password',
        'client_id': 'cdse-public'
    }).encode('utf-8')

    req = urllib.request.Request(CDSE_TOKEN_URL, data=data, method='POST')
    req.add_header('Content-Type', 'application/x-www-form-urlencoded')

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result['access_token']
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8') if e.fp else ''
        raise RuntimeError(f"Authentication failed: {e.code} {e.reason}\n{error_body}")


def find_dem_tiles(bbox: Tuple[float, float, float, float], token: str) -> list:
    """Find Copernicus DEM tiles covering the bbox."""
    min_lon, min_lat, max_lon, max_lat = bbox

    # Build WKT polygon for the bbox
    wkt = f"POLYGON(({min_lon} {min_lat},{max_lon} {min_lat},{max_lon} {max_lat},{min_lon} {max_lat},{min_lon} {min_lat}))"

    # OData query to find intersecting products
    filter_query = f"Collection/Name eq '{COP_DEM_COLLECTION}' and OData.CSC.Intersects(area=geography'SRID=4326;{wkt}')"

    query_params = urllib.parse.urlencode({
        '$filter': filter_query,
        '$top': 100,
        '$orderby': 'ContentDate/Start desc'
    })

    url = f"{CDSE_ODATA_URL}/Products?{query_params}"

    req = urllib.request.Request(url)
    req.add_header('Authorization', f'Bearer {token}')

    print(f"Searching for DEM tiles covering bbox {bbox}...")

    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            result = json.loads(response.read().decode('utf-8'))
            products = result.get('value', [])
            print(f"Found {len(products)} DEM tiles")
            return products
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8') if e.fp else ''
        raise RuntimeError(f"Search failed: {e.code} {e.reason}\n{error_body}")


def download_product(product_id: str, product_name: str, token: str, output_dir: Path) -> Path:
    """Download a single DEM product."""
    url = f"{CDSE_DOWNLOAD_URL}/Products({product_id})/$value"

    output_file = output_dir / f"{product_name}.zip"

    if output_file.exists():
        print(f"  Already downloaded: {output_file.name}")
        return output_file

    print(f"  Downloading: {product_name}...")

    req = urllib.request.Request(url)
    req.add_header('Authorization', f'Bearer {token}')

    try:
        with urllib.request.urlopen(req, timeout=300) as response:
            total_size = int(response.headers.get('Content-Length', 0))
            downloaded = 0

            with open(output_file, 'wb') as f:
                while True:
                    chunk = response.read(8192)
                    if not chunk:
                        break
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size:
                        pct = (downloaded / total_size) * 100
                        print(f"\r  Progress: {pct:.1f}%", end='', flush=True)
            print()  # newline after progress

        return output_file
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8') if e.fp else ''
        raise RuntimeError(f"Download failed: {e.code} {e.reason}\n{error_body}")


def extract_dem_tif(zip_file: Path, output_dir: Path) -> Path:
    """Extract DEM GeoTIFF from downloaded archive."""
    import zipfile

    with zipfile.ZipFile(zip_file, 'r') as zf:
        # Find the DEM file (usually named *_DEM.tif)
        dem_files = [n for n in zf.namelist() if n.endswith('_DEM.tif') or n.endswith('_dem.tif')]

        if not dem_files:
            # Try to find any .tif file
            dem_files = [n for n in zf.namelist() if n.endswith('.tif')]

        if not dem_files:
            raise RuntimeError(f"No DEM file found in {zip_file}")

        dem_file = dem_files[0]
        print(f"  Extracting: {dem_file}")

        extracted_path = output_dir / Path(dem_file).name

        with zf.open(dem_file) as src, open(extracted_path, 'wb') as dst:
            dst.write(src.read())

        return extracted_path


def merge_and_process_dems(dem_files: list, bbox: Tuple[float, float, float, float], output_file: Path) -> None:
    """Merge multiple DEM tiles, clip to bbox, and reproject to EPSG:3857."""
    min_lon, min_lat, max_lon, max_lat = bbox

    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir = Path(tmpdir)

        if len(dem_files) == 1:
            merged_file = dem_files[0]
        else:
            # Merge multiple tiles
            print("Merging DEM tiles...")
            merged_file = tmpdir / 'merged.tif'
            cmd = ['gdal_merge.py', '-o', str(merged_file)] + [str(f) for f in dem_files]
            subprocess.run(cmd, check=True)

        # Warp to EPSG:3857 with bbox clipping
        print("Reprojecting to EPSG:3857 and clipping to bbox...")

        # First, convert bbox to EPSG:3857
        result = subprocess.run([
            'gdaltransform', '-s_srs', 'EPSG:4326', '-t_srs', 'EPSG:3857', '-output_xy'
        ], input=f"{min_lon} {min_lat}\n{max_lon} {max_lat}\n",
           capture_output=True, text=True, check=True)

        coords = result.stdout.strip().split('\n')
        min_x, min_y = map(float, coords[0].split())
        max_x, max_y = map(float, coords[1].split())

        # Add small buffer to ensure full coverage
        buffer = 500  # 500m buffer
        min_x -= buffer
        min_y -= buffer
        max_x += buffer
        max_y += buffer

        # Warp with clipping
        output_file.parent.mkdir(parents=True, exist_ok=True)

        cmd = [
            'gdalwarp',
            '-t_srs', 'EPSG:3857',
            '-te', str(min_x), str(min_y), str(max_x), str(max_y),
            '-r', 'bilinear',
            '-tr', '30', '30',  # 30m resolution
            '-co', 'COMPRESS=LZW',
            '-co', 'TILED=YES',
            '-co', 'BIGTIFF=IF_SAFER',
            str(merged_file),
            str(output_file)
        ]

        subprocess.run(cmd, check=True)

        print(f"Output saved: {output_file}")


def download_copernicus_dem(
    bbox: Tuple[float, float, float, float],
    output_file: Path,
    username: Optional[str] = None,
    password: Optional[str] = None
) -> bool:
    """
    Download and process Copernicus DEM for the given bbox.

    Returns True on success, False if manual download is needed.
    """
    # Get credentials
    username = username or os.getenv('COPERNICUS_USERNAME')
    password = password or os.getenv('COPERNICUS_PASSWORD')

    if not username or not password:
        print("\nCopernicus credentials not found.")
        print("Set COPERNICUS_USERNAME and COPERNICUS_PASSWORD environment variables,")
        print("or use the manual download workflow.\n")
        return False

    try:
        # Authenticate
        token = get_cdse_token(username, password)
        print("Authentication successful!")

        # Find tiles
        products = find_dem_tiles(bbox, token)

        if not products:
            print("No DEM tiles found for this bbox.")
            print("The area may not be covered by Copernicus DEM GLO-30.")
            return False

        # Create temp directory for downloads
        download_dir = Path(DATA_DIR) / 'dem' / 'downloads'
        download_dir.mkdir(parents=True, exist_ok=True)

        # Download and extract each tile
        dem_files = []
        for product in products:
            product_id = product['Id']
            product_name = product['Name']

            zip_file = download_product(product_id, product_name, token, download_dir)
            tif_file = extract_dem_tif(zip_file, download_dir)
            dem_files.append(tif_file)

        # Merge and process
        merge_and_process_dems(dem_files, bbox, output_file)

        return True

    except Exception as e:
        print(f"\nError during automated download: {e}")
        print("Falling back to manual download instructions.\n")
        return False


def print_manual_instructions(bbox: Tuple[float, float, float, float], output_file: Path, preset_name: str) -> None:
    """Print instructions for manual EU-DEM download."""
    min_lon, min_lat, max_lon, max_lat = bbox

    print("""
================================================================================
                    MANUAL EU-DEM DOWNLOAD REQUIRED
================================================================================

The automated Copernicus DEM download could not complete.
Please follow these steps to manually download EU-DEM:

STEP 1: Download EU-DEM Tile
----------------------------
1. Visit: https://land.copernicus.eu/imagery-in-situ/eu-dem/eu-dem-v1.1
2. Register/login if needed (free account)
3. Download tile covering Stockholm area
   - Look for tile: E40N40 (covers Scandinavia)
   - Or use the interactive map to find the right tile

Alternative sources:
- https://land.copernicus.eu/pan-european/satellite-derived-products/eu-dem/eu-dem-v1-1
- Direct search for "EU-DEM Stockholm" in the Copernicus portal

STEP 2: Place and Process the File
-----------------------------------
After downloading, run this script to process:

    python scripts/process_eudem.py --input <downloaded_file.tif> --preset """ + preset_name + """

Or manually process with GDAL:

    gdalwarp -t_srs EPSG:3857 \\
             -te <min_x> <min_y> <max_x> <max_y> \\
             -r bilinear \\
             -co COMPRESS=LZW \\
             -co TILED=YES \\
             <input.tif> """ + str(output_file) + """

STEP 3: Verify
--------------
Check that the file exists and has correct CRS:

    gdalinfo """ + str(output_file) + """ | head -20

Expected output should show EPSG:3857.

================================================================================
Target bbox (WGS84): """ + f"{min_lon}, {min_lat}, {max_lon}, {max_lat}" + """
Target file:         """ + str(output_file) + """
================================================================================
""")


def main():
    parser = argparse.ArgumentParser(
        description='Download Copernicus DEM for Stockholm presets',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python download_copernicus_dem.py --preset stockholm_wide
  python download_copernicus_dem.py --bbox 17.75,59.28,18.25,59.40 --output dem.tif

Environment variables:
  COPERNICUS_USERNAME  Your Copernicus Data Space username
  COPERNICUS_PASSWORD  Your Copernicus Data Space password
"""
    )

    parser.add_argument('--preset', help='Bbox preset name (e.g., stockholm_wide)')
    parser.add_argument('--bbox', help='Custom bbox as min_lon,min_lat,max_lon,max_lat')
    parser.add_argument('--output', help='Output file path (default: /data/dem/manual/{preset}_eudem.tif)')
    parser.add_argument('--username', help='Copernicus username (or set COPERNICUS_USERNAME)')
    parser.add_argument('--password', help='Copernicus password (or set COPERNICUS_PASSWORD)')
    parser.add_argument('--manual-only', action='store_true', help='Skip automated download, show manual instructions only')

    args = parser.parse_args()

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

    print(f"Target bbox: {bbox}")
    print(f"Output file: {output_file}")
    print()

    # Check if file already exists
    if output_file.exists():
        print(f"DEM file already exists: {output_file}")
        print("Use --force to re-download, or delete the file manually.")
        sys.exit(0)

    # Try automated download
    if not args.manual_only:
        success = download_copernicus_dem(
            bbox=bbox,
            output_file=output_file,
            username=args.username,
            password=args.password
        )

        if success:
            print("\n" + "="*60)
            print("SUCCESS: DEM downloaded and processed!")
            print("="*60)
            print(f"\nFile saved to: {output_file}")
            print("\nNext step: Run build script to generate terrain tiles:")
            print(f"  .\\scripts\\build_stockholm_wide.ps1 -SkipOsm")
            sys.exit(0)

    # Show manual instructions
    print_manual_instructions(bbox, output_file, preset_name)
    sys.exit(1)


if __name__ == '__main__':
    main()
