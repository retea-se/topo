#!/usr/bin/env python3
"""Download OSM data from Geofabrik Sweden extract."""
import os
import subprocess
import sys
from pathlib import Path

DATA_DIR = os.getenv('DATA_DIR', '/data')
OSM_DIR = Path(DATA_DIR) / 'osm'
OSM_DIR.mkdir(parents=True, exist_ok=True)

GEOFABRIK_URL = "https://download.geofabrik.de/europe/sweden-latest.osm.pbf"
CHECKSUM_URL = f"{GEOFABRIK_URL}.md5"
OSM_FILE = OSM_DIR / "sweden-latest.osm.pbf"
CHECKSUM_FILE = OSM_DIR / "sweden-latest.osm.pbf.md5"

def main():
    print(f"Downloading OSM data from {GEOFABRIK_URL}")

    # Download with resume support
    subprocess.run(['wget', '-c', GEOFABRIK_URL, '-O', str(OSM_FILE)], check=True)

    # Download and verify checksum
    subprocess.run(['wget', CHECKSUM_URL, '-O', str(CHECKSUM_FILE)], check=True)
    result = subprocess.run(['md5sum', '-c', str(CHECKSUM_FILE)], capture_output=True, text=True)

    if result.returncode != 0:
        print("ERROR: Checksum verification failed!", file=sys.stderr)
        sys.exit(1)

    print(f"OSM data downloaded and verified: {OSM_FILE}")

if __name__ == '__main__':
    main()



