# Sample Labels — Test Set

Place pesticide label PDFs in this folder to test the extractor. The set below covers the
four cases named in `specs/PRD.md`.

## Labels present

| File | Case tested | Expected output |
|---|---|---|
| `264-1198_SIVANTO® 400 SL_9_5_2019_BASE.pdf` | Long, many use tables | `expected/sivanto-400-sl.md` — **41 rows across 28 uses** |

This is the reference label. Its hand-checked table is
`knowledge/golden-examples/golden_example_SIVANTO_400_SL.txt`, which makes it the one label
where output can be verified cell-by-cell.

It exercises the hardest rules:

- **R18** — 13 crops have both a foliar and a soil row; two also have a Planthouse row
- **R20** — crop-group exceptions such as `TREE NUTS (Crop Group 14-12) - EXCEPT ALMOND`
- **R21** — conditional PHIs such as `7-days hay, forage…; 21-days dried grain, stover or straw`
- **R22** — per-crop-cycle and per-year totals differ where `Max No. of CC/yr` is 3

## Still needed

| # | File name (suggested)      | Case tested            | What to look for                                        |
|---|----------------------------|------------------------|---------------------------------------------------------|
| 1 | `01-simple-single-crop.pdf`| Short, single crop     | Baseline — one crop, a handful of uses, clean table      |
| 3 | `03-text-only-uses.pdf`    | Uses in prose/bullets  | Non-tabular parsing — rates written in sentences         |
| 4 | `04-scanned-image.pdf`     | Scanned / image PDF    | OCR fallback — text layer is absent                      |

## Where to get labels

Public, free sources for EPA-registered labels:

- EPA Pesticide Product and Label System — <https://ordspub.epa.gov/ords/pesticides/f?p=PPLS:1>
- CDMS label database — <https://www.cdms.net/Label-Database>
- Agrian label lookup — <https://home.agrian.com/label-search>

Download 3–5 labels, rename them using the pattern above, and drop them in this folder.

## How to verify accuracy

1. Open `app/index.html` in a browser.
2. Upload `264-1198_SIVANTO® 400 SL_9_5_2019_BASE.pdf` and click **Run Extraction**.
3. Compare the on-screen table against `expected/sivanto-400-sl.md`.
4. Record the result in the results table at the bottom of that file.

### Accuracy checklist

- [ ] Every use listed in `expected/sivanto-400-sl.md` appears in the output (28 uses).
- [ ] Crops with two application methods produce two rows, not one (R18).
- [ ] Every row has all 27 schema columns filled — unknowns show `NS`, never empty.
- [ ] `TREE NUTS` retains `- EXCEPT ALMOND` (R20).
- [ ] Conditional PHIs are preserved whole, not reduced to one number (R21).
- [ ] `Max Total Rate/Yr` ≈ `Max Total Rate/C.C.` × `Max No. of CC/yr` (R22).
- [ ] The downloaded `.xlsx` has one sheet per label plus an `All Uses` sheet.
- [ ] Sheet headers match the `SCHEMA` order exactly.

### Known limitations

- Scanned/image-only PDFs have no text layer, so sample #4 currently returns zero rows.
  An OCR step (e.g. Tesseract.js) would be needed to support it.
- The parser uses a crop vocabulary; crops outside that list are not detected. Add new terms
  to `CROP_TERMS` in `app/index.html` as needed.
