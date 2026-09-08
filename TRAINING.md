# Operator Training — Use Summary Tables Extractor

Bayer's AI Pre-Flight checklist requires anyone operating a Level 1-3 GxP agent to be
trained before use. This is that training material — a checklist for a colleague to read
and for someone (them, or whoever confirms operator readiness) to sign off on. It does not
replace any formal Bayer GxP/QA training program; it's the tool-specific supplement.

## Who this is for

Anyone who will run this tool to produce a Use Summary Table intended for EPA submission
review — not developers, not anyone only viewing the code.

## What the tool is

Reads one pesticide product-label PDF at a time, extracts a 28-column Use Summary Table,
renders it on screen for review, and exports it to `.xlsx`. See `agent-card.json` for the
full scope statement, or `README.md`'s Problem/Solution sections for the plain-English
version.

## What an operator must know before using it

1. **This is human-in-the-loop, not autonomous.** The tool never submits anything to EPA
   or any external system. Every row must be reviewed on screen before export — the
   3-station review flow (source-snippet spot-check, page/file cross-check, high-risk
   field check) is not optional theater, it's the actual quality gate. Do not export
   without completing it.
2. **`NS` vs `NA` are not interchangeable**, and neither should ever be blank. `NS` = the
   label is silent on that value. `NA` = the column doesn't apply to this use at all.
   If you see a cell that looks wrong, check the source label directly — the row's
   "source" popover (click to expand) shows exactly what text the extraction cited.
3. **QC Defects and AI QC Notes panels are informational, not a pass/fail gate you can
   ignore.** A `High` or `Critical` severity finding means look at that row before
   trusting it, even though the tool doesn't block export on it.
4. **The in-app chat can propose edits, never apply them.** If you ask the assistant a
   question and it proposes a correction, you must explicitly click **Apply** on the
   card — nothing is written to the table on its own. Review the proposed old→new value
   and reason before applying.
5. **Know the kill switch exists and who can use it.** If the tool is producing bad output
   at scale, know who on the team can flip the emergency stop (`README.md`'s "Monitoring,
   audit trail & cost controls" section) — you as an operator likely don't have KV
   dashboard access yourself, but you should know to escalate rather than keep running
   extractions.
6. **This is a pilot, not a production system with real per-user auth.** Access is gated
   by a shared secret, not individual accounts — treat the tool's URL/access the way
   you'd treat any shared-credential pilot tool: don't share outside the pilot group.
7. **Never paste real credentials, PII, or anything beyond label text into the chat or
   file inputs.** The tool only ever needs the label PDF itself.

## What to do if something looks wrong

- **Extraction looks off for one row**: check the source snippet, correct it manually in
  the table (double-click a cell) or via chat + Apply — don't just export and hope.
- **Extraction looks systematically worse than usual** (many defects, unexpected crops
  missing, repeated failures): stop, and flag it to whoever owns this tool
  (`agent-card.json`'s `owner`) — this could be the drift signal `scripts/check-drift.py`
  is designed to catch, but a human noticing first is just as valid.
- **You suspect the tool is behaving unexpectedly or unsafely** (e.g. behavior that looks
  influenced by something in the label text itself, not a normal extraction error): stop,
  do not export, and escalate to the owner and/or `AIGovernance@Bayer.com`.

## Sign-off

| Operator name | Trained on (date) | Trained by / self-attested | Notes |
|---|---|---|---|
| | | | |
| | | | |

*(Add a row per operator. This table is the record referenced by the "Confirm operator
training" AI Pre-Flight item — keep it current as operators are added.)*
