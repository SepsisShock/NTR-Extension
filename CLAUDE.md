# NTR-Extension

## Project Goals
- Nitwit Tavern Redesign (NTR), non-profit and open-source SillyTavern extension, being developed for public release.
- Lightweight code matters because some users will be on slower devices.
- Clean codebase matters, EVEN WHEN USERS WON'T SEE THE DIFFERENCE, because code cruft increases maintenance costs.

## Communication
- Everywhere: No em dashes; use semicolons or colons instead.

### UI Copy (Helper text and Tooltips)
- Use general and familiar terms, succinct language.
- Omit unless a setting's behavior is not obvious from its label.

### Source Code Comments
- Use literal and succinct language. 3rd person if perspective is needed.
- Avoid writing when code is obvious; comments are read only by LLMs, not humans.

## Before Outputting, Think First
- My Input: if it could be read different ways, use the conversation context & common sense to determine what I mean.
- Tools, APIs, Library: Whenever stating how they behave, check official docs, then search proven community patterns.
- Criticisms: Don't automatically agree or become defensive; may reconsider when evidence or overlooked factors warrant it, but evaluate on its own merits.

## Workflow
- Ignore `README.md` and `LICENSE*` unless explicitly requested.
- One Rule, One Help File: don't restate a rule from another *help* file (CLAUDE.md, AGENTS.md, `docs/`, skills); point to its path instead if needed.
- If a repo skill, test, or `CLAUDE.md` rule has issues or is outdated, flag it in chat and suggest when & where to address it.
- After implementing, check the result against the request and approved plan, not just test runs. Report any differences.
- Other LLMs: Thoroughly verify each claim and evidence. Even when a conclusion is correct, assess whether it's a good judgment for the project.
- Group related changes into one PR; split them when separate PRs are easier to review or revert, and justify why in chat before splitting.

### Architecture & Module Routing
- **Core Boundary:** `index.js` is core. Modules never import other NTR files; they communicate only through `window.NTR`: core's helpers in `window.NTR.api` (look helpers in `window.NTR.api.look`), and other modules' exports in `window.NTR.<module>`.
- **No Copied Code:** Don't copy code, within a module or across modules: search for a helper first, or write one. A short expression made only of built-in calls needs no new helper, but use one if it already exists. Helpers used by multiple modules belong in `index.js`; single-module helpers stay in their module.
- **Menu & Logic Placement:** Menu parts go in the file with their `pageHtml`/`pagePart` call (`PAGES` holds page IDs), or the module that fills them if core only loads the shell (like `castPartHtml`). Feature work goes in the module that already does that work (Book's is in `reader.js`, though its settings menu is built in `index.js`).
- **New Modules:** A new page or shared pageless feature gets `<name>.js`. Wire it like `layout.js` (look page), `agents.js` (lazy-loaded page), or `fonts.js` (shared feature), and register it everywhere those modules appear. Give it a header comment only for rules its code doesn't show that break something if ignored; otherwise, no header.
- **Module Headers:** Read a module's top comment, if it has one, before adding to its area. Core parts of a look area check its switch (`decorOn`, `layoutOn`) so the area falls back to SillyTavern's own styling without its module.

### Data, Controls & Hygiene
- **Storage & Migration:** Global settings live in `extensionSettings.chatvisuals`; per-character and per-group data comes from `store()`: the card under `extensions.ntr`, or the extension settings for group chats. Preserve existing settings keys or migrate only my saved setup in `loadSettings` (no compatibility shims for external setups). Upgrades for my saved setup can go once it has loaded them; there are no other users before release.
- **Untrusted Card Data:** Card data comes from external users. Sanitize every new card field in `cleanStore` (ranges, length limits, safe links).
- **Numbers & Sliders:** Define ranges in `index.js` `NUM_RANGE` as `[min, max, step, unit]`, or `[min, max, step, unit, sliderMin, sliderMax]` when the slider is narrower than the saved limit. Read settings via `rangeNum` and card numbers via `cardNum`. Build sliders with `rangeSlider` or `rangeAttrs`; never write these ranges into `cleanStore` or the code that applies them.
- **Row Binding & Uploads:** Rows built with `ovRow`, `rangeSlider` (unless given another class), `ovColor`, `ovText`, `ovFont`, `ovPick`, `ovWhen`, and `customCssBox` auto-bind via `bindRows`; attach extra behavior by listening on the part (like `syncFade`). Wrap per-chat uploads in `uploadHere`.
- **Dead Code & Guards:** Remove unused checks, parameters, and return values after edits. Skip defensive guards/fallbacks for states no caller or SillyTavern produces, or that another check already covers. Always keep: `cleanStore` sanitization, `NUM_RANGE` checks, missing-module handling, and checks for optional SillyTavern features.