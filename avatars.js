// Nitwit Tavern Redesign: Avatar Management module: NTR Avatars (In Line, Backdrop and Pop Out), avatar shapes,
// fades and crop, and the page that sets them. Loaded by index.js before NTR starts, so its styles are there from the
// first draw. If this file breaks, the rest of the extension keeps working, with SillyTavern's own avatars.
// The settings, their limits and the lists they're checked against stay in index.js, and so do the pop-out pictures'
// layer and loading and Edit Placement; this file writes their size and position CSS. It builds from what index.js
// shares in window.NTR.api.look.
(() => {
  const AVATARS_VERSION = '2.72.0';
  const A = window.NTR && window.NTR.api;
  if (!A || !A.look) { console.error('[NTR] avatars.js loaded without the core (index.js).'); return; }
  const { DEFAULTS, askYes, card, escapeHTML, fullResUrl, isOn, numRange, onPills, pageHtml, pills, posGrid, rangeAttrs, rangeNum, save, settings,
    startPlacement, tiles } = A;
  const { CSS_NOTE, FILTER_OPTS, TEXTURE_OPTS, POS_GRID, SHAPE_OPTS, castPartHtml, cssTag, customCssBox, ntrAvatars, ovPick, ovRow, popMsg, restyle: updateAvatarStyle, svgMask } = A.look;
  const openCombinedModal = () => A.openMenu();

  // The avatar fades by their place on the fade grid (the Position grid's cells): [setting, name]. The middle has none.
  const FADE_PARTS = {
    tl: ['FadeTL', 'Top Left'], tc: ['FadeTop', 'Top'], tr: ['FadeTR', 'Top Right'], cl: ['FadeLeft', 'Left'],
    cr: ['FadeRight', 'Right'], bl: ['FadeBL', 'Bottom Left'], bc: ['FadeBot', 'Bottom'], br: ['FadeBR', 'Bottom Right'],
  };

  // Avatar shapes, like SillyTavern's own: their height for a width of 1. Round is a circle; the others take Corners.
  const SHAPES = { round: 1, rectangle: 1.5, square: 1, heart: 1, star: 1 };

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

  // The Shape tiles' pictures: Circle, Rectangle and Square drawn as boxes, Heart and Star cut by their outlines.
  const SHAPE_FACES = {
    round: 'width: 22px; height: 22px; border-radius: 50%;', rectangle: 'width: 15px; height: 22px; border-radius: 2px;', square: 'width: 20px; height: 20px; border-radius: 2px;',
    heart: `width: 24px; height: 24px; -webkit-mask: ${OUTLINES.heart} center / 100% 100% no-repeat; mask: ${OUTLINES.heart} center / 100% 100% no-repeat;`,
    star: `width: 24px; height: 24px; -webkit-mask: ${OUTLINES.star} center / 100% 100% no-repeat; mask: ${OUTLINES.star} center / 100% 100% no-repeat;`,
  };
  const shapeTiles = (prefix, cur) => tiles(`${prefix}shape`, 'Shape', SHAPE_OPTS.map(([v, l]) => [v, l,
    SHAPE_FACES[v] ? `<span style="display: block; background: currentColor; ${escapeHTML(SHAPE_FACES[v])}"></span>` : '']), cur);

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
      const c = isOn() && s.avatarEnabled && ntrAvatars(s, p) && s[p + 'CssOn'] ? String(s[p + 'Css'] || '').slice(0, 2000).trim() : '';
      cssTag(`ntr_av_css_${p}`, c ? `${s[p + 'Style'] === 'popout' ? `#cb_popf_${p}` : `#chat .mes[is_user="${flag}"] .avatar`} { ${c} }` : '');
    }
  }

  // Shape Only turns the shape and turns the picture back inside it, so the picture is made bigger by this much to still
  // fill the turned shape's corners. A circle needs none.
  function turnCover(shape, turn) {
    if (!shape || shape === 'round' || !turn) return 1;
    const a = turn * Math.PI / 180, c = Math.abs(Math.cos(a)), sn = Math.abs(Math.sin(a)), h = SHAPES[shape];
    return Math.max(c + h * sn, sn / h + c);
  }
  // Whether a side's Rotation turns the shape alone (Shape Only), and not the picture with it.
  const shapeOnly = (s, prefix) => !!SHAPES[s[`${prefix}Shape`]] && s[`${prefix}RotateMode`] !== 'both' && rangeNum(s, prefix + 'Rotate') !== 0;

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
    if (isOn() && s.avatarEnabled) {
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

  function getColHtml(prefix, title, s) {
    const style = ['inline', 'popout'].includes(s[`${prefix}Style`]) ? s[`${prefix}Style`] : 'backdrop';
    const shaped = !!SHAPES[s[`${prefix}Shape`]];
    const cornersOn = ['rectangle', 'square'].includes(s[`${prefix}Shape`]);
    const scaleOff = style !== 'popout' && !shaped && s[`${prefix}Fit`] === 'original';

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

        ${grp('popout', `<div class="cb_sub">Placement</div>
          <button type="button" id="m_${prefix}_place" class="menu_button" style="margin: 0; width: max-content;"><i class="fa-solid fa-up-down-left-right"></i> Edit Placement</button>
          <div class="cb_hint" style="margin: 0;">Hides the menu while you drag the picture. Position counts from the chat panel, not the screen.</div>
          <div id="m_${prefix}_pstat" class="cb_hint" style="margin: 0;">${escapeHTML(popMsg[prefix] || '')}</div>`
          + slider('ox', 'PopX', 'Move Horizontal:')
          + slider('oy', 'PopY', 'Move Vertical:'))}

        <div id="m_${prefix}_scwrap" class="${scaleOff ? 'cb_dim' : ''}">${slider('sc', 'Scale', 'Picture Size:')}</div>
        <div id="m_${prefix}_orighint" class="cb_hint" style="margin: 0;${scaleOff ? '' : ' display: none;'}">Original uses the picture's own size.</div>
        <div id="m_${prefix}_padwrap" class="${style === 'inline' ? 'cb_dim' : ''}">${slider('pad', 'Pad', 'Text Padding:')}</div>

        <div class="cb_sub">Shape</div>
        ${shapeTiles(prefix, s[`${prefix}Shape`])}
        <div id="m_${prefix}_crwrap" class="${cornersOn ? '' : 'cb_dim'}">${slider('cr', 'Corner', 'Corners:')}</div>
        <div id="m_${prefix}_croff" class="cb_hint" style="margin: 0;${cornersOn ? ' display: none;' : ''}">Only for Rectangle and Square.</div>
        ${slider('rt', 'Rotate', 'Rotation:')}
        <div id="m_${prefix}_rmwrap" class="${shaped ? '' : 'cb_dim'}"><strong>Rotate:</strong>${pills(`${prefix}rmode`, [['shape', 'Shape Only'], ['both', 'Shape and Picture']], s[`${prefix}RotateMode`] === 'both' ? 'both' : 'shape')}</div>
        <div id="m_${prefix}_rmoff" class="cb_hint" style="margin: 0;${shaped ? ' display: none;' : ''}">Shape None turns the whole picture.</div>

        <div class="cb_sub">Picture</div>
        ${grp('inline backdrop', `<div id="m_${prefix}_fitwrap" class="${shaped ? 'cb_dim' : ''}"><strong>Picture Fit:</strong>${pills(`${prefix}fit`, [['contain', 'Fit'], ['cover', 'Fill'], ['original', 'Original']], s[`${prefix}Fit`])}</div>
          <div id="m_${prefix}_fithint" class="cb_hint" style="margin: 0;${shaped ? '' : ' display: none;'}">Only for Shape None. A Shape is always filled.</div>`)}
        ${grp('backdrop', `<div id="m_${prefix}_fitnone" class="cb_hint" style="margin: 0;${shaped ? ' display: none;' : ''}">In a short message, Fit shrinks the picture to show all of it; Fill and Original get cut off.</div>`)}
        ${slider('zm', 'Zoom', 'Zoom:')}
        <div id="m_${prefix}_fowrap" class="${room.y ? '' : 'cb_dim'}">${slider('fo', 'Focus', 'Shift Up/Down:')}</div>
        <div id="m_${prefix}_sxwrap" class="${room.x ? '' : 'cb_dim'}">${slider('sx', 'ShiftX', 'Shift Left/Right:')}</div>
        <div id="m_${prefix}_shint" class="cb_hint" style="margin: 0;${room.x && room.y ? ' display: none;' : ''}">Zoom in to shift a picture that already fits.</div>

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

        <div class="cb_sub">Advanced: Custom CSS</div>
        ${ovRow(s, `${prefix}CssOn`, `${title} Avatar CSS`, customCssBox(s, `${prefix}Css`, 'border: 2px solid white !important;&#10;box-shadow: inset 0 0 12px black;')
          + `<div class="cb_hint">CSS properties for this avatar, without a selector. ${CSS_NOTE}</div>`)}

        <button type="button" id="m_${prefix}_reset" class="menu_button" style="margin-top: 6px; width: max-content;"><i class="fa-solid fa-rotate-left"></i> Reset ${title} Avatar</button>
        </div>
      </div>
      </div>
    `;
  }

  // The Avatar Management page: Names and Pictures, a column for each side, and Emotions (cast.js).
  function avatarsSectionHtml(s) {
    return pageHtml('pfp', `
            ${card('', ovRow(s, 'ovNamesOn', 'Names and Pictures', ovPick(s, 'ovNames', [['show', 'Show'], ['hide', 'Hide']])
              + '<div class="cb_hint">Hide removes avatars, names and timestamps, pop-outs included. Message Details (Elements) still shows its details where ticked, except under the avatar.</div>'))}
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

    const bindCol = (prefix) => {
      const col = overlay.querySelector(`#m_${prefix}_col`);
      const label = prefix === 'ai' ? 'AI' : 'User';

      // Corners are for Rectangle and Square. Picture Fit is off with a Shape, which the picture always fills. Picture Size is off for Original, which keeps the
      // picture's own size. Text Padding is off for In Line, which never puts the avatar under the text. Rotate is for a
      // Shape, the Shift sliders for a picture bigger than its box, and Fade Strength for a fade that's on.
      const syncScale = () => {
        const shaped = !!SHAPES[s[`${prefix}Shape`]];
        const cornersOn = ['rectangle', 'square'].includes(s[`${prefix}Shape`]);
        const room = shiftRoom(s, prefix);
        col.querySelector(`#m_${prefix}_fowrap`).classList.toggle('cb_dim', !room.y);
        col.querySelector(`#m_${prefix}_sxwrap`).classList.toggle('cb_dim', !room.x);
        col.querySelector(`#m_${prefix}_shint`).style.display = room.x && room.y ? 'none' : '';
        col.querySelector(`#m_${prefix}_rmwrap`).classList.toggle('cb_dim', !shaped);
        col.querySelector(`#m_${prefix}_rmoff`).style.display = shaped ? 'none' : '';
        col.querySelector(`#m_${prefix}_fswrap`).classList.toggle('cb_dim', !anyFade(s, prefix));
        col.querySelector(`#m_${prefix}_fxwrap`).classList.toggle('cb_dim', !FILTERS[s[`${prefix}Filter`]]);
        col.querySelector(`#m_${prefix}_txwrap`).classList.toggle('cb_dim', !TEXTURES[s[`${prefix}Texture`]]);
        col.querySelector(`#m_${prefix}_crwrap`).classList.toggle('cb_dim', !cornersOn);
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
      onPills(col, `${prefix}rmode`, (v) => { s[`${prefix}RotateMode`] = v; save(); syncScale(); updateAvatarStyle(); });
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
        if (!(await askYes(this, `Reset all ${label} avatar settings to defaults, Style and Custom CSS included?`, 'Reset'))) return;
        for (const k of Object.keys(DEFAULTS)) {
          if (k.startsWith(prefix) && k !== `${prefix}Enabled`) s[k] = structuredClone(DEFAULTS[k]);
        }
        save();
        updateAvatarStyle();
        openCombinedModal();
      };
      
      const sliders = [
        { id: 'sc', key: 'Scale' }, { id: 'cr', key: 'Corner' }, { id: 'fo', key: 'Focus' }, { id: 'sx', key: 'ShiftX' }, { id: 'zm', key: 'Zoom' },
        { id: 'rt', key: 'Rotate' }, { id: 'pad', key: 'Pad' }, { id: 'ox', key: 'PopX' }, { id: 'oy', key: 'PopY' },
        { id: 'fs', key: 'FadeStr' }, { id: 'fx', key: 'FilterStr' }, { id: 'tx', key: 'TextureStr' }
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
          updateAvatarStyle();
        };
        el.onchange = save;
      });
    };
    
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
