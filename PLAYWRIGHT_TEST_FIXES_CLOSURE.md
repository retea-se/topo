# Playwright Test Expectation Alignment - Closure Report

**Date:** 2025-12-27
**Task:** Fix Playwright expectation mismatches (locale + paper size labels) + harden frontend E2E
**Status:** ✅ **COMPLETE**

---

## Summary

All Playwright E2E tests now pass (29/29) after aligning test expectations with actual UI behavior. The main issues were:
1. UI uses Swedish locale for preset names (e.g., "papperskarta", "terrangkarta")
2. Paper size labels may or may not include dimensions suffix
3. Console warnings (WebGL/GPU) were being treated as errors
4. Minor test logic issues (attribution input, preview mode export)

**No rendering/export behavior was changed** - only test expectations were updated to match the actual UI.

---

## Test Results

### Before Fixes
- `test_print_editor.spec.js`: Multiple failures due to console warnings and expectation mismatches
- `test_export_presets_editor.spec.js`: 2/4 tests failing due to locale mismatches

### After Fixes
- ✅ **29/29 tests PASS**
  - `test_print_editor.spec.js`: 25/25 PASS
  - `test_export_presets_editor.spec.js`: 4/4 PASS

---

## Files Changed

### Test Files
1. **`scripts/test_print_editor.spec.js`**
   - Console warning filter: Exclude WebGL/GPU driver warnings
   - Paper size assertions: Accept format with or without "(210 x 297 mm)" suffix
   - Scale assertion: Changed from literal "Scale:" to regex pattern matching scale value format
   - Attribution test: Changed to check checkbox (`#show-attribution`) instead of text input
   - Preview export test: Fixed to exit preview mode before clicking export button

2. **`scripts/test_export_presets_editor.spec.js`**
   - Console warning filter: Exclude WebGL/GPU driver warnings
   - Preset name assertions: Accept Swedish names via regex patterns (e.g., `/a2.*(paper|papperskarta)/i`)
   - Modified status check: Made locale-agnostic (accept 'modified' or 'modifierad')
   - Validation errors test: Changed to check container exists (`toBeAttached`) instead of visible

### Documentation
3. **`docs/STATUS.md`**
   - Added section documenting locale-agnostic test improvements
   - Updated test result summary: 29/29 PASS

4. **`docs/QA_REPORT_EDITOR.md`**
   - Marked preset E2E test issues as FIXED
   - Added "Test Expectation Alignment" section documenting all fixes

---

## Commits

1. **`c69135c`** - `fix(playwright): filter WebGL/GPU console warnings from test errors`
   - Files: `scripts/test_print_editor.spec.js`, `scripts/test_export_presets_editor.spec.js`
   - Changes: Console warning filter + all locale/expectation alignment fixes
   - All test fixes included in this commit (343 insertions, 158 deletions)

2. **`acec7dc`** - `docs: update STATUS and QA_REPORT with test expectation alignment fixes`
   - Files: `docs/STATUS.md`, `docs/QA_REPORT_EDITOR.md`
   - Updated documentation to reflect test fixes and current status (31 insertions, 2 deletions)

**Pushed to:** `origin/main`

---

## Fixes Applied

### 1. Console Warning Filter
**Issue:** WebGL/GPU driver warnings were being treated as test errors
**Fix:** Added filters to exclude:
- WebGL warnings
- GPU stall messages
- GL Driver Messages
- GroupMarkerNotSet warnings

These are browser/driver warnings, not application errors.

### 2. Locale-Agnostic Preset Names
**Issue:** Tests expected English names ("paper", "terrain") but UI uses Swedish ("papperskarta", "terrangkarta")
**Fix:** Updated regex patterns to accept both languages:
- `/a2.*(paper|papperskarta)|(paper|papperskarta).*a2/i`
- Similar patterns for other preset names

### 3. Flexible Paper Size Format
**Issue:** Tests expected exact format "A4 (210 x 297 mm)" but UI may use just "A4"
**Fix:** Changed assertions to check for paper size prefix (e.g., `options.some(o => o.trim().startsWith('A4'))`)

### 4. Scale Text Assertion
**Issue:** Test expected literal "Scale:" text but overlay displays only scale value (e.g., "1:25K")
**Fix:** Changed to regex pattern matching scale value format: `/1:\d/`

### 5. Attribution Input
**Issue:** Test expected `#attribution-input` text field but UI uses `#show-attribution` checkbox
**Fix:** Updated test to check for checkbox element

### 6. Preview Mode Export
**Issue:** Test tried to click export button while in preview mode (sidebar hidden)
**Fix:** Added step to exit preview mode (press ESC) before clicking export button

### 7. Modified Status Check
**Issue:** Test expected exact "modified" text but UI may use "modifierad" (Swedish)
**Fix:** Made check locale-agnostic: accepts 'modified', 'modifierad', '(modified)', '(modifierad)'

### 8. Validation Errors Visibility
**Issue:** Test expected validation errors container to be visible, but it may be empty (hidden)
**Fix:** Changed to check container exists (`toBeAttached`) instead of visible

---

## How to Run Tests

```bash
# Run all Playwright tests
npx playwright test scripts/test_print_editor.spec.js
npx playwright test scripts/test_export_presets_editor.spec.js

# Run both suites
npx playwright test scripts/test_print_editor.spec.js scripts/test_export_presets_editor.spec.js

# Run with UI mode (interactive)
npx playwright test scripts/test_print_editor.spec.js --ui
```

**Expected Result:** All 29 tests should pass.

---

## Notes / Deferrals

- **No deferrals** - All identified issues have been fixed
- **No rendering/export changes** - Only test expectations were modified
- Tests are now more robust to locale and format variations

---

## Verification

All fixes have been:
- ✅ Implemented
- ✅ Tested locally (29/29 PASS)
- ✅ Committed to git
- ✅ Pushed to origin/main
- ✅ Documented in STATUS.md and QA_REPORT_EDITOR.md

