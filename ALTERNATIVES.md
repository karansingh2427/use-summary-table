# Using GitHub Copilot Agents When MGA Credits Are Unavailable

When Bayer's myGenAssist (mGA) gateway credits are exhausted, you have two options:

---

## Option 1: Regex Mode (Built into the App)

**Status:** ✅ Now the default mode

The app now defaults to **regex/heuristic extraction** when you open it:
- Unchecks "🤖 Extract with AI" by default
- Works completely offline
- No API calls, no credits needed
- 82% field-level precision

### How to use:
1. Open `app/index.html` in browser
2. Drag PDFs onto the drop zone
3. Click **Run Extraction**
4. Review results (focus on Low-confidence rows)

### Performance:
| Strength | Limitation |
|----------|------------|
| ✅ Fast (instant) | ❌ Lower accuracy on complex labels |
| ✅ Offline | ❌ Struggles with multi-line text |
| ✅ No credits | ❌ Misses non-standard layouts |
| ✅ Deterministic | ❌ 82% vs 90%+ with LLM |

**When to use:** Routine labels, bulk processing, quick checks

---

## Option 2: GitHub Copilot Agent (Recommended for Accuracy)

**Status:** ✅ Uses your Copilot subscription (not Bayer MGA)

The `extraction-main-agent` provides **LLM-quality extraction** without using Bayer's MGA gateway:

### How to use:

1. **In VS Code, open GitHub Copilot Chat** (Cmd+Shift+I / Ctrl+Shift+I)

2. **Run the extraction agent:**
   ```bash
   @extraction-main-agent extract use summary table from samples/sivanto-400-sl.pdf
   ```

3. **Wait for completion** — the agent will:
   - Read the PDF with `pdftotext`
   - Load all knowledge files from `knowledge/`
   - Apply extraction-rules.md and derivation-rules.md
   - Generate a CSV file

4. **Review the output** — the agent produces:
   - CSV file(s) in the same format as the app
   - Run notes documenting what it extracted
   - Self-verification checklist results

5. **Run QC (optional but recommended):**
   ```bash
   @QC-agent check [output.csv] against samples/sivanto-400-sl.pdf
   ```

### Performance:
| Advantage | Notes |
|-----------|-------|
| ✅ Same quality as LLM app mode | Uses Claude Sonnet 4.5/Opus |
| ✅ Uses your GitHub Copilot subscription | Not Bayer MGA |
| ✅ Reads all knowledge files directly | No sync needed |
| ✅ Includes QC validation | Two-stage workflow |
| ⚠️ Manual process | Not a click-and-go UI |
| ⚠️ One PDF at a time | No batch mode yet |

**When to use:** High-priority labels, complex layouts, when accuracy matters

---

## Option 3: Hybrid Workflow

**Best of both worlds:**

1. **Bulk extraction** with regex mode (fast, offline)
2. **Re-run with agent** for any Low-confidence rows:
   ```bash
   @extraction-main-agent extract use summary table from problem-label.pdf
   ```
3. **QC validation** on critical outputs:
   ```bash
   @QC-agent check output.csv against label.pdf
   ```

---

## Comparison Table

| Feature | Regex Mode | GitHub Copilot Agent | Bayer MGA (LLM) |
|---------|------------|---------------------|-----------------|
| **Credits** | None | GitHub Copilot | Bayer MGA |
| **Speed** | Instant | ~30-60 sec/PDF | ~5-10 sec/PDF |
| **Accuracy** | 82% | 90%+ | 90%+ |
| **Offline** | ✅ Yes | ❌ No | ❌ No |
| **Batch** | ✅ Yes | ❌ No (one at a time) | ✅ Yes |
| **UI** | ✅ Click-and-go | ⚠️ Command-line | ✅ Click-and-go |
| **QC** | Manual review | Built-in workflow | Manual review |
| **Knowledge files** | Embedded (synced) | Direct from disk | Embedded (synced) |

---

## Command Reference

### Basic Extraction
```bash
@extraction-main-agent extract use summary table from path/to/label.pdf
```

### With Multiple PDFs
```bash
@extraction-main-agent extract use summary tables from:
- samples/label1.pdf
- samples/label2.pdf
- samples/label3.pdf
```

### QC Check
```bash
@QC-agent check output.csv against samples/label.pdf
```

### Full Workflow (Extraction + QC)
```bash
@orchestrator-agent extract and QC the use summary table from samples/label.pdf
```

This runs both stages automatically and only shows results after QC passes.

---

## Troubleshooting

### "MGA credits exhausted" in app
✅ **Solution:** The app now defaults to regex mode (toggle unchecked)

### "Cannot read PDF" in agent
✅ **Solution:** Install `pdftotext`:
```bash
brew install poppler  # macOS
```

### "Knowledge files not found" in agent
✅ **Solution:** Agents read directly from disk — make sure you're in the repo:
```bash
cd /path/to/use-summary-table
```

### Agent is too slow
⚠️ **Workaround:** Use regex mode for bulk work, agent for spot-checks only

---

## When to Request More MGA Credits

If you need:
- High-volume daily extraction (>50 labels/week)
- Batch processing through the web UI
- Team-wide deployment

Then contact Bayer IT to:
1. Request additional MGA budget
2. Discuss DSE-app route for production rollout
3. Explore Agent Hub listing for enterprise deployment

For now, the GitHub Copilot agent provides equivalent quality without MGA dependency.
