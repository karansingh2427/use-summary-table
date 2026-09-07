#!/usr/bin/env python3
"""
Agent drift check — Bayer AI Pre-Flight "Golden Standard & Guardrails" item:
detect when the extraction agent's output quality degrades over time.

Reads the AUDIT_LOG KV trail (both the interactive path's /api/qc-summary
records and the background-job worker's own recordAudit calls — both carry a
qcOverall field) and compares a recent trailing window against the window
before it: severity mix, average remediation cycles, and count of
prompt-injection flags. Prints a "review needed" line if things look worse.

This is on-demand only, by design — no schedule, no alerting channel. It
flags a signal for a human to look into; it never takes any corrective
action itself.

Run: python3 scripts/check-drift.py [--recent-days N] [--prior-days N] [--threshold-points N]
"""

import argparse
import json
import subprocess
import sys
from datetime import date, timedelta

SEVERITIES = ["Clean", "Low", "Medium", "High", "Critical"]
HIGH_SEVERITIES = {"High", "Critical"}


def list_audit_keys():
    result = subprocess.run(
        ["wrangler", "kv", "key", "list", "--binding=AUDIT_LOG", "--remote"],
        capture_output=True, text=True, check=True
    )
    return [entry["name"] for entry in json.loads(result.stdout)]


def get_record(key):
    result = subprocess.run(
        ["wrangler", "kv", "key", "get", "--binding=AUDIT_LOG", "--remote", key],
        capture_output=True, text=True, check=True
    )
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return None


def load_qc_records():
    """Fetches every audit record and keeps only those carrying qcOverall —
    the ones written by change #1 (worker) and change #2 (/api/qc-summary)
    of the drift-tracking work. Older/unrelated audit records are skipped."""
    records = []
    for key in list_audit_keys():
        if not key.startswith("audit:"):
            continue
        record = get_record(key)
        if record and record.get("qcOverall"):
            records.append(record)
    return records


def in_window(record, start, end):
    ts = record.get("ts", "")
    day = ts[:10]
    return start.isoformat() <= day <= end.isoformat()


def summarize(records):
    total = len(records)
    counts = {sev: 0 for sev in SEVERITIES}
    cycles_sum = 0
    flagged = 0
    for r in records:
        overall = r.get("qcOverall")
        if overall in counts:
            counts[overall] += 1
        cycles_sum += r.get("remediationCycles") or 0
        if r.get("flags"):
            flagged += 1
    high_share = (sum(counts[s] for s in HIGH_SEVERITIES) / total * 100) if total else 0.0
    avg_cycles = (cycles_sum / total) if total else 0.0
    return {
        "total": total,
        "counts": counts,
        "high_share": high_share,
        "avg_cycles": avg_cycles,
        "flagged": flagged
    }


def print_window(label, summary):
    print(f"\n{label} — {summary['total']} document(s)")
    if summary["total"] == 0:
        print("  (no records)")
        return
    for sev in SEVERITIES:
        n = summary["counts"][sev]
        pct = n / summary["total"] * 100
        print(f"  {sev:<9} {n:>4}  ({pct:5.1f}%)")
    print(f"  avg remediation cycles: {summary['avg_cycles']:.2f}")
    print(f"  content-safety flags:   {summary['flagged']}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--recent-days", type=int, default=7, help="size of the recent window (default 7)")
    parser.add_argument("--prior-days", type=int, default=7, help="size of the prior window (default 7)")
    parser.add_argument("--threshold-points", type=float, default=10.0,
                         help="High+Critical share increase (percentage points) that triggers a review flag (default 10)")
    args = parser.parse_args()

    today = date.today()
    recent_start = today - timedelta(days=args.recent_days - 1)
    prior_end = recent_start - timedelta(days=1)
    prior_start = prior_end - timedelta(days=args.prior_days - 1)

    print("Fetching audit records from AUDIT_LOG (wrangler kv key list/get)…")
    try:
        records = load_qc_records()
    except FileNotFoundError:
        print("error: wrangler CLI not found — install it or run `npx wrangler ...` manually.", file=sys.stderr)
        sys.exit(1)
    except subprocess.CalledProcessError as err:
        print(f"error: wrangler command failed: {err}", file=sys.stderr)
        sys.exit(1)

    recent = [r for r in records if in_window(r, recent_start, today)]
    prior = [r for r in records if in_window(r, prior_start, prior_end)]

    recent_summary = summarize(recent)
    prior_summary = summarize(prior)

    print_window(f"Recent window ({recent_start} to {today})", recent_summary)
    print_window(f"Prior window ({prior_start} to {prior_end})", prior_summary)

    if recent_summary["total"] == 0 or prior_summary["total"] == 0:
        print("\nNot enough data in one or both windows to compare — skipping the review-needed check.")
        return

    share_delta = recent_summary["high_share"] - prior_summary["high_share"]
    cycles_delta = recent_summary["avg_cycles"] - prior_summary["avg_cycles"]

    print(f"\nHigh+Critical share: {prior_summary['high_share']:.1f}% -> {recent_summary['high_share']:.1f}% ({share_delta:+.1f} pts)")
    print(f"Avg remediation cycles: {prior_summary['avg_cycles']:.2f} -> {recent_summary['avg_cycles']:.2f} ({cycles_delta:+.2f})")

    if share_delta >= args.threshold_points or cycles_delta >= 0.5:
        print(
            "\n⚠ REVIEW NEEDED — output quality looks worse in the recent window. "
            "This is a flag for a human to look into (an mGA-side model change, a "
            "knowledge-file regression, or an unusual batch of hard labels), not an "
            "automatic action."
        )
    else:
        print("\nNo material degradation detected.")


if __name__ == "__main__":
    main()
