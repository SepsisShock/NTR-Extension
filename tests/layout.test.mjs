// Layout, Pinned Blocks and Edit Placement come from layout.js, which the core loads before it starts. These check that
// it arrives in time and works from what the core shares; where things sit on screen still needs a run in SillyTavern.
import test from 'node:test';
import assert from 'node:assert/strict';
import { api } from './env.mjs';

test('the core loads Layout before it starts', () => {
  assert.ok(window.NTR.layout, 'layout.js was not loaded by the core');
  assert.equal(window.NTR.layout.version, api.VERSION);
  assert.equal(api.moduleError('layout'), '');
});

test('the send bar, page bar and banner are Free only with Layout on', () => {
  const s = api.settings();
  // The test window counts as wider than 1000px, so the Desktop layout's settings are the ones used.
  Object.assign(s, { masterEnabled: true, layEnabled: true, laySend: 'free', layPage: 'free', layBan: 'attached', ovSendPosOn: true, ovSendPos: 'separate' });
  assert.equal(api.sendFree(), true);
  assert.equal(api.pageFree(), true);
  assert.equal(api.banFree(), false);
  assert.equal(api.look.sendSeparate(s), true);
  s.layEnabled = false;
  assert.equal(api.sendFree(), false);
  assert.equal(api.look.sendSeparate(s), false);
  Object.assign(s, { laySend: 'attached', layPage: 'attached', ovSendPosOn: false });
});

test('the Layout page draws, with its switch and Pinned Blocks', () => {
  const html = window.NTR.layout.sectionHtml(api.settings());
  for (const id of ['m_l_enable', 'm_l_edit', 'm_l_reset', 'm_pin_list', 'm_pin_add']) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(html, /data-key="ovNamesOn"/);
});

test('Hide Names and Avatars follows Layout\'s switch, not Avatar Management\'s, and takes NTR Avatars with it', () => {
  const s = api.settings();
  Object.assign(s, { masterEnabled: true, layEnabled: true, avatarEnabled: false, aiEnabled: true, ovNamesOn: true, ovNames: 'hide' });
  assert.equal(api.look.namesHidden(s), true);
  s.avatarEnabled = true;
  assert.equal(api.look.ntrAvatars(s, 'ai'), false);
  s.layEnabled = false;
  assert.equal(api.look.namesHidden(s), false);
  assert.equal(api.look.ntrAvatars(s, 'ai'), true);
  s.ovNamesOn = false;
});

