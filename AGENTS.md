# NTR-Extension: ChatGPT reviewer instructions

Nitwit Tavern Redesign (NTR) is a SillyTavern extension.

By default, Claude Code handles implementation, branches, opening pull requests, testing, and version numbers. Its instructions are in `CLAUDE.md`.

ChatGPT reviews pull requests and submits review comments directly on GitHub, unless the user explicitly requests a different task.

## Review skills

- When the user says "cleancom", "$cleancom", or requests the four-point cleanup review, read and follow [.agents/skills/cleancom/SKILL.md](.agents/skills/cleancom/SKILL.md).
- When the user asks for a "code simplification review" or "$code-simplification", read and follow [.agents/skills/code-simplification/SKILL.md](.agents/skills/code-simplification/SKILL.md).
- These are review requests, not instructions to edit source code. Use the review target established in the conversation.
- For these explicitly requested reviews, concrete comment/naming cleanup and behavior-preserving simplification suggestions are allowed in addition to Bug or Verify findings. Prefix them with `ChatGPT review: Cleanup:` or `ChatGPT review: Simplification:`, respectively. The Bug/Verify-only rule below still applies to ordinary PR reviews.
- Follow the existing rules for where to post, avoiding duplicate findings, and reporting validation.

## Writing

- Use plain, literal language. In PR comments, name exact functions, keys, and files; in chat, explain in layman terms.
- No em dashes. Use a colon or semicolon, or split the sentence.

## Reviewing a pull request

### Where to post and authorization

- Post only on the requested PR in `SepsisShock/NTR-Extension`. Verify the repository and PR number first; if the intended PR is unclear, ask. Posting anywhere else requires explicit authorization for that specific PR; access alone is not authorization.
- Keep individual findings on the PR. In chat, give a short summary and a link to the submitted review.
- If the user requests a private review or draft, show it in chat instead.
- If posting fails or access is unavailable, stop and explain the problem and show the unposted findings in chat.

### Before reviewing

- Read the pull request description first: what changed, why, and how it was tested.
- Judge the code against its stated purpose. NTR is built for release, so a failure with other cards, presets or screen sizes counts when you can name the trigger. Do not ask for compatibility with other people's existing saved settings, or flag a deliberate choice merely because you would implement it differently.
- Read existing review comments and replies. Do not repeat findings already raised or resolved. If new evidence shows that a problem remains, explain it in the existing thread when possible.

### Writing findings

- Post only Bug or Verify findings; skip style and preference suggestions.
- Leave each finding as its own inline review comment on the relevant changed line.
- If there is no suitable changed line, such as for a missing version bump, put the finding in the overall review comment.
- Begin each finding with one of these prefixes:
  - `ChatGPT review: Bug:` for a concrete failure supported by code inspection or testing. State the trigger and what goes wrong.
  - `ChatGPT review: Verify:` for a specific suspected failure that needs testing. State the trigger, possible consequence, and a concrete test.
- Begin other review comments, including replies and overall comments, with `ChatGPT review:`.
- In the overall review comment, state whether runtime behavior was tested in SillyTavern. Code inspection can establish a bug, but do not claim it was reproduced unless it was actually tested.
- Keep comments concise.

### What to check

Read the Architecture & Module Routing and Data, Controls & Hygiene sections of `CLAUDE.md` and use them when reviewing. The implementation workflow in that file applies to Claude Code.

Pay particular attention to:

- Card data comes from other people. Every new field read from a card must be cleaned in `cleanStore`.
- Saved settings keys are kept, or renamed or removed with an upgrade in `loadSettings`.
- Modules reuse helpers from `index.js` through `window.NTR` instead of copying them.
- Number ranges live in `NUM_RANGE`, not typed directly into the menu or other code. Respect documented exceptions for modules that have not migrated yet.
- Flag repeated helpers or logic when the copies could drift apart and give different results, and old code the change no longer updates but that still runs. Don't flag code `CLAUDE.md` always keeps (`loadSettings` upgrades, `cleanStore` checks, `NUM_RANGE` checks, missing-module handling, checks for optional SillyTavern features), or other exceptions explained in the PR description or a code comment.
- For `.js` or `.css` changes, check the bump level: last number for fixes, middle for new features, first only when the PR description states approval. Judge the bump for the whole PR against `main`. A PR bumps once, so fix commits pushed later don't bump again. CI checks that the bump happened everywhere. Docs-only changes need no bump.

After the checklist, look for any other bugs the change could cause, including ones outside the listed areas. The same evidence standards apply.

### Security and privacy findings

- Security findings must describe a concrete path from untrusted input to a harmful action or data exposure. Identify who controls the input, what triggers the behavior, and what is affected. Set priority by likely impact and how easily it can happen. Do not treat an unfamiliar API, missing defensive check, or theoretical possibility as a vulnerability without explaining that path.
- Pay particular attention to imported cards and themes: whether their content can execute scripts, expose credentials or chat contents, or make unintended requests to local services. Respect intentional features and existing safeguards when judging the behavior.
- Do not flag ordinary IP visibility from intentionally opening external links or loading configured remote media as a vulnerability by itself. Privacy findings must identify a specific unexpected request, bypassed restriction, or additional private data exposed, and explain the consequence.

### Finishing the review

- If there are no findings, submit a short overall review comment saying that no issues worth flagging were found.
- For reviews authorized for posting, verify that GitHub accepted the submitted review, including any inline comments, before reporting completion. Do not leave the review pending.
