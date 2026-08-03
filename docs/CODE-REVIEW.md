# Code Review — app/index.html

Date: 1 August 2026
Scope: app/index.html reviewed against specs/PRD.md (R1-R24), .github/copilot-instructions.md, and .github/instructions/app.instructions.md
Reviewer: GitHub Copilot

## 1. Summary

The app remains structurally strong: single-file vanilla implementation, schema-driven output, and clear extraction pipeline boundaries. This pass focused on applying the highest-impact findings from the previous review. High-severity anti-inference violations were removed, source-row expansion is now keyboard-accessible, and responsive breakpoints were added to align better with mobile-first guidance. One requirement risk remains: scanned-label OCR depends on a local vendor file that is still missing in the repository state.

## 2. What's Good

- Schema remains centralized in SCHEMA and consumed via DISPLAY/EXPORT mappings rather than duplicated column lists.
- Derived field provenance is preserved in exports through the Derived Fields column.
- Source-traceability remains intact with per-row page and source text expansion.
- Keyboard accessibility was improved for row expansion with a real button, focus state, and aria-expanded state management.
- Mobile behavior now has explicit breakpoints for layout and control sizing.

## 3. Issues Found

- High: R15 scanned-label readiness is still not fully met in current repo state.
  - Evidence: app/index.html loads vendor/tesseract.min.js and checks OCR availability, but app/vendor/ currently lacks tesseract.min.js.
  - Impact: scanned/image-only labels may not extract unless users manually add the vendor file.

- Low: Review workflow instruction mismatch in this repository.
  - Evidence: docs/CODE-REVIEW.md historical content had stale claims not aligned with current code state.
  - Impact: could confuse future triage if not kept current.
  - Status: fixed in this update by replacing the review file with current findings.

## 4. Suggestions

1. Add app/vendor/tesseract.min.js to the repository (or provide a first-run installer step) so R15 works out-of-the-box.
2. Add a small startup check that warns once when OCR dependency is missing, with a direct setup instruction.
3. Add a focused manual test case for keyboard-only source expansion and mobile viewport behavior in tests/manual-checklist.md.

## 5. Verdict

Needs Discussion

Reason: core high-severity parsing/accessibility findings from the previous review are now applied, but R15 readiness still depends on whether the project intends to ship with the local OCR bundle included.

---

## Applied Changes in This Pass

The following findings were applied directly in app/index.html:

- Removed inferred App. Timing default fallback (R19 alignment).
- Removed seed-treatment hardcoded timing text fallback.
- Removed seed-treatment hardcoded Max # Apps/C.C./Yr defaults.
- Removed seed-treatment hardcoded geographic restriction fallback.
- Replaced click-only toggle cell interaction with a keyboard-accessible button control.
- Added responsive CSS breakpoints for narrower screens.

Validation:

- Static diagnostics for app/index.html: no errors reported.