// Cloudflare Pages Function — creates one background-job file entry per
// call. The client (app/index.html, "Run in background" mode) POSTs each
// document's already-extracted pageMarkedText here, one request per file,
// all tagged with the same jobId. This function never runs the AI pipeline
// itself — it just persists the input to KV and enqueues a small pointer
// message; the separate consumer Worker (worker/) does the actual work.
//
// Same auth gate and body-size cap as functions/api/extract.js. Requires
// the JOBS (KV) and JOBS_QUEUE (queue producer) bindings from wrangler.toml
// — see that file's header comment for the dashboard setup needed before
// this endpoint can do anything.
//
// KV schema (shared with worker/src/index.js — keep in sync if you change
// either side):
//   job:<jobId>:meta            { jobId, createdAt, totalFiles }
//   job:<jobId>:input:<fileIndex>  { fileName, pageMarkedText, selectedAi }
//   job:<jobId>:file:<fileIndex>   { fileName, status, stage?, rows?, qcReport?, error? }
//
// A single failed file can be re-enqueued without resubmitting the whole
// batch via jobs/[id]/retry.js, which reuses the input this function wrote.

const MAX_BODY_BYTES = 2 * 1024 * 1024;
const JOB_TTL_SECONDS = 7 * 24 * 60 * 60;

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

  const bodyText = await request.text();
  if (bodyText.length > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({ error: { message: "Request body too large" } }), {
      status: 413,
      headers: { "content-type": "application/json" }
    });
  }

  let body;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return new Response(JSON.stringify({ error: { message: "Body must be JSON" } }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const { jobId, fileIndex, totalFiles, fileName, pageMarkedText, selectedAi, createdAt } = body;

  if (typeof jobId !== "string" || !jobId) {
    return new Response(JSON.stringify({ error: { message: "jobId is required" } }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }
  if (!Number.isInteger(fileIndex) || fileIndex < 0) {
    return new Response(JSON.stringify({ error: { message: "fileIndex must be a non-negative integer" } }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }
  if (!Number.isInteger(totalFiles) || totalFiles < 1) {
    return new Response(JSON.stringify({ error: { message: "totalFiles must be a positive integer" } }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }
  if (typeof fileName !== "string" || !fileName) {
    return new Response(JSON.stringify({ error: { message: "fileName is required" } }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }
  if (typeof pageMarkedText !== "string" || !pageMarkedText) {
    return new Response(JSON.stringify({ error: { message: "pageMarkedText is required" } }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const metaKey = `job:${jobId}:meta`;
  const inputKey = `job:${jobId}:input:${fileIndex}`;
  const fileKey = `job:${jobId}:file:${fileIndex}`;

  try {
    // Every file-create call for a given job writes identical meta content
    // (the client sends the same createdAt for every file in the batch),
    // so this is safe even when multiple files' requests race each other —
    // no read-modify-write, just redundant idempotent puts.
    await env.JOBS.put(
      metaKey,
      JSON.stringify({ jobId, createdAt: createdAt || new Date().toISOString(), totalFiles }),
      { expirationTtl: JOB_TTL_SECONDS }
    );

    await env.JOBS.put(
      inputKey,
      JSON.stringify({ fileName, pageMarkedText, selectedAi: selectedAi || null }),
      { expirationTtl: JOB_TTL_SECONDS }
    );

    await env.JOBS.put(
      fileKey,
      JSON.stringify({ fileName, status: "queued" }),
      { expirationTtl: JOB_TTL_SECONDS }
    );

    // Queue message is just a pointer — Cloudflare Queues caps messages at
    // 128KB, and pageMarkedText alone can approach ~150,000 chars, so the
    // actual text lives only in KV (written above) and the consumer reads
    // it back by jobId + fileIndex.
    await env.JOBS_QUEUE.send({ jobId, fileIndex });
  } catch (err) {
    return new Response(JSON.stringify({ error: { message: `Could not create job file entry: ${err.message}` } }), {
      status: 502,
      headers: { "content-type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ ok: true, jobId, fileIndex }), {
    status: 202,
    headers: { "content-type": "application/json" }
  });
}
