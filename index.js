<div class="cb_section">
          <h4 class="cb_collapse_toggle" style="cursor: pointer; user-select: none; display: flex; justify-content: space-between; align-items: center;">
            <span><i class="fa-solid fa-panorama"></i> Header Banner (${safeCharName})</span>
            <i class="fa-solid fa-chevron-down cb_chevron"></i>
          </h4>
          <div class="cb_collapse_content">
            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px; background: rgba(0,0,0,0.15); padding: 10px; border-radius: 8px;">
              <!-- KEEP ALL EXISTING HEADER BANNER CONTENT HERE -->
            </select>
            </label>
          </div>
        </div>

        <div class="cb_section">
          <h4 class="cb_collapse_toggle" style="cursor: pointer; user-select: none; display: flex; justify-content: space-between; align-items: center;">
            <span><i class="fa-solid fa-user-astronaut"></i> Pfp Management</span>
            <i class="fa-solid fa-chevron-down cb_chevron"></i>
          </h4>
          <div class="cb_collapse_content">
            <label class="checkbox_label" style="margin-bottom: 5px;"><input type="checkbox" id="m_a_enable" ${s.avatarEnabled ? 'checked' : ''}><span>Enable NTR Avatars</span></label>
            
            <div style="display: flex; gap: 15px; width: 100%;">
              ${getColHtml('ai', 'AI', s)}
              ${getColHtml('us', 'User', s)}
            </div>
          </div>
        </div>
      </div>`;
