# Expected Output — SIVANTO® 400 SL

Hand-checked target for `samples/264-1198_SIVANTO® 400 SL_9_5_2019_BASE.pdf`, derived from
`knowledge/golden-examples/golden_example_SIVANTO_400_SL.txt`.

Use this to verify a run (Task 23 in `specs/Tasks.md`).

## Product-level constants

Every row should carry these:

| Column | Expected |
|---|---|
| Reg. #/File Sym | `264-1198` |
| Physical Form | `SL` |
| Product Name (PBN) | `SIVANTO® 400 SL` |

Active ingredient: **flupyradifurone**.

## Expected row count

**44 rows.** Row count is driven by use + use site + application method, not by crop count.

> **Corrected 1 August 2026.** The analyst-authoritative paste has exactly 44 data rows
> (counted by the stable `264-1198` row prefix). The earlier 43-row expectation came from the
> superseded repository golden and hid the missing Legume row. Row count alone remains
> insufficient evidence; the use list and field values must also match.

## Expected uses, and how each splits

Crops marked ⚡ produce **more than one row** because they have several application methods.
Merging those into one row is a **High** defect (R18).

| Use | Rows | Methods |
|---|---|---|
| Alfalfa (grown for Forage, Fodder, Seed, Straw, and Hay) | 1 | Foliar |
| BRASSICA (COLE) LEAFY VEGETABLES (Crop Group 5) ⚡ | 2 | Foliar, Soil |
| BUSHBERRY (Crop Subgroup 13-07B) ⚡ | 2 | Foliar, Soil |
| BLUEBERRY | 1 | Foliar |
| CANEBERRY (Crop Subgroup 13-07A) | 1 | Foliar |
| Cereal Grains (CG 15), Forage, Fodder and Straw of Cereal Grains (CG 16) and Quinoa | 1 | Foliar |
| CHRISTMAS TREES | 1 | Foliar |
| CITRUS FRUITS (Crop Group 10-10) ⚡ | 2 | Foliar, Soil |
| Clover (Grown for Forage, Fodder, Seed, Straw, and Hay) | 1 | Foliar |
| Cottonseed (Subgroup 20c) Including production for Seed | 1 | Foliar |
| CUCURBIT VEGETABLES (Crop Group 9) ⚡ | 3 | Foliar, Soil, **Planthouse** Soil |
| FRUITING VEGETABLES (Crop Group 8-10) ⚡ | 3 | Foliar, Soil, **Planthouse** Soil |
| HOP | 1 | Foliar |
| KAVA | 1 | Foliar |
| LEAFY VEGETABLES - EXCEPT BRASSICA VEGETABLES (Crop Group 4) ⚡ | 2 | Foliar, Soil |
| LEGUME VEGETABLES (Crop Groups 6 & 7) | 1 | Foliar |
| LOW GROWING BERRY (Crop Subgroup 13-07G) - EXCEPT CRANBERRY ⚡ | 2 | Foliar, Soil |
| PEANUT | 1 | Foliar |
| POME FRUITS (Crop Group 11-10) ⚡ | 2 | Foliar, Soil |
| ROOT VEGETABLES - EXCEPT SUGARBEET (Subgroup 1B) | 1 | Foliar |
| SMALL FRUIT VINE CLIMBING - EXCEPT FUZZY KIWIFRUIT (Crop Subgroup 13-07F) ⚡ | 2 | Foliar, Soil |
| SORGHUM (Including production for seed) | 1 | Soil |
| STONE FRUITS (Crop Group 12-12) ⚡ | 2 | Foliar, Soil |
| TARO LEAVES ⚡ | 2 | Foliar, Soil |
| TREE NUTS (Crop Group 14-12) - EXCEPT ALMOND ⚡ | 2 | Foliar, Soil |
| TROPICAL AND SUBTROPICAL…FRUIT (Crop Subgroup 24B) | 1 | Foliar |
| TUBEROUS AND CORM VEGETABLES (Crop Subgroup 1C) ⚡ | 2 | Foliar, Soil |
| TURNIP GREENS ⚡ | 2 | Foliar, Soil |

**Note:** `BLUEBERRY` appears as its own row *and* inside `BUSHBERRY (13-07B)`, with
different values (`MRI 3 / PHI 30` vs `MRI 7 / PHI 3`). A named crop inside a group can carry
its own distinct entry — do not de-duplicate these.

## Resolved use-list gaps (1 August 2026)

The app now produces the authoritative 44 rows. These structural gaps were fixed together in
Task 38; field-level differences documented below still require separate verification.

| Gap | Detail |
|---|---|
| `LEGUME VEGETABLES` missing | Fixed: PDF.js emitted `FOLIARCrop Group 6`, so the trailing word-boundary test never opened the section. |
| Combined headings truncated | Fixed: lowercase `and` plus the 14-token cap discarded the first clause of the Legume and cereal-grains headings. |
| `SORGHUM` Soil-only | **Correct.** The golden has no Sorghum Foliar row. Flagged as a defect on 1 August in error. |

## Sample rows to verify in detail

### Alfalfa — Foliar

| Column | Expected |
|---|---|
| Use Site | `Agricultural (Outdoor)` |
| App. Target | `Foliar` |
| App. Type | `Broadcast` |
| App. Equipment | `Ground sprayers, fixed or rotary winged aircraft, sprinkler-type overhead chemigation equipment` |
| App. Timing (Site Status) | `Post-emergence` |
| App. Timing (other) | `When pests occur` |
| A.I. Max Single Rate/App. | `0.183` |
| Max # Apps/C.C. | `NS` |
| A.I. Max Total Rate/C.C. | `0.365` |
| Max # Apps/Yr. | `NS` |
| A.I. Max Total Rate/Yr. | `0.365` |
| MRI (days) | `10` |
| PHI (days) | `7` |
| Max No. of CC/yr | `1` |
| Geographic Restrictions | NY restriction — no aerial application in New York State; not for sale/use in Nassau and Suffolk Counties |
| Drift Restrictions | `Max Release Height (ft): 10, ASABE Droplet Size: Coarse` |
| Soil Restrictions | `Not Applicable` |
| On-field Non-target Species | Pollinator timing recommendation |

### CITRUS FRUITS — Soil (contrast with its Foliar row)

| Column | Foliar row | Soil row |
|---|---|---|
| App. Type | `Broadcast` | `Chemigation, Drench, Shank` |
| A.I. Max Single Rate/App. | `0.183` | `0.365` |
| Max # Apps/C.C. | `NS` | `1` |
| MRI (days) | `10` | `NS` |
| PHI (days) | `1` | `30` |

The two rows differ in five columns — strong evidence for why R18 matters.

### Conditional PHI — Cereal Grains

```
7-days hay, forage, sorghum grown for syrup, or sweet corn;
21-days dried grain, stover or straw
```

Must be preserved whole (R21). Reducing this to `7` or `21` is a **Critical** defect.

Similarly:
- TROPICAL AND SUBTROPICAL FRUIT — MRI `7 (Pomegranate); 14 (Other)`, PHI `0 (Pomegranate); 1 (Other)`
- LEGUME VEGETABLES — PHI `7 (forage/fresh seed); 21 (dry soybean seed)`

## Cross-checks

- `Max Total Rate/Yr` ≈ `Max Total Rate/C.C.` × `Max No. of CC/yr`
  Alfalfa: `0.365 = 0.365 × 1` ✓ · Brassica foliar: `1.095 = 0.365 × 3` ✓
- Where `Max No. of CC/yr` is `3`, the yearly total should be `1.095`.
- PHI is in **days** throughout; SIVANTO's golden example has no REI column populated.

## Known parser risks for this label

| Risk | Rule | What to check |
|---|---|---|
| `TREE NUTS` loses `- EXCEPT ALMOND` | R20 | Search output for `EXCEPT` |
| Foliar and soil merged | R18 | Count rows for CITRUS, POME, STONE |
| Conditional PHI truncated to one number | R21 | Cereal Grains, Tropical Fruit |
| Planthouse rows missed | R18 | CUCURBIT and FRUITING VEGETABLES should have 3 rows |
| `BLUEBERRY` folded into `BUSHBERRY` | — | Both should appear |
| Drift text landing in Additional Information | R7 | Check Drift Restrictions is populated |

## Rate conversion — now computed

SIVANTO 400 SL is **400 g a.i./L = 3.34 lb a.i./gal**, stated on the label, so the fl oz/A
rates convert to lb a.i./A:

```
lb a.i./A = (fl oz/A ÷ 128) × 3.34
```

| Label value | Arithmetic | Column | Expected |
|---|---|---|---|
| 7.0 fl oz/A | 7.0 ÷ 128 × 3.34 | `A.I. Max Single Rate/App.` | **0.183** ✓ |
| 14 fl oz/A | 14 ÷ 128 × 3.34 | `A.I. Max Total Rate/C.C.` | **0.365** ✓ |
| 0.365 × 3 cycles | — | `A.I. Max Total Rate/Yr.` | **1.095** ✓ |

The whole chain reconciles with the golden example, so these columns should now be
populated, not `NS`. The fl oz/A rate is also kept verbatim in **Additional Information**
so the arithmetic can be rechecked (`unit-conversions.md` rule 4).

The conversion runs **only** when the label states the concentration. If it does not, the
lb a.i./A columns stay `NS` — never estimated (R19, `unit-conversions.md` rule 2). The run
log prints the concentration it used, or says none was found.

## Still analyst-derived — expected `NS`

These remain interpretations rather than label strings, and an extractor should not invent
them:

| Column | Golden example | What the label actually says |
|---|---|---|
| `Use Site` | `Agricultural (Outdoor)` | not stated per section; inferred from context |
| `App. Type` | `Broadcast` | described in prose, not named as a type |
| `App. Timing (Site Status)` | `Post-emergence` | inferred from the application description |

**Superseded by R24.** These three columns are now filled by the documented convention in
`knowledge/derivation-rules.md` rather than left `NS`. Each derived cell is marked ◆ in the
results and names the rule that produced it, so the value stays reviewable. Expect:

| Column | Alfalfa Foliar | Rule | Brassica Soil | Rule |
|---|---|---|---|---|
| `Use Site` | `Agricultural (Outdoor)` | D1.4 | `Agricultural (Outdoor)` | D1.4 |
| `App. Type` | `Broadcast` | D2.1 | `Chemigation, Injection, In-furrow spray, Drench` | D2.4+ |
| `App. Timing (Site Status)` | `Post-emergence` | D3.7 | `Pre-emergence/ Post-emergence` | D3.1 |

A cell with no matching evidence still stays `NS` — the rules never fire on absence.


## Results

Record each run here.

| Date | Rows produced | Rows expected | Crops found | Defects | Notes |
|---|---|---|---|---|---|
| 2026-08-01 | 304 | 43 | 218 | D1–D4 | First run. Anchored on crop mentions, so member crops inside group sections each became a use. D1–D4 fixed; re-run pending. |
| 2026-08-01 | 1 | 43 | 1 | D6 | Second run. `SECTION_RE` could never match — PDF.js emits single-spaced text, so its `(^\|\n\|\s{2,})` anchor had nothing to bind to. |
| 2026-08-01 | 43 | 43 | 41 | D7–D10 | Third run. Structure correct — rates 0.183/0.365 right, TREE NUTS EXCEPT ALMOND intact, both Planthouse rows present, BLUEBERRY separate from BUSHBERRY. Remaining: heading prefixes, day-unit inconsistency, case, Planthouse target. **Row count was right all along and was logged as a miss.** |
| 2026-08-01 | 41 | 43 | 41 | D11–D13 | Fourth run. Logged at the time as "row count and use list now exact" — **that was wrong.** 41 was a miss against the golden's 43, recorded as a pass because the expected count in this file was itself wrong. Derived columns, rates, MRI and PHI were genuinely correct. |
| 2026-08-01 | 43 | 43 | 27 | D14, D15 | Fifth run, after Tasks 32–33. Coverage warnings 157 → 3; both timing columns populated. Count matches, **contents do not** — `LEGUME VEGETABLES` missing and the cereal-grains heading truncated. See "Known gaps" above. |
| 2026-08-01 | 44 | 44 | 28 | D21 fixed; field defects remain | Task 38 run. Full combined Legume and cereal-grains headings recovered. Legume PHI still extracts as `3` rather than the authoritative conditional value, so the table is not yet field-accurate. |

**The expected column was corrected twice.** The first correction used the now-superseded
repository golden (43 rows). Counting the analyst-authoritative paste gives 44 rows; the extra
row is the Legume use that the parser had missed.

### Fourth-run defects

**D11 (Critical, fixed) — restrictions applied at the wrong scope.** The document-wide
fallback stamped every match onto every row, so `Only For Use in: Idaho, Oregon and
Washington` (CLOVER only) and `Not for use in Greenhouses` (planthouse only) appeared on all
41 rows. Copying a crop-specific restriction onto unrelated crops is fabrication — a worse
failure than an empty cell, because it reads as verified. Now split into block-scoped and
genuinely product-wide patterns.

**D12 (Major, fixed) — Drift and Soil captured prose, not values.** Drift returned
`wind speed favors drift beyond the area intended for treatment…` repeated; expected
`Max Release Height (ft): 10, ASABE Droplet Size: Coarse`. Soil's bare `incorporat\w+`
matched `incorporated, the Worker Protection Standard…`. Both retargeted at the actual
parameter table, and `NA` is now emitted for soil restrictions on foliar rows.

**D13 (Minor, fixed) — last section ran into back matter.** `TURNIP GREENS` carried
`STORAGE AND DISPOSAL Do not contaminate water…`. Section spans now cut at the back matter.

