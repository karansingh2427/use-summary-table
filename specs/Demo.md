# Demo Script — Use Summary Tables Extractor

A five-minute walkthrough for showing the prototype. Tags in brackets refer to requirements in
`specs/PRD.md`.

## Before you start

- Have `samples/01-simple-single-crop.pdf` and `samples/02-multi-crop-long.pdf` ready.

## Walkthrough

1. **Open the app.** Open `app/index.html` in a browser. Point out the title and description.
2. **Upload two labels.** Drag `01-simple-single-crop.pdf` and `02-multi-crop-long.pdf` from the
   `samples/` folder. Both names appear. *(R1)*
3. **Run it.** Click **Run Extraction**. Watch the progress bar and page-by-page log. *(R2, R3)*
4. **Review the table.** Show the summary counts, then scroll the table grouped by file. Note that
   no cell is empty. *(R4, R5)*
5. **Show the trust features.** Point at a Low-confidence badge, filter to "Low only", then expand
   a row to reveal the page number and the original label wording. Show the coverage warning panel.
   *(R11, R12, R13)*
6. **Search and sort.** Type a crop name to filter, then click the Crop heading to sort. *(R5, R17)*
7. **Fix something.** Double-click a cell, correct it, and show the edited marker. *(R14)*
8. **Download.** Click **Excel** and open the file — show the per-label sheets and the combined
   sheet. *(R6)*
9. **Close on the caveat.** Say plainly: this is a prototype and a reading aid. Every row should
    be checked against the label before it is relied on. The confidence ratings and coverage
    warnings show where to look first.

## If something goes wrong

- **No rows appear.** The label is probably a scanned image. Note that picture-reading needs
  `app/vendor/tesseract.min.js` installed *(R15)*, then switch to a text-based sample.
- **Nothing loads at all.** The app fetches two libraries from the internet the first time it
  opens. Check the connection, or open the page once while online so they are cached.
