// Cloudflare Pages Function — re-enqueues a single failed file within an
// existing job, without resubmitting the whole batch. Used by the "Retry"
// button on the ?job=<jobId> status view for any file with status:"error"
// (see renderJobFilesPanel in app/index.html).
//
// The original input (job:<jobId>:input:<fileIndex>) is still in KV from
// the initial submission, so this only needs to reset the file record and
// send a fresh queue message — no re-upload of pageMarkedText required.
// See functions/api/jobs.js for the shared KV schema.

const JOB_TTL_SECONDS = 7 * 24 * 60 * 60;

export async function onRequestPost(context) {
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

  let body;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return new Response(JSON.stringify({ error: { message: "Body must be JSON" } }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const { fileIndex } = body;
  if (!Number.isInteger(fileIndex) || fileIndex < 0) {
    return new Response(JSON.stringify({ error: { message: "fileIndex must be a non-negative integer" } }), {
      status: 400,
      headers: { "content-type": "application/json" }
    });
  }

  const fileKey = `job:${jobId}:file:${fileIndex}`;
  const inputKey = `job:${jobId}:input:${fileIndex}`;

  const fileText = await env.JOBS.get(fileKey);
  if (!fileText) {
    return new Response(JSON.stringify({ error: { message: "File record not found (it may have expired)." } }), {
      status: 404,
      headers: { "content-type": "application/json" }
    });
  }

  const file = JSON.parse(fileText);
  if (file.status !== "error") {
    return new Response(JSON.stringify({
      error: { message: `Only a file with status "error" can be retried (current status: "${file.status}").` }
    }), {
      status: 409,
      headers: { "content-type": "application/json" }
    });
  }

  const inputText = await env.JOBS.get(inputKey);
  if (!inputText) {
    return new Response(JSON.stringify({
      error: { message: "Original input for this file has expired — resubmit the file from the app instead." }
    }), {
      status: 410,
      headers: { "content-type": "application/json" }
    });
  }

  try {
    // A full overwrite, not a merge — clears the prior error/stage so the
    // status view doesn't show stale failure text while the retry runs.
    await env.JOBS.put(
      fileKey,
      JSON.stringify({ fileName: file.fileName, status: "queued" }),
      { expirationTtl: JOB_TTL_SECONDS }
    );
    await env.JOBS_QUEUE.send({ jobId, fileIndex });
  } catch (err) {
    return new Response(JSON.stringify({ error: { message: `Could not re-enqueue file: ${err.message}` } }), {
      status: 502,
      headers: { "content-type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ ok: true, jobId, fileIndex }), {
    status: 202,
    headers: { "content-type": "application/json" }
  });
}
