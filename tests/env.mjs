// Loads the real extension files in plain Node, with just enough of the browser and SillyTavern stubbed out for
// them to start. Only the code that runs before SillyTavern is ready gets exercised: menus, styling and anything
// drawn on screen still need a run in SillyTavern (see the run-ntr-extension skill).
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = fileURLToPath(new URL('..', import.meta.url));
export const MODULES = ['cast', 'vn', 'map', 'opening', 'overlays', 'regex', 'reader', 'agents', 'elements', 'text', 'avatars', 'decor'];
// The look modules, which the core loads itself before it starts (LOOK_MODULES in index.js).
export const LOOK = ['elements', 'text', 'avatars', 'decor'];

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
  writeExtensionField: async () => {},
  getRequestHeaders: () => ({}),
};

Object.assign(globalThis, {
  window: globalThis,
  document: any,
  localStorage: any,
  matchMedia: () => any,
  addEventListener: noop,
  jQuery: noop,
  $: noop,
  toastr: { info: noop, success: noop, warning: noop, error: noop },
  ResizeObserver: Observer,
  MutationObserver: Observer,
  IntersectionObserver: Observer,
  SillyTavern: { getContext: () => context },
  fetch: async () => ({ ok: true, json: async () => ({}), text: async () => '' }),
});

// The files are copied as .mjs so Node always loads them as modules, without guessing from their syntax (like CI's
// parse check). They sit two folders down so regex.js finds a stand-in for SillyTavern's regex engine.
const dir = mkdtempSync(join(tmpdir(), 'ntr-test-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
const ext = join(dir, 'extensions', 'ntr');
mkdirSync(ext, { recursive: true });
mkdirSync(join(dir, 'regex'));
writeFileSync(join(dir, 'regex', 'engine.js'), 'export {};\n');
for (const name of ['index', ...MODULES]) cpSync(join(ROOT, `${name}.js`), join(ext, `${name}.mjs`));
// The core loads the look modules itself, by their own names, so they're there under those names too. Plain scripts
// like them run fine that way in Node. A test that lists some in NTR_TEST_WITHOUT first sees the core without them.
for (const name of LOOK) if (!globalThis.NTR_TEST_WITHOUT?.includes(name)) cpSync(join(ROOT, `${name}.js`), join(ext, `${name}.js`));

export const load = (name) => import(pathToFileURL(join(ext, `${name}.mjs`)).href);

await load('index');
export const api = window.NTR.api;
