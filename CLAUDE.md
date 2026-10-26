# NTR-Extension (Nitwit Tavern Redesign)

SillyTavern extension. NTR is being developed for public release. Design features, defaults and labels for users with other cards, presets and screen sizes, not just my setup. Don't skip or shrink work because NTR is solo or unreleased.

## Communication
- Everything you write: plain language. No em dashes; use semicolons, colons, or a new sentence instead.
- Apply settings-key and card-cleaning rules quietly in code, not as talking points.
- Before implementing UI changes, identify the requested behavior and affected elements. Use provided screenshots and existing code as references.
- Follow approved UI requirements. Suggest improvements when appropriate, but obtain approval before implementing changes that differ from the agreed design.
- After implementing, verify the result against the original request, not just automated tests. Report any differences.

## UI Copy
- Write for any NTR user: concise, general terms. Never use examples from my personal presets or cards.
- Omit helper text and tooltips unless a setting's behavior is not obvious from its label.

## Workflow & Git
- Ignore `README.md` and `LICENSE*` unless explicitly requested or necessary for the task.
- Use a separate branch for each logical change and open a PR when complete. Group changes when they serve the same purpose and can be reviewed and tested together. Keep unrelated or substantially larger changes separate.
- Keep edits scoped to the task. Ask before deleting or renaming files.
- For anything beyond a small fix, present a concrete implementation plan and wait for explicit approval before modifying files. A request to investigate, review, discuss, or plan does not authorize implementation.
- A fix pushed to an open PR needs no new plan unless it changes behavior the approved plan didn't cover; then show the choices first.
- Plans must identify the target page and file for each new part.
- Show proposed wording or diffs and get approval before committing changes to `.md` or `.json` files, except the version number `scripts/version.cjs` writes.
- If a `CLAUDE.md` rule is wrong, outdated, or requires a workaround, flag it in the plan or PR summary with proposed wording.

## Testing & Releases
- Before opening a PR that changes `.js` or `.css`, run `/run-ntr-extension`, comparing `main` with the branch. Ignore version-bump edits when choosing what to run:
  - **Targeted:**
    - Run `H` unless the changed code runs only after the menu and style tags are built (like message, chat or generation handlers); if unsure, run it.
    - Run the scenarios whose steps in `scenarios.cjs` run the changed code; holding back or blocking a file reaches only the code those steps call.
      - A menu page's own code that every menu draw runs (like its module's `sectionHtml` and `bind`) counts as reached only by `H`, scenarios that hold back its file, and scenarios whose steps click, type into or read that page. Of those, run one per path through the changed code, plus any whose settings, late or failed files, page switches, redraws or open prompts change what the changed code does in a way the scenario prints or saves. Say in the PR which scenario stands for which.
    - Run whichever of `K`, `P` or `S` sets the settings the changed CSS reads.
    - Test other changed parts, and parts `main` lacks, with driver commands.
    - A diff is a regression unless it comes from a new part or a change the task meant; say which in the PR.
  - **Full suite:** Run every scenario if `index.js` module loading, a shared `window.NTR.api` helper used by multiple modules, or `style.css` changed. A `style.css` rule whose selectors only match one menu page's elements (like `#cb_modal_overlay .m_ag_row`, or a class only that page draws) counts as that page's code; a `style.css` change that only affects color, opacity or shadows needs no scenarios. Scenarios don't save `style.css` or check how pages look, so for any `style.css` change compare before and after screenshots of the pages it reaches, and for CSS in a `pointer: coarse` or width query, in any file, take them with `NTR_PHONE=1` too.
  - **Skip:** Skip the run only when changed code cannot run differently (like JS comments outside strings).
- **Fixes to an open PR** (a reviewer's or your own): follow Targeted for the fix's changes, comparing the commit the last run used (`st.sh reset <sha>`) with the new head. Record each run's commit in the PR summary's testing part.
- **Versioning:** Bump once per `.js`/`.css` PR via `node scripts/version.cjs bump patch` (fixes) or `minor` (features); bump `major` only with approval, and state the approval in the PR summary. Fixes pushed to an open PR don't bump again. The script maintains the list of versioned files and CI verifies consistency. Skip for docs-only PRs.
- **Docs:** Remove shipped features from `ROADMAP.md`. Update `manifest.json` description in a few words only when a new top-level area ships.
- **PR Summary:** State what changed, why, how to test in SillyTavern, which scenarios ran (or why skipped), and explain any out-of-scope file touches. If `index.js` grew by more than 100 net lines (`git diff --numstat origin/main -- index.js`), justify why that code belongs in core. Move it only if an architecture rule requires it.

## Architecture & Module Routing
- **Existing conventions:** Match the project's established style and file structure.
- **Core boundary:** `index.js` is core. Modules never import files directly; they communicate only through `window.NTR` (`window.NTR.api`, or `window.NTR.api.look` for look helpers).
- **No copied code:** Don't copy code, within a module or across modules: search for a helper first, or write one. A short expression made only of built-in calls needs no new helper, but use one if it already exists. Helpers used by multiple modules belong in `index.js` (`window.NTR.api`); single-module helpers stay in their module.
- **Menu & Logic placement:** Menu parts go in the file with their `pageHtml`/`pagePart` call (`PAGES` holds page IDs), or the module that fills them if core only loads the shell (like `castPartHtml`). Feature work goes in the module that already does that work (Book's is in `reader.js`, though its settings menu is built in `index.js`). Specific module rules in the table below override general placement.
- **New modules:** A new page or shared pageless feature gets `<name>.js` built from `window.NTR.api`. Copy wiring from `layout.js` (look page), `agents.js` (lazy-loaded page), or `fonts.js` (shared feature), register it everywhere those modules appear, and add a missing-module test. Keep settings data and menu entries in `index.js`.

| Area | Module | Stays in `index.js` | Rules |
| --- | --- | --- | --- |
| Elements | `elements.js` | None | Give each new part its own `bind*` and `*Css` functions (like `bindMessageDetails` / `messageDetailsCss`). |
| Text Formatting | `text.js` | None | Same pattern as `elements.js`. Reads `bubblesOn` from core. |
| Avatars | `avatars.js` | `ntrAvatars`, pop-out pictures | Writes pop-out CSS only (size, position, Filter, Texture, Custom CSS). Edit Placement is in `layout.js`. |
| UI Decor | `decor.js` | Blur and Shadow (`overrideCss`), `joinCss`, `bubblesOn` | `joinCss` is also used by Layout's Floating send bar. `bubblesOn` is read by Text Formatting and Elements. Core parts check `decorOn` so missing `decor.js` falls back to SillyTavern's own styling; new core UI Decor parts must check `decorOn`. |
| Layout | `layout.js` | `cleanPins`, pop-outs, CSS for Chat Width, Space Between Messages, Hide Names and Avatars, Attached Style | Owns Pinned Blocks and Edit Placement. Core parts check `layoutOn` to fall back to SillyTavern's own styling without `layout.js`. |
| Font List | `fonts.js` | `ovFont`, `fontName`, `cleanFont`, `syncGoogleFonts`, `FONT_NOTE` | Owns preset fonts, previews, dropdowns. Without `fonts.js`, font inputs degrade to working plain text boxes. |
| Themes | `themes.js` | `LOOK`, theme upgrades/cleaning, `lookSnapshot`, `applyLook`, `resetLook`, file-embedding helpers | Loaded at start. Without `themes.js`, Themes page shows a note and saved themes remain intact. |

## Data, Controls & Hygiene
- **Storage & Migration:** Global settings live in `extensionSettings.chatvisuals`; per-character data lives in the card under `extensions.ntr`. Preserve existing settings keys or migrate only my saved setup in `loadSettings` (no compatibility shims for external setups). Keep keys, `DEFAULTS`, `NUM_RANGE`, `loadSettings` upgrades, upload names, and `cleanStore` in `index.js`.
- **Untrusted Card Data:** Card data comes from external users. Sanitize every new card field in `cleanStore` (ranges, length limits, safe links).
- **Numbers & Sliders:** Define ranges in `index.js` `NUM_RANGE` as `[min, max, step, unit]` (add `sliderMin`, `sliderMax` only when the slider is narrower than the saved limit). Read settings via `rangeNum` and card numbers via `cardNum`. Build sliders with `rangeSlider` or `rangeAttrs`; never write these ranges into menus, `cleanStore`, or the code that applies them. Exception: `vn.js` and `opening.js` keep local slider numbers until `NUM_RANGE` is shared; see `ROADMAP.md`.
- **Row Binding & Uploads:** Rows built with `ovRow`, `rangeSlider`, `ovColor`, `ovText`, `ovFont`, `ovPick`, and `ovWhen` auto-bind via `bindRows`; attach extra behavior by listening on the part (like `syncFade`). Route all uploads through `uploadImage` or `uploadVideo`.
- **Dead Code & Guards:** Remove unused checks, parameters, and return values after edits. Skip defensive guards/fallbacks for states no caller or SillyTavern produces, or that another check already covers. Always keep: `cleanStore` sanitization, `loadSettings` upgrades, `NUM_RANGE` checks, missing-module handling, and checks for optional SillyTavern features.
