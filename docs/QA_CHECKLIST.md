# QA Checklist för Pull Requests

Denna checklista hjälper till att säkerställa kvalitet vid ändringar som påverkar rendering, export eller editor UI.

**Notera:** Detta är en guide, inte en enforcement. Använd ditt omdöme baserat på PR-omfattningen.

---

## Touchar PR rendering/export?

Om din PR ändrar:
- Export-logik (exporter rendering, komposition, layout)
- Print composition overlay
- Layout templates
- Export-parametrar eller validering

### Checklist

- [ ] Kör golden test: `node scripts/qa_golden_print_export.js`
- [ ] Om testet failar:
  - [ ] Är ändringen avsiktlig? → Uppdatera goldens (se [QA_GOLDEN_EXPORTS.md](QA_GOLDEN_EXPORTS.md))
  - [ ] Är det en bugg? → Fixa buggen istället
- [ ] Dokumentera ändringen i commit message eller PR description

**Relaterade docs:**
- [QA_GOLDEN_EXPORTS.md](QA_GOLDEN_EXPORTS.md) - Golden export-guide
- [golden/print_export/README.md](../golden/print_export/README.md) - Teknisk dokumentation

---

## Touchar PR editor UI?

Om din PR ändrar:
- Print Editor UI (`demo-a/web/public/editor.html`, `editor.js`)
- Formulär, dropdowns, knappar
- Preview-funktionalitet
- MapLibre integration i editorn

### Checklist

- [ ] Kör Playwright editor tests:
  ```bash
  npx playwright test scripts/test_print_editor.spec.js
  npx playwright test scripts/test_export_presets_editor.spec.js
  ```
- [ ] Kontrollera console errors:
  - Öppna DevTools Console i editorn
  - Verifiera inga JavaScript errors/warnings (förutom kända icke-kritiska)
- [ ] Manuell verifiering:
  - [ ] Editor laddar korrekt
  - [ ] Alla formulär fungerar
  - [ ] Preview uppdateras korrekt
  - [ ] Export fungerar

**Relaterade docs:**
- [USAGE.md](USAGE.md#print-editor-interactive-map-editor) - Print Editor guide
- [EDITOR_TEST_INSTRUCTIONS.md](EDITOR_TEST_INSTRUCTIONS.md) - Testinstruktioner

---

## Touchar PR presets?

Om din PR ändrar:
- Export preset-filer (`config/export_presets/*.json`)
- Preset-validering
- Preset-schema

### Checklist

- [ ] Validera schema:
  ```bash
  # Kontrollera att preset matchar schema
  node scripts/validate_preset.js <preset-file>
  ```
- [ ] Kör minst ett golden export med ändrat preset (om relevant)
- [ ] Verifiera att preset API returnerar korrekt data:
  ```bash
  curl http://localhost:3000/api/export-presets/<preset-id>
  ```

**Relaterade docs:**
- [PRESET_LIMITS.md](PRESET_LIMITS.md) - Preset-begränsningar
- [config/export_presets/_schema.json](../config/export_presets/_schema.json) - Schema-definition

---

## Allmänna QA-principer

### Innan du pushar

- [ ] Tjänster startar korrekt: `docker compose ps`
- [ ] Inga uppenbara console errors i DevTools
- [ ] Dokumentation uppdaterad om API/parametrar ändrats

### Vid oklarhet

- Konsultera [STATUS.md](STATUS.md) för aktuell systemstatus
- Se [ROADMAP.md](ROADMAP.md) för planerade funktioner
- Kontrollera [CHANGELOG.md](../CHANGELOG.md) för senaste ändringar

---

**Senast uppdaterad:** 2025-12-27
**Syfte:** Institutionellt minne för QA-processer, inte enforcement

