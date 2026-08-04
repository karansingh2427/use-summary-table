# Copilot Instructions — Use Summary Table Extractor

## 1 · Project Overview

This is a **Use Summary Table Extractor** prototype: a single-page web app that reads pesticide
label PDFs and extracts every crop and every use into a schema-compliant table, viewable on
screen and downloadable as `.xlsx`.

| Where | What |
|---|---|
| `specs/PRD.md` | Requirements (R1–R17) — the source of truth for scope |
| `specs/Tasks.md` | Task checklist with "Satisfies" and "Done when" lines |
| `specs/Demo.md` | Five-minute walkthrough script for showing the prototype |
| `app/index.html` | The entire web app — HTML, CSS, and JS in one file |
| `tests/manual-checklist.md` | Hand-run tests, one or more per requirement |
| `tests/test-plan.md` | Numbered test plan with requirement traceability |
| `samples/` | Test label PDFs and hand-checked expected output |
| `knowledge/` | Reference material for building/checking tables — see its README for priority order |
| `docs/USER-GUIDE.md` | Plain-language guide for end users |

The app runs by opening `app/index.html` directly in a browser. No build step, no server.

**`knowledge/` is reference material only.** It is never loaded by the app at runtime, and
nothing in it supplies facts about a product — only the source label PDF does that.

## 2 · Model Selection for Agent Tasks

When invoking Copilot agents for extraction, QC, and testing work, **model selection is
automatic** based on task type:

| Task | Primary Model | Fallback | Why |
|------|---|---|---|
| **PDF Extraction** (`extraction-main-agent`) | Claude Sonnet 4.5 | Claude Opus | Best at regulatory text parsing, complex workflows, structured output |
| **Quality Control** (`QC-agent`) | Claude Sonnet 4.5 | Claude Opus | Excels at accuracy verification and multi-field validation |
| **Orchestration** (`orchestrator-agent`) | Claude Sonnet 4.5 | Claude Opus | Handles two-stage workflows with state coordination |
| **Code Review** (`review-agent`) | Claude Sonnet 4.5 | GPT-4 | Strong pattern recognition and technical feedback |
| **Testing** (`test-agent`) | Claude Sonnet 4.5 | Claude Opus | Logical test design and edge-case reasoning |
| **Documentation** (`docs-agent`) | Claude Sonnet 4.5 | Claude Opus | Clear technical writing and structure |

Each agent automatically selects its configured model. You don't need to specify a model;
it happens transparently based on the agent you invoke.

## 3 · How to Make Changes

- **Check `specs/PRD.md` first.** Confirm the change maps to an existing requirement.
- **Work one task at a time.** Small, self-contained edits — not sweeping rewrites.
- **Update `specs/Tasks.md`** when work is finished: change `[ ]` to `[x]`, and add a short
  note if the outcome differs from the "Done when" line.
- **Test by opening `app/index.html` in a browser**, uploading a sample PDF, and clicking
  **Run Extraction**. Confirm the table renders and the Excel download works.
- **Keep the schema centralized.** `SCHEMA` in `app/index.html` is the single source of truth
  for columns; never hard-code column names elsewhere.

## 4 · Do NOT Do These Things

- ❌ No backend server or database — everything stays client-side.
- ❌ No login, authentication, or user accounts.
- ❌ No external services or third-party APIs.
- ❌ No secret keys, API keys, tokens, or passwords in the code.
- ❌ No frameworks like React, Vue, Angular, or Svelte — plain HTML/CSS/JS only.
  (PDF.js and SheetJS via CDN are the only permitted libraries.)
- ❌ No changes that aren't traceable to a requirement in `specs/PRD.md`.

## 5 · When Asked to Add a New Feature

1. **Ask first:** should this be added to `specs/PRD.md` as a new requirement?
2. **Add a task** to `specs/Tasks.md` with a `Satisfies:` line and a `Done when:` line.
3. **Implement** it following the normal process in Section 2, then mark the task complete.

Never skip straight to implementation for work that isn't already in the specs.
