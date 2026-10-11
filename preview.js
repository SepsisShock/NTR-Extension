// Nitwit Tavern Redesign: Phone Preview module.
// Loaded on demand by index.js, from the Layout page. If this file breaks, the rest of the extension keeps working.
// Shows SillyTavern with NTR in a phone-sized frame. The copy inside can't be clicked, typed into or focused, and can't
// save anything or ask an AI service for anything (see blockSaves in index.js); Edit Layout on top of it changes the Phone
// layout, saved by this page.
(() => {
  const PREVIEW_VERSION = '2.34.0';
  const A = window.NTR && window.NTR.api;
  if (!A) { console.error('[NTR] preview.js loaded without the core (index.js).'); return; }
  const { ctx, settings } = A;

  // A phone screen in CSS pixels, held upright. Turn Sideways swaps them.
  const PHONE = { w: 390, h: 844 };

  const CSS = `
    #ntr_pv { position: fixed; inset: 0; z-index: 9980; display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 12px; box-sizing: border-box; background: rgba(0,0,0,.92); }
    #ntr_pv .ntr_pv_bar { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 8px 10px; max-width: calc(100vw - 32px); box-sizing: border-box; padding: 8px 8px 8px 14px; border-radius: 22px; background: rgba(0,0,0,.85); color: #fff; font-size: 13px; line-height: 1.2; box-shadow: 0 2px 10px rgba(0,0,0,.5); }
    #ntr_pv .ntr_pv_bar b { white-space: nowrap; }
    #ntr_pv .ntr_pv_bar button { border: none; border-radius: 999px; padding: 5px 12px; cursor: pointer; background: rgba(255,255,255,.15); color: #fff; white-space: nowrap; }
    #ntr_pv .ntr_pv_bar button:disabled { opacity: .4; cursor: default; }
    #ntr_pv .ntr_pv_bar button.ntr_pv_main { font-weight: bold; background: var(--SmartThemeQuoteColor, #6cf); color: #000; }
    #ntr_pv.ntr_pv_editing .ntr_pv_bar { visibility: hidden; }
    #ntr_pv .ntr_pv_phone { position: relative; flex: none; border-radius: 16px; overflow: hidden; background: #000; box-shadow: 0 0 0 6px #111, 0 0 0 7px #444, 0 10px 40px rgba(0,0,0,.7); }
    #ntr_phone_frame { position: absolute; left: 0; top: 0; border: 0; transform-origin: 0 0; background: #000; }
    #ntr_pv .ntr_pv_shield { position: absolute; inset: 0; }
    #ntr_pv .ntr_pv_wait { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 20px; text-align: center; color: #fff; background: #000; font-size: 14px; }
  `;

  let pv = null;

  function open() {
    if (pv) return;
    if (!document.getElementById('ntr_pv_css')) {
      const st = document.createElement('style');
      st.id = 'ntr_pv_css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    const menu = document.getElementById('cb_modal_overlay');
    if (menu) menu.style.display = 'none';
    const el = document.createElement('div');
    el.id = 'ntr_pv';
    el.innerHTML = `
      <div class="ntr_pv_bar">
        <b>Phone Preview</b>
        <button type="button" data-a="edit" class="ntr_pv_main" disabled><i class="fa-solid fa-up-down-left-right"></i> Edit Layout</button>
        <button type="button" data-a="turn"><i class="fa-solid fa-rotate"></i> <span>Turn Sideways</span></button>
        <button type="button" data-a="close">Close</button>
      </div>
      <div class="ntr_pv_phone">
        <iframe id="ntr_phone_frame" title="Phone Preview" inert tabindex="-1"></iframe>
        <div class="ntr_pv_shield"></div>
        <div class="ntr_pv_wait">Loading SillyTavern...</div>
      </div>`;
    document.body.appendChild(el);
    const frame = el.querySelector('#ntr_phone_frame');
    pv = { el, frame, up: true, ready: false };
    const acts = { edit, turn, close };
    el.querySelectorAll('.ntr_pv_bar button').forEach((b) => { b.onclick = () => acts[b.dataset.a](); });
    pv.onResize = () => fit();
    // Escape closes the preview, unless Edit Layout is open: then it only ends that.
    pv.onKey = (e) => { if (e.key === 'Escape' && !A.placing()) close(); };
    window.addEventListener('resize', pv.onResize);
    window.addEventListener('keydown', pv.onKey, true);
    fit();
    frame.src = window.location.pathname;
    guard(frame);
    whenReady(frame);
  }

  // The phone's size and how much it's scaled down to fit this window.
  function fit() {
    if (!pv) return;
    const fw = pv.up ? PHONE.w : PHONE.h, fh = pv.up ? PHONE.h : PHONE.w;
    const bar = pv.el.querySelector('.ntr_pv_bar').getBoundingClientRect();
    const k = Math.min(1, (window.innerWidth - 40) / fw, (window.innerHeight - bar.height - 52) / fh);
    Object.assign(pv.frame.style, { width: fw + 'px', height: fh + 'px', transform: `scale(${k})` });
    Object.assign(pv.el.querySelector('.ntr_pv_phone').style, { width: fw * k + 'px', height: fh * k + 'px' });
    A.redrawPlacement();
  }

  // Stops the frame's SillyTavern from saving as soon as its page starts loading, before its own NTR does the same.
  function guard(frame) {
    const tick = () => {
      if (pv?.frame !== frame) return;
      try {
        const w = frame.contentWindow;
        if (w && w.location.href !== 'about:blank') {
          A.blockSaves(w);
          if (w.document.readyState === 'complete') return;
        }
      } catch (e) { /* not there yet */ }
      setTimeout(tick, 4);
    };
    tick();
  }

  // Waits until test() is true, up to a time limit, while the preview stays open on this frame.
  async function until(frame, test, ms) {
    const t0 = Date.now();
    while (pv?.frame === frame && Date.now() - t0 < ms) {
      try { if (test()) return true; } catch (e) { /* still loading */ }
      await new Promise((r) => setTimeout(r, 150));
    }
    return false;
  }

  // Once the frame's SillyTavern and NTR are up: the same NTR settings and the same chat as this page.
  async function whenReady(frame) {
    const wait = pv.el.querySelector('.ntr_pv_wait');
    const c = ctx();
    const w = () => frame.contentWindow;
    const fc = () => w().SillyTavern.getContext();
    // Groups load after characters, so a group chat waits for its group too.
    const up = await until(frame, () => w().NTR?.api && w().document.getElementById('cb_node_toggle') && fc().characters?.length
      && (!c.groupId || fc().groups?.some((g) => g.id === c.groupId)), 60000);
    if (pv?.frame !== frame) return;
    if (!up) { wait.textContent = 'SillyTavern didn\'t load in the preview.'; return; }
    try {
      fc().extensionSettings.chatvisuals = w().JSON.parse(JSON.stringify(settings()));
      if (c.groupId) {
        // A group opens the way SillyTavern's own list opens it, then the chat this page has open.
        const pick = w().document.createElement('div');
        pick.className = 'group_select';
        pick.dataset.grid = c.groupId;
        pick.hidden = true;
        w().document.body.appendChild(pick);
        pick.click();
        pick.remove();
        await until(frame, () => fc().groupId === c.groupId, 10000);
        const id = c.getCurrentChatId();
        if (id && fc().groupId === c.groupId && fc().getCurrentChatId() !== id) await fc().openGroupChat(c.groupId, id);
      } else if (c.characterId !== undefined && c.characters[c.characterId]) {
        const i = fc().characters.findIndex((x) => x.avatar === c.characters[c.characterId].avatar);
        if (i >= 0) {
          await fc().selectCharacterById(i, { switchMenu: false });
          const id = c.getCurrentChatId();
          if (id && fc().getCurrentChatId() !== id) await fc().openCharacterChat(id);
        }
      }
      w().NTR.api.refreshVisuals();
    } catch (e) {
      console.error('[NTR] Phone Preview couldn\'t open the chat', e);
    }
    if (pv?.frame !== frame) return;
    pv.ready = true;
    wait.remove();
    pv.el.querySelector('[data-a="edit"]').disabled = false;
  }

  // Edit Layout on the phone: changes show inside it at once, and this page saves them to the Phone layout.
  function edit() {
    if (!pv?.ready) return;
    const w = pv.frame.contentWindow;
    const started = A.startPlacement('lay', {
      win: w,
      frame: pv.frame,
      apply: (v) => { Object.assign(w.NTR.api.settings(), v); w.NTR.api.applyLayout(); },
      done: () => pv?.el.classList.remove('ntr_pv_editing'),
    });
    if (started) pv.el.classList.add('ntr_pv_editing');
  }

  function turn() {
    if (!pv) return;
    pv.up = !pv.up;
    pv.el.querySelector('[data-a="turn"] span').textContent = pv.up ? 'Turn Sideways' : 'Turn Upright';
    fit();
  }

  // Closing removes the frame, and the copy of SillyTavern inside it with it.
  function close() {
    if (!pv) return;
    window.removeEventListener('resize', pv.onResize);
    window.removeEventListener('keydown', pv.onKey, true);
    pv.el.remove();
    pv = null;
    const menu = document.getElementById('cb_modal_overlay');
    if (menu) menu.style.display = '';
  }

  window.NTR.preview = { version: PREVIEW_VERSION, open, close };
})();
