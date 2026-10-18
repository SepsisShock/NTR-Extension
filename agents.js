// Nitwit Tavern Redesign: Agents module.
// Loaded by index.js for the Agents page, and when the page is on. If this file breaks, the rest of the extension keeps working.
// An agent is a separate request to a model that does one job you give it: its own name, picture, instructions, connection,
// samplers and limits. Its connection never changes your chat's connection or SillyTavern's Connection Profiles: it sends
// its own request through SillyTavern (Chat Completion or Text Completion), or uses your chat's connection (Same as Chat).
// Your API keys stay in SillyTavern; an agent keeps only which saved key it uses.
// An agent's answer shows in its activity. An agent can also save its answers in the chat, and a Dashboard (a Pinned
// Block set to Agent Results, index.js) shows them on screen. With Answer set to Fields, it keeps named values instead
// of free text (see Fields below).
(() => {
  const AGENTS_VERSION = '2.69.1';
  const A = window.NTR && window.NTR.api;
  if (!A) { console.error('[NTR] agents.js loaded without the core (index.js).'); return; }
  const { ctx, settings, save, escapeHTML: esc, pageHtml, pills, onPills, askText, askYes, popMenu, closePops, dragSort, newId, uploadImage, askImageUrl, deleteFileIfUnused, media } = A;

  // SillyTavern's Chat Completion APIs that need nothing but a key (and a link for Custom). Each one's saved keys are
  // under api_key_<name> in SillyTavern's secrets.
  const CC = [['openrouter', 'OpenRouter'], ['openai', 'OpenAI'], ['claude', 'Claude'], ['makersuite', 'Google AI Studio'], ['deepseek', 'DeepSeek'],
    ['mistralai', 'Mistral'], ['xai', 'xAI'], ['groq', 'Groq'], ['cohere', 'Cohere'], ['perplexity', 'Perplexity'], ['nanogpt', 'NanoGPT'], ['chutes', 'Chutes'],
    ['electronhub', 'Electron Hub'], ['aimlapi', 'AI/ML API'], ['fireworks', 'Fireworks'], ['moonshot', 'Moonshot'], ['zai', 'Z.AI'], ['siliconflow', 'SiliconFlow'],
    ['custom', 'Custom (OpenAI-compatible)']];
  // SillyTavern's Text Completion servers that run on your own computer. Some ask for a model name.
  const TC = [['koboldcpp', 'KoboldCpp'], ['llamacpp', 'llama.cpp'], ['ollama', 'Ollama'], ['ooba', 'Text Generation WebUI (Oobabooga)'], ['tabby', 'TabbyAPI'],
    ['vllm', 'vLLM'], ['aphrodite', 'Aphrodite'], ['generic', 'Generic (OpenAI-compatible)']];
  const TC_MODEL = new Set(['ollama', 'tabby', 'vllm', 'aphrodite', 'generic']);
  // SillyTavern's Prompt Post-Processing choices.
  const POST = [['', 'None'], ['merge', 'Merge consecutive roles (no tools)'], ['semi', 'Semi-strict (alternating roles; no tools)'],
    ['strict', 'Strict (user first, alternating roles; no tools)'], ['single', 'Single user message (no tools)'], ['merge_tools', 'Merge consecutive roles (with tools)'],
    ['semi_tools', 'Semi-strict (alternating roles; with tools)'], ['strict_tools', 'Strict (user first, alternating roles; with tools)']];
  // Samplers: the agent's field, its label, its range in NUM_RANGE, and its name in Chat Completion and Text Completion requests.
  const SAMP = [['temp', 'Temperature', 'agTemp', 'temperature', 'temperature'], ['topP', 'Top P', 'agTopP', 'top_p', 'top_p'], ['topK', 'Top K', 'agTopK', 'top_k', 'top_k'],
    ['minP', 'Min P', 'agMinP', 'min_p', 'min_p'], ['freq', 'Frequency Penalty', 'agFreq', 'frequency_penalty', 'frequency_penalty'],
    ['pres', 'Presence Penalty', 'agPres', 'presence_penalty', 'presence_penalty'], ['rep', 'Repetition Penalty', 'agRep', 'repetition_penalty', 'rep_pen']];
  const EFFORT = [['auto', 'Auto'], ['low', 'Low'], ['medium', 'Med'], ['high', 'High']];
  // A run that takes longer than this is stopped.
  const TIMEOUT_MS = 120000;

  // A new agent: off, run on the button, Same as Chat. Temperature starts low: agents keep records, they don't write prose.
  const fresh = (name) => ({
    id: newId('ag'), name, title: '', example: false, on: false, pic: '', job: '', runs: 'button', kind: 'chat',
    ccSource: 'openrouter', ccModel: '', ccUrl: '', ccKey: '', ccPost: '',
    tcType: 'koboldcpp', tcUrl: 'http://127.0.0.1:5001', tcModel: '', tcInstruct: '',
    tempOn: true, temp: 0.3, topPOn: false, topP: 1, topKOn: false, topK: 0, minPOn: false, minP: 0,
    freqOn: false, freq: 0, presOn: false, pres: 0, repOn: false, rep: 1, effOn: false, eff: 'auto',
    maxTokens: 600, context: 6, split: false, full: false, keep: 'off', last: false,
    send: false, sendWhere: 'chat', sendDepth: 1, sendRole: 'system', sendScan: false,
    answer: 'text', fields: [],
  });
  // Send to Main AI: where in your chat's prompt (SillyTavern's extension prompt places and roles).
  const WHERE = [['chat', 'In Chat', 1], ['before', 'Before Main Prompt', 2], ['after', 'After Main Prompt', 0]];
  const ROLES = [['system', 'System', 0], ['user', 'User', 1], ['assistant', 'AI', 2]];
  // Margi, the example tracker: an ordinary agent, made by its button, to edit or delete like any other. Her button
  // shows while no agent made by it is left (example marks it; Duplicate doesn't copy that). Her picture comes with
  // NTR, cropped, and Crop starts from the full one. Saved as a path from the site's root, so it works from any address.
  // She answers in Fields, so a Dashboard shows her state as soon as she's made.
  const MARGI_JOB = 'You are Margi, a story state tracker. Read the latest chat messages and update the story\'s state. Write "Unknown" for anything the story hasn\'t said yet.';
  const MARGI_FIELDS = [
    { kind: 'heading', name: 'Scene' },
    { name: 'Time', hint: 'time of day, and the date if known' },
    { name: 'Location', hint: 'where the scene takes place' },
    { name: 'Weather', hint: 'current weather' },
    { kind: 'heading', name: 'People' },
    { name: 'Characters', type: 'list', hint: 'one line each, as name: what they wear, what they carry, any injuries' },
    { name: 'Relationships', type: 'list', hint: 'one line per pair, as names: where it stands now' },
    { kind: 'heading', name: 'Goals' },
    { name: 'Objectives', type: 'list', hint: 'active goals' },
  ];
  const asset = (f) => new URL(`./assets/agents/${f}`, import.meta.url).pathname;
  const MARGI_PIC = asset('margi.webp');
  const FULL_PIC = { [MARGI_PIC]: asset('margi-full.webp') };
  const num = (k, v, d) => A.cardNum(v, k, d);
  const str = (v, max, d = '') => (typeof v === 'string' ? v.slice(0, max) : d);
  const pick = (v, list, d) => (list.some(([x]) => x === v) ? v : d);
  // Answer: Fields. Each field is a named value the agent keeps; a heading groups the fields under it in a Dashboard.
  // A field's name is how the answer is read, so it can't hold a colon, a line break or Markdown marks, start like a
  // list item or end in an underscore. Names in an answer go through the same cleaning, so every name kept reads back.
  const FIELD_MAX = 40;
  const FTYPES = [['text', 'Text'], ['num', 'Number'], ['list', 'List']];
  function nameText(v) {
    const t = String(v).replace(/[:\r\n*`]+/g, ' ').replace(/\s+/g, ' ').replace(/^(?:[\s\-+•#>_]|\d+[.)](?=\s))+/, '');
    return t.slice(0, 40).replace(/[\s_]+$/, '');
  }
  const fieldName = (v, d) => (typeof v === 'string' ? nameText(v) : '') || d;
  function cleanField(f) {
    const id = typeof f?.id === 'string' && /^[\w-]{1,40}$/.test(f.id) ? f.id : newId('fd');
    if (f?.kind === 'heading') return { id, kind: 'heading', name: fieldName(f.name, 'Heading') };
    const top = A.numRange('agFieldNum')[1];
    const min = Math.min(num('agFieldNum', f?.min, 0), top - 1);
    let max = num('agFieldNum', f?.max, 10);
    if (max <= min) max = min + 1;
    return {
      id, kind: 'field', name: fieldName(f?.name, 'Field'), type: pick(f?.type, FTYPES, 'text'), hint: str(f?.hint, 200).trim(),
      min, max, start: Math.min(max, Math.max(min, num('agFieldNum', f?.start, min))), step: num('agFieldStep', f?.step, 0),
      numShow: f?.numShow === 'number' ? 'number' : 'bar', listShow: f?.listShow === 'chips' ? 'chips' : 'lines', cap: num('agFieldCap', f?.cap, 10),
    };
  }
  function cleanFields(v) {
    const ids = new Set();
    return (Array.isArray(v) ? v : []).filter((f) => f && typeof f === 'object').slice(0, FIELD_MAX).map((f) => {
      const o = cleanField(f);
      if (ids.has(o.id)) o.id = newId('fd');
      ids.add(o.id);
      return o;
    });
  }
  // Each saved agent, with anything missing or out of range set back to a new agent's value.
  function clean(a) {
    const d = fresh('Agent');
    const o = { ...d, id: typeof a?.id === 'string' && /^[\w-]{1,40}$/.test(a.id) ? a.id : d.id, name: str(a?.name, 60).trim() || 'Agent',
      title: str(a?.title, 60).trim(), example: a?.example === true, on: a?.on === true,
      pic: str(a?.pic, 2048), job: str(a?.job, 8000), runs: a?.runs === 'reply' ? 'reply' : 'button',
      kind: ['chat', 'cc', 'tc'].includes(a?.kind) ? a.kind : 'chat',
      ccSource: pick(a?.ccSource, CC, d.ccSource), ccModel: str(a?.ccModel, 200), ccUrl: str(a?.ccUrl, 500), ccKey: str(a?.ccKey, 100), ccPost: pick(a?.ccPost, POST, ''),
      tcType: pick(a?.tcType, TC, d.tcType), tcUrl: str(a?.tcUrl, 500, d.tcUrl), tcModel: str(a?.tcModel, 200), tcInstruct: str(a?.tcInstruct, 200),
      effOn: a?.effOn === true, eff: pick(a?.eff, EFFORT, 'auto'),
      maxTokens: num('agMaxTokens', a?.maxTokens, d.maxTokens), context: num('agContext', a?.context, d.context),
      split: a?.split === true, full: a?.full === true, keep: a?.keep === 'chat' ? 'chat' : 'off', last: a?.last === true,
      send: a?.send === true, sendWhere: pick(a?.sendWhere, WHERE, 'chat'), sendDepth: num('agSendDepth', a?.sendDepth, d.sendDepth),
      sendRole: pick(a?.sendRole, ROLES, 'system'), sendScan: a?.sendScan === true,
      answer: a?.answer === 'fields' ? 'fields' : 'text', fields: cleanFields(a?.fields) };
    for (const [f, , k] of SAMP) { o[f + 'On'] = typeof a?.[f + 'On'] === 'boolean' ? a[f + 'On'] : d[f + 'On']; o[f] = num(k, a?.[f], d[f]); }
    // Fields keeps its values on the messages, so it always saves in the chat.
    if (o.answer === 'fields') o.keep = 'chat';
    return o;
  }
  const checked = new WeakSet();
  function list() {
    const s = settings();
    if (!Array.isArray(s.agents)) s.agents = [];
    if (!checked.has(s.agents)) { s.agents = s.agents.slice(0, 30).map(clean); checked.add(s.agents); }
    return s.agents;
  }
  const byId = (id) => list().find((a) => a.id === id) || null;
  const pageOn = () => A.isOn() && settings().agEnabled;

  // ----- Departments -----
  // Departments group agents in the roster: { id, name, ids: its agents, in order }, in agDepts. An agent is in one at
  // most; the rest come first, in no department. The roster is the order agents run in, so the agents list itself is
  // kept in the order shown (sortAgents). Saved apart from the agents, so an agent's own data stays the same.
  const DEPT_MAX = 30;
  const deptChecked = new WeakSet();
  function depts() {
    const s = settings();
    if (!Array.isArray(s.agDepts)) s.agDepts = [];
    if (!deptChecked.has(s.agDepts)) {
      const have = new Set(list().map((a) => a.id));
      const seen = new Set();
      const used = new Set();
      s.agDepts = s.agDepts.filter((d) => d && typeof d === 'object').slice(0, DEPT_MAX).map((d) => {
        let id = typeof d.id === 'string' && /^[\w-]{1,40}$/.test(d.id) ? d.id : newId('dp');
        if (used.has(id)) id = newId('dp');
        used.add(id);
        // An agent listed twice stays where it's listed first.
        const ids = (Array.isArray(d.ids) ? d.ids : []).filter((x) => have.has(x) && !seen.has(x) && seen.add(x));
        return { id, name: str(d.name, 60).trim() || 'Department', ids };
      });
      deptChecked.add(s.agDepts);
    }
    return s.agDepts;
  }
  const deptOf = (id) => depts().find((d) => d.ids.includes(id)) || null;
  const deptOpen = (d) => settings().uiOpen?.[`agd_${d.id}`] !== false;
  // The agents in no department, in order.
  function loose() {
    const inDept = new Set(depts().flatMap((d) => d.ids));
    return list().filter((a) => !inDept.has(a.id));
  }
  // Puts the agents list in the roster's order: no department first, then each department. Agents that are gone
  // leave their departments.
  function sortAgents() {
    const l = list();
    const have = new Map(l.map((a) => [a.id, a]));
    for (const d of depts()) d.ids = d.ids.filter((id) => have.has(id));
    const next = [...loose(), ...depts().flatMap((d) => d.ids.map((id) => have.get(id)))];
    if (next.some((a, i) => a !== l[i])) l.splice(0, l.length, ...next);
  }
  // Puts the agents in no department in this order, by id.
  function setLoose(ids) {
    const l = list();
    const pos = new Map(ids.map((id, i) => [id, i]));
    const free = l.filter((a) => pos.has(a.id)).sort((x, y) => pos.get(x.id) - pos.get(y.id));
    l.splice(0, l.length, ...free, ...l.filter((a) => !pos.has(a.id)));
  }

  // ----- Saved results -----
  // With Results set to Saved in the Chat, an answer is saved on the message that was newest when the run started, on its
  // current swipe, under extra.ntr_agents (by agent id) in the chat file. SillyTavern carries a message's extra along
  // with its swipe, so swipes, deleted messages and branches keep the right result. A new swipe starts as a copy of the
  // one it replaces, extra included, so each result also notes its swipe's date and only counts on that swipe. prev is
  // the text it replaced there, for Undo. A chat file can come from someone else, so what's read is limited and shown
  // sanitized.
  const KEY = 'ntr_agents';
  const MAX_SAVED = 20000;
  // Longer than that, a result isn't saved at all, so a Fields result never loses its last fields to the cut.
  const OVER = `over ${MAX_SAVED.toLocaleString('en-US')} characters`;
  // Which chat is open: its file name, with whose chat it is, since a duplicated card starts with the same chat name.
  const chatId = () => {
    try {
      const c = ctx();
      const id = c.getCurrentChatId();
      return id == null ? '' : `${c.groupId || c.characters[c.characterId]?.avatar || ''}/${id}`;
    } catch (e) { return ''; }
  };
  function savedAt(m, id) {
    const v = m?.extra?.[KEY]?.[id];
    if (!v || typeof v.text !== 'string' || v.date !== m.send_date) return null;
    return { text: v.text.slice(0, MAX_SAVED), at: Number(v.at) || 0, prev: typeof v.prev === 'string' ? v.prev.slice(0, MAX_SAVED) : null };
  }
  function saveAt(m, id, entry) {
    entry = { ...entry, date: m.send_date };
    const put = (x) => {
      if (!x.extra || typeof x.extra !== 'object') x.extra = {};
      const all = x.extra[KEY] && typeof x.extra[KEY] === 'object' ? x.extra[KEY] : {};
      x.extra[KEY] = { ...all, [id]: entry };
    };
    put(m);
    const sw = Array.isArray(m.swipe_info) ? m.swipe_info[m.swipe_id] : null;
    if (sw && typeof sw === 'object') put(sw);
    ctx().saveChat();
  }
  // The newest saved result at or before message upTo (the last message when null), and which message it's on.
  function latest(id, upTo = null) {
    const chat = ctx().chat || [];
    for (let i = Math.min(upTo ?? chat.length - 1, chat.length - 1); i >= 0; i--) {
      const r = savedAt(chat[i], id);
      if (r) return { ...r, mes: i };
    }
    return null;
  }

  // ----- Fields -----
  // With Answer set to Fields, NTR writes the format part of the agent's prompt from its fields and reads its answer:
  // Name: value lines, and a list as its name on a line of its own with "- item" lines under it. Only names it knows
  // count, the answer is laid over the last values so it only needs the ones that changed, and numbers keep to their
  // field's rules. What's saved is the full set written out the same way, so Send to Main AI, {{agent::Name}}, Edit
  // and Undo work as for any other result. Saved text can come from someone else's chat file, so whatever is read
  // from it is kept to each field's limits too.
  // Its fields, one per name (the first, if two share one).
  function fieldsOf(a) {
    const seen = new Set();
    return a.fields.filter((f) => f.kind === 'field' && !seen.has(f.name.toLowerCase()) && seen.add(f.name.toLowerCase()));
  }
  const usesFields = (a) => a.answer === 'fields' && fieldsOf(a).length > 0;
  function startValues(a) {
    const v = {};
    for (const f of fieldsOf(a)) v[f.name] = f.type === 'num' ? f.start : f.type === 'list' ? [] : 'Unknown';
    return v;
  }
  const ITEM = /^\s*(?:[-*•+]|\d+[.)])\s+(.*)$/;
  const NAMED = /^([^:]*?):(.*)$/;
  // name -> raw value (text) or items (list), for the names it knows. A name given twice counts the last time.
  function readFields(a, text) {
    const by = new Map(fieldsOf(a).map((f) => [f.name.toLowerCase(), f]));
    const got = {};
    let list = null;
    for (const raw of String(text ?? '').split('\n')) {
      if (!raw.trim()) continue;
      const item = ITEM.exec(raw);
      const named = NAMED.exec(item ? item[1] : raw);
      const f = named && by.get(nameText(named[1]).toLowerCase());
      // An item under a list, unless it names another field, like "- Location: the docks" after the list.
      if (item && list && !(f && f !== list)) { got[list.name].push(item[1].trim()); continue; }
      list = null;
      if (!f) continue;
      const v = named[2].replace(/^[\s*_`]+|[\s*_`]+$/g, '');
      if (f.type !== 'list') { got[f.name] = v; continue; }
      // A list can also come on one line: items split by semicolons, or by commas for chips.
      got[f.name] = !v || /^(none|nothing|empty|n\/a)\.?$/i.test(v) ? [] : v.split(v.includes(';') ? ';' : f.listShow === 'chips' ? ',' : '\n');
      list = f;
    }
    return got;
  }
  // One field's value from what was read. rules: Max Change applies (to the agent's answers, not to your own edits).
  function fieldValue(f, v, old, rules) {
    if (f.type === 'list') return (Array.isArray(v) ? v : [v]).map((x) => String(x).replace(/\s+/g, ' ').trim().slice(0, 200)).filter(Boolean).slice(0, f.cap);
    if (f.type === 'num') {
      const m = /-?\d+(?:\.\d+)?/.exec(String(v));
      if (!m) return old;
      const was = typeof old === 'number' ? old : f.start;
      let n = Number(m[0]);
      if (rules && f.step > 0) n = Math.min(was + f.step, Math.max(was - f.step, n));
      return Math.round(Math.min(f.max, Math.max(f.min, n)) * 100) / 100;
    }
    return String(v).replace(/\s+/g, ' ').trim().slice(0, 200) || old;
  }
  // `text` laid over `prev`. Null when it names none of the fields.
  function mergeFields(a, prev, text, rules) {
    const got = readFields(a, text);
    if (!Object.keys(got).length) return null;
    const out = { ...prev };
    for (const f of fieldsOf(a)) if (f.name in got) out[f.name] = fieldValue(f, got[f.name], prev[f.name], rules);
    return out;
  }
  // The values in a saved result, with any it doesn't have at their start.
  const valuesOf = (a, text) => mergeFields(a, startValues(a), text, false) || startValues(a);
  function writeFields(a, vals) {
    return fieldsOf(a).flatMap((f) => (f.type === 'list' ? [`${f.name}:`, ...(vals[f.name] || []).map((x) => `- ${x}`)] : [`${f.name}: ${vals[f.name]}`])).join('\n');
  }
  // The values before message `at`: the newest saved before it, or the start values.
  function valuesBefore(a, at) {
    const prev = latest(a.id, at - 1);
    return prev ? valuesOf(a, prev.text) : startValues(a);
  }
  // The format part of the prompt. The hints can hold macros, so this goes with the instructions; the current values
  // come after, as saved.
  function fieldRules(a) {
    const lines = fieldsOf(a).map((f) => {
      const rule = f.type === 'num' ? `a number from ${f.min} to ${f.max}${f.step ? `, changing by at most ${f.step}` : ''}` : f.type === 'list' ? `a list of up to ${f.cap}` : 'one line';
      return `${f.name}: ${f.hint ? `${f.hint} (${rule})` : rule}`;
    });
    return ['Answer only with the fields that changed, one per line, as Name: value. Write a list as its name on a line of its own, then one "- item" line for each of its items, all of them. Leave out anything that stayed the same.', '', 'Fields:', ...lines].join('\n');
  }

  // Its instructions with SillyTavern's macros filled in ({{char}}, {{user}}, {{agent::Name}}...), and with Include Its
  // Last Result, the newest result saved before message `at`. With Fields, the format part and the current values
  // instead. A saved result is left as it is. {{agent::Name}} looks only up to message `at` meanwhile (macroAt), so Run
  // Again on an older message doesn't see later results.
  let macroAt = null;
  function withLast(a, at) {
    const fields = usesFields(a);
    let job = fields ? [a.job.trim(), fieldRules(a)].filter(Boolean).join('\n\n') : a.job;
    macroAt = at;
    try { job = ctx().substituteParams(job); } catch (e) { /* as typed */ } finally { macroAt = null; }
    if (fields) return `${job}\n\nCurrent values:\n${writeFields(a, valuesBefore(a, at))}`;
    const prev = a.keep === 'chat' && a.last ? latest(a.id, at - 1) : null;
    return prev ? `${job}\n\nYour last result:\n${prev.text}` : job;
  }

  // ----- Sent to your chat's prompt -----
  // Just before SillyTavern builds the prompt for a reply, each agent with Send to Main AI puts its current saved result
  // there, under its name. A swipe or Regenerate replaces the last reply, so the result sent is the one from before that
  // reply. At this point the reply is still in the chat (Regenerate removes it afterwards), so the message that counts
  // is noted now (sendAt), for {{agent::Name}} during the same reply too.
  const injKey = (id) => `ntr_agent_${id}`;
  const injected = new Set();
  let sendAt = null;
  // An agent's own run with your chat's full prompt leaves its own result out, so it doesn't get it twice.
  let fullRun = null;
  function upToFor(type) {
    const chat = ctx().chat || [];
    const last = chat.length - 1;
    return (type === 'swipe' || type === 'regenerate') && chat[last] && !chat[last].is_user ? last - 1 : last;
  }
  const sendUpTo = () => sendAt ?? (ctx().chat || []).length - 1;
  function inject(type, dryRun) {
    const at = upToFor(type);
    // A dry run (SillyTavern counting tokens) never sends "generation ended", so it doesn't set sendAt.
    if (!dryRun) sendAt = at;
    const c = ctx();
    if (typeof c.setExtensionPrompt !== 'function') return;
    const sent = new Set();
    if (pageOn()) {
      for (const a of list()) {
        if (!a.send || a.keep !== 'chat' || (type === 'quiet' && a.id === fullRun)) continue;
        const r = latest(a.id, at);
        if (!r) continue;
        const where = WHERE.find(([v]) => v === a.sendWhere)[2];
        const role = a.sendWhere === 'chat' ? ROLES.find(([v]) => v === a.sendRole)[2] : 0;
        try { c.setExtensionPrompt(injKey(a.id), `[${a.name}]\n${r.text}`, where, a.sendDepth, a.sendScan, role); sent.add(a.id); } catch (e) { console.error('[NTR] Could not send an agent result', e); }
      }
    }
    for (const id of injected) if (!sent.has(id)) { try { c.setExtensionPrompt(injKey(id), '', 1, 0); } catch (e) { /* gone */ } }
    injected.clear();
    sent.forEach((id) => injected.add(id));
  }

  // ----- Running -----
  // Your chat's reply being written. Same as Chat, and a local server your chat also uses, wait for it to finish.
  let chatBusy = false;
  let waiters = [];
  const chatIdle = () => (chatBusy ? new Promise((r) => { waiters.push(r); setTimeout(r, 300000); }) : Promise.resolve());
  const sameUrl = (u) => String(u || '').trim().replace(/\/+$/, '').toLowerCase();
  function sharesChatServer(a) {
    const c = ctx();
    const t = c.textCompletionSettings;
    return a.kind === 'tc' && c.mainApi === 'textgenerationwebui' && !!t && sameUrl(t.server_urls?.[t.type]) === sameUrl(a.tcUrl);
  }

  // What the agent reads: its instructions, then the latest chat messages, oldest first. In one block, or as separate
  // messages (yours as user, the rest as AI), each with its speaker's name. Separate messages end with a user line:
  // a chat ending on an AI message would otherwise be read as the start of the agent's own answer.
  const ROLE = { system: 'System', user: 'User', assistant: 'AI' };
  // at: the message it runs on (the last one when null); it reads the chat up to there.
  function prompt(a, test, at = null) {
    if (test) return [{ role: 'system', content: 'Reply with the word OK and nothing else.' }, { role: 'user', content: 'Test.' }];
    const all = ctx().chat || [];
    const end = at ?? all.length - 1;
    const chat = all.slice(0, end + 1).filter((m) => m && !m.is_system && typeof m.mes === 'string').slice(-a.context);
    const said = (m) => `${m.name || (m.is_user ? 'User' : 'Character')}: ${m.mes}`;
    const job = withLast(a, end);
    if (a.split) {
      return [{ role: 'system', content: job }, ...chat.map((m) => ({ role: m.is_user ? 'user' : 'assistant', content: said(m) })),
        { role: 'user', content: 'Follow your instructions for the chat messages above.' }];
    }
    return [{ role: 'system', content: job }, { role: 'user', content: `The latest chat messages, oldest first:\n\n${chat.map(said).join('\n\n')}` }];
  }
  // Your chat's full prompt: Same as Chat only, and never for Test Connection.
  const usesFull = (a, test) => a.kind === 'chat' && a.full && !test;
  function samplers(a, tc) {
    const o = {};
    for (const [f, , , cc, t] of SAMP) if (a[f + 'On']) o[tc ? t : cc] = a[f];
    // Text Completion servers read Repetition Penalty under different names: Ollama only reads repeat_penalty.
    if (tc && a.repOn) { o.repetition_penalty = a.rep; o.repeat_penalty = a.rep; }
    return o;
  }
  // Same as Chat with its own samplers: your chat's APIs that SillyTavern lets extensions change a request for.
  const OWN_SAMP_API = { openai: 'CHAT_COMPLETION_SETTINGS_READY', textgenerationwebui: 'TEXT_COMPLETION_SETTINGS_READY' };
  // While a Same as Chat run builds its request, its ticked samplers replace your preset's in that one request. Only
  // samplers SillyTavern already put in it are replaced, so one your chat's API doesn't take stays out. Reasoning
  // Effort is different for each API (Auto leaves it out for some), so SillyTavern works it out: the agent's choice
  // stands in your Chat Completion settings only while the request is built, and yours is back as soon as it's ready.
  // A reply of yours started meanwhile keeps your preset's samplers. Returns the function that stops listening.
  function ownSamplers(a, c) {
    const ev = OWN_SAMP_API[c.mainApi];
    if (!ev || !c.event_types?.[ev]) return () => {};
    const own = samplers(a, c.mainApi === 'textgenerationwebui');
    const set = c.mainApi === 'openai' && a.effOn ? c.chatCompletionSettings : null;
    if (!set && !Object.keys(own).length) return () => {};
    const yours = set ? set.reasoning_effort : null;
    let back = !set;
    const restore = () => { if (!back) { back = true; set.reasoning_effort = yours; } };
    if (set) set.reasoning_effort = a.eff;
    const name = c.event_types[ev];
    let used = false;
    const hook = (data) => {
      restore();
      if (used || chatBusy || !data || typeof data !== 'object') return;
      used = true;
      for (const [k, v] of Object.entries(own)) if (k in data) data[k] = v;
    };
    c.eventSource.on(name, hook);
    return () => { c.eventSource.removeListener(name, hook); restore(); };
  }

  // Stop and the time limit end a run right away, even while it waits for your reply or for an answer.
  const abortable = (p, signal) => new Promise((res, rej) => {
    if (signal.aborted) { rej(new Error('Stopped')); return; }
    const stop = () => rej(new Error('Stopped'));
    signal.addEventListener('abort', stop, { once: true });
    p.then(res, rej).finally(() => signal.removeEventListener('abort', stop));
  });
  // After waiting for your reply, the page (or the agent, for a run after a reply) may have been switched off meanwhile,
  // or the agent deleted.
  const stillAllowed = (a, auto) => {
    if (!byId(a.id)) throw new Error('Skipped: this agent was deleted');
    if (!pageOn()) throw new Error('Skipped: the Agents page is off');
    if (auto && !a.on) throw new Error('Skipped: this agent is off');
  };

  // The chat is read only after any wait for your reply, so the agent sees that reply finished. That's also when the
  // message it runs on is noted (o.target), so its answer can be saved there. A run only reads the chat it was started
  // in (o.chat), so one still waiting its turn when you switch chats is skipped. A run for a given message (o.at) checks
  // it's still that message (o.date), in case a swipe or a deleted message moved things while it waited.
  function aim(o) {
    if (chatId() !== o.chat) throw new Error('Skipped: you switched chats before it could run.');
    const chat = ctx().chat || [];
    const i = o.at ?? chat.length - 1;
    const m = chat[i];
    if (o.at != null && m?.send_date !== o.date) throw new Error('Skipped: the message it was for changed before it could run.');
    o.target = m ? { chat: chatId(), i, swipe: m.swipe_id, date: m.send_date, mes: m.mes } : null;
    return i;
  }
  async function call(a, o, signal) {
    const { test, auto } = o;
    const c = ctx();
    const max = test ? 20 : a.maxTokens;
    if (a.kind === 'chat') {
      await abortable(chatIdle(), signal);
      stillAllowed(a, auto);
      const full = usesFull(a, test);
      // SillyTavern's own request can't take our Stop, but its "generation stopped" event cancels it, and Stop Generation
      // cancels a full-prompt request. Both would also stop a reply being written, so they're only used while no reply is.
      const cancel = () => { if (!chatBusy) { if (full) c.stopGeneration(); else c.eventSource.emit(c.event_types.GENERATION_STOPPED); } };
      signal.addEventListener('abort', cancel, { once: true });
      const unhook = ownSamplers(a, c);
      try {
        // SillyTavern skips a full-prompt request without a word while your chat has no connection.
        if (full && c.onlineStatus === 'no_connection') throw new Error('Your chat isn\'t connected to an API.');
        // SillyTavern builds your chat's full prompt from the whole chat and adds the instructions at the end, so it can't
        // stop at an older message. A run after a reply that newer messages overtook while it waited is skipped: the
        // newer reply runs it again.
        if (full) {
          const i = aim(o);
          if (i !== (c.chat || []).length - 1) {
            throw new Error(o.auto ? 'Skipped: newer messages came in first, and with your chat\'s full prompt it only runs on the newest message.'
              : 'With your chat\'s full prompt, it can only run on the last message.');
          }
          fullRun = a.id;
          try {
            return String(await abortable(c.generateQuietPrompt({ quietPrompt: withLast(a, i), responseLength: max }), signal) ?? '');
          } finally { fullRun = null; }
        }
        const messages = prompt(a, test, test ? null : aim(o));
        // The speaker's name is already in each message, so SillyTavern doesn't add one (name: '').
        const chatPart = a.split && !test ? messages.slice(1).map((m) => ({ ...m, name: '' })) : messages[1].content;
        return String(await abortable(c.generateRaw({ prompt: chatPart, systemPrompt: messages[0].content, responseLength: max }), signal) ?? '');
      } finally {
        unhook();
        signal.removeEventListener('abort', cancel);
      }
    }
    if (a.kind === 'cc') {
      if (!a.ccModel.trim()) throw new Error('Type a model name first.');
      const messages = prompt(a, test, test ? null : aim(o));
      if (a.ccSource === 'custom' && !a.ccUrl.trim()) throw new Error('Type the Custom link first.');
      const r = await c.ChatCompletionService.processRequest({
        stream: false, messages, model: a.ccModel.trim(), chat_completion_source: a.ccSource, max_tokens: max,
        custom_url: a.ccSource === 'custom' ? a.ccUrl.trim() : undefined, secret_id: a.ccKey || undefined, custom_prompt_post_processing: a.ccPost,
        ...samplers(a, false), ...(a.effOn ? { reasoning_effort: a.eff } : {}),
      }, {}, true, signal);
      return String(r?.content ?? '');
    }
    if (!a.tcUrl.trim()) throw new Error('Type the server link first.');
    if (sharesChatServer(a)) { await abortable(chatIdle(), signal); stillAllowed(a, auto); }
    const messages = prompt(a, test, test ? null : aim(o));
    const r = await c.TextCompletionService.processRequest({
      stream: false, prompt: messages, max_tokens: max, api_type: a.tcType, api_server: a.tcUrl.trim(),
      model: TC_MODEL.has(a.tcType) && a.tcModel.trim() ? a.tcModel.trim() : undefined, ...samplers(a, true),
    }, { instructName: a.tcInstruct || undefined }, true, signal);
    return String(r?.content ?? '');
  }

  // One run at a time. Each agent keeps its last 10 runs (and its last answer) until you reload.
  // fails: each agent's last failed run in a chat, shown in the Pinned Block until it runs fine again.
  const runs = new Map();
  const answers = new Map();
  const fails = new Map();
  let chain = Promise.resolve();
  let current = null;
  // Pinned Blocks with agent results catch up (index.js).
  const refreshBoxes = () => A.refreshPins?.();
  function log(a, entry) {
    if (!byId(a.id)) return;
    const l = runs.get(a.id) || [];
    l.unshift(entry);
    runs.set(a.id, l.slice(0, 10));
    renderActivity();
  }
  // Saves an answer on the message it was made for, if that message is still there as it was. Gives back why it wasn't
  // saved, for the activity.
  function keep(a, t, text) {
    if (a.keep !== 'chat') return '';
    if (!t) return 'Not saved: the chat has no messages.';
    if (!text) return 'Not saved: empty answer.';
    const m = (ctx().chat || [])[t.i];
    if (chatId() !== t.chat || !m || m.swipe_id !== t.swipe || m.send_date !== t.date) return 'Not saved: the chat changed while it ran.';
    if (m.mes !== t.mes) return 'Not saved: the message was edited while it ran.';
    if (usesFields(a)) {
      const vals = mergeFields(a, valuesBefore(a, t.i), text, true);
      if (!vals) return 'Nothing saved: the answer named none of its fields.';
      text = writeFields(a, vals);
      if (text.length > MAX_SAVED) return `Not saved: all its values together are ${OVER}. Lower Max Items, or ask for shorter values.`;
    }
    const old = savedAt(m, a.id);
    saveAt(m, a.id, { text: text.slice(0, MAX_SAVED), at: Date.now(), ...(old ? { prev: old.text } : {}) });
    return '';
  }
  // auto: a run after a reply, which also needs the agent's own switch on. at: the message to run on (the reply that
  // set off a run after a reply, or Run Again in a Pinned Block); the last one when null. Resolves with the run's
  // result: { ok, text }.
  function enqueue(id, test = false, auto = false, at = null) {
    const from = chatId();
    const date = at == null ? null : (ctx().chat || [])[at]?.send_date;
    chain = chain.then(async () => {
      const a = byId(id);
      if (!a) return { ok: false, text: 'This agent was deleted.' };
      const skip = !pageOn() ? (auto ? '' : 'Turn the Agents page on first.') : auto && !a.on ? '' : !test && !a.job.trim() && !usesFields(a) ? 'Write its instructions first.' : null;
      if (skip !== null) { if (skip) log(a, { at: Date.now(), ms: 0, ok: false, test, text: skip }); return { ok: false, text: skip || 'Skipped' }; }
      const ctrl = new AbortController();
      let timedOut = false;
      const timer = setTimeout(() => { timedOut = true; ctrl.abort(); }, TIMEOUT_MS);
      current = { id, ctrl };
      renderActivity();
      refreshBoxes();
      const t0 = performance.now();
      const o = { test, auto, at, date, chat: from, target: null };
      try {
        const text = (await call(a, o, ctrl.signal)).trim();
        if (ctrl.signal.aborted) throw new Error(timedOut ? 'Timed out' : 'Stopped');
        const note = test || !byId(id) ? '' : keep(a, o.target, text);
        if (!test && byId(id)) { answers.set(id, text); fails.delete(id); }
        log(a, { at: Date.now(), ms: performance.now() - t0, ok: true, test, text: text || '(empty answer)', note });
        return { ok: true, text };
      } catch (e) {
        const msg = timedOut ? 'Timed out' : ctrl.signal.aborted ? 'Stopped' : (e?.message || String(e));
        if (!test) fails.set(id, { chat: o.target?.chat ?? from, text: msg });
        log(a, { at: Date.now(), ms: performance.now() - t0, ok: false, test, text: msg });
        return { ok: false, text: msg };
      } finally {
        clearTimeout(timer);
        current = null;
        renderActivity();
        refreshBoxes();
      }
    });
    return chain;
  }

  // ----- The Agents page -----
  let root = null;
  const opt = (pairs, cur) => pairs.map(([v, l]) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(l)}</option>`).join('');
  const lab = (l, i) => `<div class="cb_hint" style="margin:6px 0 0;">${l}</div>${i}`;
  const btn = (id, icon, label, title = '') => `<button type="button" class="menu_button" id="${id}" style="margin:0;width:max-content;"${title ? ` title="${esc(title)}" aria-label="${esc(title)}"` : ''}><i class="fa-solid ${icon}"></i>${label || ''}</button>`;
  // An agent's picture is always a circle.
  const picHtml = (a, size) => {
    return a.pic ? `<img src="${esc(media(a.pic))}" alt="" style="width:${size}px;height:${size}px;object-fit:cover;border-radius:50%;flex:none;">`
      : `<i class="fa-solid fa-fw fa-robot" style="width:${size}px;text-align:center;opacity:.7;flex:none;"></i>`;
  };
  const conn = (a) => (a.kind === 'chat' ? 'Same as Chat' : a.kind === 'cc' ? `${(CC.find(([v]) => v === a.ccSource) || [, ''])[1]}${a.ccModel ? ' · ' + a.ccModel : ''}`
    : `${(TC.find(([v]) => v === a.tcType) || [, ''])[1]} (local)`);
  const slider = (a, f, k) => `<div class="cb_row"><input type="range" class="m_ag_num" data-f="${f}" data-k="${k}" ${A.rangeAttrs(k)} value="${a[f]}" style="flex:1;"><span style="min-width:72px;text-align:right;"><span id="m_ag_v_${f}" class="ntr_slval">${a[f]}</span>${A.numRange(k)[3] || ''}</span></div>`;
  const RUNS = [['reply', 'After Every Reply'], ['button', 'On the Button Only']];
  const KEEP = [['off', 'Activity Only'], ['chat', 'Saved in the Chat']];
  const nameOf = (pairs, v) => (pairs.find(([x]) => x === v) || [, ''])[1];
  // When it runs and on what, under its name in the roster and in its header.
  const status = (a) => `${nameOf(RUNS, a.runs)} · ${conn(a)}`;
  const clock = (t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  // An agent's own switch, in a box that's easier to tap on a touch screen.
  const onSwitch = (cls, a) => `<label class="m_ag_sw"><input type="checkbox" class="ntr_pswitch ${cls}" ${a.on ? 'checked' : ''} title="Turn ${esc(a.name)} on or off" aria-label="Turn ${esc(a.name)} on or off"></label>`;
  const headBtn = (id, icon, title, extra = '') => `<button type="button" class="menu_button m_ag_hbtn" id="${id}" title="${title}" aria-label="${title}"${extra}><i class="fa-solid fa-fw ${icon}"></i></button>`;
  const nameSize = (v) => Math.min(30, Math.max(4, v.length + 1));

  function sectionHtml(s) {
    const note = '<div class="cb_hint ntr_pnote">Agents are separate requests to a model, each doing one job you give it. Each run costs tokens on its connection. Nothing here calls a model while this page is switched off.</div>';
    // m_ag_say reads out a move to screen readers; it sits outside m_ag_root, which is drawn again after every change.
    return pageHtml('agents', '<div id="m_ag_root"></div><div id="m_ag_say" class="ntr_sr" role="status"></div>', { sw: ['m_ag_enable', !!s.agEnabled], note });
  }

  // The roster: the agents in no department, then each department with its agents. A row per agent: a grip to drag
  // it, its picture, name and title picking it, and its switch. A department's row: a grip, its name opening and
  // folding it, and More (Rename, Move Up, Move Down, Delete). The order is the run order (sortAgents).
  function rowHtml(a, s) {
    return `
      <div class="m_ag_row${a.id === s.agPick ? ' m_ag_sel' : ''}" data-id="${a.id}">
        <i class="fa-solid fa-grip-lines ntr_grip" aria-hidden="true" title="Drag to reorder or move to a department"></i>
        <button type="button" class="m_ag_pick"${a.id === s.agPick ? ' aria-current="true"' : ''}>
          ${picHtml(a, 30)}
          <span class="m_ag_rtext"><span class="m_ag_rline"><strong class="m_ag_rname">${esc(a.name)}</strong><span class="m_ag_rtitle">${a.title ? ` · ${esc(a.title)}` : ''}</span></span>
            <span class="m_ag_rsub">${esc(status(a))}</span></span>
        </button>
        ${onSwitch('m_ag_on', a)}
      </div>`;
  }
  function deptHtml(d, s) {
    const open = deptOpen(d);
    const n = d.ids.length;
    // Folded, it shows the picked agent is inside it.
    const holds = !open && d.ids.includes(s.agPick);
    return `
      <div class="m_ag_dept" data-dept="${d.id}">
        <div class="m_ag_dhead${holds ? ' m_ag_sel' : ''}">
          <i class="fa-solid fa-grip-lines ntr_grip m_ag_dgrip" aria-hidden="true" title="Drag to reorder departments"></i>
          <button type="button" class="m_ag_dpick" aria-expanded="${open}" aria-label="${esc(d.name)}, ${n} ${n === 1 ? 'agent' : 'agents'}">
            <span class="m_ag_dicon"><i class="fa-solid fa-fw ${open ? 'fa-building-user' : 'fa-building'}"></i></span>
            <span class="m_ag_dname">${esc(d.name)}</span><span class="m_ag_dcount">${n}</span>
          </button>
          <span class="ntr_menu"><button type="button" class="menu_button m_ag_hbtn m_ag_dmore" title="More" aria-label="More for ${esc(d.name)}" aria-haspopup="menu" aria-expanded="false"><i class="fa-solid fa-fw fa-ellipsis"></i></button></span>
        </div>
        <div class="m_ag_dbody" role="group" aria-label="${esc(d.name)}"${open ? '' : ' hidden'}>
          ${d.ids.map(byId).filter(Boolean).map((a) => rowHtml(a, s)).join('') || '<div class="m_ag_empty">Empty. Drag an agent here.</div>'}
        </div>
      </div>`;
  }
  function listHtml(s) {
    const l = list();
    const dl = depts();
    const free = loose();
    const top = free.map((a) => rowHtml(a, s)).join('')
      || (!l.length ? '<div class="cb_hint" style="margin:0;">No agents yet.</div>' : dl.length ? '<div class="m_ag_empty">Drag an agent here to take it out of its department.</div>' : '');
    return `<div style="display:flex;flex-wrap:wrap;gap:8px;margin:0 0 10px;">
        ${btn('m_ag_new', 'fa-plus', 'Hire Agent')}
        ${btn('m_ag_dnew', 'fa-building-shield', 'Create Department')}
        ${l.some((a) => a.example) ? '' : btn('m_ag_ex', 'fa-wand-magic-sparkles', 'Add Margi', 'Add Margi, a ready-made story tracker, to edit or delete like any other agent')}
      </div>
      <div class="ntr_glab">Agent Roster</div>
      <div class="ntr_card m_ag_roster">
        <div class="m_ag_loose"${dl.length ? ' role="group" aria-label="No department"' : ''}>${top}</div>
        ${dl.map((d) => deptHtml(d, s)).join('')}
      </div>
      ${l.length >= 2 ? '<div class="cb_hint" style="margin:6px 4px 0;">When several agents run for the same reply, they go one at a time, from top to bottom.</div>' : ''}`;
  }

  // The picked agent's header: its picture (a click shows its buttons), name and job title typed in place, its switch,
  // when it runs and on what, and Run Now, Expand All or Collapse All, and More (Duplicate, Delete). The title is only
  // shown here and in the roster.
  function headHtml(a, allOpen) {
    const busy = current?.id === a.id;
    return `<div class="m_ag_head">
      <div class="m_ag_headrow">
        <button type="button" id="m_ag_pic" title="Change picture" aria-label="Change picture" aria-expanded="false" style="all:unset;cursor:pointer;border-radius:50%;flex:none;display:flex;">${picHtml(a, 44)}</button>
        <div class="m_ag_headtxt">
          <div class="m_ag_line">
            <div class="m_ag_names">
              <input type="text" class="text_pole m_ag_prof m_ag_nm" data-f="name" value="${esc(a.name)}" maxlength="60" size="${nameSize(a.name)}" placeholder="Name" aria-label="Name">
              <input type="text" class="text_pole m_ag_prof m_ag_ttl" data-f="title" value="${esc(a.title)}" maxlength="60" placeholder="Job title" aria-label="Job title">
            </div>
            ${onSwitch('m_ag_hon', a)}
          </div>
          <div class="m_ag_line">
            <span class="m_ag_status">${esc(status(a))}</span>
            ${headBtn('m_ag_hrun', busy ? 'fa-stop' : 'fa-play', busy ? 'Stop' : 'Run Now')}
            ${headBtn('m_ag_all', allOpen ? 'fa-angles-up' : 'fa-angles-down', allOpen ? 'Collapse All' : 'Expand All')}
            <span class="ntr_menu">${headBtn('m_ag_more', 'fa-ellipsis', 'More', ' aria-haspopup="menu" aria-expanded="false"')}</span>
          </div>
        </div>
      </div>
      <div id="m_ag_picmenu" hidden><div>
        ${btn('m_ag_up', 'fa-upload', 'Upload')}${btn('m_ag_url', 'fa-link', 'Use a Link')}${btn('m_ag_crop', 'fa-crop-simple', 'Crop')}${btn('m_ag_clr', 'fa-robot', 'Back to the Robot')}
      </div></div>
      <input type="file" id="m_ag_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
    </div>`;
  }

  // What each folded part is set to, in the words its buttons use. A setting that stops the agent from running gets a
  // warning; Test and Activity shows its latest run.
  function sums(a) {
    const fields = a.answer === 'fields';
    const n = fieldsOf(a).length;
    const api = ctx().mainApi;
    const ticked = SAMP.filter(([f]) => a[f + 'On']).map(([f, l]) => `${l} ${a[f]}`);
    if (a.effOn && (a.kind !== 'chat' || api === 'openai')) ticked.push(`Reasoning Effort ${nameOf(EFFORT, a.eff)}`);
    // What call() turns down before sending anything.
    const missing = a.kind === 'cc' ? (!a.ccModel.trim() ? 'No Model' : a.ccSource === 'custom' && !a.ccUrl.trim() ? 'No Link' : '')
      : a.kind === 'tc' && !a.tcUrl.trim() ? 'No Server Link' : '';
    const last = a.keep === 'chat' && a.last && !fields ? ' · Its Last Result' : '';
    const run = (runs.get(a.id) || [])[0];
    return {
      ins: !a.job.trim() && !usesFields(a) ? { warn: 'Empty: it won\'t run' } : { text: a.job.split('\n').map((l) => l.trim()).find(Boolean) || 'Empty' },
      ans: { text: !fields ? 'Free Text' : n ? `Fields · ${n} ${n === 1 ? 'Field' : 'Fields'}` : 'Fields · No Fields Yet' },
      runs: { text: `${nameOf(RUNS, a.runs)} · ${nameOf(KEEP, a.keep)}` },
      main: { text: !a.send ? 'Not Sent' : a.sendWhere === 'chat' ? `In Chat · Depth ${a.sendDepth} · As ${nameOf(ROLES, a.sendRole)}` : nameOf(WHERE, a.sendWhere) },
      conn: missing ? { warn: `${conn(a)} · ${missing}` } : { text: conn(a) },
      samp: { text: `${a.kind === 'chat' && (!OWN_SAMP_API[api] || !ticked.length) ? 'Your Chat\'s Samplers' : ticked.join(', ') || 'API Defaults'} · ${a.maxTokens} Tokens` },
      reads: { text: (usesFull(a) ? 'Your Chat\'s Full Prompt' : `${a.context} ${a.context === 1 ? 'Message' : 'Messages'} · ${a.split ? 'As Separate Messages' : 'As One Block'}`) + last },
      test: current?.id === a.id ? { text: 'Running...' }
        : run ? { ok: run.ok, text: `${run.test ? 'Last Test' : 'Last Run'} ${clock(run.at)} · ${run.ok ? 'Worked' : 'Failed'}` } : { text: 'No runs yet' },
    };
  }
  const sumHtml = (o) => (o.warn ? `<i class="fa-solid fa-triangle-exclamation"></i><span>${esc(o.warn)}</span>`
    : `${'ok' in o ? `<i class="fa-solid ${o.ok ? 'fa-circle-check' : 'fa-circle-xmark'}" style="color:${o.ok ? '#7c6' : '#d66'};"></i>` : ''}<span>${esc(o.text)}</span>`);
  function setSum(k, o) {
    const el = root?.querySelector(`.m_ag_fsum[data-sum="${k}"]`);
    if (!el) return;
    el.innerHTML = sumHtml(o);
    el.classList.toggle('cb_warn', !!o.warn);
  }
  // The summaries and the header's status line, after a change that doesn't redraw the page.
  function syncSums(a) {
    if (!root?.isConnected || !a) return;
    for (const [k, o] of Object.entries(sums(a))) setSum(k, o);
    const st = root.querySelector('.m_ag_status');
    if (st) st.textContent = status(a);
  }

  // A folded part of the agent's settings. Which parts are open is the same for every agent; the first time, only
  // Instructions is.
  const isOpen = (k) => { const o = settings().uiOpen || {}; return `ag_${k}` in o ? !!o[`ag_${k}`] : k === 'ins'; };
  function foldHtml(k, title, sum, body) {
    const open = isOpen(k);
    return `
      <div class="cb_collapse_toggle ntr_fold m_ag_fold${open ? ' ntr_open' : ''}" data-ag="${k}" tabindex="0" role="button" aria-expanded="${open}">
        <span class="m_ag_fwrap"><span>${title}</span><span class="m_ag_fsum${sum.warn ? ' cb_warn' : ''}" data-sum="${k}">${sumHtml(sum)}</span></span>
        <i class="fa-solid ${open ? 'fa-chevron-down' : 'fa-chevron-right'} cb_chevron"></i>
      </div>
      <div class="cb_collapse_content" style="display:${open ? 'block' : 'none'};">${body}</div>`;
  }

  // Answer: Free Text, or Fields with its list of fields and headings, like the Pinned Blocks list on the Layout page.
  // One row's settings are open at a time.
  let fieldOpen = null;
  function answerHtml(a) {
    const fields = a.answer === 'fields';
    const rows = fields ? a.fields.map((f, i) => fieldRowHtml(f, i, a.fields.length)).join('') : '';
    return `
      ${pills('aganswer', [['text', 'Free Text'], ['fields', 'Fields']], a.answer)}
      <div class="cb_hint"${fields ? '' : ' style="margin-bottom:0;"'}>${fields
        ? 'Named values NTR checks and keeps, shown as bars, lines and chips in a Dashboard. Headings group them there.'
        : 'The answer as the agent writes it, shown with Markdown.'}</div>
      ${fields ? `<div class="ntr_agfl">${rows || '<div class="cb_hint">No fields yet. Until it has one, it answers as Free Text.</div>'}</div>
      <div class="cb_actions" style="margin:8px 0 0;">${btn('m_agf_add', 'fa-plus', 'Add Field')}${btn('m_agf_head', 'fa-heading', 'Add Heading')}</div>` : ''}`;
  }
  const fieldWhat = (f) => (f.kind === 'heading' ? 'Heading'
    : f.type === 'num' ? `Number · ${f.min} to ${f.max}, starts at ${f.start}, ${f.step ? `±${f.step} per update` : 'no change limit'}${f.numShow === 'number' ? ', as a number' : ''}`
      : f.type === 'list' ? `List · ${f.listShow === 'chips' ? 'Chips' : 'Lines'}, up to ${f.cap}` : 'Text') + (f.hint ? ` · ${f.hint}` : '');
  function fieldRowHtml(f, i, n) {
    const head = f.kind === 'heading';
    const open = fieldOpen === f.id;
    const icon = head ? 'fa-heading' : f.type === 'num' ? 'fa-chart-simple' : f.type === 'list' ? 'fa-list-ul' : 'fa-font';
    const row = `
      <div class="ntr_agfl_row${head ? ' ntr_agfl_hrow' : ''}" data-fd="${f.id}">
        <i class="fa-solid fa-fw ${icon}"></i>
        <span class="ntr_agfl_name"><span class="ntr_agfl_nm">${esc(f.name)}</span><small>${esc(fieldWhat(f))}</small></span>
        <button type="button" class="menu_button m_agf_edit${open ? ' on' : ''}" title="Settings" aria-label="Settings for ${esc(f.name)}" aria-expanded="${open}"><i class="fa-solid fa-gear"></i></button>
        <button type="button" class="menu_button danger_button m_agf_del" title="Delete" aria-label="Delete ${esc(f.name)}"><i class="fa-solid fa-trash"></i></button>
      </div>`;
    if (!open) return row;
    const pick = (k, opts) => pills(`agf${k}-${f.id}`, opts, f[k]);
    const numIn = (k, label, r) => `<label>${label}<input type="number" class="text_pole m_agf_num" data-k="${k}" data-r="${r}" ${A.rangeAttrs(r)} value="${f[k]}"></label>`;
    const move = (cls, icon2, label, off) => `<button type="button" class="menu_button ${cls}"${off ? ' disabled' : ''}><i class="fa-solid ${icon2}"></i>${label}</button>`;
    const body = head ? '<div class="cb_hint">A heading groups the fields under it in a Dashboard. The agent never sees it.</div>' : `
        <label>Hint for the Agent <input type="text" class="text_pole m_agf_txt" data-k="hint" maxlength="200" value="${esc(f.hint)}" placeholder="What goes here, like: where the scene takes place"></label>
        <div class="cb_plab">Type</div>
        ${pick('type', FTYPES)}
        ${f.type === 'num' ? `<div class="ntr_agfl_grid">${numIn('min', 'Min', 'agFieldNum')}${numIn('max', 'Max', 'agFieldNum')}${numIn('start', 'Start', 'agFieldNum')}${numIn('step', 'Max Change', 'agFieldStep')}</div>
        <div class="cb_hint">Max Change is how far it can move in one update; 0 means no limit. Whatever the agent answers, it stays between Min and Max.</div>
        <div class="cb_plab">Show As</div>
        ${pick('numShow', [['bar', 'Bar'], ['number', 'Number']])}`
    : f.type === 'list' ? `<div class="cb_plab">Show As</div>
        ${pick('listShow', [['lines', 'Lines'], ['chips', 'Chips']])}
        <div class="ntr_agfl_grid">${numIn('cap', 'Max Items', 'agFieldCap')}</div>
        <div class="cb_hint">In Lines, the text before the first colon names the line, like a character's name, so a change shows on that line.</div>`
      : '<div class="cb_hint">One line of text.</div>'}`;
    return row + `
      <div class="ntr_tpanel ntr_agfl_edit" data-fd="${f.id}">
        <label>Name <input type="text" class="text_pole m_agf_txt" data-k="name" maxlength="40" value="${esc(f.name)}"></label>
        ${body}
        <div class="cb_actions" style="margin:4px 0 0;">${move('m_agf_up', 'fa-arrow-up', 'Move Up', i === 0)}${move('m_agf_down', 'fa-arrow-down', 'Move Down', i === n - 1)}</div>
      </div>`;
  }

  function editorHtml(a) {
    if (!a) return '';
    const fields = a.answer === 'fields';
    const sampRows = SAMP.map(([f, label, k]) => `
      <div class="cb_ovrow"><label class="checkbox_label"><input type="checkbox" class="m_ag_chk" data-f="${f}On" ${a[f + 'On'] ? 'checked' : ''}><span>${label}</span></label>
        <div class="m_o_body${a[f + 'On'] ? '' : ' cb_dim'}" data-for="${f}On">${slider(a, f, k)}</div></div>`).join('');
    const instructs = (() => { try { return ctx().getPresetManager('instruct')?.getAllPresets() || []; } catch (e) { return []; } })();
    const connBody = a.kind === 'cc' ? `
      ${lab('API', `<select class="text_pole m_ag_txt" data-f="ccSource" data-redraw="1" style="width:100%;">${opt(CC, a.ccSource)}</select>`)}
      ${lab('Model', `<input type="text" class="text_pole m_ag_txt" data-f="ccModel" data-redraw="1" value="${esc(a.ccModel)}" maxlength="200" placeholder="like deepseek/deepseek-chat-v3" style="width:100%;">`)}
      ${a.ccSource === 'custom' ? lab('Link', `<input type="text" class="text_pole m_ag_txt" data-f="ccUrl" value="${esc(a.ccUrl)}" maxlength="500" placeholder="like http://127.0.0.1:1234/v1" style="width:100%;">`) : ''}
      ${lab('Key', `<select class="text_pole m_ag_txt" data-f="ccKey" id="m_ag_key" style="width:100%;"><option value="">SillyTavern's active key</option>${a.ccKey ? `<option value="${esc(a.ccKey)}" selected>Loading your keys...</option>` : ''}</select>`)}
      <div class="cb_hint">Your keys saved in SillyTavern for this API, by name. NTR keeps only which one you picked, never the key.</div>
      ${lab('Prompt Post-Processing', `<select class="text_pole m_ag_txt" data-f="ccPost" style="width:100%;">${opt(POST, a.ccPost)}</select>`)}`
      : a.kind === 'tc' ? `
      ${lab('Server Type', `<select class="text_pole m_ag_txt" data-f="tcType" data-redraw="1" style="width:100%;">${opt(TC, a.tcType)}</select>`)}
      ${lab('Server Link', `<input type="text" class="text_pole m_ag_txt" data-f="tcUrl" data-redraw="1" value="${esc(a.tcUrl)}" maxlength="500" placeholder="like http://127.0.0.1:5001" style="width:100%;">`)}
      ${TC_MODEL.has(a.tcType) ? lab('Model', `<input type="text" class="text_pole m_ag_txt" data-f="tcModel" value="${esc(a.tcModel)}" maxlength="200" placeholder="Only if your server asks for one" style="width:100%;">`) : ''}
      ${lab('Instruct Template', `<select class="text_pole m_ag_txt" data-f="tcInstruct" style="width:100%;"><option value="">None (plain format)</option>${opt(instructs.map((n) => [n, n]), a.tcInstruct)}</select>`)}
      <div class="cb_hint">The prompt format your model expects. Only the format: none of your writing settings come along. A saved key for this server type is used if it needs one.</div>
      ${sharesChatServer(a) ? '<div class="cb_hint" style="margin-bottom:0;"><i class="fa-solid fa-circle-info"></i> This is the same server your chat uses, and it answers one request at a time, so this agent waits until your reply is finished.</div>' : ''}`
      : '<div class="cb_hint" style="margin-bottom:0;">Uses whatever your chat is connected to: its API, model and key. It waits until a reply is finished.</div>';
    const past = runs.get(a.id) || [];
    const full = usesFull(a);
    // Same as Chat's samplers only reach your chat's API on Chat Completion or Text Completion (see ownSamplers).
    const api = ctx().mainApi;
    const sampNote = a.kind !== 'chat' ? 'Unticked uses the API\'s own default. An API that doesn\'t use one ignores it. Your Chat Completion presets are never used.'
      : OWN_SAMP_API[api] ? 'Unticked uses your chat preset\'s value. A sampler your chat\'s API doesn\'t take is left out. Your preset itself never changes.'
        : 'Your chat isn\'t on Chat Completion or Text Completion, so it uses your chat\'s samplers. Switch your chat\'s API, or this agent\'s connection, to use these.';
    // Include Its Last Result reads what Saved in the Chat keeps, so with Activity Only it's dimmed with a note.
    const lastOff = a.keep !== 'chat';
    const parts = [
      ['ins', 'Instructions', `<textarea class="text_pole m_ag_txt" data-f="job" rows="5" maxlength="8000" aria-label="Instructions" placeholder="${fields ? 'What to track and any rules, like: only count injuries that happen on screen.' : 'What this agent does, like: keep track of where everyone is and what they carry. Answer only with the updated list.'}" style="width:100%;margin:0;">${esc(a.job)}</textarea>
        ${fields ? '<div class="cb_hint" style="margin-bottom:0;">Say what to track and any rules. NTR adds the answer format from your fields.</div>' : ''}`],
      ['ans', 'Answer', answerHtml(a)],
      ['runs', 'When It Runs', `
        ${lab('Runs', pills('agruns', RUNS, a.runs))}
        ${lab('Results', pills('agkeep', KEEP, a.keep))}
        ${fields ? '<div class="cb_hint">Fields keeps its values in the chat, so it always saves there.</div>' : ''}
        <div class="cb_hint" style="margin-bottom:0;">Activity Only shows its answers under Activity at the bottom until you reload. Saved in the Chat also keeps each answer on the message it was made for, so a swipe or a deleted message keeps the right one. To see saved answers on screen, add a Dashboard on the Layout page.</div>`],
      ...(a.keep === 'chat' ? [['main', 'Main AI', `
        <label class="checkbox_label"><input type="checkbox" class="m_ag_chk" data-f="send" data-redraw="1" ${a.send ? 'checked' : ''}><span>Send to Main AI</span></label>
        <div class="cb_hint"${a.send ? '' : ' style="margin-bottom:0;"'}>Puts its current saved answer, under its name, into your chat's prompt for every reply. After a swipe, it's the answer from before the swiped reply.</div>
        ${a.send ? `${lab('Where', pills('agwhere', WHERE.map(([v, l]) => [v, l]), a.sendWhere))}
        ${a.sendWhere === 'chat' ? `${lab('Depth', slider(a, 'sendDepth', 'agSendDepth'))}${lab('As', pills('agrole', ROLES.map(([v, l]) => [v, l]), a.sendRole))}
        <div class="cb_hint">Depth 0 is after the last message, 1 is before it, and so on.</div>` : ''}
        <label class="checkbox_label"><input type="checkbox" class="m_ag_chk" data-f="sendScan" ${a.sendScan ? 'checked' : ''}><span>Lorebooks Can Read It</span></label>
        <div class="cb_hint">Words in it can trigger lorebook entries, like a location's entry.</div>` : ''}
        <div class="cb_hint" style="margin-bottom:0;">To place it yourself instead, type <code class="m_ag_macro">{{agent::${esc(a.name)}}}</code> anywhere SillyTavern reads macros, like the Author's Note, a lorebook entry or another agent's instructions.</div>`]] : []),
      ['conn', 'Connection', `
        ${pills('agkind', [['chat', 'Same as Chat'], ['cc', 'Chat Completion'], ['tc', 'Text Completion (local)']], a.kind)}
        <div class="cb_hint">Chat Completion is an online API, or a local server with an OpenAI-style link (Custom). Text Completion is a local server like KoboldCpp or llama.cpp. Neither changes your chat's connection or SillyTavern's Connection Profiles.</div>
        ${connBody}`],
      ['samp', 'Samplers', `
        <div class="${a.kind === 'chat' && !OWN_SAMP_API[api] ? 'cb_dim' : ''}">
        ${sampRows}
        ${a.kind === 'chat' && api !== 'openai' ? '' : `<div class="cb_ovrow"><label class="checkbox_label"><input type="checkbox" class="m_ag_chk" data-f="effOn" ${a.effOn ? 'checked' : ''}><span>Reasoning Effort</span></label>
          <div class="m_o_body${a.effOn ? '' : ' cb_dim'}" data-for="effOn">${pills('ageff', EFFORT, a.eff)}</div></div>`}
        </div>
        <div class="cb_hint" style="margin-bottom:0;">${sampNote}</div>
        <div class="cb_sub">Reply</div>
        ${lab('Max Reply Length', slider(a, 'maxTokens', 'agMaxTokens'))}
        <div class="cb_hint" style="margin-bottom:0;">How long its answer may be.</div>`],
      ['reads', 'What It Reads', `
        ${a.kind === 'chat' ? `${lab('What It Sends', pills('agfull', [['own', 'Its Own Prompt'], ['full', 'Your Chat\'s Full Prompt']], a.full ? 'full' : 'own'))}
        <div class="cb_hint">Its Own Prompt: its instructions and the latest chat messages. Your Chat's Full Prompt: everything your chat sends for a reply (card, lorebooks, Author's Note, chat history), with its instructions added at the end. That costs more tokens.</div>` : ''}
        ${usesFull(a) ? '' : `${lab('Chat Messages', pills('agsplit', [['block', 'As One Block'], ['split', 'As Separate Messages']], a.split ? 'split' : 'block'))}
        <div class="cb_hint">As One Block: all the messages in one text. As Separate Messages: your messages as user and the others as AI. Each keeps its speaker's name either way.${a.kind === 'cc' ? ' If your API complains about the order of messages, set Prompt Post-Processing to Semi-strict.' : ''}</div>`}
        ${full ? '<div class="cb_hint">With your chat\'s full prompt, it reads as much of the chat as your chat does.</div>'
          : `${lab('Messages Read', slider(a, 'context', 'agContext'))}<div class="cb_hint">How many of the latest chat messages it reads.</div>`}
        ${fields ? '' : `<div class="${lastOff ? 'cb_dim' : ''}"><label class="checkbox_label"><input type="checkbox" class="m_ag_chk" data-f="last" ${a.last ? 'checked' : ''}${lastOff ? ' disabled' : ''}><span>Include Its Last Result</span></label>
        <div class="cb_hint"${lastOff ? ' style="margin-bottom:0;"' : ''}>Adds its newest saved answer from before the message it runs on to its prompt, so it updates what it had instead of starting over.</div></div>
        ${lastOff ? '<div class="cb_hint">Needs Results set to Saved in the Chat, under When It Runs.</div>' : ''}`}
        <div class="cb_actions" style="margin:6px 0 0;">${btn('m_ag_prev', 'fa-eye', 'Preview')}</div>
        <div id="m_ag_prevbox" hidden></div>`],
      ['test', 'Test and Activity', `
        <div class="cb_actions" style="margin:0;">${btn('m_ag_run', 'fa-play', 'Run Now')}${btn('m_ag_test', 'fa-plug-circle-check', 'Test Connection')}${btn('m_ag_stop', 'fa-stop', 'Stop')}</div>
        <div id="m_ag_act">${activityHtml(a, past)}</div>`],
    ];
    const sum = sums(a);
    return `<div class="m_ag_frame">
        ${headHtml(a, parts.every(([k]) => isOpen(k)))}
        <div class="m_ag_body">${parts.map(([k, title, body]) => foldHtml(k, title, sum[k], body)).join('')}</div>
      </div>`;
  }

  // What the agent sends on its next run, from the chat as it is now. Keys and links are never part of it.
  function previewHtml(a) {
    const box = (t) => `<div style="white-space:pre-wrap;max-height:240px;overflow:auto;margin-top:2px;">${t ? esc(t) : '<i>(empty)</i>'}</div>`;
    if (usesFull(a)) return `<div class="cb_hint" style="margin:8px 0 0;">Your chat's full prompt, as SillyTavern builds it for a reply, then these instructions at the end:${box(withLast(a, (ctx().chat || []).length - 1))}</div>`;
    const how = a.kind === 'chat' ? 'SillyTavern formats it for your chat\'s API before sending.'
      : a.kind === 'tc' ? (a.tcInstruct ? `Formatted with the ${esc(a.tcInstruct)} instruct template before sending.` : 'Sent in plain format.') : 'Sent as these messages.';
    return prompt(a).map((m) => `<div class="cb_hint" style="margin:8px 0 0;"><strong>${ROLE[m.role]}</strong>${box(m.content)}</div>`).join('')
      + `<div class="cb_hint" style="margin:8px 0 0;">${how}</div>`;
  }

  function activityHtml(a, l = runs.get(a.id) || []) {
    const busy = current && current.id === a.id ? '<div class="cb_hint" style="margin:8px 0 0;"><i class="fa-solid fa-spinner fa-spin"></i> Running...</div>' : '';
    const rows = l.map((r) => {
      const head = `<i class="fa-solid ${r.ok ? 'fa-circle-check' : 'fa-circle-xmark'}" style="color:${r.ok ? '#7c6' : '#d66'};"></i> ${clock(r.at)} ·${r.test ? 'Test · ' : ''}${(r.ms / 1000).toFixed(1)} s${r.note ? ` · ${esc(r.note)}` : ''}`;
      if (!r.ok) return `<div class="cb_hint" style="margin:6px 0 0;">${head} · ${esc(r.text)}</div>`;
      return `<details class="cb_hint" style="margin:6px 0 0;"><summary style="cursor:pointer;">${head} · ${esc(r.text.slice(0, 70))}${r.text.length > 70 ? '...' : ''}</summary><div style="white-space:pre-wrap;margin-top:4px;">${esc(r.text)}</div></details>`;
    }).join('');
    return busy + (rows || (busy ? '' : '<div class="cb_hint" style="margin:8px 0 0;">No runs yet. The last 10 stay here until you reload.</div>'));
  }

  function renderActivity() {
    if (!root?.isConnected) return;
    const a = byId(settings().agPick);
    const box = root.querySelector('#m_ag_act');
    if (a && box) box.innerHTML = activityHtml(a);
    const stop = root.querySelector('#m_ag_stop');
    // style.display, not hidden: SillyTavern's buttons are flex boxes, which would show a hidden one anyway.
    if (stop) stop.style.display = current ? '' : 'none';
    // The header's Run Now is Stop while this agent runs.
    const run = root.querySelector('#m_ag_hrun');
    if (a && run) {
      const busy = current?.id === a.id;
      run.title = busy ? 'Stop' : 'Run Now';
      run.setAttribute('aria-label', run.title);
      run.querySelector('i').className = `fa-solid fa-fw ${busy ? 'fa-stop' : 'fa-play'}`;
    }
    if (a) setSum('test', sums(a).test);
  }

  // Your saved keys for an API, by name, from SillyTavern. Only names and ids are read, never the keys.
  async function fillKeys(a) {
    const sel = root?.querySelector('#m_ag_key');
    if (!sel) return;
    let state = {};
    try {
      const r = await fetch('/api/secrets/read', { method: 'POST', headers: ctx().getRequestHeaders() });
      state = r.ok ? await r.json() : {};
    } catch (e) { state = {}; }
    const keys = Array.isArray(state[`api_key_${a.ccSource}`]) ? state[`api_key_${a.ccSource}`] : [];
    if (!sel.isConnected) return;
    sel.innerHTML = `<option value="">SillyTavern's active key</option>` + keys.map((k, i) => `<option value="${esc(k.id)}"${k.id === a.ccKey ? ' selected' : ''}>${esc(k.label || `Key ${i + 1}`)}${k.active ? ' (active)' : ''}</option>`).join('')
      + (a.ccKey && !keys.some((k) => k.id === a.ccKey) ? '<option value="" disabled>The key this agent used is gone</option>' : '');
    if (a.ccKey && !keys.some((k) => k.id === a.ccKey)) sel.value = '';
  }

  // After a change that draws the page again, focus goes back to the button that made it (focusAfter, a selector).
  let focusAfter = null;
  function render() {
    // A drag redraws the page when it's dropped.
    if (!root?.isConnected || dragger?.busy()) return;
    const s = settings();
    sortAgents();
    if (s.agPick && !byId(s.agPick)) s.agPick = '';
    if (!s.agPick && list().length) s.agPick = list()[0].id;
    const a = byId(s.agPick);
    root.innerHTML = listHtml(s) + `<div id="m_ag_edit">${editorHtml(a)}</div>`;
    bindAll(s, a);
    renderActivity();
    if (a?.kind === 'cc') fillKeys(a);
    if (focusAfter) root.querySelector(focusAfter)?.focus();
    focusAfter = null;
  }

  // Read out by screen readers, after a move draws the page again.
  function say(text) {
    const el = document.getElementById('m_ag_say');
    if (!el) return;
    el.textContent = '';
    setTimeout(() => { el.textContent = text; }, 60);
  }
  const deptSel = (d, part) => `.m_ag_dept[data-dept="${d.id}"] ${part}`;
  // A department's name: required, and not one another department already has (whatever the capitals). It's cut to
  // its length first, so the name checked is the one saved.
  const askDeptName = (anchor, value, ok, self = null) => askText(anchor, {
    label: 'Department name', value, ok,
    check: (v) => {
      const name = v.slice(0, 60).trim();
      return !name ? { error: 'Type a name first.' }
        : depts().some((x) => x !== self && x.name.toLowerCase() === name.toLowerCase()) ? { error: 'A department with that name already exists.' } : { value: name };
    },
  });
  // The header's menu hangs under the header, which stays put while the page scrolls, so in a short menu panel the
  // page can't be scrolled to reach the menu's end. It gets the room left below it instead, and scrolls inside.
  function fitPop(pop) {
    const box = root?.closest('.ntr_body');
    if (!box) return;
    const room = box.getBoundingClientRect().bottom - pop.getBoundingClientRect().top - 8;
    pop.style.maxHeight = `${Math.max(96, Math.min(320, room))}px`;
  }
  // A new department, at the end and open. Null on Cancel or at the limit.
  async function makeDept(anchor) {
    if (depts().length >= DEPT_MAX) { toastr.info(`Up to ${DEPT_MAX} departments.`, 'Agents'); return null; }
    const name = await askDeptName(anchor, `Department ${depts().length + 1}`, '<i class="fa-solid fa-building-shield"></i> Create');
    if (!name) return null;
    const d = { id: newId('dp'), name, ids: [] };
    depts().push(d);
    return d;
  }

  // ----- Dragging in the roster (dragSort in index.js) -----
  // An agent moves within its group or into another one; a department moves among the departments.
  let dragger = null;
  function dragPick(grip) {
    const dept = grip.classList.contains('m_ag_dgrip');
    return { item: dept ? grip.closest('.m_ag_dept') : grip.closest('.m_ag_row'), kind: dept ? 'dept' : 'agent', scope: grip.closest('.m_ag_roster') };
  }
  function dragPlace(el, d, after) {
    if (d.kind === 'dept') {
      const dep = el.closest('.m_ag_dept');
      if (dep && dep !== d.item) dep.parentElement.insertBefore(d.item, after(dep) ? dep.nextSibling : dep);
      return null;
    }
    d.into = null;
    const row = el.closest('.m_ag_row');
    if (row && row !== d.item) { row.parentElement.insertBefore(d.item, after(row) ? row.nextSibling : row); return null; }
    const head = el.closest('.m_ag_dhead');
    if (head) {
      // On an open department's header it goes first, where the gap shows. A folded one has no room for the gap, and
      // the rows under it would slide up under the pointer, so the gap stays where it is and the lit-up header shows
      // where it goes: last, like Move to Department, so it doesn't jump ahead in the run order.
      const body = head.parentElement.querySelector('.m_ag_dbody');
      if (body.hidden) d.into = head.parentElement.dataset.dept;
      else if (body.firstElementChild !== d.item) body.insertBefore(d.item, body.firstChild);
      return head;
    }
    const box = el.closest('.m_ag_loose, .m_ag_dbody');
    if (box && !box.contains(d.item)) box.appendChild(d.item);
    return null;
  }
  // The roster's new order, read from where the rows ended up. Escape (d.moved false) draws it back as it was.
  function dragDone(d) {
    if (d.moved) {
      const dl = depts();
      const order = [...d.scope.querySelectorAll('.m_ag_dept')].map((el) => el.dataset.dept);
      dl.sort((x, y) => order.indexOf(x.id) - order.indexOf(y.id));
      for (const x of dl) x.ids = [...d.scope.querySelectorAll(`${deptSel(x, '.m_ag_row')}`)].map((r) => r.dataset.id);
      setLoose([...d.scope.querySelectorAll('.m_ag_loose > .m_ag_row')].map((r) => r.dataset.id));
      const into = d.into && dl.find((x) => x.id === d.into);
      if (into) {
        for (const x of dl) x.ids = x.ids.filter((id) => id !== d.item.dataset.id);
        into.ids.push(d.item.dataset.id);
      }
      sortAgents();
      save();
    }
    render();
  }

  // SillyTavern's crop box, square, on the picture at src. Returns the cropped part as a PNG file (transparency kept), or
  // null on Cancel. Without the crop box (an older SillyTavern), the whole picture. A picture from another site that
  // doesn't allow reading it can't be cropped.
  async function cropFile(src, revoke = false) {
    try {
      const img = new Image();
      if (!src.startsWith('blob:')) img.crossOrigin = 'anonymous';
      await new Promise((ok, no) => { img.onload = ok; img.onerror = () => no(new Error('This picture can\'t be cropped: its site doesn\'t allow it. Upload the file instead.')); img.src = src; });
      const c = ctx();
      let box = { x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight };
      if (typeof c.Popup === 'function' && c.POPUP_TYPE?.CROP != null) {
        const p = new c.Popup('', c.POPUP_TYPE.CROP, '', { cropImage: src, cropAspect: 1, okButton: 'Crop' });
        // On Crop it answers with its own JPEG of the crop (no transparency), on Cancel with null: only its box is used.
        if (!(await p.show()) || !p.cropData) return null;
        box = p.cropData;
      }
      const w = Math.max(1, Math.round(box.width)), h = Math.max(1, Math.round(box.height));
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, Math.round(box.x), Math.round(box.y), w, h, 0, 0, w, h);
      let blob;
      try { blob = await new Promise((ok) => cv.toBlob(ok, 'image/png')); } catch (e) { throw new Error('This picture can\'t be cropped: its site doesn\'t allow it. Upload the file instead.'); }
      if (!blob) throw new Error('The cropped picture couldn\'t be made.');
      return new File([blob], 'agent.png', { type: 'image/png' });
    } finally { if (revoke) URL.revokeObjectURL(src); }
  }

  // After picking or adding an agent, its header is scrolled into sight if a long roster pushed it out.
  function showHead() {
    const head = root?.querySelector('.m_ag_head');
    const box = root?.closest('.ntr_body');
    if (!head || !box) return;
    const h = head.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    if (h.top >= b.top && h.bottom <= b.bottom) return;
    box.scrollTo({ top: box.scrollTop + h.top - b.top - 8, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function bindAll(s, a) {
    const changed = (redraw) => { sortAgents(); save(); if (redraw) render(); else syncSums(a); };
    // A click anywhere but in a menu closes it.
    root.onclick = (e) => { if (!e.target.closest('.ntr_menu')) closePops(root); };
    root.querySelectorAll('.m_ag_row').forEach((row) => {
      row.querySelector('.m_ag_pick').onclick = () => { s.agPick = row.dataset.id; changed(true); showHead(); };
      row.querySelector('.m_ag_on').onchange = function() {
        const x = byId(row.dataset.id);
        if (!x) return;
        x.on = this.checked;
        if (x === a) root.querySelector('.m_ag_hon').checked = x.on;
        changed(false);
      };
    });
    root.querySelector('#m_ag_new').onclick = async function() {
      const name = await askText(this, { label: 'Agent name', value: `Agent ${list().length + 1}`, ok: '<i class="fa-solid fa-plus"></i> Hire', check: (v) => (v.trim() ? { value: v.trim().slice(0, 60) } : { error: 'Type a name first.' }) });
      if (!name) return;
      if (list().length >= 30) { toastr.info('Up to 30 agents.', 'Agents'); return; }
      const x = fresh(name);
      list().push(x);
      s.agPick = x.id;
      changed(true);
      showHead();
    };
    const ex = root.querySelector('#m_ag_ex');
    if (ex) ex.onclick = () => {
      if (list().length >= 30) { toastr.info('Up to 30 agents.', 'Agents'); return; }
      const x = { ...fresh('Margi'), title: 'Story Tracker', example: true, pic: MARGI_PIC, on: true, job: MARGI_JOB, runs: 'reply', keep: 'chat', answer: 'fields', fields: cleanFields(MARGI_FIELDS) };
      list().push(x);
      s.agPick = x.id;
      changed(true);
      showHead();
      toastr.info('Margi runs after every reply. To see her on screen, add a Dashboard on the Layout page.', 'Agents');
    };
    root.querySelector('#m_ag_dnew').onclick = async function() {
      const d = await makeDept(this);
      if (!d) return;
      focusAfter = deptSel(d, '.m_ag_dpick');
      changed(true);
    };

    // Departments: the name opens and folds it, More has Rename, Move Up, Move Down and Delete. Rename and Delete ask
    // under its row.
    root.querySelectorAll('.m_ag_dept').forEach((el) => {
      const d = depts().find((x) => x.id === el.dataset.dept);
      if (!d) return;
      const head = el.querySelector('.m_ag_dhead');
      el.querySelector('.m_ag_dpick').onclick = () => {
        s.uiOpen[`agd_${d.id}`] = !deptOpen(d);
        focusAfter = deptSel(d, '.m_ag_dpick');
        changed(true);
      };
      const dmore = el.querySelector('.m_ag_dmore');
      dmore.onclick = () => {
        const i = depts().indexOf(d);
        const pop = popMenu(dmore, `
          <button type="button" data-act="ren"><i class="fa-solid fa-pen fa-fw"></i>Rename</button>
          <button type="button" data-act="up"${i <= 0 ? ' disabled' : ''}><i class="fa-solid fa-arrow-up fa-fw"></i>Move Up</button>
          <button type="button" data-act="down"${i >= depts().length - 1 ? ' disabled' : ''}><i class="fa-solid fa-arrow-down fa-fw"></i>Move Down</button>
          <button type="button" data-act="del" class="ntr_danger"><i class="fa-solid fa-trash-can fa-fw"></i>Delete</button>`);
        if (!pop) return;
        pop.onclick = async (e) => {
          const b = e.target.closest('button[data-act]');
          if (!b || b.disabled) return;
          closePops(root);
          const act = b.dataset.act;
          if (act === 'ren') {
            const name = await askDeptName(head, d.name, '<i class="fa-solid fa-pen"></i> Rename', d);
            if (!name) return;
            d.name = name;
            focusAfter = deptSel(d, '.m_ag_dmore');
            changed(true);
          } else if (act === 'del') {
            const n = d.ids.length;
            const q = !n ? `Delete the department "${d.name}"?`
              : `Delete the department "${d.name}"? ${n === 1 ? 'Its agent stays' : `Its ${n} agents stay`}, outside any department.`;
            if (!(await askYes(head, q, 'Delete', { danger: true }))) return;
            // Its agents go to the end of the ones in no department, in their order (sortAgents).
            depts().splice(depts().indexOf(d), 1);
            delete s.uiOpen[`agd_${d.id}`];
            focusAfter = '#m_ag_dnew';
            changed(true);
          } else {
            const dl = depts();
            const at = dl.indexOf(d);
            const to = at + (act === 'up' ? -1 : 1);
            if (to < 0 || to >= dl.length) return;
            [dl[at], dl[to]] = [dl[to], dl[at]];
            focusAfter = deptSel(d, '.m_ag_dmore');
            changed(true);
            say(`Department moved ${act}.`);
          }
        };
      };
    });
    if (!a) return;
    root.querySelector('.m_ag_hon').onchange = function() {
      a.on = this.checked;
      const sw = root.querySelector(`.m_ag_row[data-id="${a.id}"] .m_ag_on`);
      if (sw) sw.checked = a.on;
      changed(false);
    };
    root.querySelector('#m_ag_hrun').onclick = () => { if (current?.id === a.id) current.ctrl.abort(); else enqueue(a.id); };

    // The folded parts, and Expand All or Collapse All for all of them.
    const folds = [...root.querySelectorAll('.m_ag_fold')];
    const allBtn = root.querySelector('#m_ag_all');
    const setFold = (h, open) => {
      h.classList.toggle('ntr_open', open);
      h.setAttribute('aria-expanded', String(open));
      h.querySelector('.cb_chevron').className = `fa-solid ${open ? 'fa-chevron-down' : 'fa-chevron-right'} cb_chevron`;
      h.nextElementSibling.style.display = open ? 'block' : 'none';
      s.uiOpen[`ag_${h.dataset.ag}`] = open;
    };
    const syncAll = () => {
      const all = folds.every((h) => h.classList.contains('ntr_open'));
      allBtn.title = all ? 'Collapse All' : 'Expand All';
      allBtn.setAttribute('aria-label', allBtn.title);
      allBtn.querySelector('i').className = `fa-solid fa-fw ${all ? 'fa-angles-up' : 'fa-angles-down'}`;
    };
    folds.forEach((h) => {
      h.onclick = () => { setFold(h, !h.classList.contains('ntr_open')); save(); syncAll(); };
      h.onkeydown = (e) => { if (e.target === h && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); h.click(); } };
    });
    allBtn.onclick = () => {
      const open = !folds.every((h) => h.classList.contains('ntr_open'));
      folds.forEach((h) => setFold(h, open));
      save();
      syncAll();
    };

    // More: Duplicate, Move Up and Move Down (within its group), Move to Department, and Delete. Move to Department
    // shows the departments in the same menu; with none yet, it makes one. Delete and a new department's name ask
    // under the header, where the menu was. Focus comes back to More after a move.
    const more = root.querySelector('#m_ag_more');
    const ask = () => root.querySelector('.m_ag_headrow');
    const group = () => deptOf(a.id)?.ids || loose().map((x) => x.id);
    const moveBy = (dir) => {
      const d = deptOf(a.id);
      const ids = group();
      const i = ids.indexOf(a.id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= ids.length) return;
      [ids[i], ids[j]] = [ids[j], ids[i]];
      if (!d) setLoose(ids);
      focusAfter = '#m_ag_more';
      changed(true);
      say(`Moved ${dir < 0 ? 'up' : 'down'}. Now ${j + 1} of ${ids.length}${d ? ` in ${d.name}` : ''}.`);
    };
    // Into a department (at its end, opened so it shows there), or out of one (at the end of the ones in no department).
    const moveTo = (d) => {
      for (const x of depts()) x.ids = x.ids.filter((id) => id !== a.id);
      if (d) { d.ids.push(a.id); s.uiOpen[`agd_${d.id}`] = true; }
      focusAfter = '#m_ag_more';
      changed(true);
      say(d ? `Moved to ${d.name}.` : 'Moved out of its department.');
    };
    const toNew = async () => { const d = await makeDept(ask()); if (d) moveTo(d); };
    more.onclick = () => {
      const cur = deptOf(a.id);
      const ids = group();
      const i = ids.indexOf(a.id);
      const pop = popMenu(more, `
        <button type="button" data-act="dup"><i class="fa-solid fa-copy fa-fw"></i>Duplicate</button>
        <button type="button" data-act="up"${i <= 0 ? ' disabled' : ''}><i class="fa-solid fa-arrow-up fa-fw"></i>Move Up</button>
        <button type="button" data-act="down"${i >= ids.length - 1 ? ' disabled' : ''}><i class="fa-solid fa-arrow-down fa-fw"></i>Move Down</button>
        <button type="button" data-act="to"><i class="fa-solid fa-share fa-fw"></i>${depts().length ? 'Move to Department…' : 'Move to New Department…'}</button>
        <button type="button" data-act="del" class="ntr_danger"><i class="fa-solid fa-trash-can fa-fw"></i>Delete</button>`);
      if (!pop) return;
      fitPop(pop);
      pop.onclick = (e) => {
        // Kept from the page's own click, which closes a menu when the click lands outside it: the department list
        // takes the place of the button that was clicked.
        e.stopPropagation();
        const b = e.target.closest('button[data-act]');
        if (!b || b.disabled) return;
        const act = b.dataset.act;
        if (act === 'to' && depts().length) {
          pop.innerHTML = depts().map((d) => `<button type="button" data-act="dept" data-dept="${d.id}"${d === cur ? ' class="ntr_here" disabled' : ''}><i class="fa-solid fa-building fa-fw"></i>${esc(d.name)}</button>`).join('')
            + `<button type="button" data-act="none"${cur ? '' : ' class="ntr_here" disabled'}><i class="fa-solid fa-inbox fa-fw"></i>No Department</button>`
            + '<button type="button" data-act="new"><i class="fa-solid fa-building-shield fa-fw"></i>New Department…</button>';
          pop.querySelector('button:not(:disabled)')?.focus();
          return;
        }
        closePops(root);
        if (act === 'dup') dup();
        else if (act === 'del') del();
        else if (act === 'up' || act === 'down') moveBy(act === 'up' ? -1 : 1);
        else if (act === 'dept') moveTo(depts().find((d) => d.id === b.dataset.dept) || null);
        else if (act === 'none') moveTo(null);
        else toNew();
      };
    };
    // The copy goes right under the original, in its department.
    const dup = () => {
      if (list().length >= 30) { toastr.info('Up to 30 agents.', 'Agents'); return; }
      const x = { ...structuredClone(a), id: newId('ag'), name: `${a.name} (copy)`.slice(0, 60), on: false, example: false };
      list().splice(list().indexOf(a) + 1, 0, x);
      const d = deptOf(a.id);
      if (d) d.ids.splice(d.ids.indexOf(a.id) + 1, 0, x.id);
      s.agPick = x.id;
      changed(true);
    };
    // Name and job title, typed in place. An empty name goes back to the one it had. Saving updates the text where it
    // shows instead of redrawing the page: the change fires when the field loses focus, which is often a click on
    // Duplicate or on another agent, and a redraw then would swallow that click.
    root.querySelectorAll('.m_ag_prof').forEach((el) => {
      // The name's box is as wide as the name, so the job title sits right after it.
      if (el.dataset.f === 'name') el.oninput = () => { el.size = nameSize(el.value); };
      el.onkeydown = (e) => { if (e.key === 'Enter') el.blur(); };
      el.onchange = () => {
        const v = el.value.trim().slice(0, 60);
        if (el.dataset.f === 'name' && !v) { el.value = a.name; el.size = nameSize(a.name); return; }
        el.value = v;
        a[el.dataset.f] = v;
        changed(false);
        const row = root.querySelector(`.m_ag_row[data-id="${a.id}"]`);
        if (row) {
          row.querySelector('.m_ag_rname').textContent = a.name;
          row.querySelector('.m_ag_rtitle').textContent = a.title ? ` · ${a.title}` : '';
        }
        root.querySelectorAll(`.m_ag_row[data-id="${a.id}"] .m_ag_on, .m_ag_hon`).forEach((sw) => {
          sw.title = `Turn ${a.name} on or off`;
          sw.setAttribute('aria-label', sw.title);
        });
        const macro = root.querySelector('.m_ag_macro');
        if (macro) macro.textContent = `{{agent::${a.name}}}`;
        refreshBoxes();
      };
    });
    const del = async () => {
      if (!(await askYes(root.querySelector('.m_ag_headrow'), `Delete "${a.name}"? This can't be undone.`, 'Delete', { danger: true }))) return;
      if (current?.id === a.id) current.ctrl.abort();
      s.agents = list().filter((x) => x !== a);
      checked.add(s.agents);
      runs.delete(a.id);
      answers.delete(a.id);
      fails.delete(a.id);
      s.agPick = '';
      changed(true);
      deleteFileIfUnused(a.pic);
    };

    // Picture: clicking it opens its buttons. Uploads and Crop go through SillyTavern's crop box, like its avatars.
    const file = root.querySelector('#m_ag_file');
    const picBtn = root.querySelector('#m_ag_pic');
    const picMenu = root.querySelector('#m_ag_picmenu');
    picBtn.onclick = () => { picMenu.hidden = !picMenu.hidden; picBtn.setAttribute('aria-expanded', String(!picMenu.hidden)); };
    const setPic = (url) => { const old = a.pic; a.pic = url; changed(true); if (old && old !== url) deleteFileIfUnused(old); };
    const fail = (e) => { console.error('[NTR agent picture]', e); toastr.error(e.message || 'Upload failed', 'Agent picture'); };
    root.querySelector('#m_ag_up').onclick = () => file.click();
    root.querySelector('#m_ag_url').onclick = async function() { const url = await askImageUrl('Agent picture', this, false); if (url) setPic(url); };
    root.querySelector('#m_ag_clr').onclick = () => setPic('');
    root.querySelector('#m_ag_clr').disabled = !a.pic;
    root.querySelector('#m_ag_crop').disabled = !a.pic;
    root.querySelector('#m_ag_crop').onclick = async () => {
      try { const f = await cropFile(FULL_PIC[a.pic] || media(a.pic)); if (f) setPic(await uploadImage(f, 'agent', { max: 128 })); } catch (e) { fail(e); }
    };
    file.onchange = async () => {
      const f = file.files[0];
      file.value = '';
      if (!f) return;
      try {
        // A GIF goes as it is, to keep its animation.
        const out = f.type === 'image/gif' ? f : await cropFile(URL.createObjectURL(f), true);
        if (out) setPic(await uploadImage(out, 'agent', { max: 128 }));
      } catch (e) { fail(e); }
    };
    onPills(root, 'agruns', (v) => { a.runs = v; changed(true); });
    onPills(root, 'agkind', (v) => { a.kind = v; changed(true); });
    onPills(root, 'agfull', (v) => { a.full = v === 'full'; changed(true); });
    onPills(root, 'agsplit', (v) => { a.split = v === 'split'; changed(true); });
    onPills(root, 'agkeep', (v) => { a.keep = v; changed(true); refreshBoxes(); });
    onPills(root, 'aganswer', (v) => { a.answer = v; if (v === 'fields') a.keep = 'chat'; changed(true); refreshBoxes(); });
    if (a.answer === 'fields') {
      const off = root.querySelector('input[name="cbr_agkeep"][value="off"]');
      if (off) { off.disabled = true; off.closest('.cb_pill')?.classList.add('cb_dim'); }
    }
    bindFields(a, changed);
    onPills(root, 'agwhere', (v) => { a.sendWhere = v; changed(true); });
    onPills(root, 'agrole', (v) => { a.sendRole = v; changed(false); });
    onPills(root, 'ageff', (v) => { a.eff = v; changed(false); });

    root.querySelectorAll('.m_ag_txt').forEach((el) => {
      el.onchange = () => {
        const f = el.dataset.f;
        a[f] = el.value.slice(0, Number(el.getAttribute('maxlength')) || 500);
        if (f === 'ccSource') a.ccKey = '';
        changed(!!el.dataset.redraw);
      };
    });
    // Instructions' summary follows what's typed; the text itself saves when the box loses focus.
    const job = root.querySelector('.m_ag_txt[data-f="job"]');
    job.oninput = () => setSum('ins', sums({ ...a, job: job.value }).ins);
    root.querySelectorAll('.m_ag_chk').forEach((el) => {
      el.onchange = () => {
        a[el.dataset.f] = el.checked;
        root.querySelector(`.m_o_body[data-for="${el.dataset.f}"]`)?.classList.toggle('cb_dim', !el.checked);
        changed(!!el.dataset.redraw);
      };
    });
    root.querySelectorAll('.m_ag_num').forEach((el) => {
      el.oninput = () => {
        const f = el.dataset.f;
        a[f] = num(el.dataset.k, el.value, a[f]);
        root.querySelector(`#m_ag_v_${f}`).textContent = a[f];
        syncSums(a);
      };
      el.onchange = () => changed(false);
    });
    root.querySelector('#m_ag_prev').onclick = () => {
      const box = root.querySelector('#m_ag_prevbox');
      box.hidden = !box.hidden;
      if (!box.hidden) box.innerHTML = previewHtml(a);
    };
    root.querySelector('#m_ag_run').onclick = () => enqueue(a.id);
    root.querySelector('#m_ag_test').onclick = () => enqueue(a.id, true);
    root.querySelector('#m_ag_stop').onclick = () => current?.ctrl.abort();
  }

  // The Answer part's field list. Typing a name, hint or number only updates its row, like the name at the top: a
  // redraw when the box loses focus would swallow a click on another button.
  function bindFields(a, changed) {
    const box = root.querySelector('.ntr_agfl');
    const add = (f) => {
      if (a.fields.length >= FIELD_MAX) { toastr.info(`Up to ${FIELD_MAX} fields and headings.`, 'Agents'); return; }
      const o = cleanField(f);
      a.fields.push(o);
      fieldOpen = o.id;
      changed(true);
      refreshBoxes();
    };
    const freeName = (base) => {
      const used = new Set(a.fields.map((f) => f.name.toLowerCase()));
      let n = 1;
      while (used.has((n > 1 ? `${base} ${n}` : base).toLowerCase())) n++;
      return n > 1 ? `${base} ${n}` : base;
    };
    root.querySelector('#m_agf_add')?.addEventListener('click', () => add({ name: freeName('New Field') }));
    root.querySelector('#m_agf_head')?.addEventListener('click', () => add({ kind: 'heading', name: 'New Heading' }));
    if (!box) return;
    const at = (el) => a.fields.find((f) => f.id === el.closest('[data-fd]')?.dataset.fd);
    const sync = (f) => {
      const row = box.querySelector(`.ntr_agfl_row[data-fd="${f.id}"]`);
      if (!row) return;
      row.querySelector('.ntr_agfl_nm').textContent = f.name;
      row.querySelector('small').textContent = fieldWhat(f);
      row.querySelector('.m_agf_edit').setAttribute('aria-label', `Settings for ${f.name}`);
      row.querySelector('.m_agf_del').setAttribute('aria-label', `Delete ${f.name}`);
    };
    box.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('.m_agf_txt, .m_agf_num')) e.target.blur(); });
    box.addEventListener('click', async (e) => {
      const b = e.target.closest('button');
      const f = b && at(b);
      if (!f) return;
      if (b.classList.contains('m_agf_edit')) { fieldOpen = fieldOpen === f.id ? null : f.id; render(); return; }
      if (b.classList.contains('m_agf_del')) {
        if (!(await askYes(b, `Delete "${f.name}"?`, 'Delete', { danger: true }))) return;
        a.fields = a.fields.filter((x) => x !== f);
        if (fieldOpen === f.id) fieldOpen = null;
        changed(true);
        refreshBoxes();
        return;
      }
      const d = b.classList.contains('m_agf_up') ? -1 : b.classList.contains('m_agf_down') ? 1 : 0;
      const i = a.fields.indexOf(f);
      if (!d || i + d < 0 || i + d >= a.fields.length) return;
      a.fields.splice(i, 1);
      a.fields.splice(i + d, 0, f);
      changed(true);
      refreshBoxes();
    });
    box.addEventListener('change', (e) => {
      const t = e.target;
      const f = at(t);
      if (!f) return;
      if (t.classList.contains('m_agf_txt')) {
        if (t.dataset.k === 'name') {
          f.name = fieldName(t.value, f.name);
          if (f.kind === 'field' && a.fields.some((x) => x !== f && x.kind === 'field' && x.name.toLowerCase() === f.name.toLowerCase())) {
            toastr.warning(`Another field is already called "${f.name}". Only the first one gets values.`, 'Agents');
          }
        } else f.hint = t.value.trim().slice(0, 200);
        t.value = f[t.dataset.k];
      } else if (t.classList.contains('m_agf_num')) {
        f[t.dataset.k] = num(t.dataset.r, t.value, f[t.dataset.k]);
        // Min, Max and Start keep each other in order.
        Object.assign(f, cleanField(f));
        t.closest('.ntr_agfl_edit').querySelectorAll('.m_agf_num').forEach((el) => { el.value = f[el.dataset.k]; });
      } else {
        const m = /^cbr_agf(type|numShow|listShow)-/.exec(t.name || '');
        if (!m || !t.checked) return;
        f[m[1]] = t.value;
        changed(true);
        refreshBoxes();
        return;
      }
      sync(f);
      changed(false);
      refreshBoxes();
    });
  }

  function bind(overlay, s) {
    root = overlay.querySelector('#m_ag_root');
    // Switching the page off also stops a run in progress; runs still waiting are skipped.
    overlay.querySelector('#m_ag_enable').onchange = function() { s.agEnabled = this.checked; save(); if (!this.checked) current?.ctrl.abort(); };
    dragger = dragSort(root, { pick: dragPick, place: dragPlace, done: dragDone });
    render();
  }

  // ----- In a Pinned Block (Agent Results) -----
  // Each picked agent's newest saved result up to message upTo (Reader Mode's page, or the last message). Free Text is
  // formatted like a message: Markdown and your regexes, sanitized by SillyTavern. Fields is drawn as rows under its
  // headings, with what changed since the agent's result on an earlier message marked, and a click on a value edits
  // it. Run Again (on that message), Edit Saved Text and Undo sit next to its name. Stacked shows every agent, each
  // folding open and closed; Tabs shows one. Folds and tabs are kept for each box until you reload.
  // editing: the saved text being edited; fieldEdit: the one value being edited. Both by agent, chat, message and swipe
  // date, so a redraw keeps them only on the result they were started on.
  let editing = null;
  let fieldEdit = null;
  let focusEdit = false;
  const folds = new Set();
  const tabs = new Map();
  const iconBtn = (act, icon, title, extra = '') => `<button type="button" class="ntr_agres_btn" data-act="${act}"${extra} title="${esc(title)}" aria-label="${esc(title)}"><i class="fa-solid fa-fw ${icon}"></i></button>`;
  const sr = (t) => `<span class="ntr_sr">${esc(t)}</span>`;
  const DOT = '<span class="ntr_agf_dot" aria-hidden="true">◆</span>';
  // In Lines, the text before the first colon names the line, so a changed line is matched to what it was.
  const lineName = (x) => { const i = x.indexOf(':'); return (i > 0 ? x.slice(0, i) : x).trim().toLowerCase(); };
  function formatted(a, r) {
    try { return ctx().messageFormatting(r.text, a.name, false, false, r.mes); } catch (e) { return esc(r.text).replace(/\n/g, '<br>'); }
  }

  // One field's rows, against its value in the agent's earlier result (was: undefined when there's none). edit: the
  // edit key while this value is being edited.
  function fieldHtml(f, v, was, edit) {
    if (f.type === 'list') {
      let items;
      if (f.listShow === 'chips') {
        items = v.map((x) => ({ x, add: was !== undefined && !was.includes(x) }))
          .concat(was === undefined ? [] : was.filter((x) => !v.includes(x)).map((x) => ({ x, gone: true })));
        const chips = items.map((i) => `<span class="ntr_agf_chip${i.add ? ' ntr_agf_new' : i.gone ? ' ntr_agf_gone' : ''}">${i.add ? '+ ' : ''}${esc(i.x)}${i.add ? sr(', new') : i.gone ? sr(', removed') : ''}</span>`).join('');
        return { changed: items.some((i) => i.add || i.gone), html: `<div class="ntr_agf_list"><div class="ntr_agf_lab">${esc(f.name)}</div><div class="ntr_agf_chips">${chips || '<span class="ntr_agf_none">None</span>'}</div></div>` };
      }
      const before = new Map((was || []).map((x) => [lineName(x), x]));
      const names = new Set(v.map(lineName));
      items = v.map((x) => {
        const p = was === undefined ? x : before.get(lineName(x));
        return { x, add: p === undefined, chg: p !== undefined && p !== x };
      }).concat(was === undefined ? [] : was.filter((x) => !names.has(lineName(x))).map((x) => ({ x, gone: true })));
      const text = (x) => { const c = x.indexOf(':'); return c > 0 ? `<b>${esc(x.slice(0, c + 1))}</b>${esc(x.slice(c + 1))}` : esc(x); };
      const lines = items.map((i) => `<li class="${i.add ? 'ntr_agf_new' : i.chg ? 'ntr_agf_chg' : i.gone ? 'ntr_agf_gone' : ''}"><span>${text(i.x)}</span>${i.add ? '<span class="ntr_agf_tag">New</span>' : i.chg ? DOT + sr(', changed') : i.gone ? sr(', removed') : ''}</li>`).join('');
      return { changed: items.some((i) => i.add || i.chg || i.gone), html: `<div class="ntr_agf_list"><div class="ntr_agf_lab">${esc(f.name)}</div>${lines ? `<ul class="ntr_agf_lines">${lines}</ul>` : '<span class="ntr_agf_none">None</span>'}</div>` };
    }
    const d = f.type === 'num' && was !== undefined ? Math.round((v - was) * 100) / 100 : 0;
    const changed = f.type === 'num' ? d !== 0 : was !== undefined && was !== v;
    const row = (inner) => `<div class="ntr_agf_row" data-field="${esc(f.name)}"><span class="ntr_agf_lab">${esc(f.name)}</span>${inner}</div>`;
    if (edit) {
      return { changed, html: row(`<span class="ntr_agf_editrow"><input type="text" class="text_pole ntr_agf_input" data-for="${esc(edit)}" inputmode="${f.type === 'num' ? 'decimal' : 'text'}" value="${esc(String(v))}" aria-label="${esc(f.name)}">${iconBtn('fsave', 'fa-check', 'Save')}${iconBtn('fcancel', 'fa-xmark', 'Cancel')}</span>`) };
    }
    if (f.type === 'num') {
      const pct = Math.round(Math.min(100, Math.max(0, (v - f.min) / (f.max - f.min) * 100)));
      const label = `Edit ${f.name}, ${v} of ${f.max}${d > 0 ? `, up ${d}` : d < 0 ? `, down ${-d}` : ''}`;
      return { changed, html: row(`<button type="button" class="ntr_agf_val" data-act="fedit" aria-label="${esc(label)}">${f.numShow === 'bar' ? `<span class="ntr_agf_bar"><span style="width:${pct}%"></span></span>` : ''}<span class="ntr_agf_text ntr_agf_n">${v}${f.numShow === 'bar' ? `/${f.max}` : ''}</span><span class="ntr_agf_delta">${d > 0 ? `▲${d}` : d < 0 ? `▼${-d}` : ''}</span></button>`) };
    }
    return { changed, html: row(`<button type="button" class="ntr_agf_val" data-act="fedit" aria-label="${esc(`Edit ${f.name}, ${v}${changed ? ', changed' : ''}`)}"><span class="ntr_agf_text">${esc(v)}</span>${changed ? DOT : ''}</button>`) };
  }
  // A Fields result: its fields under their headings, each heading folding open and closed.
  function fieldsHtml(a, r, prev, pin, edit) {
    const now = valuesOf(a, r.text);
    const was = prev ? valuesOf(a, prev.text) : null;
    const known = new Set(fieldsOf(a));
    const secs = [{ id: '', name: '', rows: [] }];
    for (const f of a.fields) {
      if (f.kind === 'heading') secs.push({ id: f.id, name: f.name, rows: [] });
      else if (known.has(f)) secs[secs.length - 1].rows.push(fieldHtml(f, now[f.name], was ? was[f.name] : undefined, edit && edit.endsWith(`:${f.name}`) ? edit : ''));
    }
    let changed = false;
    const html = secs.map((sec) => {
      const ch = sec.rows.some((x) => x.changed);
      changed = changed || ch;
      const rows = sec.rows.map((x) => x.html).join('');
      if (!sec.id) return rows;
      const key = `${pin}:${a.id}:${sec.id}`;
      const open = !folds.has(key);
      return `<div class="ntr_agf_sec"><button type="button" class="ntr_agf_sechead" data-act="fold" data-fold="${esc(key)}" aria-expanded="${open}"><i class="fa-solid fa-fw fa-chevron-${open ? 'down' : 'right'}"></i><span>${esc(sec.name)}</span>${!open && ch ? DOT + sr(', changed') : ''}</button>${open ? `<div class="ntr_agf_secbody">${rows}</div>` : ''}</div>`;
    }).join('');
    return { changed, html: `<div class="ntr_agf">${html}</div>` };
  }
  function pinPart(x, last, pin, isTabs) {
    const { a, r, run, fail, edit, fv } = x;
    const key = `${pin}:${a.id}`;
    const open = isTabs || !folds.has(key);
    const again = !r || r.mes === last ? 'Run again' : `Run again on message ${r.mes}`;
    const btns = (run ? '<span class="ntr_agres_btn ntr_agres_busy" role="img" title="Updating" aria-label="Updating"><i class="fa-solid fa-fw fa-spinner fa-spin"></i></span>' : iconBtn('run', 'fa-rotate', r ? again : 'Run'))
      + (r ? iconBtn('edit', 'fa-pen', 'Edit Saved Text', ` aria-pressed="${!!edit}"`) : '') + (r?.prev != null ? iconBtn('undo', 'fa-rotate-left', 'Undo') : '');
    const head = isTabs ? `<span class="ntr_agres_name ntr_agres_title">${esc(a.title)}</span>`
      : `<button type="button" class="ntr_agres_fold" data-act="fold" data-fold="${esc(key)}" aria-expanded="${open}"><i class="fa-solid fa-fw fa-chevron-${open ? 'down' : 'right'} ntr_agres_chev"></i>${picHtml(a, 18)}<span class="ntr_agres_name">${esc(a.name)}</span>${!open && fv?.changed ? DOT + sr(', changed') : ''}</button>`;
    const body = edit ? `${fv ? '<div class="ntr_agres_note">Saved as plain text, in the same format the agent answers in. Lists are edited here.</div>' : ''}<textarea class="text_pole ntr_agres_edit" rows="8" data-for="${esc(edit)}">${esc(r.text)}</textarea>
      <div class="ntr_agres_editbtns"><button type="button" class="menu_button" data-act="save"><i class="fa-solid fa-check"></i> Save</button><button type="button" class="menu_button" data-act="cancel">Cancel</button></div>`
      : fv ? fv.html : r ? `<div class="ntr_agres_text">${formatted(a, r)}</div>` : '<div class="ntr_agres_note">No result yet.</div>';
    return `<div class="ntr_agres" data-ag="${esc(a.id)}" data-mes="${r ? r.mes : ''}">
      <div class="ntr_agres_head">${head}<span class="ntr_agres_btns">${btns}</span></div>
      ${open ? body : ''}
      ${fail ? `<div class="ntr_agres_note ntr_agres_fail">Last run failed: ${esc(fail)}</div>` : ''}
    </div>`;
  }
  // o.pin: the box's id, for its folds and tab. o.view: 'stacked' or 'tabs'. o.asOf: the message shown with Where
  // You're Reading while it isn't the newest, or null.
  function pinView(ids, upTo, o = {}) {
    if (!pageOn()) return null;
    const agents = ids.map(byId).filter(Boolean);
    if (!agents.length) return null;
    const pin = o.pin || '';
    const cid = chatId();
    const chat = ctx().chat || [];
    const last = chat.length - 1;
    const isTabs = o.view === 'tabs' && agents.length > 1;
    const tab = agents.some((a) => a.id === tabs.get(pin)) ? tabs.get(pin) : agents[0].id;
    const asOf = o.asOf ?? null;
    const parts = agents.map((a) => {
      const r = latest(a.id, upTo);
      const f = fails.get(a.id);
      const here = (e) => !!(r && e && e.id === a.id && e.mes === r.mes && e.chat === cid && e.date === chat[r.mes]?.send_date);
      return {
        a, r, prev: r && usesFields(a) ? latest(a.id, r.mes - 1) : null, run: current?.id === a.id, fail: f && f.chat === cid ? f.text : '',
        edit: here(editing) ? editing.key : '', fedit: here(fieldEdit) ? fieldEdit.key : '',
      };
    });
    const folded = [...folds].filter((k) => k.startsWith(`${pin}:`)).sort();
    const key = JSON.stringify([parts.map(({ a, r, prev, run, fail, edit, fedit }) => [a.id, a.name, a.title, a.pic, a.answer, usesFields(a) ? a.fields : 0,
      r?.mes, r?.at, r?.text, prev?.text, r?.prev != null, run, fail, edit, fedit]), last, isTabs, isTabs ? tab : '', folded, asOf]);
    return {
      key,
      fill: (body) => {
        // Text being typed in an edit box survives a redraw, in the box for the same result or value only.
        const kept = [...body.querySelectorAll('.ntr_agres_edit, .ntr_agf_input')].map((el) => [el.dataset.for, el.value]);
        for (const x of parts) x.fv = x.r && usesFields(x.a) && !x.edit ? fieldsHtml(x.a, x.r, x.prev, pin, x.fedit) : null;
        const tabBar = isTabs ? `<div class="ntr_agres_tabs" role="tablist">${parts.map(({ a, fv }) => {
          const sel = a.id === tab;
          return `<button type="button" role="tab" class="ntr_agres_tab" data-act="tab" data-ag="${esc(a.id)}" aria-selected="${sel}">${picHtml(a, 18)}<span>${esc(a.name)}</span>${!sel && fv?.changed ? DOT + sr(', changed') : ''}</button>`;
        }).join('')}</div>` : '';
        const shown = isTabs ? parts.filter((x) => x.a.id === tab) : parts;
        body.innerHTML = tabBar + shown.map((x) => pinPart(x, last, pin, isTabs)).join('')
          + (asOf != null ? `<div class="ntr_agres_asof cb_hint"><span>As of message #${asOf}</span><button type="button" class="menu_button" data-act="newest">Newest</button></div>` : '');
        for (const [k, v] of kept) {
          const el = [...body.querySelectorAll('.ntr_agres_edit, .ntr_agf_input')].find((x) => x.dataset.for === k);
          if (el) el.value = v;
        }
        const inp = body.querySelector('.ntr_agf_input');
        if (inp && focusEdit) { inp.focus(); inp.select(); }
        focusEdit = false;
      },
    };
  }
  // The buttons in Pinned Blocks. The boxes are redrawn often, so one listener on the page handles them all.
  document.addEventListener('click', (e) => {
    const b = e.target.closest('#ntr_pin_layer :is(.ntr_agres, .ntr_agres_tabs, .ntr_agres_asof) [data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'fold') { const k = b.dataset.fold; if (folds.has(k)) folds.delete(k); else folds.add(k); refreshBoxes(); return; }
    if (act === 'tab') { tabs.set(b.closest('.ntr_pin')?.dataset.pin || '', b.dataset.ag); refreshBoxes(); return; }
    if (act === 'newest') { const c = document.getElementById('chat'); if (c) c.scrollTop = c.scrollHeight; return; }
    const box = b.closest('.ntr_agres');
    const a = box && byId(box.dataset.ag);
    if (!a) return;
    const mes = box.dataset.mes === '' ? null : Number(box.dataset.mes);
    const m = mes == null ? null : (ctx().chat || [])[mes];
    const r = m ? savedAt(m, a.id) : null;
    // An edit is saved only onto the result it was started on, in case the message or swipe changed meanwhile.
    const same = (ed) => r && ed && ed.id === a.id && ed.mes === mes && ed.chat === chatId() && ed.date === m.send_date;
    if (act === 'run') { enqueue(a.id, false, false, mes === (ctx().chat || []).length - 1 ? null : mes); return; }
    if (act === 'edit' && r) {
      editing = editing && same(editing) ? null : { id: a.id, mes, chat: chatId(), date: m.send_date, key: `${a.id}:${mes}:${m.send_date}` };
      fieldEdit = null;
    } else if (act === 'cancel') editing = null;
    else if (act === 'save') {
      let text = String(box.querySelector('.ntr_agres_edit')?.value ?? '').trim();
      // Fields reads the text the way it reads an answer, laid over the values it had; names it doesn't know are dropped.
      if (same(editing) && text && usesFields(a)) {
        const vals = mergeFields(a, valuesOf(a, r.text), text, false);
        if (vals) text = writeFields(a, vals);
        else { toastr.warning('None of its fields were found, so nothing changed.', a.name); text = r.text; }
      }
      // Too long, the edit box stays open, so what was typed can be shortened.
      if (!same(editing)) { toastr.warning('The message changed, so the edit wasn\'t saved.', a.name); editing = null; }
      else if (text.length > MAX_SAVED) toastr.warning(`Not saved: ${usesFields(a) ? 'all its values together are' : 'it\'s'} ${OVER}.`, a.name);
      else { if (text && text !== r.text) saveAt(m, a.id, { text, at: r.at, prev: r.text }); editing = null; }
    } else if (act === 'undo' && r?.prev != null) saveAt(m, a.id, { text: r.prev, at: r.at });
    else if (act === 'fedit' && r) {
      const name = b.closest('[data-field]')?.dataset.field;
      if (!name) return;
      fieldEdit = { id: a.id, mes, chat: chatId(), date: m.send_date, field: name, key: `${a.id}:${mes}:${m.send_date}:${name}` };
      focusEdit = true;
      editing = null;
    } else if (act === 'fcancel') fieldEdit = null;
    else if (act === 'fsave') {
      const f = fieldsOf(a).find((x) => x.name === fieldEdit?.field);
      if (!same(fieldEdit) || !f) toastr.warning('The message changed, so the edit wasn\'t saved.', a.name);
      else {
        const vals = valuesOf(a, r.text);
        vals[f.name] = fieldValue(f, box.querySelector('.ntr_agf_input')?.value ?? '', vals[f.name], false);
        const text = writeFields(a, vals);
        if (text.length > MAX_SAVED) toastr.warning(`Not saved: all its values together would be ${OVER}.`, a.name);
        else if (text !== r.text) saveAt(m, a.id, { text, at: r.at, prev: r.text });
      }
      fieldEdit = null;
    }
    refreshBoxes();
  });
  // In a value's edit box, Enter saves and Escape cancels.
  document.addEventListener('keydown', (e) => {
    if (!e.target.matches?.('#ntr_pin_layer .ntr_agf_input') || (e.key !== 'Enter' && e.key !== 'Escape')) return;
    e.preventDefault();
    e.target.closest('.ntr_agf_row')?.querySelector(`[data-act="${e.key === 'Enter' ? 'fsave' : 'fcancel'}"]`)?.click();
  });

  window.NTR.agents = {
    version: AGENTS_VERSION,
    sectionHtml,
    bind,
    // Your chat's reply (message id): agents set to After Every Reply run, one after another, once it's in, each on that
    // reply even if more messages come in before its turn. A Continue only adds to a reply they already ran on, so it
    // doesn't run them again (without streaming, SillyTavern marks it 'appendFinal').
    replied: (type, id) => {
      if (!pageOn() || ['first_message', 'impersonate', 'continue', 'appendFinal'].includes(type)) return;
      const at = Number.isInteger(id) && id >= 0 ? id : null;
      sortAgents();
      for (const a of list()) if (a.on && a.runs === 'reply' && (a.job.trim() || usesFields(a))) enqueue(a.id, false, true, at);
    },
    // A reply is about to be built (after its slash commands): agents' results go into its prompt.
    genStarted: (type, dryRun) => { if (!dryRun && type !== 'quiet') chatBusy = true; inject(type, dryRun); },
    genEnded: () => { chatBusy = false; sendAt = null; const w = waiters; waiters = []; w.forEach((r) => r()); },
    // {{agent::Name}} (index.js): that agent's current saved result, chosen like Send to Main AI's.
    macro: (name) => {
      const want = String(name ?? '').trim().toLowerCase();
      const a = list().find((x) => x.name.toLowerCase() === want);
      return a && a.keep === 'chat' ? latest(a.id, macroAt ?? sendUpTo())?.text ?? '' : '';
    },
    // For Pinned Blocks set to Agent Results (index.js).
    pinView,
    // An agent's current answer: its newest saved one in this chat, or for Activity Only, its last since the page loaded.
    answer: (id) => { const a = byId(id); return a?.keep === 'chat' ? latest(id)?.text ?? '' : answers.get(id) ?? ''; },
  };
})();
