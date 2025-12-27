# Gallery UI Contract v1.0

> Standalone, accessible theme gallery component for Topo Print Editor

---

## 1. Component Overview

The Gallery is a **vanilla JavaScript** component that renders a grid of selectable theme cards. It is framework-agnostic and can be integrated into any HTML page.

**Key Characteristics:**
- Zero dependencies (vanilla JS + CSS)
- Accessible (WCAG 2.1 AA compliant)
- Mobile-first responsive design
- Tap-only interaction (no swipe gestures)
- CSS-only responsive columns

---

## 2. HTML Structure

```html
<!-- Container provided by host -->
<div id="my-gallery"></div>

<!-- Generated DOM structure -->
<div class="topo-gallery">
  <div class="topo-gallery__header">
    <span class="topo-gallery__title">Themes</span>
    <span class="topo-gallery__count">37 items</span>
  </div>
  <div class="topo-gallery__grid" role="listbox" aria-label="Theme selection" tabindex="0">
    <div class="topo-gallery__card" role="option" aria-selected="true" tabindex="0" data-item-id="paper">
      <div class="topo-gallery__card-preview">
        <div class="topo-gallery__card-swatch" style="background-color: #faf8f5"></div>
        <div class="topo-gallery__card-spinner"></div>
        <div class="topo-gallery__card-check" aria-hidden="true">✓</div>
      </div>
      <div class="topo-gallery__card-info">
        <p class="topo-gallery__card-name">Paper</p>
        <p class="topo-gallery__card-category">Light</p>
      </div>
    </div>
    <!-- More cards... -->
  </div>
</div>
```

---

## 3. CSS Custom Properties

All visual aspects are configurable via CSS custom properties:

```css
:root {
  /* Spacing */
  --topo-gallery-gap: 12px;
  --topo-gallery-padding: 16px;
  --topo-gallery-card-padding: 12px;

  /* Sizing */
  --topo-gallery-card-min-height: 100px;
  --topo-gallery-card-preview-height: 60px;
  --topo-gallery-columns: 2;  /* Base columns, overridden by media queries */

  /* Colors - Scandinavian neutral palette */
  --topo-gallery-bg: #fafafa;
  --topo-gallery-card-bg: #ffffff;
  --topo-gallery-card-border: #e5e5e5;
  --topo-gallery-card-border-hover: #d0d0d0;
  --topo-gallery-card-border-selected: #4a6fa5;
  --topo-gallery-card-bg-selected: #f0f4f8;
  --topo-gallery-text-primary: #2d3436;
  --topo-gallery-text-secondary: #6b7280;
  --topo-gallery-text-category: #9ca3af;
  --topo-gallery-focus-ring: rgba(74, 111, 165, 0.4);
  --topo-gallery-check-bg: #4a6fa5;
  --topo-gallery-check-color: #ffffff;

  /* Borders */
  --topo-gallery-radius: 8px;
  --topo-gallery-border-width: 1px;
  --topo-gallery-border-width-selected: 2px;

  /* Animation */
  --topo-gallery-transition: 150ms ease;

  /* Shadows */
  --topo-gallery-shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.08);
  --topo-gallery-shadow-selected: 0 0 0 3px var(--topo-gallery-focus-ring);
}
```

---

## 4. JavaScript API

### 4.1 Factory Function

```javascript
const gallery = createGallery(options);
```

**Options:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `container` | `HTMLElement \| string` | Yes | Container element or CSS selector |
| `items` | `Array<Item>` | Yes | Array of gallery items |
| `selectedId` | `string` | No | Initially selected item ID |
| `onChange` | `Function` | No | Callback when selection changes |

**Item Object:**

```javascript
{
  id: 'paper',           // Required: unique identifier
  name: 'Paper',         // Required: display name
  category: 'Light',     // Optional: category label
  accentColor: '#faf8f5',    // Required: primary swatch color
  secondaryColor: '#e8e4df'  // Optional: accent bar color
}
```

### 4.2 Instance Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `select` | `(id: string) => void` | Select item by ID |
| `getSelected` | `() => Item \| null` | Get currently selected item |
| `setLoading` | `(id: string, isLoading: boolean) => void` | Show/hide loading spinner |
| `setItems` | `(items: Array<Item>) => void` | Replace all items |
| `getItems` | `() => Array<Item>` | Get copy of all items |
| `on` | `(event: string, callback: Function) => void` | Subscribe to event |
| `off` | `(event: string, callback: Function) => void` | Unsubscribe from event |
| `render` | `() => void` | Force re-render |
| `destroy` | `() => void` | Clean up and remove DOM |

### 4.3 Events

| Event | Payload | Description |
|-------|---------|-------------|
| `change` | `Item` | Fired when selection changes |
| `focus` | `Item` | Fired when card receives focus |

---

## 5. Accessibility

### 5.1 ARIA Attributes

- Grid: `role="listbox"`, `aria-label="Theme selection"`, `tabindex="0"`
- Cards: `role="option"`, `aria-selected="true|false"`, `tabindex="0|-1"`
- Checkmark: `aria-hidden="true"`

### 5.2 Keyboard Navigation

| Key | Action |
|-----|--------|
| `ArrowRight` | Focus next card |
| `ArrowLeft` | Focus previous card |
| `ArrowDown` | Focus card below (grid-aware) |
| `ArrowUp` | Focus card above (grid-aware) |
| `Home` | Focus first card |
| `End` | Focus last card |
| `Enter` / `Space` | Select focused card |
| `A-Z` | Type-ahead: jump to first matching name |

### 5.3 Focus Management

- Selected card has `tabindex="0"`, others have `tabindex="-1"`
- Focus ring visible via `:focus-visible` (2px solid outline)
- High contrast mode: 3px black border on selected

---

## 6. Responsive Behavior

**CSS-only column logic (no JavaScript):**

| Breakpoint | Columns | Context |
|------------|---------|---------|
| < 768px | 2 | Mobile |
| 768px - 1023px | 3 | Tablet |
| 1024px - 1279px | 2 | Desktop sidebar |
| >= 1280px | 3 | Wide desktop |

**Mobile Optimizations (< 768px):**
- Reduced gap: 10px
- Reduced padding: 12px
- Smaller preview height: 50px
- Minimum touch target: 44px

---

## 7. States

### 7.1 Card States

| State | CSS | Visual |
|-------|-----|--------|
| Default | `.topo-gallery__card` | White bg, gray border |
| Hover | `:hover` | Darker border, shadow, lift 2px |
| Focus | `:focus` | Focus ring shadow |
| Selected | `[aria-selected="true"]` | Blue border, blue bg tint, checkmark |
| Loading | `[data-loading="true"]` | Spinner overlay, pointer-events: none |

### 7.2 Loading State

```javascript
// Show loading spinner
gallery.setLoading('paper', true);

// Hide loading spinner
gallery.setLoading('paper', false);
```

---

## 8. Integration Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <link rel="stylesheet" href="gallery.css">
</head>
<body>
  <div id="theme-gallery"></div>

  <script src="gallery.js"></script>
  <script>
    const themes = [
      { id: 'paper', name: 'Paper', category: 'Light', accentColor: '#faf8f5' },
      { id: 'ink', name: 'Ink', category: 'Dark', accentColor: '#1a1a2e' },
      // ...more themes
    ];

    const gallery = createGallery({
      container: '#theme-gallery',
      items: themes,
      selectedId: 'paper',
      onChange: (item) => {
        console.log('Selected:', item.id);
        // Update map preview, etc.
      }
    });

    // Programmatic selection
    gallery.select('ink');

    // Show loading during async operation
    gallery.setLoading('ink', true);
    await loadTheme('ink');
    gallery.setLoading('ink', false);
  </script>
</body>
</html>
```

---

## 9. Files

| File | Purpose |
|------|---------|
| `gallery.js` | Component logic (~450 lines) |
| `gallery.css` | Component styles + demo styles (~560 lines) |
| `gallery.html` | Reference implementation + demo page |

---

## 10. Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Accessibility Modes:**
- `prefers-reduced-motion`: Disables transitions
- `prefers-contrast: high`: Increases border width, uses black

---

## 11. Changelog

### v1.0 (2024-12-27)
- Initial stable release
- Full keyboard navigation
- CSS-only responsive columns
- Loading state support
- WCAG 2.1 AA compliant
