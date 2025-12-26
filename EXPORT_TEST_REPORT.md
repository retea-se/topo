# Export Test Results - End-to-End Testing

**Datum:** 2025-12-25
**Syfte:** Verifiera att hela pipelinen fungerar (data → render → export) för båda demos

## Exekveringsstatus

### Services Status
✅ **Alla services kör:**
- Demo A: web (3000), tileserver (8080), hillshade (8081), exporter (8082)
- Demo B: web (3001), API (5000), renderer (5001), db (5432)

### Test Resultat

#### Demo A - Exports
❌ **Screen mode export:** FAILED
- **Problem:** Anslutningen stängs av fjärrvärden
- **Orsak:** Exporter startar men kan inte nå web-applikationen eller renderingen tar för lång tid/timeout
- **Loggar:** Inga fel i exporter-loggar, endast "listening on port 8082"

❌ **Print mode export:** FAILED
- **Problem:** Samma som screen mode

#### Demo B - Exports
⚠️ **PNG export:** PARTIAL SUCCESS
- **API Response:** HTTP 200 (success)
- **Problem:** Anslutningen stängs innan data kan läsas (timeout/rendering tar för lång tid)
- **Mapnik Loggar:** Varningar om XML-parsing:
  ```
  Unable to process some data while parsing XML:
  * node 'Styles' at line 7
  * node 'Layers' at line 47
  ```

## Identifierade Problem

### 1. Demo A - Exporter Anslutningsproblem
**Problem:** Exporter kan inte slutföra rendering
**Möjliga orsaker:**
- Playwright tar för lång tid att rendera kartan
- Web-applikationen laddar tiles för långsamt
- Timeout-värden är för korta
- Nätverkskommunikation mellan exporter och web-app

**Åtgärder:**
1. Öka timeout-värden i exporter (från 60s till 180s)
2. Kontrollera att web-app är tillgänglig från exporter-container
3. Verifiera att tileserver och hillshade-server svarar korrekt

### 2. Demo B - Mapnik XML Parsing Varningar
**Problem:** Mapnik rapporterar parsing-varningar för Styles och Layers-noder
**Orsak:** Background-style använder PolygonSymbolizer men background-layer har placeholder datasource

**Åtgärder:**
1. Ta bort background-style från XML (map background-color räcker)
2. Eller skapa en korrekt background datasource
3. Validera XML-strukturen mot Mapnik-schema

### 3. Anslutning Timeouts
**Problem:** HTTP-anslutningar stängs innan rendering är klar
**Orsak:** Rendering tar längre tid än förväntat (>120 sekunder)

**Åtgärder:**
1. Öka timeout i test-scripts till 180-300 sekunder
2. Implementera progress-indikatorer
3. Optimerera rendering-prestanda

## Rekommendationer

### Kortsiktigt (för att få exports att fungera):
1. **Demo A:**
   - Öka timeout i `demo-a/exporter/src/server.js` för `page.goto()` och `waitForFunction()`
   - Verifiera nätverkskommunikation mellan services
   - Testa med mindre export-storlek först (100x100px)

2. **Demo B:**
   - Fixa Mapnik XML background-style problem
   - Testa med mindre export-storlek
   - Validera att PostGIS-data faktiskt är importerad

### Långsiktigt:
1. Implementera progress endpoints för långa rendering-jobb
2. Lägg till caching av renders för samma parametrar
3. Förbättra felhantering och logging
4. Lägg till health checks på exporter-endpoints

## Nästa Steg

1. ✅ Fixa Mapnik XML background-style (ta bort placeholder style)
2. ✅ Öka timeout-värden i Demo A exporter
3. ✅ Testa med mindre export-storlekar först
4. ✅ Verifiera data-tillgänglighet (tiles, PostGIS-data)
5. ✅ Kör om export-tester med fixarna

## Testkommandon

### Demo A (när fixat):
```powershell
# Screen mode
Invoke-WebRequest -Uri "http://localhost:8082/render?bbox_preset=stockholm_core&theme=paper&render_mode=screen&dpi=150&width_mm=210&height_mm=297" -TimeoutSec 180 -OutFile "export_demo_a_screen.png"

# Print mode
Invoke-WebRequest -Uri "http://localhost:8082/render?bbox_preset=stockholm_core&theme=paper&render_mode=print&dpi=150&width_mm=420&height_mm=594" -TimeoutSec 300 -OutFile "export_demo_a_print.png"
```

### Demo B (när fixat):
```powershell
$body = @{bbox_preset='stockholm_core';theme='paper';render_mode='print';dpi=150;width_mm=420;height_mm=594;format='png'} | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:5000/render" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 300 -OutFile "export_demo_b.png"
```




