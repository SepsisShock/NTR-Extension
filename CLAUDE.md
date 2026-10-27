# NTR-Extension (Nitwit Tavern Redesign)

SillyTavern extension. NTR is being developed for public release.

## Communication
- Plain language. No em dashes; use semicolons, colons, or a new sentence instead.

## UI Copy
- Use concise, general terms. Never use examples from my personal setup.
- Omit helper text and tooltips unless a setting's behavior is not obvious from its label.

## Workflow & Git
- Ignore `README.md` and `LICENSE*` unless explicitly requested.
- For anything beyond a small fix, propose a plan and wait for approval before changing files. A request to investigate, review, discuss or plan isn't approval.
- Use one branch per logical change; open a PR when done. Group changes that serve the same purpose; give anything unrelated or substantially larger its own branch.
- Keep edits scoped to the task. Ask before deleting or renaming files.
- Show proposed wording or diffs and get approval before committing changes to `.md` or `.json` files, except the version number `scripts/version.cjs` writes.
- If a `CLAUDE.md` rule or repo skill is wrong or outdated, flag it in the plan or PR summary.

## Testing & Releases
- Before opening a PR that changes `.js` or `.css`, run `/run-ntr-extension`, comparing `main` with the branch:
  - Test changed parts, and parts `main` lacks, with driver commands.
  - A diff is a regression unless it comes from a new part or a change the task meant; say which in the PR.
  - **`style.css`:** compare before and after screenshots of the pages it reaches.
  - **CSS in a `pointer: coarse` or width query, in any file:** compare before and after screenshots of the pages it reaches with `NTR_PHONE=1`.
- After implementing, check the result against the request and approved plan, not just test runs. Report any differences.
- **Fixes to an open PR** (a reviewer's or your own): re-test what the fix changed.
- **Versioning:** Bump once per `.js`/`.css` PR via `node scripts/version.cjs bump patch` (fixes) or `minor` (features); bump `major` only with approval, and state the approval in the PR summary. Fixes pushed to an open PR don't bump again. The script maintains the list of versioned files and CI verifies consistency.
- **Docs:** Remove shipped features from `ROADMAP.md`. Update `manifest.json` description in a few words only when a new top-level area ships.
- **PR Summary:** State what changed, why, how to test in SillyTavern, how it was tested, which test, script or skill caught a real bug (or "none"), and explain any out-of-scope file touches. If `index.js` grew by more than 100 net lines (`git diff --numstat origin/main -- index.js`), justify why that code belongs in core. Move it only if an architecture rule requires it.

## Architecture & Module Routing
- **Existing conventions:** Match the project's established style and file structure.
- **Core boundary:** `index.js` is core. Modules never import other NTR files; they communicate only through `window.NTR` (`window.NTR.api`, or `window.NTR.api.look` for look helpers).
- **No copied code:** Don't copy code, within a module or across modules: search for a helper first, or write one. A short expression made only of built-in calls needs no new helper, but use one if it already exists. Helpers used by multiple modules belong in `index.js` (`window.NTR.api`); single-module helpers stay in their module.
- **Menu & Logic placement:** Menu parts go in the file with their `pageHtml`/`pagePart` call (`PAGES` holds page IDs), or the module that fills them if core only loads the shell (like `castPartHtml`). Feature work goes in the module that already does that work (Book's is in `reader.js`, though its settings menu is built in `index.js`). Specific module rules in the table below override general placement.
- **New modules:** A new page or shared pageless feature gets `<name>.js` built from `window.NTR.api`. Copy wiring from `layout.js` (look page), `agents.js` (lazy-loaded page), or `fonts.js` (shared feature), and register it everywhere those modules appear. Look modules also get a missing-module test. Keep settings data and menu entries in `index.js`.

| Area | Module | Stays in `index.js` | Rules |
| --- | --- | --- | --- |
| Elements | `elements.js` | None | Give each new part its own `bind*` and `*Css` functions (like `bindMessageDetails` / `messageDetailsCss`). |
| Text Formatting | `text.js` | None | Same pattern as `elements.js`. |
| Avatars | `avatars.js` | `ntrAvatars`, pop-out pictures | Writes pop-out CSS only (size, position, Filter, Texture, Custom CSS). Edit Placement is in `layout.js`. |
| UI Decor | `decor.js` | Blur and Shadow (`overrideCss`), `joinCss`, `bubblesOn` | `joinCss` is also used by Layout's Floating send bar. `bubblesOn` is read by Text Formatting and Elements. Core parts check `decorOn` so missing `decor.js` falls back to SillyTavern's own styling; new core UI Decor parts must check `decorOn`. |
| Layout | `layout.js` | `cleanPins`, pop-outs, CSS for Chat Width, Space Between Messages, Hide Names and Avatars, Attached Style | Owns Pinned Blocks and Edit Placement. Core parts check `layoutOn` to fall back to SillyTavern's own styling without `layout.js`. |
| Font List | `fonts.js` | `ovFont`, `fontName`, `cleanFont`, `syncGoogleFonts`, `FONT_NOTE` | Owns preset fonts, previews, dropdowns. Without `fonts.js`, font inputs degrade to working plain text boxes. |
| Themes | `themes.js` | `LOOK`, theme upgrades/cleaning, `lookSnapshot`, `applyLook`, `resetLook`, file-embedding helpers | Loaded at start. Without `themes.js`, Themes page shows a note and saved themes remain intact. |

## Data, Controls & Hygiene
- **Storage & Migration:** Global settings live in `extensionSettings.chatvisuals`; per-character and per-group data comes from `store()`: the card under `extensions.ntr`, or the extension settings for group chats. Preserve existing settings keys or migrate only my saved setup in `loadSettings` (no compatibility shims for external setups). Keep keys, `DEFAULTS`, `NUM_RANGE`, `loadSettings` upgrades, upload names, and `cleanStore` in `index.js`.
- **Untrusted Card Data:** Card data comes from external users. Sanitize every new card field in `cleanStore` (ranges, length limits, safe links).
- **Numbers & Sliders:** Define ranges in `index.js` `NUM_RANGE` as `[min, max, step, unit]`, or `[min, max, step, unit, sliderMin, sliderMax]` when the slider is narrower than the saved limit. Read settings via `rangeNum` and card numbers via `cardNum`. Build sliders with `rangeSlider` or `rangeAttrs`; never write these ranges into menus, `cleanStore`, or the code that applies them. Exception: `vn.js` and `opening.js` keep local slider numbers until `NUM_RANGE` is shared; see `ROADMAP.md`.
- **Row Binding & Uploads:** Rows built with `ovRow`, `rangeSlider`, `ovColor`, `ovText`, `ovFont`, `ovPick`, and `ovWhen` auto-bind via `bindRows`; attach extra behavior by listening on the part (like `syncFade`). Route all uploads through `uploadImage` or `uploadVideo`.
- **Dead Code & Guards:** Remove unused checks, parameters, and return values after edits. Skip defensive guards/fallbacks for states no caller or SillyTavern produces, or that another check already covers. Always keep: `cleanStore` sanitization, `loadSettings` upgrades, `NUM_RANGE` checks, missing-module handling, and checks for optional SillyTavern features.
