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

import { extractWithLLM, JOB_TTL_SECONDS } from "./pipeline.js";

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

  try {
    await writeFileResult(env, jobId, fileIndex, { fileName, status: "processing" });
    const { rows, qcReport } = await extractWithLLM(env, jobId, fileIndex, doc, pageMarkedText);
    await writeFileResult(env, jobId, fileIndex, { fileName, status: "done", rows, qcReport });
  } catch (err) {
    console.error(`${fileName} (job ${jobId}, file ${fileIndex}) failed: ${err.message}`);
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
