# Agent Hub Submission Packet — Use Summary Tables Extractor

Draft content for the "Register in the Agent Hub" AI Pre-Flight item — publishing this
tool to Bayer's federated agent catalog so it's discoverable and reusable. This is not a
form the repo submits automatically; `agent-card.json` has no live registration
integration (see its own `discoverability.note`). Use this file as the copy-paste source
when filling out the actual Agent Hub submission form/UI.

## Basic info

- **Name**: Use Summary Tables Extractor
- **Internal id**: `use-summary-table-extractor`
- **Version**: `0.1.0-pilot`
- **Status**: Pilot (not yet a broad-rollout candidate — see Known Limitations below)
- **Owner**: Karandeep Singh (karandeep.singh@bayer.com), Bayer
- **Last reviewed**: 2026-09-08

## One-line description

Extracts a structured, schema-compliant Use Summary Table (28 columns) from a single
pesticide product-label PDF, for EPA submission — task-based, human-in-the-loop, one
document type in, one table out.

## What it does (for the catalog listing)

Given one pesticide product-label PDF, identifies every crop/use-site + application-method
combination and fills all 28 schema columns (product identity, site, application method,
rate pattern, restrictions), citing the source page for every value. Never invents a
value: `NS` (Not Specified) when the label is silent, `NA` (Not Applicable) when a column
doesn't apply. Output is reviewed by a human on screen (a 3-station guided review flow)
before export to `.xlsx`.

## Scope / not in scope

**In scope**: one label PDF at a time; PDF.js text extraction with Tesseract.js OCR
fallback for scanned pages; on-screen review; `.xlsx` export.

**Explicitly not in scope** (from `agent-card.json`):
- No autonomous submission of results to EPA or any external system
- No write access to anything beyond generating a local/downloadable file
- No batch cross-label reasoning — every label is extracted independently
- No action taken on the extracted data without a human explicitly exporting it

## Autonomy level

Human-in-the-loop. Every row is reviewed before export; AI-proposed chat edits require an
explicit human "Apply" click — nothing is written to the table automatically.

## Underlying model

Anthropic Claude (`claude-sonnet-5`, escalating to `claude-opus-5` for remediation on
hard cases), via Bayer's internal myGenAssist (mGA) gateway. Never called directly from
the browser — relayed through a same-origin server function.

## Security & governance summary

(Full detail: `README.md`'s "AI extraction (pilot)" and "Cyber security guardrails"
sections, `agent-card.json`'s `security` block.)

- Kill switch, per-minute rate limit, daily cost budget, metadata-only audit trail
- Content-Security-Policy restricting network egress to same-origin
- Prompt-injection-resistant system prompt + flag-only content-safety scan
- Agent drift tracking (QC severity + remediation cycles compared over trailing windows)
- **Known gaps, disclosed rather than hidden**: access gated by a shared pilot secret,
  not per-user auth (real fix: Entra Agent ID / DSE-app route); server-side KV/token
  bindings are not scoped per-function; no automated dependency/secret scanning in CI.

## Reusability notes for other teams

- The 28-column schema and extraction rules (`knowledge/schema-reference.md`,
  `knowledge/extraction-rules.md`) are specific to EPA Use Summary Tables for pesticide
  labels — not directly reusable for other document types without rewriting the schema
  and rules.
- The governance layer (`functions/api/_lib/governance.js` — kill switch, rate limiting,
  budget, audit trail, content-safety scan) is genuinely reusable scaffolding for any
  other Bayer pilot relaying calls through mGA; it has no dependency on the pesticide-
  label domain logic.

## Attachments to include with the actual submission

- `agent-card.json` (machine-readable descriptor)
- Link to this repo
- Link to `README.md`

## Compliance criteria checklist (fill in per the Hub's actual form)

- [ ] Owner identified and reachable
- [ ] Security review summary attached (see above)
- [ ] Human-in-the-loop autonomy level declared
- [ ] Known limitations/gaps disclosed
- [ ] Training material available (`TRAINING.md`)
- [ ] Final sign-off recorded (`SIGNOFF.md`) before/alongside submission
