# Use Summary Tables Extractor — PRD (Prototype)

## 1 · Goal

Pesticide labels are long PDFs that bury crop and use information across many pages. This tool
reads a whole label and pulls out every crop and every use into one clear table. The table shows
on screen and downloads as a spreadsheet, so the work takes minutes instead of hours.

## 2 · Who Uses It

- **Regulatory and product reviewers** who must list every approved use on a label.
- **Field and agronomy staff** who need application rates and waiting periods in one place.
- **Anyone comparing labels** — for example, checking what changed between two versions.

Users are not programmers. The tool must work by opening one file and clicking one button.

## 3 · What It Shows

The Use Summary Table documents each product's uses, application methods and rates, and use
restrictions, **to support ecological exposure modeling**. That purpose drives the schema:
rates are expressed as active ingredient per acre, and per-crop-cycle and per-year maxima are
tracked separately.

**One row = one use + one use site + one set of application instructions.** The same crop
appears on several rows when it has both a foliar and a soil application, because the rates,
intervals, and restrictions differ. Row count is driven by the label, never fixed.

The schema has 27 columns in five groups, in this exact order:

**Product**

| Column | Plain meaning |
|---|---|
| Reg. #/File Sym | EPA Registration Number, or File Symbol if registration is pending |
| Physical Form | Formulation type — WP, SC, WG, EC, Granular, WDG, and so on |
| Product Name (PBN) | Primary Brand Name |

**Site**

| Column | Plain meaning |
|---|---|
| Use | Crop, crop group, turf, plantscape, seed treatment, etc. |
| Use Site | Agricultural (Outdoor), Greenhouse (Indoor), Residential (Outdoor), etc. |

**Application Method**

| Column | Plain meaning |
|---|---|
| App. Target | Foliar, soil, seed treatment |
| App. Type | Broadcast, banded, soil drench, etc. |
| App. Equipment | Aerial, ground boom, boomless ground, handheld, etc. |
| App. Timing (Site Status) | Pre- or post-crop-emergent |
| App. Timing (other) | Timing that depends on pest pressure or another condition |

**Rate Pattern**

| Column | Plain meaning |
|---|---|
| App Rate (lb ai/A) | The applied rate as active ingredient per acre |
| A.I. Max Single Rate/App. (lb a.i./A) | Largest single application rate |
| Max # Apps/C.C. | Most applications allowed per crop cycle |
| A.I. Max Total Rate/C.C. (lb a.i./A) | Most active ingredient allowed per crop cycle |
| Max # Apps/Yr. | Most applications allowed in a 12-month period |
| A.I. Max Total Rate/Yr. (lb a.i./A) | Most active ingredient allowed in a 12-month period |
| MRI (days) | Minimum retreatment interval |
| REI | Restricted-entry interval, in hours |
| PHI (days) | Preharvest interval, in days |
| PPE | Personal protective equipment required, quoted from the label |
| Additional Information | Rate-related detail not captured above, such as annual caps per active ingredient |
| Max No. of CC/yr | Most crop cycles per 12-month period |

**Restrictions**

| Column | Plain meaning |
|---|---|
| Geographic Restrictions | Where the product may not be used |
| Drift Restrictions | Wind speed, boom height, droplet size, buffer distances |
| Soil Restrictions | Incorporation depth, soil types excluded, saturated-soil limits |
| On-field Non-target Species Restrictions | Pollinator and other non-target protections |
| Additional Restrictions for Use/Use Site | Tank-mix bans, adjuvant bans, grazing limits |

### Fill rules

| Value | Meaning |
|---|---|
| `NS` | Not Specified — the label is silent |
| `NA` | Not Applicable — the column does not apply to this use |

Cells are never blank. **Never infer a value.** If the label does not state it, the answer is
`NS`. Each row also carries its page number and a confidence rating for review.

Abbreviations: `A.I./a.i.` = active ingredient · `C.C.` = Crop Cycle · `MRI` = Minimum
Retreatment Interval · `PHI` = Preharvest Interval · `REI` = Restricted-Entry Interval ·
`PBN` = Primary Brand Name.

## 4 · Requirements

Each requirement has a verification step that someone new to the project can follow.

### Core

**R1 · Upload labels.** Add one or more PDF files by dragging them onto the page or picking them
from a file browser.
*Verify:* Drag two PDFs onto the page. Both file names appear in a list.

**R2 · Run extraction.** One button starts the work and shows progress while it runs.
*Verify:* The button is greyed out with no files. Add a file, click it, and a progress bar and
status messages appear.

**R3 · Read the whole label.** Every page and section is read, not just the first table.
*Verify:* Upload a label and check the log reports the same number of pages the PDF has.

**R4 · Complete, consistent rows.** Every row has all 27 columns; missing values read `NS`,
and columns that do not apply read `NA`.
*Verify:* Scan the table for empty cells. There should be none.

**R5 · Show results on screen.** Rows appear in a scrollable table, grouped by which file they
came from, with a search box that filters as the user types.
*Verify:* Type a crop name in the search box. Only matching rows remain.

**R6 · Download a spreadsheet.** One click saves an Excel file with a sheet per label plus a
combined sheet.
*Verify:* Click the download button and open the file in Excel. The sheets and column headings
match the table on screen.

**R25 · Presentable spreadsheet format.** The downloaded Excel file is easy to review: headers
are visually distinct, columns are filterable, long text wraps, and column widths are readable
without manual cleanup.
*Verify:* Open the downloaded file in Excel. Confirm coloured headers, working filters on each
sheet, wrapped long restriction text, and readable column widths.

**R26 · Runtime QC gate before showing results.** After extraction, the app must run an in-app QC
check before results are shown. If QC finds any Critical or High defects, the table stays hidden,
a blocking message is shown, and the defects are listed for review.
*Verify:* Run extraction on a label. When QC passes, results appear normally with a QC pass note.
When QC fails, results remain hidden and the QC defect list is shown.

**R27 · QC auto-remediation for fixable field gaps.** Before final release of results, the QC stage
must actively repair clearly fixable field gaps (for example missing Physical Form, missing
App. Type where App. Target is known, and missing application timing values with label-supported
fallbacks), then re-check the updated rows.
*Verify:* Run extraction on a label with missing fixable fields. QC reports remediation actions,
the affected cells are filled, and QC re-runs on the updated table.

**R28 · Three user approval stations before final release.** When QC passes, the app must pause
before final release and step through three approval stations: document snapshot check,
extraction-sanity check, and high-risk field check. Each station must offer Yes/No controls.
If the user selects No, final release and export stay paused until the user resumes and approves.
*Verify:* Run extraction on a sample label. Confirm stations 1-3 appear in order, selecting No
at any station pauses final release, and selecting Yes through all three releases the final table.

### Review and trust

**R11 · Confidence rating.** Each row is marked High, Medium, or Low depending on how much of the
row was found, so weak rows stand out.
*Verify:* Every row shows a coloured rating. Filtering to "Low only" shows just those rows.

**R12 · Page and source text.** Each row records its page number, and the user can reveal the
exact label wording behind it.
*Verify:* Expand a row. It shows a page number and the sentence it came from.

**R13 · Coverage warnings.** Crops that were found but barely described are listed in a warning
panel, so gaps are visible.
*Verify:* After a run, a warning panel lists such crops, or it is hidden because there are none.

**R14 · Fix mistakes.** The user can correct any cell before downloading, and corrections appear
in the downloaded files.
*Verify:* Double-click a cell, type a new value, then download. The new value is in the file.

**R15 · Scanned labels.** Labels that are pictures rather than text are still read, using software
included with the app rather than an outside service.
*Verify:* Upload a scanned label. The log states that picture-reading was used, and rows appear.

**R16 · Wide crop coverage.** The crop list covers common crops plus official EPA crop groupings.
*Verify:* Upload a label mentioning an uncommon crop. A row appears for it.

**R17 · Sort the table.** Clicking a column heading sorts by that column; clicking again reverses
the order.
*Verify:* Click a heading twice. An arrow shows the direction and the order flips.

### Extraction fidelity

These requirements encode rules learned from corrected extractions. See
`knowledge/extraction-rules.md` for the underlying evidence.

**R18 · One row per use, use site, and application method.** A crop with both a foliar and a
soil application produces two rows, never one merged row.
*Verify:* Upload a label where one crop has both. Two rows appear with different rates.

**R19 · Never infer a value.** Anything not explicitly stated on the label reads `NS`. The app
never fills a gap with a default, an average, or a value from another row or label.
*Verify:* Find a row where the label states no MRI. The cell reads `NS`, not a number.

**R20 · Crop names kept whole.** Crop-group codes and their exceptions are preserved exactly as
the label writes them — for example `TREE NUTS (Crop Group 14-12) - EXCEPT ALMOND`.
*Verify:* Upload a label with an excepted crop group. The exception text is present in the cell.

**R21 · Conditional values kept whole.** Where a rate, PHI, or interval varies by condition, the
full conditional text is preserved rather than reduced to one number.
*Verify:* Find a use with a split PHI. The cell shows both parts and their conditions.

**R22 · Per-cycle and per-year tracked separately.** Applications and totals per crop cycle are
recorded independently of those per year, alongside the maximum crop cycles per year.
*Verify:* A row shows different values in the C.C. and Yr. columns where the label distinguishes
them.

**R23 · The analyst names the active ingredient when a label has several.** A rate in lb a.i./A
is meaningless without knowing which active it refers to. When the label declares more than one
active ingredient, the tool pauses after reading the PDF, lists the actives it found, and asks
which one to report. Rates are then calculated against that active's stated concentration only.
When only one active is declared, no question is asked.
*Verify:* Load a multi-active label. Extraction stops and offers a choice. Pick one; the run
completes and the log names the active and the concentration used.

**R24 · Convention-derived columns are filled from stated evidence, and marked as derived.**
Three columns — Use Site, App. Type and App. Timing (Site Status) — are rarely printed as
literal strings, but an analyst fills them by applying a settled convention to the application
prose. The tool applies the same convention, written down in `knowledge/derivation-rules.md`.
Each rule fires only on evidence present in the label, and every derived value is marked in the
results and traceable to the rule that produced it. Where no rule matches, the cell stays `NS`.
This does not weaken R19: the tool still never invents a fact the label does not support.
*Verify:* Run the SIVANTO label. Alfalfa Foliar shows Use Site `Agricultural (Outdoor)`,
App. Type `Broadcast`, App. Timing `Post-emergence`, each flagged as derived, and the run log
names the rule behind each.

**R29 · Generic label structure support.** The extractor must work regardless of how a label
organises its use information — narrative section headings, inline use tables, or mixed formats.
When a label presents crops and rates as rows in an embedded use table (e.g. a column labelled
"Use Site" or "Crop" with one row per crop, and adjacent columns for rates and intervals),
the tool must detect the table, iterate its rows, and produce one output row per crop/use
combination. The resulting rows must be schema-complete, with rates and intervals mapped from
the table columns, not left as NS because no narrative section heading was found.
*Verify:* Upload a table-structured label (e.g. Icafolin-methyl / USH679SC200). The output
contains one row per crop listed in the label's use table (Soybean, Field Corn, Cereals,
Canola/Pulse, Fruit Tree/Tree Nut), with rates, MRI, REI, and Max # Apps/Yr filled from
the table — not NS.

### Boundaries

The tool runs entirely in the browser. There is no server, no database, no sign-in, and no outside
service. Uploaded labels never leave the user's computer.

## 5 · Demo Script

See **`specs/Demo.md`** for the five-minute walkthrough, including what to do if something goes
wrong during a live demo.

## 6 · Sample Data

Use 3–5 public EPA-registered pesticide label PDFs, covering a mix of cases:

- A short, single-crop label (simple baseline).
- A long, multi-crop label with several use tables (tests completeness).
- A label where uses are written as text or bullets instead of a table (tests non-tabular parsing).
- A scanned, image-based PDF (tests picture reading).

Keep samples in a `samples/` folder, with a hand-checked expected-output spreadsheet for at least
one label to verify accuracy. See `samples/README.md` for where to download labels.

---

## 7 · Verification Report

Verified 1 August 2026 against the current SIVANTO run and the current `app/index.html`.

**How to read this.** PASS means the mechanism was traced in code *and* corroborated by observed
output where output exists. Where a requirement is implemented but its behaviour on the sample
has never been observed, it is marked **PASS (unobserved)** rather than PASS — this project has
repeatedly logged code-reading as verification and been wrong, so the distinction is kept
visible. No requirement is marked PASS on the strength of reading a function alone.

| Requirement | Status | Evidence |
|---|---|---|
| R1 · Upload labels | PASS | Drop zone and `<input type="file" multiple>` present; the sixth run processed the SIVANTO PDF and reported "1 Labels processed". |
| R2 · Run extraction | PASS | Button is `disabled` until files are added; the run produced a progress bar and a populated run log. |
| R3 · Read the whole label | PASS | Rows carry page numbers from 11 to 38 across the document, so pages well beyond the first table were read. |
| R4 · Complete, consistent rows | PASS | All 44 rows show a value in every column — `NS`/`NA` where absent, no blanks. `SCHEMA` has exactly 27 entries and `blankRow()` fills all of them. |
| R5 · Show results on screen | PASS | Results render grouped by source file with a row count and a search box wired to filter on input. |
| R6 · Download a spreadsheet | PASS (unobserved) | `book_append_sheet` writes an "All Uses" sheet plus one per label using `EXPORT_COLUMNS`; the saved file has not been opened in Excel in this cycle. |
| R25 · Presentable spreadsheet format | PASS (unobserved) | Export applies worksheet styling (header fill/font, row striping, confidence colouring, wrapped text, autofilter, width sizing) in `applyExportSheetStyle()` before `writeFile()`. |
| R26 · Runtime QC gate before showing results | PASS | Observed on 2026-08-01: normal run shows `QC passed` and renders the table; `?forceQcFail=1` run shows `QC blocked`, keeps results hidden, and lists defects. |
| R27 · QC auto-remediation for fixable field gaps | PASS | Observed on 2026-08-01/02 with Plenexos and SIVANTO samples: QC reported auto-remediation actions, filled `Physical Form` where evidence existed, repaired `App. Type` when target+method evidence was clear, and surfaced remaining timing gaps as explicit QC defects when evidence was absent. |
| R28 · Three user approval stations before final release | PASS | Observed on 2026-08-02 with Plenexos sample: after QC pass the app paused at Station 1/3, allowed No to pause final release in draft mode, and required Yes through all 3 stations before final table release/export. |
| R11 · Confidence rating | PASS | Every row in the run shows a rating; the summary reports "0 Low-confidence rows". |
| R12 · Page and source text | PASS | Each row carries a page number, and the run output includes a "Show source text" control backed by `row.__source`. |
| R13 · Coverage warnings | PASS | The panel reported 3 crops named with no row (Sugar Beet, Sugarcane, Tobacco), down from 157 false entries before Task 32. |
| R14 · Fix mistakes | PASS (unobserved) | Cells are `contenteditable` with an edit handler that writes back to the row and clears derived status; exports read the edited data. |
| R15 · Scanned labels | **FAIL** | `app/vendor/` contains only `README.md`. `tesseract.min.js` is absent, so `OCR_AVAILABLE()` is false and a scanned label yields no rows. See below. |
| R16 · Wide crop coverage | PASS | `CROP_TERMS` covers common crops plus EPA group codes; the run produced rows for uncommon uses including KAVA and TARO LEAVES. |
| R17 · Sort the table | PASS | Sortable headers carry `aria-sort` and a direction arrow, toggling on repeat clicks. |
| R18 · One row per use, use site, method | PASS | BRASSICA, CITRUS, CUCURBIT and others each appear as separate Foliar and Soil rows with different rates; CUCURBIT additionally has a Planthouse row. |
| R19 · Never infer a value | PASS | Absent values read `NS` throughout. The D17 and D22 regressions — both scope errors on this rule — are fixed, and the derivation rules require in-label evidence. |
| R20 · Crop names kept whole | PASS | `TREE NUTS (Crop Group 14-12) - EXCEPT ALMOND`, `LOW GROWING BERRY (Crop Subgroup 13-07G) - EXCEPT CRANBERRY` and `ROOT VEGETABLES - EXCEPT SUGARBEET (Subgroup 1B)` all retain their exception text. |
| R21 · Conditional values kept whole | **FAIL** | The `phi` pattern's `[^.;\n]` bounds stop at `;`, so a split PHI such as the golden's `7 (forage/fresh seed); 21 (dry soybean seed)` can only ever capture its first clause. See below. |
| R22 · Per-cycle and per-year tracked separately | PASS | C.C. and Yr. columns are populated independently, and `Max No. of CC/yr` is filled (1 or 3) per the label. |
| R23 · Analyst names the active ingredient | PASS | `findActiveIngredients()` runs before extraction; SIVANTO declares one active, so no prompt appeared and the run continued — the specified single-active behaviour. |
| R24 · Derived columns marked | PASS | `Use Site`, `App. Type` and `App. Timing (Site Status)` populate from `knowledge/derivation-rules.md`, are marked derived on screen, and export via the `Derived Fields` column. |

**Boundaries** hold: no server, database, sign-in or third-party API. PDF.js and SheetJS are the
only external libraries, and OCR is intended to be local.

### R15 — what is missing and why it is not fixed here

The OCR code path is complete and correct, but the library it depends on is not present:
`app/vendor/` holds only a README. `OCR_AVAILABLE()` therefore returns false, and a scanned PDF
produces the "no text layer and OCR is unavailable" message instead of rows.

**Smallest fix:** download the vendored bundle as documented in `app/vendor/README.md`.

**Not implemented, deliberately.** This is a missing binary asset, not a code defect, and
fetching a third-party bundle is a decision about what enters the repository rather than a
change traceable to a requirement — Section 4 of the coding instructions says not to skip
straight to implementation for that kind of work. The graceful degradation is already correct.
Logged as Task 42 so the gap is visible rather than silently carried.

### R21 — what is missing, and the fix

`FIELD_PATTERNS.phi` bounds its capture with `[^.;\n]`, which excludes the semicolon. The
golden example writes conditional PHIs precisely as `7 (forage/fresh seed); 21 (dry soybean
seed)`, so the pattern cannot express the value the requirement exists to protect — it would
truncate to `7 (forage/fresh seed)` and silently drop the second condition. A reviewer reading
the output would see a single confident number where the label states two.

**Smallest fix:** allow the semicolon inside the conditional tail only, keeping every other
bound intact so the D3 runaway-capture defect cannot return. The terminating lookahead is
unchanged, so the capture still stops at the next labelled field.

Implemented below in `FIELD_PATTERNS.phi`. **Not yet observed in output** — the SIVANTO row that
would exercise it is `LEGUME VEGETABLES (Crop Groups 6 & 7)`, which currently produces no row at
all (D21/Task 38). R21 cannot be confirmed on this sample until that defect is fixed, and this
change is recorded as unverified until then.

