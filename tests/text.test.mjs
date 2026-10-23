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
