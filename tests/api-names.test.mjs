// Every name a module takes from the core's window.NTR.api (and its look part) is there. A missing one only shows up
// when the code using it runs, which for some settings is rare.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { api, ROOT, MODULES } from './env.mjs';

// The names a module unpacks, `const { a, b: c } = A;` or `= A.look;`, and the ones it uses as A.name or A.look.name.
const unpacked = (src, from) => [...src.matchAll(new RegExp(`const \\{([^}]*)\\} = ${from.replace('.', '\\.')};`, 'g'))]
  .flatMap((m) => m[1].split(',').map((x) => x.split(':')[0].trim()).filter(Boolean));
const used = (src, from) => [...src.matchAll(new RegExp(`(?<![\\w.$])${from.replace('.', '\\.')}\\.(\\w+)`, 'g'))].map((m) => m[1]);

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
