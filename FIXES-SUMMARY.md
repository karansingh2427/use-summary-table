# LLM Extraction Fixes — Summary

**Date:** 2026-08-06  
**Issue:** LLM extraction not working; knowledge files not being read properly

---

## Problems Found

### 1. ❌ Knowledge Files Out of Sync
The app embeds knowledge files as JavaScript constants, but they were **stale**:

| File | Embedded (old) | Actual (current) | Delta |
|------|---------------|------------------|-------|
| `extraction-rules.md` | 16,127 chars | 15,533 chars | -594 |
| `derivation-rules.md` | 7,564 chars | 7,325 chars | -239 |
| `schema-reference.md` | 8,352 chars | 8,020 chars | -332 |
| `unit-conversions.md` | ? | 2,559 chars | ? |
| `golden_example_v2.txt` | ? | 2,539 chars | ? |

**Root cause:** Manual sync process documented in comments but never enforced.

### 2. ❌ Wrong Deployment Platform
- Code: Cloudflare Pages Functions (`export async function onRequestPost`)
- Config: Netlify (`netlify.toml`)
- These platforms use **incompatible function formats**

### 3. ⚠️ Missing Environment Variables
The function requires:
- `MGA_TOKEN` — Bayer's myGenAssist token
- `PILOT_GATE_SECRET` — Must equal `"ust-pilot-2026"`

Without these, all extractions fail with 401 Unauthorized.

---

## Fixes Applied

### ✅ Fix 1: Automated Knowledge Sync
**Created:** `scripts/sync-knowledge.py`

```bash
python3 scripts/sync-knowledge.py
```

This script:
- Reads all knowledge files from `knowledge/`
- Escapes them for JavaScript string literals
- Updates the embedded constants in `app/index.html`
- Reports what changed

**Result:** All 5 knowledge files synced and up-to-date.

### ✅ Fix 2: Cloudflare-Only Setup
**Removed:**
- `netlify.toml` ❌ (deleted)
- `netlify/functions/extract.js` ❌ (deleted)

**Kept:**
- `functions/api/extract.js` ✅ (Cloudflare Pages Function format)

**Created:**
- `DEPLOYMENT.md` — Complete Cloudflare Pages setup guide
- `.dev.vars.example` — Template for local development
- `.gitignore` updates — Ignore `.dev.vars` and `.wrangler/`

### ✅ Fix 3: Documentation
**Updated:**
- `README.md` — Added knowledge sync section, links to DEPLOYMENT.md
- `DEPLOYMENT.md` — Step-by-step Cloudflare deployment guide

---

## Verification Steps

### Check if LLM extraction is working:

1. **Verify knowledge files are synced:**
   ```bash
   python3 scripts/sync-knowledge.py
   ```
   Should say "All knowledge files already in sync"

2. **Check deployment:**
   - Go to Cloudflare Pages dashboard
   - Verify environment variables are set:
     - `MGA_TOKEN` = [your token]
     - `PILOT_GATE_SECRET` = `ust-pilot-2026`

3. **Test in browser:**
   - Open the deployed app
   - Ensure "🤖 Extract with AI" checkbox is **checked**
   - Upload a PDF
   - Click "Run Extraction"
   - Console should show: `"Extracting [filename] with Claude…"`
   - Network tab should show POST to `/api/extract` with 200 response

4. **Check agent extraction:**
   The `extraction-main-agent` reads knowledge files directly from disk:
   ```bash
   @extraction-main-agent extract the use summary table from samples/sivanto-400-sl.pdf
   ```
   It should read:
   - `knowledge/extraction-rules.md`
   - `knowledge/derivation-rules.md`
   - `knowledge/schema-reference.md`
   - `knowledge/unit-conversions.md`
   - Golden examples from `knowledge/golden-examples/`

---

## Next Steps

1. **Commit changes:**
   ```bash
   git add app/index.html scripts/ DEPLOYMENT.md .dev.vars.example .gitignore README.md
   git commit -m "Fix LLM extraction: sync knowledge files and fix Cloudflare setup"
   git push
   ```

2. **Redeploy:**
   - Cloudflare will auto-deploy from the push
   - Or manually trigger: Cloudflare Dashboard → Pages → Deployments → Retry

3. **Set up environment variables** (if not already done):
   - Cloudflare Dashboard → Pages → Settings → Environment variables
   - Add `MGA_TOKEN` and `PILOT_GATE_SECRET` for Production

4. **Test extraction end-to-end:**
   - Upload a test PDF
   - Verify LLM extraction works
   - Check that results match expectations in `samples/expected/`

---

## Maintenance

**After editing any file in `knowledge/`:**
```bash
python3 scripts/sync-knowledge.py
git add app/index.html
git commit -m "Update knowledge files"
git push
```

This ensures the app's embedded knowledge stays in sync with the source files.
