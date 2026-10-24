// Nitwit Tavern Redesign: Themes module.
// Loaded by index.js at start, for the Themes page. If this file breaks, the rest of the extension keeps working, and
// saved themes stay in the settings.
// A theme is a saved copy of the look settings (LOOK in index.js) and which regex folders are on. The core keeps what
// a theme holds, how old ones are upgraded and cleaned, and applying one; this file is the page that saves, renames,
// deletes, imports and exports them.
(() => {
  const THEMES_VERSION = '2.77.11';
  const A = window.NTR && window.NTR.api;
  if (!A) { console.error('[NTR] themes.js loaded without the core (index.js).'); return; }
  const { VERSION, DEFAULTS, LOOK, TAG_KEYS, settings, save, escapeHTML, pageHtml, card, askYes, askText, newId, loadModule, deleteFileIfUnused,
    lookSnapshot, applyLook, resetLook, upgradeTheme, cleanLookSection, validLookValue, collectFileRefs, readText, embedFiles, hasEmbedded,
    unpackFiles, isObj, stColor } = A;
  const { COLOR_FROM, rbCssText, RB_CSS } = A.look;
  const openCombinedModal = () => A.openMenu();

  // The parts with Custom CSS: their theme section, keys, name, where they're set, and the CSS shown on import (by
  // default the one key's). The Reasoning Block's three boxes show as one, each inside its part's selector.
  const CSS_PARTS = [
    ['reasoning', RB_CSS.map(([k]) => k), 'Reasoning Block', 'Elements, Reasoning Block', rbCssText],
    ['reasoning', ['ovScrollCss'], 'Scrollbar', 'Elements, Scrollbar'],
    ['reasoning', ['ovCursorCss'], 'Cursor', 'Elements, Cursor'],
    ['reasoning', ['ovQrCss'], 'Quick Replies', 'Elements, Quick Replies'],
    ['pfp', ['aiCss'], 'the AI avatar', 'Avatars, AI Avatar'],
    ['pfp', ['usCss'], 'the User avatar', 'Avatars, User Avatar'],
  ];

  function lookMatches(data) {
    const s = settings();
    for (const sec of Object.keys(data || {})) {
      if (!LOOK[sec]) continue;
      for (const k of Object.keys(data[sec])) {
        if (LOOK[sec].keys.includes(k) && JSON.stringify(s[k]) !== JSON.stringify(data[sec][k])) return false;
      }
    }
    return true;
  }

  function themesSectionHtml(s) {
    const cur = s.themes.some((t) => t.id === s.themeActive) ? s.themeActive : '';
    const opts = [['', 'Default Look'], ...s.themes.map((t) => [t.id, t.name])]
      .map(([v, l]) => `<option value="${escapeHTML(v)}"${v === cur ? ' selected' : ''}>${escapeHTML(l)}</option>`).join('');
    const b = (id, icon, title, extra = '') => `<button class="menu_button ${extra}" id="${id}" title="${title}" aria-label="${title}"><i class="fa-solid ${icon}"></i></button>`;
    return pageHtml('themes', `
        <div class="cb_hint">Saves your look from the look pages, Reader Mode and Visual Novel Mode, the shared banner, and which regex folders are on. Anything saved per character stays out. Picking a theme applies it.</div>
        ${card('Saved Themes', `
          <select id="m_t_sel" class="text_pole ntr_tsel" aria-label="Theme">${opts}</select>
          <div class="ntr_tbar">
            ${b('m_t_new', 'fa-plus', 'Save as New Theme')}
            ${b('m_t_upd', 'fa-floppy-disk', 'Save Over Selected Theme')}
            ${b('m_t_ren', 'fa-pen', 'Rename Theme')}
            ${b('m_t_del', 'fa-trash', 'Delete Theme', 'danger_button')}
            ${b('m_t_imp', 'fa-file-import', 'Import Theme')}
            ${b('m_t_exp', 'fa-file-export', 'Export Theme')}
          </div>
          <div id="m_t_panel"></div>
          <input type="file" id="m_t_file" accept=".json,application/json" hidden>`, 'fa-swatchbook')}
    `);
  }

  function bindThemes(overlay, s) {
    const panel = overlay.querySelector('#m_t_panel');
    const sel = overlay.querySelector('#m_t_sel');
    const active = () => s.themes.find((t) => t.id === s.themeActive) || null;
    const need = () => { const t = active(); if (!t) toastr.info('Pick a theme first.', 'Themes'); return t; };
    const nameTaken = (name, self) => s.themes.some((t) => t !== self && t.name.toLowerCase() === name.toLowerCase());
    const secBoxes = (secs) => secs.map((k) => `<label class="checkbox_label"><input type="checkbox" class="m_t_sec" value="${k}" checked><span>${LOOK[k].label}</span></label>`).join('');
    // The menu fills empty colors with SillyTavern's own (see bindRows), so those count as default too.
    const atDefault = (k) => JSON.stringify(s[k]) === JSON.stringify(DEFAULTS[k]) || (k in COLOR_FROM && s[k] === stColor(k));
    // Unsaved: the look differs from the selected theme, or from the default look when Default Look is selected.
    const unsaved = () => { const t = active(); return t ? !lookMatches(t.data) : !Object.values(LOOK).every((L) => L.keys.every(atDefault)); };
    const shown = () => { sel.value = active() ? s.themeActive : ''; };

    const tbar = overlay.querySelector('.ntr_tbar');
    const askName = (value, self = null) => askText(tbar, {
      label: 'Theme Name',
      value,
      ok: '<i class="fa-solid fa-floppy-disk"></i> Save',
      check: (name) => (!name ? { error: 'Type a name first.' }
        : nameTaken(name, self) ? { error: 'A theme with that name already exists.' } : { value: name }),
    });

    // Which regex folders are on (regex.js) is kept with a theme, outside its look settings, and never exported.
    // With the Regexes page off, themes leave regex folders alone.
    const regexStates = async () => (s.rxEnabled ? (await loadModule('regex'))?.states?.() || null : null);
    const saveNew = async () => {
      const name = await askName(`Theme ${s.themes.length + 1}`);
      if (!name) return;
      const t = { id: newId('th'), name, data: lookSnapshot() };
      const rs = await regexStates();
      if (rs) t.regex = rs;
      s.themes.push(t);
      s.themeActive = t.id;
      save();
      openCombinedModal();
      toastr.success(`Saved "${name}"`, 'Themes');
    };

    sel.onchange = async () => {
      const t = s.themes.find((x) => x.id === sel.value);
      const q = t ? `Your current look isn't saved as a theme and will be replaced. Apply "${t.name}" anyway?`
        : 'Your current look isn\'t saved as a theme. Go back to the default look?';
      if (unsaved() && !(await askYes(tbar, q, t ? 'Apply' : 'Reset'))) { shown(); return; }
      if (!t) { resetLook(); openCombinedModal(); return; }
      s.themeActive = t.id;
      applyLook(t.data);
      openCombinedModal();
      if (t.regex && s.rxEnabled) (await loadModule('regex'))?.applyStates?.(t.regex);
    };

    overlay.querySelector('#m_t_new').onclick = saveNew;

    // Default Look can't be overwritten, so saving over it makes a new theme.
    overlay.querySelector('#m_t_upd').onclick = async () => {
      const t = active();
      if (!t) { saveNew(); return; }
      if (!(await askYes(tbar, `Save your current look over "${t.name}"?`, 'Save'))) return;
      const oldRefs = collectFileRefs(t.data);
      t.data = lookSnapshot();
      const rs = await regexStates();
      if (rs) t.regex = rs;
      save();
      oldRefs.forEach((p) => deleteFileIfUnused(p));
      openCombinedModal();
      toastr.success(`Updated "${t.name}"`, 'Themes');
    };

    overlay.querySelector('#m_t_ren').onclick = async () => {
      const t = need();
      if (!t) return;
      const name = await askName(t.name, t);
      if (!name || name === t.name) return;
      t.name = name;
      save();
      openCombinedModal();
    };

    overlay.querySelector('#m_t_del').onclick = async () => {
      const t = need();
      if (!t || !(await askYes(tbar, `Delete the theme "${t.name}"? Your current look stays as it is.`, 'Delete', { danger: true }))) return;
      const refs = collectFileRefs(t.data);
      s.themes = s.themes.filter((x) => x !== t);
      s.themeActive = null;
      save();
      refs.forEach((p) => deleteFileIfUnused(p));
      openCombinedModal();
    };

    overlay.querySelector('#m_t_exp').onclick = () => {
      const t = active();
      const data = t ? t.data : lookSnapshot();
      const name = t ? t.name : 'My Look';
      const secs = Object.keys(LOOK).filter((k) => data[k]);
      const nImg = collectFileRefs(data).size;
      panel.innerHTML = `
        <div class="ntr_tpanel">
          <strong><i class="fa-solid fa-fw fa-file-export ntr_glab_icon"></i>Export "${escapeHTML(name)}"</strong>
          <div class="cb_plab">Sections</div>
          ${secBoxes(secs)}
          ${nImg ? `<label class="checkbox_label" style="margin-top:4px;"><input type="checkbox" id="m_t_img" checked><span>Include Pictures (${nImg})</span></label>
          <div class="cb_hint">Needed on another install.</div>` : ''}
          <div class="cb_actions">
            <button class="menu_button" id="m_t_dl"><i class="fa-solid fa-download"></i> Download</button>
            <button class="menu_button" id="m_t_cancel">Cancel</button>
          </div>
        </div>`;
      panel.querySelector('#m_t_cancel').onclick = () => { panel.innerHTML = ''; };
      panel.querySelector('#m_t_dl').onclick = async () => {
        const chosen = [...panel.querySelectorAll('.m_t_sec:checked')].map((c) => c.value);
        if (!chosen.length) { toastr.warning('Tick at least one section.', 'Themes'); return; }
        let sections = Object.fromEntries(chosen.map((k) => [k, data[k]]));
        if (panel.querySelector('#m_t_img')?.checked && collectFileRefs(sections).size) {
          const r = await embedFiles(sections);
          sections = r.data;
          if (r.fails) toastr.warning(`${r.fails} picture(s) couldn't be read and were left as links.`, 'Themes');
        }
        const out = { ntrTheme: 1, version: VERSION, name, sections };
        const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${name.replace(/[^\w\- ]+/g, '').trim() || 'theme'}.ntr-theme.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        panel.innerHTML = '';
      };
    };

    const tf = overlay.querySelector('#m_t_file');
    overlay.querySelector('#m_t_imp').onclick = () => tf.click();
    tf.onchange = async () => {
      const f = tf.files[0];
      tf.value = '';
      if (!f) return;
      let j;
      try { j = JSON.parse(await readText(f)); } catch (e) { toastr.error('That file isn\'t valid JSON.', 'Themes'); return; }
      if (!j || j.ntrTheme !== 1 || !j.sections || typeof j.sections !== 'object') { toastr.error('That isn\'t a Nitwit Tavern Redesign theme file.', 'Themes'); return; }
      upgradeTheme(j.sections);
      // Cleaned once for the preview. Adding cleans again, since the clash checks follow the settings, which can change meanwhile.
      const cleaned = Object.fromEntries(Object.keys(LOOK).map((k) => [k, cleanLookSection(k, j.sections[k])]));
      const secs = Object.keys(LOOK).filter((k) => Object.keys(cleaned[k]).length);
      // Tag symbols that are fine one by one but clash together get left out (see cleanLookSection); say so, so it's clear why yours stay.
      const vnIn = isObj(j.sections.vn) ? j.sections.vn : {};
      const tagsOut = TAG_KEYS.some((k) => k in vnIn && validLookValue(k, vnIn[k])) && !TAG_KEYS.some((k) => k in cleaned.vn);
      if (!secs.length) {
        toastr.error(`That theme file has nothing this version can use.${tagsOut ? ' Its tag symbols and keywords clash with yours, so they\'re left out.' : ''}`, 'Themes');
        return;
      }
      // Someone else's Custom CSS can restyle all of SillyTavern, so it's shown here and comes in switched off.
      const cssIn = CSS_PARTS.map(([sec, keys, name, where, text = (get) => String(get(keys[0]) || '').trim()]) => [name, where, text((k) => cleaned[sec][k])])
        .filter(([, , css]) => css);
      panel.innerHTML = `
        <div class="ntr_tpanel">
          <strong><i class="fa-solid fa-fw fa-file-import ntr_glab_icon"></i>Import Theme</strong>
          <label>Name <input type="text" id="m_t_iname" class="text_pole" value="${escapeHTML(String(j.name || 'Imported Theme'))}"></label>
          <div class="cb_plab">Sections</div>
          ${secBoxes(secs)}
          ${cssIn.map(([name, where, css]) => `<div class="cb_hint">This theme has Custom CSS for ${name}. It comes in switched off: check it under ${where}, Advanced: Custom CSS, then tick it.</div>
          <pre class="cb_code" style="max-height: 140px; overflow: auto; margin: 0;">${escapeHTML(css)}</pre>`).join('')}
          ${tagsOut ? '<div class="cb_hint">This theme\'s tag symbols and keywords (Avatars, Emotions, Tags and Delimiters) clash with each other or with yours, so they\'re left out and yours stay.</div>' : ''}
          <div class="cb_actions">
            <button class="menu_button" id="m_t_add"><i class="fa-solid fa-plus"></i> Add Theme</button>
            <button class="menu_button" id="m_t_cancel">Cancel</button>
          </div>
        </div>`;
      panel.querySelector('#m_t_cancel').onclick = () => { panel.innerHTML = ''; };
      panel.querySelector('#m_t_add').onclick = async () => {
        const chosen = [...panel.querySelectorAll('.m_t_sec:checked')].map((c) => c.value);
        if (!chosen.length) { toastr.warning('Tick at least one section.', 'Themes'); return; }
        let name = panel.querySelector('#m_t_iname').value.trim() || 'Imported Theme';
        const base = name;
        for (let n = 2; nameTaken(name); n++) name = `${base} (${n})`;
        let data = Object.fromEntries(chosen.map((k) => [k, cleanLookSection(k, j.sections[k])]));
        for (const [sec, keys] of CSS_PARTS) for (const k of keys) if (data[sec] && String(data[sec][k] || '').trim()) data[sec][k + 'On'] = false;
        if (hasEmbedded(data)) {
          toastr.info('Uploading the theme\'s pictures...', 'Themes');
          const r = await unpackFiles(data);
          data = r.data;
          if (r.fails) toastr.warning(`${r.fails} picture(s) couldn't be uploaded.`, 'Themes');
        }
        s.themes.push({ id: newId('th'), name, data });
        save();
        openCombinedModal();
        toastr.success(`Added "${name}". Pick it in the list to apply it.`, 'Themes');
      };
    };
  }

  window.NTR.themes = { version: THEMES_VERSION, sectionHtml: themesSectionHtml, bind: bindThemes };
})();
