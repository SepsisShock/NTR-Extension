// Saved agents are cleaned before anything reads them, Fields included, so a hand-edited settings file can't break the
// Agents page or a Dashboard.
import test from 'node:test';
import assert from 'node:assert/strict';
import { api, load } from './env.mjs';

await load('agents');
const R = new Proxy({}, { get: (_, k) => api.numRange(k) });

test('agent fields are cleaned', () => {
  api.settings().agents = [{
    id: 'ag_t', name: 'T', answer: 'fields', keep: 'off',
    fields: [
      { id: 'f1', name: 'Na:me\nX', type: 'num', min: 5, max: 2, start: 99, step: -3, cap: 999 },
      { id: 'f1', kind: 'heading', name: '' },
      'junk',
      { type: 'bogus', hint: 'x'.repeat(500), listShow: 'chips', numShow: 'pie' },
      { name: 'HP_Max_' }, { name: '- **Goal**' }, { name: '1. Step `one`' }, { name: '1.5 Speed' },
    ],
  }];
  window.NTR.agents.answer('ag_t'); // reading an agent cleans the saved list
  const [a] = api.settings().agents;
  assert.equal(a.keep, 'chat', 'Fields always saves in the chat');
  assert.equal(a.fields.length, 7, 'entries that are not objects are dropped');
  const [num, head, text, ...names] = a.fields;
  // Names are read back from the agent's answer, so they lose what reading would strip: Markdown marks, list markers
  // in front and underscores at the end. An underscore inside stays.
  assert.deepEqual(names.map((f) => f.name), ['HP_Max', 'Goal', 'Step one', '1.5 Speed']);
  assert.equal(num.name, 'Na me X', 'a name loses colons and line breaks');
  assert.deepEqual([num.min, num.max, num.start], [5, 6, 6], 'max stays above min, and start between them');
  assert.equal(num.step, R.agFieldStep[0]);
  assert.equal(num.cap, R.agFieldCap[1]);
  assert.equal(head.kind, 'heading');
  assert.equal(head.name, 'Heading');
  assert.notEqual(head.id, num.id, 'a repeated id gets a new one');
  assert.equal(text.type, 'text');
  assert.equal(text.name, 'Field');
  assert.equal(text.hint.length, 200);
  assert.equal(text.listShow, 'chips');
  assert.equal(text.numShow, 'bar');
});
