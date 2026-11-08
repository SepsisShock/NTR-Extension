await (async () => {
  const MODULE = 'chatvisuals';
  const VERSION = '2.86.74';
  const NTR_BASE = new URL('.', import.meta.url).href;
  const TAG = '<i class="fa-solid fa-tag ntr_tag" title="Saved per character" role="img" aria-label="Saved per character"></i>';
  // The key to TAG, at the top of a page or part. Its icon is hidden from screen readers, which read the sentence.
  const TAG_KEY = '<i class="fa-solid fa-tag ntr_tag" aria-hidden="true"></i> Marks settings saved per character.';

  // Reader Mode's built-in books: the same photo in each cover color, in assets/books. The color is the menu's swatch.
  const BOOKS = [['brown', 'Brown', '#50301c'], ['oxblood', 'Oxblood', '#4a1b1a'], ['forest', 'Forest Green', '#1d3326'], ['navy', 'Navy', '#1c2740'],
    ['black', 'Black', '#1e1b19'], ['plum', 'Plum', '#3c2240'], ['sakura', 'Sakura', '#e39ab9']];
  const bookUrl = (k) => `${NTR_BASE}assets/books/${k}.webp`;
  const bookSrc = (s) => s.rdBookImg || bookUrl(s.rdBook);
  // Avatar Management's built-in frames, in assets/frames/<folder>. Each is [file name, name]; a side saves 'folder/file'.
  const FRAME_SERIES = [
    { id: 'nouveau', name: 'Art Nouveau', frames: [['lily', 'Lily'], ['iris', 'Iris'], ['sakura', 'Sakura'], ['poppy', 'Poppy'], ['moon', 'Moon'], ['ginkgo', 'Ginkgo']] },
    { id: 'roses', name: 'Rose Mirrors', frames: [['blush', 'Blush'], ['midnight', 'Midnight']] },
  ];
  const FRAME_IDS = FRAME_SERIES.flatMap((f) => f.frames.map(([v]) => `${f.id}/${v}`));
  const frameUrl = (id) => (FRAME_IDS.includes(id) ? `${NTR_BASE}assets/frames/${id}.webp` : '');

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
    chars: {}, charData: {}, groupData: {},
    avatarEnabled: true,
    // The Frame library: the user's own folders of uploaded frames, the hidden built-in folders, and each side's fit
    // (Frame Size, Left/Right, Up/Down) for each frame it has used.
    frameLib: { folders: [{ id: 'frf_mine', name: 'My Frames', frames: [] }] }, frameHidden: [], frameFits: { ai: {}, us: {} },

    // AI Settings
    aiStyle: 'inline', aiPopX: 0, aiPopY: 0,
    aiSide: 'tl', aiFit: 'contain', aiShape: 'none', aiCorner: 10, aiFocus: 0, aiScale: 100, aiPad: 140,
    aiEnabled: true,
    aiFadeTop: 0, aiFadeBot: 0, aiFadeLeft: 0, aiFadeRight: 0, aiFadeTL: 0, aiFadeTR: 0, aiFadeBL: 0, aiFadeBR: 0, aiFadeStr: 50,
    aiShiftX: 50, aiZoom: 100, aiRotate: 0, aiRotateMode: 'shape', aiFilter: 'none', aiFilterStr: 100, aiTexture: 'none', aiTextureStr: 100, aiCssOn: false, aiCss: '',
    aiFrame: '', aiFrameImg: '', aiFrameSize: 140, aiFrameX: 0, aiFrameY: 0,

    // User Settings
    usStyle: 'inline', usPopX: 0, usPopY: 0,
    usSide: 'tl', usFit: 'contain', usShape: 'none', usCorner: 10, usFocus: 0, usScale: 100, usPad: 140,
    usEnabled: true,
    usFadeTop: 0, usFadeBot: 0, usFadeLeft: 0, usFadeRight: 0, usFadeTL: 0, usFadeTR: 0, usFadeBL: 0, usFadeBR: 0, usFadeStr: 50,
    usShiftX: 50, usZoom: 100, usRotate: 0, usRotateMode: 'shape', usFilter: 'none', usFilterStr: 100, usTexture: 'none', usTextureStr: 100, usCssOn: false, usCss: '',
    usFrame: '', usFrameImg: '', usFrameSize: 140, usFrameX: 0, usFrameY: 0,

    // Foreground Settings
    fgEnabled: false,
    fgOpacity: 100,
    fgHideVN: false,

    // Edit Layout's Snap to Grid and grid size: editor choices, not part of themes
    placeSnap: false, placeGrid: 20,

    // Layout: the chat panel, menu bar, send bar, Reader Mode's page bar and the header banner. Desktop for screens wider than 1000px, Phone (layPh) for 1000px or
    // less. Places and sizes are a % of the screen. A part that hasn't been moved stays where SillyTavern puts it.
    layEnabled: false,
    // Pinned Blocks (see cleanPins). Their name starts with lay so themes keep them with Layout.
    layPins: [],
    layBarEdge: 'top', layBarMoved: false, layBarPos: 25, layBarLen: 50,
    layChatMoved: false, layChatX: 25, layChatY: 4, layChatW: 50, layChatH: 92,
    laySend: 'attached', laySendX: 25, laySendB: 0, laySendW: 50,
    layPage: 'attached', layPageX: 25, layPageB: 12, layPageW: 50,
    layBan: 'attached', layBanX: 25, layBanY: 6, layBanW: 50, layBanH: 15,
    layPhBarEdge: 'top', layPhBarMoved: false, layPhBarPos: 0, layPhBarLen: 100,
    layPhChatMoved: false, layPhChatX: 0, layPhChatY: 5, layPhChatW: 100, layPhChatH: 90,
    layPhSend: 'attached', layPhSendX: 0, layPhSendB: 0, layPhSendW: 100,
    layPhPage: 'attached', layPhPageX: 0, layPhPageB: 12, layPhPageW: 100,
    layPhBan: 'attached', layPhBanX: 0, layPhBanY: 6, layPhBanW: 100, layPhBanH: 15,

    // Reader Mode (reader.js): the chat a page at a time. Per Page is 'pair' (a user message and the replies after it) or 'one'.
    rdEnabled: false, rdPer: 'pair',
    // Its look, in themes: Standard or Book. An empty picture is the built-in book, and the page areas start as its own:
    // where the text sits on the picture, as a % of its height (Top, Bottom) or width (Outer edge, Spine gap).
    rdStyle: 'plain', rdBook: 'brown', rdBookImg: '', rdBookW: 90, rdBookTop: 13, rdBookBottom: 15, rdBookOuter: 11, rdBookSpine: 11,
    rdInk: '#2b2118', rdInkEm: '#6b4f2a', rdInkQuote: '#7a2e1e', rdBookFontOn: false, rdBookFont: '', rdFlip: true,

    // Agents page (agents.js): the user's agents (each with its own job, connection, samplers and limits; see clean in agents.js),
    // the one picked in the menu, and the departments grouping them (see depts in agents.js). Not in themes.
    agEnabled: false, agents: [], agPick: '', agDepts: [],

    // Visual Novel Mode
    nodeEnabled: false, nodeTypewriter: true, nodeSpeed: 20,
    nodeAuto: false, nodeAutoDelay: 2500, nodeOpacity: 88, nodePortrait: 120,
    nodeUserMsgs: true, nodeHideEmo: true, nodeShape: 'rounded',
    nodeBoxWidth: 100, nodeBoxMinH: 96, nodeBoxMaxH: 28, nodeBoxLift: 8, nodeTextScale: 100,
    nodeSprites: true, nodePortraitBox: true, nodeSpriteScale: 100, nodeSpriteBase: false, nodeInject: true,
    locWord: 'Location',
    emotions: [
      { id: 'emo_neutral', name: 'Neutral' }, { id: 'emo_happy', name: 'Happy' },
      { id: 'emo_sad', name: 'Sad' }, { id: 'emo_angry', name: 'Angry' },
      { id: 'emo_surprised', name: 'Surprised' }, { id: 'emo_dead', name: 'Dead' }
    ],
    emoDefault: 'emo_neutral',
    delimSpkOpen: '((', delimSpkClose: '))', delimNarOpen: '[[', delimNarClose: ']]',
    delimEmo: '%%', narratorWord: 'Narrator',
    // Emotions outside Visual Novel Mode (cast.js): faces on chat avatars, the stage behind the chat, the [[Emotion:X]] tag
    emoWord: 'Emotion', emoFaces: false, emoStage: false, emoStageScale: 100, emoStageOpacity: 100, emoInject: true,

    // Reasoning Block (colors start empty and are filled from SillyTavern's own when the menu opens; empty status text means ST's own)
    rbEnabled: true, rbThink: '', rbDone: '', rbSome: '', rbTyping: 'off',
    rbBtnColorOn: false, rbBtnColor: '', rbBtnAlphaOn: false, rbBtnOpacity: 100, rbBtnTextOn: false, rbBtnText: '',
    rbBtnShape: 'rounded', rbBtnBorderOn: false, rbBtnBorder: 'solid', rbBtnBorderColorOn: false, rbBtnBorderColor: '', rbBtnFx: 'none', rbBtnFxSize: 8,
    rbFontOn: false, rbFont: '', rbSatOn: false, rbSat: 50, rbBoxShapeOn: false, rbBoxShape: 'rounded', rbBorderStyleOn: false, rbBorderStyle: 'none', rbBorderOn: false, rbBorder: '', rbEdgeFx: 'none', rbEdgeFxSize: 8,
    rbBoxColorOn: false, rbBoxColor: '', rbBoxAlphaOn: false, rbBoxOpacity: 100,
    rbPat: 'none', rbPatH: true, rbPatV: false, rbPatR: false, rbPatL: false, rbPatFade: 'tc', rbPatShade: 'light',
    rbPatFadeOn: false, rbPatFadeReach: 4, rbPatFadeSoft: 100,
    rbPatColorOn: false, rbPatColor: '', rbPatThick: 1, rbPatSize: 1,
    rbCssOn: false, rbCss: '', rbBtnCssOn: false, rbBtnCss: '',
    // Reasoning Arrow on the reasoning button. Default is ST's chevron; Flip is ST's turn when the block closes.
    rbArrow: 'default', rbArrowSym: '', rbArrowImg: '', rbArrowColorOn: false, rbArrowColor: '', rbArrowSizeOn: false, rbArrowSize: 1,
    rbArrowTurn: 'flip', rbArrowAnim: 'off', rbArrowCssOn: false, rbArrowCss: '',
    // Background Image in the reasoning box. Without a picture the box is left as it is.
    rbBgImg: '', rbBgFit: 'cover', rbBgPos: 'cc', rbBgTile: 128, rbBgOpacity: 100, rbBgTintOn: true, rbBgTint: 40,

    // Text Formatting
    tfEnabled: true, tfNameColorOn: false, tfNameColor: '', tfNameFontOn: false, tfNameFont: '', tfNameSizeOn: false, tfNameSize: 1, tfNameWeightOn: false, tfNameWeight: 'bold',
    tfUserFontOn: false, tfUserFont: '', tfUserSizeOn: false, tfUserSize: 1, tfUserAlignOn: false, tfUserAlign: 'left', tfUserMainOn: false, tfUserMain: '',
    tfUserEmOn: false, tfUserEm: '', tfUserUnderOn: false, tfUserUnder: '', tfUserQuoteOn: false, tfUserQuote: '',
    tfAiFontOn: false, tfAiFont: '', tfAiSizeOn: false, tfAiSize: 1, tfAiAlignOn: false, tfAiAlign: 'left', tfAiMainOn: false, tfAiMain: '',
    tfAiEmOn: false, tfAiEm: '', tfAiUnderOn: false, tfAiUnder: '', tfAiQuoteOn: false, tfAiQuote: '',
    tfNameFxOn: false, tfNameFx: 'glow', tfNameFxStr: 3, tfNameFxColorOn: false, tfNameFxColor: '',
    // Nameplate: the box behind the names on chat messages and the Visual Novel name tag (see textFormatCss in text.js).
    tfPlateBgOn: false, tfPlateBg: '', tfPlateImg: '', tfPlateBorderOn: false, tfPlateBorder: '', tfPlateBorderWidth: 1,
    tfPlateRoundOn: false, tfPlateRound: 8, tfPlatePosOn: false, tfPlatePos: 'edge',
    tfUserFxOn: false, tfUserFx: 'glow', tfUserFxStr: 3, tfUserFxColorOn: false, tfUserFxColor: '',
    tfAiFxOn: false, tfAiFx: 'glow', tfAiFxStr: 3, tfAiFxColorOn: false, tfAiFxColor: '',

    // UI Decor's ov keys; some belong to other pages (MOVED_OV_KEYS).
    ovEnabled: true,
    ovWidthOn: false, ovWidth: 50, ovFontOn: false, ovFont: 1,
    ovBlurOn: false, ovBlur: 10, ovShadowOn: false, ovShadow: 2,
    // Interface Shape shapes the chat panel and the rest of the interface (see uiShapeCss in decor.js). Empty colors mean SillyTavern's own (see COLOR_FROM).
    ovShapeOn: false, ovShape: 'rounded', ovRound: 10,
    ovPanelBgOn: true, ovPanelBg: 'clear', ovPanelBgColor: '', ovPanelBgOpacity: 100,
    ovPanelBorderOn: false, ovPanelBorder: 'line', ovPanelBorderColor: '', ovPanelBorderWidth: 1, ovPanelBorderOpacity: 100,
    ovMesGapOn: false, ovMesGap: 5, ovNamesOn: false,
    ovSendPosOn: false, ovSendPos: 'separate', ovSendGap: 8,
    // Speech Bubbles: AI and User messages as chat bubbles around the message text (see bubbleCss in decor.js). Their color, roundness
    // and border come from AI Message and User Message.
    ovBubOn: false, ovBubTail: 'pointed', ovBubTailPos: 'top', ovBubAlign: 'sides', ovBubWidth: 85, ovBubFit: 'shrink', ovBubGroup: 'group', ovBubInk: 'auto',
    ovScrollOn: true, ovScrollColorOn: false, ovScrollColor: '', ovScrollTrackOn: false, ovScrollTrack: 'rgba(0, 0, 0, 0)',
    ovScrollCssOn: false, ovScrollCss: '',
    ovCursorOn: false, ovCursorImg: '', ovCursorPtrImg: '', ovCursorDownImg: '', ovCursorTextImg: '', ovCursorSize: 32,
    ovCursorCssOn: false, ovCursorCss: '',
    // Menu Bar Icons (Elements): custom pictures for the icons on SillyTavern's menu bar, keyed by the id of each icon's
    // drawer (see menuBarIconCss in elements.js). Each is { img, mode: 'tint' or 'full', name }.
    mbOn: false, mbIcons: {},
    // Message Details (Elements): which details show in each spot, and their look (see messageDetailsCss in elements.js).
    // The spots start where SillyTavern puts them.
    mdOn: false, mdAv: ['num', 'gen', 'tok'], mdRow: ['date', 'time'], mdCorner: [], mdBelow: [], mdDate: 'long', mdSep: 'dot',
    mdSizeOn: false, mdSize: 1, mdColorOn: false, mdColor: '', mdOpacityOn: false, mdOpacity: 70, mdPillOn: false, mdPill: '',
    // Quick Replies restyle SillyTavern's Quick Reply bar. Shape, Background and Border come from BOX_PARTS. ST's hover
    // color is a plain gray, not one of its theme colors, so it starts filled in like the scrollbar's Track Color.
    ovQrOn: false, ovQrTextOn: false, ovQrText: '', ovQrHoverOn: false, ovQrHover: 'rgba(77, 77, 77, 1)', ovQrSizeOn: false, ovQrSize: 1,
    ovQrWrapOn: false, ovQrWrap: 'scroll', ovQrGapOn: false, ovQrGap: 5, ovQrAlignOn: false, ovQrAlign: 'center', ovQrOpacityOn: false, ovQrOpacity: 70,
    ovQrCssOn: false, ovQrCss: '',

    // Menu state
    uiOpen: {},
    uiPage: 'fg',
    uiPanel: { dock: 'right', w: 440, fw: 560, fh: 0, x: null, y: null },
    wandEntry: false,
    // Regexes page (regex.js): Global folders, and Preset folders by preset. Character folders live in the card.
    // Switched off, NTR leaves SillyTavern's regexes alone: they still run, but the page and themes don't show, sort or
    // switch them.
    rxEnabled: true,
    regexFolders: [],
    regexPresetFolders: {},

    // Master switch + themes
    masterEnabled: true,
    themes: [],
    themeActive: null,

    // Visual Novel scene tags, art kit, opening video, maps
    nodeSplitUntagged: true,
    nodeChoices: true, choiceSend: false, choiceWord: 'Choice', choiceSep: '|',
    nodeEffects: true, effectWord: 'Effect', fxShake: 'Shake', fxFlash: 'Flash', fxFade: 'Fade',
    weatherWord: 'Weather', wxRain: 'Rain', wxSnow: 'Snow', wxClear: 'Clear',
    nodeCG: true, cgWord: 'CG', nodeAutoSpk: true,
    enterWord: 'Enter', exitWord: 'Exit',
    artBg: 'dusk', artBgImg: '', artSprite: 'builtin', artSpriteImg: '',
    opLead: 3, opFade: 1000, opSize: 50, opPos: 'center', opExit: 'stay', opTrans: 'color', opTransColor: '#000000', opTransMs: 400, opEarly: false, opMute: false, opSeen: {},
    nodeMaps: true, mapGoText: '*heads to the {place}*'
  };
  // AI Message, User Message and Send Box each have their own Shape, Background and Border.
  const OV_PARTS = ['Ai', 'Us', 'Send'];
  // Quick Reply buttons (Elements) have the same three.
  const BOX_PARTS = [...OV_PARTS, 'Qr'];
  for (const p of BOX_PARTS) {
    Object.assign(DEFAULTS, {
      [`ov${p}ShapeOn`]: false, [`ov${p}Shape`]: 'rounded', [`ov${p}Round`]: 10,
      [`ov${p}BgOn`]: false, [`ov${p}Bg`]: 'color', [`ov${p}BgColor`]: '', [`ov${p}BgOpacity`]: 100,
      [`ov${p}BorderOn`]: false, [`ov${p}Border`]: 'line', [`ov${p}BorderColor`]: '', [`ov${p}BorderWidth`]: 1, [`ov${p}BorderOpacity`]: 100,
    });
  }
  // Overall Font Scale sits in Text Formatting but keeps UI Decor's ov key names.
  const FONT_SCALE_KEYS = ['ovFontOn', 'ovFont'];

  const ctx = () => SillyTavern.getContext();
  // Sets an NTR prompt SillyTavern adds to each request; empty text clears it.
  const setInjection = (key, text) => ctx().setExtensionPrompt(key, text, 1, 1, false, 0);
  const save = () => {
    ctx().saveSettingsDebounced();
    const k = currentKey();
    if (k) scheduleCardFlush(k);
  };
  const isOn = () => settings().masterEnabled !== false;
  // ST's own Reduced Motion (User Settings) or the device's setting.
  const reducedMotion = () => !!ctx().powerUserSettings.reduced_motion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const HTML_ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' };
  const escapeHTML = (str) => String(str).replace(/[&<>'"]/g, (m) => HTML_ESC[m]);
  // Names compared the way tags are matched: trimmed, any case. reEsc makes text safe to put in a regex.
  const lc = (x) => String(x || '').trim().toLowerCase();
  const reEsc = (x) => String(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Avatar Management's Shape choices (see avatars.js). A saved Shape is checked against them (PICK_KEYS).
  const SHAPE_OPTS = [['none', 'None'], ['round', 'Circle'], ['oval', 'Oval'], ['rectangle', 'Rectangle'], ['square', 'Square'], ['heart', 'Heart'], ['star', 'Star']];
  // Avatar Management's Filter choices (see avatars.js). A saved Filter is checked against them (PICK_KEYS).
  const FILTER_OPTS = [['none', 'None'], ['piss', 'Piss'], ['bw', 'Black and White'], ['noir', 'Noir'], ['faded', 'Faded'], ['dreamy', 'Dreamy']];
  // Its Texture choices, layers over the picture (see avatars.js).
  const TEXTURE_OPTS = [['none', 'None'], ['scanlines', 'Scanlines'], ['vhs', 'VHS'], ['grainy', 'Grainy'], ['pixel', 'Pixel']];
  // An SVG path as a mask, drawn in a 100 x 100 box stretched over its frame. Avatar Management's Heart and Star
  // (avatars.js) and the Speech Bubble tails cut with it.
  const svgMask = (d) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${d}"/></svg>`)}")`;

  // While NTR data is being removed, nothing may write the settings back: until the page reloads, code that
  // still runs gets a throwaway copy of the defaults.
  let wiping = false;
  let wipeStub = null;
  // SillyTavern keeps one extension settings object for the whole page, so it's looked up once: getContext() builds a
  // new object on every call, and settings() runs many times in every restyle.
  let extSettings = null;
  // The settings object already brought up to date (see loadSettings). Each one is, once, the first time it's asked for.
  let loaded = null;
  function settings() {
    const all = (extSettings ??= ctx().extensionSettings);
    const s = all[MODULE];
    if (s && s === loaded) return s;
    if (wiping && !s) return (wipeStub ??= structuredClone(DEFAULTS));
    if (!s) all[MODULE] = {};
    loadSettings(all[MODULE]);
    loaded = all[MODULE];
    return loaded;
  }

  // Saved settings brought up to date: missing ones filled in from DEFAULTS, and lists checked. Also run after a theme
  // is applied, since a theme's Default Emotion can name an emotion it doesn't have.
  function loadSettings(s) {
    for (const k of Object.keys(DEFAULTS)) {
      if (s[k] === undefined) s[k] = structuredClone(DEFAULTS[k]);
    }
    for (const k of Object.keys(DEFAULTS.uiPanel)) if (s.uiPanel[k] === undefined) s.uiPanel[k] = DEFAULTS.uiPanel[k];
    if (!cleaned.has(s.bannerGlobal)) s.bannerGlobal = cleanGlobalBanner(s.bannerGlobal);
    if (!cleaned.has(s.mbIcons)) s.mbIcons = cleanMbIcons(s.mbIcons);
    // The template is copied into cards, which check a list like a theme's, so it keeps to the same limits.
    if (!validEmotions(s.emotions)) s.emotions = fixEmotions(s.emotions);
    if (!s.emotions.some((e) => e.id === s.emoDefault)) s.emoDefault = s.emotions[0].id;
    if (!cleaned.has(s.frameLib)) s.frameLib = cleanFrameLib(s.frameLib);
    s.frameHidden = Array.isArray(s.frameHidden) ? FRAME_SERIES.map((f) => f.id).filter((id) => s.frameHidden.includes(id)) : [];
    if (!cleaned.has(s.frameFits)) s.frameFits = cleanFrameFits(s.frameFits);
    if (!cleaned.has(s.layPins)) s.layPins = cleanPins(s.layPins);
  }

  // ===== Foreground image placement and full-size avatars =====
  // Foreground images keep their side; Move Horizontal and Vertical (or dragging them) shift them from there.
  function fgTransform(el, pos, F) {
    const sc = cardNum(F[pos + 'Scale'], 'fgScale', 100) / 100;
    el.style.transformOrigin = pos === 'Left' ? 'left bottom' : pos === 'Right' ? 'right bottom' : 'center bottom';
    el.style.transform = `translate(${cardNum(F[pos + 'X'], 'fgX', 0)}px, ${cardNum(F[pos + 'Y'], 'fgY', 0)}px) scale(${sc})`;
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

  // ===== Layout, Pinned Blocks and Edit Layout (layout.js) =====
  // Their settings stay here, with what they're checked against while settings and themes load, before layout.js is
  // there: the menu bar's edges (PICK_KEYS), each layout's setting names (NUM_RANGE) and the saved blocks (cleanPins).
  const LAY_EDGES = ['top', 'bottom', 'left', 'right'];
  // A layout setting's name: lk(false, 'ChatX') is layChatX, lk(true, 'ChatX') is layPhChatX.
  const lk = (phone, name) => (phone ? 'layPh' : 'lay') + name;
  // Layout's switch, with layout.js loaded. Without layout.js, the parts of Layout the core builds stay SillyTavern's own
  // too, whatever is saved: Chat Width, Space Between Messages and Attached Style.
  const layoutOn = (s) => s.layEnabled && !!window.NTR.layout;

  // Pinned Blocks' places, as a % of the screen for Desktop and for Phone. A block is remembered by the tag and classes
  // of what was picked in the chat, never as typed-in CSS, so a theme from someone else can't slip CSS in through it.
  const PIN_START = { desk: { x: 72, y: 12, w: 24, h: 40 }, phone: { x: 5, y: 12, w: 90, h: 35 } };
  const PIN_TAG = /^[a-z][a-z0-9-]{0,30}$/;
  const PIN_CLASS = /^[A-Za-z_-][\w-]{0,63}$/;
  const PIN_MAX = 20;
  // The longest name, and the most agents and classes, a block keeps. The Pinned Blocks menu keeps to them too.
  const PIN_LIMITS = { name: 60, agents: 10, classes: 5 };
  const pinRect = (r, d) => ({ x: cardNum(r?.x, 'pinX', d.x), y: cardNum(r?.y, 'pinY', d.y), w: cardNum(r?.w, 'pinW', d.w), h: cardNum(r?.h, 'pinH', d.h), moved: cBool(r?.moved, true) });
  // Saved blocks, and blocks from theme files, made safe to use.
  function cleanPins(v) {
    const ids = new Set();
    const out = cList(v, PIN_MAX, (p) => {
      let id = cRef(p.id);
      if (!id || ids.has(id)) id = newId('pin');
      ids.add(id);
      return {
        id,
        name: cStr(p.name, PIN_LIMITS.name).trim() || 'Pinned Block',
        from: cPick(p.from, ['chat', 'agents']),
        agents: [...new Set((Array.isArray(p.agents) ? p.agents : []).map(cRef).filter(Boolean))].slice(0, PIN_LIMITS.agents),
        tag: typeof p.tag === 'string' && PIN_TAG.test(p.tag) ? p.tag : '',
        classes: (Array.isArray(p.classes) ? p.classes : []).filter((c) => typeof c === 'string' && PIN_CLASS.test(c)).slice(0, PIN_LIMITS.classes),
        place: cPick(p.place, ['float', 'left', 'right']),
        show: cPick(p.show, ['always', 'newest', 'reading']),
        height: cPick(p.height, ['fixed', 'fit']),
        view: cPick(p.view, ['stacked', 'tabs']),
        frame: cPick(p.frame, ['none', 'panel']),
        hide: cBool(p.hide, true),
        vn: cPick(p.vn, ['show', 'hide']),
        desk: pinRect(p.desk, PIN_START.desk),
        phone: pinRect(p.phone, PIN_START.phone),
      };
    });
    cleaned.add(out);
    return out;
  }

  // ===== NTR's main stylesheet (aw_dynamic_style) =====
  function updateAvatarStyle() {
    let styleEl = document.getElementById('aw_dynamic_style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'aw_dynamic_style';
      document.head.appendChild(styleEl);
    }

    const s = settings();

    let cssString = '';
    // Asked even while NTR is off, so Elements can let go of its custom cursor.
    const elCss = callModule('elements', 'css', s) || '';
    if (isOn()) {
      const chatCss = layoutChatCss(s) + namesCss(s) + (callModule('decor', 'css', s) || '');
      // The chat gets its own layer. A see-through chat has none on most screens, so every key, streamed word and scroll
      // would repaint all of it, avatar fades included.
      cssString += overrideCss(s) + elCss + (callModule('text', 'css', s) || '') + (chatCss ? chatCss + '\n' : '') + '\n      #chat { will-change: transform; }\n';
    }

    cssString += callModule('avatars', 'css', s) || '';

    // Rewriting the same text still makes the browser redo the page's styles (like cssTag), and nothing may have changed:
    // a chat switch, or a setting saved without a new look.
    if (styleEl.textContent !== cssString) styleEl.textContent = cssString;
    callModule('layout', 'apply');
    callModule('avatars', 'sync');
    syncGoogleFonts();
    callModule('elements', 'sync');
    callModule('avatars', 'syncPopouts');
    callModule('layout', 'syncPins');
    callModule('decor', 'sync');
    window.NTR.reader?.relayout();
  }

  // ===== The open character and its banner data =====
  function currentKey() {
    const c = ctx();
    if (c.groupId) return null;
    return c.characters[c.characterId]?.avatar || null;
  }

  const peek = (key) => {
    const d = cardData(key);
    if (d) return d.banner ||= defaultBanner();
    const r = settings().chars[key] ||= defaultBanner();
    if (!cleaned.has(r)) cleanBanner(r);
    return r;
  };

  // Images, YouTube link and video: Char uses the character's own, Global the shared banner in the settings.
  const bannerSrc = (r) => (r && r.scope === 'char' ? r : settings().bannerGlobal);
  function getYouTubeId(url) {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    return match ? match[1] : null;
  }

  // ===== Drawing everything =====
  // The header banner and foreground images live in overlays.js, loaded once either is on (or the menu opens).
  function renderOverlays() {
    const m = window.NTR.overlays;
    if (m) m.render();
    else if (isOn() && (settings().bannerOn || settings().fgEnabled)) loadModule('overlays').then((x) => x?.render());
  }

  function renderAll() {
    try {
      updateAvatarStyle();
    } catch (e) {
      console.error('[NTR render]', e);
    }
    renderOverlays();
  }

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
  async function uploadDataUrl(dataUrl, prefix) {
    const m = /^data:([\w/+.-]+);base64,(.+)$/s.exec(String(dataUrl || ''));
    if (!m || !MIME_EXT[m[1]]) throw new Error('Unsupported embedded file');
    return uploadBase64(m[2], MIME_EXT[m[1]], prefix);
  }

  const readDataURL = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
  // With `cors`, a picture from another site loads only if that site lets it be drawn onto a canvas and read back.
  const loadImg = (u, cors = false) => new Promise((res, rej) => { const i = new Image(); if (cors) i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = u; });

  // Images over `max` px on their longer side (or `maxWidth` wide) are shrunk first: photos stay JPEG, the rest become
  // PNG so transparency survives. Other image types become PNG too, so the file always matches its name. GIFs go as
  // they are, to keep their animation.
  async function uploadImage(f, prefix, { max = 0, maxWidth = 0 } = {}) {
    let url = await readDataURL(f);
    if (f.type !== 'image/gif') {
      const i = await loadImg(url).catch(() => null);
      if (!i?.width || !i.height) throw new Error('That file didn\'t load as an image.');
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

  // Videos (mp4 or webm) are sent as they are. Resolves to the file's path, or '' if it isn't an mp4 or webm, or it's
  // very big and the person cancels. `btn` shows a spinner while it uploads.
  async function uploadVideo(f, prefix, title, btn) {
    let ext = (f.name.split('.').pop() || '').toLowerCase();
    if (!['mp4', 'webm'].includes(ext)) ext = f.type === 'video/webm' ? 'webm' : f.type === 'video/mp4' ? 'mp4' : '';
    if (!ext) { toastr.warning('Use an mp4 or webm video.', title); return ''; }
    if (f.size > 100 * 1024 * 1024 && !(await askYes(btn, `This video is ${Math.round(f.size / 1048576)} MB. Big files may fail to upload or be slow to load. Upload anyway?`, 'Upload'))) return '';
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    const data = await readDataURL(f);
    return uploadBase64(data.slice(data.indexOf(',') + 1), ext, prefix);
  }

  // Runs run(file) when a file is picked in input; a failure shows an error toast with this title. The input is
  // cleared first, so the same file can be picked again.
  function onFilePick(input, title, run) {
    input.onchange = async () => {
      const f = input.files[0];
      input.value = '';
      if (!f) return;
      try { await run(f); } catch (e) {
        console.error(`[NTR ${title} upload]`, e);
        toastr.error(e.message || 'Upload failed', title);
      }
    };
  }

  // ===== Questions and pop-up menus under a button =====
  // Asked right under the button that was pressed: the browser's own boxes can't be styled and freeze the page.
  // One question at a time: a new question closes the open one as if Cancel was pressed, and so does closing or
  // redrawing the menu it's in, so code waiting on it never hangs.
  const cancelAsks = (root) => root?.querySelectorAll('.ntr_ask').forEach((el) => (el.ntrCancel ? el.ntrCancel() : el.remove()));
  function askBox(anchor, html, cancel) {
    cancelAsks(document);
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

  // Turns el into a box for a number from 1 to n, starting at at + 1, with before and after (HTML) around it. Enter calls
  // done with the number picked, counted from 0 and kept within 0 to n - 1; Escape, clicking away or an empty box call it
  // with null. el should be redrawn in done, and left alone while it holds the box.
  function askNumber(el, at, n, before, after, label, done) {
    if (!el || n < 2 || el.querySelector('input')) return;
    el.innerHTML = `${before}<input type="number" min="1" max="${n}" step="1" value="${at + 1}" aria-label="${label}">${after} ${n}`;
    const box = el.querySelector('input');
    let over = false;
    const end = (jump) => {
      if (over) return;
      over = true;
      const v = Math.round(Number(box.value));
      const typed = jump && box.value.trim() && Number.isFinite(v);
      box.remove();
      done(typed ? Math.max(0, Math.min(n - 1, v - 1)) : null);
    };
    box.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') { e.preventDefault(); end(true); }
      else if (e.key === 'Escape') { e.preventDefault(); end(false); }
    });
    box.addEventListener('blur', () => end(false));
    box.focus();
    box.select();
  }

  // Ask for a link instead of an upload, under `anchor` (the Link button). Resolves to a checked http(s) URL that
  // loaded, or '' if cancelled. Like uploadHere, a link for the open chat that finishes checking after the chat
  // changed would land on the wrong character, so '' comes back. `perChat` false skips this for global settings.
  const askUrl = (anchor, label, load, failMsg, perChat = true) => {
    const st = store();
    return askText(anchor, {
      label,
      check: async (raw) => {
        const u = cUrl(raw);
        if (!/^https?:\/\//i.test(u)) return { error: 'Paste a full link that starts with http:// or https://' };
        try { await load(u); } catch (e) { return { error: failMsg }; }
        return { value: u };
      },
    }).then((u) => {
      if (!u) return '';
      if (!perChat || store() === st) return u;
      toastr.warning('The chat changed before the link was checked, so it was not saved. Paste it again.', 'Link');
      return '';
    });
  };
  const askImageUrl = (label, anchor, perChat = true) => askUrl(anchor, `${label}: paste a picture link (https://...)`, loadImg,
    'That link did not load as a picture. Check it and try again.', perChat);

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
  const askVideoUrl = (label, anchor, perChat = true) => askUrl(anchor, `${label}: paste a link to an mp4 or webm video (https://...)`, loadVideo,
    'That link did not load as a video. Use a direct link to an mp4 or webm file.', perChat);

  // A small menu under a button, like Move to folder on the Regexes page. The button sits in a .ntr_menu box, and `html`
  // is the menu's buttons. A second click on the same button closes it, and so does a click in its .ntr_page outside
  // every .ntr_menu box. A click on its own buttons doesn't, so callers close it on a pick.
  function popMenu(anchor, html) {
    const scope = anchor.closest('.ntr_page') || document;
    const had = anchor.parentElement.querySelector('.ntr_pop');
    closePops(scope);
    if (had) return null;
    const pop = document.createElement('div');
    pop.className = 'ntr_pop';
    pop.innerHTML = html;
    pop.ntrAnchor = anchor;
    anchor.parentElement.appendChild(pop);
    anchor.setAttribute('aria-expanded', 'true');
    const out = (e) => {
      if (pop.isConnected && e.target.closest('.ntr_menu')) return;
      scope.removeEventListener('click', out);
      if (pop.isConnected) closePops(scope);
    };
    scope.addEventListener('click', out);
    return pop;
  }
  function closePops(scope = document) {
    scope?.querySelectorAll('.ntr_pop').forEach((p) => { p.ntrAnchor?.setAttribute('aria-expanded', 'false'); p.remove(); });
  }

  // ===== Shared UI helpers =====
  // The menu's pages, in the order of the icon column: id, icon, short name for the column, full name.
  // The only place they're written: the column and each page's title both read them from here.
  const PAGES = [
    ['themes', 'fa-bookmark', 'Themes', 'Themes'],
    ['reader', 'fa-book-open', 'Reader', 'Reader Mode'],
    ['layout', 'fa-table-cells-large', 'Layout', 'Layout'],
    ['display', 'fa-palette', 'Decor', 'UI Decor'],
    ['text', 'fa-text-height', 'Text', 'Text Formatting'],
    ['pfp', 'fa-user', 'Avatars', 'Avatar Management'],
    ['elements', 'fa-shapes', 'Elements', 'Elements'],
    ['fg', 'fa-layer-group', 'Overlays', 'Overlays'],
    ['regex', 'fa-code', 'Regexes', 'Regexes'],
    ['agents', 'fa-robot', 'Agents', 'Agents'],
  ];
  // Lines in the column: Themes and Reader Mode, then the look settings (Layout to Overlays), then the pages that work on the chat itself.
  const NAV_SEP = new Set(['layout', 'regex']);
  const navHtml = (cur) => PAGES.map(([id, icon, short, full]) => (NAV_SEP.has(id) ? '<div class="ntr_navsep" role="separator"></div>' : '') +
    `<button class="ntr_navi${id === cur ? ' on' : ''}" data-page="${id}" title="${full}"><i class="fa-solid fa-fw ${icon}"></i><span>${short}</span></button>`).join('')
    + '<div class="ntr_navfill"></div>';
  // A menu button with an icon and a label (HTML). title also names it for screen readers; margin replaces the default 0.
  const menuBtn = (id, icon, label, { title = '', margin = '0', cls = '' } = {}) => `<button type="button"${id ? ` id="${id}"` : ''} class="menu_button${cls ? ` ${cls}` : ''}" style="margin: ${margin}; width: max-content;"${title ? ` title="${escapeHTML(title)}" aria-label="${escapeHTML(title)}"` : ''}><i class="fa-solid ${icon}"></i>${label}</button>`;
  // An on/off switch; title is also its aria-label. With box (a class), it is wrapped in a larger tap target for list
  // rows. extra holds more attributes, like ' disabled'.
  function switchHtml({ id = '', cls = '', box = '', on, title, extra = '' }) {
    const t = escapeHTML(title);
    const input = `<input type="checkbox"${id ? ` id="${id}"` : ''} class="ntr_pswitch${cls ? ` ${cls}` : ''}" ${on ? 'checked' : ''} title="${t}" aria-label="${t}"${extra}>`;
    return box ? `<label class="${box} ntr_swcol">${input}</label>` : input;
  }
  // One page: a big title with the section's icon (both from PAGES) and, for a section that can be switched off, its switch.
  // A switched-off section's settings are dimmed (see syncPageOff). A note sits between the title and the settings and is never dimmed.
  // `wait` names the module a page is still loading, which fills it in when it arrives (see fillIn).
  function pageHtml(sec, body, { sw = null, legend = false, note = '', wait = '' } = {}) {
    const [, icon, , title] = PAGES.find(([id]) => id === sec);
    return `
      <section class="ntr_page${sw && !sw[1] ? ' ntr_off' : ''}" data-page="${sec}"${wait ? ` data-ntr-wait="${wait}"` : ''}${settings().uiPage === sec ? '' : ' hidden'}>
        <div class="ntr_phead">
          <i class="fa-solid fa-fw ${icon} ntr_picon"></i>
          <h3 class="ntr_ptitle">${title}</h3>
          ${sw ? switchHtml({ id: sw[0], on: sw[1], title: `Turn ${title} on or off` }) : ''}
          ${legend ? `<div class="cb_hint ntr_legend">${TAG_KEY}</div>` : ''}
        </div>
        ${note}
        <div class="ntr_pbody">${body}</div>
      </section>`;
  }
  // A part of a page with its own title and switch, like Header Banner on Overlays. A switched-off part's settings are
  // dimmed (see syncPageOff). Its title folds and opens it (`fold`: its key in uiOpen, folded until first opened), with a
  // Font Awesome icon before the title.
  function pagePart(title, sw, fold, body, icon) {
    return `
      <div class="ntr_part${sw[1] ? '' : ' ntr_off'}">
        <div class="ntr_parthead cb_collapse_toggle" data-sec="${fold}" tabindex="0" role="button">
          <i class="fa-solid fa-chevron-right cb_chevron"></i>
          <i class="fa-solid fa-fw ${icon} ntr_part_icon"></i>
          <h4 class="ntr_parttitle">${title}</h4>
          ${switchHtml({ id: sw[0], on: sw[1], title: `Turn ${title} on or off` })}
        </div>
        <div class="ntr_partbody">${body}</div>
      </div>`;
  }
  // A group of settings: a small label, with an optional Font Awesome icon, then the settings in a soft card.
  const card = (label, inner, icon = '') => `${label ? `<div class="ntr_glab">${icon ? `<i class="fa-solid fa-fw ${icon} ntr_glab_icon"></i>` : ''}${label}</div>` : ''}<div class="ntr_card">${inner}</div>`;
  const thumbHtml = (src, icon) => (src ? `<img src="${escapeHTML(src)}" alt="">` : `<i class="fa-solid ${icon}"></i>`);
  // A picture setting: a preview with Upload, Link and Remove. Both take the same options: id (m_<id>_... on its parts),
  // key (the setting), title (on the link question and an upload error), upload ([name, options] for uploadImage), and
  // optionally label (the name; Picture by default), icon (the empty preview's), wide (a wide preview), hint (under the
  // name), attrs (on the slot) and onSet (after a change).
  function picSlotHtml(o) {
    return `
          <div class="cb_cur_slot"${o.attrs ? ' ' + o.attrs : ''}>
            <div class="cb_cur_row">
              <div class="cb_cur_prev${o.wide ? ' ntr_rd_pic' : ''}" id="m_${o.id}_prev"></div>
              <span class="cb_cur_name">${o.label || 'Picture'}${o.hint ? `<small>${o.hint}</small>` : ''}</span>
              <button class="menu_button" id="m_${o.id}_up" title="Upload" aria-label="Upload ${o.title}"><i class="fa-solid fa-upload"></i></button>
              <button class="menu_button" id="m_${o.id}_url" title="Use a link" aria-label="Use a link for ${o.title}"><i class="fa-solid fa-link"></i></button>
              <button class="menu_button" id="m_${o.id}_clr" title="Remove picture" aria-label="Remove ${o.title}"><i class="fa-solid fa-rotate-left"></i></button>
            </div>
            <input type="file" id="m_${o.id}_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
          </div>`;
  }
  function bindPicSlot(overlay, s, o) {
    const part = (p) => overlay.querySelector(`#m_${o.id}_${p}`);
    const file = part('file');
    const render = () => {
      part('prev').innerHTML = thumbHtml(s[o.key], o.icon || 'fa-image');
      part('clr').disabled = !s[o.key];
    };
    const setImg = (url) => {
      const old = s[o.key];
      s[o.key] = url;
      save();
      updateAvatarStyle();
      o.onSet?.();
      render();
      deleteFileIfUnused(old);
    };
    part('up').onclick = () => file.click();
    part('url').onclick = async function() {
      const url = await askImageUrl(o.title, this, false);
      if (url) setImg(url);
    };
    part('clr').onclick = () => setImg('');
    onFilePick(file, o.title, async (f) => setImg(await uploadImage(f, ...o.upload)));
    render();
  }
  // Long reference parts stay folded into one row until opened. Every other part is a card that's always open.
  const FOLDED = new Set(['rd_book', 'rd_vn', 'vn_guide', 'vn_prompt', 'rb_css', 'rb_bgimg', 'rb_pattern', 'ov_scroll_css', 'ov_cursor_css', 'ov_qr_css', 'av_css_ai', 'av_css_us', 'av_emo', 'av_chat', 'av_emo_list', 'av_spk', 'av_tags']);
  // An optional Font Awesome icon goes before the title, like card's.
  function subHead(sec, title, icon = '') {
    const ic = icon ? `<i class="fa-solid fa-fw ${icon} ntr_glab_icon"></i>` : '';
    if (FOLDED.has(sec)) return `<div class="cb_collapse_toggle ntr_fold" data-sec="${sec}" tabindex="0" role="button"><span>${ic}${title}</span><i class="fa-solid fa-chevron-right cb_chevron"></i></div>`;
    return `<div class="ntr_glab" data-sec="${sec}">${ic}${title}</div>`;
  }
  function pills(name, opts, cur) {
    return `<div class="cb_pills">${opts.map(([v, l, t]) => `<label class="cb_pill"${t ? ` title="${escapeHTML(t)}"` : ''}><input type="radio" name="cbr_${name}" value="${escapeHTML(v)}" ${v === cur ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>`;
  }
  const POS_GRID = [['tl', 'Top Left'], ['tc', 'Top Center'], ['tr', 'Top Right'], ['cl', 'Center Left'], ['cc', 'Center'], ['cr', 'Center Right'], ['bl', 'Bottom Left'], ['bc', 'Bottom Center'], ['br', 'Bottom Right']];
  function posGrid(name, cur) {
    return `<div class="cb_posgrid">${POS_GRID.map(([v, l]) =>`<label title="${l}"><input type="radio" name="cbr_${name}" value="${v}" aria-label="${l}" ${v === cur ? 'checked' : ''}></label>`).join('')}</div>`;
  }
  function onPills(root, name, fn) {
    root.querySelectorAll(`input[name="cbr_${name}"]`).forEach((r) => { r.onchange = () => { if (r.checked) fn(r.value); }; });
  }
  const keyClick = (el) => el.addEventListener('keydown', (e) => { if (e.target === el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); el.click(); } });
  // Content is the header's next sibling.
  function showFold(h, open) {
    h.nextElementSibling.style.display = open ? 'block' : 'none';
    h.classList.toggle('ntr_open', open);
    h.setAttribute('aria-expanded', String(open));
    const icon = h.querySelector('.cb_chevron');
    icon.classList.toggle('fa-chevron-down', open);
    icon.classList.toggle('fa-chevron-right', !open);
  }
  function bindCollapses(overlay, s) {
    overlay.querySelectorAll('.cb_collapse_toggle[data-sec]').forEach((h) => {
      const sec = h.dataset.sec;
      showFold(h, !!s.uiOpen[sec]);
      h.addEventListener('click', (e) => {
        if (e.target.closest('input')) return;
        const open = !h.classList.contains('ntr_open');
        s.uiOpen[sec] = open;
        save();
        showFold(h, open);
      });
      keyClick(h);
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
    overlay.querySelectorAll('.ntr_part').forEach((p) => p.classList.toggle('ntr_off', !p.querySelector('.ntr_pswitch').checked));
    overlay.querySelectorAll('.ntr_page').forEach((p) => {
      const sw = p.querySelector('.ntr_phead .ntr_pswitch');
      const parts = [...p.querySelectorAll('.ntr_part .ntr_pswitch')];
      p.classList.toggle('ntr_off', !!sw && !sw.checked);
      const off = sw ? !sw.checked : parts.length > 0 && parts.every((x) => !x.checked);
      overlay.querySelector(`.ntr_navi[data-page="${p.dataset.page}"]`)?.classList.toggle('ntr_off', off);
    });
  }

  // Adds to `into` the elements matching sel that MutationObserver records touched: the closest match around each changed
  // node, or the matches inside added nodes.
  function changedEls(recs, sel, into = new Set()) {
    for (const r of recs) {
      const t = r.target.nodeType === 1 ? r.target : r.target.parentElement;
      const m = t && t.closest(sel);
      if (m) { into.add(m); continue; }
      for (const a of r.addedNodes) {
        if (a.nodeType !== 1) continue;
        if (a.matches(sel)) into.add(a);
        a.querySelectorAll(sel).forEach((e) => into.add(e));
      }
    }
    return into;
  }

  // Dragging a row, with a mouse or a finger, on the Regexes and Agents pages. A mouse starts the drag once it moves a
  // few pixels, so a click still clicks. A finger or pen starts it by holding still for a moment, so a swipe still
  // scrolls; a hold let go without moving is a tap. A copy of what's dragged follows the pointer and its own place in
  // the list becomes the gap that shows where it lands. Near the top or bottom of the menu the page scrolls, even while
  // the pointer stays still. Escape puts it back.
  //   pick(el): what a press on el drags, as { item, kind, scope, face } (scope: the box it stays in; face: the part of
  //     item that follows the pointer, if not all of it), or null.
  //   place(el, drag, after): moves drag.item to where the pointer is, over el; after(box) says if the pointer is in the
  //     lower half of box. Returns a header to light up as where it goes, if any.
  //   done(drag): the drag is over; drag.moved is false for a hold let go in place or Escape.
  // Gives back { busy() }, true while dragging, so a page doesn't redraw under it.
  function dragSort(page, { pick, place, done }) {
    let drag = null;
    let raf = 0;
    // The click the browser sends after a drop is dropped, so a row let go near where it started isn't clicked.
    let eatUntil = 0;
    const unlit = () => page.querySelectorAll('.ntr_drop').forEach((el) => el.classList.remove('ntr_drop'));
    const follow = () => {
      if (!drag.ghost) {
        const r = drag.item.getBoundingClientRect();
        const g = (drag.face || drag.item).cloneNode(true);
        g.classList.add('ntr_ghost');
        g.setAttribute('aria-hidden', 'true');
        for (const el of [g, ...g.querySelectorAll('[id], [data-id]')]) [...el.attributes].forEach((x) => { if (x.name === 'id' || x.name.startsWith('data-')) el.removeAttribute(x.name); });
        g.style.width = `${r.width}px`;
        g.style.left = '0px';
        g.style.top = '0px';
        page.appendChild(g);
        // A transformed menu moves "fixed" boxes with it, so measure where 0, 0 landed and allow for it.
        const o = g.getBoundingClientRect();
        drag.ghost = g;
        drag.at = { x: r.left - o.left, dy: drag.y - r.top, oy: o.top };
        drag.item.classList.add('ntr_dragging');
      }
      drag.ghost.style.left = `${drag.at.x}px`;
      drag.ghost.style.top = `${drag.y - drag.at.dy - drag.at.oy}px`;
    };
    const aim = () => {
      unlit();
      const el = document.elementFromPoint(drag.x, drag.y);
      if (!el || !drag.scope.contains(el)) return;
      const after = (box) => { const r = box.getBoundingClientRect(); return drag.y > r.top + r.height / 2; };
      place(el, drag, after)?.classList.add('ntr_drop');
    };
    const scroll = () => {
      raf = 0;
      const body = drag && page.closest('.ntr_body');
      if (!body) return;
      const r = body.getBoundingClientRect();
      const step = drag.y < r.top + 40 ? -12 : drag.y > r.bottom - 40 ? 12 : 0;
      const was = body.scrollTop;
      if (step) body.scrollTop += step;
      if (body.scrollTop === was) return;
      aim();
      raf = requestAnimationFrame(scroll);
    };
    // The row lifts. If the page was drawn again while the press waited, the row pressed is gone and nothing happens.
    const start = () => {
      clearTimeout(drag.hold);
      if (!drag.item.isConnected) { end(false); return; }
      drag.on = true;
      closePops(page);
      page.classList.add('ntr_sorting');
      follow();
    };
    // Only the finger (or mouse) that started the drag moves or drops it, so a second finger can't.
    const onMove = (e) => {
      if (e.pointerId !== drag.pointer) return;
      drag.x = e.clientX;
      drag.y = e.clientY;
      const far = Math.hypot(drag.x - drag.x0, drag.y - drag.y0) > (drag.touch ? 8 : 4);
      if (!drag.on) {
        if (!far) return;
        // A finger that moves before the hold is up is scrolling.
        if (drag.touch) { end(false); return; }
        start();
        if (!drag) return;
      }
      if (far) drag.moved = true;
      follow();
      aim();
      if (!raf) raf = requestAnimationFrame(scroll);
    };
    // Once a finger's drag starts, it moves the row instead of scrolling, and no long-press menu opens.
    const noScroll = (e) => { if (drag?.on) e.preventDefault(); };
    const noMenu = (e) => e.preventDefault();
    const end = (keep) => {
      dragEnded(onMove, onUp);
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('touchmove', noScroll, { passive: false });
      document.removeEventListener('contextmenu', noMenu, true);
      clearTimeout(drag.hold);
      cancelAnimationFrame(raf);
      raf = 0;
      const d = drag;
      drag = null;
      if (!d.on) return;
      d.ghost?.remove();
      d.item.classList.remove('ntr_dragging');
      page.classList.remove('ntr_sorting');
      unlit();
      d.moved = keep && d.moved;
      if (keep && !d.moved) d.target.click();
      eatUntil = Date.now() + 400;
      done(d);
    };
    const onUp = (e) => { if (e.pointerId === drag.pointer) end(e.type === 'pointerup'); };
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); end(false); } };
    page.addEventListener('click', (e) => {
      if (e.isTrusted && Date.now() < eatUntil) { e.preventDefault(); e.stopImmediatePropagation(); }
    }, true);
    page.addEventListener('dragstart', (e) => { if (pick(e.target)) e.preventDefault(); });
    page.addEventListener('pointerdown', (e) => {
      eatUntil = 0;
      if (drag || e.button !== 0 || !e.isPrimary) return;
      const p = pick(e.target);
      if (!p) return;
      const touch = e.pointerType !== 'mouse';
      drag = { ...p, scope: p.scope || page, target: e.target, touch, on: false, moved: false, ghost: null, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, pointer: e.pointerId };
      if (touch) {
        drag.hold = setTimeout(start, 300);
        document.addEventListener('touchmove', noScroll, { passive: false });
        document.addEventListener('contextmenu', noMenu, true);
      }
      dragEnds(onMove, onUp);
      document.addEventListener('keydown', onKey, true);
    });
    return { busy: () => !!drag?.on };
  }

  // A drag also ends when the browser takes the gesture over (pointercancel), so it never stays on the next tap.
  function dragEnds(move, up) {
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', up);
  }
  function dragEnded(move, up) {
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', up);
    document.removeEventListener('pointercancel', up);
  }

  // ===== Look helpers the look pages share (UI Decor is in decor.js; its keys start with ov) =====
  // UI Decor's switch, with decor.js loaded. Without decor.js, the parts of UI Decor the core builds stay SillyTavern's
  // own too, whatever is saved: Blur and Shadow, the corners and bottom line where the chat panel meets a Floating send
  // bar, and Speech Bubbles (bubblesOn).
  const decorOn = (s) => s.ovEnabled && !!window.NTR.decor;

  function overrideCss(s) {
    let v = '';
    // Chat Width sits in Layout, so Layout's switch is the one that counts.
    if (layoutOn(s) && s.ovWidthOn) v += `--sheldWidth: ${rangeNum(s, 'ovWidth')}vw !important; `;
    if (decorOn(s)) {
      if (s.ovBlurOn) v += `--blurStrength: ${rangeNum(s, 'ovBlur')} !important; `;
      if (s.ovShadowOn) v += `--shadowWidth: ${rangeNum(s, 'ovShadow')} !important; `;
    }
    // Overall Font Scale sits in Text Formatting, so that section's switch is the one that counts. Its only control is on
    // that page, so without text.js it stays SillyTavern's own, like the rest of the page.
    if (s.tfEnabled && s.ovFontOn && window.NTR.text) v += `--fontScale: ${rangeNum(s, 'ovFont')} !important; `;
    return v ? `\n      :root { ${v}}\n` : '';
  }

  // Hide Names and Avatars takes away avatars, names and timestamps, NTR Avatars and pop-outs included. It sits in
  // Layout, so Layout's switch is the one that counts, and without layout.js it stays off, whatever is saved.
  const namesHidden = (s) => isOn() && layoutOn(s) && s.ovNamesOn;
  // NTR Avatars on one side: the avatar as a backdrop or pop-out instead of the chat avatar. Without avatars.js they
  // stay off, whatever is saved, and other pages stop making room for NTR's avatars.
  const ntrAvatars = (s, prefix) => isOn() && !!window.NTR.avatars && s.avatarEnabled && s[prefix + 'Enabled'] && !namesHidden(s);

  // One CSS rule, each property !important. Empty properties are left out, and a rule with none left is no rule.
  function cssRule(sel, props) {
    const body = Object.entries(props).filter(([, v]) => v !== '' && v != null).map(([k, v]) => `${k}: ${v} !important;`).join(' ');
    return body ? `\n      ${sel} { ${body} }` : '';
  }
  // A color at an opacity in %: below 100, it's mixed with see-through.
  const seeThrough = (c, opacity) => (opacity < 100 ? `color-mix(in srgb, ${c} ${opacity}%, transparent)` : c);
  function cssTag(id, v) {
    let el = document.getElementById(id);
    if (!v) { el?.remove(); return; }
    if (!el) { el = document.createElement('style'); el.id = id; document.head.appendChild(el); }
    // Rewriting the same text still makes the browser redo the page's styles, and some tags are set many times a second.
    if (el.textContent !== v) el.textContent = v;
  }

  // Chat panel, messages and send box. Each setting is SillyTavern's own look while it's unticked.
  const ovColorVal = (s, k, opacity) => seeThrough(s[k] || `var(${COLOR_FROM[k]})`, rangeNum(s, opacity));
  const ovRadius = (s, p) => (s[`ov${p}Shape`] === 'square' ? 0 : rangeNum(s, `ov${p}Round`));
  const ovBorderVal = (s, p) => (s[`ov${p}Border`] === 'none' ? 'none' : `${rangeNum(s, `ov${p}BorderWidth`)}px solid ${ovColorVal(s, `ov${p}BorderColor`, `ov${p}BorderOpacity`)}`);

  // Where the chat panel meets the send box. Joined is SillyTavern's own: the send box right under the chat panel, flat
  // where they meet. Standing apart (Separate, or Floating in Layout), the panel gets its bottom corners and bottom
  // line back, and the send box all four corners. The top stays flush with SillyTavern's square top bar: no rounded
  // top corners.
  function joinCss(s, separate, pre = '') {
    const on = (k) => s[k + 'On'];
    const pr = on('ovShape') ? ovRadius(s, '') : null;
    const line = on('ovPanelBorder') && s.ovPanelBorder !== 'none';
    const sr = on('ovSendShape') ? ovRadius(s, 'Send') : null;
    return cssRule(`${pre}#chat`, {
      'border-radius': pr === null ? '' : separate ? `0 0 ${pr}px ${pr}px` : '0',
      'border-bottom': !line ? '' : separate ? ovBorderVal(s, 'Panel') : 'none',
    }) + cssRule(`${pre}#form_sheld #send_form`, { 'border-radius': sr === null ? '' : separate ? `${sr}px` : `0 0 ${sr}px ${sr}px` });
  }

  // Attached Style: Separate stands the send box apart from the chat panel. It sits in Layout, so Layout's switch counts.
  const sendSeparate = (s) => layoutOn(s) && s.ovSendPosOn && s.ovSendPos === 'separate';

  // The room in px a box (r, a rect) keeps clear for a Floating send bar: from r's bottom up to the send bar's top, when
  // that top is in r's lower half and their widths overlap; otherwise 0. For layout.js, reader.js and vn.js, which
  // check Floating first.
  function sendCover(r, form) {
    const f = form?.getBoundingClientRect();
    return f && f.height && f.left < r.right && f.right > r.left && f.top < r.bottom && f.top > r.top + r.height / 2 ? r.bottom - f.top : 0;
  }

  // Layout's Space Between Messages, and the gap Separate leaves above the send box.
  function layoutChatCss(s) {
    let css = '';
    if (layoutOn(s) && s.ovMesGapOn) css += cssRule('#chat .mes:not(.last_mes)', { 'margin-bottom': `${rangeNum(s, 'ovMesGap')}px` });
    if (sendSeparate(s)) css += cssRule('#form_sheld', { 'margin-top': `${rangeNum(s, 'ovSendGap')}px` });
    return css;
  }

  // Hide Names and Avatars, from Layout (see namesHidden).
  function namesCss(s) {
    if (!namesHidden(s)) return '';
    return cssRule('#chat .mes .mesAvatarWrapper, #chat .mes .ch_name .name_text, #chat .mes .ch_name .timestamp, #chat .mes .ch_name .timestamp-icon', { display: 'none' });
  }

  // The Tail and Text in Bubbles choices on UI Decor's page (decor.js). A saved one is checked against them (PICK_KEYS).
  const BUB_TAIL_OPTS = [['none', 'None'], ['pointed', 'Pointed'], ['curved', 'Curved'], ['thought', 'Thought']];
  const BUB_INK_OPTS = [['auto', 'As Is'], ['dark', 'Dark'], ['light', 'Light']];
  // Speech Bubbles (decor.js), which Text Formatting and Elements read to move parts to a bubble's side.
  const bubblesOn = (s) => isOn() && decorOn(s) && s.ovBubOn;
  // Whether a side's messages sit on the right.
  const bubRight = (s, p) => (s.ovBubAlign === 'sides' && p === 'Us') || (s.ovBubAlign === 'swap' && p === 'Ai');
  const hint = (t) => `<div class="cb_hint">${t}</div>`;
  // Override rows: a checkbox in front of each setting; unticked means SillyTavern's own value applies.
  function ovRow(s, onKey, label, inner) {
    return `
      <div class="cb_ovrow">
        <label class="checkbox_label"><input type="checkbox" class="m_o_on" data-key="${onKey}" ${s[onKey] ? 'checked' : ''}><span>${label}</span></label>
        <div class="m_o_body ${s[onKey] ? '' : 'cb_dim'}" data-for="${onKey}">${inner}</div>
      </div>`;
  }
  // Typing a slider's value: the number beside a slider (class ntr_slval) turns into a box when clicked. Enter or
  // clicking away applies it, Esc keeps the old one. The slider keeps it to its own range and step, and its own input
  // and change handlers save and apply it, as if it was dragged. data-scale turns the shown number into the saved one.
  // The number sits in the slider's row, or in the row just above it.
  function slFor(el) {
    const row = el.closest('.cb_row, .cb_place_gridset');
    const next = row?.nextElementSibling;
    return row?.querySelector('input[type="range"]') || (next?.matches('input[type="range"]') ? next : null);
  }
  // A slider's number: the reverse of slFor.
  function slNum(sl) {
    const prev = sl.previousElementSibling;
    const el = (prev?.matches('.cb_row') ? prev : sl.closest('.cb_row, .cb_place_gridset'))?.querySelector('.ntr_slval');
    return el && slFor(el) === sl ? el : null;
  }
  const slText = (v, scale) => (scale ? (v / scale).toFixed(1) : v);
  function showSlider(sl, v) {
    const el = slNum(sl);
    if (el) el.textContent = slText(v, Number(el.dataset.scale));
  }
  const showRange = (e) => { if (e.target.type === 'range') showSlider(e.target, e.target.value); };
  // Shows v even when the slider clamps it: a value set from code can be past the slider's ends.
  function setSlider(sl, v) {
    sl.value = v;
    showSlider(sl, v);
  }
  function typeSlider(e) {
    const el = e.target.closest?.('.ntr_slval');
    const sl = el && slFor(el);
    if (!sl || sl.disabled || el.hidden) return;
    const box = document.createElement('input');
    box.type = 'text';
    box.className = 'text_pole ntr_slbox';
    box.inputMode = Number(sl.min) < 0 ? 'text' : 'decimal'; // phone number pads may have no minus key
    box.value = el.textContent;
    el.hidden = true;
    el.after(box);
    let done = false;
    const end = (apply) => {
      if (done) return;
      done = true;
      const v = parseFloat(box.value.replace(',', '.'));
      box.remove();
      el.hidden = false;
      if (!apply || !Number.isFinite(v)) return;
      // Always applied, even when the slider already shows it: the saved value can be one the slider can't show (an
      // offset dragged past the slider's end, or off its step), and the slider has already moved to its nearest.
      sl.value = String(v * (Number(el.dataset.scale) || 1));
      sl.dispatchEvent(new Event('input', { bubbles: true }));
      sl.dispatchEvent(new Event('change', { bubbles: true }));
    };
    box.onkeydown = (ev) => {
      if (ev.key === 'Enter') { ev.preventDefault(); end(true); }
      else if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); end(false); }
    };
    box.onblur = () => end(true);
    box.focus();
    box.select();
  }
  const checkBox = (id, on, label) => `<label class="checkbox_label"><input type="checkbox" id="${id}" ${on ? 'checked' : ''}><span>${label}</span></label>`;
  function bindCheck(root, sel, s, key, after) {
    root.querySelector(sel).onchange = function() { s[key] = this.checked; save(); after?.(); };
  }
  function bindSliders(root, sel, s, after) {
    root.querySelectorAll(sel).forEach((sl) => {
      sl.oninput = () => { s[sl.dataset.key] = Number(sl.value); after?.(); };
      sl.onchange = save;
    });
  }
  function ovSlider(s, key, unit, min, max, step, cls, scale) {
    const v = rangeNum(s, key);
    return `
      <div class="cb_row"><input type="range" class="${cls}" data-key="${key}" min="${min}" max="${max}" step="${step}" value="${v}" style="flex:1;"><span style="min-width:60px;text-align:right;"><span class="ntr_slval"${scale ? ` data-scale="${scale}"` : ''}>${slText(v, scale)}</span>${unit}</span></div>`;
  }
  function ovColor(s, key) {
    return `<toolcool-color-picker class="m_o_col" data-key="${key}" color="${escapeHTML(s[key])}"></toolcool-color-picker>`;
  }
  function ovText(s, key, placeholder = '') {
    return `<input type="text" class="text_pole m_o_lbl" data-key="${key}" value="${escapeHTML(s[key])}" maxlength="${strMax(key)}" placeholder="${escapeHTML(placeholder)}" style="width:100%;">`;
  }
  // A font box, in a holder fonts.js adds its list and button to, and the note it shows when Google has no font by that
  // name. Without fonts.js it's a plain text box.
  function ovFont(s, key) {
    return `<div class="ntr_fbox"><input type="text" class="text_pole m_o_txt" data-key="${key}" value="${escapeHTML(s[key])}" maxlength="300" placeholder="A font name or link"></div>
      <div class="cb_hint ntr_fmiss" hidden></div>`;
  }
  // A Custom CSS box, k its setting. CSS_NOTE is the hint line callers put under it.
  const customCssBox = (s, k, ph) => `<textarea class="text_pole m_css" data-key="${k}" rows="5" maxlength="${strMax(k)}" spellcheck="false" placeholder="${ph}" style="width:100%;font-family:monospace;">${escapeHTML(s[k])}</textarea>`;
  const CSS_NOTE = 'Add <code>!important</code> if a setting doesn\'t take. Saved in themes; CSS from someone else\'s theme arrives switched off.';

  const FONT_NOTE = 'Fonts: a font on your device, or any Google Fonts name or link. Google fonts need a connection.';

  // A pick-one row: the radio name is the key in lower case, with "o" in front.
  const ovPick = (s, k, opts) => pills('o' + k.toLowerCase(), opts, s[k]);
  // Shown only while a pick has a certain value, like Roundness under Rounded.
  const ovWhen = (k, v, inner) => `<div class="m_o_when" data-when="${k}" data-val="${v}">${inner}</div>`;
  // A small label above a control. The label is plain text, so it's also the control's name: a pills group gets it as a
  // radio group, anything else on its first control. A pill keeps its own text as its name.
  const plainLabel = (label) => escapeHTML(label.replace(/<[^>]*>/g, '').trim());
  const ovLabel = (label, inner) => {
    const n = plainLabel(label);
    const named = /^\s*<div class="cb_pills"/.test(inner)
      ? inner.replace('<div class="cb_pills"', `<div class="cb_pills" role="radiogroup" aria-label="${n}"`)
      : inner.replace(/<(input(?![^>]*type="(?:radio|checkbox)")|select|textarea|toolcool-color-picker)\b(?![^>]*aria-label)/, `<$1 aria-label="${n}"`);
    return `<div class="cb_hint" style="margin:6px 0 0;">${label}</div>${named}`;
  };
  // A slider under a row with its label and value, for a module that binds its own sliders. `input` is the input's own
  // attributes, like its id or class.
  const sliderAbove = (label, k, v, input, top = '') => `
    <div class="cb_row"${top ? ` style="margin-top: ${top};"` : ''}><label>${label}</label><span><span class="ntr_slval">${v}</span>${NUM_RANGE[k][3]}</span></div>
    <input type="range" ${input} aria-label="${plainLabel(label)}" ${rangeAttrs(k)} value="${v}">`;

  // Shape, Background and Border rows of a part in Panel or BOX_PARTS.
  const ovShapeRow = (s, p) => ovRow(s, `ov${p}ShapeOn`, 'Shape', ovPick(s, `ov${p}Shape`, [['rounded', 'Rounded'], ['square', 'Square']])
    + ovWhen(`ov${p}Shape`, 'rounded', ovLabel('Roundness', rangeSlider(s, `ov${p}Round`))));
  const ovBgRow = (s, p) => ovRow(s, `ov${p}BgOn`, 'Background', ovPick(s, `ov${p}Bg`, [['clear', 'Transparent'], ['color', 'Color']])
    + ovWhen(`ov${p}Bg`, 'color', ovLabel('Color', ovColor(s, `ov${p}BgColor`)) + ovLabel('Opacity', rangeSlider(s, `ov${p}BgOpacity`))));
  const ovBorderRow = (s, p) => ovRow(s, `ov${p}BorderOn`, 'Border', ovPick(s, `ov${p}Border`, [['none', 'None'], ['line', 'Line']])
    + ovWhen(`ov${p}Border`, 'line', ovLabel('Line Color', ovColor(s, `ov${p}BorderColor`)) + ovLabel('Thickness', rangeSlider(s, `ov${p}BorderWidth`)) + ovLabel('Opacity', rangeSlider(s, `ov${p}BorderOpacity`))));

  // The rows every page builds with ovRow, rangeSlider (its default class), ovColor, ovText, ovFont, ovPick, ovWhen and
  // customCssBox, bound once for the whole menu. It runs after the modules', Layout's and Reader Mode's binders and before
  // UI Decor's, Text Formatting's, Elements' and Avatar Management's, so these handlers replace any set on the same rows
  // earlier. Empty colors get SillyTavern's own (stColor). The font boxes' list comes after, from fonts.js, which only
  // listens.
  function bindRows(overlay, s) {
    const put = (k, v) => { s[k] = v; save(); updateAvatarStyle(); };
    overlay.querySelectorAll('.m_o_on').forEach((c) => {
      c.onchange = () => {
        overlay.querySelector(`.m_o_body[data-for="${c.dataset.key}"]`).classList.toggle('cb_dim', !c.checked);
        put(c.dataset.key, c.checked);
      };
    });
    bindSliders(overlay, '.m_o_sl', s, updateAvatarStyle);
    const syncWhen = () => overlay.querySelectorAll('.m_o_when').forEach((el) => { el.style.display = s[el.dataset.when] === el.dataset.val ? '' : 'none'; });
    for (const k of Object.keys(PICK_KEYS)) onPills(overlay, 'o' + k.toLowerCase(), (v) => { put(k, v); syncWhen(); });
    syncWhen();
    overlay.querySelectorAll('.m_o_col').forEach((el) => {
      const k = el.dataset.key;
      if (!COLOR_RE.test(s[k])) {
        s[k] = stColor(k);
        el.setAttribute('color', s[k]);
      }
      el.addEventListener('change', (e) => {
        const v = e.detail.rgba;
        if (COLOR_RE.test(v) && v !== s[k]) put(k, v);
      });
    });
    overlay.querySelectorAll('.m_o_txt').forEach((el) => {
      el.onchange = () => {
        el.value = fontName(el.value);
        put(el.dataset.key, el.value);
      };
    });
    overlay.querySelectorAll('.m_o_lbl').forEach((el) => {
      el.onchange = () => put(el.dataset.key, el.value);
    });
    overlay.querySelectorAll('.m_css').forEach((box) => {
      box.oninput = () => {
        s[box.dataset.key] = box.value;
        updateAvatarStyle();
      };
      box.onchange = save;
    });
  }

  // ===== Look settings' choices, colors and fonts, and what their CSS reads =====
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
  const TEXT_ALIGN = ['left', 'right', 'center', 'justify'];
  const FX = ['glow', 'shadow', 'outline', 'gradient', 'shimmer'];
  const FX_PARTS = ['tfName', 'tfUser', 'tfAi'];
  const RB_BORDERS = ['solid', 'dashed', 'dotted', 'double']; // the button's: unticked is ST's, which has none
  const RB_BOX_BORDERS = ['none', ...RB_BORDERS.filter((b) => b !== 'solid')]; // the box's own line is already solid
  const RB_FX = ['none', 'glow', 'shadow'];
  const RB_SHAPE = { square: '0', rounded: '5px', pill: '999px' };
  const RB_BOX_SHAPE = { rounded: '10px', extra: '20px' }; // unticked: ST's own 2px
  const RB_PATS = ['none', 'notebook', 'lines', 'dots', 'checkers'];
  const RB_ARROW = ['default', 'none', 'symbol', 'image'];
  // Reasoning Arrow Turn: how far it turns while the block is open, and while it's closed.
  const RB_TURN = { flip: ['0deg', '180deg'], quarter: ['90deg', '0deg'], none: ['0deg', '0deg'] };
  // While Thinking: each animation's timing and keyframes. Bounce moves translate, so it goes up even when the arrow is flipped.
  // Pulse shrinks rather than grows, so it never covers the button text.
  const RB_ANIM = {
    spin: ['1.2s linear infinite', '{ to { transform: rotate(1turn); } }'],
    pulse: ['1.2s ease-in-out infinite', '{ 50% { transform: scale(.7); opacity: .5; } }'],
    bounce: ['.9s ease-in-out infinite', '{ 50% { translate: 0 calc(-50% - .35em); } }'],
  };
  // Fade From: the side that turns see-through, on the same 3x3 grid as picture positions. The center fades from the middle out.
  const RB_FADE = { tl: 'to bottom right', tc: 'to bottom', tr: 'to bottom left', cl: 'to right', cc: '', cr: 'to left', bl: 'to top right', bc: 'to top', br: 'to top left' };
  const OV_SHAPES = ['rounded', 'square'];
  // Message Details: the details in the order they show, and the spots, each with its settings key and menu column.
  const MD_ITEMS = [['num', 'Message Number'], ['date', 'Date'], ['time', 'Time'], ['gen', 'Reply Time'], ['think', 'Thinking Time'],
    ['tok', 'Tokens'], ['tps', 'Tokens per Second'], ['model', 'Model']];
  const MD_ITEM_IDS = MD_ITEMS.map(([i]) => i);
  const MD_SPOTS = [['av', 'mdAv', 'Avatar'], ['row', 'mdRow', 'Name Row'], ['corner', 'mdCorner', 'Corner'], ['below', 'mdBelow', 'Below']];
  const MD_KEYS = MD_SPOTS.map(([, k]) => k);
  const MD_SEP = { dot: ' · ', bar: ' | ', slash: ' / ', space: '   ' };

  // Quick Replies' Alignment. Safe keeps the first buttons in reach when one scrolling row is wider than the bar.
  const QR_ALIGN = { left: 'flex-start', center: 'safe center', right: 'safe flex-end' };
  const PICK_KEYS = { tfNameWeight: Object.keys(NAME_WEIGHT), tfUserAlign: TEXT_ALIGN, tfAiAlign: TEXT_ALIGN, tfPlatePos: ['row', 'edge'], rbBorderStyle: RB_BOX_BORDERS, rbBtnBorder: RB_BORDERS, rbBtnShape: Object.keys(RB_SHAPE), rbBoxShape: Object.keys(RB_BOX_SHAPE), rbPat: RB_PATS, rbPatFade: Object.keys(RB_FADE), rbPatShade: ['light', 'dark'], rbTyping: ['off', 'think', 'both'], rbArrow: RB_ARROW, rbArrowTurn: Object.keys(RB_TURN), rbArrowAnim: ['off', ...Object.keys(RB_ANIM)], rbBgFit: ['cover', 'tile'], rbBtnFx: RB_FX, rbEdgeFx: RB_FX, bannerRotateFx: ['fade', 'swap'], bannerRotateOrder: ['order', 'shuffle'] };
  for (const p of FX_PARTS) PICK_KEYS[p + 'Fx'] = FX;
  // The other pick-one settings a theme holds. The Visual Novel and opening choices match the menus in vn.js and opening.js.
  Object.assign(PICK_KEYS, {
    bannerBackdrop: ['wallpaper', 'panel'], ovShape: OV_SHAPES, ovSendPos: ['joined', 'separate'],
    layBarEdge: LAY_EDGES, laySend: ['attached', 'free'], layPhBarEdge: LAY_EDGES, layPhSend: ['attached', 'free'],
    layPage: ['attached', 'free'], layPhPage: ['attached', 'free'], layBan: ['attached', 'free'], layPhBan: ['attached', 'free'],
    nodeShape: ['rounded', 'round', 'square', 'rect'], artBg: ['none', 'dusk', 'night', 'room', 'forest', 'custom'], artSprite: ['builtin', 'custom', 'none'],
    opPos: ['upper', 'center', 'lower'], opExit: ['stay', 'fade', 'rise'], opTrans: ['color', 'cross'],
    rdStyle: ['plain', 'book'], rdBook: BOOKS.map(([v]) => v), aiFrame: ['', ...FRAME_IDS], usFrame: ['', ...FRAME_IDS],
    ovBubTail: BUB_TAIL_OPTS.map(([v]) => v), ovBubTailPos: ['top', 'bottom'], ovBubAlign: ['left', 'sides', 'swap'], ovBubFit: ['fill', 'shrink'], ovBubGroup: ['group', 'each'], ovBubInk: BUB_INK_OPTS.map(([v]) => v),
    ovQrWrap: ['wrap', 'scroll'], ovQrAlign: Object.keys(QR_ALIGN),
    mdDate: ['long', 'short'], mdSep: Object.keys(MD_SEP),
  });
  for (const p of ['Panel', ...BOX_PARTS]) {
    Object.assign(PICK_KEYS, { [`ov${p}Bg`]: ['clear', 'color'], [`ov${p}Border`]: ['none', 'line'] });
    if (p !== 'Panel') PICK_KEYS[`ov${p}Shape`] = OV_SHAPES;
  }
  PICK_KEYS.rbBgPos = POS_GRID.map(([v]) => v);
  for (const p of ['ai', 'us']) {
    Object.assign(PICK_KEYS, { [p + 'Style']: ['inline', 'backdrop', 'popout'], [p + 'Side']: POS_GRID.map(([v]) => v), [p + 'Fit']: ['cover', 'contain', 'original'], [p + 'Shape']: SHAPE_OPTS.map(([v]) => v), [p + 'RotateMode']: ['shape', 'both'], [p + 'Filter']: FILTER_OPTS.map(([v]) => v), [p + 'Texture']: TEXTURE_OPTS.map(([v]) => v) });
  }
  // Where an empty color starts from: SillyTavern's own value for the same thing.
  const COLOR_FROM = {
    rbBorder: '--reasoning-body-color', rbBtnColor: '--grey30', rbBtnText: '--SmartThemeBodyColor', rbBtnBorderColor: '--SmartThemeBodyColor', rbBoxColor: '--SmartThemeBlurTintColor', rbPatColor: '--SmartThemeQuoteColor', rbArrowColor: '--SmartThemeBodyColor',
    tfNameColor: '--SmartThemeBodyColor', tfPlateBg: '--SmartThemeQuoteColor', tfPlateBorder: '--SmartThemeBorderColor',
    tfUserMain: '--SmartThemeBodyColor', tfUserEm: '--SmartThemeEmColor', tfUserUnder: '--SmartThemeUnderlineColor', tfUserQuote: '--SmartThemeQuoteColor',
    tfAiMain: '--SmartThemeBodyColor', tfAiEm: '--SmartThemeEmColor', tfAiUnder: '--SmartThemeUnderlineColor', tfAiQuote: '--SmartThemeQuoteColor',
    tfNameFxColor: '--SmartThemeQuoteColor', tfUserFxColor: '--SmartThemeQuoteColor', tfAiFxColor: '--SmartThemeQuoteColor',
    ovScrollColor: '--grey7070a',
    ovPanelBgColor: '--SmartThemeChatTintColor', ovAiBgColor: '--SmartThemeBotMesBlurTintColor', ovUsBgColor: '--SmartThemeUserMesBlurTintColor', ovSendBgColor: '--SmartThemeBlurTintColor',
    ovPanelBorderColor: '--SmartThemeBorderColor', ovAiBorderColor: '--SmartThemeBorderColor', ovUsBorderColor: '--SmartThemeBorderColor', ovSendBorderColor: '--SmartThemeBorderColor',
    ovQrBgColor: '--grey30', ovQrBorderColor: '--SmartThemeBorderColor', ovQrText: '--SmartThemeBodyColor',
    mdColor: '--SmartThemeBodyColor', mdPill: '--SmartThemeBlurTintColor',
  };
  const FONT_KEYS = ['rbFont', 'tfNameFont', 'tfUserFont', 'tfAiFont', 'rdBookFont'];
  // Reader Mode's ink colors. They start from the built-in book's ink, not SillyTavern's own colors.
  const INK_KEYS = ['rdInk', 'rdInkEm', 'rdInkQuote'];

  function stColor(key) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(COLOR_FROM[key]).trim();
    return COLOR_RE.test(v) ? v : 'rgba(220, 220, 210, 1)';
  }

  // What look CSS reads from a setting: its tick, and while it's ticked its plain value (col: a color, or a pick like an
  // alignment), its font or its size.
  function cssReaders(s) {
    const on = (k) => s[k + 'On'];
    return {
      on,
      col: (k) => (on(k) ? s[k] : ''),
      font: (k) => { const f = on(k) ? cleanFont(s[k]) : ''; return f ? `"${f}", var(--mainFontFamily)` : ''; },
      size: (k) => (on(k) ? rangeNum(s, k) : 0),
    };
  }

  // Custom CSS for the reasoning button, box and arrow, each inside its part's selector. The three share one style tag,
  // and each other Custom CSS box has its own (see syncCustomCss in elements.js and syncAvatarCss in avatars.js), so a
  // typo can't break the extension's other styles.
  const RB_CSS = [['rbBtnCss', '.mes_reasoning_header'], ['rbCss', '.mes_reasoning'], ['rbArrowCss', '.mes_reasoning_details .mes_reasoning_arrow']];
  // The reasoning Custom CSS boxes that `get` gives text for, each inside its part's selector.
  const rbCssText = (get) => RB_CSS.map(([k, sel]) => {
    const c = (get(k) || '').trim();
    return c ? `${sel} { ${c} }` : '';
  }).filter(Boolean).join('\n');

  // Google Fonts load only for font boxes that are ticked and filled in. One link per font, so a name Google
  // doesn't have can't break the others; the browser then uses a font of that name on the device, if any.
  function syncGoogleFonts() {
    const s = settings();
    const want = new Set();
    const live = (k) => (k === 'rbFont' ? s.rbEnabled : k === 'rdBookFont' ? s.rdEnabled && !s.nodeEnabled && s.rdStyle === 'book' : s.tfEnabled) && s[k + 'On'];
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

  // ===== Data cleanup (card data, saved settings and themes) =====
  // Character cards get shared, so their NTR data is untrusted: every field is forced to the
  // type and range the extension expects before anything reads it. Unknown keys are dropped, so a new card field must be
  // added here or it won't load.
  const cleaned = new WeakSet();
  const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
  // Removes every key of `o` not in `keys`, in place: callers keep using the same object.
  const keepOnly = (o, keys) => { for (const k of Object.keys(o)) if (!keys.includes(k)) delete o[k]; return o; };
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
  // The Frame library's own folders: at most 50, each with at most 200 uploaded frames, short names and safe links.
  // The built-in folders aren't saved in it (see FRAME_SERIES).
  function cleanFrameLib(v) {
    const folders = [], ids = new Set();
    for (const f of isObj(v) && Array.isArray(v.folders) ? v.folders.slice(0, 50) : []) {
      const id = isObj(f) ? cRef(f.id) : '';
      if (!id || ids.has(id)) continue;
      ids.add(id);
      const frames = [];
      for (const fr of Array.isArray(f.frames) ? f.frames.slice(0, 200) : []) {
        const fid = isObj(fr) ? cRef(fr.id) : '', img = isObj(fr) ? cUrl(fr.img) : '';
        if (!fid || ids.has(fid) || !img || img.startsWith('data:')) continue;
        ids.add(fid);
        frames.push({ id: fid, name: cStr(fr.name, 60).trim() || 'Frame', img });
      }
      folders.push({ id, name: cStr(f.name, 60).trim() || 'Folder', frames });
    }
    const out = { folders };
    cleaned.add(out);
    return out;
  }
  // The settings a remembered Frame fit holds, in their saved order.
  const FRAME_FIT = ['FrameSize', 'FrameX', 'FrameY'];
  // Each side's remembered fits, by built-in frame or picture link: the FRAME_FIT values in their ranges.
  function cleanFrameFits(v) {
    const out = { ai: {}, us: {} };
    for (const p of ['ai', 'us']) {
      const m = isObj(v) && isObj(v[p]) ? v[p] : {};
      for (const k of Object.keys(m).slice(0, 300)) {
        if (k.length > 2048 || !Array.isArray(m[k]) || m[k].length !== FRAME_FIT.length) continue;
        out[p][k] = FRAME_FIT.map((n, i) => Math.round(cNum(m[k][i], DEFAULTS[p + n], NUM_RANGE[p + n][0], NUM_RANGE[p + n][1])));
      }
    }
    cleaned.add(out);
    return out;
  }
  // Menu Bar Icons' pictures, saved or from a theme file: ids that are plain CSS names, safe links, at most 40.
  const MB_ID = /^[A-Za-z][\w-]{0,63}$/;
  function cleanMbIcons(v) {
    const out = {};
    for (const id of isObj(v) ? Object.keys(v).filter((k) => MB_ID.test(k) && isObj(v[k])).slice(0, 40) : []) {
      const img = cUrl(v[id].img);
      if (img && !img.startsWith('data:video/')) out[id] = { img, mode: cPick(v[id].mode, ['tint', 'full']), name: cStr(v[id].name, 100).trim() };
    }
    cleaned.add(out);
    return out;
  }
  const cList = (v, max, fn) => (Array.isArray(v) ? v.filter(isObj).slice(0, max).map(fn) : []);
  const cNamed = (x, p) => ({ id: cId(x.id, p), name: cStr(x.name), url: cUrl(x.url) });

  // The banner's content: images, YouTube link and video. A card's banner has it, and so does the shared Global banner.
  function cleanBannerSrc(b) {
    if (!isObj(b)) b = {};
    cleaned.add(b);
    const images = cList(b.images, 200, (im) => ({ url: cUrl(im.url), pos: cardNum(im.pos, 'bannerPos', 45) })).filter((im) => im.url);
    return Object.assign(b, {
      images,
      idx: Math.round(cNum(b.idx, 0, 0, Math.max(0, images.length - 1))),
      youtubeUrl: cStr(b.youtubeUrl, 500),
      video: cUrl(b.video),
      videoPos: cardNum(b.videoPos, 'bannerVideoPos', 50),
    });
  }

  const defaultBanner = () => ({ images: [], idx: 0, locked: true, overlap: false, overlapOffset: 0, youtubeUrl: '', video: '', videoPos: 50, scope: 'global', mode: '', rotate: false, rotateSec: 8, rotateFx: 'fade', rotateOrder: 'order', height: null, gap: null, backdrop: null, videoSound: null });
  function cleanBanner(b) {
    cleanBannerSrc(b);
    Object.assign(b, {
      locked: cBool(b.locked, true),
      overlap: cBool(b.overlap, false),
      overlapOffset: cardNum(b.overlapOffset, 'bannerOffset', 0),
      scope: cPick(b.scope, ['global', 'char']),
      mode: cPick(b.mode, ['', 'image', 'youtube', 'video']),
      rotate: cBool(b.rotate, false),
      rotateSec: Math.round(cardNum(b.rotateSec, 'bannerRotateSec', DEFAULTS.bannerRotateSec)),
      rotateFx: cPick(b.rotateFx, ['fade', 'swap']),
      rotateOrder: cPick(b.rotateOrder, ['order', 'shuffle']),
      height: b.height == null ? null : Math.round(cardNum(b.height, 'bannerHeight', DEFAULTS.bannerHeight)),
      gap: b.gap == null ? null : Math.round(cardNum(b.gap, 'bannerGap', DEFAULTS.bannerGap)),
      backdrop: b.backdrop == null ? null : cPick(b.backdrop, ['wallpaper', 'panel']),
      videoSound: b.videoSound == null ? null : cBool(b.videoSound, false),
    });
    keepOnly(b, Object.keys(defaultBanner()));
  }
  // The shared Global banner has only the content fields.
  const cleanGlobalBanner = (b) => keepOnly(cleanBannerSrc(b), Object.keys(DEFAULTS.bannerGlobal));

  const FG_POS = ['Left', 'Center', 'Right'];
  const FG_DEF = () => ({ Left: '', Center: '', Right: '', LeftScale: 100, CenterScale: 100, RightScale: 100, LeftLayer: 'behind', CenterLayer: 'behind', RightLayer: 'behind',
    LeftX: 0, LeftY: 0, CenterX: 0, CenterY: 0, RightX: 0, RightY: 0 });

  function cleanFg(f) {
    for (const p of FG_POS) {
      f[p] = cUrl(f[p]);
      f[p + 'Scale'] = cardNum(f[p + 'Scale'], 'fgScale', 100);
      f[p + 'X'] = Math.round(cardNum(f[p + 'X'], 'fgX', 0));
      f[p + 'Y'] = Math.round(cardNum(f[p + 'Y'], 'fgY', 0));
      f[p + 'Layer'] = cPick(f[p + 'Layer'], ['behind', 'front']);
    }
    keepOnly(f, Object.keys(FG_DEF()));
  }

  function cleanVn(v) {
    keepOnly(v, [...Object.keys(VN_DEF()), 'emotions', 'emoDefault']);
    v.sprites = cUrlMap(v.sprites);
    const emo = Object.create(null);
    if (isObj(v.emoImgs)) for (const k of Object.keys(v.emoImgs).slice(0, 500)) if (k.length <= 200) emo[k] = cUrlMap(v.emoImgs[k]);
    v.emoImgs = emo;
    const names = (a) => (Array.isArray(a) ? a.filter((n) => typeof n === 'string' && n.trim()).slice(0, 200).map((n) => n.slice(0, 200)) : []);
    v.customSpk = names(v.customSpk);
    v.hiddenSpk = names(v.hiddenSpk);
    // This character's own emotion list (see emoSet), checked like a theme's. A list that doesn't pass is dropped, so
    // the character follows the template. Cleaned in place: the menu edits these objects.
    if (validEmotions(v.emotions)) {
      for (const e of v.emotions) { keepOnly(e, ['id', 'name']); e.name = e.name.trim(); }
      if (!v.emotions.some((e) => e.id === v.emoDefault)) v.emoDefault = v.emotions[0].id;
    } else { delete v.emotions; delete v.emoDefault; }
    v.locations = cList(v.locations, 500, (l) => cNamed(l, 'loc'));
    v.locDefault = cUrl(v.locDefault);
    v.cgs = cList(v.cgs, 500, (g) => cNamed(g, 'cg'));
    v.maps = cList(v.maps, 100, (m) => ({
      ...cNamed(m, 'map'),
      pins: cList(m.pins, 500, (p) => ({ id: cId(p.id, 'pin'), x: cNum(p.x, 0, 0, 1), y: cNum(p.y, 0, 0, 1), loc: cRef(p.loc), map: cRef(p.map) })),
    }));
    v.mapRoot = cRef(v.mapRoot);
    if ('opening' in v) {
      const o = isObj(v.opening) ? v.opening : {};
      v.opening = {
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
    r.folders = cList(r.folders, 100, (f) => ({
      id: cStr(f.id, 40) || newId('rxf'), name: cStr(f.name, 60) || 'Folder', ids: ids(f.ids), was: Array.isArray(f.was) ? ids(f.was) : null,
    }));
    keepOnly(r, ['folders']);
  }

  function cleanStore(st) {
    if (!isObj(st) || cleaned.has(st)) return st;
    cleaned.add(st);
    keepOnly(st, ['banner', 'fg', 'vn', 'regex']);
    for (const [k, fn] of [['banner', cleanBanner], ['fg', cleanFg], ['vn', cleanVn], ['regex', cleanRegex]]) {
      if (!(k in st)) continue;
      if (isObj(st[k])) fn(st[k]); else delete st[k];
    }
    return st;
  }

  // ===== Per-chat storage =====
  const cardSnap = new Map();
  const cardTimers = new Map();
  // Cards whose NTR data wasn't an object (broken cards). Their next save clears that first; see saveCard.
  const cardFix = new Set();

  const charByAvatar = (av) => ctx().characters.find((c) => c.avatar === av);

  function cardData(key) {
    if (!key) return null;
    const ch = charByAvatar(key);
    if (!ch || !ch.data) return null;
    if (!isObj(ch.data.extensions)) ch.data.extensions = {};
    let d = cleanStore(ch.data.extensions.ntr);
    if (!cardSnap.has(key)) cardSnap.set(key, isObj(d) ? JSON.stringify(d) : '');
    if (!isObj(d)) {
      if (d !== undefined) cardFix.add(key);
      d = {};
      ch.data.extensions.ntr = d;
    }
    return d;
  }

  // Uploaded files and links to other websites both count as content.
  const hasMediaRef = (o) => collectFileRefs(o).size > 0 || /"https?:\/\//i.test(JSON.stringify(o || {}));
  function cardIsEmpty(d) {
    const b = d.banner;
    const bannerEmpty = !b || (!(b.images || []).length && b.locked !== false && !b.overlap && !b.overlapOffset && !b.youtubeUrl && !b.video && b.scope !== 'char');
    const vn = d.vn || {};
    return bannerEmpty && !hasMediaRef(d.fg) && !hasMediaRef(vn) && !(vn.emotions || []).length && !(vn.customSpk || []).length && !(vn.hiddenSpk || []).length && !(vn.locations || []).length
      && !(vn.cgs || []).length && !(vn.maps || []).length && !(vn.opening && vn.opening.yt) && !(d.regex?.folders || []).length;
  }

  // Per-chat storage: the character card for single chats, the extension settings for groups.
  function store() {
    const c = ctx();
    const s = settings();
    if (c.groupId) return cleanStore(s.groupData[c.groupId] ||= {});
    const key = currentKey();
    if (!key) return null;
    return cardData(key) || cleanStore(s.charData[key] ||= {});
  }

  // The cards in the open chat: a group's members, or the open character. chatName is the group's or character's name.
  const chatGroup = (c) => c.groups.find((g) => g.id === c.groupId);
  function chatCards() {
    const c = ctx();
    if (c.groupId) return (chatGroup(c)?.members || []).map(charByAvatar).filter(Boolean);
    const ch = c.characters[c.characterId];
    return ch ? [ch] : [];
  }
  const chatName = () => { const c = ctx(); return (c.groupId ? chatGroup(c)?.name : c.name2) || ''; };

  // The open chat's emotions: its own list (in the card, or the group's), or the template (the global list) when it has
  // none or no chat is open.
  function emoSet() {
    const s = settings();
    const v = store()?.vn;
    if (v && Array.isArray(v.emotions)) return { emotions: v.emotions, emoDefault: v.emoDefault, own: true };
    return { emotions: s.emotions, emoDefault: s.emoDefault, own: false };
  }

  function fgData() {
    const st = store();
    return st ? (st.fg ||= FG_DEF()) : FG_DEF();
  }

  // The open chat's Visual Novel data, for cast.js and vn.js: speakers and their pictures, locations, CGs, maps and the
  // opening video. Missing parts are filled in; with no chat open, it's empty data that isn't kept.
  const VN_DEF = () => ({ sprites: Object.create(null), emoImgs: Object.create(null), customSpk: [], hiddenSpk: [],
    locations: [], locDefault: '', cgs: [], maps: [], mapRoot: '', opening: {} });
  function vnData() {
    const st = store();
    const def = VN_DEF();
    if (!st) return def;
    st.vn ||= {};
    for (const k of Object.keys(def)) if (st.vn[k] === undefined) st.vn[k] = def[k];
    return st.vn;
  }
  // Map pins lose a deleted location or map (`field` 'loc' or 'map', `id` its id), and go if they don't link the other either.
  function unlinkPins(v, field, id) {
    const other = field === 'loc' ? 'map' : 'loc';
    for (const mp of v.maps) mp.pins = mp.pins.filter((p) => p[field] !== id || p[other]).map((p) => (p[field] === id ? { ...p, [field]: '' } : p));
  }
  // A narrator tag's keyword and text, like "Enter: Mia": { kind, arg } from the `words` entry ([kind, settings key]) whose
  // keyword it uses, or null.
  function tagOf(inner, words, s) {
    const str = inner.trim();
    const i = str.indexOf(':');
    if (i <= 0) return null;
    const w = lc(str.slice(0, i));
    const kind = words.find(([, k]) => lc(s[k]) === w)?.[0];
    const arg = str.slice(i + 1).trim();
    return kind && arg ? { kind, arg } : null;
  }

  function scheduleCardFlush(key) {
    clearTimeout(cardTimers.get(key));
    cardTimers.set(key, setTimeout(() => { cardTimers.delete(key); flushCard(key); }, 700));
  }

  // SillyTavern merges a save into what the card holds, so a key that's gone from NTR data would stay in the card. Each
  // key removed since the last save goes as SillyTavern's "unset" value instead, which deletes it.
  function withUnsets(old, now, unset) {
    const out = { ...now };
    for (const k of Object.keys(old)) {
      if (now[k] === undefined) out[k] = unset;
      else if (isObj(old[k]) && isObj(now[k])) out[k] = withUnsets(old[k], now[k], unset);
    }
    return out;
  }

  // One save per card at a time, in order, so a slow save can't land after a newer one.
  const cardSaving = new Map();
  function flushCard(key) {
    const p = (cardSaving.get(key) || Promise.resolve()).then(() => saveCard(key));
    cardSaving.set(key, p);
    p.then(() => { if (cardSaving.get(key) === p) cardSaving.delete(key); });
    return p;
  }

  let cardSaveWarned = false;
  async function saveCard(key) {
    if (wiping) return;
    const c = ctx();
    const ch = charByAvatar(key);
    const d = ch?.data?.extensions?.ntr;
    if (!d) return;
    const json = JSON.stringify(d);
    const before = cardSnap.get(key) ?? '';
    if (json === before) return;
    if (before === '' && cardIsEmpty(d)) return;
    try {
      // Merging into NTR data that isn't an object drops the save. So a broken card's old value is cleared first,
      // through the bulk save. Clearing also drops it from memory, so it's put straight back.
      const unset = c.constants.unset;
      if (cardFix.has(key)) {
        const r = await c.writeExtensionFieldBulk([key], 'ntr', unset);
        ch.data.extensions.ntr = d;
        if (![...r.updated, ...r.skipped].includes(key)) throw new Error('Could not clear the old NTR data in the card');
        cardFix.delete(key);
      }
      // Saved here rather than with writeExtensionField, which doesn't say when the server turns a save down. Until a
      // save works, nothing counts as saved, so the next one sends it all again.
      const ntr = before ? withUnsets(JSON.parse(before), d, unset) : d;
      const res = await fetch('/api/characters/merge-attributes', {
        method: 'POST', headers: c.getRequestHeaders(), body: JSON.stringify({ avatar: key, data: { extensions: { ntr } } }),
      });
      if (!res.ok) throw new Error(`The server said ${res.status} ${res.statusText}`);
      cardSnap.set(key, json);
      cardSaveWarned = false;
      // The card's JSON copy (and the open character editor's) gets the same data, so saving the character in its editor
      // doesn't bring old NTR data back. The editor is checked now, after the save, in case another character was opened
      // meanwhile.
      const j = ch.json_data ? JSON.parse(ch.json_data) : null;
      if (isObj(j?.data)) {
        if (!isObj(j.data.extensions)) j.data.extensions = {};
        j.data.extensions.ntr = d;
        ch.json_data = JSON.stringify(j);
        const now = ctx();
        const box = document.getElementById('character_json_data');
        if (box && now.characters[now.characterId]?.avatar === key) box.value = ch.json_data;
      }
    } catch (e) {
      console.error('[NTR] Could not save character data to the card', e);
      if (!cardSaveWarned) {
        cardSaveWarned = true;
        toastr.error('Could not save NTR changes to the character card. Your next change tries again; reloading before then loses them.', 'NTR');
      }
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
  function filesInUse() {
    const set = collectFileRefs(settings());
    for (const ch of ctx().characters) collectFileRefs(ch?.data?.extensions?.ntr, set);
    return set;
  }

  // Only files this extension uploaded itself (see the upload name prefixes) can ever be deleted.
  const OWN_FILE = /^user\/files\/(?:banner|fg|ntr|theme|cursor|baricon|book|arrow|rbbg|plate|agent|vnpfp|vnloc|vncg|vnart|vnmap|vnlogo|vnop|avframe)_[\w-]+\.(?:png|jpe?g|gif|webp|mp4|webm)$/;
  // Resolves to true if the file was deleted or was already gone. Never throws.
  const deleteFile = (p) => fetch('/api/files/delete', { method: 'POST', headers: ctx().getRequestHeaders(), body: JSON.stringify({ path: p }) })
    .then((res) => res.ok || res.status === 404).catch(() => false);
  // Says why the file was kept: 'used', 'lazy', 'failed', or 'other' when it isn't NTR's upload. '' once it's deleted or already gone.
  async function deleteFileIfUnused(path) {
    const p = normFile(path);
    if (!p || !OWN_FILE.test(p)) return 'other';
    if (filesInUse().has(p)) return 'used';
    // With SillyTavern's lazy loading on, cards that haven't been opened yet aren't loaded, so their files can't be checked: keep the file.
    if (ctx().characters.some((c) => c.shallow)) return 'lazy';
    return (await deleteFile(p)) ? '' : 'failed';
  }

  // ===== Removing NTR data =====
  // `look`: settings and themes (the whole extension settings). `chars`: the NTR data in every character card, plus the
  // character and group chat copies kept in the settings. Files either one used go too, unless something
  // that stays still uses them. Cards that aren't loaded yet (lazy loading) are loaded first when `chars` is set;
  // without it, their files can't be checked, so no file is deleted.
  const CHAR_SETTINGS = ['chars', 'charData', 'groupData'];
  // Files a removal couldn't delete. Kept in SillyTavern's account storage, which outlives NTR's settings, so the
  // next removal tries them again.
  const LEFTOVER = 'ntr_leftover_files';
  const leftovers = () => { try { const v = JSON.parse(ctx().accountStorage.getItem(LEFTOVER) || '[]'); return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []; } catch { return []; } };
  async function removeData(opts) {
    wiping = true;
    for (const tm of cardTimers.values()) clearTimeout(tm);
    cardTimers.clear();
    // A card save already sent finishes first, so it can't put back what's removed. Saves still waiting don't run.
    await Promise.allSettled([...cardSaving.values()]);
    try {
      return await removeNow(opts);
    } catch (e) {
      // Removal didn't finish, so saving goes back on, and any card edit that was waiting to save gets saved.
      wiping = false;
      for (const key of cardSnap.keys()) scheduleCardFlush(key);
      throw e;
    }
  }
  // Resolves to how many files couldn't be deleted.
  async function removeNow({ look = false, chars = false } = {}) {
    const c = ctx();
    const s = settings();
    const gone = new Set(leftovers());
    let left = [];
    if (chars) {
      for (let i = 0; i < c.characters.length; i++) {
        if (c.characters[i]?.shallow) await c.unshallowCharacter(i);
      }
      const withData = c.characters.filter((ch) => ch?.data?.extensions?.ntr);
      for (const ch of withData) collectFileRefs(ch.data.extensions.ntr, gone);
      // A failed save doesn't throw; the card is in neither `updated` nor `skipped` (no NTR data on file, nothing to remove).
      const r = await c.writeExtensionFieldBulk(null, 'ntr', c.constants.unset);
      const done = new Set([...r.updated, ...r.skipped]);
      const missed = withData.filter((ch) => !done.has(ch.avatar)).length;
      if (missed) {
        throw new Error(`${missed} character card${missed === 1 ? '' : 's'} could not be saved, so removal didn't finish. Check the SillyTavern console.`);
      }
      // SillyTavern clears memory only for `updated`; unsaved data on a `skipped` card would put its files in `keep` below.
      for (const ch of withData) delete ch.data.extensions.ntr;
      for (const k of CHAR_SETTINGS) {
        collectFileRefs(s[k], gone);
        s[k] = structuredClone(DEFAULTS[k]);
      }
    }
    if (look) {
      collectFileRefs(s, gone);
      delete c.extensionSettings[MODULE];
    }
    const cs = c.characters;
    if (!cs.some((ch) => ch.shallow)) {
      const keep = look ? new Set() : collectFileRefs(s);
      for (const ch of cs) collectFileRefs(ch?.data?.extensions?.ntr, keep);
      const todo = [...gone].filter((p) => OWN_FILE.test(p) && !keep.has(p));
      const ok = await Promise.all(todo.map(deleteFile));
      left = todo.filter((_, i) => !ok[i]);
      if (left.length) c.accountStorage.setItem(LEFTOVER, JSON.stringify(left));
      else c.accountStorage.removeItem(LEFTOVER);
    }
    c.saveSettingsDebounced(); // the page reloads next, so `wiping` stays on until then
    return left.length;
  }

  // ===== Theme data and shared value helpers =====
  const PFP_KEYS = Object.keys(DEFAULTS).filter((k) => k.startsWith('ai') || k.startsWith('us'));
  // ov keys whose settings sit on other pages, so they go in those pages' theme sections.
  const LAYOUT_OV_KEYS = ['ovWidthOn', 'ovWidth', 'ovMesGapOn', 'ovMesGap', 'ovSendPosOn', 'ovSendPos', 'ovSendGap', 'ovNamesOn'];
  const ELEMENT_OV_KEYS = Object.keys(DEFAULTS).filter((k) => k.startsWith('ovScroll') || k.startsWith('ovCursor') || k.startsWith('ovQr'));
  const MOVED_OV_KEYS = [...FONT_SCALE_KEYS, ...LAYOUT_OV_KEYS, ...ELEMENT_OV_KEYS];
  // In menu order.
  const LOOK = {
    layout: { label: 'Layout', keys: [...Object.keys(DEFAULTS).filter((k) => k.startsWith('lay')), ...LAYOUT_OV_KEYS] },
    display: { label: 'UI Decor', keys: Object.keys(DEFAULTS).filter((k) => k.startsWith('ov') && !MOVED_OV_KEYS.includes(k)) },
    text: { label: 'Text Formatting', keys: [...Object.keys(DEFAULTS).filter((k) => k.startsWith('tf')), ...FONT_SCALE_KEYS] },
    pfp: { label: 'Avatar Management', keys: ['avatarEnabled', ...PFP_KEYS, 'emoStageScale', 'emoStageOpacity'] },
    reasoning: { label: 'Elements', keys: [...Object.keys(DEFAULTS).filter((k) => k.startsWith('rb') || k.startsWith('md') || k.startsWith('mb')), ...ELEMENT_OV_KEYS] },
    banner: { label: 'Banner Look (Height, Gap, Transparent Areas, Rotation)', keys: ['bannerHeight', 'bannerGap', 'bannerBackdrop', 'bannerRotate', 'bannerRotateSec', 'bannerRotateFx', 'bannerRotateOrder'] },
    bannerGlobal: { label: 'Global Banner (Pictures, YouTube Link, Video)', keys: ['bannerGlobal'] },
    fg: { label: 'Foreground Look (Opacity, Hide in Visual Novel)', keys: ['fgOpacity', 'fgHideVN'] },
    reader: { label: 'Reader Mode Look (Style, Book, Page Areas, Ink, Font, Page Flip)', keys: ['rdStyle', 'rdBook', 'rdBookImg', 'rdBookW', 'rdBookTop', 'rdBookBottom', 'rdBookOuter', 'rdBookSpine', ...INK_KEYS, 'rdBookFontOn', 'rdBookFont', 'rdFlip'] },
    vn: { label: 'Visual Novel (Box, Playback, Emotions, Tags, Default Art, Logo)', keys: ['nodeBoxWidth', 'nodeBoxMinH', 'nodeBoxMaxH', 'nodeBoxLift', 'nodeTextScale', 'nodeSprites', 'nodePortraitBox', 'nodeSpriteScale', 'nodeSpriteBase', 'nodeInject', 'locWord', 'nodeTypewriter', 'nodeSpeed', 'nodeAuto', 'nodeAutoDelay', 'nodeOpacity', 'nodePortrait', 'nodeShape', 'nodeUserMsgs', 'nodeHideEmo', 'emotions', 'emoDefault', 'delimSpkOpen', 'delimSpkClose', 'delimNarOpen', 'delimNarClose', 'delimEmo', 'narratorWord', 'emoWord',
      'nodeSplitUntagged', 'nodeChoices', 'choiceSend', 'choiceWord', 'choiceSep', 'nodeEffects', 'effectWord', 'fxShake', 'fxFlash', 'fxFade',
      'weatherWord', 'wxRain', 'wxSnow', 'wxClear', 'nodeCG', 'nodeAutoSpk', 'cgWord', 'enterWord', 'exitWord', 'artBg', 'artBgImg', 'artSprite', 'artSpriteImg',
      'opLead', 'opFade', 'opSize', 'opPos', 'opExit', 'opTrans', 'opTransColor', 'opTransMs', 'opEarly', 'nodeMaps', 'mapGoText'] },
  };
  const newId = (p) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  // Saves `obj` as a JSON file: <name><ext>, named <kind> if `name` has no letters or numbers.
  function downloadJson(obj, name, kind, ext = `.ntr-${kind}.json`) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' }));
    a.download = `${name.replace(/[^\w\- ]+/g, '').trim() || kind}${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  // A name test, also freeName's `taken`: an item in `list` other than `self` has the name, whatever the capitals.
  const nameTaken = (list, self = null) => (n) => list.some((x) => x !== self && x.name.toLowerCase() === n.toLowerCase());
  // An askText check for a name no other item in `list` has. It's cut to 60 characters first, so the name checked is the
  // one saved.
  const uniqueName = (list, self, what) => (v) => {
    const name = v.slice(0, 60).trim();
    return !name ? { error: 'Type a name first.' } : nameTaken(list, self)(name) ? { error: `A ${what} with that name already exists.` } : { value: name };
  };
  // `base`, or "base (2)", "(3)" and so on, the first one `taken` says is free, cut to `max` characters with its number kept.
  function freeName(base, taken, max = Infinity) {
    let name = base;
    for (let n = 2; taken(name); n++) name = `${base.slice(0, max - String(n).length - 3)} (${n})`;
    return name;
  }

  function lookSnapshot() {
    const s = settings();
    const out = {};
    for (const sec of Object.keys(LOOK)) {
      out[sec] = {};
      for (const k of LOOK[sec].keys) out[sec][k] = structuredClone(s[k]);
    }
    return out;
  }

  // The tag symbols and keywords Visual Novel Mode and emotions read. They only work together, so they're checked together:
  // by Apply in the menu's Tags & Delimiters (cast.js) and when a theme is imported or applied.
  const TAG_KEYS = ['delimSpkOpen', 'delimSpkClose', 'delimNarOpen', 'delimNarClose', 'delimEmo', 'narratorWord', 'emoWord', 'locWord',
    'choiceWord', 'choiceSep', 'effectWord', 'weatherWord', 'cgWord', 'enterWord', 'exitWord', 'fxShake', 'fxFlash', 'fxFade', 'wxRain', 'wxSnow', 'wxClear'];
  function validateDelims(d) {
    const errs = [], warns = [];
    if (TAG_KEYS.some((k) => !d[k])) errs.push('Every field needs a value.');
    const delims = [d.delimSpkOpen, d.delimSpkClose, d.delimNarOpen, d.delimNarClose];
    const distinct = (arr) => { const a = arr.filter(Boolean).map(lc); return new Set(a).size === a.length; };
    if (!distinct([d.narratorWord, d.emoWord, d.locWord, d.choiceWord, d.effectWord, d.weatherWord, d.cgWord, d.enterWord, d.exitWord])) errs.push('The narrator, emotion, location, choice, effect, weather, CG, enter and exit keywords all need to be different.');
    if (!distinct([d.fxShake, d.fxFlash, d.fxFade])) errs.push('The three effect names need to be different.');
    if (!distinct([d.wxRain, d.wxSnow, d.wxClear])) errs.push('The three weather names need to be different.');
    if ([d.emoWord, d.locWord, d.choiceWord, d.effectWord, d.weatherWord, d.cgWord, d.enterWord, d.exitWord].some((w) => w && w.includes(':'))) errs.push('Tag keywords can\'t contain a colon.');
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
  const IMG_KEYS = new Set(['artBgImg', 'artSpriteImg', 'ovCursorImg', 'ovCursorPtrImg', 'ovCursorTextImg', 'ovCursorDownImg', 'rdBookImg', 'rbArrowImg', 'rbBgImg', 'tfPlateImg', 'aiFrameImg', 'usFrameImg']);
  // Theme files come from other people, so each number is kept to the range of its slider in the menu. Pop-out and
  // foreground offsets go wider because dragging the picture can take them past the slider.
  // Entries, [min, max, step, unit], are the only copy: their sliders and code read them from here.
  // A fifth and sixth number, [..., sliderMin, sliderMax], narrow the slider only (the pop-out and foreground offsets).
  const NUM_RANGE = {
    agTemp: [0, 2, 0.05, ''], agTopP: [0, 1, 0.01, ''], agTopK: [0, 200, 1, ''], agMinP: [0, 1, 0.01, ''], agFreq: [-2, 2, 0.05, ''], agPres: [-2, 2, 0.05, ''], agRep: [1, 2, 0.01, ''],
    agMaxTokens: [50, 100000, 1, ' tokens'], agContext: [1, 999999, 1, ' messages'], agEvery: [1, 100, 1, ' messages'], agMsgNum: [0, 999999, 1, ''], agSendDepth: [0, 50, 1, ''],
    agFieldNum: [-1000000, 1000000, 1, ''], agFieldStep: [0, 1000000, 1, ''], agFieldCap: [1, 50, 1, ''],
    rdBookW: [40, 100, 1, '%'], rdBookTop: [0, 30, 0.5, '%'], rdBookBottom: [0, 30, 0.5, '%'], rdBookOuter: [0, 30, 0.5, '%'], rdBookSpine: [0, 40, 0.5, '%'],
    bannerHeight: [60, 350, 5, 'px'], bannerGap: [0, 40, 1, 'px'], bannerRotateSec: [3, 60, 1, 's'], fgOpacity: [0, 100, 1, '%'], placeGrid: [4, 100, 1, 'px'],
    rbSat: [0, 100, 1, '%'], rbBtnOpacity: [0, 100, 1, '%'], rbBoxOpacity: [0, 100, 1, '%'], rbPatThick: [1, 8, 1, 'px'], rbPatSize: [0.5, 3, 0.05, 'x'], rbPatFadeReach: [1, 20, 0.5, ' lines'], rbPatFadeSoft: [0, 100, 1, '%'], rbEdgeFxSize: [2, 30, 1, 'px'], rbBtnFxSize: [2, 30, 1, 'px'], rbArrowSize: [0.5, 3, 0.05, 'x'], rbBgTile: [16, 512, 1, 'px'], rbBgOpacity: [0, 100, 1, '%'], rbBgTint: [0, 100, 1, '%'], ovFont: [0.5, 2, 0.05, 'x'], tfNameSize: [0.5, 2, 0.05, 'x'], tfPlateBorderWidth: [1, 6, 1, 'px'], tfPlateRound: [0, 30, 1, 'px'], tfUserSize: [0.5, 2, 0.05, 'x'], tfAiSize: [0.5, 2, 0.05, 'x'],
    ovWidth: [25, 100, 1, 'vw'], ovBlur: [0, 30, 1, ''], ovShadow: [0, 5, 1, ''], ovCursorSize: [16, 128, 1, 'px'],
    ovRound: [1, 30, 1, 'px'], ovMesGap: [0, 40, 1, 'px'], ovSendGap: [0, 40, 1, 'px'], ovBubWidth: [40, 100, 1, '%'],
    ovQrSize: [0.5, 2, 0.05, 'x'], ovQrGap: [0, 20, 1, 'px'], ovQrOpacity: [10, 100, 1, '%'],
    mdSize: [0.5, 2, 0.05, 'x'], mdOpacity: [10, 100, 5, '%'],
    nodeSpeed: [5, 80, 1, 'ms'], nodeAutoDelay: [500, 8000, 250, 'ms'], nodeOpacity: [30, 100, 1, '%'], nodePortrait: [60, 240, 5, 'px'],
    nodeBoxWidth: [40, 100, 1, '%'], nodeBoxMinH: [40, 300, 5, 'px'], nodeBoxMaxH: [10, 70, 1, 'vh'], nodeBoxLift: [0, 400, 2, 'px'],
    nodeTextScale: [70, 180, 5, '%'], nodeSpriteScale: [30, 200, 5, '%'],
    emoStageScale: [30, 200, 5, '%'], emoStageOpacity: [10, 100, 5, '%'],
    opLead: [0, 15, 0.5, ' s'], opFade: [100, 4000, 100, ' s'], opSize: [10, 100, 1, '%'], opTransMs: [100, 10000, 100, ' s'],
    // Pinned Blocks' places, kept in each block (see cleanPins).
    pinX: [0, 100, 0.01, '%'], pinY: [0, 100, 0.01, '%'], pinW: [5, 100, 0.01, '%'], pinH: [5, 100, 0.01, '%'],
    // Saved in card data (and the shared Global banner), not as settings keys (see cardNum).
    fgScale: [10, 300, 5, '%'], fgX: [-10000, 10000, 5, 'px', -1500, 1500], fgY: [-10000, 10000, 5, 'px', -1500, 1500], bannerPos: [0, 100, 1, '%'], bannerVideoPos: [0, 100, 1, '%'], bannerOffset: [0, 300, 5, 'px'],
  };
  for (const p of FX_PARTS) NUM_RANGE[p + 'FxStr'] = [1, 10, 1, ''];
  for (const phone of [false, true]) {
    const r = (name, min) => { NUM_RANGE[lk(phone, name)] = [min, 100, 0.01, '%']; };
    for (const name of ['BarPos', 'ChatX', 'ChatY', 'SendX', 'SendB', 'PageX', 'PageB', 'BanX', 'BanY']) r(name, 0);
    for (const name of ['BarLen', 'BanH']) r(name, 5);
    for (const name of ['ChatW', 'ChatH', 'SendW', 'PageW', 'BanW']) r(name, 10);
  }
  for (const p of ['Panel', ...BOX_PARTS]) {
    Object.assign(NUM_RANGE, { [`ov${p}BgOpacity`]: [0, 100, 1, '%'], [`ov${p}BorderWidth`]: [1, 6, 1, 'px'], [`ov${p}BorderOpacity`]: [0, 100, 1, '%'] });
    if (p !== 'Panel') NUM_RANGE[`ov${p}Round`] = NUM_RANGE.ovRound;
  }
  for (const p of ['ai', 'us']) {
    Object.assign(NUM_RANGE, {
      [p + 'Scale']: [10, 300, 5, '%'], [p + 'Corner']: [0, 25, 1, '%'], [p + 'Focus']: [0, 100, 1, '%'], [p + 'ShiftX']: [0, 100, 1, '%'], [p + 'Zoom']: [100, 200, 5, '%'], [p + 'Rotate']: [-180, 180, 1, '°'], [p + 'Pad']: [0, 400, 5, 'px'],
      [p + 'FilterStr']: [0, 100, 1, '%'], [p + 'TextureStr']: [0, 100, 1, '%'],
      [p + 'FrameSize']: [100, 300, 1, '%'], [p + 'FrameX']: [-50, 50, 1, '%'], [p + 'FrameY']: [-50, 50, 1, '%'],
      [p + 'PopX']: [-10000, 10000, 5, 'px', -1500, 1500], [p + 'PopY']: [-10000, 10000, 5, 'px', -1500, 1500],
    });
    for (const f of ['Top', 'Bot', 'Left', 'Right', 'TL', 'TR', 'BL', 'BR', 'Str']) NUM_RANGE[`${p}Fade${f}`] = [0, 100, 1, '%'];
  }
  // A number setting kept to its range, or its default if it isn't a number.
  const rangeNum = (s, k) => cNum(s[k], DEFAULTS[k], NUM_RANGE[k][0], NUM_RANGE[k][1]);
  // A slider whose range, step and unit come from NUM_RANGE.
  // cls other than m_o_sl skips bindRows, for a module that binds its own sliders.
  const rangeSlider = (s, k, cls = 'm_o_sl', scale = 0) => { const [min, max, step, unit, smin = min, smax = max] = NUM_RANGE[k]; return ovSlider(s, k, unit, smin, smax, step, cls, scale); };
  // The min, max and step of a slider written out by hand, from NUM_RANGE.
  const rangeAttrs = (k) => { const [min, max, step, , smin = min, smax = max] = NUM_RANGE[k]; return `min="${smin}" max="${smax}" step="${step}"`; };
  // A number from card data kept to its NUM_RANGE entry, or the fallback if it isn't a number.
  const cardNum = (v, k, d) => cNum(v, d, NUM_RANGE[k][0], NUM_RANGE[k][1]);
  // The longest text a theme may hold, the same as the menu's text boxes. Tag symbols and keywords allow 16.
  const STR_MAX = { rbThink: 100, rbDone: 100, rbSome: 100, rbArrowSym: 16, rbCss: 2000, rbBtnCss: 2000, rbArrowCss: 2000, ovScrollCss: 2000, ovCursorCss: 2000, ovQrCss: 2000, aiCss: 2000, usCss: 2000, mapGoText: 200 };
  const strMax = (k) => STR_MAX[k] ?? (TAG_KEYS.includes(k) ? 16 : 200);
  // The most emotions a list holds, and the longest emotion name.
  const EMO_LIMITS = { count: 100, name: 100 };
  // An emotion list cut down to what validEmotions takes: good ids, no repeats, within EMO_LIMITS.
  function fixEmotions(v) {
    const ids = new Set(), names = new Set();
    const out = (Array.isArray(v) ? v : []).filter(isObj)
      .map((e) => ({ id: cRef(e.id), name: typeof e.name === 'string' ? e.name.trim().slice(0, EMO_LIMITS.name) : '' }))
      .filter((e) => e.id && e.name && !ids.has(e.id) && !names.has(e.name.toLowerCase()) && ids.add(e.id) && names.add(e.name.toLowerCase()))
      .slice(0, EMO_LIMITS.count);
    return out.length ? out : structuredClone(DEFAULTS.emotions);
  }
  function validEmotions(v) {
    if (!Array.isArray(v) || !v.length || v.length > EMO_LIMITS.count) return false;
    const ids = new Set(), names = new Set();
    for (const e of v) {
      const name = e && typeof e.name === 'string' ? e.name.trim().toLowerCase() : '';
      if (!e || !cRef(e.id) || !name || e.name.length > EMO_LIMITS.name || ids.has(e.id) || names.has(name)) return false;
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
    if (k === 'ovScrollTrack' || k === 'ovQrHover' || INK_KEYS.includes(k)) return typeof v === 'string' && COLOR_RE.test(v);
    if (FONT_KEYS.includes(k)) return typeof v === 'string' && FONT_RE.test(v);
    if (PICK_KEYS[k]) return PICK_KEYS[k].includes(v);
    if (k === 'bannerGlobal' || k === 'mbIcons') return isObj(v);
    if (k === 'layPins') return Array.isArray(v);
    if (MD_KEYS.includes(k)) return Array.isArray(v) && v.every((i) => MD_ITEM_IDS.includes(i));
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
    if (NUM_RANGE[k]) return cardNum(v, k);
    if (k === 'emotions') return v.map((e) => ({ id: e.id, name: e.name.trim() }));
    if (k === 'layPins') return cleanPins(v);
    if (k === 'mbIcons') return cleanMbIcons(v);
    if (MD_KEYS.includes(k)) return MD_ITEM_IDS.filter((i) => v.includes(i));
    if (TAG_KEYS.includes(k)) return v.trim(); // as the menu's Apply saves them
    return structuredClone(v);
  }

  function cleanLookSection(sec, part) {
    const out = {};
    if (!part || typeof part !== 'object') return out;
    for (const k of LOOK[sec].keys) {
      const v = k in part ? lookValue(k, part[k]) : undefined;
      if (v !== undefined) out[k] = v;
    }
    // The Global banner's images and links get the same checks as a card's banner.
    if (out.bannerGlobal) out.bannerGlobal = cleanGlobalBanner(out.bannerGlobal);
    // Tag symbols and keywords must pass the menu's Apply check, with the user's own filling in any the theme doesn't have.
    // If they clash, all of them are left out and the user's own stay.
    if (sec === 'vn' && TAG_KEYS.some((k) => k in out)) {
      const s = settings();
      if (validateDelims(Object.fromEntries(TAG_KEYS.map((k) => [k, k in out ? out[k] : s[k]]))).errs.length) for (const k of TAG_KEYS) delete out[k];
    }
    return out;
  }

  function refreshVisuals() {
    renderAll();
    window.NTR.vn?.refresh();
    window.NTR.cast?.refresh();
  }

  // Changes the look settings with `write`, then brings everything up to date and deletes the files the old look used
  // that nothing uses now.
  function setLook(write) {
    const s = settings();
    const before = collectFileRefs(lookSnapshot());
    write(s);
    loadSettings(s);
    save();
    refreshVisuals();
    before.forEach((p) => deleteFileIfUnused(p));
  }

  // ===== The menu and its floating, dockable panel =====
  function openCombinedModal() {
    const old = document.getElementById('cb_modal_overlay');
    const prevScroll = old?.querySelector('.ntr_body')?.scrollTop || 0;
    cancelAsks(old);
    old?.remove();
    const s = settings();

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
        ${isOn() ? '' : '<div class="ntr_offnote"><i class="fa-solid fa-power-off"></i> The extension is switched off. To turn it back on, open its bar on the Extensions page and press Switch on.</div>'}
        <div class="ntr_main">
        <nav class="ntr_nav">${navHtml(s.uiPage)}</nav>
        <div class="ntr_shade"></div>
        <div class="ntr_body">

        ${themesSectionHtml(s)}
        ${lookPageHtml('layout', s)}

        ${overlaysSectionHtml(s)}

        ${lookPageHtml('avatars', s)}

        ${lookPageHtml('elements', s)}
        ${lookPageHtml('text', s)}
        ${lookPageHtml('decor', s)}
        ${agentsSectionHtml(s)}

        ${regexSectionHtml(s)}
        ${readerSectionHtml(s)}
        </div>
        </div>
      </div>
      <div id="ntr_edge" title="Drag to resize"></div>
      <div id="ntr_preview"></div>`;

    document.body.appendChild(overlay);
    // SillyTavern checks every input event that reaches the page against its own handlers, which cost more than NTR's
    // own work while a slider is dragged. None of them are for the menu, so its input events stop here, and the
    // document's slider listener never sees them.
    overlay.addEventListener('input', (e) => {
      e.stopPropagation();
      showRange(e);
    });

    bindCollapses(overlay, s);
    // The banner's rotation waits while the Overlays page is open (see overlays.js).
    const rotRestart = () => window.NTR.overlays?.rotRestart(s);
    bindPages(overlay, s, rotRestart);

    setupPanel(overlay, prevScroll);

    const close = () => { cancelAsks(overlay); overlay.remove(); callModule('avatars', 'syncPopouts'); rotRestart(); };
    overlay.querySelector('.cb_close_btn').onclick = close;

    callModule('overlays', 'bind', overlay, s);

    callModule('themes', 'bind', overlay, s);
    callModule('layout', 'bind', overlay, s);
    bindWand(overlay, s);
    bindVNSection(overlay, s);
    bindReader(overlay, s);
    bindRegexPage(overlay, s);
    callModule('agents', 'bind', overlay, s);
    callModule('cast', 'bind', overlay, s);
    bindRows(overlay, s);
    callModule('decor', 'bind', overlay, s);
    callModule('text', 'bind', overlay, s);
    callModule('elements', 'bind', overlay, s);

    callModule('avatars', 'bind', overlay, s);
    // The font boxes' list (fonts.js), added to this draw once it has loaded, unless the menu was closed or drawn again.
    loadModule('fonts').then((m) => overlay.isConnected && m?.bind(overlay));
  }

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const isNarrow = () => window.innerWidth < 700;
  const panelW = (w) => clamp(w, 320, Math.round(window.innerWidth * 0.9));

  function panelLayout(overlay) {
    const content = overlay.querySelector('.cb_popup_content');
    const edge = overlay.querySelector('#ntr_edge');
    const P = settings().uiPanel;
    const narrow = isNarrow();
    content.classList.remove('ntr_dock_left', 'ntr_dock_right', 'ntr_float', 'ntr_sheet');
    Object.assign(content.style, { left: '', right: '', top: '', bottom: '', width: '', height: '' });
    edge.style.display = 'none';
    overlay.querySelectorAll('.ntr_dockbtn').forEach((b) => {
      b.style.display = narrow ? 'none' : '';
      b.classList.toggle('on', b.dataset.dock === P.dock);
    });
    if (narrow) { content.classList.add('ntr_sheet'); syncCompact(content); return; }
    if (P.dock === 'left' || P.dock === 'right') {
      const w = panelW(P.w);
      content.classList.add('ntr_dock_' + P.dock);
      content.style.width = w + 'px';
      edge.style.display = 'block';
      edge.style.left = (P.dock === 'right' ? window.innerWidth - w - 4 : w - 4) + 'px';
    } else {
      const w = panelW(P.fw);
      const h = clamp(P.fh || Math.round(window.innerHeight * 0.75), 240, window.innerHeight);
      const x = clamp(P.x ?? Math.round((window.innerWidth - w) / 2), 80 - w, window.innerWidth - 80);
      const y = clamp(P.y ?? 60, 0, window.innerHeight - 50);
      content.classList.add('ntr_float');
      Object.assign(content.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
    }
    // The size set here, so setupPanel saves only a size the user dragged the panel to.
    content.ntrSetSize = content.style.width + 'x' + content.style.height;
    syncCompact(content);
  }

  // On a phone or in a narrow panel, the icon column hides behind the menu button in the title bar.
  function syncCompact(content) {
    const compact = isNarrow() || content.getBoundingClientRect().width < 400;
    const wasCompact = content.classList.contains('ntr_compact');
    content.classList.toggle('ntr_compact', compact);
    // The icon column hides at once on switching to compact; opening and closing it later still slide.
    if (compact && !wasCompact) content.querySelector('.ntr_nav').getAnimations().forEach((a) => a.finish());
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
        w = panelW(P.fw);
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
          const pw = panelW(P.w);
          Object.assign(preview.style, { display: 'block', width: pw + 'px', left: zone === 'left' ? '0px' : (window.innerWidth - pw) + 'px' });
        } else preview.style.display = 'none';
      };
      const up = () => {
        dragEnded(move, up);
        preview.style.display = 'none';
        if (zone) P.dock = zone;
        else { P.dock = 'float'; P.x = parseFloat(content.style.left) || 0; P.y = parseFloat(content.style.top) || 0; }
        save();
        panelLayout(overlay);
      };
      dragEnds(move, up);
    });

    edge.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const move = (ev) => {
        const w = P.dock === 'right' ? window.innerWidth - ev.clientX : ev.clientX;
        P.w = panelW(Math.round(w));
        panelLayout(overlay);
      };
      const up = () => {
        dragEnded(move, up);
        save();
      };
      dragEnds(move, up);
    });

    // Closing, hiding or a smaller window also changes the panel's size; only the user's own resize is saved.
    let t = null;
    const ro = new ResizeObserver(() => {
      if (!content.isConnected) { ro.disconnect(); clearTimeout(t); return; }
      syncCompact(content);
      if (P.dock !== 'float' || !content.classList.contains('ntr_float')) return;
      if (content.style.width + 'x' + content.style.height === content.ntrSetSize) return;
      clearTimeout(t);
      t = setTimeout(() => {
        if (!content.isConnected || !content.offsetWidth) return;
        P.fw = Math.round(content.offsetWidth); P.fh = Math.round(content.offsetHeight); save();
      }, 300);
    });
    ro.observe(content);
  }

  // ===== Module loader and module pages =====
  // Each module registers itself as window.NTR[name]. A failed module never breaks the core.
  const MOD_LABEL = { vn: 'Visual Novel Mode', map: 'Maps', opening: 'Opening Video', overlays: 'Overlays', regex: 'Regexes', reader: 'Reader Mode', agents: 'Agents', cast: 'Emotions', elements: 'Elements', text: 'Text Formatting', avatars: 'Avatar Management', decor: 'UI Decor', layout: 'Layout', fonts: 'Font List', themes: 'Themes' };
  const modPromise = {}, modError = {}, modRetries = {};
  function loadModule(name, retry = false) {
    if (window.NTR[name]) return Promise.resolve(window.NTR[name]);
    // A retry counts as loading again, so the menu marks its part to fill in and every draw shares this one load.
    // It asks at a new address: Chrome remembers a failed import by its address until the page reloads.
    if (retry && modError[name]) { modPromise[name] = null; modError[name] = ''; modRetries[name] = (modRetries[name] || 0) + 1; }
    if (!modPromise[name]) {
      const label = MOD_LABEL[name] || name;
      modPromise[name] = import(`${NTR_BASE}${name}.js?v=${VERSION}${modRetries[name] ? '&retry=' + modRetries[name] : ''}`)
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
  // vn.js draws the speakers' pictures from cast.js, so cast.js loads first. Without it, Visual Novel Mode fails too.
  const loadVN = () => loadModule('cast', true).then((c) => {
    if (c) return loadModule('vn', true);
    modError.vn = 'Emotions didn\'t load: ' + modError.cast;
    return null;
  });

  // A module that arrives after the menu was drawn fills in only its own page or part: the element marked
  // data-ntr-wait with its name, drawn again by `draw`. Redrawing the whole menu would close a question being answered,
  // like a theme's name, and bring the menu back over Edit Layout. With `head`, the heading just before the mark goes
  // too, since `draw` brings its own. It fills in the menu showing now; nothing happens if that menu has no mark left,
  // because it was closed or drawn after the module arrived.
  function fillIn(name, draw, bind, { head = false } = {}) {
    const overlay = document.getElementById('cb_modal_overlay');
    const mark = overlay?.querySelector(`[data-ntr-wait="${name}"]`);
    if (!mark) return;
    const s = settings();
    try {
      const t = document.createElement('template');
      t.innerHTML = draw(s).trim();
      // Its folds are bound before it goes in, so the menu's other folds don't get a second click handler.
      bindCollapses(t.content, s);
      if (head) mark.previousElementSibling?.remove();
      mark.replaceWith(t.content);
      // Bound once it's in the menu: Agents, Emotions and Regexes draw their lists only into a page that's on screen.
      bind(overlay, s);
    } catch (e) {
      console.error(`[NTR] ${MOD_LABEL[name] || name} menu crashed`, e);
    }
    syncPageOff(overlay);
  }
  // Some look pages live in their own files, like Elements in elements.js. These load before NTR starts (see
  // loadLookModules). This lists each one's file name and the menu page it draws. Each call into one is guarded, so a
  // failure there leaves the rest of NTR running with SillyTavern's look for those parts. So is each menu call into the
  // modules that load later (Themes, Agents, Overlays, Emotions, Regexes and Visual Novel's settings): one that breaks
  // while drawing or binding leaves the rest of the menu working, and so is each call Visual Novel Mode makes into Maps and
  // Opening Video, and Opening Video into Visual Novel Mode. callModule logs a failure once per module and kind of call,
  // since css and sync run on every restyle.
  const LOOK_MODULES = { elements: 'elements', text: 'text', avatars: 'pfp', decor: 'display', layout: 'layout' };
  const callFailed = new Set();
  function callModule(name, fn, ...args) {
    const m = window.NTR[name];
    if (!m) return undefined;
    try {
      return m[fn](...args);
    } catch (e) {
      const k = `${name}.${fn}`;
      if (!callFailed.has(k)) { callFailed.add(k); console.error(`[NTR] ${MOD_LABEL[name]}: ${fn} failed`, e); }
      return undefined;
    }
  }
  const bindOf = (name) => (overlay, s) => callModule(name, 'bind', overlay, s);
  // Whether a page or part waits for module `name`: it isn't there and hasn't failed to load.
  const waiting = (name) => !window.NTR[name] && !modError[name];
  // What a module's page or part says when the module doesn't draw it: it failed to load, it broke while drawing, or
  // `loading`.
  const moduleNote = (name, loading) => (modError[name] ? `${MOD_LABEL[name]} failed to load: ` + escapeHTML(modError[name])
    : window.NTR[name] ? `${MOD_LABEL[name]} couldn't be drawn. The browser console has the details.` : loading);
  // A look module's page, or a note saying why it isn't there. Without avatars.js, Avatar Management keeps
  // Emotions (cast.js).
  function lookPageHtml(name, s) {
    const html = callModule(name, 'sectionHtml', s);
    if (html !== undefined) return html;
    const msg = moduleNote(name, `Loading ${MOD_LABEL[name]}.`);
    return pageHtml(LOOK_MODULES[name], name === 'avatars' ? castPartHtml() : '', { note: `<div class="cb_hint ntr_pnote">${msg}</div>` });
  }
  // Waits for the look modules, side by side and at most 5 seconds in all. SillyTavern waits for them behind its loading
  // screen, this wait included, so their styles are there from the first draw. One that takes longer arrives after NTR
  // starts and restyles then. An open menu only gets that page's note changed: redrawing it would close a question
  // being answered, like a theme's name, and bring the menu back over Edit Layout.
  async function loadLookModules() {
    const loads = Object.keys(LOOK_MODULES).map((name) => [name, loadModule(name)]);
    const done = new Set();
    for (const [name, load] of loads) load.then(() => done.add(name));
    let timer;
    const inTime = await Promise.race([Promise.all(loads.map(([, load]) => load)).then(() => true), new Promise((res) => { timer = setTimeout(res, 5000, false); })]);
    clearTimeout(timer);
    if (inTime) return;
    for (const [name, load] of loads) {
      if (done.has(name)) continue;
      load.then((m) => {
        if (m) updateAvatarStyle();
        const label = MOD_LABEL[name];
        const note = document.querySelector(`#cb_modal_overlay .ntr_page[data-page="${LOOK_MODULES[name]}"] .ntr_pnote`);
        if (note) note.textContent = m ? `${label} is ready. Close and open the menu to use it.` : `${label} failed to load: ` + modError[name];
      });
    }
  }

  // A whole menu page from module `name`, or a note while it loads, after it failed, or when it broke while drawing.
  // `draw` is the caller, drawn again with `bind` when the module arrives; the other options go to pageHtml.
  function modulePageHtml(s, name, page, draw, loading, { bind = bindOf(name), ...opts } = {}) {
    const html = callModule(name, 'sectionHtml', s);
    if (html !== undefined) return html;
    const wait = waiting(name);
    if (wait) loadModule(name).then(() => fillIn(name, draw, bind));
    return pageHtml(page, '', { ...opts, note: `<div class="cb_hint ntr_pnote">${moduleNote(name, loading)}</div>`, wait: wait ? name : '' });
  }

  // The Themes page comes from themes.js, loaded at start.
  const themesSectionHtml = (s) => modulePageHtml(s, 'themes', 'themes', themesSectionHtml, 'Loading your themes.');

  // The Agents page comes from agents.js, loaded the first time the menu opens (and at start when the page is on).
  const agentsSectionHtml = (s) => modulePageHtml(s, 'agents', 'agents', agentsSectionHtml, 'Loading your agents.');

  // The Emotions part of the Avatars page comes from cast.js, loaded at start while NTR is on, or else the first time the
  // menu opens.
  function castPartHtml() {
    const html = callModule('cast', 'partHtml', settings());
    if (html !== undefined) return html;
    const wait = waiting('cast');
    if (wait) loadModule('cast').then(() => fillIn('cast', castPartHtml, bindOf('cast')));
    return `<div class="cb_hint ntr_keepon"${wait ? ' data-ntr-wait="cast"' : ''}>${moduleNote('cast', 'Loading emotions.')}</div>`;
  }

  // The Overlays page comes from overlays.js, loaded the first time the menu opens if a banner or foreground image
  // hasn't loaded it already.
  const overlaysSectionHtml = (s) => modulePageHtml(s, 'overlays', 'fg', overlaysSectionHtml, 'Loading the banner and foreground images.', { legend: true });

  // The Regexes page comes from regex.js, loaded the first time the menu opens.
  function regexSectionHtml(s) {
    if (!s.rxEnabled) {
      return pageHtml('regex', '', { sw: ['m_rx_enable', false], note: '<div class="cb_hint ntr_pnote">Your regexes still run in ST as usual. While this is off, themes leave regex folders alone.</div>' });
    }
    return modulePageHtml(s, 'regex', 'regex', regexSectionHtml, 'Loading your regexes.', { sw: ['m_rx_enable', true], bind: bindRegexPage });
  }
  // The page's switch is there whether regex.js loaded, failed or broke while drawing.
  function bindRegexPage(overlay, s) {
    bindCheck(overlay, '#m_rx_enable', s, 'rxEnabled', openCombinedModal);
    if (s.rxEnabled) callModule('regex', 'bind', overlay, s);
  }

  // Visual Novel's settings, for the Visual Novel part of the Reader Mode page. vn.js loads when the menu first needs them.
  function vnSectionHtml(s) {
    const html = callModule('vn', 'sectionHtml', s);
    if (html !== undefined) return html;
    const wait = isOn() && waiting('vn');
    if (wait) loadVN().then(() => fillIn('vn', vnSectionHtml, bindVNSection));
    const msg = moduleNote('vn', isOn() ? 'Loading its settings.' : 'Its settings show while the extension is on.');
    return `<div class="cb_hint"${wait ? ' data-ntr-wait="vn"' : ''}>${msg}</div>`;
  }

  const bindVNSection = (overlay, s) => { if (readerPart(s) === 'vn') callModule('vn', 'bind', overlay, s); };

  // ===== Reader Mode and the send bar buttons (the paging itself lives in reader.js) =====
  // Visual Novel Mode is Reader Mode's third style (Visual Novel), next to Standard and Book (rdStyle). It keeps its own
  // switch (nodeEnabled), which is on only while Reader Mode is, so Standard or Book is still picked for when it's off.
  // Standard is saved as 'plain'.
  const readerStyle = (s) => (s.rdEnabled && s.nodeEnabled ? 'vn' : s.rdStyle);
  // Only the style in use shows its part of the page: Book or Visual Novel, while Reader Mode is on. Standard has none.
  const readerPart = (s) => (s.rdEnabled ? readerStyle(s) : 'off');
  // The page's Book and Visual Novel parts fold; the picked style's part opens, the other folds.
  function openStyleGroup(s) {
    const st = readerStyle(s);
    s.uiOpen.rd_book = st === 'book';
    s.uiOpen.rd_vn = st === 'vn';
  }
  function readerSectionHtml(s) {
    const err = modError.reader ? `<div class="cb_hint ntr_pnote">Reader Mode failed to load: ${escapeHTML(modError.reader)}</div>` : '';
    const part = readerPart(s);
    return pageHtml('reader', `
        <div class="cb_hint" data-rd-part="${part}">Messages hidden on screen are still sent with the prompt. Each chat opens where you left it.</div>
        ${card('Style', `
          ${pills('rdstyle', [['plain', 'Standard'], ['book', 'Book'], ['vn', 'Visual Novel']], readerStyle(s))}
          <div class="cb_hint" style="margin-bottom: 0;">Picking Visual Novel turns Reader Mode on.</div>`, 'fa-glasses')}
        ${part === 'vn' ? '' : card('Each Page', `
          ${pills('rdper', [['pair', 'Your Message and the Reply'], ['one', 'One Message']], s.rdPer)}
          <div class="cb_hint" style="margin-bottom: 0;">The opening message is page 1.</div>`, 'fa-file-lines')}
        ${part !== 'book' ? '' : `${subHead('rd_book', 'Book', 'fa-book')}
        <div class="cb_collapse_content">
        ${card('', `
          <div class="cb_cur_row">
            <div class="cb_cur_prev ntr_rd_pic" id="m_rd_pic"></div>
            <span class="cb_cur_name" style="flex: 1;">Book Picture<small id="m_rd_pic_name"></small></span>
            <button class="menu_button" id="m_rd_up" title="Upload" aria-label="Upload"><i class="fa-solid fa-upload"></i></button>
            <button class="menu_button" id="m_rd_url" title="Use a link" aria-label="Use a link"><i class="fa-solid fa-link"></i></button>
            <button class="menu_button" id="m_rd_clr" title="Use the built-in book" aria-label="Use the built-in book"><i class="fa-solid fa-rotate-left"></i></button>
          </div>
          <div class="cb_hint" style="margin:6px 0 0;">Cover Color</div>
          <div class="ntr_rd_books" role="radiogroup" aria-label="Cover Color">${BOOKS.map(([v, l, c]) => `<label title="${l}"><input type="radio" name="cbr_rdbook" value="${v}" aria-label="${l}" ${!s.rdBookImg && v === s.rdBook ? 'checked' : ''}><span style="background: ${c};"></span></label>`).join('')}</div>
          <div class="cb_hint">Also puts back the built-in page areas and replaces your own picture.</div>
          <input type="file" id="m_rd_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
          ${ovLabel('Book Width', rangeSlider(s, 'rdBookW'))}
          <div class="cb_hint">Keeps the picture's shape, so a short screen makes it narrower. An upright phone shows Standard; turn it sideways for the book.</div>
          ${ovRow(s, 'rdFlip', 'Page Flip', '<div class="cb_hint" style="margin: 0;">First, Last and a typed page number skip the flip. Off with Reduced Motion, ST\'s or the device\'s.</div>')}`)}
        ${card('Page Areas', `
          ${ovLabel('Top', rangeSlider(s, 'rdBookTop'))}
          ${ovLabel('Bottom', rangeSlider(s, 'rdBookBottom'))}
          ${ovLabel('Outer Edge', rangeSlider(s, 'rdBookOuter'))}
          ${ovLabel('Spine Gap', rangeSlider(s, 'rdBookSpine'))}
          <div class="cb_hint" style="margin-bottom: 0;">Where the text sits on the picture. Top and Bottom are % of the book's height; Outer Edge and Spine Gap, % of its width. The swipe arrows sit below the text, bottom right.</div>`, 'fa-vector-square')}
        ${card('Ink', `
          ${ovLabel('Text', ovColor(s, 'rdInk'))}
          ${ovLabel('Italics', ovColor(s, 'rdInkEm'))}
          ${ovLabel('Quotes', ovColor(s, 'rdInkQuote'))}
          ${ovRow(s, 'rdBookFontOn', 'Book Font', ovFont(s, 'rdBookFont') + hint(FONT_NOTE))}
          <div class="cb_hint" style="margin-bottom: 0;">In the book, these replace ST's and Text Formatting's colors and text effects, and the reasoning block's look. Reasoning text uses Italics. Text Formatting's sizes still apply.</div>`, 'fa-pen-nib')}
        </div>`}
        ${part !== 'vn' ? '' : `${subHead('rd_vn', 'Visual Novel', 'fa-film')}
        <div class="cb_collapse_content">
        ${vnSectionHtml(s)}
        </div>`}
    `, { sw: ['m_rd_enable', s.rdEnabled], note: err, legend: part === 'vn' });
  }

  function bindReader(overlay, s) {
    overlay.querySelector('#m_rd_enable').onchange = function() { setReader(this.checked); };
    onPills(overlay, 'rdper', (v) => { s.rdPer = v; save(); window.NTR.reader?.refresh(); });
    onPills(overlay, 'rdstyle', async (v) => {
      if (v !== 'vn') s.rdStyle = v;
      if (v === 'vn' || s.nodeEnabled) {
        await setReader(s.rdEnabled || v === 'vn', v === 'vn');
        updateAvatarStyle();
        return;
      }
      updateAvatarStyle();
      // The picked style's part opens.
      openStyleGroup(s);
      save();
      openCombinedModal();
    });

    // The book picture: the built-in book, an upload or a link. Going back to the built-in book puts its page areas back too.
    const file = overlay.querySelector('#m_rd_file');
    if (!file) return;
    const renderPic = () => {
      const src = bookSrc(s);
      overlay.querySelector('#m_rd_pic').innerHTML = `<img src="${escapeHTML(src)}" alt="">`;
      overlay.querySelector('#m_rd_pic_name').textContent = s.rdBookImg ? 'Your picture' : `The built-in book, ${BOOKS.find(([v]) => v === s.rdBook)[1]}`;
      overlay.querySelector('#m_rd_clr').disabled = !s.rdBookImg;
    };
    const uncheckBooks = () => overlay.querySelectorAll('input[name="cbr_rdbook"]').forEach((i) => { i.checked = false; });
    const setPic = (url) => {
      const old = s.rdBookImg;
      s.rdBookImg = url;
      if (!url) for (const k of ['rdBookTop', 'rdBookBottom', 'rdBookOuter', 'rdBookSpine']) s[k] = DEFAULTS[k];
      save();
      updateAvatarStyle();
      deleteFileIfUnused(old);
      // A custom picture: no cover dot stays picked, so any dot can be picked to go back.
      if (url) { uncheckBooks(); renderPic(); } else openCombinedModal();
    };
    overlay.querySelector('#m_rd_up').onclick = () => file.click();
    overlay.querySelector('#m_rd_url').onclick = async function() {
      const url = await askImageUrl('Book Picture', this, false);
      if (url) setPic(url);
    };
    // With a custom picture set, going back deletes it and resets the page areas, so it asks first.
    const backToBook = async (anchor) => !s.rdBookImg
      || askYes(anchor, 'Go back to the built-in book? Your picture is removed and the page areas reset.', 'Use Built-In Book', { danger: true });
    overlay.querySelector('#m_rd_clr').onclick = async function() { if (await backToBook(this)) setPic(''); };
    onPills(overlay, 'rdbook', async (v) => {
      if (!(await backToBook(overlay.querySelector('.ntr_rd_books')))) { uncheckBooks(); return; }
      s.rdBook = v;
      setPic('');
    });
    onFilePick(file, 'Book Picture', async (f) => setPic(await uploadImage(f, 'book', { max: 3000 })));
    renderPic();
  }

  // Reader Mode on or off, in Standard or Book (rdStyle) or, with vn, in Visual Novel (Visual Novel Mode).
  async function setReader(on, vn = false) {
    const s = settings();
    const wasVN = !!s.nodeEnabled;
    s.rdEnabled = !!on;
    s.nodeEnabled = !!on && !!vn;
    openStyleGroup(s);
    save();
    const live = isOn();
    const rd = on && live ? await loadModule('reader', true) : window.NTR.reader;
    const vnm = s.nodeEnabled && live ? await loadVN() : window.NTR.vn;
    if (s.nodeEnabled !== wasVN) vnm?.refresh({ switchedOn: s.nodeEnabled });
    rd?.refresh();
    syncReaderToggle();
    syncVNToggle();
    syncModeSwitches();
  }
  const toggleReader = () => setReader(!settings().rdEnabled);

  // The open menu's Reader switch and style, after a button next to the send box changed them.
  function syncModeSwitches() {
    const ov = document.getElementById('cb_modal_overlay');
    if (!ov) return;
    const s = settings();
    const cb = ov.querySelector('#m_rd_enable');
    if (cb) cb.checked = !!s.rdEnabled;
    const pick = ov.querySelector(`input[name="cbr_rdstyle"][value="${readerStyle(s)}"]`);
    if (pick) pick.checked = true;
    syncPageOff(ov);
    // The page shows a different style's settings now.
    const shown = ov.querySelector('[data-rd-part]');
    if (shown && shown.dataset.rdPart !== readerPart(s)) openCombinedModal();
  }

  function syncReaderToggle() {
    syncSendBtn('ntr_rd_toggle', !!settings().rdEnabled);
  }

  // A mode's button in the send bar: pressed while its mode is on, hidden while the extension is off.
  function syncSendBtn(id, on) {
    const b = document.getElementById(id);
    if (!b) return;
    b.classList.toggle('cb_on', on);
    b.setAttribute('aria-pressed', String(on));
    b.style.display = isOn() ? '' : 'none';
  }
  function injectSendBtn(id, icon, title, label, onclick, sync) {
    const lsf = document.getElementById('leftSendForm');
    if (!lsf || document.getElementById(id)) return;
    const b = document.createElement('div');
    b.id = id;
    b.className = `fa-solid ${icon} interactable`;
    b.title = title;
    b.setAttribute('role', 'button');
    b.setAttribute('aria-label', label);
    b.tabIndex = 0;
    b.onclick = onclick;
    lsf.appendChild(b);
    sync();
  }

  function syncVNToggle() {
    // Pinned Blocks can hide in Visual Novel Mode.
    callModule('layout', 'syncPins');
    syncSendBtn('cb_node_toggle', !!settings().nodeEnabled);
  }

  // The chat bubbles button: Reader Mode with the Visual Novel style, or Reader Mode off.
  async function toggleVN() {
    const on = !settings().nodeEnabled;
    await setReader(on, on);
  }

  // ===== Extensions page drawer + master power switch =====
  function syncExtBar() {
    const p = document.getElementById('ntr_power');
    if (!p) return;
    const on = isOn();
    p.classList.toggle('on', on);
    p.querySelector('span').textContent = on ? 'Switch off' : 'Switch on';
    p.title = on ? 'Turn Nitwit Tavern Redesign off' : 'Turn Nitwit Tavern Redesign on';
    document.getElementById('ntr_ext_off').hidden = on;
  }

  async function setMaster(on) {
    const s = settings();
    s.masterEnabled = on;
    if (!on) callModule('layout', 'endPlacement');
    save();
    renderAll();
    syncExtBar();
    syncVNToggle();
    syncReaderToggle();
    // Reader Mode first: Visual Novel opens on the message saved through it.
    const rd = on && s.rdEnabled ? await loadModule('reader', true) : window.NTR.reader;
    rd?.refresh();
    if (on) {
      if (s.nodeEnabled) (await loadVN())?.refresh();
      (await loadModule('cast'))?.refresh();
    } else {
      window.NTR.vn?.teardown();
      window.NTR.cast?.teardown();
    }
    if (document.getElementById('cb_modal_overlay')) openCombinedModal();
  }

  function injectExtBar() {
    const host = document.getElementById('extensions_settings2');
    if (!host || document.getElementById('ntr_ext_bar')) return;
    const wrap = document.createElement('div');
    wrap.id = 'ntr_ext_bar';
    wrap.className = 'inline-drawer';
    wrap.innerHTML = `
      <div class="inline-drawer-toggle inline-drawer-header">
        <b><span class="ntr_icon ntr_ext_icon"></span> Nitwit Tavern Redesign <small id="ntr_ext_off" title="Nitwit Tavern Redesign is switched off" hidden>Off</small></b>
        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
      </div>
      <div class="inline-drawer-content">
        <div class="ntr_ext_row">
          <button id="ntr_ext_open" class="menu_button"><i class="fa-solid fa-sliders"></i> Open menu</button>
          <button id="ntr_power" class="menu_button"><i class="fa-solid fa-power-off"></i> <span></span></button>
        </div>
        <div class="inline-drawer ntr_ext_fold">
          <div class="inline-drawer-toggle inline-drawer-header">
            <span>Remove NTR data</span>
            <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
          </div>
          <div class="inline-drawer-content">${removeHtml()}</div>
        </div>
      </div>`;
    host.appendChild(wrap);
    wrap.querySelector('#ntr_ext_open').onclick = openCombinedModal;
    wrap.querySelector('#ntr_power').onclick = () => setMaster(!isOn());
    bindRemove(wrap.querySelector('.ntr_ext_fold .inline-drawer-content'));
    syncExtBar();
  }

  // ===== Remove NTR data (in the Extensions page drawer) =====
  const removeGoHtml = 'Continue <i class="fa-solid fa-arrow-right"></i>';
  const removeHtml = () => `
    <div class="cb_hint">Uninstalling from SillyTavern keeps card data and its files. Remove them here first.</div>
    <label class="checkbox_label"><input type="checkbox" id="ntr_rm_look"><span><strong>Settings and themes</strong>: your look, saved themes and menu settings.<small class="ntr_rm_note">To keep a theme, export it first on the Themes page of the menu.</small></span></label>
    <label class="checkbox_label"><input type="checkbox" id="ntr_rm_chars"><span><strong>Uploaded files and character data</strong>: images, videos and maps uploaded through NTR, and the NTR data saved in each character card.</span></label>
    <div class="cb_actions ntr_rm_foot"><button class="menu_button" id="ntr_rm_go" disabled>${removeGoHtml}</button></div>`;

  function bindRemove(root) {
    const box = (id) => root.querySelector(`#ntr_rm_${id}`);
    const go = box('go');
    const picked = () => ({ look: box('look').checked, chars: box('chars').checked });
    const sync = () => {
      const p = picked();
      go.disabled = !(p.look || p.chars);
      // A question still open was asked about the old ticks.
      root.querySelector('.ntr_ask')?.ntrCancel();
    };
    const ticks = root.querySelectorAll('input[type=checkbox]');
    ticks.forEach((c) => { c.onchange = sync; });
    // Locked while a removal runs, so a second one can't start alongside it.
    const lock = (on) => ticks.forEach((c) => { c.disabled = on; });
    go.onclick = async () => {
      const p = picked();
      const what = p.look && p.chars ? 'your settings, themes, uploaded files and the NTR data in every character card'
        : p.look ? 'your settings and themes' : 'your uploaded files and the NTR data in every character card';
      // The question goes under the button's row, so the row hides once it's placed.
      const asking = askYes(go, `This removes ${what}. This can't be undone.`, 'Remove', { danger: true });
      go.parentElement.style.display = 'none';
      const yes = await asking;
      go.parentElement.style.display = '';
      if (!yes) return;
      lock(true);
      go.disabled = true;
      go.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Removing...';
      let left;
      try {
        left = await removeData(p);
      } catch (e) {
        console.error('[NTR remove data]', e);
        toastr.error(e.message || 'Something went wrong.', 'Remove NTR data');
        go.innerHTML = removeGoHtml;
        lock(false);
        sync();
        return;
      }
      if (left) {
        toastr.warning(`${left} uploaded file${left === 1 ? '' : 's'} could not be deleted. Try again from Remove NTR data after the reload.`, 'Remove NTR data', { timeOut: 10000 });
        setTimeout(() => location.reload(), 4000);
        return;
      }
      toastr.success('NTR data removed. Reloading...', 'Remove NTR data');
      // SillyTavern saves its settings about a second after a change.
      setTimeout(() => location.reload(), 2500);
    };
  }

  // ===== Wand menu entry and /ntr: other ways to open the menu, even with the power off =====
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
    b.onclick = openCombinedModal;
    keyClick(b);
    menu.appendChild(b);
  }

  function registerSlashCommand() {
    const { SlashCommandParser, SlashCommand } = ctx();
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
      name: 'ntr',
      aliases: ['NTR'],
      callback: () => { openCombinedModal(); return ''; },
      helpString: 'Opens the Nitwit Tavern Redesign menu.',
    }));
  }

  // ===== Startup, the injected buttons, the public API and SillyTavern's hooks =====
  function injectExtensionMenuButton() {
    const tick = () => {
      injectExtBar();
      injectSendBtn('cb_node_toggle', 'fa-comments', 'Visual Novel Mode (turns Reader Mode on)', 'Visual Novel Mode', toggleVN, syncVNToggle);
      injectSendBtn('ntr_rd_toggle', 'fa-book-open', 'Reader Mode', 'Reader Mode', toggleReader, syncReaderToggle);
      syncWandEntry();
      if (isOn()) window.NTR.cast?.ensure();
    };
    tick();
    setInterval(tick, 1000);
  }

  window.NTR = window.NTR || {};
  window.NTR.api = {
    VERSION, DEFAULTS, ctx, save, settings, isOn, escapeHTML, bookUrl, bookSrc, fullResUrl, readDataURL, loadImg, askImageUrl, askVideoUrl,
    pills, posGrid, onPills, checkBox, bindCheck, bindSliders, keyClick, showFold, setInjection, pageHtml, subHead, picSlotHtml, bindPicSlot, thumbHtml, deleteFileIfUnused, syncVNToggle, TAG, TAG_KEY, store, emoSet, vnData, chatCards, chatName, lc, reEsc, unlinkPins, tagOf, EMO_LIMITS, changedEls, onFilePick, uploadHere, refreshFg: () => (window.NTR.overlays ? window.NTR.overlays.ensureFg() : renderOverlays()),
    openMenu: openCombinedModal, fillIn, callModule, clamp, sliderAbove,
    // Data cleaning, for agents.js's saved agents
    cStr, cId, cRef,
    closeMenu: () => { const ov = document.getElementById('cb_modal_overlay'); if (!ov) return false; ov.querySelector('.cb_close_btn').click(); return true; },
    sendFree: () => !!callModule('layout', 'sendFree'), sendCover,
    // Reader Mode calls refreshPins when the page changes; the stage behind the chat follows the page too (cast.js).
    refreshPins: () => { callModule('layout', 'syncPins'); callModule('decor', 'sync'); window.NTR.cast?.sync(); }, syncSendRoom: () => callModule('layout', 'syncSendRoom'), pageFree: () => !!callModule('layout', 'pageFree'), banFree: () => !!callModule('layout', 'banFree'), rangeNum, cleanFont, fontName,
    // For themes.js: what a theme holds, how it's cleaned and applied, and its files
    LOOK, TAG_KEYS, lookSnapshot, setLook, cleanLookSection, validLookValue, collectFileRefs, normFile, uploadDataUrl, isObj, stColor,
    // Exported files, and names for imported or new items
    downloadJson, freeName, nameTaken, uniqueName,
    // NUM_RANGE ranges, slider attributes and theme text limits, for modules' own sliders, number boxes and text boxes
    numRange: (k) => NUM_RANGE[k], rangeAttrs, strMax,
    // For overlays.js: the banner's and foreground images' data (kept here for card storage and cleanup) and menu parts
    peek, bannerSrc, fgData, FG_POS, fgTransform, cardNum, card, pagePart,
    // Edit Layout (layout.js), for avatars.js and overlays.js. Without layout.js, the pictures keep their place and
    // sliders, and the buttons say why they do nothing.
    startPlacement: (first) => (window.NTR.layout ? callModule('layout', 'startPlacement', first) : toastr.info('Layout didn\'t load, so Edit Layout isn\'t available.', 'Edit Layout')),
    drawPlace: () => callModule('layout', 'drawPlace'),
    loadModule, moduleError: (name) => modError[name] || '', reducedMotion, removeData, askYes, askText, askNumber, popMenu, menuBtn, switchHtml, closePops, dragSort, uploadImage, uploadVideo, getYouTubeId, currentKey, newId, validateDelims,
    bannerImage: () => {
      const key = currentKey();
      if (!key) return '';
      const r = bannerSrc(peek(key));
      const im = r.images[r.idx] || r.images[0];
      return im ? im.url : '';
    },
    // What elements.js, text.js, avatars.js, decor.js and layout.js build from: the row builders, CSS helpers, and the
    // lists their settings are checked against.
    look: {
      POS_GRID, SHAPE_OPTS, castPartHtml, svgMask, BUB_TAIL_OPTS, BUB_INK_OPTS, COLOR_FROM, joinCss, ovWhen, sendSeparate,
      FONT_NOTE, MB_ID, QR_ALIGN, MD_ITEMS, MD_ITEM_IDS, MD_SPOTS, MD_SEP, FX_PARTS, NAME_WEIGHT, ntrAvatars, namesHidden, ovLabel, hint,
      RB_ANIM, RB_BOX_SHAPE, RB_FADE, RB_SHAPE, RB_TURN,
      cssRule, cssReaders, FRAME_SERIES, FRAME_IDS, FRAME_FIT, frameUrl, cssTag, seeThrough, RB_CSS, rbCssText, customCssBox, CSS_NOTE, FILTER_OPTS, TEXTURE_OPTS, bubblesOn, bubRight, restyle: updateAvatarStyle,
      rangeSlider, ovRow, ovColor, ovText, ovFont, ovPick, ovShapeRow, ovBgRow, ovBorderRow, ovColorVal, ovRadius, ovBorderVal,
      // For layout.js
      LAY_EDGES, lk, PIN_START, PIN_TAG, PIN_CLASS, PIN_MAX, PIN_LIMITS, pinRect, cleanPins, setSlider, decorOn,
    },
  };

  await loadLookModules();

  jQuery(() => {
    const { eventSource, event_types } = ctx();
    injectExtensionMenuButton();
    registerSlashCommand();
    document.addEventListener('click', typeSlider);
    // Sliders outside the menu, like Edit Layout's grid size.
    document.addEventListener('input', showRange);
    document.addEventListener('pointerover', (e) => {
      const el = e.target.closest?.('.ntr_slval');
      if (el && !el.title) el.title = 'Click to type a value';
    });
    document.addEventListener('load', (e) => {
      if (!(e.target instanceof HTMLImageElement) || !e.target.matches('#chat .mes .avatar img')) return;
      callModule('avatars', 'imgLoaded', e.target);
    }, true);
    window.addEventListener('resize', () => {
      window.NTR.cast?.sync();
      callModule('layout', 'syncSendRoom');
      const ov = document.getElementById('cb_modal_overlay');
      if (!ov) return;
      panelLayout(ov);
    });
    eventSource.on(event_types.CHAT_CHANGED, () => {
      callModule('layout', 'endPlacement');
      renderAll();
      window.NTR.vn?.queue(false);
      window.NTR.cast?.refresh();
      window.NTR.reader?.chatChanged();
      if (document.getElementById('cb_modal_overlay')) openCombinedModal();
    });

    for (const [name, anim] of [['USER_MESSAGE_RENDERED', true], ['MESSAGE_EDITED', false], ['MESSAGE_UPDATED', false], ['MESSAGE_DELETED', false]]) {
      eventSource.on(event_types[name], () => { window.NTR.vn?.queue(anim); window.NTR.cast?.sync(); });
    }
    // User messages and system messages (/sys) can set off agents too; agents.js tells them apart.
    eventSource.on(event_types.USER_MESSAGE_RENDERED, (id) => window.NTR.agents?.replied('sent', Number(id)));
    // A swipe to a new reply shows "..." until the reply arrives (see nodeSwiped in vn.js).
    eventSource.on(event_types.MESSAGE_SWIPED, (id) => {
      window.NTR.cast?.sync();
      return window.NTR.vn?.swiped(Number(id));
    });
    eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, (id, type) => {
      const vn = window.NTR.vn;
      vn?.endWait();
      // A Continue picks up where the old text ended instead of typing the whole message again.
      // Without streaming, SillyTavern marks a finished Continue as 'appendFinal'.
      if (type === 'continue' || type === 'appendFinal') vn?.continued(Number(id));
      else vn?.queue(true);
      window.NTR.cast?.sync();
      window.NTR.agents?.replied(type, Number(id));
    });
    eventSource.on(event_types.GENERATION_STARTED, (type, _opts, dryRun) => {
      window.NTR.vn?.genStarted(type, dryRun);
      window.NTR.cast?.genStarted(type, dryRun);
      window.NTR.reader?.genStarted(type, dryRun);
    });
    // Agents wait for a reply being written. A send with only slash commands (like /ntr typed in the box) writes none
    // and never sends "generation ended", so agents only count a reply once SillyTavern has run the commands.
    eventSource.on(event_types.GENERATION_AFTER_COMMANDS, (type, _opts, dryRun) => window.NTR.agents?.genStarted(type, dryRun));
    // Stopped or failed before a reply arrived: SillyTavern puts the old reply back, shown without typing it again.
    // The short delay lets a reply that did arrive go first, so it still gets typed.
    eventSource.on(event_types.GENERATION_ENDED, () => {
      window.NTR.cast?.genEnded();
      window.NTR.agents?.genEnded();
      if (isOn() && settings().nodeEnabled) setTimeout(() => { if (window.NTR.vn?.endWait()) window.NTR.vn.queue(false); }, 300);
    });
    eventSource.on(event_types.APP_READY, () => { renderAll(); window.NTR.vn?.queue(false); window.NTR.cast?.refresh(); });
    // A renamed preset keeps its regex folders (Regexes page, regex.js), which are saved by preset name.
    eventSource.on(event_types.PRESET_RENAMED, ({ apiId, oldName, newName }) => {
      const all = settings().regexPresetFolders;
      const from = `${apiId}|${oldName}`, to = `${apiId}|${newName}`;
      if (!Array.isArray(all[from])) return;
      all[to] = [...(Array.isArray(all[to]) ? all[to] : []), ...all[from]];
      delete all[from];
      save();
    });

    new MutationObserver(() => { callModule('avatars', 'syncPopouts'); callModule('decor', 'sync'); }).observe(document.getElementById('chat'), { childList: true });
    renderAll();
    const s0 = settings();
    const on = isOn();
    // cast.js hides tags in the chat and draws emotions, so it loads whenever NTR is on. VN loads it first anyway.
    if (on) loadModule('cast').then((c) => c?.refresh());
    // Reader Mode first: Visual Novel opens on the message saved through it.
    const rdLoad = on && s0.rdEnabled ? loadModule('reader').then((rd) => rd?.refresh()) : Promise.resolve();
    // Visual Novel Mode loads when it's switched on (see setReader).
    if (on && s0.nodeEnabled) rdLoad.catch(() => {}).then(() => loadVN()).then((vn) => vn?.refresh());
    if (on && s0.agEnabled) loadModule('agents');
    // The Themes page works with NTR on or off.
    loadModule('themes');
  });
})();

// SillyTavern's "Clean extension data" button and "Also clean up extension data" option when deleting the extension
// (the manifest's clean hook): removes settings and themes, and the uploaded files no character card still uses.
// Character cards stay as they are: SillyTavern stops waiting for a hook after 5 seconds, and going through every card
// can take longer. Remove NTR data in NTR's own drawer removes those too.
export async function onClean() {
  await window.NTR?.api?.removeData({ look: true });
}

// SillyTavern waits for this before it builds a reply's prompt (the manifest's generate_interceptor), so agents set off
// by a user message can get their answers into that reply.
globalThis.ntrBeforeReply = (_chat, _size, _abort, type) => window.NTR?.agents?.beforeReply(type);
