# Systemöversikt

## Vad är Stockholm Topo?

Stockholm Topo är ett Docker-baserat system för att generera högkvalitativa topografiska kartexporter av Stockholm. Systemet är designat för att producera kartkonst lämplig för väggupphängning.

## Två parallella implementationer

Systemet består av två demos som kompletterar varandra:

### Demo A - WebGL/MapLibre

- **Teknologi**: MapLibre GL JS + Playwright
- **Rendering**: Klientsidan (WebGL i webbläsaren)
- **Styrka**: Snabb iteration, interaktivitet, 3D-perspektiv (pitch)
- **Export**: Playwright tar screenshot av renderad karta
- **Användning**: Utforskning, kreativ design, preview

Demo A är optimerad för snabb feedback. Du kan panorera, zooma och till och med ändra perspektiv (pitch) i realtid. Perfekt för att experimentera med olika vyer och teman innan du bestämmer dig för final export.

### Demo B - Mapnik/PostGIS

- **Teknologi**: PostGIS + Mapnik + Flask
- **Rendering**: Serversidan
- **Styrka**: Kartografisk korrekthet, determinism, byte-identiska exports
- **Export**: Direkt rendering till PNG/PDF
- **Användning**: Final print master, professionella exports

Demo B är designat för produktionskvalitet. Samma input ger alltid exakt samma output (byte-identiskt), vilket är kritiskt för reproducerbarhet och arkivering.

## Arkitektur & Dataflöde

```
                         ┌──────────────────────┐
                         │    Externa källor    │
                         │                      │
                         │  OSM (Geofabrik)     │
                         │  DEM (EU Copernicus) │
                         └──────────┬───────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────┐
│                         prep-service                               │
│                                                                   │
│  1. Download         2. Process           3. Generate Tiles       │
│  ────────────        ───────────          ─────────────────       │
│  download_osm.py     clip_osm.py          generate_osm_tiles.sh   │
│  download_dem.py     generate_hillshade   generate_hillshade_tiles│
│                      extract_contours     generate_contour_tiles  │
│                                                                   │
│  Output:                                                          │
│  ├── /data/osm/{preset}.osm.pbf                                  │
│  ├── /data/terrain/hillshade/{preset}_hillshade.tif              │
│  ├── /data/terrain/contours/{preset}_{2m,10m,50m}.geojson        │
│  ├── /data/tiles/osm/{preset}.mbtiles                            │
│  ├── /data/tiles/hillshade/{preset}/{z}/{x}/{y}.png              │
│  └── /data/tiles/contours/{preset}_{2m,10m,50m}.mbtiles          │
└───────────────────────────────────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         │                                                      │
         ▼                                                      ▼
┌─────────────────────────────┐            ┌─────────────────────────────┐
│       Demo A (WebGL)        │            │       Demo B (Mapnik)       │
│                             │            │                             │
│  Martin (tiles) ───────┐    │            │  PostGIS (osm2pgsql) ──┐    │
│  Nginx (hillshade) ───┐│    │            │                        │    │
│                       ││    │            │                        │    │
│                       ▼▼    │            │                        ▼    │
│  MapLibre (browser) ──────► │            │  Mapnik (Python) ─────────► │
│                             │            │                             │
│  Playwright (export) ─────► │            │  Flask API (export) ─────► │
│                             │            │                             │
│  Portar: 3000, 8080-8082    │            │  Portar: 3001, 5000-5001    │
└─────────────────────────────┘            └─────────────────────────────┘
```

### Dataflöde sammanfattning

1. **OSM**: Geofabrik → clip → Planetiler → MBTiles → Martin (Demo A) / osm2pgsql (Demo B)
2. **DEM**: Copernicus EU-DEM → gdalwarp → gdaldem hillshade → gdal2tiles → XYZ PNG
3. **Contours**: DEM → gdal_contour → GeoJSON → Tippecanoe → MBTiles

## Datakällor

### OpenStreetMap (OSM)

- Vägar, gator, stigar
- Byggnader
- Vatten (sjöar, hav, vattendrag)
- Parker och grönområden
- Markanvändning

### EU-DEM (Digital Elevation Model)

- Höjddata från Copernicus
- Används för hillshade (skuggning som visar terräng)
- Används för höjdkurvor (konturer)

## Teman

Systemet stödjer flera färgteman som kontrollerar utseendet på kartan:

| Tema | Beskrivning |
|------|-------------|
| paper | Ljus, pappersliknande bakgrund |
| ink | Stark kontrast, bläckliknande |
| mono | Svartvitt |
| dark | Mörkt tema |
| gallery | Galleri-stil |
| charcoal | Kol/gråskala |
| warm-paper | Varm papperston |
| blueprint-muted | Dämpad ritningsstil |
| muted-pastel | Mjuka pastellfärger |

Teman definieras som JSON-filer i `/themes/` och styr färger för:
- Bakgrund
- Vatten (fyllning och kontur)
- Vägar (linje och bredd)
- Byggnader (fyllning och kontur)
- Höjdkurvor (linje och opacitet)
- Hillshade (opacitet)
- Parker (fyllning och kontur)

## Bbox Presets

Fördefinierade geografiska områden:

| Preset | Koordinater | Område |
|--------|-------------|--------|
| stockholm_core | [17.90, 59.32, 18.08, 59.35] | Centrala Stockholm |
| stockholm_wide | [17.75, 59.28, 18.25, 59.40] | Större Stockholmsområdet |

## Exportdimensioner

Typiska exportformat:

| Format | DPI | Bredd (mm) | Höjd (mm) | Bredd (px) | Höjd (px) |
|--------|-----|------------|-----------|------------|-----------|
| A2 | 150 | 420 | 594 | 2,480 | 3,508 |
| A2 | 300 | 420 | 594 | 4,961 | 7,016 |
| A1 | 150 | 594 | 841 | 3,508 | 4,961 |

Formel: `pixlar = mm × dpi / 25.4`

## Kritiska begränsningar

1. **Höjdkurvor**: Renderas ALDRIG med etiketter - endast visuell rytm
2. **Print-läge**: Etiketter AV som standard (opt-in krävs)
3. **Koordinatsystem**: EPSG:3857 överallt (Web Mercator)
4. **Determinism**:
   - Demo A: Visuell stabilitet (mindre GPU-relaterade pixelskillnader acceptabla)
   - Demo B: Byte-identisk output krävs (samma input → identisk SHA256)

## Volymer

Docker-volymer för persistent data:

- `data:/data` - OSM, DEM, terräng, tiles (delad, persistent)
- `exports:/exports` - Exporterade bilder

## Nästa steg

Se [ROADMAP.md](ROADMAP.md) för planerade funktioner.
