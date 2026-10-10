(() => {
  const MODULE = 'chatvisuals';
  const VERSION = '2.29.0';
  const NTR_BASE = new URL('.', import.meta.url).href;
  const TAG = '<i class="fa-solid fa-tag ntr_tag" title="Saved per character"></i>';
  // Inside Phone Preview (preview.js) this is a look-only copy of SillyTavern in a frame. Nothing it does may be saved or
  // reach an AI service, so the main page's settings, chats and cards always win, and it stays quiet and out of reach.
  const PREVIEW = (() => { try { return window.frameElement?.id === 'ntr_phone_frame'; } catch (e) { return false; } })();
  if (PREVIEW) {
    blockSaves(window);
    document.addEventListener('play', (e) => { if (e.target instanceof HTMLMediaElement) e.target.muted = true; }, true);
    document.addEventListener('focusin', (e) => e.target.blur?.(), true);
    // No key reaches this copy, not even SillyTavern's own shortcuts. Escape still closes the preview.
    for (const type of ['keydown', 'keypress', 'keyup']) {
      window.addEventListener(type, (e) => {
        e.stopImmediatePropagation();
        e.preventDefault();
        const top = window.parent.NTR;
        if (type === 'keydown' && e.key === 'Escape' && !top?.api?.placing()) top?.preview?.close();
      }, true);
    }
  }
  const DEFAULTS = { 
    bannerOn: false,
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
    aiStyle: 'inline', aiPopX: 0, aiPopY: 0,
    aiSide: 'tl', aiFit: 'contain', aiShape: 'none', aiCorner: 10, aiFocus: 0, aiScale: 100, aiPad: 140, 
    aiTopFade: 0, aiBotFade: 180, aiLeftFade: 0, aiRightFade: 50, aiBlur: 0,
    aiEnabled: true, aiLeftFadePx: 0, aiRightFadePx: 150,
    aiFadeTop: 0, aiFadeBot: 0, aiFadeLeft: 0, aiFadeRight: 0, aiFadeTL: 0, aiFadeTR: 0, aiFadeBL: 0, aiFadeBR: 0,
    
    // User Settings
    usStyle: 'inline', usPopX: 0, usPopY: 0,
    usSide: 'tl', usFit: 'contain', usShape: 'none', usCorner: 10, usFocus: 0, usScale: 100, usPad: 140, 
    usTopFade: 0, usBotFade: 180, usLeftFade: 50, usRightFade: 0, usBlur: 0,
    usEnabled: true, usLeftFadePx: 150, usRightFadePx: 0,
    usFadeTop: 0, usFadeBot: 0, usFadeLeft: 0, usFadeRight: 0, usFadeTL: 0, usFadeTR: 0, usFadeBL: 0, usFadeBR: 0,

    // Foreground Settings
    fgEnabled: false,
    fgOpacity: 100,
    fgLeft: '',
    fgCenter: '',
    fgRight: '',
    fgLeftScale: 100,
    fgCenterScale: 100,
    fgRightScale: 100,

    // Edit Placement (dragging pop-outs and foreground images): editor choices, not part of themes
    placeSnap: false, placeGrid: 20,

    // Layout: the chat panel, menu bar and send bar. Desktop for screens wider than 1000px, Phone (layPh) for 1000px or
    // less. Places and sizes are a % of the screen. A part that hasn't been moved stays where SillyTavern puts it.
    layEnabled: false,
    layBarEdge: 'top', layBarMoved: false, layBarPos: 25, layBarLen: 50,
    layChatMoved: false, layChatX: 25, layChatY: 4, layChatW: 50, layChatH: 92,
    laySend: 'attached', laySendX: 25, laySendB: 0, laySendW: 50,
    layPhBarEdge: 'top', layPhBarMoved: false, layPhBarPos: 0, layPhBarLen: 100,
    layPhChatMoved: false, layPhChatX: 0, layPhChatY: 5, layPhChatW: 100, layPhChatH: 90,
    layPhSend: 'attached', layPhSendX: 0, layPhSendB: 0, layPhSendW: 100,

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

    // Reasoning Block (colors start empty and are filled from SillyTavern's own when the menu opens; empty status text means ST's own)
    rbEnabled: true, rbThink: '', rbDone: '', rbSome: '', rbTyping: 'off',
    rbBtnColorOn: false, rbBtnColor: '', rbBtnAlphaOn: false, rbBtnOpacity: 100, rbBtnTextOn: false, rbBtnText: '',
    rbBtnShape: 'rounded', rbBtnBorderOn: false, rbBtnBorder: 'solid', rbBtnBorderColorOn: false, rbBtnBorderColor: '', rbBtnFx: 'none', rbBtnFxSize: 8,
    rbFontOn: false, rbFont: '', rbSatOn: false, rbSat: 50, rbBoxShapeOn: false, rbBoxShape: 'rounded', rbBorderStyleOn: false, rbBorderStyle: 'none', rbBorderOn: false, rbBorder: '', rbEdgeFx: 'none', rbEdgeFxSize: 8,
    rbBoxColorOn: false, rbBoxColor: '', rbBoxAlphaOn: false, rbBoxOpacity: 100,
    rbPat: 'none', rbPatH: true, rbPatV: false, rbPatR: false, rbPatL: false, rbPatFade: 'tc', rbPatShade: 'light',
    rbPatColorOn: false, rbPatColor: '', rbPatThick: 1, rbPatSize: 1,
    rbCssOn: false, rbCss: '', rbBtnCssOn: false, rbBtnCss: '',

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
    ovBlurOn: false, ovBlur: 10, ovShadowOn: false, ovShadow: 2, ovAvatarOn: false, ovAvatar: 'round',
    // Interface Shape shapes the chat panel. Empty colors mean SillyTavern's own (see COLOR_FROM).
    ovShapeOn: false, ovShape: 'rounded', ovRound: 10,
    ovPanelBgOn: true, ovPanelBg: 'clear', ovPanelBgColor: '', ovPanelBgOpacity: 100,
    ovPanelBorderOn: false, ovPanelBorder: 'line', ovPanelBorderColor: '', ovPanelBorderWidth: 1, ovPanelBorderOpacity: 100,
    ovMesGapOn: false, ovMesGap: 5, ovNamesOn: false, ovNames: 'show',
    ovSendPosOn: false, ovSendPos: 'separate', ovSendGap: 8,
    ovScrollColorOn: false, ovScrollColor: '', ovScrollTrackOn: false, ovScrollTrack: 'rgba(0, 0, 0, 0)',
    ovScrollCssOn: false, ovScrollCss: '',
    ovCursorOn: false, ovCursorImg: '', ovCursorPtrImg: '', ovCursorDownImg: '', ovCursorTextImg: '', ovCursorSize: 32,

    // Menu state
    uiOpen: {},
    // Regexes page (regex.js): Global folders, and Preset folders by preset. Character folders live in the card.
    regexFolders: [],
    regexPresetFolders: {},
    uiPage: 'fg',
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
  // AI Message, User Message and Send Box each have their own Shape, Background and Border.
  const OV_PARTS = ['Ai', 'Us', 'Send'];
  for (const p of OV_PARTS) {
    Object.assign(DEFAULTS, {
      [`ov${p}ShapeOn`]: false, [`ov${p}Shape`]: 'rounded', [`ov${p}Round`]: 10,
      [`ov${p}BgOn`]: false, [`ov${p}Bg`]: 'color', [`ov${p}BgColor`]: '', [`ov${p}BgOpacity`]: 100,
      [`ov${p}BorderOn`]: false, [`ov${p}Border`]: 'line', [`ov${p}BorderColor`]: '', [`ov${p}BorderWidth`]: 1, [`ov${p}BorderOpacity`]: 100,
    });
  }
  // Overall Font Scale keeps its old UI Display key names so saved configs keep working; it now lives in Text Formatting.
  const FONT_SCALE_KEYS = ['ovFontOn', 'ovFont'];
  // Avatar Shape keeps its UI Display key names too; it now lives in Avatar Management.
  const AVATAR_SHAPE_KEYS = ['ovAvatarOn', 'ovAvatar'];

  const ctx = () => SillyTavern.getContext();
  const save = () => {
    if (PREVIEW) return;
    ctx().saveSettingsDebounced();
    const k = currentKey();
    if (k) scheduleCardFlush(k);
  };
  const isOn = () => settings().masterEnabled !== false;
  let banner = null;
  const popMsg = { ai: '', us: '' }; 

  const escapeHTML = (str) => {
    return String(str).replace(/[&<>'"]/g, match => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[match]));
  };

  // Requests that only read from SillyTavern's server, by the last part of their address. Most are sent as POST, like
  // the ones that save, delete, upload or ask an AI service for a reply.
  const READ_API = /^(get|all|read|find|list|folders|workflows|status|models|text-models|props|encode|decode|count|version|info|ping|discover)$/i;
  // Anything else sent to the server: saving, deleting, generating and the like.
  function isWrite(w, url, method) {
    if (String(method || 'GET').toUpperCase() === 'GET') return false;
    let path;
    try { path = new w.URL(String(url), w.location.href).pathname; } catch (e) { return true; }
    return path.startsWith('/api/') && !READ_API.test(path.split('/').filter(Boolean).pop() || '');
  }
  // Stops a window from sending them. Phone Preview's frame gets this from the main page as soon as it starts loading, and
  // again from its own copy of NTR. Blocked requests answer as if they worked, so nothing shows an error.
  function blockSaves(w) {
    if (w.__ntrNoSave) return;
    w.__ntrNoSave = true;
    const fetch0 = w.fetch;
    w.fetch = function (input, init) {
      const url = typeof input === 'string' || input instanceof w.URL ? input : input?.url;
      const method = init?.method || input?.method || 'GET';
      if (isWrite(w, url, method)) return w.Promise.resolve(new w.Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
      return fetch0.call(w, input, init);
    };
    const xhr = w.XMLHttpRequest.prototype, open0 = xhr.open, send0 = xhr.send;
    xhr.open = function (method, url) { this.ntrWrite = isWrite(w, url, method); return open0.apply(this, arguments); };
    xhr.send = function () { if (!this.ntrWrite) return send0.apply(this, arguments); };
    const nav = w.navigator;
    if (nav.sendBeacon) {
      const beacon0 = nav.sendBeacon.bind(nav);
      nav.sendBeacon = (url, data) => (isWrite(w, url, 'POST') ? true : beacon0(url, data));
    }
  }

  // The avatar fades by their place on the fade grid (the Position grid's cells): [setting, name]. The middle has none.
  const FADE_PARTS = {
    tl: ['FadeTL', 'Top Left'], tc: ['FadeTop', 'Top'], tr: ['FadeTR', 'Top Right'], cl: ['FadeLeft', 'Left'],
    cr: ['FadeRight', 'Right'], bl: ['FadeBL', 'Bottom Left'], bc: ['FadeBot', 'Bottom'], br: ['FadeBR', 'Bottom Right'],
  };

  // Avatar shapes, like SillyTavern's own: their height for a width of 1. Round is a circle; the others take Corners.
  const SHAPES = { round: 1, rectangle: 1.5, square: 1, heart: 1, star: 1 };
  const SHAPE_OPTS = [['none', 'None'], ['round', 'Circle'], ['rectangle', 'Rectangle'], ['square', 'Square'], ['heart', 'Heart'], ['star', 'Star']];
  // Heart and Star are outlines that cut the picture (a mask), drawn in a 100 x 100 box stretched over the frame. The
  // star's points are thick, so it keeps more of the picture.
  const svgMask = (d) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${d}"/></svg>`)}")`;
  const STAR = Array.from({ length: 10 }, (_, i) => {
    const a = (i * 36 - 90) * Math.PI / 180, r = i % 2 ? 24 : 50;
    return `${(50 + r * Math.cos(a)).toFixed(1)} ${(54.8 + r * Math.sin(a)).toFixed(1)}`;
  });
  const OUTLINES = {
    heart: svgMask('M50 96C22 76 0 56 0 30C0 13 13 2 28 2C38 2 46 8 50 17C54 8 62 2 72 2C87 2 100 13 100 30C100 56 78 76 50 96Z'),
    star: svgMask(`M${STAR.join('L')}Z`),
  };

  // Left and right fades used to be a % of the image width. The image box is Scale x 3 px wide.
  const pctFadeToPx = (pct, scale) => Math.min(400, Math.max(0, Math.round((Number(pct) || 0) / 100 * (Number(scale) || 100) * 3)));

  // Settings from before the UI Display and Reasoning Block Design redesigns, turned into the new ones so the chat looks
  // the same. Works on the settings and on a theme's keys put together; the new keys win if both are there.
  function upgradeLook(o) {
    const put = (k, v) => { if (!(k in o)) o[k] = v; };
    const msgs = (fn) => { for (const p of ['Ai', 'Us']) fn(p); };
    // NTR Avatars had its own see-through, 15px rounded messages.
    const ntrAv = (p) => o.avatarEnabled !== false && o[p.toLowerCase() + 'Enabled'] !== false;
    // Avatar Shape was one setting for SillyTavern's chat avatars and only showed where NTR Avatars was off. Each side
    // has its own Shape now, so it moves to those sides.
    if (o.ovAvatarOn) {
      for (const p of ['Ai', 'Us']) if (!ntrAv(p)) put(p.toLowerCase() + 'Shape', o.ovAvatar);
      o.ovAvatarOn = false;
    }
    // Rounded was a Shape of its own: a square with corners a fifth of its width.
    for (const p of ['ai', 'us']) if (o[p + 'Shape'] === 'rounded') { o[p + 'Shape'] = 'square'; put(p + 'Corner', 20); }
    // Avatar fades are a % of the picture, so they keep their share of it at any Image Scale and message height. Pixel
    // fades become a % of the picture at Scale 100 (300px wide), taken as a portrait 1.5 times as tall as wide. A smaller
    // Scale made pixel fades swallow the picture, so its own Scale would carry that over.
    // The first side fades were already a % of the width.
    for (const p of ['ai', 'us']) {
      const w = 300;
      const pct = (v, size) => Math.min(100, Math.max(0, Math.round((Number(v) || 0) / size * 100)));
      if (p + 'TopFade' in o) put(p + 'FadeTop', pct(o[p + 'TopFade'], w * 1.5));
      if (p + 'BotFade' in o) put(p + 'FadeBot', pct(o[p + 'BotFade'], w * 1.5));
      for (const side of ['Left', 'Right']) {
        if (p + side + 'FadePx' in o) put(p + 'Fade' + side, pct(o[p + side + 'FadePx'], w));
        else if (p + side + 'Fade' in o) put(p + 'Fade' + side, pct(o[p + side + 'Fade'], 100));
      }
    }
    // Make Chat Panel Transparent is the Chat Panel's Background set to Transparent.
    if ('chatTransparent' in o) {
      put('ovPanelBgOn', !!o.chatTransparent);
      put('ovPanelBg', 'clear');
      // Avatar Shape was in UI Display then, so UI Display's switch turned it off too. It's in Avatar Management now.
      if (o.ovEnabled === false) o.ovAvatarOn = false;
      delete o.chatTransparent;
    }
    // Chat Style is now made of the message settings, with Bubbles' own 10px corners, 1px line and 5px space (the defaults).
    // Empty colors are SillyTavern's own message and border colors.
    if ('ovChatStyle' in o || 'ovChatStyleOn' in o) {
      const st = o.ovChatStyleOn ? o.ovChatStyle : '';
      if (st === 'bubbles') {
        msgs((p) => {
          if (!ntrAv(p)) { put(`ov${p}ShapeOn`, true); put(`ov${p}Shape`, 'rounded'); put(`ov${p}Round`, DEFAULTS.ovAiRound); put(`ov${p}BgOn`, true); put(`ov${p}Bg`, 'color'); }
          put(`ov${p}BorderOn`, true); put(`ov${p}Border`, 'line'); put(`ov${p}BorderWidth`, DEFAULTS.ovAiBorderWidth);
        });
        put('ovMesGapOn', true); put('ovMesGap', DEFAULTS.ovMesGap);
      } else if (st === 'flat' || st === 'document') {
        msgs((p) => { put(`ov${p}BgOn`, true); put(`ov${p}Bg`, 'clear'); put(`ov${p}BorderOn`, true); put(`ov${p}Border`, 'none'); });
        if (st === 'document') { put('ovNamesOn', true); put('ovNames', 'hide'); }
      }
      delete o.ovChatStyle; delete o.ovChatStyleOn;
    }
    // Keep message background (NTR Avatars): unticked made that side's messages see-through.
    for (const [old, p] of [['aiMsgBg', 'Ai'], ['usMsgBg', 'Us']]) {
      if (!(old in o)) continue;
      if (o[old] === false && ntrAv(p)) { put(`ov${p}BgOn`, true); put(`ov${p}Bg`, 'clear'); }
      delete o[old];
    }
    // Reasoning's Background Color Transparency is now Opacity: 30% see-through is 70% opacity.
    for (const k of ['rbBtn', 'rbBox']) {
      if (!(k + 'Alpha' in o)) continue;
      const n = Number(o[k + 'Alpha']);
      put(k + 'Opacity', 100 - Math.min(100, Math.max(0, Number.isFinite(n) ? n : 0)));
      delete o[k + 'Alpha'];
    }
    // The reasoning status text had ticks; an unticked one meant ST's own text, which is now an empty box.
    if ('rbThinkOn' in o) {
      for (const k of ['rbThink', 'rbDone', 'rbSome']) { if (!o[k + 'On']) o[k] = ''; delete o[k + 'On']; }
    }
    // The box's Border Style had Glow, now a Border Effect over ST's own line, and Solid, which is ST's own line.
    // Both go back to unticked.
    if (o.rbBorderStyle === 'glow' || o.rbBorderStyle === 'solid') {
      if (o.rbBorderStyle === 'glow' && o.rbBorderStyleOn && (o.rbEdgeFx ?? 'none') === 'none') {
        o.rbEdgeFx = 'glow';
        put('rbEdgeFxSize', DEFAULTS.rbEdgeFxSize); // the old glow's size
      }
      o.rbBorderStyle = 'none';
      o.rbBorderStyleOn = false;
    }
    // The button's Border Style had None, which is ST's own look: unticked.
    if (o.rbBtnBorder === 'none') { o.rbBtnBorder = DEFAULTS.rbBtnBorder; o.rbBtnBorderOn = false; }
    return o;
  }

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
    // Border Style had no tick in 2.10.0, so a border picked there stays on.
    if ('rbBtnBorder' in s && !('rbBtnBorderOn' in s)) s.rbBtnBorderOn = s.rbBtnBorder !== 'none';
    if ('rbBorderStyle' in s && !('rbBorderStyleOn' in s)) s.rbBorderStyleOn = s.rbBorderStyle !== 'solid';
    if (!fresh) upgradeLook(s);
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
    if ('rbBtnShapeOn' in s && !s.rbBtnShapeOn) s.rbBtnShape = DEFAULTS.rbBtnShape;
    for (const k of ['rbBtnShapeOn', 'rbType', 'rbSizeOn', 'rbSize', 'rbWeightOn', 'rbWeight', 'rbColorOn', 'rbColor', 'rbEmOn', 'rbEm',
      'rbFxOn', 'rbFx', 'rbFxStr', 'rbFxColorOn', 'rbFxColor', 'ovScrollWidthOn', 'ovScrollWidth', 'ovScrollShapeOn', 'ovScrollShape', 'ovCursorSpot', 'ovCursorPtrSpot',
      'themeFontMoved', 'themeLookV2', 'avatarShapeMoved']) delete s[k];
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
    if (!s.themeLookV3) { s.themes.forEach((th) => upgradeTheme(th && th.data)); s.themeLookV3 = true; }
    if (!cleaned.has(s.bannerGlobal)) s.bannerGlobal = cleanBannerSrc(s.bannerGlobal);
    if (!Array.isArray(s.emotions) || !s.emotions.length) s.emotions = structuredClone(DEFAULTS.emotions);
    if (!s.emotions.some((e) => e.id === s.emoDefault)) s.emoDefault = s.emotions[0].id;
    return s;
  }

  function getAvatarCss(prefix, isUserStr, s) {
    const v = s[`${prefix}Side`][0]; 
    const h = s[`${prefix}Side`][1]; 
    const style = ['inline', 'popout'].includes(s[`${prefix}Style`]) ? s[`${prefix}Style`] : 'backdrop';
    const shape = SHAPES[s[`${prefix}Shape`]] ? s[`${prefix}Shape`] : null;
    // A shape crops the picture: it fills the shape like SillyTavern's own avatars, so Image Fit is for None only.
    const fit = shape ? 'cover' : s[`${prefix}Fit`];
    const n = (key) => rangeNum(s, prefix + key);
    const scale = n('Scale');
    const pad = n('Pad');
    const popX = n('PopX');
    const popY = n('PopY');
    
    const topFade = n('FadeTop');
    const botFade = n('FadeBot');
    const leftFade = n('FadeLeft');
    const rightFade = n('FadeRight');
    const blurAmount = n('Blur');
    
    const width = Math.floor(scale * 3); 
    // A shape is a frame Image Scale sizes: its width, and its height from the shape. Corners are a % of the width.
    const aspect = shape ? SHAPES[shape] : 1;
    const frameH = Math.round(width * aspect);
    const frameR = shape === 'round' ? '50%' : OUTLINES[shape] ? '0' : `${Math.round(width * n('Corner') / 100)}px`;

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
    `;

    if (style === 'popout') {
      // Position is on the chat panel, not the screen: Top Left is the chat's top-left corner (see layoutPop).
      const vA = `top: calc(var(--cb-ct, 0px) + var(--cb-ch, 100vh) * ${v === 't' ? 0 : v === 'b' ? 1 : 0.5}); bottom: auto;`;
      const hA = `left: calc(var(--cb-cl, 0px) + var(--cb-cw, 100vw) * ${h === 'l' ? 0 : h === 'r' ? 1 : 0.5}); right: auto;`;
      const tx = h === 'c' ? '-50%' : h === 'r' ? '-100%' : '0px';
      const ty = v === 'c' ? '-50%' : v === 'b' ? '-100%' : '0px';
      return `
        .mes[is_user="${isUserStr}"] .avatar { display: none !important; }
        #cb_pop_${prefix} {
          ${vA} ${hA}
          width: ${width}px; height: ${shape ? frameH + 'px' : 'auto'};
          ${shape ? `object-fit: cover; object-position: 50% ${n('Focus')}%; border-radius: ${frameR};` : ''}
          ${OUTLINES[shape] ? `-webkit-mask: ${OUTLINES[shape]} center / 100% 100% no-repeat; mask: ${OUTLINES[shape]} center / 100% 100% no-repeat;` : ''}
          transform: translate(calc(${tx} + ${popX}px), calc(${ty} + ${popY}px));
          ${blurAmount > 0 ? `filter: blur(${blurAmount}px);` : ''}
        }
        ${shared}
      `;
    }

    // --cb-ar is the picture's shape and --cb-nw its own width (see setAvatarRatio).
    const ar = 'var(--cb-ar, 0.6667)';
    const framed = !!shape;
    // Backdrop's box is a frame placed by Position, no taller than the message, which clips it to its own corners. A
    // shape's frame is the shape. None's is the picture's own shape, Image Scale wide (Original: the picture's own
    // width). In a short message Fit shrinks it to show the whole picture; Fill and Original keep their width and get
    // cut off.
    const noneW = fit === 'original' ? `var(--cb-nw, ${width}px)` : `${width}px`;
    const boxH = framed ? `${frameH}px` : `calc(${noneW} / ${ar})`;
    const boxAR = framed ? `1 / ${aspect}` : fit === 'contain' ? ar : '';
    const boxPos = (h === 'l' ? 'left: 0 !important; right: auto !important;' : h === 'c' ? 'left: 50% !important; right: auto !important;' : 'left: auto !important; right: 0 !important;')
      + (v === 't' ? ' top: 0 !important; bottom: auto !important;' : v === 'b' ? ' top: auto !important; bottom: 0 !important;' : ' top: 50% !important; bottom: auto !important;')
      + ` height: min(100%, ${boxH}) !important;${boxAR ? ` aspect-ratio: ${boxAR} !important;` : ''}`
      + ` transform: translate(${h === 'c' ? '-50%' : '0'}, ${v === 'c' ? '-50%' : '0'}) !important;`;
    const boxW = boxAR ? 'auto' : noneW;

    const hMask = `linear-gradient(to right, transparent 0%, black ${leftFade}%, black ${100 - rightFade}%, transparent 100%)`;
    const vMask = `linear-gradient(to bottom, transparent 0%, black ${topFade}%, black ${100 - botFade}%, transparent 100%)`;
    // A corner fade is a rounded fade from that corner, reaching its % of the picture's width and height.
    const corners = [['TL', '0% 0%'], ['TR', '100% 0%'], ['BL', '0% 100%'], ['BR', '100% 100%']]
      .filter(([k]) => n('Fade' + k) > 0)
      .map(([k, at]) => `radial-gradient(${n('Fade' + k)}% ${n('Fade' + k)}% at ${at}, transparent 0%, black 100%)`);
    const masks = [...(OUTLINES[shape] ? [OUTLINES[shape]] : []), hMask, vMask, ...corners].join(', ');
    // The fades go on the avatar's box, which is what shows of the picture.
    const maskCss = `-webkit-mask-image: ${masks} !important; -webkit-mask-composite: source-in !important;`
      + ` mask-image: ${masks} !important; mask-composite: intersect !important;`
      + ' -webkit-mask-size: 100% 100% !important; mask-size: 100% 100% !important; -webkit-mask-repeat: no-repeat !important; mask-repeat: no-repeat !important;';

    // The image is sized to the picture itself: Fill covers the box and gets cropped by it, Fit fits inside it, Original
    // keeps the picture's own size. 100cqw and 100cqh are the box's width and height.
    const imgW = fit === 'contain' ? `min(100cqw, 100cqh * ${ar})` : fit === 'original' ? 'auto' : `max(100cqw, 100cqh * ${ar})`;
    // Crop Focus picks which part of a picture taller than its box stays: 0% the top, 100% the bottom. Sideways, In Line
    // and shapes keep the picture centered and None follows Position.
    const ih = framed || style === 'inline' ? 'c' : h;
    const focus = n('Focus');
    const imgBoxCss = (ih === 'l' ? 'left: 0 !important; right: auto !important;' : ih === 'r' ? 'left: auto !important; right: 0 !important;' : 'left: 50% !important; right: auto !important;')
      + ` top: ${focus}% !important; bottom: auto !important;`
      + ` transform: translate(${ih === 'c' ? '-50%' : '0'}, -${focus}%) !important;`
      + ` width: ${imgW} !important; height: auto !important; max-width: none !important; max-height: none !important;`
      + (fit === 'original' ? '' : ` aspect-ratio: ${ar} !important;`);
    const imgCss = `
      #chat .mes[is_user="${isUserStr}"] .avatar img {
        position: absolute !important; ${imgBoxCss}
        display: block !important; margin: 0 !important; padding: 0 !important; border: none !important; border-radius: 0 !important;
        -webkit-mask-image: none !important; mask-image: none !important;
        object-fit: fill !important;
      }`;

    if (style === 'inline') {
      // In Line: the avatar stays in SillyTavern's avatar spot, in the message's flow, so the text never goes under it.
      // The left or right of the grid puts it on that side of the text and its row lines it up with the text's top,
      // middle or bottom. The middle column puts it above the text, or below it on the bottom row.
      const where = h === 'c' ? (v === 'b' ? 'below' : 'above') : h === 'r' ? 'right' : 'left';
      const stacked = where === 'above' || where === 'below';
      const boxShape = framed ? `aspect-ratio: 1 / ${aspect} !important; border-radius: ${frameR} !important;` : `aspect-ratio: ${ar} !important; border-radius: 0 !important;`;
      // The row's direction is set here too: themes often flip User messages, which would swap left and right.
      return `
      #chat .mes[is_user="${isUserStr}"] { flex-direction: row !important; }
      ${stacked ? `#chat .mes[is_user="${isUserStr}"] { flex-wrap: wrap !important; }
      #chat .mes[is_user="${isUserStr}"] .mes_block { flex: 0 0 100% !important; }` : ''}
      #chat .mes[is_user="${isUserStr}"] .mesAvatarWrapper {
        order: ${where === 'right' || where === 'below' ? 1 : 0} !important;
        ${stacked ? 'flex: 0 0 100% !important; display: flex !important; flex-direction: column !important; align-items: center !important;'
          : `align-self: ${v === 't' ? 'flex-start' : v === 'b' ? 'flex-end' : 'center'} !important;`}
      }
      #chat .mes[is_user="${isUserStr}"] .avatar {
        position: relative !important; flex: none !important;
        width: ${fit === 'original' ? `var(--cb-nw, ${width}px)` : `${width}px`} !important; height: auto !important; max-width: 40vw !important; ${boxShape}
        overflow: hidden !important; container-type: size !important;
        margin: 0 !important; padding: 0 !important; background: transparent !important; border: none !important; cursor: pointer;
        ${maskCss}
        ${filterRule}
      }
      ${imgCss}
    `;
    }

    return `
      .mes[is_user="${isUserStr}"] .avatar { 
        position: absolute !important; ${boxPos}
        width: ${boxW} !important; max-width: 80% !important; 
        margin: 0 !important; padding: 0 !important; z-index: 0 !important; pointer-events: none !important; 
        overflow: hidden !important; container-type: size !important; border-radius: ${framed ? frameR : '0'} !important;
        display: block !important; background: transparent !important; border: none !important;
        ${maskCss}
        ${filterRule} 
      }
      ${imgCss}
      ${shared}
    `;
  }

  // A chat avatar picture's shape and width, so the image can be sized to the picture (see getAvatarCss).
  function setAvatarRatio(img) {
    if (!img.naturalWidth || !img.naturalHeight) return;
    img.style.setProperty('--cb-ar', (img.naturalWidth / img.naturalHeight).toFixed(4));
    img.parentElement?.style.setProperty('--cb-nw', img.naturalWidth + 'px');
    img.parentElement?.style.setProperty('--cb-ar', (img.naturalWidth / img.naturalHeight).toFixed(4));
  }

  // NTR's Backdrop shows the full-size picture, not SillyTavern's small thumbnail. It's loaded first and only swapped
  // in once it's there: SillyTavern replaces a chat avatar that fails to load with a "missing" icon.
  function fullAvatar(img) {
    const mes = img.closest('#chat .mes');
    const src = img.getAttribute('src');
    if (!mes || !src) return;
    const p = mes.getAttribute('is_user') === 'true' ? 'us' : 'ai';
    const s = settings();
    if (!ntrAvatars(s, p) || s[p + 'Style'] === 'popout') return;
    const full = fullResUrl(src);
    if (full === src || img.dataset.ntrFull === full) return;
    img.dataset.ntrFull = full;
    const pre = new Image();
    pre.onload = () => { if (img.getAttribute('src') === src) img.src = full; };
    pre.src = full;
  }

  // SillyTavern's own chat avatars in a side's Shape, where NTR Avatars is off for that side.
  function stShapeCss(flag, shape, corner, focus) {
    const [w, h] = shape === 'rectangle' ? ['calc(var(--avatar-base-width) * 1.2)', 'calc(var(--avatar-base-height) * 1.8)'] : ['var(--avatar-base-width)', 'var(--avatar-base-height)'];
    const outline = OUTLINES[shape];
    const r = shape === 'round' ? 'var(--avatar-base-border-radius-round)' : outline ? '0' : `calc(${w} * ${corner / 100})`;
    return `\n      #chat .mes[is_user="${flag}"] .avatar, #chat .mes[is_user="${flag}"] .avatar img { width: ${w} !important; height: ${h} !important; border-radius: ${r} !important; object-fit: cover !important; object-position: 50% ${focus}% !important; }\n`
      + (outline ? `      #chat .mes[is_user="${flag}"] .avatar img { border: none !important; box-shadow: none !important; -webkit-mask: ${outline} center / 100% 100% no-repeat !important; mask: ${outline} center / 100% 100% no-repeat !important; }\n` : '');
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
    layer.innerHTML = '<img id="cb_pop_ai" alt="" draggable="false"><img id="cb_pop_us" alt="" draggable="false">';
    document.body.appendChild(layer);
    const chat = document.getElementById('chat');
    if (chat && window.ResizeObserver) new ResizeObserver(() => layoutPop()).observe(chat);
    layoutPop();
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
        drawPlace();
      };
    }
    return layer;
  }

  // Pop-outs are placed on the chat panel, so the layer keeps the panel's place on screen.
  function layoutPop() {
    const layer = document.getElementById('cb_pop_layer');
    const chat = document.getElementById('chat');
    if (!layer || !chat) return;
    const r = chat.getBoundingClientRect();
    if (!r.width || !r.height) return;
    for (const [k, v] of [['cl', r.left], ['ct', r.top], ['cw', r.width], ['ch', r.height]]) layer.style.setProperty(`--cb-${k}`, Math.round(v) + 'px');
    drawPlace();
  }

  function layoutFg() {
    const layer = document.getElementById('cb_fg_layer');
    const chat = document.getElementById('chat');
    if (!layer || layer.style.display === 'none' || !chat) return;
    const r = chat.getBoundingClientRect();
    const L = document.getElementById('cb_fg_left');
    const C = document.getElementById('cb_fg_center');
    const R = document.getElementById('cb_fg_right');
    if (L) L.style.width = Math.max(0, r.left) + 'px';
    if (R) R.style.width = Math.max(0, window.innerWidth - r.right) + 'px';
    if (C) { C.style.left = r.left + 'px'; C.style.width = r.width + 'px'; }
    drawPlace();
  }

  // Foreground images keep their side; Move Horizontal and Vertical (or dragging them) shift them from there.
  function fgTransform(el, pos, F) {
    const sc = cardNum(F[pos + 'Scale'], 'fgScale', 100) / 100;
    el.style.transformOrigin = pos === 'Left' ? 'left bottom' : pos === 'Right' ? 'right bottom' : 'center bottom';
    el.style.transform = `translate(${cardNum(F[pos + 'X'], 'fgX', 0)}px, ${cardNum(F[pos + 'Y'], 'fgY', 0)}px) scale(${sc})`;
  }

  function ensureFgLayer() {
    const s = settings();
    const show = isOn() && s.fgEnabled && !(s.fgHideVN && s.nodeEnabled);
    let layer = document.getElementById('cb_fg_layer');
    // Nothing is built until foreground images are first switched on.
    if (!layer && !show) return;
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

    const F = fgData();
    layer.style.display = show ? 'block' : 'none';
    front.style.display = show ? 'block' : 'none';
    document.documentElement.style.setProperty('--cb-fg-op', rangeNum(s, 'fgOpacity') / 100);

    for (const pos of FG_POS) {
      const el = document.getElementById(`cb_fg_${pos.toLowerCase()}`);
      const target = F[pos + 'Layer'] === 'front' ? front : layer;
      if (el.parentNode !== target) target.appendChild(el);
      const src = media(F[pos]);
      fgTransform(el, pos, F);
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

  // ===== Edit Placement =====
  // Pop-out avatars, foreground images and, with Layout on, the chat panel, menu bar and send bar can be dragged on
  // screen. Edit Placement hides the menu and outlines what can move; only the picked item drags, and a picked Layout
  // part also resizes from the handles on its edges. Tapping the picked item picks the one under it. The bar at the
  // bottom has Snap to Grid, Undo, Reset and Done.
  // Layout parts come first, so the pictures' outlines sit on top of theirs. Inside Phone Preview only Layout parts move.
  const PLACE = [
    { id: 'layChat', lay: 'chat', label: 'Chat Panel' }, { id: 'layBar', lay: 'bar', label: 'Menu Bar' }, { id: 'laySend', lay: 'send', label: 'Send Bar' },
    { id: 'us', label: 'User Pop Out' }, { id: 'ai', label: 'AI Pop Out' },
    ...['Left', 'Center', 'Right'].map((pos) => ({ id: 'fg' + pos, pos, label: `${pos} Foreground` })),
  ];
  // Each Layout part's element, its settings, and SillyTavern's own place for it (what Reset puts back). The setting
  // names are without their layout's start (see lk and layNames).
  const LAY_PART = {
    chat: { el: 'sheld', keys: ['ChatMoved', 'ChatX', 'ChatY', 'ChatW', 'ChatH'], start: { ChatMoved: false } },
    bar: { el: 'top-settings-holder', keys: ['BarEdge', 'BarMoved', 'BarPos', 'BarLen'], start: { BarEdge: 'top', BarMoved: false } },
    send: { el: 'form_sheld', keys: ['Send', 'SendX', 'SendB', 'SendW'], start: { Send: 'attached' } },
  };
  const GRIPS = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
  // The handles a picked part resizes from: the chat panel from every edge and corner, the send bar from its sides, the
  // menu bar from its two ends.
  function grips(it) {
    if (it.lay === 'chat') return GRIPS;
    if (it.lay === 'bar' && barUpright(settings()[lk(scrPhone(), 'BarEdge')])) return ['n', 's'];
    return it.lay ? ['e', 'w'] : [];
  }

  // The screen Edit Placement works on: this page, or the phone inside Phone Preview. preview.js hands that one over as
  // { win, frame, apply, done }: the phone's window, its frame on this page (scaled down to fit), what shows changed
  // settings inside it, and what happens on Done. The phone always uses the Phone layout.
  let onScreen = null;
  const scrWin = () => onScreen?.win || window;
  const scrPhone = () => (onScreen ? true : phoneNow());
  // Where the screen sits on this page, and how much it's scaled.
  function scrBox() {
    if (!onScreen) return { x: 0, y: 0, k: 1 };
    const r = onScreen.frame.getBoundingClientRect();
    return { x: r.left, y: r.top, k: r.width / (onScreen.frame.offsetWidth || r.width || 1) };
  }
  // Layout settings by their full names, for the layout being edited.
  const layNames = (o) => Object.fromEntries(Object.entries(o).map(([k, x]) => [lk(scrPhone(), k), x]));
  const placeKind = (it) => (it.lay ? 'lay' : it.pos ? 'fg' : 'pop');
  const place = { on: false, sel: null, drag: null, undo: [] };
  let placeTouchGuard = false;

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

  const placeEl = (it) => (it.lay ? scrWin().document.getElementById(LAY_PART[it.lay].el) : document.getElementById(it.pos ? `cb_fg_${it.pos.toLowerCase()}` : `cb_pop_${it.id}`));

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

  // A Layout part on its screen, in that screen's own pixels. Parts show while Layout is on; the send bar only while it's
  // Free, since Attached it follows the chat panel.
  function layRect(it) {
    const s = settings();
    const el = placeEl(it);
    if (!el || !layOn(s) || (it.lay === 'send' && s[lk(scrPhone(), 'Send')] !== 'free')) return null;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 ? r : null;
  }

  // An item's outline on this page.
  function placeRect(it) {
    if (it.lay) {
      const r = layRect(it);
      if (!r) return null;
      const { x, y, k } = scrBox();
      return { left: x + r.left * k, top: y + r.top * k, right: x + r.right * k, bottom: y + r.bottom * k, width: r.width * k, height: r.height * k };
    }
    const el = placeEl(it);
    if (onScreen || !el || el.style.display === 'none' || !el.getAttribute('src')) return null;
    if (it.pos && el.parentNode?.style.display === 'none') return null;
    const r = it.pos ? fgRect(el) : el.getBoundingClientRect();
    return r && r.width > 0 && r.height > 0 ? r : null;
  }

  // Where an item is, in the form placeSet takes: an offset for a picture, the part's settings for a Layout part.
  function placeGet(it) {
    const s = settings();
    if (it.lay) return Object.fromEntries(LAY_PART[it.lay].keys.map((k) => [lk(scrPhone(), k), s[lk(scrPhone(), k)]]));
    if (!it.pos) return { x: rangeNum(s, it.id + 'PopX'), y: rangeNum(s, it.id + 'PopY') };
    const F = fgData();
    return { x: cardNum(F[it.pos + 'X'], 'fgX', 0), y: cardNum(F[it.pos + 'Y'], 'fgY', 0) };
  }
  const placeAtStart = (it) => {
    const v = placeGet(it);
    return it.lay ? Object.entries(layNames(LAY_PART[it.lay].start)).every(([k, x]) => v[k] === x) : !v.x && !v.y;
  };

  function placeSet(it, v) {
    if (it.lay) {
      Object.assign(settings(), v);
      applyLayout();
      onScreen?.apply(v);
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

  // Dragging a Layout part. The chat panel and send bar move anywhere and resize from their handles. The menu bar slides
  // along its edge, changes length from its ends, and goes to another edge when dragged close to it. Kept on screen and
  // saved as a % of it. Everything here is in the screen's own pixels: dx, dy and the pointer (px, py) too.
  function dragLayout(d, dx, dy, px, py, free) {
    const s = settings();
    const W = scrWin().innerWidth, H = scrWin().innerHeight;
    const g = s.placeSnap && !free ? rangeNum(s, 'placeGrid') : 0;
    const snap = (v) => (g ? Math.round(v / g) * g : v);
    // A span from a to b moved by t, kept within 0 to max, with whichever end is nearer a grid line landing on it.
    const shift = (a, b, t, max) => {
      t = clamp(t, -a, max - b);
      if (g) {
        const sa = snap(a + t) - a - t, sb = snap(b + t) - b - t;
        t = clamp(t + (Math.abs(sa) <= Math.abs(sb) ? sa : sb), -a, max - b);
      }
      return [a + t, b + t];
    };
    const pct = (v, size) => Math.round(v / size * 10000) / 100;
    const r = d.r0;

    if (d.it.lay === 'bar') {
      const up0 = barUpright(d.edge0);
      const doc = scrWin().document;
      const min = (d.min ??= barIcons(doc) * barCell(doc));
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
        const grab = d.switched ? len / 2 : up0 ? d.py0 - r.top : d.px0 - r.left;
        [a, b] = shift(at - grab, at - grab + len, 0, size);
      }
      const size = barUpright(edge) ? H : W;
      return placeSet(d.it, layNames({ BarEdge: edge, BarMoved: true, BarPos: pct(a, size), BarLen: pct(b - a, size) }));
    }

    let [L, R, T, B] = [r.left, r.right, r.top, r.bottom];
    if (!d.grip) {
      [L, R] = shift(L, R, dx, W);
      [T, B] = shift(T, B, dy, H);
    } else {
      const min = (name) => NUM_RANGE[lk(scrPhone(), name)][0] / 100;
      const minW = W * min(d.it.lay === 'chat' ? 'ChatW' : 'SendW'), minH = H * min('ChatH');
      if (d.grip.includes('w')) L = clamp(snap(L + dx), 0, R - minW);
      if (d.grip.includes('e')) R = clamp(snap(R + dx), L + minW, W);
      if (d.grip.includes('n')) T = clamp(snap(T + dy), 0, B - minH);
      if (d.grip.includes('s')) B = clamp(snap(B + dy), T + minH, H);
    }
    if (d.it.lay === 'chat') placeSet(d.it, layNames({ ChatMoved: true, ChatX: pct(L, W), ChatY: pct(T, H), ChatW: pct(R - L, W), ChatH: pct(B - T, H) }));
    else placeSet(d.it, layNames({ SendX: pct(L, W), SendB: pct(H - B, H), SendW: pct(R - L, W) }));
  }

  function onPlaceTouchMove(e) {
    if (place.drag && e.cancelable) e.preventDefault();
  }

  function setPlaceTouchGuard(on) {
    if (on === placeTouchGuard) return;
    placeTouchGuard = on;
    window[on ? 'addEventListener' : 'removeEventListener']('touchmove', onPlaceTouchMove, { passive: false, capture: true });
  }

  function ensurePlaceLayer() {
    let layer = document.getElementById('cb_place_layer');
    if (layer) return layer;
    const s = settings();
    layer = document.createElement('div');
    layer.id = 'cb_place_layer';
    layer.innerHTML = '<div class="cb_place_grid"></div>'
      + PLACE.map((it) => `<div class="cb_place_box" data-id="${it.id}"><span>${it.label}</span>${it.lay ? GRIPS.map((g) => `<i class="cb_place_grip" data-g="${g}"></i>`).join('') : ''}</div>`).join('')
      + `<div id="cb_place_pill">
          <span class="cb_place_name"></span>
          <label class="cb_place_snap" title="Hold Alt while dragging to move freely for one move"><input type="checkbox" id="cb_place_snap"><span>Snap to Grid</span></label>
          <span class="cb_place_gridset"><input type="range" id="cb_place_grid" ${rangeAttrs('placeGrid')} value="${rangeNum(s, 'placeGrid')}" title="Grid spacing"><span><span id="cb_place_gridval">${rangeNum(s, 'placeGrid')}</span>${NUM_RANGE.placeGrid[3]}</span></span>
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
      const it = last && PLACE.find((p) => p.id === last.id);
      if (!it) return drawPlace();
      place.sel = it.id;
      placeSet(it, last.v);
      save();
    };
    q('#cb_place_reset').onclick = () => {
      const it = PLACE.find((p) => p.id === place.sel);
      if (!it || placeAtStart(it)) return;
      pushUndo(it.id, placeGet(it));
      placeSet(it, it.lay ? layNames(LAY_PART[it.lay].start) : { x: 0, y: 0 });
      save();
    };
    q('#cb_place_done').onclick = endPlacement;

    // Tapping a box picks it; only the picked one drags. The picked box sits on top, so it wins where boxes overlap.
    layer.addEventListener('pointerdown', (e) => {
      if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const box = e.target instanceof Element ? e.target.closest('.cb_place_box') : null;
      if (!box) return;
      e.preventDefault();
      const it = PLACE.find((p) => p.id === box.dataset.id);
      if (place.sel !== it.id) { place.sel = it.id; drawPlace(); return; }
      const start = placeGet(it);
      const grip = e.target.closest('.cb_place_grip')?.dataset.g || '';
      const sb = scrBox();
      place.drag = { it, id: e.pointerId, sx: e.clientX, sy: e.clientY, start, grip, moved: false, box: sb };
      // A Layout part drags in its screen's own pixels.
      if (it.lay) Object.assign(place.drag, { r0: layRect(it), px0: (e.clientX - sb.x) / sb.k, py0: (e.clientY - sb.y) / sb.k, edge0: settings()[lk(scrPhone(), 'BarEdge')] });
      else place.drag.r0 = placeRect(it);
      place.drag.edge = place.drag.edge0;
      box.classList.add('cb_dragging');
    });

    window.addEventListener('pointermove', (e) => {
      const d = place.drag;
      if (!d || e.pointerId !== d.id) return;
      let dx = e.clientX - d.sx, dy = e.clientY - d.sy;
      // A tap that wobbles a little isn't a drag.
      if (!d.moved && Math.hypot(dx, dy) < 4) return;
      d.moved = true;
      if (d.it.lay) {
        const { x, y, k } = d.box;
        return d.r0 && dragLayout(d, dx / k, dy / k, (e.clientX - x) / k, (e.clientY - y) / k, e.altKey);
      }
      const s = settings();
      if (s.placeSnap && !e.altKey && d.r0) {
        // The picture's nearest edge lands on a grid line, whichever corner or center it's tied to.
        const g = rangeNum(s, 'placeGrid');
        const snap = (a, b) => {
          const sa = Math.round(a / g) * g - a, sb = Math.round(b / g) * g - b;
          return Math.abs(sa) <= Math.abs(sb) ? sa : sb;
        };
        dx += snap(d.r0.left + dx, d.r0.right + dx);
        dy += snap(d.r0.top + dy, d.r0.bottom + dy);
      }
      placeSet(d.it, { x: d.start.x + dx, y: d.start.y + dy });
    }, true);

    const end = (e) => {
      const d = place.drag;
      if (!d || e.pointerId !== d.id) return;
      place.drag = null;
      layer.querySelector('.cb_dragging')?.classList.remove('cb_dragging');
      if (d.moved) {
        if (JSON.stringify(placeGet(d.it)) !== JSON.stringify(d.start)) { pushUndo(d.it.id, d.start); save(); }
      } else if (e.type === 'pointerup') {
        // A tap on the picked item picks the next one under it, so a picture over the chat panel can still be picked.
        // They go round in drawing order, top first, which picking doesn't change, so every outline there gets a turn.
        const under = new Set(document.elementsFromPoint(e.clientX, e.clientY).filter((el) => el.classList.contains('cb_place_box')).map((el) => el.dataset.id));
        const ids = PLACE.map((p) => p.id).reverse().filter((id) => under.has(id));
        if (ids.length > 1) place.sel = ids[(ids.indexOf(d.it.id) + 1) % ids.length];
      }
      drawPlace();
    };
    window.addEventListener('pointerup', end, true);
    window.addEventListener('pointercancel', end, true);
    window.addEventListener('keydown', (e) => { if (place.on && e.key === 'Escape') endPlacement(); });
    return layer;
  }

  function pushUndo(id, v) {
    place.undo.push({ id, v });
    if (place.undo.length > 20) place.undo.shift();
  }

  function drawPlace() {
    if (!place.on) return;
    const layer = document.getElementById('cb_place_layer');
    if (!layer) return;
    const s = settings();
    const small = [];
    for (const it of PLACE) {
      const box = layer.querySelector(`.cb_place_box[data-id="${it.id}"]`);
      const r = placeRect(it);
      box.style.display = r ? 'block' : 'none';
      if (!r) continue;
      if (r.height < window.innerHeight * 0.3) small.push(r);
      Object.assign(box.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
      box.classList.toggle('cb_sel', it.id === place.sel);
      if (it.lay) {
        const on = it.id === place.sel ? grips(it) : [];
        box.querySelectorAll('.cb_place_grip').forEach((h) => h.classList.toggle('cb_on', on.includes(h.dataset.g)));
      }
    }
    const sel = PLACE.find((it) => it.id === place.sel && placeRect(it));
    layer.querySelector('.cb_place_name').textContent = sel ? sel.label : 'Tap an outline to pick it';
    layer.querySelector('#cb_place_snap').checked = !!s.placeSnap;
    layer.querySelector('.cb_place_gridset').style.display = s.placeSnap ? '' : 'none';
    // The grid covers the screen being edited, in that screen's pixels.
    const grid = layer.querySelector('.cb_place_grid');
    const fr = onScreen?.frame.getBoundingClientRect();
    const gs = rangeNum(s, 'placeGrid') * scrBox().k;
    grid.style.display = s.placeSnap ? 'block' : 'none';
    grid.style.backgroundSize = `${gs}px ${gs}px`;
    Object.assign(grid.style, fr ? { inset: 'auto', left: fr.left + 'px', top: fr.top + 'px', width: fr.width + 'px', height: fr.height + 'px' } : { inset: '', left: '', top: '', width: '', height: '' });
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
  // `scr` is the phone inside Phone Preview (see onScreen); without it, this page.
  function startPlacement(first, scr = null) {
    if (!isOn() || place.on) return;
    onScreen = scr;
    const shown = PLACE.filter((it) => placeRect(it));
    if (!shown.length) {
      onScreen = null;
      toastr.info(scr ? 'Turn Layout on first.' : 'Nothing to move yet. Set an avatar to Pop Out, or add a foreground image, first.', 'Edit Placement');
      return false;
    }
    place.on = true;
    place.undo = [];
    place.sel = (shown.find((it) => placeKind(it) === first) || shown[0]).id;
    const ov = document.getElementById('cb_modal_overlay');
    if (ov && !scr) ov.style.display = 'none';
    ensurePlaceLayer().style.display = 'block';
    setPlaceTouchGuard(true);
    drawPlace();
    return true;
  }

  function endPlacement() {
    if (!place.on) return;
    place.on = false;
    place.drag = null;
    place.undo = [];
    const layer = document.getElementById('cb_place_layer');
    if (layer) layer.style.display = 'none';
    setPlaceTouchGuard(false);
    const ov = document.getElementById('cb_modal_overlay');
    syncLayoutPage(ov);
    const scr = onScreen;
    onScreen = null;
    if (scr) return scr.done?.();
    if (ov) ov.style.display = '';
  }

  function syncPopouts() {
    const s = settings();
    const layer = ensurePopLayer();
    layoutPop();
    for (const [prefix, flag] of [['ai', 'false'], ['us', 'true']]) {
      const el = layer.querySelector(`#cb_pop_${prefix}`);
      const on = ntrAvatars(s, prefix) && s[`${prefix}Style`] === 'popout';
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
    }
    drawPlace();
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
  const SWITCH_IDS = ['m_f_enable', 'm_a_enable', 'm_n_enable', 'm_ai_on', 'm_us_on', 'm_rb_enable', 'm_tf_enable', 'm_ov_enable', 'm_b_enable', 'm_l_enable'];
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
      /* The screen layers get a set size, not inset: 0: SillyTavern's phone layout (screens up to 1000px wide) can leave a
         fixed box with no height, which hid pop-outs and foreground images. */
      #cb_pop_layer, #cb_fg_layer, #cb_fg_front, #cb_place_layer { left: 0; top: 0; width: 100vw; height: 100vh; height: 100dvh; }
      #cb_pop_layer { position: fixed; z-index: 2500; pointer-events: none; overflow: hidden; }
      #cb_pop_layer img { position: absolute; display: none; pointer-events: none; max-width: none; user-select: none; -webkit-user-drag: none; touch-action: none; }
      #cb_place_layer { position: fixed; z-index: 9990; display: none; pointer-events: none; }
      #cb_place_layer .cb_place_grid { position: absolute; inset: 0; display: none; background-image: linear-gradient(to right, rgba(255,255,255,.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.14) 1px, transparent 1px); }
      .cb_place_box { position: absolute; display: none; box-sizing: border-box; outline: 2px dashed rgba(255,255,255,.6); outline-offset: -2px; background: rgba(255,255,255,.04); pointer-events: auto; cursor: pointer; touch-action: none; }
      .cb_place_box > span { position: absolute; left: 4px; top: 4px; padding: 2px 8px; border-radius: 999px; background: rgba(0,0,0,.7); color: #fff; font-size: 12px; white-space: nowrap; display: none; }
      .cb_place_box.cb_sel { z-index: 1; cursor: grab; outline: 2px solid var(--SmartThemeQuoteColor, #6cf); background: rgba(255,255,255,.08); }
      .cb_place_box.cb_sel > span { display: block; }
      .cb_place_box[data-id^="lay"] > span { left: 20px; }
      .cb_place_box.cb_dragging { cursor: grabbing; }
      .cb_place_grip { position: absolute; display: none; width: 14px; height: 14px; box-sizing: border-box; border-radius: 4px; border: 2px solid #000; background: var(--SmartThemeQuoteColor, #6cf); touch-action: none; }
      .cb_place_grip.cb_on { display: block; }
      .cb_place_grip[data-g="n"], .cb_place_grip[data-g="s"] { left: calc(50% - 7px); cursor: ns-resize; }
      .cb_place_grip[data-g="e"], .cb_place_grip[data-g="w"] { top: calc(50% - 7px); cursor: ew-resize; }
      .cb_place_grip[data-g*="n"] { top: 0; }
      .cb_place_grip[data-g*="s"] { top: calc(100% - 14px); }
      .cb_place_grip[data-g*="w"] { left: 0; }
      .cb_place_grip[data-g*="e"] { left: calc(100% - 14px); }
      .cb_place_grip[data-g="ne"], .cb_place_grip[data-g="sw"] { cursor: nesw-resize; }
      .cb_place_grip[data-g="nw"], .cb_place_grip[data-g="se"] { cursor: nwse-resize; }
      #cb_place_pill { position: absolute; z-index: 2; left: 0; right: 0; margin: 0 auto; width: max-content; bottom: calc(16px + env(safe-area-inset-bottom, 0px)); display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 8px 10px; max-width: calc(100vw - 32px); box-sizing: border-box; padding: 8px 8px 8px 14px; border-radius: 22px; background: rgba(0,0,0,0.85); color: #fff; font-size: 13px; line-height: 1.2; pointer-events: auto; box-shadow: 0 2px 10px rgba(0,0,0,0.5); }
      #cb_place_pill.cb_place_top { bottom: auto; top: calc(16px + env(safe-area-inset-top, 0px)); }
      #cb_place_pill.cb_place_mid { bottom: auto; top: calc(50% - 22px); }
      #cb_place_pill .cb_place_name { font-weight: bold; white-space: nowrap; }
      #cb_place_pill label { display: flex; align-items: center; gap: 5px; cursor: pointer; white-space: nowrap; }
      #cb_place_pill input[type="checkbox"] { margin: 0; accent-color: var(--SmartThemeQuoteColor, #6cf); }
      #cb_place_pill .cb_place_gridset { display: flex; align-items: center; gap: 6px; white-space: nowrap; }
      #cb_place_pill input[type="range"] { width: 90px; margin: 0; }
      #cb_place_pill button { border: none; border-radius: 999px; padding: 5px 12px; cursor: pointer; background: rgba(255,255,255,.15); color: #fff; white-space: nowrap; }
      #cb_place_pill button:disabled { opacity: .4; cursor: default; }
      #cb_place_pill button.cb_place_main { font-weight: bold; background: var(--SmartThemeQuoteColor, #6cf); color: #000; }
      .cb_col { display: flex; flex-direction: column; gap: 8px; }
      .cb_grp { flex-direction: column; gap: 8px; }
      .cb_col_body { display: flex; flex-direction: column; gap: 8px; }
      .cb_sub { font-size: 0.75em; opacity: 0.65; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 4px; padding-top: 6px; border-top: 1px solid var(--SmartThemeBorderColor, #444); }
      
      #cb_fg_layer { position: fixed; z-index: 2400; pointer-events: none; opacity: var(--cb-fg-op, 1); }
      #cb_fg_front { position: fixed; z-index: 2420; pointer-events: none; opacity: var(--cb-fg-op, 1); }
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
      .cb_fadegrid label.cb_fon { background: color-mix(in srgb, var(--SmartThemeQuoteColor, #6cf) 35%, transparent); }
      .cb_ovrow { padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,.06); }
      .cb_ovrow .m_o_body { margin-top: 4px; padding-left: 26px; }
      .cb_ovrow .m_o_body.cb_flat { padding-left: 0; }
      .cb_ovrow .cb_plab { padding-left: 26px; }
      .m_l_note { padding-left: 26px; }
      .ntr_rbpat_lines { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2px 12px; }
      .cb_ovrow.cb_sep { border-top: 1px solid rgba(255,255,255,.18); margin-top: 8px; padding-top: 12px; }
      .cb_ovrow:has(+ .cb_sep) { border-bottom: 0; }
      .cb_cur_slot { border-radius: 8px; background: rgba(0,0,0,.15); padding: 6px; margin-bottom: 6px; }
      .cb_cur_row { display: flex; align-items: center; gap: 6px; }
      .cb_cur_row .menu_button { margin: 0; padding: 4px 8px; }
      .cb_cur_prev { width: 40px; height: 40px; flex: none; border-radius: 8px; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; }
      .cb_cur_prev img { max-width: 32px; max-height: 32px; }
      .cb_cur_prev i { opacity: .35; }
      .cb_cur_name { flex: 1; min-width: 0; }
      .cb_cur_name small { display: block; opacity: .6; font-size: .8em; }
    `;

    if (isOn()) cssString += overrideCss(s) + scrollbarCss(s) + cursorCss(s) + textFormatCss(s) + chatLookCss(s);
    // The chat gets its own layer. A see-through chat has none on most screens, so every key, streamed word and scroll
    // repainted all of it, avatar fades included.
    if (isOn()) cssString += '\n      #chat { will-change: transform; }\n';
    else cursorKinds = {};

    if (isOn() && s.avatarEnabled) {
      for (const [prefix, flag] of [['ai', 'false'], ['us', 'true']]) {
        if (!ntrAvatars(s, prefix)) continue;
        const m = `.mes[is_user="${flag}"]`;
        // In Line keeps SillyTavern's own message layout.
        if (s[prefix + 'Style'] === 'inline') { cssString += getAvatarCss(prefix, flag, s); continue; }
        cssString += `
        ${m} { position: relative !important; padding: 0 !important; background-color: var(--SmartThemeChatMesBgc) !important; border-radius: var(--SmartThemeChatMesRounding, 15px) !important; overflow: clip !important; }
        ${m} .mes_block, ${m} .mes_text { background: transparent !important; border: none !important; box-shadow: none !important; }
        ${m} .mes_block { position: relative !important; z-index: 1 !important; width: 100% !important; min-height: 120px !important; padding: 15px !important; }

        ${getAvatarCss(prefix, flag, s)}
      `;
      }
    }
    if (isOn()) {
      for (const [prefix, flag] of [['ai', 'false'], ['us', 'true']]) {
        if (!ntrAvatars(s, prefix) && SHAPES[s[prefix + 'Shape']]) cssString += stShapeCss(flag, s[prefix + 'Shape'], rangeNum(s, prefix + 'Corner'), rangeNum(s, prefix + 'Focus'));
      }
    }

    styleEl.textContent = cssString;
    applyLayout();
    document.querySelectorAll('#chat .mes .avatar img').forEach((img) => { if (img.complete) setAvatarRatio(img); fullAvatar(img); });
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
    o.rotateSec = Math.round(cardNum(o.rotateSec, 'bannerRotateSec', DEFAULTS.bannerRotateSec));
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
    o.height = cardNum(o.height, 'bannerHeight', DEFAULTS.bannerHeight);
    o.gap = cardNum(o.gap, 'bannerGap', DEFAULTS.bannerGap);
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
  // Waits while the Overlays page is open, so the Crop slider works on the picked image.
  const rotPaused = () => !!document.getElementById('cb_modal_overlay') && settings().uiPage === 'fg';
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
    const newChar = key !== rot.key;
    if (newChar) { rot.key = key; rot.idx = null; stopRotation(); }
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
      const pos = `50% ${cardNum(im.pos, 'bannerPos', 45)}%`;
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
      vid.style.objectPosition = `50% ${cardNum(src.videoPos, 'bannerVideoPos', 50)}%`;
      banner.querySelector('.cb_snd').style.display = '';
      if (vid.getAttribute('src') !== u) { vid.src = u; playBannerVid(vid); }
      // Same video, other character: their sound setting may differ.
      else if (vid.paused || newChar) playBannerVid(vid);
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
        chat.style.paddingTop = cardNum(r.overlapOffset, 'bannerOffset', 0) + 'px';
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

  // Runs `upload` and returns the file's path. If the chat changes before it finishes, saving the path would put it on
  // the wrong character, so the file is deleted and '' comes back. `perChat` false skips this for files that go in the
  // global settings.
  async function uploadHere(upload, perChat = true) {
    const st = store();
    const path = await upload();
    if (!path || !perChat || store() === st) return path;
    deleteFileIfUnused(path);
    toastr.warning('The chat changed before the upload finished, so it was not saved. Upload it again.', 'Upload');
    return '';
  }

  async function addFiles(files) {
    const key = currentKey();
    const r = bannerSrc(key ? peek(key) : null);
    let added = 0;
    for (const f of files) {
      try {
        const url = await uploadHere(() => uploadImage(f, 'banner', { maxWidth: 1600 }), r !== settings().bannerGlobal);
        if (!url) return;
        r.images.push({ url, pos: 45 });
        r.idx = r.images.length - 1;
        added++;
        save();
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

  // Whether a side's picture can get cut off, so Crop Focus has something to do: any Shape, or None on Backdrop with
  // Fill or Original, where a short message cuts it.
  function cropCuts(s, prefix) {
    if (SHAPES[s[`${prefix}Shape`]]) return true;
    const style = ['inline', 'popout'].includes(s[`${prefix}Style`]) ? s[`${prefix}Style`] : 'backdrop';
    return ntrAvatars(s, prefix) && style === 'backdrop' && s[`${prefix}Fit`] !== 'contain';
  }

  function getColHtml(prefix, title, s) {
    const style = ['inline', 'popout'].includes(s[`${prefix}Style`]) ? s[`${prefix}Style`] : 'backdrop';
    const shaped = !!SHAPES[s[`${prefix}Shape`]];
    const cornersOn = ['rectangle', 'square'].includes(s[`${prefix}Shape`]);
    const scaleOff = style !== 'popout' && !shaped && s[`${prefix}Fit`] === 'original';

    const slider = (id, key, label) => `
      <div class="cb_row"><label>${label}</label><span><span id="m_${prefix}_${id}val">${rangeNum(s, prefix + key)}</span>${NUM_RANGE[prefix + key][3]}</span></div>
      <input type="range" id="m_${prefix}_${id}" ${rangeAttrs(prefix + key)} value="${rangeNum(s, prefix + key)}">`;
    // A group shows for the styles it lists (data-only, space-separated).
    const grp = (only, inner) => `<div class="cb_grp" data-only="${only}" style="display: ${only.split(' ').includes(style) ? 'flex' : 'none'};">${inner}</div>`;
    // The fade grid starts on the first fade that's on, or Bottom.
    const fadeCur = Object.keys(FADE_PARTS).find((v) => rangeNum(s, prefix + FADE_PARTS[v][0]) > 0) || 'bc';

    return `
      <div class="ntr_colwrap">
      <div class="ntr_glab">${title}</div>
      <div id="m_${prefix}_col" class="cb_col ntr_card">
        <label class="checkbox_label"><input type="checkbox" id="m_${prefix}_on" ${s[`${prefix}Enabled`] !== false ? 'checked' : ''}><span>${title} Avatar</span></label>
        <div><strong>Shape:</strong>${pills(`${prefix}shape`, SHAPE_OPTS, s[`${prefix}Shape`])}
          <div class="cb_hint" style="margin: 4px 0 0;">Crops the avatar to this shape, sized by Image Scale. With ${title} Avatar off, it shapes SillyTavern's own chat avatar. None keeps the whole picture.</div></div>
        <div id="m_${prefix}_crwrap" class="${cornersOn ? '' : 'cb_dim'}">${slider('cr', 'Corner', 'Corners:')}</div>
        <div id="m_${prefix}_crhint" class="cb_hint" style="margin: 0;${cornersOn ? '' : ' display: none;'}">0% is sharp. Corners are a share of the width, so they keep their look at any Image Scale.</div>
        <div id="m_${prefix}_croff" class="cb_hint" style="margin: 0;${cornersOn ? ' display: none;' : ''}">Corners are for Rectangle and Square. The other shapes keep their own outline.</div>
        <div id="m_${prefix}_fowrap" class="${cropCuts(s, prefix) ? '' : 'cb_dim'}">${slider('fo', 'Focus', 'Crop Focus:')}</div>
        <div class="cb_hint" style="margin: 0;">Which part stays when the picture gets cut off: 0% keeps the top, 100% the bottom. Nothing gets cut with Shape None and Fit, or None on In Line or Pop Out.</div>
        <div id="m_${prefix}_body" class="cb_col_body${s[`${prefix}Enabled`] !== false ? '' : ' cb_dim'}">

        <div><strong>Style:</strong>${pills(`${prefix}style`, [['inline', 'In Line'], ['backdrop', 'Backdrop'], ['popout', 'Pop Out']], style)}</div>
        <div><strong>Position:</strong>${posGrid(`${prefix}pos`, s[`${prefix}Side`])}</div>
        ${grp('inline backdrop', `<div id="m_${prefix}_fitwrap" class="${shaped ? 'cb_dim' : ''}"><strong>Image Fit:</strong>${pills(`${prefix}fit`, [['contain', 'Fit'], ['cover', 'Fill'], ['original', 'Original']], s[`${prefix}Fit`])}</div>
          <div id="m_${prefix}_fithint" class="cb_hint" style="margin: 0;${shaped ? '' : ' display: none;'}">The picture always fills a Shape, so Image Fit is only for None.</div>`)}
        ${grp('backdrop', `<div id="m_${prefix}_fitnone" class="cb_hint" style="margin: 0;${shaped ? ' display: none;' : ''}">In a message shorter than the picture, Fit shrinks it to show all of it. Fill keeps its Image Scale size and Original its own size, and the message cuts off the rest.</div>`)}

        <div id="m_${prefix}_scwrap" class="${scaleOff ? 'cb_dim' : ''}">${slider('sc', 'Scale', 'Image Scale:')}</div>
        <div id="m_${prefix}_orighint" class="cb_hint" style="margin: 0;${scaleOff ? '' : ' display: none;'}">Original shows the picture at its own size, so Image Scale is off.</div>
        <div id="m_${prefix}_padwrap" class="${style === 'inline' ? 'cb_dim' : ''}">${slider('pad', 'Pad', 'Text Padding:')}</div>

        ${grp('inline backdrop', `<div class="cb_sub">Fades</div>`
          + fadeGrid(prefix, s, fadeCur)
          + `<div class="cb_row"><label id="m_${prefix}_fadelab">${FADE_PARTS[fadeCur][1]} Fade:</label><span><span id="m_${prefix}_fadeval">${rangeNum(s, prefix + FADE_PARTS[fadeCur][0])}</span>%</span></div>
          <input type="range" id="m_${prefix}_fade" ${rangeAttrs(prefix + 'FadeTop')} value="${rangeNum(s, prefix + FADE_PARTS[fadeCur][0])}">`
          + '<div class="cb_hint" style="margin: 0;">Pick a side or corner, then set how much of the picture it fades. Lit cells have a fade on. Fades are a share of the avatar as it shows, so they keep their look at any Image Scale.</div>')}

        ${grp('popout', `<div class="cb_sub">Screen Placement</div>
          <button type="button" id="m_${prefix}_place" class="menu_button" style="margin: 0; width: max-content;"><i class="fa-solid fa-up-down-left-right"></i> Edit Placement</button>
          <div class="cb_hint" style="margin: 0;">Hides the menu so you can drag the picture on screen. Press Done to come back. Position is on the chat panel: Top Left is the chat's top-left corner.</div>
          <div id="m_${prefix}_pstat" style="font-size: 0.8em; opacity: 0.75;">${escapeHTML(popMsg[prefix] || '')}</div>`
          + slider('ox', 'PopX', 'Move Horizontal:')
          + slider('oy', 'PopY', 'Move Vertical:'))}

        <div class="cb_sub">Effects</div>
        ${slider('bl', 'Blur', 'Blur Effect:')}

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
    if (!PAGES.some(([id]) => id === s.uiPage)) s.uiPage = 'fg';
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
        ${layoutSectionHtml(s)}

        ${pageHtml('fg', `
          ${pagePart('Header Banner', ['m_b_enable', s.bannerOn], 'fg_banner', `
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
              <div class="cb_row" style="margin-top: 10px;"><label>Crop:${btag}</label><span><span id="m_b_pval">${cardNum(curImg.pos, 'bannerPos', 45)}</span>${NUM_RANGE.bannerPos[3]}</span></div>
              <input type="range" id="m_b_p" ${rangeAttrs('bannerPos')} value="${cardNum(curImg.pos, 'bannerPos', 45)}">
              ` : ''}`)}

              ${card('Rotation' + (ownKind ? ' ' + TAG : ''), `
                <label class="checkbox_label"><input type="checkbox" id="m_b_rot" ${ro.rotate ? 'checked' : ''}><span>Rotate through images</span></label>
                <div id="m_b_rot_body" class="${ro.rotate ? '' : 'cb_dim'}">
                  <div class="cb_row" style="margin-top: 8px;"><label>Every:</label><span><span id="m_b_rot_val">${ro.rotateSec}</span>${NUM_RANGE.bannerRotateSec[3]}</span></div>
                  <input type="range" id="m_b_rot_sec" ${rangeAttrs('bannerRotateSec')} value="${ro.rotateSec}">
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
              <div class="cb_row" style="margin-top: 10px;"><label>Crop:${btag}</label><span><span id="m_b_vpval">${cardNum(src.videoPos, 'bannerVideoPos', 50)}</span>${NUM_RANGE.bannerVideoPos[3]}</span></div>
              <input type="range" id="m_b_vp" ${rangeAttrs('bannerVideoPos')} value="${cardNum(src.videoPos, 'bannerVideoPos', 50)}">` : ''}
              <div class="cb_hint">Loops without controls. The speaker button on the banner turns sound on or off, and your choice is remembered. Until you've clicked somewhere on the page, browsers may keep it muted.</div>`)}
            </div>

            ${card('Layout', `
              <label class="checkbox_label" ${!key ? 'style="opacity:0.5;pointer-events:none;"' : ''}>
                <input type="checkbox" id="m_b_lock" ${r.locked ? 'checked' : ''}><span>Lock to top ${TAG}</span>
              </label>
              <label class="checkbox_label" style="margin-top: 6px;${!key ? 'opacity:0.5;pointer-events:none;' : ''}">
                <input type="checkbox" id="m_b_overlap" ${r.overlap ? 'checked' : ''}><span>Overlap messages ${TAG}</span>
              </label>

            <div class="cb_row" style="margin-top: 15px;"><label>Banner Height:${btag}</label><span><span id="m_b_hval">${bl.height}</span>${NUM_RANGE.bannerHeight[3]}</span></div>
            <input type="range" id="m_b_h" ${rangeAttrs('bannerHeight')} value="${bl.height}">
            <div id="m_b_guide" class="cb_hint" style="margin-top: 4px;">${escapeHTML(bannerGuideText())}</div>

            <div id="m_b_gap_wrapper" style="${r.overlap ? 'opacity: 0.5; pointer-events: none;' : ''}">
              <div class="cb_row" style="margin-top: 10px;"><label>Gap Below Banner:${btag}</label><span><span id="m_b_gapval">${bl.gap}</span>${NUM_RANGE.bannerGap[3]}</span></div>
              <input type="range" id="m_b_gap" ${rangeAttrs('bannerGap')} value="${bl.gap}">
            </div>

            <div id="m_b_offset_wrapper" style="display: ${r.overlap ? 'block' : 'none'};">
              <div class="cb_row" style="margin-top: 10px;"><label>Overlap Offset (Push Messages Down): ${TAG}</label><span><span id="m_b_oval">${cardNum(r.overlapOffset, 'bannerOffset', 0)}</span>${NUM_RANGE.bannerOffset[3]}</span></div>
              <input type="range" id="m_b_offset" ${rangeAttrs('bannerOffset')} value="${cardNum(r.overlapOffset, 'bannerOffset', 0)}" ${!key ? 'disabled' : ''}>
            </div>

            <div style="margin-top: 10px;"><strong>Transparent areas show:${btag}</strong>${pills('bbd', [['wallpaper', 'Wallpaper'], ['panel', 'Chat panel tint']], bl.backdrop === 'panel' ? 'panel' : 'wallpaper')}</div>
            ${ownKind ? '' : '<div class="cb_hint">Height, gap and transparent areas change every character set to Global.</div>'}`)}
          `)}

          ${pagePart('Foreground Images', ['m_f_enable', s.fgEnabled], '', `
            ${card('', `
            <div class="cb_row"><label>Opacity:</label><span><span id="m_f_oval">${rangeNum(s, 'fgOpacity')}</span>${NUM_RANGE.fgOpacity[3]}</span></div>
            <input type="range" id="m_f_o" ${rangeAttrs('fgOpacity')} value="${rangeNum(s, 'fgOpacity')}">
            <label class="checkbox_label" style="margin-top: 8px;"><input type="checkbox" id="m_f_hidevn" ${s.fgHideVN ? 'checked' : ''}><span>Hide these in Visual Novel Mode</span></label>
            <button type="button" id="m_f_place" class="menu_button" style="margin: 8px 0 0; width: max-content;"><i class="fa-solid fa-up-down-left-right"></i> Edit Placement</button>
            <div class="cb_hint" style="margin-bottom: 0;">Hides the menu so you can drag the images on screen. Each one stays tied to its side. Press Done to come back.</div>`)}

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
                  <div class="cb_row" style="width:100%; margin-top:6px;"><label>Size:</label><span><span id="m_f_s_${pos}val">${cardNum(F[pos + 'Scale'], 'fgScale', 100)}</span>${NUM_RANGE.fgScale[3]}</span></div>
                  <input type="range" class="m_f_scale" data-pos="${pos}" ${rangeAttrs('fgScale')} value="${cardNum(F[pos + 'Scale'], 'fgScale', 100)}" style="width:100%;">
                  ${[['X', 'Left/Right'], ['Y', 'Up/Down']].map(([ax, name]) => `
                  <div class="cb_row" style="width:100%; margin-top:6px;"><label>${name}:</label><span><span id="m_f_${ax}_${pos}val">${cardNum(F[pos + ax], 'fg' + ax, 0)}</span>${NUM_RANGE['fg' + ax][3]}</span></div>
                  <input type="range" id="m_f_${ax}_${pos}" class="m_f_move" data-pos="${pos}" data-ax="${ax}" ${rangeAttrs('fg' + ax)} value="${cardNum(F[pos + ax], 'fg' + ax, 0)}" style="width:100%;">`).join('')}
                  <div style="width:100%; margin-top:6px; text-align:left;"><small>In Visual Novel Mode, sit:</small>${pills('fgl' + pos, [['behind', 'Behind sprites'], ['front', 'In front']], F[pos + 'Layer'])}</div>
                </div>
              `).join('')}
            </div>
            <input type="file" id="m_f_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
          `)}
        `, { legend: true })}

        ${pageHtml('pfp', `
            <div class="ntr_cols">
              ${getColHtml('ai', 'AI', s)}
              ${getColHtml('us', 'User', s)}
            </div>
        `, { sw: ['m_a_enable', s.avatarEnabled] })}

        ${reasoningSectionHtml(s)}
        ${textSectionHtml(s)}
        ${displaySectionHtml(s)}

        ${regexSectionHtml(s)}
        ${vnSectionHtml(s)}
        </div>
        </div>
      </div>
      <div id="ntr_edge" title="Drag to resize"></div>
      <div id="ntr_preview"></div>`;

    document.body.appendChild(overlay);

    bindCollapses(overlay, s);
    // Rotation waits while the Overlays page is open, showing the picked image, and starts a fresh count
    // when another page is picked or the menu closes.
    if (s.uiPage === 'fg' && rot.idx != null) { rot.idx = null; updateBanner(); }
    const rotRestart = () => { if (s.uiPage === 'fg') rot.idx = null; stopRotation(); updateBanner(); };
    bindPages(overlay, s, rotRestart);

    setupPanel(overlay, prevScroll);

    const close = () => { overlay.remove(); syncPopouts(); rotRestart(); };
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
        const path = await uploadHere(() => uploadVideo(f, 'banner', 'Banner', vup), src !== settings().bannerGlobal);
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

    overlay.querySelector('#m_f_place').onclick = () => startPlacement('fg');
    overlay.querySelectorAll('.m_f_move').forEach((sl) => {
      sl.oninput = function() {
        const { pos, ax } = this.dataset;
        F[pos + ax] = Number(this.value);
        overlay.querySelector(`#m_f_${ax}_${pos}val`).textContent = this.value;
        ensureFgLayer();
      };
      sl.onchange = save;
    });

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
        const url = await uploadHere(() => uploadImage(f, `fg_${pos.toLowerCase()}`));
        if (!url) return;
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
    bindLayout(overlay, s);
    bindWand(overlay, s);
    bindData(overlay);
    bindVNSection(overlay, s);
    window.NTR.regex?.bind(overlay, s);
    bindDisplay(overlay, s);
    bindTextFormatting(overlay, s);

    const bindCol = (prefix) => {
      const col = overlay.querySelector(`#m_${prefix}_col`);
      const label = prefix === 'ai' ? 'AI' : 'User';

      // Corners are for Rectangle and Square. Image Fit is off with a Shape, which the picture always fills. Image Scale is off for Original, which keeps the
      // picture's own size. Text Padding is off for In Line, which never puts the avatar under the text.
      const syncScale = () => {
        const shaped = !!SHAPES[s[`${prefix}Shape`]];
        const cornersOn = ['rectangle', 'square'].includes(s[`${prefix}Shape`]);
        col.querySelector(`#m_${prefix}_fowrap`).classList.toggle('cb_dim', !cropCuts(s, prefix));
        col.querySelector(`#m_${prefix}_crwrap`).classList.toggle('cb_dim', !cornersOn);
        col.querySelector(`#m_${prefix}_crhint`).style.display = cornersOn ? '' : 'none';
        col.querySelector(`#m_${prefix}_croff`).style.display = cornersOn ? 'none' : '';
        col.querySelector(`#m_${prefix}_fitwrap`).classList.toggle('cb_dim', shaped);
        col.querySelector(`#m_${prefix}_fithint`).style.display = shaped ? '' : 'none';
        col.querySelector(`#m_${prefix}_fitnone`).style.display = shaped ? 'none' : '';
        const off = s[`${prefix}Style`] !== 'popout' && !shaped && s[`${prefix}Fit`] === 'original';
        col.querySelector(`#m_${prefix}_scwrap`).classList.toggle('cb_dim', off);
        col.querySelector(`#m_${prefix}_orighint`).style.display = off ? '' : 'none';
        col.querySelector(`#m_${prefix}_padwrap`).classList.toggle('cb_dim', s[`${prefix}Style`] === 'inline');
      };
      onPills(col, `${prefix}style`, (v) => {
        s[`${prefix}Style`] = v;
        save();
        col.querySelectorAll('.cb_grp').forEach((g) => { g.style.display = g.dataset.only.split(' ').includes(v) ? 'flex' : 'none'; });
        syncScale();
        updateAvatarStyle();
      });
      onPills(col, `${prefix}shape`, (v) => { s[`${prefix}Shape`] = v; save(); syncScale(); updateAvatarStyle(); });
      overlay.querySelector(`#m_${prefix}_on`).onchange = function() {
        s[`${prefix}Enabled`] = this.checked; save(); syncScale(); updateAvatarStyle();
        col.querySelector(`#m_${prefix}_body`).classList.toggle('cb_dim', !this.checked);
      };
      overlay.querySelector(`#m_${prefix}_place`).onclick = () => startPlacement('pop');
      onPills(col, `${prefix}pos`, (v) => { s[`${prefix}Side`] = v; save(); updateAvatarStyle(); });
      onPills(col, `${prefix}fit`, (v) => { s[`${prefix}Fit`] = v; save(); syncScale(); updateAvatarStyle(); });
      // One slider for the fade picked on the fade grid.
      const fadeSl = col.querySelector(`#m_${prefix}_fade`);
      let fadeAt = col.querySelector(`input[name="cbr_${prefix}fade"]:checked`)?.value || 'bc';
      onPills(col, `${prefix}fade`, (v) => {
        fadeAt = v;
        const val = rangeNum(s, prefix + FADE_PARTS[v][0]);
        fadeSl.value = val;
        col.querySelector(`#m_${prefix}_fadeval`).textContent = val;
        col.querySelector(`#m_${prefix}_fadelab`).textContent = `${FADE_PARTS[v][1]} Fade:`;
      });
      fadeSl.oninput = function() {
        s[prefix + FADE_PARTS[fadeAt][0]] = Number(this.value);
        col.querySelector(`#m_${prefix}_fadeval`).textContent = this.value;
        col.querySelector(`input[name="cbr_${prefix}fade"][value="${fadeAt}"]`).closest('label').classList.toggle('cb_fon', Number(this.value) > 0);
        updateAvatarStyle();
      };
      fadeSl.onchange = save;

      overlay.querySelector(`#m_${prefix}_reset`).onclick = async function() {
        if (!(await askYes(this, `Reset all ${label} avatar settings to defaults, Style included?`, 'Reset'))) return;
        for (const k of Object.keys(DEFAULTS)) {
          if (k.startsWith(prefix) && k !== `${prefix}Enabled`) s[k] = structuredClone(DEFAULTS[k]);
        }
        save();
        updateAvatarStyle();
        openCombinedModal();
      };
      
      const sliders = [
        { id: 'sc', key: 'Scale' }, { id: 'cr', key: 'Corner' }, { id: 'fo', key: 'Focus' }, { id: 'pad', key: 'Pad' },
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
    ['layout', 'fa-table-cells-large', 'Layout', 'Layout'],
    ['pfp', 'fa-user', 'Avatars', 'Avatar Management'],
    ['reasoning', 'fa-comment-dots', 'Reasoning', 'Reasoning Block Design'],
    ['text', 'fa-text-height', 'Text', 'Text Formatting'],
    ['display', 'fa-display', 'Display', 'UI Display'],
    ['fg', 'fa-layer-group', 'Overlays', 'Overlays'],
    ['regex', 'fa-code', 'Regexes', 'Regexes'],
    ['vn', 'fa-clapperboard', 'VN', 'Visual Novel Mode'],
  ];
  // A line above Regexes sets the pages that make up your look apart from the rest.
  const navHtml = (cur) => PAGES.map(([id, icon, short, full]) => (id === 'regex' ? '<div class="ntr_navsep" role="separator"></div>' : '') +
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
  // A part of a page with its own title and switch, like Header Banner on Overlays. A switched-off part's settings are
  // dimmed (see syncPageOff). With a fold name, the part starts folded and opens from its title.
  function pagePart(title, sw, fold, body) {
    return `
      <div class="ntr_part${sw[1] ? '' : ' ntr_off'}">
        <div class="ntr_parthead${fold ? ' cb_collapse_toggle' : ''}"${fold ? ` data-sec="${fold}" tabindex="0" role="button"` : ''}>
          ${fold ? '<i class="fa-solid fa-chevron-right cb_chevron"></i>' : ''}
          <h4 class="ntr_parttitle">${title}</h4>
          <input type="checkbox" id="${sw[0]}" class="ntr_pswitch" ${sw[1] ? 'checked' : ''} title="Turn ${title} on or off" aria-label="Turn ${title} on or off">
        </div>
        <div class="ntr_partbody">${body}</div>
      </div>`;
  }
  // A group of settings: a small label, then the settings in a soft card.
  const card = (label, inner) => `${label ? `<div class="ntr_glab">${label}</div>` : ''}<div class="ntr_card">${inner}</div>`;
  // Long reference parts stay folded into one row until opened. Every other part is a card that's always open.
  const FOLDED = new Set(['vn_guide', 'vn_tags', 'vn_prompt', 'rb_css', 'rb_pattern', 'ov_scroll_css']);
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
  // The avatar fade grid: the Position grid's cells, each a fade, with the middle left empty. Lit cells have a fade on.
  function fadeGrid(prefix, s, cur) {
    return `<div class="cb_posgrid cb_fadegrid">${POS_GRID.map(([v]) => {
      if (!FADE_PARTS[v]) return '<span></span>';
      const [key, name] = FADE_PARTS[v];
      return `<label title="${name} Fade" class="${rangeNum(s, prefix + key) > 0 ? 'cb_fon' : ''}"><input type="radio" name="cbr_${prefix}fade" value="${v}" ${v === cur ? 'checked' : ''}></label>`;
    }).join('')}</div>`;
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
      h.addEventListener('click', (e) => {
        if (e.target.closest('input')) return;
        const open = content.style.display === 'none';
        s.uiOpen[sec] = open;
        save();
        apply(open);
      });
      h.addEventListener('keydown', (e) => { if (e.target === h && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); h.click(); } });
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
  // A switched-off section greys out: its icon in the column, its title, and its settings. A page made of parts greys
  // out each part on its own, and its icon only when every part is off.
  function syncPageOff(overlay) {
    if (!overlay) return;
    overlay.querySelectorAll('.ntr_part').forEach((p) => p.classList.toggle('ntr_off', !p.querySelector('.ntr_pswitch').checked));
    overlay.querySelectorAll('.ntr_page').forEach((p) => {
      const sw = p.querySelector('.ntr_phead .ntr_pswitch');
      const parts = [...p.querySelectorAll('.ntr_part .ntr_pswitch')];
      p.classList.toggle('ntr_off', !!sw && !sw.checked);
      const off = sw ? !sw.checked : parts.length > 0 && parts.every((x) => !x.checked);
      overlay.querySelector(`.ntr_navi[data-page="${p.dataset.page}"]`)?.classList.toggle('ntr_off', off);
    });
  }

  // ===== Layout =====
  // The chat panel, SillyTavern's menu bar and the send bar can be moved (the Layout page and Edit Layout). There are two
  // layouts: Desktop for screens wider than 1000px, and Phone for 1000px or less, where SillyTavern switches to its phone
  // look. Each has its own settings: the Phone one's names start with layPh (see lk).
  const LAY_EDGES = ['top', 'bottom', 'left', 'right'];
  const LAY_WIDE = window.matchMedia('(width > 1000px)');
  LAY_WIDE.addEventListener('change', () => syncLayoutPage(document.getElementById('cb_modal_overlay')));
  // A layout setting's name: lk(false, 'ChatX') is layChatX, lk(true, 'ChatX') is layPhChatX.
  const lk = (phone, name) => (phone ? 'layPh' : 'lay') + name;
  // The layout this page uses now.
  const phoneNow = () => !LAY_WIDE.matches;
  const layOn = (s) => isOn() && s.layEnabled;
  const sendFree = (s = settings()) => layOn(s) && s[lk(phoneNow(), 'Send')] === 'free';
  const barUpright = (edge) => edge === 'left' || edge === 'right';
  // The menu bar's icons. The bar is never shorter than one icon's room (SillyTavern's bar thickness) for each of them,
  // unless the screen edge is shorter than that: then the icons squeeze to fit.
  const barIcons = (doc = document) => Math.max(1, [...doc.querySelectorAll('#top-settings-holder > .drawer')].filter((d) => doc.defaultView.getComputedStyle(d).display !== 'none').length);
  function barCell(doc = document) {
    const probe = doc.createElement('div');
    probe.style.cssText = 'position: fixed; visibility: hidden; height: var(--topBarBlockSize);';
    doc.body.appendChild(probe);
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
    // Fixed parts are placed in the page's root, which SillyTavern's phone look leaves with no height. Anything held by
    // the bottom of the screen (a bar or Free send bar there, settings panels above it) would end up above the screen.
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

    // Send bar. Free, it has its own place; its bottom edge stays put, so it grows upward as you type more lines.
    if (v('Send') === 'free') {
      const w = n('SendW');
      css += cssRule('body #form_sheld', {
        position: 'fixed', left: `min(${n('SendX')}vw, ${100 - w}vw)`, width: `${w}vw`, margin: '0',
        top: 'auto', bottom: `min(${n('SendB')}dvh, 100dvh - var(--bottomFormBlockSize))`,
      });
      css += cssRule('body #chat', { 'padding-bottom': 'var(--ntr-send-room, 0px)' });
      // It stands apart from the chat panel, like a Separate send box, but without the gap.
      if (s.ovEnabled) css += joinCss(s, true, 'body ');
    }
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
    layoutFg();
    syncWallpaper();
    syncSendRoom();
    window.NTR.vn?.relayout?.();
  }

  // A Free send bar over the bottom of the chat panel: the chat gets that much room at its bottom, so the last message
  // can scroll up above the send bar.
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

  // The Layout page. Its Menu Bar, Send Bar and Back to SillyTavern's Layout change the layout picked under Layout,
  // which starts on the one this screen uses. Edit Layout always changes the one this screen uses.
  let layTab = null;
  const tabPhone = () => (layTab ? layTab === 'phone' : phoneNow());

  function layoutSectionHtml(s) {
    const ph = tabPhone();
    const btn = (id, icon, label) => `<button type="button" id="${id}" class="menu_button" style="margin: 0; width: max-content;"><i class="fa-solid ${icon}"></i> ${label}</button>`;
    return pageHtml('layout', `
        <div class="cb_hint">Move and resize the chat panel, SillyTavern's menu bar and the send bar. There are two layouts: Desktop for screens wider than 1000px, and Phone for screens 1000px wide or less, like phones. Turning Layout on changes nothing until you move something.</div>
        ${card('', `
          <div class="cb_actions" style="margin: 0;">${btn('m_l_edit', 'fa-up-down-left-right', 'Edit Layout')}${btn('m_l_preview', 'fa-mobile-screen-button', 'Phone Preview')}</div>
          <div class="cb_hint">Edit Layout hides the menu so you can drag the parts on screen. It changes the layout this screen uses: <b id="m_l_now"></b>. Drag the handles on the picked part to resize it. Tap the picked part to pick the one under it. Press Done to come back.</div>
          <div class="cb_hint" style="margin-bottom: 0;">Phone Preview shows SillyTavern in a phone-sized window, with its own Edit Layout for the Phone layout. Nothing inside it can be clicked or saved.</div>`)}
        ${card('Layout', `
          ${pills('ltab', [['desk', 'Desktop'], ['phone', 'Phone']], ph ? 'phone' : 'desk')}
          <div class="cb_hint" style="margin-bottom: 0;">Menu Bar, Send Bar and Back to SillyTavern's Layout below change this one.</div>`)}
        ${card('Menu Bar', `
          ${pills('lbaredge', [['top', 'Top'], ['bottom', 'Bottom'], ['left', 'Left'], ['right', 'Right']], s[lk(ph, 'BarEdge')])}
          <div class="cb_hint" style="margin-bottom: 0;">The edge of the screen it sits on. Left and Right stand it on its side. Picking an edge here puts the bar back in its starting spot on that edge. In Edit Layout, slide it along its edge, drag its ends to change its length, or drag it to another edge. Settings panels open out of the bar; on a phone they fill the rest of the screen.</div>`)}
        ${card('Send Bar', `
          ${pills('lsend', [['attached', 'Attached'], ['free', 'Free']], s[lk(ph, 'Send')])}
          <div class="cb_hint" style="margin-bottom: 0;">Attached sits under the chat panel, like SillyTavern, and UI Display's Send Box Position still applies. Free goes anywhere on the screen and grows upward as you type more lines.</div>`)}
        ${card('', `
          ${btn('m_l_reset', 'fa-rotate-left', 'Back to SillyTavern\'s Layout')}
          <div class="cb_hint" style="margin-bottom: 0;">Puts the chat panel, menu bar and send bar back where SillyTavern has them, in the layout picked above.</div>`)}
    `, { sw: ['m_l_enable', s.layEnabled] });
  }

  function bindLayout(overlay, s) {
    const changed = () => { save(); updateAvatarStyle(); syncLayoutPage(overlay); };
    overlay.querySelector('#m_l_enable').onchange = function() { s.layEnabled = this.checked; changed(); };
    overlay.querySelector('#m_l_edit').onclick = () => startPlacement('lay');
    overlay.querySelector('#m_l_preview').onclick = async () => {
      const pv = await loadModule('preview', true);
      if (pv) pv.open();
    };
    onPills(overlay, 'ltab', (v) => { layTab = v; syncLayoutPage(overlay); });
    onPills(overlay, 'lbaredge', (v) => {
      const ph = tabPhone();
      Object.assign(s, { [lk(ph, 'BarEdge')]: v, [lk(ph, 'BarMoved')]: false });
      changed();
    });
    onPills(overlay, 'lsend', (v) => {
      const ph = tabPhone();
      // Free starts where the send bar is now, so it doesn't jump. For the other screen's layout it starts where it was
      // last, or across the bottom.
      const form = document.getElementById('form_sheld');
      if (v === 'free' && s[lk(ph, 'Send')] !== 'free' && ph === phoneNow() && layOn(s) && form) {
        const r = form.getBoundingClientRect(), W = window.innerWidth, H = window.innerHeight;
        const pct = (x, size) => Math.round(x / size * 10000) / 100;
        Object.assign(s, { [lk(ph, 'SendX')]: pct(r.left, W), [lk(ph, 'SendB')]: pct(Math.max(0, H - r.bottom), H), [lk(ph, 'SendW')]: pct(r.width, W) });
      }
      s[lk(ph, 'Send')] = v;
      changed();
    });
    overlay.querySelector('#m_l_reset').onclick = async function() {
      const ph = tabPhone();
      if (!(await askYes(this, `Put the chat panel, menu bar and send bar back where SillyTavern has them, in the ${ph ? 'Phone' : 'Desktop'} layout?`, 'Reset'))) return;
      for (const part of Object.values(LAY_PART)) for (const [k, x] of Object.entries(part.start)) s[lk(ph, k)] = x;
      changed();
    };
    syncLayoutPage(overlay);
  }

  // The Layout page's picks after Edit Layout or the Desktop/Phone pick changed them, and the UI Display settings the
  // layout this screen uses takes over: Chat Width once its chat panel has been moved, Send Box Position while its send
  // bar is Free. The menu follows the window across 1000px.
  function syncLayoutPage(overlay) {
    if (!overlay) return;
    const s = settings();
    const ph = tabPhone(), now = phoneNow();
    for (const [name, val] of [['ltab', ph ? 'phone' : 'desk'], ['lbaredge', s[lk(ph, 'BarEdge')]], ['lsend', s[lk(ph, 'Send')]]]) {
      const r = overlay.querySelector(`input[name="cbr_${name}"][value="${val}"]`);
      if (r) r.checked = true;
    }
    const nowEl = overlay.querySelector('#m_l_now');
    if (nowEl) nowEl.textContent = now ? 'Phone' : 'Desktop';
    const over = { width: layOn(s) && s[lk(now, 'ChatMoved')], send: layOn(s) && s[lk(now, 'Send')] === 'free' };
    overlay.querySelectorAll('.m_l_over').forEach((el) => el.classList.toggle('cb_dim', !!over[el.dataset.lay]));
    overlay.querySelectorAll('.m_l_note').forEach((el) => { el.hidden = !over[el.dataset.lay]; });
  }

  // ===== UI Display =====
  // SillyTavern's round avatars are the absence of a class. Avatar Shape lives in Avatar Management but keeps these keys.
  const AV_CLS = { round: '', rectangle: 'big-avatars', square: 'square-avatars', rounded: 'rounded-avatars' };
  const ALL_AV = ['big-avatars', 'square-avatars', 'rounded-avatars'];
  let bodyTouched = false;
  let bodySnap = null;

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
    if (!bodySnap) bodySnap = ALL_AV.filter((c) => b.classList.contains(c));
    const p = ctx().powerUserSettings;
    const stAv = p && p.avatar_style !== undefined ? [['', ...ALL_AV][Number(p.avatar_style)]].filter(Boolean) : bodySnap;

    // Avatar Shape used to set SillyTavern's avatar classes on the page; it's per side now (see stShapeCss).
    if (bodyTouched) { setBodyClasses(ALL_AV, stAv); bodyTouched = false; }
  }

  function overrideCss(s) {
    let v = '';
    if (s.ovEnabled) {
      if (s.ovWidthOn) v += `--sheldWidth: ${rangeNum(s, 'ovWidth')}vw !important; `;
      if (s.ovBlurOn) v += `--blurStrength: ${rangeNum(s, 'ovBlur')} !important; `;
      if (s.ovShadowOn) v += `--shadowWidth: ${rangeNum(s, 'ovShadow')} !important; `;
    }
    // Overall Font Scale sits in Text Formatting, so that section's switch is the one that counts.
    if (s.tfEnabled && s.ovFontOn) v += `--fontScale: ${rangeNum(s, 'ovFont')} !important; `;
    return v ? `\n      :root { ${v}}\n` : '';
  }

  // Names and Pictures: Hide takes away avatars, names and timestamps, NTR Avatars and pop-outs included.
  const namesHidden = (s) => isOn() && s.ovEnabled && s.ovNamesOn && s.ovNames === 'hide';
  // NTR Avatars on one side: the avatar as a backdrop or pop-out instead of the chat avatar.
  const ntrAvatars = (s, prefix) => isOn() && s.avatarEnabled && s[prefix + 'Enabled'] !== false && !namesHidden(s);

  // One CSS rule, each property !important. Empty properties are left out, and a rule with none left is no rule.
  function cssRule(sel, props) {
    const body = Object.entries(props).filter(([, v]) => v !== '' && v != null).map(([k, v]) => `${k}: ${v} !important;`).join(' ');
    return body ? `\n      ${sel} { ${body} }` : '';
  }
  // A color at an opacity in %: below 100, it's mixed with see-through.
  const seeThrough = (c, opacity) => (opacity < 100 ? `color-mix(in srgb, ${c} ${opacity}%, transparent)` : c);

  // Chat panel, messages and send box. Each setting is SillyTavern's own look while it's unticked.
  const MES_SEL = { Ai: '#chat .mes[is_user="false"]', Us: '#chat .mes[is_user="true"]' };
  const ovColorVal = (s, k, opacity) => seeThrough(COLOR_RE.test(s[k]) ? s[k] : `var(${COLOR_FROM[k]})`, rangeNum(s, opacity));
  const ovRadius = (s, p) => (s[`ov${p}Shape`] === 'square' ? 0 : rangeNum(s, `ov${p}Round`));
  const ovBorderVal = (s, p) => (s[`ov${p}Border`] === 'none' ? 'none' : `${rangeNum(s, `ov${p}BorderWidth`)}px solid ${ovColorVal(s, `ov${p}BorderColor`, `ov${p}BorderOpacity`)}`);

  // Where the chat panel meets the send box. Joined is SillyTavern's own: the send box right under the chat panel, flat
  // where they meet. Standing apart (Separate, or Free in Layout), the panel gets its bottom corners and bottom line back,
  // and the send box all four corners. The top stays flush with SillyTavern's square top bar: no rounded top corners.
  function joinCss(s, separate, pre = '') {
    const on = (k) => s[k + 'On'];
    const pr = on('ovShape') ? (s.ovShape === 'square' ? 0 : rangeNum(s, 'ovRound')) : null;
    const line = on('ovPanelBorder') && s.ovPanelBorder !== 'none';
    const sr = on('ovSendShape') ? ovRadius(s, 'Send') : null;
    return cssRule(`${pre}#chat`, {
      'border-radius': pr === null ? '' : separate ? `0 0 ${pr}px ${pr}px` : '0',
      'border-bottom': !line ? '' : separate ? ovBorderVal(s, 'Panel') : 'none',
    }) + cssRule(`${pre}#form_sheld #send_form`, { 'border-radius': sr === null ? '' : separate ? `${sr}px` : `0 0 ${sr}px ${sr}px` });
  }

  function chatLookCss(s) {
    if (!s.ovEnabled) return '';
    const on = (k) => s[k + 'On'];
    const color = (k, opacity) => ovColorVal(s, k, opacity);
    const radius = (p) => ovRadius(s, p);
    const border = (p) => ovBorderVal(s, p);
    const fill = (p) => (s[`ov${p}Bg`] === 'clear' ? 'transparent' : color(`ov${p}BgColor`, `ov${p}BgOpacity`));
    const separate = on('ovSendPos') && s.ovSendPos === 'separate';
    const noBlur = { 'backdrop-filter': 'none', '-webkit-backdrop-filter': 'none' };
    let css = '';

    // Chat panel. Transparent also clears the boxes around it, as Make Chat Panel Transparent did.
    if (on('ovPanelBg') && s.ovPanelBg === 'clear') css += cssRule('#chat, #sheld, #chat-container, .chat-container', { background: 'transparent', ...noBlur, border: 'none', 'box-shadow': 'none' });
    else if (on('ovPanelBg')) css += cssRule('#chat', { 'background-color': fill('Panel') });
    // No line along the top, which stays flush with SillyTavern's top bar. The corners and the bottom line follow joinCss.
    const line = on('ovPanelBorder') && s.ovPanelBorder !== 'none';
    css += cssRule('#chat', {
      border: on('ovPanelBorder') ? border('Panel') : '',
      'border-top': line ? 'none' : '',
    });
    css += joinCss(s, separate);
    if (on('ovMesGap')) css += cssRule('#chat .mes:not(.last_mes)', { 'margin-bottom': `${rangeNum(s, 'ovMesGap')}px` });

    if (namesHidden(s)) {
      css += cssRule('#chat .mes .mesAvatarWrapper, #chat .mes .ch_name .name_text, #chat .mes .ch_name .timestamp, #chat .mes .ch_name .timestamp-icon', { display: 'none' });
    }

    // AI and User messages. A message with its own background or border gets the room ST's Bubbles style gives it,
    // unless NTR Avatars lays it out.
    for (const p of ['Ai', 'Us']) {
      const sel = MES_SEL[p];
      const boxed = (on(`ov${p}Bg`) && s[`ov${p}Bg`] === 'color') || (on(`ov${p}Border`) && s[`ov${p}Border`] === 'line');
      const r = on(`ov${p}Shape`) ? `${radius(p)}px` : '';
      css += cssRule(sel, {
        'border-radius': r,
        'background-color': on(`ov${p}Bg`) ? fill(p) : '',
        ...(on(`ov${p}Bg`) && s[`ov${p}Bg`] === 'clear' ? noBlur : {}),
        border: on(`ov${p}Border`) ? border(p) : '',
        padding: boxed && !ntrAvatars(s, p.toLowerCase()) ? '10px' : '',
      });
    }

    // Send box.
    const sr = on('ovSendShape') ? radius('Send') : null;
    // #form_sheld in front: SillyTavern's Fast UI gives the send box its color with a stronger rule.
    css += cssRule('#form_sheld #send_form', {
      ...(on('ovSendBg') && s.ovSendBg === 'clear' ? { background: 'transparent', ...noBlur } : { 'background-color': on('ovSendBg') ? fill('Send') : '' }),
      border: on('ovSendBorder') ? border('Send') : '',
      // Bars other extensions put inside it, with their own square backgrounds, follow its rounded corners.
      // SillyTavern's own menus open outside it, so nothing gets cut off.
      overflow: sr ? 'clip' : '',
    });
    if (separate) css += cssRule('#form_sheld', { 'margin-top': `${rangeNum(s, 'ovSendGap')}px` });
    return css ? css + '\n' : '';
  }

  // Chrome, Edge and Safari use the -webkit- parts. Firefox only knows scrollbar-color,
  // and Chrome drops the -webkit- parts when it sees it, so Firefox gets it on its own.
  function scrollbarCss(s) {
    if (!s.ovEnabled) return '';
    const color = s.ovScrollColorOn && COLOR_RE.test(s.ovScrollColor) ? s.ovScrollColor : '';
    const track = s.ovScrollTrackOn && COLOR_RE.test(s.ovScrollTrack) ? s.ovScrollTrack : '';
    let css = '';
    if (track) css += `\n      ::-webkit-scrollbar-track { background-color: ${track}; }\n      ::-webkit-scrollbar-corner { background-color: ${track}; }`;
    if (color) css += `\n      ::-webkit-scrollbar-thumb:vertical, ::-webkit-scrollbar-thumb:horizontal { background-color: ${color}; }`;
    if (color || track) css += `\n      @supports not selector(::-webkit-scrollbar) { * { scrollbar-color: ${color || 'var(--grey7070a)'} ${track || 'transparent'}; } }`;
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
  const TEXT_CURSOR_SEL = 'textarea, input:not([type]), input[type="text"], input[type="search"], input[type="number"], input[type="email"], input[type="url"], input[type="password"], [contenteditable="true"]';
  // Which cursors have a picture right now, for onCursorOver and onCursorDown.
  let cursorKinds = {};
  function cursorCss(s) {
    cursorKinds = {};
    if (!s.ovEnabled || !s.ovCursorOn) return '';
    const size = rangeNum(s, 'ovCursorSize');
    // The picture's top-left corner is the spot that clicks, except Text, which clicks in the middle like an I-beam.
    const one = (src, fallback, mid) => {
      const u = cUrl(src);
      const c = u && cursorImg(u, size);
      if (!c) return '';
      return `url("${c.url}")${mid ? ` ${Math.floor(c.w / 2)} ${Math.floor(c.h / 2)}` : ''}, ${fallback}`;
    };
    const normal = one(s.ovCursorImg, 'auto');
    const ptr = one(s.ovCursorPtrImg, 'pointer');
    const down = one(s.ovCursorDownImg, 'auto');
    const text = one(s.ovCursorTextImg, 'text', true);
    cursorKinds = { normal: !!normal, ptr: !!ptr, down: !!down, text: !!text };
    let css = '';
    // Everything takes the Normal cursor from the page, except what has its own: SillyTavern's hand, resize edges and so on.
    // Typing boxes take the Text cursor, or the system one without it.
    if (normal) css += `\n      html, body { cursor: ${normal}; }\n      [data-ntr-cur="normal"] { cursor: ${normal} !important; }`;
    if (normal || text) css += `\n      :where(${TEXT_CURSOR_SEL}) { cursor: ${text || 'text'}; }`;
    if (text) css += `\n      [data-ntr-cur="text"] { cursor: ${text} !important; }`;
    if (ptr) css += `\n      [data-ntr-cur="ptr"] { cursor: ${ptr} !important; }`;
    // While the mouse button is down, everything but typing boxes takes the Click cursor.
    if (down) css += `\n      html.ntr_cur_down, html.ntr_cur_down *:not(${TEXT_CURSOR_SEL}) { cursor: ${down} !important; }`;
    return css ? css + '\n' : '';
  }
  function onCursorDown(e) {
    if (e.pointerType === 'mouse' && cursorKinds.down) document.documentElement.classList.add('ntr_cur_down');
  }
  const onCursorUp = () => document.documentElement.classList.remove('ntr_cur_down');
  // SillyTavern gives the hand to many kinds of things, too many to list. So the thing under the mouse is checked as the
  // mouse moves onto it: if its own cursor is the hand (or the plain arrow or the text cursor), it's marked to get the custom one instead.
  let cursorEl = null;
  function onCursorOver(e) {
    if (cursorEl) { cursorEl.removeAttribute('data-ntr-cur'); cursorEl = null; }
    const t = e.target;
    if (!(t instanceof Element) || (!cursorKinds.normal && !cursorKinds.ptr && !cursorKinds.text)) return;
    const c = getComputedStyle(t).cursor;
    const kind = c === 'pointer' && cursorKinds.ptr ? 'ptr' : c === 'default' && cursorKinds.normal ? 'normal' : c === 'text' && cursorKinds.text ? 'text' : '';
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
    const v = rangeNum(s, key);
    return `
      <div class="cb_row"><input type="range" class="m_o_sl" data-key="${key}" min="${min}" max="${max}" step="${step}" value="${v}" style="flex:1;"><span style="min-width:60px;text-align:right;"><span id="m_o_${key}val">${v}</span>${unit}</span></div>`;
  }
  function ovColor(s, key) {
    return customElements.get('toolcool-color-picker')
      ? `<toolcool-color-picker class="m_o_col" data-key="${key}" color="${escapeHTML(s[key])}"></toolcool-color-picker>`
      : `<input type="color" class="m_o_col" data-key="${key}" value="${toHex(s[key])}">`;
  }
  function ovText(s, key, placeholder = '') {
    return `<input type="text" class="text_pole m_o_lbl" data-key="${key}" value="${escapeHTML(s[key])}" maxlength="100" placeholder="${escapeHTML(placeholder)}" style="width:100%;">`;
  }
  function ovFx(s, p) {
    return pills(p.toLowerCase() + 'fx', [['glow', 'Glow'], ['shadow', 'Shadow'], ['outline', 'Outline']], s[p + 'Fx']) + rangeSlider(s, p + 'FxStr');
  }
  function fxRows(s, p) {
    return `
          ${ovRow(s, p + 'FxOn', 'Text Effect', ovFx(s, p))}
          ${ovRow(s, p + 'FxColorOn', 'Effect Color', ovColor(s, p + 'FxColor') + '<div class="cb_hint">Without this, Glow uses the text color, and Shadow and Outline are black.</div>')}`;
  }
  function ovFont(s, key) {
    return `<input type="text" class="text_pole m_o_txt" data-key="${key}" value="${escapeHTML(s[key])}" maxlength="300" placeholder="Lora, or a link like fonts.google.com/specimen/Lora" style="width:100%;">`;
  }

  // ===== Reasoning Block and Text Formatting =====
  const COLOR_RE = /^(#[0-9a-f]{3,8}|rgba?\(\s*[\d.]+%?\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*(,\s*[\d.]+%?\s*)?\))$/i;
  const FONT_RE = /^[\p{L}\p{N} _-]{0,60}$/u;
  const cleanFont = (v) => String(v || '').replace(/[^\p{L}\p{N} _-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 60);
  // What's typed in a font box: a font name, or a Google Fonts link (a font's page or a stylesheet link), from which the name is taken.
  function fontName(v) {
    const m = /fonts\.google(?:apis)?\.com\/(?:specimen\/([^/?#]+)|css2?\?family=([^&:;#]+))/i.exec(String(v || ''));
    if (!m) return cleanFont(v);
    const name = (m[1] || m[2]).replace(/\+/g, ' ');
    try { return cleanFont(decodeURIComponent(name)); } catch (e) { return cleanFont(name); }
  }
  const NAME_WEIGHT = { normal: 400, bold: 700, extra: 800 };
  const FX = ['glow', 'shadow', 'outline'];
  const FX_PARTS = ['tfName', 'tfUser', 'tfAi'];
  const RB_BORDERS = ['solid', 'dashed', 'dotted', 'double']; // the button's: unticked is ST's, which has none
  const RB_BOX_BORDERS = ['none', ...RB_BORDERS.filter((b) => b !== 'solid')]; // the box's own line is already solid
  const RB_FX = ['none', 'glow', 'shadow'];
  const RB_SHAPE = { square: '0', rounded: '5px', pill: '999px' };
  const RB_BOX_SHAPE = { rounded: '10px', extra: '20px' }; // unticked: ST's own 2px
  const RB_PATS = ['none', 'notebook', 'lines', 'dots', 'checkers', 'fade'];
  // Fade From: the side the shade starts on, on the same 3x3 grid as picture positions. The center glows outward.
  const RB_FADE = { tl: 'to bottom right', tc: 'to bottom', tr: 'to bottom left', cl: 'to right', cc: '', cr: 'to left', bl: 'to top right', bc: 'to top', br: 'to top left' };
  const OV_SHAPES = ['rounded', 'square'];
  const PICK_KEYS = { tfNameWeight: Object.keys(NAME_WEIGHT), rbBorderStyle: RB_BOX_BORDERS, rbBtnBorder: RB_BORDERS, rbBtnShape: Object.keys(RB_SHAPE), rbBoxShape: Object.keys(RB_BOX_SHAPE), rbPat: RB_PATS, rbPatFade: Object.keys(RB_FADE), rbPatShade: ['light', 'dark'], rbTyping: ['off', 'think', 'both'], rbBtnFx: RB_FX, rbEdgeFx: RB_FX, bannerRotateFx: ['fade', 'swap'], bannerRotateOrder: ['order', 'shuffle'] };
  for (const p of FX_PARTS) PICK_KEYS[p + 'Fx'] = FX;
  // The other pick-one settings a theme holds. The Visual Novel and opening choices match the menus in vn.js and opening.js.
  Object.assign(PICK_KEYS, {
    bannerBackdrop: ['wallpaper', 'panel'], ovAvatar: Object.keys(AV_CLS), ovShape: OV_SHAPES, ovNames: ['show', 'hide'], ovSendPos: ['joined', 'separate'],
    layBarEdge: LAY_EDGES, laySend: ['attached', 'free'], layPhBarEdge: LAY_EDGES, layPhSend: ['attached', 'free'],
    nodeShape: ['rounded', 'round', 'square', 'rect'], artBg: ['none', 'dusk', 'night', 'room', 'forest', 'custom'], artSprite: ['builtin', 'custom', 'none'],
    opPos: ['upper', 'center', 'lower'], opExit: ['stay', 'fade', 'rise'], opTrans: ['color', 'cross'],
  });
  for (const p of ['Panel', ...OV_PARTS]) {
    Object.assign(PICK_KEYS, { [`ov${p}Bg`]: ['clear', 'color'], [`ov${p}Border`]: ['none', 'line'] });
    if (p !== 'Panel') PICK_KEYS[`ov${p}Shape`] = OV_SHAPES;
  }
  for (const p of ['ai', 'us']) {
    Object.assign(PICK_KEYS, { [p + 'Style']: ['inline', 'backdrop', 'popout'], [p + 'Side']: POS_GRID.map(([v]) => v), [p + 'Fit']: ['cover', 'contain', 'original'], [p + 'Shape']: SHAPE_OPTS.map(([v]) => v) });
  }
  // Where an empty color starts from: SillyTavern's own value for the same thing.
  const COLOR_FROM = {
    rbBorder: '--reasoning-body-color', rbBtnColor: '--grey30', rbBtnText: '--SmartThemeBodyColor', rbBtnBorderColor: '--SmartThemeBodyColor', rbBoxColor: '--SmartThemeBlurTintColor', rbPatColor: '--SmartThemeQuoteColor',
    tfNameColor: '--SmartThemeBodyColor',
    tfUserMain: '--SmartThemeBodyColor', tfUserEm: '--SmartThemeEmColor', tfUserUnder: '--SmartThemeUnderlineColor', tfUserQuote: '--SmartThemeQuoteColor',
    tfAiMain: '--SmartThemeBodyColor', tfAiEm: '--SmartThemeEmColor', tfAiUnder: '--SmartThemeUnderlineColor', tfAiQuote: '--SmartThemeQuoteColor',
    tfNameFxColor: '--SmartThemeShadowColor', tfUserFxColor: '--SmartThemeShadowColor', tfAiFxColor: '--SmartThemeShadowColor',
    ovScrollColor: '--grey7070a',
    ovPanelBgColor: '--SmartThemeChatTintColor', ovAiBgColor: '--SmartThemeBotMesBlurTintColor', ovUsBgColor: '--SmartThemeUserMesBlurTintColor', ovSendBgColor: '--SmartThemeBlurTintColor',
    ovPanelBorderColor: '--SmartThemeBorderColor', ovAiBorderColor: '--SmartThemeBorderColor', ovUsBorderColor: '--SmartThemeBorderColor', ovSendBorderColor: '--SmartThemeBorderColor',
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
    const n = rangeNum(s, p + 'FxStr');
    const fx = s[p + 'Fx'];
    const c = s[p + 'FxColorOn'] && COLOR_RE.test(s[p + 'FxColor']) ? s[p + 'FxColor'] : fx === 'glow' ? 'currentColor' : 'rgba(0, 0, 0, .8)';
    if (fx === 'glow') return { 'text-shadow': `0 0 ${n * 2}px ${c}, 0 0 ${n}px ${c}` };
    if (fx === 'shadow') return { 'text-shadow': `${Math.ceil(n / 3)}px ${Math.ceil(n / 3)}px ${n}px ${c}` };
    return { '-webkit-text-stroke': `${(n * 0.2).toFixed(1)}px ${c}`, 'paint-order': 'stroke fill' };
  }

  // Background Pattern: layers drawn over the Box Color, in a shade of it or the Pattern Color. Sizes are in em, so
  // they scale with the text; ruled lines use 1lh, so they sit under each line of text.
  function boxPattern(s, col, base) {
    const kind = RB_PATS.includes(s.rbPat) ? s.rbPat : 'none';
    if (kind === 'none') return [];
    const C = base || 'transparent';
    const own = s.rbPatColorOn && col('rbPatColor');
    const shade = s.rbPatShade === 'dark' ? 'black' : 'white';
    const P = own || `color-mix(in srgb, ${shade} 16%, ${C})`;
    const w = rangeNum(s, 'rbPatThick'), u = rangeNum(s, 'rbPatSize');
    const gap = `calc(${+(1.2 * u).toFixed(2)}em + ${w}px)`;
    const ruled = `linear-gradient(to bottom, transparent calc(1lh - ${w}px), ${P} calc(1lh - ${w}px)) 0 0 / 100% 1lh content-box`;
    const stripes = (deg) => `repeating-linear-gradient(${deg}deg, ${P} 0 ${w}px, transparent ${w}px ${gap})`;
    if (kind === 'notebook') return [`linear-gradient(90deg, transparent 1.5em, rgba(220, 110, 110, .55) 1.5em calc(1.5em + ${w}px), transparent 0) padding-box`, ruled];
    if (kind === 'lines') {
      return [[s.rbPatH, ruled], [s.rbPatV, stripes(90)], [s.rbPatR, stripes(135)], [s.rbPatL, stripes(45)]].filter(([on]) => on).map(([, l]) => l);
    }
    if (kind === 'dots') {
      const r = Math.min(45, 10 + w * 5); // Thickness makes the dots bigger
      return [`radial-gradient(${P} ${r}%, transparent ${r + 2}%) 0 0 / ${u}em ${u}em`];
    }
    if (kind === 'checkers') {
      const q = `${+(1.6 * u).toFixed(2)}em`;
      return [`conic-gradient(${P} 25%, transparent 0 50%, ${P} 0 75%, transparent 0) 0 0 / ${q} ${q}`];
    }
    // Fade: the Box Color itself turns see-through, starting on the Fade From side.
    const dir = RB_FADE[s.rbPatFade] ?? 'to bottom';
    return [dir ? `linear-gradient(${dir}, transparent, ${C})` : `radial-gradient(closest-side, transparent, ${C})`];
  }

  function textFormatCss(s) {
    const on = (k) => s[k + 'On'];
    const col = (k) => (on(k) && COLOR_RE.test(s[k]) ? s[k] : '');
    const font = (k) => { const f = on(k) ? cleanFont(s[k]) : ''; return f ? `"${f}", var(--mainFontFamily)` : ''; };
    const size = (k) => (on(k) ? rangeNum(s, k) : 0);
    let css = '';

    // Border Effects: Glow in the border's color, or a black Shadow. The reasoning box's sits on its left edge.
    const edgeFx = (k, c, spread, left) => {
      if (!RB_FX.includes(s[k]) || s[k] === 'none') return '';
      const n = rangeNum(s, k + 'Size'), o = Math.ceil(n / 3);
      return s[k] === 'glow' ? `${left ? -o : 0}px 0 ${n}px ${spread} ${c}` : `${left ? -o : o}px ${o}px ${n}px ${spread} rgba(0, 0, 0, .6)`;
    };
    if (s.rbEnabled) {
      // The reasoning text box. SillyTavern colors it from these variables, so overriding them keeps its dimming and quote handling.
      const boxOp = on('rbBoxAlpha') ? rangeNum(s, 'rbBoxOpacity') : 100;
      const boxFill = col('rbBoxColor') || (boxOp < 100 ? 'var(--SmartThemeBlurTintColor)' : '');
      const boxBg = boxFill && seeThrough(boxFill, boxOp);
      const pat = boxPattern(s, col, boxBg);
      const bs = on('rbBorderStyle') && RB_BOX_BORDERS.includes(s.rbBorderStyle) ? s.rbBorderStyle : '';
      css += cssRule('.mes_reasoning', {
        'border-radius': on('rbBoxShape') ? RB_BOX_SHAPE[s.rbBoxShape] || '' : '',
        'background-color': pat.length ? '' : boxBg,
        background: pat.length ? [...pat, s.rbPat === 'fade' ? 'transparent' : boxBg || 'transparent'].join(', ') : '',
        'padding-left': s.rbPat === 'notebook' ? '2.1em' : '',
        '--reasoning-saturation': on('rbSat') ? rangeNum(s, 'rbSat') / 100 : '',
        'border-left-color': col('rbBorder'),
        'font-family': font('rbFont'),
        'border-left-style': bs,
        'border-left-width': bs === 'double' ? '4px' : '',
        'box-shadow': edgeFx('rbEdgeFx', col('rbBorder') || 'var(--reasoning-body-color)', '-2px', true),
      });
      // The Reasoning Button above it. ST's has no border and rounded corners.
      const bb = on('rbBtnBorder') && RB_BORDERS.includes(s.rbBtnBorder) ? s.rbBtnBorder : '';
      const bc = col('rbBtnBorderColor') || 'currentColor';
      const op = on('rbBtnAlpha') ? rangeNum(s, 'rbBtnOpacity') : 100;
      const fill = col('rbBtnColor') || (op < 100 ? 'var(--grey30)' : '');
      css += cssRule('.mes_reasoning_header', {
        'background-color': fill && seeThrough(fill, op),
        color: col('rbBtnText'),
        'border-radius': s.rbBtnShape !== 'rounded' ? RB_SHAPE[s.rbBtnShape] || '' : '',
        border: bb ? `${bb === 'double' ? 3 : 1}px ${bb} ${bc}` : '',
        'box-shadow': edgeFx('rbBtnFx', bc, '0px', false),
      });
    }

    if (!s.tfEnabled) return css ? css + '\n' : '';

    // Names on chat messages, and the speaker's name tag in Visual Novel Mode.
    const ns = size('tfNameSize');
    css += cssRule('.mes .name_text', {
      color: col('tfNameColor'),
      'font-family': font('tfNameFont'),
      'font-size': ns ? `calc(var(--mainFontSize) * ${ns})` : '',
      'font-weight': on('tfNameWeight') ? NAME_WEIGHT[s.tfNameWeight] : '',
      ...fxProps(s, 'tfName'),
    });
    css += cssRule('#cb_node .cb_n_name', { color: col('tfNameColor'), 'font-family': font('tfNameFont'), ...fxProps(s, 'tfName') });

    // User and AI message text. The Visual Novel dialogue box uses the AI's.
    for (const [p, flag] of [['tfUser', 'true'], ['tfAi', 'false']]) {
      const m = `.mes[is_user="${flag}"] .mes_text`;
      const sz = size(p + 'Size');
      css += cssRule(m, { color: col(p + 'Main'), 'font-family': font(p + 'Font'), 'font-size': sz ? `calc(var(--mainFontSize) * ${sz})` : '', ...fxProps(s, p) });
      css += cssRule(`${m} i, ${m} em`, { color: col(p + 'Em') });
      css += cssRule(`${m} u`, { color: col(p + 'Under') });
      css += cssRule(`${m} q`, { color: col(p + 'Quote') });
      if (col(p + 'Em')) css += cssRule(`${m} q i, ${m} q em`, { color: 'inherit' });
    }
    css += cssRule('#cb_node .cb_n_text', { color: col('tfAiMain'), 'font-family': font('tfAiFont'), ...fxProps(s, 'tfAi') });
    css += cssRule('#cb_node .cb_n_text em', { color: col('tfAiEm') });
    css += cssRule('#cb_node .cb_q', { color: col('tfAiQuote') });
    if (col('tfAiEm')) css += cssRule('#cb_node .cb_q em', { color: 'inherit' });
    return css ? css + '\n' : '';
  }

  // Custom CSS for the reasoning button and box, and for the scrollbar, each in its own style tag so a typo can't break
  // the extension's other styles.
  const RB_CSS = [['rbBtnCss', '.mes_reasoning_header'], ['rbCss', '.mes_reasoning']];
  // The reasoning Custom CSS boxes that `get` gives text for, each inside its part's selector.
  const rbCssText = (get) => RB_CSS.map(([k, sel]) => {
    const c = String(get(k) || '').slice(0, 2000).trim();
    return c ? `${sel} { ${c} }` : '';
  }).filter(Boolean).join('\n');
  function syncCustomCss() {
    const s = settings();
    const live = isOn() && s.rbEnabled;
    cssTag('ntr_rb_css', rbCssText((k) => live && s[k + 'On'] && s[k]));
    cssTag('ntr_scroll_css', isOn() && s.ovEnabled && s.ovScrollCssOn ? String(s.ovScrollCss || '').slice(0, 2000).trim() : '');
  }
  function cssTag(id, v) {
    let el = document.getElementById(id);
    if (!v) { el?.remove(); return; }
    if (!el) { el = document.createElement('style'); el.id = id; document.head.appendChild(el); }
    el.textContent = v;
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

  // Reasoning status text. ST rewrites the label while it thinks and when it finishes; the label is swapped on screen
  // only, after each of ST's updates. ST's own text is kept on the element so it comes back when the override is off.
  // An empty box means ST's own text, which the menu shows greyed in the box.
  const RB_LABEL = { think: 'rbThink', done: 'rbDone', some: 'rbSome' };
  const RB_ST_LABEL = { rbThink: 'Thinking...', rbDone: 'Thought for {time}', rbSome: 'Thought for some time' };
  function rbTime(sec) {
    const m = window.moment;
    if (m && m.duration) {
      try { return m.duration(sec * 1000).locale(ctx().getCurrentLocale?.() || 'en').humanize({ s: 50, ss: 3 }); } catch (e) {}
    }
    return `${Math.round(sec)} seconds`;
  }
  const rbState = (el) => { const d = el.dataset.duration; return d === undefined ? 'think' : d === 'unknown' ? 'some' : 'done'; };
  function rbLabelFor(el, s, state) {
    const txt = String(s[RB_LABEL[state]] || '').slice(0, 100);
    if (!txt.trim()) return null;
    return state === 'done' ? txt.replace(/\{time\}/gi, rbTime(Number(el.dataset.duration) || 0)) : txt;
  }

  // Typewriter Effect. It plays only live: on a block that's thinking now, and (if picked) on its finished label when the
  // thinking ends. Labels already in the chat show at once. Dots at the end of the thinking label keep looping until it's done.
  const RB_TYPE_MS = 45, RB_DOT_MS = 350;
  const rbAnim = new WeakMap();
  const rbKey = new WeakMap();
  const rbMotion = (s) => isOn() && s.rbEnabled && s.rbTyping !== 'off' && !ctx().powerUserSettings?.reduced_motion
    && !window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  function rbNewAnim(text, state) {
    const loop = state === 'think' && text.endsWith('...');
    return { text, state, n: 1, loop, base: loop ? text.slice(0, -3) : text, dots: 3, done: false, timer: 0 };
  }
  // A frame is the typed part and the rest. The rest is laid out but hidden, so the button keeps its full width while typing.
  const rbFrame = (a) => (a.n < a.text.length ? [a.text.slice(0, a.n), a.text.slice(a.n)]
    : a.loop ? [a.base + '.'.repeat(a.dots), '.'.repeat(3 - a.dots)] : [a.text, '']);
  function rbWrite(el, [shown, rest]) {
    el.textContent = shown;
    if (rest) { const r = document.createElement('span'); r.style.visibility = 'hidden'; r.textContent = rest; el.append(r); }
    el.dataset.ntrOwn = el.innerHTML;
    rbKey.set(el, shown + '\0' + rest);
  }
  function rbTick(el) {
    const a = rbAnim.get(el);
    if (!a || a.done) return;
    if (!el.isConnected || !rbMotion(settings())) { a.done = true; if (el.isConnected) syncReasoningLabels(); return; }
    if (a.n < a.text.length) a.n++;
    else if (a.loop) a.dots = (a.dots + 1) % 4;
    else { a.done = true; return; }
    if (el.innerHTML !== el.dataset.ntrOwn) el.dataset.ntrSt = el.textContent; // ST wrote in between
    rbWrite(el, rbFrame(a));
    a.timer = setTimeout(() => rbTick(el), a.n < a.text.length ? RB_TYPE_MS : RB_DOT_MS);
  }

  // Labels to check: those in the given messages, or every one in the chat.
  function syncReasoningLabels(mes) {
    const s = settings();
    const on = isOn() && s.rbEnabled;
    const motion = rbMotion(s);
    const els = mes ? mes.flatMap((m) => [...m.querySelectorAll('.mes_reasoning_header_title')])
      : document.querySelectorAll('#chat .mes_reasoning_header_title');
    els.forEach((el) => {
      // Text NTR wrote itself isn't ST's, so changing a label twice still brings back ST's own text later.
      const mine = el.dataset.ntrOwn !== undefined && el.innerHTML === el.dataset.ntrOwn;
      const st = mine ? el.dataset.ntrSt : el.textContent;
      const state = rbState(el);
      const custom = on ? rbLabelFor(el, s, state) : null;
      const full = custom ?? st;
      const wants = motion && (state === 'think' || s.rbTyping === 'both');
      let a = rbAnim.get(el);
      // A label still typing is over once the block moves on, from thinking to finished.
      if (a && !a.done && a.state !== state) { clearTimeout(a.timer); a.done = true; }
      // Typing waits until the button shows: ST hides the block until the first reasoning text arrives.
      if (wants && (a ? a.state !== state : el.closest('.mes_reasoning_details')?.dataset.state === 'thinking') && el.getClientRects().length) {
        a = rbNewAnim(full, state);
        rbAnim.set(el, a);
        a.timer = setTimeout(() => rbTick(el), RB_TYPE_MS);
      } else if (a && !a.done && a.text !== full) {
        // The label changed mid-typing, from the menu: type on into the new one.
        Object.assign(a, rbNewAnim(full, state), { n: Math.min(a.n, full.length), timer: a.timer });
      }
      const typingNow = wants && a && !a.done;
      if (custom === null && !typingNow) {
        if (mine && (el.textContent !== st || el.childElementCount)) el.textContent = st;
        delete el.dataset.ntrSt;
        delete el.dataset.ntrOwn;
        rbKey.delete(el);
        return;
      }
      const frame = typingNow ? rbFrame(a) : [full, ''];
      el.dataset.ntrSt = st;
      if (!mine || rbKey.get(el) !== frame.join('\0')) rbWrite(el, frame);
    });
  }
  // Streaming changes one message many times a second, so only the messages that changed are checked, not the whole chat.
  let rbObs = null, rbQueued = null;
  function watchReasoningLabels() {
    const chat = document.getElementById('chat');
    if (rbObs || !chat || !window.MutationObserver) return;
    rbObs = new MutationObserver((recs) => {
      const first = !rbQueued;
      rbQueued ??= new Set();
      for (const r of recs) {
        const t = r.target.nodeType === 1 ? r.target : r.target.parentElement;
        const m = t && t.closest('.mes');
        if (m) { rbQueued.add(m); continue; }
        for (const a of r.addedNodes) {
          if (a.nodeType !== 1) continue;
          if (a.matches('.mes')) rbQueued.add(a);
          a.querySelectorAll('.mes').forEach((e) => rbQueued.add(e));
        }
      }
      if (!first) return;
      requestAnimationFrame(() => {
        const mes = [...rbQueued].filter((m) => chat.contains(m));
        rbQueued = null;
        syncReasoningLabels(mes);
      });
    });
    rbObs.observe(chat, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['data-duration'] });
  }

  const FONT_NOTE = 'Use a font on your device, or any font from Google Fonts by its name or a link to it. Google fonts load on their own while you\'re online. Type the name exactly as it\'s written.';

  const customCssBox = (s, k, ph) => `<textarea class="text_pole m_css" data-key="${k}" rows="5" maxlength="2000" spellcheck="false" placeholder="${ph}" style="width:100%;font-family:monospace;">${escapeHTML(s[k])}</textarea>`;
  function bindCssBoxes(overlay, prefix) {
    overlay.querySelectorAll(`.m_css[data-key^="${prefix}"]`).forEach((box) => {
      box.oninput = () => { settings()[box.dataset.key] = box.value.slice(0, 2000); syncCustomCss(); };
      box.onchange = save;
    });
  }

  function reasoningSectionHtml(s) {
    // A status text box has no tick: an empty box means ST's own text, shown greyed in the box.
    const label = (key, title, hint = '') => `
            <div class="cb_ovrow"><div>${title}</div><div class="m_o_body cb_flat">${ovText(s, key, RB_ST_LABEL[key])}${hint}</div></div>`;
    const borders = [['solid', 'Solid'], ['dashed', 'Dashed'], ['dotted', 'Dotted'], ['double', 'Double']];
    const cssBox = (k, ph) => customCssBox(s, k, ph);
    // A pick-one row with no tick: its default choice is SillyTavern's own look.
    const pickRow = (title, inner, attrs = '') => `
          <div class="cb_ovrow"${attrs}><div class="cb_plab">${title}</div><div class="m_o_body">${inner}</div></div>`;
    const patLine = (k, label) => `<label class="checkbox_label"><input type="checkbox" class="m_rb_patline" data-key="${k}" ${s[k] ? 'checked' : ''}><span>${label}</span></label>`;
    const fxOpts = [['none', 'None', 'SillyTavern\'s default'], ['glow', 'Glow'], ['shadow', 'Shadow']];
    const fxSize = (k) => `<div class="m_rb_fxsize ${s[k] === 'none' ? 'cb_dim' : ''}" data-for="${k}">${rangeSlider(s, k + 'Size')}</div>`;
    return pageHtml('reasoning', `
          <div class="cb_hint">Only changes how the block looks. To show reasoning boxes, make sure "Request model reasoning" in AI Response Configuration (Chat Completion), or "Auto-Parse" under Reasoning in AI Response Formatting (Text Completion) are enabled.</div>
          <div class="cb_hint">Tick a setting to change it; untick it to go back to ST's look. Settings without a tick start on ST's look.</div>
          ${subHead('rb_header', 'Reasoning Status Text')}
          <div class="cb_collapse_content">
            ${ovRow(s, 'rbBtnTextOn', 'Text Color', ovColor(s, 'rbBtnText'))}
            <div class="cb_hint" style="margin-top:6px;">Leave a box empty to use ST's own wording.</div>
            ${label('rbThink', 'While Thinking')}
            ${label('rbDone', 'Finished', '<div class="cb_hint">Note: {time} shows "12 seconds", "a minute", etc.</div>')}
            ${label('rbSome', 'Finished, Time Unknown')}
            <div class="cb_ovrow cb_sep">
              <div>Typewriter Effect</div>
              <div class="m_o_body cb_flat">${pills('rbtyping', [['off', 'Off'], ['think', 'While Thinking'], ['both', 'Thinking and Finished']], s.rbTyping)}<div class="cb_hint">Types the label out live, with looping dots while thinking. Off with ST Reduced Motion enabled.</div></div>
            </div>
          </div>
          ${card('Reasoning Button', `
          ${ovRow(s, 'rbBtnColorOn', 'Button Color', ovColor(s, 'rbBtnColor'))}
          ${ovRow(s, 'rbBtnAlphaOn', 'Background Color Opacity', rangeSlider(s, 'rbBtnOpacity'))}
          ${pickRow('Button Shape', pills('rbbtnshape', [['square', 'Square'], ['rounded', 'Rounded', 'SillyTavern\'s default'], ['pill', 'Pill']], s.rbBtnShape))}
          ${ovRow(s, 'rbBtnBorderOn', 'Border Style', pills('rbbtnborder', borders, s.rbBtnBorder))}
          ${ovRow(s, 'rbBtnBorderColorOn', 'Border Color', ovColor(s, 'rbBtnBorderColor') + '<div class="cb_hint">Without this, the border follows the button\'s text color.</div>')}
          ${pickRow('Border Effects', pills('rbbtnfx', fxOpts, s.rbBtnFx) + fxSize('rbBtnFx') + '<div class="cb_hint">Glow uses the Border Color, or the button\'s text color without one. Shadow is black.</div>')}`)}
          ${card('Reasoning Box', `
          ${ovRow(s, 'rbBoxColorOn', 'Box Color', ovColor(s, 'rbBoxColor') + '<div class="cb_hint">SillyTavern\'s box has no background.</div>')}
          ${ovRow(s, 'rbBoxAlphaOn', 'Background Color Opacity', rangeSlider(s, 'rbBoxOpacity'))}
          ${ovRow(s, 'rbFontOn', 'Font', ovFont(s, 'rbFont') + `<div class="cb_hint">${FONT_NOTE}</div>`)}
          ${ovRow(s, 'rbSatOn', 'Text Color Strength', rangeSlider(s, 'rbSat') + '<div class="cb_hint">SillyTavern shows reasoning colors at 50%. 100% is full color, 0% is grey.</div>')}
          ${ovRow(s, 'rbBoxShapeOn', 'Box Shape', pills('rbboxshape', [['rounded', 'Rounded'], ['extra', 'Extra Rounded']], s.rbBoxShape))}
          ${ovRow(s, 'rbBorderStyleOn', 'Border Style', pills('rbbstyle', [['none', 'None'], ...borders.filter(([v]) => v !== 'solid')], s.rbBorderStyle))}
          ${ovRow(s, 'rbBorderOn', 'Border Color', ovColor(s, 'rbBorder') + '<div class="cb_hint">Without this, the border follows the text color.</div>')}
          ${pickRow('Border Effects', pills('rbedgefx', fxOpts, s.rbEdgeFx) + fxSize('rbEdgeFx') + '<div class="cb_hint">Glow uses the Border Color, or the text color without one. Shadow is black.</div>')}
          ${subHead('rb_pattern', 'Background Pattern')}
          <div class="cb_collapse_content">
          ${pickRow('Pattern', pills('rbpat', [['none', 'None'], ['notebook', 'Notebook'], ['lines', 'Lines'], ['dots', 'Dots'], ['checkers', 'Checkers'], ['fade', 'Fade']], s.rbPat))}
          ${pickRow('Lines', `<div class="ntr_rbpat_lines">${patLine('rbPatH', 'Horizontal')}${patLine('rbPatV', 'Vertical')}${patLine('rbPatR', 'Diagonal /')}${patLine('rbPatL', 'Diagonal \\')}</div>`
            + '<button class="menu_button" id="m_rb_patreset" style="margin:6px 0 0;">Reset</button><div class="cb_hint">Mix them: Horizontal and Vertical make a grid, both diagonals make diamonds. Horizontal follows the text lines.</div>', ' data-rbpat="lines"')}
          ${pickRow('Fade From', posGrid('rbpatfade', s.rbPatFade) + '<div class="cb_hint">The Box Color fades to see-through from this side. The center fades from the middle out. Needs a Box Color.</div>', ' data-rbpat="fade"')}
          ${pickRow('Pattern Shade', pills('rbpatshade', [['light', 'Lighter'], ['dark', 'Darker']], s.rbPatShade) + '<div class="cb_hint">Darker flips it: dark dots or squares on the box color.</div>', ' data-rbpat="drawn"')}
          <div data-rbpat="drawn">${ovRow(s, 'rbPatColorOn', 'Pattern Color', ovColor(s, 'rbPatColor') + '<div class="cb_hint">Without this, the pattern is a shade of the Box Color.</div>')}</div>
          ${pickRow('Thickness', `<div class="m_rb_patdim" data-for="thick">${rangeSlider(s, 'rbPatThick')}</div><div class="cb_hint">How thick the lines are, or how big the dots are. Checkers doesn't use it.</div>`, ' data-rbpat="drawn"')}
          ${pickRow('Pattern Size', `<div class="m_rb_patdim" data-for="size">${rangeSlider(s, 'rbPatSize')}</div><div class="cb_hint">Spacing of the pattern. Notebook and Horizontal lines follow the text lines instead.</div>`, ' data-rbpat="drawn"')}
          </div>`)}
          ${subHead('rb_css', 'Advanced: Custom CSS')}
          <div class="cb_collapse_content">
            ${ovRow(s, 'rbBtnCssOn', 'Button CSS', cssBox('rbBtnCss', 'text-transform: uppercase;&#10;letter-spacing: 1px;') + '<div class="cb_hint">CSS for the reasoning button, like <code>text-transform: uppercase;</code>.</div>')}
            ${ovRow(s, 'rbCssOn', 'Box CSS', cssBox('rbCss', 'letter-spacing: 1px;&#10;& em { color: gold; }') + '<div class="cb_hint">CSS for the reasoning box, like <code>letter-spacing: 1px;</code>. Use <code>&amp; em { ... }</code> for italics.</div>')}
            <div class="cb_hint">Add <code>!important</code> if a setting doesn't take. To style the rest of SillyTavern, use SillyTavern's own Custom CSS in User Settings. Saved in themes. Themes from someone else bring their CSS switched off, so you can check it before turning it on.</div>
          </div>
    `, { sw: ['m_rb_enable', s.rbEnabled] });
  }

  function textSectionHtml(s) {
    const part = (p) => `
          ${ovRow(s, p + 'FontOn', 'Font', ovFont(s, p + 'Font'))}
          ${ovRow(s, p + 'SizeOn', 'Size', rangeSlider(s, p + 'Size'))}
          ${ovRow(s, p + 'MainOn', 'Main Text Color', ovColor(s, p + 'Main'))}
          ${ovRow(s, p + 'EmOn', 'Italics Color', ovColor(s, p + 'Em'))}
          ${ovRow(s, p + 'UnderOn', 'Underline Color', ovColor(s, p + 'Under'))}
          ${ovRow(s, p + 'QuoteOn', 'Quote Color', ovColor(s, p + 'Quote'))}${fxRows(s, p)}`;
    return pageHtml('text', `
          <div class="cb_hint">Styles chat text. Also used in the Visual Novel box: AI Text for the dialogue, Names for the name tag. Tick a setting to change it; untick it to go back to ST's look. ${FONT_NOTE}</div>
          ${card('', ovRow(s, 'ovFontOn', 'Overall Font Scale', rangeSlider(s, 'ovFont') + '<div class="cb_hint">Scales all of SillyTavern\'s text, menus included. The Size settings below are on top of this.</div>'))}
          ${subHead('tf_names', 'Names')}
          <div class="cb_collapse_content">
            <div class="cb_hint">The name at the top of each message, for both you and the character.</div>
            ${ovRow(s, 'tfNameFontOn', 'Font', ovFont(s, 'tfNameFont'))}
            ${ovRow(s, 'tfNameSizeOn', 'Size', rangeSlider(s, 'tfNameSize'))}
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
        el.value = fontName(el.value);
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
    onPills(overlay, 'rbtyping', (v) => { s.rbTyping = v; save(); syncReasoningLabels(); });
    overlay.querySelectorAll('.m_o_lbl').forEach((el) => {
      el.onchange = () => {
        s[el.dataset.key] = el.value.slice(0, 100);
        save();
        updateAvatarStyle();
      };
    });
    onPills(overlay, 'rbbtnshape', (v) => { s.rbBtnShape = v; save(); updateAvatarStyle(); });
    onPills(overlay, 'rbbtnborder', (v) => { s.rbBtnBorder = v; save(); updateAvatarStyle(); });
    for (const [name, k] of [['rbbtnfx', 'rbBtnFx'], ['rbedgefx', 'rbEdgeFx']]) {
      onPills(overlay, name, (v) => {
        s[k] = v; save(); updateAvatarStyle();
        overlay.querySelector(`.m_rb_fxsize[data-for="${k}"]`).classList.toggle('cb_dim', v === 'none');
      });
    }
    onPills(overlay, 'tfnweight', (v) => { s.tfNameWeight = v; save(); updateAvatarStyle(); });
    onPills(overlay, 'rbboxshape', (v) => { s.rbBoxShape = v; save(); updateAvatarStyle(); });
    // Background Pattern: show the rows for the picked pattern, and dim the sliders it doesn't use.
    const syncPatRows = () => {
      const p = s.rbPat;
      overlay.querySelectorAll('[data-rbpat]').forEach((r) => { r.style.display = r.dataset.rbpat === p || (r.dataset.rbpat === 'drawn' && p !== 'none' && p !== 'fade') ? '' : 'none'; });
      const onlyH = p === 'lines' && s.rbPatH && !s.rbPatV && !s.rbPatR && !s.rbPatL;
      overlay.querySelector('.m_rb_patdim[data-for="thick"]').classList.toggle('cb_dim', p === 'checkers');
      overlay.querySelector('.m_rb_patdim[data-for="size"]').classList.toggle('cb_dim', p === 'notebook' || onlyH);
    };
    const patSet = (k, v) => { s[k] = v; save(); updateAvatarStyle(); syncPatRows(); };
    onPills(overlay, 'rbpat', (v) => patSet('rbPat', v));
    onPills(overlay, 'rbpatshade', (v) => patSet('rbPatShade', v));
    onPills(overlay, 'rbpatfade', (v) => patSet('rbPatFade', v));
    overlay.querySelectorAll('.m_rb_patline').forEach((c) => { c.onchange = () => patSet(c.dataset.key, c.checked); });
    overlay.querySelector('#m_rb_patreset').onclick = () => {
      overlay.querySelectorAll('.m_rb_patline').forEach((c) => { c.checked = false; s[c.dataset.key] = false; });
      patSet('rbPatH', false);
    };
    syncPatRows();
    onPills(overlay, 'rbbstyle', (v) => { s.rbBorderStyle = v; save(); updateAvatarStyle(); });
    for (const p of FX_PARTS) onPills(overlay, p.toLowerCase() + 'fx', (v) => { s[p + 'Fx'] = v; save(); updateAvatarStyle(); });
    bindCssBoxes(overlay, 'rb');
  }

  // One cursor picture: preview, Upload / Link / Remove.
  function cursorSlot(k, label, hint, icon) {
    return `
      <div class="cb_cur_slot">
        <div class="cb_cur_row">
          <div class="cb_cur_prev" id="m_cur_prev_${k}" data-icon="${icon}"></div>
          <span class="cb_cur_name">${label}<small>${hint}</small></span>
          <button class="menu_button m_cur_up" data-k="${k}" title="Upload"><i class="fa-solid fa-upload"></i></button>
          <button class="menu_button m_cur_url" data-k="${k}" data-label="${label} cursor" title="Use a link"><i class="fa-solid fa-link"></i></button>
          <button class="menu_button m_cur_clr" data-k="${k}" title="Remove image"><i class="fa-solid fa-rotate-left"></i></button>
        </div>
      </div>`;
  }

  // Pick-one rows of UI Display: the radio name is the key in lower case, with "o" in front.
  const ovPick = (s, k, opts) => pills('o' + k.toLowerCase(), opts, s[k]);
  // Shown only while a pick has a certain value, like Roundness under Rounded.
  const ovWhen = (k, v, inner) => `<div class="m_o_when" data-when="${k}" data-val="${v}">${inner}</div>`;
  const ovLabel = (label, inner) => `<div class="cb_hint" style="margin:6px 0 0;">${label}</div>${inner}`;

  function displaySectionHtml(s) {
    const row = (onKey, label, inner) => ovRow(s, onKey, label, inner);
    const sl = (key) => rangeSlider(s, key);
    const shape = (p) => row(`ov${p}ShapeOn`, 'Shape', ovPick(s, `ov${p}Shape`, [['rounded', 'Rounded'], ['square', 'Square']])
      + ovWhen(`ov${p}Shape`, 'rounded', ovLabel('Roundness', sl(`ov${p}Round`))));
    const bg = (p, hint = '') => row(`ov${p}BgOn`, 'Background', ovPick(s, `ov${p}Bg`, [['clear', 'Transparent'], ['color', 'Color']])
      + ovWhen(`ov${p}Bg`, 'color', ovLabel('Color', ovColor(s, `ov${p}BgColor`)) + ovLabel('Opacity', sl(`ov${p}BgOpacity`))) + hint);
    const border = (p) => row(`ov${p}BorderOn`, 'Border', ovPick(s, `ov${p}Border`, [['none', 'None'], ['line', 'Line']])
      + ovWhen(`ov${p}Border`, 'line', ovLabel('Line Color', ovColor(s, `ov${p}BorderColor`)) + ovLabel('Thickness', sl(`ov${p}BorderWidth`)) + ovLabel('Opacity', sl(`ov${p}BorderOpacity`))));
    return pageHtml('display', `
          <div class="cb_hint">Changes how SillyTavern looks without touching its own settings. Tick a setting to change it; untick it to go back to ST's value.</div>
          ${card('Whole Interface', `
          ${row('ovShapeOn', 'Interface Shape', ovPick(s, 'ovShape', [['rounded', 'Rounded'], ['square', 'Square']])
            + ovWhen('ovShape', 'rounded', ovLabel('Roundness', sl('ovRound')))
            + '<div class="cb_hint">Rounds the chat panel\'s bottom corners when the Send Box is Separate, or Free in Layout. The top stays flush with the top bar. Messages and the send box have their own Shape.</div>')}
          ${row('ovBlurOn', 'Blur Strength', sl('ovBlur') + '<div class="cb_hint">The frosted-glass blur behind the chat, menus, drawers and popups.</div>')}
          ${row('ovShadowOn', 'Shadow Width', sl('ovShadow') + '<div class="cb_hint">The dark glow around all text in SillyTavern.</div>')}`)}
          ${card('Chat Panel', `
          ${bg('Panel', '<div class="cb_hint">Transparent shows the background picture through the chat.</div>')}
          <div class="m_l_over" data-lay="width">${row('ovWidthOn', 'Chat Width', sl('ovWidth'))}</div>
          <div class="cb_hint m_l_note" data-lay="width" hidden>You moved the chat panel in Layout, so its size is set there.</div>
          ${border('Panel')}
          ${row('ovMesGapOn', 'Space Between Messages', sl('ovMesGap'))}
          ${row('ovNamesOn', 'Names and Pictures', ovPick(s, 'ovNames', [['show', 'Show'], ['hide', 'Hide']])
            + '<div class="cb_hint">Hide takes away avatars, names and timestamps, NTR Avatars and pop-outs included.</div>')}`)}
          ${card('AI Message', shape('Ai') + bg('Ai') + border('Ai'))}
          ${card('User Message', shape('Us') + bg('Us') + border('Us'))}
          ${card('Send Box', shape('Send') + bg('Send') + border('Send')
            + `<div class="m_l_over" data-lay="send">${row('ovSendPosOn', 'Position', ovPick(s, 'ovSendPos', [['joined', 'Joined'], ['separate', 'Separate']])
              + ovWhen('ovSendPos', 'separate', ovLabel('Gap', sl('ovSendGap')))
              + '<div class="cb_hint">Joined sits right under the chat panel, flat where they meet, like SillyTavern. Separate is its own box with a gap above it.</div>')}</div>`
            + '<div class="cb_hint m_l_note" data-lay="send" hidden>The send bar is Free in Layout, so it stands on its own.</div>')}
          ${subHead('ov_scroll', 'Scrollbar')}
          <div class="cb_collapse_content">
            <div class="cb_hint">Changes every scrollbar in SillyTavern. Phones mostly show their own scrollbars.</div>
            ${row('ovScrollColorOn', 'Scrollbar Color', ovColor(s, 'ovScrollColor'))}
            ${row('ovScrollTrackOn', 'Track Color', ovColor(s, 'ovScrollTrack') + '<div class="cb_hint">The strip behind the scrollbar. SillyTavern leaves it see-through.</div>')}
            ${subHead('ov_scroll_css', 'Advanced: Custom CSS')}
            <div class="cb_collapse_content">
              ${row('ovScrollCssOn', 'Scrollbar CSS', customCssBox(s, 'ovScrollCss', '::-webkit-scrollbar { width: 6px; height: 6px; }&#10;::-webkit-scrollbar-thumb { border-radius: 0; }')
                + '<div class="cb_hint">Whole CSS rules, like <code>::-webkit-scrollbar { width: 6px; }</code> for the width or <code>::-webkit-scrollbar-thumb { border-radius: 0; }</code> for square corners. Firefox ignores <code>::-webkit-scrollbar</code> rules. Add <code>!important</code> if a setting doesn\'t take. Saved in themes. Themes from someone else bring their CSS switched off, so you can check it before turning it on.</div>')}
            </div>
          </div>
          ${subHead('ov_cursor', 'Cursor')}
          <div class="cb_collapse_content">
            <div class="cb_hint">Your own pictures for the mouse cursor. Phones and tablets have no cursor.</div>
            ${row('ovCursorOn', 'Custom Cursor', cursorSlot('ovCursorImg', 'Normal', 'Everywhere else.', 'fa-arrow-pointer')
              + cursorSlot('ovCursorPtrImg', 'Pointer', 'Links and buttons. Empty keeps the system hand.', 'fa-hand-pointer')
              + cursorSlot('ovCursorTextImg', 'Text', 'Typing boxes. Empty keeps the system text cursor.', 'fa-i-cursor')
              + cursorSlot('ovCursorDownImg', 'Click', 'While the mouse button is held down. Empty keeps the cursor you had.', 'fa-computer-mouse')
              + '<div class="cb_hint">The top-left corner of each picture is the spot that clicks. For Text, it\'s the middle.</div>'
              + '<div class="cb_hint">Size</div>' + sl('ovCursorSize')
              + '<div class="cb_hint">Some browsers cut off cursors bigger than 32 px near the edge of the screen. Animated GIFs show only their first frame. Some sites don\'t allow their pictures to be resized: if Size does nothing for a link, upload the picture instead.</div>'
              + '<input type="file" id="m_cur_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>')}
          </div>
    `, { sw: ['m_ov_enable', s.ovEnabled] });
  }

  function bindDisplay(overlay, s) {
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
    const syncWhen = () => overlay.querySelectorAll('.m_o_when').forEach((el) => { el.style.display = s[el.dataset.when] === el.dataset.val ? '' : 'none'; });
    for (const k of Object.keys(PICK_KEYS)) {
      if (k.startsWith('ov') && k !== 'ovAvatar') onPills(overlay, 'o' + k.toLowerCase(), (v) => { s[k] = v; save(); updateAvatarStyle(); syncWhen(); });
    }
    syncWhen();
    bindCssBoxes(overlay, 'ov');

    const curFile = overlay.querySelector('#m_cur_file');
    let curPending = null;
    const renderCursor = () => {
      for (const k of ['ovCursorImg', 'ovCursorPtrImg', 'ovCursorTextImg', 'ovCursorDownImg']) {
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
    const images = cList(b.images, 200, (im) => ({ ...im, url: cUrl(im.url), pos: cardNum(im.pos, 'bannerPos', 45) })).filter((im) => im.url);
    return Object.assign(b, {
      images,
      idx: Math.round(cNum(b.idx, 0, 0, Math.max(0, images.length - 1))),
      youtubeUrl: cStr(b.youtubeUrl, 500),
      video: cUrl(b.video),
      videoPos: cardNum(b.videoPos, 'bannerVideoPos', 50),
    });
  }

  function cleanBanner(b) {
    cleanBannerSrc(b);
    Object.assign(b, {
      locked: cBool(b.locked, true),
      overlap: cBool(b.overlap, false),
      overlapOffset: cardNum(b.overlapOffset, 'bannerOffset', 0),
      scope: cPick(b.scope, ['global', 'char']),
      mode: cPick(b.mode, ['', 'image', 'youtube', 'video']),
      sharedChecked: cBool(b.sharedChecked, false),
      rotate: cBool(b.rotate, false),
      rotateSec: Math.round(cardNum(b.rotateSec, 'bannerRotateSec', DEFAULTS.bannerRotateSec)),
      rotateFx: cPick(b.rotateFx, ['fade', 'swap']),
      rotateOrder: cPick(b.rotateOrder, ['order', 'shuffle']),
      height: b.height == null ? null : Math.round(cardNum(b.height, 'bannerHeight', DEFAULTS.bannerHeight)),
      gap: b.gap == null ? null : Math.round(cardNum(b.gap, 'bannerGap', DEFAULTS.bannerGap)),
      backdrop: b.backdrop == null ? null : cPick(b.backdrop, ['wallpaper', 'panel']),
      videoSound: b.videoSound == null ? null : cBool(b.videoSound, false),
    });
  }

  function cleanFg(f) {
    for (const p of FG_POS) {
      f[p] = cUrl(f[p]);
      f[p + 'Scale'] = cardNum(f[p + 'Scale'], 'fgScale', 100);
      f[p + 'X'] = Math.round(cardNum(f[p + 'X'], 'fgX', 0));
      f[p + 'Y'] = Math.round(cardNum(f[p + 'Y'], 'fgY', 0));
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

  // Regex folders (regex.js): only names and the ids of the card's own regexes.
  function cleanRegex(r) {
    const ids = (a) => (Array.isArray(a) ? a : []).filter((x) => typeof x === 'string' && x && x.length <= 64).slice(0, 1000);
    r.folders = (Array.isArray(r.folders) ? r.folders : []).filter(isObj).slice(0, 100).map((f) => ({
      id: cStr(f.id, 40) || newId('rxf'), name: cStr(f.name, 60) || 'Folder', ids: ids(f.ids), was: Array.isArray(f.was) ? ids(f.was) : null,
    }));
    for (const k of Object.keys(r)) if (k !== 'folders') delete r[k];
  }

  function cleanStore(st) {
    if (!isObj(st) || cleaned.has(st)) return st;
    cleaned.add(st);
    for (const [k, fn] of [['banner', cleanBanner], ['fg', cleanFg], ['vn', cleanVn], ['regex', cleanRegex]]) {
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
      && !(vn.cgs || []).length && !(vn.maps || []).length && !(vn.opening && vn.opening.yt) && !(d.regex?.folders || []).length;
  }

  const FG_POS = ['Left', 'Center', 'Right'];
  const FG_DEF = () => ({ Left: '', Center: '', Right: '', LeftScale: 100, CenterScale: 100, RightScale: 100, LeftLayer: 'behind', CenterLayer: 'behind', RightLayer: 'behind',
    LeftX: 0, LeftY: 0, CenterX: 0, CenterY: 0, RightX: 0, RightY: 0 });

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
    if (PREVIEW) return;
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
      if (typeof c.writeExtensionFieldBulk === 'function' && unset) {
        // A failed save doesn't throw, it only leaves the card out of `updated`.
        const done = new Set((await c.writeExtensionFieldBulk(null, 'ntr', unset))?.updated || []);
        const missed = withData.filter((ch) => !done.has(ch.avatar)).length;
        if (missed) {
          wiping = false;
          throw new Error(`${missed} character card${missed === 1 ? '' : 's'} could not be saved, so nothing was removed. Check the SillyTavern console.`);
        }
      } else for (const ch of withData) await c.writeExtensionField(c.characters.indexOf(ch), 'ntr', unset ?? {});
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
    layout: { label: 'Layout (chat panel, menu bar, send bar)', keys: Object.keys(DEFAULTS).filter((k) => k.startsWith('lay')) },
    banner: { label: 'Banner look (height, gap, transparent areas, rotation)', keys: ['bannerHeight', 'bannerGap', 'bannerBackdrop', 'bannerRotate', 'bannerRotateSec', 'bannerRotateFx', 'bannerRotateOrder'] },
    bannerGlobal: { label: 'Global banner (images, YouTube link, video)', keys: ['bannerGlobal'] },
    pfp: { label: 'Avatar Management', keys: ['avatarEnabled', ...PFP_KEYS, ...AVATAR_SHAPE_KEYS] },
    reasoning: { label: 'Reasoning Block Design', keys: Object.keys(DEFAULTS).filter((k) => k.startsWith('rb')) },
    text: { label: 'Text Formatting', keys: [...Object.keys(DEFAULTS).filter((k) => k.startsWith('tf')), ...FONT_SCALE_KEYS] },
    display: { label: 'UI Display', keys: Object.keys(DEFAULTS).filter((k) => k.startsWith('ov') && !FONT_SCALE_KEYS.includes(k) && !AVATAR_SHAPE_KEYS.includes(k)) },
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
  const IMG_KEYS = new Set(['artBgImg', 'artSpriteImg', 'ovCursorImg', 'ovCursorPtrImg', 'ovCursorTextImg', 'ovCursorDownImg']);
  // Theme files come from other people, so each number is kept to the range of its slider in the menu (keep these in step
  // with the sliders). Pop-out and foreground offsets go wider because dragging the picture can take them past the slider.
  // Entries with a step and unit, [min, max, step, unit], are the only copy: their sliders and code read them from here.
  // A sixth and seventh number, [..., sliderMin, sliderMax], narrow the slider only (the pop-out and foreground offsets).
  const NUM_RANGE = {
    bannerHeight: [60, 350, 5, 'px'], bannerGap: [0, 40, 1, 'px'], bannerRotateSec: [3, 60, 1, 's'], fgOpacity: [0, 100, 1, '%'], placeGrid: [4, 100, 1, 'px'],
    rbSat: [0, 100, 1, '%'], rbBtnOpacity: [0, 100, 1, '%'], rbBoxOpacity: [0, 100, 1, '%'], rbPatThick: [1, 8, 1, 'px'], rbPatSize: [0.5, 3, 0.05, 'x'], rbEdgeFxSize: [2, 30, 1, 'px'], rbBtnFxSize: [2, 30, 1, 'px'], ovFont: [0.5, 2, 0.05, 'x'], tfNameSize: [0.5, 2, 0.05, 'x'], tfUserSize: [0.5, 2, 0.05, 'x'], tfAiSize: [0.5, 2, 0.05, 'x'],
    ovWidth: [25, 100, 1, 'vw'], ovBlur: [0, 30, 1, ''], ovShadow: [0, 5, 1, ''], ovCursorSize: [16, 128, 1, 'px'],
    ovRound: [1, 30, 1, 'px'], ovMesGap: [0, 40, 1, 'px'], ovSendGap: [0, 40, 1, 'px'],
    nodeSpeed: [5, 80], nodeAutoDelay: [500, 8000], nodeOpacity: [30, 100], nodePortrait: [60, 240], nodeBoxWidth: [40, 100],
    nodeBoxMinH: [40, 300], nodeBoxMaxH: [10, 70], nodeBoxLift: [0, 400], nodeTextScale: [70, 180], nodeSpriteScale: [30, 200],
    opLead: [0, 15], opFade: [100, 4000], opSize: [10, 100], opTransMs: [100, 10000],
    // Saved in card data (and the shared Global banner), not as settings keys (see cardNum).
    fgScale: [10, 300, 5, '%'], fgX: [-10000, 10000, 5, 'px', -1500, 1500], fgY: [-10000, 10000, 5, 'px', -1500, 1500], bannerPos: [0, 100, 1, '%'], bannerVideoPos: [0, 100, 1, '%'], bannerOffset: [0, 300, 5, 'px'],
  };
  for (const p of FX_PARTS) NUM_RANGE[p + 'FxStr'] = [1, 10, 1, ''];
  for (const phone of [false, true]) {
    const r = (name, min) => { NUM_RANGE[lk(phone, name)] = [min, 100, 0.01, '%']; };
    for (const name of ['BarPos', 'ChatX', 'ChatY', 'SendX', 'SendB']) r(name, 0);
    r('BarLen', 5);
    for (const name of ['ChatW', 'ChatH', 'SendW']) r(name, 10);
  }
  for (const p of ['Panel', ...OV_PARTS]) {
    Object.assign(NUM_RANGE, { [`ov${p}BgOpacity`]: [0, 100, 1, '%'], [`ov${p}BorderWidth`]: [1, 6, 1, 'px'], [`ov${p}BorderOpacity`]: [0, 100, 1, '%'] });
    if (p !== 'Panel') NUM_RANGE[`ov${p}Round`] = NUM_RANGE.ovRound;
  }
  for (const p of ['ai', 'us']) {
    Object.assign(NUM_RANGE, {
      [p + 'Scale']: [10, 300, 5, '%'], [p + 'Corner']: [0, 25, 1, '%'], [p + 'Focus']: [0, 100, 1, '%'], [p + 'Pad']: [0, 400, 5, 'px'], [p + 'TopFade']: [0, 400, 5, 'px'], [p + 'BotFade']: [0, 400, 5, 'px'],
      [p + 'LeftFadePx']: [0, 400, 5, 'px'], [p + 'RightFadePx']: [0, 400, 5, 'px'], [p + 'Blur']: [0, 20, 1, 'px'],
      [p + 'PopX']: [-10000, 10000, 5, 'px', -1500, 1500], [p + 'PopY']: [-10000, 10000, 5, 'px', -1500, 1500],
      [p + 'LeftFade']: [0, 100], [p + 'RightFade']: [0, 100], // the old side fades, a % of the image width (see pctFadeToPx)
      [p + 'FadeTop']: [0, 100, 1, '%'], [p + 'FadeBot']: [0, 100, 1, '%'], [p + 'FadeLeft']: [0, 100, 1, '%'], [p + 'FadeRight']: [0, 100, 1, '%'],
      [p + 'FadeTL']: [0, 100, 1, '%'], [p + 'FadeTR']: [0, 100, 1, '%'], [p + 'FadeBL']: [0, 100, 1, '%'], [p + 'FadeBR']: [0, 100, 1, '%'],
    });
  }
  // A number setting kept to its range, or its default if it isn't a number.
  const rangeNum = (s, k) => cNum(s[k], DEFAULTS[k], NUM_RANGE[k][0], NUM_RANGE[k][1]);
  // A slider whose range, step and unit come from NUM_RANGE.
  const rangeSlider = (s, k) => { const [min, max, step, unit, smin = min, smax = max] = NUM_RANGE[k]; return ovSlider(s, k, unit, smin, smax, step); };
  // The min, max and step of a slider written out by hand, from NUM_RANGE.
  const rangeAttrs = (k) => { const [min, max, step, , smin = min, smax = max] = NUM_RANGE[k]; return `min="${smin}" max="${smax}" step="${step}"`; };
  // A number from card data kept to its NUM_RANGE entry, or the fallback if it isn't a number.
  const cardNum = (v, k, d) => cNum(v, d, NUM_RANGE[k][0], NUM_RANGE[k][1]);
  // The longest text a theme may hold, the same as the menu's text boxes. Tag symbols and keywords allow 16.
  const STR_MAX = { rbThink: 100, rbDone: 100, rbSome: 100, rbCss: 2000, rbBtnCss: 2000, ovScrollCss: 2000, mapGoText: 200 };
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

  // Themes saved or exported before keep some keys in the part they used to belong to (Overall Font Scale in UI Display,
  // Avatar Shape in UI Display) and settings from before the UI Display and Reasoning Block Design redesigns. Each key
  // is moved to its part now, and the old settings are turned into the new ones.
  function upgradeTheme(data) {
    if (!data || typeof data !== 'object') return;
    const flat = {};
    for (const sec of Object.keys(data)) {
      const part = data[sec];
      if (!LOOK[sec] || !part || typeof part !== 'object') continue;
      // A key already in its own part wins over the same key left in an old part.
      for (const k of Object.keys(part)) if (!(k in flat) || LOOK[sec].keys.includes(k)) flat[k] = part[k];
    }
    upgradeLook(flat);
    for (const sec of Object.keys(LOOK)) {
      const part = {};
      for (const k of LOOK[sec].keys) if (k in flat) part[k] = flat[k];
      if (Object.keys(part).length || sec in data) data[sec] = part;
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
          <div class="cb_hint">A theme holds your look: Layout, banner height, gap and rotation, the Global banner, Avatar Management, Reasoning Block Design, Text Formatting, UI Display, foreground opacity, the Visual Novel box, tags and default art, and which regex folders are on. Character content, like a character's own banner, is never part of a theme. Pick a theme to apply it.</div>
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
    // Which regex folders are on (regex.js) is kept with a theme, outside its look settings, and never exported.
    const regexStates = async () => (await loadModule('regex'))?.states?.() || null;
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
      if (!t) { resetLook(); return; }
      s.themeActive = t.id;
      applyLook(t.data);
      openCombinedModal();
      if (t.regex) (await loadModule('regex'))?.applyStates?.(t.regex);
    };

    overlay.querySelector('#m_t_new').onclick = saveNew;

    // None can't be overwritten, so saving over it makes a new theme.
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
      upgradeTheme(j.sections);
      const secs = Object.keys(LOOK).filter((k) => Object.keys(cleanLookSection(k, j.sections[k])).length);
      // Tag symbols that are fine one by one but clash together get left out (see cleanLookSection); say so, so it's clear why yours stay.
      const vnIn = isObj(j.sections.vn) ? j.sections.vn : {};
      const tagsOut = TAG_KEYS.some((k) => k in vnIn && validLookValue(k, vnIn[k])) && !TAG_KEYS.some((k) => k in cleanLookSection('vn', vnIn));
      if (!secs.length) {
        toastr.error(`That theme file has nothing this version can use.${tagsOut ? ' Its tag symbols and keywords clash with yours, so they\'re left out.' : ''}`, 'Themes');
        return;
      }
      // Someone else's Custom CSS can restyle all of SillyTavern, so it's shown here and comes in switched off.
      const rbPart = secs.includes('reasoning') ? cleanLookSection('reasoning', j.sections.reasoning) : {};
      const css = rbCssText((k) => rbPart[k]);
      const ovPart = secs.includes('display') ? cleanLookSection('display', j.sections.display) : {};
      const scrollCss = String(ovPart.ovScrollCss || '').slice(0, 2000).trim();
      panel.innerHTML = `
        <div class="ntr_tpanel">
          <strong>Import theme</strong>
          <label>Name <input type="text" id="m_t_iname" class="text_pole" value="${escapeHTML(String(j.name || 'Imported theme'))}"></label>
          <div class="cb_hint">Sections in this file. Untick any you don't want.</div>
          ${secBoxes(secs)}
          ${css ? `<div class="cb_hint">This theme includes Custom CSS for the reasoning block. It's added switched off: after applying the theme, check it under Reasoning Block Design, Advanced: Custom CSS, and tick it to use it.</div>
          <pre class="cb_code" style="max-height: 140px; overflow: auto; margin: 0;">${escapeHTML(css)}</pre>` : ''}
          ${scrollCss ? `<div class="cb_hint">This theme includes Custom CSS for the scrollbar. It's added switched off: after applying the theme, check it under UI Display, Scrollbar, Advanced: Custom CSS, and tick it to use it.</div>
          <pre class="cb_code" style="max-height: 140px; overflow: auto; margin: 0;">${escapeHTML(scrollCss)}</pre>` : ''}
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
        for (const [k] of RB_CSS) if (data.reasoning && String(data.reasoning[k] || '').trim()) data.reasoning[k + 'On'] = false;
        if (data.display && String(data.display.ovScrollCss || '').trim()) data.display.ovScrollCssOn = false;
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
          toastr.error(e.message || 'Removing failed.', 'Remove NTR data');
          go.disabled = false;
          go.innerHTML = '<i class="fa-solid fa-trash"></i> Remove';
          return;
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
  const MOD_LABEL = { vn: 'Visual Novel Mode', map: 'Maps', opening: 'Opening video', preview: 'Phone Preview', regex: 'Regexes' };
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

  // The Regexes page comes from regex.js, loaded the first time the menu opens.
  let regexWaiting = false;
  function regexSectionHtml(s) {
    const rx = window.NTR.regex;
    if (rx) return rx.sectionHtml(s);
    if (!modError.regex && !regexWaiting) {
      regexWaiting = true;
      loadModule('regex').then(() => {
        regexWaiting = false;
        if (document.getElementById('cb_modal_overlay')) openCombinedModal();
      });
    }
    const msg = modError.regex ? 'Regexes failed to load: ' + escapeHTML(modError.regex) : 'Loading your regexes.';
    return pageHtml('regex', '', { note: `<div class="cb_hint ntr_pnote">${msg}</div>` });
  }

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
    if (!on) endPlacement();
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
    pills, posGrid, onPills, pageHtml, subHead, deleteFileIfUnused, syncVNToggle, TAG, store, uploadHere, refreshFg: () => ensureFgLayer(),
    openMenu: () => openCombinedModal(),
    closeMenu: () => { const ov = document.getElementById('cb_modal_overlay'); if (!ov) return false; ov.querySelector('.cb_close_btn')?.click(); return true; },
    sendFree: () => sendFree(),
    // For preview.js
    PREVIEW, blockSaves, applyLayout: () => applyLayout(), refreshVisuals: () => refreshVisuals(),
    startPlacement: (first, scr) => startPlacement(first, scr), placing: () => place.on, redrawPlacement: () => drawPlace(),
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
    document.addEventListener('pointerdown', onCursorDown, true);
    document.addEventListener('load', (e) => {
      if (!(e.target instanceof HTMLImageElement) || !e.target.matches('#chat .mes .avatar img')) return;
      setAvatarRatio(e.target);
      fullAvatar(e.target);
    }, true);
    for (const ev of ['pointerup', 'pointercancel']) document.addEventListener(ev, onCursorUp, true);
    window.addEventListener('blur', onCursorUp);
    window.addEventListener('resize', () => {
      syncWallpaper();
      layoutFg();
      layoutPop();
      syncSendRoom();
      const ov = document.getElementById('cb_modal_overlay');
      if (!ov) return;
      panelLayout(ov);
      const g = ov.querySelector('#m_b_guide');
      if (g) g.textContent = bannerGuideText();
    });
    eventSource.on(event_types.CHAT_CHANGED, () => {
      endPlacement();
      renderAll();
      window.NTR.vn?.queue(false);
      if (document.getElementById('cb_modal_overlay')) openCombinedModal();
    });

    for (const [name, anim] of [['USER_MESSAGE_RENDERED', true], ['MESSAGE_EDITED', false], ['MESSAGE_UPDATED', false], ['MESSAGE_DELETED', false]]) {
      if (event_types[name]) eventSource.on(event_types[name], () => window.NTR.vn?.queue(anim));
    }
    // A swipe to a new reply shows "..." until the reply arrives (see nodeSwiped in vn.js).
    if (event_types.MESSAGE_SWIPED) eventSource.on(event_types.MESSAGE_SWIPED, (id) => (window.NTR.vn?.swiped ? window.NTR.vn.swiped(Number(id)) : window.NTR.vn?.queue(true)));
    if (event_types.CHARACTER_MESSAGE_RENDERED) {
      eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, (id, type) => {
        const vn = window.NTR.vn;
        vn?.endWait?.();
        // A Continue picks up where the old text ended instead of typing the whole message again.
        // Without streaming, SillyTavern marks a finished Continue as 'appendFinal'.
        if ((type === 'continue' || type === 'appendFinal') && vn?.continued) vn.continued(Number(id));
        else vn?.queue(true);
      });
    }
    if (event_types.GENERATION_STARTED) eventSource.on(event_types.GENERATION_STARTED, (type, _opts, dryRun) => window.NTR.vn?.genStarted?.(type, dryRun));
    // Stopped or failed before a reply arrived: SillyTavern puts the old reply back, shown without typing it again.
    // The short delay lets a reply that did arrive go first, so it still gets typed.
    if (event_types.GENERATION_ENDED) {
      eventSource.on(event_types.GENERATION_ENDED, () => {
        window.NTR.vn?.genEnded?.();
        setTimeout(() => { if (window.NTR.vn?.endWait?.()) window.NTR.vn.queue(false); }, 300);
      });
    }
    if (event_types.APP_READY) eventSource.on(event_types.APP_READY, () => { renderAll(); window.NTR.vn?.queue(false); });
    // A renamed preset keeps its regex folders (Regexes page, regex.js), which are saved by preset name.
    if (event_types.PRESET_RENAMED) {
      eventSource.on(event_types.PRESET_RENAMED, ({ apiId, oldName, newName } = {}) => {
        const all = settings().regexPresetFolders;
        const from = `${apiId}|${oldName}`, to = `${apiId}|${newName}`;
        if (from === to || !Array.isArray(all[from])) return;
        all[to] = [...(Array.isArray(all[to]) ? all[to] : []), ...all[from]];
        delete all[from];
        save();
      });
    }

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
