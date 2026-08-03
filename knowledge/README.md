# Knowledge & Reference Sources

Reference material that agents and reviewers consult when building or checking a Use
Summary Table. **Nothing in this folder is loaded by the app at runtime** — `app/index.html`
never reads these files. They exist to guide judgement, not to drive code.

## Priority Order

When two sources disagree, the one higher in this list wins.

| # | Source | Where it lives | Use it for |
|---|---|---|---|
| 1 | **The source PDF label** | `samples/*.pdf` | Primary truth. Every value must trace here. |
| 2 | **Golden examples** | `knowledge/golden-examples/` | Format anchor — how a correct table looks. |
| 3 | **Training logs** | `knowledge/training-logs/` · `extraction-rules.md` | Past-mistake prevention. Read before extracting. |
| 4 | **Use Summary schema** | `knowledge/schema-reference.md` · `UST_definitions.txt` | Column definitions and fill rules. |
| 5 | **Unit conversion chart** | `knowledge/unit-conversions.md` | Rate and unit calculations. |
| 6 | **Web search** | — | **Only** unit conversions and crop-group clarifications. |

### The rule that matters most

> **Never use a lower-priority source to fill in label data.**

Sources 2–6 shape *format, wording, and arithmetic*. Only source 1 supplies *facts about the
product*. If the label does not state a value, the answer is `NS` — never a value
borrowed from a golden example, a similar product, or a web search.

### On source 6 (web search)

`specs/PRD.md` §4 states the tool uses no outside service and that labels never leave the
user's computer. That boundary applies to **the app**, which must stay offline.

An agent may search the web, but only within these limits:

- ✅ Confirming a unit conversion factor (e.g. fl oz per gallon)
- ✅ Confirming which EPA crop group a crop belongs to
- ❌ Looking up a rate, PHI, REI, or use for the product
- ❌ Pasting any part of a user's label into a search query

## Folder Contents

| Path | What it is |
|---|---|
| `UST_definitions.txt` | **The authoritative column definitions** — source for the 27-column schema |
| `schema-reference.md` | The 27 columns, what each means, and how to fill it |
| `extraction-rules.md` | 13 rules distilled from the training logs, each tracing to a logged mistake |
| `derivation-rules.md` | The convention for filling Use Site, App. Type and App. Timing (Site Status), which labels rarely state verbatim. Each rule names the evidence it requires (R24) |
| `unit-conversions.md` | Conversion factors and the lb ai/A calculation |
| `ThistoThat Conversion Chart.pdf` / `.jpg` | The original conversion chart |
| `golden-examples/` | Hand-built correct tables used as format anchors |
| `training-logs/` | Recorded extraction mistakes and the rules learned from them |

Sample label PDFs and their hand-checked expected output stay in `samples/` — see
`samples/README.md`. Golden examples differ from expected output: expected output verifies
*one specific label*, while a golden example demonstrates *general formatting*.

## Adding to This Folder

- Golden examples: `golden-examples/<name>.csv` (or `.md`), plus a row in that folder's README.
- Training logs: `training-logs/<label-id>_training_log.txt`, newest entry at the top.
- Keep the priority order above in step with `.github/agents/QC-agent.agent.md`.
