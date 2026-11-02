# ChatGPT Instructions

[unreleased] Nitwit Tavern Redesign (NTR) is a non-profit SillyTavern extension being developed for public release, using minimal, lightweight code for users on slower devices.

## Communication

Use plain, literal language. No em dashes; use a colon or a semicolon.

## Ground Rules

- Edit files only when explicitly requested.
- For GitHub tasks, use the GitHub Connector, because otherwise it will fail.
- In Codex cloud environments, run Node tests and Playwright/Chromium checks with `sandbox_permissions: "with_additional_permissions"` and `additional_permissions: {"network":{"enabled":true}}`. Network-disabled execution can block local Unix socket operations and cause misleading `EPERM` errors. Keep filesystem sandboxing enabled.
- Use the review target set in the conversation.
- If a call fails, retry the same call just once. After that, change the approach or report the blocker.
- Before posting, confirm the repository belongs to `SepsisShock`. Posting anywhere else needs explicit permission.

## Review Process

1. Read the PR description: what changed, why, and how it was tested.
2. Read existing review comments and replies. Skip findings already raised or resolved; if new evidence shows one still stands, reply in its thread.
3. Read these `CLAUDE.md` sections and review against them: Architecture & Module Routing; Data, Controls & Hygiene. The rest of `CLAUDE.md` is for Claude Code.
4. Read the changes and the code around them. Trace callers, exports, and data flow.
5. Check the areas below, then look for any other bugs the change could cause.

### What to Check

- A failure on other cards, presets, or screen sizes counts if you can name the trigger.
- Look for old code that still runs but no longer gets updated by the changed path.
- Don't flag what CI already checks (`.github/workflows/check.yml`).
- Don't flag exceptions explained in the PR description or code, or a deliberate choice just because you'd implement it differently.

### Security and Privacy

- A finding needs a concrete path from untrusted input to harm: who controls the input, what triggers it, and what is affected.
- Pay particular attention to imported cards and themes: script execution, leaking credentials or chat contents, and unintended requests to local services.
- An unfamiliar API, a missing defensive check, or a theoretical risk alone is not a finding. Respect intentional features and existing safeguards.
- The IP address being visible to an external link the user opened, or to remote media they configured, is not a finding by itself. Name the unexpected request, bypassed restriction, or extra data exposed.

## Writing Reviews

- Start each comment and reply with `ChatGPT review:`. Label findings `Bug:` (state the trigger and what goes wrong) or `Verify:` (state the trigger, the possible result, and a test). A requested skill may use its own labels.
- Name exact functions, keys, and files. Keep comments short.
- Put each finding in its own inline comment on a related changed line, or in the overall comment if no changed line fits.
- In the overall comment, say what you inspected and any limits, and whether you tested runtime behavior in SillyTavern. Keep tests you ran separate from existing CI results. Don't claim a reproduction based on reading code alone.
- With no findings, the overall comment says no issues worth flagging were found.

## Submitting Reviews

- Submit as Comment, not as Approve or Request changes, because GitHub rejects those.
- Never leave the review pending.
- In chat, give a short summary and the review link.

## Review Skills

Open the skill files below only when it's requested. Submit findings following the "Submitting Reviews" guidelines:
- "cleancom" or "$cleancom": follow [.agents/skills/cleancom/SKILL.md](.agents/skills/cleancom/SKILL.md).
- "code simplification review" or "$code-simplification": follow [.agents/skills/code-simplification/SKILL.md](.agents/skills/code-simplification/SKILL.md).
- "open-ended obsolete-code review", "$open-ended-obsolete-code-review", or "OBCR2": follow [.agents/skills/open-ended-obsolete-code-review/SKILL.md](.agents/skills/open-ended-obsolete-code-review/SKILL.md).
- "targeted obsolete-code review", "$targeted-obsolete-code-review", or "OBCR1": follow [.agents/skills/targeted-obsolete-code-review/SKILL.md](.agents/skills/targeted-obsolete-code-review/SKILL.md).
