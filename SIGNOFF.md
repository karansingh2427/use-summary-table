# Final Sign-off & Owner Accountability

Bayer's AI Pre-Flight checklist requires the named owner to confirm every gate below has
passed and record a go/no-go decision before deployment — locally or at scale. This file
is that record. Update it whenever a gate's status changes; keep prior decisions rather
than overwriting them (append a new dated entry instead).

## Owner

Karandeep Singh (karandeep.singh@bayer.com), Bayer — see `agent-card.json`.

## Gate status

| Gate | Status | Where it's implemented |
|---|---|---|
| Kill switch | ✅ Done | `functions/api/_lib/governance.js` `checkKillSwitch`; `README.md` "Monitoring, audit trail & cost controls" |
| Agent Card | ✅ Done | `agent-card.json` |
| Agent drift tracking | ✅ Done | `scripts/check-drift.py`; `README.md` "Agent drift tracking" |
| Cyber security guardrails | ✅ Done | CSP in `_headers`/`app/_headers`; anti-injection system prompt; `README.md` "Cyber security guardrails" |
| Confirm operator training | ⬜ Not yet — material drafted | `TRAINING.md` (sign-off table inside is currently empty) |
| Register in the Agent Hub | ⬜ Not yet — submission packet drafted | `AGENT-HUB-SUBMISSION.md` (not yet submitted to the actual Hub) |
| Final sign-off & owner accountability | ⬜ This file — decision pending | This file |
| Know where to get help | N/A — reference only | go/agentic-consult, AIGovernance@Bayer.com, `#agentic-developer-community` |

*(Update this table as items move — it should always reflect current reality, not a
snapshot in time. Add rows if the underlying AI Pre-Flight checklist grows.)*

## Known, accepted limitations at time of this decision

Carried forward from `README.md` / `agent-card.json` — not blockers for a small pilot,
but must be revisited before any broader rollout:

- Access control is a shared static secret, not real per-user authentication (real fix:
  Entra Agent ID / DSE-app route).
- Server-side KV/token bindings are not scoped per-function (Pages Functions and the
  standalone Worker each hold the full binding set).
- No automated dependency or secret-scanning tooling in CI.
- Daily cost budget and audit retention values are placeholders, not tied to a real
  budget/retention policy.

## Go / no-go decision

| Date | Decision | Scope (local pilot / broader rollout) | Decided by | Notes |
|---|---|---|---|---|
| | ⬜ Go / ⬜ No-go | | | |

*(Add a new row for each decision point — e.g. one for continuing the current 2-3 person
pilot, a separate one if/when a broader rollout is considered. Do not delete prior rows.)*
