// Without themes.js, the menu still opens and the core knows the module failed (scenario W checks the page's note).
// Saved themes stay in the settings, and the core still brings old ones up to date. In Node the core never finds themes.js, so it's missing here.
import test from 'node:test';
import assert from 'node:assert/strict';
import { api, reloadSettings } from './env.mjs';

test('the menu opens without themes.js', async () => {
  assert.equal(window.NTR.themes, undefined);
  api.openMenu();
  assert.equal(await api.loadModule('themes'), null);
  assert.notEqual(api.moduleError('themes'), '');
});

test('without themes.js, old saved themes are still brought up to date', () => {
  const s = reloadSettings({ themeLookV6: false, themes: [{ id: 'th_old', name: 'Old', data: { display: { ovFontOn: true, ovFont: 1.2 } } }] });
  const [t] = s.themes;
  assert.deepEqual(t.data.text, { ovFontOn: true, ovFont: 1.2 });
  assert.equal(t.data.display.ovFont, undefined);
  assert.equal(s.themeLookV6, true);
});
