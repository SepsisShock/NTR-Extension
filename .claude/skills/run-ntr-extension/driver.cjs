#!/usr/bin/env node
// Drives the Nitwit Tavern Redesign extension inside a running SillyTavern with headless Chromium.
// Pipe one command per line on stdin (a heredoc). Results print as they go, screenshots land in $NTR_SHOTS
// (default /tmp/ntr-shots), and the exit code is 1 if any command failed. Commands are listed in SKILL.md.
//
//   node .claude/skills/run-ntr-extension/driver.cjs <<'EOF'
//   select default_Seraphina.png
//   menu fg
//   shot fg #cb_modal_overlay .cb_popup_content
//   EOF
const fs = require('fs');
const path = require('path');

const { launch, contextOptions, MODE } = require('./browser.cjs');

const ST_URL = process.env.ST_URL || 'http://127.0.0.1:8000/';
const SHOTS = process.env.NTR_SHOTS || '/tmp/ntr-shots';
// Without internet, SillyTavern's own AI Horde lookup fails with these; they aren't the extension's. A failed load
// only counts as noise by its address, so a missing NTR image still shows up. Firefox and WebKit word the Horde error
// differently, so theirs is told apart by horde.js in its stack. WebKit also warns about SillyTavern's viewport tag.
const NOISE = /Internal S.*not valid JSON|\(horde\.js\)$|\/api\/horde\/|favicon|Viewport argument key "interactive-widget"/i;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const splitPipe = (s) => { const i = s.indexOf(' | '); return i < 0 ? [s, ''] : [s.slice(0, i).trim(), s.slice(i + 3).trim()]; };

(async () => {
  const lines = fs.readFileSync(0, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await launch();
  const page = await (await browser.newContext(contextOptions(browser))).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + (/\/horde\.js:/.test(e.stack || '') ? ' (horde.js)' : '')));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    // "Failed to load resource" doesn't say which one; the address comes with the message.
    const url = m.text().startsWith('Failed to load resource') ? m.location()?.url : '';
    errors.push('console: ' + m.text() + (url ? ' (' + url + ')' : ''));
  });
  // NTR asks its questions in the menu (see `ok`, `cancel` and `answer`). A browser dialog from anywhere else is accepted.
  page.on('dialog', (d) => d.accept());

  const ready = async () => {
    await page.goto(ST_URL);
    await page.waitForFunction(() => window.SillyTavern?.getContext && window.NTR?.api && document.getElementById('cb_node_toggle')
      && SillyTavern.getContext().characters.length > 0, null, { timeout: 60000 });
    await sleep(1500); // the extension finishes its first render
  };
  const has = (sel) => page.evaluate((sel) => !!document.querySelector(sel), sel);
  const need = async (sel) => { if (!(await has(sel))) throw new Error('nothing matches ' + sel); };
  const askPress = async (btn) => {
    await need('.ntr_ask');
    const text = await page.evaluate((btn) => {
      const box = document.querySelector('.ntr_ask');
      const t = (box.querySelector(':scope > label') || box.querySelector(':scope > div') || box).textContent.replace(/\s+/g, ' ').trim();
      box.querySelector(btn).click();
      return t;
    }, btn);
    await sleep(800);
    return 'pressed (' + text + ')';
  };

  const cmds = {
    // Open a character's chat. The default data has one character: default_Seraphina.png.
    async select(rest) {
      const avatar = rest || 'default_Seraphina.png';
      const i = await page.evaluate((a) => SillyTavern.getContext().characters.findIndex((c) => c.avatar === a), avatar);
      if (i < 0) throw new Error('no character with avatar ' + avatar);
      await page.evaluate((i) => SillyTavern.getContext().selectCharacterById(i), i);
      await page.waitForFunction((a) => SillyTavern.getContext().characters[SillyTavern.getContext().characterId]?.avatar === a
        && document.querySelector('#chat .mes'), avatar, { timeout: 20000 });
      await sleep(1500);
      return `chat open (character index ${i})`;
    },
    // Open the NTR menu, go to a page by its icon (`menu fg`) and open folded parts by their data-sec name
    // (`menu reader rd_vn vn_guide`). Menus from before the icon column (2.7 and older) expand sections the same way.
    async menu(rest) {
      await page.evaluate(() => { window.toastr?.clear(); window.NTR.api.openMenu(); });
      // A page or part from a file that loads when the menu opens fills in a moment later, so each gets up to 5 seconds.
      for (const sec of rest.split(/\s+/).filter(Boolean)) {
        const ok = await page.waitForFunction((sec) => {
          const nav = document.querySelector(`#cb_modal_overlay .ntr_navi[data-page="${sec}"]`);
          if (nav) { nav.click(); return true; }
          const h = document.querySelector(`#cb_modal_overlay .cb_collapse_toggle[data-sec="${sec}"]`);
          if (!h) return !!document.querySelector(`#cb_modal_overlay [data-sec="${sec}"]`);
          if (h.nextElementSibling.style.display === 'none') h.click();
          return true;
        }, sec, { timeout: 5000 }).then(() => true, () => false);
        if (!ok) throw new Error('no menu section ' + sec);
      }
      await sleep(400);
      return 'menu open';
    },
    async close() { await page.evaluate(() => window.NTR.api.closeMenu()); return 'menu closed'; },
    // Visual Novel Mode through its toolbar button (tapped on a phone); `vn on` waits for the module to load.
    async vn(rest) {
      const want = rest === 'on';
      if (await page.evaluate(() => !!window.NTR.api.settings().nodeEnabled) !== want) await page[MODE === 'desktop' ? 'click' : 'tap']('#cb_node_toggle');
      if (want) await page.waitForFunction(() => window.NTR.vn, null, { timeout: 20000 });
      await sleep(800);
      return 'Visual Novel Mode ' + rest;
    },
    // The extension's power button (on its bar in the Extensions panel).
    async power(rest) {
      const want = rest === 'on';
      if (await page.evaluate(() => window.NTR.api.isOn()) !== want) await page.evaluate(() => document.getElementById('ntr_power').click());
      await page.waitForFunction((want) => window.NTR.api.isOn() === want, want, { timeout: 10000 });
      await sleep(800);
      return 'extension ' + rest;
    },
    // Clicks through the DOM, so it works inside collapsed sections. A disabled button ignores it, like for a user.
    async click(sel) {
      await need(sel);
      const disabled = await page.evaluate((sel) => { const el = document.querySelector(sel); el.click(); return !!el.disabled; }, sel);
      await sleep(300);
      return disabled ? 'clicked (it is disabled, so nothing happened)' : 'clicked';
    },
    // Taps the element's middle by touch, like a finger, after scrolling to it. Unlike `click`, it fails on a hidden,
    // covered or empty element, and says what covers it.
    async tap(sel) {
      if (MODE === 'desktop') throw new Error('tap needs NTR_PHONE');
      await need(sel);
      try {
        await page.tap(sel, { timeout: 5000 });
      } catch (e) {
        // Playwright's log, without its colors: what covers the element, or why it can't be tapped.
        const lines = e.message.replace(/\u001b\[\d+m/g, '').split('\n').map((l) => l.trim().replace(/^- /, ''));
        throw new Error('not tappable: ' + (lines.find((l) => /intercepts pointer events/.test(l)) || lines.find((l) => /^element is not/.test(l)) || lines[0]));
      }
      await sleep(300);
      return 'tapped';
    },
    // resize <W>x<H>   changes the screen size, for example to stand in for a phone's address bar showing or hiding.
    async resize(rest) {
      const m = rest.match(/^(\d+)x(\d+)$/);
      if (!m) throw new Error('usage: resize <width>x<height>');
      await page.setViewportSize({ width: +m[1], height: +m[2] });
      await sleep(500);
      return 'resized';
    },
    // set <css> | <text>   puts text in a field (also hidden ones; it sets value, so maxlength doesn't apply) and fires
    // input and change.
    async set(rest) {
      const [sel, text] = splitPipe(rest);
      await need(sel);
      await page.evaluate(({ sel, text }) => {
        const el = document.querySelector(sel);
        el.value = text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, { sel, text });
      await sleep(300);
      return 'set';
    },
    // upload <css> | <file> [<file>...]   puts files in a (hidden) file input. Buttons that pick a slot (a foreground
    // position, a speaker, a location) need a `click` on that Upload button first.
    async upload(rest) {
      const [sel, files] = splitPipe(rest);
      await page.setInputFiles(sel, files.split(/\s+/).filter(Boolean));
      await sleep(1500);
      return 'uploaded';
    },
    // The question the menu shows under the last button clicked: `ok` presses its main button, `cancel` its Cancel.
    async ok() { return askPress('.ntr_ask_ok'); },
    async cancel() { return askPress('.ntr_ask_cancel'); },
    // answer <text>   puts text in the open text question (a link, a theme name) and presses its main button.
    async answer(rest) {
      await need('.ntr_ask .ntr_ask_input');
      await page.evaluate((text) => {
        const input = document.querySelector('.ntr_ask .ntr_ask_input');
        input.value = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        document.querySelector('.ntr_ask .ntr_ask_ok').click();
      }, rest);
      // A link is loaded once to check it before the question closes.
      for (let i = 0; i < 40 && await page.evaluate(() => !!document.querySelector('.ntr_ask .ntr_ask_ok:disabled')); i++) await sleep(250);
      await sleep(500);
      const err = await page.evaluate(() => document.querySelector('.ntr_ask .ntr_terr')?.textContent || '');
      return err ? 'still open: ' + err : 'answered';
    },
    // eval <expression>   runs in the page (await allowed) and prints the result as JSON.
    async eval(code) {
      const r = await page.evaluate(async (code) => {
        const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
        const v = await new AsyncFunction('return (' + code + ')')();
        return v === undefined ? 'undefined' : JSON.stringify(v);
      }, code);
      return r;
    },
    // The open chat's NTR data as the server has it in the card file. When the page's copy is different, it's shown
    // below: a save still waiting (they go 0.7 s after the last change), or NTR's empty defaults, which it doesn't save.
    // A save the server turns down logs an error, which `errors` reports.
    async card() {
      const r = await page.evaluate(async () => {
        const c = SillyTavern.getContext(), ch = c.characters[c.characterId];
        if (!ch) return { err: 'no chat open' };
        const res = await fetch('/api/characters/get', { method: 'POST', headers: c.getRequestHeaders(), body: JSON.stringify({ avatar_url: ch.avatar }) });
        if (!res.ok) return { err: `reading the card failed: ${res.status}` };
        // Keys sorted, so the same data saved in another order still matches.
        const sorted = (v) => JSON.stringify(v ?? null, (k, x) => (x && typeof x === 'object' && !Array.isArray(x)
          ? Object.fromEntries(Object.keys(x).sort().map((key) => [key, x[key]])) : x));
        const file = (await res.json())?.data?.extensions?.ntr;
        return { file: JSON.stringify(file ?? null), same: sorted(file) === sorted(ch.data?.extensions?.ntr), page: JSON.stringify(ch.data?.extensions?.ntr ?? null) };
      });
      if (r.err) throw new Error(r.err);
      return r.same ? r.file : r.file + '\n  the page has: ' + r.page;
    },
    async ss(rest) {
      const file = path.join(SHOTS, (rest || 'page') + '.png');
      await page.screenshot({ path: file });
      return file;
    },
    // shot <name> <css>   a screenshot of one element.
    async shot(rest) {
      const [name, ...sel] = rest.split(' ');
      const file = path.join(SHOTS, name + '.png');
      await page.locator(sel.join(' ')).first().screenshot({ path: file });
      return file;
    },
    async wait(rest) { await sleep(Number(rest) || 1000); return 'waited'; },
    async reload() { await ready(); return 'reloaded'; },
    // Fails if there are any, so a run that ends with `errors` exits 1 on them.
    async errors() {
      const real = errors.filter((e) => !NOISE.test(e));
      if (!real.length) return `none (${errors.length} SillyTavern network errors ignored)`;
      console.log('  ' + real.join('\n  '));
      throw new Error(real.length + (real.length === 1 ? ' page error' : ' page errors'));
    },
  };

  let failed = 0;
  try {
    await ready();
    console.log('ready: SillyTavern with NTR ' + await page.evaluate(() => window.NTR.api.VERSION));
  } catch (e) {
    console.error('SillyTavern or the extension didn\'t load at ' + ST_URL + ': ' + e.message.split('\n')[0]);
    await browser.close();
    process.exit(1);
  }
  for (const line of lines) {
    const sp = line.indexOf(' ');
    const name = sp < 0 ? line : line.slice(0, sp);
    const rest = sp < 0 ? '' : line.slice(sp + 1).trim();
    console.log('> ' + line);
    if (!cmds[name]) { console.log('  ! unknown command'); failed++; continue; }
    try { console.log('  ' + await cmds[name](rest)); } catch (e) { console.log('  ! ' + e.message.split('\n')[0]); failed++; }
  }
  await browser.close();
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
