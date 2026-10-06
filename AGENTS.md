# NTR-Extension: OpenAI instructions

Nitwit Tavern Redesign (NTR) is a SillyTavern extension.

Only Claude Code writes the code and handles branches, opening pull requests, testing and version numbers; its instructions are in `CLAUDE.md`. Your job here is reviewing pull requests.

## Writing (everything you write)
- Plain and literal language, in layman terms when possible.
- No em dashes. Use a colon or semicolon, or split the sentence.

## Reviewing a pull request
- Read the pull request description first: what changed, why, and how it was tested. Judge the code against what it says it's for. Do not flag a deliberate choice merely because you would implement it differently. If it causes a concrete failure, it can still be a Bug.
- Leave each finding as its own review comment on the line it's about. Start the comment with one of:
  - **Bug:** you can name the exact situation that breaks it (what the user does, what goes wrong).
  - **Verify:** something that looks risky but needs testing to confirm. Assume you cannot run SillyTavern, so don't present a guess as a bug.
- Claude reads the comments, tests each one in SillyTavern, fixes what's real and replies on the thread. Keep comments short and specific so they can be tested.
- The "Code" section of `CLAUDE.md` says what correct code looks like here. Use it to judge changes. The points most worth checking:
  - Card data comes from other people: every new field read from a card must be cleaned in `cleanStore`.
  - Saved settings keys must not be renamed or removed, so users' configs keep working.
  - `vn.js`, `map.js` and `opening.js` reuse helpers from `index.js` through `window.NTR` instead of copying them.
  - Number ranges live in `NUM_RANGE`, not typed into the menu or the code.
  - A change to `.js` or `.css` should come with a version bump in all 5 places: `manifest.json`, `index.js`, `vn.js`, `map.js`, `opening.js`.
  - Duplicate or leftover code: new code that repeats a helper or logic that already exists, or old code the change left unused. Mark it as Verify, not Bug. Some is on purpose: code that keeps old saved settings or older SillyTavern versions working, and exceptions explained in the pull request description or a code comment.
- Ignore the rest of `CLAUDE.md`: its workflow rules are for Claude.
- If you find nothing worth flagging, leave one short overall review comment saying so.
