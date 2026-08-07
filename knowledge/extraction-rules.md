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

## R-17 · REPLANT / RESET sections are separate uses — read the whole label

Indaziflam 200 SC dedicate pages 20-21 to an explicit section headed **"APPLICATION
DIRECTIONS FOR REPLANTED LABELED CROPS"** covering 11 crop groups. The section describes a
distinct timing pattern ("anytime following planting provided the following conditions exist")
that differs materially from the established-crop directions. An extraction that stops at the
main per-crop sections misses these rows entirely.

**Rule:** after extracting all named-crop sections, scan the full label for any
*replant*, *reset*, *at-planting*, or *newly-planted* application section. These sections
define a separate use pattern and generate their own rows — one per crop group × application
method, exactly as any other section would. Do not skip them because they reference crops
already extracted from the main section. A replanted Pome Fruit row and an established Pome
Fruit row are different uses.

**Mistake logged:** the first Indaziflam extraction produced 22 rows, missing all 11 replant
rows that appear on pages 20-21 of the label.

---

## R-18 · Max Single Rate is the ceiling of the stated range, not the range itself

The **App Rate** column carries the stated rate or range as printed on the label. The **A.I.
Max Single Rate/App.** column carries the *maximum* a single application may reach — which,
for a range, is the upper bound.

Indaziflam Blueberry Highbush (page 10): stated rate `0.045–0.065` lb ai/A. Max Single Rate
= `0.065`. The extraction error was copying the full range `0.045–0.065` into Max Single Rate
as well, which leaves the column non-informative.

**Rule:** `A.I. Max Single Rate/App.` = the upper bound of the stated rate range. If the
label states a flat rate (not a range), Max Single Rate equals that rate. If the label states
multiple OM or regional brackets, Max Single Rate = the highest ceiling across all brackets,
stated as a single number (e.g. `0.085` when brackets are `0.045–0.065` and `0.065–0.085`).
Only use a range in Max Single Rate when the label itself states different rate ceilings for
different conditions *and* those conditions will not be known at modeling time.

**Mistake logged:** Indaziflam extraction copied App Rate range into Max Single Rate for 17
of 22 rows; only 4 rows resolved to the ceiling correctly.

---

## R-19 · App. Timing must preserve dormancy state and growth-stage qualifiers

"Pre-emergence" is not sufficient when the label conditions the timing on dormancy or a
specific growth stage. Dropping those qualifiers makes a timed restriction look unconditional
and can mislead application decisions.

Indaziflam Blueberry Highbush (page 11): *"Only apply to soil as dormant application in late
fall through early spring before bud swell."* The correct App. Timing is
`Dormant / Pre-emergence (late fall through early spring, before bud swell)` — not just
`Pre-emergence`.

Other examples:
- `Pre-emergence / Layby` (sugarcane: at layby cultivation, before canopy closure)
- `Dormant post-harvest` (lowbush blueberry: after harvest and pruning, spring frost-free)
- `Dormant or pre-bloom` (hops: early spring shoots ≤ 2 inches height)

**Rule:** read the full timing sentence in the label and carry every qualifier that the label
states — dormancy window, growth stage, seasonal window, sequence relative to another
operation (cultivation, harvest, pruning). Do not reduce to the UST schema term alone.

**Mistake logged:** Indaziflam extraction stripped dormancy qualifiers from 7 rows,
flattening all to `Pre-emergence`.

---

## R-20 · App. Type must match the exact label wording — never default to "Broadcast"

The **App. Type** column must reflect what the label says, not what "most labels do."

| Label says | App. Type value |
|---|---|
| *"apply as a directed application to the soil beneath the bushes"* | `Directed` |
| *"apply as a 2-foot band to each side of the hop row"* | `Band` |
| *"broadcast treatment or as a banded treatment"* | `Broadcast or Band` |
| *"broadcast, directed, or spot spray"* | `Broadcast, Directed, or Spot Spray` |
| *"broadcast application"* | `Broadcast` |

Indaziflam Blueberry Highbush (page 11), Caneberry (page 11), Hops (page 16), Christmas
Trees (page 29), Conifer Plantations (page 29) all state *directed* or *band* application.
Writing `Broadcast` for these is factually wrong: applying a soil herbicide broadcast where
the label says directed risks contact with crop roots, foliage, or irrigation channels.

**Rule:** find the sentence in the label that describes how the product is physically applied
to the soil or plant surface. Use its exact wording to fill App. Type. If the label offers a
choice (broadcast *or* band), carry both. Never default to `Broadcast` without label evidence.

**Mistake logged:** Indaziflam extraction wrote `Broadcast` for all 22 rows; at least 5 crops
(Highbush, Caneberry, Hops, Christmas Trees, Conifers) require `Directed` or `Band`.

---

## R-21 · Geographic sub-sections within one crop generate separate rows when rates differ

Some labels divide a single crop's directions into sub-sections by geography or rainfall zone,
each with different rates, maximum applications, or restrictions. These sub-sections are
distinct uses and require separate rows, for the same reason R-1 splits foliar from soil.

Indaziflam Grasses Grown for Seed (pages 22-23):
- **High-rainfall western Oregon** (carbon-seeded): 1.0 fl oz/A, 1 application, specific
  timing requirements
- **High-rainfall western Oregon** (established): 1.0–2.0 fl oz/A, different restrictions
- **Low-rainfall eastern OR/WA/ID**: 2.0–3.0 fl oz/A, distinct crop list, different
  annual cap

These are three distinct uses because the **rates differ materially** and the **geographic
scope is mutually exclusive**. Collapsing them into one or two rows misstates the rates for
at least one geography.

**Rule:** when a label section has headed sub-sections that differ in rate, maximum
applications, or restrictions (including geographic restriction), each sub-section is a
separate row. The crop name in the **Use** column should identify the sub-section:
e.g. `GRASSES GROWN FOR SEED — WESTERN OREGON (HIGH RAINFALL, ESTABLISHED)`.

**Mistake logged:** Indaziflam extraction collapsed 3 distinct grass use patterns into 2
rows, with one pattern (western Oregon carbon-seeded) omitted entirely.

---

## R-22 · Use label's stated numeric values; do not substitute unrounded conversions

When the label states a rate in product units (fl oz/A) and a separate lb ai/A value for the
same restriction, use the label's stated lb ai/A value — not a freshly computed conversion.

Indaziflam Sugarcane (page 21): *"Do not apply more than 4.0 fl oz/A (0.05 lb ai/A) per year."*
The conversion of 4.0 fl oz/A using the label's stated 1.67 lb ai/gal concentration yields
0.0489 lb ai/A. The label nonetheless prints **0.05**. Use 0.05.

**Why this matters:** the label states both the product-unit cap and the lb ai/A equivalent
as binding regulatory values. A model using 0.049 rather than 0.05 understates the permitted
annual rate and will disagree with every other regulatory document that cites the label
directly.

**Rule:** when the label explicitly states a lb ai/A value alongside a product-unit value for
the same rate or limit, use the label's lb ai/A figure. Do not re-derive it from the
concentration. If the label omits the lb ai/A equivalent, compute it from the conversion table
(`knowledge/unit-conversions.md`) and document the computation in Additional Information.

**Mistake logged:** Indaziflam extraction used 0.049 for sugarcane Max Total Rate/Yr instead
of the label's stated 0.05. Extraction B's Calculation_Notes sheet explicitly records keeping
the label's value rather than the computed one.

---

## R-23 · Evidence for App. Type/Target/Equipment must come from the crop's own section

App. Type, App. Target, and App. Equipment values must trace to language inside that crop's
own block. A sentence that applies broadly across multiple crops (product-wide boilerplate)
may still supply a value, but only when it is the *only* evidence available and nothing in
the crop's own section contradicts it. If the crop's own section states or implies a
different method — e.g. its own rate table says "broadcast acre" while a shared paragraph
elsewhere says "directed" — the crop's own section wins.

Never paraphrase a label's own wording into an industry-standard synonym (e.g. "ground
equipment" rewritten as "Ground Boom"). Use the label's exact term. Never reuse a heading or
section title that appears elsewhere in the document (such as a spray-drift or
droplet-size-calibration section heading) as if it were this crop's stated application
method or equipment — a heading is not a use restriction.

**Rule:** before filling App. Type, App. Target, or App. Equipment for a row, locate the
sentence inside that specific crop's own section first. Only fall back to a shared,
multi-crop sentence when the crop's own section is silent, and only if nothing in the
crop's own section conflicts with it. Quote the label's exact wording — never a synonym,
paraphrase, or a section heading borrowed from elsewhere in the document.

**Mistake logged:** Indaziflam extraction marked a citrus row "Directed" from a shared
product-wide sentence, even though citrus's own dose chart stated "broadcast acre." The
same extraction filled App. Equipment with "Ground Boom" — a section heading used elsewhere
in the document for spray-drift calibration — when the crop's own restriction said "ground
equipment."

---

## R-24 · Per-application ceiling and annual cap are separate label sentences

`A.I. Max Single Rate/App.` and `A.I. Max Total Rate/Yr.` (or any stated 12-month/annual
cap) almost always come from two distinct label sentences, even when the label states them
near each other or the two numbers are numerically close. Never write an annual or season
cap into the per-application ceiling cell, or vice versa.

**Rule:** locate and cite the per-application sentence and the annual/season-cap sentence
independently before filling either cell. If only one of the two is stated, leave the other
`NS` rather than deriving it from the one that is stated.

**Mistake logged:** Indaziflam extraction wrote a 0.088 lb ai/A annual cap into
`A.I. Max Single Rate/App.` for landscape-ornamental/conifer rows, when the label populated
that per-application ceiling from a separate fl-oz-range sentence elsewhere in the same
section.

---

## R-25 · A crop named only inside another group's shared sentence still gets its own row

After building the crop inventory, explicitly check every crop named anywhere in the
document — including inside another crop group's shared establishment, rotational, or
exception sentence — against the output table. A crop mentioned only in passing inside a
different group's paragraph is not "covered" by that group's row.

**Rule:** if the label states any use pattern for a crop — even one folded into another
crop group's sentence rather than given its own heading — that crop gets its own row.

**Mistake logged:** Indaziflam extraction named pecan only inside the Pome/Stone
Fruit/Subgroup-23A group's shared 3-year-establishment sentence and never gave it a
standalone row.

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
- [ ] App. Type/Target/Equipment traced to the crop's own section, not borrowed from a
      shared sentence or a section heading elsewhere in the document (**R-23**)
- [ ] Per-application ceiling and annual cap each traced to their own label sentence, never
      cross-populated (**R-24**)
- [ ] Every crop named anywhere in the document — including inside another group's shared
      sentence — has its own row (**R-25**)
