# AGENTS.md

Instructions for the GitHub Copilot coding agent working autonomously in this repository.

## 1 · Project Context

**Use Summary Tables Extractor** — a prototype web app that reads pesticide label PDFs and
extracts every crop and every use into a schema-compliant table, viewable on screen and
downloadable as `.xlsx` or `.csv`.

- **Frontend-only.** No backend, no database, no server process.
- **Requirements live in `specs/PRD.md`** (R1–R17). Every change must trace to a requirement.
- **Task checklist is `specs/Tasks.md`** — update it when work is finished (`[ ]` → `[x]`).
- **Demo walkthrough is `specs/Demo.md`** — keep it in step with the UI when you change it.
- The whole app is `app/index.html`. Sample labels and expected output live in `samples/`.

## 2 · Build and Test

**There is no build step.** Do not add one — no bundler, no transpiler, no package manager.

To verify a change:

1. Open `app/index.html` directly in a browser (`open app/index.html`).
2. Upload a PDF from `samples/` and click **Run Extraction**.
3. Confirm the core flow still works:
   - Results table renders, grouped by source file
   - Search, confidence filter, and column sorting respond
   - Row expansion (**▸**) shows page and source text
   - Double-click cell editing saves and marks the cell
   - Excel and CSV downloads produce valid files
   - Saved runs persist across a page reload; compare and merge work
4. Check the browser console for errors before opening a PR.

For anything beyond a trivial change, work through the relevant sections of
`tests/manual-checklist.md` and record the outcome in the PR description.

## 3 · Coding Standards

- **Vanilla JavaScript only.** No React, Vue, Angular, Svelte, jQuery, or build tooling.
- **Keep all code in `app/index.html`** — HTML, CSS, and JS stay in that one file.
- **`SCHEMA` is the single source of truth** for columns. Never hard-code column names elsewhere.
- Match the existing style: 2-space indent, `const`/`let`, template literals, and section
  banner comments tying code back to its task and requirement.
- Escape user/PDF-derived content with the existing `esc()` helper before inserting into HTML.
- Make small, self-contained changes — one task per PR.
- **Follow `.github/copilot-instructions.md`**; it takes precedence over this file.

## 4 · What NOT To Do

- ❌ Do not add backend services, APIs, or a database.
- ❌ Do not add authentication, login, or user accounts.
- ❌ Do not install packages or add a `package.json` / `node_modules`.
- ❌ Do not add secret keys, API keys, tokens, or passwords.
- ❌ Do not call external services at runtime. PDF.js and SheetJS via CDN are the only
  permitted remote libraries; Tesseract.js must stay bundled locally in `app/vendor/`.
- ❌ Do not implement features that aren't already in `specs/PRD.md` — open an issue proposing
  the requirement first.

## 5 · Pull Request Expectations

- State which requirement (R#) and task the change satisfies.
- Update `specs/Tasks.md`, and add a short note if the outcome differs from the "Done when" line.
- Note anything you could not verify — for example, behaviour needing a real label PDF that
  isn't committed to `samples/`.
