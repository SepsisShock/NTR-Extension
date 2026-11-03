// Speech Bubbles are set only on UI Decor's page, so without decor.js they stay off and other pages stop moving things
// to a bubble's side.
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.NTR_TEST_WITHOUT = ['decor'];
const { api } = await import('./env.mjs');

test('without decor.js, Speech Bubbles stay off', () => {
  const s = api.settings();
  Object.assign(s, { masterEnabled: true, ovEnabled: true, ovBubOn: true, ovBubAlign: 'sides', mdOn: true, mdBelow: ['date'] });
  assert.equal(api.look.bubblesOn(s), false);
  // Message Details Below stays where it is instead of moving to the right side's bubble.
  assert.doesNotMatch(window.NTR.elements.css(s), /\.mes_block::after \{ margin-left: auto/);
});
