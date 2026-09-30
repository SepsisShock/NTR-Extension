(() => {
  const MODULE = 'chatvisuals';
  const DEFAULTS = { 
    bannerMode: 'image', // 'image', 'youtube', 'off'
    bannerHeight: 120, 
    chars: {},
    avatarEnabled: true,
    
    // AI Settings
    aiSide: 'tl', aiFit: 'cover', aiScale: 100, aiPad: 140, 
    aiTopFade: 0, aiBotFade: 60, aiLeftFade: 0, aiRightFade: 50, aiBlur: 0,
    
    // User Settings
    usSide: 'tr', usFit: 'cover', usScale: 100, usPad: 140, 
    usTopFade: 0, usBotFade: 60, usLeftFade: 50, usRightFade: 0, usBlur: 0
  };

  const ctx = () => SillyTavern.getContext();
  const save = () => ctx().saveSettingsDebounced();
  let banner = null;

  const escapeHTML = (str) => {
    return String(str).replace(/[&<>'"]/g, match => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[match]));
  };

  function settings() {
    const { extensionSettings } = ctx();
    if (!extensionSettings[MODULE]) extensionSettings[MODULE] = {};
    const s = extensionSettings[MODULE];
    for (const k of Object.keys(DEFAULTS)) {
      if (s[k] === undefined) s[k] = structuredClone(DEFAULTS[k]);
    }
    if (s.bannerEnabled !== undefined && !s.migratedBanner) {
      s.bannerMode = s.bannerEnabled ? 'image' : 'off';
      s.migratedBanner = true;
      delete s.bannerEnabled;
    }
    return s;
  }

  function getAvatarCss(prefix, isUserStr, s) {
    const v = s[`${prefix}Side`][0]; 
    const h = s[`${prefix}Side`][1]; 
    const fit = s[`${prefix}Fit`];
    const scale = s[`${prefix}Scale`];
    const pad = s[`${prefix}Pad`];
    
    const topFade = s[`${prefix}TopFade`];
    const botFade = s[`${prefix}BotFade`];
    const leftFade = s[`${prefix}LeftFade`];
    const rightFade = s[`${prefix}RightFade`];
    const blurAmount = s[`${prefix}Blur`];
    
    const width = Math.floor(scale * 3); 

    let wrapperPos = '';
    if (h === 'l') wrapperPos = 'left: 0 !important; right: auto !important;';
    else if (h === 'c') wrapperPos = 'left: 50% !important; transform: translateX(-50%) !important;';
    else if (h === 'r') wrapperPos = 'left: auto !important; right: 0 !important;';

    const objV = v === 't' ? 'top' : (v === 'c' ? 'center' : 'bottom');
    const objH = h === 'l' ? 'left' : (h === 'c' ? 'center' : 'right');
    const objPos = `${objH} ${objV}`;

    const hMask = `linear-gradient(to right, transparent 0%, black ${leftFade}%, black calc(100% - ${rightFade}%), transparent 100%)`;
    const vMask = `linear-gradient(to bottom, transparent 0%, black ${topFade}%, black calc(100% - ${botFade}%), transparent 100%)`;

    let padCss = '';
    if (h === 'l') padCss = `padding-left: ${pad}px !important;`;
    else if (h === 'r') padCss = `padding-right: ${pad}px !important;`;
    else padCss = `padding-left: ${Math.floor(pad / 2)}px !important; padding-right: ${Math.floor(pad / 2)}px !important;`;

    const justify = h === 'l' ? 'flex-start' : (h === 'r' ? 'flex-end' : 'center');
    const align = h === 'l' ? 'left' : (h === 'r' ? 'right' : 'center');

    const filterRule = blurAmount > 0 ? `filter: blur(${blurAmount}px) !important;` : '';
    
    let imgFitCss = 'object-fit: cover !important;';
    if (fit === 'contain') imgFitCss = 'object-fit: contain !important;';
    else if (fit === 'original') imgFitCss = 'object-fit: none !important;';

    return `
      .mes[is_user="${isUserStr}"] .avatar { 
        position: absolute !important; top: 0 !important; bottom: 0 !important; height: 100% !important;
        width: ${width}px !important; max-width: 80% !important; 
        margin: 0 !important; padding: 0 !important; z-index: 0 !important; pointer-events: none !important; 
        overflow: hidden !important; border-radius: var(--SmartThemeChatMesRounding, 15px) !important; 
        display: block !important; background: transparent !important; border: none !important;
        ${wrapperPos}
        ${filterRule} 
      }
      .mes[is_user="${isUserStr}"] .avatar img { 
        position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important;
        display: block !important; margin: 0 !important; padding: 0 !important; border-radius: 0 !important;
        -webkit-mask-image: ${hMask}, ${vMask} !important;
        -webkit-mask-composite: source-in !important;
        mask-image: ${hMask}, ${vMask} !important; 
        mask-composite: intersect !important;
        ${imgFitCss} object-position: ${objPos} !important; 
      }
      .mes[is_user="${isUserStr}"] .mes_block { ${padCss} }
      .mes[is_user="${isUserStr}"] .ch_name { display: flex !important; justify-content: ${justify} !important; text-align: ${align} !important; width: 100% !important; }
    `;
  }

  function updateAvatarStyle() {
    let styleEl = document.getElementById('aw_dynamic_style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'aw_dynamic_style';
      document.head.appendChild(styleEl);
    }

    const s = settings();
    
    // Base banner styles injected regardless of avatar toggle
    let cssString = `
      #cb_banner { width: 100%; height: var(--cb-h, 120px); position: relative; overflow: hidden; display: block; border-radius: 10px; margin-bottom: 10px; }
    `;

    if (s.avatarEnabled) {
      cssString += `
        .mes { position: relative !important; padding: 0 !important; background-color: var(--SmartThemeChatMesBgc) !important; border-radius: var(--SmartThemeChatMesRounding, 15px) !important; }
        .mes .mes_block, .mes .mes_text { background: transparent !important; border: none !important; box-shadow: none !important; }
        .mes .mes_block { position: relative !important; z-index: 1 !important; width: 100% !important; min-height: 120px !important; padding: 15px !important; }
        
        ${getAvatarCss('ai', 'false', s)}
        ${getAvatarCss('us', 'true', s)}
      `;
    }

    styleEl.textContent = cssString;
  }

  function currentKey() {
    const c = ctx();
    if (c.groupId) return null;
    const ch = c.characters?.[c.characterId];
    return ch?.avatar || null;
  }

  function currentCharacterName() {
    const c = ctx();
    if (c.groupId) return 'Group Chat';
    const ch = c.characters?.[c.characterId];
    return ch?.name || 'Current Character';
  }

  const peek = (key) => {
    const s = settings();
    if (!s.chars[key]) s.chars[key] = { images: [], idx: 0, locked: true, youtubeUrl: '' };
    if (s.chars[key].youtubeUrl === undefined) s.chars[key].youtubeUrl = '';
    return s.chars[key];
  };

  function rec(key) {
    return peek(key);
  }

  function buildBanner() {
    banner = document.createElement('div');
    banner.id = 'cb_banner';
    // Referrer policy added to the iframe to fix YouTube Error 153
    banner.innerHTML = `
      <img class="cb_img" alt="" style="display: none; width: 100%; height: 100%; object-fit: cover;">
      <iframe class="cb_yt" style="display: none; width: 100%; height: 100%; border: none; pointer-events: none;" allow="autoplay; encrypted-media" referrerpolicy="strict-origin-when-cross-origin"></iframe>
    `;
  }

  function getYouTubeId(url) {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    return match ? match[1] : null;
  }

  function updateBanner() {
    const s = settings();
    const key = currentKey();
    if (!banner) return;
    if (!key || s.bannerMode === 'off') {
      banner.style.display = 'none';
      return;
    }
    
    const r = peek(key);
    document.documentElement.style.setProperty('--cb-h', s.bannerHeight + 'px');

    const img = banner.querySelector('.cb_img');
    const yt = banner.querySelector('.cb_yt');

    if (s.bannerMode === 'image') {
      const n = r.images.length;
      if (!n) {
        banner.style.display = 'none';
        return;
      }
      banner.style.display = 'block';
      yt.style.display = 'none';
      img.style.display = 'block';

      const im = r.images[r.idx] || r.images[0];
      if (img.getAttribute('src') !== im.url) img.src = im.url;
      img.style.objectPosition = `50% ${im.pos ?? 45}%`;
      
    } else if (s.bannerMode === 'youtube') {
      const videoId = getYouTubeId(r.youtubeUrl || '');
      if (!videoId) {
        banner.style.display = 'none';
        return;
      }
      banner.style.display = 'block';
      img.style.display = 'none';
      yt.style.display = 'block';

      const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1`;
      if (yt.getAttribute('src') !== embedUrl) yt.src = embedUrl;
    }
  }

  function attachBanner(chat, locked) {
    if (locked) {
      if (banner.nextElementSibling !== chat) chat.before(banner);
    } else if (chat.firstElementChild !== banner) {
      chat.prepend(banner);
    }
  }

  function renderAll() {
    try {
      updateAvatarStyle();
      const chat = document.getElementById('chat');
      if (!chat) return;
      if (!banner) buildBanner();
      const key = currentKey();
      if (settings().bannerMode === 'off' || !key) {
        banner.style.display = 'none';
        return;
      }
      attachBanner(chat, peek(key).locked);
      updateBanner();
    } catch (e) {
      console.error('[chatvisuals]', e);
    }
  }

  function step(d) {
    const key = currentKey();
    if (!key) return;
    const r = rec(key);
    const n = r.images.length;
    if (n < 2) return;
    r.idx = (r.idx + d + n) % n;
    save();
    updateBanner();
  }

  const readDataURL = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
  const loadImg = (u) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = u; });

  async function addFiles(files) {
    const key = currentKey();
    if (!key) return;
    const r = rec(key);
    for (const f of files) {
      try {
        let url = await readDataURL(f);
        if (f.type !== 'image/gif') {
          const i = await loadImg(url);
          if (i.width > 0 && i.width > 1600) {
            const c = document.createElement('canvas');
            c.width = 1600; c.height = Math.round(i.height * 1600 / i.width);
            c.getContext('2d').drawImage(i, 0, 0, c.width, c.height);
            url = c.toDataURL(f.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', 0.92);
          }
        }
        const b64 = url.split(',')[1];
        
        let ext = f.name.split('.').pop().toLowerCase();
        if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) ext = 'png';
        const name = `banner_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        
        const res = await fetch('/api/files/upload', {
          method: 'POST',
          headers: ctx().getRequestHeaders(),
          body: JSON.stringify({ name, data: b64 }),
        });
        
        if (!res.ok) throw new Error(`Server rejected upload (Status ${res.status}).`);
        
        const j = await res.json();
        r.images.push({ url: '/' + String(j.path).replace(/^\/+/, ''), pos: 45 });
        r.idx = r.images.length - 1;
      } catch (e) {
        console.error('[chatvisuals upload error]', e);
        toastr.error(e.message || 'Failed to upload', 'Banner Error');
      }
    }
    save();
    updateBanner();
  }

  async function removeCurrentBanner() {
    const key = currentKey();
    if (!key) return;
    const r = rec(key);
    const im = r.images[r.idx];
    if (!im || !confirm('Remove this scenic banner image?')) return;
    r.images.splice(r.idx, 1);
    r.idx = Math.max(0, Math.min(r.idx, r.images.length - 1));
    save();
    updateBanner();
    try {
      await fetch('/api/files/delete', { method: 'POST', headers: ctx().getRequestHeaders(), body: JSON.stringify({ path: im.url.replace(/^\/+/, '') }) });
    } catch (e) {}
  }

  function getColHtml(prefix, title, s) {
    const posOpts = `
      <option value="tl">Top Left</option><option value="tc">Top Center</option><option value="tr">Top Right</option>
      <option value="cl">Center Left</option><option value="cc">Center</option><option value="cr">Center Right</option>
      <option value="bl">Bottom Left</option><option value="bc">Bottom Center</option><option value="br">Bottom Right</option>
    `;
    const fitOpts = `
      <option value="cover">Fill Box (Cover)</option>
      <option value="contain">Fit Box (Contain)</option>
      <option value="original">Original Size</option>
    `;
    
    return `
      <div style="display: flex; flex-direction: column; gap: 8px; flex: 1; background: rgba(0,0,0,0.15); padding: 10px; border-radius: 8px;">
        <h5 class="col_header">${title}</h5>
        
        <label>Position: <select id="m_${prefix}_pos" style="width:100%;">${posOpts.replace(`value="${s[`${prefix}Side`]}"`, `value="${s[`${prefix}Side`]}" selected`)}</select></label>
        <label>Image Fit: <select id="m_${prefix}_fit" style="width:100%;">${fitOpts.replace(`value="${s[`${prefix}Fit`]}"`, `value="${s[`${prefix}Fit`]}" selected`)}</select></label>
        
        <div class="cb_row"><label>Image Scale:</label><span><span id="m_${prefix}_scval">${s[`${prefix}Scale`]}</span>%</span></div>
        <input type="range" id="m_${prefix}_sc" min="10" max="300" step="5" value="${s[`${prefix}Scale`]}">

        <div class="cb_row"><label>Text Padding:</label><span><span id="m_${prefix}_padval">${s[`${prefix}Pad`]}</span>px</span></div>
        <input type="range" id="m_${prefix}_pad" min="0" max="400" step="5" value="${s[`${prefix}Pad`]}">

        <div class="cb_row"><label>Top Fade:</label><span><span id="m_${prefix}_tfval">${s[`${prefix}TopFade`]}</span>%</span></div>
        <input type="range" id="m_${prefix}_tf" min="0" max="90" step="1" value="${s[`${prefix}TopFade`]}">

        <div class="cb_row"><label>Bottom Fade:</label><span><span id="m_${prefix}_bfval">${s[`${prefix}BotFade`]}</span>%</span></div>
        <input type="range" id="m_${prefix}_bf" min="0" max="90" step="1" value="${s[`${prefix}BotFade`]}">

        <div class="cb_row"><label>Left Fade:</label><span><span id="m_${prefix}_lfval">${s[`${prefix}LeftFade`]}</span>%</span></div>
        <input type="range" id="m_${prefix}_lf" min="0" max="90" step="1" value="${s[`${prefix}LeftFade`]}">

        <div class="cb_row"><label>Right Fade:</label><span><span id="m_${prefix}_rfval">${s[`${prefix}RightFade`]}</span>%</span></div>
        <input type="range" id="m_${prefix}_rf" min="0" max="90" step="1" value="${s[`${prefix}RightFade`]}">

        <div class="cb_row"><label>Blur Effect:</label><span><span id="m_${prefix}_blval">${s[`${prefix}Blur`]}</span>px</span></div>
        <input type="range" id="m_${prefix}_bl" min="0" max="20" step="1" value="${s[`${prefix}Blur`]}">
      </div>
    `;
  }

  function openCombinedModal() {
    document.getElementById('cb_modal_overlay')?.remove();
    const s = settings();
    const key = currentKey();
    const r = key ? rec(key) : { images: [], locked: true, youtubeUrl: '' };
    const n = r.images.length;
    const curImg = r.images[r.idx] || null;
    const safeCharName = key ? escapeHTML(currentCharacterName()) : 'No Char';

    const overlay = document.createElement('div');
    overlay.id = 'cb_modal_overlay';
    overlay.className = 'cb_popup_overlay';

    overlay.innerHTML = `
      <div class="cb_popup_content">
        <div class="cb_popup_header">
          <span><i class="fa-solid fa-layer-group"></i> Chat Visuals</span>
          <button class="cb_close_btn">&times;</button>
        </div>

        <div class="cb_section">
          <h4><i class="fa-solid fa-panorama"></i> Header Box Image (${safeCharName})</h4>
          
          <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px; background: rgba(0,0,0,0.15); padding: 10px; border-radius: 8px;">
            <label><strong>Banner Mode:</strong>
              <select id="m_b_mode" style="width: 100%; margin-top: 5px;">
                <option value="image" ${s.bannerMode === 'image' ? 'selected' : ''}>Image Gallery</option>
                <option value="youtube" ${s.bannerMode === 'youtube' ? 'selected' : ''}>YouTube Loop</option>
                <option value="off" ${s.bannerMode === 'off' ? 'selected' : ''}>Off</option>
              </select>
            </label>
            <label class="checkbox_label" ${!key ? 'style="opacity:0.5;pointer-events:none;"' : ''}>
              <input type="checkbox" id="m_b_lock" ${r.locked ? 'checked' : ''}><span>Lock to top</span>
            </label>
          </div>
          
          <!-- Image Controls -->
          <div id="m_b_img_controls" style="display: ${s.bannerMode === 'image' ? 'block' : 'none'};">
            <div class="cb_actions">
              <button id="m_b_up" class="menu_button" ${!key ? 'disabled' : ''}><i class="fa-solid fa-plus"></i> Add</button>
              <button id="m_b_del" class="menu_button danger_button" ${!n ? 'disabled' : ''}><i class="fa-solid fa-trash-can"></i> Del</button>
            </div>
            <input type="file" id="m_b_file" accept="image/*" multiple hidden>

            ${n > 1 ? `
            <div class="cb_carousel_nav">
              <button id="m_b_prev" class="menu_button"><i class="fa-solid fa-chevron-left"></i></button>
              <span><b>${r.idx + 1}</b> / <b>${n}</b></span>
              <button id="m_b_next" class="menu_button"><i class="fa-solid fa-chevron-right"></i></button>
            </div>` : ''}

            ${curImg ? `
            <div class="cb_row" style="margin-top: 10px;"><label>Crop:</label><span><span id="m_b_pval">${curImg.pos ?? 45}</span>%</span></div>
            <input type="range" id="m_b_p" min="0" max="100" value="${curImg.pos ?? 45}">
            ` : ''}
          </div>

          <!-- YouTube Controls -->
          <div id="m_b_yt_controls" style="display: ${s.bannerMode === 'youtube' ? 'block' : 'none'};">
            <label><strong>YouTube Video URL:</strong></label>
            <input type="text" id="m_b_yt_url" class="text_pole" style="width: 100%; margin-top: 5px;" placeholder="https://youtube.com/watch?v=..." value="${escapeHTML(r.youtubeUrl || '')}" ${!key ? 'disabled' : ''}>
            <small style="opacity: 0.7;">Plays muted on an infinite loop. Video fills the entire banner area.</small>
          </div>

          <div class="cb_row" style="margin-top: 15px;"><label>Banner Height:</label><span><span id="m_b_hval">${s.bannerHeight}</span>px</span></div>
          <input type="range" id="m_b_h" min="60" max="350" step="5" value="${s.bannerHeight}">
        </div>

        <div class="cb_section">
          <h4><i class="fa-solid fa-user-astronaut"></i> Pfp Management</h4>
          <label class="checkbox_label" style="margin-bottom: 5px;"><input type="checkbox" id="m_a_enable" ${s.avatarEnabled ? 'checked' : ''}><span>Enable NTR Avatars</span></label>
          
          <div style="display: flex; gap: 15px; width: 100%;">
            ${getColHtml('ai', 'AI', s)}
            ${getColHtml('us', 'User', s)}
          </div>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    const header = overlay.querySelector('.cb_popup_header');
    const content = overlay.querySelector('.cb_popup_content');
    let isDragging = false, startX, startY, initialX, initialY;

    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return; 
      isDragging = true;
      const rect = content.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      startX = e.clientX;
      startY = e.clientY;
      
      content.style.position = 'fixed';
      content.style.left = initialX + 'px';
      content.style.top = initialY + 'px';
      content.style.margin = '0';

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(e) {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      content.style.left = (initialX + dx) + 'px';
      content.style.top = (initialY + dy) + 'px';
    }

    function onMouseUp() {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    const close = () => overlay.remove();
    overlay.querySelector('.cb_close_btn').onclick = close;
    
    // Banner Mode Switch
    overlay.querySelector('#m_b_mode').onchange = function() {
      s.bannerMode = this.value;
      save();
      overlay.querySelector('#m_b_img_controls').style.display = this.value === 'image' ? 'block' : 'none';
      overlay.querySelector('#m_b_yt_controls').style.display = this.value === 'youtube' ? 'block' : 'none';
      renderAll();
    };

    if (key) {
      overlay.querySelector('#m_b_lock').onchange = function() { r.locked = this.checked; save(); renderAll(); };
      const fi = overlay.querySelector('#m_b_file');
      overlay.querySelector('#m_b_up').onclick = () => fi.click();
      fi.onchange = async () => { if (fi.files.length) { await addFiles([...fi.files]); openCombinedModal(); }};
      if (n) overlay.querySelector('#m_b_del').onclick = async () => { await removeCurrentBanner(); openCombinedModal(); };
      if (n > 1) {
        overlay.querySelector('#m_b_prev').onclick = () => { step(-1); openCombinedModal(); };
        overlay.querySelector('#m_b_next').onclick = () => { step(1); openCombinedModal(); };
      }
      if (curImg) {
        const bp = overlay.querySelector('#m_b_p');
        bp.oninput = function() { overlay.querySelector('#m_b_pval').textContent = this.value; const img = banner?.querySelector('.cb_img'); if (img) img.style.objectPosition = `50% ${this.value}%`; };
        bp.onchange = function() { curImg.pos = Number(this.value); save(); };
      }
      const ytUrl = overlay.querySelector('#m_b_yt_url');
      ytUrl.oninput = function() { r.youtubeUrl = this.value; };
      ytUrl.onchange = function() { save(); updateBanner(); };
    }
    const bh = overlay.querySelector('#m_b_h');
    bh.oninput = function() { s.bannerHeight = Number(this.value); overlay.querySelector('#m_b_hval').textContent = s.bannerHeight; document.documentElement.style.setProperty('--cb-h', s.bannerHeight + 'px'); };
    bh.onchange = save;

    // Avatar Bindings
    overlay.querySelector('#m_a_enable').onchange = function() { s.avatarEnabled = this.checked; save(); updateAvatarStyle(); };
    
    const bindCol = (prefix) => {
      overlay.querySelector(`#m_${prefix}_pos`).onchange = function() { s[`${prefix}Side`] = this.value; save(); updateAvatarStyle(); };
      overlay.querySelector(`#m_${prefix}_fit`).onchange = function() { s[`${prefix}Fit`] = this.value; save(); updateAvatarStyle(); };
      
      const sliders = [
        { id: 'sc', key: 'Scale' }, { id: 'pad', key: 'Pad' },
        { id: 'tf', key: 'TopFade' }, { id: 'bf', key: 'BotFade' },
        { id: 'lf', key: 'LeftFade' }, { id: 'rf', key: 'RightFade' },
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

  function injectExtensionMenuButton() {
    const extMenu = document.getElementById('extensions_settings2');
    if (!extMenu) return;
    if (document.getElementById('cv_ext_btn_container')) return;

    const container = document.createElement('div');
    container.id = 'cv_ext_btn_container';
    container.innerHTML = `
      <hr style="margin: 10px 0; border-color: var(--SmartThemeBorderColor, #444);">
      <div style="display:flex; justify-content:center; width: 100%;">
        <button id="cv_ext_btn" class="menu_button interactable" style="padding: 10px; width: 100%; font-weight: bold;">
          <i class="fa-solid fa-layer-group"></i> Open Nitwit Tavern Redesign Menu
        </button>
      </div>
    `;
    extMenu.appendChild(container);
    
    document.getElementById('cv_ext_btn').onclick = openCombinedModal;
  }

  jQuery(() => {
    const { eventSource, event_types } = ctx();
    injectExtensionMenuButton();
    eventSource.on(event_types.CHAT_CHANGED, renderAll);
    if (event_types.APP_READY) eventSource.on(event_types.APP_READY, renderAll);

    const chat = document.getElementById('chat');
    if (chat) {
      new MutationObserver(() => {
        const key = currentKey();
        if (!banner || !key || settings().bannerMode === 'off') return;
        if (!peek(key).locked && chat.firstElementChild !== banner) chat.prepend(banner);
      }).observe(chat, { childList: true });
    }
    renderAll();
  });
})();
