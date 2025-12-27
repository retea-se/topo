# Topo - Project Overview

## Purpose
Cartographic product for generating high-quality, print-ready topographic maps with deterministic outputs.

## Architecture
Two parallel pipelines with shared data:

### Demo A - Interactive / Exploratory
- **Stack**: MapLibre + Vector Tiles + Playwright
- **Purpose**: Theme iteration, visual exploration, perspective/pitch experiments
- **Ports**: 3000 (Web), 8080 (Tileserver), 8081 (Hillshade), 8082 (Exporter)

### Demo B - Print Authority (Reference Implementation)
- **Stack**: PostGIS + Mapnik + Flask
- **Purpose**: Final exports, deterministic rendering, production outputs
- **Ports**: 3001 (Web), 5000 (API), 5001 (Renderer), 5432 (DB)
- Same inputs MUST produce identical bytes

## Key Directories
- `/demo-a/` - MapLibre-based interactive demo (Node.js)
- `/demo-b/` - Mapnik-based deterministic demo (Python)
- `/prep-service/` - Data preparation scripts (Python)
- `/themes/` - Shared theme definitions (JSON)
- `/config/` - Presets and configuration
- `/docs/` - Documentation
- `/scripts/` - Utility scripts
- `/exports/` - Generated map exports

## Data Presets
- `stockholm_core` - Central Stockholm
- `stockholm_wide` - Greater Stockholm with suburbs
- `svealand` - Svealand region (large area)

## Available Themes (10)
paper, ink, mono, dark, gallery, charcoal, warm-paper, blueprint-muted, muted-pastel, void

## Rendering Constraints
- EPSG:3857 everywhere
- No contour labels
- Print mode defaults to label-free
- Scale only valid when pitch = 0
- Attribution must always be present in print outputs
