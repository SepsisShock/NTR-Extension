// Nitwit Tavern Redesign: Visual Novel Mode module.
// Loaded on demand by index.js. If this file breaks, the rest of the extension keeps working.
(() => {
  const VN_VERSION = '2.1.0';
  const A = window.NTR && window.NTR.api;
  if (!A) { console.error('[NTR] vn.js loaded without the core (index.js).'); return; }
  const { ctx, save, settings, escapeHTML, fullResUrl, readDataURL, loadImg, pills, onPills, secHead, subHead } = A;
  const TAG = A.TAG || '';

  // Per-character Visual Novel data (speakers, portraits, locations). Lives in the card, or per group.
  const VDEF = () => ({ avatars: {}, emoImgs: {}, customSpk: [], locations: [], locDefault: '' });
  function V() {
    const st = A.store();
    if (!st) return VDEF();
    if (!st.vn || typeof st.vn !== 'object') st.vn = VDEF();
    const d = VDEF();
    for (const k of Object.keys(d)) if (st.vn[k] === undefined) st.vn[k] = d[k];
    return st.vn;
  }
  const newId = (p) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const normLoc = (x) => String(x || '').toLowerCase().replace(/^\s*the\s+/, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

  const VN_CSS = `
      #cb_node { position: fixed; z-index: 2450; display: none; align-items: flex-end; gap: 12px; padding: 0 6px; box-sizing: border-box; pointer-events: none; }
      #cb_node > * { pointer-events: auto; }
      #cb_node.cb_right { flex-direction: row-reverse; }
      #cb_node .cb_n_port { position: relative; flex: none; width: var(--cbn-ps, 120px); height: var(--cbn-ps, 120px); border-radius: 12px; overflow: hidden; border: 2px solid var(--SmartThemeBorderColor, #555); background: rgba(0,0,0,0.55); box-shadow: 0 4px 14px rgba(0,0,0,.5); }
      #cb_node .cb_n_port img { width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; }
      #cb_node .cb_n_port i { display: none; position: absolute; inset: 0; align-items: center; justify-content: center; font-size: calc(var(--cbn-ps, 120px) * 0.45); opacity: .35; }
      #cb_node .cb_n_port.cb_noimg img { display: none; }
      #cb_node .cb_n_port.cb_noimg i { display: flex; }
      #cb_node .cb_n_box { position: relative; flex: 1; min-width: 0; min-height: var(--cbn-minh, 96px); font-size: calc(var(--cbn-fs, 1) * 1em); padding: 22px 18px 28px; border-radius: 12px; border: 2px solid var(--SmartThemeBorderColor, #555); background: rgba(10, 14, 22, var(--cbn-op, .88)); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); color: var(--SmartThemeBodyColor, #ddd); cursor: pointer; box-shadow: 0 4px 18px rgba(0,0,0,.55); }
      #cb_node .cb_n_name { position: absolute; top: -14px; left: 16px; padding: 2px 14px; border-radius: 999px; font-weight: bold; font-size: 0.95em; background: var(--SmartThemeQuoteColor, #6cf); color: #000; }
      #cb_node.cb_right .cb_n_name { left: auto; right: 16px; }
      #cb_node .cb_n_text { max-height: var(--cbn-maxh, 28vh); overflow-y: auto; line-height: 1.5; }
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
      #ntr_loc { position: fixed; inset: 0; pointer-events: none; display: none; }
      #ntr_loc > div { position: absolute; inset: 0; background-size: cover; background-position: center; opacity: 0; transition: opacity .7s ease; }
      #ntr_stage { position: fixed; inset: 0; z-index: 2410; pointer-events: none; display: none; }
      .ntr_spr { position: absolute; bottom: 0; height: 100%; object-fit: contain; object-position: center bottom; transform-origin: center bottom; display: none; transition: filter .25s, opacity .25s; }
      .ntr_spr.ntr_dim { filter: brightness(.6); opacity: .9; }
      .cb_thumbbox.cb_wide { width: 64px; }
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

  function locNameOf(inner, s) {
    const mm = String(inner).trim().match(new RegExp(`^${reEsc(s.locWord)}\\s*:\\s*(.+)$`, 'i'));
    return mm ? mm[1].trim() : null;
  }

  function parseSegments(raw, fallbackName, leadAsSpeaker) {
    const s = settings();
    raw = String(raw || '');
    const re = tagRe(s);
    const nar = String(s.narratorWord).trim().toLowerCase();
    const segs = [];
    let last = 0, cur = null, m, sawTag = false;
    const lead = (text) => (leadAsSpeaker ? { kind: 'char', name: fallbackName || '', emo: '', text } : { kind: 'narrator', name: '', emo: '', text });
    const close = (end) => {
      const text = raw.slice(last, end).trim();
      if (!text) return;
      if (cur) { cur.text = text; segs.push(cur); } else segs.push(lead(text));
    };
    while ((m = re.exec(raw))) {
      sawTag = true;
      close(m.index);
      cur = null;
      if (m[1] !== undefined) {
        const t = splitTag(m[1], s);
        cur = { kind: 'char', name: t.name, emo: t.emo };
      } else {
        const loc = locNameOf(m[2], s);
        if (loc !== null) segs.push({ kind: 'loc', name: loc, emo: '', text: '' });
        else {
          const t = splitTag(m[2], s);
          cur = { kind: 'narrator', name: t.name.toLowerCase() === nar ? '' : t.name, emo: '' };
        }
      }
      last = re.lastIndex;
    }
    if (sawTag) close(raw.length);
    else if (raw.trim()) segs.push({ kind: 'char', name: fallbackName || '', emo: '', text: raw.trim() });
    return segs;
  }

  function nodeFmt(t) {
    let h = escapeHTML(String(t).trim());
    h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
    h = h.replace(/&quot;(.+?)&quot;/g, '<span class="cb_q">&quot;$1&quot;</span>');
    h = h.replace(/\u201C(.+?)\u201D/g, '<span class="cb_q">\u201C$1\u201D</span>');
    return h.replace(/\n/g, '<br>');
  }

  // Normal chat view: ((Rafe%%Sad)) -> ((Rafe)), and [[Location:Tavern]] disappears.
  function cleanEmoTags() {
    const s = settings();
    if (!A.isOn() || !s.nodeHideEmo) return;
    const so = reEsc(s.delimSpkOpen), sc = reEsc(s.delimSpkClose), no = reEsc(s.delimNarOpen), nc = reEsc(s.delimNarClose);
    const emoRe = s.delimEmo ? new RegExp(`(${so}(?:(?!${sc})[^\\n]){0,60}?)[ \\t]*${reEsc(s.delimEmo)}(?:(?!${sc})[^\\n]){0,60}?(${sc})`, 'g') : null;
    const locRe = new RegExp(`${no}[ \\t]*${reEsc(s.locWord)}[ \\t]*:(?:(?!${nc})[^\\n]){0,80}?${nc}[ \\t]*`, 'gi');
    document.querySelectorAll('#chat .mes_text').forEach((el) => {
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = w.nextNode())) {
        if (n.parentElement?.closest('textarea')) continue;
        let val = n.nodeValue;
        if (emoRe && val.includes(s.delimEmo)) val = val.replace(emoRe, '$1$2');
        if (val.includes(s.delimNarOpen)) val = val.replace(locRe, '');
        if (val !== n.nodeValue) n.nodeValue = val;
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
    if (V().avatars[key]) return V().avatars[key];
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
    const imgs = V().emoImgs[String(name || '').trim().toLowerCase()] || {};
    const e = findEmo(emoName);
    if (e && imgs[e.id]) return imgs[e.id];
    if (imgs[s.emoDefault]) return imgs[s.emoDefault];
    return resolveAvatar(name);
  }

  // Stage sprites only use uploaded images (emotion or custom base), never card/persona avatars.
  function spriteSrc(name, emoName) {
    const s = settings();
    const v = V();
    const key = String(name || '').trim().toLowerCase();
    const imgs = v.emoImgs[key] || {};
    const e = findEmo(emoName);
    return (e && imgs[e.id]) || imgs[s.emoDefault] || v.avatars[key] || null;
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
    (V().customSpk || []).forEach((n) => add(n, true));
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
      const manual = !!V().avatars[key];
      const imgs = V().emoImgs[key] || {};
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
    const keys = ['delimSpkOpen', 'delimSpkClose', 'delimNarOpen', 'delimNarClose', 'delimEmo', 'narratorWord', 'locWord'];
    if (keys.some((k) => !d[k])) errs.push('Every field needs a value.');
    const delims = [d.delimSpkOpen, d.delimSpkClose, d.delimNarOpen, d.delimNarClose];
    if (d.locWord && d.narratorWord && d.locWord.toLowerCase() === d.narratorWord.toLowerCase()) errs.push('The location keyword and narrator keyword need to be different.');
    if (d.locWord && d.locWord.includes(':')) errs.push('The location keyword can\'t contain a colon.');
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
    const v = V();
    const locs = v.locations.map((l) => l.name).filter(Boolean);
    if (locs.length || v.locDefault) p += ` Mark scene changes with ${s.delimNarOpen}${s.locWord}:Name${s.delimNarClose}${locs.length ? ' using: ' + locs.join(', ') : ''}.`;
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
              ${sl('bw', 'nodeBoxWidth', 'Box width (of the chat column):', '%', 40, 100, 1)}
              ${sl('bmin', 'nodeBoxMinH', 'Box minimum height:', 'px', 40, 300, 5)}
              ${sl('bmax', 'nodeBoxMaxH', 'Box maximum height before it scrolls:', 'vh', 10, 70, 1)}
              ${sl('lift', 'nodeBoxLift', 'Lift above the input bar:', 'px', 0, 400, 2)}
              ${sl('fs', 'nodeTextScale', 'Text size:', '%', 70, 180, 5)}
              <div style="margin-top:10px;">${ck('m_n_pbox', s.nodePortraitBox, 'Show the portrait in the box')}</div>
              ${ck('m_n_spr', s.nodeSprites, 'Show sprites on stage')}
              ${sl('ss', 'nodeSpriteScale', 'Sprite size:', '%', 30, 200, 5)}
              <div class="cb_hint">Sprites use the emotion images or custom base portraits you upload under Speakers, not card avatars. Tall transparent PNGs work best. Recent speakers stay on stage and dim while someone else talks.</div>
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

            ${subHead('vn_spk', 'Speakers & Portraits ' + TAG)}
            <div class="cb_collapse_content">
              <div class="cb_hint">Character cards and your persona are matched by name automatically. Open a speaker with the arrow to give them a portrait per emotion. The narrator never gets a portrait.</div>
              <div id="m_n_spk"></div>
              <div class="cb_row" style="margin-top:8px;">
                <input type="text" id="m_n_newspk" class="text_pole" placeholder="Add a speaker (e.g. an NPC)" style="flex:1;margin:0;">
                <button id="m_n_addspk" class="menu_button" style="margin:0;"><i class="fa-solid fa-user-plus"></i> Add</button>
              </div>
              <input type="file" id="m_n_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
            </div>

            ${subHead('vn_loc', 'Locations ' + TAG)}
            <div class="cb_collapse_content">
              <div class="cb_hint">Tag scene changes as ${escapeHTML(s.delimNarOpen + s.locWord)}:Name${escapeHTML(s.delimNarClose)}. The background changes when that line plays and stays until the next location. Matching ignores case, punctuation and a leading "The". Anything unmatched uses the default background, then SillyTavern's own.</div>
              <div id="m_l_list"></div>
              <div class="cb_row" style="margin-top:8px;">
                <input type="text" id="m_l_new" class="text_pole" placeholder="Add a location (e.g. Tavern)" style="flex:1;margin:0;">
                <button id="m_l_add" class="menu_button" style="margin:0;"><i class="fa-solid fa-plus"></i> Add</button>
              </div>
              <input type="file" id="m_l_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
            </div>

            ${subHead('vn_tags', 'Tags & Delimiters')}
            <div class="cb_collapse_content">
              ${ck('m_n_hide', s.nodeHideEmo, 'Hide emotion and location tags in the normal chat view')}
              ${ck('m_n_pick', s.nodePicker, 'Show speaker / emotion picker above the input box')}
              <div class="cb_dgrid">
                ${df('delimSpkOpen', 'Speaker open')}${df('delimSpkClose', 'Speaker close')}
                ${df('delimNarOpen', 'Narrator open')}${df('delimNarClose', 'Narrator close')}
                ${df('delimEmo', 'Emotion separator')}${df('narratorWord', 'Narrator keyword')}
                ${df('locWord', 'Location keyword')}
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
              ${ck('m_n_inj', s.nodeInject, 'Add these instructions to every request automatically')}
              <div class="cb_hint">No extra calls: the text rides along with your normal message while Visual Novel Mode is on. It's built from your emotions, delimiters and this character's locations, so it stays in sync. Untick it if you'd rather paste it into your own preset.</div>
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
    const refreshAll = () => { refreshPrompt(); fillPicker(); updateInjection(); if (s.nodeEnabled) nodeLoad({ animate: false }); };

    overlay.querySelector('#m_n_enable').onchange = function() {
      s.nodeEnabled = this.checked; save();
      if (this.checked) s.vnUsed = true;
      body.classList.toggle('cb_dim', !this.checked);
      refresh();
    };
    const chk = (id, key, after) => { overlay.querySelector(id).onchange = function() { s[key] = this.checked; save(); if (after) after(); }; };
    chk('#m_n_user', 'nodeUserMsgs', () => { refreshPrompt(); nodeLoad({ animate: false }); });
    chk('#m_n_tw', 'nodeTypewriter');
    chk('#m_n_pbox', 'nodePortraitBox', () => { if (s.nodeEnabled) nodeShow(false); });
    chk('#m_n_spr', 'nodeSprites', updateStage);
    chk('#m_n_inj', 'nodeInject', updateInjection);
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
        placeNode();
        updateStage();
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
          const used = Object.values(V().emoImgs).some((m) => m[id]);
          if (used && !confirm(`Delete "${e.name}" and the portraits uploaded for it?`)) return;
          s.emotions = s.emotions.filter((x) => x.id !== id);
          const olds = [];
          for (const m of Object.values(V().emoImgs)) { if (m[id]) olds.push(m[id]); delete m[id]; }
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
          if (emo) { if (V().emoImgs[key]) { old = V().emoImgs[key][emo]; delete V().emoImgs[key][emo]; } }
          else { old = V().avatars[key]; delete V().avatars[key]; }
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
          V().customSpk = V().customSpk.filter((n) => n.toLowerCase() !== k);
          const olds = [V().avatars[k], ...Object.values(V().emoImgs[k] || {})].filter(Boolean);
          delete V().avatars[k];
          delete V().emoImgs[k];
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
          if (!V().emoImgs[pending.key]) V().emoImgs[pending.key] = {};
          old = V().emoImgs[pending.key][pending.emo];
          V().emoImgs[pending.key][pending.emo] = url;
        } else { old = V().avatars[pending.key]; V().avatars[pending.key] = url; }
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
      if (!V().customSpk.some((n) => n.toLowerCase() === k)) V().customSpk.push(nm);
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
        `${d.delimSpkOpen}Rafe${d.delimEmo}Neutral${d.delimSpkClose}: "Dialogue."\n${d.delimNarOpen}${d.narratorWord}${d.delimNarClose}: Narration.\n${d.delimNarOpen}${d.locWord}:Tavern${d.delimNarClose}`;
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

    // Locations
    const lFile = overlay.querySelector('#m_l_file');
    let lPending = null;
    const renderLoc = () => {
      const box = overlay.querySelector('#m_l_list');
      box.innerHTML = locRowsHtml();
      const v = V();
      box.querySelectorAll('.m_l_name').forEach((inp) => {
        inp.onchange = () => {
          const l = v.locations.find((x) => x.id === inp.dataset.id);
          const nm = inp.value.trim();
          if (!l) return;
          if (!nm || v.locations.some((x) => x !== l && normLoc(x.name) === normLoc(nm))) {
            toastr.warning('Location names need to be unique and not empty.', 'Visual Novel');
            inp.value = l.name;
            return;
          }
          l.name = nm; save(); refreshAll();
        };
      });
      box.querySelectorAll('.m_l_up').forEach((b) => { b.onclick = () => { lPending = b.dataset.id; lFile.click(); }; });
      box.querySelectorAll('.m_l_clr').forEach((b) => {
        b.onclick = () => {
          let old;
          if (b.dataset.id === '__default__') { old = v.locDefault; v.locDefault = ''; }
          else { const l = v.locations.find((x) => x.id === b.dataset.id); if (l) { old = l.url; l.url = ''; } }
          save(); renderLoc(); refreshAll();
          A.deleteFileIfUnused(old);
        };
      });
      box.querySelectorAll('.m_l_del').forEach((b) => {
        b.onclick = () => {
          const l = v.locations.find((x) => x.id === b.dataset.id);
          if (!l || !confirm(`Delete the location "${l.name}"${l.url ? ' and its background' : ''}?`)) return;
          v.locations = v.locations.filter((x) => x !== l);
          save(); renderLoc(); refreshAll();
          A.deleteFileIfUnused(l.url);
        };
      });
    };
    lFile.onchange = async () => {
      if (!lFile.files.length || !lPending) return;
      try {
        const url = await uploadPortrait(lFile.files[0], 2560, 'vnloc');
        const v = V();
        let old;
        if (lPending === '__default__') { old = v.locDefault; v.locDefault = url; }
        else { const l = v.locations.find((x) => x.id === lPending); if (l) { old = l.url; l.url = url; } }
        save(); renderLoc(); refreshAll();
        A.deleteFileIfUnused(old);
      } catch (e) {
        console.error('[NTR vn location upload]', e);
        toastr.error(e.message || 'Background upload failed', 'Visual Novel');
      }
      lFile.value = '';
    };
    const addLoc = () => {
      const inp = overlay.querySelector('#m_l_new');
      const nm = inp.value.trim();
      if (!nm) return;
      if (!A.store()) { toastr.warning('Open a character chat first. Locations are saved per character.', 'Visual Novel'); return; }
      const v = V();
      if (v.locations.some((x) => normLoc(x.name) === normLoc(nm))) { toastr.warning('That location already exists.', 'Visual Novel'); return; }
      v.locations.push({ id: newId('loc'), name: nm, url: '' });
      inp.value = '';
      save(); renderLoc(); refreshAll();
    };
    overlay.querySelector('#m_l_add').onclick = addLoc;
    overlay.querySelector('#m_l_new').onkeydown = (e) => { if (e.key === 'Enter') addLoc(); };

    renderEmo(); renderSpk(); renderLoc(); preview(); refreshPrompt();
  }

  function locRowsHtml() {
    if (!A.store()) return '<div class="cb_hint">Open a character chat first. Locations are saved per character.</div>';
    const v = V();
    const row = (id, name, url, isDef) => `
      <div class="cb_spk"><div class="cb_spk_row">
        <div class="cb_thumbbox cb_wide">${url ? `<img src="${escapeHTML(url)}" alt="">` : '<i class="fa-solid fa-image"></i>'}</div>
        ${isDef
          ? '<span class="cb_spk_name"><strong>Default background</strong><small>used when nothing matches</small></span>'
          : `<input type="text" class="text_pole m_l_name" data-id="${id}" value="${escapeHTML(name)}" style="flex:1;min-width:0;margin:0;">`}
        <button class="menu_button m_l_up" data-id="${id}" title="Upload background"><i class="fa-solid fa-upload"></i></button>
        <button class="menu_button m_l_clr" data-id="${id}" title="Remove image" ${url ? '' : 'disabled'}><i class="fa-solid fa-rotate-left"></i></button>
        ${isDef ? '' : `<button class="menu_button danger_button m_l_del" data-id="${id}" title="Delete location"><i class="fa-solid fa-trash"></i></button>`}
      </div></div>`;
    return row('__default__', '', v.locDefault, true) + v.locations.map((l) => row(escapeHTML(l.id), l.name, l.url, false)).join('');
  }

  async function uploadPortrait(f, maxDim = 768, prefix = 'vnpfp') {
    let url = await readDataURL(f);
    let converted = false;
    if (f.type !== 'image/gif') {
      const i = await loadImg(url);
      const mx = Math.max(i.width, i.height);
      if (mx > maxDim) {
        const k = maxDim / mx;
        const c = document.createElement('canvas');
        c.width = Math.round(i.width * k); c.height = Math.round(i.height * k);
        c.getContext('2d').drawImage(i, 0, 0, c.width, c.height);
        url = c.toDataURL('image/png');
        converted = true;
      }
    }
    let ext = (f.name.split('.').pop() || '').toLowerCase();
    if (converted || !['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) ext = 'png';
    const name = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
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
      + `<option value="__nar__">${escapeHTML(s.narratorWord)} (narration)</option>`
      + (V().locations.length ? `<optgroup label="Locations">${V().locations.map((l) => `<option value="__loc__${escapeHTML(l.name)}">${escapeHTML(s.locWord)}: ${escapeHTML(l.name)}</option>`).join('')}</optgroup>` : '');
    emoSel.innerHTML = '<option value="">Default emotion</option>'
      + s.emotions.map((e) => `<option value="${escapeHTML(e.name)}">${escapeHTML(e.name)}</option>`).join('');
    if ([...spkSel.options].some((o) => o.value === prevS)) spkSel.value = prevS;
    if ([...emoSel.options].some((o) => o.value === prevE)) emoSel.value = prevE;
    emoSel.disabled = spkSel.value === '__nar__' || spkSel.value.startsWith('__loc__');
  }

  function insertPickedTag() {
    const s = settings();
    const bar = document.getElementById('cb_pick');
    const ta = document.getElementById('send_textarea');
    if (!bar || !ta) return;
    const spk = bar.querySelector('#cb_pick_spk').value;
    const emo = bar.querySelector('#cb_pick_emo').value;
    const tag = spk.startsWith('__loc__')
      ? `${s.delimNarOpen}${s.locWord}:${spk.slice(7)}${s.delimNarClose}\n`
      : spk === '__nar__'
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
    bar.querySelector('#cb_pick_spk').onchange = function() { bar.querySelector('#cb_pick_emo').disabled = this.value === '__nar__' || this.value.startsWith('__loc__'); };
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
    const s = settings();
    if (chat) {
      const r = chat.getBoundingClientRect();
      const w = r.width * (s.nodeBoxWidth / 100);
      ov.style.left = (r.left + (r.width - w) / 2) + 'px';
      ov.style.width = w + 'px';
    }
    ov.style.bottom = ((form ? window.innerHeight - form.getBoundingClientRect().top : 82) + s.nodeBoxLift) + 'px';
  }

  function nodeApplyLook() {
    const ov = document.getElementById('cb_node');
    if (!ov) return;
    const s = settings();
    ov.style.setProperty('--cbn-op', s.nodeOpacity / 100);
    ov.style.setProperty('--cbn-ps', s.nodePortrait + 'px');
    ov.style.setProperty('--cbn-minh', s.nodeBoxMinH + 'px');
    ov.style.setProperty('--cbn-maxh', s.nodeBoxMaxH + 'vh');
    ov.style.setProperty('--cbn-fs', s.nodeTextScale / 100);
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
    window.addEventListener('resize', () => { placeNode(); updateStage(); });
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
    if (!seg) { ov.style.display = 'none'; setLocation(node.endLoc); updateStage(); return; }
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
    port.style.display = isChar && s.nodePortraitBox ? '' : 'none';
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
    setLocation(seg.loc);
    updateStage();
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

  function parseMsg(m) {
    const c = ctx();
    return m.is_user ? parseSegments(m.mes, m.name || c.name1, true) : parseSegments(m.mes, m.name || c.name2, false);
  }

  // Location in effect when message idx starts: the last location tag in any earlier message.
  function startLocFor(idx) {
    const s = settings();
    const c = ctx();
    const nc = reEsc(s.delimNarClose);
    const re = new RegExp(`${reEsc(s.delimNarOpen)}[ \\t]*${reEsc(s.locWord)}[ \\t]*:[ \\t]*((?:(?!${nc})[^\\n]){1,80}?)[ \\t]*${nc}`, 'gi');
    let loc = null;
    for (let i = 0; i < idx; i++) {
      const m = c.chat[i];
      if (!m || m.is_system || !m.mes) continue;
      re.lastIndex = 0;
      let mm;
      while ((mm = re.exec(m.mes))) loc = mm[1].trim();
    }
    return loc;
  }

  function nodeParseCurrent() {
    const c = ctx();
    const idx = node.list[node.pos];
    const m = c.chat[idx];
    node.prevTail = [];
    if (!m) { node.segs = []; node.endLoc = null; return; }
    let loc = startLocFor(idx);
    const segs = [];
    for (const seg of parseMsg(m)) {
      if (seg.kind === 'loc') { loc = seg.name; continue; }
      seg.loc = loc;
      segs.push(seg);
    }
    node.segs = segs;
    node.endLoc = loc;
    const prev = node.pos > 0 ? c.chat[node.list[node.pos - 1]] : null;
    if (prev) node.prevTail = parseMsg(prev).filter((x) => x.kind === 'char' && x.name).slice(-3);
  }

  // ----- Location backgrounds -----
  let locCur = '';
  function ensureLocLayer() {
    let L = document.getElementById('ntr_loc');
    if (L) return L;
    L = document.createElement('div');
    L.id = 'ntr_loc';
    L.innerHTML = '<div></div><div></div>';
    const bgs = ['bg1', 'bg_custom'].map((id) => document.getElementById(id)).filter(Boolean);
    bgs.sort((a, b) => (a.compareDocumentPosition(b) & 4 ? -1 : 1));
    const lastBg = bgs[bgs.length - 1];
    if (lastBg && lastBg.parentNode) {
      lastBg.parentNode.insertBefore(L, lastBg.nextSibling);
      const zs = bgs.map((b) => parseInt(getComputedStyle(b).zIndex, 10)).filter((z) => !Number.isNaN(z));
      if (zs.length) L.style.zIndex = String(Math.max(...zs));
    } else {
      L.style.zIndex = '-1';
      document.body.prepend(L);
    }
    return L;
  }

  function locUrl(name) {
    const v = V();
    const n = normLoc(name);
    const hit = n ? v.locations.find((l) => normLoc(l.name) === n) : null;
    return (hit && hit.url) || v.locDefault || '';
  }

  function setLocation(name) {
    const L = ensureLocLayer();
    const s = settings();
    const url = A.isOn() && s.nodeEnabled ? locUrl(name) : '';
    const [a, b] = L.children;
    if (!url) {
      L.style.display = 'none';
      locCur = '';
      a.style.opacity = '0';
      b.style.opacity = '0';
      return;
    }
    L.style.display = 'block';
    if (url === locCur) return;
    locCur = url;
    const showing = a.style.opacity === '1' ? a : b;
    const next = showing === a ? b : a;
    next.style.backgroundImage = `url("${url.replace(/"/g, '%22')}")`;
    next.style.opacity = '1';
    showing.style.opacity = '0';
  }

  // ----- Stage sprites -----
  const stageSpots = new Map();
  function ensureStage() {
    let st = document.getElementById('ntr_stage');
    if (st) return st;
    st = document.createElement('div');
    st.id = 'ntr_stage';
    st.innerHTML = ['left', 'center', 'right'].map((p) => `<img class="ntr_spr" data-spot="${p}" alt="">`).join('');
    document.body.appendChild(st);
    st.querySelectorAll('img').forEach((i) => { i.onerror = () => { i.style.display = 'none'; }; });
    return st;
  }

  function spotBoxes() {
    const W = window.innerWidth;
    const chat = document.getElementById('chat');
    const r = chat ? chat.getBoundingClientRect() : null;
    if (!r || r.left < 150) return { left: [0, W / 3], center: [W / 3, W / 3], right: [(2 * W) / 3, W / 3] };
    return { left: [0, r.left], center: [r.left, r.width], right: [r.right, Math.max(0, W - r.right)] };
  }

  function updateStage() {
    const s = settings();
    const st = ensureStage();
    if (!(A.isOn() && s.nodeEnabled && s.nodeSprites) || !node.list.length) { st.style.display = 'none'; return; }
    st.style.display = 'block';
    const cur = node.segs[node.i];
    const lines = [...(node.prevTail || []), ...node.segs.slice(0, node.i + 1)].slice(-6);
    const info = new Map();
    for (const l of lines) {
      if (l.kind !== 'char' || !l.name) continue;
      const k = l.name.toLowerCase();
      info.delete(k);
      info.set(k, { name: l.name, emo: l.emo });
    }
    const present = [...info.entries()].filter(([, p]) => spriteSrc(p.name, p.emo)).slice(-3);
    const persona = String(ctx().name1 || '').toLowerCase();
    for (const k of [...stageSpots.keys()]) if (!info.has(k) || !present.some(([pk]) => pk === k)) stageSpots.delete(k);
    const used = new Set(stageSpots.values());
    const personaIn = present.some(([k]) => k === persona);
    for (const [k] of present) {
      if (stageSpots.has(k)) continue;
      const pref = k === persona ? ['right', 'center', 'left'] : personaIn ? ['left', 'center', 'right'] : ['left', 'right', 'center'];
      const spot = pref.find((x) => !used.has(x));
      if (spot) { stageSpots.set(k, spot); used.add(spot); }
    }
    const boxes = spotBoxes();
    const scale = (s.nodeSpriteScale || 100) / 100;
    st.querySelectorAll('img').forEach((img) => {
      const spot = img.dataset.spot;
      const who = [...stageSpots.entries()].find(([, v]) => v === spot);
      const p = who ? info.get(who[0]) : null;
      const src = p ? spriteSrc(p.name, p.emo) : null;
      if (!src) { img.style.display = 'none'; return; }
      if (img.getAttribute('src') !== src) img.src = src;
      const [x, w] = boxes[spot];
      Object.assign(img.style, { display: 'block', left: x + 'px', width: w + 'px', transform: `scale(${scale})` });
      const active = cur && cur.kind === 'char' && cur.name.toLowerCase() === who[0];
      img.classList.toggle('ntr_dim', !active);
    });
  }

  // ----- Auto-injected tag instructions (rides along with the normal request) -----
  const INJECT_KEY = 'ntr_vn_tags';
  function updateInjection() {
    const c = ctx();
    if (typeof c.setExtensionPrompt !== 'function') return;
    const s = settings();
    const on = A.isOn() && s.nodeEnabled && s.nodeInject;
    try { c.setExtensionPrompt(INJECT_KEY, on ? buildPrompt(s) : '', 1, 1, false, 0); } catch (e) { console.error('[NTR] Could not set the tag instructions', e); }
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
    if (!s.nodeEnabled || !A.isOn()) { nodeStopTyping(); ov.style.display = 'none'; node.list = []; setLocation(null); updateStage(); return; }
    const c = ctx();
    node.list = [];
    (c.chat || []).forEach((m, i) => {
      if (m.is_system || !m.mes) return;
      if (m.is_user && !s.nodeUserMsgs) return;
      node.list.push(i);
    });
    if (!node.list.length) { nodeStopTyping(); ov.style.display = 'none'; setLocation(null); updateStage(); return; }
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
    updateInjection();
    if (A.refreshFg) A.refreshFg();
  }

  function teardown() {
    applyStyle();
    nodeStopTyping();
    const ov = document.getElementById('cb_node');
    if (ov) ov.style.display = 'none';
    document.getElementById('cb_pick')?.remove();
    node.list = [];
    setLocation(null);
    updateStage();
    updateInjection();
    syncNodeToggle();
    if (A.refreshFg) A.refreshFg();
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
