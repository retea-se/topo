# Label Profiles - Editor Integration Plan

**Senast uppdaterad**: 2025-12-27 (Phase 14 implementation)

---

## A) Bakgrund & Mal

### Phase 14: Kontrollerade Label- och POI-profiler

**Syfte**: Ge anvandare mojlighet att valja hur labels (gatunamn, platsnamn, POI) ska visas pa kartan, med fokus pa:

1. **Default labels off** - Ren kartbild som standard (wall-art, print-first)
2. **2-3 kuraterade profiler** - Inte fri label-toggle, utan fordefinierade kombinationer
3. **Determinism** - Export/preview-paritet (samma indata ger exakt samma output)
4. **Tema-integration** - Typografi ska folja tema-designen

### Profiler

| Profil | Beskrivning | Anvandningsomrade |
|--------|-------------|-------------------|
| `off` | Inga labels visas | Wall-art, overlay, manuell text |
| `minimal` | Storre vagar med diskret typografi | Navigation utan brus |
| `landmarks` | Platsnamn, vatten, parker (ej gator) | Orientering, geografiskt fokus |

---

## B) Arkitektur i Repo

### Filstruktur

```
demo-a/web/
  public/
    label-profiles/
      labelProfiles.js          # Huvudmodul (all logik)
      test-label-profiles.html  # Visuell QA-sida
      README.md                 # API-dokumentation
  src/
    themeToStyle.js             # Genererar MapLibre style med label-layers
```

### labelProfiles.js - Karnmodul

#### Exporterade funktioner

| Funktion | Syfte |
|----------|-------|
| `LABEL_PROFILES` | Konstant med profildefinitioner |
| `TYPOGRAPHY_PRESETS` | Typografi-tokens (subtle/crisp/classic) |
| `classifySymbolLayer(layer)` | Klassificerar layer -> kategori |
| `inventorySymbolLayers(map)` | Inventerar alla symbol-layers |
| `applyLabelProfile(map, profile, options?)` | Applicerar profil pa karta |
| `setupStyleReloadHandler(map, fn)` | Hanterar style reload |
| `diagnosticLandmarks(map)` | Diagnosverktyg for landmark-data |

#### Klassificeringslogik

Prioritetsordning:
1. **source-layer** (hogst prioritet): `transportation_name` -> street, `place` -> place, etc.
2. **layer-id patterns** (fallback): Matchning mot id-namn

### test-label-profiles.html - Visuell QA

Testsidan erbjuder:
- Profilvaljare (Off/Minimal/Landmarks)
- Typografi-preset valjare (Subtle/Crisp/Classic)
- Symbol layers inventory med kategorisering
- Applicerade andringar per layer
- Landmarks diagnostik

**URL**: `http://localhost:3000/label-profiles/test-label-profiles.html`

---

## C) Integration i Editor(er)

### Niva 1: Snabb Integration (Editor Sidebar)

**Implementationssteg**:

1. **UI-selector i sidebar**
   ```html
   <select id="label-profile-select">
     <option value="off">Labels: Off</option>
     <option value="minimal">Labels: Minimal Streets</option>
     <option value="landmarks">Labels: Landmarks</option>
   </select>
   ```

2. **Koppling till applyLabelProfile**
   ```javascript
   document.getElementById('label-profile-select').addEventListener('change', (e) => {
     window.LabelProfiles.applyLabelProfile(map, e.target.value);
     editorState.labelProfile = e.target.value;
   });
   ```

3. **Persistens**
   - URL-param: `?labelProfile=minimal`
   - Eller localStorage: `localStorage.setItem('labelProfile', profile)`

4. **Style reload-hantering**
   ```javascript
   window.LabelProfiles.setupStyleReloadHandler(map, () => editorState.labelProfile);
   ```

### Niva 2: Export/Preset-integrerad

**Pipeline: Theme -> Style -> Render**

```
+------------+     +-----------------+     +-------------+     +--------+
| Theme JSON | --> | themeToStyle.js | --> | MapLibre    | --> | Export |
| + preset   |     | + labelProfile  |     | Style       |     | PNG/PDF|
+------------+     +-----------------+     +-------------+     +--------+
```

**Export Preset JSON-tillagg**:
```json
{
  "id": "stockholm_a4_landscape",
  "theme": "paper",
  "bbox_preset": "stockholm_core",
  "render": { "dpi": 300, "format": "png" },
  "labelProfile": "minimal",
  "labelTypography": {
    "mode": "theme"
  }
}
```

**Implementationspunkter**:

1. **themeToStyle.js**: Ta emot `labelProfile` som parameter
   ```javascript
   function themeToMapLibreStyle(theme, ..., labelProfile = 'off') {
     // Generera layers med ratt initial visibility
   }
   ```

2. **Exporter (Puppeteer/Playwright)**: Injicera labelProfile i render-context
   ```javascript
   await page.evaluate((profile) => {
     window.LabelProfiles.applyLabelProfile(map, profile);
   }, exportConfig.labelProfile);
   ```

3. **Validering**: Lagg till labelProfile i preset-validering
   ```javascript
   const VALID_PROFILES = ['off', 'minimal', 'landmarks'];
   if (!VALID_PROFILES.includes(config.labelProfile)) {
     throw new Error('Invalid label profile');
   }
   ```

---

## D) Typografi: Strategi for Diskret Men Lasbar Text

### Varfor Labels Kan Se Otydliga Ut

| Problem | Orsak | Losning |
|---------|-------|---------|
| Font saknas | glyphs-URL returnerar 404 | Anvand reliabel font-server (Protomaps) |
| Lag kontrast | Textfarg for lik bakgrund | Justera text-color per tema |
| For tunn halo | Text forsvinner mot brokig bakgrund | Oka text-halo-width |
| For liten text | text-size under lasbarhetsgrans | Minimum 8-9px vid screen, 10-11px vid print |
| Fel font stack | Font finns inte i glyph-server | Anvand Noto Sans (tillganglig overallt) |

### Label Typography Policy

#### Street Labels (minimal-profil)
- **Intention**: Diskreta, inte stralkastarljus
- **text-size**: 70-80% av original
- **text-color**: Dampeg (#777-#999)
- **text-halo**: Subtil (0.5-1px, vit/ljus bakgrund)
- **letter-spacing**: 0 (ej utdragen)

#### Landmark Labels (landmarks-profil)
- **Intention**: Tydligare, men fortfarande "wall-art"
- **text-size**: 100% av original
- **text-color**: Matchar tema (nagon grad morkare an standard)
- **text-halo**: Tydligare (1-1.5px)
- **letter-spacing**: 0.05em for storre text

### Tva Vagar Framat

#### 1. Tema-styrd Typografi (Rekommenderat Kortsiktigt)

Varje tema definierar `labelTypography` i sin JSON:

```json
{
  "name": "Paper",
  "background": "#faf8f5",
  "labelTypography": {
    "fontStack": ["Noto Sans Regular"],
    "street": {
      "sizeFactor": 0.75,
      "color": "#888888",
      "haloWidth": 0.5,
      "haloColor": "#ffffff"
    },
    "landmark": {
      "sizeFactor": 1.0,
      "color": "#505050",
      "haloWidth": 1.2,
      "haloColor": "#faf8f5"
    }
  }
}
```

**Fordelar**:
- Designern har full kontroll
- Typografi matchar tema-estetik
- Deterministiskt

#### 2. Anvandarstyrt med Kuraterade Presets (Framtid)

Erbjud 2-3 typografipresets istallet for fri font-picker:

| Preset | Karaktar | Street | Landmark |
|--------|----------|--------|----------|
| `subtle` | Diskret, nara osynlig | 70% size, #999 | 90% size, #666 |
| `crisp` | Tydlig, hog kontrast | 85% size, #555 | 100% size, #333 |
| `classic` | Traditionell kartestetik | 80% size, #707070 | 95% size, #404040 |

**Fordelar**:
- Anvandaren kan justera lasbarhet
- Fortfarande kuraterat och deterministiskt
- Export-sakert (presets ar fordefinierade)

---

## E) API-kontrakt

### Preset/Config JSON-format

```typescript
interface LabelConfig {
  // Vilken profil (vilka layers visas)
  labelProfile: 'off' | 'minimal' | 'landmarks';

  // Typografi-konfiguration
  labelTypography: {
    // Var hamtas typografi-tokens fran?
    mode: 'theme' | 'preset';

    // Om mode === 'preset'
    preset?: 'subtle' | 'crisp' | 'classic';

    // Framtida utvidgning (EJ implementerad nu)
    // overrides?: Partial<TypographyTokens>;
  };
}
```

### Runtime API

```javascript
// Grundlaggande
applyLabelProfile(map, 'minimal');

// Med typografi-preset
applyLabelProfile(map, 'minimal', {
  typographyPreset: 'crisp'
});

// Med tema-tokens (framtida)
applyLabelProfile(map, 'minimal', {
  typographyMode: 'theme',
  theme: themeObject
});
```

---

## F) QA & Verifiering

### Testprocedur i Chrome

1. **Starta systemet**
   ```bash
   docker compose --profile demoA up -d
   ```

2. **Oppna testsida**
   ```
   http://localhost:3000/label-profiles/test-label-profiles.html
   ```

3. **Verifiera varje profil**

   | Profil | Forvantat resultat |
   |--------|-------------------|
   | Off | Inga labels synliga |
   | Minimal | Endast gatunamn (storre vagar), diskret stil |
   | Landmarks | Plats/vatten/parknamn synliga, ej gatunamn |

4. **Verifiera typografi-presets**

   | Preset | Forvantat resultat |
   |--------|-------------------|
   | Subtle | Svag kontrast, liten text |
   | Crisp | Hog kontrast, tydlig text |
   | Classic | Mellan, traditionell kartestetik |

### Checklist for Landmarks-data

- [ ] place: Stadsdelar/orter ska synas (om zoom >= ~10)
- [ ] poi: POI:er ska synas (om zoom >= ~14)
- [ ] water: Vattennamn ska synas (om sjor/hav i viewport)
- [ ] park: Parknamn ska synas (om parker i viewport)

**Om data saknas**:
1. Zooma in/ut for att ladda tiles
2. Anvand "Kolla Data" i testsidan
3. Kontrollera att tiles har source-layers

### Golden Screenshots (Rekommendation)

Skapa referensbilder for:
1. `off-paper-z13.png` - Off-profil, Paper-tema, zoom 13
2. `minimal-paper-z13.png` - Minimal, Paper-tema, zoom 13
3. `landmarks-paper-z13.png` - Landmarks, Paper-tema, zoom 13
4. `minimal-crisp-z13.png` - Minimal + Crisp typografi
5. `minimal-subtle-z13.png` - Minimal + Subtle typografi

Lagra i `qa/golden/label-profiles/`

---

## Sammanfattning

| Omrade | Status | Nasta steg |
|--------|--------|------------|
| Profiler (off/minimal/landmarks) | Implementerat | - |
| Typography presets | Implementerat | - |
| Test-HTML | Implementerat | - |
| Editor-integration (Niva 1) | Planerat | Lagg till selector i sidebar |
| Export-integration (Niva 2) | Planerat | Utoka preset JSON-schema |
| Tema-styrd typografi | Planerat | Lagg till labelTypography i theme JSON |
| Golden screenshots | Planerat | Skapa referensbilder |

**Rekommendation**:
1. **Nu**: Anvand typography presets (subtle/crisp/classic)
2. **Snart**: Lagg till UI-selector i editor sidebar
3. **Senare**: Tema-styrd typografi for full designkontroll
