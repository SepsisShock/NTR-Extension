---
name: code-simplification
description: Use when the user explicitly asks for a code simplification review.
---

# Code Simplification Review

Look for a simpler way to achieve the same result. Challenge existing and
new complexity: what concrete benefit justifies it over a simpler approach?
Any proposed simplification must preserve existing behavior, including side
effects and error handling.

Look for:

1. Unnecessary branches, nesting, state, or indirection
2. Duplicated logic that could use an existing helper or a small local helper
3. Unused code left behind by the change
4. Simpler approaches that accomplish the same job with fewer concepts
