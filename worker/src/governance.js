// Governance helpers — rate limiting, daily cost budget, audit logging, and
// a content-safety tripwire — used by worker/src/index.js (and threaded
// through pipeline.js's usage totals). Ported/duplicated from
// functions/api/_lib/governance.js for this separate Worker deployable (no
// shared build step between the two projects — same reason pipeline.js is
// itself a documented ported copy of app/index.html's extraction logic;
// keep both governance.js files in sync by hand).
//
// Everything here reads/writes the AUDIT_LOG KV namespace, which is
// separate from JOBS: JOBS is 7-day TTL, built for job-status polling;
// AUDIT_LOG is longer-retention and metadata-only (never raw label text),
// closing the Bayer AI Pre-Flight checklist's monitoring/audit-trail/
// cost-control gaps. Requires the AUDIT_LOG binding from worker/wrangler.toml
// — the SAME namespace id as the Pages project's binding, so budget/rate
// counters are shared across both the interactive and background paths.
//
// KV has no atomic increment, so the rate-limit and budget counters below
// are best-effort — a read-then-put race can under-count under concurrent
// requests. Adequate to catch a runaway loop or accidental hammering of the
// shared mGA token; not an adversarial-proof guarantee.

const DEFAULT_RATE_LIMIT_PER_MINUTE = 20;
const DEFAULT_DAILY_BUDGET_USD = 15;
const DEFAULT_AUDIT_TTL_SECONDS = 180 * 24 * 60 * 60;

// Rough per-model pricing, for internal budget-tracking only — not the real
// mGA/Anthropic invoice. Keyed by the exact `model` string sent in the
// request body, so a call that escalated to Opus (see pipeline.js's
// remediation loop) prices at Opus rates, not a blended Sonnet-only guess.
const MODEL_PRICING = {
  "claude-sonnet-5": { inputPerMtok: 3, outputPerMtok: 15 },
  "claude-opus-5": { inputPerMtok: 15, outputPerMtok: 75 }
};
const DEFAULT_MODEL = "claude-sonnet-5";

// Coarse tripwire only — flags for human review, never blocks. False
// positives on real label text are likely (labels legitimately contain
// phrases like "follow label instructions"), and the primary defense stays
// the existing human-in-the-loop row review before export.
const INJECTION_PATTERNS = [
  { name: "ignore-instructions", re: /ignore (all |any )?(previous|prior) instructions/i },
  { name: "disregard-system-prompt", re: /disregard (the |any )?(system prompt|previous instructions)/i },
  { name: "role-override", re: /you are now (a|an)\b/i },
  { name: "new-instructions-override", re: /new instructions?:/i }
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/** Returns the flag names (not the matched text) for any suspicious phrase found. */
export function scanForInjectionPhrases(text) {
  if (!text) return [];
  return INJECTION_PATTERNS.filter(p => p.re.test(text)).map(p => p.name);
}

/**
 * Emergency stop: a single KV flag, checked before any other governance
 * check, that lets someone with `wrangler kv key put` access disable AI
 * extraction on both paths in seconds — no code change, no redeploy. Toggle
 * with (either wrangler.toml's namespace id works, they're the same one):
 *   wrangler kv key put --namespace-id=<AUDIT_LOG_ID> "killswitch:enabled" "true"
 *   wrangler kv key put --namespace-id=<AUDIT_LOG_ID> "killswitch:reason" "why"
 * Re-enable with:
 *   wrangler kv key delete --namespace-id=<AUDIT_LOG_ID> "killswitch:enabled"
 * Fails open on a KV error, same rationale as the other checks below — this
 * is a fast manual stop for a human-noticed incident, not the only safety
 * net (the human-in-the-loop row review before export still applies), so an
 * unrelated KV outage should not itself take extraction down.
 */
export async function checkKillSwitch(env) {
  try {
    const value = await env.AUDIT_LOG.get("killswitch:enabled");
    if (value !== "true") return { enabled: false };
    const reason = await env.AUDIT_LOG.get("killswitch:reason");
    return { enabled: true, reason: reason || "AI extraction is temporarily disabled." };
  } catch (err) {
    console.error(`kill-switch check failed, allowing request through: ${err.message}`);
    return { enabled: false };
  }
}

/**
 * Best-effort fixed-window rate limit, keyed per-endpoint via bucketPrefix.
 * Fails open (allows the request) if the KV check itself errors — a
 * governance-layer outage must never take down extraction.
 */
export async function checkRateLimit(env, bucketPrefix) {
  const limit = Number(env.RATE_LIMIT_PER_MINUTE) || DEFAULT_RATE_LIMIT_PER_MINUTE;
  const bucket = Math.floor(Date.now() / 60000);
  const key = `ratelimit:${bucketPrefix}:${bucket}`;
  try {
    const existing = await env.AUDIT_LOG.get(key);
    const count = existing ? Number(existing) : 0;
    await env.AUDIT_LOG.put(key, String(count + 1), { expirationTtl: 120 });
    return { allowed: count < limit, count: count + 1, limit };
  } catch (err) {
    console.error(`rate-limit check failed, allowing request through: ${err.message}`);
    return { allowed: true, count: 0, limit };
  }
}

/**
 * Estimated USD for a {inputTokens, outputTokens} usage object, priced at the
 * given model's rate (falls back to DEFAULT_MODEL's rate, with a warning, for
 * an unrecognized model string). Internal budget-tracking only.
 */
export function estimateCostUsd(usage, model) {
  if (!usage) return 0;
  if (model && !MODEL_PRICING[model]) {
    console.warn(`estimateCostUsd: unrecognized model "${model}", using ${DEFAULT_MODEL} pricing as an approximation`);
  }
  const pricing = MODEL_PRICING[model] || MODEL_PRICING[DEFAULT_MODEL];
  const inputCost = ((usage.inputTokens || 0) / 1e6) * pricing.inputPerMtok;
  const outputCost = ((usage.outputTokens || 0) / 1e6) * pricing.outputPerMtok;
  return inputCost + outputCost;
}

/**
 * Precheck against today's cumulative spend, run before starting new mGA
 * work. Fails open on a KV error, same rationale as checkRateLimit.
 */
export async function checkBudget(env) {
  const limit = Number(env.DAILY_BUDGET_USD) || DEFAULT_DAILY_BUDGET_USD;
  const key = `budget:${todayKey()}`;
  try {
    const existing = await env.AUDIT_LOG.get(key);
    const spent = existing ? (JSON.parse(existing).estCostUsd || 0) : 0;
    return { allowed: spent < limit, spentUsd: spent, limitUsd: limit };
  } catch (err) {
    console.error(`budget check failed, allowing request through: ${err.message}`);
    return { allowed: true, spentUsd: 0, limitUsd: limit };
  }
}

/**
 * Adds a call's usage to today's cumulative budget counter. `usage` must
 * already carry `estCostUsd` — computed by the caller via estimateCostUsd(),
 * since only the caller knows which model(s) actually ran (a multi-call file
 * whose remediation escalated to Opus has some tokens at Sonnet rates and
 * some at Opus rates; this function just accumulates the dollar figure it's
 * given, it doesn't re-derive it from a single blended rate). Never throws —
 * a logging failure must never break the user-facing call.
 */
export async function recordUsage(env, usage) {
  const key = `budget:${todayKey()}`;
  try {
    const existingText = await env.AUDIT_LOG.get(key);
    const existing = existingText ? JSON.parse(existingText) : { inputTokens: 0, outputTokens: 0, estCostUsd: 0 };
    const updated = {
      inputTokens: existing.inputTokens + (usage?.inputTokens || 0),
      outputTokens: existing.outputTokens + (usage?.outputTokens || 0),
      estCostUsd: existing.estCostUsd + (usage?.estCostUsd || 0)
    };
    // 2-day TTL is plenty — only "today" is ever read, this just avoids the
    // key living forever once a given day is done with.
    await env.AUDIT_LOG.put(key, JSON.stringify(updated), { expirationTtl: 2 * 24 * 60 * 60 });
  } catch (err) {
    console.error(`could not record usage against the daily budget: ${err.message}`);
  }
}

/**
 * Writes one metadata-only audit record. Never raw label text or PII — see
 * the shape in the plan/README. Never throws.
 */
export async function recordAudit(env, record) {
  try {
    const ttl = Number(env.AUDIT_TTL_SECONDS) || DEFAULT_AUDIT_TTL_SECONDS;
    const key = `audit:${todayKey()}:${crypto.randomUUID()}`;
    await env.AUDIT_LOG.put(
      key,
      JSON.stringify({ ts: new Date().toISOString(), ...record }),
      { expirationTtl: ttl }
    );
  } catch (err) {
    console.error(`could not write audit record (the call itself is unaffected): ${err.message}`);
  }
}
