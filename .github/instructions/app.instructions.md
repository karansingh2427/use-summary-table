---
applyTo: "app/**"
---

# Frontend Code Instructions

## Technology Rules
- Use vanilla JavaScript only (no React, Vue, or other frameworks)
- Use modern ES6+ syntax (const, let, arrow functions, template literals)
- Keep all code in single HTML files unless specifically asked to separate

## Styling Rules
- Use CSS variables for colors (define once like `--primary-color: #3B82F6`, use everywhere with `var(--primary-color)`)
- Mobile-first responsive design
- Minimum touch target size: 44x44 pixels

## Code Quality
- Add comments explaining "why", not "what"
- Use meaningful variable names (not x, y, temp)
- Handle errors gracefully with user-friendly messages

## Accessibility
- All interactive elements must be keyboard accessible
- Use semantic HTML (button, nav, main, etc.)
- Include ARIA labels where needed

## Extraction Rules (non-negotiable)

The app produces a regulatory document. These rules override convenience.

### Schema
- `SCHEMA` in `app/index.html` is the single source of truth — 27 columns, fixed order.
  Never reorder, rename, or skip a column. Never hard-code a column name elsewhere.
- Column definitions live in `knowledge/schema-reference.md`, derived from
  `knowledge/UST_definitions.txt`.

### One row = one use + one use site + one application method
A crop with both a foliar and a soil application produces **two rows**, because rates,
intervals, and restrictions differ. Row count is driven by the label, never fixed.

### Anti-hallucination guardrails
The parser MUST NOT:
- ❌ Invent a use, rate, interval, or restriction not stated on the label
- ❌ Fill a gap with a "reasonable" default, an average, or a neighbouring row's value
- ❌ Carry a value across from a golden example, a training log, or another label
- ❌ Substitute an external crop taxonomy for the label's own grouping

The parser MUST:
- ✅ Treat "not explicitly stated" as `NS`, and "does not apply" as `NA`
- ✅ Keep every row traceable — record the page and the source text behind it
- ✅ Preserve crop-group codes and their exceptions verbatim
- ✅ Preserve ranges, conditions, and per-active-ingredient splits without averaging

### Deterministic logic
Rule 5.1 — `Max No. of CC/yr`:
```
IF the label caps rate "per Calendar Year" or "per Year"  -> 1
ELSE IF it caps "per Crop Season" and states seasons/yr    -> that value
ELSE                                                        -> NS
```

### Before changing the parser
Read `knowledge/extraction-rules.md` first. Each of its rules traces to a real logged
mistake; changes that reintroduce one of those mistakes are regressions.
