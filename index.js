(() => {
  const MODULE = 'chatvisuals';
  const DEFAULTS = { 
    bannerEnabled: true, 
    bannerHeight: 120, 
    chars: {},
    avatarEnabled: true,
    
    // AI Specific Settings (Box width locked to 300px structure internally)
    aiSide: 'tl', aiFit: 'cover', aiScale: 100, aiPad: 140, aiSideFade: 50, aiBotFade: 60, aiBlur: 0,
    
    // User Specific Settings
    usSide: 'tr', usFit: 'cover', usScale: 100, usPad: 140, usSideFade: 50, usBotFade: 60, usBlur: 0
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
    return s;
  }

  function getAvatarCss(prefix, isUserStr, s) {
    const v = s[`${prefix}Side`][0]; 
    const h = s[`${prefix}Side`][1]; 
    const fit = s[`${prefix}Fit`];
    const scale = s[`${prefix}Scale`];
    const pad = s[`${prefix}Pad`];
    const sideFade = s[`${prefix}SideFade`];
    const botFade = s[`${prefix}BotFade`];
    const blurAmount = s[`${prefix}Blur`];
    const width = 300; // Locked structural width, user scales the image inside it instead

    let posCss = '';
    let transform = '';
    
    if (v === 't') posCss += 'top: 0 !important; bottom: auto !important; ';
    else if (v === 'c') { posCss += 'top: 50% !important; bottom: auto !important; '; transform += 'translateY(-50%) '; }
    else if (v === 'b') posCss += 'top: auto !important; bottom: 0 !important; ';

    if (h === 'l') posCss += 'left: 0 !important; right: auto !important; ';
    else if (h === 'c') { posCss += 'left: 50% !important; right: auto !important; '; transform += 'translateX(-50%) '; }
    else if (h === 'r') posCss += 'left: auto !important; right: 0 !important; ';

    if (transform) posCss += `transform: ${transform.trim()} !important; `;

    let mask = '';
    if (h === 'l') mask = `linear-gradient(to right, transparent 0%, black 5%, black ${sideFade}%, transparent 100%)`;
    else if (h === 'r') mask = `linear-gradient(to left, transparent 0%, black 5%, black ${sideFade}%, transparent 100%)`;
    else mask = `linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)`;

    let padCss = '';
    if (h === 'l') padCss = `padding-left: ${pad}px !important;`;
    else if (h === 'r') padCss = `padding-right: ${pad}px !important;`;
    else padCss = `padding-left: ${Math.floor(pad / 2)}px !important; padding-right: ${Math.floor(pad / 2)}px !important;`;

    const justify = h === 'l' ? 'flex-start' : (h === 'r' ? 'flex-end' : 'center');
    const align = h === 'l' ? 'left' : (h === 'r' ? 'right' : 'center');

    const filterRule = blurAmount > 0 ? `filter: blur(${blurAmount}px) !important;` : '';
    
    let imgSizeCss = `width: 100% !important; height: 100% !important; object-fit: cover !important;`;
    if (fit === 'contain') imgSizeCss = `width: 100% !important; height: 100% !important; object-fit: contain !important;`;
    else if (fit === 'original') imgSizeCss = `width: auto !important; height: auto !important; max-width: none !important; object-fit: none !important;`;
    
    const scaleCss = scale !== 100 ? `transform: scale(${scale / 100}) !important; transform-origin: top center !important;` : '';

    return `
      .mes[is_user="${isUserStr}"] .mesAvatarWrapper { 
        position: absolute !important; width: ${width}px !important; max-width: 60% !important; height: 100% !important;
        margin: 0 !important; padding: 0 !important; z-index: 0 !important; pointer-events: none !important; 
        overflow: hidden !important; border-radius: var(--SmartThemeChatMesRounding, 15px) !important; 
        display: flex !important; justify-content: center !important;
        ${posCss}
        -webkit-mask-image: ${mask} !important; mask-image: ${mask} !important;
        ${filterRule} 
      }
      .mes[is_user="${isUserStr}"] .avatar { 
        display: block !important; width: 100% !important; height: 100% !important; 
        -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black ${botFade}%, transparent 100%) !important; 
        mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black ${botFade}%, transparent 100%) !important; 
      }
      .mes[is_user="${isUserStr}"] .avatar img { 
        display: block !important; ${imgSizeCss} ${scaleCss} object-position: top center !important; 
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
    if (!s.avatarEnabled) {
      styleEl.textContent = ''; 
      return;
    }

    styleEl.textContent = `
      .mes { position: relative !important; padding: 0 !important; background-color: var(--SmartThemeChatMesBgc) !important; border-radius: var(--SmartThemeChatMesRounding, 15px) !important; }
      .mes .mes_block, .mes .mes_text { background: transparent !important; border: none !important; box-shadow: none !important; }
      .mes .mes_block { position: relative !important; z-index: 1 !important; width: 100% !important; min-height: 120px !important; padding: 15px !important; }
      
      ${getAvatarCss('ai', 'false', s)}
      ${getAvatarCss('us', 'true', s)}
    `;
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

  const peek = (key) => settings().chars[key] || { images: [], idx: 0, locked: true };
  function rec(key) {
    const s = settings();
    if (!s.chars[key]) s.chars[key] = { images: [], idx: 0, locked: true };
    return s.chars[key];
  }

  function buildBanner() {
    banner = document.createElement('div');
    banner.id = 'cb_banner';
    banner.innerHTML = `<img class="cb_img" alt="">`;
  }

  function updateBanner() {
    const s = settings();
    const key = currentKey();
    if (!banner) return;
    if (!key || !s.bannerEnabled) {
      banner.style.display = 'none';
      return;
    }
    const r = peek(key);
    const n = r.images.length;
    document.documentElement.style.setProperty('--cb-h', s.bannerHeight + 'px');

    if (!n) {
      banner.style.display = 'none';
      return;
    }

    banner.style.display = 'block';
    const im = r.images[r.idx] || r.images[0];
    const img = banner.querySelector('.cb_img');
    if (img.getAttribute('src') !== im.url) img.src = im.url;
    img.style.objectPosition = `50% ${im.pos ?? 45}%`;
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
      if (!settings().bannerEnabled || !key) {
        banner.remove();
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
        const ext = f.type === 'image/jpeg' ? 'jpg' : f.type === 'image/png' ? 'png' : f.type === 'image/webp' ? 'webp' : 'gif';
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
        
        <div class="cb_row"><label>Scale:</label><span><span id="m_${prefix}_scval">${s[`${prefix}Scale`]}</span>%</span></div>
        <input type="range" id="m_${prefix}_sc" min="10" max="300" step="5" value="${s[`${prefix}Scale`]}">

        <div class="cb_row"><label>Text Padding:</label><span><span id="m_${prefix}_padval">${s[`${prefix}Pad`]}</span>px</span></div>
        <input type="range" id="m_${prefix}_pad" min="0" max="400" step="5" value="${s[`${prefix}Pad`]}">

        <div class="cb_row"><label>Side Fade:</label><span><span id="m_${prefix}_ifval">${s[`${prefix}SideFade`]}</span>%</span></div>
        <input type="range" id="m_${prefix}_if" min="10" max="90" step="1" value="${s[`${prefix}SideFade`]}">

        <div class="cb_row"><label>Bottom Fade:</label><span><span id="m_${prefix}_bfval">${s[`${prefix}BotFade`]}</span>%</span></div>
        <input type="range" id="m_${prefix}_bf" min="10" max="90" step="1" value="${s[`${prefix}BotFade`]}">

        <div class="cb_row"><label>Blur Effect:</label><span><span id="m_${prefix}_blval">${s[`${prefix}Blur`]}</span>px</span></div>
        <input type="range" id="m_${prefix}_bl" min="0" max="20" step="1" value="${s[`${prefix}Blur`]}">
      </div>
    `;
  }

  function openCombinedModal() {
    document.getElementById('cb_modal_overlay')?.remove();
    const s = settings();
    const key = currentKey();
    const r = key ? rec(key) : { images: [], locked: true };
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
          <h4><i class="fa-solid fa-panorama"></i> Header Image Box (${safeCharName})</h4>
          <label class="checkbox_label"><input type="checkbox" id="m_b_enable" ${s.bannerEnabled ? 'checked' : ''}><span>Enable Banner</span></label>
          <label class="checkbox_label" ${!key ? 'style="opacity:0.5;pointer-events:none;"' : ''}><input type="checkbox" id="m_b_lock" ${r.locked ? 'checked' : ''}><span>Lock to top</span></label>
          
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

          <div class="cb_row"><label>Height:</label><span><span id="m_b_hval">${s.bannerHeight}</span>px</span></div>
          <input type="range" id="m_b_h" min="60" max="350" step="5" value="${s.bannerHeight}">

          ${curImg ? `
          <div class="cb_row"><label>Crop:</label><span><span id="m_b_pval">${curImg.pos ?? 45}</span>%</span></div>
          <input type="range" id="m_b_p" min="0" max="100" value="${curImg.pos ?? 45}">
          ` : ''}
        </div>

        <div class="cb_section">
          <h4><i class="fa-solid fa-user-astronaut"></i> Pfp Management</h4>
          <label class="checkbox_label" style="margin-bottom: 5px;"><input type="checkbox" id="m_a_enable" ${s.avatarEnabled ? 'checked' : ''}><span>Enable Avatars</span></label>
          
          <div style="display: flex; gap: 15px; width: 100%;">
            ${getColHtml('ai', 'AI Specific', s)}
            ${getColHtml('us', 'User Specific', s)}
          </div>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    // Draggable Logic for the modal
    const header = overlay.querySelector('.cb_popup_header');
    const content = overlay.querySelector('.cb_popup_content');
    let isDragging = false, startX, startY, initialX, initialY;

    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('button')) return; // Ignore clicks on the X button
      isDragging = true;
      const rect = content.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      startX = e.clientX;
      startY = e.clientY;
      
      // Detach from flexbox centering to allow free absolute movement
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
    
    // Banner Bindings
    overlay.querySelector('#m_b_enable').onchange = function() { s.bannerEnabled = this.checked; save(); renderAll(); };
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
        { id: 'if', key: 'SideFade' }, { id: 'bf', key: 'BotFade' }, { id: 'bl', key: 'Blur' }
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
        if (!banner || !key || !settings().bannerEnabled) return;
        if (!peek(key).locked && chat.firstElementChild !== banner) chat.prepend(banner);
      }).observe(chat, { childList: true });
    }
    renderAll();
  });
})();
