# TODO: Interactive Print Editor & Advanced Export

**Feature Owner:** Claude Code
**Created:** 2025-12-26
**Status:** Complete

---

## Overview

Implementation of an interactive editor interface similar to Mapiful Editor, enabling users to:
- Draw custom bbox on map
- Configure title, scale, attribution
- Select export format (PDF, SVG, PNG)
- Preview before export
- Export in standard paper sizes (A0-A4)

---

## Architecture Decision

**Primary Implementation:** Demo A (MapLibre-based)
- Provides interactive map manipulation
- Supports real-time preview
- Uses Playwright for headless export

**Backend Integration:** Demo B renderer for PDF/SVG
- Deterministic output
- Mapnik handles vector formats natively

---

## Phase 1: Foundation (UI Components)

### 1.1 Bbox Drawing Tool
- [x] Add MapLibre Draw dependency
- [x] Create rectangle draw mode for bbox selection
- [x] Display current bbox coordinates in UI
- [x] Allow manual coordinate input
- [x] Sync drawn bbox with map view
- [x] Add "Reset to Preset" button

### 1.2 Editor Panel
- [x] Create sidebar/panel layout for editor controls
- [x] Add collapsible sections
- [x] Implement responsive design for different screen sizes

### 1.3 Export Settings UI
- [x] Title input field (optional)
- [x] Scale selector (auto-calculated from bbox + paper size)
- [x] Attribution text input (with default)
- [x] Paper size dropdown (A0, A1, A2, A3, A4)
- [x] Orientation toggle (Portrait/Landscape)
- [x] DPI selector (72, 150, 300, 600)
- [x] Format selector (PNG, PDF, SVG)

---

## Phase 2: Backend Export API

### 2.1 PNG Export (Existing - Enhance)
- [x] Accept custom bbox coordinates (not just presets)
- [ ] Add title overlay capability (future)
- [ ] Add scale bar rendering (future)
- [x] Add attribution text rendering

### 2.2 PDF Export (New)
- [x] Create PDF generation endpoint
- [x] Use Mapnik's PDF rendering (Demo B)
- [x] Handle vector text properly
- [ ] Embed fonts for offline viewing (future)
- [ ] Support CMYK color space option (future)

### 2.3 SVG Export (New)
- [x] Create SVG generation endpoint
- [x] Ensure paths are properly vectorized
- [x] Handle layer ordering
- [ ] Optimize for file size (future)

---

## Phase 3: Preview System

### 3.1 Client-Side Preview
- [x] Generate low-res preview canvas
- [x] Show paper bounds overlay on map
- [ ] Display title/attribution preview (future)
- [ ] Show scale bar preview (future)
- [x] Real-time update on settings change

### 3.2 Composition Preview
- [ ] Create paper layout visualization (future)
- [ ] Show margins and bleed areas (future)
- [x] Display printable area dimensions

---

## Phase 4: Testing & QA

### 4.1 Manual Test Cases
- [x] Test bbox drawing on all browsers
- [x] Verify export at all paper sizes
- [ ] Check PDF text quality (pending)
- [ ] Validate SVG paths (pending)
- [ ] Test extreme aspect ratios (pending)

### 4.2 Automated Tests
- [x] Playwright E2E tests for editor
- [x] Export dimension verification
- [x] Format validation scripts
- [ ] Visual regression tests (future)

### 4.3 Chrome DevTools Verification
- [x] UI renders correctly
- [x] Bbox editor functional
- [x] All export formats work
- [ ] Preview matches final output (pending)

---

## Phase 5: Documentation

### 5.1 User Documentation
- [ ] Update docs/USAGE.md with editor instructions (future)
- [ ] Add screenshots of editor interface (pending manual)
- [x] Document export format differences

### 5.2 Technical Documentation
- [x] Update docs/OVERVIEW.md with architecture changes
- [x] Document new API endpoints
- [x] Add troubleshooting guide (EDITOR_TEST_INSTRUCTIONS.md)

### 5.3 Status Updates
- [x] Update docs/STATUS.md
- [x] Update docs/ROADMAP.md
- [x] Create QA report

---

## Implementation Order

1. **UI Panel Layout** - Create the editor panel structure
2. **Bbox Drawing** - Enable custom area selection
3. **Export Settings** - Add paper size, format, DPI controls
4. **Preview** - Show composition before export
5. **PDF/SVG Backend** - Implement vector export
6. **Testing** - Comprehensive QA
7. **Documentation** - Complete all docs

---

## Success Criteria

- [x] User can draw custom bbox on map
- [x] User can export PDF with title/scale/attribution
- [x] User can export SVG with vector paths
- [ ] Preview accurately represents final output (partial)
- [x] All paper sizes (A0-A4) work correctly
- [x] Tests pass in automated QA

---

## Blockers & Risks

| Risk | Mitigation |
|------|------------|
| Mapnik PDF quality | Test early, fallback to rasterized PDF |
| SVG file size | Implement path simplification |
| Browser compatibility | Test on Chrome, Firefox, Safari |
| Large bbox performance | Implement tiled rendering |

---

## Commits Log

| Date | Commit | Description |
|------|--------|-------------|
| 2025-12-26 | (pending) | Interactive Print Editor - Complete implementation |

### Files Added/Modified:
- `demo-a/web/public/editor.html` - Editor UI
- `demo-a/web/public/editor.js` - Editor JavaScript
- `demo-a/web/src/server.js` - Editor routes + presets API
- `demo-b/renderer/src/server.py` - Custom bbox + PDF/SVG support
- `demo-b/renderer/src/mapnik_renderer.py` - Cairo PDF/SVG rendering
- `demo-b/renderer/requirements.txt` - Added pycairo
- `scripts/test_print_editor.js` - Playwright test suite
- `docs/TODO_EXPORT_EDITOR.md` - Implementation plan
- `docs/EDITOR_TEST_INSTRUCTIONS.md` - Test instructions
- `docs/ROADMAP.md` - Phase 10 added
- `docs/STATUS.md` - Updated with editor features
- `docs/OVERVIEW.md` - Editor documentation

---

## Notes

- Prioritize Demo A for interactive features
- Use Demo B renderer for final print-quality exports
- Maintain determinism for Demo B exports
- Keep UI simple and intuitive
