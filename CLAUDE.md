# EventSheet AI — Claude Code Project Instructions

## Identity

**This project is EventSheet AI only.**

- Product: AI-powered Wedding Operations Workbook Generator
- Stack: React + Vite + ExcelJS + localStorage
- Repo: https://github.com/Toamgr/EventSheet-AI-Startup.git
- Branch: main

## Critical Boundary Rules

**NEVER mix this project with HESTIA.**
**NEVER touch HESTIA files, folders, or repositories.**
**NEVER touch HOSPIA files, folders, or repositories.**

HESTIA is a completely separate project at:
`C:\Users\toamg\Desktop\hestia-villa-planner`

If you are ever in doubt about which project you are working on, stop and confirm
with the user before making any changes.

## Git Safety Rules

- Always run `git status` before starting work.
- Always run `git status` after finishing a work session.
- Never commit `node_modules/`, `dist/`, or `outputs/`.
- Never force push without explicit user confirmation.
- Never skip pre-commit hooks.
- Always confirm before pushing to remote.

## Files That Must Never Be Tracked

- `node_modules/`
- `dist/`
- `outputs/`
- `.env`
- `.env.local`
- `.DS_Store`

These are covered by `.gitignore`. Verify with `git status` before every commit.

## Before Development

When starting a development session:

1. Confirm you are in `C:\Users\toamg\Downloads\EventSheet AI Startup`.
2. Run `git status` — working tree must be clean before new work.
3. Run `git branch -vv` — confirm you are on `main` tracking `origin/main`.
4. Run `npm run build` if touching workbook generation or parser logic.
5. Run `npm run qualityCheck` after any change to src/ or scripts/.
6. Run `npm run finalDemoLock` before any commit that touches the demo flow.

## Architecture Snapshot

- `src/main.jsx` — React UI, event registry, workspace panels
- `src/eventStorage.js` — localStorage persistence, eventId lifecycle
- `src/eventsheetWorkbook.js` — parser, workbook builder, ExcelJS output
- `src/seatingIntelligence.js` — seating recommendation algorithm
- `scripts/qualityCheck.mjs` — full workbook QA
- `scripts/finalDemoLockCheck.mjs` — end-to-end demo flow check

## Product Rules (Locked)

- Hebrew-first. All user-facing strings must be Hebrew.
- RTL native. Workbook and UI are right-to-left.
- Excel is the product. The web app is only the compiler.
- No AI auto-seating. The manager decides. The system recommends only.
- No database. No authentication. No CRM. No RSVP platform.
- One-way pipeline: input → parse → workbook → download.
- 6 core workbook tabs (current implementation has 11 — subject to future alignment).
- No feature additions without explicit user approval.

## What NOT to Do

- Do not add features beyond what is explicitly requested.
- Do not refactor code that is not part of the current task.
- Do not open, read, or modify any HESTIA or HOSPIA files.
- Do not create new tabs in the workbook without user approval.
- Do not change the QA scripts without running them first.
- Do not commit without user confirmation.
- Do not push without user confirmation.
