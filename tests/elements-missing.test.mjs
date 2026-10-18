// Without elements.js, the core still starts, at once rather than after its 5-second wait, and says what's missing.
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.NTR_TEST_NO_ELEMENTS = true;
const started = performance.now();
const { api } = await import('./env.mjs');
const took = performance.now() - started;

test('the core starts without elements.js', () => {
  assert.equal(typeof api, 'object');
  assert.equal(window.NTR.elements, undefined);
  assert.notEqual(api.moduleError('elements'), '');
  assert.ok(took < 4000, `the core waited ${Math.round(took)} ms for a file that isn't there`);
});
