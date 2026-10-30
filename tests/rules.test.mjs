// The CLAUDE.md rules a script can check: what stays in the core, upload names and uploadHere, slider ranges, imports
// between NTR files, and missing-module tests. Each failure says what the rule is, so fixing it doesn't need CLAUDE.md.
// The rules that take judgment (cleaning new card fields, reading numbers through rangeNum) stay in CLAUDE.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { api, ROOT, MODULES, LOOK } from './env.mjs';

const read = (name) => readFileSync(join(ROOT, `${name}.js`), 'utf8');
const SRC = Object.fromEntries(['index', ...MODULES].map((name) => [`${name}.js`, read(name)]));
const core = SRC['index.js'];
const modules = Object.entries(SRC).filter(([file]) => file !== 'index.js');

// The arguments of the call whose `(` is at `at`, as source text, split at the commas that aren't inside brackets.
function callArgs(src, at) {
  const args = [];
  let depth = 0, start = at + 1;
  for (let i = at; i < src.length; i++) {
    const c = src[i];
    if (c === "'" || c === '"' || c === '`') { i = src.indexOf(c, i + 1); continue; }
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c) && --depth === 0) { args.push(src.slice(start, i).trim()); return args; }
    else if (c === ',' && depth === 1) { args.push(src.slice(start, i).trim()); start = i + 1; }
  }
  throw new Error(`unclosed call at ${at}`);
}
// Every call to one of `names` in `src`, as [name, args, index].
const calls = (src, names) => [...src.matchAll(new RegExp(`(?<![\\w.$])(?:A\\.)?(${names.join('|')})\\(`, 'g'))]
  .filter((m) => !/function\s+$/.test(src.slice(0, m.index)))
  .map((m) => [m[1], callArgs(src, m.index + m[0].length - 1), m.index]);
const literal = (arg) => /^'(\w+)'$/.exec(arg || '')?.[1];

test('settings, ranges, cleaning and upload names are defined only in index.js', () => {
  const owned = ['DEFAULTS', 'NUM_RANGE', 'cleanStore', 'loadSettings', 'OWN_FILE'];
  const def = (name) => new RegExp(`\\b(?:const|let|var|function)\\s+${name}\\b`);
  for (const name of owned) assert.match(core, def(name), `index.js no longer defines ${name}; this test needs to follow`);
  const found = modules.flatMap(([file, src]) => [
    ...owned.filter((name) => def(name).test(src)).map((name) => `${file} defines ${name}`),
    ...(/\bextensionSettings\b/.test(src) ? [`${file} uses extensionSettings`] : []),
  ]);
  assert.deepEqual(found, [], `${found.join('; ')}. These belong in index.js; modules read settings through A.settings().`);
});

// The prefix an upload call passes, as the names it can stand for. `fg_${pos}` stands for any fg_ name; L.prefix for
// the prefix: entries in vn.js; ...o.upload for the upload: entries bindPicSlot gets.
const listed = (re) => [...new Set(Object.values(SRC).flatMap((src) => [...src.matchAll(re)].map((m) => m[1])))];
const PREFIX_OF = {
  'L.prefix': listed(/\bprefix: '(\w+)'/g),
  '...o.upload': listed(/\bupload: \['(\w+)'/g),
};
const prefixNames = (arg) => literal(arg) ? [literal(arg)] : /^`\w+\$\{[^}]*\}`$/.test(arg) ? [arg.slice(1, -1).replace(/\$\{[^}]*\}/, 'x')] : PREFIX_OF[arg];
const uploads = Object.entries(SRC).flatMap(([file, src]) => calls(src, ['uploadImage', 'uploadVideo'])
  .map(([, args, at]) => ({ file, prefix: args[1], wrapped: /uploadHere\(\(\) => $/.test(src.slice(at - 40, at)) })));

test('every upload name is one the cleanup recognizes', () => {
  assert.ok(uploads.length > 0, 'found no upload calls');
  for (const [k, v] of Object.entries(PREFIX_OF)) assert.ok(v.length > 0, `found no names for ${k}; this test needs to follow`);
  const ownFile = new RegExp(/const OWN_FILE = \/(.+)\/;/.exec(core)[1]);
  const unread = uploads.filter((u) => !prefixNames(u.prefix)).map((u) => `${u.file}: ${u.prefix}`);
  assert.deepEqual(unread, [], `can't tell the upload name of ${unread.join(', ')}; teach prefixNames in this test`);
  const bad = [...new Set(uploads.flatMap((u) => prefixNames(u.prefix)))].filter((p) => !ownFile.test(`user/files/${p}_a.png`));
  assert.deepEqual(bad, [], `upload names ${bad.join(', ')} aren't in OWN_FILE in index.js, so their files would never be cleaned up`);
});

// Uploads that save to the global settings, so a chat change during the upload can't put them on the wrong character.
// The bindPicSlot one covers every upload: entry, so a per-chat picture slot added there would pass this test.
const GLOBAL_UPLOADS = ['agents.js: \'agent\'', 'avatars.js: \'avframe\'', 'elements.js: \'baricon\'', 'vn.js: \'vnart\'',
  'index.js: \'book\'', 'index.js: ...o.upload'];

test('per-chat uploads go through uploadHere', () => {
  const loose = [...new Set(uploads.filter((u) => !u.wrapped).map((u) => `${u.file}: ${u.prefix}`))];
  const unknown = loose.filter((u) => !GLOBAL_UPLOADS.includes(u));
  assert.deepEqual(unknown, [], `${unknown.join(', ')} not wrapped in uploadHere. Wrap it if it saves to the chat or card; add it to GLOBAL_UPLOADS in this test if it saves to global settings.`);
  const stale = GLOBAL_UPLOADS.filter((u) => !loose.includes(u));
  assert.deepEqual(stale, [], `GLOBAL_UPLOADS lists ${stale.join(', ')}, which no longer exist; remove them`);
});

// Inputs allowed to write their own min and max: ovSlider (rangeSlider's backend), vn.js and opening.js until
// NUM_RANGE is shared (see ROADMAP.md), and the Book's page number, which isn't a setting.
const OWN_LIMITS = [['index.js', 'class="m_o_sl"'], ['vn.js', ''], ['opening.js', ''], ['reader.js', 'max="${n}"']];

test('sliders and number boxes take their limits from NUM_RANGE', () => {
  const tags = Object.entries(SRC).flatMap(([file, src]) => [...src.matchAll(/<input\b[^>]*\btype="(?:range|number)"[^>]*>/g)].map((m) => [file, m[0]]));
  assert.ok(tags.length > 0, 'found no sliders');
  const own = tags.filter(([file, tag]) => /\bm(?:in|ax)="/.test(tag) && !tag.includes('rangeAttrs('));
  const bad = own.filter(([file, tag]) => !OWN_LIMITS.some(([f, has]) => f === file && tag.includes(has))).map(([file, tag]) => `${file}: ${tag.slice(0, 80)}`);
  assert.deepEqual(bad, [], `these write their own min/max:\n${bad.join('\n')}\nDefine the range in NUM_RANGE and use rangeSlider or rangeAttrs.`);
  const ov = calls(core, ['ovSlider']);
  assert.ok(ov.length === 1 && /const rangeSlider = [^\n]*$/.test(core.slice(0, ov[0][2]).split('\n').pop()),
    'ovSlider writes its own min/max, so only rangeSlider may call it');
});

test('NUM_RANGE entries have the right shape, and every key used has one', () => {
  const RANGE_CALLS = { rangeNum: 1, rangeSlider: 1, cardNum: 1, rangeAttrs: 0, numRange: 0 };
  const used = Object.entries(SRC).flatMap(([file, src]) => calls(src, Object.keys(RANGE_CALLS))
    .map(([name, args]) => [file, name, literal(args[RANGE_CALLS[name]])]).filter(([, , k]) => k));
  assert.ok(used.length > 0, 'found no range calls');
  const missing = used.filter(([, , k]) => !api.numRange(k)).map(([file, name, k]) => `${file}: ${name}('${k}')`);
  assert.deepEqual(missing, [], `no NUM_RANGE entry for ${missing.join(', ')}`);
  const noStep = used.filter(([, name, k]) => /^range(?:Attrs|Slider)$/.test(name) && api.numRange(k).length < 4).map(([file, name, k]) => `${file}: ${name}('${k}')`);
  assert.deepEqual(noStep, [], `${noStep.join(', ')} would get step="undefined": give the entry a step and unit`);
  const keys = new Set([...Object.keys(api.DEFAULTS).filter((k) => api.numRange(k)), ...used.map(([, , k]) => k)]);
  const bad = [...keys].filter((k) => {
    const [min, max, step, , smin = min, smax = max] = api.numRange(k), n = api.numRange(k).length;
    return ![2, 4, 6].includes(n) || !(min <= max) || (n > 2 && !(step > 0)) || !(min <= smin && smin <= smax && smax <= max);
  });
  assert.deepEqual(bad, [], `NUM_RANGE entries ${bad.join(', ')} aren't [min, max], [min, max, step, unit] or [min, max, step, unit, sliderMin, sliderMax] with min <= sliderMin <= sliderMax <= max`);
});

test('modules don\'t import other NTR files', () => {
  const ntr = new Set(['index', ...MODULES]);
  // Static imports, and the quoted paths inside each import(...) call.
  const specs = (src) => [...[...src.matchAll(/^\s*import\s+(?:[\w$\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/gm)].map((m) => m[1]),
    ...calls(src, ['import']).flatMap(([, args]) => [...args.join(',').matchAll(/['"`]([^'"`]+)['"`]/g)].map((m) => m[1]))];
  assert.deepEqual(specs(SRC['regex.js']), ['../../regex/engine.js'], 'regex.js\'s import of SillyTavern\'s regex engine changed; this test needs to follow');
  const found = modules.flatMap(([file, src]) => specs(src)
    .filter((spec) => ntr.has(spec.split('/').pop().replace(/\.m?js$/, '')))
    .map((spec) => `${file} imports ${spec}`));
  assert.deepEqual(found, [], `${found.join('; ')}. Modules use window.NTR instead.`);
});

test('every look module has a missing-module test', () => {
  const lookModules = Object.keys(Function(`return ${/const LOOK_MODULES = (\{[^}]*\});/.exec(core)[1]}`)());
  assert.deepEqual([...LOOK].sort(), lookModules.sort(), 'LOOK in tests/env.mjs no longer matches LOOK_MODULES in index.js');
  const missing = LOOK.filter((name) => !existsSync(join(ROOT, 'tests', `${name}-missing.test.mjs`)));
  assert.deepEqual(missing, [], `no tests/<name>-missing.test.mjs for ${missing.join(', ')}`);
});
