# NTR-Extension
Nitwit Tavern Redesign (NTR), a SillyTavern extension.

## Workflow
- Ignore `README.md` or `LICENSE*` unless explicitly requested or necessary for the task.
- Work on a new branch per task; open a PR when done.
- For anything beyond a small fix, propose a plan and wait for approval before writing code.
- Keep changes scoped to the task. Ask before deleting or renaming files.
- If a change touches files outside the task's obvious scope, explain why in the PR.
- Summarize every PR: what changed, why, how to test it in SillyTavern.
- When a change touches `.js` or `.css` files, test it with `/run-ntr-extension` before opening the PR, comparing `main` with the branch.

## Docs and Version
- When a feature ships, remove it from `ROADMAP.md`. Update the `manifest.json` description only when a new top-level area ships, and add it in a few words.
- For changes to `.md` or `.json` files, show the proposed wording or diff and get approval before committing those changes.
- Bump the version in every PR that changes `.js` or `.css` with `node scripts/version.cjs bump patch` (or `minor`); the script holds the list of places and CI checks it. Last number for fixes, middle for new features, first only with approval. No bump for docs-only changes.

## Code
- Match existing style and file structure.
- Preserve existing settings keys so my saved config keeps working.
- `index.js` is the core; the other modules use its helpers through `window.NTR`. Reuse them; don't copy them.
- All uploads go through `uploadImage` or `uploadVideo`.
- Elements lives in `elements.js`, built from what core shares in `window.NTR.api.look`; its settings and upload names stay in `index.js`. Give each new part its own bind and CSS functions, like `bindMessageDetails` and `messageDetailsCss`. Rows built with `ovRow`, `rangeSlider`, `ovColor`, `ovText`, `ovFont`, `ovPick` and `ovWhen` are bound on every page by `bindRows`; to add behavior to them, listen on the part, like `syncFade`.
- Text Formatting lives in `text.js` the same way, built from `window.NTR.api.look`; its settings stay in `index.js`.
- Avatar Management lives in `avatars.js` the same way, built from `window.NTR.api.look`. Its settings, `ntrAvatars` and Names and Pictures' CSS stay in `index.js`, and so do the pop-out pictures and Edit Placement; `avatars.js` only writes the pop-outs' size and position CSS.
- UI Decor lives in `decor.js` the same way, built from `window.NTR.api.look`. Its settings stay in `index.js`, and so do Blur and Shadow (`overrideCss`), `joinCss` (Layout's Free send bar uses it too) and `bubblesOn` (Text Formatting and Elements read it). These check `decorOn`, so without `decor.js` they stay SillyTavern's own; anything new the core builds for UI Decor should check it too.
- Number settings in `index.js`: put the range in `NUM_RANGE` as `[min, max, step, unit]`, adding `sliderMin, sliderMax` only when the slider is narrower than the saved limit. Read settings with `rangeNum` and numbers from card data with `cardNum`. Build sliders with `rangeSlider`, or `rangeAttrs` for sliders written out by hand. Don't write the numbers into the menu, `cleanStore` or the code that applies them. `vn.js` and `opening.js` keep their own slider numbers until `NUM_RANGE` is shared through `window.NTR` (see `ROADMAP.md`).
- Global settings live in `extensionSettings.chatvisuals`; per-character data lives in the card under `extensions.ntr`.
- Card data comes from other people and stays untrusted. Any new field read from a card must be cleaned in `cleanStore` like the existing ones (ranges, length limits, safe links).

## Writing
- Everything you write: plain language, no em dashes.
- UI copy is for any NTR user: use concise, general terms, without examples from my presets or cards. Omit helper text and tooltips unless a setting's behavior isn't obvious from its label.

## Audience
- NTR is unreleased, so I'm its only user. Designing for future users is fine, but nobody else has it installed right now: don't plan around other people's current NTR setups.
- Follow the settings-key and card-cleaning rules quietly, as code rules, not as talking points.
