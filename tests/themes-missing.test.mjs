// Without themes.js, the menu still opens and the core knows the module failed.
// In Node the core never finds themes.js, so it's missing here.
import test from 'node:test';
import assert from 'node:assert/strict';
import { api } from './env.mjs';

test('the menu opens without themes.js', async () => {
  assert.equal(window.NTR.themes, undefined);
  api.openMenu();
  assert.equal(await api.loadModule('themes'), null);
  assert.notEqual(api.moduleError('themes'), '');
});

