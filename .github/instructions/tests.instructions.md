---
applyTo: "tests/**"
---

# Test File Instructions

## Naming Conventions
- Test files: [feature].test.html or [feature].test.js
- Test names: should_[expected behavior]_when_[condition]

## Test Structure
- Arrange: Set up the test conditions
- Act: Perform the action being tested
- Assert: Verify the expected outcome

## Coverage Requirements
- Every requirement in specs/PRD.md needs at least one test
- Test both success and failure cases
- Test edge cases (empty data, maximum values, etc.)

## Manual Test Format
If creating manual test checklists:
- [ ] Test name
  - Steps: numbered list of actions
  - Expected: what should happen
  - Actual: (filled in during testing)
