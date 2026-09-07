// Cloudflare Pages Function — lets the interactive path (app/index.html's
// in-tab pipeline) report a finished document's independent-QC outcome into
// the durable AUDIT_LOG trail, for Bayer AI Pre-Flight's "Agent drift"
// guardrail (detect scope creep / output degradation over time). The
// background-job path doesn't need this endpoint — worker/src/index.js
// already writes qcOverall/remediationCycles into its own recordAudit(...)
// call directly, since it computes qcReport itself server-side.
//
// Not an mGA call and costs nothing, so unlike extract.js/jobs.js this skips
// the kill-switch/rate-limit/budget checks — it's purely persisting data the
// client already computed. Still gated by the same pilot secret so random
// requests can't write junk into the audit trail.
//
// See scripts/check-drift.py for how this data gets read back and compared
// over time, and README.md's "Agent drift tracking" section for the full
// picture.

import { recordAudit } from "./_lib/governance.js";

const MAX_BODY_BYTES = 8 * 1024;

export async function onRequestPost(context) {
  const { request, env } = context;

  const gate = request.headers.get("x-ust-pilot");
  if (!env.PILOT_GATE_SECRET || gate !== env.PILOT_GATE_SECRET) {
    return new Response(JSON.stringify({ error: { message: "Unauthorized" } }), {
      status: 401,
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

  let body;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return new Response(JSON.stringify({ error: { message: "Body must be JSON" } }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const { fileName, qcOverall, remediationCycles } = body || {};
  if (typeof fileName !== "string" || !fileName) {
    return new Response(JSON.stringify({ error: { message: "fileName is required" } }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }
  if (typeof qcOverall !== "string" || !qcOverall) {
    return new Response(JSON.stringify({ error: { message: "qcOverall is required" } }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  await recordAudit(env, {
    source: "extract",
    status: "qc_summary",
    fileName,
    qcOverall,
    remediationCycles: Number.isInteger(remediationCycles) ? remediationCycles : 0
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}
