// Without avatars.js, the core still starts, at once rather than after its 5-second wait, says what's missing, and
// still loads the other look modules. NTR Avatars and Names and Pictures are set only on its page, so they stay off.
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.NTR_TEST_WITHOUT = ['avatars'];
const started = performance.now();
const { api } = await import('./env.mjs');
const took = performance.now() - started;

test('the core starts without avatars.js', () => {
  assert.equal(typeof api, 'object');
  assert.equal(window.NTR.avatars, undefined);
  assert.notEqual(api.moduleError('avatars'), '');
  assert.ok(window.NTR.elements && window.NTR.text && window.NTR.decor, 'the other look modules did not load without avatars.js');
  assert.ok(took < 4000, `the core waited ${Math.round(took)} ms for a file that isn't there`);
});

test('without avatars.js, NTR Avatars stay off', () => {
  const s = api.settings();
  Object.assign(s, { masterEnabled: true, avatarEnabled: true, aiEnabled: true, aiStyle: 'popout' });
  assert.equal(api.look.ntrAvatars(s, 'ai'), false);
});
