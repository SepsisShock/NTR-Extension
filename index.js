(() => {
  const MODULE = 'chatvisuals';
  const DEFAULTS = { 
    bannerMode: 'image', 
    bannerHeight: 120,
    bannerGap: 10,
    bannerBackdrop: 'wallpaper', 
    chars: {},
    avatarEnabled: true,
    
    // AI Settings
    aiStyle: 'backdrop', aiPopX: 0, aiPopY: 0,
    aiSide: 'tl', aiFit: 'cover', aiScale: 100, aiPad: 140, 
    aiTopFade: 0, aiBotFade: 180, aiLeftFade: 0, aiRightFade: 50, aiBlur: 0, aiMsgBg: true,
    
    // User Settings
    usStyle: 'backdrop', usPopX: 0, usPopY: 0,
    usSide: 'tr', usFit: 'cover', usScale: 100, usPad: 140, 
    usTopFade: 0, usBotFade: 180, usLeftFade: 50, usRightFade: 0, usBlur: 0, usMsgBg: true,

    // Foreground Settings
    fgEnabled: false,
    fgOpacity: 100,
    fgLeft: '',
    fgCenter: '',
    fgRight: '',
    fgLeftScale: 100,
    fgCenterScale: 100,
    fgRightScale: 100,
    chatTransparent: true,

    // Visual Node Mode
    nodeEnabled: false, nodeTypewriter: true, nodeSpeed: 20,
    nodeAuto: false, nodeAutoDelay: 2500, nodeOpacity: 88, nodePortrait: 120,
    nodeAvatars: {}
  };

  const ctx = () => SillyTavern.getContext();
  const save = () => ctx().saveSettingsDebounced();
  let banner = null;
  const popMsg = { ai: '', us: '' }; 
  const popDrag = { ai: false, us: false }; 

  const escapeHTML = (str) => {
    return String(str).replace(/[&<>'"]/g, match => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[match]));
  };

  function settings() {
    const { extensionSettings } = ctx();
    const fresh = !extensionSettings[MODULE];
    if (fresh) extensionSettings[MODULE] = {};
    const s = extensionSettings[MODULE];
    for (const k of Object.keys(DEFAULTS)) {
      if (s[k] === undefined) s[k] = structuredClone(DEFAULTS[k]);
    }
    if (!s.fadePxMigrated) {
      if (!fresh) {
        for (const p of ['ai', 'us']) {
          for (const k of ['TopFade', 'BotFade']) {
            s[p + k] = Math.min(400, Math.round((Number(s[p + k]) || 0) * 3));
          }
        }
      }
      s.fadePxMigrated = true;
    }
    if (s.bannerEnabled !== undefined && !s.migratedBanner) {
      s.bannerMode = s.bannerEnabled ? 'image' : 'off';
      s.migratedBanner = true;
      delete s.bannerEnabled;
    }
    return s;
  }

  function getAvatarCss(prefix, isUserStr, s) {
    const v = s[`${prefix}Side`][0]; 
    const h = s[`${prefix}Side`][1]; 
    const style = s[`${prefix}Style`] === 'popout' ? 'popout' : 'backdrop';
    const fit = s[`${prefix}Fit`];
    const scale = s[`${prefix}Scale`];
    const pad = s[`${prefix}Pad`];
    const popX = Number(s[`${prefix}PopX`]) || 0;
    const popY = Number(s[`${prefix}PopY`]) || 0;
    
    const topFade = s[`${prefix}TopFade`];
    const botFade = s[`${prefix}BotFade`];
    const leftFade = s[`${prefix}LeftFade`];
    const rightFade = s[`${prefix}RightFade`];
    const blurAmount = s[`${prefix}Blur`];
    const keepBg = s[`${prefix}MsgBg`] !== false;
    
    const width = Math.floor(scale * 3); 

    let padCss = '';
    if (h === 'l') padCss = `padding-left: ${pad}px !important;`;
    else if (h === 'r') padCss = `padding-right: ${pad}px !important;`;
    else padCss = `padding-left: ${Math.floor(pad / 2)}px !important; padding-right: ${Math.floor(pad / 2)}px !important;`;

    const justify = h === 'l' ? 'flex-start' : (h === 'r' ? 'flex-end' : 'center');
    const align = h === 'l' ? 'left' : (h === 'r' ? 'right' : 'center');
    const filterRule = blurAmount > 0 ? `filter: blur(${blurAmount}px) !important;` : '';

    const shared = `
      .mes[is_user="${isUserStr}"] .mes_block { ${padCss} }
      .mes[is_user="${isUserStr}"] .ch_name { display: flex !important; justify-content: ${justify} !important; text-align: ${align} !important; width: 100% !important; }
      ${keepBg ? '' : `.mes[is_user="${isUserStr}"] { background-color: transparent !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }`}
    `;

    if (style === 'popout') {
      const vA = v === 't' ? 'top: 0; bottom: auto;' : v === 'b' ? 'top: auto; bottom: 0;' : 'top: 50%; bottom: auto;';
      const hA = h === 'l' ? 'left: 0; right: auto;' : h === 'r' ? 'left: auto; right: 0;' : 'left: 50%; right: auto;';
      const tx = h === 'c' ? '-50%' : '0px';
      const ty = v === 'c' ? '-50%' : '0px';
      return `
        .mes[is_user="${isUserStr}"] .avatar { display: none !important; }
        #cb_pop_${prefix} {
          ${vA} ${hA}
          width: ${width}px; height: auto;
          transform: translate(calc(${tx} + ${popX}px), calc(${ty} + ${popY}px));
          ${blurAmount > 0 ? `filter: blur(${blurAmount}px);` : ''}
        }
        ${shared}
      `;
    }

    let wrapperPos = '';
    if (h === 'l') wrapperPos = 'left: 0 !important; right: auto !important;';
    else if (h === 'c') wrapperPos = 'left: 50% !important; transform: translateX(-50%) !important;';
    else if (h === 'r') wrapperPos = 'left: auto !important; right: 0 !important;';

    const objV = v === 't' ? 'top' : (v === 'c' ? 'center' : 'bottom');
    const objH = h === 'l' ? 'left' : (h === 'c' ? 'center' : 'right');
    const objPos = `${objH} ${objV}`;

    const hMask = `linear-gradient(to right, transparent 0%, black ${leftFade}%, black calc(100% - ${rightFade}%), transparent 100%)`;
    const vMask = `linear-gradient(to bottom, transparent 0, black ${topFade}px, black calc(100% - ${botFade}px), transparent 100%)`;

    let imgFitCss = 'object-fit: cover !important;';
    let imgBoxCss = 'inset: 0 !important; width: 100% !important; height: 100% !important;';
    if (fit === 'contain') {
      imgFitCss = 'object-fit: contain !important;';
      const vAnchor = v === 't' ? 'top: 0 !important; bottom: auto !important;'
                    : v === 'b' ? 'top: auto !important; bottom: 0 !important;'
                    : 'top: 50% !important; bottom: auto !important; transform: translateY(-50%) !important;';
      imgBoxCss = `left: 0 !important; right: 0 !important; ${vAnchor} width: 100% !important; height: auto !important; max-height: 100% !important;`;
    } else if (fit === 'original') imgFitCss = 'object-fit: none !important;';

    return `
      .mes[is_user="${isUserStr}"] .avatar { 
        position: absolute !important; top: 0 !important; bottom: 0 !important; height: 100% !important;
        width: ${width}px !important; max-width: 80% !important; 
        margin: 0 !important; padding: 0 !important; z-index: 0 !important; pointer-events: none !important; 
        overflow: hidden !important; border-radius: var(--SmartThemeChatMesRounding, 15px) !important; 
        display: block !important; background: transparent !important; border: none !important;
        ${wrapperPos}
        ${filterRule} 
      }
      .mes[is_user="${isUserStr}"] .avatar img { 
        position: absolute !important; ${imgBoxCss}
        display: block !important; margin: 0 !important; padding: 0 !important; border-radius: 0 !important;
        -webkit-mask-image: ${hMask}, ${vMask} !important;
        -webkit-mask-composite: source-in !important;
        mask-image: ${hMask}, ${vMask} !important; 
        mask-composite: intersect !important;
        ${imgFitCss} object-position: ${objPos} !important; 
      }
      ${shared}
    `;
  }

  function setPopStatus(prefix, msg) {
    popMsg[prefix] = msg;
    console.log(`[chatvisuals] pop out (${prefix}): ${msg}`);
    const el = document.getElementById(`m_${prefix}_pstat`);
    if (el) el.textContent = msg;
  }

  function ensurePopLayer() {
    let layer = document.getElementById('cb_pop_layer');
    if (layer) return layer;
    layer = document.createElement('div');
    layer.id = 'cb_pop_layer';
    layer.innerHTML = '<img id="cb_pop_ai" alt="" draggable="false"><img id="cb_pop_us" alt="" draggable="false">'
      + '<div id="cb_drag_pill"><span>Drag mode on</span><button type="button" id="cb_drag_done">Done</button></div>';
    document.body.appendChild(layer);
    layer.querySelector('#cb_drag_done').onclick = () => {
      popDrag.ai = false; popDrag.us = false;
      document.querySelectorAll('#m_ai_drag, #m_us_drag').forEach((c) => { c.checked = false; });
      syncPopouts();
    };
    for (const prefix of ['ai', 'us']) {
      const el = layer.querySelector(`#cb_pop_${prefix}`);
      el.onerror = () => {
        if (el.dataset.thumb && el.getAttribute('src') !== el.dataset.thumb) {
          setPopStatus(prefix, 'Full-size file failed to load, trying the thumbnail...');
          el.src = el.dataset.thumb;
        } else {
          setPopStatus(prefix, 'Image failed to load: ' + (el.getAttribute('src') || 'no source'));
        }
      };
      el.onload = () => {
        const fell = el.dataset.want !== el.dataset.thumb && el.getAttribute('src') === el.dataset.thumb;
        setPopStatus(prefix, `Showing ${el.naturalWidth}x${el.naturalHeight} image${fell ? ' (thumbnail fallback)' : ''}`);
      };
    }
    bindPopDragGlobal();
    return layer;
  }

  function layoutFg() {
    const chat = document.getElementById('chat');
    if (!chat) return;
    const r = chat.getBoundingClientRect();
    const L = document.getElementById('cb_fg_left');
    const C = document.getElementById('cb_fg_center');
    const R = document.getElementById('cb_fg_right');
    if (L) L.style.width = Math.max(0, r.left) + 'px';
    if (R) R.style.width = Math.max(0, window.innerWidth - r.right) + 'px';
    if (C) { C.style.left = r.left + 'px'; C.style.width = r.width + 'px'; }
  }

  function ensureFgLayer() {
    let layer = document.getElementById('cb_fg_layer');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'cb_fg_layer';
      layer.innerHTML = `
        <img id="cb_fg_left" class="cb_fg_img" alt="">
        <img id="cb_fg_center" class="cb_fg_img" alt="">
        <img id="cb_fg_right" class="cb_fg_img" alt="">
      `;
      document.body.appendChild(layer);
      
      const chat = document.getElementById('chat');
      if (chat && window.ResizeObserver) {
        new ResizeObserver(() => layoutFg()).observe(chat);
      }
    }
    
    const s = settings();
    layer.style.display = s.fgEnabled ? 'block' : 'none';
    layoutFg();
    document.documentElement.style.setProperty('--cb-fg-op', (s.fgOpacity ?? 100) / 100);
    
    for (const pos of ['Left', 'Center', 'Right']) {
      const el = layer.querySelector(`#cb_fg_${pos.toLowerCase()}`);
      const src = s[`fg${pos}`];
      const sc = (Number(s[`fg${pos}Scale`]) || 100) / 100;
      el.style.transformOrigin = pos === 'Left' ? 'left bottom' : pos === 'Right' ? 'right bottom' : 'center bottom';
      el.style.transform = `scale(${sc})`;
      if (src) {
        if (el.getAttribute('src') !== src) el.src = src;
        el.style.display = 'block';
      } else {
        el.style.display = 'none';
        el.src = '';
      }
    }
  }

  function fullResUrl(src) {
    try {
      const u = new URL(src, window.location.href);
      const file = u.searchParams.get('file');
      const type = u.searchParams.get('type');
      if (u.pathname.endsWith('/thumbnail') && file) {
        if (type === 'avatar') return `/characters/${encodeURIComponent(file)}`;
        if (type === 'persona') return `/User%20Avatars/${encodeURIComponent(file)}`;
      }
    } catch (e) {}
    return src;
  }

  function popSrcFor(isUserStr) {
    const imgs = document.querySelectorAll(`#chat .mes[is_user="${isUserStr}"] .avatar img`);
    const last = imgs[imgs.length - 1];
    return last ? last.getAttribute('src') : null;
  }

  function syncPopSliders(prefix) {
    const s = settings();
    for (const [id, key] of [['ox', 'PopX'], ['oy', 'PopY']]) {
      const el = document.getElementById(`m_${prefix}_${id}`);
      const lab = document.getElementById(`m_${prefix}_${id}val`);
      if (el) el.value = s[`${prefix}${key}`];
      if (lab) lab.textContent = s[`${prefix}${key}`];
    }
  }

  let popSession = null;      
  let popTouchGuard = false;  
  let popDragBound = false;

  function onPopTouchMove(e) {
    if (popSession && e.cancelable) e.preventDefault();
  }

  function setPopTouchGuard(on) {
    if (on === popTouchGuard) return;
    popTouchGuard = on;
    window[on ? 'addEventListener' : 'removeEventListener']('touchmove', onPopTouchMove, { passive: false, capture: true });
  }

  function bindPopDragGlobal() {
    if (popDragBound) return;
    popDragBound = true;

    window.addEventListener('pointerdown', (e) => {
      if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
      popSession = null;
      if (!popDrag.ai && !popDrag.us) return;
      if (e.target instanceof Element && e.target.closest('#cb_drag_pill')) return;
      for (const prefix of ['us', 'ai']) {
        const el = document.getElementById(`cb_pop_${prefix}`);
        if (!popDrag[prefix] || !el || el.style.display === 'none') continue;
        const r = el.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) continue;
        const s = settings();
        popSession = {
          prefix, id: e.pointerId, sx: e.clientX, sy: e.clientY,
          ox: Number(s[`${prefix}PopX`]) || 0, oy: Number(s[`${prefix}PopY`]) || 0,
        };
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    }, true);

    window.addEventListener('pointermove', (e) => {
      if (!popSession || e.pointerId !== popSession.id) return;
      const s = settings();
      const { prefix } = popSession;
      s[`${prefix}PopX`] = Math.round(popSession.ox + e.clientX - popSession.sx);
      s[`${prefix}PopY`] = Math.round(popSession.oy + e.clientY - popSession.sy);
      updateAvatarStyle();
      syncPopSliders(prefix);
    }, true);

    const end = (e) => {
      if (!popSession || e.pointerId !== popSession.id) return;
      popSession = null;
      save();
      const swallow = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
      window.addEventListener('click', swallow, true);
      setTimeout(() => window.removeEventListener('click', swallow, true), 0);
    };
    window.addEventListener('pointerup', end, true);
    window.addEventListener('pointercancel', end, true);
  }

  function syncPopouts() {
    const s = settings();
    const layer = ensurePopLayer();
    const ov = document.getElementById('cb_modal_overlay');
    const oz = ov ? parseInt(getComputedStyle(ov).zIndex, 10) : NaN;
    layer.style.zIndex = (popDrag.ai || popDrag.us) && oz >= 4000 ? String(oz + 1) : '';
    setPopTouchGuard(popDrag.ai || popDrag.us);
    const pill = layer.querySelector('#cb_drag_pill');
    if (pill) pill.style.display = (popDrag.ai || popDrag.us) ? 'flex' : 'none';
    for (const [prefix, flag] of [['ai', 'false'], ['us', 'true']]) {
      const el = layer.querySelector(`#cb_pop_${prefix}`);
      const on = s.avatarEnabled && s[`${prefix}Style`] === 'popout';
      let src = on ? popSrcFor(flag) : null;
      if (!src && on && prefix === 'ai') {
        const c = ctx();
        const ch = c.groupId ? null : c.characters?.[c.characterId];
        if (ch?.avatar) src = `/characters/${encodeURIComponent(ch.avatar)}`;
      }
      if (!src) {
        el.style.display = 'none';
        if (on && popMsg[prefix] !== 'No avatar found in this chat yet.') setPopStatus(prefix, 'No avatar found in this chat yet.');
        continue;
      }
      const full = fullResUrl(src);
      if (el.dataset.want !== full) {
        el.dataset.want = full;
        el.dataset.thumb = src;
        setPopStatus(prefix, 'Loading image...');
        el.src = full;
      }
      el.style.display = 'block';
      el.style.pointerEvents = popDrag[prefix] ? 'auto' : 'none';
      el.style.cursor = popDrag[prefix] ? 'grab' : '';
      el.style.outline = popDrag[prefix] ? '2px dashed rgba(255,255,255,0.7)' : 'none';
    }
  }

  function syncWallpaper() {
    if (!banner) return;
    const wall = banner.querySelector('.cb_wall');
    if (!wall) return;
    const s = settings();
    let bg = null;
    if (s.bannerBackdrop === 'wallpaper' && banner.style.display !== 'none') {
      for (const id of ['bg_custom', 'bg1']) {
        const el = document.getElementById(id);
        const v = el ? getComputedStyle(el).backgroundImage : '';
        if (v && v !== 'none') { bg = v; break; }
      }
    }
    if (!bg) { wall.style.display = 'none'; return; }
    const r = banner.getBoundingClientRect();
    wall.style.display = 'block';
    wall.style.backgroundImage = bg;
    wall.style.left = `${-r.left}px`;
    wall.style.top = `${-r.top}px`;
    wall.style.width = `${window.innerWidth}px`;
    wall.style.height = `${window.innerHeight}px`;
  }

  function updateAvatarStyle() {
    let styleEl = document.getElementById('aw_dynamic_style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'aw_dynamic_style';
      document.head.appendChild(styleEl);
    }

    const s = settings();
    
    let cssString = `
      #cb_banner { width: 100%; height: var(--cb-h, 120px); position: relative; overflow: hidden; display: block; border-radius: 10px; margin-bottom: ${s.bannerGap}px; }
      #cb_banner.cb_overlap { position: absolute !important; top: 0; left: 0; right: 0; z-index: 100; margin-bottom: 0 !important; }
      #cb_banner .cb_nav { position: absolute; right: 8px; bottom: 8px; z-index: 2; display: none; align-items: center; gap: 6px; padding: 3px 8px; border-radius: 999px; background: rgba(0,0,0,0.55); color: #fff; font-size: 12px; line-height: 1.2; opacity: 0; transition: opacity .15s; }
      #cb_banner:hover .cb_nav { opacity: 1; }
      @media (hover: none) { #cb_banner .cb_nav { opacity: 1; } }
      #cb_banner .cb_nav_btn { background: none; border: none; color: inherit; cursor: pointer; padding: 2px 5px; line-height: 1; }
      .cb_thumbs { position: relative; display: flex; gap: 6px; overflow-x: auto; padding: 4px 0; margin-top: 6px; }
      .cb_thumb { flex: none; width: 64px; height: 40px; object-fit: cover; border-radius: 4px; border: 2px solid transparent; cursor: pointer; opacity: 0.7; }
      .cb_thumb.active { border-color: var(--SmartThemeQuoteColor, #6cf); opacity: 1; }
      .cb_popup_content .cb_popup_header { position: sticky; top: 0; margin-top: -20px; padding-top: 20px; z-index: 5; background: var(--SmartThemeBlurTintColor, #1e1e24); }
      #cb_banner .cb_wall { position: absolute; background-size: cover; background-position: center; background-repeat: no-repeat; pointer-events: none; z-index: 0; }
      #cb_banner .cb_img, #cb_banner .cb_yt { position: relative; z-index: 1; }
      #cb_pop_layer { position: fixed; inset: 0; z-index: 2500; pointer-events: none; overflow: hidden; }
      #cb_pop_layer img { position: absolute; display: none; pointer-events: none; max-width: none; user-select: none; -webkit-user-drag: none; touch-action: none; }
      #cb_drag_pill { position: absolute; left: 50%; bottom: calc(16px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); display: none; align-items: center; gap: 10px; padding: 8px 8px 8px 14px; border-radius: 999px; background: rgba(0,0,0,0.85); color: #fff; font-size: 13px; line-height: 1.2; white-space: nowrap; pointer-events: auto; box-shadow: 0 2px 10px rgba(0,0,0,0.5); }
      #cb_drag_pill button { border: none; border-radius: 999px; padding: 5px 14px; font-weight: bold; cursor: pointer; background: var(--SmartThemeQuoteColor, #6cf); color: #000; }
      .cb_col { display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 0; background: rgba(0,0,0,0.15); padding: 10px; border-radius: 8px; }
      .cb_grp { flex-direction: column; gap: 8px; }
      .cb_sub { font-size: 0.75em; opacity: 0.65; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 4px; padding-top: 6px; border-top: 1px solid var(--SmartThemeBorderColor, #444); }
      
      #cb_fg_layer { position: fixed; inset: 0; z-index: 2400; pointer-events: none; opacity: var(--cb-fg-op, 1); }
      .cb_fg_img { position: absolute; bottom: 0; height: 100%; object-fit: contain; object-position: center bottom; pointer-events: none; }
      #cb_fg_left { left: 0; object-position: left bottom; }
      #cb_fg_right { right: 0; object-position: right bottom; }

      #cb_node { position: fixed; z-index: 2450; display: none; align-items: flex-end; gap: 12px; padding: 0 6px; box-sizing: border-box; pointer-events: none; }
      #cb_node > * { pointer-events: auto; }
      #cb_node.cb_right { flex-direction: row-reverse; }
      #cb_node .cb_n_port { position: relative; flex: none; width: var(--cbn-ps, 120px); height: var(--cbn-ps, 120px); border-radius: 12px; overflow: hidden; border: 2px solid var(--SmartThemeBorderColor, #555); background: rgba(0,0,0,0.55); box-shadow: 0 4px 14px rgba(0,0,0,.5); }
      #cb_node .cb_n_port img { width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; }
      #cb_node .cb_n_port i { display: none; position: absolute; inset: 0; align-items: center; justify-content: center; font-size: calc(var(--cbn-ps, 120px) * 0.45); opacity: .35; }
      #cb_node .cb_n_port.cb_noimg img { display: none; }
      #cb_node .cb_n_port.cb_noimg i { display: flex; }
      #cb_node .cb_n_box { position: relative; flex: 1; min-width: 0; min-height: 96px; padding: 22px 18px 28px; border-radius: 12px; border: 2px solid var(--SmartThemeBorderColor, #555); background: rgba(10, 14, 22, var(--cbn-op, .88)); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); color: var(--SmartThemeBodyColor, #ddd); cursor: pointer; box-shadow: 0 4px 18px rgba(0,0,0,.55); }
      #cb_node .cb_n_name { position: absolute; top: -14px; left: 16px; padding: 2px 14px; border-radius: 999px; font-weight: bold; font-size: 0.95em; background: var(--SmartThemeQuoteColor, #6cf); color: #000; }
      #cb_node.cb_right .cb_n_name { left: auto; right: 16px; }
      #cb_node .cb_n_text { max-height: 28vh; overflow-y: auto; line-height: 1.5; }
      #cb_node .cb_n_nar .cb_n_text { font-style: italic; }
      #cb_node .cb_q { color: var(--SmartThemeQuoteColor, #6cf); }
      #cb_node .cb_n_arrow { position: absolute; left: 50%; bottom: 4px; font-size: 12px; animation: cbn_blink 1s infinite; pointer-events: none; }
      #cb_node .cb_n_ctrl { position: absolute; right: 8px; bottom: 3px; display: flex; align-items: center; gap: 2px; font-size: 11px; opacity: .75; }
      #cb_node .cb_n_ctrl button { background: none; border: none; color: inherit; cursor: pointer; padding: 2px 6px; font-size: 13px; }
      @keyframes cbn_blink { 50% { opacity: .15; } }
      #cb_node_toggle.cb_on { color: var(--SmartThemeQuoteColor, #6cf); }
    `;

    if (s.chatTransparent) {
      cssString += `
        #chat, #sheld, #chat-container, .chat-container {
          background: transparent !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          border: none !important;
          box-shadow: none !important;
        }
      `;
    }

    if (s.nodeEnabled) cssString += `
      #chat .mes { display: none !important; }
    `;

    if (s.avatarEnabled) {
      cssString += `
        .mes { position: relative !important; padding: 0 !important; background-color: var(--SmartThemeChatMesBgc) !important; border-radius: var(--SmartThemeChatMesRounding, 15px) !important; }
        .mes .mes_block, .mes .mes_text { background: transparent !important; border: none !important; box-shadow: none !important; }
        .mes .mes_block { position: relative !important; z-index: 1 !important; width: 100% !important; min-height: 120px !important; padding: 15px !important; }
        
        ${getAvatarCss('ai', 'false', s)}
        ${getAvatarCss('us', 'true', s)}
      `;
    }

    styleEl.textContent = cssString;
    syncPopouts();
  }

  function currentKey() {
    const c = ctx();
    if (c.groupId) return null;
    const ch = c.characters?.[c.characterId];
    return ch?.avatar || null;
  }

  function currentCharacterName() {
    const c = ctx();
    if (c.groupId) return 'Group Chat';
    const ch = c.characters?.[c.characterId];
    return ch?.name || 'Current Character';
  }

  const peek = (key) => {
    const s = settings();
    if (!s.chars[key]) s.chars[key] = { images: [], idx: 0, locked: true, overlap: false, overlapOffset: 0, youtubeUrl: '' };
    if (s.chars[key].youtubeUrl === undefined) s.chars[key].youtubeUrl = '';
    if (s.chars[key].overlap === undefined) s.chars[key].overlap = false;
    if (s.chars[key].overlapOffset === undefined) s.chars[key].overlapOffset = 0;
    return s.chars[key];
  };

  function rec(key) {
    return peek(key);
  }

  function buildBanner() {
    banner = document.createElement('div');
    banner.id = 'cb_banner';
    banner.innerHTML = `
      <img class="cb_img" alt="" style="display: none; width: 100%; height: 100%; object-fit: cover;">
      <iframe class="cb_yt" style="display: none; width: 100%; height: 100%; border: none; pointer-events: auto;" allow="autoplay; encrypted-media" referrerpolicy="strict-origin-when-cross-origin"></iframe>
      <div class="cb_wall" style="display: none;"></div>
      <div class="cb_nav">
        <button class="cb_nav_btn cb_nav_prev" title="Previous image"><i class="fa-solid fa-chevron-left"></i></button>
        <span class="cb_nav_count"></span>
        <button class="cb_nav_btn cb_nav_next" title="Next image"><i class="fa-solid fa-chevron-right"></i></button>
      </div>
    `;
    banner.querySelector('.cb_nav_prev').onclick = (e) => { e.stopPropagation(); step(-1); };
    banner.querySelector('.cb_nav_next').onclick = (e) => { e.stopPropagation(); step(1); };
    if (window.ResizeObserver) new ResizeObserver(() => syncWallpaper()).observe(banner);
  }

  function watchBannerImg() {
    const img = banner?.querySelector('.cb_img');
    if (!img || img.dataset.watched) return;
    img.dataset.watched = '1';
    img.addEventListener('error', () => {
      if (img.getAttribute('src')) toastr.error(`Banner image failed to load: ${img.getAttribute('src')}`, 'Banner');
    });
  }

  function getYouTubeId(url) {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    return match ? match[1] : null;
  }

  function updateBanner() {
    const s = settings();
    const key = currentKey();
    if (!banner) return;
    if (!key || s.bannerMode === 'off') {
      banner.style.display = 'none';
      return;
    }
    
    const r = peek(key);
    document.documentElement.style.setProperty('--cb-h', s.bannerHeight + 'px');

    watchBannerImg();
    const img = banner.querySelector('.cb_img');
    const yt = banner.querySelector('.cb_yt');
    const nav = banner.querySelector('.cb_nav');

    if (s.bannerMode === 'image') {
      const n = r.images.length;
      if (!n) {
        banner.style.display = 'none';
        return;
      }
      banner.style.display = 'block';
      yt.style.display = 'none';
      img.style.display = 'block';

      const im = r.images[r.idx] || r.images[0];
      if (img.getAttribute('src') !== im.url) img.src = im.url;
      img.style.objectPosition = `50% ${im.pos ?? 45}%`;
      nav.style.display = n > 1 ? 'flex' : 'none';
      nav.querySelector('.cb_nav_count').textContent = `${Math.min(r.idx, n - 1) + 1} / ${n}`;
      
    } else if (s.bannerMode === 'youtube') {
      const videoId = getYouTubeId(r.youtubeUrl || '');
      if (!videoId) {
        banner.style.display = 'none';
        return;
      }
      banner.style.display = 'block';
      img.style.display = 'none';
      yt.style.display = 'block';
      nav.style.display = 'none';

      const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&mute=0&loop=1&playlist=${videoId}&controls=1&modestbranding=1`;
      if (yt.getAttribute('src') !== embedUrl) yt.src = embedUrl;
    }
    syncWallpaper();
  }

  function attachBanner(chat, locked) {
    if (locked) {
      if (banner.nextElementSibling !== chat) chat.before(banner);
    } else if (chat.firstElementChild !== banner) {
      chat.prepend(banner);
    }
  }

  function renderAll() {
    try {
      updateAvatarStyle();
      ensureFgLayer();
      const chat = document.getElementById('chat');
      if (!chat) return;
      
      chat.style.paddingTop = ''; // clear padding initially
      
      if (!banner) buildBanner();
      const key = currentKey();
      if (settings().bannerMode === 'off' || !key) {
        banner.style.display = 'none';
        return;
      }
      
      const r = peek(key);
      banner.classList.toggle('cb_overlap', !!r.overlap);
      attachBanner(chat, r.locked);
      
      if (r.overlap) {
        chat.style.paddingTop = r.overlapOffset + 'px';
      }
      
      updateBanner();
    } catch (e) {
      console.error('[chatvisuals]', e);
    }
  }

  function step(d) {
    const key = currentKey();
    if (!key) return;
    const r = rec(key);
    const n = r.images.length;
    if (n < 2) return;
    r.idx = (r.idx + d + n) % n;
    save();
    updateBanner();
    if (document.getElementById('cb_modal_overlay')) openCombinedModal();
  }

  const readDataURL = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
  const loadImg = (u) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = u; });

  async function addFiles(files) {
    const key = currentKey();
    if (!key) { toastr.warning('Select a single character first (banners are per character).', 'Banner'); return; }
    const r = rec(key);
    let added = 0;
    for (const f of files) {
      try {
        let url = await readDataURL(f);
        if (f.type !== 'image/gif') {
          const i = await loadImg(url);
          if (i.width > 0 && i.width > 1600) {
            const c = document.createElement('canvas');
            c.width = 1600; c.height = Math.round(i.height * 1600 / i.width);
            c.getContext('2d').drawImage(i, 0, 0, c.width, c.height);
            url = c.toDataURL(f.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', 0.92);
          }
        }
        const b64 = url.split(',')[1];
        
        let ext = f.name.split('.').pop().toLowerCase();
        if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) ext = 'png';
        const name = `banner_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        
        const res = await fetch('/api/files/upload', {
          method: 'POST',
          headers: ctx().getRequestHeaders(),
          body: JSON.stringify({ name, data: b64 }),
        });
        
        if (!res.ok) {
          const detail = await res.text().catch(() => '');
          throw new Error(`Server rejected upload (Status ${res.status}). ${detail}`.trim());
        }
        
        const j = await res.json();
        r.images.push({ url: '/' + String(j.path).replace(/^\/+/, ''), pos: 45 });
        r.idx = r.images.length - 1;
        added++;
      } catch (e) {
        console.error('[chatvisuals upload error]', e);
        toastr.error(e.message || 'Failed to upload', 'Banner Error');
      }
    }
    save();
    updateBanner();
    if (added) toastr.success(`Added ${added} of ${files.length}. Total: ${r.images.length}`, 'Banner');
  }

  async function removeCurrentBanner() {
    const key = currentKey();
    if (!key) return;
    const r = rec(key);
    const im = r.images[r.idx];
    if (!im || !confirm('Remove this scenic banner image?')) return;
    r.images.splice(r.idx, 1);
    r.idx = Math.max(0, Math.min(r.idx, r.images.length - 1));
    save();
    updateBanner();
    try {
      await fetch('/api/files/delete', { method: 'POST', headers: ctx().getRequestHeaders(), body: JSON.stringify({ path: im.url.replace(/^\/+/, '') }) });
    } catch (e) {}
  }

  function getColHtml(prefix, title, s) {
    const style = s[`${prefix}Style`] === 'popout' ? 'popout' : 'backdrop';
    const opt = (val, label, cur) => `<option value="${val}"${val === cur ? ' selected' : ''}>${label}</option>`;
    const posOpts = [
      ['tl', 'Top Left'], ['tc', 'Top Center'], ['tr', 'Top Right'],
      ['cl', 'Center Left'], ['cc', 'Center'], ['cr', 'Center Right'],
      ['bl', 'Bottom Left'], ['bc', 'Bottom Center'], ['br', 'Bottom Right']
    ].map(([v, l]) => opt(v, l, s[`${prefix}Side`])).join('');
    const fitOpts = [
      ['cover', 'Fill Box (Cover)'], ['contain', 'Fit Box (Contain)'], ['original', 'Original Size']
    ].map(([v, l]) => opt(v, l, s[`${prefix}Fit`])).join('');

    const slider = (id, key, label, unit, min, max, step) => `
      <div class="cb_row"><label>${label}</label><span><span id="m_${prefix}_${id}val">${s[`${prefix}${key}`]}</span>${unit}</span></div>
      <input type="range" id="m_${prefix}_${id}" min="${min}" max="${max}" step="${step}" value="${s[`${prefix}${key}`]}">`;
    const grp = (only, inner) => `<div class="cb_grp" data-only="${only}" style="display: ${style === only ? 'flex' : 'none'};">${inner}</div>`;

    return `
      <div id="m_${prefix}_col" class="cb_col">
        <h5 class="col_header">${title}</h5>

        <label>Style: <select id="m_${prefix}_style" style="width:100%;">${opt('backdrop', 'Backdrop (behind text)', style)}${opt('popout', 'Pop Out (free floating)', style)}</select></label>
        <label>Position: <select id="m_${prefix}_pos" style="width:100%;">${posOpts}</select></label>
        ${grp('backdrop', `<label>Image Fit: <select id="m_${prefix}_fit" style="width:100%;">${fitOpts}</select></label>`)}

        ${slider('sc', 'Scale', 'Image Scale:', '%', 10, 300, 5)}
        ${slider('pad', 'Pad', 'Text Padding:', 'px', 0, 400, 5)}

        ${grp('backdrop', `<div class="cb_sub">Fades</div>`
          + slider('tf', 'TopFade', 'Top Fade:', 'px', 0, 400, 5)
          + slider('bf', 'BotFade', 'Bottom Fade:', 'px', 0, 400, 5)
          + slider('lf', 'LeftFade', 'Left Fade:', '%', 0, 90, 1)
          + slider('rf', 'RightFade', 'Right Fade:', '%', 0, 90, 1))}

        ${grp('popout', `<div class="cb_sub">Screen Placement</div>
          <label class="checkbox_label"><input type="checkbox" id="m_${prefix}_drag" ${popDrag[prefix] ? 'checked' : ''}><span>Drag it on screen</span></label>
          <div id="m_${prefix}_pstat" style="font-size: 0.8em; opacity: 0.75;">${escapeHTML(popMsg[prefix] || '')}</div>`
          + slider('ox', 'PopX', 'Move Horizontal:', 'px', -1500, 1500, 5)
          + slider('oy', 'PopY', 'Move Vertical:', 'px', -1500, 1500, 5))}

        <div class="cb_sub">Effects</div>
        ${slider('bl', 'Blur', 'Blur Effect:', 'px', 0, 20, 1)}
        <label class="checkbox_label"><input type="checkbox" id="m_${prefix}_bg" ${s[`${prefix}MsgBg`] !== false ? 'checked' : ''}><span>Keep message background</span></label>

        <button id="m_${prefix}_reset" class="menu_button" style="margin-top: 6px;"><i class="fa-solid fa-rotate-left"></i> Reset ${title}</button>
      </div>
    `;
  }

  function openCombinedModal() {
    const prevContent = document.querySelector('#cb_modal_overlay .cb_popup_content');
    const keep = prevContent ? { position: prevContent.style.position, left: prevContent.style.left, top: prevContent.style.top, margin: prevContent.style.margin, scroll: prevContent.scrollTop } : null;
    document.getElementById('cb_modal_overlay')?.remove();
    const s = settings();
    const key = currentKey();
    const r = key ? rec(key) : { images: [], locked: true, overlap: false, overlapOffset: 0, youtubeUrl: '' };
    const n = r.images.length;
    const curImg = r.images[r.idx] || null;
    const safeCharName = key ? escapeHTML(currentCharacterName()) : 'No Char';

    const overlay = document.createElement('div');
    overlay.id = 'cb_modal_overlay';
    overlay.className = 'cb_popup_overlay';

    overlay.innerHTML = `
      <div class="cb_popup_content">
        <div class="cb_popup_header">
          <span><i class="fa-solid fa-layer-group"></i> Nitwit Tavern Redesign <small style="opacity:.5;font-weight:normal;">(drag fix v2)</small></span>
          <button class="cb_close_btn">&times;</button>
        </div>

        <div class="cb_section">
          <h4 class="cb_collapse_toggle" style="cursor: pointer; user-select: none; display: flex; justify-content: space-between; align-items: center;">
            <span><i class="fa-solid fa-panorama"></i> Header Banner (${safeCharName})</span>
            <i class="fa-solid fa-chevron-down cb_chevron"></i>
          </h4>
          <div class="cb_collapse_content">
            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px; background: rgba(0,0,0,0.15); padding: 10px; border-radius: 8px;">
              <label class="checkbox_label" ${!key ? 'style="opacity:0.5;pointer-events:none;"' : ''}>
                <input type="checkbox" id="m_b_lock" ${r.locked ? 'checked' : ''}><span>Lock to top</span>
              </label>
              <label class="checkbox_label" ${!key ? 'style="opacity:0.5;pointer-events:none;"' : ''}>
                <input type="checkbox" id="m_b_overlap" ${r.overlap ? 'checked' : ''}><span>Overlap messages</span>
              </label>
              <label><strong>Mode:</strong>
                <select id="m_b_mode" style="width: 100%; margin-top: 5px;">
                  <option value="image" ${s.bannerMode === 'image' ? 'selected' : ''}>Image Gallery</option>
                  <option value="youtube" ${s.bannerMode === 'youtube' ? 'selected' : ''}>YouTube Loop</option>
                  <option value="off" ${s.bannerMode === 'off' ? 'selected' : ''}>Off</option>
                </select>
              </label>
            </div>
            
            <!-- Image Controls -->
            <div id="m_b_img_controls" style="display: ${s.bannerMode === 'image' ? 'block' : 'none'};">
              <div class="cb_actions">
                <button id="m_b_up" class="menu_button" ${!key ? 'disabled' : ''}><i class="fa-solid fa-plus"></i> Add</button>
                <button id="m_b_del" class="menu_button danger_button" ${!n ? 'disabled' : ''}><i class="fa-solid fa-trash-can"></i> Del</button>
              </div>
              <input type="file" id="m_b_file" accept="image/png,image/jpeg,image/gif,image/webp,.png,.jpg,.jpeg,.gif,.webp" multiple hidden>

              ${n > 0 ? `
              <div class="cb_carousel_nav">
                <button id="m_b_prev" class="menu_button" ${n < 2 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>
                <span>Image <b>${r.idx + 1}</b> of <b>${n}</b></span>
                <button id="m_b_next" class="menu_button" ${n < 2 ? 'disabled' : ''}><i class="fa-solid fa-chevron-right"></i></button>
              </div>
              <div class="cb_thumbs">${r.images.map((im, i) => `<img class="cb_thumb${i === r.idx ? ' active' : ''}" data-i="${i}" src="${escapeHTML(im.url)}" alt="">`).join('')}</div>` : `<div style="text-align:center;opacity:0.7;margin-top:8px;">No images yet</div>`}

              ${curImg ? `
              <div class="cb_row" style="margin-top: 10px;"><label>Crop:</label><span><span id="m_b_pval">${curImg.pos ?? 45}</span>%</span></div>
              <input type="range" id="m_b_p" min="0" max="100" value="${curImg.pos ?? 45}">
              ` : ''}
            </div>

            <!-- YouTube Controls -->
            <div id="m_b_yt_controls" style="display: ${s.bannerMode === 'youtube' ? 'block' : 'none'};">
              <label><strong>YouTube Video URL:</strong></label>
              <input type="text" id="m_b_yt_url" class="text_pole" style="width: 100%; margin-top: 5px;" placeholder="https://youtube.com/watch?v=..." value="${escapeHTML(r.youtubeUrl || '')}" ${!key ? 'disabled' : ''}>
            </div>

            <div class="cb_row" style="margin-top: 15px;"><label>Banner Height:</label><span><span id="m_b_hval">${s.bannerHeight}</span>px</span></div>
            <input type="range" id="m_b_h" min="60" max="350" step="5" value="${s.bannerHeight}">

            <div id="m_b_gap_wrapper" style="${r.overlap ? 'opacity: 0.5; pointer-events: none;' : ''}">
              <div class="cb_row" style="margin-top: 10px;"><label>Gap Below Banner:</label><span><span id="m_b_gapval">${s.bannerGap}</span>px</span></div>
              <input type="range" id="m_b_gap" min="0" max="40" step="1" value="${s.bannerGap}">
            </div>

            <div id="m_b_offset_wrapper" style="display: ${r.overlap ? 'block' : 'none'};">
              <div class="cb_row" style="margin-top: 10px;"><label>Overlap Offset (Push Messages Down):</label><span><span id="m_b_oval">${r.overlapOffset || 0}</span>px</span></div>
              <input type="range" id="m_b_offset" min="0" max="300" step="5" value="${r.overlapOffset || 0}" ${!key ? 'disabled' : ''}>
            </div>

            <label style="display: block; margin-top: 10px;"><strong>Transparent areas show:</strong>
              <select id="m_b_bd" style="width: 100%; margin-top: 5px;">
                <option value="wallpaper" ${s.bannerBackdrop !== 'panel' ? 'selected' : ''}>Wallpaper</option>
                <option value="panel" ${s.bannerBackdrop === 'panel' ? 'selected' : ''}>Chat panel tint</option>
              </select>
            </label>
          </div>
        </div>

        <div class="cb_section">
          <h4 class="cb_collapse_toggle" style="cursor: pointer; user-select: none; display: flex; justify-content: space-between; align-items: center;">
            <span><i class="fa-solid fa-image"></i> Foreground Images</span>
            <i class="fa-solid fa-chevron-down cb_chevron"></i>
          </h4>
          <div class="cb_collapse_content" style="display: none;">
            <label class="checkbox_label" style="margin-bottom: 5px;"><input type="checkbox" id="m_f_enable" ${s.fgEnabled ? 'checked' : ''}><span>Enable Foreground Overlays</span></label>
            <label class="checkbox_label" style="margin-bottom: 5px;"><input type="checkbox" id="m_f_trans" ${s.chatTransparent ? 'checked' : ''}><span>Make Chat Panel Transparent</span></label>
            <div class="cb_row" style="margin-top: 10px;"><label>Opacity:</label><span><span id="m_f_oval">${s.fgOpacity ?? 100}</span>%</span></div>
            <input type="range" id="m_f_o" min="0" max="100" step="1" value="${s.fgOpacity ?? 100}">
            
            <div style="display: flex; gap: 10px; margin-top: 10px;">
              ${['Left', 'Center', 'Right'].map(pos => `
                <div class="cb_col" style="align-items: center; text-align: center;">
                  <strong>${pos}</strong>
                  <div style="width:100%; height:80px; background:rgba(0,0,0,0.3); border-radius:4px; margin:5px 0; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                    <img id="m_f_img_${pos}" src="${escapeHTML(s['fg' + pos] || '')}" style="max-width:100%; max-height:100%; object-fit:contain; display:${s['fg' + pos] ? 'block' : 'none'};">
                    <span id="m_f_none_${pos}" style="display:${s['fg' + pos] ? 'none' : 'block'}; opacity:0.5; font-size:12px;">Empty</span>
                  </div>
                  <div style="display:flex; gap:5px; width:100%;">
                    <button class="menu_button m_f_up" data-pos="${pos}" style="flex:1; padding:4px;" title="Upload ${pos} image"><i class="fa-solid fa-upload"></i></button>
                    <button class="menu_button danger_button m_f_del" data-pos="${pos}" style="flex:1; padding:4px;" title="Clear ${pos} image" ${!s['fg' + pos] ? 'disabled' : ''}><i class="fa-solid fa-trash"></i></button>
                  </div>
                  <div class="cb_row" style="width:100%; margin-top:6px;"><label>Size:</label><span><span id="m_f_s_${pos}val">${s['fg' + pos + 'Scale'] ?? 100}</span>%</span></div>
                  <input type="range" class="m_f_scale" data-pos="${pos}" min="10" max="300" step="5" value="${s['fg' + pos + 'Scale'] ?? 100}" style="width:100%;">
                </div>
              `).join('')}
            </div>
            <input type="file" id="m_f_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
          </div>
        </div>

        <div class="cb_section">
          <h4 class="cb_collapse_toggle" style="cursor: pointer; user-select: none; display: flex; justify-content: space-between; align-items: center;">
            <span><i class="fa-solid fa-user-astronaut"></i> Pfp Management</span>
            <i class="fa-solid fa-chevron-down cb_chevron"></i>
          </h4>
          <div class="cb_collapse_content" style="display: none;">
            <label class="checkbox_label" style="margin-bottom: 5px;"><input type="checkbox" id="m_a_enable" ${s.avatarEnabled ? 'checked' : ''}><span>Enable NTR Avatars</span></label>
            
            <div style="display: flex; gap: 15px; width: 100%;">
              ${getColHtml('ai', 'AI', s)}
              ${getColHtml('us', 'User', s)}
            </div>
          </div>
        </div>

        ${nodeSectionHtml(s)}
      </div>`;

    document.body.appendChild(overlay);

    // Add collapsible logic
    overlay.querySelectorAll('.cb_collapse_toggle').forEach((header, index) => {
      // Auto-expand first one to show it works, rest stay closed
      if (index === 0) {
        header.nextElementSibling.style.display = 'block';
        header.querySelector('.cb_chevron').classList.replace('fa-chevron-right', 'fa-chevron-down');
      } else {
        header.querySelector('.cb_chevron').classList.replace('fa-chevron-down', 'fa-chevron-right');
      }

      header.addEventListener('click', function() {
        const content = this.nextElementSibling;
        const icon = this.querySelector('.cb_chevron');
        
        if (content.style.display === 'none') {
          content.style.display = 'block';
          icon.classList.replace('fa-chevron-right', 'fa-chevron-down');
        } else {
          content.style.display = 'none';
          icon.classList.replace('fa-chevron-down', 'fa-chevron-right');
        }
      });
    });

    const header = overlay.querySelector('.cb_popup_header');
    const content = overlay.querySelector('.cb_popup_content');
    let isDragging = false, startX, startY, initialX, initialY;
    if (keep) {
      if (keep.position) {
        content.style.position = keep.position;
        const kl = parseFloat(keep.left) || 0, kt = parseFloat(keep.top) || 0;
        content.style.left = Math.max(-content.offsetWidth + 80, Math.min(window.innerWidth - 80, kl)) + 'px';
        content.style.top = Math.max(0, Math.min(window.innerHeight - 50, kt)) + 'px';
        content.style.margin = keep.margin;
      }
      content.scrollTop = keep.scroll;
    }

    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return; 
      isDragging = true;
      const rect = content.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      startX = e.clientX;
      startY = e.clientY;
      
      content.style.position = 'fixed';
      content.style.left = initialX + 'px';
      content.style.top = initialY + 'px';
      content.style.margin = '0';

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      content.style.left = Math.max(-content.offsetWidth + 80, Math.min(window.innerWidth - 80, initialX + dx)) + 'px';
      content.style.top = Math.max(0, Math.min(window.innerHeight - 50, initialY + dy)) + 'px';
    }

    function onMouseUp() {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    const close = () => { popDrag.ai = false; popDrag.us = false; overlay.remove(); syncPopouts(); };
    overlay.querySelector('.cb_close_btn').onclick = close;
    
    overlay.querySelector('#m_b_mode').onchange = function() {
      s.bannerMode = this.value;
      save();
      overlay.querySelector('#m_b_img_controls').style.display = this.value === 'image' ? 'block' : 'none';
      overlay.querySelector('#m_b_yt_controls').style.display = this.value === 'youtube' ? 'block' : 'none';
      renderAll();
    };

    // Foreground Event Bindings
    overlay.querySelector('#m_f_enable').onchange = function() { s.fgEnabled = this.checked; save(); ensureFgLayer(); };
    overlay.querySelector('#m_f_trans').onchange = function() { s.chatTransparent = this.checked; save(); updateAvatarStyle(); };
    
    const fo = overlay.querySelector('#m_f_o');
    fo.oninput = function() { 
      s.fgOpacity = Number(this.value); 
      overlay.querySelector('#m_f_oval').textContent = this.value; 
      document.documentElement.style.setProperty('--cb-fg-op', this.value / 100); 
    };
    fo.onchange = save;

    overlay.querySelectorAll('.m_f_scale').forEach(sl => {
      sl.oninput = function() {
        const pos = this.dataset.pos;
        s['fg' + pos + 'Scale'] = Number(this.value);
        overlay.querySelector(`#m_f_s_${pos}val`).textContent = this.value;
        ensureFgLayer();
      };
      sl.onchange = save;
    });

    const fgFile = overlay.querySelector('#m_f_file');
    let pendingFgPos = null;

    overlay.querySelectorAll('.m_f_up').forEach(btn => {
      btn.onclick = () => { pendingFgPos = btn.dataset.pos; fgFile.click(); };
    });

    overlay.querySelectorAll('.m_f_del').forEach(btn => {
      btn.onclick = () => { 
        const pos = btn.dataset.pos;
        s['fg' + pos] = '';
        save();
        ensureFgLayer();
        openCombinedModal(); 
      };
    });

    fgFile.onchange = async () => {
      if (!fgFile.files.length || !pendingFgPos) return;
      const f = fgFile.files[0];
      try {
        const url = await readDataURL(f);
        const b64 = url.split(',')[1];
        let ext = f.name.split('.').pop().toLowerCase();
        if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) ext = 'png';
        const name = `fg_${pendingFgPos.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        
        const res = await fetch('/api/files/upload', {
          method: 'POST',
          headers: ctx().getRequestHeaders(),
          body: JSON.stringify({ name, data: b64 }),
        });
        
        if (!res.ok) throw new Error('Upload failed');
        const j = await res.json();
        s['fg' + pendingFgPos] = '/' + String(j.path).replace(/^\/+/, '');
        
        save();
        ensureFgLayer();
        openCombinedModal();
      } catch (e) {
        console.error('[chatvisuals fg upload]', e);
        toastr.error('Foreground upload failed', 'Error');
      }
    };

    if (key) {
      overlay.querySelector('#m_b_lock').onchange = function() { r.locked = this.checked; save(); renderAll(); };
      
      overlay.querySelector('#m_b_overlap').onchange = function() { 
        r.overlap = this.checked; 
        overlay.querySelector('#m_b_gap_wrapper').style.opacity = r.overlap ? '0.5' : '1';
        overlay.querySelector('#m_b_gap_wrapper').style.pointerEvents = r.overlap ? 'none' : 'auto';
        overlay.querySelector('#m_b_offset_wrapper').style.display = r.overlap ? 'block' : 'none';
        save(); 
        renderAll(); 
      };

      const bo = overlay.querySelector('#m_b_offset');
      if (bo) {
        bo.oninput = function() { 
          r.overlapOffset = Number(this.value); 
          overlay.querySelector('#m_b_oval').textContent = r.overlapOffset; 
          const chat = document.getElementById('chat');
          if (chat && r.overlap) chat.style.paddingTop = r.overlapOffset + 'px';
        };
        bo.onchange = save;
      }
      
      const fi = overlay.querySelector('#m_b_file');
      overlay.querySelector('#m_b_up').onclick = () => fi.click();
      fi.onchange = async () => { if (fi.files.length) { await addFiles([...fi.files]); openCombinedModal(); }};
      if (n) overlay.querySelector('#m_b_del').onclick = async () => { await removeCurrentBanner(); openCombinedModal(); };
      if (n > 0) {
        overlay.querySelector('#m_b_prev').onclick = () => step(-1);
        overlay.querySelector('#m_b_next').onclick = () => step(1);
        overlay.querySelectorAll('.cb_thumb').forEach((t) => {
          t.onclick = () => { r.idx = Number(t.dataset.i); save(); updateBanner(); openCombinedModal(); };
        });
        const strip = overlay.querySelector('.cb_thumbs');
        const act = strip?.querySelector('.active');
        if (strip && act) strip.scrollLeft = act.offsetLeft - strip.clientWidth / 2 + act.offsetWidth / 2;
      }
      if (curImg) {
        const bp = overlay.querySelector('#m_b_p');
        bp.oninput = function() { overlay.querySelector('#m_b_pval').textContent = this.value; const img = banner?.querySelector('.cb_img'); if (img) img.style.objectPosition = `50% ${this.value}%`; };
        bp.onchange = function() { curImg.pos = Number(this.value); save(); };
      }
      const ytUrl = overlay.querySelector('#m_b_yt_url');
      ytUrl.oninput = function() { r.youtubeUrl = this.value; };
      ytUrl.onchange = function() { save(); updateBanner(); };
    }
    const bh = overlay.querySelector('#m_b_h');
    bh.oninput = function() { s.bannerHeight = Number(this.value); overlay.querySelector('#m_b_hval').textContent = s.bannerHeight; document.documentElement.style.setProperty('--cb-h', s.bannerHeight + 'px'); };
    bh.onchange = save;
    const bgap = overlay.querySelector('#m_b_gap');
    bgap.oninput = function() { s.bannerGap = Number(this.value); overlay.querySelector('#m_b_gapval').textContent = s.bannerGap; updateAvatarStyle(); };
    bgap.onchange = save;
    overlay.querySelector('#m_b_bd').onchange = function() { s.bannerBackdrop = this.value; save(); syncWallpaper(); };

    overlay.querySelector('#m_a_enable').onchange = function() { s.avatarEnabled = this.checked; save(); updateAvatarStyle(); };
    
    // Visual Node bindings
    overlay.querySelector('#m_n_enable').onchange = function() {
      s.nodeEnabled = this.checked; save(); updateAvatarStyle(); nodeLoad({ animate: false });
    };
    overlay.querySelector('#m_n_tw').onchange = function() { s.nodeTypewriter = this.checked; save(); };
    overlay.querySelector('#m_n_auto').onchange = function() { s.nodeAuto = this.checked; save(); };
    overlay.querySelectorAll('.m_n_sl').forEach((sl) => {
      sl.oninput = function() {
        s[this.dataset.key] = Number(this.value);
        overlay.querySelector(`#m_n_${this.dataset.id}val`).textContent = this.value;
        const ov = document.getElementById('cb_node');
        if (ov) { ov.style.setProperty('--cbn-op', s.nodeOpacity / 100); ov.style.setProperty('--cbn-ps', s.nodePortrait + 'px'); }
      };
      sl.onchange = save;
    });
    const nFile = overlay.querySelector('#m_n_file');
    let pendingSpk = null;
    const renderSpk = () => {
      const box = overlay.querySelector('#m_n_spk');
      box.innerHTML = spkRowsHtml(s);
      box.querySelectorAll('.m_n_up').forEach((b) => { b.onclick = () => { pendingSpk = b.dataset.key; nFile.click(); }; });
      box.querySelectorAll('.m_n_clr').forEach((b) => {
        b.onclick = () => { delete s.nodeAvatars[b.dataset.key]; save(); renderSpk(); if (s.nodeEnabled) nodeShow(false); };
      });
    };
    nFile.onchange = async () => {
      if (!nFile.files.length || !pendingSpk) return;
      try {
        s.nodeAvatars[pendingSpk] = await uploadPortrait(nFile.files[0]);
        save(); renderSpk(); if (s.nodeEnabled) nodeShow(false);
      } catch (e) {
        console.error('[chatvisuals node upload]', e);
        toastr.error(e.message || 'Portrait upload failed', 'Visual Node');
      }
      nFile.value = '';
    };
    renderSpk();

    const bindCol = (prefix) => {
      const col = overlay.querySelector(`#m_${prefix}_col`);
      const label = prefix === 'ai' ? 'AI' : 'User';

      overlay.querySelector(`#m_${prefix}_style`).onchange = function() {
        s[`${prefix}Style`] = this.value;
        save();
        col.querySelectorAll('.cb_grp').forEach((g) => { g.style.display = g.dataset.only === this.value ? 'flex' : 'none'; });
        updateAvatarStyle();
      };
      overlay.querySelector(`#m_${prefix}_drag`).onchange = function() { popDrag[prefix] = this.checked; syncPopouts(); };
      overlay.querySelector(`#m_${prefix}_bg`).onchange = function() { s[`${prefix}MsgBg`] = this.checked; save(); updateAvatarStyle(); };
      overlay.querySelector(`#m_${prefix}_pos`).onchange = function() { s[`${prefix}Side`] = this.value; save(); updateAvatarStyle(); };
      overlay.querySelector(`#m_${prefix}_fit`).onchange = function() { s[`${prefix}Fit`] = this.value; save(); updateAvatarStyle(); };

      overlay.querySelector(`#m_${prefix}_reset`).onclick = () => {
        if (!confirm(`Reset all ${label} avatar settings to defaults? (Style stays as it is.)`)) return;
        for (const k of Object.keys(DEFAULTS)) {
          if (k.startsWith(prefix) && k !== `${prefix}Style`) s[k] = structuredClone(DEFAULTS[k]);
        }
        save();
        updateAvatarStyle();
        openCombinedModal();
      };
      
      const sliders = [
        { id: 'sc', key: 'Scale' }, { id: 'pad', key: 'Pad' },
        { id: 'tf', key: 'TopFade' }, { id: 'bf', key: 'BotFade' },
        { id: 'lf', key: 'LeftFade' }, { id: 'rf', key: 'RightFade' },
        { id: 'ox', key: 'PopX' }, { id: 'oy', key: 'PopY' },
        { id: 'bl', key: 'Blur' }
      ];
      
      sliders.forEach(({ id, key }) => {
        const el = overlay.querySelector(`#m_${prefix}_${id}`);
        el.oninput = function() {
          s[`${prefix}${key}`] = Number(this.value);
          overlay.querySelector(`#m_${prefix}_${id}val`).textContent = this.value;
          updateAvatarStyle();
        };
        el.onchange = save;
      });
    };
    
    bindCol('ai');
    bindCol('us');
  }

  // ===== Visual Node Mode =====
  const node = { list: [], pos: 0, segs: [], i: 0, typer: null, auto: null, typing: false, finish: null };
  let nodeQ = null, nodeQAnim = false;

  function parseSegments(raw, fallbackName) {
    raw = String(raw || '');
    const re = /\(\(\s*([^)]+?)\s*\)\)\s*:?|\[\[\s*([^\]]+?)\s*\]\]\s*:?/g;
    const segs = [];
    let last = 0, cur = null, m;
    while ((m = re.exec(raw))) {
      if (cur) {
        cur.text = raw.slice(last, m.index).trim();
        if (cur.text) segs.push(cur);
      } else {
        const pre = raw.slice(0, m.index).trim();
        if (pre) segs.push({ kind: 'narrator', name: '', text: pre });
      }
      if (m[1]) cur = { kind: 'char', name: m[1].trim() };
      else {
        const nm = m[2].trim();
        cur = { kind: 'narrator', name: /^narrator$/i.test(nm) ? '' : nm };
      }
      last = re.lastIndex;
    }
    if (cur) {
      cur.text = raw.slice(last).trim();
      if (cur.text) segs.push(cur);
    } else if (!segs.length && raw.trim()) {
      segs.push({ kind: 'char', name: fallbackName || '', text: raw.trim() });
    }
    return segs;
  }

  function nodeFmt(t) {
    let h = escapeHTML(String(t).trim());
    h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
    h = h.replace(/&quot;(.+?)&quot;/g, '<span class="cb_q">&quot;$1&quot;</span>');
    h = h.replace(/\u201C(.+?)\u201D/g, '<span class="cb_q">\u201C$1\u201D</span>');
    return h.replace(/\n/g, '<br>');
  }

  function userAvatarSrc() {
    const img = document.querySelector('#chat .mes[is_user="true"] .avatar img');
    if (img && img.getAttribute('src')) return fullResUrl(img.getAttribute('src'));
    const sel = document.querySelector('#user_avatar_block .avatar-container.selected');
    const id = sel && (sel.getAttribute('data-avatar-id') || sel.getAttribute('imgfile'));
    return id ? `/User%20Avatars/${encodeURIComponent(id)}` : null;
  }

  function resolveAvatar(name) {
    const key = String(name || '').trim().toLowerCase();
    if (!key) return null;
    const s = settings();
    if (s.nodeAvatars[key]) return s.nodeAvatars[key];
    const c = ctx();
    if (c.name1 && c.name1.toLowerCase() === key) return userAvatarSrc();
    const ch = (c.characters || []).find((x) => x.name && x.name.toLowerCase() === key);
    if (ch && ch.avatar) return `/characters/${encodeURIComponent(ch.avatar)}`;
    return null;
  }

  function collectSpeakers() {
    const map = new Map();
    for (const m of ctx().chat || []) {
      if (m.is_user || m.is_system) continue;
      for (const seg of parseSegments(m.mes || '', '')) {
        if (seg.kind === 'char' && seg.name) map.set(seg.name.toLowerCase(), seg.name);
      }
    }
    return [...map.entries()];
  }

  function spkRowsHtml(s) {
    const spk = collectSpeakers();
    if (!spk.length) return '<div style="opacity:.6;font-size:.85em;">No ((Name)) speakers found in this chat yet.</div>';
    return spk.map(([key, name]) => {
      const src = resolveAvatar(name);
      const manual = !!s.nodeAvatars[key];
      const k = escapeHTML(key);
      return `<div style="display:flex;align-items:center;gap:8px;">
        <div style="width:40px;height:40px;border-radius:8px;overflow:hidden;background:rgba(0,0,0,.35);flex:none;">${src ? `<img src="${escapeHTML(src)}" style="width:100%;height:100%;object-fit:cover;object-position:top;">` : ''}</div>
        <span style="flex:1;min-width:0;">${escapeHTML(name)} <small style="opacity:.6;">${manual ? '(custom)' : src ? '(auto)' : '(none)'}</small></span>
        <button class="menu_button m_n_up" data-key="${k}" title="Upload portrait"><i class="fa-solid fa-upload"></i></button>
        <button class="menu_button danger_button m_n_clr" data-key="${k}" title="Remove custom portrait" ${manual ? '' : 'disabled'}><i class="fa-solid fa-rotate-left"></i></button>
      </div>`;
    }).join('');
  }

  function nodeSectionHtml(s) {
    const sl = (id, key, label, unit, min, max, step) => `
      <div class="cb_row" style="margin-top:8px;"><label>${label}</label><span><span id="m_n_${id}val">${s[key]}</span>${unit}</span></div>
      <input type="range" class="m_n_sl" data-key="${key}" data-id="${id}" min="${min}" max="${max}" step="${step}" value="${s[key]}">`;
    return `
      <div class="cb_section">
        <h4 class="cb_collapse_toggle" style="cursor: pointer; user-select: none; display: flex; justify-content: space-between; align-items: center;">
          <span><i class="fa-solid fa-comments"></i> Visual Node Mode</span>
          <i class="fa-solid fa-chevron-down cb_chevron"></i>
        </h4>
        <div class="cb_collapse_content" style="display: none;">
          <label class="checkbox_label"><input type="checkbox" id="m_n_enable" ${s.nodeEnabled ? 'checked' : ''}><span>Enable (hides normal messages, shows last AI message line by line)</span></label>
          <label class="checkbox_label"><input type="checkbox" id="m_n_tw" ${s.nodeTypewriter ? 'checked' : ''}><span>Typewriter effect</span></label>
          ${sl('sp', 'nodeSpeed', 'Typing delay per character:', 'ms', 5, 80, 1)}
          <label class="checkbox_label" style="margin-top:8px;"><input type="checkbox" id="m_n_auto" ${s.nodeAuto ? 'checked' : ''}><span>Auto-advance to next line</span></label>
          ${sl('ad', 'nodeAutoDelay', 'Auto-advance wait:', 'ms', 500, 8000, 250)}
          ${sl('op', 'nodeOpacity', 'Box opacity:', '%', 30, 100, 1)}
          ${sl('ps', 'nodePortrait', 'Portrait size:', 'px', 60, 240, 5)}
          <div class="cb_sub">Speaker portraits</div>
          <div style="font-size:.8em;opacity:.7;margin-bottom:6px;">Auto-matched by name to your character cards and persona. Upload one for anyone else. The narrator never gets a portrait.</div>
          <div id="m_n_spk" style="display:flex;flex-direction:column;gap:8px;"></div>
          <input type="file" id="m_n_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
        </div>
      </div>`;
  }

  async function uploadPortrait(f) {
    let url = await readDataURL(f);
    let converted = false;
    if (f.type !== 'image/gif') {
      const i = await loadImg(url);
      const mx = Math.max(i.width, i.height);
      if (mx > 768) {
        const k = 768 / mx;
        const c = document.createElement('canvas');
        c.width = Math.round(i.width * k); c.height = Math.round(i.height * k);
        c.getContext('2d').drawImage(i, 0, 0, c.width, c.height);
        url = c.toDataURL('image/png');
        converted = true;
      }
    }
    let ext = (f.name.split('.').pop() || '').toLowerCase();
    if (converted || !['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) ext = 'png';
    const name = `nodepfp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const res = await fetch('/api/files/upload', {
      method: 'POST',
      headers: ctx().getRequestHeaders(),
      body: JSON.stringify({ name, data: url.split(',')[1] }),
    });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    const j = await res.json();
    return '/' + String(j.path).replace(/^\/+/, '');
  }

  function placeNode() {
    const ov = document.getElementById('cb_node');
    if (!ov) return;
    const chat = document.getElementById('chat');
    const form = document.getElementById('form_sheld');
    if (chat) {
      const r = chat.getBoundingClientRect();
      ov.style.left = r.left + 'px';
      ov.style.width = r.width + 'px';
    }
    ov.style.bottom = (form ? window.innerHeight - form.getBoundingClientRect().top + 8 : 90) + 'px';
  }

  function ensureNodeLayer() {
    let ov = document.getElementById('cb_node');
    if (ov) return ov;
    ov = document.createElement('div');
    ov.id = 'cb_node';
    ov.innerHTML = `
      <div class="cb_n_port"><img alt=""><i class="fa-solid fa-user"></i></div>
      <div class="cb_n_box">
        <div class="cb_n_name"></div>
        <div class="cb_n_text"></div>
        <div class="cb_n_arrow"></div>
        <div class="cb_n_ctrl">
          <button type="button" data-a="older" title="Older message"><i class="fa-solid fa-angles-left"></i></button>
          <button type="button" data-a="prev" title="Previous line"><i class="fa-solid fa-angle-left"></i></button>
          <span class="cb_n_count"></span>
          <button type="button" data-a="next" title="Next line"><i class="fa-solid fa-angle-right"></i></button>
          <button type="button" data-a="newer" title="Newer message"><i class="fa-solid fa-angles-right"></i></button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    ov.querySelector('.cb_n_box').addEventListener('click', (e) => {
      if (e.target.closest('.cb_n_ctrl')) return;
      nodeAdvance();
    });
    const acts = { older: () => nodeGoMsg(-1), newer: () => nodeGoMsg(1), prev: () => nodeStep(-1), next: () => nodeStep(1) };
    ov.querySelectorAll('.cb_n_ctrl button').forEach((b) => {
      b.onclick = (e) => { e.stopPropagation(); acts[b.dataset.a](); };
    });
    const port = ov.querySelector('.cb_n_port');
    port.querySelector('img').onerror = () => port.classList.add('cb_noimg');
    window.addEventListener('resize', placeNode);
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(placeNode);
      for (const id of ['chat', 'form_sheld']) { const el = document.getElementById(id); if (el) ro.observe(el); }
    }
    return ov;
  }

  function nodeStopTyping() {
    clearInterval(node.typer); node.typer = null;
    clearTimeout(node.auto); node.auto = null;
    node.typing = false; node.finish = null;
  }

  function typeInto(el, html, speed, done) {
    el.innerHTML = html;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const items = [];
    let n;
    while ((n = walker.nextNode())) { items.push({ n, t: n.nodeValue }); n.nodeValue = ''; }
    let ii = 0, ci = 0;
    node.typing = true;
    const finish = () => {
      clearInterval(node.typer); node.typer = null;
      items.forEach((o) => { o.n.nodeValue = o.t; });
      done();
    };
    node.finish = finish;
    node.typer = setInterval(() => {
      while (ii < items.length && ci >= items[ii].t.length) { ii++; ci = 0; }
      if (ii >= items.length) { finish(); return; }
      ci++;
      items[ii].n.nodeValue = items[ii].t.slice(0, ci);
      el.scrollTop = el.scrollHeight;
    }, speed);
  }

  function nodeShow(animate) {
    const s = settings();
    const ov = ensureNodeLayer();
    nodeStopTyping();
    const seg = node.segs[node.i];
    if (!seg) { ov.style.display = 'none'; return; }
    ov.style.display = 'flex';
    ov.style.setProperty('--cbn-op', s.nodeOpacity / 100);
    ov.style.setProperty('--cbn-ps', s.nodePortrait + 'px');
    const isChar = seg.kind === 'char';
    ov.querySelector('.cb_n_box').classList.toggle('cb_n_nar', !isChar);
    const nameEl = ov.querySelector('.cb_n_name');
    nameEl.textContent = seg.name || '';
    nameEl.style.display = seg.name ? '' : 'none';

    const port = ov.querySelector('.cb_n_port');
    const img = port.querySelector('img');
    const src = isChar ? resolveAvatar(seg.name) : null;
    port.style.display = isChar ? '' : 'none';
    port.classList.toggle('cb_noimg', isChar && !src);
    if (src) {
      if (img.getAttribute('src') !== src) { port.classList.remove('cb_noimg'); img.src = src; }
    }
    const c = ctx();
    ov.classList.toggle('cb_right', isChar && !!c.name1 && seg.name.toLowerCase() === c.name1.toLowerCase());
    ov.querySelector('.cb_n_count').textContent = `${node.pos + 1}/${node.list.length} \u00B7 ${node.i + 1}/${node.segs.length}`;

    const text = ov.querySelector('.cb_n_text');
    const arrow = ov.querySelector('.cb_n_arrow');
    const more = node.i < node.segs.length - 1;
    const html = nodeFmt(seg.text);
    arrow.textContent = '';
    const done = () => {
      node.typing = false; node.finish = null;
      arrow.textContent = more ? '\u25BC' : '';
      if (s.nodeAuto && more) node.auto = setTimeout(() => nodeStep(1), s.nodeAutoDelay);
    };
    if (animate && s.nodeTypewriter && s.nodeSpeed > 0) typeInto(text, html, s.nodeSpeed, done);
    else { text.innerHTML = html; done(); }
    placeNode();
  }

  function nodeStep(d) {
    const ni = node.i + d;
    if (ni < 0 || ni >= node.segs.length) return;
    node.i = ni;
    nodeShow(d > 0);
  }

  function nodeAdvance() {
    if (node.typing && node.finish) { node.finish(); return; }
    nodeStep(1);
  }

  function nodeParseCurrent() {
    const c = ctx();
    const m = c.chat[node.list[node.pos]];
    node.segs = m ? parseSegments(m.mes, m.name || c.name2) : [];
  }

  function nodeGoMsg(d) {
    const np = node.pos + d;
    if (np < 0 || np >= node.list.length) return;
    node.pos = np;
    nodeParseCurrent();
    node.i = 0;
    nodeShow(false);
  }

  function syncNodeToggle() {
    const b = document.getElementById('cb_node_toggle');
    if (b) b.classList.toggle('cb_on', !!settings().nodeEnabled);
  }

  function nodeLoad(opts = {}) {
    const s = settings();
    const ov = ensureNodeLayer();
    syncNodeToggle();
    if (!s.nodeEnabled) { nodeStopTyping(); ov.style.display = 'none'; return; }
    const c = ctx();
    node.list = [];
    (c.chat || []).forEach((m, i) => { if (!m.is_user && !m.is_system && m.mes) node.list.push(i); });
    if (!node.list.length) { nodeStopTyping(); ov.style.display = 'none'; return; }
    node.pos = node.list.length - 1;
    nodeParseCurrent();
    node.i = 0;
    nodeShow(!!opts.animate);
  }

  function nodeQueue(animate) {
    nodeQAnim = nodeQAnim || !!animate;
    clearTimeout(nodeQ);
    nodeQ = setTimeout(() => { const a = nodeQAnim; nodeQAnim = false; nodeLoad({ animate: a }); }, 60);
  }

  function nodeToggle() {
    const s = settings();
    s.nodeEnabled = !s.nodeEnabled;
    save();
    updateAvatarStyle();
    nodeLoad({ animate: false });
  }

  function injectNodeToggle() {
    const lsf = document.getElementById('leftSendForm');
    if (!lsf || document.getElementById('cb_node_toggle')) return;
    const b = document.createElement('div');
    b.id = 'cb_node_toggle';
    b.className = 'fa-solid fa-comments interactable';
    b.title = 'Visual Node mode';
    b.tabIndex = 0;
    b.onclick = nodeToggle;
    lsf.appendChild(b);
    syncNodeToggle();
  }

  function injectExtensionMenuButton() {
    setInterval(() => {
      injectNodeToggle();
      const extMenu = document.getElementById('extensions_settings2');
      if (extMenu && !document.getElementById('cv_ext_btn_container')) {
        const container = document.createElement('div');
        container.id = 'cv_ext_btn_container';
        container.innerHTML = `
          <hr style="margin: 10px 0; border-color: var(--SmartThemeBorderColor, #444);">
          <div style="display:flex; justify-content:center; width: 100%;">
            <button id="cv_ext_btn" class="menu_button interactable" style="padding: 10px; width: 100%; font-weight: bold;">
              <i class="fa-solid fa-layer-group"></i> Open Nitwit Tavern Redesign Menu
            </button>
          </div>
        `;
        extMenu.appendChild(container);
        document.getElementById('cv_ext_btn').onclick = openCombinedModal;
      }
    }, 1000);
  }

  jQuery(() => {
    const { eventSource, event_types } = ctx();
    injectExtensionMenuButton();
    window.addEventListener('resize', () => syncWallpaper());
    eventSource.on(event_types.CHAT_CHANGED, renderAll);
    eventSource.on(event_types.CHAT_CHANGED, () => nodeQueue(false));
    for (const [name, anim] of [['CHARACTER_MESSAGE_RENDERED', true], ['MESSAGE_SWIPED', true], ['MESSAGE_EDITED', false], ['MESSAGE_DELETED', false]]) {
      if (event_types[name]) eventSource.on(event_types[name], () => nodeQueue(anim));
    }
    window.addEventListener('resize', layoutFg);
    if (event_types.APP_READY) eventSource.on(event_types.APP_READY, () => { renderAll(); nodeQueue(false); });

    const chat = document.getElementById('chat');
    if (chat) {
      chat.addEventListener('scroll', () => syncWallpaper(), { passive: true });
      new MutationObserver(() => {
        syncPopouts();
        const key = currentKey();
        if (!banner || !key || settings().bannerMode === 'off') return;
        if (!peek(key).locked && chat.firstElementChild !== banner) chat.prepend(banner);
      }).observe(chat, { childList: true });
    }
    renderAll();
    nodeQueue(false);
  });
})();
