#!/usr/bin/env node
// Speed test for SillyTavern with or without NTR, in headless Chromium. Each run loads the page fresh, opens the
// first character's chat and measures: a streamed reply (400 words, one every 15 ms, with a reasoning block),
// adding 80 messages, scrolling the long chat, and 10 s of doing nothing. CPU times come from Chromium's own
// counters, frame times from requestAnimationFrame. Results are saved as $NTR_BENCH/<name>.json (default /tmp/ntr-bench).
// `st.sh bench` sets up SillyTavern for a run and calls this; see SKILL.md.
//
//   node .claude/skills/run-ntr-extension/bench.cjs run <name> [--runs N] [--phone] [--vn]
//   node .claude/skills/run-ntr-extension/bench.cjs table <name> [name...]
const fs = require('fs');
const path = require('path');

const ST_URL = process.env.ST_URL || 'http://127.0.0.1:8000/';
const OUT = process.env.NTR_BENCH || '/tmp/ntr-bench';
// Without internet, SillyTavern's own AI Horde lookup fails with these; they aren't the extension's.
const NOISE = /Internal S.*not valid JSON|Failed to load resource|favicon/i;
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

async function once(chromium, opts) {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const context = await browser.newContext(opts.phone
    ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
    : { viewport: { width: 1400, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => { if (!NOISE.test(e.message)) errors.push('pageerror: ' + e.message); });
  page.on('console', (m) => { if (m.type() === 'error' && !NOISE.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('dialog', (d) => d.accept());
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  const r = {};

  let t = Date.now();
  await page.goto(ST_URL);
  await page.waitForFunction(() => window.SillyTavern?.getContext && SillyTavern.getContext().characters.length > 0, null, { timeout: 60000 });
  r.loadMs = Date.now() - t;
  await sleep(2500); // extensions finish their first render
  r.ntr = await page.evaluate(() => window.NTR?.api?.VERSION || null);

  if (opts.vn) {
    if (!r.ntr) throw new Error('--vn needs NTR installed');
    if (!(await page.evaluate(() => !!window.NTR.api.settings().nodeEnabled))) await page.click('#cb_node_toggle');
    await page.waitForFunction(() => window.NTR.vn, null, { timeout: 20000 });
    await sleep(1500);
  }

  t = Date.now();
  await page.evaluate(() => SillyTavern.getContext().selectCharacterById(0));
  await page.waitForFunction(() => document.querySelector('#chat .mes'), null, { timeout: 20000 });
  r.openChatMs = Date.now() - t;
  await sleep(2000);
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
        mes: `*Message ${i}.* "Some dialogue here, with **bold** and _italics_," she said.\n\nA second paragraph that runs a bit longer so the layout has real text to wrap around the avatar and the buttons.` };
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
  r.errors = errors;
  await browser.close();
  return r;
}

async function run(args) {
  const name = args[0];
  if (!name || name.startsWith('--')) throw new Error('usage: bench.cjs run <name> [--runs N] [--phone] [--vn]');
  const i = args.indexOf('--runs');
  const runs = i >= 0 ? Math.max(1, +args[i + 1] || 3) : 3;
  const opts = { phone: args.includes('--phone'), vn: args.includes('--vn') };
  const { chromium } = loadPlaywright();
  fs.mkdirSync(OUT, { recursive: true });
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
  const rows = [
    ['NTR version', (r) => r.ntr || 'none'],
    ['page load (ms)', (r) => r.loadMs],
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
  ];
  const mid = (list) => {
    if (typeof list[0] !== 'number') return list[0];
    const s = [...list].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  };
  const data = names.map((n) => JSON.parse(fs.readFileSync(path.join(OUT, n + '.json'), 'utf8')));
  const head = ['', ...data.map((d) => d.name + (d.phone ? ' (phone)' : '') + (d.vn ? ' (VN)' : ''))];
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
  else { console.error('usage: bench.cjs run <name> [--runs N] [--phone] [--vn] | bench.cjs table <name> [name...]'); process.exit(1); }
})().catch((e) => { console.error(e.message || e); process.exit(1); });
