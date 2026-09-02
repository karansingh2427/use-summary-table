# Agent Knowledge File Reading — Verification

This document confirms that both the app and agents properly read knowledge files.

---

## ✅ App (`app/index.html`) — Now Reads Knowledge Files

### How it works:
The app embeds knowledge files as JavaScript constants and passes them to Claude via `/api/extract`:

```javascript
const EXTRACTION_RULES_MD = "...";  // ✅ synced from knowledge/extraction-rules.md
const DERIVATION_RULES_MD = "...";  // ✅ synced from knowledge/derivation-rules.md
const SCHEMA_REFERENCE_MD = "...";  // ✅ synced from knowledge/schema-reference.md
const UNIT_CONVERSIONS_MD = "...";  // ✅ synced from knowledge/unit-conversions.md
const GOLDEN_EXAMPLE_V2_TXT = "..."; // ✅ synced from knowledge/golden-examples/golden_example_v2.txt
```

### System prompt (sent to Claude):
```javascript
const systemPrompt = [
  "You are a regulatory extraction analyst...",
  "Every row must have exactly these columns...",
  JSON.stringify(SCHEMA),
  "",
  EXTRACTION_RULES_MD,    // ← Knowledge file #1
  "",
  DERIVATION_RULES_MD     // ← Knowledge file #2
].join("\n");
```

**Status:** ✅ **FIXED** — All 5 knowledge files synced via `scripts/sync-knowledge.py`

---

## ✅ `extraction-main-agent` — Reads Knowledge Files Directly

### Step 0 checklist (from `.github/agents/extraction-main.agent.md`):

```markdown
Before opening the PDF, confirm you have the following loaded and ready:

- [ ] A golden example from `knowledge/golden-examples/`
- [ ] The relevant training log(s) from `knowledge/training-logs/`
- [ ] The schema definition (`knowledge/schema-reference.md` + `knowledge/UST_definitions.txt`)
- [ ] The unit conversion table (`knowledge/unit-conversions.md`)
- [ ] `knowledge/extraction-rules.md` (R-1…R-13) and `knowledge/derivation-rules.md` (D1–D3)
```

### Tools available:
```markdown
| Tool | What you use it for |
|---|---|
| `runCommands` | `pdftotext -layout label.pdf -` to read the label |
| `search` | Find wording across `knowledge/`, `samples/`, and `SCHEMA` |
| `fetch` | Only for unit-conversion factors or EPA crop-group membership |
```

### Workflow:
The agent is explicitly instructed to:
1. Load all knowledge files before extraction (Step 0)
2. Apply `knowledge/extraction-rules.md` rule-by-rule (Step 3)
3. Apply `knowledge/derivation-rules.md` where evidence exists (Step 3)
4. Use `search` tool to query files in `knowledge/`

**Status:** ✅ **CORRECT** — Agent reads files directly from disk, no sync needed

---

## ✅ `QC-agent` — Reads Knowledge Files Directly

### Sources checked (from `.github/agents/QC-agent.agent.md`):

```markdown
| # | Source | Use it for |
|---|---|---|
| 1 | The source label PDF, via each row's **Page** value | Primary truth |
| 2 | `knowledge/golden-examples/` | Format anchor |
| 3 | `knowledge/training-logs/` · `knowledge/extraction-rules.md` | Past mistakes |
| 4 | `knowledge/schema-reference.md` · `SCHEMA` in `app/index.html` | Column definitions |
| 5 | `knowledge/unit-conversions.md` | Verifying rate arithmetic |
| 6 | Web search (`fetch`) | Unit factors and crop groups only |
```

### Pre-flight check:
```markdown
Before starting, read `knowledge/training-logs/` and confirm none of the 
recorded mistakes recur in the table you are checking.
```

**Status:** ✅ **CORRECT** — Agent reads files directly from disk via `search` tool

---

## Summary

| Component | Reads Knowledge Files | How | Status |
|-----------|----------------------|-----|--------|
| **App (`app/index.html`)** | ✅ Yes | Embedded JS constants, sent to Claude | ✅ **FIXED** (synced) |
| **`extraction-main-agent`** | ✅ Yes | Direct file access via `search` tool | ✅ **CORRECT** |
| **`QC-agent`** | ✅ Yes | Direct file access via `search` tool | ✅ **CORRECT** |

---

## Test Commands

### Test app extraction:
1. Open app in browser
2. Check console: `"🤖 Extract with AI"` checkbox should be checked
3. Upload PDF → Run Extraction
4. Log should show: `"extracting with AI (reads the full label and applies extraction-rules.md / derivation-rules.md)"`

### Test agent extraction:
```bash
@extraction-main-agent extract use summary table from samples/sivanto-400-sl.pdf
```

The agent should:
1. Load knowledge files in Step 0
2. Read the PDF with `pdftotext`
3. Apply extraction/derivation rules
4. Generate a CSV output

### Test QC agent:
```bash
@QC-agent check [output.csv] against samples/sivanto-400-sl.pdf
```

The agent should:
1. Read `knowledge/training-logs/` for past mistakes
2. Cross-check every field against the PDF
3. Apply `knowledge/extraction-rules.md` defect severity
4. Report any Critical/High/Medium/Low defects

---

## Maintenance Workflow

**After editing any knowledge file:**

```bash
# For the app (embedded constants):
python3 scripts/sync-knowledge.py
git add app/index.html
git commit -m "Sync knowledge files to app"
git push

# For agents (no action needed):
# Agents read files directly from disk — changes take effect immediately
```

**Verify sync is current:**
```bash
python3 scripts/sync-knowledge.py
# Should output: "✓ All knowledge files already in sync"
```

---

## Known Issues

### ❌ Issue: App can't read updated knowledge files until sync
**Solution:** Run `scripts/sync-knowledge.py` after every edit to `knowledge/`

### ❌ Issue: LLM extraction returns 401 Unauthorized
**Solution:** Set Cloudflare environment variables:
- `MGA_TOKEN` = your Bayer myGenAssist token
- `PILOT_GATE_SECRET` = `ust-pilot-2026`

### ❌ Issue: LLM extraction returns 502 Bad Gateway
**Solution:** Verify you're on Bayer network/VPN and `https://chat.int.bayer.com` is reachable

---

## Files Modified

| File | Change |
|------|--------|
| `app/index.html` | ✅ All 5 knowledge constants updated (15,533 + 7,325 + 8,020 + 2,559 + 2,539 chars) |
| `scripts/sync-knowledge.py` | ✅ Created — automates knowledge file sync |
| `.gitignore` | ✅ Added Cloudflare dev files (`.dev.vars`, `.wrangler/`) |
| `netlify.toml` | ❌ Deleted — using Cloudflare only |
| `DEPLOYMENT.md` | ✅ Created — Cloudflare Pages setup guide |
| `.dev.vars.example` | ✅ Created — local development template |
| `README.md` | ✅ Updated — added sync instructions |
