# NTR-Extension
Nitwit Tavern Redesign (NTR), a SillyTavern extension.

## Workflow
- Ignore `README.md` or `LICENSE*` unless explicitly requested or necessary for the task.
- Work on a new branch per task; open a PR when done.
- For anything beyond a small fix, propose a plan and wait for approval before writing code.
- Keep changes scoped to the task. Ask before deleting or renaming files.
- If a change touches files outside the task's obvious scope, explain why in the PR.
- Summarize every PR: what changed, why, how to test it in SillyTavern. If `index.js` grew by more than 100 lines (`git diff --numstat origin/main -- index.js`), say why that code stays in core; move it only if a rule below puts it elsewhere.
- When a change touches `.js` or `.css` files, test it with `/run-ntr-extension` before opening the PR, comparing `main` with the branch:
  - Run scenarios `H`, `K` and those whose names in `scenarios.cjs` cover the changed code, plus driver commands for changed parts no scenario covers.
  - Run every scenario when module loading in `index.js`, a `window.NTR.api` helper several modules call, or `style.css` changes.
  - Ignore the version bump's edits when choosing. Skip the run only when no changed code can run differently, such as JS comments outside strings.
  - Say in the PR what was run, or why nothing was.

## Docs and Version
- When a feature ships, remove it from `ROADMAP.md`. Update the `manifest.json` description only when a new top-level area ships, and add it in a few words.
- For changes to `.md` or `.json` files, show the proposed wording or diff and get approval before committing those changes.
- If a `CLAUDE.md` line is wrong, out of date or one you had to work around, say so in the plan or PR summary with proposed wording.
- Bump the version in every PR that changes `.js` or `.css` with `node scripts/version.cjs bump patch` (or `minor`); the script holds the list of places and CI checks it. Last number for fixes, middle for new features, first only with approval. No bump for docs-only changes.

## Code
- Match existing style and file structure.
- Keep existing settings keys, or upgrade them in `loadSettings`.
- `index.js` is the core; the other modules use its helpers through `window.NTR`.
- Don't copy code, within a module or across modules: search for a helper first, or write one. A helper several modules need is shared through `window.NTR`.
- Skip guards and fallbacks for cases no caller or SillyTavern produces, or that another check covers. When a change leaves a check, parameter or return value unused, remove it. Keep card cleaning, settings upgrades, `NUM_RANGE` checks, missing-module handling and checks for SillyTavern features that may be absent.
- Settings data stays in `index.js`: keys, `DEFAULTS`, `NUM_RANGE`, upgrades in `loadSettings`, upload names, and card cleaning in `cleanStore`. So do helpers that more than one module reads, shared through `window.NTR.api` (look-module parts under `.look`). A helper only its own module reads goes in that module. Modules reach each other only through `window.NTR`, never by importing files; anything several modules need goes through core.
- Where new code goes: a menu part goes in the file with its `pageHtml` or `pagePart` call (page ids are in `PAGES`), or, when core only loads the part (like `castPartHtml`), the module that fills it in. The code that does the work goes in the module that already does that work (Book's is in `reader.js`, though its settings are built in core). A module's own line below wins over this. Plans name the page and file for each new part.
- A new page, or a feature with no page that several pages use (like the font list), gets its own module, `<name>.js`, built from `window.NTR.api`: copy the wiring of `layout.js` (look page), `regex.js` (page that loads when opened) or `fonts.js` (shared feature), add it everywhere that module is listed, and add a missing-module test. Core keeps its settings data and menu entry.
- All uploads go through `uploadImage` or `uploadVideo`.
- Elements lives in `elements.js`, built from what core shares in `window.NTR.api.look`. Give each new part its own bind and CSS functions, like `bindMessageDetails` and `messageDetailsCss`. Rows built with `ovRow`, `rangeSlider`, `ovColor`, `ovText`, `ovFont`, `ovPick` and `ovWhen` are bound on every page by `bindRows`; to add behavior to them, listen on the part, like `syncFade`.
- Text Formatting lives in `text.js` the same way.
- Avatar Management lives in `avatars.js` the same way. `ntrAvatars` and the pop-out pictures stay in `index.js` (Edit Placement is in `layout.js`); `avatars.js` only writes the pop-outs' CSS: size, position, Filter, Texture and Custom CSS.
- UI Decor lives in `decor.js` the same way. Blur and Shadow (`overrideCss`), `joinCss` (Layout's Floating send bar uses it too) and `bubblesOn` (Text Formatting and Elements read it) stay in `index.js`. These or their callers check `decorOn`, so without `decor.js` they stay SillyTavern's own; anything new the core builds for UI Decor should check it too.
- Layout lives in `layout.js` the same way, with Pinned Blocks and Edit Placement. `cleanPins`, the pop-out pictures, and the CSS for Chat Width, Space Between Messages, Hide Names and Avatars and Attached Style stay in `index.js`. These check `layoutOn`, so without `layout.js` they stay SillyTavern's own.
- The font list lives in `fonts.js`, built from `window.NTR.api`: the preset fonts, their previews and the dropdown on every font box. `ovFont`, `fontName`, `cleanFont`, `syncGoogleFonts` and `FONT_NOTE` stay in `index.js`, so without `fonts.js` the font boxes are plain text boxes that still work.
- Number settings in `index.js`: put the range in `NUM_RANGE` as `[min, max, step, unit]`, adding `sliderMin, sliderMax` only when the slider is narrower than the saved limit. Read settings with `rangeNum` and numbers from card data with `cardNum`. Build sliders with `rangeSlider`, or `rangeAttrs` for sliders written out by hand. Don't write the numbers into the menu, `cleanStore` or the code that applies them. `vn.js` and `opening.js` keep their own slider numbers until `NUM_RANGE` is shared through `window.NTR` (see `ROADMAP.md`).
- Global settings live in `extensionSettings.chatvisuals`; per-character data lives in the card under `extensions.ntr`.
- Card data comes from other people and stays untrusted. Any new field read from a card must be cleaned in `cleanStore` like the existing ones (ranges, length limits, safe links).

## Writing
- Everything you write: plain language, no em dashes.
- UI copy is for any NTR user: use concise, general terms, without examples from my presets or cards. Omit helper text and tooltips unless a setting's behavior isn't obvious from its label.

## Audience
- NTR is unreleased but built for release. Design features, defaults and labels for users with other cards, presets and screen sizes. Don't skip or shrink work because NTR is solo or unreleased.
- The only saved data to keep working is mine: when a key changes, upgrade it in `loadSettings`. Don't add compatibility for anyone else's current setup.
- Follow the settings-key and card-cleaning rules quietly, as code rules, not as talking points.
