// Nitwit Tavern Redesign: Maps module.
// Loaded on demand by vn.js. If this file breaks, Visual Novel Mode and the rest of the extension keep working.
(() => {
  const MAP_VERSION = '2.26.0';
  const A = window.NTR && window.NTR.api;
  if (!A) { console.error('[NTR] map.js loaded without the core (index.js).'); return; }
  const VN = () => window.NTR.vn;
  if (!VN()) { console.error('[NTR] map.js needs Visual Novel Mode (vn.js).'); return; }
  const { save, settings, escapeHTML, askImageUrl, uploadImage, media, pills, onPills, subHead } = A;
  const TAG = A.TAG || '';

  const CSS = `
    #ntr_map { position: fixed; inset: 0; z-index: 2550; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.6); }
    #ntr_map .ntr_map_panel { display: flex; flex-direction: column; max-width: 96vw; max-height: 94vh; border-radius: 12px; overflow: hidden; border: 1px solid var(--SmartThemeBorderColor, #444); background: var(--SmartThemeBlurTintColor, #1e1e24); color: var(--SmartThemeBodyColor, #eee); box-shadow: 0 10px 30px rgba(0,0,0,.6); }
    #ntr_map .ntr_map_head { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-bottom: 1px solid var(--SmartThemeBorderColor, #444); }
    #ntr_map .ntr_map_title { flex: 1; min-width: 0; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    #ntr_map .ntr_map_hb { background: none; border: none; color: inherit; cursor: pointer; padding: 4px 8px; border-radius: 6px; opacity: .75; }
    #ntr_map .ntr_map_hb:hover { opacity: 1; background: rgba(255,255,255,.08); }
    #ntr_map .ntr_map_hb.on { opacity: 1; color: var(--SmartThemeQuoteColor, #6cf); }
    #ntr_map .ntr_map_view { overflow: auto; padding: 10px; }
    #ntr_map .ntr_map_canvas { position: relative; display: inline-block; line-height: 0; user-select: none; }
    #ntr_map .ntr_map_canvas > img { display: block; max-width: calc(96vw - 20px); max-height: calc(94vh - 110px); border-radius: 8px; -webkit-user-drag: none; }
    #ntr_map.ntr_edit .ntr_map_canvas > img { cursor: crosshair; }
    #ntr_map .ntr_map_empty { padding: 40px 30px; opacity: .7; line-height: 1.4; }
    #ntr_map .ntr_map_foot { padding: 6px 12px 10px; font-size: .8em; opacity: .7; }
    .ntr_pin { position: absolute; transform: translate(-50%, -50%); width: 30px; height: 30px; padding: 0; border-radius: 50%; border: 2px solid #fff; background: rgba(20,24,34,.9); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 13px; line-height: 1; box-shadow: 0 2px 8px rgba(0,0,0,.6); touch-action: none; }
    .ntr_pin > span { position: absolute; top: calc(100% + 4px); left: 50%; transform: translateX(-50%); white-space: nowrap; padding: 2px 8px; border-radius: 999px; background: rgba(0,0,0,.75); font-size: 12px; pointer-events: none; }
    .ntr_pin.ntr_sub { border-style: dashed; }
    .ntr_pin.ntr_unseen { opacity: .45; filter: grayscale(.7); }
    .ntr_pin.ntr_here { background: var(--SmartThemeQuoteColor, #6cf); color: #000; opacity: 1; filter: none; }
    .ntr_pin.ntr_here::after { content: ''; position: absolute; inset: -8px; border-radius: 50%; border: 2px solid var(--SmartThemeQuoteColor, #6cf); animation: ntr_ping 1.6s ease-out infinite; pointer-events: none; }
    .ntr_pin.ntr_bad { border-color: #ff8a8a; }
    .ntr_pin.ntr_sel { outline: 2px solid var(--SmartThemeQuoteColor, #6cf); outline-offset: 3px; }
    @keyframes ntr_ping { from { transform: scale(.8); opacity: 1; } to { transform: scale(1.6); opacity: 0; } }
    .ntr_map_pop { position: absolute; z-index: 5; min-width: 200px; max-width: 320px; transform: translate(-50%, 22px); padding: 10px 12px; border-radius: 10px; line-height: 1.35; background: var(--SmartThemeBlurTintColor, #1e1e24); border: 1px solid var(--SmartThemeBorderColor, #555); box-shadow: 0 6px 18px rgba(0,0,0,.6); display: none; cursor: default; }
    .ntr_map_pop .ntr_pop_t { font-weight: bold; }
    .ntr_map_pop .ntr_pop_s { font-size: .8em; opacity: .7; margin: 2px 0 8px; }
    .ntr_map_pop .ntr_pop_b { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .ntr_map_pop .menu_button { margin: 0; padding: 4px 10px; }
    .ntr_map_pop .cb_pills { max-height: 140px; overflow-y: auto; }
  `;
  function ensureStyle() {
    if (document.getElementById('ntr_map_style')) return;
    const el = document.createElement('style');
    el.id = 'ntr_map_style';
    el.textContent = CSS;
    document.head.appendChild(el);
  }

  // ----- Data (per character, inside the VN data) -----
  const D = () => VN().data();
  function maps() {
    const v = D();
    if (!Array.isArray(v.maps)) v.maps = [];
    for (const m of v.maps) if (!Array.isArray(m.pins)) m.pins = [];
    return v.maps;
  }
  const mapById = (id) => maps().find((m) => m.id === id) || null;
  const locById = (id) => (D().locations || []).find((l) => l.id === id) || null;
  const rootMap = () => mapById(D().mapRoot) || maps()[0] || null;
  const norm = (x) => VN().normLoc(x);
  const pinName = (p) => {
    const l = p.loc && locById(p.loc);
    if (l) return l.name;
    const m = p.map && mapById(p.map);
    return m ? m.name : '';
  };

  // Visited / "you are here", following map links (a building counts as visited if any room in it does).
  function pinState(pin, st, seen = new Set()) {
    let visited = false, here = false;
    const l = pin.loc && locById(pin.loc);
    if (l) { const n = norm(l.name); visited = st.visited.has(n); here = !!st.cur && n === st.cur; }
    const sub = pin.map && !seen.has(pin.map) && mapById(pin.map);
    if (sub) {
      seen.add(sub.id);
      for (const p of sub.pins) {
        const r = pinState(p, st, seen);
        visited = visited || r.visited;
        here = here || r.here;
      }
    }
    return { visited, here };
  }

  // Path of map ids from the start map down to the map that holds the current location.
  function pathToCurrent(st) {
    const root = rootMap();
    if (!root || !st.cur) return root ? [root.id] : [];
    const seen = new Set(); // Each map is searched once, so maps that link in circles can't hang it.
    const walk = (m, path) => {
      if (seen.has(m.id)) return null;
      seen.add(m.id);
      if (m.pins.some((p) => { const l = p.loc && locById(p.loc); return l && norm(l.name) === st.cur; })) return [...path, m.id];
      for (const p of m.pins) {
        const sub = p.map && mapById(p.map);
        if (sub && !path.includes(sub.id) && sub.id !== m.id) { const r = walk(sub, [...path, m.id]); if (r) return r; }
      }
      return null;
    };
    return walk(root, []) || [root.id];
  }

  // ----- Viewer -----
  let view = null; // { stack, edit, el, sel, fromMenu }

  function state() {
    const cur = VN().currentLoc();
    return { visited: VN().visitedLocs(), cur: cur ? norm(cur) : '' };
  }

  function open(opts = {}) {
    if (!A.store()) { toastr.info('Open a character chat first. Maps are saved per character.', 'Maps'); return; }
    const all = maps();
    if (!all.length) { toastr.info('No maps yet. Add one in the menu under Visual Novel Mode, Maps.', 'Maps'); return; }
    if (!opts.edit && !all.some((m) => m.url)) { toastr.info('Upload a map image first.', 'Maps'); return; }
    ensureStyle();
    close(true);
    if (opts.fromMenu) A.closeMenu();
    const start = opts.mapId && mapById(opts.mapId);
    const stack = start ? [start.id] : pathToCurrent(state());
    const el = document.createElement('div');
    el.id = 'ntr_map';
    el.innerHTML = `
      <div class="ntr_map_panel">
        <div class="ntr_map_head">
          <button type="button" class="ntr_map_hb" data-a="back" title="Back"><i class="fa-solid fa-arrow-left"></i></button>
          <span class="ntr_map_title"></span>
          <button type="button" class="ntr_map_hb" data-a="edit" title="Edit pins"><i class="fa-solid fa-pen"></i></button>
          <button type="button" class="ntr_map_hb" data-a="close" title="Close"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="ntr_map_view"></div>
        <div class="ntr_map_foot"></div>
      </div>`;
    document.body.appendChild(el);
    view = { stack, edit: !!opts.edit, el, sel: null, fromMenu: !!opts.fromMenu };
    el.addEventListener('pointerdown', (e) => { if (e.target === el) close(); });
    el.querySelector('[data-a="back"]').onclick = () => { if (view.stack.length > 1) { view.stack.pop(); view.sel = null; render(); } };
    el.querySelector('[data-a="close"]').onclick = () => close();
    el.querySelector('[data-a="edit"]').onclick = () => { view.edit = !view.edit; view.sel = null; prune(); render(); };
    document.addEventListener('keydown', onKey);
    render();
  }

  function onKey(e) {
    if (e.key !== 'Escape' || !view) return;
    if (view.sel) { view.sel = null; prune(); render(); } else close();
  }

  // Pins without a place or a map only make sense while you're setting them up.
  function prune() {
    let gone = false;
    for (const m of maps()) {
      const n = m.pins.length;
      m.pins = m.pins.filter((p) => p.loc || p.map || (view && view.sel === p.id));
      if (m.pins.length !== n) gone = true;
    }
    if (gone) save();
  }

  function close(silent) {
    document.removeEventListener('keydown', onKey);
    if (!view) return;
    const fromMenu = view.fromMenu;
    view.el.remove();
    view = null;
    prune();
    if (fromMenu && !silent) A.openMenu();
  }

  function render() {
    if (!view) return;
    const el = view.el;
    const stack = view.stack.filter((id) => mapById(id));
    if (!stack.length) { const r = rootMap(); if (!r) { close(); return; } stack.push(r.id); }
    view.stack = stack;
    const m = mapById(stack[stack.length - 1]);
    el.classList.toggle('ntr_edit', view.edit);
    el.querySelector('[data-a="back"]').style.visibility = stack.length > 1 ? 'visible' : 'hidden';
    el.querySelector('[data-a="edit"]').classList.toggle('on', view.edit);
    el.querySelector('.ntr_map_title').textContent = stack.map((id) => mapById(id).name || 'Map').join(' > ');
    el.querySelector('.ntr_map_foot').textContent = view.edit
      ? 'Editing: click the map to drop a pin, drag pins to move them, click a pin to link it.'
      : 'Faded pins are places the story hasn\'t visited yet.';
    const box = el.querySelector('.ntr_map_view');
    if (!media(m.url)) { box.innerHTML = '<div class="ntr_map_empty">This map has no image yet. Upload one in the menu under Visual Novel Mode, Maps.</div>'; return; }
    box.innerHTML = `<div class="ntr_map_canvas"><img alt="" draggable="false"><div class="ntr_map_pins"></div><div class="ntr_map_pop"></div></div>`;
    const canvas = box.querySelector('.ntr_map_canvas');
    const img = canvas.querySelector('img');
    img.src = media(m.url);
    img.onerror = () => { box.innerHTML = '<div class="ntr_map_empty">The map image failed to load.</div>'; };
    img.addEventListener('click', (e) => {
      if (!view.edit) { hidePop(); return; }
      const r = img.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const p = { id: VN().newId('pin'), x: clamp01((e.clientX - r.left) / r.width), y: clamp01((e.clientY - r.top) / r.height), loc: '', map: '' };
      m.pins.push(p);
      view.sel = p.id;
      save();
      drawPins(m);
    });
    drawPins(m);
  }

  const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));

  function drawPins(m) {
    if (!view) return;
    const host = view.el.querySelector('.ntr_map_pins');
    if (!host) return;
    const st = state();
    host.innerHTML = '';
    for (const p of m.pins) {
      const name = pinName(p);
      const sub = p.map && mapById(p.map);
      if (!view.edit && !name) continue;
      const { visited, here } = pinState(p, st);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ntr_pin' + (sub && !(p.loc && locById(p.loc)) ? ' ntr_sub' : '') + (here ? ' ntr_here' : '')
        + (!view.edit && !visited && !here ? ' ntr_unseen' : '') + (view.edit && !name ? ' ntr_bad' : '') + (view.sel === p.id ? ' ntr_sel' : '');
      b.style.left = (clamp01(p.x) * 100) + '%';
      b.style.top = (clamp01(p.y) * 100) + '%';
      b.innerHTML = `<i class="fa-solid ${sub && !(p.loc && locById(p.loc)) ? 'fa-map' : 'fa-location-dot'}"></i>${name ? `<span>${escapeHTML(name)}</span>` : ''}`;
      b.title = name || 'Unlinked pin';
      bindPin(b, p, m);
      host.appendChild(b);
    }
    if (view.sel) {
      const p = m.pins.find((x) => x.id === view.sel);
      if (p) showPop(p, m); else hidePop();
    }
  }

  function bindPin(b, p, m) {
    let start = null, moved = false;
    b.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (!view.edit) return;
      start = { x: e.clientX, y: e.clientY };
      moved = false;
      try { b.setPointerCapture(e.pointerId); } catch (err) {}
    });
    b.addEventListener('pointermove', (e) => {
      if (!start || !view.edit) return;
      if (!moved && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 5) return;
      moved = true;
      const r = view.el.querySelector('.ntr_map_canvas img').getBoundingClientRect();
      p.x = clamp01((e.clientX - r.left) / r.width);
      p.y = clamp01((e.clientY - r.top) / r.height);
      b.style.left = (p.x * 100) + '%';
      b.style.top = (p.y * 100) + '%';
    });
    b.addEventListener('pointerup', () => { if (start && moved) save(); start = null; });
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      if (moved) { moved = false; return; }
      const sub = p.map && mapById(p.map);
      if (!view.edit && sub && !(p.loc && locById(p.loc))) { goMap(sub.id); return; }
      view.sel = view.sel === p.id ? null : p.id;
      if (view.edit && !view.sel) prune();
      drawPins(m);
      if (!view.sel) hidePop();
    });
  }

  function goMap(id) {
    if (!view || !mapById(id)) return;
    view.stack.push(id);
    view.sel = null;
    render();
  }

  function hidePop() {
    const pop = view && view.el.querySelector('.ntr_map_pop');
    if (pop) { pop.style.display = 'none'; pop.innerHTML = ''; }
  }

  function showPop(p, m) {
    const pop = view.el.querySelector('.ntr_map_pop');
    if (!pop) return;
    pop.style.left = (Math.min(0.85, Math.max(0.15, clamp01(p.x))) * 100) + '%';
    pop.style.top = (clamp01(p.y) * 100) + '%';
    pop.style.display = 'block';
    pop.onclick = (e) => e.stopPropagation();
    pop.onpointerdown = (e) => e.stopPropagation();
    if (view.edit) {
      const locs = D().locations || [];
      const others = maps().filter((x) => x.id !== m.id);
      pop.innerHTML = `
        <div class="ntr_pop_t">Pin</div>
        <div style="margin-top:6px;"><small>Place</small>${locs.length ? pills('mappl', [['', 'None'], ...locs.map((l) => [l.id, escapeHTML(l.name)])], p.loc || '') : '<div class="cb_hint">Add locations in the menu first.</div>'}</div>
        <div style="margin-top:6px;"><small>Opens map</small>${others.length ? pills('mapmp', [['', 'None'], ...others.map((x) => [x.id, escapeHTML(x.name || 'Map')])], p.map || '') : '<div class="cb_hint">Add another map to link one.</div>'}</div>
        <div class="ntr_pop_b">
          <button type="button" class="menu_button danger_button" data-a="del"><i class="fa-solid fa-trash"></i> Delete</button>
          <button type="button" class="menu_button" data-a="done"><i class="fa-solid fa-check"></i> Done</button>
        </div>`;
      onPills(pop, 'mappl', (v) => { p.loc = v; save(); drawPins(m); });
      onPills(pop, 'mapmp', (v) => { p.map = v; save(); drawPins(m); });
      pop.querySelector('[data-a="del"]').onclick = () => { m.pins = m.pins.filter((x) => x !== p); view.sel = null; save(); drawPins(m); hidePop(); };
      pop.querySelector('[data-a="done"]').onclick = () => { view.sel = null; prune(); drawPins(m); hidePop(); };
      return;
    }
    const st = state();
    const { visited, here } = pinState(p, st);
    const l = p.loc && locById(p.loc);
    const sub = p.map && mapById(p.map);
    pop.innerHTML = `
      <div class="ntr_pop_t">${escapeHTML(pinName(p))}</div>
      <div class="ntr_pop_s">${here ? 'You are here' : visited ? 'Visited' : 'Not visited yet'}</div>
      <div class="ntr_pop_b">
        ${l ? '<button type="button" class="menu_button" data-a="go"><i class="fa-solid fa-person-walking"></i> Go here</button>' : ''}
        ${sub ? `<button type="button" class="menu_button" data-a="sub"><i class="fa-solid fa-map"></i> Open ${escapeHTML(sub.name || 'map')}</button>` : ''}
      </div>`;
    const go = pop.querySelector('[data-a="go"]');
    if (go) go.onclick = () => { if (VN().putInInput(goText(l.name), false)) close(true); };
    const sb = pop.querySelector('[data-a="sub"]');
    if (sb) sb.onclick = () => goMap(sub.id);
  }

  // "*heads to the {place}*" without doubling "the" for places like "The Docks".
  function goText(place) {
    const t = String(settings().mapGoText || '*heads to the {place}*');
    let name = String(place).trim();
    if (/\bthe\s*\{place\}/i.test(t)) name = name.replace(/^the\s+/i, '');
    return t.includes('{place}') ? t.split('{place}').join(name) : `${t} ${name}`;
  }

  // ----- Menu section -----
  function rowsHtml() {
    if (!A.store()) return '<div class="cb_hint">Open a character chat first. Maps are saved per character.</div>';
    const all = maps();
    if (!all.length) return '<div class="cb_hint">No maps yet.</div>';
    const root = rootMap();
    return all.map((m) => {
      const id = escapeHTML(m.id);
      return `<div class="cb_spk"><div class="cb_spk_row">
        <label class="cb_defdot" title="Start map"><input type="radio" name="cbr_maproot" value="${id}" ${root && root.id === m.id ? 'checked' : ''}></label>
        <div class="cb_thumbbox cb_wide">${media(m.url) ? `<img src="${escapeHTML(media(m.url))}" alt="">` : '<i class="fa-solid fa-map"></i>'}</div>
        <input type="text" class="text_pole m_m_name" data-id="${id}" value="${escapeHTML(m.name)}" style="flex:1;min-width:0;margin:0;">
        <button class="menu_button m_m_up" data-id="${id}" title="Upload map image"><i class="fa-solid fa-upload"></i></button>
        <button class="menu_button m_m_url" data-id="${id}" title="Use a link for the map image"><i class="fa-solid fa-link"></i></button>
        <button class="menu_button m_m_edit" data-id="${id}" title="Edit pins" ${m.url ? '' : 'disabled'}><i class="fa-solid fa-location-dot"></i></button>
        <button class="menu_button danger_button m_m_del" data-id="${id}" title="Delete map"><i class="fa-solid fa-trash"></i></button>
      </div><div class="cb_hint" style="margin:4px 0 0 32px;">${m.pins.length} pin${m.pins.length === 1 ? '' : 's'}</div></div>`;
    }).join('');
  }

  function sectionHtml(s) {
    return `
      ${subHead('vn_map', 'Maps ' + TAG)}
      <div class="cb_collapse_content">
        <label class="checkbox_label"><input type="checkbox" id="m_map_on" ${s.nodeMaps ? 'checked' : ''}><span>Enable maps (adds a Map button to the dialogue box)</span></label>
        <div id="m_map_body" class="${s.nodeMaps ? '' : 'cb_dim'}">
          <div class="cb_hint">Upload a map, then use the pin button to click spots on it. Link a pin to one of this character's locations, or to another map (city, then building, then room). Places tagged in the chat count as visited; the current one glows. The dot marks the map that opens first.</div>
          <div id="m_m_list"></div>
          <div class="cb_row" style="margin-top:8px;">
            <input type="text" id="m_m_new" class="text_pole" placeholder="Add a map (e.g. City)" style="flex:1;margin:0;">
            <button id="m_m_add" class="menu_button" style="margin:0;"><i class="fa-solid fa-plus"></i> Add</button>
          </div>
          <label class="cb_dfield" style="margin-top:8px;"><span>"Go here" text ({place} becomes the place's name)</span><input type="text" id="m_m_go" class="text_pole" value="${escapeHTML(s.mapGoText)}"></label>
        </div>
        <input type="file" id="m_m_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
      </div>`;
  }

  function bind(overlay, s) {
    const on = overlay.querySelector('#m_map_on');
    if (on) on.onchange = () => {
      s.nodeMaps = on.checked; save();
      overlay.querySelector('#m_map_body')?.classList.toggle('cb_dim', !on.checked);
      if (!on.checked) close(true);
      VN().refresh();
    };
    const go = overlay.querySelector('#m_m_go');
    if (go) go.onchange = () => {
      const v = go.value.trim();
      if (!v) { go.value = s.mapGoText; toastr.warning('The "Go here" text can\'t be empty.', 'Maps'); return; }
      s.mapGoText = v; save();
    };
    const file = overlay.querySelector('#m_m_file');
    let pending = null;
    const render = () => {
      const box = overlay.querySelector('#m_m_list');
      if (!box) return;
      box.innerHTML = rowsHtml();
      onPills(box, 'maproot', (id) => { D().mapRoot = id; save(); });
      box.querySelectorAll('.m_m_name').forEach((inp) => {
        inp.onchange = () => {
          const m = mapById(inp.dataset.id);
          const nm = inp.value.trim();
          if (!m) return;
          if (!nm) { inp.value = m.name; toastr.warning('Map names can\'t be empty.', 'Maps'); return; }
          m.name = nm; save();
        };
      });
      box.querySelectorAll('.m_m_up').forEach((b) => { b.onclick = () => { pending = b.dataset.id; file.click(); }; });
      box.querySelectorAll('.m_m_url').forEach((b) => {
        b.onclick = async () => {
          const url = await askImageUrl('Map image', b);
          if (url) setMapImage(b.dataset.id, url);
        };
      });
      box.querySelectorAll('.m_m_edit').forEach((b) => { b.onclick = () => open({ edit: true, mapId: b.dataset.id, fromMenu: true }); });
      box.querySelectorAll('.m_m_del').forEach((b) => {
        b.onclick = async () => {
          const m = mapById(b.dataset.id);
          if (!m || !(await A.askYes(b, `Delete the map "${m.name}"${m.url ? ', its image' : ''} and its pins?`, 'Delete', { danger: true }))) return;
          const v = D();
          v.maps = maps().filter((x) => x !== m);
          for (const x of v.maps) x.pins = x.pins.filter((p) => p.map !== m.id || p.loc).map((p) => (p.map === m.id ? { ...p, map: '' } : p));
          if (v.mapRoot === m.id) v.mapRoot = '';
          save(); render(); VN().refresh();
          A.deleteFileIfUnused(m.url);
        };
      });
    };
    const setMapImage = (id, url) => {
      const m = mapById(id);
      let old;
      if (m) { old = m.url; m.url = url; }
      save(); render(); VN().refresh();
      A.deleteFileIfUnused(old);
    };
    if (file) file.onchange = async () => {
      if (!file.files.length || !pending) return;
      try {
        const id = pending, url = await A.uploadHere(() => uploadImage(file.files[0], 'vnmap', { max: 3072 }));
        if (url) setMapImage(id, url);
      } catch (e) {
        console.error('[NTR map upload]', e);
        toastr.error(e.message || 'Map upload failed', 'Maps');
      }
      file.value = '';
    };
    const add = () => {
      const inp = overlay.querySelector('#m_m_new');
      const nm = inp.value.trim();
      if (!nm) return;
      if (!A.store()) { toastr.warning('Open a character chat first. Maps are saved per character.', 'Maps'); return; }
      const m = { id: VN().newId('map'), name: nm, url: '', pins: [] };
      maps().push(m);
      if (!D().mapRoot) D().mapRoot = m.id;
      inp.value = '';
      save(); render();
    };
    const addBtn = overlay.querySelector('#m_m_add');
    if (addBtn) addBtn.onclick = add;
    const newIn = overlay.querySelector('#m_m_new');
    if (newIn) newIn.onkeydown = (e) => { if (e.key === 'Enter') add(); };
    render();
  }

  window.NTR.map = { version: MAP_VERSION, open, close: () => close(true), sectionHtml, bind, goText };
})();
