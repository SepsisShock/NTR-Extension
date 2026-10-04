# NTR-Extension
SillyTavern extension.

## Workflow
- Work on a new branch per task; open a PR when done.
- For anything beyond a small fix, propose a plan and wait for approval before writing code.
- Keep changes scoped to the task. Ask before deleting or renaming files.
- If a change touches files outside the task's obvious scope, explain why in the PR.
- Summarize every PR in plain language: what changed, why, how to test it in SillyTavern.
- When a change touches `.js` or `.css` files, test it with `/run-ntr-extension` before opening the PR, comparing `main` with the branch.

## Docs and version
- When a feature ships, tick it in `ROADMAP.md` and move it to Done, and update the `manifest.json` description.
- For `README.md` and `CLAUDE.md`, show the proposed wording first; commit it only after approval.
- Bump the version in every PR that changes `.js` or `.css`, in all 5 places: `manifest.json`, `index.js`, `vn.js`, `map.js`, `opening.js`. Last number for fixes, middle for new features, first only with approval. No bump for docs-only changes.

## Code
- Match existing style and file structure.
- Preserve existing settings keys so users' saved configs keep working.
- `index.js` is the core; `vn.js`, `map.js` and `opening.js` use its helpers through `window.NTR`. Reuse them; don't copy them.
- All uploads go through `uploadImage` or `uploadVideo`.
- Global settings live in `extensionSettings.chatvisuals`; per-character data lives in the card under `extensions.ntr`.
- Card data comes from other people. Any new field read from a card must be cleaned in `cleanStore` like the existing ones (ranges, length limits, safe links).

## Writing
- Menu text, hints and PR descriptions: plain language, no em dashes.
