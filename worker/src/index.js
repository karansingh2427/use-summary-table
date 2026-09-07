// Standalone Cloudflare Worker — consumes the "use-summary-jobs" queue
// (producer: functions/api/jobs.js in the main Pages project) and runs the
// AI extraction pipeline (pipeline.js) server-side, so a colleague can close
// their browser tab and come back to finished results.
//
// Each queue message is just a pointer {jobId, fileIndex} — the actual
// pageMarkedText lives in KV (job:<jobId>:input:<fileIndex>), written by
// jobs.js before it enqueued. See functions/api/jobs.js for the full KV
// schema shared between both sides.
//
// max_batch_size=1 (worker/wrangler.toml) means this handler only ever sees
// one message per batch — no need to fan out within a single queue() call.
//
// A kill-switch check, daily cost-budget precheck, and per-file audit
// logging run here (see governance.js) — the interactive /api/extract path
// checks and logs its own calls; this is the equivalent for the background
// path, using the SAME AUDIT_LOG namespace so the two share one cumulative
// daily total and one kill-switch flag.

import { extractWithLLM, JOB_TTL_SECONDS } from "./pipeline.js";
import { checkKillSwitch, checkBudget, recordUsage, recordAudit } from "./governance.js";

async function writeFileResult(env, jobId, fileIndex, patch) {
  const key = `job:${jobId}:file:${fileIndex}`;
  const existingText = await env.JOBS.get(key);
  const existing = existingText ? JSON.parse(existingText) : {};
  await env.JOBS.put(
    key,
    JSON.stringify({ ...existing, ...patch }),
    { expirationTtl: JOB_TTL_SECONDS }
  );
}

async function processMessage(env, jobId, fileIndex) {
  const inputText = await env.JOBS.get(`job:${jobId}:input:${fileIndex}`);
  if (!inputText) {
    console.error(`job:${jobId}:input:${fileIndex} missing from KV — cannot process (expired, or never written).`);
    await writeFileResult(env, jobId, fileIndex, {
      status: "error",
      error: "Job input was not found (it may have expired)."
    });
    return;
  }

  const { fileName, pageMarkedText } = JSON.parse(inputText);
  const doc = { fileName };

  // Re-checked here (not just at jobs.js submission time) because a queued
  // file can sit for a while before this Worker picks it up — an incident
  // noticed after submission but before processing should still stop it.
  const killSwitch = await checkKillSwitch(env);
  if (killSwitch.enabled) {
    console.error(`${fileName} (job ${jobId}, file ${fileIndex}): kill switch enabled — ${killSwitch.reason}`);
    await recordAudit(env, { source: "job", jobId, fileIndex, status: "blocked_killswitch" });
    await writeFileResult(env, jobId, fileIndex, { fileName, status: "error", error: killSwitch.reason });
    return;
  }

  // Belt-and-suspenders vs. the precheck jobs.js already ran at submission
  // time — this Worker runs as an independent process, and is also the side
  // that knows the most up-to-date cumulative spend (it's the one writing
  // it, via recordUsage below).
  const budget = await checkBudget(env);
  if (!budget.allowed) {
    const message = `Daily AI budget exceeded ($${budget.limitUsd}) — try again tomorrow.`;
    console.error(`${fileName} (job ${jobId}, file ${fileIndex}): ${message}`);
    await recordAudit(env, { source: "job", jobId, fileIndex, status: "blocked_budget" });
    await writeFileResult(env, jobId, fileIndex, { fileName, status: "error", error: message });
    return;
  }

  const startedAt = Date.now();
  try {
    await writeFileResult(env, jobId, fileIndex, { fileName, status: "processing" });
    const { rows, qcReport, usage, remediationCycles } = await extractWithLLM(env, jobId, fileIndex, doc, pageMarkedText);
    await recordUsage(env, usage);
    await recordAudit(env, {
      source: "job",
      jobId,
      fileIndex,
      status: "ok",
      durationMs: Date.now() - startedAt,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      estCostUsd: usage.estCostUsd,
      remediationCycles,
      qcOverall: qcReport.overall
    });
    await writeFileResult(env, jobId, fileIndex, { fileName, status: "done", rows, qcReport });
  } catch (err) {
    console.error(`${fileName} (job ${jobId}, file ${fileIndex}) failed: ${err.message}`);
    await recordAudit(env, { source: "job", jobId, fileIndex, status: "error", durationMs: Date.now() - startedAt });
    await writeFileResult(env, jobId, fileIndex, { fileName, status: "error", error: err.message });
  }
}

export default {
  async queue(batch, env, ctx) {
    for (const message of batch.messages) {
      const { jobId, fileIndex } = message.body;
      try {
        await processMessage(env, jobId, fileIndex);
      } catch (err) {
        // processMessage already writes an "error" status for pipeline
        // failures — this catch is only for something unexpected escaping
        // that (e.g. a KV outage). Ack anyway: retrying against the shared
        // mGA token on an unknown failure mode isn't safe to do
        // automatically, mirroring the client's own no-silent-retry stance.
        console.error(`unexpected failure processing job ${jobId} file ${fileIndex}: ${err.message}`);
      }
      // Always ack — a failed doc should surface as status:"error" for the
      // user to see and re-submit, not trigger Cloudflare's automatic
      // redelivery against the shared, rate-limited mGA token.
      message.ack();
    }
  }
};
