// Elements comes from elements.js. These check that it builds its CSS from what the core shares; what it looks like on
// screen still needs a run in SillyTavern.
import test from 'node:test';
import assert from 'node:assert/strict';
import { testSettings } from './env.mjs';

test('Elements builds its CSS, and none while NTR is off', (t) => {
  const s = testSettings(t, { masterEnabled: true, rbEnabled: true, rbBoxShapeOn: true, rbBoxShape: 'extra' });
  assert.match(window.NTR.elements.css(s), /\.mes_reasoning \{ border-radius: 20px !important;/);
  s.masterEnabled = false;
  assert.equal(window.NTR.elements.css(s), '');
});
