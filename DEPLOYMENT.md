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

### 3. Deploy

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
