// Ported, trimmed copy of the AI extraction pipeline from app/index.html
// (not a shared import — that file is one inline <script>, not a module).
// Source line numbers below are from app/index.html as of the port (2026-09):
// buildRowSchemaTool ~3872, buildValidationReportTool ~3907, buildQcReportTool
// ~3933, buildTools ~3964, buildSystemBlocks ~3980, buildDocMessageBlocks
// ~4005, callAnthropic ~4017, runExtractionTurn ~4054,
// runValidationCorrectionLoop ~4068, runQcTurn ~4120, runRemediationLoop
// ~4139, buildAppRows ~4193, extractWithLLM ~4231. SCHEMA ~519, NOT_SPECIFIED
// ~555, KEY_FIELDS ~1791, scoreRow ~1799, blankRow ~624.
//
// Differences from the browser version, all confirmed necessary by direct
// inspection of the source (nothing else in these functions touches
// window/document/localStorage):
//   - The in-tab progress bar (pState/updateAiProgress/advanceAiProgress) is
//     replaced by reportStage(env, jobId, fileIndex, stage), which merges
//     {status:"processing", stage} into the file's KV record — same stage
//     label strings the in-tab bar already showed, so a background status
//     page can show equivalent granularity.
//   - Every `logEl.textContent += ...` becomes a console.log/warn call,
//     visible via `wrangler tail` — there's no in-page log panel server-side.
//   - callAnthropic calls mGA directly with env.MGA_TOKEN (same pattern as
//     functions/api/extract.js), instead of relaying through /api/extract —
//     this is a trusted server-to-server call, no x-ust-pilot header needed.
//   - The client now sends pageMarkedText already built (page-marking join
//     happens client-side per the background-job plan), so extractWithLLM
//     takes it directly instead of building it from doc.pages.

import {
  EXTRACTION_RULES_MD,
  DERIVATION_RULES_MD,
  SCHEMA_REFERENCE_MD,
  UNIT_CONVERSIONS_MD,
  GOLDEN_EXAMPLE_V2_TXT
} from "./knowledge.js";

const MGA_UPSTREAM = "https://chat.int.bayer.com/anthropic/v1/messages";
const MAX_TOKENS = 64000;
const VALIDATION_MAX_CYCLES = 2;
const REMEDIATION_MAX_CYCLES = 2;
const MAX_CHARS = 150000;
export const JOB_TTL_SECONDS = 7 * 24 * 60 * 60;

const SCHEMA = [
  // Product
  "Reg. #/File Sym",
  "Physical Form",
  "Product Name (PBN)",
  // Site
  "Use",
  "Use Site",
  // Application method
  "App. Target",
  "App. Type",
  "App. Equipment",
  "App. Timing (Site Status)",
  "App. Timing (other)",
  // Rate pattern
  "App Rate (lb ai/A)",
  "A.I. Max Single Rate/App. (lb a.i./A)",
  "Max # Apps/C.C.",
  "A.I. Max Total Rate/C.C. (lb a.i./A)",
  "Max # Apps/Yr.",
  "A.I. Max Total Rate/Yr. (lb a.i./A)",
  "MRI (days)",
  "REI",
  "PHI (days)",
  "PPE",
  "Additional Information",
  "Max No. of CC/yr",
  // Restrictions
  "Geographic Restrictions",
  "Drift Restrictions",
  "Soil Restrictions",
  "On-field Non-target Species Restrictions",
  "Additional Restrictions for Use/Use Site"
];

const NOT_SPECIFIED = "NS";

const KEY_FIELDS = [
  "App Rate (lb ai/A)",
  "App. Target",
  "App. Type",
  "PHI (days)",
  "REI"
];

const COLUMN_DEFINITIONS = {
  "Reg. #/File Sym": "EPA Registration Number (or File Symbol if pending registration).",
  "Physical Form": "Type of formulation — WP, SC, Granular, WDG, etc.",
  "Product Name (PBN)": "Primary Brand Name.",
  "Use": "The crop, crop group, turf, plantscape, seed treatment, etc. this row applies to — e.g. \"SOYBEAN\", \"CITRUS FRUITS (CROP GROUP 10-10)\", \"Turf\". This is a crop/site name, NOT a description of what the product does (do not write things like \"Herbicide - Weed Control\" here — that belongs in App. Target / Additional Information).",
  "Use Site": "Agricultural (Outdoor), Greenhouse (Indoor), Residential (Outdoor), etc.",
  "App. Target": "foliar, soil, seed treatment.",
  "App. Type": "broadcast, banded, soil drench, etc.",
  "App. Equipment": "the application equipment, in the label's own words (e.g. \"aerial\", \"ground\", \"handheld\") — never a paraphrase or a term borrowed from elsewhere in the document.",
  "App. Timing (Site Status)": "pre- or post-(crop) emergent, at-planting, post-transplant, etc.",
  "App. Timing (other)": "specific timing when it's dependent on pest pressure or otherwise not tied to crop emergence, e.g. \"when pests occur\".",
  "App Rate (lb ai/A)": "the actual applied rate, in lb a.i./A — distinct from Max Single Rate.",
  "A.I. Max Single Rate/App. (lb a.i./A)": "maximum single rate of active ingredient for this use/use site.",
  "Max # Apps/C.C.": "maximum number of applications per crop cycle.",
  "A.I. Max Total Rate/C.C. (lb a.i./A)": "maximum total rate of active ingredient per crop cycle.",
  "Max # Apps/Yr.": "maximum number of applications within a 12-month period.",
  "A.I. Max Total Rate/Yr. (lb a.i./A)": "maximum total rate of active ingredient within a 12-month period.",
  "MRI (days)": "minimum retreatment interval, in days.",
  "REI": "restricted entry interval, in hours (not days — do not confuse with PHI).",
  "PHI (days)": "preharvest interval, in days (not hours — do not confuse with REI).",
  "PPE": "personal protective equipment required, copied verbatim from the label's PPE section.",
  "Additional Information": "info relevant to rates not captured in previous columns, plus AI-level annual caps and other required capture that has no other column.",
  "Max No. of CC/yr": "maximum number of crop cycles per 12-month period.",
  "Geographic Restrictions": "e.g. \"Not registered for use in XX\"; \"product only used in lower 48 (CONUS)\"; etc.",
  "Drift Restrictions": "wind speed, boom height, droplet size, buffer distances.",
  "Soil Restrictions": "incorporate into soil, leave on soil surface, minimum incorporation depth, etc.",
  "On-field Non-target Species Restrictions": "typically pollinator protections but other non-target species may apply.",
  "Additional Restrictions for Use/Use Site": "tank-mix prohibitions, adjuvant prohibitions, grazing limits, etc."
};

function blankRow() {
  const row = {};
  SCHEMA.forEach(col => { row[col] = NOT_SPECIFIED; });
  return row;
}

/* Confidence scoring — scored on how much of the schema was matched from the
   label. A use name alone is weak; rates plus intervals plus restrictions is
   strong. Ported byte-for-byte from app/index.html:1799. */
function scoreRow(row) {
  const ignore = new Set(["Use", "Product Name (PBN)", "Reg. #/File Sym", "Physical Form"]);
  const derived = row.__derived || {};
  const counts = c => !ignore.has(c) && !derived[c] && row[c] !== NOT_SPECIFIED;
  const filled = SCHEMA.filter(counts).length;
  const keyHits = KEY_FIELDS.filter(counts).length;
  if (filled >= 8 && keyHits >= 3) return "High";
  if (filled >= 4 && keyHits >= 1) return "Medium";
  return "Low";
}

/** Merges {status:"processing", stage} into the file's KV record. */
export async function reportStage(env, jobId, fileIndex, stage) {
  const key = `job:${jobId}:file:${fileIndex}`;
  const existingText = await env.JOBS.get(key);
  const existing = existingText ? JSON.parse(existingText) : {};
  await env.JOBS.put(
    key,
    JSON.stringify({ ...existing, status: "processing", stage }),
    { expirationTtl: JOB_TTL_SECONDS }
  );
}

function buildRowSchemaTool() {
  const rowProperties = {};
  SCHEMA.forEach(col => {
    rowProperties[col] = { type: "string" };
    if (COLUMN_DEFINITIONS[col]) rowProperties[col].description = COLUMN_DEFINITIONS[col];
  });
  rowProperties["Page"] = {
    type: "string",
    description: "1-based page number this row's use is found on, matching one of the --- PAGE N --- markers in the label text."
  };
  rowProperties["Evidence"] = {
    type: "string",
    description: "A short verbatim phrase copied from the label text, at the cited page, that supports this row (per R-5 — never paraphrased, never from another label)."
  };

  return {
    name: "emit_use_summary_rows",
    description: "Emit one row per use + use site + application method found in the label, per the extraction and derivation rules provided. Also used to emit a corrected row set during validation/remediation — always emit the complete row set, not just the changed rows.",
    input_schema: {
      type: "object",
      properties: {
        rows: {
          type: "array",
          items: {
            type: "object",
            properties: rowProperties,
            required: SCHEMA.concat(["Page"])
          }
        }
      },
      required: ["rows"]
    }
  };
}

function buildValidationReportTool() {
  return {
    name: "emit_validation_report",
    description: "Report the result of validating the current row set against Pass A (completeness) and Pass B (field fidelity). Report only — do not correct rows in this call.",
    input_schema: {
      type: "object",
      properties: {
        pass: { type: "boolean", description: "true only if both Pass A and Pass B found nothing to flag." },
        issues: {
          type: "array",
          items: {
            type: "object",
            properties: {
              row_index: { type: "integer", description: "0-based index into the current row set this issue applies to, or -1 for a missing-row completeness gap." },
              column: { type: "string", description: "Schema column name this issue concerns, or \"(missing row)\" for a completeness gap." },
              issue: { type: "string", description: "What is wrong, and what the label actually states, so it can be corrected." }
            },
            required: ["row_index", "column", "issue"]
          }
        }
      },
      required: ["pass", "issues"]
    }
  };
}

function buildQcReportTool() {
  return {
    name: "emit_qc_report",
    description: "Report the result of an independent QC review across all 5 passes (structural, column-wise plausibility, row-wise verification, completeness, confidence calibration). Report only — do not correct rows in this call.",
    input_schema: {
      type: "object",
      properties: {
        overall: {
          type: "string",
          enum: ["Clean", "Low", "Medium", "High", "Critical"],
          description: "The highest severity defect found across all passes, or Clean if none."
        },
        defects: {
          type: "array",
          items: {
            type: "object",
            properties: {
              row_index: { type: "integer", description: "0-based index into the row set this defect applies to, or -1 for a missing-row gap." },
              column: { type: "string" },
              severity: { type: "string", enum: ["Low", "Medium", "High", "Critical"] },
              issue: { type: "string" }
            },
            required: ["row_index", "column", "severity", "issue"]
          }
        }
      },
      required: ["overall", "defects"]
    }
  };
}

function buildTools() {
  return [buildRowSchemaTool(), buildValidationReportTool(), buildQcReportTool()];
}

function buildSystemBlocks() {
  const text = [
    "You are a meticulous regulatory analyst working with pesticide label text to build and verify a Use Summary Table. Read label text end-to-end. Never invent a value — every cell must trace to the label text you were given, at the page you cite. Apply the rules below exactly as written; they encode past mistakes and required conventions.",
    "",
    "Every row must have exactly these columns. Never leave a cell blank: `NS` = the label is silent on this value, `NA` = the column does not apply to this use.",
    JSON.stringify(SCHEMA),
    "",
    EXTRACTION_RULES_MD,
    "",
    DERIVATION_RULES_MD,
    "",
    SCHEMA_REFERENCE_MD,
    "",
    UNIT_CONVERSIONS_MD,
    "",
    "The following is a small worked example showing the expected shape of a finished table (tab-separated, one row shown). Per R-5, this teaches shape only — never copy its wording or values into an actual extraction; every cell must trace to the label you were given.",
    GOLDEN_EXAMPLE_V2_TXT
  ].join("\n");
  return [{ type: "text", text, cache_control: { type: "ephemeral" } }];
}

function buildDocMessageBlocks(doc, pageMarkedText, stageInstructionText) {
  const blocks = [
    {
      type: "text",
      text: `Label file: ${doc.fileName}\nThe label text below is split into pages marked "--- PAGE N ---". Cite the page each row's use is found on in the "Page" field, and a short verbatim supporting phrase in "Evidence".`
    },
    { type: "text", text: pageMarkedText, cache_control: { type: "ephemeral" } }
  ];
  if (stageInstructionText) blocks.push({ type: "text", text: stageInstructionText });
  return blocks;
}

// mGA (and whatever sits in front of it) occasionally times out or bounces a
// request under load — 524/502/503/429 are all transient, not a real
// rejection of this request, so a short retry clears most of them without
// forcing a full job re-submission. 4xx other than 429 (e.g. 401) is not
// retried — retrying a bad-token error just wastes 3x the time failing.
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504, 524]);
const MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 2000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function callAnthropic(env, messages, systemBlocks, tools, toolChoiceName) {
  const body = JSON.stringify({
    model: "claude-sonnet-5",
    max_tokens: MAX_TOKENS,
    system: systemBlocks,
    messages,
    tools,
    tool_choice: { type: "tool", name: toolChoiceName }
  });

  let response;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    response = await fetch(MGA_UPSTREAM, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${env.MGA_TOKEN}`,
        "anthropic-version": "2023-06-01"
      },
      body
    });
    if (response.ok || !RETRYABLE_STATUS.has(response.status) || attempt === MAX_ATTEMPTS) break;
    console.warn(`mGA request got ${response.status} (attempt ${attempt}/${MAX_ATTEMPTS}) — retrying…`);
    await sleep(RETRY_BASE_DELAY_MS * attempt);
  }

  if (!response.ok) {
    let detail = "";
    try { detail = (await response.json()).error?.message || ""; } catch (_) { /* body wasn't JSON */ }
    throw new Error(`mGA request failed (${response.status})${detail ? `: ${detail}` : ""}`);
  }

  const data = await response.json();
  if (data.stop_reason === "max_tokens") {
    console.warn(`response hit the ${MAX_TOKENS}-token output limit for this turn — output may be truncated.`);
  }
  const toolUse = (data.content || []).find(b => b.type === "tool_use" && b.name === toolChoiceName);
  if (!toolUse) throw new Error(`Model response did not include the expected structured output (${toolChoiceName}).`);
  return { data, toolUse };
}

// Stage 1 — extraction agent: read the label, emit the initial row set.
async function runExtractionTurn(env, jobId, fileIndex, doc, pageMarkedText, systemBlocks, tools) {
  await reportStage(env, jobId, fileIndex, "extraction (stage 1/4)");
  const stageText = "Read the entire label above and emit one row per use + use site + application method, per the rules and schema in the system prompt.";
  const messages = [
    { role: "user", content: buildDocMessageBlocks(doc, pageMarkedText, stageText) }
  ];
  const { data, toolUse } = await callAnthropic(env, messages, systemBlocks, tools, "emit_use_summary_rows");
  messages.push({ role: "assistant", content: data.content });
  return { messages, rawRows: toolUse.input?.rows || [], lastToolUseId: toolUse.id };
}

// Stage 2 — generation → validation → correction loop, run in the same
// conversation as extraction so the model can see its own prior reasoning.
async function runValidationCorrectionLoop(env, jobId, fileIndex, state, systemBlocks, tools) {
  let { messages, rawRows, lastToolUseId } = state;
  for (let cycle = 1; cycle <= VALIDATION_MAX_CYCLES; cycle++) {
    await reportStage(env, jobId, fileIndex, `validating (stage 2/4, cycle ${cycle}/${VALIDATION_MAX_CYCLES})`);
    messages.push({
      role: "user",
      content: [
        { type: "tool_result", tool_use_id: lastToolUseId, content: "Received." },
        {
          type: "text",
          text: "Run Pass A (completeness — every crop/use-site/method variation the label states, R-17/R-21/R-25) and Pass B (field fidelity — App. Type/Timing/Equipment wording, rate ceiling vs. annual cap, PHI/REI, NS vs. NA, per R-18/R-19/R-20/R-23/R-24) against the current rows. Report every issue found; do not correct anything in this call."
        }
      ]
    });
    const val = await callAnthropic(env, messages, systemBlocks, tools, "emit_validation_report");
    messages.push({ role: "assistant", content: val.data.content });
    const report = val.toolUse.input || {};
    const issues = report.issues || [];
    lastToolUseId = val.toolUse.id;
    if (report.pass || issues.length === 0) {
      console.log(`validation cycle ${cycle}: clean.`);
      break;
    }
    console.log(`validation cycle ${cycle}: ${issues.length} issue(s) flagged — correcting…`);
    await reportStage(env, jobId, fileIndex, `correcting (stage 2/4, cycle ${cycle}/${VALIDATION_MAX_CYCLES})`);
    messages.push({
      role: "user",
      content: [
        { type: "tool_result", tool_use_id: lastToolUseId, content: "Received." },
        {
          type: "text",
          text: `Correct the rows to resolve every issue below, then re-emit the complete corrected row set (not just the changed rows):\n${JSON.stringify(issues)}`
        }
      ]
    });
    const corr = await callAnthropic(env, messages, systemBlocks, tools, "emit_use_summary_rows");
    messages.push({ role: "assistant", content: corr.data.content });
    rawRows = corr.toolUse.input?.rows || rawRows;
    lastToolUseId = corr.toolUse.id;
  }
  return { messages, rawRows, lastToolUseId };
}

// Stage 3 — QC agent: a fresh conversation, independent of the extractor's
// own reasoning, auditing the validated row set against the label text.
async function runQcTurn(env, jobId, fileIndex, rawRows, doc, pageMarkedText, systemBlocks, tools) {
  await reportStage(env, jobId, fileIndex, "independent QC review (stage 3/4)");
  const stageText = [
    "You are now acting as an independent QC reviewer — a senior regulatory manager auditing someone else's extraction, not the person who produced it. Run all 5 passes: structural (schema compliance, no blanks), column-wise plausibility, row-wise verification against the label text above, completeness (every crop/use/method the label states, R-17/R-21/R-25), and confidence calibration.",
    "The candidate row set to review (JSON, 0-based indices):",
    JSON.stringify(rawRows)
  ].join("\n");
  const messages = [
    { role: "user", content: buildDocMessageBlocks(doc, pageMarkedText, stageText) }
  ];
  const { data, toolUse } = await callAnthropic(env, messages, systemBlocks, tools, "emit_qc_report");
  messages.push({ role: "assistant", content: data.content });
  return { messages, qcReport: toolUse.input || { overall: "Clean", defects: [] }, lastToolUseId: toolUse.id };
}

// Stage 4 — bounded remediation loop: only engages when QC found Critical/
// High defects, and never blocks — whatever the final QC report says, rows
// and report both flow through to the result written to KV.
async function runRemediationLoop(env, jobId, fileIndex, state, rawRows, systemBlocks, tools) {
  let { messages, qcReport, lastToolUseId } = state;
  let cycle = 0;
  const needsFix = r => r && (r.overall === "Critical" || r.overall === "High");
  while (needsFix(qcReport) && cycle < REMEDIATION_MAX_CYCLES) {
    cycle++;
    await reportStage(env, jobId, fileIndex, `remediating (stage 4/4, cycle ${cycle}/${REMEDIATION_MAX_CYCLES})`);
    console.log(`remediation cycle ${cycle}/${REMEDIATION_MAX_CYCLES}: ${(qcReport.defects || []).length} defect(s) (${qcReport.overall}) — correcting…`);
    messages.push({
      role: "user",
      content: [
        { type: "tool_result", tool_use_id: lastToolUseId, content: "Received." },
        {
          type: "text",
          text: `Correct the rows to resolve every defect below, then re-emit the complete corrected row set (not just the changed rows):\n${JSON.stringify(qcReport.defects || [])}`
        }
      ]
    });
    const corr = await callAnthropic(env, messages, systemBlocks, tools, "emit_use_summary_rows");
    messages.push({ role: "assistant", content: corr.data.content });
    rawRows = corr.toolUse.input?.rows || rawRows;

    await reportStage(env, jobId, fileIndex, `QC recheck (stage 4/4, cycle ${cycle}/${REMEDIATION_MAX_CYCLES})`);
    messages.push({
      role: "user",
      content: [
        { type: "tool_result", tool_use_id: corr.toolUse.id, content: "Received." },
        { type: "text", text: "Re-run the full 5-pass QC review against the corrected rows." }
      ]
    });
    const recheck = await callAnthropic(env, messages, systemBlocks, tools, "emit_qc_report");
    messages.push({ role: "assistant", content: recheck.data.content });
    qcReport = recheck.toolUse.input || qcReport;
    lastToolUseId = recheck.toolUse.id;
  }
  console.log(cycle > 0
    ? `remediation complete after ${cycle} cycle(s) — final QC status: ${qcReport.overall}.`
    : `QC review: ${qcReport.overall}${(qcReport.defects || []).length ? ` (${qcReport.defects.length} defect(s), below remediation threshold)` : " — clean"}.`);
  return { rawRows, qcReport };
}

// R-16 safety net — collapse rows that are outright duplicates across every
// schema column. Applied once, on the final row set, after every pipeline
// stage above has run.
function buildAppRows(rawRows, doc) {
  const rows = rawRows.map(raw => {
    const row = blankRow();
    SCHEMA.forEach(col => {
      const v = raw[col];
      if (v !== undefined && v !== null && String(v).trim() !== "") row[col] = String(v);
    });
    row["Page"] = raw["Page"] ? String(raw["Page"]) : NOT_SPECIFIED;
    row["Source File"] = doc.fileName;
    row.__source = raw["Evidence"] ? String(raw["Evidence"]) : "";
    row.__derived = {};
    row["Confidence"] = scoreRow(row);
    return row;
  });

  const seenRowKeys = new Set();
  const dedupedRows = [];
  let duplicateRowCount = 0;
  rows.forEach(row => {
    const key = SCHEMA.map(col => row[col]).join("␟");
    if (seenRowKeys.has(key)) {
      duplicateRowCount++;
    } else {
      seenRowKeys.add(key);
      dedupedRows.push(row);
    }
  });
  if (duplicateRowCount > 0) {
    console.log(`${doc.fileName}: removed ${duplicateRowCount} duplicate row(s) with identical values across every column (R-16).`);
  }
  dedupedRows.forEach((r, i) => { r.__id = `${doc.fileName}#${i}`; });
  return dedupedRows;
}

// Orchestrator — runs the extraction agent, then the QC agent, mirroring
// app/index.html's extractWithLLM (the in-tab path), adapted to report
// progress into KV instead of a DOM progress bar.
export async function extractWithLLM(env, jobId, fileIndex, doc, pageMarkedText) {
  if (pageMarkedText.length > MAX_CHARS) {
    console.warn(`${doc.fileName} is ${pageMarkedText.length.toLocaleString()} characters — `
      + `above the ~${MAX_CHARS.toLocaleString()}-character single-call guideline; sending the full text anyway (no chunking in v1).`);
  }

  const systemBlocks = buildSystemBlocks();
  const tools = buildTools();

  console.log(`${doc.fileName} — stage 1/4 — extraction…`);
  const extraction = await runExtractionTurn(env, jobId, fileIndex, doc, pageMarkedText, systemBlocks, tools);
  console.log(`${doc.fileName} — ${extraction.rawRows.length} row(s) from initial extraction`);

  console.log(`${doc.fileName} — stage 2/4 — validate & correct (up to ${VALIDATION_MAX_CYCLES} cycle(s))…`);
  const validated = await runValidationCorrectionLoop(env, jobId, fileIndex, extraction, systemBlocks, tools);

  console.log(`${doc.fileName} — stage 3/4 — independent QC review…`);
  const qc = await runQcTurn(env, jobId, fileIndex, validated.rawRows, doc, pageMarkedText, systemBlocks, tools);

  console.log(`${doc.fileName} — stage 4/4 — bounded remediation (up to ${REMEDIATION_MAX_CYCLES} cycle(s))…`);
  const remediated = await runRemediationLoop(env, jobId, fileIndex, qc, validated.rawRows, systemBlocks, tools);

  const rows = buildAppRows(remediated.rawRows, doc);
  return { rows, qcReport: remediated.qcReport };
}
