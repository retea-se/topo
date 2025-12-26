# API Reference

Complete API documentation for the Topo Map Export System.

---

## Demo A - MapLibre Exporter API

**Base URL:** `http://localhost:8082`

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "demo-a-exporter"
}
```

---

### GET /render

Export map as PNG image using Playwright screenshot.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `bbox_preset` | string | No | `stockholm_core` | Preset name: `stockholm_core`, `stockholm_wide`, `svealand` |
| `custom_bbox` | string | No | - | Custom bounding box: `minLon,minLat,maxLon,maxLat` (WGS84) |
| `theme` | string | No | `paper` | Theme name (see available themes below) |
| `render_mode` | string | No | `print` | Rendering mode: `screen` or `print` |
| `dpi` | number | No | `150` | Output resolution (72-600) |
| `width_mm` | number | No | `420` | Output width in millimeters |
| `height_mm` | number | No | `594` | Output height in millimeters |
| `title` | string | No | `''` | Title text (optional) |
| `subtitle` | string | No | `''` | Subtitle text (optional) |
| `attribution` | string | No | `''` | Attribution text (optional) |
| `layers` | string | No | `'{}'` | Layer visibility JSON: `'{"hillshade":true,"water":true,"roads":true,"buildings":true,"contours":true,"parks":true}'` |

**Available Themes:**
- `paper`
- `ink`
- `mono`
- `dark`
- `gallery`
- `charcoal`
- `warm-paper`
- `blueprint-muted`
- `muted-pastel`

**Example Request:**
```bash
curl "http://localhost:8082/render?bbox_preset=stockholm_core&theme=paper&render_mode=print&dpi=150&width_mm=420&height_mm=594" \
  --output export.png
```

**Example with Custom Bbox:**
```bash
curl "http://localhost:8082/render?custom_bbox=17.9,59.32,18.08,59.35&theme=gallery&dpi=300&width_mm=420&height_mm=594" \
  --output export_custom.png
```

**Example with Layer Visibility:**
```bash
curl "http://localhost:8082/render?bbox_preset=stockholm_core&theme=paper&layers=%7B%22hillshade%22%3Afalse%2C%22contours%22%3Atrue%7D" \
  --output export_layers.png
```

**Response:**
- **Content-Type:** `image/png`
- **Content-Disposition:** `attachment; filename="export_..."`
- **Body:** PNG image binary data

**Error Response:**
```json
{
  "error": "Error message",
  "details": "Stack trace"
}
```

---

### GET /exports

List all exported files.

**Response:**
```json
{
  "exports": [
    {
      "name": "export_stockholm_core_paper_420x594mm_150dpi_2024-01-01T12-00-00.png",
      "size": 4194304,
      "created": "2024-01-01T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

## Demo B - Mapnik Renderer API

**Base URL:** `http://localhost:5000`

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

---

### POST /render

Render map using Mapnik (server-side rendering).

**Request Body:**
```json
{
  "bbox_preset": "stockholm_core",
  "custom_bbox": [17.9, 59.32, 18.08, 59.35],
  "theme": "paper",
  "render_mode": "print",
  "dpi": 150,
  "width_mm": 420,
  "height_mm": 594,
  "format": "png",
  "title": "Stockholm Map",
  "subtitle": "Central Area",
  "attribution": "Map data: OpenStreetMap contributors"
}
```

**Request Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `bbox_preset` | string | No | `stockholm_core` | Preset name: `stockholm_core`, `stockholm_wide`, `svealand` |
| `custom_bbox` | array | No | - | Custom bounding box: `[west, south, east, north]` (WGS84) |
| `theme` | string | No | `paper` | Theme name (see available themes above) |
| `render_mode` | string | No | `print` | Rendering mode: `screen` or `print` |
| `dpi` | number | No | `150` | Output resolution (72-600, subject to preset limits) |
| `width_mm` | number | No | `420` | Output width in millimeters |
| `height_mm` | number | No | `594` | Output height in millimeters |
| `format` | string | No | `png` | Output format: `png`, `pdf`, `svg` |
| `title` | string | No | `''` | Title text (optional) |
| `subtitle` | string | No | `''` | Subtitle text (optional) |
| `attribution` | string | No | `'Map data: OpenStreetMap contributors'` | Attribution text |

**Example Request:**
```bash
curl -X POST "http://localhost:5000/render" \
  -H "Content-Type: application/json" \
  -d '{
    "bbox_preset": "stockholm_core",
    "theme": "paper",
    "render_mode": "print",
    "dpi": 150,
    "width_mm": 420,
    "height_mm": 594,
    "format": "png"
  }' \
  --output export.png
```

**Example PDF Export:**
```bash
curl -X POST "http://localhost:5000/render" \
  -H "Content-Type: application/json" \
  -d '{
    "bbox_preset": "stockholm_core",
    "theme": "gallery",
    "dpi": 300,
    "width_mm": 420,
    "height_mm": 594,
    "format": "pdf"
  }' \
  --output export.pdf
```

**Response:**
- **Content-Type:** `image/png`, `application/pdf`, or `image/svg+xml` (depending on format)
- **Body:** Binary data (PNG/PDF/SVG)

**Error Response (400 - Validation Error):**
```json
{
  "error": "DPI 300 exceeds maximum 150 for preset 'svealand'. Reduce DPI or choose a smaller area.",
  "validation": {
    "valid": false,
    "error": "...",
    "warnings": [],
    "info": {
      "width_px": 4961,
      "height_px": 7016,
      "total_pixels": 34807176,
      "complexity": "high"
    }
  }
}
```

**Error Response (500 - Server Error):**
```json
{
  "error": "Error message"
}
```

---

### POST /validate

Validate render parameters without rendering.

**Request Body:**
```json
{
  "bbox_preset": "stockholm_wide",
  "dpi": 300,
  "width_mm": 420,
  "height_mm": 594
}
```

**Response:**
```json
{
  "valid": true,
  "error": null,
  "warnings": [
    "High DPI (300) may result in slow rendering for 'stockholm_wide'"
  ],
  "info": {
    "width_px": 4961,
    "height_px": 7016,
    "total_pixels": 34807176,
    "complexity": "medium",
    "detected_format": "A2",
    "estimated_render_time": 45
  }
}
```

**Error Response:**
```json
{
  "valid": false,
  "error": "DPI 300 exceeds maximum 150 for preset 'svealand'",
  "warnings": [],
  "info": {
    "width_px": 4961,
    "height_px": 7016,
    "total_pixels": 34807176,
    "complexity": "high"
  }
}
```

---

### GET /preset-limits

Get preset limits configuration.

**Response:**
```json
{
  "presets": {
    "stockholm_core": {
      "complexity": "low",
      "limits": {
        "max_dpi": 600,
        "allowed_formats": ["A4", "A3", "A2", "A1", "A0"]
      }
    },
    "stockholm_wide": {
      "complexity": "medium",
      "limits": {
        "max_dpi": 300,
        "allowed_formats": ["A4", "A3", "A2", "A1"]
      }
    },
    "svealand": {
      "complexity": "high",
      "limits": {
        "max_dpi": 150,
        "allowed_formats": ["A4", "A3", "A2"]
      }
    }
  }
}
```

---

## Preset Limits

Each preset has maximum DPI and allowed format restrictions. See [PRESET_LIMITS.md](PRESET_LIMITS.md) for details.

| Preset | Max DPI | Allowed Formats |
|--------|---------|-----------------|
| `stockholm_core` | 600 | A4, A3, A2, A1, A0 |
| `stockholm_wide` | 300 | A4, A3, A2, A1 |
| `svealand` | 150 | A4, A3, A2 |

---

## Layer Visibility (Demo A Only)

The `layers` parameter accepts a JSON string with boolean values for each layer:

```json
{
  "hillshade": true,
  "water": true,
  "roads": true,
  "buildings": true,
  "contours": true,
  "parks": true
}
```

**URL-encoded example:**
```
layers=%7B%22hillshade%22%3Afalse%2C%22contours%22%3Atrue%7D
```

---

## Custom Bounding Box Format

### Demo A (Query Parameter)
Format: `minLon,minLat,maxLon,maxLat` (comma-separated, WGS84)

**Example:**
```
custom_bbox=17.9,59.32,18.08,59.35
```

### Demo B (JSON Array)
Format: `[west, south, east, north]` (array, WGS84)

**Example:**
```json
{
  "custom_bbox": [17.9, 59.32, 18.08, 59.35]
}
```

---

## Common Export Presets

### A2 @ 150 DPI
- **Dimensions:** 420mm × 594mm
- **Pixels:** 2480 × 3508
- **File Size:** ~1-10 MB (depending on theme and format)

### A2 @ 300 DPI
- **Dimensions:** 420mm × 594mm
- **Pixels:** 4961 × 7016
- **File Size:** ~5-50 MB

### A1 @ 150 DPI
- **Dimensions:** 594mm × 841mm
- **Pixels:** 3508 × 4961
- **File Size:** ~2-20 MB

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (validation error, invalid parameters) |
| 500 | Internal Server Error |

---

## Rate Limiting

No rate limiting is currently implemented. However, large exports (high DPI, large formats) may take several minutes to complete.

---

## See Also

- [USAGE.md](USAGE.md) - Usage guide with examples
- [PRESET_LIMITS.md](PRESET_LIMITS.md) - Detailed preset limits documentation
- [STATUS.md](STATUS.md) - System status and feature availability

