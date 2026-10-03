(() => {
  const MODULE = 'chatvisuals';
  const VERSION = '2.2.9';
  const NTR_BASE = new URL('.', import.meta.url).href;
  const TAG = '<i class="fa-solid fa-tag ntr_tag" title="Saved per character"></i>';
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
    aiEnabled: true, aiLeftFadePx: 0, aiRightFadePx: 150,
    
    // User Settings
    usStyle: 'backdrop', usPopX: 0, usPopY: 0,
    usSide: 'tr', usFit: 'cover', usScale: 100, usPad: 140, 
    usTopFade: 0, usBotFade: 180, usLeftFade: 50, usRightFade: 0, usBlur: 0, usMsgBg: true,
    usEnabled: true, usLeftFadePx: 150, usRightFadePx: 0,

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

    // Visual Novel Mode
    nodeEnabled: false, nodeTypewriter: true, nodeSpeed: 20,
    nodeAuto: false, nodeAutoDelay: 2500, nodeOpacity: 88, nodePortrait: 120,
    nodeAvatars: {},
    nodeUserMsgs: true, nodePicker: true, nodeHideEmo: true, nodeShape: 'rounded',
    nodeEmoImgs: {}, nodeCustomSpk: [],
    emotions: [
      { id: 'emo_neutral', name: 'Neutral' }, { id: 'emo_happy', name: 'Happy' },
      { id: 'emo_sad', name: 'Sad' }, { id: 'emo_angry', name: 'Angry' },
      { id: 'emo_surprised', name: 'Surprised' }, { id: 'emo_dead', name: 'Dead' }
    ],
    emoDefault: 'emo_neutral',
    delimSpkOpen: '((', delimSpkClose: '))', delimNarOpen: '[[', delimNarClose: ']]',
    delimEmo: '%%', narratorWord: 'Narrator',

    // Display overrides
    ovWidthOn: false, ovWidth: 50, ovFontOn: false, ovFont: 1,
    ovBlurOn: false, ovBlur: 10, ovShadowOn: false, ovShadow: 2,
    ovChatStyleOn: false, ovChatStyle: 'bubbles', ovAvatarOn: false, ovAvatar: 'round',

    // Menu state
    uiOpen: { banner: true },
    uiPanel: { dock: 'right', w: 440, fw: 560, fh: 0, x: null, y: null },

    // Master switch + themes
    masterEnabled: true,
    fgHideVN: false,
    groupData: {},
    charData: {},
    nodeBoxWidth: 100, nodeBoxMinH: 96, nodeBoxMaxH: 28, nodeBoxLift: 8, nodeTextScale: 100,
    nodeSprites: true, nodePortraitBox: true, nodeSpriteScale: 100, nodeSpriteBase: false, nodeInject: true,
    locWord: 'Location',

    // Visual Novel scene tags, art kit, opening video, maps
    nodeSplitUntagged: true,
    nodeChoices: true, choiceSend: false, choiceWord: 'Choice', choiceSep: '|',
    nodeEffects: true, effectWord: 'Effect', fxShake: 'Shake', fxFlash: 'Flash', fxFade: 'Fade',
    weatherWord: 'Weather', wxRain: 'Rain', wxSnow: 'Snow', wxClear: 'Clear',
    nodeCG: true, cgWord: 'CG', nodeAutoSpk: true,
    enterWord: 'Enter', exitWord: 'Exit',
    artBg: 'dusk', artBgImg: '', artSprite: 'builtin', artSpriteImg: '',
    opLead: 3, opFade: 1000, opSize: 50, opPos: 'center', opHold: true, opExit: 'stay', opTrans: 'color', opTransColor: '#000000', opTransMs: 400, opEarly: false, opMute: false, opSeen: {},
    nodeMaps: true, mapGoText: '*heads to the {place}*',
    themes: [],
    themeActive: null,

    // Privacy
    blockExternal: false
  };

  const ctx = () => SillyTavern.getContext();
  const save = () => {
    ctx().saveSettingsDebounced();
    const k = currentKey();
    if (k) scheduleCardFlush(k);
  };
  const isOn = () => settings().masterEnabled !== false;
  let banner = null;
  const popMsg = { ai: '', us: '' }; 
  const popDrag = { ai: false, us: false }; 

  const escapeHTML = (str) => {
    return String(str).replace(/[&<>'"]/g, match => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[match]));
  };

  // Left and right fades used to be a % of the image width. The image box is Scale x 3 px wide.
  const pctFadeToPx = (pct, scale) => Math.min(400, Math.max(0, Math.round((Number(pct) || 0) / 100 * (Number(scale) || 100) * 3)));

  function settings() {
    const { extensionSettings } = ctx();
    const fresh = !extensionSettings[MODULE];
    if (fresh) extensionSettings[MODULE] = {};
    const s = extensionSettings[MODULE];
    const keepOldLook = !fresh && !('artBg' in s) && !!(s.vnUsed || s.nodeEnabled);
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
    if (!s.sideFadePxMigrated) {
      if (!fresh) {
        for (const p of ['ai', 'us']) {
          for (const k of ['LeftFade', 'RightFade']) s[p + k + 'Px'] = pctFadeToPx(s[p + k], s[p + 'Scale']);
        }
      }
      s.sideFadePxMigrated = true;
    }
    if (keepOldLook) { s.artBg = 'none'; s.artSprite = 'none'; }
    if (!s.opSeen || typeof s.opSeen !== 'object') s.opSeen = {};
    if (s.bannerEnabled !== undefined && !s.migratedBanner) {
      s.bannerMode = s.bannerEnabled ? 'image' : 'off';
      s.migratedBanner = true;
      delete s.bannerEnabled;
    }
    if (s.vnUsed === undefined) s.vnUsed = !!s.nodeEnabled || Object.keys(s.nodeAvatars || {}).length > 0;
    for (const k of Object.keys(DEFAULTS.uiPanel)) if (s.uiPanel[k] === undefined) s.uiPanel[k] = DEFAULTS.uiPanel[k];
    if (!Array.isArray(s.themes)) s.themes = [];
    if (!Array.isArray(s.emotions) || !s.emotions.length) s.emotions = structuredClone(DEFAULTS.emotions);
    if (!s.emotions.some((e) => e.id === s.emoDefault)) s.emoDefault = s.emotions[0].id;
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
    const leftFade = s[`${prefix}LeftFadePx`];
    const rightFade = s[`${prefix}RightFadePx`];
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

    const hMask = `linear-gradient(to right, transparent 0%, black ${leftFade}px, black calc(100% - ${rightFade}px), transparent 100%)`;
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
          console.warn(`[NTR pop out] (${prefix}) ${popMsg[prefix]}`);
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
      if (chat && window.ResizeObserver) new ResizeObserver(() => layoutFg()).observe(chat);
    }
    let front = document.getElementById('cb_fg_front');
    if (!front) {
      front = document.createElement('div');
      front.id = 'cb_fg_front';
      document.body.appendChild(front);
    }

    const s = settings();
    const F = fgData();
    const show = isOn() && s.fgEnabled && !(s.fgHideVN && s.nodeEnabled);
    layer.style.display = show ? 'block' : 'none';
    front.style.display = show ? 'block' : 'none';
    document.documentElement.style.setProperty('--cb-fg-op', (s.fgOpacity ?? 100) / 100);

    for (const pos of FG_POS) {
      const el = document.getElementById(`cb_fg_${pos.toLowerCase()}`);
      const target = F[pos + 'Layer'] === 'front' ? front : layer;
      if (el.parentNode !== target) target.appendChild(el);
      const src = media(F[pos]);
      const sc = (Number(F[pos + 'Scale']) || 100) / 100;
      el.style.transformOrigin = pos === 'Left' ? 'left bottom' : pos === 'Right' ? 'right bottom' : 'center bottom';
      el.style.transform = `scale(${sc})`;
      if (src) {
        if (el.getAttribute('src') !== src) el.src = src;
        el.style.display = 'block';
      } else {
        el.style.display = 'none';
        el.removeAttribute('src');
      }
    }
    layoutFg();
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
      const on = isOn() && s.avatarEnabled && s[`${prefix}Enabled`] !== false && s[`${prefix}Style`] === 'popout';
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
      #cb_banner .cb_wall { position: absolute; background-size: cover; background-position: center; background-repeat: no-repeat; pointer-events: none; z-index: 0; }
      #cb_banner .cb_img, #cb_banner .cb_yt { position: relative; z-index: 1; }
      #cb_pop_layer { position: fixed; inset: 0; z-index: 2500; pointer-events: none; overflow: hidden; }
      #cb_pop_layer img { position: absolute; display: none; pointer-events: none; max-width: none; user-select: none; -webkit-user-drag: none; touch-action: none; }
      #cb_drag_pill { position: absolute; left: 50%; bottom: calc(16px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); display: none; align-items: center; gap: 10px; padding: 8px 8px 8px 14px; border-radius: 999px; background: rgba(0,0,0,0.85); color: #fff; font-size: 13px; line-height: 1.2; white-space: nowrap; pointer-events: auto; box-shadow: 0 2px 10px rgba(0,0,0,0.5); }
      #cb_drag_pill button { border: none; border-radius: 999px; padding: 5px 14px; font-weight: bold; cursor: pointer; background: var(--SmartThemeQuoteColor, #6cf); color: #000; }
      .cb_col { display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 0; background: rgba(0,0,0,0.15); padding: 10px; border-radius: 8px; }
      .cb_grp { flex-direction: column; gap: 8px; }
      .cb_col_body { display: flex; flex-direction: column; gap: 8px; }
      .cb_sub { font-size: 0.75em; opacity: 0.65; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 4px; padding-top: 6px; border-top: 1px solid var(--SmartThemeBorderColor, #444); }
      
      #cb_fg_layer { position: fixed; inset: 0; z-index: 2400; pointer-events: none; opacity: var(--cb-fg-op, 1); }
      #cb_fg_front { position: fixed; inset: 0; z-index: 2420; pointer-events: none; opacity: var(--cb-fg-op, 1); }
      .cb_fg_img { position: absolute; bottom: 0; height: 100%; object-fit: contain; object-position: center bottom; pointer-events: none; }
      #cb_fg_left { left: 0; object-position: left bottom; }
      #cb_fg_right { right: 0; object-position: right bottom; }

      .cb_collapse_toggle { cursor: pointer; user-select: none; display: flex; justify-content: space-between; align-items: center; }
      .cb_subhead { margin-top: 10px; padding: 6px 4px; font-weight: bold; font-size: .92em; border-bottom: 1px dashed var(--SmartThemeBorderColor, #444); }
      .cb_subhead + .cb_collapse_content { padding: 8px 4px 4px; }
      .cb_dim { opacity: .4; pointer-events: none; filter: grayscale(.5); transition: opacity .15s; }
      .cb_hint { font-size: .8em; opacity: .7; margin: 4px 0 6px; }
      .cb_err { color: #ff8a8a; }
      .cb_warn { color: #ffd479; }
      .cb_code { white-space: pre-wrap; font-family: monospace; font-size: .85em; background: rgba(0,0,0,.25); padding: 6px 8px; border-radius: 6px; margin-top: 8px; }
      .cb_pills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 5px; }
      .cb_pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px 4px 8px; border-radius: 999px; border: 1px solid var(--SmartThemeBorderColor, #555); background: rgba(0,0,0,.2); cursor: pointer; user-select: none; font-size: .9em; transition: background .15s, border-color .15s; }
      .cb_pill input, .cb_posgrid input, .cb_defdot input { margin: 0; cursor: pointer; accent-color: var(--SmartThemeQuoteColor, #6cf); }
      /* The main Enable switches are diamonds that still click on and off. */
      #m_f_enable, #m_a_enable, #m_n_enable, #m_ai_on, #m_us_on {
        appearance: none; -webkit-appearance: none; flex: none; box-sizing: border-box; width: .95em; height: .95em; margin: 0 9px 0 4px;
        border: 2px solid var(--SmartThemeBorderColor, #888); border-radius: 2px; background: transparent; cursor: pointer;
        transform: rotate(45deg); display: inline-grid; place-content: center; vertical-align: middle;
      }
      #m_f_enable::before, #m_a_enable::before, #m_n_enable::before, #m_ai_on::before, #m_us_on::before {
        content: ''; width: .42em; height: .42em; background: var(--SmartThemeQuoteColor, #6cf); transform: scale(0); transition: transform .12s;
      }
      #m_f_enable:checked, #m_a_enable:checked, #m_n_enable:checked, #m_ai_on:checked, #m_us_on:checked { border-color: var(--SmartThemeQuoteColor, #6cf); }
      #m_f_enable:checked::before, #m_a_enable:checked::before, #m_n_enable:checked::before, #m_ai_on:checked::before, #m_us_on:checked::before { transform: scale(1); }
      #m_f_enable:focus-visible, #m_a_enable:focus-visible, #m_n_enable:focus-visible, #m_ai_on:focus-visible, #m_us_on:focus-visible { outline: 2px solid var(--SmartThemeQuoteColor, #6cf); outline-offset: 3px; }
      .cb_pill:has(input:checked) { border-color: var(--SmartThemeQuoteColor, #6cf); background: rgba(255,255,255,.08); }
      .cb_posgrid { display: grid; grid-template-columns: repeat(3, 28px); gap: 4px; padding: 6px; margin-top: 5px; border-radius: 8px; background: rgba(0,0,0,.2); width: max-content; }
      .cb_posgrid label { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; }
      .cb_posgrid label:hover { background: rgba(255,255,255,.08); }
      .cb_ovrow { padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,.06); }
      .cb_ovrow .m_o_body { margin-top: 4px; padding-left: 26px; }
    `;

    if (isOn()) cssString += overrideCss(s);

    if (isOn() && s.chatTransparent) {
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

    if (isOn() && s.avatarEnabled) {
      for (const [prefix, flag] of [['ai', 'false'], ['us', 'true']]) {
        if (s[`${prefix}Enabled`] === false) continue;
        const m = `.mes[is_user="${flag}"]`;
        cssString += `
        ${m} { position: relative !important; padding: 0 !important; background-color: var(--SmartThemeChatMesBgc) !important; border-radius: var(--SmartThemeChatMesRounding, 15px) !important; }
        ${m} .mes_block, ${m} .mes_text { background: transparent !important; border: none !important; box-shadow: none !important; }
        ${m} .mes_block { position: relative !important; z-index: 1 !important; width: 100% !important; min-height: 120px !important; padding: 15px !important; }

        ${getAvatarCss(prefix, flag, s)}
      `;
      }
    }

    styleEl.textContent = cssString;
    applyBodyOverrides();
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
    const d = cardData(key);
    let r;
    if (d) {
      if (!d.banner || typeof d.banner !== 'object') {
        if (s.chars[key]) { d.banner = structuredClone(s.chars[key]); cleanBanner(d.banner); legacyMoved.add(key); scheduleCardFlush(key); }
        else d.banner = defaultBanner();
      }
      r = d.banner;
    } else {
      if (!s.chars[key]) s.chars[key] = defaultBanner();
      r = s.chars[key];
      if (!cleaned.has(r)) { cleaned.add(r); cleanBanner(r); }
    }
    const def = defaultBanner();
    for (const k of Object.keys(def)) if (r[k] === undefined) r[k] = def[k];
    if (!Array.isArray(r.images)) r.images = [];
    return r;
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
      const u = media(im.url);
      if (!u) { banner.style.display = 'none'; return; }
      if (img.getAttribute('src') !== u) img.src = u;
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
      if (!isOn()) { if (banner) banner.style.display = 'none'; syncWallpaper(); return; }
      
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
      console.error('[NTR render]', e);
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

  // Ask for an image link instead of an upload. Resolves to a checked http(s) URL, or '' if cancelled or unusable.
  async function askImageUrl(label = 'Image') {
    const raw = prompt(`${label}: paste an image link (https://...)`);
    if (raw === null) return '';
    const u = cUrl(raw);
    if (!/^https?:\/\//i.test(u)) { toastr.warning('Paste a full link that starts with http:// or https://', 'Image link'); return ''; }
    try { await loadImg(u); } catch (e) { toastr.error('That link did not load as an image. Check it and try again.', 'Image link'); return ''; }
    if (settings().blockExternal) toastr.info('Images from other websites are blocked by your privacy setting, so this one will stay hidden until you turn that off.', 'Image link');
    return u;
  }

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
        console.error('[NTR banner upload]', e);
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
    deleteFileIfUnused(im.url);
  }

  function getColHtml(prefix, title, s) {
    const style = s[`${prefix}Style`] === 'popout' ? 'popout' : 'backdrop';

    const slider = (id, key, label, unit, min, max, step) => `
      <div class="cb_row"><label>${label}</label><span><span id="m_${prefix}_${id}val">${s[`${prefix}${key}`]}</span>${unit}</span></div>
      <input type="range" id="m_${prefix}_${id}" min="${min}" max="${max}" step="${step}" value="${s[`${prefix}${key}`]}">`;
    const grp = (only, inner) => `<div class="cb_grp" data-only="${only}" style="display: ${style === only ? 'flex' : 'none'};">${inner}</div>`;

    return `
      <div id="m_${prefix}_col" class="cb_col">
        <h5 class="col_header">${title}</h5>
        <label class="checkbox_label"><input type="checkbox" id="m_${prefix}_on" ${s[`${prefix}Enabled`] !== false ? 'checked' : ''}><span>Enable ${title} avatar</span></label>
        <div id="m_${prefix}_body" class="cb_col_body${s[`${prefix}Enabled`] !== false ? '' : ' cb_dim'}">

        <div><strong>Style:</strong>${pills(`${prefix}style`, [['backdrop', 'Backdrop'], ['popout', 'Pop Out']], style)}</div>
        <div><strong>Position:</strong>${posGrid(`${prefix}pos`, s[`${prefix}Side`])}</div>
        ${grp('backdrop', `<div><strong>Image Fit:</strong>${pills(`${prefix}fit`, [['cover', 'Fill'], ['contain', 'Fit'], ['original', 'Original']], s[`${prefix}Fit`])}</div>`)}

        ${slider('sc', 'Scale', 'Image Scale:', '%', 10, 300, 5)}
        ${slider('pad', 'Pad', 'Text Padding:', 'px', 0, 400, 5)}

        ${grp('backdrop', `<div class="cb_sub">Fades</div>`
          + slider('tf', 'TopFade', 'Top Fade:', 'px', 0, 400, 5)
          + slider('bf', 'BotFade', 'Bottom Fade:', 'px', 0, 400, 5)
          + slider('lf', 'LeftFadePx', 'Left Fade:', 'px', 0, 400, 5)
          + slider('rf', 'RightFadePx', 'Right Fade:', 'px', 0, 400, 5))}

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
      </div>
    `;
  }

  function bannerGuideText() {
    const chat = document.getElementById('chat');
    const w = Math.round((banner && banner.offsetWidth) || (chat ? chat.getBoundingClientRect().width : 0));
    if (!w) return '';
    const h = settings().bannerHeight;
    const ratio = (w / h).toFixed(1);
    return `Your banner is currently ${w} × ${h} px (${ratio}:1). For sharp results use images at least ${w * 2} × ${Math.round(h * 2 * 1.3)} px. A little taller than the banner's shape gives the Crop slider room to work.`;
  }

  function openCombinedModal() {
    const prevScroll = document.querySelector('#cb_modal_overlay .ntr_body')?.scrollTop || 0;
    document.getElementById('cb_modal_overlay')?.remove();
    const s = settings();
    const F = fgData();
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
          <span class="ntr_title"><i class="fa-solid fa-layer-group"></i> Nitwit Tavern Redesign</span>
          <span class="ntr_hbtns">
            <button class="cb_hbtn ntr_dockbtn" data-dock="left" title="Dock left"><i class="fa-solid fa-left-long"></i></button>
            <button class="cb_hbtn ntr_dockbtn" data-dock="float" title="Float"><i class="fa-regular fa-window-restore"></i></button>
            <button class="cb_hbtn ntr_dockbtn" data-dock="right" title="Dock right"><i class="fa-solid fa-right-long"></i></button>
            <button class="cb_close_btn" title="Close">&times;</button>
          </span>
        </div>
        <div class="ntr_body">
        ${isOn() ? '' : '<div class="ntr_offnote"><i class="fa-solid fa-power-off"></i> The extension is switched off. Use the power button on its bar in the Extensions panel to turn it back on.</div>'}
        <div class="cb_hint ntr_legend">${TAG} saved per character. Everything else is global.</div>

        ${themesSectionHtml(s)}

        <div class="cb_section">
          ${secHead('banner', 'fa-panorama', 'Header Banner (' + safeCharName + ')')}
          <div class="cb_collapse_content">
            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px; background: rgba(0,0,0,0.15); padding: 10px; border-radius: 8px;">
              <label class="checkbox_label" ${!key ? 'style="opacity:0.5;pointer-events:none;"' : ''}>
                <input type="checkbox" id="m_b_lock" ${r.locked ? 'checked' : ''}><span>Lock to top ${TAG}</span>
              </label>
              <label class="checkbox_label" ${!key ? 'style="opacity:0.5;pointer-events:none;"' : ''}>
                <input type="checkbox" id="m_b_overlap" ${r.overlap ? 'checked' : ''}><span>Overlap messages ${TAG}</span>
              </label>
              <div><strong>Mode:</strong>${pills('bmode', [['image', 'Image Gallery'], ['youtube', 'YouTube Loop'], ['off', 'Off']], s.bannerMode)}</div>
            </div>
            
            <!-- Image Controls -->
            <div id="m_b_img_controls" style="display: ${s.bannerMode === 'image' ? 'block' : 'none'};">
              <div style="margin-bottom: 6px;"><strong>Images</strong> ${TAG}</div>
              <div class="cb_actions">
                <button id="m_b_up" class="menu_button" ${!key ? 'disabled' : ''}><i class="fa-solid fa-plus"></i> Add</button>
                <button id="m_b_url" class="menu_button" ${!key ? 'disabled' : ''} title="Add an image from a link"><i class="fa-solid fa-link"></i> Link</button>
                <button id="m_b_del" class="menu_button danger_button" ${!n ? 'disabled' : ''}><i class="fa-solid fa-trash-can"></i> Del</button>
              </div>
              <input type="file" id="m_b_file" accept="image/png,image/jpeg,image/gif,image/webp,.png,.jpg,.jpeg,.gif,.webp" multiple hidden>

              ${n > 0 ? `
              <div class="cb_carousel_nav">
                <button id="m_b_prev" class="menu_button" ${n < 2 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>
                <span>Image <b>${Math.round(cNum(r.idx, 0, 0, n - 1)) + 1}</b> of <b>${n}</b></span>
                <button id="m_b_next" class="menu_button" ${n < 2 ? 'disabled' : ''}><i class="fa-solid fa-chevron-right"></i></button>
              </div>
              <div class="cb_thumbs">${r.images.map((im, i) => `<img class="cb_thumb${i === r.idx ? ' active' : ''}" data-i="${i}" src="${escapeHTML(media(im.url))}" alt="">`).join('')}</div>` : `<div style="text-align:center;opacity:0.7;margin-top:8px;">No images yet</div>`}

              ${curImg ? `
              <div class="cb_row" style="margin-top: 10px;"><label>Crop: ${TAG}</label><span><span id="m_b_pval">${cNum(curImg.pos, 45, 0, 100)}</span>%</span></div>
              <input type="range" id="m_b_p" min="0" max="100" value="${cNum(curImg.pos, 45, 0, 100)}">
              ` : ''}
            </div>

            <!-- YouTube Controls -->
            <div id="m_b_yt_controls" style="display: ${s.bannerMode === 'youtube' ? 'block' : 'none'};">
              <label><strong>YouTube Video URL:</strong> ${TAG}</label>
              <input type="text" id="m_b_yt_url" class="text_pole" style="width: 100%; margin-top: 5px;" placeholder="https://youtube.com/watch?v=..." value="${escapeHTML(r.youtubeUrl || '')}" ${!key ? 'disabled' : ''}>
            </div>

            <div class="cb_row" style="margin-top: 15px;"><label>Banner Height:</label><span><span id="m_b_hval">${s.bannerHeight}</span>px</span></div>
            <input type="range" id="m_b_h" min="60" max="350" step="5" value="${s.bannerHeight}">
            <div id="m_b_guide" class="cb_hint" style="margin-top: 4px;">${escapeHTML(bannerGuideText())}</div>

            <div id="m_b_gap_wrapper" style="${r.overlap ? 'opacity: 0.5; pointer-events: none;' : ''}">
              <div class="cb_row" style="margin-top: 10px;"><label>Gap Below Banner:</label><span><span id="m_b_gapval">${s.bannerGap}</span>px</span></div>
              <input type="range" id="m_b_gap" min="0" max="40" step="1" value="${s.bannerGap}">
            </div>

            <div id="m_b_offset_wrapper" style="display: ${r.overlap ? 'block' : 'none'};">
              <div class="cb_row" style="margin-top: 10px;"><label>Overlap Offset (Push Messages Down): ${TAG}</label><span><span id="m_b_oval">${cNum(r.overlapOffset, 0, 0, 300)}</span>px</span></div>
              <input type="range" id="m_b_offset" min="0" max="300" step="5" value="${cNum(r.overlapOffset, 0, 0, 300)}" ${!key ? 'disabled' : ''}>
            </div>

            <div style="margin-top: 10px;"><strong>Transparent areas show:</strong>${pills('bbd', [['wallpaper', 'Wallpaper'], ['panel', 'Chat panel tint']], s.bannerBackdrop === 'panel' ? 'panel' : 'wallpaper')}</div>
          </div>
        </div>

        <div class="cb_section">
          ${secHead('fg', 'fa-image', 'Foreground Images')}
          <div class="cb_collapse_content">
            <label class="checkbox_label" style="margin-bottom: 5px;"><input type="checkbox" id="m_f_enable" ${s.fgEnabled ? 'checked' : ''}><span>Enable Foreground Overlays</span></label>
            <div id="m_f_body" class="${s.fgEnabled ? '' : 'cb_dim'}">
            <div class="cb_row" style="margin-top: 10px;"><label>Opacity:</label><span><span id="m_f_oval">${s.fgOpacity ?? 100}</span>%</span></div>
            <input type="range" id="m_f_o" min="0" max="100" step="1" value="${s.fgOpacity ?? 100}">
            <label class="checkbox_label" style="margin-top: 8px;"><input type="checkbox" id="m_f_hidevn" ${s.fgHideVN ? 'checked' : ''}><span>Hide these in Visual Novel Mode</span></label>
            
            <div style="display: flex; gap: 10px; margin-top: 10px;">
              ${['Left', 'Center', 'Right'].map(pos => `
                <div class="cb_col" style="align-items: center; text-align: center;">
                  <strong>${pos} ${TAG}</strong>
                  <div style="width:100%; height:80px; background:rgba(0,0,0,0.3); border-radius:4px; margin:5px 0; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                    <img id="m_f_img_${pos}" src="${escapeHTML(media(F[pos]))}" style="max-width:100%; max-height:100%; object-fit:contain; display:${F[pos] ? 'block' : 'none'};">
                    <span id="m_f_none_${pos}" style="display:${F[pos] ? 'none' : 'block'}; opacity:0.5; font-size:12px;">Empty</span>
                  </div>
                  <div style="display:flex; gap:5px; width:100%;">
                    <button class="menu_button m_f_up" data-pos="${pos}" style="flex:1; padding:4px;" title="Upload ${pos} image"><i class="fa-solid fa-upload"></i></button>
                    <button class="menu_button m_f_url" data-pos="${pos}" style="flex:1; padding:4px;" title="Use a link for the ${pos} image"><i class="fa-solid fa-link"></i></button>
                    <button class="menu_button danger_button m_f_del" data-pos="${pos}" style="flex:1; padding:4px;" title="Clear ${pos} image" ${!F[pos] ? 'disabled' : ''}><i class="fa-solid fa-trash"></i></button>
                  </div>
                  <div class="cb_row" style="width:100%; margin-top:6px;"><label>Size:</label><span><span id="m_f_s_${pos}val">${cNum(F[pos + 'Scale'], 100, 10, 300)}</span>%</span></div>
                  <input type="range" class="m_f_scale" data-pos="${pos}" min="10" max="300" step="5" value="${cNum(F[pos + 'Scale'], 100, 10, 300)}" style="width:100%;">
                  <div style="width:100%; margin-top:6px; text-align:left;"><small>In Visual Novel Mode, sit:</small>${pills('fgl' + pos, [['behind', 'Behind sprites'], ['front', 'In front']], F[pos + 'Layer'])}</div>
                </div>
              `).join('')}
            </div>
            </div>
            <input type="file" id="m_f_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
          </div>
        </div>

        ${displaySectionHtml(s)}

        <div class="cb_section">
          ${secHead('pfp', 'fa-user-astronaut', 'Pfp Management')}
          <div class="cb_collapse_content">
            <label class="checkbox_label" style="margin-bottom: 5px;"><input type="checkbox" id="m_a_enable" ${s.avatarEnabled ? 'checked' : ''}><span>Enable NTR Avatars</span></label>

            <div id="m_a_body" class="${s.avatarEnabled ? '' : 'cb_dim'}" style="display: flex; gap: 15px; width: 100%;">
              ${getColHtml('ai', 'AI', s)}
              ${getColHtml('us', 'User', s)}
            </div>
          </div>
        </div>

        ${vnSectionHtml(s)}
        ${privacySectionHtml(s)}
        </div>
      </div>
      <div id="ntr_edge" title="Drag to resize"></div>
      <div id="ntr_preview"></div>`;

    document.body.appendChild(overlay);

    bindCollapses(overlay, s);

    setupPanel(overlay, prevScroll);

    const close = () => { popDrag.ai = false; popDrag.us = false; overlay.remove(); syncPopouts(); };
    overlay.querySelector('.cb_close_btn').onclick = close;
    
    onPills(overlay, 'bmode', (v) => {
      s.bannerMode = v;
      save();
      overlay.querySelector('#m_b_img_controls').style.display = v === 'image' ? 'block' : 'none';
      overlay.querySelector('#m_b_yt_controls').style.display = v === 'youtube' ? 'block' : 'none';
      renderAll();
    });

    // Foreground Event Bindings
    overlay.querySelector('#m_f_hidevn').onchange = function() { s.fgHideVN = this.checked; save(); ensureFgLayer(); };
    for (const pos of FG_POS) onPills(overlay, 'fgl' + pos, (val) => { F[pos + 'Layer'] = val; save(); ensureFgLayer(); });
    overlay.querySelector('#m_f_enable').onchange = function() {
      s.fgEnabled = this.checked; save(); ensureFgLayer();
      overlay.querySelector('#m_f_body').classList.toggle('cb_dim', !this.checked);
    };
    
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
        F[pos + 'Scale'] = Number(this.value);
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

    overlay.querySelectorAll('.m_f_url').forEach(btn => {
      btn.onclick = async () => {
        const pos = btn.dataset.pos;
        const url = await askImageUrl(`${pos} foreground image`);
        if (!url) return;
        const old = F[pos];
        F[pos] = url;
        deleteFileIfUnused(old);
        save();
        ensureFgLayer();
        openCombinedModal();
      };
    });

    overlay.querySelectorAll('.m_f_del').forEach(btn => {
      btn.onclick = () => { 
        const pos = btn.dataset.pos;
        const old = F[pos];
        F[pos] = '';
        save();
        ensureFgLayer();
        deleteFileIfUnused(old);
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
        const old = F[pendingFgPos];
        F[pendingFgPos] = '/' + String(j.path).replace(/^\/+/, '');
        deleteFileIfUnused(old);
        
        save();
        ensureFgLayer();
        openCombinedModal();
      } catch (e) {
        console.error('[NTR fg upload]', e);
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
      overlay.querySelector('#m_b_url').onclick = async () => {
        const k = currentKey();
        const url = k ? await askImageUrl('Banner image') : '';
        if (!url) return;
        const rr = rec(k);
        rr.images.push({ url, pos: 45 });
        rr.idx = rr.images.length - 1;
        save(); updateBanner(); openCombinedModal();
      };
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
    bh.oninput = function() { s.bannerHeight = Number(this.value); overlay.querySelector('#m_b_hval').textContent = s.bannerHeight; document.documentElement.style.setProperty('--cb-h', s.bannerHeight + 'px'); overlay.querySelector('#m_b_guide').textContent = bannerGuideText(); };
    bh.onchange = save;
    const bgap = overlay.querySelector('#m_b_gap');
    bgap.oninput = function() { s.bannerGap = Number(this.value); overlay.querySelector('#m_b_gapval').textContent = s.bannerGap; updateAvatarStyle(); };
    bgap.onchange = save;
    onPills(overlay, 'bbd', (v) => { s.bannerBackdrop = v; save(); syncWallpaper(); });

    overlay.querySelector('#m_a_enable').onchange = function() {
      s.avatarEnabled = this.checked; save(); updateAvatarStyle();
      overlay.querySelector('#m_a_body').classList.toggle('cb_dim', !this.checked);
    };
    
    bindThemes(overlay, s);
    bindVNSection(overlay, s);
    bindDisplay(overlay, s);
    overlay.querySelector('#m_x_block').onchange = function() { s.blockExternal = this.checked; save(); refreshVisuals(); openCombinedModal(); };

    const bindCol = (prefix) => {
      const col = overlay.querySelector(`#m_${prefix}_col`);
      const label = prefix === 'ai' ? 'AI' : 'User';

      onPills(col, `${prefix}style`, (v) => {
        s[`${prefix}Style`] = v;
        save();
        col.querySelectorAll('.cb_grp').forEach((g) => { g.style.display = g.dataset.only === v ? 'flex' : 'none'; });
        updateAvatarStyle();
      });
      overlay.querySelector(`#m_${prefix}_on`).onchange = function() {
        s[`${prefix}Enabled`] = this.checked; save(); updateAvatarStyle();
        col.querySelector(`#m_${prefix}_body`).classList.toggle('cb_dim', !this.checked);
      };
      overlay.querySelector(`#m_${prefix}_drag`).onchange = function() { popDrag[prefix] = this.checked; syncPopouts(); };
      overlay.querySelector(`#m_${prefix}_bg`).onchange = function() { s[`${prefix}MsgBg`] = this.checked; save(); updateAvatarStyle(); };
      onPills(col, `${prefix}pos`, (v) => { s[`${prefix}Side`] = v; save(); updateAvatarStyle(); });
      onPills(col, `${prefix}fit`, (v) => { s[`${prefix}Fit`] = v; save(); updateAvatarStyle(); });

      overlay.querySelector(`#m_${prefix}_reset`).onclick = () => {
        if (!confirm(`Reset all ${label} avatar settings to defaults? (Style stays as it is.)`)) return;
        for (const k of Object.keys(DEFAULTS)) {
          if (k.startsWith(prefix) && k !== `${prefix}Style` && k !== `${prefix}Enabled`) s[k] = structuredClone(DEFAULTS[k]);
        }
        save();
        updateAvatarStyle();
        openCombinedModal();
      };
      
      const sliders = [
        { id: 'sc', key: 'Scale' }, { id: 'pad', key: 'Pad' },
        { id: 'tf', key: 'TopFade' }, { id: 'bf', key: 'BotFade' },
        { id: 'lf', key: 'LeftFadePx' }, { id: 'rf', key: 'RightFadePx' },
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

  // ===== Shared UI helpers =====
  function secHead(sec, icon, title) {
    return `
          <h4 class="cb_collapse_toggle" data-sec="${sec}">
            <span><i class="fa-solid ${icon}"></i> ${title}</span>
            <i class="fa-solid fa-chevron-right cb_chevron"></i>
          </h4>`;
  }
  function subHead(sec, title) {
    return `<div class="cb_collapse_toggle cb_subhead" data-sec="${sec}"><span>${title}</span><i class="fa-solid fa-chevron-right cb_chevron"></i></div>`;
  }
  function pills(name, opts, cur) {
    return `<div class="cb_pills">${opts.map(([v, l]) => `<label class="cb_pill"><input type="radio" name="cbr_${name}" value="${escapeHTML(v)}" ${v === cur ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>`;
  }
  function posGrid(name, cur) {
    const P = [['tl', 'Top Left'], ['tc', 'Top Center'], ['tr', 'Top Right'], ['cl', 'Center Left'], ['cc', 'Center'], ['cr', 'Center Right'], ['bl', 'Bottom Left'], ['bc', 'Bottom Center'], ['br', 'Bottom Right']];
    return `<div class="cb_posgrid">${P.map(([v, l]) => `<label title="${l}"><input type="radio" name="cbr_${name}" value="${v}" ${v === cur ? 'checked' : ''}></label>`).join('')}</div>`;
  }
  function onPills(root, name, fn) {
    root.querySelectorAll(`input[name="cbr_${name}"]`).forEach((r) => { r.onchange = () => { if (r.checked) fn(r.value); }; });
  }
  function bindCollapses(overlay, s) {
    overlay.querySelectorAll('.cb_collapse_toggle[data-sec]').forEach((h) => {
      const sec = h.dataset.sec;
      const content = h.nextElementSibling;
      const icon = h.querySelector('.cb_chevron');
      const apply = (open) => {
        content.style.display = open ? 'block' : 'none';
        icon.classList.toggle('fa-chevron-down', open);
        icon.classList.toggle('fa-chevron-right', !open);
      };
      apply(!!s.uiOpen[sec]);
      h.addEventListener('click', () => {
        const open = content.style.display === 'none';
        s.uiOpen[sec] = open;
        save();
        apply(open);
      });
    });
  }

  // ===== Display Overrides =====
  const CHAT_CLS = { flat: 'flatchat', bubbles: 'bubblechat', document: 'documentstyle' };
  const AV_CLS = { round: '', rectangle: 'big-avatars', square: 'square-avatars', rounded: 'rounded-avatars' };
  const ALL_CHAT = ['flatchat', 'bubblechat', 'documentstyle'];
  const ALL_AV = ['big-avatars', 'square-avatars', 'rounded-avatars'];
  const bodyTouched = { chat: false, av: false };
  let bodySnap = null, bodyObs = null;

  function setBodyClasses(all, want) {
    const b = document.body;
    for (const c of all) {
      const on = want.includes(c);
      if (b.classList.contains(c) !== on) b.classList.toggle(c, on);
    }
  }

  function applyBodyOverrides() {
    const s = settings();
    const b = document.body;
    if (!b) return;
    if (!bodySnap) bodySnap = { chat: ALL_CHAT.filter((c) => b.classList.contains(c)), av: ALL_AV.filter((c) => b.classList.contains(c)) };
    const p = ctx().powerUserSettings;
    const stChat = p && p.chat_display !== undefined ? [ALL_CHAT[Number(p.chat_display)]].filter(Boolean) : bodySnap.chat;
    const stAv = p && p.avatar_style !== undefined ? [['', ...ALL_AV][Number(p.avatar_style)]].filter(Boolean) : bodySnap.av;

    if (isOn() && s.ovChatStyleOn) { setBodyClasses(ALL_CHAT, [CHAT_CLS[s.ovChatStyle]]); bodyTouched.chat = true; }
    else if (bodyTouched.chat) { setBodyClasses(ALL_CHAT, stChat); bodyTouched.chat = false; }

    if (isOn() && s.ovAvatarOn) { setBodyClasses(ALL_AV, [AV_CLS[s.ovAvatar]].filter(Boolean)); bodyTouched.av = true; }
    else if (bodyTouched.av) { setBodyClasses(ALL_AV, stAv); bodyTouched.av = false; }

    if (!bodyObs && window.MutationObserver) {
      bodyObs = new MutationObserver(() => {
        const st = settings();
        if (isOn() && (st.ovChatStyleOn || st.ovAvatarOn)) applyBodyOverrides();
      });
      bodyObs.observe(b, { attributes: true, attributeFilter: ['class'] });
    }
  }

  function overrideCss(s) {
    let v = '';
    if (s.ovWidthOn) v += `--sheldWidth: ${s.ovWidth}vw !important; `;
    if (s.ovFontOn) v += `--fontScale: ${s.ovFont} !important; `;
    if (s.ovBlurOn) v += `--blurStrength: ${s.ovBlur} !important; `;
    if (s.ovShadowOn) v += `--shadowWidth: ${s.ovShadow} !important; `;
    return v ? `\n      :root { ${v}}\n` : '';
  }

  function displaySectionHtml(s) {
    const row = (onKey, label, inner) => `
      <div class="cb_ovrow">
        <label class="checkbox_label"><input type="checkbox" class="m_o_on" data-key="${onKey}" ${s[onKey] ? 'checked' : ''}><span>Override ${label}</span></label>
        <div class="m_o_body ${s[onKey] ? '' : 'cb_dim'}" data-for="${onKey}">${inner}</div>
      </div>`;
    const sl = (key, unit, min, max, step) => `
      <div class="cb_row"><input type="range" class="m_o_sl" data-key="${key}" min="${min}" max="${max}" step="${step}" value="${s[key]}" style="flex:1;"><span style="min-width:60px;text-align:right;"><span id="m_o_${key}val">${s[key]}</span>${unit}</span></div>`;
    return `
      <div class="cb_section">
        ${secHead('display', 'fa-display', 'Display Overrides')}
        <div class="cb_collapse_content">
          <div class="cb_hint">Changes how SillyTavern looks without touching its own settings. Untick an override to go back to ST's value.</div>
          <label class="checkbox_label" style="margin-bottom:6px;"><input type="checkbox" id="m_f_trans" ${s.chatTransparent ? 'checked' : ''}><span>Make Chat Panel Transparent</span></label>
          ${row('ovWidthOn', 'Chat Width', sl('ovWidth', 'vw', 25, 100, 1))}
          ${row('ovFontOn', 'Font Scale', sl('ovFont', 'x', 0.5, 2, 0.05))}
          ${row('ovBlurOn', 'Blur Strength', sl('ovBlur', '', 0, 30, 1))}
          ${row('ovShadowOn', 'Shadow Width', sl('ovShadow', '', 0, 5, 1))}
          ${row('ovChatStyleOn', 'Chat Style', pills('ochat', [['flat', 'Flat'], ['bubbles', 'Bubbles'], ['document', 'Document']], s.ovChatStyle))}
          ${row('ovAvatarOn', 'Avatar Shape', pills('oavatar', [['round', 'Round'], ['rectangle', 'Rectangle'], ['square', 'Square'], ['rounded', 'Rounded']], s.ovAvatar)
            + '<div class="cb_hint" style="margin-top:6px;">Shapes the normal chat avatars. When NTR Avatars is on, those replace the chat avatars, so this has nothing to shape.</div>')}
        </div>
      </div>`;
  }

  function privacySectionHtml(s) {
    return `
      <div class="cb_section">
        ${secHead('privacy', 'fa-shield-halved', 'Privacy')}
        <div class="cb_collapse_content">
          <label class="checkbox_label"><input type="checkbox" id="m_x_block" ${s.blockExternal ? 'checked' : ''}><span>Block card images and videos hosted on other websites</span></label>
          <div class="cb_hint">A shared card can link its art to someone else's server, which tells that server your IP address and when you opened the chat. With this on, only files stored on your own SillyTavern load. YouTube banners and openings still play. Nothing is removed from the card, so switching it back off restores everything.</div>
        </div>
      </div>`;
  }

  function bindDisplay(overlay, s) {
    overlay.querySelector('#m_f_trans').onchange = function() { s.chatTransparent = this.checked; save(); updateAvatarStyle(); };
    overlay.querySelectorAll('.m_o_on').forEach((c) => {
      c.onchange = () => {
        s[c.dataset.key] = c.checked;
        save();
        overlay.querySelector(`.m_o_body[data-for="${c.dataset.key}"]`).classList.toggle('cb_dim', !c.checked);
        updateAvatarStyle();
      };
    });
    overlay.querySelectorAll('.m_o_sl').forEach((sl) => {
      sl.oninput = () => {
        s[sl.dataset.key] = Number(sl.value);
        overlay.querySelector(`#m_o_${sl.dataset.key}val`).textContent = sl.value;
        updateAvatarStyle();
      };
      sl.onchange = save;
    });
    onPills(overlay, 'ochat', (v) => { s.ovChatStyle = v; save(); updateAvatarStyle(); });
    onPills(overlay, 'oavatar', (v) => { s.ovAvatar = v; save(); updateAvatarStyle(); });
  }

  // ===== Per-character storage (kept inside the character card) =====
  const cardSnap = new Map();
  const cardTimers = new Map();
  const legacyMoved = new Set();
  const defaultBanner = () => ({ images: [], idx: 0, locked: true, overlap: false, overlapOffset: 0, youtubeUrl: '' });

  function charIndexByAvatar(av) {
    const cs = ctx().characters || [];
    return cs.findIndex((c) => c && c.avatar === av);
  }

  // ===== Card data cleanup =====
  // Character cards get shared, so their NTR data is untrusted: every field is forced to the
  // type and range the extension expects before anything reads it. Unknown keys are left alone.
  const cleaned = new WeakSet();
  const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
  const cNum = (v, d, lo, hi) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
  const cBool = (v, d) => (typeof v === 'boolean' ? v : d);
  const cStr = (v, max = 200) => (typeof v === 'string' ? v.slice(0, max) : '');
  const cPick = (v, opts) => (opts.includes(v) ? v : opts[0]);
  const cId = (v, p) => (typeof v === 'string' && /^[\w-]{1,64}$/.test(v) ? v : newId(p));
  const cRef = (v) => (typeof v === 'string' && /^[\w-]{1,64}$/.test(v) ? v : '');
  const MEDIA_DATA = /^data:(?:image\/(?:png|jpeg|gif|webp)|video\/(?:mp4|webm));base64,[A-Za-z0-9+/=\s]+$/;
  function cUrl(v) {
    if (typeof v !== 'string') return '';
    const u = v.trim();
    if (!u) return '';
    if (u.startsWith('data:')) return MEDIA_DATA.test(u) ? u : '';
    if (u.length > 2048 || /[\u0000-\u001f"'<>\\`]/.test(u)) return '';
    let dec = u;
    try { dec = decodeURIComponent(u); } catch (e) {}
    if (/(^|[/\\])\.\.([/\\]|$)/.test(dec)) return '';
    if (u.startsWith('/') && !u.startsWith('//')) return u;
    return /^https?:\/\/[^/\s]/i.test(u) ? u : '';
  }
  function cUrlMap(v) {
    const out = Object.create(null);
    if (!isObj(v)) return out;
    for (const k of Object.keys(v).slice(0, 500)) { const u = cUrl(v[k]); if (u && k.length <= 200) out[k] = u; }
    return out;
  }
  const cList = (v, max, fn) => (Array.isArray(v) ? v.filter(isObj).slice(0, max).map(fn) : []);
  const cNamed = (x, p) => ({ ...x, id: cId(x.id, p), name: cStr(x.name), url: cUrl(x.url) });

  function cleanBanner(b) {
    const images = cList(b.images, 200, (im) => ({ ...im, url: cUrl(im.url), pos: cNum(im.pos, 45, 0, 100) })).filter((im) => im.url);
    Object.assign(b, {
      images,
      idx: Math.round(cNum(b.idx, 0, 0, Math.max(0, images.length - 1))),
      locked: cBool(b.locked, true),
      overlap: cBool(b.overlap, false),
      overlapOffset: cNum(b.overlapOffset, 0, 0, 300),
      youtubeUrl: cStr(b.youtubeUrl, 500),
    });
  }

  function cleanFg(f) {
    for (const p of FG_POS) {
      f[p] = cUrl(f[p]);
      f[p + 'Scale'] = cNum(f[p + 'Scale'], 100, 10, 300);
      f[p + 'Layer'] = cPick(f[p + 'Layer'], ['behind', 'front']);
    }
  }

  function cleanVn(v) {
    v.avatars = cUrlMap(v.avatars);
    v.sprites = cUrlMap(v.sprites);
    const emo = Object.create(null);
    if (isObj(v.emoImgs)) for (const k of Object.keys(v.emoImgs).slice(0, 500)) if (k.length <= 200) emo[k] = cUrlMap(v.emoImgs[k]);
    v.emoImgs = emo;
    v.customSpk = Array.isArray(v.customSpk) ? v.customSpk.filter((n) => typeof n === 'string' && n.trim()).slice(0, 200).map((n) => n.slice(0, 200)) : [];
    v.hiddenSpk = Array.isArray(v.hiddenSpk) ? v.hiddenSpk.filter((n) => typeof n === 'string' && n.trim()).slice(0, 200).map((n) => n.slice(0, 200)) : [];
    v.locations = cList(v.locations, 500, (l) => cNamed(l, 'loc'));
    v.locDefault = cUrl(v.locDefault);
    v.cgs = cList(v.cgs, 500, (g) => cNamed(g, 'cg'));
    v.maps = cList(v.maps, 100, (m) => ({
      ...cNamed(m, 'map'),
      pins: cList(m.pins, 500, (p) => ({ ...p, id: cId(p.id, 'pin'), x: cNum(p.x, 0, 0, 1), y: cNum(p.y, 0, 0, 1), loc: cRef(p.loc), map: cRef(p.map) })),
    }));
    v.mapRoot = cRef(v.mapRoot);
    if ('opening' in v) {
      const o = isObj(v.opening) ? v.opening : {};
      v.opening = {
        ...o,
        src: cPick(o.src, ['off', 'youtube', 'file']),
        yt: cStr(o.yt, 500),
        file: cUrl(o.file),
        title: cBool(o.title, false),
        logo: cPick(o.logo, ['banner', 'upload', 'none']),
        logoUrl: cUrl(o.logoUrl),
        when: cPick(o.when, ['newchat', 'open', 'vn']),
      };
    }
  }

  function cleanStore(st) {
    if (!isObj(st) || cleaned.has(st)) return st;
    cleaned.add(st);
    for (const [k, fn] of [['banner', cleanBanner], ['fg', cleanFg], ['vn', cleanVn]]) {
      if (!(k in st)) continue;
      if (isObj(st[k])) fn(st[k]); else delete st[k];
    }
    return st;
  }

  // Optional privacy guard: card images and videos hosted on other websites don't load.
  const isExternal = (u) => /^(https?:)?\/\//i.test(String(u || '').trim());
  function media(u) {
    const v = typeof u === 'string' ? u : '';
    return settings().blockExternal && isExternal(v) ? '' : v;
  }

  function cardData(key) {
    const c = ctx();
    if (!key || typeof c.writeExtensionField !== 'function') return null;
    const i = charIndexByAvatar(key);
    const ch = i >= 0 ? c.characters[i] : null;
    if (!ch || !ch.data) return null;
    if (!ch.data.extensions || typeof ch.data.extensions !== 'object') ch.data.extensions = {};
    let d = cleanStore(ch.data.extensions.ntr);
    if (!cardSnap.has(key)) cardSnap.set(key, d && typeof d === 'object' ? JSON.stringify(d) : '');
    if (!d || typeof d !== 'object') { d = { v: 1 }; ch.data.extensions.ntr = d; }
    return d;
  }

  function cardIsEmpty(d) {
    const b = d.banner;
    const bannerEmpty = !b || (!(b.images || []).length && b.locked !== false && !b.overlap && !b.overlapOffset && !b.youtubeUrl);
    const vn = d.vn || {};
    return bannerEmpty && !collectFileRefs(d.fg).size && !collectFileRefs(vn).size && !(vn.customSpk || []).length && !(vn.locations || []).length
      && !(vn.cgs || []).length && !(vn.maps || []).length && !(vn.opening && vn.opening.yt);
  }

  const FG_POS = ['Left', 'Center', 'Right'];
  const FG_DEF = () => ({ Left: '', Center: '', Right: '', LeftScale: 100, CenterScale: 100, RightScale: 100, LeftLayer: 'behind', CenterLayer: 'behind', RightLayer: 'behind' });

  // Before 2.1 foreground images and VN portraits were shared by every chat. They move into the
  // first single-character chat opened after updating (a copy is kept in legacyBackup, just in case).
  function legacyMigrate(st) {
    const s = settings();
    if (s.legacyMigrated) return;
    const fgHas = FG_POS.some((p) => s['fg' + p]);
    const vnHas = Object.keys(s.nodeAvatars || {}).length || Object.keys(s.nodeEmoImgs || {}).length || (s.nodeCustomSpk || []).length;
    if (fgHas || vnHas) {
      s.legacyBackup = {
        fg: Object.fromEntries(FG_POS.flatMap((p) => [[p, s['fg' + p]], [p + 'Scale', s['fg' + p + 'Scale']]])),
        vn: { avatars: s.nodeAvatars, emoImgs: s.nodeEmoImgs, customSpk: s.nodeCustomSpk },
      };
    }
    if (fgHas) {
      st.fg = Object.assign(FG_DEF(), st.fg || {});
      for (const p of FG_POS) {
        if (s['fg' + p] && !st.fg[p]) st.fg[p] = s['fg' + p];
        st.fg[p + 'Scale'] = s['fg' + p + 'Scale'] ?? 100;
      }
    }
    if (vnHas) {
      st.vn = st.vn || {};
      st.vn.avatars = { ...(s.nodeAvatars || {}), ...(st.vn.avatars || {}) };
      st.vn.emoImgs = { ...(s.nodeEmoImgs || {}), ...(st.vn.emoImgs || {}) };
      st.vn.customSpk = [...new Set([...(st.vn.customSpk || []), ...(s.nodeCustomSpk || [])])];
    }
    for (const p of FG_POS) s['fg' + p] = '';
    s.nodeAvatars = {};
    s.nodeEmoImgs = {};
    s.nodeCustomSpk = [];
    s.legacyMigrated = true;
    save();
  }

  // Per-chat storage: the character card for single chats, the extension settings for groups.
  function store() {
    const c = ctx();
    const s = settings();
    if (c.groupId) {
      if (!s.groupData[c.groupId]) s.groupData[c.groupId] = {};
      return cleanStore(s.groupData[c.groupId]);
    }
    const key = currentKey();
    if (!key) return null;
    let st = cardData(key);
    if (!st) {
      if (!s.charData[key]) s.charData[key] = {};
      st = cleanStore(s.charData[key]);
    }
    legacyMigrate(st);
    return st;
  }

  function fgData() {
    const st = store();
    if (!st) return FG_DEF();
    if (!st.fg || typeof st.fg !== 'object') st.fg = FG_DEF();
    const def = FG_DEF();
    for (const k of Object.keys(def)) if (st.fg[k] === undefined) st.fg[k] = def[k];
    return st.fg;
  }

  function scheduleCardFlush(key) {
    clearTimeout(cardTimers.get(key));
    cardTimers.set(key, setTimeout(() => { cardTimers.delete(key); flushCard(key); }, 700));
  }

  async function flushCard(key) {
    const c = ctx();
    const i = charIndexByAvatar(key);
    const d = i >= 0 ? c.characters[i]?.data?.extensions?.ntr : null;
    if (!d) return;
    const json = JSON.stringify(d);
    const before = cardSnap.get(key) ?? '';
    if (json === before) return;
    if (before === '' && !legacyMoved.has(key) && cardIsEmpty(d)) return;
    try {
      await c.writeExtensionField(i, 'ntr', d);
      cardSnap.set(key, json);
      if (legacyMoved.has(key)) {
        legacyMoved.delete(key);
        delete settings().chars[key];
        c.saveSettingsDebounced();
      }
    } catch (e) {
      console.error('[NTR] Could not save character data to the card', e);
    }
  }

  // ===== File cleanup =====
  function normFile(p) {
    const t = String(p || '').trim().replace(/^https?:\/\/[^/]+/, '').replace(/^\/+/, '');
    return t.startsWith('user/files/') ? t : null;
  }

  function collectFileRefs(obj, out = new Set(), seen = new Set()) {
    if (obj == null) return out;
    if (typeof obj === 'string') { const n = normFile(obj); if (n) out.add(n); return out; }
    if (typeof obj !== 'object' || seen.has(obj)) return out;
    seen.add(obj);
    for (const v of Array.isArray(obj) ? obj : Object.values(obj)) collectFileRefs(v, out, seen);
    return out;
  }

  // Every character's card counts, so a file shared by two cards is never deleted out from under one.
  // The pre-2.1 migration backup doesn't count, or files from back then could never be deleted.
  function filesInUse() {
    const s = settings();
    const set = collectFileRefs(s, new Set(), new Set(s.legacyBackup ? [s.legacyBackup] : []));
    for (const ch of ctx().characters || []) collectFileRefs(ch?.data?.extensions?.ntr, set);
    return set;
  }

  // Only files this extension uploaded itself (see the upload name prefixes) can ever be deleted.
  const OWN_FILE = /^user\/files\/(?:banner|fg|ntr|theme|vnpfp|vnloc|vncg|vnart|vnmap|vnlogo|vnop)_[\w-]+\.(?:png|jpe?g|gif|webp|mp4|webm)$/;

  async function deleteFileIfUnused(path) {
    const p = normFile(path);
    if (!p || !OWN_FILE.test(p) || filesInUse().has(p)) return false;
    try {
      const res = await fetch('/api/files/delete', { method: 'POST', headers: ctx().getRequestHeaders(), body: JSON.stringify({ path: p }) });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  // ===== Themes =====
  const PFP_KEYS = Object.keys(DEFAULTS).filter((k) => k.startsWith('ai') || k.startsWith('us'));
  const LOOK = {
    banner: { label: 'Banner look (height, gap, transparent areas)', keys: ['bannerHeight', 'bannerGap', 'bannerBackdrop'] },
    pfp: { label: 'Pfp Management', keys: ['avatarEnabled', ...PFP_KEYS] },
    fg: { label: 'Foreground look (opacity, hide in Visual Novel)', keys: ['fgOpacity', 'fgHideVN'] },
    vn: { label: 'Visual Novel (box, playback, emotions, tags, art kit, logo)', keys: ['nodeBoxWidth', 'nodeBoxMinH', 'nodeBoxMaxH', 'nodeBoxLift', 'nodeTextScale', 'nodeSprites', 'nodePortraitBox', 'nodeSpriteScale', 'nodeSpriteBase', 'nodeInject', 'locWord', 'nodeTypewriter', 'nodeSpeed', 'nodeAuto', 'nodeAutoDelay', 'nodeOpacity', 'nodePortrait', 'nodeShape', 'nodeUserMsgs', 'nodePicker', 'nodeHideEmo', 'emotions', 'emoDefault', 'delimSpkOpen', 'delimSpkClose', 'delimNarOpen', 'delimNarClose', 'delimEmo', 'narratorWord',
      'nodeSplitUntagged', 'nodeChoices', 'choiceSend', 'choiceWord', 'choiceSep', 'nodeEffects', 'effectWord', 'fxShake', 'fxFlash', 'fxFade',
      'weatherWord', 'wxRain', 'wxSnow', 'wxClear', 'nodeCG', 'nodeAutoSpk', 'cgWord', 'enterWord', 'exitWord', 'artBg', 'artBgImg', 'artSprite', 'artSpriteImg',
      'opLead', 'opFade', 'opSize', 'opPos', 'opHold', 'opExit', 'opTrans', 'opTransColor', 'opTransMs', 'opEarly', 'nodeMaps', 'mapGoText'] },
    display: { label: 'Display Overrides', keys: ['chatTransparent', ...Object.keys(DEFAULTS).filter((k) => k.startsWith('ov'))] },
  };
  const newId = (p) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const readText = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsText(f); });

  function lookSnapshot(secs = Object.keys(LOOK)) {
    const s = settings();
    const out = {};
    for (const sec of secs) {
      out[sec] = {};
      for (const k of LOOK[sec].keys) out[sec][k] = structuredClone(s[k]);
    }
    return out;
  }

  const NONEMPTY_KEYS = new Set(['narratorWord', 'locWord', 'choiceWord', 'choiceSep', 'effectWord', 'fxShake', 'fxFlash', 'fxFade', 'weatherWord', 'wxRain', 'wxSnow', 'wxClear', 'cgWord', 'enterWord', 'exitWord', 'mapGoText']);
  const IMG_KEYS = new Set(['artBgImg', 'artSpriteImg']);
  function validLookValue(k, v) {
    const d = DEFAULTS[k];
    if (IMG_KEYS.has(k)) return typeof v === 'string' && (v === '' || /^\/[^"<>]*$/.test(v) || /^data:image\/(png|jpeg|gif|webp);base64,/.test(v));
    if (k === 'emotions') return Array.isArray(v) && v.length > 0 && v.every((e) => e && typeof e.id === 'string' && typeof e.name === 'string' && e.name.trim());
    if (typeof d === 'number') return typeof v === 'number' && Number.isFinite(v);
    if (typeof d === 'boolean') return typeof v === 'boolean';
    if (typeof d === 'string') return typeof v === 'string' && ((!k.startsWith('delim') && !NONEMPTY_KEYS.has(k)) || v.trim() !== '');
    return false;
  }

  function cleanLookSection(sec, part) {
    const out = {};
    if (!part || typeof part !== 'object') return out;
    for (const k of LOOK[sec].keys) if (k in part && validLookValue(k, part[k])) out[k] = structuredClone(part[k]);
    if (sec === 'pfp') {
      for (const p of ['ai', 'us']) {
        for (const k of ['LeftFade', 'RightFade']) {
          if (p + k in out && !(p + k + 'Px' in out)) out[p + k + 'Px'] = pctFadeToPx(out[p + k], out[p + 'Scale'] ?? settings()[p + 'Scale']);
        }
      }
    }
    return out;
  }

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

  function refreshVisuals() {
    document.documentElement.style.setProperty('--cb-h', settings().bannerHeight + 'px');
    renderAll();
    syncPopouts();
    syncWallpaper();
    window.NTR.vn?.refresh();
  }

  function applyLook(data) {
    const s = settings();
    const before = collectFileRefs(lookSnapshot());
    for (const sec of Object.keys(LOOK)) Object.assign(s, cleanLookSection(sec, data && data[sec]));
    settings();
    save();
    refreshVisuals();
    before.forEach((p) => deleteFileIfUnused(p));
  }

  // Theme files can carry their images inline (base64), so they work on another install.
  const MIME_EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp', 'video/mp4': 'mp4', 'video/webm': 'webm' };
  async function uploadDataUrl(dataUrl, prefix = 'ntr') {
    const m = /^data:([\w/+.-]+);base64,(.+)$/s.exec(String(dataUrl || ''));
    if (!m || !MIME_EXT[m[1]]) throw new Error('Unsupported embedded file');
    const name = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${MIME_EXT[m[1]]}`;
    const res = await fetch('/api/files/upload', { method: 'POST', headers: ctx().getRequestHeaders(), body: JSON.stringify({ name, data: m[2] }) });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    const j = await res.json();
    return '/' + String(j.path).replace(/^\/+/, '');
  }

  async function mapStrings(obj, fn) {
    const out = structuredClone(obj);
    const walk = async (o) => {
      for (const k of Object.keys(o)) {
        const v = o[k];
        if (typeof v === 'string') o[k] = await fn(v);
        else if (v && typeof v === 'object') await walk(v);
      }
    };
    await walk(out);
    return out;
  }

  async function embedFiles(obj) {
    const cache = new Map();
    let fails = 0;
    const data = await mapStrings(obj, async (v) => {
      const p = normFile(v);
      if (!p) return v;
      if (!cache.has(p)) {
        try {
          const r = await fetch('/' + p);
          if (!r.ok) throw new Error(String(r.status));
          cache.set(p, await readDataURL(await r.blob()));
        } catch (e) { cache.set(p, null); fails++; }
      }
      return cache.get(p) || v;
    });
    return { data, fails };
  }

  const hasEmbedded = (obj) => JSON.stringify(obj || {}).includes(';base64,');
  async function unpackFiles(obj) {
    let fails = 0;
    const data = await mapStrings(obj, async (v) => {
      if (!/^data:[\w/+.-]+;base64,/.test(v)) return v;
      try { return await uploadDataUrl(v, 'theme'); } catch (e) { fails++; return ''; }
    });
    return { data, fails };
  }

  function themesSectionHtml(s) {
    const list = s.themes.length
      ? pills('theme', s.themes.map((t) => [t.id, escapeHTML(t.name)]), s.themeActive || '')
      : '<div class="cb_hint">No saved themes yet. Save your current look to start one.</div>';
    const b = (id, icon, title, extra = '') => `<button class="menu_button ${extra}" id="${id}" title="${title}"><i class="fa-solid ${icon}"></i></button>`;
    return `
      <div class="cb_section">
        ${secHead('themes', 'fa-palette', 'Themes')}
        <div class="cb_collapse_content">
          <div class="cb_hint">A theme holds your look: Pfp styling, banner height and gap, the Visual Novel box, tags and default art, and display overrides. Character content like banner images is never part of a theme. Click a theme to apply it.</div>
          ${list}
          <div class="ntr_tbar">
            ${b('m_t_new', 'fa-plus', 'Save current look as a new theme')}
            ${b('m_t_upd', 'fa-floppy-disk', 'Save current look over the selected theme')}
            ${b('m_t_ren', 'fa-pen', 'Rename the selected theme')}
            ${b('m_t_del', 'fa-trash', 'Delete the selected theme', 'danger_button')}
            ${b('m_t_imp', 'fa-file-import', 'Import a theme file')}
            ${b('m_t_exp', 'fa-file-export', 'Export the selected theme (or your current look)')}
            ${b('m_t_rst', 'fa-rotate-left', 'Reset your look to defaults')}
          </div>
          <div id="m_t_panel"></div>
          <input type="file" id="m_t_file" accept=".json,application/json" hidden>
        </div>
      </div>`;
  }

  function bindThemes(overlay, s) {
    const panel = overlay.querySelector('#m_t_panel');
    const active = () => s.themes.find((t) => t.id === s.themeActive) || null;
    const need = () => { const t = active(); if (!t) toastr.info('Pick a theme in the list first.', 'Themes'); return t; };
    const nameTaken = (name, self) => s.themes.some((t) => t !== self && t.name.toLowerCase() === name.toLowerCase());
    const secBoxes = (secs) => secs.map((k) => `<label class="checkbox_label"><input type="checkbox" class="m_t_sec" value="${k}" checked><span>${LOOK[k].label}</span></label>`).join('');

    onPills(overlay, 'theme', (id) => {
      const t = s.themes.find((x) => x.id === id);
      if (!t) return;
      const cur = active();
      if ((!cur || !lookMatches(cur.data)) && !confirm(`Apply "${t.name}"? Your current look isn't saved as a theme and will be replaced.`)) { openCombinedModal(); return; }
      s.themeActive = id;
      applyLook(t.data);
      openCombinedModal();
    });

    overlay.querySelector('#m_t_new').onclick = () => {
      const name = (prompt('Name for this theme:', `Theme ${s.themes.length + 1}`) || '').trim();
      if (!name) return;
      if (nameTaken(name)) { toastr.warning('A theme with that name already exists.', 'Themes'); return; }
      const t = { id: newId('th'), name, data: lookSnapshot() };
      s.themes.push(t);
      s.themeActive = t.id;
      save();
      openCombinedModal();
      toastr.success(`Saved "${name}"`, 'Themes');
    };

    overlay.querySelector('#m_t_upd').onclick = () => {
      const t = need();
      if (!t || !confirm(`Save your current look over "${t.name}"?`)) return;
      const oldRefs = collectFileRefs(t.data);
      t.data = lookSnapshot();
      save();
      oldRefs.forEach((p) => deleteFileIfUnused(p));
      openCombinedModal();
      toastr.success(`Updated "${t.name}"`, 'Themes');
    };

    overlay.querySelector('#m_t_ren').onclick = () => {
      const t = need();
      if (!t) return;
      const name = (prompt('New name:', t.name) || '').trim();
      if (!name || name === t.name) return;
      if (nameTaken(name, t)) { toastr.warning('A theme with that name already exists.', 'Themes'); return; }
      t.name = name;
      save();
      openCombinedModal();
    };

    overlay.querySelector('#m_t_del').onclick = () => {
      const t = need();
      if (!t || !confirm(`Delete the theme "${t.name}"? Your current look stays as it is.`)) return;
      const refs = collectFileRefs(t.data);
      s.themes = s.themes.filter((x) => x !== t);
      s.themeActive = null;
      save();
      refs.forEach((p) => deleteFileIfUnused(p));
      openCombinedModal();
    };

    overlay.querySelector('#m_t_rst').onclick = () => {
      if (!confirm('Reset your look to the defaults? Saved themes and character content stay as they are.')) return;
      const oldRefs = collectFileRefs(lookSnapshot());
      for (const sec of Object.keys(LOOK)) for (const k of LOOK[sec].keys) s[k] = structuredClone(DEFAULTS[k]);
      s.themeActive = null;
      settings();
      save();
      refreshVisuals();
      oldRefs.forEach((p) => deleteFileIfUnused(p));
      openCombinedModal();
    };

    overlay.querySelector('#m_t_exp').onclick = () => {
      const t = active();
      const data = t ? t.data : lookSnapshot();
      const name = t ? t.name : 'My look';
      const secs = Object.keys(LOOK).filter((k) => data[k]);
      const nImg = collectFileRefs(data).size;
      panel.innerHTML = `
        <div class="ntr_tpanel">
          <strong>Export "${escapeHTML(name)}"</strong>
          ${secBoxes(secs)}
          ${nImg ? `<label class="checkbox_label" style="margin-top:4px;"><input type="checkbox" id="m_t_img" checked><span>Include images (${nImg}) so the theme works on other installs</span></label>` : ''}
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
          if (r.fails) toastr.warning(`${r.fails} image(s) couldn't be read and were left as links.`, 'Themes');
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
      const secs = Object.keys(LOOK).filter((k) => Object.keys(cleanLookSection(k, j.sections[k])).length);
      if (!secs.length) { toastr.error('That theme file has nothing this version can use.', 'Themes'); return; }
      panel.innerHTML = `
        <div class="ntr_tpanel">
          <strong>Import theme</strong>
          <label>Name <input type="text" id="m_t_iname" class="text_pole" value="${escapeHTML(String(j.name || 'Imported theme'))}"></label>
          <div class="cb_hint">Sections in this file. Untick any you don't want.</div>
          ${secBoxes(secs)}
          <div class="cb_actions">
            <button class="menu_button" id="m_t_add"><i class="fa-solid fa-plus"></i> Add theme</button>
            <button class="menu_button" id="m_t_cancel">Cancel</button>
          </div>
        </div>`;
      panel.querySelector('#m_t_cancel').onclick = () => { panel.innerHTML = ''; };
      panel.querySelector('#m_t_add').onclick = async () => {
        const chosen = [...panel.querySelectorAll('.m_t_sec:checked')].map((c) => c.value);
        if (!chosen.length) { toastr.warning('Tick at least one section.', 'Themes'); return; }
        let name = panel.querySelector('#m_t_iname').value.trim() || 'Imported theme';
        const base = name;
        for (let n = 2; nameTaken(name); n++) name = `${base} (${n})`;
        let data = Object.fromEntries(chosen.map((k) => [k, cleanLookSection(k, j.sections[k])]));
        if (hasEmbedded(data)) {
          toastr.info('Uploading the theme\'s images...', 'Themes');
          const r = await unpackFiles(data);
          data = r.data;
          if (r.fails) toastr.warning(`${r.fails} image(s) couldn't be uploaded.`, 'Themes');
        }
        s.themes.push({ id: newId('th'), name, data });
        save();
        openCombinedModal();
        toastr.success(`Added "${name}". Click it in the list to apply it.`, 'Themes');
      };
    };
  }

  // ===== Floating, dockable menu panel =====
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const isNarrow = () => window.innerWidth < 700;

  function panelLayout(overlay) {
    const content = overlay.querySelector('.cb_popup_content');
    const edge = overlay.querySelector('#ntr_edge');
    if (!content || !edge) return;
    const P = settings().uiPanel;
    content.classList.remove('ntr_dock_left', 'ntr_dock_right', 'ntr_float', 'ntr_sheet');
    Object.assign(content.style, { left: '', right: '', top: '', bottom: '', width: '', height: '' });
    edge.style.display = 'none';
    overlay.querySelectorAll('.ntr_dockbtn').forEach((b) => {
      b.style.display = isNarrow() ? 'none' : '';
      b.classList.toggle('on', b.dataset.dock === P.dock);
    });
    if (isNarrow()) { content.classList.add('ntr_sheet'); return; }
    const maxW = Math.round(window.innerWidth * 0.9);
    if (P.dock === 'left' || P.dock === 'right') {
      const w = clamp(P.w || 440, 320, maxW);
      content.classList.add('ntr_dock_' + P.dock);
      content.style.width = w + 'px';
      edge.style.display = 'block';
      edge.style.left = (P.dock === 'right' ? window.innerWidth - w - 4 : w - 4) + 'px';
    } else {
      const w = clamp(P.fw || 560, 320, maxW);
      const h = clamp(P.fh || Math.round(window.innerHeight * 0.75), 240, window.innerHeight);
      const x = clamp(P.x ?? Math.round((window.innerWidth - w) / 2), 80 - w, window.innerWidth - 80);
      const y = clamp(P.y ?? 60, 0, window.innerHeight - 50);
      content.classList.add('ntr_float');
      Object.assign(content.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
    }
  }

  function setupPanel(overlay, prevScroll) {
    const P = settings().uiPanel;
    const content = overlay.querySelector('.cb_popup_content');
    const header = overlay.querySelector('.cb_popup_header');
    const edge = overlay.querySelector('#ntr_edge');
    const preview = overlay.querySelector('#ntr_preview');
    panelLayout(overlay);
    if (prevScroll) overlay.querySelector('.ntr_body').scrollTop = prevScroll;

    overlay.querySelectorAll('.ntr_dockbtn').forEach((b) => {
      b.onclick = () => { P.dock = b.dataset.dock; save(); panelLayout(overlay); };
    });

    header.addEventListener('pointerdown', (e) => {
      if (isNarrow() || e.button !== 0 || e.target.closest('button, input, select, textarea')) return;
      e.preventDefault();
      const r = content.getBoundingClientRect();
      let w = r.width, offX = e.clientX - r.left;
      const offY = e.clientY - r.top;
      if (P.dock !== 'float') {
        w = clamp(P.fw || 560, 320, Math.round(window.innerWidth * 0.9));
        offX = Math.min(offX, w - 40);
        P.dock = 'float';
        P.x = e.clientX - offX;
        P.y = e.clientY - offY;
        panelLayout(overlay);
      }
      let zone = null;
      const move = (ev) => {
        content.style.left = clamp(ev.clientX - offX, 80 - w, window.innerWidth - 80) + 'px';
        content.style.top = clamp(ev.clientY - offY, 0, window.innerHeight - 50) + 'px';
        zone = ev.clientX <= 24 ? 'left' : ev.clientX >= window.innerWidth - 24 ? 'right' : null;
        if (zone) {
          const pw = clamp(P.w || 440, 320, Math.round(window.innerWidth * 0.9));
          Object.assign(preview.style, { display: 'block', width: pw + 'px', left: zone === 'left' ? '0px' : (window.innerWidth - pw) + 'px' });
        } else preview.style.display = 'none';
      };
      const up = () => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        preview.style.display = 'none';
        if (zone) P.dock = zone;
        else { P.dock = 'float'; P.x = parseFloat(content.style.left) || 0; P.y = parseFloat(content.style.top) || 0; }
        save();
        panelLayout(overlay);
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    });

    edge.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const move = (ev) => {
        const w = P.dock === 'right' ? window.innerWidth - ev.clientX : ev.clientX;
        P.w = clamp(Math.round(w), 320, Math.round(window.innerWidth * 0.9));
        panelLayout(overlay);
      };
      const up = () => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        save();
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    });

    if (window.ResizeObserver) {
      let t = null;
      new ResizeObserver(() => {
        if (P.dock !== 'float' || !content.classList.contains('ntr_float')) return;
        clearTimeout(t);
        t = setTimeout(() => { P.fw = Math.round(content.offsetWidth); P.fh = Math.round(content.offsetHeight); save(); }, 300);
      }).observe(content);
    }
  }

  // ===== Visual Novel module loader + its toggle button =====
  // Each module registers itself as window.NTR[name]. A failed module never breaks the core.
  const MOD_LABEL = { vn: 'Visual Novel Mode', map: 'Maps', opening: 'Opening video' };
  const modPromise = {}, modError = {};
  function loadModule(name, retry = false) {
    if (window.NTR[name]) return Promise.resolve(window.NTR[name]);
    if (retry && modError[name]) modPromise[name] = null;
    if (!modPromise[name]) {
      const label = MOD_LABEL[name] || name;
      modPromise[name] = import(`${NTR_BASE}${name}.js?v=${VERSION}`)
        .then(() => {
          const m = window.NTR[name];
          if (!m) throw new Error(`${name}.js did not register itself`);
          if (String(m.version).split('.')[0] !== VERSION.split('.')[0]) {
            toastr.warning(`${label} module is ${m.version} but the core is ${VERSION}. Update all the files.`, 'Nitwit Tavern Redesign');
          }
          modError[name] = '';
          return m;
        })
        .catch((e) => {
          modError[name] = e && e.message ? e.message : String(e);
          console.error(`[NTR] ${label} failed to load`, e);
          toastr.error(`${label} failed to load. Everything else still works.`, 'Nitwit Tavern Redesign');
          return null;
        });
    }
    return modPromise[name];
  }
  const loadVN = () => loadModule('vn', true);

  function vnSectionHtml(s) {
    const vn = window.NTR.vn;
    if (vn) return vn.sectionHtml(s);
    return `
      <div class="cb_section">
        ${secHead('vn', 'fa-comments', 'Visual Novel Mode')}
        <div class="cb_collapse_content">
          <label class="checkbox_label"><input type="checkbox" id="m_n_enable" ${s.nodeEnabled ? 'checked' : ''}><span>Enable Visual Novel Mode</span></label>
          <div class="cb_hint">${modError.vn ? 'Visual Novel Mode failed to load: ' + escapeHTML(modError.vn) : 'Its settings appear here once it\'s switched on.'}</div>
        </div>
      </div>`;
  }

  function bindVNSection(overlay, s) {
    const vn = window.NTR.vn;
    if (vn) { vn.bind(overlay, s); return; }
    const cb = overlay.querySelector('#m_n_enable');
    cb.onchange = async () => {
      s.nodeEnabled = cb.checked;
      if (cb.checked) s.vnUsed = true;
      save();
      const m = cb.checked ? await loadVN() : null;
      if (m) m.refresh({ switchedOn: true });
      syncVNToggle();
      openCombinedModal();
    };
  }

  function syncVNToggle() {
    const b = document.getElementById('cb_node_toggle');
    if (!b) return;
    b.classList.toggle('cb_on', !!settings().nodeEnabled);
    b.style.display = isOn() ? '' : 'none';
  }

  async function toggleVN() {
    const s = settings();
    const had = !!window.NTR.vn;
    s.nodeEnabled = !s.nodeEnabled;
    if (s.nodeEnabled) s.vnUsed = true;
    save();
    const vn = s.nodeEnabled ? await loadVN() : window.NTR.vn;
    if (vn) vn.refresh({ switchedOn: s.nodeEnabled });
    syncVNToggle();
    if (document.getElementById('cb_modal_overlay')) {
      if (vn && !had) openCombinedModal();
      else {
        const cb = document.getElementById('m_n_enable');
        if (cb) cb.checked = s.nodeEnabled;
        document.getElementById('m_n_body')?.classList.toggle('cb_dim', !s.nodeEnabled);
      }
    }
  }

  function injectNodeToggle() {
    const lsf = document.getElementById('leftSendForm');
    if (!lsf || document.getElementById('cb_node_toggle')) return;
    const b = document.createElement('div');
    b.id = 'cb_node_toggle';
    b.className = 'fa-solid fa-comments interactable';
    b.title = 'Visual Novel mode';
    b.tabIndex = 0;
    b.onclick = toggleVN;
    lsf.appendChild(b);
    syncVNToggle();
  }

  // ===== Extensions page bar + master power switch =====
  function syncExtBar() {
    const p = document.getElementById('ntr_power');
    if (!p) return;
    const on = isOn();
    p.classList.toggle('on', on);
    p.title = on ? 'Turn Nitwit Tavern Redesign off' : 'Turn Nitwit Tavern Redesign on';
  }

  async function setMaster(on) {
    const s = settings();
    s.masterEnabled = on;
    if (!on) { popDrag.ai = false; popDrag.us = false; }
    save();
    renderAll();
    syncPopouts();
    syncExtBar();
    syncVNToggle();
    if (on) {
      if (s.nodeEnabled || s.vnUsed) { const vn = await loadVN(); if (vn) vn.refresh(); }
    } else if (window.NTR.vn) window.NTR.vn.teardown();
    if (document.getElementById('cb_modal_overlay')) openCombinedModal();
  }

  function injectExtBar() {
    const host = document.getElementById('extensions_settings2');
    if (!host || document.getElementById('ntr_ext_bar')) return;
    document.getElementById('cv_ext_btn_container')?.remove();
    const wrap = document.createElement('div');
    wrap.id = 'ntr_ext_bar';
    wrap.className = 'inline-drawer';
    wrap.innerHTML = `
      <div class="inline-drawer-header ntr_ext_head" title="Open the Nitwit Tavern Redesign menu">
        <b>Nitwit Tavern Redesign</b>
        <div id="ntr_power" class="fa-solid fa-power-off" tabindex="0"></div>
      </div>`;
    host.appendChild(wrap);
    wrap.querySelector('.ntr_ext_head').addEventListener('click', (e) => {
      if (e.target.closest('#ntr_power')) return;
      openCombinedModal();
    });
    const pw = wrap.querySelector('#ntr_power');
    pw.addEventListener('click', (e) => { e.stopPropagation(); setMaster(!isOn()); });
    pw.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMaster(!isOn()); } });
    syncExtBar();
  }

  function injectExtensionMenuButton() {
    const tick = () => {
      injectExtBar();
      injectNodeToggle();
      if (isOn() && window.NTR.vn) window.NTR.vn.ensure();
    };
    tick();
    setInterval(tick, 1000);
  }

  window.NTR = window.NTR || {};
  window.NTR.api = {
    VERSION, DEFAULTS, ctx, save, settings, isOn, escapeHTML, media, fullResUrl, readDataURL, loadImg, askImageUrl,
    pills, posGrid, onPills, secHead, subHead, deleteFileIfUnused, syncVNToggle, TAG, store, refreshFg: () => ensureFgLayer(),
    openMenu: () => openCombinedModal(),
    closeMenu: () => { const ov = document.getElementById('cb_modal_overlay'); if (!ov) return false; ov.querySelector('.cb_close_btn')?.click(); return true; },
    loadModule, moduleError: (name) => modError[name] || '', uploadDataUrl, getYouTubeId, currentKey,
    bannerImage: () => {
      const key = currentKey();
      if (!key) return '';
      const r = peek(key);
      const im = r.images[r.idx] || r.images[0];
      return im ? media(im.url) : '';
    },
  };

  jQuery(() => {
    const { eventSource, event_types } = ctx();
    injectExtensionMenuButton();
    window.addEventListener('resize', () => syncWallpaper());
    eventSource.on(event_types.CHAT_CHANGED, () => {
      renderAll();
      window.NTR.vn?.queue(false);
      if (document.getElementById('cb_modal_overlay')) openCombinedModal();
    });

    for (const [name, anim] of [['CHARACTER_MESSAGE_RENDERED', true], ['USER_MESSAGE_RENDERED', true], ['MESSAGE_SWIPED', true], ['MESSAGE_EDITED', false], ['MESSAGE_UPDATED', false], ['MESSAGE_DELETED', false]]) {
      if (event_types[name]) eventSource.on(event_types[name], () => window.NTR.vn?.queue(anim));
    }
    window.addEventListener('resize', layoutFg);
    window.addEventListener('resize', () => {
      const ov = document.getElementById('cb_modal_overlay');
      if (!ov) return;
      panelLayout(ov);
      const g = ov.querySelector('#m_b_guide');
      if (g) g.textContent = bannerGuideText();
    });
    if (event_types.APP_READY) eventSource.on(event_types.APP_READY, () => { renderAll(); window.NTR.vn?.queue(false); });

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
    const s0 = settings();
    if (isOn() && (s0.nodeEnabled || s0.vnUsed)) loadVN().then((vn) => { if (vn) vn.refresh(); });
  });
})();
