// Nitwit Tavern Redesign: Overlays module.
// Loaded by index.js when the header banner or foreground images are on, or when the menu opens. If this file breaks,
// the rest of the extension keeps working.
// The header banner above the chat (images that can rotate, a YouTube loop or a video) and the foreground images beside
// the chat panel, with their page in the menu. Their settings, card data and Edit Placement stay in index.js.
(() => {
  const OVERLAYS_VERSION = '2.69.10';
  const A = window.NTR && window.NTR.api;
  if (!A) { console.error('[NTR] overlays.js loaded without the core (index.js).'); return; }
  const { settings, save, isOn, currentKey, peek, bannerSrc, fgData, FG_POS, fgTransform, cardNum, rangeNum, rangeAttrs, numRange, cNum,
    media, escapeHTML, TAG, pills, onPills, pageHtml, pagePart, card, loadImg, getYouTubeId, store, uploadHere, uploadImage, uploadVideo,
    askImageUrl, askVideoUrl, askYes, deleteFileIfUnused, startPlacement, drawPlace, DEFAULTS, ROT_KEYS, BANNER_LOOK_KEYS, startChar } = A;
  const openCombinedModal = () => A.openMenu();

  const CSS = `
      #cb_banner { width: 100%; height: var(--cb-h, 120px); position: relative; overflow: hidden; display: block; border-radius: 10px; margin-bottom: var(--cb-gap, 10px); }
      #cb_banner.cb_overlap { position: absolute !important; top: 0; left: 0; right: 0; z-index: 100; margin-bottom: 0 !important; }
      #cb_banner .cb_nav { position: absolute; right: 8px; bottom: 8px; z-index: 2; display: none; align-items: center; gap: 6px; padding: 3px 8px; border-radius: 999px; background: rgba(0,0,0,0.55); color: #fff; font-size: 12px; line-height: 1.2; opacity: 0; transition: opacity .15s; }
      #cb_banner:hover .cb_nav { opacity: 1; }
      @media (hover: none) { #cb_banner .cb_nav { opacity: 1; } }
      #cb_banner .cb_nav_btn { background: none; border: none; color: inherit; cursor: pointer; padding: 2px 5px; line-height: 1; }
      #cb_banner .cb_vid { position: relative; z-index: 1; display: block; }
      #cb_banner .cb_snd { position: absolute; left: 8px; bottom: 8px; z-index: 2; padding: 5px 9px; border-radius: 999px; background: rgba(0,0,0,0.55); color: #fff; font-size: 12px; opacity: 0; transition: opacity .15s; }
      #cb_banner:hover .cb_snd { opacity: 1; }
      @media (hover: none) { #cb_banner .cb_snd { opacity: 1; } }
      .cb_thumbs { position: relative; display: flex; gap: 6px; overflow-x: auto; padding: 4px 0; margin-top: 6px; }
      .cb_thumb { flex: none; width: 64px; height: 40px; object-fit: cover; border-radius: 4px; border: 2px solid transparent; cursor: pointer; opacity: 0.7; }
      .cb_thumb.active { border-color: var(--SmartThemeQuoteColor, #6cf); opacity: 1; }
      #cb_banner .cb_wall { position: absolute; background-size: cover; background-position: center; background-repeat: no-repeat; pointer-events: none; z-index: 0; }
      #cb_banner .cb_img, #cb_banner .cb_yt { position: relative; z-index: 1; }
      #cb_banner .cb_xfade { position: absolute; left: 0; top: 0; z-index: 1; pointer-events: none; transition: opacity .8s ease; }
      #cb_fg_layer { position: fixed; z-index: 2400; pointer-events: none; opacity: var(--cb-fg-op, 1); }
      #cb_fg_front { position: fixed; z-index: 2420; pointer-events: none; opacity: var(--cb-fg-op, 1); }
      .cb_fg_img { position: absolute; bottom: 0; height: 100%; object-fit: contain; object-position: center bottom; pointer-events: none; }
      #cb_fg_left { left: 0; object-position: left bottom; }
      #cb_fg_right { right: 0; object-position: right bottom; }
  `;
  if (!document.getElementById('ntr_overlays_css')) {
    const st = document.createElement('style');
    st.id = 'ntr_overlays_css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  let banner = null;

  // ===== Foreground images =====
  function layoutFg() {
    const layer = document.getElementById('cb_fg_layer');
    const chat = document.getElementById('chat');
    if (!layer || layer.style.display === 'none' || !chat) return;
    const r = chat.getBoundingClientRect();
    const L = document.getElementById('cb_fg_left');
    const C = document.getElementById('cb_fg_center');
    const R = document.getElementById('cb_fg_right');
    if (L) L.style.width = Math.max(0, r.left) + 'px';
    if (R) R.style.width = Math.max(0, window.innerWidth - r.right) + 'px';
    if (C) { C.style.left = r.left + 'px'; C.style.width = r.width + 'px'; }
    drawPlace();
  }

  function ensureFg() {
    const s = settings();
    const show = isOn() && s.fgEnabled && !(s.fgHideVN && s.nodeEnabled);
    let layer = document.getElementById('cb_fg_layer');
    // Nothing is built until foreground images are first switched on.
    if (!layer && !show) return;
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'cb_fg_layer';
      layer.innerHTML = `
        <img id="cb_fg_left" class="cb_fg_img" alt="">
        <img id="cb_fg_center" class="cb_fg_img" alt="">
        <img id="cb_fg_right" class="cb_fg_img" alt="">
      `;
      document.body.appendChild(layer);
      const chat = document.getElementById('chat');
      if (chat && window.ResizeObserver) new ResizeObserver(() => layoutFg()).observe(chat);
    }
    let front = document.getElementById('cb_fg_front');
    if (!front) {
      front = document.createElement('div');
      front.id = 'cb_fg_front';
      document.body.appendChild(front);
    }

    const F = fgData();
    layer.style.display = show ? 'block' : 'none';
    front.style.display = show ? 'block' : 'none';
    document.documentElement.style.setProperty('--cb-fg-op', rangeNum(s, 'fgOpacity') / 100);

    for (const pos of FG_POS) {
      const el = document.getElementById(`cb_fg_${pos.toLowerCase()}`);
      const target = F[pos + 'Layer'] === 'front' ? front : layer;
      if (el.parentNode !== target) target.appendChild(el);
      const src = media(F[pos]);
      fgTransform(el, pos, F);
      if (src) {
        if (el.getAttribute('src') !== src) el.src = src;
        el.style.display = 'block';
      } else {
        el.style.display = 'none';
        el.removeAttribute('src');
      }
    }
    layoutFg();
  }

  // ===== Header banner =====
  function syncWallpaper() {
    if (!banner) return;
    const wall = banner.querySelector('.cb_wall');
    if (!wall) return;
    let bg = null;
    if (currentLook().backdrop === 'wallpaper' && banner.style.display !== 'none') {
      for (const id of ['bg_custom', 'bg1']) {
        const el = document.getElementById(id);
        const v = el ? getComputedStyle(el).backgroundImage : '';
        if (v && v !== 'none') { bg = v; break; }
      }
    }
    if (!bg) { wall.style.display = 'none'; return; }
    const r = banner.getBoundingClientRect();
    wall.style.display = 'block';
    wall.style.backgroundImage = bg;
    wall.style.left = `${-r.left}px`;
    wall.style.top = `${-r.top}px`;
    wall.style.width = `${window.innerWidth}px`;
    wall.style.height = `${window.innerHeight}px`;
  }

  function buildBanner() {
    banner = document.createElement('div');
    banner.id = 'cb_banner';
    banner.innerHTML = `
      <img class="cb_img" alt="" style="display: none; width: 100%; height: 100%; object-fit: cover;">
      <iframe class="cb_yt" style="display: none; width: 100%; height: 100%; border: none; pointer-events: auto;" allow="autoplay; encrypted-media" referrerpolicy="strict-origin-when-cross-origin"></iframe>
      <video class="cb_vid" muted loop playsinline preload="auto" style="display: none; width: 100%; height: 100%; object-fit: cover;"></video>
      <button class="cb_nav_btn cb_snd" style="display: none;"></button>
      <div class="cb_wall" style="display: none;"></div>
      <div class="cb_nav">
        <button class="cb_nav_btn cb_nav_prev" title="Previous image"><i class="fa-solid fa-chevron-left"></i></button>
        <span class="cb_nav_count"></span>
        <button class="cb_nav_btn cb_nav_next" title="Next image"><i class="fa-solid fa-chevron-right"></i></button>
      </div>
    `;
    banner.querySelector('.cb_nav_prev').onclick = (e) => { e.stopPropagation(); step(-1); };
    banner.querySelector('.cb_nav_next').onclick = (e) => { e.stopPropagation(); step(1); };
    banner.querySelector('.cb_snd').onclick = (e) => { e.stopPropagation(); toggleBannerSound(); };
    if (window.ResizeObserver) new ResizeObserver(() => syncWallpaper()).observe(banner);
  }

  function watchBannerImg() {
    const img = banner?.querySelector('.cb_img');
    if (!img || img.dataset.watched) return;
    img.dataset.watched = '1';
    img.addEventListener('error', () => {
      if (img.getAttribute('src')) toastr.error(`Banner image failed to load: ${img.getAttribute('src')}`, 'Banner');
    });
  }

  // Global and Char are saved per character: Char uses the character's own banner, Global the shared one.
  // Off is one switch for every character.
  const BANNER_NOTE = {
    global: 'Global shows the shared banner on every character that doesn\'t have its own (Char).',
    char: 'Char gives this character its own banner. Its images and settings are saved in its card.',
  };
  function bannerKind(r) {
    const s = settings();
    if (!s.bannerOn || !r) return 'off';
    return r.scope === 'char' && r.mode ? r.mode : s.bannerMode;
  }

  // A hidden YouTube player keeps playing its sound, so it's unloaded whenever the banner doesn't show it.
  function stopBannerYt() {
    const yt = banner?.querySelector('.cb_yt');
    if (yt && yt.src && yt.src !== 'about:blank') yt.src = 'about:blank';
  }

  // A video banner starts muted unless sound was turned on before; the speaker button's choice is saved right away.
  // Browsers can block sound until the page is clicked, so a blocked start plays muted for now without changing the choice.
  function stopBannerVid() {
    const v = banner?.querySelector('.cb_vid');
    if (!v || !v.getAttribute('src')) return;
    v.pause();
    v.removeAttribute('src');
    v.load();
    banner.querySelector('.cb_snd').style.display = 'none';
  }
  function setSndIcon(muted) {
    const b = banner?.querySelector('.cb_snd');
    if (!b) return;
    b.innerHTML = `<i class="fa-solid ${muted ? 'fa-volume-xmark' : 'fa-volume-high'}"></i>`;
    b.title = muted ? 'Sound on' : 'Mute';
  }
  function playBannerVid(v) {
    const want = !!currentLook().videoSound;
    v.muted = !want;
    setSndIcon(!want);
    const p = v.play();
    if (p && p.catch) p.catch(() => {
      if (!want || v.muted) return;
      v.muted = true;
      setSndIcon(true);
      v.play().catch(() => {});
    });
  }
  function toggleBannerSound() {
    const v = banner?.querySelector('.cb_vid');
    if (!v) return;
    const key = currentKey();
    const r = key ? peek(key) : null;
    const want = v.muted;
    if (r && r.scope === 'char') r.videoSound = want;
    else settings().bannerVideoSound = want;
    save();
    v.muted = !want;
    setSndIcon(v.muted);
    if (!v.muted) v.play().catch(() => {});
  }

  // ===== Banner image rotation =====
  // Follows the same Global / Char switch as the kind: Char uses the character's own copy (ROT_KEYS in index.js).
  function rotation(r) {
    const s = settings();
    const own = !!r && r.scope === 'char';
    const o = {};
    for (const [k, g] of Object.entries(ROT_KEYS)) o[k] = own ? r[k] : s[g];
    o.rotateSec = Math.round(cardNum(o.rotateSec, 'bannerRotateSec', DEFAULTS.bannerRotateSec));
    return o;
  }

  // Banner height, gap, transparent areas and video sound follow the same switch (BANNER_LOOK_KEYS in index.js). A Char
  // character with no value of its own yet (set to Char before these were per character) uses the global one.
  function bannerLook(r) {
    const s = settings();
    const own = !!r && r.scope === 'char';
    const o = {};
    for (const [k, g] of Object.entries(BANNER_LOOK_KEYS)) o[k] = own && r[k] != null ? r[k] : s[g];
    o.height = cardNum(o.height, 'bannerHeight', DEFAULTS.bannerHeight);
    o.gap = cardNum(o.gap, 'bannerGap', DEFAULTS.bannerGap);
    return o;
  }
  function currentLook() {
    const key = currentKey();
    return bannerLook(key ? peek(key) : null);
  }
  function applyBannerSize() {
    const o = currentLook();
    document.documentElement.style.setProperty('--cb-h', o.height + 'px');
    document.documentElement.style.setProperty('--cb-gap', o.gap + 'px');
  }

  // rot.idx is the image on screen while rotating. It's never saved, so the card isn't rewritten every few
  // seconds and each chat opens on the picked image (r.idx), which only the arrows and the menu change.
  const rot = { key: null, idx: null, timer: null, sec: 0, fade: false };
  // Waits while the Overlays page is open, so the Crop slider works on the picked image.
  const rotPaused = () => !!document.getElementById('cb_modal_overlay') && settings().uiPage === 'fg';
  function shownIdx(key, r) {
    const n = r.images.length;
    return rot.key === key && rot.idx != null && rot.idx < n ? rot.idx : Math.min(r.idx, n - 1);
  }
  function stopRotation() {
    clearTimeout(rot.timer);
    rot.timer = null;
  }
  function armRotation(sec) {
    if (rot.timer && rot.sec === sec) return;
    clearTimeout(rot.timer);
    rot.sec = sec;
    rot.timer = setTimeout(rotTick, sec * 1000);
  }
  function rotTick() {
    rot.timer = null;
    const key = currentKey();
    const r = key ? peek(key) : null;
    if (!r || key !== rot.key || !banner || banner.style.display === 'none' || bannerKind(r) !== 'image') return;
    const o = rotation(r);
    const n = bannerSrc(r).images.length;
    if (!o.rotate || n < 2) return;
    if (!rotPaused()) {
      const cur = shownIdx(key, bannerSrc(r));
      let next = (cur + 1) % n;
      if (o.rotateOrder === 'shuffle') { next = Math.floor(Math.random() * (n - 1)); if (next >= cur) next++; }
      rot.idx = next;
      rot.fade = o.rotateFx === 'fade';
    }
    updateBanner(); // shows it and sets up the next one
  }

  // The old image fades out on top of the new one, once the new one has loaded.
  function crossfade(img, u, pos) {
    if (img.dataset.next === u) return;
    img.dataset.next = u;
    loadImg(u).catch(() => {}).then(() => {
      if (img.dataset.next !== u) return;
      delete img.dataset.next;
      const old = img.cloneNode();
      old.className = 'cb_xfade';
      img.after(old);
      img.src = u;
      img.style.objectPosition = pos;
      requestAnimationFrame(() => requestAnimationFrame(() => { old.style.opacity = '0'; }));
      setTimeout(() => old.remove(), 1000);
    });
  }

  function updateBanner() {
    const key = currentKey();
    if (!banner) return;
    const newChar = key !== rot.key;
    if (newChar) { rot.key = key; rot.idx = null; stopRotation(); }
    const fade = rot.fade;
    rot.fade = false;
    const r = key ? peek(key) : null;
    const kind = bannerKind(r);
    if (kind === 'off') {
      stopBannerYt();
      stopBannerVid();
      banner.style.display = 'none';
      return;
    }
    
    applyBannerSize();

    watchBannerImg();
    const img = banner.querySelector('.cb_img');
    const yt = banner.querySelector('.cb_yt');
    const nav = banner.querySelector('.cb_nav');
    const vid = banner.querySelector('.cb_vid');

    const src = bannerSrc(r);
    if (kind === 'image') {
      stopBannerYt();
      stopBannerVid();
      vid.style.display = 'none';
      const n = src.images.length;
      if (!n) {
        banner.style.display = 'none';
        return;
      }
      banner.style.display = 'block';
      yt.style.display = 'none';
      img.style.display = 'block';

      const i = shownIdx(key, src);
      const im = src.images[i] || src.images[0];
      const u = media(im.url);
      if (!u) { banner.style.display = 'none'; return; }
      const pos = `50% ${cardNum(im.pos, 'bannerPos', 45)}%`;
      if (img.getAttribute('src') !== u && fade && img.getAttribute('src')) crossfade(img, u, pos);
      else {
        delete img.dataset.next;
        if (img.getAttribute('src') !== u) img.src = u;
        img.style.objectPosition = pos;
      }
      nav.style.display = n > 1 ? 'flex' : 'none';
      nav.querySelector('.cb_nav_count').textContent = `${i + 1} / ${n}`;
      const o = rotation(r);
      if (o.rotate && n > 1) armRotation(o.rotateSec); else stopRotation();
      
    } else if (kind === 'youtube') {
      stopBannerVid();
      vid.style.display = 'none';
      const videoId = getYouTubeId(src.youtubeUrl || '');
      if (!videoId) {
        stopBannerYt();
        banner.style.display = 'none';
        return;
      }
      banner.style.display = 'block';
      img.style.display = 'none';
      yt.style.display = 'block';
      nav.style.display = 'none';

      const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&mute=0&loop=1&playlist=${videoId}&controls=1&modestbranding=1`;
      if (yt.getAttribute('src') !== embedUrl) yt.src = embedUrl;
    } else if (kind === 'video') {
      stopBannerYt();
      const u = media(src.video);
      if (!u) {
        stopBannerVid();
        banner.style.display = 'none';
        return;
      }
      banner.style.display = 'block';
      img.style.display = 'none';
      yt.style.display = 'none';
      nav.style.display = 'none';
      vid.style.display = 'block';
      vid.style.objectPosition = `50% ${cardNum(src.videoPos, 'bannerVideoPos', 50)}%`;
      banner.querySelector('.cb_snd').style.display = '';
      if (vid.getAttribute('src') !== u) { vid.src = u; playBannerVid(vid); }
      // Same video, other character: their sound setting may differ.
      else if (vid.paused || newChar) playBannerVid(vid);
    }
    syncWallpaper();
  }

  function attachBanner(chat, locked) {
    if (locked) {
      if (banner.nextElementSibling !== chat) chat.before(banner);
    } else if (chat.firstElementChild !== banner) {
      chat.prepend(banner);
    }
  }

  // The chat's own listeners, set once: the wallpaper behind see-through banner areas follows scrolling, and an unlocked
  // banner goes back on top when SillyTavern redraws the chat.
  let hooked = null;
  function hookChat(chat) {
    if (hooked === chat) return;
    hooked = chat;
    chat.addEventListener('scroll', () => syncWallpaper(), { passive: true });
    new MutationObserver(() => {
      const key = currentKey();
      if (!banner || !key || !settings().bannerOn) return;
      if (!peek(key).locked && !A.banFree?.() && chat.firstElementChild !== banner) chat.prepend(banner);
    }).observe(chat, { childList: true });
  }

  // Where the banner sits: locked above the chat, or at the top of the messages, overlapping them or not. A Free banner
  // (Layout) has its own place, so it stays out of the messages and doesn't overlap them.
  function placeBanner(chat, r) {
    const free = !!A.banFree?.();
    banner.classList.toggle('cb_overlap', !!r.overlap && !free);
    attachBanner(chat, r.locked || free);
    chat.style.paddingTop = r.overlap && !free ? cardNum(r.overlapOffset, 'bannerOffset', 0) + 'px' : '';
  }

  // Shows or hides both overlays for the chat that's open now.
  function render() {
    try {
      ensureFg();
      const chat = document.getElementById('chat');
      if (!chat) return;
      hookChat(chat);
      
      chat.style.paddingTop = ''; // clear padding initially
      if (!isOn()) { if (banner) banner.style.display = 'none'; stopBannerYt(); stopBannerVid(); syncWallpaper(); return; }
      
      if (!banner) buildBanner();
      const key = currentKey();
      const r = key ? peek(key) : null;
      if (bannerKind(r) === 'off') {
        stopBannerYt();
        stopBannerVid();
        banner.style.display = 'none';
        return;
      }
      
      placeBanner(chat, r);
      updateBanner();
    } catch (e) {
      console.error('[NTR overlays]', e);
    }
  }

  function step(d) {
    const key = currentKey();
    const r = bannerSrc(key ? peek(key) : null);
    const n = r.images.length;
    if (n < 2) return;
    r.idx = (shownIdx(key, r) + d + n) % n;
    rot.idx = null;
    stopRotation(); // the arrows restart the rotation timer
    save();
    updateBanner();
    if (document.getElementById('cb_modal_overlay')) openCombinedModal();
  }

  async function addFiles(files) {
    const key = currentKey();
    const r = bannerSrc(key ? peek(key) : null);
    let added = 0;
    for (const f of files) {
      try {
        const url = await uploadHere(() => uploadImage(f, 'banner', { maxWidth: 1600 }), r !== settings().bannerGlobal);
        if (!url) return;
        r.images.push({ url, pos: 45 });
        r.idx = r.images.length - 1;
        added++;
        save();
      } catch (e) {
        console.error('[NTR banner upload]', e);
        toastr.error(e.message || 'Failed to upload', 'Banner Error');
      }
    }
    save();
    updateBanner();
    if (added) toastr.success(`Added ${added} of ${files.length}. Total: ${r.images.length}`, 'Banner');
  }

  async function removeCurrentBanner(anchor) {
    const key = currentKey();
    const r = bannerSrc(key ? peek(key) : null);
    const im = r.images[r.idx];
    if (!im || !(await askYes(anchor, 'Remove this scenic banner image?', 'Remove', { danger: true }))) return;
    r.images.splice(r.idx, 1);
    r.idx = Math.max(0, Math.min(r.idx, r.images.length - 1));
    save();
    updateBanner();
    deleteFileIfUnused(im.url);
  }

  // ===== The Overlays page in the menu =====
  function bannerGuideText() {
    const chat = document.getElementById('chat');
    const w = Math.round((banner && banner.offsetWidth) || (chat ? chat.getBoundingClientRect().width : 0));
    if (!w) return '';
    const h = (A.banFree?.() && banner?.offsetHeight) || currentLook().height;
    const ratio = (w / h).toFixed(1);
    return `Your banner is currently ${w} × ${h} px (${ratio}:1). For sharp results use images at least ${w * 2} × ${Math.round(h * 2 * 1.3)} px. A little taller than the banner's shape gives the Crop slider room to work.`;
  }

  // What the page shows: the open character's banner (Char) or the shared one (Global), and its foreground images.
  function menuState(s) {
    const F = fgData();
    const chatOpen = !!store(); // Foreground images are saved per chat, so they need one open.
    const key = currentKey();
    const r = key ? peek(key) : { images: [], locked: true, overlap: false, overlapOffset: 0, youtubeUrl: '' };
    const ownKind = !!key && r.scope === 'char';
    const kind = ownKind && r.mode ? r.mode : s.bannerMode;
    const ro = rotation(ownKind ? r : null);
    const bl = bannerLook(ownKind ? r : null);
    const btag = ownKind ? ' ' + TAG : '';
    const src = bannerSrc(ownKind ? r : null);
    const shared = ownKind ? '' : '<div class="cb_hint">This is the shared banner. Changes show on every character set to Global.</div>';
    const n = src.images.length;
    const curImg = src.images[src.idx] || null;
    return { F, chatOpen, key, r, ownKind, kind, ro, bl, btag, src, shared, n, curImg };
  }

  function sectionHtml(s) {
    const { F, chatOpen, key, r, ownKind, kind, ro, bl, btag, src, shared, n, curImg } = menuState(s);
    return pageHtml('fg', `
          ${pagePart('Header Banner', ['m_b_enable', s.bannerOn], 'fg_banner', `
            ${card('Source', `
            <div><strong>Banner:</strong>${pills('bscope', [['global', 'Global', BANNER_NOTE.global], ['char', 'Char', BANNER_NOTE.char]], ownKind ? 'char' : 'global')}</div>
              <div style="margin-top: 10px;">
                <strong>Kind:</strong>${ownKind ? ' ' + TAG : ''}${pills('bmode', [['image', 'Image Gallery'], ['youtube', 'YouTube Loop'], ['video', 'Video']], kind)}
                ${ownKind ? '' : '<div class="cb_hint">Changes every character set to Global.</div>'}
              </div>`)}

            <!-- Image Controls -->
            <div id="m_b_img_controls" style="display: ${kind === 'image' ? 'block' : 'none'};">
              ${card('Images' + btag, `
              ${shared}
              <div class="cb_actions">
                <button id="m_b_up" class="menu_button"><i class="fa-solid fa-plus"></i> Add</button>
                <button id="m_b_url" class="menu_button" title="Add an image from a link"><i class="fa-solid fa-link"></i> Link</button>
                <button id="m_b_del" class="menu_button danger_button" ${!n ? 'disabled' : ''}><i class="fa-solid fa-trash-can"></i> Del</button>
              </div>
              <input type="file" id="m_b_file" accept="image/png,image/jpeg,image/gif,image/webp,.png,.jpg,.jpeg,.gif,.webp" multiple hidden>

              ${n > 0 ? `
              <div class="cb_carousel_nav">
                <button id="m_b_prev" class="menu_button" ${n < 2 ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>
                <span>Image <b>${Math.round(cNum(src.idx, 0, 0, n - 1)) + 1}</b> of <b>${n}</b></span>
                <button id="m_b_next" class="menu_button" ${n < 2 ? 'disabled' : ''}><i class="fa-solid fa-chevron-right"></i></button>
              </div>
              <div class="cb_thumbs">${src.images.map((im, i) => `<img class="cb_thumb${i === src.idx ? ' active' : ''}" data-i="${i}" src="${escapeHTML(media(im.url))}" alt="">`).join('')}</div>` : `<div style="text-align:center;opacity:0.7;margin-top:8px;">No images yet</div>`}

              ${curImg ? `
              <div class="cb_row" style="margin-top: 10px;"><label>Crop:${btag}</label><span><span id="m_b_pval" class="ntr_slval">${cardNum(curImg.pos, 'bannerPos', 45)}</span>${numRange('bannerPos')[3]}</span></div>
              <input type="range" id="m_b_p" ${rangeAttrs('bannerPos')} value="${cardNum(curImg.pos, 'bannerPos', 45)}">
              ` : ''}`)}

              ${card('Rotation' + (ownKind ? ' ' + TAG : ''), `
                <label class="checkbox_label"><input type="checkbox" id="m_b_rot" ${ro.rotate ? 'checked' : ''}><span>Rotate through images</span></label>
                <div id="m_b_rot_body" class="${ro.rotate ? '' : 'cb_dim'}">
                  <div class="cb_row" style="margin-top: 8px;"><label>Every:</label><span><span id="m_b_rot_val" class="ntr_slval">${ro.rotateSec}</span>${numRange('bannerRotateSec')[3]}</span></div>
                  <input type="range" id="m_b_rot_sec" ${rangeAttrs('bannerRotateSec')} value="${ro.rotateSec}">
                  <div style="margin-top: 8px;"><strong>Change:</strong>${pills('brfx', [['fade', 'Crossfade'], ['swap', 'Instant']], ro.rotateFx)}</div>
                  <div style="margin-top: 8px;"><strong>Order:</strong>${pills('brord', [['order', 'In order'], ['shuffle', 'Shuffled']], ro.rotateOrder)}</div>
                </div>
                ${n < 2 ? '<div class="cb_hint">Rotation needs 2 or more images.</div>' : ''}
                ${ownKind ? '' : '<div class="cb_hint">Changes every character set to Global.</div>'}`)}
            </div>

            <!-- YouTube Controls -->
            <div id="m_b_yt_controls" style="display: ${kind === 'youtube' ? 'block' : 'none'};">
              ${card('YouTube Loop' + btag, `
              <label><strong>YouTube Video URL:</strong></label>
              ${shared}
              <input type="text" id="m_b_yt_url" class="text_pole" style="width: 100%; margin-top: 5px;" placeholder="https://youtube.com/watch?v=..." value="${escapeHTML(src.youtubeUrl || '')}">`)}
            </div>

            <!-- Video Controls -->
            <div id="m_b_vid_controls" style="display: ${kind === 'video' ? 'block' : 'none'};">
              ${card('Video' + btag, `
              ${shared}
              <div class="cb_row">
                <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${src.video ? escapeHTML(String(src.video).split('/').pop()) : '<span class="cb_hint">No video yet (mp4 or webm)</span>'}</span>
                <button id="m_b_vup" class="menu_button" style="margin:0;" title="Upload a video"><i class="fa-solid fa-upload"></i></button>
                <button id="m_b_vurl" class="menu_button" style="margin:0;" title="Use a link to a video"><i class="fa-solid fa-link"></i></button>
                <button id="m_b_vdel" class="menu_button danger_button" style="margin:0;" title="Remove the video" ${!src.video ? 'disabled' : ''}><i class="fa-solid fa-trash"></i></button>
              </div>
              <input type="file" id="m_b_vfile" accept="video/mp4,video/webm,.mp4,.webm" hidden>
              ${src.video ? `
              <div class="cb_row" style="margin-top: 10px;"><label>Crop:${btag}</label><span><span id="m_b_vpval" class="ntr_slval">${cardNum(src.videoPos, 'bannerVideoPos', 50)}</span>${numRange('bannerVideoPos')[3]}</span></div>
              <input type="range" id="m_b_vp" ${rangeAttrs('bannerVideoPos')} value="${cardNum(src.videoPos, 'bannerVideoPos', 50)}">` : ''}
              <div class="cb_hint">Loops without controls. The speaker button on the banner turns sound on or off, and your choice is remembered. Until you've clicked somewhere on the page, browsers may keep it muted.</div>`)}
            </div>

            ${card('Layout', `
              ${A.banFree?.() ? '<div class="cb_hint">The banner is Free on the Layout page, so it sits where Edit Layout puts it: Lock to top, Overlap, Banner Height, Gap and Overlap Offset don\'t apply.</div>' : ''}
              <div class="${A.banFree?.() ? 'cb_dim' : ''}">
              <label class="checkbox_label" ${!key ? 'style="opacity:0.5;pointer-events:none;"' : ''}>
                <input type="checkbox" id="m_b_lock" ${r.locked ? 'checked' : ''}><span>Lock to top ${TAG}</span>
              </label>
              <label class="checkbox_label" style="margin-top: 6px;${!key ? 'opacity:0.5;pointer-events:none;' : ''}">
                <input type="checkbox" id="m_b_overlap" ${r.overlap ? 'checked' : ''}><span>Overlap messages ${TAG}</span>
              </label>

            <div class="cb_row" style="margin-top: 15px;"><label>Banner Height:${btag}</label><span><span id="m_b_hval" class="ntr_slval">${bl.height}</span>${numRange('bannerHeight')[3]}</span></div>
            <input type="range" id="m_b_h" ${rangeAttrs('bannerHeight')} value="${bl.height}">
            <div id="m_b_guide" class="cb_hint" style="margin-top: 4px;">${escapeHTML(bannerGuideText())}</div>

            <div id="m_b_gap_wrapper" style="${r.overlap ? 'opacity: 0.5; pointer-events: none;' : ''}">
              <div class="cb_row" style="margin-top: 10px;"><label>Gap Below Banner:${btag}</label><span><span id="m_b_gapval" class="ntr_slval">${bl.gap}</span>${numRange('bannerGap')[3]}</span></div>
              <input type="range" id="m_b_gap" ${rangeAttrs('bannerGap')} value="${bl.gap}">
            </div>

            <div id="m_b_offset_wrapper" style="display: ${r.overlap ? 'block' : 'none'};">
              <div class="cb_row" style="margin-top: 10px;"><label>Overlap Offset (Push Messages Down): ${TAG}</label><span><span id="m_b_oval" class="ntr_slval">${cardNum(r.overlapOffset, 'bannerOffset', 0)}</span>${numRange('bannerOffset')[3]}</span></div>
              <input type="range" id="m_b_offset" ${rangeAttrs('bannerOffset')} value="${cardNum(r.overlapOffset, 'bannerOffset', 0)}" ${!key ? 'disabled' : ''}>
            </div>
            </div>

            <div style="margin-top: 10px;"><strong>Transparent areas show:${btag}</strong>${pills('bbd', [['wallpaper', 'Wallpaper'], ['panel', 'Chat panel tint']], bl.backdrop === 'panel' ? 'panel' : 'wallpaper')}</div>
            ${ownKind ? '' : '<div class="cb_hint">Height, gap and transparent areas change every character set to Global.</div>'}`)}
          `)}

          ${pagePart('Foreground Images', ['m_f_enable', s.fgEnabled], '', `
            ${card('', `
            <div class="cb_row"><label>Opacity:</label><span><span id="m_f_oval" class="ntr_slval">${rangeNum(s, 'fgOpacity')}</span>${numRange('fgOpacity')[3]}</span></div>
            <input type="range" id="m_f_o" ${rangeAttrs('fgOpacity')} value="${rangeNum(s, 'fgOpacity')}">
            <label class="checkbox_label" style="margin-top: 8px;"><input type="checkbox" id="m_f_hidevn" ${s.fgHideVN ? 'checked' : ''}><span>Hide these in Visual Novel Mode</span></label>
            <button type="button" id="m_f_place" class="menu_button" style="margin: 8px 0 0; width: max-content;"><i class="fa-solid fa-up-down-left-right"></i> Edit Placement</button>
            <div class="cb_hint" style="margin-bottom: 0;">Hides the menu so you can drag the images on screen. Each one stays tied to its side. Press Done to come back.</div>`)}

            <div class="ntr_glab">Images ${TAG}</div>
            ${chatOpen ? '' : '<div class="cb_hint" style="margin-bottom: 8px;">Open a character chat first. Foreground images are saved per character.</div>'}
            <div class="ntr_fgrid">
              ${['Left', 'Center', 'Right'].map(pos => `
                <div class="cb_col ntr_card" style="align-items: center; text-align: center;">
                  <strong>${pos} ${TAG}</strong>
                  <div style="width:100%; height:80px; background:rgba(0,0,0,0.3); border-radius:4px; margin:5px 0; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                    <img id="m_f_img_${pos}" src="${escapeHTML(media(F[pos]))}" style="max-width:100%; max-height:100%; object-fit:contain; display:${F[pos] ? 'block' : 'none'};">
                    <span id="m_f_none_${pos}" style="display:${F[pos] ? 'none' : 'block'}; opacity:0.5; font-size:12px;">Empty</span>
                  </div>
                  <div style="display:flex; gap:5px; width:100%;">
                    <button class="menu_button m_f_up" data-pos="${pos}" style="flex:1; padding:4px;" title="Upload ${pos} image" ${!chatOpen ? 'disabled' : ''}><i class="fa-solid fa-upload"></i></button>
                    <button class="menu_button m_f_url" data-pos="${pos}" style="flex:1; padding:4px;" title="Use a link for the ${pos} image" ${!chatOpen ? 'disabled' : ''}><i class="fa-solid fa-link"></i></button>
                    <button class="menu_button danger_button m_f_del" data-pos="${pos}" style="flex:1; padding:4px;" title="Clear ${pos} image" ${!F[pos] ? 'disabled' : ''}><i class="fa-solid fa-trash"></i></button>
                  </div>
                  <div class="cb_row" style="width:100%; margin-top:6px;"><label>Size:</label><span><span id="m_f_s_${pos}val" class="ntr_slval">${cardNum(F[pos + 'Scale'], 'fgScale', 100)}</span>${numRange('fgScale')[3]}</span></div>
                  <input type="range" class="m_f_scale" data-pos="${pos}" ${rangeAttrs('fgScale')} value="${cardNum(F[pos + 'Scale'], 'fgScale', 100)}" style="width:100%;">
                  ${[['X', 'Left/Right'], ['Y', 'Up/Down']].map(([ax, name]) => `
                  <div class="cb_row" style="width:100%; margin-top:6px;"><label>${name}:</label><span><span id="m_f_${ax}_${pos}val" class="ntr_slval">${cardNum(F[pos + ax], 'fg' + ax, 0)}</span>${numRange('fg' + ax)[3]}</span></div>
                  <input type="range" id="m_f_${ax}_${pos}" class="m_f_move" data-pos="${pos}" data-ax="${ax}" ${rangeAttrs('fg' + ax)} value="${cardNum(F[pos + ax], 'fg' + ax, 0)}" style="width:100%;">`).join('')}
                  <div style="width:100%; margin-top:6px; text-align:left;"><small>In Visual Novel Mode, sit:</small>${pills('fgl' + pos, [['behind', 'Behind sprites'], ['front', 'In front']], F[pos + 'Layer'])}</div>
                </div>
              `).join('')}
            </div>
            <input type="file" id="m_f_file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
          `)}
        `, { legend: true });
  }

  // Rotation waits while the Overlays page is open, showing the picked image, and starts a fresh count when another page
  // is picked or the menu closes.
  function rotRestart(s) {
    if (s.uiPage === 'fg') rot.idx = null;
    stopRotation();
    updateBanner();
  }

  function bind(overlay, s) {
    const { F, key, r, ownKind, src, n, curImg } = menuState(s);
    if (s.uiPage === 'fg' && rot.idx != null) { rot.idx = null; updateBanner(); }
    if (!key) {
      const ch = overlay.querySelector('input[name="cbr_bscope"][value="char"]');
      ch.disabled = true;
      ch.closest('label').style.cssText = 'opacity:0.5;pointer-events:none;';
    }
    overlay.querySelector('#m_b_enable').onchange = function() {
      s.bannerOn = this.checked;
      save();
      render();
      openCombinedModal();
    };
    onPills(overlay, 'bscope', (v) => {
      if (key) {
        if (v === 'char' && r.scope !== 'char') startChar(r);
        if (v === 'global') r.mode = '';
        r.scope = v;
      }
      if (BANNER_NOTE[v]) toastr.info(BANNER_NOTE[v], 'Banner');
      save();
      render();
      openCombinedModal();
    });
    const rotSet = (k, v) => { if (ownKind) r[k] = v; else s[ROT_KEYS[k]] = v; save(); updateBanner(); };
    overlay.querySelector('#m_b_rot').onchange = function() {
      rotSet('rotate', this.checked);
      overlay.querySelector('#m_b_rot_body').classList.toggle('cb_dim', !this.checked);
    };
    const rotSec = overlay.querySelector('#m_b_rot_sec');
    rotSec.oninput = function() { overlay.querySelector('#m_b_rot_val').textContent = this.value; };
    rotSec.onchange = function() { rotSet('rotateSec', Number(this.value)); };
    onPills(overlay, 'brfx', (v) => rotSet('rotateFx', v));
    onPills(overlay, 'brord', (v) => rotSet('rotateOrder', v));
    onPills(overlay, 'bmode', (v) => {
      if (ownKind) r.mode = v; else s.bannerMode = v;
      save();
      overlay.querySelector('#m_b_img_controls').style.display = v === 'image' ? 'block' : 'none';
      overlay.querySelector('#m_b_yt_controls').style.display = v === 'youtube' ? 'block' : 'none';
      overlay.querySelector('#m_b_vid_controls').style.display = v === 'video' ? 'block' : 'none';
      render();
    });

    // Banner video: uploaded as is (no re-encoding), or a link.
    const setVideo = (url) => {
      const old = src.video;
      src.video = url;
      src.videoPos = 50;
      save();
      updateBanner();
      deleteFileIfUnused(old);
      openCombinedModal();
    };
    const vfile = overlay.querySelector('#m_b_vfile');
    const vup = overlay.querySelector('#m_b_vup');
    vup.onclick = () => vfile.click();
    vfile.onchange = async () => {
      const f = vfile.files[0];
      vfile.value = '';
      if (!f) return;
      try {
        const path = await uploadHere(() => uploadVideo(f, 'banner', 'Banner', vup), src !== settings().bannerGlobal);
        if (!path) return;
        toastr.success('Banner video uploaded.', 'Banner');
        setVideo(path);
      } catch (e) {
        console.error('[NTR banner video]', e);
        toastr.error(e.message || 'Video upload failed', 'Banner');
        openCombinedModal();
      }
    };
    overlay.querySelector('#m_b_vurl').onclick = async () => {
      const url = await askVideoUrl('Banner video', overlay.querySelector('#m_b_vurl'), src !== settings().bannerGlobal);
      if (url) setVideo(url);
    };
    overlay.querySelector('#m_b_vdel').onclick = async function() {
      if (!src.video || !(await askYes(this, 'Remove the banner video?', 'Remove', { danger: true }))) return;
      setVideo('');
    };
    const vp = overlay.querySelector('#m_b_vp');
    if (vp) {
      vp.oninput = function() {
        src.videoPos = Number(this.value);
        overlay.querySelector('#m_b_vpval').textContent = this.value;
        const v = banner?.querySelector('.cb_vid');
        if (v) v.style.objectPosition = `50% ${this.value}%`;
      };
      vp.onchange = save;
    }

    // Foreground Event Bindings
    overlay.querySelector('#m_f_hidevn').onchange = function() { s.fgHideVN = this.checked; save(); ensureFg(); };
    for (const pos of FG_POS) onPills(overlay, 'fgl' + pos, (val) => { F[pos + 'Layer'] = val; save(); ensureFg(); });
    overlay.querySelector('#m_f_enable').onchange = function() {
      s.fgEnabled = this.checked; save(); ensureFg();
    };
    
    const fo = overlay.querySelector('#m_f_o');
    fo.oninput = function() { 
      s.fgOpacity = Number(this.value); 
      overlay.querySelector('#m_f_oval').textContent = this.value; 
      document.documentElement.style.setProperty('--cb-fg-op', this.value / 100); 
    };
    fo.onchange = save;

    overlay.querySelector('#m_f_place').onclick = () => startPlacement('fg');
    overlay.querySelectorAll('.m_f_move').forEach((sl) => {
      sl.oninput = function() {
        const { pos, ax } = this.dataset;
        F[pos + ax] = Number(this.value);
        overlay.querySelector(`#m_f_${ax}_${pos}val`).textContent = this.value;
        ensureFg();
      };
      sl.onchange = save;
    });

    overlay.querySelectorAll('.m_f_scale').forEach(sl => {
      sl.oninput = function() {
        const pos = this.dataset.pos;
        F[pos + 'Scale'] = Number(this.value);
        overlay.querySelector(`#m_f_s_${pos}val`).textContent = this.value;
        ensureFg();
      };
      sl.onchange = save;
    });

    const fgFile = overlay.querySelector('#m_f_file');
    let pendingFgPos = null;

    overlay.querySelectorAll('.m_f_up').forEach(btn => {
      btn.onclick = () => { pendingFgPos = btn.dataset.pos; fgFile.click(); };
    });

    overlay.querySelectorAll('.m_f_url').forEach(btn => {
      btn.onclick = async () => {
        const pos = btn.dataset.pos;
        const url = await askImageUrl(`${pos} foreground image`, btn);
        if (!url) return;
        const old = F[pos];
        F[pos] = url;
        deleteFileIfUnused(old);
        save();
        ensureFg();
        openCombinedModal();
      };
    });

    overlay.querySelectorAll('.m_f_del').forEach(btn => {
      btn.onclick = () => { 
        const pos = btn.dataset.pos;
        const old = F[pos];
        F[pos] = '';
        save();
        ensureFg();
        deleteFileIfUnused(old);
        openCombinedModal(); 
      };
    });

    fgFile.onchange = async () => {
      if (!fgFile.files.length || !pendingFgPos) return;
      const f = fgFile.files[0];
      fgFile.value = ''; // so the same file can be picked again after a failed upload
      const pos = pendingFgPos;
      try {
        const url = await uploadHere(() => uploadImage(f, `fg_${pos.toLowerCase()}`));
        if (!url) return;
        const old = F[pos];
        F[pos] = url;
        deleteFileIfUnused(old);
        
        save();
        ensureFg();
        openCombinedModal();
      } catch (e) {
        console.error('[NTR fg upload]', e);
        toastr.error(e.message || 'Foreground upload failed', 'Foreground');
      }
    };

    if (key) {
      overlay.querySelector('#m_b_lock').onchange = function() { r.locked = this.checked; save(); render(); };
      
      overlay.querySelector('#m_b_overlap').onchange = function() { 
        r.overlap = this.checked; 
        overlay.querySelector('#m_b_gap_wrapper').style.opacity = r.overlap ? '0.5' : '1';
        overlay.querySelector('#m_b_gap_wrapper').style.pointerEvents = r.overlap ? 'none' : 'auto';
        overlay.querySelector('#m_b_offset_wrapper').style.display = r.overlap ? 'block' : 'none';
        save(); 
        render(); 
      };

      const bo = overlay.querySelector('#m_b_offset');
      if (bo) {
        bo.oninput = function() { 
          r.overlapOffset = Number(this.value); 
          overlay.querySelector('#m_b_oval').textContent = r.overlapOffset; 
          const chat = document.getElementById('chat');
          if (chat && r.overlap) chat.style.paddingTop = r.overlapOffset + 'px';
        };
        bo.onchange = save;
      }
    }

    const fi = overlay.querySelector('#m_b_file');
    overlay.querySelector('#m_b_up').onclick = () => fi.click();
    overlay.querySelector('#m_b_url').onclick = async () => {
      const url = await askImageUrl('Banner image', overlay.querySelector('#m_b_url'), src !== settings().bannerGlobal);
      if (!url) return;
      src.images.push({ url, pos: 45 });
      src.idx = src.images.length - 1;
      save(); updateBanner(); openCombinedModal();
    };
    fi.onchange = async () => { if (fi.files.length) { await addFiles([...fi.files]); openCombinedModal(); }};
    if (n) overlay.querySelector('#m_b_del').onclick = async function() { await removeCurrentBanner(this); openCombinedModal(); };
    if (n > 0) {
      overlay.querySelector('#m_b_prev').onclick = () => step(-1);
      overlay.querySelector('#m_b_next').onclick = () => step(1);
      overlay.querySelectorAll('.cb_thumb').forEach((t) => {
        t.onclick = () => { src.idx = Number(t.dataset.i); save(); updateBanner(); openCombinedModal(); };
      });
      const strip = overlay.querySelector('.cb_thumbs');
      const act = strip?.querySelector('.active');
      if (strip && act) strip.scrollLeft = act.offsetLeft - strip.clientWidth / 2 + act.offsetWidth / 2;
    }
    if (curImg) {
      const bp = overlay.querySelector('#m_b_p');
      bp.oninput = function() { overlay.querySelector('#m_b_pval').textContent = this.value; const img = banner?.querySelector('.cb_img'); if (img) img.style.objectPosition = `50% ${this.value}%`; };
      bp.onchange = function() { curImg.pos = Number(this.value); save(); };
    }
    const ytUrl = overlay.querySelector('#m_b_yt_url');
    ytUrl.oninput = function() { src.youtubeUrl = this.value; };
    ytUrl.onchange = function() { save(); updateBanner(); };
    const lookSet = (k, v) => { if (ownKind) r[k] = v; else s[BANNER_LOOK_KEYS[k]] = v; };
    const bh = overlay.querySelector('#m_b_h');
    bh.oninput = function() { lookSet('height', Number(this.value)); overlay.querySelector('#m_b_hval').textContent = this.value; applyBannerSize(); overlay.querySelector('#m_b_guide').textContent = bannerGuideText(); };
    bh.onchange = save;
    const bgap = overlay.querySelector('#m_b_gap');
    bgap.oninput = function() { lookSet('gap', Number(this.value)); overlay.querySelector('#m_b_gapval').textContent = this.value; applyBannerSize(); };
    bgap.onchange = save;
    onPills(overlay, 'bbd', (v) => { lookSet('backdrop', v); save(); syncWallpaper(); });
  }

  window.addEventListener('resize', () => {
    syncWallpaper();
    layoutFg();
    const g = document.querySelector('#cb_modal_overlay #m_b_guide');
    if (g) g.textContent = bannerGuideText();
  });

  window.NTR.overlays = {
    version: OVERLAYS_VERSION, render, ensureFg, sectionHtml, bind, rotRestart,
    relayout: () => {
      layoutFg();
      // Layout can make the banner Free or Attached.
      const chat = document.getElementById('chat');
      const key = currentKey();
      if (banner && chat && key && banner.style.display !== 'none') placeBanner(chat, peek(key));
      syncWallpaper();
    },
    syncWallpaper,
  };
})();
