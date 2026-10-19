// Every name a module takes from the core's window.NTR.api (and its look part) is there. A missing one only shows up
// when the code using it runs, which for some settings is rare.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { api, ROOT, MODULES } from './env.mjs';

// `const { a, b: c } = A;` and `= A.look;`, the way the modules unpack what the core shares.
const taken = (src, from) => [...src.matchAll(new RegExp(`const \\{([^}]*)\\} = ${from.replace('.', '\\.')};`, 'g'))]
  .flatMap((m) => m[1].split(',').map((x) => x.split(':')[0].trim()).filter(Boolean));

for (const name of MODULES) {
  test(`${name}.js only takes names the core shares`, () => {
    const src = readFileSync(join(ROOT, `${name}.js`), 'utf8');
    for (const [from, obj] of [['A', api], ['A.look', api.look]]) {
      const missing = taken(src, from).filter((k) => obj[k] === undefined);
      assert.deepEqual(missing, [], `${name}.js takes ${missing.join(', ')} from ${from}, which the core doesn't share`);
    }
  });
}
