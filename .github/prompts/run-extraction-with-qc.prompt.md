---
description: Run the extraction workflow with QC gating using orchestrator-agent.
---

Run this workflow via orchestrator-agent:
- Stage 1: extraction-main-agent performs extraction and prepares outputs.
- Stage 2: QC-agent validates outputs against source PDF(s), remediates fixable defects, then re-validates.
- Return final user-facing response only after QC.

Inputs:
- PDF paths: ${input:PDF paths}
- Notes: ${input:Optional focus notes}

Required output:
1) Extraction summary
2) QC verdict and findings
3) Remediation actions taken (with what changed)
4) Release decision (Approved or Blocked)
5) Next actions
