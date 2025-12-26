# Build Guide - Tile Pipeline

## Overview

This guide describes the tile generation pipeline, including estimated build times, disk requirements, and troubleshooting.

## Presets

| Preset | Area | Complexity | Build Time | Disk Space |
|--------|------|------------|------------|------------|
| stockholm_core | 0.18 x 0.03 deg | Low | ~15 min | ~0.5 GB |
| stockholm_wide | 0.50 x 0.12 deg | Medium | ~40 min | ~2.5 GB |
| svealand | 4.5 x 2.5 deg | High | ~3 hours | ~15 GB |

## Build Scripts

### Quick Start

```powershell
# Windows (PowerShell)
.\scripts\build_stockholm_wide.ps1

# With options
.\scripts\build_stockholm_wide.ps1 -Force        # Force regenerate all
.\scripts\build_stockholm_wide.ps1 -SkipOsm      # Only terrain
.\scripts\build_stockholm_wide.ps1 -SkipTerrain  # Only OSM
.\scripts\build_stockholm_wide.ps1 -DryRun       # Preview only
.\scripts\build_stockholm_wide.ps1 -NoPreflight  # Skip system checks
```

```bash
# Linux/Mac (Bash)
./scripts/build_stockholm_wide.sh

# With options
./scripts/build_stockholm_wide.sh --force
./scripts/build_stockholm_wide.sh --skip-osm
./scripts/build_stockholm_wide.sh --skip-terrain
./scripts/build_stockholm_wide.sh --dry-run
```

### Available Build Scripts

| Script | Preset | Description |
|--------|--------|-------------|
| build_stockholm_wide.ps1/sh | stockholm_wide | Greater Stockholm area |
| build_svealand.ps1/sh | svealand | Full Svealand region |
| build_full_coverage.ps1/sh | all | Builds all presets |

## Build Steps

Each build consists of the following steps:

1. **Preflight Checks** (~1 min)
   - Docker status
   - Disk space
   - Memory availability
   - Docker volumes

2. **OSM Data** (~5-20 min depending on preset)
   - Download Sweden OSM (if not cached)
   - Clip to preset bbox
   - Generate OSM vector tiles

3. **Terrain Data** (~10-120 min depending on preset)
   - Check for DEM data
   - Generate hillshade raster
   - Generate hillshade XYZ tiles
   - Extract contour lines (2m, 10m, 50m)
   - Generate contour vector tiles

4. **Verification** (~1 min)
   - Check all output files exist
   - Report status

## Detailed Build Times

### stockholm_core

| Step | Time | Output |
|------|------|--------|
| OSM clip | ~1 min | 3.5 MB |
| OSM tiles | ~2 min | 4 MB mbtiles |
| Hillshade | ~1 min | 2.1 MB GeoTIFF |
| Hillshade tiles | ~2 min | z10-16 PNG tiles |
| Contours | ~3 min | 3 GeoJSON files |
| Contour tiles | ~5 min | 3 mbtiles |
| **Total** | **~15 min** | **~0.5 GB** |

### stockholm_wide

| Step | Time | Output |
|------|------|--------|
| OSM clip | ~3 min | 17 MB |
| OSM tiles | ~5 min | 21 MB mbtiles |
| Hillshade | ~3 min | 9.5 MB GeoTIFF |
| Hillshade tiles | ~8 min | z10-16 PNG tiles |
| Contours | ~8 min | 3 GeoJSON files |
| Contour tiles | ~15 min | 37 MB total mbtiles |
| **Total** | **~40 min** | **~2.5 GB** |

### svealand

| Step | Time | Output |
|------|------|--------|
| OSM clip | ~10 min | ~150 MB |
| OSM tiles | ~20 min | ~180 MB mbtiles |
| Hillshade | ~15 min | ~500 MB GeoTIFF |
| Hillshade tiles | ~45 min | z9-14 PNG tiles (limited) |
| Contours | ~45 min | 3 GeoJSON files |
| Contour tiles | ~60 min | ~200 MB total mbtiles |
| **Total** | **~3 hours** | **~15 GB** |

**Note**: Svealand uses limited zoom levels (z9-14 for hillshade, z8-13 for contours) to manage file sizes.

## System Requirements

### Minimum

| Resource | Requirement |
|----------|-------------|
| Disk Space | 5 GB free (for stockholm_wide) |
| RAM | 4 GB available |
| Docker | Running with at least 4 GB allocated |
| CPU | Any modern multi-core |

### Recommended (for svealand)

| Resource | Requirement |
|----------|-------------|
| Disk Space | 30 GB free |
| RAM | 8 GB available |
| Docker | 8 GB allocated |
| CPU | 4+ cores |

## Preflight Checks

The build scripts perform automatic preflight checks:

1. **Docker** - Verifies Docker daemon is running
2. **Disk Space** - Checks for sufficient free space
3. **Memory** - Warns if memory is low
4. **Volumes** - Checks for existing Docker volumes

To skip preflight checks:

```powershell
.\scripts\build_stockholm_wide.ps1 -NoPreflight
```

## Incremental Builds

Scripts automatically skip steps if output files already exist:

```
[SKIP] OSM clip already exists. Use -Force to regenerate.
[SKIP] Hillshade already exists. Use -Force to regenerate.
```

To force regeneration:

```powershell
.\scripts\build_stockholm_wide.ps1 -Force
```

## Resume After Failure

If a build fails mid-way:

1. Check the error message
2. Fix the issue (e.g., free disk space)
3. Run the script again - it will skip completed steps

## Build Logs

When using build utilities, logs are saved to:

```
logs/build_{preset}_{timestamp}.log
```

Example:
```
logs/build_stockholm_wide_20251227_143000.log
```

## Troubleshooting

### "Docker is not running"

Start Docker Desktop and wait for it to be ready.

### "Disk space: INSUFFICIENT"

Free up disk space. Each preset needs:
- stockholm_core: 0.5 GB
- stockholm_wide: 2.5 GB
- svealand: 15 GB

### "DEM data not found"

DEM data must be downloaded separately. See [DEM_MANUAL_DOWNLOAD.md](../DEM_MANUAL_DOWNLOAD.md).

### Build is very slow

- Check Docker resource allocation (increase CPU/RAM)
- Use SSD for Docker volumes
- For svealand, expect ~3 hours on a typical system

### "Failed to generate tiles"

Check:
1. Docker has enough memory
2. Source files exist
3. Output directory is writable

## Build Utilities

The scripts use shared utilities in `scripts/lib/`:

- `build_utils.ps1` - PowerShell utilities
- `build_utils.sh` - Bash utilities

These provide:
- Preflight checks
- Progress logging with timestamps
- Build timing and summaries
- Log file generation

## See Also

- [USAGE.md](USAGE.md) - General usage guide
- [PRESET_LIMITS.md](PRESET_LIMITS.md) - Export limits per preset
- [DEM_MANUAL_DOWNLOAD.md](../DEM_MANUAL_DOWNLOAD.md) - DEM data download
