# Sverige Helhetstäckning — Plan och Roadmap

**Skapad**: 2025-12-27
**Status**: PLANERING
**Ägare**: TBD

---

## 1. Sammanfattning

Denna plan beskriver hur systemet kan utökas för att täcka **hela Sverige** med topografiska kartdata. Planen omfattar datakällor, arkitektur, fasindelning, resurskrav och risker.

### Nuvarande täckning

| Preset | Yta (grader²) | Status |
|--------|---------------|--------|
| stockholm_core | 0.005 | ✅ Klart |
| stockholm_wide | 0.06 | ✅ Klart |
| svealand | 11.25 | ✅ Klart |
| **sweden** | **~90** | ⬜ Planeras |

### Målbild

- Full täckning av Sveriges landmassa
- Användbar för export på zoom-nivåer som ger rimlig detalj
- Print-ready kartor för hela landet
- Skalbart system som kan uppdateras

---

## 2. Geografisk Definition

### Sveriges Bounding Box (WGS84)

```
West:   10.5°E  (Gräns mot Norge, Svinesund)
South:  55.3°N  (Smygehuk, sydligaste punkten)
East:   24.2°E  (Haparanda, gräns mot Finland)
North:  69.1°N  (Treriksröset)
```

**Total yta**: ~13.7° × ~13.8° ≈ **189 grader²** (land + vatten)

**Faktisk landyta**: ~450 000 km² ≈ **90 grader²** (exkl. territorialvatten)

### Jämförelse med befintliga presets

| Preset | Yta (grader²) | Faktor vs stockholm_core |
|--------|---------------|--------------------------|
| stockholm_core | 0.005 | 1× |
| stockholm_wide | 0.06 | 12× |
| svealand | 11.25 | 2 250× |
| **sweden** | ~90 | **18 000×** |

---

## 3. Regionindelning — Strategi

Givet storleken rekommenderas en **hierarkisk regionindelning** istället för en monolitisk `sweden`-preset.

### Alt A: Landskapsregioner (Rekommenderas)

Dela in Sverige i 3-5 huvudregioner:

| Region | Bbox (approx) | Yta (grader²) | Beskrivning |
|--------|---------------|---------------|-------------|
| **götaland** | 10.5-19.5, 55.3-59.0 | ~33 | Skåne → Småland → Västergötland |
| **svealand** | 14.5-19.0, 58.5-61.0 | ~11 | (Befintlig) Uppsala, Västerås, Örebro |
| **norrland_syd** | 14.0-20.0, 61.0-65.0 | ~24 | Gävleborg → Jämtland → Västernorrland |
| **norrland_nord** | 14.0-24.2, 65.0-69.1 | ~42 | Norrbotten, Lappland |

**Fördelar:**
- Hanterbara byggprocesser (3-8 timmar per region)
- Möjlighet att prioritera och rulla ut stegvis
- Enklare felsökning och uppdateringar

**Nackdelar:**
- Användaren måste välja region
- Sömmar vid regiongränser

### Alt B: Monolitisk sweden-preset

En enda preset som täcker allt.

**Fördelar:**
- Enkel UX — bara "Sverige"
- Ingen sömproblematik

**Nackdelar:**
- Extremt lång byggtid (12-48 timmar)
- ~500 GB diskutrymme
- Kräver dedikerad build-maskin
- Riskfyllt — ett fel = börja om

### Rekommendation

**Fas 1**: Implementera regionindelning (Alt A)
**Fas 2**: Överväg sammanfogning till `sweden` om UX kräver det

---

## 4. Datakällor och Volymer

### 4.1 OSM-data

**Källa**: Geofabrik Sweden Extract

| Attribut | Värde |
|----------|-------|
| URL | https://download.geofabrik.de/europe/sweden-latest.osm.pbf |
| Storlek | ~750 MB (komprimerad) |
| Uppdatering | Dagligen |
| Licens | ODbL |

**Processing:**
- Redan nedladdad (används för stockholm/svealand)
- Klippning per region: 5-30 min beroende på storlek
- Vector tiles: 30-120 min per region

### 4.2 DEM-data (Höjddata)

**Källa**: Copernicus GLO-30 (rekommenderas)

| Attribut | Värde |
|----------|-------|
| Upplösning | 30 meter |
| Format | GeoTIFF |
| CRS | EPSG:4326 (konverteras till 3857) |
| Täckning | Global |
| Licens | Gratis, kräver konto |

**Alternativ källa**: Lantmäteriet GSD-Höjddata

| Attribut | Värde |
|----------|-------|
| Upplösning | 2 meter (!) |
| Täckning | Endast Sverige |
| Licens | Öppen data (CC0) |
| Nackdel | Extremt stora filer (~2 TB för hela landet) |

**Rekommendation**: GLO-30 för version 1, Lantmäteriet som framtida option.

### 4.3 Uppskattade datavolymer

| Datatyp | Götaland | Svealand | Norrland Syd | Norrland Nord | **Totalt** |
|---------|----------|----------|--------------|---------------|------------|
| OSM PBF (klippt) | ~250 MB | ~150 MB | ~100 MB | ~50 MB | ~550 MB |
| OSM MBTiles | ~800 MB | ~650 MB | ~400 MB | ~200 MB | ~2 GB |
| DEM GeoTIFF | ~3 GB | ~1 GB | ~2 GB | ~4 GB | ~10 GB |
| Hillshade Raster | ~2 GB | ~700 MB | ~1.5 GB | ~3 GB | ~7 GB |
| Hillshade Tiles (XYZ) | ~15 GB | ~5 GB | ~10 GB | ~20 GB | ~50 GB |
| Contour GeoJSON | ~5 GB | ~2 GB | ~4 GB | ~3 GB | ~14 GB |
| Contour MBTiles | ~3 GB | ~1 GB | ~2 GB | ~2 GB | ~8 GB |
| **Subtotal** | ~29 GB | ~10 GB | ~20 GB | ~32 GB | **~91 GB** |

**Med redundans och temp-filer**: ~150-200 GB rekommenderat diskutrymme.

---

## 5. Zoom-nivåer och Kvalitetskompromisser

### Nuvarande nivåer

| Preset | Hillshade | Contours | OSM |
|--------|-----------|----------|-----|
| stockholm_core | z10-16 | z10-16 | z0-16 |
| stockholm_wide | z10-16 | z10-16 | z0-16 |
| svealand | z10-14 | z10-13 | z0-14 |

### Föreslagna nivåer för Sverige

| Region | Hillshade | Contours | OSM | Motivering |
|--------|-----------|----------|-----|------------|
| götaland | z8-13 | z8-12 | z0-14 | Balans mellan detalj och storlek |
| svealand | z8-14 | z8-13 | z0-14 | (Befintlig, ev. justering) |
| norrland_syd | z7-12 | z7-11 | z0-13 | Glest befolkat, lägre detalj OK |
| norrland_nord | z6-11 | z6-10 | z0-12 | Mycket glest, prioritera överblick |

### Zoom-nivå vs Användningsfall

| Zoom | Skala (approx) | Användning |
|------|----------------|------------|
| z6 | 1:9M | Hela Sverige på skärm |
| z8 | 1:2M | Landskap/län |
| z10 | 1:500K | Regionöversikt |
| z12 | 1:125K | Kommunöversikt |
| z14 | 1:30K | Stadsdel/by |
| z16 | 1:8K | Gatunivå |

**Slutsats**: För helsvensk täckning är z8-12 tillräckligt för de flesta kartor. Högre zoom endast för fokusområden.

---

## 6. Arkitekturförändringar

### 6.1 Nya presets i bbox_presets.json

```json
{
  "gotaland": {
    "name": "Götaland",
    "description": "Southern Sweden: Skåne, Blekinge, Småland, Halland, Västergötland, Östergötland, Gotland, Öland",
    "bbox": { "west": 10.5, "south": 55.3, "east": 19.5, "north": 59.0 },
    "center": [15.0, 57.15],
    "zoom": 7
  },
  "norrland_syd": {
    "name": "Southern Norrland",
    "description": "Gävleborg, Dalarna, Västernorrland, Jämtland, Härjedalen",
    "bbox": { "west": 14.0, "south": 61.0, "east": 20.0, "north": 65.0 },
    "center": [17.0, 63.0],
    "zoom": 6
  },
  "norrland_nord": {
    "name": "Northern Norrland",
    "description": "Västerbotten, Norrbotten, Lappland",
    "bbox": { "west": 14.0, "south": 65.0, "east": 24.2, "north": 69.1 },
    "center": [19.0, 67.0],
    "zoom": 5
  }
}
```

### 6.2 Nya limits i preset_limits.json

```json
{
  "gotaland": {
    "description": "Southern Sweden (Skåne to Östergötland)",
    "bbox_wgs84": [10.5, 55.3, 19.5, 59.0],
    "area_deg2": 33.3,
    "complexity": "very_high",
    "limits": {
      "max_dpi": 100,
      "allowed_formats": ["A4", "A3"],
      "max_zoom_hillshade": 13,
      "max_zoom_contours": 12,
      "recommended_dpi": { "A4": 100, "A3": 72 },
      "warning_thresholds": {
        "dpi_warning": 72,
        "format_warning": ["A2", "A1", "A0"]
      }
    },
    "data_requirements": {
      "estimated_disk_gb": 30,
      "build_time_minutes": 360
    }
  }
}
```

### 6.3 Martin Tileserver-konfiguration

Nya sources i martin.yaml:

```yaml
# Götaland contours
contours_gotaland_10m:
  path: /data/tiles/contours/gotaland_10m.mbtiles
contours_gotaland_50m:
  path: /data/tiles/contours/gotaland_50m.mbtiles

# Norrland Syd contours
contours_norrland_syd_10m:
  path: /data/tiles/contours/norrland_syd_10m.mbtiles
contours_norrland_syd_50m:
  path: /data/tiles/contours/norrland_syd_50m.mbtiles

# Etc...
```

### 6.4 Nginx Hillshade-routing

Nya location-block i nginx.conf:

```nginx
location /tiles/hillshade/gotaland/ {
    alias /data/tiles/hillshade/gotaland/;
    add_header Access-Control-Allow-Origin *;
}

location /tiles/hillshade/norrland_syd/ {
    alias /data/tiles/hillshade/norrland_syd/;
    add_header Access-Control-Allow-Origin *;
}
```

### 6.5 Frontend themeToStyle.js

Uppdatera source-selection för nya presets.

---

## 7. Fasindelning — Roadmap

### Fas 1: Förberedelser (1-2 dagar)

| Uppgift | Beskrivning | Status |
|---------|-------------|--------|
| 1.1 | Skapa nya preset-definitioner | ⬜ |
| 1.2 | Uppdatera preset_limits.json | ⬜ |
| 1.3 | Skapa build-scripts för nya regioner | ⬜ |
| 1.4 | Dokumentera nedladdning av Copernicus-konto | ⬜ |

### Fas 2: Götaland (3-5 dagar)

| Uppgift | Beskrivning | Uppskattad tid |
|---------|-------------|----------------|
| 2.1 | Klipp OSM för götaland | 30 min |
| 2.2 | Generera OSM tiles | 2 timmar |
| 2.3 | Ladda ner DEM (Copernicus) | 1-2 timmar |
| 2.4 | Generera hillshade | 1 timme |
| 2.5 | Generera hillshade tiles (z8-13) | 4-6 timmar |
| 2.6 | Extrahera konturer (10m, 50m) | 2 timmar |
| 2.7 | Generera contour tiles | 2 timmar |
| 2.8 | QA-verifiering | 1 dag |

**Total**: ~3 dagar inkl. QA

### Fas 3: Norrland Syd (2-3 dagar)

Samma steg som Fas 2, för norrland_syd-regionen.

### Fas 4: Norrland Nord (2-3 dagar)

Samma steg som Fas 2, för norrland_nord-regionen.

### Fas 5: Integration och QA (2-3 dagar)

| Uppgift | Beskrivning |
|---------|-------------|
| 5.1 | Uppdatera Martin-config med alla sources |
| 5.2 | Uppdatera Nginx-routing |
| 5.3 | Uppdatera frontend (themeToStyle.js) |
| 5.4 | Uppdatera Print Editor med nya presets |
| 5.5 | Full QA över alla regioner |
| 5.6 | Sömverifiering vid regiongränser |
| 5.7 | Dokumentation |

### Fas 6 (Optional): Unified Sweden Preset

Om UX kräver en enda "Sweden"-preset:

| Uppgift | Beskrivning |
|---------|-------------|
| 6.1 | Skapa virtuell compositing-logik |
| 6.2 | Implementera seamless tile-serving |
| 6.3 | Testa export över regiongränser |

---

## 8. Byggtider och Resurskrav

### Uppskattade byggtider

| Region | OSM | DEM Download | Hillshade | Contours | **Total** |
|--------|-----|--------------|-----------|----------|-----------|
| götaland | 2h | 2h | 6h | 4h | **14h** |
| norrland_syd | 1h | 1.5h | 5h | 3h | **10h** |
| norrland_nord | 30m | 2h | 8h | 3h | **14h** |
| **Summa** | 3.5h | 5.5h | 19h | 10h | **~38h** |

**Med marginal**: 48-72 timmars effektiv byggtid.

### Maskinresurser

| Resurs | Minimum | Rekommenderat |
|--------|---------|---------------|
| Disk (SSD) | 200 GB | 500 GB |
| RAM | 16 GB | 32 GB |
| CPU | 4 kärnor | 8+ kärnor |
| Docker RAM | 8 GB | 16 GB |

### Parallellisering

Med tillräckliga resurser kan regioner byggas parallellt:

```
   Dag 1                Dag 2                Dag 3
   ─────                ─────                ─────
   [götaland OSM]       [götaland terrain]   [götaland QA]
   [norrland_syd OSM]   [norrland_syd terr]  [norrland_syd QA]
   [norrland_nord OSM]  [norrland_nord terr] [norrland_nord QA]
```

Med 3 parallella processer: **~3-4 dagar** istället för 5-7.

---

## 9. Kostnadsanalys

### Infrastruktur (engångskostnad)

| Post | Kostnad |
|------|---------|
| SSD 500 GB | ~800 SEK |
| Extra RAM (om behövs) | ~1000 SEK |
| Cloud VM (alternativ, 3 dagar) | ~500-1000 SEK |

### Driftkostnad

| Post | Kostnad/månad |
|------|---------------|
| Disk storage (if self-hosted) | ~0 (engångskostnad) |
| Cloud storage 200 GB | ~200 SEK |
| Bandbredd (if serving tiles) | Varierar |

### Arbetstid

| Fas | Timmar |
|-----|--------|
| Planering & setup | 8h |
| Bygg & monitoring | 20h (passiv) |
| QA & troubleshooting | 16h |
| Dokumentation | 8h |
| **Total** | ~52 timmar |

---

## 10. Risker och Begränsningar

### Tekniska risker

| Risk | Sannolikhet | Konsekvens | Mitigation |
|------|-------------|------------|------------|
| DEM-nedladdning misslyckas | Medel | Hög | Retry-logik, manuell fallback |
| Diskutrymme tar slut | Medel | Hög | Preflight-checks, monitoring |
| Tile-generering timeout | Låg | Medel | Chunked processing |
| Minnesöverflöde vid merge | Medel | Hög | Streaming processing |
| Inkonsistenta sömmar | Medel | Medel | Överlappande buffers |

### Datakvalitetsrisker

| Risk | Sannolikhet | Konsekvens | Mitigation |
|------|-------------|------------|------------|
| Luckor i DEM | Låg | Medel | QA-verifiering, interpolation |
| OSM-data saknas i glesbygd | Medel | Låg | Acceptabelt, dokumentera |
| Koordinatfel vid reprojektion | Låg | Hög | Automatiska tester |

### Operativa risker

| Risk | Sannolikhet | Konsekvens | Mitigation |
|------|-------------|------------|------------|
| Byggtid överskrider uppskattning | Hög | Medel | Marginal i planering |
| Copernicus API rate limiting | Medel | Medel | Chunk downloads, caching |
| OSM uppdateras under bygge | Låg | Låg | Pin version, atomic updates |

---

## 11. Kvalitetssäkring (QA)

### Per-region QA-checklista

- [ ] OSM tiles laddar korrekt i Demo A
- [ ] Hillshade tiles renderas utan 404
- [ ] Contours syns vid rätt zoom-nivåer
- [ ] Export fungerar för alla tillåtna format
- [ ] Inga visuella artefakter vid region-gränser
- [ ] Performance acceptabel (render < 5s)

### Automatiserade tester

Utöka befintliga scripts:

```javascript
// scripts/qa_sweden_coverage.js
const regions = ['gotaland', 'norrland_syd', 'norrland_nord'];

for (const region of regions) {
  await testTileHealth(region);
  await testExport(region, 'A4', 100);
  await testLayerToggles(region);
}
```

### Visuell verifiering

Screenshots för varje region:
- Alla lager på
- Endast konturer
- Hillshade + roads
- Export A4

---

## 12. Dokumentation

### Nya dokument att skapa

| Dokument | Beskrivning |
|----------|-------------|
| `docs/SWEDEN_REGIONS.md` | Beskrivning av regionindelning |
| `docs/BUILD_GUIDE_SWEDEN.md` | Bygginstruktioner för regioner |
| `docs/QA_SWEDEN.md` | QA-rapporter per region |

### Uppdatera befintliga

| Dokument | Ändringar |
|----------|-----------|
| `docs/ROADMAP.md` | Lägg till Sverige-fas |
| `docs/STATUS.md` | Uppdatera coverage-tabell |
| `docs/USAGE.md` | Instruktioner för nya presets |
| `config/bbox_presets.json` | Nya presets |
| `prep-service/config/preset_limits.json` | Nya limits |

---

## 13. Alternativa Strategier

### On-demand Tile Generation

Istället för pre-genererade tiles, generera vid förfrågan.

**Fördelar:**
- Ingen stor initial byggtid
- Endast använda områden processas
- Lätt att uppdatera

**Nackdelar:**
- Långsam första förfrågan
- Kräver robust caching
- Komplexare arkitektur

**Rekommendation**: Hybridlösning — pre-generera populära områden, on-demand för övriga.

### Cloud Tile Hosting

Använd tjänster som MapTiler, Mapbox, eller AWS S3 + CloudFront.

**Fördelar:**
- Skalbarhet
- Global CDN
- Ingen egen infrastruktur

**Nackdelar:**
- Kostnad vid hög trafik
- Externt beroende
- Mindre kontroll

### Lantmäteriet-integration

Använd officiella svenska geodata istället för OSM/Copernicus.

**Fördelar:**
- Högre kvalitet
- Officiell källa
- 2m DEM-upplösning

**Nackdelar:**
- Enorma filer (~2 TB)
- Mer komplex processing
- Potential licensfrågor för kommersiell användning

---

## 14. Beslutspunkter

Följande beslut måste fattas innan implementation:

### Beslut 1: Regionindelning vs Monolitisk

**Fråga**: Ska vi dela in Sverige i regioner eller bygga en enda preset?

**Rekommendation**: Regionindelning (Fas 1)

### Beslut 2: Zoom-nivåer

**Fråga**: Vilka zoom-nivåer är acceptabla för helsvensk täckning?

**Rekommendation**: z8-12 för hillshade, z8-11 för contours

### Beslut 3: DEM-källa

**Fråga**: GLO-30 eller Lantmäteriet?

**Rekommendation**: GLO-30 (enklare, tillräckligt för de flesta användningsfall)

### Beslut 4: Contour-intervall

**Fråga**: Vilka ekvidistanser (10m, 50m, 100m)?

**Rekommendation**: 50m och 100m för storskalig täckning

### Beslut 5: Prioriteringsordning

**Fråga**: Vilken region först?

**Rekommendation**: Götaland (mest befolkat, högst efterfrågan)

---

## 15. Nästa Steg

1. **Granska** denna plan och ta beslut på beslutspunkterna
2. **Skapa** Copernicus-konto om det inte finns
3. **Verifiera** diskutrymme och resurser
4. **Skapa** build-scripts för första regionen
5. **Börja** med Fas 1 (förberedelser)

---

## Appendix A: Sveriges Landskap per Region

### Götaland (10 landskap)
Skåne, Blekinge, Halland, Småland, Öland, Gotland, Västergötland, Östergötland, Dalsland, Bohuslän

### Svealand (6 landskap) — Redan implementerat
Uppland, Södermanland, Västmanland, Närke, Dalarna (delvis), Gästrikland

### Norrland Syd (4 landskap)
Hälsingland, Medelpad, Ångermanland, Jämtland, Härjedalen

### Norrland Nord (2 landskap)
Västerbotten, Norrbotten (inkl. Lappland)

---

## Appendix B: Copernicus GLO-30 Tile Grid

Sverige täcks av följande GLO-30 tiles (1°×1° rutor):

```
N55E010  N55E011  N55E012  N55E013  N55E014  ...  N55E018
N56E010  N56E011  N56E012  N56E013  N56E014  ...  N56E018
...
N69E014  N69E015  N69E016  N69E017  N69E018  ...  N69E024
```

**Totalt**: ~150-180 tiles

---

## Appendix C: Uppskattade Filstorlekar

### Per 1°×1° tile (GLO-30)

| Datatyp | Storlek |
|---------|---------|
| Raw DEM | ~25 MB |
| Reprojected (3857) | ~30 MB |
| Hillshade raster | ~15 MB |
| Hillshade tiles (z8-13) | ~100-500 MB |

### Totalt för Sverige (~160 tiles)

| Datatyp | Storlek |
|---------|---------|
| Raw DEM | ~4 GB |
| Merged & clipped | ~10 GB |
| Hillshade raster | ~7 GB |
| Hillshade tiles | ~50 GB |

---

## Changelog

- 2025-12-27: Initial version
