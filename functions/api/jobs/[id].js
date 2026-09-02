// Cloudflare Pages Function — background-job status, polled by the app's
// "?job=<jobId>" status view. Read-only: assembles the job's meta record
// plus every per-file record from KV. See functions/api/jobs.js for the
// write side and the shared KV schema.

export async function onRequestGet(context) {
  const { request, env, params } = context;

  const gate = request.headers.get("x-ust-pilot");
  if (!env.PILOT_GATE_SECRET || gate !== env.PILOT_GATE_SECRET) {
    return new Response(JSON.stringify({ error: { message: "Unauthorized" } }), {
      status: 401,
      headers: { "content-type": "application/json" }
    });
  }

  const jobId = params.id;
  if (typeof jobId !== "string" || !jobId) {
    return new Response(JSON.stringify({ error: { message: "Job id is required" } }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const metaText = await env.JOBS.get(`job:${jobId}:meta`);
  if (!metaText) {
    return new Response(JSON.stringify({ error: { message: "Job not found (it may have expired, or never existed)" } }), {
      status: 404,
      headers: { "content-type": "application/json" }
    });
  }

  const meta = JSON.parse(metaText);
  const files = [];

  for (let fileIndex = 0; fileIndex < meta.totalFiles; fileIndex++) {
    const fileText = await env.JOBS.get(`job:${jobId}:file:${fileIndex}`);
    files.push(fileText ? { fileIndex, ...JSON.parse(fileText) } : { fileIndex, status: "queued" });
  }

  const allSettled = files.every(f => f.status === "done" || f.status === "error");
  const anyError = files.some(f => f.status === "error");
  const status = !allSettled ? "processing" : (anyError ? "done_with_errors" : "done");

  return new Response(JSON.stringify({
    jobId,
    createdAt: meta.createdAt,
    totalFiles: meta.totalFiles,
    status,
    files
  }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}
