#!/usr/bin/env node
// Speed test for SillyTavern with or without NTR, in headless Chromium. Each run loads the page fresh, times its
// startup, opens the first character's chat and measures: a streamed reply (400 words, one every 15 ms, with a
// reasoning block), adding 80 messages, scrolling the long chat, 10 s of doing nothing and, with NTR's Layout on, two
// Edit Layout drags. CPU times come from Chromium's own counters, frame times from requestAnimationFrame. --cpu N has
// Chromium run the page N times slower. Results are saved as $NTR_BENCH/<name>.json (default /tmp/ntr-bench).
// `st.sh bench` sets up SillyTavern for a run and calls this; see SKILL.md.
//
//   node .claude/skills/run-ntr-extension/bench.cjs run <name> [--runs N] [--phone] [--vn] [--cpu N] [--ntr <version>]
//   node .claude/skills/run-ntr-extension/bench.cjs table <name> [name...]
const fs = require('fs');
const path = require('path');

const ST_URL = process.env.ST_URL || 'http://127.0.0.1:8000/';
const OUT = process.env.NTR_BENCH || '/tmp/ntr-bench';
// Without internet, SillyTavern's own AI Horde lookup fails with these; they aren't the extension's. A failed load
// only counts as noise by its address, so a missing NTR image still shows up.
const NOISE = /Internal S.*not valid JSON|\/api\/horde\/|favicon/i;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function loadPlaywright() {
  try { return require('playwright'); } catch (e) { /* try the global install below */ }
  try {
    const root = require('child_process').execSync('npm root -g').toString().trim();
    return require(path.join(root, 'playwright'));
  } catch (e) {
    console.error('Playwright (with Chromium) is needed and wasn\'t found.');
    process.exit(2);
  }
}

async function metrics(cdp) {
  const { metrics } = await cdp.send('Performance.getMetrics');
  return Object.fromEntries(metrics.map((m) => [m.name, m.value]));
}
// Milliseconds spent between two metric snapshots: running scripts, restyling, layout, and busy in total.
const spent = (a, b) => ({
  script: Math.round(1000 * (b.ScriptDuration - a.ScriptDuration)),
  style: Math.round(1000 * (b.RecalcStyleDuration - a.RecalcStyleDuration)),
  layout: Math.round(1000 * (b.LayoutDuration - a.LayoutDuration)),
  busy: Math.round(1000 * (b.TaskDuration - a.TaskDuration)),
});

// Run in the page: record the time between frames until stopFrames.
const startFrames = () => {
  window.__ntrFrames = []; window.__ntrFramesOn = true;
  let last = performance.now();
  const loop = (t) => { window.__ntrFrames.push(t - last); last = t; if (window.__ntrFramesOn) requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
};
const stopFrames = () => {
  window.__ntrFramesOn = false;
  const f = window.__ntrFrames.slice(1).sort((a, b) => a - b);
  const at = (q) => +f[Math.min(f.length - 1, Math.floor(q * f.length))].toFixed(1);
  return { frames: f.length, p95: at(0.95), slow: f.filter((x) => x > 50).length };
};

// Run in the page from its very start (an init script): the moment NTR's style tag appears, and SillyTavern's APP_READY.
// SillyTavern fires APP_READY again for a listener added after it, so one that runs while it's being added came late.
// Only in the page itself, not its frames, and only for `limit` ms, so nothing of it keeps running into the measurements.
const startupWatch = (limit) => {
  if (window !== window.top) return;
  // Chromium keeps 250 entries by default, fewer than SillyTavern's own files, so NTR's could be left out.
  performance.setResourceTimingBufferSize(5000);
  const m = window.__ntrStartup = { ntrStarted: null, stReady: null, stLate: false };
  const obs = new MutationObserver(() => {
    if (m.ntrStarted == null && document.getElementById('aw_dynamic_style')) m.ntrStarted = performance.now();
  });
  obs.observe(document, { childList: true, subtree: true });
  setTimeout(() => obs.disconnect(), limit);
  const hook = () => {
    let c = null;
    try { c = window.SillyTavern?.getContext?.(); } catch (e) { /* not ready yet */ }
    if (!c?.eventSource) { if (performance.now() < limit) requestAnimationFrame(hook); return; }
    let adding = true;
    c.eventSource.on(c.eventTypes.APP_READY, () => {
      if (m.stReady != null || m.stLate) return;
      if (adding) m.stLate = true; else m.stReady = performance.now();
      obs.disconnect();
    });
    adding = false;
  };
  requestAnimationFrame(hook);
};
// NTR's files that arrived before NTR started (its core and the look modules): when the last one did.
const startupFiles = () => {
  const m = window.__ntrStartup;
  if (m.ntrStarted == null) return null;
  const files = performance.getEntriesByType('resource')
    .filter((e) => /\/third-party\/NTR-Extension\/\w+\.js/.test(e.name) && e.responseEnd <= m.ntrStarted);
  return files.length ? Math.round(Math.max(...files.map((e) => e.responseEnd))) : null;
};

// Run in the page while a drag goes on: pointer moves, layouts aside, and how long each waits for the next frame,
// timed from the oldest of the moves Chromium merged into it to when the frame's callbacks run. Not the frame's own
// start time: a long task can push the callbacks well past it, and moves that came in meanwhile wait too.
const startMoves = () => {
  const d = window.__ntrDrag = { moves: 0, waiting: [], delays: [], on: true };
  d.onMove = (e) => { d.moves++; d.waiting.push((e.getCoalescedEvents?.()[0] || e).timeStamp); };
  window.addEventListener('pointermove', d.onMove, { capture: true, passive: true });
  const loop = () => {
    const t = performance.now();
    for (const ts of d.waiting) d.delays.push(t - ts);
    d.waiting = [];
    if (d.on) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
};
const stopMoves = () => {
  const d = window.__ntrDrag;
  d.on = false;
  window.removeEventListener('pointermove', d.onMove, { capture: true });
  const f = d.delays.sort((a, b) => a - b);
  return { moves: d.moves, delayP95: f.length ? +f[Math.min(f.length - 1, Math.floor(0.95 * f.length))].toFixed(1) : null };
};

// One Edit Layout drag: the item `first` picked, its outline (or grip `grip`) pressed, then a move every 16 ms for 2 s
// on a fixed timer, the way a mouse keeps sending whatever the page is doing, ending `amp` px out along `axis`. Through
// the one CDP session, so the input stays in order. Checks the item moved about that far, and that Undo put it back.
async function drag(page, cdp, opts, saves, { first, id, grip = '', axis, amp, sway }) {
  const T = opts.cpu;
  const saved = () => page.evaluate(() => JSON.stringify(Object.entries(NTR.api.settings()).filter(([k]) => k.startsWith('lay'))));
  const before = await saved();
  if (!(await page.evaluate((f) => NTR.api.startPlacement(f), first))) throw new Error(`Edit Layout didn't open for ${id}`);
  await sleep(500 * T);
  const at = await page.evaluate(({ id, grip }) => {
    const box = document.querySelector('#cb_place_layer .cb_place_box.cb_sel');
    if (box?.dataset.id !== id) return { error: `picked ${box?.dataset.id || 'nothing'}, not ${id}` };
    const target = grip ? box.querySelector(`.cb_place_grip.cb_on[data-g="${grip}"]`) : box;
    if (!target) return { error: `no ${grip} grip on ${id}` };
    const r = target.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    // The press has to land on the outline (or its label), or on the grip itself: Edit Layout's bar can cover either.
    const hit = document.elementFromPoint(x, y);
    const ok = hit === target || (target.contains(hit) && !hit.classList.contains('cb_place_grip'));
    if (!ok) return { error: `the press point on ${id} is covered by ${hit?.id || hit?.className || hit?.tagName}` };
    const b = box.getBoundingClientRect();
    return { x, y, box: { left: b.left, top: b.top } };
  }, { id, grip });
  if (at.error) throw new Error(at.error);
  const touch = opts.phone;
  const send = (type, x, y) => (touch
    ? cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] })
    : cdp.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 }));
  const N = 125;
  // Both end `amp` out: back and forth around the start, or out and back from it (a phone's chat panel only shrinks).
  const off = (k) => (sway ? amp * Math.sin(2 * Math.PI * 2.25 * k / N) : amp * (0.5 - 0.5 * Math.cos(2 * Math.PI * 2.5 * k / N)));
  const pos = (k) => (axis === 'x' ? [at.x + off(k), at.y] : [at.x, at.y + off(k)]);
  if (!touch) await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: at.x, y: at.y });
  const m0 = await metrics(cdp);
  await page.evaluate(startFrames);
  await page.evaluate(startMoves);
  await send(touch ? 'touchStart' : 'mousePressed', at.x, at.y);
  const sent = [];
  await new Promise((done) => {
    let k = 0;
    const iv = setInterval(() => {
      k++;
      // Caught at once, so a failed send fails the run below instead of stopping Node.
      sent.push(send(touch ? 'touchMove' : 'mouseMoved', ...pos(k)).then(() => null, (e) => e));
      if (k >= N) { clearInterval(iv); done(); }
    }, 16);
  });
  const failed = (await Promise.all(sent)).find(Boolean);
  if (failed) throw failed;
  await page.evaluate(() => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res))));
  // The counters stop before the release: they cover the moves only.
  const m1 = await metrics(cdp);
  const r = { ...spent(m0, m1), ...(await page.evaluate(stopFrames)), ...(await page.evaluate(stopMoves)) };
  const moved = await page.evaluate(({ axis }) => {
    const b = document.querySelector('#cb_place_layer .cb_place_box.cb_sel').getBoundingClientRect();
    return axis === 'x' ? b.left : b.top;
  }, { axis });
  const [ex, ey] = pos(N);
  await send(touch ? 'touchEnd' : 'mouseReleased', ex, ey);
  await sleep(300 * T);
  r.layoutsPerMove = r.moves ? +((m1.LayoutCount - m0.LayoutCount) / r.moves).toFixed(2) : null;
  r.restylesPerMove = r.moves ? +((m1.RecalcStyleCount - m0.RecalcStyleCount) / r.moves).toFixed(2) : null;
  r.distance = Math.round(moved - (axis === 'x' ? at.box.left : at.box.top));
  if (!(Math.abs(r.distance) >= amp / 2 && Math.abs(r.distance) <= amp * 1.5)) throw new Error(`${id} moved ${r.distance} px, not about ${amp}`);
  const undone = Date.now();
  await page.evaluate(() => { document.querySelector('#cb_place_undo').click(); document.querySelector('#cb_place_done').click(); });
  if ((await saved()) !== before) throw new Error(`Undo didn't put ${id} back`);
  // SillyTavern saves a second after the last change: wait for Undo's save to answer, so it can't land in what comes
  // next. A save starting sooner is the release's, which may still be on its way when Undo is pressed.
  const after = undone + 900;
  const until = Date.now() + 20000 * T;
  while (Date.now() < until && !(saves.since(after) && saves.open === 0)) await sleep(100);
  if (!saves.since(after) || saves.open) throw new Error(`the settings save after ${id}'s drag didn't finish`);
  return r;
}

async function once(chromium, opts) {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const context = await browser.newContext(opts.phone
    ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
    : { viewport: { width: 1400, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => { if (!NOISE.test(e.message)) errors.push('pageerror: ' + e.message); });
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    // "Failed to load resource" doesn't say which one; the address comes with the message.
    const url = m.text().startsWith('Failed to load resource') ? m.location()?.url : '';
    const e = 'console: ' + m.text() + (url ? ' (' + url + ')' : '');
    if (!NOISE.test(e)) errors.push(e);
  });
  page.on('dialog', (d) => d.accept());
  // SillyTavern's settings saves, so the run can wait for the last one before it ends.
  const saves = { open: 0, started: [], since: (t) => saves.started.some((x) => x >= t) };
  page.on('request', (q) => { if (q.url().includes('/api/settings/save')) { saves.open++; saves.started.push(Date.now()); } });
  const saveDone = (q) => { if (q.url().includes('/api/settings/save')) saves.open--; };
  page.on('requestfinished', saveDone);
  page.on('requestfailed', saveDone);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  // Waits for setup to finish grow with the slowdown; the measured parts keep their own times.
  const T = opts.cpu;
  if (T > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: T });
  await page.addInitScript(startupWatch, 60000 * T);
  const r = { cpu: T };

  let t = Date.now();
  await page.goto(ST_URL);
  await page.waitForFunction(() => window.SillyTavern?.getContext && SillyTavern.getContext().characters.length > 0, null, { timeout: 60000 * T });
  r.loadMs = Date.now() - t;
  await sleep(2500 * T); // extensions finish their first render
  r.ntr = await page.evaluate(() => window.NTR?.api?.VERSION || null);
  const st = await page.evaluate(() => window.__ntrStartup);
  if (st.stLate) throw new Error('APP_READY came before the startup timing was listening');
  r.startup = { stReady: st.stReady == null ? null : Math.round(st.stReady), ntrStarted: st.ntrStarted == null ? null : Math.round(st.ntrStarted), ntrFiles: await page.evaluate(startupFiles) };
  // The same loop on every machine, so a throttled run that wasn't shows up.
  r.cpuCheckMs = Math.round(await page.evaluate(() => { const a = performance.now(); let x = 0; for (let i = 0; i < 5e7; i++) x += i % 7; return performance.now() - a + x * 0; }));
  // A run meant for NTR stops here if it didn't load, rather than timing plain SillyTavern under NTR's name.
  if (opts.ntr && r.ntr !== opts.ntr) throw new Error(`expected NTR ${opts.ntr}, but the page has ${r.ntr || 'no NTR'}`);

  if (opts.vn) {
    if (!r.ntr) throw new Error('--vn needs NTR installed');
    if (!(await page.evaluate(() => !!window.NTR.api.settings().nodeEnabled))) await page.click('#cb_node_toggle');
    await page.waitForFunction(() => window.NTR.vn, null, { timeout: 20000 * T });
    await sleep(1500 * T);
  }

  t = Date.now();
  await page.evaluate(() => SillyTavern.getContext().selectCharacterById(0));
  await page.waitForFunction(() => document.querySelector('#chat .mes'), null, { timeout: 20000 * T });
  r.openChatMs = Date.now() - t;
  await sleep(2000 * T);
  if (opts.shot) await page.screenshot({ path: opts.shot });

  // A streamed reply, updated the way SillyTavern updates a message while streaming.
  let m0 = await metrics(cdp);
  await page.evaluate(startFrames);
  await page.evaluate(async () => {
    const ctx = SillyTavern.getContext();
    const msg = { name: ctx.name2, is_user: false, is_system: false, mes: '', send_date: Date.now(),
      extra: { reasoning: 'Okay, she is surprised but playful. Keep it short, tease a little, describe the light.', reasoning_duration: 4200 } };
    ctx.chat.push(msg);
    ctx.addOneMessage(msg);
    const id = ctx.chat.length - 1;
    const words = '*She tilts her head,* "Well, well. **Look** who finally showed up." The forest hums around them, leaves catching the last of the light.'.split(' ');
    for (let i = 0; i < 400; i++) {
      msg.mes += words[i % words.length] + (i % 60 === 59 ? '\n\n' : ' ');
      ctx.updateMessageBlock(id, msg);
      await ctx.eventSource.emit(ctx.eventTypes.STREAM_TOKEN_RECEIVED, msg.mes);
      await new Promise((res) => setTimeout(res, 15));
    }
    // A Pinned Block can match the small block at the end of each reply (SillyTavern makes the class custom-bench).
    msg.mes += '\n\n<div class="bench">Mood 0</div>';
    ctx.updateMessageBlock(id, msg);
    await ctx.eventSource.emit(ctx.eventTypes.MESSAGE_RECEIVED, id);
    await ctx.eventSource.emit(ctx.eventTypes.CHARACTER_MESSAGE_RENDERED, id);
  });
  await sleep(500);
  r.stream = { ...spent(m0, await metrics(cdp)), ...(await page.evaluate(stopFrames)) };

  // 80 more messages, user and character in turn, the character's with a reasoning block.
  m0 = await metrics(cdp);
  r.add80 = { ms: Math.round(await page.evaluate(async () => {
    const ctx = SillyTavern.getContext();
    const start = performance.now();
    for (let i = 0; i < 80; i++) {
      const user = i % 2 === 0;
      const msg = { name: user ? ctx.name1 : ctx.name2, is_user: user, is_system: false, send_date: Date.now(),
        extra: user ? {} : { reasoning: 'Thinking about how she would answer this, keeping her voice consistent.', reasoning_duration: 3100 },
        mes: `*Message ${i}.* "Some dialogue here, with **bold** and _italics_," she said.\n\nA second paragraph that runs a bit longer so the layout has real text to wrap around the avatar and the buttons.`
          + (user ? '' : `\n\n<div class="bench">Mood ${i}</div>`) };
      ctx.chat.push(msg);
      ctx.addOneMessage(msg);
      await ctx.eventSource.emit(user ? ctx.eventTypes.USER_MESSAGE_RENDERED : ctx.eventTypes.CHARACTER_MESSAGE_RENDERED, ctx.chat.length - 1);
    }
    await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
    return performance.now() - start;
  })) };
  await sleep(500);
  Object.assign(r.add80, spent(m0, await metrics(cdp)));

  // Scroll the long chat from top to bottom over 120 frames.
  m0 = await metrics(cdp);
  await page.evaluate(startFrames);
  await page.evaluate(async () => {
    const c = document.getElementById('chat');
    const max = c.scrollHeight - c.clientHeight;
    for (let i = 0; i <= 120; i++) { c.scrollTop = (max * i) / 120; await new Promise((res) => requestAnimationFrame(res)); }
  });
  r.scroll = { ...spent(m0, await metrics(cdp)), ...(await page.evaluate(stopFrames)) };

  // Nothing at all for 10 s: timers and animations that keep running.
  m0 = await metrics(cdp);
  await sleep(10000);
  const end = await metrics(cdp);
  r.idle = spent(m0, end);
  r.heapMB = +(end.JSHeapUsedSize / 1048576).toFixed(1);
  r.reasoningBlocks = await page.evaluate(() => [...document.querySelectorAll('#chat .mes_reasoning_details')]
    .filter((e) => getComputedStyle(e).display !== 'none').length);
  // full's Bench Reading block, showing the block from a message.
  r.pinShows = await page.evaluate(() => (window.NTR?.api?.settings().layPins?.some((p) => p.id === 'pin_read')
    ? !!document.querySelector('#ntr_pin_layer > .ntr_pin[data-pin="pin_read"] .custom-bench') : null));

  // Edit Layout drags, after idle so their saves stay out of it: the chat panel (on a phone it fills the screen, so its
  // top edge), and the Bench Reading block. Each is undone and saved, so the next run starts the same.
  if (r.ntr && !opts.vn && (await page.evaluate(() => !!NTR.api.settings().layEnabled))) {
    r.dragChat = await drag(page, cdp, opts, saves, opts.phone
      ? { first: 'lay', id: 'layChat', grip: 'n', axis: 'y', amp: 60, sway: false }
      : { first: 'lay', id: 'layChat', axis: 'x', amp: 120, sway: true });
    if (r.pinShows != null) r.dragPin = await drag(page, cdp, opts, saves, { first: 'pin_pin_read', id: 'pin_pin_read', axis: 'x', amp: opts.phone ? 50 : 120, sway: true });
  }
  r.errors = errors;
  await browser.close();
  return r;
}

async function warmUp(chromium) {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto(ST_URL);
  await page.waitForFunction(() => window.SillyTavern?.getContext && SillyTavern.getContext().characters.length > 0, null, { timeout: 60000 });
  await sleep(5000);
  await browser.close();
}

async function run(args) {
  const name = args[0];
  if (!name || name.startsWith('--')) throw new Error('usage: bench.cjs run <name> [--runs N] [--phone] [--vn] [--cpu N] [--ntr <version>]');
  const i = args.indexOf('--runs');
  const runs = i >= 0 ? Math.max(1, +args[i + 1] || 3) : 3;
  const v = args.indexOf('--ntr');
  const c = args.indexOf('--cpu');
  const cpu = c >= 0 ? Number(args[c + 1]) : 1;
  if (!(cpu >= 1)) throw new Error(`--cpu needs a number of 1 or more, not ${args[c + 1]}`);
  const opts = { phone: args.includes('--phone'), vn: args.includes('--vn'), cpu, ntr: v >= 0 ? args[v + 1] : '' };
  const { chromium } = loadPlaywright();
  fs.mkdirSync(OUT, { recursive: true });
  // The first page load after the server starts makes SillyTavern do first-time work (about 2 s more before it's
  // ready), so one load that isn't measured goes first.
  await warmUp(chromium);
  const results = [];
  for (let n = 1; n <= runs; n++) {
    const r = await once(chromium, { ...opts, shot: n === 1 ? path.join(OUT, name + '.png') : '' });
    results.push(r);
    console.log(`${name} run ${n}/${runs}: streaming busy ${r.stream.busy} ms, restyling ${r.stream.style} ms, idle busy ${r.idle.busy} ms`);
  }
  fs.writeFileSync(path.join(OUT, name + '.json'), JSON.stringify({ name, ...opts, results }, null, 1));
  console.log(`saved ${path.join(OUT, name + '.json')} and a screenshot next to it`);
  table([name]);
}

// One column per saved result, each number the middle of its runs.
function table(names) {
  const dragRows = (label, k) => [
    [`${label}: busy (ms)`, (r) => r[k]?.busy],
    [`${label}: layouts per move`, (r) => r[k]?.layoutsPerMove],
    [`${label}: restyles per move`, (r) => r[k]?.restylesPerMove],
    [`${label}: frames`, (r) => r[k]?.frames],
    [`${label}: 95% of frames under (ms)`, (r) => r[k]?.p95],
    [`${label}: frames over 50 ms`, (r) => r[k]?.slow],
    [`${label}: delay until the next frame, 95% under (ms)`, (r) => r[k]?.delayP95],
    [`${label}: moves`, (r) => r[k]?.moves],
  ];
  const rows = [
    ['NTR version', (r) => r.ntr || 'none'],
    ['CPU check (ms)', (r) => r.cpuCheckMs],
    ['page load (ms)', (r) => r.loadMs],
    ['startup: NTR files arrived (ms)', (r) => r.startup?.ntrFiles],
    ['startup: NTR started (ms)', (r) => r.startup?.ntrStarted],
    ['startup: SillyTavern ready (ms)', (r) => r.startup?.stReady],
    ['open chat (ms)', (r) => r.openChatMs],
    ['streaming: busy (ms)', (r) => r.stream.busy],
    ['streaming: scripts (ms)', (r) => r.stream.script],
    ['streaming: restyling (ms)', (r) => r.stream.style],
    ['streaming: 95% of frames under (ms)', (r) => r.stream.p95],
    ['streaming: frames over 50 ms', (r) => r.stream.slow],
    ['add 80 messages (ms)', (r) => r.add80.ms],
    ['add 80 messages: busy (ms)', (r) => r.add80.busy],
    ['scrolling: busy (ms)', (r) => r.scroll.busy],
    ['scrolling: 95% of frames under (ms)', (r) => r.scroll.p95],
    ['idle 10 s: busy (ms)', (r) => r.idle.busy],
    ['idle 10 s: scripts (ms)', (r) => r.idle.script],
    ['memory (MB)', (r) => r.heapMB],
    ['reasoning blocks shown', (r) => r.reasoningBlocks],
    ['pinned block shows', (r) => r.pinShows],
    ...dragRows('drag chat panel', 'dragChat'),
    ...dragRows('drag pinned block', 'dragPin'),
  ];
  const mid = (all) => {
    const list = all.filter((x) => x != null);
    if (!list.length) return '-';
    if (typeof list[0] !== 'number') return list.every((x) => x === list[0]) ? list[0] : 'mixed';
    const s = [...list].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  };
  const data = names.map((n) => JSON.parse(fs.readFileSync(path.join(OUT, n + '.json'), 'utf8')));
  const head = ['', ...data.map((d) => d.name + (d.phone ? ' (phone)' : '') + (d.vn ? ' (VN)' : '') + (d.cpu > 1 ? ` (cpu ${d.cpu}x)` : ''))];
  const body = rows.map(([label, f]) => [label, ...data.map((d) => String(mid(d.results.map(f))))]);
  const w = head.map((_, c) => Math.max(...[head, ...body].map((row) => row[c].length)));
  for (const row of [head, ...body]) console.log(row.map((cell, c) => (c ? cell.padStart(w[c]) : cell.padEnd(w[c]))).join('  '));
  for (const d of data) {
    const errs = [...new Set(d.results.flatMap((r) => r.errors))];
    console.log(`${d.name} errors: ${errs.length ? '\n  ' + errs.join('\n  ') : 'none'}`);
  }
}

const [cmd, ...rest] = process.argv.slice(2);
(async () => {
  if (cmd === 'run') await run(rest);
  else if (cmd === 'table' && rest.length) table(rest);
  else { console.error('usage: bench.cjs run <name> [--runs N] [--phone] [--vn] [--cpu N] [--ntr <version>] | bench.cjs table <name> [name...]'); process.exit(1); }
})().catch((e) => { console.error(e.message || e); process.exit(1); });
