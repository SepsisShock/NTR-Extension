// Saved agents are cleaned before anything reads them, Fields included, so a hand-edited settings file can't break the
// Agents page or a Dashboard.
import test from 'node:test';
import assert from 'node:assert/strict';
import { api, context, load } from './env.mjs';

await load('agents');
const R = new Proxy({}, { get: (_, k) => api.numRange(k) });

test('agent fields are cleaned', () => {
  api.settings().agents = [{
    id: 'ag_t', name: 'T', answer: 'fields', every: 500, readBy: 'since',
    fields: [
      { id: 'f1', name: 'Na:me\nX', type: 'num', min: 5, max: 2, start: 99, step: -3, cap: 999 },
      { id: 'f1', kind: 'heading', name: '' },
      'junk',
      { type: 'bogus', hint: 'x'.repeat(500), listShow: 'chips', numShow: 'pie' },
      { name: 'HP_Max_' }, { name: '- **Goal**' }, { name: '1. Step `one`' }, { name: '1.5 Speed' },
    ],
  }, { id: 'ag_u', readBy: 'bogus' }];
  window.NTR.agents.answer('ag_t'); // reading an agent cleans the saved list
  const [a, u] = api.settings().agents;
  assert.equal(a.every, R.agEvery[1], 'Run Every stops at its limit');
  assert.equal(a.readBy, 'since');
  assert.deepEqual([u.every, u.readBy], [1, 'recent'], 'an agent saved before Run Every runs after each message, as it did');
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

// Reports only come from other agents that are still there, and {{agent::Name}} from before Reports becomes one.
test('reports are cleaned, and old agent macros become reports', () => {
  const s = api.settings();
  s.agents = [
    { id: 'ag_a', name: 'A', job: 'Use {{agent::b}} and {{agent::Nobody}}.', reportsFrom: ['ag_a', 'ag_gone', 'ag_c', 'ag_c', 7] },
    { id: 'ag_b', name: 'B', answer: 'fields', fields: [{ name: 'X', hint: 'from {{ agent::A }}' }] },
    { id: 'ag_c', name: 'C', reportsFrom: 'junk' },
  ];
  window.NTR.agents.answer('ag_a');
  const [a, b, c] = s.agents;
  assert.deepEqual(a.reportsFrom, ['ag_c', 'ag_b'], 'itself, unknown and repeated agents are dropped');
  assert.equal(a.job, 'Use  and {{agent::Nobody}}.', 'a macro naming no agent stays as typed');
  assert.deepEqual(b.reportsFrom, ['ag_a']);
  assert.equal(b.fields[0].hint, 'from ');
  assert.deepEqual(c.reportsFrom, []);
});

// An agent that's off sends nothing to the main AI.
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
  delete context.chat;
  delete context.setExtensionPrompt;
});

// Agents in no department run first; then each department is a lane, up to 3 runs at once. An agent that gets reports
// from an agent above it in another department waits for that agent's run.
test('departments run side by side, and an agent waits for the agents above it that report to it', async () => {
  const s = api.settings();
  s.agEnabled = true;
  const agent = (x, job = `job ${x}`) => ({ id: `ag_${x}`, name: x, on: true, runs: 'reply', job, kind: 'cc', ccModel: 'm' });
  s.agents = [agent('L'), agent('A'), agent('B'), agent('C'), { ...agent('E'), reportsFrom: ['ag_A'] }, agent('F')];
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
  assert.equal(started.length, 4, 'E waits for A, which reports to it, and B for A in its own department');
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

// An agent that gets reports from an agent below it gets that agent's answer from when the run was asked for, even when
// the agent below, in another department, finishes first, and even twice.
test('a report from an agent below is its last answer, whichever finishes first', async () => {
  const s = api.settings();
  s.agEnabled = true;
  const agent = (x, job = `job ${x}`) => ({ id: `ag_${x}`, name: x, on: true, runs: 'reply', job, kind: 'cc', ccModel: 'm' });
  s.agents = [agent('B'), { ...agent('R'), reportsFrom: ['ag_P'] }, agent('P')];
  s.agDepts = [{ id: 'dp_1', name: 'One', ids: ['ag_B', 'ag_R'] }, { id: 'dp_2', name: 'Two', ids: ['ag_P'] }];
  context.chat = [{ send_date: 'd0', mes: 'Hi', name: 'X', extra: { ntr_agents: { ag_P: { text: 'OLD', date: 'd0', at: 1 } } } },
    { send_date: 'd1', mes: 'Hello', name: 'Y', extra: {} }];
  context.saveChat = () => {};
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
  assert.equal(sent.at(-1), 'job R\n\nReports from other agents:\n[P]\nOLD', 'the first R reads P as it was before its own message set it off');
  await finish('R', 'x');
  await finish('B', 'x');
  assert.equal(sent.at(-1), 'job R\n\nReports from other agents:\n[P]\nNEW', 'the second R was asked for after P saved NEW, and before P ran again');
  await finish('R', 'x');
  for (const k of ['ChatCompletionService', 'chat', 'saveChat']) delete context[k];
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

// Run Every counts the ticked messages since the agent's newest result, never the greeting, and adds no run while one
// is on the way. Since Its Last Result reads the messages after that result.
test('run every counts ticked messages since the last result, and since its last result reads only those', async () => {
  const s = api.settings();
  s.agEnabled = true;
  s.agents = [{ id: 'ag_S', name: 'S', on: true, runs: 'reply', job: 'job S', kind: 'cc', ccModel: 'm', every: 2, readBy: 'since', context: 10 }];
  s.agDepts = [];
  const msg = (i) => ({ send_date: `d${i}`, mes: `m${i}`, name: i % 2 ? 'You' : 'Char', is_user: i % 2 === 1, extra: {} });
  context.chat = [0, 1, 2].map(msg);
  context.saveChat = () => {};
  const live = [];
  const sent = [];
  context.ChatCompletionService = {
    processRequest: (data) => new Promise((res) => { sent.push(data.messages[1].content); live.push(res); }),
  };
  const settle = async () => { for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 0)); };
  const add = (...l) => context.chat.push(...l.map(msg));
  window.NTR.agents.replied('normal', 2);
  await settle();
  assert.equal(sent.length, 0, 'one AI reply after the greeting is not 2');
  add(3, 4);
  window.NTR.agents.replied('normal', 4);
  await settle();
  assert.equal(sent.length, 1, 'the second AI reply sets it off');
  add(5, 6);
  window.NTR.agents.replied('normal', 6);
  await settle();
  assert.equal(sent.length, 1, 'no second run while the first is on the way');
  live.shift()({ content: 'ok' });
  await settle();
  add(7, 8);
  window.NTR.agents.replied('normal', 8);
  await settle();
  assert.equal(sent.length, 2, 'two AI replies since its result on message 4');
  assert.equal(sent[1], 'The chat messages since your last result, oldest first:\n\nYou: m5\n\nChar: m6\n\nYou: m7\n\nChar: m8');
  live.shift()({ content: 'ok' });
  await settle();
  for (const k of ['ChatCompletionService', 'chat', 'saveChat']) delete context[k];
});

// A shared agent brings its job, never the sharer's own setup, and comes in as a new agent, switched off.
test('export leaves out the connection, and import links reports and the department to the new agents', async () => {
  const s = api.settings();
  s.agEnabled = true;
  s.agents = [
    { id: 'ag_a', name: 'A', on: true, example: true, kind: 'cc', ccSource: 'openai', ccModel: 'gpt-x', ccUrl: 'http://10.0.0.2', ccKey: 'key_1', tcUrl: 'http://10.0.0.3',
      tcInstruct: 'ChatML-x', full: true, runFrom: 'Bob', readBy: 'num', readFrom: 3, readTo: 9, job: 'Track {{char}}.', runs: 'reply', send: true, pic: 'https://example.com/a.png' },
    { id: 'ag_b', name: 'B', full: true, reportsFrom: ['ag_a', 'ag_x'] },
    { id: 'ag_x', name: 'X' },
  ];
  s.agDepts = [{ id: 'dp_1', name: 'Team', ids: ['ag_a', 'ag_b'] }];
  const ag = window.NTR.agents;
  ag.replied('normal', null); // cleans the saved agents and departments, and puts them in the roster's order
  const [a, b] = s.agents.filter((x) => x.id !== 'ag_x');
  const { file, fails } = await ag.fileFor([a, b], s.agDepts[0]);
  assert.equal(fails, 0);
  assert.equal(file.ntrAgents, 1);
  assert.deepEqual(file.depts, [{ name: 'Team', ids: ['ag_a', 'ag_b'] }]);
  const [ea, eb] = file.agents;
  assert.deepEqual([ea.kind, ea.ccSource, ea.ccModel, ea.ccUrl, ea.ccKey, ea.tcUrl, ea.tcInstruct], ['chat', 'openrouter', '', '', '', 'http://127.0.0.1:5001', ''], 'the connection is a new agent\'s');
  assert.ok(!/gpt-x|10\.0\.0|key_1|ChatML-x|Bob/.test(JSON.stringify(file)), 'nothing of the sharer\'s connection or chats is in the file');
  assert.deepEqual([ea.on, ea.example, ea.runFrom, ea.readBy, ea.readFrom, ea.readTo], [false, false, '', 'recent', 0, null]);
  assert.deepEqual([ea.full, eb.full], [false, true], 'Your Chat\'s Full Prompt only comes from Same as Chat');
  assert.deepEqual([ea.job, ea.runs, ea.send, ea.pic], ['Track {{char}}.', 'reply', true, 'https://example.com/a.png'], 'the job and how it runs are shared');

  assert.equal(await ag.addFile({}), null, 'a file without the mark isn\'t an agents file');
  assert.equal(await ag.addFile({ ntrAgents: 1, agents: [] }), null);
  const r = await ag.addFile(JSON.parse(JSON.stringify(file)));
  const [na, nb] = r.added;
  assert.deepEqual([r.skipped, r.picFails, r.deptsOut], [0, 0, 0]);
  assert.deepEqual([na.name, nb.name], ['A (2)', 'B (2)'], 'a name already used gets a number');
  assert.ok(![na.id, nb.id].some((id) => ['ag_a', 'ag_b'].includes(id)), 'imported agents get new ids');
  assert.deepEqual([na.on, nb.on], [false, false]);
  assert.deepEqual(nb.reportsFrom, [na.id], 'a report from an agent in the file follows its new id; others are dropped');
  assert.deepEqual(s.agDepts.map((d) => [d.name, d.ids]), [['Team', ['ag_a', 'ag_b']], ['Team (2)', [na.id, nb.id]]]);
  assert.deepEqual(s.agents.map((x) => x.name), ['X', 'A', 'B', 'A (2)', 'B (2)'], 'the agents list follows the roster');

  s.agents.push(...Array.from({ length: 24 }, (_, i) => ({ ...s.agents[0], id: `ag_f${i}`, name: `F${i}` })));
  const full = await ag.addFile(JSON.parse(JSON.stringify(file)));
  assert.deepEqual([full.added.length, full.skipped, s.agents.length], [1, 1, 30], 'up to 30 agents');
  assert.equal(full.added[0].name, 'A (3)');
});
