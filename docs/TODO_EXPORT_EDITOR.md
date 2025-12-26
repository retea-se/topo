# TODO: Interactive Print Editor & Advanced Export

**Feature Owner:** Claude Code
**Created:** 2025-12-26
**Status:** In Progress

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
- [ ] Add MapLibre Draw dependency
- [ ] Create rectangle draw mode for bbox selection
- [ ] Display current bbox coordinates in UI
- [ ] Allow manual coordinate input
- [ ] Sync drawn bbox with map view
- [ ] Add "Reset to Preset" button

### 1.2 Editor Panel
- [ ] Create sidebar/panel layout for editor controls
- [ ] Add collapsible sections
- [ ] Implement responsive design for different screen sizes

### 1.3 Export Settings UI
- [ ] Title input field (optional)
- [ ] Scale selector (auto-calculated from bbox + paper size)
- [ ] Attribution text input (with default)
- [ ] Paper size dropdown (A0, A1, A2, A3, A4)
- [ ] Orientation toggle (Portrait/Landscape)
- [ ] DPI selector (72, 150, 300, 600)
- [ ] Format selector (PNG, PDF, SVG)

---

## Phase 2: Backend Export API

### 2.1 PNG Export (Existing - Enhance)
- [ ] Accept custom bbox coordinates (not just presets)
- [ ] Add title overlay capability
- [ ] Add scale bar rendering
- [ ] Add attribution text rendering

### 2.2 PDF Export (New)
- [ ] Create PDF generation endpoint
- [ ] Use Mapnik's PDF rendering (Demo B)
- [ ] Handle vector text properly
- [ ] Embed fonts for offline viewing
- [ ] Support CMYK color space option

### 2.3 SVG Export (New)
- [ ] Create SVG generation endpoint
- [ ] Ensure paths are properly vectorized
- [ ] Handle layer ordering
- [ ] Optimize for file size

---

## Phase 3: Preview System

### 3.1 Client-Side Preview
- [ ] Generate low-res preview canvas
- [ ] Show paper bounds overlay on map
- [ ] Display title/attribution preview
- [ ] Show scale bar preview
- [ ] Real-time update on settings change

### 3.2 Composition Preview
- [ ] Create paper layout visualization
- [ ] Show margins and bleed areas
- [ ] Display printable area dimensions

---

## Phase 4: Testing & QA

### 4.1 Manual Test Cases
- [ ] Test bbox drawing on all browsers
- [ ] Verify export at all paper sizes
- [ ] Check PDF text quality
- [ ] Validate SVG paths
- [ ] Test extreme aspect ratios

### 4.2 Automated Tests
- [ ] Playwright E2E tests for editor
- [ ] Export dimension verification
- [ ] Format validation scripts
- [ ] Visual regression tests

### 4.3 Chrome DevTools Verification
- [ ] UI renders correctly
- [ ] Bbox editor functional
- [ ] All export formats work
- [ ] Preview matches final output

---

## Phase 5: Documentation

### 5.1 User Documentation
- [ ] Update docs/USAGE.md with editor instructions
- [ ] Add screenshots of editor interface
- [ ] Document export format differences

### 5.2 Technical Documentation
- [ ] Update docs/OVERVIEW.md with architecture changes
- [ ] Document new API endpoints
- [ ] Add troubleshooting guide

### 5.3 Status Updates
- [ ] Update docs/STATUS.md
- [ ] Update docs/ROADMAP.md
- [ ] Create QA report

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

- [ ] User can draw custom bbox on map
- [ ] User can export PDF with title/scale/attribution
- [ ] User can export SVG with vector paths
- [ ] Preview accurately represents final output
- [ ] All paper sizes (A0-A4) work correctly
- [ ] Tests pass in automated QA

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
| 2025-12-26 | (pending) | Initial TODO and project setup |
| | | |

---

## Notes

- Prioritize Demo A for interactive features
- Use Demo B renderer for final print-quality exports
- Maintain determinism for Demo B exports
- Keep UI simple and intuitive
