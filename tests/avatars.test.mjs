// Avatar Management comes from avatars.js, which the core loads before it starts. These check that it arrives in time
// and builds its CSS from what the core shares; what it looks like on screen still needs a run in SillyTavern.
import test from 'node:test';
import assert from 'node:assert/strict';
import { api } from './env.mjs';

test('the core loads Avatar Management before it starts', () => {
  assert.ok(window.NTR.avatars, 'avatars.js was not loaded by the core');
  assert.equal(window.NTR.avatars.version, api.VERSION);
  assert.equal(api.moduleError('avatars'), '');
});

test('Avatar Management builds its CSS, and none while NTR is off', () => {
  const s = api.settings();
  Object.assign(s, { masterEnabled: true, avatarEnabled: true, aiEnabled: true, aiStyle: 'backdrop', usEnabled: false, usShape: 'heart' });
  assert.equal(api.look.ntrAvatars(s, 'ai'), true);
  const css = window.NTR.avatars.css(s);
  // The AI side's Backdrop lays out the message.
  assert.match(css, /\.mes\[is_user="false"\] \{ position: relative !important; padding: 0 !important;/);
  // NTR Avatars off on the User side: SillyTavern's own avatar, untouched, whatever its Shape.
  assert.doesNotMatch(css, /is_user="true"/);
  s.masterEnabled = false;
  assert.equal(window.NTR.avatars.css(s), '');
  s.masterEnabled = true;
});
