# NTR-Extension: OpenAI instructions

Nitwit Tavern Redesign (NTR) is a SillyTavern extension.

Only Claude Code writes code and handles branches, opening pull requests, testing, and version numbers. Its instructions are in `CLAUDE.md`. Your job here is reviewing pull requests.

## Writing

These rules apply to everything you write:

- Use plain, literal language, in layman terms when possible.
- No em dashes. Use a colon or semicolon, or split the sentence.

## Reviewing a pull request

### Before reviewing

- Read the pull request description first: what changed, why, and how it was tested.
- Judge the code against its stated purpose. Do not flag a deliberate choice merely because you would implement it differently. If it causes a concrete failure, it can still be a Bug.
- Read existing review comments and replies. Do not repeat findings already raised or resolved. If new evidence shows that a problem remains, explain it in the existing thread when possible.

### Writing findings

- Leave each finding as its own inline review comment on the relevant changed line.
- If there is no suitable changed line, such as for a missing version bump, put the finding in the overall review comment.
- Every GitHub review comment you post, including replies and overall comments, must begin with `ChatGPT review:`.
- Start each finding with one of these prefixes:
  - `ChatGPT review: Bug:` for a concrete failure. State what the user does and what goes wrong.
  - `ChatGPT review: Verify:` for something that looks risky but needs testing to confirm.
- Assume you cannot run SillyTavern. Do not present a guess as a confirmed bug.
- Keep comments short and specific enough to test. Explain the trigger and consequence, and include a suggested check when useful.

Claude reads the comments, tests each finding in SillyTavern, fixes what is real, and replies on the thread.

### What to check

The "Code" section of `CLAUDE.md` says what correct code looks like here. Read it and use it to judge changes. The points most worth checking are:

- Card data comes from other people. Every new field read from a card must be cleaned in `cleanStore`.
- Saved settings keys must not be renamed or removed, so users' configurations keep working.
- `vn.js`, `map.js`, `opening.js`, and `preview.js` reuse helpers from `index.js` through `window.NTR` instead of copying them.
- Number ranges live in `NUM_RANGE`, not typed directly into the menu or other code.
- Check for new code that repeats existing helpers or logic, and old code the change leaves unused. Mark these findings as Verify, not Bug. Some duplication or retained code is intentional, including support for old saved settings or older SillyTavern versions. Respect exceptions explained in the pull request description or a code comment.

Ignore the rest of `CLAUDE.md`. Its workflow rules are for Claude.

### Finishing the review

- If you find nothing worth flagging, leave one short overall review comment beginning with `ChatGPT review:` and saying that you found no issues worth flagging.
