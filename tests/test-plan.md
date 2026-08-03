# Test Plan — Use Summary Tables Extractor

Structured test plan covering every requirement in `specs/PRD.md` (R1–R28). Each test has an ID,
the requirement it verifies, a category, steps, an expected result, and a status column.

The output schema is the 27-column Use Summary Table defined in `specs/PRD.md` §3 and
`knowledge/schema-reference.md`. Unstated values are written `NS`; inapplicable ones `NA`.

**Companion document:** `tests/manual-checklist.md` holds the same coverage in behaviour-named
checklist form (`should_..._when_...`). This file is the traceability view — use it to prove every
requirement is covered and to record a formal test run. Use the checklist for day-to-day regression
passes.

## Test categories

| Code | Category | What it asks |
|---|---|---|
| VIS | Visual | Does it look correct? |
| FUN | Functional | Does the feature work? |
| DAT | Data | Is the information correct? |
| INT | Interaction | Do clicks, typing, and keys work? |
| EDG | Edge case | What happens with unusual input? |
| NEG | Negative | Are errors handled gracefully? |

## Environment

| Field | Value |
|---|---|
| Tester | |
| Date | |
| Browser and version | |
| OCR library installed? | ☐ Yes ☐ No (`app/vendor/tesseract.min.js`) |
| Sample PDFs present? | ☐ Yes ☐ No (see `samples/README.md`) |

## Setup before testing

1. Open `app/index.html` in a browser.
2. Open the developer console and keep it visible — several tests check it.
3. Click **Clear** so the file queue is empty.
4. Have the four sample labels ready, as described in `samples/README.md`.

**Status key:** ✅ Pass · ❌ Fail · ⚠️ Partial · ⏭️ Blocked or skipped

---

## Section A · Upload and extraction (R1–R3)

| ID | Req | Cat | Test | Steps | Expected | Status | Notes |
|---|---|---|---|---|---|---|---|
| T1 | R1 | FUN | Drag and drop several PDFs | Drag `01-simple-single-crop.pdf` and `02-multi-crop-long.pdf` onto the drop zone together | Both names appear in the list, each with its size in MB | | |
| T2 | R1 | INT | Pick files with the browser | Click the drop zone, choose one PDF | The chosen file is added to the list | | |
| T3 | R1 | VIS | Drop zone reacts to dragging | Drag a file over the drop zone without releasing | The border and background change colour, then revert on leaving | | |
| T4 | R1 | NEG | Reject non-PDF files | Drag a `.txt` or `.png` file onto the drop zone | Nothing is added; status still reads "No files selected." | | |
| T5 | R1 | EDG | Ignore duplicate files | Add the same PDF twice | The list still shows one entry | | |
| T6 | R1 | INT | Remove a queued file | Add two PDFs, click **Remove** on the first | Only the second remains; the count updates | | |
| T7 | R2 | VIS | Run button starts disabled | Load the page with no files queued | **Run Extraction** and **Clear** are greyed out | | |
| T8 | R2 | FUN | Run button enables with files | Add one PDF | Both buttons become clickable; status reads "1 file ready." | | |
| T9 | R2 | VIS | Progress shows while running | Click **Run Extraction** | A progress bar fills, the status names the current file, and a log appears | | |
| T10 | R2 | FUN | Controls return after the run | Wait for the run to finish | Buttons are clickable again; status reports documents, pages, and rows | | |
| T11 | R2 | NEG | Survive a corrupt PDF | Rename a non-PDF to `broken.pdf`, add it with a valid label, run | The log shows a ✖ line for the bad file; the valid file still produces rows | | |
| T12 | R3 | DAT | Every page is read | Note the page count of `02-multi-crop-long.pdf`, then run it | The log reports the same count and lists one line per page | | |
| T13 | R3 | DAT | Crops late in the document are found | Pick a crop appearing only on the final pages, search for it | A row exists for that crop | | |
| T14 | R3 | EDG | Uses written as prose | Run `03-text-only-uses.pdf` | Rows appear with rates taken from sentences, not only tables | | |
| T14a | R3, R18 | DAT | Seed-treatment label without foliar/soil headings | Run `samples/264-1142_BYI 02960 480 FS_10_21_2025_BASE.pdf` | At least the Soybean and Canola/Rapeseed rows are extracted, each with `App. Target = Seed Treatment` and no fallback-only NS row | | |
| T14b | R3 | DAT | Plenexos extraction is non-empty | Run `samples/264-REGG_PLENEXOS SMART_02_20_2026_BASE.pdf` | Output contains multiple extracted rows and is not a single fallback placeholder row | | |
| T15 | R3 | FUN | Several files in one run | Run two labels together | The log reports both; the status totals their pages | | |

## Section B · Output correctness (R4)

| ID | Req | Cat | Test | Steps | Expected | Status | Notes |
|---|---|---|---|---|---|---|---|
| T16 | R4 | DAT | No blank cells | Run any extraction, scan every column | No cell is empty; unknown values read `NS` in grey italics, inapplicable ones read `NA` | | |
| T17 | R4 | VIS | All 27 columns present | Compare headings against the table in `specs/PRD.md` §3 | Headings match exactly, in the same order, plus Page and Confidence | | |
| T18 | R4 | FUN | Schema is confirmed | Read the green confirmation after a run | It states the output is schema-verified with no blanks | | |
| T19 | R4 | EDG | Nothing found still yields a row | Run a text PDF containing no crop names | One row appears reading "No crop or use entries detected in this document." | | |
| T20 | R4 | DAT | Rows match the reference sheet | Run `samples/264-1198_SIVANTO® 400 SL_9_5_2019_BASE.pdf`, compare with `samples/expected/sivanto-400-sl.md` | Uses and use sites match row for row; note any differences | | |
| T20g | R4 | DAT | SIVANTO 200 registration number is captured | Run `samples/264-1141_SIVANTO® 200 SL_9_24_2020_BASE.pdf`, then inspect **Reg. #/File Sym** on several rows | Values are populated as `264-1141` rather than `NS` | ✅ | Verified in-browser on 2026-08-01: sampled rows showed `264-1141`. |
| T20a | R18 | DAT | One row per application method | Find a use site the label allows by both ground and aerial application | Two separate rows exist, identical except for **App. Type** | | |
| T20b | R19 | DAT | Nothing is inferred | Pick a row where the label states no MRI | **MRI (days)** reads `NS`; no plausible number has been supplied | | |
| T20c | R20 | DAT | Crop names kept whole | Find a use site with a qualifier such as a crop group or an "except" clause | The full wording appears in one cell; it is not split or truncated | | |
| T20d | R21 | DAT | Conditional values kept whole | Find a PHI stated with a condition | The whole conditional phrase appears in the cell, not just the number | | |
| T20h | R21 | DAT | Pest-trigger wording is canonical in App. Timing (other) | Run a SIVANTO sample and inspect rows where timing is pest-triggered | **App. Timing (other)** uses `when pests occur` | ✅ | Verified in-browser on 2026-08-01: sampled rows showed `When pests occur` after sentence-start capitalization. |
| T20e | R22 | DAT | Per-cycle and per-year kept apart | Compare **Max # Apps/C.C.** with **Max # Apps/Yr.** on a row where the label states only one | The unstated one reads `NS`; the stated value is not copied across | | |
| T20f | R5 (rules) | DAT | No wording from another label | Spot-check five **Additional Information** cells against the PDF | Every phrase is found verbatim in this label | | |

## Section C · Results table and filters (R5, R11, R17)

| ID | Req | Cat | Test | Steps | Expected | Status | Notes |
|---|---|---|---|---|---|---|---|
| T21 | R5 | VIS | Rows grouped by file | Run two labels at once | Two groups appear, each headed by its file name and row count | | |
| T22 | R5 | VIS | Summary counts shown | Look at the cards above the table | Labels, unique use sites, use rows, total rows, and low-confidence rows are shown | | |
| T23 | R5 | INT | Search filters as you type | Type a use site name into the search box | Only matching rows remain and matches are highlighted | | |
| T24 | R5 | NEG | Search with no matches | Type `zzzzz` | A message says no rows match the current filters | | |
| T25 | R5 | EDG | Search ignores case | Search `corn`, then `CORN` | Both return the same rows | | |
| T26 | R5 | EDG | Search handles regex characters | Search `(` or `*` | No crash; either no matches or literal matches | | |
| T27 | R5 | VIS | Long table scrolls | Run a label producing many rows | The table body scrolls while headings stay pinned | | |
| T28 | R11 | VIS | Every row is rated | Look down the Confidence column | Each row shows High, Medium, or Low, colour-coded | | |
| T29 | R11 | VIS | Low rows stand out | Find a Low row | Its background is tinted differently | | |
| T30 | R11 | INT | Confidence filter works | Choose **Low only** | Every visible row carries a Low badge | | |
| T31 | R11 | INT | Filters combine | Set **Low only**, then type a use site name | Only rows matching both remain | | |
| T32 | R11 | FUN | Rating updates after an edit | Fill several empty cells on a Low row | The badge rises to Medium or High | | |
| T33 | R17 | INT | Sort ascending | Click the **Use Site** heading | Rows sort A–Z; a ▲ appears in that heading | | |
| T34 | R17 | INT | Sort descending | Click **Use Site** again | Order reverses; the arrow becomes ▼ | | |
| T35 | R17 | DAT | Numeric columns sort as numbers | Sort by **Page**, then **PHI (days)** | 2 comes before 10, not after | | |
| T36 | R17 | DAT | Confidence sorts by rank | Sort by **Confidence** | Order runs Low→High or High→Low, not alphabetically | | |
| T37 | R17 | EDG | Unknown values sink | Sort a column containing several `NS` values | Those rows sit at the bottom in both directions, with `NA` rows beside them | | |
| T38 | R17 | FUN | Sorting survives filtering | Sort by Use Site, then search | The filtered rows keep the sort order | | |

## Section D · Detail panel and coverage (R12, R13)

| ID | Req | Cat | Test | Steps | Expected | Status | Notes |
|---|---|---|---|---|---|---|---|
| T39 | R12 | DAT | Every row names a page | Check the Page column | Each value is a number within the document's page count | | |
| T40 | R12 | INT | Detail panel opens | Click the **▸** on any row | A panel shows the page, file name, and the label wording behind the row | | |
| T40a | R12 | INT | Detail panel toggle works by keyboard | Tab to a row toggle button and press Enter twice | First press expands source text with `aria-expanded=true`; second press collapses with `aria-expanded=false` | | |
| T41 | R12 | INT | Detail panel closes | Click the same **▾** again | The panel closes and the marker returns to **▸** | | |
| T42 | R12 | FUN | Several panels at once | Expand three different rows | All three stay open independently | | |
| T43 | R12 | EDG | Panel on a placeholder row | Expand the row from T19 | It reports that no source text was recorded, without error | | |
| T44 | R13 | FUN | Sparse crops are listed | Run `02-multi-crop-long.pdf` | Crops matching one field or none appear in an amber panel with their page | | |
| T45 | R13 | VIS | Panel hides when not needed | Run a label where every crop extracts cleanly | No warning panel appears | | |
| T46 | R13 | DAT | Warnings agree with the table | Cross-check a warned crop against its rows | That crop really does have few filled fields | | |

## Section E · Editing (R14)

| ID | Req | Cat | Test | Steps | Expected | Status | Notes |
|---|---|---|---|---|---|---|---|
| T47 | R14 | INT | Edit a cell | Double-click a cell, type a value, press Enter | The value sticks and the cell is marked as edited | | |
| T48 | R14 | VIS | Edited cells are marked | Edit two cells | Both show the edited highlight and left bar | | |
| T49 | R14 | INT | Click away also saves | Edit a cell, then click elsewhere | The value is kept | | |
| T50 | R14 | EDG | Emptying a cell | Clear a cell completely and click away | It reverts to `NS` rather than staying blank | | |
| T51 | R14 | FUN | Edits survive a refresh | Edit a cell, refresh the page | The edited value is still there | | |
| T52 | R14 | DAT | Edits reach the export | Edit a cell, download Excel | The file contains the edited value | | |
| T53 | R14 | EDG | Page column is not editable | Try to edit a Page cell | It cannot be typed into | | |
| T54 | R14 | NEG | HTML is not executed | Enter `<script>alert(1)</script>` into a cell | The text shows literally; no dialog appears | | |

## Section F · Exports and runtime gate (R6, R25, R26, R27)

| ID | Req | Cat | Test | Steps | Expected | Status | Notes |
|---|---|---|---|---|---|---|---|
| T55 | R6 | FUN | Excel downloads | Click **Excel (.xlsx)** | A file named `Use_Summary_Table_<date>.xlsx` downloads | | |
| T56 | R6 | DAT | Sheet layout is right | Open the file in Excel | An **All Uses** sheet plus one sheet per label | | |
| T57 | R6 | DAT | Headings match the schema | Check every sheet's first row | Headings match the on-screen columns in the same order | | |
| T58 | R6 | EDG | Very long file names | Rename a sample to a 60-character name, run, export | The sheet name is 31 characters or fewer; Excel opens without warnings | | |
| T59 | R6 | EDG | Two files with similar names | Run two labels whose names share their first 28 characters | Sheet names are made unique; no error | | |
| T60 | R25 | VIS | Workbook headers are presentation-ready | Open the exported workbook and inspect row 1 on each sheet | Header cells are visually distinct from data rows | ✅ | Verified on `Use_Summary_Table_2026-08-01.xlsx` after style-capable XLSX bundle update. |
| T61 | R25 | FUN | Header filters are enabled | Use the filter dropdown on at least three header cells per sheet | Filtering controls are available on every exported sheet | ✅ | `autoFilter` present on exported sheet range (`A1:AE45`) and filter dropdowns available in Excel. |
| T62 | R25 | DAT | Long text and value cues remain readable | Inspect long restriction cells plus `Confidence`, `NS`, and `NA` cells | Long text wraps cleanly; confidence levels are visually distinct; `NS` and `NA` are visually de-emphasized | ✅ | Exported style XML contains wrap-text alignments and dedicated fill colors for confidence and NS/NA. |
| T63 | R26 | FUN | QC pass path shows results | Run extraction on a known-good sample | QC pass message is shown and results table renders normally | | |
| T64 | R26 | NEG | QC fail path blocks results | Open `app/index.html?forceQcFail=1`, then run extraction | Results table stays hidden; placeholder states results are withheld until QC passes | | |
| T65 | R26 | DAT | QC defect details are visible | In a blocked run, inspect the QC defect panel | Defect list includes severity, defect code, and short description for each item | | |
| T66 | R27 | DAT | QC remediation fills missing physical form | Run `samples/264-REGG_PLENEXOS SMART_02_20_2026_BASE.pdf` and inspect rows that previously had `Physical Form = NS` | Physical Form is filled where label-supported evidence exists, and row confidence is recalculated | | |
| T67 | R27 | FUN | QC remediation reports timing fixes | Run the same Plenexos sample and inspect timing columns and QC panel | Missing timing fields are backfilled by QC fallback rules where applicable, and QC panel reports remediation actions | | |
| T68 | R27 | DAT | QC remediation fills App. Type when target is known | Run a sample where some rows have `App. Target` but `App. Type = NS` prior to remediation | App. Type is backfilled only on rows with clear method evidence, and QC notes report App. Type fixes | | |
| T69 | R28 | FUN | Three review stations appear after QC pass | Run extraction on a known-good sample and observe Step 3 after QC pass | Station 1/3, 2/3, and 3/3 appear in order with Yes/No controls | | |
| T70 | R28 | NEG | Selecting No pauses final release | During any station, click No | Final release pauses in review mode and export remains locked until station flow resumes and is approved | | |
| T71 | R28 | FUN | Final release requires all three Yes approvals | Click Yes through all three stations on a passing run | Final table is released and export becomes available only after all three approvals | | |

## Section H · Scanned labels and crop coverage (R15, R16)

| ID | Req | Cat | Test | Steps | Expected | Status | Notes |
|---|---|---|---|---|---|---|---|
| T80 | R15 | FUN | OCR reads a scanned label | Install the OCR library, run `04-scanned-image.pdf` | The log shows OCR per page and rows appear | | |
| T81 | R15 | NEG | Missing OCR library | With no `tesseract.min.js`, run the scanned sample | The log warns that pages lack a text layer; the app does not crash | | |
| T82 | R15 | EDG | Mixed text and scanned pages | Run a label where only some pages are images | Text pages read normally; only image pages use OCR | | |
| T83 | R16 | DAT | Uncommon crops are found | Use a label naming Jicama, Kohlrabi, or Lemongrass | A row appears for that crop | | |
| T84 | R16 | DAT | EPA crop groups are found | Search for "Pome Fruit" or "Cucurbit Vegetables" | Group names are detected where the label uses them | | |
| T85 | R16 | EDG | Plurals are matched | Check a label using "Apples" or "Tomatoes" | Rows appear under the singular crop name | | |

## Section I · Cross-cutting checks

| ID | Req | Cat | Test | Steps | Expected | Status | Notes |
|---|---|---|---|---|---|---|---|
| T86 | All | FUN | Clean console end to end | Upload, extract, edit, sort, export | No uncaught errors in the console | | |
| T87 | Boundaries | FUN | Nothing leaves the machine | Open the Network tab and run an extraction | Only CDN library files are fetched; no label content is uploaded | | |
| T88 | Boundaries | VIS | No sign-in anywhere | Look over the whole page | No login, account, or password field exists | | |
| T89 | All | EDG | A long label finishes | Run the longest available label (50+ pages) | It completes without freezing; the row count is plausible | | |
| T90 | All | EDG | Storage limit handled | Save many large runs until storage fills | A console warning appears; the app keeps working | | |
| T91 | All | INT | Keyboard access | Tab through the page and press Enter or Space on controls | Every control can be reached and operated, including upload drop zone and source-toggle buttons | | |
| T92 | All | VIS | Narrow screen layout | Resize the window to about 400px wide | Content stays readable; controls reflow; tables remain navigable without clipped controls | | |

---

## Traceability

Every requirement has at least one positive test and, where it can fail, a negative or edge test.

| Req | Tests | Count |
|---|---|---|
| R1 Upload | T1–T6 | 6 |
| R2 Run extraction | T7–T11 | 5 |
| R3 Whole label | T12–T15, T14a, T14b | 6 |
| R4 Complete rows | T16–T20, T20g | 6 |
| R5 On-screen table | T21–T27 | 7 |
| R6 Excel download | T55–T59 | 5 |
| R25 Presentable spreadsheet format | T60–T62 | 3 |
| R26 Runtime QC gate | T63–T65 | 3 |
| R27 QC auto-remediation | T66–T68 | 3 |
| R28 Three approval stations | T69–T71 | 3 |
| R11 Confidence | T28–T32 | 5 |
| R12 Page and source | T39–T43, T40a | 6 |
| R13 Coverage warnings | T44–T46 | 3 |
| R14 Editing | T47–T54 | 8 |
| R15 Scanned labels | T80–T82 | 3 |
| R16 Crop coverage | T83–T85 | 3 |
| R17 Sorting | T33–T38 | 6 |
| R18 One row per method | T20a | 1 |
| R19 Never infer | T20b, T16 | 2 |
| R20 Crop names whole | T20c | 1 |
| R21 Conditional values whole | T20d, T20h | 2 |
| R22 Per-cycle vs per-year | T20e | 1 |
| Extraction rules (`knowledge/extraction-rules.md`) | T20f | 1 |
| Cross-cutting | T86–T92 | 7 |
| **Total** | | **95** |

## Results

| Section | Tests | ✅ | ❌ | ⚠️ | ⏭️ |
|---|---|---|---|---|---|
| A · Upload and extraction | 17 | | | | |
| B · Output correctness | 13 | | | | |
| C · Table and filters | 18 | | | | |
| D · Detail and coverage | 9 | | | | |
| E · Editing | 8 | | | | |
| F · Exports | 17 | | | | |
| H · Scanned and crops | 6 | | | | |
| I · Cross-cutting | 7 | | | | |
| **Total** | **95** | | | | |

**Overall result:** ☐ Pass ☐ Pass with issues ☐ Fail

### Defects found

| # | Test ID | Severity | Description | Steps to reproduce |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

**Severity:** Blocker (cannot proceed) · Major (requirement unmet) · Minor (cosmetic or rare)

## Known risks before testing begins

These are expected weak points — check them first.

1. **T20 accuracy comparison** uses `samples/264-1198_SIVANTO® 400 SL_9_5_2019_BASE.pdf` against
   `samples/expected/sivanto-400-sl.md`. Treat differences as extraction defects unless the
   expected file is explicitly updated.
2. **T84 EPA crop groups** may fail. Multi-word terms such as "Pome Fruit" compete with single-word
   entries in the crop pattern, so the shorter match can win.
3. **T89 long labels** may stall the tab. Parsing runs on the main thread with no yielding.
4. **T91 and T92** should now be treated as release checks, not known failures. If they fail,
   log as regressions against recent accessibility and responsive-layout changes.
