# Superseded

`02-multi-crop-long.csv` has been removed. It described the old 11-column schema
(`Crop`, `Use / Pest`, `Application Rate`, `Units`, …) with `Not specified` fill values, and
referenced a PDF that was never added to `samples/`. That schema is obsolete:

- The schema is now the 27-column UST definition — see `knowledge/schema-reference.md`.
- Fill values are `NS` and `NA`, not `Not specified`.
- Rows are keyed on use + use site + application method, not crop + pest.

## Current expected output

| Label | Expected output |
|---|---|
| `264-1198_SIVANTO® 400 SL_9_5_2019_BASE.pdf` | `sivanto-400-sl.md` |

That file is derived from `knowledge/golden-examples/golden_example_SIVANTO_400_SL.txt` and
is the reference for verifying a run.
