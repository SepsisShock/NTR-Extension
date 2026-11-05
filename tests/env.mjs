// Loads the real extension files in plain Node, with just enough of the browser and SillyTavern stubbed out for
// them to start. Tests can check generated markup, CSS and menu binding; how it looks and works in a real page still
// needs a run in SillyTavern (see the run-ntr-extension skill).
import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = fileURLToPath(new URL('..', import.meta.url));
// Every top-level .js file but the core. The ones others need come first, in the order the core loads them: vn.js
// needs cast.js, and map.js and opening.js need vn.js.
const FIRST = ['cast', 'vn'];
export const MODULES = [...FIRST, ...readdirSync(ROOT).filter((f) => f.endsWith('.js')).map((f) => f.slice(0, -3)).filter((n) => n !== 'index' && !FIRST.includes(n))];
// The look modules, which the core loads itself before it starts (LOOK_MODULES in index.js).
export const LOOK = ['elements', 'text', 'avatars', 'decor', 'layout'];

const noop = () => {};
// Stands in for document and anything else the files only touch in passing: every property and call returns itself.
const any = new Proxy(function () {}, {
  get: (t, k) => (k === Symbol.toPrimitive ? () => '' : k in t ? t[k] : any),
  apply: () => any,
  construct: () => any,
});
class Observer { observe() {} disconnect() {} }

// What SillyTavern.getContext() returns. Tests set characters and characterId to pick the open chat.
export const context = {
  extensionSettings: {},
  characters: [],
  characterId: 0,
  saveSettingsDebounced: noop,
  writeExtensionFieldBulk: async () => ({ updated: [], skipped: [] }),
  constants: { unset: '__@@UNSET@@__' },
  accountStorage: { getItem: () => null, setItem: noop, removeItem: noop },
  getRequestHeaders: () => ({}),
};

Object.assign(globalThis, {
  window: globalThis,
  document: any,
  matchMedia: () => any,
  addEventListener: noop,
  jQuery: noop,
  $: noop,
  toastr: { info: noop, success: noop, warning: noop, error: noop },
  ResizeObserver: Observer,
  MutationObserver: Observer,
  SillyTavern: { getContext: () => context },
  fetch: async () => ({ ok: true, json: async () => ({}), text: async () => '' }),
});

// The files are copied as .mjs so Node always loads them as modules, without guessing from their syntax.
// They sit two folders down so regex.js finds a stand-in for SillyTavern's regex engine.
const dir = mkdtempSync(join(tmpdir(), 'ntr-test-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
const ext = join(dir, 'extensions', 'ntr');
mkdirSync(ext, { recursive: true });
mkdirSync(join(dir, 'regex'));
writeFileSync(join(dir, 'regex', 'engine.js'), 'export {};\n');
for (const name of ['index', ...MODULES]) cpSync(join(ROOT, `${name}.js`), join(ext, `${name}.mjs`));
// The core loads the look modules itself, by their own names, so they're there under those names too. Plain scripts
// like them run fine that way in Node. A test file that lists some in NTR_TEST_WITHOUT first sees the core without them.
const without = globalThis.NTR_TEST_WITHOUT ?? [];
for (const name of LOOK) if (!without.includes(name)) cpSync(join(ROOT, `${name}.js`), join(ext, `${name}.js`));

export const load = (name) => import(pathToFileURL(join(ext, `${name}.mjs`)).href);

const started = performance.now();
await load('index');
const took = performance.now() - started;
export const api = window.NTR.api;

// Without a look module, the core still starts, at once rather than after its 5-second wait, says what's missing, and
// still loads the other look modules.
for (const name of without) {
  test(`the core starts without ${name}.js`, () => {
    assert.equal(window.NTR[name], undefined);
    assert.notEqual(api.moduleError(name), '');
    assert.deepEqual(LOOK.filter((n) => !without.includes(n) && !window.NTR[n]), [], 'the other look modules did not load');
    assert.ok(took < 4000, `the core waited ${Math.round(took)} ms for a file that isn't there`);
  });
}

// Limits from NUM_RANGE in index.js: R.key is [min, max, step, ...].
export const R = new Proxy({}, { get: (_, k) => api.numRange(k) });

// Saved settings as SillyTavern hands them over when the page loads: a new object (here the current settings with
// `saved` on top), which the core brings up to date the first time it's asked for it.
export const reloadSettings = (saved) => {
  context.extensionSettings.chatvisuals = { ...structuredClone(context.extensionSettings.chatvisuals), ...saved };
  return api.settings();
};
