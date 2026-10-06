(() => {
  const MODULE = 'chatvisuals';
  const VERSION = '2.8.2';
  const NTR_BASE = new URL('.', import.meta.url).href;
  const TAG = '<i class="fa-solid fa-tag ntr_tag" title="Saved per character"></i>';
  const DEFAULTS = { 
    bannerOn: true,
    bannerMode: 'image', 
    bannerRotate: false,
    bannerRotateSec: 8,
    bannerRotateFx: 'fade',
    bannerRotateOrder: 'order',
    bannerHeight: 120,
    bannerGap: 10,
    bannerBackdrop: 'wallpaper', 
    bannerVideoSound: false,
    bannerGlobal: { images: [], idx: 0, youtubeUrl: '', video: '', videoPos: 50 },
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

    // Reasoning Block (colors start empty and are filled from SillyTavern's own when the menu opens)
    rbEnabled: true, rbFontOn: false, rbFont: '', rbSizeOn: false, rbSize: 1, rbColorOn: false, rbColor: '', rbEmOn: false, rbEm: '',
    rbBorderOn: false, rbBorder: '', rbWeightOn: false, rbWeight: 'medium', rbSatOn: false, rbSat: 50,
    rbThinkOn: false, rbThink: 'Thinking...', rbDoneOn: false, rbDone: 'Thought for {time}', rbSomeOn: false, rbSome: 'Thought for some time',
    rbFxOn: false, rbFx: 'glow', rbFxStr: 3, rbFxColorOn: false, rbFxColor: '', rbBorderStyleOn: false, rbBorderStyle: 'solid', rbCssOn: false, rbCss: '',

    // Text Formatting
    tfEnabled: true, tfNameColorOn: false, tfNameColor: '', tfNameFontOn: false, tfNameFont: '', tfNameSizeOn: false, tfNameSize: 1, tfNameWeightOn: false, tfNameWeight: 'bold',
    tfUserFontOn: false, tfUserFont: '', tfUserSizeOn: false, tfUserSize: 1, tfUserMainOn: false, tfUserMain: '',
    tfUserEmOn: false, tfUserEm: '', tfUserUnderOn: false, tfUserUnder: '', tfUserQuoteOn: false, tfUserQuote: '',
    tfAiFontOn: false, tfAiFont: '', tfAiSizeOn: false, tfAiSize: 1, tfAiMainOn: false, tfAiMain: '',
    tfAiEmOn: false, tfAiEm: '', tfAiUnderOn: false, tfAiUnder: '', tfAiQuoteOn: false, tfAiQuote: '',
    tfNameFxOn: false, tfNameFx: 'glow', tfNameFxStr: 3, tfNameFxColorOn: false, tfNameFxColor: '',
    tfUserFxOn: false, tfUserFx: 'glow', tfUserFxStr: 3, tfUserFxColorOn: false, tfUserFxColor: '',
    tfAiFxOn: false, tfAiFx: 'glow', tfAiFxStr: 3, tfAiFxColorOn: false, tfAiFxColor: '',

    // Display overrides
    ovEnabled: true,
    ovWidthOn: false, ovWidth: 50, ovFontOn: false, ovFont: 1,
    ovBlurOn: false, ovBlur: 10, ovShadowOn: false, ovShadow: 2,
    ovChatStyleOn: false, ovChatStyle: 'bubbles', ovAvatarOn: false, ovAvatar: 'round',
    ovScrollColorOn: false, ovScrollColor: '', ovScrollTrackOn: false, ovScrollTrack: 'rgba(0, 0, 0, 0)',
    ovScrollWidthOn: false, ovScrollWidth: 11, ovScrollShapeOn: false, ovScrollShape: 'pill',
    ovCursorOn: false, ovCursorImg: '', ovCursorSpot: 'tl', ovCursorPtrImg: '', ovCursorPtrSpot: 'tc', ovCursorSize: 32,

    // Menu state
    uiOpen: {},
    uiPage: 'banner',
    uiPanel: { dock: 'right', w: 440, fw: 560, fh: 0, x: null, y: null },
    wandEntry: false,

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
    themeActive: null
  };
  // Overall Font Scale keeps its old UI Display key names so saved configs keep working; it now lives in Text Formatting.
  const FONT_SCALE_KEYS = ['ovFontOn', 'ovFont'];

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

  // While NTR data is being removed, nothing may write the settings back: until the page reloads, code that
  // still runs gets a throwaway copy of the defaults.
  let wiping = false;
  let wipeStub = null;
  function settings() {
    const { extensionSettings } = ctx();
    if (wiping && !extensionSettings[MODULE]) return (wipeStub ??= structuredClone(DEFAULTS));
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
    // Off used to be one of the banner kinds; it's now its own switch for every character.
    if (s.bannerMode === 'off') { s.bannerOn = false; s.bannerMode = 'image'; }
    if (s.vnUsed === undefined) s.vnUsed = !!s.nodeEnabled || Object.keys(s.nodeAvatars || {}).length > 0;
    for (const k of Object.keys(DEFAULTS.uiPanel)) if (s.uiPanel[k] === undefined) s.uiPanel[k] = DEFAULTS.uiPanel[k];
    if (!Array.isArray(s.themes)) s.themes = [];
    if (!s.themeFontMoved) { s.themes.forEach((th) => moveLookKeys(th && th.data)); s.themeFontMoved = true; }
    if (!cleaned.has(s.bannerGlobal)) s.bannerGlobal = cleanBannerSrc(s.bannerGlobal);
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
    let bg = null;
    if (currentLook().backdrop === 'wallpaper' && banner.style.display !== 'none') {
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

  // The main Enable switches are sliders that still click on and off. They're styled by id because a class would rank
  // below SillyTavern's own checkbox styles, which would turn them back into square checkboxes.
  const SWITCH_IDS = ['m_f_enable', 'm_a_enable', 'm_n_enable', 'm_ai_on', 'm_us_on', 'm_rb_enable', 'm_tf_enable', 'm_ov_enable', 'm_b_enable'];
  const switches = (state) => SWITCH_IDS.map((id) => `#${id}${state}`).join(', ');

  function updateAvatarStyle() {
    let styleEl = document.getElementById('aw_dynamic_style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'aw_dynamic_style';
      document.head.appendChild(styleEl);
    }

    const s = settings();
    
    let cssString = `
      #cb_banner { width: 100%; height: var(--cb-h, 120px); position: relative; overflow: hidden; display: block; border-radius: 10px; margin-bottom: var(--cb-gap, 10px); }
      #cb_banner.cb_overlap { position: absolute !important; top: 0; left: 0; right: 0; z-index: 100; margin-bottom: 0 !important; }
      #cb_banner .cb_nav { position: absolute; right: 8px; bottom: 8px; z-index: 2; display: none; align-items: center; gap: 6px; padding: 3px 8px; border-radius: 999px; background: rgba(0,0,0,0.55); color: #fff; font-size: 12px; line-height: 1.2; opacity: 0; transition: opacity .15s; }
      #cb_banner:hover .cb_nav { opacity: 1; }
      @media (hover: none) { #cb_banner .cb_nav { opacity: 1; } }
      #cb_banner .cb_nav_btn { background: none; border: none; color: inherit; cursor: pointer; padding: 2px 5px; line-height: 1; }
      #cb_banner .cb_vid { position: relative; z-index: 1; display: block; }
      #cb_banner .cb_snd { position: absolute; left: 8px; bottom: 8px; z-index: 2; padding: 5px 9px; border-radius: 999px; background: rgba(0,0,0,0.55); color: #fff; font-size: 12px; opacity: 0; transition: opacity .15s; }
      #cb_banner:hover .cb_snd { opacity: 1; }
      @media (hover: none) { #cb_banner .cb_snd { opacity: 1; } }
      .cb_thumbs { position: relative; display: flex; gap: 6px; overflow-x: auto; padding: 4px 0; margin-top: 6px; }
      .cb_thumb { flex: none; width: 64px; height: 40px; object-fit: cover; border-radius: 4px; border: 2px solid transparent; cursor: pointer; opacity: 0.7; }
      .cb_thumb.active { border-color: var(--SmartThemeQuoteColor, #6cf); opacity: 1; }
      #cb_banner .cb_wall { position: absolute; background-size: cover; background-position: center; background-repeat: no-repeat; pointer-events: none; z-index: 0; }
      #cb_banner .cb_img, #cb_banner .cb_yt { position: relative; z-index: 1; }
      #cb_banner .cb_xfade { position: absolute; left: 0; top: 0; z-index: 1; pointer-events: none; transition: opacity .8s ease; }
      #cb_pop_layer { position: fixed; inset: 0; z-index: 2500; pointer-events: none; overflow: hidden; }
      #cb_pop_layer img { position: absolute; display: none; pointer-events: none; max-width: none; user-select: none; -webkit-user-drag: none; touch-action: none; }
      #cb_drag_pill { position: absolute; left: 50%; bottom: calc(16px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); display: none; align-items: center; gap: 10px; padding: 8px 8px 8px 14px; border-radius: 999px; background: rgba(0,0,0,0.85); color: #fff; font-size: 13px; line-height: 1.2; white-space: nowrap; pointer-events: auto; box-shadow: 0 2px 10px rgba(0,0,0,0.5); }
      #cb_drag_pill button { border: none; border-radius: 999px; padding: 5px 14px; font-weight: bold; cursor: pointer; background: var(--SmartThemeQuoteColor, #6cf); color: #000; }
      .cb_col { display: flex; flex-direction: column; gap: 8px; }
      .cb_grp { flex-direction: column; gap: 8px; }
      .cb_col_body { display: flex; flex-direction: column; gap: 8px; }
      .cb_sub { font-size: 0.75em; opacity: 0.65; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 4px; padding-top: 6px; border-top: 1px solid var(--SmartThemeBorderColor, #444); }
      
      #cb_fg_layer { position: fixed; inset: 0; z-index: 2400; pointer-events: none; opacity: var(--cb-fg-op, 1); }
      #cb_fg_front { position: fixed; inset: 0; z-index: 2420; pointer-events: none; opacity: var(--cb-fg-op, 1); }
      .cb_fg_img { position: absolute; bottom: 0; height: 100%; object-fit: contain; object-position: center bottom; pointer-events: none; }
      #cb_fg_left { left: 0; object-position: left bottom; }
      #cb_fg_right { right: 0; object-position: right bottom; }

      .cb_collapse_toggle { cursor: pointer; user-select: none; display: flex; justify-content: space-between; align-items: center; }
      .cb_dim { opacity: .4; pointer-events: none; filter: grayscale(.5); transition: opacity .15s; }
      .cb_hint { font-size: .8em; opacity: .7; margin: 4px 0 6px; }
      .cb_err { color: #ff8a8a; }
      .cb_warn { color: #ffd479; }
      .cb_code { white-space: pre-wrap; font-family: monospace; font-size: .85em; background: rgba(0,0,0,.25); padding: 6px 8px; border-radius: 6px; margin-top: 8px; }
      .cb_pills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 5px; }
      .cb_pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px 4px 8px; border-radius: 999px; border: 1px solid var(--SmartThemeBorderColor, #555); background: rgba(0,0,0,.2); cursor: pointer; user-select: none; font-size: .9em; transition: background .15s, border-color .15s; }
      .cb_pill input, .cb_posgrid input, .cb_defdot input { margin: 0; cursor: pointer; accent-color: var(--SmartThemeQuoteColor, #6cf); }
      ${switches('')} {
        appearance: none; -webkit-appearance: none; flex: none; box-sizing: border-box; position: relative; width: 2.1em; height: 1.15em; margin: 0 6px 0 0;
        border: 1px solid var(--SmartThemeBorderColor, #888); border-radius: 999px; background: rgba(0,0,0,.3); cursor: pointer;
        outline: none; box-shadow: none; transform: none; align-self: center; vertical-align: middle; transition: background .15s, border-color .15s;
      }
      ${switches('::before')} {
        content: ''; position: absolute; top: 50%; left: .14em; width: .8em; height: .8em; border-radius: 50%;
        background: var(--SmartThemeBodyColor, #ccc); opacity: .6; box-shadow: none; clip-path: none; transform: translateY(-50%); transition: left .15s, background .15s, opacity .15s;
      }
      ${switches(':checked')} { background: var(--SmartThemeQuoteColor, #6cf); border-color: var(--SmartThemeQuoteColor, #6cf); }
      ${switches(':checked::before')} { left: calc(100% - .94em); background: #fff; opacity: 1; }
      ${switches(':focus-visible')} { outline: 2px solid var(--SmartThemeQuoteColor, #6cf); outline-offset: 3px; }
      .cb_pill:has(input:checked) { border-color: var(--SmartThemeQuoteColor, #6cf); background: rgba(255,255,255,.08); }
      .cb_posgrid { display: grid; grid-template-columns: repeat(3, 28px); gap: 4px; padding: 6px; margin-top: 5px; border-radius: 8px; background: rgba(0,0,0,.2); width: max-content; }
      .cb_posgrid label { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; }
      .cb_posgrid label:hover { background: rgba(255,255,255,.08); }
      .cb_ovrow { padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,.06); }
      .cb_ovrow .m_o_body { margin-top: 4px; padding-left: 26px; }
      .cb_cur_slot { border-radius: 8px; background: rgba(0,0,0,.15); padding: 6px; margin-bottom: 6px; }
      .cb_cur_row { display: flex; align-items: center; gap: 6px; }
      .cb_cur_row .menu_button { margin: 0; padding: 4px 8px; }
      .cb_cur_prev { width: 40px; height: 40px; flex: none; border-radius: 8px; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; }
      .cb_cur_prev img { max-width: 32px; max-height: 32px; }
      .cb_cur_prev i { opacity: .35; }
      .cb_cur_name { flex: 1; min-width: 0; }
      .cb_cur_name small { display: block; opacity: .6; font-size: .8em; }
    `;

    if (isOn()) cssString += overrideCss(s) + scrollbarCss(s) + cursorCss(s) + textFormatCss(s);
    else cursorKinds = {};

    if (isOn() && s.ovEnabled && s.chatTransparent) {
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
    syncGoogleFonts();
    syncCustomCss();
    watchReasoningLabels();
    syncReasoningLabels();
    applyBodyOverrides();
    syncPopouts();
  }

  function currentKey() {
    const c = ctx();
    if (c.groupId) return null;
    const ch = c.characters?.[c.characterId];
    return ch?.avatar || null;
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
    // Before 2.3 Global had no images of its own, so a Global character with its own images, link or video
    // becomes Char and keeps showing them. Checked once per banner, so switching to Global later sticks.
    if (!r.sharedChecked) {
      const own = r.scope !== 'char' && (r.images.length || r.youtubeUrl || r.video);
      if (own) startChar(r);
      r.sharedChecked = true;
      if (own && d) scheduleCardFlush(key);
    }
    return r;
  };

  function buildBanner() {
    banner = document.createElement('div');
    banner.id = 'cb_banner';
    banner.innerHTML = `
      <img class="cb_img" alt="" style="display: none; width: 100%; height: 100%; object-fit: cover;">
      <iframe class="cb_yt" style="display: none; width: 100%; height: 100%; border: none; pointer-events: auto;" allow="autoplay; encrypted-media" referrerpolicy="strict-origin-when-cross-origin"></iframe>
      <video class="cb_vid" muted loop playsinline preload="auto" style="display: none; width: 100%; height: 100%; object-fit: cover;"></video>
      <button class="cb_nav_btn cb_snd" style="display: none;"></button>
      <div class="cb_wall" style="display: none;"></div>
      <div class="cb_nav">
        <button class="cb_nav_btn cb_nav_prev" title="Previous image"><i class="fa-solid fa-chevron-left"></i></button>
        <span class="cb_nav_count"></span>
        <button class="cb_nav_btn cb_nav_next" title="Next image"><i class="fa-solid fa-chevron-right"></i></button>
      </div>
    `;
    banner.querySelector('.cb_nav_prev').onclick = (e) => { e.stopPropagation(); step(-1); };
    banner.querySelector('.cb_nav_next').onclick = (e) => { e.stopPropagation(); step(1); };
    banner.querySelector('.cb_snd').onclick = (e) => { e.stopPropagation(); toggleBannerSound(); };
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

  // Global and Char are saved per character: Char uses the character's own banner, Global the shared one.
  // Off is one switch for every character.
  const BANNER_NOTE = {
    global: 'Global shows the shared banner on every character that doesn\'t have its own (Char).',
    char: 'Char gives this character its own banner. Its images and settings are saved in its card.',
  };
  // Images, YouTube link and video: Char uses the character's own, Global the shared banner in the settings.
  const bannerSrc = (r) => (r && r.scope === 'char' ? r : settings().bannerGlobal);
  function bannerKind(r) {
    const s = settings();
    if (!s.bannerOn || !r) return 'off';
    return r.scope === 'char' && r.mode ? r.mode : s.bannerMode;
  }

  // A hidden YouTube player keeps playing its sound, so it's unloaded whenever the banner doesn't show it.
  function stopBannerYt() {
    const yt = banner?.querySelector('.cb_yt');
    if (yt && yt.src && yt.src !== 'about:blank') yt.src = 'about:blank';
  }

  // A video banner starts muted unless sound was turned on before; the speaker button's choice is saved right away.
  // Browsers can block sound until the page is clicked, so a blocked start plays muted for now without changing the choice.
  function stopBannerVid() {
    const v = banner?.querySelector('.cb_vid');
    if (!v || !v.getAttribute('src')) return;
    v.pause();
    v.removeAttribute('src');
    v.load();
    banner.querySelector('.cb_snd').style.display = 'none';
  }
  function setSndIcon(muted) {
    const b = banner?.querySelector('.cb_snd');
    if (!b) return;
    b.innerHTML = `<i class="fa-solid ${muted ? 'fa-volume-xmark' : 'fa-volume-high'}"></i>`;
    b.title = muted ? 'Sound on' : 'Mute';
  }
  function playBannerVid(v) {
    const want = !!currentLook().videoSound;
    v.muted = !want;
    setSndIcon(!want);
    const p = v.play();
    if (p && p.catch) p.catch(() => {
      if (!want || v.muted) return;
      v.muted = true;
      setSndIcon(true);
      v.play().catch(() => {});
    });
  }
  function toggleBannerSound() {
    const v = banner?.querySelector('.cb_vid');
    if (!v) return;
    const key = currentKey();
    const r = key ? peek(key) : null;
    const want = v.muted;
    if (r && r.scope === 'char') r.videoSound = want;
    else settings().bannerVideoSound = want;
    save();
    v.muted = !want;
    setSndIcon(v.muted);
    if (!v.muted) v.play().catch(() => {});
  }

  // ===== Banner image rotation =====
  // Follows the same Global / Char switch as the kind: Char uses the character's own copy.
  const ROT_KEYS = { rotate: 'bannerRotate', rotateSec: 'bannerRotateSec', rotateFx: 'bannerRotateFx', rotateOrder: 'bannerRotateOrder' };
  function rotation(r) {
    const s = settings();
    const own = !!r && r.scope === 'char';
    const o = {};
    for (const [k, g] of Object.entries(ROT_KEYS)) o[k] = own ? r[k] : s[g];
    o.rotateSec = Math.min(60, Math.max(3, Math.round(Number(o.rotateSec)) || 8));
    return o;
  }

  // Banner height, gap, transparent areas and video sound follow the same switch. A Char character
  // with no value of its own yet (set to Char before these were per character) uses the global one.
  const BANNER_LOOK_KEYS = { height: 'bannerHeight', gap: 'bannerGap', backdrop: 'bannerBackdrop', videoSound: 'bannerVideoSound' };
  // A character switched to Char starts on the Global kind, rotation and look settings.
  function startChar(r) {
    const s = settings();
    r.mode = s.bannerMode;
    for (const [k, g] of Object.entries(ROT_KEYS)) r[k] = s[g];
    for (const [k, g] of Object.entries(BANNER_LOOK_KEYS)) r[k] = s[g];
    r.scope = 'char';
  }
  function bannerLook(r) {
    const s = settings();
    const own = !!r && r.scope === 'char';
    const o = {};
    for (const [k, g] of Object.entries(BANNER_LOOK_KEYS)) o[k] = own && r[k] != null ? r[k] : s[g];
    return o;
  }
  function currentLook() {
    const key = currentKey();
    return bannerLook(key ? peek(key) : null);
  }
  function applyBannerSize() {
    const o = currentLook();
    document.documentElement.style.setProperty('--cb-h', o.height + 'px');
    document.documentElement.style.setProperty('--cb-gap', o.gap + 'px');
  }

  // rot.idx is the image on screen while rotating. It's never saved, so the card isn't rewritten every few
  // seconds and each chat opens on the picked image (r.idx), which only the arrows and the menu change.
  const rot = { key: null, idx: null, timer: null, sec: 0, fade: false };
  // Waits while the Header Banner page is open, so the Crop slider works on the picked image.
  const rotPaused = () => !!document.getElementById('cb_modal_overlay') && settings().uiPage === 'banner';
  function shownIdx(key, r) {
    const n = r.images.length;
    return rot.key === key && rot.idx != null && rot.idx < n ? rot.idx : Math.min(r.idx, n - 1);
  }
  function stopRotation() {
    clearTimeout(rot.timer);
    rot.timer = null;
  }
  function armRotation(sec) {
    if (rot.timer && rot.sec === sec) return;
    clearTimeout(rot.timer);
    rot.sec = sec;
    rot.timer = setTimeout(rotTick, sec * 1000);
  }
  function rotTick() {
    rot.timer = null;
    const key = currentKey();
    const r = key ? peek(key) : null;
    if (!r || key !== rot.key || !banner || banner.style.display === 'none' || bannerKind(r) !== 'image') return;
    const o = rotation(r);
    const n = bannerSrc(r).images.length;
    if (!o.rotate || n < 2) return;
    if (!rotPaused()) {
      const cur = shownIdx(key, bannerSrc(r));
      let next = (cur + 1) % n;
      if (o.rotateOrder === 'shuffle') { next = Math.floor(Math.random() * (n - 1)); if (next >= cur) next++; }
      rot.idx = next;
      rot.fade = o.rotateFx === 'fade';
    }
    updateBanner(); // shows it and sets up the next one
  }

  // The old image fades out on top of the new one, once the new one has loaded.
  function crossfade(img, u, pos) {
    if (img.dataset.next === u) return;
    img.dataset.next = u;
    loadImg(u).catch(() => {}).then(() => {
      if (img.dataset.next !== u) return;
      delete img.dataset.next;
      const old = img.cloneNode();
      old.className = 'cb_xfade';
      img.after(old);
      img.src = u;
      img.style.objectPosition = pos;
      requestAnimationFrame(() => requestAnimationFrame(() => { old.style.opacity = '0'; }));
      setTimeout(() => old.remove(), 1000);
    });
  }

  function getYouTubeId(url) {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    return match ? match[1] : null;
  }

  function updateBanner() {
    const key = currentKey();
    if (!banner) return;
    if (key !== rot.key) { rot.key = key; rot.idx = null; stopRotation(); }
    const fade = rot.fade;
    rot.fade = false;
    const r = key ? peek(key) : null;
    const kind = bannerKind(r);
    if (kind === 'off') {
      stopBannerYt();
      stopBannerVid();
      banner.style.display = 'none';
      return;
    }
    
    applyBannerSize();

    watchBannerImg();
    const img = banner.querySelector('.cb_img');
    const yt = banner.querySelector('.cb_yt');
    const nav = banner.querySelector('.cb_nav');
    const vid = banner.querySelector('.cb_vid');

    const src = bannerSrc(r);
    if (kind === 'image') {
      stopBannerYt();
      stopBannerVid();
      vid.style.display = 'none';
      const n = src.images.length;
      if (!n) {
        banner.style.display = 'none';
        return;
      }
      banner.style.display = 'block';
      yt.style.display = 'none';
      img.style.display = 'block';

      const i = shownIdx(key, src);
      const im = src.images[i] || src.images[0];
      const u = media(im.url);
      if (!u) { banner.style.display = 'none'; return; }
      const pos = `50% ${im.pos ?? 45}%`;
      if (img.getAttribute('src') !== u && fade && img.getAttribute('src')) crossfade(img, u, pos);
      else {
        delete img.dataset.next;
        if (img.getAttribute('src') !== u) img.src = u;
        img.style.objectPosition = pos;
      }
      nav.style.display = n > 1 ? 'flex' : 'none';
      nav.querySelector('.cb_nav_count').textContent = `${i + 1} / ${n}`;
      const o = rotation(r);
      if (o.rotate && n > 1) armRotation(o.rotateSec); else stopRotation();
      
    } else if (kind === 'youtube') {
      stopBannerVid();
      vid.style.display = 'none';
      const videoId = getYouTubeId(src.youtubeUrl || '');
      if (!videoId) {
        stopBannerYt();
        banner.style.display = 'none';
        return;
      }
      banner.style.display = 'block';
      img.style.display = 'none';
      yt.style.display = 'block';
      nav.style.display = 'none';

      const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&mute=0&loop=1&playlist=${videoId}&controls=1&modestbranding=1`;
      if (yt.getAttribute('src') !== embedUrl) yt.src = embedUrl;
    } else if (kind === 'video') {
      stopBannerYt();
      const u = media(src.video);
      if (!u) {
        stopBannerVid();
        banner.style.display = 'none';
        return;
      }
      banner.style.display = 'block';
      img.style.display = 'none';
      yt.style.display = 'none';
      nav.style.display = 'none';
      vid.style.display = 'block';
      vid.style.objectPosition = `50% ${cNum(src.videoPos, 50, 0, 100)}%`;
      banner.querySelector('.cb_snd').style.display = '';
      if (vid.getAttribute('src') !== u) { vid.src = u; playBannerVid(vid); }
      else if (vid.paused) playBannerVid(vid);
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
      if (!isOn()) { if (banner) banner.style.display = 'none'; stopBannerYt(); stopBannerVid(); syncWallpaper(); return; }
      
      if (!banner) buildBanner();
      const key = currentKey();
      const r = key ? peek(key) : null;
      if (bannerKind(r) === 'off') {
        stopBannerYt();
        stopBannerVid();
        banner.style.display = 'none';
        return;
      }
      
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
    const r = bannerSrc(key ? peek(key) : null);
    const n = r.images.length;
    if (n < 2) return;
    r.idx = (shownIdx(key, r) + d + n) % n;
    rot.idx = null;
    stopRotation(); // the arrows restart the rotation timer
    save();
    updateBanner();
    if (document.getElementById('cb_modal_overlay')) openCombinedModal();
  }

  const readDataURL = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
  const loadImg = (u) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = u; });

  // ===== Uploads =====
  // Every upload lands in user/files as <prefix>_<time>_<random>.<ext>. The prefixes are how the extension
  // recognizes its own files when it cleans up (see OWN_FILE).
  const MIME_EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp', 'video/mp4': 'mp4', 'video/webm': 'webm' };
  async function uploadBase64(b64, ext, prefix) {
    const name = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const res = await fetch('/api/files/upload', { method: 'POST', headers: ctx().getRequestHeaders(), body: JSON.stringify({ name, data: b64 }) });
    if (!res.ok) {
      const why = (await res.text().catch(() => '')).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
      throw new Error(`Upload failed (${res.status})${why ? `: ${why}` : ''}`);
    }
    const j = await res.json();
    return '/' + String(j.path).replace(/^\/+/, '');
  }

  // Theme files can carry their images inline (base64), so they work on another install.
  async function uploadDataUrl(dataUrl, prefix = 'ntr') {
    const m = /^data:([\w/+.-]+);base64,(.+)$/s.exec(String(dataUrl || ''));
    if (!m || !MIME_EXT[m[1]]) throw new Error('Unsupported embedded file');
    return uploadBase64(m[2], MIME_EXT[m[1]], prefix);
  }

  // Images over `max` px on their longer side (or `maxWidth` wide) are shrunk first: photos stay JPEG, the rest become
  // PNG so transparency survives. Other image types become PNG too, so the file always matches its name. GIFs go as
  // they are, to keep their animation.
  async function uploadImage(f, prefix, { max = 0, maxWidth = 0 } = {}) {
    let url = String(await readDataURL(f));
    if (f.type !== 'image/gif') {
      const i = await loadImg(url).catch(() => { throw new Error('That file didn\'t load as an image.'); });
      if (!i.width || !i.height) throw new Error('That file didn\'t load as an image.');
      const k = Math.min(1, max ? max / Math.max(i.width, i.height) : 1, maxWidth ? maxWidth / i.width : 1);
      if (k < 1 || !['image/png', 'image/jpeg', 'image/webp'].includes(f.type)) {
        const c = document.createElement('canvas');
        c.width = Math.round(i.width * k); c.height = Math.round(i.height * k);
        c.getContext('2d').drawImage(i, 0, 0, c.width, c.height);
        url = c.toDataURL(f.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', 0.92);
      }
    }
    return uploadDataUrl(url, prefix);
  }

  // ===== Questions in the menu =====
  // Asked right under the button that was pressed: the browser's own boxes can't be styled and freeze the page.
  // One question at a time. Without a button to show it under, SillyTavern's own popup asks instead.
  // A new question closes the open one as if Cancel was pressed, so code waiting on it never hangs.
  function askBox(anchor, html, cancel) {
    document.querySelectorAll('.ntr_ask').forEach((el) => (el.ntrCancel ? el.ntrCancel() : el.remove()));
    // Below the button's whole row, not inside it, so a row of buttons keeps its layout.
    let row = anchor;
    const inRow = (el) => { const cs = getComputedStyle(el); return /flex|grid/.test(cs.display) && !cs.flexDirection.startsWith('column'); };
    while (row.parentElement && inRow(row.parentElement)) row = row.parentElement;
    const box = document.createElement('div');
    box.className = 'ntr_tpanel ntr_ask';
    box.innerHTML = html;
    box.ntrCancel = cancel;
    row.after(box);
    return box;
  }
  const askBtns = (ok, danger) => `
    <div class="cb_actions">
      <button class="menu_button ntr_ask_ok${danger ? ' danger_button' : ''}">${ok}</button>
      <button class="menu_button ntr_ask_cancel">Cancel</button>
    </div>`;

  // Resolves to true for the main button, false for Cancel.
  function askYes(anchor, text, ok, { danger = false } = {}) {
    if (!anchor) {
      const c = ctx();
      if (typeof c.callGenericPopup === 'function' && c.POPUP_TYPE) return c.callGenericPopup(escapeHTML(text), c.POPUP_TYPE.CONFIRM).then((r) => r === c.POPUP_RESULT?.AFFIRMATIVE || r === 1);
      return Promise.resolve(confirm(text));
    }
    return new Promise((res) => {
      const cancel = () => { box.remove(); res(false); };
      const box = askBox(anchor, `<div>${escapeHTML(text)}</div>${askBtns(ok, danger)}`, cancel);
      box.querySelector('.ntr_ask_ok').onclick = () => { box.remove(); res(true); };
      box.querySelector('.ntr_ask_cancel').onclick = cancel;
    });
  }

  // A text field. `check(text)` resolves to { value } to accept or { error } to show a red hint and keep asking.
  // Resolves to the accepted value, or null on Cancel.
  function askText(anchor, { label, value = '', ok = 'Add', check = (v) => ({ value: v }) }) {
    if (!anchor) {
      const c = ctx();
      if (typeof c.callGenericPopup !== 'function' || !c.POPUP_TYPE) return Promise.resolve(null);
      return c.callGenericPopup(escapeHTML(label), c.POPUP_TYPE.INPUT, value).then(async (raw) => {
        if (typeof raw !== 'string') return null;
        const r = await check(raw.trim());
        if (r.error) { toastr.warning(r.error); return null; }
        return r.value;
      });
    }
    return new Promise((res) => {
      const cancel = () => { box.remove(); res(null); };
      const box = askBox(anchor, `
        <label>${escapeHTML(label)} <input type="text" class="text_pole ntr_ask_input" value="${escapeHTML(value)}"></label>
        <div class="ntr_terr"></div>
        ${askBtns(ok, false)}`, cancel);
      const input = box.querySelector('.ntr_ask_input');
      const err = box.querySelector('.ntr_terr');
      const okBtn = box.querySelector('.ntr_ask_ok');
      const done = async () => {
        if (okBtn.disabled) return;
        okBtn.disabled = true;
        okBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        const r = await check(input.value.trim());
        okBtn.disabled = false;
        okBtn.innerHTML = ok;
        if (r.error) { err.textContent = r.error; input.focus(); return; }
        box.remove();
        res(r.value);
      };
      input.oninput = () => { err.textContent = ''; };
      input.onkeydown = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); done(); }
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancel(); }
      };
      okBtn.onclick = done;
      box.querySelector('.ntr_ask_cancel').onclick = cancel;
      input.focus();
      input.select();
    });
  }

  // Videos (mp4 or webm) are sent as they are. Resolves to the file's path, or '' if it isn't an mp4 or webm, or it's
  // very big and the person cancels. `btn` shows a spinner while it uploads.
  async function uploadVideo(f, prefix, title, btn) {
    let ext = (f.name.split('.').pop() || '').toLowerCase();
    if (!['mp4', 'webm'].includes(ext)) ext = f.type === 'video/webm' ? 'webm' : f.type === 'video/mp4' ? 'mp4' : '';
    if (!ext) { toastr.warning('Use an mp4 or webm video.', title); return ''; }
    if (f.size > 100 * 1024 * 1024 && !(await askYes(btn, `This video is ${Math.round(f.size / 1048576)} MB. Big files may fail to upload or be slow to load. Upload anyway?`, 'Upload'))) return '';
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; }
    const data = String(await readDataURL(f));
    return uploadBase64(data.slice(data.indexOf(',') + 1), ext, prefix);
  }

  // Ask for a link instead of an upload, under `anchor` (the Link button). Resolves to a checked http(s) URL that
  // loaded, or '' if cancelled.
  const askUrl = (anchor, label, load, failMsg) => askText(anchor, {
    label,
    check: async (raw) => {
      const u = cUrl(raw);
      if (!/^https?:\/\//i.test(u)) return { error: 'Paste a full link that starts with http:// or https://' };
      try { await load(u); } catch (e) { return { error: failMsg }; }
      return { value: u };
    },
  }).then((u) => u || '');
  const askImageUrl = (label = 'Image', anchor = null) => askUrl(anchor, `${label}: paste an image link (https://...)`, loadImg,
    'That link did not load as an image. Check it and try again.');

  // Ask for a video link (mp4 or webm).
  const loadVideo = (u) => new Promise((res, rej) => {
    const v = document.createElement('video');
    v.muted = true;
    v.preload = 'metadata';
    const done = (ok) => { clearTimeout(t); v.removeAttribute('src'); v.load(); ok ? res() : rej(new Error('Video did not load')); };
    const t = setTimeout(() => done(false), 15000);
    v.onloadedmetadata = () => done(true);
    v.onerror = () => done(false);
    v.src = u;
  });
  const askVideoUrl = (label = 'Video', anchor = null) => askUrl(anchor, `${label}: paste a link to an mp4 or webm video (https://...)`, loadVideo,
    'That link did not load as a video. Use a direct link to an mp4 or webm file.');

  async function addFiles(files) {
    const key = currentKey();
    const r = bannerSrc(key ? peek(key) : null);
    let added = 0;
    for (const f of files) {
      try {
        r.images.push({ url: await uploadImage(f, 'banner', { maxWidth: 1600 }), pos: 45 });
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

  async function removeCurrentBanner(anchor) {
    const key = currentKey();
    const r = bannerSrc(key ? peek(key) : null);
    const im = r.images[r.idx];
    if (!im || !(await askYes(anchor, 'Remove this scenic banner image?', 'Remove', { danger: true }))) return;
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
      <div class="ntr_colwrap">
      <div class="ntr_glab">${title}</div>
      <div id="m_${prefix}_col" class="cb_col ntr_card">
        <label class="checkbox_label"><input type="checkbox" id="m_${prefix}_on" ${s[`${prefix}Enabled`] !== false ? 'checked' : ''}><span>${title} Avatar</span></label>
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
      </div>
    `;
  }

  function bannerGuideText() {
    const chat = document.getElementById('chat');
    const w = Math.round((banner && banner.offsetWidth) || (chat ? chat.getBoundingClientRect().width : 0));
    if (!w) return '';
    const h = currentLook().height;
    const ratio = (w / h).toFixed(1);
    return `Your banner is currently ${w} × ${h} px (${ratio}:1). For sharp results use images at least ${w * 2} × ${Math.round(h * 2 * 1.3)} px. A little taller than the banner's shape gives the Crop slider room to work.`;
  }

  function openCombinedModal() {
    const prevScroll = document.querySelector('#cb_modal_overlay .ntr_body')?.scrollTop || 0;
    document.getElementById('cb_modal_overlay')?.remove();
    const s = settings();
    if (!PAGES.some(([id]) => id === s.uiPage)) s.uiPage = 'banner';
    const F = fgData();
    const chatOpen = !!store(); // Foreground images are saved per chat, so they need one open.
    const key = currentKey();
    const r = key ? peek(key) : { images: [], locked: true, overlap: false, overlapOffset: 0, youtubeUrl: '' };
    const ownKind = !!key && r.scope === 'char';
    const kind = ownKind && r.mode ? r.mode : s.bannerMode;
    const ro = rotation(ownKind ? r : null);
    const bl = bannerLook(ownKind ? r : null);
    const btag = ownKind ? ' ' + TAG : '';
    const src = bannerSrc(ownKind ? r : null);
    const shared = ownKind ? '' : '<div class="cb_hint">This is the shared banner. Changes show on every character set to Global.</div>';
    const n = src.images.length;
    const curImg = src.images[src.idx] || null;

    const overlay = document.createElement('div');
    overlay.id = 'cb_modal_overlay';
    overlay.className = 'cb_popup_overlay';

    overlay.innerHTML = `
      <div class="cb_popup_content">
        <div class="cb_popup_header">
          <button class="cb_hbtn ntr_navbtn" title="Show the sections"><i class="fa-solid fa-bars"></i></button>
          <span class="ntr_title"><span class="ntr_icon"></span> Nitwit Tavern Redesign</span>
          <span class="ntr_hbtns">
            <button class="cb_hbtn" id="m_wand"><i class="fa-solid fa-wand-magic-sparkles"></i></button>
            <button class="cb_hbtn ntr_dockbtn" data-dock="left" title="Dock left"><i class="fa-solid fa-left-long"></i></button>
            <button class="cb_hbtn ntr_dockbtn" data-dock="float" title="Float"><i class="fa-regular fa-window-restore"></i></button>
            <button class="cb_hbtn ntr_dockbtn" data-dock="right" title="Dock right"><i class="fa-solid fa-right-long"></i></button>
            <button class="cb_close_btn" title="Close">&times;</button>
          </span>
        </div>
        ${isOn() ? '' : '<div class="ntr_offnote"><i class="fa-solid fa-power-off"></i> The extension is switched off. Use the power button on its bar in the Extensions panel to turn it back on.</div>'}
        <div class="ntr_main">
        <nav class="ntr_nav">${navHtml(s.uiPage)}</nav>
        <div class="ntr_shade"></div>
        <div class="ntr_body">

        ${themesSectionHtml(s)}

        ${pageHtml('banner', `
            ${card('Source', `
            <div><strong>Banner:</strong>${pills('bscope', [['global', 'Global', BANNER_NOTE.global], ['char', 'Char', BANNER_NOTE.char]], ownKind ? 'char' : 'global')}</div>
              <div style="margin-top: 10px;">
                <strong>Kind:</strong>${ownKind ? ' ' + TAG : ''}${pills('bmode', [['image', 'Image Gallery'], ['youtube', 'YouTube Loop'], ['video', 'Video']], kind)}
                ${ownKind ? '' : '<div class="cb_hint">Changes every character set to Global.</div>'}
              </div>`)}

            <!-- Image Controls -->
            <div id="m_b_img_controls" style="display: ${kind === 'image' ? 'block' : 'none'};">
              ${card('Images' + btag, `
              ${shared}
              <div class="cb_actions">
                <button id="m_b_up" class="menu_button"><i class="fa-solid fa-plus"></i> Add</button>
                <button id="m_b_url" class="menu_button" title="Add an image from a link"><i class="fa-solid fa-link"></i> Link</button>
                <button id="m_b_del" class="menu_button danger_button" ${!n ? 'disabled' : ''}><i class="fa-solid fa-trash-can"></i> Del</button>
              </div>
              <input type="file" id="m_b_file" accept="image/png,image/jpeg,image/gif,image/webp,.png,.jpg,.jpeg,.gif,.webp" multiple hidden>

              ${n > 0 ? `
              <div class="cb_carousel_nav">
                <button id="m_b_prev" class="menu_button" ${n < 2 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>
                <span>Image <b>${Math.round(cNum(src.idx, 0, 0, n - 1)) + 1}</b> of <b>${n}</b></span>
                <button id="m_b_next" class="menu_button" ${n < 2 ? 'disabled' : ''}><i class="fa-solid fa-chevron-right"></i></button>
              </div>
              <div class="cb_thumbs">${src.images.map((im, i) => `<img class="cb_thumb${i === src.idx ? ' active' : ''}" data-i="${i}" src="${escapeHTML(media(im.url))}" alt="">`).join('')}</div>` : `<div style="text-align:center;opacity:0.7;margin-top:8px;">No images yet</div>`}

              ${curImg ? `
              <div class="cb_row" style="margin-top: 10px;"><label>Crop:${btag}</label><span><span id="m_b_pval">${cNum(curImg.pos, 45, 0, 100)}</span>%</span></div>
              <input type="range" id="m_b_p" min="0" max="100" value="${cNum(curImg.pos, 45, 0, 100)}">
              ` : ''}`)}

              ${card('Rotation' + (ownKind ? ' ' + TAG : ''), `
                <label class="checkbox_label"><input type="checkbox" id="m_b_rot" ${ro.rotate ? 'checked' : ''}><span>Rotate through images</span></label>
                <div id="m_b_rot_body" class="${ro.rotate ? '' : 'cb_dim'}">
                  <div class="cb_row" style="margin-top: 8px;"><label>Every:</label><span><span id="m_b_rot_val">${ro.rotateSec}</span>s</span></div>
                  <input type="range" id="m_b_rot_sec" min="3" max="60" step="1" value="${ro.rotateSec}">
                  <div style="margin-top: 8px;"><strong>Change:</strong>${pills('brfx', [['fade', 'Crossfade'], ['swap', 'Instant']], ro.rotateFx)}</div>
                  <div style="margin-top: 8px;"><strong>Order:</strong>${pills('brord', [['order', 'In order'], ['shuffle', 'Shuffled']], ro.rotateOrder)}</div>
                </div>
                ${n < 2 ? '<div class="cb_hint">Rotation needs 2 or more images.</div>' : ''}
                ${ownKind ? '' : '<div class="cb_hint">Changes every character set to Global.</div>'}`)}
            </div>

            <!-- YouTube Controls -->
            <div id="m_b_yt_controls" style="display: ${kind === 'youtube' ? 'block' : 'none'};">
              ${card('YouTube Loop' + btag, `
              <label><strong>YouTube Video URL:</strong></label>
              ${shared}
              <input type="text" id="m_b_yt_url" class="text_pole" style="width: 100%; margin-top: 5px;" placeholder="https://youtube.com/watch?v=..." value="${escapeHTML(src.youtubeUrl || '')}">`)}
            </div>

            <!-- Video Controls -->
            <div id="m_b_vid_controls" style="display: ${kind === 'video' ? 'block' : 'none'};">
              ${card('Video' + btag, `
              ${shared}
              <div class="cb_row">
                <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${src.video ? escapeHTML(String(src.video).split('/').pop()) : '<span class="cb_hint">No video yet (mp4 or webm)</span>'}</span>
                <button id="m_b_vup" class="menu_button" style="margin:0;" title="Upload a video"><i class="fa-solid fa-upload"></i></button>
                <button id="m_b_vurl" class="menu_button" style="margin:0;" title="Use a link to a video"><i class="fa-solid fa-link"></i></button>
                <button id="m_b_vdel" class="menu_button danger_button" style="margin:0;" title="Remove the video" ${!src.video ? 'disabled' : ''}><i class="fa-solid fa-trash"></i></button>
              </div>
              <input type="file" id="m_b_vfile" accept="video/mp4,video/webm,.mp4,.webm" hidden>
              ${src.video ? `
              <div class="cb_row" style="margin-top: 10px;"><label>Crop:${btag}</label><span><span id="m_b_vpval">${cNum(src.videoPos, 50, 0, 100)}</span>%</span></div>
              <input type="range" id="m_b_vp" min="0" max="100" value="${cNum(src.videoPos, 50, 0, 100)}">` : ''}
              <div class="cb_hint">Loops without controls. The speaker button on the banner turns sound on or off, and your choice is remembered. Until you've clicked somewhere on the page, browsers may keep it muted.</div>`)}
            </div>

            ${card('Layout', `
              <label class="checkbox_label" ${!key ? 'style="opacity:0.5;pointer-events:none;"' : ''}>
                <input type="checkbox" id="m_b_lock" ${r.locked ? 'checked' : ''}><span>Lock to top ${TAG}</span>
              </label>
              <label class="checkbox_label" style="margin-top: 6px;${!key ? 'opacity:0.5;pointer-events:none;' : ''}">
                <input type="checkbox" id="m_b_overlap" ${r.overlap ? 'checked' : ''}><span>Overlap messages ${TAG}</span>
              </label>

            <div class="cb_row" style="margin-top: 15px;"><label>Banner Height:${btag}</label><span><span id="m_b_hval">${bl.height}</span>px</span></div>
            <input type="range" id="m_b_h" min="60" max="350" step="5" value="${bl.height}">
            <div id="m_b_guide" class="cb_hint" style="margin-top: 4px;">${escapeHTML(bannerGuideText())}</div>

            <div id="m_b_gap_wrapper" style="${r.overlap ? 'opacity: 0.5; pointer-events: none;' : ''}">
              <div class="cb_row" style="margin-top: 10px;"><label>Gap Below Banner:${btag}</label><span><span id="m_b_gapval">${bl.gap}</span>px</span></div>
              <input type="range" id="m_b_gap" min="0" max="40" step="1" value="${bl.gap}">
            </div>

            <div id="m_b_offset_wrapper" style="display: ${r.overlap ? 'block' : 'none'};">
              <div class="cb_row" style="margin-top: 10px;"><label>Overlap Offset (Push Messages Down): ${TAG}</label><span><span id="m_b_oval">${cNum(r.overlapOffset, 0, 0, 300)}</span>px</span></div>
              <input type="range" id="m_b_offset" min="0" max="300" step="5" value="${cNum(r.overlapOffset, 0, 0, 300)}" ${!key ? 'disabled' : ''}>
            </div>

            <div style="margin-top: 10px;"><strong>Transparent areas show:${btag}</strong>${pills('bbd', [['wallpaper', 'Wallpaper'], ['panel', 'Chat panel tint']], bl.backdrop === 'panel' ? 'panel' : 'wallpaper')}</div>
            ${ownKind ? '' : '<div class="cb_hint">Height, gap and transparent areas change every character set to Global.</div>'}`)}
        `, { sw: ['m_b_enable', s.bannerOn], legend: true })}

        ${pageHtml('pfp', `
            <div class="ntr_cols">
              ${getColHtml('ai', 'AI', s)}
              ${getColHtml('us', 'User', s)}
            </div>
        `, { sw: ['m_a_enable', s.avatarEnabled] })}

        ${reasoningSectionHtml(s)}
        ${textSectionHtml(s)}
        ${displaySectionHtml(s)}

        ${pageHtml('fg', `
            ${card('', `
            <div class="cb_row"><label>Opacity:</label><span><span id="m_f_oval">${s.fgOpacity ?? 100}</span>%</span></div>
            <input type="range" id="m_f_o" min="0" max="100" step="1" value="${s.fgOpacity ?? 100}">
            <label class="checkbox_label" style="margin-top: 8px;"><input type="checkbox" id="m_f_hidevn" ${s.fgHideVN ? 'checked' : ''}><span>Hide these in Visual Novel Mode</span></label>`)}

            <div class="ntr_glab">Images ${TAG}</div>
            ${chatOpen ? '' : '<div class="cb_hint" style="margin-bottom: 8px;">Open a character chat first. Foreground images are saved per character.</div>'}
            <div class="ntr_fgrid">
              ${['Left', 'Center', 'Right'].map(pos => `
                <div class="cb_col ntr_card" style="align-items: center; text-align: center;">
                  <strong>${pos} ${TAG}</strong>
                  <div style="width:100%; height:80px; background:rgba(0,0,0,0.3); border-radius:4px; margin:5px 0; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                    <img id="m_f_img_${pos}" src="${escapeHTML(media(F[pos]))}" style="max-width:100%; max-height:100%; object-fit:contain; display:${F[pos] ? 'block' : 'none'};">
                    <span id="m_f_none_${pos}" style="display:${F[pos] ? 'none' : 'block'}; opacity:0.5; font-size:12px;">Empty</span>
                  </div>
                  <div style="display:flex; gap:5px; width:100%;">
                    <button class="menu_button m_f_up" data-pos="${pos}" style="flex:1; padding:4px;" title="Upload ${pos} image" ${!chatOpen ? 'disabled' : ''}><i class="fa-solid fa-upload"></i></button>
                    <button class="menu_button m_f_url" data-pos="${pos}" style="flex:1; padding:4px;" title="Use a link for the ${pos} image" ${!chatOpen ? 'disabled' : ''}><i class="fa-solid fa-link"></i></button>
                    <button class="menu_button danger_button m_f_del" data-pos="${pos}" style="flex:1; padding:4px;" title="Clear ${pos} image" ${!F[pos] ? 'disabled' : ''}><i class="fa-solid fa-trash"></i></button>
                  </div>
                  <div class="cb_row" style="width:100%; margin-top:6px;"><label>Size:</label><span><span id="m_f_s_${pos}val">${cNum(F[pos + 'Scale'], 100, 10, 300)}</span>%</span></div>
                  <input type="range" class="m_f_scale" data-pos="${pos}" min="10" max="300" step="5" value="${cNum(F[pos + 'Scale'], 100, 10, 300)}" style="width:100%;">
                  <div style="width:100%; margin-top:6px; text-align:left;"><small>In Visual Novel Mode, sit:</small>${pills('fgl' + pos, [['behind', 'Behind sprites'], ['front', 'In front']], F[pos + 'Layer'])}</div>
                </div>
              `).join('')}
            </div>
            <input type="file" id="m_f_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
        `, { sw: ['m_f_enable', s.fgEnabled], legend: true })}

        ${vnSectionHtml(s)}
        </div>
        </div>
      </div>
      <div id="ntr_edge" title="Drag to resize"></div>
      <div id="ntr_preview"></div>`;

    document.body.appendChild(overlay);

    bindCollapses(overlay, s);
    // Rotation waits while the Header Banner page is open, showing the picked image, and starts a fresh count
    // when another page is picked or the menu closes.
    if (s.uiPage === 'banner' && rot.idx != null) { rot.idx = null; updateBanner(); }
    const rotRestart = () => { if (s.uiPage === 'banner') rot.idx = null; stopRotation(); updateBanner(); };
    bindPages(overlay, s, rotRestart);

    setupPanel(overlay, prevScroll);

    const close = () => { popDrag.ai = false; popDrag.us = false; overlay.remove(); syncPopouts(); rotRestart(); };
    overlay.querySelector('.cb_close_btn').onclick = close;
    
    if (!key) {
      const ch = overlay.querySelector('input[name="cbr_bscope"][value="char"]');
      ch.disabled = true;
      ch.closest('label').style.cssText = 'opacity:0.5;pointer-events:none;';
    }
    overlay.querySelector('#m_b_enable').onchange = function() {
      s.bannerOn = this.checked;
      save();
      renderAll();
      openCombinedModal();
    };
    onPills(overlay, 'bscope', (v) => {
      if (key) {
        if (v === 'char' && r.scope !== 'char') startChar(r);
        if (v === 'global') r.mode = '';
        r.scope = v;
      }
      if (BANNER_NOTE[v]) toastr.info(BANNER_NOTE[v], 'Banner');
      save();
      renderAll();
      openCombinedModal();
    });
    const rotSet = (k, v) => { if (ownKind) r[k] = v; else s[ROT_KEYS[k]] = v; save(); updateBanner(); };
    overlay.querySelector('#m_b_rot').onchange = function() {
      rotSet('rotate', this.checked);
      overlay.querySelector('#m_b_rot_body').classList.toggle('cb_dim', !this.checked);
    };
    const rotSec = overlay.querySelector('#m_b_rot_sec');
    rotSec.oninput = function() { overlay.querySelector('#m_b_rot_val').textContent = this.value; };
    rotSec.onchange = function() { rotSet('rotateSec', Number(this.value)); };
    onPills(overlay, 'brfx', (v) => rotSet('rotateFx', v));
    onPills(overlay, 'brord', (v) => rotSet('rotateOrder', v));
    onPills(overlay, 'bmode', (v) => {
      if (ownKind) r.mode = v; else s.bannerMode = v;
      save();
      overlay.querySelector('#m_b_img_controls').style.display = v === 'image' ? 'block' : 'none';
      overlay.querySelector('#m_b_yt_controls').style.display = v === 'youtube' ? 'block' : 'none';
      overlay.querySelector('#m_b_vid_controls').style.display = v === 'video' ? 'block' : 'none';
      renderAll();
    });

    // Banner video: uploaded as is (no re-encoding), or a link.
    const setVideo = (url) => {
      const old = src.video;
      src.video = url;
      src.videoPos = 50;
      save();
      updateBanner();
      deleteFileIfUnused(old);
      openCombinedModal();
    };
    const vfile = overlay.querySelector('#m_b_vfile');
    const vup = overlay.querySelector('#m_b_vup');
    vup.onclick = () => vfile.click();
    vfile.onchange = async () => {
      const f = vfile.files[0];
      vfile.value = '';
      if (!f) return;
      try {
        const path = await uploadVideo(f, 'banner', 'Banner', vup);
        if (!path) return;
        toastr.success('Banner video uploaded.', 'Banner');
        setVideo(path);
      } catch (e) {
        console.error('[NTR banner video]', e);
        toastr.error(e.message || 'Video upload failed', 'Banner');
        openCombinedModal();
      }
    };
    overlay.querySelector('#m_b_vurl').onclick = async () => {
      const url = await askVideoUrl('Banner video', overlay.querySelector('#m_b_vurl'));
      if (url) setVideo(url);
    };
    overlay.querySelector('#m_b_vdel').onclick = async function() {
      if (!src.video || !(await askYes(this, 'Remove the banner video?', 'Remove', { danger: true }))) return;
      setVideo('');
    };
    const vp = overlay.querySelector('#m_b_vp');
    if (vp) {
      vp.oninput = function() {
        src.videoPos = Number(this.value);
        overlay.querySelector('#m_b_vpval').textContent = this.value;
        const v = banner?.querySelector('.cb_vid');
        if (v) v.style.objectPosition = `50% ${this.value}%`;
      };
      vp.onchange = save;
    }

    // Foreground Event Bindings
    overlay.querySelector('#m_f_hidevn').onchange = function() { s.fgHideVN = this.checked; save(); ensureFgLayer(); };
    for (const pos of FG_POS) onPills(overlay, 'fgl' + pos, (val) => { F[pos + 'Layer'] = val; save(); ensureFgLayer(); });
    overlay.querySelector('#m_f_enable').onchange = function() {
      s.fgEnabled = this.checked; save(); ensureFgLayer();
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
        const url = await askImageUrl(`${pos} foreground image`, btn);
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
      fgFile.value = ''; // so the same file can be picked again after a failed upload
      const pos = pendingFgPos;
      try {
        const url = await uploadImage(f, `fg_${pos.toLowerCase()}`);
        const old = F[pos];
        F[pos] = url;
        deleteFileIfUnused(old);
        
        save();
        ensureFgLayer();
        openCombinedModal();
      } catch (e) {
        console.error('[NTR fg upload]', e);
        toastr.error(e.message || 'Foreground upload failed', 'Foreground');
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
    }

    const fi = overlay.querySelector('#m_b_file');
    overlay.querySelector('#m_b_up').onclick = () => fi.click();
    overlay.querySelector('#m_b_url').onclick = async () => {
      const url = await askImageUrl('Banner image', overlay.querySelector('#m_b_url'));
      if (!url) return;
      src.images.push({ url, pos: 45 });
      src.idx = src.images.length - 1;
      save(); updateBanner(); openCombinedModal();
    };
    fi.onchange = async () => { if (fi.files.length) { await addFiles([...fi.files]); openCombinedModal(); }};
    if (n) overlay.querySelector('#m_b_del').onclick = async function() { await removeCurrentBanner(this); openCombinedModal(); };
    if (n > 0) {
      overlay.querySelector('#m_b_prev').onclick = () => step(-1);
      overlay.querySelector('#m_b_next').onclick = () => step(1);
      overlay.querySelectorAll('.cb_thumb').forEach((t) => {
        t.onclick = () => { src.idx = Number(t.dataset.i); save(); updateBanner(); openCombinedModal(); };
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
    ytUrl.oninput = function() { src.youtubeUrl = this.value; };
    ytUrl.onchange = function() { save(); updateBanner(); };
    const lookSet = (k, v) => { if (ownKind) r[k] = v; else s[BANNER_LOOK_KEYS[k]] = v; };
    const bh = overlay.querySelector('#m_b_h');
    bh.oninput = function() { lookSet('height', Number(this.value)); overlay.querySelector('#m_b_hval').textContent = this.value; applyBannerSize(); overlay.querySelector('#m_b_guide').textContent = bannerGuideText(); };
    bh.onchange = save;
    const bgap = overlay.querySelector('#m_b_gap');
    bgap.oninput = function() { lookSet('gap', Number(this.value)); overlay.querySelector('#m_b_gapval').textContent = this.value; applyBannerSize(); };
    bgap.onchange = save;
    onPills(overlay, 'bbd', (v) => { lookSet('backdrop', v); save(); syncWallpaper(); });

    overlay.querySelector('#m_a_enable').onchange = function() {
      s.avatarEnabled = this.checked; save(); updateAvatarStyle();
    };
    
    bindThemes(overlay, s);
    bindWand(overlay, s);
    bindData(overlay);
    bindVNSection(overlay, s);
    bindDisplay(overlay, s);
    bindTextFormatting(overlay, s);

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

      overlay.querySelector(`#m_${prefix}_reset`).onclick = async function() {
        if (!(await askYes(this, `Reset all ${label} avatar settings to defaults? (Style stays as it is.)`, 'Reset'))) return;
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
  // The menu's pages, in the order of the icon column: id, icon, short name for the column, full name.
  // The only place they're written: the column and each page's title both read them from here.
  const PAGES = [
    ['themes', 'fa-bookmark', 'Themes', 'Themes'],
    ['banner', 'fa-images', 'Banner', 'Header Banner'],
    ['pfp', 'fa-user', 'Avatars', 'Avatar Management'],
    ['reasoning', 'fa-comment-dots', 'Reasoning', 'Reasoning Block Design'],
    ['text', 'fa-text-height', 'Text', 'Text Formatting'],
    ['display', 'fa-display', 'Display', 'UI Display'],
    ['fg', 'fa-shapes', 'Overlays', 'Foreground Images'],
    ['vn', 'fa-clapperboard', 'VN', 'Visual Novel Mode'],
  ];
  const navHtml = (cur) => PAGES.map(([id, icon, short, full]) =>
    `<button class="ntr_navi${id === cur ? ' on' : ''}" data-page="${id}" title="${full}"><i class="fa-solid fa-fw ${icon}"></i><span>${short}</span></button>`).join('')
    + '<div class="ntr_navfill"></div>';
  // One page: a big title with the section's icon (both from PAGES) and, for a section that can be switched off, its switch.
  // A switched-off section's settings are dimmed (see syncPageOff). A note sits between the title and the settings and is never dimmed.
  function pageHtml(sec, body, { sw = null, legend = false, note = '' } = {}) {
    const [, icon, , title] = PAGES.find(([id]) => id === sec);
    return `
      <section class="ntr_page${sw && !sw[1] ? ' ntr_off' : ''}" data-page="${sec}"${settings().uiPage === sec ? '' : ' hidden'}>
        <div class="ntr_phead">
          <i class="fa-solid fa-fw ${icon} ntr_picon"></i>
          <h3 class="ntr_ptitle">${title}</h3>
          ${sw ? `<input type="checkbox" id="${sw[0]}" class="ntr_pswitch" ${sw[1] ? 'checked' : ''} title="Turn ${title} on or off" aria-label="Turn ${title} on or off">` : ''}
          ${legend ? `<div class="cb_hint ntr_legend">${TAG} saved per character. Everything else is global.</div>` : ''}
        </div>
        ${note}
        <div class="ntr_pbody">${body}</div>
      </section>`;
  }
  // A group of settings: a small label, then the settings in a soft card.
  const card = (label, inner) => `${label ? `<div class="ntr_glab">${label}</div>` : ''}<div class="ntr_card">${inner}</div>`;
  // Long reference parts stay folded into one row until opened. Every other part is a card that's always open.
  const FOLDED = new Set(['vn_guide', 'vn_tags', 'vn_prompt', 'rb_css']);
  function subHead(sec, title) {
    if (FOLDED.has(sec)) return `<div class="cb_collapse_toggle ntr_fold" data-sec="${sec}" tabindex="0" role="button"><span>${title}</span><i class="fa-solid fa-chevron-right cb_chevron"></i></div>`;
    return `<div class="ntr_glab" data-sec="${sec}">${title}</div>`;
  }
  function pills(name, opts, cur) {
    return `<div class="cb_pills">${opts.map(([v, l, t]) => `<label class="cb_pill"${t ? ` title="${escapeHTML(t)}"` : ''}><input type="radio" name="cbr_${name}" value="${escapeHTML(v)}" ${v === cur ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>`;
  }
  const POS_GRID = [['tl', 'Top Left'], ['tc', 'Top Center'], ['tr', 'Top Right'], ['cl', 'Center Left'], ['cc', 'Center'], ['cr', 'Center Right'], ['bl', 'Bottom Left'], ['bc', 'Bottom Center'], ['br', 'Bottom Right']];
  function posGrid(name, cur) {
    return `<div class="cb_posgrid">${POS_GRID.map(([v, l]) =>`<label title="${l}"><input type="radio" name="cbr_${name}" value="${v}" ${v === cur ? 'checked' : ''}></label>`).join('')}</div>`;
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
        h.classList.toggle('ntr_open', open);
        h.setAttribute('aria-expanded', open ? 'true' : 'false');
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
      h.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); h.click(); } });
    });
  }

  // The icon column switches pages. On a phone or a narrow panel it hides behind the menu button.
  function bindPages(overlay, s, onSwitch) {
    const content = overlay.querySelector('.cb_popup_content');
    overlay.querySelectorAll('.ntr_navi').forEach((b) => {
      b.onclick = () => {
        content.classList.remove('ntr_navopen');
        if (b.dataset.page === s.uiPage) return;
        s.uiPage = b.dataset.page;
        save();
        showPage(overlay, s.uiPage);
        overlay.querySelector('.ntr_body').scrollTop = 0;
        onSwitch();
      };
    });
    overlay.querySelector('.ntr_navbtn').onclick = () => content.classList.toggle('ntr_navopen');
    overlay.querySelector('.ntr_shade').onclick = () => content.classList.remove('ntr_navopen');
    overlay.addEventListener('change', (e) => { if (e.target.classList.contains('ntr_pswitch')) syncPageOff(overlay); });
    syncPageOff(overlay);
  }
  function showPage(overlay, page) {
    overlay.querySelectorAll('.ntr_page').forEach((p) => { p.hidden = p.dataset.page !== page; });
    overlay.querySelectorAll('.ntr_navi').forEach((b) => b.classList.toggle('on', b.dataset.page === page));
  }
  // A switched-off section greys out: its icon in the column, its title, and its settings.
  function syncPageOff(overlay) {
    if (!overlay) return;
    overlay.querySelectorAll('.ntr_page').forEach((p) => {
      const sw = p.querySelector('.ntr_pswitch');
      const off = !!sw && !sw.checked;
      p.classList.toggle('ntr_off', off);
      overlay.querySelector(`.ntr_navi[data-page="${p.dataset.page}"]`)?.classList.toggle('ntr_off', off);
    });
  }

  // ===== UI Display =====
  // SillyTavern's flat chat style and round avatars are the absence of a class.
  const CHAT_CLS = { flat: '', bubbles: 'bubblechat', document: 'documentstyle' };
  const AV_CLS = { round: '', rectangle: 'big-avatars', square: 'square-avatars', rounded: 'rounded-avatars' };
  const ALL_CHAT = ['bubblechat', 'documentstyle'];
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
    const stChat = p && p.chat_display !== undefined ? [['', ...ALL_CHAT][Number(p.chat_display)]].filter(Boolean) : bodySnap.chat;
    const stAv = p && p.avatar_style !== undefined ? [['', ...ALL_AV][Number(p.avatar_style)]].filter(Boolean) : bodySnap.av;

    if (isOn() && s.ovEnabled && s.ovChatStyleOn) { setBodyClasses(ALL_CHAT, [CHAT_CLS[s.ovChatStyle]].filter(Boolean)); bodyTouched.chat = true; }
    else if (bodyTouched.chat) { setBodyClasses(ALL_CHAT, stChat); bodyTouched.chat = false; }

    if (isOn() && s.ovEnabled && s.ovAvatarOn) { setBodyClasses(ALL_AV, [AV_CLS[s.ovAvatar]].filter(Boolean)); bodyTouched.av = true; }
    else if (bodyTouched.av) { setBodyClasses(ALL_AV, stAv); bodyTouched.av = false; }

    if (!bodyObs && window.MutationObserver) {
      bodyObs = new MutationObserver(() => {
        const st = settings();
        if (isOn() && st.ovEnabled && (st.ovChatStyleOn || st.ovAvatarOn)) applyBodyOverrides();
      });
      bodyObs.observe(b, { attributes: true, attributeFilter: ['class'] });
    }
  }

  function overrideCss(s) {
    let v = '';
    if (s.ovEnabled) {
      if (s.ovWidthOn) v += `--sheldWidth: ${rangeNum(s, 'ovWidth')}vw !important; `;
      if (s.ovBlurOn) v += `--blurStrength: ${rangeNum(s, 'ovBlur')} !important; `;
      if (s.ovShadowOn) v += `--shadowWidth: ${rangeNum(s, 'ovShadow')} !important; `;
    }
    // Overall Font Scale sits in Text Formatting, so that section's switch is the one that counts.
    if (s.tfEnabled && s.ovFontOn) v += `--fontScale: ${s.ovFont} !important; `;
    return v ? `\n      :root { ${v}}\n` : '';
  }

  // Chrome, Edge and Safari use the -webkit- parts. Firefox only knows scrollbar-color and scrollbar-width,
  // and Chrome drops the -webkit- parts when it sees those, so Firefox gets them on their own.
  function scrollbarCss(s) {
    if (!s.ovEnabled) return '';
    const color = s.ovScrollColorOn && COLOR_RE.test(s.ovScrollColor) ? s.ovScrollColor : '';
    const track = s.ovScrollTrackOn && COLOR_RE.test(s.ovScrollTrack) ? s.ovScrollTrack : '';
    const width = s.ovScrollWidthOn ? rangeNum(s, 'ovScrollWidth') : 0;
    const radius = s.ovScrollShapeOn ? SCROLL_RADIUS[s.ovScrollShape] : '';
    let css = '';
    if (width) css += `\n      ::-webkit-scrollbar { width: ${width}px; height: ${width}px; }`;
    if (track) css += `\n      ::-webkit-scrollbar-track { background-color: ${track}; }\n      ::-webkit-scrollbar-corner { background-color: ${track}; }`;
    // SillyTavern keeps a 2px see-through gap and a thin outline around the thumb; narrow bars drop both so the thumb stays visible.
    const thumb = (color ? `background-color: ${color}; ` : '') + (radius ? `border-radius: ${radius}; ` : '') + (width && width < 8 ? 'border-width: 0; box-shadow: none; ' : '');
    if (thumb) css += `\n      ::-webkit-scrollbar-thumb:vertical, ::-webkit-scrollbar-thumb:horizontal { ${thumb}}`;
    let fx = '';
    if (color || track) fx += `scrollbar-color: ${color || 'auto'} ${track || 'transparent'}; `;
    if (width) fx += `scrollbar-width: ${width <= 8 ? 'thin' : 'auto'}; `;
    if (fx) css += `\n      @supports not selector(::-webkit-scrollbar) { * { ${fx}} }`;
    return css ? css + '\n' : '';
  }

  // Custom cursor. A CSS cursor shows its picture at the picture's own size, so each one is redrawn at the Size setting
  // first. Until that's ready, the last size drawn (or the system cursor) shows. A link from a site that doesn't allow
  // redrawing is used as it is.
  const cursorCache = new Map();
  const cursorLast = new Map();
  function cursorImg(src, size) {
    const key = `${size}|${src}`;
    if (cursorCache.has(key)) return cursorCache.get(key) || cursorLast.get(src) || null;
    if (cursorCache.size > 60) cursorCache.clear();
    cursorCache.set(key, null);
    const done = (c) => { cursorCache.set(key, c); cursorLast.set(src, c); updateAvatarStyle(); };
    const draw = (i) => {
      const k = size / Math.max(i.width, i.height);
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(i.width * k)); c.height = Math.max(1, Math.round(i.height * k));
      c.getContext('2d').drawImage(i, 0, 0, c.width, c.height);
      done({ url: c.toDataURL('image/png'), w: c.width, h: c.height });
    };
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => { try { draw(i); } catch (e) { loadImg(src).then((j) => done({ url: src, w: j.width, h: j.height })).catch(() => {}); } };
    i.onerror = () => loadImg(src).then((j) => done({ url: src, w: j.width, h: j.height })).catch(() => {});
    i.src = src;
    return cursorLast.get(src) || null;
  }
  const cursorSpot = (spot, w, h) => {
    const at = (c, n) => (c === 'l' || c === 't' ? 0 : c === 'c' ? Math.round(n / 2) : n - 1);
    return [at(spot[1], w), at(spot[0], h)];
  };
  // Which cursors have a picture right now, for onCursorOver.
  let cursorKinds = {};
  function cursorCss(s) {
    cursorKinds = {};
    if (!s.ovEnabled || !s.ovCursorOn) return '';
    const size = rangeNum(s, 'ovCursorSize');
    const one = (src, spot, fallback) => {
      const u = cUrl(src);
      const c = u && cursorImg(u, size);
      if (!c) return '';
      const [x, y] = cursorSpot(POS_GRID.some(([v]) => v === spot) ? spot : 'tl', c.w, c.h);
      return `url("${c.url}") ${x} ${y}, ${fallback}`;
    };
    const normal = one(s.ovCursorImg, s.ovCursorSpot, 'auto');
    const ptr = one(s.ovCursorPtrImg, s.ovCursorPtrSpot, 'pointer');
    cursorKinds = { normal: !!normal, ptr: !!ptr };
    let css = '';
    // Everything takes the Normal cursor from the page, except what has its own: SillyTavern's hand, resize edges and so on.
    // Typing boxes keep the text cursor.
    if (normal) css += `\n      html, body { cursor: ${normal}; }\n      :where(textarea, input:not([type]), input[type="text"], input[type="search"], input[type="number"], input[type="email"], input[type="url"], input[type="password"], [contenteditable="true"]) { cursor: text; }\n      [data-ntr-cur="normal"] { cursor: ${normal} !important; }`;
    if (ptr) css += `\n      [data-ntr-cur="ptr"] { cursor: ${ptr} !important; }`;
    return css ? css + '\n' : '';
  }
  // SillyTavern gives the hand to many kinds of things, too many to list. So the thing under the mouse is checked as the
  // mouse moves onto it: if its own cursor is the hand (or the plain arrow), it's marked to get the custom one instead.
  let cursorEl = null;
  function onCursorOver(e) {
    if (cursorEl) { cursorEl.removeAttribute('data-ntr-cur'); cursorEl = null; }
    const t = e.target;
    if (!(t instanceof Element) || (!cursorKinds.normal && !cursorKinds.ptr)) return;
    const c = getComputedStyle(t).cursor;
    const kind = c === 'pointer' && cursorKinds.ptr ? 'ptr' : c === 'default' && cursorKinds.normal ? 'normal' : '';
    if (kind) { t.setAttribute('data-ntr-cur', kind); cursorEl = t; }
  }

  // Override rows: a checkbox in front of each setting; unticked means SillyTavern's own value applies.
  function ovRow(s, onKey, label, inner) {
    return `
      <div class="cb_ovrow">
        <label class="checkbox_label"><input type="checkbox" class="m_o_on" data-key="${onKey}" ${s[onKey] ? 'checked' : ''}><span>${label}</span></label>
        <div class="m_o_body ${s[onKey] ? '' : 'cb_dim'}" data-for="${onKey}">${inner}</div>
      </div>`;
  }
  function ovSlider(s, key, unit, min, max, step) {
    return `
      <div class="cb_row"><input type="range" class="m_o_sl" data-key="${key}" min="${min}" max="${max}" step="${step}" value="${s[key]}" style="flex:1;"><span style="min-width:60px;text-align:right;"><span id="m_o_${key}val">${s[key]}</span>${unit}</span></div>`;
  }
  function ovColor(s, key) {
    return customElements.get('toolcool-color-picker')
      ? `<toolcool-color-picker class="m_o_col" data-key="${key}" color="${escapeHTML(s[key])}"></toolcool-color-picker>`
      : `<input type="color" class="m_o_col" data-key="${key}" value="${toHex(s[key])}">`;
  }
  function ovText(s, key) {
    return `<input type="text" class="text_pole m_o_lbl" data-key="${key}" value="${escapeHTML(s[key])}" maxlength="100" style="width:100%;">`;
  }
  function ovFx(s, p) {
    return pills(p.toLowerCase() + 'fx', [['glow', 'Glow'], ['shadow', 'Shadow'], ['outline', 'Outline']], s[p + 'Fx']) + ovSlider(s, p + 'FxStr', '', 1, 10, 1);
  }
  function fxRows(s, p) {
    return `
          ${ovRow(s, p + 'FxOn', 'Text Effect', ovFx(s, p))}
          ${ovRow(s, p + 'FxColorOn', 'Effect Color', ovColor(s, p + 'FxColor') + '<div class="cb_hint">Without this, Glow uses the text color, and Shadow and Outline are black.</div>')}`;
  }
  function ovFont(s, key) {
    return `<input type="text" class="text_pole m_o_txt" data-key="${key}" value="${escapeHTML(s[key])}" maxlength="60" placeholder="Font name, e.g. Lora" style="width:100%;">`;
  }

  // ===== Reasoning Block and Text Formatting =====
  const COLOR_RE = /^(#[0-9a-f]{3,8}|rgba?\(\s*[\d.]+%?\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*(,\s*[\d.]+%?\s*)?\))$/i;
  const FONT_RE = /^[\p{L}\p{N} _-]{0,60}$/u;
  const cleanFont = (v) => String(v || '').replace(/[^\p{L}\p{N} _-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 60);
  const NAME_WEIGHT = { normal: 400, bold: 700, extra: 800 };
  const RB_WEIGHT = { normal: 400, medium: 500, bold: 700 };
  const FX = ['glow', 'shadow', 'outline'];
  const FX_PARTS = ['rb', 'tfName', 'tfUser', 'tfAi'];
  const BORDER_STYLES = ['solid', 'dashed', 'dotted', 'double', 'glow'];
  const SCROLL_RADIUS = { pill: '999px', rounded: '6px', square: '0' };
  const PICK_KEYS = { tfNameWeight: Object.keys(NAME_WEIGHT), rbWeight: Object.keys(RB_WEIGHT), rbBorderStyle: BORDER_STYLES, bannerRotateFx: ['fade', 'swap'], bannerRotateOrder: ['order', 'shuffle'], ovScrollShape: Object.keys(SCROLL_RADIUS),
    ovCursorSpot: POS_GRID.map(([v]) => v), ovCursorPtrSpot: POS_GRID.map(([v]) => v) };
  for (const p of FX_PARTS) PICK_KEYS[p + 'Fx'] = FX;
  // The other pick-one settings a theme holds. The Visual Novel and opening choices match the menus in vn.js and opening.js.
  Object.assign(PICK_KEYS, {
    bannerBackdrop: ['wallpaper', 'panel'], ovChatStyle: Object.keys(CHAT_CLS), ovAvatar: Object.keys(AV_CLS),
    nodeShape: ['rounded', 'round', 'square', 'rect'], artBg: ['none', 'dusk', 'night', 'room', 'forest', 'custom'], artSprite: ['builtin', 'custom', 'none'],
    opPos: ['upper', 'center', 'lower'], opExit: ['stay', 'fade', 'rise'], opTrans: ['color', 'cross'],
  });
  for (const p of ['ai', 'us']) {
    Object.assign(PICK_KEYS, { [p + 'Style']: ['backdrop', 'popout'], [p + 'Side']: POS_GRID.map(([v]) => v), [p + 'Fit']: ['cover', 'contain', 'original'] });
  }
  // Where an empty color starts from: SillyTavern's own value for the same thing.
  const COLOR_FROM = {
    rbColor: '--reasoning-body-color', rbEm: '--SmartThemeEmColor', rbBorder: '--reasoning-body-color', tfNameColor: '--SmartThemeBodyColor',
    tfUserMain: '--SmartThemeBodyColor', tfUserEm: '--SmartThemeEmColor', tfUserUnder: '--SmartThemeUnderlineColor', tfUserQuote: '--SmartThemeQuoteColor',
    tfAiMain: '--SmartThemeBodyColor', tfAiEm: '--SmartThemeEmColor', tfAiUnder: '--SmartThemeUnderlineColor', tfAiQuote: '--SmartThemeQuoteColor',
    rbFxColor: '--SmartThemeShadowColor', tfNameFxColor: '--SmartThemeShadowColor', tfUserFxColor: '--SmartThemeShadowColor', tfAiFxColor: '--SmartThemeShadowColor',
    ovScrollColor: '--grey7070a',
  };
  const FONT_KEYS = ['rbFont', 'tfNameFont', 'tfUserFont', 'tfAiFont'];

  function stColor(key) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(COLOR_FROM[key]).trim();
    return COLOR_RE.test(v) ? v : 'rgba(220, 220, 210, 1)';
  }
  function toHex(c) {
    if (/^#[0-9a-f]{6}$/i.test(c)) return c;
    const m = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i.exec(String(c || ''));
    return m ? '#' + [m[1], m[2], m[3]].map((n) => Math.min(255, Math.round(Number(n))).toString(16).padStart(2, '0')).join('') : '#dcdcd2';
  }

  // Text Effect: Glow, Shadow or Outline. Without an Effect Color, Glow uses the text's own color and the others are black.
  function fxProps(s, p) {
    if (!s[p + 'FxOn'] || !FX.includes(s[p + 'Fx'])) return {};
    const n = Math.min(10, Math.max(1, Number(s[p + 'FxStr']) || 3));
    const fx = s[p + 'Fx'];
    const c = s[p + 'FxColorOn'] && COLOR_RE.test(s[p + 'FxColor']) ? s[p + 'FxColor'] : fx === 'glow' ? 'currentColor' : 'rgba(0, 0, 0, .8)';
    if (fx === 'glow') return { 'text-shadow': `0 0 ${n * 2}px ${c}, 0 0 ${n}px ${c}` };
    if (fx === 'shadow') return { 'text-shadow': `${Math.ceil(n / 3)}px ${Math.ceil(n / 3)}px ${n}px ${c}` };
    return { '-webkit-text-stroke': `${(n * 0.2).toFixed(1)}px ${c}`, 'paint-order': 'stroke fill' };
  }

  function textFormatCss(s) {
    const on = (k) => s[k + 'On'];
    const col = (k) => (on(k) && COLOR_RE.test(s[k]) ? s[k] : '');
    const font = (k) => { const f = on(k) ? cleanFont(s[k]) : ''; return f ? `"${f}", var(--mainFontFamily)` : ''; };
    const size = (k) => (on(k) ? Math.min(2, Math.max(0.5, Number(s[k]) || 1)) : 0);
    const rule = (sel, props) => {
      const body = Object.entries(props).filter(([, v]) => v !== '' && v != null).map(([p, v]) => `${p}: ${v} !important;`).join(' ');
      return body ? `\n      ${sel} { ${body} }` : '';
    };
    let css = '';

    // Reasoning block. SillyTavern colors it from these variables, so overriding them keeps its dimming and quote handling.
    const rs = s.rbEnabled ? size('rbSize') : 0;
    if (s.rbEnabled) css += rule('.mes_reasoning', {
      '--reasoning-body-color': col('rbColor'),
      '--reasoning-em-color': col('rbEm'),
      '--reasoning-saturation': on('rbSat') ? Math.min(100, Math.max(0, Number(s.rbSat) || 0)) / 100 : '',
      'border-left-color': col('rbBorder'),
      'font-family': font('rbFont'),
      'font-size': rs ? `calc(var(--mainFontSize) * ${rs})` : '',
      'font-weight': on('rbWeight') ? RB_WEIGHT[s.rbWeight] : '',
    });
    if (rs) css += rule('.mes_reasoning', { 'line-height': `calc(var(--mainFontSize) * ${rs} + .5rem)` });
    if (s.rbEnabled) {
      const bs = on('rbBorderStyle') && BORDER_STYLES.includes(s.rbBorderStyle) ? s.rbBorderStyle : '';
      css += rule('.mes_reasoning', {
        ...fxProps(s, 'rb'),
        'border-left-style': bs && bs !== 'glow' ? bs : '',
        'border-left-width': bs === 'double' ? '4px' : '',
        'box-shadow': bs === 'glow' ? `-3px 0 8px -2px ${col('rbBorder') || 'var(--reasoning-body-color)'}` : '',
      });
    }

    if (!s.tfEnabled) return css ? css + '\n' : '';

    // Names on chat messages, and the speaker's name tag in Visual Novel Mode.
    const ns = size('tfNameSize');
    css += rule('.mes .name_text', {
      color: col('tfNameColor'),
      'font-family': font('tfNameFont'),
      'font-size': ns ? `calc(var(--mainFontSize) * ${ns})` : '',
      'font-weight': on('tfNameWeight') ? NAME_WEIGHT[s.tfNameWeight] : '',
      ...fxProps(s, 'tfName'),
    });
    css += rule('#cb_node .cb_n_name', { color: col('tfNameColor'), 'font-family': font('tfNameFont'), ...fxProps(s, 'tfName') });

    // User and AI message text. The Visual Novel dialogue box uses the AI's.
    for (const [p, flag] of [['tfUser', 'true'], ['tfAi', 'false']]) {
      const m = `.mes[is_user="${flag}"] .mes_text`;
      const sz = size(p + 'Size');
      css += rule(m, { color: col(p + 'Main'), 'font-family': font(p + 'Font'), 'font-size': sz ? `calc(var(--mainFontSize) * ${sz})` : '', ...fxProps(s, p) });
      css += rule(`${m} i, ${m} em`, { color: col(p + 'Em') });
      css += rule(`${m} u`, { color: col(p + 'Under') });
      css += rule(`${m} q`, { color: col(p + 'Quote') });
      if (col(p + 'Em')) css += rule(`${m} q i, ${m} q em`, { color: 'inherit' });
    }
    css += rule('#cb_node .cb_n_text', { color: col('tfAiMain'), 'font-family': font('tfAiFont'), ...fxProps(s, 'tfAi') });
    css += rule('#cb_node .cb_n_text em', { color: col('tfAiEm') });
    css += rule('#cb_node .cb_q', { color: col('tfAiQuote') });
    if (col('tfAiEm')) css += rule('#cb_node .cb_q em', { color: 'inherit' });
    return css ? css + '\n' : '';
  }

  // Custom CSS for the reasoning block, in its own style tag so a typo can't break the extension's other styles.
  function syncCustomCss() {
    const s = settings();
    const v = isOn() && s.rbEnabled && s.rbCssOn ? String(s.rbCss || '').slice(0, 2000).trim() : '';
    let el = document.getElementById('ntr_rb_css');
    if (!v) { el?.remove(); return; }
    if (!el) { el = document.createElement('style'); el.id = 'ntr_rb_css'; document.head.appendChild(el); }
    el.textContent = `.mes_reasoning { ${v} }`;
  }

  // Google Fonts load only for font boxes that are ticked and filled in. One link per font, so a name Google
  // doesn't have can't break the others; the browser then uses a font of that name on the device, if any.
  function syncGoogleFonts() {
    const s = settings();
    const want = new Set();
    const live = (k) => (k === 'rbFont' ? s.rbEnabled : s.tfEnabled) && s[k + 'On'];
    if (isOn()) for (const k of FONT_KEYS) { const f = live(k) ? cleanFont(s[k]) : ''; if (f) want.add(f); }
    document.querySelectorAll('link[data-ntr-gf]').forEach((l) => { if (!want.has(l.dataset.ntrGf)) l.remove(); else want.delete(l.dataset.ntrGf); });
    for (const f of want) {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.dataset.ntrGf = f;
      l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f).replace(/%20/g, '+')}&display=swap`;
      document.head.appendChild(l);
    }
  }

  // Reasoning header text. ST rewrites the label while it thinks and when it finishes; the label is swapped on screen
  // only, after each of ST's updates. ST's own text is kept on the element so it comes back when the override is off.
  const RB_LABEL = { think: 'rbThink', done: 'rbDone', some: 'rbSome' };
  function rbTime(sec) {
    const m = window.moment;
    if (m && m.duration) {
      try { return m.duration(sec * 1000).locale(ctx().getCurrentLocale?.() || 'en').humanize({ s: 50, ss: 3 }); } catch (e) {}
    }
    return `${Math.round(sec)} seconds`;
  }
  function rbLabelFor(el, s) {
    if (!isOn() || !s.rbEnabled) return null;
    const d = el.dataset.duration;
    const state = d === undefined ? 'think' : d === 'unknown' ? 'some' : 'done';
    const k = RB_LABEL[state];
    if (!s[k + 'On']) return null;
    const txt = String(s[k] || '').slice(0, 100);
    return state === 'done' ? txt.replace(/\{time\}/gi, rbTime(Number(d) || 0)) : txt;
  }
  function syncReasoningLabels() {
    const s = settings();
    document.querySelectorAll('#chat .mes_reasoning_header_title').forEach((el) => {
      const want = rbLabelFor(el, s);
      if (want === null) {
        if (el.dataset.ntrSt !== undefined) { el.textContent = el.dataset.ntrSt; delete el.dataset.ntrSt; delete el.dataset.ntrOwn; }
        return;
      }
      if (el.textContent === want) return;
      // Text NTR wrote itself isn't ST's, so changing a label twice still brings back ST's own text later.
      if (el.dataset.ntrSt === undefined || el.textContent !== el.dataset.ntrOwn) el.dataset.ntrSt = el.textContent;
      el.textContent = want;
      el.dataset.ntrOwn = want;
    });
  }
  let rbObs = null, rbQueued = false;
  function watchReasoningLabels() {
    const chat = document.getElementById('chat');
    if (rbObs || !chat || !window.MutationObserver) return;
    rbObs = new MutationObserver(() => {
      if (rbQueued) return;
      rbQueued = true;
      requestAnimationFrame(() => { rbQueued = false; syncReasoningLabels(); });
    });
    rbObs.observe(chat, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['data-duration'] });
  }

  const FONT_NOTE = 'Fonts can be on your device (works offline) or from Google Fonts (downloaded from Google). Type the name exactly as it\'s written.';

  function reasoningSectionHtml(s) {
    return pageHtml('reasoning', `
          <div class="cb_hint">Only changes how the block looks. If no reasoning block shows up, turn on "Request model reasoning" in AI Response Configuration (Chat Completion), or "Auto-Parse" under Reasoning in AI Response Formatting (Text Completion and models that write their thinking into the reply).</div>
          <div class="cb_hint">Styles SillyTavern's reasoning (thinking) block. Tick a setting to change it; untick it to go back to ST's look. ${FONT_NOTE} In Header Text, type your own label; {time} becomes how long it thought, like "12 seconds".</div>
          ${card('Style', `
          ${ovRow(s, 'rbFontOn', 'Font', ovFont(s, 'rbFont'))}
          ${ovRow(s, 'rbSizeOn', 'Size', ovSlider(s, 'rbSize', 'x', 0.5, 2, 0.05))}
          ${ovRow(s, 'rbWeightOn', 'Weight', pills('rbweight', [['normal', 'Normal'], ['medium', 'Medium', 'SillyTavern\'s default'], ['bold', 'Bold']], s.rbWeight))}
          ${ovRow(s, 'rbColorOn', 'Text Color', ovColor(s, 'rbColor'))}
          ${ovRow(s, 'rbEmOn', 'Italics Color', ovColor(s, 'rbEm'))}
          ${ovRow(s, 'rbBorderOn', 'Border Color', ovColor(s, 'rbBorder') + '<div class="cb_hint">Without this, the border follows the text color.</div>')}
          ${ovRow(s, 'rbSatOn', 'Color Strength', ovSlider(s, 'rbSat', '%', 0, 100, 1) + '<div class="cb_hint">SillyTavern shows reasoning colors at 50%. 100% is full color, 0% is grey.</div>')}
          ${fxRows(s, 'rb')}
          ${ovRow(s, 'rbBorderStyleOn', 'Border Style', pills('rbbstyle', [['solid', 'Solid'], ['dashed', 'Dashed'], ['dotted', 'Dotted'], ['double', 'Double'], ['glow', 'Glow']], s.rbBorderStyle))}`)}
          ${subHead('rb_header', 'Header Text')}
          <div class="cb_collapse_content">
            ${ovRow(s, 'rbThinkOn', 'While Thinking', ovText(s, 'rbThink'))}
            ${ovRow(s, 'rbDoneOn', 'Finished', ovText(s, 'rbDone'))}
            ${ovRow(s, 'rbSomeOn', 'Finished, Time Unknown', ovText(s, 'rbSome'))}
          </div>
          ${subHead('rb_css', 'Advanced: Custom CSS')}
          <div class="cb_collapse_content">
            ${ovRow(s, 'rbCssOn', 'Custom CSS', `<textarea id="m_rb_css" class="text_pole" rows="5" maxlength="2000" spellcheck="false" placeholder="letter-spacing: 1px;&#10;& em { color: gold; }" style="width:100%;font-family:monospace;">${escapeHTML(s.rbCss)}</textarea>`
              + '<div class="cb_hint">CSS for the reasoning text, like <code>letter-spacing: 1px;</code>. Use <code>&amp; em { ... }</code> for italics, and add <code>!important</code> if a setting doesn\'t take. To style the "Thought for..." header or the rest of SillyTavern, use SillyTavern\'s own Custom CSS in User Settings. Saved in themes. Themes from someone else bring their CSS switched off, so you can check it before turning it on.</div>')}
          </div>
    `, { sw: ['m_rb_enable', s.rbEnabled] });
  }

  function textSectionHtml(s) {
    const part = (p) => `
          ${ovRow(s, p + 'FontOn', 'Font', ovFont(s, p + 'Font'))}
          ${ovRow(s, p + 'SizeOn', 'Size', ovSlider(s, p + 'Size', 'x', 0.5, 2, 0.05))}
          ${ovRow(s, p + 'MainOn', 'Main Text Color', ovColor(s, p + 'Main'))}
          ${ovRow(s, p + 'EmOn', 'Italics Color', ovColor(s, p + 'Em'))}
          ${ovRow(s, p + 'UnderOn', 'Underline Color', ovColor(s, p + 'Under'))}
          ${ovRow(s, p + 'QuoteOn', 'Quote Color', ovColor(s, p + 'Quote'))}${fxRows(s, p)}`;
    return pageHtml('text', `
          <div class="cb_hint">Styles chat text. Also used in the Visual Novel box: AI Text for the dialogue, Names for the name tag. Tick a setting to change it; untick it to go back to ST's look. ${FONT_NOTE}</div>
          ${card('', ovRow(s, 'ovFontOn', 'Overall Font Scale', ovSlider(s, 'ovFont', 'x', 0.5, 2, 0.05) + '<div class="cb_hint">Scales all of SillyTavern\'s text, menus included. The Size settings below are on top of this.</div>'))}
          ${subHead('tf_names', 'Names')}
          <div class="cb_collapse_content">
            <div class="cb_hint">The name at the top of each message, for both you and the character.</div>
            ${ovRow(s, 'tfNameFontOn', 'Font', ovFont(s, 'tfNameFont'))}
            ${ovRow(s, 'tfNameSizeOn', 'Size', ovSlider(s, 'tfNameSize', 'x', 0.5, 2, 0.05))}
            ${ovRow(s, 'tfNameWeightOn', 'Weight', pills('tfnweight', [['normal', 'Normal'], ['bold', 'Bold', 'SillyTavern\'s default'], ['extra', 'Extra Bold']], s.tfNameWeight))}
            ${ovRow(s, 'tfNameColorOn', 'Color', ovColor(s, 'tfNameColor'))}${fxRows(s, 'tfName')}
          </div>
          ${subHead('tf_user', 'User Text')}
          <div class="cb_collapse_content">${part('tfUser')}
          </div>
          ${subHead('tf_ai', 'AI Text')}
          <div class="cb_collapse_content">${part('tfAi')}
          </div>
    `, { sw: ['m_tf_enable', s.tfEnabled] });
  }

  function bindTextFormatting(overlay, s) {
    overlay.querySelectorAll('.m_o_col').forEach((el) => {
      const k = el.dataset.key;
      if (!COLOR_RE.test(s[k])) {
        s[k] = stColor(k);
        if (el.tagName === 'INPUT') el.value = toHex(s[k]); else el.setAttribute('color', s[k]);
      }
      const set = (v) => {
        if (!COLOR_RE.test(v) || v === s[k]) return;
        s[k] = v;
        save();
        updateAvatarStyle();
      };
      if (el.tagName === 'INPUT') el.oninput = () => set(el.value);
      else el.addEventListener('change', (e) => set(e.detail && e.detail.rgba));
    });
    overlay.querySelectorAll('.m_o_txt').forEach((el) => {
      el.onchange = () => {
        el.value = cleanFont(el.value);
        s[el.dataset.key] = el.value;
        save();
        updateAvatarStyle();
      };
    });
    for (const [id, key] of [['m_rb_enable', 'rbEnabled'], ['m_tf_enable', 'tfEnabled']]) {
      overlay.querySelector('#' + id).onchange = function() {
        s[key] = this.checked; save(); updateAvatarStyle();
      };
    }
    overlay.querySelectorAll('.m_o_lbl').forEach((el) => {
      el.onchange = () => {
        s[el.dataset.key] = el.value.slice(0, 100);
        save();
        updateAvatarStyle();
      };
    });
    onPills(overlay, 'rbweight', (v) => { s.rbWeight = v; save(); updateAvatarStyle(); });
    onPills(overlay, 'tfnweight', (v) => { s.tfNameWeight = v; save(); updateAvatarStyle(); });
    onPills(overlay, 'rbbstyle', (v) => { s.rbBorderStyle = v; save(); updateAvatarStyle(); });
    for (const p of FX_PARTS) onPills(overlay, p.toLowerCase() + 'fx', (v) => { s[p + 'Fx'] = v; save(); updateAvatarStyle(); });
    const cssBox = overlay.querySelector('#m_rb_css');
    cssBox.oninput = () => { s.rbCss = cssBox.value.slice(0, 2000); syncCustomCss(); };
    cssBox.onchange = save;
  }

  // One cursor picture: preview, Upload / Link / Remove, and the click point on the 3x3 grid.
  function cursorSlot(k, spotKey, label, hint, icon, s) {
    return `
      <div class="cb_cur_slot">
        <div class="cb_cur_row">
          <div class="cb_cur_prev" id="m_cur_prev_${k}" data-icon="${icon}"></div>
          <span class="cb_cur_name">${label}<small>${hint}</small></span>
          <button class="menu_button m_cur_up" data-k="${k}" title="Upload"><i class="fa-solid fa-upload"></i></button>
          <button class="menu_button m_cur_url" data-k="${k}" data-label="${label} cursor" title="Use a link"><i class="fa-solid fa-link"></i></button>
          <button class="menu_button m_cur_clr" data-k="${k}" title="Remove image"><i class="fa-solid fa-rotate-left"></i></button>
        </div>
        <div class="cb_hint" style="margin-top:6px;">Click point: the spot of the picture that clicks.</div>
        ${posGrid('o' + spotKey, s[spotKey])}
      </div>`;
  }

  function displaySectionHtml(s) {
    const row = (onKey, label, inner) => ovRow(s, onKey, label, inner);
    const sl = (key) => rangeSlider(s, key);
    return pageHtml('display', `
          <div class="cb_hint">Changes how SillyTavern looks without touching its own settings. Tick a setting to change it; untick it to go back to ST's value.</div>
          ${card('Chat', `
          <label class="checkbox_label" style="margin-bottom:6px;"><input type="checkbox" id="m_f_trans" ${s.chatTransparent ? 'checked' : ''}><span>Make Chat Panel Transparent</span></label>
          ${row('ovWidthOn', 'Chat Width', sl('ovWidth'))}
          ${row('ovBlurOn', 'Blur Strength', sl('ovBlur'))}
          ${row('ovShadowOn', 'Shadow Width', sl('ovShadow'))}
          ${row('ovChatStyleOn', 'Chat Style', pills('ochat', [['flat', 'Flat'], ['bubbles', 'Bubbles'], ['document', 'Document']], s.ovChatStyle))}
          ${row('ovAvatarOn', 'Avatar Shape', pills('oavatar', [['round', 'Round'], ['rectangle', 'Rectangle'], ['square', 'Square'], ['rounded', 'Rounded']], s.ovAvatar)
            + '<div class="cb_hint" style="margin-top:6px;">Shapes the normal chat avatars. When NTR Avatars is on, those replace the chat avatars, so this has nothing to shape.</div>')}`)}
          ${subHead('ov_scroll', 'Scrollbar')}
          <div class="cb_collapse_content">
            <div class="cb_hint">Changes every scrollbar in SillyTavern. Firefox can change only the colors and width; phones mostly show their own scrollbars.</div>
            ${row('ovScrollColorOn', 'Scrollbar Color', ovColor(s, 'ovScrollColor'))}
            ${row('ovScrollTrackOn', 'Track Color', ovColor(s, 'ovScrollTrack') + '<div class="cb_hint">The strip behind the scrollbar. SillyTavern leaves it see-through.</div>')}
            ${row('ovScrollWidthOn', 'Scrollbar Width', sl('ovScrollWidth'))}
            ${row('ovScrollShapeOn', 'Scrollbar Shape', pills('oscroll', [['pill', 'Pill', 'SillyTavern\'s default'], ['rounded', 'Rounded'], ['square', 'Square']], s.ovScrollShape))}
          </div>
          ${subHead('ov_cursor', 'Cursor')}
          <div class="cb_collapse_content">
            <div class="cb_hint">Your own pictures for the mouse cursor. Typing boxes keep the normal text cursor. Phones and tablets have no cursor.</div>
            ${row('ovCursorOn', 'Custom Cursor', cursorSlot('ovCursorImg', 'ovCursorSpot', 'Normal', 'Everywhere else.', 'fa-arrow-pointer', s)
              + cursorSlot('ovCursorPtrImg', 'ovCursorPtrSpot', 'Pointer', 'Links and buttons. Empty keeps the system hand.', 'fa-hand-pointer', s)
              + '<div class="cb_hint">Size</div>' + sl('ovCursorSize')
              + '<div class="cb_hint">Some browsers cut off cursors bigger than 32 px near the edge of the screen. Animated GIFs show only their first frame. Some sites don\'t allow their pictures to be resized: if Size does nothing for a link, upload the picture instead.</div>'
              + '<input type="file" id="m_cur_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>')}
          </div>
    `, { sw: ['m_ov_enable', s.ovEnabled] });
  }

  function bindDisplay(overlay, s) {
    overlay.querySelector('#m_f_trans').onchange = function() { s.chatTransparent = this.checked; save(); updateAvatarStyle(); };
    overlay.querySelector('#m_ov_enable').onchange = function() {
      s.ovEnabled = this.checked; save(); updateAvatarStyle();
    };
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
    onPills(overlay, 'oscroll', (v) => { s.ovScrollShape = v; save(); updateAvatarStyle(); });

    const curFile = overlay.querySelector('#m_cur_file');
    let curPending = null;
    const renderCursor = () => {
      for (const k of ['ovCursorImg', 'ovCursorPtrImg']) {
        const box = overlay.querySelector(`#m_cur_prev_${k}`);
        box.innerHTML = s[k] ? `<img src="${escapeHTML(s[k])}" alt="">` : `<i class="fa-solid ${box.dataset.icon}"></i>`;
        overlay.querySelector(`.m_cur_clr[data-k="${k}"]`).disabled = !s[k];
      }
    };
    const setCursor = (k, url) => {
      const old = s[k];
      s[k] = url;
      save(); updateAvatarStyle(); renderCursor();
      deleteFileIfUnused(old);
    };
    overlay.querySelectorAll('.m_cur_up').forEach((b) => { b.onclick = () => { curPending = b.dataset.k; curFile.click(); }; });
    overlay.querySelectorAll('.m_cur_url').forEach((b) => {
      b.onclick = async () => {
        const url = await askImageUrl(b.dataset.label, b);
        if (url) setCursor(b.dataset.k, url);
      };
    });
    overlay.querySelectorAll('.m_cur_clr').forEach((b) => { b.onclick = () => setCursor(b.dataset.k, ''); });
    curFile.onchange = async () => {
      if (!curFile.files.length || !curPending) return;
      try {
        setCursor(curPending, await uploadImage(curFile.files[0], 'cursor', { max: 128 }));
      } catch (e) {
        console.error('[NTR cursor upload]', e);
        toastr.error(e.message || 'Upload failed', 'UI Display');
      }
      curFile.value = '';
    };
    for (const k of ['ovCursorSpot', 'ovCursorPtrSpot']) onPills(overlay, 'o' + k, (v) => { s[k] = v; save(); updateAvatarStyle(); });
    renderCursor();
  }

  // ===== Per-character storage (kept inside the character card) =====
  const cardSnap = new Map();
  const cardTimers = new Map();
  const legacyMoved = new Set();
  const defaultBanner = () => ({ images: [], idx: 0, locked: true, overlap: false, overlapOffset: 0, youtubeUrl: '', video: '', videoPos: 50, scope: 'global', mode: '', rotate: false, rotateSec: 8, rotateFx: 'fade', rotateOrder: 'order', height: null, gap: null, backdrop: null, videoSound: null, sharedChecked: true });

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

  // The banner's content: images, YouTube link and video. A card's banner has it, and so does the shared Global banner.
  function cleanBannerSrc(b) {
    if (!isObj(b)) b = {};
    cleaned.add(b);
    const images = cList(b.images, 200, (im) => ({ ...im, url: cUrl(im.url), pos: cNum(im.pos, 45, 0, 100) })).filter((im) => im.url);
    return Object.assign(b, {
      images,
      idx: Math.round(cNum(b.idx, 0, 0, Math.max(0, images.length - 1))),
      youtubeUrl: cStr(b.youtubeUrl, 500),
      video: cUrl(b.video),
      videoPos: cNum(b.videoPos, 50, 0, 100),
    });
  }

  function cleanBanner(b) {
    cleanBannerSrc(b);
    Object.assign(b, {
      locked: cBool(b.locked, true),
      overlap: cBool(b.overlap, false),
      overlapOffset: cNum(b.overlapOffset, 0, 0, 300),
      scope: cPick(b.scope, ['global', 'char']),
      mode: cPick(b.mode, ['', 'image', 'youtube', 'video']),
      sharedChecked: cBool(b.sharedChecked, false),
      rotate: cBool(b.rotate, false),
      rotateSec: Math.round(cNum(b.rotateSec, 8, 3, 60)),
      rotateFx: cPick(b.rotateFx, ['fade', 'swap']),
      rotateOrder: cPick(b.rotateOrder, ['order', 'shuffle']),
      height: b.height == null ? null : Math.round(cNum(b.height, 120, 60, 350)),
      gap: b.gap == null ? null : Math.round(cNum(b.gap, 10, 0, 40)),
      backdrop: b.backdrop == null ? null : cPick(b.backdrop, ['wallpaper', 'panel']),
      videoSound: b.videoSound == null ? null : cBool(b.videoSound, false),
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
        logo: cPick(o.logo, ['upload', 'none']),
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

  function media(u) {
    return typeof u === 'string' ? u : '';
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

  // Uploaded files and links to other websites both count as content.
  const hasMediaRef = (o) => collectFileRefs(o).size > 0 || /"https?:\/\//i.test(JSON.stringify(o || {}));
  function cardIsEmpty(d) {
    const b = d.banner;
    const bannerEmpty = !b || (!(b.images || []).length && b.locked !== false && !b.overlap && !b.overlapOffset && !b.youtubeUrl && !b.video && b.scope !== 'char');
    const vn = d.vn || {};
    return bannerEmpty && !hasMediaRef(d.fg) && !hasMediaRef(vn) && !(vn.customSpk || []).length && !(vn.hiddenSpk || []).length && !(vn.locations || []).length
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
    if (wiping) return;
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
  const OWN_FILE = /^user\/files\/(?:banner|fg|ntr|theme|cursor|vnpfp|vnloc|vncg|vnart|vnmap|vnlogo|vnop)_[\w-]+\.(?:png|jpe?g|gif|webp|mp4|webm)$/;
  // Resolves to true if the file was deleted. Never throws.
  const deleteFile = (p) => fetch('/api/files/delete', { method: 'POST', headers: ctx().getRequestHeaders(), body: JSON.stringify({ path: p }) })
    .then((res) => res.ok).catch(() => false);

  // ===== Removing NTR data =====
  // `look`: settings and themes (the whole extension settings). `chars`: the NTR data in every character card, plus the
  // character, group chat and pre-2.1 copies kept in the settings. Files either one used go too, unless something
  // that stays still uses them. Cards that aren't loaded yet (lazy loading) are loaded first when `chars` is set;
  // without it, their files can't be checked, so no file is deleted.
  const CHAR_SETTINGS = ['chars', 'charData', 'groupData', 'legacyBackup'];
  async function removeData({ look = false, chars = false } = {}) {
    const c = ctx();
    const s = settings();
    wiping = true;
    for (const tm of cardTimers.values()) clearTimeout(tm);
    cardTimers.clear();
    const gone = new Set();
    if (chars) {
      for (let i = 0; i < c.characters.length; i++) {
        if (c.characters[i]?.shallow && typeof c.unshallowCharacter === 'function') await c.unshallowCharacter(i);
      }
      const unset = c.constants?.unset;
      const withData = c.characters.filter((ch) => ch?.data?.extensions?.ntr);
      for (const ch of withData) collectFileRefs(ch.data.extensions.ntr, gone);
      if (typeof c.writeExtensionFieldBulk === 'function' && unset) await c.writeExtensionFieldBulk(null, 'ntr', unset);
      else for (const ch of withData) await c.writeExtensionField(c.characters.indexOf(ch), 'ntr', unset ?? {});
      for (const k of CHAR_SETTINGS) {
        collectFileRefs(s[k], gone);
        if (k in DEFAULTS) s[k] = structuredClone(DEFAULTS[k]); else delete s[k];
      }
    }
    if (look) {
      collectFileRefs(s, gone);
      delete c.extensionSettings[MODULE];
    }
    const cs = c.characters || [];
    if (!cs.some((ch) => ch && ch.shallow)) {
      const keep = look ? new Set() : collectFileRefs(s);
      for (const ch of cs) collectFileRefs(ch?.data?.extensions?.ntr, keep);
      await Promise.all([...gone].filter((p) => OWN_FILE.test(p) && !keep.has(p)).map(deleteFile));
    }
    c.saveSettingsDebounced(); // the page reloads next, so `wiping` stays on until then
  }

  async function deleteFileIfUnused(path) {
    const p = normFile(path);
    if (!p || !OWN_FILE.test(p) || filesInUse().has(p)) return false;
    // With SillyTavern's lazy loading on, cards that haven't been opened yet aren't loaded, so their files can't be checked: keep the file.
    if ((ctx().characters || []).some((c) => c && c.shallow)) return false;
    return deleteFile(p);
  }

  // ===== Themes =====
  const PFP_KEYS = Object.keys(DEFAULTS).filter((k) => k.startsWith('ai') || k.startsWith('us'));
  const LOOK = {
    banner: { label: 'Banner look (height, gap, transparent areas, rotation)', keys: ['bannerHeight', 'bannerGap', 'bannerBackdrop', 'bannerRotate', 'bannerRotateSec', 'bannerRotateFx', 'bannerRotateOrder'] },
    bannerGlobal: { label: 'Global banner (images, YouTube link, video)', keys: ['bannerGlobal'] },
    pfp: { label: 'Avatar Management', keys: ['avatarEnabled', ...PFP_KEYS] },
    reasoning: { label: 'Reasoning Block Design', keys: Object.keys(DEFAULTS).filter((k) => k.startsWith('rb')) },
    text: { label: 'Text Formatting', keys: [...Object.keys(DEFAULTS).filter((k) => k.startsWith('tf')), ...FONT_SCALE_KEYS] },
    display: { label: 'UI Display', keys: ['chatTransparent', ...Object.keys(DEFAULTS).filter((k) => k.startsWith('ov') && !FONT_SCALE_KEYS.includes(k))] },
    fg: { label: 'Foreground look (opacity, hide in Visual Novel)', keys: ['fgOpacity', 'fgHideVN'] },
    vn: { label: 'Visual Novel (box, playback, emotions, tags, art kit, logo)', keys: ['nodeBoxWidth', 'nodeBoxMinH', 'nodeBoxMaxH', 'nodeBoxLift', 'nodeTextScale', 'nodeSprites', 'nodePortraitBox', 'nodeSpriteScale', 'nodeSpriteBase', 'nodeInject', 'locWord', 'nodeTypewriter', 'nodeSpeed', 'nodeAuto', 'nodeAutoDelay', 'nodeOpacity', 'nodePortrait', 'nodeShape', 'nodeUserMsgs', 'nodePicker', 'nodeHideEmo', 'emotions', 'emoDefault', 'delimSpkOpen', 'delimSpkClose', 'delimNarOpen', 'delimNarClose', 'delimEmo', 'narratorWord',
      'nodeSplitUntagged', 'nodeChoices', 'choiceSend', 'choiceWord', 'choiceSep', 'nodeEffects', 'effectWord', 'fxShake', 'fxFlash', 'fxFade',
      'weatherWord', 'wxRain', 'wxSnow', 'wxClear', 'nodeCG', 'nodeAutoSpk', 'cgWord', 'enterWord', 'exitWord', 'artBg', 'artBgImg', 'artSprite', 'artSpriteImg',
      'opLead', 'opFade', 'opSize', 'opPos', 'opHold', 'opExit', 'opTrans', 'opTransColor', 'opTransMs', 'opEarly', 'nodeMaps', 'mapGoText'] },
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

  // The tag symbols and keywords Visual Novel Mode reads. They only work together, so they're checked together: by Apply
  // in the menu's Tags & Delimiters (vn.js) and when a theme is imported or applied.
  const TAG_KEYS = ['delimSpkOpen', 'delimSpkClose', 'delimNarOpen', 'delimNarClose', 'delimEmo', 'narratorWord', 'locWord',
    'choiceWord', 'choiceSep', 'effectWord', 'weatherWord', 'cgWord', 'enterWord', 'exitWord', 'fxShake', 'fxFlash', 'fxFade', 'wxRain', 'wxSnow', 'wxClear'];
  function validateDelims(d) {
    const errs = [], warns = [];
    const lc = (x) => String(x || '').trim().toLowerCase();
    if (TAG_KEYS.some((k) => !d[k])) errs.push('Every field needs a value.');
    const delims = [d.delimSpkOpen, d.delimSpkClose, d.delimNarOpen, d.delimNarClose];
    const distinct = (arr) => { const a = arr.filter(Boolean).map(lc); return new Set(a).size === a.length; };
    if (!distinct([d.narratorWord, d.locWord, d.choiceWord, d.effectWord, d.weatherWord, d.cgWord, d.enterWord, d.exitWord])) errs.push('The narrator, location, choice, effect, weather, CG, enter and exit keywords all need to be different.');
    if (!distinct([d.fxShake, d.fxFlash, d.fxFade])) errs.push('The three effect names need to be different.');
    if (!distinct([d.wxRain, d.wxSnow, d.wxClear])) errs.push('The three weather names need to be different.');
    if ([d.locWord, d.choiceWord, d.effectWord, d.weatherWord, d.cgWord, d.enterWord, d.exitWord].some((w) => w && w.includes(':'))) errs.push('Tag keywords can\'t contain a colon.');
    if (d.choiceSep && delims.some((x) => x && x.includes(d.choiceSep))) errs.push('The choice separator can\'t appear inside the delimiters.');
    if (d.delimSpkOpen && d.delimSpkOpen === d.delimNarOpen) errs.push('Speaker and narrator need different opening delimiters.');
    if (d.delimEmo && delims.some((x) => x && x.includes(d.delimEmo))) errs.push('The emotion separator can\'t appear inside the other delimiters.');
    const all = [...delims, d.delimEmo].filter(Boolean);
    if (all.some((x) => /[*_`~]/.test(x))) warns.push('Contains * _ ` or ~, which markdown may turn into formatting.');
    if (all.some((x) => /["<>]/.test(x))) warns.push('Quotes or < > can clash with dialogue or HTML.');
    if (all.some((x) => x.length === 1)) warns.push('Single-character delimiters can match normal text by accident.');
    return { errs, warns };
  }

  const NONEMPTY_KEYS = new Set([...TAG_KEYS, 'mapGoText']);
  const IMG_KEYS = new Set(['artBgImg', 'artSpriteImg', 'ovCursorImg', 'ovCursorPtrImg']);
  // Theme files come from other people, so each number is kept to the range of its slider in the menu (keep these in step
  // with the sliders). Pop-out offsets go wider because dragging the picture can take them past the slider.
  // Entries with a step and unit, [min, max, step, unit], are the only copy: their sliders and code read them from here.
  const NUM_RANGE = {
    bannerHeight: [60, 350], bannerGap: [0, 40], bannerRotateSec: [3, 60], fgOpacity: [0, 100],
    rbSize: [0.5, 2], rbSat: [0, 100], ovFont: [0.5, 2], tfNameSize: [0.5, 2], tfUserSize: [0.5, 2], tfAiSize: [0.5, 2],
    ovWidth: [25, 100, 1, 'vw'], ovBlur: [0, 30, 1, ''], ovShadow: [0, 5, 1, ''], ovScrollWidth: [4, 20, 1, 'px'], ovCursorSize: [16, 128, 1, 'px'],
    nodeSpeed: [5, 80], nodeAutoDelay: [500, 8000], nodeOpacity: [30, 100], nodePortrait: [60, 240], nodeBoxWidth: [40, 100],
    nodeBoxMinH: [40, 300], nodeBoxMaxH: [10, 70], nodeBoxLift: [0, 400], nodeTextScale: [70, 180], nodeSpriteScale: [30, 200],
    opLead: [0, 15], opFade: [100, 4000], opSize: [10, 100], opTransMs: [100, 10000],
  };
  for (const p of FX_PARTS) NUM_RANGE[p + 'FxStr'] = [1, 10];
  for (const p of ['ai', 'us']) {
    Object.assign(NUM_RANGE, {
      [p + 'Scale']: [10, 300], [p + 'Pad']: [0, 400], [p + 'TopFade']: [0, 400], [p + 'BotFade']: [0, 400], [p + 'LeftFadePx']: [0, 400],
      [p + 'RightFadePx']: [0, 400], [p + 'Blur']: [0, 20], [p + 'PopX']: [-10000, 10000], [p + 'PopY']: [-10000, 10000],
      [p + 'LeftFade']: [0, 100], [p + 'RightFade']: [0, 100], // the old side fades, a % of the image width (see pctFadeToPx)
    });
  }
  // A number setting kept to its range, or its default if it isn't a number.
  const rangeNum = (s, k) => cNum(s[k], DEFAULTS[k], NUM_RANGE[k][0], NUM_RANGE[k][1]);
  // A slider whose range, step and unit come from NUM_RANGE.
  const rangeSlider = (s, k) => { const [min, max, step, unit] = NUM_RANGE[k]; return ovSlider(s, k, unit, min, max, step); };
  // The longest text a theme may hold, the same as the menu's text boxes. Tag symbols and keywords allow 16.
  const STR_MAX = { rbThink: 100, rbDone: 100, rbSome: 100, rbCss: 2000, mapGoText: 200 };
  const strMax = (k) => STR_MAX[k] ?? (TAG_KEYS.includes(k) ? 16 : 200);
  function validEmotions(v) {
    if (!Array.isArray(v) || !v.length || v.length > 100) return false;
    const ids = new Set(), names = new Set();
    for (const e of v) {
      const name = e && typeof e.name === 'string' ? e.name.trim().toLowerCase() : '';
      if (!e || !cRef(e.id) || !name || e.name.length > 100 || ids.has(e.id) || names.has(name)) return false;
      ids.add(e.id);
      names.add(name);
    }
    return true;
  }
  function validLookValue(k, v) {
    const d = DEFAULTS[k];
    // Default art and cursors follow the rules for card images: an uploaded file, a web link or an embedded image.
    if (IMG_KEYS.has(k)) return typeof v === 'string' && (v === '' || (cUrl(v) === v && !v.startsWith('data:video/')));
    if (k in COLOR_FROM) return typeof v === 'string' && (v === '' || COLOR_RE.test(v));
    if (k === 'ovScrollTrack') return typeof v === 'string' && COLOR_RE.test(v);
    if (FONT_KEYS.includes(k)) return typeof v === 'string' && FONT_RE.test(v);
    if (PICK_KEYS[k]) return PICK_KEYS[k].includes(v);
    if (k === 'bannerGlobal') return isObj(v);
    if (k === 'emotions') return validEmotions(v);
    if (k === 'emoDefault') return !!cRef(v);
    if (k === 'opTransColor') return typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
    if (typeof d === 'number') return typeof v === 'number' && Number.isFinite(v);
    if (typeof d === 'boolean') return typeof v === 'boolean';
    if (typeof d === 'string') return typeof v === 'string' && v.length <= strMax(k) && (!NONEMPTY_KEYS.has(k) || v.trim() !== '');
    return false;
  }

  // A theme's value as it gets saved or applied, or undefined to leave it out. Numbers outside their range are pulled in.
  function lookValue(k, v) {
    if (!validLookValue(k, v)) return undefined;
    if (NUM_RANGE[k]) return Math.min(NUM_RANGE[k][1], Math.max(NUM_RANGE[k][0], v));
    if (k === 'emotions') return v.map((e) => ({ id: e.id, name: e.name.trim() }));
    if (TAG_KEYS.includes(k)) return v.trim(); // as the menu's Apply saves them
    return structuredClone(v);
  }

  // Overall Font Scale moved from a theme's UI Display part to Text Formatting; themes saved or exported before keep it under display.
  function moveLookKeys(data) {
    const d = data && data.display;
    if (!d || typeof d !== 'object') return;
    for (const k of FONT_SCALE_KEYS) {
      if (!(k in d)) continue;
      if (!data.text || typeof data.text !== 'object') data.text = {};
      if (!(k in data.text)) data.text[k] = d[k];
      delete d[k];
    }
  }

  function cleanLookSection(sec, part) {
    const out = {};
    if (!part || typeof part !== 'object') return out;
    for (const k of LOOK[sec].keys) {
      const v = k in part ? lookValue(k, part[k]) : undefined;
      if (v !== undefined) out[k] = v;
    }
    // The Global banner's images and links get the same checks as a card's banner.
    if (out.bannerGlobal) out.bannerGlobal = cleanBannerSrc(out.bannerGlobal);
    // Tag symbols and keywords must pass the menu's Apply check, with your own filling in any the theme doesn't have.
    // If they clash, all of them are left out and yours stay.
    if (sec === 'vn' && TAG_KEYS.some((k) => k in out)) {
      const s = settings();
      if (validateDelims(Object.fromEntries(TAG_KEYS.map((k) => [k, k in out ? out[k] : s[k]]))).errs.length) for (const k of TAG_KEYS) delete out[k];
    }
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
    applyBannerSize();
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
    const cur = s.themes.some((t) => t.id === s.themeActive) ? s.themeActive : '';
    const opts = [['', 'None (default look)'], ...s.themes.map((t) => [t.id, t.name])]
      .map(([v, l]) => `<option value="${escapeHTML(v)}"${v === cur ? ' selected' : ''}>${escapeHTML(l)}</option>`).join('');
    const b = (id, icon, title, extra = '') => `<button class="menu_button ${extra}" id="${id}" title="${title}"><i class="fa-solid ${icon}"></i></button>`;
    return pageHtml('themes', `
        ${card('', `
          <div class="cb_hint">A theme holds your look: banner height, gap and rotation, the Global banner, Avatar Management, Reasoning Block Design, Text Formatting, UI Display, foreground opacity, and the Visual Novel box, tags and default art. Character content, like a character's own banner, is never part of a theme. Pick a theme to apply it.</div>
          <select id="m_t_sel" class="text_pole ntr_tsel">${opts}</select>
          <div class="ntr_tbar">
            ${b('m_t_new', 'fa-plus', 'Save current look as a new theme')}
            ${b('m_t_upd', 'fa-floppy-disk', 'Save current look over the selected theme')}
            ${b('m_t_ren', 'fa-pen', 'Rename the selected theme')}
            ${b('m_t_del', 'fa-trash', 'Delete the selected theme', 'danger_button')}
            ${b('m_t_imp', 'fa-file-import', 'Import a theme file')}
            ${b('m_t_exp', 'fa-file-export', 'Export the selected theme (or your current look)')}
          </div>
          <div id="m_t_panel"></div>
          <input type="file" id="m_t_file" accept=".json,application/json" hidden>`)}
        ${card('Data', `
          <div class="cb_hint">Your NTR data stays when you uninstall, so a reinstall picks up where you left off. Use this to remove it for good.</div>
          <button id="m_d_rm" class="menu_button danger_button ntr_dbtn"><i class="fa-solid fa-trash"></i> Remove NTR data</button>
          <div id="m_d_panel"></div>`)}
    `);
  }

  function bindThemes(overlay, s) {
    const panel = overlay.querySelector('#m_t_panel');
    const sel = overlay.querySelector('#m_t_sel');
    const active = () => s.themes.find((t) => t.id === s.themeActive) || null;
    const need = () => { const t = active(); if (!t) toastr.info('Pick a theme first.', 'Themes'); return t; };
    const nameTaken = (name, self) => s.themes.some((t) => t !== self && t.name.toLowerCase() === name.toLowerCase());
    const secBoxes = (secs) => secs.map((k) => `<label class="checkbox_label"><input type="checkbox" class="m_t_sec" value="${k}" checked><span>${LOOK[k].label}</span></label>`).join('');
    // The menu fills empty colors with SillyTavern's own (see bindTextFormatting), so those count as default too.
    const atDefault = (k) => JSON.stringify(s[k]) === JSON.stringify(DEFAULTS[k]) || (k in COLOR_FROM && s[k] === stColor(k));
    // Unsaved: the look differs from the selected theme, or from the default look when None is selected.
    const unsaved = () => { const t = active(); return t ? !lookMatches(t.data) : !Object.values(LOOK).every((L) => L.keys.every(atDefault)); };
    const shown = () => { sel.value = active() ? s.themeActive : ''; };

    const tbar = overlay.querySelector('.ntr_tbar');
    const askName = (value, self = null) => askText(tbar, {
      label: 'Theme name',
      value,
      ok: '<i class="fa-solid fa-floppy-disk"></i> Save',
      check: (name) => (!name ? { error: 'Type a name first.' }
        : nameTaken(name, self) ? { error: 'A theme with that name already exists.' } : { value: name }),
    });

    const resetLook = () => {
      const oldRefs = collectFileRefs(lookSnapshot());
      for (const sec of Object.keys(LOOK)) for (const k of LOOK[sec].keys) s[k] = structuredClone(DEFAULTS[k]);
      s.themeActive = null;
      settings();
      save();
      refreshVisuals();
      oldRefs.forEach((p) => deleteFileIfUnused(p));
      openCombinedModal();
    };
    const saveNew = async () => {
      const name = await askName(`Theme ${s.themes.length + 1}`);
      if (!name) return;
      const t = { id: newId('th'), name, data: lookSnapshot() };
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
      if (!t) { resetLook(); return; }
      s.themeActive = t.id;
      applyLook(t.data);
      openCombinedModal();
    };

    overlay.querySelector('#m_t_new').onclick = saveNew;

    // None can't be overwritten, so saving over it makes a new theme.
    overlay.querySelector('#m_t_upd').onclick = async () => {
      const t = active();
      if (!t) { saveNew(); return; }
      if (!(await askYes(tbar, `Save your current look over "${t.name}"?`, 'Save'))) return;
      const oldRefs = collectFileRefs(t.data);
      t.data = lookSnapshot();
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
      moveLookKeys(j.sections);
      const secs = Object.keys(LOOK).filter((k) => Object.keys(cleanLookSection(k, j.sections[k])).length);
      // Tag symbols that are fine one by one but clash together get left out (see cleanLookSection); say so, so it's clear why yours stay.
      const vnIn = isObj(j.sections.vn) ? j.sections.vn : {};
      const tagsOut = TAG_KEYS.some((k) => k in vnIn && validLookValue(k, vnIn[k])) && !TAG_KEYS.some((k) => k in cleanLookSection('vn', vnIn));
      if (!secs.length) {
        toastr.error(`That theme file has nothing this version can use.${tagsOut ? ' Its tag symbols and keywords clash with yours, so they\'re left out.' : ''}`, 'Themes');
        return;
      }
      // Someone else's Custom CSS can restyle all of SillyTavern, so it's shown here and comes in switched off.
      const css = secs.includes('reasoning') ? String(cleanLookSection('reasoning', j.sections.reasoning).rbCss || '').slice(0, 2000).trim() : '';
      panel.innerHTML = `
        <div class="ntr_tpanel">
          <strong>Import theme</strong>
          <label>Name <input type="text" id="m_t_iname" class="text_pole" value="${escapeHTML(String(j.name || 'Imported theme'))}"></label>
          <div class="cb_hint">Sections in this file. Untick any you don't want.</div>
          ${secBoxes(secs)}
          ${css ? `<div class="cb_hint">This theme includes Custom CSS for the reasoning block. It's added switched off: after applying the theme, check it under Reasoning Block Design, Advanced: Custom CSS, and tick it to use it.</div>
          <pre class="cb_code" style="max-height: 140px; overflow: auto; margin: 0;">${escapeHTML(css)}</pre>` : ''}
          ${tagsOut ? '<div class="cb_hint">This theme\'s tag symbols and keywords (Visual Novel Mode, Tags &amp; Delimiters) clash with each other or with yours, so they\'re left out and yours stay.</div>' : ''}
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
        if (data.reasoning && String(data.reasoning.rbCss || '').trim()) data.reasoning.rbCssOn = false;
        if (hasEmbedded(data)) {
          toastr.info('Uploading the theme\'s images...', 'Themes');
          const r = await unpackFiles(data);
          data = r.data;
          if (r.fails) toastr.warning(`${r.fails} image(s) couldn't be uploaded.`, 'Themes');
        }
        s.themes.push({ id: newId('th'), name, data });
        save();
        openCombinedModal();
        toastr.success(`Added "${name}". Pick it in the list to apply it.`, 'Themes');
      };
    };
  }

  // The wand button in the menu's title bar adds the menu to SillyTavern's wand menu. Lit means it's in there.
  function bindWand(overlay, s) {
    const b = overlay.querySelector('#m_wand');
    const show = () => {
      b.classList.toggle('on', !!s.wandEntry);
      b.setAttribute('aria-pressed', s.wandEntry ? 'true' : 'false');
      b.title = s.wandEntry
        ? 'In the wand menu next to the chat box. Click to take it out.'
        : 'Add Nitwit Tavern Redesign to the wand menu next to the chat box, so this menu opens from there';
    };
    show();
    b.onclick = () => {
      s.wandEntry = !s.wandEntry;
      save();
      syncWandEntry();
      show();
      toastr.info(s.wandEntry ? 'Added to the wand menu next to the chat box.' : 'Taken out of the wand menu.', 'Nitwit Tavern Redesign');
    };
  }

  function bindData(overlay) {
    const panel = overlay.querySelector('#m_d_panel');
    overlay.querySelector('#m_d_rm').onclick = () => {
      panel.innerHTML = `
        <div class="ntr_tpanel">
          <div><strong>This can't be undone.</strong> Pick what to remove:</div>
          <label class="checkbox_label"><input type="checkbox" id="m_d_look"><span><strong>Settings and themes</strong>: your look, saved themes and menu settings.</span></label>
          <label class="checkbox_label"><input type="checkbox" id="m_d_chars"><span><strong>Uploaded files and character data</strong>: banners, foreground images, Visual Novel art, maps and opening videos, plus the NTR data saved in each character card.</span></label>
          <div class="cb_hint">Want to keep your themes? Export them first, above.</div>
          <div class="cb_actions">
            <button class="menu_button danger_button" id="m_d_go"><i class="fa-solid fa-trash"></i> Remove</button>
            <button class="menu_button" id="m_d_cancel">Cancel</button>
          </div>
        </div>`;
      panel.querySelector('#m_d_cancel').onclick = () => { panel.innerHTML = ''; };
      const go = panel.querySelector('#m_d_go');
      go.onclick = async () => {
        const look = panel.querySelector('#m_d_look').checked;
        const chars = panel.querySelector('#m_d_chars').checked;
        if (!look && !chars) { toastr.warning('Tick at least one.', 'Remove NTR data'); return; }
        go.disabled = true;
        go.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Removing...';
        try {
          await removeData({ look, chars });
        } catch (e) {
          console.error('[NTR remove data]', e);
        }
        toastr.success('NTR data removed. Reloading...', 'Remove NTR data');
        // SillyTavern saves its settings about a second after a change.
        setTimeout(() => location.reload(), 2500);
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
    if (isNarrow()) { content.classList.add('ntr_sheet'); syncCompact(content); return; }
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
    syncCompact(content);
  }

  // On a phone or in a narrow panel, the icon column hides behind the menu button in the title bar.
  function syncCompact(content) {
    const compact = isNarrow() || content.getBoundingClientRect().width < 400;
    content.classList.toggle('ntr_compact', compact);
    if (!compact) content.classList.remove('ntr_navopen');
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
        syncCompact(content);
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
    const msg = modError.vn ? 'Visual Novel Mode failed to load: ' + escapeHTML(modError.vn) : 'Its settings appear here once it\'s switched on.';
    return pageHtml('vn', '',
      { sw: ['m_n_enable', s.nodeEnabled], note: `<div class="cb_hint ntr_pnote">${msg}</div>` });
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
        syncPageOff(document.getElementById('cb_modal_overlay'));
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
    const wrap = document.createElement('div');
    wrap.id = 'ntr_ext_bar';
    wrap.className = 'inline-drawer';
    wrap.innerHTML = `
      <div class="inline-drawer-toggle inline-drawer-header ntr_ext_head" title="Open the Nitwit Tavern Redesign menu">
        <b><span class="ntr_icon ntr_ext_icon"></span> Nitwit Tavern Redesign</b>
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

  // ===== Wand menu entry and /ntr: other ways to open the menu, even with the power off =====
  function syncWandEntry() {
    const menu = document.getElementById('extensionsMenu');
    const old = document.getElementById('ntr_wand_entry');
    if (!settings().wandEntry) { old?.remove(); return; }
    if (!menu || old) return;
    const b = document.createElement('div');
    b.id = 'ntr_wand_entry';
    b.className = 'list-group-item flex-container flexGap5 interactable';
    b.tabIndex = 0;
    b.title = 'Open the Nitwit Tavern Redesign menu';
    b.innerHTML = '<div class="extensionsMenuExtensionButton"><span class="ntr_icon"></span></div><span>Nitwit Tavern Redesign</span>';
    b.onclick = () => openCombinedModal();
    b.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b.click(); } };
    menu.appendChild(b);
  }

  function registerSlashCommand() {
    const { SlashCommandParser, SlashCommand } = ctx();
    if (!SlashCommandParser || !SlashCommand) return;
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
      name: 'ntr',
      aliases: ['NTR'],
      callback: () => { openCombinedModal(); return ''; },
      helpString: 'Opens the Nitwit Tavern Redesign menu.',
    }));
  }

  function injectExtensionMenuButton() {
    const tick = () => {
      injectExtBar();
      injectNodeToggle();
      syncWandEntry();
      if (isOn() && window.NTR.vn) window.NTR.vn.ensure();
    };
    tick();
    setInterval(tick, 1000);
  }

  window.NTR = window.NTR || {};
  window.NTR.api = {
    VERSION, DEFAULTS, ctx, save, settings, isOn, escapeHTML, media, fullResUrl, readDataURL, loadImg, askImageUrl, askVideoUrl,
    pills, posGrid, onPills, pageHtml, subHead, deleteFileIfUnused, syncVNToggle, TAG, store, refreshFg: () => ensureFgLayer(),
    openMenu: () => openCombinedModal(),
    closeMenu: () => { const ov = document.getElementById('cb_modal_overlay'); if (!ov) return false; ov.querySelector('.cb_close_btn')?.click(); return true; },
    loadModule, moduleError: (name) => modError[name] || '', removeData, askYes, askText, uploadDataUrl, uploadImage, uploadVideo, getYouTubeId, currentKey, newId, validateDelims,
    bannerImage: () => {
      const key = currentKey();
      if (!key) return '';
      const r = bannerSrc(peek(key));
      const im = r.images[r.idx] || r.images[0];
      return im ? media(im.url) : '';
    },
  };

  jQuery(() => {
    const { eventSource, event_types } = ctx();
    injectExtensionMenuButton();
    registerSlashCommand();
    document.addEventListener('pointerover', onCursorOver, true);
    window.addEventListener('resize', () => {
      syncWallpaper();
      layoutFg();
      const ov = document.getElementById('cb_modal_overlay');
      if (!ov) return;
      panelLayout(ov);
      const g = ov.querySelector('#m_b_guide');
      if (g) g.textContent = bannerGuideText();
    });
    eventSource.on(event_types.CHAT_CHANGED, () => {
      renderAll();
      window.NTR.vn?.queue(false);
      if (document.getElementById('cb_modal_overlay')) openCombinedModal();
    });

    for (const [name, anim] of [['CHARACTER_MESSAGE_RENDERED', true], ['USER_MESSAGE_RENDERED', true], ['MESSAGE_SWIPED', true], ['MESSAGE_EDITED', false], ['MESSAGE_UPDATED', false], ['MESSAGE_DELETED', false]]) {
      if (event_types[name]) eventSource.on(event_types[name], () => window.NTR.vn?.queue(anim));
    }
    if (event_types.APP_READY) eventSource.on(event_types.APP_READY, () => { renderAll(); window.NTR.vn?.queue(false); });

    const chat = document.getElementById('chat');
    if (chat) {
      chat.addEventListener('scroll', () => syncWallpaper(), { passive: true });
      new MutationObserver(() => {
        syncPopouts();
        const key = currentKey();
        if (!banner || !key || !settings().bannerOn) return;
        if (!peek(key).locked && chat.firstElementChild !== banner) chat.prepend(banner);
      }).observe(chat, { childList: true });
    }
    renderAll();
    const s0 = settings();
    if (isOn() && (s0.nodeEnabled || s0.vnUsed)) loadVN().then((vn) => { if (vn) vn.refresh(); });
  });
})();

// SillyTavern's "Also clean up extension data" option when deleting the extension (the manifest's clean hook):
// removes settings and themes, and the uploaded files no character card still uses. Character cards stay as they are.
export async function onClean() {
  await window.NTR?.api?.removeData({ look: true });
}
