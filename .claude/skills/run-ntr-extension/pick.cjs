// Which scenarios a change needs, for scenarios.cjs --for. Each changed line belongs to a top-level unit (a function or
// value) of index.js or a module; coverage.json, which scenarios.cjs --record writes, says which scenarios run each
// unit in their own steps and which run it only while loading. With the pages each scenario uses and whether it reads
// style tags (from its session in scenarios.cjs), that picks the scenarios.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO = path.resolve(__dirname, '../../..');
const COVERAGE = path.join(__dirname, 'coverage.json');
const PAGES = ['themes', 'reader', 'layout', 'display', 'text', 'pfp', 'elements', 'fg', 'regex', 'agents'];
// The menu pages each module draws into. index.js's own menu code names its page in a pageHtml, lookPageHtml or
// modulePageHtml call, or takes the pages of the code using it.
const FILE_PAGES = { agents: ['agents'], avatars: ['pfp'], cast: ['pfp'], decor: ['display'], elements: ['elements'], fonts: ['text', 'elements'],
  layout: ['layout'], map: ['reader'], opening: ['reader'], overlays: ['fg'], reader: ['reader'], regex: ['regex'], text: ['text'], themes: ['themes'], vn: ['reader'] };
// Code that builds CSS, by name (textFormatCss, updateAvatarStyle): scenarios see it only in the style tags.
const CSS_NAME = /css|style/i;
// index.js code that loads NTR: settings, the modules and startup. Changing it can change anything.
const LOADS = new Set(['settings', 'loadSettings', 'loadModule', 'loadLookModules', 'callModule', 'startup', 'window.NTR', 'window.NTR.api']);

// The unit each line belongs to: top level is the file's outer wrapper, indented 2. Comments go with the unit below
// them, and other statements (a loop filling in DEFAULTS) with the declaration above. In index.js's startup, each
// event handler it sets up is its own unit (startup CHAT_CHANGED).
function units(text) {
  const lines = text.split('\n');
  const out = [];
  let cur = null;
  for (const l of lines) {
    const top = l.match(/^  (\S.*)$/)?.[1];
    if (top && !/^(\/\/|[}\])])/.test(top)) {
      const d = top.match(/^(?:async\s+)?function\*?\s+(\w+)/) || top.match(/^(?:const|let|var)\s+\{?\s*(\w+)/);
      cur = d ? d[1] : /^window\.NTR\.api\b/.test(top) ? 'window.NTR.api' : /^window\.NTR\b/.test(top) ? 'window.NTR'
        : /^(jQuery\(|await )/.test(top) ? 'startup' : cur;
    } else if (cur?.startsWith('startup')) {
      const s = l.match(/^    (\S.*)$/)?.[1];
      if (s && !/^(\/\/|[}\])])/.test(s)) {
        const k = s.match(/event_types\.(\w+)/) || s.match(/addEventListener\('(\w+)'/);
        cur = 'startup' + (k ? ' ' + k[1] : '');
      }
    }
    out.push(cur);
  }
  return out;
}

function pick(ref, head, scenarios) {
  const git = (...a) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
  const cov = JSON.parse(fs.readFileSync(COVERAGE, 'utf8'));
  const letters = Object.keys(scenarios).sort();
  const cssReaders = letters.filter((l) => scenarios[l].css);
  const holders = (f) => letters.filter((l) => scenarios[l].files.includes(f));
  const onPages = (ps) => letters.filter((l) => scenarios[l].pages.some((p) => ps.includes(p)));

  // Every file's text on the side being picked for, and which unit each of its lines is in.
  const read = (rev) => {
    const names = (rev ? git('ls-tree', '--name-only', rev).split('\n') : fs.readdirSync(REPO)).filter((n) => /^\w+\.js$/.test(n));
    const files = {};
    for (const n of names) {
      let text;
      try { text = rev ? git('show', `${rev}:${n}`) : fs.readFileSync(path.join(REPO, n), 'utf8'); } catch { continue; }
      const lines = text.split('\n');
      files[n.slice(0, -3)] = { lines, u: units(text) };
    }
    return files;
  };
  const before = read(ref), after = read(head);
  const decl = (F, u) => F.lines.find((l, i) => F.u[i] === u && !/^\s*\/\//.test(l)) || '';
  const isFn = (F, u) => /^  (?:async\s+)?function|^  (?:const|let)\s+\w+\s*=\s*(?:async\s*)?(?:\([^)]*\)|\w+)\s*=>|=\s*(?:async\s+)?function/.test(decl(F, u));
  // The units naming any of `words`, in the file itself and, for index.js, in the modules: what a changed value or a
  // new function reaches. Destructuring lines (const { a, b } = A) and window.NTR.api only pass names on.
  const users = (files, f, words, self) => {
    const re = new RegExp(`\\b(${words.join('|')})\\b`);
    const found = [];
    for (const [g, F] of Object.entries(files)) {
      if (g !== f && f !== 'index') continue;
      F.lines.forEach((l, i) => {
        const u = F.u[i];
        if (!u || (g === f && u === self) || u === 'window.NTR.api' || /^\s*\/\/|^  const \{/.test(l)) return;
        if (re.test(l.replace(/\/\/.*$/, '')) && !found.some(([h, v]) => h === g && v === u)) found.push([g, u]);
      });
    }
    return found;
  };
  const notes = new Set();
  // A unit's menu pages: its file's, or the pages its index.js page call names, or those of the code using it.
  const pagesOf = (files, f, u, seen) => {
    if (f !== 'index') return FILE_PAGES[f] || PAGES;
    const body = files.index.lines.filter((_, i) => files.index.u[i] === u).join('\n');
    const ps = new Set([...body.matchAll(/\bpageHtml\(\s*'(\w+)'/g)].map((m) => m[1]));
    for (const m of body.matchAll(/(?:lookPageHtml|modulePageHtml)\(\s*(?:s,\s*)?'(\w+)'/g)) for (const p of FILE_PAGES[m[1]] || PAGES) ps.add(p);
    if (ps.size) return [...ps];
    const by = users(files, f, [u], u).filter(([g, v]) => g !== 'index' || cov.files.index?.[v]?.[0].includes('H'));
    if (!by.length) return PAGES;
    for (const [g, v] of by) {
      const k = g + ':' + v;
      if (seen.has(k)) continue;
      seen.add(k);
      for (const p of pagesOf(files, g, v, seen)) ps.add(p);
    }
    return ps.size ? [...ps] : PAGES;
  };
  // The scenarios a change to unit u of file f needs, and why.
  const need = (files, f, u, keys, seen) => {
    const k = f + ':' + u;
    if (seen.has(k)) return { set: new Set(), why: '' };
    seen.add(k);
    const set = new Set(['H', ...holders(f)]);
    const all = (why) => ({ set: new Set(letters), why: why + ': all' });
    if (f === 'index' && LOADS.has(u)) return all('loads NTR');
    const rec = cov.files[f]?.[u];
    const ran = !!(rec?.[0] || rec?.[1]);
    const noRun = (why) => { notes.add(`${f}.js ${u}: no scenario runs it; test it with driver commands.`); return { set, why }; };
    const viaUsers = (words, what) => {
      const by = users(files, f, words, u);
      if (!by.length) return null;
      for (const [g, v] of by) for (const l of need(files, g, v, null, seen).set) set.add(l);
      return { set, why: `${what}, used by ${by.slice(0, 3).map(([g, v]) => (g === f ? v : `${g}.js ${v}`)).join(', ')}${by.length > 3 ? ` and ${by.length - 3} more` : ''}` };
    };
    // A startup line that only hands SillyTavern an event handler: what the handler runs.
    if (u.startsWith('startup ') && !ran) return noRun('event handler no scenario runs');
    if (!isFn(files[f], u)) {
      // A value: what uses the keys on the changed lines (one DEFAULTS entry), else the functions inside it, else what
      // uses the value.
      const r = keys?.length && viaUsers(keys, `value (${keys.slice(0, 3).join(', ')})`);
      if (r) return r;
      if (!ran) return viaUsers([u], 'value') || all('value nothing else names');
    } else if (!rec) return viaUsers([u], 'new since coverage.json') || all('new since coverage.json, and nothing uses it yet');
    const [bodyRun, loadRun] = rec;
    const css = CSS_NAME.test(u);
    if (!ran) return noRun('no scenario runs it');
    if (css && letters.every((l) => loadRun.includes(l))) {
      for (const l of cssReaders) set.add(l);
      for (const l of bodyRun) if (cssReaders.includes(l)) set.add(l);
      return { set, why: 'CSS every scenario builds while loading: the ones reading style tags' };
    }
    if (!bodyRun) return { set, why: 'runs only while loading' };
    if (bodyRun.includes('H')) {
      const ps = pagesOf(files, f, u, new Set());
      for (const l of onPages(ps)) set.add(l);
      return { set, why: `menu code, ${ps.length === PAGES.length ? 'every page' : 'pages ' + ps.join(', ')}` };
    }
    for (const l of bodyRun) if (!css || cssReaders.includes(l)) set.add(l);
    return { set, why: `run by ${[...bodyRun].join(' ')}${css ? ', of those reading style tags' : ''}` };
  };

  const range = head ? [ref, head] : [ref];
  const changed = git('diff', '--name-only', ...range).split('\n').filter(Boolean);
  const total = new Set();
  const lines = [];
  if (changed.includes('style.css')) notes.add('style.css changed: follow CLAUDE.md\'s style.css rule, which this doesn\'t cover.');
  for (const name of changed.filter((n) => /^\w+\.js$/.test(n))) {
    const f = name.slice(0, -3);
    // Changed lines by unit, from both sides, leaving out comments, blank lines and the version number.
    const hit = new Map();
    let o = 0, n = 0;
    for (const l of git('diff', '-U0', ...range, '--', name).split('\n')) {
      const h = l.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)/);
      if (h) { o = +h[1]; n = +h[2]; continue; }
      if (/^(---|\+\+\+) /.test(l) || !/^[-+]/.test(l)) continue;
      const side = l[0] === '-' ? before[f] : after[f];
      const i = l[0] === '-' ? o++ - 1 : n++ - 1;
      const code = l.slice(1).trim();
      const u = side?.u[i];
      if (!u || !code || code.startsWith('//') || /^const \w*VERSION = /.test(code)) continue;
      // A changed window.NTR.api entry stands for the index.js functions it names.
      const api = u === 'window.NTR.api' && f === 'index';
      const targets = api ? [...new Set(code.match(/\w+/g))].filter((w) => w !== u && (after.index?.u.includes(w) || before.index?.u.includes(w))) : [u];
      for (const t of targets.length ? targets : [u]) {
        if (!hit.has(t)) hit.set(t, { files: after[f]?.u.includes(t) ? after : before, keys: [] });
        // Setting-style keys (tfNameFont, agMax) on a value's line: its users are what uses those keys.
        if (!api) for (const m of code.matchAll(/(?:^|[{,]\s*)([a-z]+[A-Z]\w*)\s*:/g)) hit.get(t).keys.push(m[1]);
      }
    }
    for (const [u, { files, keys }] of hit) {
      const r = need(files, f, u, keys, new Set());
      for (const l of r.set) total.add(l);
      lines.push(`${name} ${u}: ${[...r.set].sort().join('')} (${r.why})`);
    }
  }
  return { letters: [...total].sort(), all: letters, lines, notes: [...notes], recorded: cov.recorded };
}

module.exports = { units, pick, COVERAGE, PAGES };
