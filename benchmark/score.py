#!/usr/bin/env python3
"""
Benchmark scorer — compares the app's CSV export against the hand-verified
ground truth in samples/expected/flupyradifurone-5-labels.csv.

Usage:
    python3 benchmark/score.py <app_output.csv>

The app output CSV must be exported from the app via the CSV download button.
The scorer reports per-label and overall row recall and field precision.

Metrics:
    Row recall    — % of ground-truth rows matched in the app output
    Field precision — % of field values that match (on matched rows only)
    Schema compliance — % of the 28 SCHEMA columns present in the app output
"""

import csv, re, sys, os
from pathlib import Path

# ---------------------------------------------------------------------------
# Column name normaliser — strips newlines, extra spaces, case
# ---------------------------------------------------------------------------
def _norm_col(s: str) -> str:
    return re.sub(r"\s+", " ", str(s).replace("\n", " ")).strip().lower()

# ---------------------------------------------------------------------------
# Mapping: normalised ground-truth column → normalised app-schema column
# (ground truth uses slightly different names / has typos in some headers)
# ---------------------------------------------------------------------------
GT_TO_APP = {
    _norm_col("Reg. #/ File Sym"):                     _norm_col("Reg. #/File Sym"),
    _norm_col("Physcial Form."):                        _norm_col("Physical Form"),
    _norm_col("App. Target"):                           _norm_col("App. Target"),
    _norm_col("App. Type"):                             _norm_col("App. Type"),
    _norm_col("App. Equipment"):                        _norm_col("App. Equipment"),
    _norm_col("App. Timing (Site Status)"):             _norm_col("App. Timing (Site Status)"),
    _norm_col("App. Timing (other)"):                   _norm_col("App. Timing (other)"),
    _norm_col("A.I. Max Single Rate / App. (lb a.i./A)"): _norm_col("A.I. Max Single Rate/App. (lb a.i./A)"),
    _norm_col("Max # Apps / C.C."):                    _norm_col("Max # Apps/C.C."),
    _norm_col("A. I. Max Total Rate / C.C. (lb a.i./A"): _norm_col("A.I. Max Total Rate/C.C. (lb a.i./A)"),
    _norm_col("Max # Apps / Yr."):                     _norm_col("Max # Apps/Yr."),
    _norm_col("A. I. Max Total Rate / Yr. (lb a.i./A)"): _norm_col("A.I. Max Total Rate/Yr. (lb a.i./A)"),
    _norm_col("MRI (days)"):                           _norm_col("MRI (days)"),
}

# Columns in the ground truth that have no counterpart in the app schema (skip scoring)
GT_ONLY = set()

# App-schema columns not in the ground truth (skip scoring — can't evaluate)
APP_ONLY = {
    _norm_col("App Rate (lb ai/A)"),
    _norm_col("REI"),
    _norm_col("PPE"),
}

# ---------------------------------------------------------------------------
# Row matching — finds the best app-output row for a given ground-truth row
# using Jaccard similarity on Use, combined with exact App.Target and App.Type
# ---------------------------------------------------------------------------
def _best_match(gt_row: dict, app_rows: list[dict]) -> dict | None:
    """Return the app row that best matches a GT row, or None if no good match."""
    gt_pbn    = _norm_val(gt_row.get("Product Name (PBN)", ""))
    gt_use    = gt_row.get("Use", "")
    gt_target = _norm_target(gt_row.get("App.\nTarget", gt_row.get("App. Target", "")))
    gt_type_w = _word_set(gt_row.get("App.\nType", gt_row.get("App. Type", "")))

    best_score, best_row = 0.0, None
    for r in app_rows:
        if _norm_val(r.get("Product Name (PBN)", "")) != gt_pbn:
            continue
        app_target = _norm_target(r.get("App. Target", ""))
        if app_target != gt_target:
            continue  # target must agree (foliar vs soil is a hard split)
        # Type: at least one word must overlap
        app_type_w = _word_set(r.get("App. Type", ""))
        if gt_type_w and app_type_w and not (gt_type_w & app_type_w):
            continue
        use_sim = _jaccard(gt_use, r.get("Use", ""))
        if use_sim > best_score:
            best_score, best_row = use_sim, r
    return best_row if best_score >= 0.3 else None

def _norm_val(v: str) -> str:
    """Normalise a cell value — strip trademarks, punctuation, extra whitespace."""
    s = str(v).replace("™", "").replace("®", "").replace("\u2122", "").replace("\u00ae", "")
    s = re.sub(r"[/\-–—]", " ", s)   # treat slashes and dashes as spaces
    s = re.sub(r"\s+", " ", s)
    return s.strip().lower()

# App.Target uses "foliage/plant"; ground truth uses "foliar" — normalise both to a common token
_TARGET_MAP = {
    "foliage": "foliar", "foliage plant": "foliar", "foliage/plant": "foliar",
    "foliar": "foliar", "soil": "soil", "seed treatment": "seed",
    "seed": "seed", "soil drench": "soil",
}
def _norm_target(v: str) -> str:
    n = _norm_val(v)
    return _TARGET_MAP.get(n, n.split()[0] if n else "")

def _word_set(v: str) -> set:
    """Tokenise a normalised value into words, filtering short stop-words."""
    stops = {"and", "or", "the", "of", "for", "in", "a", "an", "to", "at", "by"}
    return {w for w in re.findall(r"[a-z0-9]+", _norm_val(v)) if len(w) > 2 and w not in stops}

def _jaccard(a: str, b: str) -> float:
    """Word-level Jaccard similarity — robust to minor wording differences."""
    sa, sb = _word_set(a), _word_set(b)
    if not sa and not sb:
        return 1.0
    if not sa or not sb:
        return 0.0
    return len(sa & sb) / len(sa | sb)

# ---------------------------------------------------------------------------
# Field comparison — exact after normalisation
# ---------------------------------------------------------------------------
def _fields_match(gt_val: str, app_val: str) -> bool:
    return _norm_val(gt_val) == _norm_val(app_val)

# ---------------------------------------------------------------------------
# Load CSV into list-of-dicts with normalised column keys
# ---------------------------------------------------------------------------
def _load(path: str) -> list[dict]:
    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = []
        for row in reader:
            rows.append({_norm_col(k): v for k, v in row.items()})
    return rows

# ---------------------------------------------------------------------------
# Main scoring logic
# ---------------------------------------------------------------------------
def score(app_csv: str, gt_csv: str) -> None:
    app_rows = _load(app_csv)
    gt_rows  = _load(gt_csv)

    # Build normalised col name → original col name map for app output
    app_cols = set(app_rows[0].keys()) if app_rows else set()
    schema_cols = [
        "reg. #/file sym", "physical form", "product name (pbn)",
        "use", "use site", "app. target", "app. type", "app. equipment",
        "app. timing (site status)", "app. timing (other)",
        "app rate (lb ai/a)", "a.i. max single rate/app. (lb a.i./a)",
        "max # apps/c.c.", "a.i. max total rate/c.c. (lb a.i./a)",
        "max # apps/yr.", "a.i. max total rate/yr. (lb a.i./a)",
        "mri (days)", "rei", "phi (days)", "ppe", "additional information",
        "max no. of cc/yr", "geographic restrictions", "drift restrictions",
        "soil restrictions", "on-field non-target species restrictions",
        "additional restrictions for use/use site",
    ]
    present = sum(1 for c in schema_cols if c in app_cols)
    schema_pct = round(100 * present / len(schema_cols))

    # Scorable GT columns — those that have a counterpart in the app schema
    def gt_col_to_app_col(gt_col: str) -> str:
        return GT_TO_APP.get(gt_col, gt_col)

    scorable_gt_cols = [
        c for c in gt_rows[0].keys()
        if gt_col_to_app_col(c) not in APP_ONLY
    ]

    # Per-label tracking
    labels: dict[str, dict] = {}

    for gt_row in gt_rows:
        label = _norm_val(gt_row.get("Product Name (PBN)", gt_row.get("product name (pbn)", "unknown")))
        if label not in labels:
            labels[label] = {"gt": 0, "matched": 0, "field_hits": 0, "field_total": 0}
        labels[label]["gt"] += 1

        app_row = _best_match(gt_row, app_rows)
        if not app_row:
            continue

        labels[label]["matched"] += 1

        # Score fields
        for gt_col in scorable_gt_cols:
            app_col = gt_col_to_app_col(gt_col)
            gt_val  = gt_row.get(gt_col, "")
            app_val = app_row.get(app_col, "")
            if gt_val in ("", "NS", "NA") and app_val in ("", "NS", "NA"):
                continue  # both empty/NS/NA — skip to avoid inflating scores
            labels[label]["field_hits"]  += int(_fields_match(gt_val, app_val))
            labels[label]["field_total"] += 1

    # ---------------------------------------------------------------------------
    # Print report
    # ---------------------------------------------------------------------------
    print("\n" + "=" * 72)
    print("  USE SUMMARY TABLE EXTRACTOR — BENCHMARK RESULTS")
    print("=" * 72)
    print(f"  Ground truth : {Path(gt_csv).name}  ({len(gt_rows)} rows)")
    print(f"  App output   : {Path(app_csv).name}  ({len(app_rows)} rows)")
    print(f"  Schema compliance : {present}/{len(schema_cols)} columns present ({schema_pct}%)")
    print()
    print(f"  {'Label':<45} {'GT rows':>8} {'Matched':>8} {'Recall':>8} {'Precision':>10}")
    print("  " + "-" * 70)

    total_gt = total_matched = total_fhits = total_ftotal = 0

    for lbl, s in sorted(labels.items(), key=lambda x: x[0]):
        recall = round(100 * s["matched"] / s["gt"]) if s["gt"] else 0
        prec   = round(100 * s["field_hits"] / s["field_total"]) if s["field_total"] else 0
        print(f"  {lbl:<45} {s['gt']:>8} {s['matched']:>8} {recall:>7}% {prec:>9}%")
        total_gt      += s["gt"]
        total_matched += s["matched"]
        total_fhits   += s["field_hits"]
        total_ftotal  += s["field_total"]

    print("  " + "-" * 70)
    overall_recall = round(100 * total_matched / total_gt) if total_gt else 0
    overall_prec   = round(100 * total_fhits   / total_ftotal) if total_ftotal else 0
    print(f"  {'OVERALL':<45} {total_gt:>8} {total_matched:>8} {overall_recall:>7}% {overall_prec:>9}%")
    print("=" * 72)
    print()
    print("  Row recall    — % of ground-truth uses found in the app output")
    print("  Field precision — % of field values matching exactly (on matched rows)")
    print("  Both metrics exclude NS/NA/blank cells from field scoring.")
    print()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    app_csv = sys.argv[1]
    gt_csv  = os.path.join(
        os.path.dirname(__file__),
        "../samples/expected/flupyradifurone-5-labels.csv"
    )

    if not os.path.exists(app_csv):
        print(f"Error: app output file not found: {app_csv}")
        sys.exit(1)
    if not os.path.exists(gt_csv):
        print(f"Error: ground truth not found: {gt_csv}")
        sys.exit(1)

    score(app_csv, gt_csv)
