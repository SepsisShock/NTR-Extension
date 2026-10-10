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
- When a feature ships, remove it from `ROADMAP.md` and update the `manifest.json` description.
- For `README.md` and `CLAUDE.md`, show the proposed wording first; commit it only after approval.
- Bump the version in every PR that changes `.js` or `.css`, in all 7 places: `manifest.json`, `index.js`, `vn.js`, `map.js`, `opening.js`, `preview.js`, `regex.js`. Last number for fixes, middle for new features, first only with approval. No bump for docs-only changes.

## Code
- Match existing style and file structure.
- Preserve existing settings keys so users' saved configs keep working.
- `index.js` is the core; `vn.js`, `map.js`, `opening.js`, `preview.js` and `regex.js` use its helpers through `window.NTR`. Reuse them; don't copy them.
- All uploads go through `uploadImage` or `uploadVideo`.
- Number settings in `index.js`: put the range in `NUM_RANGE` as `[min, max, step, unit]`, adding `sliderMin, sliderMax` only when the slider is narrower than the saved limit. Read settings with `rangeNum` and numbers from card data with `cardNum`. Build sliders with `rangeSlider`, or `rangeAttrs` for sliders written out by hand. Don't write the numbers into the menu, `cleanStore` or the code that applies them. `vn.js` and `opening.js` keep their own slider numbers until `NUM_RANGE` is shared through `window.NTR` (see `ROADMAP.md`).
- Global settings live in `extensionSettings.chatvisuals`; per-character data lives in the card under `extensions.ntr`.
- Card data comes from other people. Any new field read from a card must be cleaned in `cleanStore` like the existing ones (ranges, length limits, safe links).

## Writing
- Menu text, hints and PR descriptions: plain language, no em dashes.

## Audience
- I'm the only person using NTR. Judge every change by what works for me, and write replies, plans, PRs, commits and code comments for me alone: no hypothetical users, their setups or moving their saved data.
- Keeping settings keys and cleaning card data (see Code) stay as general practice. Follow them quietly, as code rules, not as talking points. Card data still comes from strangers' cards, so it stays untrusted.
