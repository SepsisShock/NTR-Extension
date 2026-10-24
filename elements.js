// Nitwit Tavern Redesign: Elements module: Reasoning Block, Message Details, Scrollbar, Cursor, Menu Bar Icons and
// Quick Replies. Loaded by index.js before NTR starts, so its styles are there from the first draw, unless it takes
// over 5 seconds; then it restyles when it arrives. If this file breaks, the rest of the extension keeps working, with
// SillyTavern's own look for these parts.
// The settings, their limits and the lists they're checked against stay in index.js; this file builds from what it
// shares in window.NTR.api.look.
(() => {
  const ELEMENTS_VERSION = '2.77.5';
  const A = window.NTR && window.NTR.api;
  if (!A || !A.look) { console.error('[NTR] elements.js loaded without the core (index.js).'); return; }
  const { DEFAULTS, ctx, save, settings, isOn, escapeHTML, loadImg, askImageUrl, uploadImage, deleteFileIfUnused, rangeNum,
    pills, posGrid, onPills, pageHtml, pagePart, subHead, card, reducedMotion } = A;
  const { COLOR_RE, FONT_NOTE, MB_ID, QR_ALIGN, MD_ITEMS, MD_ITEM_IDS, MD_SPOTS, MD_SEP,
    RB_ANIM, RB_BORDERS, RB_BOX_BORDERS, RB_BOX_SHAPE, RB_FADE, RB_FX, RB_PATS, RB_SHAPE, RB_TURN,
    cUrl, cssRule, cssReaders, cssTag, seeThrough, rbCssText, customCssBox, CSS_NOTE, bubblesOn, bubRight, restyle: updateAvatarStyle,
    rangeSlider, ovRow, ovColor, ovText, ovFont, ovPick, ovShapeRow, ovBgRow, ovBorderRow, ovColorVal, ovRadius, ovBorderVal, ovLabel } = A.look;

  // Chrome, Edge and Safari use the -webkit- parts. Firefox only knows scrollbar-color,
  // and Chrome drops the -webkit- parts when it sees it, so Firefox gets it on its own.
  function scrollbarCss(s) {
    if (!s.ovScrollOn) return '';
    const color = s.ovScrollColorOn && COLOR_RE.test(s.ovScrollColor) ? s.ovScrollColor : '';
    const track = s.ovScrollTrackOn && COLOR_RE.test(s.ovScrollTrack) ? s.ovScrollTrack : '';
    let css = '';
    if (track) css += `\n      ::-webkit-scrollbar-track { background-color: ${track}; }\n      ::-webkit-scrollbar-corner { background-color: ${track}; }`;
    if (color) css += `\n      ::-webkit-scrollbar-thumb:vertical, ::-webkit-scrollbar-thumb:horizontal { background-color: ${color}; }`;
    if (color || track) css += `\n      @supports not selector(::-webkit-scrollbar) { * { scrollbar-color: ${color || 'var(--grey7070a)'} ${track || 'transparent'}; } }`;
    return css ? css + '\n' : '';
  }

  // Quick Replies: the buttons in the bar and in its pop-out window, and the bar's own layout. Each setting is
  // SillyTavern's own look while it's unticked.
  const qrBtn = (pseudo = '') => `#qr--bar > .qr--buttons .qr--button${pseudo}, #qr--popout > .qr--body > .qr--buttons .qr--button${pseudo}`;
  function qrCss(s) {
    if (!s.ovQrOn) return '';
    const on = (k) => s[k + 'On'];
    const scroll = on('ovQrWrap') && s.ovQrWrap === 'scroll';
    let css = cssRule(qrBtn(), {
      'border-radius': on('ovQrShape') ? `${ovRadius(s, 'Qr')}px` : '',
      'background-color': !on('ovQrBg') ? '' : s.ovQrBg === 'clear' ? 'transparent' : ovColorVal(s, 'ovQrBgColor', 'ovQrBgOpacity'),
      border: on('ovQrBorder') ? ovBorderVal(s, 'Qr') : '',
      color: on('ovQrText') && COLOR_RE.test(s.ovQrText) ? s.ovQrText : '',
      'font-size': on('ovQrSize') ? `${rangeNum(s, 'ovQrSize')}em` : '',
      // In one row a button keeps its width and its label stays on one line.
      ...(scroll ? { 'flex-shrink': '0', 'white-space': 'nowrap' } : {}),
    });
    // A Background would cover SillyTavern's hover gray too, so with one ticked the hover gets ST's gray back.
    if (on('ovQrHover') || on('ovQrBg')) css += cssRule(qrBtn(':hover'), { 'background-color': on('ovQrHover') && COLOR_RE.test(s.ovQrHover) ? s.ovQrHover : DEFAULTS.ovQrHover });
    css += cssRule('#qr--bar > .qr--buttons', {
      'flex-wrap': on('ovQrWrap') ? (scroll ? 'nowrap' : 'wrap') : '',
      gap: on('ovQrGap') ? `${rangeNum(s, 'ovQrGap')}px` : '',
      // ST centers the buttons, which in one row would push the first ones out of reach: centered safely instead.
      'justify-content': on('ovQrAlign') ? QR_ALIGN[s.ovQrAlign] : scroll ? QR_ALIGN.center : '',
    });
    css += cssRule('#qr--bar', { opacity: on('ovQrOpacity') ? rangeNum(s, 'ovQrOpacity') / 100 : '' });
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
    if (!s.ovCursorOn) return '';
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
  // Menu Bar Icons. A picture takes the place of its icon in the icon's own 1em square, so it follows SillyTavern's icon
  // size and fades like its icons when the panel is closed. Tint uses the picture as a mask in the icon's color. A
  // picture shows only once it has loaded, so a broken link keeps SillyTavern's icon. While SillyTavern shows its
  // no-connection warning on the connection icon, the warning shows instead of the picture.
  // A mask only works on a picture its site allows other sites to use (CORS), so each picture is loaded that way first:
  // 'mask' if it loads, 'plain' if it loads only the ordinary way (Tint then shows it in Full Color), false if it
  // doesn't load, null while loading.
  const mbLoaded = new Map();
  const mbWait = new Map();
  const loadCors = (u) => new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = u; });
  function mbReady(src) {
    if (mbLoaded.has(src)) return mbLoaded.get(src);
    if (mbLoaded.size > 60) { mbLoaded.clear(); mbWait.clear(); }
    mbLoaded.set(src, null);
    const p = loadCors(src).then(() => 'mask', () => loadImg(src).then(() => 'plain', () => false));
    mbWait.set(src, p.then((st) => { mbLoaded.set(src, st); updateAvatarStyle(); return st; }));
    return null;
  }
  function menuBarIconCss(s) {
    if (!s.mbOn) return '';
    let css = '';
    for (const [id, e] of Object.entries(s.mbIcons || {})) {
      const u = cUrl(e?.img);
      // MB_ID keeps the id a plain CSS name, so it needs no escaping in the selector.
      const st = MB_ID.test(id) && u ? mbReady(u) : false;
      if (!st) continue;
      const pic = `url("${u}") center / contain no-repeat`;
      css += `\n      #top-settings-holder > #${id} > :not(.drawer-content) .drawer-icon:not(.redOverlayGlow, .fa-plug-circle-exclamation)::before { content: '' !important; display: inline-block; width: 1em; height: 1em; vertical-align: middle; `
        + (e.mode === 'full' || st !== 'mask' ? `background: ${pic};` : `background-color: currentColor; -webkit-mask: ${pic}; mask: ${pic};`) + ' }';
    }
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

  // Styles set where each detail goes. SillyTavern is where it puts them itself.
  const mdSpots = (av, row, corner, below) => ({ mdAv: av, mdRow: row, mdCorner: corner, mdBelow: below });
  const MD_PRESETS = {
    st: ['ST', mdSpots(['num', 'gen', 'tok'], ['date', 'time'], [], [])],
    messenger: ['Messenger', mdSpots([], [], ['time'], [])],
    row: ['Name Row', mdSpots([], ['num', 'date', 'time', 'gen', 'think', 'tok'], [], [])],
    footer: ['Footer', mdSpots([], [], [], ['num', 'date', 'time', 'gen', 'think', 'tok'])],
  };
  const mdList = (s, k) => (Array.isArray(s[k]) ? MD_ITEM_IDS.filter((i) => s[k].includes(i)) : []);
  const mdPreset = (s) => Object.keys(MD_PRESETS).find((k) => Object.entries(MD_PRESETS[k][1]).every(([key, v]) => mdList(s, key).join() === v.join())) || 'custom';

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
    // Checkers
    const q = `${+(1.6 * u).toFixed(2)}em`;
    return [`conic-gradient(${P} 25%, transparent 0 50%, ${P} 0 75%, transparent 0) 0 0 / ${q} ${q}`];
  }

  // Fade: see-through on the Fade From side, turning solid by Reach (in text lines, at most the whole box). Softness is
  // the part of Reach that blends; the rest stays see-through, so 0 is a hard edge. The Box Color fades in color c, and
  // the picture and pattern layers with the same gradient as a mask in black.
  function fadeLayer(s, c) {
    const reach = `min(${rangeNum(s, 'rbPatFadeReach')}lh, 100%)`;
    const clear = rangeNum(s, 'rbPatFadeSoft') < 100 ? `calc(${reach} * ${+(1 - rangeNum(s, 'rbPatFadeSoft') / 100).toFixed(2)})` : '0%';
    const dir = RB_FADE[s.rbPatFade] ?? 'to bottom';
    return `${dir ? `linear-gradient(${dir}` : 'radial-gradient(circle'}, transparent ${clear}, ${c} ${reach})`;
  }

  // Background Image: the picture on a layer behind the text, so Opacity really is see-through, and the Readability Tint
  // and any drawn pattern on a second layer above it. That one copies the box's padding, so ruled lines still sit under
  // the text. Both layers stay under the text, and the Box Color stays on the box itself, under the picture. With Fade,
  // both layers fade like the Box Color, and a pattern gets the second layer even without a picture.
  const bgPos = (v) => `${{ l: 'left', c: 'center', r: 'right' }[v[1]] || 'center'} ${{ t: 'top', c: 'center', b: 'bottom' }[v[0]] || 'center'}`;
  function reasoningBgCss(s, img, pat, fade) {
    const mask = fade ? fadeLayer(s, '#000') : '';
    const layer = { content: '""', position: 'absolute', inset: '0', 'z-index': '-1', 'pointer-events': 'none', 'border-radius': 'inherit', '-webkit-mask-image': mask, 'mask-image': mask };
    const op = rangeNum(s, 'rbBgOpacity');
    let css = !img ? '' : cssRule('.mes_reasoning::before', {
      ...layer,
      background: s.rbBgFit === 'tile' ? `url("${img}") 0 0 / ${rangeNum(s, 'rbBgTile')}px auto repeat`
        : `url("${img}") ${bgPos(String(s.rbBgPos))} / cover no-repeat`,
      opacity: op < 100 ? op / 100 : '',
    });
    // Readability Tint: black over light reasoning text, white over dark, from the color ST gives the reasoning text.
    const tint = img && s.rbBgTintOn ? rangeNum(s, 'rbBgTint') / 100 : 0;
    const shade = `hsl(from var(--reasoning-body-color) 0 0 clamp(0, (50 - l) * 1000, 100) / ${tint})`;
    const top = [...pat, tint ? `linear-gradient(${shade}, ${shade})` : ''].filter(Boolean);
    if (top.length) css += cssRule('.mes_reasoning::after', { ...layer, background: top.join(', '), padding: 'inherit', 'box-sizing': 'border-box' });
    return css;
  }

  // Reasoning Arrow. ST centers it and flips it with one transform, so here the centering is on translate and the turn on
  // rotate, which leaves transform free for the thinking animation. Those rules have no !important (it would stop the
  // animation), so they start with #chat to outrank ST's.
  const cssStr = (v) => `"${[...v].map((c) => `\\${c.codePointAt(0).toString(16)} `).join('')}"`;
  const graphemes = (v) => { try { return [...new Intl.Segmenter().segment(v)].length; } catch (e) { return [...v].length; } };
  function reasoningArrowCss(s, col) {
    const A = '.mes_reasoning_details .mes_reasoning_arrow';
    const sym = String(s.rbArrowSym || '').slice(0, 16).trim();
    const img = cUrl(s.rbArrowImg);
    // A Symbol or Image left empty shows ST's arrow.
    const kind = s.rbArrow === 'none' ? 'none' : s.rbArrow === 'symbol' && sym ? 'symbol' : s.rbArrow === 'image' && img ? 'image' : 'default';
    if (kind === 'none') return cssRule(A, { display: 'none' }) + cssRule('.mes_reasoning_header', { 'padding-right': '14px' });
    const k = s.rbArrowSizeOn ? rangeNum(s, 'rbArrowSize') : 1;
    const size = `calc(var(--mainFontSize) * ${+(0.7 * k).toFixed(3)})`;
    const symbol = kind === 'symbol';
    let css = cssRule(A, {
      color: kind === 'image' ? '' : col('rbArrowColor'),
      'font-size': k !== 1 ? size : '',
      width: symbol ? 'auto' : k !== 1 ? size : '',
      height: symbol ? 'auto' : k !== 1 ? size : '',
      'line-height': symbol ? '1' : '',
      'white-space': symbol ? 'nowrap' : '',
      background: kind === 'image' ? `url("${img}") center / contain no-repeat` : '',
    });
    if (kind !== 'default') {
      css += cssRule(A + '::before', symbol ? { content: cssStr(sym), 'font-family': 'var(--mainFontFamily)', 'font-weight': 'normal' } : { content: 'none' });
    }
    // ST leaves room on the button's right for one arrow at its own size. A bigger arrow or a longer symbol needs more.
    // Quarter Turn stands a long symbol on end, Spin sweeps its corners round and Bounce lifts it, so the button makes
    // room for those too.
    const wide = 0.7 * k * (symbol ? graphemes(sym) * 1.2 : 1);
    const high = 0.7 * k * (symbol ? 1.2 : 1);
    const tall = (s.rbArrowAnim === 'spin' ? Math.hypot(wide, high) : s.rbArrowTurn === 'quarter' ? Math.max(wide, high) : high)
      + (s.rbArrowAnim === 'bounce' ? 2 * 0.35 * 0.7 * k : 0);
    if (wide !== 0.7) {
      css += cssRule('.mes_reasoning_header', {
        'padding-right': `calc(var(--mainFontSize) * ${+(s.rbArrowAnim === 'spin' ? tall : wide).toFixed(3)} + 14px)`,
        'min-height': `calc(var(--mainFontSize) * ${+tall.toFixed(3)} + 8px)`,
        'align-items': 'center',
      });
    }
    const [open, closed] = RB_TURN[s.rbArrowTurn] || RB_TURN.flip;
    css += `\n      #chat ${A} { transform: none; translate: 0 -50%; rotate: ${open}; }`;
    css += `\n      #chat .mes_reasoning_details:not([open]) .mes_reasoning_arrow { rotate: ${closed}; }`;
    // The turn and the thinking animation stop with ST's Reduced Motion, which ST also turns on for the device's own setting.
    css += `\n      body:not(.reduced-motion) #chat ${A} { transition: rotate .2s ease; }`;
    const anim = RB_ANIM[s.rbArrowAnim];
    if (anim) {
      css += `\n      @keyframes ntr_rb_arrow ${anim[1]}`;
      css += `\n      body:not(.reduced-motion) #chat .mes_reasoning_details[data-state="thinking"] .mes_reasoning_arrow { animation: ntr_rb_arrow ${anim[0]}; }`;
    }
    return css;
  }

  function reasoningCss(s) {
    if (!s.rbEnabled) return '';
    const { on, col, font } = cssReaders(s);
    let css = '';

    // Border Effects: Glow in the border's color, or a black Shadow. The reasoning box's sits on its left edge.
    const edgeFx = (k, c, spread, left) => {
      if (!RB_FX.includes(s[k]) || s[k] === 'none') return '';
      const n = rangeNum(s, k + 'Size'), o = Math.ceil(n / 3);
      return s[k] === 'glow' ? `${left ? -o : 0}px 0 ${n}px ${spread} ${c}` : `${left ? -o : o}px ${o}px ${n}px ${spread} rgba(0, 0, 0, .6)`;
    };
    // The reasoning text box. SillyTavern colors it from these variables, so overriding them keeps its dimming and quote handling.
    const boxOp = on('rbBoxAlpha') ? rangeNum(s, 'rbBoxOpacity') : 100;
    const boxFill = col('rbBoxColor') || (boxOp < 100 ? 'var(--SmartThemeBlurTintColor)' : '');
    const boxBg = boxFill && seeThrough(boxFill, boxOp);
    const allPat = boxPattern(s, col, boxBg);
    // With a Background Image or Fade, a drawn pattern moves to the layer above the picture (see reasoningBgCss), so
    // Fade can reach it through a mask. The Box Color fades on the box itself.
    const img = cUrl(s.rbBgImg);
    const fade = !!s.rbPatFadeOn;
    const layered = !!img || (fade && allPat.length > 0);
    const pat = layered ? [] : allPat;
    const bg = fade ? (boxBg ? [fadeLayer(s, boxBg)] : []) : pat.length ? [...pat, boxBg || 'transparent'] : [];
    const bs = on('rbBorderStyle') && RB_BOX_BORDERS.includes(s.rbBorderStyle) ? s.rbBorderStyle : '';
    css += cssRule('.mes_reasoning', {
      'border-radius': on('rbBoxShape') ? RB_BOX_SHAPE[s.rbBoxShape] || '' : '',
      'background-color': bg.length || fade ? '' : boxBg,
      background: bg.join(', '),
      position: layered ? 'relative' : '',
      isolation: layered ? 'isolate' : '',
      'padding-left': s.rbPat === 'notebook' ? '2.1em' : '',
      '--reasoning-saturation': on('rbSat') ? rangeNum(s, 'rbSat') / 100 : '',
      'border-left-color': col('rbBorder'),
      'font-family': font('rbFont'),
      'border-left-style': bs,
      'border-left-width': bs === 'double' ? '4px' : '',
      'box-shadow': edgeFx('rbEdgeFx', col('rbBorder') || 'var(--reasoning-body-color)', '-2px', true),
    });
    if (layered) css += reasoningBgCss(s, img, allPat, fade);
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
    css += reasoningArrowCss(s, col);
    return css ? css + '\n' : '';
  }

  function syncCustomCss() {
    const s = settings();
    const live = isOn() && s.rbEnabled;
    cssTag('ntr_rb_css', rbCssText((k) => live && s[k + 'On'] && s[k]));
    cssTag('ntr_scroll_css', isOn() && s.ovScrollOn && s.ovScrollCssOn ? String(s.ovScrollCss || '').slice(0, 2000).trim() : '');
    cssTag('ntr_cursor_css', isOn() && s.ovCursorOn && s.ovCursorCssOn ? String(s.ovCursorCss || '').slice(0, 2000).trim() : '');
    cssTag('ntr_qr_css', isOn() && s.ovQrOn && s.ovQrCssOn ? String(s.ovQrCss || '').slice(0, 2000).trim() : '');
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
  const rbMotion = (s) => isOn() && s.rbEnabled && s.rbTyping !== 'off' && !reducedMotion();
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
  // Watches the chat for changed messages and refreshes their reasoning labels and Message Details. Streaming changes
  // one message many times a second, so only the messages that changed are checked, not the whole chat.
  let mesObs = null, mesQueued = null;
  function watchMessages() {
    const chat = document.getElementById('chat');
    if (mesObs || !chat || !window.MutationObserver) return;
    mesObs = new MutationObserver((recs) => {
      const first = !mesQueued;
      mesQueued ??= new Set();
      for (const r of recs) {
        const t = r.target.nodeType === 1 ? r.target : r.target.parentElement;
        const m = t && t.closest('.mes');
        if (m) { mesQueued.add(m); continue; }
        for (const a of r.addedNodes) {
          if (a.nodeType !== 1) continue;
          if (a.matches('.mes')) mesQueued.add(a);
          a.querySelectorAll('.mes').forEach((e) => mesQueued.add(e));
        }
      }
      if (!first) return;
      requestAnimationFrame(() => {
        const mes = [...mesQueued].filter((m) => chat.contains(m));
        mesQueued = null;
        syncReasoningLabels(mes);
        syncMessageDetails(mes);
      });
    });
    mesObs.observe(chat, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['data-duration'] });
  }

  // ===== Message Details =====
  // NTR draws each spot's details itself with ::after, from a CSS variable per spot on the message (see
  // syncMessageDetails), so nothing is added inside the message and SillyTavern's rewrites while streaming or editing
  // can't remove it. SillyTavern's own number, timer, token count and timestamp are hidden meanwhile.
  // Avatar: under the picture, like SillyTavern's. Name Row: after the name. Corner: at the end of the text's last line
  // when there's room, or on its own line, like a messaging app. Below: under the message.
  function messageDetailsCss(s) {
    if (!s.mdOn) return '';
    const M = '#chat .mes';
    const k = s.mdSizeOn ? rangeNum(s, 'mdSize') : 1;
    const pill = s.mdPillOn ? (COLOR_RE.test(s.mdPill) ? s.mdPill : 'var(--SmartThemeBlurTintColor)') : '';
    // Size and opacity start at SillyTavern's for that spot.
    const look = (size, opacity) => ({
      'font-size': `calc(var(--mainFontSize) * ${+(size * k).toFixed(3)})`,
      opacity: s.mdOpacityOn ? rangeNum(s, 'mdOpacity') / 100 : opacity,
      color: s.mdColorOn && COLOR_RE.test(s.mdColor) ? s.mdColor : '',
      'font-family': 'var(--mainFontFamily)', 'font-style': 'normal', 'line-height': '1.4',
      'background-color': pill, 'border-radius': pill ? '999px' : '', padding: pill ? '.05em .6em' : '',
    });
    const v = (spot) => `var(--ntr-md-${spot}, none)`;
    let css = cssRule(`${M} :is(.mesIDDisplay, .mes_timer, .tokenCounterDisplay), ${M} .ch_name .timestamp`, { display: 'none' });
    css += cssRule(`${M} .mesAvatarWrapper::after`, {
      content: v('av'), display: 'block', width: 'fit-content', margin: '2px auto 0', 'text-align': 'center', 'white-space': 'pre-line', 'font-weight': '600', ...look(0.9, 0.7),
    });
    css += cssRule(`${M} .ch_name > .flex1 > .flex-container::after`, { content: v('row'), 'margin-left': '.6em', 'font-weight': '400', 'white-space': 'nowrap', ...look(0.7, '') });
    // The corner sits in the text's last part, only on messages that have corner details and end in text (see
    // syncMessageDetails), so a last block's own layout, or a Pinned Block hiding it, stays as it is. The text holds the
    // corner when it drops to its own line; no !important, so a rule hiding the text still wins.
    const C = '#chat .mes[data-ntr-md-corner]';
    css += `\n      ${C} .mes_text:not(.inline_media) { display: flow-root; }`;
    css += cssRule(`${C} .mes_text > :nth-last-child(1 of :not(style, script, template)):is(${MD_TEXT_TAGS.join(', ')})::after`, {
      content: v('corner'), float: 'right', margin: '.35em 0 -.25em .8em', 'font-weight': '400', 'white-space': 'nowrap', 'text-indent': '0', ...look(0.7, 0.7),
    });
    css += cssRule(`${M} .mes_block::after`, { content: v('below'), display: 'block', width: 'fit-content', 'margin-top': '4px', 'font-weight': '400', ...look(0.75, 0.7) });
    // Speech Bubbles put a side's messages on the right: Below follows.
    for (const [p, flag] of [['Ai', 'false'], ['Us', 'true']]) {
      if (bubblesOn(s) && bubRight(s, p)) css += cssRule(`body:not(.ntr_book) #chat .mes[is_user="${flag}"] .mes_block::after`, { 'margin-left': 'auto' });
    }
    return css;
  }

  // The parts of a message's text the corner can sit in. A message ending in anything else, like a table, a picture or an
  // HTML block, shows its corner details below the message instead. So does a generated picture whose text SillyTavern
  // hides (inline_media).
  const MD_TEXT_TAGS = ['p', 'ul', 'ol', 'blockquote', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  const mdEndsInText = (m) => {
    const text = m.querySelector('.mes_text');
    if (!text || text.classList.contains('inline_media')) return false;
    const kids = text.children;
    for (let i = kids.length - 1; i >= 0; i--) {
      const tag = kids[i].tagName.toLowerCase();
      if (!['style', 'script', 'template'].includes(tag)) return MD_TEXT_TAGS.includes(tag);
    }
    return false;
  };

  // Each detail's text for a message, or '' when it has none (a greeting has no reply time, your messages no model).
  function mdValue(id, mes, mesid, s) {
    const x = mes.extra || {};
    const secs = mes.gen_started && mes.gen_finished ? (new Date(mes.gen_finished) - new Date(mes.gen_started)) / 1000 : NaN;
    const when = () => { try { const m = ctx().timestampToMoment?.(mes.send_date); return m && m.isValid() ? m : null; } catch (e) { return null; } };
    switch (id) {
      case 'num': return `#${mesid}`;
      case 'date': { const m = when(); return m ? m.format(s.mdDate === 'short' ? 'L' : 'LL') : ''; }
      case 'time': { const m = when(); return m ? m.format('LT') : ''; }
      case 'gen': return secs >= 0 ? `${secs.toFixed(1)}s` : '';
      case 'think': return x.reasoning_duration > 0 ? `${(x.reasoning_duration / 1000).toFixed(1)}s thinking` : '';
      case 'tok': return x.token_count > 0 ? `${x.token_count}t` : '';
      case 'tps': return x.token_count > 0 && secs > 0 ? `${(x.token_count / secs).toFixed(1)} t/s` : '';
      case 'model': return typeof x.model === 'string' ? x.model.slice(0, 80) : '';
    }
    return '';
  }
  // One spot's text. Date and time next to each other read as one timestamp, so a space joins them. The Avatar spot
  // stacks its details, like SillyTavern's.
  function mdText(s, mes, mesid, key, spot) {
    const parts = mdList(s, key).map((id) => [id, mdValue(id, mes, mesid, s)]).filter(([, v]) => v);
    const sep = spot === 'av' ? '\n' : MD_SEP[s.mdSep] || MD_SEP.dot;
    return parts.map(([id, v], i) => (i ? (id === 'time' && parts[i - 1][0] === 'date' && spot !== 'av' ? ' ' : sep) : '') + v).join('');
  }
  // Writes each spot's text on the given messages, or every one in the chat. Called when a message changes (see
  // watchMessages), so the reply time counts up while streaming and the numbers follow a deleted message.
  const mdLast = new WeakMap();
  function syncMessageDetails(mes) {
    const s = settings();
    const on = isOn() && s.mdOn;
    const chat = ctx().chat || [];
    for (const m of mes || document.querySelectorAll('#chat .mes')) {
      const id = Number(m.getAttribute('mesid'));
      const data = on && Number.isInteger(id) ? chat[id] : null;
      const vals = MD_SPOTS.map(([spot, key]) => (data ? mdText(s, data, id, key, spot) : ''));
      // Corner details on a message that doesn't end in text go to the end of Below.
      if (vals[2] && !mdEndsInText(m)) {
        vals[3] = vals[3] ? vals[3] + (MD_SEP[s.mdSep] || MD_SEP.dot) + vals[2] : vals[2];
        vals[2] = '';
      }
      const sig = vals.join('\0');
      if (mdLast.get(m) === sig) continue;
      mdLast.set(m, sig);
      MD_SPOTS.forEach(([spot], i) => {
        if (vals[i]) m.style.setProperty(`--ntr-md-${spot}`, cssStr(vals[i]));
        else m.style.removeProperty(`--ntr-md-${spot}`);
      });
      m.toggleAttribute('data-ntr-md-corner', !!vals[2]);
    }
  }

  function bindCssBoxes(overlay, prefix) {
    overlay.querySelectorAll(`.m_css[data-key^="${prefix}"]`).forEach((box) => {
      box.oninput = () => { settings()[box.dataset.key] = box.value.slice(0, 2000); syncCustomCss(); };
      box.onchange = save;
    });
  }

  // Elements: parts of SillyTavern NTR restyles one by one, each with its own switch, folded until opened.
  function elementsSectionHtml(s) {
    return pageHtml('elements', reasoningPartHtml(s) + mdPartHtml(s) + scrollbarPartHtml(s) + cursorPartHtml(s) + menuBarIconsPartHtml(s) + qrPartHtml(s));
  }

  // Elements' CSS, in the order it has always been written: Scrollbar, Cursor, Menu Bar Icons, Quick Replies, Message
  // Details, then the Reasoning Block.
  function elementsCss(s) {
    return scrollbarCss(s) + cursorCss(s) + menuBarIconCss(s) + qrCss(s) + messageDetailsCss(s) + reasoningCss(s);
  }

  // Each part's switch, then its own binder. The rows it shares with other pages are bound by bindRows.
  function bindElements(overlay, s) {
    for (const [id, key] of [['m_rb_enable', 'rbEnabled'], ['m_md_enable', 'mdOn'], ['m_scroll_enable', 'ovScrollOn'], ['m_cur_enable', 'ovCursorOn'], ['m_mb_enable', 'mbOn'], ['m_qr_enable', 'ovQrOn']]) {
      overlay.querySelector('#' + id).onchange = function() { s[key] = this.checked; save(); updateAvatarStyle(); };
    }
    bindReasoning(overlay, s);
    bindMessageDetails(overlay, s);
    bindCursor(overlay, s);
    bindMenuBarIcons(overlay, s);
    bindCssBoxes(overlay, 'ov');
  }

  function bindReasoning(overlay, s) {
    onPills(overlay, 'rbtyping', (v) => { s.rbTyping = v; save(); syncReasoningLabels(); });
    onPills(overlay, 'rbbtnshape', (v) => { s.rbBtnShape = v; save(); updateAvatarStyle(); });
    onPills(overlay, 'rbbtnborder', (v) => { s.rbBtnBorder = v; save(); updateAvatarStyle(); });
    for (const [name, k] of [['rbbtnfx', 'rbBtnFx'], ['rbedgefx', 'rbEdgeFx']]) {
      onPills(overlay, name, (v) => {
        s[k] = v; save(); updateAvatarStyle();
        overlay.querySelector(`.m_rb_fxsize[data-for="${k}"]`).classList.toggle('cb_dim', v === 'none');
      });
    }
    onPills(overlay, 'rbboxshape', (v) => { s.rbBoxShape = v; save(); updateAvatarStyle(); });
    // Background Pattern: show the rows for the picked pattern, and dim the sliders it doesn't use.
    const syncPatRows = () => {
      const p = s.rbPat;
      overlay.querySelectorAll('[data-rbpat]').forEach((r) => { r.style.display = r.dataset.rbpat === p || (r.dataset.rbpat === 'drawn' && p !== 'none') ? '' : 'none'; });
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
    // Fade: its rows dim while it's off, and a note shows while the box has nothing to fade.
    const fadeRows = overlay.querySelector('.m_rb_fade');
    const syncFade = () => {
      const fill = (s.rbBoxColorOn && COLOR_RE.test(s.rbBoxColor)) || (s.rbBoxAlphaOn && rangeNum(s, 'rbBoxOpacity') < 100);
      const pat = s.rbPat !== 'none' && (s.rbPat !== 'lines' || s.rbPatH || s.rbPatV || s.rbPatR || s.rbPatL);
      fadeRows.classList.toggle('cb_dim', !s.rbPatFadeOn);
      overlay.querySelector('.m_rb_fadeneed').hidden = !s.rbPatFadeOn || fill || pat || !!s.rbBgImg;
    };
    const part = fadeRows.closest('.ntr_part');
    for (const ev of ['input', 'change', 'click']) part.addEventListener(ev, () => setTimeout(syncFade), true);
    syncFade();
    onPills(overlay, 'rbbstyle', (v) => { s.rbBorderStyle = v; save(); updateAvatarStyle(); });
    bindCssBoxes(overlay, 'rb');
    bindReasoningArrow(overlay, s);
    bindReasoningBg(overlay, s, syncFade);
  }

  // Cursor pictures: Upload / Link / Remove for each kind.
  function bindCursor(overlay, s) {
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
        const url = await askImageUrl(b.dataset.label, b, false);
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
        toastr.error(e.message || 'Upload failed', 'Cursor');
      }
      curFile.value = '';
    };
    renderCursor();
  }

  function reasoningPartHtml(s) {
    // A status text box has no tick: an empty box means ST's own text, shown greyed in the box.
    const label = (key, title, hint = '') => `
            <div class="cb_ovrow"><div>${title}</div><div class="m_o_body cb_flat">${ovText(s, key, RB_ST_LABEL[key])}${hint}</div></div>`;
    const borders = [['solid', 'Solid'], ['dashed', 'Dashed'], ['dotted', 'Dotted'], ['double', 'Double']];
    const cssBox = (k, ph) => customCssBox(s, k, ph);
    // A pick-one row with no tick: its default choice is SillyTavern's own look.
    const pickRow = (title, inner, attrs = '') => `
          <div class="cb_ovrow"${attrs}><div class="cb_plab">${title}</div><div class="m_o_body">${inner}</div></div>`;
    const patLine = (k, label) => `<label class="checkbox_label"><input type="checkbox" class="m_rb_patline" data-key="${k}" ${s[k] ? 'checked' : ''}><span>${label}</span></label>`;
    const fxOpts = [['none', 'None', 'ST\'s default'], ['glow', 'Glow'], ['shadow', 'Shadow']];
    const fxSize = (k) => `<div class="m_rb_fxsize ${s[k] === 'none' ? 'cb_dim' : ''}" data-for="${k}">${rangeSlider(s, k + 'Size')}</div>`;
    return pagePart('Reasoning Block', ['m_rb_enable', s.rbEnabled], 'el_reasoning', `
          <div class="cb_hint">Only changes the look. Reasoning shows when ST's "Request model reasoning" (Chat Completion) or "Auto-Parse" (Text Completion) is on.</div>
          <div class="cb_hint">Tick a setting to change it; untick it to go back to ST's look.</div>
          ${subHead('rb_header', 'Reasoning Status Text')}
          <div class="cb_collapse_content">
            ${ovRow(s, 'rbBtnTextOn', 'Text Color', ovColor(s, 'rbBtnText'))}
            <div class="cb_hint" style="margin-top:6px;">Empty uses ST's wording.</div>
            ${label('rbThink', 'While Thinking')}
            ${label('rbDone', 'Finished', '<div class="cb_hint">{time} becomes the thinking time.</div>')}
            ${label('rbSome', 'Finished, Time Unknown')}
            <div class="cb_ovrow cb_sep">
              <div>Typewriter Effect</div>
              <div class="m_o_body cb_flat">${pills('rbtyping', [['off', 'Off'], ['think', 'While Thinking'], ['both', 'Thinking and Finished']], s.rbTyping)}<div class="cb_hint">Off with ST's Reduced Motion.</div></div>
            </div>
          </div>
          ${card('Reasoning Button', `
          ${ovRow(s, 'rbBtnColorOn', 'Button Color', ovColor(s, 'rbBtnColor'))}
          ${ovRow(s, 'rbBtnAlphaOn', 'Background Opacity', rangeSlider(s, 'rbBtnOpacity'))}
          ${pickRow('Button Shape', pills('rbbtnshape', [['square', 'Square'], ['rounded', 'Rounded', 'ST\'s default'], ['pill', 'Pill']], s.rbBtnShape))}
          ${ovRow(s, 'rbBtnBorderOn', 'Border Style', pills('rbbtnborder', borders, s.rbBtnBorder))}
          ${ovRow(s, 'rbBtnBorderColorOn', 'Border Color', ovColor(s, 'rbBtnBorderColor'))}
          ${pickRow('Border Effects', pills('rbbtnfx', fxOpts, s.rbBtnFx) + fxSize('rbBtnFx') + '<div class="cb_hint">Glow takes the Border Color. Shadow is black.</div>')}`)}
          ${card('Reasoning Box', `
          ${ovRow(s, 'rbBoxColorOn', 'Box Color', ovColor(s, 'rbBoxColor'))}
          ${ovRow(s, 'rbBoxAlphaOn', 'Background Opacity', rangeSlider(s, 'rbBoxOpacity'))}
          ${ovRow(s, 'rbFontOn', 'Font', ovFont(s, 'rbFont') + `<div class="cb_hint">${FONT_NOTE}</div>`)}
          ${ovRow(s, 'rbSatOn', 'Text Color Strength', rangeSlider(s, 'rbSat') + '<div class="cb_hint">ST\'s is 50%. 0% is grey.</div>')}
          ${ovRow(s, 'rbBoxShapeOn', 'Box Shape', pills('rbboxshape', [['rounded', 'Rounded'], ['extra', 'Extra Rounded']], s.rbBoxShape))}
          ${ovRow(s, 'rbBorderStyleOn', 'Border Style', pills('rbbstyle', [['none', 'None'], ...borders.filter(([v]) => v !== 'solid')], s.rbBorderStyle))}
          ${ovRow(s, 'rbBorderOn', 'Border Color', ovColor(s, 'rbBorder'))}
          ${pickRow('Border Effects', pills('rbedgefx', fxOpts, s.rbEdgeFx) + fxSize('rbEdgeFx') + '<div class="cb_hint">Glow takes the Border Color. Shadow is black.</div>')}
          ${subHead('rb_bgimg', 'Background Picture')}
          <div class="cb_collapse_content">
          <div class="cb_cur_slot">
            <div class="cb_cur_row">
              <div class="cb_cur_prev ntr_rd_pic" id="m_rbbg_prev"></div>
              <span class="cb_cur_name">Picture</span>
              <button class="menu_button" id="m_rbbg_up" title="Upload" aria-label="Upload"><i class="fa-solid fa-upload"></i></button>
              <button class="menu_button" id="m_rbbg_url" title="Use a link" aria-label="Use a link"><i class="fa-solid fa-link"></i></button>
              <button class="menu_button" id="m_rbbg_clr" title="Remove picture" aria-label="Remove picture"><i class="fa-solid fa-rotate-left"></i></button>
            </div>
            <input type="file" id="m_rbbg_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
          </div>
          <div class="m_rbbg_rows">
          ${pickRow('Fit', pills('rbbgfit', [['cover', 'Cover'], ['tile', 'Tile']], s.rbBgFit))}
          ${pickRow('Keep in View', posGrid('rbbgpos', s.rbBgPos), ' data-rbbg="cover"')}
          ${pickRow('Tile Size', rangeSlider(s, 'rbBgTile'), ' data-rbbg="tile"')}
          ${pickRow('Picture Opacity', rangeSlider(s, 'rbBgOpacity') + '<div class="cb_hint">If your Box CSS makes the box scroll, the picture scrolls with the text.</div>')}
          ${ovRow(s, 'rbBgTintOn', 'Readability Tint', rangeSlider(s, 'rbBgTint') + '<div class="cb_hint">Darkens the picture behind light text, or lightens it behind dark text.</div>')}
          </div>
          </div>
          ${subHead('rb_pattern', 'Background Pattern')}
          <div class="cb_collapse_content">
          ${pickRow('Pattern', pills('rbpat', [['none', 'None'], ['notebook', 'Notebook'], ['lines', 'Lines'], ['dots', 'Dots'], ['checkers', 'Checkers']], s.rbPat))}
          ${pickRow('Lines', `<div class="ntr_rbpat_lines">${patLine('rbPatH', 'Horizontal')}${patLine('rbPatV', 'Vertical')}${patLine('rbPatR', 'Diagonal /')}${patLine('rbPatL', 'Diagonal \\')}</div>`
            + '<button class="menu_button" id="m_rb_patreset" style="margin:6px 0 0;">Reset Lines</button>', ' data-rbpat="lines"')}
          ${pickRow('Pattern Shade', pills('rbpatshade', [['light', 'Lighter'], ['dark', 'Darker']], s.rbPatShade), ' data-rbpat="drawn"')}
          <div data-rbpat="drawn">${ovRow(s, 'rbPatColorOn', 'Pattern Color', ovColor(s, 'rbPatColor'))}</div>
          ${pickRow('Thickness', `<div class="m_rb_patdim" data-for="thick">${rangeSlider(s, 'rbPatThick')}</div><div class="cb_hint">Line thickness, or dot size. Checkers doesn't use it.</div>`, ' data-rbpat="drawn"')}
          ${pickRow('Pattern Size', `<div class="m_rb_patdim" data-for="size">${rangeSlider(s, 'rbPatSize')}</div><div class="cb_hint">Notebook and Horizontal lines follow the text lines instead.</div>`, ' data-rbpat="drawn"')}
          ${ovRow(s, 'rbPatFadeOn', 'Fade', '<div class="cb_hint">Fades the Box Color, pattern and picture toward one side. The text stays.</div><div class="cb_hint m_rb_fadeneed">Nothing to fade yet. Pick a Box Color, a pattern or a Background Picture.</div>')}
          <div class="m_rb_fade ${s.rbPatFadeOn ? '' : 'cb_dim'}">
          ${pickRow('Fade From', posGrid('rbpatfade', s.rbPatFade) + '<div class="cb_hint">Center fades from the middle out.</div>')}
          ${pickRow('Reach', rangeSlider(s, 'rbPatFadeReach') + '<div class="cb_hint">How far the fade goes, in lines of text.</div>')}
          ${pickRow('Softness', rangeSlider(s, 'rbPatFadeSoft') + '<div class="cb_hint">Lower stays see-through longer, with a sharper edge.</div>')}
          </div>
          </div>`)}
          ${card('Reasoning Arrow', `
          ${pickRow('Arrow', pills('rbarrow', [['default', 'Default', 'ST\'s default'], ['none', 'None'], ['symbol', 'Symbol'], ['image', 'Picture']], s.rbArrow))}
          ${pickRow('Symbol', ovText(s, 'rbArrowSym', '▼', 16) + '<div class="cb_hint">Empty shows ST\'s arrow.</div>', ' data-rbarrow="symbol"')}
          <div class="cb_cur_slot" data-rbarrow="image">
            <div class="cb_cur_row">
              <div class="cb_cur_prev" id="m_rba_prev"></div>
              <span class="cb_cur_name">Picture<small>Empty shows ST's arrow.</small></span>
              <button class="menu_button" id="m_rba_up" title="Upload" aria-label="Upload"><i class="fa-solid fa-upload"></i></button>
              <button class="menu_button" id="m_rba_url" title="Use a link" aria-label="Use a link"><i class="fa-solid fa-link"></i></button>
              <button class="menu_button" id="m_rba_clr" title="Remove picture" aria-label="Remove picture"><i class="fa-solid fa-rotate-left"></i></button>
            </div>
            <input type="file" id="m_rba_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
          </div>
          <div data-rbarrow="color">${ovRow(s, 'rbArrowColorOn', 'Arrow Color', ovColor(s, 'rbArrowColor') + '<div class="cb_hint">Color emoji keep their own colors.</div>')}</div>
          <div data-rbarrow="shown">
          ${ovRow(s, 'rbArrowSizeOn', 'Arrow Size', rangeSlider(s, 'rbArrowSize'))}
          ${pickRow('Turn', pills('rbarrowturn', [['flip', 'Flip', 'ST\'s default'], ['quarter', 'Quarter Turn'], ['none', 'None']], s.rbArrowTurn) + '<div class="cb_hint">When the block closes. Quarter Turn suits symbols that point right, like ▶.</div>')}
          ${pickRow('While Thinking', pills('rbarrowanim', [['off', 'Off'], ['spin', 'Spin'], ['pulse', 'Pulse'], ['bounce', 'Bounce']], s.rbArrowAnim) + '<div class="cb_hint">Off with ST\'s Reduced Motion.</div>')}
          </div>`)}
          ${subHead('rb_css', 'Advanced: Custom CSS')}
          <div class="cb_collapse_content">
            ${ovRow(s, 'rbBtnCssOn', 'Button CSS', cssBox('rbBtnCss', 'text-transform: uppercase;&#10;letter-spacing: 1px;'))}
            ${ovRow(s, 'rbCssOn', 'Box CSS', cssBox('rbCss', 'letter-spacing: 1px;&#10;& em { color: gold; }') + '<div class="cb_hint">Use <code>&amp; em { }</code> for italics.</div>')}
            ${ovRow(s, 'rbArrowCssOn', 'Arrow CSS', cssBox('rbArrowCss', 'opacity: .7;') + '<div class="cb_hint">Use <code>&amp;::before { }</code> for a Symbol.</div>')}
            <div class="cb_hint">${CSS_NOTE}</div>
          </div>
    `, 'fa-brain');
  }

  // Message Details: a tick adds or removes a detail from a spot, and a Style sets all of them. Either may change the
  // Style shown.
  function bindMessageDetails(overlay, s) {
    const cells = [...overlay.querySelectorAll('.m_md_cell')];
    const sync = () => {
      cells.forEach((c) => { c.checked = mdList(s, c.dataset.key).includes(c.dataset.item); });
      const r = overlay.querySelector(`input[name="cbr_mdpreset"][value="${mdPreset(s)}"]`);
      if (r) r.checked = true;
    };
    const apply = () => { save(); updateAvatarStyle(); sync(); };
    cells.forEach((c) => {
      c.onchange = () => {
        const list = mdList(s, c.dataset.key).filter((i) => i !== c.dataset.item);
        s[c.dataset.key] = MD_ITEM_IDS.filter((i) => (i === c.dataset.item ? c.checked : list.includes(i)));
        apply();
      };
    });
    onPills(overlay, 'mdpreset', (v) => {
      if (!MD_PRESETS[v]) { sync(); return; }
      for (const [k, list] of Object.entries(MD_PRESETS[v][1])) s[k] = [...list];
      apply();
    });
    onPills(overlay, 'mddate', (v) => { s.mdDate = v; apply(); });
    onPills(overlay, 'mdsep', (v) => { s.mdSep = v; apply(); });
  }

  // Background Image: Upload / Link / Remove, and the rows for Cover or Tile, dimmed until there's a picture.
  function bindReasoningBg(overlay, s, onChange) {
    const syncRows = () => {
      onChange();
      overlay.querySelector('.m_rbbg_rows').classList.toggle('cb_dim', !s.rbBgImg);
      overlay.querySelectorAll('[data-rbbg]').forEach((r) => { r.style.display = r.dataset.rbbg === s.rbBgFit ? '' : 'none'; });
    };
    const set = (k, v) => { s[k] = v; save(); updateAvatarStyle(); syncRows(); };
    onPills(overlay, 'rbbgfit', (v) => set('rbBgFit', v));
    onPills(overlay, 'rbbgpos', (v) => set('rbBgPos', v));
    const prev = overlay.querySelector('#m_rbbg_prev');
    const render = () => {
      prev.innerHTML = s.rbBgImg ? `<img src="${escapeHTML(s.rbBgImg)}" alt="">` : '<i class="fa-solid fa-image"></i>';
      overlay.querySelector('#m_rbbg_clr').disabled = !s.rbBgImg;
    };
    const setImg = (url) => {
      const old = s.rbBgImg;
      set('rbBgImg', url);
      render();
      deleteFileIfUnused(old);
    };
    const file = overlay.querySelector('#m_rbbg_file');
    overlay.querySelector('#m_rbbg_up').onclick = () => file.click();
    overlay.querySelector('#m_rbbg_url').onclick = async function() {
      const url = await askImageUrl('Reasoning background', this, false);
      if (url) setImg(url);
    };
    overlay.querySelector('#m_rbbg_clr').onclick = () => setImg('');
    file.onchange = async () => {
      if (!file.files.length) return;
      try {
        setImg(await uploadImage(file.files[0], 'rbbg', { maxWidth: 1600 }));
      } catch (e) {
        console.error('[NTR reasoning background upload]', e);
        toastr.error(e.message || 'Upload failed', 'Background Picture');
      }
      file.value = '';
    };
    render();
    syncRows();
  }

  // Reasoning Arrow: show the rows for the picked arrow, and the picture's Upload / Link / Remove.
  function bindReasoningArrow(overlay, s) {
    const syncRows = () => {
      const a = s.rbArrow;
      overlay.querySelectorAll('[data-rbarrow]').forEach((r) => {
        const w = r.dataset.rbarrow;
        r.style.display = w === a || (w === 'shown' && a !== 'none') || (w === 'color' && a !== 'none' && a !== 'image') ? '' : 'none';
      });
    };
    const set = (k, v) => { s[k] = v; save(); updateAvatarStyle(); syncRows(); };
    onPills(overlay, 'rbarrow', (v) => set('rbArrow', v));
    onPills(overlay, 'rbarrowturn', (v) => set('rbArrowTurn', v));
    onPills(overlay, 'rbarrowanim', (v) => set('rbArrowAnim', v));
    const prev = overlay.querySelector('#m_rba_prev');
    const render = () => {
      prev.innerHTML = s.rbArrowImg ? `<img src="${escapeHTML(s.rbArrowImg)}" alt="">` : '<i class="fa-solid fa-chevron-up"></i>';
      overlay.querySelector('#m_rba_clr').disabled = !s.rbArrowImg;
    };
    const setImg = (url) => {
      const old = s.rbArrowImg;
      set('rbArrowImg', url);
      render();
      deleteFileIfUnused(old);
    };
    const file = overlay.querySelector('#m_rba_file');
    overlay.querySelector('#m_rba_up').onclick = () => file.click();
    overlay.querySelector('#m_rba_url').onclick = async function() {
      const url = await askImageUrl('Arrow picture', this, false);
      if (url) setImg(url);
    };
    overlay.querySelector('#m_rba_clr').onclick = () => setImg('');
    file.onchange = async () => {
      if (!file.files.length) return;
      try {
        setImg(await uploadImage(file.files[0], 'arrow', { max: 128 }));
      } catch (e) {
        console.error('[NTR arrow upload]', e);
        toastr.error(e.message || 'Upload failed', 'Reasoning Arrow');
      }
      file.value = '';
    };
    render();
    syncRows();
  }

  // One cursor picture: preview, Upload / Link / Remove.
  function cursorSlot(k, label, hint, icon) {
    return `
      <div class="cb_cur_slot">
        <div class="cb_cur_row">
          <div class="cb_cur_prev" id="m_cur_prev_${k}" data-icon="${icon}"></div>
          <span class="cb_cur_name">${label}${hint ? `<small>${hint}</small>` : ''}</span>
          <button class="menu_button m_cur_up" data-k="${k}" title="Upload" aria-label="Upload a ${label} cursor"><i class="fa-solid fa-upload"></i></button>
          <button class="menu_button m_cur_url" data-k="${k}" data-label="${label} cursor" title="Use a link" aria-label="Use a link for the ${label} cursor"><i class="fa-solid fa-link"></i></button>
          <button class="menu_button m_cur_clr" data-k="${k}" title="Remove picture" aria-label="Remove the ${label} cursor"><i class="fa-solid fa-rotate-left"></i></button>
        </div>
      </div>`;
  }

  function scrollbarPartHtml(s) {
    const row = (onKey, label, inner) => ovRow(s, onKey, label, inner);
    return pagePart('Scrollbar', ['m_scroll_enable', s.ovScrollOn], 'el_scroll', `
          <div class="cb_hint">Phones mostly keep their own scrollbars.</div>
          ${row('ovScrollColorOn', 'Scrollbar Color', ovColor(s, 'ovScrollColor'))}
          ${row('ovScrollTrackOn', 'Track Color', ovColor(s, 'ovScrollTrack') + '<div class="cb_hint">The strip behind the scrollbar.</div>')}
          ${subHead('ov_scroll_css', 'Advanced: Custom CSS')}
          <div class="cb_collapse_content">
            ${row('ovScrollCssOn', 'Scrollbar CSS', customCssBox(s, 'ovScrollCss', '::-webkit-scrollbar { width: 6px; height: 6px; }&#10;::-webkit-scrollbar-thumb { border-radius: 0; }')
              + `<div class="cb_hint">Whole CSS rules. Firefox ignores <code>::-webkit-scrollbar</code>. ${CSS_NOTE}</div>`)}
          </div>
    `, 'fa-arrows-up-down');
  }

  function cursorPartHtml(s) {
    return pagePart('Cursor', ['m_cur_enable', s.ovCursorOn], 'el_cursor', `
          <div class="cb_hint">Phones and tablets have no cursor.</div>
          ${cursorSlot('ovCursorImg', 'Normal', '', 'fa-arrow-pointer')}
          ${cursorSlot('ovCursorPtrImg', 'Pointer', 'Links and buttons. Empty keeps the system\'s.', 'fa-hand-pointer')}
          ${cursorSlot('ovCursorTextImg', 'Text', 'Typing boxes. Empty keeps the system\'s.', 'fa-i-cursor')}
          ${cursorSlot('ovCursorDownImg', 'Click', 'While the button is held. Empty keeps the current cursor.', 'fa-computer-mouse')}
          <div class="cb_hint">The top-left corner clicks; for Text, the middle.</div>
          ${ovLabel('Size', rangeSlider(s, 'ovCursorSize'))}
          <div class="cb_hint">Browsers may cut off cursors over 32 px near screen edges. GIFs show their first frame only. If Size does nothing for a link, upload the picture.</div>
          <input type="file" id="m_cur_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
          ${subHead('ov_cursor_css', 'Advanced: Custom CSS')}
          <div class="cb_collapse_content">
            ${ovRow(s, 'ovCursorCssOn', 'Cursor CSS', customCssBox(s, 'ovCursorCss', '.mes_buttons .mes_button { cursor: help; }&#10;.swipe_left, .swipe_right { cursor: grab; }')
              + `<div class="cb_hint">Whole CSS rules. ${CSS_NOTE}</div>`)}
          </div>
    `, 'fa-arrow-pointer');
  }

  // Menu Bar Icons: a row for each drawer on SillyTavern's menu bar, in bar order, then the saved pictures of drawers
  // that aren't on the bar right now (like one from an extension that's switched off). The rows are read when the menu
  // is drawn; bindMenuBarIcons finds each row's drawer in mbRows by its number.
  let mbRows = [];
  const mbName = (id) => id.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();
  function menuBarDrawers() {
    return [...document.querySelectorAll('#top-settings-holder > .drawer')].map((d) => {
      const icon = d.querySelector(':scope > :not(.drawer-content) .drawer-icon');
      const id = MB_ID.test(d.id) ? d.id : '';
      const name = (icon?.title || d.querySelector(':scope > .drawer-toggle')?.title || (id ? mbName(id) : '') || 'Icon').trim().slice(0, 100);
      return { id: icon ? id : '', name, api: !!d.querySelector('#API-status-top') };
    });
  }
  function menuBarIconsPartHtml(s) {
    const live = menuBarDrawers();
    const gone = Object.keys(s.mbIcons).filter((id) => !live.some((d) => d.id === id)).map((id) => ({ id, name: s.mbIcons[id].name || mbName(id), gone: true }));
    mbRows = [...live, ...gone];
    const rows = mbRows.map((r, i) => {
      const name = escapeHTML(r.name);
      const b = (cls, icon, title, aria) => `<button class="menu_button ${cls}" data-mb="${i}" title="${title}" aria-label="${aria} ${name}"><i class="fa-solid ${icon}"></i></button>`;
      return `
      <div class="cb_cur_slot" data-mb="${i}"${r.id && !r.gone ? '' : ' style="opacity: .6;"'}>
        <div class="cb_cur_row">
          <span class="cb_cur_name">${name}<small class="m_mb_note"></small></span>
          ${r.id && !r.gone ? b('m_mb_up', 'fa-upload', 'Upload', 'Upload a picture for') + b('m_mb_url', 'fa-link', 'Use a link', 'Use a link for') : ''}
          ${r.id ? b('m_mb_clr', 'fa-rotate-left', 'Remove picture', 'Remove the picture for') : ''}
        </div>
        <div class="m_mb_mode">${pills('mbmode' + i, [['tint', 'Tint', 'Uses the picture\'s shape in the theme\'s icon color.'], ['full', 'Full Color', 'Shows the picture as it is.']], s.mbIcons[r.id]?.mode)}</div>
      </div>`;
    }).join('');
    return pagePart('ST Menu Bar Icons', ['m_mb_enable', s.mbOn], 'el_mbicons', `
          ${rows}
          <div class="cb_hint" style="margin-bottom: 0;">Tint needs a see-through background. Icons for closed panels stay faded, like ST's.</div>
          <input type="file" id="m_mb_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
    `, 'fa-window-maximize');
  }

  // Whether Tint suits a picture: it has see-through parts, checked small. A picture its site doesn't let other sites
  // read can't be tinted either (see mbReady), so it counts as not suiting Tint.
  async function hasClear(src) {
    try {
      const c = document.createElement('canvas');
      c.width = c.height = 32;
      const g = c.getContext('2d');
      g.drawImage(await loadCors(src), 0, 0, 32, 32);
      const d = g.getImageData(0, 0, 32, 32).data;
      for (let k = 3; k < d.length; k += 4) if (d[k] < 250) return true;
      return false;
    } catch (e) { return false; }
  }

  function bindMenuBarIcons(overlay, s) {
    const file = overlay.querySelector('#m_mb_file');
    let pending = -1;
    // Pictures this menu already waits on, so each one redraws the rows once when it's done.
    const waiting = new Set();
    const slot = (i) => overlay.querySelector(`.cb_cur_slot[data-mb="${i}"]`);
    const render = () => {
      if (!overlay.isConnected) return;
      mbRows.forEach((r, i) => {
        const el = slot(i);
        const e = s.mbIcons[r.id];
        const ok = e ? mbReady(e.img) : null;
        if (e && ok === null && !waiting.has(e.img)) { waiting.add(e.img); mbWait.get(e.img)?.then(render); }
        el.querySelector('.m_mb_note').textContent = !r.id ? 'This icon can\'t take a picture.'
          : r.gone ? 'Not on the menu bar right now. Kept in case it comes back.'
          : ok === false ? 'Didn\'t load. ST\'s icon shows instead.'
          : ok === 'plain' && e.mode === 'tint' ? 'Its site doesn\'t allow Tint, so it shows in Full Color. Upload the picture to tint it.'
          : e && r.api ? 'While not connected, ST\'s warning shows instead.' : '';
        const clr = el.querySelector('.m_mb_clr');
        if (clr) clr.disabled = !e;
        el.querySelector('.m_mb_mode').hidden = !e || r.gone;
        const pick = e && el.querySelector(`input[name="cbr_mbmode${i}"][value="${e.mode}"]`);
        if (pick) pick.checked = true;
      });
    };
    const set = (i, img, mode) => {
      const r = mbRows[i];
      const old = s.mbIcons[r.id]?.img;
      if (img) s.mbIcons[r.id] = { img, mode, name: r.name };
      else delete s.mbIcons[r.id];
      save(); updateAvatarStyle();
      if (!img && r.gone) slot(i).hidden = true;
      render();
      deleteFileIfUnused(old);
    };
    overlay.querySelectorAll('.m_mb_up').forEach((b) => { b.onclick = () => { pending = Number(b.dataset.mb); file.click(); }; });
    overlay.querySelectorAll('.m_mb_url').forEach((b) => {
      b.onclick = async () => {
        const i = Number(b.dataset.mb);
        const url = await askImageUrl(`${mbRows[i].name} icon`, b, false);
        if (url) set(i, url, await hasClear(url) ? 'tint' : 'full');
      };
    });
    overlay.querySelectorAll('.m_mb_clr').forEach((b) => { b.onclick = () => set(Number(b.dataset.mb), ''); });
    mbRows.forEach((r, i) => onPills(slot(i), 'mbmode' + i, (v) => {
      if (!s.mbIcons[r.id]) return;
      s.mbIcons[r.id].mode = v;
      save(); updateAvatarStyle(); render();
    }));
    file.onchange = async () => {
      const f = file.files[0];
      const i = pending;
      // Cleared now, so the same picture can be picked again while this one uploads.
      file.value = '';
      if (!f || i < 0) return;
      try {
        // The row is kept from before the upload: picking another icon meanwhile changes pending.
        const url = await uploadImage(f, 'baricon', { max: 128 });
        set(i, url, await hasClear(url) ? 'tint' : 'full');
      } catch (e) {
        console.error('[NTR menu bar icon upload]', e);
        toastr.error(e.message || 'Upload failed', 'ST Menu Bar Icons');
      }
    };
    render();
  }

  function mdPartHtml(s) {
    const row = (onKey, label, inner) => ovRow(s, onKey, label, inner);
    const hint = (t) => `<div class="cb_hint">${t}</div>`;
    const pickRow = (title, inner) => `<div class="cb_ovrow"><div class="cb_plab">${title}</div><div class="m_o_body">${inner}</div></div>`;
    // A tick for each detail in each spot. A detail can show in more than one.
    const grid = `<div class="ntr_mdgrid"><span></span>${MD_SPOTS.map(([, , label]) => `<span class="ntr_mdh">${label}</span>`).join('')}
      ${MD_ITEMS.map(([id, label]) => `<span>${label}</span>${MD_SPOTS.map(([, key, spot]) => `<label title="${label}: ${spot}"><input type="checkbox" class="m_md_cell" data-key="${key}" data-item="${id}" ${mdList(s, key).includes(id) ? 'checked' : ''}></label>`).join('')}`).join('')}</div>`;
    return pagePart('Message Details', ['m_md_enable', s.mdOn], 'el_md', `
          ${hint('Moves and restyles each message\'s details. While on, the ticks below replace ST\'s Message Timer, Timestamps, Message IDs and Message Token Count.')}
          ${pickRow('Style', pills('mdpreset', [...Object.entries(MD_PRESETS).map(([v, [l]]) => [v, l]), ['custom', 'Custom']], mdPreset(s))
            + hint('Changing a tick after makes it Custom.'))}
          ${grid}
          ${hint('Corner sits at the end of the text, inside the bubble with Speech Bubbles. A message ending in a table or HTML moves it to the end of Below. Tokens show only while ST\'s Message Token Count is on.')}
          ${pickRow('Date', pills('mddate', [['long', 'Long'], ['short', 'Short']], s.mdDate))}
          ${pickRow('Separator', pills('mdsep', [['dot', '·'], ['bar', '|'], ['slash', '/'], ['space', 'Space']], s.mdSep) + hint('Avatar stacks them one per line. Date and time stay together.'))}
          ${row('mdSizeOn', 'Size', rangeSlider(s, 'mdSize'))}
          ${row('mdColorOn', 'Color', ovColor(s, 'mdColor'))}
          ${row('mdOpacityOn', 'Opacity', rangeSlider(s, 'mdOpacity') + hint('ST\'s is 70%.'))}
          ${row('mdPillOn', 'Background', ovColor(s, 'mdPill'))}
    `, 'fa-clock');
  }

  function qrPartHtml(s) {
    const row = (onKey, label, inner) => ovRow(s, onKey, label, inner);
    const hint = (t) => `<div class="cb_hint">${t}</div>`;
    return pagePart('Quick Replies', ['m_qr_enable', s.ovQrOn], 'el_qr', `
          ${hint('Restyles ST\'s Quick Reply bar and pop-out. A set\'s own color still shows behind its buttons.')}
          ${card('Buttons', `
          ${ovShapeRow(s, 'Qr')}
          ${ovBgRow(s, 'Qr')}
          ${ovBorderRow(s, 'Qr')}
          ${row('ovQrTextOn', 'Text Color', ovColor(s, 'ovQrText'))}
          ${row('ovQrHoverOn', 'Hover Background', ovColor(s, 'ovQrHover'))}
          ${row('ovQrSizeOn', 'Text Size', rangeSlider(s, 'ovQrSize'))}`)}
          ${card('Bar', `
          ${row('ovQrWrapOn', 'Rows', ovPick(s, 'ovQrWrap', [['wrap', 'Wrap into Rows'], ['scroll', 'One Scrolling Row']]))}
          ${row('ovQrGapOn', 'Gap', rangeSlider(s, 'ovQrGap'))}
          ${row('ovQrAlignOn', 'Alignment', ovPick(s, 'ovQrAlign', [['left', 'Left'], ['center', 'Center'], ['right', 'Right']]))}
          ${row('ovQrOpacityOn', 'Bar Opacity', rangeSlider(s, 'ovQrOpacity') + hint('ST\'s is 70%.'))}`)}
          ${subHead('ov_qr_css', 'Advanced: Custom CSS')}
          <div class="cb_collapse_content">
            ${row('ovQrCssOn', 'Quick Replies CSS', customCssBox(s, 'ovQrCss', '#qr--bar .qr--button { font-weight: bold; }&#10;#qr--bar .qr--button:hover { transform: scale(1.05); }')
              + hint(`Whole CSS rules. The bar is <code>#qr--bar</code>, the pop-out <code>#qr--popout</code>, each button <code>.qr--button</code>. ${CSS_NOTE}`))}
          </div>
    `, 'fa-reply');
  }

  document.addEventListener('pointerover', onCursorOver, true);
  document.addEventListener('pointerdown', onCursorDown, true);
  for (const ev of ['pointerup', 'pointercancel']) document.addEventListener(ev, onCursorUp, true);
  window.addEventListener('blur', onCursorUp);

  // What index.js calls. sync runs while NTR is off too: that's what takes the labels, details and Custom CSS away.
  window.NTR.elements = {
    version: ELEMENTS_VERSION,
    sectionHtml: elementsSectionHtml,
    bind: bindElements,
    css: (s) => {
      if (isOn()) return elementsCss(s);
      cursorKinds = {};
      return '';
    },
    sync: () => {
      syncCustomCss();
      watchMessages();
      syncReasoningLabels();
      syncMessageDetails();
    },
  };
})();
