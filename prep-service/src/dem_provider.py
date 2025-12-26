"""DEM provider interface and EU-DEM implementation."""
import hashlib
import os
import subprocess
import sys
from abc import ABC, abstractmethod
from pathlib import Path

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

