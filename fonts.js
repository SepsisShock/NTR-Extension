// Nitwit Tavern Redesign: Font List module: the list of Google fonts under every font box in the menu, each name shown in
// its own font, and the box's own preview. Loaded by index.js when the menu opens. If this file breaks, the rest of the
// extension keeps working: the font boxes stay plain text boxes, and the fonts they name still load in the chat.
// The boxes, their settings and the chat's fonts (ovFont, fontName, syncGoogleFonts) stay in index.js; this file builds
// from what it shares in window.NTR.api.
(() => {
  const FONTS_VERSION = '2.86.25';
  const A = window.NTR && window.NTR.api;
  if (!A) { console.error('[NTR] fonts.js loaded without the core (index.js).'); return; }
  const { cleanFont, closePops, fontName, popMenu } = A;

  // The list in every font box: Google fonts that read well in a chat, by kind, with the generic family each falls back to.
  const FONT_PRESETS = [
    ['Serif', 'serif', ['Lora', 'Merriweather', 'EB Garamond', 'Crimson Pro', 'Playfair Display', 'Libre Baskerville', 'Literata']],
    ['Sans Serif', 'sans-serif', ['Inter', 'Nunito', 'Open Sans', 'Atkinson Hyperlegible']],
    ['Handwriting', 'cursive', ['Caveat', 'Dancing Script', 'Patrick Hand', 'Kalam']],
    ['Display', 'sans-serif', ['Cinzel', 'Bebas Neue', 'Righteous', 'Creepster', 'Special Elite', 'Press Start 2P']],
    ['Monospace', 'monospace', ['JetBrains Mono', 'Courier Prime', 'IBM Plex Mono']],
  ];
  const PRESET_NAMES = FONT_PRESETS.flatMap(([, , names]) => names);
  const PRESET_TEXT = [...new Set(PRESET_NAMES.join(''))].join('');
  // Google only knows a name in its own capitals, so a listed font typed as "lora" is saved as "Lora".
  const PRESET_CASE = new Map(PRESET_NAMES.map((n) => [n.toLowerCase(), n]));

  // Font previews in the menu load from Google with only the letters they show, under their own names ("NTR Preview
  // Lora"), so a cut-down copy never stands in for the real font in the chat. Each name is asked for once a session:
  // 'ok', 'miss' (Google has no such font), or the request while it runs. A failed connection isn't kept, so the next
  // menu tries again.
  const fontPreviews = new Map();
  const previewFamily = (f) => `'NTR Preview ${f}', '${f}'`;
  function loadPreviews(names, text) {
    const want = [...new Set(names)].filter((n) => !fontPreviews.has(n));
    if (want.length) {
      const url = 'https://fonts.googleapis.com/css2?' + want.map((n) => 'family=' + encodeURIComponent(n).replace(/%20/g, '+')).join('&')
        + '&text=' + encodeURIComponent(text) + '&display=swap';
      const req = fetch(url).then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); }).then((css) => {
        let tag = document.getElementById('ntr_font_previews');
        if (!tag) { tag = document.createElement('style'); tag.id = 'ntr_font_previews'; document.head.appendChild(tag); }
        tag.textContent += css.replace(/font-family:\s*'([^']+)'/g, (m, f) => `font-family: 'NTR Preview ${cleanFont(f)}'`);
        want.forEach((n) => fontPreviews.set(n, 'ok'));
      // Google answers an unknown name with an error the page isn't allowed to read, so for one name a second request
      // that doesn't need reading tells that answer apart from no connection. One unknown name fails a whole batch.
      }).catch(() => (want.length > 1 ? Promise.resolve(null) : fetch(url, { mode: 'no-cors' }).then(() => 'miss', () => null))
        .then((v) => want.forEach((n) => (v ? fontPreviews.set(n, v) : fontPreviews.delete(n)))));
      want.forEach((n) => fontPreviews.set(n, req));
    }
    return Promise.all(names.map((n) => fontPreviews.get(n)).filter((v) => v instanceof Promise));
  }
  // A font box shows its text in that font, and the note under it when Google has no font by that name.
  const MISS = 'Not on Google Fonts. A font on your device with this name still works.';
  function fontLook(el) {
    const f = cleanFont(el.value);
    const miss = el.parentElement.nextElementSibling;
    el.style.fontFamily = f ? `${previewFamily(f)}, var(--mainFontFamily)` : '';
    miss.textContent = MISS;
    miss.hidden = true;
    if (f) loadPreviews([f], f).then(() => { if (cleanFont(el.value) === f) miss.hidden = fontPreviews.get(f) !== 'miss'; });
  }

  // The list under a font box, in a popMenu: clicking into the box or its button opens all of it, with the current
  // font marked; typing keeps only the names that hold what's typed. Arrow keys move, Enter picks, Esc closes, and so
  // does leaving the box. The box keeps the focus throughout, so anything else typed still works as before.
  let fontLists = 0;
  function bindFontBox(el) {
    const box = el.parentElement;
    box.classList.add('ntr_menu');
    for (const [k, v] of [['role', 'combobox'], ['aria-expanded', 'false'], ['aria-autocomplete', 'list'], ['autocomplete', 'off'], ['spellcheck', 'false'],
      ['placeholder', 'Pick from the list, or type a name or link']]) el.setAttribute(k, v);
    el.insertAdjacentHTML('afterend', '<button type="button" class="ntr_fbtn" tabindex="-1" aria-label="Font List"><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>');
    const id = 'ntr_flist' + (++fontLists);
    let active = -1;
    const pop = () => box.querySelector('.ntr_pop');
    const opts = () => [...(pop()?.querySelectorAll('[role="option"]') || [])];
    const mark = () => {
      const list = opts();
      list.forEach((o, i) => o.classList.toggle('ntr_on', i === active));
      if (list[active]) { el.setAttribute('aria-activedescendant', list[active].id); list[active].scrollIntoView({ block: 'nearest' }); }
      else el.removeAttribute('aria-activedescendant');
    };
    const listHtml = (q) => {
      const cur = cleanFont(el.value).toLowerCase();
      const term = q.trim().toLowerCase();
      const groups = FONT_PRESETS.map(([g, fb, names]) => [g, fb, names.filter((n) => n.toLowerCase().includes(term))]).filter(([, , names]) => names.length);
      let i = 0;
      return groups.length ? `<div role="listbox" id="${id}" aria-label="Fonts">${groups.map(([g, fb, names]) => `
        <div role="group" aria-label="${g}"><div class="ntr_fgroup" aria-hidden="true">${g}</div>${names.map((n) => `
          <div role="option" id="${id}_${i++}" class="ntr_fopt" data-font="${n}" aria-selected="${n.toLowerCase() === cur}" style="font-family: ${previewFamily(n)}, ${fb};">${n}${n.toLowerCase() === cur ? '<i class="fa-solid fa-check" aria-hidden="true"></i>' : ''}</div>`).join('')}</div>`).join('')}</div>` : '';
    };
    // The list fits in the part of the menu that shows under the box. The menu scrolls to make room for the list's
    // full height, but never past the box's top, so what's typed stays in sight in a short menu.
    const fit = (p) => {
      const body = el.closest('.ntr_body');
      if (!body) return;
      const full = Math.min(300, innerHeight * 0.4);
      const room = () => body.getBoundingClientRect().bottom - box.getBoundingClientRect().bottom - 8;
      const short = full - room();
      if (short > 0) body.scrollTop += Math.min(short, box.getBoundingClientRect().top - body.getBoundingClientRect().top);
      p.style.maxHeight = `${Math.max(0, Math.min(full, room()))}px`;
    };
    const close = () => { closePops(box); active = -1; el.removeAttribute('aria-activedescendant'); };
    // Picked like typed: the core saves it on the change.
    const pick = (f) => { el.value = f; close(); el.dispatchEvent(new Event('change', { bubbles: true })); };
    // q is what's typed, or '' for the whole list.
    const open = (q) => {
      if (el.closest('.cb_dim')) return;
      const html = listHtml(q);
      if (!html) { close(); return; }
      let p = pop();
      if (p) p.innerHTML = html;
      else {
        p = popMenu(el, html);
        p.classList.add('ntr_flist');
        p.onmousedown = (e) => e.preventDefault();
        p.onclick = (e) => { const o = e.target.closest('[role="option"]'); if (o) pick(o.dataset.font); };
        el.setAttribute('aria-controls', id);
        loadPreviews(PRESET_NAMES, PRESET_TEXT);
        fit(p);
      }
      active = q ? 0 : opts().findIndex((o) => o.getAttribute('aria-selected') === 'true');
      mark();
    };
    const btn = box.querySelector('.ntr_fbtn');
    btn.onmousedown = (e) => e.preventDefault();
    btn.onclick = () => { if (pop()) close(); else { el.focus(); open(''); } };
    el.addEventListener('click', () => { if (!pop()) open(''); });
    el.addEventListener('input', () => open(el.value));
    el.addEventListener('blur', close);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!pop()) { open(''); return; }
        active = Math.max(0, Math.min(opts().length - 1, active + (e.key === 'ArrowDown' ? 1 : -1)));
        mark();
      } else if (e.key === 'Enter' && opts()[active]) {
        e.preventDefault();
        pick(opts()[active].dataset.font);
      } else if (e.key === 'Escape' && pop()) {
        e.preventDefault();
        e.stopPropagation();
        close();
      }
    });
    fontLook(el);
  }

  // Adds the list to a drawn menu's font boxes. The core saves a box on its change (bindRows); first the name of a
  // listed font gets Google's capitals, and after the save the box shows the new font. Each draw of the menu is a new
  // menu, and calls this once.
  function bind(overlay) {
    overlay.addEventListener('change', (e) => {
      if (!e.target.matches('.m_o_txt')) return;
      const f = fontName(e.target.value);
      e.target.value = PRESET_CASE.get(f.toLowerCase()) || f;
    }, true);
    overlay.addEventListener('change', (e) => { if (e.target.matches('.m_o_txt')) fontLook(e.target); });
    overlay.querySelectorAll('.m_o_txt').forEach((el) => bindFontBox(el));
  }

  // What index.js calls.
  window.NTR.fonts = {
    version: FONTS_VERSION,
    bind,
  };
})();
