// Nitwit Tavern Redesign: Avatar Management module: NTR Avatars (In Line, Backdrop and Pop Out), avatar shapes,
// fades and crop, and the page that sets them. Loaded by index.js before NTR starts, so its styles are there from the
// first draw. If this file breaks, the rest of the extension keeps working, with SillyTavern's own avatars.
// The settings, their limits and the lists they're checked against stay in index.js, and so do the pop-out pictures'
// layer and loading and Edit Placement; this file writes their size and position CSS. It builds from what index.js
// shares in window.NTR.api.look.
(() => {
  const AVATARS_VERSION = '2.69.9';
  const A = window.NTR && window.NTR.api;
  if (!A || !A.look) { console.error('[NTR] avatars.js loaded without the core (index.js).'); return; }
  const { DEFAULTS, askYes, card, escapeHTML, fullResUrl, isOn, numRange, onPills, pageHtml, pills, posGrid, rangeAttrs, rangeNum, save, settings,
    startPlacement } = A;
  const { POS_GRID, SHAPE_OPTS, castPartHtml, ntrAvatars, ovPick, ovRow, popMsg, restyle: updateAvatarStyle, svgMask } = A.look;
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

  // Every chat avatar picture on screen, after a restyle: its shape and width once it has loaded, and the full-size picture.
  function syncAvatarImgs() {
    document.querySelectorAll('#chat .mes .avatar img').forEach((img) => { if (img.complete) setAvatarRatio(img); fullAvatar(img); });
  }
  // A chat avatar picture that just loaded.
  function avatarImgLoaded(img) {
    setAvatarRatio(img);
    fullAvatar(img);
  }

  // SillyTavern's own chat avatars in a side's Shape, where NTR Avatars is off for that side.
  function stShapeCss(flag, shape, corner, focus) {
    const [w, h] = shape === 'rectangle' ? ['calc(var(--avatar-base-width) * 1.2)', 'calc(var(--avatar-base-height) * 1.8)'] : ['var(--avatar-base-width)', 'var(--avatar-base-height)'];
    const outline = OUTLINES[shape];
    const r = shape === 'round' ? 'var(--avatar-base-border-radius-round)' : outline ? '0' : `calc(${w} * ${corner / 100})`;
    return `\n      #chat .mes[is_user="${flag}"] .avatar, #chat .mes[is_user="${flag}"] .avatar img { width: ${w} !important; height: ${h} !important; border-radius: ${r} !important; object-fit: cover !important; object-position: 50% ${focus}% !important; }\n`
      + (outline ? `      #chat .mes[is_user="${flag}"] .avatar img { border: none !important; box-shadow: none !important; -webkit-mask: ${outline} center / 100% 100% no-repeat !important; mask: ${outline} center / 100% 100% no-repeat !important; }\n` : '');
  }

  // NTR Avatars on each side, and SillyTavern's own chat avatars in a side's Shape where NTR Avatars is off. The Shape
  // part counts with Avatar Management switched off too.
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
    if (isOn()) {
      for (const [prefix, flag] of [['ai', 'false'], ['us', 'true']]) {
        if (!ntrAvatars(s, prefix) && SHAPES[s[prefix + 'Shape']]) css += stShapeCss(flag, s[prefix + 'Shape'], rangeNum(s, prefix + 'Corner'), rangeNum(s, prefix + 'Focus'));
      }
    }
    return css;
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
      <div class="cb_row"><label>${label}</label><span><span id="m_${prefix}_${id}val" class="ntr_slval">${rangeNum(s, prefix + key)}</span>${numRange(prefix + key)[3]}</span></div>
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

  // The Avatar Management page: Names and Pictures, a column for each side, and Emotions (cast.js).
  function avatarsSectionHtml(s) {
    return pageHtml('pfp', `
            ${card('', ovRow(s, 'ovNamesOn', 'Names and Pictures', ovPick(s, 'ovNames', [['show', 'Show'], ['hide', 'Hide']])
              + '<div class="cb_hint">Hide takes away avatars, names and timestamps, NTR Avatars and pop-outs included. With Message Details (Elements) on, its details show wherever they\'re ticked, except under the avatar.</div>'))}
            <div class="ntr_cols">
              ${getColHtml('ai', 'AI', s)}
              ${getColHtml('us', 'User', s)}
            </div>
            ${castPartHtml()}
        `, { sw: ['m_a_enable', s.avatarEnabled], legend: true });
  }

  // The Avatar Management page's switch and both columns.
  function bindAvatars(overlay, s) {
    overlay.querySelector('#m_a_enable').onchange = function() {
      s.avatarEnabled = this.checked; save(); updateAvatarStyle();
    };

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

  // The avatar fade grid: the Position grid's cells, each a fade, with the middle left empty. Lit cells have a fade on.
  function fadeGrid(prefix, s, cur) {
    return `<div class="cb_posgrid cb_fadegrid">${POS_GRID.map(([v]) => {
      if (!FADE_PARTS[v]) return '<span></span>';
      const [key, name] = FADE_PARTS[v];
      return `<label title="${name} Fade" class="${rangeNum(s, prefix + key) > 0 ? 'cb_fon' : ''}"><input type="radio" name="cbr_${prefix}fade" value="${v}" ${v === cur ? 'checked' : ''}></label>`;
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
