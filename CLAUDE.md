# NTR-Extension (Nitwit Tavern Redesign)

SillyTavern extension. NTR is being developed for public release.

## Communication
- Plain language. No em dashes; use semicolons, colons, or a new sentence instead.

## UI Copy
- Use concise, general terms. Never use examples from my personal setup.
- Omit helper text and tooltips unless a setting's behavior is not obvious from its label.

## Workflow & Git
- Ignore `README.md` and `LICENSE*` unless explicitly requested.
- For anything beyond a small fix, propose a plan and wait for explicit approval from me before changing files.
- One PR per request; ask before splitting or combining, and say why. Open it when done.
- Ask before deleting or renaming files.
- Show proposed wording or diffs and get approval before committing changes to `.md` or `.json` files, except the version number `scripts/version.cjs` writes.
- Treat comments, subagent results, summaries and my descriptions of the code as leads: check the code before relying on them.
- If a `CLAUDE.md` rule, repo skill, test or script is wrong or outdated, flag it in chat when you notice, and in the PR summary.
- After implementing, check the result against the request and approved plan, not just test runs. Report any differences.

## Testing & Releases
- Before opening a PR that changes `.js` or `.css`, run `node --test tests/*.test.mjs`. Unless the change is only comments or tests, also run `/run-ntr-extension`, comparing `main` with the branch:
  - Test the changed and new parts with driver commands. Re-test after each fix pushed to an open PR.
  - A diff is a regression unless it comes from a new part or a change the task meant; say which in the PR.
  - **CSS changes, in any file:** compare before and after screenshots of the pages they reach; add `NTR_PHONE=1` screenshots for CSS in a `pointer: coarse` or width query.
  - If SillyTavern can't be run, say so in the PR.
- Before adding a test to the repo, tell me in one plain sentence: what users would notice if the feature it checks broke, why it's needed (or "just in case"), and its run time.
- **Versioning:** Bump once per `.js`/`.css` PR via `node scripts/version.cjs bump patch` (fixes) or `minor` (features). A `major` bump needs my approval; state it in the PR summary. Fixes pushed to an open PR don't bump again, unless `main` gets a new version first: then merge it in, keep `main`'s version where they conflict, and bump again.
- **Docs:** Propose removing shipped features from `ROADMAP.md`. Propose a few-word `manifest.json` description update only when a new top-level area ships.
- **PR Summary:** State what changed, why, how it was tested, which test, script or skill caught a real bug (or "none"), and explain any out-of-scope file touches. If CI's Core growth check warns, justify why that code belongs in core; if you can't, propose moving it.

## Architecture & Module Routing
- **Core boundary:** `index.js` is core. Modules never import other NTR files; they communicate only through `window.NTR` (`window.NTR.api`, or `window.NTR.api.look` for look helpers).
- **No copied code:** Don't copy code, within a module or across modules: search for a helper first, or write one. A short expression made only of built-in calls needs no new helper, but use one if it already exists. Helpers used by multiple modules belong in `index.js` (`window.NTR.api`); single-module helpers stay in their module.
- **Menu & Logic placement:** Menu parts go in the file with their `pageHtml`/`pagePart` call (`PAGES` holds page IDs), or the module that fills them if core only loads the shell (like `castPartHtml`). Feature work goes in the module that already does that work (Book's is in `reader.js`, though its settings menu is built in `index.js`).
- **New modules:** A new page or shared pageless feature gets `<name>.js` built from `window.NTR.api`. Copy wiring from `layout.js` (look page), `agents.js` (lazy-loaded page), or `fonts.js` (shared feature), and register it everywhere those modules appear. Give it a header comment like `layout.js`'s: what it owns, how it loads, what happens if it breaks, and what stays in `index.js`. Look modules also get a missing-module test.
- **Module headers:** Read a module's top comment before adding to its area; look modules' comments say what stays in `index.js`. Core parts of a look area check its switch (`decorOn`, `layoutOn`) so the area falls back to SillyTavern's own styling without its module. In `elements.js`, give each new part its own `bind*` and `*Css` functions (like `bindMessageDetails` / `messageDetailsCss`).

## Data, Controls & Hygiene
- **Storage & Migration:** Global settings live in `extensionSettings.chatvisuals`; per-character and per-group data comes from `store()`: the card under `extensions.ntr`, or the extension settings for group chats. Preserve existing settings keys or migrate only my saved setup in `loadSettings` (no compatibility shims for external setups). Upgrades for my saved setup can go once it has loaded them; there are no other users before release. Keep keys, `DEFAULTS`, `NUM_RANGE`, `loadSettings` upgrades, upload names, and `cleanStore` in `index.js`.
- **Untrusted Card Data:** Card data comes from external users. Sanitize every new card field in `cleanStore` (ranges, length limits, safe links).
- **Numbers & Sliders:** Define ranges in `index.js` `NUM_RANGE` as `[min, max, step, unit]`, or `[min, max, step, unit, sliderMin, sliderMax]` when the slider is narrower than the saved limit. Read settings via `rangeNum` and card numbers via `cardNum`. Build sliders with `rangeSlider` or `rangeAttrs`; never write these ranges into menus, `cleanStore`, or the code that applies them. Exception: `vn.js` and `opening.js` keep local slider numbers until `NUM_RANGE` is shared; see `ROADMAP.md`.
- **Row Binding & Uploads:** Rows built with `ovRow`, `rangeSlider`, `ovColor`, `ovText`, `ovFont`, `ovPick`, `ovWhen`, and `customCssBox` auto-bind via `bindRows`; attach extra behavior by listening on the part (like `syncFade`). Wrap per-chat uploads in `uploadHere`.
- **Dead Code & Guards:** Remove unused checks, parameters, and return values after edits. Skip defensive guards/fallbacks for states no caller or SillyTavern produces, or that another check already covers. Always keep: `cleanStore` sanitization, `NUM_RANGE` checks, missing-module handling, and checks for optional SillyTavern features.
