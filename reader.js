// Nitwit Tavern Redesign: Reader Mode module.
// Loaded on demand by index.js, once Reader Mode is switched on. If this file breaks, the rest of the extension keeps working.
// Shows the chat a page at a time. The messages are SillyTavern's own, so swipes, editing and the "..." menu keep working.
// Messages on other pages are only hidden on screen, like Visual Novel Mode does: they stay in the prompt.
// Two styles: Plain (a page scrolls when it's long) and Book (an open book across the screen, the text flowing over both
// pages and on to the next two pages).
(() => {
  const READER_VERSION = '2.35.0';
  const A = window.NTR && window.NTR.api;
  if (!A) { console.error('[NTR] reader.js loaded without the core (index.js).'); return; }
  const { ctx, settings, isOn } = A;

  // The page bar sits between the chat and the send box, with the chat's own background.
  const CSS = `
    #ntr_rd_bar { display: flex; align-items: center; justify-content: center; gap: 4px; flex: 0 0 auto; padding: 3px 6px; z-index: 30;
      background-color: var(--SmartThemeChatTintColor); backdrop-filter: blur(var(--SmartThemeBlurStrength)); -webkit-backdrop-filter: blur(var(--SmartThemeBlurStrength));
      border-top: 1px solid var(--SmartThemeBorderColor); color: var(--SmartThemeBodyColor); font-size: calc(var(--mainFontSize) * 0.9); }
    #ntr_rd_bar button { border: none; background: none; color: inherit; cursor: pointer; padding: 4px 10px; border-radius: 6px; opacity: .8; }
    #ntr_rd_bar button:hover:not(:disabled) { opacity: 1; background: rgba(255,255,255,.08); }
    #ntr_rd_bar button:disabled { opacity: .3; cursor: default; }
    #ntr_rd_bar .ntr_rd_num { min-width: 8em; text-align: center; white-space: nowrap; }
    #ntr_rd_bar .ntr_rd_num i { margin-right: 6px; opacity: .7; }
    #ntr_rd_toggle.cb_on { color: var(--SmartThemeQuoteColor, #6cf); }
  `;

  // The built-in book: an open book drawn in code, 3:2. Its page areas are where the Book settings start (see DEFAULTS).
  const BOOK_RATIO = 1.5;
  const BOOK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1500 1000" preserveAspectRatio="none">
    <defs>
      <linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b3a24"/><stop offset="1" stop-color="#4a2716"/></linearGradient>
      <linearGradient id="l" x1="0" x2="1"><stop offset="0" stop-color="#e6d6b2"/><stop offset=".06" stop-color="#f1e6cb"/><stop offset=".8" stop-color="#f4ead2"/><stop offset=".96" stop-color="#ddcaa0"/><stop offset="1" stop-color="#c4ad80"/></linearGradient>
      <linearGradient id="r" x1="0" x2="1"><stop offset="0" stop-color="#c4ad80"/><stop offset=".04" stop-color="#ddcaa0"/><stop offset=".2" stop-color="#f4ead2"/><stop offset=".94" stop-color="#f1e6cb"/><stop offset="1" stop-color="#e6d6b2"/></linearGradient>
    </defs>
    <rect x="0" y="0" width="1500" height="1000" rx="30" fill="url(#c)"/>
    <rect x="8" y="8" width="1484" height="984" rx="24" fill="none" stroke="#2e170c" stroke-width="4" opacity=".5"/>
    <rect x="34" y="40" width="716" height="934" fill="#cdb98f"/><rect x="750" y="40" width="716" height="934" fill="#cdb98f"/>
    <rect x="38" y="34" width="712" height="936" fill="#dccaa2"/><rect x="750" y="34" width="712" height="936" fill="#dccaa2"/>
    <rect x="42" y="26" width="708" height="940" fill="url(#l)"/><rect x="750" y="26" width="708" height="940" fill="url(#r)"/>
    <rect x="747" y="26" width="6" height="940" fill="#7a6440" opacity=".45"/>
  </svg>`;
  const BOOK_URI = 'data:image/svg+xml,' + encodeURIComponent(BOOK_SVG);
  // The ink the built-in book starts with; empty or broken colors fall back to it.
  const INK = { rdInk: '#2b2118', rdInkEm: '#6b4f2a', rdInkQuote: '#7a2e1e' };
  const COLOR_OK = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\))$/i;

  const live = () => isOn() && !!settings().rdEnabled;
  // Book on a computer, and on a phone held sideways. An upright phone is too narrow for two pages, so it shows Plain.
  const bookNow = () => live() && settings().rdStyle === 'book' && (window.innerWidth > 1000 || window.innerWidth > window.innerHeight);
  // Each page is [first, last] message number (mesid).
  let pages = [];
  let cur = 0;
  // On the last page: new pages are followed, so a new reply shows as it arrives.
  let follow = true;
  let obs = null, queued = false, turning = false;
  // The first message of the page on screen, as it is in the chat.
  let shownMsg = null;
  // Book: the two pages on screen (a spread) out of the spreads this page's messages fill, and the book's size and place.
  let spread = 0, spreads = 1, geom = null;

  const chatEl = () => document.getElementById('chat');
  const drawnMes = () => [...document.querySelectorAll('#chat > .mes[mesid]')];
  const mesNum = (el) => Number(el.getAttribute('mesid'));
  // The first message SillyTavern has drawn.
  const drawnFrom = () => { const d = drawnMes(); return d.length ? mesNum(d[0]) : Infinity; };
  const editing = () => document.body.classList.contains('ntr_bk_edit');
  const booked = () => !!geom && !editing();

  // Pages are counted from the whole chat, not just the messages SillyTavern has drawn. A page starts at each of your
  // messages and holds the replies after it; the messages before your first one (the opening) are page 1.
  function build() {
    const chat = ctx().chat || [];
    const drawn = drawnMes();
    // A reply being written can be drawn a moment before it's in the chat.
    const n = Math.max(chat.length, drawn.length ? mesNum(drawn[drawn.length - 1]) + 1 || 0 : 0);
    const one = settings().rdPer === 'one';
    const out = [];
    for (let i = 0; i < n; i++) {
      if (one || !out.length || chat[i]?.is_user) out.push([i, i]);
      else out[out.length - 1][1] = i;
    }
    return out;
  }

  // Hides every message that isn't on the page, and SillyTavern's "Show more messages" (turning back loads them). In the
  // book the page's messages are plain blocks, so their text can run from one page on to the next.
  function paint() {
    let el = document.getElementById('ntr_rd_css');
    const on = live() && pages.length;
    if (!on) { el?.remove(); shownMsg = null; return; }
    if (!el) { el = document.createElement('style'); el.id = 'ntr_rd_css'; document.head.appendChild(el); }
    const [a, b] = pages[cur];
    shownMsg = ctx().chat?.[a] || null;
    const ids = [];
    for (let i = a; i <= b; i++) ids.push(`[mesid="${i}"]`);
    el.textContent = `
    #chat > .mes:not(${ids.join(', ')}) { display: none !important; }
    #chat > #show_more_messages { display: none !important; }
    body.ntr_book #chat > .mes:is(${ids.join(', ')}) { display: block !important; }
    `;
    watchText();
  }

  function syncBar() {
    if (!document.getElementById('ntr_rd_style')) {
      const st = document.createElement('style');
      st.id = 'ntr_rd_style';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    let bar = document.getElementById('ntr_rd_bar');
    const form = document.getElementById('form_sheld');
    if (!live() || !form) { bar?.remove(); return; }
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'ntr_rd_bar';
      bar.setAttribute('role', 'navigation');
      bar.setAttribute('aria-label', 'Reader Mode pages');
      bar.innerHTML = `
        <button type="button" data-go="first" title="First page"><i class="fa-solid fa-angles-left"></i></button>
        <button type="button" data-go="prev" title="Previous page (Page Up)"><i class="fa-solid fa-angle-left"></i></button>
        <span class="ntr_rd_num"></span>
        <button type="button" data-go="next" title="Next page (Page Down)"><i class="fa-solid fa-angle-right"></i></button>
        <button type="button" data-go="last" title="Last page"><i class="fa-solid fa-angles-right"></i></button>`;
      bar.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-go]');
        if (!b) return;
        const k = b.dataset.go;
        if (k === 'next' || k === 'prev') turn(k === 'next' ? 1 : -1, 'top');
        else if (k === 'first') { if (cur === 0) showSpread(0); else go(0, 'top'); }
        // In the book, Last goes to the last two pages of the last page.
        else if (!booked()) go(pages.length - 1, 'top');
        else if (cur === pages.length - 1) showSpread(Infinity);
        else go(pages.length - 1, 'bottom');
      });
    }
    if (bar.nextElementSibling !== form) form.before(bar);
    placeBar();
    const n = pages.length;
    const sp = booked() && spreads > 1 ? ` · ${spread + 1} of ${spreads}` : '';
    bar.querySelector('.ntr_rd_num').innerHTML = `<i class="fa-solid fa-book-open"></i>${n ? `Page ${cur + 1} of ${n}${sp}` : 'No pages'}`;
    const atStart = cur <= 0 && (!booked() || spread <= 0);
    const atEnd = cur >= n - 1 && (!booked() || spread >= spreads - 1);
    bar.querySelector('[data-go="first"]').disabled = bar.querySelector('[data-go="prev"]').disabled = atStart;
    bar.querySelector('[data-go="last"]').disabled = bar.querySelector('[data-go="next"]').disabled = atEnd;
  }

  // A Free send bar (Layout) over the bottom of the chat panel would cover the page bar, so the page bar sits on top of it.
  let formRo = null;
  function placeBar() {
    const bar = document.getElementById('ntr_rd_bar');
    const sheld = document.getElementById('sheld');
    const form = document.getElementById('form_sheld');
    if (!bar || !sheld || !form) return;
    let room = 0;
    if (A.sendFree()) {
      if (!formRo && window.ResizeObserver) (formRo = new ResizeObserver(() => { placeBar(); if (geom) layoutBook(); })).observe(form);
      const s = sheld.getBoundingClientRect(), f = form.getBoundingClientRect();
      if (f.height && f.left < s.right && f.right > s.left && f.top < s.bottom && f.top > s.top + s.height / 2) room = Math.ceil(s.bottom - f.top);
    }
    const v = room ? room + 'px' : '';
    if (bar.style.marginBottom !== v) bar.style.marginBottom = v;
    // The chat's own room for the send bar is measured again now that the page bar takes it.
    A.syncSendRoom?.();
  }

  // ----- Book -----
  // A picture link as it goes into the CSS. Links with characters that could break out of url("") use the built-in book.
  const cssUrl = (u) => (u && !/["\\\n\r]/.test(u) ? `url("${u}")` : `url("${BOOK_URI}")`);
  // Your own picture keeps its own shape, known once it has loaded.
  const ratios = new Map();
  function ratioOf(u) {
    if (!u) return BOOK_RATIO;
    if (!ratios.has(u)) {
      ratios.set(u, 0);
      const img = new Image();
      img.onload = () => { ratios.set(u, img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 0); relayout(); };
      img.src = A.media(u);
    }
    return ratios.get(u) || BOOK_RATIO;
  }

  // The book's size and place on screen, and its CSS. It is centered under SillyTavern's menu bar, as wide as Book Width
  // allows, and shorter when the screen is too short for the picture's shape. The page bar and the send box sit under it.
  let bookCss = '';
  function layoutBook() {
    const on = bookNow();
    document.body.classList.toggle('ntr_book', on);
    if (!on) {
      geom = null;
      document.body.classList.remove('ntr_bk_edit');
      if (bookCss) { document.getElementById('ntr_bk_css')?.remove(); bookCss = ''; }
      return;
    }
    const s = settings();
    const n = (k) => A.rangeNum(s, k);
    const W = window.innerWidth, H = window.innerHeight;
    let left = 0, right = W, top = 0, bottom = H;
    const mb = document.getElementById('top-settings-holder')?.getBoundingClientRect();
    if (mb && mb.width && mb.height) {
      if (mb.width >= mb.height) { if (mb.top < H / 2) top = mb.bottom; else bottom = mb.top; }
      else if (mb.left < W / 2) left = mb.right; else right = mb.left;
    }
    const free = A.sendFree();
    const form = document.getElementById('form_sheld');
    const f = form?.getBoundingClientRect();
    if (free && f?.height && f.top > H / 2) bottom = Math.min(bottom, f.top);
    const below = (document.getElementById('ntr_rd_bar')?.offsetHeight || 0) + (free ? 0 : form?.offsetHeight || 0);
    const room = { w: right - left, h: bottom - top - below - 16 };
    const ratio = ratioOf(s.rdBookImg);
    let w = room.w * n('rdBookW') / 100, h = w / ratio;
    if (h > room.h) { h = Math.max(160, room.h); w = h * ratio; }
    const g = { x: left + (room.w - w) / 2, y: top + 8, w, h, pt: h * n('rdBookTop') / 100, pb: h * n('rdBookBottom') / 100, po: w * n('rdBookOuter') / 100, gap: w * n('rdBookSpine') / 100 };
    g.step = w - 2 * g.po + g.gap;
    g.col = (w - 2 * g.po - g.gap) / 2;
    geom = g;

    const px = (v) => `${Math.round(v * 10) / 10}px`;
    const col = (k) => (COLOR_OK.test(s[k]) ? s[k] : INK[k]);
    const font = s.rdBookFontOn ? A.cleanFont(s.rdBookFont) : '';
    const B = 'html body.ntr_book';
    const css = `
    ${B} #sheld { position: fixed !important; left: ${px(g.x)} !important; top: ${px(g.y)} !important; width: ${px(g.w)} !important; max-width: none !important;
      height: auto !important; max-height: none !important; right: auto !important; bottom: auto !important; margin: 0 !important; resize: none !important; }
    ${B} #sheld > #sheldheader { display: none !important; }
    ${B} #chat { flex: none !important; height: ${px(g.h)} !important; max-height: none !important; box-sizing: border-box !important; overflow: hidden !important;
      padding: ${px(g.pt)} ${px(g.po)} ${px(g.pb)} !important; background: ${cssUrl(s.rdBookImg)} center / 100% 100% no-repeat !important;
      border: none !important; border-radius: 0 !important; box-shadow: none !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important;
      text-shadow: none !important; scrollbar-width: none; will-change: auto !important; color: ${col('rdInk')};
      --SmartThemeBodyColor: ${col('rdInk')}; --SmartThemeEmColor: ${col('rdInkEm')}; --SmartThemeQuoteColor: ${col('rdInkQuote')}; --SmartThemeUnderlineColor: ${col('rdInk')}; }
    ${B}:not(.ntr_bk_edit) #chat { display: block !important; column-count: 2; column-gap: ${px(g.gap)}; column-fill: auto; }
    ${B}:not(.ntr_bk_edit) #chat::after { content: ''; display: block; height: 1px; break-before: column; }
    ${B}.ntr_bk_edit #chat { display: block !important; overflow-y: auto !important; }
    ${B} #chat > :not(.mes) { display: none !important; }
    ${B} #chat > .mes { padding: 0 0 .8em !important; margin: 0 !important; width: auto !important; min-height: 0 !important;
      background: none !important; border: none !important; border-radius: 0 !important; box-shadow: none !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
    ${B} #chat > .mes .mesAvatarWrapper { display: none !important; }
    /* SillyTavern's will-change on the chat would hold the swipe arrows below inside it; the book never scrolls up and down. */
    ${B} #chat > .mes .mes_block { display: block !important; overflow: visible !important; padding: 0 !important; margin: 0 !important; width: auto !important; }
    ${B} #chat > .mes .ch_name { font-size: .8em; margin-bottom: .3em; break-after: avoid; }
    ${B} #chat > .mes .mes_buttons { opacity: .35; transition: opacity .15s; }
    ${B} #chat > .mes:hover .mes_buttons { opacity: 1; }
    ${B} #chat .mes .name_text { color: ${col('rdInk')} !important; }
    ${B} #chat .mes .mes_text { color: ${col('rdInk')} !important;${font ? ` font-family: "${font}", var(--mainFontFamily) !important;` : ''} }
    ${B} #chat .mes .mes_text :is(i, em) { color: ${col('rdInkEm')} !important; }
    ${B} #chat .mes .mes_text q { color: ${col('rdInkQuote')} !important; }
    ${B} #chat .mes .mes_text q :is(i, em) { color: inherit !important; }
    ${B} #chat .mes .mes_text u { color: ${col('rdInk')} !important; }
    ${B} #chat .mes :is(.mes_text, .mes_text *, .name_text) { text-shadow: none !important; -webkit-text-stroke: 0 !important; }
    ${B} #chat .mes :is(.mes_text, .mes_media_wrapper) img { max-width: 100%; max-height: ${px(g.h - g.pt - g.pb - 8)}; break-inside: avoid; }
    ${B} #chat .mes :is(.swipe_left, .swipeRightBlock, .swipe_right, .swipes-counter) { color: ${col('rdInk')}; }
    ${B} #chat .mes .swipeRightBlock { position: fixed !important; left: ${px(g.x + g.w - g.po - 50)} !important; top: ${px(g.y + g.h - g.pb + 4)} !important; right: auto !important; bottom: auto !important; }
    ${B} #chat .mes .swipe_left { position: fixed !important; left: ${px(g.x + g.w - g.po - 90)} !important; top: ${px(g.y + g.h - g.pb + 4)} !important; right: auto !important; bottom: auto !important; }
    ${B} #ntr_rd_bar { align-self: center; width: min(100%, var(--sheldWidth)); box-sizing: border-box; }
    ${free ? '' : `${B} #form_sheld { align-self: center; width: min(100%, var(--sheldWidth)) !important; }`}
    `;
    if (css !== bookCss) {
      let el = document.getElementById('ntr_bk_css');
      if (!el) { el = document.createElement('style'); el.id = 'ntr_bk_css'; document.head.appendChild(el); }
      el.textContent = bookCss = css;
    }
  }

  // How many spreads the page's messages fill: the column the last line of its last message sits in.
  function countSpreads() {
    const chat = chatEl();
    const last = pages[cur] && document.querySelector(`#chat > .mes[mesid="${pages[cur][1]}"]`);
    if (!booked() || !chat || !last) return 1;
    const rects = [...last.getClientRects()].filter((r) => r.height > 2);
    const r = rects[rects.length - 1];
    if (!r) return 1;
    const x = r.left - chat.getBoundingClientRect().left - chat.clientLeft - geom.po + chat.scrollLeft;
    const column = Math.max(0, Math.floor((x + 2) / (geom.col + geom.gap)));
    return Math.floor(column / 2) + 1;
  }

  function showSpread(j) {
    spreads = countSpreads();
    spread = Math.max(0, Math.min(spreads - 1, j));
    const chat = chatEl();
    if (chat && booked()) { chat.scrollLeft = Math.round(spread * geom.step); chat.scrollTop = 0; }
    syncBar();
  }

  // A picture that loads late, or the Book Font arriving, can change how many spreads the page fills.
  let countQueued = false;
  function recount() {
    if (countQueued) return;
    countQueued = true;
    requestAnimationFrame(() => {
      countQueued = false;
      if (!booked()) return;
      const n = countSpreads();
      if (n === spreads) return;
      spreads = n;
      if (spread > n - 1) showSpread(n - 1); else syncBar();
    });
  }
  const onLoad = (e) => { if (e.target instanceof HTMLImageElement) recount(); };
  document.fonts?.addEventListener?.('loadingdone', recount);

  // Next and Previous: in the book, the next or previous two pages of the same messages first.
  function turn(d, plainAt) {
    if (booked()) {
      spreads = countSpreads();
      if (d > 0 && spread < spreads - 1) { showSpread(spread + 1); return; }
      if (d < 0 && spread > 0) { showSpread(spread - 1); return; }
      go(cur + d, d > 0 ? 'top' : 'bottom');
      return;
    }
    go(cur + d, plainAt);
  }

  // The book follows a reply as it's written, while you're on its last two pages.
  let textObs = null, textQueued = false;
  function watchText() {
    textObs?.disconnect();
    textObs = null;
    const last = geom && cur === pages.length - 1 && document.querySelector(`#chat > .mes[mesid="${pages[cur]?.[1]}"] .mes_text`);
    if (!last || !window.MutationObserver) return;
    textObs = new MutationObserver(() => {
      if (textQueued) return;
      textQueued = true;
      requestAnimationFrame(() => {
        textQueued = false;
        if (!booked()) return;
        const atEnd = spread >= spreads - 1;
        spreads = countSpreads();
        if (atEnd) showSpread(spreads - 1); else syncBar();
      });
    });
    textObs.observe(last, { childList: true, subtree: true, characterData: true });
  }

  // Editing a message shows it like Plain until you're done, so the edit box has room.
  function syncEdit() {
    const on = !!geom && !!document.querySelector('#chat .edit_textarea');
    if (on === editing()) return;
    document.body.classList.toggle('ntr_bk_edit', on);
    const chat = chatEl();
    if (on) { if (chat) chat.scrollLeft = 0; document.querySelector('#chat .edit_textarea')?.scrollIntoView({ block: 'nearest' }); }
    else showSpread(spread);
  }
  const checkEdit = () => { if (!geom) return; requestAnimationFrame(syncEdit); setTimeout(syncEdit, 300); };
  document.addEventListener('click', checkEdit, true);
  document.addEventListener('keyup', checkEdit, true);

  // After a setting or the screen size changed: the book again, at the same spread.
  function relayout() {
    if (!live()) return;
    const was = !!geom;
    layoutBook();
    placeBar();
    if (geom) { requestAnimationFrame(() => showSpread(was ? spread : 0)); watchText(); }
    else { spread = 0; spreads = 1; textObs?.disconnect(); textObs = null; const chat = chatEl(); if (chat) chat.scrollLeft = 0; syncBar(); }
  }
  window.addEventListener('resize', () => { if (live()) relayout(); });

  function scrollTo(at) {
    const chat = chatEl();
    if (!chat || at === 'keep') return;
    if (booked()) { showSpread(at === 'top' ? 0 : Infinity); return; }
    chat.scrollTop = at === 'bottom' ? chat.scrollHeight : 0;
  }

  // Draws older messages until the page's first one is there, with SillyTavern's own "Show more messages".
  async function loadUpTo(first) {
    for (let tries = 0; tries < 200; tries++) {
      const top = drawnFrom();
      const more = document.getElementById('show_more_messages');
      if (top <= first || !more) return;
      more.click();
      await new Promise((r) => requestAnimationFrame(r));
      if (drawnFrom() >= top) return;
    }
  }

  // Turns to a page. Only a page whose messages SillyTavern hasn't drawn yet has to wait for them.
  async function go(i, at = 'top') {
    if (!live() || !pages.length || turning) return;
    const to = Math.max(0, Math.min(pages.length - 1, i));
    if (to === cur && at !== 'force') return;
    cur = to;
    follow = cur === pages.length - 1;
    if (drawnFrom() > pages[cur][0]) {
      turning = true;
      try { await loadUpTo(pages[cur][0]); } finally { turning = false; }
    }
    paint();
    syncBar();
    scrollTo(at === 'force' ? 'bottom' : at);
    A.refreshPins?.();
  }

  // The chat changed (messages added, deleted or drawn): count the pages again and stay on the same messages, or on the
  // last page while following it.
  function rebuild(toLast = false) {
    let anchor = pages[cur]?.[0];
    const was = cur;
    // Deleting earlier messages renumbers the rest, so the page's first message is found again in the chat.
    const found = shownMsg ? (ctx().chat || []).indexOf(shownMsg) : -1;
    if (found >= 0) anchor = found;
    pages = build();
    if (!pages.length) cur = 0;
    else if (toLast || follow || anchor == null) cur = pages.length - 1;
    else {
      const at = pages.findLastIndex(([a]) => a <= anchor);
      cur = Math.max(0, at);
    }
    follow = cur === pages.length - 1;
    paint();
    if (booked()) showSpread(cur === was && !toLast ? spread : 0);
    else syncBar();
    A.refreshPins?.();
  }

  function queue() {
    if (queued) return;
    queued = true;
    // While a page turn is loading older messages, counting waits until it's done.
    requestAnimationFrame(() => { queued = false; if (!live()) return; if (turning) queue(); else rebuild(); });
  }

  // SillyTavern scrolls the chat down for new messages. The book's pages never scroll up and down, so it stays at the top.
  const keepTop = (e) => { if (booked() && e.target.scrollTop) e.target.scrollTop = 0; };

  // Only the chat's own list of messages is watched, so a streaming reply doesn't count pages again for every word.
  function watch(on) {
    const chat = chatEl();
    if (on && !obs && chat) {
      obs = new MutationObserver(queue);
      obs.observe(chat, { childList: true });
      chat.addEventListener('scroll', keepTop, { passive: true });
      chat.addEventListener('load', onLoad, true);
    } else if (!on && obs) {
      chat?.removeEventListener('scroll', keepTop);
      chat?.removeEventListener('load', onLoad, true);
      obs.disconnect();
      obs = null;
    }
  }

  const typingIn = (el) => !!el && el.matches?.('input, textarea, select, [contenteditable=""], [contenteditable="true"]');

  // Page Up and Page Down turn pages: a page taller than the chat scrolls first, and in the book they go through the
  // page's spreads first. They're left alone while you type in a text box with text in it, and in the NTR menu and
  // SillyTavern's popups.
  // SillyTavern's Left and Right arrow keys swipe the last reply, which is hidden on an earlier page, so they wait for
  // the last page.
  function onKey(e) {
    if (!live() || !pages.length || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const k = e.key;
    const el = document.activeElement;
    if (el && el !== document.body && el.closest('#cb_modal_overlay, .popup, dialog')) return;
    const send = document.getElementById('send_textarea');
    const typing = typingIn(el) && !(el === send && !send.value);
    if (k === 'ArrowLeft' || k === 'ArrowRight') {
      if (!typing && cur < pages.length - 1) e.stopImmediatePropagation();
      return;
    }
    if ((k !== 'PageUp' && k !== 'PageDown') || typing) return;
    const chat = chatEl();
    if (!chat) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (booked()) { turn(k === 'PageDown' ? 1 : -1); return; }
    const step = chat.clientHeight * 0.9;
    if (k === 'PageDown') {
      if (chat.scrollTop + chat.clientHeight < chat.scrollHeight - 2) chat.scrollBy({ top: step });
      else go(cur + 1, 'top');
    } else if (chat.scrollTop > 2) chat.scrollBy({ top: -step });
    else go(cur - 1, 'bottom');
  }
  window.addEventListener('keydown', onKey, true);

  let wasLive = false;
  // Switched on: the last page. Switched off: the chat stays at the page you were reading.
  function refresh() {
    const on = live();
    watch(on);
    layoutBook();
    if (on) {
      rebuild(!wasLive);
      if (!wasLive) scrollTo('bottom');
      placeBar();
    } else {
      formRo?.disconnect();
      formRo = null;
      textObs?.disconnect();
      textObs = null;
      const first = pages[cur]?.[0];
      pages = [];
      cur = 0;
      spread = 0;
      spreads = 1;
      follow = true;
      paint();
      syncBar();
      A.refreshPins?.();
      const chat = chatEl();
      if (chat) chat.scrollLeft = 0;
      if (wasLive && first != null) document.querySelector(`#chat > .mes[mesid="${first}"]`)?.scrollIntoView({ block: 'start' });
    }
    wasLive = on;
  }

  window.NTR.reader = {
    version: READER_VERSION,
    refresh,
    // A Book setting changed (index.js calls this whenever the menu's look settings do).
    relayout,
    // For the menu's picture preview.
    bookUri: BOOK_URI,
    // A chat opens on its last page.
    chatChanged: () => { if (!live()) return; follow = true; rebuild(true); },
    // Sending a message or starting a reply goes to the last page, so you see the reply arrive.
    // Quiet generations and Impersonate don't add a reply to the chat, so they leave the page alone.
    genStarted: (type, dryRun) => {
      if (dryRun || type === 'quiet' || type === 'impersonate' || !live() || !pages.length) return;
      if (cur < pages.length - 1) go(pages.length - 1, 'force');
      follow = true;
    },
    // For Pinned Blocks: the last message on the page you're on, or null when Reader Mode is off.
    upTo: () => (live() && pages.length ? pages[cur][1] : null),
  };
})();
