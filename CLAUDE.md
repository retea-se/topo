# CLAUDE.md — Project Operating Manual

This file defines HOW Claude should think and behave in this repository.

---

## Session Startup

**IMPORTANT**: At the start of each session, activate the Serena MCP server for this project:

```
mcp__plugin_serena_serena__activate_project(project="topo")
```

This enables semantic code analysis tools. Serena memories contain project-specific context.

---

## Project Identity

This is a **cartographic product**, not a demo project.

The goal is to generate:

- High-quality, print-ready topographic maps
- Deterministic outputs
- A system that can be explained to non-developers

Technical correctness serves visual and conceptual clarity.

---

## Core Architecture

Two parallel pipelines with shared data:

### Demo A — Interactive / Exploratory

- MapLibre + Vector Tiles + Playwright
- Used for:
  - Theme iteration
  - Visual exploration
  - Perspective / pitch experiments
- Output may vary slightly pixel-wise

### Demo B — Print Authority

- PostGIS + Mapnik
- Used for:
  - Final exports
  - Deterministic rendering
  - Production-grade outputs
- Same inputs MUST produce identical bytes

Demo B is the reference implementation.

---

## Absolute Rules

1. **Never break a working export**
2. **Never optimize before documenting**
3. **Never mix roadmap with status**
4. **Never silently change visual output**

---

## Documentation Hierarchy

- `/docs/index.html` → User-facing overview
- `/docs/CURRENT_STATUS.md` → What is true _now_
- `/docs/ROADMAP.md` → What is _not yet done_
- Commit messages explain _why_, not _what_

---

## Rendering Constraints

- EPSG:3857 everywhere
- No contour labels
- Print mode defaults to label-free
- Scale is only valid when pitch = 0
- Attribution must always be present in print outputs

---

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

---

## What NOT to Do

- Do not add features “while you’re here”
- Do not regenerate data unless asked
- Do not refactor working pipelines
- Do not assume UI desires

---

## Definition of Done

A task is complete ONLY when:

- It works
- It is documented
- It is understandable by someone new to the repo

---
