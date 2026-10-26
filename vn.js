// Nitwit Tavern Redesign: Visual Novel Mode module.
// Loaded on demand by index.js. If this file breaks, the rest of the extension keeps working.
(() => {
  const VN_VERSION = '2.80.0';
  const A = window.NTR && window.NTR.api;
  if (!A) { console.error('[NTR] vn.js loaded without the core (index.js).'); return; }
  const { ctx, save, settings, escapeHTML, askImageUrl, uploadImage, newId, media, pills, onPills, subHead } = A;
  const { ovLabel } = A.look;
  const TAG = A.TAG || '';
  // Speakers, emotions and their pictures come from cast.js, which index.js loads first.
  const C = window.NTR.cast;
  if (!C) { console.error('[NTR] vn.js loaded without cast.js.'); return; }
  const { tagRe, splitTag, castNew, castStep, spotBoxes, pickSpots } = C;

  // Per-character Visual Novel data (speakers, portraits, locations). Lives in the card, or per group.
  const VDEF = () => ({ avatars: Object.create(null), sprites: Object.create(null), emoImgs: Object.create(null), customSpk: [], hiddenSpk: [], locations: [], locDefault: '', cgs: [], maps: [], mapRoot: '', opening: {} });
  function V() {
    const st = A.store();
    if (!st) return VDEF();
    if (!st.vn || typeof st.vn !== 'object') st.vn = VDEF();
    const d = VDEF();
    for (const k of Object.keys(d)) if (st.vn[k] === undefined) st.vn[k] = d[k];
    return st.vn;
  }

  const normLoc = (x) => String(x || '').toLowerCase().replace(/^\s*the\s+/, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const lc = (x) => String(x || '').trim().toLowerCase();
  const safe = (fn) => { try { return fn(); } catch (e) { console.error('[NTR]', e); return undefined; } };
  const vnOn = () => A.isOn() && settings().nodeEnabled;

  // ----- Built-in art kit: original SVG drawn in code, no outside art -----
  function rng(seed) {
    return () => {
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const svgUri = (svg) => 'data:image/svg+xml,' + encodeURIComponent(svg);
  const SVG_HEAD = '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">';
  const f0 = (n) => Math.round(n);
  function stars(r, n, maxY, op = 1) {
    let o = '';
    for (let i = 0; i < n; i++) o += `<circle cx="${f0(r() * 1600)}" cy="${f0(r() * maxY)}" r="${(0.6 + r() * 1.6).toFixed(1)}" fill="#fff" opacity="${((0.3 + r() * 0.7) * op).toFixed(2)}"/>`;
    return o;
  }
  function pines(r, n, base, hMin, hMax, color) {
    let d = '';
    for (let i = 0; i < n; i++) {
      const x = r() * 1700 - 50, h = hMin + r() * (hMax - hMin), w = h * 0.42, y = base + r() * 30;
      for (let k = 0; k < 3; k++) {
        const ty = y - h + k * h * 0.28, by = ty + h * 0.45, ww = w * (0.55 + k * 0.25);
        d += `M${f0(x)} ${f0(ty)}L${f0(x - ww / 2)} ${f0(by)}L${f0(x + ww / 2)} ${f0(by)}Z`;
      }
      d += `M${f0(x - 5)} ${f0(y - h * 0.1)}h10v${f0(h * 0.12 + 30)}h-10Z`;
    }
    return `<path d="${d}" fill="${color}"/>`;
  }
  const ART_BG = {
    dusk: () => SVG_HEAD + '<defs><linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1236"/><stop offset=".45" stop-color="#5e2a5c"/><stop offset=".72" stop-color="#c85a74"/><stop offset="1" stop-color="#f4ad68"/></linearGradient>'
      + '<radialGradient id="b" cx="1120" cy="600" r="420" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffd9a0" stop-opacity=".85"/><stop offset="1" stop-color="#ffd9a0" stop-opacity="0"/></radialGradient></defs>'
      + `<rect width="1600" height="900" fill="url(#a)"/>${stars(rng(7), 40, 260, 0.6)}<circle cx="1120" cy="600" r="420" fill="url(#b)"/><circle cx="1120" cy="590" r="64" fill="#ffe4b5"/>`
      + '<path d="M0 640C200 560 380 600 560 580S900 620 1100 600 1450 540 1600 580V900H0Z" fill="#7b3b69" opacity=".8"/>'
      + '<path d="M0 720C240 650 420 700 640 680S1000 720 1240 700 1500 660 1600 670V900H0Z" fill="#4a2350"/>'
      + '<path d="M0 805C300 745 520 795 800 772S1300 805 1600 760V900H0Z" fill="#24112d"/></svg>',
    night: () => {
      const r = rng(11);
      let city = '', win = '';
      for (let x = -20; x < 1620;) {
        const w = 50 + r() * 90, h = 90 + r() * 260;
        city += `<rect x="${f0(x)}" y="${f0(900 - h)}" width="${f0(w + 1)}" height="${f0(h)}"/>`;
        for (let wy = 900 - h + 14; wy < 880; wy += 22) for (let wx = x + 10; wx < x + w - 14; wx += 18) if (r() < 0.22) win += `<rect x="${f0(wx)}" y="${f0(wy)}" width="8" height="11"/>`;
        x += w + 2 + r() * 8;
      }
      return SVG_HEAD + '<defs><linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#040714"/><stop offset=".6" stop-color="#13214a"/><stop offset="1" stop-color="#2d3f72"/></linearGradient>'
        + '<radialGradient id="g" cx="1260" cy="190" r="200" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#dfe6ff" stop-opacity=".35"/><stop offset="1" stop-color="#dfe6ff" stop-opacity="0"/></radialGradient>'
        + '<mask id="c"><rect width="1600" height="900" fill="#fff"/><circle cx="1284" cy="174" r="50" fill="#000"/></mask></defs>'
        + `<rect width="1600" height="900" fill="url(#a)"/>${stars(r, 140, 620)}<circle cx="1260" cy="190" r="200" fill="url(#g)"/><circle cx="1260" cy="190" r="56" fill="#f2efd9" mask="url(#c)"/>`
        + `<g fill="#080c1d">${city}</g><g fill="#ffd27a" opacity=".75">${win}</g></svg>`;
    },
    room: () => {
      let boards = '';
      for (let x = -800; x <= 2400; x += 160) boards += `M${f0(800 + (x - 800) * 0.55)} 760L${x} 900`;
      return SVG_HEAD + '<defs><linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c2030"/><stop offset="1" stop-color="#4a3340"/></linearGradient>'
        + '<linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2618"/><stop offset="1" stop-color="#1c120b"/></linearGradient>'
        + '<linearGradient id="n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1533"/><stop offset="1" stop-color="#2c3b6b"/></linearGradient>'
        + '<radialGradient id="l" cx="430" cy="470" r="460" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffcf8a" stop-opacity=".45"/><stop offset="1" stop-color="#ffcf8a" stop-opacity="0"/></radialGradient></defs>'
        + '<rect width="1600" height="900" fill="url(#w)"/><rect y="560" width="1600" height="200" fill="#23171f"/><rect y="556" width="1600" height="8" fill="#5a4048"/>'
        + `<rect y="760" width="1600" height="140" fill="url(#f)"/><path d="${boards}" stroke="#120b07" stroke-width="2" opacity=".6"/>`
        + `<rect x="980" y="150" width="380" height="340" rx="4" fill="#5a4048"/><rect x="996" y="166" width="348" height="308" fill="url(#n)"/>${stars(rng(5), 18, 300, 0.8).replace(/cx="(\d+)"/g, (m, x) => `cx="${996 + (Number(x) % 348)}"`).replace(/cy="(\d+)"/g, (m, y) => `cy="${166 + Number(y)}"`)}`
        + '<circle cx="1260" cy="230" r="26" fill="#f2efd9" opacity=".9"/><path d="M1170 166V474M996 320H1344" stroke="#5a4048" stroke-width="10"/><path d="M950 130h440v28H950z" fill="#3b2228"/>'
        + '<path d="M950 150C990 300 960 420 1000 560H940C930 400 950 280 950 150Z" fill="#6b2433"/><path d="M1390 150C1350 300 1380 420 1340 560H1400C1410 400 1390 280 1390 150Z" fill="#6b2433"/>'
        + '<rect x="250" y="210" width="240" height="170" fill="#5a4048"/><rect x="264" y="224" width="212" height="142" fill="#33475a"/><path d="M264 366L340 290 390 330 430 300 476 350V366Z" fill="#1d2b38"/>'
        + '<circle cx="430" cy="470" r="460" fill="url(#l)"/><rect x="330" y="636" width="200" height="12" fill="#2a1a12"/><path d="M345 648h10v112h-10zM505 648h10v112h-10z" fill="#2a1a12"/>'
        + '<rect x="426" y="530" width="8" height="106" fill="#2a1a12"/><path d="M390 530h80l-18-62h-44z" fill="#e8b06a"/></svg>';
    },
    forest: () => {
      const r = rng(23);
      return SVG_HEAD + '<defs><linearGradient id="a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16303a"/><stop offset=".55" stop-color="#4f7a6c"/><stop offset="1" stop-color="#c9d8b6"/></linearGradient>'
        + '<linearGradient id="m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8efe0" stop-opacity="0"/><stop offset="1" stop-color="#e8efe0" stop-opacity=".55"/></linearGradient></defs>'
        + `<rect width="1600" height="900" fill="url(#a)"/><circle cx="420" cy="380" r="90" fill="#fff6dc" opacity=".55"/>${pines(r, 26, 560, 160, 260, '#5d8577')}`
        + `<rect y="430" width="1600" height="220" fill="url(#m)"/>${pines(r, 20, 700, 240, 380, '#30544b')}<rect y="600" width="1600" height="160" fill="url(#m)" opacity=".6"/>`
        + `${pines(r, 12, 900, 420, 620, '#132824')}<rect y="860" width="1600" height="40" fill="#0d1c19"/></svg>`;
    },
  };
  const artCache = {};
  function artUri(k) {
    if (!ART_BG[k]) return '';
    if (!artCache[k]) artCache[k] = svgUri(ART_BG[k]());
    return artCache[k];
  }
  function silhouette(hue) {
    const body = 'M200 300C122 300 74 330 56 398L34 1000H366L344 398C326 330 278 300 200 300Z';
    return svgUri('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="1000" viewBox="0 0 400 1000"><defs>'
      + `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue},28%,46%)"/><stop offset="1" stop-color="hsl(${hue},34%,16%)"/></linearGradient>`
      + '<linearGradient id="r" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>'
      + `<g fill="url(#g)"><ellipse cx="200" cy="200" rx="74" ry="90"/><path d="M170 270h60l8 50h-76z"/><path d="${body}"/></g>`
      + `<g fill="url(#r)"><ellipse cx="200" cy="200" rx="74" ry="90"/><path d="${body}"/></g>`
      + `<g fill="none" stroke="hsl(${hue},60%,78%)" stroke-opacity=".35" stroke-width="3"><ellipse cx="200" cy="200" rx="74" ry="90"/><path d="M56 398C74 330 122 300 200 300S326 330 344 398"/></g></svg>`);
  }
  const silCache = {};
  function hueOf(key) { let h = 7; for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % 360; }
  function tile(seed, size, n, kind) {
    const r = rng(seed);
    let o = '';
    for (let i = 0; i < n; i++) {
      const x = f0(r() * size), y = f0(r() * (size - 44));
      o += kind === 'rain' ? `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + f0(16 + r() * 24)}"/>` : `<circle cx="${x}" cy="${y + 20}" r="${(1.4 + r() * 2.2).toFixed(1)}" opacity="${(0.45 + r() * 0.5).toFixed(2)}"/>`;
    }
    const g = kind === 'rain' ? '<g stroke="#cfe0ff" stroke-opacity=".55" stroke-width="1.3" stroke-linecap="round">' : '<g fill="#fff">';
    return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${g}${o}</g></svg>`);
  }
  const WX = { r1: tile(3, 220, 16, 'rain'), r2: tile(4, 300, 12, 'rain'), s1: tile(5, 260, 16, 'snow'), s2: tile(6, 380, 12, 'snow') };

  // Animations that stop with Reduced Motion, ST's own (body.reduced-motion) or the device's.
  const still = (sels) => `
      @media (prefers-reduced-motion: reduce) { ${sels.join(', ')} { animation: none; } }
      ${sels.map((x) => `body.reduced-motion ${x}`).join(', ')} { animation: none; }`;
  const VN_CSS = `
      #cb_node { position: fixed; z-index: 2450; display: none; align-items: flex-end; gap: 12px; padding: 0 6px; box-sizing: border-box; pointer-events: none; }
      #cb_node > * { pointer-events: auto; }
      #cb_node.cb_right { flex-direction: row-reverse; }
      #cb_node .cb_n_port { position: relative; flex: none; width: var(--cbn-ps, 120px); height: var(--cbn-ps, 120px); border-radius: 12px; overflow: hidden; border: 2px solid var(--SmartThemeBorderColor, #555); background: rgba(0,0,0,0.55); box-shadow: 0 4px 14px rgba(0,0,0,.5); }
      #cb_node .cb_n_port img { width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; }
      #cb_node .cb_n_port i { display: none; position: absolute; inset: 0; align-items: center; justify-content: center; font-size: calc(var(--cbn-ps, 120px) * 0.45); opacity: .35; }
      #cb_node .cb_n_port.cb_noimg img { display: none; }
      #cb_node .cb_n_port.cb_noimg i { display: flex; }
      #cb_node .cb_n_box { position: relative; flex: 1; min-width: 0; min-height: var(--cbn-minh, 96px); font-size: calc(var(--cbn-fs, 1) * 1em); padding: 22px 18px 28px; border-radius: 12px; border: 2px solid var(--SmartThemeBorderColor, #555); background: rgb(from var(--SmartThemeBlurTintColor, #171717) r g b / var(--cbn-op, .88)); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); color: var(--SmartThemeBodyColor, #ddd); cursor: pointer; box-shadow: 0 4px 18px rgba(0,0,0,.55); }
      #cb_node .cb_n_name { position: absolute; top: -14px; left: 16px; padding: 2px 14px; border-radius: 999px; font-weight: bold; font-size: 0.95em; background: var(--SmartThemeQuoteColor, #6cf); color: var(--ntr-on-accent); }
      #cb_node.cb_right .cb_n_name { left: auto; right: 16px; }
      #cb_node .cb_n_text { max-height: var(--cbn-maxh, 28vh); overflow-y: auto; line-height: 1.5; }
      #cb_node .cb_n_nar .cb_n_text { font-style: italic; }
      #cb_node .cb_q { color: var(--SmartThemeQuoteColor, #6cf); }
      #cb_node .cb_n_arrow { position: absolute; left: 50%; bottom: 4px; font-size: 12px; animation: cbn_blink 1s infinite; pointer-events: none; }
      #cb_node .cb_n_ctrl { position: absolute; right: 8px; bottom: 3px; display: flex; align-items: center; gap: 2px; font-size: 11px; opacity: .75; }
      #cb_node .cb_n_ctrl button { background: none; border: none; color: inherit; cursor: pointer; padding: 2px 6px; font-size: 13px; }
      #cb_node .cb_n_count { cursor: pointer; border-radius: 4px; padding: 1px 3px; }
      #cb_node .cb_n_count:hover { background: var(--ntr-hover); }
      #cb_node .cb_n_count input { width: 3.5em; margin: 0 3px; padding: 0 3px; text-align: center; font: inherit; color: inherit;
        background: var(--ntr-well-deep); border: 1px solid var(--ntr-line-strong); border-radius: 4px; }
      @keyframes cbn_blink { 50% { opacity: .15; } }
      #cb_node_toggle.cb_on { color: var(--SmartThemeQuoteColor, #6cf); }
      #cb_node.cb_shape_round .cb_n_port { border-radius: 50%; }
      #cb_node.cb_shape_square .cb_n_port { border-radius: 0; }
      #cb_node.cb_shape_rect .cb_n_port { height: calc(var(--cbn-ps, 120px) * 1.5); }
      #ntr_loc { position: fixed; inset: 0; pointer-events: none; display: none; }
      #ntr_loc > div { position: absolute; inset: 0; background-size: cover; background-position: center; opacity: 0; transition: opacity .7s ease; }
      #ntr_stage { position: fixed; inset: 0; z-index: 2410; pointer-events: none; display: none; }
      .ntr_spr { position: absolute; bottom: 0; height: 100%; object-fit: contain; object-position: center bottom; transform-origin: center bottom; display: none; transition: filter .25s, opacity .25s; }
      .ntr_spr.ntr_dim { filter: brightness(.6); opacity: .9; }
      .cb_thumbbox.cb_wide { width: 64px; }
      #cb_node .cb_n_choices { position: absolute; left: 0; right: 0; bottom: calc(100% + 22px); display: none; flex-direction: column; align-items: center; gap: 8px; pointer-events: none; }
      #cb_node .cb_n_choice { pointer-events: auto; min-width: min(420px, 90%); max-width: 100%; padding: 10px 18px; border-radius: 10px; border: 2px solid var(--SmartThemeBorderColor, #555); background: rgb(from var(--SmartThemeBlurTintColor, #171717) r g b / .92); color: var(--SmartThemeBodyColor, #ddd); font: inherit; cursor: pointer; text-align: center; box-shadow: 0 4px 14px rgba(0,0,0,.5); transition: border-color .15s, transform .15s; animation: cbn_rise .25s ease both; }
      #cb_node .cb_n_choice:hover { border-color: var(--SmartThemeQuoteColor, #6cf); transform: translateY(-1px); }
      #cb_node .cb_n_choices.cb_old .cb_n_choice { opacity: .5; cursor: default; transform: none; }
      @keyframes cbn_rise { from { opacity: 0; transform: translateY(6px); } }
      #cb_node.cb_n_slim .cb_n_box { min-height: 0; padding: 8px 18px 24px; }
      #ntr_cg { position: fixed; left: 0; right: 0; top: 0; z-index: 2430; display: none; opacity: 0; transition: opacity .5s ease; background: #000; overflow: hidden; cursor: pointer; }
      #ntr_cg.ntr_on { opacity: 1; }
      #ntr_cg .ntr_cg_bg { position: absolute; inset: -40px; background-size: cover; background-position: center; filter: blur(22px) brightness(.55); }
      #ntr_cg img { position: relative; width: 100%; height: 100%; object-fit: contain; display: block; }
      #ntr_wx { position: fixed; inset: 0; z-index: 2415; pointer-events: none; display: none; overflow: hidden; }
      #ntr_wx.ntr_rain, #ntr_wx.ntr_snow { display: block; }
      #ntr_wx.ntr_rain { background: rgba(15, 25, 45, .18); }
      #ntr_wx::before, #ntr_wx::after { content: ''; position: absolute; inset: -25%; background-repeat: repeat; }
      #ntr_wx.ntr_rain::before { background-image: url("${WX.r1}"); background-size: 220px 220px; transform: rotate(12deg); animation: ntr_fall1 .45s linear infinite; }
      #ntr_wx.ntr_rain::after { background-image: url("${WX.r2}"); background-size: 300px 300px; transform: rotate(12deg); opacity: .6; animation: ntr_fall2 .7s linear infinite; }
      #ntr_wx.ntr_snow::before { background-image: url("${WX.s1}"); background-size: 260px 260px; animation: ntr_fall3 9s linear infinite, ntr_sway 4s ease-in-out infinite alternate; }
      #ntr_wx.ntr_snow::after { background-image: url("${WX.s2}"); background-size: 380px 380px; opacity: .7; animation: ntr_fall4 14s linear infinite, ntr_sway 6s ease-in-out infinite alternate-reverse; }
      @keyframes ntr_fall1 { to { background-position: 0 220px; } }
      @keyframes ntr_fall2 { to { background-position: 0 300px; } }
      @keyframes ntr_fall3 { to { background-position: 0 260px; } }
      @keyframes ntr_fall4 { to { background-position: 0 380px; } }
      @keyframes ntr_sway { from { transform: translateX(-24px); } to { transform: translateX(24px); } }
      #ntr_fx { position: fixed; inset: 0; z-index: 2460; pointer-events: none; opacity: 0; }
      #ntr_fx.ntr_fx_flash { background: #fff; animation: ntr_flash .5s ease-out; }
      #ntr_fx.ntr_fx_fade { background: #000; animation: ntr_fadeblack 1.6s ease-in-out; }
      @keyframes ntr_flash { from { opacity: .95; } to { opacity: 0; } }
      @keyframes ntr_fadeblack { 0% { opacity: 0; } 35%, 65% { opacity: 1; } 100% { opacity: 0; } }
      .ntr_shake { animation: ntr_shake .5s cubic-bezier(.36, .07, .19, .97); }
      @keyframes ntr_shake { 10%, 90% { transform: translate(-2px, 1px); } 20%, 80% { transform: translate(5px, -2px); } 30%, 50%, 70% { transform: translate(-8px, 3px); } 40%, 60% { transform: translate(8px, -3px); } }
      ${still(['#ntr_wx.ntr_rain::before', '#ntr_wx.ntr_rain::after', '#ntr_wx.ntr_snow::before', '#ntr_wx.ntr_snow::after', '#cb_node .cb_n_arrow', '#cb_node .cb_n_choice', '.ntr_shake'])}
      .cb_g_row { margin: 10px 0; }
      .cb_g_line { display: flex; align-items: center; gap: 6px; }
      .cb_g_line .cb_code { flex: 1; min-width: 0; margin-top: 4px; user-select: all; word-break: break-word; }
      .cb_g_line .menu_button { margin: 4px 0 0; padding: 4px 8px; }
      .cb_art_row { display: flex; align-items: center; gap: 6px; margin-top: 6px; }
      .cb_art_row .menu_button { margin: 0; padding: 4px 8px; }
      @media (pointer: coarse) { .cb_art_row .menu_button, .cb_g_line .menu_button { min-width: 40px; min-height: 40px; } }
  `;

  // Kept while the extension is off: the menu still opens then, and the other rules only style VN parts, which are hidden.
  function applyStyle() {
    let el = document.getElementById('ntr_vn_style');
    if (!el) { el = document.createElement('style'); el.id = 'ntr_vn_style'; document.head.appendChild(el); }
    el.textContent = VN_CSS + (A.isOn() && settings().nodeEnabled ? '\n      #chat .mes { display: none !important; }\n' : '');
  }

  // follow: on the newest message, so new ones are followed. shown: the chat message on screen, found again after earlier
  // ones are deleted. md: the chat data whose saved message was read (see keepPlace).
  const node = { list: [], pos: 0, segs: [], i: 0, typer: null, auto: null, typing: false, finish: null, waitId: null, cont: null, contJump: null, follow: true, shown: null, md: null };
  let nodeQ = null, nodeQAnim = false;
  const reEsc = (x) => String(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Scene tags inside the narrator delimiters: [[Location:X]], [[Choice: A | B]], [[Effect:X]], [[Weather:X]], [[CG:X]], [[Enter:X | left]], [[Exit:X]]
  function dirKind(word, s) {
    const w = lc(word);
    if (!w) return null;
    if (w === lc(s.locWord)) return 'loc';
    if (w === lc(s.choiceWord)) return 'choice';
    if (w === lc(s.effectWord)) return 'fx';
    if (w === lc(s.weatherWord)) return 'wx';
    if (w === lc(s.cgWord)) return 'cg';
    if (w === lc(s.enterWord)) return 'enter';
    if (w === lc(s.exitWord)) return 'exit';
    return null;
  }
  function dirOf(inner, s) {
    const str = String(inner).trim();
    const i = str.indexOf(':');
    if (i <= 0) return null;
    const kind = dirKind(str.slice(0, i), s);
    const arg = str.slice(i + 1).trim();
    return kind && arg ? { kind, arg } : null;
  }
  // Loose keyword match: "Heavy rain" still counts as rain.
  function wordKind(name, pairs) {
    const n = normLoc(name);
    if (!n) return null;
    const words = n.split(' ');
    for (const [k, w] of pairs) { const nw = normLoc(w); if (nw && (n === nw || words.includes(nw))) return k; }
    return null;
  }
  const fxKind = (name, s) => wordKind(name, [['shake', s.fxShake], ['flash', s.fxFlash], ['fade', s.fxFade]]);
  const wxKind = (name, s) => wordKind(name, [['clear', s.wxClear], ['rain', s.wxRain], ['snow', s.wxSnow]]);
  // A leading "/" would make SillyTavern run the choice as a slash command, so it's dropped.
  const noSlash = (x) => String(x).replace(/^[\s/]+/, '');
  const splitChoices = (arg, s) => String(arg).split(s.choiceSep || '|').map((x) => noSlash(x).trim()).filter(Boolean).slice(0, 8);

  // No tags at all: quoted text is the speaker's line, everything else is narration.
  function splitUntagged(raw, name) {
    const out = [];
    const nar = (t) => { t = t.trim(); if (t && /[\p{L}\p{N}]/u.test(t)) out.push({ kind: 'narrator', name: '', emo: '', text: t }); };
    for (const para of String(raw).split(/\n\s*\n/)) {
      const re = /"[^"\n]+"|\u201C[^\u201D\n]+\u201D/g;
      let last = 0, m;
      while ((m = re.exec(para))) {
        nar(para.slice(last, m.index));
        out.push({ kind: 'char', name, emo: '', text: m[0] });
        last = re.lastIndex;
      }
      nar(para.slice(last));
    }
    return out;
  }

  function parseSegments(raw, fallbackName, leadAsSpeaker) {
    const s = settings();
    // [[Emotion:X]] (cast.js) sets the emotion of the message's own character. It's taken out here and goes on their lines.
    const msgEmo = C.stripEmo(String(raw || ''));
    raw = msgEmo.text;
    const re = tagRe(s);
    const nar = String(s.narratorWord).trim().toLowerCase();
    const segs = [];
    let last = 0, cur = null, m, sawTag = false;
    const lead = (text) => (leadAsSpeaker ? { kind: 'char', name: fallbackName || '', emo: '', text } : { kind: 'narrator', name: '', emo: '', text });
    const close = (end) => {
      const text = raw.slice(last, end).trim();
      if (!text) return;
      if (cur) { cur.text = text; segs.push(cur); } else segs.push(lead(text));
    };
    while ((m = re.exec(raw))) {
      sawTag = true;
      close(m.index);
      last = re.lastIndex;
      if (m[1] !== undefined) {
        const t = splitTag(m[1], s);
        cur = { kind: 'char', name: t.name, emo: t.emo };
        continue;
      }
      const dir = dirOf(m[2], s);
      if (dir) {
        segs.push({ kind: dir.kind, name: dir.arg, emo: '', text: '' });
        // A scene tag inside someone's line doesn't end it: the rest of the line is still theirs.
        if (cur && cur.text !== undefined) cur = { kind: cur.kind, name: cur.name, emo: cur.emo };
        continue;
      }
      const t = splitTag(m[2], s);
      cur = { kind: 'narrator', name: t.name.toLowerCase() === nar ? '' : t.name, emo: '' };
    }
    if (sawTag) close(raw.length);
    else if (raw.trim()) {
      if (s.nodeSplitUntagged) segs.push(...splitUntagged(raw, fallbackName || ''));
      else segs.push({ kind: 'char', name: fallbackName || '', emo: '', text: raw.trim() });
    }
    if (msgEmo.emo) for (const g of segs) if (g.kind === 'char' && !g.emo && lc(g.name) === lc(fallbackName)) g.emo = msgEmo.emo;
    return segs;
  }

  function nodeFmt(t) {
    let h = escapeHTML(String(t).trim());
    h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
    h = h.replace(/&quot;(.+?)&quot;/g, '<span class="cb_q">&quot;$1&quot;</span>');
    h = h.replace(/\u201C(.+?)\u201D/g, '<span class="cb_q">\u201C$1\u201D</span>');
    return h.replace(/\n/g, '<br>');
  }

  // Normal chat view: ((Rafe%%Sad)) -> ((Rafe)), and location, effect, weather, CG, enter and exit tags disappear.
  // `els` limits it to some messages' .mes_text (the chat watcher passes the ones that just changed).
  // Stage sprites: the speaker's full body or face (cast.js), else the silhouette.
  function spriteSrc(name, emoName) {
    return C.bodySrc(name, emoName) || silhouetteFor(String(name || '').trim().toLowerCase());
  }

  function silhouetteFor(key) {
    const s = settings();
    if (s.artSprite === 'custom') return s.artSpriteImg || null;
    if (s.artSprite !== 'builtin' || !key) return null;
    const h = hueOf(key);
    return silCache[h] || (silCache[h] = silhouette(h));
  }
  function artBgUrl() {
    const s = settings();
    return s.artBg === 'custom' ? (s.artBgImg || '') : artUri(s.artBg);
  }

  // Every tag with the user's own delimiters and real names, so people can see exactly what to write in a card.
  function guideRows(s) {
    const v = V();
    const loc = (v.locations.find((l) => l.name) || {}).name || 'Place';
    const cg = ((v.cgs || []).find((g) => g.name) || {}).name || 'Scene';
    const L = A.emoSet();
    const emo = (L.emotions.find((e) => e.id !== L.emoDefault) || L.emotions[0] || {}).name || 'Happy';
    const spk = (C.speakers().find((x) => x.name !== ctx().name1) || {}).name || 'Name';
    const no = s.delimNarOpen, nc = s.delimNarClose;
    const rows = [
      { label: 'A Character Speaks', code: `${s.delimSpkOpen}${spk}${s.delimEmo}${emo}${s.delimSpkClose}: "Hello there."`, hint: `The emotion after ${s.delimEmo} is optional. Everything after the tag is the line.` },
      { label: 'Narration', code: `${no}${s.narratorWord}${nc}: The room was quiet.`, hint: 'No portrait is shown for the narrator.' },
      { label: 'Change the Background', code: `${no}${s.locWord}:${loc}${nc}`, hint: 'Matches a name under Locations and stays until the next one.' },
      { label: 'Emotion for the Whole Message', code: `${no}${s.emoWord}:${emo}${nc}`, hint: 'For the message\'s writer, where no speaker tag gives one. Also works with Visual Novel Mode off.' },
    ];
    if (s.nodeChoices) rows.push({ label: 'Offer Choices', code: `${no}${s.choiceWord}: Stay ${s.choiceSep} Leave${nc}`, hint: `Put it at the end of a message. Separate the options with ${s.choiceSep}.` });
    if (s.nodeEffects) {
      rows.push({ label: 'Screen Effect', code: `${no}${s.effectWord}:${s.fxShake}${nc}`, hint: `Happens once. Also ${s.fxFlash} and ${s.fxFade}. Shake and flash are skipped with Reduced Motion.` });
      rows.push({ label: 'Weather', code: `${no}${s.weatherWord}:${s.wxRain}${nc}`, hint: `Stays until it changes. Also ${s.wxSnow} and ${s.wxClear}.` });
    }
    if (s.nodeCG) rows.push({ label: 'Show an Illustration', code: `${no}${s.cgWord}:${cg}${nc}`, hint: 'Matches a name under CG Scenes.' });
    if (s.nodeSprites) {
      rows.push({ label: 'A Character Enters', code: `${no}${s.enterWord}:${spk}${nc}`, hint: `Shows their sprite before they speak. Add | left, | center or | right after the name to place it. Once a chat uses ${s.enterWord} or ${s.exitWord}, sprites stay until they exit.` });
      rows.push({ label: 'A Character Leaves', code: `${no}${s.exitWord}:${spk}${nc}`, hint: `Removes their sprite from the next line on. ${no}${s.exitWord}:All${nc} clears the stage.` });
    }
    const sample = [rows[2], rows[1], rows[0], ...rows.slice(4, 5)].filter(Boolean).map((r) => r.code).join('\n');
    return { rows, sample };
  }

  function guideHtml(s) {
    const { rows, sample } = guideRows(s);
    return rows.map((r) => `<div class="cb_g_row"><strong>${escapeHTML(r.label)}</strong>
        <div class="cb_g_line"><code class="cb_code">${escapeHTML(r.code)}</code><button type="button" class="menu_button m_g_cp" data-c="${escapeHTML(r.code)}" title="Copy" aria-label="Copy ${escapeHTML(r.label)}"><i class="fa-solid fa-copy"></i></button></div>
        <div class="cb_hint">${escapeHTML(r.hint)}</div></div>`).join('')
      + `<div class="cb_g_row"><strong>Example for a First Message</strong>
        <pre class="cb_code" style="margin:4px 0;">${escapeHTML(sample)}</pre>
        <button type="button" class="menu_button m_g_cp" data-c="${escapeHTML(sample)}"><i class="fa-solid fa-copy"></i> Copy Example</button></div>`;
  }

  function buildPrompt(s) {
    const sp = `${s.delimSpkOpen}Name${s.delimEmo}Emotion${s.delimSpkClose}`;
    const nr = `${s.delimNarOpen}${s.narratorWord}${s.delimNarClose}`;
    let p = `Format every line as ${sp}: for characters or ${nr}: for narration. Emotions: ${A.emoSet().emotions.map((e) => e.name).join(', ')}.`;
    const v = V();
    const locs = v.locations.map((l) => l.name).filter(Boolean);
    if (locs.length || v.locDefault) p += ` Mark scene changes with ${s.delimNarOpen}${s.locWord}:Name${s.delimNarClose}${locs.length ? ' using: ' + locs.join(', ') : ''}.`;
    const no = s.delimNarOpen, nc = s.delimNarClose;
    if (s.nodeChoices) p += ` When the user faces a decision, end with ${no}${s.choiceWord}: A ${s.choiceSep} B${nc}.`;
    if (s.nodeEffects) p += ` Optional: ${no}${s.effectWord}:${s.fxShake}${nc}, ${s.fxFlash} or ${s.fxFade} for impact; ${no}${s.weatherWord}:${s.wxRain}${nc}, ${s.wxSnow} or ${s.wxClear} (stays until changed).`;
    const cgs = (v.cgs || []).filter((x) => x.name && x.url).map((x) => x.name);
    if (s.nodeCG && cgs.length) p += ` Show an illustration with ${no}${s.cgWord}:Name${nc} using: ${cgs.join(', ')}.`;
    if (s.nodeSprites) p += ` Mark arrivals and departures with ${no}${s.enterWord}:Name${nc} and ${no}${s.exitWord}:Name${nc}.`;
    if (s.nodeUserMsgs) p += ' User messages follow the same format.';
    return p;
  }

  function copyText(text, msg = 'Copied') {
    const done = () => toastr.success(msg, 'Visual Novel');
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toastr.error('Could not copy. Select the text and copy it yourself.', 'Visual Novel'); }
      ta.remove();
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done).catch(fallback);
    else fallback();
  }

  // Menu sub-sections that live in their own lazy-loaded files (map.js, opening.js).
  const SUB_LABEL = { map: 'Maps', opening: 'Opening Video' };
  const SUB_ICON = { map: 'fa-map', opening: 'fa-clapperboard' };
  function subSection(name, sec, title, s) {
    const m = window.NTR[name];
    if (m) {
      try { return m.sectionHtml(s); } catch (e) { console.error(`[NTR] ${name} menu crashed`, e); }
    }
    const err = A.moduleError ? A.moduleError(name) : '';
    const off = name === 'map' && !s.nodeMaps;
    const toggle = name === 'map' ? `<label class="checkbox_label"><input type="checkbox" id="m_map_on" ${s.nodeMaps ? 'checked' : ''}><span>Show Maps</span></label>` : '';
    const msg = err ? `${SUB_LABEL[name]} failed to load: ${err}` : off ? 'Its settings appear here once it\'s switched on.' : 'Loading...';
    // The menu loads it itself, so its settings are there in any Reader Mode style, not only once Visual Novel plays.
    if (!err && !off && A.isOn()) loadSub(name);
    return `${subHead(sec, title, SUB_ICON[name])}<div class="cb_collapse_content" data-ntr-wait="${name}">${toggle}<div class="cb_hint">${escapeHTML(msg)}</div></div>`;
  }

  function loadSub(name, retry = false) {
    if (!A.loadModule) return Promise.resolve(null);
    return A.loadModule(name, retry).then((m) => {
      // Only its part of an open menu is drawn again, heading included (see fillIn in index.js).
      if (m) A.fillIn(name, (s) => m.sectionHtml(s), m.bind, { head: true });
      return m;
    });
  }

  function loadSubs() {
    const s = settings();
    if (!(A.isOn() && s.nodeEnabled)) return;
    loadSub('opening');
    if (s.nodeMaps) loadSub('map');
  }

  // Visual Novel's settings, in the Visual Novel part of the Reader Mode page (index.js puts them there).
  function nodeSectionHtml(s) {
    // vn.js keeps its own slider numbers (see CLAUDE.md); the row is laid out like ovSlider's.
    const sl = (id, key, label, unit, min, max, step) => ovLabel(label, `<div class="cb_row"><input type="range" class="m_n_sl" data-key="${key}" data-id="${id}" min="${min}" max="${max}" step="${step}" value="${s[key]}" style="flex:1;"><span style="min-width:60px;text-align:right;"><span id="m_n_${id}val" class="ntr_slval">${s[key]}</span>${unit}</span></div>`);
    const dim = (id, on, inner) => `<div id="${id}" class="${on ? '' : 'cb_dim'}">${inner}</div>`;
    const ck = (id, on, label) => `<label class="checkbox_label"><input type="checkbox" id="${id}" ${on ? 'checked' : ''}><span>${label}</span></label>`;
    const tg = (word, arg) => escapeHTML(`${s.delimNarOpen}${word}:${arg}${s.delimNarClose}`);
    const artBtns = (k, id) => `<span id="${id}" class="cb_art_btns" style="display:flex;gap:4px;">
                  <button class="menu_button m_art_up" data-k="${k}" title="Upload" aria-label="Upload"><i class="fa-solid fa-upload"></i></button>
                  <button class="menu_button m_art_url" data-k="${k}" title="Use a link" aria-label="Use a link"><i class="fa-solid fa-link"></i></button>
                  <button class="menu_button m_art_clr" data-k="${k}" title="Remove picture" aria-label="Remove picture"><i class="fa-solid fa-rotate-left"></i></button></span>`;
    return `
            <div class="cb_hint ntr_keepon" style="margin: 0 0 10px;">Emotions, speakers, faces and full bodies are set on the <a href="#" class="m_n_tocast">Avatars</a> page, under Emotions.</div>

            ${subHead('vn_guide', 'How to Write Your Card', 'fa-circle-question')}
            <div class="cb_collapse_content">
              <div class="cb_hint">Visual Novel Mode reads these tags in messages. The examples use your current symbols and names.</div>
              <div id="m_g_body"></div>
              <button type="button" class="menu_button m_g_goto" style="margin-top:8px;"><i class="fa-solid fa-hashtag"></i> Edit Tags and Delimiters</button>
            </div>

            ${subHead('vn_play', 'Playback', 'fa-forward-step')}
            <div class="cb_collapse_content">
              ${ck('m_n_user', s.nodeUserMsgs, 'Include My Messages')}
              <div class="cb_hint">Yours plays when you send, then the reply takes over.</div>
              ${ck('m_n_split', s.nodeSplitUntagged, 'Play Untagged Messages')}
              <div class="cb_hint">Quotes become the character's lines; the rest is narration.</div>
              ${ck('m_n_tw', s.nodeTypewriter, 'Typewriter Effect')}
              ${dim('m_n_spwrap', s.nodeTypewriter, sl('sp', 'nodeSpeed', 'Delay per Character', 'ms', 5, 80, 1))}
              <div style="margin-top:8px;">${ck('m_n_auto', s.nodeAuto, 'Auto-Advance')}</div>
              ${dim('m_n_adwrap', s.nodeAuto, sl('ad', 'nodeAutoDelay', 'Auto-Advance Wait', 'ms', 500, 8000, 250))}
            </div>

            ${subHead('vn_look', 'Look', 'fa-eye')}
            <div class="cb_collapse_content">
              <div class="cb_sub">Box</div>
              ${sl('op', 'nodeOpacity', 'Box Opacity', '%', 30, 100, 1)}
              ${sl('bw', 'nodeBoxWidth', 'Box Width', '%', 40, 100, 1)}
              <div class="cb_hint">Of the chat column's width.</div>
              ${sl('bmin', 'nodeBoxMinH', 'Box Min Height', 'px', 40, 300, 5)}
              ${sl('bmax', 'nodeBoxMaxH', 'Box Max Height', 'vh', 10, 70, 1)}
              ${sl('lift', 'nodeBoxLift', 'Lift Above Send Bar', 'px', 0, 400, 2)}
              ${sl('fs', 'nodeTextScale', 'Text Size', '%', 70, 180, 5)}
              <div class="cb_sub">Portrait</div>
              ${ck('m_n_pbox', s.nodePortraitBox, 'Show Portrait in Box')}
              ${dim('m_n_pwrap', s.nodePortraitBox, sl('ps', 'nodePortrait', 'Portrait Size', 'px', 60, 240, 5)
                + ovLabel('Portrait Shape', pills('nshape', [['rounded', 'Rounded'], ['round', 'Circle'], ['square', 'Square'], ['rect', 'Tall']], s.nodeShape)))}
              <div class="cb_sub">Sprites</div>
              ${ck('m_n_spr', s.nodeSprites, 'Show Sprites')}
              ${dim('m_n_swrap', s.nodeSprites, sl('ss', 'nodeSpriteScale', 'Sprite Size', '%', 30, 200, 5))}
              <div class="cb_hint" style="margin-bottom:0;">Sprites are full bodies, else faces, else Default Art. Stage Keeps Main Face is on the Avatars page. The last three speakers stay; those not talking dim.</div>
            </div>

            ${subHead('vn_art', 'Default Art', 'fa-paintbrush')}
            <div class="cb_collapse_content">
              <div class="cb_hint">Used when a scene or speaker has no picture of its own.</div>
              ${ovLabel('Background', pills('artbg', [['none', 'ST\'s Own'], ['dusk', 'Dusk'], ['night', 'Night City'], ['room', 'Room'], ['forest', 'Forest'], ['custom', 'Custom']], s.artBg))}
              <div class="cb_art_row"><div id="m_art_bgprev" class="cb_thumbbox cb_wide"></div><span class="cb_spk_name"><small>A character's Default Background comes first.</small></span>${artBtns('artBgImg', 'm_art_bgbtns')}</div>
              ${ovLabel('Sprite', pills('artspr', [['builtin', 'Silhouette'], ['custom', 'Custom'], ['none', 'None']], s.artSprite))}
              <div class="cb_art_row"><div id="m_art_sprprev" class="cb_thumbbox"></div><span class="cb_spk_name"><small>Tinted per character.</small></span>${artBtns('artSpriteImg', 'm_art_sprbtns')}</div>
              <input type="file" id="m_art_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
            </div>

            ${subHead('vn_scene', 'Choices, Effects and Weather', 'fa-cloud-bolt')}
            <div class="cb_collapse_content">
              ${ck('m_n_choices', s.nodeChoices, 'Choice Buttons')}
              <div id="m_n_choices_body" class="${s.nodeChoices ? '' : 'cb_dim'}">
                <div class="cb_hint">${tg(s.choiceWord, ` A ${s.choiceSep} B ${s.choiceSep} C`)} shows buttons above the box. Picking one puts it in the input box.</div>
                ${ck('m_n_csend', s.choiceSend, 'Send Right Away')}
              </div>
              <div style="margin-top:8px;">${ck('m_n_fx', s.nodeEffects, 'Effects and Weather')}</div>
            </div>

            ${subHead('vn_loc', 'Locations ' + TAG, 'fa-mountain-sun')}
            <div class="cb_collapse_content">
              <div class="cb_hint">Names match <code>${escapeHTML(s.delimNarOpen + s.locWord)}:Name${escapeHTML(s.delimNarClose)}</code> ignoring case, punctuation and a leading "The". The background stays until the next location. Unmatched names use Default Background, then Default Art.</div>
              <div id="m_l_list"></div>
              <div class="cb_row" style="margin-top:8px;">
                <input type="text" id="m_l_new" class="text_pole" placeholder="New Location" aria-label="New Location" style="flex:1;margin:0;">
                <button id="m_l_add" class="menu_button" style="margin:0;"><i class="fa-solid fa-plus"></i> Add</button>
              </div>
              <input type="file" id="m_l_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
            </div>

            ${subHead('vn_cg', 'CG Scenes ' + TAG, 'fa-image')}
            <div class="cb_collapse_content">
              ${ck('m_n_cg', s.nodeCG, 'Show CG Scenes')}
              <div id="m_c_body" class="${s.nodeCG ? '' : 'cb_dim'}">
                <div class="cb_hint">${tg(s.cgWord, 'Name')} fills the screen until the next line. Names match like Locations.</div>
                <div id="m_c_list"></div>
                <div class="cb_row" style="margin-top:8px;">
                  <input type="text" id="m_c_new" class="text_pole" placeholder="New CG" aria-label="New CG" style="flex:1;margin:0;">
                  <button id="m_c_add" class="menu_button" style="margin:0;"><i class="fa-solid fa-plus"></i> Add</button>
                </div>
              </div>
              <input type="file" id="m_c_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
            </div>

            ${subSection('map', 'vn_map', 'Maps ' + TAG, s)}
            ${subSection('opening', 'vn_open', 'Opening Video ' + TAG, s)}

            ${subHead('vn_prompt', 'Prompt for the Model', 'fa-scroll')}
            <div class="cb_collapse_content">
              ${ck('m_n_inj', s.nodeInject, 'Add to Every Request')}
              <div class="cb_hint">Sent with each message while Visual Novel Mode is on, with no extra calls. Built from your emotions, tags, this character's locations and CGs, and the scene features you have on.</div>
              <textarea id="m_p_text" class="text_pole" aria-label="Prompt" readonly rows="4" style="width:100%;resize:vertical;"></textarea>
              <button id="m_p_copy" class="menu_button" style="margin-top:6px;"><i class="fa-solid fa-copy"></i> Copy Prompt</button>
            </div>
    `;
  }

  // A change on the Avatars page (cast.js): redraw, and refresh the open menu's guide and prompt.
  let menuRefresh = null;
  C.onChange(() => {
    updateStage();
    if (menuRefresh && document.getElementById('m_g_body')) { menuRefresh(); return; }
    updateInjection();
    if (settings().nodeEnabled) nodeLoad({ animate: false });
  });

  function bindVN(overlay, s) {
    const refreshPrompt = () => { overlay.querySelector('#m_p_text').value = buildPrompt(s); };
    function renderGuide() {
      const box = overlay.querySelector('#m_g_body');
      if (!box) return;
      box.innerHTML = guideHtml(s);
      box.querySelectorAll('.m_g_cp').forEach((b) => { b.onclick = () => copyText(b.dataset.c); });
    }
    // Tags & Delimiters are on the Avatars page, under Emotions (cast.js): emotion tags work with Visual Novel Mode off too.
    const gotoDelims = (e) => {
      if (e) e.preventDefault();
      s.uiPage = 'pfp'; s.uiOpen.av_emo = true; s.uiOpen.av_tags = true; save();
      A.openMenu();
      setTimeout(() => document.querySelector('#cb_modal_overlay [data-sec="av_tags"]')?.scrollIntoView({ block: 'start' }), 60);
    };
    overlay.querySelectorAll('.m_g_goto').forEach((b) => { b.onclick = gotoDelims; });
    const refreshAll = () => { renderGuide(); refreshPrompt(); updateInjection(); if (s.nodeEnabled) nodeLoad({ animate: false }); };
    menuRefresh = refreshAll;
    overlay.querySelectorAll('.m_n_tocast').forEach((b) => {
      b.onclick = (e) => {
        e.preventDefault();
        s.uiPage = 'pfp'; s.uiOpen.av_emo = true; save();
        A.openMenu();
        setTimeout(() => document.querySelector('#cb_modal_overlay [data-sec="av_emo"]')?.scrollIntoView({ block: 'start' }), 60);
      };
    });

    const chk = (id, key, after) => { const el = overlay.querySelector(id); if (el) el.onchange = function() { s[key] = this.checked; save(); if (after) after(); }; };
    chk('#m_n_user', 'nodeUserMsgs', () => { refreshPrompt(); nodeLoad({ animate: false }); });
    const dimIf = (sel, on) => overlay.querySelector(sel)?.classList.toggle('cb_dim', !on);
    chk('#m_n_tw', 'nodeTypewriter', () => dimIf('#m_n_spwrap', s.nodeTypewriter));
    chk('#m_n_pbox', 'nodePortraitBox', () => { dimIf('#m_n_pwrap', s.nodePortraitBox); if (s.nodeEnabled) nodeShow(false); });
    chk('#m_n_spr', 'nodeSprites', () => { dimIf('#m_n_swrap', s.nodeSprites); updateStage(); });
    chk('#m_n_inj', 'nodeInject', updateInjection);
    chk('#m_n_auto', 'nodeAuto', () => dimIf('#m_n_adwrap', s.nodeAuto));
    chk('#m_n_split', 'nodeSplitUntagged', () => { if (s.nodeEnabled) nodeLoad({ animate: false }); });
    chk('#m_n_choices', 'nodeChoices', () => { dimIf('#m_n_choices_body', s.nodeChoices); refreshAll(); });
    chk('#m_n_csend', 'choiceSend');
    chk('#m_n_fx', 'nodeEffects', refreshAll);
    chk('#m_n_cg', 'nodeCG', () => { dimIf('#m_c_body', s.nodeCG); refreshAll(); });
    const mapOn = overlay.querySelector('#m_map_on');
    if (mapOn) mapOn.onchange = () => { s.nodeMaps = mapOn.checked; save(); syncMapBtn(); if (s.nodeMaps) loadSub('map', true); else A.openMenu(); };

    overlay.querySelectorAll('.m_n_sl').forEach((sl) => {
      sl.oninput = function() {
        s[this.dataset.key] = Number(this.value);
        overlay.querySelector(`#m_n_${this.dataset.id}val`).textContent = this.value;
        nodeApplyLook();
        placeNode();
        updateStage();
      };
      sl.onchange = save;
    });
    onPills(overlay, 'nshape', (v) => { s.nodeShape = v; save(); nodeApplyLook(); });

    // Prompt
    overlay.querySelector('#m_p_copy').onclick = () => copyText(overlay.querySelector('#m_p_text').value, 'Prompt copied');

    // Locations and CG Scenes share one list (see NAMED). Returns the list's render function.
    const namedList = (L) => {
      const file = overlay.querySelector(`#m_${L.c}_file`);
      let pending = null;
      const render = () => {
        const box = overlay.querySelector(`#m_${L.c}_list`);
        box.innerHTML = namedRowsHtml(L);
        const v = V();
        const find = (id) => v[L.key].find((x) => x.id === id);
        box.querySelectorAll(`.m_${L.c}_name`).forEach((inp) => {
          inp.onchange = () => {
            const x = find(inp.dataset.id);
            const nm = inp.value.trim();
            if (!x) return;
            if (!nm || v[L.key].some((y) => y !== x && normLoc(y.name) === normLoc(nm))) {
              toastr.warning(`${cap(L.name)} names need to be unique and not empty.`, 'Visual Novel');
              inp.value = x.name;
              return;
            }
            x.name = nm; save(); refreshAll();
          };
        });
        box.querySelectorAll(`.m_${L.c}_up`).forEach((b) => { b.onclick = () => { pending = b.dataset.id; file.click(); }; });
        box.querySelectorAll(`.m_${L.c}_url`).forEach((b) => {
          b.onclick = async () => {
            const url = await askImageUrl(cap(L.pic), b);
            if (url) setImage(b.dataset.id, url);
          };
        });
        box.querySelectorAll(`.m_${L.c}_clr`).forEach((b) => {
          b.onclick = async () => {
            if (!(await A.askYes(b, REMOVE_PIC, 'Remove', { danger: true }))) return;
            let old;
            if (b.dataset.id === DEF_ID) { old = v[L.def.key]; v[L.def.key] = ''; }
            else { const x = find(b.dataset.id); if (!x) return; old = x.url; x.url = ''; }
            save(); render(); refreshAll();
            A.deleteFileIfUnused(old);
          };
        });
        box.querySelectorAll(`.m_${L.c}_del`).forEach((b) => {
          b.onclick = async () => {
            const x = find(b.dataset.id);
            const pinned = L.key === 'locations' && (v.maps || []).some((mp) => (mp.pins || []).some((p) => p.loc === x?.id));
            if (!x || !(await A.askYes(b, `Delete the ${L.name} "${x.name}"${x.url ? ` and its ${L.picDel}` : ''}?${pinned ? ' Map pins linked to it are removed or unlinked.' : ''}`, 'Delete', { danger: true }))) return;
            v[L.key] = v[L.key].filter((y) => y !== x);
            if (L.onDelete) L.onDelete(v, x);
            save(); render(); refreshAll();
            A.deleteFileIfUnused(x.url);
          };
        });
      };
      const setImage = (id, url) => {
        const v = V();
        let old;
        if (id === DEF_ID) { old = v[L.def.key]; v[L.def.key] = url; }
        else { const x = v[L.key].find((y) => y.id === id); if (x) { old = x.url; x.url = url; } }
        save(); render(); refreshAll();
        A.deleteFileIfUnused(old);
      };
      file.onchange = async () => {
        if (!file.files.length || !pending) return;
        try {
          const id = pending, url = await A.uploadHere(() => uploadImage(file.files[0], L.prefix, { max: 2560 }));
          if (url) setImage(id, url);
        } catch (e) {
          console.error(`[NTR vn ${L.name} upload]`, e);
          toastr.error(e.message || L.fail, 'Visual Novel');
        }
        file.value = '';
      };
      const add = () => {
        const inp = overlay.querySelector(`#m_${L.c}_new`);
        const nm = inp.value.trim();
        if (!nm) { toastr.info('Type a name first.', 'Visual Novel'); inp.focus(); return; }
        if (!A.store()) { toastr.warning(`Open a character chat first. ${L.names} are saved per character.`, 'Visual Novel'); return; }
        const v = V();
        if (v[L.key].some((x) => normLoc(x.name) === normLoc(nm))) { toastr.warning(`That ${L.name} already exists.`, 'Visual Novel'); return; }
        v[L.key].push({ id: newId(L.idp), name: nm, url: '' });
        inp.value = '';
        save(); render(); refreshAll();
      };
      overlay.querySelector(`#m_${L.c}_add`).onclick = add;
      overlay.querySelector(`#m_${L.c}_new`).onkeydown = (e) => { if (e.key === 'Enter') add(); };
      return render;
    };
    const renderLoc = namedList(NAMED.loc);
    const renderCg = namedList(NAMED.cg);

    // Default art
    const artFile = overlay.querySelector('#m_art_file');
    let artPending = null;
    const thumb = (src, icon) => (src ? `<img src="${escapeHTML(src)}" alt="">` : `<i class="fa-solid ${icon}"></i>`);
    const renderArt = () => {
      overlay.querySelector('#m_art_bgprev').innerHTML = thumb(artBgUrl(), 'fa-image');
      overlay.querySelector('#m_art_sprprev').innerHTML = thumb(silhouetteFor('preview'), 'fa-user');
      overlay.querySelector('#m_art_bgbtns').style.display = s.artBg === 'custom' ? 'flex' : 'none';
      overlay.querySelector('#m_art_sprbtns').style.display = s.artSprite === 'custom' ? 'flex' : 'none';
      overlay.querySelectorAll('.m_art_clr').forEach((b) => { b.disabled = !s[b.dataset.k]; });
    };
    onPills(overlay, 'artbg', (v) => { s.artBg = v; save(); renderArt(); refreshAll(); });
    onPills(overlay, 'artspr', (v) => { s.artSprite = v; save(); renderArt(); updateStage(); });
    overlay.querySelectorAll('.m_art_up').forEach((b) => { b.onclick = () => { artPending = b.dataset.k; artFile.click(); }; });
    const setArtImage = (k, url) => {
      const old = s[k];
      s[k] = url;
      save(); renderArt(); refreshAll(); updateStage();
      A.deleteFileIfUnused(old);
    };
    overlay.querySelectorAll('.m_art_url').forEach((b) => {
      b.onclick = async () => {
        const url = await askImageUrl(b.dataset.k === 'artBgImg' ? 'Default Background' : 'Default Sprite', b, false);
        if (url) setArtImage(b.dataset.k, url);
      };
    });
    overlay.querySelectorAll('.m_art_clr').forEach((b) => {
      b.onclick = async () => {
        if (!(await A.askYes(b.closest('.cb_art_row'), REMOVE_PIC, 'Remove', { danger: true }))) return;
        const k = b.dataset.k;
        // Its pill may have left Custom while the question was open.
        if (s[k === 'artBgImg' ? 'artBg' : 'artSprite'] !== 'custom') return;
        const old = s[k];
        s[k] = '';
        save(); renderArt(); refreshAll(); updateStage();
        A.deleteFileIfUnused(old);
      };
    });
    artFile.onchange = async () => {
      if (!artFile.files.length || !artPending) return;
      try {
        setArtImage(artPending, await uploadImage(artFile.files[0], 'vnart', { max: artPending === 'artBgImg' ? 2560 : 1600 }));
      } catch (e) {
        console.error('[NTR vn art upload]', e);
        toastr.error(e.message || 'Upload failed', 'Visual Novel');
      }
      artFile.value = '';
    };

    renderLoc(); renderCg(); renderArt(); refreshPrompt(); renderGuide();
    for (const name of ['map', 'opening']) {
      const m = window.NTR[name];
      if (m) { try { m.bind(overlay, s); } catch (e) { console.error(`[NTR] ${name} menu crashed`, e); } }
    }
  }

  // Locations and CG Scenes are the same kind of list: each entry is a name that tags match, plus a picture.
  // `c` is the letter in their element ids (m_l_*, m_c_*). Locations also have a Default background row.
  const DEF_ID = '__default__';
  // Removing a picture deletes its file, so it asks first, like a face on the Avatars page.
  const REMOVE_PIC = 'Remove this picture? Its file is deleted unless something else uses it.';
  const cap = (x) => x[0].toUpperCase() + x.slice(1);
  const NAMED = {
    loc: {
      c: 'l', key: 'locations', idp: 'loc', name: 'location', label: 'Location', names: 'Locations', pic: 'background', picDel: 'background', prefix: 'vnloc', fail: 'Background upload failed',
      def: { key: 'locDefault', label: 'Default Background', hint: 'When nothing matches' },
      // Map pins lose the deleted place, and go if they don't open another map either.
      onDelete: (v, l) => { for (const mp of v.maps || []) mp.pins = (mp.pins || []).filter((p) => p.loc !== l.id || p.map).map((p) => (p.loc === l.id ? { ...p, loc: '' } : p)); },
    },
    cg: { c: 'c', key: 'cgs', idp: 'cg', name: 'CG', label: 'CG', names: 'CGs', pic: 'illustration', picDel: 'picture', prefix: 'vncg', fail: 'CG upload failed' },
  };

  function namedRowsHtml(L) {
    if (!A.store()) return `<div class="cb_hint">Open a character chat first. ${L.names} are saved per character.</div>`;
    const v = V();
    const row = (id, name, url) => {
      const isDef = id === DEF_ID;
      return `<div class="cb_spk"><div class="cb_spk_row">
        <div class="cb_thumbbox cb_wide">${media(url) ? `<img src="${escapeHTML(media(url))}" alt="">` : '<i class="fa-solid fa-image"></i>'}</div>
        ${isDef
          ? `<span class="cb_spk_name"><strong>${L.def.label}</strong><small>${L.def.hint}</small></span>`
          : `<input type="text" class="text_pole m_${L.c}_name" data-id="${id}" aria-label="${L.label} Name" value="${escapeHTML(name)}" style="flex:1;min-width:0;margin:0;">`}
        <button class="menu_button m_${L.c}_up" data-id="${id}" title="Upload ${L.pic}" aria-label="Upload ${L.pic}"><i class="fa-solid fa-upload"></i></button>
        <button class="menu_button m_${L.c}_url" data-id="${id}" title="Use a link for the ${L.pic}" aria-label="Use a link for the ${L.pic}"><i class="fa-solid fa-link"></i></button>
        <button class="menu_button m_${L.c}_clr" data-id="${id}" title="Remove picture" aria-label="Remove picture" ${url ? '' : 'disabled'}><i class="fa-solid fa-rotate-left"></i></button>
        ${isDef ? '' : `<button class="menu_button danger_button m_${L.c}_del" data-id="${id}" title="Delete ${L.name}" aria-label="Delete ${L.name}"><i class="fa-solid fa-trash"></i></button>`}
      </div></div>`;
    };
    const rows = v[L.key].map((x) => row(escapeHTML(x.id), x.name, x.url));
    if (L.def) rows.unshift(row(DEF_ID, '', v[L.def.key]));
    return rows.length ? rows.join('') : `<div class="cb_hint">No ${L.names} yet.</div>`;
  }

  // ----- Dialogue box -----
  function placeNode() {
    const ov = document.getElementById('cb_node');
    if (!ov) return;
    const chat = document.getElementById('chat');
    const form = document.getElementById('form_sheld');
    const s = settings();
    if (chat) {
      const r = chat.getBoundingClientRect();
      const w = r.width * (s.nodeBoxWidth / 100);
      ov.style.left = (r.left + (r.width - w) / 2) + 'px';
      ov.style.width = w + 'px';
    }
    ov.style.bottom = (boxFloor(chat, form) + s.nodeBoxLift) + 'px';
    placeCG();
  }

  // How far above the bottom of the screen the dialogue box sits: just above the send bar. A Floating send bar
  // (Layout) can be anywhere, so the box sits at the bottom of the chat panel, or above the send bar where it
  // covers that bottom.
  function boxFloor(chat, form) {
    if (!A.sendFree?.() || !chat) return form ? window.innerHeight - form.getBoundingClientRect().top : 82;
    const c = chat.getBoundingClientRect();
    let edge = c.bottom;
    const f = form && form.getBoundingClientRect();
    if (f && f.height && f.left < c.right && f.right > c.left && f.top < c.bottom && f.top > c.top + c.height / 2) edge = f.top;
    return Math.max(0, window.innerHeight - edge);
  }

  // The chat panel or send bar moved (Layout): the dialogue box and sprites follow.
  function relayout() {
    if (!vnOn()) return;
    placeNode();
    updateStage();
  }

  function nodeApplyLook() {
    const ov = document.getElementById('cb_node');
    if (!ov) return;
    const s = settings();
    ov.style.setProperty('--cbn-op', s.nodeOpacity / 100);
    ov.style.setProperty('--cbn-ps', s.nodePortrait + 'px');
    ov.style.setProperty('--cbn-minh', s.nodeBoxMinH + 'px');
    ov.style.setProperty('--cbn-maxh', s.nodeBoxMaxH + 'vh');
    ov.style.setProperty('--cbn-fs', s.nodeTextScale / 100);
    for (const sh of ['round', 'square', 'rect']) ov.classList.toggle('cb_shape_' + sh, s.nodeShape === sh);
  }

  function ensureNodeLayer() {
    let ov = document.getElementById('cb_node');
    if (ov) return ov;
    ov = document.createElement('div');
    ov.id = 'cb_node';
    ov.innerHTML = `
      <div class="cb_n_port"><img alt=""><i class="fa-solid fa-user"></i></div>
      <div class="cb_n_box">
        <div class="cb_n_choices"></div>
        <div class="cb_n_name"></div>
        <div class="cb_n_text"></div>
        <div class="cb_n_arrow"></div>
        <div class="cb_n_ctrl">
          <button type="button" data-a="map" class="cb_n_mapbtn" title="Map" style="display:none;"><i class="fa-solid fa-map"></i></button>
          <button type="button" data-a="older" title="Older message (Page Up)"><i class="fa-solid fa-angles-left"></i></button>
          <button type="button" data-a="prev" title="Previous line"><i class="fa-solid fa-angle-left"></i></button>
          <span class="cb_n_count" role="button" tabindex="0" title="Click to type a message number"></span>
          <button type="button" data-a="next" title="Next line"><i class="fa-solid fa-angle-right"></i></button>
          <button type="button" data-a="newer" title="Newer message (Page Down)"><i class="fa-solid fa-angles-right"></i></button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    ov.querySelector('.cb_n_box').addEventListener('click', (e) => {
      if (e.target.closest('.cb_n_ctrl, .cb_n_choices')) return;
      nodeAdvance();
    });
    const acts = { older: () => nodeGoMsg(-1), newer: () => nodeGoMsg(1), prev: () => nodeStep(-1), next: () => nodeStep(1), map: openMap };
    ov.querySelectorAll('.cb_n_ctrl button').forEach((b) => {
      b.onclick = (e) => { e.stopPropagation(); acts[b.dataset.a](); };
    });
    const cnt = ov.querySelector('.cb_n_count');
    cnt.onclick = (e) => { e.stopPropagation(); askMsg(); };
    cnt.onkeydown = (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === cnt) { e.preventDefault(); askMsg(); } };
    const port = ov.querySelector('.cb_n_port');
    port.querySelector('img').onerror = () => port.classList.add('cb_noimg');
    nodeApplyLook();
    return ov;
  }

  // The box follows the screen and the chat panel while Visual Novel Mode is on. While it's off the box is hidden, so
  // nothing is watched.
  let layoutRo = null;
  function watchLayout(on) {
    if (on && !layoutRo) {
      window.addEventListener('resize', relayout);
      if (window.ResizeObserver) {
        layoutRo = new ResizeObserver(() => { if (vnOn()) placeNode(); });
        for (const id of ['chat', 'form_sheld']) { const el = document.getElementById(id); if (el) layoutRo.observe(el); }
      } else layoutRo = true;
    } else if (!on && layoutRo) {
      window.removeEventListener('resize', relayout);
      layoutRo.disconnect?.();
      layoutRo = null;
    }
  }

  function nodeStopTyping() {
    clearInterval(node.typer); node.typer = null;
    clearTimeout(node.auto); node.auto = null;
    node.typing = false; node.finish = null;
  }

  // `shown` characters appear at once and typing goes on from there (a Continue, see nodeContinued).
  function typeInto(el, html, speed, done, shown = 0) {
    el.innerHTML = html;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const items = [];
    let n;
    while ((n = walker.nextNode())) { items.push({ n, t: n.nodeValue }); n.nodeValue = ''; }
    let ii = 0, ci = 0;
    for (let left = shown; left > 0 && ii < items.length;) {
      const take = Math.min(left, items[ii].t.length - ci);
      ci += take; left -= take;
      items[ii].n.nodeValue = items[ii].t.slice(0, ci);
      if (ci >= items[ii].t.length) { ii++; ci = 0; }
    }
    node.typing = true;
    const finish = () => {
      clearInterval(node.typer); node.typer = null;
      items.forEach((o) => { o.n.nodeValue = o.t; });
      done();
    };
    node.finish = finish;
    node.typer = setInterval(() => {
      while (ii < items.length && ci >= items[ii].t.length) { ii++; ci = 0; }
      if (ii >= items.length) { finish(); return; }
      ci++;
      items[ii].n.nodeValue = items[ii].t.slice(0, ci);
      el.scrollTop = el.scrollHeight;
    }, speed);
  }

  // Marks a part as just shown, for looks that play once when it appears (Text Formatting's Shimmer). Taking the mark
  // off and putting it back starts them over.
  function justShown(el) {
    el.classList.remove('cb_shown');
    void el.offsetWidth;
    el.classList.add('cb_shown');
  }

  function nodeShow(animate, shown = 0) {
    const s = settings();
    const ov = ensureNodeLayer();
    nodeStopTyping();
    renderChoices(null);
    syncMapBtn();
    const seg = node.segs[node.i];
    if (!seg) { ov.style.display = 'none'; setLocation(node.endLoc); setWeather(node.endWx); setCG(null); updateStage(); return; }
    if (node.held) animate = false;
    ov.style.display = 'flex';
    nodeApplyLook();
    ov.classList.toggle('cb_n_slim', seg.kind === 'cg' && !seg.text);
    const isChar = seg.kind === 'char';
    ov.querySelector('.cb_n_box').classList.toggle('cb_n_nar', !isChar);
    const nameEl = ov.querySelector('.cb_n_name');
    const newName = nameEl.textContent !== (seg.name || '');
    nameEl.textContent = seg.name || '';
    if (newName && seg.name) justShown(nameEl);
    nameEl.style.display = seg.name ? '' : 'none';

    const port = ov.querySelector('.cb_n_port');
    const img = port.querySelector('img');
    const src = isChar ? C.faceSrc(seg.name, seg.emo) : null;
    port.style.display = isChar && s.nodePortraitBox ? '' : 'none';
    port.classList.toggle('cb_noimg', isChar && !src);
    if (src && img.getAttribute('src') !== src) { port.classList.remove('cb_noimg'); img.src = src; }

    const c = ctx();
    ov.classList.toggle('cb_right', isChar && !!c.name1 && seg.name.toLowerCase() === c.name1.toLowerCase());
    const cnt = ov.querySelector('.cb_n_count');
    if (!cnt.querySelector('input')) cnt.textContent = countText();

    const text = ov.querySelector('.cb_n_text');
    // The new segment counts as shown once it's typed (see done).
    text.classList.remove('cb_shown');
    const arrow = ov.querySelector('.cb_n_arrow');
    const more = node.i < node.segs.length - 1;
    const html = nodeFmt(seg.text);
    arrow.textContent = '';
    const waits = !!(s.nodeChoices && seg.choices && seg.choices.length);
    const done = () => {
      node.typing = false; node.finish = null;
      justShown(text);
      arrow.textContent = more ? '\u25BC' : '';
      renderChoices(seg);
      if (s.nodeAuto && more && !waits && !node.held) node.auto = setTimeout(() => nodeStep(1), s.nodeAutoDelay);
    };
    if (animate && s.nodeTypewriter && s.nodeSpeed > 0) typeInto(text, html, s.nodeSpeed, done, shown);
    else { text.innerHTML = html; done(); }
    placeNode();
    setLocation(seg.loc);
    setWeather(seg.wx);
    setCG(seg.cg);
    if (animate && s.nodeEffects) (seg.fx || []).forEach(fireFx);
    updateStage();
  }

  // ----- Choices -----
  function lastChatIdx() {
    const chat = ctx().chat || [];
    for (let i = chat.length - 1; i >= 0; i--) if (chat[i] && !chat[i].is_system) return i;
    return -1;
  }

  function renderChoices(seg) {
    const box = document.querySelector('#cb_node .cb_n_choices');
    if (!box) return;
    const s = settings();
    const opts = seg && s.nodeChoices && A.isOn() ? seg.choices || [] : [];
    if (!opts.length) { box.innerHTML = ''; box.style.display = 'none'; return; }
    const live = node.list[node.pos] === lastChatIdx();
    box.classList.toggle('cb_old', !live);
    box.innerHTML = opts.map((o, i) => `<button type="button" class="cb_n_choice" data-i="${i}" ${live ? '' : 'disabled title="An earlier choice"'}>${escapeHTML(o)}</button>`).join('');
    box.style.display = 'flex';
    box.querySelectorAll('.cb_n_choice').forEach((b) => {
      b.onclick = (e) => {
        e.stopPropagation();
        if (b.disabled) return;
        renderChoices(null);
        putInInput(opts[Number(b.dataset.i)], settings().choiceSend);
      };
    });
  }

  // Puts text in SillyTavern's input box (after anything already typed), optionally sending it.
  function putInInput(text, send) {
    const ta = document.getElementById('send_textarea');
    if (!ta) return false;
    const cur = ta.value || '';
    if (!cur.trim()) text = noSlash(text);
    ta.value = cur.trim() ? cur.replace(/\s+$/, '') + '\n' + text : text;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    if (send) {
      const b = document.getElementById('send_but');
      if (b) { b.click(); return true; }
    }
    ta.focus();
    try { ta.setSelectionRange(ta.value.length, ta.value.length); } catch (e) {}
    return true;
  }

  // ----- Effects, weather, CG -----
  const SHAKE_IDS = ['ntr_loc', 'ntr_stage', 'ntr_wx', 'ntr_cg', 'cb_node', 'cb_fg_layer', 'cb_fg_front'];
  let shakeT = null;
  function fireFx(kind) {
    // Reduced Motion skips the shake and the white flash; the fade to black is a slow opacity change, so it stays.
    if ((kind === 'shake' || kind === 'flash') && A.reducedMotion()) return;
    if (kind === 'shake') {
      const els = SHAKE_IDS.map((id) => document.getElementById(id)).filter(Boolean);
      els.forEach((el) => { el.classList.remove('ntr_shake'); void el.offsetWidth; el.classList.add('ntr_shake'); });
      clearTimeout(shakeT);
      shakeT = setTimeout(() => els.forEach((el) => el.classList.remove('ntr_shake')), 600);
      return;
    }
    let L = document.getElementById('ntr_fx');
    if (!L) {
      L = document.createElement('div');
      L.id = 'ntr_fx';
      document.body.appendChild(L);
      L.addEventListener('animationend', () => { L.className = ''; });
    }
    L.className = '';
    void L.offsetWidth;
    L.className = 'ntr_fx_' + kind;
  }

  function setWeather(kind) {
    const s = settings();
    const k = A.isOn() && s.nodeEnabled && s.nodeEffects && (kind === 'rain' || kind === 'snow') ? kind : '';
    let L = document.getElementById('ntr_wx');
    if (!L) {
      if (!k) return;
      L = document.createElement('div');
      L.id = 'ntr_wx';
      document.body.appendChild(L);
    }
    L.classList.toggle('ntr_rain', k === 'rain');
    L.classList.toggle('ntr_snow', k === 'snow');
  }

  function cgUrl(name) {
    const n = normLoc(name);
    if (!n) return '';
    const hit = (V().cgs || []).find((g) => normLoc(g.name) === n && g.url);
    return hit ? media(hit.url) : '';
  }

  function placeCG() {
    const L = document.getElementById('ntr_cg');
    if (!L) return;
    const form = document.getElementById('form_sheld');
    // It stops above the send bar. A Floating send bar (Layout) in the top half of the screen is covered instead.
    const top = form ? form.getBoundingClientRect().top : window.innerHeight;
    L.style.bottom = (A.sendFree?.() && top < window.innerHeight / 2 ? 0 : Math.max(0, window.innerHeight - top)) + 'px';
  }

  let cgCur = '', cgT = null;
  function setCG(name) {
    const s = settings();
    const url = A.isOn() && s.nodeEnabled && s.nodeCG && name ? cgUrl(name) : '';
    let L = document.getElementById('ntr_cg');
    if (!L) {
      if (!url) return;
      L = document.createElement('div');
      L.id = 'ntr_cg';
      L.innerHTML = '<div class="ntr_cg_bg"></div><img alt="">';
      document.body.appendChild(L);
      L.addEventListener('click', () => nodeAdvance());
    }
    if (url === cgCur) return;
    cgCur = url;
    clearTimeout(cgT);
    if (!url) {
      L.classList.remove('ntr_on');
      cgT = setTimeout(() => { if (!cgCur) L.style.display = 'none'; }, 520);
      return;
    }
    L.querySelector('img').src = url;
    L.querySelector('.ntr_cg_bg').style.backgroundImage = `url("${url.replace(/"/g, '%22')}")`;
    L.style.display = 'block';
    placeCG();
    void L.offsetWidth;
    L.classList.add('ntr_on');
  }

  // ----- Map button -----
  function syncMapBtn() {
    const b = document.querySelector('#cb_node .cb_n_mapbtn');
    if (!b) return;
    const s = settings();
    b.style.display = s.nodeMaps && A.store() && (V().maps || []).some((m) => m.url) ? '' : 'none';
  }

  function openMap() {
    loadSub('map', true).then((m) => { if (m) safe(() => m.open()); });
  }

  function nodeStep(d) {
    const ni = node.i + d;
    if (ni < 0 || ni >= node.segs.length) return;
    node.i = ni;
    nodeShow(d > 0);
  }

  function nodeAdvance() {
    if (node.typing && node.finish) { node.finish(); return; }
    nodeStep(1);
  }

  function parseMsg(m) {
    const c = ctx();
    return m.is_user ? parseSegments(m.mes, m.name || c.name1, true) : parseSegments(m.mes, m.name || c.name2, false);
  }

  // Who is on stage. Speaking adds a character; Enter/Exit tags add or remove one explicitly.
  // Until a chat uses an Enter or Exit tag, `explicit` stays false and the stage keeps following recent speakers.
  // Who is on stage: castNew and castStep (cast.js) keep the list. A snapshot goes on each line.
  const castSnap = (st) => ({ explicit: st.explicit, list: st.list.map((x) => ({ ...x })) });
  function castAt(idx) {
    const st = castNew();
    const chat = ctx().chat || [];
    for (let i = 0; i < Math.min(idx, chat.length); i++) {
      const m = chat[i];
      if (!m || m.is_system || !m.mes) continue;
      for (const seg of parseMsg(m)) castStep(st, seg);
    }
    return st;
  }

  // Location and weather in effect when message idx starts: the last such tags in any earlier message.
  // Pass a Set as `visited` to also collect every location named along the way.
  function stickyAt(idx, visited) {
    const s = settings();
    const chat = ctx().chat || [];
    const nc = reEsc(s.delimNarClose);
    const words = [s.locWord, s.weatherWord].filter(Boolean).map(reEsc).join('|');
    const re = new RegExp(`${reEsc(s.delimNarOpen)}[ \\t]*(${words})[ \\t]*:[ \\t]*((?:(?!${nc})[^\\n]){1,200}?)[ \\t]*${nc}`, 'gi');
    const lw = lc(s.locWord);
    let loc = null, wx = null;
    for (let i = 0; i < Math.min(idx, chat.length); i++) {
      const m = chat[i];
      if (!m || m.is_system || !m.mes) continue;
      re.lastIndex = 0;
      let mm;
      while ((mm = re.exec(m.mes))) {
        const arg = mm[2].trim();
        if (lc(mm[1]) === lw) { loc = arg; if (visited) visited.add(normLoc(arg)); } else wx = wxKind(arg, s) || wx;
      }
    }
    return { loc, wx };
  }
  const chatLen = () => (ctx().chat || []).length;
  const currentLoc = () => stickyAt(chatLen()).loc;
  function visitedLocs() { const set = new Set(); stickyAt(chatLen(), set); return set; }

  // The dialogue parts of a message's tags and text (from parseMsg), each with the scene it plays in.
  function buildSegs(idx, parts) {
    const s = settings();
    let { loc, wx } = stickyAt(idx);
    const cast = castAt(idx);
    const segs = [];
    // Effects and CGs belong to the next line; choices to the line before them.
    let fx = [], cg = null, choice = null;
    for (const seg of parts) {
      if (seg.kind === 'loc') { loc = seg.name; continue; }
      if (seg.kind === 'enter' || seg.kind === 'exit') { castStep(cast, seg); continue; }
      castStep(cast, seg);
      if (seg.kind === 'wx') { wx = wxKind(seg.name, s) || wx; continue; }
      if (seg.kind === 'fx') { const k = fxKind(seg.name, s); if (k) fx.push(k); continue; }
      if (seg.kind === 'cg') { cg = seg.name; continue; }
      if (seg.kind === 'choice') { const opts = splitChoices(seg.name, s); if (opts.length) choice = { opts, after: segs.length }; continue; }
      Object.assign(seg, { loc, wx, fx, cg, cast: castSnap(cast) });
      fx = []; cg = null;
      segs.push(seg);
    }
    if (cg) { segs.push({ kind: 'cg', name: '', emo: '', text: '', loc, wx, fx, cg, cast: castSnap(cast) }); fx = []; }
    if (fx.length && segs.length) segs[segs.length - 1].fx.push(...fx);
    if (choice) {
      if (!segs.length) segs.push({ kind: 'narrator', name: '', emo: '', text: '', loc, wx, fx: [], cg: null, cast: castSnap(cast) });
      const textAfter = segs.slice(choice.after).some((x) => x.kind !== 'cg');
      (textAfter ? segs[Math.max(0, choice.after - 1)] : segs[segs.length - 1]).choices = choice.opts;
    }
    return { segs, loc, wx, cast: castSnap(cast) };
  }

  function nodeParseCurrent() {
    const c = ctx();
    const idx = node.list[node.pos];
    const m = c.chat[idx];
    node.prevTail = [];
    if (!m) { node.segs = []; node.endLoc = null; node.endWx = null; node.endCast = null; return; }
    // A new swipe being written still holds the old reply, so it shows "..." like SillyTavern's chat (see nodeSwiped).
    const r = buildSegs(idx, idx === node.waitId ? [{ kind: 'narrator', name: '', emo: '', text: '...' }] : parseMsg(m));
    node.segs = r.segs;
    node.endLoc = r.loc;
    node.endWx = r.wx;
    node.endCast = r.cast;
    const prev = node.pos > 0 ? c.chat[node.list[node.pos - 1]] : null;
    if (prev) node.prevTail = parseMsg(prev).filter((x) => x.kind === 'char' && x.name).slice(-3);
  }

  // ----- Location backgrounds -----
  let locCur = '';
  function ensureLocLayer() {
    let L = document.getElementById('ntr_loc');
    if (L) return L;
    L = document.createElement('div');
    L.id = 'ntr_loc';
    L.innerHTML = '<div></div><div></div>';
    const bgs = ['bg1', 'bg_custom'].map((id) => document.getElementById(id)).filter(Boolean);
    bgs.sort((a, b) => (a.compareDocumentPosition(b) & 4 ? -1 : 1));
    const lastBg = bgs[bgs.length - 1];
    if (lastBg && lastBg.parentNode) {
      lastBg.parentNode.insertBefore(L, lastBg.nextSibling);
      const zs = bgs.map((b) => parseInt(getComputedStyle(b).zIndex, 10)).filter((z) => !Number.isNaN(z));
      if (zs.length) L.style.zIndex = String(Math.max(...zs));
    } else {
      L.style.zIndex = '-1';
      document.body.prepend(L);
    }
    return L;
  }

  function locUrl(name) {
    const v = V();
    const n = normLoc(name);
    const hit = n ? v.locations.find((l) => normLoc(l.name) === n) : null;
    return media(hit && hit.url) || media(v.locDefault) || artBgUrl() || '';
  }

  function setLocation(name) {
    const L = ensureLocLayer();
    const s = settings();
    const url = A.isOn() && s.nodeEnabled ? locUrl(name) : '';
    const [a, b] = L.children;
    if (!url) {
      L.style.display = 'none';
      locCur = '';
      a.style.opacity = '0';
      b.style.opacity = '0';
      return;
    }
    L.style.display = 'block';
    if (url === locCur) return;
    locCur = url;
    const showing = a.style.opacity === '1' ? a : b;
    const next = showing === a ? b : a;
    next.style.backgroundImage = `url("${url.replace(/"/g, '%22')}")`;
    next.style.opacity = '1';
    showing.style.opacity = '0';
  }

  // ----- Stage sprites -----
  const stageSpots = new Map();
  function ensureStage() {
    let st = document.getElementById('ntr_stage');
    if (st) return st;
    st = document.createElement('div');
    st.id = 'ntr_stage';
    st.innerHTML = ['left', 'center', 'right'].map((p) => `<img class="ntr_spr" data-spot="${p}" alt="">`).join('');
    document.body.appendChild(st);
    st.querySelectorAll('img').forEach((i) => { i.onerror = () => { i.style.display = 'none'; }; });
    return st;
  }

  function updateStage() {
    const s = settings();
    const st = ensureStage();
    if (!(A.isOn() && s.nodeEnabled && s.nodeSprites) || !node.list.length) { st.style.display = 'none'; return; }
    st.style.display = 'block';
    const cur = node.segs[node.i];
    const lines = [...(node.prevTail || []), ...node.segs.slice(0, node.i + 1)].slice(-6);
    const info = new Map();
    for (const l of lines) {
      if (l.kind !== 'char' || !l.name) continue;
      const k = l.name.toLowerCase();
      info.delete(k);
      info.set(k, { name: l.name, emo: l.emo });
    }
    const cast = cur ? cur.cast : node.endCast;
    const wanted = new Map();
    let present;
    if (cast && cast.explicit) {
      for (const c of cast.list) { if (!info.has(c.key)) info.set(c.key, { name: c.name, emo: '' }); wanted.set(c.key, c.spot); }
      present = cast.list.map((c) => [c.key, info.get(c.key)]).filter(([, p]) => spriteSrc(p.name, p.emo)).slice(-3);
    } else present = [...info.entries()].filter(([, p]) => spriteSrc(p.name, p.emo)).slice(-3);
    pickSpots(stageSpots, present.map(([k]) => k), wanted);
    const boxes = spotBoxes();
    const scale = (s.nodeSpriteScale || 100) / 100;
    st.querySelectorAll('img').forEach((img) => {
      const spot = img.dataset.spot;
      const who = [...stageSpots.entries()].find(([, v]) => v === spot);
      const p = who ? info.get(who[0]) : null;
      const src = p ? spriteSrc(p.name, p.emo) : null;
      if (!src) { img.style.display = 'none'; return; }
      if (img.getAttribute('src') !== src) img.src = src;
      const [x, w] = boxes[spot];
      Object.assign(img.style, { display: 'block', left: x + 'px', width: w + 'px', transform: `scale(${scale})` });
      const active = cur && cur.kind === 'char' && cur.name.toLowerCase() === who[0];
      img.classList.toggle('ntr_dim', !active);
    });
  }

  // ----- Auto-injected tag instructions (rides along with the normal request) -----
  const INJECT_KEY = 'ntr_vn_tags';
  function updateInjection() {
    const c = ctx();
    if (typeof c.setExtensionPrompt !== 'function') return;
    const s = settings();
    const on = A.isOn() && s.nodeEnabled && s.nodeInject;
    try { c.setExtensionPrompt(INJECT_KEY, on ? buildPrompt(s) : '', 1, 1, false, 0); } catch (e) { console.error('[NTR] Could not set the tag instructions', e); }
  }

  function nodeGoMsg(d) {
    const np = node.pos + d;
    if (np < 0 || np >= node.list.length) return;
    node.pos = np;
    keepPlace();
    nodeParseCurrent();
    node.i = 0;
    nodeShow(false);
  }

  // The counter under the box: message, then line.
  const countText = () => `${node.pos + 1}/${node.list.length} \u00B7 ${node.i + 1}/${node.segs.length}`;
  // Clicking the counter turns the message number into a box to type one in, like Reader Mode's page number.
  function askMsg() {
    const cnt = document.querySelector('#cb_node .cb_n_count');
    window.NTR.reader?.askNumber?.(cnt, node.pos, node.list.length, '', '/', 'Message number', (to) => {
      cnt.textContent = countText();
      if (to != null) nodeGoMsg(to - node.pos);
    });
  }

  // Remembers the message on screen, and saves it as the one this chat was left on (Reader Mode keeps it, for every style),
  // once this chat's saved message has been read.
  // Pinned Blocks follow it too, so they don't show what happens later; older messages are drawn first for them.
  function keepPlace() {
    const idx = node.list[node.pos];
    const was = node.shown;
    node.follow = node.pos >= node.list.length - 1;
    node.shown = ctx().chat?.[idx] || null;
    const R = window.NTR.reader;
    if (node.md && ctx().chatMetadata === node.md) R?.rememberMsg?.(idx, node.follow);
    if (node.shown !== was) Promise.resolve(R?.drawTo?.(idx)).then(() => A.refreshPins?.());
  }

  const syncNodeToggle = () => A.syncVNToggle();

  // ----- Opening video triggers (the player itself lives in opening.js) -----
  let lastSig = null;
  function chatSig() {
    const c = ctx();
    let id = '';
    try { id = typeof c.getCurrentChatId === 'function' ? c.getCurrentChatId() : c.chatId; } catch (e) {}
    return `${c.groupId || c.characterId}|${id || ''}`;
  }
  function chatIsFresh() {
    const chat = (ctx().chat || []).filter((m) => m && !m.is_system);
    return chat.length <= 1 && !chat.some((m) => m.is_user);
  }
  const opHooks = {
    onStart: () => { node.held = true; nodeStopTyping(); renderChoices(null); },
    onDone: () => { node.held = false; if (A.isOn() && settings().nodeEnabled) nodeShow(true); },
  };
  function maybeOpening(reason) {
    const info = { sig: chatSig(), fresh: chatIsFresh(), hooks: opHooks };
    const run = (m) => {
      if (!m) return;
      try { m.maybePlay(reason, info); } catch (e) { console.error('[NTR] Opening video crashed', e); node.held = false; }
    };
    if (window.NTR.opening) run(window.NTR.opening);
    else loadSub('opening').then(run);
  }

  function clearScene() {
    setWeather(null);
    setCG(null);
    renderChoices(null);
  }

  function nodeLoad(opts = {}) {
    const s = settings();
    const ov = ensureNodeLayer();
    syncNodeToggle();
    // SillyTavern clears every extension prompt when a chat opens or reloads, so the tag instructions go back in each time.
    updateInjection();
    // Taken right away, so a Continue that ends while Visual Novel Mode is off doesn't apply later.
    let jump = node.contJump;
    node.contJump = null;
    const sig = chatSig();
    const opened = sig !== lastSig;
    lastSig = sig;
    if (opened) { node.waitId = null; node.cont = null; jump = null; safe(() => window.NTR.map?.close()); }
    if (!s.nodeEnabled || !A.isOn()) {
      watchLayout(false);
      clearTimeout(nodeQ);
      nodeStopTyping(); ov.style.display = 'none'; node.list = []; setLocation(null); clearScene(); updateStage();
      node.held = false;
      node.waitId = null;
      node.cont = null;
      safe(() => window.NTR.map?.close());
      safe(() => window.NTR.opening?.abort());
      return;
    }
    watchLayout(true);
    if (opened) node.held = false; // opening.js stops a video that belongs to the previous chat
    if (opts.switchedOn) maybeOpening('vn');
    else if (opened) maybeOpening('open');
    const c = ctx();
    node.list = [];
    (c.chat || []).forEach((m, i) => {
      if (m.is_system || !m.mes) return;
      if (m.is_user && !s.nodeUserMsgs) return;
      node.list.push(i);
    });
    if (!node.list.length) { nodeStopTyping(); ov.style.display = 'none'; setLocation(null); clearScene(); updateStage(); return; }
    // A chat opening, or Visual Novel coming on: the message this chat was left on, or the newest. After that, new messages
    // are followed from the newest one, and otherwise the same message stays. Reader Mode's saved page is its first
    // message, so the first one shown from there on.
    const last = node.list.length - 1;
    const R = window.NTR.reader;
    const md = c.chatMetadata;
    let pos = last;
    if (opened || opts.switchedOn || (R && md !== node.md)) {
      const at = R?.savedMsg?.();
      const i = at == null ? -1 : node.list.findIndex((x) => x >= at);
      if (i >= 0) pos = i;
      node.md = R ? md : null;
    } else if (!node.follow) {
      const at = node.shown ? c.chat.indexOf(node.shown) : -1;
      pos = at >= 0 ? Math.max(0, node.list.findLastIndex((x) => x <= at)) : Math.min(node.pos, last);
    }
    node.pos = pos;
    keepPlace();
    nodeParseCurrent();
    node.i = 0;
    if (jump && jump.id === node.list[node.pos]) {
      const at = contStart(jump);
      node.i = at.i;
      return nodeShow(!!opts.animate && at.animate, at.shown);
    }
    nodeShow(!!opts.animate);
  }

  // ----- Continue -----
  // The text a part shows, without its formatting.
  function plainText(t) {
    const d = document.createElement('div');
    d.innerHTML = nodeFmt(t);
    return d.textContent;
  }
  // Where a continued message picks up: the old last part, with its old words shown at once.
  // If those words changed (the model rewrote a cut-off tag, say), the whole part is typed instead.
  function contStart(jump) {
    const idx = node.list[node.pos];
    const m = ctx().chat[idx];
    const old = buildSegs(idx, parseMsg({ ...m, mes: jump.mes })).segs;
    const last = node.segs.length - 1;
    if (!old.length || last < 0) return { i: 0, shown: 0, animate: true };
    const i = Math.min(old.length - 1, last);
    const was = plainText(old[i].text), now = plainText(node.segs[i].text);
    const same = old[i].kind === node.segs[i].kind && old[i].name === node.segs[i].name && now.startsWith(was);
    if (!same) return { i, shown: 0, animate: true };
    if (now.length > was.length) return { i, shown: was.length, animate: true };
    // That part didn't grow: start at the first new part, or show the last one as it is if nothing was added.
    if (i < last) return { i: i + 1, shown: 0, animate: true };
    return { i, shown: 0, animate: false };
  }
  // SillyTavern says when a generation starts, while a continued message still holds only its old text.
  function nodeGenStarted(type, dryRun) {
    if (dryRun || !vnOn()) return;
    // A reply on its way is followed, like in Reader Mode's other styles.
    if (type !== 'quiet' && type !== 'impersonate') node.follow = true;
    const chat = ctx().chat || [];
    const id = chat.length - 1;
    node.cont = type === 'continue' && chat[id] ? { id, mes: chat[id].mes || '' } : null;
  }
  // A Continue's reply is in: show it from where the old text ended.
  function nodeContinued(id) {
    if (!vnOn()) return;
    if (node.cont && node.cont.id === id) node.contJump = node.cont;
    node.cont = null;
    nodeQueue(true);
  }

  // SillyTavern says a message was swiped before a new swipe is written, while it still holds the old reply.
  // A swipe to the empty slot past the last one is a new reply on its way: wait for it instead of typing the old one.
  function nodeSwiped(id) {
    if (!vnOn()) return;
    const m = (ctx().chat || [])[id];
    node.waitId = m && Array.isArray(m.swipes) && m.swipe_id >= m.swipes.length ? id : null;
    nodeQueue(node.waitId === null);
  }
  // Stops waiting for a new swipe. True if it was waiting.
  function nodeEndWait() {
    if (node.waitId === null) return false;
    node.waitId = null;
    return true;
  }

  // While Visual Novel Mode is off, new messages, edits and swipes are left alone: switching it on loads the chat again.
  function nodeQueue(animate) {
    if (!vnOn()) return;
    nodeQAnim = nodeQAnim || !!animate;
    clearTimeout(nodeQ);
    nodeQ = setTimeout(() => { const a = nodeQAnim; nodeQAnim = false; nodeLoad({ animate: a }); }, 60);
  }


  function refresh(opts = {}) {
    applyStyle();
    loadSubs();
    nodeLoad({ animate: false, switchedOn: !!opts.switchedOn });
    syncNodeToggle();
    updateInjection();
    // The stage behind the chat and the emotion prompt (cast.js) step aside while Visual Novel Mode is on.
    C.refresh();
    if (A.refreshFg) A.refreshFg();
  }

  function teardown() {
    applyStyle();
    watchLayout(false);
    clearTimeout(nodeQ);
    nodeStopTyping();
    const ov = document.getElementById('cb_node');
    if (ov) ov.style.display = 'none';
    node.list = [];
    node.held = false;
    node.waitId = null;
    node.cont = null;
    node.contJump = null;
    setLocation(null);
    clearScene();
    safe(() => window.NTR.map?.close());
    safe(() => window.NTR.opening?.abort());
    updateStage();
    updateInjection();
    C.refresh();
    syncNodeToggle();
    if (A.refreshFg) A.refreshFg();
  }

  window.NTR.vn = {
    version: VN_VERSION,
    sectionHtml: nodeSectionHtml,
    bind: bindVN,
    refresh,
    teardown,
    relayout,
    queue: nodeQueue,
    swiped: nodeSwiped,
    endWait: nodeEndWait,
    genStarted: nodeGenStarted,
    continued: nodeContinued,
    // For Reader Mode's Page Up and Page Down.
    goMsg: (d) => nodeGoMsg(d),
    // For Pinned Blocks (through Reader Mode): the message on screen, or null on the newest.
    shownMsg: () => (A.isOn() && settings().nodeEnabled && node.list.length && !node.follow ? node.list[node.pos] : null),
    // For map.js and opening.js
    data: V,
    normLoc,
    newId,
    putInInput,
    currentLoc,
    visitedLocs,
    openingHooks: opHooks,
    titleName: () => { const c = ctx(); if (c.groupId) return ((c.groups || []).find((g) => g.id === c.groupId) || {}).name || ''; return c.name2 || ''; },
    titleArt: () => {
      const c = ctx();
      if (c.groupId || !c.name2) return null;
      return C.baseFace(c.name2);
    },
    sceneBg: () => locUrl(currentLoc()) || (A.bannerImage ? A.bannerImage() : ''),
  };
})();
