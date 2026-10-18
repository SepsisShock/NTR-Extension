// Elements comes from elements.js, which the core loads before it starts. These check that it arrives in time and
// builds its CSS from what the core shares; what it looks like on screen still needs a run in SillyTavern.
import test from 'node:test';
import assert from 'node:assert/strict';
import { api } from './env.mjs';

test('the core loads Elements before it starts', () => {
  assert.ok(window.NTR.elements, 'elements.js was not loaded by the core');
  assert.equal(window.NTR.elements.version, api.VERSION);
  assert.equal(api.moduleError('elements'), '');
});

test('Elements builds its CSS, and none while NTR is off', () => {
  const s = api.settings();
  s.masterEnabled = true;
  s.rbEnabled = true;
  s.rbBoxShapeOn = true;
  s.rbBoxShape = 'extra';
  assert.match(window.NTR.elements.css(s), /\.mes_reasoning \{ border-radius: 20px !important;/);
  s.masterEnabled = false;
  assert.equal(window.NTR.elements.css(s), '');
  s.masterEnabled = true;
});
