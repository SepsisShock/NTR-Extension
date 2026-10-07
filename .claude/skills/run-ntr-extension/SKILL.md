---
name: run-ntr-extension
description: Run, test and screenshot the Nitwit Tavern Redesign (NTR) extension inside a real local SillyTavern. Sets up SillyTavern, installs this repo as an extension (the working tree or any git ref, for before/after comparisons), starts and stops the server, and drives the UI headlessly with a Playwright command driver (open a chat, the NTR menu, Visual Novel Mode, uploads, page evaluation, screenshots). Also has a speed test (streaming, adding messages, scrolling, idle CPU) for comparing NTR against plain SillyTavern or another git ref. Use when asked to run, start, test, verify, reproduce a bug in, screenshot or speed test the extension, or to confirm a change works in SillyTavern.
---

NTR is a SillyTavern extension, so running it means running SillyTavern with this repo installed as an extension. `.claude/skills/run-ntr-extension/st.sh` manages a local SillyTavern, and `.claude/skills/run-ntr-extension/driver.cjs` drives it in headless Chromium from commands piped on stdin. All paths are relative to the repo root.

## Prerequisites

Node (verified with 22), git, curl, lsof, and Playwright with Chromium that Node can `require` (preinstalled in Claude Code cloud containers; nothing was apt-installed). Setup needs GitHub and the npm registry. In a Claude Code cloud session, `add_repo` for SillyTavern/SillyTavern (read access) confirms the clone is allowed.

## Setup (once, about a minute)

```bash
bash .claude/skills/run-ntr-extension/st.sh setup
```

This clones SillyTavern's release branch to `~/sillytavern` (set `ST_DIR` to change it), installs its dependencies, and starts it once so it creates its data, with one character: Seraphina. It then turns off the first-run "Welcome" dialog, keeps a copy of that clean data for `reset`, and installs the extension from the working tree.

## Build

None. The extension is plain JavaScript that SillyTavern loads; `st.sh install` copies it in.

## Run (agent path)

```bash
bash .claude/skills/run-ntr-extension/st.sh start
node .claude/skills/run-ntr-extension/driver.cjs <<'EOF'
select default_Seraphina.png
vn on
eval !!SillyTavern.getContext().extensionPrompts.ntr_vn_tags?.value
menu fg
shot fg #cb_modal_overlay .cb_popup_content
close
ss page
errors
EOF
```

The server keeps running across commands until `st.sh stop` (below). The driver loads the page fresh every run, prints each command with its result, and exits 1 if any command failed. Screenshots go to `/tmp/ntr-shots/` (`NTR_SHOTS`), and the server log to `/tmp/sillytavern.log` (`ST_LOG`). Look at the screenshots: `ss page` with VN on shows the dialogue box over the default art.

| command | what it does |
|---|---|
| `select [avatar]` | opens that character's chat (default `default_Seraphina.png`) |
| `menu [page] [part...]` | opens the NTR menu, goes to a page by its icon (`themes`, `banner`, `pfp`, `reasoning`, `text`, `display`, `fg`, `vn`) and opens folded parts by `data-sec` (`rb_css`, `vn_guide`, `vn_tags`, `vn_prompt`): `menu vn vn_tags`. Other parts (`vn_spk`, `vn_loc`, `vn_map`, ...) are always open, and naming one only checks it's there. On 2.7 and older, where every section folds, it expands them instead |
| `close` | closes the menu |
| `vn on` / `vn off` | Visual Novel Mode, through its toolbar button |
| `power on` / `power off` | the extension's own power button |
| `click <css>` | clicks through the DOM, so it reaches other pages and folded parts. A disabled button ignores it, like for a user |
| `set <css> \| <text>` | types into a field and fires `input` and `change` |
| `upload <css> \| <file> [file...]` | puts files in a file input. Most Upload buttons pick a slot first, so `click` the button, then `upload` |
| `ok` / `cancel` | presses the main button or Cancel of the question NTR shows under the last button clicked (Delete, Remove, Reset...) |
| `answer <text>` | types into the open text question and presses its main button. Link buttons ask for a URL: `click` the Link button, then `answer <url>`. Prints `still open:` and the red hint if it wasn't accepted |
| `eval <expression>` | runs in the page (may use `await`) and prints the result as JSON |
| `card` | the open chat's NTR data as saved in the character card |
| `ss [name]` / `shot <name> <css>` | screenshot of the page / of one element |
| `wait <ms>`, `reload`, `errors` | pause; load the page again; page errors so far, minus SillyTavern's network noise |

An upload and a link, with the server running:

```bash
cp ~/sillytavern/default/content/user-default.png /tmp/test.png
node .claude/skills/run-ntr-extension/driver.cjs <<'EOF'
select default_Seraphina.png
menu fg
click #cb_modal_overlay .m_f_up[data-pos="Left"]
upload #cb_modal_overlay #m_f_file | /tmp/test.png
click #cb_modal_overlay .m_f_url[data-pos="Center"]
answer http://127.0.0.1:8000/characters/default_Seraphina.png
card
EOF
```

`eval` reaches the internals: `window.NTR.api` (`settings()`, `store()`, `uploadImage()`...), `window.NTR.vn`, and SillyTavern's `SillyTavern.getContext()`. Uploaded files land in `~/sillytavern/data/default-user/user/files/`.

When you're done:

```bash
bash .claude/skills/run-ntr-extension/st.sh stop
```

### Before and after a change

`reset` puts back the clean data and installs the extension from a git ref, or from the working tree with no ref. Run the same commands on both and compare:

```bash
cat > /tmp/checks.txt <<'EOF'
select default_Seraphina.png
menu fg
eval [...document.querySelectorAll('#cb_modal_overlay .m_f_up')].map((b) => b.disabled)
card
EOF
git fetch origin main
bash .claude/skills/run-ntr-extension/st.sh reset origin/main
bash .claude/skills/run-ntr-extension/st.sh start
node .claude/skills/run-ntr-extension/driver.cjs < /tmp/checks.txt > /tmp/main.txt
bash .claude/skills/run-ntr-extension/st.sh reset
bash .claude/skills/run-ntr-extension/st.sh start
node .claude/skills/run-ntr-extension/driver.cjs < /tmp/checks.txt > /tmp/branch.txt
diff /tmp/main.txt /tmp/branch.txt
```

To try new code on the running server without resetting the data, `st.sh install` is enough; no restart.

### Speed test

`st.sh bench` measures how much work SillyTavern does with NTR, so a change can be checked for slowdowns before a release. Each run starts from the clean data, opens Seraphina's chat in a fresh page and measures:

- **streaming**: a 400-word reply with a reasoning block, one word every 15 ms, updated the way SillyTavern updates a message while streaming;
- **adding 80 messages**, user and character in turn;
- **scrolling** the long chat from top to bottom;
- **idle**: 10 s of doing nothing, which catches timers and animations that keep running.

```bash
bash .claude/skills/run-ntr-extension/st.sh bench plain none          # SillyTavern without NTR
bash .claude/skills/run-ntr-extension/st.sh bench main origin/main    # NTR from a git ref
bash .claude/skills/run-ntr-extension/st.sh bench branch full        # the working tree, with most features on
bash .claude/skills/run-ntr-extension/st.sh bench table plain main branch
```

Options after the name, in any order: a git ref (or `none` for no extension; the working tree without one), `full` (turns on the banner with 3 rotating images, foreground images, Reasoning Block, Text Formatting and UI Display styling and a custom cursor, through `bench-full.txt`), `vn` (Visual Novel Mode on), `phone` (390×844 touch screen) and `runs=N` (default 3). Each run takes about a minute, and the server is stopped at the end. Results and a screenshot from the first run go to `/tmp/ntr-bench/<name>.json` and `.png` (`NTR_BENCH`). The table shows the middle of the runs.

Reading the numbers:

- **busy** is how long the page's main thread was working, so less is better. **restyling** is the part spent working out styles; heavy `:has()` rules on `body` make it jump on every streamed word.
- **95% of frames under** is about 16.7 ms when smooth (60 frames a second). 33 or 50 ms means visible stutter.
- Compare runs from the same session only. Without a graphics card everything is drawn in software, so the numbers show how setups differ, not what a real phone would get. Differences under about 10% are noise.
- With `vn`, most of the chat sits behind the dialogue box, so its streaming numbers can come out lower than plain SillyTavern.

## Run (human path)

`st.sh start`, then open http://127.0.0.1:8000 in a browser, and `st.sh stop` when done. Not usable headless.

## Test

There's no test suite. Check that every file parses (as modules, since `index.js` uses `import.meta`); no output means all good:

```bash
for f in *.js; do cp "$f" /tmp/ntr-check.mjs && node --check /tmp/ntr-check.mjs || echo "syntax error in $f"; done
```

## Gotchas

- **The menu shows one page at a time and some parts are folded**, and Playwright's own `fill` and `waitForSelector` time out on elements that are hidden. Use the driver's `click` and `set`. In raw Playwright, set values through `page.evaluate` and wait with `{ state: 'attached' }`.
- **Upload buttons open their file input from code**, and a headless page shows no file picker for that; even a forced Playwright click produced no file chooser. `click` the Upload button (it records the slot), then `upload` to the hidden input.
- **SillyTavern clears every extension prompt when a chat opens, starts or reloads.** That's how NTR's Visual Novel instructions once went missing. Check `extensionPrompts.ntr_vn_tags` after `select` or `reloadCurrentChat()`, never only before.
- **Card data is written 0.7 s after the last change**, and the driver closes the browser when its commands run out. A change made right before the end never reaches the card. End with `wait 1500` when the next run (or a `reload`) has to see it.
- **`reset` stops the server.** SillyTavern keeps characters in memory, so the data can't be swapped under it; `start` again afterwards.
- **SillyTavern's first-run "Welcome" dialog asks for a persona name and holds up loading**: the character list stays empty behind it. `st.sh setup` sets `"firstRun": false` in `data/default-user/settings.json`; do the same if you make SillyTavern data another way.
- **Lazy loading:** `st.sh lazy on`, then `stop` and `start`. Characters load as shallow copies without their NTR data, and opening a chat loads that one in full. For two cards that share files, duplicate one, which makes `default_Seraphina_1.png`:
  `eval (await fetch('/api/characters/duplicate', { method: 'POST', headers: SillyTavern.getContext().getRequestHeaders(), body: JSON.stringify({ avatar_url: 'default_Seraphina.png' }) })).json()`

## Troubleshooting

- **`pageerror: Unexpected token 'I', "Internal S"... is not valid JSON`** with a `500` from `/api/horde/text-models`: SillyTavern's AI Horde lookup can't reach the internet. It isn't the extension's; `errors` leaves it out.
- **`SillyTavern or the extension didn't load at http://127.0.0.1:8000/: page.goto: net::ERR_CONNECTION_REFUSED`**: the server isn't running. Run `st.sh start`, and read `/tmp/sillytavern.log` if that fails.
- **`SillyTavern or the extension didn't load at http://127.0.0.1:8000/: page.waitForFunction: Timeout 60000ms exceeded`**: usually the first-run "Welcome" dialog (see Gotchas). `st.sh reset` puts back data with it turned off.
- **`page.fill: Timeout 30000ms exceeded`** or **`page.waitForSelector: Timeout`** in your own Playwright script: the element is on another menu page or in a folded part (see Gotchas).
- **No file chooser after clicking an Upload button**: expected headless; use `upload`.
