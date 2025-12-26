# TODO: Print Editor Fixes

**Created:** 2025-12-26
**Status:** IN PROGRESS
**Priority:** Critical

---

## Problem Summary

Användaren rapporterar att Print Editor (Demo A) är trasig:
1. Preview "nollställer"/reset:ar vid pan/zoom, theme-byte, preset-byte
2. Preview visar inte print layout (ram, titel, skala, attribution)
3. Export-knappen skapar ingen fil (ingen download)

---

## Root Cause Analysis

### 1. Preview Reset
- **Orsak:** `map.setStyle()` i `updateMapStyle()` (editor.js:115) nollställer center/zoom
- **Varför:** MapLibre GL resettar vyläge vid style-byte om man inte explicit bevarar det
- **Fix:** Spara `{center, zoom, bearing, pitch}` före setStyle, återställ efter `style.load`

### 2. Ingen Print Layout i Preview
- **Orsak:** CSS-klass `.paper-overlay` finns men ingen HTML-element skapas
- **Varför:** `generatePreview()` (editor.js:623) gör bara `fitMapToBbox()` utan overlay
- **Fix:** Skapa dynamisk overlay div med frame, titel, skala, attribution

### 3. Export Fungerar Inte
- **Orsak 1:** PNG-export använder `window.location.href` som navigerar bort från sidan
- **Orsak 2:** Exporter-servern använder Docker-DNS (`demo-a-web:3000`) som browser inte når
- **Orsak 3:** Nya parametrar (title, layers, custom_bbox) hanteras inte i exporter
- **Fix:** Använd fetch + blob för PNG, fixa exporter att hantera alla params

---

## Checklist

### A. Preview Stabilitet
- [ ] A1. Lägg till debug-logging i editor.js (bbox, zoom, center, events)
- [ ] A2. Spara view state (`{center, zoom, bearing, pitch}`) före `setStyle()`
- [ ] A3. Återställ view state efter `style.load` event
- [ ] A4. Lägg till `styleChangeInProgress` guard mot race conditions
- [ ] A5. Verifiera: byt theme 3x utan viewport-hopp

### B. Print Composition Overlay
- [ ] B1. Skapa `#print-composition` div dynamiskt
- [ ] B2. Lägg till frame border (mm -> px konvertering)
- [ ] B3. Lägg till titel-text (toppen)
- [ ] B4. Lägg till skala-text (botten vänster)
- [ ] B5. Lägg till attribution-text (botten höger)
- [ ] B6. Synka overlay med paper size/orientation ändringar
- [ ] B7. Verifiera: overlay syns i preview och matchar export

### C. Export Fix (PNG via Demo A Exporter)
- [ ] C1. Ändra `window.location.href` till `fetch()` + blob download
- [x] C2. Uppdatera exporter/server.js att hantera custom_bbox parameter ✅ **IMPLEMENTED** (demo-a/exporter/src/server.js:35, 89-91)
- [x] C3. Uppdatera exporter att hantera title, subtitle, attribution params ✅ **IMPLEMENTED** (demo-a/exporter/src/server.js:41-43)
- [x] C4. Uppdatera exporter att hantera layers visibility ✅ **IMPLEMENTED** (demo-a/exporter/src/server.js:44, 51-56, 94-96)
- [x] C5. Fixa CORS-headers i exporter (om nödvändigt) ✅ **IMPLEMENTED** (demo-a/exporter/src/server.js:17-25)
- [ ] C6. Spara export till /exports/ med deterministiskt filnamn
- [ ] C7. Verifiera: PNG export skapar fil och triggar download

### D. Export Fix (PDF/SVG via Demo B)
- [ ] D1. Verifiera Demo B är igång och nåbar på port 5000
- [ ] D2. Testa PDF-export endpoint
- [ ] D3. Testa SVG-export endpoint
- [ ] D4. Verifiera fil skapas och download triggas

### E. QA Automation
- [ ] E1. Uppdatera test_print_editor.spec.js med riktig export-verifiering
- [ ] E2. Lägg till test: theme-byte utan viewport-hopp
- [ ] E3. Lägg till test: layer toggle ändrar screenshot
- [ ] E4. Kör QA och spara artefakter i exports/screenshots/qa_editor_YYYYMMDD_HHMMSS/

### F. Dokumentation
- [ ] F1. Uppdatera docs/STATUS.md med Print Editor status
- [ ] F2. Uppdatera docs/USAGE.md med "Hur man använder Print Editor"
- [ ] F3. Skapa LEVERANS.md med commit-hash, tester, resultat

---

## Verification Commands

```bash
# Starta tjänster
docker-compose --profile demoA up -d

# Öppna editor
start http://localhost:3000/editor

# Kör tester
npx playwright test scripts/test_print_editor.spec.js

# Verifiera export-fil
dir exports\demo-a\
```

---

## Commits (planned)

1. `fix(editor): preserve viewport on theme change`
2. `feat(editor): add print composition overlay`
3. `fix(exporter): handle custom bbox and composition params`
4. `fix(editor): use fetch for PNG export instead of navigation`
5. `test(editor): verify real export file creation`
6. `docs: update STATUS.md and USAGE.md for Print Editor`

---

## Definition of Done

- [ ] Preview är stabil (ingen reset vid normala ändringar)
- [ ] Print composition syns alltid i preview
- [ ] Export PNG skapar faktisk fil
- [ ] Export PDF/SVG fungerar (via Demo B)
- [ ] Playwright-tester verifierar riktig funktionalitet
- [ ] Screenshots och artefakter sparade
- [ ] Dokumentation uppdaterad
