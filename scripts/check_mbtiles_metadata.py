#!/usr/bin/env python3
"""Check MBTiles metadata."""
import sqlite3
import sys
import json

def check_mbtiles(filepath):
    conn = sqlite3.connect(filepath)
    c = conn.cursor()

    # Get metadata
    c.execute('SELECT name, value FROM metadata')
    metadata = dict(c.fetchall())

    # Get tile stats
    c.execute('SELECT COUNT(*) FROM tiles')
    tile_count = c.fetchone()[0]

    c.execute('SELECT MIN(zoom_level), MAX(zoom_level) FROM tiles')
    minz, maxz = c.fetchone()

    c.execute('SELECT COUNT(DISTINCT zoom_level) FROM tiles')
    zoom_levels = c.fetchone()[0]

    # Get zoom distribution
    c.execute('SELECT zoom_level, COUNT(*) FROM tiles GROUP BY zoom_level ORDER BY zoom_level')
    zoom_dist = dict(c.fetchall())

    conn.close()

    result = {
        'metadata': metadata,
        'tile_count': tile_count,
        'zoom_range': {'min': minz, 'max': maxz},
        'zoom_levels': zoom_levels,
        'zoom_distribution': zoom_dist
    }

    return result

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python check_mbtiles_metadata.py <mbtiles_file>")
        sys.exit(1)

    filepath = sys.argv[1]
    result = check_mbtiles(filepath)
    print(json.dumps(result, indent=2))



