# Derivation Rules — analyst-derived columns

Three UST columns are almost never printed on a label as a literal string, yet the golden
examples always have them filled:

- **Use Site** — `Agricultural (Outdoor)`
- **App. Type** — `Broadcast`, `Chemigation, Injection, In-furrow spray, Drench`, …
- **App. Timing (Site Status)** — `Post-emergence`, `At-planting / Post-transplant`, …

An analyst fills these by reading the application prose and applying a settled convention.
That convention is written out here so the tool can apply it too — **reviewable and traceable,
not guessed**.

## Why this does not break R19

R19 says the tool must never invent facts. These rules do not invent anything: each one fires
only on **evidence found in the label text**, and each derived value is recorded so a reviewer
can see *which* phrase triggered it. A rule with no matching evidence does not fire, and the
column stays `NS`.

The distinction that matters:

| Not allowed | Allowed |
|---|---|
| Assuming a PHI of 7 because similar products use 7 | Reading "Broadcast" from the phrase "apply as a broadcast spray" |
| Filling `Use Site` because most labels are agricultural | Filling `Use Site` because the label says "not for use in greenhouses" |
| Copying a rate from another product | Converting a stated rate with a stated concentration |

Every rule below cites the evidence it requires. No rule fires on absence of evidence alone,
with the single documented exception of D3 (see its note).

---

## D1 · Use Site

| # | Evidence in the label | Value |
|---|---|---|
| D1.1 | Section heading contains `PLANTHOUSE` | `Planthouse` |
| D1.2 | Block names a greenhouse use (`in greenhouses`, `greenhouse-grown`) | `Greenhouse (Indoor)` |
| D1.3 | Block names lawns, homes, ornamental beds around residences | `Residential (Outdoor)` |
| D1.4 | Block states an outdoor field application — a per-acre rate (`fl oz/A`, `Gallons/Acre`), aerial application, or ground boom equipment | `Agricultural (Outdoor)` |

D1.4 is evidence-based: a per-acre rate with aircraft or ground-boom equipment is an outdoor
field use. A label with none of these leaves `Use Site` as `NS`.

## D2 · App. Type

Driven by `App. Target` plus the delivery words present in the block. Several may apply, and
the golden example lists them comma-separated in the label's own order.

| # | App. Target | Evidence | Value contributed |
|---|---|---|---|
| D2.1 | Foliar | `broadcast`, or a foliar spray applied over the whole field by ground boom or aircraft | `Broadcast` |
| D2.2 | Foliar | `banded`, `band application` | `Banded` |
| D2.3 | Foliar | `directed spray` / `shielded spray` | `Directed Spray` / `Shielded Spray` |
| D2.4 | Soil | `chemigation`, `drip`, `trickle`, `micro-sprinkler` | `Chemigation` |
| D2.5 | Soil | `injection`, `inject below the seed line` | `Injection` |
| D2.6 | Soil | `in-furrow` | `In-furrow spray` |
| D2.7 | Soil | `drench`, `potting hole drench`, `post-transplant drench` | `Drench` |
| D2.8 | Soil | `side-dress` | `Side-dress` |
| D2.9 | Seed Treatment | any | `Seed Treatment` |

If none match, `App. Type` stays `NS`.

## D3 · App. Timing (Site Status)

| # | Evidence | Value |
|---|---|---|
| D3.1 | `pre-emergence` and `post-emergence` both present | `Pre-emergence/ Post-emergence` |
| D3.2 | `pre-emergence` / `pre-emergent` alone | `Pre-emergence` |
| D3.3 | `post-emergence` / `post-emergent` alone | `Post-emergence` |
| D3.4 | `at-planting`, `at planting`, `prior to planting` | `At-planting` |
| D3.5 | `at transplant`, `post-transplant`, `potting hole` | `Post-transplant` |
| D3.6 | D3.4 and D3.5 both present | `At-planting / Post-transplant` |
| D3.8 | *withdrawn — see below* | — |
| D3.7 | Foliar target, and no other timing evidence in the block | `Post-emergence` |
| D3.9 | Soil placement wording implying a standing plant: `basal drench`, `drip line`, `tree canopy`, `trunk` | `Post-emergence` |

**D3.8 was withdrawn.** It returned `Pre-transplant` from plant-house wording. The repository
golden supports that; the analyst's pasted golden records `Post-emergence` on the same rows. Two
reference files disagree, so the rule had no evidence behind it — only a choice of source — and
it is out of the code until the authoritative golden is settled (Task 46).

**D3.10 — `App. Timing (other)` default.** Where neither the use block nor the label's
product-wide directions state any timing phrase, the column is filled with `When pests occur`
and marked derived. This is a **house convention, not a reading of the label.** It is applied
last, after block wording and after the product-wide sentence, and never overwrites a filled cell.

It is marked derived precisely because R19 would otherwise be broken: an unmarked cell claims to
be label text. Anyone reviewing the output must be able to tell a printed phrase from a default,
so **if the derived marking is ever dropped from this rule, the rule must be dropped with it.**

Note on the evidence for this rule. It was first written on the basis that the golden varies the
wording per row, which made a default look risky. That was read from
`golden_example_SIVANTO_400_SL.txt`. The analyst's pasted golden
(`golden_example_SIVANTO_400_SL_analyst_paste.txt`) carries `When pests occur` on **every** row,
which supports the default far more strongly. The two files disagree; the rule is defensible
under either, but the reasoning recorded for it should not be trusted until Task 46 resolves
which file is authoritative.

**Order matters within `deriveTimingStatus()`.** D3.1–D3.3 read the explicit words first, the
planting/transplant pair next, then the situational rules D3.9 and D3.7 last, so a stated phrase
always beats an inference. When D3.8 was briefly present it had to be tested *before* D3.4–D3.6,
because a plant-house block narrates the whole sequence — apply "prior to transplanting", then a
field application "following transplanting" — and the generic transplant pattern matches it too.
That interaction is recorded here in case D3.8 is ever reinstated.

**Note on D3.7 and D3.9.** These two reason from the situation rather than a phrase.
A foliar spray onto a standing crop is by definition post-emergence; so is a soil treatment
placed at the base of a trunk or between the trunk and the drip line of a canopy, because
neither is possible unless the crop is up. D3.7's evidence is that the label files the use
under a FOLIAR heading; D3.9's is the placement wording. Perennial-crop soil blocks (citrus,
stone fruit, vine) never print the word "post-emergence", yet the golden records it for them.

D3.7 formerly also required pest-driven wording in the block. That extra condition was not
load-bearing, and it broke the column: SIVANTO states its pest timing once in the general
directions instead of repeating it per use, so the rule fired on 1 row of 43 while the golden
records `Post-emergence` on every foliar row. Removed. All three are listed separately here so
a reviewer can disable them if the convention changes.

---

## Reviewing derived values

Every value these rules produce is logged in the run log under the row it belongs to, naming
the rule that fired. Anything a rule did not cover stays `NS`. If a derived value looks wrong,
the fix belongs in this file first, then in `deriveColumns()` in `app/index.html`.
