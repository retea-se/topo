# Layout Implementation Plan - 10 Nya Kompositionsdesigner

## Översikt

Plan för att implementera 10 nya layout-alternativ i Print Editor. Implementationen görs i faser för att säkerställa kvalitet och testbarhet.

---

## Implementation Strategi

### Faser

**Fas 1: Grundläggande infrastruktur** (2-3 timmar)
- Font-loading system
- Utökad frame-style support
- Position-logik för nya title-positions

**Fas 2: Enkla layouts** (3-4 timmar)
- Blueprint, Minimalist, Scientific
- Testning och justeringar

**Fas 3: Medelkomplexa layouts** (4-5 timmar)
- Vintage Map, Gallery Print, Artistic
- Testning med olika themes

**Fas 4: Avancerade layouts** (5-6 timmar)
- Night Mode, Prestige, Heritage, Cyberpunk
- Avancerade effekter (glow, gradients, patterns)

**Fas 5: Integration & testning** (2-3 timmar)
- Fullständig testning med alla themes
- Dokumentation
- Bugfixes

**Total estimerad tid:** 16-21 timmar

---

## Tekniska Krav

### 1. Font Loading

**Filer att ändra:** `demo-a/web/public/editor.html`

**Implementation:**
```html
<!-- I <head> sektionen, efter befintliga länkar -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600;700&family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet">
```

**Fonts behövda:**
- Playfair Display (redan i Elegant, använd för Prestige/Heritage)
- Orbitron (Cyberpunk)
- Rajdhani (Cyberpunk alternativ)
- Courier Prime (Blueprint, Scientific)
- System fonts som fallback (Monaco, Courier New, etc.)

### 2. CSS-utökningar

**Ny fil:** `demo-a/web/public/layout-styles.css` (optional, eller inline i editor.html)

**CSS features behövda:**
- Grid patterns för Blueprint
- Box-shadow glow för Night Mode, Cyberpunk
- Gradient backgrounds (redan stödjs)
- Decorative borders (CSS border-image eller SVG)

### 3. JavaScript-utökningar

**Filer att ändra:**
- `demo-a/web/public/editor.js`

**Huvudsakliga ändringar:**
1. Utöka `LAYOUT_TEMPLATES` objekt (rad 49-110)
2. Utöka `updatePrintComposition()` funktion (rad 690-910)
3. Lägg till helper-funktioner för frame-styles
4. Utöka position-logik för title-positions

---

## Detaljerad Implementation Guide

### Steg 1: Utöka LAYOUT_TEMPLATES

**Plats:** `editor.js` rad 49-110

**Ny struktur för varje layout:**

```javascript
blueprint: {
    name: 'Blueprint',
    titlePosition: 'top-left',
    titleFont: "'Courier Prime', 'Courier New', 'Monaco', monospace",
    titleSize: 16,
    subtitleSize: 12,
    titleTransform: 'uppercase',  // NYTT
    titleBackground: 'rgba(245, 245, 245, 0.95)',
    titleBackgroundPattern: 'grid',  // NYTT - för CSS background
    titleColor: '#1a5fb4',
    frameStyle: 'solid',
    framePattern: 'grid',  // NYTT - för decorative frames
    frameColor: '#4a90e2',
    frameWidth: 2,
    frameGlow: null,  // NYTT
    scalePosition: 'bottom-right',  // NYTT
    attributionPosition: 'bottom-right',  // NYTT
    scaleFont: 'monospace',  // NYTT
    scaleStyle: 'technical'  // NYTT
}
```

**Nya properties att lägga till i template-strukturen:**
- `titleTransform`: 'uppercase' | 'lowercase' | 'none'
- `titleBackgroundPattern`: 'grid' | 'none'
- `framePattern`: 'grid' | 'decorative' | 'ornamental' | 'none'
- `frameGlow`: CSS shadow string eller null
- `scalePosition`: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'bottom-center'
- `attributionPosition`: (samma som scalePosition)
- `scaleFont`: 'monospace' | 'serif' | 'sans-serif'
- `scaleStyle`: 'technical' | 'elegant' | 'minimal' | 'none'
- `titleBanner`: true/false för decorative banner (Prestige)
- `titleUnderline`: true/false för decorative underline (Vintage Map)

### Steg 2: Helper-funktioner

**Lägg till i editor.js, efter LAYOUT_TEMPLATES:**

```javascript
/**
 * Generate CSS for frame style
 */
function getFrameStyleCSS(template) {
    let css = `border: ${template.frameWidth}px ${template.frameStyle} ${template.frameColor};`;

    // Add glow effect
    if (template.frameGlow) {
        css += ` box-shadow: ${template.frameGlow};`;
    }

    // Add pattern (requires additional CSS classes or inline styles)
    if (template.framePattern === 'grid') {
        // Will need CSS class or inline background-image
    }

    return css;
}

/**
 * Get title container CSS based on position
 */
function getTitleContainerCSS(template, title, subtitle) {
    const baseCSS = {
        position: 'absolute',
        padding: '14px 20px'
    };

    switch(template.titlePosition) {
        case 'top-left':
            return { ...baseCSS, top: 0, left: 0, textAlign: 'left' };
        case 'top-right':
            return { ...baseCSS, top: 0, right: 0, textAlign: 'right' };
        case 'bottom-right':
            return { ...baseCSS, bottom: 0, right: 0, textAlign: 'right' };
        case 'bottom-center':
            return { ...baseCSS, bottom: 0, left: 0, right: 0, textAlign: 'center' };
        case 'diagonal':
            // Special case - requires transform
            return { ...baseCSS, bottom: '20%', left: '5%', transform: 'rotate(-5deg)' };
        // ... existing cases
    }
}

/**
 * Generate grid pattern background (for Blueprint)
 */
function getGridPatternBackground() {
    // Returns CSS background-image data URI or class name
    // Could use CSS or SVG data URI
    return `background-image:
        linear-gradient(rgba(74, 144, 226, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(74, 144, 226, 0.1) 1px, transparent 1px);
    background-size: 20px 20px;`;
}
```

### Steg 3: Utöka updatePrintComposition()

**Huvudsakliga ändringar behövda:**

1. **Title position handling** (rad 766-797)
   - Lägg till cases för: `top-left`, `top-right`, `bottom-right`, `bottom-center`, `diagonal`

2. **Frame styling** (rad 756)
   - Använd `getFrameStyleCSS()` helper
   - Hantera framePattern (grid, decorative, etc.)

3. **Scale/Attribution positioning** (rad 830-885)
   - Använd `template.scalePosition` och `template.attributionPosition`
   - Separera logik från hardcoded bottom-left/right

4. **Title styling**
   - Lägg till `titleTransform` support
   - Lägg till `titleBackgroundPattern` support
   - Lägg till decorative elements (banner, underline)

### Steg 4: CSS Classes för Avancerade Effekter

**Lägg till i editor.html <style> sektion:**

```css
/* Grid pattern for Blueprint layout */
.frame-grid-pattern {
    background-image:
        linear-gradient(rgba(74, 144, 226, 0.15) 1px, transparent 1px),
        linear-gradient(90deg, rgba(74, 144, 226, 0.15) 1px, transparent 1px);
    background-size: 20px 20px;
}

/* Glow effect for Night Mode, Cyberpunk */
.frame-glow-cyan {
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.5),
                0 0 20px rgba(0, 255, 255, 0.3),
                0 0 30px rgba(0, 255, 255, 0.1);
}

.frame-glow-neon {
    box-shadow: 0 0 5px rgba(255, 0, 255, 0.8),
                0 0 10px rgba(255, 0, 255, 0.6),
                0 0 15px rgba(255, 0, 255, 0.4),
                0 0 20px rgba(0, 255, 255, 0.3);
}

/* Decorative title banner (Prestige) */
.title-banner {
    background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
    padding: 12px 24px;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
}

/* Decorative underline (Vintage Map) */
.title-underline {
    border-bottom: 3px double #8b7355;
    padding-bottom: 8px;
    margin-bottom: 8px;
}

/* Diagonal title (Artistic) */
.title-diagonal {
    transform: rotate(-3deg);
    transform-origin: left bottom;
}
```

---

## Implementation Prioritering

### Fas 1: Grundläggande (3 layouts)

**1. Minimalist** ⭐ Lättast
- Ingen title eller extremt minimal
- Mycket enkel frame
- Perfekt för testning av grundstrukturen

**2. Scientific** ⭐⭐ Enkel
- Top-left title (ny position)
- Clean frame
- Bottom-right scale

**3. Blueprint** ⭐⭐ Enkel-Medel
- Top-left title med monospace
- Grid pattern (kräver CSS)
- Teknisk stil

**Tidsestimering:** 3-4 timmar

### Fas 2: Medel (3 layouts)

**4. Gallery Print** ⭐⭐ Enkel
- Bottom-right title
- Ingen frame
- Diskret styling

**5. Vintage Map** ⭐⭐⭐ Medel
- Decorative frame (double med corner elements)
- Top-center med underline
- Sepia styling

**6. Artistic** ⭐⭐ Enkel
- Diagonal title (transform)
- Borderless
- Asymmetrisk

**Tidsestimering:** 4-5 timmar

### Fas 3: Avancerade (4 layouts)

**7. Night Mode** ⭐⭐⭐ Medel
- Top-right title
- Glow effects
- Neon colors

**8. Heritage** ⭐⭐⭐ Medel
- Decorative frame
- Serif fonts
- Classic styling

**9. Prestige** ⭐⭐⭐⭐ Avancerad
- Gradient banner
- Ornamental double frame
- Guld-accents

**10. Cyberpunk** ⭐⭐⭐⭐⭐ Mest avancerad
- Dynamic title (tilt)
- Multiple glow effects
- Neon styling
- Futuristic fonts

**Tidsestimering:** 6-8 timmar

---

## Detaljerad Kod Implementation

### Exempel: Blueprint Layout

```javascript
// I LAYOUT_TEMPLATES objekt
blueprint: {
    name: 'Blueprint',
    titlePosition: 'top-left',
    titleFont: "'Courier Prime', 'Courier New', 'Monaco', monospace",
    titleSize: 16,
    subtitleSize: 12,
    titleTransform: 'uppercase',
    titleBackground: 'rgba(245, 245, 245, 0.95)',
    titleBackgroundPattern: 'grid',
    titleColor: '#1a5fb4',
    frameStyle: 'solid',
    framePattern: 'grid',
    frameColor: '#4a90e2',
    frameWidth: 2,
    frameGlow: null,
    scalePosition: 'bottom-right',
    attributionPosition: 'bottom-right',
    scaleFont: 'monospace',
    scaleStyle: 'technical'
}
```

### Exempel: updatePrintComposition() utökning

```javascript
// I updatePrintComposition(), efter rad 797, lägg till:

else if (template.titlePosition === 'top-left') {
    titleContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        padding: 14px 20px;
        background: ${template.titleBackground};
        text-align: left;
        ${template.titleBackgroundPattern === 'grid' ? getGridPatternBackground() : ''}
    `;
} else if (template.titlePosition === 'top-right') {
    titleContainer.style.cssText = `
        position: absolute;
        top: 0;
        right: 0;
        padding: 14px 20px;
        background: ${template.titleBackground};
        text-align: right;
    `;
} else if (template.titlePosition === 'bottom-right') {
    titleContainer.style.cssText = `
        position: absolute;
        bottom: 0;
        right: 0;
        padding: 20px;
        background: ${template.titleBackground};
        text-align: right;
    `;
} else if (template.titlePosition === 'diagonal') {
    titleContainer.style.cssText = `
        position: absolute;
        bottom: 20%;
        left: 5%;
        padding: 16px 24px;
        background: ${template.titleBackground};
        transform: rotate(-3deg);
        transform-origin: left bottom;
    `;
}

// För title element, lägg till transform:
if (title) {
    const titleEl = document.createElement('div');
    let titleStyle = `
        font-family: ${template.titleFont};
        font-size: ${template.titleSize}px;
        font-weight: 600;
        color: ${template.titleColor || '#2d3436'};
        ${template.titleShadow ? `text-shadow: ${template.titleShadow};` : ''}
        letter-spacing: 0.5px;
    `;

    // Add text transform
    if (template.titleTransform) {
        titleStyle += `text-transform: ${template.titleTransform};`;
    }

    titleEl.style.cssText = titleStyle;
    titleEl.textContent = title;
    titleContainer.appendChild(titleEl);
}

// För frame styling, ersätt rad 756:
const frameCSS = getFrameStyleCSS(template);
overlay.style.cssText = `
    position: absolute;
    top: ${top}px;
    left: ${left}px;
    width: ${overlayWidth}px;
    height: ${overlayHeight}px;
    pointer-events: none;
    z-index: 15;
    box-sizing: border-box;
    ${frameCSS}
    ${template.framePattern === 'grid' ? 'background-image: linear-gradient(rgba(74, 144, 226, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(74, 144, 226, 0.1) 1px, transparent 1px); background-size: 20px 20px;' : ''}
    box-shadow: 0 4px 24px rgba(0,0,0,0.15);
`;
```

---

## Testplan

### Per Layout

För varje ny layout, testa:

1. **Preview Mode**
   - [ ] Layout visas korrekt i preview
   - [ ] Title position är korrekt
   - [ ] Frame styling är korrekt
   - [ ] Scale/attribution position är korrekt

2. **Theme Compatibility**
   - [ ] Testa med alla 19 themes
   - [ ] Kontrollera läsbarhet (kontrast)
   - [ ] Kontrollera visuell harmoni

3. **Responsive/Paper Sizes**
   - [ ] A4 portrait
   - [ ] A4 landscape
   - [ ] A2 portrait (default)
   - [ ] A2 landscape
   - [ ] Custom sizes

4. **Title/Subtitle**
   - [ ] Med title
   - [ ] Med subtitle
   - [ ] Med båda
   - [ ] Utan title/subtitle

5. **Scale/Attribution**
   - [ ] Med båda
   - [ ] Endast scale
   - [ ] Endast attribution
   - [ ] Utan båda

### Integration Testing

- [ ] Export fungerar med alla layouts (PNG)
- [ ] Preview fungerar med layout-byte
- [ ] Layout-select dropdown har alla 15 layouts (5 befintliga + 10 nya)
- [ ] Inga JavaScript errors i konsolen
- [ ] Performance är acceptabel (ingen lagg)

---

## UI-ändringar

### Layout Select Dropdown

**Filer:** `editor.html` rad 749-755

**Uppdatering:**
```html
<select id="layout-select">
    <!-- Existing -->
    <option value="classic">Classic</option>
    <option value="modern">Modern</option>
    <option value="minimal">Minimal</option>
    <option value="elegant">Elegant</option>
    <option value="bold">Bold</option>

    <!-- New - Phase 1 -->
    <option value="minimalist">Minimalist</option>
    <option value="scientific">Scientific</option>
    <option value="blueprint">Blueprint</option>

    <!-- New - Phase 2 -->
    <option value="gallery-print">Gallery Print</option>
    <option value="vintage-map">Vintage Map</option>
    <option value="artistic">Artistic</option>

    <!-- New - Phase 3 -->
    <option value="night-mode">Night Mode</option>
    <option value="heritage">Heritage</option>
    <option value="prestige">Prestige</option>
    <option value="cyberpunk">Cyberpunk</option>
</select>
```

---

## Dokumentation

### Efter implementation

1. **Uppdatera LAYOUT_DESIGN_PROPOSAL.md**
   - Markera implementerade layouts
   - Lägg till screenshots/exempel

2. **Uppdatera STATUS.md**
   - Lägg till sektion om layouts
   - Dokumentera kända begränsningar

3. **Uppdatera ROADMAP.md**
   - Markera layout-feature som completed

---

## Kända Begränsningar & Framtida Förbättringar

### Initial Implementation

- **Decorative frames:** Kommer initialt använda CSS border-image eller enkla patterns. Fullt ornamentala ramar kan kräva SVG.
- **Animated effects:** Cyberpunk glow-effects kommer vara statiska CSS (kan läggas till animation senare).
- **Font loading:** System fonts används som fallback, Google Fonts laddas async.

### Framtida Förbättringar

1. **SVG Decorative Frames:** För mer avancerade ornamentala ramar
2. **CSS Animations:** Glow-effects för Cyberpunk/Night Mode
3. **Custom Font Upload:** Möjlighet att ladda upp egna fonts
4. **Layout Presets:** Kombinera layout + theme som förinställningar
5. **Preview Thumbnails:** Visa layout-preview i dropdown

---

## Checklist för Implementation

### Pre-Implementation
- [ ] Läs och förstå nuvarande kod
- [ ] Skapa feature branch
- [ ] Backup av editor.js

### Implementation Fas 1
- [ ] Lägg till font-loading i editor.html
- [ ] Skapa helper-funktioner (getFrameStyleCSS, etc.)
- [ ] Utöka updatePrintComposition() med nya position-logik
- [ ] Implementera Minimalist layout
- [ ] Testa Minimalist med alla themes

### Implementation Fas 2
- [ ] Implementera Scientific layout
- [ ] Implementera Blueprint layout
- [ ] Testa alla Fas 1 layouts

### Implementation Fas 3
- [ ] Implementera Gallery Print, Vintage Map, Artistic
- [ ] Testa med olika themes och pappersstorlekar

### Implementation Fas 4
- [ ] Implementera Night Mode, Heritage, Prestige, Cyberpunk
- [ ] Lägg till CSS för glow-effects
- [ ] Testa avancerade layouts

### Post-Implementation
- [ ] Fullständig testning
- [ ] Bugfixes
- [ ] Dokumentation
- [ ] Code review
- [ ] Merge till main

---

## Referenser

- Nuvarande implementation: `demo-a/web/public/editor.js`
- Layout design: `docs/LAYOUT_DESIGN_PROPOSAL.md`
- HTML struktur: `demo-a/web/public/editor.html`
- Theme definitions: `themes/*.json`

