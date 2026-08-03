# Use Summary Tables Extractor

A browser-based prototype that extracts **Use Summary Tables** from pesticide label PDFs.
Upload one or more labels, click **Run Extraction**, and get a complete, schema-compliant table
of every crop and every use — rendered on screen and downloadable as Excel (`.xlsx`).

## How to run

No build step and no server required:

```sh
open app/index.html
```

Or double-click `app/index.html` in Finder. PDF.js and SheetJS load from a CDN, so an internet
connection is needed on first load.

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

## Output schema

The 27-column Use Summary Table defined in `knowledge/UST_definitions.txt`. Column meanings
are in `knowledge/schema-reference.md`; `SCHEMA` in `app/index.html` is authoritative.

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
specs/PRD.md                    Requirements R1–R17
specs/Tasks.md                  Implementation checklist
specs/Demo.md                   Five-minute walkthrough script
tests/test-plan.md              92 tests with requirement traceability
tests/manual-checklist.md       66 hand-run tests covering current regression scope
samples/README.md               Test-label set, sources, and accuracy checklist
samples/expected/*.csv          Hand-checked expected output for verification
```

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

## Limitations

- Crop detection uses a fixed vocabulary (`CROP_TERMS` in `app/index.html`) covering common
  crops and EPA crop groups — extend it for crops outside that list.
- Extraction is heuristic and intended for prototype review, not regulatory submission.
  Always verify output against the source label; the confidence flags and coverage warnings
  show where to look first.
- Results are intentionally session-focused: run extraction, review, fix, and export.

