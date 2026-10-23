// Text Formatting comes from text.js, which the core loads before it starts. These check that it arrives in time and
// builds its CSS from what the core shares; what it looks like on screen still needs a run in SillyTavern.
import test from 'node:test';
import assert from 'node:assert/strict';
import { api } from './env.mjs';

test('the core loads Text Formatting before it starts', () => {
  assert.ok(window.NTR.text, 'text.js was not loaded by the core');
  assert.equal(window.NTR.text.version, api.VERSION);
  assert.equal(api.moduleError('text'), '');
});

test('Text Formatting builds its CSS, and none while its page is off', () => {
  const s = api.settings();
  Object.assign(s, { tfEnabled: true, tfNameColorOn: true, tfNameColor: 'rgba(255, 0, 0, 1)', tfNameFxOn: true, tfNameFx: 'glow', tfNameFxStr: 3,
    tfUserAlignOn: true, tfUserAlign: 'center', tfPlatePosOn: true, tfPlatePos: 'edge', tfPlateBgOn: true, tfPlateBg: 'rgba(0, 0, 0, 1)' });
  const css = window.NTR.text.css(s);
  // A name's color and its Glow, which takes the text's own color.
  assert.match(css, /\.mes \.name_text \{ color: rgba\(255, 0, 0, 1\) !important; text-shadow: 0 0 6px currentColor, 0 0 3px currentColor !important; \}/);
  // A nameplate on the top edge, outside Reader Mode's Book.
  assert.match(css, /body:not\(\.ntr_book\) #chat \.mes\[is_user="true"\] \.ch_name \.name_text \{ line-height: 1\.3 !important;/);
  // Centered text, with lists, tables and code left as SillyTavern has them.
  assert.match(css, /\.mes\[is_user="true"\] \.mes_text :is\(ul, ol, table, pre, textarea\) \{ text-align: start !important; \}/);
  s.tfEnabled = false;
  assert.equal(window.NTR.text.css(s), '');
});

test('Glow and Shadow reach the text inside messages, but not code, tables or Speech Bubbles\' Dark and Light text', () => {
  const s = api.settings();
  Object.assign(s, { masterEnabled: true, tfEnabled: true, tfAiFxOn: true, tfAiFx: 'shadow', tfAiFxStr: 3, tfUserFxOn: true, tfUserFx: 'outline', ovBubOn: false });
  let css = window.NTR.text.css(s);
  const inner = (box) => `${box} :not(:is(pre, table, textarea), :is(pre, table, textarea) *) { text-shadow: inherit !important; }`;
  assert.ok(css.includes(inner('.mes[is_user="false"] .mes_text')));
  assert.ok(css.includes(inner('#cb_node .cb_n_text')));
  assert.ok(css.includes('body:not(.ntr_book) .mes[is_user="false"] .mes_text > *::after { text-shadow: 0 0 calc(var(--shadowWidth) * 1px) var(--SmartThemeShadowColor) !important; }'));
  // Outline passes down by itself, so it's only taken off code and tables.
  assert.ok(css.includes('.mes[is_user="true"] .mes_text :is(pre, table, textarea) { -webkit-text-stroke: 0 !important; }'));
  assert.ok(!css.includes(inner('.mes[is_user="true"] .mes_text')));
  Object.assign(s, { ovEnabled: true, ovBubOn: true, ovBubInk: 'dark' });
  css = window.NTR.text.css(s);
  assert.ok(!css.includes(inner('.mes[is_user="false"] .mes_text')));
  assert.ok(css.includes(inner('#cb_node .cb_n_text')), 'the Visual Novel box has no bubbles');
  Object.assign(s, { tfEnabled: false, tfAiFxOn: false, tfUserFxOn: false, ovEnabled: false, ovBubOn: false, ovBubInk: 'auto' });
});

test('Gradient and Shimmer paint the text blocks, with Shimmer only on the newest messages', () => {
  const s = api.settings();
  const reset = { tfEnabled: false, tfNameFxOn: false, tfAiFxOn: false, tfUserFxOn: false, tfAiQuoteOn: false, tfPlateBgOn: false, tfPlateImg: '', ovEnabled: false, ovBubOn: false, ovBubInk: 'auto' };
  Object.assign(s, { masterEnabled: true, tfEnabled: true, tfAiFxOn: true, tfAiFx: 'gradient', tfAiFxStr: 3, tfAiFxColorOn: false, tfUserFxOn: true, tfUserFx: 'shimmer', tfUserFxStr: 2, tfUserFxColorOn: true, tfUserFxColor: 'rgba(0, 0, 255, 1)' });
  let css = window.NTR.text.css(s);
  const blocks = ':is(p, li, h1, h2, h3, h4, h5, h6):not(li *, pre *, table *)';
  // Gradient on every AI message, to ST's Quote Color, with Glow's rules left out.
  assert.ok(css.includes(`body:not(.ntr_book) .mes[is_user="false"] .mes_text ${blocks} { background-image: linear-gradient(90deg, currentColor, var(--SmartThemeQuoteColor) 84%) !important;`));
  assert.ok(css.includes(`.mes[is_user="false"] .mes_text ${blocks} :not(strong, b, p, ul, ol, li, br, span:not([class], [style])) { -webkit-text-fill-color: currentColor !important; }`));
  assert.ok(!/\.mes\[is_user="false"\] \.mes_text \{[^}]*text-shadow/.test(css));
  assert.ok(css.includes(`#cb_node .cb_n_text { background-attachment: local !important; }`));
  // Shimmer on the newest user message only, playing only without Reduced Motion and while nothing is being written.
  const newest = '#chat > .mes[is_user="true"]:nth-last-child(1 of .mes[is_user="true"]:not([is_system="true"]))';
  assert.ok(css.includes(`body:not(.ntr_book) ${newest} .mes_text ${blocks} { background-image: linear-gradient(100deg, currentColor 47%, rgba(0, 0, 255, 1) 50%, currentColor 53%) !important; background-size: 250% 100% !important;`));
  assert.ok(css.includes(`body:not(.ntr_book):not(.reduced-motion):not([data-generating]) ${newest} .mes_text ${blocks} { animation: ntr_shine_`));
  assert.match(css, /animation: ntr_shine_[ab] 2\.5s ease-in-out 2 !important;/);
  // A changed Shimmer setting switches the keyframes' name, so it plays again; anything else keeps it.
  const shine = () => window.NTR.text.css(s).match(/@keyframes (ntr_shine_[ab])/)[1];
  const was = shine();
  s.tfUserFxStr = 4;
  const now = shine();
  assert.notEqual(now, was);
  s.tfAiFxStr = 4;
  assert.equal(shine(), now);
  s.tfAiFxStr = 3;
  // The part's own Quote Color, when it has one.
  Object.assign(s, { tfAiQuoteOn: true, tfAiQuote: 'rgba(0, 128, 0, 1)' });
  assert.ok(window.NTR.text.css(s).includes('linear-gradient(90deg, currentColor, rgba(0, 128, 0, 1) 84%)'));
  // Speech Bubbles' Dark and Light text turn them off in the chat, but not in the Visual Novel box.
  Object.assign(s, { ovEnabled: true, ovBubOn: true, ovBubInk: 'light' });
  css = window.NTR.text.css(s);
  assert.ok(!css.includes(`.mes[is_user="false"] .mes_text ${blocks} {`));
  assert.ok(css.includes('#cb_node .cb_n_text { background-image:'));
  // An unknown effect draws nothing.
  Object.assign(s, reset, { tfEnabled: true, tfAiFxOn: true, tfAiFx: 'sparkle' });
  css = window.NTR.text.css(s);
  assert.ok(!css.includes('background-clip') && !css.includes('text-shadow') && !css.includes('text-stroke'));
  Object.assign(s, reset);
});

test('Gradient and Shimmer on names keep the Nameplate, and Shimmer plays on the newest name', () => {
  const s = api.settings();
  Object.assign(s, { tfEnabled: true, tfNameFxOn: true, tfNameFx: 'shimmer', tfNameFxStr: 3, tfNameFxColorOn: false, tfPlateBgOn: true, tfPlateBg: 'rgba(0, 0, 0, 1)', tfPlateImg: '', tfNameColorOn: false });
  let css = window.NTR.text.css(s);
  const name = 'body:not(.ntr_book) #chat > .mes:nth-last-child(1 of .mes:not([is_system="true"])) .name_text';
  // A Nameplate color stays under the paint: a second, empty layer keeps it to the whole box.
  assert.ok(css.includes(`${name} { background-image: linear-gradient(100deg,`));
  assert.ok(/, none !important; background-size: 250% 100%, cover !important;[^}]*background-clip: text, border-box !important;/.test(css));
  assert.ok(css.includes('body:not(.reduced-motion):not([data-generating]) #cb_node .cb_n_name.cb_shown { animation:'));
  // A Nameplate picture's place loses its !important under a Shimmer, which would hold the band still.
  s.tfPlateImg = '/user/files/plate.png';
  css = window.NTR.text.css(s);
  assert.ok(!css.includes('background-position: center !important'));
  assert.ok(css.includes(`${name}, #cb_node .cb_n_name { background-position: 0 0, center; }`));
  assert.ok(css.includes('.mes .name_text { background-position: center; }'));
  s.tfPlateImg = '';
  // Without a Nameplate, the Visual Novel tag takes the panel color, a border and the body text color.
  Object.assign(s, { tfNameFx: 'gradient', tfPlateBgOn: false });
  css = window.NTR.text.css(s);
  assert.ok(css.includes('body:not(.ntr_book) .mes .name_text { background-image: linear-gradient(90deg, currentColor, var(--SmartThemeQuoteColor) 84%) !important;'));
  assert.ok(/#cb_node \.cb_n_name \{[^}]*background-color: var\(--SmartThemeBlurTintColor\) !important; color: var\(--SmartThemeBodyColor\) !important; border: 1px solid var\(--SmartThemeBorderColor\) !important;/.test(css));
  assert.ok(!css.includes('@keyframes'));
  Object.assign(s, { tfEnabled: false, tfNameFxOn: false });
});
