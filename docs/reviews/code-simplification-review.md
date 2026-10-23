# Code Simplification and Overengineering Review

This is an optional, explicitly requested review procedure, separate from the routine Bug and Verify PR review in `AGENTS.md`.

Review the code in [section] for unnecessary complexity and overengineering.

## What to check

- Identify code that could be simplified without compromising performance, readability, maintainability, reliability, or compatibility.
- Identify excessive defensive programming, redundant validations, unnecessary fallbacks, and safeguards against scenarios that are impossible or implausible in the actual execution environment.
- Evaluate whether each precaution addresses a realistic problem, considering its likelihood, consequences, and maintenance cost.
- Review relevant execution paths and surrounding code to identify safeguards or complexity made obsolete by previous refactoring.
- Recommend changes only when there is a meaningful benefit. Do not simplify code merely to reduce line count or remove safeguards solely because their triggering conditions are rare.

Base findings on actual code paths and supported behavior, not hypothetical concerns. Explain the reasoning and tradeoffs for each recommendation, distinguishing unnecessary complexity from justified complexity.

## Workflow

- Present a concise findings report and proposed implementation plan for approval before modifying files.
- Once approved, implement the agreed changes, run relevant tests, commit the changes on a separate branch, and create a pull request.
- Document the changes, reasoning, tests performed, and anything not verified.
- Do not merge the PR without approval.
