// Nitwit Tavern Redesign: Regexes module.
// Loaded by index.js for the Regexes page. If this file breaks, the rest of the extension keeps working.
// Shows SillyTavern's own regex scripts (Global, Preset and Character) with folders. SillyTavern keeps and runs every
// regex, and every change made here goes through its own Regex panel (on/off, editor, delete, import, reorder, bulk
// on/off), so that panel and the chat stay in step exactly as if it was done there. Only the folders are NTR's: Global
// ones in the settings, Preset ones in the settings by preset, Character ones in the card.

let E = null;
try {
  E = await import(new URL('../../regex/engine.js', import.meta.url).href);
} catch (e) {
  console.warn('[NTR] SillyTavern\'s regex engine could not be loaded', e);
}

(() => {
  const REGEX_VERSION = '2.69.28';
  const A = window.NTR && window.NTR.api;
  if (!A) { console.error('[NTR] regex.js loaded without the core (index.js).'); return; }
  const { ctx, settings, save, store, escapeHTML: esc, pageHtml, askText, askYes, newId } = A;

  // SillyTavern runs Global first, then Preset, then Character, each from top to bottom.
  const SECS = [
    { k: 'global', type: 'GLOBAL', list: 'saved_regex_scripts', add: 'open_regex_editor', name: 'Global', icon: 'fa-globe' },
    { k: 'preset', type: 'PRESET', list: 'saved_preset_scripts', add: 'open_preset_editor', allow: 'regex_preset_toggle', name: 'Preset', icon: 'fa-sliders' },
    { k: 'scoped', type: 'SCOPED', list: 'saved_scoped_scripts', add: 'open_scoped_editor', allow: 'regex_scoped_toggle', name: 'Character', icon: 'fa-address-card' },
  ];
  const secOf = (k) => SECS.find((x) => x.k === k);
  const stList = (sec) => document.getElementById(sec.list);
  const stRow = (sec, id) => [...(stList(sec)?.children || [])].find((el) => el.id === id) || null;
  const ready = () => !!E && !!stList(SECS[0]);
  const scripts = (sec) => { try { return E.getScriptsByType(E.SCRIPT_TYPES[sec.type]) || []; } catch (e) { return []; } };
  const presetName = () => { try { return E.getCurrentPresetName() || ''; } catch (e) { return ''; } };
  const presetKey = () => { try { const n = E.getCurrentPresetName(); return n ? `${E.getCurrentPresetAPI()}|${n}` : ''; } catch (e) { return ''; } };
  const character = () => { const c = ctx(); return c.groupId ? null : c.characters?.[c.characterId] || null; };
  // SillyTavern has no Character regexes in group chats.
  const shown = (sec) => !!stList(sec) && (sec.k !== 'scoped' || !!character());
  function allowed(sec) {
    try {
      if (sec.k === 'preset') return E.isPresetScriptsAllowed(E.getCurrentPresetAPI(), E.getCurrentPresetName());
      if (sec.k === 'scoped') return E.isScopedScriptsAllowed(character());
    } catch (e) { /* older SillyTavern: treat as allowed */ }
    return true;
  }
  const secName = (sec) => (sec.k === 'preset' ? presetName() || 'none' : sec.k === 'scoped' ? character()?.name || '' : '');

  // A folder: { id, name, ids: regex ids, was: the ids that were on when the folder was switched off here, or null }.
  function folders(sec, make = false) {
    const s = settings();
    if (sec.k === 'global') return s.regexFolders;
    if (sec.k === 'preset') {
      const key = presetKey();
      if (!key) return [];
      if (!s.regexPresetFolders[key] && make) s.regexPresetFolders[key] = [];
      return s.regexPresetFolders[key] || [];
    }
    const st = store();
    if (!st) return [];
    if (!st.regex && make) st.regex = { folders: [] };
    return st.regex?.folders || [];
  }
  const openKey = (f) => 'rx_' + f.id;

  // The section as this page shows it: folders in their order, then the regexes in no folder. Inside each, SillyTavern's
  // run order. Regexes that no longer exist leave their folders. `same`: the run order matches the page.
  function view(sec) {
    const all = scripts(sec);
    const have = new Set(all.map((x) => x.id));
    const fl = folders(sec);
    const seen = new Set();
    let dirty = false;
    for (const f of fl) {
      const ids = f.ids.filter((id) => have.has(id) && !seen.has(id));
      ids.forEach((id) => seen.add(id));
      const was = f.was ? f.was.filter((id) => ids.includes(id)) : null;
      if (ids.length !== f.ids.length || (was && was.length !== f.was.length)) { f.ids = ids; f.was = was; dirty = true; }
    }
    if (dirty) save();
    const where = new Map();
    fl.forEach((f) => f.ids.forEach((id) => where.set(id, f)));
    const groups = fl.map((f) => ({ f, items: all.filter((x) => where.get(x.id) === f) }));
    const loose = all.filter((x) => !where.has(x.id));
    const order = [...groups.flatMap((g) => g.items), ...loose].map((x) => x.id);
    return { groups, loose, order, same: order.join('\n') === all.map((x) => x.id).join('\n') };
  }

  // ===== Doing things through SillyTavern's own Regex panel =====
  const stClick = (el) => { if (el) $(el).trigger('click'); };
  function setOn(sec, id, on) {
    const row = stRow(sec, id);
    if (row) $(row).find('.disable_regex').prop('checked', !on).trigger('input');
  }
  // Several at once with SillyTavern's Bulk Edit, so the chat reloads once.
  function setMany(sec, ids, on) {
    const list = scripts(sec);
    const todo = ids.filter((id) => { const x = list.find((y) => y.id === id); return x && !x.disabled !== on; });
    if (!todo.length) return;
    if (todo.length === 1) { setOn(sec, todo[0], on); return; }
    $('#regex_container .regex_bulk_checkbox').prop('checked', false);
    for (const id of todo) $(stRow(sec, id)).find('.regex_bulk_checkbox').prop('checked', true);
    stClick(document.getElementById(on ? 'bulk_enable_regex' : 'bulk_disable_regex'));
  }
  // Runs SillyTavern's Bulk Edit on regexes from any section and waits until its panel has redrawn.
  function bulk(ids, on) {
    return new Promise((res) => {
      const rows = ids.map((id) => SECS.map((sec) => stRow(sec, id)).find(Boolean)).filter(Boolean);
      const box = document.getElementById('regex_container');
      if (!rows.length || !box) { res(); return; }
      let t = 0;
      let over = false;
      const done = () => { if (over) return; over = true; obs.disconnect(); clearTimeout(t); clearTimeout(cap); res(); };
      const obs = new MutationObserver(() => { clearTimeout(t); t = setTimeout(done, 400); });
      const cap = setTimeout(done, 8000);
      obs.observe(box, { childList: true, subtree: true });
      $('#regex_container .regex_bulk_checkbox').prop('checked', false);
      for (const r of rows) $(r).find('.regex_bulk_checkbox').prop('checked', true);
      stClick(document.getElementById(on ? 'bulk_enable_regex' : 'bulk_disable_regex'));
    });
  }

  // The regexes a folder switch changes. Off remembers which were on. Back on turns those on again: all of them for a
  // folder never switched off here, none if the remembered ones have left the folder.
  function folderFlip(f, items, on) {
    if (!on) { f.was = items.filter((x) => !x.disabled).map((x) => x.id); return f.was; }
    const ids = Array.isArray(f.was) ? f.was.filter((id) => f.ids.includes(id)) : f.ids;
    f.was = null;
    return ids;
  }

  // Puts SillyTavern's rows in this order and saves through its own drag-to-reorder, which also reloads the chat.
  async function reorder(sec, ids) {
    const list = stList(sec);
    if (!list) return;
    const rows = [...list.children];
    // SillyTavern saves the order from its rows, so a regex it hasn't drawn yet (an import still saving) would be lost.
    if (rows.length !== scripts(sec).length) {
      toastr.warning('ST is still saving regexes. Try again in a moment.', 'Regexes');
      refresh();
      return;
    }
    const byId = new Map(rows.map((r) => [r.id, r]));
    for (const id of ids) { const r = byId.get(id); if (r) list.appendChild(r); }
    for (const r of rows) if (!ids.includes(r.id)) list.appendChild(r);
    try {
      const stop = $(list).sortable('option', 'stop');
      if (typeof stop !== 'function') throw new Error('no reorder handler');
      await stop.call(list);
    } catch (e) {
      console.error('[NTR] Regex reorder failed', e);
      toastr.error('Couldn\'t save the new order in ST.', 'Regexes');
      refresh();
    }
  }

  // A regex made or imported for a folder joins it as SillyTavern shows it. An import can bring several, saved one by one,
  // and is done when SillyTavern empties its file picker; only then does the order follow. Gives up after 10 minutes.
  let pending = null;
  function expect(sec, f, kind) {
    pending = { sec: sec.k, fid: f.id, kind, got: false, before: new Set(scripts(sec).map((x) => x.id)), until: Date.now() + 600000 };
  }
  function claimNew() {
    if (!pending) return;
    if (Date.now() > pending.until) { pending = null; return; }
    const sec = secOf(pending.sec);
    const f = folders(sec).find((x) => x.id === pending.fid);
    if (!f) { pending = null; return; }
    const fresh = scripts(sec).map((x) => x.id).filter((id) => !pending.before.has(id));
    if (fresh.length) {
      fresh.forEach((id) => pending.before.add(id));
      f.ids.push(...fresh);
      pending.got = true;
      save();
    }
    const importing = pending.kind === 'import' && !!document.getElementById('import_regex_file')?.value;
    if (!pending.got || importing) return;
    pending = null;
    const v = view(sec);
    if (!v.same) reorder(sec, v.order);
  }

  // SillyTavern's import asks where the regexes go, starting on Global. Picks this section there, so a forgotten click
  // can't send them to the wrong place; the question stays open to check. Gives up after 10 minutes (a cancelled file
  // picker can't be told apart from a slow one).
  let importWatch = null;
  function importTo(sec) {
    importWatch?.disconnect();
    const obs = new MutationObserver(() => {
      const r = document.getElementById(`regex_import_target_${sec.k}`);
      if (!r) return;
      stop();
      r.checked = true;
      r.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const stop = () => { obs.disconnect(); if (importWatch === obs) importWatch = null; };
    importWatch = obs;
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(stop, 600000);
    stClick(document.getElementById('import_regex'));
  }

  function download(list, name) {
    if (!list.length) { toastr.info('Nothing to export.', 'Regexes'); return; }
    const blob = new Blob([JSON.stringify(list, null, 4)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${name.replace(/[^\w\- ]+/g, '').trim() || 'regexes'}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // ===== The page =====
  const CSS = `
    #cb_modal_overlay .rx_top { display: flex; gap: 6px; align-items: center; margin-top: 10px; }
    #cb_modal_overlay .rx_top .text_pole { flex: 1; margin: 0; }
    #cb_modal_overlay .rx_btn { margin: 0; padding: 4px 8px; flex: none; }
    #cb_modal_overlay .rx_swbox { flex: none; display: inline-flex; align-items: center; padding: 2px; margin: -2px; cursor: pointer; }
    @media (pointer: coarse) {
      #cb_modal_overlay .rx_btn { min-width: 40px; min-height: 40px; }
      #cb_modal_overlay .rx_swbox { padding: 11px 6px; margin: -11px -6px; }
      #cb_modal_overlay .rx_list .ntr_grip { width: 40px; align-self: stretch; display: flex; align-items: center; justify-content: center; padding: 0; }
    }
    #cb_modal_overlay .rx_sec { margin-top: 8px; }
    #cb_modal_overlay .rx_sec + .rx_sec { margin-top: 22px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,.08); }
    #cb_modal_overlay .rx_shead { gap: 6px; }
    #cb_modal_overlay .rx_shead .ntr_parttitle { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    #cb_modal_overlay .rx_stitle { flex: 1; min-width: 0; }
    #cb_modal_overlay .rx_stitle .ntr_parttitle { margin: 0; }
    #cb_modal_overlay .rx_sname { margin-top: -2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .85em; opacity: .6; }
    #cb_modal_overlay .rx_secoff .rx_body { opacity: .45; }
    #cb_modal_overlay .rx_order { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    #cb_modal_overlay .rx_order .menu_button { margin: 0; padding: 3px 10px; }
    #cb_modal_overlay .rx_folder { margin-top: 10px; }
    #cb_modal_overlay .ntr_page .rx_fhead { display: flex; align-items: center; gap: 8px; margin-top: 0; padding: 8px 10px; cursor: pointer; user-select: none; }
    #cb_modal_overlay .rx_ficon { flex: none; opacity: .85; }
    #cb_modal_overlay .rx_uhead .rx_ficon { opacity: .6; }
    #cb_modal_overlay .rx_open .rx_fhead { border-radius: 10px 10px 0 0; }
    #cb_modal_overlay .rx_fname { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    #cb_modal_overlay .rx_count { font-weight: 400; opacity: .55; font-size: .9em; }
    #cb_modal_overlay .ntr_page .rx_fbody { display: none; margin-top: 0; padding: 2px 12px 8px; border-top: 0; border-radius: 0 0 10px 10px; }
    #cb_modal_overlay .rx_open .rx_fbody { display: block; }
    #cb_modal_overlay .rx_ublock { margin-top: 10px; }
    #cb_modal_overlay .ntr_page .rx_uhead { display: flex; align-items: center; gap: 8px; margin-top: 0; padding: 8px 10px; border-radius: 10px 10px 0 0; }
    #cb_modal_overlay .ntr_page .rx_loose { margin-top: 0; padding: 2px 12px 8px; border-top: 0; border-radius: 0 0 10px 10px; }
    #cb_modal_overlay .rx_row { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,.06); }
    #cb_modal_overlay .rx_row:last-child { border-bottom: 0; }
    #cb_modal_overlay .rx_name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    #cb_modal_overlay .rx_dim .rx_name { opacity: .45; text-decoration: line-through; }
    #cb_modal_overlay .ntr_dragging + .rx_empty { display: none; }
    #cb_modal_overlay .rx_empty { opacity: .5; font-size: .85em; padding: 8px 0 4px; }
    #cb_modal_overlay input.rx_sw[type=checkbox] {
      appearance: none; -webkit-appearance: none; flex: none; box-sizing: border-box; position: relative; width: 2.1em; height: 1.15em; margin: 0 4px 0 0;
      border: 1px solid var(--SmartThemeBorderColor, #888); border-radius: 999px; background: rgba(0,0,0,.3); cursor: pointer;
      outline: none; box-shadow: none; transform: none; align-self: center; transition: background .15s, border-color .15s;
    }
    #cb_modal_overlay input.rx_sw[type=checkbox]::after { content: none; display: none; }
    #cb_modal_overlay input.rx_sw[type=checkbox]::before {
      content: ''; position: absolute; top: 50%; left: .14em; width: .8em; height: .8em; border-radius: 50%;
      background: var(--SmartThemeBodyColor, #ccc); opacity: .6; box-shadow: none; clip-path: none; transform: translateY(-50%); transition: left .15s, background .15s, opacity .15s;
    }
    #cb_modal_overlay input.rx_sw[type=checkbox]:checked { background: var(--SmartThemeQuoteColor, #6cf); border-color: var(--SmartThemeQuoteColor, #6cf); }
    #cb_modal_overlay input.rx_sw[type=checkbox]:checked::before { left: calc(100% - .94em); background: #fff; opacity: 1; }
    #cb_modal_overlay input.rx_sw[type=checkbox]:disabled { opacity: .35; cursor: default; }
    #cb_modal_overlay input.rx_sw[type=checkbox]:focus-visible { outline: 2px solid var(--SmartThemeQuoteColor, #6cf); outline-offset: 3px; }
    #cb_modal_overlay .rx_guide { display: inline-flex; gap: 6px; align-items: center; margin: 8px 0 0; padding: 0; border: 0; background: none;
      color: var(--SmartThemeQuoteColor, #6cf); font: inherit; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
  `;

  let query = '';
  // In a label box, so a finger has room to hit it (see the CSS).
  const sw = (cls, on, title, extra = '') => `<label class="rx_swbox"><input type="checkbox" class="rx_sw ${cls}" ${on ? 'checked' : ''} title="${title}" aria-label="${title}"${extra}></label>`;
  const btn = (act, icon, title, extra = '') => `<button class="menu_button rx_btn${extra}" data-act="${act}" title="${title}" aria-label="${title}"><i class="fa-solid ${icon}"></i></button>`;

  function rowHtml(x) {
    const on = !x.disabled;
    const n = esc(x.scriptName || 'Untitled');
    return `<div class="rx_row${on ? '' : ' rx_dim'}" data-id="${esc(x.id)}">
      ${query ? '' : '<i class="fa-solid fa-grip-lines ntr_grip" title="Drag to reorder or move to a folder"></i>'}
      <span class="rx_name" title="${esc(x.scriptName || '')}">${esc(x.scriptName || 'Untitled')}</span>
      ${sw('rx_rsw', on, `Turn ${n} on or off`)}
      <span class="ntr_menu">${btn('mvmenu', 'fa-share', `Move ${n} to a folder`)}</span>
      ${btn('edit', 'fa-pen', `Edit ${n}`)}
      ${btn('del', 'fa-trash', `Delete ${n}`, ' danger_button')}
    </div>`;
  }

  function secHtml(sec) {
    const v = view(sec);
    const s = settings();
    const hit = (x) => !query || (x.scriptName || '').toLowerCase().includes(query);
    const ok = allowed(sec);
    const fhtml = v.groups.map(({ f, items }) => {
      const list = items.filter(hit);
      if (query && !list.length) return '';
      const open = query ? true : !!s.uiOpen[openKey(f)];
      return `<div class="rx_folder${open ? ' rx_open' : ''}" data-fid="${esc(f.id)}">
        <div class="ntr_fold rx_fhead" tabindex="0" role="button" aria-expanded="${open}">
          ${query ? '' : '<i class="fa-solid fa-grip-lines ntr_grip rx_fgrip" title="Drag to reorder folders"></i>'}
          <i class="fa-solid fa-fw ${open ? 'fa-folder-open' : 'fa-folder'} rx_ficon"></i>
          <span class="rx_fname">${esc(f.name)} <span class="rx_count">${items.length}</span></span>
          ${sw('rx_fsw', items.some((x) => !x.disabled), `Turn ${esc(f.name)} on or off`, items.length ? '' : ' disabled')}
          <span class="ntr_menu">${btn('fmenu', 'fa-ellipsis', `More for ${esc(f.name)}`)}</span>
        </div>
        <div class="ntr_card rx_fbody">${list.map(rowHtml).join('') || '<div class="rx_empty">Empty. Drag a regex here.</div>'}</div>
      </div>`;
    }).join('');
    const loose = v.loose.filter(hit);
    // Regexes in no folder: always last, since SillyTavern adds new regexes at the end of its list.
    const looseHtml = !query || loose.length ? `<div class="rx_ublock">
        <div class="ntr_fold rx_uhead"><i class="fa-solid fa-fw fa-inbox rx_ficon"></i><span class="rx_fname">No Folder <span class="rx_count">${v.loose.length}</span></span></div>
        <div class="ntr_card rx_loose">${loose.map(rowHtml).join('') || `<div class="rx_empty">${v.groups.length ? 'Drag or move a regex here to take it out of its folder.' : 'No regexes here yet.'}</div>`}</div>
      </div>` : '';
    const allowTitle = sec.k === 'preset' ? 'Let this preset\'s regexes run' : 'Let this character\'s regexes run';
    return `<div class="rx_sec${ok ? '' : ' rx_secoff'}" data-sec="${sec.k}">
      <div class="ntr_parthead rx_shead">
        <i class="fa-solid fa-fw ${sec.icon} ntr_part_icon"></i>
        ${sec.k === 'global' ? `<h4 class="ntr_parttitle">${sec.name}</h4>`
          : `<div class="rx_stitle"><h4 class="ntr_parttitle">${sec.name}</h4><div class="rx_sname" title="${esc(secName(sec))}">${esc(secName(sec))}</div></div>`}
        ${btn('new', 'fa-plus', `New ${sec.name} Regex`)}
        ${btn('newf', 'fa-folder-plus', 'New Folder')}
        <span class="ntr_menu">${btn('smenu', 'fa-ellipsis', `More for ${sec.name}`)}</span>
        ${sec.allow ? sw('rx_allow', ok, allowTitle) : ''}
      </div>
      ${ok || !v.order.length ? '' : '<div class="cb_hint">Off: these don\'t run until you switch them on.</div>'}
      ${v.same || query ? '' : `<div class="cb_hint rx_order">ST's run order no longer matches this list. <button class="menu_button" data-act="fixorder">Use This Order</button></div>`}
      <div class="rx_body">${fhtml}${looseHtml}</div>
    </div>`;
  }

  const listHtml = () => SECS.filter(shown).map(secHtml).join('');

  function sectionHtml() {
    if (!document.getElementById('ntr_rx_css')) {
      const st = document.createElement('style');
      st.id = 'ntr_rx_css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    if (!ready()) {
      const why = E ? 'ST\'s Regex extension is off. Turn it on in Manage Extensions to use this page.'
        : 'Couldn\'t reach ST\'s Regex extension, so this page can\'t show your regexes.';
      return pageHtml('regex', '', { sw: ['m_rx_enable', true], note: `<div class="cb_hint ntr_pnote">${why}</div>` });
    }
    return pageHtml('regex', `
      <div class="cb_hint">ST runs these top to bottom: Global, then Preset, then Character. Each regex works on what the ones above it left. Dragging here changes ST's order too; folders show only here.</div>
      <a class="rx_guide" href="https://sepsisshock.github.io/SillyTavernGuides/regex.html" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-book-open"></i>New to regexes? Learn the basics<i class="fa-solid fa-arrow-up-right-from-square fa-xs"></i></a>
      <div class="rx_top">
        <input type="search" class="text_pole rx_search" placeholder="Search regexes" aria-label="Search regexes" value="${esc(query)}">
      </div>
      <div class="rx_list">${listHtml()}</div>`, { sw: ['m_rx_enable', true] });
  }

  let page = null;
  let watcher = null;
  // Dragging regexes and folders (dragSort in index.js); a redraw waits until a drag is over.
  let drag = null;
  function refresh() {
    if (!page?.isConnected || drag?.busy()) return;
    const list = page.querySelector('.rx_list');
    if (list) list.innerHTML = listHtml();
  }

  function closePops() { A.closePops(page); }

  // Move to folder: the section's folders, No Folder, and New folder to make one and move the regex into it.
  function moveMenu(anchor, sec, id) {
    const cur = folders(sec).find((f) => f.ids.includes(id)) || null;
    const item = (fid, icon, label, here) => `<button data-act="mvto" data-fid="${esc(fid)}"${here ? ' class="ntr_here" disabled' : ''}><i class="fa-solid ${icon} fa-fw"></i>${esc(label)}</button>`;
    A.popMenu(anchor, folders(sec).map((f) => item(f.id, 'fa-folder', f.name, f === cur)).join('')
      + item('', 'fa-inbox', 'No Folder', !cur)
      + '<button data-act="mvnew"><i class="fa-solid fa-folder-plus fa-fw"></i>New Folder…</button>');
  }

  // Puts a regex in a folder (or No Folder) at the end of it, and SillyTavern's run order follows.
  function moveRegex(sec, id, fid) {
    const fl = folders(sec, true);
    for (const f of fl) {
      if (!f.ids.includes(id)) continue;
      f.ids = f.ids.filter((x) => x !== id);
      if (f.was) f.was = f.was.filter((x) => x !== id);
    }
    const to = fid ? fl.find((f) => f.id === fid) || null : null;
    if (to) to.ids.push(id);
    save();
    const v = view(sec);
    const ids = [
      ...v.groups.flatMap(({ f, items }) => [...items.map((x) => x.id).filter((x) => x !== id), ...(f === to ? [id] : [])]),
      ...v.loose.map((x) => x.id).filter((x) => x !== id),
      ...(to ? [] : [id]),
    ];
    if (ids.join('\n') !== scripts(sec).map((x) => x.id).join('\n')) reorder(sec, ids);
    else refresh();
  }

  function folderMenu(anchor, sec, f) {
    A.popMenu(anchor, `
      <button data-act="frename"><i class="fa-solid fa-pen fa-fw"></i>Rename</button>
      <button data-act="fnew"><i class="fa-solid fa-plus fa-fw"></i>New Regex Here</button>
      <button data-act="fimport"><i class="fa-solid fa-file-import fa-fw"></i>Import Here</button>
      <button data-act="fexport"><i class="fa-solid fa-file-export fa-fw"></i>Export Folder</button>
      <button data-act="fdelete" class="ntr_danger"><i class="fa-solid fa-trash fa-fw"></i>Delete Folder</button>`);
  }

  // A section's Import and Export, kept in a menu so its header has room on a phone.
  function sectionMenu(anchor, sec) {
    A.popMenu(anchor, `
      <button data-act="imp"><i class="fa-solid fa-file-import fa-fw"></i>Import ${sec.name} Regexes</button>
      <button data-act="exp"><i class="fa-solid fa-file-export fa-fw"></i>Export All ${sec.name} Regexes</button>`);
  }

  const nameCheck = (sec, self) => (v) => {
    if (!v) return { error: 'Type a name.' };
    if (folders(sec).some((x) => x !== self && x.name.toLowerCase() === v.toLowerCase())) return { error: 'A folder with that name already exists.' };
    return { value: v.slice(0, 60) };
  };

  async function onClick(e) {
    if (!e.target.closest('.ntr_menu')) closePops();
    const b = e.target.closest('[data-act]');
    const secEl = e.target.closest('.rx_sec');
    const sec = secEl ? secOf(secEl.dataset.sec) : null;
    const fEl = e.target.closest('.rx_folder');
    const f = fEl && sec ? folders(sec).find((x) => x.id === fEl.dataset.fid) : null;
    const id = e.target.closest('.rx_row')?.dataset.id;
    if (!b) {
      if (f && !query && e.target.closest('.rx_fhead') && !e.target.closest('input, .rx_swbox, .ntr_grip')) {
        const s = settings();
        s.uiOpen[openKey(f)] = !s.uiOpen[openKey(f)];
        save();
        refresh();
      }
      return;
    }
    const act = b.dataset.act;
    if (act !== 'fmenu') pending = null;
    switch (act) {
      case 'smenu': sectionMenu(b, sec); break;
      case 'imp': closePops(); importTo(sec); break;
      case 'new': stClick(document.getElementById(sec.add)); break;
      case 'newf': {
        const name = await askText(b, { label: 'Folder Name', ok: 'Add', check: nameCheck(sec, null) });
        if (!name) return;
        const nf = { id: newId('rxf'), name, ids: [], was: null };
        folders(sec, true).push(nf);
        settings().uiOpen[openKey(nf)] = true;
        save();
        refresh();
        break;
      }
      case 'exp': closePops(); download(scripts(sec), `regexes-${sec.name}`); break;
      case 'fixorder': reorder(sec, view(sec).order); break;
      case 'edit': stClick(stRow(sec, id)?.querySelector('.edit_existing_regex')); break;
      case 'del': stClick(stRow(sec, id)?.querySelector('.delete_regex')); break;
      case 'fmenu': folderMenu(b, sec, f); break;
      case 'mvmenu': moveMenu(b, sec, id); break;
      case 'mvto': closePops(); moveRegex(sec, id, b.dataset.fid || null); break;
      case 'mvnew': {
        const row = b.closest('.rx_row');
        closePops();
        const name = await askText(row, { label: 'Folder Name', ok: 'Add', check: nameCheck(sec, null) });
        if (!name) return;
        const nf = { id: newId('rxf'), name, ids: [], was: null };
        folders(sec, true).push(nf);
        settings().uiOpen[openKey(nf)] = true;
        moveRegex(sec, id, nf.id);
        break;
      }
      case 'frename': {
        closePops();
        const name = await askText(fEl.querySelector('.rx_fhead'), { label: 'Folder Name', value: f.name, ok: 'Rename', check: nameCheck(sec, f) });
        if (!name) return;
        f.name = name;
        save();
        refresh();
        break;
      }
      case 'fnew': closePops(); expect(sec, f, 'new'); stClick(document.getElementById(sec.add)); break;
      case 'fimport':
        closePops();
        expect(sec, f, 'import');
        importTo(sec);
        break;
      case 'fexport': closePops(); download(scripts(sec).filter((x) => f.ids.includes(x.id)), `regexes-${f.name}`); break;
      case 'fdelete': {
        closePops();
        const n = f.ids.length;
        const q = !n ? `Delete the folder "${f.name}"?`
          : `Delete the folder "${f.name}"? ${n === 1 ? 'Its regex stays' : `Its ${n} regexes stay`}, outside any folder.`;
        if (!(await askYes(fEl.querySelector('.rx_fhead'), q, 'Delete', { danger: true }))) return;
        const fl = folders(sec);
        const i = fl.indexOf(f);
        if (i >= 0) fl.splice(i, 1);
        delete settings().uiOpen[openKey(f)];
        save();
        // The page shows loose regexes after every folder, so the run order follows.
        const v = view(sec);
        if (!v.same) reorder(sec, v.order); else refresh();
        break;
      }
    }
  }

  function onChange(e) {
    const t = e.target;
    const secEl = t.closest('.rx_sec');
    const sec = secEl ? secOf(secEl.dataset.sec) : null;
    if (!sec) return;
    pending = null;
    if (t.classList.contains('rx_rsw')) setOn(sec, t.closest('.rx_row').dataset.id, t.checked);
    else if (t.classList.contains('rx_allow')) $(document.getElementById(sec.allow)).prop('checked', t.checked).trigger('input');
    else if (t.classList.contains('rx_fsw')) {
      const f = folders(sec).find((x) => x.id === t.closest('.rx_folder').dataset.fid);
      if (!f) return;
      const ids = folderFlip(f, scripts(sec).filter((x) => f.ids.includes(x.id)), t.checked);
      save();
      if (ids.length) setMany(sec, ids, t.checked);
      else {
        toastr.info('The regexes that were on when this folder was switched off are gone, so nothing turned on.', 'Regexes');
        refresh();
      }
    }
  }

  // ===== Dragging: by the grip, with a mouse or a finger (dragSort in index.js) =====
  // A regex moves within its section, into a folder or out of one; a folder moves among the section's folders.
  function dragPick(grip) {
    if (query) return null;
    const folder = grip.classList.contains('rx_fgrip');
    return { item: folder ? grip.closest('.rx_folder') : grip.closest('.rx_row'), kind: folder ? 'folder' : 'regex', scope: grip.closest('.rx_sec') };
  }

  function dragPlace(el, d, after) {
    if (d.kind === 'folder') {
      const fol = el.closest('.rx_folder');
      if (fol && fol !== d.item) fol.parentElement.insertBefore(d.item, after(fol) ? fol.nextSibling : fol);
      return null;
    }
    const row = el.closest('.rx_row');
    if (row && row !== d.item) { row.parentElement.insertBefore(d.item, after(row) ? row.nextSibling : row); return null; }
    const head = el.closest('.rx_fhead, .rx_uhead');
    if (head) {
      // Dropped on a header, it goes first in that folder, so the gap shows right under the pointer. A closed folder
      // hides the gap, so its lit-up header shows where it goes.
      const fb = head.parentElement.querySelector('.rx_fbody, .rx_loose');
      if (fb.firstElementChild !== d.item) fb.insertBefore(d.item, fb.firstChild);
      return head;
    }
    const box = el.closest('.rx_fbody, .rx_loose');
    if (box && !box.contains(d.item)) box.appendChild(d.item);
    return null;
  }

  function dragDone(d) {
    if (!d.moved) { refresh(); return; }
    const sec = secOf(d.scope.dataset.sec);
    const fl = folders(sec, true);
    const fids = [...d.scope.querySelectorAll('.rx_folder')].map((el) => el.dataset.fid);
    fl.sort((a, b) => fids.indexOf(a.id) - fids.indexOf(b.id));
    const ids = [];
    for (const f of fl) {
      const fb = [...d.scope.querySelectorAll('.rx_folder')].find((el) => el.dataset.fid === f.id)?.querySelector('.rx_fbody');
      if (fb) f.ids = [...fb.querySelectorAll('.rx_row')].map((r) => r.dataset.id);
      if (f.was) f.was = f.was.filter((id) => f.ids.includes(id));
      ids.push(...f.ids);
    }
    ids.push(...[...d.scope.querySelectorAll('.rx_loose .rx_row')].map((r) => r.dataset.id));
    save();
    const now = scripts(sec).map((x) => x.id);
    if (ids.length === now.length && ids.join('\n') !== now.join('\n')) reorder(sec, ids);
    else refresh();
  }

  function bind(overlay) {
    watcher?.disconnect();
    watcher = null;
    page = overlay.querySelector('.ntr_page[data-page="regex"]');
    if (!page || !ready()) return;
    // SillyTavern redraws its Regex panel after every change, wherever it was made.
    let t = 0;
    watcher = new MutationObserver(() => {
      clearTimeout(t);
      t = setTimeout(() => {
        if (!page?.isConnected) { watcher?.disconnect(); return; }
        claimNew();
        refresh();
      }, 120);
    });
    SECS.forEach((sec) => { const l = stList(sec); if (l) watcher.observe(l, { childList: true }); });
    claimNew();
    page.addEventListener('click', onClick);
    page.addEventListener('change', onChange);
    drag = A.dragSort(page, { pick: dragPick, place: dragPlace, done: dragDone });
    page.addEventListener('input', (e) => {
      if (!e.target.classList.contains('rx_search')) return;
      query = e.target.value.trim().toLowerCase();
      refresh();
    });
    page.addEventListener('keydown', (e) => {
      const head = e.target.closest?.('.rx_fhead');
      if (head && e.target === head && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); head.click(); }
    });
  }

  // ===== Themes (index.js): which folders are on =====
  // Every folder with regexes SillyTavern can show right now: Global, the current preset's and the open character's.
  function states() {
    if (!ready()) return null;
    const out = {};
    for (const sec of SECS.filter(shown)) {
      for (const { f, items } of view(sec).groups) if (items.length) out[f.id] = items.some((x) => !x.disabled);
    }
    return out;
  }
  // Switches the folders a theme knows to how it saved them, turning on first, then off, so the chat reloads at most twice.
  // One theme at a time: a theme picked while another is still switching waits for it, and the older one skips any step
  // it hasn't started, so the last theme picked always wins. Switching the Regexes page off stops any step not started yet.
  let applying = Promise.resolve();
  let applyGen = 0;
  function applyStates(map) {
    const gen = ++applyGen;
    applying = applying.then(() => switchFolders(map, gen)).catch((e) => console.error('[NTR] Theme regex folders failed', e));
    return applying;
  }
  async function switchFolders(map, gen) {
    const live = () => gen === applyGen && settings().rxEnabled !== false;
    if (!ready() || !map || !live()) return;
    const on = [], off = [];
    for (const sec of SECS.filter(shown)) {
      for (const { f, items } of view(sec).groups) {
        if (typeof map[f.id] !== 'boolean' || !items.length || map[f.id] === items.some((x) => !x.disabled)) continue;
        const want = map[f.id];
        const ids = folderFlip(f, items, want);
        (want ? on : off).push(...items.filter((x) => ids.includes(x.id) && !x.disabled !== want).map((x) => x.id));
      }
    }
    save();
    await bulk(on, true);
    if (!live()) return;
    await bulk(off, false);
  }

  window.NTR.regex = { version: REGEX_VERSION, sectionHtml, bind, states, applyStates };
})();
