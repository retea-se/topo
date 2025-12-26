# Roadmap: Nästa steg

## Current State

Systemet består av två fungerande demos med komplett exportfunktionalitet:

**Demo A (MapLibre)**

- Web-baserad karta med headless export
- Stödjer hillshade, contours och OSM-lager
- Export fungerar (A2 @ 150 DPI)
- Plats för interaktivitet och framtida perspektiv (pitch)

**Demo B (Mapnik)**

- Print-renderer med 2D top-down endast
- Export fungerar (A2 @ 150 DPI)
- Kartografiskt korrekt och stabil

**Gemensamt**

- Tiles, OSM, DEM, contours och hillshade är implementerade och fungerar
- Alla kritiska buggar är lösta och committade
- Exportfunktionalitet är verifierad och stabil
- Om flera datakällor finns närvarande (OSM, DEM-derived, raster), tar vector-lager prioritet för layout och attribution

---

## Recommended Usage

**Demo A (MapLibre)**

- Interaktiv preview och kreativ utforskning
- Pitch/export-test för konstnärliga visualiseringar
- Snabb iteration och experiment med olika vyer
- Används för att utforska och validera koncept innan final export

**Demo B (Mapnik)**

- Final print master för professionell användning
- Kartografisk korrekthet och precision
- Arkivkvalitet och reproduktionsstabilitet
- Används för slutgiltiga exports som ska tryckas eller arkiveras

**Kompletterande roller:**

- Demo A och Demo B är inte designade för att vara visuellt identiska
- De kompletterar varandra genom att tjäna olika användningsfall
- Demo A fokuserar på interaktivitet och kreativitet
- Demo B fokuserar på kartografisk korrekthet och print-kvalitet

---

## Phase 7 – UI Layer Controls

**Mål:** Implementera layer visibility-kontroller i användargränssnittet.

**Funktionalitet:**

- Layer toggles i UI för:
  - Roads
  - Water
  - Buildings
  - Contours
  - Hillshade

**Krav:**

- Samma logik i Demo A och Demo B (så långt det går)
- Ingen stylingändring i detta steg – endast visibility
- UI-kontroller ska vara konsekventa mellan demos

**Scope-förtydligande:**

- Layer toggles styr initialt endast visibility (synlighet)
- Layer order (z-index) hanteras centralt av export/layout-systemet
- Attribution hanteras centralt av export/layout-systemet
- Syftet är att undvika missförstånd om vad layer toggles kontrollerar

**Tekniska överväganden:**

- Kontroller ska vara synkroniserade med exportfunktionaliteten
- State management för layer visibility

---

## Phase 8 – Print Composition System

**Mål:** Implementera ett print-composition-lager ovanpå kartan.

**Komponenter:**

- Ram (valbar, tema-styrd)
- Titel
- Undertitel / plats
- Skala (endast när pitch = 0)
- Attribution (OSM, Copernicus m.fl.)

**Designprinciper:**

- Export-first approach
- Samma composition i Demo A och Demo B
- Composition ska vara tema-kompatibel
- Skalvisning ska hantera pitch-konditioner korrekt

**Print-design readiness:**

- Safe margins / inner frame för att skydda text vid print
- Skillnad mellan content area och bleed (bleed implementeras inte direkt, men design ska vara redo)
- Composition ska ta hänsyn till print-safe zones för professionell output

**Tekniska överväganden:**

- Composition-positionering ska vara konfigurerbar
- Tema-styrning för ram och typografi
- Attribution ska vara dynamisk baserat på aktiva lager

---

## Phase 9 – Preset Export System

**Mål:** Fördefinierade exportpresets för vanliga användningsfall.

**Presets (exempel):**

- `A2_gallery_v1`
- `A3_blueprint_v1`
- `A2_paper_v1`

**Varje preset definierar:**

- Theme
- Format
- DPI
- Dimensioner
- Layer-visibility
- (För Demo A) pitch/bearing om tillämpligt

**Funktionalitet:**

- Presets ska vara enkelt valbara i UI
- Presets ska vara konfigurerbara via konfigurationsfiler
- Export ska respektera alla preset-inställningar

**Reproducerbarhet:**

- Presets ska vara versionsbara (t.ex. `_v1`, `_v2`)
- Reproducerbara över tid: samma input → samma output
- Versionering möjliggör framtida uppdateringar utan att bryta befintliga exports

---

## Perspective / Pitch – Arkitekturbeslut

**Beslut dokumenterat:**

1. **Endast Demo A kan ha pitch (MapLibre)**

   - Demo B är alltid top-down (2D endast)
   - Mapnik-renderern stödjer inte perspektiv

2. **Skalhantering vid pitch ≠ 0:**

   - Skala ska döljas eller märkas "Not to scale"
   - Skalvisning är endast meningsfull vid top-down vy

3. **Användningsområden för perspektiv:**

   - Previews i web-gränssnittet
   - Konstnärliga exports
   - Interaktiva visualiseringar

4. **Tekniska begränsningar:**
   - Export med pitch kräver MapLibre (Demo A)
   - Kartografiskt korrekta exports kräver top-down (Demo B)

---

## Out of Scope (för nu)

Följande funktioner är explicit **inte** inkluderade i nästa faser:

- **3D-byggnader i Demo B**

  - Demo B är 2D top-down endast
  - 3D-visualisering är inte en del av Mapnik-renderern

- **Avancerad typografi**

  - Grundläggande typografi ingår i Phase 8
  - Avancerade typografiska funktioner är framtida arbete

- **Interaktiv annotation**

  - Annotation-tools är inte en del av nästa faser
  - Fokus ligger på export och composition

- **User-editable themes**
  - Themes är fördefinierade och konfigurerade
  - Användarredigering av themes är framtida arbete

---

## Recommended Next Implementation Order

1. **Phase 7 – UI Layer Controls**

   - Grundläggande funktionalitet för att kontrollera layer visibility
   - Nödvändig för användarinteraktion
   - Relativt enkel implementation

2. **Phase 8 – Print Composition System**

   - Bygger på Phase 7 genom att använda layer visibility
   - Kritiskt för professionella exports
   - Ger omedelbart värde för användare

3. **Phase 9 – Preset Export System**

   - Bygger på Phase 8 genom att använda composition-systemet
   - Förenklar användarupplevelsen avsevärt
   - Konsoliderar alla tidigare faser

4. **Perspective / Pitch Implementation (Demo A)**
   - Kan implementeras parallellt med Phase 7-9
   - Kräver MapLibre-specifik utveckling
   - Ger extra värde för Demo A-användare

---

## Visual QA / Regression Checks

**Manuell QA-process:**

- Referensexporter per theme + preset för manuell jämförelse
- Visual regression checks genom jämförelse av exports över tid
- Dokumentation av förväntade resultat per preset-kombination

**Syfte:**

- Säkerställa visuell konsistens vid ändringar
- Identifiera oavsiktliga visuella regressioner
- Ge referensmaterial för framtida utveckling

**Styling Stability:**

- Vissa parametrar ska inte ändras lättvindigt utan dokumentation
- Exempel: hillshade azimuth, contour intervals, layer z-index-ordning
- Ändringar av dessa parametrar påverkar alla exports och bör göras medvetet

**Notera:** Detta är dokumentation av QA-process, inte automation. Automatiserade visual regression tests är framtida arbete.

---

_Dokument skapat: 2024-12-26_
_Status: Alla kritiska buggar lösta, system redo för nästa utvecklingsfas_
