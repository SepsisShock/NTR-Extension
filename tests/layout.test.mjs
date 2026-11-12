// Layout, Pinned Blocks and Edit Layout come from layout.js. These check that it works from what the core shares;
// where things sit on screen still needs a run in SillyTavern.
import test from 'node:test';
import assert from 'node:assert/strict';
import { api, testSettings } from './env.mjs';

test('the send bar, page bar and banner are Free only with Layout on', (t) => {
  // The test window counts as wider than 1000px, so the Desktop layout's settings are the ones used.
  const s = testSettings(t, { masterEnabled: true, layEnabled: true, laySend: 'free', layPage: 'free', layBan: 'attached', ovSendPosOn: true, ovSendPos: 'separate' });
  assert.equal(api.sendFree(), true);
  assert.equal(api.pageFree(), true);
  assert.equal(api.banFree(), false);
  assert.equal(api.look.sendSeparate(s), true);
  s.layEnabled = false;
  assert.equal(api.sendFree(), false);
  assert.equal(api.look.sendSeparate(s), false);
});

test('the Layout page draws, with its switch and Pinned Blocks', () => {
  const html = window.NTR.layout.sectionHtml(api.settings());
  for (const id of ['m_l_enable', 'm_l_edit', 'm_l_reset', 'm_pin_list', 'm_pin_add']) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(html, /data-key="ovNamesOn"/);
});

test('Hide Names and Avatars follows Layout\'s switch, not Avatar Management\'s, and takes NTR Avatars with it', (t) => {
  const s = testSettings(t, { masterEnabled: true, layEnabled: true, avatarEnabled: false, aiEnabled: true, ovNamesOn: true });
  assert.equal(api.look.namesHidden(s), true);
  s.avatarEnabled = true;
  assert.equal(api.look.ntrAvatars(s, 'ai'), false);
  s.layEnabled = false;
  assert.equal(api.look.namesHidden(s), false);
  assert.equal(api.look.ntrAvatars(s, 'ai'), true);
});

