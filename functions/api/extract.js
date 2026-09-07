// Cloudflare Pages Function — relays app/index.html's AI-extraction calls to
// Bayer's internal myGenAssist (mGA) gateway, adding one shared pilot mGA
// credential server-side so colleagues never need their own token.
//
// PILOT, not production: Bayer's own guidance is that sharing one person's
// mGA token is only acceptable for a small pilot (2-3 people), not a broad
// rollout. A real rollout needs the DSE-app route with a service-account
// credential and an ITLM governance review (go/beat) — see README.md.
//
// Required Cloudflare Pages environment variables (set as encrypted secrets
// in the dashboard, Production environment — never committed here):
//   MGA_TOKEN          the pilot's personal myGenAssist token
//   PILOT_GATE_SECRET  must equal PILOT_GATE_HEADER_VALUE in app/index.html
//
// Env var changes only apply to deployments built after they were saved —
// trigger a fresh deployment (push a commit, or Deployments tab -> ... ->
// Retry deployment) any time these are added or changed.
//
// A kill switch, rate limiting, a daily cost budget, audit logging, and a
// content-safety flag are handled by _lib/governance.js (requires the
// AUDIT_LOG KV binding — see wrangler.toml). See README.md's "AI extraction
// (pilot)" section for the defaults and what they do.

import {
  checkKillSwitch,
  checkRateLimit,
  checkBudget,
  recordUsage,
  recordAudit,
  scanForInjectionPhrases,
  estimateCostUsd
} from "./_lib/governance.js";

const MGA_UPSTREAM = "https://chat.int.bayer.com/anthropic/v1/messages";
const MAX_BODY_BYTES = 2 * 1024 * 1024;

export async function onRequestPost(context) {
  const { request, env } = context;
  const startedAt = Date.now();

  const gate = request.headers.get("x-ust-pilot");
  if (!env.PILOT_GATE_SECRET || gate !== env.PILOT_GATE_SECRET) {
    return new Response(JSON.stringify({ error: { message: "Unauthorized" } }), {
      status: 401,
      headers: { "content-type": "application/json" }
    });
  }

  const killSwitch = await checkKillSwitch(env);
  if (killSwitch.enabled) {
    await recordAudit(env, { source: "extract", status: "blocked_killswitch", durationMs: Date.now() - startedAt });
    return new Response(JSON.stringify({ error: { message: killSwitch.reason } }), {
      status: 503,
      headers: { "content-type": "application/json" }
    });
  }

  const rateLimit = await checkRateLimit(env, "extract");
  if (!rateLimit.allowed) {
    await recordAudit(env, { source: "extract", status: "blocked_rate_limit", durationMs: Date.now() - startedAt });
    return new Response(JSON.stringify({
      error: { message: `Rate limit exceeded (${rateLimit.limit}/min) — wait a moment and retry.` }
    }), {
      status: 429,
      headers: { "content-type": "application/json" }
    });
  }

  const budget = await checkBudget(env);
  if (!budget.allowed) {
    await recordAudit(env, { source: "extract", status: "blocked_budget", durationMs: Date.now() - startedAt });
    return new Response(JSON.stringify({
      error: { message: `Daily AI budget exceeded ($${budget.limitUsd}) — try again tomorrow, or ask whoever manages the pilot to raise DAILY_BUDGET_USD.` }
    }), {
      status: 429,
      headers: { "content-type": "application/json" }
    });
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({ error: { message: "Request body too large" } }), {
      status: 413,
      headers: { "content-type": "application/json" }
    });
  }

  const bodyText = await request.text();
  if (bodyText.length > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({ error: { message: "Request body too large" } }), {
      status: 413,
      headers: { "content-type": "application/json" }
    });
  }

  const flags = scanForInjectionPhrases(bodyText);

  // Best-effort — only used to price this call at the right model's rate;
  // a parse failure just falls back to estimateCostUsd's default (Sonnet).
  let model;
  try {
    model = JSON.parse(bodyText)?.model;
  } catch (_) {
    /* not our concern here — the upstream request below will fail loudly if bodyText isn't valid JSON */
  }

  let upstreamResponse;
  try {
    upstreamResponse = await fetch(MGA_UPSTREAM, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${env.MGA_TOKEN}`,
        "anthropic-version": "2023-06-01"
      },
      body: bodyText
    });
  } catch (err) {
    await recordAudit(env, {
      source: "extract",
      status: "error",
      durationMs: Date.now() - startedAt,
      flags: flags.length ? flags : undefined
    });
    return new Response(JSON.stringify({ error: { message: `Could not reach mGA: ${err.message}` } }), {
      status: 502,
      headers: { "content-type": "application/json" }
    });
  }

  const upstreamBody = await upstreamResponse.text();

  // Log usage/audit off a parsed clone of the same text we return below —
  // a parse or logging failure here must never change what the client gets.
  try {
    const parsed = JSON.parse(upstreamBody);
    const estCostUsd = parsed.usage ? estimateCostUsd({
      inputTokens: parsed.usage.input_tokens || 0,
      outputTokens: parsed.usage.output_tokens || 0
    }, model) : 0;
    const usage = parsed.usage
      ? { inputTokens: parsed.usage.input_tokens || 0, outputTokens: parsed.usage.output_tokens || 0, estCostUsd }
      : null;
    if (usage) await recordUsage(env, usage);
    await recordAudit(env, {
      source: "extract",
      status: upstreamResponse.ok ? "ok" : "error",
      durationMs: Date.now() - startedAt,
      model,
      inputTokens: usage?.inputTokens,
      outputTokens: usage?.outputTokens,
      estCostUsd: usage ? estCostUsd : undefined,
      flags: flags.length ? flags : undefined
    });
  } catch (err) {
    console.error(`extract.js: could not log usage/audit (response to client is unaffected): ${err.message}`);
  }

  return new Response(upstreamBody, {
    status: upstreamResponse.status,
    headers: { "content-type": "application/json" }
  });
}
