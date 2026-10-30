---
name: code-simplification
description: Use when the user explicitly asks for a code simplification review.
---

Review the requested code and the code paths it touches for unnecessary complexity and overengineering.

## What to check

- Code that could be simpler without hurting performance or reliability.
- Helpers, layers or general systems that serve only one case, or cases that don't exist yet.
- Repeated logic or operation sequences, within a module or across modules, that a shared helper could replace. A short expression made only of built-in calls needs no new helper, but flag it when a helper for it already exists.
- One value or rule kept in two places that can drift apart.
- Work repeated on every call that could run once.
- Checks, fallbacks and guards for cases no caller or SillyTavern produces for any user, not just in the owner's setup, or that another check already covers. Weigh how likely the case is, what happens if it occurs, and the cost of keeping the guard.
- Checks, parameters or return values that no caller uses, often left by earlier refactoring.
- Tests that repeat another test's check, or check nothing users would notice.

Preserve what `CLAUDE.md`'s Dead Code & Guards says to always keep. Recommend changes to how those work only when equivalent protection is demonstrated.

Suggest a change only when it gives a meaningful benefit. Base findings on actual code paths and explain the reasoning and tradeoffs. If nothing qualifies, say so.

## Output

For each finding, say whether behavior changes and if tests need updating.
