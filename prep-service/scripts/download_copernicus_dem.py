#!/usr/bin/env python3
"""
Download Copernicus DEM for Stockholm presets.

This script downloads Copernicus DEM 30m (GLO-30) data from the
Copernicus Data Space Ecosystem (CDSE) API.

Usage:
    python download_copernicus_dem.py --preset stockholm_wide
    python download_copernicus_dem.py --bbox 17.75,59.28,18.25,59.40

Environment variables:
    COPERNICUS_USERNAME: Your CDSE username
    COPERNICUS_PASSWORD: Your CDSE password

Output:
    /data/dem/manual/{preset}_eudem.tif (EPSG:3857, clipped to bbox)

Attribution:
    Copernicus DEM - GLO-30 Public
    (c) DLR e.V. 2014-2018 and Airbus Defence and Space GmbH 2017-2018
    provided under COPERNICUS by the European Union and ESA
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path
from typing import Optional, Tuple
import urllib.request
import urllib.error
import urllib.parse

DATA_DIR = os.getenv('DATA_DIR', '/data')
CONFIG_DIR = Path('/app/config')

CDSE_TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
CDSE_ODATA_URL = "https://catalogue.dataspace.copernicus.eu/odata/v1"
CDSE_DOWNLOAD_URL = "https://zipper.dataspace.copernicus.eu/odata/v1"
COP_DEM_COLLECTION = "COP-DEM_GLO-30-DGED__2022_1"


def load_presets() -> dict:
    """Load bbox presets from config."""
    with open(CONFIG_DIR / 'bbox_presets.json') as f:
        return json.load(f)


def get_bbox_wgs84(preset_name: str) -> Tuple[float, float, float, float]:
    """Get WGS84 bbox for preset."""
    presets = load_presets()
    for preset in presets['presets']:
        if preset['name'] == preset_name:
            return tuple(preset['bbox_wgs84'])
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
    wkt = f"POLYGON(({min_lon} {min_lat},{max_lon} {min_lat},{max_lon} {max_lat},{min_lon} {max_lat},{min_lon} {min_lat}))"

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
            print()
        return output_file
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8') if e.fp else ''
        raise RuntimeError(f"Download failed: {e.code} {e.reason}\n{error_body}")


def extract_dem_tif(zip_file: Path, output_dir: Path) -> Path:
    """Extract DEM GeoTIFF from downloaded archive."""
    with zipfile.ZipFile(zip_file, 'r') as zf:
        dem_files = [n for n in zf.namelist() if n.endswith('_DEM.tif') or n.endswith('_dem.tif')]
        if not dem_files:
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
    """Merge DEM tiles, clip to bbox, and reproject to EPSG:3857."""
    min_lon, min_lat, max_lon, max_lat = bbox

    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir = Path(tmpdir)

        if len(dem_files) == 1:
            merged_file = dem_files[0]
        else:
            print("Merging DEM tiles...")
            merged_file = tmpdir / 'merged.tif'
            cmd = ['gdal_merge.py', '-o', str(merged_file)] + [str(f) for f in dem_files]
            subprocess.run(cmd, check=True)

        print("Reprojecting to EPSG:3857 and clipping to bbox...")

        result = subprocess.run([
            'gdaltransform', '-s_srs', 'EPSG:4326', '-t_srs', 'EPSG:3857', '-output_xy'
        ], input=f"{min_lon} {min_lat}\n{max_lon} {max_lat}\n",
           capture_output=True, text=True, check=True)

        coords = result.stdout.strip().split('\n')
        min_x, min_y = map(float, coords[0].split())
        max_x, max_y = map(float, coords[1].split())

        # Add buffer
        buffer = 500
        min_x -= buffer
        min_y -= buffer
        max_x += buffer
        max_y += buffer

        output_file.parent.mkdir(parents=True, exist_ok=True)

        cmd = [
            'gdalwarp',
            '-t_srs', 'EPSG:3857',
            '-te', str(min_x), str(min_y), str(max_x), str(max_y),
            '-r', 'bilinear',
            '-tr', '30', '30',
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
    """Download and process Copernicus DEM for the given bbox."""
    username = username or os.getenv('COPERNICUS_USERNAME')
    password = password or os.getenv('COPERNICUS_PASSWORD')

    if not username or not password:
        print("\nCopernicus credentials not found.")
        print("Set COPERNICUS_USERNAME and COPERNICUS_PASSWORD environment variables.")
        return False

    try:
        token = get_cdse_token(username, password)
        print("Authentication successful!")

        products = find_dem_tiles(bbox, token)
        if not products:
            print("No DEM tiles found for this bbox.")
            return False

        download_dir = Path(DATA_DIR) / 'dem' / 'downloads'
        download_dir.mkdir(parents=True, exist_ok=True)

        dem_files = []
        for product in products:
            product_id = product['Id']
            product_name = product['Name']
            zip_file = download_product(product_id, product_name, token, download_dir)
            tif_file = extract_dem_tif(zip_file, download_dir)
            dem_files.append(tif_file)

        merge_and_process_dems(dem_files, bbox, output_file)
        return True

    except Exception as e:
        print(f"\nError during automated download: {e}")
        return False


def print_manual_instructions(bbox: Tuple[float, float, float, float], output_file: Path, preset_name: str) -> None:
    """Print instructions for manual EU-DEM download."""
    min_lon, min_lat, max_lon, max_lat = bbox

    print(f"""
================================================================================
                    MANUAL EU-DEM DOWNLOAD REQUIRED
================================================================================

STEP 1: Download EU-DEM Tile
----------------------------
1. Visit: https://land.copernicus.eu/imagery-in-situ/eu-dem/eu-dem-v1.1
2. Register/login if needed (free account)
3. Download tile covering Stockholm (E40N40)

STEP 2: Process the downloaded file
-----------------------------------
    python /app/scripts/process_eudem.py --input <file.tif> --preset {preset_name}

================================================================================
Target bbox (WGS84): {min_lon}, {min_lat}, {max_lon}, {max_lat}
Target file:         {output_file}
================================================================================
""")


def main():
    parser = argparse.ArgumentParser(description='Download Copernicus DEM')
    parser.add_argument('--preset', help='Bbox preset name')
    parser.add_argument('--bbox', help='Custom bbox as min_lon,min_lat,max_lon,max_lat')
    parser.add_argument('--output', help='Output file path')
    parser.add_argument('--username', help='Copernicus username')
    parser.add_argument('--password', help='Copernicus password')
    parser.add_argument('--manual-only', action='store_true', help='Show manual instructions only')

    args = parser.parse_args()

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

    print(f"Target bbox: {bbox}")
    print(f"Output file: {output_file}")

    if output_file.exists():
        print(f"DEM file already exists: {output_file}")
        sys.exit(0)

    if not args.manual_only:
        success = download_copernicus_dem(
            bbox=bbox,
            output_file=output_file,
            username=args.username,
            password=args.password
        )
        if success:
            print("\nSUCCESS: DEM downloaded and processed!")
            sys.exit(0)

    print_manual_instructions(bbox, output_file, preset_name)
    sys.exit(1)


if __name__ == '__main__':
    main()
