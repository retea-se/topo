# Fas 3: Advanced Themes Implementation Plan

**Status**: FAS 3A KLAR
**Datum**: 2025-12-27
**Förutsättning**: Fas 1 och Fas 2 completade

---

## Översikt

Fas 3 fokuserar på **avancerade visuella effekter** som går bortom enkla färgpaletter. Dessa themes kräver antingen:
- Kreativ användning av befintliga parametrar (opacity, stroke, blend modes)
- Framtida utökning av theme-schemat

---

## Planerade Themes

### 1. Risograph
**Koncept**: Retro tryckpress-estetik med begränsad färgpalett och registreringsfel

**Teknisk approach (med nuvarande schema)**:
- 2-3 spot colors (t.ex. fluorescent pink + teal)
- Hög contrast, inga gradients
- Kraftiga stroke widths för "screen print" känsla
- Blend mode: multiply för överlapp

**Begränsningar**:
- Registreringsoffset kräver post-processing eller dubbla lager (ej stöd nu)

---

### 2. Pencil Sketch
**Koncept**: Handritad pennillustration

**Teknisk approach**:
- Alla element med liknande gråskala (#2b2b2b till #5a5a5a)
- Tunnare strokes, varierande strokeWidth för "sketchy" look
- Ingen fill på buildings/parks, endast stroke
- Låg hillshade opacity för subtil skuggning

**Möjlig implementation**:
```json
{
  "roads": { "stroke": "#3a3a3a", "strokeWidth": { "major": 0.8, "minor": 0.3 } },
  "buildings": { "fill": "none", "stroke": "#4a4a4a", "strokeWidth": 0.5 },
  "contours": { "stroke": "#555555", "strokeWidth": { "major": 0.4, "minor": 0.2 } }
}
```

---

### 3. Woodblock
**Koncept**: Japansk träsnitt-estetik (ukiyo-e inspirerat)

**Teknisk approach**:
- Begränsad palett: djup indigo, varm terrakotta, guldbrun, vitt
- Kraftiga, grafiska konturer
- Platta fills utan gradients
- Hög contrast mellan element

**Möjlig implementation**:
```json
{
  "background": "#f5f0e6",
  "water": { "fill": "#2c4a6e", "stroke": "#1a2d4a", "strokeWidth": 1.2 },
  "roads": { "stroke": "#1a1a1a", "strokeWidth": { "major": 2.0, "minor": 0.8 } },
  "buildings": { "fill": "#c4573a", "stroke": "#1a1a1a", "strokeWidth": 0.8 }
}
```

---

### 4. Newspaper / Halftone
**Koncept**: Tidningstryck med prickraster-illusion

**Teknisk approach (begränsad)**:
- Newsprint-färger: gultonat papper, svart/grå bläck
- Kan simulera "halftone" via låg opacity och high contrast
- Dots-effekt kräver SVG-patterns eller post-processing

**Möjlig implementation (utan dots)**:
```json
{
  "background": "#f2efe4",
  "water": { "fill": "#b8b8b8", "stroke": "#1a1a1a", "strokeWidth": 0.5 },
  "roads": { "stroke": "#000000", "strokeWidth": { "major": 1.5, "minor": 0.6 } },
  "contours": { "stroke": "#666666", "opacity": { "major": 0.7, "minor": 0.4 } }
}
```

---

### 5. Glitch
**Koncept**: Digital korruption med RGB-separation

**Teknisk approach (begränsad)**:
- Neon färger på mörk bakgrund (likt Vaporwave men mer kaotiskt)
- Kan inte göra äkta RGB-offset utan post-processing
- Fokus på cyberpunk-färger: cyan, magenta, gul, stark kontrast

**Möjlig implementation**:
```json
{
  "background": "#0a0a0a",
  "water": { "fill": "#00ffff", "stroke": "#ff00ff", "strokeWidth": 0.8 },
  "roads": { "stroke": "#ffff00", "strokeWidth": { "major": 1.2, "minor": 0.4 } },
  "buildings": { "fill": "#ff0066", "stroke": "#00ffff", "strokeWidth": 0.6 }
}
```

---

## Implementation Prioritering

| Theme | Svårighetsgrad | Kan göras nu? | Effekt |
|-------|---------------|---------------|--------|
| Woodblock | Enkel | ✅ Ja | Hög |
| Pencil Sketch | Enkel | ✅ Ja | Hög |
| Newspaper | Medel | ⚠️ Delvis | Medel |
| Glitch | Enkel | ✅ Ja | Hög |
| Risograph | Svår | ⚠️ Delvis | Hög |

---

## Rekommenderad Implementation

### Fas 3a: Implementera nu (med befintligt schema)
1. **Woodblock** - Stark grafisk identitet, enkelt att göra rätt
2. **Pencil Sketch** - Populär estetik, användbart för tekniska kartor
3. **Glitch** - Cyberpunk-färger fungerar direkt

### Fas 3b: Kräver schema-utökning
4. **Risograph** - Behöver `registrationOffset` eller liknande
5. **Newspaper** - Behöver `pattern` support för halftone dots

---

## Schema-utökningar för Fas 3b

### Förslag: Nya theme-parametrar

```json
{
  "effects": {
    "registrationOffset": { "x": 2, "y": 1 },
    "halftonePattern": { "type": "dots", "size": 4, "angle": 45 },
    "noiseTexture": { "opacity": 0.1, "scale": 1.0 }
  }
}
```

Dessa kräver renderer-stöd i:
- Demo A (MapLibre): Custom layers eller post-processing
- Demo B (Mapnik): Symbolizers eller ImageMagick post-processing

---

## Nästa Steg

1. [x] Implementera Woodblock theme ✅
2. [x] Implementera Pencil Sketch theme ✅
3. [x] Implementera Glitch theme ✅
4. [x] Skapa matchande presets ✅
5. [x] Testa i frontend ✅
6. [ ] Utvärdera om Fas 3b är värt arbetet

---

## Risk Assessment

- **Låg risk**: Woodblock, Pencil Sketch, Glitch - enkla färgändringar
- **Medel risk**: Newspaper - kan se "platt" ut utan halftone
- **Hög risk**: Risograph - kräver teknisk investering för rätt effekt

**Rekommendation**: Börja med Fas 3a (3 themes) och utvärdera behovet av Fas 3b.
