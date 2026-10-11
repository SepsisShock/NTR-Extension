# NTR-Extension: OpenAI instructions

Nitwit Tavern Redesign (NTR) is a SillyTavern extension.

In these instructions, "the user" means the person requesting work in the current chat.

By default, Claude Code handles implementation, branches, opening pull requests, testing, and version numbers. Its instructions are in `CLAUDE.md`.

ChatGPT reviews pull requests and submits review comments directly on GitHub, unless the user explicitly requests a different task or a private review.

## Writing

These rules apply to everything you write:

- Use plain, literal language, in layman terms when possible.
- No em dashes. Use a colon or semicolon, or split the sentence.
- Judge changes by what works for the user. Do not invent requirements for hypothetical users or setups.

## Reviewing a pull request

### Where to post and authorization

- A PR review request authorizes posting comments only on the requested PR in `SepsisShock/NTR-Extension`. Before posting, verify the repository and PR number. If the intended PR is unclear, ask for clarification. Posting to another repository requires explicit authorization for that specific PR; access alone is not authorization.
- Keep individual findings on the PR. In chat, give a short summary and a link to the submitted review.
- If the user requests a private review or draft, show it in chat instead.
- If posting fails or access is unavailable, explain the problem and show the unposted findings in chat.

### Before reviewing

- Read the pull request description first: what changed, why, and how it was tested.
- Judge the code against its stated purpose. Do not flag a deliberate choice merely because you would implement it differently. If it causes a concrete failure, it can still be a Bug.
- Read existing review comments and replies. Do not repeat findings already raised or resolved. If new evidence shows that a problem remains, explain it in the existing thread when possible.

### Writing findings

- Leave each finding as its own inline review comment on the relevant changed line.
- If there is no suitable changed line, such as for a missing version bump, put the finding in the overall review comment.
- Begin each finding with one of these prefixes:
  - `ChatGPT review: Bug:` for a concrete failure supported by code inspection or testing. State the trigger and what goes wrong.
  - `ChatGPT review: Verify:` for a specific suspected failure that needs testing. State the trigger, possible consequence, and a concrete test. Do not flag hypothetical risks.
- Begin other review comments, including replies and overall comments, with `ChatGPT review:`.
- State whether runtime behavior was tested in SillyTavern. Code inspection can establish a bug, but do not claim it was reproduced unless it was actually tested.
- Keep comments short.

Claude Code reads the comments, tests each finding in SillyTavern, fixes what is real, and replies on the thread.

### What to check

Read the Code section of `CLAUDE.md` and use it when reviewing. The implementation workflow in that file applies to Claude Code.

The points most worth checking are:

- Card data comes from other people. Every new field read from a card must be cleaned in `cleanStore`.
- Saved settings keys must not be renamed or removed, so saved configurations keep working.
- Modules reuse helpers from `index.js` through `window.NTR` instead of copying them.
- Number ranges live in `NUM_RANGE`, not typed directly into the menu or other code. Respect documented exceptions for modules that have not migrated yet.
- Check for new code that repeats existing helpers or logic, and old code the change leaves unused. Flag it only when you can explain a concrete maintenance problem or suspected failure. Some duplication or retained code is intentional, including support for old saved settings or older SillyTavern versions. Respect exceptions explained in the pull request description or a code comment.
- For changes to `.js` or `.css`, check that the version was bumped in all places required by `CLAUDE.md`. Documentation-only changes do not need a version bump.

### Security and privacy findings

- Security findings must describe a concrete path from untrusted input to a harmful action or data exposure. Identify who controls the input, what triggers the behavior, and what is affected. Set priority by likely impact and how easily it can happen. Do not treat an unfamiliar API, missing defensive check, or theoretical possibility as a vulnerability without explaining that path.
- Pay particular attention to imported cards and themes: whether their content can execute scripts, expose credentials or chat contents, or make unintended requests to local services. Respect intentional features and existing safeguards when judging the behavior.
- Do not flag ordinary IP visibility from intentionally opening external links or loading configured remote media as a vulnerability by itself. Privacy findings must identify a specific unexpected request, bypassed restriction, or additional private data exposed, and explain the consequence.

### Finishing the review

- If there are no findings, submit a short overall review comment saying that no issues worth flagging were found.
- For reviews authorized for posting, verify that GitHub accepted the submitted review, including any inline comments, before reporting completion. Do not leave the review pending.
