// UI Decor comes from decor.js, which the core loads before it starts. These check that it arrives in time and builds
// its CSS from what the core shares; what it looks like on screen still needs a run in SillyTavern.
import test from 'node:test';
import assert from 'node:assert/strict';
import { api } from './env.mjs';

test('the core loads UI Decor before it starts', () => {
  assert.ok(window.NTR.decor, 'decor.js was not loaded by the core');
  assert.equal(window.NTR.decor.version, api.VERSION);
  assert.equal(api.moduleError('decor'), '');
});

test('UI Decor builds only its own CSS, and none while it is off', () => {
  const s = api.settings();
  Object.assign(s, { masterEnabled: true, ovEnabled: true, ovBubOn: true, ovBubTail: 'pointed', ovBubAlign: 'sides', ovShapeOn: true, ovShape: 'square',
    layEnabled: true, ovMesGapOn: true, avatarEnabled: true, ovNamesOn: true });
  assert.equal(api.look.bubblesOn(s), true);
  const css = window.NTR.decor.css(s);
  // Interface Shape on SillyTavern's Menu Bar, and the User side's bubble on the right.
  assert.match(css, /body #top-bar, body \.drawer-content,/);
  assert.match(css, /#chat \.mes\[is_user="true"\] \.mesAvatarWrapper \{ order: 1 !important; \}/);
  // Layout's Space Between Messages and Names and Pictures: Hide come from the core, and the core adds the line break.
  assert.doesNotMatch(css, /\.mes:not\(\.last_mes\)/);
  assert.doesNotMatch(css, /\.mesAvatarWrapper, #chat \.mes \.ch_name \.name_text/);
  assert.ok(!css.endsWith('\n'));
  s.ovEnabled = false;
  assert.equal(window.NTR.decor.css(s), '');
  s.ovEnabled = true;
});
