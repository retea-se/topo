#!/usr/bin/env node
/**
 * Tile Health Check Script
 * Tests tile availability for stockholm_wide coverage
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Stockholm Wide bbox: [17.75, 59.28, 18.25, 59.40]
const BBOX = {
  minLon: 17.75,
  minLat: 59.28,
  maxLon: 18.25,
  maxLat: 59.40
};

// Convert lon/lat to tile coordinates
function lonLatToTile(lon, lat, zoom) {
  const x = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  return { x, y, z: zoom };
}

// Test locations within stockholm_wide
const TEST_LOCATIONS = [
  { name: 'center', lon: 18.00, lat: 59.34 },
  { name: 'alvsjo_south', lon: 18.00, lat: 59.28 },
  { name: 'bromma_west', lon: 17.94, lat: 59.35 },
  { name: 'nacka_east', lon: 18.16, lat: 59.31 }
];

const ZOOM_LEVELS = [10, 12, 14];

// Tile sources to test
const TILE_SOURCES = [
  { name: 'osm', url: 'http://localhost:8080/osm/{z}/{x}/{y}', type: 'vector', tms: false },
  { name: 'contours_wide_2m', url: 'http://localhost:8080/contours_wide_2m/{z}/{x}/{y}', type: 'vector', tms: false },
  { name: 'contours_wide_10m', url: 'http://localhost:8080/contours_wide_10m/{z}/{x}/{y}', type: 'vector', tms: false },
  { name: 'contours_wide_50m', url: 'http://localhost:8080/contours_wide_50m/{z}/{x}/{y}', type: 'vector', tms: false },
  { name: 'hillshade', url: 'http://localhost:8081/tiles/hillshade/stockholm_wide/{z}/{x}/{y}.png', type: 'raster', tms: true }
];

// HTTP GET with promise
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      resolve({ status: res.statusCode, url });
    });
    req.on('error', (err) => {
      resolve({ status: 'error', url, error: err.message });
    });
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ status: 'timeout', url });
    });
  });
}

async function runHealthCheck() {
  const results = {
    timestamp: new Date().toISOString(),
    bbox: BBOX,
    test_locations: TEST_LOCATIONS,
    zoom_levels: ZOOM_LEVELS,
    sources: {},
    summary: { total: 0, success: 0, failed: 0 }
  };

  console.log('Tile Health Check for stockholm_wide');
  console.log('=====================================\n');

  for (const source of TILE_SOURCES) {
    console.log(`Testing ${source.name}...`);
    results.sources[source.name] = { tiles: [], success: 0, failed: 0 };

    for (const zoom of ZOOM_LEVELS) {
      for (const loc of TEST_LOCATIONS) {
        const tile = lonLatToTile(loc.lon, loc.lat, zoom);
        // TMS format inverts Y coordinate
        const tileY = source.tms ? (Math.pow(2, zoom) - 1 - tile.y) : tile.y;
        const url = source.url
          .replace('{z}', tile.z)
          .replace('{x}', tile.x)
          .replace('{y}', tileY);

        const result = await httpGet(url);
        const isSuccess = result.status === 200 || result.status === 204;

        results.sources[source.name].tiles.push({
          location: loc.name,
          zoom: zoom,
          tile: `${tile.z}/${tile.x}/${tileY}`,
          status: result.status,
          success: isSuccess
        });

        results.summary.total++;
        if (isSuccess) {
          results.sources[source.name].success++;
          results.summary.success++;
          process.stdout.write('.');
        } else {
          results.sources[source.name].failed++;
          results.summary.failed++;
          process.stdout.write('X');
        }
      }
    }
    console.log(` ${results.sources[source.name].success}/${results.sources[source.name].success + results.sources[source.name].failed}`);
  }

  console.log('\n=====================================');
  console.log(`Total: ${results.summary.success}/${results.summary.total} tiles OK`);
  console.log(`Failed: ${results.summary.failed}`);

  // Write results to JSON
  const outputDir = process.argv[2] || 'exports/screenshots';
  const outputPath = path.join(outputDir, 'tile_health.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${outputPath}`);

  // Exit with error code if any failures
  process.exit(results.summary.failed > 0 ? 1 : 0);
}

runHealthCheck().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
