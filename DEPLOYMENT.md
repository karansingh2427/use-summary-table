# Deployment Guide — Cloudflare Pages

This app is deployed on **Cloudflare Pages** with a serverless function for LLM extraction.

## Setup Steps

### 1. Connect Repository to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
2. Click **Create a project** → **Connect to Git**
3. Select this repository
4. Configure build settings:
   - **Build command:** (leave empty)
   - **Build output directory:** `app`
   - **Root directory:** (leave empty)

### 2. Configure Environment Variables

Go to **Settings** → **Environment variables** and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `MGA_TOKEN` | `[your-mga-token]` | Your personal myGenAssist token from Bayer |
| `PILOT_GATE_SECRET` | `ust-pilot-2026` | Must match `PILOT_GATE_HEADER_VALUE` in app/index.html |

**Important:** Set these in the **Production** environment (Cloudflare applies env vars only to deployments built after they're saved).

`RATE_LIMIT_PER_MINUTE`, `DAILY_BUDGET_USD`, and `AUDIT_TTL_SECONDS` are also configurable
— as plain (non-secret) `[vars]` in `wrangler.toml`, not dashboard environment variables —
but have safe defaults baked into the code, so you don't need to set them to get started.

### 3. Create the AUDIT_LOG KV namespace (monitoring, audit trail, cost controls)

The governance layer (`functions/api/_lib/governance.js`) needs a second KV namespace,
separate from `JOBS`, for rate-limit counters, the daily cost-budget counter, and
metadata-only audit records:

1. **Workers & Pages** → **KV** → **Create namespace** → name it something like
   `use-summary-audit-log`.
2. Copy its id into `[[kv_namespaces]] binding = "AUDIT_LOG"` in `wrangler.toml` (root)
   **and** `worker/wrangler.toml` — both must point at the same namespace so the
   interactive and background-job paths share one cumulative daily budget.
3. This only takes effect once the Pages project's "v2 build system" is on (see the
   comment at the top of `wrangler.toml`) — same requirement as the existing `JOBS`
   namespace.

Nothing breaks if this step is skipped — the governance checks fail open (they log the
error and let the request through) rather than blocking extraction on a missing binding.
But skipping it means the rate limit, budget cap, and audit trail are effectively inert.

### 4. Deploy

Push a commit or click **Retry deployment** in the Cloudflare dashboard. The function will be automatically available at:

```
https://your-site.pages.dev/api/extract
```

## How It Works

1. **App** (`app/index.html`): Static HTML/CSS/JS served directly
2. **Function** (`functions/api/extract.js`): Cloudflare Pages Function that:
   - Accepts POST requests to `/api/extract`
   - Validates the `x-ust-pilot: ust-pilot-2026` header
   - Forwards requests to Bayer's mGA gateway at `https://chat.int.bayer.com`
   - Adds the `MGA_TOKEN` server-side (never exposed to browser)
   - Returns Claude's structured response

## Function Endpoint Mapping

Cloudflare Pages automatically maps:
- `/api/extract` → `functions/api/extract.js` → `onRequestPost()` export

No special configuration file needed (unlike Netlify).

## Testing Locally

Install Wrangler (Cloudflare CLI):

```bash
npm install -g wrangler
```

Run local dev server:

```bash
wrangler pages dev app
```

Then open `http://localhost:8788` and test extraction.

**Note:** Local testing requires setting environment variables:

```bash
export MGA_TOKEN="your-token-here"
export PILOT_GATE_SECRET="ust-pilot-2026"
wrangler pages dev app
```

Or create a `.dev.vars` file (never commit this):

```
MGA_TOKEN=your-token-here
PILOT_GATE_SECRET=ust-pilot-2026
```

## Troubleshooting

### "Unauthorized" Error
- Check that `PILOT_GATE_SECRET` in Cloudflare matches `PILOT_GATE_HEADER_VALUE` in app/index.html
- Verify `MGA_TOKEN` is set correctly

### "Could not reach mGA" Error
- Verify you're on Bayer's network or VPN
- Check that `https://chat.int.bayer.com` is accessible

### "Rate limit exceeded" / "Daily AI budget exceeded" Error
- Expected behavior from the governance layer (see README.md's "Monitoring, audit trail &
  cost controls" section), not a bug. Wait a minute for the rate limit, or a day for the
  budget — or raise `RATE_LIMIT_PER_MINUTE` / `DAILY_BUDGET_USD` in `wrangler.toml` (and
  `worker/wrangler.toml`) if the defaults are genuinely too low for the pilot's usage.
- Check `wrangler kv key list --binding=AUDIT_LOG` if you need to see today's actual spend.

### Emergency: disabling AI extraction immediately (kill switch)
If something goes wrong with the shared mGA token or an extraction is misbehaving, disable
both AI paths without a deploy:
```bash
wrangler kv key put --namespace-id=<AUDIT_LOG_ID> "killswitch:enabled" "true"
wrangler kv key put --namespace-id=<AUDIT_LOG_ID> "killswitch:reason" "short reason shown to users"
```
`<AUDIT_LOG_ID>` is the same namespace id you pasted into both `wrangler.toml` files in
step 3 above (either file's copy works — it's one namespace). Both `/api/extract` and
`/api/jobs` start returning 503 immediately; no redeploy needed, no need to be in either
project's directory. Re-enable with:
```bash
wrangler kv key delete --namespace-id=<AUDIT_LOG_ID> "killswitch:enabled"
```
This only stops *new* work — a job already queued or a Worker mid-file is checked again
before that file starts, but a call already in flight to mGA still completes.

### Function Not Found (404)
- Verify `functions/api/extract.js` exists
- Check that it exports `onRequestPost` (not `handler` or other names)
- Trigger a fresh deployment after adding the file

## Keeping Knowledge Files in Sync

The app embeds knowledge files as constants. After editing any file in `knowledge/`, run:

```bash
python3 scripts/sync-knowledge.py
```

Then commit `app/index.html` and push to deploy the updated rules to production.
