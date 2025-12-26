# Screenshots

This directory contains diagnostic screenshots from Demo A and Demo B.

## Naming Convention

Screenshots follow this naming pattern:

- `demoA_{preset}_{mode}_{theme}_{timestamp}.png`
- `demoB_{preset}_{mode}_{theme}_{timestamp}.png`

### Presets

| Preset | Description |
|--------|-------------|
| `core` | Stockholm Core (central city only) |
| `wide` | Stockholm Wide (suburbs + city center) |

### Modes

| Mode | Description |
|------|-------------|
| `full` | All layers enabled |
| `roadsOnly` | Only roads visible |
| `noHillshade` | Hillshade disabled |
| `noContours` | Contours disabled |
| `ui` | Demo B UI screenshot |

### Themes

All 9 available themes can be captured:

- paper
- ink
- mono
- dark
- gallery
- charcoal
- warm-paper
- blueprint-muted
- muted-pastel

## Generating Screenshots

### Windows

```powershell
cd C:\Users\marcu\OneDrive\Dokument\topo
.\scripts\capture_screenshots.ps1
```

### Linux/Mac

```bash
cd /path/to/topo
./scripts/capture_screenshots.sh
```

## What to Look For

When reviewing screenshots for verification:

1. **Stockholm Wide coverage**: Roads, buildings, and water should be visible in suburbs (not just contours)
2. **Layer toggles**: Each mode should show only the expected layers
3. **Theme consistency**: Colors should match the selected theme
4. **Hillshade alignment**: Hillshade should align with terrain features
5. **Contours coverage**: All contour intervals (2m, 10m, 50m) should be visible when enabled

## Troubleshooting

If screenshots are missing expected content:

1. Ensure tiles have been generated: `docker-compose run --rm prep ls -la /data/tiles/`
2. Check that Martin tileserver is running: `curl http://localhost:8080/catalog`
3. Verify hillshade tiles exist: `docker-compose run --rm prep ls -la /data/tiles/hillshade/`
