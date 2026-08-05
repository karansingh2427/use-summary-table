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

const MGA_UPSTREAM = "https://chat.int.bayer.com/anthropic/v1/messages";
const MAX_BODY_BYTES = 2 * 1024 * 1024;

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
    return new Response(JSON.stringify({ error: { message: `Could not reach mGA: ${err.message}` } }), {
      status: 502,
      headers: { "content-type": "application/json" }
    });
  }

  const upstreamBody = await upstreamResponse.text();
  return new Response(upstreamBody, {
    status: upstreamResponse.status,
    headers: { "content-type": "application/json" }
  });
}
