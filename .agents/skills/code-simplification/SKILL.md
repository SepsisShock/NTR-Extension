---
name: code-simplification
description: Use when the user explicitly asks for a code simplification review.
---

# Code Simplification Review

Run only when explicitly requested. This is separate from routine PR reviews.

Review the requested code and the code paths it touches for unnecessary complexity and overengineering.

## What to check

- Code that could be simpler without hurting performance, readability, maintainability or reliability.
- Copied code, within a module or across modules, that a shared helper could replace. A short expression made only of built-in calls needs no new helper, but flag it when a helper for it already exists.
- One value or rule kept in two places that can drift apart.
- Work repeated on every call that could run once.
- Checks, fallbacks and guards for cases no caller or SillyTavern produces for any user, not just in the owner's setup, or that another check already covers. Weigh how likely the case is, what happens if it occurs, and the cost of keeping the guard.
- Checks, parameters or return values that no caller uses, often left by earlier refactoring.

Preserve card-data cleaning (`cleanStore`, `cardNum`, safe links), settings upgrades in `loadSettings`, `rangeNum`/`NUM_RANGE` checks, missing-module handling, and checks for SillyTavern features that may be absent. Recommend changes to how they work only when equivalent protection is demonstrated.

Suggest a change only when it gives a meaningful benefit. Fewer lines alone is not enough, and a case being rare is not by itself a reason to remove its guard. Base findings on actual code paths and explain the reasoning and tradeoffs. If nothing qualifies, say so.

## Output

For each finding, say whether behavior changes and which tests need updating. Don't modify files. Claude Code implements approved findings, following `CLAUDE.md`.
