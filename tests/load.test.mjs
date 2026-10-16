// Every file actually runs (not just parses) and registers itself with the same version as the core.
import test from 'node:test';
import assert from 'node:assert/strict';
import { api, load, MODULES } from './env.mjs';

test('the core registers its helpers', () => {
  assert.equal(typeof api, 'object');
  assert.match(api.VERSION, /^\d+\.\d+\.\d+$/);
});

for (const name of MODULES) {
  test(`${name}.js loads and matches the core version`, async () => {
    await load(name);
    assert.ok(window.NTR[name], `${name}.js did not register itself`);
    assert.equal(window.NTR[name].version, api.VERSION);
  });
}
