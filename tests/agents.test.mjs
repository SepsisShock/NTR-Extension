// Saved agents are cleaned before anything reads them, Fields included, so a hand-edited settings file can't break the
// Agents page or a Dashboard.
import test from 'node:test';
import assert from 'node:assert/strict';
import { api, context, load } from './env.mjs';

await load('agents');
const R = new Proxy({}, { get: (_, k) => api.numRange(k) });

test('agent fields are cleaned', () => {
  api.settings().agents = [{
    id: 'ag_t', name: 'T', answer: 'fields',
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
  assert.equal(a.fields.length, 7, 'entries that are not objects are dropped');
  assert.deepEqual(a.runOn, ['ai'], 'an agent saved before Which Messages runs after AI replies, as it did');
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

// Departments are cleaned like agents, and the agents list is kept in the roster's order, which is the run order.
test('departments are cleaned, and the agents list follows the roster', () => {
  const s = api.settings();
  s.agEnabled = true;
  s.agents = ['a', 'b', 'c', 'd'].map((x) => ({ id: `ag_${x}`, name: x.toUpperCase() }));
  s.agDepts = [
    { id: 'dp_1', name: '  ', ids: ['ag_c', 'ag_gone', 'ag_c', 7], was: ['ag_c', 'ag_a', 'ag_gone'] },
    { id: 'dp_1', name: 'Second', ids: ['ag_c', 'ag_a'], was: 'junk' },
    'junk',
  ];
  window.NTR.agents.replied('normal', null); // every agent is off, so nothing runs, but the list is put in order first
  const [one, two] = s.agDepts;
  assert.equal(s.agDepts.length, 2, 'entries that are not objects are dropped');
  assert.deepEqual([one.name, two.name], ['Department', 'Second']);
  assert.notEqual(one.id, two.id, 'a repeated id gets a new one');
  assert.deepEqual([one.ids, two.ids], [['ag_c'], ['ag_a']], 'unknown and repeated agents are dropped, and an agent stays where it is listed first');
  assert.deepEqual([one.was, two.was], [['ag_c'], null], 'only its own agents are remembered as on');
  assert.deepEqual(s.agents.map((a) => a.id), ['ag_b', 'ag_d', 'ag_c', 'ag_a'], 'no department first, then each department');
});

// An agent that's off reaches the main AI neither through Send to Main AI nor through {{agent::Name}}.
test('an agent that is off sends nothing to the main AI', () => {
  const s = api.settings();
  s.agEnabled = true;
  s.agents = [{ id: 'ag_on', name: 'On', on: true, send: true }, { id: 'ag_off', name: 'Off', send: true }];
  s.agDepts = [];
  const saved = { ag_on: { text: 'On answer', date: 'd' }, ag_off: { text: 'Off answer', date: 'd' } };
  context.chat = [{ send_date: 'd', extra: { ntr_agents: saved } }];
  const sent = {};
  context.setExtensionPrompt = (k, v) => { sent[k] = v; };
  window.NTR.agents.genStarted('normal', true);
  assert.equal(sent.ntr_agent_ag_on, '[On]\nOn answer');
  assert.equal(sent.ntr_agent_ag_off, undefined);
  assert.equal(window.NTR.agents.macro('On'), 'On answer');
  assert.equal(window.NTR.agents.macro('Off'), '');
  delete context.chat;
  delete context.setExtensionPrompt;
});
