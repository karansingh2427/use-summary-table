# Use Summary Tables Extractor

## Problem

**Purpose: preparing the Use Summary Table required for EPA submission.** Pesticide label
PDFs contain the use information that table must document — scattered across narrative
sections, rate tables, crop tables, and appendices, not in the structured, queryable format
EPA submission requires.

**Manual extraction is:**
- **Time-consuming**: 45–90 min per label
- **Error-prone**: Easy to miss footnotes, appendices, or conditional rates
- **Inconsistent**: Different analysts may interpret the same label differently

**This tool solves the problem** by automating the extraction of every crop, use site, and
application method into a 28-column schema-compliant table, with human verification built in.

The output is ready **for EPA submission** or to load into regulatory databases or analysis
systems — **no reformatting needed**.

## Solution

A browser-based prototype that extracts **Use Summary Tables** from pesticide label PDFs.
Upload one or more labels, click **Run Extraction**, and get a complete, schema-compliant table
of every crop and every use — rendered on screen and downloadable as Excel (`.xlsx`).

## How to run

No build step and no server required:

```sh
open app/index.html
```

Or double-click `app/index.html` in Finder. PDF.js and SheetJS are bundled locally in
`app/vendor/`, so the app runs fully offline — no internet connection required.

## Architecture

The extractor uses a **regex + heuristic pipeline** running entirely client-side:

```mermaid
graph LR
    A["PDF Upload<br/>(one or more)"] -->|PDF.js| B["Text Extraction<br/>(per-page text)"]
    B -->|Regex Patterns| C["Field Parser<br/>(60+ patterns)"]
    C -->|Derivation Rules| D["Schema Mapping<br/>(28 columns)"]
    D -->|Confidence Scoring| E["Validation<br/>(High/Med/Low)"]
    E -->|Human Review| F["Inline Editing<br/>(double-click cells)"]
    F -->|SheetJS| G["Export<br/>(Excel/CSV)"]
    
    style A fill:#e1f5ff
    style B fill:#fff3e0
    style C fill:#f3e5f5
    style D fill:#e8f5e9
    style E fill:#fce4ec
    style F fill:#fff9c4
    style G fill:#e0f2f1
```

**Key Components:**
1. **PDF.js (bundled)**: Extracts text layer from PDFs; reports pages with no text for OCR
2. **Regex Patterns**: 60+ field-specific patterns recognize rates, timings, restrictions, equipment
3. **Derivation Rules**: Computes derived fields (e.g., `Max # Apps/Yr = Total Rate/Yr ÷ Single Rate`)
4. **Confidence Scoring**: Scores each row High/Medium/Low based on field fill percentage
5. **Human Review UI**: Inline editing, page references, source text expansion, live search
6. **SheetJS (bundled)**: Generates Excel files; includes audit columns (Page, Source, Confidence)

**No external APIs, no backend server, no authentication — everything runs in the browser.**
(True for this regex/heuristic path. The AI extraction pilot and background-job mode below
both route through small Cloudflare backends — see their own sections.)

### Two extraction paths, not one

This repo actually holds two independent ways to extract a table, and they don't share logic:

1. **The browser app above** — a static regex/heuristic engine. Fast, offline, deterministic,
   but it never reads `knowledge/` at runtime (see `knowledge/README.md`), so it can't apply
   prose rules like "quote the label verbatim" or "route drift text to its own restriction
   column." Lessons from `knowledge/training-logs/` only reach it when someone manually ports
   them into a regex pattern.
2. **The Copilot agent workflow** — `orchestrator-agent` → `extraction-main-agent` →
   `QC-agent`, run via GitHub Copilot Chat (see `.github/agents/`). `extraction-main-agent`
   reads each label PDF itself and builds the table through its own reasoning against
   `knowledge/extraction-rules.md` and `knowledge/derivation-rules.md` — this is the path that
   mirrors a human analyst's judgment (and the manual Gemini/Copilot-chat extraction sessions
   this project started from). Use it when the regex app's precision on a field (see the table
   below) isn't good enough for the label in front of you.

## Results

**Current Extraction Performance (v9)**

| Metric | Value |
|--------|-------|
| **Overall Field-Level Precision** | 82% |
| **Row Recall** | 100% (156/156 rows matched) |
| **Schema Compliance** | 100% (27/27 columns) |
| **Test Set** | 5 pesticide labels, 156 uses |

**Precision by Field (top challenges):**
| Field | Precision | Notes |
|-------|-----------|-------|
| A.I. Max Single Rate | 98% | Strongest field; standard rate format |
| Max # Apps/Yr | 0-5% | Depends on Total Rate/Yr extraction (in progress) |
| Equipment | 70% | Multi-line equipment descriptions |
| Drift Restrictions | 14% | Multi-line buffers, complex formatting |
| Soil Restrictions | 14% | Nested condition statements |
| Geographic Restrictions | 66% | Partial capture of multi-line text |
| Additional Information | 17% | Unstructured, inherently difficult |

**Performance Improvements (recent fixes):**
- Multi-line text capture: Fixed Drift/Soil patterns to span line breaks
- Equipment extraction: Extended pattern lengths for full chemigation sentences
- Rate derivation: Added alternative patterns for "Total Rate per Year" formats
- UI clarity: Collapsible warnings panel (QC info without visual clutter)

See `benchmark/score.py` for methodology. Ground truth in `samples/expected/*.csv`.

## How to use

1. Drag PDF labels onto the drop zone (or click to browse). Multiple files are supported.
2. Click **Run Extraction**. Progress and per-page text appear in the log.
3. Review the Use Summary Table — grouped by source file, scrollable, with live search,
   confidence badges, and column sorting.
4. Correct anything wrong: **double-click a cell** to edit it. Click the **▸** on a row to see
   the source text and page it came from.
5. Export with **Excel (.xlsx)**.

## Review features

The parser is heuristic, so the app is built for human verification:

- **Confidence badges** — every row is scored High / Medium / Low from how many fields matched.
  Filter to "Low only" to review the weakest rows first.
- **Page & source references** — each row records its page number; expanding a row shows the
  exact label text it came from.
- **Coverage warnings** — crops detected but barely described are flagged in a panel above the
  table, so under-read sections are obvious.
- **Inline editing** — corrected cells are marked and flow through to both exports.

## AI extraction (pilot)

The "🤖 Extract with AI" toggle (on by default) routes a label's full text through
`functions/api/extract.js`, a Cloudflare Pages Function, which has the model read the
label and apply `knowledge/extraction-rules.md` / `derivation-rules.md` directly instead
of pattern-matching regex. This generalizes to label layouts the regex heuristics don't
cover, at the cost of needing network access and a few seconds of latency per label.

**⚠️ If MGA credits are exhausted:** Uncheck the toggle to use the regex/heuristic engine
(82% field-level precision, instant, offline). Alternatively, use the **`@extraction-main-agent`**
in GitHub Copilot Chat, which runs on your Copilot subscription rather than Bayer's MGA gateway
— see [ALTERNATIVES.md](ALTERNATIVES.md) for details.

**This is a small pilot, not a production rollout.** The Function forwards to Bayer's
internal myGenAssist (mGA) gateway using one shared mGA token supplied by a single
colleague, stored only as an encrypted Cloudflare Pages environment variable — never in
this repo. Bayer's own guidance is that sharing one person's mGA token this way is
acceptable only for a handful of colleagues (2-3), not a broad rollout. Scaling this to
the wider team needs the DSE-app route instead (a real service-account credential, an
ITLM governance review at `go/beat`, and an Agent Hub listing) — a separate, larger
undertaking.

### Monitoring, audit trail & cost controls

Both AI paths (the interactive relay above and the background-job worker below) share a
small governance layer (`functions/api/_lib/governance.js`, duplicated at
`worker/src/governance.js`) backed by a second KV namespace, `AUDIT_LOG`:

- **Kill switch** — a single KV flag that disables both AI paths in seconds, no redeploy:
  `wrangler kv key put --namespace-id=<AUDIT_LOG_ID> "killswitch:enabled" "true"` (and
  optionally `"killswitch:reason" "..."` for the message shown to users). A request in
  flight when it's flipped still completes; every request after that gets a clear 503
  until it's cleared with `wrangler kv key delete --namespace-id=<AUDIT_LOG_ID>
  "killswitch:enabled"`. Fails open on a KV outage, same as the other checks below.
- **Rate limiting** — a best-effort per-minute cap (`RATE_LIMIT_PER_MINUTE`, default 20)
  on both `/api/extract` and `/api/jobs`, to catch a runaway loop or accidental hammering
  of the shared mGA token. KV has no atomic increment, so this is approximate, not an
  adversarial-proof guarantee.
- **Daily cost budget** — a cumulative daily token/cost counter (`DAILY_BUDGET_USD`,
  default $15 — a placeholder; tune it to the shared token's real monthly allowance).
  Once exceeded, both paths refuse new work with a clear message rather than silently
  draining a colleague's personal mGA budget.
- **Audit trail** — one metadata-only record per call (timestamp, source, status,
  duration, estimated token usage/cost — never raw label text or PII), retained for
  `AUDIT_TTL_SECONDS` (default 180 days, a placeholder pending a real retention policy).
  Read it via `wrangler kv key list --binding=AUDIT_LOG` — there's no viewer UI.
- **Content-safety flag** — a coarse, flag-only scan for prompt-injection-style phrases
  in incoming label text. A match never blocks extraction (false positives on real labels
  are likely); it's recorded on that call's audit record for human review. The real
  defense stays the existing human-in-the-loop row review before export.
- **Model escalation** — extraction (stage 1) and independent QC (stage 2) run on
  `claude-sonnet-5`; if QC comes back Critical or High, the bounded remediation loop
  (stage 3) escalates to `claude-opus-5` for its correction + recheck calls — that QC
  verdict is already the pipeline's built-in signal that a label is a hard case, so only
  those calls pay Opus's price rather than every label. Cost estimates are priced per
  call at whichever model actually ran it (`estimateCostUsd(usage, model)`), not one
  blended Sonnet-only rate, so the daily budget above stays accurate for a file whose
  remediation escalated.

None of this fixes the pilot gate itself being a shared secret visible in client-side JS
(`PILOT_GATE_HEADER_VALUE` in `app/index.html`) — that's a real-auth gap (Entra Agent ID)
that needs the DSE-app route above, not something a KV counter can close.

**See [DEPLOYMENT.md](DEPLOYMENT.md) for full Cloudflare Pages setup instructions.**

### Agent drift tracking

Bayer's AI Pre-Flight "Golden Standard & Guardrails" checklist asks for agent drift to be
detected and corrected over time — scope creep and output degradation. For this tool
(one label in, one table out, no memory across documents), the concrete signal is the
independent QC agent's own severity verdict (`Clean`/`Low`/`Medium`/`High`/`Critical`) and
how many remediation cycles it took to resolve, per document — both already computed by
the pipeline, and now written into the same `AUDIT_LOG` trail as everything else above:
the background-job worker includes `qcOverall`/`remediationCycles` on its existing audit
record, and the interactive path reports the same fields from the browser via a small new
endpoint, `functions/api/qc-summary.js` (gated by the same pilot secret; no kill-switch/
budget checks since it isn't an mGA call and costs nothing).

Run `python3 scripts/check-drift.py` to compare a recent trailing window (default: last 7
days) against the window before it — severity mix, average remediation cycles, and
content-safety flag counts — and print a "review needed" line if High/Critical share or
remediation cycles rose materially. This is on-demand for this pilot: no schedule, no
alerting channel, and no automatic action — it's a flag for a human to look into (an
mGA-side model change, a knowledge-file regression, an unusual batch of hard labels), and
correction always stays a human decision, same as the QC gate itself.

### Cyber security guardrails

Bayer's AI Pre-Flight checklist also asks for protection against prompt injection, data
exfiltration, and unauthorized access, plus least-privilege scoping. Some of this was
already true by construction; this section makes it explicit, plus closes one concrete
gap (no CSP) and documents what's knowingly out of scope for a pilot this size.

- **Prompt injection** — the extraction system prompt (identical in `app/index.html` and
  `worker/src/pipeline.js`) now explicitly instructs the model to treat label text as data
  to extract from, never as instructions to follow, in addition to the existing
  never-invent-a-value framing. This layers on top of two mitigations that already
  existed: the content-safety flag above (flags a suspicious phrase for human review,
  never blocks), and the interactive chat feature's `propose_row_edit` tool, which can
  never write to a row directly — every proposed edit requires an explicit human Apply
  click. No single point of failure; correction stays human at every layer.
- **Data exfiltration** — both `_headers` files now set a Content-Security-Policy, most
  importantly `connect-src 'self'`: any injected/rogue code (from a compromised
  dependency or a successful prompt injection) cannot make the browser call out to an
  attacker-controlled origin. This was already close to true — the app never calls
  Bayer's mGA gateway directly from the browser (every AI call is relayed through
  same-origin `/api/extract`, so no per-user mGA credential is ever exposed client-side),
  audit records are metadata-only and never contain raw label text, and there are zero
  third-party/CDN scripts anywhere — everything under `app/vendor/` is a committed local
  file. The CSP also sets `script-src`/`style-src 'self' 'unsafe-inline'` (needed for this
  app's single inline `<script>`/`<style>` block — no build step, see Design Decision #2
  below), `object-src 'none'`, `base-uri 'none'`, `frame-ancestors 'none'`, and
  `form-action 'self'`. See `app/vendor/README.md` for a note on how this CSP interacts
  with Tesseract.js's default CDN fetch for trained-data.
- **Unauthorized access** — unchanged from the existing, already-documented caveat just
  above: the pilot gate (`PILOT_GATE_HEADER_VALUE`/`PILOT_GATE_SECRET`) is a shared static
  secret, an accepted stopgap for a 2-3 person pilot, not real per-user authentication. A
  broader rollout needs the DSE-app route with an Entra Agent ID managed identity first.
- **Least privilege** — the browser itself holds no credentials at all (no `MGA_TOKEN`, no
  KV access) — every privileged operation happens server-side. Within the server side,
  though, both the Pages Functions project and the standalone Worker each hold the full
  `JOBS` + `AUDIT_LOG` KV binding pair and their own `MGA_TOKEN` copy — Cloudflare Pages
  Functions share one binding set project-wide, so finer per-function scoping (e.g.
  `qc-summary.js` only ever needs `AUDIT_LOG`) would require splitting functions into
  separate Worker projects. Documented as a known gap, not solved — out of scope at this
  pilot's scale.
- **Dependency / secret scanning** — no `package.json` exists anywhere (pure vanilla
  JS/HTML/CSS, no npm dependency tree to scan); the vendored libraries under `app/vendor/`
  (PDF.js, SheetJS, Tesseract.js) have no automated version/CVE tracking — updating them is
  a manual responsibility. No secret-scanning tool runs in CI. Documented as an accepted
  gap for this pilot's scale, same treatment as the pilot-gate secret above, rather than
  adding new tooling.
- A clarifying note on deploy targets: `.github/workflows/deploy.yml` deploys this repo to
  GitHub Pages, a secondary/legacy target from earlier in this project's life. The live
  production site is Cloudflare Pages (`app/` + `functions/api/*`) plus the standalone
  Worker (`worker/`), both auto-deployed from a `git push` via Cloudflare's own git
  integration — that's the deploy path this and the sections above actually describe.

## Background jobs (batch mode)

The in-tab AI pipeline above needs the browser tab to stay open for the whole run — fine for
one or two labels, awkward for a large batch. **Run in background** (next to **Run Extraction**)
submits the same AI pipeline to run server-side instead, so you can close the tab and come
back later:

1. Click **Run in background**. Each document's extracted text is POSTed to `/api/jobs`, which
   queues one Cloudflare Queue message per file and returns immediately.
2. The page switches to a `?job=<jobId>` status view and polls `/api/jobs/<jobId>` every ~5s,
   showing each file's stage (extraction → validate/correct → QC → remediate).
3. A standalone Cloudflare Worker (`worker/`, a separate deployable from the Pages project)
   consumes the queue and runs the exact same multi-stage pipeline as the in-tab path
   (`worker/src/pipeline.js` is a ported copy of the relevant functions in `app/index.html`),
   writing progress and final rows/QC report to a shared KV namespace as it goes.
4. Reopen the `?job=<jobId>` URL any time (this browser also remembers the last job you
   submitted and shows a banner linking back to it) — once every file is done, results render
   through the same QC-gate and review-flow UI as a normal run.

Job records (input text, per-file status, rows, QC report) expire from KV after 7 days.

**This needs one-time Cloudflare dashboard setup beyond deploying the code** — a KV namespace,
a Queue, the Pages project's "v2 build system" toggle (so its root `wrangler.toml` bindings take
effect), and the `worker/` project deployed as its own Worker with its own `MGA_TOKEN` secret.
See the comments at the top of `wrangler.toml` and `worker/wrangler.toml` for the exact steps.

## Output schema

The 28-column Use Summary Table defined in `knowledge/UST_definitions.txt`, in the structure
required for EPA submission. Column meanings are in `knowledge/schema-reference.md`; `SCHEMA`
in `app/index.html` is authoritative.

**One row = one use + one use site + one application method.** A crop with both a foliar and
a soil application produces two rows, because the rates, intervals, and restrictions differ.

| Group | Columns |
|---|---|
| Product | `Reg. #/File Sym` · `Physical Form` · `Product Name (PBN)` |
| Site | `Use` · `Use Site` |
| Application method | `App. Target` · `App. Type` · `App. Equipment` · `App. Timing (Site Status)` · `App. Timing (other)` |
| Rate pattern | `App Rate (lb ai/A)` · `A.I. Max Single Rate/App.` · `Max # Apps/C.C.` · `A.I. Max Total Rate/C.C.` · `Max # Apps/Yr.` · `A.I. Max Total Rate/Yr.` · `MRI (days)` · `REI` · `PHI (days)` · `PPE` · `Additional Information` · `Max No. of CC/yr` |
| Restrictions | `Geographic` · `Drift` · `Soil` · `On-field Non-target Species` · `Additional for Use/Use Site` |

Anything the label does not state is written as `NS`; columns that do not apply read `NA`.
Cells are never blank, and **values are never inferred**.

Exports also include `Source File`, `Page`, and `Confidence` review columns.

The Excel file contains an **All Uses** sheet (all labels combined) plus one sheet per label.

## OCR for scanned labels

Image-only PDFs are handled with Tesseract.js, bundled locally rather than called as an API.
Drop `tesseract.min.js` into `app/vendor/` to enable it — see `app/vendor/README.md`.
Without it, the app still runs and reports pages that have no text layer.

## Project structure

```
app/index.html                  The entire application (UI + parser + export)
app/vendor/                     Locally bundled OCR library (optional)
functions/api/                  Cloudflare Pages Functions: AI extraction relay + job submit/status
worker/                         Standalone Cloudflare Worker: background-job queue consumer
wrangler.toml                   Pages project bindings (KV + queue producer)
specs/PRD.md                    Requirements R1–R17
specs/Tasks.md                  Implementation checklist
specs/Demo.md                   Five-minute walkthrough script
tests/test-plan.md              92 tests with requirement traceability
tests/manual-checklist.md       66 hand-run tests covering current regression scope
samples/README.md               Test-label set, sources, and accuracy checklist
samples/expected/*.csv          Hand-checked expected output for verification
```

## Maintaining knowledge files

The app embeds knowledge files (`extraction-rules.md`, `derivation-rules.md`, etc.) as
JavaScript constants so it can pass them to the LLM without needing a backend. After editing
any file in `knowledge/`, sync them into the app:

```bash
python3 scripts/sync-knowledge.py
```

Then commit the updated `app/index.html` and deploy. This is required because there's no
build step — the app runs directly from the HTML file.

**See [DEPLOYMENT.md](DEPLOYMENT.md) for Cloudflare Pages deployment instructions.**

## Testing

There is no automated test runner — the app is one HTML file with no build step. Two documents
cover verification, and they complement each other:

- **`tests/test-plan.md`** — 82 numbered tests grouped by category, with a traceability
  table proving every requirement is covered. Use this for a formal test run and sign-off.
- **`tests/manual-checklist.md`** — behaviour-named checkboxes for practical reruns after each change.
  Current regression scope explicitly includes BYI seed-treatment extraction, Plenexos non-empty
  extraction, keyboard source-toggle behavior, OCR startup missing-dependency notice, and mobile
  viewport reflow checks.
  Use this for
  quicker regression passes after a change.

Both need the sample label PDFs described in `samples/README.md`.

## Design Decisions

### 1. Why Regex + Heuristics, Not Machine Learning?

**Decision**: Client-side regex patterns over cloud LLM API or fine-tuned model.

**Rationale**:
- **No backend required** — stays in-browser, no server deployment
- **No API costs or latency** — extraction is instant
- **No external dependencies** — PDF.js and SheetJS are bundled locally, so the app is fully
  offline-capable
- **Deterministic output** — regex patterns produce consistent results
- **Regulatory compliance** — no data leaves the user's computer
- **Extensible** — new patterns added without retraining

**Trade-off**: ~82% field-level precision (vs. 95%+ with fine-tuned ML). Acceptable because:
- Confidence scoring highlights uncertain extractions (High/Medium/Low)
- Coverage warnings flag missed crops
- Inline editing allows 100% correction before export
- User retains full audit trail (page numbers, source text)

### 2. Why One HTML File, No Build Step?

**Decision**: Single `app/index.html` with inline HTML, CSS, and JavaScript.

**Rationale**:
- **Zero friction** — open a file, it works (no npm install, webpack, etc.)
- **Easy distribution** — email a file, run anywhere
- **No production complexity** — no CI/CD, no deployment pipeline
- **Team collaboration** — changes are visible in Git as diffs
- **Browser compatibility** — runs in any modern browser

**Trade-off**: Code is ~3700 lines in one file. Mitigated by:
- Clear section comments tying code to requirements
- SCHEMA as single source of truth for columns
- Consistent pattern naming (e.g., `FIELD_PATTERNS.driftRestrictions`)

### 3. Why a 28-Column Schema?

**Decision**: Fixed schema defined in `knowledge/UST_definitions.txt`.

**Rationale**:
- **Built for EPA submission** — matches EPA Form 8570 and standard industry tables; this is
  the schema EPA submission requires, not an arbitrary internal format
- **Queryable** — enables consistent database loading
- **Unambiguous** — no interpretation of column meanings
- **Derivable** — some columns computed from others (e.g., Max # Apps/Yr from Total Rate/Yr ÷ Single Rate)

**Trade-off**: New use patterns may not fit schema. Mitigated by:
- "Additional Information" column captures arbitrary label text
- "Restrictions" columns handle edge cases
- NS (Not Stated) / NA (Not Applicable) fill rules prevent blanks

### 4. Why Confidence Scoring, Not Just Pass/Fail?

**Decision**: Three-level confidence (High/Medium/Low) based on field fill percentage.

**Rationale**:
- **Realistic** — rarely 100% perfect; transparency about uncertainty
- **Actionable** — users filter "Low only" to review risky extractions first
- **Audit trail** — exported Excel includes confidence for downstream systems

**Trade-off**: Adds ~30 lines of scoring logic. Cost is low; benefit is high (directs review effort).

### 5. Why Collapsible Warnings, Not Always Visible?

**Decision**: QC warnings (missing crops, sparse rows) collapse by default.

**Rationale**:
- **Reduced clutter** — users see results table first
- **Information preserved** — expand to see details
- **Click to review** — engagement is explicit, not passive

**Trade-off**: Users may miss warnings. Mitigated by:
- Clear count in header ("QC Warnings — 18")
- Visual affordance (▸ arrow icon)
- Live app shows them on every run

## Limitations

### Extraction Accuracy
- **Crop detection**: Limited to a fixed vocabulary (`CROP_TERMS` in `app/index.html`). 
  Crops outside this list will not be recognized — extend it for new crops.
- **Multi-line text**: Drift and soil restrictions often span multiple lines in labels; 
  patterns have been optimized but still miss ~15% of complex cases.
- **Unstructured fields**: "Additional Information" has high variance in label formatting; 
  extraction typically returns 10–30% of relevant text.
- **Heuristic limitations**: Rates embedded in narrative (not tables) or with non-standard abbreviations 
  may not match patterns. Always verify against the source label.

### Prototype Scope
- **Not for regulatory submission**: Output is intended for internal review and analysis. 
  Always compare extracted table against source label before submitting to regulators.
- **Human verification required**: Confidence scoring and coverage warnings show where to look first, 
  but every row should be spot-checked against the PDF.
- **Session-focused workflow**: Results are stored per-run (browser session). To persist results 
  across sessions, export to Excel/CSV before closing the browser.

### Technical Constraints
- **Text-layer only**: Tesseract.js (bundled OCR) must be manually enabled; without it, 
  image-only PDFs will not extract text. See `app/vendor/README.md`.
- **Browser storage**: Saved runs use browser local storage (typically ~10 MB limit). 
  Large extraction batches should be exported regularly.
- **Fully offline**: PDF.js and SheetJS are bundled locally in `app/vendor/` — no CDN, no
  internet connection required at any point.

### Adaptive Model Selection
- **Available models**: System defaults to Claude Sonnet 4.5 for agent-based extraction tasks; 
  falls back to Claude Opus or GPT-4 for complex cases. New models can be added via `.github/ADD-NEW-MODELS.md`.
- **Not applicable to the app itself**: The Extractor uses regex, not LLMs. Model selection applies 
  only to Copilot agents for batch extraction, QC, or testing workflows.

## Next Steps

**To improve precision:**
- [ ] Increase "Max # Apps/Yr" extraction (depends on Total Rate/Yr pattern improvements)
- [ ] Refine multi-line restriction patterns (Drift, Soil, Geographic)
- [ ] Add synonym mapping (e.g., "foliar spray" → "Foliar")
- [ ] Expand crop vocabulary for specialty crops

**To expand scope:**
- [ ] Fine-tune or add LLM-based QC agent for high-precision use cases
- [ ] Batch extraction mode (orchestrator workflow)
- [ ] API wrapper for integration with downstream systems

**For team adoption:**
- [ ] See `docs/USER-GUIDE.md` for end-user documentation
- [ ] See `.github/copilot-instructions.md` for agent-based extraction workflows
- [ ] See `specs/Demo.md` for a 5-minute walkthrough script

