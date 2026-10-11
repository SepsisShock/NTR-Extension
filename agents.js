// Nitwit Tavern Redesign: Agents module.
// Loaded by index.js for the Agents page, and when the page is on. If this file breaks, the rest of the extension keeps working.
// An agent is a separate request to a model that does one job you give it: its own name, picture, instructions, connection,
// samplers and limits. Its connection never changes your chat's connection or SillyTavern's Connection Profiles: it sends
// its own request through SillyTavern (Chat Completion or Text Completion), or uses your chat's connection (Same as Chat).
// Your API keys stay in SillyTavern; an agent keeps only which saved key it uses.
// For now an agent's answer shows in its activity. Showing it on screen (the Agentic Tracker Panel) comes next.
(() => {
  const AGENTS_VERSION = '2.35.0';
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
  const SHAPES = { round: '50%', rounded: '8px', square: '0' };
  // A run that takes longer than this is stopped.
  const TIMEOUT_MS = 120000;

  // A new agent: off, run on the button, Same as Chat. Temperature starts low: agents keep records, they don't write prose.
  const fresh = (name) => ({
    id: newId('ag'), name, on: false, pic: '', picShape: 'round', job: '', runs: 'button', kind: 'chat',
    ccSource: 'openrouter', ccModel: '', ccUrl: '', ccKey: '', ccPost: '',
    tcType: 'koboldcpp', tcUrl: 'http://127.0.0.1:5001', tcModel: '', tcInstruct: '',
    tempOn: true, temp: 0.3, topPOn: false, topP: 1, topKOn: false, topK: 0, minPOn: false, minP: 0,
    freqOn: false, freq: 0, presOn: false, pres: 0, repOn: false, rep: 1, effOn: false, eff: 'auto',
    maxTokens: 600, context: 6,
  });
  const num = (k, v, d) => { const [min, max] = A.numRange(k); const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d; };
  const str = (v, max, d = '') => (typeof v === 'string' ? v.slice(0, max) : d);
  const pick = (v, list, d) => (list.some(([x]) => x === v) ? v : d);
  // Each saved agent, with anything missing or out of range set back to a new agent's value.
  function clean(a) {
    const d = fresh('Agent');
    const o = { ...d, id: typeof a?.id === 'string' && /^[\w-]{1,40}$/.test(a.id) ? a.id : d.id, name: str(a?.name, 60).trim() || 'Agent', on: a?.on === true,
      pic: str(a?.pic, 2048), picShape: SHAPES[a?.picShape] ? a.picShape : 'round', job: str(a?.job, 8000), runs: a?.runs === 'reply' ? 'reply' : 'button',
      kind: ['chat', 'cc', 'tc'].includes(a?.kind) ? a.kind : 'chat',
      ccSource: pick(a?.ccSource, CC, d.ccSource), ccModel: str(a?.ccModel, 200), ccUrl: str(a?.ccUrl, 500), ccKey: str(a?.ccKey, 100), ccPost: pick(a?.ccPost, POST, ''),
      tcType: pick(a?.tcType, TC, d.tcType), tcUrl: str(a?.tcUrl, 500, d.tcUrl), tcModel: str(a?.tcModel, 200), tcInstruct: str(a?.tcInstruct, 200),
      effOn: a?.effOn === true, eff: pick(a?.eff, EFFORT, 'auto'),
      maxTokens: num('agMaxTokens', a?.maxTokens, d.maxTokens), context: num('agContext', a?.context, d.context) };
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
  const pageOn = () => A.isOn() && settings().agEnabled && !A.PREVIEW;

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

  // What the agent reads: its instructions, then the latest chat messages, oldest first.
  function prompt(a, test) {
    if (test) return [{ role: 'system', content: 'Reply with the word OK and nothing else.' }, { role: 'user', content: 'Test.' }];
    const chat = (ctx().chat || []).filter((m) => m && !m.is_system && typeof m.mes === 'string');
    const lines = chat.slice(-a.context).map((m) => `${m.name || (m.is_user ? 'User' : 'Character')}: ${m.mes}`);
    return [{ role: 'system', content: a.job }, { role: 'user', content: `The latest chat messages, oldest first:\n\n${lines.join('\n\n')}` }];
  }
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
  // After waiting for your reply, the page (or the agent, for a run after a reply) may have been switched off meanwhile.
  const stillAllowed = (a, auto) => { if (!pageOn()) throw new Error('Skipped: the Agents page is off'); if (auto && !a.on) throw new Error('Skipped: this agent is off'); };

  async function call(a, test, auto, signal) {
    const c = ctx();
    const messages = prompt(a, test);
    const max = test ? 20 : a.maxTokens;
    if (a.kind === 'chat') {
      await abortable(chatIdle(), signal);
      stillAllowed(a, auto);
      // SillyTavern's own request can't take our Stop, but its "generation stopped" event cancels it. That event would
      // also stop a reply being written, so it's only sent while no reply is.
      const cancel = () => { if (!chatBusy) c.eventSource.emit(c.event_types.GENERATION_STOPPED); };
      signal.addEventListener('abort', cancel, { once: true });
      try {
        return String(await abortable(c.generateRaw({ prompt: messages[1].content, systemPrompt: messages[0].content, responseLength: max }), signal) ?? '');
      } finally {
        signal.removeEventListener('abort', cancel);
      }
    }
    if (a.kind === 'cc') {
      if (!a.ccModel.trim()) throw new Error('Type a model name first.');
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
    const r = await c.TextCompletionService.processRequest({
      stream: false, prompt: messages, max_tokens: max, api_type: a.tcType, api_server: a.tcUrl.trim(),
      model: TC_MODEL.has(a.tcType) && a.tcModel.trim() ? a.tcModel.trim() : undefined, ...samplers(a, true),
    }, { instructName: a.tcInstruct || undefined }, true, signal);
    return String(r?.content ?? '');
  }

  // One run at a time. Each agent keeps its last 10 runs (and its last answer) until you reload.
  const runs = new Map();
  const answers = new Map();
  let chain = Promise.resolve();
  let current = null;
  function log(a, entry) {
    const l = runs.get(a.id) || [];
    l.unshift(entry);
    runs.set(a.id, l.slice(0, 10));
    renderActivity();
  }
  // auto: a run after a reply, which also needs the agent's own switch on.
  function enqueue(id, test = false, auto = false) {
    chain = chain.then(async () => {
      const a = byId(id);
      if (!a) return;
      const skip = !pageOn() ? (auto ? '' : 'Turn the Agents page on first.') : auto && !a.on ? '' : !test && !a.job.trim() ? 'Write its instructions first.' : null;
      if (skip !== null) { if (skip) log(a, { at: Date.now(), ms: 0, ok: false, test, text: skip }); return; }
      const ctrl = new AbortController();
      let timedOut = false;
      const timer = setTimeout(() => { timedOut = true; ctrl.abort(); }, TIMEOUT_MS);
      current = { id, ctrl };
      renderActivity();
      const t0 = performance.now();
      try {
        const text = (await call(a, test, auto, ctrl.signal)).trim();
        if (ctrl.signal.aborted) throw new Error(timedOut ? 'Timed out' : 'Stopped');
        if (!test) answers.set(id, text);
        log(a, { at: Date.now(), ms: performance.now() - t0, ok: true, test, text: text || '(empty answer)' });
      } catch (e) {
        const msg = timedOut ? 'Timed out' : ctrl.signal.aborted ? 'Stopped' : (e?.message || String(e));
        log(a, { at: Date.now(), ms: performance.now() - t0, ok: false, test, text: msg });
      } finally {
        clearTimeout(timer);
        current = null;
        renderActivity();
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
  const picHtml = (a, size) => {
    const r = SHAPES[a.picShape] || '50%';
    return a.pic ? `<img src="${esc(media(a.pic))}" alt="" style="width:${size}px;height:${size}px;object-fit:cover;border-radius:${r};flex:none;">`
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
        ${pills('agshape', [['round', 'Round'], ['rounded', 'Rounded'], ['square', 'Square']], a.picShape)}
        ${lab('Instructions', `<textarea class="text_pole m_ag_txt" data-f="job" rows="5" maxlength="8000" placeholder="What this agent does, like: keep track of where everyone is and what they carry. Answer only with the updated list." style="width:100%;">${esc(a.job)}</textarea>`)}
        ${lab('Runs', pills('agruns', [['reply', 'After Every Reply'], ['button', 'On the Button Only']], a.runs))}
        <div class="cb_hint" style="margin-bottom:0;">For now its answer shows under Activity below. Showing it on screen comes with the Agentic Tracker Panel.</div>`)}
      ${card('Connection', `
        ${pills('agkind', [['chat', 'Same as Chat'], ['cc', 'Chat Completion'], ['tc', 'Text Completion (local)']], a.kind)}
        <div class="cb_hint">Chat Completion is an online API, or a local server with an OpenAI-style link (Custom). Text Completion is a local server like KoboldCpp or llama.cpp. Neither changes your chat's connection or SillyTavern's Connection Profiles.</div>
        ${connBody}`)}
      ${a.kind === 'chat' ? '' : card('Samplers', `
        ${sampRows}
        <div class="cb_ovrow"><label class="checkbox_label"><input type="checkbox" class="m_ag_chk" data-f="effOn" ${a.effOn ? 'checked' : ''}><span>Reasoning Effort</span></label>
          <div class="m_o_body${a.effOn ? '' : ' cb_dim'}" data-for="effOn">${pills('ageff', EFFORT, a.eff)}</div></div>
        <div class="cb_hint" style="margin-bottom:0;">Unticked uses the API's own default. An API that doesn't use one ignores it. Your Chat Completion presets are never used.</div>`)}
      ${card('Limits', `
        ${lab('Max Reply Length', slider(a, 'maxTokens', 'agMaxTokens'))}
        ${lab('Messages Read', slider(a, 'context', 'agContext'))}
        <div class="cb_hint" style="margin-bottom:0;">How long its answer may be, and how many of the latest chat messages it reads.</div>`)}
      ${card('Test and Activity', `
        <div class="cb_actions" style="margin:0;">${btn('m_ag_run', 'fa-play', 'Run Now')}${btn('m_ag_test', 'fa-plug-circle-check', 'Test Connection')}${btn('m_ag_stop', 'fa-stop', 'Stop')}</div>
        <div id="m_ag_act">${activityHtml(a, past)}</div>`)}`;
  }

  function activityHtml(a, l = runs.get(a.id) || []) {
    const busy = current && current.id === a.id ? '<div class="cb_hint" style="margin:8px 0 0;"><i class="fa-solid fa-spinner fa-spin"></i> Running...</div>' : '';
    const time = (t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const rows = l.map((r) => {
      const head = `<i class="fa-solid ${r.ok ? 'fa-circle-check' : 'fa-circle-xmark'}" style="color:${r.ok ? '#7c6' : '#d66'};"></i> ${time(r.at)} · ${r.test ? 'Test · ' : ''}${(r.ms / 1000).toFixed(1)} s`;
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
      s.agents = list().filter((x) => x !== a);
      checked.add(s.agents);
      runs.delete(a.id);
      answers.delete(a.id);
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
    onPills(root, 'agshape', (v) => { a.picShape = v; changed(true); });
    onPills(root, 'agruns', (v) => { a.runs = v; changed(true); });
    onPills(root, 'agkind', (v) => { a.kind = v; changed(true); });
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
        changed(false);
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

  window.NTR.agents = {
    version: AGENTS_VERSION,
    sectionHtml,
    bind,
    // Your chat's reply: agents set to After Every Reply run, one after another, once it's in.
    replied: (type) => {
      if (!pageOn() || ['first_message', 'impersonate'].includes(type)) return;
      for (const a of list()) if (a.on && a.runs === 'reply' && a.job.trim()) enqueue(a.id, false, true);
    },
    genStarted: (type, dryRun) => { if (!dryRun && type !== 'quiet') chatBusy = true; },
    genEnded: () => { chatBusy = false; const w = waiters; waiters = []; w.forEach((r) => r()); },
    // For the Agentic Tracker Panel: an agent's last answer since the page loaded.
    answer: (id) => answers.get(id) ?? '',
  };
})();
