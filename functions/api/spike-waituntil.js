// THROWAWAY SPIKE — not part of the app. Answers one question for the
// background-job design (see plan doc): how long does context.waitUntil()
// keep running after the response is sent, on this Cloudflare Pages plan?
//
// POST /api/spike-waituntil  { webhookUrl: "https://webhook.site/<your-id>", minutes: 20 }
// Same auth gate as functions/api/extract.js (x-ust-pilot header, no new env var).
//
// It returns immediately, then keeps POSTing a heartbeat to webhookUrl every
// 30s from inside waitUntil for up to `minutes` (capped at 30). Watch the
// webhook: if heartbeats stop early and never reach the "done" one, that's
// the real survival ceiling — route (b) in the plan is out, use (a) instead.
//
// Delete this file once the platform question is resolved either way.

const MAX_MINUTES = 30;
const HEARTBEAT_MS = 30 * 1000;

function isSafeWebhookUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

async function ping(webhookUrl, payload) {
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch {
    // webhook down or unreachable — nothing to do, next heartbeat will retry
  }
}

async function runSpike(webhookUrl, minutes) {
  const runId = crypto.randomUUID();
  const startedAt = Date.now();
  const durationMs = minutes * 60 * 1000;

  await ping(webhookUrl, { runId, event: "start", minutes, ts: new Date().toISOString() });

  let elapsedMs = 0;
  while (elapsedMs < durationMs) {
    await new Promise(resolve => setTimeout(resolve, HEARTBEAT_MS));
    elapsedMs = Date.now() - startedAt;
    await ping(webhookUrl, {
      runId,
      event: "heartbeat",
      elapsedSeconds: Math.round(elapsedMs / 1000),
      ts: new Date().toISOString()
    });
  }

  await ping(webhookUrl, {
    runId,
    event: "done",
    elapsedSeconds: Math.round(elapsedMs / 1000),
    ts: new Date().toISOString()
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const gate = request.headers.get("x-ust-pilot");
  if (!env.PILOT_GATE_SECRET || gate !== env.PILOT_GATE_SECRET) {
    return new Response(JSON.stringify({ error: { message: "Unauthorized" } }), {
      status: 401,
      headers: { "content-type": "application/json" }
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: { message: "Body must be JSON" } }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const { webhookUrl } = body;
  const minutes = Math.min(Number(body.minutes) || 20, MAX_MINUTES);

  if (!webhookUrl || !isSafeWebhookUrl(webhookUrl)) {
    return new Response(JSON.stringify({ error: { message: "webhookUrl must be an https:// URL" } }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  context.waitUntil(runSpike(webhookUrl, minutes));

  return new Response(JSON.stringify({
    ok: true,
    minutes,
    message: `Spike started. Watch ${webhookUrl} for a heartbeat every 30s. If it stops before "done" at ~${minutes}min, that's the survival ceiling.`
  }), {
    status: 202,
    headers: { "content-type": "application/json" }
  });
}
