# Golden Examples

**Priority 2** in `knowledge/README.md`. These are the *format anchor* — hand-built tables
that show what a correct, well-formed Use Summary Table looks like.

## What a golden example is for

✅ **Use it for:** column order and naming, wording style, how to express a rate with its
active-ingredient abbreviation, when to write `NS` versus `NA`, and how to split one crop
into several rows by application method.

❌ **Never use it for:** an actual value. A PHI of 7 days in a golden example says nothing
about the label you are extracting. Copying a value across is a **Critical** defect under
`.github/agents/QC-agent.agent.md`, and it is the single most common mistake recorded in
`knowledge/training-logs/`.

## Golden example vs. expected output

| | Golden example (`knowledge/golden-examples/`) | Expected output (`samples/expected/`) |
|---|---|---|
| Answers | "How should a table look?" | "Is this label's table correct?" |
| Tied to a specific PDF | No | Yes |
| Used by | Anyone building a table | QC, verifying one run |

## Files in this folder

| File | Label / scenario | Notes |
|---|---|---|
| `golden_example_SIVANTO_400_SL.txt` | SIVANTO® 400 SL (264-1198) | Single-AI insecticide. Best example of **one crop → several rows by application method** (foliar vs soil), and of crop-group exceptions such as `TREE NUTS (Crop Group 14-12) - EXCEPT ALMOND`. Matching PDF is in `samples/`. |
| `golden_example_v2.txt` | USH679EC412 | Schema anchor — includes `App Rate (lb ai/A)`, `Minimum Retreatment Interval`, `REI`, and `PPE`. Shows multi-AI rates (`0.009 - 0.022 ICM; 0.289 - 0.500 BXN`). |
| `golden_example_v2.xlsx` | USH679EC412 | Spreadsheet form of the above. Binary — read the `.txt` twin instead. |

## Adding an example

1. Name it `golden_example_<label>.txt` or `<scenario>_v<n>.txt`.
2. Use the exact column order from `knowledge/schema-reference.md` — all 27 columns.
3. Fill every cell; unknowns read `NS`, inapplicable columns read `NA`.
4. Add a row to the table above saying what makes this example worth keeping.
5. Keep older versions rather than overwriting — `_v1` explains why `_v2` changed.
6. Prefer plain text. `.xlsx` and `.docx` are binary and cannot be read directly.
