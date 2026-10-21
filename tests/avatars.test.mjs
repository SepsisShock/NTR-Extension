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

test('Fade Strength at its default keeps the even fade, and 0% has none', () => {
  const s = api.settings();
  Object.assign(s, { masterEnabled: true, avatarEnabled: true, aiEnabled: true, aiStyle: 'backdrop', aiShape: 'none', usEnabled: false, aiFadeBot: 30, aiFadeStr: 50 });
  assert.match(window.NTR.avatars.css(s), /linear-gradient\(to bottom, rgba\(0,0,0,0\) 0%, rgba\(0,0,0,1\) 0%, rgba\(0,0,0,1\) 70%, rgba\(0,0,0,0\) 100%\)/);
  s.aiFadeStr = 0;
  assert.doesNotMatch(window.NTR.avatars.css(s), /rgba\(0,0,0,0(\.\d+)?\) \d/);
  Object.assign(s, { aiFadeBot: 0, aiFadeStr: 50 });
});

test('Rotation turns the avatar, and Shape Only turns the picture back', () => {
  const s = api.settings();
  Object.assign(s, { masterEnabled: true, avatarEnabled: true, aiEnabled: true, aiStyle: 'inline', aiShape: 'square', usEnabled: false, aiRotate: 30, aiRotateMode: 'shape' });
  let css = window.NTR.avatars.css(s);
  assert.match(css, /transform: rotate\(30deg\) !important;/);
  assert.match(css, /rotate\(-30deg\) scale\(1\.366/);
  s.aiRotateMode = 'both';
  css = window.NTR.avatars.css(s);
  assert.match(css, /transform: rotate\(30deg\) !important;/);
  assert.doesNotMatch(css, /rotate\(-30deg\)/);
  Object.assign(s, { aiRotate: 0, aiRotateMode: 'shape', aiShape: 'none' });
});
