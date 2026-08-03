# Use Summary Schema — Column Reference

**Priority 4 source.** Defines what each column means and how to fill it.

The authoritative column list and order is `SCHEMA` in `app/index.html`. If this document
and `SCHEMA` ever disagree, `SCHEMA` wins and this file must be corrected.

## Purpose

> To accurately document each product's uses, application methods and rates, and use
> restrictions **to facilitate ecological exposure modeling**.
> — `UST_definitions.txt`

That purpose drives the schema's shape: rates are carried as **lb a.i./A**, and
per-crop-cycle and per-year maxima are tracked as separate columns.

## The unit of a row

> Each row contains **one use, one use site, and one set of application instructions**.
> Some use and use sites may be redundant while application methods differ.

A crop with both a foliar and a soil application is **two rows** — the rates, PHI, and
restrictions differ. Row count is driven by the label, never fixed.

## The 27 Schema Columns

Order matters — exports are written in exactly this sequence.

### Product

| # | Column | Definition |
|---|---|---|
| 1 | **Reg. #/File Sym** | EPA Registration Number, or File Symbol if registration is pending |
| 2 | **Physical Form** | Formulation type — be explicit: WP, SC, WG, WDG, EC, SL, Granular |
| 3 | **Product Name (PBN)** | Primary Brand Name |

### Site

| # | Column | Definition |
|---|---|---|
| 4 | **Use** | Crop group, turf, plantscapes, seed treatment, etc. |
| 5 | **Use Site** | Agricultural (Outdoor), Greenhouse (Indoor), Residential (Outdoor), Planthouse |

### Application Method

| # | Column | Definition |
|---|---|---|
| 6 | **App. Target** | Foliar, soil, seed treatment |
| 7 | **App. Type** | Broadcast, banded, soil drench, etc. |
| 8 | **App. Equipment** | Aerial, ground boom, boomless ground, handheld, airblast |
| 9 | **App. Timing (Site Status)** | Pre- or post- (crop) emergent |
| 10 | **App. Timing (other)** | Timing dependent on pest pressure or another condition |

### Rate Pattern

| # | Column | Definition |
|---|---|---|
| 11 | **App Rate (lb ai/A)** | The applied rate as active ingredient per acre |
| 12 | **A.I. Max Single Rate/App. (lb a.i./A)** | Maximum single rate of a.i. for this use/use site |
| 13 | **Max # Apps/C.C.** | Maximum applications per crop cycle |
| 14 | **A.I. Max Total Rate/C.C. (lb a.i./A)** | Maximum total a.i. per crop cycle |
| 15 | **Max # Apps/Yr.** | Maximum applications within a 12-month period |
| 16 | **A.I. Max Total Rate/Yr. (lb a.i./A)** | Maximum total a.i. within a 12-month period |
| 17 | **MRI (days)** | Minimum retreatment interval |
| 18 | **REI** | Restricted-entry interval — in **hours** |
| 19 | **PHI (days)** | Preharvest interval — in **days** |
| 20 | **PPE** | Personal protective equipment, quoted from the label |
| 21 | **Additional Information** | Rate-relevant detail not captured above, e.g. a.i. annual caps |
| 22 | **Max No. of CC/yr** | Maximum crop cycles per 12-month period |

### Restrictions

| # | Column | Definition |
|---|---|---|
| 23 | **Geographic Restrictions** | e.g. not registered in a given state; CONUS-only |
| 24 | **Drift Restrictions** | Wind speed, boom/release height, droplet size, buffers |
| 25 | **Soil Restrictions** | Incorporation depth, excluded soil types, saturated-soil limits |
| 26 | **On-field Non-target Species Restrictions** | Typically pollinator protections |
| 27 | **Additional Restrictions for Use/Use Site** | Tank-mix bans, adjuvant bans, grazing limits |

## Fill rules

| Value | Meaning |
|---|---|
| `NS` | **Not Specified** — the label is silent on this |
| `NA` | **Not Applicable** — the column does not apply to this use |

Cells are never blank. `NS` and `NA` are not interchangeable.

**Never infer.** No defaults, no averages, no values carried from another row, another label,
a golden example, or a web search. If the label does not state it, it is `NS`.

### Max No. of CC/yr — Rule 5.1

```
IF the label caps rate "per Calendar Year" or "per Year"   -> 1
ELSE IF it caps "per Crop Season":
    IF max crop seasons per year is stated                 -> that value
    ELSE                                                    -> NS
ELSE                                                        -> NS
```

## Abbreviations

`A.I.` / `a.i.` = active ingredient · `C.C.` = Crop Cycle · `MRI` = Minimum Retreatment
Interval · `PHI` = Preharvest Interval · `REI` = Restricted-Entry Interval ·
`PBN` = Primary Brand Name · `NS` = Not Specified · `NA` = Not Applicable

## Review Columns

Tracked per row and included in exports, but not part of the schema body:

| Column | Meaning |
|---|---|
| **Source File** | Which label PDF the row came from |
| **Page** | Page of that PDF the row was extracted from |
| **Confidence** | `High` / `Medium` / `Low`, by how much of the row was populated |

## Detailed Fill Rules

### `NS` vs `NA`

Every cell must contain a value. Where the label does not state something, write exactly `NS`.
Where the column cannot apply to the use at all, write `NA`.

- Never leave a cell blank.
- Never write `-`, `none`, `unknown`, `Not specified`, or an empty string.
- `NS` means **the label is silent**, not "the extractor missed it".
- Do not borrow a value from another use, another product, or a golden example.

### One row per use + use site + application method

A crop with a foliar and a soil application produces two rows. Rows are keyed on
`Source File` + `Use` + `Use Site` + `App. Target` + `App. Type`, so that combination should
not repeat within a label.

### Crop names and groups

Record the crop exactly as the label names it, **including the group code and any exception**:

- `BRASSICA (COLE) LEAFY VEGETABLES (Crop Group 5)`
- `TREE NUTS (Crop Group 14-12) - EXCEPT ALMOND`
- `SMALL FRUIT VINE CLIMBING - EXCEPT FUZZY KIWIFRUIT (Crop Subgroup 13-07F)`

Do not shorten to `Tree Nuts`. The exception is regulatory content — dropping it is a
**Critical** defect. Do not expand a group into member crops, and do not collapse
individually named crops into a group. Note that a named crop may also carry its own row
distinct from the group it belongs to.

### Ranges, conditions, and multiple active ingredients

Preserve the label's precision:

- Ranges stay ranges — `0.090 - 0.134` is not averaged.
- Each active ingredient is labelled — `0.090 - 0.134 ICM; 0.241 - 0.358 FLU`.
- Conditions travel with the value — `0.090 ICM (<1% organic matter); 0.133 ICM (≥1% organic matter)`.
- Conditional PHIs stay whole — `7 (Pomegranate); 14 (Other)`.

### Routing restriction text

Restriction content must land in the right column:

| Column | Gets |
|---|---|
| Geographic | State/county bans, "Only for use in…" |
| Drift | Wind speed, boom/release height, droplet size, buffers |
| Soil | Excluded soil types, incorporation depth, saturated-soil limits |
| On-field Non-target Species | Pollinator protections |
| Additional Restrictions | Tank-mix bans, adjuvant bans, grazing limits, irrigation bans |

## Common Defects

| Defect | Why it happens | How to catch it |
|---|---|---|
| Foliar and soil merged into one row | Treated as one crop rather than one use+method | Compare row count against the label's use tables |
| Crop-group exception dropped | Name truncated at the group code | Search for `EXCEPT` in the label, then in the table |
| PHI and REI swapped | Adjacent columns on the label | PHI in days, REI in hours — check magnitudes |
| Two active ingredients merged | Rates summed or one dropped | Every rate cell should name its a.i. abbreviation |
| C.C. and Yr. columns conflated | Similar names, adjacent placement | Cross-check Yr. ≈ C.C. × Max No. of CC/yr |
| Wording copied from another label | Reused from a golden example or prior log | Search the source PDF for the exact sentence |
| Blank instead of `NS` | Value written before the fill rule applied | Filter for empty cells |
| Missing PPE / MRI | Located away from the use table | Check these explicitly — they are easy to miss |
