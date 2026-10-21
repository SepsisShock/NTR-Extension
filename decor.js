// Nitwit Tavern Redesign: UI Decor module: the chat panel, messages and send box, Interface Shape, Speech Bubbles, and
// the page that sets them. Loaded by index.js before NTR starts, so its styles are there from the first draw, unless it
// takes over 5 seconds; then it restyles when it arrives. If this file breaks, the rest of the extension keeps working,
// with SillyTavern's own look for these parts.
// The settings, their limits and the lists they're checked against stay in index.js, and so do Blur and Shadow (in
// overrideCss) and the corners and bottom line where the chat panel meets a Free send bar (joinCss), which follow
// this file. It builds from what index.js shares in window.NTR.api.look.
(() => {
  const DECOR_VERSION = '2.69.23';
  const A = window.NTR && window.NTR.api;
  if (!A || !A.look) { console.error('[NTR] decor.js loaded without the core (index.js).'); return; }
  const { card, onPills, pageHtml, pills, rangeNum, save, settings } = A;
  const { BUB_INK_OPTS, BUB_TAIL_OPTS, COLOR_FROM, SWITCHES, bubRight, bubblesOn, cssRule, joinCss, ntrAvatars, ovBgRow, ovBorderRow, ovBorderVal,
    ovColorVal, ovLabel, ovPick, ovRadius, ovRow, ovShapeRow, ovWhen, rangeSlider, restyle: updateAvatarStyle, sendSeparate, svgMask } = A.look;
  const openCombinedModal = () => A.openMenu();

  // The AI and User messages.
  const MES_SEL = { Ai: '#chat .mes[is_user="false"]', Us: '#chat .mes[is_user="true"]' };

  // Interface Shape for the rest of the interface: SillyTavern's Menu Bar, drawers, side panels, menus and popups, and NTR's
  // own windows. Every corner follows it, wherever the part sits, even against the screen edge. Boxes inside them are a
  // little less round, so their corners sit inside the outer ones. Buttons, text boxes, checkboxes, sliders and pills keep ST's
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
    .cb_hbtn, .cb_close_btn, .ntr_map_hb, .ntr_agres_btn, .cb_pill)`;

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

  // UI Decor's own chat CSS: the chat panel, messages, send box, Interface Shape and Speech Bubbles. The caller adds the
  // line break after it, together with layoutChatCss and namesCss.
  function chatLookCss(s) {
    if (!s.ovEnabled) return '';
    let css = '';
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
    return css;
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

  function displaySectionHtml(s) {
    const row = (onKey, label, inner) => ovRow(s, onKey, label, inner);
    const sl = (key) => rangeSlider(s, key);
    const shape = (p) => ovShapeRow(s, p);
    const bg = (p, hint = '') => ovBgRow(s, p, hint);
    const border = (p) => ovBorderRow(s, p);
    return pageHtml('display', `
          <div class="cb_hint">Changes how ST looks without touching its own settings. Tick a setting to change it; untick it to go back to ST's value.</div>
          ${card('Whole Interface', `
          ${row('ovShapeOn', 'Interface Shape', ovPick(s, 'ovShape', [['rounded', 'Rounded'], ['square', 'Square']])
            + ovWhen('ovShape', 'rounded', ovLabel('Roundness', sl('ovRound')))
            + '<div class="cb_hint">Corners of the ST Menu Bar, drawers, side panels, menus, popups and NTR\'s windows, and the chat panel\'s bottom when the send bar stands apart. Square also squares their buttons and controls.</div>')}
          ${row('ovBlurOn', 'Blur Strength', sl('ovBlur') + '<div class="cb_hint">The frosted-glass blur behind the chat, menus, drawers and popups.</div>')}
          ${row('ovShadowOn', 'Text Shadow', sl('ovShadow'))}`, 'fa-display')}
          ${card('Chat Panel', `
          ${bg('Panel')}
          ${border('Panel')}`, 'fa-comments')}
          ${card('AI Message', shape('Ai') + bg('Ai') + border('Ai'), 'fa-masks-theater')}
          ${card('User Message', shape('Us') + bg('Us') + border('Us'), 'fa-user-pen')}
          ${card('Speech Bubbles', bubbleRowHtml(s), 'fa-comment-dots')}
          ${card('Send Bar', shape('Send') + bg('Send') + border('Send'), 'fa-paper-plane')}
    `, { sw: ['m_ov_enable', s.ovEnabled] });
  }

  function bubbleRowHtml(s) {
    const pick = (k, opts) => ovPick(s, k, opts);
    const hint = (t) => `<div class="cb_hint">${t}</div>`;
    return ovRow(s, 'ovBubOn', 'Speech Bubbles',
      hint('Turns AI and User messages into bubbles. Colors, roundness and border come from AI Message and User Message. Reader Mode\'s Book keeps plain messages.')
      + ovLabel('Style', pills('obubpreset', [...Object.entries(BUB_PRESETS).map(([v, [l]]) => [v, l]), ['custom', 'Custom']], bubPreset(s)))
      + hint('A style sets everything here except Tail Position, plus the AI and User Message cards. Changing anything after makes it Custom.')
      + ovLabel('Tail', pick('ovBubTail', BUB_TAIL_OPTS))
      + hint('A Transparent background has no tail.')
      + ovLabel('Tail Position', pick('ovBubTailPos', [['top', 'Top'], ['bottom', 'Bottom']]))
      + ovLabel('Sides', pick('ovBubAlign', [['left', 'All Left'], ['sides', 'AI Left, You Right'], ['swap', 'AI Right, You Left']]))
      + hint('Avatars follow their message\'s side, unless NTR Avatars puts them above or below, behind, or pops them out.')
      + ovLabel('Max Width', rangeSlider(s, 'ovBubWidth'))
      + ovLabel('Width', pick('ovBubFit', [['shrink', 'Shrink to Fit'], ['fill', 'Always Max Width']]))
      + ovLabel('Messages in a Row', pick('ovBubGroup', [['group', 'Group'], ['each', 'Each Message']]))
      + hint('Group gives a run of messages from the same speaker one tail and avatar.')
      + ovLabel('Text in Bubbles', pick('ovBubInk', BUB_INK_OPTS))
      + hint('As Is keeps Text Formatting\'s or ST\'s text color.'));
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

  // What index.js calls.
  window.NTR.decor = {
    version: DECOR_VERSION,
    sectionHtml: displaySectionHtml,
    bind: bindDisplay,
    css: chatLookCss,
    sync: markBubbleRuns,
  };
})();
