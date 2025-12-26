#!/usr/bin/env node
/**
 * Tile Health Check Script for Svealand
 * Tests tile availability for svealand coverage
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Svealand bbox: [14.5, 58.5, 19.0, 61.0]
const BBOX = {
  minLon: 14.5,
  minLat: 58.5,
  maxLon: 19.0,
  maxLat: 61.0
};

// Convert lon/lat to tile coordinates
function lonLatToTile(lon, lat, zoom) {
  const x = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  return { x, y, z: zoom };
}

// Test locations within svealand (Uppsala, Västerås, Örebro, etc.)
const TEST_LOCATIONS = [
  { name: 'uppsala', lon: 17.64, lat: 59.86 },
  { name: 'vasteras', lon: 16.55, lat: 59.61 },
  { name: 'orebro', lon: 15.21, lat: 59.27 },
  { name: 'eskilstuna', lon: 16.51, lat: 59.37 },
  { name: 'nykoping', lon: 17.01, lat: 58.75 },
  { name: 'center', lon: 16.75, lat: 59.75 }
];

// Zoom levels for svealand (limited due to large area)
const ZOOM_LEVELS = [9, 11, 13];

// Tile sources to test
const TILE_SOURCES = [
  { name: 'osm_svealand', url: 'http://localhost:8080/osm_svealand/{z}/{x}/{y}', type: 'vector', tms: false },
  { name: 'contours_svealand_2m', url: 'http://localhost:8080/contours_svealand_2m/{z}/{x}/{y}', type: 'vector', tms: false },
  { name: 'contours_svealand_10m', url: 'http://localhost:8080/contours_svealand_10m/{z}/{x}/{y}', type: 'vector', tms: false },
  { name: 'contours_svealand_50m', url: 'http://localhost:8080/contours_svealand_50m/{z}/{x}/{y}', type: 'vector', tms: false },
  { name: 'hillshade', url: 'http://localhost:8081/tiles/hillshade/svealand/{z}/{x}/{y}.png', type: 'raster', tms: true }
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
    preset: 'svealand',
    bbox: BBOX,
    test_locations: TEST_LOCATIONS,
    zoom_levels: ZOOM_LEVELS,
    sources: {},
    summary: { total: 0, success: 0, failed: 0 }
  };

  console.log('Tile Health Check for svealand');
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
          success: isSuccess,
          url: url
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
  const outputPath = path.join(outputDir, 'tile_health_svealand.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${outputPath}`);

  // Exit with error code if any failures
  process.exit(results.summary.failed > 0 ? 1 : 0);
}

runHealthCheck().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

