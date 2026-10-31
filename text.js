(() => {
  const TEXT_VERSION = '2.86.30';
  const A = window.NTR && window.NTR.api;
  if (!A || !A.look) { console.error('[NTR] text.js loaded without the core (index.js).'); return; }
  const { bindPicSlot, card, onPills, pageHtml, picSlotHtml, pills, rangeNum, save, subHead } = A;
  const { COLOR_RE, FONT_NOTE, FX, FX_PARTS, NAME_WEIGHT, TEXT_ALIGN, bubblesOn, bubRight, cUrl, cssReaders, cssRule, ntrAvatars,
    restyle: updateAvatarStyle, rangeSlider, ovRow, ovColor, ovFont, ovLabel } = A.look;

  // Text Effect: Glow, Shadow or Outline. Without an Effect Color, Glow uses the text's own color and the others are black.
  // Gradient and Shimmer are painted into the letters instead (see paintOf).
  function fxProps(s, p) {
    if (!s[p + 'FxOn'] || !FX.includes(s[p + 'Fx']) || PAINT.includes(s[p + 'Fx'])) return {};
    const n = rangeNum(s, p + 'FxStr');
    const fx = s[p + 'Fx'];
    const c = s[p + 'FxColorOn'] && COLOR_RE.test(s[p + 'FxColor']) ? s[p + 'FxColor'] : fx === 'glow' ? 'currentColor' : 'rgba(0, 0, 0, .8)';
    if (fx === 'glow') return { 'text-shadow': `0 0 ${n * 2}px ${c}, 0 0 ${n}px ${c}` };
    if (fx === 'shadow') return { 'text-shadow': `${Math.ceil(n / 3)}px ${Math.ceil(n / 3)}px ${n}px ${c}` };
    return { '-webkit-text-stroke': `${(n * 0.2).toFixed(1)}px ${c}`, 'paint-order': 'stroke fill' };
  }

  // The Text Effect on the text inside a message or the Visual Novel box. SillyTavern gives every element its own text
  // shadow, so Glow and Shadow are passed down to each one, or they'd only reach text outside a paragraph. Code blocks,
  // tables and the edit box keep ST's look; Outline, which passes down by itself, is taken off them. Message Details'
  // corner, at the end of the text, keeps ST's shadow. Speech Bubbles' Dark and Light text turn Glow and Shadow off
  // (decor.js), so there the text inside keeps ST's.
  const FX_SKIP = ':is(pre, table, textarea)';
  function fxInnerCss(fx, box, inked) {
    if (fx['-webkit-text-stroke']) return cssRule(`${box} ${FX_SKIP}`, { '-webkit-text-stroke': '0' });
    if (!fx['text-shadow'] || inked) return '';
    return cssRule(`${box} :not(${FX_SKIP}, ${FX_SKIP} *)`, { 'text-shadow': 'inherit' })
      + cssRule(`body:not(.ntr_book) ${box} > *::after`, { 'text-shadow': ST_SHADOW });
  }
  const ST_SHADOW = '0 0 calc(var(--shadowWidth) * 1px) var(--SmartThemeShadowColor)';

  // Gradient and Shimmer: a background painted into the letters (background-clip: text) over see-through text. Gradient
  // runs across from the text's color to the Effect Color, reaching it sooner the higher the Strength. Shimmer is a band
  // of the Effect Color that sweeps across, as wide as the Strength. Unticked, the Effect Color is the Quote Color: the
  // part's own if it has one, else ST's. The band sits in a background wider than the text and rests off it, so a
  // Shimmer that isn't playing looks like plain text. ST's text shadow would show through the letters, so it's taken off.
  const PAINT = ['gradient', 'shimmer'];
  // Shimmer sweeps twice when its text appears, then stops, so nothing runs at rest and its motion stays under 5 seconds.
  // New text plays it again: a new message, a swipe or an edit (ST draws the text anew), and in the Visual Novel box each
  // segment once it's typed and the name tag when the speaker changes (vn.js marks them cb_shown). It waits while a reply
  // is written, since ST rewrites the message on every streamed word, and doesn't play with ST's Reduced Motion, which
  // ST also turns on for the device's own setting.
  const MOVING = ':not(.reduced-motion):not([data-generating])';
  // Changing a Shimmer setting switches the keyframes' name, which plays it again in place, so the menu shows the change.
  // The second place is a Nameplate picture's, under a name's band; text with only the band ignores it.
  let shine = { key: '', name: 'ntr_shine_a' };
  function shineCss(s) {
    const key = JSON.stringify(FX_PARTS.filter((p) => s[p + 'FxOn'] && s[p + 'Fx'] === 'shimmer')
      .map((p) => [p, ...['FxStr', 'FxColorOn', 'FxColor', 'QuoteOn', 'Quote'].map((k) => s[p + k])]));
    if (key !== shine.key) shine = { key, name: shine.key && shine.name === 'ntr_shine_a' ? 'ntr_shine_b' : 'ntr_shine_a' };
    return {
      spin: { animation: `${shine.name} 2.5s ease-in-out 2` },
      keyframes: `\n      @keyframes ${shine.name} { 0% { background-position: 100% 0, center; } 60%, 100% { background-position: 0 0, center; } }`,
    };
  }
  function paintOf(s, p, quote) {
    if (!s[p + 'FxOn'] || !PAINT.includes(s[p + 'Fx'])) return null;
    const n = rangeNum(s, p + 'FxStr');
    const c = s[p + 'FxColorOn'] && COLOR_RE.test(s[p + 'FxColor']) ? s[p + 'FxColor'] : quote || 'var(--SmartThemeQuoteColor)';
    if (s[p + 'Fx'] === 'gradient') return { shimmer: false, image: `linear-gradient(90deg, currentColor, ${c} ${100 - (n - 1) * 8}%)` };
    // Three times the text's width keeps the widest band (30% of it) off the text at both ends of the sweep.
    return { shimmer: true, size: '300% 100%', image: `linear-gradient(90deg, currentColor ${50 - n * 1.5}%, ${c} 50%, currentColor ${50 + n * 1.5}%)` };
  }
  // The paint, under a Nameplate's picture and color when there is one (layer: the picture's url()).
  function paintProps(paint, layer) {
    return {
      'background-image': layer ? `${paint.image}, ${layer}` : paint.image,
      'background-size': layer ? `${paint.size || 'auto'}, cover` : paint.size || '',
      'background-repeat': 'no-repeat',
      '-webkit-background-clip': layer ? 'text, border-box' : 'text',
      'background-clip': layer ? 'text, border-box' : 'text',
      '-webkit-text-fill-color': 'transparent',
      'text-shadow': 'none',
    };
  }
  // In message text and the Visual Novel box, the paint goes on each paragraph, list item and heading: Speech Bubbles
  // draw the bubble on the box itself, which the paint would cut down to the letters. Code blocks and tables are left
  // out; the text in a list item is painted with it. Text outside these, like a card's own HTML boxes, stays plain.
  const BLOCKS = ':is(p, li, h1, h2, h3, h4, h5, h6):not(li *, pre *, table *)';
  // Inside, plain bold and spans take the paint; everything else keeps its own color: italics, quotes, underlines,
  // links, code, a card's colored or faded text, and ST's streaming fade-in, whose fading the paint can't show.
  const PASS = 'p, ul, ol, li, br, :is(strong, b, span):not([class], [style])';
  function paintTextCss(sel, paint) {
    return cssRule(sel, paintProps(paint))
      + cssRule(`${sel} :not(${PASS})`, { '-webkit-text-fill-color': 'currentColor' })
      + cssRule(`${sel} :is(${PASS})`, { 'text-shadow': 'none' })
      // Message Details' corner, at the end of the text.
      + cssRule(`${sel}::after`, { '-webkit-text-fill-color': 'currentColor', 'text-shadow': ST_SHADOW });
  }

  // Nameplate: a color or picture, border and roundness behind the name, on chat messages and the Visual Novel name tag.
  // The picture covers the color. On the Top Edge lifts the name onto the top edge of its message's box, like the Visual
  // Novel name tag. It keeps its place in the row, so the row stays as tall as the name and nothing in the message goes
  // under it. It stays on one line (a long name ends in ...), so the room above the message is half its height. NTR
  // Avatars behind the message or popped out clip the message, so there, and in Reader Mode's Book, the name stays in its row.
  function nameplateCss(s, on, col, ns, freePlace) {
    const img = cUrl(s.tfPlateImg);
    const border = on('tfPlateBorder') ? `${rangeNum(s, 'tfPlateBorderWidth')}px solid ${col('tfPlateBorder') || 'var(--SmartThemeBorderColor)'}` : '';
    const plate = {
      'background-color': col('tfPlateBg'),
      'background-image': img ? `url("${img}")` : '',
      'background-size': img ? 'cover' : '',
      'background-position': img && !freePlace ? 'center' : '',
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
        // Speech Bubbles put this side's name row on the right: the name lines up with the row's right end instead of
        // running past the message.
        const right = bubblesOn(s) && bubRight(s, prefix === 'ai' ? 'Ai' : 'Us');
        css += cssRule(`${m} .ch_name .name_text`, { ...one, position: 'absolute', 'z-index': '2', top: '0', transform: 'translateY(-50%)', 'max-width': 'calc(100% - 30px)',
          left: right ? 'auto' : '', right: right ? '10px' : '' });
        css += cssRule(m, { 'margin-top': `calc(${half} + 2px)`, 'padding-top': `max(10px, calc(${half} + 4px))` });
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

  function textFormatCss(s) {
    if (!s.tfEnabled) return '';
    const { on, col, font, size } = cssReaders(s);
    let css = '';
    const { spin, keyframes } = shineCss(s);

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
    // Shimmer plays on the newest message's name, and on the Visual Novel name tag. Under it, a Nameplate picture's place
    // is set without !important, which would hold the band still.
    const namePaint = paintOf(s, 'tfName', '');
    const img = cUrl(s.tfPlateImg);
    const freePlace = !!(namePaint && namePaint.shimmer && img);
    css += nameplateCss(s, on, col, ns, freePlace);
    if (namePaint) {
      const plated = !!(img || col('tfPlateBg'));
      const layer = img ? `url("${img}")` : plated ? 'none' : '';
      const newest = '#chat > .mes:nth-last-child(1 of .mes:not([is_system="true"]))';
      css += cssRule(`body:not(.ntr_book) ${namePaint.shimmer ? newest : '.mes'} .name_text`, paintProps(namePaint, layer));
      if (namePaint.shimmer) css += cssRule(`body:not(.ntr_book)${MOVING} ${newest} .name_text`, spin);
      // The Visual Novel name tag is filled with the Quote Color, which the paint would fade into, so without a Nameplate
      // it takes the theme's panel color, a border and the body text color.
      css += cssRule('#cb_node .cb_n_name', {
        ...paintProps(namePaint, layer || 'none'),
        'background-color': plated ? '' : 'var(--SmartThemeBlurTintColor)',
        color: plated || col('tfNameColor') ? '' : 'var(--SmartThemeBodyColor)',
        border: plated || on('tfPlateBorder') ? '' : '1px solid var(--SmartThemeBorderColor)',
      });
      if (namePaint.shimmer) css += cssRule(`body${MOVING} #cb_node .cb_n_name.cb_shown`, spin);
      if (freePlace) css += `\n      .mes .name_text { background-position: center; }\n      body:not(.ntr_book) ${newest} .name_text, #cb_node .cb_n_name { background-position: 0 0, center; }`;
    }

    // User and AI message text. The Visual Novel dialogue box uses the AI's.
    const align = (p) => (on(p + 'Align') && TEXT_ALIGN.includes(s[p + 'Align']) ? s[p + 'Align'] : '');
    const inked = bubblesOn(s) && s.ovBubInk !== 'auto';
    const fx = { tfUser: fxProps(s, 'tfUser'), tfAi: fxProps(s, 'tfAi') };
    const paint = { tfUser: paintOf(s, 'tfUser', col('tfUserQuote')), tfAi: paintOf(s, 'tfAi', col('tfAiQuote')) };
    for (const [p, flag] of [['tfUser', 'true'], ['tfAi', 'false']]) {
      const m = `.mes[is_user="${flag}"] .mes_text`;
      const sz = size(p + 'Size');
      css += cssRule(m, { color: col(p + 'Main'), 'font-family': font(p + 'Font'), 'font-size': sz ? `calc(var(--mainFontSize) * ${sz})` : '', 'text-align': align(p), ...fx[p] });
      css += fxInnerCss(fx[p], m, inked);
      // Shimmer plays on the newest message from each side.
      if (paint[p] && !inked) {
        const newest = `#chat > .mes[is_user="${flag}"]:nth-last-child(1 of .mes[is_user="${flag}"]:not([is_system="true"]))`;
        css += paintTextCss(`body:not(.ntr_book) ${paint[p].shimmer ? newest : `.mes[is_user="${flag}"]`} .mes_text ${BLOCKS}`, paint[p]);
        if (paint[p].shimmer) css += cssRule(`body:not(.ntr_book)${MOVING} ${newest} .mes_text ${BLOCKS}`, spin);
      }
      // Lists, tables, code blocks and the edit box keep SillyTavern's alignment: bullets, columns and code don't center or justify well.
      if (align(p)) css += cssRule(`${m} :is(ul, ol, table, pre, textarea)`, { 'text-align': 'start' });
      css += cssRule(`${m} i, ${m} em`, { color: col(p + 'Em') });
      css += cssRule(`${m} u`, { color: col(p + 'Under') });
      css += cssRule(`${m} q`, { color: col(p + 'Quote') });
      if (col(p + 'Em')) css += cssRule(`${m} q i, ${m} q em`, { color: 'inherit' });
    }
    css += cssRule('#cb_node .cb_n_text', { color: col('tfAiMain'), 'font-family': font('tfAiFont'), 'text-align': align('tfAi'), ...fx.tfAi });
    css += fxInnerCss(fx.tfAi, '#cb_node .cb_n_text', false);
    // The Visual Novel box scrolls, and the paint scrolls with its text.
    if (paint.tfAi) {
      css += paintTextCss('#cb_node .cb_n_text', paint.tfAi) + cssRule('#cb_node .cb_n_text', { 'background-attachment': 'local' });
      if (paint.tfAi.shimmer) css += cssRule(`body${MOVING} #cb_node .cb_n_text.cb_shown`, spin);
    }
    if ([namePaint, paint.tfUser, paint.tfAi].some((x) => x && x.shimmer)) css += keyframes;
    css += cssRule('#cb_node .cb_n_text em', { color: col('tfAiEm') });
    css += cssRule('#cb_node .cb_q', { color: col('tfAiQuote') });
    if (col('tfAiEm')) css += cssRule('#cb_node .cb_q em', { color: 'inherit' });
    return css ? css + '\n' : '';
  }

  function ovFx(s, p) {
    const hint = p === 'tfName' ? 'Shimmer sweeps twice over the newest name when it appears'
      : 'Gradient and Shimmer keep italics, quotes, underlines and links in their own colors. Shimmer sweeps twice over the newest message when it appears';
    return pills(p.toLowerCase() + 'fx', [['glow', 'Glow'], ['shadow', 'Shadow'], ['outline', 'Outline'], ['gradient', 'Gradient'], ['shimmer', 'Shimmer']], s[p + 'Fx'])
      + ovLabel('Strength', rangeSlider(s, p + 'FxStr'))
      + `<div class="cb_hint">${hint}. Off with Reduced Motion, ST's or the device's.</div>`;
  }

  function fxRows(s, p) {
    const quote = p === 'tfName' ? 'ST\'s Quote Color' : 'the Quote Color';
    return `
          ${ovRow(s, p + 'FxOn', 'Text Effect', ovFx(s, p))}
          ${ovRow(s, p + 'FxColorOn', 'Effect Color', ovColor(s, p + 'FxColor') + `<div class="cb_hint">Unticked, Glow uses the text color, Shadow and Outline are black, and Gradient and Shimmer use ${quote}.</div>`)}`;
  }

  const PLATE_PIC = { id: 'plate', key: 'tfPlateImg', title: 'Nameplate Picture', upload: ['plate', { maxWidth: 800 }], wide: true, hint: 'Covers the Color.' };

  function textSectionHtml(s) {
    const part = (p) => `
          ${ovRow(s, p + 'FontOn', 'Font', ovFont(s, p + 'Font'))}
          ${ovRow(s, p + 'SizeOn', 'Size', rangeSlider(s, p + 'Size'))}
          ${ovRow(s, p + 'AlignOn', 'Alignment', pills(p.toLowerCase() + 'align', [['left', 'Left', 'ST\'s default'], ['right', 'Right'], ['center', 'Center'], ['justify', 'Justify']], s[p + 'Align'])
            + '<div class="cb_hint">Lists, tables and code blocks keep ST\'s alignment.</div>')}
          ${ovRow(s, p + 'MainOn', 'Main Text Color', ovColor(s, p + 'Main'))}
          ${ovRow(s, p + 'EmOn', 'Italics Color', ovColor(s, p + 'Em'))}
          ${ovRow(s, p + 'UnderOn', 'Underline Color', ovColor(s, p + 'Under'))}
          ${ovRow(s, p + 'QuoteOn', 'Quote Color', ovColor(s, p + 'Quote'))}${fxRows(s, p)}`;
    return pageHtml('text', `
          <div class="cb_hint">Also styles the Visual Novel box: AI Text the dialogue, Names and Nameplate the name tag. Sizes and weight there come from Visual Novel Mode. Tick a setting to change it; untick it to go back to ST's value. ${FONT_NOTE}</div>
          ${card('Whole Interface', ovRow(s, 'ovFontOn', 'Overall Font Scale', rangeSlider(s, 'ovFont') + '<div class="cb_hint">Scales all of ST\'s text, menus included. The Sizes below multiply it.</div>'), 'fa-display')}
          ${subHead('tf_names', 'Names', 'fa-signature')}
          <div class="cb_collapse_content">
            ${ovRow(s, 'tfNameFontOn', 'Font', ovFont(s, 'tfNameFont'))}
            ${ovRow(s, 'tfNameSizeOn', 'Size', rangeSlider(s, 'tfNameSize'))}
            ${ovRow(s, 'tfNameWeightOn', 'Weight', pills('tfnweight', [['normal', 'Normal'], ['bold', 'Bold', 'ST\'s default'], ['extra', 'Extra Bold']], s.tfNameWeight))}
            ${ovRow(s, 'tfNameColorOn', 'Color', ovColor(s, 'tfNameColor'))}${fxRows(s, 'tfName')}
          </div>
          ${subHead('tf_plate', 'Nameplate', 'fa-id-badge')}
          <div class="cb_collapse_content">
            <div class="cb_hint">A box behind the name.</div>
            ${ovRow(s, 'tfPlateBgOn', 'Color', ovColor(s, 'tfPlateBg'))}
            ${picSlotHtml(PLATE_PIC)}
            ${ovRow(s, 'tfPlateBorderOn', 'Border', ovColor(s, 'tfPlateBorder') + ovLabel('Width', rangeSlider(s, 'tfPlateBorderWidth')))}
            ${ovRow(s, 'tfPlateRoundOn', 'Roundness', rangeSlider(s, 'tfPlateRound'))}
            ${ovRow(s, 'tfPlatePosOn', 'Position', pills('tfplatepos', [['row', 'Name Row', 'ST\'s default'], ['edge', 'On the Top Edge']], s.tfPlatePos)
              + '<div class="cb_hint">On the Top Edge adds room above each message and cuts a long name short. With NTR Avatars behind or popped out, and in Reader Mode\'s Book, the name stays in its row.</div>')}
          </div>
          ${subHead('tf_user', 'User Text', 'fa-user-pen')}
          <div class="cb_collapse_content">${part('tfUser')}
          </div>
          ${subHead('tf_ai', 'AI Text', 'fa-masks-theater')}
          <div class="cb_collapse_content">${part('tfAi')}
          </div>
    `, { sw: ['m_tf_enable', s.tfEnabled] });
  }

  function bindTextFormatting(overlay, s) {
    overlay.querySelector('#m_tf_enable').onchange = function() { s.tfEnabled = this.checked; save(); updateAvatarStyle(); };
    onPills(overlay, 'tfnweight', (v) => { s.tfNameWeight = v; save(); updateAvatarStyle(); });
    for (const p of ['tfUser', 'tfAi']) onPills(overlay, p.toLowerCase() + 'align', (v) => { s[p + 'Align'] = v; save(); updateAvatarStyle(); });
    onPills(overlay, 'tfplatepos', (v) => { s.tfPlatePos = v; save(); updateAvatarStyle(); });
    bindPicSlot(overlay, s, PLATE_PIC);
    for (const p of FX_PARTS) onPills(overlay, p.toLowerCase() + 'fx', (v) => { s[p + 'Fx'] = v; save(); updateAvatarStyle(); });
  }

  // What index.js calls.
  window.NTR.text = {
    version: TEXT_VERSION,
    sectionHtml: textSectionHtml,
    bind: bindTextFormatting,
    css: textFormatCss,
  };
})();
