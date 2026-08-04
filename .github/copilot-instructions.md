# Copilot Instructions — Use Summary Table Extractor

## 1 · Project Overview

This is a **Use Summary Table Extractor** prototype: a single-page web app that reads pesticide
label PDFs and extracts every crop and every use into a schema-compliant table, viewable on
screen and downloadable as `.xlsx`.

| Where | What |
|---|---|
| `specs/PRD.md` | Requirements (R1–R17) — the source of truth for scope |
| `specs/Tasks.md` | Task checklist with "Satisfies" and "Done when" lines |
| `specs/Demo.md` | Five-minute walkthrough script for showing the prototype |
| `app/index.html` | The entire web app — HTML, CSS, and JS in one file |
| `tests/manual-checklist.md` | Hand-run tests, one or more per requirement |
| `tests/test-plan.md` | Numbered test plan with requirement traceability |
| `samples/` | Test label PDFs and hand-checked expected output |
| `knowledge/` | Reference material for building/checking tables — see its README for priority order |
| `docs/USER-GUIDE.md` | Plain-language guide for end users |

The app runs by opening `app/index.html` directly in a browser. No build step, no server.

**`knowledge/` is reference material only.** It is never loaded by the app at runtime, and
nothing in it supplies facts about a product — only the source label PDF does that.

## 2 · Adaptive Model Selection

The project uses **intelligent model selection** that adapts based on task complexity and model
capabilities. Models are selected dynamically to match task requirements.

### Model Capability Matrix

| Model | Regulatory Text | Pattern Recognition | Multi-Step Reasoning | Code Review | Speed | Cost |
|-------|---|---|---|---|---|---|
| **Claude Sonnet 4.5** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | Fast | Standard |
| **Claude Opus** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | Slower | Higher |
| **GPT-4** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | Fast | Higher |
| **GPT-4o** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | Faster | Standard |

### Task Complexity Assessment

When selecting a model, evaluate **task complexity** using these factors:

| Factor | Low | Medium | High |
|--------|-----|--------|------|
| **Text Volume** | <10 pages | 10–50 pages | >50 pages |
| **Field Count** | <10 | 10–25 | >25 |
| **Ambiguity** | Clear wording | Some synonyms/variants | Heavy ambiguity/contradictions |
| **Reasoning Steps** | 1–2 | 3–5 | >5 |
| **Regulatory Complexity** | Standard rates | Tiered/conditional rates | Multiple conditions, edge cases |

**Task Complexity Score** = (sum of complexity levels) ÷ (number of factors)

- **Low** (score 1–1.5) → Use speed-optimized model (Sonnet 4.5, GPT-4o)
- **Medium** (score 1.5–2.5) → Use balanced model (Sonnet 4.5, GPT-4)
- **High** (score 2.5–3) → Use capability-optimized model (Opus, GPT-4)

### Model Selection by Agent

Each agent uses **ranked preference chains** that adapt to complexity:

#### **extraction-main-agent** (PDF Parsing & Field Extraction)
- **Low complexity**: Claude Sonnet 4.5 (fast, accurate for standard labels)
- **Medium complexity**: Claude Sonnet 4.5 → Claude Opus (escalate if pattern matching fails)
- **High complexity**: Claude Opus → Claude Sonnet 4.5 (prefer depth, fallback for speed)

**Why**: Regulatory text parsing + structured extraction needs pattern recognition.
Sonnet 4.5 handles most labels; Opus for edge cases (contradictions, rare formats).

#### **QC-agent** (Accuracy Verification)
- **Low complexity**: Claude Sonnet 4.5 (spot-check mode)
- **Medium complexity**: Claude Sonnet 4.5 → Claude Opus (escalate for detailed validation)
- **High complexity**: Claude Opus (full audit with cross-field verification)

**Why**: QC requires consistency checking across 27 fields. Opus better at multi-field reasoning.

#### **review-agent** (Code Review)
- **Low complexity**: GPT-4o (syntax, style)
- **Medium complexity**: Claude Sonnet 4.5 → GPT-4 (pattern detection, logic review)
- **High complexity**: GPT-4 → Claude Opus (architectural review, security reasoning)

**Why**: Code review needs strong pattern recognition. GPT-4 excels; Opus for edge cases.

#### **test-agent** (Test Design & QA)
- **Low complexity**: Claude Sonnet 4.5 (standard test cases)
- **Medium complexity**: Claude Sonnet 4.5 → Claude Opus (edge case generation)
- **High complexity**: Claude Opus (exhaustive scenario planning)

**Why**: Test design benefits from depth reasoning for edge cases and boundary conditions.

#### **orchestrator-agent** (Workflow Coordination)
- All complexity: Claude Sonnet 4.5 → Claude Opus (orchestration rarely needs Opus, but available)

**Why**: Orchestration is routing, not reasoning-heavy. Sonnet 4.5 sufficient.

#### **docs-agent** (Documentation)
- **Low complexity**: Claude Sonnet 4.5 (user guides, standard docs)
- **High complexity**: Claude Sonnet 4.5 → Claude Opus (complex technical explanations)

**Why**: Docs rarely need reasoning depth; Sonnet 4.5 covers most needs.

### Adding New Models

To add a new model (e.g., Claude 5, Grok, Gemini) to the selection system, see [ADD-NEW-MODELS.md](./ADD-NEW-MODELS.md)
for the complete step-by-step process.

Quick summary:
1. Benchmark the new model on your extraction/QC tasks
2. Update the Capability Matrix (above) with its strengths
3. Rank it in each agent's `model:` array based on performance
4. Update decision trees to position it in the complexity-based chains
5. Test with a sample task, then commit

The system is designed to be **flexible and extensible** — adding a new model is as simple as
updating configuration files and testing.

### Escalation Triggers

An agent automatically escalates to the next model if:
- Current model signals uncertainty or ambiguity in the task
- Pattern extraction returns <70% field fill rate
- Task requires multi-field cross-validation (QC agent)
- Contradictions are detected in source text

### Using the Model Selector (Optional)

If you're unsure which agent or model to use for a task, run the **model selector**:

```
@model-selector
I have 3 pesticide labels (30 pages total) with complex tiered rates and
geographic restrictions. The extraction has been hit-or-miss. Should I
use a particular model for QC?
```

The model selector will:
1. Assess your task complexity (using the 5-factor rubric above)
2. Recommend specific models ranked by suitability
3. Explain the reasoning

Then invoke the recommended agent. The agent will use the recommended model(s) automatically.

## 3 · How to Make Changes

- **Check `specs/PRD.md` first.** Confirm the change maps to an existing requirement.
- **Work one task at a time.** Small, self-contained edits — not sweeping rewrites.
- **Update `specs/Tasks.md`** when work is finished: change `[ ]` to `[x]`, and add a short
  note if the outcome differs from the "Done when" line.
- **Test by opening `app/index.html` in a browser**, uploading a sample PDF, and clicking
  **Run Extraction**. Confirm the table renders and the Excel download works.
- **Keep the schema centralized.** `SCHEMA` in `app/index.html` is the single source of truth
  for columns; never hard-code column names elsewhere.

## 4 · Do NOT Do These Things

- ❌ No backend server or database — everything stays client-side.
- ❌ No login, authentication, or user accounts.
- ❌ No external services or third-party APIs.
- ❌ No secret keys, API keys, tokens, or passwords in the code.
- ❌ No frameworks like React, Vue, Angular, or Svelte — plain HTML/CSS/JS only.
  (PDF.js and SheetJS via CDN are the only permitted libraries.)
- ❌ No changes that aren't traceable to a requirement in `specs/PRD.md`.

## 5 · When Asked to Add a New Feature

1. **Ask first:** should this be added to `specs/PRD.md` as a new requirement?
2. **Add a task** to `specs/Tasks.md` with a `Satisfies:` line and a `Done when:` line.
3. **Implement** it following the normal process in Section 2, then mark the task complete.

Never skip straight to implementation for work that isn't already in the specs.
