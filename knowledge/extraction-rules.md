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

## Pre-flight checklist

Before releasing a table:

- [ ] Every rate traced to the label under review, at the cited page
- [ ] No wording carried over from a golden example or another label (**R-5**)
- [ ] Foliar and soil applications on separate rows (**R-1**)
- [ ] Each AI's rate labelled with its abbreviation (**R-3**)
- [ ] Conditional rates and PHIs kept whole (**R-4**, **R-12**)
- [ ] Crop-group exceptions preserved (**R-11**)
- [ ] Restrictions routed to the right column (**R-7**)
- [ ] PPE, MRI, REI, App Rate all populated (**R-8**)
- [ ] C.C. and Yr columns distinguished; cross-check applied (**R-9**)
- [ ] AI-level annual caps captured (**R-10**)
- [ ] `NS` vs `NA` used correctly; no blanks (**R-6**)
