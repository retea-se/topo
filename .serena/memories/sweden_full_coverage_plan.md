# Sverige Helhetstäckning — Sammanfattning

**Skapad**: 2025-12-27
**Fullständig plan**: `docs/SWEDEN_FULL_COVERAGE_PLAN.md`

## Regionindelning

| Region | Bbox (WGS84) | Status |
|--------|--------------|--------|
| stockholm_core | 17.90-18.08, 59.32-59.35 | ✅ Klart |
| stockholm_wide | 17.75-18.25, 59.28-59.40 | ✅ Klart |
| svealand | 14.5-19.0, 58.5-61.0 | ✅ Klart |
| götaland | 10.5-19.5, 55.3-59.0 | ⬜ Planerad |
| norrland_syd | 14.0-20.0, 61.0-65.0 | ⬜ Planerad |
| norrland_nord | 14.0-24.2, 65.0-69.1 | ⬜ Planerad |

## Nyckeltal

- **Totalt diskutrymme**: ~150-200 GB
- **Total byggtid**: ~48-72 timmar
- **Zoom-nivåer**: z8-12 (hillshade), z8-11 (contours)
- **DEM-källa**: Copernicus GLO-30

## Fasordning (Phase 11)

1. Förberedelser (presets, scripts)
2. Götaland (prioriterad - mest befolkad)
3. Norrland Syd
4. Norrland Nord
5. Integration och QA

## Beslutspunkter

- [x] Regionindelning vs Monolitisk → **Regionindelning**
- [ ] Bekräfta zoom-nivåer
- [ ] Bekräfta DEM-källa
- [ ] Bekräfta prioriteringsordning
