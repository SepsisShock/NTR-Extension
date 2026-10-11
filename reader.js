// Nitwit Tavern Redesign: Reader Mode module.
// Loaded on demand by index.js, once Reader Mode is switched on. If this file breaks, the rest of the extension keeps working.
// Shows the chat a page at a time. The messages are SillyTavern's own, so swipes, editing and the "..." menu keep working.
// Messages on other pages are only hidden on screen, like Visual Novel Mode does: they stay in the prompt.
(() => {
  const READER_VERSION = '2.33.0';
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

  const live = () => isOn() && !!settings().rdEnabled;
  // Each page is [first, last] message number (mesid).
  let pages = [];
  let cur = 0;
  // On the last page: new pages are followed, so a new reply shows as it arrives.
  let follow = true;
  let obs = null, queued = false, turning = false;
  // The first message of the page on screen, as it is in the chat.
  let shownMsg = null;

  const chatEl = () => document.getElementById('chat');
  const drawnMes = () => [...document.querySelectorAll('#chat > .mes[mesid]')];
  const mesNum = (el) => Number(el.getAttribute('mesid'));
  // The first message SillyTavern has drawn.
  const drawnFrom = () => { const d = drawnMes(); return d.length ? mesNum(d[0]) : Infinity; };

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

  // Hides every message that isn't on the page, and SillyTavern's "Show more messages" (turning back loads them).
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
    `;
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
        const to = { first: 0, prev: cur - 1, next: cur + 1, last: pages.length - 1 }[b.dataset.go];
        go(to, 'top');
      });
    }
    if (bar.nextElementSibling !== form) form.before(bar);
    const n = pages.length;
    bar.querySelector('.ntr_rd_num').innerHTML = `<i class="fa-solid fa-book-open"></i>${n ? `Page ${cur + 1} of ${n}` : 'No pages'}`;
    bar.querySelector('[data-go="first"]').disabled = bar.querySelector('[data-go="prev"]').disabled = cur <= 0;
    bar.querySelector('[data-go="last"]').disabled = bar.querySelector('[data-go="next"]').disabled = cur >= n - 1;
  }

  function scrollTo(at) {
    const chat = chatEl();
    if (!chat || at === 'keep') return;
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
    syncBar();
    A.refreshPins?.();
  }

  function queue() {
    if (queued) return;
    queued = true;
    // While a page turn is loading older messages, counting waits until it's done.
    requestAnimationFrame(() => { queued = false; if (!live()) return; if (turning) queue(); else rebuild(); });
  }

  // Only the chat's own list of messages is watched, so a streaming reply doesn't count pages again for every word.
  function watch(on) {
    const chat = chatEl();
    if (on && !obs && chat) {
      obs = new MutationObserver(queue);
      obs.observe(chat, { childList: true });
    } else if (!on && obs) {
      obs.disconnect();
      obs = null;
    }
  }

  const typingIn = (el) => !!el && el.matches?.('input, textarea, select, [contenteditable=""], [contenteditable="true"]');

  // Page Up and Page Down turn pages: a page taller than the chat scrolls first. They're left alone while you type in a
  // text box with text in it, and in the NTR menu and SillyTavern's popups.
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
    if (on) {
      rebuild(!wasLive);
      if (!wasLive) scrollTo('bottom');
    } else {
      const first = pages[cur]?.[0];
      pages = [];
      cur = 0;
      follow = true;
      paint();
      syncBar();
      A.refreshPins?.();
      if (wasLive && first != null) document.querySelector(`#chat > .mes[mesid="${first}"]`)?.scrollIntoView({ block: 'start' });
    }
    wasLive = on;
  }

  window.NTR.reader = {
    version: READER_VERSION,
    refresh,
    // A chat opens on its last page.
    chatChanged: () => { if (!live()) return; follow = true; rebuild(true); },
    // Sending a message or starting a reply goes to the last page, so you see the reply arrive.
    genStarted: (dryRun) => {
      if (dryRun || !live() || !pages.length) return;
      if (cur < pages.length - 1) go(pages.length - 1, 'force');
      follow = true;
    },
    // For Pinned Blocks: the last message on the page you're on, or null when Reader Mode is off.
    upTo: () => (live() && pages.length ? pages[cur][1] : null),
  };
})();
