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

## Arkitektur

```
┌─────────────────────────────────────────────────────────────────┐
│                         prep-service                            │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────────────┐    │
│  │ download_   │    │ download_   │    │ generate_        │    │
│  │ osm.py      │    │ dem.py      │    │ hillshade.py     │    │
│  └──────┬──────┘    └──────┬──────┘    └────────┬─────────┘    │
│         │                  │                    │              │
│         ▼                  ▼                    ▼              │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────────────┐    │
│  │ clip_osm.py │    │ extract_    │    │ generate_*_      │    │
│  │             │    │ contours.py │    │ tiles.sh         │    │
│  └──────┬──────┘    └──────┬──────┘    └────────┬─────────┘    │
│         │                  │                    │              │
│         ▼                  ▼                    ▼              │
│    OSM .pbf           Contours            MBTiles/XYZ         │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┴────────────────────┐
         │                                         │
         ▼                                         ▼
┌─────────────────────────┐          ┌─────────────────────────┐
│       Demo A            │          │       Demo B            │
│                         │          │                         │
│  ┌─────────────────┐    │          │  ┌─────────────────┐    │
│  │ Martin          │    │          │  │ PostGIS         │    │
│  │ (tileserver)    │    │          │  │ (osm2pgsql)     │    │
│  └────────┬────────┘    │          │  └────────┬────────┘    │
│           │             │          │           │             │
│           ▼             │          │           ▼             │
│  ┌─────────────────┐    │          │  ┌─────────────────┐    │
│  │ MapLibre        │    │          │  │ Mapnik          │    │
│  │ (webbläsare)    │    │          │  │ (Python)        │    │
│  └────────┬────────┘    │          │  └────────┬────────┘    │
│           │             │          │           │             │
│           ▼             │          │           ▼             │
│  ┌─────────────────┐    │          │  ┌─────────────────┐    │
│  │ Playwright      │    │          │  │ Flask API       │    │
│  │ (export)        │    │          │  │ (export)        │    │
│  └─────────────────┘    │          │  └─────────────────┘    │
│                         │          │                         │
│  Port: 3000, 8082       │          │  Port: 3001, 5000       │
└─────────────────────────┘          └─────────────────────────┘
```

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
