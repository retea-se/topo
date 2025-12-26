# Export Test Results

**Datum:** 2025-12-25
**Syfte:** Verifiera end-to-end exports för båda demos

## Status: Services inte igång

### Problem identifierat:
1. **Demo A exporter** - inte tillgänglig på port 8082
2. **Demo B API** - inte tillgänglig på port 5000

### Nästa steg:
1. Starta Demo A services: `docker compose --profile demoA up -d`
2. Starta Demo B services: `docker compose --profile demoB up -d`
3. Vänta på att services är klara
4. Kör test_exports.ps1 igen

### Test plan (när services körs):

#### Demo A:
- ✅ Screen mode export: `http://localhost:8082/render?bbox_preset=stockholm_core&theme=paper&render_mode=screen&dpi=150&width_mm=210&height_mm=297`
- ✅ Print mode export: `http://localhost:8082/render?bbox_preset=stockholm_core&theme=paper&render_mode=print&dpi=150&width_mm=420&height_mm=594`

#### Demo B:
- ✅ PNG export: POST till `http://localhost:5000/render` med JSON body




