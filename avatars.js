// Nitwit Tavern Redesign: Avatar Management module: NTR Avatars (In Line, Backdrop and Pop Out), avatar shapes,
// fades and crop, and the page that sets them. Loaded by index.js before NTR starts, so its styles are there from the
// first draw. If this file breaks, the rest of the extension keeps working, with SillyTavern's own avatars.
// The settings, their limits and the lists they're checked against stay in index.js, and so do the pop-out pictures'
// layer and loading (Edit Placement is in layout.js); this file writes their size and position CSS. It builds from
// what index.js shares in window.NTR.api.look.
(() => {
  const AVATARS_VERSION = '2.86.4';
  const A = window.NTR && window.NTR.api;
  if (!A || !A.look) { console.error('[NTR] avatars.js loaded without the core (index.js).'); return; }
  const { DEFAULTS, askText, askYes, closePops, deleteFileIfUnused, escapeHTML, fullResUrl, loadImg, newId, numRange, onPills, pageHtml, pills, popMenu, posGrid,
    rangeAttrs, rangeNum, save, settings, startPlacement, subHead, tiles, uploadImage } = A;
  const { CSS_NOTE, FILTER_OPTS, FRAME_IDS, FRAME_SERIES, TEXTURE_OPTS, POS_GRID, SHAPE_OPTS, castPartHtml, cssTag, cUrl, customCssBox, frameUrl, ntrAvatars, ovRow, popMsg,
    restyle: updateAvatarStyle, svgMask } = A.look;
  const openCombinedModal = () => A.openMenu();

  // The avatar fades by their place on the fade grid (the Position grid's cells): [setting, name]. The middle has none.
  const FADE_PARTS = {
    tl: ['FadeTL', 'Top Left'], tc: ['FadeTop', 'Top'], tr: ['FadeTR', 'Top Right'], cl: ['FadeLeft', 'Left'],
    cr: ['FadeRight', 'Right'], bl: ['FadeBL', 'Bottom Left'], bc: ['FadeBot', 'Bottom'], br: ['FadeBR', 'Bottom Right'],
  };

  // Avatar shapes, like SillyTavern's own: their height for a width of 1. Round is a circle and Oval an ellipse as tall
  // as Rectangle; Rectangle and Square take Corners.
  const SHAPES = { round: 1, oval: 1.5, rectangle: 1.5, square: 1, heart: 1, star: 1 };
  const ellipse = (shape) => shape === 'round' || shape === 'oval';

  // Heart and Star are outlines that cut the picture (a mask), drawn in a 100 x 100 box stretched over the frame. The
  // star's points are thick, so it keeps more of the picture.
  const STAR = Array.from({ length: 10 }, (_, i) => {
    const a = (i * 36 - 90) * Math.PI / 180, r = i % 2 ? 24 : 50;
    return `${(50 + r * Math.cos(a)).toFixed(1)} ${(54.8 + r * Math.sin(a)).toFixed(1)}`;
  });
  const OUTLINES = {
    heart: svgMask('M50 96C22 76 0 56 0 30C0 13 13 2 28 2C38 2 46 8 50 17C54 8 62 2 72 2C87 2 100 13 100 30C100 56 78 76 50 96Z'),
    star: svgMask(`M${STAR.join('L')}Z`),
  };

  // The Shape tiles' pictures: Circle, Oval, Rectangle and Square drawn as boxes, Heart and Star cut by their outlines.
  const SHAPE_FACES = {
    round: 'width: 22px; height: 22px; border-radius: 50%;', oval: 'width: 15px; height: 22px; border-radius: 50%;', rectangle: 'width: 15px; height: 22px; border-radius: 2px;', square: 'width: 20px; height: 20px; border-radius: 2px;',
    heart: `width: 24px; height: 24px; -webkit-mask: ${OUTLINES.heart} center / 100% 100% no-repeat; mask: ${OUTLINES.heart} center / 100% 100% no-repeat;`,
    star: `width: 24px; height: 24px; -webkit-mask: ${OUTLINES.star} center / 100% 100% no-repeat; mask: ${OUTLINES.star} center / 100% 100% no-repeat;`,
  };
  const shapeTiles = (prefix, cur) => tiles(`${prefix}shape`, 'Shape', SHAPE_OPTS.map(([v, l]) => [v, l,
    SHAPE_FACES[v] ? `<span style="display: block; background: currentColor; ${escapeHTML(SHAPE_FACES[v])}"></span>` : '']), cur).replace('class="ntr_tiles', 'class="ntr_tiles ntr_shapes');

  // Filters, at a Filter Strength s from 0 to 1, as the picture's CSS filter. k sizes Dreamy's blur for a smaller
  // picture (the menu's previews).
  const r3 = (x) => +x.toFixed(3);
  const FILTERS = {
    piss: { fx: (s) => `sepia(${r3(0.6 * s)}) contrast(${r3(1 + 0.1 * s)}) saturate(${r3(1 - 0.2 * s)})` },
    bw: { fx: (s) => `grayscale(${r3(s)})` },
    noir: { fx: (s) => `grayscale(${r3(s)}) contrast(${r3(1 + 0.6 * s)}) brightness(${r3(1 - 0.15 * s)})` },
    faded: { fx: (s) => `contrast(${r3(1 - 0.3 * s)}) brightness(${r3(1 + 0.1 * s)}) saturate(${r3(1 - 0.4 * s)})` },
    dreamy: { fx: (s, k = 1) => `blur(${r3(1.5 * s * k)}px) brightness(${r3(1 + 0.12 * s)}) saturate(${r3(1 + 0.2 * s)})` },
  };
  // Grainy's grain: noise drawn once into a small tile, its dark specks see-through between them.
  const GRAIN = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.4 0 0 0 -0.62"/></filter><rect width="120" height="120" filter="url(#g)"/></svg>')}")`;
  // Textures: still layers over the picture, as their CSS background. Texture Strength is the layer's opacity.
  const TEXTURES = {
    scanlines: 'background: repeating-linear-gradient(to bottom, rgba(0, 0, 0, 0.4) 0 1px, transparent 1px 3px);',
    vhs: 'background: linear-gradient(to bottom, transparent 0 17%, rgba(255, 255, 255, 0.16) 17% 18.2%, transparent 18.2% 58%, rgba(255, 255, 255, 0.12) 58% 59%, transparent 59% 86%, rgba(255, 255, 255, 0.22) 86% 89%, transparent 89%),'
      + ' linear-gradient(to right, rgba(255, 0, 80, 0.22), transparent 7% 93%, rgba(0, 220, 255, 0.22)),'
      + ' repeating-linear-gradient(to bottom, rgba(0, 0, 0, 0.25) 0 1px, transparent 1px 4px);',
    grainy: `background: ${GRAIN} 0 0 / 120px 120px repeat;`,
    pixel: 'background: repeating-linear-gradient(to right, rgba(0, 0, 0, 0.3) 0 1px, transparent 1px 3px), repeating-linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0 1px, transparent 1px 3px);',
  };
  // A side's Filter as the picture's filter rule, and its Texture as the rule for the layer over it (the box's ::after).
  // Shape Only turns the layer back with the picture, a little bigger so it still fills the turned shape.
  function lookCss(s, prefix) {
    const f = FILTERS[s[`${prefix}Filter`]];
    const fStr = rangeNum(s, prefix + 'FilterStr') / 100;
    const t = TEXTURES[s[`${prefix}Texture`]];
    const tStr = rangeNum(s, prefix + 'TextureStr') / 100;
    const turn = rangeNum(s, prefix + 'Rotate');
    return {
      filter: f && fStr ? `filter: ${f.fx(fStr)} !important;` : '',
      layer: t && tStr ? `content: '' !important; position: absolute !important; inset: 0 !important; pointer-events: none !important; z-index: 1 !important; opacity: ${r3(tStr)} !important; ${t}`
        + (shapeOnly(s, prefix) ? ` transform: rotate(${-turn}deg) scale(${r3(turnCover(s[`${prefix}Shape`], turn))}) !important;` : '') : '',
    };
  }
  // The newest picture of a side in the chat, for the menu's previews.
  const sidePic = (prefix) => {
    const imgs = document.querySelectorAll(`#chat .mes[is_user="${prefix === 'us'}"] .avatar img`);
    return imgs[imgs.length - 1]?.getAttribute('src');
  };
  // A preview tile's picture: that side's newest picture, or a sample without one, with a filter on and a texture over it.
  function previewFace(src, fx, layer) {
    const pic = src ? `<img src="${escapeHTML(src)}" alt="" style="display: block; width: 100%; height: 100%; object-fit: cover; object-position: 50% 20%; ${fx}">`
      : `<span style="display: block; width: 100%; height: 100%; background: linear-gradient(135deg, #d98a6a, #e8c27a 45%, #6a9ad9); ${fx}"></span>`;
    return `<span style="position: relative; display: block; width: 100%; height: 100%;">${pic}${layer ? `<span style="position: absolute; inset: 0; ${escapeHTML(layer)}"></span>` : ''}</span>`;
  }
  // The Filter and Texture tiles. Each group previews only its own effect, at full strength.
  const filterTiles = (prefix, cur) => tiles(`${prefix}filter`, 'Filter',
    FILTER_OPTS.map(([v, l]) => [v, l, previewFace(sidePic(prefix), FILTERS[v] ? `filter: ${FILTERS[v].fx(1, 0.25)};` : '', '')]), cur, true);
  const textureTiles = (prefix, cur) => tiles(`${prefix}texture`, 'Texture',
    TEXTURE_OPTS.map(([v, l]) => [v, l, previewFace(sidePic(prefix), '', TEXTURES[v] || '')]), cur, true);
  // Custom CSS for each side's avatar box (the frame, on Pop Out), in its own style tag so a typo can't break the
  // others. Gone while NTR, Avatar Management or that side is off.
  function syncAvatarCss() {
    const s = settings();
    for (const [p, flag] of [['ai', 'false'], ['us', 'true']]) {
      const c = ntrAvatars(s, p) && s[p + 'CssOn'] ? String(s[p + 'Css'] || '').slice(0, 2000).trim() : '';
      cssTag(`ntr_av_css_${p}`, c ? `${s[p + 'Style'] === 'popout' ? `#cb_popf_${p}` : `#chat .mes[is_user="${flag}"] .avatar`} { ${c} }` : '');
    }
  }

  // Shape Only turns the shape and turns the picture back inside it, so the picture is made bigger by this much to still
  // fill the turned shape's corners. A circle needs none, and an oval only enough to reach its turned width and height.
  function turnCover(shape, turn) {
    if (!shape || shape === 'round' || !turn) return 1;
    const a = turn * Math.PI / 180, c = Math.abs(Math.cos(a)), sn = Math.abs(Math.sin(a)), h = SHAPES[shape];
    if (shape === 'oval') return Math.max(Math.hypot(c, h * sn), Math.hypot(sn / h, c));
    return Math.max(c + h * sn, sn / h + c);
  }
  // Whether a side's Rotation turns the shape alone (Shape Only), and not the picture with it.
  const shapeOnly = (s, prefix) => !!SHAPES[s[`${prefix}Shape`]] && s[`${prefix}RotateMode`] !== 'both' && rangeNum(s, prefix + 'Rotate') !== 0;

  // A side's Frame picture: a built-in frame, or one of yours (a link).
  function frameSrc(s, prefix) {
    const img = frameUrl(s[prefix + 'Frame']) || cUrl(s[prefix + 'FrameImg']);
    return img && !img.startsWith('data:video/') ? img : '';
  }
  // The Frame library's folders as shown: the built-in ones you haven't hidden, then yours. Each frame has its tile
  // value (id), name and picture (src); yours also have their link (img).
  function frameFolders(s) {
    return [
      ...FRAME_SERIES.filter((f) => !s.frameHidden.includes(f.id)).map((f) => ({ id: f.id, name: f.name, builtin: true,
        frames: f.frames.map(([v, name]) => ({ id: `${f.id}/${v}`, name, src: frameUrl(`${f.id}/${v}`) })) })),
      ...s.frameLib.folders.map((f) => ({ id: f.id, name: f.name, own: f, frames: f.frames.map((fr) => ({ id: fr.id, name: fr.name, src: fr.img, img: fr.img })) })),
    ];
  }
  // A side's frame in the library: { folder, frame }, { other: true } for a picture that isn't in it (from a theme),
  // or null for none. A frame in a hidden folder is still found.
  function frameNow(s, prefix) {
    const b = s[prefix + 'Frame'];
    if (FRAME_IDS.includes(b)) {
      const f = FRAME_SERIES.find((x) => b.startsWith(x.id + '/'));
      const [, name] = f.frames.find(([v]) => `${f.id}/${v}` === b);
      return { folder: { id: f.id, name: f.name, builtin: true }, frame: { id: b, name } };
    }
    const img = cUrl(s[prefix + 'FrameImg']);
    if (!img) return null;
    for (const f of s.frameLib.folders) {
      const fr = f.frames.find((x) => x.img === img);
      if (fr) return { folder: { id: f.id, name: f.name, own: f }, frame: { id: fr.id, name: fr.name, img } };
    }
    return { other: true };
  }
  // The key a side's fit is remembered under: the built-in frame, or the picture's link.
  const fitKey = (s, prefix) => FRAME_IDS.includes(s[prefix + 'Frame']) ? s[prefix + 'Frame'] : cUrl(s[prefix + 'FrameImg']);

  // A side's Frame on In Line and Pop Out: its picture, its size in picture widths (k), and how far it's moved from the
  // picture's middle (x, y), also in picture widths. Null without a picture.
  function frameOf(s, prefix) {
    const img = frameSrc(s, prefix);
    if (!img) return null;
    return { img, k: rangeNum(s, prefix + 'FrameSize') / 100, x: rangeNum(s, prefix + 'FrameX') / 100, y: rangeNum(s, prefix + 'FrameY') / 100 };
  }
  // The Frame's box is the picture's box made k times bigger, so a frame never stretches: its picture fits inside the
  // box (contain). fw and fh are the picture box's width and height. Where it goes and what it turns around (the
  // picture's middle) are from the picture box's top left. turn is the Rotation it gets, in degrees.
  function frameBox(f, fw, fh, turn = 0) {
    const n = (v) => +v.toFixed(4);
    // The turned frame's reach: half its width and height across, and its middle, moved by the turn.
    const t = turn * Math.PI / 180, C = Math.cos(t), S = Math.sin(t), c = Math.abs(C), s = Math.abs(S);
    const mx = f.x * C - f.y * S, my = f.x * S + f.y * C;
    // [times fw, times fh] for the top, right, bottom and left.
    const reach = [[s * f.k / 2 - my, (c * f.k - 1) / 2], [c * f.k / 2 + mx - 0.5, s * f.k / 2],
      [s * f.k / 2 + my, (c * f.k - 1) / 2], [c * f.k / 2 - mx - 0.5, s * f.k / 2]];
    return {
      size: `width: calc(${fw} * ${n(f.k)}); height: calc(${fh} * ${n(f.k)});`,
      left: `calc(${fw} * ${n((1 - f.k) / 2 + f.x)})`,
      top: `calc(${fh} * ${n((1 - f.k) / 2)} + ${fw} * ${n(f.y)})`,
      origin: `transform-origin: calc(${fw} * ${n(f.k / 2 - f.x)}) calc(${fh} * ${n(f.k / 2)} - ${fw} * ${n(f.y)});`,
      // How far it reaches past each side of the picture, turned, for the room In Line keeps around it.
      spill: reach.map(([w, h]) => `max(0px, ${fw} * ${n(w)} + ${fh} * ${n(h)})`),
      bg: `background: url("${f.img}") center / contain no-repeat;`,
    };
  }

  // Where the picture sits in its box, w wide (and ar its shape, if given). Shift Left/Right and Up/Down pick which part
  // of a picture bigger than its box shows: the picture's point at those %s goes on the box's point at the same %s, so
  // 0% shows its left or top edge and 100% its right or bottom. Zoom makes it bigger around that point. Shape Only turns
  // it back around the box's middle, a little bigger so the turned shape's corners stay filled. cqw and cqh are 1% of
  // the box's width and height.
  function imgPlaceCss(s, prefix, w, ar) {
    const x = rangeNum(s, prefix + 'ShiftX'), y = rangeNum(s, prefix + 'Focus'), zoom = rangeNum(s, prefix + 'Zoom') / 100;
    const turn = rangeNum(s, prefix + 'Rotate');
    const back = shapeOnly(s, prefix)
      ? ` translate(${50 - x}cqw, ${50 - y}cqh) rotate(${-turn}deg) scale(${+turnCover(s[`${prefix}Shape`], turn).toFixed(4)}) translate(${x - 50}cqw, ${y - 50}cqh)` : '';
    return `left: ${x}% !important; right: auto !important; top: ${y}% !important; bottom: auto !important;`
      + ` transform-origin: ${x}% ${y}% !important; transform: translate(-${x}%, -${y}%)${back}${zoom !== 1 ? ` scale(${zoom})` : ''} !important;`
      + ` width: ${w} !important; height: auto !important; max-width: none !important; max-height: none !important;`
      + (ar ? ` aspect-ratio: ${ar} !important;` : '');
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
    const look = lookCss(s, prefix);
    const zoom = n('Zoom') / 100;
    const turn = n('Rotate');
    const turnCss = turn ? ` rotate(${turn}deg)` : '';
    const frame = style !== 'backdrop' ? frameOf(s, prefix) : null;
    
    const width = Math.floor(scale * 3); 
    // A shape is a frame Image Scale sizes: its width, and its height from the shape. Corners are a % of the width.
    const aspect = shape ? SHAPES[shape] : 1;
    const frameH = Math.round(width * aspect);
    const frameR = ellipse(shape) ? '50%' : OUTLINES[shape] ? '0' : `${Math.round(width * n('Corner') / 100)}px`;

    let padCss = '';
    if (h === 'l') padCss = `padding-left: ${pad}px !important;`;
    else if (h === 'r') padCss = `padding-right: ${pad}px !important;`;
    else padCss = `padding-left: ${Math.floor(pad / 2)}px !important; padding-right: ${Math.floor(pad / 2)}px !important;`;

    const justify = h === 'l' ? 'flex-start' : (h === 'r' ? 'flex-end' : 'center');
    const align = h === 'l' ? 'left' : (h === 'r' ? 'right' : 'center');
    const layerCss = (sel) => (look.layer ? `${sel}::after { ${look.layer} }` : '');

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
      // The frame is the shape, or the picture's own shape for None, and the picture fills it.
      return `
        .mes[is_user="${isUserStr}"] .avatar { display: none !important; }
        #cb_popf_${prefix} {
          ${vA} ${hA}
          width: ${width}px; ${shape ? `height: ${frameH}px;` : 'aspect-ratio: var(--cb-ar, 0.6667);'}
          border-radius: ${shape ? frameR : '0'};
          ${OUTLINES[shape] ? `-webkit-mask: ${OUTLINES[shape]} center / 100% 100% no-repeat; mask: ${OUTLINES[shape]} center / 100% 100% no-repeat;` : ''}
          transform: translate(calc(${tx} + ${popX}px), calc(${ty} + ${popY}px))${turnCss};
        }
        ${layerCss(`#cb_popf_${prefix}`)}
        ${frame ? (() => {
          // The Frame's layer goes where the picture is, with the same turn around the picture's middle.
          const fh = shape ? `${frameH}px` : `(${width}px / var(--cb-ar, 0.6667))`;
          const b = frameBox(frame, `${width}px`, fh);
          const frac = (t) => (t === '-50%' ? -0.5 : t === '-100%' ? -1 : 0);
          return `#cb_popr_${prefix} {
          ${vA} ${hA} ${b.size} ${b.bg} ${b.origin}
          transform: translate(calc(${width}px * ${frac(tx)} + ${b.left} + ${popX}px), calc(${fh} * ${frac(ty)} + ${b.top} + ${popY}px))${turnCss};
        }`;
        })() : ''}
        #cb_pop_${prefix} { ${imgPlaceCss(s, prefix, 'max(100cqw, 100cqh * var(--cb-ar, 0.6667))', 'var(--cb-ar, 0.6667)')} ${look.filter} }
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
      + ` transform: translate(${h === 'c' ? '-50%' : '0'}, ${v === 'c' ? '-50%' : '0'})${turnCss} !important;`;
    const boxW = boxAR ? 'auto' : noneW;

    // Fade Strength bends every fade the same way. At 50% a fade goes evenly from gone at the edge to all there where it
    // ends; lower keeps more of the picture in it (0%: no fade), higher less (100%: the faded part is gone). u is the
    // place in a fade, 0 at the edge and 1 where it ends.
    const str = n('FadeStr') / 100;
    const bend = str / (1 - str);
    // Each stop: [u, how much of the picture shows there]. 100% is a hard edge where the fade ends.
    const stops = str >= 1 ? [[0, 0], [1, 0], [1, 1]]
      : (bend === 1 ? [0, 1] : Array.from({ length: 9 }, (_, i) => i / 8)).map((u) => [u, +Math.pow(u, bend).toFixed(3)]);
    // A side's fade, as stops from its edge in, len % long. The far side's are counted from 100%.
    const band = (len, far) => stops.map(([u, a]) => `rgba(0,0,0,${a}) ${+(far ? 100 - u * len : u * len).toFixed(2)}%`);
    // Two facing fades longer than the picture are shortened alike, so they meet without a hard line.
    const pair = (a, b, dir) => {
      const k = a + b > 100 ? 100 / (a + b) : 1;
      return `linear-gradient(${dir}, ${[...band(a * k, false), ...band(b * k, true).reverse()].join(', ')})`;
    };
    const hMask = pair(leftFade, rightFade, 'to right');
    const vMask = pair(topFade, botFade, 'to bottom');
    // A corner fade is a rounded fade from that corner, reaching its % of the picture's width and height.
    const corners = [['TL', '0% 0%'], ['TR', '100% 0%'], ['BL', '0% 100%'], ['BR', '100% 100%']]
      .filter(([k]) => n('Fade' + k) > 0)
      .map(([k, at]) => `radial-gradient(${n('Fade' + k)}% ${n('Fade' + k)}% at ${at}, ${band(100, false).join(', ')})`);
    const masks = [...(OUTLINES[shape] ? [OUTLINES[shape]] : []), hMask, vMask, ...corners].join(', ');
    // The fades go on the avatar's box, which is what shows of the picture.
    const maskCss = `-webkit-mask-image: ${masks} !important; -webkit-mask-composite: source-in !important;`
      + ` mask-image: ${masks} !important; mask-composite: intersect !important;`
      + ' -webkit-mask-size: 100% 100% !important; mask-size: 100% 100% !important; -webkit-mask-repeat: no-repeat !important; mask-repeat: no-repeat !important;';

    // The image is sized to the picture itself: Fill covers the box and gets cropped by it, Fit fits inside it, Original
    // keeps the picture's own size. 100cqw and 100cqh are the box's width and height.
    const imgW = fit === 'contain' ? `min(100cqw, 100cqh * ${ar})` : fit === 'original' ? 'auto' : `max(100cqw, 100cqh * ${ar})`;
    const imgCss = `
      #chat .mes[is_user="${isUserStr}"] .avatar img {
        position: absolute !important; ${imgPlaceCss(s, prefix, imgW, fit === 'original' ? '' : ar)}
        display: block !important; margin: 0 !important; padding: 0 !important; border: none !important; border-radius: 0 !important;
        -webkit-mask-image: none !important; mask-image: none !important;
        object-fit: fill !important;
        ${look.filter}
      }`;

    if (style === 'inline') {
      // In Line: the avatar stays in SillyTavern's avatar spot, in the message's flow, so the text never goes under it.
      // The left or right of the grid puts it on that side of the text and its row lines it up with the text's top,
      // middle or bottom. The middle column puts it above the text, or below it on the bottom row.
      const where = h === 'c' ? (v === 'b' ? 'below' : 'above') : h === 'r' ? 'right' : 'left';
      const stacked = where === 'above' || where === 'below';
      const boxShape = framed ? `aspect-ratio: 1 / ${aspect} !important; border-radius: ${frameR} !important;` : `aspect-ratio: ${ar} !important; border-radius: 0 !important;`;
      // The Frame sits on the avatar's wrapper, outside the shape and fades that cut the picture. The picture is at the
      // wrapper's top left, or top middle above or below the text. The wrapper keeps room for what reaches past it.
      // The avatar's width, at most 40vw like the avatar's own.
      const avW = `min(${fit === 'original' ? `var(--cb-nw, ${width}px)` : `${width}px`}, 40vw)`;
      const b = frame && frameBox(frame, 'var(--ntr-fw)', 'var(--ntr-fh)', turn);
      const gap = (side) => (where === side ? ' + 6px' : '');
      const frameCss = b ? `
      #chat .mes[is_user="${isUserStr}"] .mesAvatarWrapper {
        position: relative !important; --ntr-fw: ${avW}; --ntr-fh: ${framed ? `calc(${avW} * ${aspect})` : `calc(${avW} / ${ar})`};
        margin: calc(${b.spill[0]}${gap('below')}) ${stacked ? '0' : b.spill[1]} calc(${b.spill[2]}${gap('above')}) ${stacked ? '0' : b.spill[3]} !important;
      }
      #chat .mes[is_user="${isUserStr}"] .mesAvatarWrapper::before {
        content: '' !important; position: absolute !important; z-index: 1 !important; pointer-events: none !important;
        left: ${stacked ? `calc(50% - var(--ntr-fw) / 2 + ${b.left})` : b.left} !important; top: ${b.top} !important;
        ${b.size} ${b.bg} ${b.origin}
        ${turn ? `transform: rotate(${turn}deg);` : ''}
      }` : '';
      // The row's direction is set here too: themes often flip User messages, which would swap left and right.
      return `
      #chat .mes[is_user="${isUserStr}"] { flex-direction: row !important; }
      ${stacked ? `#chat .mes[is_user="${isUserStr}"] { flex-wrap: wrap !important; }
      #chat .mes[is_user="${isUserStr}"] .mes_block { flex: 0 0 100% !important; }` : ''}
      ${where === 'above' ? `/* SillyTavern keeps room for the swipe arrows under the newest message's avatar; above the text, that room goes under the text. */
      #chat .last_mes[is_user="${isUserStr}"] .mesAvatarWrapper { padding-bottom: 0 !important; }
      #chat .last_mes[is_user="${isUserStr}"] .mes_block { padding-bottom: var(--avatar-base-height) !important; }` : ''}
      #chat .mes[is_user="${isUserStr}"] .mesAvatarWrapper {
        order: ${where === 'right' || where === 'below' ? 1 : 0} !important;
        ${stacked ? `flex: 0 0 100% !important; display: flex !important; flex-direction: column !important; align-items: center !important; margin-${where === 'above' ? 'bottom' : 'top'}: 6px !important;`
          : `align-self: ${v === 't' ? 'flex-start' : v === 'b' ? 'flex-end' : 'center'} !important;`}
      }
      ${frameCss}
      #chat .mes[is_user="${isUserStr}"] .avatar {
        position: relative !important; flex: none !important;
        width: ${fit === 'original' ? `var(--cb-nw, ${width}px)` : `${width}px`} !important; height: auto !important; max-width: 40vw !important; ${boxShape}
        overflow: hidden !important; container-type: size !important;
        margin: 0 !important; padding: 0 !important; background: transparent !important; border: none !important; cursor: pointer;
        ${turn ? `transform: rotate(${turn}deg) !important;` : ''}
        ${maskCss}
      }
      ${layerCss(`#chat .mes[is_user="${isUserStr}"] .avatar`)}
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
      }
      ${layerCss(`#chat .mes[is_user="${isUserStr}"] .avatar`)}
      ${imgCss}
      ${shared}
    `;
  }

  // A chat avatar picture's shape and width, so the image can be sized to the picture (see getAvatarCss). The wrapper
  // gets them too, for the Frame.
  function setAvatarRatio(img) {
    if (!img.naturalWidth || !img.naturalHeight) return;
    img.style.setProperty('--cb-ar', (img.naturalWidth / img.naturalHeight).toFixed(4));
    for (const box of [img.parentElement, img.closest('.mesAvatarWrapper')]) {
      box?.style.setProperty('--cb-nw', img.naturalWidth + 'px');
      box?.style.setProperty('--cb-ar', (img.naturalWidth / img.naturalHeight).toFixed(4));
    }
  }

  // NTR's Backdrop shows the full-size picture, not SillyTavern's small thumbnail. It's loaded first and only swapped
  // in once it's there: SillyTavern replaces a chat avatar that fails to load with a "missing" icon. SillyTavern puts its
  // thumbnail back when it redraws a message in place (a swipe, a finished reply), so it's swapped in again then.
  function fullAvatar(img) {
    const mes = img.closest('#chat .mes');
    const src = img.getAttribute('src');
    // Already the full-size picture.
    if (!mes || !src || img.dataset.ntrFull === src) return;
    const p = mes.getAttribute('is_user') === 'true' ? 'us' : 'ai';
    const s = settings();
    if (!ntrAvatars(s, p) || s[p + 'Style'] === 'popout') return;
    // A face from Emotions (cast.js) is already full size.
    if (img.dataset.ntrFace === src) return;
    const full = fullResUrl(src);
    // Still loading, or it failed and isn't asked for again.
    if (full === src || img.dataset.ntrLoading === full) return;
    img.dataset.ntrLoading = full;
    const pre = new Image();
    pre.onload = () => {
      if (img.dataset.ntrLoading === full) delete img.dataset.ntrLoading;
      img.dataset.ntrFull = full;
      if (img.getAttribute('src') === src) img.src = full;
    };
    pre.src = full;
  }

  // After a restyle: every chat avatar picture on screen gets its shape and width once it has loaded, and the full-size
  // picture; and each side's Custom CSS follows the settings.
  function syncAvatarImgs() {
    syncAvatarCss();
    document.querySelectorAll('#chat .mes .avatar img').forEach((img) => { if (img.complete) setAvatarRatio(img); fullAvatar(img); });
  }
  // A chat avatar picture that just loaded.
  function avatarImgLoaded(img) {
    setAvatarRatio(img);
    fullAvatar(img);
  }

  // NTR Avatars on each side. A side that's switched off keeps SillyTavern's own avatar.
  function avatarsCss(s) {
    let css = '';
    for (const [prefix, flag] of [['ai', 'false'], ['us', 'true']]) {
      if (!ntrAvatars(s, prefix)) continue;
      const m = `.mes[is_user="${flag}"]`;
      // In Line keeps SillyTavern's own message layout.
      if (s[prefix + 'Style'] === 'inline') { css += getAvatarCss(prefix, flag, s); continue; }
      css += `
        ${m} { position: relative !important; padding: 0 !important; background-color: var(--SmartThemeChatMesBgc) !important; border-radius: var(--SmartThemeChatMesRounding, 15px) !important; overflow: clip !important; }
        ${m} .mes_block, ${m} .mes_text { background: transparent !important; border: none !important; box-shadow: none !important; }
        ${m} .mes_block { position: relative !important; z-index: 1 !important; width: 100% !important; min-height: 120px !important; padding: 15px !important; }

        ${getAvatarCss(prefix, flag, s)}
      `;
    }
    return css;
  }

  // Which ways a side's picture is bigger than its box, so Shift Left/Right and Up/Down have something to do. A Shape
  // cuts a picture that's taller or wider than it (the newest one in the chat, or a portrait while there's none). None
  // only gets cut on Backdrop with Fill or Original: a short message cuts the bottom off, and a narrow one the sides
  // (the box is at most 80% of the message wide). Zoom, and Shape Only
  // turned, make it bigger both ways.
  function shiftRoom(s, prefix) {
    const shape = SHAPES[s[`${prefix}Shape`]] ? s[`${prefix}Shape`] : null;
    if (rangeNum(s, prefix + 'Zoom') > 100 || turnCover(shapeOnly(s, prefix) && shape, rangeNum(s, prefix + 'Rotate')) > 1) return { x: true, y: true };
    if (shape) {
      const imgs = document.querySelectorAll(`#chat .mes[is_user="${prefix === 'us'}"] .avatar img`);
      const img = imgs[imgs.length - 1];
      const ar = img?.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 2 / 3;
      const box = 1 / SHAPES[shape];
      return { x: ar > box + 0.01, y: ar < box - 0.01 };
    }
    const style = ['inline', 'popout'].includes(s[`${prefix}Style`]) ? s[`${prefix}Style`] : 'backdrop';
    const cut = ntrAvatars(s, prefix) && style === 'backdrop' && s[`${prefix}Fit`] !== 'contain';
    return { x: cut, y: cut };
  }
  const anyFade = (s, prefix) => Object.values(FADE_PARTS).some(([key]) => rangeNum(s, prefix + key) > 0);

  // A side's picture box, as its height for a width of 1: the Shape's, or with None the picture's own (the pop-out's, or
  // the newest in the chat; a portrait while there's none).
  function boxAspect(s, prefix) {
    if (SHAPES[s[`${prefix}Shape`]]) return SHAPES[s[`${prefix}Shape`]];
    const imgs = s[`${prefix}Style`] === 'popout' ? [document.getElementById(`cb_pop_${prefix}`)]
      : document.querySelectorAll(`#chat .mes[is_user="${prefix === 'us'}"] .avatar img`);
    const img = imgs[imgs.length - 1];
    return img?.naturalWidth && img.naturalHeight ? img.naturalHeight / img.naturalWidth : 1.5;
  }

  // The Frame's preview tile: the side's picture in its Shape, with its Filter and Texture, the Frame over it and the turn.
  const FRAME_TILE = 96;
  function framePrevHtml(s, prefix) {
    const f = frameOf(s, prefix);
    const shape = SHAPES[s[`${prefix}Shape`]] ? s[`${prefix}Shape`] : null;
    const a = boxAspect(s, prefix);
    // The whole frame fits in the tile, or the picture alone without one.
    const w = Math.round((FRAME_TILE - 12) / ((f ? f.k : 1) * Math.max(1, a)));
    const h = Math.round(w * a);
    const cut = ellipse(shape) ? 'border-radius: 50%;' : OUTLINES[shape] ? `-webkit-mask: ${OUTLINES[shape]} center / 100% 100% no-repeat; mask: ${OUTLINES[shape]} center / 100% 100% no-repeat;`
      : shape ? `border-radius: ${Math.round(w * rangeNum(s, prefix + 'Corner') / 100)}px;` : '';
    const fl = FILTERS[s[`${prefix}Filter`]], tx = TEXTURES[s[`${prefix}Texture`]];
    const fStr = rangeNum(s, prefix + 'FilterStr') / 100, tStr = rangeNum(s, prefix + 'TextureStr') / 100;
    const left = (FRAME_TILE - w) / 2, top = (FRAME_TILE - h) / 2;
    const b = f && frameBox(f, `${w}px`, `${h}px`);
    const turn = rangeNum(s, prefix + 'Rotate');
    return `<span style="position: absolute; inset: 0; ${turn ? `transform: rotate(${turn}deg);` : ''}">
      <span style="position: absolute; left: ${left}px; top: ${top}px; width: ${w}px; height: ${h}px; overflow: hidden; ${escapeHTML(cut)}">${previewFace(sidePic(prefix),
        fl && fStr ? `filter: ${fl.fx(fStr, 0.5)};` : '', tx && tStr ? `${tx} opacity: ${tStr};` : '')}</span>
      ${b ? `<span style="position: absolute; left: calc(${left}px + ${b.left}); top: calc(${top}px + ${b.top}); ${escapeHTML(b.size + b.bg)}"></span>` : ''}
    </span>`;
  }

  // Fit to Hole: the Frame Size, Left/Right and Up/Down that make the picture fill the frame's see-through middle, a
  // little past its edge so no gap shows, as { FrameSize, FrameX, FrameY }. Nothing is saved, since the side may have
  // picked another frame while the picture loaded. The middle is the see-through part joined to the frame's center (or
  // the nearest see-through spot); one that reaches the edge isn't closed in, so it doesn't count. Null when there's no
  // middle, or the picture can't be read (a link to another site).
  async function fitFrame(s, prefix) {
    const src = frameSrc(s, prefix);
    if (!src) return null;
    const img = await loadImg(src).catch(() => null);
    if (!img?.naturalWidth || !img.naturalHeight) return null;
    const sc = Math.min(1, 256 / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * sc)), h = Math.max(1, Math.round(img.naturalHeight * sc));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0, w, h);
    let px;
    try { px = g.getImageData(0, 0, w, h).data; } catch (e) { return null; }
    const clear = (x, y) => px[(y * w + x) * 4 + 3] < 40;
    const cx = w >> 1, cy = h >> 1, reach = Math.round(Math.min(w, h) * 0.15);
    let start = null;
    for (let r = 0; r <= reach && !start; r++) {
      for (let dy = -r; dy <= r && !start; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const x = cx + dx, y = cy + dy;
          if (Math.max(Math.abs(dx), Math.abs(dy)) === r && x >= 0 && y >= 0 && x < w && y < h && clear(x, y)) { start = [x, y]; break; }
        }
      }
    }
    if (!start) return null;
    const seen = new Uint8Array(w * h);
    const todo = [start];
    seen[start[1] * w + start[0]] = 1;
    let x0 = w, x1 = 0, y0 = h, y1 = 0, area = 0;
    while (todo.length) {
      const [x, y] = todo.pop();
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) return null;
      area++;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        if (!seen[ny * w + nx] && clear(nx, ny)) { seen[ny * w + nx] = 1; todo.push([nx, ny]); }
      }
    }
    if (area < w * h * 0.01) return null;
    // The frame's picture is fitted in a box k picture widths wide (see frameBox), so it's drawn at k * m picture widths
    // per pixel. The hole's width and height, at 4% over, sets k; its middle, how far the frame moves.
    const a = boxAspect(s, prefix);
    const m = Math.min(1 / w, a / h);
    const k = 1 / (Math.max(x1 - x0 + 1, (y1 - y0 + 1) / a) * 1.04 * m);
    const dx = (x0 + x1 + 1) / 2 - w / 2, dy = (y0 + y1 + 1) / 2 - h / 2;
    const val = (key, v) => rangeNum({ [prefix + key]: Math.round(v) }, prefix + key);
    return { FrameSize: val('FrameSize', k * 100), FrameX: val('FrameX', -dx * k * m * 100), FrameY: val('FrameY', -dy * k * m * 100) };
  }

  // The Frame row's name: the frame and its folder, Your picture for one that isn't in the library, or No Frame.
  function frameNameHtml(s, prefix) {
    const now = frameNow(s, prefix);
    if (!now) return 'No Frame';
    if (now.other) return 'Your picture';
    return `${escapeHTML(now.frame.name)}<small>${escapeHTML(now.folder.name)}</small>`;
  }
  // The folder a side's Frame opens on: its frame's, or the first one shown.
  function frameHome(s, prefix) {
    const shown = frameFolders(s);
    const id = frameNow(s, prefix)?.folder?.id;
    return (shown.find((f) => f.id === id) || shown[0])?.id || '';
  }
  // The library under the Frame row: a pill for each folder with the More menu, then the open folder's frames as tiles,
  // None first. Your own folders get Upload Frame.
  function frameLibHtml(s, prefix, open) {
    const shown = frameFolders(s);
    const f = shown.find((x) => x.id === open) || shown[0];
    if (!f) return '';
    const now = frameNow(s, prefix);
    const cur = !now ? '' : now.frame?.id || null;
    const opts = [['', 'None'], ...f.frames.map((fr) => [fr.id, fr.name, `<img src="${escapeHTML(fr.src)}" alt="" decoding="async">`])];
    return `<div style="display: flex; align-items: flex-start; gap: 6px;">
        <div style="flex: 1; min-width: 0;">${pills(`${prefix}frf`, shown.map((x) => [x.id, escapeHTML(x.name)]), f.id)}</div>
        <span class="ntr_menu"><button type="button" class="menu_button" id="m_${prefix}_frmore" style="margin: 0;" title="More" aria-label="More for ${escapeHTML(f.name)}" aria-haspopup="menu" aria-expanded="false"><i class="fa-solid fa-fw fa-ellipsis"></i></button></span>
      </div>
      ${tiles(`${prefix}frame`, 'Frame', opts, cur).replace('class="ntr_tiles', 'class="ntr_tiles ntr_frtiles')}
      ${f.own ? `<button type="button" id="m_${prefix}_frup" class="menu_button" style="margin: 0; width: max-content;"><i class="fa-solid fa-upload"></i> Upload Frame</button>
        ${f.frames.length ? '' : '<div class="cb_hint" style="margin: 0;">Use a picture with a see-through middle, like a PNG.</div>'}` : ''}`;
  }

  // A column's choices that show or hide other rows: Corners for Rectangle and Square, Keep Picture Upright for a
  // Shape, Use Picture's Own Size for None, and Short Messages for None at a set size (only Backdrop cuts a picture to
  // a short message). Picture Size waits while the picture keeps its own size; Pop Out always uses Picture Size.
  function colState(s, prefix) {
    const shaped = !!SHAPES[s[`${prefix}Shape`]];
    const own = !shaped && s[`${prefix}Fit`] === 'original';
    return { shaped, own, cornersOn: ['rectangle', 'square'].includes(s[`${prefix}Shape`]), scaleOff: s[`${prefix}Style`] !== 'popout' && own };
  }

  function getColHtml(prefix, title, s) {
    const style = ['inline', 'popout'].includes(s[`${prefix}Style`]) ? s[`${prefix}Style`] : 'backdrop';
    const { shaped, own, cornersOn, scaleOff } = colState(s, prefix);
    const show = (on) => (on ? '' : ' style="display: none;"');

    const slider = (id, key, label) => `
      <div class="cb_row"><label>${label}</label><span><span id="m_${prefix}_${id}val" class="ntr_slval">${rangeNum(s, prefix + key)}</span>${numRange(prefix + key)[3]}</span></div>
      <input type="range" id="m_${prefix}_${id}" ${rangeAttrs(prefix + key)} value="${rangeNum(s, prefix + key)}">`;
    // A group shows for the styles it lists (data-only, space-separated).
    const grp = (only, inner) => `<div class="cb_grp" data-only="${only}" style="display: ${only.split(' ').includes(style) ? 'flex' : 'none'};">${inner}</div>`;
    // The fade grid starts on the first fade that's on, or Bottom.
    const fadeCur = Object.keys(FADE_PARTS).find((v) => rangeNum(s, prefix + FADE_PARTS[v][0]) > 0) || 'bc';

    const room = shiftRoom(s, prefix);

    return `
      <div class="ntr_colwrap">
      <div class="ntr_glab ntr_avlab"><input type="checkbox" id="m_${prefix}_on" ${s[`${prefix}Enabled`] !== false ? 'checked' : ''} title="Turn ${title} Avatar on or off" aria-label="Turn ${title} Avatar on or off"><label for="m_${prefix}_on">${title} Avatar</label></div>
      <div id="m_${prefix}_col" class="cb_col ntr_card">
        <div id="m_${prefix}_body" class="cb_col_body${s[`${prefix}Enabled`] !== false ? '' : ' cb_dim'}">
        <div><strong>Style:</strong>${pills(`${prefix}style`, [['inline', 'In Line'], ['backdrop', 'Backdrop'], ['popout', 'Pop Out']], style)}</div>
        <div><strong>Position:</strong>${posGrid(`${prefix}pos`, s[`${prefix}Side`])}</div>

        ${grp('popout', `<button type="button" id="m_${prefix}_place" class="menu_button" style="margin: 0; width: max-content;"><i class="fa-solid fa-up-down-left-right"></i> Edit Placement</button>
          <div class="cb_hint" style="margin: 0;">Position counts from the chat panel, not the screen.</div>
          <div id="m_${prefix}_pstat" class="cb_hint" style="margin: 0;">${escapeHTML(popMsg[prefix] || '')}</div>`
          + slider('ox', 'PopX', 'Move Left/Right:')
          + slider('oy', 'PopY', 'Move Up/Down:'))}

        <div class="cb_sub">Shape</div>
        ${shapeTiles(prefix, s[`${prefix}Shape`])}
        <div id="m_${prefix}_crwrap"${show(cornersOn)}>${slider('cr', 'Corner', 'Corners:')}</div>
        ${slider('rt', 'Rotate', 'Rotation:')}
        <label id="m_${prefix}_rmwrap" class="checkbox_label${rangeNum(s, prefix + 'Rotate') ? '' : ' cb_dim'}"${show(shaped)}><input type="checkbox" id="m_${prefix}_upright" ${s[`${prefix}RotateMode`] === 'both' ? '' : 'checked'}><span>Keep Picture Upright</span></label>

        <div class="cb_sub">Size</div>
        <div id="m_${prefix}_scwrap" class="${scaleOff ? 'cb_dim' : ''}">${slider('sc', 'Scale', 'Picture Size:')}</div>
        ${grp('inline backdrop', `<label id="m_${prefix}_ownwrap" class="checkbox_label"${show(!shaped)}><input type="checkbox" id="m_${prefix}_own" ${s[`${prefix}Fit`] === 'original' ? 'checked' : ''}><span>Use Picture's Own Size</span></label>`)}
        ${grp('backdrop popout', slider('pad', 'Pad', 'Text Padding:'))}

        <div class="cb_sub">Crop</div>
        ${grp('backdrop', `<div id="m_${prefix}_fitwrap"${show(!shaped && !own)}><strong>Short Messages:</strong>${pills(`${prefix}fit`, [['contain', 'Shrink Picture'], ['cover', 'Crop Picture']], s[`${prefix}Fit`] === 'cover' ? 'cover' : 'contain')}</div>`)}
        ${slider('zm', 'Zoom', 'Zoom:')}
        <div id="m_${prefix}_fowrap" class="${room.y ? '' : 'cb_dim'}">${slider('fo', 'Focus', 'Shift Up/Down:')}</div>
        <div id="m_${prefix}_sxwrap" class="${room.x ? '' : 'cb_dim'}">${slider('sx', 'ShiftX', 'Shift Left/Right:')}</div>
        <div id="m_${prefix}_shint" class="cb_hint" style="margin: 0;${room.x && room.y ? ' display: none;' : ''}">Zoom in to move a picture that already fits.</div>

        ${grp('inline backdrop', `<div class="cb_sub">Fades</div>`
          + fadeGrid(prefix, s, fadeCur)
          + `<div class="cb_row"><label id="m_${prefix}_fadelab">${FADE_PARTS[fadeCur][1]} Fade Length:</label><span><span id="m_${prefix}_fadeval" class="ntr_slval">${rangeNum(s, prefix + FADE_PARTS[fadeCur][0])}</span>%</span></div>
          <input type="range" id="m_${prefix}_fade" ${rangeAttrs(prefix + 'FadeTop')} value="${rangeNum(s, prefix + FADE_PARTS[fadeCur][0])}">
          <div id="m_${prefix}_fswrap" class="${anyFade(s, prefix) ? '' : 'cb_dim'}">${slider('fs', 'FadeStr', 'Fade Strength:')}</div>
          <button type="button" id="m_${prefix}_fadeclr" class="menu_button" style="margin: 0; width: max-content;"><i class="fa-solid fa-eraser"></i> Clear Fades</button>`
          + '<div class="cb_hint" style="margin: 0;">Pick a side or corner, then set its length. Lit cells have a fade on.</div>')}

        <div class="cb_sub">Filter</div>
        ${filterTiles(prefix, FILTERS[s[`${prefix}Filter`]] ? s[`${prefix}Filter`] : 'none')}
        <div id="m_${prefix}_fxwrap" class="${FILTERS[s[`${prefix}Filter`]] ? '' : 'cb_dim'}">${slider('fx', 'FilterStr', 'Filter Strength:')}</div>

        <div class="cb_sub">Texture</div>
        ${textureTiles(prefix, TEXTURES[s[`${prefix}Texture`]] ? s[`${prefix}Texture`] : 'none')}
        <div id="m_${prefix}_txwrap" class="${TEXTURES[s[`${prefix}Texture`]] ? '' : 'cb_dim'}">${slider('tx', 'TextureStr', 'Texture Strength:')}</div>

        ${grp('inline popout', `<div class="cb_sub">Frame</div>
          <div class="cb_cur_slot" style="margin: 0;">
            <div class="cb_cur_row">
              <div id="m_${prefix}_frprev" style="position: relative; flex: none; width: ${FRAME_TILE}px; height: ${FRAME_TILE}px; border-radius: 8px; background: var(--ntr-well-deep);">${framePrevHtml(s, prefix)}</div>
              <span class="cb_cur_name" id="m_${prefix}_frname">${frameNameHtml(s, prefix)}</span>
              <button type="button" class="menu_button danger_button" id="m_${prefix}_frdel" title="Delete Frame" aria-label="Delete Frame"${frameNow(s, prefix)?.folder?.own ? '' : ' style="display: none;"'}><i class="fa-solid fa-trash-can"></i></button>
            </div>
          </div>
          <div id="m_${prefix}_frlib" style="display: flex; flex-direction: column; gap: 6px;">${frameLibHtml(s, prefix, frameHome(s, prefix))}</div>
          <input type="file" id="m_${prefix}_frfile" accept="image/png,image/webp,image/gif" hidden>
          <div id="m_${prefix}_frrows" class="${frameOf(s, prefix) ? '' : 'cb_dim'}" style="display: flex; flex-direction: column; gap: 8px;">
            <button type="button" id="m_${prefix}_frfit" class="menu_button" style="margin: 0; width: max-content;"><i class="fa-solid fa-crosshairs"></i> Fit to Hole</button>
            <div>${slider('frs', 'FrameSize', 'Frame Size:')}</div>
            <div>${slider('frx', 'FrameX', 'Frame Left/Right:')}</div>
            <div>${slider('fry', 'FrameY', 'Frame Up/Down:')}</div>
          </div>`)}

        ${subHead(`av_css_${prefix}`, `Advanced: Custom CSS<span id="m_${prefix}_csstag" class="ntr_scope"${show(s[`${prefix}CssOn`])}>On</span>`)}
        <div class="cb_collapse_content">
          ${ovRow(s, `${prefix}CssOn`, `${title} Avatar CSS`, customCssBox(s, `${prefix}Css`, 'border: 2px solid white !important;&#10;box-shadow: inset 0 0 12px black;')
            + `<div class="cb_hint">CSS properties for this avatar, without a selector. ${CSS_NOTE}</div>`)}
        </div>

        <button type="button" id="m_${prefix}_reset" class="menu_button" style="margin-top: 6px; width: max-content;"><i class="fa-solid fa-rotate-left"></i> Reset ${title} Avatar</button>
        </div>
      </div>
      </div>
    `;
  }

  // The Avatar Management page: a note while ST hides chat avatars, a column for each side, and Emotions (cast.js).
  function avatarsSectionHtml(s) {
    return pageHtml('pfp', `
            <div id="m_av_sthidden" class="ntr_offnote" hidden><i class="fa-solid fa-eye-slash"></i> ST's Hide Chat Avatars is on, so In Line and Backdrop avatars stay hidden. Pop Out still shows.</div>
            <div class="ntr_cols">
              ${getColHtml('ai', 'AI', s)}
              ${getColHtml('us', 'User', s)}
            </div>
            ${castPartHtml()}
        `, { sw: ['m_a_enable', s.avatarEnabled] });
  }

  // The Avatar Management page's switch and both columns.
  function bindAvatars(overlay, s) {
    overlay.querySelector('#m_a_enable').onchange = function() {
      s.avatarEnabled = this.checked; save(); updateAvatarStyle();
      window.NTR.cast?.refresh();
    };
    // SillyTavern's own Hide Chat Avatars hides In Line and Backdrop. It may change while the menu is open.
    const syncStNote = () => { overlay.querySelector('#m_av_sthidden').hidden = !document.body.classList.contains('hideChatAvatars'); };
    overlay.querySelector('.ntr_navi[data-page="pfp"]')?.addEventListener('click', syncStNote);
    syncStNote();

    const bindCol = (prefix) => {
      const col = overlay.querySelector(`#m_${prefix}_col`);
      const label = prefix === 'ai' ? 'AI' : 'User';

      // What colState shows and hides follows the Shape, Style and Own Size. Keep Picture Upright waits for a turn, the
      // Shift sliders for a picture bigger than its box, and each Strength for a pick or a fade that's on.
      const syncScale = () => {
        const { shaped, own, cornersOn, scaleOff } = colState(s, prefix);
        const room = shiftRoom(s, prefix);
        const show = (id, on) => { col.querySelector(`#m_${prefix}_${id}`).style.display = on ? '' : 'none'; };
        col.querySelector(`#m_${prefix}_fowrap`).classList.toggle('cb_dim', !room.y);
        col.querySelector(`#m_${prefix}_sxwrap`).classList.toggle('cb_dim', !room.x);
        show('shint', !(room.x && room.y));
        show('rmwrap', shaped);
        col.querySelector(`#m_${prefix}_rmwrap`).classList.toggle('cb_dim', !rangeNum(s, prefix + 'Rotate'));
        col.querySelector(`#m_${prefix}_fswrap`).classList.toggle('cb_dim', !anyFade(s, prefix));
        col.querySelector(`#m_${prefix}_fxwrap`).classList.toggle('cb_dim', !FILTERS[s[`${prefix}Filter`]]);
        col.querySelector(`#m_${prefix}_txwrap`).classList.toggle('cb_dim', !TEXTURES[s[`${prefix}Texture`]]);
        show('crwrap', cornersOn);
        show('ownwrap', !shaped);
        show('fitwrap', !shaped && !own);
        col.querySelector(`#m_${prefix}_scwrap`).classList.toggle('cb_dim', scaleOff);
        drawFrame();
      };
      // The Frame: its preview, name, Delete and the rows, which wait for a frame.
      const drawFrame = () => {
        const on = !!frameOf(s, prefix);
        col.querySelector(`#m_${prefix}_frprev`).innerHTML = framePrevHtml(s, prefix);
        col.querySelector(`#m_${prefix}_frname`).innerHTML = frameNameHtml(s, prefix);
        col.querySelector(`#m_${prefix}_frdel`).style.display = frameNow(s, prefix)?.folder?.own ? '' : 'none';
        col.querySelector(`#m_${prefix}_frrows`).classList.toggle('cb_dim', !on);
      };
      const frameSliders = () => {
        for (const [id, key] of [['frs', 'FrameSize'], ['frx', 'FrameX'], ['fry', 'FrameY']]) {
          col.querySelector(`#m_${prefix}_${id}`).value = rangeNum(s, prefix + key);
          col.querySelector(`#m_${prefix}_${id}val`).textContent = rangeNum(s, prefix + key);
        }
      };
      // The fit is remembered for this side and frame, so picking the frame again puts it back.
      const keepFit = () => {
        const k = fitKey(s, prefix);
        if (k) s.frameFits[prefix][k] = ['FrameSize', 'FrameX', 'FrameY'].map((n) => rangeNum(s, prefix + n));
      };
      // The fit lands only if this side still has the frame it was worked out for.
      const fit = async () => {
        const k = fitKey(s, prefix);
        const got = await fitFrame(s, prefix);
        if (fitKey(s, prefix) !== k) return;
        if (!got) {
          toastr.warning('Couldn\'t find the frame\'s middle. Set it with the sliders.', 'Frame');
          return;
        }
        Object.assign(s, { [prefix + 'FrameSize']: got.FrameSize, [prefix + 'FrameX']: got.FrameX, [prefix + 'FrameY']: got.FrameY });
        keepFit();
        save();
        frameSliders();
        drawFrame();
        updateAvatarStyle();
      };
      // Picks a frame by its tile value: a built-in frame, one of yours, or '' for none. A frame this side hasn't used
      // before gets Fit to Hole.
      const pickFrame = async (v) => {
        const own = s.frameLib.folders.flatMap((f) => f.frames).find((fr) => fr.id === v);
        s[prefix + 'Frame'] = FRAME_IDS.includes(v) ? v : '';
        s[prefix + 'FrameImg'] = own ? own.img : '';
        const k = fitKey(s, prefix), was = k && s.frameFits[prefix][k];
        if (was) ['FrameSize', 'FrameX', 'FrameY'].forEach((n, i) => { s[prefix + n] = was[i]; });
        save();
        frameSliders();
        drawFrame();
        updateAvatarStyle();
        if (k && !was) await fit();
      };
      let open = frameHome(s, prefix);
      const lib = col.querySelector(`#m_${prefix}_frlib`);
      const bindLib = () => {
        onPills(lib, `${prefix}frf`, (v) => { open = v; drawLib(); });
        onPills(lib, `${prefix}frame`, pickFrame);
        const up = lib.querySelector(`#m_${prefix}_frup`);
        if (up) up.onclick = () => frFile.click();
        const more = lib.querySelector(`#m_${prefix}_frmore`);
        more.onclick = () => frameMenu(more);
      };
      const drawLib = () => {
        if (!frameFolders(s).some((f) => f.id === open)) open = frameHome(s, prefix);
        lib.innerHTML = frameLibHtml(s, prefix, open);
        bindLib();
      };
      redraws.push(() => { drawLib(); drawFrame(); frameSliders(); });
      // After a change to the library, both columns show it.
      const libChanged = () => { save(); updateAvatarStyle(); redraws.forEach((fn) => fn()); };
      // Your folder names are kept different from each other and from the built-in ones.
      const nameCheck = (self) => (v) => {
        if (!v) return { error: 'Type a name.' };
        if ([...FRAME_SERIES, ...s.frameLib.folders].some((x) => x !== self && x.name.toLowerCase() === v.toLowerCase())) return { error: 'A folder with that name already exists.' };
        return { value: v.slice(0, 60) };
      };
      // Your frames' pictures leave the library, and any side using one goes back to no frame. Each file is deleted
      // unless something else, like a saved theme, still uses it.
      const dropFrames = (frames) => {
        const imgs = frames.map((fr) => fr.img);
        for (const p of ['ai', 'us']) {
          if (imgs.includes(s[p + 'FrameImg'])) s[p + 'FrameImg'] = '';
          for (const img of imgs) delete s.frameFits[p][img];
        }
        return imgs;
      };
      // The library never ends up with no folder to show.
      const keepAFolder = () => {
        if (!frameFolders(s).length) s.frameLib.folders.push({ id: newId('frf'), name: 'My Frames', frames: [] });
      };
      const frameMenu = (more) => {
        const f = frameFolders(s).find((x) => x.id === open);
        if (!f) return;
        const pop = popMenu(more, `
          <button type="button" data-act="new"><i class="fa-solid fa-plus fa-fw"></i>New Folder…</button>
          ${f.own ? '<button type="button" data-act="ren"><i class="fa-solid fa-pen fa-fw"></i>Rename Folder…</button>'
            : '<button type="button" data-act="hide"><i class="fa-solid fa-eye-slash fa-fw"></i>Hide Folder</button>'}
          ${s.frameHidden.length ? '<button type="button" data-act="show"><i class="fa-solid fa-eye fa-fw"></i>Show Hidden Folders</button>' : ''}
          ${f.own ? '<button type="button" data-act="del" class="ntr_danger"><i class="fa-solid fa-trash-can fa-fw"></i>Delete Folder…</button>' : ''}`);
        if (!pop) return;
        pop.onclick = async (e) => {
          const b = e.target.closest('button[data-act]');
          if (!b) return;
          closePops(col);
          const head = lib.firstElementChild;
          const act = b.dataset.act;
          if (act === 'new') {
            const name = await askText(head, { label: 'Folder Name', ok: 'Add', check: nameCheck(null) });
            if (!name) return;
            const nf = { id: newId('frf'), name, frames: [] };
            s.frameLib.folders.push(nf);
            open = nf.id;
          } else if (act === 'ren') {
            const name = await askText(head, { label: 'Folder Name', value: f.name, ok: 'Rename', check: nameCheck(f.own) });
            if (!name) return;
            f.own.name = name;
          } else if (act === 'hide') {
            s.frameHidden.push(f.id);
            keepAFolder();
          } else if (act === 'show') {
            s.frameHidden = [];
          } else if (act === 'del') {
            const n = f.own.frames.length;
            const q = !n ? `Delete the folder "${f.name}"?`
              : `Delete the folder "${f.name}" and its ${n === 1 ? '1 frame' : `${n} frames`}? Any avatar using one goes back to no frame.`;
            if (!(await askYes(head, q, 'Delete', { danger: true }))) return;
            const imgs = dropFrames(f.own.frames);
            s.frameLib.folders.splice(s.frameLib.folders.indexOf(f.own), 1);
            keepAFolder();
            libChanged();
            imgs.forEach(deleteFileIfUnused);
            return;
          }
          libChanged();
        };
      };
      col.addEventListener('click', (e) => { if (!e.target.closest('.ntr_menu')) closePops(col); });
      col.querySelector(`#m_${prefix}_frdel`).onclick = async function() {
        const now = frameNow(s, prefix);
        if (!now?.folder?.own) return;
        if (!(await askYes(this, `Delete the frame "${now.frame.name}"? It's removed from your library, and any avatar using it goes back to no frame.`, 'Delete', { danger: true }))) return;
        const own = now.folder.own;
        const imgs = dropFrames(own.frames.filter((fr) => fr.id === now.frame.id));
        own.frames = own.frames.filter((fr) => fr.id !== now.frame.id);
        libChanged();
        imgs.forEach(deleteFileIfUnused);
      };
      const frFile = col.querySelector(`#m_${prefix}_frfile`);
      bindLib();
      col.querySelector(`#m_${prefix}_frfit`).onclick = fit;
      // An upload goes in the open folder, named from its file, and this side uses it.
      frFile.onchange = async () => {
        const file = frFile.files[0];
        frFile.value = '';
        const own = s.frameLib.folders.find((f) => f.id === open);
        if (!file || !own) return;
        try {
          const img = await uploadImage(file, 'avframe', { max: 1024 });
          // The folder may have been deleted from the other column while the file uploaded.
          if (!s.frameLib.folders.includes(own)) { deleteFileIfUnused(img); return; }
          const fr = { id: newId('fr'), name: file.name.replace(/\.[^.]*$/, '').trim().slice(0, 60) || 'Frame', img };
          own.frames.push(fr);
          libChanged();
          await pickFrame(fr.id);
          drawLib();
        } catch (e) {
          console.error('[NTR frame upload]', e);
          toastr.error(e.message || 'Upload failed', 'Frame');
        }
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
      // Own Size is Fit's Original; unticked, Short Messages starts at Shrink Picture.
      col.querySelector(`#m_${prefix}_own`).onchange = function() {
        s[`${prefix}Fit`] = this.checked ? 'original' : 'contain';
        if (!this.checked) col.querySelector(`input[name="cbr_${prefix}fit"][value="contain"]`).checked = true;
        save(); syncScale(); updateAvatarStyle();
      };
      col.querySelector(`#m_${prefix}_upright`).onchange = function() {
        s[`${prefix}RotateMode`] = this.checked ? 'shape' : 'both'; save(); updateAvatarStyle();
      };
      // The Custom CSS fold says On while that side's CSS is ticked.
      col.addEventListener('change', (e) => {
        if (e.target.matches(`.m_o_on[data-key="${prefix}CssOn"]`)) col.querySelector(`#m_${prefix}_csstag`).style.display = e.target.checked ? '' : 'none';
      });
      onPills(col, `${prefix}filter`, (v) => { s[`${prefix}Filter`] = v; save(); syncScale(); updateAvatarStyle(); });
      onPills(col, `${prefix}texture`, (v) => { s[`${prefix}Texture`] = v; save(); syncScale(); updateAvatarStyle(); });
      col.querySelectorAll('.m_css').forEach((box) => {
        box.oninput = () => { s[box.dataset.key] = box.value.slice(0, 2000); syncAvatarCss(); };
        box.onchange = save;
      });
      // One slider for the fade picked on the fade grid.
      const fadeSl = col.querySelector(`#m_${prefix}_fade`);
      let fadeAt = col.querySelector(`input[name="cbr_${prefix}fade"]:checked`)?.value || 'bc';
      onPills(col, `${prefix}fade`, (v) => {
        fadeAt = v;
        const val = rangeNum(s, prefix + FADE_PARTS[v][0]);
        fadeSl.value = val;
        col.querySelector(`#m_${prefix}_fadeval`).textContent = val;
        col.querySelector(`#m_${prefix}_fadelab`).textContent = `${FADE_PARTS[v][1]} Fade Length:`;
      });
      fadeSl.oninput = function() {
        s[prefix + FADE_PARTS[fadeAt][0]] = Number(this.value);
        col.querySelector(`#m_${prefix}_fadeval`).textContent = this.value;
        col.querySelector(`input[name="cbr_${prefix}fade"][value="${fadeAt}"]`).closest('label').classList.toggle('cb_fon', Number(this.value) > 0);
        syncScale();
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
        syncScale();
        updateAvatarStyle();
      };

      overlay.querySelector(`#m_${prefix}_reset`).onclick = async function() {
        if (!(await askYes(this, `Reset all ${label} avatar settings to defaults, Style, Frame and Custom CSS included? Your uploaded frames stay.`, 'Reset'))) return;
        for (const k of Object.keys(DEFAULTS)) {
          if (k.startsWith(prefix) && k !== `${prefix}Enabled`) s[k] = structuredClone(DEFAULTS[k]);
        }
        s.frameFits[prefix] = {};
        save();
        updateAvatarStyle();
        openCombinedModal();
      };
      
      const sliders = [
        { id: 'sc', key: 'Scale' }, { id: 'cr', key: 'Corner' }, { id: 'fo', key: 'Focus' }, { id: 'sx', key: 'ShiftX' }, { id: 'zm', key: 'Zoom' },
        { id: 'rt', key: 'Rotate' }, { id: 'pad', key: 'Pad' }, { id: 'ox', key: 'PopX' }, { id: 'oy', key: 'PopY' },
        { id: 'fs', key: 'FadeStr' }, { id: 'fx', key: 'FilterStr' }, { id: 'tx', key: 'TextureStr' },
        { id: 'frs', key: 'FrameSize' }, { id: 'frx', key: 'FrameX' }, { id: 'fry', key: 'FrameY' }
      ];
      
      sliders.forEach(({ id, key }) => {
        const el = overlay.querySelector(`#m_${prefix}_${id}`);
        // Dragging Rotation sticks at 0, so it's easy to set straight again. Arrow keys and typed values go in as they are.
        if (key === 'Rotate') {
          const end = () => { delete el.dataset.drag; };
          el.onpointerdown = () => {
            el.dataset.drag = '1';
            window.addEventListener('pointerup', end, { once: true });
            window.addEventListener('pointercancel', end, { once: true });
          };
        }
        el.oninput = function() {
          if (key === 'Rotate' && this.dataset.drag && Math.abs(Number(this.value)) <= 3) this.value = 0;
          s[`${prefix}${key}`] = Number(this.value);
          overlay.querySelector(`#m_${prefix}_${id}val`).textContent = this.value;
          if (key === 'Zoom' || key === 'Rotate') syncScale();
          else drawFrame();
          updateAvatarStyle();
        };
        el.onchange = key.startsWith('Frame') ? () => { keepFit(); save(); } : save;
      });
    };
    
    // Each column's Frame library redraw, so a change in one shows in both.
    const redraws = [];
    bindCol('ai');
    bindCol('us');
  }

  // The avatar fade grid: the Position grid's cells, each a fade, with the middle left empty. Lit cells have a fade on.
  function fadeGrid(prefix, s, cur) {
    return `<div class="cb_posgrid cb_fadegrid">${POS_GRID.map(([v]) => {
      if (!FADE_PARTS[v]) return '<span></span>';
      const [key, name] = FADE_PARTS[v];
      return `<label title="${name} Fade" class="${rangeNum(s, prefix + key) > 0 ? 'cb_fon' : ''}"><input type="radio" name="cbr_${prefix}fade" value="${v}" aria-label="${name} Fade" ${v === cur ? 'checked' : ''}></label>`;
    }).join('')}</div>`;
  }

  // What index.js calls.
  window.NTR.avatars = {
    version: AVATARS_VERSION,
    sectionHtml: avatarsSectionHtml,
    bind: bindAvatars,
    css: avatarsCss,
    sync: syncAvatarImgs,
    imgLoaded: avatarImgLoaded,
  };
})();
