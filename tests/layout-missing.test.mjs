// Without layout.js, the core still starts, at once rather than after its 5-second wait, says what's missing, and still
// loads the other look modules. The Layout settings the core builds stay SillyTavern's own, saved blocks are still
// cleaned, and Edit Placement's buttons say why they do nothing.
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.NTR_TEST_WITHOUT = ['layout'];
const started = performance.now();
const { api } = await import('./env.mjs');
const took = performance.now() - started;

test('the core starts without layout.js', () => {
  assert.equal(typeof api, 'object');
  assert.equal(window.NTR.layout, undefined);
  assert.notEqual(api.moduleError('layout'), '');
  assert.ok(window.NTR.elements && window.NTR.text && window.NTR.avatars && window.NTR.decor, 'the other look modules did not load without layout.js');
  assert.ok(took < 4000, `the core waited ${Math.round(took)} ms for a file that isn't there`);
});

test('without layout.js, Layout stays SillyTavern\'s own', () => {
  const s = api.settings();
  Object.assign(s, { masterEnabled: true, layEnabled: true, laySend: 'free', layPage: 'free', layBan: 'free', ovSendPosOn: true, ovSendPos: 'separate' });
  assert.equal(api.sendFree(), false);
  assert.equal(api.pageFree(), false);
  assert.equal(api.banFree(), false);
  assert.equal(api.look.sendSeparate(s), false);
  Object.assign(s, { ovNamesOn: true });
  assert.equal(api.look.namesHidden(s), false);
  s.ovNamesOn = false;
});

test('without layout.js, saved Pinned Blocks are still cleaned', () => {
  const [p] = api.look.cleanPins([{ name: 'Tracker', tag: 'div', classes: ['ok', 'bad class'], place: 'nowhere' }]);
  assert.equal(p.name, 'Tracker');
  assert.deepEqual(p.classes, ['ok']);
  assert.equal(p.place, 'float');
});

test('without layout.js, Edit Placement says it isn\'t there', () => {
  const said = [];
  const info = toastr.info;
  toastr.info = (msg) => said.push(msg);
  try {
    api.startPlacement('pop');
  } finally {
    toastr.info = info;
  }
  assert.deepEqual(said, ['Layout didn\'t load, so Edit Placement isn\'t available.']);
});
