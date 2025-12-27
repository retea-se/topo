# Code Style and Conventions

## Absolute Rules (from CLAUDE.md)
1. **Never break a working export**
2. **Never optimize before documenting**
3. **Never mix roadmap with status**
4. **Never silently change visual output**

## What NOT to Do
- Do not add features "while you're here"
- Do not regenerate data unless asked
- Do not refactor working pipelines
- Do not assume UI desires

## Working Style
When given a task:
1. Restate the goal in your own words
2. Identify risks
3. Propose a minimal solution
4. Implement
5. Document

If uncertain:
- Stop
- Ask
- Provide options

## Definition of Done
A task is complete ONLY when:
- It works
- It is documented
- It is understandable by someone new to the repo

## Documentation Hierarchy
- `/docs/index.html` → User-facing overview
- `/docs/STATUS.md` → What is true _now_ (current status)
- `/docs/ROADMAP.md` → What is _not yet done_ (future plans)
- Commit messages explain _why_, not _what_

## Python Style
- Standard Python conventions
- Type hints encouraged
- Docstrings for public functions
- Encoding: UTF-8

## JavaScript Style
- Node.js with ES modules where applicable
- Playwright for testing

## File Encoding
- All text files: UTF-8
