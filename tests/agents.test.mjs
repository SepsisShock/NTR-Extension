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
  assert.ok(!('was' in one) && !('was' in two), 'which agents were on is no longer kept');
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

// Agents in no department run first; then each department is a lane, up to 3 runs at once. An agent that reads an
// agent above it in another department waits for that agent's run.
test('departments run side by side, and an agent waits for the agents above it that it reads', async () => {
  const s = api.settings();
  s.agEnabled = true;
  const agent = (x, job = `job ${x}`) => ({ id: `ag_${x}`, name: x, on: true, runs: 'reply', job, kind: 'cc', ccModel: 'm' });
  s.agents = [agent('L'), agent('A'), agent('B'), agent('C'), agent('E', 'job E {{agent::a}}'), agent('F')];
  s.agDepts = [{ id: 'dp_1', name: 'One', ids: ['ag_A', 'ag_B'] }, { id: 'dp_2', name: 'Two', ids: ['ag_C', 'ag_E'] }, { id: 'dp_3', name: 'Three', ids: ['ag_F'] }];
  context.chat = [{ send_date: 'd', mes: 'Hi', name: 'X', extra: {} }];
  context.saveChat = () => {};
  const live = new Map();
  const started = [];
  context.ChatCompletionService = {
    processRequest: (data, o, x, signal) => new Promise((res, rej) => {
      const name = /^job (\w)/.exec(data.messages[0].content)[1];
      started.push(name);
      live.set(name, res);
      signal.addEventListener('abort', () => rej(new Error('Stopped')));
    }),
  };
  const settle = async () => { for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 0)); };
  const finish = async (x) => { live.get(x)({ content: 'ok' }); live.delete(x); await settle(); };

  window.NTR.agents.replied('normal', null);
  await settle();
  assert.deepEqual(started, ['L'], 'the agents in no department run first');
  await finish('L');
  assert.deepEqual(started.slice(1).sort(), ['A', 'C', 'F'], 'then the first agent of each department, side by side');
  await finish('C');
  assert.equal(started.length, 4, 'E waits for A, which it reads, and B for A in its own department');
  await finish('A');
  assert.deepEqual(started.slice(4).sort(), ['B', 'E']);
  for (const x of ['B', 'E', 'F']) await finish(x);

  // Four departments' runs at once: only 3 start, and the fourth once one of them ends.
  s.agents = [...s.agents.filter((a) => a.id !== 'ag_E'), agent('E'), agent('G')];
  s.agDepts.push({ id: 'dp_4', name: 'Four', ids: ['ag_G'] });
  started.length = 0;
  window.NTR.agents.replied('normal', null);
  await settle();
  await finish('L');
  assert.equal(started.length, 4, 'L, then 3 at a time');
  await finish(started[1]);
  assert.equal(started.length, 5, 'one ends, and one more starts');
  while (live.size) await finish([...live.keys()][0]);
  delete context.ChatCompletionService;
  delete context.chat;
  delete context.saveChat;
});

// An agent that reads an agent below it gets that agent's answer from when the run was asked for, even when the agent
// below, in another department, finishes first, and even twice.
test('an agent reading an agent below it gets its last answer, whichever finishes first', async () => {
  const s = api.settings();
  s.agEnabled = true;
  const agent = (x, job = `job ${x}`) => ({ id: `ag_${x}`, name: x, on: true, runs: 'reply', job, kind: 'cc', ccModel: 'm' });
  s.agents = [agent('B'), agent('R', 'job R reads {{agent::P}}'), agent('P')];
  s.agDepts = [{ id: 'dp_1', name: 'One', ids: ['ag_B', 'ag_R'] }, { id: 'dp_2', name: 'Two', ids: ['ag_P'] }];
  context.chat = [{ send_date: 'd0', mes: 'Hi', name: 'X', extra: { ntr_agents: { ag_P: { text: 'OLD', date: 'd0', at: 1 } } } },
    { send_date: 'd1', mes: 'Hello', name: 'Y', extra: {} }];
  context.saveChat = () => {};
  context.substituteParams = (t) => t.replace(/\{\{agent::(\w+)\}\}/g, (m, n) => window.NTR.agents.macro(n));
  const live = new Map();
  const sent = [];
  context.ChatCompletionService = {
    processRequest: (data) => new Promise((res) => {
      const name = /^job (\w)/.exec(data.messages[0].content)[1];
      sent.push(data.messages[0].content);
      live.set(name, res);
    }),
  };
  const settle = async () => { for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 0)); };
  const finish = async (x, text) => { live.get(x)({ content: text }); live.delete(x); await settle(); };
  window.NTR.agents.replied('normal', null);
  await settle();
  await finish('P', 'NEW');
  // A second message sets them all off again: P runs again before B, and so before the first R, is done.
  window.NTR.agents.replied('normal', 1);
  await settle();
  await finish('P', 'SECOND');
  assert.equal(window.NTR.agents.answer('ag_P'), 'SECOND', 'P saved twice');
  await finish('B', 'x');
  assert.equal(sent.at(-1), 'job R reads OLD', 'the first R reads P as it was before its own message set it off');
  await finish('R', 'x');
  await finish('B', 'x');
  assert.equal(sent.at(-1), 'job R reads NEW', 'the second R was asked for after P saved NEW, and before P ran again');
  await finish('R', 'x');
  for (const k of ['ChatCompletionService', 'chat', 'saveChat', 'substituteParams']) delete context[k];
});

// A full-prompt agent's snapshot is for its own quiet request, never for your reply while it waits for an answer.
test('your reply sends agents\' newest results while a full-prompt agent runs', async () => {
  const s = api.settings();
  s.agEnabled = true;
  s.agents = [{ id: 'ag_F', name: 'F', on: true, runs: 'reply', job: 'job F', kind: 'chat', full: true }, { id: 'ag_P', name: 'P', on: true, send: true, job: 'job P' }];
  s.agDepts = [];
  context.chat = [{ send_date: 'd0', mes: 'Hi', name: 'X', extra: { ntr_agents: { ag_P: { text: 'OLD', date: 'd0', at: 1 } } } }];
  context.saveChat = () => {};
  const sent = {};
  context.setExtensionPrompt = (k, v) => { sent[k] = v; };
  let answer;
  context.generateQuietPrompt = () => {
    window.NTR.agents.genStarted('quiet', false);
    return new Promise((res) => { answer = res; });
  };
  const settle = async () => { for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 0)); };
  window.NTR.agents.replied('normal', null); // F runs; P runs on the button only
  await settle();
  context.chat[0].extra.ntr_agents.ag_P = { text: 'NEW', date: 'd0', at: 2 };
  window.NTR.agents.genStarted('normal', false);
  assert.equal(sent.ntr_agent_ag_P, '[P]\nNEW');
  window.NTR.agents.genEnded();
  answer('done');
  await settle();
  for (const k of ['chat', 'saveChat', 'setExtensionPrompt', 'generateQuietPrompt']) delete context[k];
});
