// Nitwit Tavern Redesign: Cast module. The emotion list, speakers, and each speaker's faces and full body; with Visual
// Novel Mode off, faces on chat avatars and a stage behind the chat. It also owns the tag symbols and hides tags in the chat.
// Loaded by index.js whenever NTR is on, and before vn.js, which draws the same pictures in Visual Novel Mode.
// If this file breaks, the rest of the extension keeps working.
(() => {
  const CAST_VERSION = '2.42.0';
  const A = window.NTR && window.NTR.api;
  if (!A) { console.error('[NTR] cast.js loaded without the core (index.js).'); return; }
  const { ctx, save, settings, escapeHTML, askImageUrl, uploadImage, newId, media, pills, onPills, subHead, validateDelims } = A;
  const TAG = A.TAG || '';
  const lc = (x) => String(x || '').trim().toLowerCase();

  // A speaker's pictures live in the card's Visual Novel data (or per group): emoImgs holds the faces (speaker, then
  // emotion id), sprites the full bodies (one per speaker). The names stay as they are so saved cards keep working.
  const CDEF = () => ({ avatars: Object.create(null), sprites: Object.create(null), emoImgs: Object.create(null), customSpk: [], hiddenSpk: [] });
  function D() {
    const st = A.store();
    if (!st) return CDEF();
    if (!st.vn || typeof st.vn !== 'object') st.vn = {};
    const d = CDEF();
    for (const k of Object.keys(d)) if (st.vn[k] === undefined) st.vn[k] = d[k];
    if (Object.keys(st.vn.avatars).length) mergeOldFaces(st.vn);
    return st.vn;
  }

  // Speakers used to have a separate face picture next to their emotion images. The face is the emotion images now:
  // a speaker who has emotion images loses the old copy (file included); one who has none gets it as their default emotion.
  function mergeOldFaces(v) {
    const s = settings();
    const olds = [];
    for (const k of Object.keys(v.avatars)) {
      const u = v.avatars[k];
      delete v.avatars[k];
      if (!u) continue;
      const imgs = v.emoImgs[k];
      if (imgs && s.emotions.some((e) => imgs[e.id])) { olds.push(u); continue; }
      if (!v.emoImgs[k]) v.emoImgs[k] = Object.create(null);
      v.emoImgs[k][s.emoDefault] = u;
    }
    save();
    setTimeout(() => olds.forEach((u) => A.deleteFileIfUnused(u)), 0);
  }

  // Something here changed (an emotion, a speaker, a picture, the tags): the chat and vn.js redraw.
  const listeners = [];
  const changed = () => {
    beats.clear();
    updateInjection();
    schedule();
    listeners.forEach((fn) => { try { fn(); } catch (e) { console.error('[NTR]', e); } });
  };

  // ----- Tags, with the symbols from Tags & Delimiters: ((Name%%Emotion)) for speakers, [[...]] for the rest -----
  const reEsc = (x) => String(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // A speaker tag is group 1, anything inside the narrator delimiters (narration, scene tags) group 2.
  function tagRe(s) {
    const so = reEsc(s.delimSpkOpen), sc = reEsc(s.delimSpkClose), no = reEsc(s.delimNarOpen), nc = reEsc(s.delimNarClose);
    return new RegExp(`${so}[ \\t]*((?:(?!${sc})[^\\n]){1,80}?)[ \\t]*${sc}[ \\t]*:?|${no}[ \\t]*((?:(?!${nc})[^\\n]){1,400}?)[ \\t]*${nc}[ \\t]*:?`, 'g');
  }
  function splitTag(inner, s) {
    const sep = s.delimEmo;
    const i = sep ? inner.indexOf(sep) : -1;
    if (i < 0) return { name: inner.trim(), emo: '' };
    return { name: inner.slice(0, i).trim(), emo: inner.slice(i + sep.length).trim() };
  }
  // [[Emotion:Happy]]: the emotion of the character who wrote the message.
  function emoTagRe(s) {
    const no = reEsc(s.delimNarOpen), nc = reEsc(s.delimNarClose);
    return new RegExp(`${no}[ \\t]*${reEsc(s.emoWord)}[ \\t]*:[ \\t]*((?:(?!${nc})[^\\n]){1,80}?)[ \\t]*${nc}[ \\t]*`, 'gi');
  }
  // The text without its Emotion tags, and the last one's emotion (the last tag wins).
  function stripEmo(raw) {
    let emo = '';
    const text = String(raw || '').replace(emoTagRe(settings()), (_, e) => { emo = e.trim(); return ''; });
    return { text, emo };
  }

  // ----- Who is on stage: shared by the stage behind the chat and Visual Novel Mode's stage -----
  // Speaking adds a character; Enter/Exit tags add or remove one explicitly. Until a chat uses an Enter or Exit tag,
  // `explicit` stays false and the stage keeps following recent speakers.
  const castNew = () => ({ explicit: false, list: [] });
  function castStep(st, seg) {
    if (seg.kind === 'enter') {
      const [nm, sp] = String(seg.name).split('|').map((x) => x.trim());
      const key = lc(nm);
      if (!key) return;
      const spot = ['left', 'center', 'right'].includes(lc(sp)) ? lc(sp) : '';
      st.list = st.list.filter((x) => x.key !== key);
      st.list.push({ key, name: nm, spot });
      st.explicit = true;
    } else if (seg.kind === 'exit') {
      const key = lc(seg.name);
      st.list = key === 'all' ? [] : st.list.filter((x) => x.key !== key);
      st.explicit = true;
    } else if (seg.kind === 'char' && seg.name) {
      const key = lc(seg.name);
      if (!st.list.some((x) => x.key === key)) st.list.push({ key, name: seg.name, spot: '' });
    }
  }
  // Left of the chat column, the column itself, and right of it. A narrow screen splits into thirds.
  function spotBoxes() {
    const W = window.innerWidth;
    const chat = document.getElementById('chat');
    const r = chat ? chat.getBoundingClientRect() : null;
    if (!r || r.left < 150) return { left: [0, W / 3], center: [W / 3, W / 3], right: [(2 * W) / 3, W / 3] };
    return { left: [0, r.left], center: [r.left, r.width], right: [r.right, Math.max(0, W - r.right)] };
  }
  // Gives each speaker on stage a spot and keeps it while they stay. A spot from an Enter tag wins; your persona
  // prefers the right, everyone else the left.
  function pickSpots(spots, present, wanted) {
    const persona = lc(ctx().name1);
    for (const k of [...spots.keys()]) if (!present.includes(k)) spots.delete(k);
    for (const [k, sp] of wanted) if (sp && spots.has(k) && spots.get(k) !== sp) spots.delete(k);
    const used = new Set(spots.values());
    const personaIn = present.includes(persona);
    for (const k of present) {
      if (spots.has(k)) continue;
      const pref = wanted.get(k) ? [wanted.get(k), 'center', 'left', 'right'] : k === persona ? ['right', 'center', 'left'] : personaIn ? ['left', 'center', 'right'] : ['left', 'right', 'center'];
      const spot = pref.find((x) => !used.has(x));
      if (spot) { spots.set(k, spot); used.add(spot); }
    }
  }

  // ----- Pictures -----
  function userAvatarSrc() {
    const img = document.querySelector('#chat .mes[is_user="true"] .avatar img');
    if (img && img.getAttribute('src')) return A.fullResUrl(img.getAttribute('src'));
    const sel = document.querySelector('#user_avatar_block .avatar-container.selected');
    const id = sel && (sel.getAttribute('data-avatar-id') || sel.getAttribute('imgfile'));
    return id ? `/User%20Avatars/${encodeURIComponent(id)}` : null;
  }

  // The speaker's default emotion face, or their first face in list order.
  function defaultFace(key) {
    const s = settings();
    const imgs = D().emoImgs[key] || {};
    if (imgs[s.emoDefault]) return imgs[s.emoDefault];
    const e = s.emotions.find((x) => imgs[x.id]);
    return e ? imgs[e.id] : '';
  }

  // Picture from SillyTavern itself: {{user}} gets the active persona, anyone else a card in this chat with that name.
  // Only cards in the open chat count, so an unrelated card in the library that shares the name never leaks in.
  function stAvatar(key) {
    const c = ctx();
    if (c.name1 && c.name1.toLowerCase() === key) { const u = userAvatarSrc(); return u ? { src: u, from: 'persona' } : null; }
    let cards = [];
    if (c.groupId) {
      const g = (c.groups || []).find((x) => x.id === c.groupId);
      cards = (g?.members || []).map((av) => (c.characters || []).find((x) => x.avatar === av));
    } else if (c.characterId !== undefined && c.characterId !== null) cards = [c.characters?.[c.characterId]];
    const ch = cards.find((x) => x && x.name && x.name.toLowerCase() === key);
    if (ch && ch.avatar) return { src: `/characters/${encodeURIComponent(ch.avatar)}`, from: 'card' };
    return null;
  }

  // Base face: default face > first face > persona > character card in this chat
  function baseFace(name) {
    const key = lc(name);
    if (!key) return null;
    const emo = media(defaultFace(key));
    if (emo) return emo;
    return stAvatar(key)?.src || null;
  }

  function findEmo(name) {
    const k = lc(name);
    return k ? settings().emotions.find((e) => e.name.toLowerCase() === k) : null;
  }

  // Face for an emotion > default face > base face > nothing (null)
  function faceSrc(name, emoName) {
    const s = settings();
    const imgs = D().emoImgs[lc(name)] || {};
    const e = findEmo(emoName);
    if (e && imgs[e.id]) return media(imgs[e.id]) || null;
    if (imgs[s.emoDefault]) return media(imgs[s.emoDefault]) || null;
    return baseFace(name);
  }

  // Stage picture: the full body wins. Otherwise the faces, never card or persona avatars. With Keep the face on, the
  // stage keeps the base face whatever the emotion. Nothing found is null (Visual Novel Mode puts its silhouette there).
  function bodySrc(name, emoName) {
    const s = settings();
    const v = D();
    const key = lc(name);
    if (v.sprites[key]) return media(v.sprites[key]) || null;
    if (s.nodeSpriteBase) return baseFace(name);
    const imgs = v.emoImgs[key] || {};
    const e = findEmo(emoName);
    return media((e && imgs[e.id]) || defaultFace(key)) || null;
  }

  // Files deleted by hand leave dead links behind. Each uploaded file is checked once per session; links to missing ones are dropped.
  const fileOk = new Map();
  function fileExists(u) {
    const p = String(u || '').trim();
    if (!/^\/?user\/files\//.test(p)) return Promise.resolve(true);
    if (!fileOk.has(p)) fileOk.set(p, fetch(p, { method: 'HEAD', cache: 'no-store' }).then((r) => r.status !== 404).catch(() => true));
    return fileOk.get(p);
  }
  async function pruneMissing() {
    const v = D();
    const refs = [];
    const scan = (obj) => { for (const [k, u] of Object.entries(obj || {})) if (typeof u === 'string') refs.push([obj, k, u]); };
    scan(v.sprites);
    Object.values(v.emoImgs).forEach(scan);
    const ok = await Promise.all(refs.map((r) => fileExists(r[2])));
    if (D() !== v) return 0;
    let n = 0;
    refs.forEach(([obj, k, u], i) => { if (!ok[i] && obj[k] === u) { delete obj[k]; n++; } });
    return n;
  }

  // ----- Speakers: the card, persona, custom ones, and anyone tagged in the chat -----
  function speakers() {
    const s = settings();
    const c = ctx();
    const map = new Map();
    const nar = lc(s.narratorWord);
    const hidden = new Set((D().hiddenSpk || []).map(lc));
    const add = (n, custom) => {
      const t = String(n || '').trim();
      const k = t.toLowerCase();
      if (!t || k === nar) return;
      if (!custom && (!s.nodeAutoSpk || hidden.has(k))) return;
      if (!map.has(k)) map.set(k, { key: k, name: t, custom: !!custom });
      else if (custom) map.get(k).custom = true;
    };
    add(c.name1);
    if (c.groupId) {
      const g = (c.groups || []).find((x) => x.id === c.groupId);
      (g?.members || []).forEach((av) => { const ch = (c.characters || []).find((x) => x.avatar === av); if (ch) add(ch.name); });
    } else if (c.characterId !== undefined && c.characterId !== null) add(c.name2);
    (D().customSpk || []).forEach((n) => add(n, true));
    if (s.nodeAutoSpk) {
      const re = tagRe(s);
      for (const m of c.chat || []) {
        if (m.is_system) continue;
        re.lastIndex = 0;
        let t;
        while ((t = re.exec(String(m.mes || '')))) if (t[1] !== undefined) add(splitTag(t[1], s).name);
      }
    }
    return [...map.values()];
  }

  // ----- The chat with Visual Novel Mode off: faces on chat avatars, the stage behind the chat -----
  // A message's speakers and stage tags, in order. Its writer speaks first, with the message's emotion: the last
  // Emotion tag or speaker tag with their own name that gives one. Kept per message until its text changes.
  const beats = new Map();
  function msgInfo(m, i) {
    const text = String(m.mes || ''), name = String(m.name || '');
    const had = beats.get(i);
    if (had && had.text === text && had.name === name) return had;
    const s = settings();
    const author = lc(name);
    const list = [{ kind: 'char', name, emo: '' }];
    let emo = '';
    const re = tagRe(s);
    let t;
    while ((t = re.exec(text))) {
      if (t[1] !== undefined) {
        const sp = splitTag(t[1], s);
        list.push({ kind: 'char', name: sp.name, emo: sp.emo });
        if (sp.emo && lc(sp.name) === author) emo = sp.emo;
        continue;
      }
      const inner = String(t[2]);
      const c = inner.indexOf(':');
      if (c <= 0) continue;
      const word = lc(inner.slice(0, c)), arg = inner.slice(c + 1).trim();
      if (!arg) continue;
      if (word === lc(s.emoWord)) emo = arg;
      else if (word === lc(s.enterWord)) list.push({ kind: 'enter', name: arg });
      else if (word === lc(s.exitWord)) list.push({ kind: 'exit', name: arg });
    }
    // The writer has one emotion per message, the same for their avatar and the stage.
    for (const b of list) if (b.kind === 'char' && lc(b.name) === author) b.emo = emo;
    const info = { text, name, emo, beats: list };
    beats.set(i, info);
    return info;
  }

  const hasFaces = (key) => { const imgs = D().emoImgs[key] || {}; return settings().emotions.some((e) => imgs[e.id]); };

  // Faces: each message's avatar shows its writer's face for that message's emotion, or their main face without a tag.
  // Speakers without faces keep SillyTavern's picture. SillyTavern puts its own picture back when it redraws a message,
  // so this runs again after every redraw; the original is kept on the picture to put back when faces go off.
  let facesShown = false;
  function drawFaces() {
    const s = settings();
    const on = A.isOn() && s.emoFaces && !!A.store();
    if (!on && !facesShown) return;
    facesShown = on;
    const chat = ctx().chat || [];
    let swapped = false;
    document.querySelectorAll('#chat .mes[mesid]').forEach((mes) => {
      const img = mes.querySelector('.avatar img');
      if (!img) return;
      const cur = img.getAttribute('src') || '';
      const mine = !!img.dataset.ntrFace && cur === img.dataset.ntrFace;
      let want = null;
      if (on) {
        const i = Number(mes.getAttribute('mesid'));
        const m = chat[i];
        if (m && !m.is_system && m.name && hasFaces(lc(m.name))) want = faceSrc(m.name, msgInfo(m, i).emo);
      }
      if (want) {
        if (cur === want) return;
        img.dataset.ntrOrig = mine ? img.dataset.ntrOrig : cur;
        img.dataset.ntrFace = want;
        img.src = want;
        swapped = true;
      } else if (img.dataset.ntrFace) {
        if (mine && img.dataset.ntrOrig) img.src = img.dataset.ntrOrig;
        delete img.dataset.ntrFace;
        delete img.dataset.ntrOrig;
        swapped = true;
      }
    });
    // Pop Out copies the newest avatar, which only happens when messages are added; a changed face is caught up here.
    if (swapped) A.syncPopouts?.();
  }

  // The stage behind the chat: full bodies (or faces) of the last speakers, left, center and right, between the
  // background and the chat. The last one to speak is lit. Off while Visual Novel Mode is on: it has its own stage.
  const spots = new Map();
  function drawStage() {
    const s = settings();
    let el = document.getElementById('ntr_cast_stage');
    const on = A.isOn() && s.emoStage && !s.nodeEnabled && !!A.store();
    if (!on) { if (el) el.style.display = 'none'; spots.clear(); return; }
    if (!el) {
      el = document.createElement('div');
      el.id = 'ntr_cast_stage';
      el.innerHTML = ['left', 'center', 'right'].map((p) => `<img class="ntr_cast_spr" data-spot="${p}" alt="">`).join('');
      el.querySelectorAll('img').forEach((i) => { i.onerror = () => { i.style.display = 'none'; }; });
      document.body.appendChild(el);
    }
    const st = castNew();
    const recent = [];
    // In Reader Mode the stage follows the page being read: nothing after its last message counts.
    const upTo = window.NTR.reader?.upTo?.();
    (ctx().chat || []).forEach((m, i) => {
      if (!m || m.is_system || !m.mes || (upTo != null && i > upTo)) return;
      for (const b of msgInfo(m, i).beats) { castStep(st, b); if (b.kind === 'char' && b.name) recent.push(b); }
    });
    const info = new Map();
    for (const b of recent.slice(-6)) { const k = lc(b.name); info.delete(k); info.set(k, { name: b.name, emo: b.emo }); }
    const wanted = new Map();
    let present;
    if (st.explicit) {
      for (const c of st.list) { if (!info.has(c.key)) info.set(c.key, { name: c.name, emo: '' }); wanted.set(c.key, c.spot); }
      present = st.list.map((c) => c.key);
    } else present = [...info.keys()];
    present = present.filter((k) => bodySrc(info.get(k).name, info.get(k).emo)).slice(-3);
    pickSpots(spots, present, wanted);
    const last = recent.length ? lc(recent[recent.length - 1].name) : '';
    const boxes = spotBoxes();
    const scale = A.rangeNum(s, 'emoStageScale') / 100;
    el.style.opacity = String(A.rangeNum(s, 'emoStageOpacity') / 100);
    el.style.display = 'block';
    el.querySelectorAll('img').forEach((img) => {
      const spot = img.dataset.spot;
      const who = [...spots.entries()].find(([, v]) => v === spot);
      const p = who ? info.get(who[0]) : null;
      const src = p ? bodySrc(p.name, p.emo) : null;
      if (!src) { img.style.display = 'none'; return; }
      if (img.getAttribute('src') !== src) img.src = src;
      const [x, w] = boxes[spot];
      Object.assign(img.style, { display: 'block', left: x + 'px', width: w + 'px', transform: `scale(${scale})` });
      img.classList.toggle('ntr_dim', who[0] !== last);
    });
  }

  // Many changes in a row (a reply streaming in) draw once, before the next frame.
  let drawQ = 0;
  function schedule() {
    if (drawQ) return;
    drawQ = requestAnimationFrame(() => {
      drawQ = 0;
      try { drawFaces(); drawStage(); } catch (e) { console.error('[NTR] emotions', e); }
    });
  }

  // ----- Hiding tags in the chat: the emotion part of speaker tags, Emotion tags and scene tags -----
  // A reply being written can end partway through a tag; that part is hidden too until the reply is done.
  let writing = false;
  function cleanTags(els) {
    const s = settings();
    if (!A.isOn() || !s.nodeHideEmo) return;
    const live = writing && document.querySelector('#chat .mes.last_mes .mes_text');
    // Only messages that hold a tag are worth a closer look. A reply being written also counts if it has an open
    // speaker tag, since its emotion part may be only half written.
    const has = (t, d) => !!d && t.includes(d);
    const todo = [...(els || document.querySelectorAll('#chat .mes_text'))].filter((el) => {
      const t = el.textContent;
      return has(t, s.delimEmo) || has(t, s.delimNarOpen) || (el === live && has(t, s.delimSpkOpen));
    });
    if (!todo.length) return;
    const so = reEsc(s.delimSpkOpen), sc = reEsc(s.delimSpkClose), no = reEsc(s.delimNarOpen), nc = reEsc(s.delimNarClose);
    const emo = s.delimEmo ? reEsc(s.delimEmo) : '';
    const emoRe = emo ? new RegExp(`(${so}(?:(?!${sc})[^\\n]){0,60}?)[ \\t]*${emo}(?:(?!${sc})[^\\n]){0,60}?(${sc})`, 'g') : null;
    const dirWords = [s.emoWord, s.locWord, s.effectWord, s.weatherWord, s.cgWord, s.enterWord, s.exitWord].filter(Boolean).map(reEsc).join('|');
    const locRe = new RegExp(`${no}[ \\t]*(?:${dirWords})[ \\t]*:[ \\t]*(?:(?!${nc})[^\\n]){0,200}?[ \\t]*${nc}[ \\t]*`, 'gi');
    // ((Rafe%%Sa, ((Rafe% or [[Location:Fo at the end of a reply being written.
    const emoStart = emo ? [...Array(s.delimEmo.length).keys()].map((i) => reEsc(s.delimEmo.slice(0, i + 1))).reverse().join('|') : '';
    const openEmoRe = emo ? new RegExp(`(${so}(?:(?!${sc})[^\\n]){0,60}?)[ \\t]*(?:${emo}(?:(?!${sc})[^\\n]){0,60}|${emoStart})$`) : null;
    const openLocRe = new RegExp(`${no}[ \\t]*(?:${dirWords})[ \\t]*:[ \\t]*(?:(?!${nc})[^\\n]){0,200}[ \\t]*$`, 'i');
    for (const el of todo) {
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let n, last = null;
      while ((n = w.nextNode())) {
        if (n.parentElement?.closest('textarea')) continue;
        if (n.nodeValue.trim()) last = n;
        let val = n.nodeValue;
        if (emoRe && val.includes(s.delimEmo)) val = val.replace(emoRe, '$1$2');
        if (val.includes(s.delimNarOpen)) val = val.replace(locRe, '');
        if (val !== n.nodeValue) n.nodeValue = val;
      }
      if (el !== live || !last) continue;
      let val = last.nodeValue;
      if (openEmoRe) val = val.replace(openEmoRe, '$1');
      val = val.replace(openLocRe, '');
      if (val !== last.nodeValue) last.nodeValue = val;
    }
  }

  let chatObs = null, cleanT = null;
  function ensure() {
    const chat = document.getElementById('chat');
    if (!chat || !window.MutationObserver || (chatObs && chatObs._el === chat)) return;
    if (chatObs) chatObs.disconnect();
    // The messages that changed are cleaned right away, before the browser draws them, so a reply that streams in
    // never shows its tags. A full pass after the chat goes quiet catches anything else.
    chatObs = new MutationObserver((recs) => {
      const els = new Set();
      for (const r of recs) {
        const t = r.target.nodeType === 1 ? r.target : r.target.parentElement;
        const m = t && t.closest('.mes_text');
        if (m) { els.add(m); continue; }
        for (const a of r.addedNodes) {
          if (a.nodeType !== 1) continue;
          if (a.matches('.mes_text')) els.add(a);
          a.querySelectorAll('.mes_text').forEach((e) => els.add(e));
        }
      }
      if (els.size) cleanTags([...els].filter((e) => chat.contains(e)));
      clearTimeout(cleanT); cleanT = setTimeout(() => cleanTags(), 120);
      schedule();
    });
    chatObs.observe(chat, { childList: true, subtree: true, characterData: true });
    chatObs._el = chat;
    cleanTags();
  }

  // ----- The tag instructions for the model, while faces or the stage are on and Visual Novel Mode is off -----
  const INJECT_KEY = 'ntr_emo';
  const promptText = (s) => `End every reply with ${s.delimNarOpen}${s.emoWord}:Name${s.delimNarClose} for the emotion of the character speaking, using one of: ${s.emotions.map((e) => e.name).join(', ')}.`;
  function updateInjection() {
    const c = ctx();
    if (typeof c.setExtensionPrompt !== 'function') return;
    const s = settings();
    const on = A.isOn() && !s.nodeEnabled && s.emoSource === 'tags' && s.emoInject && (s.emoFaces || s.emoStage);
    try { c.setExtensionPrompt(INJECT_KEY, on ? promptText(s) : '', 1, 1, false, 0); } catch (e) { console.error('[NTR] Could not set the emotion instructions', e); }
  }

  // A new chat, NTR switched on, or Visual Novel Mode switched on or off. SillyTavern clears extension prompts when a
  // chat opens, so the instructions are set again here.
  function refresh() {
    beats.clear();
    ensure();
    updateInjection();
    cleanTags();
    schedule();
  }
  function teardown() {
    updateInjection();
    drawFaces();
    drawStage();
  }

  // ----- Menu: the Emotions part of the Avatars page -----
  const spkOpen = new Set();

  function thumbBox(src) {
    src = media(src);
    return `<div class="cb_thumbbox">${src ? `<img src="${escapeHTML(src)}" alt="">` : '<i class="fa-solid fa-user"></i>'}</div>`;
  }

  function spkRowsHtml(s) {
    if (!A.store()) return '<div class="cb_hint">Open a character chat first. Speakers and their pictures are saved per character.</div>';
    const list = speakers();
    const nHidden = (D().hiddenSpk || []).length;
    const restore = nHidden ? `<div class="cb_hint"><a href="#" class="m_spk_unhide">Restore ${nHidden} hidden speaker${nHidden === 1 ? '' : 's'}</a></div>` : '';
    if (!list.length) return `<div class="cb_hint">No speakers yet. Add one below${s.nodeAutoSpk ? ', or they show up once tagged in the chat' : ''}.</div>${restore}`;
    return list.map(({ key, name, custom }) => {
      const base = baseFace(name);
      const stPic = stAvatar(key);
      const faceEmo = (() => { const im = D().emoImgs[key] || {}; return s.emotions.find((e) => e.id === s.emoDefault && im[e.id]) || s.emotions.find((e) => im[e.id]); })();
      const n = s.emotions.length;
      const full = D().sprites[key];
      const imgs = D().emoImgs[key] || {};
      const cnt = s.emotions.filter((e) => imgs[e.id]).length;
      const open = spkOpen.has(key);
      const k = escapeHTML(key);
      const grid = !open ? '' : `<div class="cb_emo_grid">${s.emotions.map((e) => {
        const src = imgs[e.id];
        const id = escapeHTML(e.id);
        return `<div class="cb_emo_cell">
            ${thumbBox(src)}
            <div class="cb_emo_label">${escapeHTML(e.name)}${e.id === s.emoDefault ? ' ★' : ''}</div>
            <div style="display:flex;gap:4px;">
              <button class="menu_button m_spk_up" data-key="${k}" data-emo="${id}" title="Upload ${escapeHTML(e.name)}"><i class="fa-solid fa-upload"></i></button>
              <button class="menu_button m_spk_url" data-key="${k}" data-emo="${id}" title="Use a link for ${escapeHTML(e.name)}"><i class="fa-solid fa-link"></i></button>
              <button class="menu_button danger_button m_spk_clr" data-key="${k}" data-emo="${id}" title="Clear" ${src ? '' : 'disabled'}><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>`;
      }).join('')}</div>`;
      const facesTxt = cnt ? `${cnt} of ${n} uploaded${faceEmo ? ` · main: ${faceEmo.name}` : ''}` : `none yet${stPic ? `: using the ${stPic.from} picture` : ''}`;
      return `<div class="cb_spk">
        <div class="cb_spk_row cb_spk_head">
          <span class="cb_spk_name">${escapeHTML(name)}</span>
          <button class="menu_button danger_button m_spk_rm" data-key="${k}" data-custom="${custom ? '1' : ''}" title="${custom ? 'Remove speaker' : 'Hide speaker (restorable)'}"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="cb_spk_row cb_faces_row m_spk_exp" data-key="${k}" role="button" tabindex="0" aria-expanded="${open}" title="${open ? 'Close' : 'Open'} faces">
          ${thumbBox(base)}
          <span class="cb_spk_name">Faces<small>${escapeHTML(facesTxt)}</small></span>
          <i class="fa-solid fa-chevron-${open ? 'down' : 'right'}"></i>
        </div>
        ${grid}
        <div class="cb_spk_row cb_full_row">
          ${thumbBox(full)}
          <span class="cb_spk_name">Full Body<small>${full ? 'used on stage for every emotion' : 'none: the stage uses the faces'}</small></span>
          <button class="menu_button m_spk_up" data-key="${k}" data-emo="" data-full="1" title="Upload full body (stage picture)"><i class="fa-solid fa-upload"></i></button>
          <button class="menu_button m_spk_url" data-key="${k}" data-emo="" data-full="1" title="Use a link for the full body"><i class="fa-solid fa-link"></i></button>
          <button class="menu_button danger_button m_spk_clr" data-key="${k}" data-emo="" data-full="1" title="Remove full body" ${full ? '' : 'disabled'}><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`;
    }).join('') + restore;
  }

  function emoRowsHtml(s) {
    return s.emotions.map((e) => {
      const id = escapeHTML(e.id);
      const isDef = e.id === s.emoDefault;
      return `<div class="cb_emo_row">
        <label class="cb_defdot" title="Use as default"><input type="radio" name="cbr_emodef" value="${id}" ${isDef ? 'checked' : ''}></label>
        <input type="text" class="text_pole m_emo_name" data-id="${id}" value="${escapeHTML(e.name)}" style="flex:1;min-width:0;margin:0;">
        <button class="menu_button danger_button m_emo_del" data-id="${id}" title="${isDef ? 'Pick a different default before deleting this one' : 'Delete emotion'}" ${isDef ? 'disabled' : ''}><i class="fa-solid fa-trash"></i></button>
      </div>`;
    }).join('');
  }

  // Stays usable with NTR Avatars switched off (ntr_keepon): faces are for SillyTavern's own avatars too.
  function partHtml(s) {
    const ck = (id, on, label) => `<label class="checkbox_label"><input type="checkbox" id="${id}" ${on ? 'checked' : ''}><span>${label}</span></label>`;
    const sl = (key, label) => {
      const [, , , unit] = A.numRange(key);
      const v = A.rangeNum(s, key);
      return `<div class="cb_row" style="margin-top:8px;"><label>${label}</label><span><span id="m_emo_${key}val">${v}</span>${unit}</span></div>
          <input type="range" class="m_emo_sl" data-key="${key}" ${A.rangeAttrs(key)} value="${v}">`;
    };
    const df = (key, label) => `<label class="cb_dfield"><span>${label}</span><input type="text" class="text_pole m_d_in" data-key="${key}" value="${escapeHTML(s[key])}" maxlength="16"></label>`;
    const tag = escapeHTML(`${s.delimNarOpen}${s.emoWord}:Happy${s.delimNarClose}`);
    return `<div class="ntr_keepon">
      ${subHead('av_emo', 'Emotions')}
      <div class="cb_collapse_content">
        <div class="cb_hint">Each speaker's face per emotion, and a full body for the stage. Visual Novel Mode uses them, and with it off they can show in the chat.</div>
        <div><strong>Emotion source:</strong>${pills('emosrc', [['tags', 'Tags'], ['agent', 'Agent (coming later)', 'An agent will read each reply and pick the emotion. Not ready yet.']], s.emoSource === 'agent' ? 'agent' : 'tags')}</div>
        ${subHead('av_chat', 'In the Chat')}
        <div class="cb_collapse_content">
          <div class="cb_hint">For the chat with Visual Novel Mode off. A message's emotion comes from <code>${tag}</code>, or from a speaker tag with the writer's name. Without one, the speaker's main face shows.</div>
          ${ck('m_emo_faces', s.emoFaces, 'Faces on chat avatars: each message shows its writer\'s face for that message\'s emotion')}
          ${ck('m_emo_stage', s.emoStage, 'Stage behind the chat: the last speakers\' full bodies, left, center and right')}
          <div id="m_emo_stagebody" class="${s.emoStage ? '' : 'cb_dim'}">
            ${sl('emoStageScale', 'Stage size:')}
            ${sl('emoStageOpacity', 'Stage opacity:')}
          </div>
          <div style="margin-top:8px;">${ck('m_emo_keepface', s.nodeSpriteBase, 'Stages keep the main face instead of changing with the emotion (also in Visual Novel Mode)')}</div>
          ${ck('m_emo_hide', s.nodeHideEmo, 'Hide emotion and scene tags in the chat')}
          ${ck('m_emo_inj', s.emoInject, 'Ask the model for the Emotion tag in every request while faces or the stage are on')}
          <div class="cb_hint">The stage hides while Visual Novel Mode is on, which has its own. It sends its own instructions then too.</div>
        </div>
        ${subHead('av_emo_list', 'Emotion List')}
        <div class="cb_collapse_content">
          <div class="cb_hint">The dot marks the default. It's used when a tag has no emotion, or one that isn't on this list.</div>
          <div id="m_emo_list"></div>
          <div class="cb_row" style="margin-top:6px;">
            <input type="text" id="m_emo_new" class="text_pole" placeholder="New emotion" style="flex:1;margin:0;">
            <button id="m_emo_add" class="menu_button" style="margin:0;"><i class="fa-solid fa-plus"></i> Add</button>
          </div>
        </div>
        ${subHead('av_spk', 'Speakers ' + TAG)}
        <div class="cb_collapse_content">
          <div class="cb_hint">Character cards and your persona are matched by name automatically. Open a speaker's faces with the arrow to give them a picture per emotion. The narrator never gets a picture.</div>
          <label class="checkbox_label"><input type="checkbox" id="m_spk_auto" ${s.nodeAutoSpk ? 'checked' : ''}><span>Auto-add speakers from the card, persona and chat</span></label>
          <div id="m_spk_list"></div>
          <div class="cb_row" style="margin-top:8px;">
            <input type="text" id="m_spk_new" class="text_pole" placeholder="Add a speaker (e.g. an NPC)" style="flex:1;margin:0;">
            <button id="m_spk_add" class="menu_button" style="margin:0;"><i class="fa-solid fa-user-plus"></i> Add</button>
          </div>
          <input type="file" id="m_spk_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
        </div>
        ${subHead('av_tags', 'Tags & Delimiters (change the symbols)')}
        <div class="cb_collapse_content">
          <div class="cb_hint">The symbols and keywords for every tag, for emotions and for Visual Novel Mode.</div>
          <div class="cb_dgrid">
            ${df('delimSpkOpen', 'Speaker open')}${df('delimSpkClose', 'Speaker close')}
            ${df('delimNarOpen', 'Narrator open')}${df('delimNarClose', 'Narrator close')}
            ${df('delimEmo', 'Emotion separator')}${df('narratorWord', 'Narrator keyword')}
            ${df('emoWord', 'Emotion keyword')}${df('locWord', 'Location keyword')}
          </div>
          <div class="cb_sub">Scene keywords</div>
          <div class="cb_dgrid">
            ${df('choiceWord', 'Choice keyword')}${df('choiceSep', 'Choice separator')}
            ${df('effectWord', 'Effect keyword')}${df('weatherWord', 'Weather keyword')}
            ${df('fxShake', 'Effect: shake')}${df('fxFlash', 'Effect: flash')}
            ${df('fxFade', 'Effect: fade')}${df('cgWord', 'CG keyword')}
            ${df('wxRain', 'Weather: rain')}${df('wxSnow', 'Weather: snow')}
            ${df('wxClear', 'Weather: clear')}${df('enterWord', 'Enter keyword')}
            ${df('exitWord', 'Exit keyword')}
          </div>
          <div id="m_d_preview" class="cb_code"></div>
          <div id="m_d_msg" class="cb_hint"></div>
          <div class="cb_actions">
            <button id="m_d_apply" class="menu_button"><i class="fa-solid fa-check"></i> Apply</button>
            <button id="m_d_reset" class="menu_button"><i class="fa-solid fa-rotate-left"></i> Reset to defaults</button>
          </div>
        </div>
      </div>
    </div>`;
  }

  function bind(overlay, s) {
    const emoBox = overlay.querySelector('#m_emo_list');
    const spkBox = overlay.querySelector('#m_spk_list');
    if (!emoBox || !spkBox) return;

    // Emotion list
    const renderEmo = () => {
      emoBox.innerHTML = emoRowsHtml(s);
      onPills(emoBox, 'emodef', (v) => { s.emoDefault = v; save(); renderEmo(); renderSpk(); changed(); });
      emoBox.querySelectorAll('.m_emo_name').forEach((inp) => {
        inp.onchange = () => {
          const e = s.emotions.find((x) => x.id === inp.dataset.id);
          const nm = inp.value.trim();
          if (!nm || s.emotions.some((x) => x !== e && x.name.toLowerCase() === nm.toLowerCase())) {
            toastr.warning('Emotion names need to be unique and not empty.', 'Emotions');
            inp.value = e.name;
            return;
          }
          e.name = nm; save(); renderSpk(); changed();
        };
      });
      emoBox.querySelectorAll('.m_emo_del').forEach((b) => {
        b.onclick = async () => {
          const id = b.dataset.id;
          if (id === s.emoDefault) return;
          const e = s.emotions.find((x) => x.id === id);
          const used = Object.values(D().emoImgs).some((m) => m[id]);
          if (used && !(await A.askYes(b, `Delete "${e.name}" and the faces uploaded for it?`, 'Delete', { danger: true }))) return;
          s.emotions = s.emotions.filter((x) => x.id !== id);
          const olds = [];
          for (const m of Object.values(D().emoImgs)) { if (m[id]) olds.push(m[id]); delete m[id]; }
          save(); renderEmo(); renderSpk(); changed();
          olds.forEach((u) => A.deleteFileIfUnused(u));
        };
      });
    };
    const addEmo = () => {
      const inp = overlay.querySelector('#m_emo_new');
      const nm = inp.value.trim();
      if (!nm) return;
      if (s.emotions.some((x) => x.name.toLowerCase() === nm.toLowerCase())) { toastr.warning('That emotion already exists.', 'Emotions'); return; }
      s.emotions.push({ id: newId('emo'), name: nm });
      inp.value = '';
      save(); renderEmo(); renderSpk(); changed();
    };
    overlay.querySelector('#m_emo_add').onclick = addEmo;
    overlay.querySelector('#m_emo_new').onkeydown = (e) => { if (e.key === 'Enter') addEmo(); };

    // Speakers
    const sFile = overlay.querySelector('#m_spk_file');
    let pending = null;
    const renderSpk = () => {
      if (!spkBox.isConnected) return;
      spkBox.innerHTML = spkRowsHtml(s);
      spkBox.querySelectorAll('.m_spk_up').forEach((b) => { b.onclick = () => { pending = { key: b.dataset.key, emo: b.dataset.emo, full: !!b.dataset.full }; sFile.click(); }; });
      spkBox.querySelectorAll('.m_spk_url').forEach((b) => {
        b.onclick = async () => {
          const url = await askImageUrl(b.dataset.full ? 'Full body' : 'Face', b);
          if (url) setSpkImage({ key: b.dataset.key, emo: b.dataset.emo, full: !!b.dataset.full }, url);
        };
      });
      spkBox.querySelectorAll('.m_spk_clr').forEach((b) => {
        b.onclick = () => {
          const { key, emo, full } = b.dataset;
          let old;
          if (full) { old = D().sprites[key]; delete D().sprites[key]; }
          else if (D().emoImgs[key]) { old = D().emoImgs[key][emo]; delete D().emoImgs[key][emo]; }
          save(); renderSpk(); changed();
          A.deleteFileIfUnused(old).then((gone) => {
            if (!gone && /^\/?user\/files\//.test(String(old || ''))) toastr.info('Removed. The file itself was kept because something else still uses it.', 'Emotions');
          });
        };
      });
      spkBox.querySelectorAll('.m_spk_exp').forEach((b) => {
        b.onclick = () => { const k = b.dataset.key; if (spkOpen.has(k)) spkOpen.delete(k); else spkOpen.add(k); renderSpk(); };
        b.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b.click(); } };
      });
      spkBox.querySelectorAll('.m_spk_rm').forEach((b) => {
        b.onclick = async () => {
          const k = b.dataset.key;
          if (b.dataset.custom) {
            if (!(await A.askYes(b, 'Remove this custom speaker and their uploaded pictures?', 'Remove', { danger: true }))) return;
            D().customSpk = D().customSpk.filter((n) => n.toLowerCase() !== k);
            const olds = [D().sprites[k], ...Object.values(D().emoImgs[k] || {})].filter(Boolean);
            delete D().sprites[k];
            delete D().emoImgs[k];
            setTimeout(() => olds.forEach((u) => A.deleteFileIfUnused(u)), 0);
          } else {
            // Detected from the card, persona or chat: hide it. Uploaded pictures are kept for a later restore.
            const c = ctx();
            if ([c.name1, c.name2].some((n) => lc(n) === k) && !(await A.askYes(b, 'This is your persona or the current character. Hide it from the list? Their pictures are kept, and you can restore it later.', 'Hide'))) return;
            if (!D().hiddenSpk.some((n) => lc(n) === k)) D().hiddenSpk.push(k);
          }
          spkOpen.delete(k);
          save(); renderSpk(); changed();
        };
      });
      spkBox.querySelector('.m_spk_unhide')?.addEventListener('click', (e) => {
        e.preventDefault();
        D().hiddenSpk = [];
        save(); renderSpk(); changed();
      });
      pruneMissing().then((n) => {
        if (!n) return;
        save(); changed();
        renderSpk();
        toastr.info(`Removed ${n} link${n === 1 ? '' : 's'} to deleted picture files.`, 'Emotions');
      });
    };
    const setSpkImage = (p, url) => {
      let old;
      if (p.full) { old = D().sprites[p.key]; D().sprites[p.key] = url; }
      else if (p.emo) {
        if (!D().emoImgs[p.key]) D().emoImgs[p.key] = {};
        old = D().emoImgs[p.key][p.emo];
        D().emoImgs[p.key][p.emo] = url;
      }
      save(); renderSpk(); changed();
      A.deleteFileIfUnused(old);
    };
    sFile.onchange = async () => {
      if (!sFile.files.length || !pending) return;
      try {
        const p = pending, url = await A.uploadHere(() => uploadImage(sFile.files[0], 'vnpfp', { max: p.full ? 2048 : 768 }));
        if (url) setSpkImage(p, url);
      } catch (e) {
        console.error('[NTR cast picture upload]', e);
        toastr.error(e.message || 'Picture upload failed', 'Emotions');
      }
      sFile.value = '';
    };
    const addSpk = () => {
      const inp = overlay.querySelector('#m_spk_new');
      const nm = inp.value.trim();
      if (!nm) return;
      if (!A.store()) { toastr.warning('Open a character chat first. Speakers are saved per character.', 'Emotions'); return; }
      const k = nm.toLowerCase();
      if (k === lc(s.narratorWord)) { toastr.warning('That name is your narrator keyword.', 'Emotions'); return; }
      if ([s.delimSpkOpen, s.delimSpkClose, s.delimEmo].some((d) => nm.includes(d))) { toastr.warning('Names can\'t contain your tag delimiters.', 'Emotions'); return; }
      D().hiddenSpk = D().hiddenSpk.filter((n) => lc(n) !== k);
      if (!D().customSpk.some((n) => n.toLowerCase() === k)) D().customSpk.push(nm);
      spkOpen.add(k);
      inp.value = '';
      save(); renderSpk(); changed();
    };
    overlay.querySelector('#m_spk_add').onclick = addSpk;
    overlay.querySelector('#m_spk_new').onkeydown = (e) => { if (e.key === 'Enter') addSpk(); };
    overlay.querySelector('#m_spk_auto').onchange = function() { s.nodeAutoSpk = this.checked; save(); renderSpk(); changed(); };

    // In the Chat
    const chk = (id, key, after) => { const el = overlay.querySelector(id); if (el) el.onchange = function() { s[key] = this.checked; save(); after?.(); }; };
    chk('#m_emo_faces', 'emoFaces', () => { updateInjection(); schedule(); });
    chk('#m_emo_stage', 'emoStage', () => { overlay.querySelector('#m_emo_stagebody').classList.toggle('cb_dim', !s.emoStage); updateInjection(); schedule(); });
    chk('#m_emo_keepface', 'nodeSpriteBase', changed);
    chk('#m_emo_inj', 'emoInject', updateInjection);
    chk('#m_emo_hide', 'nodeHideEmo', () => {
      if (s.nodeHideEmo) cleanTags();
      else if (typeof ctx().reloadCurrentChat === 'function') ctx().reloadCurrentChat();
    });
    overlay.querySelectorAll('.m_emo_sl').forEach((sl) => {
      sl.oninput = function() {
        s[this.dataset.key] = Number(this.value);
        overlay.querySelector(`#m_emo_${this.dataset.key}val`).textContent = this.value;
        schedule();
      };
      sl.onchange = save;
    });
    // Agent is a placeholder for now.
    const agent = overlay.querySelector('input[name="cbr_emosrc"][value="agent"]');
    if (agent) { agent.disabled = true; agent.closest('label')?.classList.add('cb_dim'); }
    onPills(overlay, 'emosrc', (v) => { s.emoSource = v === 'agent' ? 'agent' : 'tags'; save(); updateInjection(); });

    // Tags & Delimiters
    const dIns = [...overlay.querySelectorAll('.m_d_in')];
    const readD = () => Object.fromEntries(dIns.map((i) => [i.dataset.key, i.value.trim()]));
    const preview = () => {
      const d = readD();
      overlay.querySelector('#m_d_preview').textContent =
        `${d.delimSpkOpen}Rafe${d.delimEmo}Neutral${d.delimSpkClose}: "Dialogue." ${d.delimNarOpen}${d.emoWord}:Happy${d.delimNarClose}\n${d.delimNarOpen}${d.narratorWord}${d.delimNarClose}: Narration.\n${d.delimNarOpen}${d.locWord}:Tavern${d.delimNarClose}`
        + `\n${d.delimNarOpen}${d.choiceWord}: Stay ${d.choiceSep} Leave${d.delimNarClose}\n${d.delimNarOpen}${d.effectWord}:${d.fxShake}${d.delimNarClose} ${d.delimNarOpen}${d.weatherWord}:${d.wxRain}${d.delimNarClose} ${d.delimNarOpen}${d.cgWord}:First Kiss${d.delimNarClose}`;
      const { errs, warns } = validateDelims(d);
      overlay.querySelector('#m_d_msg').innerHTML = errs.map((x) => `<div class="cb_err">${escapeHTML(x)}</div>`).join('') + warns.map((x) => `<div class="cb_warn">${escapeHTML(x)}</div>`).join('');
    };
    const applyD = (d) => {
      const { errs } = validateDelims(d);
      if (errs.length) { toastr.error(errs[0], 'Emotions'); return false; }
      Object.assign(s, d);
      save(); renderSpk(); changed(); cleanTags();
      toastr.success('Delimiters updated', 'Emotions');
      return true;
    };
    dIns.forEach((i) => { i.oninput = preview; });
    overlay.querySelector('#m_d_apply').onclick = () => applyD(readD());
    overlay.querySelector('#m_d_reset').onclick = () => {
      dIns.forEach((i) => { i.value = A.DEFAULTS[i.dataset.key]; });
      preview();
      applyD(readD());
    };

    renderEmo(); renderSpk(); preview();
  }

  window.NTR.cast = {
    version: CAST_VERSION,
    partHtml,
    bind,
    onChange: (fn) => listeners.push(fn),
    refresh,
    teardown,
    ensure,
    sync: schedule,
    genStarted: (type, dryRun) => { if (!dryRun) writing = type !== 'quiet' && type !== 'impersonate'; },
    genEnded: () => { writing = false; cleanTags(); },
    // For vn.js
    tagRe,
    splitTag,
    stripEmo,
    castNew,
    castStep,
    spotBoxes,
    pickSpots,
    speakers,
    stAvatar,
    baseFace,
    faceSrc,
    bodySrc,
  };
})();
