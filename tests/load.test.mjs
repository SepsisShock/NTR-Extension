// Every file actually runs (not just parses) and registers itself with the same version as the core. The core loads
// the look modules itself before it starts.
import test from 'node:test';
import assert from 'node:assert/strict';
import { api, load, LOOK, MODULES } from './env.mjs';

test('the core registers its helpers', () => {
  assert.equal(typeof api, 'object');
  assert.match(api.VERSION, /^\d+\.\d+\.\d+$/);
});

for (const name of MODULES) {
  const look = LOOK.includes(name);
  test(look ? `the core loads ${name}.js before it starts` : `${name}.js loads and matches the core version`, async () => {
    if (look) assert.equal(api.moduleError(name), '');
    else await load(name);
    assert.ok(window.NTR[name], `${name}.js did not register itself`);
    assert.equal(window.NTR[name].version, api.VERSION);
  });
}
