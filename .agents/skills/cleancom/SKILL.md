---
name: cleancom
description: Review code for outdated comments, misleading names, stale references, and initialization or cleanup problems. Use when the user asks for cleancom or the four-point cleanup review.
---

# cleancom

Check for...

1. Outdated comments describing code that has moved or changed
2. Misspelled identifiers, misleading names, inconsistent terminology
3. Imports, functions, paths, and event handlers that still point to old locations
4. Incorrect loading order, duplicate initialization, forgotten cleanup

## Review workflow

- Use the PR, files, or changes identified by the user. If no target is established in the conversation, ask which code to review.
- Read the applicable AGENTS.md and CLAUDE.md instructions, the PR description, and existing review comments before reviewing.
- Inspect the changes and related definitions, callers, event registration, and cleanup code. Verify references against the current code.
- Report concrete mismatches with a file location and the correction needed. Do not invent findings or repeat issues already raised or resolved.
- Follow AGENTS.md for posting, finding prefixes, and reporting validation. State whether runtime behavior was tested.
- This is a review. Do not edit source code unless the user also asks for fixes.

Example request: "Run cleancom on PR 354."
