// Nitwit Tavern Redesign: Opening video module.
// Loaded on demand by vn.js. If this file breaks, Visual Novel Mode and the rest of the extension keep working.
(() => {
  const OP_VERSION = '2.15.1';
  const A = window.NTR && window.NTR.api;
  if (!A) { console.error('[NTR] opening.js loaded without the core (index.js).'); return; }
  const VN = () => window.NTR.vn;
  if (!VN()) { console.error('[NTR] opening.js needs Visual Novel Mode (vn.js).'); return; }
  const { save, settings, escapeHTML, askImageUrl, askVideoUrl, uploadImage, uploadVideo, media, pills, onPills, subHead } = A;
  const TAG = A.TAG || '';

  const CSS = `
    #ntr_open { position: fixed; inset: 0; z-index: 2600; background: #000; overflow: hidden; opacity: 0; transition: opacity .4s ease; color: #fff; user-select: none; }
    #ntr_open.ntr_in { opacity: 1; }
    #ntr_open .ntr_op_title { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
    #ntr_open .ntr_op_bg { position: absolute; inset: -20px; background-size: cover; background-position: center; filter: blur(6px) brightness(.45); }
    #ntr_open .ntr_op_art { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); max-height: 78vh; max-width: 70vw; object-fit: contain; filter: drop-shadow(0 0 24px rgba(0,0,0,.7)); pointer-events: none; }
    #ntr_open .ntr_op_card { position: relative; display: flex; flex-direction: column; align-items: center; gap: 18px; padding: 20px; margin-top: 30vh; text-align: center; }
    #ntr_open .ntr_op_name { font-size: clamp(28px, 6vw, 64px); font-weight: bold; letter-spacing: .04em; text-shadow: 0 3px 18px rgba(0,0,0,.9); }
    #ntr_open .ntr_op_btn { cursor: pointer; padding: 10px 34px; border-radius: 999px; border: 2px solid #fff; background: rgba(0,0,0,.45); color: #fff; font-size: 18px; letter-spacing: .12em; transition: background .2s, color .2s; }
    #ntr_open .ntr_op_btn:hover, #ntr_open .ntr_op_btn:focus-visible { background: #fff; color: #000; outline: none; }
    #ntr_open .ntr_op_media { position: absolute; inset: 0; overflow: hidden; transition: opacity .6s ease; }
    #ntr_open .ntr_op_media.ntr_gone { opacity: 0; }
    #ntr_open .ntr_op_cover { position: absolute; inset: 0; opacity: 0; pointer-events: none; }
    #ntr_open .ntr_op_media video { width: 100%; height: 100%; object-fit: cover; display: block; }
    #ntr_open .ntr_op_media iframe { position: absolute; left: 50%; top: 50%; width: max(100vw, 177.78vh); height: max(100vh, 56.25vw); transform: translate(-50%, -50%); border: 0; pointer-events: none; }
    #ntr_open .ntr_op_catch { position: absolute; inset: 0; cursor: pointer; }
    #ntr_open .ntr_op_logo, .ntr_op_pin .ntr_op_logo { position: absolute; left: 50%; transform: translate(-50%, -50%) scale(1.12); opacity: 0; max-height: 60vh; object-fit: contain; pointer-events: none; filter: drop-shadow(0 4px 20px rgba(0,0,0,.6)); }
    #ntr_open .ntr_op_logo.ntr_in, .ntr_op_pin .ntr_op_logo.ntr_in { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    .ntr_op_pin { position: fixed; inset: 0; z-index: 2601; pointer-events: none; overflow: hidden; transition: opacity .4s ease; }
    .ntr_op_pin.ntr_gone { opacity: 0; }
    #ntr_open .ntr_op_bar { position: absolute; right: 14px; bottom: calc(14px + env(safe-area-inset-bottom, 0px)); display: flex; gap: 8px; z-index: 2; }
    #ntr_open .ntr_op_small { cursor: pointer; padding: 6px 14px; border-radius: 999px; border: 1px solid rgba(255,255,255,.6); background: rgba(0,0,0,.5); color: #fff; font-size: 13px; opacity: .8; }
    #ntr_open .ntr_op_small:hover { opacity: 1; }
  `;
  function ensureStyle() {
    if (document.getElementById('ntr_op_style')) return;
    const el = document.createElement('style');
    el.id = 'ntr_op_style';
    el.textContent = CSS;
    document.head.appendChild(el);
  }

  // ----- Data (per character, inside the VN data) -----
  const ODEF = { src: 'off', yt: '', file: '', title: false, logo: 'upload', logoUrl: '', when: 'newchat' };
  const raw = () => {
    const v = VN().data();
    if (!v.opening || typeof v.opening !== 'object') v.opening = {};
    return v.opening;
  };
  const op = () => ({ ...ODEF, ...raw() });
  const setOp = (k, val) => { raw()[k] = val; save(); };
  const ytId = (o) => (o.yt && A.getYouTubeId ? A.getYouTubeId(o.yt) : '') || '';
  const hasSource = (o) => (o.src === 'youtube' ? !!ytId(o) : o.src === 'file' ? !!media(o.file) : false);
  function logoSrc(o) {
    // Older saves may still say 'banner'; that choice is gone, so they use the uploaded logo.
    return o.logo === 'none' ? '' : media(o.logoUrl);
  }

  // ----- When to play -----
  function markSeen(sig) {
    const s = settings();
    if (!s.opSeen || typeof s.opSeen !== 'object') s.opSeen = {};
    s.opSeen[sig] = Date.now();
    const keys = Object.keys(s.opSeen);
    if (keys.length > 300) keys.sort((a, b) => s.opSeen[a] - s.opSeen[b]).slice(0, keys.length - 300).forEach((k) => delete s.opSeen[k]);
    save();
  }

  function maybePlay(reason, info = {}) {
    if (cur) {
      if (cur.sig && cur.sig === info.sig) return false;
      abort();
    }
    if (pinned && pinned.sig !== info.sig) unpin();
    const s = settings();
    if (!A.isOn() || !s.nodeEnabled || !A.store()) return false;
    const o = op();
    if (!hasSource(o)) return false;
    let go = false;
    if (o.when === 'vn') go = reason === 'vn';
    else if (o.when === 'open') go = reason === 'open';
    else go = !!info.fresh && !!info.sig && !(s.opSeen || {})[info.sig];
    if (!go) return false;
    if (o.when === 'newchat') markSeen(info.sig);
    play(info.hooks || VN().openingHooks, { sig: info.sig });
    return true;
  }

  // ----- Player -----
  let cur = null;
  // "Rise to top" leaves the logo pinned over the story until the chat changes, VN mode goes off or another opening plays.
  let pinned = null;
  function unpin() {
    if (!pinned) return;
    pinned.el.remove();
    pinned = null;
  }
  const RISE_MS = 3000;
  const PIN_Z = '2399'; // Over the background, behind the characters, weather, CG and dialogue box.
  const transMs = () => Math.max(100, Math.min(10000, Number(settings().opTransMs) || 400));
  const transColor = () => (/^#[0-9a-f]{6}$/i.test(settings().opTransColor || '') ? settings().opTransColor : '#000000');

  function play(hooks, opts = {}) {
    const o = op();
    if (!hasSource(o)) return false;
    if (cur) abort();
    unpin();
    ensureStyle();
    const s = settings();
    const st = {
      sig: opts.sig || '', hooks: hooks || {}, onEnd: opts.onEnd || null, o, phase: 'title',
      timers: [], logoShown: false, phaseAt: Date.now(), ytState: null, ytReady: false,
      exit: ['fade', 'rise'].includes(s.opExit) ? s.opExit : 'stay', skipped: false,
      cross: s.opTrans === 'cross',
      muted: !!s.opMute,
    };
    cur = st;
    const root = document.createElement('div');
    root.id = 'ntr_open';
    root.tabIndex = -1;
    root.style.background = transColor();
    st.root = root;
    document.body.appendChild(root);
    try { document.activeElement && document.activeElement.blur && document.activeElement.blur(); } catch (e) {}

    // Logo layer (sits above the video so it can drop in before the end).
    const lsrc = logoSrc(o);
    if (lsrc) {
      const img = document.createElement('img');
      img.className = 'ntr_op_logo';
      img.alt = '';
      img.src = lsrc;
      img.style.width = Math.max(5, Math.min(100, Number(s.opSize) || 50)) + 'vw';
      img.style.top = s.opPos === 'upper' ? '33.3%' : s.opPos === 'lower' ? '66.7%' : '50%';
      const ms = Math.max(0, Number(s.opFade) || 0);
      img.style.transition = `opacity ${ms}ms ease, transform ${ms}ms ease`;
      st.logo = img;
      if (st.exit === 'rise') {
        // Its own layer above the opening, so it can outlive the black screen without restarting its animation.
        const pin = document.createElement('div');
        pin.className = 'ntr_op_pin';
        pin.appendChild(img);
        st.pin = pin;
      }
    }

    st.onKey = (e) => {
      if (cur !== st) return;
      if (e.key === 'Escape') {
        e.preventDefault(); e.stopPropagation();
        if (st.phase === 'title') finish();
        else if (st.phase === 'video') skip();
        else if (st.phase === 'logo') clickLogo();
      } else if ((e.key === 'Enter' || e.key === ' ') && st.phase !== 'title') {
        e.preventDefault(); e.stopPropagation();
        if (st.phase === 'video') skip(); else if (st.phase === 'logo') clickLogo();
      }
    };
    document.addEventListener('keydown', st.onKey, true);

    try { st.hooks.onStart && st.hooks.onStart(); } catch (e) { console.error('[NTR opening]', e); }
    requestAnimationFrame(() => root.classList.add('ntr_in'));

    if (o.title) showTitle();
    else if (!st.muted && needsClick()) showTitle(true);
    else startVideo();
    return true;
  }

  // Browsers only allow sound after a click on the page. Right after a refresh SillyTavern reopens the chat
  // by itself, so without this the opening would start muted.
  const needsClick = () => !!(navigator.userActivation && !navigator.userActivation.hasBeenActive);

  const later = (fn, ms) => { const st = cur; const t = setTimeout(() => { if (cur === st) fn(); }, ms); if (st) st.timers.push(t); return t; };
  const setPhase = (p) => { cur.phase = p; cur.phaseAt = Date.now(); };

  // gate: just a Play button, shown when the browser would otherwise block the sound.
  function showTitle(gate = false) {
    const st = cur;
    const box = document.createElement('div');
    box.className = 'ntr_op_title';
    const bg = gate ? '' : safeCall(() => VN().sceneBg()) || '';
    const art = gate ? '' : safeCall(() => VN().titleArt()) || '';
    const name = gate ? '' : safeCall(() => VN().titleName()) || '';
    box.innerHTML = `
      ${bg ? '<div class="ntr_op_bg"></div>' : ''}
      ${art ? `<img class="ntr_op_art" alt="" src="${escapeHTML(art)}">` : ''}
      <div class="ntr_op_card">
        ${name ? `<div class="ntr_op_name">${escapeHTML(name)}</div>` : ''}
        <button type="button" class="ntr_op_btn">${gate ? '<i class="fa-solid fa-play"></i> PLAY' : 'START'}</button>
      </div>`;
    const bgEl = box.querySelector('.ntr_op_bg');
    if (bgEl) bgEl.style.backgroundImage = `url(${JSON.stringify(String(bg))})`;
    st.root.appendChild(box);
    const btn = box.querySelector('.ntr_op_btn');
    btn.onclick = (e) => {
      e.stopPropagation();
      if (cur !== st || st.phase !== 'title') return;
      box.remove();
      startVideo(); // Runs inside the click, so the browser lets the video play with sound.
    };
    setTimeout(() => { try { btn.focus(); } catch (e) {} }, 50);
  }

  function startVideo() {
    const st = cur;
    setPhase('video');
    const box = document.createElement('div');
    box.className = 'ntr_op_media';
    st.media = box;
    st.root.appendChild(box);
    if (st.pin) document.body.appendChild(st.pin);
    else if (st.logo) st.root.appendChild(st.logo);

    const catcher = document.createElement('div');
    catcher.className = 'ntr_op_catch';
    catcher.title = 'Click to skip';
    catcher.onclick = () => { if (st.phase === 'video') skip(); else if (st.phase === 'logo') clickLogo(); };
    st.root.appendChild(catcher);

    const bar = document.createElement('div');
    bar.className = 'ntr_op_bar';
    bar.innerHTML = `<button type="button" class="ntr_op_small" data-a="snd"></button>
      <button type="button" class="ntr_op_small" data-a="skip">Skip <i class="fa-solid fa-forward"></i></button>`;
    st.root.appendChild(bar);
    st.bar = bar;
    bar.querySelector('[data-a="skip"]').onclick = (e) => { e.stopPropagation(); if (st.phase === 'video') skip(); else if (st.phase === 'logo') clickLogo(); };
    const snd = bar.querySelector('[data-a="snd"]');
    st.snd = snd;
    setSnd(st, st.muted);
    // The choice is remembered for the next opening, refresh included.
    snd.onclick = (e) => {
      e.stopPropagation();
      const m = !st.muted;
      settings().opMute = m;
      save();
      if (st.video) { st.video.muted = m; if (!m) st.video.play().catch(() => {}); }
      if (st.iframe) { if (m) ytCmd('mute'); else { ytCmd('unMute'); ytCmd('setVolume', [100]); } }
      setSnd(st, m);
    };

    if (st.o.src === 'file') startFile(st);
    else startYouTube(st);
  }

  function setSnd(st, muted) {
    st.muted = muted;
    if (st.snd) st.snd.innerHTML = muted ? '<i class="fa-solid fa-volume-high"></i> Sound on' : '<i class="fa-solid fa-volume-xmark"></i> Mute';
  }

  function startFile(st) {
    const v = document.createElement('video');
    v.src = media(st.o.file);
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.preload = 'auto';
    v.muted = st.muted;
    st.video = v;
    st.media.appendChild(v);
    v.addEventListener('timeupdate', () => tick(v.currentTime, v.duration));
    v.addEventListener('ended', () => { if (cur === st && st.phase === 'video') end(); });
    v.addEventListener('error', () => {
      if (cur !== st || st.phase !== 'video') return;
      toastr.warning('The opening video could not be played.', 'Opening video');
      end();
    });
    let p;
    try { p = v.play(); } catch (e) { p = Promise.reject(e); }
    if (p && p.catch) p.catch(() => {
      if (cur !== st || st.phase !== 'video') return;
      // Autoplay with sound was blocked: play muted and offer a sound button.
      v.muted = true;
      let p2;
      try { p2 = v.play(); } catch (e) { p2 = Promise.reject(e); }
      if (p2 && p2.catch) p2.catch(() => {});
      setSnd(st, true); // Muted for now only; the saved choice stays as it is.
    });
  }

  // YouTube without loading its API script: the embed talks to us through postMessage.
  function ytCmd(func, args = []) {
    const f = cur && cur.iframe;
    if (!f || !f.contentWindow) return;
    try { f.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args }), '*'); } catch (e) {}
  }

  function startYouTube(st) {
    const id = ytId(st.o);
    const origin = encodeURIComponent(location.origin);
    const f = document.createElement('iframe');
    f.src = `https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&controls=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&disablekb=1&fs=0&enablejsapi=1${st.muted ? '&mute=1' : ''}&origin=${origin}`;
    f.allow = 'autoplay; encrypted-media';
    f.title = 'Opening video';
    st.iframe = f;
    st.media.appendChild(f);
    const hello = () => {
      try { f.contentWindow && f.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 'ntr_op', channel: 'widget' }), '*'); } catch (e) {}
    };
    f.addEventListener('load', hello);
    st.hello = setInterval(() => { if (cur !== st || st.ytReady) { clearInterval(st.hello); return; } hello(); }, 400);
    st.onMsg = (e) => {
      if (cur !== st || !f.contentWindow || e.source !== f.contentWindow) return;
      let d = e.data;
      if (typeof d === 'string') { try { d = JSON.parse(d); } catch (err) { return; } }
      if (!d || typeof d !== 'object') return;
      if (!st.ytReady) { st.ytReady = true; ytCmd('addEventListener', ['onStateChange']); }
      const info = d.event === 'onStateChange' ? { playerState: d.info } : d.info;
      if (!info || typeof info !== 'object') return;
      if (typeof info.playerState === 'number') {
        st.ytState = info.playerState;
        if (info.playerState === 0 && st.phase === 'video') { end(); return; }
      }
      if (typeof info.duration === 'number' && info.duration > 0) st.ytDur = info.duration;
      if (typeof info.currentTime === 'number') tick(info.currentTime, st.ytDur);
    };
    window.addEventListener('message', st.onMsg);
    // If it hasn't started after a few seconds, autoplay with sound was probably blocked: try muted.
    later(() => {
      if (st.phase !== 'video' || st.ytState === 1 || st.ytState === 3) return;
      ytCmd('mute'); ytCmd('playVideo');
      setSnd(st, true);
    }, 3500);
  }

  function tick(t, dur) {
    const st = cur;
    if (!st || st.phase !== 'video') return;
    // YouTube swaps the last frame for its end screen, so stop just before the end: the fade (to the color
    // or straight into the story) then starts from the real last frame. A timer keeps it precise because
    // YouTube only reports the time a few times a second.
    if (st.iframe && dur > 0 && isFinite(dur) && !st.ytStop) {
      const left = dur - t;
      if (left <= 1.5) st.ytStop = later(() => { if (st.phase !== 'video') return; ytCmd('pauseVideo'); end(); }, Math.max(0, (left - 0.15) * 1000));
    }
    // "Fade out the ending": the color starts covering the video while it still plays and is full at the last frame.
    if (settings().opEarly && !st.cross && !st.cover && dur > 0 && isFinite(dur)) {
      const left = (st.iframe ? dur - 0.15 : dur) - t;
      if (left * 1000 <= transMs()) {
        fadeCover(st, Math.max(0, left * 1000));
        console.info(`[NTR opening] Fading out the ending: ${transColor()} over the last ${Math.round(left * 1000)} ms.`);
      }
    }
    if (!st.logo || st.logoShown) return;
    const lead = Math.max(0, Number(settings().opLead) || 0);
    if (dur > 0 && isFinite(dur) && lead > 0 && t >= dur - lead) showLogo();
  }

  function showLogo() {
    const st = cur;
    if (!st || !st.logo || st.logoShown) return;
    st.logoShown = true;
    st.logoAt = Date.now();
    requestAnimationFrame(() => requestAnimationFrame(() => st.logo.classList.add('ntr_in')));
  }

  function stopMedia(st) {
    if (st.hello) clearInterval(st.hello);
    if (st.video) { try { st.video.pause(); } catch (e) {} }
    if (st.iframe) ytCmd('pauseVideo');
    // Video to color uses the transition length too; a skip keeps the quick fade. If the fade already started
    // before the end, it just finishes.
    const early = !!st.cover && !st.skipped;
    const ms = st.skipped ? 600 : early ? Math.max(0, st.coverDoneAt - performance.now()) : transMs();
    st.mediaOutMs = ms;
    if (!early) fadeCover(st, ms);
    console.info(`[NTR opening] Video ended (${st.skipped ? 'skipped' : 'finished'}): ${early ? 'fade already running, done in' : `fading to ${transColor()} over`} ${Math.round(ms)} ms.`);
    if (st.snd) st.snd.style.display = 'none';
    const m = st.media;
    setTimeout(() => {
      if (st.video) { try { st.video.removeAttribute('src'); st.video.load(); } catch (e) {} }
      if (m) m.remove();
    }, ms + 100);
  }

  // A color layer fades in over the video. Fading the video itself is unreliable: with hardware video decoding
  // some browsers drop the video at once instead of fading it. Linear, so the fade is even across its length.
  function fadeCover(st, ms) {
    if (!st.media) return;
    let c = st.cover;
    if (!c) {
      c = document.createElement('div');
      c.className = 'ntr_op_cover';
      c.style.background = transColor();
      st.media.after(c);
      st.cover = c;
      c.getBoundingClientRect(); // Start from opacity 0 so the change below animates.
    }
    c.style.transition = `opacity ${Math.round(ms)}ms linear`;
    c.style.opacity = '1';
    st.coverDoneAt = performance.now() + ms;
  }

  function holdMedia(st) {
    if (st.hello) clearInterval(st.hello);
    if (st.video) { try { st.video.pause(); } catch (e) {} }
    if (st.iframe) ytCmd('pauseVideo');
    if (st.snd) st.snd.style.display = 'none';
  }

  const skip = () => {
    if (cur && cur.phase === 'video') cur.skipped = true;
    end();
  };

  // Drifts the logo up until its top edge sits near the top of the screen.
  function rise(st) {
    if (st.rising || !st.logo || !st.pin || !st.pin.isConnected) return;
    const img = st.logo;
    if (!img.animate) return;
    st.rising = true;
    const dy = Math.min(0, 12 - (img.offsetTop - img.offsetHeight / 2));
    st.riseKf = [{ transform: 'translate(-50%, -50%) scale(1)' }, { transform: `translate(-50%, calc(-50% + ${dy}px)) scale(1)` }];
    st.riseOpts = { duration: RISE_MS, easing: 'cubic-bezier(.45, 0, .25, 1)', fill: 'forwards' };
    st.riseAnim = img.animate(st.riseKf, st.riseOpts);
    st.riseAnim.startTime = document.timeline.currentTime;
  }

  // The rising logo moves behind the characters: a copy on the low layer runs the same animation in step,
  // while the copy above the opening fades out together with it.
  function settlePin(st) {
    const low = document.createElement('div');
    low.className = 'ntr_op_pin';
    low.style.zIndex = PIN_Z;
    const img = st.logo.cloneNode();
    img.classList.add('ntr_in');
    img.style.transition = 'none';
    img.style.opacity = '1';
    low.appendChild(img);
    document.body.appendChild(low);
    if (st.riseAnim) img.animate(st.riseKf, st.riseOpts).startTime = st.riseAnim.startTime;
    pinned = { el: low, sig: st.sig };
    const top = st.pin;
    top.style.transition = `opacity ${st.outMs}ms linear`;
    top.classList.add('ntr_gone');
    setTimeout(() => top.remove(), st.outMs + 50);
  }

  // Video finished or skipped: the logo (if any) gets its moment, then the story starts.
  function end() {
    const st = cur;
    if (!st || st.phase !== 'video') return;
    setPhase('logo');
    // Crossfade keeps the last frame on screen; skipping always fades through the color.
    if (st.cross && !st.skipped) holdMedia(st);
    else stopMedia(st);
    // Without a logo, the story fade waits until the video has faded to the color.
    const wait = st.cross || st.skipped ? 0 : st.mediaOutMs || 0;
    if (!st.logo) { if (wait) later(finish, wait); else finish(); return; }
    const fade = Math.max(0, Number(settings().opFade) || 0);
    const was = st.logoShown;
    showLogo();
    const left = was ? Math.max(0, fade - (Date.now() - st.logoAt)) : fade;
    if (st.exit === 'rise' && !st.skipped) setTimeout(() => rise(st), left);
    if (st.bar) st.bar.remove();
    later(finish, Math.max(left + 2000, wait));
  }

  function clickLogo() {
    const st = cur;
    if (!st || st.phase !== 'logo') return;
    if (Date.now() - st.phaseAt < 450) return; // So a double click on Skip doesn't also jump past the logo.
    finish();
  }

  function cleanup(st) {
    st.timers.forEach(clearTimeout);
    if (st.hello) clearInterval(st.hello);
    if (st.onKey) document.removeEventListener('keydown', st.onKey, true);
    if (st.onMsg) window.removeEventListener('message', st.onMsg);
    unloadVideo(st);
  }

  function unloadVideo(st) {
    if (st.video) { try { st.video.pause(); st.video.removeAttribute('src'); st.video.load(); } catch (e) {} }
  }

  function finish() {
    const st = cur;
    if (!st || st.phase === 'out') return;
    // "Fade out": the logo leaves first, then the black screen.
    if (st.exit === 'fade' && st.logo && st.logoShown) {
      st.phase = 'out';
      if (st.bar) st.bar.remove();
      st.logo.style.opacity = '0';
      later(close, Math.max(0, Number(settings().opFade) || 0) + 100);
      return;
    }
    close();
  }

  function close() {
    const st = cur;
    if (!st) return;
    st.phase = 'done';
    cur = null;
    // A skipped opening gets the quick fade; otherwise the chosen transition length.
    st.outMs = st.skipped ? 400 : transMs();
    const keep = st.cross && !st.skipped; // The frozen last frame fades out with the opening.
    if (keep) {
      const v = st.video;
      st.video = null;
      cleanup(st);
      st.video = v;
    } else cleanup(st);
    st.root.style.transition = `opacity ${st.outMs}ms linear`;
    st.root.classList.remove('ntr_in');
    st.root.style.pointerEvents = 'none';
    setTimeout(() => { unloadVideo(st); st.root.remove(); }, st.outMs + 50);
    if (st.pin) {
      if (st.logoShown && !st.skipped) {
        rise(st);
        settlePin(st);
      } else {
        st.pin.style.transition = `opacity ${st.outMs}ms linear`;
        st.pin.classList.add('ntr_gone');
        const pin = st.pin;
        setTimeout(() => pin.remove(), st.outMs + 50);
      }
    }
    // The story starts once the transition has finished, not underneath it.
    setTimeout(() => {
      if (cur) return; // Another opening took over in the meantime.
      try { st.hooks.onDone && st.hooks.onDone(); } catch (e) { console.error('[NTR opening]', e); }
      if (st.onEnd) { try { st.onEnd(); } catch (e) { console.error('[NTR opening]', e); } }
    }, st.outMs);
  }

  // Stops at once without starting the story (VN switched off, chat changed, and so on).
  function abort() {
    const st = cur;
    unpin();
    if (!st) return;
    cur = null;
    cleanup(st);
    st.root.remove();
    if (st.pin) st.pin.remove();
    unloadVideo(st);
  }

  function safeCall(fn) { try { return fn(); } catch (e) { console.error('[NTR opening]', e); return ''; } }

  // ----- Menu section -----
  function sectionHtml(s) {
    if (!A.store()) {
      return `${subHead('vn_open', 'Opening Video ' + TAG)}
        <div class="cb_collapse_content"><div class="cb_hint">Open a character chat first. The opening is saved per character.</div></div>`;
    }
    const o = op();
    const sl = (id, key, label, unit, min, max, step, shown) => `
      <div class="cb_row" style="margin-top:8px;"><label>${label}</label><span><span id="m_op_${id}val">${shown}</span>${unit}</span></div>
      <input type="range" class="m_op_sl" data-key="${key}" data-id="${id}" min="${min}" max="${max}" step="${step}" value="${s[key]}">`;
    const fileName = o.file ? escapeHTML(String(o.file).split('/').pop()) : '';
    const logoBox = media(o.logoUrl) ? `<img src="${escapeHTML(media(o.logoUrl))}" alt="">` : '<i class="fa-solid fa-image"></i>';
    return `
      ${subHead('vn_open', 'Opening Video ' + TAG)}
      <div class="cb_collapse_content">
        <div class="cb_hint">Plays before the story, like an anime opening. Video source:</div>
        ${pills('opsrc', [['off', 'Off'], ['youtube', 'YouTube'], ['file', 'Video file or link']], o.src)}
          <div id="m_op_yt" style="margin-top:8px;${o.src === 'youtube' ? '' : 'display:none;'}">
            <label class="cb_dfield"><span>YouTube link</span><input type="text" id="m_op_url" class="text_pole" placeholder="https://www.youtube.com/watch?v=..." value="${escapeHTML(o.yt)}"></label>
          </div>
          <div id="m_op_file" class="cb_row" style="margin-top:8px;${o.src === 'file' ? '' : 'display:none;'}">
            <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${fileName || '<span class="cb_hint">No video yet (mp4 or webm)</span>'}</span>
            <button type="button" id="m_op_up" class="menu_button" style="margin:0;" title="Upload video"><i class="fa-solid fa-upload"></i></button>
            <button type="button" id="m_op_vurl" class="menu_button" style="margin:0;" title="Use a link to a video"><i class="fa-solid fa-link"></i></button>
            <button type="button" id="m_op_clr" class="menu_button danger_button" style="margin:0;" title="Remove video" ${o.file ? '' : 'disabled'}><i class="fa-solid fa-trash"></i></button>
          </div>
        <div id="m_op_body" class="${hasSource(o) ? '' : 'cb_dim'}">
          <label class="checkbox_label" style="margin-top:8px;"><input type="checkbox" id="m_op_title" ${o.title ? 'checked' : ''}><span>Title screen first (art, name, Start button; the click turns sound on)</span></label>
          <label class="checkbox_label" style="margin-top:8px;"><input type="checkbox" id="m_op_mute" ${s.opMute ? 'checked' : ''}><span>Play muted (the Mute / Sound on button during the video changes this too)</span></label>
          <div style="margin-top:8px;"><small>Plays</small>
            ${pills('opwhen', [['newchat', 'First time a new chat starts'], ['open', 'Every time the chat opens'], ['vn', 'Every time VN mode switches on']], o.when)}
          </div>
          <div style="margin-top:8px;"><small>Logo at the end</small>
            ${pills('oplogo', [['upload', 'Uploaded logo'], ['none', 'None']], o.logo === 'none' ? 'none' : 'upload')}
          </div>
          <div id="m_op_lrow" class="cb_row" style="margin-top:6px;${o.logo === 'none' ? 'display:none;' : ''}">
            <div class="cb_thumbbox cb_wide">${logoBox}</div>
            <span style="flex:1;"></span>
            <button type="button" id="m_op_lup" class="menu_button" style="margin:0;" title="Upload logo"><i class="fa-solid fa-upload"></i></button>
            <button type="button" id="m_op_lurl" class="menu_button" style="margin:0;" title="Use a link for the logo"><i class="fa-solid fa-link"></i></button>
            <button type="button" id="m_op_lclr" class="menu_button danger_button" style="margin:0;" title="Remove logo" ${o.logoUrl ? '' : 'disabled'}><i class="fa-solid fa-trash"></i></button>
          </div>
          <div id="m_op_lbody" class="${o.logo === 'none' ? 'cb_dim' : ''}">
            ${sl('lead', 'opLead', 'Logo appears before the end', ' s', 0, 15, 0.5, s.opLead)}
            ${sl('fade', 'opFade', 'Logo fade', ' s', 100, 4000, 100, (s.opFade / 1000).toFixed(1))}
            ${sl('size', 'opSize', 'Logo size', '%', 10, 100, 1, s.opSize)}
            <div style="margin-top:8px;"><small>Logo position</small>
              ${pills('oppos', [['upper', 'Upper third'], ['center', 'Center'], ['lower', 'Lower third']], s.opPos)}
            </div>
            <div style="margin-top:8px;"><small>Logo exit</small>
              ${pills('opexit', [['stay', 'As is'], ['fade', 'Fade out'], ['rise', 'Rise to top']], s.opExit || 'stay')}
            </div>
            <div class="cb_hint" style="margin-top:4px;">Rise to top: the logo drifts up once the video ends and stays behind the characters. Skipping the video turns this off for that playthrough.</div>
          </div>
          <div style="margin-top:8px;"><small>Transition into the story</small>
            ${pills('optrans', [['color', 'Color fade'], ['cross', 'Crossfade']], s.opTrans === 'cross' ? 'cross' : 'color')}
          </div>
          <div id="m_op_crow" class="cb_row" style="margin-top:6px;${s.opTrans === 'cross' ? 'display:none;' : ''}">
            <label for="m_op_color">Fade color</label><input type="color" id="m_op_color" value="${escapeHTML(transColor())}">
          </div>
          <label id="m_op_erow" class="checkbox_label" style="margin-top:6px;${s.opTrans === 'cross' ? 'display:none;' : ''}"><input type="checkbox" id="m_op_early" ${s.opEarly ? 'checked' : ''}><span>Fade out the ending (the color covers the last seconds while the video still plays)</span></label>
          ${sl('trans', 'opTransMs', 'Transition length', ' s', 100, 10000, 100, (transMs() / 1000).toFixed(1))}
          <div class="cb_hint" style="margin-top:4px;">Color fade: video, then the color, then the story (the length applies to both fades). Crossfade: the last frame of the video blends straight into the story. Skipping the video always uses a quick color fade.</div>
          <div class="cb_actions" style="margin-top:10px;">
            <button type="button" id="m_op_play" class="menu_button" ${hasSource(o) ? '' : 'disabled'}><i class="fa-solid fa-play"></i> Play now</button>
          </div>
          <div class="cb_hint" style="margin-top:6px;">Logo style is shared by all characters and saved in themes.</div>
        </div>
        <input type="file" id="m_op_vfile" accept="video/mp4,video/webm,.mp4,.webm" hidden>
        <input type="file" id="m_op_lfile" accept="image/png,image/jpeg,image/gif,image/webp" hidden>
      </div>`;
  }

  function bind(overlay, s) {
    if (!overlay.querySelector('#m_op_body')) return;
    const q = (sel) => overlay.querySelector(sel);
    const syncBody = () => {
      const o = op();
      q('#m_op_body')?.classList.toggle('cb_dim', !hasSource(o));
      const pb = q('#m_op_play');
      if (pb) pb.disabled = !hasSource(o);
    };
    onPills(overlay, 'opsrc', (v) => {
      setOp('src', v);
      q('#m_op_yt').style.display = v === 'youtube' ? '' : 'none';
      q('#m_op_file').style.display = v === 'file' ? '' : 'none';
      syncBody();
    });
    const url = q('#m_op_url');
    if (url) url.onchange = () => {
      const v = url.value.trim();
      if (v && !(A.getYouTubeId && A.getYouTubeId(v))) toastr.warning('That doesn\'t look like a YouTube link.', 'Opening video');
      setOp('yt', v);
      syncBody();
    };
    const mute = q('#m_op_mute');
    if (mute) mute.onchange = () => { s.opMute = mute.checked; save(); };
    const ttl = q('#m_op_title');
    if (ttl) ttl.onchange = () => setOp('title', ttl.checked);
    onPills(overlay, 'opwhen', (v) => setOp('when', v));
    onPills(overlay, 'oplogo', (v) => {
      setOp('logo', v);
      q('#m_op_lrow').style.display = v === 'none' ? 'none' : '';
      q('#m_op_lbody')?.classList.toggle('cb_dim', v === 'none');
    });
    onPills(overlay, 'oppos', (v) => { s.opPos = v; save(); });
    onPills(overlay, 'opexit', (v) => { s.opExit = v; save(); });
    onPills(overlay, 'optrans', (v) => {
      s.opTrans = v;
      save();
      q('#m_op_crow').style.display = v === 'cross' ? 'none' : '';
      q('#m_op_erow').style.display = v === 'cross' ? 'none' : '';
    });
    const early = q('#m_op_early');
    if (early) early.onchange = () => { s.opEarly = early.checked; save(); };
    const col = q('#m_op_color');
    if (col) {
      col.oninput = () => { s.opTransColor = col.value; };
      col.onchange = save;
    }
    overlay.querySelectorAll('.m_op_sl').forEach((sl) => {
      sl.oninput = function() {
        const k = this.dataset.key;
        s[k] = Number(this.value);
        const out = overlay.querySelector(`#m_op_${this.dataset.id}val`);
        if (out) out.textContent = k === 'opFade' || k === 'opTransMs' ? (s[k] / 1000).toFixed(1) : this.value;
      };
      sl.onchange = save;
    });

    // Video upload (sent as is, no re-encoding).
    const vfile = q('#m_op_vfile');
    const up = q('#m_op_up');
    if (up) up.onclick = () => vfile.click();
    if (vfile) vfile.onchange = async () => {
      const f = vfile.files[0];
      vfile.value = '';
      if (!f) return;
      try {
        const path = await uploadVideo(f, 'vnop', 'Opening video', up);
        if (!path) return;
        const old = op().file;
        setOp('file', path);
        A.deleteFileIfUnused(old);
        toastr.success('Opening video uploaded.', 'Opening video');
      } catch (e) {
        console.error('[NTR opening upload]', e);
        toastr.error(e.message || 'Video upload failed', 'Opening video');
      }
      A.openMenu();
    };
    const vurl = q('#m_op_vurl');
    if (vurl && askVideoUrl) vurl.onclick = async () => {
      const url = await askVideoUrl('Opening video', vurl);
      if (!url) return;
      const old = op().file;
      setOp('file', url);
      A.deleteFileIfUnused(old);
      A.openMenu();
    };
    const clr = q('#m_op_clr');
    if (clr) clr.onclick = async () => {
      const old = op().file;
      if (!old || !(await A.askYes(clr, 'Remove the opening video?', 'Remove', { danger: true }))) return;
      setOp('file', '');
      A.deleteFileIfUnused(old);
      A.openMenu();
    };

    // Logo upload
    const lfile = q('#m_op_lfile');
    const lup = q('#m_op_lup');
    if (lup) lup.onclick = () => lfile.click();
    const lurl = q('#m_op_lurl');
    if (lurl) lurl.onclick = async () => {
      const url = await askImageUrl('Logo', lurl);
      if (!url) return;
      const old = op().logoUrl;
      setOp('logoUrl', url);
      A.deleteFileIfUnused(old);
      A.openMenu();
    };
    if (lfile) lfile.onchange = async () => {
      const f = lfile.files[0];
      lfile.value = '';
      if (!f) return;
      try {
        const path = await uploadImage(f, 'vnlogo', { max: 1600 });
        const old = op().logoUrl;
        setOp('logoUrl', path);
        A.deleteFileIfUnused(old);
      } catch (e) {
        console.error('[NTR logo upload]', e);
        toastr.error(e.message || 'Logo upload failed', 'Opening video');
      }
      A.openMenu();
    };
    const lclr = q('#m_op_lclr');
    if (lclr) lclr.onclick = () => {
      const old = op().logoUrl;
      if (!old) return;
      setOp('logoUrl', '');
      A.deleteFileIfUnused(old);
      A.openMenu();
    };

    const pb = q('#m_op_play');
    if (pb) pb.onclick = () => {
      if (!hasSource(op())) return;
      A.closeMenu();
      play(VN().openingHooks, { sig: '', onEnd: () => A.openMenu() });
    };
  }

  window.NTR.opening = {
    version: OP_VERSION,
    maybePlay,
    play: (hooks, opts) => play(hooks || VN().openingHooks, opts),
    abort,
    playing: () => !!cur,
    sectionHtml,
    bind,
  };
})();
