"""DEM provider interface and EU-DEM implementation."""
import hashlib
import json
import os
import subprocess
import sys
import tempfile
import zipfile
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional, Tuple
import urllib.request
import urllib.error
import urllib.parse

DATA_DIR = os.getenv('DATA_DIR', '/data')
DEM_DIR = Path(DATA_DIR) / 'dem'
DEM_DIR.mkdir(parents=True, exist_ok=True)

class DEMProvider(ABC):
    """Abstract base class for DEM providers."""

    @abstractmethod
    def download(self, bbox_wgs84: tuple, cache_key: str) -> str:
        """Download DEM and return path to GeoTIFF in EPSG:3857.

        Args:
            bbox_wgs84: (min_lon, min_lat, max_lon, max_lat) in WGS84
            cache_key: Cache key for file naming
        """
        pass

    @abstractmethod
    def get_checksum(self, filepath: str) -> str:
        """Return SHA256 checksum for validation."""
        pass

class LocalFileProvider(DEMProvider):
    """Local file provider - reads manually downloaded DEM files."""

    def __init__(self, base_dir: Path = None):
        self.base_dir = base_dir or DEM_DIR / 'manual'

    def download(self, bbox_wgs84: tuple, cache_key: str) -> str:
        """Load DEM from local file (assumes already in EPSG:3857)."""
        output_file = self.base_dir / f"{cache_key}.tif"

        if not output_file.exists():
            raise FileNotFoundError(
                f"DEM file not found: {output_file}\n"
                f"Please download EU-DEM manually and place it at this location.\n"
                f"File must be reprojected to EPSG:3857 (Web Mercator).\n"
                f"See README.md for manual download instructions."
            )

        print(f"Using local DEM file: {output_file}")
        return str(output_file)

    def get_checksum(self, filepath: str) -> str:
        """Calculate SHA256 checksum."""
        sha256_hash = hashlib.sha256()
        with open(filepath, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()


class EUDEMProvider(DEMProvider):
    """EU-DEM v1.1 provider.

    Note: EU-DEM v1.1 is available via Copernicus services. For local dev,
    use LocalFileProvider instead (manual download workflow).
    """

    def download(self, bbox_wgs84: tuple, cache_key: str) -> str:
        """Download and reproject EU-DEM to EPSG:3857."""
        output_file = DEM_DIR / f"{cache_key}.tif"
        checksum_file = DEM_DIR / f"{cache_key}.md5"
        temp_file = DEM_DIR / f"{cache_key}_temp.tif"

        # If cached and checksum matches, skip download
        if output_file.exists() and checksum_file.exists():
            with open(checksum_file) as f:
                stored_checksum = f.read().strip()
            current_checksum = self.get_checksum(str(output_file))
            if stored_checksum == current_checksum:
                print(f"Using cached DEM: {output_file}")
                return str(output_file)

        print(f"Downloading EU-DEM for bbox {bbox_wgs84}...")
        print("NOTE: EU-DEM download requires access to Copernicus services.")
        print("For local dev, you can:")
        print("1. Download EU-DEM tiles manually from https://land.copernicus.eu/imagery-in-situ/eu-dem")
        print("2. Place them in a known location and modify this function")
        print("3. Or use a pre-downloaded DEM file")

        # For now, we'll create a placeholder that explains the requirements
        # In production, this would:
        # 1. Determine which EU-DEM tiles cover the bbox (EU-DEM uses EPSG:3035)
        # 2. Download tiles from Copernicus (requires authentication)
        # 3. Mosaic tiles if multiple tiles needed
        # 4. Reproject to EPSG:3857 using gdalwarp
        # 5. Clip to exact bbox

        min_lon, min_lat, max_lon, max_lat = bbox_wgs84

        # Convert WGS84 bbox to EPSG:3857 for reprojection target
        # Using gdaltransform to convert corners
        try:
            # Convert bbox corners to EPSG:3857
            result = subprocess.run([
                'gdaltransform', '-s_srs', 'EPSG:4326', '-t_srs', 'EPSG:3857',
                '-output_xy'
            ], input=f"{min_lon} {min_lat}\n{max_lon} {max_lat}\n",
               capture_output=True, text=True, check=True)

            coords = result.stdout.strip().split('\n')
            min_x, min_y = map(float, coords[0].split())
            max_x, max_y = map(float, coords[1].split())
            bbox_3857 = (min_x, min_y, max_x, max_y)

        except subprocess.CalledProcessError as e:
            print(f"ERROR: Failed to transform bbox: {e}", file=sys.stderr)
            raise

        # For local dev: Check if a pre-downloaded EU-DEM file exists
        # In production, implement actual download from Copernicus
        print("ERROR: EU-DEM download not fully implemented for automated use.")
        print("Please download EU-DEM manually or implement Copernicus API access.")
        print(f"Required bbox (EPSG:3857): {bbox_3857}")
        raise NotImplementedError(
            "EU-DEM download requires Copernicus service access. "
            "For local dev, download EU-DEM tiles manually and place in /data/dem/"
        )

    def get_checksum(self, filepath: str) -> str:
        """Calculate SHA256 checksum."""
        sha256_hash = hashlib.sha256()
        with open(filepath, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    def reproject_to_3857(self, input_file: Path, output_file: Path, bbox_3857: tuple) -> None:
        """Reproject DEM from native CRS (EPSG:3035) to EPSG:3857."""
        min_x, min_y, max_x, max_y = bbox_3857

        subprocess.run([
            'gdalwarp',
            '-t_srs', 'EPSG:3857',
            '-r', 'bilinear',
            '-te', str(min_x), str(min_y), str(max_x), str(max_y),
            '-tr', '25', '25',  # ~25m resolution
            '-co', 'COMPRESS=LZW',
            '-co', 'TILED=YES',
            str(input_file),
            str(output_file)
        ], check=True)


class GLO30Provider(DEMProvider):
    """Copernicus DEM GLO-30 provider (30m resolution, global coverage).
    
    Downloads GLO-30 from Copernicus Data Space Ecosystem (CDSE) API.
    Requires COPERNICUS_USERNAME and COPERNICUS_PASSWORD environment variables.
    """
    
    # CDSE API endpoints
    CDSE_TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
    CDSE_ODATA_URL = "https://catalogue.dataspace.copernicus.eu/odata/v1"
    CDSE_DOWNLOAD_URL = "https://zipper.dataspace.copernicus.eu/odata/v1"
    COP_DEM_COLLECTION = "COP-DEM_GLO-30-DGED__2022_1"
    
    def __init__(self):
        self.username = os.getenv('COPERNICUS_USERNAME')
        self.password = os.getenv('COPERNICUS_PASSWORD')
        if not self.username or not self.password:
            raise ValueError(
                "COPERNICUS_USERNAME and COPERNICUS_PASSWORD environment variables required for GLO-30 download"
            )
    
    def get_cdse_token(self) -> str:
        """Get OAuth2 access token from CDSE."""
        print("Authenticating with Copernicus Data Space...")
        
        data = urllib.parse.urlencode({
            'username': self.username,
            'password': self.password,
            'grant_type': 'password',
            'client_id': 'cdse-public'
        }).encode('utf-8')
        
        req = urllib.request.Request(self.CDSE_TOKEN_URL, data=data, method='POST')
        req.add_header('Content-Type', 'application/x-www-form-urlencoded')
        
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                result = json.loads(response.read().decode('utf-8'))
                return result['access_token']
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8') if e.fp else ''
            raise RuntimeError(f"Authentication failed: {e.code} {e.reason}\n{error_body}")
    
    def find_dem_tiles(self, bbox: Tuple[float, float, float, float], token: str) -> list:
        """Find Copernicus DEM tiles covering the bbox."""
        min_lon, min_lat, max_lon, max_lat = bbox
        wkt = f"POLYGON(({min_lon} {min_lat},{max_lon} {min_lat},{max_lon} {max_lat},{min_lon} {max_lat},{min_lon} {min_lat}))"
        
        filter_query = f"Collection/Name eq '{self.COP_DEM_COLLECTION}' and OData.CSC.Intersects(area=geography'SRID=4326;{wkt}')"
        query_params = urllib.parse.urlencode({
            '$filter': filter_query,
            '$top': 100,
            '$orderby': 'ContentDate/Start desc'
        })
        
        url = f"{self.CDSE_ODATA_URL}/Products?{query_params}"
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
    
    def download_product(self, product_id: str, product_name: str, token: str, output_dir: Path) -> Path:
        """Download a single DEM product."""
        url = f"{self.CDSE_DOWNLOAD_URL}/Products({product_id})/$value"
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
    
    def extract_dem_tif(self, zip_file: Path, output_dir: Path) -> Path:
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
    
    def merge_and_process_dems(self, dem_files: list, bbox: Tuple[float, float, float, float], output_file: Path) -> None:
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
            
            # Convert bbox to EPSG:3857
            result = subprocess.run([
                'gdaltransform', '-s_srs', 'EPSG:4326', '-t_srs', 'EPSG:3857', '-output_xy'
            ], input=f"{min_lon} {min_lat}\n{max_lon} {max_lat}\n",
               capture_output=True, text=True, check=True)
            
            coords = result.stdout.strip().split('\n')
            min_x, min_y = map(float, coords[0].split())
            max_x, max_y = map(float, coords[1].split())
            
            # Add buffer to ensure full coverage
            buffer = 500  # 500m buffer
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
                '-tr', '30', '30',  # 30m resolution
                '-co', 'COMPRESS=LZW',
                '-co', 'TILED=YES',
                '-co', 'BIGTIFF=IF_SAFER',
                str(merged_file),
                str(output_file)
            ]
            
            subprocess.run(cmd, check=True)
            print(f"Output saved: {output_file}")
    
    def download(self, bbox_wgs84: tuple, cache_key: str) -> str:
        """Download and process GLO-30 DEM to EPSG:3857."""
        output_file = DEM_DIR / 'manual' / f"{cache_key}.tif"
        
        # Check cache
        checksum_file = DEM_DIR / 'manual' / f"{cache_key}.sha256"
        if output_file.exists() and checksum_file.exists():
            with open(checksum_file) as f:
                stored_checksum = f.read().strip()
            current_checksum = self.get_checksum(str(output_file))
            if stored_checksum == current_checksum:
                print(f"Using cached DEM: {output_file}")
                return str(output_file)
        
        print(f"Downloading GLO-30 DEM for bbox {bbox_wgs84}...")
        
        try:
            # Authenticate
            token = self.get_cdse_token()
            print("Authentication successful!")
            
            # Find tiles
            products = self.find_dem_tiles(bbox_wgs84, token)
            
            if not products:
                raise RuntimeError("No DEM tiles found for this bbox")
            
            # Create download directory
            download_dir = DEM_DIR / 'downloads'
            download_dir.mkdir(parents=True, exist_ok=True)
            
            # Download and extract each tile
            dem_files = []
            for product in products:
                product_id = product['Id']
                product_name = product['Name']
                print(f"Processing tile: {product_name}")
                
                zip_file = self.download_product(product_id, product_name, token, download_dir)
                tif_file = self.extract_dem_tif(zip_file, download_dir)
                dem_files.append(tif_file)
            
            # Merge and process
            self.merge_and_process_dems(dem_files, bbox_wgs84, output_file)
            
            return str(output_file)
            
        except Exception as e:
            print(f"ERROR: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc()
            raise
    
    def get_checksum(self, filepath: str) -> str:
        """Calculate SHA256 checksum."""
        sha256_hash = hashlib.sha256()
        with open(filepath, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

