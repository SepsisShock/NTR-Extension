// Every name a module takes from the core's window.NTR.api (and its look part) is there. A missing one only shows up
// when the code using it runs, which for some settings is rare.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { api, load, ROOT, MODULES } from './env.mjs';

// The names a module unpacks, `const { a, b: c } = A;` or `= A.look;`, and the ones it uses as A.name or A.look.name.
const unpacked = (src, from) => [...src.matchAll(new RegExp(`const \\{([^}]*)\\} = ${from.replace('.', '\\.')};`, 'g'))]
  .flatMap((m) => m[1].split(',').map((x) => x.split(':')[0].trim()).filter(Boolean));
const used = (src, from) => [...src.matchAll(new RegExp(`(?<![\\w.$])${from.replace('.', '\\.')}\\.(\\w+)`, 'g'))].map((m) => m[1]);

// The other way: every call the core or a module makes into a module names something that module has. callModule
// catches what goes wrong, so a misspelled one would only show as a part that quietly stopped working.
test('the core and modules only call what the modules have', async () => {
  for (const name of MODULES) await load(name);
  const src = ['index', ...MODULES].map((n) => readFileSync(join(ROOT, `${n}.js`), 'utf8')).join('\n');
  const all = (re) => [...src.matchAll(re)];
  const calls = all(/callModule\('(\w+)', '(\w+)'/g).map((m) => [m[1], m[2]]);
  assert.ok(calls.length > 0, 'found no calls into the modules');
  // Calls that get the module's name as `name`: from the helpers that pass on the name they're given, with what each
  // calls (a module page binds through bindOf unless it brings its own `bind`), and from a loop over names.
  const PASSED = [[/\bbindOf\('(\w+)'\)/g, 'bind'], [/\bmodulePageHtml\(s, '(\w+)'(?!.*\bbind:)/g, 'bind'],
    [/\b(?:lookPageHtml\(|modulePageHtml\(s, |subSection\()'(\w+)'/g, 'sectionHtml']];
  for (const [re, fn] of PASSED) calls.push(...all(re).map((m) => [m[1], fn]));
  for (const m of all(/for \(const name of \[([^\]]*)\]\) (?:A\.)?callModule\(name, '(\w+)'/g)) calls.push(...m[1].match(/\w+/g).map((mod) => [mod, m[2]]));
  // Those are the 5 calls that don't name their module in quotes: bindOf, lookPageHtml and modulePageHtml in the core,
  // and subSection and the bind loop in vn.js. One written another way would go unchecked, so it fails here.
  assert.equal(all(/(?<!function )callModule\((?!')/g).length, 5, 'a call that doesn\'t name its module in quotes changed: PASSED has to follow');
  const missing = calls.filter(([mod, fn]) => typeof window.NTR[mod]?.[fn] !== 'function').map(([mod, fn]) => `${mod}.${fn}`);
  assert.deepEqual(missing, [], `${missing.join(', ')} is called, but the module doesn't have it`);
});

for (const name of MODULES) {
  test(`${name}.js only takes names the core shares`, () => {
    const src = readFileSync(join(ROOT, `${name}.js`), 'utf8');
    // Every module unpacks some names. None found means the way it does it changed and this test needs to follow.
    assert.ok(unpacked(src, 'A').length > 0, `found no names ${name}.js unpacks from A`);
    for (const [from, obj] of [['A', api], ['A.look', api.look]]) {
      const missing = [...new Set([...unpacked(src, from), ...used(src, from)])].filter((k) => obj[k] === undefined);
      assert.deepEqual(missing, [], `${name}.js takes ${missing.join(', ')} from ${from}, which the core doesn't share`);
    }
  });
}
