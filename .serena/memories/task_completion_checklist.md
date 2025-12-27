# Task Completion Checklist

Before marking a task as complete:

## 1. Functionality
- [ ] Feature/fix works as expected
- [ ] Tested in relevant demo (A and/or B)
- [ ] No existing functionality broken

## 2. Documentation
- [ ] Update `/docs/STATUS.md` if status changed
- [ ] Update `/docs/ROADMAP.md` if milestones achieved
- [ ] Add/update relevant doc files if needed

## 3. Verification
- [ ] Run Playwright tests: `npx playwright test`
- [ ] For Demo B: Verify deterministic output if relevant
- [ ] For exports: Check dimensions and file size

## 4. Code Quality
- [ ] Code follows project conventions
- [ ] No unnecessary changes ("while you're here")
- [ ] Commit message explains _why_

## 5. Visual Changes
- [ ] Screenshot verification if visual output changed
- [ ] Document any visual differences

## Common Test Commands
```powershell
# Full test suite
npx playwright test

# Specific test file
npx playwright test tests/<filename>.spec.js

# QA export script
node scripts/qa_preset_export.js
```
