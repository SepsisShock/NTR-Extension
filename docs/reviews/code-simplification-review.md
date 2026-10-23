# Code Simplification Review

Run only when explicitly requested. This is separate from routine PR reviews.

Review the requested code and the code paths it touches for unnecessary complexity and overengineering.

## What to check

- Code that could be simpler without compromising performance, readability, maintainability, reliability, or compatibility.
- Excessive checks, fallbacks, and guards against impossible or implausible scenarios in SillyTavern. Consider how likely each scenario is, what happens if it occurs, and the maintenance cost of the safeguard.
- Guards or complexity made obsolete by earlier refactoring.

Preserve the protections provided by card-data cleaning (`cleanStore`, `cardNum`, safe links), saved-settings compatibility, and `rangeNum`/`NUM_RANGE` checks. Recommend changes to their implementation only when equivalent protection is demonstrated.

Suggest changes only when they provide a meaningful benefit. Reducing line count alone is not sufficient, nor is a rare triggering condition. Base findings on actual code paths and explain the reasoning and tradeoffs.

## Output

Present a concise findings report with a proposed implementation plan. Do not modify files during this review. Implementation requires separate approval and follows the Workflow in `CLAUDE.md`.
