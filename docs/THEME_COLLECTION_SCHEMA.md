# Theme Collection Schema

**Version**: 1.0
**Datum**: 2025-12-27

---

## Syfte

Definierar datastrukturen för theme collections. Ingen affärslogik, ingen rendering.

---

## Collection Object

```typescript
interface Collection {
  id: string;              // URL-safe identifier (e.g., "premium-poster")
  name: string;            // Display name (e.g., "Premium Poster")
  description: string;     // 1-2 sentence description
  tier: "premium" | "standard";
  themes: string[];        // Array of theme IDs
  hero: string;            // Featured theme ID (must be in themes array)
  criteria?: {
    maxWarnings?: number;  // Optional threshold
    requiredTags?: string[];
  };
}
```

## Theme Collection Mapping

```typescript
interface ThemeCollectionMap {
  [themeId: string]: string[];  // theme -> collections it belongs to
}
```

---

## Filplacering

| Fil | Syfte |
|-----|-------|
| `config/collections.json` | Collection definitions (framtida) |
| `docs/THEME_COLLECTIONS_V1.md` | Human-readable documentation |

---

## Regler

1. **Ett theme kan tillhöra flera kollektioner**
2. **Hero theme MÅSTE finnas i themes-arrayen**
3. **Collection ID är immutable efter skapande**
4. **Inga cirkulära beroenden**

---

## Exempel: Minimal implementation

```json
{
  "id": "premium-poster",
  "name": "Premium Poster",
  "description": "Themes för storformatstryck",
  "tier": "premium",
  "themes": ["pencil-sketch", "glitch", "woodblock"],
  "hero": "glitch"
}
```

---

## Icke-scope

Följande hanteras INTE av denna schema:

- Preset → Collection koppling (UI-lager)
- Prismodeller (affärslogik)
- Rendering av themes
- Validering av theme-filer

---

*Genererad av Product Execution Agent*
