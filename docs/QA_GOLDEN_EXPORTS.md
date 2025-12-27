# Golden Exports - Användarguide

**Vad är "golden exports"?**

Golden exports är referensbilder som används för regressionstestning av print export-funktionaliteten. De verifierar att exporten matchar förhandsvisningen och att kompositionselement (ram, titel, skala, attribution) renderas korrekt.

## Syfte

Golden exports finns för att:

1. **Förhindra regressioner** - Säkerställa att ändringar i rendering/export inte förstör befintlig funktionalitet
2. **Verifiera komposition** - Kontrollera att alla print composition-element (frame, title, subtitle, scale, attribution) renderas korrekt
3. **Säkerställa reproducerbarhet** - Verifiera att exports är deterministiska och matchar förväntade resultat

## Vilka goldens finns?

Det finns **3 golden baselines** i `golden/print_export/`:

| Golden | Preset | Template | Syfte |
|--------|--------|----------|-------|
| `A3_Blueprint_v1_Classic_golden.png` | A3 Blueprint | Classic | Text + frame validering |
| `A2_Paper_v1_Minimal_golden.png` | A2 Paper | Minimal | Frame + whitespace validering |
| `A1_Terrain_v1_Bold_golden.png` | A1 Terrain | Bold | Terrain + tung komposition validering |

**Metadata:** Se `golden/print_export/metadata.json` för exakta parametrar, SHA256-hashar och dimensioner.

## Vad är INTE golden?

Följande exports är **INTE** golden baselines:

- ❌ Demo A preview-exports (tillfälliga test-exports)
- ❌ Modified presets (presets med anpassade parametrar)
- ❌ Svealand-exports (stor datamängd, inte inkluderad i golden-set)
- ❌ Test-exports från `exports/golden_test/` (tillfälliga, genereras vid testkörning)

**Golden = endast de 3 filerna i `golden/print_export/`**

## Hur man kör golden-check lokalt

### Förutsättningar

1. Starta nödvändiga tjänster:
```bash
docker compose up -d demo-a-exporter demo-a-web demo-a-tileserver demo-a-hillshade-server
```

2. Vänta tills tjänsterna är redo (kontrollera med `docker compose ps`)

### Kör regressionstest

```bash
node scripts/qa_golden_print_export.js
```

### Exit codes

- **0** = Alla tester PASSADE (alla exports matchar golden baselines)
- **1** = Minst ett test FAILADE (export skiljer sig från golden)

### Output

Scriptet genererar:
- Test-exports i `exports/golden_test/` (för visuell jämförelse)
- Console-output med detaljerad status per golden
- Diff-info filer om testet failar

**Exempel på lyckad körning:**
```
========================================
Golden Print Export Regression Test
========================================
Exporter: http://localhost:8082
Golden dir: golden/print_export
Output dir: exports/golden_test

Loaded 3 golden baselines

  Testing: A3_Blueprint_v1_Classic
  Dimensions: 2480x1754 ✓
  SHA256: 48e4bbd0f787...
  Hash match: identical to golden ✓

  Testing: A2_Paper_v1_Minimal
  Dimensions: 3508x2480 ✓
  SHA256: ef0c5bb30a2b...
  Hash match: identical to golden ✓

  Testing: A1_Terrain_v1_Bold
  Dimensions: 3508x4967 ✓
  SHA256: 4df10114b61b...
  Hash match: identical to golden ✓

========================================
Summary
========================================
✓ A3_Blueprint_v1_Classic: PASSED
✓ A2_Paper_v1_Minimal: PASSED
✓ A1_Terrain_v1_Bold: PASSED

Total: 3 passed, 0 failed
========================================
```

## Hur man uppdaterar goldens (policy)

**VARNING:** Uppdatera goldens ENDAST om du gör medvetna ändringar i rendering/export som ska vara permanenta.

### Process

1. **Verifiera att ändringen är avsiktlig**
   - Ändring i layout-template?
   - Ändring i font/storlek på kompositionselement?
   - Ändring i frame-stil?

2. **Regenerera exports med samma parametrar**
   - Se `golden/print_export/metadata.json` för exakta parametrar
   - Kör exporter med exakt samma inställningar som golden

3. **Uppdatera metadata.json**
   - Uppdatera SHA256-hashar
   - Verifiera dimensioner (måste matcha exakt)

4. **Commit med tydligt meddelande**
   ```bash
   git commit -m "chore(golden): update baselines after [beskriv ändring]"
   ```

### När INTE uppdatera

- ❌ Om testet failar p.g.a. bugg (fixa buggen istället)
- ❌ Om testet failar p.g.a. GPU-variationer (acceptera liten diff inom threshold)
- ❌ Om testet failar p.g.a. tillfälliga problem (felsök istället)

**Acceptance threshold:** 0.1% pixel diff (anti-aliasing tolerance). Om diff är större än detta, undersök orsaken innan du uppdaterar.

## Relaterade dokument

- **Script:** `scripts/qa_golden_print_export.js` - Regressionstest-script
- **Golden README:** `golden/print_export/README.md` - Teknisk dokumentation
- **Implementation log:** `docs/QA_PRINT_EXPORT_GOLDEN.md` - Teknisk implementation-historik
- **Systemstatus:** `docs/STATUS.md` - Översikt över systemstatus
- **Användarguide:** `docs/USAGE.md` - Allmän användarguide

## Snabbreferens

```bash
# Kör golden-check
docker compose up -d demo-a-exporter demo-a-web
node scripts/qa_golden_print_export.js

# Kontrollera exit code
echo $?  # 0 = pass, 1 = fail

# Visa golden metadata
cat golden/print_export/metadata.json
```

---

**Senast uppdaterad:** 2025-12-27  
**Underhållare:** Se `docs/STATUS.md` för aktuell status

