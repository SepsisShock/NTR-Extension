// The Themes page comes from themes.js, which works from what the core shares. Saving and applying themes still needs
// a run in SillyTavern.
import test from 'node:test';
import assert from 'node:assert/strict';
import { api, load } from './env.mjs';

await load('themes');

test('the Themes page lists the saved themes A to Z after Default Look, with their names escaped', () => {
  const s = api.settings();
  s.themes = [{ id: 'th_a', name: 'theme 10', data: {} }, { id: 'th_b', name: '<b>x</b>', data: {} }, { id: 'th_c', name: 'Theme 9', data: {} }];
  const html = window.NTR.themes.sectionHtml(s);
  for (const id of ['m_t_new', 'm_t_upd', 'm_t_imp']) assert.match(html, new RegExp(`id="${id}"`));
  assert.deepEqual([...html.matchAll(/class="ntr_trow[^"]*" data-id="([^"]*)"/g)].map((m) => m[1]), ['', 'th_b', 'th_c', 'th_a']);
  assert.match(html, /&lt;b&gt;x&lt;\/b&gt;/);
  assert.doesNotMatch(html, /<b>x<\/b>/);
  s.themes = [];
});

test('Default Look puts the look settings back and picks no theme', () => {
  const s = api.settings();
  Object.assign(s, { ovFontOn: !api.DEFAULTS.ovFontOn, themes: [{ id: 'th_a', name: 'A', data: {} }], themeActive: 'th_a' });
  api.resetLook();
  assert.equal(s.ovFontOn, api.DEFAULTS.ovFontOn);
  assert.equal(s.themeActive, null);
  s.themes = [];
});
