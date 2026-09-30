(() => {
  const MODULE = 'chatvisuals';
  const DEFAULTS = { 
    bannerMode: 'image', // 'image', 'youtube', 'off'
    bannerHeight: 120,
    bannerGap: 10,
    bannerBackdrop: 'wallpaper', // what transparent banner pixels show: 'wallpaper' or 'panel' 
    chars: {},
    avatarEnabled: true,
    
    // AI Settings
    aiStyle: 'backdrop', aiPopX: 0, aiPopY: 0,
    aiSide: 'tl', aiFit: 'cover', aiScale: 100, aiPad: 140, 
    aiTopFade: 0, aiBotFade: 180, aiLeftFade: 0, aiRightFade: 50, aiBlur: 0, aiMsgBg: true,
    
    // User Settings
    usStyle: 'backdrop', usPopX: 0, usPopY: 0,
    usSide: 'tr', usFit: 'cover', usScale: 100, usPad: 140, 
    usTopFade: 0, usBotFade: 180, usLeftFade: 50, usRightFade: 0, usBlur: 0, usMsgBg: true
  };

  const ctx = () => SillyTavern.getContext();
  const save = () => ctx().saveSettingsDebounced();
  let banner = null;
  const popMsg = { ai: '', us: '' }; // human-readable Pop Out status, shown in the menu
  const popDrag = { ai: false, us: false }; // transient: is 'drag on screen' on for this side

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
    // Vertical fades moved from % to px: convert old saved values once (roughly x3)
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

    // Shared by both styles: text padding, name alignment, optional transparent message box
    const shared = `
      .mes[is_user="${isUserStr}"] .mes_block { ${padCss} }
      .mes[is_user="${isUserStr}"] .ch_name { display: flex !important; justify-content: ${justify} !important; text-align: ${align} !important; width: 100% !important; }
      ${keepBg ? '' : `.mes[is_user="${isUserStr}"] { background-color: transparent !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }`}
    `;

    // POP OUT: the image lives in a top-level layer (see ensurePopLayer), so it can float
    // above the whole UI. Anchor = screen corner/edge, then X/Y offset. The in-message avatar is hidden.
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

    // BACKDROP: image sits behind the text, clipped inside the message box
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
    // Default: img fills the whole avatar box
    let imgBoxCss = 'inset: 0 !important; width: 100% !important; height: 100% !important;';
    if (fit === 'contain') {
      imgFitCss = 'object-fit: contain !important;';
      // Box hugs the image vertically, so the top/bottom fade lands on the real image edges
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

  // ---------- Pop Out layer: a top-level element so it can sit above menus and panels ----------
  function setPopStatus(prefix, msg) {
    popMsg[prefix] = msg;
    console.log(`[chatvisuals] pop out (${prefix}): ${msg}`);
    const el = document.getElementById(`m_${prefix}_pstat`);
    if (el) el.textContent = msg;
  }

  function ensurePopLayer() {
    bindPopDragGlobal(); // idempotent; must run even when a layer already exists
    let layer = document.getElementById('cb_pop_layer');
    if (layer && layer.dataset.v === '3') return layer;
    if (layer) layer.remove(); // leftover from an older copy: rebuild so it gets our handlers
    layer = document.createElement('div');
    layer.id = 'cb_pop_layer';
    layer.dataset.v = '3';
    layer.innerHTML = '<img id="cb_pop_ai" alt="" draggable="false"><img id="cb_pop_us" alt="" draggable="false">'
      + '<div id="cb_drag_pill"><span>Drag mode on</span><button type="button" id="cb_drag_done">Done</button></div>';
    document.body.appendChild(layer);
    // Always-reachable exit, since a floating pfp can end up on top of the menu's own buttons
    layer.querySelector('#cb_drag_done').onclick = () => {
      popDrag.ai = false; popDrag.us = false;
      document.querySelectorAll('#m_ai_drag, #m_us_drag').forEach((c) => { c.checked = false; });
      syncPopouts();
    };
    for (const prefix of ['ai', 'us']) {
      const el = layer.querySelector(`#cb_pop_${prefix}`);
      // If the full-res file can't be loaded, fall back to the thumbnail used in the chat
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

  // Chat avatars are small thumbnails; ask for the full-size file when we can
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

  // Dragging is handled on window (capture phase) and hit-tests the image box itself,
  // so a menu, panel or overlay sitting on top of the pfp can't steal the press.
  let popSession = null;      // active drag: { prefix, id, sx, sy, ox, oy }
  let popTouchGuard = false;  // touch-scroll blocker, only attached while drag mode is on
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
      // The User image is later in the DOM, so it draws above the AI one: test it first
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
      // A press that started on the pfp shouldn't also click whatever is underneath it
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
    // While 'Drag it on screen' is on, lift the layer above the menu overlay so the image can be grabbed
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
        // No AI message in the chat yet: use the character's own avatar file
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

  // Draw the real wallpaper behind the banner so transparent pixels show it,
  // instead of the chat panel's tinted/blurred backing.
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
    
    // Base banner styles injected regardless of avatar toggle
    let cssString = `
      #cb_banner { width: 100%; height: var(--cb-h, 120px); position: relative; overflow: hidden; display: block; border-radius: 10px; margin-bottom: ${s.bannerGap}px; }
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
      #cb_pop_layer { position: fixed; inset: 0; z-index: 4000; pointer-events: none; overflow: hidden; }
      #cb_pop_layer img { position: absolute; display: none; pointer-events: none; max-width: none; user-select: none; -webkit-user-drag: none; touch-action: none; }
      #cb_drag_pill { position: absolute; left: 50%; bottom: calc(16px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); display: none; align-items: center; gap: 10px; padding: 8px 8px 8px 14px; border-radius: 999px; background: rgba(0,0,0,0.85); color: #fff; font-size: 13px; line-height: 1.2; white-space: nowrap; pointer-events: auto; box-shadow: 0 2px 10px rgba(0,0,0,0.5); }
      #cb_drag_pill button { border: none; border-radius: 999px; padding: 5px 14px; font-weight: bold; cursor: pointer; background: var(--SmartThemeQuoteColor, #6cf); color: #000; }
      .cb_col { display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 0; background: rgba(0,0,0,0.15); padding: 10px; border-radius: 8px; }
      .cb_grp { flex-direction: column; gap: 8px; }
      .cb_sub { font-size: 0.75em; opacity: 0.65; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 4px; padding-top: 6px; border-top: 1px solid var(--SmartThemeBorderColor, #444); }
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
    if (!s.chars[key]) s.chars[key] = { images: [], idx: 0, locked: true, youtubeUrl: '' };
    if (s.chars[key].youtubeUrl === undefined) s.chars[key].youtubeUrl = '';
    return s.chars[key];
  };

  function rec(key) {
    return peek(key);
  }

  function buildBanner() {
    banner = document.createElement('div');
    banner.id = 'cb_banner';
    // Referrer policy added to the iframe to fix YouTube Error 153
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

      // Controls on, autoplay off, mute off so you can manually play it with sound
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
      const chat = document.getElementById('chat');
      if (!chat) return;
      if (!banner) buildBanner();
      const key = currentKey();
      if (settings().bannerMode === 'off' || !key) {
        banner.style.display = 'none';
        return;
      }
      attachBanner(chat, peek(key).locked);
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
    // Groups that only show for one style (toggled live when Style changes)
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
    const r = key ? rec(key) : { images: [], locked: true, youtubeUrl: '' };
    const n = r.images.length;
    const curImg = r.images[r.idx] || null;
    const safeCharName = key ? escapeHTML(currentCharacterName()) : 'No Char';

    const overlay = document.createElement('div');
    overlay.id = 'cb_modal_overlay';
    overlay.className = 'cb_popup_overlay';

    overlay.innerHTML = `
      <div class="cb_popup_content">
        <div class="cb_popup_header">
          <span><i class="fa-solid fa-layer-group"></i> Nitwit Tavern Redesign <small style="opacity:.5;font-weight:normal;">(drag fix v3)</small></span>
          <button class="cb_close_btn">&times;</button>
        </div>

        <div class="cb_section">
          <h4><i class="fa-solid fa-panorama"></i> Header Banner (${safeCharName})</h4>
          
          <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px; background: rgba(0,0,0,0.15); padding: 10px; border-radius: 8px;">
            <label class="checkbox_label" ${!key ? 'style="opacity:0.5;pointer-events:none;"' : ''}>
              <input type="checkbox" id="m_b_lock" ${r.locked ? 'checked' : ''}><span>Lock to top</span>
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

          <div class="cb_row" style="margin-top: 10px;"><label>Gap Below Banner:</label><span><span id="m_b_gapval">${s.bannerGap}</span>px</span></div>
          <input type="range" id="m_b_gap" min="0" max="40" step="1" value="${s.bannerGap}">

          <label style="display: block; margin-top: 10px;"><strong>Transparent areas show:</strong>
            <select id="m_b_bd" style="width: 100%; margin-top: 5px;">
              <option value="wallpaper" ${s.bannerBackdrop !== 'panel' ? 'selected' : ''}>Wallpaper</option>
              <option value="panel" ${s.bannerBackdrop === 'panel' ? 'selected' : ''}>Chat panel tint</option>
            </select>
          </label>
        </div>

        <div class="cb_section">
          <h4><i class="fa-solid fa-user-astronaut"></i> Pfp Management</h4>
          <label class="checkbox_label" style="margin-bottom: 5px;"><input type="checkbox" id="m_a_enable" ${s.avatarEnabled ? 'checked' : ''}><span>Enable NTR Avatars</span></label>
          
          <div style="display: flex; gap: 15px; width: 100%;">
            ${getColHtml('ai', 'AI', s)}
            ${getColHtml('us', 'User', s)}
          </div>
        </div>
      </div>`;

    document.body.appendChild(overlay);

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
    
    // Banner Mode Switch
    overlay.querySelector('#m_b_mode').onchange = function() {
      s.bannerMode = this.value;
      save();
      overlay.querySelector('#m_b_img_controls').style.display = this.value === 'image' ? 'block' : 'none';
      overlay.querySelector('#m_b_yt_controls').style.display = this.value === 'youtube' ? 'block' : 'none';
      renderAll();
    };

    if (key) {
      overlay.querySelector('#m_b_lock').onchange = function() { r.locked = this.checked; save(); renderAll(); };
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

    // Avatar Bindings
    overlay.querySelector('#m_a_enable').onchange = function() { s.avatarEnabled = this.checked; save(); updateAvatarStyle(); };
    
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

      // Reset everything for this side back to defaults; the chosen Style is kept
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

  function injectExtensionMenuButton() {
    const extMenu = document.getElementById('extensions_settings2');
    if (!extMenu) return;
    if (document.getElementById('cv_ext_btn_container')) return;

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

  jQuery(() => {
    const { eventSource, event_types } = ctx();
    injectExtensionMenuButton();
    window.addEventListener('resize', () => syncWallpaper());
    eventSource.on(event_types.CHAT_CHANGED, renderAll);
    if (event_types.APP_READY) eventSource.on(event_types.APP_READY, renderAll);

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
  });
})();
