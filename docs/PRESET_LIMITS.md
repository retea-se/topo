# Preset Limits och Export-skydd

## Syfte

Detta dokument beskriver begransningarna och skyddsrackena som finns for att forhindra att stora presets leder till trasiga exports eller ohanterlig byggtid.

## Preset-kontrakt

Varje preset har definierade granser for DPI, format och renderingstid. Dessa granser finns i `prep-service/config/preset_limits.json`.

### stockholm_core

| Egenskap | Varde |
|----------|-------|
| Komplexitet | Low |
| Max DPI | 600 |
| Tillagna format | A4, A3, A2, A1, A0 |
| Hillshade zoom | z10-16 |
| Contours zoom | z10-16 |
| Beraknad byggtid | ~5 min |
| Diskatgang | ~0.5 GB |

### stockholm_wide

| Egenskap | Varde |
|----------|-------|
| Komplexitet | Medium |
| Max DPI | 300 |
| Tillagna format | A4, A3, A2, A1 |
| Hillshade zoom | z10-16 |
| Contours zoom | z10-16 |
| Beraknad byggtid | ~15 min |
| Diskatgang | ~2.5 GB |

**Varning**: Format A0 ar inte rekommenderat for stockholm_wide.

### svealand

| Egenskap | Varde |
|----------|-------|
| Komplexitet | High |
| Max DPI | 150 |
| Tillagna format | A4, A3, A2 |
| Hillshade zoom | z9-14 (begransat) |
| Contours zoom | z8-13 (begransat) |
| Beraknad byggtid | ~120 min |
| Diskatgang | ~15 GB |

**Varning**: Format A1 och A0 ar inte tillatna for svealand. DPI over 150 ar inte tillatet.

## Harda granser

Foljande granser galler for alla exports:

| Grans | Varde |
|-------|-------|
| Max totalt antal pixlar | 100,000,000 |
| Max renderingstid | 600 sekunder |
| Max filstorlek | 500 MB |

## Hur skyddet fungerar

### Server-side validering

1. Renderer-tjänsten validerar alla render-requests mot preset_limits.json
2. Om DPI overskrider max_dpi: HTTP 400 med felmeddelande
3. Om format inte ar tillatet: HTTP 400 med felmeddelande
4. Om totalt antal pixlar overskrider grans: HTTP 400 med felmeddelande

### UI-varningar (Demo B)

1. Vid val av preset visas info om komplexitet, max DPI och tillatna format
2. Vid andring av DPI eller format valideras installningarna mot servern
3. Roda felmeddelanden visas om export inte ar mojlig
4. Gula varningar visas om installningarna kan leda till lang renderingstid
5. Bla info visar beraknade dimensioner och renderingstid

## API-endpoints

### GET /preset-limits

Returnerar preset-limits konfigurationen som JSON.

### POST /validate

Validerar en render-request utan att faktiskt rendera.

**Request body:**
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
  "warnings": ["High DPI (300) may result in slow rendering for 'stockholm_wide'"],
  "info": {
    "width_px": 4961,
    "height_px": 7016,
    "total_pixels": 34807176,
    "complexity": "medium",
    "detected_format": "A2"
  }
}
```

## Anpassa granser

For att andra granserna, redigera `prep-service/config/preset_limits.json` och starta om renderer-tjänsten.

## Fragor och svar

**F: Varfor ar svealand begransat till 150 DPI?**
S: Svealand ar ett mycket stort omrade (~2000x storre an stockholm_core). Hogre DPI skulle leda till extremt stora filer och orimliga renderingstider.

**F: Kan jag overskrida granserna?**
S: Nej, granserna ar harda. Om du behover hogre upplosning, anvand en mindre preset och skarv ihop exporterna.

**F: Varfor visas varningar aven om exporten ar tillaten?**
S: Varningar ar till for att informera om potentiella problem (lang renderingstid, stor filstorlek). Exporten ar fortfarande mojlig.
