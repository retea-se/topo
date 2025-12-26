# Tiles-översikt: Nuvarande och möjliga tillägg

**Senast uppdaterad**: 2025-12-27

## Nuvarande tiles i systemet

### OSM Vector Tiles (via Planetiler)
Genereras från OSM PBF och serveras via Martin tileserver.

**Använda source-layers:**
- `water` - Vattenområden (polygoner)
- `park` - Parker och grönområden (polygoner)
- `landcover` - Skog, gräs, etc. (polygoner med `class`-fält)
- `transportation` - Vägar (linjer med `class`-fält: service, track, path, minor, primary, secondary, tertiary, trunk, motorway)
- `building` - Byggnader (polygoner)

**Tillgängliga men ej använda source-layers (Planetiler standard):**
- `boundary` - Administrativa gränser (land, region, kommun, etc.)
- `place` - Platser och orter (punkter med namn)
- `poi` - Points of Interest (restauranger, butiker, etc.)
- `aeroway` - Flygplatser och landningsbanor
- `aerialway` - Linbanor, skidliftar
- `piste` - Skidpist
- `mountain_pass` - Bergspass
- `waterway` - Vattendrag (linjer: floder, bäckar, kanaler)
- `watername` - Vattennamn (labels)
- `park_name` - Parknamn (labels)
- `housenumber` - Husnummer
- `place_label` - Ortnamn (labels)

### Contour Vector Tiles (via Tippecanoe)
Genereras från DEM-data och serveras via Martin tileserver.

**Nuvarande intervall:**
- `contours_2m` - 2 meters intervall (finaste detalj)
- `contours_10m` - 10 meters intervall (mellan)
- `contours_50m` - 50 meters intervall (grovaste, major contours)

**Möjliga tillägg:**
- `contours_5m` - 5 meters intervall (mellan 2m och 10m)
- `contours_20m` - 20 meters intervall (mellan 10m och 50m)
- `contours_100m` - 100 meters intervall (för större områden)

### Hillshade Raster Tiles (via gdal2tiles.py)
Genereras från DEM-data och serveras via nginx.

**Nuvarande:**
- XYZ PNG tiles (z10-16)
- TMS-schema
- 256x256 pixlar per tile

**Möjliga tillägg:**
- Slope tiles (lutning)
- Aspect tiles (riktning)
- Terrain ruggedness index (TRI)
- Topographic position index (TPI)

---

## Förslag på nya tiles/lager

### 1. OSM-lager (lätt att lägga till)

#### Boundaries (administrativa gränser)
- **Vad**: Land, region, kommun, stadsdelar
- **Användning**: Visa administrativa gränser på kartan
- **Implementation**: Lägg till `boundary` source-layer i `themeToStyle.js`
- **Komplexitet**: Låg (data finns redan i OSM tiles)

#### Waterways (vattendrag)
- **Vad**: Floder, bäckar, kanaler (linjer)
- **Användning**: Visa vattendrag som linjer (utöver vattenområden som polygoner)
- **Implementation**: Lägg till `waterway` source-layer
- **Komplexitet**: Låg

#### Place Labels (ortnamn)
- **Vad**: Städer, stadsdelar, orter
- **Användning**: Visa ortnamn på kartan (valfritt, kan stängas av för print)
- **Implementation**: Lägg till `place` source-layer med text-symbolizer
- **Komplexitet**: Medel (kräver label-styling och zoom-baserad visning)

#### POI (Points of Interest)
- **Vad**: Restauranger, butiker, turistattraktioner, etc.
- **Användning**: Visa intressanta platser (valfritt lager)
- **Implementation**: Lägg till `poi` source-layer
- **Komplexitet**: Medel (kräver ikoner och zoom-baserad visning)

### 2. Terrain-lager (kräver ny datagenerering)

#### Slope Tiles (lutning)
- **Vad**: Raster tiles som visar terränglutning
- **Användning**: Färgkodad visning av lutning (t.ex. grön = platt, röd = brant)
- **Implementation**:
  - Generera slope från DEM: `gdaldem slope input.tif slope.tif`
  - Skapa XYZ tiles: `gdal2tiles.py slope.tif`
- **Komplexitet**: Medel (ny prep-service pipeline)

#### Aspect Tiles (riktning)
- **Vad**: Raster tiles som visar terrängriktning (nord, syd, etc.)
- **Användning**: Färgkodad visning av riktning
- **Implementation**:
  - Generera aspect från DEM: `gdaldem aspect input.tif aspect.tif`
  - Skapa XYZ tiles: `gdal2tiles.py aspect.tif`
- **Komplexitet**: Medel

### 3. Externa datakällor (kräver ny integration)

#### Satellitbilder
- **Vad**: Raster tiles från satellit (t.ex. Sentinel-2, Landsat)
- **Användning**: Bakgrundslager med satellitbilder
- **Källor**:
  - Sentinel Hub (kräver API-nyckel)
  - Mapbox Satellite (kräver API-nyckel)
  - OpenStreetMap tile servers (begränsad användning)
- **Komplexitet**: Hög (kräver externa API:er och ny tileserver)

#### Väderdata
- **Vad**: Temperatur, nederbörd, etc. som overlay
- **Användning**: Väderoverlay på kartan
- **Källor**: OpenWeatherMap, SMHI API
- **Komplexitet**: Hög (kräver externa API:er och dynamisk tile-generering)

#### Trafikdata
- **Vad**: Trafikflöde, köer, etc.
- **Användning**: Realtids trafikdata
- **Källor**: Trafikverket API, Google Traffic
- **Komplexitet**: Mycket hög (kräver externa API:er och dynamisk uppdatering)

---

## Rekommendationer (prioriterad ordning)

### Prioritet 1: Lätta OSM-lager (ingen ny datagenerering)
1. **Boundaries** - Administrativa gränser (användbart för orientering)
2. **Waterways** - Vattendrag som linjer (kompletterar vattenområden)
3. **Place Labels** - Ortnamn (viktigt för orientering, men kan stängas av för print)

### Prioritet 2: Fler contour-intervall (kräver ny generering)
4. **Contours 5m** - Finare detalj för vissa områden
5. **Contours 20m** - Mellannivå mellan 10m och 50m

### Prioritet 3: Terrain-lager (kräver ny datagenerering)
6. **Slope tiles** - Visuellt intressant för terränganalys
7. **Aspect tiles** - Kompletterar slope

### Prioritet 4: POI och labels (kräver styling)
8. **POI** - Points of Interest (användbart för turistkartor)
9. **Water names** - Vattennamn (labels)

### Prioritet 5: Externa källor (kräver externa API:er)
10. **Satellitbilder** - Bakgrundslager
11. **Väderdata** - Overlay (mycket komplex)

---

## Implementation-guide

### Lägga till ett nytt OSM-lager

1. **Verifiera att data finns i tiles:**
   ```bash
   # Inspecta en tile för att se vilka source-layers som finns
   curl http://localhost:8080/osm/10/550/320 | gunzip | jq
   ```

2. **Lägg till source i `themeToStyle.js`:**
   ```javascript
   // Source finns redan (osm), lägg bara till nytt lager
   style.layers.push({
     id: 'boundaries',
     type: 'line',
     source: 'osm',
     'source-layer': 'boundary',
     filter: ['in', ['get', 'admin_level'], ['literal', [2, 4]]], // Land och region
     paint: {
       'line-color': '#888888',
       'line-width': 1,
       'line-dasharray': [2, 2]
     }
   });
   ```

3. **Lägg till i tema-filer (valfritt):**
   ```json
   {
     "boundaries": {
       "stroke": "#888888",
       "strokeWidth": 1,
       "strokeDasharray": [2, 2]
     }
   }
   ```

4. **Lägg till layer toggle i UI (valfritt):**
   - Se `demo-a/web/public/index.html` för exempel

### Lägga till ett nytt terrain-lager

1. **Lägg till prep-service script:**
   - Skapa `prep-service/scripts/generate_slope_tiles.sh`
   - Använd `gdaldem slope` för att generera slope
   - Använd `gdal2tiles.py` för att skapa tiles

2. **Lägg till i docker-compose.yml:**
   - Ny nginx-service för slope tiles (eller samma nginx med fler paths)

3. **Lägg till source i `themeToStyle.js`:**
   ```javascript
   slope: {
     type: 'raster',
     tiles: [`${hillshadeTilesUrl}/tiles/slope/${preset}/{z}/{x}/{y}.png`],
     tileSize: 256,
     scheme: 'tms',
     minzoom: 10,
     maxzoom: 16
   }
   ```

4. **Lägg till lager:**
   ```javascript
   style.layers.push({
     id: 'slope',
     type: 'raster',
     source: 'slope',
     paint: {
       'raster-opacity': 0.3
     }
   });
   ```

---

## Exempel: Lägga till Boundaries

Här är ett konkret exempel på hur man lägger till administrativa gränser:

### 1. Uppdatera `themeToStyle.js`

Lägg till efter water-lagret:

```javascript
// Boundaries layer (administrative borders)
if (theme.boundaries) {
  style.layers.push({
    id: 'boundaries-country',
    type: 'line',
    source: 'osm',
    'source-layer': 'boundary',
    filter: ['==', ['get', 'admin_level'], 2], // Country level
    paint: {
      'line-color': theme.boundaries.stroke || '#666666',
      'line-width': theme.boundaries.strokeWidth || 2,
      'line-dasharray': [4, 2]
    }
  });

  style.layers.push({
    id: 'boundaries-region',
    type: 'line',
    source: 'osm',
    'source-layer': 'boundary',
    filter: ['==', ['get', 'admin_level'], 4], // Region level
    paint: {
      'line-color': theme.boundaries.stroke || '#888888',
      'line-width': theme.boundaries.strokeWidth || 1,
      'line-dasharray': [2, 2]
    }
  });
}
```

### 2. Uppdatera tema-filer (valfritt)

Lägg till i `themes/paper.json`:

```json
{
  "boundaries": {
    "stroke": "#888888",
    "strokeWidth": 1
  }
}
```

### 3. Testa

1. Starta systemet: `docker compose --profile demoA up`
2. Öppna http://localhost:3000
3. Verifiera att boundaries visas (om data finns i tiles)

---

## Noteringar

- **Planetiler schema**: Verifiera faktiskt schema i genererade tiles innan implementation
- **Performance**: Fler lager = mer data = långsammare rendering
- **Print mode**: Vissa lager (t.ex. labels) kan vara onödiga i print-mode
- **Theme support**: Nya lager bör ha tema-stöd för konsistens


