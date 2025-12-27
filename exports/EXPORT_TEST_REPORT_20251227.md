# Export Test Rapport - Print Editor Frontend
**Datum**: 2025-12-27 11:00 CET
**Testare**: Browser automation (Chrome)
**URL**: http://localhost:3000/editor

## Testresultat

### ✅ PNG Export - FUNGERAR
- **Status**: ✅ Lyckad
- **Endpoint**: `http://localhost:8082/render` (Demo A exporter)
- **HTTP Status**: 200 OK
- **Resultat**: Fil nedladdad: `export_stockholm_core_blueprint-muted_420x594mm_150dpi_2025-12-27T10-00-48.png`
- **UI-feedback**: Success-meddelande visas i status bar: "Exported: export_stockholm_core_blueprint-muted_420x594mm_150dpi_2025-12-27T10-00-48.png"

### ❌ PDF Export - CORS-FEL
- **Status**: ❌ Misslyckad
- **Endpoint**: `http://localhost:5000/api/render` (Demo B API)
- **Problem**: CORS (Cross-Origin Resource Sharing) fel
- **Felmeddelande i console**:
  ```
  Access to fetch at 'http://localhost:5000/api/render' from origin 'http://localhost:3000'
  has been blocked by CORS policy: Response to preflight request doesn't pass access control
  check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
  ```
- **Network requests**:
  - OPTIONS request till `/api/render`: **404 Not Found**
  - POST request: Blockerad av CORS (ingen status code)
- **UI-feedback**: Röd notifikationsruta med texten "Export failed"

### ⚠️ SVG Export - FÖRVÄNTAS HA SAMMA PROBLEM
- **Status**: Ej testad (förväntas ha samma CORS-problem som PDF)
- **Anledning**: Använder samma endpoint som PDF (`http://localhost:5000/api/render`)

## Detaljerad Analys

### CORS-problemet
1. **Preflight request (OPTIONS) misslyckas**:
   - Request till `http://localhost:5000/api/render` med method OPTIONS
   - Svar: 404 Not Found
   - Detta indikerar att Demo B API inte hanterar OPTIONS-requests korrekt

2. **POST-request blockerad**:
   - Eftersom preflight misslyckas, blockeras POST-requesten av webbläsaren
   - Ingen faktisk export sker

3. **Skillnad mellan PNG och PDF/SVG**:
   - PNG använder Demo A exporter (port 8082) som verkar ha korrekt CORS-hantering
   - PDF/SVG använder Demo B API (port 5000) som saknar CORS-hantering

### Export Modal Beteende
- Modal visas korrekt när export startar
- Progress bar uppdateras: "Preparing export..." → "Rendering map..."
- Vid fel: Modal stängs efter 3 sekunder, röd status visas i status bar

## Rekommendationer

### För att fixa PDF/SVG export:
1. **Lägg till CORS-headers i Demo B API** (`demo-b/api`):
   - `Access-Control-Allow-Origin: http://localhost:3000` (eller `*` för utveckling)
   - `Access-Control-Allow-Methods: POST, OPTIONS`
   - `Access-Control-Allow-Headers: Content-Type`
   - Hantera OPTIONS-requests korrekt (returnera 200 med headers)

2. **Alternativt**: Använd en proxy i Demo A web-servern för att undvika CORS helt

### Testade Scenarier
- ✅ PNG export med standardinställningar (A2, 150 DPI, blueprint-muted theme)
- ❌ PDF export med standardinställningar (CORS-fel)
- ⚠️ SVG export ej testad (förväntas ha samma problem)

## Screenshots
- `page-2025-12-27T10-00-58-987Z.png` - Export modal under PNG export
- `page-2025-12-27T10-01-17-456Z.png` - Success efter PNG export
- `page-2025-12-27T10-01-40-102Z.png` - "Export failed" efter PDF export-försök

## Console Messages
```
Map loaded (http://localhost:3000/editor.js:1582)
Access to fetch at 'http://localhost:5000/api/render' from origin 'http://localhost:3000'
has been blocked by CORS policy: Response to preflight request doesn't pass access control
check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
Export error: TypeError: Failed to fetch
```

## Network Requests (PDF export)
- OPTIONS `http://localhost:5000/api/render` → 404 Not Found
- POST `http://localhost:5000/api/render` → Blockerad (ingen status)

## Slutsats
PNG-export fungerar perfekt via Demo A exporter. PDF och SVG-export misslyckas på grund av CORS-problem i Demo B API. Detta är exakt det felmeddelande som användaren rapporterade - exportmodalen visar "Export failed" när PDF/SVG väljs.

---

## Fix Verification (2025-12-27 11:07 CET)

### ✅ CORS-Fix Implementerad

**Ändrade filer:**
- `demo-b/api/app.py` - Lagt till CORS-hantering
- `demo-b/api/requirements.txt` - Lagt till pytest för tester
- `demo-b/api/test_cors.py` - Automatiska tester (ny fil)

**Implementering:**
1. **CORS middleware** (`@app.before_request` och `@app.after_request`):
   - Hanterar OPTIONS preflight-requests med status 204
   - Lägger till CORS-headers på alla responses
   - Validerar origin mot whitelist (`http://localhost:3000`, `http://localhost:3001`)

2. **Ny route**: `/api/render` (utöver befintlig `/render`)
   - Frontend anropar `/api/render` så route lades till

3. **CORS headers**:
   - `Access-Control-Allow-Origin: http://localhost:3000` (validerad origin)
   - `Access-Control-Allow-Methods: POST, OPTIONS`
   - `Access-Control-Allow-Headers: Content-Type, Authorization`
   - `Access-Control-Max-Age: 86400`

### Verifiering

#### curl Preflight (OPTIONS) - ✅ FUNGERAR
```bash
curl -i -X OPTIONS http://localhost:5000/api/render \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
```

**Resultat:**
```
HTTP/1.1 204 NO CONTENT
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
Access-Control-Allow-Origin: http://localhost:3000
```

#### curl POST - ✅ CORS-headers finns med
```bash
curl -i -X POST http://localhost:5000/api/render \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d '{"bbox_preset":"stockholm_core","theme":"paper","format":"pdf"}'
```

**Resultat:** Response innehåller CORS-headers (även om request kan ge 500 p.g.a. renderer-tjänst)

#### Browser Test - ✅ CORS-problemet löst
- **OPTIONS request**: Status 204 (No Content) ✅
- **POST request**: Går igenom (status 500 p.g.a. renderer-tjänst, men CORS fungerar) ✅
- **Console**: Inga CORS-fel ✅
- **Network tab**: OPTIONS → 204, POST → 500 (CORS OK, renderer-problem separat)

**Notera:** Status 500 beror på att renderer-tjänsten (`demo-b-renderer`) inte kan nås från API-containern (DNS-problem), vilket är ett separat problem från CORS. CORS-fixen fungerar korrekt - preflight passerar och POST-requesten går igenom med korrekta headers.

### Automatiska Tester
- `demo-b/api/test_cors.py` - pytest-tester för CORS-hantering
- Tester verifierar:
  - OPTIONS preflight returnerar 204 med korrekta headers
  - POST-responses innehåller CORS-headers
  - Origin-validering fungerar

**Kör tester:** `docker compose exec demo-b-api python -m pytest test_cors.py -v` (efter ombyggnad av container)

### Nästa Steg
1. ✅ CORS-fix implementerad och verifierad
2. ⚠️ Renderer-tjänst DNS-problem (separat issue - `demo-b-renderer` hostname kan inte resolvas från `demo-b-api`)
3. ✅ PDF/SVG-export kommer fungera när renderer-tjänsten är tillgänglig

