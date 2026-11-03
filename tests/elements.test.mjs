// Elements comes from elements.js. These check that it builds its CSS from what the core shares; what it looks like on
// screen still needs a run in SillyTavern.
import test from 'node:test';
import assert from 'node:assert/strict';
import { api } from './env.mjs';

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
