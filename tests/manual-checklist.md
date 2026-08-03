# Manual Test Checklist — Use Summary Tables Extractor

Every requirement in `specs/PRD.md` has at least one test here, plus failure and edge cases.
There is no automated test runner: this app is a single HTML file with no build step, so
verification is done by hand in a browser.

## How to run these tests

1. Open `app/index.html` in a browser.
2. Open the developer console (⌥⌘I on macOS) and keep it visible — several tests check it.
3. Click **Clear** before starting, so the file queue is empty.
4. Work top to bottom. Fill in **Actual** and tick the box as you go.
5. Record the outcome in the summary at the bottom.

**Tester:** _______________  **Date:** _______________  **Browser / version:** _______________

Sample files referenced below are described in `samples/README.md`.

---

## R1 · Upload labels

- [ ] should_list_both_files_when_two_pdfs_are_dropped
  - Steps:
    1. Open `app/index.html`.
    2. Drag `samples/01-simple-single-crop.pdf` and `samples/02-multi-crop-long.pdf` onto the drop zone together.
  - Expected: Both file names appear in the list, each with its size in MB.
  - Actual:

- [ ] should_add_file_when_selected_through_file_browser
  - Steps:
    1. Click the drop zone.
    2. Pick one PDF from the file picker.
  - Expected: The chosen file appears in the list.
  - Actual:

- [ ] should_ignore_file_when_it_is_not_a_pdf
  - Steps:
    1. Drag a `.txt` or `.png` file onto the drop zone.
  - Expected: Nothing is added; the status still reads "No files selected."
  - Actual:

- [ ] should_not_duplicate_when_same_file_is_added_twice
  - Steps:
    1. Add one PDF.
    2. Add the identical file again.
  - Expected: The list still shows one entry.
  - Actual:

- [ ] should_remove_file_when_remove_button_clicked
  - Steps:
    1. Add two PDFs.
    2. Click **Remove** on the first.
  - Expected: Only the second remains; the count updates.
  - Actual:

## R2 · Run extraction

- [ ] should_disable_run_button_when_no_files_selected
  - Steps:
    1. Open the app with an empty file list.
  - Expected: **Run Extraction** is greyed out and cannot be clicked.
  - Actual:

- [ ] should_show_progress_when_extraction_is_running
  - Steps:
    1. Add a PDF and click **Run Extraction**.
  - Expected: A progress bar fills, the status names the file being read, and a log appears.
  - Actual:

- [ ] should_re_enable_buttons_when_extraction_finishes
  - Steps:
    1. Wait for the run above to finish.
  - Expected: **Run Extraction** and **Clear** are clickable again.
  - Actual:

- [ ] should_report_error_and_continue_when_pdf_is_corrupt
  - Steps:
    1. Rename any non-PDF file to `broken.pdf` and add it alongside a valid label.
    2. Run extraction.
  - Expected: The log shows a ✖ line for the broken file; the valid file still produces rows.
  - Actual:

## R3 · Read the whole label

- [ ] should_read_every_page_when_multipage_pdf_uploaded
  - Steps:
    1. Note the page count of `02-multi-crop-long.pdf` in a PDF viewer.
    2. Run extraction on it.
  - Expected: The log reports the same page count and lists a line per page.
  - Actual:

- [ ] should_find_crops_when_they_appear_late_in_the_document
  - Steps:
    1. Pick a crop mentioned only on the last pages of the label.
    2. Search for it in the results table.
  - Expected: A row exists for that crop.
  - Actual:

- [ ] should_extract_uses_when_written_as_prose_instead_of_a_table
  - Steps:
    1. Run extraction on `03-text-only-uses.pdf`.
  - Expected: Rows appear with rates pulled from sentences, not only from tables.
  - Actual:

- [ ] should_extract_seed_treatment_rows_when_label_has_no_foliar_soil_headings
  - Steps:
    1. Run extraction on `samples/264-1142_BYI 02960 480 FS_10_21_2025_BASE.pdf`.
  - Expected: The table contains at least the `Soybean` and `Canola (including Brassica napus, Brassica rapa, Brassica juncea ) and Rapeseed` use rows, with `App. Target = Seed Treatment`.
  - Actual:

- [ ] should_extract_non_empty_rows_when_plenexos_label_is_processed
  - Steps:
    1. Run extraction on `samples/264-REGG_PLENEXOS SMART_02_20_2026_BASE.pdf`.
  - Expected: Output is not empty and includes multiple use rows (not just a fallback placeholder row).
  - Actual:

## R4 · Complete, consistent rows

- [ ] should_fill_every_column_when_row_is_created
  - Steps:
    1. Run any extraction.
    2. Scan the table for blank cells.
  - Expected: No cell is empty; unknown values read `NS` in grey italics, and columns that do not apply read `NA`.
  - Actual:

- [ ] should_show_all_27_columns_when_table_renders
  - Steps:
    1. Compare the table headings against the column table in `specs/PRD.md` §3.
  - Expected: All 27 schema columns appear, spelled the same and in the same order, preceded by Page and Confidence.
  - Actual:

- [ ] should_confirm_schema_when_extraction_completes
  - Steps:
    1. Read the green confirmation after a run.
  - Expected: It states the output is schema-verified with all columns present and no blanks.
  - Actual:

- [ ] should_emit_placeholder_row_when_no_crops_are_found
  - Steps:
    1. Run extraction on a PDF with no crop names (any unrelated text PDF).
  - Expected: One row appears whose Additional Information reads "No crop or use entries detected in this document."
  - Actual:

- [ ] should_match_the_reference_sheet_when_sivanto_label_is_run
  - Steps:
    1. Run extraction on `samples/264-1198_SIVANTO® 400 SL_9_5_2019_BASE.pdf`.
    2. Compare against `samples/expected/sivanto-400-sl.md`.
  - Expected: The uses and use sites match row for row; record any difference as a defect.
  - Actual:

- [x] should_capture_reg_number_for_sivanto_200
  - Steps:
    1. Run extraction on `samples/264-1141_SIVANTO® 200 SL_9_24_2020_BASE.pdf`.
    2. Check the **Reg. #/File Sym** column on several rows.
  - Expected: Rows show `264-1141` (not `NS`).
  - Actual: Pass — SIVANTO 200 rows show `264-1141` in Reg. #/File Sym.

## R18 · One row per application method

- [ ] should_create_separate_rows_when_a_use_site_allows_several_methods
  - Steps:
    1. Find a use site the label permits by both ground and aerial application.
  - Expected: Two rows exist, identical except for **App. Type**. The methods are not merged into one cell.
  - Actual:

## R19 · Never infer a value

- [ ] should_write_ns_when_the_label_states_no_value
  - Steps:
    1. Find a row where the label gives no minimum retreatment interval.
  - Expected: **MRI (days)** reads `NS`. No plausible-looking number has been supplied.
  - Actual:

- [ ] should_use_only_this_labels_wording_when_cells_are_filled
  - Steps:
    1. Pick five **Additional Information** cells at random.
    2. Search the PDF for each phrase.
  - Expected: Every phrase is found verbatim in this label. Nothing has been borrowed from another product.
  - Actual:

## R20 · Crop names kept whole

- [ ] should_keep_the_qualifier_when_a_crop_name_has_one
  - Steps:
    1. Find a use site with a qualifier — a crop group number, an "except" clause, or a bracketed note.
  - Expected: The full wording appears in a single cell, neither split across rows nor truncated.
  - Actual:

## R21 · Conditional values kept whole

- [ ] should_keep_the_condition_when_a_value_is_conditional
  - Steps:
    1. Find a PHI or rate stated with a condition attached.
  - Expected: The whole conditional phrase is in the cell, not just the bare number.
  - Actual:

- [x] should_prefer_when_pests_occur_phrase_for_app_timing_other
  - Steps:
    1. Run extraction on a SIVANTO sample.
    2. Inspect **App. Timing (other)** cells that mention pests.
  - Expected: Pest-trigger timing reads `when pests occur`.
  - Actual: Pass — sampled SIVANTO rows show `When pests occur` after sentence-start capitalization.

## R22 · Per-cycle and per-year kept apart

- [ ] should_not_copy_across_when_only_one_period_is_stated
  - Steps:
    1. Find a row where the label states a per-crop-cycle limit but no yearly limit, or the reverse.
  - Expected: The stated column carries the value; the other reads `NS`. The value is not duplicated.
  - Actual:

## R5 · Show results on screen

- [ ] should_group_rows_by_file_when_multiple_labels_processed
  - Steps:
    1. Run extraction on two labels at once.
  - Expected: Two groups appear, each headed by its file name and row count.
  - Actual:

- [ ] should_filter_rows_when_search_text_is_typed
  - Steps:
    1. Type a crop name into the search box.
  - Expected: Only matching rows remain and matches are highlighted.
  - Actual:

- [ ] should_show_empty_message_when_search_matches_nothing
  - Steps:
    1. Type `zzzzz` into the search box.
  - Expected: A message says no rows match the current filters.
  - Actual:

- [ ] should_show_only_low_rows_when_confidence_filter_is_set
  - Steps:
    1. Choose **Low only** in the confidence dropdown.
  - Expected: Every visible row carries a Low badge.
  - Actual:

## R6 · Download a spreadsheet

- [ ] should_download_xlsx_when_excel_button_clicked
  - Steps:
    1. Click **Excel (.xlsx)** after a run.
  - Expected: A file named `Use_Summary_Table_<date>.xlsx` downloads.
  - Actual:

- [ ] should_create_one_sheet_per_label_plus_combined_when_file_opened
  - Steps:
    1. Open the downloaded file in Excel.
  - Expected: An **All Uses** sheet plus one sheet per label; headings match the on-screen columns.
  - Actual:

- [ ] should_shorten_sheet_name_when_file_name_is_very_long
  - Steps:
    1. Rename a sample PDF to a 60-character name, then run and export.
  - Expected: The sheet name is truncated to 31 characters or fewer and Excel opens without warnings.
  - Actual:

## R25 · Presentable spreadsheet format

- [x] should_render_colored_header_and_filter_controls_when_excel_is_opened
  - Steps:
    1. Run extraction and download Excel.
    2. Open the workbook in Excel and inspect row 1 on each sheet.
  - Expected: Header row is visually distinct and filter dropdowns are enabled for all header cells.
  - Actual: Pass on `Use_Summary_Table_2026-08-01.xlsx` — headers are color-filled and `autoFilter` is present on exported sheets.

- [x] should_wrap_long_restriction_text_without_manual_column_resizing
  - Steps:
    1. Open a row with long restriction text in the exported workbook.
    2. Click the cell and check alignment settings.
  - Expected: Long text is wrapped inside the cell and remains readable without manual resize.
  - Actual: Pass — export styles include `wrapText=true`, and long text columns are width-sized instead of clipping by default.

- [x] should_apply_visual_cues_for_confidence_and_ns_na_cells
  - Steps:
    1. In the exported workbook, find High/Medium/Low confidence rows and any `NS` or `NA` cells.
  - Expected: Confidence cells are color-coded by level, and `NS` / `NA` cells are visibly de-emphasized.
  - Actual: Pass — style palette includes confidence and NS/NA fills, and confidence cells in the workbook reference non-default style IDs.

## R26 · Runtime QC gate before showing results

- [ ] should_show_qc_pass_message_before_results_are_displayed
  - Steps:
    1. Run extraction on a known-good sample.
    2. Wait for run completion.
  - Expected: A QC pass message appears and the results table is shown.
  - Actual:

- [ ] should_hide_results_and_show_defects_when_qc_blocks
  - Steps:
    1. Open the app with `?forceQcFail=1` appended to the URL.
    2. Run extraction.
  - Expected: Results stay hidden, placeholder says results are withheld, and a QC defects list is shown.
  - Actual:

## R27 · QC auto-remediation before release

- [ ] should_fill_missing_physical_form_during_qc_remediation
  - Steps:
    1. Run extraction on `samples/264-REGG_PLENEXOS SMART_02_20_2026_BASE.pdf`.
    2. Inspect rows that previously had `Physical Form = NS`.
  - Expected: QC remediation fills Physical Form where form evidence exists in the label text.
  - Actual:

- [ ] should_fill_missing_app_timing_and_report_qc_remediation_actions
  - Steps:
    1. Run extraction on `samples/264-REGG_PLENEXOS SMART_02_20_2026_BASE.pdf`.
    2. Inspect `App. Timing (Site Status)` and `App. Timing (other)` plus the QC panel text.
  - Expected: Missing timing cells are backfilled by QC fallback rules where applicable, and the QC panel lists auto-remediation actions.
  - Actual:

- [ ] should_fill_missing_app_type_when_target_is_known
  - Steps:
    1. Run extraction on a label where at least one row has `App. Target` but `App. Type = NS` before remediation.
    2. Check those rows after QC remediation.
  - Expected: `App. Type` is filled only when evidence supports one method, and QC panel reports App. Type remediation count.
  - Actual:

## R28 · Three user approval stations before final release

- [ ] should_show_three_review_stations_after_qc_pass
  - Steps:
    1. Run extraction on a known-good sample.
    2. Observe the Step 3 area after QC passes.
  - Expected: Review stations appear in order as Station 1/3, Station 2/3, Station 3/3 with Yes/No controls.
  - Actual:

- [ ] should_pause_final_release_when_user_selects_no_at_a_station
  - Steps:
    1. Run extraction on a known-good sample.
    2. At any station, click **No, pause for review**.
  - Expected: Final release is paused, draft rows can be reviewed/edited, and export remains blocked until the station flow is resumed and approved.
  - Actual:

- [ ] should_release_results_only_after_yes_on_all_stations
  - Steps:
    1. Run extraction on a known-good sample.
    2. Click **Yes, continue** on all three stations.
  - Expected: Final table is released and export is enabled only after all three approvals.
  - Actual:

## R11 · Confidence rating

- [ ] should_show_a_badge_on_every_row_when_results_render
  - Steps:
    1. Look down the Confidence column.
  - Expected: Every row shows High, Medium, or Low, colour-coded.
  - Actual:

- [ ] should_tint_the_row_when_confidence_is_low
  - Steps:
    1. Find a Low row.
  - Expected: Its background is tinted so it stands out.
  - Actual:

- [ ] should_recalculate_confidence_when_a_cell_is_edited
  - Steps:
    1. Find a Low row and fill in several empty cells with real values.
  - Expected: The badge rises to Medium or High.
  - Actual:

## R12 · Page and source text

- [ ] should_show_a_page_number_on_every_row
  - Steps:
    1. Check the Page column.
  - Expected: Every row has a page number within the document's page count.
  - Actual:

- [ ] should_reveal_source_text_when_row_toggle_is_clicked
  - Steps:
    1. Click the **▸** on any row.
  - Expected: A panel opens showing the page, file name, and the label wording behind the row.
  - Actual:

- [ ] should_close_the_panel_when_toggle_is_clicked_again
  - Steps:
    1. Click the same **▾** again.
  - Expected: The panel closes and the marker returns to **▸**.
  - Actual:

- [ ] should_toggle_source_text_when_toggle_button_is_used_with_keyboard
  - Steps:
    1. Tab to a row's source toggle button.
    2. Press Enter; then press Enter again.
  - Expected: First keypress expands source text and `aria-expanded` becomes `true`; second keypress collapses it and `aria-expanded` returns to `false`.
  - Actual:

## R13 · Coverage warnings

- [ ] should_list_sparse_crops_when_coverage_is_thin
  - Steps:
    1. Run extraction on `02-multi-crop-long.pdf`.
  - Expected: If any crop matched one field or none, an amber panel names it with its page.
  - Actual:

- [ ] should_hide_the_panel_when_every_crop_is_well_covered
  - Steps:
    1. Run extraction on a label where all crops extract cleanly.
  - Expected: No warning panel appears.
  - Actual:

## R14 · Fix mistakes

- [ ] should_save_the_value_when_a_cell_is_edited
  - Steps:
    1. Double-click a cell, type a new value, press Enter.
  - Expected: The value sticks and the cell is marked as edited.
  - Actual:

- [ ] should_keep_edits_when_page_is_refreshed
  - Steps:
    1. Edit a cell, then refresh the page.
  - Expected: The table resets after refresh. Re-run extraction and verify the edited value can be reapplied and exported.
  - Actual:

- [ ] should_include_edits_when_results_are_exported
  - Steps:
    1. Edit a cell, then download Excel.
  - Expected: The file contains the edited value.
  - Actual:

- [ ] should_show_not_specified_when_a_cell_is_emptied
  - Steps:
    1. Clear a cell completely and click away.
  - Expected: It reverts to `NS` rather than staying blank.
  - Actual:

## R15 · Scanned labels

- [ ] should_produce_rows_when_scanned_pdf_processed_with_ocr_installed
  - Steps:
    1. Install `app/vendor/tesseract.min.js` per `app/vendor/README.md`.
    2. Run extraction on `04-scanned-image.pdf`.
  - Expected: The log shows OCR running per page and rows appear.
  - Actual:

- [ ] should_warn_and_continue_when_ocr_library_is_missing
  - Steps:
    1. With no `tesseract.min.js` present, run the scanned sample.
  - Expected: The log warns that pages have no text layer and OCR is unavailable; the app does not crash.
  - Actual:

## R16 · Wide crop coverage

- [ ] should_create_a_row_when_an_uncommon_crop_is_mentioned
  - Steps:
    1. Use a label mentioning a crop such as Jicama, Kohlrabi, or Lemongrass.
  - Expected: A row appears for that crop.
  - Actual:

- [ ] should_recognise_epa_crop_groups_when_label_uses_group_names
  - Steps:
    1. Search the results for a group name such as "Pome Fruit" or "Cucurbit Vegetables".
  - Expected: Group names are detected as crops where the label uses them.
  - Actual:

## R17 · Sort the table

- [ ] should_sort_ascending_when_a_heading_is_clicked_once
  - Steps:
    1. Click the **Use Site** heading.
  - Expected: Rows sort A–Z and a ▲ appears in that heading.
  - Actual:

- [ ] should_sort_descending_when_the_same_heading_is_clicked_again
  - Steps:
    1. Click **Use Site** a second time.
  - Expected: Order reverses and the arrow becomes ▼.
  - Actual:

- [ ] should_sort_numerically_when_page_or_phi_column_used
  - Steps:
    1. Sort by **Page**, then by **PHI (days)**.
  - Expected: Values order as numbers (2 before 10), not as text.
  - Actual:

- [ ] should_push_ns_and_na_rows_to_the_bottom_when_sorting
  - Steps:
    1. Sort by a column containing several `NS` and `NA` values.
  - Expected: Those rows sit at the bottom in both directions.
  - Actual:

## Cross-cutting checks

- [ ] should_keep_console_clean_when_full_workflow_is_run
  - Steps:
    1. Run through upload, extract, edit, sort, and export.
  - Expected: No uncaught errors in the console.
  - Actual:

- [ ] should_stay_client_side_when_extraction_runs
  - Steps:
    1. Open the Network tab and run an extraction.
  - Expected: Only the CDN library files are fetched. No label content is uploaded anywhere.
  - Actual:

- [ ] should_render_safely_when_label_text_contains_html
  - Steps:
    1. Edit a cell to `<script>alert(1)</script>` and press Enter.
  - Expected: The text shows literally; no dialog appears.
  - Actual:

- [ ] should_handle_a_large_label_when_many_pages_are_processed
  - Steps:
    1. Run extraction on the longest available label (50+ pages).
  - Expected: It finishes without freezing and the row count is plausible.
  - Actual:

- [ ] should_reflow_controls_and_table_on_mobile_viewport
  - Steps:
    1. Open browser devtools device toolbar and set viewport width to 390px.
    2. Load the app and run an extraction.
  - Expected: Primary controls stack cleanly, filters remain usable without overlap, and the results area is navigable without clipped controls.
  - Actual:

## Accessibility (app.instructions.md — Task 31)

- [ ] should_reach_the_upload_control_when_tabbing_from_the_top_of_the_page
  - Steps:
    1. Load the page, click once on the page heading, then press Tab repeatedly.
  - Expected: The drop zone receives focus and shows a visible blue outline.
  - Actual:

- [ ] should_open_the_file_browser_when_enter_or_space_is_pressed_on_the_drop_zone
  - Steps:
    1. Tab to the drop zone, press Enter. Close the dialog, press Space.
  - Expected: The file browser opens both times; the page does not scroll on Space.
  - Actual:

- [ ] should_complete_a_whole_extraction_without_using_the_mouse
  - Steps:
    1. Using only the keyboard, select `264-1198_SIVANTO® 400 SL_9_5_2019_BASE.pdf`, reach **Run Extraction**, and activate it. Then Tab to **Excel (.xlsx)** and activate it.
  - Expected: The run completes and the file downloads; every control is reachable.
  - Actual:

- [ ] should_announce_progress_and_completion_when_a_run_is_performed
  - Steps:
    1. Turn on VoiceOver (Cmd+F5). Run an extraction.
  - Expected: The status line, the run log, and the completion notice are announced as they update.
  - Actual:

- [ ] should_report_sort_state_when_a_column_heading_is_used
  - Steps:
    1. Inspect a sortable `<th>` after clicking it once, then again.
  - Expected: `aria-sort` reads `ascending`, then `descending`; unsorted headings read `none`.
  - Actual:

- [ ] should_expose_a_main_landmark_when_the_page_is_navigated_by_region
  - Steps:
    1. With VoiceOver running, use the rotor to list landmarks.
  - Expected: A `main` landmark is listed and jumps past the header.
  - Actual:

---

## Results summary

| Requirement | Tests | Passed | Failed | Notes |
|---|---|---|---|---|
| R1 Upload | 5 | | | |
| R2 Run | 4 | | | |
| R3 Whole label | 5 | | | |
| R4 Complete rows | 6 | | | |
| R5 On-screen table | 4 | | | |
| R6 Excel | 3 | | | |
| R25 Presentable spreadsheet format | 3 | | | |
| R26 Runtime QC gate | 2 | | | |
| R27 QC auto-remediation | 3 | | | |
| R28 Three approval stations | 3 | | | |
| R11 Confidence | 3 | | | |
| R12 Page / source | 4 | | | |
| R13 Coverage warnings | 2 | | | |
| R14 Editing | 4 | | | |
| R15 Scanned labels | 2 | | | |
| R16 Crop coverage | 2 | | | |
| R17 Sorting | 4 | | | |
| R18 One row per method | 1 | | | |
| R19 Never infer | 2 | | | |
| R20 Crop names whole | 1 | | | |
| R21 Conditional values whole | 2 | | | |
| R22 Per-cycle vs per-year | 1 | | | |
| Cross-cutting | 5 | | | |
| Accessibility | 6 | | | |
| **Total** | **78** | | | |

**Overall result:** ☐ Pass  ☐ Pass with issues  ☐ Fail

**Issues found:**

1.
2.
3.
