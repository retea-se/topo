# Export Layout Testing Status

**Datum**: 2025-01-27  
**Branch**: `feature/layout-designs`  
**Status**: ⚠️ **PÅGÅENDE** - Exporter-servern behöver uppdateras

---

## Problem

Layout-overlayen renderas korrekt i **preview mode** i editorn, men exporter-servern (`demo-a/exporter/src/server.js`) behöver uppdateras för att:

1. ✅ **LAYOUT_TEMPLATES uppdaterad** - Alla 10 nya layouts är tillagda
2. ⏳ **Rendering-logiken behöver uppdateras** - `page.evaluate()` blocket (rad 287-450) hanterar bara 3 title-positions (top-center, bottom-left, center-overlay) men behöver stöd för alla 8 positioner + nya features

---

## Vad som behöver uppdateras i exporter-servern

### 1. Title Positions (i page.evaluate()-blocket)

Nuvarande kod hanterar endast:
- `top-center`
- `bottom-left`
- `center-overlay`

Behöver lägga till:
- `top-left` (Scientific, Blueprint)
- `top-right` (Night Mode)
- `bottom-right` (Gallery Print)
- `bottom-center` (Vintage Map, Heritage, Prestige)
- `diagonal` (Artistic)

### 2. Frame Styles

Nuvarande kod hanterar:
- `solid`
- `none`

Behöver lägga till:
- `double` (Vintage Map, Heritage, Prestige, Elegant)
- Grid pattern background (Blueprint)
- Glow effects (Night Mode, Cyberpunk)

### 3. Title Styling

Nuvarande kod hanterar:
- Basic font, size, color, shadow

Behöver lägga till:
- `titleTransform: 'uppercase'` (Blueprint, Cyberpunk)
- `titleStyle: 'italic'` (Vintage Map, Artistic)
- `titleBanner: true` (Prestige)
- `titleUnderline: true` (Vintage Map)
- `titleFontWeight` (Night Mode, Artistic, Prestige, Cyberpunk)
- `titleBackgroundPattern: 'grid'` (Blueprint)

### 4. Scale/Attribution Positioning

Nuvarande kod:
- Använder fast position (bottom-left för scale, bottom-right för attribution)
- Använder en footer area med flexbox

Behöver uppdatera:
- `scalePosition` och `attributionPosition` properties från template
- Olika positions: `bottom-left`, `bottom-right`, `bottom-center`, `top-left`, `top-right`, `none`
- `scaleFont` property (monospace, serif, sans-serif)

---

## Rekommenderad Lösning

Uppdatera `page.evaluate()` blocket (rad 287-450) i `demo-a/exporter/src/server.js` för att matcha logiken i `editor.js` funktionen `updatePrintComposition()` (rad 915-1291).

### Exempel på kod som behöver läggas till:

```javascript
// I page.evaluate() blocket, ersätt title position handling:

// FÖRE (hanterar bara 3 positioner):
if (template.titlePosition === 'top-center') {
  // ...
} else if (template.titlePosition === 'bottom-left') {
  // ...
} else if (template.titlePosition === 'center-overlay') {
  // ...
}

// EFTER (hanterar alla 8 positioner):
if (template.titlePosition === 'top-center') {
  containerCSS = `position: absolute; top: 0; left: 0; right: 0; padding: 14px 20px; background: ${template.titleBackground || 'transparent'}; text-align: center;`;
} else if (template.titlePosition === 'top-left') {
  containerCSS = `position: absolute; top: 0; left: 0; padding: 14px 20px; background: ${template.titleBackground || 'transparent'}; text-align: left;${template.titleBackgroundPattern === 'grid' ? 'background-image: linear-gradient(rgba(74, 144, 226, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(74, 144, 226, 0.15) 1px, transparent 1px); background-size: 20px 20px;' : ''}`;
} else if (template.titlePosition === 'top-right') {
  containerCSS = `position: absolute; top: 0; right: 0; padding: 14px 20px; background: ${template.titleBackground || 'transparent'}; text-align: right;`;
} else if (template.titlePosition === 'bottom-left') {
  containerCSS = `position: absolute; bottom: 0; left: 0; right: 0; padding: 24px 20px 16px; background: ${template.titleBackground || 'transparent'};`;
} else if (template.titlePosition === 'bottom-right') {
  containerCSS = `position: absolute; bottom: 0; right: 0; padding: 20px; background: ${template.titleBackground || 'transparent'}; text-align: right;`;
} else if (template.titlePosition === 'bottom-center') {
  containerCSS = `position: absolute; bottom: 0; left: 0; right: 0; padding: 14px 20px; background: ${template.titleBackground || 'transparent'}; text-align: center;`;
} else if (template.titlePosition === 'center-overlay') {
  containerCSS = `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; padding: 24px;`;
} else if (template.titlePosition === 'diagonal') {
  containerCSS = `position: absolute; bottom: 20%; left: 5%; padding: 16px 24px; background: ${template.titleBackground || 'transparent'}; transform: rotate(-3deg); transform-origin: left bottom; border-radius: 4px;`;
}
```

---

## Nästa Steg

1. **Uppdatera rendering-logiken** i `demo-a/exporter/src/server.js` page.evaluate()-blocket
2. **Testa export** med olika layouts för att verifiera att overlay renderas korrekt
3. **Verifiera** att exporterade PNG-filer innehåller layout-overlay

---

## Testplan

Efter implementation:

```bash
# 1. Testa export med Blueprint layout
curl "http://localhost:8082/render?bbox_preset=stockholm_core&theme=blueprint-muted&layout_template=blueprint&title=Test&show_scale=true&dpi=150&width_mm=420&height_mm=594"

# 2. Testa export med Cyberpunk layout
curl "http://localhost:8082/render?bbox_preset=stockholm_core&theme=cyberpunk&layout_template=cyberpunk&title=TEST&show_scale=true&dpi=150&width_mm=420&height_mm=594"

# 3. Testa export med Prestige layout
curl "http://localhost:8082/render?bbox_preset=stockholm_core&theme=gold-foil&layout_template=prestige&title=Prestige Test&show_scale=true&dpi=150&width_mm=420&height_mm=594"
```

---

## Referenser

- **Editor implementation**: `demo-a/web/public/editor.js` - `updatePrintComposition()` funktion (rad 915-1291)
- **Exporter implementation**: `demo-a/exporter/src/server.js` - `page.evaluate()` block (rad 287-450)
- **Layout templates**: `demo-a/exporter/src/server.js` - `LAYOUT_TEMPLATES` object (rad 65-290)

