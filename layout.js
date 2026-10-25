// Nitwit Tavern Redesign: Layout module: the Layout page, where the chat panel, SillyTavern's menu bar, the send bar,
// Reader Mode's page bar and the banner sit in each layout; Pinned Blocks; and Edit Placement, which drags them and the
// pop-out avatars and foreground images. Loaded by index.js before NTR starts, so its styles are there from the first
// draw, unless it takes over 5 seconds; then it moves things into place when it arrives. If this file breaks, the rest
// of the extension keeps working, with SillyTavern's own layout; pop-outs and foreground images keep their place and
// their sliders.
// The settings, their limits and the lists they're checked against stay in index.js, and so do cleaning saved Pinned
// Blocks (cleanPins), the pop-out pictures, and Chat Width, Space Between Messages, Hide Names and Avatars and Attached
// Style (overrideCss, layoutChatCss, namesCss and sendSeparate), which follow this file. It builds from what index.js shares in window.NTR.api.look.
(() => {
  const LAYOUT_VERSION = '2.77.15';
  const A = window.NTR && window.NTR.api;
  if (!A || !A.look) { console.error('[NTR] layout.js loaded without the core (index.js).'); return; }
  const { askYes, card, cardNum, escapeHTML, fgData, fgTransform, isOn, numRange, onPills, pageHtml, pills, rangeAttrs, rangeNum, save, settings } = A;
  const { LAY_EDGES, PIN_CLASS, PIN_LIMITS, PIN_MAX, PIN_START, PIN_TAG, clamp, cleanPins, cssRule, cssTag, decorOn, fgOwner, joinCss, layoutPop, lk, ovLabel, ovPick,
    ovRow, ovWhen, pinRect, rangeSlider, restyle: updateAvatarStyle, syncPopSliders } = A.look;

  // ===== Edit Placement =====
  // Pop-out avatars, foreground images and, with Layout on, the chat panel, menu bar, send bar, page bar and banner can be dragged on
  // screen. Edit Placement hides the menu and outlines what can move; only the picked item drags, and a picked Layout
  // part also resizes from the handles on its edges. Tapping the picked item picks the one under it. The bar at the
  // bottom has Snap to Grid, Undo, Reset and Done.
  // Layout parts come first, so the pictures' outlines sit on top of theirs.
  const PLACE = [
    { id: 'layChat', lay: 'chat', label: 'Chat Panel' }, { id: 'layBar', lay: 'bar', label: 'ST Menu Bar' }, { id: 'laySend', lay: 'send', label: 'Send Bar' },
    { id: 'layPage', lay: 'page', label: 'Page Bar' }, { id: 'layBan', lay: 'ban', label: 'Banner' },
    { id: 'us', label: 'User Pop Out' }, { id: 'ai', label: 'AI Pop Out' },
    ...['Left', 'Center', 'Right'].map((pos) => ({ id: 'fg' + pos, pos, label: `${pos} Foreground` })),
  ];
  // Everything that can move right now: the parts above, then each Pinned Block that has something picked.
  const placeItems = () => [...PLACE, ...settings().layPins.filter(pinHas).map((p) => ({ id: 'pin_' + p.id, pin: p.id, label: p.name }))];
  const pinOf = (it) => settings().layPins.find((p) => p.id === it.pin);
  // Each Layout part's element, its settings, and SillyTavern's own place for it (what Reset puts back). The setting
  // names are without their layout's start (see lk and layNames).
  const LAY_PART = {
    chat: { el: 'sheld', keys: ['ChatMoved', 'ChatX', 'ChatY', 'ChatW', 'ChatH'], start: { ChatMoved: false } },
    bar: { el: 'top-settings-holder', keys: ['BarEdge', 'BarMoved', 'BarPos', 'BarLen'], start: { BarEdge: 'top', BarMoved: false } },
    send: { el: 'form_sheld', keys: ['Send', 'SendX', 'SendB', 'SendW'], start: { Send: 'attached' } },
    page: { el: 'ntr_rd_bar', keys: ['Page', 'PageX', 'PageB', 'PageW'], start: { Page: 'attached' } },
    ban: { el: 'cb_banner', keys: ['Ban', 'BanX', 'BanY', 'BanW', 'BanH'], start: { Ban: 'attached' } },
  };
  const GRIPS = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
  // The handles a picked part resizes from: the chat panel and banner from every edge and corner, the send bar and page bar
  // from their sides, the menu bar from its two ends.
  // A floating Pinned Block resizes like the chat panel; a docked one only from its inner edge.
  function grips(it) {
    if (it.pin) {
      const p = pinOf(it), pl = p?.place;
      // A Fit Content box gets its height from what it shows.
      return pl === 'left' ? ['e'] : pl === 'right' ? ['w'] : p?.height === 'fit' ? ['e', 'w'] : GRIPS;
    }
    if (it.lay === 'chat' || it.lay === 'ban') return GRIPS;
    if (it.lay === 'bar' && barUpright(settings()[lk(phoneNow(), 'BarEdge')])) return ['n', 's'];
    return it.lay ? ['e', 'w'] : [];
  }

  // Layout settings by their full names, for the layout being edited.
  const layNames = (o) => Object.fromEntries(Object.entries(o).map(([k, x]) => [lk(phoneNow(), k), x]));
  const placeKind = (it) => (it.lay ? 'lay' : it.pin ? 'pin' : it.pos ? 'fg' : 'pop');
  const place = { on: false, sel: null, drag: null, undo: [], step: null, dirty: false, frame: 0 };

  function syncFgSliders(pos) {
    const F = fgData();
    for (const ax of ['X', 'Y']) {
      const v = cardNum(F[pos + ax], 'fg' + ax, 0);
      const el = document.getElementById(`m_f_${ax}_${pos}`);
      const lab = document.getElementById(`m_f_${ax}_${pos}val`);
      if (el) el.value = v;
      if (lab) lab.textContent = v;
    }
  }

  const placeEl = (it) => (it.lay ? document.getElementById(LAY_PART[it.lay].el)
    : it.pin ? document.querySelector(`#ntr_pin_layer > .ntr_pin[data-pin="${it.pin}"]`)
      : document.getElementById(it.pos ? `cb_fg_${it.pos.toLowerCase()}` : `cb_popf_${it.id}`));

  // The part of a foreground image you can see: its box fills the whole side, with the picture at the bottom.
  function fgRect(el) {
    const r = el.getBoundingClientRect();
    const nw = el.naturalWidth, nh = el.naturalHeight, w = el.offsetWidth, h = el.offsetHeight;
    if (!nw || !nh || !w || !h) return null;
    const k = Math.min(w / nw, h / nh);
    const sx = r.width / w, sy = r.height / h;
    const dw = nw * k * sx, dh = nh * k * sy;
    const fx = el.id === 'cb_fg_left' ? 0 : el.id === 'cb_fg_right' ? 1 : 0.5;
    const left = r.left + (r.width - dw) * fx, top = r.bottom - dh;
    return { left, top, right: left + dw, bottom: top + dh, width: dw, height: dh };
  }

  // A Layout part on its screen, in that screen's own pixels. Parts show while Layout is on; the send bar, page bar and
  // banner only while they're Floating, since Attached they follow the chat panel. The page bar is there in Reader
  // Mode's Standard and Book, the banner while the open chat shows one.
  function layRect(it) {
    const s = settings();
    const el = placeEl(it);
    const att = { send: 'Send', page: 'Page', ban: 'Ban' }[it.lay];
    if (!el || !layOn(s) || (att && !partFree(att, s))) return null;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 ? r : null;
  }

  // An item's outline on this page.
  function placeRect(it) {
    if (it.lay) return layRect(it);
    if (it.pin && !pinBoxed(pinOf(it), phoneNow())) {
      // Still in its message: the copy it shows there, if it's on screen. Pinned Blocks are part of Layout, so none with it off.
      const r = layOn(settings()) ? pinSource(pinOf(it))?.el.getBoundingClientRect() : null;
      return r && r.width > 0 && r.height > 0 ? r : null;
    }
    const el = placeEl(it);
    if (it.pin) {
      if (!el || el.hidden) return null;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 ? r : null;
    }
    // A pop-out moves by its frame, which shows once its picture has a source.
    if (!el || el.style.display === 'none' || !(it.pos ? el : el.querySelector('img'))?.getAttribute('src')) return null;
    if (it.pos && el.parentNode?.style.display === 'none') return null;
    const r = it.pos ? fgRect(el) : el.getBoundingClientRect();
    return r && r.width > 0 && r.height > 0 ? r : null;
  }

  // Where an item is, in the form placeSet takes: an offset for a picture, the part's settings for a Layout part.
  function placeGet(it) {
    const s = settings();
    if (it.lay) return Object.fromEntries(LAY_PART[it.lay].keys.map((k) => [lk(phoneNow(), k), s[lk(phoneNow(), k)]]));
    if (it.pin) return { ...pinOf(it)?.[pinPhone(phoneNow())] };
    if (!it.pos) return { x: rangeNum(s, it.id + 'PopX'), y: rangeNum(s, it.id + 'PopY') };
    const F = fgData();
    return { x: cardNum(F[it.pos + 'X'], 'fgX', 0), y: cardNum(F[it.pos + 'Y'], 'fgY', 0) };
  }
  const placeAtStart = (it) => {
    const v = placeGet(it);
    if (it.pin) {
      const p = pinOf(it);
      if (p.from === 'chat' && p.place === 'float') return !p[pinPhone(phoneNow())].moved;
      return JSON.stringify(v) === JSON.stringify(pinStart(p, phoneNow()));
    }
    return it.lay ? Object.entries(layNames(LAY_PART[it.lay].start)).every(([k, x]) => v[k] === x) : !v.x && !v.y;
  };

  function placeSet(it, v) {
    if (it.pin) {
      const p = pinOf(it);
      if (p) p[pinPhone(phoneNow())] = pinRect(v, PIN_START[pinPhone(phoneNow())]);
      cssTag('ntr_pin_css', pinCss(settings()));
    } else if (it.lay) {
      Object.assign(settings(), v);
      applyLayout();
    } else if (!it.pos) {
      const s = settings();
      s[it.id + 'PopX'] = Math.round(v.x);
      s[it.id + 'PopY'] = Math.round(v.y);
      // Kept to the saved limit, which goes wider than the sliders.
      for (const k of ['PopX', 'PopY']) s[it.id + k] = rangeNum(s, it.id + k);
      updateAvatarStyle();
      syncPopSliders(it.id);
    } else {
      const F = fgData();
      F[it.pos + 'X'] = cardNum(Math.round(v.x), 'fgX', 0);
      F[it.pos + 'Y'] = cardNum(Math.round(v.y), 'fgY', 0);
      const el = placeEl(it);
      if (el) fgTransform(el, it.pos, F);
      syncFgSliders(it.pos);
    }
    drawPlace();
  }

  // v on the nearest grid line, every g pixels (0 for none).
  const snapTo = (v, g) => (g ? Math.round(v / g) * g : v);
  // How far a span from a to b moves so whichever end is nearer a grid line lands on it.
  function edgeSnap(a, b, g) {
    const sa = snapTo(a, g) - a, sb = snapTo(b, g) - b;
    return Math.abs(sa) <= Math.abs(sb) ? sa : sb;
  }
  // v as a % of size, the way Layout parts and Pinned Blocks are saved.
  const pct = (v, size) => Math.round(v / size * 10000) / 100;
  // A span from a to b moved by t, kept within 0 to max, with whichever end is nearer a grid line landing on it.
  function shiftSpan(a, b, t, max, g) {
    t = clamp(t, -a, max - b);
    if (g) t = clamp(t + edgeSnap(a + t, b + t, g), -a, max - b);
    return [a + t, b + t];
  }
  // A box (r: left, right, top, bottom) moved by dx, dy, or resized from grip, kept on a W by H screen and at least
  // minW by minH, with whichever edge is nearer a grid line (every g pixels, 0 for none) landing on it.
  function dragBox(r, grip, dx, dy, W, H, minW, minH, g) {
    const snap = (v) => snapTo(v, g);
    let [L, R, T, B] = [r.left, r.right, r.top, r.bottom];
    if (!grip) {
      [L, R] = shiftSpan(L, R, dx, W, g);
      [T, B] = shiftSpan(T, B, dy, H, g);
    } else {
      if (grip.includes('w')) L = clamp(snap(L + dx), 0, R - minW);
      if (grip.includes('e')) R = clamp(snap(R + dx), L + minW, W);
      if (grip.includes('n')) T = clamp(snap(T + dy), 0, B - minH);
      if (grip.includes('s')) B = clamp(snap(B + dy), T + minH, H);
    }
    return [L, R, T, B];
  }

  // Dragging a Pinned Block. A floating one moves anywhere and resizes from its handles, and dragging one out of its message
  // gives it its own box there; a docked one stays on its edge and only gets wider or narrower. Saved as a % of the screen.
  // A Fit Content box saves the spot it has on screen, so the edge it grows from stays where it was dropped.
  function dragPin(d, dx, dy, g) {
    const p = pinOf(d.it);
    if (!p || (p.place !== 'float' && !d.grip)) return;
    const W = window.innerWidth, H = window.innerHeight;
    const [L, R, T, B] = dragBox(d.r0, d.grip, dx, dy, W, H, W * numRange('pinW')[0] / 100, H * numRange('pinH')[0] / 100, g);
    const r = p[pinPhone(phoneNow())];
    if (p.place !== 'float') return placeSet(d.it, { ...r, w: pct(R - L, W) });
    let y = pct(T, H);
    const h = Math.max(pct(B - T, H), numRange('pinH')[0]);
    // A Fit Content box can be shorter than the saved height can go, so in the bottom half its bottom edge is kept
    // instead of its top (see pinCss). Close to the middle, either edge does.
    if (p.height === 'fit' && y + h / 2 > 50 && pct(B, H) - h / 2 > 50) y = Math.round((pct(B, H) - h) * 100) / 100;
    placeSet(d.it, { x: pct(L, W), y, w: pct(R - L, W), h, moved: true });
  }

  // Dragging a Layout part. The chat panel and send bar move anywhere and resize from their handles. The menu bar slides
  // along its edge, changes length from its ends, and goes to another edge when dragged close to it. Kept on screen and
  // saved as a % of it. Everything here is in the screen's own pixels: dx, dy and the pointer (px, py) too.
  function dragLayout(d, dx, dy, px, py, g) {
    const W = innerWidth, H = innerHeight;
    const snap = (v) => snapTo(v, g);
    const r = d.r0;

    if (d.it.lay === 'bar') {
      const up0 = barUpright(d.edge0);
      const min = (d.min ??= barIcons() * barCell());
      let edge = d.edge0, a, b;
      if (d.grip) {
        [a, b] = up0 ? [r.top, r.bottom] : [r.left, r.right];
        const t = up0 ? dy : dx;
        if (d.grip === 'n' || d.grip === 'w') a = clamp(snap(a + t), 0, b - min);
        else b = clamp(snap(b + t), a + min, up0 ? H : W);
      } else {
        // The edge nearest the pointer, once it's clearly nearer than the bar's own.
        const dist = { top: py, bottom: H - py, left: px, right: W - px };
        const near = LAY_EDGES.reduce((m, k) => (dist[k] < dist[m] ? k : m), d.edge);
        if (near !== d.edge && dist[near] + 40 < dist[d.edge]) { d.edge = near; d.switched = true; }
        edge = d.edge;
        const up = barUpright(edge), size = up ? H : W;
        const len = clamp(up0 ? r.height : r.width, Math.min(min, size), size);
        const at = up ? py : px;
        // Held where it was grabbed; on another edge, by its middle.
        const grab = d.switched ? len / 2 : up0 ? d.sy - r.top : d.sx - r.left;
        [a, b] = shiftSpan(at - grab, at - grab + len, 0, size, g);
      }
      const size = barUpright(edge) ? H : W;
      return placeSet(d.it, layNames({ BarEdge: edge, BarMoved: true, BarPos: pct(a, size), BarLen: pct(b - a, size) }));
    }

    const min = (name) => numRange(lk(phoneNow(), name))[0] / 100;
    const part = { chat: 'Chat', send: 'Send', page: 'Page', ban: 'Ban' }[d.it.lay];
    // The page bar is never narrower than its buttons (see the Page Bar's CSS).
    const minW = Math.max(W * min(part + 'W'), part === 'Page' ? window.NTR.reader?.barMin?.() || 0 : 0);
    const [L, R, T, B] = dragBox(r, d.grip, dx, dy, W, H, minW, H * min(part === 'Ban' ? 'BanH' : 'ChatH'), g);
    if (part === 'Chat') placeSet(d.it, layNames({ ChatMoved: true, ChatX: pct(L, W), ChatY: pct(T, H), ChatW: pct(R - L, W), ChatH: pct(B - T, H) }));
    else if (part === 'Ban') placeSet(d.it, layNames({ BanX: pct(L, W), BanY: pct(T, H), BanW: pct(R - L, W), BanH: pct(B - T, H) }));
    else placeSet(d.it, layNames({ [part + 'X']: pct(L, W), [part + 'B']: pct(H - B, H), [part + 'W']: pct(R - L, W) }));
  }

  function onPlaceTouchMove(e) {
    if (place.drag && e.cancelable) e.preventDefault();
  }

  function ensurePlaceLayer() {
    let layer = document.getElementById('cb_place_layer');
    if (layer) return layer;
    const s = settings();
    layer = document.createElement('div');
    layer.id = 'cb_place_layer';
    layer.innerHTML = '<div class="cb_place_grid"></div>'
      + `<div id="cb_place_pill">
          <span class="cb_place_name"></span>
          <label class="cb_place_snap" title="Hold Alt while dragging to move freely for one move"><input type="checkbox" id="cb_place_snap"><span>Snap to Grid</span></label>
          <span class="cb_place_gridset"><input type="range" id="cb_place_grid" ${rangeAttrs('placeGrid')} value="${rangeNum(s, 'placeGrid')}" title="Grid spacing"><span><span id="cb_place_gridval" class="ntr_slval">${rangeNum(s, 'placeGrid')}</span>${numRange('placeGrid')[3]}</span></span>
          <button type="button" id="cb_place_undo" title="Undo the last move"><i class="fa-solid fa-rotate-left"></i> Undo</button>
          <button type="button" id="cb_place_reset" title="Put the picked item back where it starts">Reset</button>
          <button type="button" id="cb_place_done" class="cb_place_main">Done</button>
        </div>`;
    document.body.appendChild(layer);

    const q = (sel) => layer.querySelector(sel);
    q('#cb_place_snap').onchange = function() { settings().placeSnap = this.checked; save(); drawPlace(); };
    q('#cb_place_grid').oninput = function() {
      settings().placeGrid = Number(this.value);
      q('#cb_place_gridval').textContent = this.value;
      drawPlace();
    };
    q('#cb_place_grid').onchange = save;
    q('#cb_place_undo').onclick = () => {
      const last = place.undo.pop();
      const it = last && placeItems().find((p) => p.id === last.id);
      if (!it) return drawPlace();
      place.sel = it.id;
      placeSet(it, last.v);
      save();
    };
    q('#cb_place_reset').onclick = () => {
      const it = placeItems().find((p) => p.id === place.sel);
      if (!it || placeAtStart(it)) return;
      pushUndo(it.id, placeGet(it));
      placeSet(it, it.lay ? layNames(LAY_PART[it.lay].start) : it.pin ? pinStart(pinOf(it), phoneNow()) : { x: 0, y: 0 });
      save();
    };
    q('#cb_place_done').onclick = endPlacement;

    // Tapping a box picks it; only the picked one drags. The picked box sits on top, so it wins where boxes overlap.
    layer.addEventListener('pointerdown', (e) => {
      if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const box = e.target instanceof Element ? e.target.closest('.cb_place_box') : null;
      if (!box) return;
      e.preventDefault();
      const it = placeItems().find((p) => p.id === box.dataset.id);
      if (!it) return;
      if (place.sel !== it.id) { place.sel = it.id; drawPlace(); return; }
      const start = placeGet(it);
      const grip = e.target.closest('.cb_place_grip')?.dataset.g || '';
      // For a cancelled drag (see endPlacement): a foreground picture's place belongs to the open chat, so the drag keeps
      // whose it is; Layout parts and Pinned Blocks have a place for each layout, so it keeps both, as the window can
      // cross 1000 px while the drag goes on.
      place.drag = { it, id: e.pointerId, sx: e.clientX, sy: e.clientY, r0: placeRect(it), start, grip, moved: false, fg: it.pos ? { data: fgData(), owner: fgOwner() } : null, both: placeBoth(it) };
      // The menu bar can go to another edge on the way (see dragLayout), so it keeps the one it started on.
      if (it.lay === 'bar') place.drag.edge = place.drag.edge0 = settings()[lk(phoneNow(), 'BarEdge')];
      box.classList.add('cb_dragging');
    });

    // Pointer moves can come faster than frames, so a move only keeps where the pointer is; the frame moves the item there
    // (see placeFrame).
    window.addEventListener('pointermove', (e) => {
      const d = place.drag;
      if (!d || e.pointerId !== d.id) return;
      // A tap that wobbles a little isn't a drag.
      if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 4) return;
      d.moved = true;
      place.step = { d, x: e.clientX, y: e.clientY, alt: e.altKey };
      if (!place.frame) place.frame = requestAnimationFrame(placeFrame);
    }, true);

    const end = (e) => {
      const d = place.drag;
      if (!d || e.pointerId !== d.id) return;
      // A move still waiting for its frame lands first, so the item stops where the pointer did.
      placeStep();
      place.drag = null;
      layer.querySelector('.cb_dragging')?.classList.remove('cb_dragging');
      if (d.moved) {
        if (JSON.stringify(placeGet(d.it)) !== JSON.stringify(d.start)) { pushUndo(d.it.id, d.start); save(); }
      } else if (e.type === 'pointerup') {
        // A tap on the picked item picks the next one under it, so a picture over the chat panel can still be picked.
        // They go round in drawing order, top first, which picking doesn't change, so every outline there gets a turn.
        // It reads the outlines as drawn, so a draw still waiting for its frame goes first.
        if (place.dirty) drawPlaceNow();
        const under = new Set(document.elementsFromPoint(e.clientX, e.clientY).filter((el) => el.classList.contains('cb_place_box')).map((el) => el.dataset.id));
        const ids = placeItems().map((p) => p.id).reverse().filter((id) => under.has(id));
        if (ids.length > 1) place.sel = ids[(ids.indexOf(d.it.id) + 1) % ids.length];
      }
      drawPlaceNow();
    };
    window.addEventListener('pointerup', end, true);
    window.addEventListener('pointercancel', end, true);
    window.addEventListener('keydown', (e) => { if (place.on && e.key === 'Escape') endPlacement(); });
    return layer;
  }

  // An item's places in both layouts: a Layout part's settings, a Pinned Block's two boxes. Pictures have one place.
  function placeBoth(it) {
    if (it.lay) return Object.fromEntries([false, true].flatMap((ph) => LAY_PART[it.lay].keys.map((k) => [lk(ph, k), settings()[lk(ph, k)]])));
    if (it.pin) { const p = pinOf(it); return p ? { desk: { ...p.desk }, phone: { ...p.phone } } : null; }
    return null;
  }

  function pushUndo(id, v) {
    place.undo.push({ id, v });
    if (place.undo.length > 20) place.undo.shift();
  }

  // While Edit Layout is open, the outlines are drawn at most once a frame, however often something asks: a drag step
  // moves things that several parts follow, and each of them asks for a draw of its own.
  function drawPlace() {
    if (!place.on) return;
    place.dirty = true;
    if (!place.frame) place.frame = requestAnimationFrame(placeFrame);
  }

  // The latest drag move first, then the outlines, so they never show where things were before it. A draw asked for while
  // this runs gets the next frame, and finds nothing left to do once this one has drawn.
  function placeFrame() {
    place.frame = 0;
    placeStep();
    if (place.dirty) drawPlaceNow();
  }

  // Moves the dragged item to where the pointer last was.
  function placeStep() {
    const st = place.step;
    place.step = null;
    const d = st?.d;
    if (!d || place.drag !== d) return;
    let dx = st.x - d.sx, dy = st.y - d.sy;
    // The grid spacing, or 0 for none: Snap to Grid off, or Alt held for this move.
    const s = settings();
    const g = s.placeSnap && !st.alt ? rangeNum(s, 'placeGrid') : 0;
    if (d.it.lay) return d.r0 && dragLayout(d, dx, dy, st.x, st.y, g);
    if (d.it.pin) return d.r0 && dragPin(d, dx, dy, g);
    if (g && d.r0) {
      // The picture's nearest edge lands on a grid line, whichever corner or center it's tied to.
      dx += edgeSnap(d.r0.left + dx, d.r0.right + dx, g);
      dy += edgeSnap(d.r0.top + dy, d.r0.bottom + dy, g);
    }
    placeSet(d.it, { x: d.start.x + dx, y: d.start.y + dy });
  }

  function drawPlaceNow() {
    place.dirty = false;
    if (!place.on) return;
    const layer = document.getElementById('cb_place_layer');
    if (!layer) return;
    const s = settings();
    const small = [];
    // Every outline is measured before any is moved: measuring after a move makes the browser work out the layout again.
    const items = placeItems().map((it) => ({ it, box: layer.querySelector(`.cb_place_box[data-id="${it.id}"]`) })).filter((x) => x.box);
    for (const x of items) x.r = placeRect(x.it);
    for (const { it, box, r } of items) {
      box.style.display = r ? 'block' : 'none';
      if (!r) continue;
      if (r.height < window.innerHeight * 0.3) small.push(r);
      Object.assign(box.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
      box.classList.toggle('cb_sel', it.id === place.sel);
      if (it.lay || it.pin) {
        const on = it.id === place.sel ? grips(it) : [];
        box.querySelectorAll('.cb_place_grip').forEach((h) => h.classList.toggle('cb_on', on.includes(h.dataset.g)));
      }
    }
    // The bar says which layout a move changes: Layout parts and Pinned Blocks are kept for each, the rest for both.
    const sel = items.find((x) => x.it.id === place.sel && x.r)?.it;
    const lay = phoneNow() ? 'Phone' : 'Desktop';
    layer.querySelector('.cb_place_name').textContent = sel ? `${sel.label} (${sel.lay || sel.pin ? lay : 'Both Layouts'})` : `Editing ${lay}: tap an outline to pick it`;
    layer.querySelector('#cb_place_snap').checked = !!s.placeSnap;
    layer.querySelector('.cb_place_gridset').style.display = s.placeSnap ? '' : 'none';
    const grid = layer.querySelector('.cb_place_grid');
    const gs = rangeNum(s, 'placeGrid');
    grid.style.display = s.placeSnap ? 'block' : 'none';
    grid.style.backgroundSize = `${gs}px ${gs}px`;
    layer.querySelector('#cb_place_undo').disabled = !place.undo.length;
    layer.querySelector('#cb_place_reset').disabled = !sel || placeAtStart(sel);
    // The bar sits at the bottom of the screen, or at the top or in the middle while it would cover a small item there,
    // like a send bar or menu bar, so every item stays in reach.
    const pill = layer.querySelector('#cb_place_pill');
    let best = null;
    for (const spot of ['', 'cb_place_top', 'cb_place_mid']) {
      pill.classList.remove('cb_place_top', 'cb_place_mid');
      if (spot) pill.classList.add(spot);
      const p = pill.getBoundingClientRect();
      const n = small.filter((r) => p.left < r.right && p.right > r.left && p.top < r.bottom && p.bottom > r.top).length;
      if (!best || n < best.n) best = { spot, n };
      if (!n) break;
    }
    pill.classList.remove('cb_place_top', 'cb_place_mid');
    if (best.spot) pill.classList.add(best.spot);
  }

  // Opened from the menu, which hides until Done. `first` picks which kind of item starts picked ('lay', 'pop' or 'fg').
  // `first` can also be one item's id, like a Pinned Block's.
  function startPlacement(first) {
    if (!isOn() || place.on) return;
    // Pinned Blocks with nothing to show yet get their box while Edit Layout is open, so they can be placed too.
    place.on = true;
    document.body.classList.add('ntr_placing');
    syncPins();
    // A block still in its message is outlined there, so the chat scrolls to it first.
    const firstPin = placeItems().find((it) => it.id === first && it.pin);
    if (firstPin && !pinBoxed(pinOf(firstPin), phoneNow())) pinSource(pinOf(firstPin))?.el.scrollIntoView({ block: 'nearest' });
    const shown = placeItems().filter((it) => placeRect(it));
    if (!shown.length) {
      place.on = false;
      document.body.classList.remove('ntr_placing');
      syncPins();
      toastr.info('Nothing to move yet. Set an avatar to Pop Out, add a foreground image, or pick a Pinned Block with Layout on, first.', 'Edit Placement');
      return;
    }
    place.undo = [];
    place.sel = (shown.find((it) => it.id === first) || shown.find((it) => placeKind(it) === first) || shown[0]).id;
    const ov = document.getElementById('cb_modal_overlay');
    if (ov) ov.style.display = 'none';
    const layer = ensurePlaceLayer();
    // One outline for each item there is now. Pinned Blocks come and go, so they're made fresh each time.
    layer.querySelectorAll('.cb_place_box').forEach((b) => b.remove());
    layer.querySelector('#cb_place_pill').insertAdjacentHTML('beforebegin', placeItems().map((it) => `<div class="cb_place_box" data-id="${it.id}"><span>${escapeHTML(it.label)}</span>${it.lay || it.pin ? GRIPS.map((g) => `<i class="cb_place_grip" data-g="${g}"></i>`).join('') : ''}</div>`).join(''));
    layer.style.display = 'block';
    window.addEventListener('touchmove', onPlaceTouchMove, { passive: false, capture: true });
    // A block still in its message moves with the chat, so the outlines follow any scroll, like Page Down in Reader Mode.
    document.addEventListener('scroll', drawPlace, true);
    drawPlaceNow();
  }

  function endPlacement() {
    if (!place.on) return;
    // A drag not let go yet (Escape in the middle of one) isn't saved, so it goes back where it started. A foreground
    // picture whose chat has changed meanwhile goes back in that chat's data, not the new one's.
    const d = place.drag;
    if (d?.fg && d.fg.owner !== fgOwner()) Object.assign(d.fg.data, { [d.it.pos + 'X']: d.start.x, [d.it.pos + 'Y']: d.start.y });
    else if (d?.it.pin) {
      const p = pinOf(d.it);
      if (p) { Object.assign(p, structuredClone(d.both)); cssTag('ntr_pin_css', pinCss(settings())); }
    } else if (d) placeSet(d.it, d.both || d.start);
    place.on = false;
    place.drag = null;
    place.undo = [];
    cancelAnimationFrame(place.frame);
    place.frame = 0;
    place.step = null;
    place.dirty = false;
    const layer = document.getElementById('cb_place_layer');
    if (layer) layer.style.display = 'none';
    window.removeEventListener('touchmove', onPlaceTouchMove, true);
    document.removeEventListener('scroll', drawPlace, true);
    document.body.classList.remove('ntr_placing');
    syncPins();
    const ov = document.getElementById('cb_modal_overlay');
    syncLayoutPage(ov);
    if (ov) ov.style.display = '';
  }

  // ===== Layout =====
  // The chat panel, SillyTavern's menu bar and the send bar can be moved (the Layout page and Edit Layout). There are two
  // layouts: Desktop for screens wider than 1000px, and Phone for 1000px or less, where SillyTavern switches to its phone
  // look. Each has its own settings: the Phone one's names start with layPh (see lk in index.js).
  const LAY_WIDE = window.matchMedia('(width > 1000px)');
  // Pinned Blocks redraw too: a block can have its own box in one layout and stay in its message in the other, which
  // changes whether Where You're Reading watches the scrolling. An open Edit Layout names the other layout.
  LAY_WIDE.addEventListener('change', () => { syncLayoutPage(document.getElementById('cb_modal_overlay')); syncPins(); drawPlace(); });
  // The layout this page uses now.
  const phoneNow = () => !LAY_WIDE.matches;
  const layOn = (s) => isOn() && s.layEnabled;
  // Whether the send bar, page bar or banner ('Send', 'Page', 'Ban') is Floating in the layout this page uses.
  const partFree = (part, s = settings()) => layOn(s) && s[lk(phoneNow(), part)] === 'free';
  const sendFree = (s) => partFree('Send', s);
  const pageFree = (s) => partFree('Page', s);
  const banFree = (s) => partFree('Ban', s);
  const barUpright = (edge) => edge === 'left' || edge === 'right';
  // The menu bar's icons. The bar is never shorter than one icon's room (SillyTavern's bar thickness) for each of them,
  // unless the screen edge is shorter than that: then the icons squeeze to fit.
  const barIcons = () => Math.max(1, [...document.querySelectorAll('#top-settings-holder > .drawer')].filter((d) => getComputedStyle(d).display !== 'none').length);
  function barCell() {
    const probe = document.createElement('div');
    probe.style.cssText = 'position: fixed; visibility: hidden; height: var(--topBarBlockSize);';
    document.body.appendChild(probe);
    const h = probe.getBoundingClientRect().height;
    probe.remove();
    return h || 35;
  }

  function layoutCss(s) {
    return layOn(s) ? layoutBlock(s, false) + layoutBlock(s, true) : '';
  }

  // One layout's CSS, for the screens it's used on.
  function layoutBlock(s, phone) {
    const v = (name) => s[lk(phone, name)];
    const n = (name) => rangeNum(s, lk(phone, name));
    const T = 'var(--topBarBlockSize)'; // SillyTavern's menu bar thickness, and the room each icon gets along it
    const edge = LAY_EDGES.includes(v('BarEdge')) ? v('BarEdge') : 'top';
    const up = barUpright(edge);
    // Standing on its side, the bar is as thick as its icons are wide.
    const root = { '--ntr-bt': up ? `max(${T}, var(--topBarIconSize) * 1.25 + 6px)` : T };
    const bt = 'var(--ntr-bt)';
    let css = '';

    // Chat panel. Unmoved, it sits where SillyTavern puts it, leaving room for the menu bar on its edge: on a computer in
    // the middle at SillyTavern's chat width, on a phone across the whole screen. A moved one on a computer sets
    // SillyTavern's chat width, so the settings panels keep its width.
    if (v('ChatMoved')) {
      const w = n('ChatW'), h = n('ChatH');
      if (!phone) root['--sheldWidth'] = `${w}vw`;
      Object.assign(root, { '--ntr-cw': `${w}vw`, '--ntr-cx': `min(${n('ChatX')}vw, ${100 - w}vw)`, '--ntr-cy': `min(${n('ChatY')}dvh, ${100 - h}dvh)`, '--ntr-ch': `${h}dvh` });
    } else {
      const above = edge === 'top' ? bt : '0px', below = edge === 'bottom' ? bt : '0px';
      let cw, cx;
      if (phone) {
        cw = up ? `calc(100vw - ${bt})` : '100vw';
        cx = edge === 'left' ? bt : '0px';
      } else {
        cw = up ? `min(var(--sheldWidth), 100vw - ${bt})` : 'var(--sheldWidth)';
        const [lo, hi] = edge === 'left' ? [bt, '100vw'] : edge === 'right' ? ['0px', `100vw - ${bt}`] : [];
        cx = up ? `clamp(${lo}, (100vw - ${cw}) / 2, ${hi} - ${cw})` : 'calc((100vw - var(--sheldWidth)) / 2)';
      }
      Object.assign(root, { '--ntr-cw': cw, '--ntr-cx': cx, '--ntr-cy': above, '--ntr-ch': `calc(100dvh - ${above} - ${below} - 1px)` });
    }
    // Layout places the chat panel, so SillyTavern's Movable UI Panels grip and resize corner on it go.
    css += cssRule('body #sheld', { left: 'var(--ntr-cx)', top: 'var(--ntr-cy)', width: 'var(--ntr-cw)', height: 'var(--ntr-ch)', 'max-height': 'var(--ntr-ch)', right: 'auto', bottom: 'auto', margin: '0', resize: 'none' });
    css += cssRule('body #sheld > #sheldheader', { display: 'none' });
    css += cssRule('body #chat', { 'max-height': 'none' });
    // Fixed parts are placed in the page's root, which SillyTavern's phone look leaves with no height. Anything held
    // by the bottom of the screen (a bar or Floating send bar there, settings panels above it) would end up above
    // the screen.
    if (phone) css += cssRule('html', { 'min-height': '100dvh' });

    // Menu bar: the icons and the strip behind them. It stays SillyTavern's own while it sits unmoved on the top edge
    // over an unmoved chat panel. Unmoved anywhere else, it lines up with the chat panel.
    if (edge !== 'top' || v('BarMoved') || v('ChatMoved')) {
      const min = `calc(${barIcons()} * ${T})`;
      if (!up) {
        const w = `min(100vw, max(${min}, ${v('BarMoved') ? `${n('BarLen')}vw` : 'var(--ntr-cw)'}))`;
        Object.assign(root, {
          '--ntr-bx': v('BarMoved') ? `clamp(0px, ${n('BarPos')}vw, 100vw - ${w})` : 'var(--ntr-cx)',
          '--ntr-by': edge === 'top' ? '0px' : `calc(100dvh - ${bt})`, '--ntr-bw': w, '--ntr-bh': bt,
        });
      } else {
        const h = `min(100dvh, ${v('BarMoved') ? `max(${min}, ${n('BarLen')}dvh)` : `${min} * 1.25`})`;
        Object.assign(root, {
          '--ntr-bx': edge === 'left' ? '0px' : `calc(100vw - ${bt})`, '--ntr-bw': bt, '--ntr-bh': h,
          '--ntr-by': v('BarMoved') ? `clamp(0px, ${n('BarPos')}dvh, 100dvh - ${h})` : `clamp(0px, var(--ntr-cy) + (var(--ntr-ch) - ${h}) / 2, 100dvh - ${h})`,
        });
      }
      css += cssRule('body #top-settings-holder, body #top-bar', { position: 'fixed', left: 'var(--ntr-bx)', top: 'var(--ntr-by)', width: 'var(--ntr-bw)', height: 'var(--ntr-bh)', right: 'auto', bottom: 'auto', margin: '0' });
      if (up) css += cssRule('body #top-settings-holder', { 'flex-direction': 'column' }) + cssRule('body #top-settings-holder > .drawer', { flex: '1 1 0', 'min-height': '0' });
      css += phone ? phonePanelCss(edge, bt) : deskPanelCss(edge, bt, up);
    }

    // Send bar. Floating, it has its own place; its bottom edge stays put, so it grows upward as you type more lines.
    if (v('Send') === 'free') {
      const w = n('SendW');
      css += cssRule('body #form_sheld', {
        position: 'fixed', left: `min(${n('SendX')}vw, ${100 - w}vw)`, width: `${w}vw`, margin: '0',
        top: 'auto', bottom: `min(${n('SendB')}dvh, 100dvh - var(--bottomFormBlockSize))`,
      });
      css += cssRule('body #chat', { 'padding-bottom': 'var(--ntr-send-room, 0px)' });
      // It stands apart from the chat panel, like a Separate send box, but without the gap.
      if (decorOn(s)) css += joinCss(s, true, 'body ');
    }

    // Reader Mode's page bar (reader.js). Floating, it has its own place, like a Floating send bar. It's never narrower
    // than its buttons and page number need (--ntr-rdbar-min, from reader.js), and stays on the screen.
    if (v('Page') === 'free') {
      const w = `max(${n('PageW')}vw, var(--ntr-rdbar-min, 0px))`;
      css += cssRule('body #ntr_rd_bar', {
        position: 'fixed', left: `clamp(0px, ${n('PageX')}vw, 100vw - ${w})`, width: w, margin: '0', 'box-sizing': 'border-box',
        top: 'auto', bottom: `min(${n('PageB')}dvh, 100dvh - 2.5em)`, 'align-self': 'auto', 'border-radius': '8px', border: '1px solid var(--SmartThemeBorderColor)',
      });
    }

    // The header banner (overlays.js). Floating, it has its own place and size, and sits above the chat panel's top
    // (overlays.js keeps it out of the messages and drops Overlap while it's Floating).
    if (v('Ban') === 'free') {
      const w = n('BanW'), h = n('BanH');
      css += cssRule('body #cb_banner', {
        position: 'fixed', left: `min(${n('BanX')}vw, ${100 - w}vw)`, top: `min(${n('BanY')}dvh, ${100 - h}dvh)`, width: `${w}vw`, height: `${h}dvh`,
        right: 'auto', bottom: 'auto', margin: '0', 'z-index': '35',
      });
    }
    // The chat panel's and the menu bar's places go straight into the rules that use them, not into variables on :root.
    // Every drag step rewrites this stylesheet, and a changed :root variable makes the browser restyle the whole page,
    // long chat included. For the same reason, broad selectors (.mes, *) don't belong in it.
    const put = (text) => text.replace(/var\((--ntr-[cb][xywh])\)/g, (m, k) => (k in root ? put(root[k]) : m));
    css = put(css);
    for (const k of Object.keys(root)) if (/^--ntr-[cb][xywh]$/.test(k)) delete root[k];
    return `\n      @media (width ${phone ? '<=' : '>'} 1000px) {${cssRule('html:root', root)}${css}\n      }\n`;
  }

  // Settings panels on a computer open out of the bar, toward the middle of the screen, at SillyTavern's panel width.
  // World Info stays where Movable UI Panels puts it.
  function deskPanelCss(edge, bt, up) {
    const pw = 'max(450px, var(--sheldWidth))'; // SillyTavern's own panel width
    const along = `clamp(0px, var(--ntr-bx) + (var(--ntr-bw) - ${pw}) / 2, 100vw - ${pw})`;
    const panel = {
      top: { left: along, top: bt, 'max-height': `calc(100dvh - ${bt} - var(--bottomFormBlockSize))` },
      bottom: { left: along, top: 'auto', bottom: bt, 'max-height': `calc(100dvh - ${bt})` },
      left: { left: bt, top: '0px', 'max-height': '100dvh' },
      right: { left: `calc(100vw - ${bt} - ${pw})`, top: '0px', 'max-height': '100dvh' },
    }[edge];
    const drawers = '#top-settings-holder > .drawer > .drawer-content:not(.fillLeft):not(.fillRight)';
    let css = cssRule(`body:not(.movingUI) ${drawers}, body.movingUI ${drawers}:not(#WorldInfo)`, { position: 'fixed', margin: '0', right: 'auto', bottom: 'auto', ...panel });
    // Beside a bar on the left or right they take the whole height of the screen, like SillyTavern's side panels.
    if (up) {
      css += cssRule(`body:not(.movingUI) ${drawers}.openDrawer, body.movingUI ${drawers}.openDrawer:not(#WorldInfo)`, { height: '100dvh' });
      // The side panel on the bar's side moves over so the bar doesn't cover it.
      const sideW = `calc((100vw - var(--sheldWidth) - 2px) / 2 - ${bt})`;
      css += cssRule('body:not(.movingUI) #top-settings-holder .fillLeft, body:not(.movingUI) #top-settings-holder .fillRight', { 'max-height': '100dvh' });
      css += cssRule(`body:not(.movingUI) #top-settings-holder .${edge === 'left' ? 'fillLeft' : 'fillRight'}`,
        edge === 'left' ? { left: bt, width: sideW } : { left: 'auto', right: bt, width: sideW });
    }
    return css;
  }

  // Settings panels on a phone open out of the bar too, and fill the rest of the screen. The two side panels (AI Response
  // Configuration, Character Management) do the same, as they already fill the screen in SillyTavern's phone look.
  function phonePanelCss(edge, bt) {
    const rest = `calc(100vw - ${bt})`;
    const panel = {
      top: { left: '0px', width: '100vw', top: bt, 'max-height': `calc(100dvh - ${bt})` },
      bottom: { left: '0px', width: '100vw', top: 'auto', bottom: bt, 'max-height': `calc(100dvh - ${bt})` },
      left: { left: bt, width: rest, top: '0px', 'max-height': '100dvh' },
      right: { left: '0px', width: rest, top: '0px', 'max-height': '100dvh' },
    }[edge];
    const drawers = '#top-settings-holder > .drawer > .drawer-content';
    return cssRule(`body ${drawers}`, { position: 'fixed', margin: '0', right: 'auto', bottom: 'auto', 'min-width': '0', 'max-width': 'none', ...panel })
      + cssRule(`body ${drawers}.openDrawer`, { height: panel['max-height'] });
  }

  let layCssNow = null;
  function applyLayout() {
    let el = document.getElementById('ntr_layout_style');
    if (!el) {
      el = document.createElement('style');
      el.id = 'ntr_layout_style';
      document.head.appendChild(el);
    }
    const css = layoutCss(settings());
    if (css === layCssNow) return;
    layCssNow = css;
    el.textContent = css;
    relayoutAll();
  }

  // What NTR places by the chat panel or the send bar follows them when they move.
  function relayoutAll() {
    layoutPop();
    window.NTR.overlays?.relayout();
    syncSendRoom();
    window.NTR.vn?.relayout?.();
    window.NTR.reader?.relayout();
  }

  // A Floating send bar over the bottom of the chat panel: the chat gets that much room at its bottom, so the last
  // message can scroll up above the send bar.
  let sendRo = null;
  function syncSendRoom() {
    const chat = document.getElementById('chat');
    const form = document.getElementById('form_sheld');
    if (!chat || !form) return;
    let room = 0;
    if (sendFree()) {
      if (!sendRo && window.ResizeObserver) (sendRo = new ResizeObserver(() => syncSendRoom())).observe(form);
      const c = chat.getBoundingClientRect(), f = form.getBoundingClientRect();
      if (f.height && f.left < c.right && f.right > c.left && f.top < c.bottom && f.top > c.top + c.height / 2) room = Math.ceil(c.bottom - f.top);
    }
    const v = room ? room + 'px' : '';
    if (chat.style.getPropertyValue('--ntr-send-room') !== v) chat.style.setProperty('--ntr-send-room', v);
  }

  // The Layout page. It changes the layout this screen uses, like Edit Layout, apart from the settings marked Both Layouts
  // and Pinned Blocks' own settings. The page follows the window across 1000px.
  const layScope = (t) => `<span class="ntr_scope">${t}</span>`;
  // Which layout the page is editing. It follows the window across 1000px (syncLayoutPage).
  const layNowHtml = (ph) => `<span class="ntr_scope"><b>${ph ? 'Phone' : 'Desktop'}</b> · ${ph ? '1000px or Less' : 'Over 1000px'}</span>
    <span class="cb_hint">${ph ? 'Wider windows use Desktop.' : 'Narrower windows use Phone.'}</span>`;

  function layoutSectionHtml(s) {
    const ph = phoneNow();
    const btn = (id, icon, label) => `<button type="button" id="${id}" class="menu_button" style="margin: 0; width: max-content;"><i class="fa-solid ${icon}"></i> ${label}</button>`;
    return pageHtml('layout', `
        ${card('', `
          <div class="m_l_now">${layNowHtml(ph)}</div>
          <div class="cb_hint">Attached parts move with the chat panel; Floating ones move on their own.</div>
          <div class="cb_actions m_l_actions">${btn('m_l_edit', 'fa-up-down-left-right', 'Edit Layout')}${btn('m_l_reset', 'fa-rotate-left', 'Restore ST Layout')}</div>`)}
        ${card('Chat Panel', `
          <div class="m_l_over" data-lay="width phone">${ovRow(s, 'ovWidthOn', `Chat Width${layScope('Desktop Only')}`, rangeSlider(s, 'ovWidth'))}</div>
          <div class="cb_hint m_l_note" data-lay="width" hidden>Off: the chat panel was moved. Reset it in Edit Layout to use this.</div>
          ${ovRow(s, 'ovMesGapOn', `Space Between Messages${layScope('Both Layouts')}`, rangeSlider(s, 'ovMesGap'))}
          ${ovRow(s, 'ovNamesOn', `Hide Names and Avatars${layScope('Both Layouts')}`, '<div class="cb_hint" style="margin: 0;">Also hides timestamps and pop-outs. Message Details\' Avatar spot goes with the avatar.</div>')}`, 'fa-comments')}
        ${card('ST Menu Bar', `
          ${pills('lbaredge', [['top', 'Top'], ['bottom', 'Bottom'], ['left', 'Left'], ['right', 'Right']], s[lk(ph, 'BarEdge')])}
          <div class="cb_hint" style="margin-bottom: 0;">Picking an edge puts the bar back at its start there.</div>`, 'fa-window-maximize')}
        ${card('Send Bar', `
          ${pills('lsend', [['attached', 'Attached'], ['free', 'Floating']], s[lk(ph, 'Send')])}
          <div class="m_l_over" data-lay="send">${ovRow(s, 'ovSendPosOn', `Attached Style${layScope('Both Layouts')}`, ovPick(s, 'ovSendPos', [['joined', 'Joined'], ['separate', 'Separate']])
            + ovWhen('ovSendPos', 'separate', ovLabel('Gap', rangeSlider(s, 'ovSendGap'))))}</div>
          <div class="cb_hint m_l_note" data-lay="send" style="margin-bottom: 0;" hidden>Not used while the send bar is Floating.</div>`, 'fa-paper-plane')}
        ${card('Page Bar', `
          ${pills('lpage', [['attached', 'Attached'], ['free', 'Floating']], s[lk(ph, 'Page')])}
          <div class="cb_hint" style="margin-bottom: 0;">Reader Mode's page bar. Edit Layout shows it only while Reader Mode is on.</div>`, 'fa-book-open')}
        ${card('Banner', `
          ${pills('lban', [['attached', 'Attached'], ['free', 'Floating']], s[lk(ph, 'Ban')])}
          <div class="cb_hint" style="margin-bottom: 0;">From Overlays. Floating keeps one place for every character.</div>`, 'fa-image')}
        ${card('Pinned Blocks', `
          <div class="cb_hint">Shows a block from the chat, or your agents' results, in its own box. Settings are shared; place and size are kept per layout.</div>
          <div id="m_pin_list"></div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0 0;">${btn('m_pin_add', 'fa-plus', 'Add Pinned Block')}${btn('m_pin_dash', 'fa-gauge-high', 'Add Dashboard')}</div>
          <div class="cb_hint" style="margin-bottom: 0;">Add Dashboard makes a box docked right with every agent that saves in the chat.</div>`, 'fa-thumbtack')}
    `, { sw: ['m_l_enable', s.layEnabled] });
  }

  function bindLayout(overlay, s) {
    const changed = () => { save(); updateAvatarStyle(); syncLayoutPage(overlay); };
    overlay.querySelector('#m_l_enable').onchange = function() { s.layEnabled = this.checked; changed(); };
    overlay.querySelector('#m_l_edit').onclick = () => startPlacement('lay');
    bindPins(overlay, s);
    onPills(overlay, 'lbaredge', (v) => {
      const ph = phoneNow();
      Object.assign(s, { [lk(ph, 'BarEdge')]: v, [lk(ph, 'BarMoved')]: false });
      changed();
    });
    // Floating starts where the part is now, so it doesn't jump. A part that isn't on screen starts where it was last, or at
    // its starting place. The bars keep their bottom edge, the banner its top and height.
    const freeFrom = (part, id) => (v) => {
      const ph = phoneNow();
      const el = document.getElementById(id);
      const r = el?.getBoundingClientRect();
      if (v === 'free' && s[lk(ph, part)] !== 'free' && layOn(s) && r?.width) {
        const W = window.innerWidth, H = window.innerHeight;
        Object.assign(s, { [lk(ph, part + 'X')]: pct(r.left, W), [lk(ph, part + 'W')]: pct(r.width, W) });
        if (part === 'Ban') Object.assign(s, { [lk(ph, 'BanY')]: pct(Math.max(0, r.top), H), [lk(ph, 'BanH')]: pct(r.height, H) });
        else s[lk(ph, part + 'B')] = pct(Math.max(0, H - r.bottom), H);
      }
      s[lk(ph, part)] = v;
      changed();
    };
    onPills(overlay, 'lsend', freeFrom('Send', 'form_sheld'));
    onPills(overlay, 'lpage', freeFrom('Page', 'ntr_rd_bar'));
    onPills(overlay, 'lban', freeFrom('Ban', 'cb_banner'));
    overlay.querySelector('#m_l_reset').onclick = async function() {
      const ph = phoneNow();
      if (!(await askYes(this, `Put the chat panel, menu bar, send bar, page bar and banner back where they start, in the ${ph ? 'Phone' : 'Desktop'} layout?`, 'Restore'))) return;
      for (const part of Object.values(LAY_PART)) for (const [k, x] of Object.entries(part.start)) s[lk(ph, k)] = x;
      changed();
    };
    syncLayoutPage(overlay);
  }

  // The Layout page's picks after Edit Layout changed them or the window crossed 1000px, and the settings that don't
  // apply to the layout this screen uses: Chat Width on Phone or once the chat panel has been moved, Attached Style while
  // the send bar is Floating.
  function syncLayoutPage(overlay) {
    if (!overlay) return;
    const s = settings();
    const ph = phoneNow();
    for (const [name, val] of [['lbaredge', s[lk(ph, 'BarEdge')]], ['lsend', s[lk(ph, 'Send')]], ['lpage', s[lk(ph, 'Page')]], ['lban', s[lk(ph, 'Ban')]]]) {
      const r = overlay.querySelector(`input[name="cbr_${name}"][value="${val}"]`);
      if (r) r.checked = true;
    }
    overlay.querySelectorAll('.m_l_now').forEach((el) => { el.innerHTML = layNowHtml(ph); });
    const over = { phone: ph, width: !ph && layOn(s) && s.layChatMoved, send: sendFree(s) };
    overlay.querySelectorAll('.m_l_over').forEach((el) => el.classList.toggle('cb_dim', el.dataset.lay.split(' ').some((k) => over[k])));
    overlay.querySelectorAll('.m_l_note').forEach((el) => { el.hidden = !over[el.dataset.lay]; });
  }

  // ===== Pinned Blocks =====
  // A block your regexes draw in the chat, like a tracker, shown in a box of its own on screen. NTR copies it from the
  // newest message that has it, so SillyTavern's own message stays as it is, and can hide it in the messages. Pinned
  // Blocks are part of Layout, so Layout's switch counts. A block is remembered by the tag and classes of what was picked
  // in the chat, never as typed-in CSS, so a theme from someone else can't slip CSS in through it.
  // A block can show agents' saved results instead (Agent Results; agents.js draws them), Stacked or in Tabs. Add
  // Dashboard makes one set up for that.
  // Each block has a place on screen for Desktop and one for Phone, as a % of the screen: Floating anywhere, or Docked
  // to the left or right edge at full height. On a phone a docked block slides out from its edge. A Floating box is the
  // height set in Edit Layout (Fixed), or as tall as what it shows (Fit Content).
  // Blocks saved before Where You're Reading and Fit Content came in keep Always and Fixed; new ones start on them.
  // A Floating block from the chat stays in its message until it's dragged out with Edit Layout (moved, kept for Desktop
  // and Phone apart); Reset puts it back there.
  // While a block is being picked in the chat (see pickPin), the boxes hide and the originals show.
  let pinPicking = false;
  // What a block looks for in the messages. Empty until something has been picked.
  const pinSel = (p) => (p.tag && p.classes.length ? p.tag + p.classes.map((c) => '.' + CSS.escape(c)).join('') : '');
  // Whether a block has something to look for: a picked block, or at least one agent.
  const pinHas = (p) => (p.from === 'agents' ? p.agents.length > 0 : !!pinSel(p));
  const pinsLive = (s) => layOn(s) && s.layPins.some(pinHas);
  const pinPhone = (phone) => (phone ? 'phone' : 'desk');
  // Whether a block has its own box in that layout, or stays in its message. Visual Novel Mode shows a message's text
  // only, so there a block still in its message gets its box too, at its starting spot.
  const pinBoxed = (p, phone) => p.from === 'agents' || p.place !== 'float' || p[pinPhone(phone)].moved || !!settings().nodeEnabled;
  // Where Reset puts a block: a Floating one back in its message (Agent Results, which have no message, to the starting
  // spot), a Docked one back to its starting width, still docked.
  function pinStart(p, phone) {
    const k = pinPhone(phone), d = PIN_START[k];
    if (p.place !== 'float') return { ...p[k], w: d.w };
    return { ...d, moved: p.from === 'agents' ? p[k].moved : false };
  }

  // Where You're Reading: the message crossing a line a third of the way down the chat, or null at the bottom of the
  // chat, for the newest. Only while the chat scrolls freely: Reader Mode's pages and Visual Novel Mode pick the
  // message themselves (window.NTR.reader.upTo). Messages Reader Mode hides have no height and are skipped.
  function pinReadAt() {
    const chat = document.getElementById('chat');
    if (!chat || settings().nodeEnabled || window.NTR.reader?.page()) return null;
    if (chat.scrollHeight - chat.scrollTop - chat.clientHeight <= 4) return null;
    const r = chat.getBoundingClientRect();
    const line = r.top + r.height / 3;
    // From the newest up, so near the bottom only a few are measured. Above every message, the oldest one.
    const all = chat.querySelectorAll(':scope > .mes');
    let m = null;
    for (let i = all.length - 1; i >= 0; i--) {
      if (!all[i].offsetHeight) continue;
      m = all[i];
      if (m.getBoundingClientRect().top <= line) break;
    }
    return m ? Number(m.getAttribute('mesid')) : null;
  }
  // The message a block shows up to: the page you're on in Reader Mode, and with Where You're Reading, the message
  // you're reading too. Null for the newest.
  function pinUpTo(p) {
    const page = window.NTR.reader?.upTo() ?? null;
    const read = p.show === 'reading' ? pinRead : null;
    return page == null ? read : read == null ? page : Math.min(page, read);
  }

  // The newest message with the block, up to pinUpTo: any message, or only the newest reply. Its <style> tags come along,
  // since a regex often puts the block's look there.
  function pinSource(p) {
    const sel = pinSel(p);
    if (!sel) return null;
    const upTo = pinUpTo(p);
    const mes = [...document.querySelectorAll('#chat > .mes')];
    const all = mes.filter((m) => upTo == null || Number(m.getAttribute('mesid')) <= upTo).reverse();
    const reply = all.find((m) => m.getAttribute('is_user') === 'false' && m.getAttribute('is_system') !== 'true');
    const find = (list) => {
      for (const m of list) {
        const text = m.querySelector('.mes_text');
        const el = text?.querySelector(sel);
        if (el) return { el, styles: [...text.querySelectorAll('style')] };
      }
      return null;
    };
    if (p.show === 'newest') return find([reply].filter(Boolean));
    // Scrolled up past the oldest loaded message with the block, Where You're Reading keeps to the oldest one there is.
    // Never past a Reader Mode page, though: that would show what happens later.
    const above = p.show === 'reading' && pinRead != null && upTo === pinRead;
    return find(all) || (above ? find(mes.filter((m) => Number(m.getAttribute('mesid')) > upTo)) : null);
  }

  // The copy in the box. Ids get the block's own ending, with labels pointing at the new ones, so a label that opens
  // something (the checkbox trick) opens the copy and not the hidden original.
  // The copied <style> rules point at the copy's ids, like #threads-toggle:checked ~ .list. Only selectors change (the
  // text before each {), so a color like #add inside a rule stays as it is.
  // They also reach only the copy. SillyTavern starts every selector in a message's styles with .mes_text, which matches
  // every message, so the copied styles of an older message would restyle the newer ones in the chat too. :where() keeps
  // each rule exactly as strong as before.
  function pinStyle(text, ids, pin) {
    const scope = `:where(#ntr_pin_layer > .ntr_pin[data-pin="${pin}"]) > .mes_text`;
    const swap = (sel) => sel.replace(/#((?:[\w-]|\\.)+)/g, (m, id) => (ids.has(id) ? '#' + CSS.escape(ids.get(id)) : m))
      .replace(/(^|,)(\s*)\.mes_text(?![\w-])/g, (m, a, sp) => a + sp + scope);
    // Comments go first, so one in front of a selector, like /* Threads */, doesn't hide its .mes_text. Quoted text,
    // like content: "/* a label */", stays as it is.
    return text.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\/\*[\s\S]*?\*\//g, (m, str) => str || '').replace(/(^|[{}])([^{}]*)(?=\{)/g, (m, a, sel) => a + swap(sel));
  }

  function pinFill(body, src, p) {
    const was = { open: [...body.querySelectorAll('details')].map((d) => d.open), checked: [...body.querySelectorAll('input')].map((i) => i.checked) };
    const copy = src.el.cloneNode(true);
    // A <style> inside the block comes along with the message's other styles below, scoped to the box, so the copy's own
    // unscoped one goes.
    copy.querySelectorAll('style').forEach((st) => st.remove());
    const ids = new Map();
    for (const e of [copy, ...copy.querySelectorAll('[id]')]) {
      if (!e.id) continue;
      ids.set(e.id, `${e.id}--ntr-${p.id}`);
      e.id = ids.get(e.id);
    }
    if (ids.size) for (const l of [copy, ...copy.querySelectorAll('label[for]')]) if (l.htmlFor && ids.has(l.htmlFor)) l.htmlFor = ids.get(l.htmlFor);
    // Radio buttons get their own group name too, so the copy's don't join the original's group and uncheck it.
    for (const r of [copy, ...copy.querySelectorAll('input[name]')]) if (r.tagName === 'INPUT' && r.name) r.name = `${r.name}--ntr-${p.id}`;
    const styles = src.styles.map((st) => {
      const c = st.cloneNode(true);
      c.textContent = pinStyle(c.textContent, ids, p.id);
      return c;
    });
    body.replaceChildren(...styles, copy);
    // A swipe or a new reply brings a fresh copy; what was opened in the box stays open when the copy matches.
    const det = [...body.querySelectorAll('details')], inp = [...body.querySelectorAll('input')];
    if (det.length === was.open.length) det.forEach((d, i) => { d.open = was.open[i]; });
    if (inp.length === was.checked.length) inp.forEach((x, i) => { x.checked = was.checked[i]; });
  }

  const pinLast = new Map();
  let pinObs = null, pinTimer = null;
  // The message being read, while a box uses Where You're Reading (see pinReadAt). Scrolling only works it out again; the
  // boxes redraw when it changes.
  let pinRead = null, pinReadOn = false, pinReadFrame = 0;
  // The chat changing size (a phone's keyboard, a resized window) can bring another message to the line without a scroll.
  function onPinScroll(e) {
    if (e.target.id === 'chat') pinCheckRead();
  }
  function pinCheckRead() {
    if (!pinReadOn || pinReadFrame) return;
    pinReadFrame = requestAnimationFrame(() => {
      pinReadFrame = 0;
      const at = pinReadAt();
      if (at !== pinRead) { pinRead = at; syncPins(); }
    });
  }
  function watchRead(on) {
    if (on === pinReadOn) return;
    pinReadOn = on;
    document[on ? 'addEventListener' : 'removeEventListener']('scroll', onPinScroll, { capture: true, passive: true });
  }
  function queuePins() {
    if (pinTimer) return;
    pinTimer = setTimeout(() => { pinTimer = null; syncPins(); }, 200);
  }
  // Messages being added, swiped, edited, deleted or streamed all change the chat, so the chat is watched while any block
  // is live. Streaming changes it many times a second, so the boxes catch up at most five times a second.
  function watchPins(on) {
    const chat = document.getElementById('chat');
    if (on && !pinObs && chat && window.MutationObserver) {
      pinObs = new MutationObserver(queuePins);
      pinObs.observe(chat, { childList: true, subtree: true, characterData: true });
    } else if (!on && pinObs) {
      pinObs.disconnect();
      pinObs = null;
    }
  }

  // The boxes on screen, and the CSS that places them and hides the originals.
  function syncPins() {
    const s = settings();
    const live = pinsLive(s);
    watchPins(live);
    // Only boxes count: a Floating block still in its message is read in place.
    const reading = live && s.layPins.some((p) => pinHas(p) && p.show === 'reading' && pinBoxed(p, phoneNow()));
    watchRead(reading);
    pinRead = reading ? pinReadAt() : null;
    cssTag('ntr_pin_css', live && !pinPicking ? pinCss(s) : '');
    let layer = document.getElementById('ntr_pin_layer');
    if (!live) { layer?.remove(); pinLast.clear(); return; }
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'ntr_pin_layer';
      layer.addEventListener('click', (e) => {
        const tab = e.target.closest('.ntr_pin_tab');
        if (tab) tab.parentElement.classList.toggle('ntr_open');
      });
      document.body.appendChild(layer);
    }
    const vnOn = !!s.nodeEnabled;
    const keep = new Set();
    for (const p of s.layPins) {
      if (!pinHas(p)) continue;
      keep.add(p.id);
      let box = layer.querySelector(`:scope > .ntr_pin[data-pin="${p.id}"]`);
      if (!box) {
        box = document.createElement('div');
        box.dataset.pin = p.id;
        box.innerHTML = '<button type="button" class="ntr_pin_tab"><i class="fa-solid fa-thumbtack"></i></button><div class="ntr_pin_body mes_text"></div>';
        layer.appendChild(box);
      }
      box.className = `ntr_pin ntr_pin_${p.place} ntr_pin_${p.frame}${p.place === 'float' && p.height === 'fit' ? ' ntr_pin_fit' : ''}${box.classList.contains('ntr_open') ? ' ntr_open' : ''}`;
      const tab = box.querySelector('.ntr_pin_tab');
      tab.title = `Show or hide ${p.name}`;
      tab.setAttribute('aria-label', tab.title);
      const body = box.querySelector('.ntr_pin_body');
      let src;
      if (p.from === 'agents') {
        // In Reader Mode, the results up to the page you're on; with Where You're Reading, up to the message you're reading.
        // While a result is being edited in the box, the box stays on that result's message, so scrolling, turning the
        // page or a newer result coming in doesn't lose what's typed.
        const ed = body.querySelector('.ntr_agres_edit, .ntr_agf_input')?.closest('.ntr_agres');
        const upTo = ed && ed.dataset.mes !== '' ? Number(ed.dataset.mes) : pinUpTo(p);
        // As of: the message you're reading, while it isn't the newest (pinRead stays null in Reader Mode and Visual
        // Novel Mode, which pick the message themselves).
        src = pinPicking ? null : window.NTR.agents?.pinView(p.agents, upTo, { pin: p.id, view: p.view, asOf: !ed && p.show === 'reading' ? pinRead : null });
        const key = src ? 'ag:' + src.key : '';
        if (pinLast.get(p.id) !== key) {
          pinLast.set(p.id, key);
          if (src) src.fill(body);
          else body.replaceChildren();
        }
      } else {
        src = pinPicking ? null : pinSource(p);
        const key = src ? src.el.outerHTML + src.styles.map((x) => x.textContent).join('') : '';
        if (pinLast.get(p.id) !== key) {
          pinLast.set(p.id, key);
          if (src) pinFill(body, src, p);
          else body.replaceChildren();
        }
      }
      // While Edit Layout is open, a block with nothing to show yet still gets its box, so it can be placed.
      box.classList.toggle('ntr_pin_empty', !src);
      if (!src) body.dataset.name = p.name;
      box.hidden = pinPicking || (vnOn && p.vn === 'hide') || (!src && !place.on);
    }
    for (const box of layer.querySelectorAll(':scope > .ntr_pin')) if (!keep.has(box.dataset.pin)) { pinLast.delete(box.dataset.pin); box.remove(); }
    if (place.on) drawPlace();
  }

  function pinCss(s) {
    let css = '';
    for (const p of s.layPins) {
      if (!pinHas(p)) continue;
      const sel = pinSel(p);
      const box = `#ntr_pin_layer > .ntr_pin[data-pin="${p.id}"]`;
      for (const phone of [false, true]) {
        const r = p[pinPhone(phone)];
        const boxed = pinBoxed(p, phone);
        let props;
        if (!boxed) {
          props = { display: 'none' };
        } else if (p.place === 'float' && p.height === 'fit') {
          // Fit Content: as tall as what it shows, up to the edge of the screen. It keeps the edge of its spot nearer the
          // top or bottom of the screen, so a box in the bottom half grows up.
          const left = `min(${r.x}vw, ${100 - r.w}vw)`, width = `${r.w}vw`;
          if (r.y + r.h / 2 <= 50) {
            const top = `min(${r.y}dvh, ${100 - r.h}dvh)`;
            props = { left, top, bottom: 'auto', width, height: 'auto', 'max-height': `calc(100dvh - ${top})` };
          } else {
            const bottom = `${Math.round(Math.max(0, 100 - r.y - r.h) * 100) / 100}dvh`;
            props = { left, top: 'auto', bottom, width, height: 'auto', 'max-height': `calc(100dvh - ${bottom})` };
          }
        } else if (p.place === 'float') {
          props = { left: `min(${r.x}vw, ${100 - r.w}vw)`, top: `min(${r.y}dvh, ${100 - r.h}dvh)`, width: `${r.w}vw`, height: `${r.h}dvh` };
        } else {
          // Docked: the whole height of its edge, beside SillyTavern's menu bar when the bar is on that edge. On a phone,
          // where the bar runs across the whole screen, it also stays clear of a bar along the top or bottom, and it's a
          // drawer at most most of the screen wide.
          const edge = s[lk(phone, 'BarEdge')];
          const bt = 'var(--ntr-bt, var(--topBarBlockSize))';
          const above = phone && edge === 'top' ? bt : '0px', below = phone && edge === 'bottom' ? bt : '0px';
          const side = edge === p.place ? bt : '0px';
          props = {
            top: above, height: `calc(100dvh - ${above} - ${below})`, width: phone ? `min(${r.w}vw, 85vw)` : `${r.w}vw`,
            [p.place]: side, [p.place === 'left' ? 'right' : 'left']: 'auto', '--ntr-pin-off': side,
          };
        }
        const hide = p.from === 'chat' && p.hide && boxed ? `\n      #chat .mes_text ${sel} { display: none !important; }` : '';
        css += `\n      @media (width ${phone ? '<=' : '>'} 1000px) {${hide}${cssRule(box, props)}\n      }`;
      }
    }
    return css ? css + '\n' : '';
  }

  // Pick from chat: the menu hides and clicking a block in a message picks it. What gets picked is the outermost element
  // around the click that has a class, inside the message text: the block the regex drew, not a line inside it.
  function pinTarget(t) {
    const text = t instanceof Element ? t.closest('#chat .mes_text') : null;
    if (!text || t === text) return null;
    let best = null;
    for (let e = t; e && e !== text; e = e.parentElement) {
      if (PIN_TAG.test(e.tagName.toLowerCase()) && [...e.classList].some((c) => PIN_CLASS.test(c))) best = e;
    }
    return best;
  }
  function pickPin(p, done) {
    if (pinPicking) return;
    const ov = document.getElementById('cb_modal_overlay');
    pinPicking = true;
    syncPins();
    if (ov) ov.style.display = 'none';
    const bar = document.createElement('div');
    bar.id = 'ntr_pick_bar';
    bar.innerHTML = `<span>Click the block for <b>${escapeHTML(p.name)}</b> in a message. Only blocks your regex gives a class can be picked.</span><button type="button">Cancel</button>`;
    const hl = document.createElement('div');
    hl.id = 'ntr_pick_hl';
    document.body.append(hl, bar);
    const show = (el) => {
      if (!el) { hl.style.display = 'none'; return; }
      const r = el.getBoundingClientRect();
      Object.assign(hl.style, { display: 'block', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    };
    const move = (e) => show(pinTarget(e.target));
    const finish = (el) => {
      document.removeEventListener('pointermove', move, true);
      document.removeEventListener('click', click, true);
      document.removeEventListener('keydown', key, true);
      hl.remove();
      bar.remove();
      pinPicking = false;
      if (el) {
        p.tag = el.tagName.toLowerCase();
        p.classes = [...el.classList].filter((c) => PIN_CLASS.test(c)).slice(0, PIN_LIMITS.classes);
        save();
      }
      if (ov) ov.style.display = '';
      syncPins();
      done?.();
    };
    const click = (e) => {
      if (bar.contains(e.target)) { if (e.target.closest('button')) finish(null); return; }
      e.preventDefault();
      e.stopPropagation();
      const el = pinTarget(e.target);
      if (el) finish(el);
    };
    const key = (e) => { if (e.key === 'Escape') { e.preventDefault(); finish(null); } };
    document.addEventListener('pointermove', move, true);
    document.addEventListener('click', click, true);
    document.addEventListener('keydown', key, true);
  }

  // The Pinned Blocks card on the Layout page: the list, and the settings of the one that's open.
  let pinOpen = null;
  function pinListHtml(s) {
    if (!s.layPins.length) return '<div class="cb_hint">No Pinned Blocks yet.</div>';
    const pick = (p, name, opts, cur) => pills(`pin${name}-${p.id}`, opts, cur);
    return s.layPins.map((p) => {
      const sel = pinSel(p);
      const names = p.agents.map((id) => (Array.isArray(s.agents) ? s.agents : []).find((a) => a?.id === id)?.name).filter(Boolean);
      const what = p.from === 'agents' ? (names.length ? `Agents: ${names.join(', ')}` : 'No agents picked yet')
        : sel ? `${p.tag}.${p.classes.join('.')}` : 'Nothing picked yet';
      const row = `
          <div class="ntr_pinrow" data-pin="${p.id}">
            <i class="fa-solid fa-fw ${p.from === 'agents' ? 'fa-gauge-high' : 'fa-thumbtack'}"></i>
            <span class="ntr_pinname">${escapeHTML(p.name)}<small>${escapeHTML(what)}</small></span>
            <button type="button" class="menu_button m_pin_edit${pinOpen === p.id ? ' on' : ''}" title="Settings" aria-label="Settings"><i class="fa-solid fa-gear"></i></button>
            <button type="button" class="menu_button m_pin_move" title="Move with Edit Layout" aria-label="Move with Edit Layout"><i class="fa-solid fa-up-down-left-right"></i></button>
            <button type="button" class="menu_button danger_button m_pin_del" title="Delete" aria-label="Delete"><i class="fa-solid fa-trash"></i></button>
          </div>`;
      if (pinOpen !== p.id) return row;
      return row + `
          <div class="ntr_tpanel ntr_pinedit" data-pin="${p.id}">
            <label>Name <input type="text" class="text_pole m_pin_name" maxlength="${PIN_LIMITS.name}" value="${escapeHTML(p.name)}"></label>
            <div class="cb_plab">Source</div>
            ${pick(p, 'from', [['chat', 'A Block From the Chat'], ['agents', 'Agent Results']], p.from)}
            ${p.from === 'agents' ? `
            <div class="cb_plab">Agents</div>
            ${(Array.isArray(s.agents) ? s.agents : []).map((a) => `<label class="checkbox_label"><input type="checkbox" class="m_pin_ag" value="${escapeHTML(a.id)}" ${p.agents.includes(a.id) ? 'checked' : ''}><span>${escapeHTML(a.name)}</span></label>`).join('') || '<div class="cb_hint">No agents yet. Make one on the Agents page.</div>'}
            <div class="cb_hint">Needs the Agents page on. They show in the Agents page's order.</div>
            <div class="cb_plab">Show Agents</div>
            ${pick(p, 'view', [['stacked', 'Stacked'], ['tabs', 'Tabs']], p.view)}
            <div class="cb_hint">Stacked shows every agent, each folding open and closed. Tabs shows one at a time. ▲ ▼ and ◆ mark what changed since the agent's previous result.</div>` : `
            <div class="cb_plab">Block</div>
            <button type="button" class="menu_button m_pin_pick" style="margin: 0; width: max-content;"><i class="fa-solid fa-hand-pointer"></i> Pick from chat</button>
            <div class="cb_hint">Click the block in a message. Escape cancels.</div>`}
            <div class="cb_plab">Place</div>
            ${pick(p, 'place', [['float', 'Floating'], ['left', 'Docked Left'], ['right', 'Docked Right']], p.place)}
            ${p.from === 'agents' ? '' : '<div class="cb_hint">Floating stays in its message until you drag it out in Edit Layout, in each layout.</div>'}
            ${p.place === 'float' ? `<div class="cb_plab">Height</div>
            ${pick(p, 'height', [['fit', 'Fit Content'], ['fixed', 'Fixed']], p.height)}` : ''}
            <div class="cb_plab">Which Message</div>
            ${p.from === 'agents' ? `${pick(p, 'show', [['reading', 'Where You\'re Reading'], ['always', 'Newest']], p.show === 'reading' ? 'reading' : 'always')}
            <div class="cb_hint">Where You're Reading follows your scroll in the chat.</div>` : `
            ${pick(p, 'show', [['reading', 'Where You\'re Reading'], ['always', 'Newest'], ['newest', 'Newest Reply Only']], p.show)}
            <div class="cb_hint">Where You're Reading follows your scroll in the chat. Newest Reply Only hides the box when the latest reply doesn't have the block.</div>`}
            <div class="cb_plab">Frame</div>
            ${pick(p, 'frame', [['none', 'None'], ['panel', 'Panel']], p.frame)}
            <div class="cb_plab">In Visual Novel Mode</div>
            ${pick(p, 'vn', [['show', 'Show'], ['hide', 'Hide']], p.vn)}
            ${p.from === 'agents' ? '' : `<label class="checkbox_label" style="margin-top: 8px;"><input type="checkbox" class="m_pin_hide" ${p.hide ? 'checked' : ''}><span>Hide the original in the chat</span></label>`}
          </div>`;
    }).join('');
  }

  function bindPins(overlay, s) {
    const list = overlay.querySelector('#m_pin_list');
    const render = () => { list.innerHTML = pinListHtml(s); };
    const changed = () => { save(); syncPins(); };
    const pinAt = (el) => s.layPins.find((p) => p.id === el.closest('[data-pin]')?.dataset.pin);
    render();
    overlay.querySelector('#m_pin_add').onclick = () => {
      if (s.layPins.length >= PIN_MAX) { toastr.info(`Up to ${PIN_MAX} Pinned Blocks.`, 'Pinned Blocks'); return; }
      // Each new box starts a little lower than the last, so they don't land on top of each other.
      const n = s.layPins.length;
      const [p] = cleanPins([{ name: `Pinned Block ${n + 1}`, show: 'reading', height: 'fit', desk: { ...PIN_START.desk, y: PIN_START.desk.y + (n % 6) * 8, moved: false }, phone: { ...PIN_START.phone, y: PIN_START.phone.y + (n % 6) * 8, moved: false } }]);
      s.layPins.push(p);
      pinOpen = p.id;
      changed();
      render();
    };
    // A Dashboard: Agent Results docked right, with every agent, starting on the message you're reading. Past the
    // block's agent limit, agents that are on go in first.
    overlay.querySelector('#m_pin_dash').onclick = () => {
      if (s.layPins.length >= PIN_MAX) { toastr.info(`Up to ${PIN_MAX} Pinned Blocks.`, 'Dashboard'); return; }
      const all = (Array.isArray(s.agents) ? s.agents : []).filter((a) => a?.id);
      if (!all.length) { toastr.info('Hire an agent on the Agents page first.', 'Dashboard'); return; }
      const agents = [...all.filter((a) => a.on), ...all.filter((a) => !a.on)].slice(0, PIN_LIMITS.agents).map((a) => a.id);
      if (all.length > agents.length) toastr.info(`A Dashboard holds up to ${PIN_LIMITS.agents} agents. Agents that are on went in first; change them in its settings.`, 'Dashboard');
      const n = s.layPins.filter((x) => x.name === 'Dashboard' || x.name.startsWith('Dashboard ')).length;
      const [p] = cleanPins([{ name: n ? `Dashboard ${n + 1}` : 'Dashboard', from: 'agents', agents, place: 'right', frame: 'panel', show: 'reading', view: 'stacked', height: 'fit' }]);
      s.layPins.push(p);
      pinOpen = p.id;
      changed();
      render();
      if (!layOn(s)) toastr.info('Turn Layout on to see it.', 'Dashboard');
    };
    list.addEventListener('click', async (e) => {
      const b = e.target.closest('button');
      const p = b && pinAt(b);
      if (!p) return;
      if (b.classList.contains('m_pin_edit')) { pinOpen = pinOpen === p.id ? null : p.id; render(); return; }
      if (b.classList.contains('m_pin_pick')) { pickPin(p, render); return; }
      if (b.classList.contains('m_pin_move')) {
        if (!layOn(s)) toastr.info('Turn Layout on first.', 'Pinned Blocks');
        else if (!pinHas(p)) toastr.info(p.from === 'agents' ? 'Pick an agent first.' : 'Pick the block in a message first.', 'Pinned Blocks');
        else startPlacement('pin_' + p.id);
        return;
      }
      if (b.classList.contains('m_pin_del')) {
        const stays = p.from === 'agents' ? 'The saved results stay in the chat.' : 'The block stays in your messages.';
        if (!(await askYes(b, `Delete the Pinned Block "${p.name}"? ${stays}`, 'Delete', { danger: true }))) return;
        s.layPins = s.layPins.filter((x) => x !== p);
        if (pinOpen === p.id) pinOpen = null;
        changed();
        render();
      }
    });
    list.addEventListener('change', (e) => {
      const t = e.target;
      const p = pinAt(t);
      if (!p) return;
      if (t.classList.contains('m_pin_name')) { p.name = t.value.trim().slice(0, PIN_LIMITS.name) || 'Pinned Block'; changed(); render(); return; }
      if (t.classList.contains('m_pin_hide')) { p.hide = t.checked; changed(); return; }
      if (t.classList.contains('m_pin_ag')) {
        p.agents = t.checked ? [...new Set([...p.agents, t.value])].slice(0, PIN_LIMITS.agents) : p.agents.filter((id) => id !== t.value);
        changed();
        render();
        return;
      }
      const m = /^cbr_pin(place|show|frame|vn|from|height|view)-/.exec(t.name || '');
      if (!m || !t.checked) return;
      p[m[1]] = t.value;
      // Each kind starts on its own Show: the message you're reading for a block, the newest for Agent Results.
      if (m[1] === 'from') p.show = t.value === 'agents' ? 'always' : 'reading';
      changed();
      if (m[1] === 'from' || m[1] === 'place') render();
    });
  }

  // What index.js calls.
  window.NTR.layout = {
    version: LAYOUT_VERSION,
    sectionHtml: layoutSectionHtml,
    bind: bindLayout,
    apply: applyLayout,
    syncPins,
    pinCheckRead,
    syncSendRoom,
    sendFree,
    pageFree,
    banFree,
    startPlacement,
    drawPlace,
    endPlacement,
  };
})();
