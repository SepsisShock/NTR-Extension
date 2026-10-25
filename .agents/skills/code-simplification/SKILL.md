---
name: code-simplification
description: Review code for unnecessary complexity, duplicated logic, and behavior-preserving simplifications. Use when the user asks for a code simplification review.
---

# Code simplification review

Review the requested code for:

1. Unnecessary branches, nesting, state, or indirection
2. Duplicated logic that can use an existing helper or a small local helper
3. Unused code left behind by the change
4. Clearer ways to express the same behavior with less code or fewer concepts

## Review workflow

- Use the PR, files, or changes identified by the user. If no target is established in the conversation, ask which code to review.
- Read the applicable AGENTS.md and CLAUDE.md instructions, the PR description, and existing review comments before reviewing.
- Understand the current behavior and inspect callers before proposing a simplification. Keep settings upgrades, input cleaning, supported-version checks, and intentional exceptions.
- Recommend only changes with a concrete benefit. Give the file location, proposed simplification, and why it preserves behavior. Do not add abstractions merely to shorten a few lines.
- Keep bug fixes separate from behavior-preserving suggestions. Do not repeat existing review findings. If no useful simplification exists, say so.
- Follow AGENTS.md for posting, finding prefixes, and reporting validation. Do not claim suggestions were tested unless they were.
- This is a review. Do not refactor source code unless the user also asks for implementation.

Example request: "Perform the code simplification review on PR 354."
