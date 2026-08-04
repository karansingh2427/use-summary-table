# Adding New Models to the Adaptive Selection System

This document explains how to add a new model to the adaptive model selection system.

## When to Add a New Model

Add a new model when:
- A new model launches that's better at one of your tasks (extraction, QC, code review, testing, docs)
- Your team has access to a new provider (e.g., Grok, Gemini, Claude 5)
- Benchmarking shows a new model outperforms existing ones for your use case

## Adding a New Model: Step-by-Step

### 1. Determine the Model's Strengths

Benchmark the new model on these dimensions:
- **Regulatory text parsing**: How well does it understand complex pesticide label wording?
- **Pattern recognition**: Can it extract structured data from unstructured text?
- **Multi-step reasoning**: Can it follow 5+ step workflows reliably?
- **Code review**: Does it catch bugs and security issues?
- **Speed**: How fast is it compared to Claude Sonnet 4.5?
- **Cost**: Per-token pricing vs. existing models

Create a row in the Model Capability Matrix.

### 2. Update the Capability Matrix

Edit `.github/copilot-instructions.md` section "Model Capability Matrix":

```markdown
| **New Model** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | Fast | Lower |
```

Fill in each column based on your benchmarking.

### 3. Update Agent Model Arrays

For each agent that could benefit from the new model, edit `.github/agents/*.agent.md`
and add the model to the `model:` array in ranked order.

**Example: extraction-main-agent**

```yaml
# OLD
model: ["Claude Sonnet 4.5 (copilot)", "Claude Opus (copilot)", "GPT-4 (copilot)"]

# NEW (if Grok is better at regulatory text)
model: ["Grok (copilot)", "Claude Sonnet 4.5 (copilot)", "Claude Opus (copilot)", "GPT-4 (copilot)"]
```

Rank by suitability: best first, fallbacks after.

**Affected agents**:
- `extraction-main-agent` (if good at regulatory text + pattern recognition)
- `QC-agent` (if good at accuracy verification + multi-field reasoning)
- `orchestrator-agent` (if good at workflow coordination)
- `review-agent` (if good at code review)
- `test-agent` (if good at test design + edge cases)
- `docs-agent` (if good at technical writing)

### 4. Update Decision Trees in Instructions

Edit `.github/copilot-instructions.md` section "Model Selection by Agent".

For each agent, update the complexity-based decision tree:

**Example**:
```markdown
#### **extraction-main-agent** (PDF Parsing & Field Extraction)
- **Low complexity**: Grok (fast, very accurate for regulatory text) / Claude Sonnet 4.5 (fallback)
- **Medium complexity**: Claude Sonnet 4.5 → Claude Opus (escalate if pattern matching fails)
- **High complexity**: Claude Opus → Grok (prefer depth, fallback for speed)
```

### 5. Test with a Known Task

Before committing:
1. Invoke the agent with the new model configured
2. Run it on a medium-complexity extraction task (5–10 labels)
3. Verify it produces correct output
4. Measure speed and cost
5. Document any gotchas or quirks

### 6. Commit and Document

```bash
git add .github/copilot-instructions.md .github/agents/*.agent.md .github/prompts/
git commit -m "Add [Model Name] to adaptive model selection

Benchmarked [Model Name] against extraction, QC, and code review tasks.
Strengths: [list strengths]
Recommended for: [agents]

Model array updates:
- extraction-main-agent: now [Model Name] → [order]
- QC-agent: now [Model Name] → [order]
- review-agent: now [Model Name] → [order]

Decision trees updated in copilot-instructions.md for complexity-based
routing. Low/Medium/High complexity thresholds recalibrated based on
[Model Name]'s speed and cost profile."
```

## Example: Adding Claude 5

Assume Claude 5 launches with:
- Regulatory text: ⭐⭐⭐⭐⭐ (best ever)
- Pattern recognition: ⭐⭐⭐⭐⭐
- Multi-step reasoning: ⭐⭐⭐⭐⭐
- Speed: Slower than Sonnet 4.5
- Cost: Premium

**Changes**:

1. Update capability matrix (add Claude 5 with ⭐⭐⭐⭐⭐ across all dimensions)
2. Update agent model arrays:
   - `extraction-main-agent`: ["Claude 5 (copilot)", "Claude Sonnet 4.5 (copilot)", "Claude Opus (copilot)"]
   - `QC-agent`: ["Claude 5 (copilot)", "Claude Opus (copilot)", "Claude Sonnet 4.5 (copilot)"]
   - `test-agent`: ["Claude 5 (copilot)", "Claude Opus (copilot)", "Claude Sonnet 4.5 (copilot)"]
   - `docs-agent`: ["Claude Sonnet 4.5 (copilot)", "Claude 5 (copilot)"] (prefer speed, fallback to depth)
3. Update decision trees:
   - Low complexity: Claude Sonnet 4.5 (speed)
   - Medium complexity: Claude Sonnet 4.5 → Claude 5 (escalate for edge cases)
   - High complexity: Claude 5 → Claude Opus (prefer ultimate depth, fallback if cost-prohibitive)

## When to Remove a Model

Remove a model if:
- It underperforms significantly vs. available alternatives
- Cost becomes prohibitive
- Provider discontinues support
- A better model replaces it entirely

Process: Remove from all agent model arrays, update decision trees, commit with rationale.

## Monitoring & Iteration

Over time:
- Track model performance metrics per agent
- Benchmark new models as they release
- Adjust rankings based on real-world usage
- Document lessons learned in `benchmark/` (if evaluating locally)
- Share performance data with the team

This keeps the system adaptive and responsive to the evolving model ecosystem.
