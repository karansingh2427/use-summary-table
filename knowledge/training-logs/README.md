# Training Logs

**Priority 3** in `knowledge/README.md`. A record of mistakes made on past extractions and
the rule learned from each, so the same error is not repeated.

Read the logs **before** starting an extraction, not after.

## Naming

`<label-id>_training_log.txt` — for example `ush679ec412_training_log.txt`.

The label id should match the identifier used for that label in `samples/`, so a log can
always be traced back to the PDF it came from.

## Files in this folder

| File | Label | Entries | Last updated |
|---|---|---|---|
| `indaziflam_200sc_training_log.txt` | Indaziflam 200 SC Herbicide (264-1106) | 11 | 2026-08-07 |

## Entry format

Newest entry at the top. One entry per mistake:

```
=== 2026-08-01 · Cotton / Thrips · p.14 ===
MISTAKE:  Recorded PHI as 21 hours.
CAUSE:    Read the REI value from the adjacent column.
CORRECT:  PHI 21 days; REI 12 hours.
RULE:     PHI is always in days and REI always in hours — if a PHI reads in
          hours, suspect a column swap and re-check the source row.
SEVERITY: Critical
```

Fields:

| Field | What goes in it |
|---|---|
| `MISTAKE` | What was produced, stated plainly |
| `CAUSE` | Why it happened — the misread, not just the symptom |
| `CORRECT` | The verified right answer, with page evidence |
| `RULE` | The generalisable lesson. This is the valuable part. |
| `SEVERITY` | Critical / High / Medium / Low, per `.github/agents/QC-agent.agent.md` |

## Rules

- A log records **what went wrong and the lesson** — it is not a source of label facts.
  Never carry a `CORRECT` value from one label into another.
- Write the `RULE` line so it applies beyond the one row that triggered it.
- If a rule recurs across several labels, consider promoting it into
  `knowledge/schema-reference.md` so it is found without reading every log.
- Do not paste large excerpts of a customer label into a log — a page reference is enough.
