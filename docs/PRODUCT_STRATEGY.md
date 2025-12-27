# Produktstrategi: Beslutsunderlag

**Datum**: 2025-12-27
**Version**: 1.0
**Status**: UTKAST FÖR BESLUT

---

## Executive Summary

Systemet är tekniskt färdigt för produktifiering. Med 33 teman, 24+ export presets, 15 layout designs, verifierad reproducerbarhet och full täckning för Svealand/Stockholm finns en solid grund för kommersialisering.

**Rekommendation**: Lansera tre tydligt differentierade produktpaket med progressiv värdeökning. Fokusera initialt på Stockholm/Svealand-regionen. Håll experimentella funktioner (Effect Pipeline, 3D) i separat "Labs"-miljö.

**Kritiska beslutspunkter:**
1. Geografisk begränsning per paket (region-lock vs. pay-per-region)
2. DPI-tak för lägre paket (kvalitetsskydd)
3. Preset-låsning vs. full customization
4. Export format-begränsningar (PNG-only vs. PDF/SVG)

---

## 1. Produktpaket

### 1.1 EXPLORER (Konsument)

**Målgrupp**: Privatpersoner, hobbyister, first-time buyers, gåvoköpare

**Primärt värdeerbjudande**: "Din plats, förevigad" — Personliga kartor för hemmet med minimal ansträngning.

**Typiska use cases**:
- Karta över barndomshem/stugan
- Bröllopspresent (plats för ceremoni/fest)
- Inramad poster för vardagsrummet
- "Vår första lägenhet"-minne

**Vad användaren får**:
| Kapacitet | Specifikation |
|-----------|---------------|
| Regioner | Stockholm Core, Stockholm Wide |
| Themes | 12 st (paper, ink, mono, gallery, warm-paper, sepia, mint, scandi-minimal, japandi, night, vintage, charcoal) |
| Layouts | 5 st (Classic, Minimal, Modern, Elegant, Gallery Print) |
| Export format | PNG only |
| Max DPI | 150 |
| Pappersstorlekar | A4, A3 |
| Lager-kontroll | Nej (preset-styrt) |
| Custom bbox | Begränsat (förinställda zoner) |
| Titel/undertitel | Ja |
| Skala/attribution | Auto (ej valbar) |

**Vad användaren INTE får**:
- PDF/SVG-export (inga vektorfiler)
- DPI över 150 (kvalitetsbegränsning för tryckbutiker)
- Svealand eller större regioner
- Metalliska teman (gold-foil, silver-foil, copper)
- Avancerade layouts (Blueprint, Cyberpunk, Prestige, Heritage)
- Effect Pipeline (Risograph etc.)
- Full layer-kontroll
- Custom coordinates (fri bbox-ritning)

---

### 1.2 CREATOR (Prosument)

**Målgrupp**: Designers, arkitekter, fastighetsfolk, marknadsförare, Etsy-säljare, småföretagare

**Primärt värdeerbjudande**: "Professionella kartor, dina regler" — Full kreativ kontroll för kommersiellt bruk.

**Typiska use cases**:
- Fastighetsmäklare: Områdeskartor för prospekt
- Arkitekter: Platsanalyser och kontextkartor
- Eventföretag: Custom kartor för bröllop/konferenser
- Print-on-demand-säljare: Unika produkter
- Inredningsbutiker: Lokala kartor för försäljning

**Vad användaren får**:
| Kapacitet | Specifikation |
|-----------|---------------|
| Regioner | Stockholm Core, Stockholm Wide, Svealand |
| Themes | 28 st (alla utom premium-metalliska och experimentella) |
| Layouts | 12 st (alla utom Prestige, Heritage, Cyberpunk) |
| Export format | PNG, PDF |
| Max DPI | 300 |
| Pappersstorlekar | A4, A3, A2 |
| Lager-kontroll | Ja (6 lager) |
| Custom bbox | Ja (fri ritning inom region) |
| Titel/undertitel | Ja (full kontroll) |
| Skala/attribution | Valbart (on/off) |
| Kommersiell licens | Inkluderad (begränsad upplaga) |

**Vad användaren INTE får**:
- SVG-export (vektorfiler för vidare redigering)
- DPI över 300
- A1/A0-storlekar
- Metalliska premium-teman (gold-foil, silver-foil, copper)
- Premium-layouts (Prestige, Heritage)
- Experimentella teman (cyberpunk, glitch, vaporwave)
- Effect Pipeline
- Obegränsad kommersiell licens
- Götaland/Norrland (framtida regioner)
- API-åtkomst

---

### 1.3 PROFESSIONAL (Företag/Byrå)

**Målgrupp**: Arkitektbyråer, stadsplanerare, kartografiska tjänsteföretag, bokförlag, kulturinstitutioner

**Primärt värdeerbjudande**: "Kartografisk excellens, full kontroll" — Produktionskvalitet med reproducerbarhet och arkivbeständighet.

**Typiska use cases**:
- Bokförlag: Kartor för guideböcker, historieverk
- Museer: Utställningskartor i storformat
- Stadsbyggnadskontor: Analyser och presentationer
- Kartografiska konsulter: White-label-tjänster
- Print studios: Fine art prints för gallerier

**Vad användaren får**:
| Kapacitet | Specifikation |
|-----------|---------------|
| Regioner | Alla tillgängliga (inkl. framtida) |
| Themes | Alla 33+ (inkl. premium och experimentella) |
| Layouts | Alla 15 (inkl. Prestige, Heritage, Cyberpunk) |
| Export format | PNG, PDF, SVG |
| Max DPI | 600 |
| Pappersstorlekar | A4, A3, A2, A1, A0 |
| Lager-kontroll | Ja (full) |
| Custom bbox | Ja (obegränsad) |
| Titel/undertitel | Ja (full kontroll) |
| Skala/attribution | Valbart |
| Effect Pipeline | Ja (Risograph etc.) |
| Reproducerbarhet | Garanterad (SHA256-verifiering) |
| Kommersiell licens | Obegränsad |
| API-åtkomst | Ja (batch-export) |
| Prioriterad support | Ja |

**Vad användaren INTE får**:
- Sourcekodsåtkomst
- White-label-rätt (varumärket måste nämnas)
- Obegränsade API-anrop (fair use-policy)
- Offline-rendering (alltid molnbaserat)

---

## 2. Feature- & Preset-mappning

### 2.1 Theme-distribution per paket

| Theme | EXPLORER | CREATOR | PROFESSIONAL |
|-------|----------|---------|--------------|
| **Grundteman** | | | |
| paper | ✅ | ✅ | ✅ |
| ink | ✅ | ✅ | ✅ |
| mono | ✅ | ✅ | ✅ |
| gallery | ✅ | ✅ | ✅ |
| warm-paper | ✅ | ✅ | ✅ |
| charcoal | ✅ | ✅ | ✅ |
| dark | ❌ | ✅ | ✅ |
| blueprint-muted | ❌ | ✅ | ✅ |
| muted-pastel | ❌ | ✅ | ✅ |
| void | ❌ | ✅ | ✅ |
| **Interior-inspirerade** | | | |
| japandi | ✅ | ✅ | ✅ |
| scandi-minimal | ✅ | ✅ | ✅ |
| mint | ✅ | ✅ | ✅ |
| sepia | ✅ | ✅ | ✅ |
| duotone | ❌ | ✅ | ✅ |
| **Expressiva** | | | |
| arctic | ❌ | ✅ | ✅ |
| sunset | ❌ | ✅ | ✅ |
| lavender | ❌ | ✅ | ✅ |
| swiss | ❌ | ✅ | ✅ |
| vintage | ✅ | ✅ | ✅ |
| night | ✅ | ✅ | ✅ |
| **Avancerade** | | | |
| neon | ❌ | ✅ | ✅ |
| bauhaus | ❌ | ✅ | ✅ |
| art-deco | ❌ | ✅ | ✅ |
| forest | ❌ | ✅ | ✅ |
| ocean | ❌ | ✅ | ✅ |
| thermal | ❌ | ✅ | ✅ |
| chalk | ❌ | ✅ | ✅ |
| high-contrast | ❌ | ✅ | ✅ |
| **Premium metalliska** | | | |
| gold-foil | ❌ 🔒 | ❌ 🔒 | ✅ |
| silver-foil | ❌ 🔒 | ❌ 🔒 | ✅ |
| copper | ❌ 🔒 | ❌ 🔒 | ✅ |
| **Experimentella** | | | |
| cyberpunk | ❌ | ❌ | ✅ 🧪 |
| vaporwave | ❌ | ❌ | ✅ 🧪 |
| glitch | ❌ | ❌ | ✅ 🧪 |
| woodblock | ❌ | ❌ | ✅ 🧪 |
| pencil-sketch | ❌ | ❌ | ✅ 🧪 |
| riso-red-cyan | ❌ | ❌ | ✅ 🧪 |

**Förklaring**:
✅ = Inkluderad
❌ = Ej tillgänglig
🔒 = Låst (premium)
🧪 = Experimentell (Labs)

---

### 2.2 Layout-distribution per paket

| Layout | EXPLORER | CREATOR | PROFESSIONAL |
|--------|----------|---------|--------------|
| Classic | ✅ | ✅ | ✅ |
| Modern | ✅ | ✅ | ✅ |
| Minimal | ✅ | ✅ | ✅ |
| Elegant | ✅ | ✅ | ✅ |
| Bold | ❌ | ✅ | ✅ |
| Gallery Print | ✅ | ✅ | ✅ |
| Scientific | ❌ | ✅ | ✅ |
| Blueprint | ❌ | ✅ | ✅ |
| Vintage Map | ❌ | ✅ | ✅ |
| Artistic | ❌ | ✅ | ✅ |
| Night Mode | ❌ | ✅ | ✅ |
| Minimalist | ❌ | ✅ | ✅ |
| Heritage | ❌ | ❌ 🔒 | ✅ |
| Prestige | ❌ | ❌ 🔒 | ✅ |
| Cyberpunk | ❌ | ❌ | ✅ 🧪 |

---

### 2.3 Export Presets — Synlighet per paket

| Preset | Beskrivning | EXPLORER | CREATOR | PROFESSIONAL |
|--------|-------------|----------|---------|--------------|
| A4_Quick_v1 | Snabbutskrift | ✅ | ✅ | ✅ |
| A3_Sepia_Classic | Klassisk sepia | ✅ | ✅ | ✅ |
| A4_Mint_Fresh | Modern mint | ✅ | ✅ | ✅ |
| A2_Paper_v1 | Klassisk väggkarta | ❌ | ✅ | ✅ |
| A2_Japandi | Serene minimalism | ❌ | ✅ | ✅ |
| A2_Scandi_Minimal | Skandinavisk ljus | ❌ | ✅ | ✅ |
| A3_Blueprint_v1 | Teknisk ritning | ❌ | ✅ | ✅ |
| A2_Neon_Synthwave | Synthwave poster | ❌ | ✅ | ✅ |
| A3_Vintage_USGS | Klassisk topografisk | ❌ | ✅ | ✅ |
| A1_Terrain_v1 | Stor terrängkarta | ❌ | ❌ | ✅ |
| A2_Gold_Foil | Premium guld | ❌ | ❌ | ✅ 🔒 |
| A2_Silver_Foil | Premium silver | ❌ | ❌ | ✅ 🔒 |
| A3_Copper | Premium koppar | ❌ | ❌ | ✅ 🔒 |
| A2_Cyberpunk | Futuristisk neon | ❌ | ❌ | ✅ 🧪 |
| A2_Riso_RedCyan | Risograph effect | ❌ | ❌ | ✅ 🧪 |

---

## 3. Låsningar & Guardrails

### 3.1 Hårda begränsningar per paket

| Begränsning | EXPLORER | CREATOR | PROFESSIONAL |
|-------------|----------|---------|--------------|
| Max DPI | 150 | 300 | 600 |
| Max pappersstorlek | A3 | A2 | A0 |
| PNG export | ✅ | ✅ | ✅ |
| PDF export | ❌ | ✅ | ✅ |
| SVG export | ❌ | ❌ | ✅ |
| Layer toggles | ❌ | ✅ | ✅ |
| Custom bbox | Begränsad | ✅ | ✅ |
| Effect Pipeline | ❌ | ❌ | ✅ |
| API access | ❌ | ❌ | ✅ |

### 3.2 Regionbegränsningar

| Region | EXPLORER | CREATOR | PROFESSIONAL |
|--------|----------|---------|--------------|
| stockholm_core | ✅ | ✅ | ✅ |
| stockholm_wide | ✅ | ✅ | ✅ |
| svealand | ❌ | ✅ | ✅ |
| götaland (framtida) | ❌ | ❌* | ✅ |
| norrland_syd (framtida) | ❌ | ❌* | ✅ |
| norrland_nord (framtida) | ❌ | ❌* | ✅ |

*CREATOR kan få tillgång till nya regioner som tilläggsköp.

### 3.3 Kombinationer som ALDRIG tillåts

Dessa kombinationer är låsta oavsett paket för att skydda varumärke och kvalitet:

| Kombination | Anledning |
|-------------|-----------|
| DPI > 150 + A0 + PNG | Filstorlek > 500 MB, opraktisk |
| Metalliska teman + låg DPI (< 200) | Visuell kvalitet komprometteras |
| Effect Pipeline + PDF export | Rastereffekter passar ej vektorformat |
| Custom bbox < 500m + A0 | Extremt detaljerad, överbelastning |
| Glitch/Cyberpunk + Heritage/Prestige layout | Estetisk inkompatibilitet |
| SVG + Risograph effect | Effekter är pixelbaserade |

### 3.4 Kvalitets- och varumärkesskydd

1. **Attribution obligatorisk i EXPLORER**: Alla exports inkluderar diskret "Made with [Produktnamn]" i nederkant.
2. **Reproducerbarhet-garanti endast PROFESSIONAL**: SHA256-verifiering för arkivändamål.
3. **Watermark vid preview** (alla paket): Låg-opacity watermark tas bort vid export.
4. **Rate limiting på export**: Max 10/dag (EXPLORER), 50/dag (CREATOR), obegränsad (PROFESSIONAL).
5. **Format-validering**: Server avvisar ogiltiga kombinationer före rendering.

---

## 4. Prissättningslogik

### 4.1 Relativ prisnivå

| Paket | Prisposition | Modell |
|-------|--------------|--------|
| EXPLORER | Låg (1×) | Per export eller månadsprenumeration |
| CREATOR | Medium (4-5×) | Månads-/årsprenumeration |
| PROFESSIONAL | Hög (15-20×) | Årslicens eller enterprise-avtal |

### 4.2 Vad driver betalningsvilja

| Paket | Primär värdedrivare | Sekundär |
|-------|---------------------|----------|
| EXPLORER | Emotionellt värde ("min plats") | Enkelhet, snabbhet |
| CREATOR | Kommersiell användning, flexibilitet | Kvalitetsnivå (300 DPI), PDF |
| PROFESSIONAL | Reproducerbarhet, storformat, exklusivitet | API, support, framtida regioner |

### 4.3 Uppgraderingsvägar

```
EXPLORER ────────────────────────────────────────────┐
    │                                                │
    │  "Behöver högre DPI"                          │
    │  "Vill sälja prints"                          │
    │  "Behöver PDF"                                │
    ▼                                                │
CREATOR ─────────────────────────────────────────────┤
    │                                                │
    │  "Behöver A1/A0"                              │
    │  "Vill ha premium-teman"                      │
    │  "Kräver reproducerbarhet"                    │
    │  "API-integration"                            │
    ▼                                                │
PROFESSIONAL ◄───────────────────────────────────────┘
```

### 4.4 Add-ons (alla paket)

| Add-on | Tillgänglig för | Beskrivning |
|--------|-----------------|-------------|
| Extra region (pay-per-region) | CREATOR | Götaland, Norrland som engångsköp |
| High-DPI boost | EXPLORER | Engångsköp för 300 DPI på en export |
| Premium theme pack | CREATOR | Gold/Silver/Copper-teman |
| Commercial license upgrade | EXPLORER → CREATOR | Omedelbar uppgradering |

---

## 5. Strategiska rekommendationer

### 5.1 Vad som INTE bör byggas eller exponeras

| Funktion | Status | Rekommendation |
|----------|--------|----------------|
| 3D/Isometric view | Dokumenterad | **Håll i research** — hög komplexitet, låg betalningsvilja |
| STL-export (3D-print) | Dokumenterad | **Håll i research** — nischmarknad |
| GPX-overlay (personliga rutter) | Dokumenterad | **Prioritera lågt** — kräver filuppladdning, säkerhetsrisk |
| Bathymetric (djupdata) | Dokumenterad | **Bygg ej nu** — kräver extern datakälla, begränsad efterfrågan |
| ASCII Art theme | Dokumenterad | **Bygg ej** — novelty utan kommersiellt värde |
| Seasonal themes (vår/sommar/höst/vinter) | Dokumenterad | **Bygg senare** — nice-to-have, ej core |
| User-editable themes | Out of scope | **Bygg ej** — kvalitetskontroll omöjlig |

### 5.2 Vad som är redo att marknadsföras NU

| Funktion | Mognadsgrad | Marknadsföringsvinkel |
|----------|-------------|----------------------|
| 33 teman | ✅ Production | "33 unika stilar, från minimalistiskt till metalliskt" |
| 15 layouts | ✅ Production | "Professionella layout-mallar för varje tillfälle" |
| Stockholm/Svealand täckning | ✅ Production | "Hela Svealand, varje gata och höjdkurva" |
| Print Editor (bbox, preview) | ✅ Production | "Rita din egen karta, se resultatet direkt" |
| PDF-export | ✅ Production | "Tryckredo PDF för professionellt bruk" |
| Reproducerbarhet | ✅ Production | "Identiska resultat, varje gång" (PROFESSIONAL) |
| Tvåspråkig editor | ✅ Production | "Svenska & engelska" |

### 5.3 Vad som bör ligga i "Labs / Experimental"

| Funktion | Nuvarande status | Labs-strategi |
|----------|------------------|---------------|
| Effect Pipeline (Risograph) | ✅ Implementerad | **Labs** — märk som "Beta", samla feedback |
| Cyberpunk/Glitch/Vaporwave | ✅ Implementerade | **Labs** — smala målgrupper, håll separat |
| Woodblock/Pencil Sketch | ✅ Implementerade | **Labs** — konstnärliga stilar, experimentella |
| SVG-export | ✅ Implementerad | **Labs** för CREATOR-test innan PROFESSIONAL-only |
| Götaland/Norrland-regioner | ⬜ Planerade | **Labs** — tidigt access för PROFESSIONAL |

### 5.4 Go-to-Market-prioritering

**Fas 1: MVP Launch (Omedelbart)**
1. Lansera EXPLORER + CREATOR med Stockholm-fokus
2. 12 teman + 5 layouts för EXPLORER
3. PNG/PDF-export
4. Marknadsför "personlig karta som present"

**Fas 2: Premium Expansion (3-6 månader)**
1. Lansera PROFESSIONAL
2. Aktivera metalliska teman (gold/silver/copper)
3. SVG-export
4. API för batch-export
5. Götaland-region

**Fas 3: Scale (6-12 månader)**
1. Norrland-täckning
2. Effect Pipeline → Production
3. Partner-integrationer (print-on-demand)
4. White-label-erbjudande för enterprise

---

## 6. Risker och mitigationer

| Risk | Sannolikhet | Konsekvens | Mitigation |
|------|-------------|------------|------------|
| Kvalitetsproblem vid hög DPI + stora format | Medel | Hög | Server-side validering, testade presets |
| Missbruk av kommersiell licens (EXPLORER) | Hög | Medel | Watermark + attribution, rate limiting |
| Konkurrens från gratis-verktyg | Medel | Medel | Fokus på kvalitet + reproducerbarhet |
| Regionexpansion försenad | Medel | Medel | Tydlig kommunikation, roadmap publik |
| Effect Pipeline-buggar (nya effekter) | Låg | Hög | Labs-strategi, tydlig beta-märkning |

---

## Appendix A: Komplett Theme-lista

<details>
<summary>Klicka för att expandera (33 teman)</summary>

| # | Theme ID | Kategori | Visuell beskrivning |
|---|----------|----------|---------------------|
| 1 | paper | Grund | Klassisk papperskarta, neutral |
| 2 | ink | Grund | Svart bläck på vitt |
| 3 | mono | Grund | Svartvit, hög kontrast |
| 4 | dark | Grund | Mörk bakgrund, ljusa linjer |
| 5 | gallery | Grund | Mjuk, gallerivänlig |
| 6 | charcoal | Grund | Kol på papper |
| 7 | warm-paper | Grund | Varm papperston |
| 8 | blueprint-muted | Grund | Dämpat blåtryck |
| 9 | muted-pastel | Grund | Dämpad pastellpalett |
| 10 | void | Avancerad | Djup svart, minimala linjer |
| 11 | japandi | Interior | Japansk-skandinavisk fusion |
| 12 | scandi-minimal | Interior | Ljus skandinavisk |
| 13 | mint | Interior | Fräsch mintgrön |
| 14 | sepia | Interior | Åldrat foto |
| 15 | duotone | Interior | Tvåfärgs grafik |
| 16 | arctic | Expressiv | Glaciala blåtoner |
| 17 | sunset | Expressiv | Varma solnedgångstoner |
| 18 | lavender | Expressiv | Lugn lavendel |
| 19 | swiss | Expressiv | Modernistisk svart/vit/röd |
| 20 | vintage | Expressiv | Klassisk USGS-stil |
| 21 | night | Expressiv | Mörkt läge |
| 22 | neon | Avancerad | Neon på mörkt |
| 23 | bauhaus | Avancerad | Primärfärger, geometriskt |
| 24 | art-deco | Avancerad | 1920-tals elegans |
| 25 | forest | Avancerad | Höstens jordtoner |
| 26 | ocean | Avancerad | Marina blåtoner |
| 27 | thermal | Avancerad | Värmekamera |
| 28 | chalk | Avancerad | Krita på tavla |
| 29 | high-contrast | Avancerad | Tillgänglighet |
| 30 | gold-foil | Premium | Guldfolie |
| 31 | silver-foil | Premium | Silverfolie |
| 32 | copper | Premium | Koppar/brons |
| 33 | cyberpunk | Experimentell | Neon dystopia |
| 34 | vaporwave | Experimentell | 80-tals retrofuturism |
| 35 | glitch | Experimentell | Digital korruption |
| 36 | woodblock | Experimentell | Träsnitt |
| 37 | pencil-sketch | Experimentell | Blyertsskiss |
| 38 | riso-red-cyan | Experimentell | Risograph-effekt |

</details>

---

## Appendix B: Beslutspunkter för ledning

| # | Beslut | Alternativ | Rekommendation |
|---|--------|------------|----------------|
| 1 | Geografisk modell | Region-lock vs. pay-per-region | **Region-lock** för enkla paket, add-on för nya |
| 2 | Attribution | Obligatorisk vs. valbar | **Obligatorisk EXPLORER**, valbar CREATOR+ |
| 3 | DPI-begränsning | Hårt tak vs. mjuk varning | **Hårt tak** — skyddar kvalitet |
| 4 | Experimentella teman | Dölj helt vs. Labs-åtkomst | **Labs** för PROFESSIONAL |
| 5 | Kommersiell licens | Inkluderad vs. separat | **Inkluderad CREATOR** (med begränsning) |

---

*Dokumentet genererat: 2025-12-27*
*Baserat på: ROADMAP.md, STATUS.md (samma datum)*
