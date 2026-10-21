// Nitwit Tavern Redesign: Text Formatting module: names, nameplates and message text, in the chat and in Visual Novel
// Mode. Loaded by index.js before NTR starts, so its styles are there from the first draw. If this file breaks, the rest
// of the extension keeps working, with SillyTavern's own look for these parts.
// The settings, their limits and the lists they're checked against stay in index.js; this file builds from what it
// shares in window.NTR.api.look.
(() => {
  const TEXT_VERSION = '2.69.28';
  const A = window.NTR && window.NTR.api;
  if (!A || !A.look) { console.error('[NTR] text.js loaded without the core (index.js).'); return; }
  const { askImageUrl, card, deleteFileIfUnused, escapeHTML, onPills, pageHtml, pills, rangeNum, save, subHead, uploadImage } = A;
  const { COLOR_RE, FONT_NOTE, FX, FX_PARTS, NAME_WEIGHT, TEXT_ALIGN, bubblesOn, bubRight, cUrl, cssReaders, cssRule, ntrAvatars,
    restyle: updateAvatarStyle, rangeSlider, ovRow, ovColor, ovFont, ovLabel } = A.look;

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

  function ovFx(s, p) {
    return pills(p.toLowerCase() + 'fx', [['glow', 'Glow'], ['shadow', 'Shadow'], ['outline', 'Outline']], s[p + 'Fx']) + rangeSlider(s, p + 'FxStr');
  }

  function fxRows(s, p) {
    return `
          ${ovRow(s, p + 'FxOn', 'Text Effect', ovFx(s, p))}
          ${ovRow(s, p + 'FxColorOn', 'Effect Color', ovColor(s, p + 'FxColor') + '<div class="cb_hint">Unticked, Glow uses the text color; Shadow and Outline are black.</div>')}`;
  }

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
            <div class="cb_cur_slot">
              <div class="cb_cur_row">
                <div class="cb_cur_prev ntr_rd_pic" id="m_plate_prev"></div>
                <span class="cb_cur_name">Picture<small>Covers the Color.</small></span>
                <button class="menu_button" id="m_plate_up" title="Upload" aria-label="Upload"><i class="fa-solid fa-upload"></i></button>
                <button class="menu_button" id="m_plate_url" title="Use a link" aria-label="Use a link"><i class="fa-solid fa-link"></i></button>
                <button class="menu_button" id="m_plate_clr" title="Remove picture" aria-label="Remove picture"><i class="fa-solid fa-rotate-left"></i></button>
              </div>
              <input type="file" id="m_plate_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
            </div>
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
      const url = await askImageUrl('Nameplate Picture', this, false);
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

  // What index.js calls.
  window.NTR.text = {
    version: TEXT_VERSION,
    sectionHtml: textSectionHtml,
    bind: bindTextFormatting,
    css: textFormatCss,
  };
})();
