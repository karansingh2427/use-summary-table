---
applyTo: "knowledge/**"
---

# Knowledge Folder Instructions

Reference material for building and checking Use Summary Tables. Read
`knowledge/README.md` first — it defines the priority order that governs everything here.

## Before extracting or checking a table

1. Read `knowledge/training-logs/` — past mistakes and the rules learned from them.
2. Read `knowledge/schema-reference.md` — column definitions and fill rules.
3. Look at `knowledge/golden-examples/` — the format to match.
4. Use `knowledge/unit-conversions.md` for any rate arithmetic.

## The rule that overrides everything

> **Only the source PDF label supplies facts about the product.**

Everything in this folder shapes *format, wording, and arithmetic*. None of it supplies a
rate, PHI, REI, crop, or use. If the label is silent, the answer is `NS` — never
a value borrowed from a golden example, a training log, a similar product, or a web search.

Carrying a value across from a golden example or training log is a **Critical** defect.

## Editing these files

- Keep `knowledge/schema-reference.md` in step with `SCHEMA` in `app/index.html`. `SCHEMA`
  is authoritative; if they diverge, the reference is wrong.
- Keep the priority table in `knowledge/README.md` in step with
  `.github/agents/QC-agent.agent.md`.
- Add a row to the relevant subfolder README whenever you add a file.
- Do not paste large excerpts of a customer label into any file here — cite a page instead.

## Boundaries

- Nothing in this folder is loaded by the app at runtime. Never `fetch` or import these
  files from `app/index.html` — that would breach the offline boundary in `specs/PRD.md` §4.
- Web search is permitted only for unit-conversion factors and EPA crop-group membership.
  Never to look up label data, and never by pasting label contents into a query.
