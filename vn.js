// Nitwit Tavern Redesign: Visual Novel Mode module.
// Loaded on demand by index.js. If this file breaks, the rest of the extension keeps working.
(() => {
  const VN_VERSION = '2.2.1';
  const A = window.NTR && window.NTR.api;
  if (!A) { console.error('[NTR] vn.js loaded without the core (index.js).'); return; }
  const { ctx, save, settings, escapeHTML, fullResUrl, readDataURL, loadImg, askImageUrl, pills, onPills, secHead, subHead } = A;
  const TAG = A.TAG || '';
  const media = A.media || ((u) => (typeof u === 'string' ? u : ''));

  // Per-character Visual Novel data (speakers, portraits, locations). Lives in the card, or per group.
  const VDEF = () => ({ avatars: Object.create(null), sprites: Object.create(null), emoImgs: Object.create(null), customSpk: [], hiddenSpk: [], locations: [], locDefault: '', cgs: [], maps: [], mapRoot: '', opening: {} });
  function V() {
    const st = A.store();
    if (!st) return VDEF();
    if (!st.vn || typeof st.vn !== 'object') st.vn = VDEF();
    const d = VDEF();
    for (const k of Object.keys(d)) if (st.vn[k] === undefined) st.vn[k] = d[k];
    if (Object.keys(st.vn.avatars).length) mergeOldFaces(st.vn);
    return st.vn;
  }

  // Speakers used to have a separate face picture next to their emotion images. The face is the emotion images now:
  // a speaker who has emotion images loses the old copy (file included); one who has none gets it as their default emotion.
  function mergeOldFaces(v) {
    const s = settings();
    const olds = [];
    for (const k of Object.keys(v.avatars)) {
      const u = v.avatars[k];
      delete v.avatars[k];
      if (!u) continue;
      const imgs = v.emoImgs[k];
      if (imgs && s.emotions.some((e) => imgs[e.id])) { olds.push(u); continue; }
      if (!v.emoImgs[k]) v.emoImgs[k] = Object.create(null);
      v.emoImgs[k][s.emoDefault] = u;
    }
    save();
    setTimeout(() => olds.forEach((u) => A.deleteFileIfUnused(u)), 0);
  }
  const newId = (p) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const normLoc = (x) => String(x || '').toLowerCase().replace(/^\s*the\s+/, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const lc = (x) => String(x || '').trim().toLowerCase();
  const safe = (fn) => { try { return fn(); } catch (e) { console.error('[NTR]', e); return undefined; } };

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

  const VN_CSS = `
      #cb_node { position: fixed; z-index: 2450; display: none; align-items: flex-end; gap: 12px; padding: 0 6px; box-sizing: border-box; pointer-events: none; }
      #cb_node > * { pointer-events: auto; }
      #cb_node.cb_right { flex-direction: row-reverse; }
      #cb_node .cb_n_port { position: relative; flex: none; width: var(--cbn-ps, 120px); height: var(--cbn-ps, 120px); border-radius: 12px; overflow: hidden; border: 2px solid var(--SmartThemeBorderColor, #555); background: rgba(0,0,0,0.55); box-shadow: 0 4px 14px rgba(0,0,0,.5); }
      #cb_node .cb_n_port img { width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; }
      #cb_node .cb_n_port i { display: none; position: absolute; inset: 0; align-items: center; justify-content: center; font-size: calc(var(--cbn-ps, 120px) * 0.45); opacity: .35; }
      #cb_node .cb_n_port.cb_noimg img { display: none; }
      #cb_node .cb_n_port.cb_noimg i { display: flex; }
      #cb_node .cb_n_box { position: relative; flex: 1; min-width: 0; min-height: var(--cbn-minh, 96px); font-size: calc(var(--cbn-fs, 1) * 1em); padding: 22px 18px 28px; border-radius: 12px; border: 2px solid var(--SmartThemeBorderColor, #555); background: rgba(10, 14, 22, var(--cbn-op, .88)); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); color: var(--SmartThemeBodyColor, #ddd); cursor: pointer; box-shadow: 0 4px 18px rgba(0,0,0,.55); }
      #cb_node .cb_n_name { position: absolute; top: -14px; left: 16px; padding: 2px 14px; border-radius: 999px; font-weight: bold; font-size: 0.95em; background: var(--SmartThemeQuoteColor, #6cf); color: #000; }
      #cb_node.cb_right .cb_n_name { left: auto; right: 16px; }
      #cb_node .cb_n_text { max-height: var(--cbn-maxh, 28vh); overflow-y: auto; line-height: 1.5; }
      #cb_node .cb_n_nar .cb_n_text { font-style: italic; }
      #cb_node .cb_q { color: var(--SmartThemeQuoteColor, #6cf); }
      #cb_node .cb_n_arrow { position: absolute; left: 50%; bottom: 4px; font-size: 12px; animation: cbn_blink 1s infinite; pointer-events: none; }
      #cb_node .cb_n_ctrl { position: absolute; right: 8px; bottom: 3px; display: flex; align-items: center; gap: 2px; font-size: 11px; opacity: .75; }
      #cb_node .cb_n_ctrl button { background: none; border: none; color: inherit; cursor: pointer; padding: 2px 6px; font-size: 13px; }
      @keyframes cbn_blink { 50% { opacity: .15; } }
      #cb_node_toggle.cb_on { color: var(--SmartThemeQuoteColor, #6cf); }
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
      .cb_dfield { display: flex; flex-direction: column; gap: 3px; font-size: .85em; }
      .cb_dfield input { margin: 0; font-family: monospace; }
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
      #cb_node .cb_n_choice { pointer-events: auto; min-width: min(420px, 90%); max-width: 100%; padding: 10px 18px; border-radius: 10px; border: 2px solid var(--SmartThemeBorderColor, #555); background: rgba(10, 14, 22, .92); color: var(--SmartThemeBodyColor, #ddd); font: inherit; cursor: pointer; text-align: center; box-shadow: 0 4px 14px rgba(0,0,0,.5); transition: border-color .15s, transform .15s; animation: cbn_rise .25s ease both; }
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
      @media (prefers-reduced-motion: reduce) { .ntr_shake { animation-duration: .2s; } }
      .cb_g_row { margin: 10px 0; }
      .cb_g_line { display: flex; align-items: center; gap: 6px; }
      .cb_g_line .cb_code { flex: 1; min-width: 0; margin-top: 4px; user-select: all; word-break: break-word; }
      .cb_g_line .menu_button { margin: 4px 0 0; padding: 4px 8px; }
      .cb_art_row { display: flex; align-items: center; gap: 6px; margin-top: 6px; }
      .cb_art_row .menu_button { margin: 0; padding: 4px 8px; }
  `;

  function applyStyle() {
    let el = document.getElementById('ntr_vn_style');
    if (!el) { el = document.createElement('style'); el.id = 'ntr_vn_style'; document.head.appendChild(el); }
    if (!A.isOn()) { el.textContent = ''; return; }
    el.textContent = VN_CSS + (settings().nodeEnabled ? '\n      #chat .mes { display: none !important; }\n' : '');
  }

  const node = { list: [], pos: 0, segs: [], i: 0, typer: null, auto: null, typing: false, finish: null };
  let nodeQ = null, nodeQAnim = false;
  const spkOpen = new Set();
  const reEsc = (x) => String(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function tagRe(s) {
    const so = reEsc(s.delimSpkOpen), sc = reEsc(s.delimSpkClose), no = reEsc(s.delimNarOpen), nc = reEsc(s.delimNarClose);
    return new RegExp(`${so}[ \\t]*((?:(?!${sc})[^\\n]){1,80}?)[ \\t]*${sc}[ \\t]*:?|${no}[ \\t]*((?:(?!${nc})[^\\n]){1,400}?)[ \\t]*${nc}[ \\t]*:?`, 'g');
  }

  function splitTag(inner, s) {
    const sep = s.delimEmo;
    const i = sep ? inner.indexOf(sep) : -1;
    if (i < 0) return { name: inner.trim(), emo: '' };
    return { name: inner.slice(0, i).trim(), emo: inner.slice(i + sep.length).trim() };
  }

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
    raw = String(raw || '');
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
  function cleanEmoTags() {
    const s = settings();
    if (!A.isOn() || !s.nodeHideEmo) return;
    const so = reEsc(s.delimSpkOpen), sc = reEsc(s.delimSpkClose), no = reEsc(s.delimNarOpen), nc = reEsc(s.delimNarClose);
    const emoRe = s.delimEmo ? new RegExp(`(${so}(?:(?!${sc})[^\\n]){0,60}?)[ \\t]*${reEsc(s.delimEmo)}(?:(?!${sc})[^\\n]){0,60}?(${sc})`, 'g') : null;
    const dirWords = [s.locWord, s.effectWord, s.weatherWord, s.cgWord, s.enterWord, s.exitWord].filter(Boolean).map(reEsc).join('|');
    const locRe = new RegExp(`${no}[ \\t]*(?:${dirWords})[ \\t]*:(?:(?!${nc})[^\\n]){0,80}?${nc}[ \\t]*`, 'gi');
    document.querySelectorAll('#chat .mes_text').forEach((el) => {
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = w.nextNode())) {
        if (n.parentElement?.closest('textarea')) continue;
        let val = n.nodeValue;
        if (emoRe && val.includes(s.delimEmo)) val = val.replace(emoRe, '$1$2');
        if (val.includes(s.delimNarOpen)) val = val.replace(locRe, '');
        if (val !== n.nodeValue) n.nodeValue = val;
      }
    });
  }

  let chatObs = null, cleanT = null;
  function ensureChatObserver() {
    const chat = document.getElementById('chat');
    if (!chat || !window.MutationObserver || (chatObs && chatObs._el === chat)) return;
    if (chatObs) chatObs.disconnect();
    chatObs = new MutationObserver(() => { clearTimeout(cleanT); cleanT = setTimeout(cleanEmoTags, 120); });
    chatObs.observe(chat, { childList: true, subtree: true, characterData: true });
    chatObs._el = chat;
    cleanEmoTags();
  }

  function userAvatarSrc() {
    const img = document.querySelector('#chat .mes[is_user="true"] .avatar img');
    if (img && img.getAttribute('src')) return fullResUrl(img.getAttribute('src'));
    const sel = document.querySelector('#user_avatar_block .avatar-container.selected');
    const id = sel && (sel.getAttribute('data-avatar-id') || sel.getAttribute('imgfile'));
    return id ? `/User%20Avatars/${encodeURIComponent(id)}` : null;
  }

  // The speaker's default emotion image, or their first emotion image in list order.
  function firstEmoImg(key) {
    const s = settings();
    const imgs = V().emoImgs[key] || {};
    if (imgs[s.emoDefault]) return imgs[s.emoDefault];
    const e = s.emotions.find((x) => imgs[x.id]);
    return e ? imgs[e.id] : '';
  }

  // Face: default emotion image > first emotion image > persona > character card
  function resolveAvatar(name) {
    const key = String(name || '').trim().toLowerCase();
    if (!key) return null;
    const emo = media(firstEmoImg(key));
    if (emo) return emo;
    const c = ctx();
    if (c.name1 && c.name1.toLowerCase() === key) return userAvatarSrc();
    const ch = (c.characters || []).find((x) => x.name && x.name.toLowerCase() === key);
    if (ch && ch.avatar) return `/characters/${encodeURIComponent(ch.avatar)}`;
    return null;
  }

  function findEmo(name) {
    const k = String(name || '').trim().toLowerCase();
    return k ? settings().emotions.find((e) => e.name.toLowerCase() === k) : null;
  }

  // Emotion image > default emotion image > face > placeholder (null)
  function resolvePortrait(name, emoName) {
    const s = settings();
    const imgs = V().emoImgs[String(name || '').trim().toLowerCase()] || {};
    const e = findEmo(emoName);
    if (e && imgs[e.id]) return media(imgs[e.id]) || null;
    if (imgs[s.emoDefault]) return media(imgs[s.emoDefault]) || null;
    return resolveAvatar(name);
  }

  // Stage sprites: the full portrait wins. Otherwise the emotion images, never card/persona avatars.
  // With the fixed-face option on, the stage keeps the face (see resolveAvatar) whatever the emotion.
  function spriteSrc(name, emoName) {
    const s = settings();
    const v = V();
    const key = String(name || '').trim().toLowerCase();
    if (v.sprites[key]) return media(v.sprites[key]) || silhouetteFor(key);
    if (s.nodeSpriteBase) return resolveAvatar(name) || silhouetteFor(key);
    const imgs = v.emoImgs[key] || {};
    const e = findEmo(emoName);
    return media((e && imgs[e.id]) || firstEmoImg(key)) || silhouetteFor(key);
  }

  // Files deleted by hand leave dead links behind. Each uploaded file is checked once per session; links to missing ones are dropped.
  const fileOk = new Map();
  function fileExists(u) {
    const p = String(u || '').trim();
    if (!/^\/?user\/files\//.test(p)) return Promise.resolve(true);
    if (!fileOk.has(p)) fileOk.set(p, fetch(p, { method: 'HEAD', cache: 'no-store' }).then((r) => r.status !== 404).catch(() => true));
    return fileOk.get(p);
  }
  async function pruneMissing() {
    const v = V();
    const refs = [];
    const scan = (obj) => { for (const [k, u] of Object.entries(obj || {})) if (typeof u === 'string') refs.push([obj, k, u]); };
    scan(v.sprites);
    Object.values(v.emoImgs).forEach(scan);
    const ok = await Promise.all(refs.map((r) => fileExists(r[2])));
    if (V() !== v) return 0;
    let n = 0;
    refs.forEach(([obj, k, u], i) => { if (!ok[i] && obj[k] === u) { delete obj[k]; n++; } });
    return n;
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

  function collectSpeakers() {
    const s = settings();
    const c = ctx();
    const map = new Map();
    const nar = String(s.narratorWord).trim().toLowerCase();
    const hidden = new Set((V().hiddenSpk || []).map(lc));
    const add = (n, custom) => {
      const t = String(n || '').trim();
      const k = t.toLowerCase();
      if (!t || k === nar) return;
      if (!custom && (!s.nodeAutoSpk || hidden.has(k))) return;
      if (!map.has(k)) map.set(k, { key: k, name: t, custom: !!custom });
      else if (custom) map.get(k).custom = true;
    };
    add(c.name1);
    if (c.groupId) {
      const g = (c.groups || []).find((x) => x.id === c.groupId);
      (g?.members || []).forEach((av) => { const ch = (c.characters || []).find((x) => x.avatar === av); if (ch) add(ch.name); });
    } else if (c.characterId !== undefined && c.characterId !== null) add(c.name2);
    (V().customSpk || []).forEach((n) => add(n, true));
    for (const m of c.chat || []) {
      if (m.is_system) continue;
      for (const seg of parseSegments(m.mes || '', '', false)) if (seg.kind === 'char' && seg.name) add(seg.name);
    }
    return [...map.values()];
  }

  function thumbBox(src) {
    src = media(src);
    return `<div class="cb_thumbbox">${src ? `<img src="${escapeHTML(src)}" alt="">` : '<i class="fa-solid fa-user"></i>'}</div>`;
  }

  function spkRowsHtml(s) {
    const list = collectSpeakers();
    const nHidden = (V().hiddenSpk || []).length;
    const restore = nHidden ? `<div class="cb_hint"><a href="#" class="m_n_unhide">Restore ${nHidden} hidden speaker${nHidden === 1 ? '' : 's'}</a></div>` : '';
    if (!list.length) return `<div class="cb_hint">No speakers yet. Add one below${s.nodeAutoSpk ? ', or they show up once tagged in the chat' : ''}.</div>${restore}`;
    return list.map(({ key, name, custom }) => {
      const base = resolveAvatar(name);
      const faceEmo = (() => { const im = V().emoImgs[key] || {}; return s.emotions.find((e) => e.id === s.emoDefault && im[e.id]) || s.emotions.find((e) => im[e.id]); })();
      const n = s.emotions.length;
      const full = V().sprites[key];
      const imgs = V().emoImgs[key] || {};
      const cnt = s.emotions.filter((e) => imgs[e.id]).length;
      const open = spkOpen.has(key);
      const k = escapeHTML(key);
      const grid = !open ? '' : `<div class="cb_emo_grid">${s.emotions.map((e) => {
        const src = imgs[e.id];
        const id = escapeHTML(e.id);
        return `<div class="cb_emo_cell">
            ${thumbBox(src)}
            <div class="cb_emo_label">${escapeHTML(e.name)}${e.id === s.emoDefault ? ' \u2605' : ''}</div>
            <div style="display:flex;gap:4px;">
              <button class="menu_button m_n_up" data-key="${k}" data-emo="${id}" title="Upload ${escapeHTML(e.name)}"><i class="fa-solid fa-upload"></i></button>
              <button class="menu_button m_n_url" data-key="${k}" data-emo="${id}" title="Use a link for ${escapeHTML(e.name)}"><i class="fa-solid fa-link"></i></button>
              <button class="menu_button danger_button m_n_clr" data-key="${k}" data-emo="${id}" title="Clear" ${src ? '' : 'disabled'}><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>`;
      }).join('')}</div>`;
      const facesTxt = cnt ? `${cnt} of ${n} uploaded${faceEmo ? ` \u00B7 main: ${faceEmo.name}` : ''}` : `none yet${base ? ': using the card picture' : ''}`;
      return `<div class="cb_spk">
        <div class="cb_spk_row cb_spk_head">
          <span class="cb_spk_name">${escapeHTML(name)}</span>
          <button class="menu_button danger_button m_n_rm" data-key="${k}" data-custom="${custom ? '1' : ''}" title="${custom ? 'Remove speaker' : 'Hide speaker (restorable)'}"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="cb_spk_row cb_faces_row m_n_exp" data-key="${k}" role="button" tabindex="0" aria-expanded="${open}" title="${open ? 'Close' : 'Open'} faces">
          ${thumbBox(base)}
          <span class="cb_spk_name">Faces<small>${escapeHTML(facesTxt)}</small></span>
          <i class="fa-solid fa-chevron-${open ? 'down' : 'right'}"></i>
        </div>
        ${grid}
        <div class="cb_spk_row cb_full_row">
          ${thumbBox(full)}
          <span class="cb_spk_name">Full portrait<small>${full ? 'used on stage for every emotion' : 'none: the stage uses the faces'}</small></span>
          <button class="menu_button m_n_up" data-key="${k}" data-emo="" data-full="1" title="Upload full portrait (stage sprite)"><i class="fa-solid fa-upload"></i></button>
          <button class="menu_button m_n_url" data-key="${k}" data-emo="" data-full="1" title="Use a link for the full portrait"><i class="fa-solid fa-link"></i></button>
          <button class="menu_button danger_button m_n_clr" data-key="${k}" data-emo="" data-full="1" title="Remove full portrait" ${full ? '' : 'disabled'}><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`;
    }).join('') + restore;
  }

  function emoRowsHtml(s) {
    return s.emotions.map((e) => {
      const id = escapeHTML(e.id);
      const isDef = e.id === s.emoDefault;
      return `<div class="cb_emo_row">
        <label class="cb_defdot" title="Use as default"><input type="radio" name="cbr_emodef" value="${id}" ${isDef ? 'checked' : ''}></label>
        <input type="text" class="text_pole m_e_name" data-id="${id}" value="${escapeHTML(e.name)}" style="flex:1;min-width:0;margin:0;">
        <button class="menu_button danger_button m_e_del" data-id="${id}" title="${isDef ? 'Pick a different default before deleting this one' : 'Delete emotion'}" ${isDef ? 'disabled' : ''}><i class="fa-solid fa-trash"></i></button>
      </div>`;
    }).join('');
  }

  function validateDelims(d) {
    const errs = [], warns = [];
    const keys = ['delimSpkOpen', 'delimSpkClose', 'delimNarOpen', 'delimNarClose', 'delimEmo', 'narratorWord', 'locWord',
      'choiceWord', 'choiceSep', 'effectWord', 'weatherWord', 'cgWord', 'enterWord', 'exitWord', 'fxShake', 'fxFlash', 'fxFade', 'wxRain', 'wxSnow', 'wxClear'];
    if (keys.some((k) => !d[k])) errs.push('Every field needs a value.');
    const delims = [d.delimSpkOpen, d.delimSpkClose, d.delimNarOpen, d.delimNarClose];
    const distinct = (arr) => { const a = arr.filter(Boolean).map(lc); return new Set(a).size === a.length; };
    if (!distinct([d.narratorWord, d.locWord, d.choiceWord, d.effectWord, d.weatherWord, d.cgWord, d.enterWord, d.exitWord])) errs.push('The narrator, location, choice, effect, weather, CG, enter and exit keywords all need to be different.');
    if (!distinct([d.fxShake, d.fxFlash, d.fxFade])) errs.push('The three effect names need to be different.');
    if (!distinct([d.wxRain, d.wxSnow, d.wxClear])) errs.push('The three weather names need to be different.');
    if ([d.locWord, d.choiceWord, d.effectWord, d.weatherWord, d.cgWord, d.enterWord, d.exitWord].some((w) => w && w.includes(':'))) errs.push('Tag keywords can\'t contain a colon.');
    if (d.choiceSep && delims.some((x) => x && x.includes(d.choiceSep))) errs.push('The choice separator can\'t appear inside the delimiters.');
    if (d.delimSpkOpen && d.delimSpkOpen === d.delimNarOpen) errs.push('Speaker and narrator need different opening delimiters.');
    if (d.delimEmo && delims.some((x) => x && x.includes(d.delimEmo))) errs.push('The emotion separator can\'t appear inside the other delimiters.');
    const all = [...delims, d.delimEmo].filter(Boolean);
    if (all.some((x) => /[*_`~]/.test(x))) warns.push('Contains * _ ` or ~, which markdown may turn into formatting.');
    if (all.some((x) => /["<>]/.test(x))) warns.push('Quotes or < > can clash with dialogue or HTML.');
    if (all.some((x) => x.length === 1)) warns.push('Single-character delimiters can match normal text by accident.');
    return { errs, warns };
  }

  // Every tag with the user's own delimiters and real names, so people can see exactly what to write in a card.
  function guideRows(s) {
    const v = V();
    const loc = (v.locations.find((l) => l.name) || {}).name || 'Tavern';
    const cg = ((v.cgs || []).find((g) => g.name) || {}).name || 'First Kiss';
    const emo = (s.emotions.find((e) => e.id !== s.emoDefault) || s.emotions[0] || {}).name || 'Happy';
    const spk = (collectSpeakers().find((x) => x.name !== ctx().name1) || {}).name || 'Rafe';
    const no = s.delimNarOpen, nc = s.delimNarClose;
    const rows = [
      { label: 'A character speaks', code: `${s.delimSpkOpen}${spk}${s.delimEmo}${emo}${s.delimSpkClose}: "Hello there."`, hint: `The name comes first, then the emotion after ${s.delimEmo}. The emotion is optional: ${s.delimSpkOpen}${spk}${s.delimSpkClose}: works too. Everything after the tag is that character's line.` },
      { label: 'Narration', code: `${no}${s.narratorWord}${nc}: The tavern was quiet.`, hint: 'No portrait is shown for the narrator.' },
      { label: 'Change the background', code: `${no}${s.locWord}:${loc}${nc}`, hint: 'The name has to match a location you added under Locations. Case, punctuation and a leading "The" are ignored. It stays until the next location tag.' },
    ];
    if (s.nodeChoices) rows.push({ label: 'Offer choices', code: `${no}${s.choiceWord}: Stay ${s.choiceSep} Leave${nc}`, hint: `Put it at the end of a message. Separate the options with ${s.choiceSep}.` });
    if (s.nodeEffects) {
      rows.push({ label: 'Screen effect', code: `${no}${s.effectWord}:${s.fxShake}${nc}`, hint: `Happens once. Also ${s.fxFlash} and ${s.fxFade}.` });
      rows.push({ label: 'Weather', code: `${no}${s.weatherWord}:${s.wxRain}${nc}`, hint: `Stays until it changes. Also ${s.wxSnow} and ${s.wxClear}.` });
    }
    if (s.nodeCG) rows.push({ label: 'Show an illustration', code: `${no}${s.cgWord}:${cg}${nc}`, hint: 'The name has to match a CG you added under CG Scenes.' });
    if (s.nodeSprites) {
      rows.push({ label: 'A character enters', code: `${no}${s.enterWord}:${spk}${nc}`, hint: `Shows their sprite right away, even before they speak. Add a slot to choose where: ${no}${s.enterWord}:${spk} | left${nc} (left, center or right). Once a card uses ${s.enterWord} or ${s.exitWord}, sprites stay until an ${s.exitWord} tag; without them, sprites follow who spoke recently.` });
      rows.push({ label: 'A character leaves', code: `${no}${s.exitWord}:${spk}${nc}`, hint: `Removes their sprite from the next line on. ${no}${s.exitWord}:All${nc} clears the stage.` });
    }
    const sample = [rows[2], rows[1], rows[0], ...rows.slice(3, 4)].filter(Boolean).map((r) => r.code).join('\n');
    return { rows, sample };
  }

  function guideHtml(s) {
    const { rows, sample } = guideRows(s);
    return rows.map((r) => `<div class="cb_g_row"><strong>${escapeHTML(r.label)}</strong>
        <div class="cb_g_line"><code class="cb_code">${escapeHTML(r.code)}</code><button type="button" class="menu_button m_g_cp" data-c="${escapeHTML(r.code)}" title="Copy"><i class="fa-solid fa-copy"></i></button></div>
        <div class="cb_hint">${escapeHTML(r.hint)}</div></div>`).join('')
      + `<div class="cb_g_row"><strong>Example you can paste into a first message</strong>
        <pre class="cb_code" style="margin:4px 0;">${escapeHTML(sample)}</pre>
        <button type="button" class="menu_button m_g_cp" data-c="${escapeHTML(sample)}"><i class="fa-solid fa-copy"></i> Copy example</button></div>`;
  }

  function buildPrompt(s) {
    const sp = `${s.delimSpkOpen}Name${s.delimEmo}Emotion${s.delimSpkClose}`;
    const nr = `${s.delimNarOpen}${s.narratorWord}${s.delimNarClose}`;
    let p = `Format every line as ${sp}: for characters or ${nr}: for narration. Emotions: ${s.emotions.map((e) => e.name).join(', ')}.`;
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
  const SUB_LABEL = { map: 'Maps', opening: 'Opening video' };
  function subSection(name, sec, title, s) {
    const m = window.NTR[name];
    if (m) {
      try { return m.sectionHtml(s); } catch (e) { console.error(`[NTR] ${name} menu crashed`, e); }
    }
    const err = A.moduleError ? A.moduleError(name) : '';
    const off = name === 'map' && !s.nodeMaps;
    const toggle = name === 'map' ? `<label class="checkbox_label"><input type="checkbox" id="m_map_on" ${s.nodeMaps ? 'checked' : ''}><span>Enable maps</span></label>` : '';
    const msg = err ? `${SUB_LABEL[name]} failed to load: ${err}` : off ? 'Its settings appear here once it\'s switched on.' : 'Loading...';
    return `${subHead(sec, title)}<div class="cb_collapse_content" data-ntr-wait="${name}">${toggle}<div class="cb_hint">${escapeHTML(msg)}</div></div>`;
  }

  function loadSub(name, retry = false) {
    if (!A.loadModule) return Promise.resolve(null);
    return A.loadModule(name, retry).then((m) => {
      if (m && document.querySelector(`#cb_modal_overlay [data-ntr-wait="${name}"]`)) A.openMenu();
      return m;
    });
  }

  function loadSubs() {
    const s = settings();
    if (!(A.isOn() && s.nodeEnabled)) return;
    loadSub('opening');
    if (s.nodeMaps) loadSub('map');
  }

  function nodeSectionHtml(s) {
    const sl = (id, key, label, unit, min, max, step) => `
      <div class="cb_row" style="margin-top:8px;"><label>${label}</label><span><span id="m_n_${id}val">${s[key]}</span>${unit}</span></div>
      <input type="range" class="m_n_sl" data-key="${key}" data-id="${id}" min="${min}" max="${max}" step="${step}" value="${s[key]}">`;
    const df = (key, label) => `<label class="cb_dfield"><span>${label}</span><input type="text" class="text_pole m_d_in" data-key="${key}" value="${escapeHTML(s[key])}" maxlength="16"></label>`;
    const ck = (id, on, label) => `<label class="checkbox_label"><input type="checkbox" id="${id}" ${on ? 'checked' : ''}><span>${label}</span></label>`;
    const tg = (word, arg) => escapeHTML(`${s.delimNarOpen}${word}:${arg}${s.delimNarClose}`);
    const artBtns = (k, id) => `<span id="${id}" class="cb_art_btns" style="display:flex;gap:4px;">
                  <button class="menu_button m_art_up" data-k="${k}" title="Upload"><i class="fa-solid fa-upload"></i></button>
                  <button class="menu_button m_art_url" data-k="${k}" title="Use a link"><i class="fa-solid fa-link"></i></button>
                  <button class="menu_button m_art_clr" data-k="${k}" title="Remove image"><i class="fa-solid fa-rotate-left"></i></button></span>`;
    return `
      <div class="cb_section">
        ${secHead('vn', 'fa-comments', 'Visual Novel Mode')}
        <div class="cb_collapse_content">
          ${ck('m_n_enable', s.nodeEnabled, 'Enable Visual Novel Mode')}
          <div id="m_n_body" class="${s.nodeEnabled ? '' : 'cb_dim'}">
            ${subHead('vn_guide', 'How to write your card')}
            <div class="cb_collapse_content">
              <div class="cb_hint">Visual Novel Mode reads these tags from messages. Write them in your card's first message or in anything you write yourself. While the mode is on, the AI is told to use them too (see Prompt for your LLM). These examples use your current symbols and names.</div>
              <div id="m_g_body"></div>
              <button type="button" class="menu_button m_g_goto" style="margin-top:8px;"><i class="fa-solid fa-pen"></i> Change the symbols (delimiters)</button>
            </div>

            ${subHead('vn_play', 'Playback')}
            <div class="cb_collapse_content">
              ${ck('m_n_user', s.nodeUserMsgs, 'Include my messages (yours plays on send, then the reply takes over)')}
              ${ck('m_n_split', s.nodeSplitUntagged, 'Play untagged messages too: quotes become the character\'s lines, the rest becomes narration')}
              ${ck('m_n_tw', s.nodeTypewriter, 'Typewriter effect')}
              ${sl('sp', 'nodeSpeed', 'Typing delay per character:', 'ms', 5, 80, 1)}
              <div style="margin-top:8px;">${ck('m_n_auto', s.nodeAuto, 'Auto-advance to next line')}</div>
              ${sl('ad', 'nodeAutoDelay', 'Auto-advance wait:', 'ms', 500, 8000, 250)}
            </div>

            ${subHead('vn_look', 'Look')}
            <div class="cb_collapse_content">
              ${sl('op', 'nodeOpacity', 'Box opacity:', '%', 30, 100, 1)}
              ${sl('ps', 'nodePortrait', 'Portrait size:', 'px', 60, 240, 5)}
              <div style="margin-top:8px;"><strong>Portrait shape:</strong>${pills('nshape', [['rounded', 'Rounded'], ['round', 'Round'], ['square', 'Square'], ['rect', 'Tall']], s.nodeShape)}</div>
              ${sl('bw', 'nodeBoxWidth', 'Box width (of the chat column):', '%', 40, 100, 1)}
              ${sl('bmin', 'nodeBoxMinH', 'Box minimum height:', 'px', 40, 300, 5)}
              ${sl('bmax', 'nodeBoxMaxH', 'Box maximum height before it scrolls:', 'vh', 10, 70, 1)}
              ${sl('lift', 'nodeBoxLift', 'Lift above the input bar:', 'px', 0, 400, 2)}
              ${sl('fs', 'nodeTextScale', 'Text size:', '%', 70, 180, 5)}
              <div style="margin-top:10px;">${ck('m_n_pbox', s.nodePortraitBox, 'Show the portrait in the box')}</div>
              ${ck('m_n_spr', s.nodeSprites, 'Show sprites on stage')}
              ${sl('ss', 'nodeSpriteScale', 'Sprite size:', '%', 30, 200, 5)}
              ${ck('m_n_sprbase', s.nodeSpriteBase, 'Stage sprites keep the face instead of changing with the emotion')}
              <div class="cb_hint">A speaker's full portrait (the Full portrait row under Speakers) is always their stage sprite, whatever the emotion. Without one, sprites use the emotion images you upload under Speakers, not card avatars. With the keep-the-face option on, emotion images only change in the message box: the stage keeps the speaker's face, which is their default emotion image, or their first emotion image, or their card or persona avatar. Tall transparent PNGs work best. Recent speakers stay on stage and dim while someone else talks.</div>
            </div>

            ${subHead('vn_art', 'Default Art')}
            <div class="cb_collapse_content">
              <div class="cb_hint">Fills in before you upload anything. The built-in art is original and drawn in code.</div>
              <div><strong>Background when nothing matches:</strong>${pills('artbg', [['none', 'SillyTavern\'s own'], ['dusk', 'Dusk'], ['night', 'Night city'], ['room', 'Room'], ['forest', 'Forest'], ['custom', 'Custom']], s.artBg)}</div>
              <div class="cb_art_row"><div id="m_art_bgprev" class="cb_thumbbox cb_wide"></div><span class="cb_spk_name"><small>A character's own default background still comes first.</small></span>${artBtns('artBgImg', 'm_art_bgbtns')}</div>
              <div style="margin-top:10px;"><strong>Sprite for speakers without one:</strong>${pills('artspr', [['builtin', 'Silhouette'], ['custom', 'Custom'], ['none', 'None']], s.artSprite)}</div>
              <div class="cb_art_row"><div id="m_art_sprprev" class="cb_thumbbox"></div><span class="cb_spk_name"><small>The silhouette gets a different tint per character.</small></span>${artBtns('artSpriteImg', 'm_art_sprbtns')}</div>
              <input type="file" id="m_art_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
            </div>

            ${subHead('vn_scene', 'Choices, Effects & Weather')}
            <div class="cb_collapse_content">
              ${ck('m_n_choices', s.nodeChoices, 'Show choices as buttons')}
              <div id="m_n_choices_body" class="${s.nodeChoices ? '' : 'cb_dim'}">
                <div class="cb_hint">${tg(s.choiceWord, ` A ${s.choiceSep} B ${s.choiceSep} C`)} shows clickable buttons above the box. Clicking one puts it in the input box.</div>
                ${ck('m_n_csend', s.choiceSend, 'Send it right away')}
              </div>
              <div style="margin-top:8px;">${ck('m_n_fx', s.nodeEffects, 'Effects and weather')}</div>
              <div id="m_n_fx_body" class="cb_hint ${s.nodeEffects ? '' : 'cb_dim'}">${tg(s.effectWord, s.fxShake)}, ${escapeHTML(s.fxFlash)} or ${escapeHTML(s.fxFade)} fire once when their line plays. ${tg(s.weatherWord, s.wxRain)}, ${escapeHTML(s.wxSnow)} or ${escapeHTML(s.wxClear)} stays until the weather changes, worked out from the chat history like locations.</div>
            </div>

            ${subHead('vn_spk', 'Speakers & Portraits ' + TAG)}
            <div class="cb_collapse_content">
              <div class="cb_hint">Character cards and your persona are matched by name automatically. Open a speaker with the arrow to give them a portrait per emotion. The narrator never gets a portrait.</div>
              ${ck('m_n_autospk', s.nodeAutoSpk, 'Auto-add speakers from the card, persona and chat')}
              <div id="m_n_spk"></div>
              <div class="cb_row" style="margin-top:8px;">
                <input type="text" id="m_n_newspk" class="text_pole" placeholder="Add a speaker (e.g. an NPC)" style="flex:1;margin:0;">
                <button id="m_n_addspk" class="menu_button" style="margin:0;"><i class="fa-solid fa-user-plus"></i> Add</button>
              </div>
              <input type="file" id="m_n_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
            </div>

            ${subHead('vn_emo', 'Emotions')}
            <div class="cb_collapse_content">
              <div class="cb_hint">The dot marks the default. It's used when a tag has no emotion, or one that isn't on this list.</div>
              <div id="m_e_list"></div>
              <div class="cb_row" style="margin-top:6px;">
                <input type="text" id="m_e_new" class="text_pole" placeholder="New emotion" style="flex:1;margin:0;">
                <button id="m_e_add" class="menu_button" style="margin:0;"><i class="fa-solid fa-plus"></i> Add</button>
              </div>
            </div>

            ${subHead('vn_loc', 'Locations ' + TAG)}
            <div class="cb_collapse_content">
              <div class="cb_hint">Add a name below, upload its background, then write <code>${escapeHTML(s.delimNarOpen + s.locWord)}:Name${escapeHTML(s.delimNarClose)}</code> in your card with that name. The background changes when that line plays and stays until the next location. Matching ignores case, punctuation and a leading "The". Anything unmatched uses the default background, then SillyTavern's own. <a href="#" class="m_g_goto">Change the symbols</a> or see <b>How to write your card</b> above for every tag.</div>
              <div id="m_l_list"></div>
              <div class="cb_row" style="margin-top:8px;">
                <input type="text" id="m_l_new" class="text_pole" placeholder="Add a location (e.g. Tavern)" style="flex:1;margin:0;">
                <button id="m_l_add" class="menu_button" style="margin:0;"><i class="fa-solid fa-plus"></i> Add</button>
              </div>
              <input type="file" id="m_l_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
            </div>

            ${subHead('vn_cg', 'CG Scenes ' + TAG)}
            <div class="cb_collapse_content">
              ${ck('m_n_cg', s.nodeCG, 'Show CG scenes')}
              <div id="m_c_body" class="${s.nodeCG ? '' : 'cb_dim'}">
                <div class="cb_hint">Tag a scene as ${tg(s.cgWord, 'Name')}. The illustration fills the screen until the next line. Matching works like locations.</div>
                <div id="m_c_list"></div>
                <div class="cb_row" style="margin-top:8px;">
                  <input type="text" id="m_c_new" class="text_pole" placeholder="Add a CG (e.g. First Kiss)" style="flex:1;margin:0;">
                  <button id="m_c_add" class="menu_button" style="margin:0;"><i class="fa-solid fa-plus"></i> Add</button>
                </div>
              </div>
              <input type="file" id="m_c_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
            </div>

            ${subSection('map', 'vn_map', 'Maps ' + TAG, s)}
            ${subSection('opening', 'vn_open', 'Opening Video ' + TAG, s)}

            ${subHead('vn_tags', 'Tags & Delimiters (change the symbols)')}
            <div class="cb_collapse_content">
              ${ck('m_n_hide', s.nodeHideEmo, 'Hide emotion and scene tags (location, effect, weather, CG, enter, exit) in the normal chat view')}
              <div class="cb_dgrid">
                ${df('delimSpkOpen', 'Speaker open')}${df('delimSpkClose', 'Speaker close')}
                ${df('delimNarOpen', 'Narrator open')}${df('delimNarClose', 'Narrator close')}
                ${df('delimEmo', 'Emotion separator')}${df('narratorWord', 'Narrator keyword')}
                ${df('locWord', 'Location keyword')}
              </div>
              <div class="cb_sub">Scene keywords</div>
              <div class="cb_dgrid">
                ${df('choiceWord', 'Choice keyword')}${df('choiceSep', 'Choice separator')}
                ${df('effectWord', 'Effect keyword')}${df('weatherWord', 'Weather keyword')}
                ${df('fxShake', 'Effect: shake')}${df('fxFlash', 'Effect: flash')}
                ${df('fxFade', 'Effect: fade')}${df('cgWord', 'CG keyword')}
                ${df('wxRain', 'Weather: rain')}${df('wxSnow', 'Weather: snow')}
                ${df('wxClear', 'Weather: clear')}${df('enterWord', 'Enter keyword')}
                ${df('exitWord', 'Exit keyword')}
              </div>
              <div id="m_d_preview" class="cb_code"></div>
              <div id="m_d_msg" class="cb_hint"></div>
              <div class="cb_actions">
                <button id="m_d_apply" class="menu_button"><i class="fa-solid fa-check"></i> Apply</button>
                <button id="m_d_reset" class="menu_button"><i class="fa-solid fa-rotate-left"></i> Reset to defaults</button>
              </div>
            </div>

            ${subHead('vn_prompt', 'Prompt for your LLM')}
            <div class="cb_collapse_content">
              ${ck('m_n_inj', s.nodeInject, 'Add these instructions to every request automatically')}
              <div class="cb_hint">No extra calls: the text rides along with your normal message while Visual Novel Mode is on. It's built from your emotions, delimiters, this character's locations and CGs, and the scene features you have on, so it stays in sync. Untick it if you'd rather paste it into your own preset.</div>
              <textarea id="m_p_text" class="text_pole" readonly rows="4" style="width:100%;resize:vertical;"></textarea>
              <button id="m_p_copy" class="menu_button" style="margin-top:6px;"><i class="fa-solid fa-copy"></i> Copy Prompt</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  function bindVN(overlay, s) {
    const body = overlay.querySelector('#m_n_body');
    const refreshPrompt = () => { overlay.querySelector('#m_p_text').value = buildPrompt(s); };
    function renderGuide() {
      const box = overlay.querySelector('#m_g_body');
      if (!box) return;
      box.innerHTML = guideHtml(s);
      box.querySelectorAll('.m_g_cp').forEach((b) => { b.onclick = () => copyText(b.dataset.c); });
    }
    const gotoDelims = (e) => {
      if (e) e.preventDefault();
      s.uiOpen.vn = true; s.uiOpen.vn_tags = true; save();
      A.openMenu();
      setTimeout(() => document.querySelector('#cb_modal_overlay [data-sec="vn_tags"]')?.scrollIntoView({ block: 'start' }), 60);
    };
    overlay.querySelectorAll('.m_g_goto').forEach((b) => { b.onclick = gotoDelims; });
    const refreshAll = () => { renderGuide(); refreshPrompt(); updateInjection(); if (s.nodeEnabled) nodeLoad({ animate: false }); };

    overlay.querySelector('#m_n_enable').onchange = function() {
      s.nodeEnabled = this.checked; save();
      if (this.checked) s.vnUsed = true;
      body.classList.toggle('cb_dim', !this.checked);
      refresh({ switchedOn: this.checked });
    };
    const chk = (id, key, after) => { const el = overlay.querySelector(id); if (el) el.onchange = function() { s[key] = this.checked; save(); if (after) after(); }; };
    chk('#m_n_user', 'nodeUserMsgs', () => { refreshPrompt(); nodeLoad({ animate: false }); });
    chk('#m_n_tw', 'nodeTypewriter');
    chk('#m_n_pbox', 'nodePortraitBox', () => { if (s.nodeEnabled) nodeShow(false); });
    chk('#m_n_spr', 'nodeSprites', updateStage);
    chk('#m_n_sprbase', 'nodeSpriteBase', updateStage);
    chk('#m_n_inj', 'nodeInject', updateInjection);
    chk('#m_n_auto', 'nodeAuto');
    chk('#m_n_hide', 'nodeHideEmo', () => {
      if (s.nodeHideEmo) cleanEmoTags();
      else if (typeof ctx().reloadCurrentChat === 'function') ctx().reloadCurrentChat();
    });
    const dimIf = (sel, on) => overlay.querySelector(sel)?.classList.toggle('cb_dim', !on);
    chk('#m_n_split', 'nodeSplitUntagged', () => { if (s.nodeEnabled) nodeLoad({ animate: false }); });
    chk('#m_n_choices', 'nodeChoices', () => { dimIf('#m_n_choices_body', s.nodeChoices); refreshAll(); });
    chk('#m_n_csend', 'choiceSend');
    chk('#m_n_fx', 'nodeEffects', () => { dimIf('#m_n_fx_body', s.nodeEffects); refreshAll(); });
    chk('#m_n_autospk', 'nodeAutoSpk', () => { renderSpk(); refreshAll(); });
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

    // Emotions
    const renderEmo = () => {
      const box = overlay.querySelector('#m_e_list');
      box.innerHTML = emoRowsHtml(s);
      onPills(box, 'emodef', (v) => { s.emoDefault = v; save(); renderEmo(); renderSpk(); refreshAll(); });
      box.querySelectorAll('.m_e_name').forEach((inp) => {
        inp.onchange = () => {
          const e = s.emotions.find((x) => x.id === inp.dataset.id);
          const nm = inp.value.trim();
          if (!nm || s.emotions.some((x) => x !== e && x.name.toLowerCase() === nm.toLowerCase())) {
            toastr.warning('Emotion names need to be unique and not empty.', 'Visual Novel');
            inp.value = e.name;
            return;
          }
          e.name = nm; save(); renderSpk(); refreshAll();
        };
      });
      box.querySelectorAll('.m_e_del').forEach((b) => {
        b.onclick = () => {
          const id = b.dataset.id;
          if (id === s.emoDefault) return;
          const e = s.emotions.find((x) => x.id === id);
          const used = Object.values(V().emoImgs).some((m) => m[id]);
          if (used && !confirm(`Delete "${e.name}" and the portraits uploaded for it?`)) return;
          s.emotions = s.emotions.filter((x) => x.id !== id);
          const olds = [];
          for (const m of Object.values(V().emoImgs)) { if (m[id]) olds.push(m[id]); delete m[id]; }
          save(); renderEmo(); renderSpk(); refreshAll();
          olds.forEach((u) => A.deleteFileIfUnused(u));
        };
      });
    };
    const addEmo = () => {
      const inp = overlay.querySelector('#m_e_new');
      const nm = inp.value.trim();
      if (!nm) return;
      if (s.emotions.some((x) => x.name.toLowerCase() === nm.toLowerCase())) { toastr.warning('That emotion already exists.', 'Visual Novel'); return; }
      s.emotions.push({ id: 'emo_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name: nm });
      inp.value = '';
      save(); renderEmo(); renderSpk(); refreshAll();
    };
    overlay.querySelector('#m_e_add').onclick = addEmo;
    overlay.querySelector('#m_e_new').onkeydown = (e) => { if (e.key === 'Enter') addEmo(); };

    // Speakers
    const nFile = overlay.querySelector('#m_n_file');
    let pending = null;
    const renderSpk = () => {
      const box = overlay.querySelector('#m_n_spk');
      box.innerHTML = spkRowsHtml(s);
      box.querySelectorAll('.m_n_up').forEach((b) => { b.onclick = () => { pending = { key: b.dataset.key, emo: b.dataset.emo, full: !!b.dataset.full }; nFile.click(); }; });
      box.querySelectorAll('.m_n_url').forEach((b) => {
        b.onclick = async () => {
          const url = await askImageUrl('Portrait');
          if (url) setSpkImage({ key: b.dataset.key, emo: b.dataset.emo, full: !!b.dataset.full }, url);
        };
      });
      box.querySelectorAll('.m_n_clr').forEach((b) => {
        b.onclick = () => {
          const { key, emo, full } = b.dataset;
          let old;
          if (full) { old = V().sprites[key]; delete V().sprites[key]; }
          else if (V().emoImgs[key]) { old = V().emoImgs[key][emo]; delete V().emoImgs[key][emo]; }
          save(); renderSpk(); refreshAll();
          A.deleteFileIfUnused(old).then((gone) => {
            if (!gone && /^\/?user\/files\//.test(String(old || ''))) toastr.info('Removed. The file itself was kept because something else still uses it.', 'Visual Novel');
          });
        };
      });
      box.querySelectorAll('.m_n_exp').forEach((b) => {
        b.onclick = () => { const k = b.dataset.key; if (spkOpen.has(k)) spkOpen.delete(k); else spkOpen.add(k); renderSpk(); };
        b.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b.click(); } };
      });
      box.querySelectorAll('.m_n_rm').forEach((b) => {
        b.onclick = () => {
          const k = b.dataset.key;
          if (b.dataset.custom) {
            if (!confirm('Remove this custom speaker and their uploaded portraits?')) return;
            V().customSpk = V().customSpk.filter((n) => n.toLowerCase() !== k);
            const olds = [V().sprites[k], ...Object.values(V().emoImgs[k] || {})].filter(Boolean);
            delete V().sprites[k];
            delete V().emoImgs[k];
            setTimeout(() => olds.forEach((u) => A.deleteFileIfUnused(u)), 0);
          } else {
            // Detected from the card, persona or chat: hide it. Uploaded portraits are kept for a later restore.
            const c = ctx();
            if ([c.name1, c.name2].some((n) => lc(n) === k) && !confirm('This is your persona or the current character. Hide it from the list? Their portraits are kept, and you can restore it later.')) return;
            if (!V().hiddenSpk.some((n) => lc(n) === k)) V().hiddenSpk.push(k);
          }
          spkOpen.delete(k);
          save(); renderSpk(); refreshAll();
        };
      });
      box.querySelector('.m_n_unhide')?.addEventListener('click', (e) => {
        e.preventDefault();
        V().hiddenSpk = [];
        save(); renderSpk(); refreshAll();
      });
      pruneMissing().then((n) => {
        if (!n) return;
        save(); refreshAll();
        if (box.isConnected) renderSpk();
        toastr.info(`Removed ${n} link${n === 1 ? '' : 's'} to deleted portrait files.`, 'Visual Novel');
      });
    };
    const setSpkImage = (p, url) => {
      let old;
      if (p.full) { old = V().sprites[p.key]; V().sprites[p.key] = url; }
      else if (p.emo) {
        if (!V().emoImgs[p.key]) V().emoImgs[p.key] = {};
        old = V().emoImgs[p.key][p.emo];
        V().emoImgs[p.key][p.emo] = url;
      }
      save(); renderSpk(); refreshAll();
      A.deleteFileIfUnused(old);
    };
    nFile.onchange = async () => {
      if (!nFile.files.length || !pending) return;
      try {
        setSpkImage(pending, await uploadPortrait(nFile.files[0], pending.full ? 2048 : 768));
      } catch (e) {
        console.error('[chatvisuals vn upload]', e);
        toastr.error(e.message || 'Portrait upload failed', 'Visual Novel');
      }
      nFile.value = '';
    };
    const addSpk = () => {
      const inp = overlay.querySelector('#m_n_newspk');
      const nm = inp.value.trim();
      if (!nm) return;
      const k = nm.toLowerCase();
      if (k === String(s.narratorWord).trim().toLowerCase()) { toastr.warning('That name is your narrator keyword.', 'Visual Novel'); return; }
      if ([s.delimSpkOpen, s.delimSpkClose, s.delimEmo].some((d) => nm.includes(d))) { toastr.warning('Names can\'t contain your tag delimiters.', 'Visual Novel'); return; }
      V().hiddenSpk = V().hiddenSpk.filter((n) => lc(n) !== k);
      if (!V().customSpk.some((n) => n.toLowerCase() === k)) V().customSpk.push(nm);
      spkOpen.add(k);
      inp.value = '';
      save(); renderSpk(); refreshAll();
    };
    overlay.querySelector('#m_n_addspk').onclick = addSpk;
    overlay.querySelector('#m_n_newspk').onkeydown = (e) => { if (e.key === 'Enter') addSpk(); };

    // Delimiters
    const dIns = [...overlay.querySelectorAll('.m_d_in')];
    const readD = () => Object.fromEntries(dIns.map((i) => [i.dataset.key, i.value.trim()]));
    const preview = () => {
      const d = readD();
      overlay.querySelector('#m_d_preview').textContent =
        `${d.delimSpkOpen}Rafe${d.delimEmo}Neutral${d.delimSpkClose}: "Dialogue."\n${d.delimNarOpen}${d.narratorWord}${d.delimNarClose}: Narration.\n${d.delimNarOpen}${d.locWord}:Tavern${d.delimNarClose}`
        + `\n${d.delimNarOpen}${d.choiceWord}: Stay ${d.choiceSep} Leave${d.delimNarClose}\n${d.delimNarOpen}${d.effectWord}:${d.fxShake}${d.delimNarClose} ${d.delimNarOpen}${d.weatherWord}:${d.wxRain}${d.delimNarClose} ${d.delimNarOpen}${d.cgWord}:First Kiss${d.delimNarClose}`;
      const { errs, warns } = validateDelims(d);
      overlay.querySelector('#m_d_msg').innerHTML = errs.map((x) => `<div class="cb_err">${escapeHTML(x)}</div>`).join('') + warns.map((x) => `<div class="cb_warn">${escapeHTML(x)}</div>`).join('');
    };
    const applyD = (d) => {
      const { errs } = validateDelims(d);
      if (errs.length) { toastr.error(errs[0], 'Visual Novel'); return false; }
      Object.assign(s, d);
      save(); renderSpk(); refreshAll(); cleanEmoTags();
      toastr.success('Delimiters updated', 'Visual Novel');
      return true;
    };
    dIns.forEach((i) => { i.oninput = preview; });
    overlay.querySelector('#m_d_apply').onclick = () => applyD(readD());
    overlay.querySelector('#m_d_reset').onclick = () => {
      dIns.forEach((i) => { i.value = A.DEFAULTS[i.dataset.key]; });
      preview();
      applyD(readD());
    };

    // Prompt
    overlay.querySelector('#m_p_copy').onclick = () => copyText(overlay.querySelector('#m_p_text').value, 'Prompt copied');

    // Locations
    const lFile = overlay.querySelector('#m_l_file');
    let lPending = null;
    const renderLoc = () => {
      const box = overlay.querySelector('#m_l_list');
      box.innerHTML = locRowsHtml();
      const v = V();
      box.querySelectorAll('.m_l_name').forEach((inp) => {
        inp.onchange = () => {
          const l = v.locations.find((x) => x.id === inp.dataset.id);
          const nm = inp.value.trim();
          if (!l) return;
          if (!nm || v.locations.some((x) => x !== l && normLoc(x.name) === normLoc(nm))) {
            toastr.warning('Location names need to be unique and not empty.', 'Visual Novel');
            inp.value = l.name;
            return;
          }
          l.name = nm; save(); refreshAll();
        };
      });
      box.querySelectorAll('.m_l_up').forEach((b) => { b.onclick = () => { lPending = b.dataset.id; lFile.click(); }; });
      box.querySelectorAll('.m_l_url').forEach((b) => {
        b.onclick = async () => {
          const url = await askImageUrl('Background');
          if (url) setLocImage(b.dataset.id, url);
        };
      });
      box.querySelectorAll('.m_l_clr').forEach((b) => {
        b.onclick = () => {
          let old;
          if (b.dataset.id === '__default__') { old = v.locDefault; v.locDefault = ''; }
          else { const l = v.locations.find((x) => x.id === b.dataset.id); if (l) { old = l.url; l.url = ''; } }
          save(); renderLoc(); refreshAll();
          A.deleteFileIfUnused(old);
        };
      });
      box.querySelectorAll('.m_l_del').forEach((b) => {
        b.onclick = () => {
          const l = v.locations.find((x) => x.id === b.dataset.id);
          if (!l || !confirm(`Delete the location "${l.name}"${l.url ? ' and its background' : ''}?`)) return;
          v.locations = v.locations.filter((x) => x !== l);
          for (const mp of v.maps || []) mp.pins = (mp.pins || []).filter((p) => p.loc !== l.id || p.map).map((p) => (p.loc === l.id ? { ...p, loc: '' } : p));
          save(); renderLoc(); refreshAll();
          A.deleteFileIfUnused(l.url);
        };
      });
    };
    const setLocImage = (id, url) => {
      const v = V();
      let old;
      if (id === '__default__') { old = v.locDefault; v.locDefault = url; }
      else { const l = v.locations.find((x) => x.id === id); if (l) { old = l.url; l.url = url; } }
      save(); renderLoc(); refreshAll();
      A.deleteFileIfUnused(old);
    };
    lFile.onchange = async () => {
      if (!lFile.files.length || !lPending) return;
      try {
        setLocImage(lPending, await uploadPortrait(lFile.files[0], 2560, 'vnloc'));
      } catch (e) {
        console.error('[NTR vn location upload]', e);
        toastr.error(e.message || 'Background upload failed', 'Visual Novel');
      }
      lFile.value = '';
    };
    const addLoc = () => {
      const inp = overlay.querySelector('#m_l_new');
      const nm = inp.value.trim();
      if (!nm) { toastr.info('Type the location\'s name in the box first, then click Add.', 'Visual Novel'); inp.focus(); return; }
      if (!A.store()) { toastr.warning('Open a character chat first. Locations are saved per character.', 'Visual Novel'); return; }
      const v = V();
      if (v.locations.some((x) => normLoc(x.name) === normLoc(nm))) { toastr.warning('That location already exists.', 'Visual Novel'); return; }
      try {
        if (!Array.isArray(v.locations)) v.locations = [];
        v.locations.push({ id: newId('loc'), name: nm, url: '' });
        inp.value = '';
        save(); renderLoc(); refreshAll();
      } catch (e) {
        console.error('[NTR] Could not add the location', e);
        toastr.error('Could not add the location: ' + (e && e.message ? e.message : e), 'Visual Novel');
      }
    };
    overlay.querySelector('#m_l_add').onclick = addLoc;
    overlay.querySelector('#m_l_new').onkeydown = (e) => { if (e.key === 'Enter') addLoc(); };

    // CG scenes
    const cFile = overlay.querySelector('#m_c_file');
    let cPending = null;
    const renderCg = () => {
      const box = overlay.querySelector('#m_c_list');
      box.innerHTML = cgRowsHtml();
      const v = V();
      box.querySelectorAll('.m_c_name').forEach((inp) => {
        inp.onchange = () => {
          const g = v.cgs.find((x) => x.id === inp.dataset.id);
          const nm = inp.value.trim();
          if (!g) return;
          if (!nm || v.cgs.some((x) => x !== g && normLoc(x.name) === normLoc(nm))) {
            toastr.warning('CG names need to be unique and not empty.', 'Visual Novel');
            inp.value = g.name;
            return;
          }
          g.name = nm; save(); refreshAll();
        };
      });
      box.querySelectorAll('.m_c_up').forEach((b) => { b.onclick = () => { cPending = b.dataset.id; cFile.click(); }; });
      box.querySelectorAll('.m_c_url').forEach((b) => {
        b.onclick = async () => {
          const url = await askImageUrl('Illustration');
          if (url) setCgImage(b.dataset.id, url);
        };
      });
      box.querySelectorAll('.m_c_clr').forEach((b) => {
        b.onclick = () => {
          const g = v.cgs.find((x) => x.id === b.dataset.id);
          if (!g) return;
          const old = g.url; g.url = '';
          save(); renderCg(); refreshAll();
          A.deleteFileIfUnused(old);
        };
      });
      box.querySelectorAll('.m_c_del').forEach((b) => {
        b.onclick = () => {
          const g = v.cgs.find((x) => x.id === b.dataset.id);
          if (!g || !confirm(`Delete the CG "${g.name}"${g.url ? ' and its image' : ''}?`)) return;
          v.cgs = v.cgs.filter((x) => x !== g);
          save(); renderCg(); refreshAll();
          A.deleteFileIfUnused(g.url);
        };
      });
    };
    const setCgImage = (id, url) => {
      const g = V().cgs.find((x) => x.id === id);
      let old;
      if (g) { old = g.url; g.url = url; }
      save(); renderCg(); refreshAll();
      A.deleteFileIfUnused(old);
    };
    cFile.onchange = async () => {
      if (!cFile.files.length || !cPending) return;
      try {
        setCgImage(cPending, await uploadPortrait(cFile.files[0], 2560, 'vncg'));
      } catch (e) {
        console.error('[NTR vn CG upload]', e);
        toastr.error(e.message || 'CG upload failed', 'Visual Novel');
      }
      cFile.value = '';
    };
    const addCg = () => {
      const inp = overlay.querySelector('#m_c_new');
      const nm = inp.value.trim();
      if (!nm) { toastr.info('Type the CG\'s name in the box first, then click Add.', 'Visual Novel'); inp.focus(); return; }
      if (!A.store()) { toastr.warning('Open a character chat first. CGs are saved per character.', 'Visual Novel'); return; }
      const v = V();
      if (v.cgs.some((x) => normLoc(x.name) === normLoc(nm))) { toastr.warning('That CG already exists.', 'Visual Novel'); return; }
      v.cgs.push({ id: newId('cg'), name: nm, url: '' });
      inp.value = '';
      save(); renderCg(); refreshAll();
    };
    overlay.querySelector('#m_c_add').onclick = addCg;
    overlay.querySelector('#m_c_new').onkeydown = (e) => { if (e.key === 'Enter') addCg(); };

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
        const url = await askImageUrl(b.dataset.k === 'artBgImg' ? 'Default background' : 'Default sprite');
        if (url) setArtImage(b.dataset.k, url);
      };
    });
    overlay.querySelectorAll('.m_art_clr').forEach((b) => {
      b.onclick = () => {
        const k = b.dataset.k;
        const old = s[k];
        s[k] = '';
        save(); renderArt(); refreshAll(); updateStage();
        A.deleteFileIfUnused(old);
      };
    });
    artFile.onchange = async () => {
      if (!artFile.files.length || !artPending) return;
      try {
        setArtImage(artPending, await uploadPortrait(artFile.files[0], artPending === 'artBgImg' ? 2560 : 1600, 'vnart'));
      } catch (e) {
        console.error('[NTR vn art upload]', e);
        toastr.error(e.message || 'Upload failed', 'Visual Novel');
      }
      artFile.value = '';
    };

    renderEmo(); renderSpk(); renderLoc(); renderCg(); renderArt(); preview(); refreshPrompt(); renderGuide();
    for (const name of ['map', 'opening']) {
      const m = window.NTR[name];
      if (m) { try { m.bind(overlay, s); } catch (e) { console.error(`[NTR] ${name} menu crashed`, e); } }
    }
  }

  function cgRowsHtml() {
    if (!A.store()) return '<div class="cb_hint">Open a character chat first. CGs are saved per character.</div>';
    const v = V();
    if (!v.cgs.length) return '<div class="cb_hint">No CGs yet.</div>';
    return v.cgs.map((g) => {
      const id = escapeHTML(g.id);
      return `<div class="cb_spk"><div class="cb_spk_row">
        <div class="cb_thumbbox cb_wide">${media(g.url) ? `<img src="${escapeHTML(media(g.url))}" alt="">` : '<i class="fa-solid fa-image"></i>'}</div>
        <input type="text" class="text_pole m_c_name" data-id="${id}" value="${escapeHTML(g.name)}" style="flex:1;min-width:0;margin:0;">
        <button class="menu_button m_c_up" data-id="${id}" title="Upload illustration"><i class="fa-solid fa-upload"></i></button>
        <button class="menu_button m_c_url" data-id="${id}" title="Use a link for the illustration"><i class="fa-solid fa-link"></i></button>
        <button class="menu_button m_c_clr" data-id="${id}" title="Remove image" ${g.url ? '' : 'disabled'}><i class="fa-solid fa-rotate-left"></i></button>
        <button class="menu_button danger_button m_c_del" data-id="${id}" title="Delete CG"><i class="fa-solid fa-trash"></i></button>
      </div></div>`;
    }).join('');
  }

  function locRowsHtml() {
    if (!A.store()) return '<div class="cb_hint">Open a character chat first. Locations are saved per character.</div>';
    const v = V();
    const row = (id, name, url, isDef) => `
      <div class="cb_spk"><div class="cb_spk_row">
        <div class="cb_thumbbox cb_wide">${media(url) ? `<img src="${escapeHTML(media(url))}" alt="">` : '<i class="fa-solid fa-image"></i>'}</div>
        ${isDef
          ? '<span class="cb_spk_name"><strong>Default background</strong><small>used when nothing matches</small></span>'
          : `<input type="text" class="text_pole m_l_name" data-id="${id}" value="${escapeHTML(name)}" style="flex:1;min-width:0;margin:0;">`}
        <button class="menu_button m_l_up" data-id="${id}" title="Upload background"><i class="fa-solid fa-upload"></i></button>
        <button class="menu_button m_l_url" data-id="${id}" title="Use a link for the background"><i class="fa-solid fa-link"></i></button>
        <button class="menu_button m_l_clr" data-id="${id}" title="Remove image" ${url ? '' : 'disabled'}><i class="fa-solid fa-rotate-left"></i></button>
        ${isDef ? '' : `<button class="menu_button danger_button m_l_del" data-id="${id}" title="Delete location"><i class="fa-solid fa-trash"></i></button>`}
      </div></div>`;
    return row('__default__', '', v.locDefault, true) + v.locations.map((l) => row(escapeHTML(l.id), l.name, l.url, false)).join('');
  }

  async function uploadPortrait(f, maxDim = 768, prefix = 'vnpfp') {
    let url = await readDataURL(f);
    let converted = false;
    if (f.type !== 'image/gif') {
      const i = await loadImg(url);
      const mx = Math.max(i.width, i.height);
      if (mx > maxDim) {
        const k = maxDim / mx;
        const c = document.createElement('canvas');
        c.width = Math.round(i.width * k); c.height = Math.round(i.height * k);
        c.getContext('2d').drawImage(i, 0, 0, c.width, c.height);
        url = c.toDataURL('image/png');
        converted = true;
      }
    }
    let ext = (f.name.split('.').pop() || '').toLowerCase();
    if (converted || !['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) ext = 'png';
    const name = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const res = await fetch('/api/files/upload', {
      method: 'POST',
      headers: ctx().getRequestHeaders(),
      body: JSON.stringify({ name, data: url.split(',')[1] }),
    });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    const j = await res.json();
    return '/' + String(j.path).replace(/^\/+/, '');
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
    ov.style.bottom = ((form ? window.innerHeight - form.getBoundingClientRect().top : 82) + s.nodeBoxLift) + 'px';
    placeCG();
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
          <button type="button" data-a="older" title="Older message"><i class="fa-solid fa-angles-left"></i></button>
          <button type="button" data-a="prev" title="Previous line"><i class="fa-solid fa-angle-left"></i></button>
          <span class="cb_n_count"></span>
          <button type="button" data-a="next" title="Next line"><i class="fa-solid fa-angle-right"></i></button>
          <button type="button" data-a="newer" title="Newer message"><i class="fa-solid fa-angles-right"></i></button>
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
    const port = ov.querySelector('.cb_n_port');
    port.querySelector('img').onerror = () => port.classList.add('cb_noimg');
    window.addEventListener('resize', () => { placeNode(); updateStage(); });
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(placeNode);
      for (const id of ['chat', 'form_sheld']) { const el = document.getElementById(id); if (el) ro.observe(el); }
    }
    nodeApplyLook();
    return ov;
  }

  function nodeStopTyping() {
    clearInterval(node.typer); node.typer = null;
    clearTimeout(node.auto); node.auto = null;
    node.typing = false; node.finish = null;
  }

  function typeInto(el, html, speed, done) {
    el.innerHTML = html;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const items = [];
    let n;
    while ((n = walker.nextNode())) { items.push({ n, t: n.nodeValue }); n.nodeValue = ''; }
    let ii = 0, ci = 0;
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

  function nodeShow(animate) {
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
    nameEl.textContent = seg.name || '';
    nameEl.style.display = seg.name ? '' : 'none';

    const port = ov.querySelector('.cb_n_port');
    const img = port.querySelector('img');
    const src = isChar ? resolvePortrait(seg.name, seg.emo) : null;
    port.style.display = isChar && s.nodePortraitBox ? '' : 'none';
    port.classList.toggle('cb_noimg', isChar && !src);
    if (src && img.getAttribute('src') !== src) { port.classList.remove('cb_noimg'); img.src = src; }

    const c = ctx();
    ov.classList.toggle('cb_right', isChar && !!c.name1 && seg.name.toLowerCase() === c.name1.toLowerCase());
    ov.querySelector('.cb_n_count').textContent = `${node.pos + 1}/${node.list.length} \u00B7 ${node.i + 1}/${node.segs.length}`;

    const text = ov.querySelector('.cb_n_text');
    const arrow = ov.querySelector('.cb_n_arrow');
    const more = node.i < node.segs.length - 1;
    const html = nodeFmt(seg.text);
    arrow.textContent = '';
    const waits = !!(s.nodeChoices && seg.choices && seg.choices.length);
    const done = () => {
      node.typing = false; node.finish = null;
      arrow.textContent = more ? '\u25BC' : '';
      renderChoices(seg);
      if (s.nodeAuto && more && !waits && !node.held) node.auto = setTimeout(() => nodeStep(1), s.nodeAutoDelay);
    };
    if (animate && s.nodeTypewriter && s.nodeSpeed > 0) typeInto(text, html, s.nodeSpeed, done);
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
    L.style.bottom = (form ? Math.max(0, window.innerHeight - form.getBoundingClientRect().top) : 0) + 'px';
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
  const castNew = () => ({ explicit: false, list: [] });
  const castSnap = (st) => ({ explicit: st.explicit, list: st.list.map((x) => ({ ...x })) });
  function castStep(st, seg) {
    if (seg.kind === 'enter') {
      const [nm, sp] = String(seg.name).split('|').map((x) => x.trim());
      const key = lc(nm);
      if (!key) return;
      const spot = ['left', 'center', 'right'].includes(lc(sp)) ? lc(sp) : '';
      st.list = st.list.filter((x) => x.key !== key);
      st.list.push({ key, name: nm, spot });
      st.explicit = true;
    } else if (seg.kind === 'exit') {
      const key = lc(seg.name);
      st.list = key === 'all' ? [] : st.list.filter((x) => x.key !== key);
      st.explicit = true;
    } else if (seg.kind === 'char' && seg.name) {
      const key = lc(seg.name);
      if (!st.list.some((x) => x.key === key)) st.list.push({ key, name: seg.name, spot: '' });
    }
  }
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
    const re = new RegExp(`${reEsc(s.delimNarOpen)}[ \\t]*(${words})[ \\t]*:[ \\t]*((?:(?!${nc})[^\\n]){1,80}?)[ \\t]*${nc}`, 'gi');
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

  function nodeParseCurrent() {
    const c = ctx();
    const idx = node.list[node.pos];
    const m = c.chat[idx];
    node.prevTail = [];
    if (!m) { node.segs = []; node.endLoc = null; node.endWx = null; node.endCast = null; return; }
    const s = settings();
    let { loc, wx } = stickyAt(idx);
    const cast = castAt(idx);
    const segs = [];
    // Effects and CGs belong to the next line; choices to the line before them.
    let fx = [], cg = null, choice = null;
    for (const seg of parseMsg(m)) {
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
    node.segs = segs;
    node.endLoc = loc;
    node.endWx = wx;
    node.endCast = castSnap(cast);
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

  function spotBoxes() {
    const W = window.innerWidth;
    const chat = document.getElementById('chat');
    const r = chat ? chat.getBoundingClientRect() : null;
    if (!r || r.left < 150) return { left: [0, W / 3], center: [W / 3, W / 3], right: [(2 * W) / 3, W / 3] };
    return { left: [0, r.left], center: [r.left, r.width], right: [r.right, Math.max(0, W - r.right)] };
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
    const persona = String(ctx().name1 || '').toLowerCase();
    for (const k of [...stageSpots.keys()]) if (!info.has(k) || !present.some(([pk]) => pk === k)) stageSpots.delete(k);
    // A slot chosen with an Enter tag wins over the automatic one.
    for (const [k, sp] of wanted) if (sp && stageSpots.has(k) && stageSpots.get(k) !== sp) stageSpots.delete(k);
    const used = new Set(stageSpots.values());
    const personaIn = present.some(([k]) => k === persona);
    for (const [k] of present) {
      if (stageSpots.has(k)) continue;
      const pref = wanted.get(k) ? [wanted.get(k), 'center', 'left', 'right'] : k === persona ? ['right', 'center', 'left'] : personaIn ? ['left', 'center', 'right'] : ['left', 'right', 'center'];
      const spot = pref.find((x) => !used.has(x));
      if (spot) { stageSpots.set(k, spot); used.add(spot); }
    }
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
    nodeParseCurrent();
    node.i = 0;
    nodeShow(false);
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
    const sig = chatSig();
    const opened = sig !== lastSig;
    lastSig = sig;
    if (opened) safe(() => window.NTR.map?.close());
    if (!s.nodeEnabled || !A.isOn()) {
      nodeStopTyping(); ov.style.display = 'none'; node.list = []; setLocation(null); clearScene(); updateStage();
      node.held = false;
      safe(() => window.NTR.map?.close());
      safe(() => window.NTR.opening?.abort());
      return;
    }
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
    node.pos = node.list.length - 1;
    nodeParseCurrent();
    node.i = 0;
    nodeShow(!!opts.animate);
  }

  function nodeQueue(animate) {
    nodeQAnim = nodeQAnim || !!animate;
    clearTimeout(nodeQ);
    nodeQ = setTimeout(() => { const a = nodeQAnim; nodeQAnim = false; nodeLoad({ animate: a }); }, 60);
  }

  function ensure() { ensureChatObserver(); }

  function refresh(opts = {}) {
    applyStyle();
    loadSubs();
    nodeLoad({ animate: false, switchedOn: !!opts.switchedOn });
    ensure();
    syncNodeToggle();
    updateInjection();
    if (A.refreshFg) A.refreshFg();
  }

  function teardown() {
    applyStyle();
    nodeStopTyping();
    const ov = document.getElementById('cb_node');
    if (ov) ov.style.display = 'none';
    node.list = [];
    node.held = false;
    setLocation(null);
    clearScene();
    safe(() => window.NTR.map?.close());
    safe(() => window.NTR.opening?.abort());
    updateStage();
    updateInjection();
    syncNodeToggle();
    if (A.refreshFg) A.refreshFg();
  }

  window.NTR.vn = {
    version: VN_VERSION,
    sectionHtml: nodeSectionHtml,
    bind: bindVN,
    refresh,
    teardown,
    ensure,
    queue: nodeQueue,
    cleanEmoTags,
    // For map.js and opening.js
    data: V,
    normLoc,
    newId,
    uploadImage: uploadPortrait,
    putInInput,
    currentLoc,
    visitedLocs,
    openingHooks: opHooks,
    titleName: () => { const c = ctx(); if (c.groupId) return ((c.groups || []).find((g) => g.id === c.groupId) || {}).name || ''; return c.name2 || ''; },
    titleArt: () => {
      const c = ctx();
      if (c.groupId || !c.name2) return null;
      return resolveAvatar(c.name2);
    },
    sceneBg: () => locUrl(currentLoc()) || (A.bannerImage ? A.bannerImage() : ''),
  };
})();
