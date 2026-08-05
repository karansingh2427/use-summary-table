# Extraction Rules — Distilled from Training Logs

Rules learned from corrected extractions. Read this **before** building or checking a table.
Each rule traces to a real mistake recorded in `knowledge/training-logs/`.

Sources: `agent_training_chat_log.txt`, `plenexos_smart_training_log.txt`,
`ush679sc470_training_log.txt`, `UST_definitions.txt`.

---

## R-1 · One row = one use + one use site + one application method

From `UST_definitions.txt`:

> *"each row should contain only one use, use site, and application instructions; some use
> and use sites may be redundant while application methods differ"*

SIVANTO shows this repeatedly: **CITRUS FRUITS** appears twice — once Foliar, once Soil —
with different rates, PHI, and restrictions. Collapsing them into one row is a **High**
defect.

**Rule:** if a crop has both a foliar and a soil application, that is two rows. Do not merge.

---

## R-2 · Purpose drives the schema

> *"to accurately document each product's uses, application methods and rates, and use
> restrictions to facilitate ecological exposure modeling"*

The table feeds **ecological exposure modeling**. That is why rates are expressed as
**lb a.i./A** and why per-crop-cycle and per-year maxima are tracked separately. A rate in
product units alone is not usable downstream.

---

## R-3 · Split rates by active ingredient

Multi-AI products need each AI called out separately with a consistent abbreviation.

| Product | Correct form |
|---|---|
| USH679SC450 | `0.089 ICM; 0.045 IDF` |
| USH679SC470 | `0.090 - 0.134 ICM; 0.241 - 0.358 FLU` |
| PLENEXOS SMART | `0.18` with product noted as `(SPD+FPF: flupyradifurone rates)` |

**Rule:** define the abbreviation once, then use it consistently. Never merge two AIs into
one number.

**Mistake logged:** the PLENEXOS first pass wrote
`0.086 (Spidoxamat); 0.18 (Flupyradifurone)` in the *single rate* column when the corrected
answer was `0.18` — the row was tracking flupyradifurone rates specifically.

---

## R-4 · Rates may be conditional — carry the condition

USH679SC450 grape:

```
0.090 ICM; 0.045 IDF (<1% organic matter);
0.133 ICM; 0.066 IDF (≥1% organic matter)
```

**Rule:** never collapse a conditional rate to a single value or a bare range. The
condition (soil organic matter, region, formulation) is part of the value.

---

## R-5 · Quote the label verbatim — never reuse wording from another label

**The most serious logged mistake.** In the USH679SC470 extraction, adjuvant text was
pasted from the *previous label's* training prompt. The user caught it:

> *"are you sure this sentence is in the label?"*

The sentences existed but in a **different order**, and the planting-depth sentence was
truncated — the real one ends *"...to avoid washing and concentration of the herbicide in
the seed zone."*

**Rule:** every phrase in an output cell must be copied from the label under review, at the
page cited. Wording carried across from a golden example or an earlier log is a **Critical**
defect. Golden examples teach *shape*, never *content*.

---

## R-6 · `NS` vs `NA` vs a value

From `UST_definitions.txt`: `NS = Not Specified`, `NA = Not Applicable`.

These are different. `NS` means the label is silent. `NA` means the column does not apply to
this use. Cells are never blank.

**Rule:** if the label limits applications per *crop season* but never states crop cycles per
year, then `Max # Apps/Yr` and `Max No. of CC/yr` are both `NS` — do not infer a number.

---

## R-7 · Restrictions belong in their own columns

Five distinct restriction columns exist, and content must be routed correctly:

| Column | Gets |
|---|---|
| Geographic | *"No aerial application in New York State"*, *"Not for use in CA"* |
| Drift | wind speed, boom height, droplet size, buffer distances |
| Soil | *"Any soil except those with 20% or greater gravel content"*, incorporation depth |
| On-field Non-target Species | pollinator protections, *"during foraging by alfalfa leafcutting bees"* |
| Additional for Use/Use Site | tank-mix prohibitions, adjuvant prohibitions, grazing limits |

**Mistake logged:** the PLENEXOS first pass buried drift buffers inside *Additional
Information*. Correction moved them to *Drift Restrictions*.

---

## R-8 · Columns that are easy to miss

Called out explicitly in `ush679sc470_training_log.txt`:

> *"Notice the specific placement of 'App Rate (lb ai/A)', 'Minimum Retreatment Interval',
> 'REI', and 'PPE'."*

- **PPE** — extract separately, verbatim from the label's PPE section
- **MRI** — distinct from PHI; easy to overlook
- **REI** — in **hours**; PHI is in **days**. A swap is a **Critical** defect.
- **App Rate (lb ai/A)** — the actual applied rate, distinct from *Max Single Rate*

---

## R-9 · Per crop cycle ≠ per year

Four separate columns, easy to conflate:

```
Max # Apps / C.C.        A.I. Max Total Rate / C.C.
Max # Apps / Yr.         A.I. Max Total Rate / Yr.
```

SIVANTO Alfalfa: max total per C.C. `0.365`, max total per year `0.365`, max CC/yr `1`.
SIVANTO Brassica: per C.C. `0.365`, per year `1.095`, max CC/yr `3` — because 3 crop cycles
are permitted.

**Cross-check:** `Max Total Rate/Yr` ≈ `Max Total Rate/C.C.` × `Max No. of CC/yr`.
Where it does not hold, look for an AI-level annual cap and record that in Additional
Information.

---

## R-10 · AI-level annual caps override per-product maths

> *"Maximum flupyradifurone per calendar year is 0.365 lb ai/A, regardless of formulation
> or method of application."*

> *"If more than one flufenacet-containing product is applied to the same site within the
> same year, do not exceed the allowed maximum total of 0.44 lb ai/A of flufenacet."*

**Rule:** these caps are a required capture, not optional colour. They belong in
*Additional Information*.

---

## R-11 · Crop names: preserve the group and its exceptions

Correct forms observed:

- `BRASSICA (COLE) LEAFY VEGETABLES (Crop Group 5)`
- `SMALL FRUIT VINE CLIMBING - EXCEPT FUZZY KIWIFRUIT (Crop Subgroup 13-07F)`
- `TREE NUTS (Crop Group 14-12) - EXCEPT ALMOND`
- `ROOT VEGETABLES - EXCEPT SUGARBEET (Subgroup 1B)`

**Rule:** never shorten to `Tree Nuts`. The **exception** is regulatory content — dropping it
is a **Critical** defect. Keep the crop-group code.

Note also `BLUEBERRY` appears as its own row *and* under `BUSHBERRY (13-07B)` with different
values — a named crop inside a group can carry its own distinct entry.

---

## R-12 · PHI may be conditional

- `7-days hay, forage, sorghum grown for syrup, or sweet corn; 21-days dried grain, stover or straw`
- `7 (Pomegranate); 14 (Other)`
- `7 (forage/fresh seed); 21 (dry soybean seed)`

**Rule:** carry the full conditional string. Never reduce to a single number.

---

## R-13 · Plain text only for reference material

From `agent_training_chat_log.txt`: `.rtf`/`.docx` carry hidden formatting that corrupts
machine reading. Keep everything in this folder as `.txt` or `.md`.

---

## R-14 · A restriction's scope decides which *rows* get it, not just which column

R-7 says which column a restriction goes in. This rule says which rows.

Labels state restrictions at three different scopes, and each is handled differently:

| Scope | Where it's stated | How to fill it |
|---|---|---|
| **Product-wide** | Once, in a general Precautions/Restrictions/Agricultural Use Requirements section that isn't tied to any one crop | Copy onto **every** row's matching column. Leaving it `NS` on rows the label never repeats it for is the mistake — the label said it once for the whole product, not once per row. |
| **Method-scoped** | Stated for a physical application process (spray drift buffers, droplet size, release height, pollinator-foraging timing) | Copy onto every row that uses a matching method (foliar/aerial spray); `NA` on rows using a method the restriction can't apply to (soil injection, chemigation, drench) — the label did address the topic, it just doesn't reach that method. |
| **Crop/section-scoped** | Stated inside one crop's own block (`Only For Use in: Idaho, Oregon and Washington` under Clover; `Not for use in Greenhouses` under a Planthouse row) | Copy **only** onto rows built from that section. |

**SIVANTO 400 SL confirms this pattern directly** (`knowledge/golden-examples/golden_example_SIVANTO_400_SL.txt`):
the NY aerial/Nassau-Suffolk sale ban is product-wide and appears on all 44 rows; `Max Release
Height (ft): 10, ASABE Droplet Size: Coarse` and the pollinator-foraging note are method-scoped —
present on every Foliar row, `Not Applicable` on every Soil/Chemigation row; `Only For Use in:
Idaho, Oregon, and Washington` is crop-scoped to Clover alone.

**Mistake logged (D11, Critical):** the app's document-wide fallback once stamped the Clover-only
and Planthouse-only restrictions onto all 41 rows. **Copying a crop-specific restriction onto
unrelated rows is fabrication — worse than an empty cell, because it reads as verified.** Getting
the scope wrong in the other direction (leaving a genuinely product-wide restriction as `NS`
because no single crop section restates it) is just as wrong, only quieter.

**Rule:** before writing `NS` in Geographic / Drift / Soil / On-field Non-target / Additional
for Use, first locate where the label states that restriction. If it's in a general section that
applies to the whole product, propagate it to every row (gated by method-applicability, per the
table above) — do not wait for a crop-specific block to repeat it.

---

## R-15 · A per-crop-season cap counts as a per-year cap when the label allows only one season

R-9 keeps C.C. (crop cycle) and Yr (year) columns distinct. This rule closes the gap that
opens when a label states a cap "per crop season" or "per crop cycle" but never spells out
"per year" or "per calendar year" in so many words.

USH679SC200 (Soybean, Field Corn, Cereals, Canola and Pulse, Fruit Tree/Tree Nut/Other Crops):
every crop section states "Maximum of 1 application per crop season" and nothing else about
a yearly limit. Strict-silence reading leaves `Max # Apps/Yr.` and `Max No. of CC/yr` both `NS`.
But each of these crops — as grown under the label's own stated timing (a single burndown
application 30+ days before planting, once per crop) — has exactly one growing season per
calendar year. A regulatory analyst reading this label fills `Max # Apps/Yr.` = `1` and
`Max No. of CC/yr` = `1`, because a cap of 1-per-season **is** a cap of 1-per-year when the
crop cannot have a second season in the same year.

**Rule:** when a label caps applications per crop season/cycle and the crop named in that row
is grown at most once per calendar year under the label's own stated timing (no second planting
window, no double-crop language, no multi-season instructions anywhere in that section or
product-wide), treat the per-season cap as the per-year cap: `Max # Apps/Yr.` = the per-season
figure, `Max No. of CC/yr` = the number of seasons stated (usually `1`). Leave both `NS` only
when the label itself indicates the crop can be grown more than once a year (double-cropping,
"per crop cycle" language paired with an explicit multiple-crop-cycle statement, or the label
states a separate, larger annual cap) and does not say how many cycles that adds up to.

This is a **derived convention**, not a verbatim quote — record it the way D1–D3 derivations are
recorded, not as a plain extracted value, so a reviewer can see the reasoning (season = year for
this crop, per the label's own single planting/timing window) rather than mistaking it for a
number the label stated outright.

**Mistake avoided:** benchmarking USH679SC200 against a hand-built gold reference under strict
`NS`-on-silence reading scored 42/50 (84%); adopting this convention for the 8 rows gated on it
brought the same table to 50/50 (100%) — the gold reference was built by an analyst applying
exactly this season=year reasoning, not by re-reading the label for a number it never states.

---

## R-16 · An "Or" between two timing phrasings is one row, not two — and never emit a literal duplicate

R-1 splits rows on a genuine difference in use, use site, or application method. It is not a
license to split on every distinct sentence a label uses to describe timing.

USH679EC412's CANOLA AND PULSE section states the same application window twice, in different
words, for the same crop group: once in the section-level "Preplant Burndown" heading ("applied
as a broadcast treatment at least 1 day before or within 3 days after planting canola and pulses
but prior to crop emergence"), and again inside the bean sub-block as an explicit either/or:
"Crops: Pre-plant surface. Apply on the day of planting. **Or** Post-plant pre-emergence: Apply
within 3 days after planting but prior to crop emergence." Rate, tank-mix requirement, and weeds
controlled are identical either way — this is one continuous timing window described from two
angles, not two separate uses.

**Mistake logged:** the AI extraction path emitted 4 rows for this single use: one for each half
of the "Or" (Pre-plant surface / Post-plant pre-emergence), one row that was a byte-for-byte
duplicate of another, and one that only restated the crop list with more of the pulse-crop
varieties spelled out. An analyst reading this label writes one row, with the Application Timing
field carrying both halves of the "Or" (e.g. "Preplant surface, on the day of planting, or
post-plant pre-emergence within 3 days after planting — prior to crop emergence either way").

**Rule:** before splitting a use into multiple rows, confirm rate, use site, *and* application
method actually differ (R-1). Two sentences that describe alternative ways of timing the *same*
application to the *same* crop group at the *same* rate — joined by "or", "either...or", "may be
applied as A or B" — belong in one row's Application Timing field, not one row each. A crop list
being restated with more specific varieties later in the same block is the same crop group, not
a new one. And regardless of the reasoning above: two rows with identical values in every column
except a cosmetic wording difference are never a valid reading of the label — that is a literal
duplicate and must be collapsed to one row.

---

## Pre-flight checklist

Before releasing a table:

- [ ] Every rate traced to the label under review, at the cited page
- [ ] No wording carried over from a golden example or another label (**R-5**)
- [ ] Foliar and soil applications on separate rows (**R-1**)
- [ ] Each AI's rate labelled with its abbreviation (**R-3**)
- [ ] Conditional rates and PHIs kept whole (**R-4**, **R-12**)
- [ ] Crop-group exceptions preserved (**R-11**)
- [ ] Restrictions routed to the right column (**R-7**)
- [ ] Restriction scope determined — product-wide restrictions propagated to every row, method-scoped restrictions gated `NA` on non-matching methods, crop-scoped restrictions confined to their own rows (**R-14**)
- [ ] Per-crop-season caps checked against the crop's season count — treated as the per-year cap when the label shows only one season/year for that crop, left `NS` only when the label indicates more than one season is possible (**R-15**)
- [ ] No row split solely on alternative timing wording ("X or Y" for the same crop/rate/method), and no two rows are literal duplicates of each other (**R-16**)
- [ ] PPE, MRI, REI, App Rate all populated (**R-8**)
- [ ] C.C. and Yr columns distinguished; cross-check applied (**R-9**)
- [ ] AI-level annual caps captured (**R-10**)
- [ ] `NS` vs `NA` used correctly; no blanks (**R-6**)
