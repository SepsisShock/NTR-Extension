await (async () => {
  const MODULE = 'chatvisuals';
  const VERSION = '2.69.2';
  const NTR_BASE = new URL('.', import.meta.url).href;
  const TAG = '<i class="fa-solid fa-tag ntr_tag" title="Saved per character"></i>';
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

    // Reader Mode (reader.js): the chat a page at a time. Per Page is 'pair' (your message and the replies after it) or 'one'.
    rdEnabled: false, rdPer: 'pair',
    // Its look, in themes: Standard or Book. An empty picture is the built-in book, and the page areas start as its own:
    // where the text sits on the picture, as a % of its height (Top, Bottom) or width (Outer edge, Spine gap).
    rdStyle: 'plain', rdBook: 'brown', rdBookImg: '', rdBookW: 90, rdBookTop: 13, rdBookBottom: 15, rdBookOuter: 11, rdBookSpine: 11,
    rdInk: '#2b2118', rdInkEm: '#6b4f2a', rdInkQuote: '#7a2e1e', rdBookFontOn: false, rdBookFont: '', rdFlip: true,

    // Agents page (agents.js): your agents (each with its own job, connection, samplers and limits; see clean in agents.js),
    // the one picked in the menu, and the departments grouping them (see depts in agents.js). Not in themes.
    agEnabled: false, agents: [], agPick: '', agDepts: [],

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
    // Emotions outside Visual Novel Mode (cast.js): faces on chat avatars, the stage behind the chat, the [[Emotion:X]] tag
    emoWord: 'Emotion', emoSource: 'tags', emoFaces: false, emoStage: false, emoStageScale: 100, emoStageOpacity: 100, emoInject: true,

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
    // Nameplate: the box behind the names on chat messages and the Visual Novel name tag (see textFormatCss).
    tfPlateBgOn: false, tfPlateBg: '', tfPlateImg: '', tfPlateBorderOn: false, tfPlateBorder: '', tfPlateBorderWidth: 1,
    tfPlateRoundOn: false, tfPlateRound: 8, tfPlatePosOn: false, tfPlatePos: 'edge',
    tfUserFxOn: false, tfUserFx: 'glow', tfUserFxStr: 3, tfUserFxColorOn: false, tfUserFxColor: '',
    tfAiFxOn: false, tfAiFx: 'glow', tfAiFxStr: 3, tfAiFxColorOn: false, tfAiFxColor: '',

    // Display overrides
    ovEnabled: true,
    ovWidthOn: false, ovWidth: 50, ovFontOn: false, ovFont: 1,
    ovBlurOn: false, ovBlur: 10, ovShadowOn: false, ovShadow: 2, ovAvatarOn: false, ovAvatar: 'round',
    // Interface Shape shapes the chat panel and the rest of the interface (see uiShapeCss). Empty colors mean SillyTavern's own (see COLOR_FROM).
    ovShapeOn: false, ovShape: 'rounded', ovRound: 10,
    ovPanelBgOn: true, ovPanelBg: 'clear', ovPanelBgColor: '', ovPanelBgOpacity: 100,
    ovPanelBorderOn: false, ovPanelBorder: 'line', ovPanelBorderColor: '', ovPanelBorderWidth: 1, ovPanelBorderOpacity: 100,
    ovMesGapOn: false, ovMesGap: 5, ovNamesOn: false, ovNames: 'show',
    ovSendPosOn: false, ovSendPos: 'separate', ovSendGap: 8,
    // Speech Bubbles: AI and User messages as chat bubbles around the message text (see bubbleCss). Their color, roundness
    // and border come from AI Message and User Message.
    ovBubOn: false, ovBubTail: 'pointed', ovBubTailPos: 'top', ovBubAlign: 'sides', ovBubWidth: 85, ovBubFit: 'shrink', ovBubGroup: 'group', ovBubInk: 'auto',
    ovScrollOn: true, ovScrollColorOn: false, ovScrollColor: '', ovScrollTrackOn: false, ovScrollTrack: 'rgba(0, 0, 0, 0)',
    ovScrollCssOn: false, ovScrollCss: '',
    ovCursorOn: false, ovCursorImg: '', ovCursorPtrImg: '', ovCursorDownImg: '', ovCursorTextImg: '', ovCursorSize: 32,
    ovCursorCssOn: false, ovCursorCss: '',
    // Menu Bar Icons (Elements): your own pictures for the icons on SillyTavern's menu bar, keyed by the id of each icon's
    // drawer (see menuBarIconCss in elements.js). Each is { img, mode: 'tint' or 'full', name }.
    mbOn: false, mbIcons: {},
    // Quick Replies restyle SillyTavern's Quick Reply bar. Shape, Background and Border come from BOX_PARTS. ST's hover
    // color is a plain gray, not one of its theme colors, so it starts filled in like the scrollbar's Track Color.
    // Message Details (Elements): which details show in each spot, and their look (see messageDetailsCss in elements.js).
    // The spots start where SillyTavern puts them.
    mdOn: false, mdAv: ['num', 'gen', 'tok'], mdRow: ['date', 'time'], mdCorner: [], mdBelow: [], mdDate: 'long', mdSep: 'dot',
    mdSizeOn: false, mdSize: 1, mdColorOn: false, mdColor: '', mdOpacityOn: false, mdOpacity: 70, mdPillOn: false, mdPill: '',
    ovQrOn: false, ovQrTextOn: false, ovQrText: '', ovQrHoverOn: false, ovQrHover: 'rgba(77, 77, 77, 1)', ovQrSizeOn: false, ovQrSize: 1,
    ovQrWrapOn: false, ovQrWrap: 'scroll', ovQrGapOn: false, ovQrGap: 5, ovQrAlignOn: false, ovQrAlign: 'center', ovQrOpacityOn: false, ovQrOpacity: 70,
    ovQrCssOn: false, ovQrCss: '',

    // Menu state
    uiOpen: {},
    // Regexes page (regex.js): Global folders, and Preset folders by preset. Character folders live in the card.
    // Switched off, NTR leaves SillyTavern's regexes alone: they still run, but the page and themes don't show, sort or
    // switch them.
    rxEnabled: true,
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
  // Quick Reply buttons (Elements) have the same three.
  const BOX_PARTS = [...OV_PARTS, 'Qr'];
  for (const p of BOX_PARTS) {
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
    ctx().saveSettingsDebounced();
    const k = currentKey();
    if (k) scheduleCardFlush(k);
  };
  const isOn = () => settings().masterEnabled !== false;
  const popMsg = { ai: '', us: '' }; 

  const escapeHTML = (str) => {
    return String(str).replace(/[&<>'"]/g, match => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[match]));
  };

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
    // Fade was one of the Background Patterns; it's its own switch now, so it can go with a pattern. A theme from before
    // that had another pattern turns Fade off.
    if ('rbPat' in o && !('rbPatFadeOn' in o)) o.rbPatFadeOn = o.rbPat === 'fade';
    if (o.rbPat === 'fade') o.rbPat = 'none';
    // The button's Border Style had None, which is ST's own look: unticked.
    if (o.rbBtnBorder === 'none') { o.rbBtnBorder = DEFAULTS.rbBtnBorder; o.rbBtnBorderOn = false; }
    // UI Display's switch used to cover Chat Width, Space Between Messages, Send Box Position, the scrollbar and the
    // cursor. They follow Layout's switch and their own Elements switches now, so whatever showed before still shows:
    // with UI Display on, Layout comes on for them (it changes nothing until something is moved); with it off, they go off.
    if ('ovEnabled' in o && !('ovScrollOn' in o)) {
      const on = o.ovEnabled !== false;
      const lay = ['ovWidthOn', 'ovMesGapOn', 'ovSendPosOn'];
      o.ovScrollOn = on;
      if (!on) { o.ovCursorOn = false; o.ovNamesOn = false; for (const k of lay) o[k] = false; }
      else if (lay.some((k) => o[k]) && o.layEnabled !== true) o.layEnabled = true;
    }
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
    // The built-in book was a drawing before 2.36.0, and its page areas don't fit the photo books.
    if (!('rdBook' in s) && !s.rdBookImg && s.rdBookTop === 7 && s.rdBookBottom === 8 && s.rdBookOuter === 7 && s.rdBookSpine === 8) {
      for (const k of ['rdBookTop', 'rdBookBottom', 'rdBookOuter', 'rdBookSpine']) s[k] = DEFAULTS[k];
    }
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
    // Visual Novel Mode is Reader Mode's Visual Novel style, so it's only on while Reader Mode is.
    if (s.nodeEnabled && !s.rdEnabled) s.rdEnabled = true;
    if (s.uiOpen && !('rd_vn' in s.uiOpen)) openStyleGroup(s);
    for (const k of Object.keys(DEFAULTS.uiPanel)) if (s.uiPanel[k] === undefined) s.uiPanel[k] = DEFAULTS.uiPanel[k];
    if (!Array.isArray(s.themes)) s.themes = [];
    if (!s.themeLookV3) { s.themes.forEach((th) => upgradeTheme(th && th.data)); s.themeLookV3 = true; }
    // Saved themes move the settings that changed pages (Chat Width to Layout, Scrollbar to Elements and so on) to their new sections.
    if (!s.themeLookV4) { s.themes.forEach((th) => upgradeTheme(th && th.data)); s.themeLookV4 = true; }
    // Saved themes with Fade as their pattern move it to its own switch.
    if (!s.themeLookV5) { s.themes.forEach((th) => upgradeTheme(th && th.data)); s.themeLookV5 = true; }
    if (!cleaned.has(s.bannerGlobal)) s.bannerGlobal = cleanBannerSrc(s.bannerGlobal);
    if (!cleaned.has(s.mbIcons)) s.mbIcons = cleanMbIcons(s.mbIcons);
    if (!Array.isArray(s.emotions) || !s.emotions.length) s.emotions = structuredClone(DEFAULTS.emotions);
    if (!s.emotions.some((e) => e.id === s.emoDefault)) s.emoDefault = s.emotions[0].id;
    if (!Array.isArray(s.layPins)) s.layPins = [];
    if (!cleaned.has(s.layPins)) { s.layPins = cleanPins(s.layPins); cleaned.add(s.layPins); }
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
    // A face from Emotions (cast.js) is already full size.
    if (img.dataset.ntrFace === src) return;
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
    if (chat && window.ResizeObserver) new ResizeObserver(() => { layoutPop(); pinCheckRead(); }).observe(chat);
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
  // Pop-out avatars, foreground images and, with Layout on, the chat panel, menu bar, send bar, page bar and banner can be dragged on
  // screen. Edit Placement hides the menu and outlines what can move; only the picked item drags, and a picked Layout
  // part also resizes from the handles on its edges. Tapping the picked item picks the one under it. The bar at the
  // bottom has Snap to Grid, Undo, Reset and Done.
  // Layout parts come first, so the pictures' outlines sit on top of theirs.
  const PLACE = [
    { id: 'layChat', lay: 'chat', label: 'Chat Panel' }, { id: 'layBar', lay: 'bar', label: 'Menu Bar' }, { id: 'laySend', lay: 'send', label: 'Send Bar' },
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

  const placeEl = (it) => (it.lay ? document.getElementById(LAY_PART[it.lay].el)
    : it.pin ? document.querySelector(`#ntr_pin_layer > .ntr_pin[data-pin="${it.pin}"]`)
      : document.getElementById(it.pos ? `cb_fg_${it.pos.toLowerCase()}` : `cb_pop_${it.id}`));

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
  // banner only while they're Free, since Attached they follow the chat panel. The page bar is there in Reader Mode's Standard
  // and Book, the banner while the open chat shows one.
  function layRect(it) {
    const s = settings();
    const el = placeEl(it);
    const att = { send: 'Send', page: 'Page', ban: 'Ban' }[it.lay];
    if (!el || !layOn(s) || (att && s[lk(phoneNow(), att)] !== 'free')) return null;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 ? r : null;
  }

  // An item's outline on this page.
  function placeRect(it) {
    if (it.lay) {
      const r = layRect(it);
      if (!r) return null;
      return r;
    }
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
    if (!el || el.style.display === 'none' || !el.getAttribute('src')) return null;
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

  // Dragging a Layout part. The chat panel and send bar move anywhere and resize from their handles. The menu bar slides
  // along its edge, changes length from its ends, and goes to another edge when dragged close to it. Kept on screen and
  // saved as a % of it. Everything here is in the screen's own pixels: dx, dy and the pointer (px, py) too.
  // A box (r: left, right, top, bottom) moved by dx, dy, or resized from d.grip, kept on a W by H screen and at least
  // minW by minH, with whichever edge is nearer a grid line (every g pixels, 0 for none) landing on it.
  function dragBox(r, grip, dx, dy, W, H, minW, minH, g) {
    const snap = (v) => (g ? Math.round(v / g) * g : v);
    const shift = (a, b, t, max) => {
      t = clamp(t, -a, max - b);
      if (g) {
        const sa = snap(a + t) - a - t, sb = snap(b + t) - b - t;
        t = clamp(t + (Math.abs(sa) <= Math.abs(sb) ? sa : sb), -a, max - b);
      }
      return [a + t, b + t];
    };
    let [L, R, T, B] = [r.left, r.right, r.top, r.bottom];
    if (!grip) {
      [L, R] = shift(L, R, dx, W);
      [T, B] = shift(T, B, dy, H);
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
  function dragPin(d, dx, dy, free) {
    const s = settings();
    const p = pinOf(d.it);
    if (!p || (p.place !== 'float' && !d.grip)) return;
    const W = window.innerWidth, H = window.innerHeight;
    const g = s.placeSnap && !free ? rangeNum(s, 'placeGrid') : 0;
    const [L, R, T, B] = dragBox(d.r0, d.grip, dx, dy, W, H, W * NUM_RANGE.pinW[0] / 100, H * NUM_RANGE.pinH[0] / 100, g);
    const pct = (v, size) => Math.round(v / size * 10000) / 100;
    const r = p[pinPhone(phoneNow())];
    if (p.place !== 'float') return placeSet(d.it, { ...r, w: pct(R - L, W) });
    let y = pct(T, H);
    const h = Math.max(pct(B - T, H), NUM_RANGE.pinH[0]);
    // A Fit Content box can be shorter than the saved height can go, so in the bottom half its bottom edge is kept
    // instead of its top (see pinCss). Close to the middle, either edge does.
    if (p.height === 'fit' && y + h / 2 > 50 && pct(B, H) - h / 2 > 50) y = Math.round((pct(B, H) - h) * 100) / 100;
    placeSet(d.it, { x: pct(L, W), y, w: pct(R - L, W), h, moved: true });
  }

  function dragLayout(d, dx, dy, px, py, free) {
    const s = settings();
    const W = innerWidth, H = innerHeight;
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
      const doc = document;
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

    const min = (name) => NUM_RANGE[lk(phoneNow(), name)][0] / 100;
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
      + `<div id="cb_place_pill">
          <span class="cb_place_name"></span>
          <label class="cb_place_snap" title="Hold Alt while dragging to move freely for one move"><input type="checkbox" id="cb_place_snap"><span>Snap to Grid</span></label>
          <span class="cb_place_gridset"><input type="range" id="cb_place_grid" ${rangeAttrs('placeGrid')} value="${rangeNum(s, 'placeGrid')}" title="Grid spacing"><span><span id="cb_place_gridval" class="ntr_slval">${rangeNum(s, 'placeGrid')}</span>${NUM_RANGE.placeGrid[3]}</span></span>
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
      place.drag = { it, id: e.pointerId, sx: e.clientX, sy: e.clientY, start, grip, moved: false };
      if (it.lay) Object.assign(place.drag, { r0: layRect(it), px0: e.clientX, py0: e.clientY, edge0: settings()[lk(phoneNow(), 'BarEdge')] });
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
      if (d.it.lay) return d.r0 && dragLayout(d, dx, dy, e.clientX, e.clientY, e.altKey);
      if (d.it.pin) return d.r0 && dragPin(d, dx, dy, e.altKey);
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
        const ids = placeItems().map((p) => p.id).reverse().filter((id) => under.has(id));
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
    for (const it of placeItems()) {
      const box = layer.querySelector(`.cb_place_box[data-id="${it.id}"]`);
      if (!box) continue;
      const r = placeRect(it);
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
    const sel = placeItems().find((it) => it.id === place.sel && placeRect(it));
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
      return false;
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
    setPlaceTouchGuard(true);
    // A block still in its message moves with the chat, so the outlines follow any scroll, like Page Down in Reader Mode.
    document.addEventListener('scroll', drawPlace, true);
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
    document.removeEventListener('scroll', drawPlace, true);
    document.body.classList.remove('ntr_placing');
    syncPins();
    const ov = document.getElementById('cb_modal_overlay');
    syncLayoutPage(ov);
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

  // The Enable switches are sliders that still click on and off: every page and part switch (ntr_pswitch), and the
  // avatar switches. They're styled through an id because a class alone would rank below SillyTavern's own checkbox
  // styles, which would turn them back into square checkboxes.
  const SWITCHES = ['#cb_modal_overlay .ntr_pswitch', '#m_ai_on', '#m_us_on'];
  const switches = (state) => SWITCHES.map((sel) => sel + state).join(', ');

  function updateAvatarStyle() {
    let styleEl = document.getElementById('aw_dynamic_style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'aw_dynamic_style';
      document.head.appendChild(styleEl);
    }

    const s = settings();
    
    let cssString = `
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
      @media (pointer: coarse) { .cb_cur_row .menu_button { min-width: 40px; min-height: 40px; } }
      .cb_cur_prev { width: 40px; height: 40px; flex: none; border-radius: 8px; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; }
      .cb_cur_prev img { max-width: 32px; max-height: 32px; }
      .cb_cur_prev i { opacity: .35; }
      .cb_cur_prev.ntr_rd_pic { width: 72px; height: 48px; }
      .cb_cur_prev.ntr_rd_pic img { max-width: 68px; max-height: 44px; }
      /* Speakers and their faces (cast.js), and Visual Novel's lists, which use the same rows. */
      .cb_defdot { display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; flex: none; cursor: pointer; }
      .cb_spk { border-radius: 8px; background: rgba(0,0,0,.15); padding: 6px; }
      .cb_spk + .cb_spk { margin-top: 6px; }
      .cb_spk_row { display: flex; align-items: center; gap: 6px; }
      .cb_spk_row .menu_button, .cb_emo_cell .menu_button, .cb_emo_row .menu_button { margin: 0; padding: 4px 8px; }
      .cb_spk_name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
      .cb_spk_name small { display: block; opacity: .6; font-size: .8em; }
      .cb_thumbbox { width: 40px; height: 40px; flex: none; border-radius: 8px; overflow: hidden; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; }
      .cb_thumbbox img { width: 100%; height: 100%; object-fit: cover; object-position: top; }
      .cb_thumbbox i { opacity: .35; }
      .cb_spk_head { padding: 0 0 6px 2px; }
      .cb_spk_head .cb_spk_name { font-weight: bold; }
      .cb_faces_row { cursor: pointer; user-select: none; padding: 4px; margin-bottom: 4px; border-radius: 8px; border: 1px solid var(--SmartThemeBorderColor, #444); transition: background .15s, border-color .15s; }
      .cb_faces_row:hover, .cb_faces_row:focus-visible { background: rgba(255,255,255,.06); border-color: var(--SmartThemeQuoteColor, #6cf); outline: none; }
      .cb_faces_row > .fa-solid { padding: 0 8px; opacity: .8; }
      .cb_faces_row + .cb_emo_grid { margin: 0 0 8px; }
      .cb_full_row { padding: 0 5px; }
      .cb_emo_grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; margin-top: 8px; }
      .cb_emo_cell { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 6px; border-radius: 6px; background: rgba(0,0,0,.2); }
      .cb_emo_cell .cb_thumbbox { width: 64px; height: 64px; }
      .cb_emo_label { font-size: .8em; text-align: center; word-break: break-word; }
      .cb_emo_row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
      .cb_dgrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 8px; }
      .ntr_mdgrid { display: grid; grid-template-columns: minmax(0, 1.7fr) repeat(4, minmax(0, 1fr)); gap: 2px 4px; align-items: center; margin: 8px 0; font-size: .9em; }
      .ntr_mdgrid .ntr_mdh { font-size: .8em; opacity: .7; text-align: center; line-height: 1.2; }
      .ntr_mdgrid label { display: flex; justify-content: center; margin: 0; cursor: pointer; }
      .ntr_mdgrid input { margin: 0; }
      .cb_dfield { display: flex; flex-direction: column; gap: 3px; font-size: .85em; }
      .cb_dfield input { margin: 0; font-family: monospace; }
      .ntr_rd_books { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0 4px; }
      .ntr_rd_books label { position: relative; cursor: pointer; }
      .ntr_rd_books input { position: absolute; opacity: 0; pointer-events: none; }
      .ntr_rd_books span { display: block; width: 24px; height: 24px; border-radius: 50%; border: 2px solid rgba(255,255,255,.25); box-sizing: border-box; }
      .ntr_rd_books label:hover span { border-color: rgba(255,255,255,.6); }
      .ntr_rd_books input:checked + span { border-color: var(--SmartThemeQuoteColor, #6cf); box-shadow: 0 0 0 2px rgba(0,0,0,.4); }
      .ntr_rd_books input:focus-visible + span { outline: 2px solid var(--SmartThemeQuoteColor, #6cf); outline-offset: 2px; }
      .cb_cur_name { flex: 1; min-width: 0; }
      .cb_cur_name small { display: block; opacity: .6; font-size: .8em; }
    `;

    // Asked even while NTR is off, so Elements can let go of its custom cursor.
    const elCss = callElements('css', s) || '';
    if (isOn()) cssString += overrideCss(s) + elCss + textFormatCss(s) + chatLookCss(s);
    // The chat gets its own layer. A see-through chat has none on most screens, so every key, streamed word and scroll
    // repainted all of it, avatar fades included.
    if (isOn()) cssString += '\n      #chat { will-change: transform; }\n';

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
    callElements('sync');
    syncPopouts();
    syncPins();
    markBubbleRuns();
    window.NTR.reader?.relayout();
  }

  // Banner rotation, and its height, gap, transparent areas and video sound, follow the Global / Char switch: Char uses
  // the character's own copy, Global these settings.
  const ROT_KEYS = { rotate: 'bannerRotate', rotateSec: 'bannerRotateSec', rotateFx: 'bannerRotateFx', rotateOrder: 'bannerRotateOrder' };
  const BANNER_LOOK_KEYS = { height: 'bannerHeight', gap: 'bannerGap', backdrop: 'bannerBackdrop', videoSound: 'bannerVideoSound' };
  // A character switched to Char starts on the Global kind, rotation and look settings.
  function startChar(r) {
    const s = settings();
    r.mode = s.bannerMode;
    for (const [k, g] of Object.entries(ROT_KEYS)) r[k] = s[g];
    for (const [k, g] of Object.entries(BANNER_LOOK_KEYS)) r[k] = s[g];
    r.scope = 'char';
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

  // Images, YouTube link and video: Char uses the character's own, Global the shared banner in the settings.
  const bannerSrc = (r) => (r && r.scope === 'char' ? r : settings().bannerGlobal);
  function getYouTubeId(url) {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    return match ? match[1] : null;
  }

  // The header banner and foreground images live in overlays.js, loaded once either is on (or the menu opens).
  const overlaysWanted = (s = settings()) => isOn() && !!(s.bannerOn || s.fgEnabled);
  function renderOverlays() {
    const m = window.NTR.overlays;
    if (m) m.render();
    else if (overlaysWanted()) loadModule('overlays').then((x) => x?.render());
  }

  function renderAll() {
    try {
      updateAvatarStyle();
    } catch (e) {
      console.error('[NTR render]', e);
    }
    renderOverlays();
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

  // A small menu under a button, like Move to folder on the Regex page. The button sits in a .ntr_menu box, and `html`
  // is the menu's buttons. A second click on the same button closes it; a page closes it on any other click.
  function popMenu(anchor, html) {
    const had = anchor.parentElement.querySelector('.ntr_pop');
    closePops(anchor.closest('.ntr_page') || document);
    if (had) return null;
    const pop = document.createElement('div');
    pop.className = 'ntr_pop';
    pop.innerHTML = html;
    pop.ntrAnchor = anchor;
    anchor.parentElement.appendChild(pop);
    anchor.setAttribute('aria-expanded', 'true');
    return pop;
  }
  function closePops(scope = document) {
    scope?.querySelectorAll('.ntr_pop').forEach((p) => { p.ntrAnchor?.setAttribute('aria-expanded', 'false'); p.remove(); });
  }

  // Dragging by a grip (.ntr_grip), with a mouse or a finger, on the Regexes and Agents pages. A copy of what's dragged
  // follows the pointer and its own place in the list becomes the gap that shows where it lands. Near the top or bottom
  // of the menu the page scrolls, even while the pointer stays still. Escape puts it back.
  //   pick(grip): what the grip drags, as { item, kind, scope } (scope: the box it stays in), or null.
  //   place(el, drag, after): moves drag.item to where the pointer is, over el; after(box) says if the pointer is in the
  //     lower half of box. Returns a header to light up as where it goes, if any.
  //   done(drag): the drag is over; drag.moved is false for a click or Escape.
  // Gives back { busy() }, true while dragging, so a page doesn't redraw under it.
  function dragSort(page, { pick, place, done }) {
    let drag = null;
    let raf = 0;
    const unlit = () => page.querySelectorAll('.ntr_drop').forEach((el) => el.classList.remove('ntr_drop'));
    const follow = () => {
      if (!drag.ghost) {
        const r = drag.item.getBoundingClientRect();
        const g = drag.item.cloneNode(true);
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
    // Only the finger (or mouse) that started the drag moves or drops it, so a second finger can't.
    const onMove = (e) => {
      if (e.pointerId !== drag.pointer) return;
      drag.moved = true;
      drag.x = e.clientX;
      drag.y = e.clientY;
      follow();
      aim();
      if (!raf) raf = requestAnimationFrame(scroll);
    };
    const end = (keep) => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      document.removeEventListener('keydown', onKey, true);
      cancelAnimationFrame(raf);
      raf = 0;
      const d = drag;
      drag = null;
      d.ghost?.remove();
      d.item.classList.remove('ntr_dragging');
      unlit();
      d.moved = keep && d.moved;
      done(d);
    };
    const onUp = (e) => { if (e.pointerId === drag.pointer) end(true); };
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); end(false); } };
    page.addEventListener('pointerdown', (e) => {
      const grip = e.target.closest('.ntr_grip');
      if (drag || !grip || e.button !== 0) return;
      const p = pick(grip);
      if (!p) return;
      e.preventDefault();
      closePops(page);
      drag = { ...p, scope: p.scope || page, moved: false, ghost: null, x: e.clientX, y: e.clientY, pointer: e.pointerId };
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onUp);
      document.addEventListener('keydown', onKey, true);
    });
    return { busy: () => !!drag };
  }

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
  const askImageUrl = (label = 'Image', anchor = null, perChat = true) => askUrl(anchor, `${label}: paste an image link (https://...)`, loadImg,
    'That link did not load as an image. Check it and try again.', perChat);

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
  const askVideoUrl = (label = 'Video', anchor = null, perChat = true) => askUrl(anchor, `${label}: paste a link to an mp4 or webm video (https://...)`, loadVideo,
    'That link did not load as a video. Use a direct link to an mp4 or webm file.', perChat);

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
      <div class="cb_row"><label>${label}</label><span><span id="m_${prefix}_${id}val" class="ntr_slval">${rangeNum(s, prefix + key)}</span>${NUM_RANGE[prefix + key][3]}</span></div>
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
          + `<div class="cb_row"><label id="m_${prefix}_fadelab">${FADE_PARTS[fadeCur][1]} Fade:</label><span><span id="m_${prefix}_fadeval" class="ntr_slval">${rangeNum(s, prefix + FADE_PARTS[fadeCur][0])}</span>%</span></div>
          <input type="range" id="m_${prefix}_fade" ${rangeAttrs(prefix + 'FadeTop')} value="${rangeNum(s, prefix + FADE_PARTS[fadeCur][0])}">
          <button type="button" id="m_${prefix}_fadeclr" class="menu_button" style="margin: 0; width: max-content;"><i class="fa-solid fa-eraser"></i> Clear Fades</button>`
          + '<div class="cb_hint" style="margin: 0;">Pick a side or corner, then set how much of the picture it fades. Lit cells have a fade on. Fades are a share of the avatar as it shows, so they keep their look at any Image Scale. Clear Fades sets all eight to 0.</div>')}

        ${grp('popout', `<div class="cb_sub">Screen Placement</div>
          <button type="button" id="m_${prefix}_place" class="menu_button" style="margin: 0; width: max-content;"><i class="fa-solid fa-up-down-left-right"></i> Edit Placement</button>
          <div class="cb_hint" style="margin: 0;">Hides the menu so you can drag the picture on screen. Press Done to come back. Position is on the chat panel: Top Left is the chat's top-left corner.</div>
          <div id="m_${prefix}_pstat" style="font-size: 0.8em; opacity: 0.75;">${escapeHTML(popMsg[prefix] || '')}</div>`
          + slider('ox', 'PopX', 'Move Horizontal:')
          + slider('oy', 'PopY', 'Move Vertical:'))}

        <div class="cb_sub">Effects</div>
        ${slider('bl', 'Blur', 'Blur Effect:')}

        <button id="m_${prefix}_reset" class="menu_button" style="margin-top: 6px; width: max-content;"><i class="fa-solid fa-rotate-left"></i> Reset ${title}</button>
        </div>
      </div>
      </div>
    `;
  }

  function openCombinedModal() {
    const prevScroll = document.querySelector('#cb_modal_overlay .ntr_body')?.scrollTop || 0;
    document.getElementById('cb_modal_overlay')?.remove();
    const s = settings();
    // Reasoning Block Design is part of Elements now.
    if (s.uiPage === 'reasoning') s.uiPage = 'elements';
    // Visual Novel Mode's settings are part of Reader Mode's page now.
    if (s.uiPage === 'vn') s.uiPage = 'reader';
    if (!PAGES.some(([id]) => id === s.uiPage)) s.uiPage = 'fg';

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
        ${layoutSectionHtml(s)}

        ${overlaysSectionHtml(s)}

        ${pageHtml('pfp', `
            ${card('', ovRow(s, 'ovNamesOn', 'Names and Pictures', ovPick(s, 'ovNames', [['show', 'Show'], ['hide', 'Hide']])
              + '<div class="cb_hint">Hide takes away avatars, names and timestamps, NTR Avatars and pop-outs included. With Message Details (Elements) on, its details show wherever they\'re ticked, except under the avatar.</div>'))}
            <div class="ntr_cols">
              ${getColHtml('ai', 'AI', s)}
              ${getColHtml('us', 'User', s)}
            </div>
            ${castPartHtml()}
        `, { sw: ['m_a_enable', s.avatarEnabled], legend: true })}

        ${elementsSectionHtml(s)}
        ${textSectionHtml(s)}
        ${displaySectionHtml(s)}
        ${agentsSectionHtml(s)}

        ${regexSectionHtml(s)}
        ${readerSectionHtml(s)}
        </div>
        </div>
      </div>
      <div id="ntr_edge" title="Drag to resize"></div>
      <div id="ntr_preview"></div>`;

    document.body.appendChild(overlay);

    bindCollapses(overlay, s);
    // Rotation waits while the Overlays page is open, showing the picked image, and starts a fresh count
    // when another page is picked or the menu closes.
    // The banner's rotation waits while the Overlays page is open (see overlays.js).
    const rotRestart = () => window.NTR.overlays?.rotRestart(s);
    bindPages(overlay, s, rotRestart);

    setupPanel(overlay, prevScroll);

    const close = () => { overlay.remove(); syncPopouts(); rotRestart(); };
    overlay.querySelector('.cb_close_btn').onclick = close;
    
    window.NTR.overlays?.bind(overlay, s);

    overlay.querySelector('#m_a_enable').onchange = function() {
      s.avatarEnabled = this.checked; save(); updateAvatarStyle();
    };
    
    bindThemes(overlay, s);
    bindLayout(overlay, s);
    bindWand(overlay, s);
    bindVNSection(overlay, s);
    bindReader(overlay, s);
    overlay.querySelector('#m_rx_enable').onchange = function() { s.rxEnabled = this.checked; save(); openCombinedModal(); };
    if (s.rxEnabled) window.NTR.regex?.bind(overlay, s);
    window.NTR.agents?.bind(overlay, s);
    window.NTR.cast?.bind(overlay, s);
    bindRows(overlay, s);
    bindDisplay(overlay, s);
    bindTextFormatting(overlay, s);
    callElements('bind', overlay, s);

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
      overlay.querySelector(`#m_${prefix}_fadeclr`).onclick = async function() {
        if (!(await askYes(this, `Set all eight ${label} avatar fades to 0?`, 'Clear'))) return;
        for (const [key] of Object.values(FADE_PARTS)) s[prefix + key] = 0;
        save();
        fadeSl.value = 0;
        col.querySelector(`#m_${prefix}_fadeval`).textContent = 0;
        col.querySelectorAll(`input[name="cbr_${prefix}fade"]`).forEach((r) => r.closest('label').classList.remove('cb_fon'));
        updateAvatarStyle();
      };

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
  // Lines in the column: Themes and Reader Mode, then your look (Layout to Overlays), then the pages that work on the chat itself.
  const NAV_SEP = new Set(['layout', 'regex']);
  // Pages that show what's planned and do nothing yet. Their icon stays greyed.
  const SOON = new Set();
  const navHtml = (cur) => PAGES.map(([id, icon, short, full]) => (NAV_SEP.has(id) ? '<div class="ntr_navsep" role="separator"></div>' : '') +
    `<button class="ntr_navi${id === cur ? ' on' : ''}${SOON.has(id) ? ' ntr_off' : ''}" data-page="${id}" title="${full}"><i class="fa-solid fa-fw ${icon}"></i><span>${short}</span></button>`).join('')
    + '<div class="ntr_navfill"></div>';
  // One page: a big title with the section's icon (both from PAGES) and, for a section that can be switched off, its switch.
  // A switched-off section's settings are dimmed (see syncPageOff). A note sits between the title and the settings and is never dimmed.
  function pageHtml(sec, body, { sw = null, legend = false, note = '' } = {}) {
    const [, icon, , title] = PAGES.find(([id]) => id === sec);
    return `
      <section class="ntr_page${(sw && !sw[1]) || SOON.has(sec) ? ' ntr_off' : ''}" data-page="${sec}"${settings().uiPage === sec ? '' : ' hidden'}>
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
  const FOLDED = new Set(['rd_book', 'rd_vn', 'vn_guide', 'vn_prompt', 'rb_css', 'rb_bgimg', 'rb_pattern', 'ov_scroll_css', 'ov_cursor_css', 'ov_qr_css', 'av_emo', 'av_chat', 'av_emo_list', 'av_spk', 'av_tags']);
  function subHead(sec, title) {
    if (FOLDED.has(sec)) return `<div class="cb_collapse_toggle ntr_fold" data-sec="${sec}" tabindex="0" role="button"><span>${title}</span><i class="fa-solid fa-chevron-right cb_chevron"></i></div>`;
    return `<div class="ntr_glab" data-sec="${sec}">${title}</div>`;
  }
  // Reader Mode's built-in books: the same photo in each cover color, in assets/books. The color is the menu's swatch.
  const BOOKS = [['brown', 'Brown', '#50301c'], ['oxblood', 'Oxblood', '#4a1b1a'], ['forest', 'Forest Green', '#1d3326'], ['navy', 'Navy', '#1c2740'],
    ['black', 'Black', '#1e1b19'], ['plum', 'Plum', '#3c2240'], ['sakura', 'Sakura', '#e39ab9']];
  const bookKey = (s) => (BOOKS.some(([v]) => v === s.rdBook) ? s.rdBook : 'brown');
  const bookUrl = (k) => `${NTR_BASE}assets/books/${BOOKS.some(([v]) => v === k) ? k : 'brown'}.webp`;
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
      const soon = SOON.has(p.dataset.page);
      p.classList.toggle('ntr_off', soon || (!!sw && !sw.checked));
      const off = soon || (sw ? !sw.checked : parts.length > 0 && parts.every((x) => !x.checked));
      overlay.querySelector(`.ntr_navi[data-page="${p.dataset.page}"]`)?.classList.toggle('ntr_off', off);
    });
  }

  // ===== Layout =====
  // The chat panel, SillyTavern's menu bar and the send bar can be moved (the Layout page and Edit Layout). There are two
  // layouts: Desktop for screens wider than 1000px, and Phone for 1000px or less, where SillyTavern switches to its phone
  // look. Each has its own settings: the Phone one's names start with layPh (see lk).
  const LAY_EDGES = ['top', 'bottom', 'left', 'right'];
  const LAY_WIDE = window.matchMedia('(width > 1000px)');
  // Pinned Blocks redraw too: a block can have its own box in one layout and stay in its message in the other, which
  // changes whether Where You're Reading watches the scrolling. An open Edit Layout names the other layout.
  LAY_WIDE.addEventListener('change', () => { syncLayoutPage(document.getElementById('cb_modal_overlay')); syncPins(); drawPlace(); });
  // A layout setting's name: lk(false, 'ChatX') is layChatX, lk(true, 'ChatX') is layPhChatX.
  const lk = (phone, name) => (phone ? 'layPh' : 'lay') + name;
  // The layout this page uses now.
  const phoneNow = () => !LAY_WIDE.matches;
  const layOn = (s) => isOn() && s.layEnabled;
  const sendFree = (s = settings()) => layOn(s) && s[lk(phoneNow(), 'Send')] === 'free';
  const pageFree = (s = settings()) => layOn(s) && s[lk(phoneNow(), 'Page')] === 'free';
  const banFree = (s = settings()) => layOn(s) && s[lk(phoneNow(), 'Ban')] === 'free';
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

    // Reader Mode's page bar (reader.js). Free, it has its own place, like a Free send bar. It's never narrower than its
    // buttons and page number need (--ntr-rdbar-min, from reader.js), and stays on the screen.
    if (v('Page') === 'free') {
      const w = `max(${n('PageW')}vw, var(--ntr-rdbar-min, 0px))`;
      css += cssRule('body #ntr_rd_bar', {
        position: 'fixed', left: `clamp(0px, ${n('PageX')}vw, 100vw - ${w})`, width: w, margin: '0', 'box-sizing': 'border-box',
        top: 'auto', bottom: `min(${n('PageB')}dvh, 100dvh - 2.5em)`, 'align-self': 'auto', 'border-radius': '8px', border: '1px solid var(--SmartThemeBorderColor)',
      });
    }

    // The header banner (overlays.js). Free, it has its own place and size, and sits above the chat panel's top (overlays.js
    // keeps it out of the messages and drops Overlap while it's Free).
    if (v('Ban') === 'free') {
      const w = n('BanW'), h = n('BanH');
      css += cssRule('body #cb_banner', {
        position: 'fixed', left: `min(${n('BanX')}vw, ${100 - w}vw)`, top: `min(${n('BanY')}dvh, ${100 - h}dvh)`, width: `${w}vw`, height: `${h}dvh`,
        right: 'auto', bottom: 'auto', margin: '0', 'z-index': '35',
      });
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
    window.NTR.overlays?.relayout();
    syncSendRoom();
    window.NTR.vn?.relayout?.();
    window.NTR.reader?.relayout();
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

  // The Layout page. It changes the layout this screen uses, like Edit Layout, apart from the settings marked Both Layouts
  // and Pinned Blocks' own settings. The page follows the window across 1000px.
  const layScope = (t) => `<span class="ntr_scope">${t}</span>`;

  function layoutSectionHtml(s) {
    const ph = phoneNow();
    const name = `<b class="m_l_now">${ph ? 'Phone' : 'Desktop'}</b>`;
    const btn = (id, icon, label) => `<button type="button" id="${id}" class="menu_button" style="margin: 0; width: max-content;"><i class="fa-solid ${icon}"></i> ${label}</button>`;
    return pageHtml('layout', `
        ${card('', `
          <div class="cb_hint" style="margin-top: 0;">Editing the ${name} layout. Desktop is wider than 1000px, Phone 1000px or less; resize the window to switch. Attached parts move with the chat panel; Free ones move on their own.</div>
          <div class="cb_actions" style="margin: 0;">${btn('m_l_edit', 'fa-up-down-left-right', 'Edit Layout')}</div>`)}
        ${card('Chat Panel', `
          <div class="m_l_over" data-lay="width phone">${ovRow(s, 'ovWidthOn', `Chat Width${layScope('Desktop Only')}`, rangeSlider(s, 'ovWidth'))}</div>
          <div class="cb_hint m_l_note" data-lay="width" hidden>Off because the chat panel was moved in Edit Layout. Reset it there to use this.</div>
          ${ovRow(s, 'ovMesGapOn', `Space Between Messages${layScope('Both Layouts')}`, rangeSlider(s, 'ovMesGap'))}`)}
        ${card('Menu Bar', `
          ${pills('lbaredge', [['top', 'Top'], ['bottom', 'Bottom'], ['left', 'Left'], ['right', 'Right']], s[lk(ph, 'BarEdge')])}
          <div class="cb_hint">Picking an edge puts the bar back at its start there.</div>
          <div class="cb_hint" style="margin-bottom: 0;">Pictures for the icons are under Elements, Menu Bar Icons.</div>`)}
        ${card('Send Bar', `
          ${pills('lsend', [['attached', 'Attached'], ['free', 'Free']], s[lk(ph, 'Send')])}
          <div class="m_l_over" data-lay="send">${ovRow(s, 'ovSendPosOn', `Attached Style${layScope('Both Layouts')}`, ovPick(s, 'ovSendPos', [['joined', 'Joined'], ['separate', 'Separate']])
            + ovWhen('ovSendPos', 'separate', ovLabel('Gap', rangeSlider(s, 'ovSendGap'))))}</div>
          <div class="cb_hint m_l_note" data-lay="send" style="margin-bottom: 0;" hidden>Not used while the send bar is Free.</div>`)}
        ${card('Page Bar', `
          ${pills('lpage', [['attached', 'Attached'], ['free', 'Free']], s[lk(ph, 'Page')])}
          <div class="cb_hint" style="margin-bottom: 0;">Reader Mode's page bar. It shows in Edit Layout only while Reader Mode is on.</div>`)}
        ${card('Banner', `
          ${pills('lban', [['attached', 'Attached'], ['free', 'Free']], s[lk(ph, 'Ban')])}
          <div class="cb_hint" style="margin-bottom: 0;">The header banner from Overlays. Free keeps one place for every character.</div>`)}
        ${card('', btn('m_l_reset', 'fa-rotate-left', 'Back to SillyTavern\'s Layout'))}
        ${card('Pinned Blocks', `
          <div class="cb_hint">Shows a block your regex draws, or your agents' results, in its own box. Settings are shared; place and size are kept per layout.</div>
          <div id="m_pin_list"></div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0 0;">${btn('m_pin_add', 'fa-plus', 'Add Pinned Block')}${btn('m_pin_dash', 'fa-gauge-high', 'Add Dashboard')}</div>
          <div class="cb_hint" style="margin-bottom: 0;">Add Dashboard makes a box for your agents' results, docked right, with every agent that saves in the chat ticked.</div>`)}
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
    // Free starts where the part is now, so it doesn't jump. A part that isn't on screen starts where it was last, or at
    // its starting place. The bars keep their bottom edge, the banner its top and height.
    const freeFrom = (part, id) => (v) => {
      const ph = phoneNow();
      const el = document.getElementById(id);
      const r = el?.getBoundingClientRect();
      if (v === 'free' && s[lk(ph, part)] !== 'free' && layOn(s) && r?.width) {
        const W = window.innerWidth, H = window.innerHeight;
        const pct = (x, size) => Math.round(x / size * 10000) / 100;
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
      if (!(await askYes(this, `Put the chat panel, menu bar, send bar, page bar and banner back where they start, in the ${ph ? 'Phone' : 'Desktop'} layout?`, 'Reset'))) return;
      for (const part of Object.values(LAY_PART)) for (const [k, x] of Object.entries(part.start)) s[lk(ph, k)] = x;
      changed();
    };
    syncLayoutPage(overlay);
  }

  // The Layout page's picks after Edit Layout changed them or the window crossed 1000px, and the settings that don't
  // apply to the layout this screen uses: Chat Width on Phone or once the chat panel has been moved, Attached Style while
  // the send bar is Free.
  function syncLayoutPage(overlay) {
    if (!overlay) return;
    const s = settings();
    const ph = phoneNow();
    for (const [name, val] of [['lbaredge', s[lk(ph, 'BarEdge')]], ['lsend', s[lk(ph, 'Send')]], ['lpage', s[lk(ph, 'Page')]], ['lban', s[lk(ph, 'Ban')]]]) {
      const r = overlay.querySelector(`input[name="cbr_${name}"][value="${val}"]`);
      if (r) r.checked = true;
    }
    overlay.querySelectorAll('.m_l_now').forEach((el) => { el.textContent = ph ? 'Phone' : 'Desktop'; });
    const over = { phone: ph, width: !ph && layOn(s) && s.layChatMoved, send: layOn(s) && s[lk(ph, 'Send')] === 'free' };
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
  const PIN_START = { desk: { x: 72, y: 12, w: 24, h: 40 }, phone: { x: 5, y: 12, w: 90, h: 35 } };
  const PIN_TAG = /^[a-z][a-z0-9-]{0,30}$/;
  const PIN_CLASS = /^[A-Za-z_-][\w-]{0,63}$/;
  const PIN_MAX = 20;
  // While a block is being picked in the chat (see pickPin), the boxes hide and the originals show.
  let pinPicking = false;
  const pinRect = (r, d) => ({ x: cardNum(r?.x, 'pinX', d.x), y: cardNum(r?.y, 'pinY', d.y), w: cardNum(r?.w, 'pinW', d.w), h: cardNum(r?.h, 'pinH', d.h), moved: cBool(r?.moved, true) });
  // Saved blocks, and blocks from theme files, made safe to use.
  function cleanPins(v) {
    const ids = new Set();
    return cList(v, PIN_MAX, (p) => {
      let id = cRef(p.id);
      if (!id || ids.has(id)) id = newId('pin');
      ids.add(id);
      return {
        id,
        name: cStr(p.name, 60).trim() || 'Pinned Block',
        from: cPick(p.from, ['chat', 'agents']),
        agents: [...new Set((Array.isArray(p.agents) ? p.agents : []).map(cRef).filter(Boolean))].slice(0, 10),
        tag: typeof p.tag === 'string' && PIN_TAG.test(p.tag) ? p.tag : '',
        classes: (Array.isArray(p.classes) ? p.classes : []).filter((c) => typeof c === 'string' && PIN_CLASS.test(c)).slice(0, 5),
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
  }
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
        p.classes = [...el.classList].filter((c) => PIN_CLASS.test(c)).slice(0, 5);
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
            <button type="button" class="menu_button m_pin_edit${pinOpen === p.id ? ' on' : ''}" title="Settings"><i class="fa-solid fa-gear"></i></button>
            <button type="button" class="menu_button m_pin_move" title="Move with Edit Layout"><i class="fa-solid fa-up-down-left-right"></i></button>
            <button type="button" class="menu_button danger_button m_pin_del" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </div>`;
      if (pinOpen !== p.id) return row;
      return row + `
          <div class="ntr_tpanel ntr_pinedit" data-pin="${p.id}">
            <label>Name <input type="text" class="text_pole m_pin_name" maxlength="60" value="${escapeHTML(p.name)}"></label>
            <div class="cb_plab">Source</div>
            ${pick(p, 'from', [['chat', 'A Block From the Chat'], ['agents', 'Agent Results']], p.from)}
            ${p.from === 'agents' ? `
            <div class="cb_plab">Agents</div>
            ${(Array.isArray(s.agents) ? s.agents : []).map((a) => `<label class="checkbox_label"><input type="checkbox" class="m_pin_ag" value="${escapeHTML(a.id)}" ${p.agents.includes(a.id) ? 'checked' : ''}><span>${escapeHTML(a.name)}</span></label>`).join('') || '<div class="cb_hint">No agents yet. Make one on the Agents page.</div>'}
            <div class="cb_hint">Needs the Agents page on and each agent's Results set to Saved in the Chat. They show in the Agents page's order.</div>
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
    if (!list) return;
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
    // A Dashboard: Agent Results docked right, with every agent that saves in the chat, starting on the message you're
    // reading.
    overlay.querySelector('#m_pin_dash').onclick = () => {
      if (s.layPins.length >= PIN_MAX) { toastr.info(`Up to ${PIN_MAX} Pinned Blocks.`, 'Dashboard'); return; }
      const agents = (Array.isArray(s.agents) ? s.agents : []).filter((a) => a?.keep === 'chat').map((a) => a.id);
      if (!agents.length) { toastr.info('Make an agent with Results set to Saved in the Chat on the Agents page first.', 'Dashboard'); return; }
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
      if (t.classList.contains('m_pin_name')) { p.name = t.value.trim().slice(0, 60) || 'Pinned Block'; changed(); render(); return; }
      if (t.classList.contains('m_pin_hide')) { p.hide = t.checked; changed(); return; }
      if (t.classList.contains('m_pin_ag')) {
        p.agents = t.checked ? [...new Set([...p.agents, t.value])].slice(0, 10) : p.agents.filter((id) => id !== t.value);
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

  // ===== UI Decor (the page was called UI Display, and its keys still start with ov) =====
  // SillyTavern's round avatars are the absence of a class. Avatar Shape lives in Avatar Management but keeps these keys.
  const AV_CLS = { round: '', rectangle: 'big-avatars', square: 'square-avatars', rounded: 'rounded-avatars' };

  function overrideCss(s) {
    let v = '';
    // Chat Width sits in Layout, so Layout's switch is the one that counts.
    if (s.layEnabled && s.ovWidthOn) v += `--sheldWidth: ${rangeNum(s, 'ovWidth')}vw !important; `;
    if (s.ovEnabled) {
      if (s.ovBlurOn) v += `--blurStrength: ${rangeNum(s, 'ovBlur')} !important; `;
      if (s.ovShadowOn) v += `--shadowWidth: ${rangeNum(s, 'ovShadow')} !important; `;
    }
    // Overall Font Scale sits in Text Formatting, so that section's switch is the one that counts.
    if (s.tfEnabled && s.ovFontOn) v += `--fontScale: ${rangeNum(s, 'ovFont')} !important; `;
    return v ? `\n      :root { ${v}}\n` : '';
  }

  // Names and Pictures: Hide takes away avatars, names and timestamps, NTR Avatars and pop-outs included.
  // It sits in Avatar Management, so that section's switch is the one that counts.
  const namesHidden = (s) => isOn() && s.avatarEnabled && s.ovNamesOn && s.ovNames === 'hide';
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

  // Interface Shape for the rest of the interface: SillyTavern's Menu Bar, drawers, side panels, menus and popups, and NTR's
  // own windows. Every corner follows it, wherever the part sits, even against the screen edge. Boxes inside them are a
  // little less round, so their corners sit inside the outer ones. Buttons, text boxes, checkboxes and sliders keep ST's
  // corners on Rounded and go square on Square. Messages, the send box, avatars, the VN box and Reasoning keep their own
  // Shape, and scrollbars what their Custom CSS sets.
  const UI_SHELLS = ['#top-bar', '.drawer-content', '#character_popup', '.popup', '.popup .popper-modal', '#dialogue_popup', '#select_chat_popup',
    '#extensionsMenu', '#options .options-content', '.list-group', '.draggable', '.select2-dropdown',
    '#cb_modal_overlay .cb_popup_content', '#ntr_pin_layer .ntr_pin_panel', '#ntr_map .ntr_map_panel'];
  const UI_INNER = ['#user-settings-block h4', '.standoutHeader', '.standoutHeader ~ .inline-drawer-content', '.settingsSectionWrap', '.extensions_info .extension_block',
    '#cb_modal_overlay .ntr_page .ntr_card', '#cb_modal_overlay .ntr_glab + .cb_collapse_content', '#cb_modal_overlay .ntr_fold', '#cb_modal_overlay .m_ag_frame', '#ntr_map .ntr_map_pop'];
  // Folded parts: the header's top corners while open, and the part under it the bottom ones.
  const UI_INNER_TOP = ['#cb_modal_overlay .ntr_fold.ntr_open', '#cb_modal_overlay .rx_open .ntr_fold.rx_fhead', '#cb_modal_overlay .ntr_fold.rx_uhead'];
  const UI_INNER_BOTTOM = ['#cb_modal_overlay .ntr_fold + .cb_collapse_content', '#cb_modal_overlay .ntr_page .ntr_card.rx_fbody', '#cb_modal_overlay .ntr_page .ntr_card.rx_loose'];
  // Small controls go square only inside these, so the send box, Quick Replies and the chat keep theirs. In a pinned block
  // only Agent Results count, since other blocks show copies of the chat. NTR's switches stay round.
  const UI_HOLDERS = ':is(#top-settings-holder, #character_popup, .popup, #dialogue_popup, #movingDivs, #cb_modal_overlay, #ntr_pin_layer .ntr_agres, #ntr_map)';
  const UI_CONTROLS = `:is(.menu_button, .text_pole, textarea, select, input[type="checkbox"]:not(${SWITCHES.map((x) => x.split(' ').pop()).join(', ')}),
    .select2-selection, .range-block-counter input, .neo-range-input, .neo-range-slider, input[type="range"], .ui-slider, .ui-slider-handle,
    .cb_hbtn, .cb_close_btn, .ntr_map_hb, .ntr_agres_btn)`;

  function uiShapeCss(s) {
    if (!s.ovShapeOn) return '';
    const square = s.ovShape === 'square';
    const r = square ? 0 : rangeNum(s, 'ovRound');
    const ri = Math.max(r - 5, Math.min(r, 2));
    const rule = (sels, radius) => cssRule(sels.map((x) => `body ${x}`).join(', '), { 'border-radius': radius });
    let css = rule(UI_SHELLS, `${r}px`) + rule(UI_INNER, `${ri}px`)
      + rule(UI_INNER_TOP, `${ri}px ${ri}px 0 0`) + rule(UI_INNER_BOTTOM, `0 0 ${ri}px ${ri}px`)
      // The tab that slides a pinned block out on a phone: its side against the block stays flat.
      + rule(['#ntr_pin_layer .ntr_pin_left .ntr_pin_tab'], `0 ${r}px ${r}px 0`) + rule(['#ntr_pin_layer .ntr_pin_right .ntr_pin_tab'], `${r}px 0 0 ${r}px`);
    if (square) css += cssRule(`body ${UI_HOLDERS} ${UI_CONTROLS}`, { 'border-radius': '0' });
    return css;
  }

  // Send Box Position: Separate stands the send box apart from the chat panel. It sits in Layout, so Layout's switch counts.
  const sendSeparate = (s) => s.layEnabled && s.ovSendPosOn && s.ovSendPos === 'separate';

  function chatLookCss(s) {
    let css = '';
    // Space Between Messages and Send Box Position sit in Layout; Names and Pictures in Avatar Management.
    if (s.layEnabled && s.ovMesGapOn) css += cssRule('#chat .mes:not(.last_mes)', { 'margin-bottom': `${rangeNum(s, 'ovMesGap')}px` });
    if (sendSeparate(s)) css += cssRule('#form_sheld', { 'margin-top': `${rangeNum(s, 'ovSendGap')}px` });
    if (namesHidden(s)) {
      css += cssRule('#chat .mes .mesAvatarWrapper, #chat .mes .ch_name .name_text, #chat .mes .ch_name .timestamp, #chat .mes .ch_name .timestamp-icon', { display: 'none' });
    }
    if (!s.ovEnabled) return css ? css + '\n' : '';
    const on = (k) => s[k + 'On'];
    const color = (k, opacity) => ovColorVal(s, k, opacity);
    const radius = (p) => ovRadius(s, p);
    const border = (p) => ovBorderVal(s, p);
    const fill = (p) => (s[`ov${p}Bg`] === 'clear' ? 'transparent' : color(`ov${p}BgColor`, `ov${p}BgOpacity`));
    const separate = sendSeparate(s);
    const noBlur = { 'backdrop-filter': 'none', '-webkit-backdrop-filter': 'none' };

    // Chat panel. Transparent also clears the boxes around it, as Make Chat Panel Transparent did.
    if (on('ovPanelBg') && s.ovPanelBg === 'clear') css += cssRule('#chat, #sheld, #chat-container, .chat-container', { background: 'transparent', ...noBlur, border: 'none', 'box-shadow': 'none' });
    else if (on('ovPanelBg')) css += cssRule('#chat', { 'background-color': fill('Panel') });
    // No line along the top, which stays flush with SillyTavern's top bar. The corners and the bottom line follow joinCss.
    const line = on('ovPanelBorder') && s.ovPanelBorder !== 'none';
    css += cssRule('#chat', {
      border: on('ovPanelBorder') ? border('Panel') : '',
      'border-top': line ? 'none' : '',
    });
    css += joinCss(s, separate) + uiShapeCss(s);

    // AI and User messages. A message with its own background or border gets the room ST's Bubbles style gives it,
    // unless NTR Avatars lays it out. Speech Bubbles put all of that on the message text instead.
    for (const p of ['Ai', 'Us']) {
      if (s.ovBubOn) { css += bubbleCss(s, p); continue; }
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
    return css ? css + '\n' : '';
  }

  // ----- Speech Bubbles -----
  // The bubble is the message text, so the avatar, name, buttons and reasoning block stay outside it. Reader Mode's
  // Book has its own pages, so it keeps the plain messages.
  const circle = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;
  // Thought's circles grow by a border's width (in the 100 x 100 box) for its line.
  const thoughtMask = (grow = 0) => svgMask(circle(62, 38, 17 + grow) + circle(24, 76, 10 + grow));
  // Tails, drawn for the bottom left corner in a 100 x 100 box and flipped for the other corners. Thought is two
  // circles beside the corner.
  const BUB_TAILS = {
    none: '',
    pointed: svgMask('M100 0L100 100L0 100Z'),
    curved: svgMask('M100 0C100 55 60 95 0 100L100 100Z'),
    thought: thoughtMask(),
  };
  // Text in Bubbles: As Is keeps Text Formatting's or SillyTavern's text color.
  const BUB_INK = { auto: '', dark: '#1a1a1a', light: '#f2f2f2' };
  const TAIL_PX = 14, THOUGHT_PX = 34;
  const bubblesOn = (s) => isOn() && s.ovEnabled && s.ovBubOn;
  // Whether a side's messages sit on the right.
  const bubRight = (s, p) => (s.ovBubAlign === 'sides' && p === 'Us') || (s.ovBubAlign === 'swap' && p === 'Ai');
  // NTR Avatars places the avatar itself when it's behind the message, popped out, or In Line above or below the text.
  // Anywhere else, the avatar goes to its message's side.
  function avatarPlaced(s, p) {
    const prefix = p.toLowerCase();
    return ntrAvatars(s, prefix) && (s[prefix + 'Style'] !== 'inline' || String(s[prefix + 'Side'])[1] === 'c');
  }

  function bubbleCss(s, p) {
    const on = (k) => s[k + 'On'];
    const sel = `body:not(.ntr_book) ${MES_SEL[p]}`;
    const right = bubRight(s, p);
    const top = s.ovBubTailPos === 'top';
    const placed = avatarPlaced(s, p);
    const clear = on(`ov${p}Bg`) && s[`ov${p}Bg`] === 'clear';
    // Unticked, the bubble takes SillyTavern's own message color, so it always shows.
    const fill = clear ? 'transparent' : on(`ov${p}Bg`) ? ovColorVal(s, `ov${p}BgColor`, `ov${p}BgOpacity`) : `var(${COLOR_FROM[`ov${p}BgColor`]})`;
    const line = on(`ov${p}Border`) && s[`ov${p}Border`] === 'line';
    const bw = line ? rangeNum(s, `ov${p}BorderWidth`) : 0;
    const r = on(`ov${p}Shape`) ? ovRadius(s, p) : 15;
    // A see-through bubble gets no tail: there's nothing to draw it in.
    const tail = clear ? '' : BUB_TAILS[s.ovBubTail] || '';
    // Pointed and Curved grow out of the bubble's corner, so that corner is square.
    const cornerKey = `border-${top ? 'top' : 'bottom'}-${right ? 'right' : 'left'}-radius`;
    const squared = tail && s.ovBubTail !== 'thought';
    // Room for the tail between the bubble and the avatar.
    const room = tail ? (s.ovBubTail === 'thought' ? THOUGHT_PX : TAIL_PX) + 4 : 0;
    const ink = BUB_INK[s.ovBubInk] || '';
    const noBlur = { 'backdrop-filter': 'none', '-webkit-backdrop-filter': 'none' };

    // The message itself loses SillyTavern's box, unless NTR Avatars draws the picture behind it.
    let css = placed ? '' : cssRule(sel, { 'background-color': 'transparent', border: 'none', 'box-shadow': 'none', ...noBlur });
    css += cssRule(sel, { 'flex-direction': 'row' });
    if (!placed) css += cssRule(`${sel} .mesAvatarWrapper`, { order: right ? '1' : '0' });
    if (right) css += cssRule(`${sel} .ch_name`, { 'flex-direction': 'row-reverse' }) + cssRule(`${sel} .ch_name > .flex1`, { 'justify-content': 'flex-end' });
    css += cssRule(`${sel} .mes_text`, {
      position: 'relative', overflow: 'visible', 'box-sizing': 'border-box',
      width: s.ovBubFit === 'shrink' ? 'fit-content' : '', 'max-width': `${rangeNum(s, 'ovBubWidth')}%`,
      'margin-left': right ? 'auto' : `${room}px`, 'margin-right': right ? `${room}px` : 'auto',
      padding: '8px 12px', 'border-radius': `${r}px`, ...(squared ? { [cornerKey]: '0' } : {}),
      'background-color': fill, border: line ? ovBorderVal(s, p) : 'none', ...(clear ? noBlur : {}),
      color: ink, 'text-shadow': ink ? 'none' : '',
    });
    // While editing, the box gets the whole width.
    css += cssRule(`${sel} .mes_text:has(textarea)`, { width: '100%', 'max-width': '100%' });

    if (tail) {
      // Each tail is placed from the padding edge, inside the border. A bordered tail is its line color with the fill on
      // top, a border's width in from the outside. Pointed and Curved cover the bubble's border where they join it.
      const h = right ? 'right' : 'left', v = top ? 'top' : 'bottom';
      const part = (size, offH, offV, color, mask = tail) => ({
        content: "''", display: 'block', position: 'absolute', [h]: `${offH}px`, [v]: `${offV}px`, width: `${size}px`, height: `${size}px`,
        'background-color': color, '-webkit-mask': `${mask} center / 100% 100% no-repeat`, mask: `${mask} center / 100% 100% no-repeat`,
        transform: `scale(${right ? -1 : 1}, ${top ? -1 : 1})`, 'pointer-events': 'none',
      });
      const lineColor = line ? ovColorVal(s, `ov${p}BorderColor`, `ov${p}BorderOpacity`) : '';
      if (s.ovBubTail === 'thought') {
        // Beside the bubble, by its top or bottom corner, the small circle farther out.
        const offH = -THOUGHT_PX - bw, offV = -Math.round(THOUGHT_PX / 4) - bw;
        if (bw) css += cssRule(`${sel} .mes_text::before`, part(THOUGHT_PX, offH, offV, lineColor, thoughtMask(bw * 100 / THOUGHT_PX)));
        css += cssRule(`${sel} .mes_text::after`, part(THOUGHT_PX, offH, offV, fill));
      } else {
        const outer = TAIL_PX + bw, inner = Math.round(outer - bw * 2.414);
        if (bw) css += cssRule(`${sel} .mes_text::before`, part(outer, -outer, -bw, lineColor));
        css += cssRule(`${sel} .mes_text::after`, part(inner, -inner, 0, fill));
      }
    }

    // Messages in a Row, Group: in a run of messages from one speaker, only the first (tail at the top) or the last (tail at the
    // bottom) has the tail and the avatar, and the messages sit closer (see markBubbleRuns).
    if (s.ovBubGroup === 'group') {
      const rest = `${sel}${top ? '.ntr_bub_prev' : '.ntr_bub_next'}`;
      if (tail) css += cssRule(`${rest} .mes_text::before, ${rest} .mes_text::after`, { display: 'none' });
      if (squared) css += cssRule(`${rest} .mes_text`, { [cornerKey]: `${r}px` });
      // The hidden avatar keeps its width, so the bubbles line up, but not its height. On a phone the text needs the
      // room more.
      if (!placed) {
        css += cssRule(`${rest} .mesAvatarWrapper`, { visibility: 'hidden' }) + cssRule(`${rest} .mesAvatarWrapper .avatar`, { height: '0', 'min-height': '0', 'aspect-ratio': 'auto' });
        css += `\n      @media (max-width: 1000px) {${cssRule(`${rest} .mesAvatarWrapper`, { display: 'none' })} }`;
      }
      css += cssRule(`${sel}.ntr_bub_next`, { 'padding-bottom': '2px' }) + cssRule(`${sel}.ntr_bub_prev`, { 'padding-top': '2px' });
    }
    return css;
  }

  // Marks each message by whether the one before it (ntr_bub_prev) or after it (ntr_bub_next) is from the same speaker.
  // By name, so two characters in a group chat stay apart. In Reader Mode, only the messages on the page on screen
  // count, so each page's runs keep their tail and avatar (Reader Mode calls refreshPins on every page change).
  function markBubbleRuns() {
    const chat = document.getElementById('chat');
    if (!chat) return;
    const s = settings();
    const on = bubblesOn(s) && s.ovBubGroup === 'group';
    const page = window.NTR.reader?.page?.();
    const shown = (m) => !page || (Number(m.getAttribute('mesid')) >= page[0] && Number(m.getAttribute('mesid')) <= page[1]);
    let prev = null;
    for (const m of chat.querySelectorAll(':scope > .mes')) {
      const same = on && !!prev && shown(prev) && shown(m) && prev.getAttribute('is_user') === m.getAttribute('is_user') && prev.getAttribute('ch_name') === m.getAttribute('ch_name');
      m.classList.toggle('ntr_bub_prev', same);
      if (prev) prev.classList.toggle('ntr_bub_next', same);
      prev = m;
    }
    prev?.classList.remove('ntr_bub_next');
  }

  // Bubble Styles: what each one sets. The menu shows Custom once anything differs. Tail Position stays as it is.
  const bubSides = (look) => Object.fromEntries(['Ai', 'Us'].flatMap((p) => Object.entries(look(p)).map(([k, v]) => [`ov${p}${k}`, v])));
  const bubColors = (round, ai, us, border = null) => bubSides((p) => ({
    ShapeOn: true, Shape: 'rounded', Round: round, BgOn: true, Bg: 'color', BgColor: p === 'Us' ? us : ai, BgOpacity: 100,
    BorderOn: true, ...(border ? { Border: 'line', BorderColor: border[0], BorderWidth: border[1], BorderOpacity: 100 } : { Border: 'none' }),
  }));
  const BUB_PRESETS = {
    imessage: ['iMessage', { ovBubTail: 'curved', ovBubAlign: 'sides', ovBubWidth: 85, ovBubFit: 'shrink', ovBubGroup: 'group', ovBubInk: 'auto',
      ...bubColors(18, 'rgba(38, 37, 42, 1)', 'rgba(10, 132, 255, 1)') }],
    whatsapp: ['WhatsApp', { ovBubTail: 'pointed', ovBubAlign: 'sides', ovBubWidth: 85, ovBubFit: 'shrink', ovBubGroup: 'group', ovBubInk: 'auto',
      ...bubColors(8, 'rgba(32, 44, 51, 1)', 'rgba(0, 92, 75, 1)') }],
    discord: ['Discord', { ovBubTail: 'none', ovBubAlign: 'left', ovBubWidth: 100, ovBubFit: 'fill', ovBubGroup: 'group', ovBubInk: 'auto',
      ...bubSides(() => ({ ShapeOn: false, BgOn: true, Bg: 'clear', BorderOn: true, Border: 'none' })) }],
    comic: ['Comic', { ovBubTail: 'pointed', ovBubAlign: 'sides', ovBubWidth: 85, ovBubFit: 'shrink', ovBubGroup: 'group', ovBubInk: 'dark',
      ...bubColors(20, 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 1)', ['rgba(0, 0, 0, 1)', 3]) }],
  };
  const bubPreset = (s) => Object.keys(BUB_PRESETS).find((k) => Object.entries(BUB_PRESETS[k][1]).every(([key, v]) => s[key] === v)) || 'custom';

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
  function ovSlider(s, key, unit, min, max, step) {
    const v = rangeNum(s, key);
    return `
      <div class="cb_row"><input type="range" class="m_o_sl" data-key="${key}" min="${min}" max="${max}" step="${step}" value="${v}" style="flex:1;"><span style="min-width:60px;text-align:right;"><span id="m_o_${key}val" class="ntr_slval">${v}</span>${unit}</span></div>`;
  }
  function ovColor(s, key) {
    return customElements.get('toolcool-color-picker')
      ? `<toolcool-color-picker class="m_o_col" data-key="${key}" color="${escapeHTML(s[key])}"></toolcool-color-picker>`
      : `<input type="color" class="m_o_col" data-key="${key}" value="${toHex(s[key])}">`;
  }
  function ovText(s, key, placeholder = '', max = 100) {
    return `<input type="text" class="text_pole m_o_lbl" data-key="${key}" value="${escapeHTML(s[key])}" maxlength="${max}" placeholder="${escapeHTML(placeholder)}" style="width:100%;">`;
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

  // The rows every page builds with ovRow, rangeSlider, ovColor, ovText, ovFont, ovPick and ovWhen, bound once for the
  // whole menu. It runs after the modules', Themes', Layout's and Reader Mode's binders and before UI Decor's, Text
  // Formatting's and Elements', so these handlers replace any set on the same rows earlier. Empty colors get
  // SillyTavern's own (stColor).
  function bindRows(overlay, s) {
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
    overlay.querySelectorAll('.m_o_lbl').forEach((el) => {
      el.onchange = () => {
        s[el.dataset.key] = el.value.slice(0, strMax(el.dataset.key));
        save();
        updateAvatarStyle();
      };
    });
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
  const TEXT_ALIGN = ['left', 'right', 'center', 'justify'];
  const FX = ['glow', 'shadow', 'outline'];
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
  const MD_SEP = { dot: ' · ', bar: ' | ', slash: ' / ', space: '   ' };

  // Quick Replies' Alignment. Safe keeps the first buttons in reach when one scrolling row is wider than the bar.
  const QR_ALIGN = { left: 'flex-start', center: 'safe center', right: 'safe flex-end' };
  const PICK_KEYS = { tfNameWeight: Object.keys(NAME_WEIGHT), tfUserAlign: TEXT_ALIGN, tfAiAlign: TEXT_ALIGN, tfPlatePos: ['row', 'edge'], rbBorderStyle: RB_BOX_BORDERS, rbBtnBorder: RB_BORDERS, rbBtnShape: Object.keys(RB_SHAPE), rbBoxShape: Object.keys(RB_BOX_SHAPE), rbPat: RB_PATS, rbPatFade: Object.keys(RB_FADE), rbPatShade: ['light', 'dark'], rbTyping: ['off', 'think', 'both'], rbArrow: RB_ARROW, rbArrowTurn: Object.keys(RB_TURN), rbArrowAnim: ['off', ...Object.keys(RB_ANIM)], rbBgFit: ['cover', 'tile'], rbBtnFx: RB_FX, rbEdgeFx: RB_FX, bannerRotateFx: ['fade', 'swap'], bannerRotateOrder: ['order', 'shuffle'] };
  for (const p of FX_PARTS) PICK_KEYS[p + 'Fx'] = FX;
  // The other pick-one settings a theme holds. The Visual Novel and opening choices match the menus in vn.js and opening.js.
  Object.assign(PICK_KEYS, {
    bannerBackdrop: ['wallpaper', 'panel'], ovAvatar: Object.keys(AV_CLS), ovShape: OV_SHAPES, ovNames: ['show', 'hide'], ovSendPos: ['joined', 'separate'],
    layBarEdge: LAY_EDGES, laySend: ['attached', 'free'], layPhBarEdge: LAY_EDGES, layPhSend: ['attached', 'free'],
    layPage: ['attached', 'free'], layPhPage: ['attached', 'free'], layBan: ['attached', 'free'], layPhBan: ['attached', 'free'],
    nodeShape: ['rounded', 'round', 'square', 'rect'], artBg: ['none', 'dusk', 'night', 'room', 'forest', 'custom'], artSprite: ['builtin', 'custom', 'none'],
    opPos: ['upper', 'center', 'lower'], opExit: ['stay', 'fade', 'rise'], opTrans: ['color', 'cross'],
    rdStyle: ['plain', 'book'], rdBook: BOOKS.map(([v]) => v), emoSource: ['tags', 'agent'],
    ovBubTail: Object.keys(BUB_TAILS), ovBubTailPos: ['top', 'bottom'], ovBubAlign: ['left', 'sides', 'swap'], ovBubFit: ['fill', 'shrink'], ovBubGroup: ['group', 'each'], ovBubInk: Object.keys(BUB_INK),
    ovQrWrap: ['wrap', 'scroll'], ovQrAlign: Object.keys(QR_ALIGN),
    mdDate: ['long', 'short'], mdSep: Object.keys(MD_SEP),
  });
  for (const p of ['Panel', ...BOX_PARTS]) {
    Object.assign(PICK_KEYS, { [`ov${p}Bg`]: ['clear', 'color'], [`ov${p}Border`]: ['none', 'line'] });
    if (p !== 'Panel') PICK_KEYS[`ov${p}Shape`] = OV_SHAPES;
  }
  PICK_KEYS.rbBgPos = POS_GRID.map(([v]) => v);
  for (const p of ['ai', 'us']) {
    Object.assign(PICK_KEYS, { [p + 'Style']: ['inline', 'backdrop', 'popout'], [p + 'Side']: POS_GRID.map(([v]) => v), [p + 'Fit']: ['cover', 'contain', 'original'], [p + 'Shape']: SHAPE_OPTS.map(([v]) => v) });
  }
  // Where an empty color starts from: SillyTavern's own value for the same thing.
  const COLOR_FROM = {
    rbBorder: '--reasoning-body-color', rbBtnColor: '--grey30', rbBtnText: '--SmartThemeBodyColor', rbBtnBorderColor: '--SmartThemeBodyColor', rbBoxColor: '--SmartThemeBlurTintColor', rbPatColor: '--SmartThemeQuoteColor', rbArrowColor: '--SmartThemeBodyColor',
    tfNameColor: '--SmartThemeBodyColor', tfPlateBg: '--SmartThemeQuoteColor', tfPlateBorder: '--SmartThemeBorderColor',
    tfUserMain: '--SmartThemeBodyColor', tfUserEm: '--SmartThemeEmColor', tfUserUnder: '--SmartThemeUnderlineColor', tfUserQuote: '--SmartThemeQuoteColor',
    tfAiMain: '--SmartThemeBodyColor', tfAiEm: '--SmartThemeEmColor', tfAiUnder: '--SmartThemeUnderlineColor', tfAiQuote: '--SmartThemeQuoteColor',
    tfNameFxColor: '--SmartThemeShadowColor', tfUserFxColor: '--SmartThemeShadowColor', tfAiFxColor: '--SmartThemeShadowColor',
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

  // Nameplate: a color or picture, border and roundness behind the name, on chat messages and the Visual Novel name tag.
  // The picture covers the color. On the Top Edge lifts the name onto the top edge of its message's box, like the Visual
  // Novel name tag. It keeps its place in the row, so the row stays as tall as the name and nothing in the message goes
  // under it. It stays on one line (a long name ends in ...), so the room above the message is half its height. NTR
  // Avatars behind the message or popped out clip the message, so there, and in Reader Mode's Book, the name stays in its row.
  function nameplateCss(s, on, col, ns) {
    const img = cUrl(s.tfPlateImg);
    const border = on('tfPlateBorder') ? `${rangeNum(s, 'tfPlateBorderWidth')}px solid ${col('tfPlateBorder') || 'var(--SmartThemeBorderColor)'}` : '';
    const plate = {
      'background-color': col('tfPlateBg'),
      'background-image': img ? `url("${img}")` : '',
      'background-size': img ? 'cover' : '',
      'background-position': img ? 'center' : '',
      border,
      'border-radius': on('tfPlateRound') ? `${rangeNum(s, 'tfPlateRound')}px` : '',
    };
    const boxed = !!(plate['background-color'] || img || border);
    let css = cssRule('.mes .name_text', { ...plate, padding: boxed ? '.1em .6em' : '' }) + cssRule('#cb_node .cb_n_name', plate);
    if (!on('tfPlatePos') || s.tfPlatePos !== 'edge') return css;
    // The plate's height: one line at line-height 1.3, its padding (.1em top and bottom) and its border.
    const half = `calc((var(--mainFontSize) * ${+((ns || 1) * (boxed ? 1.5 : 1.3)).toFixed(3)} + ${border ? 2 * rangeNum(s, 'tfPlateBorderWidth') : 0}px) / 2)`;
    for (const [prefix, flag] of [['ai', 'false'], ['us', 'true']]) {
      const m = `body:not(.ntr_book) #chat .mes[is_user="${flag}"]`;
      if (ntrAvatars(s, prefix) && s[prefix + 'Style'] !== 'inline') continue;
      const one = { 'line-height': '1.3', 'white-space': 'nowrap', overflow: 'hidden', 'text-overflow': 'ellipsis', 'min-width': '0' };
      // NTR Avatars In Line above the text puts the name row under the avatar. There the name leaves its row for the
      // message's top edge, and the avatar moves down to clear it.
      const side = String(s[prefix + 'Side']);
      if (ntrAvatars(s, prefix) && side[1] === 'c' && side[0] !== 'b') {
        css += cssRule(`${m} .ch_name .name_text`, { ...one, position: 'absolute', 'z-index': '2', top: '0', transform: 'translateY(-50%)', 'max-width': 'calc(100% - 30px)' });
        css += cssRule(m, { 'margin-top': `calc(${half} + 2px)`, 'padding-top': `max(10px, calc(${half} + 4px))` });
        // Speech Bubbles put this side's name row on the right: the name lines up with the row's right end instead of
        // running past the message.
        const p = prefix === 'ai' ? 'Ai' : 'Us';
        if (bubblesOn(s) && bubRight(s, p)) css += cssRule(`body:not(.ntr_book) #chat .mes[is_user="${flag}"] .ch_name .name_text`, { left: 'auto', right: '10px' });
        continue;
      }
      // 10px is SillyTavern's room between the message's top edge and its name row.
      css += cssRule(`${m} .ch_name .name_text`, { ...one, position: 'relative', 'z-index': '2', transform: 'translateY(calc(-50% - 10px))', 'max-width': '100%' });
      // The row stays one line and its parts may shrink, so a long name ends in ... instead of pushing the time and buttons away.
      css += cssRule(`${m} .ch_name > .flex1`, { 'min-width': '0' })
        + cssRule(`${m} .ch_name > .flex1 > .flex-container`, { 'min-width': '0', 'flex-wrap': 'nowrap' })
        + cssRule(`${m} .ch_name :is(.timestamp, .timestamp-icon, .mes_ghost)`, { 'flex-shrink': '0' });
      // SillyTavern cuts off anything above the message's content; sideways it still does. Its overflow also let the
      // content shrink to the message's width, so that's kept with min-width.
      css += cssRule(`${m} .mes_block`, { overflow: 'clip visible', 'min-width': '0' });
      css += cssRule(m, { 'margin-top': `calc(${half} + 2px)` });
    }
    return css;
  }

  // What the Reasoning Block and Text Formatting CSS read from a setting: its tick, and its color, font or size while ticked.
  function cssReaders(s) {
    const on = (k) => s[k + 'On'];
    return {
      on,
      col: (k) => (on(k) && COLOR_RE.test(s[k]) ? s[k] : ''),
      font: (k) => { const f = on(k) ? cleanFont(s[k]) : ''; return f ? `"${f}", var(--mainFontFamily)` : ''; },
      size: (k) => (on(k) ? rangeNum(s, k) : 0),
    };
  }

  function textFormatCss(s) {
    if (!s.tfEnabled) return '';
    const { on, col, font, size } = cssReaders(s);
    let css = '';

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
    css += nameplateCss(s, on, col, ns);

    // User and AI message text. The Visual Novel dialogue box uses the AI's.
    const align = (p) => (on(p + 'Align') && TEXT_ALIGN.includes(s[p + 'Align']) ? s[p + 'Align'] : '');
    for (const [p, flag] of [['tfUser', 'true'], ['tfAi', 'false']]) {
      const m = `.mes[is_user="${flag}"] .mes_text`;
      const sz = size(p + 'Size');
      css += cssRule(m, { color: col(p + 'Main'), 'font-family': font(p + 'Font'), 'font-size': sz ? `calc(var(--mainFontSize) * ${sz})` : '', 'text-align': align(p), ...fxProps(s, p) });
      // Lists, tables, code blocks and the edit box keep SillyTavern's alignment: bullets, columns and code don't center or justify well.
      if (align(p)) css += cssRule(`${m} :is(ul, ol, table, pre, textarea)`, { 'text-align': 'start' });
      css += cssRule(`${m} i, ${m} em`, { color: col(p + 'Em') });
      css += cssRule(`${m} u`, { color: col(p + 'Under') });
      css += cssRule(`${m} q`, { color: col(p + 'Quote') });
      if (col(p + 'Em')) css += cssRule(`${m} q i, ${m} q em`, { color: 'inherit' });
    }
    css += cssRule('#cb_node .cb_n_text', { color: col('tfAiMain'), 'font-family': font('tfAiFont'), 'text-align': align('tfAi'), ...fxProps(s, 'tfAi') });
    css += cssRule('#cb_node .cb_n_text em', { color: col('tfAiEm') });
    css += cssRule('#cb_node .cb_q', { color: col('tfAiQuote') });
    if (col('tfAiEm')) css += cssRule('#cb_node .cb_q em', { color: 'inherit' });
    return css ? css + '\n' : '';
  }

  // Custom CSS for the reasoning button, box and arrow, each inside its part's selector. Every Custom CSS box gets its own
  // style tag (see syncCustomCss in elements.js), so a typo can't break the extension's other styles.
  const RB_CSS = [['rbBtnCss', '.mes_reasoning_header'], ['rbCss', '.mes_reasoning'], ['rbArrowCss', '.mes_reasoning_details .mes_reasoning_arrow']];
  // The reasoning Custom CSS boxes that `get` gives text for, each inside its part's selector.
  const rbCssText = (get) => RB_CSS.map(([k, sel]) => {
    const c = String(get(k) || '').slice(0, 2000).trim();
    return c ? `${sel} { ${c} }` : '';
  }).filter(Boolean).join('\n');
  function cssTag(id, v) {
    let el = document.getElementById(id);
    if (!v) { el?.remove(); return; }
    if (!el) { el = document.createElement('style'); el.id = id; document.head.appendChild(el); }
    // Rewriting the same text still makes the browser redo the page's styles, and some tags are set many times a second.
    if (el.textContent !== v) el.textContent = v;
  }

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

  const FONT_NOTE = 'Use a font on your device, or any font from Google Fonts by its name or a link to it. Google fonts load on their own while you\'re online. Type the name exactly as it\'s written.';

  function textSectionHtml(s) {
    const part = (p) => `
          ${ovRow(s, p + 'FontOn', 'Font', ovFont(s, p + 'Font'))}
          ${ovRow(s, p + 'SizeOn', 'Size', rangeSlider(s, p + 'Size'))}
          ${ovRow(s, p + 'AlignOn', 'Alignment', pills(p.toLowerCase() + 'align', [['left', 'Left', 'SillyTavern\'s default'], ['right', 'Right'], ['center', 'Center'], ['justify', 'Justify']], s[p + 'Align'])
            + '<div class="cb_hint">Lists, tables and code blocks stay as they are. Justify can leave wide gaps between words in narrow messages.</div>')}
          ${ovRow(s, p + 'MainOn', 'Main Text Color', ovColor(s, p + 'Main'))}
          ${ovRow(s, p + 'EmOn', 'Italics Color', ovColor(s, p + 'Em'))}
          ${ovRow(s, p + 'UnderOn', 'Underline Color', ovColor(s, p + 'Under'))}
          ${ovRow(s, p + 'QuoteOn', 'Quote Color', ovColor(s, p + 'Quote'))}${fxRows(s, p)}`;
    return pageHtml('text', `
          <div class="cb_hint">Styles chat text. Also used in the Visual Novel box: AI Text for the dialogue, Names and Nameplate for the name tag. Tick a setting to change it; untick it to go back to ST's look. ${FONT_NOTE}</div>
          ${card('', ovRow(s, 'ovFontOn', 'Overall Font Scale', rangeSlider(s, 'ovFont') + '<div class="cb_hint">Scales all of SillyTavern\'s text, menus included. The Size settings below are on top of this.</div>'))}
          ${subHead('tf_names', 'Names')}
          <div class="cb_collapse_content">
            <div class="cb_hint">The name at the top of each message, for both you and the character.</div>
            ${ovRow(s, 'tfNameFontOn', 'Font', ovFont(s, 'tfNameFont'))}
            ${ovRow(s, 'tfNameSizeOn', 'Size', rangeSlider(s, 'tfNameSize'))}
            ${ovRow(s, 'tfNameWeightOn', 'Weight', pills('tfnweight', [['normal', 'Normal'], ['bold', 'Bold', 'SillyTavern\'s default'], ['extra', 'Extra Bold']], s.tfNameWeight))}
            ${ovRow(s, 'tfNameColorOn', 'Color', ovColor(s, 'tfNameColor'))}${fxRows(s, 'tfName')}
          </div>
          ${subHead('tf_plate', 'Nameplate')}
          <div class="cb_collapse_content">
            <div class="cb_hint">A box behind the name, on chat messages and the Visual Novel name tag.</div>
            ${ovRow(s, 'tfPlateBgOn', 'Color', ovColor(s, 'tfPlateBg'))}
            <div class="cb_cur_slot">
              <div class="cb_cur_row">
                <div class="cb_cur_prev ntr_rd_pic" id="m_plate_prev"></div>
                <span class="cb_cur_name">Picture<small>Covers the box, over the Color. A wide picture works best.</small></span>
                <button class="menu_button" id="m_plate_up" title="Upload"><i class="fa-solid fa-upload"></i></button>
                <button class="menu_button" id="m_plate_url" title="Use a link"><i class="fa-solid fa-link"></i></button>
                <button class="menu_button" id="m_plate_clr" title="Remove picture"><i class="fa-solid fa-rotate-left"></i></button>
              </div>
              <input type="file" id="m_plate_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
            </div>
            ${ovRow(s, 'tfPlateBorderOn', 'Border', ovColor(s, 'tfPlateBorder') + ovLabel('Width', rangeSlider(s, 'tfPlateBorderWidth')))}
            ${ovRow(s, 'tfPlateRoundOn', 'Roundness', rangeSlider(s, 'tfPlateRound'))}
            ${ovRow(s, 'tfPlatePosOn', 'Position', pills('tfplatepos', [['row', 'Name Row', 'SillyTavern\'s default'], ['edge', 'On the Top Edge']], s.tfPlatePos)
              + '<div class="cb_hint">On the Top Edge lifts the name onto the top edge of its message and adds room above each message. A long name ends in ... With NTR Avatars behind the message or popped out, and in Reader Mode\'s Book, the name stays in its row.</div>')}
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
    overlay.querySelector('#m_tf_enable').onchange = function() { s.tfEnabled = this.checked; save(); updateAvatarStyle(); };
    onPills(overlay, 'tfnweight', (v) => { s.tfNameWeight = v; save(); updateAvatarStyle(); });
    for (const p of ['tfUser', 'tfAi']) onPills(overlay, p.toLowerCase() + 'align', (v) => { s[p + 'Align'] = v; save(); updateAvatarStyle(); });
    onPills(overlay, 'tfplatepos', (v) => { s.tfPlatePos = v; save(); updateAvatarStyle(); });
    bindNameplatePic(overlay, s);
    for (const p of FX_PARTS) onPills(overlay, p.toLowerCase() + 'fx', (v) => { s[p + 'Fx'] = v; save(); updateAvatarStyle(); });
  }

  // Nameplate Picture: Upload / Link / Remove.
  function bindNameplatePic(overlay, s) {
    const prev = overlay.querySelector('#m_plate_prev');
    const render = () => {
      prev.innerHTML = s.tfPlateImg ? `<img src="${escapeHTML(s.tfPlateImg)}" alt="">` : '<i class="fa-solid fa-image"></i>';
      overlay.querySelector('#m_plate_clr').disabled = !s.tfPlateImg;
    };
    const setImg = (url) => {
      const old = s.tfPlateImg;
      s.tfPlateImg = url;
      save();
      updateAvatarStyle();
      render();
      deleteFileIfUnused(old);
    };
    const file = overlay.querySelector('#m_plate_file');
    overlay.querySelector('#m_plate_up').onclick = () => file.click();
    overlay.querySelector('#m_plate_url').onclick = async function() {
      const url = await askImageUrl('Nameplate picture', this, false);
      if (url) setImg(url);
    };
    overlay.querySelector('#m_plate_clr').onclick = () => setImg('');
    file.onchange = async () => {
      if (!file.files.length) return;
      try {
        setImg(await uploadImage(file.files[0], 'plate', { maxWidth: 800 }));
      } catch (e) {
        console.error('[NTR nameplate upload]', e);
        toastr.error(e.message || 'Upload failed', 'Nameplate');
      }
      file.value = '';
    };
    render();
  }

  // Pick-one rows of UI Decor (and the rows that moved from it to Layout and Avatars): the radio name is the key in lower case, with "o" in front.
  const ovPick = (s, k, opts) => pills('o' + k.toLowerCase(), opts, s[k]);
  // Shown only while a pick has a certain value, like Roundness under Rounded.
  const ovWhen = (k, v, inner) => `<div class="m_o_when" data-when="${k}" data-val="${v}">${inner}</div>`;
  const ovLabel = (label, inner) => `<div class="cb_hint" style="margin:6px 0 0;">${label}</div>${inner}`;

  // Shape, Background and Border rows of a part in Panel or BOX_PARTS.
  const ovShapeRow = (s, p) => ovRow(s, `ov${p}ShapeOn`, 'Shape', ovPick(s, `ov${p}Shape`, [['rounded', 'Rounded'], ['square', 'Square']])
    + ovWhen(`ov${p}Shape`, 'rounded', ovLabel('Roundness', rangeSlider(s, `ov${p}Round`))));
  const ovBgRow = (s, p, hint = '') => ovRow(s, `ov${p}BgOn`, 'Background', ovPick(s, `ov${p}Bg`, [['clear', 'Transparent'], ['color', 'Color']])
    + ovWhen(`ov${p}Bg`, 'color', ovLabel('Color', ovColor(s, `ov${p}BgColor`)) + ovLabel('Opacity', rangeSlider(s, `ov${p}BgOpacity`))) + hint);
  const ovBorderRow = (s, p) => ovRow(s, `ov${p}BorderOn`, 'Border', ovPick(s, `ov${p}Border`, [['none', 'None'], ['line', 'Line']])
    + ovWhen(`ov${p}Border`, 'line', ovLabel('Line Color', ovColor(s, `ov${p}BorderColor`)) + ovLabel('Thickness', rangeSlider(s, `ov${p}BorderWidth`)) + ovLabel('Opacity', rangeSlider(s, `ov${p}BorderOpacity`))));

  function displaySectionHtml(s) {
    const row = (onKey, label, inner) => ovRow(s, onKey, label, inner);
    const sl = (key) => rangeSlider(s, key);
    const shape = (p) => ovShapeRow(s, p);
    const bg = (p, hint = '') => ovBgRow(s, p, hint);
    const border = (p) => ovBorderRow(s, p);
    return pageHtml('display', `
          <div class="cb_hint">Changes how SillyTavern looks without touching its own settings. Tick a setting to change it; untick it to go back to ST's value.</div>
          ${card('Whole Interface', `
          ${row('ovShapeOn', 'Interface Shape', ovPick(s, 'ovShape', [['rounded', 'Rounded'], ['square', 'Square']])
            + ovWhen('ovShape', 'rounded', ovLabel('Roundness', sl('ovRound')))
            + '<div class="cb_hint">Rounds or squares every corner of SillyTavern\'s Menu Bar, drawers, side panels, menus and popups, and of NTR\'s own windows, wherever they sit. On Square, their buttons, text boxes, checkboxes and sliders go square too. The chat panel\'s bottom corners follow it when Layout\'s Send Box Position is Separate, or its send bar is Free; its top stays flush with the top bar. Messages and the send box have their own Shape.</div>')}
          ${row('ovBlurOn', 'Blur Strength', sl('ovBlur') + '<div class="cb_hint">The frosted-glass blur behind the chat, menus, drawers and popups.</div>')}
          ${row('ovShadowOn', 'Shadow Width', sl('ovShadow') + '<div class="cb_hint">The dark glow around all text in SillyTavern.</div>')}`)}
          ${card('Chat Panel', `
          ${bg('Panel', '<div class="cb_hint">Transparent shows the background picture through the chat.</div>')}
          ${border('Panel')}`)}
          ${card('AI Message', shape('Ai') + bg('Ai') + border('Ai'))}
          ${card('User Message', shape('Us') + bg('Us') + border('Us'))}
          ${card('Speech Bubbles', bubbleRowHtml(s))}
          ${card('Send Box', shape('Send') + bg('Send') + border('Send'))}
    `, { sw: ['m_ov_enable', s.ovEnabled] });
  }

  function bubbleRowHtml(s) {
    const pick = (k, opts) => ovPick(s, k, opts);
    const hint = (t) => `<div class="cb_hint">${t}</div>`;
    return ovRow(s, 'ovBubOn', 'Speech Bubbles',
      hint('Turns AI and User messages into chat bubbles around the message text. Avatars, names, buttons and the reasoning block stay outside the bubble. Its color, roundness and border come from AI Message and User Message. Reader Mode\'s Book keeps plain messages.')
      + ovLabel('Style', pills('obubpreset', [...Object.entries(BUB_PRESETS).map(([v, [l]]) => [v, l]), ['custom', 'Custom']], bubPreset(s)))
      + hint('A style sets everything here except Tail Position, plus the AI and User Message cards. Change anything after that and it shows Custom. Comic suits a comic font, like Comic Neue or Bangers, in Text Formatting.')
      + ovLabel('Tail', pick('ovBubTail', [['none', 'None'], ['pointed', 'Pointed'], ['curved', 'Curved'], ['thought', 'Thought']]))
      + hint('A Transparent background has no tail.')
      + ovLabel('Tail Position', pick('ovBubTailPos', [['top', 'Top'], ['bottom', 'Bottom']]))
      + hint('Top suits long replies: the tail is where the message starts.')
      + ovLabel('Sides', pick('ovBubAlign', [['left', 'All Left'], ['sides', 'AI Left, You Right'], ['swap', 'AI Right, You Left']]))
      + hint('Avatars move to their message\'s side too, unless NTR Avatars puts them above or below the text, behind the message, or pops them out.')
      + ovLabel('Max Width', rangeSlider(s, 'ovBubWidth'))
      + ovLabel('Width', pick('ovBubFit', [['shrink', 'Shrink to Fit'], ['fill', 'Always Max Width']]))
      + hint('Shrink to Fit gives short messages a small bubble.')
      + ovLabel('Messages in a Row', pick('ovBubGroup', [['group', 'Group'], ['each', 'Each Message']]))
      + hint('Group gives several messages in a row from the same speaker one tail and one avatar, and puts them closer together.')
      + ovLabel('Text in Bubbles', pick('ovBubInk', [['auto', 'As Is'], ['dark', 'Dark'], ['light', 'Light']]))
      + hint('As Is keeps Text Formatting\'s or SillyTavern\'s text color. Dark suits light bubbles, like Comic\'s.'));
  }

  function bindDisplay(overlay, s) {
    overlay.querySelector('#m_ov_enable').onchange = function() { s.ovEnabled = this.checked; save(); updateAvatarStyle(); };
    // Bubble Style: picking one sets its values and redraws the menu. Any other change on the page may make it Custom.
    const page = overlay.querySelector('.ntr_page[data-page="display"]');
    const syncBubStyle = () => {
      const r = page.querySelector(`input[name="cbr_obubpreset"][value="${bubPreset(s)}"]`);
      if (r) r.checked = true;
    };
    for (const ev of ['input', 'change']) page.addEventListener(ev, () => setTimeout(syncBubStyle), true);
    onPills(page, 'obubpreset', (v) => {
      if (!BUB_PRESETS[v]) return;
      Object.assign(s, BUB_PRESETS[v][1]);
      save(); updateAvatarStyle(); openCombinedModal();
    });
  }

  // ===== Per-character storage (kept inside the character card) =====
  const cardSnap = new Map();
  const cardTimers = new Map();
  const legacyMoved = new Set();
  // Cards whose NTR data wasn't an object (broken cards). Their next save clears that first; see flushCard.
  const cardFix = new Set();
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
    if (!isObj(ch.data.extensions)) ch.data.extensions = {};
    let d = cleanStore(ch.data.extensions.ntr);
    if (!cardSnap.has(key)) cardSnap.set(key, isObj(d) ? JSON.stringify(d) : '');
    if (!isObj(d)) {
      if (d !== undefined) cardFix.add(key);
      d = { v: 1 };
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
    const i = charIndexByAvatar(key);
    const ch = i >= 0 ? c.characters[i] : null;
    const d = ch?.data?.extensions?.ntr;
    if (!d) return;
    const json = JSON.stringify(d);
    const before = cardSnap.get(key) ?? '';
    if (json === before) return;
    if (before === '' && !legacyMoved.has(key) && cardIsEmpty(d)) return;
    try {
      // Merging into NTR data that isn't an object drops the save. So a broken card's old value is cleared first,
      // through the bulk save. Clearing also drops it from memory, so it's put straight back.
      const unset = c.constants?.unset;
      if (cardFix.has(key) && unset && typeof c.writeExtensionFieldBulk === 'function') {
        const r = await c.writeExtensionFieldBulk([key], 'ntr', unset);
        ch.data.extensions.ntr = d;
        if (![...(r?.updated || []), ...(r?.skipped || [])].includes(key)) throw new Error('Could not clear the old NTR data in the card');
        cardFix.delete(key);
      }
      // Saved here rather than with writeExtensionField, which doesn't say when the server turns a save down. Until a
      // save works, nothing counts as saved, so the next one sends it all again.
      const ntr = unset && before ? withUnsets(JSON.parse(before), d, unset) : d;
      const res = await fetch('/api/characters/merge-attributes', {
        method: 'POST', headers: c.getRequestHeaders(), body: JSON.stringify({ avatar: key, data: { extensions: { ntr } } }),
      });
      if (!res.ok) throw new Error(`The server said ${res.status} ${res.statusText}`);
      cardSnap.set(key, json);
      cardSaveWarned = false;
      if (legacyMoved.has(key)) {
        legacyMoved.delete(key);
        delete settings().chars[key];
        c.saveSettingsDebounced();
      }
      // Like writeExtensionField: the card's JSON copy (and the open character editor's) gets the same data, so saving
      // the character in its editor doesn't bring old NTR data back. The editor is checked now, after the save, in case
      // another character was opened meanwhile.
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
  // The pre-2.1 migration backup doesn't count, or files from back then could never be deleted.
  function filesInUse() {
    const s = settings();
    const set = collectFileRefs(s, new Set(), new Set(s.legacyBackup ? [s.legacyBackup] : []));
    for (const ch of ctx().characters || []) collectFileRefs(ch?.data?.extensions?.ntr, set);
    return set;
  }

  // Only files this extension uploaded itself (see the upload name prefixes) can ever be deleted.
  const OWN_FILE = /^user\/files\/(?:banner|fg|ntr|theme|cursor|baricon|book|arrow|rbbg|plate|agent|vnpfp|vnloc|vncg|vnart|vnmap|vnlogo|vnop)_[\w-]+\.(?:png|jpe?g|gif|webp|mp4|webm)$/;
  // Resolves to true if the file was deleted or was already gone. Never throws.
  const deleteFile = (p) => fetch('/api/files/delete', { method: 'POST', headers: ctx().getRequestHeaders(), body: JSON.stringify({ path: p }) })
    .then((res) => res.ok || res.status === 404).catch(() => false);

  // ===== Removing NTR data =====
  // `look`: settings and themes (the whole extension settings). `chars`: the NTR data in every character card, plus the
  // character, group chat and pre-2.1 copies kept in the settings. Files either one used go too, unless something
  // that stays still uses them. Cards that aren't loaded yet (lazy loading) are loaded first when `chars` is set;
  // without it, their files can't be checked, so no file is deleted.
  const CHAR_SETTINGS = ['chars', 'charData', 'groupData', 'legacyBackup'];
  // Files a removal couldn't delete. Kept in SillyTavern's account storage, which outlives NTR's settings, so the
  // next removal tries them again.
  const LEFTOVER = 'ntr_leftover_files';
  const leftovers = () => { try { const v = JSON.parse(ctx().accountStorage?.getItem(LEFTOVER) || '[]'); return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []; } catch { return []; } };
  async function removeData(opts) {
    wiping = true;
    for (const tm of cardTimers.values()) clearTimeout(tm);
    cardTimers.clear();
    try {
      return await removeNow(opts);
    } catch (e) {
      // Nothing was removed, so saving goes back on, and any card edit that was waiting to save gets saved.
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
      const todo = [...gone].filter((p) => OWN_FILE.test(p) && !keep.has(p));
      const ok = await Promise.all(todo.map(deleteFile));
      left = todo.filter((_, i) => !ok[i]);
      if (left.length) c.accountStorage?.setItem(LEFTOVER, JSON.stringify(left));
      else c.accountStorage?.removeItem(LEFTOVER);
    }
    c.saveSettingsDebounced(); // the page reloads next, so `wiping` stays on until then
    return left.length;
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
  // UI Display keys that sit on other pages now, and go in those pages' theme sections.
  const LAYOUT_OV_KEYS = ['ovWidthOn', 'ovWidth', 'ovMesGapOn', 'ovMesGap', 'ovSendPosOn', 'ovSendPos', 'ovSendGap'];
  const NAMES_KEYS = ['ovNamesOn', 'ovNames'];
  const ELEMENT_OV_KEYS = Object.keys(DEFAULTS).filter((k) => k.startsWith('ovScroll') || k.startsWith('ovCursor') || k.startsWith('ovQr'));
  const MOVED_OV_KEYS = [...FONT_SCALE_KEYS, ...AVATAR_SHAPE_KEYS, ...LAYOUT_OV_KEYS, ...NAMES_KEYS, ...ELEMENT_OV_KEYS];
  // In menu order. Elements keeps the section name 'reasoning' that saved themes and theme files already use.
  const LOOK = {
    layout: { label: 'Layout (chat panel, menu bar, send bar, page bar, banner, chat width, message spacing, send box position)', keys: [...Object.keys(DEFAULTS).filter((k) => k.startsWith('lay')), ...LAYOUT_OV_KEYS] },
    display: { label: 'UI Decor', keys: Object.keys(DEFAULTS).filter((k) => k.startsWith('ov') && !MOVED_OV_KEYS.includes(k)) },
    text: { label: 'Text Formatting', keys: [...Object.keys(DEFAULTS).filter((k) => k.startsWith('tf')), ...FONT_SCALE_KEYS] },
    pfp: { label: 'Avatar Management', keys: ['avatarEnabled', ...PFP_KEYS, ...AVATAR_SHAPE_KEYS, ...NAMES_KEYS, 'emoStageScale', 'emoStageOpacity'] },
    reasoning: { label: 'Elements (reasoning block, scrollbar, cursor, menu bar icons, quick replies, message details)', keys: [...Object.keys(DEFAULTS).filter((k) => k.startsWith('rb') || k.startsWith('md') || k.startsWith('mb')), ...ELEMENT_OV_KEYS] },
    banner: { label: 'Banner look (height, gap, transparent areas, rotation)', keys: ['bannerHeight', 'bannerGap', 'bannerBackdrop', 'bannerRotate', 'bannerRotateSec', 'bannerRotateFx', 'bannerRotateOrder'] },
    bannerGlobal: { label: 'Global banner (images, YouTube link, video)', keys: ['bannerGlobal'] },
    fg: { label: 'Foreground look (opacity, hide in Visual Novel)', keys: ['fgOpacity', 'fgHideVN'] },
    reader: { label: 'Reader Mode look (Standard or Book, book picture, page areas, ink, font, page flip)', keys: ['rdStyle', 'rdBook', 'rdBookImg', 'rdBookW', 'rdBookTop', 'rdBookBottom', 'rdBookOuter', 'rdBookSpine', ...INK_KEYS, 'rdBookFontOn', 'rdBookFont', 'rdFlip'] },
    vn: { label: 'Visual Novel (box, playback, emotions, tags, art kit, logo)', keys: ['nodeBoxWidth', 'nodeBoxMinH', 'nodeBoxMaxH', 'nodeBoxLift', 'nodeTextScale', 'nodeSprites', 'nodePortraitBox', 'nodeSpriteScale', 'nodeSpriteBase', 'nodeInject', 'locWord', 'nodeTypewriter', 'nodeSpeed', 'nodeAuto', 'nodeAutoDelay', 'nodeOpacity', 'nodePortrait', 'nodeShape', 'nodeUserMsgs', 'nodePicker', 'nodeHideEmo', 'emotions', 'emoDefault', 'delimSpkOpen', 'delimSpkClose', 'delimNarOpen', 'delimNarClose', 'delimEmo', 'narratorWord', 'emoWord',
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

  // The tag symbols and keywords Visual Novel Mode and emotions read. They only work together, so they're checked together:
  // by Apply in the menu's Tags & Delimiters (cast.js) and when a theme is imported or applied.
  const TAG_KEYS = ['delimSpkOpen', 'delimSpkClose', 'delimNarOpen', 'delimNarClose', 'delimEmo', 'narratorWord', 'emoWord', 'locWord',
    'choiceWord', 'choiceSep', 'effectWord', 'weatherWord', 'cgWord', 'enterWord', 'exitWord', 'fxShake', 'fxFlash', 'fxFade', 'wxRain', 'wxSnow', 'wxClear'];
  function validateDelims(d) {
    const errs = [], warns = [];
    const lc = (x) => String(x || '').trim().toLowerCase();
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
  const IMG_KEYS = new Set(['artBgImg', 'artSpriteImg', 'ovCursorImg', 'ovCursorPtrImg', 'ovCursorTextImg', 'ovCursorDownImg', 'rdBookImg', 'rbArrowImg', 'rbBgImg', 'tfPlateImg']);
  // Theme files come from other people, so each number is kept to the range of its slider in the menu (keep these in step
  // with the sliders). Pop-out and foreground offsets go wider because dragging the picture can take them past the slider.
  // Entries with a step and unit, [min, max, step, unit], are the only copy: their sliders and code read them from here.
  // A sixth and seventh number, [..., sliderMin, sliderMax], narrow the slider only (the pop-out and foreground offsets).
  const NUM_RANGE = {
    agTemp: [0, 2, 0.05, ''], agTopP: [0, 1, 0.01, ''], agTopK: [0, 200, 1, ''], agMinP: [0, 1, 0.01, ''], agFreq: [-2, 2, 0.05, ''], agPres: [-2, 2, 0.05, ''], agRep: [1, 2, 0.01, ''],
    agMaxTokens: [50, 4000, 50, ' tokens'], agContext: [1, 40, 1, ' messages'], agSendDepth: [0, 50, 1, ''],
    agFieldNum: [-1000000, 1000000, 1, ''], agFieldStep: [0, 1000000, 1, ''], agFieldCap: [1, 50, 1, ''],
    rdBookW: [40, 100, 1, '%'], rdBookTop: [0, 30, 0.5, '%'], rdBookBottom: [0, 30, 0.5, '%'], rdBookOuter: [0, 30, 0.5, '%'], rdBookSpine: [0, 40, 0.5, '%'],
    bannerHeight: [60, 350, 5, 'px'], bannerGap: [0, 40, 1, 'px'], bannerRotateSec: [3, 60, 1, 's'], fgOpacity: [0, 100, 1, '%'], placeGrid: [4, 100, 1, 'px'],
    rbSat: [0, 100, 1, '%'], rbBtnOpacity: [0, 100, 1, '%'], rbBoxOpacity: [0, 100, 1, '%'], rbPatThick: [1, 8, 1, 'px'], rbPatSize: [0.5, 3, 0.05, 'x'], rbPatFadeReach: [1, 20, 0.5, ' lines'], rbPatFadeSoft: [0, 100, 1, '%'], rbEdgeFxSize: [2, 30, 1, 'px'], rbBtnFxSize: [2, 30, 1, 'px'], rbArrowSize: [0.5, 3, 0.05, 'x'], rbBgTile: [16, 512, 1, 'px'], rbBgOpacity: [0, 100, 1, '%'], rbBgTint: [0, 100, 1, '%'], ovFont: [0.5, 2, 0.05, 'x'], tfNameSize: [0.5, 2, 0.05, 'x'], tfPlateBorderWidth: [1, 6, 1, 'px'], tfPlateRound: [0, 30, 1, 'px'], tfUserSize: [0.5, 2, 0.05, 'x'], tfAiSize: [0.5, 2, 0.05, 'x'],
    ovWidth: [25, 100, 1, 'vw'], ovBlur: [0, 30, 1, ''], ovShadow: [0, 5, 1, ''], ovCursorSize: [16, 128, 1, 'px'],
    ovRound: [1, 30, 1, 'px'], ovMesGap: [0, 40, 1, 'px'], ovSendGap: [0, 40, 1, 'px'], ovBubWidth: [40, 100, 1, '%'],
    ovQrSize: [0.5, 2, 0.05, 'x'], ovQrGap: [0, 20, 1, 'px'], ovQrOpacity: [10, 100, 1, '%'],
    mdSize: [0.5, 2, 0.05, 'x'], mdOpacity: [10, 100, 5, '%'],
    nodeSpeed: [5, 80], nodeAutoDelay: [500, 8000], nodeOpacity: [30, 100], nodePortrait: [60, 240], nodeBoxWidth: [40, 100],
    nodeBoxMinH: [40, 300], nodeBoxMaxH: [10, 70], nodeBoxLift: [0, 400], nodeTextScale: [70, 180], nodeSpriteScale: [30, 200],
    emoStageScale: [30, 200, 5, '%'], emoStageOpacity: [10, 100, 5, '%'],
    opLead: [0, 15], opFade: [100, 4000], opSize: [10, 100], opTransMs: [100, 10000],
    // Saved in card data (and the shared Global banner), not as settings keys (see cardNum).
    // Pinned Blocks' places, kept in each block (see cleanPins).
    pinX: [0, 100, 0.01, '%'], pinY: [0, 100, 0.01, '%'], pinW: [5, 100, 0.01, '%'], pinH: [5, 100, 0.01, '%'],
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
  const STR_MAX = { rbThink: 100, rbDone: 100, rbSome: 100, rbArrowSym: 16, rbCss: 2000, rbBtnCss: 2000, rbArrowCss: 2000, ovScrollCss: 2000, ovCursorCss: 2000, ovQrCss: 2000, mapGoText: 200 };
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
    if (k === 'ovScrollTrack' || k === 'ovQrHover') return typeof v === 'string' && COLOR_RE.test(v);
    if (FONT_KEYS.includes(k)) return typeof v === 'string' && FONT_RE.test(v);
    if (INK_KEYS.includes(k)) return typeof v === 'string' && COLOR_RE.test(v);
    if (PICK_KEYS[k]) return PICK_KEYS[k].includes(v);
    if (k === 'bannerGlobal') return isObj(v);
    if (k === 'layPins') return Array.isArray(v);
    if (k === 'mbIcons') return isObj(v);
    if (MD_SPOTS.some(([, key]) => key === k)) return Array.isArray(v) && v.every((i) => MD_ITEM_IDS.includes(i));
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
    if (k === 'layPins') return cleanPins(v);
    if (k === 'mbIcons') return cleanMbIcons(v);
    if (MD_SPOTS.some(([, key]) => key === k)) return MD_ITEM_IDS.filter((i) => v.includes(i));
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
    renderAll();
    syncPopouts();
    window.NTR.vn?.refresh();
    window.NTR.cast?.refresh();
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
          <div class="cb_hint">A theme holds your look: Layout, UI Decor, Text Formatting, Avatar Management, Elements, banner height, gap and rotation, the Global banner, foreground opacity, the Visual Novel box, tags and default art, and which regex folders are on. Character content, like a character's own banner, is never part of a theme. Pick a theme to apply it.</div>
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
    `);
  }

  function bindThemes(overlay, s) {
    const panel = overlay.querySelector('#m_t_panel');
    const sel = overlay.querySelector('#m_t_sel');
    const active = () => s.themes.find((t) => t.id === s.themeActive) || null;
    const need = () => { const t = active(); if (!t) toastr.info('Pick a theme first.', 'Themes'); return t; };
    const nameTaken = (name, self) => s.themes.some((t) => t !== self && t.name.toLowerCase() === name.toLowerCase());
    const secBoxes = (secs) => secs.map((k) => `<label class="checkbox_label"><input type="checkbox" class="m_t_sec" value="${k}" checked><span>${LOOK[k].label}</span></label>`).join('');
    // The menu fills empty colors with SillyTavern's own (see bindRows), so those count as default too.
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
    // With the Regexes page off, themes leave regex folders alone.
    const regexStates = async () => (s.rxEnabled ? (await loadModule('regex'))?.states?.() || null : null);
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
      if (t.regex && s.rxEnabled) (await loadModule('regex'))?.applyStates?.(t.regex);
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
      const scrollCss = String(rbPart.ovScrollCss || '').slice(0, 2000).trim();
      const cursorCssIn = String(rbPart.ovCursorCss || '').slice(0, 2000).trim();
      const qrCssIn = String(rbPart.ovQrCss || '').slice(0, 2000).trim();
      panel.innerHTML = `
        <div class="ntr_tpanel">
          <strong>Import theme</strong>
          <label>Name <input type="text" id="m_t_iname" class="text_pole" value="${escapeHTML(String(j.name || 'Imported theme'))}"></label>
          <div class="cb_hint">Sections in this file. Untick any you don't want.</div>
          ${secBoxes(secs)}
          ${css ? `<div class="cb_hint">This theme includes Custom CSS for the reasoning block. It's added switched off: after applying the theme, check it under Elements, Reasoning Block, Advanced: Custom CSS, and tick it to use it.</div>
          <pre class="cb_code" style="max-height: 140px; overflow: auto; margin: 0;">${escapeHTML(css)}</pre>` : ''}
          ${scrollCss ? `<div class="cb_hint">This theme includes Custom CSS for the scrollbar. It's added switched off: after applying the theme, check it under Elements, Scrollbar, Advanced: Custom CSS, and tick it to use it.</div>
          <pre class="cb_code" style="max-height: 140px; overflow: auto; margin: 0;">${escapeHTML(scrollCss)}</pre>` : ''}
          ${cursorCssIn ? `<div class="cb_hint">This theme includes Custom CSS for the cursor. It's added switched off: after applying the theme, check it under Elements, Cursor, Advanced: Custom CSS, and tick it to use it.</div>
          <pre class="cb_code" style="max-height: 140px; overflow: auto; margin: 0;">${escapeHTML(cursorCssIn)}</pre>` : ''}
          ${qrCssIn ? `<div class="cb_hint">This theme includes Custom CSS for Quick Replies. It's added switched off: after applying the theme, check it under Elements, Quick Replies, Advanced: Custom CSS, and tick it to use it.</div>
          <pre class="cb_code" style="max-height: 140px; overflow: auto; margin: 0;">${escapeHTML(qrCssIn)}</pre>` : ''}
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
        for (const k of ['ovScrollCss', 'ovCursorCss', 'ovQrCss']) if (data.reasoning && String(data.reasoning[k] || '').trim()) data.reasoning[k + 'On'] = false;
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

  // ===== Remove and uninstall (in the Extensions page drawer) =====
  const removeHtml = () => `
    <div class="cb_hint">Choose what to remove. Nothing happens until you confirm.</div>
    <label class="checkbox_label"><input type="checkbox" id="ntr_rm_look"><span><strong>Settings and themes</strong>: your look, saved themes and menu settings.<small class="ntr_rm_note">To keep a theme, export it first on the Themes page of the menu.</small></span></label>
    <label class="checkbox_label"><input type="checkbox" id="ntr_rm_chars"><span><strong>Uploaded files and character data</strong>: images, videos and maps uploaded through NTR, and the NTR data saved in each character card.</span></label>
    <label class="checkbox_label"><input type="checkbox" id="ntr_rm_ext"><span><strong>Uninstall NTR</strong>: removes the extension.<small class="ntr_rm_note">Anything not ticked above stays, so a reinstall picks up where you left off.</small></span></label>
    <div class="cb_actions ntr_rm_foot"><button class="menu_button" id="ntr_rm_go" disabled>Continue <i class="fa-solid fa-arrow-right"></i></button></div>`;

  // SillyTavern's own extension tools, with this folder's name. Throws when this user can't uninstall it.
  async function uninstallTarget() {
    const ext = await import('/scripts/extensions.js');
    const name = decodeURIComponent(new URL(NTR_BASE).pathname.split('/').filter(Boolean).pop());
    const id = Object.keys(ext.extensionTypes || {}).find((k) => k.endsWith(`/${name}`));
    if (ext.extensionTypes?.[id] === 'global' && !(await import('/scripts/user.js')).isAdmin()) {
      throw new Error('NTR is installed for all users here, so only an admin can uninstall it.');
    }
    return () => ext.deleteExtension(name);
  }

  function bindRemove(root) {
    const box = (id) => root.querySelector(`#ntr_rm_${id}`);
    const go = box('go');
    const picked = () => ({ look: box('look').checked, chars: box('chars').checked, ext: box('ext').checked });
    const label = ({ look, chars, ext }) => (look || chars) && ext ? 'Remove and uninstall' : ext ? 'Uninstall' : 'Remove';
    const sync = () => {
      const p = picked();
      go.disabled = !(p.look || p.chars || p.ext);
      // A question still open was asked about the old ticks.
      root.querySelector('.ntr_ask')?.ntrCancel?.();
    };
    const ticks = root.querySelectorAll('input[type=checkbox]');
    ticks.forEach((c) => { c.onchange = sync; });
    // Locked while a removal runs, so a second one can't start alongside it.
    const lock = (on) => ticks.forEach((c) => { c.disabled = on; });
    go.onclick = async () => {
      const p = picked();
      const what = p.look && p.chars ? 'your settings, themes, uploaded files and the NTR data in every character card'
        : p.look ? 'your settings and themes' : p.chars ? 'your uploaded files and the NTR data in every character card' : '';
      const text = what
        ? `This removes ${what}${p.ext ? ', then uninstalls NTR' : ''}. This can't be undone.`
        : 'This uninstalls NTR. Your NTR data stays, so a reinstall picks up where you left off.';
      // The question goes under the button's row, so the row hides once it's placed.
      const asking = askYes(go, text, label(p), { danger: true });
      go.parentElement.style.display = 'none';
      const yes = await asking;
      go.parentElement.style.display = '';
      if (!yes) return;
      lock(true);
      go.disabled = true;
      go.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${p.ext ? 'Uninstalling...' : 'Removing...'}`;
      const fail = (e, title) => {
        console.error('[NTR remove data]', e);
        toastr.error(e.message || 'Something went wrong.', title);
        go.innerHTML = 'Continue <i class="fa-solid fa-arrow-right"></i>';
        lock(false);
        sync();
      };
      let uninstall;
      try {
        // Checked first, so data is never removed when the uninstall can't follow.
        if (p.ext) uninstall = await uninstallTarget();
      } catch (e) { fail(e, 'Uninstall NTR'); return; }
      if (p.look || p.chars) {
        let left;
        try {
          left = await removeData({ look: p.look, chars: p.chars });
        } catch (e) { fail(e, 'Remove NTR data'); return; }
        // Uninstalling now would leave those files with nothing to find them again.
        if (left) {
          toastr.warning(`${left} uploaded file${left === 1 ? '' : 's'} could not be deleted${p.ext ? ', so NTR stayed installed' : ''}. Try again from Remove and uninstall after the reload.`, 'Remove NTR data', { timeOut: 10000 });
          setTimeout(() => location.reload(), 4000);
          return;
        }
      }
      // SillyTavern saves its settings and reloads the page once it's done.
      if (uninstall) { await uninstall(); return; }
      toastr.success('NTR data removed. Reloading...', 'Remove NTR data');
      // SillyTavern saves its settings about a second after a change.
      setTimeout(() => location.reload(), 2500);
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
  const MOD_LABEL = { vn: 'Visual Novel Mode', map: 'Maps', opening: 'Opening video', overlays: 'Overlays', regex: 'Regexes', reader: 'Reader Mode', agents: 'Agents', cast: 'Emotions', elements: 'Elements' };
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
  // vn.js draws the speakers' pictures from cast.js, so cast.js loads first.
  const loadVN = () => loadModule('cast', true).then((c) => (c ? loadModule('vn', true) : null));

  // The Regexes page comes from regex.js, loaded the first time the menu opens.
  let regexWaiting = false;
  // Elements comes from elements.js, loaded before NTR starts (see loadElements). Each call is guarded, so a failure
  // there leaves the rest of NTR running with SillyTavern's look for those parts. It's logged once per kind of call,
  // since css and sync run on every restyle.
  const elFailed = new Set();
  function callElements(fn, ...args) {
    const m = window.NTR.elements;
    if (!m) return undefined;
    try {
      return m[fn](...args);
    } catch (e) {
      if (!elFailed.has(fn)) { elFailed.add(fn); console.error(`[NTR] Elements: ${fn} failed`, e); }
      return undefined;
    }
  }
  function elementsSectionHtml(s) {
    const html = callElements('sectionHtml', s);
    if (html !== undefined) return html;
    const msg = modError.elements ? 'Elements failed to load: ' + escapeHTML(modError.elements)
      : window.NTR.elements ? 'Elements couldn\'t be drawn. The browser console has the details.' : 'Loading Elements.';
    return pageHtml('elements', '', { note: `<div class="cb_hint ntr_pnote">${msg}</div>` });
  }
  // Waits for elements.js, at most 5 seconds. SillyTavern waits for this file behind its loading screen, this wait
  // included, so Elements' styles are there from the first draw. If it takes longer, NTR starts without it and
  // restyles when it arrives.
  async function loadElements() {
    const load = loadModule('elements');
    let timer;
    const inTime = await Promise.race([load.then(() => true), new Promise((res) => { timer = setTimeout(res, 5000, false); })]);
    clearTimeout(timer);
    if (!inTime) load.then((m) => { if (m) { updateAvatarStyle(); if (document.getElementById('cb_modal_overlay')) openCombinedModal(); } });
  }

  // The Agents page comes from agents.js, loaded the first time the menu opens (and at start when the page is on).
  let agentsWaiting = false;
  function agentsSectionHtml(s) {
    const ag = window.NTR.agents;
    if (ag) return ag.sectionHtml(s);
    if (!modError.agents && !agentsWaiting) {
      agentsWaiting = true;
      loadModule('agents').then(() => {
        agentsWaiting = false;
        if (document.getElementById('cb_modal_overlay')) openCombinedModal();
      });
    }
    const msg = modError.agents ? 'Agents failed to load: ' + escapeHTML(modError.agents) : 'Loading your agents.';
    return pageHtml('agents', '', { note: `<div class="cb_hint ntr_pnote">${msg}</div>` });
  }

  // The Emotions part of the Avatars page comes from cast.js, loaded the first time the menu opens.
  let castWaiting = false;
  function castPartHtml() {
    const c = window.NTR.cast;
    if (c) return c.partHtml(settings());
    if (!modError.cast && !castWaiting) {
      castWaiting = true;
      loadModule('cast').then(() => {
        castWaiting = false;
        if (document.getElementById('cb_modal_overlay')) openCombinedModal();
      });
    }
    const msg = modError.cast ? 'Emotions failed to load: ' + escapeHTML(modError.cast) : 'Loading emotions.';
    return `<div class="cb_hint ntr_keepon">${msg}</div>`;
  }

  // The Overlays page comes from overlays.js, loaded the first time the menu opens if a banner or foreground image
  // hasn't loaded it already.
  let overlaysWaiting = false;
  function overlaysSectionHtml(s) {
    const m = window.NTR.overlays;
    if (m) return m.sectionHtml(s);
    if (!modError.overlays && !overlaysWaiting) {
      overlaysWaiting = true;
      loadModule('overlays').then(() => {
        overlaysWaiting = false;
        if (document.getElementById('cb_modal_overlay')) openCombinedModal();
      });
    }
    const msg = modError.overlays ? 'Overlays failed to load: ' + escapeHTML(modError.overlays) : 'Loading the banner and foreground images.';
    return pageHtml('fg', '', { note: `<div class="cb_hint ntr_pnote">${msg}</div>`, legend: true });
  }

  function regexSectionHtml(s) {
    if (!s.rxEnabled) {
      return pageHtml('regex', '', { sw: ['m_rx_enable', false], note: '<div class="cb_hint ntr_pnote">Your regexes still run in SillyTavern as usual. With this page off, NTR doesn\'t show or sort them, and themes don\'t switch regex folders on or off.</div>' });
    }
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
    return pageHtml('regex', '', { sw: ['m_rx_enable', true], note: `<div class="cb_hint ntr_pnote">${msg}</div>` });
  }

  // Visual Novel's settings, for the Visual Novel part of the Reader Mode page. vn.js loads when the menu first needs them.
  let vnWaiting = false;
  function vnSectionHtml(s) {
    const vn = window.NTR.vn;
    if (vn) return vn.sectionHtml(s);
    if (isOn() && !modError.vn && !vnWaiting) {
      vnWaiting = true;
      loadVN().then((m) => {
        vnWaiting = false;
        if (m && document.getElementById('cb_modal_overlay')) openCombinedModal();
      });
    }
    const msg = modError.vn ? 'Visual Novel Mode failed to load: ' + escapeHTML(modError.vn) : isOn() ? 'Loading its settings.' : 'Its settings show while the extension is on.';
    return `<div class="cb_hint">${msg}</div>`;
  }

  const bindVNSection = (overlay, s) => { if (readerPart(s) === 'vn') window.NTR.vn?.bind(overlay, s); };

  function syncVNToggle() {
    // Pinned Blocks can hide in Visual Novel Mode.
    syncPins();
    const b = document.getElementById('cb_node_toggle');
    if (!b) return;
    b.classList.toggle('cb_on', !!settings().nodeEnabled);
    b.style.display = isOn() ? '' : 'none';
  }

  // The chat bubbles button: Reader Mode with the Visual Novel style, or Reader Mode off.
  async function toggleVN() {
    const on = !settings().nodeEnabled;
    await setReader(on, on);
  }

  function injectNodeToggle() {
    const lsf = document.getElementById('leftSendForm');
    if (!lsf || document.getElementById('cb_node_toggle')) return;
    const b = document.createElement('div');
    b.id = 'cb_node_toggle';
    b.className = 'fa-solid fa-comments interactable';
    b.title = 'Visual Novel Mode (turns Reader Mode on)';
    b.tabIndex = 0;
    b.onclick = toggleVN;
    lsf.appendChild(b);
    syncVNToggle();
  }

  // ===== Reader Mode (the paging itself lives in reader.js) =====
  // Visual Novel Mode is Reader Mode's third style (Visual Novel), next to Standard and Book (rdStyle). It keeps its own
  // switch (nodeEnabled), which is on only while Reader Mode is, so Standard or Book is still picked for when it's off.
  // Standard is saved as 'plain'.
  const readerStyle = (s) => (s.rdEnabled && s.nodeEnabled ? 'vn' : s.rdStyle === 'book' ? 'book' : 'plain');
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
        <div class="cb_hint" data-rd-part="${part}">Other ways to show the chat. Messages hidden on screen are still sent with the prompt. Each chat opens where you left it.</div>
        ${card('Style', `
          ${pills('rdstyle', [['plain', 'Standard'], ['book', 'Book'], ['vn', 'Visual Novel']], readerStyle(s))}`)}
        ${part === 'vn' ? '' : card('Each Page', `
          ${pills('rdper', [['pair', 'Your Message and the Reply'], ['one', 'One Message']], s.rdPer === 'one' ? 'one' : 'pair')}
          <div class="cb_hint" style="margin-bottom: 0;">The opening message is page 1.</div>`)}
        ${part !== 'book' ? '' : `${subHead('rd_book', 'Book')}
        <div class="cb_collapse_content">
        ${card('Book', `
          <div class="cb_cur_row">
            <div class="cb_cur_prev ntr_rd_pic" id="m_rd_pic"></div>
            <span class="cb_cur_name" style="flex: 1;">Book Picture<small id="m_rd_pic_name"></small></span>
            <button class="menu_button" id="m_rd_up" title="Upload"><i class="fa-solid fa-upload"></i></button>
            <button class="menu_button" id="m_rd_url" title="Use a link"><i class="fa-solid fa-link"></i></button>
            <button class="menu_button" id="m_rd_clr" title="Back to the built-in book and its page areas"><i class="fa-solid fa-rotate-left"></i></button>
          </div>
          <div class="ntr_rd_books" role="radiogroup" aria-label="Built-in book color">${BOOKS.map(([v, l, c]) => `<label title="${l}"><input type="radio" name="cbr_rdbook" value="${v}" aria-label="${l}" ${!s.rdBookImg && v === bookKey(s) ? 'checked' : ''}><span style="background: ${c};"></span></label>`).join('')}</div>
          <div class="cb_hint">The dots pick the built-in book's cover color. Picking one also sets the page areas to fit it.</div>
          <input type="file" id="m_rd_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
          ${ovLabel('Book Width', rangeSlider(s, 'rdBookW'))}
          <div class="cb_hint">How much of the screen's width the book takes. It keeps the picture's shape, so it gets narrower when the screen is too short. A phone held upright shows Standard; turn it sideways for the book.</div>
          ${ovRow(s, 'rdFlip', 'Page Flip', '<div class="cb_hint" style="margin: 0;">Next, Previous, Page Up and Page Down turn the page over the spine. First, Last and a typed page number go straight there. Off with SillyTavern\'s Reduced Motion.</div>')}`)}
        ${card('Page Areas', `
          ${ovLabel('Top', rangeSlider(s, 'rdBookTop'))}
          ${ovLabel('Bottom', rangeSlider(s, 'rdBookBottom'))}
          ${ovLabel('Outer Edge', rangeSlider(s, 'rdBookOuter'))}
          ${ovLabel('Spine Gap', rangeSlider(s, 'rdBookSpine'))}
          <div class="cb_hint" style="margin-bottom: 0;">Where the text sits on the picture. Top and Bottom are a % of the book's height; Outer Edge and Spine Gap are a % of its width. Spine Gap is the space between the two pages' text. The swipe arrows sit under the text at the bottom right.</div>`)}
        ${card('Ink', `
          ${ovLabel('Text', ovColor(s, 'rdInk'))}
          ${ovLabel('Italics', ovColor(s, 'rdInkEm'))}
          ${ovLabel('Quotes', ovColor(s, 'rdInkQuote'))}
          ${ovRow(s, 'rdBookFontOn', 'Book Font', ovFont(s, 'rdBookFont'))}
          <div class="cb_hint" style="margin-bottom: 0;">In the book, these take the place of SillyTavern's colors, Text Formatting's colors and text effects, and the reasoning block's look, which are made for a dark background. The reasoning text uses the Italics color. Text Formatting's sizes still apply.</div>`)}
        </div>`}
        ${part !== 'vn' ? '' : `${subHead('rd_vn', 'Visual Novel')}
        <div class="cb_collapse_content">
        ${vnSectionHtml(s)}
        </div>`}
    `, { sw: ['m_rd_enable', s.rdEnabled], note: err, legend: true });
  }

  function bindReader(overlay, s) {
    overlay.querySelector('#m_rd_enable').onchange = function() { setReader(this.checked); };
    onPills(overlay, 'rdper', (v) => { s.rdPer = v; save(); window.NTR.reader?.refresh(); });
    onPills(overlay, 'rdstyle', async (v) => {
      if (v !== 'vn') s.rdStyle = v;
      if (v === 'vn' || s.nodeEnabled) await setReader(s.rdEnabled || v === 'vn', v === 'vn');
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
      const src = s.rdBookImg ? media(s.rdBookImg) : bookUrl(s.rdBook);
      overlay.querySelector('#m_rd_pic').innerHTML = `<img src="${escapeHTML(src)}" alt="">`;
      overlay.querySelector('#m_rd_pic_name').textContent = s.rdBookImg ? 'Your picture' : `The built-in book, ${BOOKS.find(([v]) => v === bookKey(s))[1]}`;
      overlay.querySelector('#m_rd_clr').disabled = !s.rdBookImg;
    };
    const setPic = (url) => {
      const old = s.rdBookImg;
      s.rdBookImg = url;
      if (!url) for (const k of ['rdBookTop', 'rdBookBottom', 'rdBookOuter', 'rdBookSpine']) s[k] = DEFAULTS[k];
      save();
      updateAvatarStyle();
      deleteFileIfUnused(old);
      if (url) renderPic(); else openCombinedModal();
    };
    overlay.querySelector('#m_rd_up').onclick = () => file.click();
    overlay.querySelector('#m_rd_url').onclick = async function() {
      const url = await askImageUrl('Book picture', this, false);
      if (url) setPic(url);
    };
    overlay.querySelector('#m_rd_clr').onclick = () => setPic('');
    onPills(overlay, 'rdbook', (v) => { s.rdBook = v; setPic(''); });
    file.onchange = async () => {
      if (!file.files.length) return;
      try {
        setPic(await uploadImage(file.files[0], 'book', { max: 3000 }));
      } catch (e) {
        console.error('[NTR book upload]', e);
        toastr.error(e.message || 'Upload failed', 'Book picture');
      }
      file.value = '';
    };
    renderPic();
  }

  // Reader Mode on or off, in Standard or Book (rdStyle) or, with vn, in Visual Novel (Visual Novel Mode).
  async function setReader(on, vn = false) {
    const s = settings();
    const wasVN = !!s.nodeEnabled;
    s.rdEnabled = !!on;
    s.nodeEnabled = !!on && !!vn;
    if (s.nodeEnabled) s.vnUsed = true;
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
    const b = document.getElementById('ntr_rd_toggle');
    if (!b) return;
    b.classList.toggle('cb_on', !!settings().rdEnabled);
    b.style.display = isOn() ? '' : 'none';
  }

  function injectReaderToggle() {
    const lsf = document.getElementById('leftSendForm');
    if (!lsf || document.getElementById('ntr_rd_toggle')) return;
    const b = document.createElement('div');
    b.id = 'ntr_rd_toggle';
    b.className = 'fa-solid fa-book-open interactable';
    b.title = 'Reader Mode';
    b.tabIndex = 0;
    b.onclick = toggleReader;
    lsf.appendChild(b);
    syncReaderToggle();
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
    if (!on) endPlacement();
    save();
    renderAll();
    syncPopouts();
    syncExtBar();
    syncVNToggle();
    syncReaderToggle();
    // Reader Mode first: Visual Novel opens on the message saved through it.
    const rd = on && s.rdEnabled ? await loadModule('reader', true) : window.NTR.reader;
    rd?.refresh();
    if (on) {
      if (s.nodeEnabled) { const vn = await loadVN(); if (vn) vn.refresh(); }
    } else if (window.NTR.vn) window.NTR.vn.teardown();
    if (on) (await loadModule('cast'))?.refresh();
    else window.NTR.cast?.teardown();
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
            <span>Remove and uninstall</span>
            <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
          </div>
          <div class="inline-drawer-content">${removeHtml()}</div>
        </div>
      </div>`;
    host.appendChild(wrap);
    wrap.querySelector('#ntr_ext_open').onclick = () => openCombinedModal();
    wrap.querySelector('#ntr_power').onclick = () => setMaster(!isOn());
    bindRemove(wrap.querySelector('.ntr_ext_fold .inline-drawer-content'));
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

  // {{agent::Name}}: an agent's current saved result (agents.js), anywhere SillyTavern reads macros. Registered here so
  // it gives nothing, instead of staying as typed, while the Agents page is off. Needs SillyTavern's new macro engine.
  function registerMacro() {
    const m = ctx().macros;
    if (typeof m?.register !== 'function') return;
    try {
      m.register('agent', {
        unnamedArgs: [{ name: 'name', description: 'The agent\'s name' }],
        description: 'An NTR agent\'s current result saved in this chat (Agents page). Empty if it has none.',
        exampleUsage: '{{agent::Margi}}',
        handler: ({ unnamedArgs: [name] }) => (isOn() && settings().agEnabled ? window.NTR.agents?.macro(name) ?? '' : ''),
      });
    } catch (e) { console.error('[NTR] Could not add the {{agent}} macro', e); }
  }

  function injectExtensionMenuButton() {
    const tick = () => {
      injectExtBar();
      injectNodeToggle();
      injectReaderToggle();
      syncWandEntry();
      if (isOn()) window.NTR.cast?.ensure();
    };
    tick();
    setInterval(tick, 1000);
  }

  window.NTR = window.NTR || {};
  window.NTR.api = {
    VERSION, DEFAULTS, ctx, save, settings, isOn, escapeHTML, media, bookUrl, fullResUrl, readDataURL, loadImg, askImageUrl, askVideoUrl,
    pills, posGrid, onPills, pageHtml, subHead, deleteFileIfUnused, syncVNToggle, TAG, store, uploadHere, refreshFg: () => (window.NTR.overlays ? window.NTR.overlays.ensureFg() : renderOverlays()),
    openMenu: () => openCombinedModal(),
    closeMenu: () => { const ov = document.getElementById('cb_modal_overlay'); if (!ov) return false; ov.querySelector('.cb_close_btn')?.click(); return true; },
    sendFree: () => sendFree(),
    // For reader.js, and vn.js (turning Visual Novel Mode on turns Reader Mode off)
    // Reader Mode calls refreshPins when the page changes; the stage behind the chat follows the page too (cast.js).
    refreshPins: () => { syncPins(); markBubbleRuns(); window.NTR.cast?.sync(); }, setReader: (on, vn) => setReader(on, vn), syncSendRoom: () => syncSendRoom(), pageFree: () => pageFree(), banFree: () => banFree(), rangeNum: (s, k) => rangeNum(s, k), cleanFont: (v) => cleanFont(v),
    // For agents.js: its sliders' ranges
    numRange: (k) => NUM_RANGE[k], rangeAttrs: (k) => rangeAttrs(k),
    // For cast.js: Pop Out catches up after a face changes
    syncPopouts: () => syncPopouts(),
    // For overlays.js: the banner's and foreground images' data (kept here for card storage and cleanup), menu parts and
    // Edit Placement
    peek, bannerSrc, startChar, ROT_KEYS, BANNER_LOOK_KEYS, fgData, FG_POS, fgTransform, cardNum, cNum, card, pagePart,
    startPlacement: (first) => startPlacement(first), drawPlace: () => drawPlace(),
    loadModule, moduleError: (name) => modError[name] || '', removeData, askYes, askText, popMenu, closePops, dragSort, uploadDataUrl, uploadImage, uploadVideo, getYouTubeId, currentKey, newId, validateDelims,
    bannerImage: () => {
      const key = currentKey();
      if (!key) return '';
      const r = bannerSrc(peek(key));
      const im = r.images[r.idx] || r.images[0];
      return im ? media(im.url) : '';
    },
    // What elements.js builds from: the row builders, CSS helpers, and the lists its settings are checked against.
    look: {
      COLOR_RE, FONT_NOTE, MB_ID, QR_ALIGN, MD_ITEMS, MD_ITEM_IDS, MD_SPOTS, MD_SEP,
      RB_ANIM, RB_BORDERS, RB_BOX_BORDERS, RB_BOX_SHAPE, RB_FADE, RB_FX, RB_PATS, RB_SHAPE, RB_TURN,
      cUrl, cssRule, cssReaders, cssTag, seeThrough, rbCssText, bubblesOn, bubRight, restyle: () => updateAvatarStyle(),
      rangeSlider, ovRow, ovColor, ovText, ovFont, ovPick, ovShapeRow, ovBgRow, ovBorderRow, ovColorVal, ovRadius, ovBorderVal,
    },
  };

  await loadElements();

  jQuery(() => {
    const { eventSource, event_types } = ctx();
    injectExtensionMenuButton();
    registerSlashCommand();
    registerMacro();
    document.addEventListener('click', typeSlider);
    document.addEventListener('pointerover', (e) => {
      const el = e.target.closest?.('.ntr_slval');
      if (el && !el.title) el.title = 'Click to type a value';
    });
    document.addEventListener('load', (e) => {
      if (!(e.target instanceof HTMLImageElement) || !e.target.matches('#chat .mes .avatar img')) return;
      setAvatarRatio(e.target);
      fullAvatar(e.target);
    }, true);
    window.addEventListener('resize', () => {
      layoutPop();
      window.NTR.cast?.sync();
      syncSendRoom();
      const ov = document.getElementById('cb_modal_overlay');
      if (!ov) return;
      panelLayout(ov);
    });
    eventSource.on(event_types.CHAT_CHANGED, () => {
      endPlacement();
      renderAll();
      window.NTR.vn?.queue(false);
      window.NTR.cast?.refresh();
      window.NTR.reader?.chatChanged();
      if (document.getElementById('cb_modal_overlay')) openCombinedModal();
    });

    for (const [name, anim] of [['USER_MESSAGE_RENDERED', true], ['MESSAGE_EDITED', false], ['MESSAGE_UPDATED', false], ['MESSAGE_DELETED', false]]) {
      if (event_types[name]) eventSource.on(event_types[name], () => { window.NTR.vn?.queue(anim); window.NTR.cast?.sync(); });
    }
    // A swipe to a new reply shows "..." until the reply arrives (see nodeSwiped in vn.js).
    if (event_types.MESSAGE_SWIPED) {
      eventSource.on(event_types.MESSAGE_SWIPED, (id) => {
        window.NTR.cast?.sync();
        return window.NTR.vn?.swiped ? window.NTR.vn.swiped(Number(id)) : window.NTR.vn?.queue(true);
      });
    }
    if (event_types.CHARACTER_MESSAGE_RENDERED) {
      eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, (id, type) => {
        const vn = window.NTR.vn;
        vn?.endWait?.();
        // A Continue picks up where the old text ended instead of typing the whole message again.
        // Without streaming, SillyTavern marks a finished Continue as 'appendFinal'.
        if ((type === 'continue' || type === 'appendFinal') && vn?.continued) vn.continued(Number(id));
        else vn?.queue(true);
        window.NTR.cast?.sync();
        window.NTR.agents?.replied(type, Number(id));
      });
    }
    if (event_types.GENERATION_STARTED) {
      eventSource.on(event_types.GENERATION_STARTED, (type, _opts, dryRun) => {
        window.NTR.vn?.genStarted?.(type, dryRun);
        window.NTR.cast?.genStarted(type, dryRun);
        window.NTR.reader?.genStarted(type, dryRun);
      });
    }
    // Agents wait for a reply being written. A send with only slash commands (like /ntr typed in the box) writes none
    // and never sends "generation ended", so agents only count a reply once SillyTavern has run the commands.
    const replyGoes = event_types.GENERATION_AFTER_COMMANDS || event_types.GENERATION_STARTED;
    if (replyGoes) {
      eventSource.on(replyGoes, (type, _opts, dryRun) => {
        window.NTR.agents?.genStarted(type, dryRun);
      });
    }
    // Stopped or failed before a reply arrived: SillyTavern puts the old reply back, shown without typing it again.
    // The short delay lets a reply that did arrive go first, so it still gets typed.
    if (event_types.GENERATION_ENDED) {
      eventSource.on(event_types.GENERATION_ENDED, () => {
        window.NTR.cast?.genEnded();
        window.NTR.agents?.genEnded();
        if (isOn() && settings().nodeEnabled) setTimeout(() => { if (window.NTR.vn?.endWait?.()) window.NTR.vn.queue(false); }, 300);
      });
    }
    if (event_types.APP_READY) eventSource.on(event_types.APP_READY, () => { renderAll(); window.NTR.vn?.queue(false); window.NTR.cast?.refresh(); });
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
      new MutationObserver(() => { syncPopouts(); markBubbleRuns(); }).observe(chat, { childList: true });
    }
    renderAll();
    const s0 = settings();
    // cast.js hides tags in the chat and draws emotions, so it loads whenever NTR is on. VN loads it first anyway.
    if (isOn()) loadModule('cast').then((c) => c?.refresh());
    // Reader Mode first: Visual Novel opens on the message saved through it.
    const rdLoad = isOn() && s0.rdEnabled ? loadModule('reader').then((rd) => rd?.refresh()) : Promise.resolve();
    // Visual Novel Mode loads when it's switched on (see setReader).
    if (isOn() && s0.nodeEnabled) rdLoad.catch(() => {}).then(() => loadVN()).then((vn) => { if (vn) vn.refresh(); });
    if (isOn() && s0.agEnabled) loadModule('agents');
  });
})();

// SillyTavern's "Clean extension data" button and "Also clean up extension data" option when deleting the extension
// (the manifest's clean hook): removes settings and themes, and the uploaded files no character card still uses.
// Character cards stay as they are: SillyTavern stops waiting for a hook after 5 seconds, and going through every card
// can take longer. Remove and uninstall in NTR's own drawer removes those too.
export async function onClean() {
  await window.NTR?.api?.removeData({ look: true });
}
