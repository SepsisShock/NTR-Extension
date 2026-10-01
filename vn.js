// Nitwit Tavern Redesign: Visual Novel Mode module.
// Loaded on demand by index.js. If this file breaks, the rest of the extension keeps working.
(() => {
  const VN_VERSION = '2.0.0';
  const A = window.NTR && window.NTR.api;
  if (!A) { console.error('[NTR] vn.js loaded without the core (index.js).'); return; }
  const { ctx, save, settings, escapeHTML, fullResUrl, readDataURL, loadImg, pills, onPills, secHead, subHead } = A;

  const VN_CSS = `
      #cb_node { position: fixed; z-index: 2450; display: none; align-items: flex-end; gap: 12px; padding: 0 6px; box-sizing: border-box; pointer-events: none; }
      #cb_node > * { pointer-events: auto; }
      #cb_node.cb_right { flex-direction: row-reverse; }
      #cb_node .cb_n_port { position: relative; flex: none; width: var(--cbn-ps, 120px); height: var(--cbn-ps, 120px); border-radius: 12px; overflow: hidden; border: 2px solid var(--SmartThemeBorderColor, #555); background: rgba(0,0,0,0.55); box-shadow: 0 4px 14px rgba(0,0,0,.5); }
      #cb_node .cb_n_port img { width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; }
      #cb_node .cb_n_port i { display: none; position: absolute; inset: 0; align-items: center; justify-content: center; font-size: calc(var(--cbn-ps, 120px) * 0.45); opacity: .35; }
      #cb_node .cb_n_port.cb_noimg img { display: none; }
      #cb_node .cb_n_port.cb_noimg i { display: flex; }
      #cb_node .cb_n_box { position: relative; flex: 1; min-width: 0; min-height: 96px; padding: 22px 18px 28px; border-radius: 12px; border: 2px solid var(--SmartThemeBorderColor, #555); background: rgba(10, 14, 22, var(--cbn-op, .88)); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); color: var(--SmartThemeBodyColor, #ddd); cursor: pointer; box-shadow: 0 4px 18px rgba(0,0,0,.55); }
      #cb_node .cb_n_name { position: absolute; top: -14px; left: 16px; padding: 2px 14px; border-radius: 999px; font-weight: bold; font-size: 0.95em; background: var(--SmartThemeQuoteColor, #6cf); color: #000; }
      #cb_node.cb_right .cb_n_name { left: auto; right: 16px; }
      #cb_node .cb_n_text { max-height: 28vh; overflow-y: auto; line-height: 1.5; }
      #cb_node .cb_n_nar .cb_n_text { font-style: italic; }
      #cb_node .cb_q { color: var(--SmartThemeQuoteColor, #6cf); }
      #cb_node .cb_n_arrow { position: absolute; left: 50%; bottom: 4px; font-size: 12px; animation: cbn_blink 1s infinite; pointer-events: none; }
      #cb_node .cb_n_ctrl { position: absolute; right: 8px; bottom: 3px; display: flex; align-items: center; gap: 2px; font-size: 11px; opacity: .75; }
      #cb_node .cb_n_ctrl button { background: none; border: none; color: inherit; cursor: pointer; padding: 2px 6px; font-size: 13px; }
      @keyframes cbn_blink { 50% { opacity: .15; } }
      #cb_node_toggle.cb_on { color: var(--SmartThemeQuoteColor, #6cf); }
      .cb_defdot { display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; flex: none; cursor: pointer; }
      .cb_spk { border-radius: 8px; background: rgba(0,0,0,.15); padding: 6px; }
      .cb_spk + .cb_spk { margin-top: 6px; }
      .cb_spk_row { display: flex; align-items: center; gap: 6px; }
      .cb_spk_row .menu_button, .cb_emo_cell .menu_button, .cb_emo_row .menu_button { margin: 0; padding: 4px 8px; }
      .cb_spk_name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
      .cb_spk_name small { display: block; opacity: .6; font-size: .8em; }
      .cb_thumbbox { width: 40px; height: 40px; flex: none; border-radius: 8px; overflow: hidden; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; }
      .cb_thumbbox img { width: 100%; height: 100%; object-fit: cover; object-position: top; }
      .cb_thumbbox i { opacity: .35; }
      .cb_emo_grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; margin-top: 8px; }
      .cb_emo_cell { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 6px; border-radius: 6px; background: rgba(0,0,0,.2); }
      .cb_emo_cell .cb_thumbbox { width: 64px; height: 64px; }
      .cb_emo_label { font-size: .8em; text-align: center; word-break: break-word; }
      .cb_emo_row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
      .cb_dgrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 8px; }
      .cb_dfield { display: flex; flex-direction: column; gap: 3px; font-size: .85em; }
      .cb_dfield input { margin: 0; font-family: monospace; }
      #cb_pick { display: flex; align-items: center; gap: 6px; padding: 4px 8px; flex-wrap: wrap; }
      #cb_pick select { width: auto; min-width: 110px; max-width: 40%; margin: 0; padding: 2px 6px; }
      #cb_pick .menu_button { margin: 0; padding: 3px 10px; white-space: nowrap; }
      #cb_node.cb_shape_round .cb_n_port { border-radius: 50%; }
      #cb_node.cb_shape_square .cb_n_port { border-radius: 0; }
      #cb_node.cb_shape_rect .cb_n_port { height: calc(var(--cbn-ps, 120px) * 1.5); }
  `;

  function applyStyle() {
    let el = document.getElementById('ntr_vn_style');
    if (!el) { el = document.createElement('style'); el.id = 'ntr_vn_style'; document.head.appendChild(el); }
    if (!A.isOn()) { el.textContent = ''; return; }
    el.textContent = VN_CSS + (settings().nodeEnabled ? '\n      #chat .mes { display: none !important; }\n' : '');
  }

  const node = { list: [], pos: 0, segs: [], i: 0, typer: null, auto: null, typing: false, finish: null };
  let nodeQ = null, nodeQAnim = false;
  const spkOpen = new Set();
  const reEsc = (x) => String(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function tagRe(s) {
    const so = reEsc(s.delimSpkOpen), sc = reEsc(s.delimSpkClose), no = reEsc(s.delimNarOpen), nc = reEsc(s.delimNarClose);
    return new RegExp(`${so}[ \\t]*((?:(?!${sc})[^\\n]){1,80}?)[ \\t]*${sc}[ \\t]*:?|${no}[ \\t]*((?:(?!${nc})[^\\n]){1,80}?)[ \\t]*${nc}[ \\t]*:?`, 'g');
  }

  function splitTag(inner, s) {
    const sep = s.delimEmo;
    const i = sep ? inner.indexOf(sep) : -1;
    if (i < 0) return { name: inner.trim(), emo: '' };
    return { name: inner.slice(0, i).trim(), emo: inner.slice(i + sep.length).trim() };
  }

  function parseSegments(raw, fallbackName, leadAsSpeaker) {
    const s = settings();
    raw = String(raw || '');
    const re = tagRe(s);
    const nar = String(s.narratorWord).trim().toLowerCase();
    const segs = [];
    let last = 0, cur = null, m;
    const close = (end) => {
      if (!cur) return;
      cur.text = raw.slice(last, end).trim();
      if (cur.text) segs.push(cur);
    };
    while ((m = re.exec(raw))) {
      if (cur) close(m.index);
      else {
        const pre = raw.slice(0, m.index).trim();
        if (pre) segs.push(leadAsSpeaker ? { kind: 'char', name: fallbackName || '', emo: '', text: pre } : { kind: 'narrator', name: '', emo: '', text: pre });
      }
      if (m[1] !== undefined) {
        const t = splitTag(m[1], s);
        cur = { kind: 'char', name: t.name, emo: t.emo };
      } else {
        const t = splitTag(m[2], s);
        cur = { kind: 'narrator', name: t.name.toLowerCase() === nar ? '' : t.name, emo: '' };
      }
      last = re.lastIndex;
    }
    if (cur) close(raw.length);
    else if (!segs.length && raw.trim()) segs.push({ kind: 'char', name: fallbackName || '', emo: '', text: raw.trim() });
    return segs;
  }

  function nodeFmt(t) {
    let h = escapeHTML(String(t).trim());
    h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
    h = h.replace(/&quot;(.+?)&quot;/g, '<span class="cb_q">&quot;$1&quot;</span>');
    h = h.replace(/\u201C(.+?)\u201D/g, '<span class="cb_q">\u201C$1\u201D</span>');
    return h.replace(/\n/g, '<br>');
  }

  // Strip the emotion part out of speaker tags in the normal chat view: ((Rafe%%Sad)) -> ((Rafe))
  function cleanEmoTags() {
    const s = settings();
    if (!A.isOn() || !s.nodeHideEmo || !s.delimEmo) return;
    const so = reEsc(s.delimSpkOpen), sc = reEsc(s.delimSpkClose), sep = reEsc(s.delimEmo);
    const re = new RegExp(`(${so}(?:(?!${sc})[^\\n]){0,60}?)[ \\t]*${sep}(?:(?!${sc})[^\\n]){0,60}?(${sc})`, 'g');
    document.querySelectorAll('#chat .mes_text').forEach((el) => {
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = w.nextNode())) {
        if (!n.nodeValue.includes(s.delimEmo) || n.parentElement?.closest('textarea')) continue;
        const v = n.nodeValue.replace(re, '$1$2');
        if (v !== n.nodeValue) n.nodeValue = v;
      }
    });
  }

  let chatObs = null, cleanT = null;
  function ensureChatObserver() {
    const chat = document.getElementById('chat');
    if (!chat || !window.MutationObserver || (chatObs && chatObs._el === chat)) return;
    if (chatObs) chatObs.disconnect();
    chatObs = new MutationObserver(() => { clearTimeout(cleanT); cleanT = setTimeout(cleanEmoTags, 120); });
    chatObs.observe(chat, { childList: true, subtree: true, characterData: true });
    chatObs._el = chat;
    cleanEmoTags();
  }

  function userAvatarSrc() {
    const img = document.querySelector('#chat .mes[is_user="true"] .avatar img');
    if (img && img.getAttribute('src')) return fullResUrl(img.getAttribute('src'));
    const sel = document.querySelector('#user_avatar_block .avatar-container.selected');
    const id = sel && (sel.getAttribute('data-avatar-id') || sel.getAttribute('imgfile'));
    return id ? `/User%20Avatars/${encodeURIComponent(id)}` : null;
  }

  // Base portrait: custom upload > persona > character card
  function resolveAvatar(name) {
    const key = String(name || '').trim().toLowerCase();
    if (!key) return null;
    const s = settings();
    if (s.nodeAvatars[key]) return s.nodeAvatars[key];
    const c = ctx();
    if (c.name1 && c.name1.toLowerCase() === key) return userAvatarSrc();
    const ch = (c.characters || []).find((x) => x.name && x.name.toLowerCase() === key);
    if (ch && ch.avatar) return `/characters/${encodeURIComponent(ch.avatar)}`;
    return null;
  }

  function findEmo(name) {
    const k = String(name || '').trim().toLowerCase();
    return k ? settings().emotions.find((e) => e.name.toLowerCase() === k) : null;
  }

  // Emotion image > default emotion image > base portrait > placeholder (null)
  function resolvePortrait(name, emoName) {
    const s = settings();
    const imgs = s.nodeEmoImgs[String(name || '').trim().toLowerCase()] || {};
    const e = findEmo(emoName);
    if (e && imgs[e.id]) return imgs[e.id];
    if (imgs[s.emoDefault]) return imgs[s.emoDefault];
    return resolveAvatar(name);
  }

  function collectSpeakers() {
    const s = settings();
    const c = ctx();
    const map = new Map();
    const nar = String(s.narratorWord).trim().toLowerCase();
    const add = (n, custom) => {
      const t = String(n || '').trim();
      const k = t.toLowerCase();
      if (!t || k === nar) return;
      if (!map.has(k)) map.set(k, { key: k, name: t, custom: !!custom });
      else if (custom) map.get(k).custom = true;
    };
    add(c.name1);
    if (c.groupId) {
      const g = (c.groups || []).find((x) => x.id === c.groupId);
      (g?.members || []).forEach((av) => { const ch = (c.characters || []).find((x) => x.avatar === av); if (ch) add(ch.name); });
    } else if (c.characterId !== undefined && c.characterId !== null) add(c.name2);
    (s.nodeCustomSpk || []).forEach((n) => add(n, true));
    for (const m of c.chat || []) {
      if (m.is_system) continue;
      for (const seg of parseSegments(m.mes || '', '', false)) if (seg.kind === 'char' && seg.name) add(seg.name);
    }
    return [...map.values()];
  }

  function thumbBox(src) {
    return `<div class="cb_thumbbox">${src ? `<img src="${escapeHTML(src)}" alt="">` : '<i class="fa-solid fa-user"></i>'}</div>`;
  }

  function spkRowsHtml(s) {
    const list = collectSpeakers();
    if (!list.length) return '<div class="cb_hint">No speakers yet. Add one below, or they show up once tagged in the chat.</div>';
    return list.map(({ key, name, custom }) => {
      const base = resolveAvatar(name);
      const manual = !!s.nodeAvatars[key];
      const imgs = s.nodeEmoImgs[key] || {};
      const cnt = s.emotions.filter((e) => imgs[e.id]).length;
      const open = spkOpen.has(key);
      const k = escapeHTML(key);
      const grid = !open ? '' : `<div class="cb_emo_grid">${s.emotions.map((e) => {
        const src = imgs[e.id];
        const id = escapeHTML(e.id);
        return `<div class="cb_emo_cell">
            ${thumbBox(src)}
            <div class="cb_emo_label">${escapeHTML(e.name)}${e.id === s.emoDefault ? ' \u2605' : ''}</div>
            <div style="display:flex;gap:4px;">
              <button class="menu_button m_n_up" data-key="${k}" data-emo="${id}" title="Upload ${escapeHTML(e.name)}"><i class="fa-solid fa-upload"></i></button>
              <button class="menu_button danger_button m_n_clr" data-key="${k}" data-emo="${id}" title="Clear" ${src ? '' : 'disabled'}><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>`;
      }).join('')}</div>`;
      return `<div class="cb_spk">
        <div class="cb_spk_row">
          ${thumbBox(base)}
          <span class="cb_spk_name">${escapeHTML(name)}<small>${manual ? 'custom portrait' : base ? 'auto portrait' : 'no portrait'} \u00B7 ${cnt}/${s.emotions.length} emotions</small></span>
          <button class="menu_button m_n_up" data-key="${k}" data-emo="" title="Upload base portrait"><i class="fa-solid fa-upload"></i></button>
          <button class="menu_button m_n_clr" data-key="${k}" data-emo="" title="Remove custom base portrait" ${manual ? '' : 'disabled'}><i class="fa-solid fa-rotate-left"></i></button>
          <button class="menu_button m_n_exp" data-key="${k}" title="Emotion portraits"><i class="fa-solid fa-chevron-${open ? 'down' : 'right'}"></i></button>
          ${custom ? `<button class="menu_button danger_button m_n_rm" data-key="${k}" title="Remove custom speaker"><i class="fa-solid fa-xmark"></i></button>` : ''}
        </div>
        ${grid}
      </div>`;
    }).join('');
  }

  function emoRowsHtml(s) {
    return s.emotions.map((e) => {
      const id = escapeHTML(e.id);
      const isDef = e.id === s.emoDefault;
      return `<div class="cb_emo_row">
        <label class="cb_defdot" title="Use as default"><input type="radio" name="cbr_emodef" value="${id}" ${isDef ? 'checked' : ''}></label>
        <input type="text" class="text_pole m_e_name" data-id="${id}" value="${escapeHTML(e.name)}" style="flex:1;min-width:0;margin:0;">
        <button class="menu_button danger_button m_e_del" data-id="${id}" title="${isDef ? 'Pick a different default before deleting this one' : 'Delete emotion'}" ${isDef ? 'disabled' : ''}><i class="fa-solid fa-trash"></i></button>
      </div>`;
    }).join('');
  }

  function validateDelims(d) {
    const errs = [], warns = [];
    const keys = ['delimSpkOpen', 'delimSpkClose', 'delimNarOpen', 'delimNarClose', 'delimEmo', 'narratorWord'];
    if (keys.some((k) => !d[k])) errs.push('Every field needs a value.');
    const delims = [d.delimSpkOpen, d.delimSpkClose, d.delimNarOpen, d.delimNarClose];
    if (d.delimSpkOpen && d.delimSpkOpen === d.delimNarOpen) errs.push('Speaker and narrator need different opening delimiters.');
    if (d.delimEmo && delims.some((x) => x && x.includes(d.delimEmo))) errs.push('The emotion separator can\'t appear inside the other delimiters.');
    const all = [...delims, d.delimEmo].filter(Boolean);
    if (all.some((x) => /[*_`~]/.test(x))) warns.push('Contains * _ ` or ~, which markdown may turn into formatting.');
    if (all.some((x) => /["<>]/.test(x))) warns.push('Quotes or < > can clash with dialogue or HTML.');
    if (all.some((x) => x.length === 1)) warns.push('Single-character delimiters can match normal text by accident.');
    return { errs, warns };
  }

  function buildPrompt(s) {
    const sp = `${s.delimSpkOpen}Name${s.delimEmo}Emotion${s.delimSpkClose}`;
    const nr = `${s.delimNarOpen}${s.narratorWord}${s.delimNarClose}`;
    let p = `Format every line as ${sp}: for characters or ${nr}: for narration. Emotions: ${s.emotions.map((e) => e.name).join(', ')}.`;
    if (s.nodeUserMsgs) p += ' User messages follow the same format.';
    return p;
  }

  function nodeSectionHtml(s) {
    const sl = (id, key, label, unit, min, max, step) => `
      <div class="cb_row" style="margin-top:8px;"><label>${label}</label><span><span id="m_n_${id}val">${s[key]}</span>${unit}</span></div>
      <input type="range" class="m_n_sl" data-key="${key}" data-id="${id}" min="${min}" max="${max}" step="${step}" value="${s[key]}">`;
    const df = (key, label) => `<label class="cb_dfield"><span>${label}</span><input type="text" class="text_pole m_d_in" data-key="${key}" value="${escapeHTML(s[key])}" maxlength="16"></label>`;
    const ck = (id, on, label) => `<label class="checkbox_label"><input type="checkbox" id="${id}" ${on ? 'checked' : ''}><span>${label}</span></label>`;
    return `
      <div class="cb_section">
        ${secHead('vn', 'fa-comments', 'Visual Novel Mode')}
        <div class="cb_collapse_content">
          ${ck('m_n_enable', s.nodeEnabled, 'Enable Visual Novel Mode')}
          <div id="m_n_body" class="${s.nodeEnabled ? '' : 'cb_dim'}">
            ${subHead('vn_play', 'Playback')}
            <div class="cb_collapse_content">
              ${ck('m_n_user', s.nodeUserMsgs, 'Include my messages (yours plays on send, then the reply takes over)')}
              ${ck('m_n_tw', s.nodeTypewriter, 'Typewriter effect')}
              ${sl('sp', 'nodeSpeed', 'Typing delay per character:', 'ms', 5, 80, 1)}
              <div style="margin-top:8px;">${ck('m_n_auto', s.nodeAuto, 'Auto-advance to next line')}</div>
              ${sl('ad', 'nodeAutoDelay', 'Auto-advance wait:', 'ms', 500, 8000, 250)}
            </div>

            ${subHead('vn_look', 'Look')}
            <div class="cb_collapse_content">
              ${sl('op', 'nodeOpacity', 'Box opacity:', '%', 30, 100, 1)}
              ${sl('ps', 'nodePortrait', 'Portrait size:', 'px', 60, 240, 5)}
              <div style="margin-top:8px;"><strong>Portrait shape:</strong>${pills('nshape', [['rounded', 'Rounded'], ['round', 'Round'], ['square', 'Square'], ['rect', 'Tall']], s.nodeShape)}</div>
            </div>

            ${subHead('vn_emo', 'Emotions')}
            <div class="cb_collapse_content">
              <div class="cb_hint">The dot marks the default. It's used when a tag has no emotion, or one that isn't on this list.</div>
              <div id="m_e_list"></div>
              <div class="cb_row" style="margin-top:6px;">
                <input type="text" id="m_e_new" class="text_pole" placeholder="New emotion" style="flex:1;margin:0;">
                <button id="m_e_add" class="menu_button" style="margin:0;"><i class="fa-solid fa-plus"></i> Add</button>
              </div>
            </div>

            ${subHead('vn_spk', 'Speakers & Portraits')}
            <div class="cb_collapse_content">
              <div class="cb_hint">Character cards and your persona are matched by name automatically. Open a speaker with the arrow to give them a portrait per emotion. The narrator never gets a portrait.</div>
              <div id="m_n_spk"></div>
              <div class="cb_row" style="margin-top:8px;">
                <input type="text" id="m_n_newspk" class="text_pole" placeholder="Add a speaker (e.g. an NPC)" style="flex:1;margin:0;">
                <button id="m_n_addspk" class="menu_button" style="margin:0;"><i class="fa-solid fa-user-plus"></i> Add</button>
              </div>
              <input type="file" id="m_n_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
            </div>

            ${subHead('vn_tags', 'Tags & Delimiters')}
            <div class="cb_collapse_content">
              ${ck('m_n_hide', s.nodeHideEmo, 'Hide the emotion part of tags in the normal chat view')}
              ${ck('m_n_pick', s.nodePicker, 'Show speaker / emotion picker above the input box')}
              <div class="cb_dgrid">
                ${df('delimSpkOpen', 'Speaker open')}${df('delimSpkClose', 'Speaker close')}
                ${df('delimNarOpen', 'Narrator open')}${df('delimNarClose', 'Narrator close')}
                ${df('delimEmo', 'Emotion separator')}${df('narratorWord', 'Narrator keyword')}
              </div>
              <div id="m_d_preview" class="cb_code"></div>
              <div id="m_d_msg" class="cb_hint"></div>
              <div class="cb_actions">
                <button id="m_d_apply" class="menu_button"><i class="fa-solid fa-check"></i> Apply</button>
                <button id="m_d_reset" class="menu_button"><i class="fa-solid fa-rotate-left"></i> Reset to defaults</button>
              </div>
            </div>

            ${subHead('vn_prompt', 'Prompt for your LLM')}
            <div class="cb_collapse_content">
              <div class="cb_hint">Built from your current emotions and delimiters, so it stays in sync.</div>
              <textarea id="m_p_text" class="text_pole" readonly rows="4" style="width:100%;resize:vertical;"></textarea>
              <button id="m_p_copy" class="menu_button" style="margin-top:6px;"><i class="fa-solid fa-copy"></i> Copy Prompt</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  function bindVN(overlay, s) {
    const body = overlay.querySelector('#m_n_body');
    const refreshPrompt = () => { overlay.querySelector('#m_p_text').value = buildPrompt(s); };
    const refreshAll = () => { refreshPrompt(); fillPicker(); if (s.nodeEnabled) nodeLoad({ animate: false }); };

    overlay.querySelector('#m_n_enable').onchange = function() {
      s.nodeEnabled = this.checked; save();
      if (this.checked) s.vnUsed = true;
      body.classList.toggle('cb_dim', !this.checked);
      refresh();
    };
    const chk = (id, key, after) => { overlay.querySelector(id).onchange = function() { s[key] = this.checked; save(); if (after) after(); }; };
    chk('#m_n_user', 'nodeUserMsgs', () => { refreshPrompt(); nodeLoad({ animate: false }); });
    chk('#m_n_tw', 'nodeTypewriter');
    chk('#m_n_auto', 'nodeAuto');
    chk('#m_n_pick', 'nodePicker', ensurePicker);
    chk('#m_n_hide', 'nodeHideEmo', () => {
      if (s.nodeHideEmo) cleanEmoTags();
      else if (typeof ctx().reloadCurrentChat === 'function') ctx().reloadCurrentChat();
    });

    overlay.querySelectorAll('.m_n_sl').forEach((sl) => {
      sl.oninput = function() {
        s[this.dataset.key] = Number(this.value);
        overlay.querySelector(`#m_n_${this.dataset.id}val`).textContent = this.value;
        nodeApplyLook();
      };
      sl.onchange = save;
    });
    onPills(overlay, 'nshape', (v) => { s.nodeShape = v; save(); nodeApplyLook(); });

    // Emotions
    const renderEmo = () => {
      const box = overlay.querySelector('#m_e_list');
      box.innerHTML = emoRowsHtml(s);
      onPills(box, 'emodef', (v) => { s.emoDefault = v; save(); renderEmo(); renderSpk(); refreshAll(); });
      box.querySelectorAll('.m_e_name').forEach((inp) => {
        inp.onchange = () => {
          const e = s.emotions.find((x) => x.id === inp.dataset.id);
          const nm = inp.value.trim();
          if (!nm || s.emotions.some((x) => x !== e && x.name.toLowerCase() === nm.toLowerCase())) {
            toastr.warning('Emotion names need to be unique and not empty.', 'Visual Novel');
            inp.value = e.name;
            return;
          }
          e.name = nm; save(); renderSpk(); refreshAll();
        };
      });
      box.querySelectorAll('.m_e_del').forEach((b) => {
        b.onclick = () => {
          const id = b.dataset.id;
          if (id === s.emoDefault) return;
          const e = s.emotions.find((x) => x.id === id);
          const used = Object.values(s.nodeEmoImgs).some((m) => m[id]);
          if (used && !confirm(`Delete "${e.name}" and the portraits uploaded for it?`)) return;
          s.emotions = s.emotions.filter((x) => x.id !== id);
          const olds = [];
          for (const m of Object.values(s.nodeEmoImgs)) { if (m[id]) olds.push(m[id]); delete m[id]; }
          save(); renderEmo(); renderSpk(); refreshAll();
          olds.forEach((u) => A.deleteFileIfUnused(u));
        };
      });
    };
    const addEmo = () => {
      const inp = overlay.querySelector('#m_e_new');
      const nm = inp.value.trim();
      if (!nm) return;
      if (s.emotions.some((x) => x.name.toLowerCase() === nm.toLowerCase())) { toastr.warning('That emotion already exists.', 'Visual Novel'); return; }
      s.emotions.push({ id: 'emo_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name: nm });
      inp.value = '';
      save(); renderEmo(); renderSpk(); refreshAll();
    };
    overlay.querySelector('#m_e_add').onclick = addEmo;
    overlay.querySelector('#m_e_new').onkeydown = (e) => { if (e.key === 'Enter') addEmo(); };

    // Speakers
    const nFile = overlay.querySelector('#m_n_file');
    let pending = null;
    const renderSpk = () => {
      const box = overlay.querySelector('#m_n_spk');
      box.innerHTML = spkRowsHtml(s);
      box.querySelectorAll('.m_n_up').forEach((b) => { b.onclick = () => { pending = { key: b.dataset.key, emo: b.dataset.emo }; nFile.click(); }; });
      box.querySelectorAll('.m_n_clr').forEach((b) => {
        b.onclick = () => {
          const { key, emo } = b.dataset;
          let old;
          if (emo) { if (s.nodeEmoImgs[key]) { old = s.nodeEmoImgs[key][emo]; delete s.nodeEmoImgs[key][emo]; } }
          else { old = s.nodeAvatars[key]; delete s.nodeAvatars[key]; }
          save(); renderSpk(); refreshAll();
          A.deleteFileIfUnused(old);
        };
      });
      box.querySelectorAll('.m_n_exp').forEach((b) => {
        b.onclick = () => { const k = b.dataset.key; if (spkOpen.has(k)) spkOpen.delete(k); else spkOpen.add(k); renderSpk(); };
      });
      box.querySelectorAll('.m_n_rm').forEach((b) => {
        b.onclick = () => {
          const k = b.dataset.key;
          if (!confirm('Remove this custom speaker and their uploaded portraits?')) return;
          s.nodeCustomSpk = s.nodeCustomSpk.filter((n) => n.toLowerCase() !== k);
          const olds = [s.nodeAvatars[k], ...Object.values(s.nodeEmoImgs[k] || {})].filter(Boolean);
          delete s.nodeAvatars[k];
          delete s.nodeEmoImgs[k];
          setTimeout(() => olds.forEach((u) => A.deleteFileIfUnused(u)), 0);
          spkOpen.delete(k);
          save(); renderSpk(); refreshAll();
        };
      });
    };
    nFile.onchange = async () => {
      if (!nFile.files.length || !pending) return;
      try {
        const url = await uploadPortrait(nFile.files[0]);
        let old;
        if (pending.emo) {
          if (!s.nodeEmoImgs[pending.key]) s.nodeEmoImgs[pending.key] = {};
          old = s.nodeEmoImgs[pending.key][pending.emo];
          s.nodeEmoImgs[pending.key][pending.emo] = url;
        } else { old = s.nodeAvatars[pending.key]; s.nodeAvatars[pending.key] = url; }
        save(); renderSpk(); refreshAll();
        A.deleteFileIfUnused(old);
      } catch (e) {
        console.error('[chatvisuals vn upload]', e);
        toastr.error(e.message || 'Portrait upload failed', 'Visual Novel');
      }
      nFile.value = '';
    };
    const addSpk = () => {
      const inp = overlay.querySelector('#m_n_newspk');
      const nm = inp.value.trim();
      if (!nm) return;
      const k = nm.toLowerCase();
      if (k === String(s.narratorWord).trim().toLowerCase()) { toastr.warning('That name is your narrator keyword.', 'Visual Novel'); return; }
      if ([s.delimSpkOpen, s.delimSpkClose, s.delimEmo].some((d) => nm.includes(d))) { toastr.warning('Names can\'t contain your tag delimiters.', 'Visual Novel'); return; }
      if (!s.nodeCustomSpk.some((n) => n.toLowerCase() === k)) s.nodeCustomSpk.push(nm);
      spkOpen.add(k);
      inp.value = '';
      save(); renderSpk(); refreshAll();
    };
    overlay.querySelector('#m_n_addspk').onclick = addSpk;
    overlay.querySelector('#m_n_newspk').onkeydown = (e) => { if (e.key === 'Enter') addSpk(); };

    // Delimiters
    const dIns = [...overlay.querySelectorAll('.m_d_in')];
    const readD = () => Object.fromEntries(dIns.map((i) => [i.dataset.key, i.value.trim()]));
    const preview = () => {
      const d = readD();
      overlay.querySelector('#m_d_preview').textContent =
        `${d.delimSpkOpen}Rafe${d.delimEmo}Neutral${d.delimSpkClose}: "Dialogue."\n${d.delimNarOpen}${d.narratorWord}${d.delimNarClose}: Narration.`;
      const { errs, warns } = validateDelims(d);
      overlay.querySelector('#m_d_msg').innerHTML = errs.map((x) => `<div class="cb_err">${escapeHTML(x)}</div>`).join('') + warns.map((x) => `<div class="cb_warn">${escapeHTML(x)}</div>`).join('');
    };
    const applyD = (d) => {
      const { errs } = validateDelims(d);
      if (errs.length) { toastr.error(errs[0], 'Visual Novel'); return false; }
      Object.assign(s, d);
      save(); renderSpk(); refreshAll(); cleanEmoTags();
      toastr.success('Delimiters updated', 'Visual Novel');
      return true;
    };
    dIns.forEach((i) => { i.oninput = preview; });
    overlay.querySelector('#m_d_apply').onclick = () => applyD(readD());
    overlay.querySelector('#m_d_reset').onclick = () => {
      dIns.forEach((i) => { i.value = A.DEFAULTS[i.dataset.key]; });
      preview();
      applyD(readD());
    };

    // Prompt
    overlay.querySelector('#m_p_copy').onclick = () => {
      const ta = overlay.querySelector('#m_p_text');
      const done = () => toastr.success('Prompt copied', 'Visual Novel');
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(ta.value).then(done).catch(() => { ta.select(); document.execCommand('copy'); done(); });
      else { ta.select(); document.execCommand('copy'); done(); }
    };

    renderEmo(); renderSpk(); preview(); refreshPrompt();
  }

  async function uploadPortrait(f) {
    let url = await readDataURL(f);
    let converted = false;
    if (f.type !== 'image/gif') {
      const i = await loadImg(url);
      const mx = Math.max(i.width, i.height);
      if (mx > 768) {
        const k = 768 / mx;
        const c = document.createElement('canvas');
        c.width = Math.round(i.width * k); c.height = Math.round(i.height * k);
        c.getContext('2d').drawImage(i, 0, 0, c.width, c.height);
        url = c.toDataURL('image/png');
        converted = true;
      }
    }
    let ext = (f.name.split('.').pop() || '').toLowerCase();
    if (converted || !['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) ext = 'png';
    const name = `vnpfp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const res = await fetch('/api/files/upload', {
      method: 'POST',
      headers: ctx().getRequestHeaders(),
      body: JSON.stringify({ name, data: url.split(',')[1] }),
    });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    const j = await res.json();
    return '/' + String(j.path).replace(/^\/+/, '');
  }

  // ----- Picker bar above the input box -----
  function fillPicker() {
    const bar = document.getElementById('cb_pick');
    if (!bar) return;
    const s = settings();
    const spkSel = bar.querySelector('#cb_pick_spk');
    const emoSel = bar.querySelector('#cb_pick_emo');
    const prevS = spkSel.value, prevE = emoSel.value;
    spkSel.innerHTML = collectSpeakers().map((x) => `<option value="${escapeHTML(x.name)}">${escapeHTML(x.name)}</option>`).join('')
      + `<option value="__nar__">${escapeHTML(s.narratorWord)} (narration)</option>`;
    emoSel.innerHTML = '<option value="">Default emotion</option>'
      + s.emotions.map((e) => `<option value="${escapeHTML(e.name)}">${escapeHTML(e.name)}</option>`).join('');
    if ([...spkSel.options].some((o) => o.value === prevS)) spkSel.value = prevS;
    if ([...emoSel.options].some((o) => o.value === prevE)) emoSel.value = prevE;
    emoSel.disabled = spkSel.value === '__nar__';
  }

  function insertPickedTag() {
    const s = settings();
    const bar = document.getElementById('cb_pick');
    const ta = document.getElementById('send_textarea');
    if (!bar || !ta) return;
    const spk = bar.querySelector('#cb_pick_spk').value;
    const emo = bar.querySelector('#cb_pick_emo').value;
    const tag = spk === '__nar__'
      ? `${s.delimNarOpen}${s.narratorWord}${s.delimNarClose}: `
      : `${s.delimSpkOpen}${spk}${emo ? s.delimEmo + emo : ''}${s.delimSpkClose}: `;
    const st = ta.selectionStart ?? ta.value.length;
    const en = ta.selectionEnd ?? st;
    const before = ta.value.slice(0, st);
    const pre = before && !/\n\s*$/.test(before) ? '\n' : '';
    ta.value = before + pre + tag + ta.value.slice(en);
    const caret = (before + pre + tag).length;
    ta.focus();
    ta.setSelectionRange(caret, caret);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function ensurePicker() {
    const s = settings();
    let bar = document.getElementById('cb_pick');
    if (!(A.isOn() && s.nodeEnabled && s.nodePicker)) { if (bar) bar.remove(); return; }
    if (bar) return;
    const sendForm = document.getElementById('send_form');
    if (!sendForm || !sendForm.parentNode) return;
    bar = document.createElement('div');
    bar.id = 'cb_pick';
    bar.innerHTML = `
      <i class="fa-solid fa-masks-theater" style="opacity:.6;"></i>
      <select id="cb_pick_spk" class="text_pole" title="Speaker"></select>
      <select id="cb_pick_emo" class="text_pole" title="Emotion"></select>
      <button type="button" id="cb_pick_ins" class="menu_button" title="Insert tag at the cursor"><i class="fa-solid fa-tag"></i> Insert</button>`;
    sendForm.parentNode.insertBefore(bar, sendForm);
    bar.querySelector('#cb_pick_spk').onchange = function() { bar.querySelector('#cb_pick_emo').disabled = this.value === '__nar__'; };
    bar.querySelector('#cb_pick_spk').onfocus = fillPicker;
    bar.querySelector('#cb_pick_ins').onclick = insertPickedTag;
    fillPicker();
    placeNode();
  }

  // ----- Dialogue box -----
  function placeNode() {
    const ov = document.getElementById('cb_node');
    if (!ov) return;
    const chat = document.getElementById('chat');
    const form = document.getElementById('form_sheld');
    if (chat) {
      const r = chat.getBoundingClientRect();
      ov.style.left = r.left + 'px';
      ov.style.width = r.width + 'px';
    }
    ov.style.bottom = (form ? window.innerHeight - form.getBoundingClientRect().top + 8 : 90) + 'px';
  }

  function nodeApplyLook() {
    const ov = document.getElementById('cb_node');
    if (!ov) return;
    const s = settings();
    ov.style.setProperty('--cbn-op', s.nodeOpacity / 100);
    ov.style.setProperty('--cbn-ps', s.nodePortrait + 'px');
    for (const sh of ['round', 'square', 'rect']) ov.classList.toggle('cb_shape_' + sh, s.nodeShape === sh);
  }

  function ensureNodeLayer() {
    let ov = document.getElementById('cb_node');
    if (ov) return ov;
    ov = document.createElement('div');
    ov.id = 'cb_node';
    ov.innerHTML = `
      <div class="cb_n_port"><img alt=""><i class="fa-solid fa-user"></i></div>
      <div class="cb_n_box">
        <div class="cb_n_name"></div>
        <div class="cb_n_text"></div>
        <div class="cb_n_arrow"></div>
        <div class="cb_n_ctrl">
          <button type="button" data-a="older" title="Older message"><i class="fa-solid fa-angles-left"></i></button>
          <button type="button" data-a="prev" title="Previous line"><i class="fa-solid fa-angle-left"></i></button>
          <span class="cb_n_count"></span>
          <button type="button" data-a="next" title="Next line"><i class="fa-solid fa-angle-right"></i></button>
          <button type="button" data-a="newer" title="Newer message"><i class="fa-solid fa-angles-right"></i></button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    ov.querySelector('.cb_n_box').addEventListener('click', (e) => {
      if (e.target.closest('.cb_n_ctrl')) return;
      nodeAdvance();
    });
    const acts = { older: () => nodeGoMsg(-1), newer: () => nodeGoMsg(1), prev: () => nodeStep(-1), next: () => nodeStep(1) };
    ov.querySelectorAll('.cb_n_ctrl button').forEach((b) => {
      b.onclick = (e) => { e.stopPropagation(); acts[b.dataset.a](); };
    });
    const port = ov.querySelector('.cb_n_port');
    port.querySelector('img').onerror = () => port.classList.add('cb_noimg');
    window.addEventListener('resize', placeNode);
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(placeNode);
      for (const id of ['chat', 'form_sheld']) { const el = document.getElementById(id); if (el) ro.observe(el); }
    }
    nodeApplyLook();
    return ov;
  }

  function nodeStopTyping() {
    clearInterval(node.typer); node.typer = null;
    clearTimeout(node.auto); node.auto = null;
    node.typing = false; node.finish = null;
  }

  function typeInto(el, html, speed, done) {
    el.innerHTML = html;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const items = [];
    let n;
    while ((n = walker.nextNode())) { items.push({ n, t: n.nodeValue }); n.nodeValue = ''; }
    let ii = 0, ci = 0;
    node.typing = true;
    const finish = () => {
      clearInterval(node.typer); node.typer = null;
      items.forEach((o) => { o.n.nodeValue = o.t; });
      done();
    };
    node.finish = finish;
    node.typer = setInterval(() => {
      while (ii < items.length && ci >= items[ii].t.length) { ii++; ci = 0; }
      if (ii >= items.length) { finish(); return; }
      ci++;
      items[ii].n.nodeValue = items[ii].t.slice(0, ci);
      el.scrollTop = el.scrollHeight;
    }, speed);
  }

  function nodeShow(animate) {
    const s = settings();
    const ov = ensureNodeLayer();
    nodeStopTyping();
    const seg = node.segs[node.i];
    if (!seg) { ov.style.display = 'none'; return; }
    ov.style.display = 'flex';
    nodeApplyLook();
    const isChar = seg.kind === 'char';
    ov.querySelector('.cb_n_box').classList.toggle('cb_n_nar', !isChar);
    const nameEl = ov.querySelector('.cb_n_name');
    nameEl.textContent = seg.name || '';
    nameEl.style.display = seg.name ? '' : 'none';

    const port = ov.querySelector('.cb_n_port');
    const img = port.querySelector('img');
    const src = isChar ? resolvePortrait(seg.name, seg.emo) : null;
    port.style.display = isChar ? '' : 'none';
    port.classList.toggle('cb_noimg', isChar && !src);
    if (src && img.getAttribute('src') !== src) { port.classList.remove('cb_noimg'); img.src = src; }

    const c = ctx();
    ov.classList.toggle('cb_right', isChar && !!c.name1 && seg.name.toLowerCase() === c.name1.toLowerCase());
    ov.querySelector('.cb_n_count').textContent = `${node.pos + 1}/${node.list.length} \u00B7 ${node.i + 1}/${node.segs.length}`;

    const text = ov.querySelector('.cb_n_text');
    const arrow = ov.querySelector('.cb_n_arrow');
    const more = node.i < node.segs.length - 1;
    const html = nodeFmt(seg.text);
    arrow.textContent = '';
    const done = () => {
      node.typing = false; node.finish = null;
      arrow.textContent = more ? '\u25BC' : '';
      if (s.nodeAuto && more) node.auto = setTimeout(() => nodeStep(1), s.nodeAutoDelay);
    };
    if (animate && s.nodeTypewriter && s.nodeSpeed > 0) typeInto(text, html, s.nodeSpeed, done);
    else { text.innerHTML = html; done(); }
    placeNode();
  }

  function nodeStep(d) {
    const ni = node.i + d;
    if (ni < 0 || ni >= node.segs.length) return;
    node.i = ni;
    nodeShow(d > 0);
  }

  function nodeAdvance() {
    if (node.typing && node.finish) { node.finish(); return; }
    nodeStep(1);
  }

  function nodeParseCurrent() {
    const c = ctx();
    const m = c.chat[node.list[node.pos]];
    if (!m) { node.segs = []; return; }
    node.segs = m.is_user
      ? parseSegments(m.mes, m.name || c.name1, true)
      : parseSegments(m.mes, m.name || c.name2, false);
  }

  function nodeGoMsg(d) {
    const np = node.pos + d;
    if (np < 0 || np >= node.list.length) return;
    node.pos = np;
    nodeParseCurrent();
    node.i = 0;
    nodeShow(false);
  }

  const syncNodeToggle = () => A.syncVNToggle();

  function nodeLoad(opts = {}) {
    const s = settings();
    const ov = ensureNodeLayer();
    syncNodeToggle();
    fillPicker();
    if (!s.nodeEnabled || !A.isOn()) { nodeStopTyping(); ov.style.display = 'none'; return; }
    const c = ctx();
    node.list = [];
    (c.chat || []).forEach((m, i) => {
      if (m.is_system || !m.mes) return;
      if (m.is_user && !s.nodeUserMsgs) return;
      node.list.push(i);
    });
    if (!node.list.length) { nodeStopTyping(); ov.style.display = 'none'; return; }
    node.pos = node.list.length - 1;
    nodeParseCurrent();
    node.i = 0;
    nodeShow(!!opts.animate);
  }

  function nodeQueue(animate) {
    nodeQAnim = nodeQAnim || !!animate;
    clearTimeout(nodeQ);
    nodeQ = setTimeout(() => { const a = nodeQAnim; nodeQAnim = false; nodeLoad({ animate: a }); }, 60);
  }

  function ensure() { ensurePicker(); ensureChatObserver(); }

  function refresh() {
    applyStyle();
    nodeLoad({ animate: false });
    ensure();
    syncNodeToggle();
  }

  function teardown() {
    applyStyle();
    nodeStopTyping();
    const ov = document.getElementById('cb_node');
    if (ov) ov.style.display = 'none';
    document.getElementById('cb_pick')?.remove();
    syncNodeToggle();
  }

  window.NTR.vn = {
    version: VN_VERSION,
    sectionHtml: nodeSectionHtml,
    bind: bindVN,
    refresh,
    teardown,
    ensure,
    queue: nodeQueue,
    cleanEmoTags,
  };
})();
