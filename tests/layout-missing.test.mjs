// Without layout.js, the Layout settings the core builds stay SillyTavern's own, saved blocks are still cleaned, and
// Edit Layout's buttons say why they do nothing.
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.NTR_TEST_WITHOUT = ['layout'];
const { api, testSettings } = await import('./env.mjs');

test('without layout.js, Layout stays SillyTavern\'s own', (t) => {
  const s = testSettings(t, { masterEnabled: true, layEnabled: true, laySend: 'free', layPage: 'free', layBan: 'free', ovSendPosOn: true, ovSendPos: 'separate' });
  assert.equal(api.sendFree(), false);
  assert.equal(api.pageFree(), false);
  assert.equal(api.banFree(), false);
  assert.equal(api.look.sendSeparate(s), false);
  Object.assign(s, { ovNamesOn: true });
  assert.equal(api.look.namesHidden(s), false);
});

test('without layout.js, saved Pinned Blocks are still cleaned', () => {
  const [p] = api.look.cleanPins([{ name: 'Tracker', tag: 'div', classes: ['ok', 'bad class'], place: 'nowhere' }]);
  assert.equal(p.name, 'Tracker');
  assert.deepEqual(p.classes, ['ok']);
  assert.equal(p.place, 'float');
});

test('without layout.js, Edit Layout says it isn\'t there', () => {
  const said = [];
  const info = toastr.info;
  toastr.info = (msg) => said.push(msg);
  try {
    api.startPlacement('pop');
  } finally {
    toastr.info = info;
  }
  assert.deepEqual(said, ['Layout didn\'t load, so Edit Layout isn\'t available.']);
});
