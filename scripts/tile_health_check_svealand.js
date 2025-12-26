#!/usr/bin/env node
/**
 * Tile Health Check Script for Svealand - Improved Version
 * Tests tile availability with proper bounds and zoom level detection
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Convert lon/lat to tile coordinates (XYZ format)
function lonLatToTile(lon, lat, zoom) {
  const x = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  return { x, y, z: zoom };
}

// Generate test points within bounds
function generateTestPoints(bounds, count = 20) {
  const [minLon, minLat, maxLon, maxLat] = bounds;
  const points = [];
  
  // Generate grid of points
  const rows = Math.ceil(Math.sqrt(count));
  const cols = Math.ceil(count / rows);
  
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols && points.length < count; j++) {
      const lon = minLon + (maxLon - minLon) * (j / (cols - 1 || 1));
      const lat = minLat + (maxLat - minLat) * (i / (rows - 1 || 1));
      points.push({ name: `grid_${i}_${j}`, lon, lat });
    }
  }
  
  return points;
}

// Fetch TileJSON to get bounds and zoom levels
async function fetchTileJSON(sourceUrl) {
  return new Promise((resolve, reject) => {
    const client = sourceUrl.startsWith('https') ? https : http;
    const req = client.get(sourceUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse TileJSON: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout fetching TileJSON'));
    });
  });
}

// HTTP GET with promise - returns status and content length
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      let data = Buffer.alloc(0);
      res.on('data', chunk => {
        data = Buffer.concat([data, chunk]);
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          url,
          size: data.length,
          contentType: res.headers['content-type']
        });
      });
    });
    req.on('error', (err) => {
      resolve({ status: 'error', url, error: err.message, size: 0 });
    });
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ status: 'timeout', url, size: 0 });
    });
  });
}

async function runHealthCheck() {
  const outputDir = process.argv[2] || 'exports/screenshots';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const outputPath = path.join(outputDir, `tile_health_svealand_${timestamp}.json`);
  
  const results = {
    timestamp: new Date().toISOString(),
    preset: 'svealand',
    sources: {},
    summary: { total: 0, success: 0, failed: 0, inconclusive: 0 },
    verdict: 'UNKNOWN'
  };

  console.log('Tile Health Check for svealand (Improved)');
  console.log('==========================================\n');

  // OSM source - fetch TileJSON first
  const osmSource = {
    name: 'osm_svealand',
    tilejsonUrl: 'http://localhost:8080/osm_svealand',
    tileUrl: 'http://localhost:8080/osm_svealand/{z}/{x}/{y}',
    type: 'vector',
    tms: false
  };

  try {
    console.log(`Fetching TileJSON from ${osmSource.tilejsonUrl}...`);
    const tilejson = await fetchTileJSON(osmSource.tilejsonUrl);
    
    const bounds = tilejson.bounds || [14.5, 58.5, 19.0, 61.0];
    const minzoom = tilejson.minzoom || 0;
    const maxzoom = tilejson.maxzoom || 18;
    
    console.log(`Bounds: [${bounds.join(', ')}]`);
    console.log(`Zoom range: ${minzoom}-${maxzoom}`);
    console.log(`Format: ${tilejson.format || 'unknown'}\n`);
    
    results.metadata = {
      bounds,
      minzoom,
      maxzoom,
      format: tilejson.format,
      name: tilejson.name
    };

    // Generate test points within bounds
    const testPoints = generateTestPoints(bounds, 20);
    console.log(`Generated ${testPoints.length} test points within bounds\n`);

    // Test zoom levels: minzoom, middle, maxzoom (but cap at reasonable levels)
    const testZooms = [];
    if (minzoom <= maxzoom) {
      testZooms.push(minzoom);
      if (maxzoom > minzoom) {
        const mid = Math.floor((minzoom + maxzoom) / 2);
        if (mid !== minzoom) testZooms.push(mid);
        if (maxzoom !== mid && maxzoom <= 15) testZooms.push(maxzoom);
      }
    }
    
    // If no valid zooms, use defaults
    if (testZooms.length === 0) {
      testZooms.push(10, 12, 14);
      console.log('Warning: Using default zoom levels\n');
    }
    
    console.log(`Testing zoom levels: ${testZooms.join(', ')}\n`);

    results.sources[osmSource.name] = {
      tiles: [],
      success: 0,
      failed: 0,
      empty: 0, // tiles that return 200 but are empty/small
      outOfBounds: 0
    };

    console.log(`Testing ${osmSource.name}...`);
    
    for (const zoom of testZooms) {
      if (zoom < minzoom || zoom > maxzoom) {
        console.log(`  Skipping zoom ${zoom} (outside range ${minzoom}-${maxzoom})`);
        continue;
      }
      
      for (const point of testPoints) {
        const tile = lonLatToTile(point.lon, point.lat, zoom);
        const url = osmSource.tileUrl
          .replace('{z}', tile.z)
          .replace('{x}', tile.x)
          .replace('{y}', tile.y);

        const result = await httpGet(url);
        const isSuccess = result.status === 200 || result.status === 204;
        const isEmpty = isSuccess && result.size < 100; // Empty tiles are usually < 100 bytes

        results.sources[osmSource.name].tiles.push({
          location: point.name,
          lon: point.lon,
          lat: point.lat,
          zoom: zoom,
          tile: `${tile.z}/${tile.x}/${tile.y}`,
          status: result.status,
          size: result.size,
          success: isSuccess,
          empty: isEmpty,
          url: url
        });

        results.summary.total++;
        if (isSuccess) {
          // Empty tiles are still success (200 OK, just no data in that tile)
          results.sources[osmSource.name].success++;
          results.summary.success++;
          if (isEmpty) {
            results.sources[osmSource.name].empty++;
            process.stdout.write('o'); // empty tile (success but no data)
          } else {
            process.stdout.write('.'); // tile with data
          }
        } else {
          results.sources[osmSource.name].failed++;
          results.summary.failed++;
          process.stdout.write('X');
        }
      }
    }
    
    const sourceResults = results.sources[osmSource.name];
    console.log(`\n  Success: ${sourceResults.success}, Failed: ${sourceResults.failed}, Empty: ${sourceResults.empty}`);
    
    // Determine verdict
    // For OSM tiles: 200/204 = success (even if empty), 404/error = fail
    const successRate = results.summary.total > 0 ? results.summary.success / results.summary.total : 0;
    const failRate = results.summary.total > 0 ? results.summary.failed / results.summary.total : 0;
    
    if (failRate === 0 && successRate >= 0.8) {
      results.verdict = 'PASS'; // All requests succeed, most have data
    } else if (failRate === 0 && successRate >= 0.5) {
      results.verdict = 'PASS'; // All succeed, many empty (normal for large areas)
    } else if (failRate < 0.1) {
      results.verdict = 'PARTIAL'; // Mostly succeed
    } else if (results.summary.total === 0) {
      results.verdict = 'INCONCLUSIVE';
    } else {
      results.verdict = 'FAIL'; // Many failures
    }

  } catch (error) {
    console.error(`\nError: ${error.message}`);
    results.error = error.message;
    results.verdict = 'INCONCLUSIVE';
  }

  console.log('\n==========================================');
  console.log(`Verdict: ${results.verdict}`);
  console.log(`Total tested: ${results.summary.total}`);
  console.log(`Success: ${results.summary.success} (${(results.summary.success / results.summary.total * 100).toFixed(1)}%)`);
  console.log(`Failed: ${results.summary.failed}`);
  console.log(`Empty: ${results.sources[osmSource.name]?.empty || 0}`);

  // Write results
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${outputPath}`);

  // Exit code: 0 for PASS/PARTIAL, 1 for FAIL, 2 for INCONCLUSIVE
  const exitCode = results.verdict === 'PASS' ? 0 : results.verdict === 'FAIL' ? 1 : 2;
  process.exit(exitCode);
}

runHealthCheck().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
