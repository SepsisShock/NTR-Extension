// Nitwit Tavern Redesign: Agents module.
// Loaded by index.js for the Agents page, and when the page is on. If this file breaks, the rest of the extension keeps working.
// An agent is a separate request to a model that does one job you give it: its own name, picture, instructions, connection,
// samplers and limits. Its connection never changes your chat's connection or SillyTavern's Connection Profiles: it sends
// its own request through SillyTavern (Chat Completion or Text Completion), or uses your chat's connection (Same as Chat).
// Your API keys stay in SillyTavern; an agent keeps only which saved key it uses.
// An agent's answer shows in its activity, and /ntr-agent gives it to Quick Replies and STscript. An agent can also save
// its answers in the chat, and a Pinned Block set to Agent Results (index.js) shows them on screen.
(() => {
  const AGENTS_VERSION = '2.45.0';
  const A = window.NTR && window.NTR.api;
  if (!A) { console.error('[NTR] agents.js loaded without the core (index.js).'); return; }
  const { ctx, settings, save, escapeHTML: esc, pageHtml, pills, onPills, askText, askYes, newId, uploadImage, askImageUrl, deleteFileIfUnused, media } = A;

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
    id: newId('ag'), name, on: false, pic: '', job: '', runs: 'button', kind: 'chat',
    ccSource: 'openrouter', ccModel: '', ccUrl: '', ccKey: '', ccPost: '',
    tcType: 'koboldcpp', tcUrl: 'http://127.0.0.1:5001', tcModel: '', tcInstruct: '',
    tempOn: true, temp: 0.3, topPOn: false, topP: 1, topKOn: false, topK: 0, minPOn: false, minP: 0,
    freqOn: false, freq: 0, presOn: false, pres: 0, repOn: false, rep: 1, effOn: false, eff: 'auto',
    maxTokens: 600, context: 6, split: false, full: false, keep: 'off', last: false,
    send: false, sendWhere: 'chat', sendDepth: 1, sendRole: 'system', sendScan: false,
  });
  // Send to Main AI: where in your chat's prompt (SillyTavern's extension prompt places and roles).
  const WHERE = [['chat', 'In Chat', 1], ['before', 'Before Main Prompt', 2], ['after', 'After Main Prompt', 0]];
  const ROLES = [['system', 'System', 0], ['user', 'User', 1], ['assistant', 'AI', 2]];
  // The example tracker: an ordinary agent, made by its button, to edit or delete like any other.
  const DELTA_JOB = `You are Delta, a story state tracker. Read your last result and the latest chat messages, then write the updated state.

Format, in Markdown:
**Time:** time of day, and the date if known
**Location:** where the scene takes place
**Weather:** current weather
**Characters:** one line each: name, what they wear, what they carry, injuries
**Relationships:** one line per pair, with where it stands now
**Objectives:** active goals, one per line

Keep every value from your last result that the new messages leave as it was, and change only what the new messages change. Write "Unknown" for anything the story hasn't said yet. Answer with the state only.`;
  const num = (k, v, d) => { const [min, max] = A.numRange(k); const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d; };
  const str = (v, max, d = '') => (typeof v === 'string' ? v.slice(0, max) : d);
  const pick = (v, list, d) => (list.some(([x]) => x === v) ? v : d);
  // Each saved agent, with anything missing or out of range set back to a new agent's value.
  function clean(a) {
    const d = fresh('Agent');
    const o = { ...d, id: typeof a?.id === 'string' && /^[\w-]{1,40}$/.test(a.id) ? a.id : d.id, name: str(a?.name, 60).trim() || 'Agent', on: a?.on === true,
      pic: str(a?.pic, 2048), job: str(a?.job, 8000), runs: a?.runs === 'reply' ? 'reply' : 'button',
      kind: ['chat', 'cc', 'tc'].includes(a?.kind) ? a.kind : 'chat',
      ccSource: pick(a?.ccSource, CC, d.ccSource), ccModel: str(a?.ccModel, 200), ccUrl: str(a?.ccUrl, 500), ccKey: str(a?.ccKey, 100), ccPost: pick(a?.ccPost, POST, ''),
      tcType: pick(a?.tcType, TC, d.tcType), tcUrl: str(a?.tcUrl, 500, d.tcUrl), tcModel: str(a?.tcModel, 200), tcInstruct: str(a?.tcInstruct, 200),
      effOn: a?.effOn === true, eff: pick(a?.eff, EFFORT, 'auto'),
      maxTokens: num('agMaxTokens', a?.maxTokens, d.maxTokens), context: num('agContext', a?.context, d.context),
      split: a?.split === true, full: a?.full === true, keep: a?.keep === 'chat' ? 'chat' : 'off', last: a?.last === true,
      send: a?.send === true, sendWhere: pick(a?.sendWhere, WHERE, 'chat'), sendDepth: num('agSendDepth', a?.sendDepth, d.sendDepth),
      sendRole: pick(a?.sendRole, ROLES, 'system'), sendScan: a?.sendScan === true };
    for (const [f, , k] of SAMP) { o[f + 'On'] = typeof a?.[f + 'On'] === 'boolean' ? a[f + 'On'] : d[f + 'On']; o[f] = num(k, a?.[f], d[f]); }
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

  // ----- Saved results -----
  // With Results set to Saved in the Chat, an answer is saved on the message that was newest when the run started, on its
  // current swipe, under extra.ntr_agents (by agent id) in the chat file. SillyTavern carries a message's extra along
  // with its swipe, so swipes, deleted messages and branches keep the right result. A new swipe starts as a copy of the
  // one it replaces, extra included, so each result also notes its swipe's date and only counts on that swipe. prev is
  // the text it replaced there, for Undo. A chat file can come from someone else, so what's read is limited and shown
  // sanitized.
  const KEY = 'ntr_agents';
  const MAX_SAVED = 20000;
  const chatId = () => { try { return String(ctx().getCurrentChatId() ?? ''); } catch (e) { return ''; } };
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
  // Its instructions with SillyTavern's macros filled in ({{char}}, {{user}}, {{agent::Name}}...), and with Include Its
  // Last Result, the newest result saved before message `at`. A saved result is left as it is. {{agent::Name}} looks
  // only up to message `at` meanwhile (macroAt), so Run Again on an older message doesn't see later results.
  let macroAt = null;
  function withLast(a, at) {
    let job = a.job;
    macroAt = at;
    try { job = ctx().substituteParams(job); } catch (e) { /* as typed */ } finally { macroAt = null; }
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
    if (tc && a.repOn) o.repetition_penalty = a.rep;
    return o;
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
  // message it runs on is noted (o.target), so its answer can be saved there.
  function aim(o) {
    const chat = ctx().chat || [];
    const i = o.at ?? chat.length - 1;
    const m = chat[i];
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
      try {
        // SillyTavern skips a full-prompt request without a word while your chat has no connection.
        if (full && c.onlineStatus === 'no_connection') throw new Error('Your chat isn\'t connected to an API.');
        // SillyTavern builds your chat's full prompt from the whole chat and adds the instructions at the end.
        if (full) {
          if (o.at != null && o.at !== (c.chat || []).length - 1) throw new Error('With your chat\'s full prompt, it can only run on the last message.');
          const i = aim(o);
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
    const old = savedAt(m, a.id);
    saveAt(m, a.id, { text: text.slice(0, MAX_SAVED), at: Date.now(), ...(old ? { prev: old.text } : {}) });
    return '';
  }
  // auto: a run after a reply, which also needs the agent's own switch on. at: the message to run on (Run Again in a
  // Pinned Block); the last one when null. Resolves with the run's result: { ok, text }.
  function enqueue(id, test = false, auto = false, at = null) {
    chain = chain.then(async () => {
      const a = byId(id);
      if (!a) return { ok: false, text: 'This agent was deleted.' };
      const skip = !pageOn() ? (auto ? '' : 'Turn the Agents page on first.') : auto && !a.on ? '' : !test && !a.job.trim() ? 'Write its instructions first.' : null;
      if (skip !== null) { if (skip) log(a, { at: Date.now(), ms: 0, ok: false, test, text: skip }); return { ok: false, text: skip || 'Skipped' }; }
      const ctrl = new AbortController();
      let timedOut = false;
      const timer = setTimeout(() => { timedOut = true; ctrl.abort(); }, TIMEOUT_MS);
      current = { id, ctrl };
      renderActivity();
      refreshBoxes();
      const t0 = performance.now();
      const o = { test, auto, at, target: null };
      try {
        const text = (await call(a, o, ctrl.signal)).trim();
        if (ctrl.signal.aborted) throw new Error(timedOut ? 'Timed out' : 'Stopped');
        const note = test || !byId(id) ? '' : keep(a, o.target, text);
        if (!test && byId(id)) { answers.set(id, text); fails.delete(id); }
        log(a, { at: Date.now(), ms: performance.now() - t0, ok: true, test, text: text || '(empty answer)', note });
        return { ok: true, text };
      } catch (e) {
        const msg = timedOut ? 'Timed out' : ctrl.signal.aborted ? 'Stopped' : (e?.message || String(e));
        if (!test) fails.set(id, { chat: o.target?.chat ?? chatId(), text: msg });
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
  const card = (l, i) => `${l ? `<div class="ntr_glab">${l}</div>` : ''}<div class="ntr_card">${i}</div>`;
  const btn = (id, icon, label, title = '') => `<button type="button" class="menu_button" id="${id}" style="margin:0;width:max-content;"${title ? ` title="${esc(title)}"` : ''}><i class="fa-solid ${icon}"></i>${label ? ' ' + label : ''}</button>`;
  // An agent's picture is always a circle.
  const picHtml = (a, size) => {
    return a.pic ? `<img src="${esc(media(a.pic))}" alt="" style="width:${size}px;height:${size}px;object-fit:cover;border-radius:50%;flex:none;">`
      : `<i class="fa-solid fa-fw fa-robot" style="width:${size}px;text-align:center;opacity:.7;flex:none;"></i>`;
  };
  const conn = (a) => (a.kind === 'chat' ? 'Same as Chat' : a.kind === 'cc' ? `${(CC.find(([v]) => v === a.ccSource) || [, ''])[1]}${a.ccModel ? ' · ' + a.ccModel : ''}`
    : `${(TC.find(([v]) => v === a.tcType) || [, ''])[1]} (local)`);
  const slider = (a, f, k) => `<div class="cb_row"><input type="range" class="m_ag_num" data-f="${f}" data-k="${k}" ${A.rangeAttrs(k)} value="${a[f]}" style="flex:1;"><span style="min-width:72px;text-align:right;" id="m_ag_v_${f}">${a[f]}${A.numRange(k)[3] || ''}</span></div>`;

  function sectionHtml(s) {
    const note = '<div class="cb_hint ntr_pnote">Agents are separate requests to a model, each doing one job you give it. Each run costs tokens on its connection. Nothing here calls a model while this page is switched off.</div>';
    return pageHtml('agents', '<div id="m_ag_root"></div>', { sw: ['m_ag_enable', !!s.agEnabled], note });
  }

  function listHtml(s) {
    const l = list();
    const rows = l.map((a) => `
      <div class="m_ag_row" data-id="${a.id}" tabindex="0" role="button" style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:8px;cursor:pointer;${a.id === s.agPick ? 'background:rgba(255,255,255,.07);outline:1px solid var(--SmartThemeQuoteColor);' : ''}">
        ${picHtml(a, 28)}
        <div style="flex:1;min-width:0;"><strong>${esc(a.name)}</strong><div class="cb_hint" style="margin:0;">${a.runs === 'reply' ? 'After every reply' : 'On the button only'} · ${esc(conn(a))}</div></div>
        <input type="checkbox" class="ntr_pswitch m_ag_on" ${a.on ? 'checked' : ''} title="Turn ${esc(a.name)} on or off" aria-label="Turn ${esc(a.name)} on or off">
      </div>`).join('');
    const picked = byId(s.agPick);
    return card('Your Agents', `
      ${rows || '<div class="cb_hint" style="margin:0;">No agents yet.</div>'}
      <div class="cb_actions" style="margin:8px 0 0;">
        ${btn('m_ag_new', 'fa-plus', 'Create Agent')}
        ${btn('m_ag_ex', 'fa-wand-magic-sparkles', 'Example Tracker', 'Create Delta, an example tracker agent to edit or delete like any other')}
        ${picked ? btn('m_ag_dup', 'fa-copy', 'Duplicate') + btn('m_ag_ren', 'fa-pen', 'Rename') + btn('m_ag_del', 'fa-trash-can', '', 'Delete this agent') : ''}
      </div>`);
  }

  function editorHtml(a) {
    if (!a) return '';
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
      : '<div class="cb_hint" style="margin-bottom:0;">Uses whatever your chat is connected to, with your chat\'s samplers. It waits until a reply is finished.</div>';
    const past = runs.get(a.id) || [];
    return `
      <div class="ntr_glab" style="font-size:1.05em;opacity:1;display:flex;align-items:center;gap:8px;">${picHtml(a, 22)}${esc(a.name)}</div>
      ${card('Job', `
        <div class="cb_cur_row">
          <div class="cb_cur_prev" style="overflow:hidden;">${picHtml(a, 36)}</div>
          <span class="cb_cur_name" style="flex:1;">Picture<small>${a.pic ? 'Your picture' : 'The robot'}</small></span>
          ${btn('m_ag_up', 'fa-upload', '', 'Upload')}${btn('m_ag_url', 'fa-link', '', 'Use a link')}${btn('m_ag_clr', 'fa-rotate-left', '', 'Back to the robot')}
        </div>
        <input type="file" id="m_ag_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
        ${lab('Instructions', `<textarea class="text_pole m_ag_txt" data-f="job" rows="5" maxlength="8000" placeholder="What this agent does, like: keep track of where everyone is and what they carry. Answer only with the updated list." style="width:100%;">${esc(a.job)}</textarea>`)}
        ${lab('Runs', pills('agruns', [['reply', 'After Every Reply'], ['button', 'On the Button Only']], a.runs))}
        ${lab('Results', pills('agkeep', [['off', 'Activity Only'], ['chat', 'Saved in the Chat']], a.keep))}
        <div class="cb_hint"${a.keep === 'chat' ? '' : ' style="margin-bottom:0;"'}>Activity Only shows its answers under Activity below until you reload. Saved in the Chat also keeps each answer on the message it was made for, so a swipe or a deleted message keeps the right one. To see saved answers on screen, add a Pinned Block on the Layout page and set it to Agent Results.</div>
        ${a.keep === 'chat' ? `<label class="checkbox_label"><input type="checkbox" class="m_ag_chk" data-f="last" data-redraw="1" ${a.last ? 'checked' : ''}><span>Include Its Last Result</span></label>
        <div class="cb_hint" style="margin-bottom:0;">Adds its newest saved answer from before the message it runs on to its prompt, so it updates what it had instead of starting over.</div>` : ''}`)}
      ${a.keep === 'chat' ? card('Main AI', `
        <label class="checkbox_label"><input type="checkbox" class="m_ag_chk" data-f="send" data-redraw="1" ${a.send ? 'checked' : ''}><span>Send to Main AI</span></label>
        <div class="cb_hint"${a.send ? '' : ' style="margin-bottom:0;"'}>Puts its current saved answer, under its name, into your chat's prompt for every reply. After a swipe, it's the answer from before the swiped reply.</div>
        ${a.send ? `${lab('Where', pills('agwhere', WHERE.map(([v, l]) => [v, l]), a.sendWhere))}
        ${a.sendWhere === 'chat' ? `${lab('Depth', slider(a, 'sendDepth', 'agSendDepth'))}${lab('As', pills('agrole', ROLES.map(([v, l]) => [v, l]), a.sendRole))}
        <div class="cb_hint">Depth 0 is after the last message, 1 is before it, and so on.</div>` : ''}
        <label class="checkbox_label"><input type="checkbox" class="m_ag_chk" data-f="sendScan" ${a.sendScan ? 'checked' : ''}><span>Lorebooks Can Read It</span></label>
        <div class="cb_hint">Words in it can trigger lorebook entries, like a location's entry.</div>` : ''}
        <div class="cb_hint" style="margin-bottom:0;">To place it yourself instead, type <code>{{agent::${esc(a.name)}}}</code> anywhere SillyTavern reads macros, like the Author's Note, a lorebook entry or another agent's instructions.</div>`) : ''}
      ${card('Connection', `
        ${pills('agkind', [['chat', 'Same as Chat'], ['cc', 'Chat Completion'], ['tc', 'Text Completion (local)']], a.kind)}
        <div class="cb_hint">Chat Completion is an online API, or a local server with an OpenAI-style link (Custom). Text Completion is a local server like KoboldCpp or llama.cpp. Neither changes your chat's connection or SillyTavern's Connection Profiles.</div>
        ${connBody}`)}
      ${card('Prompt', `
        ${a.kind === 'chat' ? `${lab('What It Sends', pills('agfull', [['own', 'Its Own Prompt'], ['full', 'Your Chat\'s Full Prompt']], a.full ? 'full' : 'own'))}
        <div class="cb_hint">Its Own Prompt: its instructions and the latest chat messages. Your Chat's Full Prompt: everything your chat sends for a reply (card, lorebooks, Author's Note, chat history), with its instructions added at the end. That costs more tokens.</div>` : ''}
        ${usesFull(a) ? '' : `${lab('Chat Messages', pills('agsplit', [['block', 'As One Block'], ['split', 'As Separate Messages']], a.split ? 'split' : 'block'))}
        <div class="cb_hint">As One Block: all the messages in one text. As Separate Messages: your messages as user and the others as AI. Each keeps its speaker's name either way.${a.kind === 'cc' ? ' If your API complains about the order of messages, set Prompt Post-Processing to Semi-strict.' : ''}</div>`}
        <div class="cb_actions" style="margin:6px 0 0;">${btn('m_ag_prev', 'fa-eye', 'Preview')}</div>
        <div id="m_ag_prevbox" hidden></div>`)}
      ${a.kind === 'chat' ? '' : card('Samplers', `
        ${sampRows}
        <div class="cb_ovrow"><label class="checkbox_label"><input type="checkbox" class="m_ag_chk" data-f="effOn" ${a.effOn ? 'checked' : ''}><span>Reasoning Effort</span></label>
          <div class="m_o_body${a.effOn ? '' : ' cb_dim'}" data-for="effOn">${pills('ageff', EFFORT, a.eff)}</div></div>
        <div class="cb_hint" style="margin-bottom:0;">Unticked uses the API's own default. An API that doesn't use one ignores it. Your Chat Completion presets are never used.</div>`)}
      ${card('Limits', `
        ${lab('Max Reply Length', slider(a, 'maxTokens', 'agMaxTokens'))}
        ${usesFull(a) ? '<div class="cb_hint" style="margin-bottom:0;">How long its answer may be. With your chat\'s full prompt, it reads as much of the chat as your chat does.</div>'
          : `${lab('Messages Read', slider(a, 'context', 'agContext'))}
        <div class="cb_hint" style="margin-bottom:0;">How long its answer may be, and how many of the latest chat messages it reads.</div>`}`)}
      ${card('Test and Activity', `
        <div class="cb_actions" style="margin:0;">${btn('m_ag_run', 'fa-play', 'Run Now')}${btn('m_ag_test', 'fa-plug-circle-check', 'Test Connection')}${btn('m_ag_stop', 'fa-stop', 'Stop')}</div>
        <div id="m_ag_act">${activityHtml(a, past)}</div>`)}`;
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
    const time = (t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const rows = l.map((r) => {
      const head = `<i class="fa-solid ${r.ok ? 'fa-circle-check' : 'fa-circle-xmark'}" style="color:${r.ok ? '#7c6' : '#d66'};"></i> ${time(r.at)} · ${r.test ? 'Test · ' : ''}${(r.ms / 1000).toFixed(1)} s${r.note ? ` · ${esc(r.note)}` : ''}`;
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
    if (stop) stop.hidden = !current;
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

  function render() {
    if (!root?.isConnected) return;
    const s = settings();
    if (s.agPick && !byId(s.agPick)) s.agPick = '';
    if (!s.agPick && list().length) s.agPick = list()[0].id;
    const a = byId(s.agPick);
    root.innerHTML = listHtml(s) + `<div id="m_ag_edit">${editorHtml(a)}</div>`;
    bindAll(s, a);
    renderActivity();
    if (a?.kind === 'cc') fillKeys(a);
  }

  function bindAll(s, a) {
    const changed = (redraw) => { save(); if (redraw) render(); };
    root.querySelectorAll('.m_ag_row').forEach((row) => {
      const go = (e) => { if (e.target.closest('.m_ag_on')) return; s.agPick = row.dataset.id; changed(true); };
      row.onclick = go;
      row.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(e); } };
      row.querySelector('.m_ag_on').onchange = function() { const x = byId(row.dataset.id); if (x) { x.on = this.checked; changed(false); } };
    });
    root.querySelector('#m_ag_new').onclick = async function() {
      const name = await askText(this, { label: 'Agent name', value: `Agent ${list().length + 1}`, ok: '<i class="fa-solid fa-plus"></i> Create', check: (v) => (v.trim() ? { value: v.trim().slice(0, 60) } : { error: 'Type a name first.' }) });
      if (!name) return;
      if (list().length >= 30) { toastr.info('Up to 30 agents.', 'Agents'); return; }
      const x = fresh(name);
      list().push(x);
      s.agPick = x.id;
      changed(true);
    };
    root.querySelector('#m_ag_ex').onclick = () => {
      if (list().length >= 30) { toastr.info('Up to 30 agents.', 'Agents'); return; }
      const x = { ...fresh('Delta'), on: true, job: DELTA_JOB, runs: 'reply', keep: 'chat', last: true };
      list().push(x);
      s.agPick = x.id;
      changed(true);
      toastr.info('Delta runs after every reply. To see it on screen, add a Pinned Block on the Layout page and set it to Agent Results.', 'Agents');
    };
    if (!a) return;
    root.querySelector('#m_ag_dup').onclick = () => {
      if (list().length >= 30) { toastr.info('Up to 30 agents.', 'Agents'); return; }
      const x = { ...structuredClone(a), id: newId('ag'), name: `${a.name} (copy)`.slice(0, 60), on: false };
      list().splice(list().indexOf(a) + 1, 0, x);
      s.agPick = x.id;
      changed(true);
    };
    root.querySelector('#m_ag_ren').onclick = async function() {
      const name = await askText(this, { label: 'Agent name', value: a.name, ok: '<i class="fa-solid fa-floppy-disk"></i> Save', check: (v) => (v.trim() ? { value: v.trim().slice(0, 60) } : { error: 'Type a name first.' }) });
      if (!name) return;
      a.name = name;
      changed(true);
    };
    root.querySelector('#m_ag_del').onclick = async function() {
      if (!(await askYes(this, `Delete "${a.name}"? This can't be undone.`, 'Delete'))) return;
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

    // Picture
    const file = root.querySelector('#m_ag_file');
    const setPic = (url) => { const old = a.pic; a.pic = url; changed(true); if (old && old !== url) deleteFileIfUnused(old); };
    root.querySelector('#m_ag_up').onclick = () => file.click();
    root.querySelector('#m_ag_url').onclick = async function() { const url = await askImageUrl('Agent picture', this); if (url) setPic(url); };
    root.querySelector('#m_ag_clr').onclick = () => setPic('');
    root.querySelector('#m_ag_clr').disabled = !a.pic;
    file.onchange = async () => {
      if (!file.files.length) return;
      try { setPic(await uploadImage(file.files[0], 'agent', { max: 128 })); } catch (e) { console.error('[NTR agent picture]', e); toastr.error(e.message || 'Upload failed', 'Agent picture'); }
      file.value = '';
    };
    onPills(root, 'agruns', (v) => { a.runs = v; changed(true); });
    onPills(root, 'agkind', (v) => { a.kind = v; changed(true); });
    onPills(root, 'agfull', (v) => { a.full = v === 'full'; changed(true); });
    onPills(root, 'agsplit', (v) => { a.split = v === 'split'; changed(true); });
    onPills(root, 'agkeep', (v) => { a.keep = v; changed(true); refreshBoxes(); });
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
        root.querySelector(`#m_ag_v_${f}`).textContent = a[f] + (A.numRange(el.dataset.k)[3] || '');
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

  function bind(overlay, s) {
    root = overlay.querySelector('#m_ag_root');
    // Switching the page off also stops a run in progress; runs still waiting are skipped.
    overlay.querySelector('#m_ag_enable').onchange = function() { s.agEnabled = this.checked; save(); if (!this.checked) current?.ctrl.abort(); };
    render();
  }

  // ----- In a Pinned Block (Agent Results) -----
  // Each picked agent's newest saved result up to message upTo (Reader Mode's page, or the last message), formatted
  // like a message: Markdown and your regexes, sanitized by SillyTavern. Edit, Run Again (on that message) and Undo
  // sit next to its name. editing: the result being edited, by agent, chat, message and swipe date.
  let editing = null;
  const iconBtn = (act, icon, title) => `<button type="button" class="ntr_agres_btn" data-act="${act}" title="${esc(title)}" aria-label="${esc(title)}"><i class="fa-solid fa-fw ${icon}"></i></button>`;
  function formatted(a, r) {
    try { return ctx().messageFormatting(r.text, a.name, false, false, r.mes); } catch (e) { return esc(r.text).replace(/\n/g, '<br>'); }
  }
  function pinPart({ a, r, run, fail, edit }, last) {
    const again = !r || r.mes === last ? 'Run again' : `Run again on message ${r.mes}`;
    const btns = (r ? iconBtn('edit', 'fa-pen', 'Edit') : '') + iconBtn('run', 'fa-rotate', r ? again : 'Run') + (r?.prev != null ? iconBtn('undo', 'fa-rotate-left', 'Undo') : '');
    const body = edit ? `<textarea class="text_pole ntr_agres_edit" rows="8" data-for="${esc(edit)}">${esc(r.text)}</textarea>
      <div class="ntr_agres_editbtns"><button type="button" class="menu_button" data-act="save"><i class="fa-solid fa-check"></i> Save</button><button type="button" class="menu_button" data-act="cancel">Cancel</button></div>`
      : r ? `<div class="ntr_agres_text">${formatted(a, r)}</div>` : '<div class="ntr_agres_note">No result yet.</div>';
    return `<div class="ntr_agres" data-ag="${esc(a.id)}" data-mes="${r ? r.mes : ''}">
      <div class="ntr_agres_head">${picHtml(a, 18)}<span class="ntr_agres_name">${esc(a.name)}</span><span class="ntr_agres_btns">${btns}</span></div>
      ${body}
      ${run ? '<div class="ntr_agres_note"><i class="fa-solid fa-spinner fa-spin"></i> Updating...</div>' : ''}
      ${fail ? `<div class="ntr_agres_note ntr_agres_fail">Last run failed: ${esc(fail)}</div>` : ''}
    </div>`;
  }
  function pinView(ids, upTo) {
    if (!pageOn()) return null;
    const cid = chatId();
    const last = (ctx().chat || []).length - 1;
    const chat = ctx().chat || [];
    const parts = ids.map(byId).filter(Boolean).map((a) => {
      const r = latest(a.id, upTo);
      const f = fails.get(a.id);
      const mine = r && editing && editing.id === a.id && editing.mes === r.mes && editing.chat === cid && editing.date === chat[r.mes]?.send_date;
      return { a, r, run: current?.id === a.id, fail: f && f.chat === cid ? f.text : '', edit: mine ? editing.key : '' };
    });
    if (!parts.some((x) => x.r || x.run || x.fail)) return null;
    const key = JSON.stringify(parts.map(({ a, r, run, fail, edit }) => [a.id, a.name, a.pic, r?.mes, r?.at, r?.text, r?.prev != null, run, fail, edit, last]));
    return {
      key,
      fill: (body) => {
        // Text being typed in an edit box survives a redraw, in the box for the same result only.
        const old = body.querySelector('.ntr_agres_edit');
        const typed = old ? [old.dataset.for, old.value] : null;
        body.innerHTML = parts.map((x) => pinPart(x, last)).join('');
        const ed = body.querySelector('.ntr_agres_edit');
        if (ed && typed && typed[0] === ed.dataset.for) ed.value = typed[1];
      },
    };
  }
  // The buttons in Pinned Blocks. The boxes are redrawn often, so one listener on the page handles them all.
  document.addEventListener('click', (e) => {
    const b = e.target.closest('#ntr_pin_layer .ntr_agres [data-act]');
    if (!b) return;
    const box = b.closest('.ntr_agres');
    const a = byId(box.dataset.ag);
    if (!a) return;
    const mes = box.dataset.mes === '' ? null : Number(box.dataset.mes);
    const m = mes == null ? null : (ctx().chat || [])[mes];
    const r = m ? savedAt(m, a.id) : null;
    const act = b.dataset.act;
    if (act === 'run') { enqueue(a.id, false, false, mes === (ctx().chat || []).length - 1 ? null : mes); return; }
    if (act === 'edit' && r) editing = { id: a.id, mes, chat: chatId(), date: m.send_date, key: `${a.id}:${mes}:${m.send_date}` };
    else if (act === 'cancel') editing = null;
    else if (act === 'save') {
      // Only onto the result the edit was started on, in case the message or swipe changed meanwhile.
      const same = r && editing && editing.id === a.id && editing.mes === mes && editing.chat === chatId() && editing.date === m.send_date;
      const text = String(box.querySelector('.ntr_agres_edit')?.value ?? '').trim().slice(0, MAX_SAVED);
      if (!same) toastr.warning('The message changed, so the edit wasn\'t saved.', a.name);
      else if (text && text !== r.text) saveAt(m, a.id, { text, at: r.at, prev: r.text });
      editing = null;
    } else if (act === 'undo' && r?.prev != null) saveAt(m, a.id, { text: r.prev, at: r.at });
    refreshBoxes();
  });

  window.NTR.agents = {
    version: AGENTS_VERSION,
    sectionHtml,
    bind,
    // Your chat's reply: agents set to After Every Reply run, one after another, once it's in. A Continue only adds to
    // a reply they already ran on, so it doesn't run them again (without streaming, SillyTavern marks it 'appendFinal').
    replied: (type) => {
      if (!pageOn() || ['first_message', 'impersonate', 'continue', 'appendFinal'].includes(type)) return;
      for (const a of list()) if (a.on && a.runs === 'reply' && a.job.trim()) enqueue(a.id, false, true);
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
    // /ntr-agent (index.js): runs an agent by name, on or off, and gives back its answer, or '' with a message if it fails.
    runByName: async (name) => {
      const want = String(name ?? '').trim().toLowerCase();
      const a = list().find((x) => x.name.toLowerCase() === want);
      if (!a) { toastr.warning(`No agent named "${String(name ?? '').trim()}".`, 'Agents'); return ''; }
      const r = await enqueue(a.id);
      if (!r.ok) { toastr.warning(r.text, a.name); return ''; }
      return r.text;
    },
    // For Pinned Blocks set to Agent Results (index.js).
    pinView,
    // An agent's current answer: its newest saved one in this chat, or for Activity Only, its last since the page loaded.
    answer: (id) => { const a = byId(id); return a?.keep === 'chat' ? latest(id)?.text ?? '' : answers.get(id) ?? ''; },
  };
})();
