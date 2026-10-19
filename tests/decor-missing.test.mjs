// Without decor.js, the core still starts, at once rather than after its 5-second wait, says what's missing, and still
// loads the other look modules. Speech Bubbles are set only on its page, so they stay off and other pages stop moving
// things to a bubble's side.
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.NTR_TEST_WITHOUT = ['decor'];
const started = performance.now();
const { api } = await import('./env.mjs');
const took = performance.now() - started;

test('the core starts without decor.js', () => {
  assert.equal(typeof api, 'object');
  assert.equal(window.NTR.decor, undefined);
  assert.notEqual(api.moduleError('decor'), '');
  assert.ok(window.NTR.elements && window.NTR.text && window.NTR.avatars, 'the other look modules did not load without decor.js');
  assert.ok(took < 4000, `the core waited ${Math.round(took)} ms for a file that isn't there`);
});

test('without decor.js, Speech Bubbles stay off', () => {
  const s = api.settings();
  Object.assign(s, { masterEnabled: true, ovEnabled: true, ovBubOn: true, ovBubAlign: 'sides', mdOn: true, mdBelow: ['date'] });
  assert.equal(api.look.bubblesOn(s), false);
  // Message Details Below stays where it is instead of moving to the right side's bubble.
  assert.doesNotMatch(window.NTR.elements.css(s), /\.mes_block::after \{ margin-left: auto/);
});
