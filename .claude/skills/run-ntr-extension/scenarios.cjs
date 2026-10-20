// NTR scenario checks, kept from the look-module PRs (#278 to #284). Not cleaned up yet: settings saved by one scenario
// leak into the next, the style snapshot is written out three times with the version hardcoded, and NO_TEXT_JS,
// NO_AVATARS_JS and NO_DECOR_JS skip scenarios by hand on refs that lack a file. Clean it up before relying on it.
//
// Run with SillyTavern up (st.sh start), on main and on the branch from the same `st.sh reset`, and diff the output:
//   node .claude/skills/run-ntr-extension/scenarios.cjs KPSTH > out.txt
// The argument picks scenarios by their first letter (none runs all). HTML_OUT, CSS_OUT, AV_CSS_OUT and D_CSS_OUT
// name files to write the full menu HTML and style snapshots to, for cmp.
// Late and failed module loads with the NTR menu open. Prints one line per check; run on main and the branch and diff.
const path = require('path');
const { chromium } = require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright'));
const URL = 'http://127.0.0.1:8000/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = { agEnabled: false, bannerOn: false, fgEnabled: false, rxEnabled: true, layEnabled: true, nodeEnabled: false, rdEnabled: false, nodeMaps: false, uiPage: 'themes' };
const ONLY = process.argv[2] || '';

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const out = (...a) => console.log(...a);

  async function session(name, { settings = {}, hold = [], abort = [], seq = {} }, body) {
    if (ONLY && !ONLY.includes(name[0])) return;
    out(`\n== ${name}`);
    const page = await (await browser.newContext({ viewport: { width: 1400, height: 1000 } })).newPage();
    const errors = [];
    page.on('pageerror', (e) => { if (!/Internal S/.test(e.message)) errors.push(e.message); });
    page.on('console', (m) => { if (m.type() === 'error' && !/horde|favicon|Failed to load resource|Internal S/i.test(m.text())) errors.push(m.text().slice(0, 160)); });
    const gates = {};
    // seq: what each request for a file gets in turn, after the settings reload: 'abort', 'hold' (until release) or 'ok'.
    const seqs = {};
    const reqs = {};
    const release = (n, how = 'ok') => { gates[n]?.open(how); };
    await page.route(/\/third-party\/NTR-Extension\/\w+\.js/, async (route) => {
      const n = route.request().url().match(/\/(\w+)\.js/)[1];
      reqs[n] = (reqs[n] || 0) + 1;
      if (seqs[n]?.length) {
        const a = seqs[n].shift();
        if (a === 'abort') return route.abort();
        if (a === 'hold') {
          let open; const p = new Promise((r) => { open = r; }); gates[n] = { p, open };
          const how = await p;
          delete gates[n];
          if (how === 'abort') return route.abort();
        }
        return route.continue();
      }
      if (gates[n]) {
        const how = await gates[n].p;
        if (how === 'abort') return route.abort();
      }
      return route.continue();
    });
    const ready = async () => {
      await page.waitForFunction(() => window.SillyTavern?.getContext && window.NTR?.api && document.getElementById('cb_node_toggle')
        && SillyTavern.getContext().characters.length > 0, null, { timeout: 60000 });
      await sleep(1500);
    };
    await page.goto(URL);
    await ready();
    await page.evaluate((st) => { Object.assign(NTR.api.settings(), st); SillyTavern.getContext().saveSettingsDebounced(); }, { ...BASE, ...settings });
    await sleep(2500);
    for (const n of hold) { let open; const p = new Promise((r) => { open = r; }); gates[n] = { p, open }; }
    for (const n of abort) gates[n] = { p: Promise.resolve('abort'), open() {} };
    Object.assign(seqs, structuredClone(seq));
    await page.reload();
    await ready();
    const i = await page.evaluate(() => SillyTavern.getContext().characters.findIndex((c) => c.avatar === 'default_Seraphina.png'));
    await page.evaluate((i) => SillyTavern.getContext().selectCharacterById(i), i);
    await page.waitForFunction(() => document.querySelector('#chat .mes'), null, { timeout: 20000 });
    await sleep(1500);
    const ev = (fn, arg) => page.evaluate(fn, arg);
    const t = {
      page, release, ev, reqs,
      async menu(p) { await ev(() => { window.toastr?.clear(); NTR.api.openMenu(); }); if (p) await t.nav(p); await sleep(300); },
      async nav(p) { await ev((p) => document.querySelector(`#cb_modal_overlay .ntr_navi[data-page="${p}"]`).click(), p); await sleep(200); },
      mark: () => ev(() => { window.__ov = document.getElementById('cb_modal_overlay'); }),
      // The state everything below is checked against.
      state: () => ev(() => {
        const ov = document.getElementById('cb_modal_overlay');
        const ask = document.querySelector('.ntr_ask');
        return {
          sameMenu: !!ov && ov === window.__ov,
          menuShown: !!ov && ov.style.display !== 'none',
          prompt: ask ? ask.querySelector('input')?.value ?? 'open' : 'closed',
          waiting: [...document.querySelectorAll('#cb_modal_overlay [data-ntr-wait]')].map((e) => e.dataset.ntrWait),
        };
      }),
      async show(label, extra) { out(label, JSON.stringify({ ...(await t.state()), ...(extra ? await ev(extra) : {}) })); },
      async newTheme() { await t.nav('themes'); await ev(() => document.querySelector('#m_t_new').click()); await sleep(300); await ev(() => { document.querySelector('.ntr_ask input').value = 'Half typed'; }); },
      // Clicks a fold's title once; says whether it changed (a doubled handler opens and closes it again).
      fold: (sec) => ev((sec) => {
        const h = document.querySelector(`#cb_modal_overlay .cb_collapse_toggle[data-sec="${sec}"]`);
        if (!h) return 'missing';
        const before = h.nextElementSibling.style.display;
        h.click();
        const after = h.nextElementSibling.style.display;
        h.click();
        return `${before || 'shown'} -> ${after || 'shown'}`;
      }, sec),
    };
    try { await body(t); } catch (e) { out('FAILED', e.message.split('\n')[0]); }
    out('errors', JSON.stringify(errors));
    await page.context().close();
  }

  const pageInfo = () => {
    const pg = (p) => document.querySelector(`#cb_modal_overlay .ntr_page[data-page="${p}"]`);
    const navOff = (p) => document.querySelector(`#cb_modal_overlay .ntr_navi[data-page="${p}"]`)?.classList.contains('ntr_off');
    const note = (p) => pg(p)?.querySelector(':scope > .ntr_pnote')?.textContent.trim().slice(0, 60) || '';
    return {
      regex: { note: note('regex'), body: pg('regex')?.querySelector('.ntr_pbody').childElementCount },
      agents: { note: note('agents'), drawn: document.querySelector('#m_ag_root')?.childElementCount ?? null, navOff: navOff('agents') },
      fg: { note: note('fg'), banner: !!document.querySelector('#m_b_enable'), navOff: navOff('fg') },
      cast: { hint: document.querySelector('#cb_modal_overlay .ntr_page[data-page="pfp"] .ntr_keepon')?.textContent.trim().slice(0, 50), emoList: document.querySelector('#m_emo_list')?.childElementCount ?? null },
    };
  };

  await session('A late arrivals, prompt open', { hold: ['agents', 'cast', 'overlays', 'regex'] }, async (t) => {
    await t.menu('text');
    await t.ev(() => { const f = document.querySelector('#cb_modal_overlay .m_o_txt'); f.value = 'Typed, not saved'; });
    await t.newTheme();
    await t.mark();
    await t.show('before', pageInfo);
    for (const n of ['regex', 'agents', 'overlays', 'cast']) {
      t.release(n);
      await sleep(1200);
      await t.show(`after ${n}`, pageInfo);
    }
    out('typed field', await t.ev(() => document.querySelector('#cb_modal_overlay .m_o_txt').value));
    for (const sec of ['av_emo', 'av_spk', 'fg_banner', 'rb_css', 'ov_scroll_css']) out('fold', sec, await t.fold(sec));
    // Agents' switch after filling: saves, and the page and its icon light up.
    await t.ev(() => { const c = document.querySelector('#m_ag_enable'); c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); });
    out('agents on', JSON.stringify(await t.ev(() => ({ saved: NTR.api.settings().agEnabled, pageOff: document.querySelector('.ntr_page[data-page="agents"]').classList.contains('ntr_off'), navOff: document.querySelector('.ntr_navi[data-page="agents"]').classList.contains('ntr_off') }))));
    // Hire two agents through the filled page, then drag the second above the first.
    await t.nav('agents');
    for (const name of ['Tester', 'Second']) {
      await t.ev(() => document.querySelector('#m_ag_new').click());
      await sleep(300);
      await t.ev((name) => { const box = document.querySelector('.ntr_ask'); box.querySelector('input').value = name; box.querySelector('.ntr_ask_ok').click(); }, name);
      await sleep(800);
    }
    const order = () => t.ev(() => NTR.api.settings().agents.map((a) => a.name).join(','));
    out('agents hired', await order(), await t.ev(() => document.querySelectorAll('#m_ag_root .m_ag_row').length));
    const grips = await t.ev(() => [...document.querySelectorAll('#m_ag_root .m_ag_row .ntr_grip')].map((g) => { const r = g.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }));
    if (grips.length >= 2) {
      const [a, b] = grips;
      await t.page.mouse.move(b[0], b[1]);
      await t.page.mouse.down();
      for (let k = 1; k <= 10; k++) { await t.page.mouse.move(b[0], b[1] - ((b[1] - a[1] + 12) * k) / 10); await sleep(30); }
      await t.page.mouse.up();
      await sleep(800);
    }
    out('agents after drag', grips.length, await order());
    // Regexes' switch after filling.
    await t.ev(() => { const c = document.querySelector('#m_rx_enable'); c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true })); });
    await sleep(300);
    out('regex off', await t.ev(() => NTR.api.settings().rxEnabled));
  });

  await session('B Edit Layout during arrival', { hold: ['agents'] }, async (t) => {
    await t.menu('layout');
    await t.ev(() => document.querySelector('#m_l_edit').click());
    await sleep(500);
    await t.mark();
    await t.show('editing', () => ({ placing: document.body.classList.contains('ntr_placing') }));
    t.release('agents');
    await sleep(1200);
    await t.show('after agents', () => ({ placing: document.body.classList.contains('ntr_placing') }));
    await t.ev(() => document.querySelector('#cb_place_done').click());
    await sleep(500);
    await t.show('after Done', () => ({ placing: document.body.classList.contains('ntr_placing'), agDrawn: document.querySelector('#m_ag_root')?.childElementCount ?? null }));
  });

  await session('C failed loads', { abort: ['cast', 'regex'] }, async (t) => {
    await t.menu();
    await t.newTheme();
    await t.mark();
    await sleep(1500);
    await t.show('after failures', pageInfo);
    await t.ev(() => { const c = document.querySelector('#m_rx_enable'); c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true })); });
    await sleep(300);
    out('failed regex page switch', await t.ev(() => NTR.api.settings().rxEnabled));
  });

  await session('D closed or reopened while loading', { hold: ['agents', 'overlays'] }, async (t) => {
    await t.menu();
    await t.ev(() => NTR.api.closeMenu());
    t.release('agents');
    await sleep(1200);
    out('menu after arrival', await t.ev(() => !!document.getElementById('cb_modal_overlay')));
    await t.menu('agents');
    await t.mark();
    await t.show('reopened', pageInfo);
    await t.ev(() => NTR.api.closeMenu());
    await t.menu('fg');
    await t.mark();
    t.release('overlays');
    await sleep(1200);
    await t.show('overlays into reopened menu', pageInfo);
  });

  await session('E Visual Novel first pick, then maps', { hold: ['opening', 'map'] }, async (t) => {
    await t.menu('reader');
    await t.ev(() => document.querySelector('#cb_modal_overlay input[name="cbr_rdstyle"][value="vn"]').click());
    await sleep(2500);
    await t.mark();
    const vnInfo = () => ({
      heads: ['vn_open', 'vn_map'].map((k) => document.querySelectorAll(`#cb_modal_overlay [data-sec="${k}"]`).length),
      opening: document.querySelector('#cb_modal_overlay [data-sec="vn_open"]')?.nextElementSibling?.textContent.replace(/\s+/g, ' ').trim().slice(0, 50),
      mapBody: !!document.querySelector('#m_map_body'),
    });
    await t.show('picked', vnInfo);
    t.release('opening');
    await sleep(1200);
    await t.show('after opening', vnInfo);
    await t.ev(() => { const c = document.querySelector('#m_map_on'); c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); });
    await sleep(500);
    await t.mark();
    await t.show('maps ticked', vnInfo);
    t.release('map');
    await sleep(1200);
    await t.show('after map', vnInfo);
    for (const sec of ['rd_vn', 'vn_guide', 'vn_prompt']) out('fold', sec, await t.fold(sec));
  });

  await session('F Visual Novel settings late', { settings: { rdEnabled: true, nodeEnabled: true }, hold: ['vn'] }, async (t) => {
    await t.menu('reader');
    await t.newTheme();
    await t.nav('reader');
    await t.mark();
    const vnPart = () => ({ guide: !!document.querySelector('#m_g_body'), hint: document.querySelector('#cb_modal_overlay [data-sec="rd_vn"]')?.nextElementSibling?.textContent.replace(/\s+/g, ' ').trim().slice(0, 40) });
    await t.show('waiting', vnPart);
    t.release('vn');
    await sleep(2500);
    await t.show('after vn', vnPart);
    for (const sec of ['vn_guide', 'vn_prompt', 'av_emo']) out('fold', sec, await t.fold(sec));
  });

  await session('G cast fails with Visual Novel on', { settings: { rdEnabled: true, nodeEnabled: true }, abort: ['cast'] }, async (t) => {
    await t.menu('reader');
    await sleep(1500);
    const vnPart = () => ({ hint: document.querySelector('#cb_modal_overlay [data-sec="rd_vn"]')?.nextElementSibling?.textContent.replace(/\s+/g, ' ').trim().slice(0, 90), toasts: document.querySelectorAll('.toast-error').length });
    await t.show('first', vnPart);
    await sleep(3000);
    await t.show('3 s later', vnPart);
  });

  for (const how of ['ok', 'abort']) {
    await session(`I cast retry ${how} while the menu draws`, { seq: { cast: ['abort', 'hold'] } }, async (t) => {
      const info = () => ({
        emotions: document.querySelector('#cb_modal_overlay .ntr_page[data-page="pfp"] .ntr_keepon')?.textContent.replace(/\s+/g, ' ').trim().slice(0, 40),
        emoList: document.querySelector('#m_emo_list')?.childElementCount ?? null,
        vn: document.querySelector('#cb_modal_overlay [data-sec="rd_vn"]')?.nextElementSibling?.textContent.replace(/\s+/g, ' ').trim().slice(0, 40),
        errorToasts: document.querySelectorAll('.toast-error').length,
      });
      // Visual Novel Mode from its button by the send box: it retries cast.js, which is held.
      await t.ev(() => document.querySelector('#cb_node_toggle').click());
      await sleep(400);
      for (let k = 0; k < 3; k++) { await t.menu('pfp'); await sleep(200); }
      await t.ev(() => window.toastr?.clear());
      await sleep(400);
      await t.mark();
      await t.show('while retrying', info);
      t.release('cast', how);
      await sleep(2500);
      await t.show('after retry', info);
      out('cast.js requests', t.reqs.cast);
    });
  }

  // Elements' CSS on (a shaped reasoning box), so a late elements.js shows up in the style tag.
  const EL_ON = { rbEnabled: true, rbBoxShapeOn: true, rbBoxShape: 'extra' };
  const elInfo = () => ({
    note: document.querySelector('#cb_modal_overlay .ntr_page[data-page="elements"] .ntr_pnote')?.textContent.trim().slice(0, 70) ?? null,
    css: /\.mes_reasoning \{ border-radius: 20px/.test(document.getElementById('aw_dynamic_style')?.textContent || ''),
    loaded: !!window.NTR.elements,
  });
  for (const [label, opts, how] of [['late', { seq: { elements: ['hold'] } }, 'ok'], ['late then failed', { seq: { elements: ['hold'] } }, 'abort'], ['failed at once', { abort: ['elements'] }, null]]) {
    await session(`J elements ${label}`, { settings: EL_ON, ...opts }, async (t) => {
      await t.menu('elements');
      await t.newTheme();
      await t.nav('elements');
      await t.mark();
      await t.show('at start', elInfo);
      if (how) { t.release('elements', how); await sleep(1500); await t.show('after release', elInfo); }
    });
  }

  // Text Formatting's CSS on (a red name), so a late text.js shows up in the style tag. Elements stays on beside it.
  const TF_ON = { ...EL_ON, tfEnabled: true, tfNameColorOn: true, tfNameColor: 'rgba(255, 0, 0, 1)' };
  const tfInfo = () => ({
    note: document.querySelector('#cb_modal_overlay .ntr_page[data-page="text"] .ntr_pnote')?.textContent.trim().slice(0, 70) ?? null,
    css: /\.mes \.name_text \{ color: rgba\(255, 0, 0, 1\)/.test(document.getElementById('aw_dynamic_style')?.textContent || ''),
    loaded: !!window.NTR.text,
    elCss: /\.mes_reasoning \{ border-radius: 20px/.test(document.getElementById('aw_dynamic_style')?.textContent || ''),
    elNote: document.querySelector('#cb_modal_overlay .ntr_page[data-page="elements"] .ntr_pnote')?.textContent.trim().slice(0, 40) ?? null,
  });
  for (const [label, opts, rel] of [
    ['late', { seq: { text: ['hold'] } }, [['text', 'ok']]],
    ['late then failed', { seq: { text: ['hold'] } }, [['text', 'abort']]],
    ['failed at once', { abort: ['text'] }, []],
    ['and elements both late', { seq: { text: ['hold'], elements: ['hold'] } }, [['elements', 'ok'], ['text', 'ok']]],
  ]) {
    await session(`L text ${label}`, { settings: TF_ON, ...opts }, async (t) => {
      await t.menu('text');
      await t.newTheme();
      await t.nav('text');
      await t.mark();
      await t.show('at start', tfInfo);
      for (const [n, how] of rel) { t.release(n, how); await sleep(1500); await t.show(`after ${n} ${how}`, tfInfo); }
    });
  }

  // NTR's style tags across setups, each set on top of the start values, restyled, and read back. Last, a mix saved
  // and reloaded, read at the first draw.
  const TF = { tfEnabled: true, tfNameColorOn: true, tfNameColor: 'rgba(255, 0, 0, 1)', tfNameFontOn: true, tfNameFont: 'Georgia', tfNameSizeOn: true, tfNameSize: 1.3,
    tfNameWeightOn: true, tfNameWeight: 'extra', tfNameFxOn: true, tfNameFx: 'glow', tfNameFxStr: 3, tfAiMainOn: true, tfAiMain: 'rgba(200, 200, 0, 1)',
    tfAiEmOn: true, tfAiEm: 'rgba(0, 200, 0, 1)', tfAiQuoteOn: true, tfAiQuote: 'rgba(0, 0, 200, 1)', tfUserAlignOn: true, tfUserAlign: 'center',
    tfUserFxOn: true, tfUserFx: 'outline', tfUserFxColorOn: true, tfUserFxColor: 'rgba(10, 20, 30, 1)', tfAiFxOn: true, tfAiFx: 'shadow', tfAiSizeOn: true, tfAiSize: 1.1 };
  const PLATE = { tfEnabled: true, tfPlateBgOn: true, tfPlateBg: 'rgba(40, 40, 90, 1)', tfPlateBorderOn: true, tfPlateBorderWidth: 2, tfPlateRoundOn: true, tfPlateRound: 8, tfPlatePosOn: true, tfPlatePos: 'edge' };
  const COMBOS = {
    defaults: {},
    text: TF,
    plate: PLATE,
    plateBubbles: { ...PLATE, ovEnabled: true, ovBubOn: true, ovBubAlign: 'sides', avatarEnabled: true, usEnabled: true, usStyle: 'inline', usSide: 'tc' },
    elements: { ...EL_ON, ovScrollOn: true, ovScrollColorOn: true, ovScrollColor: 'rgba(255, 0, 0, 1)' },
    textOff: { ...TF, tfEnabled: false },
    ntrOff: { ...TF, ...EL_ON, masterEnabled: false },
  };
  await session('K style tags', {}, async (t) => {
    const css = {};
    const read = () => t.ev(() => [...document.querySelectorAll('style')].filter((x) => /ntr|cb_|aw_/i.test(x.id)).map((x) => x.id + ':' + x.textContent).join('\n').replace(/2\.69\.\d+/g, 'V'));
    for (const [name, combo] of Object.entries(COMBOS)) {
      css[name] = await t.ev(({ combo, all }) => {
        const s = NTR.api.settings();
        window.__orig = window.__orig || structuredClone(s);
        for (const k of all) s[k] = structuredClone(window.__orig[k]);
        Object.assign(s, combo);
        NTR.api.look.restyle();
        return true;
      }, { combo, all: [...new Set(Object.values(COMBOS).flatMap(Object.keys))] });
      await sleep(300);
      css[name] = await read();
    }
    await t.ev((combo) => { Object.assign(NTR.api.settings(), combo); SillyTavern.getContext().saveSettingsDebounced(); }, { ...TF, ...PLATE, ...EL_ON, masterEnabled: true });
    await sleep(2500);
    await t.page.reload();
    await t.page.waitForFunction(() => window.NTR?.api && document.getElementById('cb_node_toggle'), null, { timeout: 60000 });
    css.reloaded = await read();
    const h = (x) => require('crypto').createHash('sha1').update(x).digest('hex').slice(0, 12);
    for (const [k, v] of Object.entries(css)) out('css', k, v.length, h(v));
    require('fs').writeFileSync(process.env.CSS_OUT || '/dev/null', Object.entries(css).map(([k, v]) => `===== ${k}\n${v}`).join('\n'));
  });

  // The Text Formatting page's own controls: its switch, a pick, an effect, a shared row, and the nameplate picture by link.
  await session('M text page controls', {}, async (t) => {
    await t.menu('text');
    const style = () => t.ev(() => document.getElementById('aw_dynamic_style').textContent);
    const click = (sel) => t.ev((sel) => document.querySelector(sel).click(), sel);
    const pick = (name, v) => t.ev(({ name, v }) => { const r = document.querySelector(`#cb_modal_overlay input[name="cbr_${name}"][value="${v}"]`); r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); return !!r; }, { name, v });
    await t.ev(() => { const c = document.querySelector('#m_tf_enable'); c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); });
    await t.ev(() => { const c = document.querySelector('#cb_modal_overlay .m_o_on[data-key="tfNameWeightOn"]'); c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); });
    await pick('tfnweight', 'bold');
    await t.ev(() => { const c = document.querySelector('#cb_modal_overlay .m_o_on[data-key="tfUserFxOn"]'); c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); });
    await pick('tfuserfx', 'shadow');
    await pick('tfuseralign', 'right');
    await sleep(300);
    const s1 = await t.ev(() => { const s = NTR.api.settings(); return { tfEnabled: s.tfEnabled, weight: s.tfNameWeight, fx: s.tfUserFx, align: s.tfUserAlign }; });
    const css1 = await style();
    out('settings', JSON.stringify(s1), 'css bold', /font-weight: 700/.test(css1), 'css shadow', /\.mes\[is_user="true"\] \.mes_text \{[^}]*text-shadow/.test(css1));
    await click('#m_plate_url');
    await sleep(300);
    await t.ev(() => { const box = document.querySelector('.ntr_ask'); box.querySelector('input').value = 'http://127.0.0.1:8000/img/ai4.png'; box.querySelector('.ntr_ask_ok').click(); });
    await sleep(2500);
    out('plate', JSON.stringify(await t.ev(() => ({ img: NTR.api.settings().tfPlateImg, prev: !!document.querySelector('#m_plate_prev img'), clr: !document.querySelector('#m_plate_clr').disabled }))));
    await click('#m_plate_clr');
    await sleep(500);
    out('plate cleared', JSON.stringify(await t.ev(() => ({ img: NTR.api.settings().tfPlateImg, prev: !!document.querySelector('#m_plate_prev img') }))));
    await t.ev(() => { const c = document.querySelector('#m_tf_enable'); c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true })); });
    await sleep(300);
    out('off', await t.ev(() => NTR.api.settings().tfEnabled), 'css bold gone', !/font-weight: 700/.test(await style()));
  });

  // Overall Font Scale: applied with text.js, SillyTavern's own without it, and applied once a late text.js arrives.
  const FS = { tfEnabled: true, ovFontOn: true, ovFont: 1.6 };
  const fsInfo = () => ({ scale: (document.getElementById('aw_dynamic_style')?.textContent.match(/--fontScale: [\d.]+/) || ['none'])[0], text: !!window.NTR.text });
  for (const [label, opts, rel] of [['loaded', {}, []], ['text.js failed', { abort: ['text'] }, []], ['text.js late', { seq: { text: ['hold'] } }, [['text', 'ok']]]]) {
    if (label !== 'loaded' && process.env.NO_TEXT_JS) continue;
    await session(`N font scale, ${label}`, { settings: FS, ...opts }, async (t) => {
      await t.show('at start', fsInfo);
      for (const [n, how] of rel) { t.release(n, how); await sleep(1500); await t.show(`after ${n} ${how}`, fsInfo); }
    });
  }

  // Avatars: NTR's style tags across avatar setups, and the other pages' CSS that reads avatar settings.
  const AV = { avatarEnabled: true, aiEnabled: true, usEnabled: true };
  const AV_COMBOS = {
    avDefaults: AV,
    aiBackdrop: { ...AV, aiStyle: 'backdrop', aiShape: 'none', aiFit: 'cover', aiFadeTop: 20, aiFadeBR: 30, aiBlur: 3, aiFocus: 30, aiPad: 40 },
    shapes: { ...AV, aiStyle: 'backdrop', aiShape: 'rectangle', aiCorner: 25, usStyle: 'popout', usShape: 'heart', usScale: 140, usPopX: 30, usPopY: -20 },
    starOriginal: { ...AV, aiStyle: 'inline', aiShape: 'star', aiSide: 'bl', usStyle: 'backdrop', usShape: 'none', usFit: 'original', usFadeLeft: 25 },
    stShapes: { ...AV, aiEnabled: false, aiShape: 'heart', usEnabled: false, usShape: 'square', usCorner: 15, usFocus: 70 },
    pageOff: { ...AV, avatarEnabled: false, aiShape: 'star', usShape: 'rectangle', usCorner: 30 },
    namesHide: { ...AV, aiStyle: 'backdrop', ovNamesOn: true, ovNames: 'hide' },
    namesHidePageOff: { ...AV, avatarEnabled: false, ovNamesOn: true, ovNames: 'hide', aiShape: 'heart' },
    bubbles: { ...AV, aiStyle: 'backdrop', ovEnabled: true, ovBubOn: true, ovBubAlign: 'sides', ovBubTail: 'curved' },
    plateEdge: { ...AV, usStyle: 'inline', usSide: 'tc', aiStyle: 'backdrop', tfEnabled: true, tfPlatePosOn: true, tfPlatePos: 'edge', tfPlateBgOn: true, tfPlateBg: 'rgba(40, 40, 90, 1)' },
    decorBoxes: { ...AV, aiStyle: 'backdrop', ovEnabled: true, ovAiBgOn: true, ovAiBg: 'color', ovAiBgColor: 'rgba(10, 10, 40, 1)', ovUsBorderOn: true, ovUsBorder: 'line' },
    mdAvatar: { ...AV, mdOn: true, mdAv: ['num', 'gen', 'tok'], usStyle: 'inline' },
    squareUi: { ...AV, ovEnabled: true, ovShapeOn: true, ovShape: 'square', aiStyle: 'popout' },
    ntrOff: { ...AV, aiStyle: 'backdrop', aiShape: 'heart', masterEnabled: false },
  };
  await session('P avatar style tags', {}, async (t) => {
    const css = {};
    const read = () => t.ev(() => [...document.querySelectorAll('style')].filter((x) => /ntr|cb_|aw_/i.test(x.id)).map((x) => x.id + ':' + x.textContent).join('\n').replace(/2\.69\.\d+/g, 'V'));
    const all = [...new Set(Object.values(AV_COMBOS).flatMap(Object.keys))];
    for (const [name, combo] of Object.entries(AV_COMBOS)) {
      await t.ev(({ combo, all }) => {
        const s = NTR.api.settings();
        window.__orig = window.__orig || structuredClone(s);
        for (const k of all) s[k] = structuredClone(window.__orig[k]);
        Object.assign(s, combo);
        NTR.api.look.restyle();
      }, { combo, all });
      await sleep(400);
      css[name] = await read();
    }
    await t.ev((combo) => { Object.assign(NTR.api.settings(), combo); SillyTavern.getContext().saveSettingsDebounced(); }, { ...AV_COMBOS.shapes, ...AV_COMBOS.bubbles, aiStyle: 'backdrop', masterEnabled: true });
    await sleep(2500);
    await t.page.reload();
    await t.page.waitForFunction(() => window.NTR?.api && document.getElementById('cb_node_toggle'), null, { timeout: 60000 });
    await sleep(1500);
    css.reloaded = await read();
    const h = (x) => require('crypto').createHash('sha1').update(x).digest('hex').slice(0, 12);
    for (const [k, v] of Object.entries(css)) out('css', k, v.length, h(v));
    require('fs').writeFileSync(process.env.AV_CSS_OUT || '/dev/null', Object.entries(css).map(([k, v]) => `===== ${k}\n${v}`).join('\n'));
  });

  // Avatars: the chat pictures, the pop-out, and the page's controls.
  await session('Q avatar page and pictures', { settings: { ...AV, aiStyle: 'backdrop', aiShape: 'none' }, seq: { cast: ['hold'] } }, async (t) => {
    const imgs = () => t.ev(() => [...document.querySelectorAll('#chat .mes .avatar img')].map((i) => ({ ar: !!i.style.getPropertyValue('--cb-ar'), nw: !!i.parentElement.style.getPropertyValue('--cb-nw'), full: i.dataset.ntrFull || '', src: (i.getAttribute('src') || '').replace(/\?.*/, '') })));
    out('pictures', JSON.stringify(await imgs()));
    // Emotions arrives late into the page.
    await t.menu('pfp');
    await t.mark();
    await t.show('emotions waiting', () => ({ emo: !!document.querySelector('#m_emo_list') }));
    t.release('cast');
    await sleep(1500);
    await t.show('emotions filled', () => ({ emo: !!document.querySelector('#m_emo_list') }));
    const st = () => t.ev(() => { const s = NTR.api.settings(); return ['avatarEnabled', 'aiEnabled', 'aiStyle', 'aiShape', 'aiSide', 'aiFit', 'aiFadeTop', 'aiFadeBR', 'aiScale', 'aiPopX', 'aiPopY', 'aiBlur', 'aiCorner'].map((k) => `${k}=${s[k]}`).join(' '); });
    const pick = (name, v) => t.ev(({ name, v }) => { const r = document.querySelector(`#cb_modal_overlay input[name="cbr_${name}"][value="${v}"]`); r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }, { name, v });
    const grp = () => t.ev(() => [...document.querySelectorAll('#m_ai_col .cb_grp')].map((g) => g.dataset.only + ':' + g.style.display).join(' | '));
    const dims = () => t.ev(() => ['fowrap', 'crwrap', 'fitwrap', 'scwrap', 'padwrap'].map((k) => `${k}${document.querySelector('#m_ai_' + k).classList.contains('cb_dim') ? '-dim' : ''}`).join(' '));
    await pick('aishape', 'rectangle');
    await pick('aipos', 'tr');
    await pick('aifit', 'original');
    out('after picks', await st(), '|', await dims());
    await pick('aishape', 'none');
    out('shape none', await dims());
    // A fade: pick a cell, then move the slider.
    await pick('aifade', 'br');
    await t.ev(() => { const sl = document.querySelector('#m_ai_fade'); sl.value = 35; sl.dispatchEvent(new Event('input', { bubbles: true })); sl.dispatchEvent(new Event('change', { bubbles: true })); });
    out('fade', await st(), await t.ev(() => document.querySelector('#m_ai_fadelab').textContent + ' ' + document.querySelector('#m_ai_fadeval').textContent + ' lit=' + document.querySelectorAll('#m_ai_col .cb_fadegrid .cb_fon').length));
    // A slider typed by hand.
    await t.ev(() => document.querySelector('#m_ai_scval').click());
    await t.ev(() => { const b = document.querySelector('.ntr_slbox'); b.value = '133'; b.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); });
    await sleep(300);
    out('typed scale', await st(), await t.ev(() => document.querySelector('#m_ai_sc').value));
    // Clear Fades asks first.
    await t.ev(() => document.querySelector('#m_ai_fadeclr').click());
    await sleep(300);
    await t.ev(() => document.querySelector('.ntr_ask .ntr_ask_ok').click());
    await sleep(300);
    out('cleared', await st());
    // Style switches the groups that show.
    await pick('aistyle', 'popout');
    await sleep(800);
    out('popout', await grp());
    out('pop layer', JSON.stringify(await t.ev(() => { const el = document.querySelector('#cb_pop_ai'); return { shown: el?.style.display, src: (el?.getAttribute('src') || '').replace(/\?.*/, ''), status: document.querySelector('#m_ai_pstat')?.textContent }; })));
    // Edit Placement from the Pop Out group: drag the AI pop-out, then Done updates the sliders.
    await t.ev(() => document.querySelector('#m_ai_place').click());
    await sleep(600);
    const box = await t.ev(() => { const b = document.querySelector('.cb_place_box[data-id="ai"]'); if (!b) return null; const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
    if (box) {
      await t.ev(() => document.querySelector('.cb_place_box[data-id="ai"]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
      await t.page.mouse.move(box[0], box[1]); await t.page.mouse.down();
      for (let k = 1; k <= 8; k++) { await t.page.mouse.move(box[0] + k * 5, box[1] + k * 3); await sleep(30); }
      await t.page.mouse.up();
      await sleep(300);
    }
    await t.ev(() => document.querySelector('#cb_place_done').click());
    await sleep(600);
    out('placed', !!box, await st(), await t.ev(() => `ox=${document.querySelector('#m_ai_ox')?.value} oxval=${document.querySelector('#m_ai_oxval')?.textContent}`));
    // The side's switch and the page switch.
    await t.ev(() => { const c = document.querySelector('#m_ai_on'); c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true })); });
    out('side off', await st(), await t.ev(() => document.querySelector('#m_ai_body').classList.contains('cb_dim')));
    await t.ev(() => { const c = document.querySelector('#m_ai_on'); c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); });
    await t.ev(() => { const c = document.querySelector('#m_a_enable'); c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true })); });
    out('page off', await st(), await t.ev(() => document.querySelector('.ntr_navi[data-page="pfp"]').classList.contains('ntr_off')));
    await t.ev(() => { const c = document.querySelector('#m_a_enable'); c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); });
    // Reset asks first, then redraws the menu, keeping the scroll and the side's switch.
    await t.ev(() => { document.querySelector('#cb_modal_overlay .ntr_body').scrollTop = 600; });
    await t.ev(() => document.querySelector('#m_ai_reset').click());
    await sleep(300);
    await t.ev(() => document.querySelector('.ntr_ask .ntr_ask_ok').click());
    await sleep(600);
    out('reset', await st(), await t.ev(() => `scroll=${document.querySelector('#cb_modal_overlay .ntr_body').scrollTop} on=${document.querySelector('#m_ai_on').checked}`));
    // NTR off and on again, and a chat reload with the menu open.
    await t.ev(() => document.getElementById('ntr_power').click()); await sleep(800);
    await t.ev(() => document.getElementById('ntr_power').click()); await sleep(1200);
    await t.ev(() => SillyTavern.getContext().reloadCurrentChat()); await sleep(2500);
    out('pictures again', JSON.stringify(await imgs()));
  });

  // Avatar Management without avatars.js (failed, or late): no NTR avatar CSS, no pop-out, Names Hide off, other pages
  // stop making room for NTR's avatars, and the page keeps Emotions.
  const AVF = { ...AV, ovNamesOn: false, aiStyle: 'popout', usStyle: 'backdrop', tfEnabled: true, tfPlatePosOn: true, tfPlatePos: 'edge', tfPlateBgOn: true, tfPlateBg: 'rgba(40, 40, 90, 1)' };
  const avfInfo = () => {
    const css = document.getElementById('aw_dynamic_style')?.textContent || '';
    const pg = document.querySelector('#cb_modal_overlay .ntr_page[data-page="pfp"]');
    return {
      loaded: !!window.NTR.avatars,
      backdropCss: /\.mes\[is_user="true"\] \{ position: relative !important; padding: 0/.test(css),
      popCss: /#cb_pop_ai/.test(css.replace(/#cb_pop_layer[^{]*\{[^}]*\}/g, '')),
      plateRoomUs: /body:not\(\.ntr_book\) #chat \.mes\[is_user="true"\] \.ch_name \.name_text/.test(css),
      namesHidden: /\.mesAvatarWrapper, #chat \.mes \.ch_name \.name_text, #chat \.mes \.ch_name \.timestamp/.test(css),
      pop: document.querySelector('#cb_pop_ai')?.style.display || '',
      note: pg?.querySelector(':scope > .ntr_pnote')?.textContent.trim().slice(0, 50) ?? null,
      emotions: !!pg?.querySelector('#m_emo_list'), legend: !!pg?.querySelector('.ntr_legend'), sw: !!pg?.querySelector('#m_a_enable'),
    };
  };
  for (const [label, opts, settings, rel] of [
    ['failed at once', { abort: ['avatars'] }, AVF, []],
    ['failed, Names Hide', { abort: ['avatars'] }, { ...AV, ovNamesOn: true, ovNames: 'hide' }, []],
    ['late', { seq: { avatars: ['hold'] } }, AVF, [['avatars', 'ok']]],
  ]) {
    if (process.env.NO_AVATARS_JS) continue;
    await session(`R avatars ${label}`, { settings, ...opts }, async (t) => {
      await t.menu('pfp');
      await sleep(1200);
      await t.newTheme();
      await t.nav('pfp');
      await t.mark();
      await t.show('at start', avfInfo);
      for (const [n, how] of rel) { t.release(n, how); await sleep(2000); await t.show(`after ${n} ${how}`, avfInfo); }
    });
  }
  // The same setup with avatars.js loaded, for comparison (and on main).
  await session('R avatars loaded', { settings: AVF }, async (t) => {
    await t.menu('pfp');
    await sleep(1200);
    await t.show('loaded', avfInfo);
  });

  // UI Decor: style tags (Layout's own included) across setups, bubble runs with more messages, and the page's controls.
  const DOFF = { ovShapeOn: false, ovBlurOn: false, ovShadowOn: false, ovPanelBgOn: false, ovPanelBorderOn: false, ovAiShapeOn: false, ovAiBgOn: false, ovAiBorderOn: false,
    ovUsShapeOn: false, ovUsBgOn: false, ovUsBorderOn: false, ovSendShapeOn: false, ovSendBgOn: false, ovSendBorderOn: false, ovBubOn: false };
  const GAPS = { layEnabled: true, ovMesGapOn: true, ovMesGap: 20, ovSendPosOn: true, ovSendPos: 'separate', ovSendGap: 12 };
  const HIDE = { avatarEnabled: true, ovNamesOn: true, ovNames: 'hide' };
  const BUB = (tail, more = {}) => ({ ovEnabled: true, ovBubOn: true, ovBubTail: tail, ...more });
  const D_COMBOS = {
    decorOffGapsHide: { ...DOFF, ovEnabled: false, ...GAPS, ...HIDE },
    decorOnNothingGaps: { ...DOFF, ovEnabled: true, ...GAPS },
    decorOnNothingAtAll: { ...DOFF, ovEnabled: true, layEnabled: false, ovNamesOn: false },
    decorOffNothing: { ...DOFF, ovEnabled: false, layEnabled: false, ovNamesOn: false },
    hideOnly: { ...DOFF, ovEnabled: true, ...HIDE },
    shapeRounded: { ovEnabled: true, ovShapeOn: true, ovShape: 'rounded', ovRound: 14, ovBlurOn: true, ovBlur: 5, ovShadowOn: true, ovShadow: 3 },
    shapeSquare: { ovEnabled: true, ovShapeOn: true, ovShape: 'square' },
    panel: { ovEnabled: true, ovPanelBgOn: true, ovPanelBg: 'color', ovPanelBgColor: 'rgba(20, 20, 60, 1)', ovPanelBgOpacity: 70, ovPanelBorderOn: true, ovPanelBorder: 'line', ovPanelBorderWidth: 2 },
    messages: { ovEnabled: true, ovAiShapeOn: true, ovAiShape: 'rounded', ovAiRound: 12, ovAiBgOn: true, ovAiBg: 'color', ovAiBgColor: 'rgba(60, 20, 20, 1)', ovUsBgOn: true, ovUsBg: 'clear', ovUsBorderOn: true, ovUsBorder: 'line', ovUsBorderWidth: 2 },
    sendBox: { ovEnabled: true, ovSendShapeOn: true, ovSendShape: 'square', ovSendBgOn: true, ovSendBg: 'clear', ovSendBorderOn: true, ovSendBorder: 'line', ...GAPS },
    freeSend: { ovEnabled: true, layEnabled: true, laySend: 'free', ovShapeOn: true, ovShape: 'rounded', ovRound: 16, ovPanelBorderOn: true, ovPanelBorder: 'line', ovSendShapeOn: true, ovSendShape: 'rounded', ovSendRound: 9 },
    bubNone: BUB('none', { ovBubTailPos: 'top', ovBubAlign: 'left', ovBubFit: 'fill' }),
    bubPointed: BUB('pointed', { ovBubTailPos: 'bottom', ovBubAlign: 'sides', ovBubInk: 'dark', ovAiBgOn: true, ovAiBg: 'color' }),
    bubCurved: BUB('curved', { ovBubTailPos: 'top', ovBubAlign: 'swap', ovBubInk: 'light', ovBubWidth: 70 }),
    bubThoughtBorder: BUB('thought', { ovBubTailPos: 'bottom', ovAiBorderOn: true, ovAiBorder: 'line', ovAiBorderWidth: 3, ovUsBorderOn: true, ovUsBorder: 'line' }),
    bubPlateDetails: BUB('pointed', { ovBubAlign: 'sides', tfEnabled: true, tfPlatePosOn: true, tfPlatePos: 'edge', avatarEnabled: true, usEnabled: true, usStyle: 'inline', usSide: 'tc', mdOn: true, mdBelow: ['date'] }),
    ntrOffDecor: { ovEnabled: true, ovShapeOn: true, ovBubOn: true, masterEnabled: false },
  };
  await session('S decor style tags', {}, async (t) => {
    const css = {};
    const read = () => t.ev(() => [...document.querySelectorAll('style')].filter((x) => /ntr|cb_|aw_/i.test(x.id)).map((x) => x.id + ':' + x.textContent).join('\n').replace(/2\.69\.\d+/g, 'V'));
    const all = [...new Set(Object.values(D_COMBOS).flatMap(Object.keys))];
    for (const [name, combo] of Object.entries(D_COMBOS)) {
      await t.ev(({ combo, all }) => {
        const s = NTR.api.settings();
        window.__orig = window.__orig || structuredClone(s);
        for (const k of all) s[k] = structuredClone(window.__orig[k]);
        Object.assign(s, combo);
        NTR.api.look.restyle();
      }, { combo, all });
      await sleep(400);
      css[name] = await read();
    }
    // Bubble runs: two more AI messages and one of yours, grouped.
    await t.ev(({ combo, all }) => { const s = NTR.api.settings(); for (const k of all) s[k] = structuredClone(window.__orig[k]); Object.assign(s, combo); NTR.api.look.restyle(); }, { combo: BUB('pointed', { ovBubGroup: 'group' }), all });
    await t.ev(() => {
      const c = SillyTavern.getContext();
      for (const [t, user] of [['Two', false], ['Three', false], ['Mine', true]]) { const m = { name: user ? c.name1 : c.name2, is_user: user, is_system: false, send_date: Date.now(), mes: t, extra: {} }; c.chat.push(m); c.addOneMessage(m); }
    });
    await sleep(1000);
    const runs = () => t.ev(() => [...document.querySelectorAll('#chat > .mes')].map((m) => (m.className.match(/ntr_bub_(prev|next)/g) || []).join('+') || '-').join(' '));
    out('runs grouped', await runs());
    await t.ev(() => { NTR.api.settings().ovBubGroup = 'each'; NTR.api.look.restyle(); });
    await sleep(300);
    out('runs each', await runs());
    await t.ev(() => NTR.api.refreshPins());
    out('runs after refreshPins', await runs());
    await t.ev((combo) => { Object.assign(NTR.api.settings(), combo); SillyTavern.getContext().saveSettingsDebounced(); }, { ...D_COMBOS.freeSend, ...D_COMBOS.bubThoughtBorder, ...GAPS, masterEnabled: true });
    await sleep(2500);
    await t.page.reload();
    await t.page.waitForFunction(() => window.NTR?.api && document.getElementById('cb_node_toggle'), null, { timeout: 60000 });
    await sleep(1500);
    css.reloaded = await read();
    const h = (x) => require('crypto').createHash('sha1').update(x).digest('hex').slice(0, 12);
    for (const [k, v] of Object.entries(css)) out('css', k, v.length, h(v));
    require('fs').writeFileSync(process.env.D_CSS_OUT || '/dev/null', Object.entries(css).map(([k, v]) => `===== ${k}\n${v}`).join('\n'));
  });
  await session('T decor page controls', { settings: { ovEnabled: true, ovBubOn: true } }, async (t) => {
    await t.menu('display');
    const st = () => t.ev(() => { const s = NTR.api.settings(); return ['ovEnabled', 'ovBubTail', 'ovBubAlign', 'ovBubInk', 'ovAiRound', 'ovAiBgColor'].map((k) => `${k}=${s[k]}`).join(' ') + ' preset=' + (document.querySelector('#cb_modal_overlay input[name="cbr_obubpreset"]:checked')?.value || ''); });
    out('start', await st());
    await t.mark();
    await t.ev(() => { const r = document.querySelector('#cb_modal_overlay input[name="cbr_obubpreset"][value="comic"]'); r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); });
    await sleep(600);
    out('picked comic', await st(), 'menu redrawn:', !(await t.state()).sameMenu);
    await t.ev(() => { const r = document.querySelector('#cb_modal_overlay input[name="cbr_oovbubtail"][value="thought"]'); r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); });
    await sleep(300);
    out('changed tail', await st());
    await t.ev(() => { const c = document.querySelector('#m_ov_enable'); c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true })); });
    await sleep(300);
    out('page off', await st(), await t.ev(() => document.querySelector('.ntr_navi[data-page="display"]').classList.contains('ntr_off')));
  });

  // UI Decor without decor.js (failed, or late): its own CSS gone, Blur and Shadow gone, the Free send bar's corners not
  // following it, no bubble runs; Layout's width and gaps and Names Hide still applied.
  const DF = { ovEnabled: true, ovPanelBgOn: true, ovPanelBg: 'clear', ovBlurOn: true, ovBlur: 6, ovShadowOn: true, ovShadow: 4, ovShapeOn: true, ovShape: 'rounded', ovRound: 16,
    ovPanelBorderOn: true, ovPanelBorder: 'line', ovBubOn: true, ovBubAlign: 'sides', ovBubGroup: 'group', layEnabled: true, laySend: 'free', ovWidthOn: true, ovWidth: 60,
    ovMesGapOn: true, ovMesGap: 18, avatarEnabled: true, ovNamesOn: false };
  const dfInfo = () => {
    const css = document.getElementById('aw_dynamic_style')?.textContent || '';
    const lay = document.getElementById('ntr_layout_style')?.textContent || '';
    const pg = document.querySelector('#cb_modal_overlay .ntr_page[data-page="display"]');
    return {
      loaded: !!window.NTR.decor,
      clearPanel: /#chat, #sheld, #chat-container, \.chat-container \{ background: transparent/.test(css),
      shape: /body #top-bar, body \.drawer-content/.test(css), blur: /--blurStrength/.test(css), width: /--sheldWidth/.test(css),
      gap: /#chat \.mes:not\(\.last_mes\)/.test(css), freeJoin: /body #chat \{ border-radius/.test(lay),
      bubRuns: document.querySelectorAll('#chat .ntr_bub_prev, #chat .ntr_bub_next').length,
      note: pg?.querySelector(':scope > .ntr_pnote')?.textContent.trim().slice(0, 40) ?? null, sw: !!pg?.querySelector('#m_ov_enable'),
    };
  };
  const addMsgs = (t) => t.ev(() => {
    const c = SillyTavern.getContext();
    for (const [x, user] of [['Two', false], ['Three', false]]) { const m = { name: user ? c.name1 : c.name2, is_user: user, is_system: false, send_date: Date.now(), mes: x, extra: {} }; c.chat.push(m); c.addOneMessage(m); }
  });
  for (const [label, opts, rel] of [['failed at once', { abort: ['decor'] }, []], ['late', { seq: { decor: ['hold'] } }, [['decor', 'ok']]], ['loaded', {}, []]]) {
    if (label !== 'loaded' && process.env.NO_DECOR_JS) continue;
    await session(`U decor ${label}`, { settings: DF, ...opts }, async (t) => {
      await addMsgs(t);
      await sleep(800);
      await t.menu('display');
      await t.newTheme();
      await t.nav('display');
      await t.mark();
      await t.ev(() => NTR.api.refreshPins());
      await t.show('at start', dfInfo);
      for (const [n, how] of rel) { t.release(n, how); await sleep(2000); await t.show(`after ${n} ${how}`, dfInfo); }
    });
  }

  await session('H everything loaded: menu HTML', {}, async (t) => {
    await t.menu();
    await sleep(2500);
    const html = await t.ev(() => {
      const ov = document.getElementById('cb_modal_overlay');
      const styles = [...document.querySelectorAll('style')].filter((s) => /ntr|cb_/i.test(s.id)).map((s) => s.id + ':' + s.textContent).join('\n');
      return { menu: ov.innerHTML.replace(/2\.69\.\d+/g, 'V'), styles: styles.replace(/2\.69\.\d+/g, 'V') };
    });
    require('fs').writeFileSync(process.env.HTML_OUT || '/dev/null', html.menu + '\n=====STYLES=====\n' + html.styles);
    const h = (s) => require('crypto').createHash('sha1').update(s).digest('hex').slice(0, 12);
    out('menu html', html.menu.length, h(html.menu), 'styles', html.styles.length, h(html.styles));
  });

  await browser.close();
})();
