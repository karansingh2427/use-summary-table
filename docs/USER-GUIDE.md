# Use Summary Table Extractor — User Guide

*Last Updated: 1 August 2026*

A plain-language guide for anyone opening this tool for the first time.
No technical background needed.

---

## 1 · What this tool is for

Pesticide labels are long PDF documents. The information you usually need — which crops
the product may be used on, which pests it controls, how much to apply, and how long to
wait before harvest — is scattered across dozens of pages, sometimes in tables and
sometimes buried in paragraphs.

**This tool reads the whole label and pulls all of that into one table.**

You get **one row for every combination of use, use site, and application method** the
label describes. That means a single crop can produce several rows — if a label allows
both ground and aerial application to lettuce, that is two rows, not one.

Each row has 27 columns, in five groups.

**Product — what the label is for**

| Column | What it means |
|---|---|
| Reg. #/File Sym | The EPA registration number printed on the label |
| Physical Form | The form of the product — liquid, granule, wettable powder, and so on |
| Product Name (PBN) | The product's brand name |

**Site — what is being treated**

| Column | What it means |
|---|---|
| Use | The broad use category, such as a crop group |
| Use Site | The specific site or crop being treated |

**Application method — how it is applied**

| Column | What it means |
|---|---|
| App. Target | What the application is aimed at — foliage, soil, seed |
| App. Type | The method — ground, aerial, chemigation |
| App. Equipment | The equipment named on the label |
| App. Timing (Site Status) | The stage of the site or crop when applied |
| App. Timing (other) | Any other timing wording from the label |

**Rate pattern — how much, how often, how long to wait**

| Column | What it means |
|---|---|
| App Rate (lb ai/A) | The application rate as active ingredient per acre |
| A.I. Max Single Rate/App. (lb a.i./A) | The most allowed in one application |
| Max # Apps/C.C. | Maximum applications per crop cycle |
| A.I. Max Total Rate/C.C. (lb a.i./A) | Maximum total per crop cycle |
| Max # Apps/Yr. | Maximum applications per year |
| A.I. Max Total Rate/Yr. (lb a.i./A) | Maximum total per year |
| MRI (days) | Minimum days between applications |
| REI | How long before people may re-enter the treated area |
| PHI (days) | Days to wait between applying and harvesting |
| PPE | Protective equipment required |
| Additional Information | Other rate-related wording from the label |
| Max No. of CC/yr | How many crop cycles a year the label allows |

**Restrictions — where and when it may not be used**

| Column | What it means |
|---|---|
| Geographic Restrictions | States, regions, or areas where use is limited |
| Drift Restrictions | Buffer zones, wind limits, nozzle requirements |
| Soil Restrictions | Soil type, depth to groundwater, or similar limits |
| On-field Non-target Species Restrictions | Protections for bees, birds, and other wildlife |
| Additional Restrictions for Use/Use Site | Anything else the label restricts for this row |

Two extra columns help you check the tool's work:

- **Page** — which page of the PDF the row came from.
- **Confidence** — **High**, **Medium**, or **Low**, depending on how much of the row the
  tool was able to fill in. Low-confidence rows are shaded so they are easy to spot.

Cells are never left blank, so you can always tell the difference between "the label is
silent on this" and "the tool missed it". Two short codes are used:

- **NS** — *not specified*. The label does not state this value. The tool never guesses.
- **NA** — *not applicable*. The column does not apply to this kind of use.

### Two things worth knowing

1. **Nothing you upload leaves your computer.** The tool runs entirely inside your web
   browser. There is no server, no sign-in, and no account.
2. **It is an assistant, not a replacement for review.** Always spot-check rows against
   the label — that is exactly what the Page and Confidence columns are for.

### Getting started in three steps

1. Open `app/index.html` in a web browser (Chrome, Edge, Firefox, or Safari).
2. Drag one or more label PDFs onto the upload box, or click it to browse for files.
3. Click **Run Extraction** and wait for the progress bar to finish.

The table appears in section 3 of the page.

---

## 2 · How to read the Excel document

Once results are on screen, click the **⬇ Excel (.xlsx)** button. A file named something
like `Use_Summary_Table_2026-08-01.xlsx` is saved to your Downloads folder. Open it in
Excel, Numbers, or Google Sheets.

### What is inside the file

The workbook has several tabs (sheets) along the bottom:

1. **All Uses** — the first tab. Every row from every label you processed, combined into
   one list. This is the sheet most people want. It has an extra **Source File** column at
   the far left telling you which PDF each row came from.
2. **One tab per label** — after the combined tab, there is a separate tab for each PDF you
   uploaded, named after that file. Use these when you want to look at a single label on
   its own.

> **Tip:** Excel limits tab names to 31 characters, so a long PDF filename will appear
> shortened on the tab. The full filename is always visible in the **Source File** column
> of the **All Uses** tab.

### The "Derived Fields" column

The last column of every sheet is **Derived Fields**. It tells you which values in that row
were *not* copied word-for-word from the label.

Three columns — **Use Site**, **App. Type** and **App. Timing (Site Status)** — are hardly
ever printed on a label as plain text. A trained reviewer fills them by reading the
application instructions and applying a standard convention. The tool follows that same
written convention, and records every time it does so.

| What you see | What it means |
|---|---|
| `None — all values read from the label` | Every value in the row came straight off the label. |
| `Use Site (D1.4); App. Type (D2.1)` | Those two values were worked out by convention. The codes are rule numbers. |

The rule numbers refer to `knowledge/derivation-rules.md`, which lists what evidence each
rule requires. If a derived value looks wrong for a particular use, that file explains why
the tool reached it.

**Why this matters:** anything marked here is a reasoned judgement, not a quotation. If you
are relying on one of these values for a regulatory decision, check it against the label
first. Values not listed here were read directly from the label text.

On screen, the same cells are shaded amber with a **◆** symbol. Hover over one to see which
rule produced it.

### Reading a row

Read each row left to right as a single sentence:

> *On **Use Site**, apply **App Rate (lb ai/A)** by **App. Type** to **App. Target**, no
> more than **Max # Apps/Yr.** times, waiting **PHI (days)** days before harvest.*

Remember that the same crop may appear on several rows — one for each application method
the label allows.

### What to check first

1. **Sort or filter by the Confidence column.** Start with the **Low** rows — those are
   the ones most likely to need a correction.
2. **Use the Page column to verify.** Open the original PDF at that page number and
   compare. This is the fastest way to confirm a row is right.
3. **Read the Additional Information column.** It carries extra label wording for the row,
   so you can see where the values came from without leaving the spreadsheet.
4. **Treat NS as a question, not an error.** It means the label did not state that value
   near this use. Sometimes the value genuinely is elsewhere on the label.
5. **Check the per-cycle and per-year columns separately.** A label may state a limit for
   one and not the other; the tool never copies a value from one into the other.

### Correcting a mistake before you download

If you spot a wrong value in the on-screen table, **double-click the cell**, type the
correct value, and press Enter. Corrected cells are marked so you can see what you
changed, and your correction is included in the Excel download. Always correct on
screen rather than in Excel — that way exports always include your latest fixes.

---

## 3 · How to reset the data

There are three different "clear" actions, and they do different things. Read this section
before clicking anything.

### A · Clear the files you selected — safe

**Where:** the **Clear** button in section 1, next to **Run Extraction**.

**What it does:** empties the list of PDFs you have chosen, so you can pick different ones.

**What it does not do:** it does not touch your results table.

Use this when you picked the wrong file by mistake.

### Starting completely fresh

To return the tool to the state it was in the very first time you opened it:

1. Click **Clear** in section 1 to empty the file list.
2. Refresh the page.

The results table disappears and the message *"Results will appear here once extraction has
run."* returns.

---

## 4 · Troubleshooting

| What you see | What to do |
|---|---|
| **Run Extraction** is greyed out | No files are selected yet. Drag a PDF onto the upload box, or click it to browse. |
| No rows appeared after a run | The label may be a scanned picture rather than text. Check the log for a message about picture-reading. Also confirm you uploaded a pesticide label and not another kind of document. |
| Lots of **Low** confidence rows | The label's layout was hard to interpret. Review those rows against the page numbers shown and correct them by double-clicking the cells. |
| A crop you expected is missing | Check the warning panel above the table. It has two sections: **crops named in the label with no row at all** (the tool spotted the name but could not find a use section for it — the most likely place a crop went missing) and **rows that may be under-read**. If the crop appears in neither list, search the PDF to confirm it really is on the label. |
| The page seems frozen on a very long label | Large labels take time to read. Wait for the progress bar; avoid closing the tab while it is moving. |
| The Excel file will not open | Make sure the download finished, then run extraction again and retry the **⬇ Excel (.xlsx)** button. |

---

## 5 · Quick reference

| I want to… | Click this |
|---|---|
| Add label PDFs | The upload box, or drag files onto it |
| Start the extraction | **Run Extraction** |
| Find a crop in the table | Type it into the search box |
| See only weak rows | Set the confidence dropdown to **Low only** |
| See where a row came from | The **▸** arrow at the start of the row |
| Fix a wrong value | Double-click the cell, type, press Enter |
| Save a spreadsheet | **⬇ Excel (.xlsx)** |
| Reorder the table | Click a column heading; click again to reverse |
