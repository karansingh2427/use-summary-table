# Use Summary Tables Extractor — Task Checklist

Requirement IDs map to the features in `specs/PRD.md`:
R1 = PDF upload · R2 = Run Extraction button · R3 = Full-document extraction · R4 = Schema-compliant output · R5 = On-screen results table · R6 = Excel download
R7–R17 = review and trust features · R18–R22 = extraction fidelity (see `knowledge/extraction-rules.md`) · R25 = Presentable spreadsheet formatting · R26 = Runtime QC gate before rendering · R27 = QC auto-remediation before release · R28 = Three user approval stations before final release

---

[x] Task 1: Build the page shell and upload control in `app/index.html`
    Satisfies: R1, R2
    Done when: Opening `app/index.html` in a browser shows the app title, a file input / drop zone that accepts multiple PDFs, a list of selected file names, and a disabled-until-files-selected "Run Extraction" button.

[x] Task 2: Define the Use Summary Table schema in code
    Satisfies: R4
    Done when: A single `SCHEMA` array exists and a helper returns a blank row with every field set to the "not stated" value.
    Note: Realigned to the real 27-column UST schema (Reg #/File Sym … Additional Restrictions) per `knowledge/UST_definitions.txt`. Fill values are now `NS` / `NA`, not "Not specified".

[x] Task 3: Read full PDF text with PDF.js
    Satisfies: R3
    Done when: Clicking "Run Extraction" logs the extracted text for every page of each uploaded PDF, and the page count matches the actual PDF.

[x] Task 4: Parse crops and uses into schema rows
    Satisfies: R3, R4
    Done when: Running the multi-crop sample label produces one row per crop/use, each row has all schema fields filled or marked as not stated, and no crop visible in the PDF is missing.
    Note: Reworked so one row = one use + one use site + one application method (R18). Pest vocabulary removed — pests are not part of the UST schema.

[x] Task 5: Render results on screen
    Satisfies: R5
    Done when: After extraction, a scrollable table appears grouped by source file with a row count per file and a search box that filters rows as you type.

[x] Task 6: Add Excel (.xlsx) download
    Satisfies: R6
    Done when: Clicking "Download Excel" saves an `.xlsx` file that opens in Excel with one sheet per label plus a combined sheet, and column headers match the schema.

[x] Task 7: Add sample labels and verify accuracy
    Satisfies: R3, R4
    Done when: `samples/` contains 3–5 label PDFs (short, multi-crop, text-only, scanned) plus a hand-checked expected-output sheet, and the app's output for that label matches it row for row.
    Note: `samples/README.md` documents the 4-case test set with download sources and an accuracy checklist; `samples/expected/02-multi-crop-long.csv` is the reference sheet. Drop the actual PDFs into `samples/` to run the comparison.

---

## Phase 2 — Review & Trust

R11 = Confidence flags · R12 = Page/source references · R13 = Coverage warnings
R14 = Inline editing · R15 = OCR fallback · R16 = Expanded crop vocabulary · R17 = Column sorting

[x] Task 8: Expand `CROP_TERMS` with more crops and EPA crop groups
    Satisfies: R16
    Done when: `CROP_TERMS` includes EPA crop groups/subgroups (e.g. Berry, Bulb Vegetable, Citrus Fruit, Herbs) and 200+ terms total, and a label mentioning a newly added crop produces a row for it.

[x] Task 9: Record page number and source snippet per row
    Satisfies: R12
    Done when: Every row has a "Page" value showing the page it came from, and clicking a row expands a panel showing the source text that produced it.

[x] Task 10: Add confidence scoring per row
    Satisfies: R11
    Done when: Each row shows a High / Medium / Low confidence badge based on how many schema fields were matched, and Low rows are visually distinct.

[x] Task 11: Add coverage warnings for sparse crops
    Satisfies: R13, R3
    Done when: After extraction, a warnings panel lists crops detected in the text whose rows have few filled fields, with a count, and stays hidden when there are none.

[x] Task 12: Add column sorting to the results table
    Satisfies: R17
    Done when: Clicking any column header sorts rows by that column ascending, clicking again sorts descending, and an arrow indicator shows the active sort.

[x] Task 13: Add inline cell editing
    Satisfies: R14
    Done when: Double-clicking a cell makes it editable, the edit persists in the results data, an "edited" marker appears on changed cells, and exports include the edited values.

[x] Task 14: Add CSV export (retired)
    Satisfies: R8 (retired)
    Done when: Feature removed from product scope to reduce defect surface; no CSV download control remains in the UI.

[x] Task 15: Save runs to localStorage with a recent-runs list (retired)
    Satisfies: R7 (retired)
    Done when: Feature removed from product scope to reduce defect surface; no run persistence remains in the UI.

[ ] Task 27: Detect and parse table-structured use sections
    Satisfies: R29
    Done when: Uploading a table-structured label (e.g. Icafolin-methyl USH679SC200) produces
    one row per crop row in the use table with rates, MRI, REI, and Max # Apps/Yr filled.
    The existing narrative-section extraction must still work for SIVANTO-style labels.


    Satisfies: R9, R10 (retired)
    Done when: Features removed from product scope to reduce defect surface; compare/merge/import controls and logic are removed.

[x] Task 17: Add OCR fallback with Tesseract.js
    Satisfies: R15
    Done when: A PDF page with no text layer is rendered to canvas and read with locally bundled Tesseract.js, the log shows OCR was used, and a scanned sample produces rows.
    Note: Wired to `app/vendor/tesseract.min.js`. The library file is not committed — see `app/vendor/README.md` for the one-line download. Without it the app degrades gracefully and logs which pages lack a text layer.

---

## Phase 3 — Verification

[x] Task 18: Create a manual test checklist covering every requirement
    Satisfies: R1–R17 (verification coverage)
    Done when: `tests/manual-checklist.md` exists with at least one test per requirement, each written in the `should_..._when_...` naming style with Steps / Expected / Actual lines, including failure and edge cases, and a results summary the tester fills in.
    Note: 58 tests written. Not yet executed — running them needs the sample label PDFs, which are not committed to `samples/`.

[x] Task 19: Create a structured test plan with requirement traceability
    Satisfies: R1–R17 (verification coverage)
    Done when: `tests/test-plan.md` exists with numbered test IDs mapped to requirements, grouped into visual / functional / data / interaction / edge / negative categories, with a traceability table proving every requirement is covered and a results section for recording a formal run.
    Note: 92 tests across 9 sections. Complements `tests/manual-checklist.md` rather than replacing it: the checklist is for regression passes, the plan is for traceability and formal sign-off. Not yet executed — needs the sample PDFs.

---

## Phase 4 — Realignment to the real UST schema

[x] Task 20: Capture the knowledge base and distil its rules
    Satisfies: R18–R22 (foundation)
    Done when: `knowledge/` holds the golden examples, training logs, UST definitions and conversion chart, with a README defining the priority order, and `knowledge/extraction-rules.md` distils the training logs into numbered rules that each trace to a logged mistake.
    Note: 13 rules plus a pre-flight checklist. `.github/instructions/knowledge.instructions.md` makes the folder apply automatically.

[x] Task 21: Realign the schema to the 27-column UST definition
    Satisfies: R4, R18–R22
    Done when: `SCHEMA` matches `knowledge/UST_definitions.txt` exactly in names and order, `NOT_SPECIFIED` is `NS`, `NOT_APPLICABLE` is `NA`, and PRD §3 documents all 27 columns in five groups.

[x] Task 22: Rework the parser to the UST unit of analysis
    Satisfies: R18–R22
    Done when: Rows are keyed on use + use site + App. Target + App. Type; field extractors exist for the product, application-method, rate-pattern and restriction groups; Rule 5.1 computes `Max No. of CC/yr`; crop-group exceptions and conditional PHIs are preserved; pest vocabulary is removed.
    Note: Parser is structurally correct but fill-rate is unverified — no sample PDFs exist to measure it against. Expect many `NS` cells until the patterns are tuned on real labels.

[~] Task 23: Verify extraction against a known label
    Satisfies: R4, R18–R22
    Done when: A golden-example label PDF is placed in `samples/`, extracted, and the output compared row-by-row against the matching file in `knowledge/golden-examples/`, with the fill-rate and any defects recorded.
    Note: First run executed against `samples/264-1198_SIVANTO® 400 SL_9_5_2019_BASE.pdf`. Result: **304 rows across 218 uses**, against an expected 41 rows across 28 uses. Four defects found and fixed (see below); needs a re-run to confirm.
    Defects found:
      D1 (Blocker, fixed) — the parser anchored on every *crop mention*, so member crops listed inside a group section (Aronia berry, Blueberry, Currant …) each became a use. Replaced with `findUseSections()`, which anchors on the label's real section headings (`<USE NAME> FOLIAR|SOIL|PLANTHOUSE`).
      D2 (Major, fixed) — `Reg. #/File Sym` read `951659-40`, an establishment number. Now anchored on the "EPA Reg. No." caption.
      D3 (Major, fixed) — PHI captured runaway text (`7 Day(s) Minimum interval between applications: 10 Day(s) Minimum Application Vol`). Bounded with a lookahead; MRI now read from its own "Minimum interval between applications" wording.
      D4 (Minor, fixed) — PPE re-scanned per row and repeated a 400-character block on all rows; now cached once per document.
      D5 (Major, fixed) — lb a.i./A columns were left `NS` because the label states rates in fl oz/A. The label *does* state the concentration (400 g a.i./L = 3.34 lb a.i./gal), so the conversion is arithmetic, not inference. Added `findAiConcentration()` and `flOzToLbAi()`: `lb a.i./A = (fl oz/A ÷ 128) × lb a.i./gal`. Verified against the golden example — 7.0 fl oz → 0.183, 14 fl oz → 0.365, × 3 cycles → 1.095, all matching. Falls back to `NS` when no concentration is printed; the run log states which basis was used.
      D6 (Blocker, fixed) — the D1 rewrite matched nothing and the second run produced a single row. Cause: PDF.js joins page text with single spaces, so neither `\n` nor a run of two spaces ever occurs mid-document, and the leading anchor `(^|\n|\s{2,})` in `SECTION_RE` could never match. Removed `SECTION_RE` entirely. The parser now finds the target keyword with `SECTION_TARGET_RE` and walks backwards token by token via `headingBefore()`, keeping ALL-CAPS words, 1–2 digit footnote markers and joiners, and accepting everything inside parentheses through a depth counter so group codes such as `(Crop Group 5)` survive. `NOT_A_USE` was widened with GENERAL, MIXING, SPRAY, CHEMIGATION, AERIAL, GROUND, INJECTION, DRENCH and BROADCAST, and consecutive duplicate heading+target pairs (headings repeated over a page break) are skipped.
      D7 (Major, fixed) — headings carried leading page/footnote numbers (`1 STONE FRUITS`, `3 12 BRASSICA…`, `33 SORGHUM`), so the same use appeared under two different names and de-duplication failed. `cleanUseName()` now strips leading number runs and a leading `N Day(s)` spill from a preceding table cell.
      D8 (Major, fixed) — the backwards walk crossed a closing paren belonging to body prose and swallowed a whole member-crop list into the `melo including true cantaloupe…20 CUCURBIT VEGETABLES` heading. `headingBefore()` now tracks paren depth properly, treats a self-contained token such as `Day(s)` as ordinary, and abandons a parenthetical run longer than 8 tokens.
      D9 (Minor, fixed) — `App. Type` came back in the label's own case (`drench`, `foliar`). Normalised with `titleCaseTerm()`.
      D10 (Minor, fixed) — interval columns mixed `7` and `7 Day(s)` for the same value. `normaliseDays()` reduces a bare `N Day(s)` to `N` while leaving conditional wording whole (R21). Planthouse rows no longer keep a stray `foliar` target — the heading keyword now always wins.
    Remaining gap: `Use Site` (Agricultural (Outdoor)), `App. Type` (Broadcast) and `App. Timing (Site Status)` (Post-emergence) are analyst interpretations rather than label strings, so those stay `NS` under R19.

[x] Task 24: Update the test documents for the 27-column schema
    Satisfies: R1–R22 (verification coverage)
    Done when: `tests/manual-checklist.md` and `tests/test-plan.md` reference the real column names, `NS`/`NA` fill rules, and add cases for R18–R22.
    Note: done. The checklist grew from 58 to 66 tests and the plan from 92 to 98 (T20a–T20f added, T20 repointed at the SIVANTO sample). Sorting and search cases now name **Use Site** instead of Crop. `docs/USER-GUIDE.md` was rewritten for the 27 columns in the same pass.

[x] Task 25: Fill the restriction columns and the equipment/application-count columns
    Satisfies: R7, R18
    Done when: Geographic, Drift, Soil and On-field Non-target columns are populated on the SIVANTO sample, `App. Equipment` shows the label's equipment sentence rather than a single word, and `Max # Apps/C.C.` is populated where the label states it.
    Note: done. Root cause of the empty restriction columns was scope, not pattern — these statements appear once in product-wide sections (Directions for Use, Spray Drift, Pollinator Protection), never inside a use block, so a block-only scan found nothing. Now the block is searched first (a use-specific restriction must win) with a cached document-wide fallback. The `drift` and `ppe` patterns also carried the same `\n\n` terminator flaw as D6 and were rewritten as single-clause alternatives.

[x] Task 26: Ask which active ingredient to report when a label declares several
    Satisfies: R23
    Done when: a multi-active label pauses the run, lists the actives, and calculates rates only against the chosen one; a single-active label runs straight through unchanged.
    Note: done. `findActiveIngredients()` reads the ingredient panel; `concentrationForAi()` scopes the concentration to the chosen active and falls back to the label-wide statement. The run handler was split so `finishRun()` can be resumed from the picker.

[x] Task 27: Fill the convention-derived columns from stated evidence
    Satisfies: R24
    Done when: `Use Site`, `App. Type` and `App. Timing (Site Status)` are populated on the SIVANTO sample, every derived cell is visibly marked and traceable to a numbered rule, and cells with no matching evidence stay `NS`.
    Note: done. Rules written to `knowledge/derivation-rules.md` first (D1 Use Site, D2 App. Type, D3 App. Timing) with the evidence each requires, then implemented as `deriveUseSite()`, `deriveAppType()`, `deriveTimingStatus()` and `deriveColumns()`. Derived cells render with a ◆ marker and a tooltip naming the rule, the run log prints every derivation, and `scoreRow()` excludes derived values so confidence still reflects how much of the *label* was read. Hand-editing a derived cell clears its derived status. R19 is preserved: no rule fires without evidence in the label text.

[x] Task 28: Correct the scope of the restriction columns
    Satisfies: R7, R19
    Done when: no restriction that names a single crop or state appears on unrelated rows, Drift shows the drift parameters rather than prose, Soil shows a real soil restriction or `NA`, and the fourth run matches the golden example on these columns.
    Note: done. Task 25's document-wide fallback over-corrected: it stamped every match found anywhere onto every row, so `Only For Use in: Idaho, Oregon and Washington` (a CLOVER restriction) and `Not for use in Greenhouses` (a planthouse restriction) appeared on all 41 rows. That is fabrication, not extraction — worse than leaving the column empty. Restrictions are now split by scope: `geographic` (block-only, crop/state specific) and `geographicProduct` (the NY / Nassau-Suffolk statement that genuinely applies product-wide). Drift patterns now target the parameter table (`Max Release Height`, `ASABE Droplet Size`) instead of matching drift prose, with a length guard. The `soil` pattern's bare `incorporat\w+` was matching the Worker Protection Standard paragraph and is now anchored to real soil wording. `NOT_APPLICABLE` is finally emitted, in the two places it is warranted: Soil Restrictions on a foliar application, and Drift Restrictions on a drench or injection.
    Correction (Task 36): that last sentence was wrong. `NOT_APPLICABLE` was written into the code but never reached the output, because both rules sat in `rowFromBlock()` and read `App. Target` / `App. Type` before either was settled. The claim was made from reading the code, not from checking a run. See Task 36.
    Also fixed: the last use section ran into the label's back matter, so `TURNIP GREENS` carried `STORAGE AND DISPOSAL Do not contaminate water…`. Section spans are now cut at `STORAGE AND DISPOSAL` / `CONDITIONS OF SALE` / `WARRANTY`. `App. Equipment` picked up tank-cleaning prose (`or a mix tank and drain for 10 seconds`); the `Apply using` pattern now requires the text to name actual equipment, and the product-wide equipment sentence is cached as a fallback.

---

## Phase 5 — Code review remediation

Findings recorded in `docs/CODE-REVIEW.md`.

[x] Task 29: Mark derived values in the exported files (review finding C1)
    Satisfies: R24, R19
    Done when: the `.xlsx` and `.csv` state which columns were filled by a derivation rule and which rule fired, and `SCHEMA` still has exactly 27 columns.
    Note: done. The ◆ marker and its tooltip existed only on screen, so `Agricultural (Outdoor)` (convention) and `264-1198` (printed on the label) were indistinguishable in the spreadsheet — the artefact that actually leaves the tool and feeds exposure modeling. Exports now carry a `Derived Fields` column: `Use Site (D1.4); App. Type (D2.1)`, or `None — all values read from the label`. Added through a new `EXPORT_COLUMNS` constant rather than `SCHEMA`, so the 27 columns stay fixed, following the existing `Page` / `Confidence` precedent. Covers the combined sheet, each per-label sheet, and the CSV.

[x] Task 30: Detect crops named in the label that produced no row (review finding M5)
    Satisfies: R13
    Done when: a crop present in the label text with no corresponding row is listed in the warnings panel, and the panel distinguishes that case from a row that is merely sparse.
    Note: done. `coverageWarnings()` only ever inspected rows that already existed, so a crop that produced *no row at all* was invisible — the exact failure behind D1 (304 rows) and D6 (1 row). A parser that stops finding sections yields a short, clean-looking table with nothing to signal the gap. `CROP_TERMS_SORTED` had been kept for this cross-check, with a comment saying so, and was never referenced; it is now wired into the new `missingCropWarnings()`. The panel separates "named in the label with no row at all" from "row may be under-read".
    Correction (Task 32): the claim made here that two-way substring matching "avoids false alarms" was wrong, and was never verified against a real run. It produced 157 false warnings on the SIVANTO label. See Task 32.
    Scope caveat: the check needs the label text from the current extraction; without it, the check is skipped rather than reporting a false all-clear.

[x] Task 31: Make the interface usable with a keyboard and a screen reader (review findings M1, M2, M3)
    Satisfies: app.instructions.md — semantic HTML, keyboard-accessible interactive elements, ARIA labels where needed
    Done when: the upload control can be reached by Tab and activated by Enter or Space, run progress and results are announced, and the page exposes a `<main>` landmark.
    Note: done. The file previously contained zero `aria-` attributes. M2 was the blocking one: the drop zone was a `<div>` with a click handler, and the `<input type="file">` behind it was `hidden`, which removes it from the tab order — so a keyboard-only user could not complete step one at all. The drop zone now carries `role="button"`, `tabindex="0"`, an `aria-label` naming both the click and the drop path, a `keydown` handler for Enter and Space, and a `:focus-visible` outline, since being reachable is no use if the focus cannot be seen.
    M1: the progress bar is a `role="progressbar"` whose `aria-valuenow` is kept in step with its width by a new `setProgress()` helper — set in two places, they would otherwise drift apart, and a wrong value is worse than none. The run log is `role="log"` with `aria-live="polite"` and `tabindex="0"` so it can be scrolled without a mouse. The status line, completion notice and results placeholder are `role="status"`. Sortable headers report `aria-sort`. The decorative 📄 and ✔ glyphs and the sort arrows are `aria-hidden` so they are not announced as content, and the empty toggle-column header gained an `.sr-only` label. The search box and confidence filter gained `aria-label`s.
    M3: `<div class="wrap">` is now `<main class="wrap">`.

[x] Task 32: Stop the coverage panel flagging member crops of extracted groups (defect D14)
    Satisfies: R13
    Done when: crops covered by an extracted crop-group row are not reported as missing, and the panel reports only crops named outside every detected use section.
    Note: done. The SIVANTO run reported 157 missing crops — Broccoli, Cabbage, Kale and so on — every one of them a member crop listed *inside* a group section that had produced a row. `missingCropWarnings()` asked only "does this crop name appear anywhere in the document", then tested coverage by substring against row `Use` values; `Broccoli` is not a substring of `BRASSICA (COLE) LEAFY VEGETABLES`, so it fired. This is the same mistake the comment above `SECTION_TARGET_RE` warns against — anchoring on crop mentions rather than sections — applied in reverse, inflating the warning panel instead of the table. A panel with 157 false entries is worse than no panel: it hides the one real gap it exists to surface, which is precisely the D1/D6 failure mode.
    Fix: a crop is now reported only when *every* occurrence of it falls outside the spans returned by `findUseSections()`. Spans are recomputed from the same function the parser uses, so the check cannot drift from what was actually matched. All occurrences are tested, not just the first, so a crop named once in the ingredient blurb and again inside a real section counts as covered.
    **Verified (sixth run).** 157 warnings → 3: Sugar Beet (p9), Sugarcane (p9), Tobacco (p3). All three look like genuine signal — the panel is now doing the job it exists for. Worth checking whether the label actually carries use sections for them, since `ROOT VEGETABLES - EXCEPT SUGARBEET` suggests Sugar Beet is deliberately excluded rather than missed.

[x] Task 33: Fill the App. Timing columns from product-wide label text (defect D15)
    Satisfies: R21, R24
    Done when: `App. Timing (Site Status)` and `App. Timing (other)` are populated on the SIVANTO rows, with the derived one still marked.
    Note: done. Both timing columns were `NS` on every row while `Use Site` and `App. Type` derived correctly in those same rows — which ruled out section slicing and pointed at the evidence lookup. Root cause, single and shared: SIVANTO states its pest-driven timing ("When pests occur") once in the general directions rather than repeating it in each use block. `App. Timing (other)` searched the block only, and D3.7 required its pest wording in the block, so neither found it. `Use Site` and `App. Type` succeeded because they key off per-acre rates and equipment words that *do* appear in every block. `App. Equipment` had already hit this exact problem and solved it with the `doc.__equip` cache.
    Fix follows that existing precedent: a new `doc.__timingOther` cache supplies `App. Timing (other)` as a fallback, and D3.7 falls back to the document text for its pest evidence. Block wording still wins wherever present, so a use stating its own timing is never overwritten by product-wide prose. The D3.1–D3.6 rules stay strictly block-scoped — only the pest-pressure fallback widened. R19 holds: this widens where evidence is read from, it does not invent it; a label with no pest wording anywhere still yields `NS`. `__timingOther` added to the `doc.__*` convention block (N6).
    Correction (Task 35): the fallback as written was too broad and had to be narrowed. See Task 35.

[x] Task 34: Correct the expected row count for the SIVANTO sample (defect D16)
    Satisfies: R4, R18–R22 (verification integrity)
    Done when: `samples/expected/sivanto-400-sl.md` agrees with `knowledge/golden-examples/golden_example_SIVANTO_400_SL.txt`, and the run history reflects which runs actually passed.
    Note: done. The expected-output file said **41 rows**; the golden example it is derived from has **43**. The number was never reconciled against its own source, and four runs were graded against it. The consequence was inverted grading: the third run produced 43 — the correct answer — and was logged as a miss with defects; the fourth produced 41 and was logged as "row count and use list now exact", recording a miss as a success. Every later decision inherited that error, including my own analysis on 1 August, which repeated "expected 41" without checking.
    Corrected to 43, with the run-history table restated and a note explaining the inversion so the mistake is not silently overwritten.
    Wider point, recorded deliberately: **row count is not evidence of correctness.** The fifth run produced 43 against an expected 43 and still had two real defects — `LEGUME VEGETABLES (Crop Groups 6 & 7)` missing entirely, and the cereal-grains heading truncated to `FORAGE, FODDER AND STRAW OF CEREAL GRAINS (Crop Group 16)`. Two offsetting errors produced a matching total. A "Known gaps" section now records both, so the count is never read as a pass on its own.
    Also corrected: `SORGHUM` appearing with only a Soil row was flagged as a defect on 1 August. It is not one — the golden has no Sorghum Foliar row. The app was right.

[x] Task 35: Narrow the App. Timing fallback introduced by Task 33 (defect D17)
    Satisfies: R19, R21
    Done when: `App. Timing (other)` reflects the block's own wording where the label gives it, and is not stamped identically onto every row.
    Note: done. Task 33's fallback applied unconditionally, so one product-wide sentence — `when pests are first detected` — was written to all 43 rows, including Soil and Planthouse rows whose blocks say nothing about pest timing. That is the D11 failure repeating: product-wide prose presented as a per-use fact. The golden example disproves it directly by recording *different* timing wording on different rows.
    Three changes. (1) `When pests occur` is now matched as its own pattern ahead of the others, because it is the authoritative phrasing and a single alternation let whichever wording appeared first in the block win. (2) The product-wide fallback now requires the block itself to show pest-driven context, so a block that is silent stays `NS`. (3) D3.7 is block-scoped again — the document-wide fallback made it fire on every foliar row regardless of that row's content, so the rule carried no information at all. An empty cell beats a confident wrong one.
    Correction (Task 39): this over-corrected. The sixth run shows both timing columns `NS` on nearly every row — only CHRISTMAS TREES is filled — while the golden has timing on every foliar row. "An empty cell beats a confident wrong one" was used to justify a gate that was never checked against output; the result is a column that under-reads the label. See Task 39.
    Second correction (Task 44): the premise stated above — that Soil and Planthouse blocks "say nothing about pest timing" — is false. The golden fills both timing columns on all 43 rows, soil and plant-house included. This sentence was never checked against the golden before being written, and it was then inherited by Task 39, which built its foliar-only gate on top of it. The claim that the golden "disproves it directly by recording *different* timing wording on different rows" was half right: the wording does vary per row, which is why a single stamped sentence is wrong — but varying wording is not evidence that some rows have no timing at all. See Task 44.

[x] Task 36: Fix the restriction NA columns, equipment truncation and product name (defect D18)
    Satisfies: R7, R19, R4
    Done when: `Soil Restrictions` reads `NA` on foliar rows, `Drift Restrictions` reads `NA` on soil drench/injection rows, `App. Equipment` ends in "chemigation equipment", and `Product Name (PBN)` is populated.
    Note: done. Three separate defects, all previously recorded as fixed and none of them actually working.
    **Ordering defect (the important one).** Task 28 stated that `NOT_APPLICABLE` was "finally emitted, in the two places it is warranted". It never was. Both NA rules lived in `rowFromBlock()`, which runs *before* `parseDocument()` applies the authoritative `App. Target` from the section heading and *before* `deriveColumns()` fills `App. Type`. The rules were reading fields that had not been assigned yet — `App. Type` was still `NS` on most rows, and a strict `=== "Foliar"` test failed against whatever casing the block regex captured. Moved to a new `finaliseRestrictionNA()` called once both fields are settled, with case-insensitive comparison. This is a class of bug worth naming: the logic was correct, its position in the pipeline was not, and no amount of re-reading the rule itself would have found it.
    **Equipment truncation.** `App. Equipment` ended mid-word at `…sprinkler-type overhead chem`. The `{0,60}` trailing bound was consumed by the lazy middle matching `aircraft`, leaving too few characters for the real tail. Split into two patterns, the first anchored on the final noun `chemigation equipment` so the sentence is captured whole.
    **Product name.** `Product Name (PBN)` was `NS` on every row. The pattern used `^…/m` anchors, but PDF.js joins each page into one space-separated line, so there are no line starts to bind to beyond the first — the identical flaw as D6, in a different function. Replaced with anchor-free patterns keyed on the ® symbol, plus normalisation for the space PDF.js inserts before it.
    **Verified (sixth run).** All three confirmed against output: `Product Name (PBN)` reads `SIVANTO® 400 SL` on all 43 rows; `App. Equipment` ends in `…sprinkler-type overhead chemigation equipment`; `NA` now appears in Soil Restrictions on foliar rows and in Drift Restrictions on drench/injection rows (BUSHBERRY Soil/Drench, SORGHUM Soil/Injection, the Planthouse rows). The ordering diagnosis was correct.

[ ] Task 37: Stop `headingBefore()` truncating headings that carry several group codes (defect D20)
    Satisfies: R4, R19
    Done when: the cereal-grains row's use name includes the Crop Group 15 clause, not only the Crop Group 16 clause.
    Note: **attempted and failed — verified against the sixth run, output unchanged.** The row still reads `FORAGE, FODDER AND STRAW OF CEREAL GRAINS (Crop Group 16)`.
    The change made (counting only tokens outside parentheses against the 14-token prose cap) is defensible on its own terms and has been left in place, but it was not the cause. The diagnosis was reached by counting tokens in the *golden example's* wording — `(including production for seed)` 4 + `QUINOA` + `AND` + `(Crop Group 16)` 3 + seven words = 16, "so the cap fires exactly at the observed truncation point". That arithmetic was performed on text the PDF may not contain in that form. It matched the symptom closely enough to look like a root cause, which is precisely why it was not questioned.
    Recording the method error, because it is the same one behind Tasks 28, 30, 33 and 36: a mechanism was inferred from reading code plus a plausible-looking calculation, and written up as fact without a run. The remaining possibilities are that the 240-character look-back window is too short for this heading, that the label prints the CG 15 clause in a form `isHeadingToken()` rejects, or that the golden's name is an analyst's merge of two label sections and the app's shorter string is what the label actually prints. All three need the extracted text to distinguish. Do not attempt another fix before dumping it.

[x] Task 39: Restore the App. Timing columns without over-reaching (defect D22)
    Satisfies: R19, R21
    Done when: foliar rows carry `Post-emergence` and the label's pest-timing wording, and rows whose blocks genuinely state nothing stay `NS`.
    Note: code changed, needs a run to confirm. Root cause found by reading the two code paths rather than reasoning about them, after the previous attempt was marked done from inference and failed.
    **Both paths carried the same block-only gate, which is why the two columns failed together.** Line 1041 gated the `App. Timing (other)` fallback on a `pestContext` regex tested against the block; `deriveTimingStatus()` gated D3.7 on the same evidence in the block. SIVANTO states its pest timing once in the general directions and never repeats it per use, so neither gate opened on 42 of 43 rows. Task 35 added both gates in one pass, so both columns emptied at once.
    The two columns needed different fixes, because they are different kinds of claim.
    **D3.7 (derived).** The pest condition was dropped entirely. `knowledge/derivation-rules.md` describes D3.7 as reasoning "from the situation rather than a phrase" — a foliar spray onto a standing crop is post-emergence by definition, and the evidence for that is the FOLIAR heading the section parser already established. The pest wording was never load-bearing for the inference. `knowledge/derivation-rules.md` updated to match, since the rule text is meant to lead the code.
    **App. Timing (other) (quoted label text).** R19 applies strictly here, so the product-wide sentence carries only to foliar rows — it is prose about foliar spraying — and Soil/Planthouse rows stay `NS` unless their own block states timing. That is what prevents the D11/D17 repeat. Block wording still wins wherever the label gives it.
    **Ordering.** The first version of this fix put the foliar test in `rowFromBlock()`, which would have re-created D18 exactly: `App. Target` is set there from a block regex, but the authoritative value is applied from the section heading in `parseDocument()` afterwards. Caught by checking where the field is assigned instead of assuming. Moved to a new `finaliseTimingOther()` called alongside `finaliseRestrictionNA()` once the target is settled.
    **Verified (seventh run):** foliar rows show `Post-emergence` + `when pests are first detected`. The foliar half of this task works.
    Correction (Task 44): the foliar-only gate was wrong, and wrong for an inherited reason. It rested on Task 35's premise that soil blocks have no pest-driven timing — a premise never checked against the golden, which fills both timing columns on **all 43 rows**, soil and plant-house included. Restricting the fallback to foliar rows was not a conservative choice; it was the same unverified assumption re-applied one level down. See Task 44.

[x] Task 44: Fill the timing columns on soil and plant-house rows too (defect D25)
    Satisfies: R19, R21
    Done when: no row has `NS` in `App. Timing (other)` or `App. Timing (Site Status)`, and the values are not one sentence stamped onto every row.
    Note: code changed, needs a run to confirm. **D25 is a premise defect, not a coding defect** — every line of code involved did exactly what it was written to do. Task 35 asserted that Soil and Planthouse blocks "say nothing about pest timing"; Task 39 accepted that and narrowed its fix to foliar rows. Grepping the golden shows both columns populated on all 43 rows: timing describes *when* the product goes on, which a drench has as much as a spray. Three tasks in a row were built on one unexamined sentence.
    **Two things checked before changing anything, because the obvious fix was wrong twice already.** (1) The wording is *not* uniform. The golden carries roughly twenty `When pests occur` and twenty `When pests are first detected`, varying per row, so forcing a single sentence would re-create D17 in a new disguise — the fallback stays a fallback, and block wording still wins. (2) The Site Status values on soil rows are genuinely varied — `Pre-emergence/ Post-emergence`, `At-planting / Post-transplant`, `Post-emergence`, `Pre-transplant`, `Pre-emergence/ At-planting/ Post-emergence` — so a blanket "soil ⇒ post-emergence" rule would be a confident wrong answer on most of them.
    Changes: (a) the `finaliseTimingOther()` foliar gate removed, leaving only the guard that protects rows which state their own timing — that guard, not the target test, is what enforces R19. (b) Two derivation rules added for the soil rows that previously fell through to `NS`. **D3.9**: placement wording implying a standing plant (`basal drench`, `drip line`, `tree canopy`, `trunk`) means post-emergence, which is how the golden reads the citrus, stone-fruit and vine soil rows even though those blocks never print the word. **D3.8**: `pre-transplant` / `prior to transplanting` means `Pre-transplant`, and it is tested **before** D3.4–D3.6 — the plant-house block narrates the whole sequence including a post-transplant field application, so the generic transplant pattern matches it too and, tested first, returns the exact opposite of what the label says.
    Ordering within `deriveTimingStatus()` is now load-bearing in two places; `knowledge/derivation-rules.md` states why, so a later edit does not reshuffle it.
    Correction (Task 46): **D3.8 has been removed again.** The analyst's pasted golden records `Post-emergence` on both plant-house rows, not `Pre-transplant`, so the rule would emit a confidently wrong value on the only two rows it touches. The point (2) above — that soil Site Status is "genuinely varied" — also holds only for the repository golden; the paste is close to uniformly `Post-emergence` on soil rows, which would make D3.9's trigger list too narrow rather than too broad. Both readings came from one file that has not been established as current.

[x] Task 45: Default App. Timing (other) to "When pests occur" (requested convention)
    Satisfies: R21, R24
    Done when: no row leaves `App. Timing (other)` empty, and any cell filled by the default is marked derived rather than presented as label text.
    Note: code changed, needs a run to confirm. Requested directly rather than traced to a defect, so recorded as a convention change.
    Precedence is unchanged and still three-tier: the use block's own wording wins, then the label's product-wide sentence, then the new `TIMING_OTHER_DEFAULT`. The default only reaches a cell that would otherwise have stayed `NS`, so rows the label does describe keep their own wording — the golden's split of roughly twenty `When pests occur` against twenty `When pests are first detected` survives.
    **The default is marked derived (D3.10), and that marking is the whole basis for it being acceptable.** This is the only value in the table not read from the PDF. Unmarked, it would be indistinguishable in the exported spreadsheet from a phrase the label actually prints — which is the C1 finding again, and a straight R19 breach in the artefact that feeds exposure modeling. Marked, it is an explicit convention a reviewer can see and override. `derivation-rules.md` records that if the marking is ever dropped, the rule must be dropped with it.
    Flagged for a decision: this reverses the "an empty cell beats a confident wrong one" principle that Tasks 35 and 39 were argued from. That principle was over-applied there and produced a column of `NS` — but it was not wrong in general, and a default is a real trade of coverage against fidelity. It holds up here only because the value is marked and the label genuinely states this timing product-wide. It should not be copied to columns where the label may say nothing at all.
    Correction (Task 46): the caution recorded above — that the wording varies per row, so a default risks overwriting real values — came from the repository golden alone. The analyst's pasted golden carries `When pests occur` on **every** row. The user said as much when asking for this change and I contradicted them; the contradiction was wrong. The implementation stands unchanged and is if anything better supported than argued, but the precedence chain is what makes it safe under *either* file: a uniform golden and a varying one both survive a fallback that only fills empty cells.

[x] Task 46: Decide which SIVANTO golden example is authoritative
    Satisfies: R18–R22 (verification integrity)
    Done when: one file in `knowledge/golden-examples/` is marked authoritative for SIVANTO, the other is marked superseded, and every task graded against the losing file is re-checked.
    Note: **decided by the analyst on 1 Aug 2026 — the pasted table is authoritative.** Saved as `golden_example_SIVANTO_400_SL_analyst_paste.txt`; `golden_example_SIVANTO_400_SL.txt` is now headed SUPERSEDED. The old file is retained rather than deleted because Tasks 34–45 and the whole run history were graded against it, and that record has to stay readable for the corrections to mean anything.
    **Column coverage — the paste carries 24 of the 27 SCHEMA columns.** Its header was supplied and checked against `SCHEMA` rather than assumed: the three absent are **`App Rate (lb ai/A)`, `REI` and `PPE`**. 24 + 3 = 27, which is the arithmetic to re-check if the header and `SCHEMA` ever drift.
    **Problem found while confirming that, and it is the reason this task stays open in effect:** the instruction was to take the remaining columns from the golden record file, but **the superseded file has the same 24 columns and does not contain `App Rate`, `REI` or `PPE` either.** Neither golden governs those three. So they have no reference at all, and any claim about them — including "the app fills them correctly" — is currently ungrounded. They are extracted from the label directly (REI and PPE from the product-wide safety panel), so this is not necessarily a defect; it means those three columns are **unverifiable against a golden** and must not be reported as passing. Raised as Task 47 rather than silently patched.
    What the decision settles, each now graded against the paste:
      **(a) `App. Timing (other)` is `When pests occur` on every row.** Task 45's default is correct and well supported. My earlier statement that the wording varies — and my correction of the user on that point — came from the superseded file and was wrong.
      **(b) `App. Equipment` is lowercase in the authoritative file** and matches the app's current output character-for-character. **D24 is not a defect; Task 41 is closed unfixed.**
      **(c) Plant-house Site Status is `Post-emergence`.** Rule D3.8 stays out of the code; it would now be wrong on both rows it touches.
      **(d) Soil Site Status is close to uniformly `Post-emergence`.** D3.9's trigger list is too narrow against this file, not too broad — the opposite of the risk recorded in Task 44.
      **(e) Use names are title-case with short codes** (`Brassica (Cole) Leafy Vegetables (CG 5)`). Every use-name comparison behind D20 and D21 needs redoing against this file; the app currently emits ALL-CAPS long-form names, which may make D20 a formatting question rather than a truncation one.
      **(f) D23 confirmed real** — drift parameters belong on foliar rows.
    Row count deliberately not asserted. Counting rows by eye is how D16 happened; it needs a real count.
    Method note: I corrected the user's statement that this column should always read `When pests occur`, and the correction was wrong. I checked one reference file, found variation, and treated it as settled without asking whether the file was current — the same error as Task 34 (a row count never reconciled against its own source) and Task 37 (arithmetic on text the PDF may not contain). **A single unverified reference is not evidence, even when it is in the repository.**

[ ] Task 47: Establish a source for App Rate, REI and PPE — no golden covers them
    Satisfies: R18–R22 (verification integrity)
    Done when: the three columns either have a reference to check against, or are explicitly recorded as unverifiable so no run is graded as passing on them.
    Note: found while mapping the paste's 24 columns onto the 27-column `SCHEMA` (Task 46). **Both golden files carry the same 24 columns. Neither contains `App Rate (lb ai/A)`, `REI` or `PPE`.**
    This matters more than it looks. Every fill-rate and accuracy statement made about the SIVANTO sample has implicitly covered all 27 columns, but three of them have never had anything to compare against. That is not a claim that they are wrong — REI and PPE come from the product-wide safety panel and `App Rate` from the rate tables, all of which the app reads — it is that **their correctness has never been tested and could not have been.** Recording them as passing would repeat the Task 42 error of counting a traced code path as an observed result.
    Options, in order of preference: ask the analyst whether the source spreadsheet has these three columns hidden or trimmed; failing that, hand-check a few rows against the label PDF and commit that as a partial reference; failing that, mark the three explicitly unverifiable in `samples/expected/sivanto-400-sl.md` so no future run claims them.
    Do not delete them from `SCHEMA` — `knowledge/UST_definitions.txt` defines 27 columns and R4 binds to it. Absent from a golden means "not supplied", not "not required".

[x] Task 48: Harden section detection for mixed label formats and add BYI regression coverage
    Satisfies: R3, R4, R18, R19
    Done when: labels that do not use canonical `<USE> FOLIAR/SOIL/PLANTHOUSE` headings still produce real use rows when the label gives deterministic crop/use headings, without regressing SIVANTO-style extraction.
    Note: done. `findUseSections()` now uses layered detection: canonical target headings first, then a seed-treatment fallback (`<Crop> Pest Controlled` under seed-treatment context), then a generic all-caps crop/use fallback for the same heading shape. The parser also maps additional explicit target keywords (`IN-FURROW`, `DRENCH`, `INJECTION`, `BANDED`) to authoritative `App. Target`/`App. Type` values, and leaves ambiguous generic rows as `NS` instead of forcing `Soil`.
    Verification: BYI sample `samples/264-1142_BYI 02960 480 FS_10_21_2025_BASE.pdf` now yields two deterministic rows (`Soybean`; `Canola ... and Rapeseed`) with `App. Target = Seed Treatment`; SIVANTO 200 still extracts with mixed Foliar/Soil/Seed Treatment rows. Added regression checks to `tests/manual-checklist.md` and `tests/test-plan.md` (T14a).

[x] Task 49: Generalize section parsing for title-case and plural heading variants
    Satisfies: R3, R4, R18, R19
    Done when: labels using title-case use headings and `Pests Controlled` table markers extract use sections without label-specific hard-coding.
    Note: done. Section tokenization now accepts title-case heading tokens and strips `[*]` table markers; the seed/generic fallback matchers now accept `Pests Controlled` (plural) as well as singular. This fixes the structural parse miss on `samples/264-REGG_PLENEXOS SMART_02_20_2026_BASE.pdf`, which previously produced only a fallback NS row when parsed alone.
    Verification: isolated Plenexos run now reports 5 detected sections and 5 extracted rows (`CITRUS FRUIT`, `POME FRUIT`, `SMALL FRUIT VINE CLIMBING`, `STONE FRUIT`, `TREE NUTS`) with `Foliar/Broadcast` and high confidence.

[x] Task 50: Add parser detector diagnostics and fix REI/form extraction gaps
    Satisfies: R3, R4, R6, R12
    Done when: run logs identify which section-detector family matched each label, SIVANTO rows include Physical Form and REI values where stated.
    Note: done. `findUseSections()` now tags matches with detector family (`target-heading`, `seed-table`, `generic-pest-table`), and `finishRun()` logs detector counts per document. `physicalForm` detection now prefers code-near-name patterns (e.g. `400 SL`), and `REI` extraction now supports wording like `REI of 4 Hour(s)` with a product-wide fallback cache (`doc.__rei`) used when a use block does not repeat the interval.

[x] Task 38: Find why `LEGUME VEGETABLES (Crop Groups 6 & 7)` yields no row (defect D21)
    Satisfies: R4, R19
    Done when: the extracted table contains a `LEGUME VEGETABLES (Crop Groups 6 & 7)` row, matching golden line 25.
    Note: fixed and verified against the real SIVANTO PDF. PDF.js flattens the page-28 heading as `... (Crop Group 7) FOLIARCrop Group 6 ...`; the required word boundary after `FOLIAR` prevented section detection. `SECTION_TARGET_RE` now accepts that specific concatenation. The recovered heading was initially truncated because lowercase `and` was rejected and the 14-token heading cap kept only the last clause; both limits now accommodate the verified combined headings while retaining the all-caps, parenthesis, and finite-token guards.
    Browser verification: 44 rows across 28 uses, matching the 44 data rows in the analyst-authoritative paste. The full Legume and cereal-grains headings are present. Task 38 covers row recovery only: Legume PHI still reads `3` instead of the authoritative conditional value, so R21 field accuracy remains open.

[ ] Task 40: Fill Drift Restrictions with the drift parameter table (defect D23)
    Satisfies: R7, R19
    Done when: foliar rows carry the label's drift parameters, matching the golden's `Max Release Height (ft): 10, ASABE Droplet Size: Coarse`, and soil drench/injection rows keep `NA`.
    Note: found in the sixth run, not yet diagnosed. `Drift Restrictions` reads `NS` on every foliar row. The `NA` half of the column works — soil drench and injection rows show `NA` correctly via `finaliseRestrictionNA()` — so this is specifically the *populate* path failing.
    Task 28 claimed this column was fixed by pointing the patterns at the parameter table rather than drift prose. That claim was never checked against output, and this is the fourth column where a Task 28 assertion has not survived a real run.
    Two candidates, both visible in the code, neither confirmed:
      (a) the patterns in `FIELD_PATTERNS.drift` do not match how PDF.js renders that table — it is laid out as a small grid, and PDF.js flattens grids by reading order, so `Max Release Height (ft):` and its value `10` may be separated by other cells' text rather than adjacent as the regex requires;
      (b) the length guard at the `doc.__restr` cache — `driftAll.split(" ").length > 40 ? null : driftAll` — is discarding a match that did succeed but ran long, which would null the product-wide fallback for every row while leaving no trace.
    (b) is cheap to distinguish: log the value of `driftAll` before the guard. Do that before touching either the patterns or the threshold.

[x] Task 41: Preserve label capitalisation in App. Equipment (defect D24)
    Satisfies: R19, R4
    Done when: `App. Equipment` reads `Ground sprayers, fixed or rotary winged aircraft…` as the label prints it, not `ground sprayers…`.
    Note: **CLOSED — not a defect. No code changed.** D24 existed only because `golden_example_SIVANTO_400_SL.txt` capitalises `Ground sprayers`. That file is superseded (Task 46). The authoritative table prints this field lowercase — `ground sprayers, fixed or rotary winged aircraft, or through properly designed, sprinkler-type overhead chemigation equipment` — which is character-for-character what the app already emits, including the `or through properly designed,` clause the superseded file omits.
    This is the outcome the task's own note predicted: "if the label itself prints it lowercase mid-sentence, then capitalising it would be editorialising, and the golden's capitalisation would be the analyst normalising. R19 says report what the label states, so establish which before changing anything." Following that instruction is the only reason no code was touched — a title-case "fix" would have introduced a real defect while closing an imaginary one.
    Note: cosmetic, lowest priority of the open defects, but recorded because it is a fidelity question rather than a formatting preference. The app emits `ground sprayers, fixed or rotary winged aircraft, or through properly designed, sprinkler-type overhead chemigation equipment`; the golden has `Ground sprayers`.
    Likely the capture starts mid-sentence — the pattern is anchored on `chemigation\s+equipment` and works backwards, so it picks up the noun phrase from wherever the sentence's interior begins rather than from its first word. Worth confirming against the extracted text rather than simply title-casing the result: if the label itself prints it lowercase mid-sentence, then capitalising it would be editorialising, and the golden's capitalisation would be the analyst normalising. R19 says report what the label states, so establish which before changing anything.
    Do not "fix" this by running `titleCaseTerm()` over the whole string — that would also capitalise `Fixed Or Rotary Winged Aircraft`.
    **Likely not a defect (Task 46).** The analyst's pasted golden prints this field in lowercase — `ground sprayers, fixed or rotary winged aircraft, or through properly designed, sprinkler-type overhead chemigation equipment` — which is character-for-character what the app already emits. Only the repository golden capitalises `Ground sprayers`. This is exactly the outcome the paragraph above anticipated: the golden's capitalisation looks like the analyst normalising, not the label. Close this unfixed if the paste is authoritative; do not change any code first.

---

## Phase 6 — Requirement verification

[x] Task 42: Verify every PRD requirement and record the result (R1–R24)
    Satisfies: R1–R24 (verification coverage)
    Done when: `specs/PRD.md` carries a Verification Report table with a status and evidence line for every requirement, and any FAIL has a fix proposed and applied.
    Note: done. Report added as PRD §7, checked against the sixth SIVANTO run and the current `app/index.html`. **22 PASS, 2 FAIL.**
    A distinction was introduced rather than inflating the pass count: requirements marked **PASS (unobserved)** have code evidence but were not directly observed in this cycle. Given how often this project has logged code-reading as verification and been wrong (Tasks 28, 30, 33, 36, 37), collapsing that distinction into a plain PASS would have repeated the exact failure the report is meant to catch.
    **R21 FAIL — fixed.** `FIELD_PATTERNS.phi` bounded its capture with `[^.;\n]`, excluding the semicolon. The golden writes split PHIs as `7 (forage/fresh seed); 21 (dry soybean seed)`, so the pattern could only ever capture the first clause and would drop the second condition silently — a confident single number in place of a stated pair. The conditional tail now admits `;`; every other bound and the terminating lookahead are unchanged, so the D3 runaway capture cannot return.
    **Observed after Task 38, still failing:** the recovered Legume row emits PHI `3` instead of the authoritative conditional value `7 (forage/fresh seed); 21 (dry soybean seed)`. R21 remains unverified until that field extraction is fixed.
    **R15 FAIL — not fixed, deliberately.** `app/vendor/` contains only `README.md`; `tesseract.min.js` was never committed, so `OCR_AVAILABLE()` is false and scanned labels yield no rows. The code path and its graceful degradation are both correct — this is a missing binary asset, not a defect. Fetching a third-party bundle into the repository is a decision to take rather than an edit traceable to a requirement, so it is left for the maintainer. See Task 43.

[ ] Task 43: Vendor the Tesseract.js bundle so R15 works (verification FAIL)
    Satisfies: R15
    Done when: `app/vendor/tesseract.min.js` is present, and uploading a scanned PDF logs that OCR was used and produces rows.
    Note: not started. `app/vendor/README.md` documents the one-line download. Nothing in the code needs to change — `OCR_AVAILABLE()`, `getOcrWorker()` and the per-page fallback are already written and already degrade cleanly when the file is absent.
    Worth confirming at the same time that the app still opens from `file://` afterwards: Tesseract workers can need a served origin, in which case R15's "no outside service" wording holds but the "open one file" premise in §2 may not, and that tension belongs in the PRD rather than in a silent workaround.

[x] Task 51: Synchronize test documents with current extraction and accessibility behavior
    Satisfies: R3, R12, R15, R17 (verification coverage)
    Done when: `tests/manual-checklist.md` and `tests/test-plan.md` both include explicit checks for BYI seed-treatment extraction, Plenexos non-empty extraction, keyboard source-toggle behavior, and mobile viewport reflow expectations.
    Note: done. Added explicit regression entries and updated counts/totals in both test documents. Removed stale "known gap" expectations for keyboard toggle focusability and lack of mobile breakpoints, because those behaviors were implemented and should now be treated as release checks.

[x] Task 52: Make Excel exports colorful and presentation-ready
    Satisfies: R6, R25
    Done when: every exported sheet has a visually distinct header row, alternating body-row shading, confidence-colored cells, wrapped long text, readable column widths, and a working header filter.
    Note: done. Added `applyExportSheetStyle()` in `app/index.html` and applied it to both the combined sheet and per-label sheets before writing the workbook.

[x] Task 53: Fix SIVANTO 200 registration capture and add per-product Excel row colors
    Satisfies: R4, R6, R25
    Done when: SIVANTO 200 rows populate `Reg. #/File Sym` with `264-1141`, and the export visually differentiates products using row and key-column color accents in the combined sheet.
    Note: done. `FIELD_PATTERNS.regNo` now accepts spaced/en-dash separators and normalizes to canonical hyphen format; export styling now assigns product-specific palette fills to rows plus stronger accents on `Source File` and `Product Name (PBN)` cells.

[x] Task 54: Canonicalize pest timing wording and add regression coverage
    Satisfies: R21, R4 (verification coverage)
    Done when: pest-trigger values in `App. Timing (other)` read `when pests occur`, and tests explicitly cover both this wording and SIVANTO 200 registration capture.
    Note: done. Added `normaliseTimingOther()` and applied it to both block-level and document-level timing extraction; added manual and structured regression tests (`should_capture_reg_number_for_sivanto_200`, `should_prefer_when_pests_occur_phrase_for_app_timing_other`, `T20g`, `T20h`).

[x] Task 55: Capitalize sentence starts for equipment and timing text
    Satisfies: R4, R5
    Done when: `App. Equipment` and both timing columns start with a capital letter in the on-screen table and exported rows.
    Note: done. Added `capitaliseSentenceStart()` and applied it during row finalization to `App. Equipment`, `App. Timing (other)`, and `App. Timing (Site Status)`.

[x] Task 56: Gate result rendering on in-app QC pass/fail
    Satisfies: R26, R5
    Done when: extraction runs a QC pass before displaying results; Critical/High defects block table rendering and show a defect list; passing runs render results normally with a QC pass indicator.
    Note: done. Added `runRuntimeQcGate()` plus QC report UI in `app/index.html`; `finishRun()` now renders results only when QC has no Critical/High defects. Added dev-only `?forceQcFail=1` hook for deterministic blocked-path testing.

[x] Task 57: Apply QC auto-remediation before gate verdict
    Satisfies: R27, R4, R5
    Done when: QC applies deterministic fixes for missing Physical Form, missing App. Type (when App. Target is known), and missing App. Timing fields where label-supported fallbacks exist, logs what changed, recalculates confidence, and then evaluates the release gate on remediated rows.
    Note: done. Added `applyRuntimeQcRemediation()` in `app/index.html` and wired it into `finishRun()` before `runRuntimeQcGate()`. QC panel now reports auto-remediation counts and notes, including App. Type repairs.

[x] Task 58: Add three user approval stations before final release
    Satisfies: R28, R5, R6
    Done when: after QC pass the app pauses on Station 1/3, then Station 2/3, then Station 3/3; each station has Yes/No controls; No pauses final release and export until resumed; final table/export are released only after Yes on all three stations.
    Note: done. Added `reviewGate` UI and stage workflow in `app/index.html` with pause/resume/re-run controls, stage-specific snippets, and export lock until all stations are approved.






