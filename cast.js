// Nitwit Tavern Redesign: Cast module. The emotion list, speakers, and each speaker's faces and full body.
// Loaded by index.js for the Avatars page, and before vn.js, which draws them in Visual Novel Mode.
// If this file breaks, the rest of the extension keeps working.
(() => {
  const CAST_VERSION = '2.37.0';
  const A = window.NTR && window.NTR.api;
  if (!A) { console.error('[NTR] cast.js loaded without the core (index.js).'); return; }
  const { ctx, save, settings, escapeHTML, askImageUrl, uploadImage, newId, media, onPills, subHead } = A;
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

  // Something here changed (an emotion, a speaker, a picture): vn.js redraws.
  const listeners = [];
  const changed = () => listeners.forEach((fn) => { try { fn(); } catch (e) { console.error('[NTR]', e); } });

  // ----- Speaker tags: [Name|Emotion] with the user's own delimiters (Visual Novel Mode's Tags & Delimiters) -----
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
    return `<div class="ntr_keepon">
      ${subHead('av_emo', 'Emotions')}
      <div class="cb_collapse_content">
        <div class="cb_hint">Each speaker's face per emotion, and a full body for the stage. Visual Novel Mode uses them.</div>
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
      </div>
    </div>`;
  }

  // Redraws the speaker list in an open menu, e.g. after the delimiters change (vn.js).
  let renderSpkNow = null;

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
    renderSpkNow = renderSpk;
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

    renderEmo(); renderSpk();
  }

  window.NTR.cast = {
    version: CAST_VERSION,
    partHtml,
    bind,
    onChange: (fn) => listeners.push(fn),
    renderSpeakers: () => renderSpkNow?.(),
    tagRe,
    splitTag,
    speakers,
    stAvatar,
    baseFace,
    faceSrc,
    bodySrc,
  };
})();
